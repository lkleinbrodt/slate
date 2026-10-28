import { Image, StyleSheet, View, type ViewProps } from "react-native";

import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";

import React from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/hooks/use-theme";

const grain = {
  light: require("@/assets/textures/grain-dark.png"),
  dark: require("@/assets/textures/grain-light.png"),
};

/** A faint paper/stone grain over the theme background */
export function Grain({ opacity = 1 }: { opacity?: number }) {
  const { scheme } = useTheme();
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Image
        source={grain[scheme]}
        resizeMode="repeat"
        style={{ opacity, width: "100%", height: "100%" }}
      />
    </View>
  );
}

/** Fades scrolled content out under the status bar */
function TopFade() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const height = insets.top + 18;
  return (
    <View style={[styles.fade, { height }]} pointerEvents="none">
      <Svg width="100%" height={height}>
        <Defs>
          <LinearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={colors.background} stopOpacity="1" />
            <Stop offset={String(insets.top / height)} stopColor={colors.background} stopOpacity="0.92" />
            <Stop offset="1" stopColor={colors.background} stopOpacity="0" />
          </LinearGradient>
        </Defs>
        <Rect width="100%" height={height} fill="url(#fade)" />
      </Svg>
    </View>
  );
}

/** Full-screen themed background with grain. Content handles its own insets. */
export function Screen({ style, children, ...rest }: ViewProps) {
  const { colors } = useTheme();
  return (
    <View style={[{ flex: 1, backgroundColor: colors.background }, style]} {...rest}>
      <Grain />
      {children}
      <TopFade />
    </View>
  );
}

const styles = StyleSheet.create({
  fade: { position: "absolute", top: 0, left: 0, right: 0 },
});
