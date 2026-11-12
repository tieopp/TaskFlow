import type { Task } from "../types/task";
import { sampleTasks } from "../data/sampleTasks";

export const STORAGE_KEY = "tieopp.taskflow.v1";

function isTask(value: unknown): value is Task {
  if (!value || typeof value !== "object") return false;
  const task = value as Partial<Task>;
  return (
    typeof task.id === "string" &&
    task.id.length > 0 &&
    typeof task.title === "string" &&
    typeof task.completed === "boolean" &&
    typeof task.createdAt === "string" &&
    ["high", "medium", "low"].includes(task.priority ?? "")
  );
}

/**
 * Reads the persisted collection. Every stored task is restored; an empty
 * stored array stays empty. Corrupt or unavailable storage falls back to the
 * starter workspace so the UI always has renderable data.
 */
export function loadTasks(): Task[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw !== null) {
      const parsed: unknown = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.every(isTask)) {
        const ids = new Set(parsed.map((task) => task.id));
        if (ids.size === parsed.length) return parsed;
      }
    }
  } catch {
    /* An unavailable store must not prevent local use. */
  }
  return sampleTasks.map((task) => ({ ...task }));
}

/** Returns false when the write is rejected so callers can warn the user. */
export function saveTasks(tasks: Task[]): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    return true;
  } catch {
    return false;
  }
}
