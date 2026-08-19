<script setup lang="ts">
import {computed, onMounted, onUnmounted, reactive, ref, watch} from 'vue'
import {RouterLink} from 'vue-router'
import {toast} from 'vue-sonner'
import {useProjectStore} from '@/stores/projects'
import {useTaskStore} from '@/stores/tasks'
import {ProjectStatus, TaskStatus} from "@/types";

// Отримуємо id проекту з пропсів роутера (автоматично конвертований у number)
const props = defineProps<{
  id: number
}>()

const projectsStore = useProjectStore()
const tasksStore = useTaskStore()

// Список колонок Kanban-дошки
const columns: { id: TaskStatus; title: string; color: string; badgeBg: string }[] = [
  { id: TaskStatus.TODO, title: 'До виконання', color: 'border-slate-300', badgeBg: 'bg-slate-100 text-slate-700' },
  { id: TaskStatus.IN_PROGRESS, title: 'В роботі', color: 'border-amber-400', badgeBg: 'bg-amber-50 text-amber-700 border border-amber-200' },
  { id: TaskStatus.DONE, title: 'Виконано', color: 'border-emerald-500', badgeBg: 'bg-emerald-50 text-emerald-700 border border-emerald-200' }
]

// Пошук та фільтрація завдань
const searchQuery = ref('')

const filteredTasks = computed(() => {
  if (!tasksStore.tasks) return []
  const query = searchQuery.value.toLowerCase().trim()
  if (!query) return tasksStore.tasks

  return tasksStore.tasks.filter(
    (task) => task.title.toLowerCase().includes(query) || task.assignee?.toLowerCase().includes(query)
  )
})

// Кількість завдань по статусах
function getCountTasksByStatus(status: TaskStatus) {
  return tasksStore.tasks.filter((task) => task.status === status).length
}

// Групування завдань по колонках
function getTasksByStatus(status: TaskStatus) {
  return filteredTasks.value.filter((task) => task.status === status)
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

  const task = tasksStore.tasks.find((t) => t.id === draggedTaskId.value)
  if (task && task.status !== targetStatus) {
    task.status = targetStatus
    await tasksStore.updateTask(task.id, task)
    toast.success(`Завдання переміщено у "${columns.find((c) => c.id === targetStatus)?.title}"`)
  }
  draggedTaskId.value = null
}

// Модальне вікно створення завдання
const isModalOpen = ref(false)
const isSubmitting = ref(false)

const form = reactive({
  title: '',
  assignee: '',
  status: TaskStatus.TODO,
  dueDate: ''
})

const errors = reactive({
  title: '',
  dueDate: ''
})

function openModal(defaultStatus: TaskStatus = TaskStatus.TODO) {
  form.title = ''
  form.assignee = ''
  form.status = defaultStatus
  form.dueDate = ''
  errors.title = ''
  errors.dueDate = ''
  isModalOpen.value = true
}

function closeModal() {
  isModalOpen.value = false
}

// Отримуємо поточну дату у форматі YYYY-MM-DD
const minDate = new Date().toISOString().split('T')[0] || ''

async function handleCreateTask() {

  errors.title = !form.title.trim() ? 'Вкажіть назву завдання' : ''
  errors.dueDate = !form.dueDate ? 'Вкажіть термін виконання завдання' : ''

  if (form.dueDate && form.dueDate < minDate) errors.dueDate = 'Дата не може бути в минулому'

  if (errors.title || errors.dueDate) return;

  isSubmitting.value = true

  try {
    await tasksStore.createTask({
      projectId: props.id,
      title: form.title.trim(),
      assignee: form.assignee?.trim() || '',
      status: form.status,
      dueDate: form.dueDate
    })

    toast.success('Завдання додано!')
    closeModal()
  } catch {
    toast.error('Не вдалося додати завдання')
  } finally {
    isSubmitting.value = false
  }
}

async function handleDeleteTask(taskId: number, taskTitle: string) {
  if (confirm(`Видалити завдання "${taskTitle}"?`)) {
    await tasksStore.deleteTask(taskId)
    toast.info('Завдання видалено')
  }
}

// Захист по клавіші ESC
function handleKeyDown(e: KeyboardEvent) {
  if (e.key === 'Escape' && isModalOpen.value) closeModal()
}

watch(
  () => props.id,
  async (newId) => await projectsStore.fetchProjectById(newId),
  { immediate: true }
)

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
})
onUnmounted(() => window.removeEventListener('keydown', handleKeyDown))
</script>

<template>
  <div v-if="projectsStore.isLoading || tasksStore.isLoading" class="flex justify-center py-20">
    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
  </div>

  <template v-else>
    <!-- Якщо проєкт не знайдено -->
    <div v-if="!projectsStore.currentProject" class="text-center py-20">
      <h2 class="text-xl font-bold text-slate-800">Проєкт не знайдено</h2>
      <p class="text-slate-500 text-sm mt-1">Можливо, він був видалений або посилання недійсне.</p>
      <RouterLink
        to="/"
        class="inline-block mt-4 px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 transition-colors"
      >
        ← Повернутися до проєктів
      </RouterLink>
    </div>

    <!-- Деталі проєкту та Kanban дошка -->
    <div v-else class="space-y-6">
      <!-- Навігація та Заголовок -->
      <div>
        <RouterLink
          to="/"
          class="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-emerald-600 transition-colors mb-2"
        >
          <span>←</span>
          <span>Назад до списку проєктів</span>
        </RouterLink>

        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div class="flex items-center gap-2.5">
              <h1 class="text-2xl font-bold tracking-tight text-slate-900">
                {{ projectsStore.currentProject.name }}
              </h1>

              <!-- Бейдж статусу -->
              <span
                class="shrink-0 text-[11px] font-medium px-2 py-0.5 rounded-full border transition-colors"
                :class="projectsStore.currentProject.status === ProjectStatus.ARCHIVED
                  ? 'bg-amber-50 text-amber-700 border-amber-200/80'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200/80'"
              >
                  {{ projectsStore.currentProject.status === ProjectStatus.ARCHIVED ? 'В архіві' : 'Активний' }}
                </span>
            </div>

            <p class="text-sm text-slate-500 mt-0.5">
              {{ projectsStore.currentProject.description || 'Без опису' }}
            </p>
          </div>

          <!-- Кнопка створення завдання та пошук -->
          <div class="flex items-center gap-3">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Пошук завдань..."
              class="px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all w-48 sm:w-64"
            />

            <button
              @click="openModal(TaskStatus.TODO)"
              class="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm transition-colors shadow-xs cursor-pointer shrink-0"
            >
              <span>+</span>
              <span>Завдання</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Прогрес виконання -->
      <div class="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div class="flex items-center gap-4">
          <div class="text-sm">
            <span class="text-slate-500">Всього завдань: </span>
            <span class="font-bold text-slate-900">{{ tasksStore.tasks?.length || 0 }}</span>
          </div>
          <div class="text-sm">
            <span class="text-slate-500">Виконано: </span>
            <span class="font-bold text-emerald-600">
            {{ getCountTasksByStatus(TaskStatus.DONE) }}
          </span>
          </div>
        </div>

        <!-- Прогрес бар -->
        <div class="flex items-center gap-3 w-full sm:w-64">
          <div class="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              class="h-full bg-emerald-500 transition-all duration-300"
              :style="{
              width: `${tasksStore.tasks?.length ? (getCountTasksByStatus(TaskStatus.DONE) / tasksStore.tasks.length) * 100 : 0}%`
            }"
            ></div>
          </div>
          <span class="text-xs font-semibold text-slate-600 min-w-[2.5rem] text-right">
          {{ tasksStore.tasks?.length ? Math.round((getCountTasksByStatus(TaskStatus.DONE) / tasksStore.tasks.length) * 100) : 0 }}%
        </span>
        </div>
      </div>

      <!-- KANBAN ДОШКА -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        <div
          v-for="col in columns"
          :key="col.id"
          class="bg-slate-100/70 border-t-4 rounded-2xl p-4 flex flex-col min-h-[500px] transition-colors"
          :class="[
          col.color,
          isDraggingOverColumn === col.id ? 'bg-emerald-50/60 ring-2 ring-emerald-400 ring-dashed' : ''
        ]"
          @dragover="handleDragOver($event, col.id)"
          @dragleave="handleDragLeave"
          @drop="handleDrop(col.id)"
        >
          <!-- Шапка колонки -->
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-2">
              <h2 class="font-semibold text-slate-800 text-sm">{{ col.title }}</h2>
              <span class="px-2 py-0.5 rounded-full text-xs font-bold" :class="col.badgeBg">
              {{ searchQuery ? `${getTasksByStatus(col.id).length}/${getCountTasksByStatus(col.id)}` : getTasksByStatus(col.id).length }}
            </span>
            </div>

            <button
              @click="openModal(col.id)"
              class="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-200/60 transition-colors text-sm cursor-pointer"
              title="Додати завдання в цю колонку"
            >
              +
            </button>
          </div>

          <!-- Список карток у колонці -->
          <div class="space-y-3 flex-1">
            <div
              v-for="task in getTasksByStatus(col.id)"
              :key="task.id"
              draggable="true"
              @dragstart="handleDragStart(task.id)"
              class="group bg-white border border-slate-200/80 rounded-xl p-4 shadow-xs hover:shadow-md transition-all cursor-grab active:cursor-grabbing relative"
            >
              <!-- Кнопка видалення -->
              <div class="flex items-center justify-between mb-2">
                <h3 class="font-medium text-slate-900 text-sm leading-snug">
                  {{ task.title }}
                </h3>

                <button
                  @click="handleDeleteTask(task.id, task.title)"
                  class="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-600 p-1 transition-opacity cursor-pointer"
                  title="Видалити завдання"
                >
                  ✕
                </button>
              </div>

              <p v-if="task.assignee" class="text-xs text-slate-500 mb-2 line-clamp-2">
                Виконавець: {{ task.assignee }}
              </p>

              <p v-if="task.dueDate" class="text-xs text-slate-500 line-clamp-2">
                Термін виконання: {{ task.dueDate }}
              </p>
            </div>

            <!-- Заглушка, якщо колонка порожня -->
            <div
              v-if="getTasksByStatus(col.id).length === 0"
              class="h-24 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center text-xs text-slate-400"
            >
              Перетягніть завдання сюди
            </div>
          </div>
        </div>
      </div>

      <!-- Модальне вікно створення завдання -->
      <div
        v-if="isModalOpen"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs"
        @click.self="closeModal"
      >
        <div class="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-5">
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-bold text-slate-900">Нове завдання</h3>
            <button @click="closeModal" class="text-slate-400 hover:text-slate-600 p-1">✕</button>
          </div>

          <form @submit.prevent="handleCreateTask" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">
                Назва <span class="text-rose-500">*</span>
              </label>
              <input
                v-model="form.title"
                type="text"
                placeholder="Наприклад: Зверстати верстку шапки"
                class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                :class="{ 'border-rose-400 bg-rose-50/30': errors.title }"
              />
              <p v-if="errors.title" class="text-xs text-rose-500 mt-1">{{ errors.title }}</p>
            </div>

            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">
                Виконавець
              </label>
              <input
                v-model="form.assignee"
                type="text"
                list="assignees-list"
                placeholder="Наприклад: Олександр Поліщук"
                class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />

              <!-- Список підказок з гетера taskStore -->
              <datalist id="assignees-list">
                <option
                  v-for="name in tasksStore.availableAssignees"
                  :key="name"
                  :value="name"
                />
              </datalist>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">
                  Термін виконання <span class="text-rose-500">*</span>
                </label>
                <input
                  v-model="form.dueDate"
                  type="date"
                  :min="minDate"
                  class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all cursor-pointer"
                  :class="{ 'border-rose-400 bg-rose-50/30': errors.dueDate }"
                />
                <p v-if="errors.dueDate" class="text-xs text-rose-500 mt-1">{{ errors.dueDate }}</p>
              </div>

              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">Колонка</label>
                <select
                  v-model="form.status"
                  class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="todo">До виконання</option>
                  <option value="in_progress">В роботі</option>
                  <option value="done">Виконано</option>
                </select>
              </div>
            </div>

            <div class="flex justify-end gap-3 pt-3">
              <button
                type="button"
                @click="closeModal"
                class="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100"
              >
                Скасувати
              </button>
              <button
                type="submit"
                :disabled="isSubmitting"
                class="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium shadow-xs disabled:opacity-50 cursor-pointer"
              >
                {{ isSubmitting ? 'Збереження...' : 'Додати' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </template>
</template>
