import { CATEGORIAS_PEDIDO, esperaPedido, minutos, permanenciaMin, type CategoriaPedido, type Estado } from './model'
import { notasEmitidas } from './nfce'
import { situacaoTimer } from './temporizador'

const media = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null)
const mediana = (xs: number[]) => {
  if (!xs.length) return null
  const s = [...xs].sort((a, b) => a - b)
  const m = Math.floor(s.length / 2)
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
}
const r1 = (x: number | null) => (x === null ? null : Math.round(x * 10) / 10)

/** Indicadores de uma visita (saídas do Bloco D em _instrucoes/4_metodologia.md). */
export function resumoVisita(e: Estado, visitaId: string) {
  const v = e.visitas.find((x) => x.id === visitaId)!
  const u = e.unidades.find((x) => x.id === v.unidadeId)
  const duracaoMin = situacaoTimer(v).decorridoMin
  const horas = duracaoMin / 60

  // porta
  const fl = e.fluxos.filter((f) => f.visitaId === visitaId)
  const ent = fl.filter((f) => f.tipo === 'entrada')
  const sai = fl.filter((f) => f.tipo === 'saida')
  const entraram = ent.reduce((s, f) => s + f.pessoas, 0)
  const sairam = sai.reduce((s, f) => s + f.pessoas, 0)
  const permsFluxo = sai
    .map((s) => {
      const en = ent.find((x) => x.codigo === s.codigo)
      const a = en && minutos(en.hora)
      const b = minutos(s.hora)
      return a != null && b != null && b >= a ? b - a : null
    })
    .filter((x): x is number => x !== null)
  const fluxo = {
    grupos: ent.length,
    entraram,
    sairam,
    saldo: entraram - sairam,
    criancas: ent.reduce((s, f) => s + f.criancas, 0),
    pessoasHora: horas > 0 ? r1(entraram / horas) : null,
    tamanhoGrupo: r1(media(ent.map((f) => f.pessoas))),
    permanenciaMedia: r1(media(permsFluxo)),
    censurados: ent.length - permsFluxo.length,
  }

  // mesas
  const regs = e.registros.filter((r) => r.visitaId === visitaId)
  const perms = regs.map((r) => permanenciaMin(r.entrada, r.saida)).filter((x): x is number => x !== null)
  const contJogos = new Map<string, number>()
  regs.forEach((r) => r.jogos.forEach((j) => contJogos.set(j, (contJogos.get(j) ?? 0) + 1)))
  const mesas = {
    grupos: regs.length,
    pessoas: regs.reduce((s, r) => s + r.pessoas, 0),
    criancas: regs.reduce((s, r) => s + r.criancas, 0),
    tamanhoGrupo: r1(media(regs.map((r) => r.pessoas))),
    permanenciaMedia: r1(media(perms)),
    permanenciaMediana: mediana(perms),
    censurados: regs.length - perms.length,
    aniversarios: regs.filter((r) => r.aniversario).length,
    instrutorPorGrupo: r1(media(regs.map((r) => r.instrutor))),
    jogos: [...contJogos].sort((a, b) => b[1] - a[1]).slice(0, 8),
  }

  // pedidos (tempo de espera por categoria)
  const peds = regs.flatMap((r) => r.pedidos)
  const esperaMedia = {} as Record<CategoriaPedido, number | null>
  for (const c of CATEGORIAS_PEDIDO)
    esperaMedia[c] = r1(media(peds.filter((p) => p.categoria === c).map(esperaPedido).filter((x): x is number => x !== null)))
  const pedidos = {
    total: peds.length,
    pendentes: peds.filter((p) => !p.chegada).length,
    porGrupo: regs.length ? r1(peds.length / regs.length) : null,
    esperaMedia,
    porCategoria: Object.fromEntries(CATEGORIAS_PEDIDO.map((c) => [c, peds.filter((p) => p.categoria === c).length])) as Record<CategoriaPedido, number>,
  }

  // contagens periódicas
  const nMesas = u?.mesas.length ?? 0
  const ocup = e.contagens
    .filter((c) => c.visitaId === visitaId && c.hora)
    .sort((a, b) => a.etapa - b.etapa)
    .map((c) => ({ etapa: c.etapa, hora: c.hora!, ocupadas: Object.values(c.mesas).filter((m) => m === 'ocupada').length }))
  const contagens = {
    feitas: ocup.length,
    serie: ocup,
    pico: ocup.length ? Math.max(...ocup.map((o) => o.ocupadas)) : null,
    ocupacaoMedia: nMesas && ocup.length ? r1((100 * media(ocup.map((o) => o.ocupadas))!) / nMesas) : null,
  }

  // notas fiscais
  const ini = v.notas.find((n) => n.momento === 'inicio')
  const fim = v.notas.find((n) => n.momento === 'fim')
  const emitidas = notasEmitidas(ini, fim)
  const pessoasBase = fl.length ? entraram : mesas.pessoas
  const extras = v.notas.filter((n) => n.total !== null)

  // som
  const med = e.medicoes.filter((m) => m.visitaId === visitaId)

  return {
    duracaoMin,
    fluxo,
    mesas,
    pedidos,
    contagens,
    notasEmitidas: emitidas,
    notasPorHora: emitidas !== null && horas > 0 ? r1(emitidas / horas) : null,
    pessoasPorNota: emitidas ? r1(pessoasBase / emitidas) : null,
    ticketNotasLidas: r1(media(extras.map((n) => n.total!))),
    acustica: {
      medicoes: med.length,
      media: r1(media(med.map((m) => m.db))),
      maximo: med.length ? Math.max(...med.map((m) => m.pico)) : null,
    },
  }
}

export type Resumo = ReturnType<typeof resumoVisita>
