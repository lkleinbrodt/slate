# Celebration System

This directory contains the MMORPG-level celebration system for Slate, providing delightful feedback for user actions.

## Components

### TapWin

The main interactive component for task/habit completion. Provides:

- **Morph animation**: Scale down → up → checkmark draw
- **Haptic feedback**: Light impact on completion
- **Level up trigger**: Callback for container-level animations
- **Visual feedback**: Smooth checkbox morph with checkmark

### CheckMorph

Pure animation component for drawing checkmarks. Features:

- **SVG-based**: Smooth vector checkmark drawing
- **Scale animation**: Bounce effect on completion
- **Customizable**: Size, color, stroke width

### PerfectDayCelebration

Full-screen celebration modal for Perfect Day achievements. Includes:

- **Lottie animation**: Custom badge animation
- **Confetti curtain**: Full-screen confetti burst
- **Success haptics**: Stronger haptic feedback
- **Streak display**: Shows current streak count

### LevelUpAnimation

Container-level animation for task/habit completion. Features:

- **Expand animation**: Scale up the entire item container
- **Glow effect**: Dynamic shadow and elevation changes
- **Opacity pulse**: Subtle brightness variation
- **Smooth transitions**: 60fps animations with proper easing

### ConfettiCannonComponent

Reusable confetti component with:

- **Customizable colors**: Brand-appropriate color schemes
- **Performance optimized**: Uses react-native-confetti-cannon
- **Flexible positioning**: Origin point configuration
- **Perfect Day only**: Used only for major celebrations

## Usage

### Basic Task/Habit Completion

```tsx
import { TapWin, LevelUpAnimation } from "./celebration";

<LevelUpAnimation trigger={triggerLevelUp} onComplete={handleComplete}>
  <View style={styles.itemRow}>
    <TapWin
      checked={isCompleted}
      onPress={handleToggle}
      onLevelUp={handleLevelUp}
      size={28}
      color="#10B981"
    />
    {/* Rest of item content */}
  </View>
</LevelUpAnimation>;
```

### Perfect Day Celebration

```tsx
import { PerfectDayCelebration } from "./celebration";

<PerfectDayCelebration
  visible={showPerfectDay}
  onClose={() => setShowPerfectDay(false)}
  streakCount={currentStreak}
/>;
```

## Animation Details

### Tap Win Sequence

1. **Press**: Scale down to 0.92 (100ms)
2. **Release**: Scale up to 1.05 (120ms)
3. **Settle**: Scale to 1.0 (100ms)
4. **Checkmark**: Draw-in animation (300ms delay, 300ms duration)
5. **Level Up**: Container expand + glow (700ms total)
6. **Haptic**: Light impact feedback

### Level Up Animation Sequence

1. **Expand**: Scale to 1.1 (200ms)
2. **Hold**: Scale to 1.05 (300ms)
3. **Return**: Scale to 1.0 (200ms)
4. **Glow**: Shadow and elevation increase (200ms)
5. **Fade**: Glow fades out (500ms)
6. **Pulse**: Opacity variations throughout

### Perfect Day Sequence

1. **Trigger**: Success haptic + confetti curtain
2. **Badge**: Lottie animation plays (3 seconds)
3. **Auto-close**: Modal closes after 3 seconds
4. **Confetti**: 300 particle burst from top

## Performance Notes

- **Reanimated**: All animations run on UI thread for 60-120fps
- **Confetti**: Limited particle count for performance
- **Lottie**: Pre-loaded animations for instant playback
- **Haptics**: Lightweight, non-blocking feedback

## Customization

### Colors

- Primary: `#10B981` (emerald-500)
- Accent: `#3B82F6` (blue-500)
- Success: `#F59E0B` (amber-500)
- Error: `#EF4444` (red-500)

### Timing

- Quick actions: 200-300ms
- Celebrations: 1-3 seconds
- Haptic delays: 0-150ms

## Dependencies

- `react-native-reanimated`: UI thread animations
- `expo-haptics`: Tactile feedback
- `lottie-react-native`: Designer animations
- `react-native-confetti-cannon`: Particle effects
- `react-native-svg`: Vector graphics
