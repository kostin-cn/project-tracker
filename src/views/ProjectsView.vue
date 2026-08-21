<script setup lang="ts">
// Vue core & third-party libraries
import { computed, ref } from 'vue'

// Types & Interfaces
import type { ProjectWithTaskCount } from '@/types'

// Stores
import { useProjectStore } from '@/stores/projects'

// Composables
import { useLocalStorageRef } from '@/composables/useLocalStorageRef'
import { useTableSort } from '@/composables/useTableSort'

// Common UI Components
import AppSpinner from '@/components/common/AppSpinner.vue'
import TaskStatusChart from '@/components/common/TaskStatusChart.vue'
import ViewModeToggle, { type ToggleOption } from '@/components/common/ViewModeToggle.vue'

// Domain Components (Projects)
import ProjectCreateModal from '@/components/projects/ProjectCreateModal.vue'
import ProjectsGrid from '@/components/projects/ProjectsGrid.vue'
import ProjectsTable from '@/components/projects/ProjectsTable.vue'

const projectsStore = useProjectStore()

projectsStore.fetchProjects()

type ProjectViewMode = 'grid' | 'table'

const viewMode = useLocalStorageRef<ProjectViewMode>('projects_view_mode', 'grid')

const projectViewOptions: ToggleOption<ProjectViewMode>[] = [
  { value: 'grid', title: 'Плитка', icon: 'grid' },
  { value: 'table', title: 'Таблиця', icon: 'table' }
]

const currentViewComponent = computed(() => {
  return viewMode.value === 'grid' ? ProjectsGrid : ProjectsTable
})

const isModalOpen = ref(false)

// Початкові значення з URL query (з дефолтними фолбеками)
type ProjectSortField = 'createdAt' | 'name' | 'tasksCount' | 'status'

const { searchQuery, statusFilter, sortBy, sortOrder, handleSort } = useTableSort<ProjectSortField>({
  defaultSort: 'createdAt',
  defaultOrder: 'asc'
})

const sortOptions: { value: ProjectSortField; label: string }[] = [
  { value: 'createdAt', label: 'За датою' },
  { value: 'name', label: 'За назвою' },
  { value: 'status', label: 'За статусом' },
  { value: 'tasksCount', label: 'За завданнями' }
]

const filteredProjects = computed<ProjectWithTaskCount[]>(() => {
  let list = projectsStore.projectsWithTaskCount

  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase().trim()
    list = list.filter(p => p.name.toLowerCase().includes(q))
  }

  if (statusFilter.value !== 'all') {
    list = list.filter(p => p.status === statusFilter.value)
  }

  return [...list].sort((a, b) => {
    const mod = sortOrder.value === 'asc' ? 1 : -1
    switch (sortBy.value) {
      case 'name': return a.name.localeCompare(b.name, 'uk-UA') * mod
      case 'tasksCount': return ((a.tasksCount ?? 0) - (b.tasksCount ?? 0)) * mod
      case 'status': return a.status.localeCompare(b.status) * mod
      case 'createdAt':
      default: return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * mod
    }
  })
})

function resetFilters() {
  searchQuery.value = ''
  statusFilter.value = 'all'
}
</script>

<template>
  <div class="space-y-8">
    <!-- Шапка сторінки -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Проєкти</h1>
        <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Керуйте своїми проєктами, завданнями та відстежуйте прогрес
        </p>
      </div>

      <button
        @click="isModalOpen = true"
        class="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm transition-colors shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 cursor-pointer"
      >
        <span class="text-lg leading-none">+</span>
        <span>Створити проєкт</span>
      </button>
    </div>

    <task-status-chart />

    <!-- Блок фільтрації -->
    <div class="flex flex-col sm:flex-row sm:items-center gap-3 mt-6">
      <!-- Пошук -->
      <div class="relative w-full sm:w-auto sm:flex-1 max-w-md">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Пошук за назвою..."
          class="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
        />
      </div>

      <!-- Статус -->
      <select
        v-model="statusFilter"
        class="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all cursor-pointer"
      >
        <option value="all">Всі проєкти</option>
        <option value="active">Активні</option>
        <option value="archived">В архіві</option>
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
        :options="projectViewOptions"
        class="sm:ml-auto"
      />
    </div>

    <Transition name="fade-slide" mode="out-in">
      <AppSpinner v-if="projectsStore.isLoading" key="loading" />

      <!-- Порожній стан (Empty State) -->
      <div
        v-else-if="projectsStore.projects.length === 0"
        key="empty-global"
        class="text-center py-16 px-4 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-white/50 dark:bg-slate-900/50"
      >
        <div class="w-12 h-12 mx-auto rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 mb-3">
          📂
        </div>
        <h3 class="text-base font-semibold text-slate-900 dark:text-white">Немає активних проєктів</h3>
        <p class="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
          Створіть свій перший проєкт, щоб почати додавати завдання та Kanban-дошки.
        </p>
        <button
          @click="isModalOpen = true"
          class="mt-4 text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 dark:hover:text-emerald-300 cursor-pointer"
        >
          + Створити проєкт зараз
        </button>
      </div>

      <!-- Порожній стан: Фільтри або пошук не дали результатів -->
      <div
        v-else-if="filteredProjects.length === 0"
        key="empty-filtered"
        class="text-center py-16 px-4 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-white/50 dark:bg-slate-900/50"
      >
        <div class="w-12 h-12 mx-auto rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 mb-3">
          🔍
        </div>
        <h3 class="text-base font-semibold text-slate-900 dark:text-white">Проєктів не знайдено</h3>
        <p class="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
          За вашим запитом нічого не знайдено. Спробуйте змінити пошуковий запит або скинути фільтри.
        </p>
        <button
          @click="resetFilters"
          class="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 dark:hover:text-emerald-300 cursor-pointer"
        >
          <span>✕ Скинути фільтри</span>
        </button>
      </div>

      <KeepAlive v-else key="content">
        <component
          :is="currentViewComponent"
          :projects="filteredProjects"
          :sort-by="sortBy"
          :sort-order="sortOrder"
          @sort="handleSort"
        />
      </KeepAlive>
    </Transition>

    <!-- Модальне вікно створення проєкту -->
    <ProjectCreateModal v-model:is-open="isModalOpen" />
  </div>
</template>
