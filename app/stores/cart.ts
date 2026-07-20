export interface CartItem {
  produtoId: number
  estanteId: number
  produtoNome: string
  precoVenda: number
  unidade?: string
  quantidadeDisponivel: number
  quantidade: number
}

export const useCartStore = defineStore('cart', () => {
  const items = ref<CartItem[]>([])
  const observacao = ref('')

  const totalItems = computed(() =>
    items.value.reduce((sum, item) => sum + item.quantidade, 0),
  )

  const totalValue = computed(() =>
    items.value.reduce((sum, item) => sum + item.quantidade * item.precoVenda, 0),
  )

  function addItem(item: Omit<CartItem, 'quantidade'>, qty = 1) {
    const existing = items.value.find(
      i => i.produtoId === item.produtoId && i.estanteId === item.estanteId,
    )
    if (existing) {
      existing.quantidade = Math.min(
        existing.quantidadeDisponivel,
        existing.quantidade + qty,
      )
      return
    }
    items.value.push({ ...item, quantidade: Math.min(item.quantidadeDisponivel, qty) })
  }

  function updateQuantity(produtoId: number, estanteId: number, delta: number) {
    const existing = items.value.find(
      i => i.produtoId === produtoId && i.estanteId === estanteId,
    )
    if (!existing) return
    existing.quantidade = Math.min(
      existing.quantidadeDisponivel,
      Math.max(0, existing.quantidade + delta),
    )
    if (existing.quantidade <= 0) {
      removeItem(produtoId, estanteId)
    }
  }

  function setQuantity(produtoId: number, estanteId: number, quantidade: number) {
    const existing = items.value.find(
      i => i.produtoId === produtoId && i.estanteId === estanteId,
    )
    if (!existing) return
    existing.quantidade = Math.min(existing.quantidadeDisponivel, Math.max(0, quantidade))
    if (existing.quantidade <= 0) {
      removeItem(produtoId, estanteId)
    }
  }

  function removeItem(produtoId: number, estanteId: number) {
    items.value = items.value.filter(
      i => !(i.produtoId === produtoId && i.estanteId === estanteId),
    )
  }

  function getQuantity(produtoId: number, estanteId: number) {
    return items.value.find(
      i => i.produtoId === produtoId && i.estanteId === estanteId,
    )?.quantidade ?? 0
  }

  function clear() {
    items.value = []
    observacao.value = ''
  }

  return {
    items,
    observacao,
    totalItems,
    totalValue,
    addItem,
    updateQuantity,
    setQuantity,
    removeItem,
    getQuantity,
    clear,
  }
})
