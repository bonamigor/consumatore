export interface CepLookupResult {
  cep: string
  logradouro: string
  numero?: string
  bairro: string
  cidade: string
  estado: string
}

interface ViaCepResponse {
  cep?: string
  logradouro?: string
  bairro?: string
  localidade?: string
  uf?: string
  erro?: boolean | string
}

export function useCepLookup() {
  const searching = ref(false)
  const error = ref('')

  async function buscarPorCep(cepRaw: string): Promise<CepLookupResult | null> {
    error.value = ''
    const digits = (cepRaw || '').replace(/\D/g, '')
    if (digits.length !== 8) {
      return null
    }

    searching.value = true
    try {
      const data = await $fetch<ViaCepResponse>(`https://viacep.com.br/ws/${digits}/json/`)
      if (!data || data.erro === true || data.erro === 'true') {
        error.value = 'CEP não encontrado'
        return null
      }

      const cep = digits.replace(/^(\d{5})(\d{3})$/, '$1-$2')
      return {
        cep,
        logradouro: data.logradouro || '',
        bairro: data.bairro || '',
        cidade: data.localidade || '',
        estado: data.uf || '',
      }
    }
    catch {
      error.value = 'Não foi possível consultar o CEP'
      return null
    }
    finally {
      searching.value = false
    }
  }

  return {
    searching,
    error,
    buscarPorCep,
  }
}
