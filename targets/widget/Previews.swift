import SwiftUI
import WidgetKit

// Xcode canvas previews: open ios/slate.xcworkspace, pick the SlateWidget scheme,
// open this file and use the timeline scrubber to step through the states.
// Entries 0-2 are rotations of the busy day, so you can watch the rows cycle.

#if DEBUG
private extension WidgetDay {
    static let busy = WidgetDay(
        date: "",
        habitsTotal: 6,
        habitsDone: 2,
        pendingHabits: ["Meditate", "Read 20 pages", "Stretch", "No phone after 10"],
        tasksTotal: 9,
        tasksDone: 3,
        pendingTasks: [
            WidgetTask(title: "Call the dentist about the crown", isDue: true),
            WidgetTask(title: "Renew registration", isDue: true),
            WidgetTask(title: "Groceries", isDue: false),
            WidgetTask(title: "Email Sam back about the trip in March", isDue: false),
            WidgetTask(title: "Fix the bike tire", isDue: false),
            WidgetTask(title: "Book flights", isDue: false),
        ]
    )

    static let habitsDone = WidgetDay(
        date: "",
        habitsTotal: 4,
        habitsDone: 4,
        pendingHabits: [],
        tasksTotal: 3,
        tasksDone: 1,
        pendingTasks: [
            WidgetTask(title: "Groceries", isDue: false),
            WidgetTask(title: "Book flights", isDue: true),
        ]
    )

    static let tasksOnly = WidgetDay(
        date: "",
        habitsTotal: 0,
        habitsDone: 0,
        pendingHabits: [],
        tasksTotal: 4,
        tasksDone: 1,
        pendingTasks: [
            WidgetTask(title: "Groceries", isDue: false),
            WidgetTask(title: "Book flights", isDue: false),
            WidgetTask(title: "Call mom", isDue: false),
        ]
    )

    static let perfect = WidgetDay(
        date: "",
        habitsTotal: 4,
        habitsDone: 4,
        pendingHabits: [],
        tasksTotal: 5,
        tasksDone: 5,
        pendingTasks: []
    )

    static let empty = WidgetDay(
        date: "",
        habitsTotal: 0,
        habitsDone: 0,
        pendingHabits: [],
        tasksTotal: 0,
        tasksDone: 0,
        pendingTasks: []
    )
}

private func previewEntries() -> [TodayEntry] {
    [
        TodayEntry(date: .now, day: .busy, rotation: 0),
        TodayEntry(date: .now, day: .busy, rotation: 1),
        TodayEntry(date: .now, day: .busy, rotation: 2),
        TodayEntry(date: .now, day: .sample, rotation: 0),
        TodayEntry(date: .now, day: .habitsDone, rotation: 0),
        TodayEntry(date: .now, day: .tasksOnly, rotation: 0),
        TodayEntry(date: .now, day: .perfect, rotation: 0),
        TodayEntry(date: .now, day: .empty, rotation: 0),
        // No snapshot yet (fresh install)
        TodayEntry(date: .now, day: nil, rotation: 0),
    ]
}

#Preview("Medium", as: .systemMedium) {
    TodayWidget()
} timeline: {
    for entry in previewEntries() { entry }
}

#Preview("Rectangle", as: .accessoryRectangular) {
    TodayWidget()
} timeline: {
    for entry in previewEntries() { entry }
}

#Preview("Circle", as: .accessoryCircular) {
    TodayWidget()
} timeline: {
    for entry in previewEntries() { entry }
}

#Preview("Inline", as: .accessoryInline) {
    TodayWidget()
} timeline: {
    for entry in previewEntries() { entry }
}
#endif
