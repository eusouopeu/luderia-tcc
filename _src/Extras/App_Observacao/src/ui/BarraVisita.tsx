import { useEffect, useState } from 'react'
import { ChevronRightIcon, ExclamationTriangleIcon, PlayIcon } from '@heroicons/react/24/outline'
import { useLoja } from '../store'
import { pessoasDentro, visitaAtiva, type Unidade } from '../domain/model'
import { contagemPendente, etapas, nomeEtapa } from '../domain/temporizador'

/**
 * Situação da visita no alto de todas as abas: sem visita, um botão de começar; com visita,
 * quem observa, desde quando, quantos estão dentro e o que está pendente (contagem vencida,
 * NFC-e de início), que faltaram nas visitas de outubro.
 */
export function BarraVisita({ unidade, onComecar, onTemporizador }: { unidade: Unidade; onComecar: () => void; onTemporizador: () => void }) {
  const estado = useLoja((s) => s.estado)
  const [agora, setAgora] = useState(() => new Date())
  useEffect(() => {
    const t = setInterval(() => setAgora(new Date()), 15000)
    return () => clearInterval(t)
  }, [])
  const v = visitaAtiva(estado, unidade.id)
  if (!v)
    return (
      <button onClick={onComecar} className="mx-4 mt-2 flex h-11 w-[calc(100%-2rem)] items-center justify-center gap-2 rounded-lg bg-caneta-600 font-bold text-sobre">
        <PlayIcon className="size-5" /> Começar visita
      </button>
    )
  const pend = contagemPendente(v, estado.contagens, agora)
  const pendencia =
    pend >= 0 ? `${nomeEtapa(pend, etapas(v).length)} a fazer` : !v.notas.some((n) => n.momento === 'inicio') ? 'Falta a NFC-e de início' : ''
  return (
    <button
      onClick={onTemporizador}
      className={`mx-4 mt-2 flex w-[calc(100%-2rem)] items-center gap-2 rounded-lg px-3 py-2 text-left text-[15px] ${pendencia ? 'bg-alerta-100' : 'bg-neutro-100'}`}
    >
      <span className="size-2.5 shrink-0 animate-pulse rounded-full bg-caneta-600" aria-hidden />
      <span className="min-w-0 flex-1">
        <span className="block truncate">
          <b className="text-caneta-700">{v.observador || 'sem observador'}</b> desde {v.inicio.slice(11, 16)} · <b>{pessoasDentro(estado, v.id)}</b> dentro
          {v.pausaDesde && <b className="text-alerta-700"> · pausado</b>}
        </span>
        {pendencia && (
          <span className="flex items-center gap-1 text-[13px] font-bold text-alerta-700">
            <ExclamationTriangleIcon className="size-4" /> {pendencia}
          </span>
        )}
      </span>
      <ChevronRightIcon className="size-5 shrink-0 text-neutro-500" />
    </button>
  )
}
