<script setup lang="ts">
const auth = useAuth()
const route = useRoute()

interface MenuItem {
  label: string
  path: string
  icon: string
  match?: string
}

const clientMenu: MenuItem[] = [
  { label: 'Início', path: '/', icon: 'lucide:home' },
  { label: 'Fazer Pedido', path: '/pedido/novo', icon: 'lucide:shopping-cart' },
  { label: 'Meus Pedidos', path: '/pedidos', icon: 'lucide:clipboard-list', match: '/pedidos' },
  { label: 'Segurança', path: '/seguranca', icon: 'lucide:shield-check' },
]

const adminMenu: MenuItem[] = [
  { label: 'Início', path: '/', icon: 'lucide:home' },
  { label: 'Administração', path: '/admin', icon: 'lucide:settings', match: '/admin' },
  { label: 'Novo Pedido', path: '/pedido/novo', icon: 'lucide:shopping-cart' },
  { label: 'Pedidos', path: '/admin/pedidos', icon: 'lucide:clipboard-list', match: '/admin/pedidos' },
  { label: 'Empresas', path: '/admin/empresas', icon: 'lucide:building-2', match: '/admin/empresas' },
  { label: 'Clientes', path: '/admin/clientes', icon: 'lucide:users', match: '/admin/clientes' },
  { label: 'Produtos', path: '/admin/produtos', icon: 'lucide:package', match: '/admin/produtos' },
  { label: 'Unidades', path: '/admin/unidades', icon: 'lucide:ruler', match: '/admin/unidades' },
  { label: 'Estantes', path: '/admin/estantes', icon: 'lucide:layout-grid', match: '/admin/estantes' },
  { label: 'Usuários', path: '/admin/usuarios', icon: 'lucide:user-cog', match: '/admin/usuarios' },
  { label: 'Relatórios', path: '/admin/relatorios', icon: 'lucide:bar-chart-3', match: '/admin/relatorios' },
  { label: 'Auditoria', path: '/admin/auditoria', icon: 'lucide:scroll-text', match: '/admin/auditoria' },
  { label: 'Segurança', path: '/seguranca', icon: 'lucide:shield-check' },
]

const menuItems = computed(() => (auth.isAdmin.value ? adminMenu : clientMenu))

function isActive(item: MenuItem) {
  if (item.path === '/admin') {
    return route.path === '/admin'
  }
  if (item.match) {
    return route.path === item.match || route.path.startsWith(`${item.match}/`)
  }
  return route.path === item.path
}
</script>

<template>
  <aside class="flex w-72 flex-col border-r border-gray-200 bg-white">
    <div class="border-b border-gray-200 p-6">
      <div class="flex items-center gap-3">
        <div class="flex h-12 w-12 items-center justify-center rounded-lg bg-brand-600">
          <Icon name="lucide:package" class="h-7 w-7 text-white" />
        </div>
        <div>
          <h1 class="text-xl font-bold text-gray-900">Sistema de Pedidos</h1>
          <p class="text-sm text-gray-500">
            {{ auth.isAdmin.value ? 'Administrador' : 'Cliente' }}
          </p>
        </div>
      </div>
    </div>

    <nav class="flex-1 p-4">
      <ul class="space-y-2">
        <li v-for="item in menuItems" :key="item.path">
          <NuxtLink
            :to="item.path"
            class="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left transition-all duration-200"
            :class="isActive(item)
              ? 'bg-brand-600 text-white shadow-md'
              : 'text-gray-700 hover:bg-gray-100'"
          >
            <Icon :name="item.icon" class="h-5 w-5" />
            <span class="font-medium">{{ item.label }}</span>
          </NuxtLink>
        </li>
      </ul>
    </nav>

    <div class="border-t border-gray-200 p-4">
      <div class="rounded-lg bg-gray-50 p-4">
        <p class="mb-1 text-sm font-medium text-gray-900">
          {{ auth.user.value?.nome }}
        </p>
        <p class="mb-3 truncate text-xs text-gray-500">
          {{ auth.user.value?.email }}
        </p>
        <button class="btn-secondary w-full" type="button" @click="auth.logout()">
          <Icon name="lucide:log-out" class="h-4 w-4" />
          Sair
        </button>
      </div>
    </div>
  </aside>
</template>
