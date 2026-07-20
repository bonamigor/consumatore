import type { ApiProblem } from '~/types/api'

export function formatCurrency(value: number | string | null | undefined): string {
  const n = Number(value ?? 0)
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(n)
}

export function formatDate(value?: string | null): string {
  if (!value) return '—'
  // Datas ISO só com dia (yyyy-MM-dd) evitam shift de timezone
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m, d] = value.split('-').map(Number)
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date(y, m - 1, d))
  }
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(value))
}

export function formatDateTime(value?: string | null): string {
  if (!value) return '—'
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

export function formatCnpj(value?: string | null): string {
  if (!value) return '—'
  const digits = value.replace(/\D/g, '')
  if (digits.length !== 14) return value
  return digits.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5')
}

export function maskCnpj(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 14)
  return digits
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
}

export function maskCep(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 8)
  return digits.replace(/^(\d{5})(\d)/, '$1-$2')
}

export function getErrorMessage(error: unknown, fallback = 'Ocorreu um erro inesperado'): string {
  if (!error || typeof error !== 'object') return fallback

  const err = error as {
    data?: ApiProblem | string
    statusMessage?: string
    message?: string
  }

  const data = err.data
  if (data && typeof data === 'object') {
    if (data.userMessage) return data.userMessage
    if (data.detail) return data.detail
    if (data.title) return data.title
    if (data.objects?.length) {
      return data.objects.map(o => o.userMessage || o.name).filter(Boolean).join('; ')
    }
  }

  if (typeof data === 'string' && data) return data
  if (err.statusMessage) return err.statusMessage
  if (err.message) return err.message
  return fallback
}

export const statusPedidoLabel: Record<string, string> = {
  PENDENTE: 'Pendente',
  CONFIRMADO: 'Confirmado',
  CANCELADO: 'Cancelado',
  ENTREGUE: 'Entregue',
}

export const statusPedidoClass: Record<string, string> = {
  PENDENTE: 'bg-yellow-100 text-yellow-800',
  CONFIRMADO: 'bg-blue-100 text-blue-800',
  CANCELADO: 'bg-red-100 text-red-800',
  ENTREGUE: 'bg-green-100 text-green-800',
}

export const statusPedidoIcon: Record<string, string> = {
  PENDENTE: 'lucide:clock',
  CONFIRMADO: 'lucide:package',
  CANCELADO: 'lucide:x-circle',
  ENTREGUE: 'lucide:check-circle',
}
