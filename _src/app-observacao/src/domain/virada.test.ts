import { describe, expect, it } from 'vitest'
import {
  difMin, estadoInicial, isoNaVisita, minutosNaVisita, normalizar, permanenciaMin, ultimoRegistro, unidadeDoCnpj,
  type Estado, type Fluxo, type Registro, type Visita,
} from './model'
import { resumoVisita } from './resumo'
import { excedentes, nomeVersao, rotuloVersao } from '../storage/backup'

const v = (p: Partial<Visita> = {}): Visita => ({
  ...normalizar({ ...estadoInicial(), visitas: [{ id: 'v1', unidadeId: 'bela-vista', inicio: '2026-10-17T21:00:00', fim: null } as Visita] }).visitas[0],
  ...p,
})
const fl = (p: Partial<Fluxo>): Fluxo => ({
  id: p.codigo! + p.tipo, visitaId: 'v1', codigo: 'BV-1', tipo: 'entrada', hora: '21:00', pessoas: 2, criancas: 0, estimado: false, destino: '', motivo: '', inicial: false, ...p,
})
const reg = (p: Partial<Registro>): Registro => ({
  id: 'r1', visitaId: 'v1', unidadeId: 'bela-vista', mesaId: 'm1', data: '2026-10-17', aniversario: false, entrada: '21:00', saida: null, saidaTipo: '',
  pessoas: 2, criancas: 0, pessoasEstimado: false, fluxos: [], inicial: false, instrutor: 0, jogos: [], jogosIncertos: [], notas: '', pedidos: [], ...p,
})

describe('virada da meia-noite', () => {
  it('saída depois da meia-noite conta a permanência; erro de digitação continua inválido', () => {
    expect(permanenciaMin('23:30', '00:40')).toBe(70)
    expect(permanenciaMin('20:00', '22:15')).toBe(135)
    expect(permanenciaMin('20:00', '19:50')).toBeNull()
    expect(difMin('22:00', '09:59')).toBe(719)
    expect(difMin('22:00', '10:01')).toBeNull()
  })
  it('hora na visita: depois da meia-noite é o dia seguinte; pouco antes do início fica negativa', () => {
    const visita = v()
    expect(minutosNaVisita(visita, '00:30')).toBe(210)
    expect(minutosNaVisita(visita, '20:30')).toBe(-30)
    expect(isoNaVisita(visita, '00:30')).toBe('2026-10-18T00:30:00')
    expect(isoNaVisita(visita, '22:10')).toBe('2026-10-17T22:10:00')
  })
})

describe('último registro', () => {
  it('é o lançamento mais tardio da visita, mesmo depois da meia-noite, sem o fechamento', () => {
    const base = normalizar(estadoInicial())
    const e: Estado = {
      ...base,
      visitas: [v()],
      registros: [reg({ entrada: '21:10', saida: '23:50' })],
      fluxos: [fl({ hora: '21:05' }), fl({ codigo: 'BV-2', hora: '00:15' }), fl({ codigo: 'BV-2', tipo: 'saida', hora: '01:00', motivo: 'Fechamento' })],
    }
    expect(ultimoRegistro(e, 'v1')).toEqual({ iso: '2026-10-18T00:15:00', origem: 'porta' })
  })
})

describe('estoque inicial', () => {
  it('quem já estava dentro não conta como entrada nem entra na permanência', () => {
    const base = normalizar(estadoInicial())
    const e: Estado = {
      ...base,
      visitas: [v({ fim: '2026-10-17T23:00:00' })],
      fluxos: [
        fl({ codigo: 'BV-1', pessoas: 24, inicial: true }),
        fl({ codigo: 'BV-1', tipo: 'saida', hora: '22:00', pessoas: 24, inicial: true }),
        fl({ codigo: 'BV-2', hora: '21:30', pessoas: 4 }),
        fl({ codigo: 'BV-2', tipo: 'saida', hora: '22:30', pessoas: 4 }),
      ],
      registros: [reg({ inicial: true, saida: '22:00', saidaTipo: 'grupo' }), reg({ id: 'r2', entrada: '21:30', saida: '22:30', saidaTipo: 'grupo' })],
    }
    const r = resumoVisita(e, 'v1')
    expect(r.fluxo).toMatchObject({ grupos: 1, entraram: 4, jaDentro: 24, gruposJaDentro: 1, permanenciaMedia: 60, saldo: 0 })
    expect(r.mesas).toMatchObject({ grupos: 2, iniciais: 1, permanenciaMedia: 60 })
  })
})

describe('unidades conhecidas', () => {
  it('estado novo traz Bela Vista e Paralela com CNPJ; estado antigo ganha o CNPJ pelo nome', () => {
    const e = normalizar(estadoInicial())
    expect(e.unidades.map((u) => [u.sigla, u.cnpj])).toEqual([['BV', '34128755000198'], ['PA', '59848429000186']])
    expect(unidadeDoCnpj(e, '59848429000186')?.nome).toBe('Paralela')
    const antigo = normalizar({ unidades: [{ id: 'x', nome: 'bela vista', sigla: 'BV', mesas: [] } as never] })
    expect(antigo.unidades[0].cnpj).toBe('34128755000198')
  })
})

describe('versões do backup', () => {
  it('ficam as mais recentes; o nome dá data e hora', () => {
    const nomes = ['observacao-2026-10-17_2100.json', 'observacao-2026-10-18_0915.json', 'observacao-2026-10-17_2115.json', 'outro.json']
    expect(excedentes(nomes, 2)).toEqual(['observacao-2026-10-17_2100.json'])
    expect(nomeVersao(new Date(2026, 9, 18, 21, 40))).toBe('observacao-2026-10-18_2140.json')
    expect(rotuloVersao('observacao-2026-10-18_2140.json')).toBe('18/10 21:40')
  })
})
