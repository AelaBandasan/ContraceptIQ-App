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
import type { DrawerNavigationProp } from "@react-navigation/drawer";
import { ScrollView } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, typography, spacing, borderRadius, shadows } from "../theme";
import { useAssessment } from "../context/AssessmentContext";
import { ErrorAlert } from "../components/ErrorAlert";
import { createAppError, AppError } from "../utils/errorHandler";

type Props = {
  navigation: DrawerNavigationProp<any, any>;
};

const { width, height } = Dimensions.get("window");

const Whatsrightforme: React.FC<Props> = ({ navigation }) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const [localError, setLocalError] = useState<AppError | null>(null);

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
      navigation.navigate("Recommendation");
    } catch (err) {
      const appError = createAppError(err, {
        operation: "handleContinue",
        component: "Whatsrightforme",
      });
      setLocalError(appError);
      setError(appError.userMessage);
    }
  };

  const handleScroll = (event: any) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / width);
    setCurrentIndex(index);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.containerOne}>
        <View style={styles.headerContainer}>
          <TouchableOpacity
            onPress={() => navigation.toggleDrawer()}
            style={styles.menuButton}
          >
            <Ionicons name="menu" size={35} color={"#000"} />
          </TouchableOpacity>
        </View>

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
    </SafeAreaView>
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
  headerContainer: {
    paddingHorizontal: 20,
    marginTop: 10,
    zIndex: 10,
    position: "absolute",
    top: 0,
    left: 0,
  },
  menuButton: {
    padding: 5,
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
