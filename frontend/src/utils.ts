import type { Task } from './types';

export function isOverdue(task: Task): boolean {
  if (!task.due_date || task.status === 'done' || task.status === 'cancelled') return false;
  return task.due_date < new Date().toISOString().slice(0, 10);
}
