/**
 * Custom hook for managing modal presentation state
 */

import { useCallback, useState } from "react";

import { fromLocalDateString } from "@/lib/utils/dateFormat";

type EditableItem = {
  type: "task" | "habit";
  id: string;
  title: string;
  notes?: string;
  dueDate?: string;
} | null;

interface UseModalState {
  isModalOpen: boolean;
  editingItem: EditableItem;
  addModalType: "task" | "habit";
  newItemTitle: string;
  taskDueDate: Date | null;
  editNotes: string;
}

interface UseModalActions {
  openForAdd: () => void;
  openForEdit: (item: NonNullable<EditableItem>) => void;
  closeModal: () => void;
  setAddModalType: (type: "task" | "habit") => void;
  setNewItemTitle: (title: string) => void;
  setTaskDueDate: (date: Date | null) => void;
  setEditNotes: (notes: string) => void;
}

export function useModal(): UseModalState & UseModalActions {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<EditableItem>(null);
  const [addModalType, setAddModalType] = useState<"task" | "habit">("task");
  const [newItemTitle, setNewItemTitle] = useState("");
  const [taskDueDate, setTaskDueDate] = useState<Date | null>(null);
  const [editNotes, setEditNotes] = useState("");

  const openForAdd = useCallback(() => {
    setEditingItem(null);
    setAddModalType("task");
    setNewItemTitle("");
    setTaskDueDate(null);
    setEditNotes("");
    setIsModalOpen(true);
  }, []);

  const openForEdit = useCallback((item: NonNullable<EditableItem>) => {
    setEditingItem(item);
    setAddModalType(item.type);
    setNewItemTitle(item.title);
    setEditNotes(item.notes || "");

    // Convert due date string to Date object for editing
    let dateForEditing: Date | null = null;
    if (item.dueDate) {
      dateForEditing = fromLocalDateString(item.dueDate);
    }
    setTaskDueDate(dateForEditing);

    setIsModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setEditingItem(null);
    setNewItemTitle("");
    setTaskDueDate(null);
    setEditNotes("");
  }, []);

  return {
    // State
    isModalOpen,
    editingItem,
    addModalType,
    newItemTitle,
    taskDueDate,
    editNotes,

    // Actions
    openForAdd,
    openForEdit,
    closeModal,
    setAddModalType,
    setNewItemTitle,
    setTaskDueDate,
    setEditNotes,
  };
}
