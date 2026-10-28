import { ActivityIndicator, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { Icon, type IconName } from "./Icon";
import { PressableScale, type HapticKind } from "./PressableScale";
import { Radius, shadow } from "@/constants/theme";

import React from "react";
import { ThemedText } from "@/components/themed-text";
import { useTheme } from "@/hooks/use-theme";

type Variant = "primary" | "secondary" | "ghost" | "danger";

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: Variant;
  icon?: IconName;
  size?: "md" | "lg";
  disabled?: boolean;
  loading?: boolean;
  haptics?: HapticKind;
  style?: StyleProp<ViewStyle>;
}

export function Button({
  title,
  onPress,
  variant = "primary",
  icon,
  size = "lg",
  disabled,
  loading,
  haptics = "light",
  style,
}: ButtonProps) {
  const { colors, scheme } = useTheme();
  const look = {
    primary: { bg: colors.primary, fg: colors.onPrimary, border: colors.primary },
    secondary: { bg: colors.surface, fg: colors.text, border: colors.borderStrong },
    ghost: { bg: "transparent", fg: colors.textSecondary, border: "transparent" },
    danger: { bg: colors.errorSoft, fg: colors.error, border: "transparent" },
  }[variant];

  return (
    <PressableScale
      onPress={onPress}
      disabled={disabled || loading}
      haptics={haptics}
      accessibilityRole="button"
      style={[
        styles.base,
        size === "lg" ? styles.lg : styles.md,
        { backgroundColor: look.bg, borderColor: look.border, opacity: disabled ? 0.5 : 1 },
        variant === "primary" && shadow(scheme, 1),
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={look.fg} />
      ) : (
        <View style={styles.row}>
          {icon && <Icon name={icon} size={size === "lg" ? 20 : 18} color={look.fg} weight="bold" />}
          <ThemedText type={size === "lg" ? "button" : "calloutMedium"} style={{ color: look.fg }}>
            {title}
          </ThemedText>
        </View>
      )}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: Radius.pill,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  lg: { minHeight: 54, paddingHorizontal: 24 },
  md: { minHeight: 40, paddingHorizontal: 16 },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
});
