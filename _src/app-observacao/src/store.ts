import { create } from 'zustand'
import { agoraHora, agoraIso, estadoInicial, fichaVazia, normalizar, novoId, type Estado, type Papel, type Visita } from './domain/model'
import { abrirRepo, type Repo } from './storage/repo'
import { agendarBackup, gravarBackup } from './storage/backup'
import { agendarLembretes } from './storage/lembretes'

type Loja = {
  pronto: boolean
  estado: Estado
  iniciar(): Promise<void>
  mudar(f: (e: Estado) => Estado): void
  substituir(e: Partial<Estado>): void
  comecar(unidadeId: string, quem: { observador: string; papel: Papel }): Visita
  /** `fim` (ISO local): hora em que a observação acabou de fato; padrão, agora */
  encerrar(visitaId: string, fim?: string): void
  /** grava já (app indo para o fundo), sem esperar o agrupamento */
  gravarJa(): Promise<void>
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
  comecar(unidadeId, { observador, papel }) {
    const { config } = get().estado
    const v: Visita = {
      id: novoId(), unidadeId, inicio: agoraIso(), fim: null, duracaoMin: config.duracaoMin, intervaloMin: config.intervaloMin,
      pausadoMs: 0, pausaDesde: null, pausas: [], observador, papel, posicao: '', ficha: fichaVazia(), notas: [],
    }
    // o código escolhido fica como padrão deste celular nas próximas visitas
    get().mudar((e) => ({ ...e, config: { ...e.config, observador }, visitas: [...e.visitas, v] }))
    void agendarLembretes(v, nomeU(get().estado, v))
    return v
  },
  encerrar(visitaId, fim = agoraIso()) {
    get().mudar((e) => ({
      ...e,
      visitas: e.visitas.map((v) => {
        if (v.id !== visitaId) return v
        // pausa aberta termina no fim escolhido (nada, se o fim é anterior à pausa)
        const extra = v.pausaDesde ? Math.max(0, new Date(fim).getTime() - new Date(v.pausaDesde).getTime()) : 0
        const pausas = v.pausaDesde ? v.pausas.map((p) => (p.ate === null ? { ...p, ate: fim.slice(11, 16) } : p)) : v.pausas
        return { ...v, fim, pausaDesde: null, pausadoMs: v.pausadoMs + extra, pausas }
      }),
    }))
    void agendarLembretes(null)
  },
  async gravarJa() {
    clearTimeout(timer)
    const { estado } = get()
    await repo?.salvar(estado)
    await gravarBackup(estado)
  },
  alternarPausa(visitaId) {
    get().mudar((e) => ({
      ...e,
      visitas: e.visitas.map((v) => {
        if (v.id !== visitaId) return v
        if (v.pausaDesde)
          return {
            ...v,
            pausaDesde: null,
            pausadoMs: v.pausadoMs + (Date.now() - new Date(v.pausaDesde).getTime()),
            pausas: v.pausas.map((p) => (p.ate === null ? { ...p, ate: agoraHora() } : p)),
          }
        return { ...v, pausaDesde: agoraIso(), pausas: [...v.pausas, { de: agoraHora(), ate: null }] }
      }),
    }))
    const v = get().estado.visitas.find((x) => x.id === visitaId)!
    void agendarLembretes(v.pausaDesde ? null : v, nomeU(get().estado, v))
  },
}))
