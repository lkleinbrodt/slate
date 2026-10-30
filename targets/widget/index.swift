import SwiftUI
import WidgetKit

@main
struct SlateWidgets: WidgetBundle {
    var body: some Widget {
        TodayWidget()
    }
}

struct TodayWidget: Widget {
    // Must match WIDGET_KIND in lib/services/widget.ts
    let kind = "SlateToday"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: TodayProvider()) { entry in
            TodayWidgetView(entry: entry)
        }
        .configurationDisplayName("Today")
        .description("Your habits and tasks for today.")
        .supportedFamilies([
            .accessoryCircular,
            .accessoryRectangular,
            .accessoryInline,
            .systemMedium,
        ])
    }
}
