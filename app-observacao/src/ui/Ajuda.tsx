import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { InformationCircleIcon } from '@heroicons/react/24/outline'

/**
 * Botão ⓘ ao lado do texto a que se refere; abre um balão flutuante (portal),
 * preso a 12px das margens, embaixo do ícone ou em cima quando não cabe.
 * Fecha com outro toque, toque fora, Esc ou rolagem (_shared/design-standards.md).
 */
export function Ajuda({ children, rotulo = 'Ajuda' }: { children: ReactNode; rotulo?: string }) {
  const [aberto, setAberto] = useState(false)
  const [pos, setPos] = useState<{ top: number; left: number; largura: number } | null>(null)
  const botao = useRef<HTMLButtonElement>(null)
  const balao = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    if (!aberto || !botao.current) return
    const r = botao.current.getBoundingClientRect()
    const largura = Math.min(300, window.innerWidth - 24)
    const left = Math.min(Math.max(12, r.left + r.width / 2 - largura / 2), window.innerWidth - 12 - largura)
    const alto = balao.current?.offsetHeight ?? 80
    const top = r.bottom + 8 + alto > window.innerHeight - 12 ? r.top - 8 - alto : r.bottom + 8
    setPos({ top, left, largura })
  }, [aberto])

  useEffect(() => {
    if (!aberto) return
    const fechar = (e: Event) => {
      if (e.type === 'keydown' && (e as KeyboardEvent).key !== 'Escape') return
      if (e.type === 'pointerdown' && (balao.current?.contains(e.target as Node) || botao.current?.contains(e.target as Node))) return
      setAberto(false)
    }
    window.addEventListener('pointerdown', fechar, true)
    window.addEventListener('keydown', fechar)
    window.addEventListener('scroll', fechar, true)
    return () => {
      window.removeEventListener('pointerdown', fechar, true)
      window.removeEventListener('keydown', fechar)
      window.removeEventListener('scroll', fechar, true)
    }
  }, [aberto])

  return (
    <>
      <button
        ref={botao}
        type="button"
        aria-label={rotulo}
        aria-expanded={aberto}
        onClick={(e) => (e.stopPropagation(), e.preventDefault(), setAberto((x) => !x))}
        className="inline-grid size-7 shrink-0 place-items-center rounded-full text-neutro-400"
      >
        <InformationCircleIcon className="size-5" />
      </button>
      {aberto &&
        createPortal(
          <div
            ref={balao}
            role="tooltip"
            style={{ top: pos?.top ?? -9999, left: pos?.left ?? 0, width: pos?.largura }}
            className="fixed z-50 rounded-xl bg-neutro-800 px-3 py-2 text-sm normal-case leading-normal font-normal text-papel shadow-lg"
          >
            {children}
          </div>,
          document.body,
        )}
    </>
  )
}
