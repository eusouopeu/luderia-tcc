import { useEffect, useRef, useState } from 'react'
import { App as CapApp } from '@capacitor/app'
import { ArrowUpTrayIcon, ChevronRightIcon, PlusIcon } from '@heroicons/react/24/outline'
import { useLoja } from './store'
import { agoraHora, arquivosCsv, novoId, registroAberto, siglaDe, visitaAtiva, acervoVazio, type Estado, type Registro } from './domain/model'
import { compartilhar } from './storage/exportar'
import { BotaoTema, useTemaEfetivo } from './ui/tema'
import { Unidade, type Aba, type Pagina } from './screens/Unidade'
import { FormMesa } from './screens/FormMesa'
import { FormAcervo } from './screens/FormAcervo'
import { FolhaAcoes, FolhaEditar, FolhaRegistros } from './screens/Folhas'
import { AbaMesas } from './screens/abas/Mesas'
import { AbaFluxo } from './screens/abas/Fluxo'
import { AbaAmbiente } from './screens/abas/Ambiente'
import { AbaTemporizador } from './screens/abas/Temporizador'
import { PaginaVisita } from './screens/Visita'
import { PaginaResumo } from './screens/Resumo'
import { PaginaAjustes } from './screens/Ajustes'

type Tela = {
  unidadeId?: string
  aba: Aba
  pagina: Pagina
  /** grupo aberto no formulário: existente ou novo (rascunho) */
  form?: { registro: Registro; novo: boolean }
  acervo?: boolean
  folha?: 'registros' | 'editar' | 'acoes'
}

export function App() {
  const { pronto, estado, iniciar, mudar, comecar, encerrar } = useLoja()
  useTemaEfetivo()
  const [tela, setTela] = useState<Tela>({ aba: 'mesas', pagina: 'inicio' })
  const telaRef = useRef(tela)
  telaRef.current = tela
  const muda = (p: Partial<Tela>) => setTela((t) => ({ ...t, ...p }))

  useEffect(() => {
    void iniciar()
  }, [iniciar])

  // botão voltar do Android: fecha o que está por cima, depois volta às unidades, depois sai
  useEffect(() => {
    const h = CapApp.addListener('backButton', () => {
      const t = telaRef.current
      if (t.form) setTela({ ...t, form: undefined })
      else if (t.acervo) setTela({ ...t, acervo: false })
      else if (t.folha) setTela({ ...t, folha: undefined })
      else if (t.unidadeId && t.pagina !== 'inicio') setTela({ ...t, pagina: 'inicio' })
      else if (t.unidadeId) setTela({ aba: 'mesas', pagina: 'inicio' })
      else void CapApp.exitApp()
    })
    return () => void h.then((x) => x.remove())
  }, [])

  if (!pronto) return null
  const unidade = estado.unidades.find((u) => u.id === tela.unidadeId)

  if (!unidade) {
    return (
      <Inicio
        estado={estado}
        onAbrir={(id) => setTela({ unidadeId: id, aba: 'mesas', pagina: 'inicio' })}
        onNova={() => {
          const nome = prompt('Nome da unidade')?.trim()
          if (!nome) return
          const id = novoId()
          mudar((e) => ({
            ...e,
            unidades: [
              ...e.unidades,
              { id, nome, sigla: siglaDe(nome), acervo: acervoVazio(), mesas: Array.from({ length: 6 }, (_, i) => ({ id: novoId() + i, nome: `Mesa ${i + 1}` })) },
            ],
          }))
          setTela({ unidadeId: id, aba: 'mesas', pagina: 'inicio' })
        }}
        onExportar={() => void compartilhar(arquivosCsv(estado))}
      />
    )
  }

  /** Sem visita em andamento: pergunta e começa. Devolve se há visita agora. */
  const garantirVisita = () => {
    if (visitaAtiva(useLoja.getState().estado, unidade.id)) return true
    if (!confirm('Nenhuma visita em andamento. Começar a visita agora?')) return false
    comecar(unidade.id)
    return true
  }

  function abrirMesa(mesaId: string) {
    if (!garantirVisita()) return
    const visita = visitaAtiva(useLoja.getState().estado, unidade!.id)!
    const aberto = registroAberto(useLoja.getState().estado, visita.id, mesaId)
    const registro: Registro = aberto ?? {
      id: novoId(), visitaId: visita.id, unidadeId: unidade!.id, mesaId, data: visita.inicio.slice(0, 10), aniversario: false,
      entrada: agoraHora(), saida: null, pessoas: 2, criancas: 0, instrutor: 0, jogos: [], notas: '', pedidos: [],
    }
    muda({ form: { registro, novo: !aberto } })
  }

  const mesaDoForm = tela.form && unidade.mesas.find((m) => m.id === tela.form!.registro.mesaId)
  const ativa = visitaAtiva(estado, unidade.id)

  return (
    <>
      <Unidade
        unidade={unidade}
        aba={tela.aba}
        pagina={tela.pagina}
        onAba={(aba) => muda({ aba })}
        onPagina={(pagina) => muda({ pagina })}
        onVoltar={() => setTela({ aba: 'mesas', pagina: 'inicio' })}
        onExportar={() => void compartilhar(arquivosCsv(estado, unidade.id), `Observação ${unidade.nome}`)}
      >
        {tela.pagina === 'inicio' && tela.aba === 'mesas' && (
          <AbaMesas
            unidade={unidade}
            onMesa={abrirMesa}
            onAcervo={() => muda({ acervo: true })}
            onRegistros={() => muda({ folha: 'registros' })}
            onAcoes={() => muda({ folha: 'acoes' })}
          />
        )}
        {tela.pagina === 'inicio' && tela.aba === 'fluxo' && <AbaFluxo unidade={unidade} semVisita={garantirVisita} />}
        {tela.pagina === 'inicio' && tela.aba === 'acustica' && <AbaAmbiente unidade={unidade} semVisita={garantirVisita} />}
        {tela.pagina === 'inicio' && tela.aba === 'timer' && <AbaTemporizador unidade={unidade} onMesa={abrirMesa} />}
        {tela.pagina === 'visita' && <PaginaVisita unidade={unidade} />}
        {tela.pagina === 'resumo' && <PaginaResumo unidade={unidade} />}
        {tela.pagina === 'ajustes' && (
          <PaginaAjustes
            unidade={unidade}
            onEditar={() => muda({ folha: 'editar' })}
            onApagar={() => {
              const n = estado.registros.filter((r) => r.unidadeId === unidade.id).length
              if (!confirm(`Apagar a unidade ${unidade.nome}${n ? ` e os ${n} registros dela` : ''}? Não dá para desfazer.`)) return
              const vs = new Set(estado.visitas.filter((v) => v.unidadeId === unidade.id).map((v) => v.id))
              mudar((e) => ({
                ...e,
                unidades: e.unidades.filter((u) => u.id !== unidade.id),
                visitas: e.visitas.filter((v) => !vs.has(v.id)),
                registros: e.registros.filter((r) => !vs.has(r.visitaId)),
                fluxos: e.fluxos.filter((f) => !vs.has(f.visitaId)),
                contagens: e.contagens.filter((c) => !vs.has(c.visitaId)),
                medicoes: e.medicoes.filter((m) => !vs.has(m.visitaId)),
              }))
              setTela({ aba: 'mesas', pagina: 'inicio' })
            }}
          />
        )}
      </Unidade>

      {tela.folha === 'acoes' && (
        <FolhaAcoes
          ativa={!!ativa}
          onFechar={() => muda({ folha: undefined })}
          onComecar={() => (comecar(unidade.id), muda({ folha: undefined }))}
          onEncerrar={() => {
            if (ativa && confirm('Encerrar a visita agora? Grupos ainda nas mesas ficam sem hora de saída (censurados).')) encerrar(ativa.id)
            muda({ folha: undefined })
          }}
          onRegistros={() => muda({ folha: 'registros' })}
          onEditar={() => muda({ folha: 'editar' })}
        />
      )}
      {tela.folha === 'registros' && (
        <FolhaRegistros
          estado={estado}
          unidade={unidade}
          onFechar={() => muda({ folha: undefined })}
          onAbrir={(id) => {
            const registro = estado.registros.find((r) => r.id === id)
            if (registro) muda({ folha: undefined, form: { registro, novo: false } })
          }}
        />
      )}
      {tela.folha === 'editar' && (
        <FolhaEditar
          estado={estado}
          unidade={unidade}
          onFechar={() => muda({ folha: undefined })}
          onSalvar={(u) => {
            mudar((e) => ({ ...e, unidades: e.unidades.map((x) => (x.id === u.id ? u : x)) }))
            muda({ folha: undefined })
          }}
        />
      )}
      {tela.acervo && (
        <FormAcervo
          acervo={unidade.acervo}
          onFechar={() => muda({ acervo: false })}
          onSalvar={(acervo) => {
            mudar((e) => ({ ...e, unidades: e.unidades.map((x) => (x.id === unidade.id ? { ...x, acervo } : x)) }))
            muda({ acervo: false })
          }}
        />
      )}
      {tela.form && (
        <FormMesa
          key={tela.form.registro.id}
          titulo={mesaDoForm?.nome ?? 'Mesa'}
          registro={tela.form.registro}
          acervo={unidade.acervo.jogos}
          onFechar={() => muda({ form: undefined })}
          onSalvar={(r) => {
            mudar((e) => ({
              ...e,
              registros: e.registros.some((x) => x.id === r.id) ? e.registros.map((x) => (x.id === r.id ? r : x)) : [...e.registros, r],
            }))
            muda({ form: undefined })
          }}
          onApagar={
            tela.form.novo
              ? undefined
              : () => {
                  if (!confirm('Apagar este registro?')) return
                  const id = tela.form!.registro.id
                  mudar((e) => ({ ...e, registros: e.registros.filter((x) => x.id !== id) }))
                  muda({ form: undefined })
                }
          }
        />
      )}
    </>
  )
}

function Inicio({ estado, onAbrir, onNova, onExportar }: { estado: Estado; onAbrir: (id: string) => void; onNova: () => void; onExportar: () => void }) {
  return (
    <div className="min-h-dvh bg-papel px-4 safe-bottom">
      <header className="sticky top-0 z-20 -mx-4 flex items-center bg-papel px-4 pb-4 pt-6 safe-top">
        <div className="flex-1">
          <h1 className="text-3xl font-extrabold">Observação</h1>
        </div>
        <BotaoTema />
        <button onClick={onExportar} className="p-2 text-caneta-700" aria-label="Exportar tudo em CSV">
          <ArrowUpTrayIcon className="size-7" />
        </button>
      </header>
      <ul className="space-y-3">
        {estado.unidades.map((u) => {
          const ativa = visitaAtiva(estado, u.id)
          const n = estado.registros.filter((r) => r.unidadeId === u.id).length
          return (
            <li key={u.id}>
              <button onClick={() => onAbrir(u.id)} className="flex w-full items-center gap-3 rounded-xl bg-neutro-100 p-4 text-left">
                <span className="flex-1 text-lg font-extrabold uppercase">{u.nome}</span>
                {ativa ? (
                  <span className="rounded-full bg-caneta-600 px-2 py-0.5 text-xs font-bold text-sobre">ao vivo</span>
                ) : (
                  <span className="text-sm text-neutro-500" title="grupos registrados">{n}</span>
                )}
                <ChevronRightIcon className="size-5" />
              </button>
            </li>
          )
        })}
      </ul>
      <button onClick={onNova} aria-label="Nova unidade" title="Nova unidade" className="mx-auto mt-4 grid size-12 place-items-center rounded-full bg-neutro-100 text-neutro-700">
        <PlusIcon className="size-6" />
      </button>
      <p className="mt-8 text-center text-xs text-neutro-400">v{__APP_VERSION__}</p>
    </div>
  )
}
