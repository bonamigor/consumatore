/**
 * Total de registros de uma página da API. O Spring serializa a página no formato VIA_DTO
 * (`{ content, page: { totalElements } }`); o formato antigo trazia `totalElements` na raiz.
 */
export function totalDaPagina(pagina: { totalElements?: number, page?: { totalElements?: number } }): number {
  return pagina.page?.totalElements ?? pagina.totalElements ?? 0
}
