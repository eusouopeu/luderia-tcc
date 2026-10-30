import { useRef, useState, type ReactNode } from 'react'
import {
  ArrowRightEndOnRectangleIcon,
  BellAlertIcon,
  CalendarIcon,
  ChevronLeftIcon,
  ClockIcon,
  ListBulletIcon,
  ChevronDownIcon,
  PencilIcon,
  TrashIcon,
  PuzzlePieceIcon,
  UserGroupIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { BoloIcon } from '../ui/icones'
import { Chip, ContadorH, ContadorV as Contador, Rotulo, campoClaro as campo } from '../ui/comum'
import { SeletorJogos } from '../ui/SeletorJogos'
import { ListaPedidos } from '../ui/Pedidos'
import { useVoltar } from '../ui/voltar'
import { agoraHora, dataBr, dataIso, mascaraData, permanenciaMin, type Fluxo, type Registro } from '../domain/model'

type Rascunho = Omit<Registro, 'data'> & { dataTexto: string }

/** Jogo visto sem certeza aparece com "?". */
const rotuloJogo = (j: string, incertos: string[]) => (incertos.includes(j) ? `${j} ?` : j)

/** Converte o rascunho em registro; campo inválido fica com o último valor válido. */
function paraRegistro(r: Rascunho, ultimo: Registro): Registro {
  const { dataTexto, ...resto } = r
  const entrada = /^\d{2}:\d{2}$/.test(r.entrada) ? r.entrada : ultimo.entrada
  const saida = r.saida === null ? null : permanenciaMin(entrada, r.saida) === null ? ultimo.saida : r.saida
  return { ...resto, data: dataIso(dataTexto) ?? ultimo.data, entrada, saida }
}

function erroDe(r: Rascunho): string {
  if (!dataIso(r.dataTexto)) return 'Data incompleta ou inválida (dd/mm/aaaa): fica a anterior até corrigir.'
  if (!/^\d{2}:\d{2}$/.test(r.entrada)) return 'Preencha a hora de entrada.'
  if (r.saida && permanenciaMin(r.entrada, r.saida) === null) return 'A saída está antes da entrada (ou mais de 12 h depois, pela meia-noite): fica a anterior até corrigir.'
  return ''
}

/**
 * Formulário de um grupo numa mesa (mockups "Mesa 1"): edição e resumo depois da saída.
 * Cada mudança é gravada na hora (`onMudar`); fechar, pelo botão ou pelo voltar, não perde nada.
 */
export function FormMesa({
  titulo,
  registro,
  onFechar,
  onMudar,
  onDesfazer,
  onApagar,
  acervo = [],
  entradas = [],
  novo = false,
}: {
  titulo: string
  registro: Registro
  acervo?: string[]
  /** entradas da porta que este grupo pode ligar (as já ligadas e as sem destino) */
  entradas?: Fluxo[]
  /** grupo aberto agora: a primeira entrada ligada traz hora e pessoas da porta */
  novo?: boolean
  /** fecha devolvendo o registro como ficou */
  onFechar: (r: Registro) => void
  onMudar: (r: Registro) => void
  /** volta ao registro de quando abriu (ou tira o grupo novo) */
  onDesfazer: () => void
  onApagar?: () => void
}) {
  const [r, setR] = useState<Rascunho>({ ...registro, dataTexto: dataBr(registro.data) })
  const [modo, setModo] = useState<'editar' | 'resumo'>(registro.saida ? 'resumo' : 'editar')
  const [escolher, setEscolher] = useState(false)
  const atual = useRef(r)
  const ultimo = useRef(registro)
  const muda = (p: Partial<Rascunho>) => {
    const prox = { ...atual.current, ...p }
    atual.current = prox
    setR(prox)
    ultimo.current = paraRegistro(prox, ultimo.current)
    onMudar(ultimo.current)
  }
  /** Liga ou solta uma entrada da porta; a aba Fluxo passa a mostrar esta mesa como destino. */
  const alternarPorta = (f: Fluxo) => {
    const atuais = atual.current.fluxos
    if (atuais.includes(f.codigo)) return muda({ fluxos: atuais.filter((c) => c !== f.codigo) })
    if (!atuais.length && novo)
      return muda({ fluxos: [f.codigo], entrada: f.hora, pessoas: f.pessoas, criancas: f.criancas, pessoasEstimado: f.estimado })
    muda({ fluxos: [...atuais, f.codigo], pessoas: atual.current.pessoas + f.pessoas, criancas: atual.current.criancas + f.criancas })
  }
  const fechar = () => onFechar(ultimo.current)
  useVoltar(fechar)
  const erro = erroDe(r)

  return (
    <div className="fixed inset-0 z-20 overflow-y-auto bg-papel safe-top safe-bottom">
      <div className="relative mx-auto my-12 w-full max-w-[440px] px-8">
        {/* cadeiras em volta do formulário */}
        <span className="absolute left-1/2 top-[-40px] size-20 -translate-x-1/2 rounded-full bg-caneta-800" />
        <span className="absolute bottom-[-44px] left-1/2 size-20 -translate-x-1/2 rounded-full bg-caneta-800" />
        <span className="absolute left-0 top-[25%] size-16 rounded-full bg-caneta-800" />
        <span className="absolute left-0 top-[62%] size-16 rounded-full bg-caneta-800" />
        <span className="absolute right-0 top-[25%] size-16 rounded-full bg-caneta-800" />
        <span className="absolute right-0 top-[62%] size-16 rounded-full bg-caneta-800" />

        <div className="relative rounded-2xl bg-caneta-200 px-4 pb-5 pt-3 text-neutro-800">
          <div className="mb-4 flex items-center">
            <button onClick={fechar} className="-ml-1 p-2" aria-label="Voltar">
              <ChevronLeftIcon className="size-6" />
            </button>
            <h1 className="flex-1 pl-9 text-center text-xl font-extrabold uppercase">{titulo}</h1>
            {onApagar ? (
              <button onClick={onApagar} className="p-2 text-erro-600" aria-label="Apagar registro" title="Apagar registro">
                <TrashIcon className="size-5" />
              </button>
            ) : (
              <span className="w-9" />
            )}
            {modo === 'resumo' ? (
              <button onClick={() => setModo('editar')} className="p-2" aria-label="Editar" title="Editar">
                <PencilIcon className="size-5" />
              </button>
            ) : (
              <span className="w-9" />
            )}
          </div>

          {modo === 'editar' ? <Edicao r={r} muda={muda} onSaida={() => (muda({ saida: agoraHora(), saidaTipo: 'grupo' }), setModo('resumo'))} /> : <Resumo r={r} />}

          {(modo === 'editar' ? entradas.length > 0 : r.fluxos.length > 0) && (
            <>
              <Rotulo icone={<ArrowRightEndOnRectangleIcon className="size-5" />}>Da porta</Rotulo>
              <div className="flex flex-wrap gap-2">
                {modo === 'editar'
                  ? entradas.map((f) => {
                      const ligada = r.fluxos.includes(f.codigo)
                      return (
                        <button
                          key={f.id}
                          onClick={() => alternarPorta(f)}
                          aria-pressed={ligada}
                          className={`rounded-full px-3 py-1 text-sm font-semibold ${ligada ? 'bg-caneta-600 text-sobre' : 'bg-papel text-neutro-700'}`}
                        >
                          {f.codigo} · {f.hora} · {f.estimado && '≈'}
                          {f.pessoas}
                        </button>
                      )
                    })
                  : r.fluxos.map((c) => <Chip key={c}>{c}</Chip>)}
              </div>
            </>
          )}

          <Rotulo icone={<ListBulletIcon className="size-5" />}>Jogos</Rotulo>
          {modo === 'editar' ? (
            <button onClick={() => setEscolher(true)} className="flex min-h-11 w-full items-center gap-2 rounded-lg bg-papel px-3 py-2 text-left">
              <span className="flex flex-1 flex-wrap gap-2">
                {r.jogos.length ? r.jogos.map((j) => <Chip key={j}>{rotuloJogo(j, r.jogosIncertos)}</Chip>) : <span className="text-neutro-400">Escolher jogos…</span>}
              </span>
              <ChevronDownIcon className="size-6 shrink-0" />
            </button>
          ) : (
            <div className="flex flex-wrap gap-2">
              {r.jogos.length ? r.jogos.map((j) => <Chip key={j}>{rotuloJogo(j, r.jogosIncertos)}</Chip>) : <span className="pl-2.5 text-neutro-500">—</span>}
            </div>
          )}

          <Rotulo icone={<BellAlertIcon className="size-5" />}>Pedidos</Rotulo>
          <ListaPedidos pedidos={r.pedidos} onChange={(pedidos) => muda({ pedidos })} />

          <Rotulo icone={<ListBulletIcon className="size-5" />}>Notas</Rotulo>
          <textarea
            value={r.notas}
            onChange={(e) => muda({ notas: e.target.value })}
            placeholder="Anotações..."
            rows={4}
            className="w-full resize-none rounded-lg bg-papel p-2.5 text-base outline-none placeholder:text-neutro-400 focus:ring-2 focus:ring-foco-500"
          />

          {erro && <p className="mt-3 text-sm font-semibold text-erro-600">{erro}</p>}

          <div className="mt-5 grid grid-cols-2 gap-3">
            <button onClick={onDesfazer} className="h-11 rounded bg-caneta-300 font-bold text-caneta-700">
              Desfazer
            </button>
            <button onClick={fechar} className="h-11 rounded bg-caneta-600 font-bold text-sobre">
              Pronto
            </button>
          </div>
          <p className="mt-2 text-center text-xs text-neutro-600">Salvo automaticamente</p>
        </div>
      </div>
      {escolher && (
        <SeletorJogos
          selecionados={r.jogos}
          incertos={r.jogosIncertos}
          destaque={acervo}
          onFechar={() => setEscolher(false)}
          onMudar={(jogos) => muda({ jogos, jogosIncertos: r.jogosIncertos.filter((j) => jogos.includes(j)) })}
          onIncertos={(jogosIncertos) => muda({ jogosIncertos })}
        />
      )}
    </div>
  )
}

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
          className={`grid size-11 shrink-0 place-items-center rounded-lg ${r.aniversario ? 'bg-caneta-400 text-caneta-800' : 'text-neutro-700'}`}
        >
          <BoloIcon className="size-7" />
        </button>
      </div>

      <Rotulo icone={<ClockIcon className="size-5" />}>
        Entrada
        <button
          onClick={() => muda({ inicial: !r.inicial })}
          aria-pressed={r.inicial}
          title="Grupo que já estava na mesa quando a visita começou: a entrada não foi vista"
          className={`ml-auto rounded px-1.5 text-[12px] normal-case ${r.inicial ? 'bg-alerta-100 text-alerta-700' : 'text-neutro-600'}`}
        >
          já estava na chegada
        </button>
      </Rotulo>
      <div className="flex items-center gap-4">
        <input type="time" value={r.entrada} onChange={(e) => muda({ entrada: e.target.value })} className={`${campo} flex-1`} />
        {r.saida === null ? (
          <button onClick={onSaida} className="grid size-14 shrink-0 place-items-center rounded-full bg-erro-300 text-[13px] font-extrabold text-erro-700">
            SAÍDA
          </button>
        ) : (
          <div className="relative w-28 shrink-0">
            <span className="absolute -top-5 left-0 text-sm font-bold">SAÍDA</span>
            <input type="time" value={r.saida} onChange={(e) => muda({ saida: e.target.value })} className={campo} />
            <button onClick={() => muda({ saida: null, saidaTipo: '' })} className="absolute -right-2 -top-2 rounded-full bg-neutro-800 p-0.5 text-neutro-50" aria-label="Desfazer saída">
              <XMarkIcon className="size-4" />
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Rotulo icone={<UserGroupIcon className="size-5" />}>
            Pessoas
            <button
              onClick={() => muda({ pessoasEstimado: !r.pessoasEstimado })}
              aria-pressed={r.pessoasEstimado}
              title="Número estimado (não deu para contar)"
              aria-label="Número estimado"
              className={`ml-auto rounded px-2 text-[15px] leading-5 ${r.pessoasEstimado ? 'bg-alerta-100 text-alerta-700' : 'text-neutro-600'}`}
            >
              ≈
            </button>
          </Rotulo>
          <Contador valor={r.pessoas} onChange={(v) => muda({ pessoas: v })} />
        </div>
        <div>
          <Rotulo icone={<UserGroupIcon className="size-5" />}>Crianças</Rotulo>
          <Contador valor={r.criancas} onChange={(v) => muda({ criancas: v })} />
        </div>
      </div>

      <Rotulo icone={<PuzzlePieceIcon className="size-5" />}>Instrutor na mesa</Rotulo>
      <ContadorH valor={r.instrutor} sufixo="x" onChange={(v) => muda({ instrutor: v })} />
    </>
  )
}

function Valor({ icone, rotulo, children }: { icone: ReactNode; rotulo: string; children: ReactNode }) {
  return (
    <div>
      <Rotulo icone={icone}>{rotulo}</Rotulo>
      <div className="whitespace-nowrap pl-2.5 text-xl font-bold text-caneta-700">{children}</div>
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
          <span className="mt-2 flex items-center gap-2 rounded-lg bg-caneta-400 px-3 py-2 text-base text-caneta-800">
            <BoloIcon className="size-6" />
            Aniversário
          </span>
        )}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Valor icone={<ClockIcon className="size-5" />} rotulo={r.inicial ? 'Já estava (início)' : 'Entrada'}>
          {r.entrada || '—'}
        </Valor>
        <Valor icone={<ClockIcon className="size-5" />} rotulo={r.saidaTipo === 'fechamento' ? 'Saída (fechamento)' : 'Saída'}>
          {r.saida ?? '—'}
        </Valor>
        <Valor icone={<UserGroupIcon className="size-5" />} rotulo={r.pessoasEstimado ? 'Pessoas (estimado)' : 'Pessoas'}>
          {r.pessoasEstimado && '≈'}
          {r.pessoas}
        </Valor>
        <Valor icone={<UserGroupIcon className="size-5" />} rotulo="Crianças">
          {r.criancas}
        </Valor>
        <Valor icone={<PuzzlePieceIcon className="size-5" />} rotulo="Instrutor na mesa">
          {r.instrutor}
          <span className="text-base">x</span>
        </Valor>
        {p !== null && (
          <Valor icone={<ClockIcon className="size-5" />} rotulo={r.inicial ? 'Permanência (no mínimo)' : 'Permanência'}>
            {r.inicial && '≥'}
            {Math.floor(p / 60)}h{String(p % 60).padStart(2, '0')}
          </Valor>
        )}
      </div>
    </div>
  )
}
