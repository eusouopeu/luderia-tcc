import { useState, type ReactNode } from 'react'
import {
  CalendarIcon,
  ChevronLeftIcon,
  ClockIcon,
  ListBulletIcon,
  MinusIcon,
  PencilIcon,
  PlusIcon,
  PuzzlePieceIcon,
  UserGroupIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { BoloIcon } from '../ui/icones'
import { agoraHora, dataBr, dataIso, mascaraData, permanenciaMin, type Registro } from '../domain/model'

type Rascunho = Omit<Registro, 'data'> & { dataTexto: string }

/** Formulário de um grupo numa mesa (mockups "Mesa 1"): edição e resumo depois da saída. */
export function FormMesa({
  titulo,
  registro,
  onFechar,
  onSalvar,
  onApagar,
}: {
  titulo: string
  registro: Registro
  onFechar: () => void
  onSalvar: (r: Registro) => void
  onApagar?: () => void
}) {
  const [r, setR] = useState<Rascunho>({ ...registro, dataTexto: dataBr(registro.data) })
  const [modo, setModo] = useState<'editar' | 'resumo'>(registro.saida ? 'resumo' : 'editar')
  const [erro, setErro] = useState('')
  const muda = (p: Partial<Rascunho>) => {
    setR((x) => ({ ...x, ...p }))
    setErro('')
  }

  function salvar() {
    const data = dataIso(r.dataTexto)
    if (!data) return setErro('Data incompleta ou inválida (dd/mm/aaaa).')
    if (!/^\d{2}:\d{2}$/.test(r.entrada)) return setErro('Preencha a hora de entrada.')
    if (r.saida && permanenciaMin(r.entrada, r.saida) === null) return setErro('A saída está antes da entrada.')
    const { dataTexto: _, ...resto } = r
    onSalvar({ ...resto, data })
  }

  return (
    <div className="fixed inset-0 z-20 overflow-y-auto bg-white safe-top safe-bottom">
      <div className="relative mx-auto my-12 w-full max-w-[440px] px-8">
        {/* cadeiras em volta do formulário */}
        <span className="absolute left-1/2 top-[-40px] size-20 -translate-x-1/2 rounded-full bg-orange-800" />
        <span className="absolute bottom-[-44px] left-1/2 size-20 -translate-x-1/2 rounded-full bg-orange-800" />
        <span className="absolute left-0 top-[25%] size-16 rounded-full bg-orange-800" />
        <span className="absolute left-0 top-[62%] size-16 rounded-full bg-orange-800" />
        <span className="absolute right-0 top-[25%] size-16 rounded-full bg-orange-800" />
        <span className="absolute right-0 top-[62%] size-16 rounded-full bg-orange-800" />

        <div className="relative rounded-2xl bg-orange-200 px-4 pb-5 pt-3 text-slate-800">
          <div className="mb-4 flex items-center">
            <button onClick={onFechar} className="-ml-1 p-2" aria-label="Voltar">
              <ChevronLeftIcon className="size-6" />
            </button>
            <h1 className="flex-1 text-center text-xl font-extrabold uppercase">{titulo}</h1>
            {modo === 'resumo' ? (
              <button onClick={() => setModo('editar')} className="p-2" aria-label="Editar">
                <PencilIcon className="size-5" />
              </button>
            ) : (
              <span className="w-10" />
            )}
          </div>

          {modo === 'editar' ? <Edicao r={r} muda={muda} onSaida={() => (muda({ saida: agoraHora() }), setModo('resumo'))} /> : <Resumo r={r} />}

          <Rotulo icone={<ListBulletIcon className="size-5" />}>Notas</Rotulo>
          <textarea
            value={r.notas}
            onChange={(e) => muda({ notas: e.target.value })}
            placeholder="Anotações..."
            rows={4}
            className="w-full resize-none rounded-lg border border-slate-300 bg-white p-2.5 text-[15px] outline-none placeholder:text-slate-400 focus:border-orange-500"
          />

          {erro && <p className="mt-3 text-sm font-semibold text-rose-600">{erro}</p>}

          <div className="mt-5 grid grid-cols-2 gap-3">
            <button onClick={onFechar} className="h-10 rounded bg-orange-300 font-bold text-orange-600">
              Cancelar
            </button>
            <button onClick={salvar} className="h-10 rounded bg-orange-600 font-bold text-white">
              Salvar
            </button>
          </div>
          {onApagar && (
            <button onClick={onApagar} className="mx-auto mt-4 block text-sm font-semibold text-rose-600 underline">
              Apagar este registro
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function Rotulo({ icone, children }: { icone: ReactNode; children: ReactNode }) {
  return (
    <div className="mb-1.5 mt-4 flex items-center gap-1.5 text-[13px] font-extrabold uppercase first:mt-0">
      {icone}
      {children}
    </div>
  )
}

const campo = 'h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-[17px] outline-none focus:border-orange-500'

function Edicao({ r, muda, onSaida }: { r: Rascunho; muda: (p: Partial<Rascunho>) => void; onSaida: () => void }) {
  return (
    <>
      <Rotulo icone={<CalendarIcon className="size-5" />}>Data</Rotulo>
      <div className="flex items-center gap-4">
        <input
          value={r.dataTexto}
          onChange={(e) => muda({ dataTexto: mascaraData(e.target.value) })}
          inputMode="numeric"
          placeholder="__ / __ / ____"
          className={`${campo} flex-1`}
        />
        <button
          onClick={() => muda({ aniversario: !r.aniversario })}
          aria-pressed={r.aniversario}
          aria-label="Aniversário"
          className={`grid size-11 shrink-0 place-items-center rounded-lg ${r.aniversario ? 'bg-orange-400 text-orange-800' : 'text-slate-700'}`}
        >
          <BoloIcon className="size-7" />
        </button>
      </div>

      <Rotulo icone={<ClockIcon className="size-5" />}>Entrada</Rotulo>
      <div className="flex items-center gap-4">
        <input type="time" value={r.entrada} onChange={(e) => muda({ entrada: e.target.value })} className={`${campo} flex-1`} />
        {r.saida === null ? (
          <button onClick={onSaida} className="grid size-14 shrink-0 place-items-center rounded-full bg-rose-300 text-sm font-extrabold text-rose-600">
            SAÍDA
          </button>
        ) : (
          <div className="relative w-28 shrink-0">
            <span className="absolute -top-5 left-0 text-[13px] font-extrabold">SAÍDA</span>
            <input type="time" value={r.saida} onChange={(e) => muda({ saida: e.target.value })} className={campo} />
            <button onClick={() => muda({ saida: null })} className="absolute -right-2 -top-2 rounded-full bg-white p-0.5 shadow" aria-label="Desfazer saída">
              <XMarkIcon className="size-4" />
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Rotulo icone={<UserGroupIcon className="size-5" />}>Pessoas</Rotulo>
          <Contador valor={r.pessoas} onChange={(v) => muda({ pessoas: v })} />
        </div>
        <div>
          <Rotulo icone={<UserGroupIcon className="size-5" />}>Crianças</Rotulo>
          <Contador valor={r.criancas} onChange={(v) => muda({ criancas: v })} />
        </div>
      </div>

      <Rotulo icone={<PuzzlePieceIcon className="size-5" />}>Instrutor na mesa</Rotulo>
      <div className="flex h-11 overflow-hidden rounded-lg">
        <button onClick={() => muda({ instrutor: Math.max(0, r.instrutor - 1) })} className="grid w-12 place-items-center bg-rose-500 text-white" aria-label="Menos">
          <MinusIcon className="size-6 stroke-[3]" />
        </button>
        <span className="grid flex-1 place-items-center bg-white text-2xl font-extrabold">
          <span>
            {r.instrutor}
            <span className="text-lg">x</span>
          </span>
        </span>
        <button onClick={() => muda({ instrutor: r.instrutor + 1 })} className="grid w-12 place-items-center bg-emerald-600 text-white" aria-label="Mais">
          <PlusIcon className="size-6 stroke-[3]" />
        </button>
      </div>
    </>
  )
}

function Contador({ valor, onChange }: { valor: number; onChange: (v: number) => void }) {
  return (
    <div className="overflow-hidden rounded-lg">
      <div className="grid h-[72px] place-items-center bg-white text-3xl font-extrabold">{valor}</div>
      <div className="grid h-12 grid-cols-2">
        <button onClick={() => onChange(Math.max(0, valor - 1))} className="grid place-items-center bg-rose-500 text-white" aria-label="Menos">
          <MinusIcon className="size-6 stroke-[3]" />
        </button>
        <button onClick={() => onChange(valor + 1)} className="grid place-items-center bg-emerald-600 text-white" aria-label="Mais">
          <PlusIcon className="size-6 stroke-[3]" />
        </button>
      </div>
    </div>
  )
}

function Valor({ icone, rotulo, children }: { icone: ReactNode; rotulo: string; children: ReactNode }) {
  return (
    <div>
      <Rotulo icone={icone}>{rotulo}</Rotulo>
      <div className="whitespace-nowrap pl-2.5 text-2xl font-bold text-orange-600">{children}</div>
    </div>
  )
}

function Resumo({ r }: { r: Rascunho }) {
  const p = permanenciaMin(r.entrada, r.saida)
  return (
    <div className="space-y-1">
      <div className="flex flex-wrap items-start justify-between gap-x-2">
        <Valor icone={<CalendarIcon className="size-5" />} rotulo="Data">
          {r.dataTexto.replace(/\//g, ' / ') || '—'}
        </Valor>
        {r.aniversario && (
          <span className="mt-2 flex items-center gap-2 rounded-lg bg-orange-400 px-3 py-2 text-base text-orange-800">
            <BoloIcon className="size-6" />
            Aniversário
          </span>
        )}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Valor icone={<ClockIcon className="size-5" />} rotulo="Entrada">
          {r.entrada || '—'}
        </Valor>
        <Valor icone={<ClockIcon className="size-5" />} rotulo="Saída">
          {r.saida ?? '—'}
        </Valor>
        <Valor icone={<UserGroupIcon className="size-5" />} rotulo="Pessoas">
          {r.pessoas}
        </Valor>
        <Valor icone={<UserGroupIcon className="size-5" />} rotulo="Crianças">
          {r.criancas}
        </Valor>
        <Valor icone={<PuzzlePieceIcon className="size-5" />} rotulo="Instrutor na mesa">
          {r.instrutor}
          <span className="text-lg">x</span>
        </Valor>
        {p !== null && (
          <Valor icone={<ClockIcon className="size-5" />} rotulo="Permanência">
            {Math.floor(p / 60)}h{String(p % 60).padStart(2, '0')}
          </Valor>
        )}
      </div>
    </div>
  )
}
