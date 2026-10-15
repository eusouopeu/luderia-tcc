import { Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import D from "../conteudo/b1-estatisticas.json";
import c from "../conteudo/s8-b1-resultados.json";
import { achadosMetropoles } from "../conteudo/b1-achados";
import { TituloSecao, Reveal, Nota } from "../components/ui";
import { Achados, CartaoGrafico, Dica, Tabela } from "../components/graficos";
import { COR, eixo, hora, milhar, num, pct, reais } from "../formato";

const T = c.metropoles;
const M = D.metropoles; // já em ordem decrescente de casas
const ehSsa = (m) => m.grupo === "Salvador";
const med = (campo) => (m) => m[campo]?.mediana ?? null;

function BarrasHorizontais({ dados, valor, rotulo, dica, cor = COR.azul, folga = 64 }) {
  return (
    <ResponsiveContainer width="100%" height={dados.length * 26 + 30}>
      <BarChart data={dados} layout="vertical" margin={{ top: 0, right: folga, left: 0, bottom: 0 }}>
        <CartesianGrid horizontal={false} stroke={COR.grade} />
        <XAxis type="number" tick={eixo} hide />
        <YAxis type="category" dataKey="grupo" tick={eixo} width={104} interval={0} />
        <Tooltip content={<Dica formatar={dica} />} />
        <Bar dataKey={valor} radius={[0, 4, 4, 0]} barSize={16}>
          {dados.map((m) => <Cell key={m.grupo} fill={ehSsa(m) ? COR.rosa : cor} />)}
          <LabelList dataKey={rotulo} position="right" style={{ fontSize: 11, fill: COR.texto }} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export default function S9Metropoles() {
  const casas = M.map((m) => ({ ...m, rot: `${m.casas} (${pct(m.pct)})` }));
  const cesta = M.filter((m) => m.cesta_mediana.mediana != null)
    .map((m) => ({ ...m, v: m.cesta_mediana.mediana, rot: `${reais(m.cesta_mediana.mediana)} · n=${m.com_cardapio}` }))
    .sort((a, b) => b.v - a.v);
  const seg = M.filter((m) => m.seguidores.mediana != null)
    .map((m) => ({ ...m, v: m.seguidores.mediana, rot: milhar(m.seguidores.mediana) }))
    .sort((a, b) => b.v - a.v);

  return (
    <>
      <TituloSecao id="metropoles" />
      <Reveal>
        <p className="mb-6 max-w-3xl text-sm leading-relaxed text-azul-800/85 sm:text-base">{T.intro}</p>
      </Reveal>

      <Achados titulo={T.achados} itens={achadosMetropoles()} />

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <CartaoGrafico titulo={T.casas.titulo} descricao={T.casas.descricao} className="md:col-span-2">
          <BarrasHorizontais dados={casas} valor="casas" rotulo="rot"
            dica={(m) => [m.grupo, m.regiao, `${m.casas} casas (${pct(m.pct)})`]} />
        </CartaoGrafico>
        <CartaoGrafico titulo={T.cesta.titulo} descricao={T.cesta.descricao}>
          <BarrasHorizontais dados={cesta} valor="v" rotulo="rot" cor={COR.azul} folga={104}
            dica={(m) => [m.grupo, `mediana ${reais(m.cesta_mediana.mediana)}`, `de ${reais(m.cesta_mediana.min)} a ${reais(m.cesta_mediana.max)}`, `${m.com_cardapio} de ${m.casas} casas com cardápio`]} />
        </CartaoGrafico>
        <CartaoGrafico titulo={T.seguidores.titulo} descricao={T.seguidores.descricao}>
          <BarrasHorizontais dados={seg} valor="v" rotulo="rot" cor={COR.azulClaro}
            dica={(m) => [m.grupo, `${milhar(m.seguidores.mediana)} seguidores (mediana)`, `${m.seguidores.n} perfis`]} />
        </CartaoGrafico>
      </div>

      <Reveal>
        <h2 className="mt-12 font-display text-2xl font-bold text-azul-800">{T.tabela.titulo}</h2>
        <p className="mt-1 mb-5 max-w-3xl text-sm text-azul-700/80">{T.tabela.descricao}</p>
      </Reveal>
      <Tabela
        linhas={M}
        destaque={ehSsa}
        colunas={[
          { rotulo: "metrópole", valor: (m) => m.grupo },
          { rotulo: "região", valor: (m) => m.regiao },
          { rotulo: "casas", valor: (m) => m.casas },
          { rotulo: "nota", valor: (m) => num(med("avaliacao_media")(m), 2) },
          { rotulo: "avaliações", valor: (m) => num(med("volume_avaliacoes")(m)) },
          { rotulo: "horas/semana (média)", valor: (m) => num(m.horas_semana.media, 1) },
          { rotulo: "fecha", valor: (m) => hora(med("fecha_tarde_h")(m)) },
          { rotulo: "abre domingo", valor: (m) => pct(m.abre_domingo) },
          { rotulo: "abre segunda", valor: (m) => pct(m.abre_segunda) },
          { rotulo: "metrô ≤ 1 km", valor: (m) => pct(m.tem_metro_1000m) },
          { rotulo: "seguidores", valor: (m) => milhar(med("seguidores")(m)) },
          { rotulo: "interações/post", valor: (m) => num(med("interacoes_por_post")(m)) },
          { rotulo: "com cardápio", valor: (m) => m.com_cardapio },
          { rotulo: "cesta mediana", valor: (m) => reais(med("cesta_mediana")(m)) },
          { rotulo: "avaliações B2", valor: (m) => num(m.avaliacoes_b2) },
        ]}
      />
      <Nota>{c.fonte}</Nota>
    </>
  );
}
