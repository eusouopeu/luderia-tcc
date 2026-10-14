import { useEffect, useRef, useState } from "react";
import site from "../conteudo/site.json";

/* O usuário pode ter pedido menos animação no sistema; nesse caso tudo entra já visível. */
const semAnimacao = () =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/* Revela o conteúdo quando ele entra na viewport. */
export function Reveal({ children, delay = 0, className = "" }) {
  const ref = useRef(null);
  const [visivel, setVisivel] = useState(semAnimacao);

  useEffect(() => {
    const el = ref.current;
    if (!el || semAnimacao()) return;
    const obs = new IntersectionObserver(
      ([entrada]) => entrada.isIntersecting && setVisivel(true),
      { threshold: 0.12 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visivel ? 1 : 0,
        transform: visivel ? "none" : "translateY(16px)",
        transition: `opacity .55s cubic-bezier(.22,1,.36,1) ${delay}ms, transform .55s cubic-bezier(.22,1,.36,1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

/* Cabeçalho da aba. Número, título e subtítulo vêm de conteudo/site.json. */
export function TituloSecao({ id }) {
  const s = site.secoes.find((x) => x.id === id);
  if (!s) return null;
  return (
    <header className="mb-8 border-b-2 border-azul-800/15 pb-5 sm:mb-10 sm:pb-6">
      <div className="flex flex-wrap items-baseline gap-3 sm:gap-4">
        <span className="font-display text-4xl leading-none font-bold text-roxo-600 tabular-nums sm:text-5xl md:text-6xl">
          {String(s.n).padStart(2, "0")}
        </span>
        <div className="min-w-0">
          <h1 className="font-display text-2xl leading-tight font-bold tracking-tight text-azul-950 sm:text-3xl md:text-4xl lg:text-5xl">
            {s.titulo}
          </h1>
          <p className="mt-1 text-xs font-medium tracking-wide text-azul-700/70 uppercase sm:text-sm">
            {s.subtituloLongo ?? s.subtitulo}
          </p>
        </div>
      </div>
    </header>
  );
}

export function Cartao({ children, className = "", tom = "claro" }) {
  const tons = {
    claro: "bg-white border-papel-200",
    areia: "bg-papel-100 border-papel-200",
    escuro: "bg-azul-950 border-azul-900 text-papel-50",
    brasa: "bg-roxo-600 border-roxo-700 text-white",
  };
  return (
    <div className={`rounded-xl border shadow-sm ${tons[tom]} ${className}`}>
      {children}
    </div>
  );
}

export function Etiqueta({ children, cor = "var(--color-roxo-600)", escura = false }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide whitespace-nowrap ${
        escura ? "text-white" : "text-azul-950"
      }`}
      style={{ backgroundColor: cor }}
    >
      {children}
    </span>
  );
}

/* Números que contam a partir de zero quando entram na tela. */
export function Contador({ valor, sufixo = "", decimais = 0, duracao = 900 }) {
  const ref = useRef(null);
  const [n, setN] = useState(() => (semAnimacao() ? valor : 0));

  useEffect(() => {
    const el = ref.current;
    if (!el || semAnimacao()) return;
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      obs.disconnect();
      const inicio = performance.now();
      const passo = (agora) => {
        const t = Math.min((agora - inicio) / duracao, 1);
        setN(valor * (1 - Math.pow(1 - t, 3)));
        if (t < 1) requestAnimationFrame(passo);
      };
      requestAnimationFrame(passo);
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, [valor, duracao]);

  return (
    <span ref={ref} className="tabular-nums">
      {n.toLocaleString("pt-BR", {
        minimumFractionDigits: decimais,
        maximumFractionDigits: decimais,
      })}
      {sufixo}
    </span>
  );
}

export function Nota({ children }) {
  return (
    <p className="mt-4 border-l-2 border-rosa-400 pl-3 text-xs leading-relaxed text-azul-700/70 italic">
      {children}
    </p>
  );
}

/* Bloco recolhível. `aberto` define apenas o estado inicial. */
export function Sanfona({ titulo, subtitulo, children, aberto = false, cor, corTexto = "#fff", contagem }) {
  const [ativo, setAtivo] = useState(aberto);
  const fundo = cor ?? "var(--color-papel-200)";
  const tinta = cor ? corTexto : "var(--color-azul-950)";

  return (
    <div className="overflow-hidden rounded-xl border border-papel-200 bg-white shadow-sm">
      <button
        onClick={() => setAtivo((v) => !v)}
        aria-expanded={ativo}
        className="flex w-full cursor-pointer items-center justify-between gap-3 px-6 py-4 text-left transition-opacity hover:opacity-90"
        style={{ backgroundColor: fundo }}
      >
        <span className="min-w-0">
          <span className="block font-display text-xl leading-tight font-bold" style={{ color: tinta }}>
            {titulo}
          </span>
          {subtitulo && (
            <span className="mt-0.5 block text-xs" style={{ color: tinta, opacity: 0.75 }}>
              {subtitulo}
            </span>
          )}
        </span>
        <span className="flex shrink-0 items-center gap-3">
          {contagem != null && (
            <span
              className="rounded-full px-2.5 py-0.5 text-xs font-bold tabular-nums"
              style={{ backgroundColor: "rgba(255,255,255,.28)", color: tinta }}
            >
              {contagem}
            </span>
          )}
          <svg
            width="18" height="18" viewBox="0 0 24 24" fill="none"
            stroke={tinta} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            style={{ transform: ativo ? "rotate(180deg)" : "none", transition: "transform .3s ease" }}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </span>
      </button>
      <div className="grid transition-all duration-300" style={{ gridTemplateRows: ativo ? "1fr" : "0fr" }}>
        <div className="overflow-hidden">{children}</div>
      </div>
    </div>
  );
}
