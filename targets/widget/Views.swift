import SwiftUI
import WidgetKit

// Colors come from expo-target.config.js (generated colorsets, light + dark).
// Lock Screen widgets ignore them: iOS renders those in its own monochrome
// tint, so they use .primary/.secondary only.
extension Color {
    static let slateBackground = Color("slateBackground")
    static let slateText = Color("slateText")
    static let slateTextSecondary = Color("slateTextSecondary")
    static let slatePrimary = Color("slatePrimary")
    static let slateHabit = Color("slateHabit")
    static let slateHabitSoft = Color("slateHabitSoft")
}

struct TodayWidgetView: View {
    @Environment(\.widgetFamily) private var family
    let entry: TodayEntry

    var body: some View {
        content
            .containerBackground(for: .widget) {
                // Lock Screen widgets sit straight on the wallpaper
                if family == .systemMedium {
                    Color.slateBackground
                } else {
                    Color.clear
                }
            }
    }

    @ViewBuilder
    private var content: some View {
        switch family {
        case .accessoryCircular:
            CircularView(day: entry.day)
        case .accessoryInline:
            InlineView(day: entry.day)
        case .accessoryRectangular:
            RectangularView(day: entry.day, rotation: entry.rotation)
        default:
            MediumView(day: entry.day, rotation: entry.rotation)
        }
    }
}

// MARK: - Shared

/// "2 habits · 4 tasks", leaving out a kind that's finished
private func remainingSummary(_ day: WidgetDay) -> String {
    var parts: [String] = []
    if day.habitsLeft > 0 { parts.append(plural(day.habitsLeft, "habit")) }
    if day.tasksLeft > 0 { parts.append(plural(day.tasksLeft, "task")) }
    return parts.joined(separator: " · ")
}

/// Pending habits and tasks to show, `capacity` rows in all. Each list gets a
/// share and rotates through its items independently.
private func visibleItems(
    _ day: WidgetDay, capacity: Int, rotation: Int
) -> (habits: [String], tasks: [WidgetTask]) {
    let habitCount = day.pendingHabits.count
    let taskCount = day.pendingTasks.count
    // Habits get at least half the rows when there are enough of both
    let habitRows = min(habitCount, max(capacity - taskCount, capacity / 2))
    let taskRows = min(taskCount, capacity - habitRows)
    return (
        rotatingWindow(day.pendingHabits, size: habitRows, rotation: rotation),
        rotatingWindow(day.pendingTasks, size: taskRows, rotation: rotation)
    )
}

// MARK: - Lock Screen: circle

struct CircularView: View {
    let day: WidgetDay?

    var body: some View {
        if let day, day.habitsTotal > 0 || day.tasksTotal > 0 {
            // Habits if there are any, otherwise tasks
            let useHabits = day.habitsTotal > 0
            let done = useHabits ? day.habitsDone : day.tasksDone
            let total = useHabits ? day.habitsTotal : day.tasksTotal
            Gauge(value: Double(min(done, total)), in: 0...Double(max(total, 1))) {
                Text(useHabits ? "Habits" : "Tasks")
            } currentValueLabel: {
                if done >= total {
                    Image(systemName: "sunrise.fill")
                } else {
                    Text("\(done)/\(total)")
                }
            }
            .gaugeStyle(.accessoryCircularCapacity)
            .widgetAccentable()
        } else {
            ZStack {
                AccessoryWidgetBackground()
                Image(systemName: "sunrise.fill")
                    .font(.title3)
            }
        }
    }
}

// MARK: - Lock Screen: line above the clock

struct InlineView: View {
    let day: WidgetDay?

    var body: some View {
        if let day, !day.isAllDone {
            Text("\(remainingSummary(day)) left")
        } else if let day, day.isPerfectDay {
            Label("Perfect day", systemImage: "sunrise.fill")
        } else {
            Label(day == nil ? "Slate" : "All done", systemImage: "sunrise.fill")
        }
    }
}

// MARK: - Lock Screen: rectangle

struct RectangularView: View {
    // Rows under the header line
    static let itemCapacity = 2

    let day: WidgetDay?
    let rotation: Int

    var body: some View {
        VStack(alignment: .leading, spacing: 1) {
            if let day, !day.isAllDone {
                let items = visibleItems(day, capacity: Self.itemCapacity, rotation: rotation)
                Text(remainingSummary(day))
                    .font(.headline)
                    .minimumScaleFactor(0.8)
                ForEach(Array(items.habits.enumerated()), id: \.offset) { _, title in
                    row(icon: "circle", title: title)
                }
                ForEach(Array(items.tasks.enumerated()), id: \.offset) { _, task in
                    row(icon: task.isDue ? "exclamationmark.square" : "square", title: task.title)
                }
            } else {
                Label(day == nil ? "Slate" : "All done", systemImage: "sunrise.fill")
                    .font(.headline)
                Text(subtitle)
                    .foregroundStyle(.secondary)
            }
        }
        .lineLimit(1)
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private var subtitle: String {
        guard let day else { return "Open Slate to begin" }
        return day.isPerfectDay ? "Perfect day" : "Nothing left today"
    }

    private func row(icon: String, title: String) -> some View {
        HStack(spacing: 4) {
            Image(systemName: icon)
                .font(.caption2)
                .widgetAccentable()
            Text(title)
        }
    }
}

// MARK: - Home Screen: medium

struct MediumView: View {
    static let itemCapacity = 4

    let day: WidgetDay?
    let rotation: Int

    var body: some View {
        HStack(spacing: 16) {
            ring
            VStack(alignment: .leading, spacing: 7) {
                HStack(alignment: .firstTextBaseline) {
                    Text("Today")
                        .font(.system(.headline, design: .serif))
                        .foregroundStyle(Color.slateText)
                    Spacer(minLength: 4)
                    if let day, day.tasksTotal > 0 {
                        Text("\(day.tasksDone)/\(day.tasksTotal) tasks")
                            .font(.caption)
                            .foregroundStyle(Color.slateTextSecondary)
                    }
                }
                if let day, !day.isAllDone {
                    let items = visibleItems(day, capacity: Self.itemCapacity, rotation: rotation)
                    ForEach(Array(items.habits.enumerated()), id: \.offset) { _, title in
                        HabitRow(title: title)
                    }
                    ForEach(Array(items.tasks.enumerated()), id: \.offset) { _, task in
                        TaskRow(task: task)
                    }
                } else {
                    Text(emptyMessage)
                        .font(.subheadline)
                        .foregroundStyle(Color.slateTextSecondary)
                }
                Spacer(minLength: 0)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }

    private var emptyMessage: String {
        guard let day else { return "Open Slate to begin." }
        if day.isPerfectDay { return "Perfect day. Everything's done." }
        if day.habitsTotal == 0 && day.tasksTotal == 0 { return "A clear day." }
        return "Everything's done."
    }

    // Habit progress; tasks if there are no habits
    private var ring: some View {
        let useHabits = (day?.habitsTotal ?? 0) > 0
        let done = useHabits ? (day?.habitsDone ?? 0) : (day?.tasksDone ?? 0)
        let total = useHabits ? (day?.habitsTotal ?? 0) : (day?.tasksTotal ?? 0)
        let progress = total > 0 ? Double(min(done, total)) / Double(total) : 0
        let tint = useHabits ? Color.slateHabit : Color.slatePrimary
        let track = useHabits ? Color.slateHabitSoft : Color.slatePrimary.opacity(0.18)

        return ZStack {
            Circle()
                .stroke(track, lineWidth: 8)
            Circle()
                .trim(from: 0, to: progress)
                .stroke(tint, style: StrokeStyle(lineWidth: 8, lineCap: .round))
                .rotationEffect(.degrees(-90))
            if total > 0 && done >= total {
                Image(systemName: "sunrise.fill")
                    .font(.title2)
                    .foregroundStyle(tint)
            } else {
                VStack(spacing: 0) {
                    Text("\(done)/\(total)")
                        .font(.system(.title3, design: .serif).weight(.semibold))
                        .foregroundStyle(Color.slateText)
                    Text(useHabits ? "habits" : "tasks")
                        .font(.caption2)
                        .foregroundStyle(Color.slateTextSecondary)
                }
            }
        }
        .frame(width: 84, height: 84)
    }
}

private struct HabitRow: View {
    let title: String

    var body: some View {
        HStack(spacing: 8) {
            Circle()
                .strokeBorder(Color.slateHabit, lineWidth: 1.5)
                .frame(width: 13, height: 13)
            Text(title)
                .font(.subheadline)
                .foregroundStyle(Color.slateText)
                .lineLimit(1)
        }
    }
}

private struct TaskRow: View {
    let task: WidgetTask

    var body: some View {
        HStack(spacing: 8) {
            RoundedRectangle(cornerRadius: 3.5)
                .strokeBorder(Color.slatePrimary, lineWidth: 1.5)
                .frame(width: 13, height: 13)
            Text(task.title)
                .font(.subheadline)
                .foregroundStyle(Color.slateText)
                .lineLimit(1)
            if task.isDue {
                Text("due")
                    .font(.caption2.weight(.semibold))
                    .foregroundStyle(Color.slatePrimary)
            }
        }
    }
}
