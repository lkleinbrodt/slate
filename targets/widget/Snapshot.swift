import Foundation

// The app writes this as JSON to the shared App Group on every change to Today
// (lib/services/widget.ts, built by lib/logic/widget.ts). Keep the two in sync.
// The widget can't open the database or run rollover, so the snapshot carries
// two days: `today`, and `next`, which takes over at the next day start.

let slateAppGroup = "group.com.lkleinbrodt.slate"
let slateSnapshotKey = "widgetSnapshot"

struct WidgetTask: Codable, Hashable {
    let title: String
    // Due on or before this day
    let isDue: Bool
}

struct WidgetDay: Codable {
    let date: String
    let habitsTotal: Int
    let habitsDone: Int
    let pendingHabits: [String]
    let tasksTotal: Int
    let tasksDone: Int
    let pendingTasks: [WidgetTask]

    var habitsLeft: Int { max(habitsTotal - habitsDone, 0) }
    var tasksLeft: Int { max(tasksTotal - tasksDone, 0) }
    var isPerfectDay: Bool { habitsTotal > 0 && habitsLeft == 0 }
    var isAllDone: Bool { habitsLeft == 0 && tasksLeft == 0 }
}

struct WidgetSnapshot: Codable {
    let version: Int
    let generatedAt: Double // epoch ms
    let rolloverAt: Double // epoch ms
    let today: WidgetDay
    let next: WidgetDay

    var rolloverDate: Date { Date(timeIntervalSince1970: rolloverAt / 1000) }

    // Past the next rollover the app hasn't run, so `next` is the best guess:
    // habits reset daily, and unfinished tasks carry over.
    func day(at date: Date) -> WidgetDay {
        date < rolloverDate ? today : next
    }

    static func load() -> WidgetSnapshot? {
        guard
            let json = UserDefaults(suiteName: slateAppGroup)?.string(forKey: slateSnapshotKey),
            let data = json.data(using: .utf8)
        else { return nil }
        return try? JSONDecoder().decode(WidgetSnapshot.self, from: data)
    }
}

extension WidgetDay {
    // Widget gallery preview
    static let sample = WidgetDay(
        date: "",
        habitsTotal: 5,
        habitsDone: 3,
        pendingHabits: ["Meditate", "Read 20 pages"],
        tasksTotal: 6,
        tasksDone: 2,
        pendingTasks: [
            WidgetTask(title: "Call the dentist", isDue: true),
            WidgetTask(title: "Renew registration", isDue: false),
            WidgetTask(title: "Groceries", isDue: false),
            WidgetTask(title: "Email Sam back", isDue: false),
        ]
    )
}

/// `size` items of `items`, starting further along on each rotation and
/// wrapping, so every item shows up eventually. No rotation if they all fit.
func rotatingWindow<T>(_ items: [T], size: Int, rotation: Int) -> [T] {
    guard size > 0, !items.isEmpty else { return [] }
    guard items.count > size else { return items }
    let start = (rotation * size) % items.count
    return (0..<size).map { items[(start + $0) % items.count] }
}

func plural(_ count: Int, _ noun: String) -> String {
    "\(count) \(noun)\(count == 1 ? "" : "s")"
}
