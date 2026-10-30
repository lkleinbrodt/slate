import AppIntents
import SwiftUI
import WidgetKit

// "New Task" button for Control Center, the Lock Screen corners and the Action Button
@available(iOS 18.0, *)
struct NewTaskControl: ControlWidget {
    static let kind = "SlateNewTask"

    var body: some ControlWidgetConfiguration {
        StaticControlConfiguration(kind: Self.kind) {
            ControlWidgetButton(action: NewTaskIntent()) {
                Label("New Task", systemImage: "plus")
            }
        }
        .displayName("New Task")
        .description("Open Slate to add a task.")
    }
}
