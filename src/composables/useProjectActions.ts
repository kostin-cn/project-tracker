import { ref } from 'vue'
import {type CreateProjectInput, ProjectStatus} from '@/types'
import { useProjectStore } from '@/stores/projects'
import { toast } from 'vue-sonner'

export function useProjectActions() {
  const projectsStore = useProjectStore()
  const isSubmitting = ref(false)

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

  async function deleteProject(id: number, title: string) {
    if (confirm(`Ви дійсно хочете видалити проєкт "${title}"?`)) {
      await projectsStore.deleteProject(id)
      toast.info('Проєкт видалено')
    }
  }

  return {
    toggleStatus,
    isSubmitting,
    createProject,
    deleteProject
  }
}
