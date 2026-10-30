// ==UserScript==
// @name         Entorno no Google Maps (TCC Luderia)
// @namespace    tcc-luderia
// @version      2026.10.30-1
// @description  Conta estações de metrô, de trem, de VLT/BRT e shoppings a 500 m e 1000 m de cada estabelecimento no Google Maps (shopping de porte pelo número de avaliações); coleta a lista de estabelecimentos e exporta CSV.
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
 * dados/[B1]…/entorno/B1_entorno_maps_fila.csv, gerada por
 * B1-b_entorno_maps_fila.py). "Coletar no Maps os N que faltam" busca só os
 * da lista ainda sem coleta. Nada é apagado ao coletar; "Refazer" recoleta só
 * o que o botão indica.
 *
 * RODE NUMA JANELA PRÓPRIA, não numa aba em segundo plano: o navegador
 * desacelera os temporizadores de abas escondidas e a fila se arrasta.
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
 * buscas conta uma vez. Grupos: metro, trem, vlt_brt, shopping, outro. O grupo
 * trem cobre os trens metropolitanos (CPTM, SuperVia, Trensurb), em coluna
 * própria para que a análise some metro + trem quando quiser "trilhos". A
 * classificação é refeita na exportação, então regra nova vale também para o
 * que já está guardado.
 *
 * Buscas dispensadas. Nas metrópoles da REGIC sem metrô, trem, VLT ou BRT em
 * operação (SEM_SISTEMA, situação em outubro de 2026), a busca desse sistema
 * não é feita: o grupo sai zero, não branco, e a coluna consultas_dispensadas
 * diz o porquê.
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
 *
 * Duplicatas. Resultados do mesmo grupo a até 150 m e com nome parecido
 * contam uma vez (fica o de mais avaliações). Shoppings, até 400 m (as
 * entradas de um shopping grande ficam a mais de 150 m uma da outra): mesmo
 * nome sem "shopping", "mall" e espaços ("DiamondMall" = "Diamond Mall") ou
 * cadastro de parte do shopping (entrada, estacionamento, garagem, sala, piso,
 * torre, bloco, acesso, portaria) perto de outro shopping.
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
 *    metro + trem + vlt_brt + shoppings + outros = resultados_ate_1000m;
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
  const VERSAO = '2026.10.30-1';
  const CHAVE_DADOS = 'tcc-entorno-dados-v2';
  const CHAVE_FILA = 'tcc-entorno-fila-v2';
  const CHAVE_REVISOES = 'tcc-entorno-revisoes';
  const CHAVE_OPCOES = 'tcc-entorno-opcoes';
  const CHAVE_PAINEL_MAPS = 'tcc-entorno-largura-painel-maps';
  const CHAVE_POSICAO = 'tcc-entorno-posicao';
  const CHAVE_LISTA = 'tcc-entorno-lista';
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
    { consulta: 'estação BRT', grupo: 'vlt_brt' },
    { consulta: 'estação VLT', grupo: 'vlt_brt' },
    { consulta: 'estação tubo', grupo: 'vlt_brt' },
    { consulta: 'shopping center', grupo: 'shopping' },
  ];
  // Consultas dos estabelecimentos guardados antes do campo "consultas" (até 13/10/2026).
  const CONSULTAS_ANTIGAS = ['estação de metrô', 'estação BRT', 'estação VLT', 'shopping center'];
  // Sistemas ausentes por metrópole (REGIC), em outubro de 2026: a busca é dispensada.
  // Chave: nome da cidade sem acento, em minúsculas, como sai do endereço.
  const METRO = 'estação de metrô';
  const TREM = 'estação de trem';
  const VLT = 'estação VLT';
  const BRT = 'estação BRT';
  const TUBO = 'estação tubo';
  // Buscas que só valem em algumas cidades; nas demais, dispensadas.
  const SO_NAS_CIDADES = { [TUBO]: ['curitiba'] };
  const SEM_SISTEMA = {
    'sao paulo': [VLT],
    'rio de janeiro': [],
    brasilia: [TREM, VLT],
    belem: [METRO, TREM, VLT],
    'belo horizonte': [TREM, VLT],
    curitiba: [METRO, TREM, VLT],
    florianopolis: [METRO, TREM, VLT, BRT],
    fortaleza: [],
    goiania: [METRO, TREM, VLT],
    manaus: [METRO, TREM, VLT, BRT],
    'porto alegre': [VLT],
    recife: [],
    salvador: [TREM],
    vitoria: [METRO, TREM, VLT, BRT],
  };
  const TRANSPORTE = ['metro', 'trem', 'vlt_brt'];
  function consultasDispensadas(cidade) {
    const c = semAcento(cidade).trim();
    const locais = Object.entries(SO_NAS_CIDADES).filter(([, cs]) => !cs.includes(c)).map(([q]) => q);
    return [...(SEM_SISTEMA[c] || []), ...locais];
  }
  const GRUPOS = { metro: 'estacoes_metro', trem: 'estacoes_trem', vlt_brt: 'estacoes_vlt_brt', shopping: 'shoppings' };
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
    try { localStorage.setItem(chave, JSON.stringify(valor)); return true; } catch (e) { status(`Não consegui gravar no navegador (espaço cheio?): ${e.message}`); return false; }
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

  function classificar(nome, categoria) {
    const n = semAcento(nome);
    const c = semAcento(categoria).trim();
    // Estação ainda não inaugurada ("Futura estação Rua do Grito (BRT ABC)").
    if (/\bfutura\b|em (obras|construcao)|desativad/.test(n)) return 'outro';
    if (/^(shopping|shopping center|shopping mall|outlet)$/.test(c)) return 'shopping';
    // Nome do operador vale mais que a categoria: "Trensurb Estação Rodoviária" vem como metrô.
    if (/\b(cptm|supervia|trensurb)\b/.test(n) && /estacao|transporte|metro/.test(c)) return 'trem';
    if (/\bmetro\b|subway/.test(c)) return 'metro';
    // Estações-tubo do BRT de Curitiba (RIT), muitas sem categoria no Maps.
    if (/^estacao tubo\b/.test(n)) return 'vlt_brt';
    const transporte = /transporte|estacao|parada|ponto|terminal|onibus|trem|bonde/.test(c);
    if (/\b(brt|vlt)\b|veiculo leve|light rail|bonde|tram\b/.test(c)) return 'vlt_brt';
    // "Companhia ferroviária" é a sede do operador, não estação.
    if (/\btrem\b|\btrens\b|ferrovi|train station|railway/.test(c) && !/^(companhia|empresa)\b/.test(c)) return 'trem';
    if (/\b(brt|vlt)\b/.test(n) && transporte) return 'vlt_brt';
    if (/\bmetro\b/.test(n) && /estacao|transporte/.test(c)) return 'metro';
    if (/\b(cptm|supervia|trensurb|trem)\b/.test(n) && /estacao|transporte/.test(c)) return 'trem';
    return 'outro';
  }

  // "Outro" com cara de estação ou shopping: vai para a revisão manual.
  function suspeito(r) {
    return r.grupo_auto === 'outro' && r.distancia_m <= RAIO_MAX &&
      /estac|terminal|metro|\bbrt\b|\bvlt\b|\btrem\b|cptm|supervia|trensurb|ferrovi|bonde|shopping|\bmall\b/.test(semAcento(`${r.nome} ${r.categoria_maps}`));
  }

  // ---------- duplicatas ----------

  const PALAVRAS_GENERICAS = new Set(['estacao', 'estacoes', 'metro', 'trem', 'cptm', 'supervia', 'trensurb', 'brt', 'vlt', 'shopping', 'center', 'mall', 'de', 'da', 'do', 'das', 'dos', 'e', 'linha', 'sentido', 'plataforma', 'terminal', 'parada', 'ponto', 'station', 'praca', 'parque', 'praia', 'largo', 'jardim']);

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

  // r repete m (m tem mais avaliações): mesmo grupo, perto e nome parecido.
  function repete(m, r) {
    if (m.grupo !== r.grupo) return false;
    const d = distancia(m.lat, m.lng, r.lat, r.lng);
    if (d <= DIST_DUPLICATA_M && nomesParecidos(m.nome, r.nome)) return true;
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
    if (estado === 'bloqueado' || estado === 'falhou') return { estado, itens: [], lotou: false };
    await esperar(1200);
    if (estado === 'vazio') return { estado, itens: [], lotou: false };
    if (estado === 'lugar') {
      const nome = document.querySelector('h1.DUwDvf')?.innerText || '';
      const categoria = document.querySelector('button[jsaction*="category"]')?.innerText || '';
      const resumo = document.querySelector('div.F7nice')?.innerText || '';
      const avaliacoes = lerNumeroAvaliacoes(resumo) || (/nenhuma avaliacao|no reviews/.test(semAcento(resumo)) ? '0' : '');
      return { estado, itens: [{ nome, categoria_maps: categoria, n_avaliacoes: avaliacoes, ...lerHref(location.href) }], lotou: false };
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
    return { estado, itens, lotou: precisaSubdividir(itens.length, fimDaLista(feed)) };
  }

  // Lista com 10 ou mais itens sem a marca de fim pode ter cortado resultados.
  function precisaSubdividir(n, chegouAoFim) { return n >= 10 && !chegouAoFim; }

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
        const rev = revisoes[chave(r)];
        const grupo_auto = classificar(r.nome, r.categoria_maps);
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

  function iniciarFila(locais, refazer = false) {
    const dados = lerDados();
    const feitos = new Set(dados.locais.map((l) => l.chave));
    const pendentes = refazer ? locais : locais.filter((l) => !feitos.has(chaveLocal(l)));
    if (!pendentes.length) { status('Todos já coletados. "Refazer pendentes" ou "Limpar" para refazer.'); return; }
    const fila = { ativa: true, parar: false, pausada: false, motivo_pausa: '', locais: pendentes, pos: 0, inicio: Date.now(), buscas_feitas: 0, locais_fechados: 0, buscas_em_fechados: 0 };
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
      grupo_auto: classificar(r.nome, r.categoria_maps),
      distancia_m: distancia(local.lat, local.lng, r.lat, r.lng),
      coletado_em,
    }));
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
      status(parar ? 'Fila interrompida.' : `Fila concluída: ${fila.locais.length} estabelecimentos.`);
      atualizarPainel();
      if (!parar) { tocar('fim'); exportar({ fontes: ['maps', 'shoppings'], locais: fila.locais }); }
      return;
    }
    gravar(CHAVE_FILA, fila);
    atualizarPainel();
    status(`${fila.pos + 1}/${fila.locais.length} · ${msg}${previsao(fila)}${document.hidden ? ' Aba em segundo plano: use janela própria.' : ''}`);
    await esperar(sortear(PAUSA_ENTRE_BUSCAS));
    if (ler(CHAVE_FILA, {}).parar) { fila.ativa = false; gravar(CHAVE_FILA, fila); status('Fila interrompida.'); atualizarPainel(); return; }
    irPara(fila);
  }

  function pausarPorBloqueio(fila) {
    fila.pausada = true;
    fila.motivo_pausa = 'bloqueio';
    gravar(CHAVE_FILA, fila);
    tocar('alerta');
    status('O Google pediu verificação (tráfego incomum). Resolva a verificação; a fila segue sozinha ao voltar ao Maps. Se não seguir, clique em Retomar.');
    atualizarPainel();
  }

  async function continuarFila() {
    const fila = ler(CHAVE_FILA, null);
    if (!fila || !fila.ativa) return;
    if (bloqueado()) { pausarPorBloqueio(fila); return; }
    if (fila.pausada) {
      if (fila.motivo_pausa !== 'bloqueio' || !/\/maps\/(search|place)\//.test(location.href)) { status('Fila pausada. Clique em Retomar.'); return; }
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
      // Lista lotada com item fora do mapa: nada foi cortado na área (comum na
      // busca de trem em cidade sem trem); não subdivide nem marca censura.
      if (leitura.lotou && t.busca && leitura.itens.some((r) => foraDoMapa(r, t.busca, janelaAtual()))) leitura.lotou = false;
      if (leitura.lotou && !t.quadrante) { fila.tarefas.push(...quadrantes(t)); fila.subdivididas.push(t.consulta); msg += ' Lista lotada: 4 quadrantes.'; }
      if (leitura.lotou && t.quadrante) fila.censura.push(rotulo(t));
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
    for (const col of Object.values(GRUPOS)) cols.push(`dist_${col}_mais_proxima_m`);
    cols.push('dist_estacao_mais_proxima_m', 'estacao_mais_proxima', 'tipo_estacao_mais_proxima');
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
    if (!saida.universo.length) { status('Nada para exportar.'); return; }
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
    if (!locais.length) { status('Nenhuma linha com lat e lng: a lista não mudou.'); return; }
    gravar(CHAVE_LISTA, { locais, arquivo, guardada_em: agora() });
    status(`Lista: ${locais.length} estabelecimentos (${arquivo}).`);
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

  // ---------- painel (padrão: canto superior direito, shadow DOM, fora do <body>) ----------

  const el = {};
  let hospedeiro = null;

  function criar(tag, props = {}, filhos = []) {
    const n = document.createElement(tag);
    Object.assign(n, props);
    for (const f of filhos) n.appendChild(typeof f === 'string' ? document.createTextNode(f) : f);
    return n;
  }

  function status(t) { if (el.status) el.status.textContent = t; }

  function listaRevisao() {
    const dados = lerDados();
    const revisoes = ler(CHAVE_REVISOES, {});
    const porChave = new Map();
    for (const r of dados.resultados) {
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
    el.revisaoTitulo.textContent = `Revisar classificação do Maps (${itens.length})`;
    if (!el.revisao.parentElement.open) return;
    el.revisao.replaceChildren(...(itens.length ? itens.map((r) => {
      const k = chave(r);
      const sel = criar('select', {}, ['metro', 'trem', 'vlt_brt', 'shopping', 'outro'].map((g) => criar('option', { value: g, textContent: g })));
      sel.value = revisoes[k] || r.grupo_auto;
      sel.onchange = () => {
        const rv = ler(CHAVE_REVISOES, {});
        if (sel.value === r.grupo_auto) delete rv[k]; else rv[k] = sel.value;
        gravar(CHAVE_REVISOES, rv);
        status(`${r.nome}: ${sel.value}.`);
      };
      return criar('div', { className: 'item' }, [
        criar('span', { textContent: `${r.nome} · ${r.categoria_maps || 'sem categoria'} · ${r.distancia_m} m de ${r.origem_nome}` }),
        sel,
      ]);
    }) : [criar('span', { className: 'dica', textContent: 'Nada a revisar.' })]));
  }

  function desenharOpcoes() {
    const op = lerOpcoes();
    el.limiar.value = op.limiar_aval;
    el.parcial.checked = op.parcial;
  }

  const plural = (n, um, varios) => `${n} ${n === 1 ? um : varios}`;

  function atualizarPainel() {
    if (!el.resumo) return;
    const s = situacaoGeral();
    const fila = ler(CHAVE_FILA, null);
    const ocupado = !!fila?.ativa;
    const n = s.base.length;
    el.resumo.textContent = s.lista.locais.length
      ? `Lista: ${plural(n, 'estabelecimento', 'estabelecimentos')}${s.lista.arquivo ? ` (${s.lista.arquivo})` : ''}.`
      : `Sem lista: o painel usa os ${n} estabelecimentos guardados. Carregue a lista em 1.`;
    el.listaInfo.textContent = s.foraDaLista ? `${plural(s.foraDaLista, 'estabelecimento guardado está', 'estabelecimentos guardados estão')} fora da lista: ficam guardados, mas não entram na coleta nem na exportação.` : '';
    el.mapsInfo.textContent = `${s.mapsFeitos} de ${n} coletados; ${s.mapsFaltam.length} faltam; ${plural(s.mapsPend.length, 'pendente', 'pendentes')} (falha, cobertura, censura, busca nova ou avaliações de shopping não lidas).` +
      (fila?.ativa ? ` Fila: ${fila.pos + 1}/${fila.locais.length}, busca ${fila.tarefa + 1}/${fila.tarefas.length}${fila.pausada ? ' (pausada)' : ''}.` : '');
    el.mapsColetar.textContent = s.mapsFaltam.length ? `Coletar no Maps ${s.mapsFaltam.length === 1 ? 'o que falta' : `os ${s.mapsFaltam.length} que faltam`}` : 'Maps: nada falta';
    el.mapsColetar.disabled = !s.mapsFaltam.length || ocupado;
    el.mapsPend.textContent = `Refazer ${plural(s.mapsPend.length, 'pendente', 'pendentes')} no Maps`;
    el.mapsPend.disabled = !s.mapsPend.length || ocupado;
    el.este.disabled = ocupado;
    el.parar.disabled = !fila?.ativa;
    el.retomar.hidden = !(fila?.ativa && fila.pausada);
    el.exportar.textContent = `Exportar 3 CSVs (${plural(n, 'estabelecimento', 'estabelecimentos')})`;
    el.exportar.disabled = !n;
    desenharOpcoes();
    desenharRevisao();
  }

  const CSS = `
    #painel{position:fixed;top:12px;right:12px;z-index:2147483647;width:360px;
      max-height:calc(100vh - 24px);overflow:auto;box-sizing:border-box;
      background:#fff;color:#111;border:1px solid #ccc;border-radius:10px;
      box-shadow:0 4px 16px rgba(0,0,0,.18);font:13px/1.4 system-ui,sans-serif;padding:10px}
    @media (prefers-color-scheme:dark){#painel{background:#1e1e1e;color:#eee;border-color:#444}}
    #painel.min>*:not(header){display:none}
    header{display:flex;justify-content:space-between;align-items:center;font-weight:700;cursor:grab;user-select:none}
    p{margin:4px 0}
    section{border-top:1px solid #8884;margin-top:8px;padding-top:6px}
    h3{margin:0 0 2px;font-size:13px}
    .linha{display:flex;flex-wrap:wrap;gap:6px;margin:6px 0;align-items:center}
    button{flex:1 1 auto;padding:5px 8px;border-radius:6px;border:1px solid #888;
      background:transparent;color:inherit;cursor:pointer;font:inherit}
    button.principal{border-color:#1a73e8;font-weight:600}
    button:disabled{opacity:.4;cursor:default}
    button[hidden],div[hidden]{display:none}
    textarea{width:100%;box-sizing:border-box;height:52px;font:12px monospace;
      background:transparent;color:inherit;border:1px solid #888;border-radius:6px}
    select,input[type=number]{font:inherit;color:inherit;background:transparent;border:1px solid #888;border-radius:6px;padding:2px 4px}
    input[type=number]{width:80px}
    details{border-top:1px solid #8884;margin-top:8px;padding-top:4px}
    summary{cursor:pointer;font-weight:600}
    .lista{max-height:260px;overflow:auto;display:flex;flex-direction:column;gap:4px;margin-top:4px}
    .item{display:flex;gap:6px;align-items:center;font-size:12px}
    .item span{flex:1}
    .status{font-size:12px;margin-top:8px;padding:6px;border-radius:6px;background:#8881}
    .dica{font-size:12px;opacity:.8}`;

  function posicionar(painel) {
    const p = ler(CHAVE_POSICAO, null);
    if (!p) return;
    painel.style.left = `${Math.min(Math.max(0, p.left), Math.max(0, innerWidth - 120))}px`;
    painel.style.top = `${Math.min(Math.max(0, p.top), Math.max(0, innerHeight - 40))}px`;
    painel.style.right = 'auto';
  }

  // Arrastar pelo cabeçalho (vários painéis do TCC dividem o canto do Maps);
  // clique sem arrastar minimiza; duplo clique volta ao canto.
  function arrastavel(painel, cabecalho, minimizar) {
    cabecalho.onpointerdown = (ev) => {
      const r = painel.getBoundingClientRect();
      const x0 = ev.clientX;
      const y0 = ev.clientY;
      let moveu = false;
      const mover = (e) => {
        if (Math.abs(e.clientX - x0) + Math.abs(e.clientY - y0) > 4) moveu = true;
        if (!moveu) return;
        gravar(CHAVE_POSICAO, { left: Math.round(r.left + e.clientX - x0), top: Math.round(r.top + e.clientY - y0) });
        posicionar(painel);
      };
      const soltar = () => {
        removeEventListener('pointermove', mover);
        removeEventListener('pointerup', soltar);
        if (!moveu) minimizar();
      };
      addEventListener('pointermove', mover);
      addEventListener('pointerup', soltar);
    };
    cabecalho.ondblclick = () => { localStorage.removeItem(CHAVE_POSICAO); Object.assign(painel.style, { left: '', top: '', right: '' }); };
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

  function montarPainel() {
    const botao = (texto, fn, principal = false) => criar('button', { textContent: texto, onclick: fn, className: principal ? 'principal' : '' });
    const secao = (titulo, filhos) => criar('section', {}, [criar('h3', { textContent: titulo }), ...filhos]);
    const linha = (filhos) => criar('div', { className: 'linha' }, filhos);
    const dica = (texto) => criar('p', { className: 'dica', textContent: texto });
    el.resumo = criar('p');
    el.status = criar('p', { className: 'status', textContent: 'Pronto.' });

    // 1. Lista
    el.listaInfo = dica('');
    el.fila = criar('textarea', { placeholder: 'Ou cole aqui: place_id;nome;lat;lng (uma por linha) ou CSV com cabeçalho', onchange: () => { if (el.fila.value.trim()) guardarLista(el.fila.value, 'colada no painel'); } });
    const arqFila = arquivoTexto((texto, nome) => guardarLista(texto, nome));
    const bArquivo = botao('Carregar lista (CSV)', () => arqFila.click(), true);
    const bEsquecer = botao('Esquecer lista', () => { gravar(CHAVE_LISTA, null); el.fila.value = ''; atualizarPainel(); status('Lista esquecida; nada coletado foi apagado.'); });

    // 2. Google Maps
    el.mapsInfo = dica('');
    el.mapsColetar = botao('Coletar no Maps', () => { const s = situacaoGeral(); if (s.mapsFaltam.length) iniciarFila(s.mapsFaltam); }, true);
    el.mapsPend = botao('Refazer pendentes', refazerPendentes);
    el.este = botao('Só o lugar aberto', () => {
      const l = localAberto();
      if (!l) { status('Abra um lugar no Maps (com a coordenada na URL).'); return; }
      iniciarFila([l]);
    });
    el.parar = botao('Parar', () => { const f = ler(CHAVE_FILA, {}); f.parar = true; gravar(CHAVE_FILA, f); status('A fila para depois da busca atual.'); });
    el.retomar = botao('Retomar', () => {
      const f = ler(CHAVE_FILA, null);
      if (!f?.ativa) return;
      f.pausada = false;
      f.motivo_pausa = '';
      irPara(f);
    });
    el.parcial = criar('input', { type: 'checkbox', onchange: () => mudarOpcao('parcial', el.parcial.checked) });

    // 3. Exportar
    el.exportar = botao('Exportar 3 CSVs', () => exportar(), true);

    // Shopping de porte: limiar aplicado na exportação.
    el.limiar = criar('input', { type: 'number', min: 0, step: 100, onchange: () => mudarOpcao('limiar_aval', +el.limiar.value || 0) });
    const porteDet = criar('details', {}, [
      criar('summary', { textContent: 'Shopping de porte (critério)' }),
      dica(`Não coleta nada. Shopping de porte = avaliações no Maps a partir deste mínimo; preenche qt_shoppings_porte no resumo. O resumo traz também as contagens com ${LIMIARES_AVAL.join(', ')} avaliações.`),
      linha([criar('span', { textContent: 'Mínimo de avaliações no Maps' }), el.limiar]),
    ]);

    el.revisaoTitulo = criar('summary', { textContent: 'Revisar classificação do Maps' });
    el.revisao = criar('div', { className: 'lista' });
    const revisaoDet = criar('details', { ontoggle: desenharRevisao }, [el.revisaoTitulo, el.revisao]);

    const apagarDet = criar('details', {}, [
      criar('summary', { textContent: 'Apagar dados guardados' }),
      linha([
        botao('Apagar coleta do Maps', () => {
          if (!confirm('Apagar o que foi coletado no Maps e as revisões? Exporte antes.')) return;
          gravar(CHAVE_DADOS, dadosVazios());
          gravar(CHAVE_REVISOES, {});
          gravar(CHAVE_FILA, null);
          atualizarPainel();
        }),
        botao('Apagar OSM antigo', () => {
          if (!confirm('Apagar a coleta do OpenStreetMap das versões anteriores (não é mais usada)?')) return;
          localStorage.removeItem(CHAVE_OSM_ANTIGA);
          status('Coleta antiga do OSM apagada.');
        }),
      ]),
    ]);

    const sinal = criar('span', { textContent: '–' });
    const cabecalho = criar('header', { title: 'Arraste para mover; duplo clique volta ao canto' }, [criar('span', { textContent: 'Entorno: estações e shoppings' }), sinal]);
    const painel = criar('div', { id: 'painel' }, [
      cabecalho,
      el.resumo,
      secao('1. Lista de estabelecimentos', [
        dica('A população do trabalho: B1_entorno_maps_fila.csv (gerado por B1-b_entorno_maps_fila.py). A coleta abaixo trabalha sobre ela.'),
        linha([bArquivo, bEsquecer]), el.fila, el.listaInfo,
      ]),
      secao('2. Google Maps', [
        dica('Abre as buscas no Maps, cerca de 1 min por estabelecimento. Só busca quem ainda não tem coleta; os já coletados não são tocados.'),
        el.mapsInfo,
        linha([el.mapsColetar]), linha([el.mapsPend, el.este]), linha([el.parar, el.retomar]),
        criar('label', { className: 'linha dica' }, [el.parcial, criar('span', { textContent: `Baixar CSV parcial a cada ${PARCIAL_A_CADA} estabelecimentos` })]),
      ]),
      secao('3. Exportar', [
        dica('Resumo, resultados e a tabela de shoppings (avaliações e porte). Uma linha por estabelecimento da lista no resumo, coletado ou não.'),
        linha([el.exportar]),
      ]),
      el.status,
      porteDet,
      revisaoDet,
      apagarDet,
      dica('Rode numa janela própria: aba em segundo plano deixa a fila lenta.'),
      arqFila,
    ]);
    arrastavel(painel, cabecalho, () => { painel.classList.toggle('min'); sinal.textContent = painel.classList.contains('min') ? '+' : '–'; });
    posicionar(painel);

    hospedeiro = criar('div', { id: 'tcc-entorno-hospedeiro' });
    const raiz = hospedeiro.attachShadow({ mode: 'open' });
    raiz.appendChild(criar('style', { textContent: CSS }));
    raiz.appendChild(painel);
  }

  function garantirPainel() {
    if (!hospedeiro) { montarPainel(); atualizarPainel(); }
    if (!hospedeiro.isConnected) document.documentElement.appendChild(hospedeiro);
  }

  console.info('[Entorno do Maps] carregado');
  garantirPainel();
  setInterval(() => { try { garantirPainel(); } catch (e) { console.error('[Entorno do Maps]', e); } }, 1500);
  continuarFila().catch((e) => status(`Erro na fila: ${e.message}`));
})();
