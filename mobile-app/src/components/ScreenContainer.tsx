import React from "react";
import { View, StyleSheet, ViewStyle } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { colors, spacing } from "../theme";

type ScreenContainerProps = {
  children: React.ReactNode;
  scrollable?: boolean;
  style?: ViewStyle;
  contentContainerStyle?: ViewStyle;
  showsVerticalScrollIndicator?: boolean;
};

export const ScreenContainer: React.FC<ScreenContainerProps> = ({
  children,
  scrollable = true,
  style,
  contentContainerStyle,
  showsVerticalScrollIndicator = false,
}) => {
  if (scrollable) {
    return (
      <ScrollView
        style={[styles.scrollContainer, style]}
        showsVerticalScrollIndicator={showsVerticalScrollIndicator}
        contentContainerStyle={[styles.contentContainer, contentContainerStyle]}
      >
        {children}
      </ScrollView>
    );
  }

  return <View style={[styles.container, style]}>{children}</View>;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: colors.background.primary,
    paddingHorizontal: spacing.lg,
  },
  contentContainer: {
    paddingTop: spacing.sm,
    paddingBottom: spacing["7xl"],
  },
});
