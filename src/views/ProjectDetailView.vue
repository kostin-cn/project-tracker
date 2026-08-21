<script setup lang="ts">
import {computed, ref, watch} from 'vue'
import {RouterLink} from 'vue-router'
import {useProjectStore} from '@/stores/projects'
import {useTaskStore} from '@/stores/tasks'
import {ProjectStatus, TaskStatus} from "@/types";
import TaskCreateModal from "@/components/tasks/TaskCreateModal.vue";
import {useLocalStorageRef} from "@/composables/useLocalStorageRef.ts";
import ViewModeToggle, { type ToggleOption } from '@/components/common/ViewModeToggle.vue'
import TasksKanban from "@/components/tasks/TasksKanban.vue";
import TasksTable from "@/components/tasks/TasksTable.vue";
import { useTableSort } from '@/composables/useTableSort'
import AppSpinner from '@/components/common/AppSpinner.vue'

// Отримуємо id проекту з пропсів роутера (автоматично конвертований у number)
const props = defineProps<{
  id: number
}>()

const projectsStore = useProjectStore()
const tasksStore = useTaskStore()

type TaskViewMode = 'kanban' | 'table'

const viewMode = useLocalStorageRef<TaskViewMode>('tasks_view_mode', 'kanban')

const taskViewOptions: ToggleOption<TaskViewMode>[] = [
  { value: 'kanban', title: 'Канбан', icon: 'kanban' },
  { value: 'table', title: 'Таблиця', icon: 'table' }
]

const currentViewComponent = computed(() => {
  return viewMode.value === 'kanban' ? TasksKanban : TasksTable
})

// Початкові значення з URL query (з дефолтними фолбеками)
type TaskSortField = 'createdAt' | 'title' | 'assignee' | 'status' | 'dueDate' | 'order'

const { searchQuery, statusFilter, assigneeFilter, sortBy, sortOrder, handleSort } = useTableSort<TaskSortField>({
  defaultSort: 'createdAt',
  defaultOrder: 'asc'
})

const sortOptions: { value: TaskSortField; label: string }[] = [
  { value: 'order', label: 'По порядку' },
  { value: 'title', label: 'Назва' },
  { value: 'status', label: 'Статус' },
  { value: 'assignee', label: 'Виконавець' },
  { value: 'dueDate', label: 'Термін' },
  { value: 'createdAt', label: 'Дата створення' }
]

const filteredTasks = computed(() => {
  let list = tasksStore.tasks

  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase().trim()
    list = list.filter(p => p.title.toLowerCase().includes(q))
  }

  if (statusFilter.value !== 'all') {
    list = list.filter(p => p.status === statusFilter.value)
  }

  if (assigneeFilter.value !== 'all') {
    list = list.filter(task => task.assignee === assigneeFilter.value)
  }

  return [...list].sort((a, b) => {
    const mod = sortOrder.value === 'asc' ? 1 : -1
    switch (sortBy.value) {
      case 'title': return a.title.localeCompare(b.title, 'uk-UA') * mod
      case 'status': return a.status.localeCompare(b.status) * mod
      case 'dueDate': return (new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()) * mod
      case 'createdAt': return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * mod
      default: return (a.order - b.order) * mod
    }
  })
})

// Кількість завдань по статусах
function getCountTasksByStatus(status: TaskStatus) {
  return tasksStore.tasks.filter((task) => task.status === status).length
}

// Модальне вікно створення завдання
const isModalOpen = ref(false)
const creationStatus = ref(TaskStatus.TODO)

function openModal(status: TaskStatus) {
  isModalOpen.value = true
  creationStatus.value = status
}

watch(
  () => props.id,
  async (newId) => await projectsStore.fetchProjectById(newId),
  { immediate: true }
)
</script>

<template>
  <!-- Якщо проєкт не знайдено -->
  <div v-if="!projectsStore.isLoading && !projectsStore.currentProject" class="text-center py-20">
    <h2 class="text-xl font-bold text-slate-800 dark:text-slate-100">Проєкт не знайдено</h2>
    <p class="text-slate-500 dark:text-slate-400 text-sm mt-1">Можливо, він був видалений або посилання недійсне.</p>
    <RouterLink
      to="/"
      class="inline-block mt-4 px-4 py-2 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-sm font-medium hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors"
    >
      ← Повернутися до проєктів
    </RouterLink>
  </div>

  <!-- Деталі проєкту -->
  <div v-else class="space-y-6">
    <!-- Навігація та Заголовок -->
    <div>
      <RouterLink
        to="/"
        class="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors mb-2"
      >
        <span>←</span>
        <span>Назад до списку проєктів</span>
      </RouterLink>

      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <!-- Скелетон або Реальні дані Проєкту -->
        <div v-if="projectsStore.isLoading" class="space-y-2 animate-pulse">
          <div class="flex items-center gap-3">
            <div class="h-8 w-64 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
            <div class="h-5 w-20 bg-slate-200 dark:bg-slate-800 rounded-full"></div>
          </div>
          <div class="h-4 w-80 bg-slate-200 dark:bg-slate-800 rounded-md"></div>
        </div>

        <div v-else>
          <div class="flex items-center gap-2.5">
            <h1 class="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {{ projectsStore.currentProject?.name }}
            </h1>

            <span
              class="shrink-0 text-[11px] font-medium px-2 py-0.5 rounded-full border transition-colors"
              :class="projectsStore.currentProject?.status === ProjectStatus.ARCHIVED
                ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200/80 dark:border-amber-800/60'
                : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200/80 dark:border-emerald-800/60'"
            >
              {{ projectsStore.currentProject?.status === ProjectStatus.ARCHIVED ? 'В архіві' : 'Активний' }}
            </span>
          </div>

          <p class="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {{ projectsStore.currentProject?.description || 'Без опису' }}
          </p>
        </div>

        <!-- Кнопка створення завдання (доступна одразу) -->
        <button
          @click="openModal(TaskStatus.TODO)"
          :disabled="projectsStore.isLoading"
          class="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white font-medium text-sm transition-colors shadow-xs cursor-pointer shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span>+</span>
          <span>Завдання</span>
        </button>
      </div>
    </div>

    <!-- Прогрес виконання -->
    <div class="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <template v-if="tasksStore.isLoading">
        <div class="flex items-center gap-6 animate-pulse">
          <div class="h-5 w-32 bg-slate-200 dark:bg-slate-800 rounded-md"></div>
          <div class="h-5 w-28 bg-slate-200 dark:bg-slate-800 rounded-md"></div>
        </div>
        <div class="flex items-center gap-3 w-full sm:w-64 animate-pulse">
          <div class="flex-1 h-2.5 bg-slate-200 dark:bg-slate-800 rounded-full"></div>
          <div class="h-4 w-8 bg-slate-200 dark:bg-slate-800 rounded-md"></div>
        </div>
      </template>

      <template v-else>
        <div class="flex items-center gap-4">
          <div class="text-sm">
            <span class="text-slate-500 dark:text-slate-400">Всього завдань: </span>
            <span class="font-bold text-slate-900 dark:text-white">{{ tasksStore.tasks?.length || 0 }}</span>
          </div>
          <div class="text-sm">
            <span class="text-slate-500 dark:text-slate-400">Виконано: </span>
            <span class="font-bold text-emerald-600 dark:text-emerald-400">
              {{ getCountTasksByStatus(TaskStatus.DONE) }}
            </span>
          </div>
        </div>

        <div class="flex items-center gap-3 w-full sm:w-64">
          <div class="flex-1 h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              class="h-full bg-emerald-500 dark:bg-emerald-400 transition-all duration-300"
              :style="{
                width: `${tasksStore.tasks?.length ? (getCountTasksByStatus(TaskStatus.DONE) / tasksStore.tasks.length) * 100 : 0}%`
              }"
            ></div>
          </div>
          <span class="text-xs font-semibold text-slate-600 dark:text-slate-300 min-w-[2.5rem] text-right">
            {{ tasksStore.tasks?.length ? Math.round((getCountTasksByStatus(TaskStatus.DONE) / tasksStore.tasks.length) * 100) : 0 }}%
          </span>
        </div>
      </template>
    </div>

    <!-- Панель керування: Пошук, Фільтри, Сортування, Перемикач виглядів -->
    <div class="flex flex-col sm:flex-row sm:items-center gap-3 mt-6">
      <!-- Пошук -->
      <div class="relative w-full sm:w-auto sm:flex-1 max-w-md">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Пошук завдань..."
          class="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
        />
      </div>

      <!-- Фільтр за статусом -->
      <select
        v-model="statusFilter"
        class="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all cursor-pointer"
      >
        <option value="all">Всі статуси</option>
        <option :value="TaskStatus.TODO">До виконання</option>
        <option :value="TaskStatus.IN_PROGRESS">В роботі</option>
        <option :value="TaskStatus.DONE">Виконано</option>
      </select>

      <!-- Фільтр за виконавцем -->
      <select
        v-model="assigneeFilter"
        class="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all cursor-pointer"
      >
        <option value="all">Всі виконавці</option>
        <option v-for="assignee in tasksStore.availableAssignees" :key="assignee" :value="assignee">
          {{ assignee }}
        </option>
      </select>

      <!-- Сортування (Поле + Напрямок) -->
      <div class="flex items-center gap-2 w-full sm:w-auto">
        <select
          v-model="sortBy"
          class="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all cursor-pointer"
        >
          <option v-for="opt in sortOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
        </select>

        <button
          type="button"
          @click="sortOrder = sortOrder === 'asc' ? 'desc' : 'asc'"
          class="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0 font-medium"
          :title="sortOrder === 'asc' ? 'За зростанням' : 'За спаданням'"
        >
          {{ sortOrder === 'asc' ? '↑' : '↓' }}
        </button>
      </div>

      <!-- Перемикач режиму відображення -->
      <ViewModeToggle
        v-model="viewMode"
        :options="taskViewOptions"
        class="sm:ml-auto"
      />
    </div>

    <Transition name="fade-slide" mode="out-in">
      <KeepAlive key="content">
        <component
          :is="currentViewComponent"
          :is-loading="tasksStore.isLoading"
          :tasks="filteredTasks"
          :search-query="searchQuery"
          :sort-by="sortBy"
          :sort-order="sortOrder"
          @sort="handleSort"
          @openModal="openModal"
        />
      </KeepAlive>
    </Transition>

    <!-- Модальне вікно створення завдання -->
    <TaskCreateModal
      v-model:is-open="isModalOpen"
      :project-id="id"
      :creation-status="creationStatus"
    />
  </div>
</template>
