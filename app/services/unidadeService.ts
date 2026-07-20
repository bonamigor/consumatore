import type { UnidadeMedida, UnidadeMedidaRequest } from '~/types/api'

export function useUnidadeService() {
  const api = useApi()

  return {
    listar: () => api.get<UnidadeMedida[]>('/api/unidades-medida'),
    buscar: (id: number) => api.get<UnidadeMedida>(`/api/unidades-medida/${id}`),
    criar: (payload: UnidadeMedidaRequest) =>
      api.post<UnidadeMedida>('/api/unidades-medida', payload),
    atualizar: (id: number, payload: UnidadeMedidaRequest) =>
      api.put<UnidadeMedida>(`/api/unidades-medida/${id}`, payload),
    remover: (id: number) => api.del(`/api/unidades-medida/${id}`),
  }
}
