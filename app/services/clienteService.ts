import type { Cliente, ClienteRequest } from '~/types/api'

export function useClienteService() {
  const api = useApi()

  return {
    listar: () => api.get<Cliente[]>('/api/clientes'),
    buscar: (id: number) => api.get<Cliente>(`/api/clientes/${id}`),
    criar: (payload: ClienteRequest) => api.post<Cliente>('/api/clientes', payload),
    atualizar: (id: number, payload: ClienteRequest) =>
      api.put<Cliente>(`/api/clientes/${id}`, payload),
    remover: (id: number) => api.del(`/api/clientes/${id}`),
  }
}
