import {
  ArrowUpTrayIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PencilIcon,
  PlayIcon,
  StopIcon,
  TrashIcon,
} from '@heroicons/react/24/outline'
import { MesaDesenho } from '../ui/MesaDesenho'
import { registroAberto, visitaAtiva, type Estado, type Unidade as TUnidade } from '../domain/model'

const hora = (iso: string) => iso.slice(11, 16)

/** Planta da unidade (mockup "Bela Vista"): mesas, estante de jogos e barra de ações. */
export function Unidade({
  estado,
  unidade,
  onVoltar,
  onExportar,
  onApagar,
  onEditar,
  onComecar,
  onEncerrar,
  onMesa,
  onRegistros,
}: {
  estado: Estado
  unidade: TUnidade
  onVoltar: () => void
  onExportar: () => void
  onApagar: () => void
  onEditar: () => void
  onComecar: () => void
  onEncerrar: () => void
  onMesa: (mesaId: string) => void
  onRegistros: () => void
}) {
  const visita = visitaAtiva(estado, unidade.id)
  const nRegistros = estado.registros.filter((r) => r.unidadeId === unidade.id).length
  const daVisita = visita ? estado.registros.filter((r) => r.visitaId === visita.id) : []
  const naCasa = daVisita.filter((r) => r.saida === null).reduce((s, r) => s + r.pessoas, 0)

  return (
    <div className="flex min-h-dvh flex-col bg-white safe-top safe-bottom">
      <header className="flex items-center gap-3 px-4 pb-2 pt-5">
        <button onClick={onVoltar} className="p-1" aria-label="Voltar">
          <ChevronLeftIcon className="size-7" />
        </button>
        <h1 className="flex-1 truncate text-3xl font-extrabold uppercase text-black">{unidade.nome}</h1>
        <button onClick={onExportar} className="p-2 text-purple-700" aria-label="Exportar CSV">
          <ArrowUpTrayIcon className="size-7" />
        </button>
      </header>

      <button
        onClick={onRegistros}
        className="mx-4 mt-2 flex items-center justify-between rounded-lg bg-slate-100 px-3 py-2 text-left text-sm text-slate-700"
      >
        <span>
          {visita ? (
            <>
              <b className="text-purple-700">Visita desde {hora(visita.inicio)}</b> · {daVisita.length} grupos · {naCasa} pessoas nas mesas
            </>
          ) : (
            <>Nenhuma visita em andamento · {nRegistros} registros</>
          )}
        </span>
        <ChevronRightIcon className="size-4 shrink-0" />
      </button>

      <main className="flex flex-1 gap-4 px-4 py-6">
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
              />
            )
          })}
        </div>
        <div className="flex w-12 shrink-0 items-center justify-center rounded-lg bg-orange-400">
          <span className="rotate-180 whitespace-nowrap text-sm font-medium tracking-wide text-white [writing-mode:vertical-rl]">
            ESTANTE DE JOGOS
          </span>
        </div>
      </main>

      <footer className="flex gap-3 px-4 pb-5">
        <button onClick={onApagar} className="grid h-12 w-[72px] place-items-center rounded-lg bg-rose-200 text-rose-500" aria-label="Apagar unidade">
          <TrashIcon className="size-6" />
        </button>
        <button onClick={onEditar} className="grid h-12 w-[72px] place-items-center rounded-lg bg-slate-300 text-slate-800" aria-label="Editar mesas">
          <PencilIcon className="size-6" />
        </button>
        {visita ? (
          <button onClick={onEncerrar} className="flex h-12 flex-1 items-center justify-center gap-2 rounded-lg bg-slate-800 font-bold text-white">
            <StopIcon className="size-6" />
            Encerrar
          </button>
        ) : (
          <button onClick={onComecar} className="flex h-12 flex-1 items-center justify-center gap-2 rounded-lg bg-purple-600 font-bold text-white">
            <PlayIcon className="size-6" />
            Começar
          </button>
        )}
      </footer>
    </div>
  )
}
