import { CheckIcon, TrashIcon } from '@heroicons/react/24/outline'
import { agoraHora, esperaPedido, novoId, CATEGORIAS_PEDIDO, type CategoriaPedido, type Pedido } from '../domain/model'

export const NOME_CATEGORIA: Record<CategoriaPedido, string> = { bebida: 'Bebida', comida: 'Comida', sobremesa: 'Sobremesa' }
// categoria não é estado: mesmo tom neutro da escala primária para todas (minimalismo.md)
const COR: Record<CategoriaPedido, string> = {
  bebida: 'bg-caneta-100 text-caneta-700',
  comida: 'bg-caneta-100 text-caneta-700',
  sobremesa: 'bg-caneta-100 text-caneta-700',
}

/** Pedidos de um grupo: um toque cria com a hora atual; "Chegou" marca a chegada e mostra a espera. */
export function ListaPedidos({ pedidos, onChange }: { pedidos: Pedido[]; onChange: (p: Pedido[]) => void }) {
  const muda = (id: string, p: Partial<Pedido>) => onChange(pedidos.map((x) => (x.id === id ? { ...x, ...p } : x)))
  const novo = (categoria: CategoriaPedido) => {
    onChange([...pedidos, { id: novoId(), categoria, descricao: '', pedido: agoraHora(), chegada: null }])
    navigator.vibrate?.(40)
  }
  // pendentes primeiro, depois os que chegaram (mais novos em cima)
  const lista = [...pedidos].sort((a, b) => Number(!!a.chegada) - Number(!!b.chegada) || b.pedido.localeCompare(a.pedido))
  return (
    <div>
      <div className="grid grid-cols-3 gap-2">
        {CATEGORIAS_PEDIDO.map((c) => (
          <button key={c} onClick={() => novo(c)} className={`h-11 whitespace-nowrap rounded-lg text-[13px] font-bold ${COR[c]}`}>
            + {NOME_CATEGORIA[c]}
          </button>
        ))}
      </div>
      <ul className="mt-2 space-y-2">
        {lista.map((p) => {
          const espera = esperaPedido(p)
          return (
            <li key={p.id} className="rounded-lg bg-papel p-2">
              <div className="flex items-center gap-2">
                <span className={`rounded px-2 py-0.5 text-xs font-bold ${COR[p.categoria]}`}>{NOME_CATEGORIA[p.categoria]}</span>
                <input
                  value={p.descricao}
                  onChange={(e) => muda(p.id, { descricao: e.target.value })}
                  placeholder="o quê? (opcional)"
                  className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-neutro-400"
                />
                <button onClick={() => onChange(pedidos.filter((x) => x.id !== p.id))} aria-label="Apagar pedido">
                  <TrashIcon className="size-4 text-neutro-400" />
                </button>
              </div>
              <div className="mt-1.5 flex items-center gap-2 text-sm">
                <span className="text-neutro-500">pedido</span>
                <input type="time" value={p.pedido} onChange={(e) => muda(p.id, { pedido: e.target.value })} className="w-[64px] rounded bg-neutro-100 px-1 text-center" />
                {p.chegada ? (
                  <>
                    <span className="text-neutro-500">chegou</span>
                    <input type="time" value={p.chegada} onChange={(e) => muda(p.id, { chegada: e.target.value })} className="w-[64px] rounded bg-neutro-100 px-1 text-center" />
                    <b className="ml-auto text-caneta-700">{espera === null ? '?' : `${espera} min`}</b>
                  </>
                ) : (
                  <button
                    onClick={() => (muda(p.id, { chegada: agoraHora() }), navigator.vibrate?.(40))}
                    aria-label="Chegou"
                    title="Chegou"
                    className="ml-auto grid size-9 place-items-center rounded-full bg-ok-600 text-sobre"
                  >
                    <CheckIcon className="size-5 stroke-[2.5]" />
                  </button>
                )}
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
