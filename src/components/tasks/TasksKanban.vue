<script setup lang="ts">
import { watch } from 'vue'
import draggable from 'vuedraggable'
import { toast } from 'vue-sonner'
import { formatDate } from "@/utils/formatters.ts"
import { type Task, TaskStatus } from "@/types"
import {useTaskStore} from '@/stores/tasks'
import { useTaskActions } from "@/composables/useTaskActions.ts"
import ActionDropdown from "@/components/common/ActionDropdown.vue";

const props = defineProps<{
  projectId: number
  isDndDisabled: boolean
  tasks: Task[]
  isFiltered: boolean
}>()

const tasksStore = useTaskStore()
const { openTaskModal, moveTask } = useTaskActions()

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

// Локальний стан завдань, розгрупований по колонках для vuedraggable
const columnTasks = {
  [TaskStatus.TODO]: [] as Task[],
  [TaskStatus.IN_PROGRESS]: [] as Task[],
  [TaskStatus.DONE]: [] as Task[]
}

function syncColumnTasks() {
  columns.forEach((col) => columnTasks[col.id] = props.tasks.filter((task) => task.status === col.id))
}

watch(
  () => props.tasks,
  () => syncColumnTasks(),
  { immediate: true, deep: true }
)

// Загальна кількість завдань у статусі (без урахування пошуку)
function getCountTasksByStatus(status: TaskStatus) {
  return tasksStore.tasks.filter((task) => task.status === status).length
}

// Обробник подій перетягування (зміна порядку / зміна колонки)
// Опис структури подій vuedraggable
interface DraggableChangeEvent {
  added?: { newIndex: number; element: Task }
  removed?: { oldIndex: number; element: Task }
  moved?: { newIndex: number; oldIndex: number; element: Task }
}

async function onChange(event: DraggableChangeEvent, targetStatus: TaskStatus) {
  if (props.isDndDisabled) {
    syncColumnTasks()
    return
  }

  try {
    const addedTask = event.added?.element
    if (event.added) {
      const colTitle = columns.find((c) => c.id === targetStatus)?.title
      toast.success(`Завдання переміщено у "${colTitle}"`)
    }

    const tasksToUpdate: Promise<void>[] = []
    columnTasks[targetStatus].forEach((task, index) => {
      if (task.id === addedTask?.id) {
        task.status = targetStatus
        task.order = index + 1
        tasksToUpdate.push(moveTask(task.id, { status: task.status, order: task.order }))
      } else if (task.order !== index + 1) {
        task.order = index + 1
        tasksToUpdate.push(moveTask(task.id, { order: task.order }))
      }
    })

    await Promise.all(tasksToUpdate)

  } catch {
    toast.error('Не вдалося зберегти новий порядок завдань')
    await tasksStore.fetchTasksByProject(props.projectId)
  }

  // if (event.removed) {
  //   const oldOrder = event.removed.oldIndex + 1
  //
  //   const tasksToUpdate: Promise<void>[] = []
  //
  //   for (const task of columnTasks[targetStatus]) {
  //     if (task.order > oldOrder) {
  //       task.order -= 1
  //       tasksToUpdate.push(moveTask(task.id, { order: task.order }))
  //     }
  //   }
  //
  //   await Promise.all(tasksToUpdate)
  // }
  //
  // if (event.moved) {
  //   const oldOrder = event.moved.oldIndex + 1
  //   const newOrder = event.moved.newIndex + 1
  //
  //   if (oldOrder === newOrder) return
  //
  //   const tasksToUpdate: Promise<void>[] = []
  //
  //   for (const task of columnTasks[targetStatus]) {
  //     if (task.id === event.moved.element.id) {
  //       task.order = newOrder
  //       tasksToUpdate.push(moveTask(task.id, { order: task.order }))
  //     } else if (oldOrder < newOrder) {
  //       if (task.order > oldOrder && task.order <= newOrder) {
  //         task.order -= 1
  //         tasksToUpdate.push(moveTask(task.id, { order: task.order }))
  //       }
  //     } else {
  //       if (task.order >= newOrder && task.order < oldOrder) {
  //         task.order += 1
  //         tasksToUpdate.push(moveTask(task.id, { order: task.order }))
  //       }
  //     }
  //   }
  //
  //   await Promise.all(tasksToUpdate)
  // }
  //
  // if (event.added) {
  //   const newOrder = event.added.newIndex + 1
  //   const addedTask = event.added.element
  //   const tasksToUpdate: Promise<void>[] = []
  //
  //   for (const task of columnTasks[targetStatus]) {
  //     if (task.id !== addedTask.id && task.order >= newOrder) {
  //       task.order += 1
  //       tasksToUpdate.push(moveTask(task.id, { order: task.order }))
  //     }
  //   }
  //
  //   // Оновлюємо додану таску
  //   addedTask.status = targetStatus
  //   addedTask.order = newOrder
  //   tasksToUpdate.push(moveTask(addedTask.id, { status: addedTask.status, order: addedTask.order }))
  //
  //   await Promise.all(tasksToUpdate)
  //
  //   const colTitle = columns.find((c) => c.id === targetStatus)?.title
  //   toast.success(`Завдання переміщено у "${colTitle}"`)
  // }
}
</script>

<template>
  <div class="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
    <div
      v-for="col in columns"
      :key="col.id"
      class="bg-slate-100/70 dark:bg-slate-800/40 border-t-4 rounded-2xl p-4 flex flex-col min-h-[500px] transition-colors"
      :class="col.color"
    >
      <!-- Шапка колонки -->
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center gap-2">
          <h2 class="font-semibold text-slate-800 dark:text-slate-200 text-sm">{{ col.title }}</h2>

          <!-- Скелетон бейджа / Реальний бейдж -->
          <span
            v-if="tasksStore.isLoading"
            class="w-6 h-4 bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse"
          ></span>
          <span
            v-else
            class="px-2 py-0.5 rounded-full text-xs font-bold"
            :class="col.badgeBg"
          >
            {{ isFiltered ? `${columnTasks[col.id].length}/${getCountTasksByStatus(col.id)}` : columnTasks[col.id].length }}
          </span>
        </div>

        <button
          @click="openTaskModal(col.id)"
          class="text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 p-1 rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-colors text-sm cursor-pointer"
          title="Додати завдання в цю колонку"
        >
          +
        </button>
      </div>

      <!-- Список карток у колонці -->
      <div class="flex-1 flex flex-col">
        <!-- 1. Скелетон карток під час завантаження -->
        <div
          v-if="tasksStore.isLoading"
          class="space-y-3"
        >
          <div
            v-for="i in 2"
            :key="i"
            class="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-3.5 shadow-xs space-y-4 animate-pulse"
          >
            <div class="space-y-2">
              <div class="h-3.5 bg-slate-200 dark:bg-slate-800 rounded-md w-5/6"></div>
              <div class="h-3.5 bg-slate-200 dark:bg-slate-800 rounded-md w-1/2"></div>
            </div>
            <div class="flex items-center justify-between pt-1">
              <div class="h-4 w-20 bg-slate-200 dark:bg-slate-800 rounded-md"></div>
              <div class="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-800"></div>
            </div>
          </div>
        </div>

        <!-- 2. Draggable Список -->
        <template v-else>
          <draggable
            v-model="columnTasks[col.id]"
            group="tasks"
            item-key="id"
            :animation="200"
            ghost-class="dnd-ghost"
            drag-class="dnd-drag"
            class="relative space-y-3 flex-1 min-h-[150px] pb-4 [&:has(.ghost-card)_.empty-placeholder]:opacity-0"
            :disabled="isDndDisabled"
            @change="onChange($event, col.id)"
          >
            <!-- Заглушка всередині draggable через слот header -->
            <template #header>
              <div
                v-if="columnTasks[col.id].length === 0"
                class="empty-placeholder absolute inset-x-0 top-0 h-24 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-center text-xs text-slate-400 dark:text-slate-500 pointer-events-none transition-opacity duration-150"
              >
                Перетягніть завдання сюди
              </div>
            </template>

            <template #item="{ element: task }">
              <div
                class="group bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 rounded-xl p-3.5 shadow-xs hover:shadow-md transition-colors flex flex-col justify-between gap-3 relative"
                :class="isDndDisabled ? '' : 'cursor-grab active:cursor-grabbing'"
              >
                <!-- Шапка: Заголовок + Дії -->
                <div class="flex items-start justify-between gap-2">
                  <h3 class="font-medium text-slate-900 dark:text-slate-100 text-sm leading-snug break-words">
                    {{ task.title }}
                  </h3>

                  <action-dropdown
                    :task="task"
                    :index="0"
                    :length="tasks.length"
                  />
                </div>

                <!-- Футер картки: Метадані та Виконавець -->
                <div class="flex items-center justify-between gap-2 pt-1">
                  <div class="flex items-center gap-2 flex-wrap text-[11px]">
                    <!-- Дедлайн -->
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

                    <!-- Дата створення -->
                    <span
                      v-if="task.createdAt"
                      class="text-slate-400 dark:text-slate-500"
                      :title="`Створено ${formatDate(task.createdAt)}`"
                    >
              {{ formatDate(task.createdAt) }}
            </span>
                  </div>

                  <!-- Аватар -->
                  <div v-if="task.assignee" class="shrink-0" :title="`Виконавець: ${task.assignee}`">
                    <div class="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-[10px] font-semibold flex items-center justify-center uppercase">
                      {{ task.assignee.slice(0, 2) }}
                    </div>
                  </div>
                </div>
              </div>
            </template>
          </draggable>
        </template>
      </div>
    </div>
  </div>
</template>
