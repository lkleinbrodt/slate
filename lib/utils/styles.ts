/**
 * Shared styling utilities and common style patterns
 */

import { COLORS, COMPONENTS, UI } from "@/lib/constants/app";

import { StyleSheet } from "react-native";

/**
 * Common button styles
 */
export const buttonStyles = StyleSheet.create({
  primary: {
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: COMPONENTS.BUTTON.PADDING_HORIZONTAL,
    paddingVertical: COMPONENTS.BUTTON.PADDING_VERTICAL,
    borderRadius: COMPONENTS.BUTTON.BORDER_RADIUS,
    height: COMPONENTS.BUTTON.HEIGHT,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryText: {
    color: COLORS.TEXT.INVERSE,
    fontWeight: "600",
    fontSize: UI.FONT_SIZE.LG,
  },
  secondary: {
    backgroundColor: COLORS.GRAY[100],
    paddingHorizontal: COMPONENTS.BUTTON.PADDING_HORIZONTAL,
    paddingVertical: COMPONENTS.BUTTON.PADDING_VERTICAL,
    borderRadius: COMPONENTS.BUTTON.BORDER_RADIUS,
    height: COMPONENTS.BUTTON.HEIGHT,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryText: {
    color: COLORS.TEXT.SECONDARY,
    fontWeight: "600",
    fontSize: UI.FONT_SIZE.LG,
  },
  disabled: {
    backgroundColor: COLORS.GRAY[300],
  },
  disabledText: {
    color: COLORS.TEXT.TERTIARY,
  },
});

/**
 * Common input styles
 */
export const inputStyles = StyleSheet.create({
  base: {
    borderWidth: COMPONENTS.INPUT.BORDER_WIDTH,
    borderColor: COLORS.GRAY[300],
    borderRadius: COMPONENTS.INPUT.BORDER_RADIUS,
    paddingHorizontal: COMPONENTS.INPUT.PADDING_HORIZONTAL,
    paddingVertical: COMPONENTS.INPUT.PADDING_VERTICAL,
    fontSize: UI.FONT_SIZE.LG,
    height: COMPONENTS.INPUT.HEIGHT,
  },
  error: {
    borderColor: COLORS.ERROR,
    backgroundColor: "#FEF2F2",
  },
  errorText: {
    color: COLORS.ERROR,
    fontSize: UI.FONT_SIZE.SM,
    marginTop: UI.SPACING.XS,
  },
});

/**
 * Common modal styles
 */
export const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND.MODAL_OVERLAY,
    justifyContent: "center",
    alignItems: "center",
    padding: UI.SPACING.XL,
  },
  container: {
    backgroundColor: COLORS.BACKGROUND.PRIMARY,
    borderRadius: UI.BORDER_RADIUS.XXL,
    padding: UI.SPACING.XL,
    maxWidth: UI.MODAL.MAX_WIDTH,
    width: UI.MODAL.WIDTH_PERCENTAGE,
    maxHeight: UI.MODAL.MAX_HEIGHT_PERCENTAGE,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: UI.SPACING.XL,
  },
  title: {
    fontSize: UI.FONT_SIZE.XL,
    fontWeight: "600",
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.GRAY[100],
    justifyContent: "center",
    alignItems: "center",
  },
  closeButtonText: {
    fontSize: UI.FONT_SIZE.LG,
    color: COLORS.TEXT.SECONDARY,
    fontWeight: "600",
  },
});

/**
 * Common list item styles
 * Note: These styles use hardcoded colors and should be used with ThemedText components
 * for proper theme support. The text colors are handled by ThemedText component.
 */
export const listItemStyles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: UI.SPACING.MD,
    paddingHorizontal: UI.SPACING.XS,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY[100],
    gap: UI.SPACING.SM,
  },
  content: {
    flex: 1,
    marginLeft: UI.SPACING.MD,
  },
  text: {
    fontSize: UI.FONT_SIZE.LG,
    // Color is handled by ThemedText component
  },
  completedText: {
    textDecorationLine: "line-through",
    opacity: 0.6,
  },
  secondaryText: {
    fontSize: UI.FONT_SIZE.SM,
    color: COLORS.ERROR,
    fontWeight: "500",
    marginTop: UI.SPACING.XS,
  },
});

/**
 * Common empty state styles
 * Note: These styles use hardcoded colors and should be used with ThemedText components
 * for proper theme support. The text colors are handled by ThemedText component.
 */
export const emptyStateStyles = StyleSheet.create({
  container: {
    padding: UI.SPACING.XXXL,
    alignItems: "center",
  },
  text: {
    marginTop: UI.SPACING.SM,
    textAlign: "center",
    opacity: 0.7,
    fontSize: UI.FONT_SIZE.LG,
    // Color is handled by ThemedText component
  },
  subsection: {
    padding: UI.SPACING.XL,
    alignItems: "center",
    backgroundColor: COLORS.GRAY[50],
    borderRadius: UI.BORDER_RADIUS.MD,
    marginVertical: UI.SPACING.SM,
  },
  subsectionText: {
    fontSize: UI.FONT_SIZE.MD,
    opacity: 0.6,
    fontStyle: "italic",
    // Color is handled by ThemedText component
  },
});

/**
 * Common progress styles
 */
export const progressStyles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: UI.SPACING.SM,
  },
  bar: {
    flex: 1,
    height: COMPONENTS.PROGRESS.HEIGHT,
    backgroundColor: COLORS.GRAY[200],
    borderRadius: COMPONENTS.PROGRESS.BORDER_RADIUS,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    backgroundColor: COLORS.PRIMARY,
    borderRadius: COMPONENTS.PROGRESS.BORDER_RADIUS,
  },
  text: {
    fontSize: UI.FONT_SIZE.SM,
    fontWeight: "600",
    color: COLORS.TEXT.SECONDARY,
    minWidth: 40,
    textAlign: "right",
  },
});

/**
 * Common badge styles
 */
export const badgeStyles = StyleSheet.create({
  streak: {
    backgroundColor: COMPONENTS.STREAK_BADGE.BACKGROUND,
    paddingHorizontal: COMPONENTS.STREAK_BADGE.PADDING_HORIZONTAL,
    paddingVertical: COMPONENTS.STREAK_BADGE.PADDING_VERTICAL,
    borderRadius: COMPONENTS.STREAK_BADGE.BORDER_RADIUS,
    marginLeft: UI.SPACING.SM,
  },
  streakText: {
    fontSize: UI.FONT_SIZE.SM,
    fontWeight: "600",
    color: COMPONENTS.STREAK_BADGE.TEXT_COLOR,
  },
});

/**
 * Helper function to create consistent spacing
 */
export function createSpacing(multiplier: number = 1) {
  return UI.SPACING.MD * multiplier;
}

/**
 * Helper function to create consistent border radius
 */
export function createBorderRadius(size: "sm" | "md" | "lg" | "xl" = "md") {
  const radiusMap = {
    sm: UI.BORDER_RADIUS.SM,
    md: UI.BORDER_RADIUS.MD,
    lg: UI.BORDER_RADIUS.LG,
    xl: UI.BORDER_RADIUS.XL,
  };
  return radiusMap[size];
}
