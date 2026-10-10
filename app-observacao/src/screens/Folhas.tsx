import { useState } from 'react'
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline'
import { Folha, campo } from '../ui/comum'
import { Ajuda } from '../ui/Ajuda'
import { dataBr, novoId, permanenciaMin, type Estado, type Unidade } from '../domain/model'

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
      {visitas.length === 0 && <p className="py-6 text-center text-neutro-500">Nenhuma visita ainda.</p>}
      {visitas.map((v) => {
        const regs = estado.registros.filter((r) => r.visitaId === v.id).sort((a, b) => a.entrada.localeCompare(b.entrada))
        const pessoas = regs.reduce((s, r) => s + r.pessoas, 0)
        return (
          <section key={v.id} className="mb-5">
            <h3 className="mb-2 text-sm font-bold text-caneta-700">
              {dataBr(v.inicio.slice(0, 10))} · {v.inicio.slice(11, 16)}–{v.fim ? v.fim.slice(11, 16) : 'em andamento'} · {regs.length} grupos ·{' '}
              {pessoas} pessoas
            </h3>
            <ul className="divide-y divide-papel rounded-lg bg-neutro-50">
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
                      <span className={`text-sm font-semibold ${p === null ? 'text-caneta-600' : 'text-neutro-500'}`}>
                        {p === null ? 'na mesa' : `${p} min`}
                      </span>
                    </button>
                  </li>
                )
              })}
              {regs.length === 0 && <li className="px-3 py-2.5 text-sm text-neutro-500">Sem grupos.</li>}
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
  return (
    <Folha titulo="Editar unidade" onFechar={onFechar}>
      <div className="flex gap-2">
        <input value={u.nome} aria-label="Nome" placeholder="Nome" onChange={(e) => setU({ ...u, nome: e.target.value })} className={campo} />
        <input value={u.sigla} aria-label="Sigla" placeholder="Sigla" maxLength={4} onChange={(e) => setU({ ...u, sigla: e.target.value.toUpperCase() })} className={`${campo} !w-20 text-center`} />
        <Ajuda rotulo="Sobre a sigla">A sigla abre o código dos grupos no fluxo da porta: {u.sigla || 'BV'}-1, {u.sigla || 'BV'}-2…</Ajuda>
      </div>
      <ul className="mt-4 space-y-2">
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
              className="grid w-12 shrink-0 place-items-center rounded-lg bg-erro-100 text-erro-600 disabled:opacity-30"
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
        className="mt-3 flex items-center gap-1 font-semibold text-caneta-700"
      >
        <PlusIcon className="size-5" /> Mesa
      </button>
      <button
        onClick={() => onSalvar({ ...u, nome: u.nome.trim() || unidade.nome, sigla: u.sigla.trim() || unidade.sigla })}
        className="mt-5 h-12 w-full rounded-lg bg-caneta-600 font-bold text-sobre"
      >
        Salvar
      </button>
    </Folha>
  )
}

/** Botão + da aba Mesas: ações da visita. */
export function FolhaAcoes({
  ativa,
  onFechar,
  onComecar,
  onEncerrar,
  onRegistros,
  onEditar,
}: {
  ativa: boolean
  onFechar: () => void
  onComecar: () => void
  onEncerrar: () => void
  onRegistros: () => void
  onEditar: () => void
}) {
  const b = 'mt-2 h-12 w-full rounded-lg font-bold'
  return (
    <Folha titulo="Ações" onFechar={onFechar}>
      {ativa ? (
        <button onClick={onEncerrar} className={`${b} bg-neutro-800 text-neutro-50`}>Encerrar visita</button>
      ) : (
        <button onClick={onComecar} className={`${b} bg-caneta-600 text-sobre`}>Começar visita</button>
      )}
      <button onClick={onRegistros} className={`${b} bg-neutro-200`}>Registros das mesas</button>
      <button onClick={onEditar} className={`${b} bg-neutro-200`}>Editar mesas</button>
    </Folha>
  )
}
