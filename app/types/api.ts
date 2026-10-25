export type Role = 'ADMIN' | 'USER'

export type StatusPedido = 'PENDENTE' | 'CONFIRMADO' | 'CANCELADO' | 'ENTREGUE'

export interface LoginRequest {
  email: string
  senha: string
}

export interface LoginResponse {
  accessToken: string
  tokenType: string
  expiresInMs: number
  usuarioId: number
  nome: string
  email: string
  role: Role
  clienteId: number | null
}

// Dados de exibição da sessão; o token fica apenas no cookie HttpOnly
export interface AuthSession {
  expiresAt: number
  usuarioId: number
  nome: string
  email: string
  role: Role
  clienteId: number | null
}

export interface Endereco {
  logradouro?: string | null
  numero?: string | null
  bairro?: string | null
  cep?: string | null
  cidade?: string | null
  estado?: string | null
}

export interface Empresa {
  id: number
  nome: string
  cnpj: string
  endereco?: Endereco | null
  email?: string | null
  telefone?: string | null
  ativo: boolean
  dataCriacao?: string
  dataAtualizacao?: string
}

export interface EmpresaRequest {
  nome: string
  cnpj: string
  endereco?: Endereco | null
  email?: string | null
  telefone?: string | null
  ativo?: boolean
}

export interface Cliente {
  id: number
  nome: string
  cnpj: string
  endereco?: Endereco | null
  email?: string | null
  telefone?: string | null
  empresaId?: number | null
  empresaNome?: string | null
  ativo: boolean
  dataCriacao?: string
  dataAtualizacao?: string
}

export interface ClienteRequest {
  nome: string
  cnpj: string
  endereco?: Endereco | null
  email?: string | null
  telefone?: string | null
  empresaId?: number | null
  ativo?: boolean
}

export interface Usuario {
  id: number
  nome: string
  email: string
  admin: boolean
  clienteId?: number | null
  clienteNome?: string | null
  dataCriacao?: string
  dataAtualizacao?: string
}

export interface UsuarioRequest {
  nome: string
  email: string
  senha: string
  admin: boolean
  clienteId?: number | null
}

export interface UsuarioUpdate {
  nome: string
  email: string
  senha?: string | null
  admin: boolean
  clienteId?: number | null
}

export interface UnidadeMedida {
  id: number
  sigla: string
  descricao: string
  dataCriacao?: string
  dataAtualizacao?: string
}

export interface UnidadeMedidaRequest {
  sigla: string
  descricao: string
}

export interface Produto {
  id: number
  nome: string
  precoCusto: number
  unidadeMedidaSigla: string
  unidadeMedidaDescricao?: string
  ativo: boolean
  dataCriacao?: string
  dataAtualizacao?: string
}

export interface ProdutoRequest {
  nome: string
  precoCusto: number
  unidadeMedidaSigla: string
  ativo?: boolean
}

export interface Estante {
  id: number
  periodo: string
  observacao?: string | null
  clienteId: number
  clienteNome?: string
  clienteCnpj?: string
  ativa: boolean
  empresa?: number | null
  quantidadeProdutos?: number
}

export interface EstanteRequest {
  periodo: string
  observacao?: string | null
  clienteId: number
  ativa?: boolean
  empresa?: number | null
}

export interface EstanteUpdate {
  periodo?: string
  observacao?: string | null
  ativa?: boolean
  empresa?: number | null
}

export interface EstanteProduto {
  id: number
  estanteId: number
  estantePeriodo?: string
  produtoId: number
  produtoNome: string
  precoVenda: number
  quantidade: number
  ativo: boolean
  dataCadastro?: string
  dataAtualizacao?: string
  disponivel: boolean
}

export interface EstanteProdutoRequest {
  estanteId: number
  produtoId: number
  precoVenda: number
  quantidadeEstoque: number
  estoqueMinimo?: number | null
  estoqueMaximo?: number | null
  localizacaoPrateleira?: string | null
}

export interface EstanteProdutoUpdate {
  precoVenda?: number
  quantidadeEstoque?: number
  estoqueMinimo?: number | null
  estoqueMaximo?: number | null
  localizacaoPrateleira?: string | null
  ativo?: boolean
}

export interface ItemPedidoRequest {
  produtoId: number
  estanteId: number
  quantidade: number
  observacao?: string | null
}

export interface PedidoRequest {
  clienteId: number
  observacao?: string | null
  itens: ItemPedidoRequest[]
}

export interface PedidoItem {
  id: number
  quantidade: number
  precoTotal: number
  precoUnitario: number
  observacao?: string | null
  produto: {
    id: number
    nome: string
    unidadeMedida?: string
  }
}

export interface Pedido {
  id: number
  status: StatusPedido
  dataCriacao: string
  dataConfirmacao?: string | null
  dataPrevisaoEntrega?: string | null
  dataCancelamento?: string | null
  dataEntrega?: string | null
  valorTotal: number
  entregue: boolean
  observacao?: string | null
  obsCancelamento?: string | null
  finalizado: boolean
  cliente: {
    id: number
    nome: string
    cnpj: string
    endereco?: Endereco | null
    telefone?: string | null
    empresaId?: number | null
    empresaNome?: string | null
  }
  empresaNota?: {
    id: number
    nome: string
    cnpj: string
    endereco?: Endereco | null
    telefone?: string | null
  } | null
  itens: PedidoItem[]
}

export interface PageResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  size: number
  number: number
  first: boolean
  last: boolean
  empty: boolean
}

export interface PedidoFiltroResumo {
  quantidadePedidos: number
  valorTotal: number
}

export interface CompraProdutoPeriodo {
  produtoId: number
  produtoNome: string
  unidadeMedida: string
  quantidadeTotal: number
  valorTotal: number
  quantidadePedidos: number
}

export interface PedidosPorCliente {
  clienteId: number
  clienteNome: string
  totalPedidos: number
  valorTotal?: number
}

export interface ValorTotalPeriodo {
  valorTotal: number
  inicio?: string
  fim?: string
}

export interface ApiProblem {
  status?: number
  title?: string
  detail?: string
  userMessage?: string
  objects?: Array<{ name?: string; userMessage?: string }>
}
