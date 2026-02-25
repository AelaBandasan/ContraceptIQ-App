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
  success: "#22C55E",
  successBg: "#F0FDF4",
  successBorder: "#BBF7D0",
  error: "#EF4444",
  errorBg: "#FEF2F2",
  errorBorder: "#FECACA",
  warning: "#F59E0B",
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
  onPress,
  style,
}) => {
  const isHighRisk = riskLevel === "HIGH";
  const prob = (confidence * 100).toFixed(1);

  const theme = isHighRisk
    ? { bg: COLORS.errorBg, border: COLORS.errorBorder, accent: COLORS.error, badgeBg: '#FEE2E2' }
    : { bg: COLORS.successBg, border: COLORS.successBorder, accent: COLORS.success, badgeBg: '#DCFCE7' };

  return (
    <View
      style={[styles.container, { backgroundColor: theme.bg, borderColor: theme.border }, style]}
      onTouchEnd={onPress}
    >
      {/* ── PART 1: STATUS BADGE ── */}
      <View style={styles.statusRow}>
        <View style={[styles.badge, { backgroundColor: theme.badgeBg }]}>
          <Text style={{ fontSize: 16, marginRight: 6 }}>
            {isHighRisk ? "⚠️" : "🟢"}
          </Text>
          <Text style={[styles.badgeText, { color: theme.accent }]}>
            {isHighRisk ? "High Risk" : "Low Risk"}
          </Text>
          <Text style={[styles.badgePercent, { color: theme.accent }]}>
            ({prob}%)
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
      </View>

      {/* Method (if provided) */}
      {contraceptiveMethod && (
        <View style={styles.methodPill}>
          <Text style={styles.methodLabel}>Method: </Text>
          <Text style={styles.methodValue}>{contraceptiveMethod}</Text>
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

      {/* Recommendation */}
      <View style={styles.recommendationContainer}>
        <Text style={styles.recommendationLabel}>Recommended Action</Text>
        <Text style={styles.recommendationValue}>{recommendation}</Text>
      </View>

      {/* DT Upgrade Indicator */}
      {upgradedByDt && (
        <View style={[styles.dtBadge, { backgroundColor: COLORS.warningBg }]}>
          <Text style={{ fontSize: 11, color: COLORS.warning, fontWeight: '600' }}>
            ⬆ Risk upgraded by Decision Tree (borderline case)
          </Text>
        </View>
      )}

      {/* Disclaimer */}
      <Text style={styles.disclaimer}>
        This assessment is a supportive tool, not a diagnostic tool. Always
        consult with healthcare providers for personalized medical advice.
      </Text>
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
    if (age >= 35) factors.push(`Age ${age} — older patients may face higher risk`);
    else if (age <= 20) factors.push(`Age ${age} — younger patients may have higher discontinuation rates`);
  }

  // --- Method duration ---
  const months = parseInt(formData['MONTH_USE_CURRENT_METHOD']);
  if (!isNaN(months) && months > 0) {
    if (months >= 6) factors.push(`${months} months on current method — established routine`);
    else factors.push(`Only ${months} month(s) on current method — still adjusting`);
  }

  // --- Side effects ---
  const sideEffects = formData['TOLD_ABT_SIDE_EFFECTS'];
  if (sideEffects?.includes('Yes')) {
    factors.push('Was informed about side effects');
  } else if (sideEffects === 'No') {
    factors.push('Not informed about side effects — may increase risk');
  }

  // --- Pattern of use ---
  const pattern = formData['PATTERN_USE'];
  if (pattern === 'Regular') factors.push('Regular pattern of use');
  else if (pattern === 'Irregular') factors.push('Irregular pattern of use — may indicate adherence issues');

  // --- Previous discontinuation ---
  const lastDiscontinued = formData['LAST_METHOD_DISCONTINUED'];
  if (lastDiscontinued && lastDiscontinued !== 'None') {
    const reason = formData['REASON_DISCONTINUED'];
    factors.push(`Previously discontinued ${lastDiscontinued}${reason ? ` (${reason})` : ''}`);
  } else if (lastDiscontinued === 'None') {
    factors.push('No history of method discontinuation');
  }

  // --- Desire for children ---
  const desire = formData['DESIRE_FOR_MORE_CHILDREN'];
  if (desire === 'Yes') factors.push('Desires more children — may discontinue to conceive');
  else if (desire === 'No') factors.push('Does not desire more children');

  // --- Partner alignment ---
  const husbandDesire = formData['HSBND_DESIRE_FOR_MORE_CHILDREN'];
  if (husbandDesire && desire && husbandDesire !== desire) {
    factors.push('Partner\'s fertility goals differ from patient');
  }

  // --- Smoking ---
  const smoking = formData['SMOKE_CIGAR'];
  if (smoking === 'Current daily') factors.push('Current smoker — may affect hormonal method eligibility');

  // --- Residing with partner ---
  const residingWithPartner = formData['RESIDING_WITH_PARTNER'];
  if (residingWithPartner === 'No') factors.push('Not residing with partner');

  // Limit to top 4 most relevant
  return factors.slice(0, 4);
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    borderWidth: 1.5,
    borderRadius: RADIUS.xl,
    padding: 20,
    marginVertical: 12,
  },

  // Part 1: Status
  statusRow: {
    marginBottom: 16,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
  },
  badgeText: {
    fontSize: 16,
    fontWeight: "700",
  },
  badgePercent: {
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 4,
  },

  // Part 2: Metric
  metricContainer: {
    alignItems: "center",
    paddingVertical: 16,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  metricValue: {
    fontSize: 36,
    fontWeight: "800",
    letterSpacing: -1,
  },
  metricLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6B7280",
    marginTop: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  // Method
  methodPill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    marginBottom: 16,
  },
  methodLabel: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
  },
  methodValue: {
    fontSize: 12,
    color: "#0F172A",
    fontWeight: "700",
  },

  // Part 3: Key Factors
  factorsContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: RADIUS.lg,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  factorsTitle: {
    fontSize: 12,
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
    fontSize: 13,
    color: "#374151",
    fontWeight: "500",
    lineHeight: 18,
    flex: 1,
  },

  // Recommendation
  recommendationContainer: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  recommendationLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#9CA3AF",
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
    fontSize: 11,
    color: "#9CA3AF",
    lineHeight: 16,
    fontStyle: "italic",
  },
});

export default RiskAssessmentCard;
