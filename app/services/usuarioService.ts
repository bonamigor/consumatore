import type { Usuario, UsuarioRequest, UsuarioUpdate } from '~/types/api'

export function useUsuarioService() {
  const api = useApi()

  return {
    listar: () => api.get<Usuario[]>('/api/usuarios'),
    buscar: (id: number) => api.get<Usuario>(`/api/usuarios/${id}`),
    criar: (payload: UsuarioRequest) => api.post<Usuario>('/api/usuarios', payload),
    atualizar: (id: number, payload: UsuarioUpdate) =>
      api.put<Usuario>(`/api/usuarios/${id}`, payload),
    remover: (id: number) => api.del(`/api/usuarios/${id}`),
    redefinirMfa: (id: number) => api.del(`/api/usuarios/${id}/2fa`),
  }
}
