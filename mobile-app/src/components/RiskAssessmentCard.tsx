/**
 * Risk Assessment Card Component
 *
 * Displays discontinuation risk results with a clean 3-part hierarchy:
 * 1. Status — Color-coded risk badge (LOW / HIGH)
 * 2. Metric — Exact XGBoost discontinuation probability
 * 3. Key Factors — Plain-language reasons derived from patient data
 */

import React from "react";
import { View, Text, StyleSheet, ViewStyle } from "react-native";
import { colors as themeColors } from "../theme";
import SIGNED_SHAP_DATA from "../../assets/models/risk_factors_v4_signed.json";

// ============================================================================
// TYPES
// ============================================================================

export interface RiskAssessmentCardProps {
  riskLevel: "LOW" | "HIGH";
  confidence: number; // 0-1 (model certainty)
  probability: number; // 0-1 (discontinuation likelihood)
  recommendation: string;
  contraceptiveMethod?: string;
  keyFactors?: string[]; // Plain-language factors explaining the result
  upgradedByDt?: boolean; // Whether Decision Tree upgraded the prediction
  mecCategory?: 1 | 2 | 3 | 4;
  priceRange?: string; // Price range from contraceptiveData
  onPress?: () => void;
  style?: ViewStyle;
}

// ============================================================================
// DESIGN SYSTEM
// ============================================================================

const COLORS = {
  background: "#FFFFFF",
  surface: "#F8FAFC",
  primary: "#E45A92",
  textPrimary: "#0F172A",
  textSecondary: "#6B7280",
  textMuted: "#9CA3AF",
  border: "#E5E7EB",
  success: themeColors.success,
  successBg: "#F0FDF4",
  successBorder: themeColors.success,
  error: themeColors.error,
  errorBg: "#FEF2F2",
  errorBorder: themeColors.error,
  warning: themeColors.warning,
  warningDark: themeColors.warningDark,
  warningBg: "#FFFBEB",
};

const RADIUS = { sm: 4, md: 8, lg: 12, xl: 16, full: 9999 };

// ============================================================================
// COMPONENT
// ============================================================================

export const RiskAssessmentCard: React.FC<RiskAssessmentCardProps> = ({
  riskLevel,
  confidence,
  probability,
  recommendation,
  contraceptiveMethod,
  keyFactors = [],
  upgradedByDt,
  mecCategory,
  priceRange,
  onPress,
  style,
}) => {
  const isHighRisk = riskLevel === "HIGH";
  const confPercent = (confidence * 100).toFixed(1);
  const probPercent = (probability * 100).toFixed(1);
  const progressPercent = Math.max(0, Math.min(100, probability * 100));

  const riskAccent = isHighRisk ? COLORS.error : COLORS.success;
  const riskBadgeBg = isHighRisk ? COLORS.errorBg : COLORS.successBg;
  const mecAccent =
    mecCategory === 1
      ? COLORS.success
      : mecCategory === 2
        ? COLORS.warning
        : mecCategory === 3
          ? COLORS.warningDark
          : mecCategory === 4
            ? COLORS.error
            : null;

  const theme = {
    bg: COLORS.background,
    border: COLORS.border,
    accent: riskAccent,
    badgeBg: "#F8FAFC",
  };

  return (
    <View
      style={[styles.container, { backgroundColor: theme.bg, borderColor: theme.border }, style]}
      onTouchEnd={onPress}
    >
      <View style={[styles.topAccent, { backgroundColor: theme.accent }]} />

      {/* ── PART 1: STATUS + CONFIDENCE ── */}
      <View style={styles.statusRow}>
        <View style={styles.headerRiskWrap}>
          <Text style={styles.badgeEmoji}>{isHighRisk ? "⚠" : "✓"}</Text>
          <Text style={[styles.headerRiskText, { color: theme.accent }]}>
            {isHighRisk ? "High Risk" : "Low Risk"}
          </Text>
        </View>
        <Text style={styles.headerConfidenceText}>
          Confidence <Text style={[styles.headerConfidenceValue, { color: theme.accent }]}>{confPercent}%</Text>
        </Text>
      </View>

      {/* ── PART 2: THE METRIC ── */}
      <View style={styles.metricContainer}>
        <Text style={[styles.metricValue, { color: theme.accent }]}>
          {probPercent}%
        </Text>
        <Text style={styles.metricLabel}>
          Probability of Discontinuation
        </Text>
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              { width: `${progressPercent}%`, backgroundColor: theme.accent },
            ]}
          />
        </View>
      </View>

      {/* Method & Price */}
      {(contraceptiveMethod || priceRange) && (
        <View style={styles.infoRow}>
          {contraceptiveMethod && (
            <View style={{ flex: 1, alignItems: "center" }}>
              <Text style={styles.infoLabel}>Method</Text>
              <Text style={styles.infoValue}>{contraceptiveMethod}</Text>
            </View>
          )}
          {priceRange && (
            <View style={{ flex: 1, alignItems: "center", borderLeftWidth: contraceptiveMethod ? 1 : 0, borderLeftColor: COLORS.border }}>
              <Text style={styles.infoLabel}>Price Range</Text>
              <Text style={styles.infoValue}>{priceRange}</Text>
            </View>
          )}
        </View>
      )}

      {/* ── PART 3: KEY FACTORS ("The Why") ── */}
      {keyFactors.length > 0 && (
        <View style={styles.factorsContainer}>
          <Text style={styles.factorsTitle}>Key Factors</Text>
          {keyFactors.map((factor, idx) => (
            <View key={idx} style={styles.factorRow}>
              <Text style={styles.factorBullet}>•</Text>
              <Text style={styles.factorText}>{factor}</Text>
            </View>
          ))}
        </View>
      )}

      {/* DT Upgrade Indicator */}
      {upgradedByDt && (
        <View style={[styles.dtBadge, { backgroundColor: COLORS.warningBg }]}>
          <Text style={{ fontSize: 11, color: COLORS.warning, fontWeight: '600' }}>
            ⬆ Risk upgraded by Decision Tree (borderline case)
          </Text>
        </View>
      )}
    </View>
  );
};

// ============================================================================
// FACTOR GENERATOR — call this from the assessment screen
// ============================================================================

// Display value → training value maps (mirrors featureEncoder.ts for OB form inputs)
const _DISPLAY_TO_TRAINING: Record<string, Record<string, string>> = {
  PATTERN_USE: {
    // ── Exact form display strings from ObAssessment.tsx FORM_FIELDS ──────────
    "Current/Regular user":             "1",              // highest SHAP (4.092)
    "Irregular/Occasional user":        "Intermittent",
    "New user (first time)":            "New user",
    "Stopped using (within 12 months)": "Stopped recently",
    // ── Legacy display strings (backward-compat with older saved records) ──────
    "Regular/consistent user":          "1",
    "Irregular/inconsistent user":      "Intermittent",
    "New user (never used before)":     "New user",
    "Previously used (stopped within 12 months)": "Stopped recently",
    "Current user":                     "1",
    "Recent user (stopped within 12 months)": "Stopped recently",
    "Past user (stopped >12 months ago)": "Intermittent",  // NOT "Stopped recently" — matches featureEncoder.ts
    // ── Pass-through (value is already the training string) ──────────────────
    "1": "1", "2": "Stopped recently", "3": "Intermittent", "4": "New user",
    "Consistent": "Consistent", "Intermittent": "Intermittent",
    "Stopped recently": "Stopped recently", "New user": "New user",
  },
  SMOKE_CIGAR: {
    "Never": "No", "Former smoker": "No",
    "Occasional smoker": "Yes", "Current daily": "Yes",
    "No": "No", "Yes": "Yes", "0": "No", "1": "Yes",
  },
  HOUSEHOLD_HEAD_SEX: {
    "Male": "Male", "Female": "Female",
    "Shared/Both": "Male", "Others": "Male",
    "1": "Male", "2": "Female",
  },
  DESIRE_FOR_MORE_CHILDREN: {
    "Wants more children": "Yes",
    "Wants no more children": "No",
    "Undecided/ambivalent": "Undecided",
    "Not Sure": "Undecided",
    "Sterilised (self or partner)": "No",
    "Not applicable": "No",
    "Yes": "Yes", "No": "No", "Undecided": "Undecided",
  },
  ETHNICITY: {
    "Tagalog": "Tagalog", "Ilocano": "Ilocano",
    "Cebuano": "Bisaya", "Bisaya/Cebuano": "Bisaya", "Bisaya": "Bisaya",
    "Hiligaynon/Ilonggo": "Others", "Bikol/Bicol": "Bicolano",
    "Bicolano": "Bicolano", "Waray": "Others", "Kapampangan": "Others",
    "Pangasinan": "Others", "Other Filipinos": "Others", "Other ethnicity": "Others",
  },
  CONTRACEPTIVE_METHOD: {
    "Pills": "Pills", "Pill": "Pills",
    "Copper IUD": "IUD", "Intrauterine Device (IUD)": "IUD", "IUD": "IUD",
    "Injectable": "Injectables", "Injectables": "Injectables",
    "Implant": "Implants", "Implants": "Implants",
    "Condom": "Condom", "Withdrawal": "Withdrawal",
    "Female sterilisation": "Withdrawal", "Male sterilisation": "Withdrawal",
    "NFP/Periodic abstinence": "Withdrawal",
  },
};

// OB-readable labels for feature names
const _FEAT_LABELS: Record<string, string> = {
  PATTERN_USE: "Use pattern",
  SMOKE_CIGAR: "Smoking status",
  HOUSEHOLD_HEAD_SEX: "Household head",
  DESIRE_FOR_MORE_CHILDREN: "More children",
  ETHNICITY: "Ethnicity",
  CONTRACEPTIVE_METHOD: "Proposed method",
  HUSBAND_AGE: "Partner age",
  AGE: "Patient age",
  PARITY: "No. of children",
};

// Training value → short display for OB readability
const _VAL_LABELS: Record<string, Record<string, string>> = {
  PATTERN_USE: {
    "1": "regular use", "Consistent": "consistent use",
    "Intermittent": "irregular/intermittent use",
    "Stopped recently": "stopped recently",
    "New user": "new user",
  },
  SMOKE_CIGAR: { "No": "non-smoker", "Yes": "smoker" },
  HOUSEHOLD_HEAD_SEX: { "Male": "male-headed", "Female": "female-headed" },
  DESIRE_FOR_MORE_CHILDREN: {
    "Yes": "wants more children",
    "No": "no more children",
    "Undecided": "undecided",
  },
  CONTRACEPTIVE_METHOD: {
    "Pills": "pills", "IUD": "IUD", "Injectables": "injectables",
    "Implants": "implants", "Condom": "condom", "Withdrawal": "withdrawal",
  },
};

/**
 * Generate OB-readable directional key factors using signed per-value SHAP.
 *
 * Each returned string is formatted as:
 *   "↑ Use pattern: irregular use — raises discontinuation risk"
 *   "↓ Smoking status: non-smoker — lowers discontinuation risk"
 *
 * Sign of SHAP (log-odds space):
 *   positive → this patient feature pushes risk UP from baseline
 *   negative → this patient feature pushes risk DOWN from baseline
 *
 * Returns top 4 factors by |SHAP| magnitude, noise-filtered.
 */
export function generateKeyFactors(formData: Record<string, any>, riskLevel: 'LOW' | 'HIGH'): string[] {
  const shapData = SIGNED_SHAP_DATA as {
    baseline_log_odds: number;
    baseline_probability: number;
    features: Record<string, number>;
  };
  const featureMap = shapData.features;

  type Factor = { label: string; shap: number };
  const factors: Factor[] = [];

  // ── Categorical features ──────────────────────────────────────────────────
  const CAT_FEATS = [
    "PATTERN_USE", "SMOKE_CIGAR", "HOUSEHOLD_HEAD_SEX",
    "DESIRE_FOR_MORE_CHILDREN", "ETHNICITY", "CONTRACEPTIVE_METHOD",
  ];

  for (const feat of CAT_FEATS) {
    const displayVal = formData[feat];
    if (displayVal == null || displayVal === "") continue;

    const trainingMap = _DISPLAY_TO_TRAINING[feat];
    const trainingVal = trainingMap
      ? (trainingMap[String(displayVal)] ?? String(displayVal))
      : String(displayVal);

    const shapVal = featureMap[`cat__${feat}_${trainingVal}`];
    if (shapVal == null) continue;

    const featLabel = _FEAT_LABELS[feat] || feat;
    const valLabel = _VAL_LABELS[feat]?.[trainingVal] ?? String(displayVal).toLowerCase();
    factors.push({ label: `${featLabel}: ${valLabel}`, shap: shapVal });
  }

  // ── HUSBAND_AGE (bucketed categorical in model) ────────────────────────────
  if (formData.HUSBAND_AGE != null && formData.HUSBAND_AGE !== "") {
    const ageNum = Math.round(parseFloat(String(formData.HUSBAND_AGE)));
    if (!isNaN(ageNum)) {
      const shapVal = featureMap[`cat__HUSBAND_AGE_${ageNum}`];
      if (shapVal != null) {
        factors.push({ label: `Partner age (${ageNum})`, shap: shapVal });
      }
    }
  }

  // ── Numeric features ──────────────────────────────────────────────────────
  if (formData.AGE != null && formData.AGE !== "") {
    const shapVal = featureMap["num__AGE"];
    if (shapVal != null) {
      factors.push({ label: `Patient age (${formData.AGE})`, shap: shapVal });
    }
  }
  if (formData.PARITY != null && formData.PARITY !== "") {
    const shapVal = featureMap["num__PARITY"];
    if (shapVal != null) {
      factors.push({ label: `No. of children (${formData.PARITY})`, shap: shapVal });
    }
  }

  // ── Sort by |SHAP|, filter noise, take top 4 ─────────────────────────────
  const top = factors
    .filter(f => Math.abs(f.shap) > 0.005)
    .sort((a, b) => Math.abs(b.shap) - Math.abs(a.shap))
    .slice(0, 4);

  if (top.length === 0) {
    return [
      riskLevel === 'HIGH'
        ? 'Overall profile suggests higher likelihood of discontinuation'
        : 'Overall profile suggests good potential for continued use',
    ];
  }

  return top.map(f => {
    const arrow = f.shap > 0 ? '↑' : '↓';
    const direction = f.shap > 0 ? 'raises discontinuation risk' : 'lowers discontinuation risk';
    return `${arrow} ${f.label} — ${direction}`;
  });
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    borderWidth: 1.5,
    borderRadius: RADIUS.xl,
    paddingHorizontal: 16,
    paddingBottom: 14,
    marginVertical: 10,
    overflow: "hidden",
  },
  topAccent: {
    height: 6,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    marginHorizontal: -16,
    marginBottom: 12,
  },

  // Part 1: Status
  statusRow: {
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerRiskWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: RADIUS.full,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  badgeEmoji: {
    fontSize: 15,
    marginRight: 6,
  },
  headerRiskText: {
    fontSize: 15,
    fontWeight: "700",
  },
  headerConfidenceText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: "600",
  },
  headerConfidenceValue: {
    fontSize: 13,
    fontWeight: "800",
  },
  statusMetaWrap: {
    alignItems: "flex-end",
    gap: 6,
  },
  mecMiniBadge: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  mecMiniBadgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
  },

  // Part 2: Metric
  metricContainer: {
    alignItems: "center",
    paddingTop: 40,
    marginBottom: 5,
  },
  metricValue: {
    fontSize: 40,
    fontWeight: "800",
    letterSpacing: -1,
  },
  metricLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#6B7280",
    marginTop: 2,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  progressTrack: {
    marginTop: 10,
    width: "90%",
    height: 8,
    borderRadius: 999,
    backgroundColor: "#E5E7EB",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
  },

  // Method
  infoRow: {
    backgroundColor: "#FFFFFF",
    borderRadius: RADIUS.lg,
    padding: 12,
    marginBottom: 10,
    alignItems: "center",
  },
  infoLabel: {
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginBottom: 4,
    textAlign: "center",
  },
  infoValue: {
    fontSize: 16,
    color: COLORS.textPrimary,
    fontWeight: "700",
    textAlign: "center",
  },

  // Part 3: Key Factors
  factorsContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: RADIUS.lg,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  factorsTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#6B7280",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  factorRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  factorBullet: {
    fontSize: 13,
    color: "#9CA3AF",
    marginRight: 8,
    marginTop: 1,
  },
  factorText: {
    fontSize: 13.5,
    color: "#374151",
    fontWeight: "500",
    lineHeight: 18,
    flex: 1,
  },

  // Recommendation
  recommendationContainer: {
    marginBottom: 12,
    padding: 12,
    borderRadius: RADIUS.lg,
    backgroundColor: "#F8FAFC",
  },
  recommendationLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6B7280",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  recommendationValue: {
    fontSize: 14,
    color: "#0F172A",
    fontWeight: "600",
  },

  // DT badge
  dtBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.md,
    marginBottom: 12,
  },

  // Disclaimer
  disclaimer: {
    fontSize: 12,
    color: "#9CA3AF",
    lineHeight: 16,
    fontStyle: "italic",
  },
});

export default RiskAssessmentCard;
