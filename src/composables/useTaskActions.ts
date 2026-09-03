import {ref} from 'vue'
import {type CreateTaskInput, type Task, type MoveTaskInput, TaskStatus} from '@/types'
import {useTaskStore} from '@/stores/tasks'
import {toast} from 'vue-sonner'

const isTaskModalOpen = ref(false)
const editingTask = ref<Task | null>(null)
const creationTaskStatus = ref<TaskStatus>(TaskStatus.TODO)

export function useTaskActions() {
  const tasksStore = useTaskStore()
  const isSubmitting = ref(false)

  function openTaskModal(status: TaskStatus, task: Task | null = null) {
    creationTaskStatus.value = status
    editingTask.value = task
    isTaskModalOpen.value = true
  }

  function closeTaskModal() {
    isTaskModalOpen.value = false
    editingTask.value = null
  }

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

  async function updateTask(id: number, payload: CreateTaskInput, onSuccess?: () => void) {
    isSubmitting.value = true
    try {
      await tasksStore.updateTask(id, payload)
      toast.success('Завдання успішно збережено!')
      onSuccess?.()
    } catch (error) {
      toast.error('Не вдалося зберегти завдання')
      throw error
    } finally {
      isSubmitting.value = false
    }
  }

  async function moveTask(id: number, payload: MoveTaskInput) {
    try {
      await tasksStore.updateTask(id, payload)
    } catch (error) {
      toast.error('Не вдалося зберегти новий порядок завдань')
    }
  }

  async function deleteTask(id: number, title: string) {
    if (confirm(`Видалити завдання "${title}"?`)) {
      await tasksStore.deleteTask(id)
      toast.info('Завдання видалено')
    }
  }

  return {
    isTaskModalOpen,
    creationTaskStatus,
    editingTask,
    openTaskModal,
    closeTaskModal,
    isSubmitting,
    createTask,
    updateTask,
    moveTask,
    deleteTask
  }
}
