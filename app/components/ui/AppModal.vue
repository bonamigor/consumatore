<script setup lang="ts">
defineProps<{
  open: boolean
  title?: string
  size?: 'md' | 'lg' | 'xl'
}>()

const emit = defineEmits<{ close: [] }>()

const sizeClass = {
  md: 'max-w-md',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      @click.self="emit('close')"
    >
      <div
        class="w-full rounded-2xl bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
        :class="sizeClass[size || 'md']"
      >
        <div v-if="title || $slots.header" class="mb-6 flex items-center justify-between gap-4">
          <slot name="header">
            <h3 class="text-xl font-bold text-gray-900">{{ title }}</h3>
          </slot>
          <button class="btn-ghost p-2" type="button" aria-label="Fechar" @click="emit('close')">
            <Icon name="lucide:x" class="w-5 h-5" />
          </button>
        </div>
        <slot />
        <div v-if="$slots.footer" class="mt-6 flex justify-end gap-2 border-t border-gray-200 pt-4">
          <slot name="footer" />
        </div>
      </div>
    </div>
  </Teleport>
</template>
