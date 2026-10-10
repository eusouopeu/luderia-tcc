import { Capacitor } from '@capacitor/core'
import { hojeIso, type Estado } from '../domain/model'

/*
 * Backup automático: a cada mudança (agrupada em 5 s) grava o estado inteiro em
 * Documentos/ObservacaoLuderia/observacao-backup-AAAA-MM-DD.json, que sobrevive
 * a desinstalar o app. Sem acesso a Documentos, usa a pasta externa do app.
 * Restaurar: Ajustes › Restaurar backup.
 */
const DIR = 'ObservacaoLuderia'
let timer = 0
let ultimo: { quando: string; onde: string } | null = null
export const ultimoBackup = () => ultimo

export async function gravarBackup(e: Estado): Promise<string | null> {
  if (!Capacitor.isNativePlatform()) return null
  const { Filesystem, Directory, Encoding } = await import('@capacitor/filesystem')
  const json = JSON.stringify({ app: 'observacao-luderia', versao: 2, gravadoEm: new Date().toISOString(), estado: e })
  const alvos = [
    { directory: Directory.Documents, onde: `Documentos/${DIR}` },
    { directory: Directory.External, onde: `Android/data/…/files/${DIR}` },
  ]
  for (const { directory, onde } of alvos) {
    try {
      await Filesystem.writeFile({ path: `${DIR}/observacao-backup-${hojeIso()}.json`, data: json, directory, encoding: Encoding.UTF8, recursive: true })
      ultimo = { quando: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }), onde }
      return onde
    } catch {
      /* tenta a próxima pasta */
    }
  }
  return null
}

export function agendarBackup(e: Estado) {
  clearTimeout(timer)
  timer = window.setTimeout(() => void gravarBackup(e), 5000)
}

/** Lê um arquivo de backup (ou o JSON do estado puro). */
export function lerBackup(texto: string): Partial<Estado> | null {
  try {
    const d = JSON.parse(texto)
    const e = d?.estado ?? d
    return Array.isArray(e?.unidades) ? e : null
  } catch {
    return null
  }
}
