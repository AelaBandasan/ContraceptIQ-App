/**
 * On-Device Discontinuation Risk Assessment Service (v4)
 *
 * Runs the hybrid XGBoost + Decision Tree v4 model locally using ONNX Runtime.
 * Enables offline risk assessment without requiring the Flask backend.
 *
 * Architecture:
 *   1. Load ONNX models from bundled assets (lazy, singleton)
 *   2. Encode 9 input features via encodeFeaturesV4 (string + float32 per-column tensors)
 *   3. Run XGBoost → get P(discontinue)
 *   4. Apply hybrid upgrade rule with Decision Tree (threshold=0.25, conf_margin=0.05)
 *   5. Return RiskAssessmentResponse (same interface as API)
 */

import { InferenceSession, Tensor } from 'onnxruntime-react-native';
import { Asset } from 'expo-asset';
import { encodeFeaturesV4, validateFeaturesV4 } from '../utils/featureEncoder';
import { createModuleLogger } from '../utils/loggerUtils';
import type { RiskAssessmentResponse } from './discontinuationRiskService';

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

let xgbSession: InferenceSession | null = null;
let dtSession: InferenceSession | null = null;
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
            logger.info('Loading ONNX v4 models from assets...');

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
            logger.info('ONNX v4 models loaded successfully');
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
 * Extract class-1 probability from ONNX output tensor.
 */
function extractProbability(probOutput: Tensor): number {
    const data = probOutput.data as Float32Array | number[];

    if (probOutput.dims.length === 2 && probOutput.dims[1] === 2) {
        return Number(data[1]);
    }
    if (data.length === 2) {
        return Number(data[1]);
    }
    return Number(data[0]);
}

/**
 * Extract prediction label from ONNX output tensor.
 */
function extractPrediction(predOutput: Tensor): number {
    return Number(predOutput.data[0]);
}

/**
 * Build the per-column ONNX feed dict for a v4 inference session.
 * XGBoost and Decision Tree share the same 9 named inputs.
 */
function buildFeed(features: ReturnType<typeof encodeFeaturesV4>): Record<string, Tensor> {
    return {
        PATTERN_USE:              new Tensor('string',  [features.PATTERN_USE],              [1, 1]),
        HUSBAND_AGE:              new Tensor('string',  [features.HUSBAND_AGE],              [1, 1]),
        AGE:                      new Tensor('float32', new Float32Array([features.AGE]),     [1, 1]),
        ETHNICITY:                new Tensor('string',  [features.ETHNICITY],                [1, 1]),
        HOUSEHOLD_HEAD_SEX:       new Tensor('string',  [features.HOUSEHOLD_HEAD_SEX],       [1, 1]),
        CONTRACEPTIVE_METHOD:     new Tensor('string',  [features.CONTRACEPTIVE_METHOD],     [1, 1]),
        SMOKE_CIGAR:              new Tensor('string',  [features.SMOKE_CIGAR],              [1, 1]),
        DESIRE_FOR_MORE_CHILDREN: new Tensor('string',  [features.DESIRE_FOR_MORE_CHILDREN], [1, 1]),
        PARITY:                   new Tensor('float32', new Float32Array([features.PARITY]),  [1, 1]),
    };
}

/**
 * Assess discontinuation risk using on-device ONNX v4 models.
 *
 * Hybrid logic (mirrors Flask backend):
 *   1. XGBoost → P(y=1)
 *   2. HIGH if P >= 0.25
 *   3. Low-confidence band: |P - 0.25| < 0.05
 *   4. If low-confidence AND Decision Tree predicts 1 → upgrade to HIGH
 *
 * @param formData Raw form data (display strings) OR numeric-coded data from mapFormDataToApi
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

    const features = encodeFeaturesV4(formData);
    logger.debug('V4 features encoded', { features });

    const feed = buildFeed(features);

    // XGBoost inference
    const xgbResults = await xgbSession.run(feed);
    const xgbOutputNames = xgbSession.outputNames;

    let xgbProbability: number;
    if (xgbOutputNames.length >= 2) {
        xgbProbability = extractProbability(xgbResults[xgbOutputNames[1]]);
    } else {
        xgbProbability = extractProbability(xgbResults[xgbOutputNames[0]]);
    }

    // Base prediction
    const xgbPred = xgbProbability >= HYBRID_CONFIG.threshold ? 1 : 0;

    // Hybrid upgrade via Decision Tree
    const isLowConfidence = Math.abs(xgbProbability - HYBRID_CONFIG.threshold) < HYBRID_CONFIG.conf_margin;
    let upgradedByDt = false;
    let hybridPred = xgbPred;

    if (isLowConfidence) {
        const dtResults = await dtSession.run(feed);
        const dtPred = extractPrediction(dtResults[dtSession.outputNames[0]]);

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
