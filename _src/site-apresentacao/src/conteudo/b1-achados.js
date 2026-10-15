// Achados das abas de resultados do B1. O texto fica aqui, e os números vêm de
// b1-estatisticas.json (gerado por B1-a_estatistica_descritiva.py): ao rodar o
// script de novo, as frases se atualizam sozinhas. Para mudar a redação, edite as
// frases abaixo; para mudar um número, rode o script.
import D from "./b1-estatisticas.json";
import { num, reais, pct, hora, milhar } from "../formato";

const G = D.geral;
const lista = (xs) => (xs.length > 1 ? `${xs.slice(0, -1).join(", ")} e ${xs.at(-1)}` : xs[0]);
const dia = (nome) => D.dias.find((d) => d.dia === nome);
const fechaMeiaNoite = D.fechamento.filter((f) => ["0h", "1h"].includes(f.hora)).reduce((s, f) => s + f.casas, 0);
const comDado = (lista, campo) => lista.filter((x) => x[campo]?.mediana != null);
const maior = (lista, campo) => [...comDado(lista, campo)].sort((a, b) => b[campo].mediana - a[campo].mediana)[0];
const menor = (lista, campo) => [...comDado(lista, campo)].sort((a, b) => a[campo].mediana - b[campo].mediana)[0];

export function achadosGerais() {
  const seg = dia("segunda");
  const dom = dia("domingo");
  const cov = D.proporcoes.cobra_couvert;
  const metro = D.proporcoes.tem_metro_1000m;
  return [
    `Quinta, sexta e sábado são os dias em que todas as ${D.total_casas} casas abrem. Na segunda, abrem ${seg.casas} (${pct(seg.pct)}); no domingo, ${dom.casas} (${pct(dom.pct)}).`,
    `A abertura mediana é às ${hora(G.abre_cedo_h.mediana)}, e ${fechaMeiaNoite} casas (${pct(fechaMeiaNoite / D.total_casas)}) fecham à meia-noite ou depois em ao menos um dia. A mediana é de ${num(G.horas_semana.mediana)} horas abertas por semana.`,
    `A cesta por pessoa (couvert + bebida + entrada ou prato) tem mediana de ${reais(G.cesta_mediana.mediana)} entre ${G.cesta_mediana.n} casas com cardápio, de ${reais(G.cesta_mediana.min)} a ${reais(G.cesta_mediana.max)}. Só ${cov.casas} dessas ${cov.n} casas cobram couvert ou taxa de jogo.`,
    `A nota no Google quase não varia: ${num(G.avaliacao_media.min, 1)} a ${num(G.avaliacao_media.max, 1)}, com coeficiente de variação de ${pct(G.avaliacao_media.cv)}. O volume de avaliações varia muito mais (${num(G.volume_avaliacoes.min)} a ${num(G.volume_avaliacoes.max)}): é o volume, e não a nota, que separa as casas.`,
    `A mediana de seguidores é de ${milhar(G.seguidores.mediana)}, mas a mediana de interações por post no período é de ${num(G.interacoes_por_post.mediana)}: engajamento mediano de ${pct(G.engajamento_pct.mediana, 2)} dos seguidores.`,
    `${metro.casas} das ${metro.n} casas (${pct(metro.casas / metro.n)}) têm estação de metrô a até 1 km. O shopping mais próximo fica, na mediana, a ${num(G.dist_shopping_m.mediana)} m em linha reta.`,
  ];
}

export function achadosMetropoles() {
  const M = D.metropoles;
  const [primeira, segunda] = M;
  const empatadas = M.filter((m) => m.casas === segunda.casas).map((m) => m.grupo);
  const umaCasa = M.filter((m) => m.casas === 1).map((m) => m.grupo);
  const ssa = M.find((m) => m.grupo === "Salvador");
  const com2 = M.filter((m) => m.com_cardapio >= 2);
  const caro = maior(com2, "cesta_mediana");
  const barato = menor(com2, "cesta_mediana");
  const seg = maior(M.filter((m) => m.casas >= 2), "seguidores");
  return [
    `${primeira.grupo} concentra ${primeira.casas} das ${D.total_casas} casas (${pct(primeira.pct)}), ${num(primeira.casas / segunda.casas, 1)} vezes o número da segunda colocada. ${lista(empatadas)} vêm em seguida, com ${segunda.casas} cada.`,
    `${umaCasa.length} metrópoles têm uma única luderia com mais de 100 avaliações: ${lista(umaCasa)}. Em Salvador, essa casa é a São Jogue, com ${num(ssa.volume_avaliacoes.mediana)} avaliações e nota ${num(ssa.avaliacao_media.mediana, 1)}.`,
    `Entre as metrópoles com ao menos duas casas com cardápio, a cesta mediana vai de ${reais(barato.cesta_mediana.mediana)} em ${barato.grupo} a ${reais(caro.cesta_mediana.mediana)} em ${caro.grupo}.`,
    `Entre as metrópoles com duas casas ou mais, ${seg.grupo} tem a maior mediana de seguidores (${milhar(seg.seguidores.mediana)}).`,
    `Grupos com uma ou duas casas descrevem essas casas, e não a metrópole: os valores servem de referência, sem generalização.`,
  ];
}

export function achadosRegioes() {
  const R = D.regioes;
  const r = (n) => R.find((x) => x.grupo === n);
  const [se, ne, sul, co] = ["Sudeste", "Nordeste", "Sul", "Centro-Oeste"].map(r);
  const grandes = R.filter((x) => x.casas >= 5);
  const domMax = [...grandes].sort((a, b) => b.abre_domingo - a.abre_domingo)[0];
  const segMax = [...grandes].sort((a, b) => b.abre_segunda - a.abre_segunda)[0];
  return [
    `O Sudeste reúne ${se.casas} das ${D.total_casas} casas (${pct(se.pct)}). O Nordeste tem ${ne.casas} (${pct(ne.pct)}), e nenhuma delas tem cardápio transcrito.`,
    `A cesta mediana é de ${reais(se.cesta_mediana.mediana)} no Sudeste, contra ${reais(sul.cesta_mediana.mediana)} no Sul e ${reais(co.cesta_mediana.mediana)} no Centro-Oeste.`,
    `No Sul, nenhuma casa tem estação de metrô a até 1 km (${pct(sul.tem_metro_1000m)}); no Sudeste, ${pct(se.tem_metro_1000m)} têm.`,
    `Entre as regiões com cinco casas ou mais, o ${domMax.grupo} tem a maior proporção de casas abertas no domingo (${pct(domMax.abre_domingo)}), e o ${segMax.grupo}, na segunda (${pct(segMax.abre_segunda)}).`,
    `Norte e Nordeste somam ${r("Norte").casas + ne.casas} casas: as médias dessas regiões dependem de poucos estabelecimentos.`,
  ];
}
