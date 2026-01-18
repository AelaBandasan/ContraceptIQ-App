import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
  Modal,
  Animated,
  PanResponder,
} from "react-native";
import React, { useState, useRef, useEffect } from "react";
import type { RootStackScreenProps } from "../types/navigation";
import { Ionicons } from "@expo/vector-icons";
import { HeaderWithMenu, ScreenContainer } from "../components";
import { colors, spacing, typography, borderRadius, shadows } from "../theme";
import Slider from "@react-native-community/slider";

type Props = RootStackScreenProps<"Recommendation">;

const Recommendation: React.FC<Props> = ({ navigation }) => {
  const [sliderValue, setSliderValue] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const translateY = useRef(new Animated.Value(500)).current;

  const ageRanges = [
    "Menarche to < 18 years",
    "18 - 19 years",
    "20 - 39 years",
    "40 - 45 years",
    "≥ 46 years",
  ];

  const selectedLabel = ageRanges[sliderValue];

  const colorMap: Record<number, string> = {
    1: colors.success,
    2: colors.warning,
    3: colors.warningDark,
    4: colors.error,
  };

  const recommendations: Record<number, Record<string, number>> = {
    0: {
      // Menarche to <18
      pills: 1,
      patch: 1,
      copperIUD: 2,
      levIUD: 2,
      implant: 2,
      injectables: 2,
    },
    1: {
      // 18-19
      pills: 1,
      patch: 1,
      copperIUD: 2,
      levIUD: 2,
      implant: 1,
      injectables: 1,
    },
    2: {
      // 20-39
      pills: 1,
      patch: 1,
      copperIUD: 1,
      levIUD: 1,
      implant: 1,
      injectables: 1,
    },
    3: {
      // 40-45
      pills: 1,
      patch: 2,
      copperIUD: 1,
      levIUD: 1,
      implant: 1,
      injectables: 1,
    },
    4: {
      // ≥46
      pills: 1,
      patch: 2,
      copperIUD: 1,
      levIUD: 1,
      implant: 1,
      injectables: 2,
    },
  };

  const getColor = (method: string) => {
    const code = recommendations[sliderValue][method];
    return colorMap[code] || "#ccc";
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) =>
        Math.abs(gestureState.dy) > 20,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 100) {
          Animated.timing(translateY, {
            toValue: 500,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            translateY.setValue(500);
            setModalVisible(false);
          });
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  useEffect(() => {
    if (modalVisible) {
      Animated.timing(translateY, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [modalVisible]);

  const handleAddPreference = () => {
    navigation.navigate("Preferences");
  };

  const handleViewRecommendation = () => {
    navigation.navigate("ViewRecommendation");
  };

  return (
    <ScreenContainer>
      <HeaderWithMenu title="What's Right for Me?" />

      <View style={styles.screenCont}>
        <Text style={styles.header2}>Tell us about you</Text>
        <Text style={styles.header3}>
          Enter your age to personalize recommendations.
        </Text>

        <View style={styles.ageCont}>
          <View style={styles.ageHeader}>
            <Image
              source={require("../../assets/image/age.png")}
              style={styles.ageIcon}
            />
            <Text style={styles.ageLabel}>Age</Text>
          </View>

          <View>
            <Text style={styles.selectedAge}>{selectedLabel}</Text>
          </View>

          <View style={styles.sliderCont}>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={4}
              step={1}
              value={sliderValue}
              onValueChange={(value) => {
                setSliderValue(value);
                setModalVisible(true);
              }}
              minimumTrackTintColor="#E45A92"
              maximumTrackTintColor="#D3D3D3"
              thumbTintColor="#E45A92"
            />
            <View style={styles.sliderLabel}>
              <Text style={styles.labelText}>Menarche to {"< 18"}</Text>
              <Text style={styles.labelText}>(≥ 46)</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={styles.prefButton}
          onPress={handleAddPreference}
        >
          <Text style={styles.prefLabel}>+ Add Preferences</Text>
        </TouchableOpacity>

        <Modal
          visible={modalVisible}
          transparent
          animationType="none"
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay} pointerEvents="box-none">
            <Animated.View
              style={[styles.modalContainer, { transform: [{ translateY }] }]}
              {...panResponder.panHandlers}
            >
              <View style={styles.modalHandle} />

              <TouchableOpacity
                style={styles.recomButton}
                onPress={handleViewRecommendation}
              >
                <Text style={styles.modalHeader}>View Recommendation</Text>
              </TouchableOpacity>

              <View style={styles.modalContent}>
                <Text style={styles.modalText}>Selected Age:</Text>
                <Text style={styles.modalAge}>{selectedLabel}</Text>
              </View>

              <View style={styles.modalButtons}>
                <View style={styles.recomRow}>
                  <View style={styles.recomItem}>
                    <Image
                      source={require("../../assets/image/copperiud.png")}
                      style={[
                        styles.contaceptiveImg,
                        { borderColor: getColor("copperIUD") },
                      ]}
                    />
                    <Text style={styles.contraceptiveLabel}>Cu-IUD</Text>
                  </View>

                  <View style={styles.recomItem}>
                    <Image
                      source={require("../../assets/image/implantt.png")}
                      style={[
                        styles.contaceptiveImg,
                        { borderColor: getColor("implant") },
                      ]}
                    />
                    <Text style={styles.contraceptiveLabel}>LNG/ETG</Text>
                  </View>

                  <View style={styles.recomItem}>
                    <Image
                      source={require("../../assets/image/injectables.png")}
                      style={[
                        styles.contaceptiveImg,
                        { borderColor: getColor("injectables") },
                      ]}
                    />
                    <Text style={styles.contraceptiveLabel}>DMPA</Text>
                  </View>
                </View>

                <View style={styles.recomRow}>
                  <View style={styles.recomItem}>
                    <Image
                      source={require("../../assets/image/leviud.png")}
                      style={[
                        styles.contaceptiveImg,
                        { borderColor: getColor("levIUD") },
                      ]}
                    />
                    <Text style={styles.contraceptiveLabel}>LNG-IUD</Text>
                  </View>

                  <View style={styles.recomItem}>
                    <Image
                      source={require("../../assets/image/patchh.png")}
                      style={[
                        styles.contaceptiveImg,
                        { borderColor: getColor("patch") },
                      ]}
                    />
                    <Text style={styles.contraceptiveLabel}>CHC</Text>
                  </View>

                  <View style={styles.recomItem}>
                    <Image
                      source={require("../../assets/image/pillss.png")}
                      style={[
                        styles.contaceptiveImg,
                        { borderColor: getColor("pills") },
                      ]}
                    />
                    <Text style={styles.contraceptiveLabel}>POP</Text>
                  </View>
                </View>
              </View>
            </Animated.View>
          </View>
        </Modal>
      </View>
    </ScreenContainer>
  );
};

export default Recommendation;

const styles = StyleSheet.create({
  screenCont: {
    marginTop: spacing.md,
  },
  header2: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.medium,
  },
  header3: {
    fontSize: typography.sizes.sm,
    fontStyle: "italic",
    color: colors.text.secondary,
  },
  ageCont: {
    ...shadows.xl,
    backgroundColor: colors.background.secondary,
    width: "90%",
    borderRadius: borderRadius.md,
    marginRight: spacing.sm,
    marginTop: spacing.base,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  ageHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.sm,
    top: 1,
  },
  ageIcon: {
    resizeMode: "contain",
    height: 45,
    width: 45,
  },
  ageLabel: {
    fontSize: typography.sizes["2xl"],
    fontWeight: typography.weights.semibold,
    paddingLeft: spacing.sm,
  },
  selectedAge: {
    fontSize: typography.sizes.base,
    color: colors.text.primary,
    fontWeight: typography.weights.regular,
    paddingLeft: spacing.sm,
    marginTop: spacing.xs,
    textAlign: "center",
  },
  sliderCont: {
    width: "100%",
  },
  slider: {
    width: "100%",
    height: spacing["4xl"],
  },
  sliderLabel: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: -spacing.sm,
  },
  labelText: {
    fontSize: 14,
    color: "#333",
  },
  prefButton: {
    marginTop: 10,
    width: "90%",
    alignItems: "center",
    paddingVertical: 10,
  },
  prefLabel: {
    textAlign: "center",
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.1)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: colors.background.primary,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.lg,
    alignItems: "center",
    height: "50%",
    ...shadows.lg,
  },
  modalHandle: {
    width: 60,
    height: 6,
    backgroundColor: colors.border.main,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.base,
  },
  recomButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.lg - 2,
    paddingHorizontal: spacing["6xl"],
    ...shadows.md,
  },
  modalHeader: {
    fontSize: typography.sizes["2xl"],
    fontWeight: typography.weights.bold,
    color: colors.background.primary,
  },
  modalContent: {
    alignItems: "center",
    marginTop: spacing.base,
    marginBottom: spacing.xs,
  },
  modalText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium,
    color: colors.text.disabled,
  },
  modalAge: {
    fontSize: typography.sizes["2xl"],
    fontWeight: typography.weights.bold,
    color: colors.primary,
  },
  modalButtons: {
    width: "100%",
    alignItems: "center",
  },
  recomRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginBottom: spacing.lg,
  },
  recomItem: {
    alignItems: "center",
    justifyContent: "center",
  },
  contaceptiveImg: {
    width: 90,
    height: 90,
    resizeMode: "contain",
    borderRadius: borderRadius.full,
    borderWidth: 4,
    padding: spacing.sm,
    backgroundColor: colors.background.primary,
    elevation: 6,
    shadowColor: colors.shadow,
    shadowOpacity: 0.25,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 3 },
  },
  contraceptiveLabel: {
    marginTop: spacing.xs,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
    textAlign: "center",
  },
});
