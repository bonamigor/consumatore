<script setup lang="ts">
import type { UnidadeMedida, UnidadeMedidaRequest } from '~/types/api'

definePageMeta({ middleware: ['auth', 'admin'] })

const unidadeService = useUnidadeService()
const loading = ref(true)
const saving = ref(false)
const error = ref('')
const unidades = ref<UnidadeMedida[]>([])
const modalOpen = ref(false)
const editing = ref<UnidadeMedida | null>(null)
const form = reactive({ sigla: '', descricao: '' })

async function load() {
  loading.value = true
  try {
    unidades.value = await unidadeService.listar()
  }
  catch (e) {
    error.value = e instanceof Error ? e.message : 'Erro ao carregar unidades'
  }
  finally {
    loading.value = false
  }
}

function openCreate() {
  editing.value = null
  Object.assign(form, { sigla: '', descricao: '' })
  modalOpen.value = true
}

function openEdit(u: UnidadeMedida) {
  editing.value = u
  Object.assign(form, { sigla: u.sigla, descricao: u.descricao })
  modalOpen.value = true
}

async function save() {
  saving.value = true
  error.value = ''
  try {
    const payload: UnidadeMedidaRequest = {
      sigla: form.sigla.toUpperCase(),
      descricao: form.descricao,
    }
    if (editing.value) {
      await unidadeService.atualizar(editing.value.id, payload)
    }
    else {
      await unidadeService.criar(payload)
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

async function remove(u: UnidadeMedida) {
  if (!confirm(`Excluir unidade ${u.sigla}?`)) return
  try {
    await unidadeService.remover(u.id)
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
    <UiPageHeader title="Unidades de Medida" description="Cadastro de unidades usadas nos produtos">
      <template #actions>
        <button type="button" class="btn-primary" @click="openCreate">
          <Icon name="lucide:plus" class="h-5 w-5" />
          Nova Unidade
        </button>
      </template>
    </UiPageHeader>

    <UiAlertBanner v-if="error" type="error" :message="error" class="mb-4" />
    <UiLoadingState v-if="loading" />
    <UiEmptyState v-else-if="!unidades.length" />

    <div v-else class="card overflow-hidden">
      <table class="w-full">
        <thead class="border-b bg-gray-50">
          <tr>
            <th class="table-th">Sigla</th>
            <th class="table-th">Descrição</th>
            <th class="table-th">Ações</th>
          </tr>
        </thead>
        <tbody class="divide-y">
          <tr v-for="u in unidades" :key="u.id" class="hover:bg-gray-50">
            <td class="table-td font-mono font-bold">{{ u.sigla }}</td>
            <td class="table-td">{{ u.descricao }}</td>
            <td class="table-td">
              <button type="button" class="mr-4 font-medium text-brand-600" @click="openEdit(u)">Editar</button>
              <button type="button" class="font-medium text-red-600" @click="remove(u)">Excluir</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <UiAppModal
      :open="modalOpen"
      :title="editing ? 'Editar Unidade' : 'Nova Unidade'"
      @close="modalOpen = false"
    >
      <form class="space-y-4" @submit.prevent="save">
        <div>
          <label class="label">Sigla (até 4 caracteres)</label>
          <input v-model="form.sigla" class="input" maxlength="4" required>
        </div>
        <div>
          <label class="label">Descrição</label>
          <input v-model="form.descricao" class="input" maxlength="50" required>
        </div>
      </form>
      <template #footer>
        <button type="button" class="btn-secondary" @click="modalOpen = false">Cancelar</button>
        <button type="button" class="btn-primary" :disabled="saving" @click="save">Salvar</button>
      </template>
    </UiAppModal>
  </div>
</template>
