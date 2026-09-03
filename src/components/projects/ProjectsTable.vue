<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { ProjectStatus, type ProjectWithTaskCount } from '@/types'
import { formatDate } from '@/utils/formatters'
import { useColumnResize } from '@/composables/useColumnResize'
import ActionDropdown from "@/components/common/ActionDropdown.vue";

defineProps<{
  isLoading: boolean
  projects: ProjectWithTaskCount[]
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}>()

const emit = defineEmits<{
  (e: 'sort', field: string): void
}>()

// Хендлер лише сповіщає батьківський компонент
function onSortClick(field: string) {
  emit('sort', field)
}

// --- РЕСАЙЗ КОЛОНОК ---
type ProjectColumnKey = 'name' | 'status' | 'progress' | 'createdAt' | 'actions'

const { colWidths, startResize } = useColumnResize<ProjectColumnKey>(
  {
    name: 280,
    status: 130,
    progress: 200,
    createdAt: 140,
    actions: 56
  },
  {
    actions: 48 // Кастомна мінімальна ширина для колонки дій
  }
)
</script>

<template>
  <div class="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden transition-colors duration-200">
    <div class="overflow-x-auto" :class="projects?.length < 3 ? 'min-h-[290px]' : ''">
      <table class="w-full text-left border-collapse table-fixed">
        <thead>
        <tr class="bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider select-none">

          <!-- Назва -->
          <th :style="{ width: `${colWidths.name}px` }" class="relative px-5 py-3.5">
            <button @click="onSortClick('name')" class="inline-flex items-center gap-1.5 hover:text-slate-900 dark:hover:text-slate-200 transition-colors cursor-pointer">
              <span>Назва проєкту</span>
              <span class="text-slate-400 dark:text-slate-500">
                  <template v-if="sortBy === 'name'">{{ sortOrder === 'asc' ? '↑' : '↓' }}</template>
                  <template v-else>↕</template>
                </span>
            </button>
            <div @mousedown.stop="startResize('name', $event)" class="resize-handle" />
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

          <!-- Прогрес / Завдання -->
          <th :style="{ width: `${colWidths.progress}px` }" class="relative px-5 py-3.5">
            <button @click="onSortClick('tasksCount')" class="inline-flex items-center gap-1.5 hover:text-slate-900 dark:hover:text-slate-200 transition-colors cursor-pointer">
              <span>Завдання</span>
              <span class="text-slate-400 dark:text-slate-500">
                  <template v-if="sortBy === 'tasksCount'">{{ sortOrder === 'asc' ? '↑' : '↓' }}</template>
                  <template v-else>↕</template>
                </span>
            </button>
            <div @mousedown.stop="startResize('progress', $event)" class="resize-handle" />
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
        <!-- СТАН ЗАВАНТАЖЕННЯ (Скелетони) -->
        <template v-if="isLoading">
          <tr v-for="n in 3" :key="n" class="animate-pulse">
            <!-- Назва та опис -->
            <td class="px-5 py-4 min-w-0">
              <div class="h-4 bg-slate-200 dark:bg-slate-800 rounded-md w-2/5 mb-2"></div>
              <div class="h-3 bg-slate-200 dark:bg-slate-800 rounded-md w-3/4"></div>
            </td>

            <!-- Статус -->
            <td class="px-5 py-4 whitespace-nowrap">
              <div class="h-5 bg-slate-200 dark:bg-slate-800 rounded-full w-16"></div>
            </td>

            <!-- Прогрес -->
            <td class="px-5 py-4 whitespace-nowrap">
              <div class="space-y-2 max-w-[160px]">
                <div class="flex justify-between">
                  <div class="h-3 bg-slate-200 dark:bg-slate-800 rounded w-10"></div>
                  <div class="h-3 bg-slate-200 dark:bg-slate-800 rounded w-8"></div>
                </div>
                <div class="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full"></div>
              </div>
            </td>

            <!-- Дата -->
            <td class="px-5 py-4 whitespace-nowrap">
              <div class="h-3.5 bg-slate-200 dark:bg-slate-800 rounded w-20"></div>
            </td>

            <!-- Дії -->
            <td class="px-5 py-4 whitespace-nowrap text-right">
              <div class="flex items-center justify-end gap-1">
                <div class="w-7 h-7 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
                <div class="w-7 h-7 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
              </div>
            </td>
          </tr>
        </template>

        <!-- СТАН З ДАНИМИ -->
        <template v-else>
          <tr
            v-for="(project, index) in projects"
            :key="project.id"
            class="group hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
            :class="{ 'opacity-75 bg-slate-50/40 dark:bg-slate-950/30': project.status === ProjectStatus.ARCHIVED }"
          >
            <!-- Назва та опис -->
            <td class="px-5 py-4 min-w-0">
              <RouterLink
                :to="{ name: 'project-detail', params: { id: project.id } }"
                class="font-semibold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors truncate block"
              >
                {{ project.name }}
              </RouterLink>
              <p class="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                {{ project.description || 'Опис відсутній...' }}
              </p>
            </td>

            <!-- Статус -->
            <td class="px-5 py-4 whitespace-nowrap">
              <span
                class="inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-full border transition-colors"
                :class="project.status === ProjectStatus.ARCHIVED
                  ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200/80 dark:border-amber-800/60'
                  : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200/80 dark:border-emerald-800/60'"
              >
                {{ project.status === ProjectStatus.ARCHIVED ? 'В архіві' : 'Активний' }}
              </span>
            </td>

            <!-- Прогрес -->
            <td class="px-5 py-4 whitespace-nowrap">
              <div class="space-y-1.5 max-w-[160px]">
                <div class="flex justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
                  <span>{{ project.doneTasksCount || 0 }} / {{ project.tasksCount || 0 }}</span>
                  <span>{{ project.tasksCount ? Math.round(((project.doneTasksCount || 0) / project.tasksCount) * 100) : 0 }}%</span>
                </div>
                <div class="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    class="h-full bg-emerald-500 dark:bg-emerald-400 transition-all duration-300"
                    :style="{
                      width: `${project.tasksCount ? ((project.doneTasksCount || 0) / project.tasksCount) * 100 : 0}%`
                    }"
                  ></div>
                </div>
              </div>
            </td>

            <!-- Дата -->
            <td class="px-5 py-4 whitespace-nowrap text-xs text-slate-500 dark:text-slate-400">
              {{ formatDate(project.createdAt) }}
            </td>

            <!-- Дії -->
            <td class="px-5 py-4 whitespace-nowrap text-right">
              <div class="flex items-center justify-end gap-1">
                <action-dropdown
                  :project="project"
                  :index="index"
                  :length="projects.length"
                />
              </div>
            </td>
          </tr>
        </template>
        </tbody>
      </table>
    </div>
  </div>
</template>
