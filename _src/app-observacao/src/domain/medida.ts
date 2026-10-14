export type Ponto = { x: number; y: number }

const dist = (a: Ponto, b: Ponto) => Math.hypot(a.x - b.x, a.y - b.y)

/** Comprimento do alvo em cm pela escala da referência (mesmo plano, foto de frente). Uma casa decimal. */
export function medirCm(ref: [Ponto, Ponto], refCm: number, alvo: [Ponto, Ponto]): number | null {
  const r = dist(ref[0], ref[1])
  if (r < 1 || !(refCm > 0)) return null
  return Math.round(((dist(alvo[0], alvo[1]) / r) * refCm) * 10) / 10
}

/** Objetos de referência comuns, com a medida usada (cm). */
export const REFERENCIAS: { nome: string; cm: number }[] = [
  { nome: 'Cartão bancário (lado maior)', cm: 8.56 },
  { nome: 'Folha A4 (lado maior)', cm: 29.7 },
  { nome: 'Folha A4 (lado menor)', cm: 21 },
]

export const ROTULOS_MEDIDA = ['Largura do corredor', 'Comprimento da mesa', 'Largura da mesa', 'Distância entre mesas', 'Altura da estante', 'Outro']
