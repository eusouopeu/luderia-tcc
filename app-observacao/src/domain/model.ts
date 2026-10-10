/* Modelo do roteiro de observação (Bloco D): unidades com mesas e acervo,
   visitas (ficha, notas fiscais, temporizador), grupos nas mesas, fluxo na
   porta, contagens periódicas e medições de som. */

export type Mesa = { id: string; nome: string }
export type Acervo = {
  estantes: number
  prateleiras: number
  caixas: number
  instrutores: number
  atendentes: number
  jogos: string[]
}
export type Unidade = { id: string; nome: string; sigla: string; mesas: Mesa[]; acervo: Acervo }

export type ItemNota = { nome: string; qtd: number; un: string; valor: number }
export type NotaFiscal = {
  id: string
  momento: 'inicio' | 'fim' | 'extra'
  /** quando o QR foi lido (ISO local) */
  lidaEm: string
  chave: string
  url: string
  cnpj: string
  serie: number
  numero: number
  /** data e hora de emissão lidas na SEFAZ (ISO local), quando a consulta funcionou */
  emissao: string | null
  total: number | null
  itens: ItemNota[]
}
export type PrecoObservado = { item: string; preco: string }
export type Ficha = {
  cobranca: string
  valorCobranca: string
  precos: PrecoObservado[]
  condicoes: string[]
  observacoes: string
}
/** Datas em ISO local (sem fuso): 2026-10-18T14:00:00. */
export type Visita = {
  id: string
  unidadeId: string
  inicio: string
  fim: string | null
  duracaoMin: number
  intervaloMin: number
  /** tempo total pausado no temporizador */
  pausadoMs: number
  /** início da pausa em andamento */
  pausaDesde: string | null
  ficha: Ficha
  notas: NotaFiscal[]
}
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
  jogos: string[]
  notas: string
  pedidos: Pedido[]
}
export type CategoriaPedido = 'bebida' | 'comida' | 'sobremesa'
export const CATEGORIAS_PEDIDO: CategoriaPedido[] = ['bebida', 'comida', 'sobremesa']
/** Pedido feito pela mesa: hora do pedido e da chegada (tempo de espera). */
export type Pedido = { id: string; categoria: CategoriaPedido; descricao: string; pedido: string; chegada: string | null }
/** Foto de apoio (cardápio, estante, salão), sem pessoas. O arquivo fica em Documentos. */
export type Foto = {
  id: string
  unidadeId: string
  visitaId: string | null
  categoria: string
  hora: string
  /** caminho relativo (ObservacaoLuderia/fotos/…) no armazenamento do celular */
  arquivo: string
  /** miniatura em data URL para a lista */
  miniatura: string
  nota: string
}
/** Medida feita numa foto pela escala de um objeto de referência no mesmo plano. */
export type Medida = {
  id: string
  unidadeId: string
  visitaId: string | null
  rotulo: string
  cm: number
  referencia: string
  refCm: number
  fotoId: string
  hora: string
}
/** Passagem de um grupo pela porta. Entrada e saída do mesmo grupo têm o mesmo código. */
export type Fluxo = {
  id: string
  visitaId: string
  codigo: string
  tipo: 'entrada' | 'saida'
  hora: string
  pessoas: number
  criancas: number
}
/** Contagem periódica de mesas ocupadas (etapa 0 = inicial). */
export type Contagem = {
  id: string
  visitaId: string
  etapa: number
  /** hora em que foi concluída; null = em andamento */
  hora: string | null
  mesas: Record<string, 'ocupada' | 'vazia'>
}
export type Medicao = {
  id: string
  visitaId: string
  hora: string
  /** nível equivalente dos últimos 10 s, dB estimado */
  db: number
  pico: number
  pessoas: number
}
export type Config = { calibracaoDb: number; duracaoMin: number; intervaloMin: number }
export type Estado = {
  unidades: Unidade[]
  visitas: Visita[]
  registros: Registro[]
  fluxos: Fluxo[]
  contagens: Contagem[]
  medicoes: Medicao[]
  fotos: Foto[]
  medidas: Medida[]
  config: Config
}

export const novoId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7)

export const acervoVazio = (): Acervo => ({ estantes: 0, prateleiras: 0, caixas: 0, instrutores: 0, atendentes: 0, jogos: [] })
export const fichaVazia = (): Ficha => ({ cobranca: '', valorCobranca: '', precos: [], condicoes: [], observacoes: '' })
export const configPadrao = (): Config => ({ calibracaoDb: 90, duracaoMin: 180, intervaloMin: 30 })

export const siglaDe = (nome: string) =>
  nome
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => p[0])
    .join('')
    .toUpperCase()
    .slice(0, 3) || 'U'

export function estadoInicial(): Estado {
  return {
    unidades: [
      {
        id: 'bela-vista',
        nome: 'Bela Vista',
        sigla: 'BV',
        mesas: Array.from({ length: 6 }, (_, i) => ({ id: `m${i + 1}`, nome: `Mesa ${i + 1}` })),
        acervo: acervoVazio(),
      },
    ],
    visitas: [],
    registros: [],
    fluxos: [],
    contagens: [],
    medicoes: [],
    fotos: [],
    medidas: [],
    config: configPadrao(),
  }
}

/** Completa um estado salvo por versão anterior com os campos novos. */
export function normalizar(e: Partial<Estado>): Estado {
  const config = { ...configPadrao(), ...e.config }
  return {
    unidades: (e.unidades ?? []).map((u) => ({ ...u, sigla: u.sigla || siglaDe(u.nome), acervo: { ...acervoVazio(), ...u.acervo } })),
    visitas: (e.visitas ?? []).map((v) => ({
      ...v,
      duracaoMin: v.duracaoMin ?? config.duracaoMin,
      intervaloMin: v.intervaloMin ?? config.intervaloMin,
      pausadoMs: v.pausadoMs ?? 0,
      pausaDesde: v.pausaDesde ?? null,
      notas: v.notas ?? [],
      ficha: { ...fichaVazia(), ...v.ficha },
    })),
    registros: (e.registros ?? []).map((r) => ({ ...r, jogos: r.jogos ?? [], pedidos: r.pedidos ?? [] })),
    fluxos: e.fluxos ?? [],
    contagens: e.contagens ?? [],
    medicoes: e.medicoes ?? [],
    fotos: e.fotos ?? [],
    medidas: e.medidas ?? [],
    config,
  }
}

const dois = (n: number) => String(n).padStart(2, '0')
export const hojeIso = (d = new Date()) => `${d.getFullYear()}-${dois(d.getMonth() + 1)}-${dois(d.getDate())}`
export const agoraHora = (d = new Date()) => `${dois(d.getHours())}:${dois(d.getMinutes())}`
export const agoraIso = (d = new Date()) => `${hojeIso(d)}T${agoraHora(d)}:${dois(d.getSeconds())}`

export const visitaAtiva = (e: Estado, unidadeId: string) =>
  e.visitas.find((v) => v.unidadeId === unidadeId && v.fim === null)

/** Visita em andamento ou, sem ela, a mais recente da unidade. */
export const visitaAtual = (e: Estado, unidadeId: string) =>
  visitaAtiva(e, unidadeId) ??
  e.visitas.filter((v) => v.unidadeId === unidadeId).sort((a, b) => b.inicio.localeCompare(a.inicio))[0]

export const registroAberto = (e: Estado, visitaId: string, mesaId: string) =>
  e.registros.find((r) => r.visitaId === visitaId && r.mesaId === mesaId && r.saida === null)

export const minutos = (h: string) => {
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

/** Minutos entre o pedido e a chegada; null se não chegou. */
export const esperaPedido = (p: Pedido) => permanenciaMin(p.pedido, p.chegada)
export const esperaMin = esperaPedido

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

/** Grupos dentro da casa pelo fluxo da porta: entradas sem saída do mesmo código. */
export function gruposDentro(e: Estado, visitaId: string): Fluxo[] {
  const fl = e.fluxos.filter((f) => f.visitaId === visitaId)
  const saiu = new Set(fl.filter((f) => f.tipo === 'saida').map((f) => f.codigo))
  return fl.filter((f) => f.tipo === 'entrada' && !saiu.has(f.codigo))
}

/** Pessoas no interior agora: saldo do fluxo; sem fluxo, soma das mesas ocupadas. */
export function pessoasDentro(e: Estado, visitaId: string): number {
  const fl = e.fluxos.filter((f) => f.visitaId === visitaId)
  if (fl.length) return fl.reduce((s, f) => s + (f.tipo === 'entrada' ? f.pessoas : -f.pessoas), 0)
  return e.registros.filter((r) => r.visitaId === visitaId && r.saida === null).reduce((s, r) => s + r.pessoas, 0)
}

/* ---------- CSV ---------- */

function celula(v: string | number | null | undefined): string {
  const s = v === null || v === undefined ? '' : String(v)
  return /[;"\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

/** CSV com separador ";" e BOM para o Excel. */
export function csv(colunas: readonly string[], linhas: (string | number | null | undefined)[][]): string {
  return '﻿' + [colunas.join(';'), ...linhas.map((l) => l.map(celula).join(';'))].join('\r\n') + '\r\n'
}

const nomeUnidade = (e: Estado, id: string) => e.unidades.find((u) => u.id === id)?.nome ?? id

/** Um grupo por linha (registros das mesas); opcionalmente de uma unidade. */
export function paraCsv(e: Estado, unidadeId?: string): string {
  const regs = e.registros
    .filter((r) => !unidadeId || r.unidadeId === unidadeId)
    .sort((a, b) => (a.data + a.entrada).localeCompare(b.data + b.entrada))
  return csv(
    ['unidade', 'visita_inicio', 'visita_fim', 'mesa', 'data', 'entrada', 'saida', 'permanencia_min', 'censurada', 'pessoas', 'criancas', 'aniversario', 'instrutor_vezes', 'jogos', 'notas'],
    regs.map((r) => {
      const u = e.unidades.find((x) => x.id === r.unidadeId)
      const v = e.visitas.find((x) => x.id === r.visitaId)
      return [
        u?.nome ?? '', v?.inicio, v?.fim, u?.mesas.find((m) => m.id === r.mesaId)?.nome ?? r.mesaId, r.data, r.entrada, r.saida,
        permanenciaMin(r.entrada, r.saida), r.saida === null ? 'sim' : 'nao', r.pessoas, r.criancas, r.aniversario ? 'sim' : 'nao',
        r.instrutor, (r.jogos ?? []).join(' | '), r.notas,
      ]
    }),
  )
}

const daUnidade = (e: Estado, unidadeId?: string) => (vId: string) =>
  !unidadeId || e.visitas.find((v) => v.id === vId)?.unidadeId === unidadeId

/** Todos os arquivos da exportação, com o prefixo `contagem_` do Bloco D. */
export function arquivosCsv(e: Estado, unidadeId?: string): { nome: string; conteudo: string }[] {
  const ok = daUnidade(e, unidadeId)
  const visitas = e.visitas.filter((v) => ok(v.id))
  const vis = (id: string) => e.visitas.find((v) => v.id === id)
  const notaDe = (v: Visita, m: NotaFiscal['momento']) => v.notas.find((n) => n.momento === m)
  return [
    { nome: 'contagem_grupos_mesa.csv', conteudo: paraCsv(e, unidadeId) },
    {
      nome: 'contagem_fluxo.csv',
      conteudo: csv(
        ['unidade', 'visita_inicio', 'codigo', 'tipo', 'hora', 'pessoas', 'criancas'],
        e.fluxos.filter((f) => ok(f.visitaId)).map((f) => {
          const v = vis(f.visitaId)!
          return [nomeUnidade(e, v.unidadeId), v.inicio, f.codigo, f.tipo, f.hora, f.pessoas, f.criancas]
        }),
      ),
    },
    {
      nome: 'contagem_rodadas.csv',
      conteudo: csv(
        ['unidade', 'visita_inicio', 'etapa', 'hora', 'mesas_total', 'mesas_ocupadas', 'mesas_vazias', 'mesas_sem_marca'],
        e.contagens.filter((c) => ok(c.visitaId)).map((c) => {
          const v = vis(c.visitaId)!
          const u = e.unidades.find((x) => x.id === v.unidadeId)
          const marcas = Object.values(c.mesas)
          const total = u?.mesas.length ?? marcas.length
          const oc = marcas.filter((m) => m === 'ocupada').length
          const va = marcas.filter((m) => m === 'vazia').length
          return [nomeUnidade(e, v.unidadeId), v.inicio, c.etapa, c.hora, total, oc, va, total - oc - va]
        }),
      ),
    },
    {
      nome: 'contagem_acustica.csv',
      conteudo: csv(
        ['unidade', 'visita_inicio', 'hora', 'db_leq10s_estimado', 'db_pico', 'pessoas_dentro', 'calibracao_db'],
        e.medicoes.filter((m) => ok(m.visitaId)).map((m) => {
          const v = vis(m.visitaId)!
          return [nomeUnidade(e, v.unidadeId), v.inicio, m.hora, m.db, m.pico, m.pessoas, e.config.calibracaoDb]
        }),
      ),
    },
    {
      nome: 'contagem_visitas.csv',
      conteudo: csv(
        ['unidade', 'visita_inicio', 'visita_fim', 'duracao_prevista_min', 'pausado_min', 'cobranca', 'valor_cobranca', 'condicoes', 'observacoes',
          'nfce_inicio_serie', 'nfce_inicio_numero', 'nfce_inicio_emissao', 'nfce_fim_serie', 'nfce_fim_numero', 'nfce_fim_emissao', 'cnpj'],
        visitas.map((v) => {
          const a = notaDe(v, 'inicio')
          const b = notaDe(v, 'fim')
          return [
            nomeUnidade(e, v.unidadeId), v.inicio, v.fim, v.duracaoMin, Math.round(v.pausadoMs / 60000), v.ficha.cobranca, v.ficha.valorCobranca,
            v.ficha.condicoes.join(' | '), v.ficha.observacoes, a?.serie, a?.numero, a?.emissao, b?.serie, b?.numero, b?.emissao, a?.cnpj ?? b?.cnpj,
          ]
        }),
      ),
    },
    {
      nome: 'contagem_precos.csv',
      conteudo: csv(
        ['unidade', 'visita_inicio', 'origem', 'item', 'qtd', 'un', 'valor'],
        visitas.flatMap((v) => [
          ...v.ficha.precos.map((p) => [nomeUnidade(e, v.unidadeId), v.inicio, 'cardapio', p.item, '', '', p.preco]),
          ...v.notas.flatMap((n) => n.itens.map((i) => [nomeUnidade(e, v.unidadeId), v.inicio, `nfce_${n.momento}_${n.numero}`, i.nome, i.qtd, i.un, i.valor])),
        ]),
      ),
    },
    {
      nome: 'contagem_pedidos.csv',
      conteudo: csv(
        ['unidade', 'visita_inicio', 'mesa', 'grupo_entrada', 'pessoas', 'categoria', 'descricao', 'pedido', 'chegada', 'espera_min', 'pendente'],
        e.registros
          .filter((r) => ok(r.visitaId))
          .flatMap((r) => {
            const v = vis(r.visitaId)!
            const u = e.unidades.find((x) => x.id === r.unidadeId)
            const mesa = u?.mesas.find((m) => m.id === r.mesaId)?.nome ?? r.mesaId
            return r.pedidos.map((p) => [nomeUnidade(e, v.unidadeId), v.inicio, mesa, r.entrada, r.pessoas, p.categoria, p.descricao, p.pedido, p.chegada, esperaPedido(p), p.chegada ? 'nao' : 'sim'])
          }),
      ),
    },
    {
      nome: 'contagem_medidas.csv',
      conteudo: csv(
        ['unidade', 'visita_inicio', 'hora', 'rotulo', 'cm', 'referencia', 'referencia_cm', 'foto'],
        e.medidas
          .filter((m) => !unidadeId || m.unidadeId === unidadeId)
          .map((m) => [nomeUnidade(e, m.unidadeId), m.visitaId ? vis(m.visitaId)?.inicio : '', m.hora, m.rotulo, m.cm, m.referencia, m.refCm, e.fotos.find((f) => f.id === m.fotoId)?.arquivo.split('/').pop()]),
      ),
    },
    {
      nome: 'contagem_fotos.csv',
      conteudo: csv(
        ['unidade', 'visita_inicio', 'hora', 'categoria', 'arquivo', 'nota'],
        e.fotos
          .filter((f) => !unidadeId || f.unidadeId === unidadeId)
          .map((f) => [nomeUnidade(e, f.unidadeId), f.visitaId ? vis(f.visitaId)?.inicio : '', f.hora, f.categoria, f.arquivo.split('/').pop(), f.nota]),
      ),
    },
    {
      nome: 'contagem_unidades.csv',
      conteudo: csv(
        ['unidade', 'mesas', 'estantes', 'prateleiras_por_estante', 'caixas_por_prateleira', 'capacidade_caixas', 'instrutores', 'atendentes', 'jogos_vistos'],
        e.unidades
          .filter((u) => !unidadeId || u.id === unidadeId)
          .map((u) => {
            const a = u.acervo
            return [u.nome, u.mesas.length, a.estantes, a.prateleiras, a.caixas, a.estantes * a.prateleiras * a.caixas, a.instrutores, a.atendentes, a.jogos.join(' | ')]
          }),
      ),
    },
  ]
}
