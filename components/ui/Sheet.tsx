import ActionSheet, { SheetManager } from "react-native-actions-sheet";
import { StyleSheet, View } from "react-native";

import { Grain } from "./Screen";
import { Icon } from "./Icon";
import { PressableScale } from "./PressableScale";
import { Radius } from "@/constants/theme";
import React from "react";
import { ThemedText } from "@/components/themed-text";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/hooks/use-theme";

interface SheetProps {
  id: string;
  children: React.ReactNode;
}

/** A themed bottom sheet: warm surface, grain, soft handle */
export function Sheet({ id, children }: SheetProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <ActionSheet
      id={id}
      gestureEnabled
      safeAreaInsets={insets}
      containerStyle={{
        backgroundColor: colors.surface,
        borderTopLeftRadius: Radius.xxl,
        borderTopRightRadius: Radius.xxl,
        overflow: "hidden",
      }}
      indicatorStyle={{ backgroundColor: colors.borderStrong, width: 40, marginTop: 10 }}
      overlayColor={colors.scrim}
      defaultOverlayOpacity={1}
    >
      <Grain opacity={0.5} />
      <View style={{ paddingBottom: Math.max(insets.bottom, 16) }}>{children}</View>
    </ActionSheet>
  );
}

interface SheetHeaderProps {
  title: string;
  eyebrow?: string;
  sheetId: string;
  /** Extra controls next to the close button */
  accessory?: React.ReactNode;
}

export function SheetHeader({ title, eyebrow, sheetId, accessory }: SheetHeaderProps) {
  const { colors } = useTheme();
  return (
    <View style={styles.header}>
      <View style={styles.titles}>
        {eyebrow && (
          <ThemedText type="eyebrow" tone="textTertiary">
            {eyebrow}
          </ThemedText>
        )}
        <ThemedText type="title">{title}</ThemedText>
      </View>
      {accessory}
      <PressableScale
        onPress={() => SheetManager.hide(sheetId)}
        haptics="selection"
        hitSlop={8}
        style={[styles.close, { backgroundColor: colors.surfaceSunken }]}
        accessibilityLabel="Close"
      >
        <Icon name="x" size={16} color="textSecondary" weight="bold" />
      </PressableScale>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
  },
  titles: { flex: 1, gap: 2 },
  close: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
});
