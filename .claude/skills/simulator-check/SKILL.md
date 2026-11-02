---
name: simulator-check
description: Click through a Slate change in the iOS Simulator to verify it on screen. Use when a change is UI-heavy (new or changed sheets, pickers, gestures, layout) or spans UI, database and rollover, or when the user asks to see or try the app. Not for pure logic that npm test covers, docs, or refactors. When it looks relevant but wasn't asked for, offer it in one line.
---

# Verify a Slate change in the simulator

Tests (`npm test`) cover logic; this covers what only shows on screen. It is one tool among
several: not every change needs it, but offer it when it would catch something tests can't.
Always run `npx tsc --noEmit && npm run lint && npm test` first; they are cheaper.

**Objective (from Landon): get the same confidence for fewer tokens.** Screenshots are the
main cost. Treat the tips under "Spending fewer tokens" as defaults to reach for, not rules:
take the extra screenshot when you actually need it.

## Steps

1. **Attach first**: `mcp__Claude_Code_iOS_Simulator__control` → `attach` so the user can
   watch. Simulator: `iPhone 17 Pro`, `3508F918-0F71-4FA8-9784-77A5B9C0AC49`
   (confirm with `xcrun simctl list devices available`; boot it if shut down).
2. **Check the installed build is current.** A Debug build loads JS from Metro, so JS/TS
   changes need no rebuild, but its native side is frozen at build time. Known location:
   `~/Library/Developer/Xcode/DerivedData/slate-adijoqikqnhuoagvagyfiysckfuz/Build/Products/Debug-iphonesimulator/slate.app`.
   If the app red-boxes on launch with `Cannot find native module …` (Metro logs the same),
   the build is older than the native dependencies: rebuild (below). This happened once:
   the build predated the voice feature's native modules.
3. **Start Metro** with `preview_start` (`name: "metro"`, from `.claude/launch.json`; this
   worked). It also opens a browser-pane tab on `localhost:8081` that triggers a pointless
   *web* bundle; harmless, ignore it. Install with `xcrun simctl install <udid> <app>`, then
   `control` → `launch` with the `.app` path.
4. **Drive and look** (see tips below).
5. **Walk the feature end to end**: create → see it on Today/Slate → complete → check side
   effects → undo → edit → delete → force-quit and relaunch (persistence). Check dark mode
   with `set_appearance` if colors are involved.
6. **Report what you saw**, including anything you couldn't check. Stop Metro
   (`preview_stop`) when done.

## Spending fewer tokens

Things that worked on the first full run:

- **Screenshots lag the action.** A screenshot taken right after a tap/swipe showed the
  *previous* state several times (sheets and scrolls animate). Wait ~1s first (the browser
  tool's `computer` → `wait` works; Bash `sleep` is blocked), so one screenshot is enough
  instead of two.
- **Batch actions, then one screenshot.** Several `tap`s in a single message (e.g. toggle
  three weekday chips) followed by a single screenshot proved the end state fine.
- **Shrink them.** `scale: 0.4`–`0.5` stayed readable for chips, labels and lists. Use full
  size only once per screen to read coordinates; layouts were stable, so reuse them.
- **Coordinates**: device points are 402x874; a full-scale screenshot displays at 920px
  wide, so multiply displayed coordinates by ≈0.437.
- **Don't screenshot to wait for Metro.** `preview_logs` with `search: "Bundled"` shows
  when the bundle is done (first bundle after a Metro start took a few minutes in one
  run, ~11s in another).
- **Use screenshots for what only the screen shows** (layout, styling, picker UI). State
  that logic can prove (what gets scheduled after a completion, undo side effects,
  recurrence math) belongs in `npm test`; use the simulator just to confirm it surfaces
  correctly (e.g. one screenshot of Slate showing the spawned task).

Ideas, not yet tried (verify before relying on them):
- Reading the simulator's SQLite file directly (`xcrun simctl get_app_container <udid>
  <bundle id> data`, then `sqlite3`) to check rows instead of navigating screens.
- Skipping the early full-size screenshots entirely by trusting known coordinates from a
  previous run (they may shift with fonts, safe areas or new UI).

## Rebuilding for the simulator

Needed when a native module, widget target, icon or `app.json` native config changed since
the last build. From `ios/`, in the background, logging to the scratchpad (this exact
command succeeded; it took a few minutes on this Mac, the elapsed time wasn't measured):

```bash
LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 xcodebuild -workspace slate.xcworkspace -scheme slate \
  -configuration Debug -destination 'id=<sim UDID>' ARCHS=arm64 ONLY_ACTIVE_ARCH=YES build
```

The product lands in the default DerivedData path above. If `ios/` itself is stale,
regenerate with `CI=1 npx expo prebuild -p ios --clean` first (full recipe in
`~/.claude/CLAUDE.md`).

## Notes

- Time-dependent behavior (rollover, "Overdue") needs the day to change; prefer a test in
  `tests/rollover.test.ts`/`repo.test.ts` style. The demo data already contains an overdue
  task to see how it looks.
- The simulator already had demo data loaded (Settings → Developer → "Load demo data"
  replaces all tasks, habits and history in the simulator's database).
- Persistence check: re-running `control` → `launch` on the same `.app` relaunches it with
  data intact (tasks added before were still there). Metro re-bundled in ~2s once cached.
- `set_appearance` (dark/light) works; the app follows it immediately. Set it back to
  light when done.
- The yellow "Open debugger to view warnings" toast can cover the tab bar and the sheet's
  button; dismiss it with its X before tapping underneath.

## Seen once, not confirmed (treat as hypotheses; promote or delete after the next run)

- An "Apple Account Verification" system prompt appeared on the first launch; "Not Now"
  dismissed it. Never enter credentials.
- Metro warned that several packages were slightly behind Expo's expected versions, and
  Expo Router warned about missing default exports only while the app was crashing.
