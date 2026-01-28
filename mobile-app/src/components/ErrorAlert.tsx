/**
 * ErrorAlert Component
 *
 * Displays user-friendly error messages with appropriate actions.
 * Integrates with error mapping for consistent UI across the app.
 */

import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { AppError } from "../utils/errorHandler";
import {
  getErrorDisplay,
  shouldShowRetry,
  getRetryDelay,
  ErrorDisplay,
} from "../utils/errorMessageMapper";

interface ErrorAlertProps {
  error?: AppError | string | Error | null;
  onRetry?: () => void | Promise<void>;
  onDismiss?: () => void;
  visible?: boolean;
  showDetails?: boolean;
  style?: any;
}

/**
 * ErrorAlert - Displays error messages with actions
 *
 * Features:
 * - User-friendly error messages
 * - Retry button for retryable errors
 * - Offline/network-specific messaging
 * - Loading state during retry
 * - Detailed error information (dev mode)
 */
export const ErrorAlert: React.FC<ErrorAlertProps> = ({
  error,
  onRetry,
  onDismiss,
  visible = true,
  showDetails = false,
  style,
}) => {
  const [isRetrying, setIsRetrying] = useState(false);

  // Don't show if no error or not visible
  if (!error || !visible) {
    return null;
  }

  const errorDisplay = getErrorDisplay(error);
  const canRetry = shouldShowRetry(error as AppError) && onRetry;

  const handleRetry = async () => {
    if (!onRetry) return;

    setIsRetrying(true);
    try {
      await Promise.resolve(onRetry());
    } catch (err) {
      // Error will be passed back to parent
      console.error("Retry failed:", err);
    } finally {
      setIsRetrying(false);
    }
  };

  const handleShowDetails = () => {
    if (error instanceof Error || typeof error === "string") {
      const message = error instanceof Error ? error.message : error;
      Alert.alert("Error Details", message, [{ text: "Close" }]);
    } else {
      const appError = error as AppError;
      Alert.alert(
        "Error Details",
        `${appError.message}\n\nType: ${appError.type}`,
        [{ text: "Close" }],
      );
    }
  };

  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case "critical":
        return "#DC2626"; // Red
      case "warning":
        return "#EA580C"; // Orange
      case "info":
        return "#2563EB"; // Blue
      default:
        return "#6B7280"; // Gray
    }
  };

  const getIconEmoji = (icon: string): string => {
    switch (icon) {
      case "warning":
        return "⚠️";
      case "error":
        return "❌";
      case "offline":
        return "📡";
      case "info":
        return "ℹ️";
      default:
        return "⚠️";
    }
  };

  const severity = errorDisplay.severity;
  const color = getSeverityColor(severity);

  return (
    <View style={[styles.container, { borderLeftColor: color }, style]}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.icon}>{getIconEmoji(errorDisplay.icon)}</Text>
          <Text style={[styles.title, { color }]}>{errorDisplay.title}</Text>
        </View>

        <Text style={styles.message}>{errorDisplay.message}</Text>

        {errorDisplay.userAction && (
          <Text style={styles.userAction}>💡 {errorDisplay.userAction}</Text>
        )}

        <View style={styles.actionContainer}>
          {canRetry && (
            <TouchableOpacity
              style={[
                styles.button,
                styles.retryButton,
                { borderColor: color },
              ]}
              onPress={handleRetry}
              disabled={isRetrying}
            >
              {isRetrying ? (
                <ActivityIndicator size="small" color={color} />
              ) : (
                <Text style={[styles.buttonText, { color }]}>
                  {errorDisplay.actionLabel || "Retry"}
                </Text>
              )}
            </TouchableOpacity>
          )}

          {onDismiss && (
            <TouchableOpacity
              style={[styles.button, styles.dismissButton]}
              onPress={onDismiss}
            >
              <Text style={styles.dismissButtonText}>Dismiss</Text>
            </TouchableOpacity>
          )}
        </View>

        {(showDetails || errorDisplay.showDetails) && (
          <TouchableOpacity
            style={styles.detailsButton}
            onPress={handleShowDetails}
          >
            <Text style={styles.detailsButtonText}>View Details</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

/**
 * ErrorBanner - Inline error banner (more compact)
 *
 * Use for errors that should not block the entire screen
 */
export const ErrorBanner: React.FC<{
  error?: AppError | string | Error | null;
  onDismiss?: () => void;
}> = ({ error, onDismiss }) => {
  if (!error) return null;

  const errorDisplay = getErrorDisplay(error);
  const color = errorDisplay.severity === "critical" ? "#DC2626" : "#EA580C";

  return (
    <View style={[styles.banner, { backgroundColor: color }]}>
      <Text style={styles.bannerIcon}>
        {errorDisplay.icon === "offline" ? "📡" : "⚠️"}
      </Text>
      <Text style={styles.bannerText}>{errorDisplay.message}</Text>
      {onDismiss && (
        <TouchableOpacity onPress={onDismiss}>
          <Text style={styles.bannerClose}>✕</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
    marginHorizontal: 0,
    borderLeftWidth: 4,
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  icon: {
    fontSize: 20,
    marginRight: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
  },
  message: {
    fontSize: 14,
    color: "#4B5563",
    lineHeight: 20,
    marginBottom: 8,
  },
  userAction: {
    fontSize: 13,
    color: "#666666",
    fontStyle: "italic",
    marginBottom: 12,
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: "#F3F4F6",
    borderRadius: 4,
  },
  actionContainer: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
    minHeight: 36,
  },
  retryButton: {
    borderWidth: 1,
    flex: 1,
  },
  dismissButton: {
    backgroundColor: "#E5E7EB",
    flex: 1,
  },
  buttonText: {
    fontSize: 13,
    fontWeight: "600",
  },
  dismissButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
  },
  detailsButton: {
    marginTop: 12,
    paddingVertical: 4,
  },
  detailsButtonText: {
    fontSize: 12,
    color: "#2563EB",
    fontWeight: "500",
    textDecorationLine: "underline",
  },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#FCA5A5",
    gap: 12,
  },
  bannerIcon: {
    fontSize: 16,
  },
  bannerText: {
    flex: 1,
    fontSize: 13,
    color: "#FFFFFF",
    fontWeight: "500",
  },
  bannerClose: {
    fontSize: 18,
    color: "#FFFFFF",
    fontWeight: "bold",
    paddingHorizontal: 8,
  },
});

export default ErrorAlert;
