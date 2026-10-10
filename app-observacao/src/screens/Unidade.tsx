import type { ComponentType, ReactNode, SVGProps } from 'react'
import {
  ArrowsRightLeftIcon,
  ArrowUpTrayIcon,
  BookOpenIcon,
  ChartBarIcon,
  ChevronLeftIcon,
  ClockIcon,
  Cog6ToothIcon,
  HomeIcon,
  MicrophoneIcon,
  Squares2X2Icon,
} from '@heroicons/react/24/outline'
import { HomeIcon as HomeSolid, BookOpenIcon as BookSolid, ChartBarIcon as ChartSolid, Cog6ToothIcon as CogSolid } from '@heroicons/react/24/solid'
import type { Unidade as TUnidade } from '../domain/model'

export type Aba = 'mesas' | 'fluxo' | 'acustica' | 'timer'
export type Pagina = 'inicio' | 'visita' | 'resumo' | 'ajustes'
type Icone = ComponentType<SVGProps<SVGSVGElement>>

const ABAS: [Aba, Icone, string][] = [
  ['mesas', Squares2X2Icon, 'Mesas'],
  ['fluxo', ArrowsRightLeftIcon, 'Fluxo'],
  ['acustica', MicrophoneIcon, 'Acústica'],
  ['timer', ClockIcon, 'Temporizador'],
]
const PAGINAS: [Pagina, Icone, Icone, string][] = [
  ['inicio', HomeIcon, HomeSolid, 'Início'],
  ['visita', BookOpenIcon, BookSolid, 'Visita'],
  ['resumo', ChartBarIcon, ChartSolid, 'Resumo'],
  ['ajustes', Cog6ToothIcon, CogSolid, 'Ajustes'],
]

/** Casca da unidade: cabeçalho, abas de observação (só no Início) e barra inferior. */
export function Unidade({
  unidade,
  aba,
  pagina,
  onAba,
  onPagina,
  onVoltar,
  onExportar,
  children,
}: {
  unidade: TUnidade
  aba: Aba
  pagina: Pagina
  onAba: (a: Aba) => void
  onPagina: (p: Pagina) => void
  onVoltar: () => void
  onExportar: () => void
  children: ReactNode
}) {
  return (
    <div className="min-h-dvh bg-white pb-[72px] safe-top">
      <header className="flex items-center gap-3 px-4 pb-2 pt-5">
        <button onClick={onVoltar} className="p-1" aria-label="Voltar às unidades">
          <ChevronLeftIcon className="size-7" />
        </button>
        <h1 className="flex-1 truncate text-3xl font-extrabold uppercase text-black">{unidade.nome}</h1>
        <button onClick={onExportar} className="p-2 text-orange-700" aria-label="Exportar CSV">
          <ArrowUpTrayIcon className="size-7" />
        </button>
      </header>
      {pagina === 'inicio' && (
        <nav className="mx-4 mt-2 flex h-12 overflow-hidden rounded-lg bg-slate-300">
          {ABAS.map(([id, I, rot]) => (
            <button key={id} onClick={() => onAba(id)} aria-label={rot} className={`grid flex-1 place-items-center rounded-lg ${aba === id ? 'bg-orange-600 text-white' : 'text-slate-900'}`}>
              <I className="size-7" />
            </button>
          ))}
        </nav>
      )}
      {children}
      <nav className="fixed inset-x-0 bottom-0 z-10 flex border-t border-slate-300 bg-white safe-bottom">
        {PAGINAS.map(([id, I, Ativo, rot]) => {
          const on = pagina === id
          const C = on ? Ativo : I
          return (
            <button key={id} onClick={() => onPagina(id)} aria-label={rot} className={`grid h-16 flex-1 place-items-center ${on ? 'text-orange-700' : 'text-slate-900'}`}>
              <C className="size-8" />
            </button>
          )
        })}
      </nav>
    </div>
  )
}
