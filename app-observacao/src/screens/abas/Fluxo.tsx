import { useEffect, useState } from 'react'
import { ChevronDownIcon, TrashIcon } from '@heroicons/react/24/outline'
import { useLoja } from '../../store'
import { Fab, ContadorH } from '../../ui/comum'
import { avisar } from '../../ui/aviso'
import { agoraHora, gruposDentro, novoId, pessoasDentro, proximoCodigo, visitaAtiva, type Fluxo, type Unidade } from '../../domain/model'

const numero = (codigo: string) => Number(/-(\d+)$/.exec(codigo)?.[1] ?? 0)
/** ordem de chegada: hora da entrada, depois o número do código */
const porChegada = (a: Fluxo, b: Fluxo) => a.hora.localeCompare(b.hora) || numero(a.codigo) - numero(b.codigo)

/** Entradas e saídas na porta: um cartão por grupo, com código que liga a entrada à saída. */
export function AbaFluxo({ unidade, semVisita }: { unidade: Unidade; semVisita: () => boolean }) {
  const { estado, mudar } = useLoja()
  const [novoId_, setNovo] = useState<string | null>(null)
  const [verSaidas, setVerSaidas] = useState(false)
  const visita = visitaAtiva(estado, unidade.id)
  const fl = visita ? estado.fluxos.filter((f) => f.visitaId === visita.id) : []
  const entradas = fl.filter((f) => f.tipo === 'entrada')
  const saidaDe = (codigo: string) => fl.find((f) => f.tipo === 'saida' && f.codigo === codigo)
  // grupos dentro em ordem de chegada (o novo entra embaixo, perto do +); os que saíram ficam recolhidos em cima
  const dentro = entradas.filter((f) => !saidaDe(f.codigo)).sort(porChegada)
  const sairam = entradas.filter((f) => saidaDe(f.codigo)).sort(porChegada)

  // o cartão novo rola até ficar visível e pisca
  useEffect(() => {
    if (!novoId_) return
    document.getElementById(`fluxo-${novoId_}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    const t = setTimeout(() => setNovo(null), 1900)
    return () => clearTimeout(t)
  }, [novoId_])

  const novo = () => {
    if (!visita && !semVisita()) return
    const v = visitaAtiva(useLoja.getState().estado, unidade.id)!
    const f: Fluxo = {
      id: novoId(), visitaId: v.id, codigo: proximoCodigo(useLoja.getState().estado.fluxos, v.id, unidade.sigla), tipo: 'entrada', hora: agoraHora(), pessoas: 2, criancas: 0,
    }
    mudar((e) => ({ ...e, fluxos: [...e.fluxos, f] }))
    setNovo(f.id)
    navigator.vibrate?.(40)
    avisar(`Entrada ${f.codigo} lançada às ${f.hora}.`, { rotulo: 'Desfazer', fazer: () => mudar((e) => ({ ...e, fluxos: e.fluxos.filter((x) => !(x.visitaId === f.visitaId && x.codigo === f.codigo)) })) })
  }
  /** Muda o grupo; a saída acompanha pessoas e crianças da entrada. */
  const muda = (codigo: string, p: Partial<Fluxo>, tipo: Fluxo['tipo'] = 'entrada') =>
    mudar((e) => ({
      ...e,
      fluxos: e.fluxos.map((f) =>
        f.visitaId !== visita!.id || f.codigo !== codigo
          ? f
          : f.tipo === tipo
            ? { ...f, ...p }
            : 'pessoas' in p || 'criancas' in p
              ? { ...f, pessoas: p.pessoas ?? f.pessoas, criancas: p.criancas ?? f.criancas }
              : f,
      ),
    }))
  const sair = (en: Fluxo, sim: boolean) => {
    mudar((e) => ({
      ...e,
      fluxos: sim
        ? [...e.fluxos, { ...en, id: novoId(), tipo: 'saida', hora: agoraHora() }]
        : e.fluxos.filter((f) => !(f.visitaId === en.visitaId && f.codigo === en.codigo && f.tipo === 'saida')),
    }))
    navigator.vibrate?.(40)
    if (sim) avisar(`Saída de ${en.codigo} às ${agoraHora()}.`, { rotulo: 'Desfazer', fazer: () => sair(en, false) })
  }
  const apagar = (en: Fluxo) => {
    if (!confirm(`Apagar o grupo ${en.codigo} (entrada e saída)?`)) return
    mudar((e) => ({ ...e, fluxos: e.fluxos.filter((f) => !(f.visitaId === en.visitaId && f.codigo === en.codigo)) }))
  }

  const cartao = (en: Fluxo) => {
    const sa = saidaDe(en.codigo)
    const atual = sa ?? en
    return (
      <div key={en.id} id={`fluxo-${en.id}`} className={`rounded-xl p-4 ${sa ? 'bg-neutro-100' : 'bg-neutro-200/70'} ${en.id === novoId_ ? 'destaque' : ''}`}>
        <div className="flex items-center gap-2">
          <span className={`w-[92px] shrink-0 text-base font-bold ${sa ? 'text-neutro-500' : ''}`}>
            <span className="text-caneta-700">ID</span> {en.codigo}
          </span>
          <div className="flex h-9 flex-1 overflow-hidden rounded-md bg-neutro-300 text-[13px] font-bold">
            <button onClick={() => sa && sair(en, false)} aria-pressed={!sa} className={`flex-1 ${!sa ? 'bg-caneta-600 text-sobre' : 'text-neutro-700'}`}>
              ENTRADA
            </button>
            <button onClick={() => !sa && sair(en, true)} aria-pressed={!!sa} className={`flex-1 ${sa ? 'bg-neutro-700 text-neutro-50' : 'text-neutro-700'}`}>
              SAÍDA
            </button>
          </div>
          <input
            type="time"
            aria-label={sa ? 'Hora da saída' : 'Hora da entrada'}
            value={atual.hora}
            onChange={(ev) => ev.target.value && muda(en.codigo, { hora: ev.target.value }, sa ? 'saida' : 'entrada')}
            className="h-9 w-[72px] rounded-md bg-papel text-center text-base font-medium outline-none"
          />
        </div>
        {sa ? (
          <div className="mt-2 flex items-center text-[15px] text-neutro-600">
            <span className="flex-1">
              {en.pessoas} pessoas{en.criancas ? ` (${en.criancas} crianças)` : ''} · entrou {en.hora}
            </span>
            <button onClick={() => apagar(en)} className="p-1 text-neutro-400" aria-label={`Apagar grupo ${en.codigo}`}>
              <TrashIcon className="size-5" />
            </button>
          </div>
        ) : (
          <div className="mt-3 grid grid-cols-[1fr_1fr_auto] items-end gap-3">
            <div>
              <div className="mb-1 text-[13px] font-bold uppercase">Pessoas</div>
              <ContadorH valor={en.pessoas} onChange={(v) => muda(en.codigo, { pessoas: v })} />
            </div>
            <div>
              <div className="mb-1 text-[13px] font-bold uppercase">Crianças</div>
              <ContadorH valor={en.criancas} onChange={(v) => muda(en.codigo, { criancas: v })} />
            </div>
            <button onClick={() => apagar(en)} className="grid h-11 w-8 place-items-center text-neutro-500" aria-label={`Apagar grupo ${en.codigo}`}>
              <TrashIcon className="size-5" />
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="px-4 pb-32">
      {visita ? (
        <p className="my-4 text-center" title={`${gruposDentro(estado, visita.id).length} grupos dentro · ${entradas.length} entradas`}>
          <b className="text-3xl text-caneta-700">{pessoasDentro(estado, visita.id)}</b> <span className="text-base text-neutro-600">pessoas dentro</span>
          <span className="block text-sm text-neutro-500">
            {dentro.length} grupos dentro · {entradas.length} entradas · {sairam.length} {sairam.length === 1 ? 'saída' : 'saídas'}
          </span>
        </p>
      ) : (
        <p className="mt-16 px-6 text-center text-neutro-500">Toque em + para lançar a primeira entrada (a visita começa junto).</p>
      )}
      {sairam.length > 0 && (
        <div className="mb-3">
          <button onClick={() => setVerSaidas(!verSaidas)} aria-expanded={verSaidas} className="flex w-full items-center gap-2 rounded-lg px-1 py-2 text-[15px] font-semibold text-neutro-600">
            <span className="flex-1 text-left">{sairam.length} {sairam.length === 1 ? 'grupo saiu' : 'grupos saíram'}</span>
            <ChevronDownIcon className={`size-5 transition-transform ${verSaidas ? 'rotate-180' : ''}`} />
          </button>
          {verSaidas && <div className="space-y-2">{sairam.map(cartao)}</div>}
        </div>
      )}
      <div className="space-y-3">{dentro.map(cartao)}</div>
      {visita && entradas.length > 0 && !dentro.length && <p className="mt-6 text-center text-neutro-500">Ninguém dentro agora.</p>}
      <Fab onClick={novo} rotulo="Nova entrada" />
    </div>
  )
}
