import type { FetchOptions } from 'ofetch'
import { getErrorMessage } from '~/utils/format'

export function useApi() {
  const auth = useAuthStore()
  const router = useRouter()

  // O JWT viaja no cookie HttpOnly definido pela API; o JavaScript nunca o lê
  const api = $fetch.create({
    credentials: 'same-origin',
    onRequest({ options }) {
      const headers = new Headers(options.headers as HeadersInit | undefined)
      headers.set('Accept', 'application/json')
      options.headers = headers
    },
    async onResponseError({ response }) {
      // Administrador sem 2FA: a API só libera a configuração do 2FA
      const tipo = (response._data as { type?: string } | undefined)?.type
      if (response.status === 403 && tipo?.endsWith('/mfa-obrigatorio')) {
        if (import.meta.client && router.currentRoute.value.path !== '/seguranca') {
          await navigateTo({ path: '/seguranca', query: { obrigatorio: '1' } })
        }
        return
      }
      if (response.status === 401) {
        auth.clearSession()
        if (import.meta.client && router.currentRoute.value.path !== '/login') {
          await navigateTo({
            path: '/login',
            query: { redirect: router.currentRoute.value.fullPath },
          })
        }
      }
    },
  })

  async function request<T>(url: string, options?: FetchOptions<'json'>): Promise<T> {
    try {
      return await api<T>(url, options)
    }
    catch (error) {
      throw new Error(getErrorMessage(error))
    }
  }

  return {
    get: <T>(url: string, query?: Record<string, unknown>) =>
      request<T>(url, { method: 'GET', query }),
    post: <T>(url: string, body?: unknown) =>
      request<T>(url, { method: 'POST', body }),
    put: <T>(url: string, body?: unknown) =>
      request<T>(url, { method: 'PUT', body }),
    patch: <T>(url: string, body?: unknown) =>
      request<T>(url, { method: 'PATCH', body }),
    del: <T>(url: string) =>
      request<T>(url, { method: 'DELETE' }),
  }
}
