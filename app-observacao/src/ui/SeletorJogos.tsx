import { useMemo, useState } from 'react'
import { CheckIcon, MagnifyingGlassIcon, PlusIcon } from '@heroicons/react/24/outline'
import { Folha } from './comum'
import JOGOS from '../domain/jogos.json'

type Jogo = { n: string; min: number | null; max: number | null; t: number | null }
const BANCO = JOGOS as Jogo[]
const sem = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

/** Busca no banco de jogos e marca/desmarca. O acervo da unidade aparece primeiro. */
export function SeletorJogos({
  titulo = 'Jogos',
  selecionados,
  destaque = [],
  onFechar,
  onMudar,
}: {
  titulo?: string
  selecionados: string[]
  /** jogos do acervo da unidade, listados antes */
  destaque?: string[]
  onFechar: () => void
  onMudar: (lista: string[]) => void
}) {
  const [busca, setBusca] = useState('')
  const lista = useMemo(() => {
    const extras = [...new Set([...destaque, ...selecionados])].filter((n) => !BANCO.some((j) => j.n === n))
    const todos: Jogo[] = [...extras.map((n) => ({ n, min: null, max: null, t: null })), ...BANCO]
    const q = sem(busca.trim())
    const filtrados = q ? todos.filter((j) => sem(j.n).includes(q)) : todos
    const peso = (j: Jogo) => (selecionados.includes(j.n) ? 0 : destaque.includes(j.n) ? 1 : 2)
    return filtrados.map((j, i) => ({ j, i })).sort((a, b) => peso(a.j) - peso(b.j) || a.i - b.i).map((x) => x.j)
  }, [busca, selecionados, destaque])
  const alternar = (n: string) => onMudar(selecionados.includes(n) ? selecionados.filter((x) => x !== n) : [...selecionados, n])
  const novo = busca.trim()
  const existe = lista.some((j) => sem(j.n) === sem(novo))

  return (
    <Folha titulo={`${titulo} · ${selecionados.length}`} onFechar={onFechar}>
      <label className="mb-3 flex h-11 items-center gap-2 rounded-lg border border-slate-300 px-3">
        <MagnifyingGlassIcon className="size-5 text-slate-400" />
        <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar jogo…" className="flex-1 outline-none" />
      </label>
      {novo && !existe && (
        <button onClick={() => (alternar(novo), setBusca(''))} className="mb-2 flex w-full items-center gap-2 rounded-lg bg-orange-100 px-3 py-2.5 font-semibold text-orange-700">
          <PlusIcon className="size-5" /> Adicionar “{novo}”
        </button>
      )}
      <ul className="divide-y divide-slate-100">
        {lista.slice(0, 120).map((j) => {
          const on = selecionados.includes(j.n)
          return (
            <li key={j.n}>
              <button onClick={() => alternar(j.n)} className="flex w-full items-center gap-3 py-2.5 text-left">
                <span className={`grid size-6 shrink-0 place-items-center rounded border ${on ? 'border-orange-600 bg-orange-600 text-white' : 'border-slate-300'}`}>
                  {on && <CheckIcon className="size-4 stroke-[3]" />}
                </span>
                <span className="flex-1">
                  {j.n}
                  {destaque.includes(j.n) && <span className="ml-2 text-xs font-bold text-orange-600">ACERVO</span>}
                </span>
                {j.min && (
                  <span className="text-xs text-slate-400">
                    {j.min}–{j.max}p{j.t ? ` · ${j.t}min` : ''}
                  </span>
                )}
              </button>
            </li>
          )
        })}
      </ul>
    </Folha>
  )
}
