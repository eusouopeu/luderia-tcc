import { describe, expect, it } from 'vitest'
import { acervoVazio, arquivosCsv, dataIso, entradasParaMesa, estadoInicial, fecharCasa, sincronizarPortaMesas, MOTIVO_FECHAMENTO, normalizar, novasMesas, paraCsv, permanenciaMin, proximoCodigo, type Estado, type Fluxo } from './model'

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
          entrada: '14:05', saida: '16:35', pessoas: 4, criancas: 2, instrutor: 4, jogos: ['Dixit'], pedidos: [], notas: 'jogo "Dixit"; ótimo',
          pessoasEstimado: false, saidaTipo: 'grupo', fluxos: [], jogosIncertos: [],
        },
        {
          id: 'r2', visitaId: 'v1', unidadeId: 'u1', mesaId: 'm1', data: '2026-10-18', aniversario: false,
          entrada: '16:50', saida: null, pessoas: 2, criancas: 0, instrutor: 0, jogos: [], pedidos: [], notas: '',
          pessoasEstimado: false, saidaTipo: '', fluxos: [], jogosIncertos: [],
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

describe('novasMesas', () => {
  it('numera depois da maior mesa existente', () => {
    const mesas = [{ id: 'a', nome: 'Mesa 1' }, { id: 'b', nome: 'Mesa 9' }]
    expect(novasMesas(mesas, 2).map((m) => m.nome)).toEqual(['Mesa 10', 'Mesa 11'])
  })
  it('gera ids distintos', () => {
    const [a, b] = novasMesas([], 2)
    expect(a.id).not.toBe(b.id)
    expect(a.nome).toBe('Mesa 1')
  })
})

describe('proximoCodigo', () => {
  it('não repete código depois de apagar um grupo do meio', () => {
    const f = (codigo: string): Fluxo => ({ id: codigo, visitaId: 'v', codigo, tipo: 'entrada', hora: '14:00', pessoas: 2, criancas: 0, estimado: false, destino: '', motivo: '' })
    expect(proximoCodigo([f('BV-1'), f('BV-3')], 'v', 'BV')).toBe('BV-4')
    expect(proximoCodigo([], 'v', 'BV')).toBe('BV-1')
  })
})

describe('fecharCasa e exportação por visita', () => {
  const base = (): Estado => ({
    ...estadoInicial(),
    config: { ...estadoInicial().config, observador: 'POV1' },
    unidades: [{ id: 'u1', nome: 'Bela Vista', sigla: 'BV', acervo: acervoVazio(), mesas: [{ id: 'm1', nome: 'Mesa 1' }] }],
    visitas: normalizar({ visitas: [{ id: 'v1', unidadeId: 'u1', inicio: '2026-10-17T18:30:00', fim: null, observador: 'POV1', papel: 'porta e mesas' }] as Estado['visitas'] }).visitas,
    registros: [
      {
        id: 'r1', visitaId: 'v1', unidadeId: 'u1', mesaId: 'm1', data: '2026-10-17', aniversario: false, entrada: '19:00', saida: null, saidaTipo: '',
        pessoas: 3, criancas: 0, pessoasEstimado: true, fluxos: ['BV-1'], instrutor: 0, jogos: ['Dixit', 'Dobble'], jogosIncertos: ['Dobble'], notas: '', pedidos: [],
      },
    ],
    fluxos: [
      { id: 'f1', visitaId: 'v1', codigo: 'BV-1', tipo: 'entrada', hora: '19:00', pessoas: 3, criancas: 0, estimado: false, destino: 'mesa:m1', motivo: '' },
      { id: 'f2', visitaId: 'v1', codigo: 'BV-2', tipo: 'entrada', hora: '19:10', pessoas: 2, criancas: 0, estimado: false, destino: '', motivo: '' },
      { id: 'f3', visitaId: 'v1', codigo: 'BV-2', tipo: 'saida', hora: '19:12', pessoas: 2, criancas: 0, estimado: false, destino: '', motivo: 'Lotado' },
    ],
  })

  it('fecha mesas e porta como saída por fechamento (censura)', () => {
    const r = fecharCasa(base(), 'v1', '21:57')
    expect(r.mesas).toBe(1)
    expect(r.porta).toBe(1)
    expect(r.estado.registros[0]).toMatchObject({ saida: '21:57', saidaTipo: 'fechamento' })
    expect(r.estado.fluxos.filter((f) => f.motivo === MOTIVO_FECHAMENTO).map((f) => f.codigo)).toEqual(['BV-1'])
    const linha = paraCsv(r.estado).replace(/^﻿/, '').trim().split('\r\n')[1].split(';')
    const cab = paraCsv(r.estado).replace(/^﻿/, '').split('\r\n')[0].split(';')
    expect(linha[cab.indexOf('censurada')]).toBe('sim')
    expect(linha[cab.indexOf('saida_tipo')]).toBe('fechamento')
    expect(linha[cab.indexOf('pessoas_estimado')]).toBe('sim')
    expect(linha[cab.indexOf('jogos_incertos')]).toBe('Dobble')
  })

  it('exporta a visita com visita_id, observador e nomes do pipeline', () => {
    const arqs = arquivosCsv(base(), 'u1', 'v1')
    expect(arqs.map((a) => a.nome)).toContain('2026-10-17_SJBV_POV1_contagem_fluxo.csv')
    const fluxo = arqs.find((a) => a.nome.endsWith('fluxo.csv'))!.conteudo.replace(/^﻿/, '').trim().split('\r\n')
    const cab = fluxo[0].split(';')
    expect(cab.slice(0, 4)).toEqual(['visita_id', 'observador', 'versao_app', 'papel'])
    const l1 = fluxo[1].split(';')
    expect(l1[cab.indexOf('visita_id')]).toBe('2026-10-17_SJBV')
    expect(l1[cab.indexOf('destino')]).toBe('Mesa 1')
    expect(fluxo[3].split(';')[cab.indexOf('motivo')]).toBe('Lotado')
  })
})

describe('porta e mesas ligadas nos dois sentidos', () => {
  const base = (): Estado => ({
    ...estadoInicial(),
    unidades: [{ id: 'u1', nome: 'Bela Vista', sigla: 'BV', acervo: acervoVazio(), mesas: [{ id: 'm1', nome: 'Mesa 1' }, { id: 'm2', nome: 'Mesa 2' }] }],
    registros: [
      {
        id: 'r1', visitaId: 'v1', unidadeId: 'u1', mesaId: 'm2', data: '2026-10-17', aniversario: false, entrada: '19:05', saida: null, saidaTipo: '',
        pessoas: 4, criancas: 0, pessoasEstimado: false, fluxos: ['BV-2'], instrutor: 0, jogos: [], jogosIncertos: [], notas: '', pedidos: [],
      },
    ],
    fluxos: [
      { id: 'f1', visitaId: 'v1', codigo: 'BV-1', tipo: 'entrada', hora: '19:00', pessoas: 3, criancas: 0, estimado: false, destino: 'mesa:m1', motivo: '' },
      { id: 'f2', visitaId: 'v1', codigo: 'BV-2', tipo: 'entrada', hora: '19:04', pessoas: 4, criancas: 0, estimado: false, destino: '', motivo: '' },
      { id: 'f3', visitaId: 'v1', codigo: 'BV-3', tipo: 'entrada', hora: '19:06', pessoas: 2, criancas: 0, estimado: false, destino: 'Balcão/loja', motivo: '' },
      { id: 'f4', visitaId: 'v1', codigo: 'BV-4', tipo: 'entrada', hora: '19:08', pessoas: 2, criancas: 0, estimado: false, destino: '', motivo: '' },
    ],
  })

  it('o código ligado na mesa vira destino na porta; vínculo perdido volta a vazio; balcão fica', () => {
    const e = sincronizarPortaMesas(base(), 'v1')
    const destino = (c: string) => e.fluxos.find((f) => f.codigo === c)!.destino
    expect(destino('BV-2')).toBe('mesa:m2')
    expect(destino('BV-1')).toBe('')
    expect(destino('BV-3')).toBe('Balcão/loja')
    expect(destino('BV-4')).toBe('')
  })

  it('apagar o grupo da mesa solta a entrada da porta', () => {
    const e = sincronizarPortaMesas({ ...base(), registros: [] }, 'v1')
    expect(e.fluxos.find((f) => f.codigo === 'BV-2')!.destino).toBe('')
  })

  it('a mesa oferece as entradas dela e as sem destino', () => {
    const e = sincronizarPortaMesas(base(), 'v1')
    expect(entradasParaMesa(e, e.registros[0]).map((f) => f.codigo)).toEqual(['BV-1', 'BV-2', 'BV-4'])
  })
})
