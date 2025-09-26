Tech Context

Stack

- Framework: Expo (SDK 54)
- Navigation: expo‑router (single-page design)
- Database: expo‑sqlite with Drizzle ORM; MMKV for fast prefs/meta
- Dates: dayjs
- State: zustand with granular selectors
- Animations: react‑native‑reanimated, react‑native‑gesture‑handler, lottie‑react‑native
- Haptics: expo‑haptics
- Notifications: expo‑notifications (UI ready, functionality placeholder)
- Files: expo‑file‑system, expo‑document‑picker (UI ready, functionality placeholder)
- Styling: Custom StyleSheet with shared utilities; supports light/dark
- Icons: @expo/vector‑icons
- Testing: Jest + @testing‑library/react‑native (not yet implemented)

Local development

- Platform: iOS primary (single device). Use Simulator or a physical device via Expo Go or dev builds.
- Run: `npx expo start` from repo root.

Directory shape (current implementation)

- `app/` for main screens (index.tsx, settings.tsx, \_layout.tsx)
- `components/` for presentational primitives and shared UI components
- `lib/db/` for SQLite init/migrations and DAL with Drizzle ORM
- `lib/stores/` for Zustand state management slices
- `lib/utils/` for utility functions (clock, styles, dateFormat, errorHandling)
- `constants/` for theme and app constants
- `hooks/` for custom React hooks (useModal, useHabitStreaks, etc.)

Constraints & conventions

- All data remains on device; no network calls.
- Store day‑logic dates as `YYYY‑MM‑DD` (local) and timestamps as ISO with TZ.
- Use Drizzle ORM for type-safe database operations; wrap multi‑step writes in transactions.
- Prefer explicit, typed helper functions in the DAL; avoid leaking SQL into components.
- Use granular Zustand selectors for performance optimization.
- Consolidate common styles in shared utilities to reduce duplication.

Build & release (later)

- EAS build for iOS when ready; no server credentials required.
