import { ChevronRightIcon } from '@heroicons/react/24/outline'
import { MesaDesenho } from '../../ui/MesaDesenho'
import { Fab } from '../../ui/comum'
import { useLoja } from '../../store'
import { pessoasDentro, registroAberto, visitaAtiva, type Unidade } from '../../domain/model'

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
  const estado = useLoja((s) => s.estado)
  const visita = visitaAtiva(estado, unidade.id)
  const daVisita = visita ? estado.registros.filter((r) => r.visitaId === visita.id) : []
  const n = estado.registros.filter((r) => r.unidadeId === unidade.id).length

  return (
    <>
      <button onClick={onRegistros} className="mx-4 mt-3 flex w-[calc(100%-2rem)] items-center justify-between rounded-lg bg-slate-100 px-3 py-2 text-left text-sm text-slate-700">
        <span>
          {visita ? (
            <>
              <b className="text-orange-700">Visita desde {visita.inicio.slice(11, 16)}</b> · {daVisita.length} grupos · {pessoasDentro(estado, visita.id)} pessoas dentro
            </>
          ) : (
            <>Nenhuma visita em andamento · {n} registros</>
          )}
        </span>
        <ChevronRightIcon className="size-4 shrink-0" />
      </button>
      <div className="flex gap-4 px-4 pb-28 pt-6">
        <div className="grid flex-1 grid-cols-2 content-start gap-x-4 gap-y-6">
          {unidade.mesas.map((m) => {
            const r = visita && registroAberto(estado, visita.id, m.id)
            return <MesaDesenho key={m.id} nome={m.nome} ocupada={!!r} detalhe={r ? `${r.pessoas} · ${r.entrada}` : undefined} onClick={() => onMesa(m.id)} />
          })}
        </div>
        <button onClick={onAcervo} className="flex w-12 shrink-0 items-center justify-center rounded-lg bg-orange-400">
          <span className="rotate-180 whitespace-nowrap text-sm font-medium tracking-wide text-white [writing-mode:vertical-rl]">
            ACERVO DE JOGOS{unidade.acervo.jogos.length ? ` · ${unidade.acervo.jogos.length}` : ''}
          </span>
        </button>
      </div>
      <Fab onClick={onAcoes} rotulo="Ações da visita" />
    </>
  )
}
