import type {
  Estante,
  EstanteRequest,
  EstanteUpdate,
  PageResponse,
} from '~/types/api'

export function useEstanteService() {
  const api = useApi()

  return {
    listarPorCliente: (clienteId: number, query?: Record<string, unknown>) =>
      api.get<PageResponse<Estante>>(`/api/estantes/cliente/${clienteId}`, query),
    buscar: (id: number) => api.get<Estante>(`/api/estantes/${id}`),
    criar: (payload: EstanteRequest) => api.post<Estante>('/api/estantes', payload),
    atualizar: (id: number, payload: EstanteUpdate) =>
      api.put<Estante>(`/api/estantes/${id}`, payload),
    desativar: (id: number) => api.patch(`/api/estantes/${id}/desativar`),
    remover: (id: number) => api.del(`/api/estantes/${id}`),
  }
}
