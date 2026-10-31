import * as SecureStore from "expo-secure-store";

// Slate's OpenRouter key, for turning a call's transcript into a plan. It lives in the iOS
// Keychain, never in the database, the code or an OTA bundle; Landon pastes it once in
// Settings → Voice. Use a key of its own with a spending limit, so it can be revoked alone.

const OPENROUTER_KEY = "openrouter_api_key";

export const getOpenRouterKey = () => SecureStore.getItemAsync(OPENROUTER_KEY);

export async function setOpenRouterKey(key: string | null): Promise<void> {
  if (key) {
    // Readable after the first unlock, so a call finishing with the screen locked can still plan
    await SecureStore.setItemAsync(OPENROUTER_KEY, key, { keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK });
  } else {
    await SecureStore.deleteItemAsync(OPENROUTER_KEY);
  }
}
