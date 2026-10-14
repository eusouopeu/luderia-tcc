import { useEffect, useRef, useState, type PointerEvent } from 'react'
import { CameraIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { useLoja } from '../../store'
import { agoraHora, novoId, visitaAtiva, type Unidade } from '../../domain/model'
import { medirCm, REFERENCIAS, ROTULOS_MEDIDA, type Ponto } from '../../domain/medida'
import { apagarFoto, salvarFoto, urlDaFoto } from '../../storage/fotos'
import { useCamera } from './Fotos'
import { Fab } from '../../ui/comum'
import { Ajuda } from '../../ui/Ajuda'

const cm = (x: number) => `${String(x).replace('.', ',')} cm`

/** Medidas pela câmera: foto com um objeto de tamanho conhecido no mesmo plano. */
export function SecaoMedidas({ unidade }: { unidade: Unidade }) {
  const { estado, mudar } = useLoja()
  const [foto, setFoto] = useState<{ id: string; arquivo: string; miniatura: string } | null>(null)
  const [gravando, setGravando] = useState(false)
  const medidas = estado.medidas.filter((m) => m.unidadeId === unidade.id).sort((a, b) => b.id.localeCompare(a.id))

  const cam = useCamera(async (arq) => {
    setGravando(true)
    try {
      const id = novoId()
      setFoto({ id, ...(await salvarFoto(arq, id)) })
    } catch (err) {
      alert(err instanceof Error ? err.message : String(err))
    } finally {
      setGravando(false)
    }
  })

  return (
    <div>
      <div className="mt-4 flex items-center justify-end">
        <Ajuda rotulo="Como medir">
          Encoste um cartão bancário ou uma folha A4 no que vai medir, no mesmo plano, e fotografe de frente, sem inclinar. Depois marque as pontas da referência e do alvo. Erro típico: 3–5%.
        </Ajuda>
      </div>
      <Fab onClick={cam.abrir} desligado={gravando} rotulo="Nova medida">
        <CameraIcon className={`size-8 ${gravando ? 'animate-pulse' : ''}`} />
      </Fab>
      {cam.input}
      <ul className="divide-y divide-neutro-100">
        {medidas.map((m) => (
          <li key={m.id} className="flex items-center gap-3 py-2.5">
            <span className="flex-1">
              <b>{m.rotulo}</b>
              <span className="block text-xs text-neutro-500">
                {m.hora} · ref.: {m.referencia}
              </span>
            </span>
            <b className="text-lg text-caneta-600">{cm(m.cm)}</b>
            <button
              aria-label="Apagar medida"
              onClick={() => {
                if (!confirm('Apagar esta medida e a foto dela?')) return
                const f = estado.fotos.find((x) => x.id === m.fotoId)
                if (f) void apagarFoto(f.arquivo)
                mudar((e) => ({ ...e, medidas: e.medidas.filter((x) => x.id !== m.id), fotos: e.fotos.filter((x) => x.id !== m.fotoId) }))
              }}
            >
              <TrashIcon className="size-5 text-neutro-400" />
            </button>
          </li>
        ))}
      </ul>

      {foto && (
        <Medidor
          arquivo={foto.arquivo}
          onCancelar={() => (void apagarFoto(foto.arquivo), setFoto(null))}
          onSalvar={(rotulo, valor, referencia, refCm) => {
            const v = visitaAtiva(useLoja.getState().estado, unidade.id)
            const hora = agoraHora()
            mudar((e) => ({
              ...e,
              fotos: [...e.fotos, { id: foto.id, unidadeId: unidade.id, visitaId: v?.id ?? null, categoria: 'Medida', hora, arquivo: foto.arquivo, miniatura: foto.miniatura, nota: `${rotulo}: ${cm(valor)}` }],
              medidas: [...e.medidas, { id: novoId(), unidadeId: unidade.id, visitaId: v?.id ?? null, rotulo, cm: valor, referencia, refCm, fotoId: foto.id, hora }],
            }))
            setFoto(null)
          }}
        />
      )}
    </div>
  )
}

/** Tela de marcar pontos: 2 na referência (azul) e 2 no que se mede (laranja); arraste para ajustar. */
function Medidor({ arquivo, onCancelar, onSalvar }: { arquivo: string; onCancelar: () => void; onSalvar: (rotulo: string, cm: number, ref: string, refCm: number) => void }) {
  const [src, setSrc] = useState('')
  const [pts, setPts] = useState<Ponto[]>([])
  const [ref, setRef] = useState(0)
  const [outroCm, setOutroCm] = useState('')
  const [rotulo, setRotulo] = useState(ROTULOS_MEDIDA[0])
  const [dim, setDim] = useState({ w: 1, h: 1 })
  const arrastando = useRef<number | null>(null)
  const caixa = useRef<HTMLDivElement>(null)
  useEffect(() => {
    void urlDaFoto(arquivo).then(setSrc)
  }, [arquivo])

  const refCm = ref < REFERENCIAS.length ? REFERENCIAS[ref].cm : Number(outroCm.replace(',', '.'))
  const refNome = ref < REFERENCIAS.length ? REFERENCIAS[ref].nome : `Outro (${outroCm} cm)`
  const valor = pts.length === 4 ? medirCm([pts[0], pts[1]], refCm, [pts[2], pts[3]]) : null

  /** Ponto do toque em pixels da foto original. */
  const ponto = (e: PointerEvent): Ponto => {
    const r = caixa.current!.getBoundingClientRect()
    return { x: ((e.clientX - r.left) / r.width) * dim.w, y: ((e.clientY - r.top) / r.height) * dim.h }
  }
  const raio = dim.w / 14
  const down = (e: PointerEvent) => {
    const p = ponto(e)
    const i = pts.findIndex((q) => Math.hypot(q.x - p.x, q.y - p.y) < raio)
    if (i >= 0) arrastando.current = i
    else if (pts.length < 4) setPts([...pts, p])
    ;(e.target as Element).setPointerCapture?.(e.pointerId)
  }
  const move = (e: PointerEvent) => {
    if (arrastando.current === null) return
    const p = ponto(e)
    setPts((x) => x.map((q, i) => (i === arrastando.current ? p : q)))
  }
  const passo = pts.length < 2 ? 'Toque nas duas pontas da REFERÊNCIA (branco)' : pts.length < 4 ? 'Agora nas duas pontas do que vai MEDIR (laranja)' : 'Arraste os pontos para ajustar'
  const s = dim.w / 120

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-escuro text-sobre safe-top safe-bottom">
      <div className="flex items-center gap-2 p-3">
        <p className="flex-1 text-sm font-bold">{passo}</p>
        <button onClick={() => setPts([])} className="rounded bg-papel/15 px-2 py-1 text-xs">
          Limpar
        </button>
        <button onClick={onCancelar} aria-label="Cancelar" className="p-1">
          <XMarkIcon className="size-7" />
        </button>
      </div>
      <div className="flex flex-1 items-center justify-center overflow-hidden">
        {src && (
          <div ref={caixa} className="relative max-h-full touch-none" onPointerDown={down} onPointerMove={move} onPointerUp={() => (arrastando.current = null)}>
            <img src={src} alt="" className="max-h-[60dvh] w-full object-contain" onLoad={(e) => setDim({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })} draggable={false} />
            <svg viewBox={`0 0 ${dim.w} ${dim.h}`} className="pointer-events-none absolute inset-0 size-full">
              {[0, 2].map((k) =>
                pts[k + 1] ? (
                  <line key={k} x1={pts[k].x} y1={pts[k].y} x2={pts[k + 1].x} y2={pts[k + 1].y} stroke={k ? 'var(--color-caneta-500)' : 'var(--color-sobre)'} strokeWidth={s} />
                ) : null,
              )}
              {pts.map((p, i) => (
                <circle key={i} cx={p.x} cy={p.y} r={s * 2.5} fill="none" stroke={i < 2 ? 'var(--color-sobre)' : 'var(--color-caneta-500)'} strokeWidth={s} />
              ))}
            </svg>
          </div>
        )}
      </div>
      <div className="space-y-2 bg-papel p-3 text-neutro-900">
        <div className="flex gap-2">
          <select value={ref} onChange={(e) => setRef(Number(e.target.value))} className="h-10 flex-1 rounded-lg border border-neutro-300 px-2 text-sm">
            {REFERENCIAS.map((r, i) => (
              <option key={r.nome} value={i}>
                {r.nome} · {String(r.cm).replace('.', ',')} cm
              </option>
            ))}
            <option value={REFERENCIAS.length}>Outro objeto…</option>
          </select>
          {ref === REFERENCIAS.length && (
            <input value={outroCm} onChange={(e) => setOutroCm(e.target.value)} inputMode="decimal" placeholder="cm" className="h-10 w-20 rounded-lg border border-neutro-300 px-2" />
          )}
        </div>
        <select value={rotulo} onChange={(e) => setRotulo(e.target.value)} className="h-10 w-full rounded-lg border border-neutro-300 px-2 text-sm">
          {ROTULOS_MEDIDA.map((r) => (
            <option key={r}>{r}</option>
          ))}
        </select>
        <button
          disabled={valor === null}
          onClick={() => valor !== null && onSalvar(rotulo, valor, refNome, refCm)}
          className="h-12 w-full rounded-lg bg-caneta-600 font-bold text-sobre disabled:opacity-40"
        >
          {valor === null ? 'Marque os 4 pontos' : `Salvar ${cm(valor)}`}
        </button>
      </div>
    </div>
  )
}
