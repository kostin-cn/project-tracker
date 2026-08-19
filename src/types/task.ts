export enum TaskStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  DONE = 'done'
}

export interface Task {
  id: number;
  projectId: number;
  title: string;
  assignee: string | null;
  status: TaskStatus;
  dueDate: string;
  createdAt: string;
  order: number;
}

export type CreateTaskInput = Omit<Task, 'id' | 'order' | 'createdAt'>;
