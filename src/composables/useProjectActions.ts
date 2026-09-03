import { ref } from 'vue'
import {type ProjectWithTaskCount, type CreateProjectInput, ProjectStatus} from '@/types'
import { useProjectStore } from '@/stores/projects'
import { toast } from 'vue-sonner'

const isProjectModalOpen = ref(false)
const editingProject = ref<ProjectWithTaskCount | null>(null)

export function useProjectActions() {
  const projectsStore = useProjectStore()
  const isSubmitting = ref(false)

  function openProjectModal(project: ProjectWithTaskCount | null = null) {
    editingProject.value = project
    isProjectModalOpen.value = true
  }

  function closeProjectModal() {
    isProjectModalOpen.value = false
    editingProject.value = null
  }

  async function toggleStatus(projectId: number, currentStatus: ProjectStatus) {
    const newStatus = currentStatus === ProjectStatus.ACTIVE
      ? ProjectStatus.ARCHIVED
      : ProjectStatus.ACTIVE

    await projectsStore.updateProject(projectId, { status: newStatus })

    const statusMessage = newStatus === ProjectStatus.ARCHIVED
      ? 'Проєкт перенесено в архів'
      : 'Проєкт відновлено з архіву'

    toast.success(statusMessage)
  }

  async function createProject(payload: CreateProjectInput, onSuccess?: () => void) {
    isSubmitting.value = true
    try {
      await projectsStore.createProject(payload)
      toast.success('Проєкт успішно створено!')
      onSuccess?.()
    } catch (error) {
      toast.error('Не вдалося створити проєкт')
      throw error
    } finally {
      isSubmitting.value = false
    }
  }

  async function updateProject(id: number, payload: CreateProjectInput, onSuccess?: () => void) {
    isSubmitting.value = true
    try {
      await projectsStore.updateProject(id, payload)
      toast.success('Проєкт успішно збережено!')
      onSuccess?.()
    } catch (error) {
      toast.error('Не вдалося зберегти проєкт')
      throw error
    } finally {
      isSubmitting.value = false
    }
  }

  async function deleteProject(id: number, title: string) {
    if (confirm(`Ви дійсно хочете видалити проєкт "${title}"?`)) {
      await projectsStore.deleteProject(id)
      toast.info('Проєкт видалено')
    }
  }

  return {
    isProjectModalOpen,
    editingProject,
    openProjectModal,
    closeProjectModal,
    toggleStatus,
    isSubmitting,
    createProject,
    updateProject,
    deleteProject
  }
}
