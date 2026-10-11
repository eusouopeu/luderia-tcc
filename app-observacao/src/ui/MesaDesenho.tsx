import { BellAlertIcon, PuzzlePieceIcon } from '@heroicons/react/24/outline'

/** Mesa vista de cima: tampo retangular com 6 cadeiras. Ocupada, ganha atalhos de +1 instrutor e pedidos. */
export function MesaDesenho({
  nome,
  ocupada,
  detalhe,
  onClick,
  instrutor,
  pendentes = 0,
  onInstrutor,
  onPedidos,
}: {
  nome: string
  ocupada: boolean
  detalhe?: string
  onClick: () => void
  instrutor?: number
  pendentes?: number
  onInstrutor?: () => void
  onPedidos?: () => void
}) {
  const cadeira = ocupada ? 'bg-caneta-500' : 'bg-neutro-300'
  const pos = [
    'left-1/2 top-0 -translate-x-1/2',
    'left-1/2 bottom-0 -translate-x-1/2',
    'left-0 top-[24%]',
    'left-0 top-[55%]',
    'right-0 top-[24%]',
    'right-0 top-[55%]',
  ]
  const atalhos = ocupada && onInstrutor && onPedidos
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
      className="relative mx-auto block aspect-[11/16] w-full max-w-[104px] cursor-pointer"
      aria-label={nome}
    >
      {pos.map((p) => (
        <span key={p} className={`absolute size-[27%] rounded-full ${cadeira} ${p}`} />
      ))}
      <span
        className={`absolute inset-x-[14%] inset-y-[9%] flex flex-col items-center justify-center rounded-lg px-1 text-center ${
          ocupada ? 'bg-caneta-300 text-caneta-700' : 'bg-neutro-200 text-neutro-900'
        }`}
      >
        <span className="break-words text-sm font-bold uppercase leading-tight">{nome}</span>
        {detalhe && <span className="mt-0.5 text-xs font-semibold leading-tight">{detalhe}</span>}
        {atalhos && (
          <span className="mt-1.5 flex gap-1">
            <button
              onClick={(e) => (e.stopPropagation(), onInstrutor())}
              aria-label={`+1 instrutor na ${nome}`}
              className="flex h-8 min-w-7 items-center justify-center gap-0.5 rounded-md bg-papel/80 px-0.5 text-xs font-bold text-neutro-800 active:scale-95"
            >
              <PuzzlePieceIcon className="size-4" />
              {instrutor ? instrutor : '+'}
            </button>
            <button
              onClick={(e) => (e.stopPropagation(), onPedidos())}
              aria-label={`Pedidos da ${nome}`}
              className={`relative flex h-8 min-w-7 items-center justify-center rounded-md px-0.5 active:scale-95 ${pendentes ? 'bg-caneta-700 text-sobre' : 'bg-papel/80 text-neutro-800'}`}
            >
              <BellAlertIcon className="size-4" />
              {pendentes > 0 && <span className="ml-0.5 text-xs font-bold">{pendentes}</span>}
            </button>
          </span>
        )}
      </span>
    </div>
  )
}
