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
  <div class="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs">
    <h3 class="text-base font-semibold text-slate-900 mb-4">Розподіл завдань</h3>

    <!-- Якщо немає завдань -->
    <div v-if="stats.total === 0" class="text-center py-8 text-sm text-slate-400">
      Немає завдань для відображення статистики
    </div>

    <div v-else class="flex flex-col sm:flex-row items-center gap-6 justify-between">
      <!-- Donut Chart (SVG) -->
      <div class="relative w-36 h-36 shrink-0 flex items-center justify-center">
        <svg class="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <!-- Фон круга -->
          <circle cx="50" cy="50" r="40" stroke="#f1f5f9" stroke-width="12" fill="none" />

          <!-- Сегмент TODO (Amber/Slate) -->
          <circle
            cx="50" cy="50" r="40"
            stroke="#94a3b8" stroke-width="12" fill="none"
            :stroke-dasharray="`${strokeDasharray.todoLen} ${strokeDasharray.circumference}`"
            :stroke-dashoffset="-strokeDasharray.doneLen - strokeDasharray.inProgressLen"
            class="transition-all duration-500"
          />

          <!-- Сегмент IN_PROGRESS (Blue) -->
          <circle
            cx="50" cy="50" r="40"
            stroke="#3b82f6" stroke-width="12" fill="none"
            :stroke-dasharray="`${strokeDasharray.inProgressLen} ${strokeDasharray.circumference}`"
            :stroke-dashoffset="-strokeDasharray.doneLen"
            class="transition-all duration-500"
          />

          <!-- Сегмент DONE (Emerald) -->
          <circle
            cx="50" cy="50" r="40"
            stroke="#10b981" stroke-width="12" fill="none"
            :stroke-dasharray="`${strokeDasharray.doneLen} ${strokeDasharray.circumference}`"
            stroke-dashoffset="0"
            class="transition-all duration-500"
          />
        </svg>

        <!-- Текст у центрі -->
        <div class="absolute text-center">
          <span class="block text-2xl font-bold text-slate-900 leading-none">{{ stats.total }}</span>
          <span class="text-[11px] text-slate-400 font-medium">Всього</span>
        </div>
      </div>

      <!-- Легенда / Деталізація -->
      <div class="w-full space-y-3">
        <!-- Виконано -->
        <div class="flex items-center justify-between text-sm">
          <div class="flex items-center gap-2">
            <span class="w-3 h-3 rounded-full bg-emerald-500"></span>
            <span class="text-slate-600">Виконано</span>
          </div>
          <div class="font-semibold text-slate-900">
            {{ stats.done.count }} <span class="text-xs text-slate-400 font-normal">({{ stats.done.percent }}%)</span>
          </div>
        </div>

        <!-- В роботі -->
        <div class="flex items-center justify-between text-sm">
          <div class="flex items-center gap-2">
            <span class="w-3 h-3 rounded-full bg-blue-500"></span>
            <span class="text-slate-600">В роботі</span>
          </div>
          <div class="font-semibold text-slate-900">
            {{ stats.inProgress.count }} <span class="text-xs text-slate-400 font-normal">({{ stats.inProgress.percent }}%)</span>
          </div>
        </div>

        <!-- До виконання -->
        <div class="flex items-center justify-between text-sm">
          <div class="flex items-center gap-2">
            <span class="w-3 h-3 rounded-full bg-slate-400"></span>
            <span class="text-slate-600">До виконання</span>
          </div>
          <div class="font-semibold text-slate-900">
            {{ stats.todo.count }} <span class="text-xs text-slate-400 font-normal">({{ stats.todo.percent }}%)</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
