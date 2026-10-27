<script setup lang="ts">
import type { PedidosPorCliente, ValorTotalPeriodo } from '~/types/api'
import { formatCurrency } from '~/utils/format'

definePageMeta({ middleware: ['auth', 'admin'] })

const pedidoService = usePedidoService()
const loading = ref(false)
const error = ref('')
const porCliente = ref<PedidosPorCliente[]>([])
const valorPeriodo = ref<ValorTotalPeriodo | null>(null)

const hoje = new Date()
const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1)

const inicio = ref(inicioMes.toISOString().slice(0, 10))
const fim = ref(hoje.toISOString().slice(0, 10))

const totalPedidosClientes = computed(() =>
  porCliente.value.reduce((sum, row) => sum + Number(row.totalPedidos || 0), 0),
)

const totalValorClientes = computed(() =>
  porCliente.value.reduce((sum, row) => sum + Number(row.valorTotal || 0), 0),
)

async function load() {
  loading.value = true
  error.value = ''
  try {
    const inicioTs = new Date(`${inicio.value}T00:00:00`).getTime()
    const fimTs = new Date(`${fim.value}T23:59:59`).getTime()
    const [clientes, periodo] = await Promise.all([
      pedidoService.relatorioPedidosPorCliente(inicioTs, fimTs),
      pedidoService.relatorioValorTotalPeriodo(inicioTs, fimTs),
    ])
    porCliente.value = clientes
    valorPeriodo.value = periodo
  }
  catch (e) {
    error.value = e instanceof Error ? e.message : 'Erro ao carregar relatórios'
  }
  finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<template>
  <div>
    <UiPageHeader
      title="Relatórios"
      description="Vendas por escola, faturamento e acesso ao relatório de compras"
    >
      <template #actions>
        <button type="button" class="btn-primary" :disabled="loading" @click="load">
          <Icon name="lucide:refresh-cw" class="h-4 w-4" :class="{ 'animate-spin': loading }" />
          Atualizar
        </button>
      </template>
    </UiPageHeader>

    <div class="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
      <NuxtLink
        to="/admin/relatorios/compras"
        class="card flex items-center gap-4 p-6 transition-all hover:border-brand-300 hover:shadow-md"
      >
        <div class="flex h-12 w-12 items-center justify-center rounded-lg bg-orange-100 text-orange-600">
          <Icon name="lucide:shopping-bag" class="h-6 w-6" />
        </div>
        <div>
          <h3 class="font-bold text-gray-900">Relatório de Compras</h3>
          <p class="text-sm text-gray-600">Produtos em pedidos confirmados no período</p>
        </div>
      </NuxtLink>
      <NuxtLink
        to="/admin/pedidos"
        class="card flex items-center gap-4 p-6 transition-all hover:border-brand-300 hover:shadow-md"
      >
        <div class="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
          <Icon name="lucide:clipboard-list" class="h-6 w-6" />
        </div>
        <div>
          <h3 class="font-bold text-gray-900">Listagem de Pedidos / Vendas</h3>
          <p class="text-sm text-gray-600">Filtre por escola, número do pedido e datas e veja o valor total</p>
        </div>
      </NuxtLink>
    </div>

    <UiAlertBanner v-if="error" type="error" :message="error" class="mb-4" />

    <div class="mb-6 card p-6">
      <h3 class="mb-4 text-lg font-bold text-gray-900">Relatório de vendas por período</h3>
      <div class="mb-4 flex flex-col gap-4 md:flex-row md:items-end">
        <div>
          <label class="label">Início</label>
          <input v-model="inicio" class="input" type="date">
        </div>
        <div>
          <label class="label">Fim</label>
          <input v-model="fim" class="input" type="date">
        </div>
        <button type="button" class="btn-secondary" @click="load">Filtrar</button>
      </div>
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <p class="text-sm text-gray-600">Valor total (confirmados)</p>
          <p class="text-3xl font-bold text-gray-900">
            {{ formatCurrency(valorPeriodo?.valorTotal || 0) }}
          </p>
        </div>
        <div>
          <p class="text-sm text-gray-600">Pedidos no período</p>
          <p class="text-3xl font-bold text-gray-900">{{ totalPedidosClientes }}</p>
        </div>
        <div>
          <p class="text-sm text-gray-600">Valor por escola (soma)</p>
          <p class="text-3xl font-bold text-gray-900">{{ formatCurrency(totalValorClientes) }}</p>
        </div>
      </div>
    </div>

    <div class="card overflow-hidden">
      <div class="border-b px-6 py-4">
        <h3 class="text-lg font-bold text-gray-900">Pedidos por escola no período</h3>
      </div>
      <UiLoadingState v-if="loading" />
      <UiEmptyState v-else-if="!porCliente.length" message="Nenhum pedido no período selecionado." />
      <table v-else class="w-full">
        <thead class="bg-gray-50">
          <tr>
            <th class="table-th">Escola</th>
            <th class="table-th">Qtd. pedidos</th>
            <th class="table-th">Valor total</th>
            <th class="table-th">Ações</th>
          </tr>
        </thead>
        <tbody class="divide-y">
          <tr v-for="row in porCliente" :key="row.clienteId" class="hover:bg-gray-50">
            <td class="table-td font-medium">{{ row.clienteNome }}</td>
            <td class="table-td">{{ row.totalPedidos }}</td>
            <td class="table-td font-bold">{{ formatCurrency(row.valorTotal || 0) }}</td>
            <td class="table-td">
              <NuxtLink
                :to="`/admin/pedidos?clienteId=${row.clienteId}&inicio=${inicio}&fim=${fim}`"
                class="font-medium text-brand-600 hover:text-brand-700"
              >
                Ver pedidos
              </NuxtLink>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
