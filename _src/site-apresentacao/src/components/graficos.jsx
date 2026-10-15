import { Cartao, Reveal } from "./ui";

export function CartaoGrafico({ titulo, descricao, children, fonte, className = "" }) {
  return (
    <Reveal className={className}>
      <Cartao className="h-full p-4 sm:p-5">
        <h3 className="font-display text-base leading-snug font-bold text-azul-950 sm:text-lg">{titulo}</h3>
        {descricao && <p className="mt-1 text-xs leading-relaxed text-azul-700/80 sm:text-sm">{descricao}</p>}
        <div className="mt-4">{children}</div>
        {fonte && <p className="mt-3 text-[11px] leading-snug text-azul-700/60">{fonte}</p>}
      </Cartao>
    </Reveal>
  );
}

export function Kpi({ rotulo, valor, detalhe }) {
  return (
    <Cartao className="h-full p-4">
      <p className="text-[11px] font-semibold tracking-wide text-azul-700/70 uppercase">{rotulo}</p>
      <p className="mt-1 font-display text-2xl font-bold text-azul-950 tabular-nums sm:text-3xl">{valor}</p>
      {detalhe && <p className="mt-1 text-xs leading-snug text-azul-700/70">{detalhe}</p>}
    </Cartao>
  );
}

export function Achados({ titulo, itens }) {
  return (
    <Reveal>
      <Cartao tom="escuro" className="p-5 sm:p-6">
        <p className="text-xs font-semibold tracking-[0.18em] text-lavanda-300 uppercase">{titulo}</p>
        <ul className="mt-3 space-y-2.5">
          {itens.map((t) => (
            <li key={t} className="flex items-start gap-3 text-sm leading-relaxed">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-rosa-400" />
              {t}
            </li>
          ))}
        </ul>
      </Cartao>
    </Reveal>
  );
}

/* Tabela com rolagem horizontal própria (a página nunca rola de lado). */
export function Tabela({ colunas, linhas, destaque }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-papel-200 bg-white">
      <table className="w-full text-left text-xs sm:text-sm">
        <thead className="bg-papel-100 text-azul-900">
          <tr>
            {colunas.map((c, i) => (
              <th key={c.rotulo} className={`px-3 py-2 font-semibold ${i ? "text-right whitespace-nowrap" : "sticky left-0 z-10 bg-papel-100"}`}>
                {c.rotulo}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {linhas.map((l, j) => {
            const marcada = destaque?.(l);
            return (
              <tr key={j} className={`border-t border-papel-200 ${marcada ? "bg-lavanda-100" : ""}`}>
                {colunas.map((c, i) => (
                  <td
                    key={c.rotulo}
                    className={`px-3 py-2 tabular-nums ${
                      i ? "text-right whitespace-nowrap" : `sticky left-0 z-10 min-w-[8rem] max-w-[11rem] font-semibold text-azul-950 sm:max-w-[16rem] ${marcada ? "bg-lavanda-100" : "bg-white"}`
                    }`}
                  >
                    {c.valor(l)}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* Dica de gráfico no padrão do site. */
export function Dica({ active, payload, formatar }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="rounded-lg border border-papel-200 bg-white px-3 py-2 text-xs shadow-md">
      {formatar(p).map((linha, i) => (
        <p key={i} className={i ? "text-azul-800" : "font-semibold text-azul-950"}>
          {linha}
        </p>
      ))}
    </div>
  );
}
