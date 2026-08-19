<script setup lang="ts">
import { RouterView } from 'vue-router'
import { Toaster } from 'vue-sonner'
import TheHeader from '@/components/AppHeader.vue'

import 'vue-sonner/style.css'
</script>

<template>
  <Toaster position="bottom-right" richColors />

  <div class="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col antialiased">
    <TheHeader />

    <main class="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <RouterView />
    </main>
  </div>
</template>
