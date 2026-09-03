<script setup lang="ts">
import { watch, onUnmounted, computed } from 'vue'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'
import { useTaskStore } from '@/stores/tasks'
import { useTaskActions } from '@/composables/useTaskActions'
import {TaskStatus} from "@/types";

const props = defineProps<{
  projectId: number
}>()

const tasksStore = useTaskStore()
const {
  isTaskModalOpen,
  creationTaskStatus,
  editingTask,
  closeTaskModal,
  createTask,
  updateTask,
  isSubmitting
} = useTaskActions()

const isEditing = computed(() => !!editingTask?.value?.id)

// Поточна дата YYYY-MM-DD для перевірки мінімальної дати
const minDate = new Date().toISOString().split('T')[0] || ''

// Zod-схема валідації
const taskSchema = toTypedSchema(
  z.object({
    title: z
      .string()
      .trim()
      .min(1, 'Вкажіть назву завдання'),
    assignee: z.string().optional(),
    status: z.nativeEnum(TaskStatus),
    dueDate: z
      .string()
      .min(1, 'Вкажіть термін виконання завдання')
      .refine((date) => !date || date >= minDate, {
        message: 'Дата не може бути в минулому'
      })
  })
)

// Ініціалізація форми VeeValidate
const { handleSubmit, errors, resetForm, defineField } = useForm({
  validationSchema: taskSchema,
  initialValues: {
    title: '',
    assignee: '',
    status: creationTaskStatus.value,
    dueDate: ''
  }
})

// Зв'язування полів з явною можливістю валідації на blur
const [title, titleProps] = defineField('title', { validateOnBlur: true })
const [assignee, assigneeProps] = defineField('assignee', { validateOnBlur: true })
const [dueDate, dueDateProps] = defineField('dueDate', { validateOnBlur: true })
const [status, statusProps] = defineField('status', { validateOnBlur: true })

function syncForm() {
  if (editingTask?.value) {
    resetForm({
      values: {
        title: editingTask.value.title || '',
        assignee: editingTask.value.assignee || '',
        status: editingTask.value.status || creationTaskStatus.value,
        dueDate: editingTask.value.dueDate || ''
      }
    })
  } else {
    resetForm({
      values: {
        title: '',
        assignee: '',
        status: creationTaskStatus.value,
        dueDate: ''
      }
    })
  }
}

// Обробка відправки форми
const onSubmit = handleSubmit(async (values) => {
  const payload = {
    projectId: props.projectId,
    title: values.title.trim(),
    assignee: values.assignee?.trim() || '',
    status: values.status,
    dueDate: values.dueDate
  }

  if (editingTask?.value?.id) {
    await updateTask(editingTask.value.id, payload, closeTaskModal)
  } else {
    await createTask(payload, closeTaskModal)
  }
})

function handleKeyDown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    closeTaskModal()
  }
}

watch(
  [isTaskModalOpen, editingTask],
  ([isOpen]) => {
    if (isOpen) {
      syncForm()
      window.addEventListener('keydown', handleKeyDown)
    } else {
      window.removeEventListener('keydown', handleKeyDown)
    }
  },
  { immediate: true }
)

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
})
</script>

<template>
  <div
    v-if="isTaskModalOpen"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 dark:bg-slate-950/70 backdrop-blur-xs"
    @click.self="closeTaskModal()"
  >
    <div class="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 dark:border-slate-800 space-y-5">
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-bold text-slate-900 dark:text-white">
          {{ isEditing ? 'Редагувати завдання' : 'Нове завдання' }}
        </h3>
        <button
          type="button"
          @click="closeTaskModal()"
          class="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          ✕
        </button>
      </div>

      <form @submit.prevent="onSubmit" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Назва <span class="text-rose-500">*</span>
          </label>
          <input
            v-model="title"
            v-bind="titleProps"
            type="text"
            placeholder="Наприклад: Зверстати верстку шапки"
            class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 dark:focus:border-emerald-400 transition-all"
            :class="{ 'border-rose-400 dark:border-rose-500 bg-rose-50/30 dark:bg-rose-950/30': errors.title }"
          />
          <p v-if="errors.title" class="text-xs text-rose-500 dark:text-rose-400 mt-1.5">{{ errors.title }}</p>
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Виконавець
          </label>
          <input
            v-model="assignee"
            v-bind="assigneeProps"
            type="text"
            list="assignees-list"
            placeholder="Наприклад: Олександр Поліщук"
            class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 dark:focus:border-emerald-400 transition-all"
          />

          <datalist id="assignees-list">
            <option
              v-for="name in tasksStore.availableAssignees"
              :key="name"
              :value="name"
            />
          </datalist>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Термін виконання <span class="text-rose-500">*</span>
            </label>
            <input
              v-model="dueDate"
              v-bind="dueDateProps"
              type="date"
              :min="minDate"
              class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 dark:focus:border-emerald-400 transition-all cursor-pointer"
              :class="{ 'border-rose-400 dark:border-rose-500 bg-rose-50/30 dark:bg-rose-950/30': errors.dueDate }"
            />
            <p v-if="errors.dueDate" class="text-xs text-rose-500 dark:text-rose-400 mt-1.5">{{ errors.dueDate }}</p>
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Колонка</label>
            <select
              v-model="status"
              v-bind="statusProps"
              class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-400"
            >
              <option :value="TaskStatus.TODO">До виконання</option>
              <option :value="TaskStatus.IN_PROGRESS">В роботі</option>
              <option :value="TaskStatus.DONE">Виконано</option>
            </select>
          </div>
        </div>

        <div class="flex justify-end gap-3 pt-3">
          <button
            type="button"
            @click="closeTaskModal()"
            class="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Скасувати
          </button>
          <button
            type="submit"
            :disabled="isSubmitting"
            class="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white text-sm font-medium shadow-xs disabled:opacity-50 cursor-pointer transition-colors"
          >
            <template v-if="isSubmitting">
              {{ isEditing ? 'Збереження...' : 'Додавання...' }}
            </template>
            <template v-else>
              {{ isEditing ? 'Зберегти' : 'Додати' }}
            </template>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
