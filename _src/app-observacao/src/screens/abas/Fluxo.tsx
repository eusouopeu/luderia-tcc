import { useEffect, useState } from 'react'
import { ChevronDownIcon, TrashIcon } from '@heroicons/react/24/outline'
import { useLoja } from '../../store'
import { Fab, ContadorH, Folha, Opcao } from '../../ui/comum'
import { Ajuda } from '../../ui/Ajuda'
import { avisar } from '../../ui/aviso'
import {
  agoraHora, destinoMesa, DESTINOS, gruposDentro, mesaDoDestino, minutos, MOTIVOS_SAIDA, novoId, pessoasDentro, proximoCodigo, registroAberto,
  SAIDA_RAPIDA_MIN, visitaAtiva, type Estado, type Fluxo, type Registro, type Unidade,
} from '../../domain/model'

const numero = (codigo: string) => Number(/-(\d+)$/.exec(codigo)?.[1] ?? 0)
/** ordem de chegada: hora da entrada, depois o número do código */
const porChegada = (a: Fluxo, b: Fluxo) => a.hora.localeCompare(b.hora) || numero(a.codigo) - numero(b.codigo)

/** Entradas e saídas na porta: um cartão por grupo, com código que liga a entrada à saída. */
export function AbaFluxo({ unidade, semVisita }: { unidade: Unidade; semVisita: () => boolean }) {
  const { estado, mudar } = useLoja()
  const [novoId_, setNovo] = useState<string | null>(null)
  const [verSaidas, setVerSaidas] = useState(false)
  /** código do grupo cuja saída pede motivo */
  const [motivoDe, setMotivoDe] = useState<string | null>(null)
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
      estimado: false, destino: '', motivo: '',
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
        ? [...e.fluxos, { ...en, id: novoId(), tipo: 'saida', hora: agoraHora(), destino: '', motivo: '' }]
        : e.fluxos.filter((f) => !(f.visitaId === en.visitaId && f.codigo === en.codigo && f.tipo === 'saida')),
    }))
    navigator.vibrate?.(40)
    if (!sim) return
    // saída logo depois da entrada, sem ter ido a uma mesa: pergunta o motivo (lotado, só olhou…)
    const rapida = (minutos(agoraHora()) ?? 0) - (minutos(en.hora) ?? 0) <= SAIDA_RAPIDA_MIN
    if (rapida && !mesaDoDestino(en.destino)) setMotivoDe(en.codigo)
    else avisar(`Saída de ${en.codigo} às ${agoraHora()}.`, { rotulo: 'Desfazer', fazer: () => sair(en, false) })
  }
  const motivo = (codigo: string, m: string) => {
    muda(codigo, { motivo: m }, 'saida')
    setMotivoDe(null)
  }

  /**
   * Liga o grupo da porta a uma mesa (abre o grupo na mesa livre ou junta ao que já está nela)
   * ou a outro destino (balcão, retirada). Tocar no destino marcado desfaz a ligação.
   */
  const destinar = (en: Fluxo, destino: string) => {
    const antes = useLoja.getState().estado
    const desfazer = () => mudar((e) => ({ ...e, registros: antes.registros, fluxos: antes.fluxos }))
    const marcarDestino = (e: Estado, d: string): Estado => ({
      ...e,
      fluxos: e.fluxos.map((f) => (f.visitaId === en.visitaId && f.codigo === en.codigo && f.tipo === 'entrada' ? { ...f, destino: d } : f)),
    })
    // desliga a mesa anterior, se havia
    const soltar = (e: Estado): Estado => ({
      ...e,
      registros: e.registros.map((r) => (r.visitaId === en.visitaId && r.fluxos.includes(en.codigo) ? { ...r, fluxos: r.fluxos.filter((c) => c !== en.codigo) } : r)),
    })
    if (destino === en.destino) {
      mudar((e) => marcarDestino(soltar(e), ''))
      return
    }
    const mesaId = mesaDoDestino(destino)
    if (!mesaId) {
      mudar((e) => marcarDestino(soltar(e), destino))
      return
    }
    const nome = unidade.mesas.find((m) => m.id === mesaId)?.nome ?? 'mesa'
    const aberto = registroAberto(antes, en.visitaId, mesaId)
    if (aberto && !confirm(`${nome} já tem um grupo de ${aberto.pessoas}. Juntar ${en.codigo} a ele (soma ${en.pessoas} pessoas)?`)) return
    mudar((e) => {
      const base = marcarDestino(soltar(e), destino)
      if (aberto)
        return {
          ...base,
          registros: base.registros.map((r) =>
            r.id === aberto.id ? { ...r, pessoas: r.pessoas + en.pessoas, criancas: r.criancas + en.criancas, fluxos: [...r.fluxos, en.codigo] } : r,
          ),
        }
      const novo: Registro = {
        id: novoId(), visitaId: en.visitaId, unidadeId: unidade.id, mesaId, data: (visita?.inicio ?? '').slice(0, 10), aniversario: false,
        entrada: en.hora, saida: null, saidaTipo: '', pessoas: en.pessoas, criancas: en.criancas, pessoasEstimado: en.estimado, fluxos: [en.codigo],
        instrutor: 0, jogos: [], jogosIncertos: [], notas: '', pedidos: [],
      }
      return { ...base, registros: [...base.registros, novo] }
    })
    navigator.vibrate?.(40)
    avisar(aberto ? `${en.codigo} juntou-se ao grupo da ${nome}.` : `Grupo ${en.codigo} aberto na ${nome}, entrada ${en.hora}.`, { rotulo: 'Desfazer', fazer: desfazer })
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
              {en.estimado && '≈'}
              {en.pessoas} pessoas{en.criancas ? ` (${en.criancas} crianças)` : ''} · entrou {en.hora}
              {en.destino && ` · ${mesaDoDestino(en.destino) ? unidade.mesas.find((m) => m.id === mesaDoDestino(en.destino))?.nome : en.destino}`}
              <button onClick={() => setMotivoDe(en.codigo)} className="ml-1 font-semibold text-caneta-700 underline">
                {sa!.motivo || 'motivo?'}
              </button>
            </span>
            <button onClick={() => apagar(en)} className="p-1 text-neutro-400" aria-label={`Apagar grupo ${en.codigo}`}>
              <TrashIcon className="size-5" />
            </button>
          </div>
        ) : (
          <>
          <div className="mt-3 grid grid-cols-[1fr_1fr_auto] items-end gap-3">
            <div>
              <div className="mb-1 flex items-center justify-between text-[13px] font-bold uppercase">
                Pessoas
                <button
                  onClick={() => muda(en.codigo, { estimado: !en.estimado })}
                  aria-pressed={en.estimado}
                  title="Número estimado (não deu para contar)"
                  aria-label="Número estimado"
                  className={`rounded px-2 text-[15px] leading-5 ${en.estimado ? 'bg-alerta-100 text-alerta-700' : 'text-neutro-500'}`}
                >
                  ≈
                </button>
              </div>
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
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <span className="mr-1 text-[13px] font-bold uppercase">Foi para</span>
            {unidade.mesas.map((m) => {
              const d = destinoMesa(m.id)
              const ocupada = !!visita && !!registroAberto(estado, visita.id, m.id) && en.destino !== d
              return (
                <button
                  key={m.id}
                  onClick={() => destinar(en, d)}
                  aria-pressed={en.destino === d}
                  className={`rounded-full px-2.5 py-1 text-[13px] font-semibold ${en.destino === d ? 'bg-caneta-600 text-sobre' : ocupada ? 'bg-neutro-300 text-neutro-500' : 'bg-papel'}`}
                >
                  {m.nome.replace(/^Mesa\s*/i, 'M')}
                </button>
              )
            })}
            {DESTINOS.map((d) => (
              <button
                key={d}
                onClick={() => destinar(en, d)}
                aria-pressed={en.destino === d}
                className={`rounded-full px-2.5 py-1 text-[13px] font-semibold ${en.destino === d ? 'bg-caneta-600 text-sobre' : 'bg-papel'}`}
              >
                {d}
              </button>
            ))}
          </div>
          </>
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
      {motivoDe && (
        <Folha titulo={`Por que ${motivoDe} saiu?`} onFechar={() => setMotivoDe(null)}>
          <div className="flex flex-wrap gap-2">
            {MOTIVOS_SAIDA.map((m) => (
              <Opcao key={m} ativo={saidaDe(motivoDe)?.motivo === m} onClick={() => motivo(motivoDe, m)}>
                {m}
              </Opcao>
            ))}
            <Opcao ativo={false} onClick={() => motivo(motivoDe, '')}>
              Saída comum
            </Opcao>
            <Ajuda rotulo="Sobre o motivo">
              Saída até {SAIDA_RAPIDA_MIN} min depois da entrada, sem passar por mesa. Separa quem desistiu (lotado, só olhou) de quem só usou o balcão ou retirou um pedido.
            </Ajuda>
          </div>
        </Folha>
      )}
    </div>
  )
}
