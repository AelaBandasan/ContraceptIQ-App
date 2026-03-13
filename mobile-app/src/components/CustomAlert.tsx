import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Animated,
  Dimensions,
} from 'react-native';
import { useAlert } from '../context/AlertContext';
import { colors, spacing, borderRadius, typography, shadows } from '../theme';
import { ActivityIndicator } from 'react-native';

const { width } = Dimensions.get('window');

/**
 * CustomAlert Component
 * 
 * Styled modal to replace system Alert.alert
 */
const CustomAlert: React.FC = () => {
  const { alertState, hideAlert } = useAlert();
  const { visible, title, message, buttons, options } = alertState;

  // Animation values
  const [fadeAnim] = React.useState(new Animated.Value(0));
  const [scaleAnim] = React.useState(new Animated.Value(0.8));
  const [btnProcessingIndex, setBtnProcessingIndex] = React.useState<number | null>(null);

  React.useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.8);
      setBtnProcessingIndex(null);
    }
  }, [visible]);

  if (!visible) return null;

  const handleBackdropPress = () => {
    if (options.cancelable !== false) {
      hideAlert();
    }
  };

  const handleButtonPress = (index: number, onPress?: () => void) => {
    if (onPress) {
      setBtnProcessingIndex(index);
      // Give a tiny bit of time for the spinner to show before hiding alert
      setTimeout(() => {
        hideAlert();
        setTimeout(onPress, 100);
      }, 300);
    } else {
      hideAlert();
    }
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={handleBackdropPress}
    >
      <TouchableWithoutFeedback onPress={handleBackdropPress}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
            <Animated.View
              style={[
                styles.alertBox,
                {
                  opacity: fadeAnim,
                  transform: [{ scale: scaleAnim }],
                },
              ]}
            >
              {/* Content */}
              <View style={styles.content}>
                {title ? <Text style={styles.title}>{title}</Text> : null}
                <Text style={styles.message}>{message}</Text>
              </View>

              {/* Buttons */}
              <View style={[
                styles.buttonRow, 
                (buttons.length > 2 || buttons.some(b => b.text.length > 12)) && styles.buttonColumn
              ]}>
                {buttons.map((button, index) => {
                  const isCancel = button.style === 'cancel';
                  const isDestructive = button.style === 'destructive';
                  
                  return (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.button,
                        buttons.length <= 2 && !buttons.some(b => b.text.length > 12) && styles.buttonFlex,
                        index > 0 && (buttons.length <= 2 && !buttons.some(b => b.text.length > 12) ? styles.buttonMarginLeft : styles.buttonMarginTop),
                        isDestructive && styles.destructiveButton,
                        isCancel && styles.cancelButton,
                      ]}
                      onPress={() => handleButtonPress(index, button.onPress)}
                      disabled={btnProcessingIndex !== null}
                    >
                      {btnProcessingIndex === index ? (
                        <ActivityIndicator color={isCancel ? '#475569' : '#FFFFFF'} size="small" />
                      ) : (
                        <Text
                          style={[
                            styles.buttonText,
                            isDestructive && styles.destructiveButtonText,
                            isCancel && styles.cancelButtonText,
                          ]}
                        >
                          {button.text}
                        </Text>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  alertBox: {
    width: width * 0.85,
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: spacing.lg,
    ...shadows.xl,
  },
  content: {
    marginBottom: spacing.xl,
    alignItems: 'center',
  },
  title: {
    fontSize: typography.sizes['xl'],
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  message: {
    fontSize: typography.sizes.base,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonColumn: {
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  button: {
    height: 50,
    borderRadius: 14,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.sm,
  },
  buttonFlex: {
    flex: 1,
  },
  buttonMarginLeft: {
    marginLeft: spacing.md,
  },
  buttonMarginTop: {
    marginTop: spacing.md,
  },
  buttonText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: '#FFFFFF',
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  cancelButton: {
    backgroundColor: '#F1F5F9',
    elevation: 0,
    shadowOpacity: 0,
  },
  cancelButtonText: {
    color: '#475569',
  },
  destructiveButton: {
    backgroundColor: colors.error,
  },
  destructiveButtonText: {
    color: '#FFFFFF',
  },
});

export default CustomAlert;
