<script setup lang="ts">
import type { Empresa, Pedido } from '~/types/api'
import { formatCnpj, formatCurrency, formatDate, formatDateTime } from '~/utils/format'

definePageMeta({ middleware: 'auth' })

const route = useRoute()
const pedidoService = usePedidoService()
const empresaService = useEmpresaService()
const auth = useAuthStore()

const loading = ref(true)
const acting = ref(false)
const error = ref('')
const success = ref('')
const pedido = ref<Pedido | null>(null)
const empresas = ref<Empresa[]>([])
const selectedEmpresaId = ref<number | null>(null)
const showCancel = ref(false)
const showConfirm = ref(false)
const motivoCancelamento = ref('')
const dataPrevisaoEntrega = ref('')

const id = computed(() => Number(route.params.id))
const backTo = computed(() => (auth.isAdmin ? '/admin/pedidos' : '/pedidos'))
const pageDescription = computed(() =>
  auth.isAdmin
    ? 'Acompanhe e gerencie o ciclo de vida do pedido'
    : 'Acompanhe o status e os detalhes do seu pedido',
)

function defaultPrevisaoDate() {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return d.toISOString().slice(0, 10)
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    pedido.value = await pedidoService.buscar(id.value)
    selectedEmpresaId.value = pedido.value.empresaNota?.id || pedido.value.cliente?.empresaId || null
    if (auth.isAdmin && pedido.value.status === 'CONFIRMADO') {
      empresas.value = await empresaService.listarAtivas()
    }
  }
  catch (e) {
    error.value = e instanceof Error ? e.message : 'Erro ao carregar pedido'
  }
  finally {
    loading.value = false
  }
}

async function salvarEmpresaNota() {
  if (!selectedEmpresaId.value) {
    error.value = 'Selecione a empresa da nota'
    return
  }
  acting.value = true
  error.value = ''
  try {
    pedido.value = await pedidoService.atualizarEmpresaNota(id.value, selectedEmpresaId.value)
    success.value = 'Empresa da nota atualizada.'
  }
  catch (e) {
    error.value = e instanceof Error ? e.message : 'Erro ao atualizar empresa da nota'
  }
  finally {
    acting.value = false
  }
}

function safe(value?: string | number | null) {
  const chars: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  }
  return String(value ?? '').replace(/[&<>"']/g, char => chars[char] || char)
}

function enderecoLinha(endereco?: {
  logradouro?: string | null
  numero?: string | null
  bairro?: string | null
  cep?: string | null
} | null) {
  const rua = [endereco?.logradouro, endereco?.numero].filter(Boolean).join(', ')
  return [rua, endereco?.bairro, endereco?.cep].filter(Boolean).join(', ')
}

function cidadeEstado(endereco?: { cidade?: string | null, estado?: string | null } | null) {
  return [endereco?.cidade, endereco?.estado].filter(Boolean).join(' / ')
}

function imprimirNota() {
  if (!pedido.value || pedido.value.status !== 'CONFIRMADO') return
  const empresa = pedido.value.empresaNota || empresas.value.find(e => e.id === selectedEmpresaId.value)
  if (!empresa) {
    error.value = 'Selecione e salve uma empresa para imprimir a nota.'
    return
  }

  const itens = pedido.value.itens.map(item => `
    <tr>
      <td>${safe(item.produto?.nome)}</td>
      <td>${safe(item.produto?.unidadeMedida || '')}</td>
      <td>${safe(item.quantidade)}</td>
      <td>${formatCurrency(item.precoUnitario)}</td>
      <td>${formatCurrency(item.precoTotal)}</td>
    </tr>
  `).join('')
  const via = `
    <section class="via">
      <h1>${safe(empresa.nome)}</h1>
      <p><strong>CNPJ:</strong> ${safe(formatCnpj(empresa.cnpj))}</p>
      <p><strong>Endereço:</strong> ${safe(enderecoLinha(empresa.endereco))}</p>
      <p><strong>Cidade / Estado:</strong> ${safe(cidadeEstado(empresa.endereco))}</p>
      <hr>
      <h2>Pedido ${pedido.value.id}</h2>
      <p><strong>Escola:</strong> ${safe(pedido.value.cliente?.id)} - ${safe(pedido.value.cliente?.nome)}</p>
      <p><strong>Endereço:</strong> ${safe(enderecoLinha(pedido.value.cliente?.endereco))}</p>
      <p><strong>Cidade/Estado:</strong> ${safe(cidadeEstado(pedido.value.cliente?.endereco))}</p>
      <p><strong>Telefone:</strong> ${safe(pedido.value.cliente?.telefone || '')}</p>
      <p><strong>Data de Entrega:</strong> ${safe(formatDate(pedido.value.dataPrevisaoEntrega))}</p>
      <table>
        <thead>
          <tr><th>Nome</th><th>Med</th><th>Qtde</th><th>Preço</th><th>Total</th></tr>
        </thead>
        <tbody>${itens}</tbody>
      </table>
      <p class="total"><strong>Valor Total:</strong> ${formatCurrency(pedido.value.valorTotal)}</p>
      <div class="lines">
        <p>Observação: __________________________________________</p>
        <p>Assinatura: __________________________________________</p>
        <p>Data: ____/____/________</p>
      </div>
    </section>
  `

  const printWindow = window.open('', '_blank', 'width=900,height=700')
  if (!printWindow) return
  printWindow.document.write(`
    <!doctype html>
    <html>
      <head>
        <title>Pedido ${pedido.value.id}</title>
        <style>
          @page { size: A4 landscape; margin: 8mm; }
          * { box-sizing: border-box; }
          body { margin: 0; font-family: Arial, sans-serif; color: #111827; font-size: 11px; }
          .page { display: grid; grid-template-columns: 1fr 1fr; gap: 8mm; height: 100%; }
          .via { min-height: 190mm; border-right: 1px dashed #9ca3af; padding-right: 5mm; }
          .via + .via { border-right: 0; padding-left: 0; }
          h1 { margin: 0 0 4px; font-size: 14px; }
          h2 { margin: 8px 0 4px; font-size: 13px; }
          p { margin: 3px 0; }
          hr { border: 0; border-top: 1px solid #111827; margin: 8px 0; }
          table { width: 100%; border-collapse: collapse; margin-top: 8px; }
          th, td { border-bottom: 1px solid #d1d5db; padding: 4px 2px; text-align: left; }
          th { font-weight: 700; }
          .total { margin-top: 8px; text-align: right; font-size: 12px; }
          .lines { margin-top: 18px; }
        </style>
      </head>
      <body>
        <main class="page">${via}${via}</main>
        <script>window.onload = () => { window.print(); window.close(); }<\/script>
      </body>
    </html>
  `)
  printWindow.document.close()
}

function openConfirm() {
  dataPrevisaoEntrega.value = defaultPrevisaoDate()
  showConfirm.value = true
}

async function confirmar() {
  if (!dataPrevisaoEntrega.value) {
    error.value = 'Informe a data prevista de entrega'
    return
  }
  acting.value = true
  error.value = ''
  try {
    pedido.value = await pedidoService.confirmar(id.value, dataPrevisaoEntrega.value)
    showConfirm.value = false
    success.value = 'Pedido confirmado com previsão de entrega.'
  }
  catch (e) {
    error.value = e instanceof Error ? e.message : 'Erro ao confirmar'
  }
  finally {
    acting.value = false
  }
}

async function entregar() {
  acting.value = true
  error.value = ''
  try {
    pedido.value = await pedidoService.entregar(id.value)
    success.value = 'Pedido marcado como entregue.'
  }
  catch (e) {
    error.value = e instanceof Error ? e.message : 'Erro ao entregar'
  }
  finally {
    acting.value = false
  }
}

async function cancelar() {
  if (!motivoCancelamento.value.trim()) {
    error.value = 'Informe o motivo do cancelamento'
    return
  }
  acting.value = true
  error.value = ''
  try {
    await pedidoService.cancelar(id.value, motivoCancelamento.value.trim())
    showCancel.value = false
    success.value = 'Pedido cancelado.'
    await load()
  }
  catch (e) {
    error.value = e instanceof Error ? e.message : 'Erro ao cancelar'
  }
  finally {
    acting.value = false
  }
}

onMounted(load)
</script>

<template>
  <div>
    <UiPageHeader title="Detalhe do Pedido" :description="pageDescription">
      <template #actions>
        <NuxtLink :to="backTo" class="btn-secondary">
          <Icon name="lucide:arrow-left" class="h-4 w-4" />
          Voltar
        </NuxtLink>
      </template>
    </UiPageHeader>

    <UiAlertBanner v-if="error" type="error" :message="error" class="mb-4" />
    <UiAlertBanner v-if="success" type="success" :message="success" class="mb-4" />
    <UiLoadingState v-if="loading" />

    <template v-else-if="pedido">
      <div class="mb-6 flex flex-wrap items-center gap-4">
        <h3 class="text-2xl font-bold text-gray-900">Pedido #{{ pedido.id }}</h3>
        <PedidosStatusBadge :status="pedido.status" />
      </div>

      <div class="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div class="card space-y-3 p-6 lg:col-span-1">
          <div class="flex justify-between gap-4">
            <span class="text-gray-600">Escola</span>
            <span class="text-right font-medium">{{ pedido.cliente?.nome }}</span>
          </div>
          <div class="flex justify-between gap-4">
            <span class="text-gray-600">Criado em</span>
            <span class="font-medium">{{ formatDateTime(pedido.dataCriacao) }}</span>
          </div>
          <div v-if="pedido.dataConfirmacao" class="flex justify-between gap-4">
            <span class="text-gray-600">Confirmado em</span>
            <span class="font-medium">{{ formatDateTime(pedido.dataConfirmacao) }}</span>
          </div>
          <div v-if="pedido.dataPrevisaoEntrega" class="flex justify-between gap-4">
            <span class="text-gray-600">Previsão de entrega</span>
            <span class="font-medium">{{ formatDate(pedido.dataPrevisaoEntrega) }}</span>
          </div>
          <div v-if="pedido.dataEntrega" class="flex justify-between gap-4">
            <span class="text-gray-600">Entregue em</span>
            <span class="font-medium">{{ formatDateTime(pedido.dataEntrega) }}</span>
          </div>
          <div v-if="pedido.dataCancelamento" class="flex justify-between gap-4">
            <span class="text-gray-600">Cancelado em</span>
            <span class="font-medium">{{ formatDateTime(pedido.dataCancelamento) }}</span>
          </div>
          <div v-if="pedido.observacao" class="border-t border-gray-100 pt-3">
            <p class="text-sm text-gray-600">Observação</p>
            <p class="font-medium">{{ pedido.observacao }}</p>
          </div>
          <div v-if="pedido.obsCancelamento" class="border-t border-gray-100 pt-3">
            <p class="text-sm text-gray-600">Motivo cancelamento</p>
            <p class="font-medium text-red-700">{{ pedido.obsCancelamento }}</p>
          </div>
          <div class="flex justify-between border-t border-gray-100 pt-3 text-lg">
            <span class="font-bold">Total</span>
            <span class="font-bold">{{ formatCurrency(pedido.valorTotal) }}</span>
          </div>

          <div v-if="pedido.status === 'CONFIRMADO'" class="space-y-3 border-t border-gray-100 pt-3">
            <div v-if="auth.isAdmin">
              <label class="label">Empresa da nota</label>
              <select v-model="selectedEmpresaId" class="input">
                <option :value="null">Selecione uma empresa</option>
                <option v-for="empresa in empresas" :key="empresa.id" :value="empresa.id">
                  {{ empresa.nome }}
                </option>
              </select>
              <button
                type="button"
                class="btn-secondary mt-2 w-full"
                :disabled="acting || !selectedEmpresaId"
                @click="salvarEmpresaNota"
              >
                Salvar empresa da nota
              </button>
            </div>
            <div v-else-if="pedido.empresaNota" class="flex justify-between gap-4">
              <span class="text-gray-600">Empresa da nota</span>
              <span class="text-right font-medium">{{ pedido.empresaNota.nome }}</span>
            </div>
            <button
              type="button"
              class="btn-primary w-full"
              :disabled="!pedido.empresaNota && !selectedEmpresaId"
              @click="imprimirNota"
            >
              <Icon name="lucide:printer" class="h-4 w-4" />
              Imprimir notinha
            </button>
          </div>

          <div v-if="auth.isAdmin" class="flex flex-col gap-2 pt-2">
            <button
              v-if="pedido.status === 'PENDENTE'"
              type="button"
              class="btn-primary"
              :disabled="acting"
              @click="openConfirm"
            >
              Confirmar pedido
            </button>
            <button
              v-if="pedido.status === 'CONFIRMADO'"
              type="button"
              class="btn-success"
              :disabled="acting"
              @click="entregar"
            >
              Marcar como entregue
            </button>
            <button
              v-if="pedido.status === 'PENDENTE' || pedido.status === 'CONFIRMADO'"
              type="button"
              class="btn-danger"
              :disabled="acting"
              @click="showCancel = true"
            >
              Cancelar pedido
            </button>
          </div>
        </div>

        <div class="card overflow-hidden lg:col-span-2">
          <div class="border-b border-gray-200 px-6 py-4">
            <h4 class="font-bold text-gray-900">Itens do pedido</h4>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead class="bg-gray-50">
                <tr>
                  <th class="table-th">Produto</th>
                  <th class="table-th">Qtd</th>
                  <th class="table-th">Unitário</th>
                  <th class="table-th">Total</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200">
                <tr v-for="item in pedido.itens" :key="item.id">
                  <td class="table-td font-medium text-gray-900">
                    {{ item.produto?.nome }}
                    <span v-if="item.produto?.unidadeMedida" class="text-xs text-gray-500">
                      ({{ item.produto.unidadeMedida }})
                    </span>
                  </td>
                  <td class="table-td">{{ item.quantidade }}</td>
                  <td class="table-td">{{ formatCurrency(item.precoUnitario) }}</td>
                  <td class="table-td font-medium">{{ formatCurrency(item.precoTotal) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div class="card p-6">
        <h4 class="mb-4 font-bold text-gray-900">Histórico</h4>
        <div class="space-y-3">
          <div class="flex items-start gap-3">
            <div class="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
              <Icon name="lucide:check-circle" class="h-4 w-4 text-green-600" />
            </div>
            <div>
              <p class="font-medium">Pedido recebido</p>
              <p class="text-sm text-gray-500">{{ formatDateTime(pedido.dataCriacao) }}</p>
            </div>
          </div>
          <div v-if="pedido.dataConfirmacao" class="flex items-start gap-3">
            <div class="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
              <Icon name="lucide:package" class="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <p class="font-medium">Confirmado</p>
              <p class="text-sm text-gray-500">{{ formatDateTime(pedido.dataConfirmacao) }}</p>
              <p v-if="pedido.dataPrevisaoEntrega" class="text-sm text-gray-500">
                Previsão de entrega: {{ formatDate(pedido.dataPrevisaoEntrega) }}
              </p>
            </div>
          </div>
          <div v-if="pedido.dataEntrega" class="flex items-start gap-3">
            <div class="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
              <Icon name="lucide:check-circle" class="h-4 w-4 text-green-600" />
            </div>
            <div>
              <p class="font-medium">Entregue de fato</p>
              <p class="text-sm text-gray-500">{{ formatDateTime(pedido.dataEntrega) }}</p>
            </div>
          </div>
          <div v-if="pedido.dataCancelamento" class="flex items-start gap-3">
            <div class="flex h-8 w-8 items-center justify-center rounded-full bg-red-100">
              <Icon name="lucide:x-circle" class="h-4 w-4 text-red-600" />
            </div>
            <div>
              <p class="font-medium">Cancelado</p>
              <p class="text-sm text-gray-500">{{ formatDateTime(pedido.dataCancelamento) }}</p>
            </div>
          </div>
        </div>
      </div>
    </template>

    <UiAppModal
      v-if="auth.isAdmin"
      :open="showConfirm"
      title="Confirmar pedido"
      @close="showConfirm = false"
    >
      <div class="space-y-3">
        <p class="text-sm text-gray-600">
          Informe a data prevista de entrega. Ela pode ser diferente da data em que o pedido for entregue de fato.
        </p>
        <div>
          <label class="label" for="data-previsao">Data prevista de entrega</label>
          <input
            id="data-previsao"
            v-model="dataPrevisaoEntrega"
            class="input"
            type="date"
            required
          >
        </div>
      </div>
      <template #footer>
        <button type="button" class="btn-secondary" @click="showConfirm = false">Voltar</button>
        <button type="button" class="btn-primary" :disabled="acting" @click="confirmar">
          Confirmar
        </button>
      </template>
    </UiAppModal>

    <UiAppModal
      v-if="auth.isAdmin"
      :open="showCancel"
      title="Cancelar pedido"
      @close="showCancel = false"
    >
      <div>
        <label class="label">Motivo</label>
        <textarea v-model="motivoCancelamento" class="input" rows="3" required />
      </div>
      <template #footer>
        <button type="button" class="btn-secondary" @click="showCancel = false">Voltar</button>
        <button type="button" class="btn-danger" :disabled="acting" @click="cancelar">
          Confirmar cancelamento
        </button>
      </template>
    </UiAppModal>
  </div>
</template>
