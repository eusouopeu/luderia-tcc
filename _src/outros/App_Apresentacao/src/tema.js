// Ponte entre os nomes de cor usados nos arquivos .json de conteúdo e os tokens
// definidos em index.css. Nos JSON escreva apenas o nome ("azul", "roxo", …).
// Paleta purple e slate: "azulProfundo" é o slate (tinta), e "azul", "azulEscuro", "roxo", "roxoEscuro", "lavanda", "rosa" e "carmesim" são a
// escala do purple, do mais forte ao mais claro; "papel" é o slate claro. Os nomes foram herdados da primeira
// versão e mantidos para não reescrever o conteúdo de src/conteudo/*.json. As cores seguem o tema
// claro ou escuro do sistema, porque apontam para variáveis CSS.
export const CORES = {
  azul: "var(--color-roxo-600)",
  azulEscuro: "var(--color-roxo-700)",
  azulProfundo: "var(--color-azul-950)",
  roxo: "var(--color-rosa-500)",
  roxoEscuro: "var(--color-carmesim-600)",
  lavanda: "var(--color-lavanda-400)",
  lavandaClara: "var(--color-lavanda-200)",
  rosa: "var(--color-rosa-500)",
  carmesim: "var(--color-carmesim-600)",
  papel: "var(--color-papel-200)",
  branco: "var(--color-white)",
};

// Cores em que o texto por cima precisa ser claro (texto "sobre tinta").
const FUNDO_ESCURO = new Set([
  "azul", "azulEscuro", "azulProfundo", "roxo", "roxoEscuro", "carmesim", "rosa",
]);

export const cor = (nome) => CORES[nome] ?? CORES.azul;
export const textoSobre = (nome) => (FUNDO_ESCURO.has(nome) ? "var(--color-on-ink)" : "var(--color-azul-950)");
export const ehEscura = (nome) => FUNDO_ESCURO.has(nome);
