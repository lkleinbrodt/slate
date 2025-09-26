# Codebase Summary

## Project: slate

### File Tree (relevant files)

```
slate/
├── .cursor/
    └── rules/
        └── memory-bank.mdc
├── app/
    ├── (tabs)/
        ├── _layout.tsx
        ├── history.tsx
        ├── index.tsx
        └── settings.tsx
    ├── _layout.tsx
    └── modal.tsx
├── assets/
    └── lottie/
        └── perfect-day-badge.json
├── components/
    ├── celebration/
        ├── CheckMorph.tsx
        ├── ConfettiCannon.tsx
        ├── index.ts
        ├── LevelUpAnimation.tsx
        ├── PerfectDayCelebration.tsx
        ├── README.md
        └── TapWin.tsx
    ├── history/
        ├── DayDetailsModal.tsx
        ├── HabitStreaksSection.tsx
        ├── HistoryCalendar.tsx
        └── HistoryHeader.tsx
    ├── planner/
        ├── HabitsSection.tsx
        ├── index.ts
        ├── PlannerHeader.tsx
        ├── SlateSection.tsx
        └── TodayTasksSection.tsx
    ├── shared/
        └── TabHeader.tsx
    ├── ui/
        ├── collapsible.tsx
        ├── icon-symbol.ios.tsx
        └── icon-symbol.tsx
    ├── AddButton.tsx
    ├── CheckableListItem.tsx
    ├── Confetti.tsx
    ├── ConfirmationDialog.tsx
    ├── CustomDatePicker.tsx
    ├── external-link.tsx
    ├── FloatingModal.tsx
    ├── HabitItem.tsx
    ├── haptic-tab.tsx
    ├── hello-wave.tsx
    ├── parallax-scroll-view.tsx
    ├── PerfectDayModal.tsx
    ├── ProgressTracker.tsx
    ├── safe-area-themed-view.tsx
    ├── SlateItem.tsx
    ├── TaskItem.tsx
    ├── themed-text.tsx
    ├── themed-view.tsx
    ├── types.ts
    └── UnifiedAddModal.tsx
├── constants/
    └── theme.ts
├── hooks/
    ├── use-color-scheme.ts
    ├── use-color-scheme.web.ts
    ├── use-theme-color.ts
    ├── useHabitStreaks.ts
    ├── useModal.ts
    ├── usePerfectDay.ts
    ├── usePlanner.ts
    └── useTaskCompletion.ts
├── lib/
    ├── app/
        └── init.ts
    ├── constants/
        └── app.ts
    ├── db/
        ├── connection.ts
        ├── dal.ts
        └── schema.ts
    ├── stores/
        ├── baseStore.ts
        ├── dayPlan.ts
        ├── habits.ts
        ├── historyStore.ts
        ├── settings.ts
        ├── storeFactory.ts
        └── tasks.ts
    ├── types/
        └── common.ts
    └── utils/
        ├── clock.ts
        ├── dateFormat.ts
        ├── errorHandling.ts
        └── styles.ts
├── memory-bank/
    ├── activeContext.md
    ├── implementationStatus.md
    ├── productContext.md
    ├── progress.md
    ├── projectBrief.md
    ├── systemPatterns.md
    └── techContext.md
├── scripts/
    └── reset-project.js
├── .gitignore
├── app.json
├── eas.json
├── eslint.config.js
├── MAINTENANCE.md
├── package.json
├── PLACEHOLDERS.md
├── plan.md
└── README.md
```

### File Summaries

#### .cursor/rules/memory-bank.mdc

The file `memory-bank.mdc` outlines the structure and importance of a documentation system known as the Memory Bank, utilized by a software engineer named Cline, who has a unique memory reset feature affecting every session. This documentation is critical for ensuring project continuity and understanding, as Cline relies exclusively on it to guide his work after each reset. 

The Memory Bank consists of core Markdown files that articulate the project's foundation, context, current focus, system architecture, technology specifics, and progress. Key files include `projectbrief.md`, `productContext.md`, and `activeContext.md`, among others. 

The document emphasizes workflows for planning and execution, stipulating that documentation must be updated regularly, especially when new patterns emerge or significant changes are made. The structured approach ensures clarity and consistency across tasks. This file is integral to the project, providing a framework for maintaining operational knowledge and guiding Cline's efforts as he navigates his work.

#### .gitignore

The .gitignore file specifies a set of patterns for files and directories that should be ignored by Git during version control. It includes common directories related to dependencies, such as node_modules, and excludes builds and configurations from Expo, native builds, and Metro-specific files. 

This file is crucial as it prevents unwanted files from being tracked, ensuring a cleaner and more streamlined repository. It helps to maintain only the necessary source code and configuration files, reducing clutter and avoiding potential conflicts or sensitive information leaks. 

The .gitignore's entries relate to other parts of the project by identifying which generated or environment-specific files to discard, thereby supporting development practices that rely on clean working directories. Key aspects include ignoring local environment files (.env*.local) and build artifacts (dist/, web-build/, /ios, /android) while explicitly mentioning typescript build info (*.tsbuildinfo). 

No functions or classes are defined, as this file solely serves a configuration purpose. There are no notable side effects since its main role is to dictate what Git tracks or ignores.

#### MAINTENANCE.md

The MAINTENANCE.md file provides a comprehensive maintenance guide for the Slate app, outlining best practices for maintaining and extending the application effectively. It emphasizes file organization, covering core files, components, and business logic, which aids developers in navigating the codebase. 

Key imports include various app components and utilities for state management and database operations. This guide is crucial for ensuring consistency and quality as it delineates processes for adding features, managing the database, executing UI changes, and optimizing performance. 

Main sections highlight common tasks, debugging strategies, testing frameworks, and update procedures, emphasizing a proactive approach to maintenance. The document also addresses security considerations, focusing on data protection and user privacy.

Notable side effects include user experience optimizations through performance monitoring and ensuring accessibility compliance. The checklist for weekly, monthly, and quarterly tasks reinforces a structured approach to ongoing app health. Overall, it integrates seamlessly into the broader project, ensuring developers can uphold the app's engaging, user-centered design.

#### PLACEHOLDERS.md

PLACEHOLDERS.md serves as a comprehensive inventory of placeholders and TODO items for the Slate app, outlining incomplete features that require development. Its significance lies in guiding developers on high-priority tasks needed to enhance app functionality and user experience.

The document details several key areas, including a Celebration System, Export/Import functionality, Notifications, and Accessibility improvements, all aimed at refining the application’s core features. Each section specifies its location in the codebase, the current status, and necessary implementation actions.

Noteworthy imports/exports involve various sound effects and Lottie animations, while main functions include sound playback integration and user notification settings. 

It connects to the project by ensuring that essential features are not overlooked, paving the way for future enhancements such as cloud sync and calendar integration. The outlined placeholders also include technical aspects like error handling and performance optimization, ensuring a robust and user-friendly application. Overall, this document is crucial for the ongoing development and refinement of the Slate app.

#### README.md

The README.md file provides an overview of the Slate app, a local-first iOS productivity tool that integrates task management and habit tracking. It emphasizes user-friendly features that allow individuals to organize and prioritize tasks and habits seamlessly within a single interface. 

Key functionalities include adding tasks and habits, planning daily activities, checking off completed items with visual rewards, tracking habit streaks, and auto-carryover of unfinished tasks. The installation and startup instructions guide users to set up the app via npm.

Slate is designed to maintain user data locally, ensuring privacy and accessibility. It is built using Expo, React Native, and SQLite, with a structure that separates main screens, UI components, and utility libraries.

This file is crucial for onboarding and familiarizing users with Slate's capabilities, which enhances overall project usability. The well-defined features and project structure outlined foster an efficient development and user experience.

#### app/(tabs)/_layout.tsx

The file `_layout.tsx` defines a tab layout component for a React Native application using Expo Router. It creates a navigation structure with three tabs: "Your Slate," "History," and "Settings," each associated with respective screens. The file is important as it establishes the primary user interface for navigating different sections of the app.

Key components include the `TabLayout` function, which utilizes the `Tabs` component from Expo Router to manage navigation, and the `TabBarIcon` function, which renders icons using Ionicons based on the specified names. The design considers platform-specific styling (iOS vs. Android) for the tab bar.

This layout is critical for user experience, providing a consistent way to access key features of the app. Notable imports are Ionicons for icons and Platform from React Native for responsive design. The `_layout.tsx` file serves as a foundational UI component that integrates with other parts of the project.

#### app/(tabs)/history.tsx

The file `history.tsx` implements the `HistoryScreen` component for a React Native application. It serves as a user interface for displaying historical data related to habits, including a calendar view, habit streaks, and a detailed day modal. The component is significant as it enhances user engagement by providing insights into their habits over time.

It interacts with the global state through a custom store (`useHistoryStore`), managing loading states and user selections for specific days. The `useEffect` hook ensures that initial data is loaded when the component mounts.

Key exports include the `HistoryScreen` component, while notable imports involve several UI components (e.g., `DayDetailsModal`, `HabitStreaksSection`, `HistoryCalendar`, and `HistoryHeader`) which collectively structure the screen's layout. The file also incorporates a loading indicator to enhance user experience during data fetches.

Styling is managed through the `StyleSheet` API, ensuring a responsive design. Overall, this file fits into a larger project focused on habit tracking and user performance metrics.

#### app/(tabs)/index.tsx

The file `index.tsx` defines the `MainScreen` component for a planner application built with React Native. It serves as the primary interface for users to manage tasks and habits, showcasing today's agenda and allowing edits or additions. This component is significant because it integrates various planning features, providing a centralized hub for user interactions with tasks and habits.

Key imports include UI elements such as `ActivityIndicator`, `ScrollView`, and various planner-related components like `PlannerHeader`, `TodayTasksSection`, and modals for adding or editing items. The component heavily relies on custom hooks (`usePlanner`, `useModal`, `usePerfectDay`, and others) for state management and handling user actions efficiently.

Main functions within the component include `handleStartEditing`, `handleSave`, and `handleDelete` for managing items, while notable side effects involve loading indicators and modal displays that contribute to dynamic user experience. The component is designed to be responsive and user-friendly, promoting habit tracking and task management within the app's ecosystem.

#### app/(tabs)/settings.tsx

The `settings.tsx` file defines the Settings screen for a React Native application, providing users with a user interface to manage various app settings such as reminder times, notifications, and data export/import functionalities. Its importance lies in enhancing user experience by allowing customization of app behavior, which is crucial for user retention and satisfaction.

The file imports components from React Native and other project-specific components, such as `SafeAreaThemedView`, `TabHeader`, and themed text and view components. It leverages a global state management hook (`useSettingsStore`) for managing settings state, including loading and updating settings.

Key exports include the `SettingsScreen` component that encapsulates all UI elements related to settings. Main functionalities include loading settings on mount, handling changes to various settings like day start times and reminders, and user interactions through toggles and buttons. Notable side effects involve triggering alerts for time pickers and updating settings in state.

Overall, this file interacts with the rest of the application by centralizing settings management, making it integral to the app's configuration capabilities.

#### app/_layout.tsx

The file `app/_layout.tsx` defines the main layout component (`RootLayout`) for a React Native application, leveraging Expo and React Navigation. It initializes the app during its first render, checking for readiness and potential errors. This component is crucial as it sets up the app's theme, handles loading states, and provides a structure for navigation.

Key functionalities include leveraging state hooks for initialization status and error handling, displaying an activity indicator while the app loads, and managing light/dark themes based on user preferences. 

The file imports significant modules such as `ActivityIndicator`, `ThemeProvider`, and navigation-related components from React Navigation and Expo, ensuring that the app adheres to safe area guidelines and action sheets.

The `RootLayout` wraps the entire app in necessary providers like `SafeAreaProvider` and `ActionSheetProvider`, creating a cohesive user experience. Notable side effects involve calling asynchronous initialization functions and conditionally rendering error messages or loading indicators. Overall, this file is integral to the application’s start-up process and user interface consistency.

#### app/modal.tsx

The file `app/modal.tsx` defines a React component for a modal screen within a mobile application built using React Native and Expo. The `ModalScreen` function returns a themed view that displays a title and a link for navigation back to the home screen. 

This file is significant because it contributes to the app's user interface by providing a modal that enhances user experience through clear navigation options. It relies on two key imports: `Link` from `expo-router` for navigation and custom components `ThemedText` and `ThemedView` to ensure consistent styling. 

The main function exported is `ModalScreen`, which is responsible for rendering the modal's content and styling, including a flexbox layout defined in the `styles` constant. The notable side effect is the user interface's dynamic behavior; when the "Go to home screen" link is activated, it dismisses the modal and navigates back to the home screen. This modal screen interacts with the broader application structure to handle navigation and theming consistently.

#### app.json

The app.json file serves as the configuration blueprint for the Expo application named "slate," version 1.0.2. It defines critical application properties such as the screen orientation, icon assets, and versioning. The file is essential for setting up both iOS and Android build configurations, including bundle identifiers, tablet support for iOS, and adaptive icons for Android.

This file is central to the project as it integrates with Expo's tools, facilitating the development of cross-platform applications. Important imported plugins include "expo-router" for routing and "expo-splash-screen" for managing the app's splash screen with specific imagery and colors.

Main attributes include support for typed routes and a customizable runtime version policy. Notable side effects involve the configuration of updates via a specified URL, ensuring that users receive the latest app version seamlessly. Overall, this configuration file is vital for ensuring the proper behavior and appearance of the app across different platforms.

#### assets/lottie/perfect-day-badge.json

The file "perfect-day-badge.json" defines a Lottie animation for a "Perfect Day Badge," which is a visually appealing graphic likely used in an application or website. It specifies the animation's version, frame rate, dimensions, and keyframes for multiple layers, including a badge circle and a checkmark. 

This file matters as Lottie files enable developers to use animations that are lightweight and vector-based, enhancing user experience without excessive file sizes. It integrates with other components of the project that require visual feedback or gamification features, such as badges for accomplishments or progress.

The main components include two layers: one for the animated badge circle, which scales and rotates, and another for the checkmark, which fades in over time. No external assets are used. There are significant animations defined within the keyframes for opacity, rotation, and scaling that impact the visual elements during the interaction.

Overall, it's a standalone asset that enriches the project’s user interface.

#### components/AddButton.tsx

The file `AddButton.tsx` defines a React functional component that renders a customizable "+", add action button in a React Native application. It utilizes `TouchableOpacity` for touch interactions and applies styled components for consistent aesthetics, central positioning, and shadow effects. This component enhances user experience by providing a clear interface element for addition tasks, crucial in any app dealing with lists or data entry.

The component imports key libraries from React Native and a custom type definition `AddButtonProps` for type safety, ensuring that the `onPress` prop is provided correctly. The main export is the `AddButton` component itself. Styles are encapsulated within this file, contributing to a coherent style theme across the app.

The `AddButton` integrates with other components in the project, likely triggering functions that add items or perform similar actions, reinforcing the component's role in the overall application workflow. Its minimal yet functional design makes it essential for maintaining user engagement and actionability within the interface.

#### components/CheckableListItem.tsx

The file `CheckableListItem.tsx` defines a React functional component that displays a list item with a toggleable checkmark, indicating completion status. It leverages animations and themes, playing a vital role in enhancing user interaction within a checklist feature of a larger application.

This component matters because it improves user feedback during task completion, promoting engagement through visual cues such as the Level Up animation. It provides a clear interface for toggling items, which is often essential in to-do list or task management applications.

Key imports include `LevelUpAnimation` and `TapWin` for animations and interactive elements, and it utilizes hooks such as `useState` for local state management and `useThemeColor` to adapt styles based on the app's theme.

The main function is `CheckableListItem`, which takes props for completion status, a toggle handler, and child elements. Notably, it triggers an animation only when an item is marked as completed, thereby influencing other components responsible for rendering the checklist.

#### components/Confetti.tsx

The `Confetti.tsx` file defines a React component that displays animated confetti when triggered. It matters for enhancing user experience by providing visual feedback, likely after a successful action in the application. This component leverages the `react-native-reanimated` library for smooth animations and consists of two primary components: `Confetti` and `ConfettiPiece`.

The `Confetti` component controls the display of multiple `ConfettiPiece` components based on the `visible` prop and completes an action callback (`onComplete`) after a delay. It generates an array of confetti pieces with randomized colors and sizes, animating their fall using various transformations.

Key imports include `useAnimatedStyle`, `useSharedValue`, and animation functions from `react-native-reanimated`, showcasing its reliance on this library for creating animations. The file exports the main `Confetti` component, which integrates multiple animated pieces together.

Notable side effects include starting a timer to call `onComplete` and clearing it to prevent memory leaks. Overall, it enhances the project's interactivity and user engagement through visual effects.

#### components/ConfirmationDialog.tsx

The `ConfirmationDialog.tsx` file defines a reusable confirmation dialog component for React Native applications. It allows developers to present users with a modal prompt that can confirm or cancel actions, crucial for tasks requiring user acknowledgment, such as deleting items. 

This component matters because it enhances user experience by providing a standardized interface for critical decisions, ensuring that users are aware of the consequences of their actions. In relation to the project, it serves as a UI element that can be integrated across various screens where user confirmation is needed.

Key imports include `react-native` for UI elements, `react-native-modal` for the modal functionality, and specialized components like `ThemedText` and `ThemedView` for consistent theming. 

The component exports `ConfirmationDialog` as a functional component designed with props for visibility, title, messages, and callback functions for confirmation and cancellation. 

Notable side effects include potential changes in app state based on user interactions with the confirmation buttons. Additionally, it customizes styles based on the application's theme, enhancing overall visual consistency.

#### components/CustomDatePicker.tsx

The `CustomDatePicker.tsx` file defines a React component for selecting dates within a mobile application using React Native. This component is vital for user interface interactions involving date selection, especially for features requiring a due date, enhancing user experience with intuitive calendar controls.

The component imports essential UI elements from React Native (`Modal`, `Calendar`, etc.) and utility functions for date formatting. It exports a functional component consisting of props for visibility, selected date, callbacks for date selection, and closing the modal. 

Key functionalities include:
- Date selection logic, allowing only future dates.
- State management for a temporary selected date.
- Visual representation of marked dates, including today and future selections while disabling past dates.

The component’s styling enhances usability, ensuring it fits within the broader project’s theme, possibly in a scheduling or task management application. Notable side effects include state changes triggered by user interactions (selecting, clearing, or confirming a date).

#### components/FloatingModal.tsx

The `FloatingModal.tsx` file defines a React Native component called `FloatingModal`, which represents a modal that floats over the UI. It is designed to display content conditionally based on the `visible` prop and includes touch handling to dismiss the keyboard when the user taps outside the modal.

This component is significant for enhancing user experience, allowing for interaction without closing the underlying screen, especially in mobile applications. It integrates with the broader project by serving as a reusable component that can be invoked in various parent components needing modal functionality.

Key imports include `Modal` from `react-native-modal` for the modal display, and utilities from `react-native` for handling keyboard and styling. The `modalStyles` import provides a centralized way to manage design consistency.

The main functionalities of `FloatingModal` involve rendering its children within a styled modal and employing keyboard handling. Its notable side effects include keyboard dismissal on background taps, promoting a smooth, distraction-free user interaction. The component is exported as default for easy integration within other modules.

#### components/HabitItem.tsx

The `HabitItem.tsx` file defines a React component that represents an individual habit within a to-do list application built with React Native. This component is crucial for allowing users to view, toggle completion status, and edit their habits, enhancing user interaction and personal habit tracking. 

It imports necessary libraries and components, including styles, a custom list item, and themed text, which facilitate consistent design and behavior within the app. The main export is the `HabitItem` component, which takes props like `habit`, `isCompleted`, `streak`, and callbacks for toggling and editing habits.

Key functions include `handleToggle`, which toggles the completed state of the habit, and `handleEdit`, which initiates editing if not in read-only mode. Notably, it utilizes the `useThemeColor` hook to apply the appropriate icon color based on the current theme. 

Its relationship to the broader project lies in its role in improving user experience through habit management, reliant on the overall state and context provided by the main application.

#### components/PerfectDayModal.tsx

The file `PerfectDayModal.tsx` defines a React functional component called `PerfectDayModal`. This component serves as a modal interface that displays a celebration theme, likely part of a user engagement feature in the application. The modal accepts two props: `visible`, which determines if the modal is displayed, and `onClose`, a callback function to close the modal.

This component is significant as it contributes to user experience by providing a celebratory visual when certain conditions are met, enhancing user interaction within the project. It imports `PerfectDayCelebration`, which likely encapsulates the celebration logic/UI, and `PerfectDayModalProps` to ensure type safety for the incoming props.

The `PerfectDayModal` is exported for use elsewhere in the application, promoting modular design. Notably, the `streakCount` is set to zero but has a comment indicating potential future enhancement, suggesting that this file may be part of a feature built around user engagement metrics.

#### components/ProgressTracker.tsx

The file `components/ProgressTracker.tsx` defines a React functional component that visually represents a progress tracker in a React Native application. It accepts props including a label, the number of completed tasks, the total number of tasks, and the progress percentage. The component is styled using React Native's `StyleSheet`, presenting a label, a count of completed tasks, and a progress bar that visually fills based on the percentage provided.

This component is significant for applications that require users to track progress, enhancing user engagement and providing clear feedback on task completions. It integrates with the project's type definitions through `ProgressTrackerProps`, ensuring type safety. Additionally, it uses the `ThemedText` component for consistent text style, likely aligning with a broader theming system in the application.

Key imports include `StyleSheet`, `View` from "react-native", and `ThemedText`. The notable side effect of this implementation is the visual representation of user progress, which can impact user experience and satisfaction.

#### components/SlateItem.tsx

The file `SlateItem.tsx` defines a React functional component that represents an individual item in a task management interface. It facilitates user interaction by allowing tasks to be edited or added to a daily agenda. 

The component imports essential utilities and components, such as `TouchableOpacity` for button actions, `ThemedText` for styled text presentation, and custom hooks for theme color management. Key props include `task`, `onEdit`, and `onAddToToday`, linking the component to task data and actions. 

The main functions include an add button for today's tasks and an edit button, both of which handle respective user actions through callback functions. The layout is styled using a combination of internal styles and imported styling utilities, ensuring a cohesive design.

This component is crucial for rendering the task list within the broader project, enhancing usability by neatly integrating task operations. Notable side effects include invoking the provided callbacks, which modify app state or trigger navigation events.

#### components/TaskItem.tsx

The file `TaskItem.tsx` defines a React functional component, `TaskItem`, used to render individual tasks within a todo list application built with React Native. It provides user interaction features such as toggling completion status, editing task details, and skipping tasks for the day, thereby enhancing task management functionality.

This component is significant as it encapsulates the visual representation and logic for handling tasks, contributing to user experience and task organization within the app. It interacts with other components like `CheckableListItem` for toggling and `ThemedText` for displaying text, and leverages hooks like `useThemeColor` for dynamic theming.

Key imports include `TouchableOpacity`, `View`, and `StyleSheet` from React Native, along with several custom components and utilities. The main functions include `handleToggle`, `handleEdit`, and `handleSkipForToday`, which manage user interactions depending on task state and read-only settings.

Notable side effects include changing task states and potentially triggering updates to the parent component via callbacks.

#### components/UnifiedAddModal.tsx

The UnifiedAddModal.tsx file defines a React Native component for adding or editing tasks and habits within a modal interface. It is significant as it centralizes the user input for task and habit management, providing a user-friendly experience for both adding new items and editing existing ones.

The component utilizes several key imports, including constants for text and colors, utility functions for date validation, and other UI components like FloatingModal, CustomDatePicker, and ConfirmationDialog. The main export is the `UnifiedAddModal` functional component, which features props for visibility, type (task or habit), title, due date, notes, edit mode, and various callback functions for handling changes and actions.

Key functionalities include toggling between task and habit types, date picking, and conditional rendering of title and notes inputs. Notable side effects include showing a date picker and a confirmation dialog for deletion. This component is interrelated with the rest of the project by connecting user input to state management, impacting how tasks and habits are displayed elsewhere in the application.

#### components/celebration/CheckMorph.tsx

The file `CheckMorph.tsx` defines a React component called `CheckMorph`, which animates a checkmark SVG based on a `checked` boolean prop. It uses the `react-native-reanimated` library for smooth animations and `react-native-svg` for rendering the SVG graphics. This component is crucial for user interfaces that require interactive elements to indicate selection or completion (e.g., checkboxes or task lists).

The primary functionality involves morphing the checkmark through scaling and drawing effects, which enhances user experience by providing visual feedback. Key imports include `Animated`, `useSharedValue`, and `useAnimatedProps` from `react-native-reanimated`, alongside `Svg` and `Path` from `react-native-svg`.

The main component exports the `CheckMorph` function, composed of two key shared values, `progress` for the checkmark drawing and `scale` for the size of the animation. Notable side effects occur when the `checked` state changes, triggering animations that smoothly transition the checkmark's appearance. This component likely integrates with other parts of the project that manage form inputs or user selections.

#### components/celebration/ConfettiCannon.tsx

The file `ConfettiCannon.tsx` defines a React component, `ConfettiCannonComponent`, that renders a confetti cannon effect based on incoming props. It allows customization of the confetti's characteristics, including the count, origin, colors, fade-out behavior, and whether it starts automatically. 

This component is significant within the project for enhancing celebratory user interface experiences, such as expressing success or joyous events. It leverages the `react-native-confetti-cannon` library, making it a reusable visual feature across potentially multiple parts of the application.

Key exports include the `ConfettiCannonComponent`, which is invoked conditionally based on the `fire` prop. The useEffect hook initiates the confetti animation when `fire` is set to true. Notably, if `fire` is false, the component renders nothing, ensuring efficient use of resources. This integration can contribute to user engagement and satisfaction by providing visual feedback during specific actions.

#### components/celebration/LevelUpAnimation.tsx

The `LevelUpAnimation.tsx` file defines a React component that handles a celebratory animation for a "level-up" event in a React Native application. It utilizes the `react-native-reanimated` library to create animated effects such as scaling and glowing when the `trigger` prop is true. This matters because it enhances user experience by providing visual feedback during significant events.

The component imports essential functions from `react-native-reanimated` for animations and React for component structure and lifecycle management. It accepts `children` to display within the animated view and an optional `onComplete` callback for actions post-animation.

Key functions in the component include `useEffect`, which triggers animations based on the `trigger` prop, and `useAnimatedStyle`, which computes the animated styles based on shared values. 

The main exports are the `LevelUpAnimation` function component and its associated styles. Notable side effects include the invocation of the optional `onComplete` callback after a delay of one second post-animation, allowing for further actions in response to the level-up event.

#### components/celebration/PerfectDayCelebration.tsx

The `PerfectDayCelebration.tsx` file defines a React Native component that presents a celebratory modal when a user completes all their daily habits. This component is significant for enhancing user experience by providing positive feedback through visual and haptic effects.

Key imports include `expo-haptics` for tactile feedback, `react-native` for UI components, `React` for creating the component, and `ConfettiCannonComponent` for visual celebration effects. The main exported function, `PerfectDayCelebration`, accepts `visible`, `onClose`, and optional `streakCount` props. 

The modal triggers haptic feedback, confetti animations, and an Lottie animation upon visibility. It also displays a celebratory message and a streak count if applicable. The component automatically closes after three seconds, ensuring a smooth user experience.

This file integrates with the larger project to motivate users to maintain their habit streaks and reinforces the behavioral goals of the application. Notable side effects include starting animations and managing state based on the visibility of the modal.

#### components/celebration/README.md

The README.md file outlines the celebration system for the Slate MMORPG, focusing on providing engaging user feedback for task and habit completions. It includes several components: TapWin for interactive task completion with animations and haptics; CheckMorph for animated checkmarks; PerfectDayCelebration for celebrating significant achievements; LevelUpAnimation for container animations; and ConfettiCannonComponent for reusable confetti effects.

These components are crucial for enhancing user experience by rewarding achievements, thus promoting user engagement and retention. Each component is customizable and optimized for performance across various interactions. 

Key imports include `react-native-reanimated` for animations, `expo-haptics` for feedback, `lottie-react-native` for animations, and `react-native-svg` for vector graphics. The main functions involve creating visually appealing animations and tactile responses during user interactions that can be triggered through concise event handling.

Notable side effects include improved user interaction through animations and haptics that provide instant feedback, amplifying user satisfaction and motivation.

#### components/celebration/TapWin.tsx

The TapWin.tsx file defines a React component called `TapWin`, which creates an animated, pressable button used typically in celebration contexts (e.g., confirming actions, leveling up). The component allows haptic feedback and visual scaling effects, enhancing the user interaction experience. 

This matters because it offers a visually engaging way to provide feedback to users while interacting with the application, promoting a more dynamic UI. 

The component imports essential libraries like `expo-haptics` for haptic feedback and `react-native-reanimated` for handling animations. It exports the `TapWin` function, which accepts several props, including a callback for when a level-up occurs.

Key functions include the `handlePress`, which manages user interactions, triggers haptic feedback, and runs the scaling animation. If the button is pressed while `checked` is false, it also calls the `onLevelUp` function. 

This component likely interacts with other parts of the application that require user input and feedback, making it crucial for user engagement in the codebase.

#### components/celebration/index.ts

The file `components/celebration/index.ts` serves as a central export hub for multiple celebration-related components within a larger application, likely designed for user interface and user experience enhancements during celebratory events or achievements. It matters because it streamlines the import process, allowing other parts of the project to easily access these components without needing to reference each individual file. Key imports/exports include the `CheckMorph`, `ConfettiCannonComponent`, `LevelUpAnimation`, `PerfectDayCelebration`, and `TapWin`, all of which are presumably designed to provide visual effects or animations associated with celebrations. This file relates closely to the project's focus on enhancing user interaction through engaging visual feedback. There are no notable side effects indicated in the file, as it primarily functions as an export index.

#### components/external-link.tsx

The `components/external-link.tsx` file defines a React component named `ExternalLink`, which enhances the functionality of an existing `Link` component from the `expo-router` library. This component allows for external links to be opened in a web browser or in-app browser depending on the platform (native or web). It specifically modifies the behavior by preventing the default linking action on native platforms and using `openBrowserAsync` from `expo-web-browser` to open links in a controlled manner.

This file is crucial for maintaining a consistent user experience when navigating to external websites, ensuring that users remain within the app instead of being redirected to an external browser. It ties into the overall project by promoting seamless integration of web content within the app. Key imports include `Link` for navigation and `openBrowserAsync` for browser handling. The main function is the `ExternalLink` component, which handles user interactions and ensures the correct browser presentation style. Notable side effects include launching an in-app browser and overriding the default link behavior on native devices.

#### components/haptic-tab.tsx

The file `components/haptic-tab.tsx` defines a functional component `HapticTab`, which enhances the touch interactions of a tab button in a bottom navigation bar by integrating haptic feedback for iOS users. This improves user experience by providing tactile feedback upon pressing the tab, thus making the interface feel more responsive and engaging.

The file is significant as it adds a layer of interactivity that aligns with modern app design principles, focusing on enhancing usability and user satisfaction. It directly relates to the rest of the project by serving as a custom tab button for a navigation system, likely utilized in various screens of the app.

Key imports include `BottomTabBarButtonProps` from `@react-navigation/bottom-tabs` and `Haptics` from `expo-haptics`, which are essential for tab properties and haptic feedback functionality, respectively. The main function is `HapticTab`, which handles the button press event. Notable side effects include triggering a haptic feedback response when the tab is pressed on iOS devices.

#### components/hello-wave.tsx

The file `components/hello-wave.tsx` defines a React Native component called `HelloWave`. This component displays an animated text element that shows a waving hand emoji (👋). The animation is created using the `react-native-reanimated` library, applying a rotation transform to the text, making it appear to wave. 

This component is significant as it enhances user engagement through animation, contributing to a lively and interactive user interface. It likely serves as part of a larger project focused on mobile application development where animations play a key role in user experience.

The main export of the file is the `HelloWave` function, which renders the animated text. There are no notable side effects mentioned, but the component relies on the `react-native-reanimated` import to function correctly. Overall, `HelloWave` likely integrates into the broader project to provide dynamic visual feedback within the app.

#### components/history/DayDetailsModal.tsx

The file `DayDetailsModal.tsx` defines a React functional component that renders a modal displaying detailed information for a specific day, including tasks and habits. It accepts three props: `visible` to control the modal's display, `snapshot` containing the day's data, and `onClose` for closing the modal. 

This component is significant as it enhances user interaction within a habit-tracking app, allowing users to view their progress on tasks and habits for a selected day. Integrating it into the project allows users to visualize and reflect on their daily accomplishments, which may improve user engagement.

Key imports include React, Modal components from React Native, and various themed components like `ThemedText` and `ThemedView`. Notable exports involve the `DayDetailsModal` component itself.

The main functionalities displayed are the listing of tasks and habits, and the modal features a close button. Notably, it uses dummy functions for toggling and editing tasks to keep the view read-only in this context. Styles are also defined for modal layout and appearance.

#### components/history/HabitStreaksSection.tsx

The file `HabitStreaksSection.tsx` defines a React component that displays the current habit streaks for users within a Habit Tracking application. It utilizes hooks from a store to fetch active habits and user settings, such as the starting day of the week, to compute the streaks. This component is crucial for providing users with immediate visual feedback on their habit performance, thereby encouraging engagement and consistency.

Key imports include `StyleSheet`, `View` from React Native, `ThemedText` for styled text display, and various hooks like `useHabitStreaks`, `useHabitsStore`, and `useSettingsStore` to manage state. The main function exported is `HabitStreaksSection`, which renders a list of active habits alongside their respective streaks.

Notable side effects include reliance on global stores for state management, which may impact the component’s performance if the habit or settings data changes frequently. Overall, this component is connected to the broader functionality of habit tracking and user motivation within the application.

#### components/history/HistoryCalendar.tsx

The file `HistoryCalendar.tsx` defines a React functional component that provides a calendar interface to display user history related to habits. It integrates with a state management store `useHistoryStore`, allowing access to calendar data, date selection, and loading relevant data for different months. 

This component is significant for user engagement as it visualizes habit completion data, enhancing the user experience by allowing users to track their progress over time. 

Key imports include React Native components for UI (`View`, `Text`, `Animated`, `StyleSheet`) and the `Calendar` from `react-native-calendars`. The main exports are the `HistoryCalendar` component. 

Core functions include `getMarkedDates`, which colors dates based on habit completion ratio, and various date handling functions like `getMinDate`, `getMaxDate`, and navigation checks. It features an animated notification system to inform users when trying to navigate beyond available history data.

Overall, it is part of a larger habit-tracking application, tying into the overall functionalities related to user behavior observation.

#### components/history/HistoryHeader.tsx

The file `HistoryHeader.tsx` is a React component designed for a mobile application built with React Native. It serves as a header for a "History" tab within the application, displaying key statistics about user activity, specifically tasks completed in the last seven days and the number of perfect days achieved. This component is significant as it provides users with a quick overview of their performance metrics, encouraging engagement and usability.

The `HistoryHeader` component imports essential elements such as `TabHeader`, `ThemedText`, and a custom store hook `useHistoryStore` to access the relevant statistics. It exports the `HistoryHeader` component for use in other parts of the application.

The main features include a responsive layout with styled statistical boxes. Notable side effects include the visual organization of user stats, influencing the user experience and potentially their motivation. This component integrates seamlessly with the broader project, connecting user data with a user-friendly interface, enhancing overall functionality.

#### components/parallax-scroll-view.tsx

The file `components/parallax-scroll-view.tsx` defines a React component called `ParallaxScrollView`, which implements a parallax scrolling effect for a header image within a scrollable view. This component is significant as it enhances the visual appeal of the user interface by creating depth as the user scrolls, thus improving user engagement.

The `ParallaxScrollView` accepts children components, a header image, and background colors for light and dark themes. It uses several key imports from React Native and the `react-native-reanimated` library to manage animations based on scroll offsets, providing a smooth and performant experience.

This component integrates with other parts of the project through its reliance on the `ThemedView` for themed content display and hooks for managing color schemes. Notable exports include the `ParallaxScrollView` component itself.

Main functionalities involve calculating animated styles for the header image as the user scrolls. Notable side effects include changing the header's position and scale in response to scrolling, contributing to the overall user experience within the application.

#### components/planner/HabitsSection.tsx

The `HabitsSection.tsx` file defines a React functional component called `HabitsSection`, which displays a list of habits for a user. It takes in properties such as `habits`, `completedHabits`, `habitStreaks`, and callback functions `onToggle` and `onEdit`. The component renders a themed view containing a title and either the list of habits or a message indicating there are no habits available.

This file is crucial for the user interface of a habit-tracking application, as it helps users visualize their habits and associated data, enhancing user engagement. 

Key imports include `HabitItem`, which represents individual habits, and themed components for consistent styling. The main export is the `HabitsSection` component. 

Notable side effects involve rendering different UI states based on the presence of habits—either displaying a habit list with completion status and streaks or a prompt indicating no habits exist. This functionality is integrated into the broader application for tracking and managing personal habits effectively.

#### components/planner/PlannerHeader.tsx

The file `PlannerHeader.tsx` defines the `PlannerHeader` component, a key UI element in a planner application, built using React and React Native. It displays progress on tasks and habits, providing users with a visual summary of their accomplishments and a button to add new items. 

This component matters because it enhances user engagement by offering immediate feedback on progress, which is crucial for task and habit management applications. It interacts with other components like `ProgressTracker` and `AddButton`, suggesting that it is part of a broader functionality within the project focusing on organization and productivity.

Key imports include UI components such as `AddButton`, `ProgressTracker`, and `TabHeader`, facilitating structured interactions. The primary export is the `PlannerHeader` functional component, which accepts properties related to task and habit counts along with an action for adding new items. Notably, it computes task and habit completion percentages, which may influence rendering and user decisions. Overall, it contributes to a cohesive user experience in managing tasks and habits effectively.

#### components/planner/SlateSection.tsx

The file `SlateSection.tsx` defines a React functional component named `SlateSection` that renders a section for displaying tasks in a planner application. It leverages the `SlateItem`, `ThemedText`, and `ThemedView` components to create a cohesive and themed user interface. 

The `SlateSection` accepts props for an array of tasks and two callback functions: `onAddToToday` for adding tasks or habits to the current day, and `onEdit` for modifying task details. The component checks if there are tasks to display; if so, it renders each task using the `SlateItem` component. If there are no tasks, it shows a message indicating that the user is caught up.

This file is integral to the user experience, allowing for task management functionality within the larger planner application. The use of themed components suggests that the project may support multiple themes or visual styles. Key exports include the `SlateSection` component, which encapsulates task display and interaction logic. Notable side effects include rendering updates when tasks are added or edited.

#### components/planner/TodayTasksSection.tsx

The file TodayTasksSection.tsx defines a React functional component that displays a list of tasks scheduled for the current day. It accepts props for tasks, completed tasks, and callback functions for toggling task completion, editing, and optionally skipping tasks. The component is responsible for rendering the tasks, indicating their completion status, and providing user interactions through child components like TaskItem.

This component is crucial for task management functionality within the application, allowing users to manage their daily tasks effectively. By presenting a clear view of today's tasks, it enhances user experience and productivity.

Key imports include TaskItem for rendering individual tasks and ThemedText and ThemedView for consistent theming across the application. Notable exports include the TodayTasksSection component itself, which integrates user interactions through its props.

The notable side effect is the conditional rendering of tasks or a message indicating that no tasks are planned, helping guide user experience based on data availability.

#### components/planner/index.ts

The file `components/planner/index.ts` serves as an aggregation module for the planner-related components in the codebase. It exports four key components: `HabitsSection`, `PlannerHeader`, `SlateSection`, and `TodayTasksSection`, facilitating their accessibility from a single entry point. This structure simplifies imports and enhances the maintainability of the project by centralizing component access.

The importance of this file lies in its role in organizing the planner's UI elements, ensuring a modular design that improves code clarity. It directly relates to the overall project by contributing to the user interface, likely within a task management or productivity application.

Key exports include:
- `HabitsSection`
- `PlannerHeader`
- `SlateSection`
- `TodayTasksSection`

No key imports are present in this file since it only re-exports components. The notable side effect is that it streamlines component importing for any files that need to use these planner sections, ultimately aiding in maintaining a clean and efficient code structure.

#### components/safe-area-themed-view.tsx

The file `components/safe-area-themed-view.tsx` defines a React Native component called `SafeAreaThemedView`, which enhances the `SafeAreaView` component from the `react-native-safe-area-context` library by applying a themed background color based on the current theme (light or dark). It imports relevant types and hooks for type safety and theme management. The component accepts additional props like `lightColor`, `darkColor`, and `edges`, allowing customization of the safe area’s background and the sides to which the safe area applies.

This component is significant as it ensures consistent theming and proper handling of device safe areas, improving the user experience across different devices and themes. It integrates seamlessly with the project's theme handling mechanism via the `useThemeColor` hook.

Key imports include `ViewProps` from `react-native` and `SafeAreaView` from `react-native-safe-area-context`, while notable exports include the `SafeAreaThemedView` component itself. The component may lead to visual changes based on the active theme, impacting how content is presented.

#### components/shared/TabHeader.tsx

The file `TabHeader.tsx` defines a functional component in React Native that serves as a styled header for tabs in a user interface. It imports necessary components for styling and theming, specifically `ThemedText` and `ThemedView`, to ensure consistent design across the application.

The `TabHeader` component accepts a `title` and optional `children` props, rendering a title at the top and any additional content underneath, if provided. This modular approach allows for reusability across different parts of the application, enhancing maintainability.

This component matters as it centralizes the design of tab headers, facilitating a cohesive look and feel throughout the project. Its integration with themed components enables adherence to universal styling rules defined elsewhere in the codebase.

Key imports include `StyleSheet`, `View`, `ThemedText`, and `ThemedView`. It exports the `TabHeader` component. The main notable side effect is that it affects layout through padding and margins defined in the styles.

#### components/themed-text.tsx

The file `components/themed-text.tsx` defines a reusable React Native component named `ThemedText`, which renders styled text that adapts its color based on the current theme (light or dark). It imports essential utilities from React Native, specifically for handling text and styling, as well as a custom hook for theme color management.

This component is significant for achieving consistent typography across the project, enhancing the user interface by ensuring that text colors are appropriate for different themes. It relates to the wider codebase by providing a standardized way to implement text elements that align with the app's overall visual tone.

The key export is the `ThemedText` component itself. The file also introduces a type definition for props called `ThemedTextProps`, which extends standard `TextProps` with additional properties for color and text type variations (e.g., title, subtitle).

Notable side effects include rendering text with varying styles based on the specified type and theme, which can impact the readability and aesthetics of the application.

#### components/themed-view.tsx

The file `themed-view.tsx` defines a React Native component called `ThemedView`, which is a wrapper around the standard `View` component. It allows for dynamic background color based on the app's theme (light or dark), using the `useThemeColor` hook to determine the appropriate color. The component accepts props for light and dark colors, alongside standard `View` props.

This file is significant for providing a consistent theming mechanism across the project, enhancing the user interface by adapting to light and dark modes seamlessly. It is likely used throughout the application wherever a themed view is necessary.

Key imports include `View` from React Native and `useThemeColor` from a custom hooks module, indicating its reliance on both React Native's core components and project-specific theming logic. The primary function exported is `ThemedView`, which performs no side effects beyond rendering the themed view based on props. There are no notable side effects mentioned in the implementation.

#### components/types.ts

The `components/types.ts` file is responsible for defining and exporting TypeScript types used within the components of the project. It re-exports a set of common types from a shared file located in the project’s library, specifically related to day planning and habit tracking functionalities. This file matters as it centralizes type definitions, promoting consistency and type safety across components that rely on these shared definitions.

Additionally, the file introduces a component-specific type, `AddButtonProps`, which defines the shape of props expected by an `AddButton` component, enhancing modularity and readability in the codebase. Its relationship with the rest of the project is significant, as it ensures that the components can utilize standardized types, thereby reducing redundancy and potential errors.

Key imports include various interfaces from `@/lib/types/common`, and the notable export is the `AddButtonProps` interface. There are no major side effects as this file primarily serves a type definition purpose without containing logic that affects runtime behavior.

#### components/ui/collapsible.tsx

The `collapsible.tsx` file implements a React Native component called `Collapsible`, which provides a UI element that can expand or collapse to show or hide its children content. This component is significant as it enhances user interaction by allowing for a cleaner interface, organizing related information in a compact manner. It utilizes hooks like `useState` for managing the open/closed state and `useColorScheme` to adapt the design to light or dark themes. Key imports include `ThemedText`, `ThemedView`, and `IconSymbol`, which provide theming capabilities and icons. The component offers a responsive design and manages styles via `StyleSheet`. 

The main function exported is `Collapsible`, which accepts `children` and `title` props. Notable side effects include the toggle functionality that alters the component's state and visual representation based on user interaction. This component integrates seamlessly into the broader project by ensuring consistent theming and enhancing the overall user experience.

#### components/ui/icon-symbol.ios.tsx

The file `icon-symbol.ios.tsx` defines a React Native component named `IconSymbol`, which is used to render icons using the `SymbolView` component from the `expo-symbols` library. This component allows developers to specify the icon's name, size, color, style, and weight. 

The significance of this file lies in its ability to create scalable and customizable icon representations for iOS applications, which enhances the visual interface and user experience. 

This component is part of a broader project that likely involves various UI elements, making it an essential building block for consistent design across the application. 

Key imports include `SymbolView`, `SymbolViewProps`, and `SymbolWeight` from `expo-symbols`, as well as React Native's `StyleProp` and `ViewStyle`. 

The main export is the `IconSymbol` function. Notable side effects are minimal; it primarily focuses on rendering icons without additional side effects.

#### components/ui/icon-symbol.tsx

The `icon-symbol.tsx` file defines a UI component for rendering icons using native SF Symbols on iOS and Material Icons on Android and web platforms. This component allows for a consistent visual experience across different operating systems while optimizing resource usage. 

It includes a mapping of SF Symbol names to their corresponding Material Icon names, facilitating manual translation between the two icon systems. The primary export is the `IconSymbol` component, which accepts properties such as `name`, `size`, `color`, and `style`. 

This file is crucial in a project that employs cross-platform development, ensuring that the iconography remains visually cohesive and functional. The use of libraries like `@expo/vector-icons` and `expo-symbols` supports its integration, and it leverages key React and React Native types for props handling. Notable side effects may include rendering variations based on the platform, which the component abstracts away, allowing developers to focus on application logic rather than platform-specific discrepancies.

#### constants/theme.ts

The file `constants/theme.ts` defines the color and font constants used for styling a React Native application in both light and dark modes. It is crucial for maintaining a consistent visual theme throughout the app, affecting user experience and accessibility.

This file exports two main objects: `Colors`, which contains color definitions for light and dark themes, including text and background colors, as well as icon colors; and `Fonts`, which provides font family options contingent on the platform (iOS or web) to ensure design fidelity across devices.

The constants may integrate with various styling libraries such as Nativewind or Tamagui, suggesting flexibility in design choices. The effective use of these themes ensures that the app is visually coherent and adheres to design principles, making it an essential part of the overall project. The notable side effect could include variations in appearance when switching between light and dark modes, enhancing user comfort and engagement.

#### eas.json

The file `eas.json` is a configuration file for the Expo Application Services (EAS) that outlines settings for building and submitting an application. It specifies the required CLI version, build environments (development, preview, production), and submission parameters. This matters because it allows developers to define how their applications are built and deployed across different stages, ensuring a streamlined process.

Key components include:

- **cli**: Sets CLI version and defines the source for app versioning (from remote).
- **build**: Configures environments:
  - Development allows an internal client and is tagged with the "development" channel.
  - Preview also uses an internal distribution.
  - Production automates version increments and is linked to the "production" channel.
- **submit**: Contains configurations for submitting to production without specific parameters listed.

This file plays a crucial role in managing the application lifecycle within the larger Expo ecosystem, enabling efficient development, testing, and deployment workflows. There are no notable functions or classes, as it is purely a configuration file.

#### eslint.config.js

The file `eslint.config.js` is a configuration file for ESLint, a tool used to analyze and enforce code quality standards in JavaScript projects. This configuration imports the standard Expo ESLint rules, allowing the project to adhere to best practices recommended by the Expo framework. It also specifies a custom rule to ignore the 'dist' directory, which is typically where built files reside, thereby preventing these files from being linted. 

This file is important for maintaining code quality and consistency across the project, ensuring adherence to established style guidelines. It relates to the broader codebase by facilitating automatic linting processes and helping developers identify potential issues early in development. Notable imports include the `defineConfig` from ESLint and the `expoConfig` from the Expo ESLint configuration package. The main function here is the configuration export, which combines the Expo settings with custom directives. No critical side effects are noted beyond the enhanced code quality and ignored directories.

#### hooks/use-color-scheme.ts

The file `hooks/use-color-scheme.ts` acts as a re-exporter for the `useColorScheme` hook from the `react-native` library. This means it enables the rest of the application to import `useColorScheme` directly from this file, potentially providing a clear and centralized access point for color scheme management.

This file matters because it simplifies the import path for developers working with theme adaptation in the application, promoting better organization and readability of the codebase. By abstracting the import, it allows for easier future changes, such as modifying the source of the hook or adding additional logic around its usage.

In the context of the broader project, this hook likely plays a role in responsive design, automatically adapting components to light or dark themes based on user preferences. The main export is the `useColorScheme` hook itself; there are no notable side effects or additional functions and classes defined within the file.

#### hooks/use-color-scheme.web.ts

The `use-color-scheme.web.ts` file defines a custom React hook, `useColorScheme`, which manages the color scheme (light or dark mode) for a React web application. It bridges the color scheme from React Native (`useRNColorScheme`) with the need for client-side state management due to static rendering. 

This hook initializes a state variable `hasHydrated` to track the hydration state of the component. On the first render, it sets this variable to `true` using the `useEffect` hook to indicate that the component has hydrated. Until hydration occurs, it defaults to returning 'light' as the color scheme.

This file is significant as it ensures a consistent theming experience across web and mobile applications while accommodating the challenges of server-side rendering. It relates closely to the overall project by facilitating adaptive UI based on user preferences. 

Key imports include React hooks (`useEffect`, `useState`) and the `useColorScheme` from React Native. The main export is the `useColorScheme` function, and the notable side effect is the hydration state affecting the returned color scheme.

#### hooks/use-theme-color.ts

The file `hooks/use-theme-color.ts` defines a custom hook, `useThemeColor`, which provides a way to retrieve theme-specific color values based on the user's current color scheme (light or dark). It supports optional color overrides via props, allowing for greater customization in UI components.

This functionality is important for ensuring that the application adheres to different aesthetic preferences and improves user experience by effectively utilizing light and dark modes. The hook relates to other parts of the project by leveraging the `useColorScheme` hook and the centralized `Colors` theme constants, promoting consistency in color usage throughout the application.

Key imports include `Colors` from `@/constants/theme` for predefined color values and `useColorScheme` from `@/hooks/use-color-scheme` to determine the active theme. The main function is `useThemeColor`, which takes props for light and dark colors and a color name as parameters. There are no notable side effects, making it a pure function that solely returns the appropriate color based on the current theme.

#### hooks/useHabitStreaks.ts

The file `hooks/useHabitStreaks.ts` defines a custom React hook for managing and retrieving habit streak data. It imports React hooks and utility functions to track and update streaks based on user habits and a defined start of the day. The hook takes an object with `habits` and `dayStart` parameters and utilizes the `useEffect` hook to load streaks when the habits change.

This file is significant for applications focused on habit tracking, as it encapsulates the logic for fetching and managing habit streak information, thereby promoting code reusability and separation of concerns. It is likely integrated into a broader project for personal development or wellness applications.

Key imports include `getHabitStreaks`, a database access layer function to retrieve streak data, and `localToday`, which likely normalizes date handling based on user time settings. The main function, `useHabitStreaks`, returns an object mapping habit IDs to their respective streak counts, and the notable side effect is the asynchronous fetching of data when habits or the start day changes.

#### hooks/useModal.ts

The file `hooks/useModal.ts` defines a custom React hook, `useModal`, for managing the presentation state of a modal dialog used for editing or adding items such as tasks or habits. This hook centralizes the modal's state, including whether it is open, what item is being edited, and various details related to the modal's input fields, such as title and due date.

This functionality is crucial for enhancing user interaction within the application, allowing users to conveniently manage tasks and habits through a modal interface. The hook connects logically to other components in the project that require modal behavior, enabling seamless integration.

Key exports include the `useModal` function, which combines state and actions (like opening, closing, and editing the modal) in a single object, making it easy to use within functional components. Notably, it imports the `fromLocalDateString` utility function for converting date strings to Date objects, ensuring proper handling of due dates. There are no notable side effects outside of state management related to the modal's display.

#### hooks/usePerfectDay.ts

The file `hooks/usePerfectDay.ts` defines a custom React hook for managing the detection and celebration of achieving a "Perfect Day" in a habit-tracking application. This functionality is essential as it enhances user engagement by providing haptic feedback upon completing habits and notifying users when they meet all their daily habits.

The hook, `usePerfectDay`, utilizes the `Haptics` module from the Expo library to deliver tactile responses and includes a state variable `showPerfectDay` to determine when to celebrate a successful day. It accepts parameters such as the user's current day plan, a function to mark habits as complete, and functions to handle the local representation of the current day.

Key exports include the `handleCompleteHabit` function and the visibility state for the "Perfect Day" celebration. Notably, the hook will only trigger the celebration if all planned habits are completed. It interacts closely with other components that handle habit completion and user feedback, making it integral to the project's habit-tracking workflow.

#### hooks/usePlanner.ts

The `usePlanner.ts` file defines a custom React hook that manages the state and business logic for a planner screen within a productivity application. It consolidates state management for day plans, tasks, and habits, allowing for efficient interaction with various stores (day plans, tasks, habits, settings). 

Key functionalities include loading initial data, saving and managing tasks and habits, and handling user actions like adding or removing items from today’s plan. It employs React's `useMemo` for optimizing task sorting, and `useEffect` for initial data fetching.

This hook is crucial as it centralizes the planner's logic, improving maintainability and reusability across components in the project. 

Key imports include various store hooks for state management and utility functions for date handling. The main exported function, `usePlanner`, returns an object containing the current state and action handlers, ensuring a clean API for UI components. Notable side effects include API calls and user alerts in case of errors during state updates.

#### hooks/useTaskCompletion.ts

The file `hooks/useTaskCompletion.ts` defines a custom React hook, `useTaskCompletion`, that facilitates managing task completion while incorporating haptic feedback using the Expo Haptics library. This hook is significant as it enhances user experience by giving tactile response upon task completion, making interactions more engaging. It relates to the overall project by providing a reusable logic component that can be integrated wherever task completion occurs. 

Key imports include the Haptics module from the Expo library for the haptic feedback functionality, and `useCallback` from React to optimize performance by memoizing the `handleCompleteTask` function. The main function, `handleCompleteTask`, takes a task ID and a completion status, triggers haptic feedback if the task is marked complete, and calls an external `completeTask` function that handles the actual task update. Notable side effects include the potential triggering of device vibrations through haptic feedback, depending on the completion status of a task.

#### lib/app/init.ts

The file `lib/app/init.ts` is responsible for initializing the application upon startup. It does this by first establishing a connection to the database and then loading various user settings, tasks, habits, and daily plans. The importance of this file lies in its role as the entry point for application setup, ensuring that all necessary data is loaded before the app becomes operational.

Key imports include database access methods from `../db/dal`, database connection functions from `../db/connection`, and state management hooks from different store modules such as `dayPlan`, `habits`, `settings`, and `tasks`. 

The main exported function, `initializeApp`, coordinates the initialization process, including a specific rollover function that handles task carryover across days if applicable. The auxiliary function `runRolloverIfNeeded` checks whether the boundary between days has been crossed and manages the carryover of unfinished tasks.

Notably, the file ensures that app readiness can be determined through the `isAppReady` function, facilitating smooth user experience by preventing interactions before the app is fully loaded.

#### lib/constants/app.ts

The file `lib/constants/app.ts` defines application-wide constants that serve to streamline the codebase by eliminating "magic numbers" and strings. It organizes UI-related constants (like spacing and color schemes), application-specific settings, and component dimensions, aiding developers in maintaining consistent styles and functionality throughout the project.

Key exports include `UI`, `COLORS`, `APP`, `COMPONENTS`, `TEXT`, and `DATE_TIME`, all of which encompass essential constants used in various aspects of application development. The `initializeApp` function is critical for initializing the app by setting up the database and loading initial user settings, tasks, habits, and day plans. The file also contains a rollover mechanism to manage task carryover from the previous day.

Notably, this module is integral to the project's structure, providing configurability and enhancing maintainability. It imports database and store modules, ensuring seamless interaction with other parts of the application. The constant definitions help standardize design and functionality, making future updates or changes easier to implement.

#### lib/db/connection.ts

The `connection.ts` file establishes a SQLite database connection for an application using the Drizzle ORM and Expo SQLite. It plays a crucial role in managing the app's data structure, defining tables for meta information, tasks, habits, and their completions. The file's main function, `initializeDatabase`, creates necessary tables if they do not already exist, sets up indexes to improve performance, and handles the initialization of schema metadata.

This file is vital for ensuring that the application's data layer is correctly set up, which directly affects the functionality of the app, as it relies on this data for tasks and habit tracking. It imports both the `drizzle` ORM for database interactions and schema definitions from another file.

Key exports include the `db` object, representing the database connection, and the `initializeDatabase` function, which manages the setup and structure of the database. Notable side effects include the execution of asynchronous SQL commands that modify the database, creating tables, and inserting default values into meta fields.

#### lib/db/dal.ts

The `dal.ts` file implements a Data Access Layer (DAL) for managing tasks and habits within a database in a productivity-focused application. It facilitates CRUD operations for tasks and habits, logging actions for auditing purposes, and retrieving relevant data for user activities, enhancing user engagement and accountability.

Key functions include `addTask`, `updateTask`, and `completeTask`, allowing users to manage their tasks, while `addHabit`, `updateHabit`, and `completeHabitForDate` serve similar purposes for habits. Importantly, the file calculates streaks for habits, providing motivation to users.

Noteworthy imports include database schema objects from `schema`, a connection to the database, and utility functions for date handling. The DAL plays a crucial role in the overall architecture by abstracting database interactions, enabling the application to remain modular and maintainable. 

Key exports consist of various asynchronous functions that facilitate interaction with tasks, habits, activity logging, and statistics over time. The file also manages potential side effects through database insertions, deletions, or updates based on user actions.

#### lib/db/schema.ts

The file `lib/db/schema.ts` defines the database schema for a task and habit management application using Drizzle ORM with SQLite. It includes the definition of several tables: `meta` for application configuration, `tasks` for managing tasks, `habits` for tracking habits, and related tables such as `habitCompletions`, `dayPlan`, `dayPlanItems`, `activityLog`, and `daySnapshots`.

This schema is crucial for organizing and persisting user data, enabling functionalities like task management, habit tracking, and activity logging. Each table is equipped with fields that capture essential attributes, defaults, and relationships between entities, such as tasks depending on other tasks.

The file exports types for each table, facilitating type safety in data access within the broader project. Key imports include functions from `drizzle-orm/sqlite-core` for table and column definitions. Notable side effects include data integrity through primary keys and foreign key references, contributing to a structured and maintainable codebase.

#### lib/stores/baseStore.ts

The file `baseStore.ts` defines a base store factory for managing state in a Zustand-based application, emphasizing the reduction of duplicated code patterns. It imports utility functions for handling error and loading states and exports a factory function to create a base store with common state properties (`loading` and `error`) and associated actions (`setError` and `setLoading`).

This file is significant as it establishes a foundation for state management across the project, promoting consistency in handling asynchronous operations. It contains several utility functions: `withAsyncOperation` for generic async operations, `withDataUpdate` for modifying lists with new data, and `withItemUpdate` for updating specific items in a state array.

The key exports include `createBaseStore` for store creation and the async operation wrappers, which incorporate error and loading state handling. These functions leverage the imported error handling utilities, enhancing the overall robustness of the application's state management. Notable side effects include state updates in response to async operations and error handling.

#### lib/stores/dayPlan.ts

The file `lib/stores/dayPlan.ts` defines a Zustand store for managing daily plans in an application focused on habits and tasks. It provides state management capabilities to handle the current day's plan, including tasks and habits, storing them alongside their completion status. The importance of this file lies in its centralized control over daily planning, allowing for efficient updates and state management through various methods such as loading plans, adding/removing tasks or habits, and marking them as completed.

Key imports include data access layer (`dal`) for retrieving and modifying data, error handling utilities, and Zustand for state management. The main export is the `useDayPlanStore`, which encompasses the store's state and actions.

Notable actions include `loadDayPlan`, `addToDay`, `removeFromDay`, and completion toggles for tasks and habits. Side effects mainly involve network requests for data manipulation and internal state updates reflecting these changes. The store also interacts with other parts of the project, such as `useHabitsStore` and `useTasksStore`, ensuring data consistency across different functionalities.

#### lib/stores/habits.ts

The file `lib/stores/habits.ts` defines a Zustand store for managing user habits within an application. It provides functionalities to load, add, update, delete, and complete habits, as well as retrieve streaks for habits. This store is integral to the habits feature, enabling users to track and manipulate their habits effectively.

Key imports include data access functions from `dal` for database interactions, utility functions for state management, and types for TypeScript's type safety. The store interfaces with another store (`dayPlan`) to maintain references to habits. 

The main exported function is `useHabitsStore`, which contains several asynchronous actions: `loadHabits`, `addHabit`, `updateHabit`, `deleteHabit`, `completeHabitForDate`, and `getHabitStreak`. Notable side effects include updating both local state and persistent data sources, as well as coordinating with the day plan store to maintain consistency.

Overall, this file plays a crucial role in managing habits, which are likely a core functionality of the project.

#### lib/stores/historyStore.ts

The `historyStore.ts` file defines a Zustand store that manages historical data related to user habits and tasks in a calendar-like format. It provides an interface for storing and retrieving daily snapshots of completed tasks and habits, along with statistics on performance over time. This file is crucial for tracking user activity and motivating engagement by visually representing progress and accomplishments.

Key imports include database access logic (`dal`) for fetching data, as well as external libraries for state management (Zustand) and middleware for development tools. The main exported entity is the `useHistoryStore`, which encapsulates various state properties and actions, allowing components to load initial data, retrieve calendar data for specific months, and select or clear specific days to view historical details.

Notable functions include `loadInitialData`, `loadCalendarDataForMonth`, and `selectDay`, each fetching data from the database asynchronously. The store’s loading state and statistics help improve user experience while maintaining a clear overall view of task completion trends.

#### lib/stores/settings.ts

The `settings.ts` file defines a Zustand store for managing application settings related to reminders, audio, and haptic feedback. This functionality is crucial as it enhances user experience by allowing users to customize important parameters like reminder times and notification preferences.

The store interfaces with the database through the `dal` module to load and update settings, leveraging functions to handle errors and loading states. Key settings include day start time, habit reminder time, and preferences for sound and haptics. The default configuration is specified and can be modified through asynchronous actions.

Notable exports include the `useSettingsStore`, which encapsulates the state and actions for settings management. The main functions handle loading settings from the database and updating various preferences, ensuring that user settings are persistent and easily adjustable.

Side effects include asynchronous interactions with the database and potential error states during loading or updating settings, which are managed through utility functions for consistent error handling. This file is integral to the overall project, providing configurable aspects that improve user engagement and satisfaction.

#### lib/stores/storeFactory.ts

The file `storeFactory.ts` serves as a factory for creating CRUD (Create, Read, Update, Delete) stores, optimizing common operations to minimize redundancy. It imports utility functions from `baseStore` for state management and error handling, utilizing the Zustand library for state creation. 

This file is crucial for maintaining a consistent interface for data manipulation across different parts of the project, enabling the clear management of entities like tasks and habits. The main exported function, `createCrudStore`, generates a store that includes methods for loading, adding, updating, and deleting items, along with error handling. 

The file also exports `CRUD_ERROR_MESSAGES`, a structure that centralizes error messages for various operations tied to different entity types. 

Key imports include utility functions for state management and error messages for operations, while its notable side effects involve direct updates to the application state based on CRUD operations. This promotes reusability and a cleaner codebase within the larger project.

#### lib/stores/tasks.ts

The file `lib/stores/tasks.ts` defines a Zustand store for managing tasks within a larger application, likely a task or project management tool. It imports necessary utility functions and types for error handling and task operations from other modules. 

This store is significant as it centralizes state management for tasks, facilitating operations like loading, adding, updating, completing, and deleting tasks. Additionally, it manages task planning and error states, enhancing user interaction by providing feedback during these operations.

Key exports include the `useTasksStore` hook, allowing components to interact with the task state. Main functions in the store include `loadTasks`, `addTask`, `updateTask`, `completeTask`, `deleteTask`, `planTaskForDate`, and `unplanTaskForDate`. 

Notably, it handles side effects like updating the day plan store upon adding or deleting tasks and managing error states for a better user experience. The store’s relationship with the day plan module underscores its integral role in task management and scheduling.

#### lib/types/common.ts

The file `lib/types/common.ts` defines shared TypeScript types and interfaces for a task and habit management application, aimed at reducing code duplication throughout the codebase. It includes base entity types and their specific types for tasks and habits, as well as types for day plans and state management. 

Key exports include `BaseEntity`, `Task`, `Habit`, `DayPlan`, and various state interfaces like `TasksState` and `HabitsState`. These types are crucial for component prop definitions and API response handling, enabling a clear structure for data flow throughout the application.

This file is integral to maintaining type safety within the project, allowing developers to create, manage, and manipulate tasks and habits effectively while ensuring consistent state management. Notably, the structure supports both CRUD operations and handling of various UI states through defined interfaces, which enhances code maintainability and readability. Overall, it serves as a foundational element that connects multiple aspects of the application.

#### lib/utils/clock.ts

The file `lib/utils/clock.ts` provides utility functions for date and time manipulation using the Day.js library, with added support for timezones through plugins. It defines types for local dates and times, which are crucial for maintaining consistency in date formats across the codebase.

Key functions include `localToday`, which calculates the local representation of today based on a defined start time, `prevDay` and `nextDay` for navigating day offsets, and `isToday` for date comparisons. Additional functions offer current datetime retrieval, formatting for display, and parsing of date strings, as well as getting the start and end of a day in ISO format.

This file is important for any parts of the project that require date handling, ensuring synchronization in date-related functionalities. Its exports support modular usage throughout the project, enhancing readability and maintainability. The notable side effect includes the reliance on the current timezone settings as determined by the Day.js library, which can influence date calculations.

#### lib/utils/dateFormat.ts

The `dateFormat.ts` file contains utility functions for consistent date handling in the application. It provides methods to format dates for display, validate dates for task deadlines, and convert dates between formats suitable for user display and database storage. 

This file is crucial for ensuring uniform date representation across the app, which is essential for user interfaces and backend interactions involving dates. It facilitates seamless integration with other parts of the project that require date management, such as task scheduling and event tracking.

Key exports include:
- `formatDate`: Formats a date for UI display.
- `isDateValid`: Checks if a date is valid for tasks.
- `toLocalDateString`: Converts a Date object to a YYYY-MM-DD string.
- `fromLocalDateString`: Converts a YYYY-MM-DD string back to a Date object.
- `getToday`: Returns today's date with time reset.

Notable side effects include potential date formatting inconsistencies if the utility functions are not used throughout the project.

#### lib/utils/errorHandling.ts

The `lib/utils/errorHandling.ts` file provides shared utilities for consistent error management across the application. It defines functions to extract error messages, create standardized error, success, and loading state objects, and provides common error messages for various operations.

Key exports include:
- `getErrorMessage`: Extracts a message from an error object or returns a fallback message.
- `createErrorState`: Generates an error state object using the extracted message.
- `createSuccessState`: Returns a success state object indicating no errors.
- `createLoadingState`: Returns a loading state object.
- `ERROR_MESSAGES`: A constant object containing predefined error messages for different tasks, habits, and settings operations.

This file is essential for maintaining uniformity in error handling throughout the project, ensuring that various components can manage their states systematically. It likely interacts with various parts of the project that require error reporting and state management, enhancing the user experience by providing clear error messaging and loading indicators.

#### lib/utils/styles.ts

The `styles.ts` file provides shared styling utilities for a React Native application, defining common styles for buttons, inputs, modals, list items, empty states, progress indicators, and badges. It imports design constants from the application's constants library, such as colors and component dimensions, ensuring consistency in UI design.

This file is important as it centralizes styling, promoting reusability and maintainability across the project. The defined styles are structured to accommodate variations (e.g., primary and secondary button styles) and can be easily updated in one place.

Key exports include:
- `buttonStyles`, `inputStyles`, `modalStyles`, `listItemStyles`, `emptyStateStyles`, `progressStyles`, and `badgeStyles`, which provide predefined styles.
- Helper functions `createSpacing` and `createBorderRadius` for consistent spacing and border radius management.

Notably, some styles include hardcoded colors, requiring usage with a `ThemedText` component for theme support. The file integrates seamlessly into the broader project by adhering to design guidelines and facilitating a cohesive look across the app.

#### memory-bank/activeContext.md

The file `activeContext.md` serves as a project update document for the memory-bank application, detailing the current status of development features and enhancements. It outlines completed milestones, like the implementation of a tab navigation system, the history tab with calendar integration, and the establishment of a new database schema. 

Key components include the organization of navigation into three main tabs, a detailed implementation of the history tab, and essential architectural improvements that have simplified the user interface by merging tabs into a single streamlined main page. The file also discusses a celebration system for user achievements and outlines decisions made regarding navigation and database management.

Noteworthy imports might involve state management tools like Zustand and UI libraries for icons. The document highlights functions central to navigation, history data retrieval, and user action logging. Furthermore, it addresses potential risks such as handling time zone changes and emphasizes the importance of testing for user experience optimization. Overall, the file is vital in tracking progress and aligning team efforts in a collaborative environment.

#### memory-bank/implementationStatus.md

The file "implementationStatus.md" provides a comprehensive overview of the implementation status of the Slate App, detailing milestones and user stories. It highlights that the core functionalities (referred to as milestones M1-M5) are fully implemented, covering features such as task addition, morning planning, task completion with engaging feedback, habit tracking, and automatic task rollover. 

Notable imports include Expo and React Native for the framework, Drizzle ORM for database interactions, and Zustand for state management. Key exports include user interface components and custom hooks for modal and habit streak management.

Overall, the document outlines the project's core architecture, including the SQLite database structure and performance optimizations. It also lists missing features like notifications and data export/import functionality, which are identified as placeholders needing implementation. This file is crucial as it establishes the app's readiness for production and directs future development priorities.

#### memory-bank/productContext.md

The file "memory-bank/productContext.md" provides documentation for the Slate application, designed to assist iOS users in managing daily tasks and habits without the need for cloud services or account creation. It addresses issues like fragmented attention from separate apps by merging tasks and habits into a unified daily view. Key features include quick task capture, customizable daily planning, and a playful user experience with feedback mechanisms like haptic responses and visual progress indicators.

The documentation outlines user experience goals, emphasizing minimalism, accessibility, and low cognitive load. Noteworthy components include the Main Screen that displays tasks and habits, a Settings interface for user customization, and a Unified Modal for task management.

The application's scope is limited to iOS devices, supporting daily habits and simple scheduling, with placeholder functionalities for local notifications and data export/import. Overall, this context document is crucial for understanding Slate's purpose, functionality, and design philosophy as part of its development lifecycle.

#### memory-bank/progress.md

The file "progress.md" documents the current status and milestones of the memory bank project's development. It confirms the completion of version 0 (V0), which encompasses key functionalities such as tab navigation, history tracking, and the implementation of the plan outlined in "plan.md." 

This summary highlights critical features completed across multiple milestones (M1-M5), including the core UI, haptic feedback, streak tracking, and settings management. The integrated database schema V2 introduces enhancements like task dependencies and activity logging essential for user interaction tracking and data integrity. 

The document outlines future tasks, including optional polishing efforts and planned features for M6, emphasizing ongoing improvements in architecture, performance, and maintainability. There are no known issues, indicating robust functionality for daily use. 

Key aspects of the file are its comprehensive progress tracking and the well-organized structure that integrates seamlessly with the broader project efforts, showcasing a deliberate approach to development and user experience enhancement.

#### memory-bank/projectBrief.md

The `projectBrief.md` file outlines the specifications and vision for "Slate," a local-first productivity app developed for iOS using Expo and React Native. Slate facilitates task management and habit tracking without backend dependency, leveraging SQLite for data storage. It emphasizes a playful, minimal design, with features like daily planning, task capture, habit tracking, and streak celebration. 

Key exports include functions related to tasks and habits management, notifications, and data export/import as JSON. Notably, it introduces concepts such as "Perfect Day" and "auto-carryover" for unfinished tasks. The file serves as a blueprint for developers, detailing user stories, functional requirements, a data model, and the tech stack.

Its significance lies in providing a structured approach to personal productivity while ensuring a smooth user experience through haptic feedback and animations. The app's focus on local data empowers users to maintain privacy. Overall, it aligns closely with the project's goal of enhancing personal productivity with a captivating user interface.

#### memory-bank/systemPatterns.md

The `systemPatterns.md` document outlines the architectural design and data models of a local-first task and habit management application built with Expo and React Native. It emphasizes the use of SQLite for data storage and MMKV for preferences. The file details the high-level data model, including tasks, habits, and activity logs, with V2 enhancements for task dependencies and audit trails.

Key functionalities include daily planning, task and habit completion tracking, and a history tab for data visualization. The document describes how user interactions are logged and suggests strategies for idempotency and performance, such as virtualized lists and minimal re-renders. 

Navigation is structured through a tabbed interface, promoting user-friendly access to different functionalities. Key imports include Zustand for state management and custom components for UI consistency. Notable exports include the application's navigation and history functionalities.

This file is crucial for maintaining a consistent architecture, ensuring efficient data handling, and improving user experience within the broader codebase.

#### memory-bank/techContext.md

The file "techContext.md" outlines the technological framework and architecture of a project built with Expo (SDK 54). It details the software stack, including navigation with expo-router, data management using expo-sqlite and Drizzle ORM, and state management via zustand. It specifies the use of libraries for animations, haptics, notifications, and file handling, as well as a testing strategy with Jest.

The document serves as a guide for local development, emphasizing constraints like local data storage and detailed conventions for date handling and database operations. It describes the project's directory structure, which includes folders for main screens, components, database functions, state management, utilities, constants, and custom hooks.

This file is crucial for developers to understand the tech stack, setup instructions, code organization, and coding standards, facilitating collaboration and consistency across the codebase. Key exports include detailed folder structures and conventions while notable side effects include the constraint of local data storage and performance-optimized state management.

#### package.json

The `package.json` file defines the configuration and dependencies for the "slate" project, which is built using Expo, a framework for React Native applications. It specifies the project name, version, main entry point, and includes various scripts for starting the project on different platforms (Android, iOS, and web), resetting the project, linting, and updating with EAS.

This file matters as it manages dependencies essential for the application’s functionality, including navigation, state management, and UI components. Key dependencies include Expo libraries for handling audio, image, and file operations, as well as vital React and React Native packages.

The primary exports are the defined scripts and dependencies. It includes several development dependencies for TypeScript and ESLint to ensure code quality.

Notable side effects may occur when scripts are run, such as starting development servers or resetting the project state. Overall, this file is critical for defining the environment and tools necessary for the project’s development and execution.

#### plan.md

The `plan.md` file documents the implementation of the History tab feature for the Slate application, detailing enhancements made to the backend, state management, navigation, and UI. Its completion is crucial as it integrates essential functionality for viewing task completion statistics and habit tracking, thereby improving user engagement with the application.

Key components include modifications to the Data Access Layer (`lib/db/dal.ts`), where functions like `getCalendarViewData` and `getOverallStats` were added. A Zustand store (`lib/stores/historyStore.ts`) was created to manage the state, facilitating data retrieval and user interactions. Navigation updates ensure easy access to the History screen, complemented by various components for displaying visual data, such as the `HistoryCalendar` and `DayDetailsModal`.

Notable exports include the Zustand store and utility functions for data fetching. The implementation enhances the user experience with color-coded calendars and detailed day snapshots, positioning the History tab as a vital part of Slate's overall functionality.

#### scripts/reset-project.js

The `reset-project.js` script facilitates resetting a project to a blank state by either moving existing directories or deleting them based on user input. Specifically, it handles the directories `/app`, `/components`, `/hooks`, `/scripts`, and `/constants`, moving them to an `app-example` directory or deleting them outright. The script then creates a new `/app` directory containing `index.tsx` and `_layout.tsx` files with default content to kickstart development.

This script is significant because it allows developers to easily reset their project structures without manually managing files, thus promoting efficient development practices. It integrates with the project's existing setup by being callable directly via the command line, as indicated by its shebang (`#!/usr/bin/env node`).

Key imports include `fs`, `path`, and `readline`, used for file system manipulation and user interaction. The main functions focus on directory management and file creation. Notable side effects involve modifying the project structure and file system, either by moving or deleting existing directories.

