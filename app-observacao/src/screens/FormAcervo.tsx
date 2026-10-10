import { useState, type ReactNode } from 'react'
import { ChevronLeftIcon, CircleStackIcon, ListBulletIcon, PlusIcon, PuzzlePieceIcon, UserIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { Chip, ContadorH } from '../ui/comum'
import { SeletorJogos } from '../ui/SeletorJogos'
import type { Acervo } from '../domain/model'

/** Acervo de jogos (mockup laranja): capacidade da estante, equipe e jogos vistos. */
export function FormAcervo({ acervo, onFechar, onSalvar }: { acervo: Acervo; onFechar: () => void; onSalvar: (a: Acervo) => void }) {
  const [a, setA] = useState(acervo)
  const [escolher, setEscolher] = useState(false)
  const muda = (p: Partial<Acervo>) => setA((x) => ({ ...x, ...p }))
  const total = a.estantes * a.prateleiras * a.caixas

  return (
    <div className="fixed inset-0 z-20 overflow-y-auto bg-papel safe-top safe-bottom">
      <div className="mx-auto my-6 w-full max-w-[440px] px-4">
        <div className="rounded-2xl bg-caneta-400 px-4 pb-5 pt-3 text-sobre">
          <div className="mb-4 flex items-center">
            <button onClick={onFechar} className="-ml-1 p-2 text-neutro-900" aria-label="Voltar">
              <ChevronLeftIcon className="size-6" />
            </button>
            <h1 className="flex-1 pr-8 text-center text-xl font-extrabold uppercase">Acervo de jogos</h1>
          </div>

          <Linha rotulo={<>Estantes<br />(horizontal)</>}>
            <ContadorH suave valor={a.estantes} onChange={(v) => muda({ estantes: v })} />
          </Linha>
          <Vezes />
          <Linha rotulo={<>Prateleiras por<br />estante (vertical)</>}>
            <ContadorH suave valor={a.prateleiras} onChange={(v) => muda({ prateleiras: v })} />
          </Linha>
          <Vezes />
          <Linha rotulo={<>Caixas por prateleira<br />(horizontal)</>}>
            <ContadorH suave valor={a.caixas} onChange={(v) => muda({ caixas: v })} />
          </Linha>

          <div className="mt-4 flex items-center border-t border-caneta-800/25 pt-3 text-xl font-extrabold">
            <CircleStackIcon className="mr-2 size-7 text-neutro-900" />
            <span className="flex-1">TOTAL</span>
            <span className="w-[150px] text-center">{total}</span>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 rounded-xl bg-caneta-300/50 p-3">
            <Equipe icone={<PuzzlePieceIcon className="size-5 text-neutro-900" />} rotulo="Instrutores" valor={a.instrutores} onChange={(v) => muda({ instrutores: v })} />
            <Equipe icone={<UserIcon className="size-5 text-neutro-900" />} rotulo="Atendentes" valor={a.atendentes} onChange={(v) => muda({ atendentes: v })} />
          </div>

          <div className="mb-1.5 mt-5 flex items-center gap-1.5 text-[13px] font-extrabold uppercase text-neutro-900">
            <ListBulletIcon className="size-5" />
            Jogos ({a.jogos.length})
          </div>
          <div onClick={() => setEscolher(true)} className="min-h-64 cursor-pointer rounded-xl bg-papel p-3">
            <div className="flex flex-wrap gap-2">
              {a.jogos.map((j) => (
                <span key={j} onClick={(e) => e.stopPropagation()}>
                  <Chip onClick={() => muda({ jogos: a.jogos.filter((x) => x !== j) })}>
                    {j} <XMarkIcon className="-mr-1 inline size-3.5" />
                  </Chip>
                </span>
              ))}
              {!a.jogos.length && <PlusIcon className="mx-auto mt-24 size-10 text-neutro-300" aria-label="Marcar jogos" />}
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <button onClick={onFechar} className="h-11 rounded bg-caneta-300 font-bold text-caneta-700">
              Descartar
            </button>
            <button onClick={() => onSalvar(a)} className="h-11 rounded bg-caneta-700 font-bold text-sobre">
              Salvar
            </button>
          </div>
        </div>
      </div>
      {escolher && <SeletorJogos titulo="Jogos do acervo" selecionados={a.jogos} onFechar={() => setEscolher(false)} onMudar={(jogos) => muda({ jogos })} />}
    </div>
  )
}

function Linha({ rotulo, children }: { rotulo: ReactNode; children: ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex-1 text-[13px] font-extrabold uppercase leading-snug">{rotulo}</span>
      <div className="w-[150px]">{children}</div>
    </div>
  )
}

const Vezes = () => (
  <div className="flex justify-end">
    <XMarkIcon className="my-1 mr-[57px] size-9 stroke-[2.5] text-neutro-900" />
  </div>
)

function Equipe({ icone, rotulo, valor, onChange }: { icone: ReactNode; rotulo: string; valor: number; onChange: (v: number) => void }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-[13px] font-extrabold uppercase">
        {icone}
        {rotulo}
      </div>
      <div className="mt-1 flex items-center gap-3 pl-2">
        <button onClick={() => onChange(Math.max(0, valor - 1))} className="size-7 rounded bg-caneta-300 font-bold text-caneta-800" aria-label={`Menos ${rotulo}`}>
          −
        </button>
        <span className="text-2xl font-extrabold text-caneta-800">{valor}</span>
        <button onClick={() => onChange(valor + 1)} className="size-7 rounded bg-caneta-300 font-bold text-caneta-800" aria-label={`Mais ${rotulo}`}>
          +
        </button>
      </div>
    </div>
  )
}
