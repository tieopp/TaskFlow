import type { Priority, Task, TaskFilter } from "../types/task";

const priorityRank: Record<Priority, number> = {
  high: 0,
  medium: 1,
  low: 2,
};

/** Status filtering is independent of search and never mutates its input. */
export function filterTasks(tasks: Task[], filter: TaskFilter): Task[] {
  switch (filter) {
    case "active":
      return tasks.filter((task) => !task.completed);
    case "completed":
      return tasks.filter((task) => task.completed);
    case "all":
    default:
      return tasks;
  }
}

/**
 * Case-insensitive title search. A blank query is not a constraint, so the
 * input collection is returned untouched.
 */
export function searchTasks(tasks: Task[], query: string): Task[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return tasks;
  return tasks.filter((task) => task.title.toLowerCase().includes(needle));
}

/**
 * Priority ordering on a copy of the input. Array.prototype.sort is stable, so
 * tasks of equal priority keep their collection order.
 */
export function orderTasks(tasks: Task[]): Task[] {
  return [...tasks].sort(
    (left, right) =>
      priorityRank[left.priority] - priorityRank[right.priority],
  );
}
