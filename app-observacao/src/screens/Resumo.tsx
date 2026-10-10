import { useState, type ReactNode } from 'react'
import { useLoja } from '../store'
import { dataBr, visitaAtual, type Unidade } from '../domain/model'
import { resumoVisita } from '../domain/resumo'

const n = (x: number | null | undefined, suf = '') => (x === null || x === undefined ? '—' : `${String(x).replace('.', ',')}${suf}`)

/** Indicadores da visita: porta, mesas, contagens, notas fiscais e som. */
export function PaginaResumo({ unidade }: { unidade: Unidade }) {
  const estado = useLoja((s) => s.estado)
  const visitas = estado.visitas.filter((v) => v.unidadeId === unidade.id).sort((a, b) => b.inicio.localeCompare(a.inicio))
  const [sel, setSel] = useState<string | null>(null)
  const v = visitas.find((x) => x.id === sel) ?? visitaAtual(estado, unidade.id)
  if (!v) return <p className="mt-16 px-6 text-center text-slate-500">Sem visitas para resumir.</p>
  const r = resumoVisita(estado, v.id)
  const nMesas = unidade.mesas.length

  return (
    <div className="px-4 pb-10">
      {visitas.length > 1 && (
        <div className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4">
          {visitas.map((x) => (
            <button key={x.id} onClick={() => setSel(x.id)} className={`shrink-0 rounded-full px-3 py-1 text-sm ${x.id === v.id ? 'bg-orange-600 text-white' : 'bg-slate-200'}`}>
              {dataBr(x.inicio.slice(0, 10)).slice(0, 5)} {x.inicio.slice(11, 16)}
            </button>
          ))}
        </div>
      )}
      <h2 className="mt-4 text-xl font-extrabold">Resumo da visita</h2>
      <p className="text-sm text-slate-600">
        {dataBr(v.inicio.slice(0, 10))} · {v.inicio.slice(11, 16)}–{v.fim ? v.fim.slice(11, 16) : 'em andamento'} · {r.duracaoMin} min observados
      </p>

      <Bloco titulo="Porta (fluxo)">
        <Item rotulo="Grupos que entraram" valor={n(r.fluxo.grupos)} />
        <Item rotulo="Pessoas que entraram" valor={n(r.fluxo.entraram)} />
        <Item rotulo="Pessoas por hora" valor={n(r.fluxo.pessoasHora)} destaque />
        <Item rotulo="Tamanho médio do grupo" valor={n(r.fluxo.tamanhoGrupo)} />
        <Item rotulo="Permanência média (saídas vistas)" valor={n(r.fluxo.permanenciaMedia, ' min')} />
        <Item rotulo="Grupos sem saída (censurados)" valor={n(r.fluxo.censurados)} />
        <Item rotulo="Saldo dentro agora/no fim" valor={n(r.fluxo.saldo)} />
      </Bloco>

      <Bloco titulo="Mesas">
        <Item rotulo="Grupos nas mesas" valor={n(r.mesas.grupos)} />
        <Item rotulo="Pessoas (crianças)" valor={`${r.mesas.pessoas} (${r.mesas.criancas})`} />
        <Item rotulo="Pessoas por mesa" valor={n(r.mesas.tamanhoGrupo)} destaque />
        <Item rotulo="Permanência média · mediana" valor={`${n(r.mesas.permanenciaMedia)} · ${n(r.mesas.permanenciaMediana)} min`} destaque />
        <Item rotulo="Sem saída (censurados)" valor={n(r.mesas.censurados)} />
        <Item rotulo="Aniversários" valor={n(r.mesas.aniversarios)} />
        <Item rotulo="Visitas do instrutor por grupo" valor={n(r.mesas.instrutorPorGrupo)} />
        {r.mesas.jogos.length > 0 && (
          <div className="pt-2 text-sm">
            <span className="text-slate-600">Jogos mais jogados: </span>
            {r.mesas.jogos.map(([j, c]) => `${j} (${c})`).join(', ')}
          </div>
        )}
      </Bloco>

      <Bloco titulo="Contagens periódicas">
        <Item rotulo="Feitas" valor={n(r.contagens.feitas)} />
        <Item rotulo="Pico de mesas ocupadas" valor={r.contagens.pico === null ? '—' : `${r.contagens.pico} de ${nMesas}`} />
        <Item rotulo="Ocupação média das mesas" valor={n(r.contagens.ocupacaoMedia, '%')} destaque />
        {r.contagens.serie.length > 0 && (
          <div className="flex h-20 items-end gap-1 pt-3">
            {r.contagens.serie.map((c) => (
              <div key={c.etapa} className="flex flex-1 flex-col items-center gap-1">
                <div className="w-full rounded-t bg-orange-500" style={{ height: `${nMesas ? (c.ocupadas / nMesas) * 56 : 0}px` }} />
                <span className="text-[10px] text-slate-500">{c.hora}</span>
              </div>
            ))}
          </div>
        )}
      </Bloco>

      <Bloco titulo="Notas fiscais">
        <Item rotulo="Notas emitidas na visita" valor={n(r.notasEmitidas)} />
        <Item rotulo="Notas por hora" valor={n(r.notasPorHora)} />
        <Item rotulo="Pessoas por nota" valor={n(r.pessoasPorNota)} destaque />
        <Item rotulo="Valor médio das notas lidas" valor={r.ticketNotasLidas === null ? '—' : `R$ ${n(r.ticketNotasLidas)}`} />
      </Bloco>

      <Bloco titulo="Acústica">
        <Item rotulo="Medições" valor={n(r.acustica.medicoes)} />
        <Item rotulo="Média · pico" valor={`${n(r.acustica.media)} · ${n(r.acustica.maximo)} dB`} />
      </Bloco>
    </div>
  )
}

function Bloco({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="mt-5 rounded-xl bg-slate-100 p-4">
      <h3 className="mb-1 text-[13px] font-extrabold uppercase text-orange-700">{titulo}</h3>
      <div className="divide-y divide-slate-200">{children}</div>
    </section>
  )
}

function Item({ rotulo, valor, destaque }: { rotulo: string; valor: string; destaque?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1.5">
      <span className="text-sm text-slate-700">{rotulo}</span>
      <span className={`text-right font-bold ${destaque ? 'text-lg text-orange-600' : ''}`}>{valor}</span>
    </div>
  )
}
