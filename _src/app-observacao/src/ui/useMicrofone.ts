import { useEffect, useRef, useState } from 'react'

/** Lê o microfone enquanto `ativo`: nível instantâneo e os últimos 10 s (amostras a cada 100 ms), em dB estimado. */
export function useMicrofone(ativo: boolean, calibracao: number) {
  const [nivel, setNivel] = useState<number | null>(null)
  const [erro, setErro] = useState('')
  const janela = useRef<number[]>([])
  const cal = useRef(calibracao)
  cal.current = calibracao

  useEffect(() => {
    if (!ativo) return
    let parar = false
    let stream: MediaStream | null = null
    let ctx: AudioContext | null = null
    let timer = 0
    janela.current = []
    ;(async () => {
      try {
        // sem processamento de voz: o controle de ganho automático achataria o nível
        stream = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
        })
      } catch {
        setErro('Sem acesso ao microfone. Libere a permissão nas configurações do Android.')
        return
      }
      if (parar) return stream.getTracks().forEach((t) => t.stop())
      ctx = new AudioContext()
      const an = ctx.createAnalyser()
      an.fftSize = 2048
      ctx.createMediaStreamSource(stream).connect(an)
      const buf = new Float32Array(an.fftSize)
      const ler = () => {
        an.getFloatTimeDomainData(buf)
        let s = 0
        for (const x of buf) s += x * x
        const rms = Math.sqrt(s / buf.length)
        const db = Math.max(0, Math.round(20 * Math.log10(Math.max(rms, 1e-7)) + cal.current))
        janela.current.push(db)
        if (janela.current.length > 100) janela.current.shift()
        setNivel(db)
        timer = window.setTimeout(ler, 100)
      }
      ler()
    })()
    return () => {
      parar = true
      clearTimeout(timer)
      stream?.getTracks().forEach((t) => t.stop())
      void ctx?.close()
    }
  }, [ativo])

  return { nivel, erro, janela }
}
