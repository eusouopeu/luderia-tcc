import type { ReactNode } from 'react'
import { MinusIcon, PlusIcon, XMarkIcon } from '@heroicons/react/24/outline'

export function Rotulo({ icone, children, className = '' }: { icone?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div className={`mb-1.5 mt-4 flex items-center gap-1.5 text-[13px] font-extrabold uppercase first:mt-0 ${className}`}>
      {icone}
      {children}
    </div>
  )
}

/** Folha que sobe de baixo; toque fora fecha. */
export function Folha({ titulo, onFechar, children }: { titulo: string; onFechar: () => void; children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-30 flex flex-col justify-end bg-black/40" onClick={onFechar}>
      <div className="max-h-[88dvh] overflow-y-auto rounded-t-2xl bg-white p-4 safe-bottom" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-center">
          <h2 className="flex-1 text-lg font-extrabold">{titulo}</h2>
          <button onClick={onFechar} className="p-1" aria-label="Fechar">
            <XMarkIcon className="size-6" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function Fab({ onClick, rotulo, children }: { onClick: () => void; rotulo: string; children?: ReactNode }) {
  return (
    <button
      onClick={onClick}
      aria-label={rotulo}
      className="fixed bottom-[84px] right-5 z-10 grid size-16 place-items-center rounded-full bg-orange-700 text-white shadow-lg active:scale-95"
    >
      {children ?? <PlusIcon className="size-8" />}
    </button>
  )
}

export function Chip({ children, onClick, ativo = true }: { children: ReactNode; onClick?: () => void; ativo?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-0.5 text-[15px] ${
        ativo ? 'border-slate-400 bg-slate-300 text-slate-700' : 'border-slate-300 bg-white text-slate-500'
      }`}
    >
      {children}
    </button>
  )
}

const menos = 'grid place-items-center bg-rose-500 text-white'
const mais = 'grid place-items-center bg-emerald-600 text-white'

/** Número grande com − e + embaixo (pessoas, crianças). */
export function ContadorV({ valor, onChange }: { valor: number; onChange: (v: number) => void }) {
  return (
    <div className="overflow-hidden rounded-lg">
      <div className="grid h-[72px] place-items-center bg-white text-3xl font-extrabold">{valor}</div>
      <div className="grid h-12 grid-cols-2">
        <button onClick={() => onChange(Math.max(0, valor - 1))} className={menos} aria-label="Menos">
          <MinusIcon className="size-6 stroke-[3]" />
        </button>
        <button onClick={() => onChange(valor + 1)} className={mais} aria-label="Mais">
          <PlusIcon className="size-6 stroke-[3]" />
        </button>
      </div>
    </div>
  )
}

/** − número + em linha. `suave` = cores claras do formulário do acervo. */
export function ContadorH({
  valor,
  onChange,
  sufixo = '',
  suave = false,
  altura = 'h-11',
}: {
  valor: number
  onChange: (v: number) => void
  sufixo?: string
  suave?: boolean
  altura?: string
}) {
  const m = suave ? 'grid place-items-center bg-rose-300 text-rose-800' : menos
  const p = suave ? 'grid place-items-center bg-emerald-400 text-emerald-900' : mais
  return (
    <div className={`flex ${altura} overflow-hidden rounded-lg ${suave ? 'border border-rose-900/40' : ''}`}>
      <button onClick={() => onChange(Math.max(0, valor - 1))} className={`w-12 ${m}`} aria-label="Menos">
        <MinusIcon className="size-6 stroke-[3]" />
      </button>
      <span className="grid flex-1 place-items-center bg-white text-2xl font-extrabold text-slate-900">
        <span>
          {valor}
          {sufixo && <span className="text-lg">{sufixo}</span>}
        </span>
      </span>
      <button onClick={() => onChange(valor + 1)} className={`w-12 ${p}`} aria-label="Mais">
        <PlusIcon className="size-6 stroke-[3]" />
      </button>
    </div>
  )
}

export const campo = 'h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-[16px] outline-none focus:border-orange-500'
