// Funções de apoio dos blocos de conteúdo (src/components/blocos.jsx e src/sections/Secao.jsx).

/* "5.742,30" -> 5742.3 */
export const numero = (s) => parseFloat(String(s).replace(/\./g, "").replace(",", ".").replace(/[^\d.-]/g, ""));

/* Identificador de âncora a partir do título da seção. */
export const slug = (t) =>
  t.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

/* Título de cada bloco que aparece no índice "Nesta aba". */
export function titulosDe(blocos) {
  return blocos
    .map((b) => b.titulo2 ?? b.secao ?? (["texto", "cartoes", "passos", "abas", "sanfona"].includes(b.tipo) ? b.titulo : null))
    .filter(Boolean);
}
