import type { LoginMfaPendente, LoginRequest } from '~/types/api'

export function useAuth() {
  const authService = useAuthService()
  const auth = useAuthStore()
  const rascunho = useRascunhoPedidoStore()

  /** Retorna o token de verificação quando o usuário tem 2FA; caso contrário, já abre a sessão. */
  async function login(payload: LoginRequest): Promise<LoginMfaPendente | null> {
    const response = await authService.login(payload)
    if ('mfaPendente' in response) {
      return response
    }
    auth.setSession(response)
    return null
  }

  async function concluirSegundoFator(mfaToken: string, codigo: string) {
    auth.setSession(await authService.loginSegundoFator(mfaToken, codigo))
  }

  async function logout() {
    try {
      await authService.logout()
    }
    catch {
      // Mesmo se a API falhar, a sessão local é encerrada
    }
    auth.clearSession()
    rascunho.descartarTodos()
    await navigateTo('/login')
  }

  return {
    login,
    concluirSegundoFator,
    logout,
    user: computed(() => auth.user),
    isAuthenticated: computed(() => auth.isAuthenticated),
    isAdmin: computed(() => auth.isAdmin),
    isUser: computed(() => auth.isUser),
  }
}
