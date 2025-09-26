# Slate

A local-first iOS productivity app that combines task management with habit tracking in one simple interface.

## What it is

Slate helps you keep track of all your tasks and habits in one place, and makes it simple to decide which ones you should tackle today. It's like a lightweight daily slate you can trust—check things off, keep streaks alive, and roll forward what you don't finish.

## How to use

1. **Add tasks and habits** - Tap the + button to create new items
2. **Plan your day** - Mark tasks for "Today" each morning
3. **Check things off** - Tap to complete tasks and habits with satisfying animations
4. **Track streaks** - See your habit streaks and celebrate "Perfect Days" when all habits are done
5. **Auto-carryover** - Unfinished tasks automatically move to tomorrow

## Getting started

```bash
npm install
npm start
```

Then scan the QR code with your iPhone camera or use the iOS Simulator.

## Key features

- **Tasks**: One-off items with optional due dates
- **Habits**: Daily behaviors that track streaks
- **Today view**: Your daily slate with progress tracking
- **Celebrations**: Delightful animations and haptics when completing items
- **Local storage**: All data stays on your device
- **Settings**: Configure day start time, notifications, and preferences

## Project structure

- `app/` - Main screens (index.tsx, settings.tsx)
- `components/` - UI components including celebration system
- `lib/` - Database, stores, and utilities
- `memory-bank/` - Project documentation

Built with Expo, React Native, and SQLite.
