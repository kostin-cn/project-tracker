import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { tasksApi } from '@/api/tasks'
import { TaskStatus } from '@/types'
import type { Task, CreateTaskInput } from '@/types'

export const useTaskStore = defineStore('tasks', () => {
  const tasks = ref<Task[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const availableAssignees = computed(() => {
    const assignees = tasks.value
      .map(task => task.assignee)
      .filter((assignee): assignee is string => Boolean(assignee))

    return Array.from(new Set(assignees))
  })

  const todoTasks = computed(() =>
    tasks.value
      .filter(t => t.status === TaskStatus.TODO)
      .sort((a, b) => a.order - b.order)
  )

  const inProgressTasks = computed(() =>
    tasks.value
      .filter(t => t.status === TaskStatus.IN_PROGRESS)
      .sort((a, b) => a.order - b.order)
  )

  const doneTasks = computed(() =>
    tasks.value
      .filter(t => t.status === TaskStatus.DONE)
      .sort((a, b) => a.order - b.order)
  )

  async function fetchAllTasks() {
    isLoading.value = true
    error.value = null
    try {
      tasks.value = await tasksApi.getAll()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Помилка завантаження завдань'
    } finally {
      isLoading.value = false
    }
  }

  async function fetchTasksByProject(projectId: number) {
    isLoading.value = true
    error.value = null
    try {
      tasks.value = await tasksApi.getByProjectId(projectId)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Помилка завантаження завдань'
    } finally {
      isLoading.value = false
    }
  }

  async function createTask(input: CreateTaskInput) {
    try {
      const newTask = await tasksApi.create(input)
      tasks.value.push(newTask)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Помилка створення завдання'
      throw err
    }
  }

  async function updateTask(id: number, payload: Partial<Task>) {
    try {
      const updatedTask = await tasksApi.update(id, payload)
      const index = tasks.value.findIndex(t => t.id === id)
      if (index !== -1) {
        tasks.value[index] = updatedTask
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Помилка оновлення завдання'
      throw err
    }
  }

  async function deleteTask(id: number) {
    try {
      await tasksApi.delete(id)
      tasks.value = tasks.value.filter(t => t.id !== id)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Помилка видалення завдання'
      throw err
    }
  }

  async function syncTasksOrder(updatedTasks: Task[]) {
    updatedTasks.forEach((task, index) => {
      task.order = index
      updateTask(task.id, { order: index, status: task.status })
    })
  }

  return {
    tasks,
    isLoading,
    error,
    availableAssignees,
    todoTasks,
    inProgressTasks,
    doneTasks,
    fetchAllTasks,
    fetchTasksByProject,
    createTask,
    updateTask,
    deleteTask,
    syncTasksOrder
  }
})
