import type { Icon as PhosphorIcon, IconWeight } from "phosphor-react-native";

import { type ColorName } from "@/constants/theme";
import React from "react";
import { useThemeColor } from "@/hooks/use-theme-color";

// Phosphor icons (MIT). Required one by one: the package index pulls in all
// ~1,500 icons, which would bloat the bundle and every OTA update.
/* eslint-disable @typescript-eslint/no-require-imports */
const icons = {
  sun: require("phosphor-react-native/lib/commonjs/icons/Sun").SunIcon,
  sunHorizon: require("phosphor-react-native/lib/commonjs/icons/SunHorizon").SunHorizonIcon,
  moon: require("phosphor-react-native/lib/commonjs/icons/Moon").MoonIcon,
  moonStars: require("phosphor-react-native/lib/commonjs/icons/MoonStars").MoonStarsIcon,
  stack: require("phosphor-react-native/lib/commonjs/icons/Stack").StackIcon,
  calendar: require("phosphor-react-native/lib/commonjs/icons/CalendarBlank").CalendarBlankIcon,
  calendarDots: require("phosphor-react-native/lib/commonjs/icons/CalendarDots").CalendarDotsIcon,
  calendarCheck: require("phosphor-react-native/lib/commonjs/icons/CalendarCheck").CalendarCheckIcon,
  gear: require("phosphor-react-native/lib/commonjs/icons/GearSix").GearSixIcon,
  plus: require("phosphor-react-native/lib/commonjs/icons/Plus").PlusIcon,
  tray: require("phosphor-react-native/lib/commonjs/icons/Tray").TrayIcon,
  dots: require("phosphor-react-native/lib/commonjs/icons/DotsThree").DotsThreeIcon,
  arrowUpRight: require("phosphor-react-native/lib/commonjs/icons/ArrowUpRight").ArrowUpRightIcon,
  arrowRight: require("phosphor-react-native/lib/commonjs/icons/ArrowRight").ArrowRightIcon,
  flag: require("phosphor-react-native/lib/commonjs/icons/Flag").FlagIcon,
  link: require("phosphor-react-native/lib/commonjs/icons/Link").LinkIcon,
  fire: require("phosphor-react-native/lib/commonjs/icons/Fire").FireIcon,
  check: require("phosphor-react-native/lib/commonjs/icons/Check").CheckIcon,
  x: require("phosphor-react-native/lib/commonjs/icons/X").XIcon,
  trash: require("phosphor-react-native/lib/commonjs/icons/Trash").TrashIcon,
  bell: require("phosphor-react-native/lib/commonjs/icons/Bell").BellIcon,
  clock: require("phosphor-react-native/lib/commonjs/icons/Clock").ClockIcon,
  repeat: require("phosphor-react-native/lib/commonjs/icons/Repeat").RepeatIcon,
  checkCircle: require("phosphor-react-native/lib/commonjs/icons/CheckCircle").CheckCircleIcon,
  sparkle: require("phosphor-react-native/lib/commonjs/icons/Sparkle").SparkleIcon,
  pencil: require("phosphor-react-native/lib/commonjs/icons/PencilSimple").PencilSimpleIcon,
  caretLeft: require("phosphor-react-native/lib/commonjs/icons/CaretLeft").CaretLeftIcon,
  caretRight: require("phosphor-react-native/lib/commonjs/icons/CaretRight").CaretRightIcon,
  caretDown: require("phosphor-react-native/lib/commonjs/icons/CaretDown").CaretDownIcon,
  leaf: require("phosphor-react-native/lib/commonjs/icons/Leaf").LeafIcon,
  plant: require("phosphor-react-native/lib/commonjs/icons/Plant").PlantIcon,
  trophy: require("phosphor-react-native/lib/commonjs/icons/Trophy").TrophyIcon,
  star: require("phosphor-react-native/lib/commonjs/icons/Star").StarIcon,
  note: require("phosphor-react-native/lib/commonjs/icons/Note").NoteIcon,
  listChecks: require("phosphor-react-native/lib/commonjs/icons/ListChecks").ListChecksIcon,
  database: require("phosphor-react-native/lib/commonjs/icons/Database").DatabaseIcon,
} satisfies Record<string, PhosphorIcon>;
/* eslint-enable @typescript-eslint/no-require-imports */

export type IconName = keyof typeof icons;

export interface IconProps {
  name: IconName;
  size?: number;
  /** A theme color name, or any color string */
  color?: ColorName | (string & {});
  weight?: IconWeight;
  duotoneColor?: string;
  duotoneOpacity?: number;
}

export function Icon({
  name,
  size = 22,
  color = "text",
  weight = "regular",
  duotoneColor,
  duotoneOpacity,
}: IconProps) {
  const themed = useThemeColor({}, color as ColorName);
  const Component = icons[name] as PhosphorIcon;
  const resolved = themed ?? color;
  return (
    <Component
      size={size}
      color={resolved}
      weight={weight}
      duotoneColor={duotoneColor ?? resolved}
      duotoneOpacity={duotoneOpacity ?? 0.22}
    />
  );
}
