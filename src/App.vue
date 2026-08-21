<script setup lang="ts">
import { RouterView } from 'vue-router'
import { Toaster } from 'vue-sonner'
import TheHeader from '@/components/common/AppHeader.vue'

import 'vue-sonner/style.css'
</script>

<template>
  <Toaster position="bottom-right" richColors />

  <div class="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans flex flex-col antialiased transition-colors duration-200">
    <TheHeader />

    <main class="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <RouterView />
    </main>
  </div>
</template>
