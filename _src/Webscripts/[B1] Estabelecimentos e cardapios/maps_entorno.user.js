// ==UserScript==
// @name         Entorno no Google Maps (TCC Luderia)
// @namespace    tcc-luderia
// @version      2026.11.13-1
// @description  Conta estações de metrô, de trem, de VLT, de BRT e shoppings a 500 m e 1000 m de cada estabelecimento no Google Maps (shopping de porte pelo número de avaliações); coleta a lista de estabelecimentos e exporta CSV.
// @match        https://www.google.com/maps/*
// @match        https://www.google.com.br/maps/*
// @match        https://www.google.com/sorry/*
// @match        https://www.google.com.br/sorry/*
// @run-at       document-idle
// @noframes
// @grant        none
// ==/UserScript==

/*
 * Bloco B1, entorno dos estabelecimentos: âncoras de fluxo (cap. 5 e 7.1).
 *
 * Fonte única: buscas do Google Maps em volta de cada estabelecimento (abre
 * páginas; cerca de 1 min por estabelecimento). O OpenStreetMap saiu do
 * coletor na versão 2026.10.30-1 (decisão de 30/10/2026: o entorno usa só o
 * Maps, e o porte do shopping, só o número de avaliações).
 * O painel trabalha sobre a LISTA de estabelecimentos (a população, em
 * dados/B1_entorno/_dados-agregados/B1_entorno_maps_fila.csv, gerada por
 * B1-b_entorno_maps_fila.py). "Coletar no Maps os N que faltam" busca só os
 * da lista ainda sem coleta. Nada é apagado ao coletar; "Refazer" recoleta só
 * o que o botão indica.
 *
 * RODE NUMA JANELA PRÓPRIA, não numa aba em segundo plano: o navegador
 * desacelera os temporizadores de abas escondidas e a fila se arrasta.
 *
 * Menu (mesmo padrão do coletor de preços): o seletor do topo traz os estabelecimentos da
 * lista por cidade, com ✓ coletado, ! pendente e ○ falta. Escolher um abre as buscas no Maps
 * e coleta só ele (já coletado: pede confirmação e refaz); "Próximo" coleta o próximo que
 * falta ou está pendente, primeiro na mesma cidade. A coleta pelo menu não exporta sozinha.
 *
 * ---------- Buscas ----------
 *
 * Para cada estabelecimento (place_id, nome, lat, lng; cidade opcional), o
 * script faz buscas do Maps em volta da coordenada, lê todos os resultados
 * (nome, categoria, coordenada, avaliações), calcula a distância em linha
 * reta (haversine) e conta os que caem a até 500 m e 1000 m.
 *
 * Buscas: "estação de metrô", "estação de trem", "estação BRT", "estação VLT",
 * "estação tubo" (só em Curitiba: a busca "estação BRT" não devolve as
 * estações-tubo da RIT) e "shopping center". Cada resultado vai para UM grupo pela própria categoria e
 * nome no Maps (classificar), nunca pela busca que o trouxe; repetido entre
 * buscas conta uma vez. Grupos: metro, trem, vlt, brt, shopping, outro.
 *  - metro: metrôs (inclui o monotrilho das linhas 15 e 17 de São Paulo
 *    quando o Maps o põe na categoria de metrô);
 *  - trem: trens metropolitanos (CPTM, SuperVia, Trensurb), pelo operador
 *    mesmo quando a categoria é metrô;
 *  - vlt: veículo leve sobre trilhos (VLT Carioca, da Baixada Santista, de
 *    Fortaleza, de Salvador), bonde de uso urbano (Santa Teresa), aeromóvel
 *    de Porto Alegre e monotrilho fora da categoria de metrô;
 *  - brt: ônibus em corredor (BRT, estações-tubo da RIT de Curitiba). É
 *    ônibus, não trilho.
 * Até a versão 2026.11.12-1, vlt e brt saíam juntos (qt_estacoes_vlt_brt_*):
 * nas exportações antigas essa coluna é "VLT ou BRT, sem separação".
 * Colunas derivadas "trilhos" = metro + trem + vlt: qt_estacoes_trilhos_<raio>m
 * e dist_trilhos_mais_proxima_m, em branco se algum dos três ficou em branco.
 * A classificação é refeita na exportação, então regra nova vale também para o
 * que já está guardado.
 *
 * Buscas dispensadas. Nas metrópoles da REGIC sem metrô, trem, VLT ou BRT em
 * operação (SEM_SISTEMA, situação em novembro de 2026), a busca desse sistema
 * não é feita: o grupo sai zero, não branco, e a coluna consultas_dispensadas
 * diz o porquê. Nessas cidades, resultado que cai no grupo do sistema
 * ausente (estação desativada do trem do subúrbio de Salvador, estação de
 * longa distância da Vitória-Minas em Belo Horizonte) vai para "outro" e
 * para a revisão manual.
 *
 * Distância da mais próxima: só até 1000 m, onde a busca cobre o mapa
 * inteiro. Acima disso a lista do Maps não garante a mais próxima (até a
 * versão 2026.10.15-4 saía a mais próxima "lida", com 3 a 16 km em 18 de 51
 * casas). Distância em branco com contagem zero a 1000 m: nenhuma até 1000 m;
 * com contagem em branco: busca falhou ou não feita. Resultado a mais de
 * 50 km fica com fora_da_regiao = sim (o Maps completa listas com outras
 * cidades).
 *
 * Área coberta, falhas e censura. O script desloca o centro para que o
 * estabelecimento fique no meio do mapa visível (à direita do painel do Maps)
 * e escolhe o maior zoom que cobre 1000 m com 10% de folga; se não cobre,
 * refaz com zoom menor. Página que não carrega em 20 s é tentada de novo até 2
 * vezes; depois o grupo fica em branco (nunca zero). "Tráfego incomum" pausa a
 * fila com alarme. Lista lotada sem a marca de fim é refeita em quatro
 * quadrantes; quadrante lotado marca censura possível.
 * Estações (desde 2026.11.12-3): lista com 10 ou mais itens é refeita em
 * quatro quadrantes mesmo com a marca de fim. Na coleta de 12/11 (versão -2)
 * as buscas de metrô e trem voltaram com exatamente 10 itens, num ranking da
 * cidade que ignorava o mapa, e omitiram estações a 300 m. Estação no raio
 * trazida só pela busca de outro grupo, com lista do próprio grupo cheia,
 * marca censura possível ("cruzamento"); a contagem não é corrigida.
 *
 * Duplicatas. Resultados do mesmo grupo a até 150 m e com nome parecido
 * contam uma vez (fica o de mais avaliações). Shoppings, até 400 m (as
 * entradas de um shopping grande ficam a mais de 150 m uma da outra): mesmo
 * nome sem "shopping", "mall" e espaços ("DiamondMall" = "Diamond Mall") ou
 * cadastro de parte do shopping (entrada, estacionamento, garagem, sala, piso,
 * torre, bloco, acesso, portaria) perto de outro shopping. Estações: cadastro
 * de parada, saída, acesso, entrada, plataforma ou embarque a até 150 m de
 * outra estação do mesmo grupo conta uma vez, mesmo com outro nome ("Parada
 * VLT - Colombo" = Sete de Setembro).
 *
 * Classificação de ruído: traçado, mapa ou trajeto da linha vai para
 * "outro"; loja, escola ou curso com a categoria de shopping também;
 * "Centro comercial" com "shopping" ou "mall" no nome vai para shopping.
 *
 * Revisão. "Revisar classificação": resultados do Maps no grupo "outro" a até
 * 1000 m com cara de estação ou shopping, para reclassificar com um clique.
 *
 * ---------- Shopping de porte: número de avaliações ----------
 *
 * O Maps dá a categoria "Shopping center" também a galerias e prédios
 * comerciais. Shopping de porte = avaliações no Maps >= limiar (painel;
 * padrão 1.000). O limiar não tem fonte externa e a distribuição de 15/10
 * (157 shoppings a até 1000 m das 54 casas) não tem corte natural; por isso o
 * resumo traz também as contagens com 500, 1.000 e 5.000 avaliações
 * (qt_shoppings_aval_min_<limiar>_<raio>m), para a análise de sensibilidade.
 * Avaliações não lidas (cartão sem o número) deixam o porte daquele shopping
 * em branco, nunca "não": o total do raio fica em branco e a situação diz
 * "avaliações não lidas"; o estabelecimento entra nos pendentes ("Refazer
 * pendentes" recoleta). Cartão com "Nenhuma avaliação" vale 0.
 *
 * ---------- CSVs (";" e UTF-8 com BOM) ----------
 *
 * "Exportar" baixa os três arquivos da lista (ou de tudo o que está guardado,
 * sem lista). O nome começa pela data local e traz o estabelecimento (ou
 * "N_estabelecimentos"). Um estabelecimento por linha no resumo, com linha
 * também para quem ainda não foi coletado (situacao diz o quê):
 *  - …_entorno_resumo.csv: qt_*_500m contidas em qt_*_1000m; a 1000 m,
 *    metro + trem + vlt + brt + shoppings + outros = resultados_ate_1000m;
 *  - …_entorno_resultados.csv: um resultado por linha;
 *  - …_entorno_shoppings.csv: um shopping por linha (sem duplicatas), com
 *    avaliações e porte.
 * O resumo traz versao_script, a versão que fez a coleta (em branco nas
 * coletas anteriores a 2026.10.15-4). O fim da fila baixa os três; a cada 10
 * estabelecimentos, resumo e resultados parciais (opção no painel).
 */

(function () {
  'use strict';

  // Versão gravada nos CSVs. Não usa GM_info: pelo carregador, ele dá a versão do carregador.
  const VERSAO = '2026.11.13-1';
  const CHAVE_DADOS = 'tcc-entorno-dados-v2';
  const CHAVE_FILA = 'tcc-entorno-fila-v2';
  const CHAVE_REVISOES = 'tcc-entorno-revisoes';
  const CHAVE_OPCOES = 'tcc-entorno-opcoes';
  const CHAVE_PAINEL_MAPS = 'tcc-entorno-largura-painel-maps';
  const CHAVE_POSICAO = 'tcc-entorno-posicao';
  const CHAVE_LISTA = 'tcc-entorno-lista';
  const CHAVE_ITEM = 'tcc-entorno-item'; // estabelecimento escolhido no menu
  const CHAVE_SO_FALTAM = 'tcc-entorno-so-faltam';
  // Coleta do OSM das versões até 2026.10.15-4: só para o botão que a apaga.
  const CHAVE_OSM_ANTIGA = 'tcc-entorno-osm-v1';

  const RAIOS_M = [500, 1000];
  const RAIO_MAX = 1000;
  const FOLGA = 1.1;
  const ZOOM_MAX = 17;
  const ZOOM_MIN = 11;
  const PAINEL_MAPS_PADRAO_PX = 480;
  const TENTATIVAS = 2;
  const DIST_DUPLICATA_M = 150;
  // Entradas e cadastros do mesmo shopping grande ficam a mais de 150 m.
  const DIST_DUPLICATA_SHOPPING_M = 400;
  // Acima disso o resultado é de outra região (o Maps completa a lista com
  // estações de outras cidades): fica no CSV de resultados, fora do resumo.
  const DIST_REGIAO_M = 50000;
  // Limiares de avaliações exportados lado a lado (sensibilidade do porte).
  const LIMIARES_AVAL = [500, 1000, 5000];
  const PARCIAL_A_CADA = 10;
  const PAUSA_ENTRE_BUSCAS = [3000, 6000];
  const CONSULTAS = [
    { consulta: 'estação de metrô', grupo: 'metro' },
    { consulta: 'estação de trem', grupo: 'trem' },
    { consulta: 'estação BRT', grupo: 'brt' },
    { consulta: 'estação VLT', grupo: 'vlt' },
    { consulta: 'estação tubo', grupo: 'brt' },
    { consulta: 'shopping center', grupo: 'shopping' },
  ];
  // Consultas dos estabelecimentos guardados antes do campo "consultas" (até 13/10/2026).
  const CONSULTAS_ANTIGAS = ['estação de metrô', 'estação BRT', 'estação VLT', 'shopping center'];
  // Sistemas ausentes por metrópole (REGIC), em novembro de 2026: a busca é dispensada.
  // Chave: nome da cidade sem acento, em minúsculas, como sai do endereço.
  // São Paulo faz a busca de VLT (monotrilho fora da categoria de metrô) e
  // Porto Alegre também (aeromóvel). Salvador: trem do subúrbio desativado em
  // 2021; o VLT que o substitui fica com a busca feita (estação em obras sai
  // "outro" pelo nome). Belo Horizonte: o trem da Vitória-Minas é de longa
  // distância, não sistema urbano. Campinas: sem metrô, trem urbano ou VLT
  // (o VLT de 1990 a 1995 foi desativado); tem BRT.
  const METRO = 'estação de metrô';
  const TREM = 'estação de trem';
  const VLT = 'estação VLT';
  const BRT = 'estação BRT';
  const TUBO = 'estação tubo';
  // Buscas que só valem em algumas cidades; nas demais, dispensadas.
  const SO_NAS_CIDADES = { [TUBO]: ['curitiba'] };
  const SEM_SISTEMA = {
    'sao paulo': [],
    'rio de janeiro': [],
    brasilia: [TREM, VLT],
    campinas: [METRO, TREM, VLT],
    belem: [METRO, TREM, VLT],
    'belo horizonte': [TREM, VLT],
    curitiba: [METRO, TREM, VLT],
    florianopolis: [METRO, TREM, VLT, BRT],
    fortaleza: [],
    goiania: [METRO, TREM, VLT],
    manaus: [METRO, TREM, VLT, BRT],
    'porto alegre': [],
    recife: [],
    salvador: [TREM],
    vitoria: [METRO, TREM, VLT, BRT],
  };
  const TRANSPORTE = ['metro', 'trem', 'vlt', 'brt'];
  // "Trilhos": metrô, trem e VLT (BRT é ônibus).
  const TRILHOS = ['metro', 'trem', 'vlt'];
  function consultasDispensadas(cidade) {
    const c = semAcento(cidade).trim();
    const locais = Object.entries(SO_NAS_CIDADES).filter(([, cs]) => !cs.includes(c)).map(([q]) => q);
    return [...(SEM_SISTEMA[c] || []), ...locais];
  }
  // Grupos sem sistema na cidade: todas as buscas do grupo dispensadas pelo SEM_SISTEMA.
  function gruposAusentes(cidade) {
    const sem = SEM_SISTEMA[semAcento(cidade).trim()] || [];
    const grupos = [...new Set(CONSULTAS.map((c) => c.grupo))];
    return grupos.filter((g) => {
      const qs = CONSULTAS.filter((c) => c.grupo === g && !(SO_NAS_CIDADES[c.consulta])).map((c) => c.consulta);
      return qs.length && qs.every((q) => sem.includes(q));
    });
  }
  const GRUPOS = { metro: 'estacoes_metro', trem: 'estacoes_trem', vlt: 'estacoes_vlt', brt: 'estacoes_brt', shopping: 'shoppings' };
  const OPCOES_PADRAO = { limiar_aval: 1000, parcial: true };

  // ---------- utilidades ----------

  const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
  const sortear = ([a, b]) => a + Math.random() * (b - a);
  const semAcento = (t) => String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const juntar = (lista) => [...new Set(lista)].join(' | ');

  const doisDig = (n) => String(n).padStart(2, '0');
  // Data local (não UTC: depois das 21h em Brasília, toISOString já dá o dia seguinte).
  const dataLocal = (d) => `${d.getFullYear()}-${doisDig(d.getMonth() + 1)}-${doisDig(d.getDate())}`;
  const nomeArquivo = (t) => semAcento(t || 'lugar').replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 60) || 'lugar';

  function agora() {
    const d = new Date();
    return `${dataLocal(d)} ${doisDig(d.getHours())}:${doisDig(d.getMinutes())}`;
  }

  function ler(chave, padrao) {
    try { return JSON.parse(localStorage.getItem(chave)) ?? padrao; } catch (_) { return padrao; }
  }

  function gravar(chave, valor) {
    try { localStorage.setItem(chave, JSON.stringify(valor)); return true; } catch (e) { status(`Não consegui gravar no navegador (espaço cheio?): ${e.message}`, 'erro'); return false; }
  }

  const dadosVazios = () => ({ locais: [], resultados: [] });
  const lerDados = () => { const d = ler(CHAVE_DADOS, null); return d && Array.isArray(d.locais) ? d : dadosVazios(); };
  const lerOpcoes = () => ({ ...OPCOES_PADRAO, ...ler(CHAVE_OPCOES, {}) });

  // Distância em linha reta, em metros.
  function distancia(lat1, lng1, lat2, lng2) {
    const r = (x) => (x * Math.PI) / 180;
    const h = Math.sin(r(lat2 - lat1) / 2) ** 2 + Math.cos(r(lat1)) * Math.cos(r(lat2)) * Math.sin(r(lng2 - lng1) / 2) ** 2;
    return Math.round(12742000 * Math.asin(Math.sqrt(h)));
  }

  // Desloca uma coordenada em metros (norte e leste).
  function deslocar(lat, lng, norte, leste) {
    return [lat + norte / 111320, lng + leste / (111320 * Math.cos((lat * Math.PI) / 180))];
  }

  function urlBusca(consulta, lat, lng, zoom) {
    return `https://www.google.com/maps/search/${encodeURIComponent(consulta)}/@${lat.toFixed(7)},${lng.toFixed(7)},${zoom}z?hl=pt-BR`;
  }

  function tocar(tipo) {
    if (!kit.som) return; // sino do cabeçalho do painel
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const notas = tipo === 'alerta' ? [880, 660, 880, 660, 880] : [523, 659, 784];
      notas.forEach((f, i) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.frequency.value = f;
        o.connect(g);
        g.connect(ctx.destination);
        const t0 = ctx.currentTime + i * 0.18;
        g.gain.setValueAtTime(0.15, t0);
        g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.16);
        o.start(t0);
        o.stop(t0 + 0.17);
      });
    } catch (_) { /* som é só aviso */ }
  }

  // ---------- área coberta pela busca ----------

  // Metros por pixel no zoom z (blocos de 256 px).
  function mPorPx(lat, z) { return (156543.03392 * Math.cos((lat * Math.PI) / 180)) / 2 ** z; }

  function medirPainelMaps() {
    const r = document.querySelector('div[role="main"]')?.getBoundingClientRect();
    if (r && r.left < 200 && r.right > 200 && r.right < innerWidth - 100) {
      try { localStorage.setItem(CHAVE_PAINEL_MAPS, String(Math.round(r.right))); } catch (_) { /* sem cache */ }
      return Math.round(r.right);
    }
    return +localStorage.getItem(CHAVE_PAINEL_MAPS) || PAINEL_MAPS_PADRAO_PX;
  }

  function janelaAtual() { return { w: innerWidth, h: innerHeight, painel: medirPainelMaps() }; }

  // Maior zoom em que o mapa visível (à direita do painel do Maps) cobre o
  // alcance em volta do alvo, e o centro "@" que põe o alvo no meio do mapa
  // visível: o "@" é o centro da janela, então vai painel/2 px para oeste.
  function planejarBusca(lat, lng, alcance, jan, reducao = 0) {
    const meia = Math.min((jan.w - jan.painel) / 2, jan.h / 2);
    let z = ZOOM_MAX;
    while (z > ZOOM_MIN && meia * mPorPx(lat, z) < alcance * FOLGA) z--;
    z = Math.max(ZOOM_MIN, z - reducao);
    const [clat, clng] = deslocar(lat, lng, 0, -(jan.painel / 2) * mPorPx(lat, z));
    return { zoom: z, lat: clat, lng: clng };
  }

  // Posição de uma coordenada na janela, em px, e metros por px.
  function naTela(lat, lng, busca, jan) {
    const mpp = mPorPx(lat, busca.zoom);
    const leste = (lng - busca.lng) * 111320 * Math.cos((lat * Math.PI) / 180);
    const norte = (lat - busca.lat) * 111320;
    return { x: jan.w / 2 + leste / mpp, y: jan.h / 2 - norte / mpp, mpp };
  }

  // Distância do alvo até a borda mais próxima do mapa visível, em metros.
  function coberturaReal(alvoLat, alvoLng, busca, jan) {
    const { x, y, mpp } = naTela(alvoLat, alvoLng, busca, jan);
    return Math.round(Math.max(0, Math.min(x - jan.painel, jan.w - x, y, jan.h - y)) * mpp);
  }

  // Resultado fora do mapa visível (com 50 px de folga): o Maps já esgotou a
  // área e completou a lista com lugares de fora.
  function foraDoMapa(r, busca, jan) {
    const { x, y } = naTela(r.lat, r.lng, busca, jan);
    return x < jan.painel - 50 || x > jan.w + 50 || y < -50 || y > jan.h + 50;
  }

  // ---------- classificação: um grupo por resultado, pelo próprio atributo ----------

  // VLT, bonde de uso urbano, aeromóvel e monotrilho (fora da categoria de metrô).
  const RE_VLT = /\bvlt\b|veiculo leve|light rail|\bbonde\b|\btram\b|tranvia|aeromovel|monotrilho|monorail/;
  const RE_BRT = /\bbrt\b|bus rapid/;

  function classificar(nome, categoria) {
    const n = semAcento(nome);
    const c = semAcento(categoria).trim();
    // Estação ainda não inaugurada ("Futura estação Rua do Grito (BRT ABC)") ou fechada.
    if (/\bfutura\b|em (obras|construcao|implantacao)|desativad|\bplanejad|\bprojetad/.test(n)) return 'outro';
    // Traçado ou mapa da linha não é parada ("Traçado do mapa do vlt rio de janeiro").
    if (/\btracado\b|\bmapa\b|\btrajeto\b|\bitinerario\b/.test(n)) return 'outro';
    // Loja ou escola com a categoria de shopping ("Loja T-Rex Brasil", "Minds Idiomas").
    if (/^(shopping|shopping center|shopping mall|outlet)$/.test(c) && /^lojas?\b|\bidiomas\b|\bescola\b|\bcursos?\b/.test(n)) return 'outro';
    if (/^(shopping|shopping center|shopping mall|outlet)$/.test(c)) return 'shopping';
    // Centro comercial com "shopping" ou "mall" no nome ("Shopping Buritis").
    if (/^centro comercial$/.test(c) && /\bshopping\b|\bmall\b/.test(n)) return 'shopping';
    const transporte = /transporte|estacao|parada|ponto|terminal|onibus|trem|bonde|metro/.test(c);
    // VLT e aeromóvel pelo nome valem mais que a categoria (o Maps põe parada do VLT como metrô).
    if (/\bvlt\b|aeromovel/.test(n) && transporte) return 'vlt';
    // Nome do operador vale mais que a categoria: "Trensurb Estação Rodoviária" vem como metrô.
    if (/\b(cptm|supervia|trensurb)\b/.test(n) && /estacao|transporte|metro/.test(c)) return 'trem';
    // Metrô, inclusive monotrilho na categoria de metrô (linhas 15 e 17 de São Paulo).
    if (/\bmetro\b|subway/.test(c)) return 'metro';
    // Estações-tubo do BRT de Curitiba (RIT), muitas sem categoria no Maps.
    if (/^estacao tubo\b/.test(n)) return 'brt';
    if (RE_VLT.test(c)) return 'vlt';
    if (RE_BRT.test(c)) return 'brt';
    // "Companhia ferroviária" é a sede do operador, não estação.
    if (/\btrem\b|\btrens\b|ferrovi|train station|railway/.test(c) && !/^(companhia|empresa)\b/.test(c)) return 'trem';
    if (RE_VLT.test(n) && transporte) return 'vlt';
    if (RE_BRT.test(n) && transporte) return 'brt';
    if (/\bmetro\b/.test(n) && /estacao|transporte/.test(c)) return 'metro';
    if (/\b(cptm|supervia|trensurb|trem)\b/.test(n) && /estacao|transporte/.test(c)) return 'trem';
    return 'outro';
  }

  // Grupo automático na cidade do estabelecimento: sistema ausente vira "outro" (vai para a revisão).
  function classificarNaCidade(nome, categoria, cidade) {
    const g = classificar(nome, categoria);
    return gruposAusentes(cidade).includes(g) ? 'outro' : g;
  }

  // Revisão manual gravada com o grupo antigo "vlt_brt" (até 2026.11.12-1): separa pelo nome e categoria.
  function grupoRevisto(rev, nome, categoria) {
    if (rev !== 'vlt_brt') return rev;
    const t = semAcento(`${nome} ${categoria}`);
    return RE_BRT.test(t) || /estacao tubo/.test(t) ? 'brt' : RE_VLT.test(t) ? 'vlt' : 'brt';
  }

  // "Outro" com cara de estação ou shopping: vai para a revisão manual.
  function suspeito(r) {
    return r.grupo_auto === 'outro' && r.distancia_m <= RAIO_MAX &&
      /estac|terminal|metro|\bbrt\b|\bvlt\b|\btrem\b|cptm|supervia|trensurb|ferrovi|bonde|aeromovel|monotrilho|shopping|\bmall\b/.test(semAcento(`${r.nome} ${r.categoria_maps}`));
  }

  // ---------- duplicatas ----------

  const PALAVRAS_GENERICAS = new Set(['estacao', 'estacoes', 'metro', 'trem', 'cptm', 'supervia', 'trensurb', 'brt', 'vlt', 'aeromovel', 'monotrilho', 'bonde', 'shopping', 'center', 'mall', 'de', 'da', 'do', 'das', 'dos', 'e', 'linha', 'sentido', 'plataforma', 'terminal', 'parada', 'ponto', 'station', 'praca', 'parque', 'praia', 'largo', 'jardim']);

  function palavras(t) {
    return new Set(semAcento(t).split(/[^a-z0-9]+/).filter((p) => p && !PALAVRAS_GENERICAS.has(p) && !/^\d{1,2}$/.test(p)));
  }

  function nomesParecidos(a, b) {
    const pa = palavras(a);
    const pb = palavras(b);
    if (!pa.size || !pb.size) return true;
    const comuns = [...pa].filter((p) => pb.has(p)).length;
    return comuns / Math.min(pa.size, pb.size) >= 0.5;
  }

  // Nome do shopping sem "shopping", "mall" etc. e sem espaços ("DiamondMall" = "Diamond Mall").
  function nomeShopping(t) {
    return semAcento(t).replace(/[^a-z0-9]+/g, ' ').replace(/\b(shopping|center|centre|mall|outlet|de|da|do|das|dos|e|the)\b/g, ' ').replace(/\s+/g, '');
  }

  function mesmoShopping(a, b) {
    const x = nomeShopping(a);
    const y = nomeShopping(b);
    if (!x || !y) return false;
    return x === y || (x.length >= 4 && y.length >= 4 && (x.includes(y) || y.includes(x)));
  }

  // Cadastro de parte de um shopping ("Entrada C - Diamond Mall", "Garagem boulevard").
  const PARTE_DE_SHOPPING = /\b(entrada|estacionamento|garagem|sala|piso|torre|bloco|acesso|portaria)\b/;
  // Cadastro de parada, saída ou acesso de uma estação ("Parada VLT - Colombo"
  // a 70 m da parada Sete de Setembro): mesma estação mesmo com outro nome.
  const PARTE_DE_ESTACAO = /\b(parada|saida|acesso|entrada|plataforma|embarque|desembarque)\b/;

  // r repete m (m tem mais avaliações): mesmo grupo, perto e nome parecido.
  function repete(m, r) {
    if (m.grupo !== r.grupo) return false;
    const d = distancia(m.lat, m.lng, r.lat, r.lng);
    if (d <= DIST_DUPLICATA_M && nomesParecidos(m.nome, r.nome)) return true;
    if (TRANSPORTE.includes(r.grupo) && d <= DIST_DUPLICATA_M && (PARTE_DE_ESTACAO.test(semAcento(r.nome)) || PARTE_DE_ESTACAO.test(semAcento(m.nome)))) return true;
    return r.grupo === 'shopping' && d <= DIST_DUPLICATA_SHOPPING_M && (mesmoShopping(m.nome, r.nome) || PARTE_DE_SHOPPING.test(semAcento(r.nome)));
  }

  // Marca duplicata_de nos resultados de um estabelecimento (fica o de mais avaliações).
  function marcarDuplicatas(rs) {
    const mantidos = [];
    for (const r of [...rs].sort((a, b) => (+b.n_avaliacoes || 0) - (+a.n_avaliacoes || 0))) {
      const igual = r.grupo !== 'outro' && mantidos.find((m) => repete(m, r));
      r.duplicata_de = igual ? igual.nome : '';
      if (!igual) mantidos.push(r);
    }
    return rs;
  }

  // ---------- shopping de porte: número de avaliações ----------

  // Avaliações não lidas ('') deixam o porte em branco, nunca "não".
  const avaliacoesLidas = (r) => r.n_avaliacoes != null && r.n_avaliacoes !== '' && Number.isFinite(+r.n_avaliacoes);
  const porteAval = (r, limiar) => (avaliacoesLidas(r) ? (+r.n_avaliacoes >= limiar ? 'sim' : 'não') : '');
  const criterioPorte = (op) => `${op.limiar_aval} avaliações ou mais no Maps`;

  // Um shopping por linha a até 1000 m (sem duplicatas nem resultados de outra região).
  function montarShoppings(local, rs, op) {
    return (rs || []).filter((r) => r.grupo === 'shopping' && !r.duplicata_de && !r.fora_da_regiao && r.distancia_m <= RAIO_MAX)
      .map((r) => ({
        origem_place_id: local.place_id, origem_nome: local.nome, nome: r.nome, categoria_maps: r.categoria_maps,
        n_avaliacoes: avaliacoesLidas(r) ? r.n_avaliacoes : '', place_id: r.place_id, chave_maps: chave(r), distancia_m: r.distancia_m,
        porte: porteAval(r, op.limiar_aval), criterio_porte: criterioPorte(op),
        porte_base: avaliacoesLidas(r) ? `${r.n_avaliacoes} avaliações` : 'avaliações não lidas',
        ...Object.fromEntries(LIMIARES_AVAL.map((l) => [`aval_min_${l}`, porteAval(r, l)])),
      }))
      .sort((a, b) => a.distancia_m - b.distancia_m);
  }

  // Shoppings de porte no raio pelo campo dado; algum em branco deixa o total em branco.
  function contarPorte(shops, campo, raio) {
    const noRaio = shops.filter((s) => s.distancia_m <= raio);
    return noRaio.some((s) => s[campo] === '') ? '' : noRaio.filter((s) => s[campo] === 'sim').length;
  }
  // ---------- leitura da lista de resultados ----------

  function lerHref(href) {
    const coord = href.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/) || [];
    return {
      lat: coord[1] ? +coord[1] : null,
      lng: coord[2] ? +coord[2] : null,
      place_id: (href.match(/!19s(ChIJ[^!?&]+)/) || [])[1] || '',
      id_maps: (href.match(/!1s(0x[0-9a-f]+:0x[0-9a-f]+)/i) || [])[1] || '',
    };
  }

  // Número de avaliações entre parênteses: "(1.731)", "(1,2 mil)" ou "(12 mil)".
  // A nota ("4,5") fica fora dos parênteses; texto sem número dá ''.
  function lerNumeroAvaliacoes(texto) {
    const m = String(texto || '').match(/\(\s*(\d+(?:,\d+)?\s*mil|\d{1,3}(?:[.\s]\d{3})*)\s*\)/i);
    if (!m) return '';
    if (/mil/i.test(m[1])) return String(Math.round(parseFloat(m[1].replace(',', '.')) * 1000));
    return m[1].replace(/\D/g, '');
  }

  // Cartão da lista: "Nome\n4,5(77)\nShopping center ·  · Av. Santa Luzia, 656\n..."
  function lerCartao(nome, texto, href) {
    const linhas = String(texto || '').split('\n').map((l) => l.trim()).filter(Boolean);
    // A categoria é o primeiro trecho entre "·" que não é nota, preço ou vazio
    // (há cartões com "4,0(1.731) · $$" antes da linha da categoria).
    const ehNota = (s) => /^\d[.,]\d\s*\(/.test(s) || /^\$+$|^R\$/.test(s) || !s;
    const categoria = linhas.filter((l) => l.includes('·'))
      .map((l) => l.split('·').map((s) => s.trim()).find((s) => !ehNota(s)) || '')
      .find(Boolean) || '';
    const notaLinha = linhas.find((l) => /^\d[.,]\d\s*\(/.test(l)) || '';
    // Sem a linha da nota: "Nenhuma avaliação" vale 0; o resto fica em branco (não lida).
    const semAvaliacao = linhas.some((l) => /^(nenhuma avaliacao|sem avaliacoes|no reviews)$/.test(semAcento(l)));
    const avaliacoes = notaLinha ? lerNumeroAvaliacoes(notaLinha) : semAvaliacao ? '0' : '';
    return { nome: String(nome || '').trim(), categoria_maps: categoria, n_avaliacoes: avaliacoes, ...lerHref(href) };
  }

  function lista() { return document.querySelector('div[role="feed"]'); }

  function fimDaLista(feed) {
    return /chegou ao final da lista|reached the end of the list/i.test(feed?.innerText || '');
  }

  function bloqueado() {
    if (/^\/sorry\//.test(location.pathname)) return true;
    if (lista()) return false;
    return /trafego incomum|unusual traffic|nao sou um robo|not a robot/.test(semAcento((document.body?.innerText || '').slice(0, 3000)));
  }

  function semResultados() {
    return /nao encontrou|nao conseguiu encontrar|nenhum resultado|no results|can't find/.test(semAcento(document.querySelector('div[role="main"]')?.innerText || ''));
  }

  function resultadosNaTela() {
    return [...document.querySelectorAll('a.hfpxzc')].map((a) => lerCartao(a.getAttribute('aria-label'), a.parentElement?.innerText, a.href));
  }

  // Espera a busca: lista, lugar único (h1), "nenhum resultado" ou bloqueio.
  // Sem nenhum desses em 20 s, a busca falhou (não é zero resultados).
  async function esperarBusca() {
    for (let i = 0; i < 40; i++) {
      if (bloqueado()) return 'bloqueado';
      if (lista() && document.querySelector('a.hfpxzc')) return 'lista';
      if (document.querySelector('h1.DUwDvf') && /\/maps\/place\//.test(location.href)) return 'lugar';
      if (semResultados()) return 'vazio';
      await esperar(500);
    }
    return 'falhou';
  }

  async function lerBusca() {
    const estado = await esperarBusca();
    if (estado === 'bloqueado' || estado === 'falhou') return { estado, itens: [], fim: true };
    await esperar(1200);
    if (estado === 'vazio') return { estado, itens: [], fim: true };
    if (estado === 'lugar') {
      const nome = document.querySelector('h1.DUwDvf')?.innerText || '';
      const categoria = document.querySelector('button[jsaction*="category"]')?.innerText || '';
      const resumo = document.querySelector('div.F7nice')?.innerText || '';
      const avaliacoes = lerNumeroAvaliacoes(resumo) || (/nenhuma avaliacao|no reviews/.test(semAcento(resumo)) ? '0' : '');
      return { estado, itens: [{ nome, categoria_maps: categoria, n_avaliacoes: avaliacoes, ...lerHref(location.href) }], fim: true };
    }
    const feed = lista();
    let antes = -1;
    let parado = 0;
    for (let i = 0; i < 15 && !fimDaLista(feed); i++) {
      const n = document.querySelectorAll('a.hfpxzc').length;
      if (n === antes) { if (++parado >= 2) break; } else parado = 0;
      antes = n;
      feed.scrollTop = feed.scrollHeight;
      await esperar(1300);
    }
    const itens = resultadosNaTela().filter((r) => r.lat != null);
    return { estado, itens, fim: fimDaLista(feed) };
  }

  const LISTA_CHEIA = 10;
  // Lista com 10 ou mais itens sem a marca de fim pode ter cortado resultados.
  function precisaSubdividir(n, chegouAoFim) { return n >= LISTA_CHEIA && !chegouAoFim; }

  // O que fazer com a lista lida: '' (completa), 'subdividir' ou 'censura'.
  // Estações: lista com 10 ou mais itens se divide sempre, mesmo com a marca de
  // fim e itens fora do mapa. Na coleta de 12/11 as buscas de metrô e trem
  // voltaram com exatamente 10 itens e a marca de fim, num ranking da cidade
  // que ignorava o mapa (casas distantes com a mesma lista) e omitia estações a
  // 300 m (Glória e Largo do Machado na Luderia Carioca). Demais listas: lotada
  // sem a marca de fim divide; item fora do mapa indica área esgotada.
  function decidirLista({ n, fim, quadrante, grupo, algumForaDoMapa }) {
    if (!quadrante && TRANSPORTE.includes(grupo) && n >= LISTA_CHEIA) return 'subdividir';
    if (!precisaSubdividir(n, fim) || algumForaDoMapa) return '';
    return quadrante ? 'censura' : 'subdividir';
  }

  // Estação no raio trazida só pela busca de outro grupo, com uma lista do
  // próprio grupo cheia: a lista do grupo foi cortada. Vira censura possível
  // ("estação de metrô (cruzamento: Catete)"), nunca contagem corrigida.
  function cruzamento(unidos, lidos) {
    const tamanhos = new Map();
    for (const r of lidos) tamanhos.set(r.consulta, (tamanhos.get(r.consulta) || 0) + 1);
    const cheio = (g) => [...tamanhos].some(([rot, n]) => grupoDaConsulta(rot) === g && n >= LISTA_CHEIA);
    const doGrupo = (r) => String(r.consultas || '').split(' | ').some((c) => grupoDaConsulta(c) === r.grupo_auto);
    const noRaio = unidos.filter((r) => TRANSPORTE.includes(r.grupo_auto) && r.distancia_m <= RAIO_MAX);
    return noRaio
      .filter((r) => !doGrupo(r) && cheio(r.grupo_auto)
        // Outro cadastro da mesma estação já veio pela busca do grupo.
        && !noRaio.some((o) => o !== r && o.grupo_auto === r.grupo_auto && doGrupo(o) && distancia(o.lat, o.lng, r.lat, r.lng) <= DIST_DUPLICATA_M))
      .map((r) => `${CONSULTAS.find((c) => c.grupo === r.grupo_auto).consulta} (cruzamento: ${r.nome})`);
  }

  // ---------- plano de buscas ----------

  function tarefasIniciais(local) {
    const dispensadas = consultasDispensadas(local?.cidade);
    return CONSULTAS.filter((c) => !dispensadas.includes(c.consulta)).map((c) => ({ ...c, norte: 0, leste: 0, alcance: RAIO_MAX, quadrante: '', tentativas: 0, reducao: 0 }));
  }

  function quadrantes(t) {
    const d = RAIO_MAX / 2;
    return [[d, -d, 'NO'], [d, d, 'NE'], [-d, -d, 'SO'], [-d, d, 'SE']]
      .map(([norte, leste, q]) => ({ consulta: t.consulta, grupo: t.grupo, norte, leste, alcance: d, quadrante: q, tentativas: 0, reducao: 0 }));
  }

  const rotulo = (t) => t.consulta + (t.quadrante ? ` ${t.quadrante}` : '');
  const grupoDaConsulta = (r) => CONSULTAS.find((c) => r.startsWith(c.consulta))?.grupo;
  const chaveLocal = (l) => l.place_id || `${l.lat},${l.lng}`;

  function chave(r) {
    return r.place_id || r.id_maps || `${semAcento(r.nome)}@${r.lat?.toFixed(4)},${r.lng?.toFixed(4)}`;
  }

  // Une os resultados das buscas de um estabelecimento: cada um entra uma vez.
  function unir(resultados) {
    const vistos = new Map();
    for (const r of resultados) {
      const k = chave(r);
      const ja = vistos.get(k);
      if (ja) { ja.consultas = juntar([...ja.consultas.split(' | '), r.consulta]); continue; }
      vistos.set(k, { ...r, consultas: r.consulta });
    }
    return [...vistos.values()];
  }

  // ---------- resumo (montado na exportação, com revisões e critério atuais) ----------

  const consultasDoLocal = (local) => local.consultas || CONSULTAS_ANTIGAS;
  const consultasFaltantes = (local) => CONSULTAS.map((c) => c.consulta)
    .filter((c) => !consultasDoLocal(local).includes(c) && !(local.consultas_dispensadas || []).includes(c) && !consultasDispensadas(local.cidade).includes(c));

  function problemas(local) {
    const p = [];
    if (consultasFaltantes(local).length) p.push('busca nova não feita');
    if (local.falhas?.length) p.push('falhou');
    if (local.cobertura_insuf?.length) p.push('cobertura insuficiente');
    if (local.censura?.length) p.push('censura possível');
    return p;
  }

  // Linha de quem está na lista mas ainda não tem coleta.
  function linhaVazia(local, cols, situacao) {
    const linha = Object.fromEntries(cols.map((c) => [c, '']));
    return Object.assign(linha, { place_id: local.place_id, nome: local.nome, cidade: local.cidade || '', lat: local.lat, lng: local.lng, situacao });
  }

  function resumirLocal(local, rs, shops, op) {
    const validos = rs.filter((r) => !r.duplicata_de);
    // Grupo de consulta que falhou ou não foi feita fica em branco (não zero).
    const falhos = new Set([...(local.falhas || []), ...consultasFaltantes(local)].map(grupoDaConsulta));
    const linha = { place_id: local.place_id, nome: local.nome, cidade: local.cidade || '', lat: local.lat, lng: local.lng };
    for (const [grupo, col] of Object.entries(GRUPOS)) {
      const itens = validos.filter((r) => r.grupo === grupo);
      for (const raio of RAIOS_M) linha[`qt_${col}_${raio}m`] = falhos.has(grupo) ? '' : itens.filter((r) => r.distancia_m <= raio).length;
    }
    const semMaps = falhos.has('shopping');
    for (const raio of RAIOS_M) linha[`qt_shoppings_porte_${raio}m`] = semMaps ? '' : contarPorte(shops, 'porte', raio);
    for (const l of LIMIARES_AVAL) for (const raio of RAIOS_M) linha[`qt_shoppings_aval_min_${l}_${raio}m`] = semMaps ? '' : contarPorte(shops, `aval_min_${l}`, raio);
    linha.criterio_porte_shopping = criterioPorte(op);
    linha.shoppings_sem_avaliacao_lida = semMaps ? '' : shops.filter((s) => s.porte === '').length;
    linha.qt_outros_1000m = validos.filter((r) => r.grupo === 'outro' && r.distancia_m <= RAIO_MAX).length;
    linha.resultados_ate_1000m = validos.filter((r) => r.distancia_m <= RAIO_MAX).length;
    // Distâncias só até RAIO_MAX, onde a busca cobre o mapa inteiro; acima, a
    // lista do Maps não garante a mais próxima.
    const noRaio = validos.filter((r) => !r.fora_da_regiao && r.distancia_m <= RAIO_MAX);
    for (const [grupo, col] of Object.entries(GRUPOS)) {
      const d = noRaio.filter((r) => r.grupo === grupo).map((r) => r.distancia_m);
      linha[`dist_${col}_mais_proxima_m`] = d.length && !falhos.has(grupo) ? Math.min(...d) : '';
    }
    // Estação mais próxima de qualquer sistema; em branco se algum não foi medido.
    const estacao = TRANSPORTE.some((g) => falhos.has(g)) ? null
      : noRaio.filter((r) => TRANSPORTE.includes(r.grupo)).sort((a, b) => a.distancia_m - b.distancia_m)[0];
    // Trilhos (metro + trem + vlt): em branco se algum dos três não foi medido.
    const semTrilhos = TRILHOS.some((g) => falhos.has(g));
    for (const raio of RAIOS_M) linha[`qt_estacoes_trilhos_${raio}m`] = semTrilhos ? '' : TRILHOS.reduce((s, g) => s + linha[`qt_${GRUPOS[g]}_${raio}m`], 0);
    const dTrilhos = noRaio.filter((r) => TRILHOS.includes(r.grupo)).map((r) => r.distancia_m);
    linha.dist_trilhos_mais_proxima_m = semTrilhos || !dTrilhos.length ? '' : Math.min(...dTrilhos);
    linha.dist_estacao_mais_proxima_m = estacao ? estacao.distancia_m : '';
    linha.estacao_mais_proxima = estacao ? estacao.nome : '';
    linha.tipo_estacao_mais_proxima = estacao ? estacao.grupo : '';
    linha.duplicatas_fundidas = rs.filter((r) => r.duplicata_de).length;
    linha.revisoes_manuais = rs.filter((r) => r.revisado).length;
    linha.buscas = local.buscas;
    linha.cobertura_min_m = local.cobertura_min_m ?? '';
    linha.consultas_subdivididas = juntar(local.subdivididas || []);
    linha.consultas_falhas = juntar(local.falhas || []);
    linha.consultas_nao_feitas = juntar(consultasFaltantes(local));
    linha.consultas_dispensadas = juntar(local.consultas_dispensadas || []);
    linha.consultas_cobertura_insuficiente = juntar(local.cobertura_insuf || []);
    linha.consultas_censura = juntar(local.censura || []);
    // Avaliação não lida não refaz a coleta (o cartão pode não ter o número): só avisa.
    const avisos = linha.shoppings_sem_avaliacao_lida ? ['avaliações não lidas'] : [];
    linha.situacao = [...problemas(local), ...avisos].join('; ') || 'ok';
    linha.coletado_em = local.coletado_em;
    linha.versao_script = local.versao_script || '';
    return linha;
  }

  // Estabelecimentos de várias listas, cada um uma vez.
  function uniaoLocais(...listas) {
    const vistos = new Map();
    for (const l of listas.flat()) {
      const k = chaveLocal(l);
      if (!vistos.has(k)) vistos.set(k, { place_id: l.place_id, nome: l.nome, cidade: l.cidade || '', lat: l.lat, lng: l.lng });
    }
    return [...vistos.values()];
  }

  // Sem lista, sai tudo o que está guardado; com lista, uma linha por
  // estabelecimento da lista no resumo, coletado ou não.
  function montarSaida(dados, revisoes, op, lista = null) {
    const universo = lista?.length ? uniaoLocais(lista) : uniaoLocais(dados.locais);
    const doMaps = new Map(dados.locais.map((l) => [l.chave, l]));
    const saida = { universo, resumo: [], resultados: [], shoppings: [] };
    for (const alvo of universo) {
      const k = chaveLocal(alvo);
      const local = doMaps.get(k);
      if (!local) { saida.resumo.push(linhaVazia(alvo, colsResumo(), 'não coletado no Maps')); continue; }
      const rs = dados.resultados.filter((r) => r.origem === k).map((r) => {
        const rev = grupoRevisto(revisoes[chave(r)], r.nome, r.categoria_maps);
        const grupo_auto = classificarNaCidade(r.nome, r.categoria_maps, local.cidade || alvo.cidade);
        return { ...r, grupo_auto, grupo: rev || grupo_auto, revisado: rev ? 'sim' : '', fora_da_regiao: r.distancia_m > DIST_REGIAO_M ? 'sim' : '' };
      });
      marcarDuplicatas(rs);
      const shops = montarShoppings(alvo, rs, op);
      const porChave = new Map(shops.map((s) => [s.chave_maps, s]));
      for (const r of rs) {
        const s = r.grupo === 'shopping' ? porChave.get(chave(r)) : null;
        r.porte_shopping = s ? s.porte : '';
        r.porte_base = s ? s.porte_base : '';
      }
      saida.resultados.push(...rs);
      saida.resumo.push(resumirLocal(local, rs, shops, op));
      saida.shoppings.push(...shops);
    }
    return saida;
  }

  // ---------- tabelas de entrada ----------

  // Separa uma linha de CSV com aspas, por "," ou ";".
  function campos(linha, sep) {
    const out = [];
    let atual = '';
    let aspas = false;
    for (let i = 0; i < linha.length; i++) {
      const ch = linha[i];
      if (aspas) {
        if (ch === '"' && linha[i + 1] === '"') { atual += '"'; i++; } else if (ch === '"') aspas = false; else atual += ch;
      } else if (ch === '"') aspas = true;
      else if (ch === sep) { out.push(atual); atual = ''; } else atual += ch;
    }
    out.push(atual);
    return out.map((c) => c.trim());
  }

  function lerTabela(texto) {
    const linhas = String(texto || '').replace(/^﻿/, '').split(/\r?\n/).filter((l) => l.trim());
    if (!linhas.length) return { cab: [], linhas: [] };
    const sep = (linhas[0].match(/;/g) || []).length >= (linhas[0].match(/,/g) || []).length ? ';' : ',';
    return { cab: campos(linhas[0], sep).map(semAcento), linhas: linhas.map((l) => campos(l, sep)) };
  }

  // "R. Chile, 2077 - Rebouças, Curitiba - PR, 80220-181, Brazil" -> "Curitiba"
  function cidadeDoEndereco(endereco) {
    const m = [...String(endereco || '').matchAll(/,\s*([^,]+?)\s+-\s+[A-Z]{2}\b/g)];
    return m.length ? m[m.length - 1][1].trim() : '';
  }

  // Aceita CSV com cabeçalho (place_id, nome, lat, lng; cidade, capital_endereco
  // ou endereco opcionais) ou linhas soltas "place_id;nome;lat;lng".
  function lerFila(texto) {
    const { cab, linhas } = lerTabela(texto);
    if (!linhas.length) return [];
    const temCab = cab.includes('lat') && cab.includes('lng');
    const col = (n) => (temCab ? cab.indexOf(n) : -1);
    const idx = temCab ? { place_id: col('place_id'), nome: col('nome'), lat: col('lat'), lng: col('lng') } : { place_id: 0, nome: 1, lat: 2, lng: 3 };
    const colCidade = ['cidade', 'municipio', 'capital_endereco'].map(col).find((i) => i >= 0) ?? -1;
    const colEndereco = col('endereco');
    const vistos = new Set();
    const out = [];
    for (const c of temCab ? linhas.slice(1) : linhas) {
      const lat = parseFloat(String(c[idx.lat] ?? '').replace(',', '.'));
      const lng = parseFloat(String(c[idx.lng] ?? '').replace(',', '.'));
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
      const cidade = (colCidade >= 0 && c[colCidade]) || (colEndereco >= 0 ? cidadeDoEndereco(c[colEndereco]) : '');
      const local = { place_id: idx.place_id >= 0 ? c[idx.place_id] || '' : '', nome: idx.nome >= 0 ? c[idx.nome] || '' : '', cidade, lat, lng };
      const k = chaveLocal(local);
      if (vistos.has(k)) continue;
      vistos.add(k);
      out.push(local);
    }
    return out;
  }

  // ---------- fila ----------

  function localAberto() {
    const nome = document.querySelector('h1.DUwDvf')?.innerText.trim() || '';
    const h = lerHref(location.href);
    if (!nome || h.lat == null) return null;
    const endereco = (document.querySelector('button[data-item-id="address"]')?.getAttribute('aria-label') || '').replace(/^(endereço|address):\s*/i, '');
    return { place_id: h.place_id, nome, cidade: cidadeDoEndereco(endereco), lat: h.lat, lng: h.lng };
  }

  function zerarLocal(fila) {
    Object.assign(fila, { tarefas: tarefasIniciais(fila.locais?.[fila.pos]), tarefa: 0, lidos: [], buscas_local: 0, subdivididas: [], censura: [], falhas: [], cobertura_insuf: [], cobertura_min_m: null });
  }

  // Menu dos estabelecimentos (mesmo padrão do coletor de preços): ok (coletado sem
  // pendência), pend (coletado com falha, cobertura, censura, busca nova ou avaliações de
  // shopping não lidas) ou falta.
  function estadoLocal(l, dados = lerDados()) {
    const k = chaveLocal(l);
    const g = dados.locais.find((x) => x.chave === k);
    if (!g) return 'falta';
    return problemas(g).length || shoppingSemAvaliacao(dados, k) ? 'pend' : 'ok';
  }

  // Próximo que falta (ou pendente): primeiro na cidade do atual, depois nos outros, na ordem
  // da lista a partir do atual.
  function proximoLocal(base, kAtual, dados = lerDados()) {
    const i0 = base.findIndex((l) => chaveLocal(l) === kAtual);
    const atual = base[i0] || base[0];
    const ordem = [...base.slice(i0 + 1), ...base.slice(0, Math.max(i0, 0))]
      .filter((l) => chaveLocal(l) !== kAtual && estadoLocal(l, dados) !== 'ok');
    return ordem.find((l) => atual && l.cidade === atual.cidade) || ordem[0] || null;
  }

  // Coleta só um estabelecimento (menu ou "Próximo"); se já tem coleta, ela é refeita. No fim,
  // não exporta (os CSVs saem pelo botão "Exportar").
  function coletarUm(l) {
    const k = chaveLocal(l);
    gravar(CHAVE_ITEM, k);
    const dados = lerDados();
    if (dados.locais.some((x) => x.chave === k)) {
      dados.locais = dados.locais.filter((x) => x.chave !== k);
      dados.resultados = dados.resultados.filter((r) => r.origem !== k);
      gravar(CHAVE_DADOS, dados);
    }
    const { place_id, nome, cidade, lat, lng } = l;
    iniciarFila([{ place_id, nome, cidade, lat, lng }], true, true);
  }

  function iniciarFila(locais, refazer = false, doMenu = false) {
    const dados = lerDados();
    const feitos = new Set(dados.locais.map((l) => l.chave));
    const pendentes = refazer ? locais : locais.filter((l) => !feitos.has(chaveLocal(l)));
    if (!pendentes.length) { status('Todos já coletados.', 'ok'); return; }
    const fila = { ativa: true, parar: false, pausada: false, motivo_pausa: '', locais: pendentes, pos: 0, inicio: Date.now(), buscas_feitas: 0, locais_fechados: 0, buscas_em_fechados: 0, doMenu };
    zerarLocal(fila);
    gravar(CHAVE_FILA, fila);
    irPara(fila);
  }

  function refazerPendentes() {
    const dados = lerDados();
    const pend = situacaoGeral().mapsPend;
    if (!pend.length) { status('Nenhum pendente.'); return; }
    const chaves = new Set(pend.map((l) => l.chave));
    dados.locais = dados.locais.filter((l) => !chaves.has(l.chave));
    dados.resultados = dados.resultados.filter((r) => !chaves.has(r.origem));
    gravar(CHAVE_DADOS, dados);
    iniciarFila(pend.map(({ place_id, nome, cidade, lat, lng }) => ({ place_id, nome, cidade, lat, lng })), true);
  }

  function irPara(fila) {
    const local = fila.locais[fila.pos];
    const t = fila.tarefas[fila.tarefa];
    const [lat, lng] = deslocar(local.lat, local.lng, t.norte, t.leste);
    t.busca = planejarBusca(lat, lng, t.alcance, janelaAtual(), t.reducao);
    gravar(CHAVE_FILA, fila);
    location.href = urlBusca(t.consulta, t.busca.lat, t.busca.lng, t.busca.zoom);
  }

  async function fecharLocal(fila) {
    const local = fila.locais[fila.pos];
    const k = chaveLocal(local);
    const coletado_em = agora();
    const unidos = unir(fila.lidos).map((r) => ({
      origem: k,
      origem_place_id: local.place_id,
      origem_nome: local.nome,
      ...r,
      grupo_auto: classificarNaCidade(r.nome, r.categoria_maps, local.cidade),
      distancia_m: distancia(local.lat, local.lng, r.lat, r.lng),
      coletado_em,
    }));
    fila.censura.push(...cruzamento(unidos, fila.lidos));
    const dados = lerDados();
    dados.resultados = dados.resultados.filter((r) => r.origem !== k).concat(unidos);
    dados.locais = dados.locais.filter((l) => l.chave !== k).concat([{
      chave: k, ...local, buscas: fila.buscas_local, subdivididas: fila.subdivididas, censura: fila.censura,
      falhas: fila.falhas, cobertura_insuf: fila.cobertura_insuf, cobertura_min_m: fila.cobertura_min_m, coletado_em,
      consultas: tarefasIniciais(local).map((c) => c.consulta),
      consultas_dispensadas: consultasDispensadas(local.cidade),
      versao_script: VERSAO,
    }]);
    gravar(CHAVE_DADOS, dados);
    fila.locais_fechados += 1;
    fila.buscas_em_fechados += fila.buscas_local;
    const restam = fila.pos + 1 < fila.locais.length;
    if (lerOpcoes().parcial && restam && fila.locais_fechados % PARCIAL_A_CADA === 0) {
      exportar({ fontes: ['maps'], locais: dados.locais, sufixo: `parcial-${String(dados.locais.length).padStart(3, '0')}` });
    }
  }

  function previsao(fila) {
    if (fila.buscas_feitas < 2) return '';
    const sPorBusca = (Date.now() - fila.inicio) / 1000 / fila.buscas_feitas;
    const porLocal = fila.locais_fechados ? fila.buscas_em_fechados / fila.locais_fechados : CONSULTAS.length;
    const restantes = (fila.tarefas.length - fila.tarefa) + (fila.locais.length - fila.pos - 1) * porLocal;
    const min = Math.round((restantes * sPorBusca) / 60);
    return min >= 1 ? ` Faltam ~${min} min.` : ' Falta menos de 1 min.';
  }

  async function seguir(fila, msg) {
    const parar = ler(CHAVE_FILA, {}).parar;
    if (fila.pos >= fila.locais.length || parar) {
      fila.ativa = false;
      gravar(CHAVE_FILA, fila);
      status(parar ? 'Fila interrompida.' : fila.doMenu ? `${fila.locais[0]?.nome || 'Estabelecimento'} coletado.`
        : `Fila concluída: ${fila.locais.length} estabelecimentos.`, parar ? 'alerta' : 'ok');
      atualizarPainel();
      if (!parar) { tocar('fim'); if (!fila.doMenu) exportar({ fontes: ['maps', 'shoppings'], locais: fila.locais }); }
      return;
    }
    gravar(CHAVE_FILA, fila);
    atualizarPainel();
    status(`${fila.pos + 1}/${fila.locais.length} · ${msg}${previsao(fila)}${document.hidden ? ' Aba em segundo plano: use janela própria.' : ''}`);
    await esperar(sortear(PAUSA_ENTRE_BUSCAS));
    if (ler(CHAVE_FILA, {}).parar) { fila.ativa = false; gravar(CHAVE_FILA, fila); status('Fila interrompida.', 'alerta'); atualizarPainel(); return; }
    irPara(fila);
  }

  function pausarPorBloqueio(fila) {
    fila.pausada = true;
    fila.motivo_pausa = 'bloqueio';
    gravar(CHAVE_FILA, fila);
    tocar('alerta');
    status('O Google pediu verificação (tráfego incomum). Resolva a verificação; a fila segue sozinha ao voltar ao Maps. Se não seguir, clique em Retomar.', 'alerta');
    atualizarPainel();
  }

  async function continuarFila() {
    const fila = ler(CHAVE_FILA, null);
    if (!fila || !fila.ativa) return;
    if (bloqueado()) { pausarPorBloqueio(fila); return; }
    if (fila.pausada) {
      if (fila.motivo_pausa !== 'bloqueio' || !/\/maps\/(search|place)\//.test(location.href)) { status('Fila pausada. Clique em Retomar.', 'alerta'); return; }
      fila.pausada = false;
      fila.motivo_pausa = '';
      gravar(CHAVE_FILA, fila);
    }
    const local = fila.locais[fila.pos];
    const t = fila.tarefas[fila.tarefa];
    status(`${fila.pos + 1}/${fila.locais.length} · ${local.nome}: lendo "${rotulo(t)}"…`);
    const leitura = await lerBusca();
    if (leitura.estado === 'bloqueado') { pausarPorBloqueio(fila); return; }
    fila.buscas_feitas += 1;
    fila.buscas_local += 1;
    let msg = `"${rotulo(t)}": ${leitura.itens.length} resultados.`;

    if (leitura.estado === 'falhou') {
      if (t.tentativas < TENTATIVAS) { t.tentativas += 1; await seguir(fila, `"${rotulo(t)}" não carregou; tentativa ${t.tentativas + 1}.`); return; }
      fila.falhas.push(rotulo(t));
      msg = `"${rotulo(t)}" falhou ${TENTATIVAS + 1} vezes; grupo fica em branco.`;
    } else {
      const [alat, alng] = deslocar(local.lat, local.lng, t.norte, t.leste);
      const cob = t.busca ? coberturaReal(alat, alng, t.busca, janelaAtual()) : 0;
      if (cob < t.alcance && t.tentativas < TENTATIVAS) {
        t.tentativas += 1;
        t.reducao += 1;
        await seguir(fila, `"${rotulo(t)}" cobriu ${cob} m de ${t.alcance} m; refazendo com zoom menor.`);
        return;
      }
      if (cob < t.alcance) fila.cobertura_insuf.push(rotulo(t));
      if (!t.quadrante) fila.cobertura_min_m = fila.cobertura_min_m == null ? cob : Math.min(fila.cobertura_min_m, cob);
      fila.lidos.push(...leitura.itens.map((r) => ({ ...r, consulta: rotulo(t) })));
      const decisao = decidirLista({
        n: leitura.itens.length, fim: !!leitura.fim, quadrante: t.quadrante, grupo: t.grupo,
        algumForaDoMapa: !!t.busca && leitura.itens.some((r) => foraDoMapa(r, t.busca, janelaAtual())),
      });
      if (decisao === 'subdividir') { fila.tarefas.push(...quadrantes(t)); fila.subdivididas.push(t.consulta); msg += ' Lista cheia: 4 quadrantes.'; }
      if (decisao === 'censura') fila.censura.push(rotulo(t));
    }

    fila.tarefa += 1;
    if (fila.tarefa >= fila.tarefas.length) {
      await fecharLocal(fila);
      msg = `${local.nome} concluído.`;
      fila.pos += 1;
      zerarLocal(fila);
    }
    await seguir(fila, msg);
  }

  // ---------- exportação ----------

  const COLS_RESULTADOS = ['origem_place_id', 'origem_nome', 'nome', 'categoria_maps', 'grupo_auto', 'grupo', 'revisado', 'duplicata_de', 'fora_da_regiao', 'distancia_m', 'n_avaliacoes', 'porte_shopping', 'porte_base', 'lat', 'lng', 'place_id', 'id_maps', 'consultas', 'coletado_em'];
  const COLS_SHOPPINGS = ['origem_place_id', 'origem_nome', 'nome', 'categoria_maps', 'n_avaliacoes', 'place_id', 'distancia_m', 'porte', 'criterio_porte', 'porte_base', ...LIMIARES_AVAL.map((l) => `aval_min_${l}`)];

  function colsResumo() {
    const cols = ['place_id', 'nome', 'cidade', 'lat', 'lng'];
    for (const col of Object.values(GRUPOS)) for (const raio of RAIOS_M) cols.push(`qt_${col}_${raio}m`);
    for (const raio of RAIOS_M) cols.push(`qt_shoppings_porte_${raio}m`);
    for (const l of LIMIARES_AVAL) for (const raio of RAIOS_M) cols.push(`qt_shoppings_aval_min_${l}_${raio}m`);
    cols.push('criterio_porte_shopping', 'shoppings_sem_avaliacao_lida', 'qt_outros_1000m', 'resultados_ate_1000m');
    for (const raio of RAIOS_M) cols.push(`qt_estacoes_trilhos_${raio}m`);
    for (const col of Object.values(GRUPOS)) cols.push(`dist_${col}_mais_proxima_m`);
    cols.push('dist_trilhos_mais_proxima_m', 'dist_estacao_mais_proxima_m', 'estacao_mais_proxima', 'tipo_estacao_mais_proxima');
    return [...cols, 'duplicatas_fundidas', 'revisoes_manuais', 'buscas', 'cobertura_min_m', 'consultas_subdivididas', 'consultas_falhas', 'consultas_nao_feitas', 'consultas_dispensadas', 'consultas_cobertura_insuficiente', 'consultas_censura', 'situacao', 'coletado_em', 'versao_script'];
  }

  function celula(v) {
    const s = String(v ?? '');
    return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  }

  function csv(linhas, cols) {
    return '﻿' + [cols.join(';'), ...linhas.map((l) => cols.map((c) => celula(l[c])).join(';'))].join('\r\n');
  }

  function baixar(texto, nome) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([texto], { type: 'text/csv;charset=utf-8' }));
    a.download = nome;
    document.documentElement.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 2000);
  }

  // "2026-10-14_sao_jogue_rio_vermelho_entorno_resumo.csv"; com mais de um
  // estabelecimento, "2026-10-14_3_estabelecimentos_entorno_resumo.csv".
  function nomesArquivos(locais, data, sufixo = '') {
    const quem = locais.length === 1 ? nomeArquivo(locais[0].nome) : `${locais.length}_estabelecimentos`;
    const fim = sufixo ? `_${sufixo}` : '';
    const nome = (tipo) => `${data}_${quem}_entorno_${tipo}${fim}.csv`;
    return { resumo: nome('resumo'), resultados: nome('resultados'), shoppings: nome('shoppings') };
  }

  // Sem "locais", exporta a lista guardada (ou, sem lista, tudo o que está guardado).
  function exportar({ fontes = ['maps', 'shoppings'], locais = null, sufixo = '' } = {}) {
    const saida = montarSaida(lerDados(), ler(CHAVE_REVISOES, {}), lerOpcoes(), locais || listaAtual().locais);
    if (!saida.universo.length) { status('Nada para exportar.', 'alerta'); return; }
    const nomes = nomesArquivos(saida.universo, dataLocal(new Date()), sufixo);
    const arquivos = [];
    if (fontes.includes('maps')) arquivos.push([csv(saida.resumo, colsResumo()), nomes.resumo], [csv(saida.resultados, COLS_RESULTADOS), nomes.resultados]);
    if (fontes.includes('shoppings')) arquivos.push([csv(saida.shoppings, COLS_SHOPPINGS), nomes.shoppings]);
    arquivos.forEach(([texto, nome], i) => setTimeout(() => baixar(texto, nome), i * 800));
    status(`Baixando ${arquivos.length} CSVs de ${saida.universo.length} estabelecimentos.`);
  }

  // ---------- lista de estabelecimentos (a população) ----------

  function listaAtual() {
    const l = ler(CHAVE_LISTA, null);
    return l && Array.isArray(l.locais) ? l : { locais: [], arquivo: '' };
  }

  function guardarLista(texto, arquivo) {
    const locais = lerFila(texto);
    if (!locais.length) { status('Nenhuma linha com lat e lng: a lista não mudou.', 'alerta'); return; }
    gravar(CHAVE_LISTA, { locais, arquivo, guardada_em: agora() });
    status(`Lista: ${locais.length} estabelecimentos (${arquivo}).`, 'ok');
    atualizarPainel();
  }

  // Shopping a até 1000 m com avaliações não lidas: "Refazer pendentes" recoleta
  // (até 2026.10.15-4, cartão sem nota saía em branco, mesmo com "Nenhuma avaliação").
  const shoppingSemAvaliacao = (dados, k) => dados.resultados.some((r) => r.origem === k && r.distancia_m <= RAIO_MAX
    && classificar(r.nome, r.categoria_maps) === 'shopping' && !avaliacoesLidas(r));

  // O que falta coletar, para os estabelecimentos da lista (ou de tudo o que está guardado).
  function situacaoGeral() {
    const dados = lerDados();
    const lista = listaAtual();
    const base = lista.locais.length ? lista.locais : uniaoLocais(dados.locais);
    const noMaps = new Set(dados.locais.map((l) => l.chave));
    const naBase = new Set(base.map(chaveLocal));
    return {
      lista, base, dados,
      mapsFeitos: base.filter((l) => noMaps.has(chaveLocal(l))).length,
      mapsFaltam: base.filter((l) => !noMaps.has(chaveLocal(l))),
      mapsPend: dados.locais.filter((l) => naBase.has(l.chave) && (problemas(l).length || shoppingSemAvaliacao(dados, l.chave))),
      foraDaLista: lista.locais.length ? dados.locais.filter((l) => !naBase.has(l.chave)).length : 0,
    };
  }

  // ---------- painel (kit comum dos webscripts: _src/Webscripts/_kit_painel/) ----------

  // >>> kit_painel (cópia de _src/Webscripts/_kit_painel/kit_painel.js; regerar com: node _src/Webscripts/_kit_painel/embutir.js)
  // Kit dos painéis dos webscripts do TCC Luderia. Fonte única: o embutir.js copia este
  // bloco para dentro de cada .user.js, entre os marcadores; não editar a cópia.
  // Padrão (o do maps_avaliacoes): canto superior direito, shadow DOM preso ao <html> e
  // reposto se sumir, arrastável e redimensionável com posição salva, Montserrat,
  // Heroicons outline, roxo como cor primária, verde/âmbar/vermelho para o desfecho,
  // explicações em dicas (ⓘ ou sobre o próprio botão) em vez de texto solto.
  // Só define funções: nada toca o DOM antes de montar() (os testes rodam no Node).
  function kitPainel(op = {}) {
    const P = op.prefixo || op.id || 'tcc';
    const temGM = typeof GM_getValue === 'function' && typeof GM_setValue === 'function';
    const ler = op.ler || ((c, padrao) => {
      try {
        if (temGM) return GM_getValue(c, padrao);
        const v = localStorage.getItem(c);
        return v == null ? padrao : JSON.parse(v);
      } catch (_) { return padrao; }
    });
    const gravar = op.gravar || ((c, v) => {
      try {
        if (temGM) { if (v == null && typeof GM_deleteValue === 'function') GM_deleteValue(c); else GM_setValue(c, v); return; }
        if (v == null) localStorage.removeItem(c); else localStorage.setItem(c, JSON.stringify(v));
      } catch (_) { /* sem armazenamento */ }
    });
    const chave = (s) => `${P}:kit:${s}`;
    const k = {
      el: {}, ocupado: false, parar: false, acoes: [], ler, gravar,
      som: ler(chave('som'), true), autobaixar: ler(chave('autobaixar'), true),
    };
    const dicas = new WeakMap();
    let hospedeiro = null, painel = null;

    // ---------- elementos ----------
    function criar(tag, props = {}, filhos = []) {
      const n = document.createElement(tag);
      for (const [a, v] of Object.entries(props)) {
        if (v == null) continue;
        if (a === 'dica') dica(n, v);
        else if (a === 'style') n.style.cssText = v;
        else if (a === 'role' || a.startsWith('aria-') || a.startsWith('data-')) n.setAttribute(a, v);
        else n[a] = v;
      }
      for (const f of [].concat(filhos)) {
        if (f == null || f === false) continue;
        n.appendChild(typeof f === 'object' ? f : document.createTextNode(String(f)));
      }
      return n;
    }

    // Heroicons 24/outline (traço 1.5).
    const ICONES = {
      'arrow-down': 'M19.5 13.5 12 21m0 0-7.5-7.5M12 21V3',
      'arrow-down-tray': 'M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3',
      'arrow-path': 'M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99',
      'arrow-top-right-on-square': 'M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25',
      'arrow-up': 'M4.5 10.5 12 3m0 0 7.5 7.5M12 3v18',
      'arrow-up-tray': 'M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5',
      'arrow-uturn-left': 'M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3',
      'bell': 'M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0',
      'bell-slash': 'M9.143 17.082a24.248 24.248 0 0 0 3.844.148m-3.844-.148a23.856 23.856 0 0 1-5.455-1.31 8.964 8.964 0 0 0 2.3-5.542m3.155 6.852a3 3 0 0 0 5.667 1.97m1.965-2.277L21 21m-4.225-4.225a23.81 23.81 0 0 0 3.536-1.003A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6.53 6.53m10.245 10.245L6.53 6.53M3 3l3.53 3.53',
      'calendar-days': 'M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5',
      'check': 'm4.5 12.75 6 6 9-13.5',
      'chevron-double-down': 'm4.5 5.25 7.5 7.5 7.5-7.5m-15 6 7.5 7.5 7.5-7.5',
      'chevron-left': 'M15.75 19.5 8.25 12l7.5-7.5',
      'chevron-right': 'm8.25 4.5 7.5 7.5-7.5 7.5',
      'clock': 'M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
      'code-bracket': 'M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5',
      'document-check': 'M10.125 2.25h-4.5c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125v-9M10.125 2.25h.375a9 9 0 0 1 9 9v.375M10.125 2.25A3.375 3.375 0 0 1 13.5 5.625v1.5c0 .621.504 1.125 1.125 1.125h1.5a3.375 3.375 0 0 1 3.375 3.375M9 15l2.25 2.25L15 12',
      'document-duplicate': 'M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H9.75',
      'document-text': 'M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z',
      'exclamation-triangle': 'M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z',
      'eye': 'M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178ZM15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z',
      'forward': 'M3 8.689c0-.864.933-1.406 1.683-.977l7.108 4.061a1.125 1.125 0 0 1 0 1.954l-7.108 4.061A1.125 1.125 0 0 1 3 16.811V8.69ZM12.75 8.689c0-.864.933-1.406 1.683-.977l7.108 4.061a1.125 1.125 0 0 1 0 1.954l-7.108 4.061a1.125 1.125 0 0 1-1.683-.977V8.69Z',
      'funnel': 'M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 0 1-.659 1.591l-5.432 5.432a2.25 2.25 0 0 0-.659 1.591v2.927a2.25 2.25 0 0 1-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 0 0-.659-1.591L3.659 7.409A2.25 2.25 0 0 1 3 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0 1 12 3Z',
      'hashtag': 'M5.25 8.25h15m-16.5 7.5h15m-1.8-13.5-3.9 19.5m-2.1-19.5-3.9 19.5',
      'information-circle': 'm11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z',
      'magnifying-glass': 'm21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z',
      'map-pin': 'M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z',
      'minus': 'M5 12h14',
      'bolt': 'm3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z',
      'bolt-slash': 'M11.412 15.655 9.75 21.75l3.745-4.012M9.257 13.5H3.75l2.659-2.849m2.048-2.194L14.25 2.25 12 10.5h8.25l-4.707 5.043M8.457 8.457 3 3m5.457 5.457 7.086 7.086m0 0L21 21',
      'play': 'M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z',
      'plus': 'M12 4.5v15m7.5-7.5h-15',
      'queue-list': 'M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 0 1 0 3.75H5.625a1.875 1.875 0 0 1 0-3.75Z',
      'stop': 'M5.25 7.5A2.25 2.25 0 0 1 7.5 5.25h9a2.25 2.25 0 0 1 2.25 2.25v9a2.25 2.25 0 0 1-2.25 2.25h-9a2.25 2.25 0 0 1-2.25-2.25v-9Z',
      'trash': 'm14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0',
      'x-mark': 'M6 18 18 6M6 6l12 12',
    };

    function icone(nome, classe = '') {
      const NS = 'http://www.w3.org/2000/svg';
      const svg = document.createElementNS(NS, 'svg');
      for (const [a, v] of Object.entries({ viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '1.5', 'aria-hidden': 'true' })) svg.setAttribute(a, v);
      if (classe) svg.setAttribute('class', classe);
      const p = document.createElementNS(NS, 'path');
      p.setAttribute('d', ICONES[nome] || '');
      p.setAttribute('stroke-linecap', 'round');
      p.setAttribute('stroke-linejoin', 'round');
      svg.appendChild(p);
      return svg;
    }

    // ---------- dicas: balão próprio (mais rápido que o title do navegador) ----------
    // Qualquer elemento com dica mostra o balão ao parar o mouse (ou com foco); o ⓘ
    // abre na hora e, clicado, fica fixo até Esc, rolagem ou clique fora.
    let dicaAncora = null, dicaFixa = false, timerDica = 0;

    function dica(n, conteudo) {
      if (!conteudo) { dicas.delete(n); n.removeAttribute('data-dica'); return n; }
      dicas.set(n, conteudo);
      n.setAttribute('data-dica', '');
      if (typeof conteudo === 'string' && n.tagName === 'BUTTON' && !n.textContent.trim()) n.setAttribute('aria-label', conteudo);
      return n;
    }

    function abrirDica(ancora, fixa = false) {
      clearTimeout(timerDica);
      const c = dicas.get(ancora);
      if (!c || !k.el.dica) return;
      dicaAncora = ancora; dicaFixa = fixa;
      const v = typeof c === 'function' ? c() : c;
      k.el.dica.replaceChildren(typeof v === 'object' ? v : document.createTextNode(String(v)));
      k.el.dica.hidden = false;
      const r = ancora.getBoundingClientRect(), d = k.el.dica.getBoundingClientRect(), M = 10;
      const left = Math.min(Math.max(M, r.left + r.width / 2 - d.width / 2), innerWidth - d.width - M);
      let top = r.bottom + 6;
      if (top + d.height > innerHeight - M) top = Math.max(M, r.top - d.height - 6);
      k.el.dica.style.left = `${left}px`;
      k.el.dica.style.top = `${top}px`;
    }

    function fecharDica() {
      clearTimeout(timerDica);
      if (k.el.dica) k.el.dica.hidden = true;
      dicaAncora = null; dicaFixa = false;
    }

    const comDica = (e) => e.composedPath().find((n) => n.nodeType === 1 && dicas.has(n));

    function ajuda(conteudo, rotulo = 'Explicação') {
      const i = criar('span', { className: 'ajuda', tabIndex: 0, role: 'button', 'aria-label': rotulo }, [icone('information-circle')]);
      return dica(i, conteudo);
    }

    // ---------- controles ----------
    // botao('arrow-down-tray', 'CSV', fn, { classe: 'mini', dica: '…' }); sem texto vira botão-ícone.
    function botao(ico, texto, fn, { classe = '', dica: d = '' } = {}) {
      const b = criar('button', { type: 'button', className: `${texto ? '' : 'ico '}${classe}`.trim(), onclick: fn },
        [ico ? icone(ico) : null, texto || null]);
      if (d) dica(b, d);
      return b;
    }

    // Ação destrutiva em dois cliques: o primeiro arma (vermelho, treme) e o segundo, em até 3 s, executa.
    function botaoPerigo(ico, texto, fn, { classe = '', dica: d = '' } = {}) {
      const b = botao(ico, texto, null, { classe: `perigo ${classe}`, dica: d });
      let armado = 0;
      const desarmar = () => { clearTimeout(armado); armado = 0; b.classList.remove('armado'); dica(b, d); };
      b.onclick = () => {
        if (!armado) {
          b.classList.add('armado');
          dica(b, 'Clique de novo para confirmar');
          abrirDica(b);
          armado = setTimeout(desarmar, 3000);
          return;
        }
        desarmar(); fecharDica(); fn();
      };
      return b;
    }

    // Etiqueta liga/desliga: cinza desligada, azul ligada. `checked` imita a caixa de marcar.
    function etiqueta(rotulo, aoAlternar, { ligada = false, dica: d = '', ico = '' } = {}) {
      const b = criar('button', { type: 'button', className: 'tag' }, [ico ? icone(ico) : null, rotulo]);
      if (d) dica(b, d);
      const pintar = (v) => b.setAttribute('aria-pressed', String(v));
      pintar(ligada);
      Object.defineProperty(b, 'checked', { get: () => b.getAttribute('aria-pressed') === 'true', set: (v) => pintar(!!v) });
      b.onclick = () => { pintar(!b.checked); aoAlternar(b.checked); };
      return b;
    }

    // Botão-ícone de preferência (fica roxo ligado); a dica diz o estado.
    function alternaIcone({ ico, icoDesligado = ico, rotulo, ligado, aoMudar, classe = 'leve' }) {
      const b = criar('button', { type: 'button', className: `ico ${classe}` });
      let v = !!ligado;
      const pintar = () => {
        b.setAttribute('aria-pressed', String(v));
        b.replaceChildren(icone(v ? ico : icoDesligado));
        dica(b, `${rotulo}: ${v ? 'ligado' : 'desligado'}`);
        b.setAttribute('aria-label', rotulo);
      };
      b.onclick = () => { v = !v; pintar(); aoMudar(v); if (dicaAncora === b) abrirDica(b); };
      Object.defineProperty(b, 'checked', { get: () => v, set: (x) => { v = !!x; pintar(); } });
      pintar();
      return b;
    }

    // Controle segmentado: [[valor, texto, dica]].
    function pills(opcoes, valor, aoMudar) {
      const caixa = criar('div', { className: 'pills', role: 'tablist' });
      const bs = opcoes.map(([v, t, d]) => {
        const b = criar('button', { type: 'button', className: 'pill', role: 'tab', 'data-valor': v }, [t]);
        if (d) b.appendChild(ajuda(d));
        b.onclick = () => { caixa.valor = v; aoMudar(v); };
        return b;
      });
      Object.defineProperty(caixa, 'valor', {
        get: () => valor,
        set: (v) => { valor = v; for (const b of bs) b.setAttribute('aria-selected', String(b.dataset.valor === String(v))); },
      });
      caixa.append(...bs);
      caixa.valor = valor;
      return caixa;
    }

    // Seção recolhível que lembra se estava aberta.
    const abertos = new Set(ler(chave('abertos'), op.abertos || []));
    function secao(id, cabeca, filhos, aoAbrir = null) {
      const d = criar('details', { open: abertos.has(id) }, [
        criar('summary', {}, [icone('chevron-right', 'seta'), ...[].concat(cabeca)]), ...filhos]);
      d.addEventListener('toggle', () => {
        if (d.open) abertos.add(id); else abertos.delete(id);
        gravar(chave('abertos'), [...abertos]);
        if (d.open && aoAbrir) aoAbrir();
      });
      return d;
    }

    // Botão dentro do <summary> que não abre nem fecha a seção.
    const naoAlterna = (fn) => (e) => { e.preventDefault(); e.stopPropagation(); fn(e); };

    const linha = (filhos, classe = '') => criar('div', { className: `linha ${classe}`.trim() }, filhos);
    const esp = () => criar('span', { className: 'esp' });
    const rotulo = (t, d) => criar('span', { className: 'rotulo' }, [t, d ? ajuda(d) : null]);
    const selo = (t = '', classe = '') => criar('span', { className: `selo ${classe}`.trim(), textContent: t });

    // ---------- status, resumo e progresso ----------
    function animarStatus() {
      const s = k.el.status;
      s.classList.remove('entra');
      void s.offsetWidth;
      s.classList.add('entra');
    }

    function status(t, tipo = '') {
      if (!k.el.status) return;
      const cls = `status${tipo ? ` st-${tipo}` : ''}`;
      if (k.el.status.className.replace(' entra', '') !== cls || k.el.status.textContent !== t) {
        const mudouTipo = k.el.status.className.replace(' entra', '') !== cls;
        k.el.status.className = cls;
        k.el.status.textContent = t;
        if (mudouTipo) animarStatus();
      }
      if (tipo === 'ok' || tipo === 'erro' || tipo === 'alerta') estado(tipo);
    }

    // Resumo do desfecho: cabeçalho com a cor do resultado, contagens e avisos.
    // linhas: [[número, texto, detalhe]]; avisos: textos em âmbar.
    function resumo({ titulo, sub = '', linhas = [], avisos = [], tipo = '' }) {
      if (!k.el.status) return;
      const item = ([n, t, det]) => criar('li', {}, [criar('b', { textContent: String(n) }), ` ${t}`,
        det ? criar('span', { className: 'suave', textContent: ` · ${det}` }) : null]);
      k.el.status.className = `status rico${tipo ? ` st-${tipo}` : ''}`;
      k.el.status.replaceChildren(...[
        criar('div', { className: 'cab' }, [criar('span', { className: 'ponto' }), titulo]),
        sub ? criar('div', { className: 'suave', textContent: sub }) : null,
        linhas.length ? criar('ul', {}, linhas.map(item)) : null,
        ...avisos.filter(Boolean).map((t) => criar('p', { className: 'aviso', textContent: t })),
      ].filter(Boolean));
      animarStatus();
      if (tipo) estado(tipo);
    }

    // Barra de progresso: barra('coleta') cria; progresso('coleta', 0.4, 'texto'),
    // progresso('coleta', true, 'texto') indeterminada e progresso('coleta', null) esconde.
    const barras = {};
    function barra(nome) {
      const b = { preenchido: criar('div', { className: 'preenchido' }), texto: criar('span'), pct: criar('span') };
      b.trilho = criar('div', { className: 'trilho' }, [b.preenchido]);
      b.caixa = criar('div', { className: 'barra', hidden: true }, [criar('div', { className: 'txt' }, [b.texto, b.pct]), b.trilho]);
      barras[nome] = b;
      return b.caixa;
    }

    function progresso(nome, frac, texto = '') {
      const b = barras[nome];
      if (!b) return;
      if (frac == null || frac === false) { b.caixa.hidden = true; return; }
      b.caixa.hidden = false;
      b.texto.textContent = texto;
      const indef = frac === true;
      b.trilho.classList.toggle('indef', indef);
      b.preenchido.classList.toggle('rodando', !indef && k.ocupado);
      if (indef) { b.pct.textContent = ''; return; }
      const pct = Math.round(Math.min(1, Math.max(0, frac)) * 100);
      b.preenchido.style.width = `${pct}%`;
      b.pct.textContent = `${pct}%`;
    }

    // Ponto do cabeçalho (visível minimizado): cinza parado, roxo pulsando em curso,
    // verde concluído, âmbar interrompido ou incerto, vermelho erro.
    function estado(s = '') {
      if (k.el.ponto) k.el.ponto.className = `ponto-estado ${s}`.trim();
    }

    // Liga e desliga as ações conforme a tarefa em curso.
    function atualizarAcoes(ocupado = k.ocupado) {
      for (const b of k.acoes) b.disabled = ocupado;
      if (k.el.parar) k.el.parar.disabled = !ocupado;
      if (ocupado) estado('rodando');
    }

    const botaoParar = (fn = () => { k.parar = true; status('Parando…'); }) =>
      (k.el.parar = botao('stop', '', fn, { classe: 'parar', dica: 'Parar' }));

    // Roda uma tarefa travando as ações; "Parar" põe k.parar = true.
    async function executar(fn, { avisar = true } = {}) {
      if (k.ocupado) return false;
      k.ocupado = true; k.parar = false; atualizarAcoes();
      let ok = true;
      try { await fn(); } catch (e) { ok = false; if (!k.parar) status(`Erro: ${e.message}`, 'erro'); }
      const parado = k.parar;
      k.ocupado = false; atualizarAcoes();
      estado(!ok && !parado ? 'erro' : parado ? 'alerta' : 'ok');
      if (parado && ok) status('Interrompido.', 'alerta');
      if (avisar) tocar(ok && !parado);
      return ok && !parado;
    }

    // ---------- microinterações ----------
    let audio = null;
    function liberarAudio() {
      try { audio = audio || new AudioContext(); if (audio.state === 'suspended') audio.resume(); } catch (_) { audio = null; }
    }

    function tocar(ok = true) {
      if (!k.som) return;
      liberarAudio();
      if (!audio) return;
      (ok ? [880, 1320] : [440, 330]).forEach((f, i) => {
        const o = audio.createOscillator(), g = audio.createGain();
        o.frequency.value = f;
        o.connect(g); g.connect(audio.destination);
        const t = audio.currentTime + i * 0.22;
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.3, t + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
        o.start(t); o.stop(t + 0.21);
      });
    }

    // Brilho rápido num elemento (verde = feito, vermelho = falhou).
    function piscar(n, tipo = 'ok') {
      if (!n) return;
      n.classList.remove('pisca-ok', 'pisca-erro');
      void n.offsetWidth;
      n.classList.add(`pisca-${tipo}`);
      setTimeout(() => n.classList.remove(`pisca-${tipo}`), 800);
    }

    // O botão vira um ✓ verde por um instante.
    function confirmarBotao(b) {
      if (!b) return;
      const antes = [...b.childNodes];
      b.classList.add('feito');
      b.replaceChildren(icone('check'), ...antes.filter((n) => n.nodeType === 3));
      setTimeout(() => { b.classList.remove('feito'); b.replaceChildren(...antes); }, 1200);
    }

    async function copiar(texto, b) {
      try { await navigator.clipboard.writeText(texto); } catch (_) {
        const t = criar('textarea', { value: texto });
        hospedeiro.shadowRoot.appendChild(t);
        t.select();
        document.execCommand('copy');
        t.remove();
      }
      confirmarBotao(b);
    }

    // ---------- arquivos ----------
    const celula = (v) => {
      const s = v == null ? '' : String(v);
      return /[;"\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    // CSV com ";" e BOM (abre direto no Excel pt-BR; no pandas, sep=";").
    const csv = (linhas, cols) => '﻿' + [cols.join(';'), ...linhas.map((l) => cols.map((c) => celula(l[c])).join(';'))].join('\r\n');

    function baixarArquivo(nome, conteudo, tipo = 'text/csv;charset=utf-8') {
      const url = URL.createObjectURL(new Blob([conteudo], { type: tipo }));
      const a = criar('a', { href: url, download: nome });
      (document.body || document.documentElement).appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    }

    // ---------- menu de alvos (casas, perfis, cardápios, acervos) ----------
    // Seletor por grupo com ✓ ok, ◐ parcial, ! refazer, ○ falta; contador com barra fina;
    // botões Próximo (o que falta, primeiro no mesmo grupo), Marcar/Desfazer e Só os que faltam.
    const SIMBOLO = { ok: '✓', parcial: '◐', falha: '!', falta: '○' };
    function menuAlvos({ itens, id = (x) => x.id, grupo = (x) => x.capital, nome = (x) => x.nome, detalhe = () => '',
      estadoDe, atual, aoEscolher, aoProximo, aoMarcar, unidade = 'coletados' }) {
      const lista = itens();
      const grupos = [...new Set(lista.map(grupo))];
      const select = criar('select', { 'aria-label': 'Alvo da coleta' }, grupos.map((g) => criar('optgroup', { label: g },
        lista.filter((x) => grupo(x) === g).map((x) => criar('option', { value: id(x), textContent: nome(x) })))));
      dica(select, `✓ ok · ◐ parcial · ! refazer · ○ falta. Escolher abre o alvo e coleta.`);
      select.onchange = () => aoEscolher(lista.find((x) => id(x) === select.value));
      let soFaltam = ler(chave('soFaltam'), false);
      const bProx = botao('forward', 'Próximo', () => aoProximo(), { classe: 'mini', dica: 'Abre o próximo que falta (primeiro no mesmo grupo) e coleta sozinho' });
      // Sem aoMarcar, o menu fica sem o botão Marcar/Desfazer.
      const bMarcar = aoMarcar ? botao('check', '', () => aoMarcar(lista.find((x) => id(x) === select.value)), { classe: 'leve' }) : null;
      const bFiltro = alternaIcone({ ico: 'funnel', rotulo: 'Só os que faltam', ligado: soFaltam,
        aoMudar: (v) => { soFaltam = v; gravar(chave('soFaltam'), v); rotular(); } });
      const cont = criar('span', { className: 'pos' });
      const trilho = criar('div', { className: 'trilho fino' }, [criar('div', { className: 'preenchido' })]);
      const caixa = criar('div', { className: 'menu' }, [
        linha([select]),
        linha([criar('div', { className: 'contador' }, [cont, trilho]), bProx, bMarcar, bFiltro], 'compacta'),
      ]);
      function rotular() {
        const a = atual();
        let prontos = 0;
        for (const o of select.querySelectorAll('option')) {
          const x = lista.find((y) => id(y) === o.value);
          const e = estadoDe(x);
          if (e === 'ok') prontos++;
          const t = `${SIMBOLO[e] || '○'} ${nome(x)}${detalhe(x, e) ? ` · ${detalhe(x, e)}` : ''}`;
          if (o.textContent !== t) o.textContent = t;
          o.className = e;
          o.hidden = soFaltam && e === 'ok' && id(x) !== a;
        }
        for (const g of select.querySelectorAll('optgroup')) g.hidden = [...g.querySelectorAll('option')].every((o) => o.hidden);
        if (a && select.value !== a) select.value = a;
        cont.textContent = `${prontos}/${lista.length} ${unidade}`;
        trilho.firstChild.style.width = `${Math.round((100 * prontos) / (lista.length || 1))}%`;
        const xa = lista.find((y) => id(y) === select.value);
        const col = xa && estadoDe(xa) === 'ok';
        if (!bMarcar) return;
        bMarcar.replaceChildren(icone(col ? 'arrow-uturn-left' : 'check'));
        dica(bMarcar, col ? 'Desfazer: volta a faltar' : 'Marcar como coletado, sem nova coleta');
      }
      return { caixa, select, rotular, bProx };
    }

    // ---------- painel ----------
    const CSS = `
      :host{--fundo:#fff;--texto:#18181b;--suave:#71717a;--sup:#f4f4f5;--sup2:#e4e4e7;--linha:#ececef;
        --caneta:#7e22ce;--caneta-forte:#6b21a8;--caneta-100:#f3e8ff;--azul:#2563eb;--azul-100:#dbeafe;
        --ok:#15803d;--ok-100:#dcfce7;--erro:#b91c1c;--erro-100:#fee2e2;--alerta:#b45309;--alerta-100:#fef3c7;
        --fonte:Montserrat,system-ui,-apple-system,"Segoe UI",sans-serif}
      @media (prefers-color-scheme:dark){:host{--fundo:#18181b;--texto:#f4f4f5;--suave:#a1a1aa;--sup:#27272a;--sup2:#3f3f46;
        --linha:#27272a;--caneta:#a855f7;--caneta-forte:#9333ea;--caneta-100:#3b0764;--azul:#3b82f6;--azul-100:#172554;
        --ok:#4ade80;--ok-100:#052e16;--erro:#f87171;--erro-100:#450a0a;--alerta:#fbbf24;--alerta-100:#451a03}}
      *{box-sizing:border-box}
      [hidden]{display:none!important}
      #painel{position:fixed;top:12px;right:12px;z-index:2147483647;width:var(--largura,340px);max-height:calc(100vh - 24px);
        overflow:auto;background:var(--fundo);color:var(--texto);border-radius:14px;
        box-shadow:0 8px 28px rgba(0,0,0,.2);font:13.5px/1.45 var(--fonte);padding:8px 12px 10px;
        resize:both;min-width:280px;min-height:44px;max-width:calc(100vw - 24px);transition:box-shadow .2s}
      #painel.min{height:auto!important;min-height:0;resize:none;width:auto!important;min-width:0}
      #painel.min>*:not(header){display:none}
      #painel.arrastando{user-select:none;opacity:.92;box-shadow:0 14px 40px rgba(0,0,0,.3)}
      header{display:flex;align-items:center;gap:2px;cursor:grab;touch-action:none;min-height:32px}
      #painel.arrastando header{cursor:grabbing}
      header .nome{flex:1;font-weight:700;font-size:14.5px;cursor:pointer;user-select:none;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;padding-right:6px}
      .ponto-estado{width:8px;height:8px;border-radius:50%;background:var(--sup2);margin-right:8px;flex:none;transition:background .3s}
      .ponto-estado.rodando{background:var(--caneta);animation:pulso 1.2s ease-in-out infinite}
      .ponto-estado.ok{background:var(--ok)} .ponto-estado.alerta{background:var(--alerta)} .ponto-estado.erro{background:var(--erro)}
      @keyframes pulso{0%,100%{box-shadow:0 0 0 0 rgba(147,51,234,.55)}50%{box-shadow:0 0 0 5px rgba(147,51,234,0)}}
      svg{width:18px;height:18px;flex:none}
      button{font:inherit;color:inherit;border:0;background:var(--sup);border-radius:8px;padding:6px 10px;cursor:pointer;
        display:inline-flex;align-items:center;justify-content:center;gap:6px;white-space:nowrap;
        transition:background .15s,color .15s,transform .1s,box-shadow .2s}
      button:hover:not(:disabled){background:var(--sup2)}
      button:active:not(:disabled){transform:scale(.94)}
      button:disabled{opacity:.35;cursor:default}
      :focus-visible{outline:2px solid var(--azul);outline-offset:1px}
      .ico{width:32px;height:32px;padding:0;flex:none}
      .ico.leve{background:transparent;color:var(--suave)}
      .ico.leve:hover:not(:disabled){background:var(--sup);color:var(--texto)}
      .ico.leve[aria-pressed=true]{color:var(--caneta);background:var(--caneta-100)}
      .primario{background:var(--caneta);color:#fff;font-weight:600;flex:1}
      .primario:hover:not(:disabled){background:var(--caneta-forte)}
      .verde{background:var(--ok-100);color:var(--ok)}
      .vermelho{background:var(--erro-100);color:var(--erro)}
      .verde:hover:not(:disabled),.vermelho:hover:not(:disabled){filter:brightness(.95)}
      .verde[aria-pressed=true]{background:var(--ok);color:#fff} .vermelho[aria-pressed=true]{background:var(--erro);color:#fff}
      .parar:not(:disabled){background:var(--erro-100);color:var(--erro)}
      .perigo{color:var(--suave)} .perigo:hover:not(:disabled){color:var(--erro);background:var(--erro-100)}
      button.armado{background:var(--erro)!important;color:#fff!important;animation:tremer .3s}
      @keyframes tremer{25%{transform:translateX(-2px)}75%{transform:translateX(2px)}}
      button.feito{background:var(--ok-100)!important;color:var(--ok)!important}
      .pisca-ok{animation:piscaOk .8s} .pisca-erro{animation:piscaErro .8s}
      @keyframes piscaOk{0%{box-shadow:0 0 0 0 rgba(21,128,61,.6)}100%{box-shadow:0 0 0 8px rgba(21,128,61,0)}}
      @keyframes piscaErro{0%{box-shadow:0 0 0 0 rgba(185,28,28,.6)}100%{box-shadow:0 0 0 8px rgba(185,28,28,0)}}
      .mini{padding:4px 9px;font-size:12.5px}
      .mini svg{width:16px;height:16px}
      .linha{display:flex;align-items:center;gap:6px;margin:7px 0;flex-wrap:wrap}
      .linha.compacta{flex-wrap:nowrap;margin-top:4px}
      .linha>.primario{min-width:0}
      .esp{flex:1}
      .rotulo{font-size:12px;font-weight:600;color:var(--suave);display:inline-flex;align-items:center;gap:4px}
      .suave{color:var(--suave)}
      select,input[type=text],input[type=search],input[type=date],textarea{font:inherit;color:inherit;background:var(--sup);border:0;border-radius:8px;padding:6px 8px;min-width:0}
      select{padding:5px 4px;cursor:pointer;flex:1;width:100%}
      select option{color:#111;background:#fff}
      select option.ok{color:#9ca3af} select option.parcial{color:#2563eb} select option.falha{color:#b45309}
      input{flex:1}
      input[type=date]{color-scheme:light dark;padding:4px 6px;font-size:12.5px;flex:1 1 0}
      input::placeholder,textarea::placeholder{color:var(--suave)}
      textarea{width:100%;height:60px;font:12px/1.45 ui-monospace,Menlo,monospace;resize:vertical;display:block}
      .busca{display:flex;align-items:center;gap:6px;background:var(--sup);border-radius:8px;padding:0 4px 0 10px;flex:1}
      .busca input{background:transparent;padding:6px 0}
      .busca>svg{color:var(--suave);width:16px;height:16px}
      .contador{flex:1;min-width:0;display:flex;flex-direction:column;gap:3px}
      .barra{margin:7px 0}
      .barra[hidden]{display:none}
      .barra .txt{display:flex;justify-content:space-between;font-size:12px;color:var(--suave);font-variant-numeric:tabular-nums}
      .trilho{height:6px;background:var(--sup);border-radius:999px;overflow:hidden;display:flex;position:relative}
      .trilho.fino{height:4px}
      .preenchido{height:100%;width:0;background:var(--caneta);border-radius:999px;transition:width .35s ease}
      .contador .preenchido{background:var(--ok)}
      .preenchido.rodando{background-image:linear-gradient(90deg,transparent,rgba(255,255,255,.4),transparent);background-size:200% 100%;animation:brilho 1.4s linear infinite}
      .trilho.indef .preenchido{width:35%!important;animation:indef 1.2s ease-in-out infinite}
      @keyframes brilho{from{background-position:200% 0}to{background-position:-200% 0}}
      @keyframes indef{from{transform:translateX(-100%)}to{transform:translateX(300%)}}
      details{border-top:1px solid var(--linha)}
      details[open]{padding-bottom:6px}
      summary{list-style:none;display:flex;align-items:center;gap:6px;cursor:pointer;font-size:14px;font-weight:600;padding:7px 0;user-select:none}
      summary::-webkit-details-marker{display:none}
      summary .seta{width:15px;height:15px;color:var(--suave);transition:transform .2s}
      details[open]>summary .seta{transform:rotate(90deg)}
      summary .ico{width:28px;height:28px;background:transparent;color:var(--suave)}
      summary .ico:hover:not(:disabled){background:var(--sup);color:var(--texto)}
      .selo{font-size:11.5px;font-weight:600;background:var(--sup);color:var(--suave);border-radius:999px;padding:1px 8px;white-space:nowrap}
      .selo:empty{display:none}
      .selo.ok{background:var(--ok-100);color:var(--ok)} .selo.alerta{background:var(--alerta-100);color:var(--alerta)}
      .selo.erro{background:var(--erro-100);color:var(--erro)} .selo.roxo{background:var(--caneta-100);color:var(--caneta)}
      .pos{font-size:12px;color:var(--suave);font-variant-numeric:tabular-nums;font-weight:500;white-space:nowrap}
      .subtitulo{font-size:12px;font-weight:600;color:var(--suave);margin:10px 0 5px;display:flex;align-items:center;gap:4px}
      .tags{display:flex;flex-wrap:wrap;gap:5px;margin:6px 0}
      .tag{padding:3px 10px;border-radius:999px;font-size:12.5px;background:var(--sup);color:var(--suave);gap:4px}
      .tag svg{width:15px;height:15px}
      .tag[aria-pressed=true]{background:var(--azul);color:#fff}
      .tag[aria-pressed=true]:hover{background:var(--azul);filter:brightness(1.08)}
      .tag[aria-pressed=true] .ajuda{color:#fffc}
      .pills{display:flex;background:var(--sup);border-radius:999px;padding:3px;gap:2px;flex:1}
      .pill{flex:1;background:transparent;border-radius:999px;padding:3px 6px;font-size:12.5px;color:var(--suave);gap:4px}
      .pill:hover:not(:disabled){background:var(--sup2)}
      .pill[aria-selected=true]{background:var(--fundo);color:var(--caneta);font-weight:600;box-shadow:0 1px 2px rgba(0,0,0,.08)}
      .ajuda{display:inline-flex;color:var(--suave);cursor:help;border-radius:999px}
      .ajuda svg{width:15px;height:15px}
      .ajuda:hover{color:var(--caneta)}
      .dica{position:fixed;z-index:2147483647;max-width:280px;background:var(--texto);color:var(--fundo);
        font:12.5px/1.5 var(--fonte);padding:7px 10px;border-radius:8px;box-shadow:0 6px 20px rgba(0,0,0,.25);pointer-events:none;
        white-space:pre-line;animation:entra .12s ease-out}
      .dica[hidden]{display:none}
      .status{font-size:13px;border-radius:10px;padding:7px 10px;background:var(--sup);white-space:pre-line;margin:7px 0;transition:background .25s}
      .status:empty{display:none}
      .status.entra{animation:entra .25s ease-out}
      @keyframes entra{from{opacity:0;transform:translateY(-3px)}to{opacity:1;transform:none}}
      .status.rico{white-space:normal}
      .status .cab{font-weight:600;display:flex;gap:8px;align-items:center}
      .status ul{margin:4px 0 0;padding-left:18px}
      .status li::marker{color:var(--suave)}
      .ponto{width:8px;height:8px;border-radius:50%;background:var(--suave);flex:none}
      .st-ok{background:var(--ok-100)} .st-ok .ponto{background:var(--ok)}
      .st-alerta{background:var(--alerta-100)} .st-alerta .ponto{background:var(--alerta)}
      .st-erro{background:var(--erro-100)} .st-erro .ponto{background:var(--erro)}
      .aviso{color:var(--alerta);font-size:12.5px;margin:5px 0 0;font-weight:500}
      .aviso::before{content:"⚠ "}
      .st-alerta .aviso,.st-erro .aviso{color:inherit}
      .info{font-size:12.5px;background:var(--sup);border-radius:10px;padding:7px 10px;margin:7px 0;white-space:pre-line}
      .info:empty{display:none}
      .mono{font:11.5px/1.4 ui-monospace,Menlo,monospace;color:var(--suave);word-break:break-all}
      .chip{font-size:11.5px;font-weight:600;border-radius:999px;padding:1px 8px;white-space:nowrap;background:var(--sup);color:var(--suave)}
      .chip.ok{background:var(--ok-100);color:var(--ok)} .chip.alerta{background:var(--alerta-100);color:var(--alerta)}
      .chip.erro{background:var(--erro-100);color:var(--erro)} .chip.azul{background:var(--azul-100);color:var(--azul)}
      .lista{max-height:280px;overflow:auto;display:flex;flex-direction:column;gap:1px;margin-top:4px}
      .vazio{font-size:12.5px;color:var(--suave);margin:6px 0}
      table{width:100%;border-collapse:collapse;font-size:12px;margin-top:4px;font-variant-numeric:tabular-nums}
      td,th{padding:3px 4px;border-bottom:1px solid var(--linha);text-align:left}
      th{color:var(--suave);font-weight:600} td.n,th.n{text-align:right}
      tr.total td{font-weight:700;border-bottom:0}
      @media (prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}`;

    function carregarFonte() {
      if (document.getElementById('tcc-fonte-montserrat') || !document.head) return;
      document.head.appendChild(criar('link', { id: 'tcc-fonte-montserrat', rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap' }));
    }

    // Posição e tamanho escolhidos pelo autor; sem posição salva, vale posicaoPadrao().
    let posicao = ler(chave('posicao'), null);
    let arrastou = false;

    function posicionar() {
      if (!painel) return;
      const p = painel;
      if (posicao?.width && !p.style.width && !p.classList.contains('min')) { p.style.width = posicao.width; p.style.height = posicao.height || ''; }
      if (posicao && posicao.left != null) {
        const w = p.offsetWidth || 340;
        const left = Math.min(Math.max(0, posicao.left), Math.max(0, innerWidth - w));
        const top = Math.min(Math.max(0, posicao.top), Math.max(0, innerHeight - 44));
        if (p.style.left !== `${left}px` || p.style.top !== `${top}px`) {
          Object.assign(p.style, { left: `${left}px`, right: 'auto', top: `${top}px`, maxHeight: `calc(100vh - ${top + 12}px)` });
        }
        return;
      }
      const pad = op.posicaoPadrao?.() || {};
      const top = pad.top ?? 12, right = pad.right ?? 12;
      if (p.style.top !== `${top}px` || p.style.right !== `${right}px` || p.style.left) {
        Object.assign(p.style, { left: '', right: `${right}px`, top: `${top}px`, maxHeight: `calc(100vh - ${top + 12}px)` });
      }
    }

    function prepararArraste(cab) {
      cab.addEventListener('pointerdown', (e) => {
        if (e.button !== 0 || e.composedPath().some((n) => n.tagName === 'BUTTON')) return;
        const r = painel.getBoundingClientRect();
        const x0 = e.clientX, y0 = e.clientY;
        let moveu = false;
        const mover = (ev) => {
          if (!moveu && Math.hypot(ev.clientX - x0, ev.clientY - y0) < 4) return;
          moveu = true;
          painel.classList.add('arrastando');
          fecharDica();
          posicao = { ...posicao, left: Math.round(r.left + ev.clientX - x0), top: Math.round(r.top + ev.clientY - y0) };
          posicionar();
        };
        const soltar = () => {
          removeEventListener('pointermove', mover);
          removeEventListener('pointerup', soltar);
          painel.classList.remove('arrastando');
          if (!moveu) return;
          gravar(chave('posicao'), posicao);
          arrastou = true;
          setTimeout(() => { arrastou = false; }, 0);
        };
        addEventListener('pointermove', mover);
        addEventListener('pointerup', soltar);
      });
      cab.addEventListener('dblclick', (e) => {
        if (e.composedPath().some((n) => n.tagName === 'BUTTON')) return;
        posicao = null;
        gravar(chave('posicao'), null);
        painel.style.width = painel.style.height = painel.style.left = '';
        posicionar();
        status('Painel de volta ao canto.');
      });
    }

    function minimizar(v = !painel.classList.contains('min')) {
      painel.classList.toggle('min', v);
      k.el.bMin.replaceChildren(icone(v ? 'plus' : 'minus'));
      dica(k.el.bMin, v ? 'Expandir' : 'Minimizar');
      if (v) { painel.style.width = ''; painel.style.height = ''; } else posicionar();
      gravar(chave('min'), v);
      fecharDica();
    }

    // montar({ nome, filhos, extras (botões do cabeçalho), aposAuto (botões logo depois do download automático), largura, autobaixar, minimizado, css })
    function montar({ nome, filhos, extras = [], aposAuto = [], largura = 340, autobaixar = false, minimizado, css = '' }) {
      carregarFonte();
      k.el.ponto = criar('span', { className: 'ponto-estado' });
      k.el.nome = criar('span', { className: 'nome', textContent: nome });
      k.el.bMin = botao('minus', '', () => minimizar(), { classe: 'leve', dica: 'Minimizar' });
      const bSom = alternaIcone({ ico: 'bell', icoDesligado: 'bell-slash', rotulo: 'Som ao concluir', ligado: k.som,
        aoMudar: (v) => { k.som = v; gravar(chave('som'), v); if (v) tocar(true); } });
      const bAuto = autobaixar ? alternaIcone({ ico: 'arrow-down-tray', rotulo: 'Download automático', ligado: k.autobaixar,
        aoMudar: (v) => { k.autobaixar = v; gravar(chave('autobaixar'), v); } }) : null;
      const cab = criar('header', {}, [k.el.ponto, k.el.nome, ...extras, bSom, bAuto, ...aposAuto, k.el.bMin]);
      dica(k.el.nome, 'Clique para minimizar · arraste para mover · duplo clique volta ao canto');
      painel = criar('div', { id: 'painel', style: `--largura:${largura}px` }, [cab, ...filhos]);
      k.el.painel = painel;
      k.el.nome.onclick = () => { if (!arrastou) minimizar(); };
      prepararArraste(cab);

      // O tamanho só muda pela alça de redimensionar, que grava largura e altura no estilo.
      addEventListener('pointerup', () => {
        if (!painel || painel.classList.contains('min')) return;
        const { width, height } = painel.style;
        if (width && (width !== posicao?.width || height !== posicao?.height)) {
          posicao = { ...posicao, width, height };
          gravar(chave('posicao'), posicao);
        }
      });
      painel.addEventListener('click', liberarAudio);
      painel.addEventListener('scroll', fecharDica);
      // As teclas digitadas no painel não chegam aos atalhos do site.
      for (const tipo of ['keydown', 'keyup', 'keypress']) painel.addEventListener(tipo, (e) => {
        if (tipo === 'keydown' && e.key === 'Escape') fecharDica();
        e.stopPropagation();
      });
      // Dicas: abre com atraso curto sobre botões e na hora sobre o ⓘ.
      painel.addEventListener('pointerover', (e) => {
        const n = comDica(e);
        if (!n || dicaFixa || n === dicaAncora) return;
        clearTimeout(timerDica);
        timerDica = setTimeout(() => abrirDica(n), n.classList.contains('ajuda') ? 0 : 350);
      });
      painel.addEventListener('pointerout', (e) => {
        const n = comDica(e);
        if (!n || dicaFixa || (e.relatedTarget && n.contains(e.relatedTarget))) return;
        clearTimeout(timerDica);
        timerDica = setTimeout(fecharDica, 80);
      });
      painel.addEventListener('focusin', (e) => { const n = comDica(e); if (n && n.matches(':focus-visible')) abrirDica(n); });
      painel.addEventListener('focusout', () => { if (!dicaFixa) fecharDica(); });
      // Captura: tocar no ⓘ dentro de um botão não aciona o botão.
      painel.addEventListener('click', (e) => {
        const i = e.composedPath().find((n) => n.classList?.contains('ajuda'));
        if (!i) return;
        e.stopPropagation(); e.preventDefault();
        if (dicaAncora === i && dicaFixa) fecharDica(); else abrirDica(i, true);
      }, true);
      addEventListener('keydown', (e) => { if (e.key === 'Escape') fecharDica(); });
      addEventListener('scroll', () => { if (!dicaFixa) fecharDica(); }, true);
      addEventListener('click', (e) => { if (dicaAncora && !e.composedPath().includes(dicaAncora)) fecharDica(); });

      k.el.dica = criar('div', { className: 'dica', hidden: true, role: 'tooltip' });
      hospedeiro = criar('div', { id: `${op.id || P}-hospedeiro` });
      const raiz = hospedeiro.attachShadow({ mode: 'open' });
      raiz.append(criar('style', { textContent: CSS + css }), painel, k.el.dica);
      if (minimizado ?? ler(chave('min'), false)) minimizar(true);
      atualizarAcoes();
      garantir();
      return painel;
    }

    // O React e outros sites podem refazer o <body>: o painel fica preso ao <html> e volta se sumir.
    function garantir() {
      if (!hospedeiro || !document.documentElement) return;
      if (!hospedeiro.isConnected) document.documentElement.appendChild(hospedeiro);
      posicionar();
    }

    Object.assign(k, {
      criar, icone, dica, ajuda, botao, botaoPerigo, botaoParar, etiqueta, alternaIcone, pills, secao, naoAlterna,
      linha, esp, rotulo, selo, status, resumo, barra, progresso, estado, atualizarAcoes, executar, tocar, piscar,
      confirmarBotao, copiar, celula, csv, baixarArquivo, menuAlvos, montar, garantir, minimizar,
      nome: (t) => { if (k.el.nome && k.el.nome.textContent !== t) k.el.nome.textContent = t; },
      hospedeiro: () => hospedeiro,
    });
    return k;
  }
  // <<< kit_painel

  const kit = kitPainel({ id: 'tcc-entorno', ler, gravar, abertos: ['lista'] });
  const { criar } = kit;
  const el = {};
  let menu = null;

  function status(t, tipo = '') { kit.status(t, tipo); }

  function listaRevisao() {
    const dados = lerDados();
    const revisoes = ler(CHAVE_REVISOES, {});
    const porChave = new Map();
    const cidades = new Map(dados.locais.map((l) => [l.chave, l.cidade]));
    for (const r0 of dados.resultados) {
      // Grupo automático refeito com a regra atual (o gravado pode ser de versão antiga).
      const r = { ...r0, grupo_auto: classificarNaCidade(r0.nome, r0.categoria_maps, cidades.get(r0.origem)) };
      if (!suspeito(r) && !revisoes[chave(r)]) continue;
      const k = chave(r);
      const ja = porChave.get(k);
      if (!ja || r.distancia_m < ja.distancia_m) porChave.set(k, r);
    }
    return [...porChave.values()].sort((a, b) => a.distancia_m - b.distancia_m);
  }

  function desenharRevisao() {
    if (!el.revisao) return;
    const itens = listaRevisao();
    const revisoes = ler(CHAVE_REVISOES, {});
    el.revisaoSelo.textContent = itens.length ? String(itens.length) : '';
    if (!el.revisao.parentElement.open) return;
    el.revisao.replaceChildren(...(itens.length ? itens.map((r) => {
      const k = chave(r);
      const sel = criar('select', { 'aria-label': `Grupo de ${r.nome}` }, ['metro', 'trem', 'vlt', 'brt', 'shopping', 'outro'].map((g) => criar('option', { value: g, textContent: g })));
      sel.value = grupoRevisto(revisoes[k], r.nome, r.categoria_maps) || r.grupo_auto;
      sel.onchange = () => {
        const rv = ler(CHAVE_REVISOES, {});
        if (sel.value === r.grupo_auto) delete rv[k]; else rv[k] = sel.value;
        gravar(CHAVE_REVISOES, rv);
        status(`${r.nome}: ${sel.value}.`, 'ok');
      };
      const nome = kit.dica(criar('span', { className: 'nome-item', textContent: r.nome }),
        `${r.categoria_maps || 'sem categoria'} · ${r.distancia_m} m de ${r.origem_nome}`);
      return criar('div', { className: 'item' }, [nome, criar('span', { className: 'pos', textContent: `${r.distancia_m} m` }), sel]);
    }) : [criar('p', { className: 'vazio', textContent: 'Nada a revisar.' })]));
  }

  function desenharOpcoes() {
    const op = lerOpcoes();
    el.limiar.value = op.limiar_aval;
    el.porteSelo.textContent = `≥ ${op.limiar_aval}`;
    el.parcial.checked = op.parcial;
  }

  const plural = (n, um, varios) => `${n} ${n === 1 ? um : varios}`;
  const ESTADO_MENU = { ok: 'ok', pend: 'falha', falta: 'falta' };

  // Menu dos estabelecimentos da lista (kit): escolher um abre as buscas no Maps e coleta só ele.
  function criarMenu(base) {
    let dados = lerDados();
    const m = kit.menuAlvos({
      itens: () => base,
      id: chaveLocal,
      grupo: (l) => l.cidade || 'sem cidade',
      nome: (l) => l.nome || chaveLocal(l),
      estadoDe: (l) => ESTADO_MENU[estadoLocal(l, dados)],
      atual: () => ler(CHAVE_ITEM, base[0] ? chaveLocal(base[0]) : ''),
      unidade: 'sem pendência',
      aoEscolher: (l) => {
        if (!l) return;
        if (estadoLocal(l) === 'ok' && !confirm(`${l.nome} já tem coleta sem pendência. Refazer?`)) { atualizarPainel(); return; }
        coletarUm(l);
      },
      aoProximo: () => {
        const s = situacaoGeral();
        const l = proximoLocal(s.base, ler(CHAVE_ITEM, ''), s.dados);
        if (!l) { status('Todos os estabelecimentos da lista estão coletados, sem pendência.', 'ok'); return; }
        coletarUm(l);
      },
    });
    m.chaves = base.map(chaveLocal).join('|');
    const rotular = m.rotular;
    m.rotular = (d) => { dados = d; rotular(); };
    return m;
  }

  function atualizarPainel() {
    if (!el.coletar) return;
    const s = situacaoGeral();
    const fila = ler(CHAVE_FILA, null);
    const ocupado = !!fila?.ativa;
    const n = s.base.length;

    if (menu.chaves !== s.base.map(chaveLocal).join('|')) {
      const novo = criarMenu(s.base);
      menu.caixa.replaceWith(novo.caixa);
      menu = novo;
    }
    menu.rotular(s.dados);
    menu.select.disabled = ocupado || !n;
    menu.bProx.disabled = ocupado || !n;

    const faltam = s.mapsFaltam.length;
    el.coletar.replaceChildren(kit.icone('play'), faltam ? `Coletar ${faltam}` : 'Nada falta');
    kit.dica(el.coletar, faltam ? `Coleta no Maps ${faltam === 1 ? 'o estabelecimento que falta' : `os ${faltam} que faltam`}, cerca de 1 min cada; os já coletados não são tocados. Rode numa janela própria: aba em segundo plano deixa a fila lenta.` : 'Todos os estabelecimentos da lista já têm coleta');
    el.coletar.disabled = !faltam || ocupado;
    const pend = s.mapsPend.length;
    el.pendSelo.textContent = pend ? String(pend) : '';
    kit.dica(el.pend, pend ? `Refazer ${plural(pend, 'pendente', 'pendentes')}: falha, cobertura, censura, busca nova ou avaliações de shopping não lidas` : 'Nenhum pendente');
    el.pend.disabled = !pend || ocupado;
    el.este.disabled = ocupado;
    kit.el.parar.disabled = !ocupado;
    el.retomar.hidden = !(ocupado && fila.pausada);

    if (ocupado) {
      const frac = (fila.pos + (fila.tarefas?.length ? fila.tarefa / fila.tarefas.length : 0)) / fila.locais.length;
      kit.progresso('fila', frac, `${fila.pos + 1}/${fila.locais.length} · busca ${(fila.tarefa ?? 0) + 1}/${fila.tarefas?.length || '?'}${fila.pausada ? ' · pausada' : ''}`);
      kit.estado(fila.pausada ? 'alerta' : 'rodando');
    } else kit.progresso('fila', null);
    kit.ocupado = ocupado && !fila.pausada;

    el.listaSelo.textContent = s.lista.locais.length ? String(n) : '';
    el.listaArquivo.textContent = s.lista.arquivo || '';
    el.esquecer.disabled = !s.lista.locais.length;
    el.fora.textContent = s.foraDaLista ? `+${s.foraDaLista}` : '';
    kit.dica(el.fora, s.foraDaLista ? `${plural(s.foraDaLista, 'estabelecimento guardado está', 'estabelecimentos guardados estão')} fora da lista: ficam guardados, mas não entram na coleta nem na exportação` : '');

    kit.dica(el.exportar, `3 CSVs (resumo, resultados e shoppings) de ${plural(n, 'estabelecimento', 'estabelecimentos')}; o resumo traz todos da lista, coletados ou não`);
    el.exportar.disabled = !n;
    el.osm.hidden = ler(CHAVE_OSM_ANTIGA, null) == null;
    desenharOpcoes();
    desenharRevisao();
  }

  function arquivoTexto(aoLer) {
    const input = criar('input', { type: 'file', accept: '.csv,.txt,text/csv', hidden: true });
    input.onchange = async () => {
      const f = input.files[0];
      if (f) aoLer(await f.text(), f.name);
      input.value = '';
    };
    return input;
  }

  function mudarOpcao(campo, valor) {
    gravar(CHAVE_OPCOES, { ...lerOpcoes(), [campo]: valor });
    desenharOpcoes();
  }

  const CSS_EXTRA = `
    .item{display:flex;gap:6px;align-items:center;font-size:12.5px;padding:2px 0}
    .item .nome-item{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    .item select{flex:none;width:auto}
    input[type=number]{font:inherit;color:inherit;background:var(--sup);border:0;border-radius:8px;padding:5px 8px;width:90px;flex:none}
    .arquivo{font-size:12px;color:var(--suave);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0;flex:1}
    .selo-botao{margin-left:2px}`;

  function montarPainel() {
    const { botao, linha, esp, secao, selo, ajuda } = kit;
    menu = criarMenu(situacaoGeral().base);

    // Coleta no Maps.
    el.coletar = botao('play', 'Coletar', () => { const s = situacaoGeral(); if (s.mapsFaltam.length) iniciarFila(s.mapsFaltam); }, { classe: 'primario' });
    el.pendSelo = selo('', 'alerta selo-botao');
    el.pend = botao('arrow-path', '', refazerPendentes);
    el.pend.appendChild(el.pendSelo);
    el.pend.classList.remove('ico');
    el.este = botao('map-pin', '', () => {
      const l = localAberto();
      if (!l) { status('Abra um lugar no Maps (com a coordenada na URL).', 'alerta'); return; }
      iniciarFila([l]);
    }, { dica: 'Coletar só o lugar aberto no Maps' });
    kit.botaoParar(() => { const f = ler(CHAVE_FILA, {}); f.parar = true; gravar(CHAVE_FILA, f); status('A fila para depois da busca atual.', 'alerta'); });
    el.retomar = botao('play', 'Retomar', () => {
      const f = ler(CHAVE_FILA, null);
      if (!f?.ativa) return;
      f.pausada = false;
      f.motivo_pausa = '';
      irPara(f);
    }, { classe: 'primario', dica: 'Retomar a fila pausada' });

    // Exportar.
    el.exportar = botao('arrow-down-tray', 'CSV', () => { exportar(); kit.piscar(el.exportar); }, { classe: 'mini' });
    el.parcial = kit.alternaIcone({ ico: 'document-text', rotulo: `CSV parcial a cada ${PARCIAL_A_CADA} estabelecimentos`, ligado: lerOpcoes().parcial,
      aoMudar: (v) => mudarOpcao('parcial', v) });

    // Lista (a população).
    const arqFila = arquivoTexto((texto, nome) => guardarLista(texto, nome));
    el.fila = criar('textarea', { placeholder: 'Ou cole: place_id;nome;lat;lng', 'aria-label': 'Lista colada',
      onchange: () => { if (el.fila.value.trim()) guardarLista(el.fila.value, 'colada no painel'); } });
    el.listaSelo = selo('', 'roxo');
    el.fora = selo('', 'alerta');
    el.listaArquivo = criar('span', { className: 'arquivo' });
    el.esquecer = kit.botaoPerigo('x-mark', '', () => { gravar(CHAVE_LISTA, null); el.fila.value = ''; atualizarPainel(); status('Lista esquecida; nada coletado foi apagado.'); },
      { classe: 'leve', dica: 'Esquecer a lista (a coleta guardada fica)' });
    const secLista = secao('lista', ['Lista', el.listaSelo, el.fora,
      ajuda('A população do trabalho: B1_entorno_maps_fila.csv, gerado por B1-b_entorno_maps_fila.py. O menu, a coleta e a exportação trabalham sobre ela; CSV com cabeçalho ou place_id;nome;lat;lng, uma por linha.')], [
      linha([botao('arrow-up-tray', 'CSV', () => arqFila.click(), { classe: 'mini', dica: 'Carregar a lista (CSV)' }), el.listaArquivo, el.esquecer], 'compacta'),
      el.fila, arqFila,
    ]);

    // Shopping de porte: limiar aplicado na exportação.
    el.limiar = criar('input', { type: 'number', min: 0, step: 100, 'aria-label': 'Mínimo de avaliações',
      onchange: () => mudarOpcao('limiar_aval', +el.limiar.value || 0) });
    el.porteSelo = selo('', '');
    const secPorte = secao('porte', ['Shopping de porte', el.porteSelo,
      ajuda(`Não coleta nada: shopping de porte = avaliações no Maps a partir deste mínimo; preenche qt_shoppings_porte no resumo, que traz também as contagens com ${LIMIARES_AVAL.join(', ')} avaliações.`)], [
      linha([kit.rotulo('Mínimo de avaliações'), esp(), el.limiar]),
    ]);

    // Revisão da classificação automática.
    el.revisaoSelo = selo('', 'alerta');
    el.revisao = criar('div', { className: 'lista' });
    const secRevisao = secao('revisao', ['Revisar classificação', el.revisaoSelo,
      ajuda('Resultados de classificação duvidosa ou já revistos. O grupo escolhido vale na exportação; voltar ao automático desfaz a revisão.')], [el.revisao], desenharRevisao);

    const bApagar = kit.botaoPerigo('trash', 'Apagar coleta', () => {
      gravar(CHAVE_DADOS, dadosVazios());
      gravar(CHAVE_REVISOES, {});
      gravar(CHAVE_FILA, null);
      atualizarPainel();
      status('Coleta do Maps e revisões apagadas.');
    }, { classe: 'mini', dica: 'Apaga a coleta do Maps e as revisões guardadas neste navegador. Exporte antes.' });
    el.osm = kit.botaoPerigo('trash', 'OSM', () => {
      try { localStorage.removeItem(CHAVE_OSM_ANTIGA); } catch (_) { /* sem armazenamento */ }
      atualizarPainel();
      status('Coleta antiga do OSM apagada.');
    }, { classe: 'mini', dica: 'Apaga a coleta do OpenStreetMap das versões anteriores, que não é mais usada' });

    kit.montar({
      nome: 'Entorno', css: CSS_EXTRA, largura: 340,
      filhos: [
        menu.caixa,
        linha([el.coletar, el.retomar, el.pend, el.este, kit.el.parar], 'compacta'),
        kit.barra('fila'),
        kit.el.status = criar('div', { className: 'status' }),
        linha([kit.rotulo('Exportar'), el.exportar, el.parcial]),
        secLista, secPorte, secRevisao,
        linha([esp(), el.osm, bApagar]),
      ],
    });
    if (!listaAtual().locais.length) status('Carregue a lista de estabelecimentos em Lista.', 'alerta');
  }

  function garantirPainel() {
    if (!kit.hospedeiro()) { montarPainel(); atualizarPainel(); }
    kit.garantir();
  }

  console.info('[Entorno do Maps] carregado');
  garantirPainel();
  setInterval(() => { try { garantirPainel(); } catch (e) { console.error('[Entorno do Maps]', e); } }, 1500);
  continuarFila().catch((e) => status(`Erro na fila: ${e.message}`, 'erro'));
})();
