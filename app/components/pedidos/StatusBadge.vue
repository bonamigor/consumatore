<script setup lang="ts">
import { statusPedidoClass, statusPedidoIcon, statusPedidoLabel } from '~/utils/format'
import type { StatusPedido } from '~/types/api'

defineProps<{
  status: StatusPedido | string
}>()
</script>

<template>
  <span
    class="inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium"
    :class="statusPedidoClass[status] || 'bg-gray-100 text-gray-800'"
  >
    <Icon :name="statusPedidoIcon[status] || 'lucide:circle'" class="h-4 w-4" />
    {{ statusPedidoLabel[status] || status }}
  </span>
</template>
