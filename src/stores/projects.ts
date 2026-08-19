import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { projectsApi } from '@/api/projects'
import { useTaskStore } from './tasks'
import type { Project, CreateProjectInput } from '@/types'

export const useProjectStore = defineStore('projects', () => {
  const taskStore = useTaskStore()

  const projects = ref<Project[]>([])
  const currentProject = ref<Project | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const projectsWithTaskCount = computed(() => {
    return projects.value.map(project => ({
      ...project,
      tasksCount: taskStore.tasks.filter(t => t.projectId === project.id).length,
      doneTasksCount: taskStore.doneTasks.filter(t => t.projectId === project.id).length
    }))
  })

  async function fetchProjects() {
    isLoading.value = true
    error.value = null
    try {
      const [fetchedProjects] = await Promise.all([
        projectsApi.getAll(),
        taskStore.fetchAllTasks()
      ])

      projects.value = fetchedProjects
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Помилка завантаження проектів'
    } finally {
      isLoading.value = false
    }
  }

  async function fetchProjectById(id: number) {
    isLoading.value = true
    error.value = null
    try {
      const [fetchedProject] = await Promise.all([
        projectsApi.getById(id),
        taskStore.fetchTasksByProject(id)
      ])

      currentProject.value = fetchedProject
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Проект не знайдено'
      currentProject.value = null
    } finally {
      isLoading.value = false
    }
  }

  async function createProject(input: CreateProjectInput) {
    try {
      const newProject = await projectsApi.create(input)
      projects.value.push(newProject)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Помилка створення проекту'
      throw err
    }
  }

  async function updateProject(id: number, payload: Partial<Project>) {
    try {
      const updated = await projectsApi.update(id, payload)

      const index = projects.value.findIndex(p => p.id === id)
      if (index !== -1) projects.value[index] = updated

      if (currentProject.value?.id === id) {
        currentProject.value = updated
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Помилка оновлення проекту'
      throw err
    }
  }

  async function deleteProject(id: number) {
    try {
      await projectsApi.delete(id)
      projects.value = projects.value.filter(p => p.id !== id)
      if (currentProject.value?.id === id) {
        currentProject.value = null
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Помилка видалення проекту'
      throw err
    }
  }

  return {
    projects,
    currentProject,
    isLoading,
    error,
    projectsWithTaskCount,
    fetchProjects,
    fetchProjectById,
    createProject,
    updateProject,
    deleteProject
  }
})
