import AppIntents
import SwiftUI

// In _shared/, so apple-targets compiles it into the app as well as the widget.
// With openAppWhenRun the intent runs in the app, which opens its own deep link.
// Returning OpenURLIntent with a custom scheme is unreliable on devices
// (developer.apple.com/forums/thread/762586); this is the workaround from there.
@available(iOS 16.0, *)
struct NewTaskIntent: AppIntent {
    static let title: LocalizedStringResource = "New Task"
    static let description = IntentDescription("Open Slate to add a task.")
    static let openAppWhenRun: Bool = true

    @MainActor
    func perform() async throws -> some IntentResult {
        EnvironmentValues().openURL(URL(string: "slate://add")!)
        return .result()
    }
}
