import { useEffect, useRef, useState } from 'react'
import { App as CapApp } from '@capacitor/app'
import { ArrowUpTrayIcon, ChevronRightIcon, PlusIcon } from '@heroicons/react/24/outline'
import { useLoja } from './store'
import {
  agoraHora,
  agoraIso,
  hojeIso,
  novoId,
  paraCsv,
  registroAberto,
  visitaAtiva,
  type Estado,
  type Registro,
} from './domain/model'
import { compartilharCsv } from './storage/exportar'
import { Unidade } from './screens/Unidade'
import { FormMesa } from './screens/FormMesa'
import { FolhaEditar, FolhaRegistros } from './screens/Folhas'

type Tela = {
  unidadeId?: string
  /** registro aberto no formulário: existente (id) ou novo (rascunho) */
  form?: { registro: Registro; novo: boolean }
  folha?: 'registros' | 'editar'
}

const nomeArquivo = (sufixo: string) => `observacao_${sufixo}_${hojeIso()}.csv`.toLowerCase().replace(/\s+/g, '-')

export function App() {
  const { pronto, estado, iniciar, mudar } = useLoja()
  const [tela, setTela] = useState<Tela>({})
  const telaRef = useRef(tela)
  telaRef.current = tela

  useEffect(() => {
    void iniciar()
  }, [iniciar])

  // botão voltar do Android: fecha formulário/folha, depois volta ao início, depois sai
  useEffect(() => {
    const h = CapApp.addListener('backButton', () => {
      const t = telaRef.current
      if (t.form) setTela({ ...t, form: undefined })
      else if (t.folha) setTela({ ...t, folha: undefined })
      else if (t.unidadeId) setTela({})
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
        onAbrir={(id) => setTela({ unidadeId: id })}
        onNova={() => {
          const nome = prompt('Nome da unidade')?.trim()
          if (!nome) return
          const id = novoId()
          mudar((e) => ({
            ...e,
            unidades: [...e.unidades, { id, nome, mesas: Array.from({ length: 6 }, (_, i) => ({ id: novoId() + i, nome: `Mesa ${i + 1}` })) }],
          }))
          setTela({ unidadeId: id })
        }}
        onExportar={() => void compartilharCsv(nomeArquivo('todas'), paraCsv(estado))}
      />
    )
  }

  const comecar = (e: Estado): Estado => ({
    ...e,
    visitas: [...e.visitas, { id: novoId(), unidadeId: unidade.id, inicio: agoraIso(), fim: null }],
  })

  function abrirMesa(mesaId: string) {
    let visita = visitaAtiva(estado, unidade!.id)
    if (!visita) {
      if (!confirm('Nenhuma visita em andamento. Começar a visita agora?')) return
      const e = comecar(estado)
      mudar(() => e)
      visita = visitaAtiva(e, unidade!.id)!
    }
    const aberto = registroAberto(estado, visita.id, mesaId)
    const registro: Registro = aberto ?? {
      id: novoId(),
      visitaId: visita.id,
      unidadeId: unidade!.id,
      mesaId,
      data: visita.inicio.slice(0, 10),
      aniversario: false,
      entrada: agoraHora(),
      saida: null,
      pessoas: 2,
      criancas: 0,
      instrutor: 0,
      notas: '',
    }
    setTela({ ...tela, form: { registro, novo: !aberto } })
  }

  const mesaDoForm = tela.form && unidade.mesas.find((m) => m.id === tela.form!.registro.mesaId)

  return (
    <>
      <Unidade
        estado={estado}
        unidade={unidade}
        onVoltar={() => setTela({})}
        onExportar={() => void compartilharCsv(nomeArquivo(unidade.nome), paraCsv(estado, unidade.id))}
        onApagar={() => {
          const n = estado.registros.filter((r) => r.unidadeId === unidade.id).length
          if (!confirm(`Apagar a unidade ${unidade.nome}${n ? ` e os ${n} registros dela` : ''}? Não dá para desfazer.`)) return
          mudar((e) => ({
            unidades: e.unidades.filter((u) => u.id !== unidade.id),
            visitas: e.visitas.filter((v) => v.unidadeId !== unidade.id),
            registros: e.registros.filter((r) => r.unidadeId !== unidade.id),
          }))
          setTela({})
        }}
        onEditar={() => setTela({ ...tela, folha: 'editar' })}
        onComecar={() => mudar(comecar)}
        onEncerrar={() => {
          const v = visitaAtiva(estado, unidade.id)
          if (!v || !confirm('Encerrar a visita agora? Grupos ainda nas mesas ficam sem hora de saída (censurados).')) return
          mudar((e) => ({ ...e, visitas: e.visitas.map((x) => (x.id === v.id ? { ...x, fim: agoraIso() } : x)) }))
        }}
        onMesa={abrirMesa}
        onRegistros={() => setTela({ ...tela, folha: 'registros' })}
      />

      {tela.folha === 'registros' && (
        <FolhaRegistros
          estado={estado}
          unidade={unidade}
          onFechar={() => setTela({ ...tela, folha: undefined })}
          onAbrir={(id) => {
            const registro = estado.registros.find((r) => r.id === id)
            if (registro) setTela({ ...tela, folha: undefined, form: { registro, novo: false } })
          }}
        />
      )}
      {tela.folha === 'editar' && (
        <FolhaEditar
          estado={estado}
          unidade={unidade}
          onFechar={() => setTela({ ...tela, folha: undefined })}
          onSalvar={(u) => {
            mudar((e) => ({ ...e, unidades: e.unidades.map((x) => (x.id === u.id ? u : x)) }))
            setTela({ ...tela, folha: undefined })
          }}
        />
      )}

      {tela.form && (
        <FormMesa
          key={tela.form.registro.id}
          titulo={mesaDoForm?.nome ?? 'Mesa'}
          registro={tela.form.registro}
          onFechar={() => setTela({ ...tela, form: undefined })}
          onSalvar={(r) => {
            mudar((e) => ({
              ...e,
              registros: e.registros.some((x) => x.id === r.id) ? e.registros.map((x) => (x.id === r.id ? r : x)) : [...e.registros, r],
            }))
            setTela({ ...tela, form: undefined })
          }}
          onApagar={
            tela.form.novo
              ? undefined
              : () => {
                  if (!confirm('Apagar este registro?')) return
                  const id = tela.form!.registro.id
                  mudar((e) => ({ ...e, registros: e.registros.filter((x) => x.id !== id) }))
                  setTela({ ...tela, form: undefined })
                }
          }
        />
      )}
    </>
  )
}

function Inicio({
  estado,
  onAbrir,
  onNova,
  onExportar,
}: {
  estado: Estado
  onAbrir: (id: string) => void
  onNova: () => void
  onExportar: () => void
}) {
  return (
    <div className="min-h-dvh bg-white px-4 safe-top safe-bottom">
      <header className="flex items-center pb-4 pt-6">
        <div className="flex-1">
          <p className="text-xs font-bold uppercase tracking-wide text-purple-700">TCC Luderia · Bloco D</p>
          <h1 className="text-3xl font-extrabold">Observação</h1>
        </div>
        <button onClick={onExportar} className="p-2 text-purple-700" aria-label="Exportar tudo em CSV">
          <ArrowUpTrayIcon className="size-7" />
        </button>
      </header>
      <ul className="space-y-3">
        {estado.unidades.map((u) => {
          const ativa = visitaAtiva(estado, u.id)
          const n = estado.registros.filter((r) => r.unidadeId === u.id).length
          return (
            <li key={u.id}>
              <button onClick={() => onAbrir(u.id)} className="flex w-full items-center gap-3 rounded-xl bg-slate-100 p-4 text-left">
                <span className="flex-1">
                  <span className="block text-lg font-extrabold uppercase">{u.nome}</span>
                  <span className="text-sm text-slate-600">
                    {u.mesas.length} mesas · {n} registros
                    {ativa && <b className="text-purple-700"> · visita em andamento</b>}
                  </span>
                </span>
                <ChevronRightIcon className="size-5" />
              </button>
            </li>
          )
        })}
      </ul>
      <button onClick={onNova} className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 font-bold text-slate-600">
        <PlusIcon className="size-5" /> Nova unidade
      </button>
      <p className="mt-8 text-center text-xs text-slate-400">v{__APP_VERSION__}</p>
    </div>
  )
}
