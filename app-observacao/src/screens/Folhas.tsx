import { useState, type ReactNode } from 'react'
import { PlusIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { dataBr, novoId, permanenciaMin, type Estado, type Unidade } from '../domain/model'

function Folha({ titulo, onFechar, children }: { titulo: string; onFechar: () => void; children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-10 flex flex-col justify-end bg-black/40" onClick={onFechar}>
      <div className="max-h-[85dvh] overflow-y-auto rounded-t-2xl bg-white p-4 safe-bottom" onClick={(e) => e.stopPropagation()}>
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

/** Lista dos grupos registrados na unidade, por visita (mais recente primeiro). */
export function FolhaRegistros({
  estado,
  unidade,
  onFechar,
  onAbrir,
}: {
  estado: Estado
  unidade: Unidade
  onFechar: () => void
  onAbrir: (registroId: string) => void
}) {
  const visitas = estado.visitas.filter((v) => v.unidadeId === unidade.id).sort((a, b) => b.inicio.localeCompare(a.inicio))
  const nomeMesa = (id: string) => unidade.mesas.find((m) => m.id === id)?.nome ?? id
  return (
    <Folha titulo="Registros" onFechar={onFechar}>
      {visitas.length === 0 && <p className="py-6 text-center text-slate-500">Nenhuma visita ainda.</p>}
      {visitas.map((v) => {
        const regs = estado.registros.filter((r) => r.visitaId === v.id).sort((a, b) => a.entrada.localeCompare(b.entrada))
        const pessoas = regs.reduce((s, r) => s + r.pessoas, 0)
        return (
          <section key={v.id} className="mb-5">
            <h3 className="mb-2 text-sm font-bold text-purple-700">
              {dataBr(v.inicio.slice(0, 10))} · {v.inicio.slice(11, 16)}–{v.fim ? v.fim.slice(11, 16) : 'em andamento'} · {regs.length} grupos ·{' '}
              {pessoas} pessoas
            </h3>
            <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
              {regs.map((r) => {
                const p = permanenciaMin(r.entrada, r.saida)
                return (
                  <li key={r.id}>
                    <button onClick={() => onAbrir(r.id)} className="flex w-full items-center gap-3 px-3 py-2.5 text-left">
                      <span className="w-20 shrink-0 font-bold">{nomeMesa(r.mesaId)}</span>
                      <span className="flex-1 text-sm">
                        {r.entrada}–{r.saida ?? '…'} · {r.pessoas} pess. ({r.criancas} cr.)
                        {r.aniversario && ' · 🎂'}
                      </span>
                      <span className={`text-sm font-semibold ${p === null ? 'text-orange-600' : 'text-slate-500'}`}>
                        {p === null ? 'na mesa' : `${p} min`}
                      </span>
                    </button>
                  </li>
                )
              })}
              {regs.length === 0 && <li className="px-3 py-2.5 text-sm text-slate-500">Sem grupos.</li>}
            </ul>
          </section>
        )
      })}
    </Folha>
  )
}

/** Renomear a unidade e acrescentar, renomear ou retirar mesas. */
export function FolhaEditar({
  estado,
  unidade,
  onFechar,
  onSalvar,
}: {
  estado: Estado
  unidade: Unidade
  onFechar: () => void
  onSalvar: (u: Unidade) => void
}) {
  const [u, setU] = useState(unidade)
  const usada = (mesaId: string) => estado.registros.some((r) => r.unidadeId === unidade.id && r.mesaId === mesaId)
  const campo = 'h-10 w-full rounded-lg border border-slate-300 px-3 outline-none focus:border-purple-600'
  return (
    <Folha titulo="Editar unidade" onFechar={onFechar}>
      <label className="mb-1 block text-xs font-bold uppercase text-slate-500">Nome</label>
      <input value={u.nome} onChange={(e) => setU({ ...u, nome: e.target.value })} className={campo} />
      <label className="mb-1 mt-4 block text-xs font-bold uppercase text-slate-500">Mesas</label>
      <ul className="space-y-2">
        {u.mesas.map((m, i) => (
          <li key={m.id} className="flex gap-2">
            <input
              value={m.nome}
              onChange={(e) => setU({ ...u, mesas: u.mesas.map((x, j) => (j === i ? { ...x, nome: e.target.value } : x)) })}
              className={campo}
            />
            <button
              onClick={() => setU({ ...u, mesas: u.mesas.filter((x) => x.id !== m.id) })}
              disabled={usada(m.id)}
              className="grid w-12 shrink-0 place-items-center rounded-lg bg-rose-100 text-rose-600 disabled:opacity-30"
              aria-label={`Retirar ${m.nome}`}
              title={usada(m.id) ? 'Mesa com registros não pode ser retirada' : undefined}
            >
              <TrashIcon className="size-5" />
            </button>
          </li>
        ))}
      </ul>
      <button
        onClick={() => setU({ ...u, mesas: [...u.mesas, { id: novoId(), nome: `Mesa ${u.mesas.length + 1}` }] })}
        className="mt-3 flex items-center gap-1 font-semibold text-purple-700"
      >
        <PlusIcon className="size-5" /> Mesa
      </button>
      <button
        onClick={() => onSalvar({ ...u, nome: u.nome.trim() || unidade.nome })}
        className="mt-5 h-12 w-full rounded-lg bg-purple-600 font-bold text-white"
      >
        Salvar
      </button>
    </Folha>
  )
}
