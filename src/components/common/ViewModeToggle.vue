<script setup lang="ts" generic="T extends string">
export interface ToggleOption<T> {
  value: T
  title: string
  icon: 'grid' | 'table' | 'kanban'
}

const model = defineModel<T>({ required: true })

defineProps<{
  options: ToggleOption<T>[]
}>()
</script>

<template>
  <div class="flex items-center p-1 bg-slate-100/80 dark:bg-slate-800/80 rounded-xl border border-slate-200/60 dark:border-slate-700/60 shrink-0 transition-colors">
    <button
      v-for="option in options"
      :key="option.value"
      type="button"
      @click="model = option.value"
      :class="[
        'p-2 rounded-lg transition-all cursor-pointer',
        model === option.value
          ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-slate-100 font-medium'
          : 'text-slate-400 dark:text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
      ]"
      :title="option.title"
      :aria-label="option.title"
    >
      <!-- Іконка Сітки (Grid) -->
      <svg
        v-if="option.icon === 'grid'"
        class="w-4 h-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        stroke-width="2"
      >
        <path stroke-linecap="round" stroke-linejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>

      <!-- Іконка Таблиці (Table) -->
      <svg
        v-else-if="option.icon === 'table'"
        class="w-4 h-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        stroke-width="2"
      >
        <path stroke-linecap="round" stroke-linejoin="round" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>

      <!-- Іконка Канбану (Kanban) -->
      <svg
        v-else-if="option.icon === 'kanban'"
        class="w-4 h-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        stroke-width="2"
      >
        <path stroke-linecap="round" stroke-linejoin="round" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
      </svg>
    </button>
  </div>
</template>
