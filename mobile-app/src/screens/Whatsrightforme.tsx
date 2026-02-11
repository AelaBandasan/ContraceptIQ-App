import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Modal,
  Image,
  Dimensions,
} from "react-native";
import React, { useState, useRef } from "react";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import type { UserTabScreenProps, ObTabScreenProps } from '../types/navigation';
import { ScrollView } from "react-native-gesture-handler";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, typography, spacing, borderRadius, shadows } from "../theme";
import { useAssessment } from "../context/AssessmentContext";
import { ErrorAlert } from "../components/ErrorAlert";
import { createAppError, AppError } from "../utils/errorHandler";
import ObHeader from "../components/ObHeader";

type Props = UserTabScreenProps<"What's Right for Me?"> | ObTabScreenProps<'ObAssessment'>;

const { width, height } = Dimensions.get("window");

const Whatsrightforme: React.FC<Props> = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const [localError, setLocalError] = useState<AppError | null>(null);

  // Check if we are in Doctor/OB mode
  const { isDoctorAssessment } = (route?.params as any) || {};

  // Get assessment context for persisting state
  const { assessmentData, updateAssessmentData, error, setError } =
    useAssessment();

  const handleGetStarter = () => setIsModalVisible(true);
  const handleContinue = () => {
    try {
      // Ensure assessment data is initialized in context before navigating
      if (!assessmentData) {
        updateAssessmentData({});
      }
      setLocalError(null);
      setError(null);
      setIsModalVisible(false);
      if (isDoctorAssessment) {
        (navigation as any).navigate("ObRecommendations");
      } else {
        (navigation as any).navigate("Recommendation");
      }
    } catch (err) {
      const appError = createAppError(err, JSON.stringify({
        operation: "handleContinue",
        component: "Whatsrightforme",
      }));
      setLocalError(appError);
      setError(appError.userMessage);
    }
  };

  const handleScroll = (event: any) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / width);
    setCurrentIndex(index);
  };

  return (
    <View style={styles.safeArea}>
      {isDoctorAssessment && <ObHeader title="Assessment" subtitle="Patient Eval" />}

      <View style={styles.containerOne}>
        {!isDoctorAssessment && (
          <View style={[styles.guestHeader, { paddingTop: insets.top + 10 }]}>
            <TouchableOpacity
              onPress={() => (navigation as any).toggleDrawer()}
              style={styles.menuButton}
            >
              <LinearGradient
                colors={['rgba(255,255,255,0.4)', 'rgba(255,255,255,0.1)']}
                style={styles.gradient}
              >
                <Ionicons name="menu" size={24} color="#FFF" />
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerAppTitle}>ContraceptIQ</Text>
              <Text style={styles.headerTagline}>Smart Support.</Text>
            </View>
          </View>
        )}

        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.onBoardPage}>
            <Image
              source={require("../../assets/image/onboardscrn1.png")}
              style={styles.onBoardImg}
            />
            <View style={styles.textContainer}>
              <Text style={styles.OBheader}>Take Charge of Your Health</Text>
              <Text style={styles.OBtext}>
                Choosing the right contraceptive method is an important step
                toward taking charge of your reproductive health and overall
                well-being.
              </Text>
            </View>
          </View>

          <View style={styles.onBoardPage}>
            <Image
              source={require("../../assets/image/onboardscrn2.png")}
              style={styles.onBoardImg}
            />
            <View style={styles.textContainer}>
              <Text style={styles.OBheader}>
                Make Confident, Informed Decisions
              </Text>
              <Text style={styles.OBtext}>
                It helps you make informed and confident contraceptive choices
                by guiding you through your preferences, lifestyle, and health
                needs—offering tailored method insights and a personalized
                summary to discuss with your provider.
              </Text>
            </View>
          </View>

          <View style={styles.onBoardPage}>
            <Image
              source={require("../../assets/image/onboardscrn3.png")}
              style={styles.onBoardImg}
            />
            <View style={styles.textContainer}>
              <Text style={styles.OBheader}>
                Empower Yourself with Knowledge
              </Text>
              <Text style={styles.OBtext}>
                The best contraceptive choice is the one that’s right for you —
                and knowledge is the key to making that decision with
                confidence.
              </Text>

              <TouchableOpacity
                style={styles.button}
                onPress={handleGetStarter}
              >
                <Text style={styles.buttonLabel}>Get Started</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        <View style={styles.indicatorContainer}>
          {[0, 1, 2].map((index) => (
            <View
              key={index}
              style={[
                styles.indicator,
                currentIndex === index && styles.currentIndicator,
              ]}
            />
          ))}
        </View>

        <Modal transparent visible={isModalVisible}>
          <View style={styles.overlay}>
            <View style={styles.modalBox}>
              <Text style={styles.disclaimer}>Disclaimer</Text>
              <Text style={styles.message}>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
                eiusmod tempor incididunt ut labore et dolore magna aliqua.
                Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
                eiusmod tempor incididunt ut labore et dolore magna aliqua.
                Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
                eiusmod tempor incididunt ut labore et dolore magna aliqua.
              </Text>

              {/* Error Alert */}
              {localError && (
                <ErrorAlert
                  error={localError}
                  onDismiss={() => {
                    setLocalError(null);
                    setError(null);
                  }}
                  style={{ marginTop: 12 }}
                />
              )}

              <TouchableOpacity
                style={styles.modalButton}
                onPress={handleContinue}
              >
                <Text style={styles.modalButtonText}>Continue</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </View>
  );
};

export default Whatsrightforme;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  containerOne: {
    flex: 1,
    backgroundColor: "#fff",
  },
  guestHeader: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingBottom: 25,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    zIndex: 10,
    marginBottom: 5, // Small gap for visual separation
  },
  headerTitleContainer: {
    marginLeft: 15,
  },
  headerAppTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
  },
  headerTagline: {
    fontSize: 14,
    color: '#FFDBEB',
    fontStyle: 'italic',
  },
  menuButton: {
    padding: 5,
    width: 42,
    height: 42,
    borderRadius: 12,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    // alignItems: 'center', // Can cause issues with paging
  },
  onBoardPage: {
    width: width,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingBottom: 50, // Space for indicators
  },
  onBoardImg: {
    width: "90%",
    height: undefined,
    aspectRatio: 1,
    resizeMode: "contain",
    marginBottom: 20,
    marginTop: 20,
  },
  textContainer: {
    alignItems: "center",
    paddingHorizontal: 10,
  },
  OBheader: {
    fontSize: typography.sizes["3xl"] + 1,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
    textAlign: "center",
    marginTop: spacing.sm,
  },
  OBtext: {
    fontSize: 17,
    color: "#444",
    textAlign: "center",
    marginTop: 10,
    lineHeight: 24,
  },
  button: {
    backgroundColor: "#E45A92",
    borderRadius: 10,
    paddingVertical: 15, // Reduced padding
    paddingHorizontal: 60,
    alignItems: "center",
    marginTop: 20,
    elevation: 5,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  buttonLabel: {
    color: colors.background.primary,
    fontSize: typography.sizes["2xl"],
    fontWeight: typography.weights.semibold,
  },
  indicatorContainer: {
    position: "absolute",
    bottom: 30,
    width: "100%",
    justifyContent: "center",
    flexDirection: "row",
    alignItems: "center",
    elevation: 10,
  },
  indicator: {
    height: 12,
    width: 12,
    borderRadius: 6,
    backgroundColor: colors.border.main,
    marginHorizontal: spacing.xs,
  },
  currentIndicator: {
    width: spacing["2xl"],
    backgroundColor: colors.primary,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBox: {
    backgroundColor: colors.background.primary,
    padding: spacing.xl,
    borderRadius: borderRadius.md,
    width: "85%",
    ...shadows.md,
  },
  disclaimer: {
    fontSize: typography.sizes["2xl"],
    fontWeight: typography.weights.medium,
    marginBottom: spacing.sm,
    color: colors.text.primary,
  },
  message: {
    fontSize: typography.sizes.base,
    color: colors.text.secondary,
    marginBottom: spacing.lg,
    textAlign: "justify",
    lineHeight: typography.lineHeights.normal - 2,
  },
  modalButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.sm,
    alignItems: "center",
  },
  modalButtonText: {
    color: colors.background.primary,
    fontWeight: typography.weights.semibold,
    fontSize: typography.sizes.md,
  },
});
