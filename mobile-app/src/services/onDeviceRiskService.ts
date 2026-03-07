/**
 * On-Device Discontinuation Risk Assessment Service
 *
 * Runs the hybrid XGBoost + Decision Tree model locally using ONNX Runtime.
 * Enables offline risk assessment without requiring the Flask backend.
 *
 * Architecture:
 *   1. Load ONNX models from bundled assets (lazy, singleton)
 *   2. Encode input features (form data → Float32Array)
 *   3. Run XGBoost → get probability
 *   4. Apply hybrid upgrade rule with Decision Tree
 *   5. Return RiskAssessmentResponse (same interface as API)
 */

import { InferenceSession, Tensor } from 'onnxruntime-react-native';
import { Platform } from 'react-native';
import { Asset } from 'expo-asset';
import { encodeFeatures, validateFeatures } from '../utils/featureEncoder';
import { createModuleLogger } from '../utils/loggerUtils';
import type { RiskAssessmentResponse } from './discontinuationRiskService';

// ============================================================================
// CONFIGURATION (matches hybrid_v3_config.json)
// ============================================================================

const HYBRID_CONFIG = {
    threshold_v3: 0.15,
    conf_margin_v3: 0.2,
    model_version: 'v3-offline',
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
 * This is called lazily on first prediction and cached as singleton.
 */
async function loadModels(): Promise<void> {
    const logger = createModuleLogger('OnDeviceRiskService');

    if (modelsLoaded) return;
    if (loadingPromise) return loadingPromise;

    loadingPromise = (async () => {
        try {
            logger.info('Loading ONNX models from assets...');

            // Load model assets
            const xgbAsset = Asset.fromModule(require('../../assets/models/xgb_high_recall.onnx'));
            const dtAsset = Asset.fromModule(require('../../assets/models/dt_high_recall.onnx'));

            // Download assets to local filesystem (Expo handles this)
            await xgbAsset.downloadAsync();
            await dtAsset.downloadAsync();

            if (!xgbAsset.localUri || !dtAsset.localUri) {
                throw new Error('Failed to download model assets to local storage');
            }

            // Create ONNX inference sessions
            xgbSession = await InferenceSession.create(xgbAsset.localUri, {
                executionProviders: ['cpu'],
            });

            dtSession = await InferenceSession.create(dtAsset.localUri, {
                executionProviders: ['cpu'],
            });

            modelsLoaded = true;
            logger.info('ONNX models loaded successfully');
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
 * Handles different output formats (2D array, map, etc.)
 */
function extractProbability(probOutput: Tensor): number {
    const data = probOutput.data as Float32Array | number[];

    // If the output has shape [1, 2], the class-1 prob is at index 1
    if (probOutput.dims.length === 2 && probOutput.dims[1] === 2) {
        return Number(data[1]);
    }

    // If the output is a flat array of 2 values
    if (data.length === 2) {
        return Number(data[1]);
    }

    // Single value output (probability of class 1 directly)
    return Number(data[0]);
}

/**
 * Extract prediction label from ONNX output tensor.
 */
function extractPrediction(predOutput: Tensor): number {
    const data = predOutput.data;
    return Number(data[0]);
}

/**
 * Assess discontinuation risk using on-device ONNX models.
 *
 * Implements the same hybrid prediction logic as the Flask backend:
 * 1. XGBoost predicts probability P(y=1)
 * 2. Base prediction: HIGH if P >= 0.15
 * 3. If low-confidence (|P - 0.15| < 0.2) AND DT predicts 1 → upgrade to HIGH
 * 4. Never downgrade a positive prediction
 *
 * @param formData Raw form data from GuestAssessment or ObAssessment
 * @param clinicalData Optional clinical data (from doctor assessment)
 * @returns Same RiskAssessmentResponse interface as the Flask API
 */
export async function assessOffline(
    formData: Record<string, any>,
    clinicalData?: Record<string, any>,
): Promise<RiskAssessmentResponse> {
    const logger = createModuleLogger('OnDeviceRiskService');

    // Step 1: Ensure models are loaded
    await loadModels();

    if (!xgbSession || !dtSession) {
        throw new Error('ONNX models not loaded');
    }

    // Step 2: Validate and encode features
    const missing = validateFeatures(formData);
    if (missing.length > 0) {
        logger.warn('Some features missing, using defaults', { missing });
    }

    const features = encodeFeatures(formData, clinicalData);
    logger.debug('Features encoded', { featureCount: features.length });

    // Step 3: Create input tensor [1, 26]
    const inputTensor = new Tensor('float32', features, [1, 26]);
    const inputName = xgbSession.inputNames[0];

    // Step 4: XGBoost inference
    const xgbResults = await xgbSession.run({ [inputName]: inputTensor });
    const xgbOutputNames = xgbSession.outputNames;

    // XGBoost typically outputs: [predictions, probabilities]
    let xgbProbability: number;
    if (xgbOutputNames.length >= 2) {
        xgbProbability = extractProbability(xgbResults[xgbOutputNames[1]]);
    } else {
        xgbProbability = extractProbability(xgbResults[xgbOutputNames[0]]);
    }

    // Step 5: Base prediction from XGBoost
    const xgbPred = xgbProbability >= HYBRID_CONFIG.threshold_v3 ? 1 : 0;

    // Step 6: Decision Tree inference (only needed if low-confidence)
    const isLowConfidence =
        Math.abs(xgbProbability - HYBRID_CONFIG.threshold_v3) < HYBRID_CONFIG.conf_margin_v3;

    let dtPred = 0;
    let upgradedByDt = false;
    let hybridPred = xgbPred;

    if (isLowConfidence) {
        const dtInputName = dtSession.inputNames[0];
        const dtResults = await dtSession.run({ [dtInputName]: inputTensor });
        dtPred = extractPrediction(dtResults[dtSession.outputNames[0]]);

        // Upgrade-only rule: if low-confidence AND DT predicts 1, upgrade to 1
        if (dtPred === 1 && xgbPred === 0) {
            hybridPred = 1;
            upgradedByDt = true;
        }
    }

    // Step 7: Build response
    const riskLevel = hybridPred === 1 ? 'HIGH' : 'LOW';
    const recommendation =
        riskLevel === 'HIGH'
            ? 'Schedule follow-up counseling session'
            : 'Continue monitoring contraceptive use';

    logger.info('On-device assessment complete', {
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
            threshold: HYBRID_CONFIG.threshold_v3,
            confidence_margin: HYBRID_CONFIG.conf_margin_v3,
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
 * Pre-load models (call during app startup for faster first prediction).
 */
export async function preloadModels(): Promise<boolean> {
    try {
        await loadModels();
        return true;
    } catch {
        return false;
    }
}
