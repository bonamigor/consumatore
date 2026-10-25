<script setup lang="ts">
import type { AcaoAuditoria, PaginaDTO, RegistroAuditoria } from '~/types/api'

definePageMeta({ middleware: ['auth', 'admin'] })

const auditoriaService = useAuditoriaService()

const acoes: Record<AcaoAuditoria, string> = {
  LOGIN_SUCESSO: 'Login',
  LOGIN_FALHA: 'Login recusado',
  LOGIN_BLOQUEADO: 'Login bloqueado',
  LOGOUT: 'Logout',
  MFA_FALHA: 'Código 2FA inválido',
  MFA_ATIVADO: '2FA ativado',
  MFA_DESATIVADO: '2FA desativado',
  MFA_REDEFINIDO: '2FA redefinido',
  CODIGO_RECUPERACAO_USADO: 'Código de recuperação usado',
  ALTERACAO: 'Alteração',
}

const alertas = new Set<AcaoAuditoria>(['LOGIN_FALHA', 'LOGIN_BLOQUEADO', 'MFA_FALHA', 'MFA_DESATIVADO', 'MFA_REDEFINIDO'])

const filtros = reactive({ acao: '' as AcaoAuditoria | '', email: '' })
const pagina = ref(0)
const resultado = ref<PaginaDTO<RegistroAuditoria> | null>(null)
const loading = ref(true)
const error = ref('')

async function load() {
  loading.value = true
  error.value = ''
  try {
    resultado.value = await auditoriaService.listar({ ...filtros, page: pagina.value })
  }
  catch (e) {
    error.value = e instanceof Error ? e.message : 'Erro ao carregar auditoria'
  }
  finally {
    loading.value = false
  }
}

function filtrar() {
  pagina.value = 0
  load()
}

function irPara(p: number) {
  pagina.value = p
  load()
}

onMounted(load)
</script>

<template>
  <div>
    <UiPageHeader
      title="Auditoria"
      description="Acessos e alterações feitas no sistema. Registros são mantidos pelo prazo de retenção configurado."
    />

    <form class="card mb-4 flex flex-wrap items-end gap-3 p-4" @submit.prevent="filtrar">
      <div>
        <label class="label" for="filtro-acao">Ação</label>
        <select id="filtro-acao" v-model="filtros.acao" class="input">
          <option value="">Todas</option>
          <option v-for="(label, valor) in acoes" :key="valor" :value="valor">{{ label }}</option>
        </select>
      </div>
      <div class="min-w-[16rem] flex-1">
        <label class="label" for="filtro-email">E-mail</label>
        <input id="filtro-email" v-model="filtros.email" class="input" placeholder="Parte do e-mail">
      </div>
      <button type="submit" class="btn-primary">
        <Icon name="lucide:search" class="h-4 w-4" />
        Filtrar
      </button>
    </form>

    <UiAlertBanner v-if="error" type="error" :message="error" class="mb-4" />
    <UiLoadingState v-if="loading" />
    <UiEmptyState v-else-if="!resultado?.content.length" />

    <div v-else class="card overflow-x-auto">
      <table class="w-full">
        <thead class="border-b bg-gray-50">
          <tr>
            <th class="table-th">Data/hora</th>
            <th class="table-th">Ação</th>
            <th class="table-th">Usuário</th>
            <th class="table-th">Recurso</th>
            <th class="table-th">Status</th>
            <th class="table-th">IP</th>
            <th class="table-th">Detalhe</th>
          </tr>
        </thead>
        <tbody class="divide-y">
          <tr v-for="r in resultado.content" :key="r.id" class="hover:bg-gray-50">
            <td class="table-td whitespace-nowrap">{{ formatDateTime(r.dataHora) }}</td>
            <td class="table-td">
              <span
                class="inline-flex rounded-full px-3 py-1 text-xs font-medium"
                :class="alertas.has(r.acao) ? 'bg-amber-100 text-amber-900' : 'bg-gray-100 text-gray-800'"
              >
                {{ acoes[r.acao] ?? r.acao }}
              </span>
            </td>
            <td class="table-td">{{ r.usuarioEmail || '—' }}</td>
            <td class="table-td font-mono text-xs">
              <template v-if="r.recurso">{{ r.metodo }} {{ r.recurso }}</template>
              <template v-else>—</template>
            </td>
            <td class="table-td">{{ r.statusHttp ?? '—' }}</td>
            <td class="table-td font-mono text-xs">{{ r.ip || '—' }}</td>
            <td class="table-td text-sm text-gray-600">{{ r.detalhe || '—' }}</td>
          </tr>
        </tbody>
      </table>

      <div class="flex items-center justify-between border-t px-4 py-3 text-sm text-gray-600">
        <span>{{ resultado.page.totalElements }} registros</span>
        <div class="flex items-center gap-2">
          <button type="button" class="btn-secondary" :disabled="pagina === 0" @click="irPara(pagina - 1)">Anterior</button>
          <span>Página {{ pagina + 1 }} de {{ Math.max(resultado.page.totalPages, 1) }}</span>
          <button
            type="button"
            class="btn-secondary"
            :disabled="pagina + 1 >= resultado.page.totalPages"
            @click="irPara(pagina + 1)"
          >
            Próxima
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
