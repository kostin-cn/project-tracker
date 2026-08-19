<script setup lang="ts">
import {ProjectStatus, type ProjectWithTaskCount} from "@/types";
import {RouterLink} from "vue-router";
import {useProjectStore} from "@/stores/projects.ts";
import { toast } from 'vue-sonner'

defineProps<{
  projects: ProjectWithTaskCount[]
}>()

const projectsStore = useProjectStore()

function formatDate(dateValue?: string | number | Date): string {
  if (!dateValue) return 'нещодавно'

  return new Date(dateValue).toLocaleDateString('uk-UA', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

// Хендлер архівування/відновлення проєкту
async function handleToggleStatus(projectId: number, currentStatus: ProjectStatus) {
  const newStatus = currentStatus === ProjectStatus.ACTIVE
    ? ProjectStatus.ARCHIVED
    : ProjectStatus.ACTIVE

  await projectsStore.updateProject(projectId, { status: newStatus })

  const statusMessage = newStatus === ProjectStatus.ARCHIVED
    ? 'Проєкт перенесено в архів'
    : 'Проєкт відновлено з архіву'

  toast.success(statusMessage)
}

// Хендлер видалення проєкту
async function handleDelete(id: number, title: string) {
  if (confirm(`Ви дійсно хочете видалити проєкт "${title}"?`)) {
    await projectsStore.deleteProject(id)
    toast.info('Проєкт видалено')
  }
}

</script>

<template>
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    <article
      v-for="project in projects"
      :key="project.id"
      class="group relative bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs hover:shadow-md hover:border-slate-300 transition-all flex flex-col justify-between"
      :class="{ 'opacity-75 bg-slate-50/50 border-dashed': project.status === ProjectStatus.ARCHIVED }"
    >
      <div>
        <!-- Шапка картки: Назва + Бейдж + Кнопки дій -->
        <div class="flex items-start justify-between gap-3 mb-3">
          <div class="flex items-center gap-2.5 min-w-0">
            <h2 class="text-lg font-semibold text-slate-900 group-hover:text-emerald-600 transition-colors line-clamp-1">
              {{ project.name }}
            </h2>

            <!-- Бейдж статусу -->
            <span
              class="shrink-0 text-[11px] font-medium px-2 py-0.5 rounded-full border transition-colors"
              :class="project.status === ProjectStatus.ARCHIVED
                  ? 'bg-amber-50 text-amber-700 border-amber-200/80'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200/80'"
            >
                  {{ project.status === ProjectStatus.ARCHIVED ? 'В архіві' : 'Активний' }}
                </span>
          </div>

          <!-- Блок кнопок дій (з'являється при ховері) -->
          <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            <!-- Кнопка зміни статусу (Архівувати / Розархівувати) -->
            <button
              type="button"
              @click.prevent="handleToggleStatus(project.id, project.status)"
              class="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-all cursor-pointer"
              :title="project.status === ProjectStatus.ARCHIVED ? 'Розархівувати проєкт' : 'Архівувати проєкт'"
            >
              <!-- Іконка архіву / повернення -->
              <svg v-if="project.status === ProjectStatus.ARCHIVED" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <svg v-else class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 8h14M5 8a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v1a2 2 0 01-2 2M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
            </button>

            <!-- Кнопка видалення -->
            <button
              type="button"
              @click.prevent="handleDelete(project.id, project.name)"
              class="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
              title="Видалити проєкт"
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>

        <p class="text-sm text-slate-600 line-clamp-2 min-h-10 mb-3">
          {{ project.description || 'Опис відсутній...' }}
        </p>

        <!-- Дата створення проєкту -->
        <div class="flex items-center gap-1.5 text-xs text-slate-400 mb-6">
          <svg class="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 002-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span>Створено {{ formatDate(project.createdAt) }}</span>
        </div>
      </div>

      <div>
        <!-- Статистика / Прогрес -->
        <div class="space-y-2 mb-4">
          <div class="flex justify-between text-xs font-medium text-slate-500">
            <span>Завдання</span>
            <span>{{ project.doneTasksCount || 0 }} / {{ project.tasksCount || 0 }}</span>
          </div>

          <div class="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              class="h-full bg-emerald-500 transition-all duration-300"
              :style="{
            width: `${project.tasksCount ? ((project.doneTasksCount || 0) / project.tasksCount) * 100 : 0}%`
          }"
            ></div>
          </div>
        </div>

        <RouterLink
          :to="{ name: 'project-detail', params: { id: project.id } }"
          class="mt-2 w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 font-medium text-sm transition-colors cursor-pointer"
        >
          <span>Відкрити дошку</span>
          <span>→</span>
        </RouterLink>
      </div>
    </article>
  </div>
</template>
