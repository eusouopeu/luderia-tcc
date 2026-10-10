import { useEffect, useState } from 'react'
import { ClockIcon, SpeakerWaveIcon, UserGroupIcon, ArrowTrendingUpIcon, ScaleIcon } from '@heroicons/react/24/outline'
import { useLoja } from '../../store'
import { Fab } from '../../ui/comum'
import { useMicrofone } from '../../ui/useMicrofone'
import { arcos, classificar, comparar, leq } from '../../domain/acustica'
import { agoraHora, novoId, pessoasDentro, visitaAtiva, type Unidade } from '../../domain/model'

/** Nível sonoro estimado pelo microfone; o + guarda a medição (Leq dos últimos 10 s). */
export function AbaAcustica({ unidade, semVisita }: { unidade: Unidade; semVisita: () => boolean }) {
  const { estado, mudar } = useLoja()
  const { nivel, erro, janela } = useMicrofone(true, estado.config.calibracaoDb)
  const [, tick] = useState(0)
  useEffect(() => {
    const t = setInterval(() => tick((x) => x + 1), 1000)
    return () => clearInterval(t)
  }, [])
  const visita = visitaAtiva(estado, unidade.id)
  const media = leq(janela.current)
  const pico = janela.current.length ? Math.max(...janela.current) : null
  const db = media ?? nivel
  const acesos = db === null ? -1 : arcos(nivel ?? db)
  const pessoas = visita ? pessoasDentro(estado, visita.id) : 0
  const medicoes = visita ? estado.medicoes.filter((m) => m.visitaId === visita.id) : []
  const cls = db === null ? null : classificar(db)

  const salvar = () => {
    if (media === null || pico === null) return
    if (!visita && !semVisita()) return
    const v = visitaAtiva(useLoja.getState().estado, unidade.id)!
    mudar((e) => ({ ...e, medicoes: [...e.medicoes, { id: novoId(), visitaId: v.id, hora: agoraHora(), db: media, pico, pessoas: pessoasDentro(e, v.id) }] }))
    navigator.vibrate?.(60)
  }

  const arco = (i: number) => (acesos >= i ? 'stroke-orange-600' : 'stroke-orange-300')
  return (
    <div className="px-6 pb-28">
      <h2 className="mt-5 text-center text-sm font-bold uppercase">Acústica</h2>
      {erro && <p className="mt-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{erro}</p>}
      <svg viewBox="0 0 200 150" className="mx-auto mt-6 w-full max-w-[340px]" aria-hidden>
        <path d="M14 58 Q100 -16 186 58" fill="none" strokeWidth="12" strokeLinecap="round" className={`${arco(3)} transition-colors`} />
        <path d="M40 84 Q100 30 160 84" fill="none" strokeWidth="12" strokeLinecap="round" className={`${arco(2)} transition-colors`} />
        <path d="M67 109 Q100 78 133 109" fill="none" strokeWidth="12" strokeLinecap="round" className={`${arco(1)} transition-colors`} />
        <circle cx="100" cy="133" r="10" className="fill-orange-600" />
      </svg>
      <p className="mt-1 text-center text-xs text-slate-400">nível agora: {nivel ?? '—'} dB · estimado, sem calibração de fábrica</p>

      <div className="mt-6 grid grid-cols-3 gap-x-2 gap-y-4">
        <Dado icone={<SpeakerWaveIcon className="size-5" />} rotulo="Decibéis" valor={db === null ? '—' : `${db} dB`} />
        <Dado icone={<UserGroupIcon className="size-5" />} rotulo="Pessoas" valor={String(pessoas)} />
        <Dado icone={<ScaleIcon className="size-5" />} rotulo="Acústica" valor={cls?.rotulo ?? '—'} cor={cls?.cor} />
        <Dado icone={<ClockIcon className="size-5" />} rotulo="Comparação" valor={db === null ? '—' : comparar(db)} largo />
        <Dado icone={<ArrowTrendingUpIcon className="size-5" />} rotulo="Pico 10 s" valor={pico === null ? '—' : `${pico} dB`} />
      </div>
      <p className="mt-5 text-sm text-slate-500">
        {medicoes.length ? `${medicoes.length} medições salvas · última às ${medicoes[medicoes.length - 1].hora} (${medicoes[medicoes.length - 1].db} dB)` : 'Toque em + para salvar a medição dos últimos 10 s.'}
      </p>
      <Fab onClick={salvar} rotulo="Salvar medição" />
    </div>
  )
}

function Dado({ icone, rotulo, valor, cor = 'text-orange-600', largo }: { icone: React.ReactNode; rotulo: string; valor: string; cor?: string; largo?: boolean }) {
  return (
    <div className={largo ? 'col-span-2' : ''}>
      <div className="flex items-center gap-1 text-[12px] font-extrabold uppercase text-slate-800">
        {icone}
        {rotulo}
      </div>
      <div className={`pl-1 text-2xl font-bold ${cor}`}>{valor}</div>
    </div>
  )
}
