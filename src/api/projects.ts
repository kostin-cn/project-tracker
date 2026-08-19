import api from './client';
import type { Project, CreateProjectInput } from '@/types';

export const projectsApi = {
  getAll: () => api.get<Project[]>('/projects').then(res => res.data),

  getById: (id: number) => api.get<Project>(`/projects/${id}`).then(res => res.data),

  create: (data: CreateProjectInput) => api.post<Project>('/projects', data).then(res => res.data),

  update: (id: number, data: Partial<Project>) => api.put<Project>(`/projects/${id}`, data).then(res => res.data),

  delete: (id: number) => api.delete<{ success: boolean }>(`/projects/${id}`).then(res => res.data)
};
