import { useRouter } from "expo-router";
import { useEffect } from "react";
import { SheetManager } from "react-native-actions-sheet";

// slate://add — opened by the widget's "+" and the New Task control. Lands on
// Today with the add sheet open, same as the tab bar's "+" there.
export default function Add() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/today");
    SheetManager.show("add-edit-modal", { payload: { mode: "add" } });
  }, [router]);

  return null;
}
