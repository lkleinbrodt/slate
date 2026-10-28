import { Text, type TextProps } from "react-native";

import { type ColorName, Type, type TypeName } from "@/constants/theme";
import { useThemeColor } from "@/hooks/use-theme-color";

// Names from before the redesign, kept so older call sites still read well
const legacy = {
  h1: "display",
  h2: "title",
  h3: "title",
  h4: "heading",
  captionSemiBold: "captionMedium",
  label: "eyebrow",
} as const satisfies Record<string, TypeName>;

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: TypeName | keyof typeof legacy;
  /** Theme color for the text; defaults to `text` */
  tone?: ColorName;
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = "body",
  tone = "text",
  ...rest
}: ThemedTextProps) {
  const color = useThemeColor({ light: lightColor, dark: darkColor }, tone);
  const typeName: TypeName = type in legacy ? legacy[type as keyof typeof legacy] : (type as TypeName);

  return <Text style={[{ color }, Type[typeName], style]} {...rest} />;
}
