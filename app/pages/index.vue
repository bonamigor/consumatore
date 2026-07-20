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
      const [pedidosPage, clientes, produtos] = await Promise.all([
        pedidoService.listar({ size: 50, sort: 'dataCriacao,desc' }),
        clienteService.listar(),
        produtoService.listar(),
      ])
      pedidos.value = pedidosPage.content || []
      stats.clientes = clientes.length
      stats.produtos = produtos.filter(p => p.ativo).length
      // Count estantes across first few clients (lightweight)
      let estanteCount = 0
      for (const c of clientes.slice(0, 10)) {
        const page = await estanteService.listarPorCliente(c.id, { size: 1 })
        estanteCount += page.totalElements || 0
      }
      stats.estantes = estanteCount
    }
    else if (auth.session?.clienteId) {
      const page = await pedidoService.listarPorCliente(auth.session.clienteId, {
        size: 100,
        sort: 'dataCriacao,desc',
      })
      pedidos.value = page.content || []
    }

    stats.pendentes = pedidos.value.filter(p => p.status === 'PENDENTE').length
    stats.confirmados = pedidos.value.filter(p => p.status === 'CONFIRMADO').length
    stats.entregues = pedidos.value.filter(p => p.status === 'ENTREGUE').length
    stats.total = pedidos.value.length
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
          title="Painel Administrativo"
          description="Gerencie todos os aspectos do sistema de pedidos"
        />

        <div class="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <UiStatCard
            label="Pedidos Pendentes"
            :value="stats.pendentes"
            icon="lucide:shopping-cart"
            color="blue"
            to="/admin/pedidos?status=PENDENTE"
          />
          <UiStatCard label="Produtos Ativos" :value="stats.produtos" icon="lucide:package" color="green" />
          <UiStatCard label="Clientes Cadastrados" :value="stats.clientes" icon="lucide:users" color="purple" />
          <UiStatCard label="Estantes" :value="stats.estantes" icon="lucide:layout-grid" color="orange" />
        </div>

        <h3 class="mb-4 text-xl font-bold text-gray-900">Ações Rápidas</h3>
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <NuxtLink
            v-for="action in [
              { to: '/admin/clientes', title: 'Gerenciar Clientes', desc: 'Adicionar, editar ou remover clientes', icon: 'lucide:users', color: 'blue' },
              { to: '/admin/produtos', title: 'Gerenciar Produtos', desc: 'Cadastrar e organizar produtos', icon: 'lucide:package', color: 'green' },
              { to: '/admin/estantes', title: 'Gerenciar Estantes', desc: 'Organizar produtos em estantes', icon: 'lucide:layout-grid', color: 'orange' },
              { to: '/admin/usuarios', title: 'Gerenciar Usuários', desc: 'Controlar acessos e permissões', icon: 'lucide:settings', color: 'purple' },
            ]"
            :key="action.to"
            :to="action.to"
            class="card group p-6 text-left transition-all hover:border-brand-300 hover:shadow-md"
          >
            <div class="flex items-center gap-4">
              <div
                class="flex h-16 w-16 items-center justify-center rounded-lg transition-colors"
                :class="{
                  'bg-blue-100 group-hover:bg-blue-600': action.color === 'blue',
                  'bg-green-100 group-hover:bg-green-600': action.color === 'green',
                  'bg-orange-100 group-hover:bg-orange-600': action.color === 'orange',
                  'bg-purple-100 group-hover:bg-purple-600': action.color === 'purple',
                }"
              >
                <Icon
                  :name="action.icon"
                  class="h-8 w-8 transition-colors group-hover:text-white"
                  :class="{
                    'text-blue-600': action.color === 'blue',
                    'text-green-600': action.color === 'green',
                    'text-orange-600': action.color === 'orange',
                    'text-purple-600': action.color === 'purple',
                  }"
                />
              </div>
              <div>
                <h4 class="mb-1 text-lg font-bold text-gray-900">{{ action.title }}</h4>
                <p class="text-sm text-gray-600">{{ action.desc }}</p>
              </div>
            </div>
          </NuxtLink>
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
