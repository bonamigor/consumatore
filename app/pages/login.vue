<script setup lang="ts">
definePageMeta({
  layout: 'auth',
  middleware: 'guest',
})

const { login, concluirSegundoFator } = useAuth()
const route = useRoute()
const isDev = import.meta.dev

const email = ref('')
const senha = ref('')
const codigo = ref('')
const mfaToken = ref<string | null>(null)
const usarCodigoRecuperacao = ref(false)
const loading = ref(false)
const error = ref('')

async function irParaDestino() {
  const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/'
  await navigateTo(redirect)
}

async function onSubmit() {
  loading.value = true
  error.value = ''
  try {
    const pendente = await login({ email: email.value, senha: senha.value })
    if (pendente) {
      mfaToken.value = pendente.mfaToken
      senha.value = ''
      return
    }
    await irParaDestino()
  }
  catch (e) {
    error.value = e instanceof Error ? e.message : 'Falha ao autenticar'
  }
  finally {
    loading.value = false
  }
}

async function onSubmitCodigo() {
  if (!mfaToken.value) return
  loading.value = true
  error.value = ''
  try {
    await concluirSegundoFator(mfaToken.value, codigo.value.trim())
    await irParaDestino()
  }
  catch (e) {
    error.value = e instanceof Error ? e.message : 'Código inválido'
    codigo.value = ''
  }
  finally {
    loading.value = false
  }
}

function voltar() {
  mfaToken.value = null
  codigo.value = ''
  usarCodigoRecuperacao.value = false
  error.value = ''
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center p-6">
    <div class="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
      <div class="mb-8 text-center">
        <div class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-brand-600">
          <Icon :name="mfaToken ? 'lucide:shield-check' : 'lucide:package'" class="h-8 w-8 text-white" />
        </div>
        <h1 class="text-2xl font-bold text-gray-900">
          {{ mfaToken ? 'Verificação em duas etapas' : 'Sistema de Pedidos' }}
        </h1>
        <p class="mt-1 text-gray-600">
          <template v-if="!mfaToken">Entre com suas credenciais</template>
          <template v-else-if="usarCodigoRecuperacao">Digite um dos seus códigos de recuperação</template>
          <template v-else>Digite o código de 6 dígitos do aplicativo autenticador</template>
        </p>
      </div>

      <UiAlertBanner v-if="error" type="error" :message="error" class="mb-4" />

      <form v-if="!mfaToken" class="space-y-4" @submit.prevent="onSubmit">
        <div>
          <label class="label" for="email">E-mail</label>
          <input
            id="email"
            v-model="email"
            class="input"
            type="email"
            required
            autocomplete="username"
          >
        </div>
        <div>
          <label class="label" for="senha">Senha</label>
          <input
            id="senha"
            v-model="senha"
            class="input"
            type="password"
            required
            autocomplete="current-password"
          >
        </div>
        <button class="btn-primary w-full py-3" type="submit" :disabled="loading">
          <Icon v-if="loading" name="lucide:loader-2" class="h-4 w-4 animate-spin" />
          {{ loading ? 'Entrando...' : 'Entrar' }}
        </button>
      </form>

      <form v-else class="space-y-4" @submit.prevent="onSubmitCodigo">
        <div>
          <label class="label" for="codigo">
            {{ usarCodigoRecuperacao ? 'Código de recuperação' : 'Código' }}
          </label>
          <input
            v-if="!usarCodigoRecuperacao"
            id="codigo"
            v-model="codigo"
            class="input text-center text-2xl tracking-[0.5em]"
            inputmode="numeric"
            autocomplete="one-time-code"
            pattern="\d{6}"
            maxlength="6"
            required
            autofocus
          >
          <input
            v-else
            id="codigo"
            v-model="codigo"
            class="input text-center font-mono text-lg uppercase"
            placeholder="XXXX-XXXX"
            maxlength="9"
            required
            autofocus
          >
        </div>
        <button class="btn-primary w-full py-3" type="submit" :disabled="loading">
          <Icon v-if="loading" name="lucide:loader-2" class="h-4 w-4 animate-spin" />
          {{ loading ? 'Verificando...' : 'Verificar' }}
        </button>
        <div class="flex justify-between text-sm">
          <button type="button" class="font-medium text-gray-600 hover:text-gray-900" @click="voltar">
            Voltar
          </button>
          <button
            type="button"
            class="font-medium text-brand-600"
            @click="usarCodigoRecuperacao = !usarCodigoRecuperacao; codigo = ''"
          >
            {{ usarCodigoRecuperacao ? 'Usar o aplicativo' : 'Perdi acesso ao aplicativo' }}
          </button>
        </div>
      </form>

      <div v-if="isDev && !mfaToken" class="mt-6 rounded-lg bg-gray-50 p-4 text-xs text-gray-600">
        <p class="font-medium text-gray-800 mb-1">Usuários de demonstração (somente em desenvolvimento):</p>
        <p>Admin: admin@cafeteriacentral.com / 123456</p>
        <p>Operador: operador@cafeteriacentral.com / 123456</p>
      </div>
    </div>
  </div>
</template>
