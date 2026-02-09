/**
 * Risk Assessment Card Component
 *
 * Displays the results of a discontinuation risk assessment.
 * Shows risk level (LOW/HIGH), confidence score, recommendation, and optional method info.
 * Uses the existing design system from the app (colors, spacing, typography).
 */

import React from "react";
import { View, Text, StyleSheet, ViewStyle, TextStyle } from "react-native";

// ============================================================================
// TYPES
// ============================================================================

export interface RiskAssessmentCardProps {
  riskLevel: "LOW" | "HIGH";
  confidence: number; // 0-1
  recommendation: string;
  contraceptiveMethod?: string;
  onPress?: () => void;
  style?: ViewStyle;
}

// ============================================================================
// DESIGN SYSTEM (from Mobile_App_Complete_Guide.md)
// ============================================================================

const COLORS = {
  background: "#FFFFFF",
  surface: "#F8FAFC",
  primary: "#E45A92",
  primaryDark: "#D3347A",
  textPrimary: "#0F172A",
  textSecondary: "#6B7280",
  textMuted: "#9CA3AF",
  border: "#E5E7EB",
  star: "#FACC15",
  success: "#22C55E", // Low risk
  error: "#EF4444", // High risk
  warning: "#F59E0B",
  lightSuccess: "#ECFDF5", // Light green background
  lightError: "#FEF2F2", // Light red background
};

const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
};

const RADIUS = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};

const TYPOGRAPHY = {
  sectionTitle: { fontSize: 18, fontWeight: "800" as const, letterSpacing: -0.3 },
  cardTitle: { fontSize: 16, fontWeight: "700" as const, letterSpacing: -0.2 },
  body: { fontSize: 14, fontWeight: "500" as const, letterSpacing: -0.1 },
  caption: { fontSize: 12, fontWeight: "500" as const, letterSpacing: 0 },
  small: { fontSize: 11, fontWeight: "400" as const, letterSpacing: 0.2 },
};

// ============================================================================
// COMPONENT
// ============================================================================

export const RiskAssessmentCard: React.FC<RiskAssessmentCardProps> = ({
  riskLevel,
  confidence,
  recommendation,
  contraceptiveMethod,
  onPress,
  style,
}) => {
  // Determine colors based on risk level
  const isHighRisk = riskLevel === "HIGH";
  const badgeBackgroundColor = isHighRisk
    ? COLORS.lightError
    : COLORS.lightSuccess;
  const badgeTextColor = isHighRisk ? COLORS.error : COLORS.success;
  const borderColor = isHighRisk ? COLORS.error : COLORS.success;

  // Format confidence as percentage
  const confidencePercentage = Math.round(confidence * 100);

  return (
    <View
      style={[
        styles.container,
        {
          borderColor: borderColor,
          backgroundColor: isHighRisk ? COLORS.lightError : COLORS.lightSuccess,
        },
        style,
      ]}
      onTouchEnd={onPress}
    >
      {/* Header: Risk Level Badge */}
      <View style={styles.headerContainer}>
        <View style={[styles.badge, { backgroundColor: badgeBackgroundColor }]}>
          <Text
            style={[
              styles.badgeText,
              {
                color: badgeTextColor,
              },
            ]}
          >
            {riskLevel === "HIGH" ? "⚠️ High Risk" : "✓ Low Risk"}
          </Text>
        </View>

        {/* Confidence Percentage */}
        <Text style={[styles.confidenceText, { color: badgeTextColor }]}>
          {confidencePercentage}% confidence
        </Text>
      </View>

      {/* Risk Description */}
      <View style={styles.descriptionContainer}>
        <Text style={styles.descriptionLabel}>Discontinuation Risk</Text>
        <Text style={styles.descriptionValue}>
          {isHighRisk
            ? "High likelihood of stopping or switching methods"
            : "Low likelihood of discontinuation"}
        </Text>
      </View>

      {/* Contraceptive Method (optional) */}
      {contraceptiveMethod && (
        <View style={styles.methodContainer}>
          <Text style={styles.methodLabel}>Method</Text>
          <Text style={styles.methodValue}>{contraceptiveMethod}</Text>
        </View>
      )}

      {/* Recommendation */}
      <View style={styles.recommendationContainer}>
        <Text style={styles.recommendationLabel}>Recommended Action</Text>
        <Text style={styles.recommendationValue}>{recommendation}</Text>
      </View>

      {/* Additional Info */}
      <View style={styles.infoContainer}>
        <Text style={styles.infoText}>
          This assessment is based on the user's demographics, fertility goals,
          and contraceptive history. It should be used as a supportive tool, not
          a diagnostic tool. Always consult with healthcare providers for
          personalized medical advice.
        </Text>
      </View>
    </View>
  );
};

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    borderWidth: 2,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginVertical: SPACING.md,
    backgroundColor: COLORS.surface,
  },

  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.lg,
  },

  badge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
  },

  badgeText: {
    ...TYPOGRAPHY.cardTitle,
    textAlign: "center",
  },

  confidenceText: {
    ...TYPOGRAPHY.caption,
    fontWeight: "600",
  },

  descriptionContainer: {
    marginBottom: SPACING.lg,
    paddingBottom: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  descriptionLabel: {
    ...TYPOGRAPHY.small,
    color: COLORS.textMuted,
    marginBottom: SPACING.xs,
    textTransform: "uppercase",
    fontWeight: "600",
    letterSpacing: 0.5,
  },

  descriptionValue: {
    ...TYPOGRAPHY.body,
    color: COLORS.textPrimary,
    lineHeight: 20,
  },

  methodContainer: {
    marginBottom: SPACING.lg,
    paddingBottom: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  methodLabel: {
    ...TYPOGRAPHY.small,
    color: COLORS.textMuted,
    marginBottom: SPACING.xs,
    textTransform: "uppercase",
    fontWeight: "600",
    letterSpacing: 0.5,
  },

  methodValue: {
    ...TYPOGRAPHY.body,
    color: COLORS.textPrimary,
  },

  recommendationContainer: {
    marginBottom: SPACING.lg,
    paddingBottom: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  recommendationLabel: {
    ...TYPOGRAPHY.small,
    color: COLORS.textMuted,
    marginBottom: SPACING.xs,
    textTransform: "uppercase",
    fontWeight: "600",
    letterSpacing: 0.5,
  },

  recommendationValue: {
    ...TYPOGRAPHY.body,
    color: COLORS.textPrimary,
    fontWeight: "600",
  },

  infoContainer: {
    paddingTop: SPACING.sm,
  },

  infoText: {
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
    lineHeight: 18,
    fontStyle: "italic",
  },
});

export default RiskAssessmentCard;
