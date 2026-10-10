import { useEffect, useRef, useState } from 'react'
import { CameraIcon, TrashIcon } from '@heroicons/react/24/outline'
import { useLoja } from '../../store'
import { Fab, Folha, Opcao, areaTexto } from '../../ui/comum'
import { Ajuda } from '../../ui/Ajuda'
import { agoraHora, novoId, visitaAtiva, type Foto, type Unidade } from '../../domain/model'
import { apagarFoto, salvarFoto, urlDaFoto } from '../../storage/fotos'

export const CATEGORIAS_FOTO = ['Cardápio', 'Estante', 'Salão', 'Mesa', 'Outro']

/** Abre a câmera do Android (input com capture) e devolve o arquivo. */
export function useCamera(onFoto: (f: File) => void) {
  const ref = useRef<HTMLInputElement>(null)
  const input = (
    <input
      ref={ref}
      type="file"
      accept="image/*"
      capture="environment"
      hidden
      onChange={(e) => {
        const f = e.target.files?.[0]
        e.target.value = ''
        if (f) onFoto(f)
      }}
    />
  )
  return { abrir: () => ref.current?.click(), input }
}

/** Fotos de apoio (cardápio, estante, salão), sem pessoas; o texto sai depois por OCR no pipeline. */
export function SecaoFotos({ unidade }: { unidade: Unidade }) {
  const { estado, mudar } = useLoja()
  const [categoria, setCategoria] = useState(CATEGORIAS_FOTO[0])
  const [salvando, setSalvando] = useState(false)
  const [aberta, setAberta] = useState<Foto | null>(null)
  const fotos = estado.fotos.filter((f) => f.unidadeId === unidade.id && f.categoria !== 'Medida').sort((a, b) => b.id.localeCompare(a.id))

  const cam = useCamera(async (arq) => {
    setSalvando(true)
    try {
      const id = novoId()
      const { arquivo, miniatura } = await salvarFoto(arq, id)
      const v = visitaAtiva(useLoja.getState().estado, unidade.id)
      mudar((e) => ({ ...e, fotos: [...e.fotos, { id, unidadeId: unidade.id, visitaId: v?.id ?? null, categoria, hora: agoraHora(), arquivo, miniatura, nota: '' }] }))
    } catch (err) {
      alert(err instanceof Error ? err.message : String(err))
    } finally {
      setSalvando(false)
    }
  })

  return (
    <div>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {CATEGORIAS_FOTO.map((c) => (
          <Opcao key={c} ativo={categoria === c} onClick={() => setCategoria(c)}>
            {c}
          </Opcao>
        ))}
        <Ajuda rotulo="Sobre as fotos">Enquadre sem pessoas. Cardápio: de frente, com luz e o texto ocupando a foto — o texto sai depois por OCR no pipeline (ocr_fotos.py).</Ajuda>
      </div>
      <Fab onClick={cam.abrir} desligado={salvando} rotulo={`Fotografar ${categoria.toLowerCase()}`}>
        <CameraIcon className={`size-8 ${salvando ? 'animate-pulse' : ''}`} />
      </Fab>
      {cam.input}

      <div className="mt-4 grid grid-cols-3 gap-2">
        {fotos.map((f) => (
          <button key={f.id} onClick={() => setAberta(f)} className="relative aspect-square overflow-hidden rounded-lg bg-neutro-200">
            <img src={f.miniatura} alt={f.categoria} className="size-full object-cover" />
            <span className="absolute inset-x-0 bottom-0 bg-escuro/50 px-1 text-[11px] text-sobre">
              {f.categoria} · {f.hora}
            </span>
          </button>
        ))}
      </div>

      {aberta && (
        <VerFoto
          foto={estado.fotos.find((f) => f.id === aberta.id) ?? aberta}
          onFechar={() => setAberta(null)}
          onNota={(nota) => mudar((e) => ({ ...e, fotos: e.fotos.map((f) => (f.id === aberta.id ? { ...f, nota } : f)) }))}
          onApagar={() => {
            if (!confirm('Apagar esta foto?')) return
            void apagarFoto(aberta.arquivo)
            mudar((e) => ({ ...e, fotos: e.fotos.filter((f) => f.id !== aberta.id) }))
            setAberta(null)
          }}
        />
      )}
    </div>
  )
}

export function ImagemFoto({ arquivo, className }: { arquivo: string; className?: string }) {
  const [src, setSrc] = useState('')
  useEffect(() => {
    void urlDaFoto(arquivo).then(setSrc)
  }, [arquivo])
  return src ? <img src={src} alt="" className={className} /> : <div className={`${className} bg-neutro-200`} />
}

function VerFoto({ foto, onFechar, onNota, onApagar }: { foto: Foto; onFechar: () => void; onNota: (n: string) => void; onApagar: () => void }) {
  return (
    <Folha titulo={`${foto.categoria} · ${foto.hora}`} onFechar={onFechar}>
      <ImagemFoto arquivo={foto.arquivo} className="w-full rounded-lg" />
      <textarea value={foto.nota} onChange={(e) => onNota(e.target.value)} placeholder="Nota…" rows={2} className={`mt-3 ${areaTexto}`} />
      <button onClick={onApagar} aria-label="Apagar foto" title="Apagar foto" className="mt-2 grid size-10 place-items-center rounded-full text-erro-600">
        <TrashIcon className="size-6" />
      </button>
    </Folha>
  )
}
