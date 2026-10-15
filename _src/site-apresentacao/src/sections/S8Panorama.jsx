import {
  Bar, BarChart, CartesianGrid, Cell, LabelList, ReferenceLine, ResponsiveContainer,
  Scatter, ScatterChart, Tooltip, XAxis, YAxis,
} from "recharts";
import D from "../conteudo/b1-estatisticas.json";
import c from "../conteudo/s8-b1-resultados.json";
import { achadosGerais } from "../conteudo/b1-achados";
import { TituloSecao, Reveal, Nota, Sanfona } from "../components/ui";
import { Achados, CartaoGrafico, Dica, Kpi, Tabela } from "../components/graficos";
import { COR, eixo, milhar, num, pct, porUnidade, reais } from "../formato";

const T = c.panorama;
const G = D.geral;
const GRUPOS = [...new Set(Object.values(G).map((v) => v.grupo))];
const salvador = (p) => p.metropole === "Salvador";

export default function S8Panorama() {
  return (
    <>
      <TituloSecao id="panorama" />
      <Reveal>
        <p className="mb-6 max-w-3xl text-sm leading-relaxed text-azul-800/85 sm:text-base">{T.intro}</p>
      </Reveal>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Kpi rotulo="Luderias" valor={D.total_casas} detalhe={`${D.n_metropoles} metrópoles`} />
        <Kpi rotulo="Nota mediana" valor={num(G.avaliacao_media.mediana, 1)} detalhe={`${num(G.avaliacao_media.min, 1)} a ${num(G.avaliacao_media.max, 1)}`} />
        <Kpi rotulo="Avaliações (mediana)" valor={num(G.volume_avaliacoes.mediana)} detalhe="no Google" />
        <Kpi rotulo="Cesta mediana" valor={reais(G.cesta_mediana.mediana)} detalhe={`${G.cesta_mediana.n} casas com cardápio`} />
        <Kpi rotulo="Seguidores (mediana)" valor={milhar(G.seguidores.mediana)} detalhe="no Instagram" />
        <Kpi rotulo="Horas por semana" valor={num(G.horas_semana.mediana)} detalhe="mediana" />
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
                {D.dias.map((d) => <Cell key={d.dia} fill={d.pct === 1 ? COR.azul : COR.rosa} />)}
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
          <ResponsiveContainer width="100%" height={D.cestas.length * 22 + 40}>
            <BarChart data={D.cestas} layout="vertical" margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid horizontal={false} stroke={COR.grade} />
              <XAxis type="number" tick={eixo} tickFormatter={(v) => `R$ ${v}`} />
              <YAxis type="category" dataKey="nome" tick={{ ...eixo, fontSize: 10 }} width={130}
                tickFormatter={(v) => (v.length > 20 ? `${v.slice(0, 19)}…` : v)} interval={0} />
              <Tooltip content={<Dica formatar={(p) => [p.nome, p.metropole, `baixa ${reais(p.baixa)}`, `mediana ${reais(p.mediana)}`, `alta ${reais(p.alta)}`]} />} />
              <ReferenceLine x={G.cesta_mediana.mediana} stroke={COR.rosa} strokeDasharray="4 3" />
              <Bar dataKey={(p) => [p.baixa, p.alta]} radius={3} barSize={12}>
                {D.cestas.map((p) => <Cell key={p.nome} fill={salvador(p) ? COR.rosa : COR.azul} />)}
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
              <Bar dataKey="casas" fill={COR.rosa} radius={[4, 4, 0, 0]}>
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
                {D.dispersao_google.map((p) => <Cell key={p.nome} fill={salvador(p) ? COR.rosa : COR.azul} fillOpacity={0.75} />)}
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
                {D.dispersao_instagram.map((p) => <Cell key={p.nome} fill={salvador(p) ? COR.rosa : COR.azul} fillOpacity={0.75} />)}
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
          const f = (campo) => (l) => porUnidade(l[campo], l.unidade);
          return (
            <Sanfona key={g} titulo={g} contagem={linhas.length} aberto={i === 0}>
              <Tabela
                linhas={linhas}
                colunas={[
                  { rotulo: "variável", valor: (l) => <span className="font-normal">{l.rotulo}</span> },
                  { rotulo: "n", valor: (l) => l.n },
                  { rotulo: "média", valor: f("media") },
                  { rotulo: "mediana", valor: f("mediana") },
                  { rotulo: "DP", valor: f("dp") },
                  { rotulo: "mín.", valor: f("min") },
                  { rotulo: "P25", valor: f("p25") },
                  { rotulo: "P75", valor: f("p75") },
                  { rotulo: "máx.", valor: f("max") },
                  { rotulo: "amplitude", valor: f("amplitude") },
                  { rotulo: "CV", valor: (l) => (l.cv == null ? "—" : num(l.cv, 2)) },
                ]}
              />
            </Sanfona>
          );
        })}
      </div>

      <Nota>{T.nota} {c.fonte}</Nota>
    </>
  );
}
