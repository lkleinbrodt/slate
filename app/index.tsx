import { Redirect } from "expo-router";

// Slate opens on Today
export default function Index() {
  return <Redirect href="/today" />;
}
