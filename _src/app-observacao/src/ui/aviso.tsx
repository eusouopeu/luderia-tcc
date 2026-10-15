import { useEffect } from 'react'
import { create } from 'zustand'

type Aviso = { id: number; texto: string; acao?: { rotulo: string; fazer: () => void } }
const useAvisos = create<{ aviso: Aviso | null }>(() => ({ aviso: null }))

/** Mensagem curta embaixo da tela (confirmação de lançamento), com ação opcional (Desfazer). */
export function avisar(texto: string, acao?: Aviso['acao']) {
  useAvisos.setState({ aviso: { id: Date.now(), texto, acao } })
}

export function Avisos() {
  const aviso = useAvisos((s) => s.aviso)
  useEffect(() => {
    if (!aviso) return
    const t = setTimeout(() => useAvisos.setState((s) => (s.aviso?.id === aviso.id ? { aviso: null } : s)), aviso.acao ? 5000 : 3000)
    return () => clearTimeout(t)
  }, [aviso])
  if (!aviso) return null
  return (
    <div role="status" className="aviso fixed bottom-[92px] left-4 right-[84px] z-50 flex max-w-[420px] items-center gap-3 rounded-xl bg-neutro-900 px-4 py-3 text-neutro-50 shadow-lg">
      <span className="flex-1 text-[15px]">{aviso.texto}</span>
      {aviso.acao && (
        <button
          onClick={() => {
            aviso.acao!.fazer()
            useAvisos.setState({ aviso: null })
          }}
          className="shrink-0 text-[15px] font-bold text-caneta-300"
        >
          {aviso.acao.rotulo}
        </button>
      )}
    </div>
  )
}
