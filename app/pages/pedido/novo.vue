<script setup lang="ts">
import type { Cliente, Estante, EstanteProduto } from '~/types/api'
import { formatCurrency } from '~/utils/format'

definePageMeta({ middleware: 'auth' })

const auth = useAuthStore()
const clienteService = useClienteService()
const estanteService = useEstanteService()
const estanteProdutoService = useEstanteProdutoService()
const pedidoService = usePedidoService()
const cart = useCartStore()
const route = useRoute()

const loading = ref(true)
const submitting = ref(false)
const error = ref('')
const success = ref('')
const clientes = ref<Cliente[]>([])
const selectedClienteId = ref<number | null>(
  Number(route.query.clienteId) || auth.session?.clienteId || null,
)
const estantes = ref<Estante[]>([])
const selectedEstanteId = ref<number | null>(null)
const produtos = ref<EstanteProduto[]>([])
const searchTerm = ref('')
const viewMode = ref<'grid' | 'list'>('list')
const showCart = ref(false)
const ready = ref(false)

const filteredProdutos = computed(() => {
  const term = searchTerm.value.toLowerCase().trim()
  if (!term) return produtos.value
  return produtos.value.filter(p => p.produtoNome.toLowerCase().includes(term))
})

async function loadEstantes() {
  if (auth.isAdmin && !clientes.value.length) {
    clientes.value = await clienteService.listar()
    if (!selectedClienteId.value && clientes.value.length) {
      selectedClienteId.value = clientes.value[0].id
    }
  }

  if (!selectedClienteId.value) {
    error.value = auth.isAdmin
      ? 'Selecione um cliente para montar o pedido.'
      : 'Usuário sem cliente vinculado. Contate o administrador.'
    estantes.value = []
    return
  }

  const page = await estanteService.listarPorCliente(selectedClienteId.value, {
    size: 50,
    sort: 'periodo,desc',
  })
  estantes.value = (page.content || []).filter(e => e.ativa !== false)
  selectedEstanteId.value = estantes.value[0]?.id ?? null
}

async function loadProdutos() {
  if (!selectedEstanteId.value) {
    produtos.value = []
    return
  }
  produtos.value = await estanteProdutoService.listarDisponiveis(selectedEstanteId.value)
}

watch(selectedClienteId, async () => {
  if (!ready.value) return
  cart.clear()
  try {
    error.value = ''
    await loadEstantes()
    await loadProdutos()
  }
  catch (e) {
    error.value = e instanceof Error ? e.message : 'Erro ao carregar estantes'
  }
})

watch(selectedEstanteId, async () => {
  if (!ready.value) return
  try {
    await loadProdutos()
  }
  catch (e) {
    error.value = e instanceof Error ? e.message : 'Erro ao carregar produtos'
  }
})

onMounted(async () => {
  try {
    await loadEstantes()
    await loadProdutos()
  }
  catch (e) {
    error.value = e instanceof Error ? e.message : 'Erro ao carregar catálogo'
  }
  finally {
    loading.value = false
    ready.value = true
  }
})

function addProduct(p: EstanteProduto) {
  cart.addItem({
    produtoId: p.produtoId,
    estanteId: p.estanteId,
    produtoNome: p.produtoNome,
    precoVenda: Number(p.precoVenda),
    quantidadeDisponivel: Number(p.quantidade),
  })
}

async function submitOrder() {
  const clienteId = selectedClienteId.value
  if (!clienteId) {
    error.value = 'Cliente não identificado'
    return
  }
  if (!cart.items.length) {
    error.value = 'Adicione produtos ao carrinho'
    return
  }

  submitting.value = true
  error.value = ''
  success.value = ''
  try {
    const pedido = await pedidoService.criar({
      clienteId,
      observacao: cart.observacao || null,
      itens: cart.items.map(i => ({
        produtoId: i.produtoId,
        estanteId: i.estanteId,
        quantidade: i.quantidade,
      })),
    })
    cart.clear()
    showCart.value = false
    success.value = `Pedido #${pedido.id} criado com sucesso!`
    await navigateTo(`/pedidos/${pedido.id}`)
  }
  catch (e) {
    error.value = e instanceof Error ? e.message : 'Erro ao criar pedido'
  }
  finally {
    submitting.value = false
  }
}
</script>

<template>
  <div>
    <UiPageHeader
      title="Catálogo de Produtos"
      description="Selecione os produtos para seu pedido"
    >
      <template #actions>
        <button class="btn-primary relative" type="button" @click="showCart = true">
          <Icon name="lucide:shopping-cart" class="h-5 w-5" />
          Carrinho
          <span
            v-if="cart.totalItems"
            class="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-red-500 text-sm font-bold text-white"
          >
            {{ cart.totalItems }}
          </span>
        </button>
      </template>
    </UiPageHeader>

    <UiAlertBanner v-if="error" type="error" :message="error" class="mb-4" />
    <UiAlertBanner v-if="success" type="success" :message="success" class="mb-4" />

    <UiLoadingState v-if="loading" />

    <template v-else>
      <div class="mb-6 flex flex-col gap-4 md:flex-row">
        <div v-if="auth.isAdmin" class="md:w-72">
          <label class="label">Cliente</label>
          <select v-model="selectedClienteId" class="input">
            <option v-for="c in clientes" :key="c.id" :value="c.id">{{ c.nome }}</option>
          </select>
        </div>
        <div class="md:w-64">
          <label class="label">Estante / Período</label>
          <select v-model="selectedEstanteId" class="input">
            <option v-for="e in estantes" :key="e.id" :value="e.id">
              {{ e.periodo }} — {{ e.clienteNome || 'Cliente' }}
              ({{ e.quantidadeProdutos || 0 }} itens)
            </option>
          </select>
        </div>
        <div class="relative flex-1">
          <label class="label">Buscar</label>
          <div class="relative">
            <Icon name="lucide:search" class="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              v-model="searchTerm"
              class="input pl-10"
              type="search"
              placeholder="Buscar produtos..."
            >
          </div>
        </div>
        <div class="flex items-end gap-2">
          <button
            type="button"
            class="rounded-lg border px-4 py-3 transition-colors"
            :class="viewMode === 'grid' ? 'border-brand-600 bg-brand-600 text-white' : 'border-gray-300 bg-white text-gray-700'"
            @click="viewMode = 'grid'"
          >
            <Icon name="lucide:layout-grid" class="h-5 w-5" />
          </button>
          <button
            type="button"
            class="rounded-lg border px-4 py-3 transition-colors"
            :class="viewMode === 'list' ? 'border-brand-600 bg-brand-600 text-white' : 'border-gray-300 bg-white text-gray-700'"
            @click="viewMode = 'list'"
          >
            <Icon name="lucide:list" class="h-5 w-5" />
          </button>
        </div>
      </div>

      <UiEmptyState
        v-if="!estantes.length"
        message="Nenhuma estante ativa encontrada para este cliente."
      />

      <UiEmptyState
        v-else-if="!filteredProdutos.length"
        message="Nenhum produto disponível nesta estante."
      />

      <div
        v-else
        :class="viewMode === 'grid'
          ? 'grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
          : 'space-y-4'"
      >
        <div
          v-for="product in filteredProdutos"
          :key="`${product.estanteId}-${product.produtoId}`"
          class="card overflow-hidden transition-shadow hover:shadow-lg"
          :class="viewMode === 'list' ? 'p-6' : ''"
        >
          <template v-if="viewMode === 'grid'">
            <div class="flex aspect-square items-center justify-center bg-gray-100">
              <Icon name="lucide:package" class="h-16 w-16 text-gray-300" />
            </div>
            <div class="p-4">
              <h3 class="mb-1 text-lg font-bold text-gray-900">{{ product.produtoNome }}</h3>
              <p class="mb-1 text-sm font-semibold text-brand-600">{{ formatCurrency(product.precoVenda) }}</p>
              <p class="mb-4 text-xs text-gray-500">Estoque: {{ product.quantidade }}</p>

              <div v-if="cart.getQuantity(product.produtoId, product.estanteId) > 0" class="flex items-center justify-between gap-2">
                <button
                  type="button"
                  class="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-200 hover:bg-gray-300"
                  @click="cart.updateQuantity(product.produtoId, product.estanteId, -1)"
                >
                  <Icon name="lucide:minus" class="h-5 w-5" />
                </button>
                <span class="text-lg font-bold">{{ cart.getQuantity(product.produtoId, product.estanteId) }}</span>
                <button
                  type="button"
                  class="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-600 text-white hover:bg-brand-700"
                  @click="cart.updateQuantity(product.produtoId, product.estanteId, 1)"
                >
                  <Icon name="lucide:plus" class="h-5 w-5" />
                </button>
              </div>
              <button
                v-else
                type="button"
                class="btn-primary w-full"
                @click="addProduct(product)"
              >
                <Icon name="lucide:plus" class="h-5 w-5" />
                Adicionar
              </button>
            </div>
          </template>

          <template v-else>
            <div class="flex items-center justify-between gap-4">
              <div class="flex items-center gap-4">
                <div>
                  <h3 class="text-lg font-bold text-gray-900">{{ product.produtoNome }}</h3>
                  <p class="text-sm font-semibold text-brand-600">{{ formatCurrency(product.precoVenda) }}</p>
                  <p class="text-xs text-gray-500">Estoque: {{ product.quantidade }}</p>
                </div>
              </div>
              <div v-if="cart.getQuantity(product.produtoId, product.estanteId) > 0" class="flex items-center gap-2">
                <button
                  type="button"
                  class="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-200"
                  @click="cart.updateQuantity(product.produtoId, product.estanteId, -1)"
                >
                  <Icon name="lucide:minus" class="h-5 w-5" />
                </button>
                <span class="w-10 text-center font-bold">{{ cart.getQuantity(product.produtoId, product.estanteId) }}</span>
                <button
                  type="button"
                  class="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-600 text-white"
                  @click="cart.updateQuantity(product.produtoId, product.estanteId, 1)"
                >
                  <Icon name="lucide:plus" class="h-5 w-5" />
                </button>
              </div>
              <button
                v-else
                type="button"
                class="btn-primary"
                @click="addProduct(product)"
              >
                <Icon name="lucide:plus" class="h-5 w-5" />
                Adicionar
              </button>
            </div>
          </template>
        </div>
      </div>
    </template>

    <!-- Cart drawer -->
    <Teleport to="body">
      <div
        v-if="showCart"
        class="fixed inset-0 z-50 flex justify-end bg-black/50"
        @click.self="showCart = false"
      >
        <div class="h-full w-full max-w-md overflow-y-auto bg-white p-6 shadow-2xl" @click.stop>
          <div class="mb-6 flex items-center justify-between">
            <h3 class="text-2xl font-bold text-gray-900">Seu Carrinho</h3>
            <button type="button" class="btn-ghost p-2" @click="showCart = false">
              <Icon name="lucide:x" class="h-5 w-5" />
            </button>
          </div>

          <div v-if="!cart.items.length" class="py-12 text-center">
            <Icon name="lucide:shopping-cart" class="mx-auto mb-4 h-16 w-16 text-gray-300" />
            <p class="text-gray-500">Seu carrinho está vazio</p>
          </div>

          <template v-else>
            <div class="mb-6 space-y-4">
              <div
                v-for="item in cart.items"
                :key="`${item.estanteId}-${item.produtoId}`"
                class="flex items-center gap-4 rounded-lg bg-gray-50 p-4"
              >
                <div class="flex-1">
                  <h4 class="font-medium text-gray-900">{{ item.produtoNome }}</h4>
                  <p class="text-sm text-gray-600">
                    {{ item.quantidade }} × {{ formatCurrency(item.precoVenda) }}
                  </p>
                </div>
                <button
                  type="button"
                  class="text-red-600 hover:text-red-700"
                  @click="cart.removeItem(item.produtoId, item.estanteId)"
                >
                  <Icon name="lucide:x" class="h-5 w-5" />
                </button>
              </div>
            </div>

            <div class="mb-4">
              <label class="label">Observação do pedido</label>
              <textarea v-model="cart.observacao" class="input" rows="3" />
            </div>

            <div class="mb-6 space-y-2 border-t border-gray-200 pt-4">
              <div class="flex justify-between text-lg">
                <span class="text-gray-600">Itens:</span>
                <span class="font-bold">{{ cart.totalItems }}</span>
              </div>
              <div class="flex justify-between text-lg">
                <span class="text-gray-600">Total:</span>
                <span class="font-bold">{{ formatCurrency(cart.totalValue) }}</span>
              </div>
            </div>

            <button
              type="button"
              class="btn-success w-full py-4 text-lg font-bold"
              :disabled="submitting"
              @click="submitOrder"
            >
              <Icon v-if="submitting" name="lucide:loader-2" class="h-5 w-5 animate-spin" />
              <Icon v-else name="lucide:check" class="h-5 w-5" />
              {{ submitting ? 'Enviando...' : 'Confirmar Pedido' }}
            </button>
          </template>
        </div>
      </div>
    </Teleport>
  </div>
</template>
