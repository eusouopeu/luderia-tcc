import {
  Bar, BarChart, CartesianGrid, Cell, ComposedChart, LabelList, Legend, ResponsiveContainer, Scatter, Tooltip,
  XAxis, YAxis,
} from "recharts";
import D from "../conteudo/b1-estatisticas.json";
import c from "../conteudo/s8-b1-resultados.json";
import { achadosRegioes } from "../conteudo/b1-achados";
import { TituloSecao, Reveal, Nota } from "../components/ui";
import { Achados, CartaoGrafico, Dica, Tabela } from "../components/graficos";
import { COR, eixo, hora, milhar, num, pct, reais } from "../formato";

const T = c.regioes;
const R = D.regioes;
const ehNe = (r) => r.grupo === "Nordeste";
const curto = (g) => (g === "Centro-Oeste" ? "C.-Oeste" : g);
const med = (campo) => (r) => r[campo]?.mediana ?? null;

export default function S10Regioes() {
  const cesta = R.filter((r) => r.cesta_mediana.mediana != null).map((r) => ({
    ...r, faixa: [r.cesta_mediana.min, r.cesta_mediana.max], ponto: r.cesta_mediana.mediana,
  }));
  const operacao = R.map((r) => ({
    grupo: r.grupo, domingo: r.abre_domingo, segunda: r.abre_segunda, metro: r.tem_metro_1000m,
  }));

  return (
    <>
      <TituloSecao id="regioes" />
      <Reveal>
        <p className="mb-6 max-w-3xl text-sm leading-relaxed text-azul-800/85 sm:text-base">{T.intro}</p>
      </Reveal>

      <Achados titulo={T.achados} itens={achadosRegioes()} />

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <CartaoGrafico titulo={T.casas.titulo} descricao={T.casas.descricao}>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={R} margin={{ top: 20, right: 8, left: -24, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke={COR.grade} />
              <XAxis dataKey="grupo" tick={{ ...eixo, fontSize: 10 }} interval={0} tickFormatter={curto} />
              <YAxis tick={eixo} allowDecimals={false} />
              <Tooltip content={<Dica formatar={(r) => [r.grupo, `${r.casas} casas (${pct(r.pct)})`]} />} />
              <Bar dataKey="casas" radius={[4, 4, 0, 0]}>
                {R.map((r) => <Cell key={r.grupo} fill={ehNe(r) ? COR.destaque : COR.azul} />)}
                <LabelList dataKey="pct" position="top" formatter={(v) => pct(v)} style={{ fontSize: 11, fill: COR.texto }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CartaoGrafico>

        <CartaoGrafico titulo={T.cesta.titulo} descricao={T.cesta.descricao}>
          <ResponsiveContainer width="100%" height={240}>
            <ComposedChart data={cesta} margin={{ top: 20, right: 8, left: -10, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke={COR.grade} />
              <XAxis dataKey="grupo" tick={{ ...eixo, fontSize: 10 }} interval={0} tickFormatter={curto} />
              <YAxis tick={eixo} tickFormatter={(v) => `R$ ${v}`} />
              <Tooltip content={<Dica formatar={(r) => [r.grupo, `mediana ${reais(r.ponto)}`, `de ${reais(r.faixa[0])} a ${reais(r.faixa[1])}`, `${r.com_cardapio} casas com cardápio`]} />} />
              <Bar dataKey="faixa" fill={COR.azulClaro} radius={4} barSize={28} />
              <Scatter dataKey="ponto" fill={COR.texto}>
                <LabelList dataKey="ponto" position="right" formatter={(v) => reais(v)} style={{ fontSize: 10, fill: COR.texto }} />
              </Scatter>
            </ComposedChart>
          </ResponsiveContainer>
        </CartaoGrafico>

        <CartaoGrafico titulo={T.operacao.titulo} descricao={T.operacao.descricao} className="md:col-span-2">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={operacao} margin={{ top: 20, right: 8, left: -18, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke={COR.grade} />
              <XAxis dataKey="grupo" tick={eixo} interval={0} />
              <YAxis tick={eixo} domain={[0, 1]} tickFormatter={(v) => pct(v)} />
              <Tooltip formatter={(v) => pct(v)} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="domingo" name="abre domingo" fill={COR.azul} radius={[3, 3, 0, 0]} />
              <Bar dataKey="segunda" name="abre segunda" fill={COR.azulClaro} radius={[3, 3, 0, 0]} />
              <Bar dataKey="metro" name="metrô ≤ 1 km" fill={COR.azul} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CartaoGrafico>
      </div>

      <Reveal>
        <h2 className="mt-12 font-display text-2xl font-bold text-azul-800">{T.tabela.titulo}</h2>
        <p className="mt-1 mb-5 max-w-3xl text-sm text-azul-700/80">{T.tabela.descricao}</p>
      </Reveal>
      <Tabela
        linhas={R}
        destaque={ehNe}
        colunas={[
          { rotulo: "região", valor: (r) => r.grupo },
          { rotulo: "casas", valor: (r) => `${r.casas} (${pct(r.pct)})` },
          { rotulo: "nota", valor: (r) => num(med("avaliacao_media")(r), 2) },
          { rotulo: "avaliações", valor: (r) => num(med("volume_avaliacoes")(r)) },
          { rotulo: "horas/semana (média)", valor: (r) => num(r.horas_semana.media, 1) },
          { rotulo: "fecha", valor: (r) => hora(med("fecha_tarde_h")(r)) },
          { rotulo: "abre domingo", valor: (r) => pct(r.abre_domingo) },
          { rotulo: "metrô ≤ 1 km", valor: (r) => pct(r.tem_metro_1000m) },
          { rotulo: "seguidores", valor: (r) => milhar(med("seguidores")(r)) },
          { rotulo: "interações/post", valor: (r) => num(med("interacoes_por_post")(r)) },
          { rotulo: "com cardápio", valor: (r) => r.com_cardapio },
          { rotulo: "bebida", valor: (r) => reais(med("bebida_mediana")(r)) },
          { rotulo: "entrada ou prato", valor: (r) => reais(med("entrada_ou_prato_mediana")(r)) },
          { rotulo: "cesta mediana", valor: (r) => reais(med("cesta_mediana")(r)) },
          { rotulo: "avaliações B2", valor: (r) => num(r.avaliacoes_b2) },
        ]}
      />
      <Nota>{c.fonte}</Nota>
    </>
  );
}
