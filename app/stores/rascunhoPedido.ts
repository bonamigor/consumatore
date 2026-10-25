import { watchDebounced } from '@vueuse/core'

/**
 * Rascunho do pedido em montagem: quantidades e observações por item do edital.
 * É salvo no navegador por usuário + escola + edital, então recarregar a página ou
 * alternar entre editais não perde o que foi preenchido. O logout apaga todos.
 */
const PREFIXO = 'cameriere:rascunho-pedido:'

interface RascunhoSalvo {
  quantidades: Record<number, number>
  observacoesItens: Record<number, string>
  observacao: string
  salvoEm: number
}

export interface ContextoRascunho {
  usuarioId: number
  clienteId: number
  estanteId: number
}

function lerStorage(chave: string): RascunhoSalvo | null {
  try {
    const bruto = localStorage.getItem(chave)
    return bruto ? JSON.parse(bruto) as RascunhoSalvo : null
  }
  catch {
    return null
  }
}

export const useRascunhoPedidoStore = defineStore('rascunhoPedido', () => {
  const chave = ref<string | null>(null)
  const quantidades = ref<Record<number, number>>({})
  const observacoesItens = ref<Record<number, string>>({})
  const observacao = ref('')
  const salvoEm = ref<number | null>(null)

  const quantidadeItens = computed(() =>
    Object.values(quantidades.value).filter(q => q > 0).length,
  )

  /** Troca o rascunho ativo para o edital informado, carregando o que estiver salvo. */
  function abrir(contexto: ContextoRascunho) {
    chave.value = `${PREFIXO}${contexto.usuarioId}:${contexto.clienteId}:${contexto.estanteId}`
    const salvo = import.meta.client ? lerStorage(chave.value) : null
    quantidades.value = salvo?.quantidades ?? {}
    observacoesItens.value = salvo?.observacoesItens ?? {}
    observacao.value = salvo?.observacao ?? ''
    salvoEm.value = salvo?.salvoEm ?? null
  }

  function quantidade(produtoId: number) {
    return quantidades.value[produtoId] ?? 0
  }

  function definirQuantidade(produtoId: number, valor: number) {
    const copia = { ...quantidades.value }
    if (valor > 0) copia[produtoId] = valor
    else delete copia[produtoId]
    quantidades.value = copia
  }

  function definirObservacaoItem(produtoId: number, texto: string) {
    observacoesItens.value = { ...observacoesItens.value, [produtoId]: texto }
  }

  function substituirQuantidades(novas: Record<number, number>) {
    quantidades.value = { ...novas }
  }

  function salvar() {
    if (!import.meta.client || !chave.value) return
    const vazio = !quantidadeItens.value && !observacao.value.trim()
    try {
      if (vazio) {
        localStorage.removeItem(chave.value)
        salvoEm.value = null
        return
      }
      salvoEm.value = Date.now()
      const dados: RascunhoSalvo = {
        quantidades: quantidades.value,
        observacoesItens: observacoesItens.value,
        observacao: observacao.value,
        salvoEm: salvoEm.value,
      }
      localStorage.setItem(chave.value, JSON.stringify(dados))
    }
    catch {
      // Navegação privada ou armazenamento cheio: o rascunho só não sobrevive ao recarregar
    }
  }

  /** Descarta o rascunho do edital ativo (ex.: depois de enviar o pedido). */
  function descartar() {
    quantidades.value = {}
    observacoesItens.value = {}
    observacao.value = ''
    salvoEm.value = null
    if (import.meta.client && chave.value) {
      try {
        localStorage.removeItem(chave.value)
      }
      catch {
        // ignora indisponibilidade do armazenamento
      }
    }
  }

  /** Apaga os rascunhos de todos os editais deste navegador (logout). */
  function descartarTodos() {
    descartar()
    chave.value = null
    if (!import.meta.client) return
    try {
      Object.keys(localStorage)
        .filter(k => k.startsWith(PREFIXO))
        .forEach(k => localStorage.removeItem(k))
    }
    catch {
      // ignora indisponibilidade do armazenamento
    }
  }

  watchDebounced([quantidades, observacoesItens, observacao], salvar, { debounce: 600, deep: true })

  return {
    quantidades,
    observacoesItens,
    observacao,
    salvoEm,
    quantidadeItens,
    abrir,
    quantidade,
    definirQuantidade,
    definirObservacaoItem,
    substituirQuantidades,
    descartar,
    descartarTodos,
  }
})
