import type { AxiosAdapter, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import { type Project, type Task, ProjectStatus, TaskStatus } from '@/types';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

interface MockData {
  projects: Record<number, Project>;
  tasks: Record<number, Task>;
}

const DEFAULT_STATUSES: Record<keyof MockData, string> = {
  projects: ProjectStatus.ACTIVE,
  tasks: TaskStatus.TODO
}

const STORAGE_KEY = 'mockData';

const loadData = (): MockData => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : { projects: {}, tasks: {} };
};

const saveData = (data: MockData): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

let mockData: MockData = loadData();

const mockAdapter: AxiosAdapter = async <T>(config: InternalAxiosRequestConfig): Promise<AxiosResponse<T>> => {
  const { method, url, data } = config;
  const randomDelay = Math.floor(Math.random() * 200) + 150;

  await delay(randomDelay);

  const [pathname, queryString] = (url || '').split('?');
  const urlParts = pathname?.split('/').filter(Boolean) || [];
  const queryParams = new URLSearchParams(queryString);
  const resource = urlParts[0];
  const id = Number(urlParts[1]) || null;

  if (!resource) {
    throw new Error('Invalid URL');
  }

  switch (method?.toLowerCase()) {
    case 'get':
      if (id) {
        const item = mockData[resource as keyof MockData][id];
        return {
          data: (item || null) as T,
          status: item ? 200 : 404,
          statusText: item ? 'OK' : 'Not Found',
          headers: {},
          config,
        };
      } else {
        const projectId = Number(queryParams.get('projectId')) || null
        const items = (projectId ? Object.values(mockData[resource as keyof MockData] || {}).filter((elem: Task) => elem.projectId === projectId) :
          Object.values(mockData[resource as keyof MockData] || {})) as T;
        return {
          data: items,
          status: 200,
          statusText: 'OK',
          headers: {},
          config,
        };
      }

    case 'post':
      const newId = Date.now();
      const jsonData = JSON.parse(data);
      const resKey = resource as keyof MockData;
      const status = jsonData.status || DEFAULT_STATUSES[resKey];
      let order: number | undefined = jsonData.order;

      // Обчислюємо order тільки для задач, якщо він не був переданий явно
      if (resKey === 'tasks' && order === undefined) {
        const itemsInSameStatus = Object.values(mockData[resKey] || {}).filter(
          (item: Task) => (item?.status === status) && (item?.projectId === jsonData.projectId)
        );
        const maxOrder = itemsInSameStatus.reduce(
          (max: number, item: Task) => Math.max(max, item?.order ?? 0),
          0
        );
        order = maxOrder + 1;
      }

      const newItem = {
        ...jsonData,
        id: newId,
        status,
        ...(order !== undefined ? { order } : {}),
        createdAt: new Date().toISOString(),
      };

      mockData[resKey][newId] = newItem;
      saveData(mockData);
      return {
        data: mockData[resKey][newId] as T,
        status: 201,
        statusText: 'Created',
        headers: {},
        config,
      };

    case 'put':
      if (!id) {
        throw new Error('ID is required for PUT requests');
      }
      mockData[resource as keyof MockData][id] = { ...mockData[resource as keyof MockData][id], ...JSON.parse(data) };
      saveData(mockData);
      return {
        data: mockData[resource as keyof MockData][id] as T,
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      };

    case 'delete':
      if (!id) {
        throw new Error('ID is required for DELETE requests');
      }

      const resourceKey = resource as keyof MockData;

      // Якщо видаляємо проєкт — каскадно видаляємо всі пов'язані завдання
      if (resourceKey === 'projects' && mockData.tasks) {
        Object.entries(mockData.tasks).forEach(([taskId, task]) => {
          if (task.projectId === id) delete mockData.tasks[Number(taskId)];
        });
      }

      delete mockData[resource as keyof MockData][id];
      saveData(mockData);
      return {
        data: { success: true } as T,
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      };

    default:
      throw new Error(`Unsupported method: ${method}`);
  }
};

export default mockAdapter;

export const reloadMockData = (): void => {
  mockData = loadData();
};
