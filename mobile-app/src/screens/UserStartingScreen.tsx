import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import React from "react";
import type { RootStackScreenProps } from "../types/navigation";
import { colors, spacing, typography, borderRadius, shadows } from "../theme";

const UserStartingScreen = ({
  navigation,
}: RootStackScreenProps<"UserStartingScreen">) => {
  const handleContinueAsGuest = () => {
    navigation.navigate("MainDrawer");
  };
  const handleOBlogin = () => {
    navigation.navigate("ObRecom");
  };
  return (
    <View style={styles.screen}>
      <View style={styles.container}>
        <View style={styles.textContainer}>
          <Text style={styles.title}>ContraceptIQ</Text>
          <Text style={styles.text}>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
            eiusmod tempor{" "}
          </Text>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.button}
            onPress={handleContinueAsGuest}
          >
            <Text style={styles.buttonLabel}>Continue as Guest</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.loginContainer}>
        <Text style={styles.loginText}>
          Login as{" "}
          <TouchableOpacity onPress={handleOBlogin}>
            <Text style={styles.profText}>OB Professional</Text>
          </TouchableOpacity>
        </Text>
      </View>
    </View>
  );
};

export default UserStartingScreen;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background.primary,
    alignItems: "center",
  },
  container: {
    ...shadows.lg,
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius.xl,
    margin: spacing.base,
    marginTop: spacing["5xl"],
    paddingVertical: spacing["2xl"],
    paddingHorizontal: spacing.lg,
    height: 750,
    justifyContent: "flex-end",
    alignItems: "center",
  },
  textContainer: {
    alignItems: "center",
  },
  title: {
    fontSize: typography.sizes["5xl"],
    fontWeight: typography.weights.bold,
    fontStyle: "italic",
    paddingTop: spacing["8xl"],
  },
  text: {
    fontSize: typography.sizes.base,
    textAlign: "center",
    marginTop: spacing.xs,
  },
  buttonContainer: {
    paddingTop: spacing["9xl"],
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing["6xl"],
    ...shadows.md,
  },
  buttonLabel: {
    fontSize: typography.sizes["3xl"],
    fontWeight: typography.weights.bold,
    color: colors.background.primary,
  },
  loginContainer: {
    paddingTop: spacing.sm,
  },
  loginText: {
    fontSize: typography.sizes.xl,
    flexDirection: "row",
  },
  profText: {
    fontSize: typography.sizes.xl,
    color: colors.primary,
    fontStyle: "italic",
    fontWeight: typography.weights.regular,
    top: 7,
  },
});
