import { useRouter } from "expo-router";
import { useEffect } from "react";

// slate://add — opened by the widget's "+" and the New Task control. Lands on
// Today, which opens the add sheet (same as the tab bar's "+" there).
// Today opens it rather than this screen: on a cold start the root layout
// (and its SheetProvider) remounts right after this screen mounts, which
// would drop a sheet shown from here.
export default function Add() {
  const router = useRouter();

  useEffect(() => {
    router.replace({ pathname: "/today", params: { add: "1" } });
  }, [router]);

  return null;
}
