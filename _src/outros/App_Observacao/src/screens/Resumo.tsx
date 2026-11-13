import { useState, type ReactNode } from 'react'
import { ChevronDownIcon } from '@heroicons/react/24/outline'
import { useLoja } from '../store'
import { CATEGORIAS_PEDIDO, dataBr, visitaAtual, type Unidade } from '../domain/model'
import { resumoVisita } from '../domain/resumo'
import { NOME_CATEGORIA } from '../ui/Pedidos'

const n = (x: number | null | undefined, suf = '') => (x === null || x === undefined ? '—' : `${String(x).replace('.', ',')}${suf}`)

/** Indicadores da visita: um número de destaque por bloco, o resto recolhido (minimalismo.md). */
export function PaginaResumo({ unidade }: { unidade: Unidade }) {
  const estado = useLoja((s) => s.estado)
  const visitas = estado.visitas.filter((v) => v.unidadeId === unidade.id).sort((a, b) => b.inicio.localeCompare(a.inicio))
  const [sel, setSel] = useState<string | null>(null)
  const v = visitas.find((x) => x.id === sel) ?? visitaAtual(estado, unidade.id)
  if (!v) return <p className="mt-16 px-6 text-center text-neutro-500">Sem visitas.</p>
  const r = resumoVisita(estado, v.id)
  const nMesas = unidade.mesas.length

  return (
    <div className="px-4 pb-10">
      {visitas.length > 1 && (
        <div className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4">
          {visitas.map((x) => (
            <button key={x.id} onClick={() => setSel(x.id)} className={`shrink-0 rounded-full px-3 py-1 text-sm ${x.id === v.id ? 'bg-caneta-600 text-sobre' : 'bg-neutro-100'}`}>
              {dataBr(x.inicio.slice(0, 10)).slice(0, 5)} {x.inicio.slice(11, 16)}
            </button>
          ))}
        </div>
      )}
      <p className="mt-4 text-sm text-neutro-500">
        {dataBr(v.inicio.slice(0, 10))} · {v.inicio.slice(11, 16)}–{v.fim ? v.fim.slice(11, 16) : 'agora'} · {r.duracaoMin} min
      </p>

      <Bloco titulo="Porta" destaque={n(r.fluxo.pessoasHora)} unidadeDestaque="pessoas/h">
        <Item rotulo="Grupos que entraram" valor={n(r.fluxo.grupos)} />
        <Item rotulo="Pessoas que entraram" valor={n(r.fluxo.entraram)} />
        <Item rotulo="Já dentro na chegada (pessoas)" valor={n(r.fluxo.jaDentro)} />
        <Item rotulo="Tamanho médio do grupo" valor={n(r.fluxo.tamanhoGrupo)} />
        <Item rotulo="Permanência média (saídas vistas)" valor={n(r.fluxo.permanenciaMedia, ' min')} />
        <Item rotulo="Sem saída (censurados)" valor={n(r.fluxo.censurados)} />
        <Item rotulo="Saldo dentro" valor={n(r.fluxo.saldo)} />
      </Bloco>

      <Bloco titulo="Mesas" destaque={n(r.mesas.permanenciaMedia)} unidadeDestaque="min de permanência">
        <Item rotulo="Grupos" valor={n(r.mesas.grupos)} />
        <Item rotulo="Pessoas (crianças)" valor={`${r.mesas.pessoas} (${r.mesas.criancas})`} />
        <Item rotulo="Pessoas por mesa" valor={n(r.mesas.tamanhoGrupo)} />
        <Item rotulo="Permanência mediana" valor={n(r.mesas.permanenciaMediana, ' min')} />
        <Item rotulo="Sem saída (censurados)" valor={n(r.mesas.censurados)} />
        <Item rotulo="Já sentados na chegada" valor={n(r.mesas.iniciais)} />
        <Item rotulo="Aniversários" valor={n(r.mesas.aniversarios)} />
        <Item rotulo="Instrutor por grupo" valor={n(r.mesas.instrutorPorGrupo)} />
        {r.mesas.jogos.length > 0 && <Item rotulo="Jogos mais jogados" valor={r.mesas.jogos.map(([j, c]) => `${j} (${c})`).join(', ')} />}
      </Bloco>

      <Bloco titulo="Pedidos" destaque={n(r.pedidos.esperaMedia.comida)} unidadeDestaque="min de espera da comida" badge={r.pedidos.pendentes}>
        <Item rotulo="Pedidos" valor={n(r.pedidos.total)} />
        <Item rotulo="Por grupo" valor={n(r.pedidos.porGrupo)} />
        {CATEGORIAS_PEDIDO.map((c) => (
          <Item key={c} rotulo={`${NOME_CATEGORIA[c]}: espera média (qtd.)`} valor={`${n(r.pedidos.esperaMedia[c], ' min')} (${r.pedidos.porCategoria[c]})`} />
        ))}
        <Item rotulo="Ainda não chegaram" valor={n(r.pedidos.pendentes)} />
      </Bloco>

      <Bloco titulo="Ocupação" destaque={n(r.contagens.ocupacaoMedia)} unidadeDestaque="% das mesas">
        <Item rotulo="Contagens feitas" valor={n(r.contagens.feitas)} />
        <Item rotulo="Pico de mesas ocupadas" valor={r.contagens.pico === null ? '—' : `${r.contagens.pico} de ${nMesas}`} />
        {r.contagens.serie.length > 0 && (
          <div className="flex h-20 items-end gap-1 pt-3">
            {r.contagens.serie.map((c) => (
              <div key={c.etapa} className="flex flex-1 flex-col items-center gap-1">
                <div className="w-full rounded-t bg-caneta-500" style={{ height: `${nMesas ? (c.ocupadas / nMesas) * 56 : 0}px` }} />
                <span className="text-xs text-neutro-500">{c.hora}</span>
              </div>
            ))}
          </div>
        )}
      </Bloco>

      <Bloco titulo="Notas fiscais" destaque={n(r.pessoasPorNota)} unidadeDestaque="pessoas por nota">
        <Item rotulo="Notas emitidas na visita" valor={n(r.notasEmitidas)} />
        <Item rotulo="Notas por hora" valor={n(r.notasPorHora)} />
        <Item rotulo="Valor médio das notas lidas" valor={r.ticketNotasLidas === null ? '—' : `R$ ${n(r.ticketNotasLidas)}`} />
      </Bloco>

      <Bloco titulo="Acústica" destaque={n(r.acustica.media)} unidadeDestaque="dB médio">
        <Item rotulo="Medições" valor={n(r.acustica.medicoes)} />
        <Item rotulo="Pico" valor={n(r.acustica.maximo, ' dB')} />
      </Bloco>
    </div>
  )
}

function Bloco({ titulo, destaque, unidadeDestaque, badge, children }: { titulo: string; destaque: string; unidadeDestaque: string; badge?: number; children: ReactNode }) {
  const [aberto, setAberto] = useState(false)
  return (
    <section className="mt-3 rounded-xl bg-neutro-50 px-4 py-3">
      <button onClick={() => setAberto((x) => !x)} aria-expanded={aberto} className="flex w-full items-center gap-3 text-left">
        <span className="flex-1">
          <span className="block text-xs font-bold uppercase text-neutro-500">{titulo}</span>
          <span className="text-2xl font-extrabold text-caneta-600">{destaque}</span> <span className="text-sm text-neutro-500">{unidadeDestaque}</span>
        </span>
        {!!badge && <span className="rounded-full bg-alerta-100 px-2 text-xs font-bold text-alerta-700" title="pendentes">{badge}</span>}
        <ChevronDownIcon className={`size-5 text-neutro-400 transition-transform duration-200 ${aberto ? 'rotate-180' : ''}`} />
      </button>
      {aberto && <div className="mt-2 divide-y divide-neutro-100">{children}</div>}
    </section>
  )
}

function Item({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1.5">
      <span className="text-sm text-neutro-600">{rotulo}</span>
      <span className="text-right font-bold">{valor}</span>
    </div>
  )
}
