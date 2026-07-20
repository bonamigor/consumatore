import type { AuthSession, LoginResponse } from '~/types/api'

export const useAuthStore = defineStore('auth', () => {
  const session = useCookie<AuthSession | null>('cameriere_auth', {
    maxAge: 60 * 60 * 24,
    sameSite: 'lax',
  })

  const isAuthenticated = computed(() => Boolean(session.value?.accessToken))
  const isAdmin = computed(() => session.value?.role === 'ADMIN')
  const isUser = computed(() => session.value?.role === 'USER')
  const token = computed(() => session.value?.accessToken ?? null)
  const user = computed(() => session.value)

  function setSession(login: LoginResponse) {
    session.value = {
      accessToken: login.accessToken,
      expiresAt: Date.now() + (login.expiresInMs || 86400000),
      usuarioId: login.usuarioId,
      nome: login.nome,
      email: login.email,
      role: login.role,
      clienteId: login.clienteId,
    }
  }

  function clearSession() {
    session.value = null
  }

  function isExpired() {
    if (!session.value) return true
    return Date.now() >= session.value.expiresAt
  }

  return {
    session,
    user,
    token,
    isAuthenticated,
    isAdmin,
    isUser,
    setSession,
    clearSession,
    isExpired,
  }
})
