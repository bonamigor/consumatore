<script setup lang="ts">
definePageMeta({
  layout: 'auth',
  middleware: 'guest',
})

const { login } = useAuth()
const route = useRoute()

const email = ref('')
const senha = ref('')
const loading = ref(false)
const error = ref('')

async function onSubmit() {
  loading.value = true
  error.value = ''
  try {
    await login({ email: email.value, senha: senha.value })
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/'
    await navigateTo(redirect)
  }
  catch (e) {
    error.value = e instanceof Error ? e.message : 'Falha ao autenticar'
  }
  finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center p-6">
    <div class="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
      <div class="mb-8 text-center">
        <div class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-brand-600">
          <Icon name="lucide:package" class="h-8 w-8 text-white" />
        </div>
        <h1 class="text-2xl font-bold text-gray-900">Sistema de Pedidos</h1>
        <p class="mt-1 text-gray-600">Entre com suas credenciais</p>
      </div>

      <UiAlertBanner v-if="error" type="error" :message="error" class="mb-4" />

      <form class="space-y-4" @submit.prevent="onSubmit">
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
            minlength="6"
            autocomplete="current-password"
          >
        </div>
        <button class="btn-primary w-full py-3" type="submit" :disabled="loading">
          <Icon v-if="loading" name="lucide:loader-2" class="h-4 w-4 animate-spin" />
          {{ loading ? 'Entrando...' : 'Entrar' }}
        </button>
      </form>

      <div class="mt-6 rounded-lg bg-gray-50 p-4 text-xs text-gray-600">
        <p class="font-medium text-gray-800 mb-1">Usuários de demonstração (API local):</p>
        <p>Admin: admin@cafeteriacentral.com / 123456</p>
        <p>Operador: operador@cafeteriacentral.com / 123456</p>
      </div>
    </div>
  </div>
</template>
