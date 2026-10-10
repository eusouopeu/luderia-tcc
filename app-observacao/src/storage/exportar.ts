import { Capacitor } from '@capacitor/core'

/** Compartilha um CSV pelo menu do Android; no navegador, baixa o arquivo. */
export async function compartilharCsv(nome: string, conteudo: string) {
  if (Capacitor.isNativePlatform()) {
    const { Filesystem, Directory, Encoding } = await import('@capacitor/filesystem')
    const { Share } = await import('@capacitor/share')
    const f = await Filesystem.writeFile({ path: nome, data: conteudo, directory: Directory.Cache, encoding: Encoding.UTF8 })
    await Share.share({ title: nome, files: [f.uri] })
    return
  }
  const url = URL.createObjectURL(new Blob([conteudo], { type: 'text/csv;charset=utf-8' }))
  const a = document.createElement('a')
  a.href = url
  a.download = nome
  a.click()
  URL.revokeObjectURL(url)
}
