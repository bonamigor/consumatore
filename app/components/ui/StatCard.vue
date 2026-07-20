<script setup lang="ts">
defineProps<{
  label: string
  value: string | number
  icon: string
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'yellow' | 'gray'
  to?: string
}>()

const colorMap = {
  blue: 'bg-blue-100 text-blue-600',
  green: 'bg-green-100 text-green-600',
  purple: 'bg-purple-100 text-purple-600',
  orange: 'bg-orange-100 text-orange-600',
  yellow: 'bg-yellow-100 text-yellow-600',
  gray: 'bg-gray-100 text-gray-600',
}
</script>

<template>
  <component
    :is="to ? 'NuxtLink' : 'div'"
    :to="to"
    class="card block p-6"
    :class="to ? 'transition-all hover:border-brand-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-brand-500/30' : ''"
  >
    <div class="mb-2 flex items-center gap-3">
      <div
        class="flex h-10 w-10 items-center justify-center rounded-lg"
        :class="colorMap[color || 'blue']"
      >
        <Icon :name="icon" class="h-5 w-5" />
      </div>
      <span class="text-2xl font-bold text-gray-900">{{ value }}</span>
    </div>
    <p class="text-sm text-gray-600">
      {{ label }}
      <span v-if="to" class="ml-1 text-brand-600">→</span>
    </p>
  </component>
</template>
