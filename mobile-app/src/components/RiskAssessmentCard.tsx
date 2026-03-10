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

// ============================================================================
// TYPES
// ============================================================================

export interface RiskAssessmentCardProps {
  riskLevel: "LOW" | "HIGH";
  confidence: number; // 0-1 (discontinuation probability from XGBoost)
  recommendation: string;
  contraceptiveMethod?: string;
  keyFactors?: string[]; // Plain-language factors explaining the result
  upgradedByDt?: boolean; // Whether Decision Tree upgraded the prediction
  mecCategory?: 1 | 2 | 3 | 4;
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
  recommendation,
  contraceptiveMethod,
  keyFactors = [],
  upgradedByDt,
  mecCategory,
  onPress,
  style,
}) => {
  const isHighRisk = riskLevel === "HIGH";
  const prob = (confidence * 100).toFixed(1);
  const progressPercent = Math.max(0, Math.min(100, confidence * 100));

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
        <View style={[styles.headerRiskWrap, { backgroundColor: riskBadgeBg }]}> 
          <Text style={[styles.badgeEmoji, { color: riskAccent }]}>{isHighRisk ? "⚠" : "✓"}</Text>
          <Text style={[styles.headerRiskText, { color: riskAccent }]}> 
            {isHighRisk ? "High Risk" : "Low Risk"}
          </Text>
        </View>
        <View style={styles.statusMetaWrap}>
          {mecCategory ? (
            <View style={[styles.mecMiniBadge, { backgroundColor: mecAccent || COLORS.warning }]}> 
              <Text style={styles.mecMiniBadgeText}>MEC {mecCategory}</Text>
            </View>
          ) : null}
          <Text style={styles.headerConfidenceText}>
            Confidence <Text style={[styles.headerConfidenceValue, { color: theme.accent }]}>{prob}%</Text>
          </Text>
        </View>
      </View>

      {/* ── PART 2: THE METRIC ── */}
      <View style={styles.metricContainer}>
        <Text style={[styles.metricValue, { color: theme.accent }]}> 
          {prob}%
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

      {/* Method (if provided) */}
      {contraceptiveMethod && (
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Method</Text>
          <Text style={styles.infoValue}>{contraceptiveMethod}</Text>
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

      {recommendation ? (
        <View style={styles.recommendationContainer}>
          <Text style={styles.recommendationLabel}>Recommendation</Text>
          <Text style={styles.recommendationValue}>{recommendation}</Text>
        </View>
      ) : null}

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

/**
 * Generate human-readable key factors from the patient's form data.
 * These explain WHY the model predicted LOW or HIGH risk.
 */
export function generateKeyFactors(formData: Record<string, any>, riskLevel: 'LOW' | 'HIGH'): string[] {
  const factors: string[] = [];

  // --- Age ---
  const age = parseInt(formData['AGE']);
  if (!isNaN(age)) {
    if (age >= 35) factors.push(`Age ${age} — may need closer follow-up for continuation support`);
    else if (age <= 20) factors.push(`Age ${age} — younger users may benefit from stronger adherence counseling`);
  }

  // --- Smoking ---
  const smoking = formData['SMOKE_CIGAR'];
  if (smoking === 'Current daily') {
    factors.push('Current daily smoking may affect suitability of some hormonal methods');
  } else if (smoking === 'Never') {
    factors.push('No smoking history supports safer use of several hormonal options');
  }

  // --- Parity ---
  const parity = parseInt(formData['PARITY']);
  if (!isNaN(parity)) {
    if (parity >= 3) factors.push(`Parity ${parity} — long-acting options may improve continuation`);
    else if (parity === 0) factors.push('Nulliparous status may influence method preference and counseling needs');
  }

  // --- Desire for children ---
  const desire = formData['DESIRE_FOR_MORE_CHILDREN'];
  if (desire === 'Wants more children') {
    factors.push('Future fertility plans may favor reversible, short-acting methods');
  } else if (desire === 'Wants no more children') {
    factors.push('No desire for more children may favor highly effective long-acting methods');
  }

  // --- Pattern of use ---
  const pattern = formData['PATTERN_USE'];
  if (pattern === 'Current user') {
    factors.push('Current contraceptive use indicates existing adherence behavior to build on');
  } else if (pattern === 'Recent user (stopped within 12 months)') {
    factors.push('Recent discontinuation may indicate unresolved side-effect or counseling concerns');
  }

  if (factors.length === 0) {
    factors.push(
      riskLevel === 'HIGH'
        ? 'Overall profile suggests higher likelihood of discontinuation without close follow-up'
        : 'Overall profile suggests good potential for continued method use with routine support'
    );
  }

  return factors.slice(0, 2);
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
    fontSize: 12,
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
