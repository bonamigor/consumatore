<script setup lang="ts">
const auth = useAuth()
const authStore = useAuthStore()
const pedidoService = usePedidoService()
const route = useRoute()

interface ItemMenu {
  label: string
  path: string
  icon: string
  /** Prefixos de rota que também destacam o item (ex.: detalhe de um pedido). */
  match?: string[]
  badge?: 'pendentes' | 'mfa'
}

interface SecaoMenu {
  titulo?: string
  itens: ItemMenu[]
}

const contaSecao: SecaoMenu = {
  titulo: 'Minha conta',
  itens: [{ label: 'Segurança', path: '/seguranca', icon: 'lucide:shield-check', badge: 'mfa' }],
}

const menuAdmin: SecaoMenu[] = [
  { itens: [{ label: 'Início', path: '/', icon: 'lucide:home' }] },
  {
    titulo: 'Pedidos',
    itens: [
      { label: 'Novo pedido', path: '/pedido/novo', icon: 'lucide:plus-circle' },
      { label: 'Pedidos', path: '/admin/pedidos', icon: 'lucide:clipboard-list', match: ['/admin/pedidos', '/pedidos'], badge: 'pendentes' },
    ],
  },
  {
    titulo: 'Cadastros',
    itens: [
      { label: 'Escolas', path: '/admin/clientes', icon: 'lucide:school' },
      { label: 'Editais', path: '/admin/estantes', icon: 'lucide:file-text' },
      { label: 'Produtos', path: '/admin/produtos', icon: 'lucide:package' },
      { label: 'Unidades de medida', path: '/admin/unidades', icon: 'lucide:ruler' },
      { label: 'Empresas', path: '/admin/empresas', icon: 'lucide:building-2' },
    ],
  },
  {
    titulo: 'Gestão',
    itens: [
      { label: 'Relatórios', path: '/admin/relatorios', icon: 'lucide:bar-chart-3' },
      { label: 'Usuários', path: '/admin/usuarios', icon: 'lucide:user-cog' },
      { label: 'Auditoria', path: '/admin/auditoria', icon: 'lucide:scroll-text' },
    ],
  },
  contaSecao,
]

const menuEscola: SecaoMenu[] = [
  { itens: [{ label: 'Início', path: '/', icon: 'lucide:home' }] },
  {
    titulo: 'Pedidos',
    itens: [
      { label: 'Novo pedido', path: '/pedido/novo', icon: 'lucide:plus-circle' },
      { label: 'Meus pedidos', path: '/pedidos', icon: 'lucide:clipboard-list', match: ['/pedidos'] },
    ],
  },
  contaSecao,
]

const secoes = computed(() => (auth.isAdmin.value ? menuAdmin : menuEscola))

function ativo(item: ItemMenu) {
  if (item.path === '/') return route.path === '/'
  const prefixos = item.match ?? [item.path]
  return prefixos.some(p => route.path === p || route.path.startsWith(`${p}/`))
}

const iniciais = computed(() =>
  (auth.user.value?.nome ?? '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(parte => parte[0]?.toUpperCase())
    .join(''),
)

const mfaPendente = computed(() => !authStore.session?.doisFatoresAtivo)

// Pedidos aguardando confirmação: atualizado a cada navegação (só administradores)
const pendentes = ref(0)
async function atualizarPendentes() {
  if (!auth.isAdmin.value) return
  try {
    pendentes.value = (await pedidoService.resumirFiltros({ status: 'PENDENTE' })).quantidadePedidos
  }
  catch {
    // O contador é só um atalho visual; falhas não devem atrapalhar a navegação
  }
}
onMounted(atualizarPendentes)
watch(() => route.path, atualizarPendentes)
</script>

<template>
  <aside class="flex h-full w-64 flex-col border-r border-gray-200 bg-white">
    <div class="flex items-center gap-3 border-b border-gray-200 px-5 py-4">
      <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600">
        <Icon name="lucide:package" class="h-5 w-5 text-white" />
      </div>
      <span class="text-base font-bold text-gray-900">Sistema de Pedidos</span>
    </div>

    <nav class="flex-1 overflow-y-auto px-3 py-3" aria-label="Menu principal">
      <div v-for="(secao, i) in secoes" :key="secao.titulo ?? i" :class="i > 0 ? 'mt-4' : ''">
        <p
          v-if="secao.titulo"
          class="mb-1 px-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400"
        >
          {{ secao.titulo }}
        </p>
        <ul class="space-y-0.5">
          <li v-for="item in secao.itens" :key="item.path">
            <NuxtLink
              :to="item.path"
              class="flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors"
              :class="ativo(item)
                ? 'bg-brand-50 font-medium text-brand-700'
                : 'text-gray-700 hover:bg-gray-100'"
              :aria-current="ativo(item) ? 'page' : undefined"
            >
              <Icon :name="item.icon" class="h-[18px] w-[18px] shrink-0" :class="ativo(item) ? 'text-brand-600' : 'text-gray-400'" />
              <span class="flex-1">{{ item.label }}</span>
              <span
                v-if="item.badge === 'pendentes' && pendentes > 0"
                class="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800"
                :title="`${pendentes} pedido(s) aguardando confirmação`"
              >
                {{ pendentes }}
              </span>
              <span
                v-if="item.badge === 'mfa' && mfaPendente"
                class="h-2 w-2 rounded-full bg-amber-500"
                title="Verificação em duas etapas desativada"
              />
            </NuxtLink>
          </li>
        </ul>
      </div>
    </nav>

    <div class="flex items-center gap-3 border-t border-gray-200 px-4 py-3">
      <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">
        {{ iniciais }}
      </div>
      <div class="min-w-0 flex-1">
        <p class="truncate text-sm font-medium text-gray-900">{{ auth.user.value?.nome }}</p>
        <p class="truncate text-xs text-gray-500">{{ auth.isAdmin.value ? 'Administrador' : 'Escola' }}</p>
      </div>
      <NuxtLink
        to="/seguranca"
        class="btn-ghost relative p-2"
        title="Minha conta e segurança"
        aria-label="Minha conta e segurança"
      >
        <Icon name="lucide:shield-check" class="h-4 w-4" />
        <span v-if="mfaPendente" class="absolute right-1 top-1 h-2 w-2 rounded-full bg-amber-500" />
      </NuxtLink>
      <button type="button" class="btn-ghost p-2" title="Sair" aria-label="Sair" @click="auth.logout()">
        <Icon name="lucide:log-out" class="h-4 w-4" />
      </button>
    </div>
  </aside>
</template>
