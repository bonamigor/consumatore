import type { AuthSession, LoginResponse } from '~/types/api'

export const useAuthStore = defineStore('auth', () => {
  const session = useCookie<AuthSession | null>('cameriere_auth', {
    maxAge: 60 * 60 * 8,
    sameSite: 'lax',
    secure: !import.meta.dev,
  })

  const isAuthenticated = computed(() => Boolean(session.value?.usuarioId))
  const isAdmin = computed(() => session.value?.role === 'ADMIN')
  const isUser = computed(() => session.value?.role === 'USER')
  const user = computed(() => session.value)

  function setSession(login: LoginResponse) {
    session.value = {
      expiresAt: Date.now() + (login.expiresInMs || 28800000),
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
    isAuthenticated,
    isAdmin,
    isUser,
    setSession,
    clearSession,
    isExpired,
  }
})
