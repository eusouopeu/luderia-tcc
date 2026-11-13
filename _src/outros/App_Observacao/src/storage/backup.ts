import { Capacitor } from '@capacitor/core'
import { agoraHora, hojeIso, type Estado } from '../domain/model'

/*
 * Backup automático: a cada mudança (agrupada em 5 s) grava o estado inteiro em
 * Documentos/ObservacaoLuderia/observacao-backup-AAAA-MM-DD.json, que sobrevive
 * a desinstalar o app. Sem acesso a Documentos, usa a pasta externa do app.
 * Além do arquivo do dia, guarda uma versão a cada VERSAO_MIN em versoes/
 * (observacao-AAAA-MM-DD_HHMM.json), mantendo as MAX_VERSOES mais recentes: um
 * estado estragado sobrescreve o arquivo do dia, mas não apaga as versões.
 * Restaurar: Ajustes › Backup.
 */
const DIR = 'ObservacaoLuderia'
const VERSOES = `${DIR}/versoes`
export const VERSAO_MIN = 15
export const MAX_VERSOES = 40
let timer = 0
let ultimo: { quando: string; onde: string } | null = null
let ultimaVersao = 0
export const ultimoBackup = () => ultimo

const fs = () => import('@capacitor/filesystem')
const json = (e: Estado) => JSON.stringify({ app: 'observacao-luderia', versao: 2, gravadoEm: new Date().toISOString(), estado: e })
/** Nome da versão: observacao-2026-10-18_2140.json */
export const nomeVersao = (d = new Date()) => `observacao-${hojeIso(d)}_${agoraHora(d).replace(':', '')}.json`

/** Grava o arquivo do dia e, passado o intervalo (ou com `versao`), uma versão nova. */
export async function gravarBackup(e: Estado, versao = false): Promise<string | null> {
  if (!Capacitor.isNativePlatform()) return null
  const { Filesystem, Directory, Encoding } = await fs()
  const texto = json(e)
  const alvos = [
    { directory: Directory.Documents, onde: `Documentos/${DIR}` },
    { directory: Directory.External, onde: `Android/data/…/files/${DIR}` },
  ]
  for (const { directory, onde } of alvos) {
    try {
      await Filesystem.writeFile({ path: `${DIR}/observacao-backup-${hojeIso()}.json`, data: texto, directory, encoding: Encoding.UTF8, recursive: true })
      ultimo = { quando: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }), onde }
      if (versao || Date.now() - ultimaVersao >= VERSAO_MIN * 60000) {
        await Filesystem.writeFile({ path: `${VERSOES}/${nomeVersao()}`, data: texto, directory, encoding: Encoding.UTF8, recursive: true })
        ultimaVersao = Date.now()
        await podar(directory)
      }
      return onde
    } catch {
      /* tenta a próxima pasta */
    }
  }
  return null
}

/** Nomes das versões a apagar: além das `max` mais recentes (o nome ordena pela data). */
export const excedentes = (nomes: string[], max = MAX_VERSOES) =>
  nomes.filter((n) => /^observacao-\d{4}-\d{2}-\d{2}_\d{4}\.json$/.test(n)).sort().reverse().slice(max)

async function podar(directory: import('@capacitor/filesystem').Directory) {
  const { Filesystem } = await fs()
  const { files } = await Filesystem.readdir({ path: VERSOES, directory })
  for (const n of excedentes(files.map((f) => f.name))) await Filesystem.deleteFile({ path: `${VERSOES}/${n}`, directory })
}

/** Versões guardadas, da mais recente para a mais antiga (vazio fora do celular). */
export async function listarVersoes(): Promise<string[]> {
  if (!Capacitor.isNativePlatform()) return []
  const { Filesystem, Directory } = await fs()
  for (const directory of [Directory.Documents, Directory.External]) {
    try {
      const { files } = await Filesystem.readdir({ path: VERSOES, directory })
      return files.map((f) => f.name).filter((n) => n.endsWith('.json')).sort().reverse()
    } catch {
      /* tenta a próxima pasta */
    }
  }
  return []
}

export async function lerVersao(nome: string): Promise<Partial<Estado> | null> {
  const { Filesystem, Directory, Encoding } = await fs()
  for (const directory of [Directory.Documents, Directory.External]) {
    try {
      const { data } = await Filesystem.readFile({ path: `${VERSOES}/${nome}`, directory, encoding: Encoding.UTF8 })
      return lerBackup(String(data))
    } catch {
      /* tenta a próxima pasta */
    }
  }
  return null
}

/** "observacao-2026-10-18_2140.json" → "18/10 21:40" */
export function rotuloVersao(nome: string): string {
  const m = /(\d{4})-(\d{2})-(\d{2})_(\d{2})(\d{2})/.exec(nome)
  return m ? `${m[3]}/${m[2]} ${m[4]}:${m[5]}` : nome
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
