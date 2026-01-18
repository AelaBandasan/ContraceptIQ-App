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
import type { DrawerScreenProps } from "../types/navigation";
import { ScrollView } from "react-native-gesture-handler";
import { colors, spacing, typography, borderRadius, shadows } from "../theme";

type Props = DrawerScreenProps<"What's Right for Me?">;

const { width } = Dimensions.get("window");

const Whatsrightforme: React.FC<Props> = ({ navigation }) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  const handleGetStarter = () => setIsModalVisible(true);
  const handleContinue = () => {
    navigation.navigate("Recommendation");
  };

  const handleScroll = (event: any) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / width);
    setCurrentIndex(index);
  };

  return (
    <View style={styles.containerOne}>
      <TouchableOpacity
        onPress={() => navigation.toggleDrawer()}
        style={styles.menuButton}
      >
        <Ionicons name="menu" size={35} color={"#000"} />
      </TouchableOpacity>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        <View style={styles.onBoardscrn}>
          <Image
            source={require("../../assets/image/onboardscrn1.png")}
            style={styles.onBoardImg}
          />
          <Text style={styles.OBheader}>Take Charge of Your Health</Text>
          <Text style={styles.OBtext}>
            Choosing the right contraceptive method is an important step toward
            taking charge of your reproductive health and overall well-being.
          </Text>
        </View>

        <View style={styles.onBoardscrnTwo}>
          <Image
            source={require("../../assets/image/onboardscrn2.png")}
            style={styles.onBoardImgTwo}
          />
          <Text style={styles.OBheaderTwo}>
            Make Confident, Informed Decisions
          </Text>
          <Text style={styles.OBtextTwo}>
            It helps you make informed and confident contraceptive choices by
            guiding you through your preferences, lifestyle, and health
            needs—offering tailored method insights and a personalized summary
            to discuss with your provider.
          </Text>
        </View>

        <View style={styles.onBoardscrnThree}>
          <Image
            source={require("../../assets/image/onboardscrn3.png")}
            style={styles.onBoardImgThree}
          />
          <Text style={styles.OBheaderThree}>
            Empower Yourself with Knowledge
          </Text>
          <Text style={styles.OBtextThree}>
            The best contraceptive choice is the one that’s right for you — and
            knowledge is the key to making that decision with confidence.
          </Text>

          <TouchableOpacity style={styles.button} onPress={handleGetStarter}>
            <Text style={styles.buttonLabel}>Get Started</Text>
          </TouchableOpacity>
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
              eiusmod tempor incididunt ut labore et dolore magna aliqua. Lorem
              ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod
              tempor incididunt ut labore et dolore magna aliqua. Lorem ipsum
              dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor
              incididunt ut labore et dolore magna aliqua.
            </Text>
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
  );
};

export default Whatsrightforme;

const styles = StyleSheet.create({
  containerOne: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  menuButton: {
    position: "absolute",
    top: 45,
    left: spacing.lg,
    zIndex: 10,
  },
  onBoardscrn: {
    width: width,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
    top: -spacing["6xl"],
  },
  onBoardImg: {
    height: 340,
    width: 435,
    resizeMode: "contain",
    marginBottom: spacing.lg,
  },
  OBheader: {
    fontSize: typography.sizes["3xl"] + 1,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
    textAlign: "center",
    marginTop: spacing.sm,
  },
  OBtext: {
    fontSize: typography.sizes.md,
    color: colors.text.secondary,
    textAlign: "center",
    marginTop: spacing.sm,
    lineHeight: typography.lineHeights.normal,
    paddingHorizontal: spacing.xl,
  },
  onBoardscrnTwo: {
    width: width,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
    top: -spacing["5xl"],
  },
  onBoardImgTwo: {
    height: 340,
    width: 435,
    resizeMode: "contain",
    marginBottom: spacing.lg,
  },
  OBheaderTwo: {
    fontSize: typography.sizes["3xl"] + 1,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
    textAlign: "center",
    marginTop: spacing.sm,
  },
  OBtextTwo: {
    fontSize: typography.sizes.md,
    color: colors.text.secondary,
    textAlign: "center",
    marginTop: spacing.sm,
    lineHeight: typography.lineHeights.normal,
    paddingHorizontal: spacing.xl,
    justifyContent: "center",
  },
  onBoardscrnThree: {
    width: width,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
    top: -32,
  },
  onBoardImgThree: {
    height: 340,
    width: 435,
    resizeMode: "contain",
    marginBottom: spacing.lg,
  },
  OBheaderThree: {
    fontSize: typography.sizes["3xl"] + 1,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
    textAlign: "center",
    marginTop: spacing.sm,
  },
  OBtextThree: {
    fontSize: typography.sizes.md,
    color: colors.text.secondary,
    textAlign: "center",
    marginTop: spacing.sm,
    lineHeight: typography.lineHeights.normal,
    paddingHorizontal: spacing.xl,
    justifyContent: "center",
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing["6xl"],
    alignItems: "center",
    marginTop: spacing["2xl"],
    ...shadows.md,
  },
  buttonLabel: {
    color: colors.background.primary,
    fontSize: typography.sizes["2xl"],
    fontWeight: typography.weights.semibold,
  },
  indicatorContainer: {
    justifyContent: "center",
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing["3xl"],
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
