import type { ReactNode } from 'react'
import { MinusIcon, PlusIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { Ajuda } from './Ajuda'

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
    <div className="fixed inset-0 z-30 flex flex-col justify-end bg-tinta/40" onClick={onFechar}>
      <div className="max-h-[88dvh] overflow-y-auto rounded-t-2xl bg-papel p-4 safe-bottom" onClick={(e) => e.stopPropagation()}>
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

/** Botão flutuante (camada real sobre o conteúdo: pode ter sombra). `badge` = contagem discreta. */
export function Fab({ onClick, rotulo, children, badge, desligado }: { onClick: () => void; rotulo: string; children?: ReactNode; badge?: number; desligado?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={desligado}
      aria-label={rotulo}
      title={rotulo}
      className="fixed bottom-[84px] right-5 z-10 grid size-16 place-items-center rounded-full bg-caneta-700 text-papel shadow-lg disabled:opacity-50"
    >
      {children ?? <PlusIcon className="size-8" />}
      {!!badge && <span className="absolute -right-1 -top-1 grid h-6 min-w-6 place-items-center rounded-full bg-papel px-1 text-xs font-bold text-caneta-700">{badge}</span>}
    </button>
  )
}

export function Chip({ children, onClick, ativo = true }: { children: ReactNode; onClick?: () => void; ativo?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-0.5 text-[15px] ${ativo ? 'bg-neutro-300 text-neutro-800' : 'bg-neutro-100 text-neutro-500'}`}
    >
      {children}
    </button>
  )
}

const menos = 'grid place-items-center bg-erro-500 text-papel'
const mais = 'grid place-items-center bg-ok-600 text-papel'

/** Número grande com − e + embaixo (pessoas, crianças). */
export function ContadorV({ valor, onChange }: { valor: number; onChange: (v: number) => void }) {
  return (
    <div className="overflow-hidden rounded-lg">
      <div className="grid h-[72px] place-items-center bg-papel text-3xl font-extrabold">{valor}</div>
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
  const m = suave ? 'grid place-items-center bg-erro-300 text-erro-800' : menos
  const p = suave ? 'grid place-items-center bg-ok-400 text-ok-900' : mais
  return (
    <div className={`flex ${altura} overflow-hidden rounded-lg`}>
      <button onClick={() => onChange(Math.max(0, valor - 1))} className={`w-12 ${m}`} aria-label="Menos">
        <MinusIcon className="size-6 stroke-[3]" />
      </button>
      <span className="grid flex-1 place-items-center bg-papel text-2xl font-extrabold text-neutro-900">
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

/** Campo sobre fundo branco: separa-se pelo tom, sem borda; anel azul só no foco. */
export const campo = 'h-10 w-full rounded-lg bg-neutro-100 px-3 text-[16px] outline-none focus:ring-2 focus:ring-foco-500'
/** Campo sobre fundo colorido (formulários laranja): branco já contrasta. */
export const campoClaro = 'h-10 w-full rounded-lg bg-papel px-3 text-[16px] outline-none focus:ring-2 focus:ring-foco-500'
export const areaTexto = 'w-full resize-none rounded-lg bg-neutro-100 p-2.5 outline-none focus:ring-2 focus:ring-foco-500'

/** Seção com título e, ao lado, a ajuda recolhida (ⓘ). */
export function Secao({ titulo, ajuda, children }: { titulo: string; ajuda?: ReactNode; children: ReactNode }) {
  return (
    <section className="mt-6">
      <h3 className="mb-2 flex items-center gap-1 text-[13px] font-extrabold uppercase text-neutro-800">
        {titulo}
        {ajuda && <Ajuda rotulo={`Sobre ${titulo.toLowerCase()}`}>{ajuda}</Ajuda>}
      </h3>
      {children}
    </section>
  )
}

/** Opção marcável (filtro, categoria): o fundo diz se está ligada, sem borda. */
export function Opcao({ ativo, onClick, children }: { ativo: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button onClick={onClick} aria-pressed={ativo} className={`rounded-full px-3 py-1.5 text-sm ${ativo ? 'bg-caneta-600 text-papel' : 'bg-neutro-100 text-neutro-700'}`}>
      {children}
    </button>
  )
}
