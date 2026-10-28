import { LogBox } from "react-native";

// Imported first by index.js so it runs before the modules that trigger it.
// Known, harmless store cycles (timeStore <-> appStore/notifications).
LogBox.ignoreLogs(["Require cycle:"]);
