import { useEffect, useState } from 'react'
import { Capacitor, registerPlugin } from '@capacitor/core'
import { MoonIcon, SunIcon } from '@heroicons/react/24/outline'
import { useLoja } from '../store'
import type { Tema } from '../domain/model'

const CHAVE = 'observacao-luderia:tema'
/** Plugin nativo TemaPlugin.java: cor do fundo atrás das barras do sistema e cor dos ícones delas. */
const TemaNativo = registerPlugin<{ aplicar(o: { escuro: boolean; cor: string }): Promise<void> }>('Tema')

const prefereEscuro = () => window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false

/** Tema efetivo (resolve "sistema") e o aplica ao <html>, à barra de status e ao localStorage (lido antes do 1º paint). */
export function useTemaEfetivo(): boolean {
  const tema = useLoja((s) => s.estado.config.tema)
  const [sistemaEscuro, setSistemaEscuro] = useState(prefereEscuro)
  useEffect(() => {
    const m = window.matchMedia?.('(prefers-color-scheme: dark)')
    const f = () => setSistemaEscuro(m.matches)
    m?.addEventListener('change', f)
    return () => m?.removeEventListener('change', f)
  }, [])
  const escuro = tema === 'escuro' || (tema === 'sistema' && sistemaEscuro)
  useEffect(() => {
    document.documentElement.dataset.tema = escuro ? 'escuro' : 'claro'
    try {
      localStorage.setItem(CHAVE, tema)
    } catch {
      /* sem armazenamento: só não evita o piscar na abertura */
    }
    const cor = getComputedStyle(document.documentElement).getPropertyValue('--color-papel').trim()
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', cor)
    if (Capacitor.isNativePlatform()) void TemaNativo.aplicar({ escuro, cor }).catch(() => {})
  }, [escuro, tema])
  return escuro
}

/** Botão-ícone da barra superior: alterna claro/escuro. */
export function BotaoTema() {
  const { estado, mudar } = useLoja()
  const t = estado.config.tema
  const escuro = t === 'escuro' || (t === 'sistema' && prefereEscuro())
  const novo: Tema = escuro ? 'claro' : 'escuro'
  return (
    <button
      onClick={() => mudar((e) => ({ ...e, config: { ...e.config, tema: novo } }))}
      aria-label={escuro ? 'Tema claro' : 'Tema escuro'}
      title={escuro ? 'Tema claro' : 'Tema escuro'}
      className="p-2 text-neutro-700"
    >
      {escuro ? <SunIcon className="size-6" /> : <MoonIcon className="size-6" />}
    </button>
  )
}
