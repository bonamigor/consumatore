import type {
  LoginRequest,
  LoginResponse,
} from '~/types/api'

export function useAuthService() {
  const api = useApi()

  return {
    login: (payload: LoginRequest) =>
      api.post<LoginResponse>('/api/auth/login', payload),
  }
}
