<script setup lang="ts">
import {type DirectiveBinding, ref} from 'vue'
import { ProjectStatus, type ProjectWithTaskCount, type Task } from '@/types'
import { useProjectActions } from '@/composables/useProjectActions'
import { useTaskActions } from '@/composables/useTaskActions'

const props = defineProps<{
  project?: ProjectWithTaskCount
  task?: Task
  index: number
  length: number
}>()

const { openProjectModal, toggleStatus, deleteProject } = useProjectActions()
const { openTaskModal, deleteTask } = useTaskActions()

const isOpen = ref(false)

const vClickOutside = {
  mounted(el: HTMLElement & { _clickOutsideHandler?: (e: MouseEvent) => void }, binding: DirectiveBinding<(e: MouseEvent) => void>) {
    el._clickOutsideHandler = (event: MouseEvent) => {
      // Якщо клік був поза елементом та його дочірніми вузлами
      if (!(el === event.target || el.contains(event.target as Node))) {
        binding.value(event)
      }
    }
    // Запускаємо перехоплення події кліку
    setTimeout(() => {
      document.addEventListener('click', el._clickOutsideHandler!)
    }, 0)
  },
  unmounted(el: HTMLElement & { _clickOutsideHandler?: (e: MouseEvent) => void }) {
    if (el._clickOutsideHandler) {
      document.removeEventListener('click', el._clickOutsideHandler)
    }
  }
}

function toggleDropdown() {
  isOpen.value = !isOpen.value
}

function closeDropdown() {
  isOpen.value = false
}

function handleEdit() {
  if (props.project) {
    openProjectModal(props.project)
  } else if (props.task) {
    openTaskModal(props.task.status, props.task)
  }
  closeDropdown()
}

function handleToggleStatus() {
  if (props.project) {
    toggleStatus(props.project.id, props.project.status)
  }
  closeDropdown()
}

function handleDelete() {
  if (props.project) {
    deleteProject(props.project.id, props.project.name)
  } else if (props.task) {
    deleteTask(props.task.id, props.task.title)
  }
  closeDropdown()
}
</script>

<template>
  <div class="relative shrink-0">
    <button
      type="button"
      @click="toggleDropdown"
      class="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
      title="Опції"
    >
      <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
      </svg>
    </button>

    <!-- Випадаюче меню -->
    <div
      v-if="isOpen"
      v-click-outside="closeDropdown"
      class="absolute right-0 w-36 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg py-1 z-20"
      :class="[
        index >= length - 2 && length > 2
          ? 'bottom-full mb-1 origin-bottom-right'
          : 'top-full mt-1 origin-top-right'
      ]"
    >
      <!-- Редагувати -->
      <button
        type="button"
        @click="handleEdit"
        class="w-full px-3 py-2 text-left text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 flex items-center gap-2 cursor-pointer transition-colors"
      >
        <svg class="w-4 h-4 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
        <span>Редагувати</span>
      </button>

      <!-- Архівувати / Розархівувати (Тільки для Проєкту) -->
      <button
        v-if="project"
        type="button"
        @click="handleToggleStatus"
        class="w-full px-3 py-2 text-left text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 flex items-center gap-2 cursor-pointer transition-colors"
      >
        <svg class="w-4 h-4 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 8h14M5 8a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v1a2 2 0 01-2 2M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8" />
        </svg>
        <span>{{ project.status === ProjectStatus.ARCHIVED ? 'Розархівувати' : 'В архів' }}</span>
      </button>

      <div class="my-1 border-t border-slate-100 dark:border-slate-700"></div>

      <!-- Видалити -->
      <button
        type="button"
        @click="handleDelete"
        class="w-full px-3 py-2 text-left text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2 cursor-pointer transition-colors"
      >
        <svg class="w-4 h-4 text-rose-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
        Видалити
      </button>
    </div>
  </div>
</template>
