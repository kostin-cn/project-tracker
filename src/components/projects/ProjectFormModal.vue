<script setup lang="ts">
import { watch, computed, onUnmounted } from 'vue'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'
import { useProjectActions } from '@/composables/useProjectActions'

const {
  isProjectModalOpen,
  editingProject,
  closeProjectModal,
  createProject,
  updateProject,
  isSubmitting
} = useProjectActions()

const isEditing = computed(() => !!editingProject.value?.id)

// Zod-схема валідації
const projectSchema = toTypedSchema(
  z.object({
    name: z
      .string()
      .trim()
      .min(1, 'Вкажіть назву проєкту')
      .max(100, 'Назва проєкту не повинна перевищувати 100 символів'),
    description: z
      .string()
      .max(500, 'Опис не повинен перевищувати 500 символів')
      .optional()
  })
)

// Ініціалізація форми
const { handleSubmit, errors, resetForm, defineField } = useForm({
  validationSchema: projectSchema,
  initialValues: {
    name: '',
    description: ''
  }
})

// defineField повертає значення та атрибути (включаючи onBlur)
const [name, nameProps] = defineField('name', {
  validateOnBlur: true // Явно гарантує валідацію при втраті фокусу
})

const [description, descriptionProps] = defineField('description', {
  validateOnBlur: true
})

function syncForm() {
  if (editingProject.value) {
    resetForm({
      values: {
        name: editingProject.value.name || '',
        description: editingProject.value.description || ''
      }
    })
  } else {
    resetForm({
      values: {
        name: '',
        description: ''
      }
    })
  }
}

// handleSubmit спрацьовує при submit і провалідовує всі поля одразу
const onSubmit = handleSubmit(async (values) => {
  const payload = {
    name: values.name.trim(),
    description: values.description?.trim() || ''
  }

  if (editingProject.value?.id) {
    await updateProject(editingProject.value.id, payload, closeProjectModal)
  } else {
    await createProject(payload, closeProjectModal)
  }
})

function handleKeyDown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    closeProjectModal()
  }
}

watch(
  [isProjectModalOpen, editingProject],
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
    v-if="isProjectModalOpen"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 dark:bg-slate-950/70 backdrop-blur-xs transition-opacity"
    @click.self="closeProjectModal()"
  >
    <div class="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 dark:border-slate-800 space-y-6 transition-colors duration-200">
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-bold text-slate-900 dark:text-white">
          {{ isEditing ? 'Редагувати проєкт' : 'Новий проєкт' }}
        </h3>
        <button
          type="button"
          @click="closeProjectModal()"
          class="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          ✕
        </button>
      </div>

      <form @submit.prevent="onSubmit" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Назва проєкту <span class="text-rose-500 dark:text-rose-400">*</span>
          </label>
          <!-- v-bind="nameProps" транслює на інпут події onBlur та onChange -->
          <input
            v-model="name"
            v-bind="nameProps"
            type="text"
            placeholder="Наприклад: Розробка веб-сайту"
            class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            :class="{ 'border-rose-400 dark:border-rose-500 bg-rose-50/30 dark:bg-rose-950/30': errors.name }"
          />
          <p v-if="errors.name" class="text-xs text-rose-500 dark:text-rose-400 mt-1.5">
            {{ errors.name }}
          </p>
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Опис проєкту
          </label>
          <textarea
            v-model="description"
            v-bind="descriptionProps"
            rows="3"
            placeholder="Короткий опис цілей або етапів..."
            class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all resize-none"
            :class="{ 'border-rose-400 dark:border-rose-500 bg-rose-50/30 dark:bg-rose-950/30': errors.description }"
          ></textarea>
          <p v-if="errors.description" class="text-xs text-rose-500 dark:text-rose-400 mt-1.5">
            {{ errors.description }}
          </p>
        </div>

        <div class="flex justify-end gap-3 pt-2">
          <button
            type="button"
            @click="closeProjectModal()"
            class="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Скасувати
          </button>
          <button
            type="submit"
            :disabled="isSubmitting"
            class="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white text-sm font-medium transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
          >
            <template v-if="isSubmitting">
              {{ isEditing ? 'Збереження...' : 'Створення...' }}
            </template>
            <template v-else>
              {{ isEditing ? 'Зберегти' : 'Створити' }}
            </template>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
