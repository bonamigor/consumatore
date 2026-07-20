import type { LoginRequest } from '~/types/api'

export function useAuth() {
  const authService = useAuthService()
  const auth = useAuthStore()
  const cart = useCartStore()

  async function login(payload: LoginRequest) {
    const response = await authService.login(payload)
    auth.setSession(response)
    return response
  }

  async function logout() {
    auth.clearSession()
    cart.clear()
    await navigateTo('/login')
  }

  return {
    login,
    logout,
    user: computed(() => auth.user),
    isAuthenticated: computed(() => auth.isAuthenticated),
    isAdmin: computed(() => auth.isAdmin),
    isUser: computed(() => auth.isUser),
  }
}
