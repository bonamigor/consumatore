<script setup lang="ts">
import type { CompraProdutoPeriodo } from '~/types/api'
import { formatCurrency } from '~/utils/format'
import { exportComprasPdf } from '~/utils/exportRelatorios'

definePageMeta({ middleware: ['auth', 'admin'] })

const pedidoService = usePedidoService()
const loading = ref(false)
const exporting = ref(false)
const error = ref('')
const itens = ref<CompraProdutoPeriodo[]>([])
const searched = ref(false)

const hoje = new Date()
const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
const inicio = ref(inicioMes.toISOString().slice(0, 10))
const fim = ref(hoje.toISOString().slice(0, 10))

const totais = computed(() => ({
  quantidade: itens.value.reduce((sum, i) => sum + Number(i.quantidadeTotal || 0), 0),
  valor: itens.value.reduce((sum, i) => sum + Number(i.valorTotal || 0), 0),
  produtos: itens.value.length,
}))

async function load() {
  if (!inicio.value || !fim.value) {
    error.value = 'Informe data inicial e final'
    return
  }
  loading.value = true
  error.value = ''
  searched.value = true
  try {
    const inicioTs = new Date(`${inicio.value}T00:00:00`).getTime()
    const fimTs = new Date(`${fim.value}T23:59:59`).getTime()
    itens.value = await pedidoService.relatorioCompras(inicioTs, fimTs)
  }
  catch (e) {
    error.value = e instanceof Error ? e.message : 'Erro ao carregar relatório de compras'
    itens.value = []
  }
  finally {
    loading.value = false
  }
}

function exportarPdf() {
  if (!itens.value.length) {
    error.value = 'Não há dados para exportar. Faça uma pesquisa primeiro.'
    return
  }
  exporting.value = true
  try {
    exportComprasPdf(itens.value, { inicio: inicio.value, fim: fim.value })
  }
  catch (e) {
    error.value = e instanceof Error ? e.message : 'Erro ao exportar PDF'
  }
  finally {
    exporting.value = false
  }
}

onMounted(load)
</script>

<template>
  <div>
    <UiPageHeader
      title="Relatório de Compras"
      description="Produtos em pedidos confirmados ou entregues no período (pela data de confirmação)"
    >
      <template #actions>
        <button
          type="button"
          class="btn-primary"
          :disabled="!itens.length || exporting || loading"
          @click="exportarPdf"
        >
          <Icon name="lucide:file-down" class="h-4 w-4" />
          {{ exporting ? 'Exportando...' : 'Exportar PDF' }}
        </button>
        <NuxtLink to="/admin/relatorios" class="btn-secondary">Voltar</NuxtLink>
      </template>
    </UiPageHeader>

    <div class="mb-6 card p-6">
      <div class="flex flex-col gap-4 md:flex-row md:items-end">
        <div>
          <label class="label">Data inicial</label>
          <input v-model="inicio" class="input" type="date">
        </div>
        <div>
          <label class="label">Data final</label>
          <input v-model="fim" class="input" type="date">
        </div>
        <button type="button" class="btn-primary" :disabled="loading" @click="load">
          <Icon name="lucide:search" class="h-4 w-4" />
          Pesquisar
        </button>
      </div>
    </div>

    <UiAlertBanner v-if="error" type="error" :message="error" class="mb-4" />

    <div v-if="searched && !loading" class="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
      <div class="card p-4">
        <p class="text-sm text-gray-600">Produtos</p>
        <p class="text-2xl font-bold">{{ totais.produtos }}</p>
      </div>
      <div class="card p-4">
        <p class="text-sm text-gray-600">Quantidade total</p>
        <p class="text-2xl font-bold">{{ totais.quantidade }}</p>
      </div>
      <div class="card p-4">
        <p class="text-sm text-gray-600">Valor total</p>
        <p class="text-2xl font-bold text-brand-700">{{ formatCurrency(totais.valor) }}</p>
      </div>
    </div>

    <UiLoadingState v-if="loading" />
    <UiEmptyState
      v-else-if="searched && !itens.length"
      message="Nenhum produto encontrado em pedidos confirmados neste período."
    />
    <div v-else-if="itens.length" class="card overflow-hidden">
      <table class="w-full">
        <thead class="border-b bg-gray-50">
          <tr>
            <th class="table-th">Produto</th>
            <th class="table-th">Unidade</th>
            <th class="table-th">Qtd. total</th>
            <th class="table-th">Pedidos</th>
            <th class="table-th">Valor total</th>
          </tr>
        </thead>
        <tbody class="divide-y">
          <tr v-for="item in itens" :key="item.produtoId" class="hover:bg-gray-50">
            <td class="table-td font-medium">{{ item.produtoNome }}</td>
            <td class="table-td">{{ item.unidadeMedida }}</td>
            <td class="table-td">{{ item.quantidadeTotal }}</td>
            <td class="table-td">{{ item.quantidadePedidos }}</td>
            <td class="table-td font-bold">{{ formatCurrency(item.valorTotal) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
