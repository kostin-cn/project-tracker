<script setup lang="ts">
import {ref} from 'vue'
import {toast} from 'vue-sonner'
import {formatDate} from "@/utils/formatters.ts";
import {type Task, TaskStatus} from "@/types";
import {useTaskActions} from "@/composables/useTaskActions.ts";

const props = defineProps<{
  isLoading: boolean
  tasks: Task[]
  searchQuery?: string
}>()

const emit = defineEmits<{
  (e: 'openModal', status: TaskStatus): void
}>()

const { updateTask, deleteTask } = useTaskActions()

// Список колонок Kanban-дошки
const columns: { id: TaskStatus; title: string; color: string; badgeBg: string }[] = [
  {
    id: TaskStatus.TODO,
    title: 'До виконання',
    color: 'border-slate-300 dark:border-slate-700',
    badgeBg: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
  },
  {
    id: TaskStatus.IN_PROGRESS,
    title: 'В роботі',
    color: 'border-amber-400 dark:border-amber-500/80',
    badgeBg: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60'
  },
  {
    id: TaskStatus.DONE,
    title: 'Виконано',
    color: 'border-emerald-500 dark:border-emerald-500/80',
    badgeBg: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60'
  }
]

// Кількість завдань по статусах
function getCountTasksByStatus(status: TaskStatus) {
  return props.tasks.filter((task) => task.status === status).length
}

// Групування завдань по колонках
function getTasksByStatus(status: TaskStatus) {
  return props.tasks.filter((task) => task.status === status)
}

// Drag and Drop (Нативний HTML5)
const draggedTaskId = ref<number | null>(null)
const isDraggingOverColumn = ref<TaskStatus | null>(null)

function handleDragStart(taskId: number) {
  draggedTaskId.value = taskId
}

function handleDragOver(event: DragEvent, status: TaskStatus) {
  event.preventDefault()
  isDraggingOverColumn.value = status
}

function handleDragLeave() {
  isDraggingOverColumn.value = null
}

async function handleDrop(targetStatus: TaskStatus) {
  isDraggingOverColumn.value = null
  if (draggedTaskId.value === null) return

  const task = props.tasks.find((t) => t.id === draggedTaskId.value)
  if (task && task.status !== targetStatus) {
    task.status = targetStatus
    await updateTask(task.id, task)
    toast.success(`Завдання переміщено у "${columns.find((c) => c.id === targetStatus)?.title}"`)
  }
  draggedTaskId.value = null
}

</script>

<template>
  <div class="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
    <div
      v-for="col in columns"
      :key="col.id"
      class="bg-slate-100/70 dark:bg-slate-800/40 border-t-4 rounded-2xl p-4 flex flex-col min-h-[500px] transition-colors"
      :class="[
          col.color,
          isDraggingOverColumn === col.id ? 'bg-emerald-50/60 dark:bg-emerald-950/30 ring-2 ring-emerald-400 ring-dashed' : ''
        ]"
      @dragover="handleDragOver($event, col.id)"
      @dragleave="handleDragLeave"
      @drop="handleDrop(col.id)"
    >
      <!-- Шапка колонки -->
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center gap-2">
          <h2 class="font-semibold text-slate-800 dark:text-slate-200 text-sm">{{ col.title }}</h2>

          <!-- Скелетон бейджа / Реальний бейдж -->
          <span
            v-if="isLoading"
            class="w-6 h-4 bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse"
          ></span>
          <span
            v-else
            class="px-2 py-0.5 rounded-full text-xs font-bold"
            :class="col.badgeBg"
          >
            {{ searchQuery ? `${getTasksByStatus(col.id).length}/${getCountTasksByStatus(col.id)}` : getTasksByStatus(col.id).length }}
          </span>
        </div>

        <button
          @click="emit('openModal', col.id)"
          class="text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 p-1 rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-colors text-sm cursor-pointer"
          title="Додати завдання в цю колонку"
        >
          +
        </button>
      </div>

      <!-- Список карток у колонці -->
      <div class="space-y-3 flex-1">
        <!-- 1. Скелетон карток під час завантаження -->
        <div
          v-if="isLoading"
          class="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-3.5 shadow-xs space-y-4 animate-pulse"
        >
          <!-- Заголовок (2 лінії) -->
          <div class="space-y-2">
            <div class="h-3.5 bg-slate-200 dark:bg-slate-800 rounded-md w-5/6"></div>
            <div class="h-3.5 bg-slate-200 dark:bg-slate-800 rounded-md w-1/2"></div>
          </div>

          <!-- Футер (Дата + Аватар) -->
          <div class="flex items-center justify-between pt-1">
            <div class="h-4 w-20 bg-slate-200 dark:bg-slate-800 rounded-md"></div>
            <div class="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-800"></div>
          </div>
        </div>

        <template v-else>
          <div
            v-for="task in getTasksByStatus(col.id)"
            :key="task.id"
            draggable="true"
            @dragstart="handleDragStart(task.id)"
            class="group bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 rounded-xl p-3.5 shadow-xs hover:shadow-md transition-all cursor-grab active:cursor-grabbing flex flex-col justify-between gap-3 relative"
          >
            <!-- Шапка: Заголовок + Дії -->
            <div class="flex items-start justify-between gap-2">
              <h3 class="font-medium text-slate-900 dark:text-slate-100 text-sm leading-snug break-words">
                {{ task.title }}
              </h3>

              <button
                type="button"
                @click.stop="deleteTask(task.id, task.title)"
                class="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 p-1 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all cursor-pointer shrink-0"
                title="Видалити завдання"
              >
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>

            <!-- Футер картки: Метадані та Виконавець -->
            <div class="flex items-center justify-between gap-2 pt-1">
              <!-- Лівий блок: Дати -->
              <div class="flex items-center gap-2 flex-wrap text-[11px]">
                <!-- Дедлайн (Бейдж) -->
                <span
                  v-if="task.dueDate"
                  class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-medium border bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                  :title="`Термін виконання ${formatDate(task.dueDate)}`"
                >
                    <svg class="w-3 h-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {{ formatDate(task.dueDate) }}
                  </span>

                <!-- Дата створення (Компактна) -->
                <span
                  v-if="task.createdAt"
                  class="text-slate-400 dark:text-slate-500"
                  :title="`Створено ${formatDate(task.createdAt)}`"
                >
                    {{ formatDate(task.createdAt) }}
                  </span>
              </div>

              <!-- Правий блок: Аватар виконавця -->
              <div v-if="task.assignee" class="shrink-0" :title="`Виконавець: ${task.assignee}`">
                <div class="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-[10px] font-semibold flex items-center justify-center uppercase">
                  {{ task.assignee.slice(0, 2) }}
                </div>
              </div>
            </div>
          </div>

          <!-- Заглушка, якщо колонка порожня -->
          <div
            v-if="getTasksByStatus(col.id).length === 0"
            class="h-24 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-center text-xs text-slate-400 dark:text-slate-500"
          >
            Перетягніть завдання сюди
          </div>
        </template>
      </div>
    </div>
  </div>
</template>
