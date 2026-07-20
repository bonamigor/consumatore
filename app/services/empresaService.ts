import type { Empresa, EmpresaRequest } from '~/types/api'

export function useEmpresaService() {
  const api = useApi()

  return {
    listar: () => api.get<Empresa[]>('/api/empresas'),
    listarAtivas: async () => {
      const empresas = await api.get<Empresa[]>('/api/empresas')
      return empresas.filter(e => e.ativo)
    },
    buscar: (id: number) => api.get<Empresa>(`/api/empresas/${id}`),
    criar: (payload: EmpresaRequest) => api.post<Empresa>('/api/empresas', payload),
    atualizar: (id: number, payload: EmpresaRequest) =>
      api.put<Empresa>(`/api/empresas/${id}`, payload),
    remover: (id: number) => api.del(`/api/empresas/${id}`),
  }
}
