import { useState } from "react";
import c from "../conteudo/s6-tecnicas.json";
import { cor } from "../tema";
import { TituloSecao, Cartao, Reveal, Nota, Etiqueta } from "../components/ui";

export default function S6Tecnicas() {
  const [aba, setAba] = useState(0);

  return (
    <>
      <TituloSecao id="tecnicas" />

      {/* As cinco técnicas */}
      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
        {c.tecnicas.map((t, i) => {
          const ativo = aba === i;
          return (
            <Reveal key={t.nome} delay={i * 70}>
              <button
                onClick={() => setAba(i)}
                className={`h-full w-full cursor-pointer rounded-xl border-2 p-4 text-left transition-all ${
                  ativo ? "border-roxo-600 bg-white shadow-md" : "border-papel-200 bg-papel-100 hover:border-rosa-400"
                }`}
              >
                <span className="font-display text-xs font-bold tracking-wider text-roxo-600 uppercase">
                  0{i + 1}
                </span>
                <h3 className="font-display text-lg leading-snug font-bold text-azul-950">{t.nome}</h3>
                <p className="mt-1 text-xs leading-relaxed text-azul-800/80">{t.resumo}</p>
              </button>
            </Reveal>
          );
        })}
      </div>

      <Reveal key={aba}>
        <Cartao tom="escuro" className="mt-4 p-6">
          <p className="text-xs font-semibold tracking-[0.18em] text-lavanda-300 uppercase">{c.tecnicas[aba].nome}</p>
          <ul className="mt-3 space-y-2">
            {c.tecnicas[aba].detalhes.map((d) => (
              <li key={d} className="flex items-start gap-3 text-sm leading-relaxed">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-rosa-400" />
                {d}
              </li>
            ))}
          </ul>
        </Cartao>
      </Reveal>

      {/* Estado da coleta */}
      <Reveal>
        <h2 className="mt-12 font-display text-2xl font-bold text-azul-800">{c.coleta.titulo}</h2>
        <p className="mt-1 mb-5 max-w-3xl text-sm text-azul-700/80">{c.coleta.descricao}</p>
      </Reveal>
      <div className="grid gap-4 sm:grid-cols-3">
        {c.coleta.itens.map((it, i) => (
          <Reveal key={it.bloco} delay={i * 90}>
            <Cartao className="h-full overflow-hidden p-0">
              <div className="h-1 w-full" style={{ backgroundColor: cor(it.cor) }} />
              <div className="p-5">
                <h3 className="font-display text-base leading-snug font-bold text-azul-950">{it.bloco}</h3>
                <div className="mt-2">
                  <Etiqueta cor={it.estagio === "Não iniciada" ? "var(--color-papel-200)" : cor(it.cor)} escura={it.estagio !== "Não iniciada"}>
                    {it.estagio}
                  </Etiqueta>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-azul-800/85">{it.texto}</p>
              </div>
            </Cartao>
          </Reveal>
        ))}
      </div>

      <Nota>{c.nota}</Nota>
    </>
  );
}
