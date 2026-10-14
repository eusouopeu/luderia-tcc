import { useState } from "react";
import c from "../conteudo/s4-indicadores.json";
import { cor, ehEscura } from "../tema";
import { TituloSecao, Cartao, Reveal, Etiqueta, Nota } from "../components/ui";

const corDim = (d) => cor(c.coresDimensao[d]);
const escuraDim = (d) => ehEscura(c.coresDimensao[d]);

function Celula({ item, campo }) {
  if (campo === "dim")
    return <Etiqueta cor={corDim(item.dim)} escura={escuraDim(item.dim)}>{item.dim}</Etiqueta>;
  return item[campo];
}

const CLASSE_CELULA = {
  indicador: "font-semibold text-azul-950",
  definicao: "font-mono text-xs text-azul-800/85",
  uso: "text-xs leading-snug text-azul-700/85",
};

export default function S4Indicadores() {
  const [dim, setDim] = useState(c.dimensoes[0]);
  const lista = dim === c.rotuloTodas ? c.itens : c.itens.filter((i) => i.dim === dim);
  const contagem = c.dimensoes.map((d) => ({ d, n: c.itens.filter((i) => i.dim === d).length }));

  return (
    <>
      <TituloSecao id="indicadores" />

      <Reveal>
        <p className="max-w-3xl text-base leading-relaxed text-azul-800/90">
          {c.introducao.antes}{" "}
          {c.introducao.exemplos.map((e, i) => (
            <span key={e}>
              <span className="font-mono text-sm text-roxo-600">{e}</span>
              {i < c.introducao.exemplos.length - 1 ? ", " : ""}
            </span>
          ))}
          {" "}
          {c.introducao.depois}
        </p>
      </Reveal>

      {/* Distribuição por bloco */}
      <Reveal>
        <div className="mt-7 flex h-10 overflow-hidden rounded-lg border border-papel-200">
          {contagem.map((x, i) => (
            <div
              key={x.d}
              className="flex origin-left animate-grow-x items-center justify-center text-xs font-bold whitespace-nowrap"
              style={{
                width: `${(x.n / c.itens.length) * 100}%`,
                backgroundColor: corDim(x.d),
                color: escuraDim(x.d) ? "#fff" : "var(--color-azul-950)",
                animationDelay: `${i * 70}ms`,
              }}
              title={`${x.d}: ${x.n} indicadores`}
            >
              {x.n}
            </div>
          ))}
        </div>
      </Reveal>

      {/* Filtros */}
      <div className="my-6 flex flex-wrap gap-2">
        {[...c.dimensoes, c.rotuloTodas].map((d) => {
          const ativo = dim === d;
          const todas = d === c.rotuloTodas;
          return (
            <button
              key={d}
              onClick={() => setDim(d)}
              className={`cursor-pointer rounded-full border px-4 py-1.5 text-sm font-semibold transition-all ${
                ativo ? "border-transparent shadow-sm" : "border-papel-200 bg-white text-azul-800 hover:border-rosa-400"
              }`}
              style={
                ativo
                  ? {
                      backgroundColor: todas ? cor("azulEscuro") : corDim(d),
                      color: todas || escuraDim(d) ? "#fff" : "var(--color-azul-950)",
                    }
                  : undefined
              }
            >
              {d}
              <span className="ml-1.5 opacity-60">
                {todas ? c.itens.length : c.itens.filter((i) => i.dim === d).length}
              </span>
            </button>
          );
        })}
      </div>

      {/* Tabela em telas largas */}
      <div className="hidden overflow-x-auto rounded-xl border border-papel-200 lg:block">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-azul-900 text-left text-papel-50">
              {c.colunas.map((col) => (
                <th key={col.campo} className="px-3 py-3 text-xs font-semibold tracking-wider uppercase">
                  {col.titulo}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {lista.map((it, i) => (
              <tr
                key={`${it.dim}-${it.indicador}`}
                className={`${i % 2 ? "bg-papel-100" : "bg-white"} transition-colors hover:bg-lavanda-100`}
              >
                {c.colunas.map((col) => (
                  <td key={col.campo} className={`px-3 py-3 align-top ${CLASSE_CELULA[col.campo] ?? ""}`}>
                    <Celula item={it} campo={col.campo} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Cartões em telas estreitas */}
      <div className="grid gap-3 lg:hidden">
        {lista.map((it, i) => (
          <Reveal key={`${it.dim}-${it.indicador}-m`} delay={i * 30}>
            <Cartao className="p-4">
              <div className="mb-2 flex items-center gap-2">
                <Etiqueta cor={corDim(it.dim)} escura={escuraDim(it.dim)}>{it.dim}</Etiqueta>
              </div>
              <h3 className="font-display text-base font-bold text-azul-950">{it.indicador}</h3>
              <p className="mt-1 font-mono text-xs text-azul-800/85">{it.definicao}</p>
              <dl className="mt-3 space-y-1 border-t border-papel-200 pt-3 text-xs">
                <div className="flex gap-2">
                  <dt className="shrink-0 font-semibold text-azul-700/70">{c.rotulosCartao.uso}</dt>
                  <dd className="text-azul-900">{it.uso}</dd>
                </div>
              </dl>
            </Cartao>
          </Reveal>
        ))}
      </div>

      <Nota>{c.nota}</Nota>
    </>
  );
}
