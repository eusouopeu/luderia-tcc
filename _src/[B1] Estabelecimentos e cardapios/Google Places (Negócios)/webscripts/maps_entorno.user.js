// ==UserScript==
// @name         Entorno no Google Maps (TCC Luderia)
// @namespace    tcc-luderia
// @version      2026.10.15-4
// @description  Conta estações de metrô, de trem, de VLT/BRT, shoppings e parques a 500 m e 1000 m de cada estabelecimento, no Google Maps e no OpenStreetMap; coleta a lista de estabelecimentos e exporta CSV.
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
 * Duas fontes, coletadas em separado e guardadas em separado no navegador:
 *  - Google Maps: buscas do Maps em volta de cada estabelecimento (abre
 *    páginas; cerca de 1 min por estabelecimento);
 *  - OpenStreetMap: uma consulta à Overpass por estabelecimento (não abre
 *    páginas; poucos segundos cada).
 * O painel trabalha sobre a LISTA de estabelecimentos (a população, em
 * dados/[B1]…/entorno/B1_entorno_maps_fila.csv, gerada por
 * B1-b_entorno_maps_fila.py). Cada botão de coleta diz quantos vai buscar:
 * "Coletar no Maps os N que faltam" busca só os da lista ainda sem Maps;
 * "Coletar no OSM os N que faltam", só os da lista ainda sem OSM. Nada é
 * apagado ao coletar; "Refazer" recoleta só o que o botão indica.
 *
 * RODE NUMA JANELA PRÓPRIA, não numa aba em segundo plano: o navegador
 * desacelera os temporizadores de abas escondidas e a fila se arrasta.
 *
 * ---------- Google Maps ----------
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
 * diz o porquê. A mesma tabela vale para o OSM: estação de sistema ausente na
 * cidade (ex.: trem em Salvador, desativado em 2021) vai para "outro".
 *
 * Estação mais próxima. No Maps, até 1000 m é a mais próxima de fato; acima,
 * é a mais próxima entre as lidas (limite superior). Resultado a mais de 50 km
 * (o Maps completa listas com outras cidades) fica com fora_da_regiao = sim e
 * não entra nas distâncias.
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
 * contam uma vez (fica o de mais avaliações; no OSM, o de maior área). No OSM,
 * plataformas de cada sentido com o MESMO nome e a mesma rede contam uma vez
 * até 400 m (estações-tubo de Curitiba e BRT de Brasília ficam a 150-200 m
 * uma da outra; até a versão 2026.10.15-3 contavam duas vezes).
 *
 * Revisão. "Revisar classificação": resultados do Maps no grupo "outro" a até
 * 1000 m com cara de estação ou shopping, para reclassificar com um clique.
 *
 * ---------- OpenStreetMap ----------
 *
 * Uma consulta à Overpass por estabelecimento traz, a até 2000 m, estações
 * (railway=station|halt|tram_stop, public_transport=station,
 * amenity=bus_station, pontos e plataformas com "BRT" ou "tubo" no nome) e, a
 * até 1200 m, shoppings (shop=mall), parques (leisure=park) e praias
 * (natural=beach). Grupo de cada elemento pelas próprias tags
 * (classificarOsm): metro (station=subway|monorail), trem (railway=station
 * de trem, operadores CPTM, SuperVia, Trensurb), vlt_brt (light_rail, tram,
 * BRT e estações-tubo), shopping, praia_parque e outro (terminal de ônibus,
 * barca, funicular, estação futura, bonde de Santa Teresa, que é linha
 * turística, e parada ou plataforma sem nome, que não identifica a estação).
 * Distância: até a coordenada, para nós;
 * até a borda da bounding box, para vias e relações (estar ao lado de uma
 * praia longa conta). Repete a operacionalização do B1-c_entorno_osm.py
 * (coleta de 13/10/2026), que só tinha metrô, shopping e praia/parque.
 *
 * ---------- Shopping de porte: as duas medidas juntas ----------
 *
 * O Maps dá a categoria "Shopping center" também a galerias e prédios
 * comerciais; o OSM tem shop=mall com polígono, mas nem sempre. Por isso cada
 * shopping a até 1000 m sai com as DUAS medidas no CSV de shoppings: área da
 * bounding box do shop=mall no OSM e número de avaliações no Maps. O casamento
 * Maps-OSM é espacial: o ponto do Maps dentro do polígono (folga de 60 m) ou,
 * sem polígono, o shop=mall a até 200 m. Dois cadastros do Maps no mesmo
 * polígono contam uma vez (mesmo_poligono_de). Shopping só do OSM entra com
 * avaliações em branco; só do Maps, com área em branco. Critério da coluna
 * qt_shoppings_porte, escolhido no painel e aplicado na exportação:
 *   - osm: área >= área mínima (5.000 m², o corte do B1-c_entorno_osm.py);
 *   - avaliacoes: avaliações >= mínimo (proxy sem fonte);
 *   - ambos: as duas condições; qualquer: uma delas;
 *   - abrasce: nome na lista de associados, carregada no painel.
 * As colunas qt_shoppings_porte_osm_* e qt_shoppings_porte_aval_* trazem as
 * duas medidas lado a lado, qualquer que seja o critério.
 *
 * ---------- CSVs (";" e UTF-8 com BOM) ----------
 *
 * "Exportar" baixa os cinco arquivos da lista (ou de tudo o que está
 * guardado, sem lista). O nome começa pela data local e traz o estabelecimento
 * (ou "N_estabelecimentos"). Um estabelecimento por linha nos resumos, com
 * linha também para quem ainda não foi coletado (situacao diz o quê):
 *  - …_entorno_resumo.csv (Maps): qt_*_500m contidas em qt_*_1000m; a
 *    1000 m, metro + trem + vlt_brt + shoppings + outros = resultados_ate_1000m;
 *  - …_entorno_resultados.csv (Maps): um resultado por linha;
 *  - …_entorno_osm_resumo.csv: a 1000 m, metro + trem + vlt_brt + shoppings
 *    + praias_parques + outros = elementos_ate_1000m;
 *  - …_entorno_osm_resultados.csv: um elemento do OSM por linha;
 *  - …_entorno_shoppings.csv: um shopping por estabelecimento, com área e
 *    avaliações.
 * Os dois resumos trazem versao_script, a versão que fez a coleta (em branco
 * nas coletas anteriores a 2026.10.15-4).
 * O fim de cada coleta baixa só os arquivos daquela fonte e daquela fila;
 * a cada 10 estabelecimentos do Maps, CSVs parciais (opção no painel).
 */

(function () {
  'use strict';

  // Versão gravada nos CSVs. Não usa GM_info: pelo carregador, ele dá a versão do carregador.
  const VERSAO = '2026.10.15-4';
  const CHAVE_DADOS = 'tcc-entorno-dados-v2';
  const CHAVE_FILA = 'tcc-entorno-fila-v2';
  const CHAVE_REVISOES = 'tcc-entorno-revisoes';
  const CHAVE_OPCOES = 'tcc-entorno-opcoes';
  const CHAVE_PAINEL_MAPS = 'tcc-entorno-largura-painel-maps';
  const CHAVE_POSICAO = 'tcc-entorno-posicao';
  const CHAVE_OSM = 'tcc-entorno-osm-v1';
  const CHAVE_LISTA = 'tcc-entorno-lista';

  const RAIOS_M = [500, 1000];
  const RAIO_MAX = 1000;
  const FOLGA = 1.1;
  const ZOOM_MAX = 17;
  const ZOOM_MIN = 11;
  const PAINEL_MAPS_PADRAO_PX = 480;
  const TENTATIVAS = 2;
  const DIST_DUPLICATA_M = 150;
  // Plataformas de sentidos opostos da mesma estação (mesmo nome e rede, no OSM).
  const DIST_PLATAFORMAS_M = 400;
  // Acima disso o resultado é de outra região (o Maps completa a lista com
  // estações de outras cidades): fica no CSV de resultados, fora do resumo.
  const DIST_REGIAO_M = 50000;
  // Espelhos da Overpass, na ordem de tentativa. Em outubro de 2026 a principal
  // e os espelhos recusam muito (406, 429, 504); o da Mail.ru respondia e
  // libera o acesso a partir de outra página (CORS).
  const OVERPASS = ['https://overpass-api.de/api/interpreter', 'https://maps.mail.ru/osm/tools/overpass/api/interpreter', 'https://overpass.private.coffee/api/interpreter', 'https://overpass.kumi.systems/api/interpreter'];
  // OSM: estações até 2 km (estação mais próxima); shopping, parque e praia
  // até 1.200 m (folga para casar o shopping do Maps com o polígono).
  const RAIO_OSM_TRANSPORTE = 2000;
  const RAIO_OSM_AREAS = RAIO_MAX + 200;
  const PAUSA_OSM = 2000;
  const TAGS_OSM = ['railway', 'station', 'public_transport', 'bus', 'train', 'subway', 'light_rail', 'tram', 'monorail', 'ferry', 'amenity', 'highway', 'shop', 'leisure', 'natural', 'network', 'operator'];
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
  const GRUPOS_OSM = { ...GRUPOS, praia_parque: 'praias_parques' };
  const consultasDoGrupo = (g) => CONSULTAS.filter((c) => c.grupo === g).map((c) => c.consulta);
  // Sistema sem operação na cidade: todas as buscas do grupo dispensadas.
  const sistemaAusente = (g, cidade) => { const d = consultasDispensadas(cidade); const cs = consultasDoGrupo(g); return cs.length > 0 && cs.every((c) => d.includes(c)); };
  const OPCOES_PADRAO = { porte: 'osm', area_min_m2: 5000, limiar_aval: 1000, abrasce: [], abrasce_arquivo: '', parcial: true };

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

  // Marca duplicata_de nos resultados de um estabelecimento (fica o de mais avaliações).
  function marcarDuplicatas(rs) {
    const mantidos = [];
    for (const r of [...rs].sort((a, b) => (+b.n_avaliacoes || 0) - (+a.n_avaliacoes || 0))) {
      const igual = r.grupo !== 'outro' && mantidos.find((m) => m.grupo === r.grupo &&
        distancia(m.lat, m.lng, r.lat, r.lng) <= DIST_DUPLICATA_M && nomesParecidos(m.nome, r.nome));
      r.duplicata_de = igual ? igual.nome : '';
      if (!igual) mantidos.push(r);
    }
    return rs;
  }

  // ---------- shopping de porte ----------

  function nomeShopping(t) {
    return semAcento(t).replace(/[^a-z0-9]+/g, ' ').replace(/\b(shopping|center|centre|mall|outlet|de|da|do|das|dos|e|the)\b/g, ' ').replace(/\s+/g, ' ').trim();
  }

  function mesmoShopping(a, b) {
    const x = nomeShopping(a);
    const y = nomeShopping(b);
    if (!x || !y) return false;
    return x === y || (x.length >= 4 && y.length >= 4 && (x.includes(y) || y.includes(x)));
  }

  function areaCaixa(b) {
    const meio = ((b.minlat + b.maxlat) / 2) * (Math.PI / 180);
    return Math.round((b.maxlat - b.minlat) * 111320 * (b.maxlon - b.minlon) * 111320 * Math.cos(meio));
  }

  // Shopping do OSM que corresponde a um resultado do Maps: o ponto dentro da
  // caixa (folga de 60 m; havendo várias, a maior). Polígono pode valer para
  // mais de um resultado (galeria dentro do shopping: mesmo_poligono_de). Sem
  // polígono, o shop=mall a até 200 m que ainda não casou com outro resultado
  // (`usados`) nem está reservado pelo nome a outro (`reservados`): primeiro o
  // de nome igual, depois o mais próximo. Assim um nó do OSM fica com um único
  // shopping do Maps.
  function casarOsm(r, malls, usados = new Map(), reservados = new Map()) {
    const folga = 60 / 111320;
    const dentro = malls.filter((m) => m.area_m2 != null && r.lat >= m.minlat - folga && r.lat <= m.maxlat + folga && r.lng >= m.minlon - folga && r.lng <= m.maxlon + folga);
    if (dentro.length) return [...dentro].sort((a, b) => b.area_m2 - a.area_m2)[0];
    const perto = malls
      .filter((m) => !usados.has(m.id) && (!reservados.has(m.id) || reservados.get(m.id) === r))
      .map((m) => ({ m, d: distancia(r.lat, r.lng, (m.minlat + m.maxlat) / 2, (m.minlon + m.maxlon) / 2) }))
      .filter((x) => x.d <= 200).sort((a, b) => a.d - b.d);
    return (perto.find((x) => mesmoShopping(r.nome, x.m.nome)) || perto[0])?.m || null;
  }

  function porteOsm(r, osm, areaMin) {
    if (!osm || osm.erro) return { porte_shopping: '', porte_base: 'sem resposta do OSM' };
    const m = casarOsm(r, osm.malls);
    if (!m) return { porte_shopping: 'não', porte_base: 'sem polígono shop=mall no OSM' };
    if (m.area_m2 == null) return { porte_shopping: 'não', porte_base: `OSM shop=mall sem polígono (${m.nome || 'sem nome'})` };
    return { porte_shopping: m.area_m2 >= areaMin ? 'sim' : 'não', porte_base: `OSM ${m.area_m2} m² (${m.nome || 'sem nome'})` };
  }

  function porteAbrasce(r, local, lista) {
    if (!lista.length) return { porte_shopping: '', porte_base: 'lista Abrasce não carregada' };
    const cidade = semAcento(local.cidade);
    const s = lista.find((x) => mesmoShopping(r.nome, x.nome) && (!x.cidade || !cidade || semAcento(x.cidade) === cidade));
    return s ? { porte_shopping: 'sim', porte_base: `Abrasce: ${s.nome}${s.cidade ? ` (${s.cidade})` : ''}` } : { porte_shopping: 'não', porte_base: 'fora da lista Abrasce' };
  }

  // Critérios que dependem de cada fonte (para deixar em branco o que falta).
  const precisaOsm = (op) => ['osm', 'ambos', 'qualquer'].includes(op.porte);
  const precisaMaps = (op) => op.porte !== 'osm';

  function criterioPorte(op) {
    const area = `OSM shop=mall com área >= ${op.area_min_m2} m²`;
    const aval = `${op.limiar_aval} avaliações ou mais no Maps`;
    if (op.porte === 'abrasce') return `lista Abrasce (${op.abrasce.length} shoppings${op.abrasce_arquivo ? `, ${op.abrasce_arquivo}` : ''})`;
    if (op.porte === 'avaliacoes') return aval;
    if (op.porte === 'ambos') return `${area} e ${aval}`;
    if (op.porte === 'qualquer') return `${area} ou ${aval}`;
    return area;
  }

  // ---------- OpenStreetMap ----------

  // Distância até a borda da caixa (zero dentro dela).
  function distCaixa(lat, lng, b) {
    return distancia(lat, lng, Math.min(Math.max(lat, b.minlat), b.maxlat), Math.min(Math.max(lng, b.minlon), b.maxlon));
  }

  function consultaOsm(l) {
    const t = `(around:${RAIO_OSM_TRANSPORTE},${l.lat},${l.lng})`;
    const a = `(around:${RAIO_OSM_AREAS},${l.lat},${l.lng})`;
    return '[out:json][timeout:90];(' +
      `nwr${t}[railway~"^(station|halt|tram_stop)$"];nwr${t}[public_transport=station];nwr${t}[amenity=bus_station];` +
      `nwr${t}[highway=bus_stop][name~"BRT|tubo",i];nwr${t}[public_transport=platform][name~"BRT|tubo",i];` +
      `nwr${a}[shop=mall];nwr${a}[leisure=park];nwr${a}[natural=beach];` +
      ');out tags bb;';
  }

  // Ponto de referência do elemento: nó pelas coordenadas; way e relation pelo
  // centro da caixa. Com `out bb` a Overpass não manda `center`: até a versão
  // 2026.10.15-2 o filtro exigia `center` e descartava todo polígono (shoppings
  // sem área, estações mapeadas como área ausentes).
  function centroOsm(e) {
    if (e.center) return { lat: e.center.lat, lng: e.center.lon };
    if (e.lat != null) return { lat: e.lat, lng: e.lon };
    const b = e.bounds;
    return b ? { lat: (b.minlat + b.maxlat) / 2, lng: (b.minlon + b.maxlon) / 2 } : null;
  }

  // Elemento da Overpass reduzido ao que a classificação e a contagem usam
  // (o navegador guarda pouco: só as tags de TAGS_OSM e a caixa dos shoppings).
  function elementoOsm(e, local) {
    const { lat, lng } = centroOsm(e);
    const tags = {};
    for (const k of TAGS_OSM) if (e.tags?.[k]) tags[k] = e.tags[k];
    const b = e.bounds;
    const caixa = b ? { minlat: b.minlat, maxlat: b.maxlat, minlon: b.minlon, maxlon: b.maxlon } : null;
    return {
      osm_id: `${e.type}/${e.id}`,
      nome: e.tags?.name || '',
      tags,
      lat: +lat.toFixed(6),
      lng: +lng.toFixed(6),
      area_m2: caixa ? areaCaixa(caixa) : null,
      distancia_m: caixa ? distCaixa(local.lat, local.lng, caixa) : distancia(local.lat, local.lng, lat, lng),
      ...(tags.shop === 'mall' && caixa ? { caixa } : {}),
    };
  }

  // Um grupo por elemento, pelas próprias tags.
  function classificarOsm(tags, nome) {
    const n = semAcento(nome);
    const operador = semAcento(`${tags.operator || ''} ${tags.network || ''}`);
    if (tags.natural === 'beach' || tags.leisure === 'park') return 'praia_parque';
    if (tags.shop === 'mall') return 'shopping';
    if (/\bfutura\b|em (obras|construcao)|desativad/.test(n)) return 'outro';
    const st = tags.station || '';
    const ferroviaria = /^(station|halt)$/.test(tags.railway || '');
    const estacao = ferroviaria || tags.public_transport === 'station';
    if (tags.ferry === 'yes' && !ferroviaria) return 'outro';
    // Bonde de Santa Teresa: linha turística, não transporte de massa.
    if (/\bbonde\b/.test(operador)) return 'outro';
    // Operador de trem metropolitano vale mais que o tipo (como no Maps).
    if (estacao && /\b(cptm|supervia|trensurb)\b/.test(`${n} ${operador}`) && !/\bmetro\b/.test(operador)) return 'trem';
    if (st === 'subway' || st === 'monorail' || tags.subway === 'yes' || tags.monorail === 'yes') return 'metro';
    if (st === 'light_rail' || st === 'tram' || tags.railway === 'tram_stop' || tags.light_rail === 'yes' || tags.tram === 'yes') return 'vlt_brt';
    if (ferroviaria && (!st || st === 'train')) return 'trem';
    if (estacao && tags.train === 'yes') return 'trem';
    const onibus = tags.amenity === 'bus_station' || tags.highway === 'bus_stop' || tags.bus === 'yes' || /^(station|platform)$/.test(tags.public_transport || '');
    if (onibus && /\bbrt\b|\btubo\b/.test(`${n} ${operador}`)) return 'vlt_brt';
    return 'outro';
  }

  // Mesma feição mapeada como nó e como polígono (ou estação e plataforma):
  // mesmo grupo, nome parecido e até 150 m; sem nome, até 15 m. Mesmo nome e
  // mesma rede (ou rede em branco), até 400 m: plataformas de cada sentido.
  // Fica a maior.
  const mesmaRede = (a, b) => !a.tags?.network || !b.tags?.network || a.tags.network === b.tags.network;
  function marcarDuplicatasOsm(rs) {
    const mantidos = [];
    for (const r of [...rs].sort((a, b) => (b.area_m2 || 0) - (a.area_m2 || 0))) {
      const igual = r.grupo !== 'outro' && mantidos.find((m) => {
        if (m.grupo !== r.grupo) return false;
        const d = distancia(m.lat, m.lng, r.lat, r.lng);
        if (!m.nome || !r.nome) return d <= 15;
        if (TRANSPORTE.includes(r.grupo) && semAcento(m.nome).trim() === semAcento(r.nome).trim() && mesmaRede(m, r)) return d <= DIST_PLATAFORMAS_M;
        return d <= DIST_DUPLICATA_M && nomesParecidos(m.nome, r.nome);
      });
      r.duplicata_de = igual ? igual.nome || igual.osm_id : '';
      if (!igual) mantidos.push(r);
    }
    return rs;
  }

  function linhasOsm(local, entrada) {
    const rs = entrada.elementos.map((e) => {
      const grupo_auto = classificarOsm(e.tags, e.nome);
      const ausente = TRANSPORTE.includes(grupo_auto) && sistemaAusente(grupo_auto, local.cidade);
      // Parada ou plataforma sem nome (ex.: VLT e bonde no Rio): não identifica
      // a estação e costuma repetir a parada nomeada ao lado.
      const semNome = TRANSPORTE.includes(grupo_auto) && !e.nome && /^(stop_position|platform)$/.test(e.tags.public_transport || '');
      const observacao = ausente ? 'sistema sem operação na cidade' : semNome ? 'parada sem nome' : '';
      return {
        origem: chaveLocal(local), origem_place_id: local.place_id, origem_nome: local.nome, ...e,
        tags_osm: Object.entries(e.tags).map(([k, v]) => `${k}=${v}`).join(' '),
        grupo_auto, grupo: observacao ? 'outro' : grupo_auto, observacao,
        area_m2: e.area_m2 ?? '',
      };
    });
    return marcarDuplicatasOsm(rs);
  }

  async function consultarOverpass(url, q) {
    const ctl = new AbortController();
    const relogio = setTimeout(() => ctl.abort(), 60000);
    try {
      const resp = await fetch(`${url}?data=${encodeURIComponent(q)}`, { signal: ctl.signal });
      if (!resp.ok) return { erro: `HTTP ${resp.status}` };
      const j = await resp.json();
      // Tempo esgotado no servidor vem com HTTP 200 e um aviso em "remark".
      if (j.remark && /error|timed out|out of memory/i.test(j.remark)) return { erro: j.remark.slice(0, 120) };
      return { elementos: j.elements || [] };
    } catch (e) {
      return { erro: e.name === 'AbortError' ? 'tempo esgotado' : e.message };
    } finally {
      clearTimeout(relogio);
    }
  }

  // A Overpass principal recusa com frequência (429/504): tenta os espelhos,
  // com pausa crescente, e dá mais duas voltas, com 20 s entre elas.
  async function buscarEntornoOsm(local) {
    const q = consultaOsm(local);
    const erros = [];
    for (let volta = 0; volta < 3; volta++) {
      for (const [i, url] of OVERPASS.entries()) {
        if (volta || i) await esperar(i ? 2000 * i : 20000);
        const r = await consultarOverpass(url, q);
        if (!r.erro) {
          const elementos = r.elementos.filter((e) => centroOsm(e)).map((e) => elementoOsm(e, local));
          return { elementos, consultado_em: agora(), servidor: new URL(url).host, versao_script: VERSAO };
        }
        erros.push(`${new URL(url).host}: ${r.erro}`);
      }
    }
    return { erro: erros.join('; '), consultado_em: agora() };
  }

  // ---------- shoppings: Maps e OSM lado a lado ----------

  // Shoppings do OSM em forma de caixa (nó vira caixa de um ponto, sem área).
  // Sem coleta OSM, usa as caixas que a fila do Maps consultava até 15/10/2026.
  function mallsOsm(local, osmRs, entrada) {
    if (entrada && !entrada.erro) {
      return osmRs.filter((r) => r.grupo === 'shopping' && !r.duplicata_de).map((r) => ({
        id: r.osm_id, nome: r.nome, area_m2: r.area_m2 === '' ? null : r.area_m2, distancia_m: r.distancia_m,
        ...(r.caixa || { minlat: r.lat, maxlat: r.lat, minlon: r.lng, maxlon: r.lng }),
      }));
    }
    if (local?.osm && !local.osm.erro) return local.osm.malls.map((m) => ({ id: `caixa/${m.nome}/${m.minlat}`, ...m, distancia_m: distCaixa(local.lat, local.lng, m) }));
    return null;
  }

  // "e": sim só se as duas são sim; "ou": sim se uma é sim. Desconhecido fica em branco.
  function decidir(vals, modo) {
    if (modo === 'e') return vals.includes('não') ? 'não' : vals.includes('') ? '' : 'sim';
    return vals.includes('sim') ? 'sim' : vals.includes('') ? '' : 'não';
  }

  // Um shopping por linha a até 1000 m: os do Maps casados com o OSM, mais os
  // shop=mall do OSM que o Maps não trouxe. malls null = OSM não coletado.
  function montarShoppings(local, mapsRs, malls, mapsOk, op) {
    const ref = { origem_place_id: local.place_id, origem_nome: local.nome };
    const doMaps = (mapsRs || []).filter((r) => r.grupo === 'shopping' && !r.duplicata_de && !r.fora_da_regiao && r.distancia_m <= RAIO_MAX)
      .sort((a, b) => (+b.n_avaliacoes || 0) - (+a.n_avaliacoes || 0));
    const usados = new Map();
    // Nó do OSM com o mesmo nome de um resultado do Maps fica reservado a ele.
    const reservados = new Map();
    for (const r of malls ? doMaps : []) {
      const m = malls.find((x) => x.area_m2 == null && !reservados.has(x.id) && mesmoShopping(r.nome, x.nome)
        && distancia(r.lat, r.lng, x.minlat, x.minlon) <= 200);
      if (m) reservados.set(m.id, r);
    }
    const linhas = [];
    for (const r of doMaps) {
      const m = malls ? casarOsm(r, malls, usados, reservados) : null;
      const mesmo = m ? usados.get(m.id) || '' : '';
      if (m && !mesmo) usados.set(m.id, r.nome);
      linhas.push({
        ...ref, fonte: m ? 'maps e osm' : 'só maps', nome_maps: r.nome, categoria_maps: r.categoria_maps, n_avaliacoes: r.n_avaliacoes || '0',
        place_id_maps: r.place_id, chave_maps: chave(r), nome_osm: m?.nome || '', osm_id: m?.id || '', area_osm_m2: m?.area_m2 ?? '',
        distancia_m: r.distancia_m, mesmo_poligono_de: mesmo,
        porte_osm: !malls ? '' : m && m.area_m2 != null && m.area_m2 >= op.area_min_m2 ? 'sim' : 'não',
        porte_avaliacoes: +r.n_avaliacoes >= op.limiar_aval ? 'sim' : 'não',
      });
    }
    for (const m of malls || []) {
      if (usados.has(m.id) || m.distancia_m > RAIO_MAX) continue;
      linhas.push({
        ...ref, fonte: 'só osm', nome_maps: '', categoria_maps: '', n_avaliacoes: '', place_id_maps: '', chave_maps: '',
        nome_osm: m.nome, osm_id: m.id, area_osm_m2: m.area_m2 ?? '', distancia_m: m.distancia_m, mesmo_poligono_de: '',
        porte_osm: m.area_m2 != null && m.area_m2 >= op.area_min_m2 ? 'sim' : 'não',
        // O Maps cobriu o raio e não o trouxe como shopping center.
        porte_avaliacoes: mapsOk ? 'não' : '',
      });
    }
    for (const l of linhas) {
      l.porte_abrasce = op.abrasce.length ? porteAbrasce({ nome: l.nome_maps || l.nome_osm }, local, op.abrasce).porte_shopping : '';
      l.porte = op.porte === 'abrasce' ? l.porte_abrasce
        : op.porte === 'avaliacoes' ? l.porte_avaliacoes
          : op.porte === 'ambos' ? decidir([l.porte_osm, l.porte_avaliacoes], 'e')
            : op.porte === 'qualquer' ? decidir([l.porte_osm, l.porte_avaliacoes], 'ou')
              : l.porte_osm;
      const area = l.area_osm_m2 !== '' ? `OSM ${l.area_osm_m2} m²` : l.osm_id ? 'OSM sem polígono' : malls ? 'fora do OSM' : 'OSM não coletado';
      const aval = l.nome_maps ? `${l.n_avaliacoes} avaliações` : mapsOk ? 'fora do Maps' : 'Maps não coletado';
      l.porte_base = `${area} · ${aval}`;
      l.criterio_porte = criterioPorte(op);
    }
    return linhas.sort((a, b) => a.distancia_m - b.distancia_m);
  }

  // Shoppings de porte no raio pelo campo dado; algum em branco deixa o total em branco.
  function contarPorte(shops, campo, raio) {
    const noRaio = shops.filter((s) => !s.mesmo_poligono_de && s.distancia_m <= raio);
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
    const avaliacoes = (notaLinha.match(/\(([\d.\s]+)\)/) || [])[1]?.replace(/\D/g, '') || '';
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
      const avaliacoes = (resumo.match(/\(([\d.\s]+)\)/) || [])[1]?.replace(/\D/g, '') || '';
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

  // Linha de quem está na lista mas ainda não tem coleta nessa fonte.
  function linhaVazia(local, cols, situacao) {
    const linha = Object.fromEntries(cols.map((c) => [c, '']));
    return Object.assign(linha, { place_id: local.place_id, nome: local.nome, cidade: local.cidade || '', lat: local.lat, lng: local.lng, situacao });
  }

  function resumirLocal(local, rs, op, shops = [], osmDisponivel = false) {
    const validos = rs.filter((r) => !r.duplicata_de);
    // Grupo de consulta que falhou ou não foi feita fica em branco (não zero).
    const falhos = new Set([...(local.falhas || []), ...consultasFaltantes(local)].map(grupoDaConsulta));
    const linha = { place_id: local.place_id, nome: local.nome, cidade: local.cidade || '', lat: local.lat, lng: local.lng };
    for (const [grupo, col] of Object.entries(GRUPOS)) {
      const itens = validos.filter((r) => r.grupo === grupo);
      for (const raio of RAIOS_M) linha[`qt_${col}_${raio}m`] = falhos.has(grupo) ? '' : itens.filter((r) => r.distancia_m <= raio).length;
    }
    // Porte: shoppings do Maps e do OSM juntos (CSV de shoppings), um por polígono.
    const semOsm = !osmDisponivel;
    const semMaps = falhos.has('shopping');
    for (const raio of RAIOS_M) {
      linha[`qt_shoppings_porte_${raio}m`] = (precisaOsm(op) && semOsm) || (precisaMaps(op) && semMaps) || (op.porte === 'abrasce' && !op.abrasce.length) ? '' : contarPorte(shops, 'porte', raio);
      linha[`qt_shoppings_porte_osm_${raio}m`] = semOsm ? '' : contarPorte(shops, 'porte_osm', raio);
      linha[`qt_shoppings_porte_aval_${raio}m`] = semMaps ? '' : contarPorte(shops, 'porte_avaliacoes', raio);
    }
    linha.criterio_porte_shopping = criterioPorte(op);
    linha.qt_outros_1000m = validos.filter((r) => r.grupo === 'outro' && r.distancia_m <= RAIO_MAX).length;
    linha.resultados_ate_1000m = validos.filter((r) => r.distancia_m <= RAIO_MAX).length;
    // Distâncias só com resultados da região (o Maps completa listas com outras cidades).
    const daRegiao = validos.filter((r) => !r.fora_da_regiao);
    for (const [grupo, col] of Object.entries(GRUPOS)) {
      const d = daRegiao.filter((r) => r.grupo === grupo).map((r) => r.distancia_m);
      linha[`dist_${col}_mais_proxima_lida_m`] = d.length && !falhos.has(grupo) ? Math.min(...d) : '';
    }
    // Estação mais próxima de qualquer sistema; em branco se algum não foi medido.
    const estacao = TRANSPORTE.some((g) => falhos.has(g)) ? null
      : daRegiao.filter((r) => TRANSPORTE.includes(r.grupo)).sort((a, b) => a.distancia_m - b.distancia_m)[0];
    linha.dist_estacao_mais_proxima_lida_m = estacao ? estacao.distancia_m : '';
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
    // Porte sem OSM não refaz a coleta do Maps: resolve-se com a coleta do OSM.
    const semPorte = linha.qt_shoppings_porte_1000m === '' && !semMaps ? [precisaOsm(op) && semOsm ? 'porte sem OSM' : 'porte em branco'] : [];
    linha.situacao = [...problemas(local), ...semPorte].join('; ') || 'ok';
    linha.coletado_em = local.coletado_em;
    linha.versao_script = local.versao_script || '';
    return linha;
  }

  function resumirOsm(local, entrada, rs, op) {
    if (!entrada || entrada.erro) return linhaVazia(local, colsOsm(), entrada ? `erro no OSM: ${entrada.erro}`.slice(0, 200) : 'não coletado no OSM');
    const linha = { place_id: local.place_id, nome: local.nome, cidade: local.cidade || '', lat: local.lat, lng: local.lng };
    const validos = rs.filter((r) => !r.duplicata_de);
    const ate = (raio) => validos.filter((r) => r.distancia_m <= raio);
    for (const [grupo, col] of Object.entries(GRUPOS_OSM)) for (const raio of RAIOS_M) linha[`qt_${col}_${raio}m`] = ate(raio).filter((r) => r.grupo === grupo).length;
    for (const raio of RAIOS_M) linha[`qt_shoppings_area_min_${raio}m`] = ate(raio).filter((r) => r.grupo === 'shopping' && r.area_m2 !== '' && r.area_m2 >= op.area_min_m2).length;
    linha.area_min_shopping_m2 = op.area_min_m2;
    linha.qt_outros_1000m = ate(RAIO_MAX).filter((r) => r.grupo === 'outro').length;
    linha.elementos_ate_1000m = ate(RAIO_MAX).length;
    // Estações a até RAIO_OSM_TRANSPORTE: em branco, nenhuma nessa distância.
    for (const g of TRANSPORTE) {
      const d = validos.filter((r) => r.grupo === g).map((r) => r.distancia_m);
      linha[`dist_${GRUPOS[g]}_mais_proxima_m`] = d.length ? Math.min(...d) : '';
    }
    const estacao = validos.filter((r) => TRANSPORTE.includes(r.grupo)).sort((a, b) => a.distancia_m - b.distancia_m)[0];
    linha.dist_estacao_mais_proxima_m = estacao ? estacao.distancia_m : '';
    linha.estacao_mais_proxima = estacao ? estacao.nome || estacao.osm_id : '';
    linha.tipo_estacao_mais_proxima = estacao ? estacao.grupo : '';
    linha.sistemas_sem_operacao = TRANSPORTE.filter((g) => sistemaAusente(g, local.cidade)).join(' | ');
    linha.duplicatas_fundidas = rs.filter((r) => r.duplicata_de).length;
    linha.elementos_lidos = rs.length;
    linha.consultado_em = entrada.consultado_em;
    linha.versao_script = entrada.versao_script || '';
    linha.situacao = 'ok';
    return linha;
  }

  // Estabelecimentos de várias fontes, cada um uma vez.
  function uniaoLocais(...listas) {
    const vistos = new Map();
    for (const l of listas.flat()) {
      const k = chaveLocal(l);
      if (!vistos.has(k)) vistos.set(k, { place_id: l.place_id, nome: l.nome, cidade: l.cidade || '', lat: l.lat, lng: l.lng });
    }
    return [...vistos.values()];
  }

  // Sem lista, sai tudo o que está guardado (Maps e OSM); com lista, uma linha
  // por estabelecimento da lista em cada resumo, coletado ou não.
  function montarSaida(dados, revisoes, op, osmDados = {}, lista = null) {
    const universo = lista?.length ? uniaoLocais(lista) : uniaoLocais(dados.locais, Object.values(osmDados));
    const doMaps = new Map(dados.locais.map((l) => [l.chave, l]));
    const saida = { universo, resumo: [], resultados: [], osmResumo: [], osmResultados: [], shoppings: [] };
    for (const alvo of universo) {
      const k = chaveLocal(alvo);
      const local = doMaps.get(k);
      const entrada = osmDados[k];
      const base = { ...alvo, cidade: alvo.cidade || local?.cidade || entrada?.cidade || '' };
      let rs = null;
      if (local) {
        rs = dados.resultados.filter((r) => r.origem === k).map((r) => {
          const rev = revisoes[chave(r)];
          const grupo_auto = classificar(r.nome, r.categoria_maps);
          return { ...r, grupo_auto, grupo: rev || grupo_auto, revisado: rev ? 'sim' : '', fora_da_regiao: r.distancia_m > DIST_REGIAO_M ? 'sim' : '' };
        });
        marcarDuplicatas(rs);
      }
      const osmRs = entrada?.elementos ? linhasOsm(base, entrada) : [];
      const malls = mallsOsm(local, osmRs, entrada);
      const mapsOk = !!local && ![...(local.falhas || []), ...consultasFaltantes(local)].some((c) => grupoDaConsulta(c) === 'shopping');
      const shops = montarShoppings(base, rs, malls, mapsOk, op);
      if (rs) {
        const porChave = new Map(shops.filter((s) => s.chave_maps).map((s) => [s.chave_maps, s]));
        for (const r of rs) {
          const s = r.grupo === 'shopping' ? porChave.get(chave(r)) : null;
          r.porte_shopping = s ? s.porte : '';
          r.porte_base = s ? s.porte_base : '';
        }
        saida.resultados.push(...rs);
        saida.resumo.push(resumirLocal(local, rs, op, shops, !!malls));
      } else {
        saida.resumo.push(linhaVazia(base, colsResumo(), 'não coletado no Maps'));
      }
      saida.osmResultados.push(...osmRs);
      saida.osmResumo.push(resumirOsm(base, entrada, osmRs, op));
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

  // Lista de shoppings (Abrasce): coluna nome (ou shopping) e, se houver, cidade.
  function lerListaShoppings(texto) {
    const { cab, linhas } = lerTabela(texto);
    if (!linhas.length) return [];
    let iNome = cab.findIndex((c) => /^(nome|shopping|nome_shopping|empreendimento)$/.test(c));
    const iCidade = cab.findIndex((c) => /^(cidade|municipio)$/.test(c));
    const temCab = iNome >= 0;
    if (!temCab) iNome = 0;
    return (temCab ? linhas.slice(1) : linhas)
      .map((c) => ({ nome: c[iNome] || '', cidade: iCidade >= 0 ? c[iCidade] || '' : '' }))
      .filter((s) => s.nome);
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
      if (!parar) { tocar('fim'); exportar({ fontes: ['maps'], locais: fila.locais }); }
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

  // ---------- coleta no OSM (sem trocar de página) ----------

  const osmExec = { rodando: false, parar: false };
  const lerOsm = () => ler(CHAVE_OSM, {}) || {};
  const osmOk = (e) => !!e && !e.erro && Array.isArray(e.elementos);

  async function coletarOsm(locais) {
    if (osmExec.rodando || !locais.length) return;
    if (ler(CHAVE_FILA, null)?.ativa) { status('Espere a fila do Maps acabar: ela troca de página e interromperia o OSM.'); return; }
    Object.assign(osmExec, { rodando: true, parar: false });
    atualizarPainel();
    const feitos = [];
    let falharam = locais;
    try {
      // Segunda passada, depois de 1 min, só para os que a Overpass recusou.
      for (let passada = 1; passada <= 2 && falharam.length && !osmExec.parar; passada++) {
        if (passada > 1) { status(`OSM: ${falharam.length} com erro; nova tentativa em 1 min…`); await esperar(60000); }
        const fila = falharam;
        falharam = [];
        for (const [i, l] of fila.entries()) {
          if (osmExec.parar) break;
          status(`OSM ${passada > 1 ? '(2ª passada) ' : ''}${i + 1}/${fila.length}: ${l.nome}…`);
          const r = await buscarEntornoOsm(l);
          const base = lerOsm();
          base[chaveLocal(l)] = { place_id: l.place_id, nome: l.nome, cidade: l.cidade || '', lat: l.lat, lng: l.lng, ...r };
          if (!gravar(CHAVE_OSM, base)) { osmExec.parar = true; break; }
          if (r.erro) falharam.push(l); else feitos.push(l);
          atualizarPainel();
          await esperar(PAUSA_OSM);
        }
      }
    } finally {
      osmExec.rodando = false;
    }
    atualizarPainel();
    status(`OSM: ${feitos.length} de ${locais.length} coletados${osmExec.parar ? ' (interrompido)' : ''}` +
      `${falharam.length ? `; ${falharam.length} com erro da Overpass: clique de novo em "Coletar no OSM" para tentar só esses` : ''}.`);
    if (feitos.length) { tocar('fim'); exportar({ fontes: ['osm', 'shoppings'], locais: feitos }); }
  }

  // ---------- exportação ----------

  const COLS_RESULTADOS = ['origem_place_id', 'origem_nome', 'nome', 'categoria_maps', 'grupo_auto', 'grupo', 'revisado', 'duplicata_de', 'fora_da_regiao', 'distancia_m', 'n_avaliacoes', 'porte_shopping', 'porte_base', 'lat', 'lng', 'place_id', 'id_maps', 'consultas', 'coletado_em'];
  const COLS_OSM_RESULTADOS = ['origem_place_id', 'origem_nome', 'nome', 'osm_id', 'tags_osm', 'grupo_auto', 'grupo', 'observacao', 'duplicata_de', 'distancia_m', 'area_m2', 'lat', 'lng'];
  const COLS_SHOPPINGS = ['origem_place_id', 'origem_nome', 'fonte', 'nome_maps', 'categoria_maps', 'n_avaliacoes', 'place_id_maps', 'nome_osm', 'osm_id', 'area_osm_m2', 'distancia_m', 'mesmo_poligono_de', 'porte_osm', 'porte_avaliacoes', 'porte_abrasce', 'porte', 'criterio_porte', 'porte_base'];

  function colsResumo() {
    const cols = ['place_id', 'nome', 'cidade', 'lat', 'lng'];
    for (const col of Object.values(GRUPOS)) for (const raio of RAIOS_M) cols.push(`qt_${col}_${raio}m`);
    for (const tipo of ['', 'osm_', 'aval_']) for (const raio of RAIOS_M) cols.push(`qt_shoppings_porte_${tipo}${raio}m`);
    cols.push('criterio_porte_shopping', 'qt_outros_1000m', 'resultados_ate_1000m');
    for (const col of Object.values(GRUPOS)) cols.push(`dist_${col}_mais_proxima_lida_m`);
    cols.push('dist_estacao_mais_proxima_lida_m', 'estacao_mais_proxima', 'tipo_estacao_mais_proxima');
    return [...cols, 'duplicatas_fundidas', 'revisoes_manuais', 'buscas', 'cobertura_min_m', 'consultas_subdivididas', 'consultas_falhas', 'consultas_nao_feitas', 'consultas_dispensadas', 'consultas_cobertura_insuficiente', 'consultas_censura', 'situacao', 'coletado_em', 'versao_script'];
  }

  function colsOsm() {
    const cols = ['place_id', 'nome', 'cidade', 'lat', 'lng'];
    for (const col of Object.values(GRUPOS_OSM)) for (const raio of RAIOS_M) cols.push(`qt_${col}_${raio}m`);
    for (const raio of RAIOS_M) cols.push(`qt_shoppings_area_min_${raio}m`);
    cols.push('area_min_shopping_m2', 'qt_outros_1000m', 'elementos_ate_1000m');
    for (const g of TRANSPORTE) cols.push(`dist_${GRUPOS[g]}_mais_proxima_m`);
    return [...cols, 'dist_estacao_mais_proxima_m', 'estacao_mais_proxima', 'tipo_estacao_mais_proxima', 'sistemas_sem_operacao', 'duplicatas_fundidas', 'elementos_lidos', 'consultado_em', 'situacao', 'versao_script'];
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
    return { resumo: nome('resumo'), resultados: nome('resultados'), osm_resumo: nome('osm_resumo'), osm_resultados: nome('osm_resultados'), shoppings: nome('shoppings') };
  }

  // Sem "locais", exporta a lista guardada (ou, sem lista, tudo o que está guardado).
  function exportar({ fontes = ['maps', 'osm', 'shoppings'], locais = null, sufixo = '' } = {}) {
    const saida = montarSaida(lerDados(), ler(CHAVE_REVISOES, {}), lerOpcoes(), lerOsm(), locais || listaAtual().locais);
    if (!saida.universo.length) { status('Nada para exportar.'); return; }
    const nomes = nomesArquivos(saida.universo, dataLocal(new Date()), sufixo);
    const arquivos = [];
    if (fontes.includes('maps')) arquivos.push([csv(saida.resumo, colsResumo()), nomes.resumo], [csv(saida.resultados, COLS_RESULTADOS), nomes.resultados]);
    if (fontes.includes('osm')) arquivos.push([csv(saida.osmResumo, colsOsm()), nomes.osm_resumo], [csv(saida.osmResultados, COLS_OSM_RESULTADOS), nomes.osm_resultados]);
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

  // O que falta em cada fonte, para os estabelecimentos da lista (ou de tudo o que está guardado).
  function situacaoGeral() {
    const dados = lerDados();
    const osm = lerOsm();
    const lista = listaAtual();
    const base = lista.locais.length ? lista.locais : uniaoLocais(dados.locais, Object.values(osm));
    const noMaps = new Set(dados.locais.map((l) => l.chave));
    const naBase = new Set(base.map(chaveLocal));
    return {
      lista, base, dados,
      mapsFeitos: base.filter((l) => noMaps.has(chaveLocal(l))).length,
      mapsFaltam: base.filter((l) => !noMaps.has(chaveLocal(l))),
      mapsPend: dados.locais.filter((l) => naBase.has(l.chave) && problemas(l).length),
      osmFeitos: base.filter((l) => osmOk(osm[chaveLocal(l)])).length,
      osmFaltam: base.filter((l) => !osmOk(osm[chaveLocal(l)])),
      osmErros: base.filter((l) => osm[chaveLocal(l)]?.erro).length,
      foraDaLista: lista.locais.length ? uniaoLocais(dados.locais, Object.values(osm)).filter((l) => !naBase.has(chaveLocal(l))).length : 0,
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

  function desenharPorte() {
    const op = lerOpcoes();
    el.porteSel.value = op.porte;
    el.areaMin.value = op.area_min_m2;
    el.limiar.value = op.limiar_aval;
    el.parcial.checked = op.parcial;
    el.abrasceInfo.textContent = op.abrasce.length ? `${op.abrasce.length} shoppings carregados${op.abrasce_arquivo ? ` (${op.abrasce_arquivo})` : ''}.` : 'Nenhuma lista carregada.';
    el.porteBlocos.area.hidden = !['osm', 'ambos', 'qualquer'].includes(op.porte);
    el.porteBlocos.aval.hidden = !['avaliacoes', 'ambos', 'qualquer'].includes(op.porte);
    el.porteBlocos.abrasce.hidden = op.porte !== 'abrasce';
  }

  const plural = (n, um, varios) => `${n} ${n === 1 ? um : varios}`;

  function atualizarPainel() {
    if (!el.resumo) return;
    const s = situacaoGeral();
    const fila = ler(CHAVE_FILA, null);
    const ocupado = !!fila?.ativa || osmExec.rodando;
    const n = s.base.length;
    el.resumo.textContent = s.lista.locais.length
      ? `Lista: ${plural(n, 'estabelecimento', 'estabelecimentos')}${s.lista.arquivo ? ` (${s.lista.arquivo})` : ''}.`
      : `Sem lista: o painel usa os ${n} estabelecimentos guardados. Carregue a lista em 1.`;
    el.listaInfo.textContent = s.foraDaLista ? `${plural(s.foraDaLista, 'estabelecimento guardado está', 'estabelecimentos guardados estão')} fora da lista: ficam guardados, mas não entram na coleta nem na exportação.` : '';
    el.mapsInfo.textContent = `${s.mapsFeitos} de ${n} coletados; ${s.mapsFaltam.length} faltam; ${plural(s.mapsPend.length, 'pendente', 'pendentes')} (falha, cobertura, censura ou busca nova).` +
      (fila?.ativa ? ` Fila: ${fila.pos + 1}/${fila.locais.length}, busca ${fila.tarefa + 1}/${fila.tarefas.length}${fila.pausada ? ' (pausada)' : ''}.` : '');
    el.mapsColetar.textContent = s.mapsFaltam.length ? `Coletar no Maps ${s.mapsFaltam.length === 1 ? 'o que falta' : `os ${s.mapsFaltam.length} que faltam`}` : 'Maps: nada falta';
    el.mapsColetar.disabled = !s.mapsFaltam.length || ocupado;
    el.mapsPend.textContent = `Refazer ${plural(s.mapsPend.length, 'pendente', 'pendentes')} no Maps`;
    el.mapsPend.disabled = !s.mapsPend.length || ocupado;
    el.este.disabled = ocupado;
    el.parar.disabled = !fila?.ativa;
    el.retomar.hidden = !(fila?.ativa && fila.pausada);
    el.osmInfo.textContent = `${s.osmFeitos} de ${n} coletados; ${s.osmFaltam.length} faltam${s.osmErros ? ` (${s.osmErros} com erro da Overpass)` : ''}.`;
    el.osmColetar.textContent = s.osmFaltam.length ? `Coletar no OSM ${s.osmFaltam.length === 1 ? 'o que falta' : `os ${s.osmFaltam.length} que faltam`}` : 'OSM: nada falta';
    el.osmColetar.disabled = !s.osmFaltam.length || ocupado;
    el.osmRefazer.textContent = `Refazer OSM de todos (${n})`;
    el.osmRefazer.disabled = !n || ocupado;
    el.osmParar.disabled = !osmExec.rodando;
    el.exportar.textContent = `Exportar 5 CSVs (${plural(n, 'estabelecimento', 'estabelecimentos')})`;
    el.exportar.disabled = !n;
    desenharPorte();
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
    desenharPorte();
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

    // 3. OpenStreetMap
    el.osmInfo = dica('');
    el.osmColetar = botao('Coletar no OSM', () => coletarOsm(situacaoGeral().osmFaltam), true);
    el.osmRefazer = botao('Refazer OSM de todos', () => {
      const s = situacaoGeral();
      if (confirm(`Consultar de novo a Overpass para os ${s.base.length} estabelecimentos? O OSM de cada um é substituído quando a nova consulta chega.`)) coletarOsm(s.base);
    });
    el.osmParar = botao('Parar', () => { osmExec.parar = true; status('O OSM para depois do estabelecimento atual.'); });

    // 4. Exportar
    el.exportar = botao('Exportar 5 CSVs', () => exportar(), true);

    // Shopping de porte: critério aplicado na exportação.
    el.porteSel = criar('select', { onchange: () => mudarOpcao('porte', el.porteSel.value) }, [
      criar('option', { value: 'osm', textContent: 'Área no OSM' }),
      criar('option', { value: 'avaliacoes', textContent: 'Avaliações no Maps' }),
      criar('option', { value: 'ambos', textContent: 'Área no OSM E avaliações no Maps' }),
      criar('option', { value: 'qualquer', textContent: 'Área no OSM OU avaliações no Maps' }),
      criar('option', { value: 'abrasce', textContent: 'Lista da Abrasce' }),
    ]);
    el.areaMin = criar('input', { type: 'number', min: 0, step: 500, onchange: () => mudarOpcao('area_min_m2', +el.areaMin.value || 0) });
    el.limiar = criar('input', { type: 'number', min: 0, step: 100, onchange: () => mudarOpcao('limiar_aval', +el.limiar.value || 0) });
    el.abrasceInfo = criar('span', { className: 'dica' });
    const arqAbrasce = arquivoTexto((texto, nome) => {
      const lista = lerListaShoppings(texto);
      gravar(CHAVE_OPCOES, { ...lerOpcoes(), abrasce: lista, abrasce_arquivo: nome });
      status(`${lista.length} shoppings lidos de ${nome}.`);
      desenharPorte();
    });
    el.porteBlocos = {
      area: linha([criar('span', { textContent: 'Área mínima no OSM (m²)' }), el.areaMin]),
      aval: linha([criar('span', { textContent: 'Mínimo de avaliações no Maps' }), el.limiar]),
      abrasce: criar('div', {}, [linha([botao('Carregar lista (CSV: nome, cidade)', () => arqAbrasce.click())]), el.abrasceInfo]),
    };
    const porteDet = criar('details', {}, [
      criar('summary', { textContent: 'Shopping de porte (critério)' }),
      dica('Não coleta nada. O CSV de shoppings traz sempre as duas medidas de cada shopping (área no OSM e avaliações no Maps); aqui se escolhe só qual regra preenche qt_shoppings_porte nos resumos.'),
      linha([el.porteSel]),
      ...Object.values(el.porteBlocos),
      arqAbrasce,
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
        botao('Apagar coleta do OSM', () => { if (confirm('Apagar o que foi coletado no OSM? Exporte antes.')) { gravar(CHAVE_OSM, {}); atualizarPainel(); } }),
      ]),
    ]);

    const sinal = criar('span', { textContent: '–' });
    const cabecalho = criar('header', { title: 'Arraste para mover; duplo clique volta ao canto' }, [criar('span', { textContent: 'Entorno: estações, shoppings e parques' }), sinal]);
    const painel = criar('div', { id: 'painel' }, [
      cabecalho,
      el.resumo,
      secao('1. Lista de estabelecimentos', [
        dica('A população do trabalho: B1_entorno_maps_fila.csv (gerado por B1-b_entorno_maps_fila.py). As coletas abaixo trabalham sobre ela.'),
        linha([bArquivo, bEsquecer]), el.fila, el.listaInfo,
      ]),
      secao('2. Google Maps', [
        dica('Abre as buscas no Maps, cerca de 1 min por estabelecimento. Só busca quem ainda não tem Maps; os já coletados não são tocados.'),
        el.mapsInfo,
        linha([el.mapsColetar]), linha([el.mapsPend, el.este]), linha([el.parar, el.retomar]),
        criar('label', { className: 'linha dica' }, [el.parcial, criar('span', { textContent: `Baixar CSV parcial a cada ${PARCIAL_A_CADA} estabelecimentos` })]),
      ]),
      secao('3. OpenStreetMap', [
        dica('Uma consulta à Overpass por estabelecimento, sem sair da página: estações de metrô, trem, VLT e BRT, shoppings com área, praias e parques. Pode rodar antes ou depois do Maps, mas não durante.'),
        el.osmInfo,
        linha([el.osmColetar]), linha([el.osmRefazer, el.osmParar]),
      ]),
      secao('4. Exportar', [
        dica('Resumo e resultados do Maps, resumo e resultados do OSM e a tabela de shoppings (área e avaliações lado a lado). Uma linha por estabelecimento da lista nos resumos, coletado ou não.'),
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
