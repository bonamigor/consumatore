<script setup lang="ts">
import type { Cliente } from '~/types/api'
import { formatCnpj } from '~/utils/format'

const props = withDefaults(defineProps<{
  modelValue: number | null
  clientes: Cliente[]
  placeholder?: string
  required?: boolean
}>(), {
  placeholder: 'Buscar escola por nome ou CNPJ...',
  required: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: number | null]
}>()

const open = ref(false)
const query = ref('')
const root = ref<HTMLElement | null>(null)
const inputRef = ref<HTMLInputElement | null>(null)

const selected = computed(() =>
  props.clientes.find(c => c.id === props.modelValue) ?? null,
)

const filtered = computed(() => {
  const term = query.value.toLowerCase().trim()
  if (!term) return props.clientes
  return props.clientes.filter((c) => {
    const nome = c.nome.toLowerCase()
    const cnpj = (c.cnpj || '').replace(/\D/g, '')
    const termDigits = term.replace(/\D/g, '')
    return nome.includes(term)
      || (termDigits.length > 0 && cnpj.includes(termDigits))
      || (c.email || '').toLowerCase().includes(term)
  })
})

function displayLabel(c: Cliente) {
  return `${c.nome} — ${formatCnpj(c.cnpj)}`
}

function selectCliente(c: Cliente) {
  emit('update:modelValue', c.id)
  query.value = ''
  open.value = false
}

function clearSelection() {
  emit('update:modelValue', null)
  query.value = ''
  open.value = true
  nextTick(() => inputRef.value?.focus())
}

function onFocus() {
  open.value = true
}

function onInput() {
  open.value = true
  if (props.modelValue != null) {
    emit('update:modelValue', null)
  }
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    open.value = false
    query.value = ''
  }
  if (e.key === 'Enter' && filtered.value.length === 1) {
    e.preventDefault()
    selectCliente(filtered.value[0])
  }
}

function onClickOutside(e: MouseEvent) {
  if (!root.value?.contains(e.target as Node)) {
    open.value = false
    query.value = ''
  }
}

onMounted(() => document.addEventListener('mousedown', onClickOutside))
onBeforeUnmount(() => document.removeEventListener('mousedown', onClickOutside))
</script>

<template>
  <div ref="root" class="relative">
    <div
      class="input flex min-h-[42px] cursor-text items-center gap-2 py-1.5"
      :class="{ 'ring-2 ring-brand-500/20 border-brand-500': open }"
      @click="inputRef?.focus(); open = true"
    >
      <Icon name="lucide:search" class="h-4 w-4 shrink-0 text-gray-400" />

      <template v-if="selected && !query">
        <span class="flex-1 truncate text-sm text-gray-900">{{ displayLabel(selected) }}</span>
        <button
          type="button"
          class="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
          aria-label="Limpar escola"
          @click.stop="clearSelection"
        >
          <Icon name="lucide:x" class="h-4 w-4" />
        </button>
      </template>

      <input
        v-else
        ref="inputRef"
        v-model="query"
        type="search"
        class="min-w-0 flex-1 border-0 bg-transparent p-0 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:ring-0"
        :placeholder="placeholder"
        :required="required && !modelValue"
        autocomplete="off"
        @focus="onFocus"
        @input="onInput"
        @keydown="onKeydown"
      >
    </div>

    <div
      v-if="open"
      class="absolute z-20 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
    >
      <p v-if="!filtered.length" class="px-3 py-2 text-sm text-gray-500">
        Nenhuma escola encontrada
      </p>
      <button
        v-for="c in filtered"
        :key="c.id"
        type="button"
        class="flex w-full flex-col px-3 py-2 text-left text-sm hover:bg-brand-50"
        :class="c.id === modelValue ? 'bg-brand-50 text-brand-700' : 'text-gray-900'"
        @click="selectCliente(c)"
      >
        <span class="font-medium">{{ c.nome }}</span>
        <span class="text-xs text-gray-500">{{ formatCnpj(c.cnpj) }}</span>
      </button>
    </div>
  </div>
</template>
