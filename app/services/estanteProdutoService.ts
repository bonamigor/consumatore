import type {
  EstanteProduto,
  EstanteProdutoRequest,
  EstanteProdutoUpdate,
  PageResponse,
} from '~/types/api'

export function useEstanteProdutoService() {
  const api = useApi()

  return {
    listarPorEstante: (estanteId: number, query?: Record<string, unknown>) =>
      api.get<PageResponse<EstanteProduto>>(
        `/api/estantes-produtos/estante/${estanteId}`,
        query,
      ),
    listarDisponiveis: (estanteId: number) =>
      api.get<EstanteProduto[]>(`/api/estantes-produtos/estante/${estanteId}/disponiveis`),
    criar: (payload: EstanteProdutoRequest) =>
      api.post<EstanteProduto>('/api/estantes-produtos', payload),
    atualizar: (id: number, payload: EstanteProdutoUpdate) =>
      api.put<EstanteProduto>(`/api/estantes-produtos/${id}`, payload),
    remover: (id: number) => api.del(`/api/estantes-produtos/${id}`),
  }
}
