import { useEffect, useState } from 'react'
import { ClockIcon, SpeakerWaveIcon, UserGroupIcon, ArrowTrendingUpIcon, ScaleIcon } from '@heroicons/react/24/outline'
import { useLoja } from '../../store'
import { Fab } from '../../ui/comum'
import { Ajuda } from '../../ui/Ajuda'
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

  const arco = (i: number) => (acesos >= i ? 'stroke-caneta-600' : 'stroke-caneta-300')
  return (
    <div className="px-2">
      {erro && <p className="mt-4 rounded-lg bg-erro-50 p-3 text-sm text-erro-700">{erro}</p>}
      <svg viewBox="0 0 200 150" className="mx-auto mt-6 w-full max-w-[340px]" aria-hidden>
        <path d="M14 58 Q100 -16 186 58" fill="none" strokeWidth="12" strokeLinecap="round" className={`${arco(3)} transition-colors`} />
        <path d="M40 84 Q100 30 160 84" fill="none" strokeWidth="12" strokeLinecap="round" className={`${arco(2)} transition-colors`} />
        <path d="M67 109 Q100 78 133 109" fill="none" strokeWidth="12" strokeLinecap="round" className={`${arco(1)} transition-colors`} />
        <circle cx="100" cy="133" r="10" className="fill-caneta-600" />
      </svg>

      <div className="mt-6 grid grid-cols-3 gap-x-2 gap-y-4">
        <Dado icone={<SpeakerWaveIcon className="size-5" />} rotulo="Decibéis" valor={db === null ? '—' : `${db} dB`} ajuda={`Média dos últimos 10 s (agora: ${nivel ?? '—'} dB). Estimativa: o microfone do celular não é calibrado de fábrica — ajuste em Ajustes › Microfone. O + guarda a medição.`} />
        <Dado icone={<UserGroupIcon className="size-5" />} rotulo="Pessoas" valor={String(pessoas)} />
        <Dado icone={<ScaleIcon className="size-5" />} rotulo="Acústica" valor={cls?.rotulo ?? '—'} cor={cls?.cor} />
        <Dado icone={<ClockIcon className="size-5" />} rotulo="Comparação" valor={db === null ? '—' : comparar(db)} largo />
        <Dado icone={<ArrowTrendingUpIcon className="size-5" />} rotulo="Pico 10 s" valor={pico === null ? '—' : `${pico} dB`} />
      </div>
      <Fab onClick={salvar} rotulo="Salvar medição" badge={medicoes.length} />
    </div>
  )
}

function Dado({ icone, rotulo, valor, cor = 'text-caneta-600', largo, ajuda }: { icone: React.ReactNode; rotulo: string; valor: string; cor?: string; largo?: boolean; ajuda?: string }) {
  return (
    <div className={largo ? 'col-span-2' : ''}>
      <div className="flex items-center gap-1 text-[12px] font-extrabold uppercase text-neutro-800">
        {icone}
        {rotulo}
        {ajuda && <Ajuda rotulo={`Sobre ${rotulo.toLowerCase()}`}>{ajuda}</Ajuda>}
      </div>
      <div className={`pl-1 text-2xl font-bold ${cor}`}>{valor}</div>
    </div>
  )
}
