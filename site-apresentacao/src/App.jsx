import { useEffect, useState, useCallback } from "react";
import site from "./conteudo/site.json";
import { cor } from "./tema";
import S1Estrutura from "./sections/S1Estrutura";
import S2Teorico from "./sections/S2Teorico";
import S3Metodologia from "./sections/S3Metodologia";
import S4Indicadores from "./sections/S4Indicadores";
import S5Modelo from "./sections/S5Modelo";
import S6Tecnicas from "./sections/S6Tecnicas";
import S7Contribuicoes from "./sections/S7Contribuicoes";

const { secoes: SECOES, meta: META, barraLateral: BARRA, rodape: RODAPE } = site;
const FUNDO_BARRA = cor(BARRA.corFundo);
const ABA_ATIVA = cor(BARRA.corAbaAtiva);

const COMPONENTES = {
  estrutura: S1Estrutura,
  teorico: S2Teorico,
  metodologia: S3Metodologia,
  indicadores: S4Indicadores,
  modelo: S5Modelo,
  tecnicas: S6Tecnicas,
  contribuicoes: S7Contribuicoes,
};

function idDoHash() {
  const h = window.location.hash.replace("#", "");
  return SECOES.some((s) => s.id === h) ? h : SECOES[0].id;
}

export default function App() {
  const [ativa, setAtiva] = useState(idDoHash);

  const indice = SECOES.findIndex((s) => s.id === ativa);
  const Secao = COMPONENTES[ativa];

  const ir = useCallback((id) => {
    setAtiva(id);
    window.location.hash = id;
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  useEffect(() => {
    const aoMudarHash = () => setAtiva(idDoHash());
    window.addEventListener("hashchange", aoMudarHash);
    return () => window.removeEventListener("hashchange", aoMudarHash);
  }, []);

  // Setas do teclado navegam entre as abas — útil durante a apresentação.
  useEffect(() => {
    const aoTeclar = (e) => {
      if (e.target.matches("input, textarea")) return;
      if (e.key === "ArrowRight" && indice < SECOES.length - 1) ir(SECOES[indice + 1].id);
      if (e.key === "ArrowLeft" && indice > 0) ir(SECOES[indice - 1].id);
    };
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [indice, ir]);

  return (
    <div className="flex min-h-screen bg-papel-50 font-sans">
      {/* ─────────── Barra lateral (telas grandes) ─────────── */}
      <aside
        className="no-print fixed inset-y-0 left-0 z-40 hidden w-64 shrink-0 flex-col text-white lg:flex xl:w-72"
        style={{ backgroundColor: FUNDO_BARRA }}
      >
        <div className="border-b border-white/20 px-5 py-5 xl:px-6 xl:py-6">
          <p className="text-[10px] font-semibold tracking-[0.22em] text-lavanda-200 uppercase">
            {BARRA.chapeu}
          </p>
          <h1 className="mt-2 font-display text-2xl leading-none font-bold xl:text-3xl">{META.titulo}</h1>
          <p className="mt-2 text-xs leading-relaxed text-white/80">{META.subtitulo}</p>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="space-y-1">
            {SECOES.map((s) => {
              const ativo = s.id === ativa;
              return (
                <li key={s.id}>
                  <button
                    onClick={() => ir(s.id)}
                    className={`group flex w-full cursor-pointer items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${
                      ativo ? "text-white shadow-md ring-1 ring-white/25" : "hover:bg-white/15"
                    }`}
                    style={ativo ? { backgroundColor: ABA_ATIVA } : undefined}
                  >
                    <span
                      className={`font-display text-lg leading-tight font-bold tabular-nums ${
                        ativo ? "text-lavanda-200" : "text-white"
                      }`}
                    >
                      {String(s.n).padStart(2, "0")}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm leading-snug font-semibold">{s.titulo}</span>
                      <span
                        className={`block text-[11px] leading-snug ${
                          ativo ? "text-white/80" : "text-white/85"
                        }`}
                      >
                        {s.subtitulo}
                      </span>
                    </span>
                    <span
                      className={`mt-0.5 shrink-0 text-[10px] font-semibold tabular-nums ${
                        ativo ? "text-white/75" : "text-white/80"
                      }`}
                    >
                      {s.tempo}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="border-t border-white/20 px-5 py-4 xl:px-6">
          <p className="text-xs font-semibold text-white">{META.autor}</p>
          <p className="mt-0.5 text-[11px] leading-snug text-white/75">{META.curso}</p>
          <p className="mt-2 text-[10px] text-white/60">
            {BARRA.dicaTeclado}
          </p>
        </div>
      </aside>

      {/* ─────────── Conteúdo ─────────── */}
      <div className="flex min-w-0 flex-1 flex-col pb-[calc(4.25rem+env(safe-area-inset-bottom))] lg:pb-0 lg:pl-64 xl:pl-72">
        {/* Cabeçalho mobile/tablet — mostra o nome completo da seção atual */}
        <header className="no-print sticky top-0 z-20 flex items-center gap-3 border-b border-papel-200 bg-papel-50/95 px-4 py-3 backdrop-blur lg:hidden">
          <span
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md font-display text-sm font-bold text-white"
            style={{ backgroundColor: ABA_ATIVA }}
          >
            {String(SECOES[indice].n).padStart(2, "0")}
          </span>
          <span className="min-w-0 flex-1 truncate font-display text-base font-bold text-azul-900 sm:text-lg">
            {SECOES[indice].titulo}
          </span>
        </header>

        {/* Barra de progresso da apresentação */}
        <div className="no-print h-1 w-full bg-papel-200">
          <div
            className="h-full bg-roxo-600 transition-all duration-500"
            style={{ width: `${((indice + 1) / SECOES.length) * 100}%` }}
          />
        </div>

        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6 md:px-8 md:py-10 lg:py-14">
          <Secao />
        </main>

        {/* Rodapé de navegação */}
        <footer className="no-print border-t border-papel-200 bg-white">
          <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-2 px-4 py-4 sm:gap-4 sm:px-6 sm:py-5 md:px-8">
            <button
              onClick={() => indice > 0 && ir(SECOES[indice - 1].id)}
              disabled={indice === 0}
              className="min-w-0 cursor-pointer truncate rounded-lg border border-papel-200 px-3 py-2 text-xs font-semibold text-azul-900 transition-colors hover:border-rosa-400 disabled:cursor-default disabled:opacity-30 sm:px-4 sm:text-sm"
            >
              ← {indice > 0 ? SECOES[indice - 1].titulo : RODAPE.inicio}
            </button>
            <span className="shrink-0 text-xs font-semibold tabular-nums text-azul-700/50">
              {indice + 1} / {SECOES.length}
            </span>
            <button
              onClick={() => indice < SECOES.length - 1 && ir(SECOES[indice + 1].id)}
              disabled={indice === SECOES.length - 1}
              className="min-w-0 cursor-pointer truncate rounded-lg bg-azul-900 px-3 py-2 text-xs font-semibold text-papel-100 transition-colors hover:bg-roxo-600 disabled:cursor-default disabled:opacity-30 sm:px-4 sm:text-sm"
            >
              {indice < SECOES.length - 1 ? SECOES[indice + 1].titulo : RODAPE.fim} →
            </button>
          </div>
        </footer>
      </div>

      {/* ─────────── Barra inferior (telas pequenas e médias) ─────────── */}
      <nav
        className="no-print fixed inset-x-0 bottom-0 z-40 flex justify-center lg:hidden"
        style={{ backgroundColor: FUNDO_BARRA, paddingBottom: "env(safe-area-inset-bottom)" }}
        aria-label={BARRA.rotuloNavegacao}
      >
        <ul className="flex w-full max-w-xl items-stretch gap-1 px-2 py-2">
          {SECOES.map((s) => {
            const ativo = s.id === ativa;
            return (
              <li key={s.id} className="flex-1">
                <button
                  onClick={() => ir(s.id)}
                  aria-label={`${s.n}. ${s.titulo}`}
                  aria-current={ativo ? "page" : undefined}
                  className={`flex w-full cursor-pointer items-center justify-center rounded-lg py-2.5 font-display text-base font-bold tabular-nums transition-colors ${
                    ativo ? "text-white shadow-md" : "text-white/60 hover:text-white/85"
                  }`}
                  style={ativo ? { backgroundColor: ABA_ATIVA } : undefined}
                >
                  {String(s.n).padStart(2, "0")}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
