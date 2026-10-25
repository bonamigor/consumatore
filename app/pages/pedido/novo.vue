<script setup lang="ts">
import type { Cliente, Estante, EstanteProduto } from '~/types/api'
import type { LinhaPedido } from '~/utils/pedido'

definePageMeta({ middleware: 'auth' })

const auth = useAuthStore()
const clienteService = useClienteService()
const estanteService = useEstanteService()
const estanteProdutoService = useEstanteProdutoService()
const pedidoService = usePedidoService()
const rascunho = useRascunhoPedidoStore()
const route = useRoute()

const etapa = ref<'itens' | 'revisao'>('itens')
const carregando = ref(true)
const carregandoItens = ref(false)
const enviando = ref(false)
const erro = ref('')
const aviso = ref('')

const clientes = ref<Cliente[]>([])
const clienteId = ref<number | null>(Number(route.query.clienteId) || auth.session?.clienteId || null)
const estantes = ref<Estante[]>([])
const estanteId = ref<number | null>(null)
const itens = ref<EstanteProduto[]>([])

const busca = ref('')
const somentePreenchidos = ref(false)

const estanteAtual = computed(() => estantes.value.find(e => e.id === estanteId.value) ?? null)
const nomeEscola = computed(() =>
  clientes.value.find(c => c.id === clienteId.value)?.nome
  ?? estanteAtual.value?.clienteNome
  ?? '—',
)
const descricaoEdital = computed(() => {
  const e = estanteAtual.value
  if (!e) return '—'
  return e.observacao ? `${e.periodo} · ${e.observacao}` : e.periodo
})

const linhas = computed<LinhaPedido[]>(() =>
  itens.value.map((item) => {
    const quantidade = rascunho.quantidade(item.produtoId)
    return {
      item,
      quantidade,
      subtotal: quantidade * Number(item.precoVenda),
      erro: validarQuantidade(item, quantidade),
    }
  }),
)

const linhasVisiveis = computed(() => {
  const termo = busca.value.toLowerCase().trim()
  return linhas.value.filter(l =>
    (!somentePreenchidos.value || l.quantidade > 0)
    && (!termo || l.item.produtoNome.toLowerCase().includes(termo)),
  )
})

const linhasPreenchidas = computed(() => linhas.value.filter(l => l.quantidade > 0))
const linhasComErro = computed(() => linhasPreenchidas.value.filter(l => l.erro))
const total = computed(() =>
  linhasPreenchidas.value.filter(l => !l.erro).reduce((soma, l) => soma + l.subtotal, 0),
)

const salvoAs = computed(() =>
  rascunho.salvoEm
    ? new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(rascunho.salvoEm)
    : null,
)

async function carregarEstantes() {
  if (auth.isAdmin && !clientes.value.length) {
    clientes.value = await clienteService.listar()
    if (!clienteId.value && clientes.value.length) {
      clienteId.value = clientes.value[0].id
    }
  }
  if (!clienteId.value) {
    estantes.value = []
    estanteId.value = null
    erro.value = auth.isAdmin
      ? 'Selecione uma escola para montar o pedido.'
      : 'Seu usuário não está vinculado a uma escola. Fale com o administrador.'
    return
  }
  const pagina = await estanteService.listarPorCliente(clienteId.value, { size: 50, sort: 'periodo,desc' })
  estantes.value = (pagina.content || []).filter(e => e.ativa !== false)
  estanteId.value = estantes.value[0]?.id ?? null
}

async function carregarItens() {
  itens.value = []
  if (!estanteId.value || !clienteId.value || !auth.session) return
  rascunho.abrir({ usuarioId: auth.session.usuarioId, clienteId: clienteId.value, estanteId: estanteId.value })
  carregandoItens.value = true
  try {
    itens.value = await estanteProdutoService.listarDisponiveis(estanteId.value)
  }
  finally {
    carregandoItens.value = false
  }
}

async function executar(acao: () => Promise<void>, mensagem: string) {
  try {
    erro.value = ''
    await acao()
  }
  catch (e) {
    erro.value = e instanceof Error ? e.message : mensagem
  }
}

// O rascunho é salvo por edital, então trocar de escola ou edital não perde nada do que foi preenchido
watch(clienteId, () => !carregando.value && executar(async () => {
  aviso.value = ''
  await carregarEstantes()
}, 'Não foi possível carregar os editais da escola'))

watch(estanteId, () => executar(async () => {
  etapa.value = 'itens'
  aviso.value = ''
  await carregarItens()
}, 'Não foi possível carregar os itens do edital'))

onMounted(async () => {
  await executar(carregarEstantes, 'Não foi possível carregar os editais')
  carregando.value = false
})

function alterarQuantidade(produtoId: number, quantidade: number) {
  rascunho.definirQuantidade(produtoId, quantidade)
}

async function repetirUltimoPedido() {
  if (!clienteId.value) return
  if (rascunho.quantidadeItens && !confirm('Substituir as quantidades preenchidas pelas do último pedido?')) return
  await executar(async () => {
    const pagina = await pedidoService.listarPorCliente(clienteId.value!, { size: 10, sort: 'dataCriacao,desc' })
    const ultimo = (pagina.content || []).find(p => p.status !== 'CANCELADO')
    if (!ultimo) {
      aviso.value = 'Esta escola ainda não tem pedidos anteriores para repetir.'
      return
    }
    const noEdital = new Set(itens.value.map(i => i.produtoId))
    const quantidades: Record<number, number> = {}
    let foraDoEdital = 0
    for (const item of ultimo.itens ?? []) {
      if (noEdital.has(item.produto.id)) quantidades[item.produto.id] = Number(item.quantidade)
      else foraDoEdital++
    }
    rascunho.substituirQuantidades(quantidades)
    somentePreenchidos.value = true
    const data = formatDate(ultimo.dataCriacao)
    aviso.value = `Quantidades do pedido #${ultimo.id} (${data}) aplicadas. Revise antes de enviar.`
      + (foraDoEdital ? ` ${foraDoEdital === 1 ? '1 item não está' : `${foraDoEdital} itens não estão`} neste edital e ficou de fora.` : '')
  }, 'Não foi possível carregar o último pedido')
}

function irParaRevisao() {
  erro.value = ''
  if (!linhasPreenchidas.value.length) {
    erro.value = 'Preencha a quantidade de pelo menos um item.'
    return
  }
  if (linhasComErro.value.length) {
    somentePreenchidos.value = true
    erro.value = 'Corrija os itens destacados antes de revisar o pedido.'
    return
  }
  etapa.value = 'revisao'
}

async function enviarPedido() {
  if (!clienteId.value) return
  enviando.value = true
  await executar(async () => {
    const pedido = await pedidoService.criar({
      clienteId: clienteId.value!,
      observacao: rascunho.observacao.trim() || null,
      itens: linhasPreenchidas.value.map(l => ({
        produtoId: l.item.produtoId,
        estanteId: l.item.estanteId,
        quantidade: l.quantidade,
        observacao: rascunho.observacoesItens[l.item.produtoId]?.trim() || null,
      })),
    })
    rascunho.descartar()
    await navigateTo(`/pedidos/${pedido.id}`)
  }, 'Não foi possível enviar o pedido')
  enviando.value = false
}
</script>

<template>
  <div>
    <nav class="mb-1 text-sm text-gray-500">
      <NuxtLink :to="auth.isAdmin ? '/admin/pedidos' : '/pedidos'" class="hover:text-gray-700">Pedidos</NuxtLink>
      <span class="mx-1.5">/</span>
      <span class="text-gray-700">Novo pedido</span>
    </nav>

    <UiPageHeader
      :title="etapa === 'itens' ? 'Novo pedido' : 'Revisar pedido'"
      :description="etapa === 'itens'
        ? 'Informe as quantidades dos itens do edital.'
        : 'Confira os itens antes de enviar ao fornecedor.'"
    >
      <template #actions>
        <span v-if="salvoAs && etapa === 'itens'" class="flex items-center gap-1.5 self-center text-xs text-gray-500">
          <Icon name="lucide:cloud-check" class="h-4 w-4" />
          Rascunho salvo às {{ salvoAs }}
        </span>
        <button
          v-if="etapa === 'itens' && itens.length"
          type="button"
          class="btn-secondary"
          @click="repetirUltimoPedido"
        >
          <Icon name="lucide:history" class="h-4 w-4" />
          Repetir último pedido
        </button>
      </template>
    </UiPageHeader>

    <UiAlertBanner v-if="erro" type="error" :message="erro" class="mb-4" />
    <UiAlertBanner v-if="aviso && etapa === 'itens'" type="info" :message="aviso" class="mb-4" />
    <UiLoadingState v-if="carregando" />

    <template v-else-if="etapa === 'itens'">
      <div class="card mb-4 grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <label class="label" for="escola">Escola</label>
          <select v-if="auth.isAdmin" id="escola" v-model="clienteId" class="input">
            <option v-for="c in clientes" :key="c.id" :value="c.id">{{ c.nome }}</option>
          </select>
          <p v-else id="escola" class="py-2.5 text-sm font-medium text-gray-900">{{ nomeEscola }}</p>
        </div>
        <div>
          <label class="label" for="edital">Edital / período</label>
          <select id="edital" v-model="estanteId" class="input" :disabled="!estantes.length">
            <option v-for="e in estantes" :key="e.id" :value="e.id">
              {{ e.observacao ? `${e.periodo} · ${e.observacao}` : e.periodo }}
            </option>
          </select>
        </div>
        <div class="hidden lg:block">
          <p class="label">Itens no edital</p>
          <p class="py-2.5 text-sm tabular-nums text-gray-900">{{ itens.length }}</p>
        </div>
      </div>

      <UiEmptyState
        v-if="!estantes.length"
        message="Nenhum edital ativo para esta escola. Fale com o fornecedor."
      />
      <UiLoadingState v-else-if="carregandoItens" />
      <UiEmptyState
        v-else-if="!itens.length"
        message="Este edital não tem itens com saldo disponível."
      />

      <template v-else>
        <div class="mb-3 flex flex-wrap items-center gap-4">
          <div class="relative min-w-[16rem] flex-1">
            <Icon name="lucide:search" class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input v-model="busca" class="input pl-9" type="search" placeholder="Buscar item do edital" aria-label="Buscar item do edital">
          </div>
          <label class="flex items-center gap-2 text-sm text-gray-700">
            <input v-model="somentePreenchidos" type="checkbox" class="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500">
            Só itens com quantidade
          </label>
        </div>

        <PedidoTabelaItens v-if="linhasVisiveis.length" :linhas="linhasVisiveis" @alterar="alterarQuantidade" />
        <p v-else class="card p-6 text-center text-sm text-gray-500">
          {{ somentePreenchidos ? 'Nenhum item com quantidade ainda.' : 'Nenhum item encontrado para a busca.' }}
        </p>

        <PedidoBarraResumo
          :itens="linhasPreenchidas.length"
          :total="total"
          :erros="linhasComErro.length"
          rotulo="Revisar pedido"
          @acao="irParaRevisao"
        />
      </template>
    </template>

    <template v-else>
      <PedidoRevisao
        v-model:observacao="rascunho.observacao"
        v-model:observacoes-itens="rascunho.observacoesItens"
        :linhas="linhasPreenchidas"
        :total="total"
        :escola="nomeEscola"
        :edital="descricaoEdital"
      />
      <PedidoBarraResumo
        :itens="linhasPreenchidas.length"
        :total="total"
        :erros="0"
        rotulo="Enviar pedido"
        :carregando="enviando"
        @acao="enviarPedido"
      >
        <button type="button" class="btn-secondary ml-auto" @click="etapa = 'itens'">
          <Icon name="lucide:arrow-left" class="h-4 w-4" />
          Voltar e editar
        </button>
      </PedidoBarraResumo>
    </template>
  </div>
</template>
