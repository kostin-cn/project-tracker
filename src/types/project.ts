export enum ProjectStatus {
  ACTIVE = 'active',
  ARCHIVED = 'archived'
}

export interface Project {
  id: number;
  name: string;
  description?: string;
  status: ProjectStatus;
  createdAt: string;
}

export type ProjectWithTaskCount = Project & {
  tasksCount: number
  doneTasksCount: number
}

export type CreateProjectInput = Omit<Project, 'id' | 'createdAt' | 'status'>;
