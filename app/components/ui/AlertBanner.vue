<script setup lang="ts">
defineProps<{
  type?: 'error' | 'success' | 'info' | 'warning'
  message: string
}>()

const styles = {
  error: 'bg-red-50 text-red-800 border-red-200',
  success: 'bg-green-50 text-green-800 border-green-200',
  info: 'bg-blue-50 text-blue-800 border-blue-200',
  warning: 'bg-amber-50 text-amber-900 border-amber-200',
}
</script>

<template>
  <div
    class="rounded-lg border px-4 py-3 text-sm"
    :class="styles[type || 'info']"
  >
    {{ message }}
  </div>
</template>
