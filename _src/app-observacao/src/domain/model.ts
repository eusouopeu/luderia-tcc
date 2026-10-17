/* Modelo do roteiro de observação (Bloco B3): unidades com mesas e acervo,
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
  /** qual evento, quando a condição "Evento ou torneio" está marcada */
  evento: string
  observacoes: string
}
/** O que o observador cobre na visita (porta, mesas ou os dois). */
export type Papel = '' | 'porta' | 'mesas' | 'porta e mesas'
export const PAPEIS: Exclude<Papel, ''>[] = ['porta', 'mesas', 'porta e mesas']
export const POSICOES = ['Fora, com vista da porta', 'Dentro, no salão', 'Dentro, perto da porta', 'Outra']
/** Intervalo em que o observador parou de registrar (HH:MM; ate = null enquanto pausado). */
export type Pausa = { de: string; ate: string | null }
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
  /** pausas do temporizador, uma por intervalo */
  pausas: Pausa[]
  /** código do observador (POV1, POV2), copiado dos Ajustes ao começar */
  observador: string
  papel: Papel
  posicao: string
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
  /** pessoas contadas de longe ou sem certeza */
  pessoasEstimado: boolean
  /** como o grupo saiu: '' enquanto na mesa; fechamento = saída forçada pelo fim do expediente (censura) */
  saidaTipo: TipoSaida
  /** códigos da porta (fluxo) ligados a este grupo */
  fluxos: string[]
  /** vezes que o instrutor foi à mesa */
  instrutor: number
  jogos: string[]
  /** jogos vistos sem certeza (subconjunto de `jogos`) */
  jogosIncertos: string[]
  notas: string
  pedidos: Pedido[]
}
export type TipoSaida = '' | 'grupo' | 'fechamento'
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
  /** número de pessoas sem certeza */
  estimado: boolean
  /** só na entrada: para onde o grupo foi (`mesa:<id>`, ou um de DESTINOS) */
  destino: string
  /** só na saída: motivo (MOTIVOS_SAIDA); vazio = saída comum */
  motivo: string
}
/** Destinos de quem entra pela porta, além das mesas. */
export const DESTINOS = ['Balcão/loja', 'Retirada/delivery', 'Outro']
/** Motivos de uma saída rápida (logo depois da entrada) e da saída no fechamento. */
export const MOTIVOS_SAIDA = ['Lotado', 'Só olhou', 'Balcão/loja', 'Retirada/delivery', 'Outro']
export const MOTIVO_FECHAMENTO = 'Fechamento'
/** Saída até estes minutos depois da entrada pede o motivo. */
export const SAIDA_RAPIDA_MIN = 10
export const destinoMesa = (mesaId: string) => `mesa:${mesaId}`
export const mesaDoDestino = (destino: string) => (destino.startsWith('mesa:') ? destino.slice(5) : null)
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
export type Tema = 'sistema' | 'claro' | 'escuro'
export type Config = {
  calibracaoDb: number
  duracaoMin: number
  intervaloMin: number
  tema: Tema
  /** código deste celular nas visitas (POV1, POV2) */
  observador: string
  /** prefixo da casa no visita_id (SJ = São Jogue): AAAA-MM-DD_<prefixo><sigla> */
  prefixoCasa: string
}
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

/** Próximas `n` mesas, numeradas depois da maior "Mesa N" que já existe. */
export function novasMesas(mesas: Mesa[], n = 1): Mesa[] {
  const maior = mesas.reduce((m, x) => Math.max(m, Number(/^mesa\s*(\d+)$/i.exec(x.nome.trim())?.[1] ?? 0)), 0)
  const base = Math.max(maior, mesas.length)
  return Array.from({ length: n }, (_, i) => ({ id: novoId() + i, nome: `Mesa ${base + i + 1}` }))
}

/** Próximo código de grupo no fluxo da porta: maior número já usado + 1 (apagar um grupo não repete código). */
export function proximoCodigo(fluxos: Fluxo[], visitaId: string, sigla: string): string {
  const maior = fluxos
    .filter((f) => f.visitaId === visitaId && f.tipo === 'entrada')
    .reduce((m, f) => Math.max(m, Number(/-(\d+)$/.exec(f.codigo)?.[1] ?? 0)), 0)
  return `${sigla}-${maior + 1}`
}

export const acervoVazio = (): Acervo => ({ estantes: 0, prateleiras: 0, caixas: 0, instrutores: 0, atendentes: 0, jogos: [] })
export const fichaVazia = (): Ficha => ({ cobranca: '', valorCobranca: '', precos: [], condicoes: [], evento: '', observacoes: '' })
export const configPadrao = (): Config => ({ calibracaoDb: 90, duracaoMin: 180, intervaloMin: 30, tema: 'sistema', observador: '', prefixoCasa: 'SJ' })

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
      pausas: v.pausas ?? [],
      observador: v.observador ?? '',
      papel: v.papel ?? '',
      posicao: v.posicao ?? '',
      notas: v.notas ?? [],
      ficha: { ...fichaVazia(), ...v.ficha },
    })),
    registros: (e.registros ?? []).map((r) => ({
      ...r,
      jogos: r.jogos ?? [],
      jogosIncertos: r.jogosIncertos ?? [],
      pedidos: r.pedidos ?? [],
      pessoasEstimado: r.pessoasEstimado ?? false,
      saidaTipo: r.saidaTipo ?? (r.saida ? 'grupo' : ''),
      fluxos: r.fluxos ?? [],
    })),
    fluxos: (e.fluxos ?? []).map((f) => ({ ...f, estimado: f.estimado ?? false, destino: f.destino ?? '', motivo: f.motivo ?? '' })),
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
const versaoApp = () => (typeof __APP_VERSION__ === 'undefined' ? '' : __APP_VERSION__)

/** Identificador da visita no pipeline do B3: AAAA-MM-DD_<prefixo da casa><sigla da unidade> (ex.: 2026-10-10_SJBV). */
export function idVisita(e: Estado, v: Visita): string {
  const u = e.unidades.find((x) => x.id === v.unidadeId)
  return `${v.inicio.slice(0, 10)}_${e.config.prefixoCasa ?? ''}${u?.sigla ?? 'U'}`
}

/** Pausas como texto: "19:40-19:52 | 20:30-…". */
export const pausasTexto = (v: Visita) => (v.pausas ?? []).map((p) => `${p.de}-${p.ate ?? '…'}`).join(' | ')

/** Grupo censurado: sem saída vista ou com saída forçada pelo fechamento. */
export const censurado = (r: Pick<Registro, 'saida' | 'saidaTipo'>) => r.saida === null || r.saidaTipo === 'fechamento'

/**
 * Fechamento da casa: todos os grupos ainda nas mesas e na porta saem agora, marcados como
 * saída por fechamento (censura administrativa, não saída voluntária).
 */
export function fecharCasa(e: Estado, visitaId: string, hora: string): { estado: Estado; mesas: number; porta: number } {
  let mesas = 0
  const registros = e.registros.map((r) => {
    if (r.visitaId !== visitaId || r.saida !== null) return r
    mesas++
    return { ...r, saida: hora, saidaTipo: 'fechamento' as const }
  })
  const dentro = gruposDentro(e, visitaId)
  const saidas: Fluxo[] = dentro.map((f) => ({ ...f, id: novoId() + f.codigo, tipo: 'saida', hora, destino: '', motivo: MOTIVO_FECHAMENTO }))
  return { estado: { ...e, registros, fluxos: [...e.fluxos, ...saidas] }, mesas, porta: saidas.length }
}

const nomeMesa = (e: Estado, unidadeId: string, mesaId: string) => e.unidades.find((x) => x.id === unidadeId)?.mesas.find((m) => m.id === mesaId)?.nome ?? mesaId

/** Destino legível: "Mesa 3" no lugar de `mesa:<id>`. */
export function destinoTexto(e: Estado, unidadeId: string, destino: string): string {
  const m = mesaDoDestino(destino)
  return m ? nomeMesa(e, unidadeId, m) : destino
}

/**
 * Mantém a porta e as mesas de acordo: a entrada cujo código está em `Registro.fluxos` aponta
 * para a mesa desse grupo; a que apontava para uma mesa e perdeu o vínculo (grupo apagado,
 * código tirado na mesa) volta a ficar sem destino. Destinos fora das mesas não mudam.
 */
export function sincronizarPortaMesas(e: Estado, visitaId: string): Estado {
  const mesaDe = new Map<string, string>()
  e.registros
    .filter((r) => r.visitaId === visitaId)
    .sort((a, b) => a.entrada.localeCompare(b.entrada))
    .forEach((r) => (r.fluxos ?? []).forEach((c) => mesaDe.set(c, r.mesaId)))
  let mudou = false
  const fluxos = e.fluxos.map((f) => {
    if (f.visitaId !== visitaId || f.tipo !== 'entrada') return f
    const m = mesaDe.get(f.codigo)
    const destino = m ? destinoMesa(m) : mesaDoDestino(f.destino ?? '') ? '' : f.destino
    if (destino === f.destino) return f
    mudou = true
    return { ...f, destino }
  })
  return mudou ? { ...e, fluxos } : e
}

/** Entradas da porta que a mesa pode ligar: as já ligadas a ela e as que ainda não têm destino. */
export function entradasParaMesa(e: Estado, r: Registro): Fluxo[] {
  return e.fluxos
    .filter((f) => f.visitaId === r.visitaId && f.tipo === 'entrada' && ((r.fluxos ?? []).includes(f.codigo) || !f.destino))
    .sort((a, b) => a.hora.localeCompare(b.hora))
}

type Filtro = { unidadeId?: string; visitaId?: string }
const naVisita = (e: Estado, f: Filtro) => (vId: string | null) => {
  if (f.visitaId) return vId === f.visitaId
  if (!f.unidadeId) return true
  return !!vId && e.visitas.find((v) => v.id === vId)?.unidadeId === f.unidadeId
}

/** Colunas de identificação, à frente de cada tabela ligada a uma visita. */
const ID_COLS = ['visita_id', 'observador', 'versao_app', 'papel', 'unidade', 'visita_inicio'] as const
function idDe(e: Estado, v: Visita | undefined): (string | number | null)[] {
  if (!v) return ['', e.config.observador, versaoApp(), '', '', '']
  return [idVisita(e, v), v.observador || e.config.observador, versaoApp(), v.papel, nomeUnidade(e, v.unidadeId), v.inicio]
}

/** Um grupo por linha (registros das mesas); opcionalmente de uma unidade ou de uma visita. */
export function paraCsv(e: Estado, filtro: Filtro | string = {}): string {
  const f = typeof filtro === 'string' ? { unidadeId: filtro } : filtro
  const ok = naVisita(e, f)
  const regs = e.registros
    .filter((r) => (!f.unidadeId || r.unidadeId === f.unidadeId) && (!f.visitaId || ok(r.visitaId)))
    .sort((a, b) => (a.data + a.entrada).localeCompare(b.data + b.entrada))
  return csv(
    [...ID_COLS, 'visita_fim', 'mesa', 'data', 'entrada', 'saida', 'saida_tipo', 'permanencia_min', 'censurada', 'pessoas', 'pessoas_estimado', 'criancas',
      'aniversario', 'instrutor_vezes', 'fluxos_porta', 'jogos', 'jogos_incertos', 'notas'],
    regs.map((r) => {
      const v = e.visitas.find((x) => x.id === r.visitaId)
      return [
        ...idDe(e, v), v?.fim, nomeMesa(e, r.unidadeId, r.mesaId), r.data, r.entrada, r.saida, r.saidaTipo ?? '',
        permanenciaMin(r.entrada, r.saida), censurado(r) ? 'sim' : 'nao', r.pessoas, r.pessoasEstimado ? 'sim' : 'nao', r.criancas,
        r.aniversario ? 'sim' : 'nao', r.instrutor, (r.fluxos ?? []).join(' | '), (r.jogos ?? []).join(' | '), (r.jogosIncertos ?? []).join(' | '), r.notas,
      ]
    }),
  )
}

/**
 * Todos os arquivos da exportação, com o prefixo `contagem_` do Bloco B3. Com `visitaId`, só
 * aquela visita, e os nomes já no padrão do pipeline: <visita_id>_<observador>_contagem_<conteúdo>.csv.
 */
export function arquivosCsv(e: Estado, unidadeId?: string, visitaId?: string): { nome: string; conteudo: string }[] {
  const filtro: Filtro = { unidadeId, visitaId }
  const ok = naVisita(e, filtro)
  const visitas = e.visitas.filter((v) => ok(v.id))
  const vis = (id: string | null) => e.visitas.find((v) => v.id === id)
  const notaDe = (v: Visita, m: NotaFiscal['momento']) => v.notas.find((n) => n.momento === m)
  const daUnidade = (uId: string) => !unidadeId || uId === unidadeId
  const um = visitaId ? vis(visitaId) : undefined
  const prefixo = um ? `${idVisita(e, um)}_${um.observador || e.config.observador || 'POV'}_` : ''
  const tabelas = [
    { nome: 'grupos_mesa', conteudo: paraCsv(e, filtro) },
    {
      nome: 'fluxo',
      conteudo: csv(
        [...ID_COLS, 'codigo', 'tipo', 'hora', 'pessoas', 'pessoas_estimado', 'criancas', 'destino', 'motivo'],
        e.fluxos.filter((f) => ok(f.visitaId)).map((f) => {
          const v = vis(f.visitaId)!
          return [...idDe(e, v), f.codigo, f.tipo, f.hora, f.pessoas, f.estimado ? 'sim' : 'nao', f.criancas, destinoTexto(e, v.unidadeId, f.destino ?? ''), f.motivo ?? '']
        }),
      ),
    },
    {
      nome: 'rodadas',
      conteudo: csv(
        [...ID_COLS, 'etapa', 'hora', 'mesas_total', 'mesas_ocupadas', 'mesas_vazias', 'mesas_sem_marca'],
        e.contagens.filter((c) => ok(c.visitaId)).map((c) => {
          const v = vis(c.visitaId)!
          const u = e.unidades.find((x) => x.id === v.unidadeId)
          const marcas = Object.values(c.mesas)
          const total = u?.mesas.length ?? marcas.length
          const oc = marcas.filter((m) => m === 'ocupada').length
          const va = marcas.filter((m) => m === 'vazia').length
          return [...idDe(e, v), c.etapa, c.hora, total, oc, va, total - oc - va]
        }),
      ),
    },
    {
      nome: 'acustica',
      conteudo: csv(
        [...ID_COLS, 'hora', 'db_leq10s_estimado', 'db_pico', 'pessoas_dentro', 'calibracao_db'],
        e.medicoes.filter((m) => ok(m.visitaId)).map((m) => [...idDe(e, vis(m.visitaId)), m.hora, m.db, m.pico, m.pessoas, e.config.calibracaoDb]),
      ),
    },
    {
      nome: 'visitas',
      conteudo: csv(
        [...ID_COLS, 'visita_fim', 'posicao', 'duracao_prevista_min', 'pausado_min', 'pausas', 'cobranca', 'valor_cobranca', 'condicoes', 'evento', 'observacoes',
          'nfce_inicio_serie', 'nfce_inicio_numero', 'nfce_inicio_emissao', 'nfce_fim_serie', 'nfce_fim_numero', 'nfce_fim_emissao', 'cnpj'],
        visitas.map((v) => {
          const a = notaDe(v, 'inicio')
          const b = notaDe(v, 'fim')
          return [
            ...idDe(e, v), v.fim, v.posicao, v.duracaoMin, Math.round(v.pausadoMs / 60000), pausasTexto(v), v.ficha.cobranca, v.ficha.valorCobranca,
            v.ficha.condicoes.join(' | '), v.ficha.evento, v.ficha.observacoes, a?.serie, a?.numero, a?.emissao, b?.serie, b?.numero, b?.emissao, a?.cnpj ?? b?.cnpj,
          ]
        }),
      ),
    },
    {
      nome: 'precos',
      conteudo: csv(
        [...ID_COLS, 'origem', 'item', 'qtd', 'un', 'valor'],
        visitas.flatMap((v) => [
          ...v.ficha.precos.map((p) => [...idDe(e, v), 'cardapio', p.item, '', '', p.preco]),
          ...v.notas.flatMap((n) => n.itens.map((i) => [...idDe(e, v), `nfce_${n.momento}_${n.numero}`, i.nome, i.qtd, i.un, i.valor])),
        ]),
      ),
    },
    {
      nome: 'pedidos',
      conteudo: csv(
        [...ID_COLS, 'mesa', 'grupo_entrada', 'pessoas', 'categoria', 'descricao', 'pedido', 'chegada', 'espera_min', 'pendente'],
        e.registros
          .filter((r) => ok(r.visitaId))
          .flatMap((r) => {
            const v = vis(r.visitaId)!
            return r.pedidos.map((p) => [...idDe(e, v), nomeMesa(e, r.unidadeId, r.mesaId), r.entrada, r.pessoas, p.categoria, p.descricao, p.pedido, p.chegada, esperaPedido(p), p.chegada ? 'nao' : 'sim'])
          }),
      ),
    },
    {
      nome: 'medidas',
      conteudo: csv(
        [...ID_COLS, 'hora', 'rotulo', 'cm', 'referencia', 'referencia_cm', 'foto'],
        e.medidas
          .filter((m) => daUnidade(m.unidadeId) && (!visitaId || m.visitaId === visitaId))
          .map((m) => [...idDe(e, vis(m.visitaId)), m.hora, m.rotulo, m.cm, m.referencia, m.refCm, e.fotos.find((f) => f.id === m.fotoId)?.arquivo.split('/').pop()]),
      ),
    },
    {
      nome: 'fotos',
      conteudo: csv(
        [...ID_COLS, 'hora', 'categoria', 'arquivo', 'nota'],
        e.fotos
          .filter((f) => daUnidade(f.unidadeId) && (!visitaId || f.visitaId === visitaId))
          .map((f) => [...idDe(e, vis(f.visitaId)), f.hora, f.categoria, f.arquivo.split('/').pop(), f.nota]),
      ),
    },
    {
      nome: 'unidades',
      conteudo: csv(
        [...ID_COLS, 'mesas', 'estantes', 'prateleiras_por_estante', 'caixas_por_prateleira', 'capacidade_caixas', 'instrutores', 'atendentes', 'jogos_vistos'],
        e.unidades
          .filter((u) => daUnidade(u.id) && (!um || u.id === um.unidadeId))
          .map((u) => {
            const a = u.acervo
            const id = um ? idDe(e, um) : ['', e.config.observador, versaoApp(), '', u.nome, '']
            return [...id, u.mesas.length, a.estantes, a.prateleiras, a.caixas, a.estantes * a.prateleiras * a.caixas, a.instrutores, a.atendentes, a.jogos.join(' | ')]
          }),
      ),
    },
  ]
  return tabelas.map((t) => ({ nome: `${prefixo}contagem_${t.nome}.csv`, conteudo: t.conteudo }))
}
