import React from "react";
import { View, TouchableOpacity, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { openDrawer } from "../navigation/NavigationService";
import { colors, spacing, typography } from "../theme";

type HeaderWithMenuProps = {
  title?: string;
  showMenu?: boolean;
  onMenuPress?: () => void;
};

export const HeaderWithMenu: React.FC<HeaderWithMenuProps> = ({
  title,
  showMenu = true,
  onMenuPress = openDrawer,
}) => {
  return (
    <View style={styles.container}>
      {showMenu && (
        <TouchableOpacity onPress={onMenuPress} style={styles.menuButton}>
          <Ionicons name="menu" size={35} color={colors.text.primary} />
        </TouchableOpacity>
      )}
      {title && <Text style={styles.title}>{title}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "relative",
    paddingTop: spacing["2xl"],
    paddingBottom: spacing.md,
  },
  menuButton: {
    position: "absolute",
    top: spacing["2xl"] + 5,
    left: 0,
    zIndex: 10,
  },
  title: {
    textAlign: "center",
    fontSize: typography.sizes["3xl"],
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
  },
});
