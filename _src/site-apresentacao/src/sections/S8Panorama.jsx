import { useState } from "react";
import {
  Bar, BarChart, CartesianGrid, Cell, LabelList, ReferenceLine, ResponsiveContainer,
  Scatter, ScatterChart, Tooltip, XAxis, YAxis,
} from "recharts";
import D from "../conteudo/b1-estatisticas.json";
import c from "../conteudo/s8-b1-resultados.json";
import { achadosGerais } from "../conteudo/b1-achados";
import { TituloSecao, Reveal, Nota, Sanfona } from "../components/ui";
import { Achados, CartaoGrafico, Dica, Kpi, Pilulas, Tabela } from "../components/graficos";
import { COR, eixo, milhar, num, pct, porUnidade, reais } from "../formato";

const T = c.panorama;
const G = D.geral;
const GRUPOS = [...new Set(Object.values(G).map((v) => v.grupo))];
const salvador = (p) => p.metropole === "Salvador";
// Só cestas com bebida e entrada ou prato no cardápio (sem couvert, couvert 0).
const CESTAS = D.cestas.filter((p) => p.completa);
const mediana = (xs) => {
  const v = [...xs].sort((a, b) => a - b);
  const m = Math.floor(v.length / 2);
  return v.length % 2 ? v[m] : (v[m - 1] + v[m]) / 2;
};
const MEDIANA_CESTAS = mediana(CESTAS.map((p) => p.mediana));
const MEDIDAS = [{ id: "media", rotulo: "Média" }, { id: "mediana", rotulo: "Mediana" }];
const MODOS = [{ id: "simples", rotulo: "Simplificado" }, { id: "completo", rotulo: "Completo" }];
const nomeMedida = { media: "média", mediana: "mediana" };

/* Tabela de um grupo de variáveis, com seletor entre o modo simplificado e o completo. */
function TabelaGrupo({ linhas }) {
  const [modo, setModo] = useState("simples");
  const f = (campo) => (l) => porUnidade(l[campo], l.unidade);
  const cv = { rotulo: "CV", valor: (l) => (l.cv == null ? "—" : num(l.cv, 2)) };
  const base = [
    { rotulo: "variável", valor: (l) => <span className="font-normal">{l.rotulo}</span> },
    { rotulo: "n", valor: (l) => l.n },
    { rotulo: "média", valor: f("media") },
    { rotulo: "mediana", valor: f("mediana") },
    { rotulo: "DP", valor: f("dp") },
  ];
  const extras = [
    { rotulo: "mín.", valor: f("min") },
    { rotulo: "P25", valor: f("p25") },
    { rotulo: "P75", valor: f("p75") },
    { rotulo: "máx.", valor: f("max") },
    { rotulo: "amplitude", valor: f("amplitude") },
  ];
  return (
    <div className="space-y-3 p-3 sm:p-4">
      <Pilulas opcoes={MODOS} valor={modo} aoMudar={setModo} rotulo="Nível de detalhe da tabela" />
      <Tabela linhas={linhas} colunas={modo === "simples" ? [...base, cv] : [...base, ...extras, cv]} />
    </div>
  );
}

export default function S8Panorama() {
  const [medida, setMedida] = useState("media");
  return (
    <>
      <TituloSecao id="panorama" />
      <Reveal>
        <p className="mb-6 max-w-3xl text-sm leading-relaxed text-azul-800/85 sm:text-base">{T.intro}</p>
      </Reveal>

      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-semibold tracking-wide text-azul-700/70 uppercase">Resumo das 54 casas</p>
        <Pilulas opcoes={MEDIDAS} valor={medida} aoMudar={setMedida} rotulo="Medida dos cartões" />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Kpi rotulo="Luderias" valor={D.total_casas} detalhe={`${D.n_metropoles} metrópoles`} />
        <Kpi rotulo={`Nota (${nomeMedida[medida]})`} valor={num(G.avaliacao_media[medida], medida === "media" ? 2 : 1)} detalhe={`${num(G.avaliacao_media.min, 1)} a ${num(G.avaliacao_media.max, 1)}`} />
        <Kpi rotulo={`Avaliações (${nomeMedida[medida]})`} valor={num(G.volume_avaliacoes[medida])} detalhe="no Google" />
        <Kpi rotulo={`Cesta (${nomeMedida[medida]})`} valor={reais(G.cesta_mediana[medida])} detalhe={`cesta mediana de ${G.cesta_mediana.n} casas com cardápio`} />
        <Kpi rotulo={`Seguidores (${nomeMedida[medida]})`} valor={milhar(G.seguidores[medida])} detalhe="no Instagram" />
        <Kpi rotulo={`Horas por semana (${nomeMedida[medida]})`} valor={num(G.horas_semana[medida], medida === "media" ? 1 : 0)} detalhe="abertas" />
        <Kpi rotulo={`Itens no cardápio (${nomeMedida[medida]})`} valor={num(G.itens_com_preco[medida], 1)} detalhe={`itens com preço, em ${G.itens_com_preco.n} casas`} />
        <Kpi rotulo={`Posts de 01/09 a 01/10 (${nomeMedida[medida]})`} valor={num(G.n_posts_periodo[medida], 1)} detalhe={`por perfil, em ${G.n_posts_periodo.n} casas`} />
        <Kpi rotulo={`Comentários de 01/09 a 01/10 (${nomeMedida[medida]})`} valor={num(G.comentarios_periodo[medida], medida === "media" ? 1 : 0)} detalhe="total nos posts do período, por perfil" />
      </div>

      <div className="mt-6">
        <Achados titulo={T.achados} itens={achadosGerais()} />
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <CartaoGrafico titulo={T.dias.titulo} descricao={T.dias.descricao} className="md:col-span-2">
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={D.dias} margin={{ top: 20, right: 8, left: -18, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke={COR.grade} />
              <XAxis dataKey="dia" tick={eixo} />
              <YAxis tick={eixo} domain={[0, 1]} tickFormatter={(v) => pct(v)} />
              <Tooltip content={<Dica formatar={(p) => [p.dia, `${p.casas} casas (${pct(p.pct)})`]} />} />
              <Bar dataKey="pct" radius={[4, 4, 0, 0]}>
                {D.dias.map((d) => <Cell key={d.dia} fill={d.pct === 1 ? COR.azul : COR.azulClaro} />)}
                <LabelList dataKey="pct" position="top" formatter={(v) => pct(v)} style={{ fontSize: 11, fill: COR.texto }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CartaoGrafico>

        {[["abertura", D.abertura, COR.azulClaro], ["fechamento", D.fechamento, COR.azul]].map(([k, dados, cor]) => (
          <CartaoGrafico key={k} titulo={T[k].titulo} descricao={T[k].descricao}>
            <ResponsiveContainer width="100%" height={210}>
              <BarChart data={dados} margin={{ top: 18, right: 8, left: -24, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke={COR.grade} />
                <XAxis dataKey="hora" tick={eixo} interval={0} />
                <YAxis tick={eixo} allowDecimals={false} />
                <Tooltip content={<Dica formatar={(p) => [p.hora, `${p.casas} casas`]} />} />
                <Bar dataKey="casas" fill={cor} radius={[4, 4, 0, 0]}>
                  <LabelList dataKey="casas" position="top" style={{ fontSize: 11, fill: COR.texto }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CartaoGrafico>
        ))}

        <CartaoGrafico titulo={T.cestas.titulo} descricao={T.cestas.descricao} className="md:col-span-2">
          <ResponsiveContainer width="100%" height={CESTAS.length * 30 + 40}>
            <BarChart data={CESTAS} layout="vertical" margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid horizontal={false} stroke={COR.grade} />
              <XAxis type="number" tick={eixo} tickFormatter={(v) => `R$ ${v}`} />
              <YAxis type="category" dataKey="nome" tick={{ ...eixo, fontSize: 10 }} width={130}
                tickFormatter={(v) => (v.length > 20 ? `${v.slice(0, 19)}…` : v)} interval={0} />
              <Tooltip content={<Dica formatar={(p) => [p.nome, p.metropole, `baixa ${reais(p.baixa)}`, `mediana ${reais(p.mediana)}`, `alta ${reais(p.alta)}`]} />} />
              <ReferenceLine x={MEDIANA_CESTAS} stroke={COR.referencia} strokeDasharray="4 3" />
              <Bar dataKey={(p) => [p.baixa, p.alta]} radius={3} barSize={12}>
                {CESTAS.map((p) => <Cell key={p.nome} fill={salvador(p) ? COR.destaque : COR.azul} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CartaoGrafico>

        <CartaoGrafico titulo={T.histCesta.titulo} descricao={T.histCesta.descricao}>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={D.hist_cesta} margin={{ top: 18, right: 8, left: -24, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke={COR.grade} />
              <XAxis dataKey="faixa" tick={{ ...eixo, fontSize: 10 }} interval={0} />
              <YAxis tick={eixo} allowDecimals={false} />
              <Tooltip content={<Dica formatar={(p) => [`R$ ${p.faixa}`, `${p.casas} casas`]} />} />
              <Bar dataKey="casas" fill={COR.azul} radius={[4, 4, 0, 0]}>
                <LabelList dataKey="casas" position="top" style={{ fontSize: 11, fill: COR.texto }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CartaoGrafico>

        <CartaoGrafico titulo={T.google.titulo} descricao={T.google.descricao}>
          <ResponsiveContainer width="100%" height={220}>
            <ScatterChart margin={{ top: 8, right: 12, left: -20, bottom: 0 }}>
              <CartesianGrid stroke={COR.grade} />
              <XAxis type="number" dataKey="volume_avaliacoes" scale="log" domain={[100, 6000]} ticks={[100, 300, 1000, 3000]} tick={eixo} tickFormatter={(v) => num(v)} />
              <YAxis type="number" dataKey="avaliacao_media" domain={[4, 5]} tick={eixo} tickFormatter={(v) => num(v, 1)} />
              <Tooltip content={<Dica formatar={(p) => [p.nome, p.metropole, `nota ${num(p.avaliacao_media, 1)}`, `${num(p.volume_avaliacoes)} avaliações`]} />} />
              <Scatter data={D.dispersao_google}>
                {D.dispersao_google.map((p) => <Cell key={p.nome} fill={salvador(p) ? COR.destaque : COR.azul} fillOpacity={0.75} />)}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </CartaoGrafico>

        <CartaoGrafico titulo={T.instagram.titulo} descricao={T.instagram.descricao} className="md:col-span-2">
          <ResponsiveContainer width="100%" height={260}>
            <ScatterChart margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
              <CartesianGrid stroke={COR.grade} />
              <XAxis type="number" dataKey="seguidores" scale="log" domain={[1000, 250000]} ticks={[1000, 3000, 10000, 30000, 100000]} tick={eixo} tickFormatter={(v) => (v >= 1000 ? `${num(v / 1000)} mil` : num(v))} />
              <YAxis type="number" dataKey="interacoes_por_post" scale="log" domain={[1, 10000]} ticks={[1, 10, 100, 1000, 10000]} tick={eixo} tickFormatter={(v) => num(v)} />
              <Tooltip content={<Dica formatar={(p) => [p.nome, p.metropole, `${milhar(p.seguidores)} seguidores`, `${num(p.interacoes_por_post)} interações por post`]} />} />
              <Scatter data={D.dispersao_instagram}>
                {D.dispersao_instagram.map((p) => <Cell key={p.nome} fill={salvador(p) ? COR.destaque : COR.azul} fillOpacity={0.75} />)}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </CartaoGrafico>
      </div>

      <Reveal>
        <h2 className="mt-12 font-display text-2xl font-bold text-azul-800">{T.tabela.titulo}</h2>
        <p className="mt-1 mb-5 max-w-3xl text-sm text-azul-700/80">{T.tabela.descricao}</p>
      </Reveal>
      <div className="space-y-3">
        {GRUPOS.map((g, i) => {
          const linhas = Object.values(G).filter((v) => v.grupo === g);
          return (
            <Sanfona key={g} titulo={g} contagem={linhas.length} aberto={i === 0}>
              <TabelaGrupo linhas={linhas} />
            </Sanfona>
          );
        })}
      </div>

      <Nota>{T.nota} {c.fonte}</Nota>
    </>
  );
}
