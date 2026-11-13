import { useEffect, useRef, useState } from 'react'
import {
  ArrowLeftIcon,
  ArrowPathIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  CheckIcon,
  ChevronDoubleRightIcon,
  ChevronRightIcon,
  ClockIcon,
  PauseIcon,
  PencilSquareIcon,
  PlayIcon,
  UserGroupIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { useLoja } from '../../store'
import { agoraHora, MOTIVO_FECHAMENTO, novoId, registroAberto, visitaAtiva, visitaAtual, type Contagem, type Estado, type Unidade, type Visita } from '../../domain/model'
import { contagemPendente, etapas, nomeEtapa, situacaoTimer } from '../../domain/temporizador'

const fmt = (ms: number) => {
  const s = Math.max(0, Math.round(ms / 1000))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  return h ? `${h} h ${String(m).padStart(2, '0')} m` : `${m} m ${String(s % 60).padStart(2, '0')} s`
}

export type Destino = 'visita' | 'acervo' | 'acustica' | 'fluxo' | 'mesas'

/** Temporizador do roteiro: contagem inicial e uma a cada intervalo, marcando mesa a mesa, e as tarefas da visita. */
export function AbaTemporizador({
  unidade,
  onMesa,
  onComecar,
  onEncerrar,
  onFechamento,
  onIr,
}: {
  unidade: Unidade
  /** `inicial` = grupo já sentado quando a visita começou (marcado na contagem inicial) */
  onMesa: (mesaId: string, inicial?: boolean) => void
  onComecar: () => void
  onEncerrar: (visitaId: string) => void
  onFechamento: (visitaId: string) => void
  onIr: (d: Destino) => void
}) {
  const { estado, mudar, alternarPausa } = useLoja()
  const [agora, setAgora] = useState(() => new Date())
  const [idx, setIdx] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setAgora(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const ativa = visitaAtiva(estado, unidade.id)
  const v = ativa ?? visitaAtual(estado, unidade.id)
  const s = v ? situacaoTimer(v, agora) : null
  const lista = v ? etapas(v) : []
  const feitas = new Set(estado.contagens.filter((c) => c.visitaId === v?.id && c.hora).map((c) => c.etapa))
  const pendente = ativa ? contagemPendente(ativa, estado.contagens, agora) : -1
  const rascunho = estado.contagens.find((c) => c.visitaId === v?.id && c.etapa === pendente && !c.hora)

  // vibra quando uma contagem vence
  const anterior = useRef(pendente)
  useEffect(() => {
    if (pendente >= 0 && pendente !== anterior.current) navigator.vibrate?.([300, 120, 300])
    anterior.current = pendente
  }, [pendente])

  const mesas = unidade.mesas
  const mesa = mesas[Math.min(idx, mesas.length - 1)]
  const reg = ativa && mesa ? registroAberto(estado, ativa.id, mesa.id) : undefined
  const marca = rascunho?.mesas[mesa?.id ?? '']

  const marcar = (m: 'ocupada' | 'vazia') => {
    if (!ativa || pendente < 0 || !mesa) return
    mudar((e) => {
      const atual: Contagem = e.contagens.find((c) => c.visitaId === ativa.id && c.etapa === pendente && !c.hora) ?? {
        id: novoId(), visitaId: ativa.id, etapa: pendente, hora: null, mesas: {},
      }
      const novo = { ...atual, mesas: { ...atual.mesas, [mesa.id]: m } }
      if (mesas.every((x) => novo.mesas[x.id])) novo.hora = agoraHora()
      return { ...e, contagens: [...e.contagens.filter((c) => c.id !== atual.id), novo] }
    })
    if (idx < mesas.length - 1) setIdx(idx + 1)
    else setIdx(0)
    // contagem inicial: mesa ocupada sem grupo é estoque inicial; abre o grupo para contar as pessoas
    if (pendente === 0 && m === 'ocupada' && !reg) onMesa(mesa.id, true)
  }
  const limpar = () => ativa && rascunho && mudar((e) => ({ ...e, contagens: e.contagens.filter((c) => c.id !== rascunho.id) }))
  const concluir = () => {
    if (!ativa || pendente < 0) return
    const falta = mesas.filter((x) => !rascunho?.mesas[x.id]).length
    if (falta && !confirm(`Concluir a ${nomeEtapa(pendente, lista.length).toLowerCase()} com ${falta} mesa(s) sem marca?`)) return
    mudar((e) => {
      const base: Contagem = rascunho ?? { id: novoId(), visitaId: ativa.id, etapa: pendente, hora: null, mesas: {} }
      return { ...e, contagens: [...e.contagens.filter((c) => c.id !== base.id), { ...base, hora: agoraHora() }] }
    })
    setIdx(0)
  }

  const R = 120
  const C = 2 * Math.PI * R
  const fr = s ? Math.min(1, Math.max(0, s.fracao)) : 0

  return (
    <div className="px-4 pb-28">
      <div className="mt-5 flex gap-2">
        {lista.slice(1).map((_, i) => {
          const et = i + 1
          const cls = feitas.has(et) ? 'bg-caneta-600' : s?.proxima === et ? 'bg-caneta-800' : 'bg-caneta-200'
          return <span key={et} className={`h-3 flex-1 rounded-full ${cls}`} />
        })}
        {!lista.length && Array.from({ length: 6 }, (_, i) => <span key={i} className="h-3 flex-1 rounded-full bg-caneta-200" />)}
      </div>

      <div className="relative mx-auto mt-6 aspect-square w-full max-w-[290px]">
        <svg viewBox="0 0 280 280" className="absolute inset-0 -rotate-90">
          <circle cx="140" cy="140" r={R} fill="none" strokeWidth="28" className="stroke-neutro-300" />
          {s && <circle cx="140" cy="140" r={R} fill="none" strokeWidth="28" strokeLinecap="round" className="stroke-caneta-600 transition-all" strokeDasharray={`${C * fr} ${C}`} />}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center px-10 text-center">
          {!ativa ? (
            <>
              <button onClick={onComecar} className="grid size-20 place-items-center rounded-full bg-caneta-700 text-sobre" aria-label="Começar visita">
                <PlayIcon className="size-10" />
              </button>
              <p className="mt-3 font-bold">Começar</p>
            </>
          ) : s && s.proxima !== null ? (
            <>
              <p className="text-[34px] font-extrabold leading-none">{fmt(s.faltamMs)}</p>
              <p className="mt-3 text-sm font-bold uppercase text-neutro-600">{s.pausado ? 'Pausado' : 'Próxima etapa'}</p>
              <p>
                {nomeEtapa(s.proxima, lista.length)} ({s.horaProxima?.replace(':', 'h')})
              </p>
            </>
          ) : (
            <>
              <p className="text-2xl font-extrabold">Tempo concluído</p>
              <button onClick={() => onEncerrar(ativa.id)} className="mt-3 rounded-lg bg-neutro-800 px-4 py-2 font-bold text-neutro-50">
                Encerrar visita
              </button>
            </>
          )}
        </div>
      </div>

      {ativa && (
        <>
          <p className="mt-4 text-center text-sm font-bold text-caneta-700">
            {pendente >= 0 ? <span className="animate-pulse">{nomeEtapa(pendente, lista.length)}</span> : <span className="text-neutro-400">{feitas.size}/{lista.length}</span>}
          </p>
          <div className="mt-2 flex items-center gap-3">
            <Redondo onClick={() => setIdx((idx - 1 + mesas.length) % mesas.length)} rotulo="Mesa anterior" cls="bg-neutro-200">
              <ArrowLeftIcon className="size-6" />
            </Redondo>
            <div
              className={`flex-1 rounded-xl border-2 bg-neutro-200/70 px-3 py-2 text-center ${
                marca === 'ocupada' ? 'border-ok-500' : marca === 'vazia' ? 'border-erro-400' : 'border-transparent'
              }`}
            >
              <button onClick={() => mesa && onMesa(mesa.id)} className="inline-flex items-center gap-1 font-extrabold uppercase">
                {mesa?.nome} <PencilSquareIcon className="size-5 text-neutro-500" />
              </button>
              <div className="flex items-center justify-center gap-3 text-sm text-caneta-600">
                {reg ? (
                  <>
                    <span className="flex items-center gap-1">
                      <UserGroupIcon className="size-5 text-neutro-800" />
                      {reg.pessoas}
                    </span>
                    <span className="flex items-center gap-1">
                      <ClockIcon className="size-5 text-neutro-800" />
                      {reg.entrada}
                    </span>
                  </>
                ) : (
                  <span className="text-neutro-500">sem grupo registrado</span>
                )}
                {marca && <b className={marca === 'ocupada' ? 'text-ok-700' : 'text-erro-600'}>· {marca}</b>}
              </div>
            </div>
            <Redondo onClick={() => setIdx((idx + 1) % mesas.length)} rotulo="Próxima mesa" cls="bg-neutro-200">
              <ArrowRightIcon className="size-6" />
            </Redondo>
          </div>
          <p className="mt-2 text-center text-xs font-bold uppercase text-neutro-500">Conclusão estimada: {s?.conclusao}</p>
          <div className="mt-3 flex items-center justify-center gap-4">
            <Redondo onClick={limpar} rotulo="Recomeçar marcações" cls="bg-neutro-200" off={!rascunho}>
              <ArrowPathIcon className="size-6" />
            </Redondo>
            <Redondo onClick={() => marcar('vazia')} rotulo="Mesa vazia" cls="bg-erro-200 text-erro-600" off={pendente < 0}>
              <XMarkIcon className="size-6" />
            </Redondo>
            <button onClick={() => alternarPausa(ativa.id)} aria-label={s?.pausado ? 'Retomar' : 'Pausar'} className="grid size-20 place-items-center rounded-full bg-caneta-700 text-sobre">
              {s?.pausado ? <PlayIcon className="size-8" /> : <PauseIcon className="size-8" />}
            </button>
            <Redondo onClick={() => marcar('ocupada')} rotulo="Mesa ocupada" cls="bg-ok-200 text-ok-700" off={pendente < 0}>
              <CheckIcon className="size-6" />
            </Redondo>
            <Redondo onClick={concluir} rotulo="Concluir contagem" cls="bg-neutro-200" off={pendente < 0}>
              <ChevronDoubleRightIcon className="size-6" />
            </Redondo>
          </div>
        </>
      )}
      {v && (
        <Roteiro
          tarefas={tarefas(estado, unidade, v, s?.decorridoMin ?? 0, {
            ir: onIr,
            fechamento: () => ativa && onFechamento(ativa.id),
            encerrar: () => ativa && onEncerrar(ativa.id),
          })}
        />
      )}
    </div>
  )
}

type Tarefa = { etapa: 'Início' | 'Durante' | 'Fim'; rotulo: string; feita: boolean; detalhe?: string; fazer: () => void }

/** O que o roteiro pede além das contagens, com a situação de cada item na visita. */
function tarefas(
  e: Estado,
  u: Unidade,
  v: Visita,
  decorridoMin: number,
  acoes: { ir: (d: Destino) => void; fechamento: () => void; encerrar: () => void },
): Tarefa[] {
  const nota = (m: 'inicio' | 'fim') => v.notas.some((n) => n.momento === m)
  const medicoes = e.medicoes.filter((m) => m.visitaId === v.id).length
  const horas = Math.floor(decorridoMin / 60)
  const fechou =
    e.registros.some((r) => r.visitaId === v.id && r.saidaTipo === 'fechamento') || e.fluxos.some((f) => f.visitaId === v.id && f.motivo === MOTIVO_FECHAMENTO)
  return [
    { etapa: 'Início', rotulo: 'Observador, papel e posição', feita: !!(v.observador && v.papel && v.posicao), fazer: () => acoes.ir('visita') },
    { etapa: 'Início', rotulo: 'NFC-e de início', feita: nota('inicio'), fazer: () => acoes.ir('visita') },
    {
      etapa: 'Início',
      rotulo: 'Contagem inicial (quem já estava dentro)',
      feita: e.contagens.some((c) => c.visitaId === v.id && c.etapa === 0 && c.hora),
      detalhe: `${e.registros.filter((r) => r.visitaId === v.id && r.inicial).length + e.fluxos.filter((f) => f.visitaId === v.id && f.inicial).length || ''}`,
      // a contagem fica no alto desta mesma aba
      fazer: () => window.scrollTo({ top: 0, behavior: 'smooth' }),
    },
    { etapa: 'Início', rotulo: 'Cobrança e condições do dia', feita: !!(v.ficha.cobranca && v.ficha.condicoes.length), fazer: () => acoes.ir('visita') },
    {
      etapa: 'Início',
      rotulo: 'Foto do cardápio (Ambiente › Fotos)',
      feita: e.fotos.some((f) => f.visitaId === v.id && f.categoria === 'Cardápio'),
      fazer: () => acoes.ir('acustica'),
    },
    { etapa: 'Início', rotulo: 'Acervo e mesas (uma vez por unidade)', feita: u.acervo.estantes > 0, fazer: () => acoes.ir('acervo') },
    {
      etapa: 'Durante',
      rotulo: 'Som uma vez por hora (Ambiente)',
      feita: horas > 0 && medicoes >= horas,
      detalhe: `${medicoes} de ${Math.max(1, horas)}`,
      fazer: () => acoes.ir('acustica'),
    },
    { etapa: 'Fim', rotulo: 'Fechamento da casa, se fechar', feita: fechou, fazer: acoes.fechamento },
    { etapa: 'Fim', rotulo: 'NFC-e do fim', feita: nota('fim'), fazer: () => acoes.ir('visita') },
    { etapa: 'Fim', rotulo: 'Encerrar a visita', feita: !!v.fim, fazer: acoes.encerrar },
  ]
}

function Roteiro({ tarefas }: { tarefas: Tarefa[] }) {
  const feitas = tarefas.filter((t) => t.feita).length
  return (
    <section className="mt-8">
      <h3 className="mb-2 flex items-center text-sm font-bold uppercase text-neutro-600">
        <span className="flex-1">Roteiro da visita</span>
        <span>
          {feitas}/{tarefas.length}
        </span>
      </h3>
      <ul className="divide-y divide-papel overflow-hidden rounded-xl bg-neutro-100">
        {tarefas.map((t) => (
          <li key={t.rotulo}>
            <button onClick={t.fazer} className="flex w-full items-center gap-3 px-3 py-2.5 text-left">
              {t.feita ? <CheckCircleIcon className="size-6 shrink-0 text-ok-600" /> : <span className="size-6 shrink-0 rounded-full border-2 border-neutro-300" />}
              <span className="w-[68px] shrink-0 text-xs font-bold uppercase text-neutro-500">{t.etapa}</span>
              <span className={`flex-1 text-[15px] ${t.feita ? 'text-neutro-500' : ''}`}>{t.rotulo}</span>
              {t.detalhe && <span className="text-sm text-neutro-500">{t.detalhe}</span>}
              <ChevronRightIcon className="size-5 shrink-0 text-neutro-400" />
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}

function Redondo({ onClick, rotulo, cls, off, children }: { onClick: () => void; rotulo: string; cls: string; off?: boolean; children: React.ReactNode }) {
  return (
    <button onClick={onClick} disabled={off} aria-label={rotulo} title={rotulo} className={`grid size-14 shrink-0 place-items-center rounded-full disabled:opacity-35 ${cls}`}>
      {children}
    </button>
  )
}
