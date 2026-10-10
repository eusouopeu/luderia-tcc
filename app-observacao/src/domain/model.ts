/* Modelo do roteiro de observação (Bloco D): unidades com mesas, visitas
   com início e fim, e um registro por grupo que ocupa uma mesa. */

export type Mesa = { id: string; nome: string }
export type Unidade = { id: string; nome: string; mesas: Mesa[] }
/** Datas em ISO local (sem fuso): 2026-10-18T14:00:00. */
export type Visita = { id: string; unidadeId: string; inicio: string; fim: string | null }
export type Registro = {
  id: string
  visitaId: string
  unidadeId: string
  mesaId: string
  /** aaaa-mm-dd; vazio enquanto não preenchida */
  data: string
  aniversario: boolean
  /** HH:MM */
  entrada: string
  /** HH:MM; null = grupo ainda na mesa */
  saida: string | null
  pessoas: number
  criancas: number
  /** vezes que o instrutor foi à mesa */
  instrutor: number
  notas: string
}
export type Estado = { unidades: Unidade[]; visitas: Visita[]; registros: Registro[] }

export const novoId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7)

export function estadoInicial(): Estado {
  return {
    unidades: [
      {
        id: 'bela-vista',
        nome: 'Bela Vista',
        mesas: Array.from({ length: 6 }, (_, i) => ({ id: `m${i + 1}`, nome: `Mesa ${i + 1}` })),
      },
    ],
    visitas: [],
    registros: [],
  }
}

const dois = (n: number) => String(n).padStart(2, '0')
export const hojeIso = (d = new Date()) => `${d.getFullYear()}-${dois(d.getMonth() + 1)}-${dois(d.getDate())}`
export const agoraHora = (d = new Date()) => `${dois(d.getHours())}:${dois(d.getMinutes())}`
export const agoraIso = (d = new Date()) => `${hojeIso(d)}T${agoraHora(d)}:${dois(d.getSeconds())}`

export const visitaAtiva = (e: Estado, unidadeId: string) =>
  e.visitas.find((v) => v.unidadeId === unidadeId && v.fim === null)

export const registroAberto = (e: Estado, visitaId: string, mesaId: string) =>
  e.registros.find((r) => r.visitaId === visitaId && r.mesaId === mesaId && r.saida === null)

const minutos = (h: string) => {
  const m = /^(\d{2}):(\d{2})$/.exec(h)
  return m ? Number(m[1]) * 60 + Number(m[2]) : null
}

/** Minutos na mesa; null se o grupo não saiu ou se a saída é anterior à entrada. */
export function permanenciaMin(entrada: string, saida: string | null): number | null {
  if (saida === null) return null
  const a = minutos(entrada)
  const b = minutos(saida)
  if (a === null || b === null || b < a) return null
  return b - a
}

/** dd/mm/aaaa → aaaa-mm-dd, ou null se incompleta ou inexistente. */
export function dataIso(br: string): string | null {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(br.replace(/\s/g, ''))
  if (!m) return null
  const [d, mes, a] = [Number(m[1]), Number(m[2]), Number(m[3])]
  const t = new Date(a, mes - 1, d)
  if (t.getFullYear() !== a || t.getMonth() !== mes - 1 || t.getDate() !== d) return null
  return `${m[3]}-${m[2]}-${m[1]}`
}

export const dataBr = (iso: string) => (iso ? iso.split('-').reverse().join('/') : '')

/** Máscara progressiva de data enquanto se digita: "1010" → "10/10". */
export function mascaraData(texto: string): string {
  const d = texto.replace(/\D/g, '').slice(0, 8)
  return [d.slice(0, 2), d.slice(2, 4), d.slice(4)].filter(Boolean).join('/')
}

const COLUNAS = [
  'unidade', 'visita_inicio', 'visita_fim', 'mesa', 'data', 'entrada', 'saida', 'permanencia_min',
  'censurada', 'pessoas', 'criancas', 'aniversario', 'instrutor_vezes', 'notas',
] as const

function celula(v: string | number): string {
  const s = String(v)
  return /[;"\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

/** CSV (separador ";", BOM para o Excel) com um grupo por linha; opcionalmente de uma unidade. */
export function paraCsv(e: Estado, unidadeId?: string): string {
  const linhas = [COLUNAS.join(';')]
  const regs = e.registros
    .filter((r) => !unidadeId || r.unidadeId === unidadeId)
    .sort((a, b) => (a.data + a.entrada).localeCompare(b.data + b.entrada))
  for (const r of regs) {
    const u = e.unidades.find((x) => x.id === r.unidadeId)
    const v = e.visitas.find((x) => x.id === r.visitaId)
    const p = permanenciaMin(r.entrada, r.saida)
    linhas.push(
      [
        u?.nome ?? '', v?.inicio ?? '', v?.fim ?? '', u?.mesas.find((m) => m.id === r.mesaId)?.nome ?? r.mesaId,
        r.data, r.entrada, r.saida ?? '', p ?? '', r.saida === null ? 'sim' : 'nao',
        r.pessoas, r.criancas, r.aniversario ? 'sim' : 'nao', r.instrutor, r.notas,
      ]
        .map(celula)
        .join(';'),
    )
  }
  return '﻿' + linhas.join('\r\n') + '\r\n'
}
