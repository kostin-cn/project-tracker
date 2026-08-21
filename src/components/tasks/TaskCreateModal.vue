<script setup lang="ts">
import { reactive, watch, onUnmounted } from 'vue'
import { useTaskStore } from '@/stores/tasks'
import {TaskStatus} from "@/types";
import { useTaskActions } from '@/composables/useTaskActions.ts'

const props = defineProps<{
  projectId: number,
  creationStatus: TaskStatus
}>()

const isOpen = defineModel<boolean>('isOpen', { default: false })
const tasksStore = useTaskStore()
const { createTask, isSubmitting } = useTaskActions()

// Отримуємо поточну дату у форматі YYYY-MM-DD
const minDate = new Date().toISOString().split('T')[0] || ''

const form = reactive({
  title: '',
  assignee: '',
  status: props.creationStatus,
  dueDate: ''
})

const errors = reactive({
  title: '',
  dueDate: ''
})

function closeModal() {
  isOpen.value = false
}

function resetForm() {
  form.title = ''
  form.assignee = ''
  form.status = props.creationStatus
  form.dueDate = ''
  errors.title = ''
  errors.dueDate = ''
}

async function handleSubmit() {

  errors.title = !form.title.trim() ? 'Вкажіть назву завдання' : ''
  errors.dueDate = !form.dueDate ? 'Вкажіть термін виконання завдання' : ''

  if (form.dueDate && form.dueDate < minDate) errors.dueDate = 'Дата не може бути в минулому'

  if (errors.title || errors.dueDate) return;

  await createTask({
    projectId: props.projectId,
    title: form.title.trim(),
    assignee: form.assignee?.trim() || '',
    status: form.status,
    dueDate: form.dueDate
  }, closeModal)
}

function handleKeyDown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    closeModal()
  }
}

watch(isOpen, (newVal) => {
  if (newVal) {
    resetForm()
    window.addEventListener('keydown', handleKeyDown)
  } else {
    window.removeEventListener('keydown', handleKeyDown)
  }
})

// Примусове очищення на випадок, якщо компонент знищиться при відкритій модалці
onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
})
</script>

<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 dark:bg-slate-950/70 backdrop-blur-xs"
    @click.self="closeModal"
  >
    <div class="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 dark:border-slate-800 space-y-5">
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-bold text-slate-900 dark:text-white">Нове завдання</h3>
        <button @click="closeModal" class="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 p-1">✕</button>
      </div>

      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Назва <span class="text-rose-500">*</span>
          </label>
          <input
            v-model="form.title"
            type="text"
            placeholder="Наприклад: Зверстати верстку шапки"
            class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 dark:focus:border-emerald-400"
            :class="{ 'border-rose-400 dark:border-rose-500 bg-rose-50/30 dark:bg-rose-950/30': errors.title }"
          />
          <p v-if="errors.title" class="text-xs text-rose-500 dark:text-rose-400 mt-1">{{ errors.title }}</p>
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Виконавець
          </label>
          <input
            v-model="form.assignee"
            type="text"
            list="assignees-list"
            placeholder="Наприклад: Олександр Поліщук"
            class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 dark:focus:border-emerald-400 transition-all"
          />

          <!-- Список підказок з гетера taskStore -->
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
              v-model="form.dueDate"
              type="date"
              :min="minDate"
              class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 dark:focus:border-emerald-400 transition-all cursor-pointer"
              :class="{ 'border-rose-400 dark:border-rose-500 bg-rose-50/30 dark:bg-rose-950/30': errors.dueDate }"
            />
            <p v-if="errors.dueDate" class="text-xs text-rose-500 dark:text-rose-400 mt-1">{{ errors.dueDate }}</p>
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Колонка</label>
            <select
              v-model="form.status"
              class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-400"
            >
              <option value="todo">До виконання</option>
              <option value="in_progress">В роботі</option>
              <option value="done">Виконано</option>
            </select>
          </div>
        </div>

        <div class="flex justify-end gap-3 pt-3">
          <button
            type="button"
            @click="closeModal"
            class="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Скасувати
          </button>
          <button
            type="submit"
            :disabled="isSubmitting"
            class="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white text-sm font-medium shadow-xs disabled:opacity-50 cursor-pointer transition-colors"
          >
            {{ isSubmitting ? 'Збереження...' : 'Додати' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
