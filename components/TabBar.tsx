import Animated, {
  useAnimatedStyle,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { Icon, type IconName } from "@/components/ui/Icon";
import { Motion, Radius, shadow } from "@/constants/theme";
import { Pressable, StyleSheet, View } from "react-native";

import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { PressableScale } from "@/components/ui/PressableScale";
import React from "react";
import { SheetManager } from "react-native-actions-sheet";
import { ThemedText } from "@/components/themed-text";
import { haptic } from "@/components/ui/PressableScale";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/hooks/use-theme";

const TAB_ICONS: Record<string, IconName> = {
  today: "sun",
  slate: "stack",
  history: "calendarDots",
  settings: "gear",
};

const BAR_HEIGHT = 64;

/** Bottom padding screens need so their last row clears the floating bar */
export function useTabBarSpace() {
  const insets = useSafeAreaInsets();
  return BAR_HEIGHT + Math.max(insets.bottom, 12) + 24;
}

export function TabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { colors, scheme } = useTheme();
  const insets = useSafeAreaInsets();
  const routes = state.routes;
  const half = Math.ceil(routes.length / 2);

  const openAdd = () => {
    const current = routes[state.index]?.name;
    SheetManager.show("add-edit-modal", {
      payload: { mode: "add", type: current === "slate" ? "task" : undefined },
    });
  };

  const renderTab = (route: (typeof routes)[number], index: number) => {
    const focused = state.index === index;
    const { options } = descriptors[route.key];
    const label = (options.title ?? route.name) as string;
    const onPress = () => {
      const event = navigation.emit({
        type: "tabPress",
        target: route.key,
        canPreventDefault: true,
      });
      if (!focused && !event.defaultPrevented) {
        haptic("selection");
        navigation.navigate(route.name, route.params);
      }
    };
    return (
      <TabButton
        key={route.key}
        label={label}
        icon={TAB_ICONS[route.name] ?? "sun"}
        focused={focused}
        onPress={onPress}
      />
    );
  };

  return (
    <View
      pointerEvents="box-none"
      style={[styles.wrap, { paddingBottom: Math.max(insets.bottom - 6, 12) }]}
    >
      <View
        style={[
          styles.bar,
          { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
          shadow(scheme, 3),
        ]}
      >
        {routes.slice(0, half).map((r, i) => renderTab(r, i))}
        <PressableScale
          onPress={openAdd}
          haptics="medium"
          scaleTo={0.9}
          accessibilityRole="button"
          accessibilityLabel="Add a task or habit"
          style={[styles.add, { backgroundColor: colors.primary }, shadow(scheme, 2)]}
        >
          <Icon name="plus" size={26} color={colors.onPrimary} weight="bold" />
        </PressableScale>
        {routes.slice(half).map((r, i) => renderTab(r, i + half))}
      </View>
    </View>
  );
}

function TabButton({
  label,
  icon,
  focused,
  onPress,
}: {
  label: string;
  icon: IconName;
  focused: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const pillStyle = useAnimatedStyle(() => ({
    opacity: withTiming(focused ? 1 : 0, { duration: Motion.normal }),
    transform: [{ scale: withSpring(focused ? 1 : 0.6, Motion.spring) }],
  }));

  return (
    <Pressable
      onPress={onPress}
      style={styles.tab}
      accessibilityRole="tab"
      accessibilityState={{ selected: focused }}
      accessibilityLabel={label}
    >
      <View style={styles.iconWrap}>
        <Animated.View
          style={[styles.pill, { backgroundColor: colors.primarySoft }, pillStyle]}
        />
        <Icon
          name={icon}
          size={23}
          color={focused ? colors.primary : colors.textTertiary}
          weight={focused ? "duotone" : "regular"}
          duotoneOpacity={0.3}
        />
      </View>
      <ThemedText
        type="eyebrow"
        style={[styles.label, { color: focused ? colors.primary : colors.textTertiary }]}
      >
        {label}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
  },
  bar: {
    height: BAR_HEIGHT,
    borderRadius: Radius.xxl,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    height: "100%",
  },
  iconWrap: {
    width: 48,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  pill: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: Radius.pill,
  },
  label: {
    fontSize: 9.5,
    letterSpacing: 0.8,
  },
  add: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 6,
  },
});
