import { useEffect, useState, useCallback } from "react";
import site from "./conteudo/site.json";
import S1Estrutura from "./sections/S1Estrutura";
import S2Teorico from "./sections/S2Teorico";
import S3Metodologia from "./sections/S3Metodologia";
import S4Indicadores from "./sections/S4Indicadores";
import S5Modelo from "./sections/S5Modelo";
import S6Tecnicas from "./sections/S6Tecnicas";
import S7Contribuicoes from "./sections/S7Contribuicoes";
import S8Panorama from "./sections/S8Panorama";
import S9Metropoles from "./sections/S9Metropoles";
import S10Regioes from "./sections/S10Regioes";
import S11Conteudo from "./sections/S11Conteudo";
import S12Auditorias from "./sections/S12Auditorias";

const { secoes: SECOES, meta: META, barraLateral: BARRA, rodape: RODAPE } = site;

const COMPONENTES = {
  estrutura: S1Estrutura,
  teorico: S2Teorico,
  metodologia: S3Metodologia,
  indicadores: S4Indicadores,
  modelo: S5Modelo,
  tecnicas: S6Tecnicas,
  contribuicoes: S7Contribuicoes,
  panorama: S8Panorama,
  metropoles: S9Metropoles,
  regioes: S10Regioes,
  conteudo: S11Conteudo,
  auditorias: S12Auditorias,
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
      <aside className="no-print fixed inset-y-0 left-0 z-40 hidden w-64 shrink-0 flex-col border-r border-papel-200 bg-papel-100 text-azul-950 lg:flex xl:w-72">
        <div className="px-5 pt-6 pb-5 xl:px-6 xl:pt-8">
          <p className="font-mono text-[10px] font-medium tracking-[0.18em] text-azul-700/70 uppercase">
            {BARRA.chapeu}
          </p>
          <h1 className="mt-3 font-display text-3xl leading-[0.95] font-semibold xl:text-[2.15rem]">
            {META.titulo}
          </h1>
          <p className="mt-3 text-xs leading-relaxed text-azul-700/80">{META.subtitulo}</p>
          <div className="mt-5 h-px bg-azul-950/15" />
        </div>

        <nav className="flex-1 overflow-y-auto px-3 pb-4">
          <ul>
            {SECOES.map((s) => {
              const ativo = s.id === ativa;
              return (
                <li key={s.id}>
                  <button
                    onClick={() => ir(s.id)}
                    aria-current={ativo ? "page" : undefined}
                    className={`group relative flex w-full cursor-pointer items-start gap-3 rounded-md px-3 py-2 text-left transition-colors ${
                      ativo ? "bg-white shadow-[0_1px_0_rgb(28_27_25/0.06)]" : "hover:bg-papel-200/50"
                    }`}
                  >
                    <span
                      className={`absolute inset-y-2 left-0 w-[3px] rounded-full bg-destaque-600 transition-opacity ${
                        ativo ? "opacity-100" : "opacity-0"
                      }`}
                    />
                    <span
                      className={`mt-[3px] font-mono text-[11px] font-medium ${
                        ativo ? "text-destaque-600" : "text-azul-700/50"
                      }`}
                    >
                      {String(s.n).padStart(2, "0")}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span
                        className={`block text-[13px] leading-snug font-semibold ${
                          ativo ? "text-azul-950" : "text-azul-800/85 group-hover:text-azul-950"
                        }`}
                      >
                        {s.titulo}
                      </span>
                      {ativo && (
                        <span className="mt-0.5 block text-[11px] leading-snug text-azul-700/70">{s.subtitulo}</span>
                      )}
                    </span>
                    <span className="mt-[3px] shrink-0 font-mono text-[10px] text-azul-700/50">{s.tempo}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="border-t border-papel-200 px-5 py-4 xl:px-6">
          <p className="text-xs font-semibold">{META.autor}</p>
          <p className="mt-0.5 text-[11px] leading-snug text-azul-700/75">{META.curso}</p>
          <p className="mt-3 flex items-center gap-1.5 text-[10px] text-azul-700/60">
            <kbd className="rounded border border-papel-200 bg-white px-1 font-mono">←</kbd>
            <kbd className="rounded border border-papel-200 bg-white px-1 font-mono">→</kbd>
            <span>{BARRA.dicaTeclado.replace(/^Use ← → para /, "")}</span>
          </p>
        </div>
      </aside>

      {/* ─────────── Conteúdo ─────────── */}
      <div className="papel-milimetrado flex min-w-0 flex-1 flex-col pb-[calc(4.25rem+env(safe-area-inset-bottom))] lg:pb-0 lg:pl-64 xl:pl-72">
        {/* Cabeçalho mobile/tablet — mostra o nome completo da seção atual */}
        <header className="no-print sticky top-0 z-20 flex items-center gap-3 border-b border-papel-200 bg-papel-50/95 px-4 py-3 backdrop-blur lg:hidden">
          <span className="shrink-0 font-mono text-sm font-medium text-destaque-600">
            {String(SECOES[indice].n).padStart(2, "0")}
          </span>
          <span className="min-w-0 flex-1 truncate font-display text-lg font-semibold text-azul-950 sm:text-xl">
            {SECOES[indice].titulo}
          </span>
        </header>

        {/* Barra de progresso da apresentação */}
        <div className="no-print h-[3px] w-full bg-papel-200/70">
          <div
            className="h-full bg-destaque-600 transition-all duration-500"
            style={{ width: `${((indice + 1) / SECOES.length) * 100}%` }}
          />
        </div>

        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6 md:px-8 md:py-10 lg:py-14">
          <Secao />
        </main>

        {/* Rodapé de navegação */}
        <footer className="no-print border-t border-papel-200 bg-papel-50/90 backdrop-blur">
          <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-2 px-4 py-4 sm:gap-4 sm:px-6 sm:py-5 md:px-8">
            <button
              onClick={() => indice > 0 && ir(SECOES[indice - 1].id)}
              disabled={indice === 0}
              className="min-w-0 cursor-pointer truncate rounded-md border border-papel-200 bg-white px-3 py-2 text-xs font-semibold text-azul-900 transition-colors hover:border-azul-950/40 disabled:cursor-default disabled:opacity-30 sm:px-4 sm:text-sm"
            >
              ← {indice > 0 ? SECOES[indice - 1].titulo : RODAPE.inicio}
            </button>
            <span className="shrink-0 text-xs tabular-nums text-azul-700/60">
              {indice + 1} / {SECOES.length}
            </span>
            <button
              onClick={() => indice < SECOES.length - 1 && ir(SECOES[indice + 1].id)}
              disabled={indice === SECOES.length - 1}
              className="min-w-0 cursor-pointer truncate rounded-md bg-azul-950 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-destaque-700 disabled:cursor-default disabled:opacity-30 sm:px-4 sm:text-sm"
            >
              {indice < SECOES.length - 1 ? SECOES[indice + 1].titulo : RODAPE.fim} →
            </button>
          </div>
        </footer>
      </div>

      {/* ─────────── Barra inferior (telas pequenas e médias) ─────────── */}
      <nav
        className="no-print fixed inset-x-0 bottom-0 z-40 flex justify-center border-t border-papel-200 bg-papel-100/95 backdrop-blur lg:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
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
                  className={`flex w-full cursor-pointer items-center justify-center rounded-md py-2.5 font-mono text-sm font-medium transition-colors ${
                    ativo ? "bg-azul-950 text-white" : "text-azul-700/60 hover:text-azul-950"
                  }`}
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
