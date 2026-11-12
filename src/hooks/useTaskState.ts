import { useCallback, useEffect, useMemo, useReducer, useState } from "react";
import type { Priority, Task } from "../types/task";
import { loadTasks, saveTasks } from "../utils/taskStorage";

interface TaskState {
  tasks: Task[];
}

type TaskAction =
  | { type: "taskAdded"; task: Task }
  | { type: "taskEdited"; id: string; title: string }
  | { type: "taskDeleted"; id: string }
  | { type: "taskToggled"; id: string }
  | { type: "priorityChanged"; id: string; priority: Priority };

/**
 * All collection transitions happen here. Returning the previous state for
 * unknown ids keeps unused actions from triggering redundant renders/writes.
 */
function taskReducer(state: TaskState, action: TaskAction): TaskState {
  switch (action.type) {
    case "taskAdded":
      return { tasks: [...state.tasks, action.task] };
    case "taskEdited":
      return {
        tasks: state.tasks.map((task) =>
          task.id === action.id ? { ...task, title: action.title } : task,
        ),
      };
    case "taskDeleted":
      return state.tasks.some((task) => task.id === action.id)
        ? { tasks: state.tasks.filter((task) => task.id !== action.id) }
        : state;
    case "taskToggled":
      return {
        tasks: state.tasks.map((task) =>
          task.id === action.id
            ? { ...task, completed: !task.completed }
            : task,
        ),
      };
    case "priorityChanged":
      return {
        tasks: state.tasks.map((task) =>
          task.id === action.id
            ? { ...task, priority: action.priority }
            : task,
        ),
      };
    default:
      return state;
  }
}

function createTaskId(): string {
  const uuid = globalThis.crypto?.randomUUID?.();
  if (uuid) return uuid;
  // Older browsers and insecure origins may not expose randomUUID.
  return `task-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

function createInitialState(): TaskState {
  return { tasks: loadTasks() };
}

export function useTaskState() {
  const [state, dispatch] = useReducer(
    taskReducer,
    undefined,
    createInitialState,
  );
  const [storageError, setStorageError] = useState(false);
  const { tasks } = state;

  // Persist the committed collection after every change. Dispatching actions
  // is queued through the reducer, so consecutive submissions in one render
  // batch compose instead of overwriting each other from a stale snapshot.
  useEffect(() => {
    setStorageError(!saveTasks(tasks));
  }, [tasks]);

  const addTask = useCallback((title: string, priority: Priority): boolean => {
    const trimmed = title.trim();
    if (!trimmed) return false;
    dispatch({
      type: "taskAdded",
      task: {
        id: createTaskId(),
        title: trimmed,
        priority,
        completed: false,
        createdAt: new Date().toISOString(),
      },
    });
    return true;
  }, []);

  const editTask = useCallback((id: string, title: string) => {
    const trimmed = title.trim();
    if (!trimmed) return;
    dispatch({ type: "taskEdited", id, title: trimmed });
  }, []);

  const deleteTask = useCallback((id: string) => {
    dispatch({ type: "taskDeleted", id });
  }, []);

  const toggleTask = useCallback((id: string) => {
    dispatch({ type: "taskToggled", id });
  }, []);

  const setPriority = useCallback((id: string, priority: Priority) => {
    dispatch({ type: "priorityChanged", id, priority });
  }, []);

  return useMemo(
    () => ({
      tasks,
      storageError,
      addTask,
      editTask,
      deleteTask,
      toggleTask,
      setPriority,
    }),
    [
      tasks,
      storageError,
      addTask,
      editTask,
      deleteTask,
      toggleTask,
      setPriority,
    ],
  );
}
