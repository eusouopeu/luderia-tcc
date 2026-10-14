import { useState } from "react";
import c from "../conteudo/s5-modelo.json";
import { cor, ehEscura } from "../tema";
import { TituloSecao, Cartao, Reveal, Etiqueta, Nota } from "../components/ui";

const corBloco = (b) => cor(c.coresBloco[b] ?? "azul");
const escuraBloco = (b) => ehEscura(c.coresBloco[b] ?? "azul");

export default function S5Modelo() {
  const [sel, setSel] = useState(0);
  const atual = c.objetivos[sel];
  const tinta = escuraBloco(atual.bloco) ? "#fff" : "var(--color-azul-950)";

  return (
    <>
      <TituloSecao id="modelo" />

      <Reveal>
        <p className="max-w-3xl text-base leading-relaxed text-azul-800/90">{c.introducao}</p>
      </Reveal>

      {/* Seletor de objetivos */}
      <div className="mt-7 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {c.objetivos.map((m, i) => {
          const ativo = sel === i;
          return (
            <button
              key={m.oe}
              onClick={() => setSel(i)}
              className={`cursor-pointer rounded-lg border-2 px-3 py-3 text-left transition-all ${
                ativo ? "shadow-md" : "border-papel-200 bg-white hover:border-rosa-400"
              }`}
              style={ativo ? { borderColor: corBloco(m.bloco), backgroundColor: "#fff" } : undefined}
            >
              <span
                className="font-display text-xl font-bold"
                style={{ color: ativo ? corBloco(m.bloco) : "var(--color-azul-700)" }}
              >
                {m.oe}
              </span>
              <span className="block text-xs font-semibold text-azul-700/70">{m.bloco}</span>
            </button>
          );
        })}
      </div>

      {/* Cadeia */}
      <Reveal key={sel}>
        <Cartao className="mt-6 overflow-hidden p-0">
          <div className="px-6 py-5" style={{ backgroundColor: corBloco(atual.bloco) }}>
            <p className="text-xs font-semibold tracking-[0.18em] uppercase" style={{ color: tinta, opacity: 0.75 }}>
              {atual.oe} · {c.rotulos.prefixoBloco} {atual.bloco}
            </p>
            <h2 className="mt-1 font-display text-3xl font-bold" style={{ color: tinta }}>
              {atual.pergunta}
            </h2>
          </div>

          <div className="bg-white p-6">
            <p className="mb-3 text-xs font-semibold tracking-wider text-azul-700/60 uppercase">
              {c.rotulos.hipoteses}
            </p>
            <div className="space-y-3">
              {atual.hipoteses.map((h) => (
                <div key={h.id} className="rounded-lg border border-papel-200 p-4">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="font-mono text-sm font-bold" style={{ color: corBloco(atual.bloco) }}>
                      {h.id}
                    </span>
                    <span className="text-xs font-semibold text-azul-700/70">{h.tecnica}</span>
                  </div>
                  <p className="mt-1.5 text-sm leading-relaxed text-azul-900">{h.texto}</p>
                </div>
              ))}
            </div>
          </div>
        </Cartao>
      </Reveal>

      {/* Visão geral */}
      <Reveal>
        <h2 className="mt-12 font-display text-2xl font-bold text-azul-800">{c.matriz.titulo}</h2>
      </Reveal>
      <div className="mt-4 overflow-x-auto rounded-xl border border-papel-200">
        <table className="w-full min-w-[46rem] border-collapse text-sm">
          <thead>
            <tr className="bg-azul-900 text-left text-papel-50">
              {c.matriz.colunas.map((h) => (
                <th key={h} className="px-4 py-3 text-xs font-semibold tracking-wider uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {c.objetivos.map((m, i) => (
              <tr
                key={m.oe}
                onClick={() => setSel(i)}
                className={`cursor-pointer transition-colors ${
                  sel === i ? "bg-lavanda-100" : i % 2 ? "bg-papel-100" : "bg-white"
                } hover:bg-lavanda-100`}
              >
                <td className="px-4 py-3 align-top font-display font-bold whitespace-nowrap" style={{ color: corBloco(m.bloco) }}>
                  {m.oe}
                </td>
                <td className="px-4 py-3 align-top">
                  <Etiqueta cor={corBloco(m.bloco)} escura={escuraBloco(m.bloco)}>{m.bloco}</Etiqueta>
                </td>
                <td className="px-4 py-3 align-top font-mono text-xs text-roxo-600">
                  {m.hipoteses.map((h) => h.id).join(", ")}
                </td>
                <td className="px-4 py-3 align-top text-azul-800/85">
                  {[...new Set(m.hipoteses.map((h) => h.tecnica))].join(" · ")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Nota>{c.nota}</Nota>
    </>
  );
}
