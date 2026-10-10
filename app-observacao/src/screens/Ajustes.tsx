import { useRef, useState, type ReactNode } from 'react'
import { useLoja } from '../store'
import { ContadorH } from '../ui/comum'
import { arquivosCsv, hojeIso, type Config, type Unidade } from '../domain/model'
import { gravarBackup, lerBackup, ultimoBackup } from '../storage/backup'
import { compartilhar } from '../storage/exportar'

/** Calibração, roteiro, backup, exportação e a unidade (mesas, apagar). */
export function PaginaAjustes({ unidade, onEditar, onApagar }: { unidade: Unidade; onEditar: () => void; onApagar: () => void }) {
  const { estado, mudar, substituir } = useLoja()
  const [msg, setMsg] = useState('')
  const arquivo = useRef<HTMLInputElement>(null)
  const c = estado.config
  const muda = (p: Partial<Config>) => mudar((e) => ({ ...e, config: { ...e.config, ...p } }))
  const ult = ultimoBackup()

  return (
    <div className="px-4 pb-10">
      <Secao titulo="Microfone">
        <p className="mb-2 text-sm text-slate-600">
          Calibração somada ao nível do microfone (dBFS). Ajuste até o app bater com um decibelímetro no mesmo lugar. Padrão: 90.
        </p>
        <ContadorH valor={c.calibracaoDb} sufixo=" dB" onChange={(v) => muda({ calibracaoDb: v })} />
      </Secao>

      <Secao titulo="Roteiro das próximas visitas">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="mb-1 text-sm">Duração (min)</p>
            <ContadorH valor={c.duracaoMin} onChange={(v) => muda({ duracaoMin: Math.max(30, c.duracaoMin + (v > c.duracaoMin ? 30 : -30)) })} />
          </div>
          <div>
            <p className="mb-1 text-sm">Contagem a cada (min)</p>
            <ContadorH valor={c.intervaloMin} onChange={(v) => muda({ intervaloMin: Math.max(5, v) })} />
          </div>
        </div>
      </Secao>

      <Secao titulo="Exportar">
        <Botao onClick={() => void compartilhar(arquivosCsv(estado, unidade.id), `Observação ${unidade.nome}`)}>CSVs desta unidade</Botao>
        <Botao onClick={() => void compartilhar([...arquivosCsv(estado), { nome: `observacao-backup-${hojeIso()}.json`, conteudo: JSON.stringify({ app: 'observacao-luderia', versao: 2, estado }) }])}>
          Tudo (CSVs + backup JSON)
        </Botao>
      </Secao>

      <Secao titulo="Backup">
        <p className="mb-2 text-sm text-slate-600">
          Automático a cada mudança, em Documentos/ObservacaoLuderia (um arquivo por dia). {ult ? `Último: ${ult.quando}, em ${ult.onde}.` : ''}
        </p>
        <Botao onClick={async () => setMsg((await gravarBackup(estado)) ? 'Backup gravado.' : 'Backup só funciona no celular.')}>Fazer backup agora</Botao>
        <Botao onClick={() => arquivo.current?.click()}>Restaurar backup…</Botao>
        <input
          ref={arquivo}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={async (ev) => {
            const f = ev.target.files?.[0]
            if (!f) return
            const e = lerBackup(await f.text())
            if (!e) return setMsg('Arquivo não reconhecido.')
            if (confirm(`Substituir os dados atuais pelo backup (${e.registros?.length ?? 0} grupos, ${e.visitas?.length ?? 0} visitas)?`)) {
              substituir(e)
              setMsg('Backup restaurado.')
            }
          }}
        />
        {msg && <p className="mt-2 text-sm font-semibold text-emerald-700">{msg}</p>}
      </Secao>

      <Secao titulo={`Unidade ${unidade.nome}`}>
        <Botao onClick={onEditar}>Editar nome, sigla e mesas</Botao>
        <button onClick={onApagar} className="mt-2 h-11 w-full rounded-lg bg-rose-100 font-bold text-rose-600">
          Apagar unidade
        </button>
      </Secao>
      <p className="mt-8 text-center text-xs text-slate-400">Observação Luderia v{__APP_VERSION__}</p>
    </div>
  )
}

function Secao({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="mt-6">
      <h3 className="mb-2 text-[13px] font-extrabold uppercase">{titulo}</h3>
      {children}
    </section>
  )
}

function Botao({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button onClick={onClick} className="mt-2 h-11 w-full rounded-lg bg-slate-200 font-semibold">
      {children}
    </button>
  )
}
