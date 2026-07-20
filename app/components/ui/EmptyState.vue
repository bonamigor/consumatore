<script setup lang="ts">
defineProps<{
  message?: string
  icon?: string
}>()
</script>

<template>
  <div class="card p-12 text-center">
    <Icon :name="icon || 'lucide:inbox'" class="mx-auto mb-4 h-12 w-12 text-gray-300" />
    <p class="text-gray-500">{{ message || 'Nenhum registro encontrado' }}</p>
    <div v-if="$slots.default" class="mt-4">
      <slot />
    </div>
  </div>
</template>
