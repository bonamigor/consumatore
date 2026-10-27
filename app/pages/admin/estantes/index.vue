<script setup lang="ts">
import type { Cliente, Estante, EstanteRequest } from '~/types/api'

definePageMeta({ middleware: ['auth', 'admin'] })

const clienteService = useClienteService()
const estanteService = useEstanteService()
const loading = ref(true)
const saving = ref(false)
const error = ref('')
const clientes = ref<Cliente[]>([])
const selectedClienteId = ref<number | null>(null)
const estantes = ref<Estante[]>([])
const modalOpen = ref(false)
const editing = ref<Estante | null>(null)

const form = reactive({
  periodo: '',
  observacao: '',
  clienteId: null as number | null,
  ativa: true,
  empresa: null as number | null,
})

async function loadClientes() {
  clientes.value = await clienteService.listar()
}

async function loadEstantes() {
  if (!selectedClienteId.value) {
    estantes.value = []
    return
  }
  const page = await estanteService.listarPorCliente(selectedClienteId.value, {
    size: 50,
    sort: 'periodo,desc',
  })
  estantes.value = page.content || []
}

const selectedClienteNome = computed(() =>
  clientes.value.find(c => c.id === selectedClienteId.value)?.nome,
)

const emptyMessage = computed(() => {
  if (!selectedClienteId.value) {
    return 'Busque e selecione uma escola para ver os editais.'
  }
  return `Nenhum edital para ${selectedClienteNome.value || 'esta escola'}.`
})

async function load() {
  loading.value = true
  error.value = ''
  try {
    await loadClientes()
    await loadEstantes()
  }
  catch (e) {
    error.value = e instanceof Error ? e.message : 'Erro ao carregar editais'
  }
  finally {
    loading.value = false
  }
}

watch(selectedClienteId, async () => {
  try {
    await loadEstantes()
  }
  catch (e) {
    error.value = e instanceof Error ? e.message : 'Erro ao carregar editais'
  }
})

function openCreate() {
  editing.value = null
  const now = new Date()
  const periodo = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}`
  Object.assign(form, {
    periodo,
    observacao: '',
    clienteId: selectedClienteId.value,
    ativa: true,
    empresa: null,
  })
  modalOpen.value = true
}

function openEdit(e: Estante) {
  editing.value = e
  Object.assign(form, {
    periodo: e.periodo,
    observacao: e.observacao || '',
    clienteId: e.clienteId,
    ativa: e.ativa,
    empresa: e.empresa ?? null,
  })
  modalOpen.value = true
}

async function save() {
  saving.value = true
  error.value = ''
  try {
    if (editing.value) {
      await estanteService.atualizar(editing.value.id, {
        periodo: form.periodo,
        observacao: form.observacao || null,
        ativa: form.ativa,
        empresa: form.empresa,
      })
    }
    else {
      if (!form.clienteId) {
        error.value = 'Selecione uma escola'
        return
      }
      const payload: EstanteRequest = {
        periodo: form.periodo,
        observacao: form.observacao || null,
        clienteId: form.clienteId,
        ativa: form.ativa,
        empresa: form.empresa,
      }
      await estanteService.criar(payload)
    }
    modalOpen.value = false
    selectedClienteId.value = form.clienteId
    await loadEstantes()
  }
  catch (e) {
    error.value = e instanceof Error ? e.message : 'Erro ao salvar'
  }
  finally {
    saving.value = false
  }
}

async function desativar(e: Estante) {
  if (!confirm(`Desativar o edital ${e.periodo}?`)) return
  try {
    await estanteService.desativar(e.id)
    await loadEstantes()
  }
  catch (err) {
    error.value = err instanceof Error ? err.message : 'Erro ao desativar'
  }
}

async function remove(e: Estante) {
  if (!confirm(`Excluir o edital ${e.periodo}?`)) return
  try {
    await estanteService.remover(e.id)
    await loadEstantes()
  }
  catch (err) {
    error.value = err instanceof Error ? err.message : 'Erro ao excluir'
  }
}

onMounted(load)
</script>

<template>
  <div>
    <UiPageHeader title="Editais" description="Itens, preços e saldos de cada escola por período">
      <template #actions>
        <button type="button" class="btn-primary" @click="openCreate">
          <Icon name="lucide:plus" class="h-5 w-5" />
          Novo edital
        </button>
      </template>
    </UiPageHeader>

    <div class="mb-6 max-w-xl">
      <label class="label">Buscar escola</label>
      <UiClienteSearch
        v-model="selectedClienteId"
        :clientes="clientes"
        placeholder="Digite o nome ou CNPJ da escola..."
      />
      <p class="mt-1.5 text-xs text-gray-500">
        Digite para filtrar e selecione uma escola; os editais dela aparecerão abaixo.
      </p>
    </div>

    <UiAlertBanner v-if="error" type="error" :message="error" class="mb-4" />
    <UiLoadingState v-if="loading" />
    <UiEmptyState v-else-if="!estantes.length" :message="emptyMessage" />

    <div v-else class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      <div
        v-for="shelf in estantes"
        :key="shelf.id"
        class="rounded-xl border-2 border-gray-200 bg-white p-6 transition-all hover:border-brand-300 hover:shadow-md"
      >
        <div class="mb-4 flex items-start justify-between">
          <div class="flex h-12 w-12 items-center justify-center rounded-lg bg-orange-100">
            <Icon name="lucide:layout-grid" class="h-6 w-6 text-orange-600" />
          </div>
          <span class="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800">
            {{ shelf.quantidadeProdutos || 0 }} produtos
          </span>
        </div>
        <h4 class="mb-1 text-lg font-bold text-gray-900">{{ shelf.periodo }}</h4>
        <p class="mb-1 text-sm text-gray-600">{{ shelf.clienteNome }}</p>
        <p class="mb-4 text-gray-600">{{ shelf.observacao || 'Sem observação' }}</p>
        <p class="mb-4 text-xs" :class="shelf.ativa ? 'text-green-600' : 'text-red-600'">
          {{ shelf.ativa ? 'Ativa' : 'Inativa' }}
        </p>
        <div class="flex flex-wrap gap-2">
          <NuxtLink :to="`/admin/estantes/${shelf.id}`" class="btn-primary flex-1">
            Produtos
          </NuxtLink>
          <button type="button" class="btn-secondary" @click="openEdit(shelf)">Editar</button>
          <button
            v-if="shelf.ativa"
            type="button"
            class="btn-ghost text-orange-700"
            @click="desativar(shelf)"
          >
            Desativar
          </button>
          <button type="button" class="btn-ghost text-red-700" @click="remove(shelf)">
            Excluir
          </button>
        </div>
      </div>
    </div>

    <UiAppModal
      :open="modalOpen"
      :title="editing ? 'Editar edital' : 'Novo edital'"
      @close="modalOpen = false"
    >
      <form class="space-y-4" @submit.prevent="save">
        <div v-if="!editing">
          <label class="label">Escola</label>
          <UiClienteSearch
            v-model="form.clienteId"
            :clientes="clientes"
            placeholder="Buscar escola..."
            required
          />
        </div>
        <div>
          <label class="label">Período (YYYY/MM)</label>
          <input v-model="form.periodo" class="input" pattern="\d{4}/\d{2}" placeholder="2026/07" required>
        </div>
        <div>
          <label class="label">Observação</label>
          <textarea v-model="form.observacao" class="input" rows="3" />
        </div>
        <div>
          <label class="label">Empresa (opcional)</label>
          <input v-model.number="form.empresa" class="input" type="number">
        </div>
        <div class="flex items-center gap-2">
          <input id="est-ativa" v-model="form.ativa" type="checkbox" class="h-4 w-4">
          <label for="est-ativa" class="text-sm">Edital ativo</label>
        </div>
      </form>
      <template #footer>
        <button type="button" class="btn-secondary" @click="modalOpen = false">Cancelar</button>
        <button type="button" class="btn-primary" :disabled="saving" @click="save">Salvar</button>
      </template>
    </UiAppModal>
  </div>
</template>
