import { Capacitor } from '@capacitor/core'
import type { Estado } from '../domain/model'

/** Guarda o estado inteiro como um documento JSON: SQLite no Android, localStorage no navegador. */
export type Repo = { carregar(): Promise<Partial<Estado> | null>; salvar(e: Estado): Promise<void> }

const CHAVE = 'observacao-luderia:estado'

function repoLocal(): Repo {
  return {
    async carregar() {
      try {
        const s = localStorage.getItem(CHAVE)
        return s ? (JSON.parse(s) as Partial<Estado>) : null
      } catch {
        return null
      }
    },
    async salvar(e) {
      try {
        localStorage.setItem(CHAVE, JSON.stringify(e))
      } catch {
        /* sem armazenamento: o estado fica só na memória */
      }
    },
  }
}

async function repoSqlite(): Promise<Repo> {
  const { CapacitorSQLite, SQLiteConnection } = await import('@capacitor-community/sqlite')
  const conn = new SQLiteConnection(CapacitorSQLite)
  const db = await conn.createConnection('observacao', false, 'no-encryption', 1, false)
  await db.open()
  await db.execute('CREATE TABLE IF NOT EXISTS estado (id INTEGER PRIMARY KEY CHECK (id = 1), json TEXT NOT NULL)')
  return {
    async carregar() {
      const v = (await db.query('SELECT json FROM estado WHERE id = 1')).values?.[0] as { json?: string } | undefined
      return v?.json ? (JSON.parse(v.json) as Partial<Estado>) : null
    },
    async salvar(e) {
      await db.run('INSERT OR REPLACE INTO estado (id, json) VALUES (1, ?)', [JSON.stringify(e)])
    },
  }
}

export async function abrirRepo(): Promise<Repo> {
  if (Capacitor.isNativePlatform()) {
    try {
      return await repoSqlite()
    } catch (e) {
      console.error('SQLite indisponível', e)
    }
  }
  return repoLocal()
}
