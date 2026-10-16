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
  const total = site.secoes.length;
  return (
    <header className="mb-10 sm:mb-12">
      <div className="flex items-center gap-3 font-mono text-[11px] font-medium tracking-[0.14em] text-azul-700/70 uppercase">
        <span className="text-destaque-600">
          {String(s.n).padStart(2, "0")}
          <span className="text-azul-700/40"> / {String(total).padStart(2, "0")}</span>
        </span>
        <span className="h-px flex-1 bg-azul-950/15" />
        {s.tempo && <span>{s.tempo}</span>}
      </div>
      <h1 className="mt-5 font-display text-4xl leading-[1.02] font-semibold text-azul-950 sm:text-5xl md:text-6xl">
        {s.titulo}
      </h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-azul-700/80 sm:text-base">
        {s.subtituloLongo ?? s.subtitulo}
      </p>
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
    <div className={`rounded-lg border ${tons[tom]} ${className}`}>
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
    <p className="mt-4 border-l-2 border-destaque-600/50 pl-3 text-xs leading-relaxed text-azul-700/75 italic">
      {children}
    </p>
  );
}

/* Bloco recolhível. `aberto` define apenas o estado inicial. */
export function Sanfona({ titulo, subtitulo, children, aberto = false, cor, corTexto = "#fff", contagem }) {
  const [ativo, setAtivo] = useState(aberto);
  const fundo = cor ?? "var(--color-papel-100)";
  const tinta = cor ? corTexto : "var(--color-azul-950)";

  return (
    <div className="overflow-hidden rounded-lg border border-papel-200 bg-white">
      <button
        onClick={() => setAtivo((v) => !v)}
        aria-expanded={ativo}
        className="flex w-full cursor-pointer items-center justify-between gap-3 px-6 py-4 text-left transition-opacity hover:opacity-90"
        style={{ backgroundColor: fundo }}
      >
        <span className="min-w-0">
          <span className="block font-display text-xl leading-tight font-semibold" style={{ color: tinta }}>
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
