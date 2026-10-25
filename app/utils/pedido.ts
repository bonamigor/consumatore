import type { EstanteProduto } from '~/types/api'

/** Uma linha da tabela de itens do edital, com o que foi preenchido no rascunho. */
export interface LinhaPedido {
  item: EstanteProduto
  quantidade: number
  subtotal: number
  erro: string | null
}

export function formatQuantidade(valor: number): string {
  return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 3 }).format(valor)
}

/**
 * Converte o texto digitado em número; vazio ou inválido vale 0. Aceita "12", "1.200" (milhar)
 * e "12,5"; um ponto fora do padrão de milhar ("12.5") é lido como decimal, nunca como 125.
 */
export function lerQuantidade(texto: string): number {
  let limpo = texto.trim().replace(/\s/g, '')
  if (limpo.includes(',')) limpo = limpo.replace(/\./g, '').replace(',', '.')
  else if (/^\d{1,3}(\.\d{3})+$/.test(limpo)) limpo = limpo.replace(/\./g, '')
  if (!limpo) return 0
  const valor = Number(limpo)
  return Number.isFinite(valor) && valor > 0 ? valor : 0
}

/**
 * O saldo do edital é controlado em unidades inteiras, então a quantidade também precisa ser
 * inteira e não pode passar do saldo disponível.
 */
export function validarQuantidade(item: EstanteProduto, quantidade: number): string | null {
  if (quantidade <= 0) return null
  if (!Number.isInteger(quantidade)) return 'Use um número inteiro'
  if (quantidade > item.quantidade) {
    const unidade = item.unidadeMedidaSigla ? ` ${item.unidadeMedidaSigla}` : ''
    return `Acima do saldo (máx. ${formatQuantidade(item.quantidade)}${unidade})`
  }
  return null
}
