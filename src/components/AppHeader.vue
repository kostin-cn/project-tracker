<script setup lang="ts">
import { RouterLink } from 'vue-router'
</script>

<template>
  <header class="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200/80 transition-colors">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
      <RouterLink to="/" class="flex items-center gap-3 transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-lg">
        <div class="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-lg shadow-sm">
          P
        </div>
        <span class="font-bold text-lg tracking-tight text-slate-900">
          Project<span class="text-emerald-600">Tracker</span>
        </span>
      </RouterLink>

      <nav class="flex items-center gap-1 sm:gap-2">
        <RouterLink to="/" class="px-3.5 py-2 rounded-lg text-sm font-medium transition-colors text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    active-class="!text-emerald-700 !bg-emerald-50 font-semibold">
          Проєкти
        </RouterLink>
      </nav>
    </div>
  </header>
</template>
