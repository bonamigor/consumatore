<script setup lang="ts">
defineProps<{
  itens: number
  total: number
  erros: number
  rotulo: string
  carregando?: boolean
}>()

const emit = defineEmits<{ acao: [] }>()
</script>

<template>
  <div class="sticky bottom-0 z-10 -mx-6 -mb-6 mt-6 border-t border-gray-200 bg-white/95 px-6 py-3 backdrop-blur md:-mx-8 md:-mb-8 md:px-8">
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div class="flex items-center gap-8">
        <div>
          <p class="text-xs text-gray-500">Itens</p>
          <p class="text-lg font-semibold tabular-nums text-gray-900">{{ itens }}</p>
        </div>
        <div>
          <p class="text-xs text-gray-500">Total do pedido</p>
          <p class="text-lg font-semibold tabular-nums text-gray-900">{{ formatCurrency(total) }}</p>
        </div>
        <p v-if="erros" class="flex items-center gap-1.5 text-sm text-red-700">
          <Icon name="lucide:alert-circle" class="h-4 w-4" />
          {{ erros === 1 ? '1 item precisa de ajuste' : `${erros} itens precisam de ajuste` }}
        </p>
      </div>
      <slot />
      <button type="button" class="btn-primary" :disabled="carregando" @click="emit('acao')">
        <Icon v-if="carregando" name="lucide:loader-2" class="h-4 w-4 animate-spin" />
        {{ rotulo }}
        <Icon v-if="!carregando" name="lucide:arrow-right" class="h-4 w-4" />
      </button>
    </div>
  </div>
</template>
