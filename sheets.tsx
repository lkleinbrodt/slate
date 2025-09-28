import { SheetDefinition, registerSheet } from "react-native-actions-sheet";

import AddEditModal from "./components/AddEditModal";
import DatePickerActionSheet from "./components/DatePickerModal";
import DependencyPickerModal from "./components/DependencyPickerModal";
import { DayDetailsModal } from "./components/history/DayDetailsModal";

// Register the add/edit modal sheet
registerSheet("add-edit-modal", AddEditModal);
registerSheet("date-picker-sheet", DatePickerActionSheet);
registerSheet("dependency-picker-sheet", DependencyPickerModal);
registerSheet("day-details-sheet", DayDetailsModal);

// Extend the types for TypeScript support
declare module "react-native-actions-sheet" {
  interface Sheets {
    "add-edit-modal": SheetDefinition<{
      payload: {
        mode: "add" | "edit";
        type?: "task" | "habit";
        itemId?: string;
      };
    }>;
    "date-picker-sheet": SheetDefinition<{
      payload: {
        onDateSelect: (date: string | null) => void;
        selectedDate?: string | null;
        title?: string;
      };
    }>;
    "dependency-picker-sheet": SheetDefinition<{
      payload: {
        onDependencySelect: (taskId: string | null) => void;
        currentTaskId?: string;
        selectedDependencyId?: string | null;
      };
    }>;
    "day-details-sheet": SheetDefinition<{
      payload: {
        snapshot: {
          date: string;
          tasks: any[];
          habits: any[];
          isPerfectDay: boolean;
        } | null;
        onClose: () => void;
      };
    }>;
  }
}

export {};
