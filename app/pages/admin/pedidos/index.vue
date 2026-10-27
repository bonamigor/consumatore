<script setup lang="ts">
import type {
  Cliente,
  Pedido,
  PedidoFiltroResumo,
  StatusPedido,
} from '~/types/api'
import { formatCurrency, formatDate, statusPedidoLabel } from '~/utils/format'
import { exportPedidosExcel, exportPedidosPdf } from '~/utils/exportRelatorios'

definePageMeta({ middleware: ['auth', 'admin'] })

const pedidoService = usePedidoService()
const clienteService = useClienteService()
const route = useRoute()
const loading = ref(true)
const exporting = ref(false)
const error = ref('')
const pedidos = ref<Pedido[]>([])
const clientes = ref<Cliente[]>([])
const resumo = ref<PedidoFiltroResumo>({ quantidadePedidos: 0, valorTotal: 0 })
const modoAnalitico = ref(false)

const validStatus = new Set(['PENDENTE', 'CONFIRMADO', 'CANCELADO', 'ENTREGUE'])

const statusFilter = computed(() => {
  const s = typeof route.query.status === 'string' ? route.query.status : ''
  return validStatus.has(s) ? (s as StatusPedido) : ''
})

const selectedClienteId = computed({
  get() {
    const raw = route.query.clienteId
    const id = typeof raw === 'string' ? Number(raw) : NaN
    return Number.isFinite(id) && id > 0 ? id : null
  },
  set(value: number | null) {
    updateFilters({ clienteId: value })
  },
})

const pedidoIdInput = ref(
  typeof route.query.pedidoId === 'string'
    ? route.query.pedidoId
    : (typeof route.query.id === 'string' ? route.query.id : ''),
)

const inicio = ref(
  typeof route.query.inicio === 'string' ? route.query.inicio : '',
)
const fim = ref(
  typeof route.query.fim === 'string' ? route.query.fim : '',
)

function normalizePedidoId(value: unknown): string {
  if (value == null) return ''
  return String(value).replace(/\D/g, '')
}

function toStartTs(date: string) {
  return date ? new Date(`${date}T00:00:00`).getTime() : undefined
}

function toEndTs(date: string) {
  return date ? new Date(`${date}T23:59:59`).getTime() : undefined
}

async function updateFilters(patch: {
  status?: StatusPedido | ''
  clienteId?: number | null
  pedidoId?: string
  inicio?: string
  fim?: string
}) {
  const nextStatus = patch.status !== undefined ? patch.status : statusFilter.value
  const nextClienteId = patch.clienteId !== undefined ? patch.clienteId : selectedClienteId.value
  const nextId = patch.pedidoId !== undefined
    ? normalizePedidoId(patch.pedidoId)
    : normalizePedidoId(pedidoIdInput.value)
  const nextInicio = patch.inicio !== undefined ? patch.inicio : inicio.value
  const nextFim = patch.fim !== undefined ? patch.fim : fim.value

  await navigateTo({
    path: '/admin/pedidos',
    query: {
      ...(nextStatus ? { status: nextStatus } : {}),
      ...(nextClienteId ? { clienteId: String(nextClienteId) } : {}),
      ...(nextId ? { pedidoId: nextId } : {}),
      ...(nextInicio ? { inicio: nextInicio } : {}),
      ...(nextFim ? { fim: nextFim } : {}),
    },
  })
}

async function setStatusFilter(value: StatusPedido | '') {
  await updateFilters({ status: value })
}

async function applyDateAndIdFilters() {
  await updateFilters({
    pedidoId: normalizePedidoId(pedidoIdInput.value),
    inicio: inicio.value,
    fim: fim.value,
  })
}

async function clearFilters() {
  pedidoIdInput.value = ''
  inicio.value = ''
  fim.value = ''
  await navigateTo({ path: '/admin/pedidos' })
}

function buildFilterQuery() {
  const idRaw = typeof route.query.pedidoId === 'string'
    ? Number(route.query.pedidoId)
    : (typeof route.query.id === 'string' ? Number(route.query.id) : NaN)
  const pedidoId = Number.isFinite(idRaw) && idRaw > 0 ? idRaw : undefined
  const inicioQ = typeof route.query.inicio === 'string' ? route.query.inicio : ''
  const fimQ = typeof route.query.fim === 'string' ? route.query.fim : ''

  return {
    ...(statusFilter.value ? { status: statusFilter.value } : {}),
    ...(selectedClienteId.value ? { clienteId: selectedClienteId.value } : {}),
    ...(pedidoId ? { pedidoId } : {}),
    ...(inicioQ ? { inicioTimestamp: toStartTs(inicioQ) } : {}),
    ...(fimQ ? { fimTimestamp: toEndTs(fimQ) } : {}),
  }
}

async function loadClientes() {
  clientes.value = await clienteService.listar()
}

async function load() {
  loading.value = true
  error.value = ''
  pedidoIdInput.value = typeof route.query.pedidoId === 'string'
    ? route.query.pedidoId
    : (typeof route.query.id === 'string' ? route.query.id : '')
  inicio.value = typeof route.query.inicio === 'string' ? route.query.inicio : ''
  fim.value = typeof route.query.fim === 'string' ? route.query.fim : ''

  try {
    const filters = buildFilterQuery()
    const [page, summary] = await Promise.all([
      pedidoService.listar({
        size: 100,
        sort: 'dataCriacao,desc',
        ...filters,
      }),
      pedidoService.resumirFiltros(filters),
    ])
    pedidos.value = page.content || []
    resumo.value = summary
  }
  catch (e) {
    error.value = e instanceof Error ? e.message : 'Erro ao carregar pedidos'
  }
  finally {
    loading.value = false
  }
}

watch(
  () => route.fullPath,
  () => load(),
)

onMounted(async () => {
  try {
    await loadClientes()
  }
  catch (e) {
    error.value = e instanceof Error ? e.message : 'Erro ao carregar clientes'
  }
  await load()
})

function filtrosResumoTexto() {
  const parts: string[] = []
  if (statusFilter.value) {
    parts.push(`Status: ${statusPedidoLabel[statusFilter.value] || statusFilter.value}`)
  }
  if (selectedClienteId.value) {
    const nome = clientes.value.find(c => c.id === selectedClienteId.value)?.nome
    parts.push(`Escola: ${nome || selectedClienteId.value}`)
  }
  if (typeof route.query.pedidoId === 'string' && route.query.pedidoId) {
    parts.push(`ID: ${route.query.pedidoId}`)
  }
  else if (typeof route.query.id === 'string' && route.query.id) {
    parts.push(`ID: ${route.query.id}`)
  }
  const inicioQ = typeof route.query.inicio === 'string' ? route.query.inicio : ''
  const fimQ = typeof route.query.fim === 'string' ? route.query.fim : ''
  if (inicioQ || fimQ) {
    parts.push(`Período: ${inicioQ ? formatDate(inicioQ) : '…'} a ${fimQ ? formatDate(fimQ) : '…'}`)
  }
  return parts.length ? parts.join(' | ') : 'Sem filtros adicionais'
}

async function pedidosParaExportacao(analitico: boolean): Promise<Pedido[]> {
  const filters = buildFilterQuery()
  const page = await pedidoService.listar({
    size: 500,
    sort: 'dataCriacao,desc',
    ...filters,
  })
  let lista = page.content || []

  if (analitico) {
    const incomplete = lista.filter(p => !p.itens?.length)
    if (incomplete.length) {
      const details = await Promise.all(
        incomplete.map(p => pedidoService.buscar(p.id)),
      )
      const byId = new Map(details.map(d => [d.id, d]))
      lista = lista.map(p => byId.get(p.id) || p)
    }
  }

  return lista
}

async function exportar(formato: 'pdf' | 'excel') {
  if (!resumo.value.quantidadePedidos) {
    error.value = 'Não há pedidos para exportar com os filtros atuais.'
    return
  }
  exporting.value = true
  error.value = ''
  try {
    const lista = await pedidosParaExportacao(modoAnalitico.value)
    if (!lista.length) {
      throw new Error('Nenhum pedido encontrado para exportar')
    }
    if (formato === 'pdf') {
      exportPedidosPdf(lista, {
        analitico: modoAnalitico.value,
        filtrosResumo: filtrosResumoTexto(),
      })
    }
    else {
      exportPedidosExcel(lista, { analitico: modoAnalitico.value })
    }
  }
  catch (e) {
    error.value = e instanceof Error ? e.message : 'Erro ao exportar relatório'
  }
  finally {
    exporting.value = false
  }
}
</script>

<template>
  <div>
    <UiPageHeader
      title="Pedidos"
      description="Filtre por escola, número do pedido, status e período. O total reflete os filtros aplicados."
    />

    <div class="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-4">
      <div>
        <label class="label">Buscar por escola</label>
        <UiClienteSearch
          v-model="selectedClienteId"
          :clientes="clientes"
          placeholder="Nome ou CNPJ..."
        />
      </div>
      <div>
        <label class="label">ID do pedido</label>
        <input
          v-model="pedidoIdInput"
          class="input"
          type="text"
          inputmode="numeric"
          placeholder="Ex.: 42"
          @keydown.enter="applyDateAndIdFilters"
        >
      </div>
      <div>
        <label class="label">Data inicial</label>
        <input v-model="inicio" class="input" type="date">
      </div>
      <div>
        <label class="label">Data final</label>
        <input v-model="fim" class="input" type="date">
      </div>
    </div>

    <div class="mb-4 flex flex-wrap gap-2">
      <button type="button" class="btn-primary" @click="applyDateAndIdFilters">
        <Icon name="lucide:search" class="h-4 w-4" />
        Aplicar filtros
      </button>
      <button type="button" class="btn-secondary" @click="clearFilters">
        Limpar
      </button>
    </div>

    <div class="mb-4 flex gap-2 overflow-x-auto">
      <button
        v-for="opt in [
          { value: '', label: 'Todos' },
          { value: 'PENDENTE', label: 'Pendentes' },
          { value: 'CONFIRMADO', label: 'Confirmados' },
          { value: 'ENTREGUE', label: 'Entregues' },
          { value: 'CANCELADO', label: 'Cancelados' },
        ]"
        :key="opt.value"
        type="button"
        class="whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-colors"
        :class="statusFilter === opt.value
          ? 'bg-brand-600 text-white'
          : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'"
        @click="setStatusFilter(opt.value as StatusPedido | '')"
      >
        {{ opt.label }}
      </button>
    </div>

    <div class="mb-4 flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
      <label class="flex items-center gap-2 text-sm text-gray-700">
        <input v-model="modoAnalitico" type="checkbox" class="h-4 w-4">
        <span>
          Relatório <strong>analítico</strong>
          <span class="text-gray-500">(inclui itens de cada pedido na exportação)</span>
        </span>
      </label>
      <div class="flex flex-wrap gap-2">
        <button
          type="button"
          class="btn-primary"
          :disabled="exporting || loading || !pedidos.length"
          @click="exportar('pdf')"
        >
          <Icon name="lucide:file-down" class="h-4 w-4" />
          {{ exporting ? 'Exportando...' : 'Exportar PDF' }}
        </button>
        <button
          type="button"
          class="btn-secondary"
          :disabled="exporting || loading || !pedidos.length"
          @click="exportar('excel')"
        >
          <Icon name="lucide:sheet" class="h-4 w-4" />
          Exportar Excel
        </button>
      </div>
    </div>

    <div class="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div class="card p-4">
        <p class="text-sm text-gray-600">Pedidos no filtro</p>
        <p class="text-2xl font-bold text-gray-900">{{ resumo.quantidadePedidos }}</p>
      </div>
      <div class="card p-4">
        <p class="text-sm text-gray-600">Valor total dos pedidos filtrados</p>
        <p class="text-2xl font-bold text-brand-700">{{ formatCurrency(resumo.valorTotal) }}</p>
      </div>
    </div>

    <UiAlertBanner v-if="error" type="error" :message="error" class="mb-4" />
    <UiLoadingState v-if="loading" />
    <UiEmptyState
      v-else-if="!pedidos.length"
      message="Nenhum pedido encontrado com os filtros atuais."
    />
    <div v-else class="card overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="border-b bg-gray-50">
            <tr>
              <th class="table-th">Nº</th>
              <th class="table-th">Escola</th>
              <th class="table-th">Data</th>
              <th class="table-th">Status</th>
              <th class="table-th">Total</th>
              <th class="table-th">Ações</th>
            </tr>
          </thead>
          <tbody class="divide-y">
            <tr v-for="p in pedidos" :key="p.id" class="hover:bg-gray-50">
              <td class="table-td font-mono font-bold">#{{ p.id }}</td>
              <td class="table-td">{{ p.cliente?.nome }}</td>
              <td class="table-td">{{ formatDate(p.dataCriacao) }}</td>
              <td class="table-td"><PedidosStatusBadge :status="p.status" /></td>
              <td class="table-td font-bold">{{ formatCurrency(p.valorTotal) }}</td>
              <td class="table-td">
                <NuxtLink :to="`/pedidos/${p.id}`" class="font-medium text-brand-600 hover:text-brand-700">
                  Detalhes
                </NuxtLink>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
