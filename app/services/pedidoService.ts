import type {
  CompraProdutoPeriodo,
  PageResponse,
  Pedido,
  PedidoFiltroResumo,
  PedidoRequest,
  PedidosPorCliente,
  StatusPedido,
  ValorTotalPeriodo,
} from '~/types/api'

export interface PedidoListQuery {
  size?: number
  page?: number
  sort?: string
  status?: StatusPedido | ''
  clienteId?: number
  pedidoId?: number
  id?: number
  inicioTimestamp?: number
  fimTimestamp?: number
}

export function usePedidoService() {
  const api = useApi()

  return {
    listar: (query?: PedidoListQuery) =>
      api.get<PageResponse<Pedido>>('/api/pedidos', query as Record<string, unknown>),

    listarPorCliente: (clienteId: number, query?: PedidoListQuery) =>
      api.get<PageResponse<Pedido>>(
        `/api/pedidos/cliente/${clienteId}`,
        query as Record<string, unknown>,
      ),

    buscar: (id: number) => api.get<Pedido>(`/api/pedidos/${id}`),

    criar: (payload: PedidoRequest) => api.post<Pedido>('/api/pedidos', payload),

    confirmar: (id: number, dataPrevisaoEntrega: string) =>
      api.put<Pedido>(`/api/pedidos/${id}/confirmar`, { dataPrevisaoEntrega }),

    entregar: (id: number) => api.put<Pedido>(`/api/pedidos/${id}/entregar`),

    cancelar: (id: number, motivo: string) =>
      api.put(`/api/pedidos/${id}/cancelar`, { motivo }),

    atualizarEmpresaNota: (id: number, empresaId: number) =>
      api.put<Pedido>(`/api/pedidos/${id}/empresa-nota?empresaId=${empresaId}`),

    resumirFiltros: (query?: PedidoListQuery) =>
      api.get<PedidoFiltroResumo>(
        '/api/pedidos/relatorios/resumo-filtros',
        query as Record<string, unknown>,
      ),

    relatorioPedidosPorCliente: (inicioTimestamp?: number, fimTimestamp?: number) =>
      api.get<PedidosPorCliente[]>('/api/pedidos/relatorios/pedidos-por-cliente', {
        ...(inicioTimestamp != null ? { inicioTimestamp } : {}),
        ...(fimTimestamp != null ? { fimTimestamp } : {}),
      }),

    relatorioValorTotalPeriodo: (inicioTimestamp: number, fimTimestamp: number) =>
      api.get<ValorTotalPeriodo>('/api/pedidos/relatorios/valor-total-periodo', {
        inicioTimestamp,
        fimTimestamp,
      }),

    relatorioCompras: (inicioTimestamp: number, fimTimestamp: number) =>
      api.get<CompraProdutoPeriodo[]>('/api/pedidos/relatorios/compras', {
        inicioTimestamp,
        fimTimestamp,
      }),
  }
}
