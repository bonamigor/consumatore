<script setup lang="ts">
import QRCode from 'qrcode'
import type { ConfiguracaoMfa, Sessao } from '~/types/api'

definePageMeta({ middleware: ['auth'] })

const authService = useAuthService()
const auth = useAuthStore()
const route = useRoute()

const obrigatorio = computed(() => route.query.obrigatorio === '1')
const sessao = ref<Sessao | null>(null)
const loading = ref(true)
const saving = ref(false)
const error = ref('')
const sucesso = ref('')

const configuracao = ref<ConfiguracaoMfa | null>(null)
const qrCode = ref('')
const codigo = ref('')
const codigosRecuperacao = ref<string[]>([])

const desativarForm = reactive({ senha: '', codigo: '' })

async function load() {
  loading.value = true
  error.value = ''
  try {
    sessao.value = await authService.sessao()
    auth.setMfaAtivo(sessao.value.doisFatoresAtivo)
  }
  catch (e) {
    error.value = e instanceof Error ? e.message : 'Erro ao carregar'
  }
  finally {
    loading.value = false
  }
}

async function iniciarConfiguracao() {
  saving.value = true
  error.value = ''
  try {
    configuracao.value = await authService.configurarMfa()
    qrCode.value = await QRCode.toDataURL(configuracao.value.otpauthUri, { width: 220, margin: 1 })
  }
  catch (e) {
    error.value = e instanceof Error ? e.message : 'Erro ao iniciar configuração'
  }
  finally {
    saving.value = false
  }
}

async function ativar() {
  saving.value = true
  error.value = ''
  try {
    const { codigos } = await authService.ativarMfa(codigo.value.trim())
    codigosRecuperacao.value = codigos
    configuracao.value = null
    codigo.value = ''
    auth.setMfaAtivo(true)
    await load()
  }
  catch (e) {
    error.value = e instanceof Error ? e.message : 'Código inválido'
  }
  finally {
    saving.value = false
  }
}

async function desativar() {
  if (!confirm('Desativar a verificação em duas etapas deixa sua conta menos protegida. Continuar?')) return
  saving.value = true
  error.value = ''
  try {
    await authService.desativarMfa(desativarForm.senha, desativarForm.codigo.trim())
    desativarForm.senha = ''
    desativarForm.codigo = ''
    sucesso.value = 'Verificação em duas etapas desativada.'
    auth.setMfaAtivo(false)
    await load()
  }
  catch (e) {
    error.value = e instanceof Error ? e.message : 'Erro ao desativar'
  }
  finally {
    saving.value = false
  }
}

function baixarCodigos() {
  const conteudo = [
    'Códigos de recuperação — Sistema de Pedidos',
    `Conta: ${sessao.value?.email ?? ''}`,
    'Cada código funciona uma única vez. Guarde em local seguro.',
    '',
    ...codigosRecuperacao.value,
  ].join('\n')
  const url = URL.createObjectURL(new Blob([conteudo], { type: 'text/plain;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = 'codigos-recuperacao.txt'
  link.click()
  URL.revokeObjectURL(url)
}

async function copiarCodigos() {
  await navigator.clipboard.writeText(codigosRecuperacao.value.join('\n'))
  sucesso.value = 'Códigos copiados.'
}

async function concluir() {
  codigosRecuperacao.value = []
  if (obrigatorio.value) {
    await navigateTo('/')
  }
}

onMounted(load)
</script>

<template>
  <div class="max-w-3xl">
    <UiPageHeader title="Segurança da conta" description="Verificação em duas etapas (2FA) com aplicativo autenticador" />

    <UiAlertBanner
      v-if="obrigatorio && !sessao?.doisFatoresAtivo"
      type="warning"
      message="Administradores precisam ativar a verificação em duas etapas para continuar usando o sistema."
      class="mb-4"
    />
    <UiAlertBanner v-if="error" type="error" :message="error" class="mb-4" />
    <UiAlertBanner v-if="sucesso && !error" type="success" :message="sucesso" class="mb-4" />
    <UiLoadingState v-if="loading" />

    <!-- Códigos de recuperação: exibidos uma única vez, logo após ativar -->
    <div v-else-if="codigosRecuperacao.length" class="card p-6">
      <h3 class="mb-2 text-lg font-semibold text-gray-900">Guarde seus códigos de recuperação</h3>
      <p class="mb-4 text-sm text-gray-600">
        Se perder o celular, use um destes códigos no lugar do código do aplicativo. Cada um funciona
        uma única vez. <strong>Eles não serão exibidos novamente.</strong>
      </p>
      <div class="mb-4 grid grid-cols-2 gap-2 rounded-lg bg-gray-50 p-4 font-mono text-lg">
        <span v-for="c in codigosRecuperacao" :key="c">{{ c }}</span>
      </div>
      <div class="flex flex-wrap gap-2">
        <button type="button" class="btn-secondary" @click="baixarCodigos">
          <Icon name="lucide:download" class="h-4 w-4" />
          Baixar
        </button>
        <button type="button" class="btn-secondary" @click="copiarCodigos">
          <Icon name="lucide:copy" class="h-4 w-4" />
          Copiar
        </button>
        <button type="button" class="btn-primary" @click="concluir">Já guardei os códigos</button>
      </div>
    </div>

    <!-- 2FA ativo -->
    <div v-else-if="sessao?.doisFatoresAtivo" class="space-y-6">
      <div class="card flex items-start gap-4 p-6">
        <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-green-100">
          <Icon name="lucide:shield-check" class="h-6 w-6 text-green-700" />
        </div>
        <div>
          <h3 class="text-lg font-semibold text-gray-900">Verificação em duas etapas ativa</h3>
          <p class="text-sm text-gray-600">
            Além da senha, o login pede o código do aplicativo autenticador.
            Restam {{ sessao.codigosRecuperacaoRestantes }} códigos de recuperação.
          </p>
        </div>
      </div>

      <div v-if="sessao.role !== 'ADMIN'" class="card p-6">
        <h3 class="mb-4 text-lg font-semibold text-gray-900">Desativar</h3>
        <form class="space-y-4" @submit.prevent="desativar">
          <div>
            <label class="label" for="senha-desativar">Senha atual</label>
            <input id="senha-desativar" v-model="desativarForm.senha" class="input" type="password" required autocomplete="current-password">
          </div>
          <div>
            <label class="label" for="codigo-desativar">Código do aplicativo ou de recuperação</label>
            <input id="codigo-desativar" v-model="desativarForm.codigo" class="input" required autocomplete="one-time-code">
          </div>
          <button type="submit" class="btn-secondary text-red-600" :disabled="saving">Desativar verificação em duas etapas</button>
        </form>
      </div>
      <p v-else class="text-sm text-gray-500">
        Administradores não podem desativar a verificação em duas etapas. Se perder o celular e os
        códigos de recuperação, outro administrador pode redefini-la em Usuários.
      </p>
    </div>

    <!-- Configuração -->
    <div v-else class="card p-6">
      <template v-if="!configuracao">
        <h3 class="mb-2 text-lg font-semibold text-gray-900">Proteja sua conta</h3>
        <p class="mb-4 text-sm text-gray-600">
          Com a verificação em duas etapas, além da senha você digita um código que muda a cada 30
          segundos no seu celular. Funciona com Google Authenticator, Microsoft Authenticator, Authy e similares.
        </p>
        <button type="button" class="btn-primary" :disabled="saving" @click="iniciarConfiguracao">
          <Icon name="lucide:shield-plus" class="h-4 w-4" />
          Configurar agora
        </button>
      </template>

      <template v-else>
        <ol class="space-y-6">
          <li>
            <p class="mb-3 font-medium text-gray-900">1. Escaneie o QR code no aplicativo autenticador</p>
            <img :src="qrCode" alt="QR code para o aplicativo autenticador" class="rounded-lg border" width="220" height="220">
            <details class="mt-3 text-sm text-gray-600">
              <summary class="cursor-pointer">Não consegue escanear? Digite a chave manualmente</summary>
              <code class="mt-2 block break-all rounded bg-gray-50 p-3 font-mono">{{ configuracao.segredo }}</code>
            </details>
          </li>
          <li>
            <p class="mb-3 font-medium text-gray-900">2. Digite o código de 6 dígitos exibido no aplicativo</p>
            <form class="flex flex-wrap gap-2" @submit.prevent="ativar">
              <input
                v-model="codigo"
                class="input w-40 text-center text-xl tracking-[0.3em]"
                inputmode="numeric"
                autocomplete="one-time-code"
                pattern="\d{6}"
                maxlength="6"
                required
              >
              <button type="submit" class="btn-primary" :disabled="saving">Ativar</button>
            </form>
          </li>
        </ol>
      </template>
    </div>
  </div>
</template>
