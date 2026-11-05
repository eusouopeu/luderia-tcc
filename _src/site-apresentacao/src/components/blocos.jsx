// Renderizador dos blocos de conteúdo das abas do plano (src/conteudo/plano.json).
// Tipos: kpis, texto, lista, cartoes, passos, chamada, tabela, barras, abas, sanfona, grade.
// As tabelas e os quadros não são digitados: vêm de src/conteudo/tabelas.json, gerado do TMin por
// scripts/sincronizar_tabelas.py, e o bloco só aponta o número ("Tabela 9.4").
import { useState } from "react";
import { Bar, BarChart, Cell, LabelList, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import tabelas from "../conteudo/tabelas.json";
import { Cartao, Reveal, Nota, Sanfona } from "./ui";
import { Kpi, Pilulas, Dica } from "./graficos";
import { QRCodeSVG } from "qrcode.react";
import site from "../conteudo/site.json";
import { numero, slug } from "../auxiliares";

const ehNumero = (s) => /^[-−+]?\d[\d.]*(,\d+)?\s?(%|min|m²|R\$)?$/.test((s ?? "").trim());

function Titulo({ titulo, descricao }) {
  if (!titulo) return null;
  return (
    <div id={slug(titulo)} className="mb-4 scroll-mt-24">
      <h2 className="font-display text-2xl font-bold text-azul-950 sm:text-[1.7rem]">{titulo}</h2>
      {descricao && <p className="mt-1 max-w-3xl text-sm leading-relaxed text-azul-700">{descricao}</p>}
    </div>
  );
}

/* Notas e fonte de uma tabela: em vez do bloco de texto corrido, cada frase da nota vira um botão com
   dica (passar o mouse, focar ou tocar), e a fonte vira mais um. Poupa a tela durante a apresentação. */
function dividirNota(nota) {
  return nota.split(/(?<=[.;])\s+(?=[A-ZÁÉÍÓÚÂÊÔÃÕ])/).map((s) => s.trim()).filter(Boolean);
}
const rotuloCurto = (s) => {
  const palavras = s.replace(/[()]/g, "").split(/\s+/).slice(0, 3).join(" ");
  return palavras.length < s.length ? `${palavras.replace(/[,;:]$/, "")}…` : palavras;
};

function Notas({ nota, fonte }) {
  const [aberta, setAberta] = useState(null);
  const itens = [
    ...(nota ? dividirNota(nota).map((texto) => ({ rotulo: rotuloCurto(texto), texto, tipo: "Nota" })) : []),
    ...(fonte ? [{ rotulo: "Fonte", texto: fonte, tipo: "Fonte" }] : []),
  ];
  if (!itens.length) return null;
  return (
    <div className="no-print relative mt-2 flex flex-wrap items-center gap-1.5" onMouseLeave={() => setAberta(null)}>
      <span className="mr-0.5 text-[11px] font-semibold tracking-wide text-azul-700 uppercase">Notas</span>
      {itens.map((n, i) => (
        <span key={i}>
          <button
            type="button"
            aria-expanded={aberta === i}
            aria-describedby={aberta === i ? `nota-${i}` : undefined}
            onMouseEnter={() => setAberta(i)}
            onFocus={() => setAberta(i)}
            onBlur={() => setAberta(null)}
            onClick={() => setAberta(aberta === i ? null : i)}
            className={`flex max-w-[11rem] cursor-pointer items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold transition-colors ${
              aberta === i ? "border-roxo-600 bg-lavanda-100 text-roxo-700" : "border-papel-200 bg-white text-azul-700 hover:border-roxo-600"
            }`}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3 shrink-0" aria-hidden="true">
              <path d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
            </svg>
            <span className="truncate">{n.rotulo}</span>
          </button>
          {aberta === i && (
            <span
              role="tooltip"
              id={`nota-${i}`}
              className="absolute bottom-full left-0 z-30 mb-2 block w-80 max-w-full rounded-lg border border-papel-200 bg-white p-3 text-xs leading-relaxed font-normal text-azul-900 normal-case"
            >
              <span className="mb-1 block text-[10px] font-bold tracking-[0.14em] text-roxo-600 uppercase">{n.tipo}</span>
              {n.texto}
            </span>
          )}
        </span>
      ))}
    </div>
  );
}

/* Tabela do TMin: primeira coluna fixa, colunas numéricas à direita, rolagem horizontal própria. */
function TabelaTMin({ id, titulo, destacar = [], mostrarTitulo = true, ate }) {
  const t = tabelas[id];
  if (!t) return <p className="text-sm text-erro">Tabela {id} não encontrada em tabelas.json.</p>;
  const linhas = ate ? t.linhas.slice(0, ate) : t.linhas;
  const numerica = t.colunas.map((_, j) => {
    const cel = linhas.map((l) => l[j]).filter((c) => c && c !== "-" && c !== "n.a.");
    return cel.length > 0 && cel.filter(ehNumero).length / cel.length >= 0.7;
  });
  // Colunas de texto longo ganham largura mínima, para não esmagar a frase no celular.
  const longa = t.colunas.map((_, j) => linhas.reduce((s, l) => s + (l[j] ?? "").length, 0) / linhas.length > 45);
  const marcada = (l, i) => destacar.includes(i) || destacar.includes(l[0]) || destacar.includes(l[1]);
  return (
    <Reveal>
      <figure>
        {mostrarTitulo && (
          <figcaption className="mb-2 text-sm font-semibold text-azul-900">
            <span className="text-roxo-600">{id}</span> · {titulo ?? t.titulo}
          </figcaption>
        )}
        <div className="overflow-x-auto rounded-lg border border-papel-200 bg-white">
          <table className="w-full text-left text-xs sm:text-[13px]">
            <thead className="bg-papel-100 text-azul-900">
              <tr>
                {t.colunas.map((c, j) => (
                  <th
                    key={j}
                    className={`px-3 py-2.5 font-semibold ${numerica[j] ? "text-right whitespace-nowrap" : ""} ${j === 0 ? "sticky left-0 z-10 bg-papel-100" : ""}`}
                  >
                    {c || " "}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {linhas.map((l, i) => {
                const m = marcada(l, i);
                const total = /^(Total|Receita bruta|EBITDA|Subtotal|VPL)/i.test(l[0]);
                return (
                  <tr key={i} className={`border-t border-papel-200 align-top ${m ? "bg-destaque-50" : ""} ${total ? "font-semibold" : ""}`}>
                    {l.map((c, j) => (
                      <td
                        key={j}
                        className={`px-3 py-2 ${numerica[j] ? "text-right whitespace-nowrap tabular-nums" : longa[j] ? "min-w-[15rem] leading-snug" : "min-w-[8rem] leading-snug"} ${
                          j === 0 ? `sticky left-0 z-10 font-semibold ${m ? "bg-destaque-50 text-destaque-700" : "bg-white text-azul-950"}` : "text-azul-800"
                        }`}
                      >
                        {c}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <Notas nota={t.nota} fonte={t.fonte} />
      </figure>
    </Reveal>
  );
}

/* Barras horizontais, de uma tabela do TMin (id + colunas) ou de dados em linha. */
function Barras({ b }) {
  let dados = b.dados;
  if (!dados) {
    const t = tabelas[b.id];
    dados = t.linhas
      .filter((l) => !(b.excluir ?? []).includes(l[b.rotulo]))
      .map((l, i) => ({ rotulo: b.rotulos?.[i] ?? l[b.rotulo], valor: numero(l[b.valor]), texto: l[b.valor] }));
    if (b.ate) dados = dados.slice(0, b.ate);
  }
  const dest = new Set(b.destacar ?? []);
  const formatar = (v) => v.toLocaleString("pt-BR", { maximumFractionDigits: b.decimais ?? 0 });
  const altura = dados.length * 34 + 16;
  return (
    <Reveal>
      <Cartao className="p-4 sm:p-5">
        {b.titulo && <h3 className="font-display text-lg font-bold text-azul-950">{b.titulo}</h3>}
        {b.descricao && !b.secao && <p className="mt-1 text-xs leading-relaxed text-azul-700 sm:text-sm">{b.descricao}</p>}
        <div className="mt-3" style={{ height: altura }} role="img" aria-label={b.titulo}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dados} layout="vertical" margin={{ top: 0, right: 64, bottom: 0, left: 0 }}>
              <XAxis type="number" hide domain={[0, "dataMax"]} />
              <YAxis
                type="category" dataKey="rotulo" width={b.larguraRotulo ?? 150} axisLine={false} tickLine={false}
                tick={{ fontSize: 12, fill: "var(--color-azul-800)" }}
              />
              <Tooltip
                cursor={{ fill: "var(--color-papel-100)" }}
                content={<Dica formatar={(p) => [p.rotulo, `${b.legenda ?? "Valor"}: ${formatar(p.valor)}${b.unidade ?? ""}`]} />}
              />
              <Bar dataKey="valor" radius={[0, 4, 4, 0]} barSize={20} isAnimationActive={false}>
                {dados.map((d) => (
                  <Cell key={d.rotulo} fill={dest.size === 0 || dest.has(d.rotulo) ? "var(--caneta)" : "var(--heat-1)"} />
                ))}
                <LabelList
                  dataKey="valor" position="right" fontSize={12} fill="var(--color-azul-950)"
                  formatter={(v) => `${formatar(v)}${b.unidade ?? ""}`}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        {b.fonte && <p className="mt-2 text-[11px] leading-snug text-azul-700/80">{b.fonte}</p>}
      </Cartao>
    </Reveal>
  );
}

/* QR code do site: só em telas grandes (na tela do celular, o próprio site já está aberto). */
function QrCode() {
  return (
    <Reveal className="hidden lg:block">
      <Cartao tom="areia" className="flex items-center gap-6 p-5">
        <div className="shrink-0 rounded-lg bg-white p-2.5">
          <QRCodeSVG value={site.meta.url} size={112} bgColor="#ffffff" fgColor="#1e1b26" level="M" title="QR code do site da apresentação" />
        </div>
        <div className="min-w-0">
          <h3 className="font-display text-lg font-bold text-azul-950">{site.qrcode.titulo}</h3>
          <p className="mt-1 text-sm leading-relaxed text-azul-700">{site.qrcode.texto}</p>
          <a href={site.meta.url} className="mt-1.5 inline-block text-sm font-semibold break-all text-roxo-600 hover:underline">
            {site.meta.url}
          </a>
        </div>
      </Cartao>
    </Reveal>
  );
}

function Lista({ b }) {
  return (
    <Reveal>
      <Cartao tom="areia" className="p-5 sm:p-6">
        {b.titulo && <p className="text-xs font-semibold tracking-[0.14em] text-roxo-600 uppercase">{b.titulo}</p>}
        <ul className="mt-3 space-y-2.5">
          {b.itens.map((t) => (
            <li key={t} className="flex items-start gap-3 text-sm leading-relaxed text-azul-900">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-roxo-600" />
              <span>{t}</span>
            </li>
          ))}
        </ul>
      </Cartao>
    </Reveal>
  );
}

function Cartoes({ b }) {
  const cols = b.colunas ?? 3;
  const grade = { 2: "sm:grid-cols-2", 3: "sm:grid-cols-2 lg:grid-cols-3", 4: "sm:grid-cols-2 lg:grid-cols-4" }[cols];
  return (
    <div className={`grid gap-3 ${grade}`}>
      {b.itens.map((c, i) => (
        <Reveal key={c.titulo} delay={i * 50}>
          <Cartao className="h-full p-4 sm:p-5">
            {c.rotulo && <span className="rounded bg-lavanda-100 px-2 py-0.5 text-[11px] font-bold tracking-wide text-roxo-700">{c.rotulo}</span>}
            <h3 className="mt-2 font-display text-base leading-snug font-bold text-azul-950 sm:text-lg">{c.titulo}</h3>
            <p className="mt-1.5 text-[13px] leading-relaxed text-azul-800">{c.texto}</p>
            {c.destaque && <p className="mt-2 text-xs font-semibold text-roxo-600">{c.destaque}</p>}
          </Cartao>
        </Reveal>
      ))}
    </div>
  );
}

function Passos({ b }) {
  return (
    <ol className="space-y-2">
      {b.itens.map((p, i) => (
        <Reveal key={p.titulo} delay={i * 60}>
          <li className="flex gap-4 rounded-lg border border-papel-200 bg-white p-4">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-roxo-600 text-sm font-bold text-white">
              {i + 1}
            </span>
            <div className="min-w-0">
              <h3 className="font-display text-base font-bold text-azul-950">{p.titulo}</h3>
              <p className="mt-0.5 text-[13px] leading-relaxed text-azul-800">{p.texto}</p>
            </div>
          </li>
        </Reveal>
      ))}
    </ol>
  );
}

function Abas({ b }) {
  const [ativa, setAtiva] = useState(b.itens[0].id);
  const item = b.itens.find((i) => i.id === ativa) ?? b.itens[0];
  return (
    <div>
      <div className="mb-4 overflow-x-auto pb-1">
        <Pilulas opcoes={b.itens.map((i) => ({ id: i.id, rotulo: i.rotulo }))} valor={ativa} aoMudar={setAtiva} rotulo={b.titulo ?? "Abas"} />
      </div>
      <div key={ativa} className="space-y-5 animate-fade-up">
        {item.blocos.map((x, i) => <Bloco key={i} b={x} />)}
      </div>
    </div>
  );
}

export function Bloco({ b }) {
  switch (b.tipo) {
    case "qrcode":
      return <QrCode />;
    case "kpis":
      return (
        <div className={`grid gap-3 ${b.itens.length > 4 ? "grid-cols-2 lg:grid-cols-3" : "grid-cols-2 lg:grid-cols-4"}`}>
          {b.itens.map((k, i) => (
            <Reveal key={k.rotulo} delay={i * 40}><Kpi {...k} /></Reveal>
          ))}
        </div>
      );
    case "texto":
      return (
        <section>
          <Titulo titulo={b.titulo} descricao={b.descricao} />
          <div className="max-w-3xl space-y-3">
            {b.paragrafos.map((p) => (
              <p key={p} className="text-[15px] leading-relaxed text-azul-900">{p}</p>
            ))}
          </div>
          {b.nota && <Nota>{b.nota}</Nota>}
        </section>
      );
    case "chamada":
      return (
        <Reveal>
          <Cartao tom="escuro" className="p-5 sm:p-6">
            {b.rotulo && <p className="text-xs font-semibold tracking-[0.18em] text-lavanda-400 uppercase">{b.rotulo}</p>}
            <p className="mt-2 text-base leading-relaxed sm:text-lg">{b.texto}</p>
          </Cartao>
        </Reveal>
      );
    case "lista":
      return (<section><Titulo titulo={b.titulo2} /><Lista b={b} /></section>);
    case "cartoes":
      return (<section><Titulo titulo={b.titulo} descricao={b.descricao} /><Cartoes b={b} /></section>);
    case "passos":
      return (<section><Titulo titulo={b.titulo} descricao={b.descricao} /><Passos b={b} /></section>);
    case "tabela":
      return (
        <section>
          <Titulo titulo={b.secao} descricao={b.descricao} />
          <TabelaTMin id={b.id} titulo={b.titulo} destacar={b.destacar} ate={b.ate} mostrarTitulo={b.mostrarTitulo !== false && !b.secao} />
          {b.nota && <Nota>{b.nota}</Nota>}
        </section>
      );
    case "barras":
      return (<section><Titulo titulo={b.secao} descricao={b.descricao} /><Barras b={b} /></section>);
    case "abas":
      return (<section><Titulo titulo={b.titulo} descricao={b.descricao} /><Abas b={b} /></section>);
    case "sanfona":
      return (
        <section>
          <Titulo titulo={b.titulo} descricao={b.descricao} />
          <div className="space-y-2">
            {b.itens.map((s, i) => (
              <Sanfona key={s.titulo} titulo={s.titulo} subtitulo={s.subtitulo} aberto={i === 0 && b.abrirPrimeiro}>
                <div className="space-y-4 p-4 sm:p-5">{s.blocos.map((x, k) => <Bloco key={k} b={x} />)}</div>
              </Sanfona>
            ))}
          </div>
        </section>
      );
    case "grade":
      return (
        <div className="grid items-start gap-4 lg:grid-cols-2">
          {b.blocos.map((x, i) => <Bloco key={i} b={x} />)}
        </div>
      );
    default:
      return null;
  }
}
