Tech Context

Stack

- Framework: Expo (SDK 54)
- Navigation: expo‑router (four-tab navigation)
- Database: expo‑sqlite with Drizzle ORM; expo-sqlite/kv-store for fast prefs/meta
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

- `app/` for main screens and navigation
  - `app/(tabs)/` for tab-based navigation (Today, Slate, History, Settings)
  - `app/(tabs)/history/[date].tsx` for dynamic day details
- `components/` for presentational primitives and shared UI components
  - `components/planner/` for modular planner components
  - `components/celebration/` for celebration animations and effects
  - `components/history/` for history-specific components
- `lib/logic/` for business logic and repository pattern
  - `lib/logic/repo.ts` - Single interface for all database operations
  - `lib/logic/dates.ts` - Date utilities with dayjs
  - `lib/logic/rollover.ts` - Day boundary handling and rollover logic
  - `lib/logic/streaks.ts` - Habit streak calculations
- `lib/db/` for SQLite schema and connection
  - `lib/db/schema.ts` - Drizzle ORM schema definitions
  - `lib/db/connection.ts` - Database initialization and connection
- `lib/stores/` for Zustand state management slices
  - `lib/stores/appStore.ts` - Main application state
  - `lib/stores/settings.ts` - Settings and preferences
  - `lib/stores/historyStore.ts` - History and calendar data
- `lib/utils/` for utility functions (styles, dateFormat, errorHandling)
- `constants/` for theme and app constants
- `hooks/` for custom React hooks (useModal, use-color-scheme, etc.)

Constraints & conventions

- All data remains on device; no network calls.
- Store day‑logic dates as `YYYY‑MM‑DD` (local) and timestamps as ISO with TZ.
- Use Drizzle ORM for type-safe database operations; wrap multi‑step writes in transactions.
- Repository pattern: Single interface (`lib/logic/repo.ts`) for all database operations.
- Use granular Zustand selectors for performance optimization.
- Consolidate common styles in shared utilities to reduce duplication.
- Immutable history: All user actions recorded in `habit_history` and `task_history` tables.

Build & release (later)

- EAS build for iOS when ready; no server credentials required.

Database schema (V2)

- **Core Tables**:

  - `tasks` - Status-based task management with dependencies
  - `habits` - Simplified habit management with active field
  - `habit_completions` - Live state for current day habit completions
  - `habit_history` - Immutable history for all habit completions
  - `task_history` - Immutable history for all task completions
  - `app_settings` - Key-value storage for preferences

- **Key Features**:
  - Immutable history tables for complete audit trail
  - Status-based task completion (`open`, `done`, `archived`)
  - Task dependencies with self-referencing foreign keys
  - Automatic rollover with task carryover
  - Streak calculation from immutable history

Storage architecture

- **Primary Storage**: SQLite database for all relational data
- **Key-Value Storage**: expo-sqlite/kv-store for preferences and rollover state
- **No External Dependencies**: Single storage solution eliminates MMKV dependency
- **Consistency**: All data uses same SQLite engine for optimal performance

State management

- **Repository Pattern**: Clean separation between data access and business logic
- **Zustand Stores**: Granular selectors for optimal performance
- **Type Safety**: Full TypeScript integration with Drizzle ORM
- **Immutable History**: Complete audit trail for all user actions

Dependencies (current)

- **Core**: Expo SDK 54, React Native 0.81.4, React 19.1.0
- **Navigation**: expo-router, @react-navigation/native, @react-navigation/bottom-tabs
- **Database**: expo-sqlite, drizzle-orm, drizzle-kit, better-sqlite3
- **State**: zustand
- **Dates**: dayjs
- **Animations**: react-native-reanimated, react-native-gesture-handler, lottie-react-native
- **UI**: @expo/vector-icons, react-native-calendars, react-native-modal, react-native-actions-sheet
- **Haptics**: expo-haptics
- **Notifications**: expo-notifications
- **Files**: expo-file-system, expo-document-picker
- **Celebrations**: react-native-confetti-cannon
- **Audio**: expo-audio
- **Additional**: @lottiefiles/dotlottie-react, react-native-worklets
