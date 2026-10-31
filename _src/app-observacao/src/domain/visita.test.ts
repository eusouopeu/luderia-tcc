import { describe, expect, it } from 'vitest'
import { estadoInicial, normalizar, type Estado, type Visita } from './model'
import { etapas, situacaoTimer } from './temporizador'
import { chaveDoQr, dadosDaChave, notasEmitidas } from './nfce'
import { resumoVisita } from './resumo'

const visita = (p: Partial<Visita> = {}): Visita => ({
  ...normalizar({ ...estadoInicial(), visitas: [{ id: 'v1', unidadeId: 'bela-vista', inicio: '2026-10-18T14:00:00', fim: null } as Visita] })
    .visitas[0],
  ...p,
})

describe('temporizador', () => {
  it('3 h com contagens a cada 30 min: inicial + 6', () => {
    expect(etapas(visita())).toEqual([0, 30, 60, 90, 120, 150, 180])
  })
  it('conta até a próxima contagem descontando a pausa', () => {
    const v = visita({ pausadoMs: 5 * 60_000 })
    // 14:40 de relógio, 5 min pausado → 35 min efetivos; próxima = 60 min (2ª contagem)
    const s = situacaoTimer(v, new Date('2026-10-18T14:40:00'))
    expect(s.decorridoMin).toBe(35)
    expect(s.proxima).toBe(2)
    expect(s.faltamMs).toBe(25 * 60_000)
    expect(s.horaProxima).toBe('15:05')
    expect(s.conclusao).toBe('17:05')
  })
})

describe('NFC-e', () => {
  const qr =
    'http://nfe.sefaz.ba.gov.br/servicos/nfce/qrcode.aspx?p=29261012345678000190650010000123451123456789|2|1|1|ABCDEF'
  it('lê série e número da chave do QR', () => {
    const chave = chaveDoQr(qr)!
    expect(chave).toHaveLength(44)
    expect(dadosDaChave(chave)).toMatchObject({ uf: '29', aamm: '2610', cnpj: '12345678000190', modelo: '65', serie: 1, numero: 12345 })
  })
  it('notas emitidas = número final − inicial, só na mesma série e mesmo CNPJ', () => {
    const a = { serie: 1, numero: 12345, cnpj: 'x' }
    expect(notasEmitidas(a, { serie: 1, numero: 12402, cnpj: 'x' })).toBe(57)
    expect(notasEmitidas(a, { serie: 2, numero: 12402, cnpj: 'x' })).toBeNull()
  })
})

describe('resumoVisita', () => {
  it('fluxo, grupos e pessoas por nota fecham com os registros', () => {
    const base = normalizar(estadoInicial())
    const e: Estado = {
      ...base,
      visitas: [visita({ fim: '2026-10-18T17:00:00' })],
      fluxos: [
        { id: 'f1', visitaId: 'v1', codigo: 'BV-1', tipo: 'entrada', hora: '14:10', pessoas: 4, criancas: 1, estimado: false, destino: '', motivo: '', inicial: false },
        { id: 'f2', visitaId: 'v1', codigo: 'BV-2', tipo: 'entrada', hora: '14:30', pessoas: 2, criancas: 0, estimado: false, destino: '', motivo: '', inicial: false },
        { id: 'f3', visitaId: 'v1', codigo: 'BV-1', tipo: 'saida', hora: '16:40', pessoas: 4, criancas: 1, estimado: false, destino: '', motivo: '', inicial: false },
      ],
    }
    e.visitas[0].notas = [
      { id: 'n1', momento: 'inicio', lidaEm: '2026-10-18T14:02:00', chave: '', url: '', cnpj: 'x', serie: 1, numero: 100, emissao: null, total: null, itens: [] },
      { id: 'n2', momento: 'fim', lidaEm: '2026-10-18T16:58:00', chave: '', url: '', cnpj: 'x', serie: 1, numero: 103, emissao: null, total: null, itens: [] },
    ]
    const r = resumoVisita(e, 'v1')
    expect(r.duracaoMin).toBe(180)
    expect(r.fluxo).toMatchObject({ grupos: 2, entraram: 6, sairam: 4, saldo: 2, pessoasHora: 2, permanenciaMedia: 150 })
    expect(r.notasEmitidas).toBe(3)
    expect(r.pessoasPorNota).toBe(2)
  })
})
