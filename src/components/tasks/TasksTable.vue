<script setup lang="ts">
import { ref, watch } from 'vue'
import draggable from 'vuedraggable'
import { toast } from 'vue-sonner'
import type { Task, TaskStatus } from '@/types'
import { formatDate } from '@/utils/formatters'
import { useTaskStore } from '@/stores/tasks'
import { useTaskActions } from "@/composables/useTaskActions.ts"
import { useColumnResize } from '@/composables/useColumnResize'
import ActionDropdown from '@/components/common/ActionDropdown.vue'

const props = defineProps<{
  projectId: number
  isDndDisabled: boolean
  tasks: Task[]
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}>()

const emit = defineEmits<{
  (e: 'change-sort', field: string): void
}>()

const tasksStore = useTaskStore()
const { moveTask } = useTaskActions()

// --- ЛОКАЛЬНИЙ СТАН ТА СИНХРОНІЗАЦІЯ ДЛЯ DND ---
const localTasks = ref<Task[]>([])

function syncTableTasks() {
  localTasks.value = [...props.tasks]
}

watch(
  () => props.tasks,
  () => syncTableTasks(),
  { immediate: true, deep: true }
)

// --- ВАЛІДАЦІЯ ПЕРЕМІЩЕННЯ (ТІЛЬКИ ОДНАКОВІ СТАТУСИ) ---
interface DraggableMoveEvent {
  draggedContext: {
    index: number
    element: Task
    futureIndex: number
  }
  relatedContext: {
    index: number
    element: Task
    list: Task[]
  }
}

function onMove(event: DraggableMoveEvent) {
  if (props.isDndDisabled) return false

  const draggedTask = event.draggedContext?.element as Task | undefined
  const targetTask = event.relatedContext?.element as Task | undefined

  if (!draggedTask || !targetTask) return false

  // Забороняємо перетягування, якщо статуси завдань відрізняються
  return draggedTask.status === targetTask.status
}

// --- ОБРОБКА ЗМІНИ ПОРЯДКУ (DND) ---
async function onChange() {
  if (props.isDndDisabled) {
    syncTableTasks()
    return
  }

  try {
    const tasksToUpdate: Promise<void>[] = []

    // Перераховуємо order для всіх елементів у відфільтрованому/відсортованому списку
    localTasks.value.forEach((task, index) => {
      const newOrder = index + 1
      if (task.order !== newOrder) {
        task.order = newOrder
        tasksToUpdate.push(moveTask(task.id, { order: newOrder }))
      }
    })

    await Promise.all(tasksToUpdate)

  } catch (error) {
    toast.error('Не вдалося зберегти новий порядок завдань')
    await tasksStore.fetchTasksByProject(props.projectId)
  }
}

// Хендлер сповіщає батьківський компонент про зміну сортування
function onSortClick(field: string) {
  emit('change-sort', field)
}

// --- РЕСАЙЗ КОЛОНОК ---
type TaskColumnKey = 'drag' | 'title' | 'status' | 'dueDate' | 'assignee' | 'createdAt' | 'actions'

const { colWidths, startResize } = useColumnResize<TaskColumnKey>(
  {
    drag: 40,
    title: 300,
    status: 140,
    dueDate: 160,
    assignee: 180,
    createdAt: 140,
    actions: 56
  },
  {
    drag: 40,
    actions: 48
  }
)

// Хелпери для статусів
const getStatusBadgeClass = (status: TaskStatus): string => {
  switch (status) {
    case 'done':
      return 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60'
    case 'in_progress':
      return 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/60'
    case 'todo':
    default:
      return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
  }
}

const getStatusLabel = (status: TaskStatus) => {
  switch (status) {
    case 'done': return 'Виконано'
    case 'in_progress': return 'В роботі'
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

          <!-- Колонка ручки перетягування -->
          <th :style="{ width: `${colWidths.drag}px` }" class="px-2 py-3.5 text-center">
            <span class="sr-only">Перетягування</span>
          </th>

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

          <!-- Термін виконання -->
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
            <button @click="onSortClick('assignee')" class="inline-flex items-center gap-1.5 hover:text-slate-900 dark:hover:text-slate-200 transition-colors cursor-pointer">
              <span>Виконавець</span>
              <span class="text-slate-400 dark:text-slate-500">
                  <template v-if="sortBy === 'assignee'">{{ sortOrder === 'asc' ? '↑' : '↓' }}</template>
                  <template v-else>↕</template>
                </span>
            </button>
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

        <!-- СТАН ЗАВАНТАЖЕННЯ (Скелетон) -->
        <tbody v-if="tasksStore.isLoading" class="divide-y divide-slate-100 dark:divide-slate-800/60 text-sm">
        <tr v-for="i in 5" :key="i" class="animate-pulse">
          <td class="px-2 py-4 text-center">
            <div class="w-4 h-4 bg-slate-200 dark:bg-slate-800 rounded mx-auto"></div>
          </td>
          <td class="px-5 py-4 min-w-0">
            <div class="h-4 bg-slate-200 dark:bg-slate-800 rounded-md w-3/4"></div>
          </td>
          <td class="px-5 py-4 whitespace-nowrap">
            <div class="h-5 bg-slate-200 dark:bg-slate-800 rounded-full w-20"></div>
          </td>
          <td class="px-5 py-4 whitespace-nowrap">
            <div class="h-6 bg-slate-200 dark:bg-slate-800 rounded-md w-24"></div>
          </td>
          <td class="px-5 py-4 whitespace-nowrap">
            <div class="flex items-center gap-2">
              <div class="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-800 shrink-0"></div>
              <div class="h-3.5 bg-slate-200 dark:bg-slate-800 rounded w-20"></div>
            </div>
          </td>
          <td class="px-5 py-4 whitespace-nowrap">
            <div class="h-3.5 bg-slate-200 dark:bg-slate-800 rounded w-16"></div>
          </td>
          <td class="px-5 py-4 whitespace-nowrap text-right">
            <div class="flex items-center justify-end">
              <div class="w-7 h-7 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
            </div>
          </td>
        </tr>
        </tbody>

        <!-- СТАН З ДАНИМИ (VUEDRAGGABLE TBODY) -->
        <draggable
          v-else-if="localTasks && localTasks.length > 0"
          v-model="localTasks"
          tag="tbody"
          item-key="id"
          handle=".drag-handle"
          :animation="200"
          :move="onMove"
          ghost-class="dnd-ghost"
          drag-class="dnd-drag"
          :disabled="isDndDisabled"
          @change="onChange"
          class="divide-y divide-slate-100 dark:divide-slate-800/60 text-sm"
        >
          <template #item="{ element: task, index }">
            <tr class="group hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">

              <!-- Ручка для перетягування -->
              <td class="px-2 py-4 text-center select-none">
                <div
                  class="drag-handle inline-flex items-center justify-center p-1 text-slate-300 dark:text-slate-600 rounded transition-colors"
                  :class="isDndDisabled
                    ? 'cursor-default opacity-30 pointer-events-none'
                    : 'cursor-grab active:cursor-grabbing hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'"
                  :title="isDndDisabled ? 'Перетягування недоступне при активних фільтрах/сортуванні' : 'Перетягніть для зміни порядку'"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h16M4 16h16" />
                  </svg>
                </div>
              </td>

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
                  <action-dropdown
                    :task="task"
                    :index="index"
                    :length="localTasks.length"
                  />
                </div>
              </td>
            </tr>
          </template>
        </draggable>

        <!-- ПОРОЖНІЙ СТАН -->
        <tbody v-else>
        <tr>
          <td colspan="7" class="px-5 py-8 text-center text-xs text-slate-400 dark:text-slate-500">
            Завдань не знайдено
          </td>
        </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
