<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { toast } from 'vue-sonner'

import { useProjectStore } from '@/stores/projects'
import { ProjectStatus } from '@/types'

import TaskStatusChart from "@/components/TaskStatusChart.vue";
import ProjectsGrid from "@/components/projects/ProjectsGrid.vue";
import ProjectsTable from "@/components/projects/ProjectsTable.vue";

const route = useRoute()
const router = useRouter()
const projectsStore = useProjectStore()

const viewMode = ref<'grid' | 'table'>(
  (localStorage.getItem('projects_view_mode') as 'grid' | 'table') || 'grid'
)

function setViewMode(mode: 'grid' | 'table') {
  viewMode.value = mode
  localStorage.setItem('projects_view_mode', mode)
}

const currentViewComponent = computed(() => {
  return viewMode.value === 'grid' ? ProjectsGrid : ProjectsTable
})

// Стан модального вікна
const isModalOpen = ref(false)
const isSubmitting = ref(false)

// Стан форми
const form = reactive({
  title: '',
  description: ''
})

const errors = reactive({
  title: ''
})

function openModal() {
  form.title = ''
  form.description = ''
  errors.title = ''
  isModalOpen.value = true
}

function closeModal() {
  isModalOpen.value = false
}

// Початкові значення з URL query (з дефолтними фолбеками)
const searchQuery = ref((route.query.search as string) || '')
const statusFilter = ref((route.query.status as string) || 'all')
const sortBy = ref((route.query.sort as string) || 'createdAt') // 'createdAt' | 'name' | 'tasksCount'
const sortOrder = ref<'asc' | 'desc'>((route.query.order as 'asc' | 'desc') || 'desc') // 'desc' за замовчуванням (спочатку новіші)

const filteredProjects = computed(() => {
  let list = projectsStore.projectsWithTaskCount;

  // Фільтрація за текстом
  if (searchQuery.value) {
    list = list.filter(p =>
      p.name.toLowerCase().includes(searchQuery.value.toLowerCase())
    );
  }

  // Фільтрація за статусом
  if (statusFilter.value !== 'all') {
    list = list.filter(p =>
      statusFilter.value === 'active'
        ? p.status === ProjectStatus.ACTIVE
        : p.status === ProjectStatus.ARCHIVED
    );
  }

  return list;
});

function resetFilters() {
  searchQuery.value = ''
  statusFilter.value = 'all'
}

// Валідація форми
function validateForm(): boolean {
  errors.title = ''
  if (!form.title.trim()) {
    errors.title = 'Вкажіть назву проєкту'
    return false
  }
  return true
}

// Хендлер створення проєкту
async function handleSubmit() {
  if (!validateForm()) return

  isSubmitting.value = true

  try {
    await projectsStore.createProject({
      name: form.title.trim(),
      description: form.description?.trim()
    })

    toast.success('Проєкт успішно створено!')
    closeModal()
  } catch (error) {
    toast.error('Не вдалося створити проєкт')
  } finally {
    isSubmitting.value = false
  }
}

// Обробка натискання клавіші Esc для закриття модалки
function handleKeyDown(event: KeyboardEvent) {
  if (event.key === 'Escape' && isModalOpen.value) {
    closeModal()
  }
}

// 2. Синхронізація стану з URL query
watch([searchQuery, statusFilter, sortBy, sortOrder], ([search, status, sort, order]) => {
  const query: Record<string, string> = {}

  // Додаємо в URL тільки якщо значення відрізняється від дефолтного
  if (search.trim()) query.search = search.trim()
  if (status !== 'all') query.status = status
  if (sort !== 'createdAt') query.sort = sort
  if (order !== 'desc') query.order = order

  router.replace({ query })
})

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
  projectsStore.fetchProjects()
})

onUnmounted(() => window.removeEventListener('keydown', handleKeyDown))
</script>

<template>
  <div class="space-y-8">
    <!-- Шапка сторінки -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold tracking-tight text-slate-900">Проєкти</h1>
        <p class="text-sm text-slate-500 mt-1">
          Керуйте своїми проєктами, завданнями та відстежуйте прогрес
        </p>
      </div>

      <button
        @click="openModal"
        class="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm transition-colors shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 cursor-pointer"
      >
        <span class="text-lg leading-none">+</span>
        <span>Створити проєкт</span>
      </button>
    </div>

    <task-status-chart/>

    <!-- Блок фільтрації -->
    <div class="flex flex-col sm:flex-row sm:items-center gap-3 mt-6">
      <!-- Пошук -->
      <div class="relative w-full sm:w-auto sm:flex-1 max-w-md">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Пошук за назвою..."
          class="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
        />
      </div>

      <!-- Статус -->
      <select
        v-model="statusFilter"
        class="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all cursor-pointer text-slate-700"
      >
        <option value="all">Всі проєкти</option>
        <option value="active">Активні</option>
        <option value="archived">В архіві</option>
      </select>

      <!-- Перемикач режиму відображення (Посунутий праворуч) -->
      <div class="flex items-center self-end sm:self-auto sm:ml-auto p-1 bg-slate-100/80 rounded-xl border border-slate-200/60 shrink-0">
        <button
          @click="setViewMode('grid')"
          :class="[
        'p-2 rounded-lg transition-all cursor-pointer',
        viewMode === 'grid'
          ? 'bg-white shadow-sm text-slate-900 font-medium'
          : 'text-slate-400 hover:text-slate-600 hover:bg-slate-200/50'
      ]"
          title="Плитка"
          aria-label="Режим сітки"
        >
          <!-- Іконка сітки -->
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
        </button>

        <button
          @click="setViewMode('table')"
          :class="[
        'p-2 rounded-lg transition-all cursor-pointer',
        viewMode === 'table'
          ? 'bg-white shadow-sm text-slate-900 font-medium'
          : 'text-slate-400 hover:text-slate-600 hover:bg-slate-200/50'
      ]"
          title="Таблиця"
          aria-label="Режим таблиці"
        >
          <!-- Іконка таблиці -->
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </button>
      </div>
    </div>

    <Transition name="fade-slide" mode="out-in">
      <div v-if="projectsStore.isLoading" key="loading" class="flex justify-center py-20">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>

      <!-- Порожній стан (Empty State) -->
      <div
        v-else-if="projectsStore.projects.length === 0"
        key="empty-global"
        class="text-center py-16 px-4 border-2 border-dashed border-slate-200 rounded-2xl bg-white/50"
      >
        <div class="w-12 h-12 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
          📂
        </div>
        <h3 class="text-base font-semibold text-slate-900">Немає активних проєктів</h3>
        <p class="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
          Створіть свій перший проєкт, щоб почати додавати завдання та Kanban-дошки.
        </p>
        <button
          @click="openModal"
          class="mt-4 text-sm font-medium text-emerald-600 hover:text-emerald-500 cursor-pointer"
        >
          + Створити проєкт зараз
        </button>
      </div>

      <!-- Порожній стан: Фільтри або пошук не дали результатів -->
      <div
        v-else-if="filteredProjects.length === 0"
        key="empty-filtered"
        class="text-center py-16 px-4 border-2 border-dashed border-slate-200 rounded-2xl bg-white/50"
      >
        <div class="w-12 h-12 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
          🔍
        </div>
        <h3 class="text-base font-semibold text-slate-900">Проєктів не знайдено</h3>
        <p class="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
          За вашим запитом нічого не знайдено. Спробуйте змінити пошуковий запит або скинути фільтри.
        </p>
        <button
          @click="resetFilters"
          class="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600 hover:text-emerald-500 cursor-pointer"
        >
          <span>✕ Скинути фільтри</span>
        </button>
      </div>

      <KeepAlive v-else key="content">
        <component
          :is="currentViewComponent"
          :projects="filteredProjects"
        />
      </KeepAlive>
    </Transition>

    <!-- Модальне вікно створення проєкту -->
    <div
      v-if="isModalOpen"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs transition-opacity"
      @click.self="closeModal"
    >
      <div class="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-6">
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-bold text-slate-900">Новий проєкт</h3>
          <button
            @click="closeModal"
            class="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        <form @submit.prevent="handleSubmit" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">
              Назва проєкту <span class="text-rose-500">*</span>
            </label>
            <input
              v-model="form.title"
              type="text"
              placeholder="Наприклад: Розробка веб-сайту"
              class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              :class="{ 'border-rose-400 bg-rose-50/30': errors.title }"
            />
            <p v-if="errors.title" class="text-xs text-rose-500 mt-1.5">
              {{ errors.title }}
            </p>
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">
              Опис проєкту
            </label>
            <textarea
              v-model="form.description"
              rows="3"
              placeholder="Короткий опис цілей або етапів..."
              class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all resize-none"
            ></textarea>
          </div>

          <div class="flex justify-end gap-3 pt-2">
            <button
              type="button"
              @click="closeModal"
              class="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Скасувати
            </button>
            <button
              type="submit"
              :disabled="isSubmitting"
              class="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
            >
              {{ isSubmitting ? 'Створення...' : 'Створити' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Анімація зникнення / появи */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

/* Початковий стан при появі та кінцевий при зникненні */
.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(6px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
