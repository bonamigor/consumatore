<script setup lang="ts">
import type { PageResponse, Pedido, StatusPedido } from '~/types/api'
import { formatCurrency, formatDate } from '~/utils/format'

definePageMeta({ middleware: 'auth' })

const auth = useAuthStore()
const pedidoService = usePedidoService()
const route = useRoute()

const loading = ref(true)
const error = ref('')
const pedidos = ref<Pedido[]>([])

const validStatus = new Set(['PENDENTE', 'CONFIRMADO', 'CANCELADO', 'ENTREGUE'])
const statusFromQuery = computed(() => {
  const s = typeof route.query.status === 'string' ? route.query.status : ''
  return validStatus.has(s) ? (s as StatusPedido) : ''
})
const statusFilter = ref<StatusPedido | ''>(statusFromQuery.value)

watch(statusFromQuery, (value) => {
  statusFilter.value = value
})

async function setStatusFilter(value: StatusPedido | '') {
  statusFilter.value = value
  await navigateTo({
    path: '/pedidos',
    query: value ? { status: value } : {},
  })
}

const counts = computed(() => ({
  pendentes: pedidos.value.filter(p => p.status === 'PENDENTE').length,
  confirmados: pedidos.value.filter(p => p.status === 'CONFIRMADO').length,
  entregues: pedidos.value.filter(p => p.status === 'ENTREGUE').length,
  total: pedidos.value.length,
}))

const filtered = computed(() => {
  if (!statusFilter.value) return pedidos.value
  return pedidos.value.filter(p => p.status === statusFilter.value)
})

async function load() {
  loading.value = true
  error.value = ''
  try {
    let page: PageResponse<Pedido>
    if (auth.isAdmin) {
      page = await pedidoService.listar({
        size: 100,
        sort: 'dataCriacao,desc',
        ...(statusFilter.value ? { status: statusFilter.value } : {}),
      })
    }
    else if (auth.session?.clienteId) {
      page = await pedidoService.listarPorCliente(auth.session.clienteId, {
        size: 100,
        sort: 'dataCriacao,desc',
      })
    }
    else {
      pedidos.value = []
      return
    }
    pedidos.value = page.content || []
  }
  catch (e) {
    error.value = e instanceof Error ? e.message : 'Erro ao carregar pedidos'
  }
  finally {
    loading.value = false
  }
}

watch(statusFilter, () => {
  if (auth.isAdmin) load()
})

onMounted(load)
</script>

<template>
  <div>
    <UiPageHeader
      title="Meus Pedidos"
      description="Acompanhe o status de todos os seus pedidos"
    >
      <template #actions>
        <NuxtLink v-if="!auth.isAdmin" to="/pedido/novo" class="btn-primary">
          <Icon name="lucide:plus" class="h-4 w-4" />
          Novo Pedido
        </NuxtLink>
      </template>
    </UiPageHeader>

    <UiAlertBanner v-if="error" type="error" :message="error" class="mb-4" />

    <div class="mb-8 grid grid-cols-1 gap-4 md:grid-cols-4">
      <UiStatCard
        label="Pendentes"
        :value="counts.pendentes"
        icon="lucide:clock"
        color="yellow"
        to="/pedidos?status=PENDENTE"
      />
      <UiStatCard
        label="Confirmados"
        :value="counts.confirmados"
        icon="lucide:package"
        color="blue"
        to="/pedidos?status=CONFIRMADO"
      />
      <UiStatCard
        label="Entregues"
        :value="counts.entregues"
        icon="lucide:check-circle"
        color="green"
        to="/pedidos?status=ENTREGUE"
      />
      <UiStatCard
        label="Total"
        :value="counts.total"
        icon="lucide:clipboard-list"
        color="gray"
        to="/pedidos"
      />
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

    <UiLoadingState v-if="loading" />

    <UiEmptyState v-else-if="!filtered.length" message="Nenhum pedido encontrado." />

    <div v-else class="card overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="border-b border-gray-200 bg-gray-50">
            <tr>
              <th class="table-th">Nº Pedido</th>
              <th v-if="auth.isAdmin" class="table-th">Escola</th>
              <th class="table-th">Data</th>
              <th class="table-th">Status</th>
              <th class="table-th">Itens</th>
              <th class="table-th">Total</th>
              <th class="table-th">Ações</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
            <tr v-for="order in filtered" :key="order.id" class="hover:bg-gray-50">
              <td class="table-td font-mono font-bold text-gray-900">#{{ order.id }}</td>
              <td v-if="auth.isAdmin" class="table-td">{{ order.cliente?.nome }}</td>
              <td class="table-td">{{ formatDate(order.dataCriacao) }}</td>
              <td class="table-td">
                <PedidosStatusBadge :status="order.status" />
              </td>
              <td class="table-td">{{ order.itens?.length || 0 }} itens</td>
              <td class="table-td font-bold text-gray-900">{{ formatCurrency(order.valorTotal) }}</td>
              <td class="table-td">
                <NuxtLink :to="`/pedidos/${order.id}`" class="btn-primary py-2">
                  <Icon name="lucide:eye" class="h-4 w-4" />
                  Ver Detalhes
                </NuxtLink>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
