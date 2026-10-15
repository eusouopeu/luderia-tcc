import { useEffect, useState } from 'react'
import { ArrowDownTrayIcon, ArrowUpTrayIcon, CheckIcon, DevicePhoneMobileIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { useLoja } from '../store'
import { juntar } from '../domain/juntar'
import { lerBackup } from '../storage/backup'
import { Aproximacao, aproximacaoSuportada } from '../storage/aproximacao'

type Fase = { modo: 'enviar' | 'receber'; etapa: 'esperando' | 'transferindo' | 'pronto' | 'erro'; msg?: string }

/** Enviar/receber todos os dados para outro celular encostando os dois (NFC) — a cópia vai por Bluetooth. */
export function Transferir() {
  const { estado, mudar, substituir } = useLoja()
  const [fase, setFase] = useState<Fase | null>(null)
  const [recebido, setRecebido] = useState<ReturnType<typeof lerBackup>>(null)

  useEffect(() => {
    if (!fase || fase.etapa !== 'esperando') return
    const h = Aproximacao.addListener('toque', () => {
      navigator.vibrate?.(80)
      setFase((f) => (f ? { ...f, etapa: 'transferindo' } : f))
    })
    return () => void h.then((x) => x.remove())
  }, [fase?.etapa])

  async function iniciar(modo: Fase['modo']) {
    if (!aproximacaoSuportada()) return setFase({ modo, etapa: 'erro', msg: 'Só funciona no app instalado no celular.' })
    setFase({ modo, etapa: 'esperando' })
    try {
      if (modo === 'enviar') {
        const r = await Aproximacao.enviar({ dados: JSON.stringify({ app: 'observacao-luderia', versao: 2, estado }) })
        setFase({ modo, etapa: 'pronto', msg: `${Math.round(r.bytes / 1024)} KB enviados.` })
      } else {
        const r = await Aproximacao.receber()
        const e = lerBackup(r.dados)
        if (!e) throw new Error('Os dados recebidos não são do app.')
        setRecebido(e)
        setFase({ modo, etapa: 'pronto', msg: `Recebidos ${e.visitas?.length ?? 0} visitas e ${e.registros?.length ?? 0} grupos.` })
      }
      navigator.vibrate?.([60, 60, 60])
    } catch (err) {
      setFase({ modo, etapa: 'erro', msg: err instanceof Error ? err.message : String(err) })
    }
  }

  const fechar = () => {
    if (fase?.etapa === 'esperando' || fase?.etapa === 'transferindo') void Aproximacao.cancelar()
    setFase(null)
    setRecebido(null)
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-2">
        <button onClick={() => iniciar('enviar')} className="flex h-11 items-center justify-center gap-2 rounded-lg bg-neutro-200 font-semibold">
          <ArrowUpTrayIcon className="size-5" /> Enviar
        </button>
        <button onClick={() => iniciar('receber')} className="flex h-11 items-center justify-center gap-2 rounded-lg bg-neutro-200 font-semibold">
          <ArrowDownTrayIcon className="size-5" /> Receber
        </button>
      </div>

      {fase && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-escuro/60 p-6" role="dialog" aria-modal>
          <div className="w-full max-w-sm rounded-2xl bg-papel p-6 text-center">
            <div className="relative mx-auto grid size-24 place-items-center">
              {fase.etapa === 'esperando' && <span className="absolute inset-0 animate-ping rounded-full bg-caneta-200" />}
              <span className={`relative grid size-20 place-items-center rounded-full ${fase.etapa === 'erro' ? 'bg-erro-100 text-erro-600' : fase.etapa === 'pronto' ? 'bg-ok-100 text-ok-700' : 'bg-caneta-100 text-caneta-700'}`}>
                {fase.etapa === 'pronto' ? <CheckIcon className="size-10" /> : fase.etapa === 'erro' ? <XMarkIcon className="size-10" /> : <DevicePhoneMobileIcon className={`size-10 ${fase.etapa === 'transferindo' ? 'animate-pulse' : ''}`} />}
              </span>
            </div>
            <p className="mt-4 text-lg font-bold">
              {fase.etapa === 'esperando'
                ? 'Encoste as costas dos celulares'
                : fase.etapa === 'transferindo'
                  ? fase.modo === 'enviar' ? 'Enviando…' : 'Recebendo…'
                  : fase.etapa === 'pronto'
                    ? 'Pronto'
                    : 'Não deu certo'}
            </p>
            {fase.etapa === 'esperando' && (
              <p className="mt-1 text-sm text-neutro-500">{fase.modo === 'enviar' ? 'No outro celular, toque em Receber.' : 'No outro celular, toque em Enviar.'}</p>
            )}
            {fase.msg && <p className="mt-1 text-sm text-neutro-600">{fase.msg}</p>}

            {recebido ? (
              <div className="mt-5 grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    if (!confirm('Substituir todos os dados deste celular pelos recebidos?')) return
                    substituir(recebido)
                    fechar()
                  }}
                  className="h-11 rounded-lg bg-neutro-200 font-semibold"
                >
                  Substituir
                </button>
                <button
                  onClick={() => {
                    mudar((e) => juntar(e, recebido).estado)
                    fechar()
                  }}
                  className="h-11 rounded-lg bg-caneta-600 font-bold text-sobre"
                >
                  Juntar
                </button>
              </div>
            ) : (
              <button onClick={fechar} className="mt-5 h-11 w-full rounded-lg bg-neutro-200 font-semibold">
                {fase.etapa === 'pronto' || fase.etapa === 'erro' ? 'Fechar' : 'Cancelar'}
              </button>
            )}
          </div>
        </div>
      )}
    </>
  )
}
