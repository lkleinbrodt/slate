We can now create the "Add Task/Habit" and "Edit Task" and "Edit Habit" UI.

This should be a drawer/ action sheet that slides up

So we should have a floating "+" add button in the bottom right of the (on both the today and the slate screens). when you click it it opens the menu.

The sheet enables you to enter:

1. The title (as a text field)
2. A carousel with clickable options

- a button to switch it to/from a habit from a task
- (if a task) a button to set the due date
- (if a task) a button to set the scheduled date

Use the https://github.com/wix/react-native-calendars for the date picker (opens on button click). see history page for how we use it there.

Below is the documentation for the action sheet.

Usage with SheetManager
SheetManager is great because it helps you save lots of development time. One great feature is that you can reuse the same ActionSheet in the app and don't have to create or define it in multiple places. Another is that you don't have to write boilerplate for every ActionSheet component. Everything just works.

Import ActionSheet.

import ActionSheet from 'react-native-actions-sheet';
Create your ActionSheet component and export it.

function ExampleSheet() {
return (
<ActionSheet>
<View>
<Text>Hello World</Text>
</View>
</ActionSheet>
);
}

export default ExampleSheet;
Create a sheets.tsx file and import your sheet then register it.

import {registerSheet} from 'react-native-actions-sheet';
import ExampleSheet from 'example-sheet.tsx';

registerSheet('example-sheet', ExampleSheet);

// We extend some of the types here to give us great intellisense
// across the app for all registered sheets.
declare module 'react-native-actions-sheet' {
interface Sheets {
'example-sheet': SheetDefinition;
}
}

export {};
In App.js import sheets.tsx and wrap your app in SheetProvider.

import {SheetProvider} from 'react-native-actions-sheet';
import 'sheets.tsx';

function App() {
return (
<SheetProvider>
{
// your app components
}
</SheetProvider>
);
}
Open the ActionSheet from anywhere in the app.

SheetManager.show('example-sheet');
Hide the ActionSheet

SheetManager.hide('example-sheet');

Passing data to ActionSheet
When using SheetProvider & SheetManager to show ActionSheet it becomes difficult to dynamically change the data in the ActionSheet. For example you are scrolling in a list and each tapping on each item should show properties of that item. One way would be to use some kind of state or events which is fine but not scalable when you have many sheets in the app.

ActionSheet for React Native provides a very easy way to do this by passing the data in your show function and getting it via prop in your ActionSheet component automatically.

Define the Sheet payload data when registering your Sheet.

import {SheetDefinition, registerSheet} from 'react-native-actions-sheet';

registerSheet("example-sheet", ExampleSheet);

declare module 'react-native-actions-sheet' {
interface Sheets {
'example-sheet': SheetDefinition<{
payload: {
value: string;
};
}>;
}
}
SheetManager.show("example-sheet", {
payload: { value: "Hello World" },
});
And then in your ExampleSheet component.

function ExampleSheet(props: SheetProps<"example-sheet">) {
return (
<ActionSheet id={props.sheetId}>
<View>
<Text>{props.payload?.value}</Text>
</View>
</ActionSheet>
);
}
