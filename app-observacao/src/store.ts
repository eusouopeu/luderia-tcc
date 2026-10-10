import { create } from 'zustand'
import { estadoInicial, type Estado } from './domain/model'
import { abrirRepo, type Repo } from './storage/repo'

type Loja = {
  pronto: boolean
  estado: Estado
  iniciar(): Promise<void>
  mudar(f: (e: Estado) => Estado): void
}

let repo: Repo | null = null

export const useLoja = create<Loja>((set, get) => ({
  pronto: false,
  estado: estadoInicial(),
  async iniciar() {
    repo = await abrirRepo()
    const salvo = await repo.carregar()
    set({ pronto: true, estado: salvo ?? estadoInicial() })
  },
  mudar(f) {
    const estado = f(get().estado)
    set({ estado })
    void repo?.salvar(estado)
  },
}))
