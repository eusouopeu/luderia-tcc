// Ponte entre os nomes de cor usados nos arquivos .json de conteúdo e os tokens
// definidos em index.css. Nos JSON escreva apenas o nome ("azul", "roxo", …).
// Paleta atual: preto, cinza e branco. Os nomes "azul", "roxo", "lavanda", "rosa" e "carmesim"
// são apelidos herdados para tons de cinza (do mais escuro ao mais claro), mantidos para não
// obrigar a reescrever o conteúdo em src/conteudo/*.json. A cor de destaque (vermelho) fica fora
// desta lista: é usada só nas seções, nos casos pertinentes (ver index.css).
export const CORES = {
  azul: "var(--color-azul-800)",
  azulEscuro: "var(--color-azul-900)",
  azulProfundo: "var(--color-azul-950)",
  roxo: "var(--color-roxo-600)",
  roxoEscuro: "var(--color-roxo-700)",
  lavanda: "var(--color-lavanda-400)",
  lavandaClara: "var(--color-lavanda-200)",
  rosa: "var(--color-rosa-500)",
  carmesim: "var(--color-carmesim-600)",
  papel: "var(--color-papel-200)",
  branco: "#ffffff",
};

// Cores em que o texto por cima precisa ser branco.
const FUNDO_ESCURO = new Set([
  "azul", "azulEscuro", "azulProfundo", "roxo", "roxoEscuro", "carmesim",
]);

export const cor = (nome) => CORES[nome] ?? CORES.azul;
export const textoSobre = (nome) => (FUNDO_ESCURO.has(nome) ? "#ffffff" : "var(--color-azul-950)");
export const ehEscura = (nome) => FUNDO_ESCURO.has(nome);
