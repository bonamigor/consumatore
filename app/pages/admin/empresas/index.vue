<script setup lang="ts">
import type { Empresa, EmpresaRequest, Endereco } from '~/types/api'
import { formatCnpj, maskCep, maskCnpj } from '~/utils/format'

definePageMeta({ middleware: ['auth', 'admin'] })

const empresaService = useEmpresaService()
const { searching: searchingCep, error: cepError, buscarPorCep } = useCepLookup()
const loading = ref(true)
const saving = ref(false)
const error = ref('')
const empresas = ref<Empresa[]>([])
const modalOpen = ref(false)
const editing = ref<Empresa | null>(null)

const form = reactive({
  nome: '',
  cnpj: '',
  email: '',
  telefone: '',
  ativo: true,
  cep: '',
  logradouro: '',
  numero: '',
  bairro: '',
  cidade: '',
  estado: '',
})

async function load() {
  loading.value = true
  error.value = ''
  try {
    empresas.value = await empresaService.listar()
  }
  catch (e) {
    error.value = e instanceof Error ? e.message : 'Erro ao carregar empresas'
  }
  finally {
    loading.value = false
  }
}

function resetForm() {
  Object.assign(form, {
    nome: '',
    cnpj: '',
    email: '',
    telefone: '',
    ativo: true,
    cep: '',
    logradouro: '',
    numero: '',
    bairro: '',
    cidade: '',
    estado: '',
  })
}

function openCreate() {
  editing.value = null
  resetForm()
  modalOpen.value = true
}

function openEdit(empresa: Empresa) {
  editing.value = empresa
  Object.assign(form, {
    nome: empresa.nome,
    cnpj: empresa.cnpj,
    email: empresa.email || '',
    telefone: empresa.telefone || '',
    ativo: empresa.ativo,
    cep: empresa.endereco?.cep || '',
    logradouro: empresa.endereco?.logradouro || '',
    numero: empresa.endereco?.numero || '',
    bairro: empresa.endereco?.bairro || '',
    cidade: empresa.endereco?.cidade || '',
    estado: empresa.endereco?.estado || '',
  })
  modalOpen.value = true
}

async function onCepInput(event: Event) {
  form.cep = maskCep((event.target as HTMLInputElement).value)
  const digits = form.cep.replace(/\D/g, '')
  if (digits.length !== 8) return

  const result = await buscarPorCep(form.cep)
  if (!result) return

  form.cep = result.cep
  form.logradouro = result.logradouro
  form.bairro = result.bairro
  form.cidade = result.cidade
  form.estado = result.estado
}

async function save() {
  saving.value = true
  error.value = ''
  try {
    const endereco: Endereco = {
      cep: form.cep || null,
      logradouro: form.logradouro || null,
      numero: form.numero || null,
      bairro: form.bairro || null,
      cidade: form.cidade || null,
      estado: form.estado || null,
    }
    const payload: EmpresaRequest = {
      nome: form.nome,
      cnpj: form.cnpj,
      email: form.email || null,
      telefone: form.telefone || null,
      ativo: form.ativo,
      endereco,
    }
    if (editing.value) {
      await empresaService.atualizar(editing.value.id, payload)
    }
    else {
      await empresaService.criar(payload)
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

async function remove(empresa: Empresa) {
  if (!confirm(`Excluir empresa ${empresa.nome}?`)) return
  try {
    await empresaService.remover(empresa.id)
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
    <UiPageHeader title="Gerenciar Empresas" description="Cadastre as empresas usadas na impressão das notas">
      <template #actions>
        <button type="button" class="btn-primary" @click="openCreate">
          <Icon name="lucide:plus" class="h-5 w-5" />
          Nova Empresa
        </button>
      </template>
    </UiPageHeader>

    <UiAlertBanner v-if="error" type="error" :message="error" class="mb-4" />
    <UiLoadingState v-if="loading" />
    <UiEmptyState v-else-if="!empresas.length" message="Nenhuma empresa cadastrada." />

    <div v-else class="card overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="border-b bg-gray-50">
            <tr>
              <th class="table-th">Nome</th>
              <th class="table-th">CNPJ</th>
              <th class="table-th">Contato</th>
              <th class="table-th">Status</th>
              <th class="table-th">Ações</th>
            </tr>
          </thead>
          <tbody class="divide-y">
            <tr v-for="empresa in empresas" :key="empresa.id" class="hover:bg-gray-50">
              <td class="table-td font-medium text-gray-900">{{ empresa.nome }}</td>
              <td class="table-td">{{ formatCnpj(empresa.cnpj) }}</td>
              <td class="table-td">{{ empresa.email || empresa.telefone || '-' }}</td>
              <td class="table-td">
                <span
                  class="inline-flex rounded-full px-3 py-1 text-sm font-medium"
                  :class="empresa.ativo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'"
                >
                  {{ empresa.ativo ? 'Ativa' : 'Inativa' }}
                </span>
              </td>
              <td class="table-td">
                <button type="button" class="mr-4 font-medium text-brand-600" @click="openEdit(empresa)">Editar</button>
                <button type="button" class="font-medium text-red-600" @click="remove(empresa)">Excluir</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <UiAppModal
      :open="modalOpen"
      :title="editing ? 'Editar Empresa' : 'Nova Empresa'"
      size="lg"
      @close="modalOpen = false"
    >
      <form class="grid grid-cols-1 gap-4 md:grid-cols-2" @submit.prevent="save">
        <div class="md:col-span-2">
          <label class="label">Nome</label>
          <input v-model="form.nome" class="input" required>
        </div>
        <div>
          <label class="label">CNPJ</label>
          <input
            :value="form.cnpj"
            class="input"
            required
            placeholder="XX.XXX.XXX/XXXX-XX"
            @input="form.cnpj = maskCnpj(($event.target as HTMLInputElement).value)"
          >
        </div>
        <div>
          <label class="label">Telefone</label>
          <input v-model="form.telefone" class="input">
        </div>
        <div class="md:col-span-2">
          <label class="label">E-mail</label>
          <input v-model="form.email" class="input" type="email">
        </div>

        <div class="md:col-span-2 border-t border-gray-100 pt-4">
          <h4 class="mb-3 text-sm font-semibold text-gray-900">Endereço</h4>
        </div>

        <div>
          <label class="label">CEP</label>
          <div class="relative">
            <input
              :value="form.cep"
              class="input pr-10"
              placeholder="XXXXX-XXX"
              maxlength="9"
              @input="onCepInput"
            >
            <Icon
              v-if="searchingCep"
              name="lucide:loader-2"
              class="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-gray-400"
            />
          </div>
          <p v-if="cepError" class="mt-1 text-xs text-red-600">{{ cepError }}</p>
        </div>
        <div>
          <label class="label">Número</label>
          <input v-model="form.numero" class="input" placeholder="Nº">
        </div>
        <div class="md:col-span-2">
          <label class="label">Logradouro</label>
          <input v-model="form.logradouro" class="input">
        </div>
        <div class="md:col-span-2">
          <label class="label">Bairro / Setor</label>
          <input v-model="form.bairro" class="input">
        </div>
        <div>
          <label class="label">Cidade</label>
          <input v-model="form.cidade" class="input">
        </div>
        <div>
          <label class="label">Estado (UF)</label>
          <input v-model="form.estado" class="input" maxlength="2">
        </div>
        <div class="flex items-center gap-2 pt-6">
          <input id="empresa-ativo" v-model="form.ativo" type="checkbox" class="h-4 w-4">
          <label for="empresa-ativo" class="text-sm text-gray-700">Empresa ativa</label>
        </div>
      </form>
      <template #footer>
        <button type="button" class="btn-secondary" @click="modalOpen = false">Cancelar</button>
        <button type="button" class="btn-primary" :disabled="saving" @click="save">
          {{ saving ? 'Salvando...' : 'Salvar' }}
        </button>
      </template>
    </UiAppModal>
  </div>
</template>
