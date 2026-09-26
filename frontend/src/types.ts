export type Role = 'admin' | 'manager' | 'executor';
export type TaskStatus = 'todo' | 'in_progress' | 'done' | 'cancelled';
export type Priority = 'low' | 'medium' | 'high' | 'urgent';

export interface Task {
  id: number;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: Priority;
  assignee_id: number | null;
  project_id: number;
  due_date: string | null;
  created_at: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  is_active: boolean;
}

export interface Project {
  id: number;
  name: string;
  description?: string | null;
  owner_id: number;
}

export interface Comment {
  id: number;
  task_id: number;
  user_id: number;
  author_name: string | null;
  text: string;
  created_at: string;
}

export interface Summary {
  total: number;
  open: number;
  overdue: number;
  completion_rate: number;
  by_status: Record<TaskStatus, number>;
  by_priority: Record<Priority, number>;
  by_assignee: { user_id: number; name: string; open: number; done: number }[];
  by_project: { project_id: number; name: string; total: number; done: number }[];
}

export type TaskInput = {
  title: string;
  description: string | null;
  priority: Priority;
  assignee_id: number | null;
  project_id: number;
  due_date: string | null;
};
