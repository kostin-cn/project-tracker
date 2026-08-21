import { ref } from 'vue'
import {type CreateTaskInput, type Task} from '@/types'
import { useTaskStore } from '@/stores/tasks'
import { toast } from 'vue-sonner'

export function useTaskActions() {
  const tasksStore = useTaskStore()
  const isSubmitting = ref(false)

  async function createTask(payload: CreateTaskInput, onSuccess?: () => void) {
    isSubmitting.value = true
    try {
      await tasksStore.createTask(payload)
      toast.success('Завдання додано!')
      onSuccess?.()
    } catch (error) {
      toast.error('Не вдалося додати завдання')
      throw error
    } finally {
      isSubmitting.value = false
    }
  }

  async function updateTask(id: number, payload: Task) {
    await tasksStore.updateTask(id, payload)
  }

  async function deleteTask(id: number, title: string) {
    if (confirm(`Видалити завдання "${title}"?`)) {
      await tasksStore.deleteTask(id)
      toast.info('Завдання видалено')
    }
  }

  return {
    isSubmitting,
    createTask,
    updateTask,
    deleteTask
  }
}
