<script setup lang="ts">
import { useRouter, RouterLink } from 'vue-router'

const router = useRouter()

const goBack = () => {
  if (window.history.length > 1) {
    router.back()
  } else {
    router.push('/')
  }
}
</script>

<template>
  <div class="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex items-center justify-center p-4 transition-colors">
    <div class="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-8 text-center shadow-xl shadow-slate-200/40 dark:shadow-none transition-all">

      <!-- Бейдж 404 -->
      <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60 mb-6">
        <span class="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
        Помилка 404
      </div>

      <!-- Іконка / Графіка -->
      <div class="mx-auto w-16 h-16 mb-6 flex items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 border border-slate-200/60 dark:border-slate-700/60">
        <svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
        </svg>
      </div>

      <!-- Заголовок та опис -->
      <h1 class="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 mb-2">
        Сторінку не знайдено
      </h1>
      <p class="text-sm text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
        Запитувана сторінка не існує, була видалена або її адреса змінилася.
      </p>

      <!-- Кнопки дій -->
      <div class="flex flex-col sm:flex-row items-center gap-3">
        <button
          type="button"
          @click="goBack"
          class="w-full sm:w-1/2 px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/70 dark:hover:bg-slate-700/80 rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
          Назад
        </button>

        <RouterLink
          to="/"
          class="w-full sm:w-1/2 px-4 py-2.5 text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
          </svg>
          На головну
        </RouterLink>
      </div>

    </div>
  </div>
</template>
