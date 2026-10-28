import { Radius, shadow } from "@/constants/theme";
import { StyleSheet, View, type ViewProps } from "react-native";

import React from "react";
import { useTheme } from "@/hooks/use-theme";

export interface CardProps extends ViewProps {
  elevation?: 0 | 1 | 2;
  /** Sunken cards look pressed into the page instead of resting on it */
  variant?: "raised" | "sunken";
  padded?: boolean;
  /** Clip children to the rounded corners (keeps the shadow outside) */
  clip?: boolean;
}

export function Card({
  style,
  elevation = 1,
  variant = "raised",
  padded = true,
  clip = false,
  children,
  ...rest
}: CardProps) {
  const { colors, scheme } = useTheme();
  const raised = variant === "raised";
  // iOS drops the shadow of a view that clips, so clipping happens one level in
  const content = clip ? (
    <View style={[styles.clip, padded && styles.padded]}>{children}</View>
  ) : (
    children
  );
  return (
    <View
      style={[
        styles.card,
        padded && !clip && styles.padded,
        {
          backgroundColor: raised ? colors.surface : colors.surfaceSunken,
          borderColor: raised ? colors.border : "transparent",
        },
        raised && elevation > 0 && shadow(scheme, elevation as 1 | 2),
        style,
      ]}
      {...rest}
    >
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
  },
  padded: {
    padding: 16,
  },
  clip: {
    borderRadius: Radius.xl,
    overflow: "hidden",
  },
});
