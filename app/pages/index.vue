<script setup lang="ts">
import type { Pedido } from '~/types/api'

definePageMeta({ middleware: 'auth' })

const auth = useAuthStore()
const pedidoService = usePedidoService()
const clienteService = useClienteService()
const produtoService = useProdutoService()
const estanteService = useEstanteService()

const loading = ref(true)
const error = ref('')
const pedidos = ref<Pedido[]>([])
/** Admin: pedidos pendentes mais antigos primeiro (os que esperam há mais tempo). */
const aguardando = ref<Pedido[]>([])
const stats = reactive({
  pendentes: 0,
  confirmados: 0,
  entregues: 0,
  total: 0,
  clientes: 0,
  produtos: 0,
  estantes: 0,
})

onMounted(async () => {
  try {
    if (auth.isAdmin) {
      const [pendentesPage, resumoPendentes, clientes, produtos] = await Promise.all([
        pedidoService.listar({ status: 'PENDENTE', size: 8, sort: 'dataCriacao,asc' }),
        pedidoService.resumirFiltros({ status: 'PENDENTE' }),
        clienteService.listar(),
        produtoService.listar(),
      ])
      aguardando.value = pendentesPage.content || []
      stats.pendentes = resumoPendentes.quantidadePedidos
      stats.clientes = clientes.length
      stats.produtos = produtos.filter(p => p.ativo).length
      const paginasEditais = await Promise.all(
        clientes.map(c => estanteService.listarPorCliente(c.id, { size: 1 })),
      )
      stats.estantes = paginasEditais.reduce((soma, pagina) => soma + totalDaPagina(pagina), 0)
    }
    else if (auth.session?.clienteId) {
      const page = await pedidoService.listarPorCliente(auth.session.clienteId, {
        size: 100,
        sort: 'dataCriacao,desc',
      })
      pedidos.value = page.content || []
      stats.pendentes = pedidos.value.filter(p => p.status === 'PENDENTE').length
      stats.confirmados = pedidos.value.filter(p => p.status === 'CONFIRMADO').length
      stats.entregues = pedidos.value.filter(p => p.status === 'ENTREGUE').length
      stats.total = pedidos.value.length
    }
  }
  catch (e) {
    error.value = e instanceof Error ? e.message : 'Erro ao carregar painel'
  }
  finally {
    loading.value = false
  }
})
</script>

<template>
  <div>
    <UiLoadingState v-if="loading" />

    <template v-else>
      <UiAlertBanner v-if="error" type="error" :message="error" class="mb-6" />

      <!-- Admin dashboard -->
      <template v-if="auth.isAdmin">
        <UiPageHeader
          title="Início"
          :description="`Olá, ${auth.session?.nome}. Este é o resumo da operação.`"
        />

        <div class="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <UiStatCard
            label="Pedidos pendentes"
            :value="stats.pendentes"
            icon="lucide:clock"
            color="blue"
            to="/admin/pedidos?status=PENDENTE"
          />
          <UiStatCard label="Produtos ativos" :value="stats.produtos" icon="lucide:package" color="green" />
          <UiStatCard label="Escolas" :value="stats.clientes" icon="lucide:school" color="purple" />
          <UiStatCard label="Editais" :value="stats.estantes" icon="lucide:file-text" color="orange" />
        </div>

        <div class="card overflow-hidden">
          <div class="flex items-center justify-between border-b border-gray-200 px-5 py-3">
            <div>
              <h3 class="font-semibold text-gray-900">Pedidos aguardando confirmação</h3>
              <p class="text-xs text-gray-500">Os mais antigos primeiro</p>
            </div>
            <NuxtLink v-if="stats.pendentes" to="/admin/pedidos?status=PENDENTE" class="text-sm font-medium text-brand-600 hover:text-brand-700">
              Ver todos ({{ stats.pendentes }})
            </NuxtLink>
          </div>
          <p v-if="!aguardando.length" class="flex items-center gap-2 px-5 py-6 text-sm text-gray-500">
            <Icon name="lucide:check-circle-2" class="h-5 w-5 text-green-600" />
            Nenhum pedido aguardando confirmação.
          </p>
          <table v-else class="w-full text-sm">
            <thead class="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th class="px-5 py-2 text-left font-medium">Pedido</th>
                <th class="px-3 py-2 text-left font-medium">Escola</th>
                <th class="px-3 py-2 text-left font-medium">Recebido em</th>
                <th class="px-3 py-2 text-right font-medium">Itens</th>
                <th class="px-5 py-2 text-right font-medium">Total</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr
                v-for="p in aguardando"
                :key="p.id"
                class="cursor-pointer hover:bg-gray-50"
                @click="navigateTo(`/pedidos/${p.id}`)"
              >
                <td class="px-5 py-2.5 font-medium text-brand-700">
                  <NuxtLink :to="`/pedidos/${p.id}`">#{{ p.id }}</NuxtLink>
                </td>
                <td class="px-3 py-2.5 text-gray-900">{{ p.cliente?.nome }}</td>
                <td class="px-3 py-2.5 text-gray-600">{{ formatDateTime(p.dataCriacao) }}</td>
                <td class="px-3 py-2.5 text-right tabular-nums text-gray-600">{{ p.itens?.length ?? 0 }}</td>
                <td class="px-5 py-2.5 text-right tabular-nums font-medium text-gray-900">{{ formatCurrency(p.valorTotal) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>

      <!-- Client dashboard -->
      <template v-else>
        <UiPageHeader
          title="Bem-vindo ao Sistema de Pedidos"
          :description="`Olá, ${auth.session?.nome}. O que você gostaria de fazer hoje?`"
        />

        <div class="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2">
          <NuxtLink
            to="/pedido/novo"
            class="group rounded-2xl bg-gradient-to-br from-brand-600 to-brand-700 p-8 text-left transition-all hover:scale-[1.02] hover:shadow-2xl"
          >
            <div class="mb-6 flex items-start justify-between">
              <div class="flex h-16 w-16 items-center justify-center rounded-xl bg-white/20 transition-colors group-hover:bg-white/30">
                <Icon name="lucide:shopping-cart" class="h-8 w-8 text-white" />
              </div>
              <div class="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
                <Icon name="lucide:arrow-right" class="h-4 w-4 text-white" />
              </div>
            </div>
            <h3 class="mb-2 text-2xl font-bold text-white">Fazer um Novo Pedido</h3>
            <p class="text-blue-100">Navegue pelo catálogo de produtos e crie seu pedido</p>
          </NuxtLink>

          <NuxtLink
            to="/pedidos"
            class="group rounded-2xl bg-gradient-to-br from-green-600 to-green-700 p-8 text-left transition-all hover:scale-[1.02] hover:shadow-2xl"
          >
            <div class="mb-6 flex items-start justify-between">
              <div class="flex h-16 w-16 items-center justify-center rounded-xl bg-white/20 transition-colors group-hover:bg-white/30">
                <Icon name="lucide:clipboard-list" class="h-8 w-8 text-white" />
              </div>
              <div class="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
                <Icon name="lucide:arrow-right" class="h-4 w-4 text-white" />
              </div>
            </div>
            <h3 class="mb-2 text-2xl font-bold text-white">Ver Meus Pedidos</h3>
            <p class="text-green-100">Acompanhe o status dos seus pedidos anteriores</p>
          </NuxtLink>
        </div>

        <div class="card p-6">
          <h3 class="mb-4 text-xl font-bold text-gray-900">Resumo Rápido</h3>
          <div class="grid grid-cols-1 gap-6 md:grid-cols-3">
            <NuxtLink
              to="/pedidos?status=PENDENTE"
              class="flex items-center gap-4 rounded-lg p-2 -m-2 transition-colors hover:bg-blue-50"
            >
              <div class="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                <Icon name="lucide:shopping-cart" class="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p class="text-2xl font-bold text-gray-900">{{ stats.pendentes }}</p>
                <p class="text-sm text-gray-600">Pedidos Pendentes →</p>
              </div>
            </NuxtLink>
            <NuxtLink
              to="/pedidos?status=ENTREGUE"
              class="flex items-center gap-4 rounded-lg p-2 -m-2 transition-colors hover:bg-green-50"
            >
              <div class="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
                <Icon name="lucide:package" class="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p class="text-2xl font-bold text-gray-900">{{ stats.entregues }}</p>
                <p class="text-sm text-gray-600">Pedidos Entregues →</p>
              </div>
            </NuxtLink>
            <NuxtLink
              to="/pedidos"
              class="flex items-center gap-4 rounded-lg p-2 -m-2 transition-colors hover:bg-orange-50"
            >
              <div class="flex h-12 w-12 items-center justify-center rounded-lg bg-orange-100">
                <Icon name="lucide:clipboard-list" class="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p class="text-2xl font-bold text-gray-900">{{ stats.total }}</p>
                <p class="text-sm text-gray-600">Total de Pedidos →</p>
              </div>
            </NuxtLink>
          </div>
        </div>
      </template>
    </template>
  </div>
</template>
