import { create } from 'zustand'
import { agoraIso, estadoInicial, normalizar, novoId, type Estado, type Visita } from './domain/model'
import { abrirRepo, type Repo } from './storage/repo'
import { agendarBackup } from './storage/backup'
import { agendarLembretes } from './storage/lembretes'

type Loja = {
  pronto: boolean
  estado: Estado
  iniciar(): Promise<void>
  mudar(f: (e: Estado) => Estado): void
  substituir(e: Partial<Estado>): void
  comecar(unidadeId: string): Visita
  encerrar(visitaId: string): void
  alternarPausa(visitaId: string): void
}

let repo: Repo | null = null
let timer = 0

const nomeU = (e: Estado, v: Visita) => e.unidades.find((u) => u.id === v.unidadeId)?.nome ?? ''

export const useLoja = create<Loja>((set, get) => ({
  pronto: false,
  estado: estadoInicial(),
  async iniciar() {
    repo = await abrirRepo()
    const salvo = await repo.carregar()
    set({ pronto: true, estado: salvo ? normalizar(salvo) : estadoInicial() })
  },
  mudar(f) {
    const estado = f(get().estado)
    set({ estado })
    // texto digitado muda o estado a cada tecla: grava agrupado
    clearTimeout(timer)
    timer = window.setTimeout(() => void repo?.salvar(estado), 300)
    agendarBackup(estado)
  },
  substituir(e) {
    get().mudar(() => normalizar(e))
  },
  comecar(unidadeId) {
    const { config } = get().estado
    const v: Visita = {
      id: novoId(), unidadeId, inicio: agoraIso(), fim: null, duracaoMin: config.duracaoMin, intervaloMin: config.intervaloMin,
      pausadoMs: 0, pausaDesde: null, ficha: { cobranca: '', valorCobranca: '', precos: [], condicoes: [], observacoes: '' }, notas: [],
    }
    get().mudar((e) => ({ ...e, visitas: [...e.visitas, v] }))
    void agendarLembretes(v, nomeU(get().estado, v))
    return v
  },
  encerrar(visitaId) {
    const agora = agoraIso()
    get().mudar((e) => ({
      ...e,
      visitas: e.visitas.map((v) => {
        if (v.id !== visitaId) return v
        const extra = v.pausaDesde ? Date.now() - new Date(v.pausaDesde).getTime() : 0
        return { ...v, fim: agora, pausaDesde: null, pausadoMs: v.pausadoMs + extra }
      }),
    }))
    void agendarLembretes(null)
  },
  alternarPausa(visitaId) {
    get().mudar((e) => ({
      ...e,
      visitas: e.visitas.map((v) => {
        if (v.id !== visitaId) return v
        if (v.pausaDesde) return { ...v, pausaDesde: null, pausadoMs: v.pausadoMs + (Date.now() - new Date(v.pausaDesde).getTime()) }
        return { ...v, pausaDesde: agoraIso() }
      }),
    }))
    const v = get().estado.visitas.find((x) => x.id === visitaId)!
    void agendarLembretes(v.pausaDesde ? null : v, nomeU(get().estado, v))
  },
}))
