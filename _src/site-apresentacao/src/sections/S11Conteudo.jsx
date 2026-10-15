import { useState } from "react";
import {
  Bar, BarChart, CartesianGrid, LabelList, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import D from "../conteudo/b2-conteudo.json";
import c from "../conteudo/s11-b2-conteudo.json";
import { TituloSecao, Reveal, Nota, Sanfona } from "../components/ui";
import { CartaoGrafico, Dica, Kpi, Pilulas, Tabela } from "../components/graficos";
import { COR, eixo, num } from "../formato";

const K = D.corpus;
const TIPOS = [
  { id: "casas", rotulo: "Casas de jogos" },
  { id: "lojas", rotulo: "Lojas" },
  { id: "total", rotulo: "Total" },
];
const MEDIDAS = [
  { id: "pct", rotulo: "% dos comentários" },
  { id: "pond", rotulo: "% ponderado" },
];
const COR_NEUTRA = "#cbd5e1";
const p1 = (v) => `${num(v, 1)}%`;

export default function S11Conteudo() {
  const [tipo, setTipo] = useState("casas");
  const [medida, setMedida] = useState("pct");

  const temas = D.categorias
    .map((x) => {
      const t = x[tipo];
      const pos = t.positiva[medida] ?? 0;
      const neg = t.negativa[medida] ?? 0;
      const total = t.qualquer[medida] ?? 0;
      return {
        nome: x.categoria, codigo: x.codigo, pos, neg, outra: Math.max(0, +(total - pos - neg).toFixed(1)), total,
        n: t.qualquer.n, estab: t.qualquer.estab,
      };
    })
    .sort((a, b) => b.total - a.total);
  const criticas = D.categorias
    .map((x) => ({ nome: x.categoria, parte: x[tipo].negativa.parte_criticas ?? 0, n: x[tipo].negativa.n }))
    .filter((x) => x.n > 0)
    .sort((a, b) => b.parte - a.parte);
  const notas = D.categorias
    .filter((x) => x.total.negativa.n >= 5 && x.nota.negativa != null)
    .map((x) => ({ nome: x.categoria, elogio: x.nota.positiva, critica: x.nota.negativa, n: x.total.negativa.n }))
    .sort((a, b) => a.critica - b.critica);
  const contexto = D.contexto.map((x) => ({ nome: x.categoria, casas: x.casas.pct, lojas: x.lojas.pct }));

  return (
    <>
      <TituloSecao id="conteudo" />
      <Reveal>
        <p className="mb-6 max-w-3xl text-sm leading-relaxed text-azul-800/85 sm:text-base">{c.intro}</p>
      </Reveal>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Kpi rotulo="Comentários analisados" valor={num(K.comentarios)} detalhe={`${K.excluidos} excluídos (fora do tema ou texto-modelo)`} />
        <Kpi rotulo="Estabelecimentos" valor={K.estabelecimentos} detalhe={`${K.por_tipo.casas.estabelecimentos} casas de jogos e ${K.por_tipo.lojas.estabelecimentos} lojas`} />
        <Kpi rotulo="Comentários por tipo" valor={`${num(K.por_tipo.casas.comentarios)} / ${num(K.por_tipo.lojas.comentarios)}`} detalhe="casas de jogos / lojas" />
        <Kpi rotulo="Nota média" valor={num(K.nota_media, 2)} detalhe={`${p1(K.pct_nota5)} dos comentários com nota 5`} />
        <Kpi rotulo="Menções negativas" valor={num(D.total_negativas.total)} detalhe={`${num(D.total_negativas.casas)} nas casas de jogos`} />
        <Kpi rotulo="Concentração" valor={p1(K.concentracao.pct_casas)} detalhe={`dos comentários das casas de jogos vêm de ${K.concentracao.nomes.map((n) => n.split(" ")[0]).join(" e ")}`} />
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <Pilulas opcoes={TIPOS} valor={tipo} aoMudar={setTipo} rotulo="Tipo de estabelecimento" />
        <Pilulas opcoes={MEDIDAS} valor={medida} aoMudar={setMedida} rotulo="Medida" />
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <CartaoGrafico titulo={c.temas.titulo} descricao={c.temas.descricao} className="md:col-span-2">
          <ResponsiveContainer width="100%" height={temas.length * 26 + 50}>
            <BarChart data={temas} layout="vertical" margin={{ top: 0, right: 40, left: 0, bottom: 0 }}>
              <CartesianGrid horizontal={false} stroke={COR.grade} />
              <XAxis type="number" tick={eixo} tickFormatter={(v) => `${v}%`} />
              <YAxis type="category" dataKey="nome" tick={{ ...eixo, fontSize: 10 }} width={150} interval={0}
                tickFormatter={(v) => (v.length > 26 ? `${v.slice(0, 25)}…` : v)} />
              <Tooltip content={<Dica formatar={(p) => [p.nome, `${p1(p.total)} (${p.n} comentários, ${p.estab} casas)`, `elogio ${p1(p.pos)}`, `crítica ${p1(p.neg)}`]} />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="pos" name="elogio" stackId="a" fill={COR.azul} />
              <Bar dataKey="neg" name="crítica" stackId="a" fill={COR.rosa} />
              <Bar dataKey="outra" name="mista ou neutra" stackId="a" fill={COR_NEUTRA} radius={[0, 3, 3, 0]}>
                <LabelList dataKey="total" position="right" formatter={(v) => `${num(v, 0)}%`} style={{ fontSize: 10, fill: COR.texto }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CartaoGrafico>

        <CartaoGrafico titulo={c.criticas.titulo} descricao={`${c.criticas.descricao} Total: ${num(D.total_negativas[tipo])} menções negativas.`}>
          <ResponsiveContainer width="100%" height={criticas.length * 24 + 30}>
            <BarChart data={criticas} layout="vertical" margin={{ top: 0, right: 44, left: 0, bottom: 0 }}>
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="nome" tick={{ ...eixo, fontSize: 10 }} width={130} interval={0}
                tickFormatter={(v) => (v.length > 22 ? `${v.slice(0, 21)}…` : v)} />
              <Tooltip content={<Dica formatar={(p) => [p.nome, `${p1(p.parte)} das críticas`, `${p.n} menções negativas`]} />} />
              <Bar dataKey="parte" fill={COR.rosa} radius={[0, 4, 4, 0]} barSize={14}>
                <LabelList dataKey="parte" position="right" formatter={p1} style={{ fontSize: 10, fill: COR.texto }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CartaoGrafico>

        <CartaoGrafico titulo={c.notas.titulo} descricao={c.notas.descricao}>
          <ResponsiveContainer width="100%" height={notas.length * 30 + 50}>
            <BarChart data={notas} layout="vertical" margin={{ top: 0, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid horizontal={false} stroke={COR.grade} />
              <XAxis type="number" domain={[0, 5]} ticks={[1, 2, 3, 4, 5]} tick={eixo} />
              <YAxis type="category" dataKey="nome" tick={{ ...eixo, fontSize: 10 }} width={130} interval={0}
                tickFormatter={(v) => (v.length > 22 ? `${v.slice(0, 21)}…` : v)} />
              <Tooltip content={<Dica formatar={(p) => [p.nome, `com elogio: ${num(p.elogio, 2)}`, `com crítica: ${num(p.critica, 2)} (${p.n} críticas)`]} />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="elogio" name="com elogio" fill={COR.azulClaro} barSize={9} />
              <Bar dataKey="critica" name="com crítica" fill={COR.rosa} barSize={9}>
                <LabelList dataKey="critica" position="right" formatter={(v) => num(v, 1)} style={{ fontSize: 10, fill: COR.texto }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CartaoGrafico>

        <CartaoGrafico titulo={c.contexto.titulo} descricao={c.contexto.descricao} className="md:col-span-2">
          <ResponsiveContainer width="100%" height={contexto.length * 30 + 50}>
            <BarChart data={contexto} layout="vertical" margin={{ top: 0, right: 40, left: 0, bottom: 0 }}>
              <CartesianGrid horizontal={false} stroke={COR.grade} />
              <XAxis type="number" tick={eixo} tickFormatter={(v) => `${v}%`} />
              <YAxis type="category" dataKey="nome" tick={{ ...eixo, fontSize: 10 }} width={150} interval={0}
                tickFormatter={(v) => (v.length > 26 ? `${v.slice(0, 25)}…` : v)} />
              <Tooltip formatter={(v) => p1(v)} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="casas" name="casas de jogos" fill={COR.azul} barSize={9} />
              <Bar dataKey="lojas" name="lojas" fill={COR.rosaClaro} barSize={9} />
            </BarChart>
          </ResponsiveContainer>
        </CartaoGrafico>
      </div>

      <Reveal>
        <h2 className="mt-12 font-display text-2xl font-bold text-azul-800">{c.achados.titulo}</h2>
        <p className="mt-1 mb-5 max-w-3xl text-sm text-azul-700/80">{D.achados_intro}</p>
      </Reveal>
      <div className="space-y-3">
        {D.achados.map((a, i) => (
          <Sanfona key={a.titulo} titulo={`${i + 1}. ${a.titulo}`} aberto={i === 0}>
            <div className="space-y-3 p-5">
              <p className="text-sm leading-relaxed text-azul-900">{a.texto}</p>
              {a.decisao && (
                <p className="rounded-lg border-l-4 border-roxo-600 bg-lavanda-100 px-4 py-3 text-sm leading-relaxed text-azul-950">
                  <span className="font-semibold">{c.achados.rotuloDecisao}: </span>
                  {a.decisao}
                </p>
              )}
            </div>
          </Sanfona>
        ))}
      </div>

      <Reveal>
        <h2 className="mt-12 font-display text-2xl font-bold text-azul-800">{c.estabelecimentos.titulo}</h2>
        <p className="mt-1 mb-5 max-w-3xl text-sm text-azul-700/80">{c.estabelecimentos.descricao}</p>
      </Reveal>
      <Sanfona titulo="Tabela" contagem={D.estabelecimentos.length}>
        <div className="p-3 sm:p-4">
          <Tabela
            linhas={D.estabelecimentos}
            destaque={(e) => e.capital === "Salvador"}
            colunas={[
              { rotulo: "estabelecimento", valor: (e) => <span className="font-normal">{e.nome}</span> },
              { rotulo: "metrópole", valor: (e) => e.capital },
              { rotulo: "tipo", valor: (e) => (e.tipo === "casas" ? "casa de jogos" : "loja") },
              { rotulo: "comentários", valor: (e) => e.comentarios },
              { rotulo: "nota média", valor: (e) => num(e.nota, 2) },
            ]}
          />
        </div>
      </Sanfona>

      <Nota>
        {K.controle.recodificada
          ? "Controle de qualidade: recodificação cega concluída."
          : `Controle de qualidade: amostra de ${K.controle.amostra} comentários sorteada para recodificação cega (kappa de Cohen por categoria); a recodificação ainda não foi feita, e os resultados são preliminares.`}{" "}
        {c.nota}
      </Nota>
    </>
  );
}
