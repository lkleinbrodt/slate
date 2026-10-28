// Learn more https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// timeStore and the stores/services it imports reference each other only at
// runtime, so these cycles are harmless; don't warn about them in dev.
config.resolver.requireCycleIgnorePatterns = [
  ...(config.resolver.requireCycleIgnorePatterns ?? []),
  /lib\/stores\/timeStore\.ts$/,
];

module.exports = config;
