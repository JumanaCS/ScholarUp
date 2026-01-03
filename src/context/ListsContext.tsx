import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import {
  fetchTaskLists,
  createTaskList as dbCreateList,
  updateTaskList as dbUpdateList,
  deleteTaskList as dbDeleteList,
  createTask as dbCreateTask,
  updateTask as dbUpdateTask,
  deleteTask as dbDeleteTask,
} from '../lib/database';

interface Task {
  id: string;
  text: string;
  completed: boolean;
  due_date?: string;
  list_id: string;
}

interface TaskList {
  id: string;
  name: string;
  emoji: string;
  tasks: Task[];
}

// For backward compatibility with existing screens
interface ListItem {
  id: string;
  text: string;
  completed: boolean;
  dueDate?: string;
}

interface List {
  id: string;
  name: string;
  emoji: string;
  items: ListItem[];
}

interface ListsContextType {
  lists: List[];
  loading: boolean;
  refreshLists: () => Promise<void>;
  createList: (name: string, emoji?: string) => Promise<List | null>;
  updateList: (listId: string, name: string, emoji: string) => Promise<void>;
  deleteList: (listId: string) => Promise<void>;
  addTask: (listId: string, text: string, dueDate?: string) => Promise<ListItem | null>;
  updateTask: (taskId: string, updates: { text?: string; completed?: boolean; dueDate?: string }) => Promise<void>;
  deleteTask: (listId: string, taskId: string) => Promise<void>;
  // Legacy methods for backward compatibility
  setLists: React.Dispatch<React.SetStateAction<List[]>>;
  updateListItems: (listId: string, items: ListItem[]) => void;
}

const ListsContext = createContext<ListsContextType | undefined>(undefined);

// Helper to convert DB format to app format
const convertToAppFormat = (dbList: TaskList): List => ({
  id: dbList.id,
  name: dbList.name,
  emoji: dbList.emoji,
  items: (dbList.tasks || []).map(task => ({
    id: task.id,
    text: task.text,
    completed: task.completed,
    dueDate: task.due_date,
  })),
});

export function ListsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [lists, setLists] = useState<List[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshLists = async () => {
    if (!user) {
      setLists([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await fetchTaskLists(user.id);
      setLists((data || []).map(convertToAppFormat));
    } catch (error) {
      if (__DEV__) console.error('Error fetching task lists:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshLists();
  }, [user]);

  const createList = async (name: string, emoji: string = '📝'): Promise<List | null> => {
    if (!user) return null;

    // Security: Input validation
    const trimmedName = name.trim();
    if (!trimmedName || trimmedName.length === 0 || trimmedName.length > 100) {
      return null;
    }

    try {
      const newList = await dbCreateList(user.id, trimmedName, emoji);
      const listWithItems: List = { ...newList, items: [] };
      setLists(prev => [listWithItems, ...prev]);
      return listWithItems;
    } catch (error) {
      if (__DEV__) console.error('Error creating list:', error);
      return null;
    }
  };

  const updateList = async (listId: string, name: string, emoji: string) => {
    // Security: Input validation
    const trimmedName = name.trim();
    if (!trimmedName || trimmedName.length === 0 || trimmedName.length > 100) {
      return;
    }

    try {
      await dbUpdateList(listId, trimmedName, emoji);
      setLists(prev => prev.map(l => l.id === listId ? { ...l, name: trimmedName, emoji } : l));
    } catch (error) {
      if (__DEV__) console.error('Error updating list:', error);
    }
  };

  const deleteList = async (listId: string) => {
    try {
      await dbDeleteList(listId);
      setLists(prev => prev.filter(l => l.id !== listId));
    } catch (error) {
      if (__DEV__) console.error('Error deleting list:', error);
    }
  };

  const addTask = async (listId: string, text: string, dueDate?: string): Promise<ListItem | null> => {
    if (!user) return null;

    // Security: Input validation
    const trimmedText = text.trim();
    if (!trimmedText || trimmedText.length === 0 || trimmedText.length > 500) {
      return null;
    }

    try {
      const newTask = await dbCreateTask(user.id, listId, trimmedText, dueDate);
      const item: ListItem = {
        id: newTask.id,
        text: newTask.text,
        completed: newTask.completed,
        dueDate: newTask.due_date,
      };
      setLists(prev => prev.map(list =>
        list.id === listId
          ? { ...list, items: [...list.items, item] }
          : list
      ));
      return item;
    } catch (error) {
      if (__DEV__) console.error('Error adding task:', error);
      return null;
    }
  };

  const updateTaskFn = async (taskId: string, updates: { text?: string; completed?: boolean; dueDate?: string }) => {
    // Security: Input validation for text
    if (updates.text !== undefined) {
      const trimmedText = updates.text.trim();
      if (!trimmedText || trimmedText.length === 0 || trimmedText.length > 500) {
        return;
      }
      updates.text = trimmedText;
    }

    try {
      const dbUpdates: { text?: string; completed?: boolean; due_date?: string } = {};
      if (updates.text !== undefined) dbUpdates.text = updates.text;
      if (updates.completed !== undefined) dbUpdates.completed = updates.completed;
      if (updates.dueDate !== undefined) dbUpdates.due_date = updates.dueDate;

      await dbUpdateTask(taskId, dbUpdates);
      setLists(prev => prev.map(list => ({
        ...list,
        items: list.items.map(item =>
          item.id === taskId
            ? { ...item, ...updates }
            : item
        ),
      })));
    } catch (error) {
      if (__DEV__) console.error('Error updating task:', error);
    }
  };

  const deleteTaskFn = async (listId: string, taskId: string) => {
    try {
      await dbDeleteTask(taskId);
      setLists(prev => prev.map(list =>
        list.id === listId
          ? { ...list, items: list.items.filter(item => item.id !== taskId) }
          : list
      ));
    } catch (error) {
      if (__DEV__) console.error('Error deleting task:', error);
    }
  };

  // Legacy method for backward compatibility
  const updateListItems = (listId: string, items: ListItem[]) => {
    setLists(prevLists => prevLists.map(list =>
      list.id === listId ? { ...list, items } : list
    ));
  };

  return (
    <ListsContext.Provider value={{
      lists,
      loading,
      refreshLists,
      createList,
      updateList,
      deleteList,
      addTask,
      updateTask: updateTaskFn,
      deleteTask: deleteTaskFn,
      setLists,
      updateListItems,
    }}>
      {children}
    </ListsContext.Provider>
  );
}

export function useLists() {
  const context = useContext(ListsContext);
  if (context === undefined) {
    throw new Error('useLists must be used within a ListsProvider');
  }
  return context;
}
