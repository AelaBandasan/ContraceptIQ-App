/**
 * On-Device Discontinuation Risk Assessment Service (v4)
 *
 * Runs the hybrid XGBoost + Decision Tree v4 model locally using ONNX Runtime.
 * Enables offline risk assessment without requiring the Flask backend.
 *
 * Architecture:
 *   1. Load flat ONNX models from bundled assets (lazy, singleton)
 *   2. Build 133-dim float32 OHE vector via buildOHEVector()
 *   3. Run XGBoost → get P(discontinue)
 *   4. Apply hybrid upgrade rule with Decision Tree (threshold=0.25, conf_margin=0.05)
 *   5. Return RiskAssessmentResponse (same interface as API)
 *
 * The flat models accept a single FloatTensorType input "float_input" [1, 133],
 * bypassing the onnxruntime-react-native string tensor bug.
 */

import { NativeModules } from 'react-native';
import { Asset } from 'expo-asset';
import { buildOHEVector, validateFeaturesV4 } from '../utils/featureEncoder';
import { createModuleLogger } from '../utils/loggerUtils';
import type { InferenceSession as OrtInferenceSession } from 'onnxruntime-react-native';
import type { RiskAssessmentResponse } from './discontinuationRiskService';

// Conditionally require onnxruntime-react-native to avoid a null.install() crash
// in New Architecture (Bridgeless) mode where NativeModules.Onnxruntime is null
// because OnnxruntimeModule is a legacy bridge module, not a TurboModule.
const _onnxAvailable = NativeModules.Onnxruntime != null;
const { InferenceSession, Tensor } = _onnxAvailable
  ? (require('onnxruntime-react-native') as typeof import('onnxruntime-react-native'))
  : ({ InferenceSession: null, Tensor: null } as unknown as typeof import('onnxruntime-react-native'));

// ============================================================================
// CONFIGURATION (matches hybrid_v4_config.json)
// ============================================================================

const HYBRID_CONFIG = {
    threshold: 0.25,
    conf_margin: 0.05,
    model_version: 'v4-offline',
};

// ============================================================================
// MODEL MANAGEMENT
// ============================================================================

let xgbSession: OrtInferenceSession | null = null;
let dtSession: OrtInferenceSession | null = null;
let modelsLoaded = false;
let loadingPromise: Promise<void> | null = null;

/**
 * Load ONNX models from bundled assets.
 * Lazy singleton — safe to call multiple times.
 */
async function loadModels(): Promise<void> {
    const logger = createModuleLogger('OnDeviceRiskService');

    if (modelsLoaded) return;
    if (loadingPromise) return loadingPromise;

    loadingPromise = (async () => {
        try {
            logger.info('Loading flat ONNX v4 models from assets...');

            const xgbAsset = Asset.fromModule(require('../../assets/models/xgb_high_recall.onnx'));
            const dtAsset = Asset.fromModule(require('../../assets/models/dt_high_recall.onnx'));

            await xgbAsset.downloadAsync();
            await dtAsset.downloadAsync();

            if (!xgbAsset.localUri || !dtAsset.localUri) {
                throw new Error('Failed to download model assets to local storage');
            }

            xgbSession = await InferenceSession.create(xgbAsset.localUri, {
                executionProviders: ['cpu'],
            });

            dtSession = await InferenceSession.create(dtAsset.localUri, {
                executionProviders: ['cpu'],
            });

            modelsLoaded = true;
            logger.info('Flat ONNX v4 models loaded successfully');
        } catch (error) {
            logger.error('Failed to load ONNX models', undefined, { error });
            modelsLoaded = false;
            throw error;
        } finally {
            loadingPromise = null;
        }
    })();

    return loadingPromise;
}

// ============================================================================
// PREDICTION LOGIC
// ============================================================================

/**
 * Assess discontinuation risk using on-device flat ONNX v4 models.
 *
 * Hybrid logic (mirrors Flask backend):
 *   1. XGBoost → P(y=1)
 *   2. HIGH if P >= 0.25
 *   3. Low-confidence band: |P - 0.25| < 0.05
 *   4. If low-confidence AND Decision Tree predicts 1 → upgrade to HIGH
 *
 * @param formData Raw form data (display strings from ObAssessment/GuestAssessment)
 */
export async function assessOffline(
    formData: Record<string, any>,
): Promise<RiskAssessmentResponse> {
    const logger = createModuleLogger('OnDeviceRiskService');

    await loadModels();

    if (!xgbSession || !dtSession) {
        throw new Error('ONNX models not loaded');
    }

    const missing = validateFeaturesV4(formData);
    if (missing.length > 0) {
        logger.warn('Some v4 features missing, using defaults', { missing });
    }

    // Build 133-dim float32 OHE vector
    const oheVec = buildOHEVector(formData);
    logger.debug('OHE vector built', { length: oheVec.length });

    const feed = { float_input: new Tensor('float32', oheVec, [1, oheVec.length]) };

    // XGBoost inference
    const xgbResults = await xgbSession.run(feed);
    const xgbOutputNames = xgbSession.outputNames;

    // Output 0 = labels (int64), Output 1 = probabilities (float32 [N,2])
    let xgbProbability: number;
    if (xgbOutputNames.length >= 2) {
        const probTensor = xgbResults[xgbOutputNames[1]];
        const data = probTensor.data as Float32Array;
        xgbProbability = data.length >= 2 ? Number(data[1]) : Number(data[0]);
    } else {
        const data = xgbResults[xgbOutputNames[0]].data as Float32Array;
        xgbProbability = Number(data[0]);
    }

    // Base prediction
    const xgbPred = xgbProbability >= HYBRID_CONFIG.threshold ? 1 : 0;

    // Hybrid upgrade via Decision Tree
    const isLowConfidence = Math.abs(xgbProbability - HYBRID_CONFIG.threshold) < HYBRID_CONFIG.conf_margin;
    let upgradedByDt = false;
    let hybridPred = xgbPred;

    if (isLowConfidence) {
        const dtResults = await dtSession.run(feed);
        const dtPred = Number(dtResults[dtSession.outputNames[0]].data[0]);

        if (dtPred === 1 && xgbPred === 0) {
            hybridPred = 1;
            upgradedByDt = true;
        }
    }

    const riskLevel = hybridPred === 1 ? 'HIGH' : 'LOW';
    const recommendation =
        riskLevel === 'HIGH'
            ? 'Schedule follow-up counseling session'
            : 'Continue monitoring contraceptive use';

    logger.info('On-device v4 assessment complete', {
        riskLevel,
        xgbProbability: xgbProbability.toFixed(4),
        upgradedByDt,
        isLowConfidence,
    });

    return {
        risk_level: riskLevel as 'LOW' | 'HIGH',
        confidence: Math.round(xgbProbability * 10000) / 10000,
        recommendation,
        xgb_probability: Math.round(xgbProbability * 10000) / 10000,
        upgraded_by_dt: upgradedByDt,
        metadata: {
            model_version: HYBRID_CONFIG.model_version,
            threshold: HYBRID_CONFIG.threshold,
            confidence_margin: HYBRID_CONFIG.conf_margin,
        },
    };
}

/**
 * Check if on-device models are loaded and ready.
 */
export function isModelReady(): boolean {
    return modelsLoaded;
}

/**
 * Pre-load models at app startup for faster first prediction.
 */
export async function preloadModels(): Promise<boolean> {
    try {
        await loadModels();
        return true;
    } catch {
        return false;
    }
}
