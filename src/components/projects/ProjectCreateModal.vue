<script setup lang="ts">
import { reactive, watch, onUnmounted } from 'vue'
import { useProjectActions } from '@/composables/useProjectActions'

const isOpen = defineModel<boolean>('isOpen', { default: false })
const { createProject, isSubmitting } = useProjectActions()

const form = reactive({
  title: '',
  description: ''
})

const errors = reactive({
  title: ''
})

function closeModal() {
  isOpen.value = false
}

function resetForm() {
  form.title = ''
  form.description = ''
  errors.title = ''
}

function validateForm(): boolean {
  errors.title = ''
  if (!form.title.trim()) {
    errors.title = 'Вкажіть назву проєкту'
    return false
  }
  return true
}

async function handleSubmit() {
  if (!validateForm()) return

  await createProject({
    name: form.title.trim(),
    description: form.description?.trim()
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
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 dark:bg-slate-950/70 backdrop-blur-xs transition-opacity"
    @click.self="closeModal"
  >
    <div class="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 dark:border-slate-800 space-y-6 transition-colors duration-200">
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-bold text-slate-900 dark:text-white">Новий проєкт</h3>
        <button
          @click="closeModal"
          class="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          ✕
        </button>
      </div>

      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Назва проєкту <span class="text-rose-500 dark:text-rose-400">*</span>
          </label>
          <input
            v-model="form.title"
            type="text"
            placeholder="Наприклад: Розробка веб-сайту"
            class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            :class="{ 'border-rose-400 dark:border-rose-500 bg-rose-50/30 dark:bg-rose-950/30': errors.title }"
          />
          <p v-if="errors.title" class="text-xs text-rose-500 dark:text-rose-400 mt-1.5">
            {{ errors.title }}
          </p>
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Опис проєкту
          </label>
          <textarea
            v-model="form.description"
            rows="3"
            placeholder="Короткий опис цілей або етапів..."
            class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all resize-none"
          ></textarea>
        </div>

        <div class="flex justify-end gap-3 pt-2">
          <button
            type="button"
            @click="closeModal"
            class="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Скасувати
          </button>
          <button
            type="submit"
            :disabled="isSubmitting"
            class="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white text-sm font-medium transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
          >
            {{ isSubmitting ? 'Створення...' : 'Створити' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
