import c from "../conteudo/s7-contribuicoes.json";
import { cor, ehEscura } from "../tema";
import { TituloSecao, Cartao, Reveal, Nota, Contador, Sanfona } from "../components/ui";

export default function S7Contribuicoes() {
  return (
    <>
      <TituloSecao id="contribuicoes" />

      {/* Números de contexto de mercado */}
      <Reveal>
        <div className="grid gap-4 sm:grid-cols-3">
          {c.numeros.map((x, i) => (
            <div
              key={x.texto}
              className="rounded-xl border p-6 shadow-sm"
              style={{
                backgroundColor: cor(x.cor),
                borderColor: cor(x.cor),
                color: ehEscura(x.cor) ? "#fff" : "var(--color-azul-950)",
              }}
            >
              <p className="font-display text-5xl leading-none font-bold">
                <Contador valor={x.valor} sufixo={x.sufixo} decimais={x.decimais} duracao={1000 + i * 150} />
              </p>
              <p className="mt-2 text-sm leading-relaxed opacity-90">{x.texto}</p>
            </div>
          ))}
        </div>
      </Reveal>

      {/* Eixos de contribuição — recolhidos por padrão */}
      <Reveal>
        <h2 className="mt-10 mb-1 font-display text-2xl font-bold text-azul-800">{c.eixos.titulo}</h2>
        <p className="mb-4 text-sm text-azul-700/80">{c.eixos.descricao}</p>
      </Reveal>
      <div className="space-y-3">
        {c.eixos.itens.map((x, i) => (
          <Reveal key={x.eixo} delay={i * 80}>
            <Sanfona
              titulo={x.eixo}
              subtitulo={x.destaque ? c.eixos.rotuloDestaque : undefined}
              cor={x.destaque ? cor("roxo") : cor("papel")}
              corTexto={x.destaque ? "#fff" : "var(--color-azul-950)"}
              contagem={x.itens.length}
            >
              <ul className="divide-y divide-papel-200">
                {x.itens.map((it) => {
                  const titulo = typeof it === "string" ? null : it.titulo;
                  const texto = typeof it === "string" ? it : it.texto;
                  return (
                    <li key={titulo ?? texto} className="flex items-start gap-3 px-6 py-3.5">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-rosa-400" />
                      <div className="min-w-0">
                        {titulo && (
                          <p className="font-display text-sm font-bold text-azul-950">{titulo}</p>
                        )}
                        <p className={`text-sm leading-relaxed text-azul-800 ${titulo ? "mt-0.5" : ""}`}>
                          {texto}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </Sanfona>
          </Reveal>
        ))}
      </div>

      {/* Limitações e próximos passos */}
      <div className="mt-6 space-y-3">
        <Reveal>
          <Sanfona
            titulo={c.limitacoes.titulo}
            subtitulo={c.limitacoes.subtitulo}
            cor={cor("carmesim")}
            contagem={c.limitacoes.itens.length}
          >
            <div className="grid gap-3 p-5 md:grid-cols-2">
              {c.limitacoes.itens.map((l) => (
                <div key={l} className="rounded-lg border-l-4 border-carmesim-600 bg-papel-100 p-4">
                  <p className="text-sm leading-relaxed text-azul-800">{l}</p>
                </div>
              ))}
            </div>
          </Sanfona>
        </Reveal>

        <Reveal delay={80}>
          <Sanfona
            titulo={c.agenda.titulo}
            subtitulo={c.agenda.subtitulo}
            cor={cor("azulEscuro")}
            contagem={c.agenda.itens.length}
          >
            <div className="p-6">
              <ol className="relative space-y-4 border-l-2 border-rosa-400 pl-6">
                {c.agenda.itens.map((a, i) => (
                  <li key={a.titulo} className="relative">
                    <span className="absolute top-1.5 -left-[1.93rem] flex h-5 w-5 items-center justify-center rounded-full bg-roxo-600 font-display text-[11px] font-bold text-white">
                      {i + 1}
                    </span>
                    <h3 className="font-display text-base font-bold text-azul-950">{a.titulo}</h3>
                    <p className="mt-0.5 text-sm leading-relaxed text-azul-800/85">{a.texto}</p>
                  </li>
                ))}
              </ol>
            </div>
          </Sanfona>
        </Reveal>
      </div>

      <Reveal>
        <Cartao tom="escuro" className="mt-10 p-8 text-center">
          <p className="text-xs font-semibold tracking-[0.2em] text-lavanda-300 uppercase">{c.fecho.rotulo}</p>
          <p className="mx-auto mt-4 max-w-3xl font-display text-2xl leading-snug font-bold sm:text-3xl">
            {c.fecho.texto}
          </p>
        </Cartao>
      </Reveal>

      <Nota>{c.nota}</Nota>
    </>
  );
}
