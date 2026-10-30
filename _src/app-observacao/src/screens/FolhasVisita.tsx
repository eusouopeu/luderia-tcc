import { useState } from 'react'
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { Folha, Opcao, campo } from '../ui/comum'
import {
  agoraIso, ativaEmOutra, gruposDentro, isoNaVisita, PAPEIS, ultimoRegistro,
  type Estado, type Papel, type Unidade, type Visita,
} from '../domain/model'

/** Código de observador aceito: letras, números e hífen (POV1, POV2). */
export const codigoValido = (c: string) => /^[A-Z0-9-]{2,8}$/.test(c)
const formatarCnpj = (c: string) => (c.length === 14 ? c.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5') : c)

function Alerta({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-3 flex gap-2 rounded-lg bg-alerta-100 p-3 text-[15px] text-alerta-700">
      <ExclamationTriangleIcon className="size-5 shrink-0" />
      <span>{children}</span>
    </p>
  )
}

/**
 * Começar a visita: confirma a unidade (nome, sigla e CNPJ, para não observar uma casa com o
 * cadastro de outra) e exige o código do observador, que vai em todos os CSVs.
 */
export function FolhaComecar({
  estado,
  unidade,
  onComecar,
  onTrocar,
  onFechar,
}: {
  estado: Estado
  unidade: Unidade
  onComecar: (quem: { observador: string; papel: Papel }) => void
  onTrocar: () => void
  onFechar: () => void
}) {
  const [observador, setObservador] = useState(estado.config.observador)
  const [papel, setPapel] = useState<Papel>('')
  const outra = ativaEmOutra(estado, unidade.id)
  const nomeOutra = outra && estado.unidades.find((u) => u.id === outra.unidadeId)?.nome
  const ok = codigoValido(observador)
  return (
    <Folha titulo="Começar visita" onFechar={onFechar}>
      <div className="rounded-xl bg-caneta-100 p-4">
        <p className="text-xs font-bold uppercase text-caneta-700">Unidade</p>
        <p className="text-2xl font-extrabold uppercase">{unidade.nome}</p>
        <p className="text-sm text-neutro-600">
          Sigla {unidade.sigla} · {unidade.cnpj ? `CNPJ ${formatarCnpj(unidade.cnpj)}` : 'CNPJ ainda não conhecido (a 1ª NFC-e grava)'}
        </p>
        <button onClick={onTrocar} className="mt-2 text-sm font-bold text-caneta-700 underline">
          Não é esta? Trocar de unidade
        </button>
      </div>
      {outra && (
        <Alerta>
          Há uma visita em andamento em <b>{nomeOutra}</b> desde {outra.inicio.slice(11, 16)}. Encerre-a antes, se ela não estiver mais acontecendo.
        </Alerta>
      )}

      <p className="mb-1.5 mt-5 text-sm font-bold uppercase">Observador</p>
      <div className="flex items-center gap-2">
        {['POV1', 'POV2'].map((c) => (
          <Opcao key={c} ativo={observador === c} onClick={() => setObservador(c)}>
            {c}
          </Opcao>
        ))}
        <input
          value={observador}
          onChange={(e) => setObservador(e.target.value.toUpperCase().replace(/\s/g, ''))}
          placeholder="Outro código"
          aria-label="Código do observador"
          maxLength={8}
          className={`${campo} flex-1`}
        />
      </div>
      {!ok && <p className="mt-1 text-sm text-erro-600">Escolha o código deste celular (POV1 ou POV2): ele identifica os arquivos exportados.</p>}

      <p className="mb-1.5 mt-5 text-sm font-bold uppercase">O que este celular cobre</p>
      <div className="flex flex-wrap gap-2">
        {PAPEIS.map((p) => (
          <Opcao key={p} ativo={papel === p} onClick={() => setPapel(papel === p ? '' : p)}>
            {p}
          </Opcao>
        ))}
      </div>

      <button
        disabled={!ok}
        onClick={() => onComecar({ observador, papel })}
        className="mt-6 h-12 w-full rounded-lg bg-caneta-600 font-bold text-sobre disabled:opacity-40"
      >
        Começar em {unidade.nome}
      </button>
    </Folha>
  )
}

/** Diferença acima da qual o fim sugerido passa a ser o último registro, não agora. */
const FOLGA_MIN = 15

/**
 * Encerrar a visita: sugere como fim a hora do último registro quando o app é fechado bem
 * depois (16/10: observação até 22h, encerrada às 23h40). Também pede a condição do dia.
 */
export function FolhaEncerrar({
  estado,
  visita,
  onEncerrar,
  onFechamento,
  onFechar,
}: {
  estado: Estado
  visita: Visita
  onEncerrar: (fim: string, diaComum: boolean) => void
  onFechamento: () => void
  onFechar: () => void
}) {
  const agora = agoraIso()
  const ult = ultimoRegistro(estado, visita.id)
  const atrasado = !!ult && new Date(agora).getTime() - new Date(ult.iso).getTime() > FOLGA_MIN * 60000
  const [opcao, setOpcao] = useState<'ultimo' | 'agora' | 'outra'>(atrasado ? 'ultimo' : 'agora')
  const [outra, setOutra] = useState((ult?.iso ?? agora).slice(11, 16))
  const [diaComum, setDiaComum] = useState(false)
  const outraIso = isoNaVisita(visita, outra)
  const fim = opcao === 'ultimo' && ult ? ult.iso : opcao === 'outra' ? outraIso : agora
  const valido = !!fim && fim >= visita.inicio && fim <= agora
  const nasMesas = estado.registros.filter((r) => r.visitaId === visita.id && r.saida === null).length
  const naPorta = gruposDentro(estado, visita.id).length
  const linha = (id: typeof opcao, rotulo: string, detalhe: string) => (
    <label className={`flex items-center gap-3 rounded-lg px-3 py-3 ${opcao === id ? 'bg-caneta-100' : 'bg-neutro-100'}`}>
      <input type="radio" name="fim" checked={opcao === id} onChange={() => setOpcao(id)} className="size-5 accent-caneta-600" />
      <span className="flex-1 font-semibold">{rotulo}</span>
      <span className="text-sm text-neutro-600">{detalhe}</span>
    </label>
  )
  return (
    <Folha titulo="Encerrar visita" onFechar={onFechar}>
      <p className="mb-1.5 text-sm font-bold uppercase">A observação terminou às</p>
      <div className="space-y-2">
        {ult && linha('ultimo', `${ult.iso.slice(11, 16)} · último registro`, ult.origem)}
        {linha('agora', `${agora.slice(11, 16)} · agora`, '')}
        <label className={`flex items-center gap-3 rounded-lg px-3 py-2 ${opcao === 'outra' ? 'bg-caneta-100' : 'bg-neutro-100'}`}>
          <input type="radio" name="fim" checked={opcao === 'outra'} onChange={() => setOpcao('outra')} className="size-5 accent-caneta-600" />
          <span className="flex-1 font-semibold">Outra hora</span>
          <input
            type="time"
            value={outra}
            onFocus={() => setOpcao('outra')}
            onChange={(e) => e.target.value && setOutra(e.target.value)}
            aria-label="Hora do fim"
            className="h-9 w-24 rounded-md bg-papel text-center outline-none"
          />
        </label>
      </div>
      {atrasado && opcao === 'agora' && <Alerta>O último registro foi às {ult!.iso.slice(11, 16)}. Se a observação parou ali, use essa hora.</Alerta>}
      {!valido && <p className="mt-2 text-sm text-erro-600">A hora tem de ficar entre o início ({visita.inicio.slice(11, 16)}) e agora.</p>}

      {nasMesas + naPorta > 0 && (
        <Alerta>
          {[nasMesas && `${nasMesas} grupo(s) nas mesas`, naPorta && `${naPorta} na porta`].filter(Boolean).join(' e ')} ficam sem saída (censurados).{' '}
          <button onClick={onFechamento} className="font-bold underline">
            Fazer o fechamento da casa antes
          </button>
        </Alerta>
      )}

      {!visita.ficha.condicoes.length && (
        <>
          <p className="mb-1.5 mt-5 text-sm font-bold uppercase">Condição do dia</p>
          <Opcao ativo={diaComum} onClick={() => setDiaComum(!diaComum)}>
            Dia comum (sem feriado, evento, chuva ou jogo)
          </Opcao>
          <p className="mt-1 text-xs text-neutro-500">Se não foi, marque a condição na página Visita.</p>
        </>
      )}

      <button
        disabled={!valido}
        onClick={() => onEncerrar(fim!, diaComum)}
        className="mt-6 h-12 w-full rounded-lg bg-neutro-800 font-bold text-neutro-50 disabled:opacity-40"
      >
        Encerrar às {fim?.slice(11, 16) ?? '—'}
      </button>
    </Folha>
  )
}

/** Nova unidade: nome, sigla do pipeline (SJ<sigla>) e, se já conhecido, o CNPJ das notas. */
export function FolhaNovaUnidade({ onCriar, onFechar }: { onCriar: (u: { nome: string; sigla: string; cnpj: string }) => void; onFechar: () => void }) {
  const [nome, setNome] = useState('')
  const [sigla, setSigla] = useState('')
  const [cnpj, setCnpj] = useState('')
  const digitos = cnpj.replace(/\D/g, '')
  const ok = nome.trim() && sigla.trim() && (!digitos || digitos.length === 14)
  return (
    <Folha titulo="Nova unidade" onFechar={onFechar}>
      <div className="flex gap-2">
        <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome (ex.: Paralela)" aria-label="Nome" className={campo} autoFocus />
        <input
          value={sigla}
          onChange={(e) => setSigla(e.target.value.toUpperCase().replace(/[^A-Z]/g, ''))}
          placeholder="Sigla"
          aria-label="Sigla"
          maxLength={4}
          className={`${campo} !w-24 text-center`}
        />
      </div>
      <input value={cnpj} onChange={(e) => setCnpj(e.target.value)} inputMode="numeric" placeholder="CNPJ (opcional: a 1ª NFC-e grava)" aria-label="CNPJ" className={`${campo} mt-2`} />
      {digitos && digitos.length !== 14 && <p className="mt-1 text-sm text-erro-600">O CNPJ tem 14 dígitos.</p>}
      <button disabled={!ok} onClick={() => onCriar({ nome: nome.trim(), sigla: sigla.trim(), cnpj: digitos })} className="mt-4 h-12 w-full rounded-lg bg-caneta-600 font-bold text-sobre disabled:opacity-40">
        Criar unidade
      </button>
    </Folha>
  )
}
