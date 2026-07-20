<script setup lang="ts">
import type { Produto, ProdutoRequest, UnidadeMedida } from '~/types/api'
import { formatCurrency } from '~/utils/format'

definePageMeta({ middleware: ['auth', 'admin'] })

const produtoService = useProdutoService()
const unidadeService = useUnidadeService()
const loading = ref(true)
const saving = ref(false)
const error = ref('')
const produtos = ref<Produto[]>([])
const unidades = ref<UnidadeMedida[]>([])
const modalOpen = ref(false)
const editing = ref<Produto | null>(null)

const form = reactive({
  nome: '',
  precoCusto: 0,
  unidadeMedidaSigla: '',
  ativo: true,
})

async function load() {
  loading.value = true
  error.value = ''
  try {
    const [p, u] = await Promise.all([
      produtoService.listar(),
      unidadeService.listar(),
    ])
    produtos.value = p
    unidades.value = u
    if (!form.unidadeMedidaSigla && u.length) {
      form.unidadeMedidaSigla = u[0].sigla
    }
  }
  catch (e) {
    error.value = e instanceof Error ? e.message : 'Erro ao carregar produtos'
  }
  finally {
    loading.value = false
  }
}

function openCreate() {
  editing.value = null
  Object.assign(form, {
    nome: '',
    precoCusto: 0,
    unidadeMedidaSigla: unidades.value[0]?.sigla || '',
    ativo: true,
  })
  modalOpen.value = true
}

function openEdit(p: Produto) {
  editing.value = p
  Object.assign(form, {
    nome: p.nome,
    precoCusto: Number(p.precoCusto),
    unidadeMedidaSigla: p.unidadeMedidaSigla,
    ativo: p.ativo,
  })
  modalOpen.value = true
}

async function save() {
  saving.value = true
  error.value = ''
  try {
    const payload: ProdutoRequest = {
      nome: form.nome,
      precoCusto: Number(form.precoCusto),
      unidadeMedidaSigla: form.unidadeMedidaSigla,
      ativo: form.ativo,
    }
    if (editing.value) {
      await produtoService.atualizar(editing.value.id, payload)
    }
    else {
      await produtoService.criar(payload)
    }
    modalOpen.value = false
    await load()
  }
  catch (e) {
    error.value = e instanceof Error ? e.message : 'Erro ao salvar'
  }
  finally {
    saving.value = false
  }
}

async function remove(p: Produto) {
  if (!confirm(`Excluir produto ${p.nome}?`)) return
  try {
    await produtoService.remover(p.id)
    await load()
  }
  catch (e) {
    error.value = e instanceof Error ? e.message : 'Erro ao excluir'
  }
}

onMounted(load)
</script>

<template>
  <div>
    <UiPageHeader title="Gerenciar Produtos" description="Cadastrar e organizar produtos">
      <template #actions>
        <NuxtLink to="/admin/unidades" class="btn-secondary">Unidades</NuxtLink>
        <button type="button" class="btn-primary" @click="openCreate">
          <Icon name="lucide:plus" class="h-5 w-5" />
          Novo Produto
        </button>
      </template>
    </UiPageHeader>

    <UiAlertBanner v-if="error" type="error" :message="error" class="mb-4" />
    <UiLoadingState v-if="loading" />
    <UiEmptyState v-else-if="!produtos.length" />

    <div v-else class="card overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="border-b bg-gray-50">
            <tr>
              <th class="table-th">Nome</th>
              <th class="table-th">Unidade</th>
              <th class="table-th">Preço custo</th>
              <th class="table-th">Status</th>
              <th class="table-th">Ações</th>
            </tr>
          </thead>
          <tbody class="divide-y">
            <tr v-for="p in produtos" :key="p.id" class="hover:bg-gray-50">
              <td class="table-td font-medium text-gray-900">{{ p.nome }}</td>
              <td class="table-td">{{ p.unidadeMedidaSigla }}</td>
              <td class="table-td">{{ formatCurrency(p.precoCusto) }}</td>
              <td class="table-td">
                <span
                  class="inline-flex rounded-full px-3 py-1 text-sm font-medium"
                  :class="p.ativo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'"
                >
                  {{ p.ativo ? 'Ativo' : 'Inativo' }}
                </span>
              </td>
              <td class="table-td">
                <button type="button" class="mr-4 font-medium text-brand-600" @click="openEdit(p)">Editar</button>
                <button type="button" class="font-medium text-red-600" @click="remove(p)">Excluir</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <UiAppModal
      :open="modalOpen"
      :title="editing ? 'Editar Produto' : 'Novo Produto'"
      @close="modalOpen = false"
    >
      <form class="space-y-4" @submit.prevent="save">
        <div>
          <label class="label">Nome</label>
          <input v-model="form.nome" class="input" required>
        </div>
        <div>
          <label class="label">Preço de custo</label>
          <input v-model.number="form.precoCusto" class="input" type="number" min="0.01" step="0.01" required>
        </div>
        <div>
          <label class="label">Unidade de medida</label>
          <select v-model="form.unidadeMedidaSigla" class="input" required>
            <option v-for="u in unidades" :key="u.id" :value="u.sigla">
              {{ u.sigla }} — {{ u.descricao }}
            </option>
          </select>
        </div>
        <div class="flex items-center gap-2">
          <input id="prod-ativo" v-model="form.ativo" type="checkbox" class="h-4 w-4">
          <label for="prod-ativo" class="text-sm">Produto ativo</label>
        </div>
      </form>
      <template #footer>
        <button type="button" class="btn-secondary" @click="modalOpen = false">Cancelar</button>
        <button type="button" class="btn-primary" :disabled="saving" @click="save">Salvar</button>
      </template>
    </UiAppModal>
  </div>
</template>
