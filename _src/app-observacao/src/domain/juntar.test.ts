import { describe, expect, it } from 'vitest'
import { estadoInicial, normalizar, type Estado, type Fluxo } from './model'
import { juntar } from './juntar'

const fl = (id: string, pessoas: number): Fluxo => ({ id, visitaId: 'v1', codigo: 'BV-1', tipo: 'entrada', hora: '14:00', pessoas, criancas: 0, estimado: false, destino: '', motivo: '' })

describe('juntar', () => {
  it('soma o que é novo e mantém a versão local quando o id já existe', () => {
    const base = normalizar(estadoInicial())
    const local: Estado = { ...base, fluxos: [fl('a', 2)] }
    const recebido: Estado = {
      ...base,
      unidades: [...base.unidades, { ...base.unidades[0], id: 'outra', nome: 'Outra' }],
      fluxos: [fl('a', 9), fl('b', 3)],
    }
    const { estado, novos } = juntar(local, recebido)
    expect(estado.fluxos.map((f) => [f.id, f.pessoas])).toEqual([
      ['a', 2],
      ['b', 3],
    ])
    expect(estado.unidades.map((u) => u.id)).toEqual(['bela-vista', 'outra'])
    expect(novos).toBe(2)
  })
})
