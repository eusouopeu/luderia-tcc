import {
  Bar, BarChart, CartesianGrid, LabelList, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import D from "../conteudo/b2-temas.json";
import c from "../conteudo/s11-b2-conteudo.json";
import { TituloSecao, Reveal, Nota, Sanfona } from "../components/ui";
import { CartaoGrafico, Dica, Kpi, Tabela } from "../components/graficos";
import { COR, eixo, num } from "../formato";

const p1 = (v) => `${num(v, 1)}%`;
const curto = (v, n) => (v.length > n ? `${v.slice(0, n - 1)}…` : v);
const T = (nome) => D.temas.find((t) => t.tema === nome);
const K = (rodada, variavel) => D.kappa.find((k) => k.rodada === rodada && k.variavel.startsWith(variavel));

export default function S11Conteudo() {
  const temas = [...D.temas]
    .sort((a, b) => b.pctTema - a.pctTema)
    .map((t) => ({
      nome: t.tema, total: t.pctTema, pos: t.pctElogio, neg: t.pctCritica,
      outra: Math.max(0, +(t.pctTema - t.pctElogio - t.pctCritica).toFixed(1)), n: t.comTema,
    }));
  const notas = D.temas
    .filter((t) => t.critica >= 5 && t.notaCritica != null)
    .map((t) => ({ nome: t.tema, elogio: t.notaElogio, critica: t.notaCritica, n: t.critica }))
    .sort((a, b) => a.critica - b.critica);
  const contexto = D.contexto.map((x) => ({ nome: x.contexto, pct: x.pct, n: x.comentarios }));
  const kTemas = K(2, "temas");
  const kCtx = K(1, "contexto");

  const atend = T("atendimento presencial");
  const comida = T("comida");
  const expl = T("explicação de jogos");
  const indic = T("indicações de jogos");
  const entrada = T("preço da entrada");
  const cardapio = T("preço do cardápio");
  const achados = [
    {
      titulo: "O atendimento é o eixo da avaliação",
      texto: `O atendimento presencial aparece em ${p1(atend.pctTema)} dos comentários (${num(atend.comTema)}), com ${num(atend.elogio)} elogios e ${atend.critica} críticas. Quando é criticado, a nota média do comentário cai para ${num(atend.notaCritica, 2)}.`,
      decisao: "Um instrutor dedicado ao salão em todas as horas abertas, com no máximo duas mesas por instrutor no pico (capítulos 6 e 7).",
    },
    {
      titulo: "Explicar e indicar jogos é parte do serviço",
      texto: `A explicação de jogos aparece em ${p1(expl.pctTema)} dos comentários e, quando criticada, leva a nota a ${num(expl.notaCritica, 2)}. A indicação de jogos é rara (${p1(indic.pctTema)}), e a nota com crítica é de ${num(indic.notaCritica, 2)}.`,
      decisao: "A explicação é tratada como serviço de mesa, e a indicação pelo perfil do grupo é a novidade da proposta de valor.",
    },
    {
      titulo: "A comida pesa mais que o ambiente",
      texto: `A comida é o segundo tema (${p1(comida.pctTema)}, com ${comida.elogio} elogios e ${comida.critica} críticas). A nota média cai para ${num(comida.notaCritica, 2)} quando a comida é criticada.`,
      decisao: "Cozinha completa desde a abertura: os alimentos e bebidas são a maior fonte de receita do plano.",
    },
    {
      titulo: "O preço pesa pouco, mas incomoda",
      texto: `O preço da entrada aparece em ${entrada.comTema} comentários (${entrada.critica} críticas e ${entrada.elogio} elogios); o do cardápio, em ${cardapio.comTema} (${cardapio.critica} críticas e ${cardapio.elogio} elogios).`,
      decisao: "A taxa de entrada fica na média dos concorrentes, abaixo da São Jogue (capítulo 6).",
    },
  ];
  const estab = [...D.porEstabelecimento].sort((a, b) => b.comentarios - a.comentarios);

  return (
    <>
      <TituloSecao id="conteudo" />
      <Reveal>
        <p className="mb-6 max-w-3xl text-sm leading-relaxed text-azul-800 sm:text-base">{c.intro}</p>
      </Reveal>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi rotulo="Comentários analisados" valor={num(D.comentarios)} detalhe={"Avaliações com texto, até \"3 meses atrás\""} />
        <Kpi rotulo="Estabelecimentos" valor={D.estabelecimentos} detalhe="Concorrentes do B1 com avaliações no recorte" />
        <Kpi rotulo="Temas codificados" valor={D.temas.length} detalhe="Cada tema conta uma vez por comentário e polaridade" />
        <Kpi rotulo="Concordância (kappa)" valor={num(kTemas.kappa, 2)} detalhe={`Recodificação cega, rodada 2, ${kTemas.linhas} comentários`} />
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <CartaoGrafico titulo={c.temas.titulo} descricao={c.temas.descricao} className="md:col-span-2">
          <ResponsiveContainer width="100%" height={temas.length * 26 + 50}>
            <BarChart data={temas} layout="vertical" margin={{ top: 0, right: 40, left: 0, bottom: 0 }}>
              <CartesianGrid horizontal={false} stroke={COR.grade} />
              <XAxis type="number" tick={eixo} tickFormatter={(v) => `${v}%`} />
              <YAxis type="category" dataKey="nome" tick={{ ...eixo, fontSize: 10 }} width={170} interval={0} tickFormatter={(v) => curto(v, 30)} />
              <Tooltip content={<Dica formatar={(p) => [p.nome, `${p1(p.total)} (${num(p.n)} comentários)`, `elogio ${p1(p.pos)}`, `crítica ${p1(p.neg)}`]} />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="pos" name="elogio" stackId="a" fill={COR.azul} />
              <Bar dataKey="neg" name="crítica" stackId="a" fill={COR.destaque} />
              <Bar dataKey="outra" name="outra polaridade" stackId="a" fill={COR.neutra} radius={[0, 3, 3, 0]}>
                <LabelList dataKey="total" position="right" formatter={(v) => `${num(v, 0)}%`} style={{ fontSize: 10, fill: COR.texto }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CartaoGrafico>

        <CartaoGrafico titulo={c.notas.titulo} descricao={c.notas.descricao}>
          <ResponsiveContainer width="100%" height={notas.length * 30 + 50}>
            <BarChart data={notas} layout="vertical" margin={{ top: 0, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid horizontal={false} stroke={COR.grade} />
              <XAxis type="number" domain={[0, 5]} ticks={[1, 2, 3, 4, 5]} tick={eixo} />
              <YAxis type="category" dataKey="nome" tick={{ ...eixo, fontSize: 10 }} width={150} interval={0} tickFormatter={(v) => curto(v, 26)} />
              <Tooltip content={<Dica formatar={(p) => [p.nome, `com elogio: ${num(p.elogio, 2)}`, `com crítica: ${num(p.critica, 2)} (${p.n} críticas)`]} />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="elogio" name="com elogio" fill={COR.azulClaro} barSize={9} />
              <Bar dataKey="critica" name="com crítica" fill={COR.destaque} barSize={9}>
                <LabelList dataKey="critica" position="right" formatter={(v) => num(v, 1)} style={{ fontSize: 10, fill: COR.texto }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CartaoGrafico>

        <CartaoGrafico titulo={c.contexto.titulo} descricao={`${c.contexto.descricao} Concordância da recodificação: kappa de ${num(kCtx.kappa, 2)}, abaixo do critério.`}>
          <ResponsiveContainer width="100%" height={contexto.length * 30 + 50}>
            <BarChart data={contexto} layout="vertical" margin={{ top: 0, right: 40, left: 0, bottom: 0 }}>
              <CartesianGrid horizontal={false} stroke={COR.grade} />
              <XAxis type="number" tick={eixo} tickFormatter={(v) => `${v}%`} />
              <YAxis type="category" dataKey="nome" tick={{ ...eixo, fontSize: 10 }} width={90} interval={0} />
              <Tooltip content={<Dica formatar={(p) => [p.nome, `${p1(p.pct)} (${p.n} comentários)`]} />} />
              <Bar dataKey="pct" fill={COR.azulClaro} barSize={14} radius={[0, 4, 4, 0]}>
                <LabelList dataKey="pct" position="right" formatter={p1} style={{ fontSize: 10, fill: COR.texto }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CartaoGrafico>
      </div>

      <Reveal>
        <h2 className="mt-12 font-display text-2xl font-bold text-azul-950">{c.achados.titulo}</h2>
        <p className="mt-1 mb-5 max-w-3xl text-sm text-azul-700">{c.achados.descricao}</p>
      </Reveal>
      <div className="space-y-3">
        {achados.map((a, i) => (
          <Sanfona key={a.titulo} titulo={`${i + 1}. ${a.titulo}`} aberto={i === 0}>
            <div className="space-y-3 p-5">
              <p className="text-sm leading-relaxed text-azul-900">{a.texto}</p>
              <p className="rounded-lg border-l-4 border-roxo-600 bg-lavanda-100 px-4 py-3 text-sm leading-relaxed text-azul-950">
                <span className="font-semibold">{c.achados.rotuloDecisao}: </span>
                {a.decisao}
              </p>
            </div>
          </Sanfona>
        ))}
      </div>

      <Reveal>
        <h2 className="mt-12 font-display text-2xl font-bold text-azul-950">{c.estabelecimentos.titulo}</h2>
        <p className="mt-1 mb-5 max-w-3xl text-sm text-azul-700">{c.estabelecimentos.descricao}</p>
      </Reveal>
      <Sanfona titulo="Tabela" contagem={estab.length}>
        <div className="p-3 sm:p-4">
          <Tabela
            linhas={estab}
            destaque={(e) => e.metropole === "Salvador"}
            colunas={[
              { rotulo: "estabelecimento", valor: (e) => <span className="font-normal">{e.nome}</span> },
              { rotulo: "metrópole", valor: (e) => e.metropole },
              { rotulo: "comentários", valor: (e) => num(e.comentarios) },
              { rotulo: "com tema", valor: (e) => num(e.comTema) },
            ]}
          />
        </div>
      </Sanfona>

      <Nota>{c.nota}</Nota>
    </>
  );
}
