import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'
import type { CompraProdutoPeriodo, Pedido } from '~/types/api'
import { formatCurrency, formatDate, statusPedidoLabel } from '~/utils/format'

function stamp() {
  const d = new Date()
  return d.toISOString().slice(0, 19).replace(/[:T]/g, '-')
}

function addPdfHeader(doc: jsPDF, title: string, subtitle?: string) {
  doc.setFontSize(16)
  doc.text(title, 14, 18)
  doc.setFontSize(10)
  doc.setTextColor(80)
  if (subtitle) {
    doc.text(subtitle, 14, 26)
  }
  doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, subtitle ? 32 : 26)
  doc.setTextColor(0)
}

export function exportComprasPdf(
  itens: CompraProdutoPeriodo[],
  periodo: { inicio: string, fim: string },
) {
  const doc = new jsPDF()
  addPdfHeader(
    doc,
    'Relatório de Compras',
    `Período: ${formatDate(periodo.inicio)} a ${formatDate(periodo.fim)}`,
  )

  const totalValor = itens.reduce((s, i) => s + Number(i.valorTotal || 0), 0)
  const totalQtd = itens.reduce((s, i) => s + Number(i.quantidadeTotal || 0), 0)

  autoTable(doc, {
    startY: 38,
    head: [['Produto', 'Unidade', 'Qtd. total', 'Pedidos', 'Valor total']],
    body: itens.map(i => [
      i.produtoNome,
      i.unidadeMedida,
      String(i.quantidadeTotal),
      String(i.quantidadePedidos),
      formatCurrency(i.valorTotal),
    ]),
    foot: [['Totais', '', String(totalQtd), String(itens.length), formatCurrency(totalValor)]],
    styles: { fontSize: 9 },
    headStyles: { fillColor: [37, 99, 235] },
    footStyles: { fillColor: [243, 244, 246], textColor: [17, 24, 39], fontStyle: 'bold' },
  })

  doc.save(`relatorio-compras-${stamp()}.pdf`)
}

export function exportPedidosPdf(
  pedidos: Pedido[],
  options: {
    analitico: boolean
    filtrosResumo?: string
  },
) {
  const doc = new jsPDF()
  addPdfHeader(
    doc,
    options.analitico ? 'Relatório de Pedidos (Analítico)' : 'Relatório de Pedidos (Sintético)',
    options.filtrosResumo,
  )

  const totalValor = pedidos.reduce((s, p) => s + Number(p.valorTotal || 0), 0)
  let startY = 38

  if (!options.analitico) {
    autoTable(doc, {
      startY,
      head: [['Nº', 'Escola', 'Data', 'Status', 'Total']],
      body: pedidos.map(p => [
        `#${p.id}`,
        p.cliente?.nome || '—',
        formatDate(p.dataCriacao),
        statusPedidoLabel[p.status] || p.status,
        formatCurrency(p.valorTotal),
      ]),
      foot: [['', '', '', 'Total geral', formatCurrency(totalValor)]],
      styles: { fontSize: 9 },
      headStyles: { fillColor: [37, 99, 235] },
      footStyles: { fillColor: [243, 244, 246], textColor: [17, 24, 39], fontStyle: 'bold' },
    })
  }
  else {
    for (const pedido of pedidos) {
      if (startY > 250) {
        doc.addPage()
        startY = 20
      }

      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.text(
        `Pedido #${pedido.id} — ${pedido.cliente?.nome || '—'} — ${formatCurrency(pedido.valorTotal)}`,
        14,
        startY,
      )
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.text(
        `Data: ${formatDate(pedido.dataCriacao)} | Status: ${statusPedidoLabel[pedido.status] || pedido.status}`,
        14,
        startY + 6,
      )

      const itens = pedido.itens || []
      autoTable(doc, {
        startY: startY + 10,
        head: [['Produto', 'Qtd', 'Unitário', 'Total item']],
        body: itens.length
          ? itens.map(i => [
              i.produto?.nome || '—',
              String(i.quantidade),
              formatCurrency(i.precoUnitario),
              formatCurrency(i.precoTotal),
            ])
          : [['Sem itens', '—', '—', '—']],
        styles: { fontSize: 8 },
        headStyles: { fillColor: [59, 130, 246] },
        margin: { left: 14, right: 14 },
      })

      // jspdf-autotable anexa lastAutoTable ao documento
      const last = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable
      startY = (last?.finalY || startY) + 14
    }

    if (startY > 270) {
      doc.addPage()
      startY = 20
    }
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text(`Total geral: ${formatCurrency(totalValor)} (${pedidos.length} pedidos)`, 14, startY)
  }

  doc.save(`relatorio-pedidos-${options.analitico ? 'analitico' : 'sintetico'}-${stamp()}.pdf`)
}

export function exportPedidosExcel(
  pedidos: Pedido[],
  options: {
    analitico: boolean
  },
) {
  const wb = XLSX.utils.book_new()

  if (!options.analitico) {
    const rows = pedidos.map(p => ({
      'Nº Pedido': p.id,
      Escola: p.cliente?.nome || '',
      CNPJ: p.cliente?.cnpj || '',
      Data: formatDate(p.dataCriacao),
      Status: statusPedidoLabel[p.status] || p.status,
      Total: Number(p.valorTotal || 0),
      Observação: p.observacao || '',
    }))
    const total = pedidos.reduce((s, p) => s + Number(p.valorTotal || 0), 0)
    rows.push({
      'Nº Pedido': '' as unknown as number,
      Escola: '',
      CNPJ: '',
      Data: '',
      Status: 'TOTAL',
      Total: total,
      Observação: '',
    })
    const ws = XLSX.utils.json_to_sheet(rows)
    XLSX.utils.book_append_sheet(wb, ws, 'Pedidos')
  }
  else {
    const rows: Array<Record<string, string | number>> = []
    for (const p of pedidos) {
      const itens = p.itens?.length
        ? p.itens
        : [{
            id: 0,
            quantidade: 0,
            precoTotal: 0,
            precoUnitario: 0,
            produto: { id: 0, nome: 'Sem itens', unidadeMedida: '' },
          }]

      for (const item of itens) {
        rows.push({
          'Nº Pedido': p.id,
          Escola: p.cliente?.nome || '',
          'Data Pedido': formatDate(p.dataCriacao),
          Status: statusPedidoLabel[p.status] || p.status,
          'Valor Pedido': Number(p.valorTotal || 0),
          Produto: item.produto?.nome || '',
          Unidade: item.produto?.unidadeMedida || '',
          Quantidade: Number(item.quantidade || 0),
          'Preço Unitário': Number(item.precoUnitario || 0),
          'Total Item': Number(item.precoTotal || 0),
        })
      }
    }
    const ws = XLSX.utils.json_to_sheet(rows)
    XLSX.utils.book_append_sheet(wb, ws, 'Pedidos Analítico')
  }

  XLSX.writeFile(wb, `relatorio-pedidos-${options.analitico ? 'analitico' : 'sintetico'}-${stamp()}.xlsx`)
}
