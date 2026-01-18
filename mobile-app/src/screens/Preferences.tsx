import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
  ToastAndroid,
} from "react-native";
import React, { useState } from "react";
import type { RootStackScreenProps } from "../types/navigation";
import { Ionicons } from "@expo/vector-icons";
import { HeaderWithMenu, ScreenContainer } from "../components";
import { colors, spacing, typography, borderRadius, shadows } from "../theme";

type Props = RootStackScreenProps<"Preferences">;

const Preferences = ({ navigation }: Props) => {
  const [selectedPrefs, setSelectedPrefs] = useState<string[]>([]);

  const preferences = [
    {
      key: "effectiveness",
      label: "Effectiveness",
      description: "Most reliable at preventing pregnancy",
      icon: require("../../assets/image/star.png"),
    },
    {
      key: "sti",
      label: "STI Prevention",
      description: "Protection against STIs/HIV",
      icon: require("../../assets/image/shield.png"),
    },
    {
      key: "nonhormonal",
      label: "Non-hormonal",
      description: "Hormone-free option",
      icon: require("../../assets/image/forbidden.png"),
    },
    {
      key: "regular",
      label: "Regular Bleeding",
      description: "Helps with cramps or heavy bleeding",
      icon: require("../../assets/image/blood.png"),
    },
    {
      key: "privacy",
      label: "Privacy",
      description: "Can be used without others knowing",
      icon: require("../../assets/image/privacy.png"),
    },
    {
      key: "client",
      label: "Client controlled",
      description: "Can start or stop it myself",
      icon: require("../../assets/image/responsibility.png"),
    },
    {
      key: "longterm",
      label: "Long-term protection",
      description: "Lasts for years with little action",
      icon: require("../../assets/image/calendar.png"),
    },
  ];

  const showMaxAlert = () => {
    ToastAndroid.show(
      "You can only select up to 3 characteristics.",
      ToastAndroid.SHORT
    );
  };

  const togglePreference = (key: string) => {
    const isSelected = selectedPrefs.includes(key);

    if (isSelected) {
      setSelectedPrefs(selectedPrefs.filter((item) => item !== key));
    } else {
      if (selectedPrefs.length >= 3) {
        showMaxAlert();
        return;
      }
      setSelectedPrefs([...selectedPrefs, key]);
    }
  };

  const handleViewRecommendation = () => {
    navigation.navigate("ViewRecommendation");
  };

  return (
    <ScreenContainer>
      <HeaderWithMenu title="What's Right for Me?" />

      <View style={styles.screenCont}>
        <Text style={styles.header2}>Preferences</Text>
        <Text style={styles.header3}>What's important to you</Text>

        {preferences.map((pref) => {
          const selected = selectedPrefs.includes(pref.key);

          return (
            <TouchableOpacity
              key={pref.key}
              activeOpacity={0.9}
              onPress={() => togglePreference(pref.key)}
              style={[
                styles.prefCont,
                selected && {
                  backgroundColor: "#E6F5E9",
                  borderColor: "#2E8B57",
                  borderWidth: 2,
                },
              ]}
            >
              <View style={styles.prefHeader}>
                <Image source={pref.icon} style={styles.prefIcon} />
                <Text style={styles.prefLabel}>{pref.label}</Text>
                {selected && (
                  <Ionicons name="checkmark-circle" size={22} color="#2E8B57" />
                )}
              </View>

              {selected && (
                <Text style={styles.prefDescription}>{pref.description}</Text>
              )}
            </TouchableOpacity>
          );
        })}

        <TouchableOpacity
          style={styles.prefButton}
          onPress={handleViewRecommendation}
        >
          <Text style={styles.prefRecomButton}>View Recommendation</Text>
        </TouchableOpacity>
      </View>
    </ScreenContainer>
  );
};

export default Preferences;

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
    marginTop: spacing.xs,
  },
  prefCont: {
    ...shadows.xl,
    backgroundColor: colors.background.secondary,
    width: "90%",
    borderRadius: borderRadius.md,
    marginRight: spacing.sm,
    marginTop: spacing.base,
    paddingVertical: spacing.base,
    paddingHorizontal: spacing.lg,
  },
  prefHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  prefIcon: {
    resizeMode: "contain",
    height: 35,
    width: 35,
    top: 2,
  },
  prefLabel: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.semibold,
    paddingLeft: spacing.sm,
    flex: 1,
  },
  prefDescription: {
    marginTop: spacing.sm,
    fontSize: typography.sizes.sm,
    fontStyle: "italic",
    color: colors.text.secondary,
  },
  prefButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.xl,
    marginTop: spacing.base,
    width: "90%",
    alignItems: "center",
    paddingVertical: spacing.base,
    paddingHorizontal: spacing["2xl"],
    alignSelf: "center",
    ...shadows.md,
  },
  prefRecomButton: {
    textAlign: "center",
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.background.primary,
  },
});
