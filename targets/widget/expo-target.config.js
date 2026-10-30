// Home Screen + Lock Screen widget. Reads the snapshot the app writes to the
// App Group (lib/services/widget.ts); see Snapshot.swift.
/** @type {import('@bacons/apple-targets/app.plugin').ConfigFunction} */
module.exports = (config) => ({
  type: "widget",
  name: "SlateWidget",
  displayName: "Slate",
  bundleIdentifier: ".widget",
  // containerBackground and the Lock Screen families need iOS 17
  deploymentTarget: "17.0",
  colors: {
    // Colors from constants/theme.ts
    $widgetBackground: { light: "#F4EEE3", dark: "#181A1E" },
    $accent: { light: "#D2632F", dark: "#EE7E47" },
    slateBackground: { light: "#F4EEE3", dark: "#181A1E" },
    slateText: { light: "#2B2620", dark: "#F1ECE3" },
    slateTextSecondary: { light: "#6E655A", dark: "#B2ABA0" },
    slatePrimary: { light: "#D2632F", dark: "#EE7E47" },
    slateHabit: { light: "#5F8A66", dark: "#8DB892" },
    slateHabitSoft: { light: "#DCE6D6", dark: "#243028" },
  },
  entitlements: {
    "com.apple.security.application-groups":
      config.ios.entitlements["com.apple.security.application-groups"],
  },
});
