import { Capacitor } from '@capacitor/core'

/*
 * Fotos de apoio: reduzidas a 2000 px (JPEG 85%) e gravadas em
 * Documentos/ObservacaoLuderia/fotos, que sobrevive a desinstalar o app; sem
 * acesso a Documentos, vão para a pasta externa do app. `arquivo` guarda
 * "PASTA:caminho". No navegador (desenvolvimento) a foto fica como data URL.
 */
const DIR = 'ObservacaoLuderia/fotos'

async function reduzir(arq: Blob, lado: number, qualidade: number): Promise<{ blob: Blob; largura: number; altura: number }> {
  const img = await createImageBitmap(arq)
  const k = Math.min(1, lado / Math.max(img.width, img.height))
  const c = document.createElement('canvas')
  c.width = Math.round(img.width * k)
  c.height = Math.round(img.height * k)
  c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height)
  const blob = await new Promise<Blob>((ok, erro) => c.toBlob((b) => (b ? ok(b) : erro(new Error('falha ao converter'))), 'image/jpeg', qualidade))
  return { blob, largura: c.width, altura: c.height }
}

const paraDataUrl = (b: Blob) =>
  new Promise<string>((ok) => {
    const r = new FileReader()
    r.onload = () => ok(String(r.result))
    r.readAsDataURL(b)
  })

/** Grava a foto e devolve onde ficou e uma miniatura (160 px) para a lista. */
export async function salvarFoto(arq: Blob, id: string): Promise<{ arquivo: string; miniatura: string }> {
  const [grande, mini] = await Promise.all([reduzir(arq, 2000, 0.85), reduzir(arq, 160, 0.6)])
  const miniatura = await paraDataUrl(mini.blob)
  const dataUrl = await paraDataUrl(grande.blob)
  if (!Capacitor.isNativePlatform()) return { arquivo: dataUrl, miniatura }
  const { Filesystem, Directory } = await import('@capacitor/filesystem')
  const data = dataUrl.split(',')[1]
  const path = `${DIR}/${id}.jpg`
  for (const [nome, directory] of [
    ['DOCUMENTS', Directory.Documents],
    ['EXTERNAL', Directory.External],
  ] as const) {
    try {
      await Filesystem.writeFile({ path, data, directory, recursive: true })
      return { arquivo: `${nome}:${path}`, miniatura }
    } catch {
      /* tenta a próxima pasta */
    }
  }
  throw new Error('Não consegui gravar a foto no celular.')
}

async function local(arquivo: string) {
  const { Filesystem, Directory } = await import('@capacitor/filesystem')
  const [pasta, path] = arquivo.split(':') as ['DOCUMENTS' | 'EXTERNAL', string]
  return { Filesystem, path, directory: pasta === 'DOCUMENTS' ? Directory.Documents : Directory.External }
}

/** Endereço que o <img> consegue abrir. */
export async function urlDaFoto(arquivo: string): Promise<string> {
  if (arquivo.startsWith('data:')) return arquivo
  const { Filesystem, path, directory } = await local(arquivo)
  const { uri } = await Filesystem.getUri({ path, directory })
  return Capacitor.convertFileSrc(uri)
}

/** URI de arquivo, para compartilhar. */
export async function uriDaFoto(arquivo: string): Promise<string | null> {
  if (arquivo.startsWith('data:')) return null
  const { Filesystem, path, directory } = await local(arquivo)
  return (await Filesystem.getUri({ path, directory })).uri
}

export async function apagarFoto(arquivo: string) {
  if (arquivo.startsWith('data:')) return
  try {
    const { Filesystem, path, directory } = await local(arquivo)
    await Filesystem.deleteFile({ path, directory })
  } catch {
    /* arquivo já não existe */
  }
}
