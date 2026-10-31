import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useLoja } from '../store'
import { campo, ContadorH, Opcao, Secao } from '../ui/comum'
import { arquivosCsv, hojeIso, type Config, type Unidade } from '../domain/model'
import { gravarBackup, lerBackup, lerVersao, listarVersoes, MAX_VERSOES, rotuloVersao, ultimoBackup, VERSAO_MIN } from '../storage/backup'
import { compartilhar } from '../storage/exportar'
import { uriDaFoto } from '../storage/fotos'
import { Transferir } from './Transferir'

/** Calibração, roteiro, backup, exportação e a unidade (mesas, apagar). */
export function PaginaAjustes({ unidade, onEditar, onApagar }: { unidade: Unidade; onEditar: () => void; onApagar: () => void }) {
  const { estado, mudar, substituir } = useLoja()
  const [msg, setMsg] = useState('')
  const arquivo = useRef<HTMLInputElement>(null)
  const c = estado.config
  const muda = (p: Partial<Config>) => mudar((e) => ({ ...e, config: { ...e.config, ...p } }))
  const ult = ultimoBackup()
  const [versoes, setVersoes] = useState<string[]>([])
  const [todas, setTodas] = useState(false)
  useEffect(() => void listarVersoes().then(setVersoes), [])
  /** Substitui pelo backup; antes guarda uma versão do estado atual, para poder voltar. */
  const restaurar = async (e: Partial<typeof estado> | null, origem: string) => {
    if (!e) return setMsg('Arquivo não reconhecido.')
    if (!confirm(`Substituir os dados atuais por ${origem} (${e.registros?.length ?? 0} grupos, ${e.visitas?.length ?? 0} visitas)? O estado atual fica guardado como versão.`)) return
    await gravarBackup(estado, true)
    substituir(e)
    setMsg('Backup restaurado.')
    setVersoes(await listarVersoes())
  }

  return (
    <div className="px-4 pb-10">
      <Secao titulo="Tema">
        <div className="flex gap-2">
          {(['sistema', 'claro', 'escuro'] as const).map((t) => (
            <Opcao key={t} ativo={c.tema === t} onClick={() => muda({ tema: t })}>
              {t === 'sistema' ? 'Do sistema' : t === 'claro' ? 'Claro' : 'Escuro'}
            </Opcao>
          ))}
        </div>
      </Secao>

      <Secao
        titulo="Observador deste celular"
        ajuda="Código que vai em todas as exportações e no nome dos arquivos (ex.: 2026-10-17_SJBV_POV1_contagem_fluxo.csv). Prefixo da casa: SJ = São Jogue."
      >
        <div className="flex gap-2">
          <input value={c.observador} onChange={(e) => muda({ observador: e.target.value.toUpperCase() })} placeholder="POV1" aria-label="Código do observador" className={campo} />
          <input value={c.prefixoCasa} onChange={(e) => muda({ prefixoCasa: e.target.value.toUpperCase() })} placeholder="SJ" aria-label="Prefixo da casa" maxLength={4} className={`${campo} !w-20 text-center`} />
        </div>
      </Secao>

      <Secao titulo="Microfone" ajuda="Calibração somada ao nível do microfone (dBFS). Ajuste até o app bater com um decibelímetro no mesmo lugar. Padrão: 90.">
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
        <Botao
          onClick={async () => {
            const uris = (await Promise.all(estado.fotos.filter((f) => f.unidadeId === unidade.id).map((f) => uriDaFoto(f.arquivo)))).filter((u): u is string => !!u)
            if (!uris.length) return setMsg('Sem fotos no celular para exportar.')
            const { Share } = await import('@capacitor/share')
            await Share.share({ title: `Fotos ${unidade.nome}`, files: uris })
          }}
        >
          Fotos desta unidade ({estado.fotos.filter((f) => f.unidadeId === unidade.id).length})
        </Botao>
      </Secao>

      <Secao
        titulo="Outro celular"
        ajuda="Copia todos os dados para outro celular com o app: num toque em Enviar, no outro em Receber, e encoste as costas dos dois (NFC). A cópia vai por Bluetooth. Quem recebe escolhe juntar (soma o que é novo) ou substituir. Precisa de Android 10+, NFC e Bluetooth ligados. As fotos não vão junto, só as miniaturas."
      >
        <Transferir />
      </Secao>

      <Secao
        titulo="Backup"
        ajuda={
          <>
            Automático a cada mudança, em Documentos/ObservacaoLuderia (um arquivo por dia), mais uma versão a cada {VERSAO_MIN} min em versoes/ (ficam as {MAX_VERSOES} mais
            recentes). {ult ? `Último: ${ult.quando}, em ${ult.onde}.` : ''}
          </>
        }
      >
        <Botao
          onClick={async () => {
            setMsg((await gravarBackup(estado, true)) ? 'Backup gravado.' : 'Backup só funciona no celular.')
            setVersoes(await listarVersoes())
          }}
        >
          Fazer backup agora
        </Botao>
        {versoes.length > 0 && (
          <ul className="mt-2 divide-y divide-papel overflow-hidden rounded-lg bg-neutro-100">
            {(todas ? versoes : versoes.slice(0, 5)).map((n) => (
              <li key={n} className="flex items-center px-3 py-2">
                <span className="flex-1 text-[15px] tabular-nums">{rotuloVersao(n)}</span>
                <button onClick={async () => restaurar(await lerVersao(n), `a versão de ${rotuloVersao(n)}`)} className="px-2 py-1 text-sm font-bold text-caneta-700">
                  Restaurar
                </button>
              </li>
            ))}
            {versoes.length > 5 && (
              <li>
                <button onClick={() => setTodas(!todas)} className="w-full px-3 py-2 text-left text-sm font-semibold text-neutro-600">
                  {todas ? 'Mostrar menos' : `Ver as ${versoes.length} versões`}
                </button>
              </li>
            )}
          </ul>
        )}
        <Botao onClick={() => arquivo.current?.click()}>Restaurar backup…</Botao>
        <input
          ref={arquivo}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={async (ev) => {
            const f = ev.target.files?.[0]
            if (!f) return
            await restaurar(lerBackup(await f.text()), 'o backup')
            ev.target.value = ''
          }}
        />
        {msg && <p className="mt-2 text-sm font-semibold text-ok-700">{msg}</p>}
      </Secao>

      <Secao titulo={`Unidade ${unidade.nome}`}>
        <Botao onClick={onEditar}>Editar nome, sigla e mesas</Botao>
        <button onClick={onApagar} className="mt-2 h-11 w-full rounded-lg bg-erro-100 font-bold text-erro-600">
          Apagar unidade
        </button>
      </Secao>
      <p className="mt-8 text-center text-xs text-neutro-400">Observação Luderia v{__APP_VERSION__}</p>
    </div>
  )
}


function Botao({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button onClick={onClick} className="mt-2 h-11 w-full rounded-lg bg-neutro-200 font-semibold">
      {children}
    </button>
  )
}
