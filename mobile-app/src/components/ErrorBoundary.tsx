/**
 * Error Boundary Component
 *
 * Catches rendering errors in child components and displays a user-friendly
 * error message. Prevents app crashes and provides recovery options.
 *
 * Usage:
 *   <ErrorBoundary>
 *     <YourComponent />
 *   </ErrorBoundary>
 */

import React, { ReactNode, ReactElement } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ViewStyle,
  TextStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

// ============================================================================
// TYPES
// ============================================================================

interface Props {
  children: ReactNode;
  fallback?: ReactElement;
  onError?: (error: Error, errorInfo: { componentStack: string }) => void;
  resetKeys?: Array<string | number>;
  resetOnPropsChange?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: { componentStack: string } | null;
}

// ============================================================================
// DESIGN SYSTEM
// ============================================================================

const COLORS = {
  background: "#FFFFFF",
  surface: "#F8FAFC",
  primary: "#E45A92",
  primaryDark: "#D3347A",
  textPrimary: "#0F172A",
  textSecondary: "#6B7280",
  textMuted: "#9CA3AF",
  error: "#EF4444",
  errorLight: "#FEF2F2",
  errorBorder: "#FECACA",
  warning: "#F59E0B",
  success: "#22C55E",
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
};

const TYPOGRAPHY = {
  heading: { fontSize: 20, fontWeight: "700" as const, letterSpacing: -0.3 },
  subheading: { fontSize: 16, fontWeight: "600" as const, letterSpacing: -0.2 },
  body: { fontSize: 14, fontWeight: "500" as const, letterSpacing: -0.1 },
  caption: { fontSize: 12, fontWeight: "500" as const, letterSpacing: 0 },
  small: { fontSize: 11, fontWeight: "400" as const, letterSpacing: 0.2 },
};

// ============================================================================
// COMPONENT
// ============================================================================

class ErrorBoundary extends React.Component<Props, State> {
  private previousResetKeys: Array<string | number> = [];

  constructor(props: Props) {
    super(props);

    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };

    this.previousResetKeys = props.resetKeys || [];
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: { componentStack: string }) {
    // Update state
    this.setState({
      error,
      errorInfo,
    });

    // Log to console in development
    if (__DEV__) {
      console.error("Error Boundary caught an error:", error, errorInfo);
    }

    // Call optional error handler (could send to error tracking service)
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  componentDidUpdate(prevProps: Props) {
    const { resetKeys = [] } = this.props;

    // Reset error boundary if resetKeys change
    if (
      this.state.hasError &&
      resetKeys.length > 0 &&
      resetKeys !== this.previousResetKeys
    ) {
      const hasResetKeyChanged = resetKeys.some(
        (key, index) => key !== this.previousResetKeys[index],
      );

      if (hasResetKeyChanged) {
        this.handleReset();
      }
    }

    this.previousResetKeys = resetKeys;
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    const { hasError, error, errorInfo } = this.state;
    const { children, fallback } = this.props;

    if (hasError) {
      // Use custom fallback if provided
      if (fallback) {
        return fallback;
      }

      // Default error UI
      return (
        <View style={styles.container}>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Error Icon */}
            <View style={styles.iconContainer}>
              <Ionicons name="alert-circle" size={60} color={COLORS.error} />
            </View>

            {/* Error Title */}
            <Text style={styles.title}>Oops! Something Went Wrong</Text>

            {/* Error Description */}
            <Text style={styles.description}>
              We encountered an unexpected error. Please try again or contact
              support if the problem persists.
            </Text>

            {/* Error Details (Development Only) */}
            {__DEV__ && error && (
              <View style={styles.errorDetailsContainer}>
                <Text style={styles.errorTitle}>Error Details:</Text>
                <Text style={styles.errorMessage}>{error.toString()}</Text>

                {errorInfo && (
                  <>
                    <Text
                      style={[styles.errorTitle, { marginTop: SPACING.md }]}
                    >
                      Component Stack:
                    </Text>
                    <Text style={styles.stackTrace}>
                      {errorInfo.componentStack}
                    </Text>
                  </>
                )}
              </View>
            )}

            {/* Helpful Suggestions */}
            <View style={styles.suggestionsContainer}>
              <Text style={styles.suggestionsTitle}>What you can try:</Text>

              <View style={styles.suggestionItem}>
                <Text style={styles.bulletPoint}>•</Text>
                <Text style={styles.suggestionText}>
                  Try refreshing the screen
                </Text>
              </View>

              <View style={styles.suggestionItem}>
                <Text style={styles.bulletPoint}>•</Text>
                <Text style={styles.suggestionText}>
                  Check your internet connection
                </Text>
              </View>

              <View style={styles.suggestionItem}>
                <Text style={styles.bulletPoint}>•</Text>
                <Text style={styles.suggestionText}>
                  Close and reopen the app
                </Text>
              </View>

              <View style={styles.suggestionItem}>
                <Text style={styles.bulletPoint}>•</Text>
                <Text style={styles.suggestionText}>
                  Contact support if the issue continues
                </Text>
              </View>
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={this.handleReset}
              activeOpacity={0.7}
            >
              <Ionicons
                name="refresh"
                size={20}
                color="#fff"
                style={{ marginRight: SPACING.sm }}
              />
              <Text style={styles.primaryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    // No error, render children normally
    return children;
  }
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  scrollView: {
    flex: 1,
  },

  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xxl,
    justifyContent: "center",
  },

  iconContainer: {
    alignItems: "center",
    marginBottom: SPACING.xl,
  },

  title: {
    ...TYPOGRAPHY.heading,
    color: COLORS.textPrimary,
    textAlign: "center",
    marginBottom: SPACING.md,
  },

  description: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: SPACING.xl,
  },

  errorDetailsContainer: {
    backgroundColor: COLORS.errorLight,
    borderWidth: 1,
    borderColor: COLORS.errorBorder,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.xl,
  },

  errorTitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.error,
    fontWeight: "600",
    marginBottom: SPACING.sm,
    textTransform: "uppercase",
  },

  errorMessage: {
    ...TYPOGRAPHY.small,
    color: COLORS.textPrimary,
    fontFamily: "monospace",
    backgroundColor: "#fff",
    padding: SPACING.sm,
    borderRadius: RADIUS.sm,
    overflow: "hidden",
  },

  stackTrace: {
    ...TYPOGRAPHY.small,
    color: COLORS.textPrimary,
    fontFamily: "monospace",
    backgroundColor: "#fff",
    padding: SPACING.md,
    borderRadius: RADIUS.sm,
    maxHeight: 200,
  },

  suggestionsContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.xl,
  },

  suggestionsTitle: {
    ...TYPOGRAPHY.subheading,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },

  suggestionItem: {
    flexDirection: "row",
    marginBottom: SPACING.md,
  },

  bulletPoint: {
    ...TYPOGRAPHY.body,
    color: COLORS.primary,
    marginRight: SPACING.md,
    fontWeight: "700",
  },

  suggestionText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    flex: 1,
    lineHeight: 20,
  },

  buttonContainer: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.errorBorder,
    gap: SPACING.md,
  },

  primaryButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.md,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
  },

  primaryButtonText: {
    ...TYPOGRAPHY.body,
    color: "#fff",
    fontWeight: "600",
  },
});

// ============================================================================
// EXPORTS
// ============================================================================

export default ErrorBoundary;
