import { useState, type ReactNode } from 'react'
import { ChevronLeftIcon, CircleStackIcon, ListBulletIcon, PlusIcon, PuzzlePieceIcon, UserIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { Chip, ContadorH } from '../ui/comum'
import { SeletorJogos } from '../ui/SeletorJogos'
import type { Acervo } from '../domain/model'
import { useVoltar } from '../ui/voltar'
import { avisar } from '../ui/aviso'

/** Acervo de jogos (mockup laranja): capacidade da estante, equipe e jogos vistos. */
export function FormAcervo({ acervo, onFechar, onMudar }: { acervo: Acervo; onFechar: () => void; onMudar: (a: Acervo) => void }) {
  // grava a cada mudança: sair pelo botão ou pelo voltar do Android não perde nada
  const [inicial] = useState(acervo)
  const a = acervo
  const [escolher, setEscolher] = useState(false)
  const muda = (p: Partial<Acervo>) => onMudar({ ...a, ...p })
  useVoltar(onFechar)
  const total = a.estantes * a.prateleiras * a.caixas

  return (
    <div className="fixed inset-0 z-20 overflow-y-auto bg-papel safe-top safe-bottom">
      <div className="mx-auto my-6 w-full max-w-[440px] px-4">
        <div className="rounded-2xl bg-caneta-400 px-4 pb-5 pt-3 text-sobre">
          <div className="mb-4 flex items-center">
            <button onClick={onFechar} className="-ml-1 p-2 text-neutro-900" aria-label="Voltar">
              <ChevronLeftIcon className="size-6" />
            </button>
            <h1 className="flex-1 pr-8 text-center text-xl font-extrabold uppercase text-neutro-900">Acervo de jogos</h1>
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

          <div className="mt-4 flex items-center border-t border-caneta-800/25 pt-3 text-xl font-extrabold text-neutro-900">
            <CircleStackIcon className="mr-2 size-7 text-neutro-900" />
            <span className="flex-1">TOTAL</span>
            <span className="w-[150px] text-center">{total}</span>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 rounded-xl bg-caneta-300/50 p-3">
            <Equipe icone={<PuzzlePieceIcon className="size-5 text-neutro-900" />} rotulo="Instrutores" valor={a.instrutores} onChange={(v) => muda({ instrutores: v })} />
            <Equipe icone={<UserIcon className="size-5 text-neutro-900" />} rotulo="Atendentes" valor={a.atendentes} onChange={(v) => muda({ atendentes: v })} />
          </div>

          <div className="mb-1.5 mt-5 flex items-center gap-1.5 text-sm font-bold uppercase text-neutro-900">
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
            <button
              onClick={() => {
                onMudar(inicial)
                onFechar()
                avisar('Acervo voltou ao que era.')
              }}
              className="h-11 rounded bg-caneta-300 font-bold text-caneta-800"
            >
              Desfazer
            </button>
            <button onClick={onFechar} className="h-11 rounded bg-caneta-700 font-bold text-sobre">
              Pronto
            </button>
          </div>
          <p className="mt-2 text-center text-xs font-semibold text-caneta-900">Salvo automaticamente</p>
        </div>
      </div>
      {escolher && <SeletorJogos titulo="Jogos do acervo" selecionados={a.jogos} onFechar={() => setEscolher(false)} onMudar={(jogos) => muda({ jogos })} />}
    </div>
  )
}

function Linha({ rotulo, children }: { rotulo: ReactNode; children: ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex-1 text-sm font-bold uppercase leading-snug text-neutro-900">{rotulo}</span>
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
      <div className="mb-1.5 flex items-center gap-1.5 text-sm font-bold uppercase text-neutro-900">
        {icone}
        {rotulo}
      </div>
      <ContadorH suave altura="h-10" valor={valor} onChange={onChange} />
    </div>
  )
}
