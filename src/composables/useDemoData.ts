import { ref } from 'vue'
import { useProjectStore } from '@/stores/projects'
import { reloadMockData } from '@/api/mockAdapter'

export function useDemoData() {
  const isSeeding = ref(false)
  const projectsStore = useProjectStore()

  async function loadDemoData() {
    isSeeding.value = true

    try {
      if (!localStorage.getItem('mockData')) {
        const demoMockData = {
          projects: {
            1787100000001: {
              id: 1787100000001,
              name: "Розробка CRM системи",
              description: "Створення веб-додатка з Kanban-дошкою на Vue 3 та Tailwind CSS",
              status: "active",
              createdAt: new Date().toISOString()
            },
            1787100000002: {
              id: 1787100000002,
              name: "Мобільний додаток",
              description: "Адаптація інтерфейсу для мобільних пристроїв",
              status: "active",
              createdAt: new Date().toISOString()
            }
          },
          tasks: {
            1787200000001: {
              id: 1787200000001,
              projectId: 1787100000001,
              title: "Налаштувати Vue Router та Pinia store",
              assignee: "Олександр",
              status: "done",
              dueDate: "2026-08-20",
              order: 1,
              createdAt: new Date().toISOString()
            },
            1787200000002: {
              id: 1787200000002,
              projectId: 1787100000001,
              title: "Інтегрувати vuedraggable для Kanban-дошки",
              assignee: "Дмитро",
              status: "in_progress",
              dueDate: "2026-08-25",
              order: 1,
              createdAt: new Date().toISOString()
            },
            1787200000003: {
              id: 1787200000003,
              projectId: 1787100000001,
              title: "Налаштувати автозбереження в localStorage",
              assignee: "Олександр",
              status: "todo",
              dueDate: "2026-08-28",
              order: 1,
              createdAt: new Date().toISOString()
            },
            1787200000004: {
              id: 1787200000004,
              projectId: 1787100000001,
              title: "Провести рефакторинг компонентів",
              assignee: "Анастасія",
              status: "todo",
              dueDate: "2026-08-30",
              order: 2,
              createdAt: new Date().toISOString()
            }
          }
        }

        localStorage.setItem('mockData', JSON.stringify(demoMockData))
      }

      reloadMockData()
      await projectsStore.fetchProjects()
    } finally {
      isSeeding.value = false
    }
  }

  return {
    isSeeding,
    loadDemoData
  }
}
