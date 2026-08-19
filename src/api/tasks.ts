import api from './client';
import type {Task, CreateTaskInput} from '@/types';

export const tasksApi = {
  getAll: () => api.get<Task[]>('/tasks').then(res => res.data),

  getByProjectId: (projectId: number) =>
    api.get<Task[]>(`/tasks?projectId=${projectId}`).then(res => res.data),

  create: (data: CreateTaskInput) => api.post<Task>('/tasks', data).then(res => res.data),

  update: (id: number, data: Partial<Task>) => api.put<Task>(`/tasks/${id}`, data).then(res => res.data),

  delete: (id: number) => api.delete<{ success: boolean }>(`/tasks/${id}`).then(res => res.data)
};
