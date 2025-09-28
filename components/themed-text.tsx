import { StyleSheet, Text, type TextProps } from "react-native";

import { useThemeColor } from "@/hooks/use-theme-color";

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?:
    | "h1"
    | "h2"
    | "h3"
    | "h4"
    | "body"
    | "bodySemiBold"
    | "caption"
    | "captionSemiBold"
    | "link"
    | "label"
    | "button";
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = "body",
  ...rest
}: ThemedTextProps) {
  const color = useThemeColor({ light: lightColor, dark: darkColor }, "text");

  return (
    <Text
      style={[
        { color },
        type === "h1" ? styles.h1 : undefined,
        type === "h2" ? styles.h2 : undefined,
        type === "h3" ? styles.h3 : undefined,
        type === "h4" ? styles.h4 : undefined,
        type === "body" ? styles.body : undefined,
        type === "bodySemiBold" ? styles.bodySemiBold : undefined,
        type === "caption" ? styles.caption : undefined,
        type === "captionSemiBold" ? styles.captionSemiBold : undefined,
        type === "link" ? styles.link : undefined,
        type === "label" ? styles.label : undefined,
        type === "button" ? styles.button : undefined,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  // Heading styles
  h1: {
    fontSize: 32,
    fontWeight: "700",
    lineHeight: 40,
    letterSpacing: -0.5,
  },
  h2: {
    fontSize: 28,
    fontWeight: "600",
    lineHeight: 36,
    letterSpacing: -0.25,
  },
  h3: {
    fontSize: 24,
    fontWeight: "600",
    lineHeight: 32,
    letterSpacing: 0,
  },
  h4: {
    fontSize: 20,
    fontWeight: "600",
    lineHeight: 28,
    letterSpacing: 0,
  },

  // Body text styles
  body: {
    fontSize: 16,
    fontWeight: "400",
    lineHeight: 24,
    letterSpacing: 0,
  },
  bodySemiBold: {
    fontSize: 16,
    fontWeight: "600",
    lineHeight: 24,
    letterSpacing: 0,
  },

  // Caption styles
  caption: {
    fontSize: 14,
    fontWeight: "400",
    lineHeight: 20,
    letterSpacing: 0.1,
  },
  captionSemiBold: {
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20,
    letterSpacing: 0.1,
  },

  // Special purpose styles
  link: {
    fontSize: 16,
    fontWeight: "500",
    lineHeight: 24,
    color: "#4F46E5", // Primary color
    textDecorationLine: "underline",
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 16,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  button: {
    fontSize: 16,
    fontWeight: "600",
    lineHeight: 24,
    letterSpacing: 0,
  },
});
