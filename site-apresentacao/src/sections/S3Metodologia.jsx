import c from "../conteudo/s3-metodologia.json";
import { cor } from "../tema";
import { TituloSecao, Cartao, Reveal, Nota, Sanfona } from "../components/ui";

const R = c.blocos.rotulos;

function BlocoCard({ bloco }) {
  return (
    <Cartao tom="claro" className="flex h-full flex-col overflow-hidden p-0">
      <div className="px-5 py-4" style={{ backgroundColor: cor(bloco.cor) }}>
        <h3 className="font-display text-lg leading-snug font-bold text-white">{bloco.titulo}</h3>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <dl className="space-y-2 text-sm">
          {[
            [R.fonte, bloco.fonte],
            [R.n, bloco.n],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between gap-4 border-b border-papel-200 pb-1.5">
              <dt className="shrink-0 text-azul-700/70">{k}</dt>
              <dd className="text-right font-semibold text-azul-950">{v}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-3 text-sm leading-relaxed text-azul-800/90">{bloco.funcao}</p>

        <p className="mt-4 text-xs font-semibold tracking-wider text-azul-700/60 uppercase">{R.criterios}</p>
        <ul className="mt-1.5 space-y-1.5">
          {bloco.criterios.map((cr) => (
            <li key={cr} className="flex items-start gap-2 text-xs leading-relaxed text-azul-800/85">
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-rosa-400" />
              {cr}
            </li>
          ))}
        </ul>

        <div className="mt-4 rounded-lg border-l-4 p-3" style={{ borderLeftColor: cor(bloco.cor), backgroundColor: "var(--color-papel-100)" }}>
          <span className="text-xs font-semibold tracking-wider text-azul-700/60 uppercase">{R.instrumento}</span>
          <p className="mt-1 text-xs leading-relaxed text-azul-800/85">{bloco.instrumento}</p>
        </div>
      </div>
    </Cartao>
  );
}

export default function S3Metodologia() {
  return (
    <>
      <TituloSecao id="metodologia" />

      {/* Ficha */}
      <Reveal>
        <div className="grid gap-px overflow-hidden rounded-xl border border-papel-200 bg-papel-200 sm:grid-cols-2 lg:grid-cols-3">
          {c.ficha.map((f) => (
            <div key={f.rotulo} className="bg-white p-4">
              <p className="text-xs font-semibold tracking-wider text-azul-700/60 uppercase">{f.rotulo}</p>
              <p className="mt-1 font-display text-lg leading-snug font-bold text-azul-950">{f.valor}</p>
            </div>
          ))}
        </div>
      </Reveal>

      {/* Blocos */}
      <Reveal>
        <h2 className="mt-12 font-display text-2xl font-bold text-azul-800">{c.blocos.titulo}</h2>
        <p className="mt-1 mb-5 max-w-3xl text-sm text-azul-700/80">{c.blocos.descricao}</p>
      </Reveal>
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {c.blocos.itens.map((b, i) => (
          <Reveal key={b.id} delay={i * 100}>
            <BlocoCard bloco={b} />
          </Reveal>
        ))}
      </div>

      {/* Ética */}
      <div className="mt-8">
        <Sanfona titulo={c.etica.titulo} cor={cor("azulEscuro")} contagem={c.etica.itens.length}>
          <ul className="divide-y divide-papel-200">
            {c.etica.itens.map((it) => (
              <li key={it} className="flex items-start gap-3 px-6 py-3.5">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-rosa-400" />
                <p className="text-sm leading-relaxed text-azul-800">{it}</p>
              </li>
            ))}
          </ul>
        </Sanfona>
      </div>

      <Nota>{c.nota}</Nota>
    </>
  );
}
