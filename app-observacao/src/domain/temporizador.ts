import { agoraHora, type Visita } from './model'

/** Minutos (desde o início efetivo) de cada contagem: a inicial (0) e uma a cada intervalo até o fim. */
export function etapas(v: Visita): number[] {
  const n = Math.max(1, Math.floor(v.duracaoMin / v.intervaloMin))
  return Array.from({ length: n + 1 }, (_, i) => i * v.intervaloMin)
}

export const nomeEtapa = (i: number, total: number) =>
  i === 0 ? 'Contagem inicial' : `${i}ª contagem${i === total - 1 ? ' (final)' : ''}`

export type SituacaoTimer = {
  /** tempo efetivo (sem pausas) desde o início */
  decorridoMs: number
  decorridoMin: number
  /** índice da próxima contagem em `etapas`; null quando o tempo da visita acabou */
  proxima: number | null
  faltamMs: number
  /** fração do intervalo atual já corrida (0–1), para o anel */
  fracao: number
  horaProxima: string | null
  conclusao: string
  pausado: boolean
}

/** Onde a visita está no roteiro, descontado o tempo pausado. */
export function situacaoTimer(v: Visita, agora = new Date()): SituacaoTimer {
  const inicio = new Date(v.inicio).getTime()
  const fimRef = v.fim ? new Date(v.fim).getTime() : agora.getTime()
  const pausaAtual = v.pausaDesde ? fimRef - new Date(v.pausaDesde).getTime() : 0
  const pausado = v.pausadoMs + Math.max(0, pausaAtual)
  const decorridoMs = Math.max(0, fimRef - inicio - pausado)
  const lista = etapas(v)
  const idx = v.fim ? -1 : lista.findIndex((m) => m * 60000 > decorridoMs)
  const proxima = idx < 0 ? null : idx
  const alvo = proxima === null ? 0 : lista[proxima] * 60000
  const faltamMs = proxima === null ? 0 : alvo - decorridoMs
  const anterior = proxima === null || proxima === 0 ? 0 : lista[proxima - 1] * 60000
  const fracao = proxima === null ? 1 : alvo === anterior ? 1 : (decorridoMs - anterior) / (alvo - anterior)
  return {
    decorridoMs,
    decorridoMin: Math.floor(decorridoMs / 60000),
    proxima,
    faltamMs,
    fracao,
    horaProxima: proxima === null ? null : agoraHora(new Date(agora.getTime() + faltamMs)),
    conclusao: agoraHora(new Date(inicio + v.duracaoMin * 60000 + pausado)),
    pausado: !!v.pausaDesde,
  }
}

/** Horários de relógio das contagens que ainda faltam (para os lembretes). */
export function horariosRestantes(v: Visita, agora = new Date()): { etapa: number; quando: Date }[] {
  if (v.fim || v.pausaDesde) return []
  const s = situacaoTimer(v, agora)
  return etapas(v)
    .map((m, i) => ({ etapa: i, quando: new Date(agora.getTime() + (m * 60000 - s.decorridoMs)) }))
    .filter((x) => x.quando.getTime() > agora.getTime())
}
