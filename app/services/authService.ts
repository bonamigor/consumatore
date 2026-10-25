import type {
  ConfiguracaoMfa,
  LoginMfaPendente,
  LoginRequest,
  LoginResponse,
  Sessao,
} from '~/types/api'

export function useAuthService() {
  const api = useApi()

  return {
    login: (payload: LoginRequest) =>
      api.post<LoginResponse | LoginMfaPendente>('/api/auth/login', payload),
    loginSegundoFator: (mfaToken: string, codigo: string) =>
      api.post<LoginResponse>('/api/auth/login/2fa', { mfaToken, codigo }),
    logout: () =>
      api.post<void>('/api/auth/logout'),
    sessao: () =>
      api.get<Sessao>('/api/auth/me'),
    configurarMfa: () =>
      api.post<ConfiguracaoMfa>('/api/auth/2fa/configurar'),
    ativarMfa: (codigo: string) =>
      api.post<{ codigos: string[] }>('/api/auth/2fa/ativar', { codigo }),
    desativarMfa: (senha: string, codigo: string) =>
      api.post<void>('/api/auth/2fa/desativar', { senha, codigo }),
  }
}
