import { useState } from 'react'
import { ChevronRightIcon } from '@heroicons/react/24/outline'
import { MesaDesenho } from '../../ui/MesaDesenho'
import { Fab, Folha } from '../../ui/comum'
import { ListaPedidos } from '../../ui/Pedidos'
import { useLoja } from '../../store'
import { pessoasDentro, registroAberto, visitaAtiva, type Registro, type Unidade } from '../../domain/model'

/** Planta: mesas e o acervo de jogos (mockup "Bela Vista"). */
export function AbaMesas({
  unidade,
  onMesa,
  onAcervo,
  onRegistros,
  onAcoes,
}: {
  unidade: Unidade
  onMesa: (mesaId: string) => void
  onAcervo: () => void
  onRegistros: () => void
  onAcoes: () => void
}) {
  const { estado, mudar } = useLoja()
  const [pedidosDe, setPedidosDe] = useState<string | null>(null)
  const mudaReg = (id: string, f: (r: Registro) => Registro) => mudar((e) => ({ ...e, registros: e.registros.map((r) => (r.id === id ? f(r) : r)) }))
  const regPedidos = estado.registros.find((r) => r.id === pedidosDe)
  const visita = visitaAtiva(estado, unidade.id)
  const daVisita = visita ? estado.registros.filter((r) => r.visitaId === visita.id) : []

  return (
    <>
      <button onClick={onRegistros} className="mx-4 mt-3 flex w-[calc(100%-2rem)] items-center justify-between rounded-lg bg-neutro-100 px-3 py-2 text-left text-sm text-neutro-700">
        <span>
          {visita ? (
            <>
              <b className="text-caneta-700">Visita desde {visita.inicio.slice(11, 16)}</b>
              <span className="ml-2 rounded-full bg-caneta-100 px-2 text-xs font-bold text-caneta-700" title={`${daVisita.length} grupos nas mesas`}>
                {pessoasDentro(estado, visita.id)} dentro
              </span>
            </>
          ) : (
            <>Sem visita em andamento</>
          )}
        </span>
        <ChevronRightIcon className="size-4 shrink-0" />
      </button>
      <div className="flex gap-4 px-4 pb-28 pt-6">
        <div className="grid flex-1 grid-cols-2 content-start gap-x-4 gap-y-6">
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
        </div>
        <button onClick={onAcervo} className="flex w-12 shrink-0 items-center justify-center rounded-lg bg-caneta-400">
          <span className="rotate-180 whitespace-nowrap text-sm font-medium tracking-wide text-sobre [writing-mode:vertical-rl]">
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
