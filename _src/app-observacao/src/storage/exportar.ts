import { Capacitor } from '@capacitor/core'

type Arquivo = { nome: string; conteudo: string }

/** Compartilha arquivos pelo menu do Android (de uma vez); no navegador, baixa um a um. */
export async function compartilhar(arquivos: Arquivo[], titulo = 'Observação Luderia') {
  if (Capacitor.isNativePlatform()) {
    const { Filesystem, Directory, Encoding } = await import('@capacitor/filesystem')
    const { Share } = await import('@capacitor/share')
    const uris: string[] = []
    for (const a of arquivos) {
      const f = await Filesystem.writeFile({ path: `export/${a.nome}`, data: a.conteudo, directory: Directory.Cache, encoding: Encoding.UTF8, recursive: true })
      uris.push(f.uri)
    }
    await Share.share({ title: titulo, files: uris })
    return
  }
  for (const a of arquivos) {
    const url = URL.createObjectURL(new Blob([a.conteudo], { type: a.nome.endsWith('.json') ? 'application/json' : 'text/csv;charset=utf-8' }))
    const el = document.createElement('a')
    el.href = url
    el.download = a.nome
    el.click()
    URL.revokeObjectURL(url)
  }
}
