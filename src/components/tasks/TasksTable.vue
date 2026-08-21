<script setup lang="ts">
import {type Task, TaskStatus} from "@/types";
import {formatDate} from '@/utils/formatters'
import {useColumnResize} from '@/composables/useColumnResize'
import {useTaskActions} from "@/composables/useTaskActions.ts";

const props = defineProps<{
  isLoading: boolean
  tasks: Task[]
  searchQuery?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}>()

const { updateTask, deleteTask } = useTaskActions()

const emit = defineEmits<{
  (e: 'sort', field: string): void
}>()

// Хендлер лише сповіщає батьківський компонент
function onSortClick(field: string) {
  emit('sort', field)
}

// --- РЕСАЙЗ КОЛОНОК ---
type TaskColumnKey = 'title' | 'status' | 'dueDate' | 'assignee' | 'createdAt' | 'actions'

const { colWidths, startResize } = useColumnResize<TaskColumnKey>(
  {
    title: 300,
    status: 140,
    dueDate: 160,
    assignee: 180,
    createdAt: 140,
    actions: 80
  },
  {
    actions: 80 // Кастомна мінімальна ширина для колонки дій
  }
)

// Хелпери для статусів
const getStatusBadgeClass = (status: TaskStatus): string => {
  switch (status) {
    case TaskStatus.DONE:
      return 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60'
    case TaskStatus.IN_PROGRESS:
      return 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/60'
    case TaskStatus.TODO:
    default:
      return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
  }
}

const getStatusLabel = (status: TaskStatus) => {
  switch (status) {
    case TaskStatus.DONE: return 'Виконано'
    case TaskStatus.IN_PROGRESS: return 'В роботі'
    default: return 'До виконання'
  }
}
</script>

<template>
  <div class="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden transition-colors duration-200">
    <div class="overflow-x-auto">
      <table class="w-full text-left border-collapse table-fixed">
        <thead>
        <tr class="bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400 tracking-wider select-none">

          <!-- Назва завдання -->
          <th :style="{ width: `${colWidths.title}px` }" class="relative px-5 py-3.5">
            <button @click="onSortClick('title')" class="inline-flex items-center gap-1.5 hover:text-slate-900 dark:hover:text-slate-200 transition-colors cursor-pointer">
              <span>Назва завдання</span>
              <span class="text-slate-400 dark:text-slate-500">
                  <template v-if="sortBy === 'title'">{{ sortOrder === 'asc' ? '↑' : '↓' }}</template>
                  <template v-else>↕</template>
                </span>
            </button>
            <div @mousedown.stop="startResize('title', $event)" class="resize-handle" />
          </th>

          <!-- Статус -->
          <th :style="{ width: `${colWidths.status}px` }" class="relative px-5 py-3.5">
            <button @click="onSortClick('status')" class="inline-flex items-center gap-1.5 hover:text-slate-900 dark:hover:text-slate-200 transition-colors cursor-pointer">
              <span>Статус</span>
              <span class="text-slate-400 dark:text-slate-500">
                  <template v-if="sortBy === 'status'">{{ sortOrder === 'asc' ? '↑' : '↓' }}</template>
                  <template v-else>↕</template>
                </span>
            </button>
            <div @mousedown.stop="startResize('status', $event)" class="resize-handle" />
          </th>

          <!-- Термін виконання (Due Date) -->
          <th :style="{ width: `${colWidths.dueDate}px` }" class="relative px-5 py-3.5">
            <button @click="onSortClick('dueDate')" class="inline-flex items-center gap-1.5 hover:text-slate-900 dark:hover:text-slate-200 transition-colors cursor-pointer">
              <span>Термін виконання</span>
              <span class="text-slate-400 dark:text-slate-500">
                  <template v-if="sortBy === 'dueDate'">{{ sortOrder === 'asc' ? '↑' : '↓' }}</template>
                  <template v-else>↕</template>
                </span>
            </button>
            <div @mousedown.stop="startResize('dueDate', $event)" class="resize-handle" />
          </th>

          <!-- Виконавець -->
          <th :style="{ width: `${colWidths.assignee}px` }" class="relative px-5 py-3.5">
            <span>Виконавець</span>
            <div @mousedown.stop="startResize('assignee', $event)" class="resize-handle" />
          </th>

          <!-- Створено -->
          <th :style="{ width: `${colWidths.createdAt}px` }" class="relative px-5 py-3.5">
            <button @click="onSortClick('createdAt')" class="inline-flex items-center gap-1.5 hover:text-slate-900 dark:hover:text-slate-200 transition-colors cursor-pointer">
              <span>Створено</span>
              <span class="text-slate-400 dark:text-slate-500">
                  <template v-if="sortBy === 'createdAt'">{{ sortOrder === 'asc' ? '↑' : '↓' }}</template>
                  <template v-else>↕</template>
                </span>
            </button>
            <div @mousedown.stop="startResize('createdAt', $event)" class="resize-handle" />
          </th>

          <!-- Дії -->
          <th :style="{ width: `${colWidths.actions}px` }" class="relative px-5 py-3.5 text-right">
            <span>Дії</span>
            <div @mousedown.stop="startResize('actions', $event)" class="resize-handle" />
          </th>

        </tr>
        </thead>

        <tbody class="divide-y divide-slate-100 dark:divide-slate-800/60 text-sm">
        <tr
          v-for="task in tasks"
          :key="task.id"
          class="group hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
        >
          <!-- Назва завдання -->
          <td class="px-5 py-4 min-w-0">
              <span class="font-medium text-slate-900 dark:text-slate-100 truncate block">
                {{ task.title }}
              </span>
          </td>

          <!-- Статус -->
          <td class="px-5 py-4 whitespace-nowrap">
              <span
                class="inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-full border transition-colors"
                :class="getStatusBadgeClass(task.status)"
              >
                {{ getStatusLabel(task.status) }}
              </span>
          </td>

          <!-- Термін виконання -->
          <td class="px-5 py-4 whitespace-nowrap text-xs">
              <span
                v-if="task.dueDate"
                class="inline-flex items-center gap-1.5 px-2 py-1 rounded-md font-medium border bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-slate-200/80 dark:border-slate-700"
              >
                <svg class="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {{ formatDate(task.dueDate) }}
              </span>
            <span v-else class="text-slate-400 dark:text-slate-500 italic">—</span>
          </td>

          <!-- Виконавець -->
          <td class="px-5 py-4 whitespace-nowrap">
            <div v-if="task.assignee" class="flex items-center gap-2" :title="`Виконавець: ${task.assignee}`">
              <div class="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-[10px] font-semibold flex items-center justify-center uppercase shrink-0">
                {{ task.assignee.slice(0, 2) }}
              </div>
              <span class="text-xs text-slate-700 dark:text-slate-300 truncate">{{ task.assignee }}</span>
            </div>
            <span v-else class="text-xs text-slate-400 dark:text-slate-500 italic">Не призначено</span>
          </td>

          <!-- Дата створення -->
          <td class="px-5 py-4 whitespace-nowrap text-xs text-slate-500 dark:text-slate-400">
            {{ formatDate(task.createdAt) }}
          </td>

          <!-- Дії -->
          <td class="px-5 py-4 whitespace-nowrap text-right">
            <div class="flex items-center justify-end gap-1">
              <!-- Видалити -->
              <button
                type="button"
                @click.prevent="deleteTask(task.id, task.title)"
                class="p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-all cursor-pointer"
                title="Видалити завдання"
              >
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </td>
        </tr>

        <!-- Порожній стан -->
        <tr v-if="!tasks || tasks.length === 0">
          <td colspan="6" class="px-5 py-8 text-center text-xs text-slate-400 dark:text-slate-500">
            Завдань не знайдено
          </td>
        </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
