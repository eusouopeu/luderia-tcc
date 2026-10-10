import { useLoja } from '../../store'
import { Fab, ContadorH } from '../../ui/comum'
import { agoraHora, gruposDentro, novoId, pessoasDentro, visitaAtiva, type Fluxo, type Unidade } from '../../domain/model'

/** Entradas e saídas na porta: um cartão por grupo, com código que liga a entrada à saída. */
export function AbaFluxo({ unidade, semVisita }: { unidade: Unidade; semVisita: () => boolean }) {
  const { estado, mudar } = useLoja()
  const visita = visitaAtiva(estado, unidade.id)
  const fl = visita ? estado.fluxos.filter((f) => f.visitaId === visita.id) : []
  const entradas = fl.filter((f) => f.tipo === 'entrada')
  const saidaDe = (codigo: string) => fl.find((f) => f.tipo === 'saida' && f.codigo === codigo)
  // grupos dentro primeiro, os mais novos em cima; depois os que saíram
  const cartoes = [...entradas].sort((a, b) => Number(!!saidaDe(a.codigo)) - Number(!!saidaDe(b.codigo)) || b.hora.localeCompare(a.hora) || b.codigo.localeCompare(a.codigo, 'pt', { numeric: true }))

  const novo = () => {
    if (!visita && !semVisita()) return
    const v = visitaAtiva(useLoja.getState().estado, unidade.id)!
    mudar((e) => {
      const n = e.fluxos.filter((f) => f.visitaId === v.id && f.tipo === 'entrada').length + 1
      const f: Fluxo = { id: novoId(), visitaId: v.id, codigo: `${unidade.sigla}-${n}`, tipo: 'entrada', hora: agoraHora(), pessoas: 2, criancas: 0 }
      return { ...e, fluxos: [...e.fluxos, f] }
    })
  }
  /** Muda o grupo; a saída acompanha pessoas e crianças da entrada. */
  const muda = (codigo: string, p: Partial<Fluxo>, tipo: Fluxo['tipo'] = 'entrada') =>
    mudar((e) => ({
      ...e,
      fluxos: e.fluxos.map((f) =>
        f.visitaId !== visita!.id || f.codigo !== codigo
          ? f
          : f.tipo === tipo
            ? { ...f, ...p }
            : 'pessoas' in p || 'criancas' in p
              ? { ...f, pessoas: p.pessoas ?? f.pessoas, criancas: p.criancas ?? f.criancas }
              : f,
      ),
    }))
  const sair = (en: Fluxo, sim: boolean) =>
    mudar((e) => ({
      ...e,
      fluxos: sim
        ? [...e.fluxos, { ...en, id: novoId(), tipo: 'saida', hora: agoraHora() }]
        : e.fluxos.filter((f) => !(f.visitaId === en.visitaId && f.codigo === en.codigo && f.tipo === 'saida')),
    }))
  const apagar = (en: Fluxo) => {
    if (!confirm(`Apagar o grupo ${en.codigo} (entrada e saída)?`)) return
    mudar((e) => ({ ...e, fluxos: e.fluxos.filter((f) => !(f.visitaId === en.visitaId && f.codigo === en.codigo)) }))
  }

  return (
    <div className="px-4 pb-28">
      <h2 className="mb-1 mt-5 text-center text-sm font-bold uppercase">Entradas e saídas (fluxo)</h2>
      {visita && (
        <p className="mb-3 text-center text-sm text-slate-600">
          Dentro agora: <b className="text-orange-700">{pessoasDentro(estado, visita.id)} pessoas</b> · {gruposDentro(estado, visita.id).length} grupos · {entradas.length} entradas
        </p>
      )}
      {!visita && <p className="mt-10 text-center text-slate-500">Toque em + para começar a visita e registrar a primeira entrada.</p>}
      <div className="space-y-3">
        {cartoes.map((en) => {
          const sa = saidaDe(en.codigo)
          const atual = sa ?? en
          return (
            <div key={en.id} className={`rounded-xl bg-slate-200/70 p-4 ${sa ? 'opacity-60' : ''}`}>
              <div className="flex items-center gap-2">
                <button onClick={() => apagar(en)} className="w-[88px] shrink-0 text-left text-[17px]" aria-label={`Grupo ${en.codigo}`}>
                  <b className="text-orange-600">ID:</b> {en.codigo}
                </button>
                <div className="flex h-8 flex-1 overflow-hidden rounded-md bg-slate-300 text-xs font-bold">
                  <button onClick={() => sa && sair(en, false)} className={`flex-1 ${!sa ? 'bg-orange-600 text-white' : 'text-slate-700'}`}>
                    ENTRADA
                  </button>
                  <button onClick={() => !sa && sair(en, true)} className={`flex-1 ${sa ? 'bg-orange-600 text-white' : 'text-slate-700'}`}>
                    SAÍDA
                  </button>
                </div>
                <input
                  type="time"
                  value={atual.hora}
                  onChange={(ev) => muda(en.codigo, { hora: ev.target.value }, sa ? 'saida' : 'entrada')}
                  className="h-8 w-[76px] rounded-md bg-white text-center text-[15px] font-medium outline-none"
                />
              </div>
              <div className="mt-3 grid grid-cols-2 gap-4">
                <div>
                  <div className="mb-1 text-xs font-bold uppercase">Pessoas</div>
                  <ContadorH valor={en.pessoas} onChange={(v) => muda(en.codigo, { pessoas: v })} />
                </div>
                <div>
                  <div className="mb-1 text-xs font-bold uppercase">Crianças</div>
                  <ContadorH valor={en.criancas} onChange={(v) => muda(en.codigo, { criancas: v })} />
                </div>
              </div>
            </div>
          )
        })}
      </div>
      <Fab onClick={novo} rotulo="Nova entrada" />
    </div>
  )
}
