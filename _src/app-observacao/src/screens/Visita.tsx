import { useState } from 'react'
import { ArrowPathIcon, ArrowUpTrayIcon, PlusIcon, QrCodeIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { useLoja } from '../store'
import { useLeitorQr } from '../ui/useLeitorQr'
import { areaTexto, campo, Opcao, Secao } from '../ui/comum'
import { agoraIso, arquivosCsv, dataBr, idVisita, novoId, PAPEIS, pausasTexto, POSICOES, visitaAtual, type Ficha, type NotaFiscal, type Unidade, type Visita } from '../domain/model'
import { compartilhar } from '../storage/exportar'
import { chaveDoQr, consultarNfce, dadosDaChave, notasEmitidas, pareceQrNfce } from '../domain/nfce'

const COBRANCAS = ['Por pessoa', 'Por hora', 'Couvert lúdico', 'Consumação mínima', 'Sem cobrança', 'Outro']
const DIA_COMUM = 'Dia comum'
const EVENTO = 'Evento ou torneio'
const CONDICOES = [
  DIA_COMUM, 'Feriado', 'Véspera de feriado', 'Feriado prolongado', EVENTO, 'Promoção', 'Jogo de futebol', 'Chuva', 'Aniversário na casa',
  'Lotação esgotada', 'Obra ou falta de luz',
]

/** Ficha da visita: notas fiscais (QR), cobrança, preços e condições atípicas. */
export function PaginaVisita({ unidade }: { unidade: Unidade }) {
  const { estado, mudar } = useLoja()
  const visitas = estado.visitas.filter((v) => v.unidadeId === unidade.id).sort((a, b) => b.inicio.localeCompare(a.inicio))
  const [sel, setSel] = useState<string | null>(null)
  const v = visitas.find((x) => x.id === sel) ?? visitaAtual(estado, unidade.id)
  const [lendo, setLendo] = useState<NotaFiscal['momento'] | null>(null)

  if (!v) return <p className="mt-16 px-6 text-center text-neutro-500">Nenhuma visita ainda.</p>

  const mudaV = (f: (v: Visita) => Visita) => mudar((e) => ({ ...e, visitas: e.visitas.map((x) => (x.id === v.id ? f(x) : x)) }))
  const mudaFicha = (p: Partial<Ficha>) => mudaV((x) => ({ ...x, ficha: { ...x.ficha, ...p } }))
  const ini = v.notas.find((n) => n.momento === 'inicio')
  const fim = v.notas.find((n) => n.momento === 'fim')
  const emitidas = notasEmitidas(ini, fim)

  async function consultar(id: string, url: string) {
    try {
      const c = await consultarNfce(url)
      mudar((e) => ({
        ...e,
        visitas: e.visitas.map((x) => (x.id !== v!.id ? x : { ...x, notas: x.notas.map((n) => (n.id === id ? { ...n, ...c } : n)) })),
      }))
    } catch (err) {
      alert(`Nota guardada só com série e número (sem a consulta da SEFAZ): ${err instanceof Error ? err.message : err}. Dá para tentar de novo depois.`)
    }
  }
  function lida(url: string) {
    const chave = chaveDoQr(url)!
    const d = dadosDaChave(chave)
    const n: NotaFiscal = {
      id: novoId(), momento: lendo!, lidaEm: agoraIso(), chave, url, cnpj: d.cnpj, serie: d.serie, numero: d.numero, emissao: null, total: null, itens: [],
    }
    mudaV((x) => ({ ...x, notas: [...x.notas.filter((o) => n.momento === 'extra' || o.momento !== n.momento), n] }))
    setLendo(null)
    navigator.vibrate?.(80)
    void consultar(n.id, url)
  }

  return (
    <div className="px-4 pb-10">
      {visitas.length > 1 && (
        <div className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4">
          {visitas.map((x) => (
            <button key={x.id} onClick={() => setSel(x.id)} className={`shrink-0 rounded-full px-3 py-1 text-sm ${x.id === v.id ? 'bg-caneta-600 text-sobre' : 'bg-neutro-200'}`}>
              {dataBr(x.inicio.slice(0, 10)).slice(0, 5)} {x.inicio.slice(11, 16)}
              {!x.fim && ' ●'}
            </button>
          ))}
        </div>
      )}
      <div className="mt-4 flex items-start gap-2">
        <h2 className="flex-1 text-xl font-extrabold">
          Visita de {dataBr(v.inicio.slice(0, 10))}, {v.inicio.slice(11, 16)}–{v.fim ? v.fim.slice(11, 16) : 'em andamento'}
          <span className="block text-sm font-semibold text-neutro-500">
            {idVisita(estado, v)} · {v.observador || 'sem observador'}
          </span>
        </h2>
        <button
          onClick={() => void compartilhar(arquivosCsv(estado, unidade.id, v.id), `Visita ${idVisita(estado, v)}`)}
          className="p-2 text-caneta-700"
          aria-label="Exportar esta visita"
          title="Exportar esta visita"
        >
          <ArrowUpTrayIcon className="size-6" />
        </button>
      </div>

      <Secao
        titulo="Observador"
        ajuda="Quem registrou, o que cobriu e de onde. Com dois observadores, combinem antes: um na porta e outro nas mesas, ou os dois na mesma tarefa para medir a concordância. As pausas do temporizador marcam quando o registro parou."
      >
        <input
          value={v.observador}
          onChange={(e) => mudaV((x) => ({ ...x, observador: e.target.value.toUpperCase() }))}
          placeholder="Código (ex.: POV1)"
          className={campo}
        />
        <p className="mb-1 mt-3 text-sm font-semibold">Papel</p>
        <div className="flex flex-wrap gap-2">
          {PAPEIS.map((p) => (
            <Opcao key={p} ativo={v.papel === p} onClick={() => mudaV((x) => ({ ...x, papel: x.papel === p ? '' : p }))}>
              {p[0].toUpperCase() + p.slice(1)}
            </Opcao>
          ))}
        </div>
        <p className="mb-1 mt-3 text-sm font-semibold">Posição</p>
        <div className="flex flex-wrap gap-2">
          {POSICOES.map((p) => (
            <Opcao key={p} ativo={v.posicao === p} onClick={() => mudaV((x) => ({ ...x, posicao: x.posicao === p ? '' : p }))}>
              {p}
            </Opcao>
          ))}
        </div>
        {v.pausas.length > 0 && <p className="mt-3 text-sm text-neutro-600">Pausas: {pausasTexto(v)}</p>}
      </Secao>

      <Secao
        titulo="Notas fiscais (NFC-e)"
        ajuda="Leia o QR do cupom de uma compra sua no início e no fim. A diferença de numeração dá as notas emitidas. Sem internet, série e número já ficam gravados; a consulta à SEFAZ (hora, total, itens) pode ser refeita depois."
      >
        <div className="grid grid-cols-2 gap-3">
          <CartaoNota rotulo="Início" nota={ini} onLer={() => setLendo('inicio')} onConsultar={(n) => consultar(n.id, n.url)} />
          <CartaoNota rotulo="Fim" nota={fim} onLer={() => setLendo('fim')} onConsultar={(n) => consultar(n.id, n.url)} />
        </div>
        {emitidas !== null && (
          <p className="mt-3 rounded-lg bg-caneta-50 p-3 text-sm">
            <b className="text-caneta-700">{emitidas} notas</b> emitidas entre as duas leituras (série {ini!.serie}).
          </p>
        )}
        {ini && fim && emitidas === null && <p className="mt-3 text-sm text-erro-600">Séries ou CNPJs diferentes: as notas não se comparam.</p>}
        {v.notas
          .filter((n) => n.momento === 'extra')
          .map((n) => (
            <div key={n.id} className="mt-2 flex items-center gap-2 rounded-lg bg-neutro-100 px-3 py-2 text-sm">
              <span className="flex-1">
                Nº {n.numero} · {n.emissao ? n.emissao.slice(11, 16) : n.lidaEm.slice(11, 16)}
                {n.total !== null && ` · R$ ${n.total.toFixed(2).replace('.', ',')} · ${n.itens.length} itens`}
              </span>
              <button onClick={() => confirm('Apagar esta nota?') && mudaV((x) => ({ ...x, notas: x.notas.filter((o) => o.id !== n.id) }))} aria-label="Apagar nota">
                <TrashIcon className="size-5 text-erro-500" />
              </button>
            </div>
          ))}
        <button onClick={() => setLendo('extra')} className="mt-3 flex items-center gap-1 font-semibold text-caneta-700">
          <PlusIcon className="size-5" /> Outra nota (ticket, itens pedidos)
        </button>
      </Secao>

      <Secao titulo="Política de cobrança">
        <div className="flex flex-wrap gap-2">
          {COBRANCAS.map((c) => (
            <Opcao key={c} ativo={v.ficha.cobranca === c} onClick={() => mudaFicha({ cobranca: v.ficha.cobranca === c ? '' : c })}>
              {c}
            </Opcao>
          ))}
        </div>
        <input value={v.ficha.valorCobranca} onChange={(e) => mudaFicha({ valorCobranca: e.target.value })} placeholder="Valor e regra (ex.: R$ 25 por pessoa, livre)" className={`${campo} mt-3`} />
      </Secao>

      <Secao titulo="Preços do cardápio na data">
        {v.ficha.precos.map((p, i) => (
          <div key={i} className="mb-2 flex gap-2">
            <input
              value={p.item}
              onChange={(e) => mudaFicha({ precos: v.ficha.precos.map((x, j) => (j === i ? { ...x, item: e.target.value } : x)) })}
              placeholder="Item"
              className={`${campo} flex-1`}
            />
            <input
              value={p.preco}
              inputMode="decimal"
              onChange={(e) => mudaFicha({ precos: v.ficha.precos.map((x, j) => (j === i ? { ...x, preco: e.target.value } : x)) })}
              placeholder="R$"
              className={`${campo} w-24`}
            />
            <button onClick={() => mudaFicha({ precos: v.ficha.precos.filter((_, j) => j !== i) })} aria-label="Tirar item">
              <XMarkIcon className="size-5 text-neutro-500" />
            </button>
          </div>
        ))}
        <button onClick={() => mudaFicha({ precos: [...v.ficha.precos, { item: '', preco: '' }] })} className="flex items-center gap-1 font-semibold text-caneta-700">
          <PlusIcon className="size-5" /> Item
        </button>
      </Secao>

      <Secao titulo="Condições do dia" ajuda="Marque tudo o que pode ter mudado o movimento. Dia comum quando não houve nada; ele exclui as outras opções.">
        <div className="flex flex-wrap gap-2">
          {CONDICOES.map((c) => {
            const on = v.ficha.condicoes.includes(c)
            const proxima = on
              ? v.ficha.condicoes.filter((x) => x !== c)
              : c === DIA_COMUM
                ? [DIA_COMUM]
                : [...v.ficha.condicoes.filter((x) => x !== DIA_COMUM), c]
            return (
              <Opcao key={c} ativo={on} onClick={() => mudaFicha({ condicoes: proxima })}>
                {c}
              </Opcao>
            )
          })}
        </div>
        {v.ficha.condicoes.includes(EVENTO) && (
          <input value={v.ficha.evento} onChange={(e) => mudaFicha({ evento: e.target.value })} placeholder="Qual evento? (ex.: RPG às 18h, 2 mesas)" className={`${campo} mt-3`} />
        )}
        <textarea
          value={v.ficha.observacoes}
          onChange={(e) => mudaFicha({ observacoes: e.target.value })}
          placeholder="Observações gerais da visita…"
          rows={3}
          className={`mt-3 ${areaTexto}`}
        />
      </Secao>

      {lendo && <LeitorNfce onFechar={() => setLendo(null)} onLido={lida} />}
    </div>
  )
}



function CartaoNota({ rotulo, nota, onLer, onConsultar }: { rotulo: string; nota?: NotaFiscal; onLer: () => void; onConsultar: (n: NotaFiscal) => void }) {
  if (!nota)
    return (
      <button onClick={onLer} className="flex h-24 flex-col items-center justify-center gap-1 rounded-xl bg-caneta-50 text-caneta-700">
        <QrCodeIcon className="size-8" />
        <span className="text-sm font-bold">Nota {rotulo.toLowerCase()}</span>
      </button>
    )
  return (
    <div className="rounded-xl bg-caneta-100 p-3 text-sm">
      <div className="flex items-center justify-between">
        <b className="uppercase text-caneta-700">{rotulo}</b>
        <button onClick={onLer} className="text-xs font-semibold text-caneta-700 underline">
          ler de novo
        </button>
      </div>
      <p className="text-lg font-extrabold">Nº {nota.numero}</p>
      <p>
        Série {nota.serie} · {nota.emissao ? `emitida ${nota.emissao.slice(11, 16)}` : `lida ${nota.lidaEm.slice(11, 16)}`}
      </p>
      {nota.total !== null ? (
        <p>
          R$ {nota.total.toFixed(2).replace('.', ',')} · {nota.itens.length} itens
        </p>
      ) : (
        <button onClick={() => onConsultar(nota)} className="mt-1 flex items-center gap-1 text-xs font-semibold text-caneta-700">
          <ArrowPathIcon className="size-4" /> consultar SEFAZ
        </button>
      )}
    </div>
  )
}

/** Câmera procurando o QR da NFC-e (mesmo leitor do app Brita); sem câmera, cola o link. */
function LeitorNfce({ onFechar, onLido }: { onFechar: () => void; onLido: (url: string) => void }) {
  const { videoRef, erro, aviso } = useLeitorQr(true, onLido, pareceQrNfce, 'Esse QR não é de nota fiscal (NFC-e). Use o do rodapé do cupom.')
  const [link, setLink] = useState('')
  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-escuro text-sobre safe-top safe-bottom">
      <div className="flex items-center p-3">
        <p className="flex-1 font-bold">Aponte para o QR code do cupom</p>
        <button onClick={onFechar} className="p-2" aria-label="Fechar">
          <XMarkIcon className="size-7" />
        </button>
      </div>
      <div className="relative flex-1 overflow-hidden">
        <video ref={videoRef} playsInline muted className="absolute inset-0 size-full object-cover" />
        <div className="absolute left-1/2 top-1/2 size-64 -translate-x-1/2 -translate-y-1/2 rounded-2xl border-4 border-sobre/80" />
      </div>
      {(erro || aviso) && <p className="bg-erro-600 p-3 text-sm">{erro || aviso}</p>}
      <div className="flex gap-2 p-3">
        <input value={link} onChange={(e) => setLink(e.target.value)} placeholder="ou cole o link do QR" className="h-11 flex-1 rounded-lg px-3 text-neutro-900" />
        <button onClick={() => pareceQrNfce(link) && onLido(link.trim())} className="rounded-lg bg-caneta-600 px-4 font-bold">
          OK
        </button>
      </div>
    </div>
  )
}
