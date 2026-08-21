<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { useTheme } from '@/composables/useTheme'

const { isDark, toggleTheme } = useTheme()
</script>

<template>
  <header class="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 transition-colors duration-200">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
      <!-- Логотип -->
      <RouterLink to="/" class="flex items-center gap-3 transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-lg">
        <div class="w-9 h-9 rounded-xl bg-slate-900 dark:bg-emerald-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
          P
        </div>
        <span class="font-bold text-lg tracking-tight text-slate-900 dark:text-white">
          Project<span class="text-emerald-600 dark:text-emerald-400">Tracker</span>
        </span>
      </RouterLink>

      <div class="flex items-center gap-3">
        <!-- Навігація -->
        <nav class="flex items-center gap-1 sm:gap-2">
          <RouterLink
            to="/"
            class="px-3.5 py-2 rounded-lg text-sm font-medium transition-colors text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
            active-class="!text-emerald-700 dark:!text-emerald-400 !bg-emerald-50 dark:!bg-emerald-950/60 font-semibold"
          >
            Проєкти
          </RouterLink>
        </nav>

        <!-- Перемикач теми -->
        <button
          @click="toggleTheme"
          type="button"
          class="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          :title="isDark ? 'Увімкнути світлу тему' : 'Увімкнути темну тему'"
        >
          <!-- Іконка Сонця (показується в темній темі) -->
          <svg v-if="isDark" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          <!-- Іконка Місяця (показується у світлій темі) -->
          <svg v-else class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
        </button>
      </div>
    </div>
  </header>
</template>
