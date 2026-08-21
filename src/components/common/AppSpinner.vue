<script setup lang="ts">
interface Props {
  // Дозволяє змінювати вертикальні відступи (за замовчуванням py-20)
  py?: string
}

withDefaults(defineProps<Props>(), {
  py: 'py-20'
})
</script>

<template>
  <div :class="['flex justify-center items-center', py]">
    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 dark:border-emerald-400"></div>
  </div>
</template>
