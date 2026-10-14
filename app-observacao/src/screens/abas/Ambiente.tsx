import { useState } from 'react'
import type { Unidade } from '../../domain/model'
import { AbaAcustica } from './Acustica'
import { SecaoMedidas } from './Medidas'
import { SecaoFotos } from './Fotos'

type Sub = 'acustica' | 'medidas' | 'fotos'
const SUBS: [Sub, string][] = [
  ['acustica', 'Acústica'],
  ['medidas', 'Medidas'],
  ['fotos', 'Fotos'],
]

/** Aba de sensores: som (microfone), medidas e fotos (câmera). */
export function AbaAmbiente({ unidade, semVisita }: { unidade: Unidade; semVisita: () => boolean }) {
  const [sub, setSub] = useState<Sub>('acustica')
  return (
    <div className="px-4 pb-28">
      <div className="mt-4 flex justify-center gap-1" role="tablist">
        {SUBS.map(([id, nome]) => (
          <button
            key={id}
            role="tab"
            aria-selected={sub === id}
            onClick={() => setSub(id)}
            className={`rounded-full px-4 py-1.5 text-sm font-bold ${sub === id ? 'bg-caneta-100 text-caneta-700' : 'text-neutro-500'}`}
          >
            {nome}
          </button>
        ))}
      </div>
      {sub === 'acustica' && <AbaAcustica unidade={unidade} semVisita={semVisita} />}
      {sub === 'medidas' && <SecaoMedidas unidade={unidade} />}
      {sub === 'fotos' && <SecaoFotos unidade={unidade} />}
    </div>
  )
}
