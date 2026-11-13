import { describe, expect, it } from 'vitest'
import { estadoInicial, esperaMin, normalizar, type Estado, type Registro } from './model'
import { medirCm } from './medida'
import { resumoVisita } from './resumo'

describe('medirCm', () => {
  it('escala pela referência no mesmo plano', () => {
    // cartão de 8,56 cm ocupa 100 px; o alvo ocupa 500 px → 42,8 cm
    expect(medirCm([{ x: 0, y: 0 }, { x: 100, y: 0 }], 8.56, [{ x: 10, y: 10 }, { x: 310, y: 410 }])).toBe(42.8)
  })
  it('sem referência válida não mede', () => {
    expect(medirCm([{ x: 5, y: 5 }, { x: 5, y: 5 }], 8.56, [{ x: 0, y: 0 }, { x: 1, y: 1 }])).toBeNull()
  })
})

describe('pedidos', () => {
  it('espera = chegada − pedido; sem chegada fica em aberto', () => {
    expect(esperaMin({ id: 'p', categoria: 'comida', descricao: '', pedido: '14:10', chegada: '14:32' })).toBe(22)
    expect(esperaMin({ id: 'p', categoria: 'comida', descricao: '', pedido: '14:10', chegada: null })).toBeNull()
  })
  it('resumo dá a espera média por categoria e os pendentes', () => {
    const base = normalizar(estadoInicial())
    const v = normalizar({ visitas: [{ id: 'v1', unidadeId: 'bela-vista', inicio: '2026-10-18T14:00:00', fim: null }] as Estado['visitas'] }).visitas[0]
    const r = (id: string, pedidos: Registro['pedidos']): Registro => ({
      id, visitaId: 'v1', unidadeId: 'bela-vista', mesaId: 'm1', data: '2026-10-18', aniversario: false, entrada: '14:00', saida: null,
      pessoas: 2, criancas: 0, instrutor: 0, jogos: [], notas: '', pedidos, pessoasEstimado: false, saidaTipo: '' as const, fluxos: [], jogosIncertos: [], inicial: false,
    })
    const e: Estado = {
      ...base,
      visitas: [v],
      registros: [
        r('a', [
          { id: '1', categoria: 'comida', descricao: '', pedido: '14:10', chegada: '14:30' },
          { id: '2', categoria: 'bebida', descricao: '', pedido: '14:10', chegada: '14:14' },
        ]),
        r('b', [
          { id: '3', categoria: 'comida', descricao: '', pedido: '15:00', chegada: '15:30' },
          { id: '4', categoria: 'comida', descricao: '', pedido: '15:40', chegada: null },
        ]),
      ],
    }
    const p = resumoVisita(e, 'v1').pedidos
    expect(p.total).toBe(4)
    expect(p.pendentes).toBe(1)
    expect(p.porGrupo).toBe(2)
    expect(p.esperaMedia).toMatchObject({ comida: 25, bebida: 4 })
  })
})
