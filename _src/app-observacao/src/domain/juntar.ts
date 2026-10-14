import { normalizar, type Estado } from './model'

type ComId = { id: string }
const LISTAS = ['unidades', 'visitas', 'registros', 'fluxos', 'contagens', 'medicoes', 'fotos', 'medidas'] as const

function uniao<T extends ComId>(local: T[], recebido: T[]): { lista: T[]; novos: number } {
  const ids = new Set(local.map((x) => x.id))
  const novos = recebido.filter((x) => !ids.has(x.id))
  return { lista: [...local, ...novos], novos: novos.length }
}

/** Junta os dados recebidos de outro celular: entra o que não existe aqui; no mesmo id, vale o daqui. */
export function juntar(local: Estado, recebido: Partial<Estado>): { estado: Estado; novos: number } {
  const r = normalizar(recebido)
  const estado = { ...local }
  let novos = 0
  for (const k of LISTAS) {
    const u = uniao<ComId>(local[k] as ComId[], r[k] as ComId[])
    ;(estado as Record<string, unknown>)[k] = u.lista
    novos += u.novos
  }
  return { estado, novos }
}
