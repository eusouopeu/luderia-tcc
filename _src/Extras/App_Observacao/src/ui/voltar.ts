import { useEffect, useRef } from 'react'

/** Pilha de camadas abertas (folhas, câmera): o voltar do Android fecha a de cima antes de mexer na navegação. */
const pilha: { current: () => void }[] = []

export function useVoltar(fechar: () => void, ativo = true) {
  const ref = useRef(fechar)
  ref.current = fechar
  useEffect(() => {
    if (!ativo) return
    pilha.push(ref)
    return () => {
      const i = pilha.lastIndexOf(ref)
      if (i >= 0) pilha.splice(i, 1)
    }
  }, [ativo])
}

/** Fecha a camada de cima; devolve false se não havia nenhuma. */
export function voltarCamada(): boolean {
  const topo = pilha[pilha.length - 1]
  if (!topo) return false
  topo.current()
  return true
}
