import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  LinearGradient,
  Path,
  Rect,
  Stop,
} from "react-native-svg";

import React from "react";
import { useTheme } from "@/hooks/use-theme";

// Simple geometric pieces in the icon's language: a sandstone tile and a sun
// on the horizon. Placeholders until proper illustrations are made.

export type IllustrationName = "sunrise" | "tablet" | "stones" | "moon";

interface IllustrationProps {
  name: IllustrationName;
  size?: number;
}

export function Illustration({ name, size = 140 }: IllustrationProps) {
  const { colors, isDark } = useTheme();
  const tile = isDark ? "#2C2A27" : colors.clay;
  const tileEdge = isDark ? "#3A3733" : "#E2B97C";
  const groove = isDark ? "#171615" : "#D7A964";
  const sun = colors.primary;
  const sunSoft = colors.primarySoft;

  if (name === "sunrise") {
    // The app icon, standing on its own: a tile with a rising sun
    return (
      <Svg width={size} height={size} viewBox="0 0 140 140">
        <Defs>
          <LinearGradient id="tileGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={tile} stopOpacity="1" />
            <Stop offset="1" stopColor={tileEdge} stopOpacity="1" />
          </LinearGradient>
          <LinearGradient id="sunGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={sun} stopOpacity="1" />
            <Stop offset="1" stopColor={sun} stopOpacity="0.7" />
          </LinearGradient>
        </Defs>
        <Ellipse cx="70" cy="128" rx="46" ry="6" fill={colors.shadow} opacity={isDark ? 0.4 : 0.1} />
        <Rect x="18" y="14" width="104" height="108" rx="26" fill={tileEdge} />
        <Rect x="18" y="12" width="104" height="104" rx="26" fill="url(#tileGrad)" />
        <Circle cx="70" cy="74" r="40" fill={sunSoft} opacity={0.55} />
        <Path d="M44 76 A26 26 0 0 1 96 76 Z" fill="url(#sunGrad)" />
        <Path d="M32 77 H108" stroke={groove} strokeWidth="3.5" strokeLinecap="round" />
        <G stroke={sun} strokeWidth="3" strokeLinecap="round" opacity={0.85}>
          <Path d="M70 34 V40" />
          <Path d="M44 44 L48 48" />
          <Path d="M96 44 L92 48" />
          <Path d="M32 60 H38" />
          <Path d="M102 60 H108" />
        </G>
        <Path d="M46 92 H94" stroke={groove} strokeWidth="2.5" strokeLinecap="round" opacity={0.5} />
        <Path d="M56 102 H84" stroke={groove} strokeWidth="2.5" strokeLinecap="round" opacity={0.35} />
      </Svg>
    );
  }

  if (name === "tablet") {
    // A clean slate: an empty tablet with a stub of chalk
    return (
      <Svg width={size} height={size} viewBox="0 0 140 140">
        <Ellipse cx="70" cy="126" rx="50" ry="6" fill={colors.shadow} opacity={isDark ? 0.4 : 0.1} />
        <Rect x="16" y="24" width="108" height="94" rx="20" fill={tileEdge} />
        <Rect x="16" y="20" width="108" height="94" rx="20" fill={tile} />
        <Rect x="28" y="32" width="84" height="70" rx="12" fill={groove} opacity={0.35} />
        <Path
          d="M40 58 C52 50, 62 66, 74 56 S96 52, 100 60"
          stroke={colors.surface}
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
          opacity={0.75}
        />
        <Path d="M44 78 H76" stroke={colors.surface} strokeWidth="3" strokeLinecap="round" opacity={0.45} />
        <G transform="rotate(-24 104 108)">
          <Rect x="86" y="102" width="34" height="10" rx="5" fill={colors.surfaceElevated} />
          <Rect x="86" y="102" width="9" height="10" rx="4.5" fill={sun} />
        </G>
      </Svg>
    );
  }

  if (name === "stones") {
    // A cairn of stones: small things done every day
    return (
      <Svg width={size} height={size} viewBox="0 0 140 140">
        <Ellipse cx="70" cy="124" rx="44" ry="6" fill={colors.shadow} opacity={isDark ? 0.4 : 0.1} />
        <Ellipse cx="70" cy="106" rx="40" ry="16" fill={tileEdge} />
        <Ellipse cx="70" cy="103" rx="40" ry="15" fill={tile} />
        <Ellipse cx="70" cy="78" rx="30" ry="13" fill={colors.habit} opacity={0.75} />
        <Ellipse cx="70" cy="75" rx="30" ry="12" fill={colors.habit} />
        <Ellipse cx="70" cy="54" rx="20" ry="10" fill={tileEdge} />
        <Ellipse cx="70" cy="52" rx="20" ry="9" fill={tile} />
        <Circle cx="70" cy="30" r="9" fill={sun} />
        <Path d="M60 101 Q70 98 82 101" stroke={groove} strokeWidth="2" strokeLinecap="round" fill="none" opacity={0.6} />
      </Svg>
    );
  }

  // moon: the evening, for quiet empty states
  return (
    <Svg width={size} height={size} viewBox="0 0 140 140">
      <Circle cx="70" cy="66" r="44" fill={sunSoft} opacity={0.5} />
      <Path d="M86 34 A34 34 0 1 0 98 92 A28 28 0 1 1 86 34 Z" fill={colors.streak} />
      <Circle cx="38" cy="38" r="2.5" fill={colors.streak} />
      <Circle cx="108" cy="30" r="2" fill={colors.streak} />
      <Circle cx="112" cy="62" r="3" fill={colors.streak} opacity={0.6} />
      <Path d="M28 118 H112" stroke={groove} strokeWidth="3.5" strokeLinecap="round" />
    </Svg>
  );
}
