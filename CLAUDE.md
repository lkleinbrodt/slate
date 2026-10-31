# Slate

Personal local-first iOS to-do + habit app (Expo SDK 54, expo-router, drizzle over
expo-sqlite). No backend and no env vars; the one secret is an OpenRouter key in the phone's
Keychain (voice). Read `README.md` (concepts, shipping) and `docs/architecture.md` (layout,
day/rollover logic, migrations) before changing logic.

**Voice** (plan the day by talking to a character through Threepio, the voice service on
chewy at `~/Projects/threepio`): `docs/voice.md` has the plan, what's built, and a handoff
for the next step. Code is under `lib/voice/`.

## Commands (chewy)

```bash
npm ci
npm test               # logic tests, in-memory better-sqlite3 (no device needed)
npx tsc --noEmit && npm run lint
npm run update -- "what changed"   # OTA to channel `production`
```

## Git

`main` is protected on GitHub: every change goes through a PR. Branch from a freshly
fetched `origin/main`, open a PR, and merge with a merge commit (not squash) when Landon
says so. Then `git fetch && git merge --ff-only origin/main` locally.

## Shipping

- **JS/TS-only change → OTA**, from chewy: `npm run update -- "msg"`. The script refuses to
  run off `main` or with a dirty tree (the update bundles the working tree). Phone gets it
  on relaunch, or Settings → Developer → Check for updates. Publishing is outward-facing:
  ask before running it unless Landon asked for the ship. The script skips EAS's project
  fingerprint (`@expo/fingerprint` 0.15 crashes on the light/dark/tinted icon); that's fine,
  `runtimeVersion` decides which builds get an update.
- **Native change** (native module, icon/splash, app.json native config) → bump `version`
  in `app.json` (runtimeVersion policy is `appVersion`, so OTAs only reach builds of the
  same version) and rebuild on the Mac **airlandon**. Builds, Xcode and Apple credentials
  can't be done here; hand Landon the command. See user skill `expo-eas-linux`.
- Never edit a shipped migration in `lib/db/migrations.ts`; append a new one.
