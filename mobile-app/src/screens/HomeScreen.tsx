import { StyleSheet, Text, View, TouchableOpacity, Image } from "react-native";
import React from "react";
import type { DrawerScreenProps } from "../types/navigation";
import { HeaderWithMenu, ScreenContainer } from "../components";
import { colors, spacing, typography, borderRadius, shadows } from "../theme";

type Props = DrawerScreenProps<"Home">;

const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const contraceptiveMethods = [
    { id: "1", name: "Pills", image: null },
    { id: "2", name: "Patch", image: null },
    { id: "3", name: "IUD", image: null },
    { id: "4", name: "Implants", image: null },
    { id: "5", name: "Injections", image: null },
  ];

  return (
    <ScreenContainer>
      <HeaderWithMenu />

      <View style={styles.titleContainer}>
        <Text style={styles.title}>ContraceptIQ</Text>
        <Text style={styles.tagline}>Smart Support, Informed Choices.</Text>
      </View>

      <View style={styles.infographicContainer}>
        <Image
          source={require("../../assets/image/infographic.jpg")}
          style={styles.infographic}
        />
      </View>

      <View>
        <Text style={styles.headerTitle}>Contraceptive Methods</Text>
        <View style={styles.methodsScrollContainer}>
          {contraceptiveMethods.map((method) => (
            <TouchableOpacity key={method.id} style={styles.methodItem}>
              <View style={styles.methodPics} />
              <Text style={styles.methodName}>{method.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View>
        <Text style={styles.headerTitle}>What is Contraception?</Text>
        <Text style={styles.info}>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
          eiusmod tempor incididunt ut labore et dolore magna aliqua. Lorem
          ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod
          tempor incididunt ut labore et dolore magna aliqua.
        </Text>
        <Text style={styles.headerTitle}>A Guide to Birth Control</Text>
        <Text style={styles.info}>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
          eiusmod tempor incididunt ut labore et dolore magna aliqua. Lorem
          ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod
          tempor incididunt ut labore et dolore magna aliqua.
        </Text>
      </View>
    </ScreenContainer>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  titleContainer: {
    marginTop: spacing["4xl"],
  },
  title: {
    fontSize: typography.sizes["4xl"],
    fontWeight: typography.weights.semibold,
    textAlign: "left",
  },
  tagline: {
    fontSize: typography.sizes.lg,
    fontStyle: "italic",
    textAlign: "left",
    marginTop: spacing.xs,
    paddingBottom: spacing.md,
  },
  infographicContainer: {
    paddingBottom: spacing.md,
  },
  infographic: {
    height: 370,
    width: 370,
    resizeMode: "contain",
    borderRadius: borderRadius.md,
    alignSelf: "center",
  },
  headerTitle: {
    fontSize: typography.sizes["2xl"],
    fontWeight: typography.weights.medium,
    paddingBottom: spacing.xs,
  },
  info: {
    fontSize: typography.sizes.md,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xs,
    textAlign: "justify",
  },
  methodsScrollContainer: {
    flexDirection: "row",
    paddingVertical: spacing.sm,
  },
  methodItem: {
    alignItems: "center",
    marginRight: spacing.lg,
  },
  methodPics: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.full,
    backgroundColor: colors.background.card,
    marginBottom: spacing.sm,
  },
  methodName: {
    fontSize: typography.sizes.base,
    lineHeight: typography.lineHeights.tight,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
});
