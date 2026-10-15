/* Nível sonoro estimado pelo microfone do celular. Sem calibração, o valor é
   relativo: dB ≈ dBFS + calibração (padrão 90, ajustável em Ajustes contra um
   decibelímetro). As faixas seguem a inteligibilidade da fala em salão. */

/** Média energética (Leq) de níveis em dB. */
export function leq(niveis: number[]): number | null {
  if (!niveis.length) return null
  const e = niveis.reduce((s, x) => s + 10 ** (x / 10), 0) / niveis.length
  return Math.round(10 * Math.log10(e))
}

export function classificar(db: number): { rotulo: string; cor: string } {
  if (db < 55) return { rotulo: 'Boa', cor: 'text-ok-600' }
  if (db < 65) return { rotulo: 'Razoável', cor: 'text-alerta-700' }
  if (db < 75) return { rotulo: 'Ruim', cor: 'text-erro-500' }
  return { rotulo: 'Muito ruim', cor: 'text-erro-700' }
}

const REFERENCIAS: [number, string][] = [
  [30, 'Sussurro'],
  [42, 'Biblioteca'],
  [52, 'Ventilador'],
  [62, 'Conversa normal'],
  [72, 'Restaurante cheio'],
  [82, 'Trânsito intenso'],
  [Infinity, 'Show / bar lotado'],
]
export const comparar = (db: number) => REFERENCIAS.find(([lim]) => db < lim)![1]

/** Quantos arcos do ícone acendem (0–3) para o nível. */
export const arcos = (db: number) => (db >= 75 ? 3 : db >= 62 ? 2 : db >= 50 ? 1 : 0)
