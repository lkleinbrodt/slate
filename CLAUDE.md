# Slate

Personal local-first iOS to-do + habit app (Expo SDK 54, expo-router, drizzle over
expo-sqlite). No backend, no env vars, no secrets. Read `README.md` (concepts, shipping)
and `docs/architecture.md` (layout, day/rollover logic, migrations) before changing logic.

## Commands (chewy)

```bash
npm ci
npm test               # logic tests, in-memory better-sqlite3 (no device needed)
npx tsc --noEmit && npm run lint
npm run update -- "what changed"   # OTA to channel `production`
```

## Shipping

- **JS/TS-only change → OTA**, from chewy: `npm run update -- "msg"`. The script refuses to
  run off `main` or with a dirty tree (the update bundles the working tree). Phone gets it
  on relaunch, or Settings → Developer → Check for updates. Publishing is outward-facing:
  ask before running it unless Landon asked for the ship.
- **Native change** (native module, icon/splash, app.json native config) → bump `version`
  in `app.json` (runtimeVersion policy is `appVersion`, so OTAs only reach builds of the
  same version) and rebuild on the Mac **airlandon**. Builds, Xcode and Apple credentials
  can't be done here; hand Landon the command. See user skill `expo-eas-linux`.
- Never edit a shipped migration in `lib/db/migrations.ts`; append a new one.
