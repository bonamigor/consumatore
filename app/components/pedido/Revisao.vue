<script setup lang="ts">
import type { LinhaPedido } from '~/utils/pedido'

defineProps<{
  linhas: LinhaPedido[]
  total: number
  escola: string
  edital: string
}>()

const observacao = defineModel<string>('observacao', { required: true })
const observacoesItens = defineModel<Record<number, string>>('observacoesItens', { required: true })

function atualizarObservacaoItem(produtoId: number, texto: string) {
  observacoesItens.value = { ...observacoesItens.value, [produtoId]: texto }
}
</script>

<template>
  <div class="space-y-6">
    <dl class="card grid gap-4 p-4 sm:grid-cols-3">
      <div>
        <dt class="text-xs text-gray-500">Escola</dt>
        <dd class="text-sm font-medium text-gray-900">{{ escola }}</dd>
      </div>
      <div>
        <dt class="text-xs text-gray-500">Edital / período</dt>
        <dd class="text-sm font-medium text-gray-900">{{ edital }}</dd>
      </div>
      <div>
        <dt class="text-xs text-gray-500">Total do pedido</dt>
        <dd class="text-sm font-semibold tabular-nums text-gray-900">{{ formatCurrency(total) }}</dd>
      </div>
    </dl>

    <div class="card overflow-x-auto">
      <table class="w-full min-w-[640px] text-sm">
        <thead class="border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
          <tr>
            <th class="px-4 py-2.5 text-left font-medium">Item</th>
            <th class="w-24 px-3 py-2.5 text-right font-medium">Quantidade</th>
            <th class="w-28 px-3 py-2.5 text-right font-medium">Preço un.</th>
            <th class="w-32 px-4 py-2.5 text-right font-medium">Subtotal</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          <tr v-for="linha in linhas" :key="linha.item.produtoId">
            <td class="px-4 py-2">
              <p class="text-gray-900">{{ linha.item.produtoNome }}</p>
              <input
                :value="observacoesItens[linha.item.produtoId] ?? ''"
                class="mt-1 w-full rounded border-0 border-b border-dashed border-gray-200 bg-transparent px-0 py-0.5 text-xs text-gray-600 placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-0"
                placeholder="Observação do item (opcional)"
                maxlength="255"
                :aria-label="`Observação de ${linha.item.produtoNome}`"
                @input="atualizarObservacaoItem(linha.item.produtoId, ($event.target as HTMLInputElement).value)"
              >
            </td>
            <td class="px-3 py-2 text-right tabular-nums text-gray-900">
              {{ formatQuantidade(linha.quantidade) }} {{ linha.item.unidadeMedidaSigla }}
            </td>
            <td class="px-3 py-2 text-right tabular-nums text-gray-700">{{ formatCurrency(linha.item.precoVenda) }}</td>
            <td class="px-4 py-2 text-right tabular-nums font-medium text-gray-900">{{ formatCurrency(linha.subtotal) }}</td>
          </tr>
        </tbody>
        <tfoot class="border-t border-gray-200 bg-gray-50">
          <tr>
            <td colspan="3" class="px-4 py-2.5 text-right text-sm font-medium text-gray-700">Total</td>
            <td class="px-4 py-2.5 text-right text-sm font-semibold tabular-nums text-gray-900">{{ formatCurrency(total) }}</td>
          </tr>
        </tfoot>
      </table>
    </div>

    <div>
      <label class="label" for="observacao-pedido">Observação do pedido</label>
      <textarea
        id="observacao-pedido"
        v-model="observacao"
        class="input"
        rows="3"
        maxlength="255"
        placeholder="Instruções de entrega, horário de recebimento ou outras informações para o fornecedor"
      />
    </div>
  </div>
</template>
