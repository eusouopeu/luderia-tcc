import { useState } from "react";
import c from "../conteudo/s2-teorico.json";
import { cor } from "../tema";
import { TituloSecao, Cartao, Reveal, Nota } from "../components/ui";

const COR_GRUPO = Object.fromEntries(c.grupos.map((g) => [g.nome, cor(g.cor)]));

export default function S2Teorico() {
  const [filtro, setFiltro] = useState(c.grupos[0].nome);
  const lista = filtro === c.rotuloTodos ? c.conceitos : c.conceitos.filter((x) => x.grupo === filtro);

  return (
    <>
      <TituloSecao id="teorico" />

      <Reveal>
        <p className="max-w-3xl text-base leading-relaxed text-azul-800/90">{c.introducao}</p>
      </Reveal>

      <div className="my-7 flex flex-wrap gap-2">
        {[...c.grupos.map((g) => g.nome), c.rotuloTodos].map((g) => {
          const ativo = filtro === g;
          return (
            <button
              key={g}
              onClick={() => setFiltro(g)}
              className={`cursor-pointer rounded-full border px-4 py-1.5 text-sm font-semibold transition-all ${
                ativo ? "border-transparent text-white shadow-sm" : "border-papel-200 bg-white text-azul-800 hover:border-rosa-400"
              }`}
              style={ativo ? { backgroundColor: COR_GRUPO[g] ?? cor("azulEscuro") } : undefined}
            >
              {g}
            </button>
          );
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {lista.map((x, i) => (
          <Reveal key={x.termo} delay={i * 50}>
            <Cartao className="group h-full overflow-hidden p-0 transition-shadow hover:shadow-md">
              <div className="h-1 w-full" style={{ backgroundColor: COR_GRUPO[x.grupo] }} />
              <div className="p-5">
                <h3 className="font-display text-lg leading-snug font-bold text-azul-950">{x.termo}</h3>
                <p className="mt-2 text-sm leading-relaxed text-azul-800/85">{x.definicao}</p>
                <p
                  className="mt-4 border-t border-papel-200 pt-3 text-xs font-semibold tracking-wide"
                  style={{ color: COR_GRUPO[x.grupo] }}
                >
                  {x.fonte}
                </p>
              </div>
            </Cartao>
          </Reveal>
        ))}
      </div>

      <Nota>{c.nota}</Nota>
    </>
  );
}
