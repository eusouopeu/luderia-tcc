import { useState } from 'react'
import { PlusIcon } from '@heroicons/react/24/outline'
import { MesaDesenho } from '../../ui/MesaDesenho'
import { Fab, Folha } from '../../ui/comum'
import { ListaPedidos } from '../../ui/Pedidos'
import { useLoja } from '../../store'
import { novasMesas, registroAberto, visitaAtiva, type Registro, type Unidade } from '../../domain/model'
import { avisar } from '../../ui/aviso'

/** Planta: mesas e o acervo de jogos (mockup "Bela Vista"). */
export function AbaMesas({
  unidade,
  onMesa,
  onAcervo,
  onAcoes,
}: {
  unidade: Unidade
  onMesa: (mesaId: string) => void
  onAcervo: () => void
  onAcoes: () => void
}) {
  const { estado, mudar } = useLoja()
  const [pedidosDe, setPedidosDe] = useState<string | null>(null)
  const mudaReg = (id: string, f: (r: Registro) => Registro) => mudar((e) => ({ ...e, registros: e.registros.map((r) => (r.id === id ? f(r) : r)) }))
  const regPedidos = estado.registros.find((r) => r.id === pedidosDe)
  const visita = visitaAtiva(estado, unidade.id)

  return (
    <>
      <div className="flex gap-3 px-4 pb-32 pt-5">
        <div className="grid flex-1 grid-cols-[repeat(auto-fill,minmax(88px,1fr))] content-start gap-x-3 gap-y-4">
          {unidade.mesas.map((m) => {
            const r = visita && registroAberto(estado, visita.id, m.id)
            return (
              <MesaDesenho
                key={m.id}
                nome={m.nome}
                ocupada={!!r}
                detalhe={r ? `${r.pessoas} · ${r.entrada}` : undefined}
                onClick={() => onMesa(m.id)}
                instrutor={r?.instrutor}
                pendentes={r ? r.pedidos.filter((p) => !p.chegada).length : 0}
                onInstrutor={() => {
                  if (!r) return
                  mudaReg(r.id, (x) => ({ ...x, instrutor: x.instrutor + 1 }))
                  navigator.vibrate?.(40)
                }}
                onPedidos={() => r && setPedidosDe(r.id)}
              />
            )
          })}
          <button
            onClick={() => {
              const [m] = novasMesas(unidade.mesas)
              mudar((e) => ({ ...e, unidades: e.unidades.map((u) => (u.id === unidade.id ? { ...u, mesas: [...u.mesas, m] } : u)) }))
              navigator.vibrate?.(40)
              avisar(`${m.nome} criada.`, {
                rotulo: 'Desfazer',
                fazer: () => mudar((e) => ({ ...e, unidades: e.unidades.map((u) => (u.id === unidade.id ? { ...u, mesas: u.mesas.filter((x) => x.id !== m.id) } : u)) })),
              })
            }}
            aria-label="Nova mesa"
            className="mx-auto flex aspect-[11/16] w-full max-w-[104px] flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-neutro-300 text-neutro-500"
          >
            <PlusIcon className="size-7" />
            <span className="text-[13px] font-bold uppercase">Mesa</span>
          </button>
        </div>
        <button onClick={onAcervo} className="sticky top-[150px] flex max-h-[calc(100dvh-240px)] min-h-64 w-11 shrink-0 items-center justify-center self-start rounded-lg bg-caneta-400">
          <span className="rotate-180 whitespace-nowrap text-[15px] font-bold tracking-wide text-neutro-900 [writing-mode:vertical-rl]">
            ACERVO DE JOGOS{unidade.acervo.jogos.length ? ` · ${unidade.acervo.jogos.length}` : ''}
          </span>
        </button>
      </div>
      <Fab onClick={onAcoes} rotulo="Ações da visita" />
      {regPedidos && (
        <Folha titulo={`Pedidos · ${unidade.mesas.find((m) => m.id === regPedidos.mesaId)?.nome ?? ''}`} onFechar={() => setPedidosDe(null)}>
          <div className="rounded-xl bg-caneta-100 p-3">
            <ListaPedidos pedidos={regPedidos.pedidos} onChange={(pedidos) => mudaReg(regPedidos.id, (x) => ({ ...x, pedidos }))} />
          </div>
        </Folha>
      )}
    </>
  )
}
