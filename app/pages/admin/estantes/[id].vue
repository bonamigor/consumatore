<script setup lang="ts">
import type {
  Estante,
  EstanteProduto,
  EstanteProdutoRequest,
  Produto,
} from '~/types/api'
import { formatCurrency } from '~/utils/format'

definePageMeta({ middleware: ['auth', 'admin'] })

const route = useRoute()
const estanteService = useEstanteService()
const estanteProdutoService = useEstanteProdutoService()
const produtoService = useProdutoService()

const estanteId = computed(() => Number(route.params.id))
const loading = ref(true)
const saving = ref(false)
const error = ref('')
const estante = ref<Estante | null>(null)
const itens = ref<EstanteProduto[]>([])
const produtos = ref<Produto[]>([])
const modalOpen = ref(false)
const editing = ref<EstanteProduto | null>(null)

const form = reactive({
  produtoId: 0,
  precoVenda: 0,
  quantidadeEstoque: 0,
})

async function load() {
  loading.value = true
  error.value = ''
  try {
    const [e, page, prods] = await Promise.all([
      estanteService.buscar(estanteId.value),
      estanteProdutoService.listarPorEstante(estanteId.value, {
        size: 100,
        sort: 'produto.nome,asc',
      }),
      produtoService.listar(),
    ])
    estante.value = e
    itens.value = page.content || []
    produtos.value = prods.filter(p => p.ativo)
  }
  catch (e) {
    error.value = e instanceof Error ? e.message : 'Erro ao carregar estante'
  }
  finally {
    loading.value = false
  }
}

function openCreate() {
  editing.value = null
  Object.assign(form, {
    produtoId: produtos.value[0]?.id || 0,
    precoVenda: 0,
    quantidadeEstoque: 0,
  })
  modalOpen.value = true
}

function openEdit(item: EstanteProduto) {
  editing.value = item
  Object.assign(form, {
    produtoId: item.produtoId,
    precoVenda: Number(item.precoVenda),
    quantidadeEstoque: Number(item.quantidade),
  })
  modalOpen.value = true
}

async function save() {
  saving.value = true
  error.value = ''
  try {
    if (editing.value) {
      await estanteProdutoService.atualizar(editing.value.id, {
        precoVenda: Number(form.precoVenda),
        quantidadeEstoque: Number(form.quantidadeEstoque),
        ativo: true,
      })
    }
    else {
      const payload: EstanteProdutoRequest = {
        estanteId: estanteId.value,
        produtoId: form.produtoId,
        precoVenda: Number(form.precoVenda),
        quantidadeEstoque: Number(form.quantidadeEstoque),
      }
      await estanteProdutoService.criar(payload)
    }
    modalOpen.value = false
    await load()
  }
  catch (e) {
    error.value = e instanceof Error ? e.message : 'Erro ao salvar item'
  }
  finally {
    saving.value = false
  }
}

async function remove(item: EstanteProduto) {
  if (!confirm(`Remover ${item.produtoNome} da estante?`)) return
  try {
    await estanteProdutoService.remover(item.id)
    await load()
  }
  catch (e) {
    error.value = e instanceof Error ? e.message : 'Erro ao remover'
  }
}

onMounted(load)
</script>

<template>
  <div>
    <UiPageHeader
      :title="estante ? `Estante ${estante.periodo}` : 'Estante'"
      :description="estante ? `${estante.clienteNome} — produtos e estoque` : 'Carregando...'"
    >
      <template #actions>
        <NuxtLink to="/admin/estantes" class="btn-secondary">Voltar</NuxtLink>
        <button type="button" class="btn-primary" @click="openCreate">
          <Icon name="lucide:plus" class="h-5 w-5" />
          Adicionar Produto
        </button>
      </template>
    </UiPageHeader>

    <UiAlertBanner v-if="error" type="error" :message="error" class="mb-4" />
    <UiLoadingState v-if="loading" />
    <UiEmptyState v-else-if="!itens.length" message="Nenhum produto nesta estante." />

    <div v-else class="card overflow-hidden">
      <table class="w-full">
        <thead class="border-b bg-gray-50">
          <tr>
            <th class="table-th">Produto</th>
            <th class="table-th">Preço venda</th>
            <th class="table-th">Saldo</th>
            <th class="table-th">Status</th>
            <th class="table-th">Ações</th>
          </tr>
        </thead>
        <tbody class="divide-y">
          <tr v-for="item in itens" :key="item.id" class="hover:bg-gray-50">
            <td class="table-td font-medium">{{ item.produtoNome }}</td>
            <td class="table-td">{{ formatCurrency(item.precoVenda) }}</td>
            <td class="table-td">
              <span class="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800">
                {{ formatQuantidade(Number(item.quantidade)) }} {{ item.unidadeMedidaSigla }}
              </span>
            </td>
            <td class="table-td">
              <span
                class="rounded-full px-3 py-1 text-sm font-medium"
                :class="item.disponivel ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'"
              >
                {{ item.disponivel ? 'Disponível' : 'Indisponível' }}
              </span>
            </td>
            <td class="table-td">
              <button type="button" class="mr-4 font-medium text-brand-600" @click="openEdit(item)">Editar</button>
              <button type="button" class="font-medium text-red-600" @click="remove(item)">Remover</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <UiAppModal
      :open="modalOpen"
      :title="editing ? 'Editar item' : 'Adicionar produto'"
      @close="modalOpen = false"
    >
      <form class="space-y-4" @submit.prevent="save">
        <div v-if="!editing">
          <label class="label">Produto</label>
          <select v-model="form.produtoId" class="input" required>
            <option v-for="p in produtos" :key="p.id" :value="p.id">{{ p.nome }}</option>
          </select>
        </div>
        <div>
          <label class="label">Preço de venda</label>
          <input v-model.number="form.precoVenda" class="input" type="number" min="0.01" step="0.01" required>
        </div>
        <div>
          <label class="label">Saldo do edital</label>
          <input v-model.number="form.quantidadeEstoque" class="input" type="number" min="0" step="0.001" required>
          <p class="mt-1 text-xs text-gray-500">Aceita frações, como 35,5 kg (até 3 casas decimais).</p>
        </div>
      </form>
      <template #footer>
        <button type="button" class="btn-secondary" @click="modalOpen = false">Cancelar</button>
        <button type="button" class="btn-primary" :disabled="saving" @click="save">Salvar</button>
      </template>
    </UiAppModal>
  </div>
</template>
