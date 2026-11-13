// NFC-e pelo QR code, no mesmo mecanismo do app Brita (rotinas/webapp/src/lib/nfce.ts):
// o QR traz o endereço da consulta pública da SEFAZ com a chave de 44 dígitos.
// A chave já basta para série e número (contam as notas emitidas); a consulta,
// quando há internet, acrescenta emissão, total e itens (layout "Portal NFC-e").
// No Android a página é buscada pelo CapacitorHttp nativo, sem CORS.
import { Capacitor, CapacitorHttp } from '@capacitor/core'
import type { ItemNota } from './model'

/** Chave de acesso (44 dígitos): o parâmetro `p=` ou a primeira sequência de 44 dígitos. */
export function chaveDoQr(texto: string): string | null {
  const t = String(texto || '')
  const p = /[?&]p=(\d{44})/.exec(t)
  if (p) return p[1]
  const solta = /(?:^|\D)(\d{44})(?:\D|$)/.exec(t.replace(/\s+/g, ''))
  return solta ? solta[1] : null
}

export const pareceQrNfce = (texto: string) => !!chaveDoQr(texto)

/** Campos da chave: UF, AAMM, CNPJ, modelo (65 = NFC-e), série, número. */
export function dadosDaChave(chave: string) {
  return {
    uf: chave.slice(0, 2),
    aamm: chave.slice(2, 6),
    cnpj: chave.slice(6, 20),
    modelo: chave.slice(20, 22),
    serie: Number(chave.slice(22, 25)),
    numero: Number(chave.slice(25, 34)),
  }
}

type Num = { serie: number; numero: number; cnpj: string }
/** Notas emitidas entre duas leituras; null se a série ou o emitente mudou. */
export function notasEmitidas(a: Num | undefined, b: Num | undefined): number | null {
  if (!a || !b || a.serie !== b.serie || a.cnpj !== b.cnpj) return null
  return b.numero - a.numero
}

const limpa = (s: string | null | undefined) => (s || '').replace(/\s+/g, ' ').trim()
const semRotulo = (s: string | null | undefined) => limpa(s).replace(/^[^:]*:\s*/, '')
const numeroBr = (s: string) => {
  const n = Number(s.replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.'))
  return Number.isFinite(n) ? n : NaN
}

export type ConsultaNfce = { emissao: string | null; total: number | null; itens: ItemNota[] }

/** Lê a página de consulta (layout "Portal NFC-e"); null sem a tabela de produtos. */
export function parseNfceHtml(html: string): ConsultaNfce | null {
  const doc = new DOMParser().parseFromString(html, 'text/html')
  const itens: ItemNota[] = []
  doc.querySelectorAll('#tabResult tr').forEach((tr) => {
    const nome = limpa(tr.querySelector('.txtTit')?.textContent)
    const valor = numeroBr(limpa(tr.querySelector('.valor')?.textContent))
    if (!nome || !(valor > 0)) return
    const qtd = numeroBr(semRotulo(tr.querySelector('.Rqtd')?.textContent)) || 1
    const un = semRotulo(tr.querySelector('.RUN')?.textContent) || 'UN'
    itens.push({ nome, qtd, un, valor: Math.round(valor * 100) / 100 })
  })
  if (!itens.length) return null
  let total: number | null = null
  doc.querySelectorAll('#totalNota #linhaTotal, #totalNota .linhaTotal, #linhaTotal').forEach((l) => {
    const rot = limpa(l.querySelector('label')?.textContent).toLowerCase()
    const v = numeroBr(limpa(l.querySelector('.totalNumb')?.textContent))
    if (/a pagar/.test(rot) && v > 0) total = v
    else if (total === null && /valor total/.test(rot) && v > 0) total = v
  })
  const texto = limpa(doc.body?.textContent)
  const em = /Emiss[ãa]o:?\s*(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{2}):(\d{2})(?::(\d{2}))?)?/i.exec(texto)
  const emissao = em ? `${em[3]}-${em[2]}-${em[1]}T${em[4] ?? '00'}:${em[5] ?? '00'}:${em[6] ?? '00'}` : null
  return { emissao, total: total ?? Math.round(itens.reduce((a, i) => a + i.valor, 0) * 100) / 100, itens }
}

async function baixar(url: string): Promise<string> {
  if (Capacitor.isNativePlatform()) {
    // http:// da SEFAZ liberado para gov.br em res/xml/network_security_config.xml
    const r = await CapacitorHttp.get({
      url,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,*/*;q=0.8',
        'Accept-Language': 'pt-BR,pt;q=0.9',
      },
      responseType: 'text',
      connectTimeout: 15000,
      readTimeout: 20000,
    })
    if (r.status >= 400) throw new Error(`SEFAZ respondeu ${r.status}`)
    return typeof r.data === 'string' ? r.data : String(r.data ?? '')
  }
  return (await fetch(url)).text()
}

/** Consulta a SEFAZ. Segue uma vez um iframe/refresh (alguns estados embrulham a página). */
export async function consultarNfce(url: string): Promise<ConsultaNfce> {
  const html = await baixar(url)
  let c = parseNfceHtml(html)
  if (!c) {
    const prox =
      /<iframe[^>]+src=["']([^"']+)["']/i.exec(html)?.[1] || /http-equiv=["']?refresh["']?[^>]+url=([^"'>\s]+)/i.exec(html)?.[1]
    if (prox) c = parseNfceHtml(await baixar(new URL(prox.replace(/&amp;/g, '&'), url).href))
  }
  if (!c) throw new Error('Página da SEFAZ não reconhecida')
  return c
}
