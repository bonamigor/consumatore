<script setup lang="ts">
import type { Cliente, Usuario, UsuarioRequest, UsuarioUpdate } from '~/types/api'

definePageMeta({ middleware: ['auth', 'admin'] })

const usuarioService = useUsuarioService()
const clienteService = useClienteService()
const loading = ref(true)
const saving = ref(false)
const error = ref('')
const usuarios = ref<Usuario[]>([])
const clientes = ref<Cliente[]>([])
const modalOpen = ref(false)
const editing = ref<Usuario | null>(null)

const form = reactive({
  nome: '',
  email: '',
  senha: '',
  admin: false,
  clienteId: null as number | null,
})

watch(() => form.admin, (isAdmin) => {
  if (isAdmin) {
    form.clienteId = null
  }
})

async function load() {
  loading.value = true
  error.value = ''
  try {
    const [u, c] = await Promise.all([
      usuarioService.listar(),
      clienteService.listar(),
    ])
    usuarios.value = u
    clientes.value = c
  }
  catch (e) {
    error.value = e instanceof Error ? e.message : 'Erro ao carregar usuários'
  }
  finally {
    loading.value = false
  }
}

function openCreate() {
  editing.value = null
  Object.assign(form, {
    nome: '',
    email: '',
    senha: '',
    admin: false,
    clienteId: null,
  })
  modalOpen.value = true
}

function openEdit(u: Usuario) {
  editing.value = u
  Object.assign(form, {
    nome: u.nome,
    email: u.email,
    senha: '',
    admin: u.admin,
    clienteId: u.admin ? null : (u.clienteId ?? null),
  })
  modalOpen.value = true
}

async function save() {
  saving.value = true
  error.value = ''
  try {
    if (form.admin && form.clienteId) {
      throw new Error('Administradores não podem estar associados a um cliente')
    }
    if (!form.admin && !form.clienteId) {
      throw new Error('Operadores devem estar associados a um cliente (ex.: escola)')
    }

    if (editing.value) {
      const payload: UsuarioUpdate = {
        nome: form.nome,
        email: form.email,
        senha: form.senha || null,
        admin: form.admin,
        clienteId: form.admin ? null : form.clienteId,
      }
      await usuarioService.atualizar(editing.value.id, payload)
    }
    else {
      if (!form.senha || form.senha.length < 6) {
        throw new Error('Senha deve ter ao menos 6 caracteres')
      }
      const payload: UsuarioRequest = {
        nome: form.nome,
        email: form.email,
        senha: form.senha,
        admin: form.admin,
        clienteId: form.admin ? null : form.clienteId,
      }
      await usuarioService.criar(payload)
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

async function redefinirMfa(u: Usuario) {
  if (!confirm(`Redefinir a verificação em duas etapas de ${u.nome}? Use quando a pessoa perdeu o celular e os códigos de recuperação. Ela precisará configurar novamente.`)) return
  try {
    await usuarioService.redefinirMfa(u.id)
    await load()
  }
  catch (e) {
    error.value = e instanceof Error ? e.message : 'Erro ao redefinir 2FA'
  }
}

async function remove(u: Usuario) {
  if (!confirm(`Excluir usuário ${u.nome}?`)) return
  try {
    await usuarioService.remover(u.id)
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
    <UiPageHeader title="Gerenciar Usuários" description="Controlar acessos e permissões">
      <template #actions>
        <button type="button" class="btn-primary" @click="openCreate">
          <Icon name="lucide:plus" class="h-5 w-5" />
          Novo Usuário
        </button>
      </template>
    </UiPageHeader>

    <UiAlertBanner v-if="error" type="error" :message="error" class="mb-4" />
    <UiLoadingState v-if="loading" />
    <UiEmptyState v-else-if="!usuarios.length" />

    <div v-else class="card overflow-hidden">
      <table class="w-full">
        <thead class="border-b bg-gray-50">
          <tr>
            <th class="table-th">Nome</th>
            <th class="table-th">E-mail</th>
            <th class="table-th">Perfil</th>
            <th class="table-th">Cliente</th>
            <th class="table-th">2FA</th>
            <th class="table-th">Ações</th>
          </tr>
        </thead>
        <tbody class="divide-y">
          <tr v-for="u in usuarios" :key="u.id" class="hover:bg-gray-50">
            <td class="table-td font-medium">{{ u.nome }}</td>
            <td class="table-td">{{ u.email }}</td>
            <td class="table-td">
              <span
                class="inline-flex rounded-full px-3 py-1 text-sm font-medium"
                :class="u.admin ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'"
              >
                {{ u.admin ? 'Admin' : 'Operador' }}
              </span>
            </td>
            <td class="table-td">{{ u.admin ? '—' : (u.clienteNome || '—') }}</td>
            <td class="table-td">
              <span v-if="u.doisFatoresAtivo" class="inline-flex items-center gap-1 text-sm font-medium text-green-700">
                <Icon name="lucide:shield-check" class="h-4 w-4" /> Ativo
              </span>
              <span v-else class="text-sm text-gray-500">Inativo</span>
            </td>
            <td class="table-td">
              <button type="button" class="mr-4 font-medium text-brand-600" @click="openEdit(u)">Editar</button>
              <button
                v-if="u.doisFatoresAtivo"
                type="button"
                class="mr-4 font-medium text-amber-700"
                @click="redefinirMfa(u)"
              >
                Redefinir 2FA
              </button>
              <button type="button" class="font-medium text-red-600" @click="remove(u)">Excluir</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <UiAppModal
      :open="modalOpen"
      :title="editing ? 'Editar Usuário' : 'Novo Usuário'"
      @close="modalOpen = false"
    >
      <form class="space-y-4" @submit.prevent="save">
        <div>
          <label class="label">Nome</label>
          <input v-model="form.nome" class="input" required>
        </div>
        <div>
          <label class="label">E-mail</label>
          <input v-model="form.email" class="input" type="email" required>
        </div>
        <div>
          <label class="label">
            Senha
            <span v-if="editing" class="font-normal text-gray-500">(deixe em branco para manter)</span>
          </label>
          <input v-model="form.senha" class="input" type="password" minlength="8" maxlength="72" :required="!editing">
        </div>
        <div class="rounded-lg border border-gray-200 bg-gray-50 p-3">
          <div class="flex items-center gap-2">
            <input id="is-admin" v-model="form.admin" type="checkbox" class="h-4 w-4">
            <label for="is-admin" class="text-sm font-medium text-gray-800">Administrador</label>
          </div>
          <p class="mt-2 text-xs text-gray-600">
            Admins gerenciam o sistema e não ficam vinculados a escola/cliente.
            Operadores (desmarque) representam o gerente da merenda e precisam de um cliente.
          </p>
        </div>
        <div v-if="!form.admin">
          <label class="label">Cliente vinculado *</label>
          <UiClienteSearch
            v-model="form.clienteId"
            :clientes="clientes"
            placeholder="Buscar escola/cliente..."
            required
          />
        </div>
      </form>
      <template #footer>
        <button type="button" class="btn-secondary" @click="modalOpen = false">Cancelar</button>
        <button type="button" class="btn-primary" :disabled="saving" @click="save">Salvar</button>
      </template>
    </UiAppModal>
  </div>
</template>
