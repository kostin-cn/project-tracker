<script setup lang="ts">
import { computed } from 'vue'
import { useTaskStore } from '@/stores/tasks'
import { TaskStatus } from '@/types' // твій Enum статусів

const tasksStore = useTaskStore()

// Підрахунок кількості та відсотків для кожного статусу
const stats = computed(() => {
  const tasks = tasksStore.tasks || []
  const total = tasks.length

  const todo = tasks.filter((t) => t.status === TaskStatus.TODO).length
  const inProgress = tasks.filter((t) => t.status === TaskStatus.IN_PROGRESS).length
  const done = tasks.filter((t) => t.status === TaskStatus.DONE).length

  const calcPercent = (count: number) => (total ? Math.round((count / total) * 100) : 0)

  return {
    total,
    todo: { count: todo, percent: calcPercent(todo) },
    inProgress: { count: inProgress, percent: calcPercent(inProgress) },
    done: { count: done, percent: calcPercent(done) }
  }
})

// Розрахунок SVG stroke-dasharray для Donut Chart
const strokeDasharray = computed(() => {
  const { todo, inProgress, done } = stats.value
  const circumference = 2 * Math.PI * 40 // 251.2px

  const doneLen = (done.percent / 100) * circumference
  const inProgressLen = (inProgress.percent / 100) * circumference
  const todoLen = (todo.percent / 100) * circumference

  return { circumference, doneLen, inProgressLen, todoLen }
})
</script>

<template>
  <div class="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-xs transition-colors duration-200">
    <h3 class="text-base font-semibold text-slate-900 dark:text-white mb-4">Розподіл завдань</h3>

    <!-- Якщо немає завдань -->
    <div v-if="stats.total === 0" class="text-center py-8 text-sm text-slate-400 dark:text-slate-500">
      Немає завдань для відображення статистики
    </div>

    <div v-else class="flex flex-col sm:flex-row items-center gap-6 justify-between">
      <!-- Donut Chart (SVG) -->
      <div class="relative w-36 h-36 shrink-0 flex items-center justify-center">
        <svg class="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <!-- Фон круга -->
          <circle
            cx="50" cy="50" r="40"
            stroke-width="12" fill="none"
            class="stroke-slate-100 dark:stroke-slate-800"
          />

          <!-- Сегмент TODO (Slate) -->
          <circle
            cx="50" cy="50" r="40"
            stroke-width="12" fill="none"
            :stroke-dasharray="`${strokeDasharray.todoLen} ${strokeDasharray.circumference}`"
            :stroke-dashoffset="-strokeDasharray.doneLen - strokeDasharray.inProgressLen"
            class="stroke-slate-400 dark:stroke-slate-500 transition-all duration-500"
          />

          <!-- Сегмент IN_PROGRESS (Blue) -->
          <circle
            cx="50" cy="50" r="40"
            stroke-width="12" fill="none"
            :stroke-dasharray="`${strokeDasharray.inProgressLen} ${strokeDasharray.circumference}`"
            :stroke-dashoffset="-strokeDasharray.doneLen"
            class="stroke-blue-500 dark:stroke-blue-400 transition-all duration-500"
          />

          <!-- Сегмент DONE (Emerald) -->
          <circle
            cx="50" cy="50" r="40"
            stroke-width="12" fill="none"
            :stroke-dasharray="`${strokeDasharray.doneLen} ${strokeDasharray.circumference}`"
            stroke-dashoffset="0"
            class="stroke-emerald-500 dark:stroke-emerald-400 transition-all duration-500"
          />
        </svg>

        <!-- Текст у центрі -->
        <div class="absolute text-center">
          <span class="block text-2xl font-bold text-slate-900 dark:text-white leading-none">{{ stats.total }}</span>
          <span class="text-[11px] text-slate-400 dark:text-slate-500 font-medium">Всього</span>
        </div>
      </div>

      <!-- Легенда / Деталізація -->
      <div class="w-full space-y-3">
        <!-- Виконано -->
        <div class="flex items-center justify-between text-sm">
          <div class="flex items-center gap-2">
            <span class="w-3 h-3 rounded-full bg-emerald-500 dark:bg-emerald-400"></span>
            <span class="text-slate-600 dark:text-slate-400">Виконано</span>
          </div>
          <div class="font-semibold text-slate-900 dark:text-white">
            {{ stats.done.count }} <span class="text-xs text-slate-400 dark:text-slate-500 font-normal">({{ stats.done.percent }}%)</span>
          </div>
        </div>

        <!-- В роботі -->
        <div class="flex items-center justify-between text-sm">
          <div class="flex items-center gap-2">
            <span class="w-3 h-3 rounded-full bg-blue-500 dark:bg-blue-400"></span>
            <span class="text-slate-600 dark:text-slate-400">В роботі</span>
          </div>
          <div class="font-semibold text-slate-900 dark:text-white">
            {{ stats.inProgress.count }} <span class="text-xs text-slate-400 dark:text-slate-500 font-normal">({{ stats.inProgress.percent }}%)</span>
          </div>
        </div>

        <!-- До виконання -->
        <div class="flex items-center justify-between text-sm">
          <div class="flex items-center gap-2">
            <span class="w-3 h-3 rounded-full bg-slate-400 dark:bg-slate-500"></span>
            <span class="text-slate-600 dark:text-slate-400">До виконання</span>
          </div>
          <div class="font-semibold text-slate-900 dark:text-white">
            {{ stats.todo.count }} <span class="text-xs text-slate-400 dark:text-slate-500 font-normal">({{ stats.todo.percent }}%)</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
