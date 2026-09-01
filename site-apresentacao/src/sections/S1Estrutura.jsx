import { useState } from "react";
import c from "../conteudo/s1-estrutura.json";
import { cor } from "../tema";
import { TituloSecao, Cartao, Reveal, Etiqueta, Nota } from "../components/ui";

export default function S1Estrutura() {
  const [aberto, setAberto] = useState(0);

  return (
    <>
      <TituloSecao id="estrutura" />

      {/* Cascata dedutiva */}
      <Reveal>
        <h2 className="font-display text-2xl font-bold text-azul-800">{c.cascata.titulo}</h2>
        <p className="mt-1 mb-5 max-w-2xl text-sm text-azul-700/80">{c.cascata.descricao}</p>
      </Reveal>

      <div className="space-y-2">
        {c.cascata.etapas.map((etapa, i) => {
          const ativo = aberto === i;
          return (
            <Reveal key={etapa.nivel} delay={i * 90}>
              <button
                onClick={() => setAberto(ativo ? -1 : i)}
                className="w-full cursor-pointer text-left"
                style={{ paddingLeft: `${i * 1.75}rem` }}
              >
                <div
                  className={`rounded-lg border-l-4 px-5 py-4 transition-all duration-300 ${
                    ativo ? "shadow-md" : "shadow-sm hover:shadow"
                  }`}
                  style={{
                    borderLeftColor: cor(c.cascata.cores[i] ?? "azul"),
                    backgroundColor: ativo ? "#fff" : "var(--color-papel-100)",
                  }}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="font-display text-lg font-bold text-azul-950">{etapa.nivel}</h3>
                    <Etiqueta cor="var(--color-papel-200)">{etapa.escopo}</Etiqueta>
                  </div>
                  <div className="grid transition-all duration-400" style={{ gridTemplateRows: ativo ? "1fr" : "0fr" }}>
                    <div className="overflow-hidden">
                      <p className="pt-2 text-sm leading-relaxed text-azul-800/90">{etapa.texto}</p>
                    </div>
                  </div>
                  {!ativo && <p className="truncate pt-1 text-sm text-azul-700/50">{etapa.texto}</p>}
                </div>
              </button>
            </Reveal>
          );
        })}
      </div>

      {/* Objetivo geral */}
      <Reveal>
        <Cartao tom="escuro" className="mt-12 p-6">
          <p className="text-xs font-semibold tracking-[0.18em] text-lavanda-300 uppercase">
            {c.objetivoGeral.rotulo}
          </p>
          <p className="mt-3 text-lg leading-relaxed">{c.objetivoGeral.texto}</p>
        </Cartao>
      </Reveal>

      {/* Objetivos específicos */}
      <Reveal>
        <h2 className="mt-12 font-display text-2xl font-bold text-azul-800">
          {c.objetivosEspecificos.titulo}
        </h2>
        <p className="mt-1 mb-4 text-sm text-azul-700/80">{c.objetivosEspecificos.descricao}</p>
      </Reveal>
      <div className="space-y-2">
        {c.objetivosEspecificos.itens.map((o, i) => (
          <Reveal key={o.id} delay={i * 55}>
            <div className="flex items-start gap-4 rounded-lg border border-papel-200 bg-white p-4">
              <span
                className="mt-0.5 flex h-9 w-11 shrink-0 items-center justify-center rounded-md font-display text-sm font-bold text-white"
                style={{ backgroundColor: cor(o.cor) }}
              >
                {o.id}
              </span>
              <div className="min-w-0">
                <span className="block text-xs font-bold tracking-[0.14em] uppercase" style={{ color: cor(o.cor) }}>
                  {o.dim}
                </span>
                <p className="mt-1 text-sm leading-relaxed text-azul-800">{o.texto}</p>
              </div>
            </div>
          </Reveal>
        ))}
      </div>

      <Nota>{c.nota}</Nota>
    </>
  );
}
