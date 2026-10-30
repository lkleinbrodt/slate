import WidgetKit

struct TodayEntry: TimelineEntry {
    let date: Date
    // nil until the app has written a snapshot (first launch after install)
    let day: WidgetDay?
    // Which slice of the pending lists to show; see rotatingWindow
    let rotation: Int
}

struct TodayProvider: TimelineProvider {
    // WidgetKit wants entries at least ~5 minutes apart and may run late anyway
    static let rotationInterval: TimeInterval = 15 * 60
    // How far past the rollover to plan before asking for a new timeline
    static let lookahead: TimeInterval = 6 * 3600

    func placeholder(in context: Context) -> TodayEntry {
        TodayEntry(date: .now, day: .sample, rotation: 0)
    }

    func getSnapshot(in context: Context, completion: @escaping (TodayEntry) -> Void) {
        let day = WidgetSnapshot.load()?.day(at: .now)
        completion(TodayEntry(date: .now, day: day ?? (context.isPreview ? .sample : nil), rotation: 0))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<TodayEntry>) -> Void) {
        let now = Date()
        guard let snapshot = WidgetSnapshot.load() else {
            // The app reloads us once it has written a snapshot
            completion(Timeline(entries: [TodayEntry(date: now, day: nil, rotation: 0)], policy: .never))
            return
        }

        let interval = Self.rotationInterval
        let end = max(snapshot.rolloverDate, now).addingTimeInterval(Self.lookahead)
        let rotates = Self.rotates(in: context.family, snapshot: snapshot)

        // Rotation slots are absolute (since 1970), so a reload after an edit in
        // the app carries on through the list instead of starting over.
        var dates: Set<Date> = [now]
        if snapshot.rolloverDate > now { dates.insert(snapshot.rolloverDate) }
        if rotates {
            var slot = (now.timeIntervalSince1970 / interval).rounded(.down) + 1
            while slot * interval < end.timeIntervalSince1970 {
                dates.insert(Date(timeIntervalSince1970: slot * interval))
                slot += 1
            }
        }

        let entries = dates.sorted().map { date in
            TodayEntry(
                date: date,
                day: snapshot.day(at: date),
                rotation: Int(date.timeIntervalSince1970 / interval)
            )
        }
        completion(Timeline(entries: entries, policy: .after(end)))
    }

    // Only plan rotation entries when there's more to show than fits
    private static func rotates(in family: WidgetFamily, snapshot: WidgetSnapshot) -> Bool {
        let capacity: Int
        switch family {
        case .accessoryRectangular: capacity = RectangularView.itemCapacity
        case .systemMedium: capacity = MediumView.itemCapacity
        default: return false
        }
        return [snapshot.today, snapshot.next].contains { day in
            day.pendingHabits.count + day.pendingTasks.count > capacity
        }
    }
}
