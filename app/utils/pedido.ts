import type { EstanteProduto } from '~/types/api'

/** Uma linha da tabela de itens do edital, com o que foi preenchido no rascunho. */
export interface LinhaPedido {
  item: EstanteProduto
  quantidade: number
  subtotal: number
  erro: string | null
}

/** Exibe a quantidade em pt-BR; nos campos de edição use mais casas para não mascarar o que foi digitado. */
export function formatQuantidade(valor: number, casas = 3): string {
  return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: casas }).format(valor)
}

/**
 * Converte o texto digitado em número; vazio ou inválido vale 0. Aceita "12", "1.200" (milhar)
 * e "12,5"; um ponto fora do padrão de milhar ("12.5") é lido como decimal, nunca como 125.
 */
export function lerQuantidade(texto: string): number {
  let limpo = texto.trim().replace(/\s/g, '')
  if (limpo.includes(',')) limpo = limpo.replace(/\./g, '').replace(',', '.')
  // "1.200" é milhar; "0.250" não (seria 0,250), então o primeiro grupo não pode começar com 0
  else if (/^[1-9]\d{0,2}(\.\d{3})+$/.test(limpo)) limpo = limpo.replace(/\./g, '')
  if (!limpo) return 0
  const valor = Number(limpo)
  return Number.isFinite(valor) && valor > 0 ? valor : 0
}

/** Mesma precisão do saldo do edital na API (3 casas, ex.: 35,5 kg ou 0,250 kg). */
export const CASAS_DECIMAIS_QUANTIDADE = 3

function temMaisCasasQue(valor: number, casas: number): boolean {
  const escalado = valor * 10 ** casas
  return Math.abs(escalado - Math.round(escalado)) > 1e-6
}

/** A quantidade aceita até 3 casas decimais e não pode passar do saldo disponível. */
export function validarQuantidade(item: EstanteProduto, quantidade: number): string | null {
  if (quantidade <= 0) return null
  if (temMaisCasasQue(quantidade, CASAS_DECIMAIS_QUANTIDADE)) return 'Use no máximo 3 casas decimais'
  if (quantidade > item.quantidade) {
    const unidade = item.unidadeMedidaSigla ? ` ${item.unidadeMedidaSigla}` : ''
    return `Acima do saldo (máx. ${formatQuantidade(item.quantidade)}${unidade})`
  }
  return null
}
