// Formatação pt-BR e cores dos gráficos das abas de resultados do B1.
/* Formatação pt-BR usada nas abas de resultados do B1. */
export const num = (v, dec = 0) =>
  v == null
    ? "—"
    : Number(v).toLocaleString("pt-BR", { minimumFractionDigits: dec, maximumFractionDigits: dec });
export const reais = (v) => (v == null ? "—" : `R$ ${num(v, 2)}`);
export const pct = (v, dec = 0) => (v == null ? "—" : `${num(v * 100, dec)}%`);
export const hora = (v) => {
  if (v == null) return "—";
  const h = Math.floor(v) % 24;
  const m = Math.round((v % 1) * 60);
  return m ? `${h}h${String(m).padStart(2, "0")}` : `${h}h`;
};
export const milhar = (v) => (v == null ? "—" : v >= 10000 ? `${num(v / 1000, 1)} mil` : num(v));

/* Formata um valor conforme a unidade da variável no JSON gerado pelo script. */
export function porUnidade(v, unidade) {
  if (v == null) return "—";
  if (unidade === "R$") return reais(v);
  if (unidade === "%") return pct(v, 2);
  if (unidade === "hora do dia") return hora(v);
  if (unidade === "1 a 5") return num(v, 2);
  return Math.abs(v) >= 100 ? num(v) : num(v, Number.isInteger(v) ? 0 : 1);
}

/* Cores fixas dos gráficos (SVG não lê as classes do Tailwind). Séries em cinza; `destaque`
   só para o que importa à decisão: Salvador (ou o Nordeste), críticas, amostras fora do critério. */
export const COR = {
  azul: "#404040",
  azulClaro: "#b5b5b5",
  neutra: "#e0e0e0",
  referencia: "#737373",
  destaque: "#b91c1c",
  grade: "#e5e5e5",
  texto: "#262626",
};

export const eixo = { fontSize: 11, fill: COR.texto };
