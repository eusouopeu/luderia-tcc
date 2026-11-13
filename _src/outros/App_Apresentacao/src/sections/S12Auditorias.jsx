import {
  CartesianGrid, Cell, ComposedChart, LabelList, Line, ReferenceLine, ResponsiveContainer, Scatter, Tooltip, XAxis, YAxis,
} from "recharts";
import D from "../conteudo/auditorias.json";
import c from "../conteudo/s12-auditorias.json";
import { TituloSecao, Reveal, Nota, Sanfona, Cartao } from "../components/ui";
import { CartaoGrafico, Dica, Kpi, Tabela } from "../components/graficos";
import { COR, eixo, num } from "../formato";

const A = D.amostras;
const p1 = (v) => (v == null ? "—" : `${num(v, 1)}%`);
const EXAUSTIVAS = new Set(["instagram_perfis", "completude", "bases"]);

// Uma linha por amostra na tabela (o entorno e o Instagram têm duas).
const LINHAS = [
  { id: "estabelecimentos", conjunto: "Estabelecimentos (B1)" },
  { id: "entorno_casas", conjunto: "Entorno (B1): casas" },
  { id: "entorno_itens", conjunto: "Entorno (B1): itens das casas sorteadas" },
  { id: "instagram_perfis", conjunto: "Instagram (B1): perfis" },
  { id: "instagram_posts", conjunto: "Instagram (B1): posts" },
  { id: "cardapios", conjunto: "Cardápios (B1)" },
  { id: "acervos", conjunto: "Acervos (B1)" },
  { id: "avaliacoes", conjunto: "Avaliações (B2): etapa 1" },
  { id: "completude", conjunto: "Avaliações (B2): completude" },
  { id: "bases", conjunto: "Bases públicas (B4)" },
].map((l) => ({ ...l, ...A[l.id] }));

const cumpre = (l) => (EXAUSTIVAS.has(l.id) ? "exaustiva" : l.max_erros == null ? "não, nem com zero erros" : `sim, até ${l.max_erros} erros`);

export default function S12Auditorias() {
  const pontos = LINHAS.filter((l) => !EXAUSTIVAS.has(l.id))
    .map((l) => ({ n: l.n, limite: l.wilson_zero, nome: l.conjunto }));
  const total = LINHAS.filter((l) => l.id !== "entorno_casas").reduce((s, l) => s + l.n, 0);

  return (
    <>
      <TituloSecao id="auditorias" />
      <Reveal>
        <p className="mb-6 max-w-3xl text-sm leading-relaxed text-azul-800/85 sm:text-base">{c.intro}</p>
      </Reveal>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Kpi rotulo="Conjuntos auditados" valor={c.conjuntos.length} detalhe="B1, B2 e B4" />
        <Kpi rotulo="Itens a conferir" valor={num(total)} detalhe="somando todas as amostras" />
        <Kpi rotulo="Critério" valor={`≤ ${num(D.criterio_pct)}%`} detalhe="limite superior de Wilson (95%)" />
        <Kpi rotulo="n mínimo" valor={D.n_minimo_zero_erros} detalhe="para cumprir o critério com zero erros" />
      </div>

      <Reveal>
        <h2 className="mt-12 font-display text-2xl font-bold text-azul-800">{c.regras.titulo}</h2>
      </Reveal>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {c.regras.itens.map((r, i) => (
          <Reveal key={r.titulo} delay={i * 60}>
            <Cartao className="h-full p-5">
              <h3 className="font-display text-base font-bold text-azul-950">{r.titulo}</h3>
              <p className="mt-2 text-sm leading-relaxed text-azul-800/90">{r.texto}</p>
            </Cartao>
          </Reveal>
        ))}
      </div>

      <Reveal>
        <h2 className="mt-12 font-display text-2xl font-bold text-azul-800">{c.calculo.titulo}</h2>
      </Reveal>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <Reveal>
          <Cartao tom="escuro" className="h-full p-5 sm:p-6">
            <p className="font-mono text-sm text-lavanda-200">limite = z² ÷ (n + z²), z = {num(D.z, 2)}</p>
            <p className="mt-1 font-mono text-sm text-lavanda-200">n ≥ z² × (1 − 0,05) ÷ 0,05 = {num((D.z ** 2 * 0.95) / 0.05, 1)} → {D.n_minimo_zero_erros}</p>
            <div className="mt-4 space-y-3">
              {c.calculo.texto.map((t) => (
                <p key={t} className="text-sm leading-relaxed">{t}</p>
              ))}
            </div>
          </Cartao>
        </Reveal>
        <CartaoGrafico titulo={c.calculo.grafico.titulo} descricao={c.calculo.grafico.descricao}>
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={D.curva_wilson_zero} margin={{ top: 10, right: 16, left: -14, bottom: 0 }}>
              <CartesianGrid stroke={COR.grade} />
              <XAxis dataKey="n" type="number" domain={[0, 250]} ticks={[0, 50, 73, 100, 150, 200, 250]} tick={eixo} />
              <YAxis type="number" domain={[0, 45]} tick={eixo} tickFormatter={(v) => `${v}%`} />
              <Tooltip content={<Dica formatar={(p) => [p.nome ?? `n = ${p.n}`, `limite com zero erros: ${p1(p.limite)}`]} />} />
              <ReferenceLine y={D.criterio_pct} stroke={COR.referencia} strokeDasharray="4 3" />
              <ReferenceLine x={D.n_minimo_zero_erros} stroke={COR.referencia} strokeDasharray="4 3" />
              <Line dataKey="limite" stroke={COR.azul} dot={false} strokeWidth={2} isAnimationActive={false} />
              <Scatter data={pontos} dataKey="limite">
                {pontos.map((p) => <Cell key={p.nome} fill={p.limite > D.criterio_pct ? COR.destaque : COR.texto} />)}
                <LabelList dataKey="n" position="top" style={{ fontSize: 10, fill: COR.texto }} />
              </Scatter>
            </ComposedChart>
          </ResponsiveContainer>
        </CartaoGrafico>
      </div>

      <Reveal>
        <h2 className="mt-12 font-display text-2xl font-bold text-azul-800">{c.tabela.titulo}</h2>
        <p className="mt-1 mb-5 max-w-3xl text-sm text-azul-700/80">{c.tabela.descricao}</p>
      </Reveal>
      <Tabela
        linhas={LINHAS}
        destaque={(l) => !EXAUSTIVAS.has(l.id) && l.max_erros == null}
        colunas={[
          { rotulo: "conjunto", valor: (l) => <span className="font-normal">{l.conjunto}</span> },
          { rotulo: "unidade", valor: (l) => l.unidade },
          { rotulo: "população", valor: (l) => num(l.populacao) },
          { rotulo: "amostra", valor: (l) => num(l.n) },
          { rotulo: "% da população", valor: (l) => p1(l.pct_populacao) },
          { rotulo: "estratos", valor: (l) => (l.alocacao ? `${l.alocacao.estratos} (${l.alocacao.min} a ${l.alocacao.max})` : "—") },
          { rotulo: "limite com zero erros", valor: (l) => p1(l.wilson_zero) },
          { rotulo: "cumpre 5%?", valor: cumpre },
        ]}
      />

      <Reveal>
        <h2 className="mt-12 font-display text-2xl font-bold text-azul-800">Cada auditoria</h2>
      </Reveal>
      <div className="mt-4 space-y-3">
        {c.conjuntos.map((x, i) => {
          const a = A[x.id];
          const campos = [
            ["O que é conferido", x.confere],
            ["Tipo de amostragem", x.amostragem],
            ["Justificativa", x.justificativa],
            ["Tamanho da amostra", x.tamanho],
            ["Como comparar", x.comparacao],
          ];
          return (
            <Sanfona key={x.id} titulo={x.titulo} subtitulo={`${num(a.n)} de ${num(a.populacao)} · pasta ${x.pasta}`} aberto={i === 0}>
              <div className="space-y-3 p-5">
                <dl className="grid gap-3 sm:grid-cols-[11rem_1fr]">
                  {campos.map(([k, v]) => (
                    <div key={k} className="contents">
                      <dt className="text-xs font-semibold tracking-wide text-roxo-600 uppercase sm:pt-0.5">{k}</dt>
                      <dd className="text-sm leading-relaxed text-azul-900">{v}</dd>
                    </div>
                  ))}
                </dl>
                <p className="rounded-lg bg-papel-100 px-4 py-3 text-sm text-azul-900 [font-variant-numeric:tabular-nums]">
                  Com zero erros, limite de {p1(a.wilson_zero)}.{" "}
                  {EXAUSTIVAS.has(x.id)
                    ? "Conferência exaustiva: a taxa observada é a da população."
                    : a.max_erros == null
                      ? `Não cumpre o critério de ${num(D.criterio_pct)}% nem sem erros (mínimo: ${D.n_minimo_zero_erros}).`
                      : `Aceita até ${a.max_erros} erros (limite de ${p1(a.wilson_max_erros)}).`}
                  {a.semente ? ` Semente ${a.semente}; sorteio de ${a.gerado_em ?? "15/10/2026"}.` : ""}
                </p>
                {x.ressalva && (
                  <p className="rounded-lg border-l-4 border-destaque-600 bg-destaque-50 px-4 py-3 text-sm leading-relaxed text-azul-950">
                    <span className="font-semibold text-destaque-700">Atenção: </span>
                    {x.ressalva}
                  </p>
                )}
              </div>
            </Sanfona>
          );
        })}
      </div>

      <Nota>{c.b3} {c.nota}</Nota>
    </>
  );
}
