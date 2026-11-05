import plano from "../conteudo/plano.json";
import { TituloSecao } from "../components/ui";
import { Bloco } from "../components/blocos";
import { slug, titulosDe } from "../auxiliares";

/* Aba genérica do plano: o conteúdo vem de src/conteudo/plano.json, e as tabelas, de tabelas.json. */
export default function Secao({ id }) {
  const { blocos } = plano[id];
  const indice = titulosDe(blocos);
  const [abertura, ...resto] = blocos;

  const ir = (titulo) =>
    document.getElementById(slug(titulo))?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <>
      <TituloSecao id={id} />
      <div className="space-y-10 sm:space-y-12">
        <Bloco b={abertura} />
        {indice.length > 1 && (
          <nav aria-label="Nesta aba" className="no-print -mt-4 flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-semibold tracking-[0.14em] text-azul-700 uppercase">Nesta aba</span>
            {indice.map((t) => (
              <button
                key={t}
                onClick={() => ir(t)}
                className="cursor-pointer rounded-full border border-papel-200 bg-white px-3 py-1 text-xs font-semibold text-azul-800 transition-colors hover:border-roxo-600 hover:text-roxo-600"
              >
                {t}
              </button>
            ))}
          </nav>
        )}
        {resto.map((b, i) => <Bloco key={i} b={b} />)}
      </div>
    </>
  );
}
