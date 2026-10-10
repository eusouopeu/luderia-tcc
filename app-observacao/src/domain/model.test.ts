import { describe, expect, it } from 'vitest'
import { acervoVazio, dataIso, estadoInicial, normalizar, paraCsv, permanenciaMin, type Estado } from './model'

describe('permanenciaMin', () => {
  it('conta os minutos entre entrada e saída', () => {
    expect(permanenciaMin('14:05', '16:35')).toBe(150)
  })
  it('sem saída a permanência fica em aberto (censurada)', () => {
    expect(permanenciaMin('14:05', null)).toBeNull()
  })
  it('saída antes da entrada é erro de digitação, não virada de dia', () => {
    expect(permanenciaMin('16:00', '15:00')).toBeNull()
  })
})

describe('dataIso', () => {
  it('converte dd/mm/aaaa em aaaa-mm-dd', () => {
    expect(dataIso('10/10/2026')).toBe('2026-10-10')
  })
  it('recusa data incompleta ou inexistente', () => {
    expect(dataIso('10/10/26')).toBeNull()
    expect(dataIso('31/02/2026')).toBeNull()
  })
})

describe('paraCsv', () => {
  it('uma linha por grupo, censura marcada e texto escapado', () => {
    const e: Estado = {
      ...estadoInicial(),
      unidades: [{ id: 'u1', nome: 'Bela Vista', sigla: 'BV', acervo: acervoVazio(), mesas: [{ id: 'm1', nome: 'Mesa 1' }] }],
      visitas: normalizar({ visitas: [{ id: 'v1', unidadeId: 'u1', inicio: '2026-10-18T14:00:00', fim: '2026-10-18T17:00:00' }] as Estado['visitas'] }).visitas,
      registros: [
        {
          id: 'r1', visitaId: 'v1', unidadeId: 'u1', mesaId: 'm1', data: '2026-10-18', aniversario: true,
          entrada: '14:05', saida: '16:35', pessoas: 4, criancas: 2, instrutor: 4, jogos: ['Dixit'], notas: 'jogo "Dixit"; ótimo',
        },
        {
          id: 'r2', visitaId: 'v1', unidadeId: 'u1', mesaId: 'm1', data: '2026-10-18', aniversario: false,
          entrada: '16:50', saida: null, pessoas: 2, criancas: 0, instrutor: 0, jogos: [], notas: '',
        },
      ],
    }
    const linhas = paraCsv(e).replace(/^﻿/, '').trim().split('\r\n')
    expect(linhas).toHaveLength(3)
    expect(linhas[0].split(';')).toContain('permanencia_min')
    expect(linhas[1]).toContain(';150;')
    expect(linhas[1]).toContain('"jogo ""Dixit""; ótimo"')
    expect(linhas[2]).toMatch(/;sim;?/) // censurada: saiu depois do fim da observação
  })
})
