import type { AcaoAuditoria, PaginaDTO, RegistroAuditoria } from '~/types/api'

export function useAuditoriaService() {
  const api = useApi()

  return {
    listar: (filtros: { acao?: AcaoAuditoria | '', email?: string, page?: number, size?: number }) =>
      api.get<PaginaDTO<RegistroAuditoria>>('/api/auditoria', {
        acao: filtros.acao || undefined,
        email: filtros.email || undefined,
        page: filtros.page ?? 0,
        size: filtros.size ?? 50,
      }),
  }
}
