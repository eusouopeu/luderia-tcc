/** Mesa vista de cima: tampo retangular com 6 cadeiras (1 em cima, 2 de cada lado, 1 embaixo). */
export function MesaDesenho({
  nome,
  ocupada,
  detalhe,
  onClick,
}: {
  nome: string
  ocupada: boolean
  detalhe?: string
  onClick: () => void
}) {
  const cadeira = ocupada ? 'bg-orange-500' : 'bg-slate-300'
  const pos = [
    'left-1/2 top-0 -translate-x-1/2',
    'left-1/2 bottom-0 -translate-x-1/2',
    'left-0 top-[24%]',
    'left-0 top-[55%]',
    'right-0 top-[24%]',
    'right-0 top-[55%]',
  ]
  return (
    <button onClick={onClick} className="relative mx-auto block aspect-[11/16] w-full max-w-[120px]" aria-label={nome}>
      {pos.map((p) => (
        <span key={p} className={`absolute size-[27%] rounded-full ${cadeira} ${p}`} />
      ))}
      <span
        className={`absolute inset-x-[14%] inset-y-[9%] flex flex-col items-center justify-center rounded-lg px-1 text-center ${
          ocupada ? 'bg-orange-300 text-orange-700' : 'bg-slate-200 text-slate-900'
        }`}
      >
        <span className="text-[15px] font-bold uppercase leading-tight">{nome}</span>
        {detalhe && <span className="mt-1 text-[11px] font-semibold leading-tight">{detalhe}</span>}
      </span>
    </button>
  )
}
