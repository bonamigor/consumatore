<script setup lang="ts">
import type { LinhaPedido } from '~/utils/pedido'

defineProps<{
  linhas: LinhaPedido[]
}>()

const emit = defineEmits<{
  alterar: [produtoId: number, quantidade: number]
}>()

function onChange(produtoId: number, evento: Event) {
  emit('alterar', produtoId, lerQuantidade((evento.target as HTMLInputElement).value))
}

/** Enter leva ao próximo campo de quantidade, para preencher o pedido só pelo teclado. */
function focarProximo(evento: KeyboardEvent) {
  const atual = evento.target as HTMLInputElement
  const grupo = atual.dataset.grupo
  const campos = Array.from(document.querySelectorAll<HTMLInputElement>(`input[data-grupo="${grupo}"]`))
  const proximo = campos[campos.indexOf(atual) + 1]
  atual.dispatchEvent(new Event('change'))
  if (proximo) {
    proximo.focus()
    proximo.select()
  }
}
</script>

<template>
  <div>
    <!-- Desktop: tabela -->
    <div class="card hidden overflow-hidden md:block">
      <table class="w-full text-sm">
        <thead class="border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
          <tr>
            <th class="px-4 py-2.5 text-left font-medium">Item</th>
            <th class="w-16 px-3 py-2.5 text-left font-medium">Un.</th>
            <th class="w-28 px-3 py-2.5 text-right font-medium">Preço un.</th>
            <th class="w-24 px-3 py-2.5 text-right font-medium">Saldo</th>
            <th class="w-32 px-3 py-2.5 text-right font-medium">Quantidade</th>
            <th class="w-32 px-4 py-2.5 text-right font-medium">Subtotal</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          <tr
            v-for="linha in linhas"
            :key="linha.item.produtoId"
            :class="linha.erro ? 'bg-red-50/60' : linha.quantidade > 0 ? 'bg-brand-50/60' : ''"
          >
            <td class="px-4 py-2 text-gray-900">
              {{ linha.item.produtoNome }}
              <p v-if="linha.erro" class="text-xs text-red-700">{{ linha.erro }}</p>
            </td>
            <td class="px-3 py-2 text-gray-600" :title="linha.item.unidadeMedidaDescricao ?? undefined">
              {{ linha.item.unidadeMedidaSigla || '—' }}
            </td>
            <td class="px-3 py-2 text-right tabular-nums text-gray-700">{{ formatCurrency(linha.item.precoVenda) }}</td>
            <td class="px-3 py-2 text-right tabular-nums text-gray-500">{{ formatQuantidade(linha.item.quantidade) }}</td>
            <td class="px-3 py-1.5 text-right">
              <input
                :value="linha.quantidade > 0 ? formatQuantidade(linha.quantidade, 6) : ''"
                data-grupo="desktop"
                class="input w-24 py-1.5 text-right tabular-nums"
                :class="linha.erro ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20' : ''"
                inputmode="decimal"
                autocomplete="off"
                :aria-label="`Quantidade de ${linha.item.produtoNome}`"
                :aria-invalid="!!linha.erro"
                @change="onChange(linha.item.produtoId, $event)"
                @keydown.enter.prevent="focarProximo"
              >
            </td>
            <td class="px-4 py-2 text-right tabular-nums font-medium text-gray-900">
              {{ linha.quantidade > 0 && !linha.erro ? formatCurrency(linha.subtotal) : '—' }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Celular: lista compacta -->
    <ul class="card divide-y divide-gray-100 md:hidden">
      <li
        v-for="linha in linhas"
        :key="linha.item.produtoId"
        class="flex items-center gap-3 px-4 py-3"
        :class="linha.erro ? 'bg-red-50/60' : linha.quantidade > 0 ? 'bg-brand-50/60' : ''"
      >
        <div class="min-w-0 flex-1">
          <p class="text-sm text-gray-900">{{ linha.item.produtoNome }}</p>
          <p class="text-xs tabular-nums text-gray-500">
            {{ formatCurrency(linha.item.precoVenda) }}/{{ linha.item.unidadeMedidaSigla || 'un.' }}
            · saldo {{ formatQuantidade(linha.item.quantidade) }}
          </p>
          <p v-if="linha.erro" class="text-xs text-red-700">{{ linha.erro }}</p>
        </div>
        <input
          :value="linha.quantidade > 0 ? formatQuantidade(linha.quantidade, 6) : ''"
          data-grupo="mobile"
          class="input w-20 py-1.5 text-right tabular-nums"
          :class="linha.erro ? 'border-red-400' : ''"
          inputmode="decimal"
          autocomplete="off"
          :aria-label="`Quantidade de ${linha.item.produtoNome}`"
          :aria-invalid="!!linha.erro"
          @change="onChange(linha.item.produtoId, $event)"
          @keydown.enter.prevent="focarProximo"
        >
      </li>
    </ul>
  </div>
</template>
