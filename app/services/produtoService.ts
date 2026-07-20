import type { Produto, ProdutoRequest } from '~/types/api'

export function useProdutoService() {
  const api = useApi()

  return {
    listar: () => api.get<Produto[]>('/api/produtos'),
    buscar: (id: number) => api.get<Produto>(`/api/produtos/${id}`),
    criar: (payload: ProdutoRequest) => api.post<Produto>('/api/produtos', payload),
    atualizar: (id: number, payload: ProdutoRequest) =>
      api.put<Produto>(`/api/produtos/${id}`, payload),
    remover: (id: number) => api.del(`/api/produtos/${id}`),
  }
}
