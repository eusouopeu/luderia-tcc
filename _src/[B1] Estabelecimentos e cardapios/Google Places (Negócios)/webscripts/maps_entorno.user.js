// ==UserScript==
// @name         Entorno no Google Maps (TCC Luderia)
// @namespace    tcc-luderia
// @version      2026.10.13-2
// @description  Conta estações de metrô, estações de VLT/BRT e shoppings a 500 m e 1000 m de cada estabelecimento, buscando no Google Maps em volta da coordenada; coleta uma fila e exporta CSV.
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
 * RODE NUMA JANELA PRÓPRIA, não numa aba em segundo plano: o navegador
 * desacelera os temporizadores de abas escondidas e a fila se arrasta. A
 * janela pode ficar atrás de outras; só não pode ser uma aba não selecionada.
 *
 * Para cada estabelecimento da fila (place_id, nome, lat, lng; cidade
 * opcional), o script faz buscas do Maps em volta da coordenada, lê todos os
 * resultados (nome, categoria, coordenada, avaliações), calcula a distância
 * em linha reta (haversine) e conta os que caem a até 500 m e 1000 m.
 *
 * Buscas: "estação de metrô", "estação BRT", "estação VLT", "shopping center".
 * Cada resultado vai para UM grupo pela própria categoria e nome no Maps
 * (classificar), nunca pela busca que o trouxe; repetido entre buscas conta
 * uma vez. Grupos: metro, vlt_brt, shopping, outro (ver classificar).
 *
 * Área coberta. A busca do Maps olha a parte visível do mapa. O ponto "@" da
 * URL é o centro da JANELA, e o painel lateral do Maps (cerca de 410 px)
 * esconde o lado esquerdo. Por isso o script desloca o centro para que o
 * estabelecimento fique no meio do mapa visível e escolhe o maior zoom em que
 * o mapa visível cobre o raio de 1000 m (com 10% de folga). Ao chegar, mede
 * a cobertura real; se não alcança o raio, refaz com zoom menor.
 *
 * Falhas. Página que não carrega em 20 s é tentada de novo até 2 vezes;
 * depois a busca sai como falha e os grupos que ela alimenta ficam em branco
 * no resumo (nunca zero). Tela de "tráfego incomum" pausa a fila com alarme;
 * resolvida a verificação, a fila segue sozinha.
 *
 * Censura. A lista do Maps tem teto (10 sem login, 20 por página com login)
 * e não vem em ordem de distância. Lista lotada sem a marca de fim é refeita
 * em quatro quadrantes de 500 m; quadrante lotado marca censura possível.
 *
 * Duplicatas. O Maps às vezes cadastra a mesma estação duas vezes (um lado e
 * outro do BRT, "Estação X" e "X - Linha 2"). Resultados do mesmo grupo a até
 * 150 m e com nome parecido contam uma vez (fica o de mais avaliações); a
 * duplicata segue no CSV de resultados, com duplicata_de preenchido.
 *
 * Revisão. Painel "Revisar classificação": resultados do grupo "outro" a até
 * 1000 m com cara de estação, terminal ou shopping, para reclassificar com um
 * clique. A revisão vale para o resultado em todos os estabelecimentos.
 *
 * Shopping de porte. O Maps dá a categoria "Shopping center" também a galerias
 * e prédios comerciais. Critério escolhido no painel, aplicado na exportação:
 *   - OpenStreetMap: shop=mall com área da bounding box >= 5.000 m², o mesmo
 *     corte do B1-c_entorno_osm.py (consulta à Overpass, uma por
 *     estabelecimento com shopping no raio);
 *   - Abrasce: nome na lista de shoppings associados, carregada no painel
 *     como CSV (colunas nome e, se houver, cidade);
 *   - avaliações: número mínimo de avaliações no Maps (proxy sem fonte).
 *
 * Uso: "Carregar CSV" (o B1_entorno.csv serve) ou cole linhas
 * "place_id;nome;lat;lng"; "Coletar fila". "Refazer pendentes" recoleta os
 * estabelecimentos com falha, cobertura insuficiente ou censura possível.
 * A cada 10 estabelecimentos, os CSVs parciais são baixados (opção no painel).
 *
 * CSVs (";" e UTF-8 com BOM):
 *  - maps_entorno_resumo_AAAA-MM-DD.csv: um estabelecimento por linha. As
 *    colunas qt_*_500m estão contidas em qt_*_1000m (raios aninhados). A 1000 m,
 *    metro + vlt_brt + shoppings + outros = resultados_ate_1000m.
 *  - maps_entorno_resultados_AAAA-MM-DD.csv: um resultado por linha.
 *
 * Implementação futura (pedido do autor em 13/10/2026):
 *  - B1-b_entorno_maps.py, no molde do B2-b_avaliacoes.py: move os
 *    CSVs de ~/Downloads para dados/[B1] Estabelecimentos e cardapios/_dados-brutos/, confere as somas (metro + vlt_brt +
 *    shoppings + outros = resultados_ate_1000m), compara o metrô com o
 *    B1_entorno.csv do OSM e gera a fila dos pendentes na área de
 *    transferência.
 *  - Ler a resposta da busca (pedido "search?tbm=map") interceptando fetch/XHR
 *    em vez dos cartões na tela: sem rolagem, menos frágil a mudanças de
 *    visual e até 20 resultados por busca. Exige mapear o JSON do Maps.
 */

(function () {
  'use strict';

  const CHAVE_DADOS = 'tcc-entorno-dados-v2';
  const CHAVE_FILA = 'tcc-entorno-fila-v2';
  const CHAVE_REVISOES = 'tcc-entorno-revisoes';
  const CHAVE_OPCOES = 'tcc-entorno-opcoes';
  const CHAVE_PAINEL_MAPS = 'tcc-entorno-largura-painel-maps';
  const CHAVE_POSICAO = 'tcc-entorno-posicao';

  const RAIOS_M = [500, 1000];
  const RAIO_MAX = 1000;
  const FOLGA = 1.1;
  const ZOOM_MAX = 17;
  const ZOOM_MIN = 11;
  const PAINEL_MAPS_PADRAO_PX = 480;
  const TENTATIVAS = 2;
  const DIST_DUPLICATA_M = 150;
  const PARCIAL_A_CADA = 10;
  const PAUSA_ENTRE_BUSCAS = [3000, 6000];
  const CONSULTAS = [
    { consulta: 'estação de metrô', grupo: 'metro' },
    { consulta: 'estação BRT', grupo: 'vlt_brt' },
    { consulta: 'estação VLT', grupo: 'vlt_brt' },
    { consulta: 'shopping center', grupo: 'shopping' },
  ];
  const GRUPOS = { metro: 'estacoes_metro', vlt_brt: 'estacoes_vlt_brt', shopping: 'shoppings' };
  const OPCOES_PADRAO = { porte: 'osm', area_min_m2: 5000, limiar_aval: 1000, abrasce: [], abrasce_arquivo: '', parcial: true };

  // ---------- utilidades ----------

  const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
  const sortear = ([a, b]) => a + Math.random() * (b - a);
  const semAcento = (t) => String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const juntar = (lista) => [...new Set(lista)].join(' | ');

  function agora() {
    const d = new Date();
    const p = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
  }

  function ler(chave, padrao) {
    try { return JSON.parse(localStorage.getItem(chave)) ?? padrao; } catch (_) { return padrao; }
  }

  function gravar(chave, valor) {
    try { localStorage.setItem(chave, JSON.stringify(valor)); } catch (e) { status(`Não consegui gravar no navegador: ${e.message}`); }
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

  // Distância do alvo até a borda mais próxima do mapa visível, em metros.
  function coberturaReal(alvoLat, alvoLng, busca, jan) {
    const mpp = mPorPx(alvoLat, busca.zoom);
    const leste = (alvoLng - busca.lng) * 111320 * Math.cos((alvoLat * Math.PI) / 180);
    const norte = (alvoLat - busca.lat) * 111320;
    const x = jan.w / 2 + leste / mpp;
    const y = jan.h / 2 - norte / mpp;
    return Math.round(Math.max(0, Math.min(x - jan.painel, jan.w - x, y, jan.h - y)) * mpp);
  }

  // ---------- classificação: um grupo por resultado, pelo próprio atributo ----------

  function classificar(nome, categoria) {
    const n = semAcento(nome);
    const c = semAcento(categoria).trim();
    if (/^(shopping|shopping center|shopping mall|outlet)$/.test(c)) return 'shopping';
    if (/\bmetro\b|subway/.test(c)) return 'metro';
    const transporte = /transporte|estacao|parada|ponto|terminal|onibus|trem|bonde/.test(c);
    if (/\b(brt|vlt)\b|veiculo leve|light rail|bonde|tram\b/.test(c)) return 'vlt_brt';
    if (/\b(brt|vlt)\b/.test(n) && transporte) return 'vlt_brt';
    if (/\bmetro\b/.test(n) && /estacao|transporte/.test(c)) return 'metro';
    return 'outro';
  }

  // "Outro" com cara de estação ou shopping: vai para a revisão manual.
  function suspeito(r) {
    return r.grupo_auto === 'outro' && r.distancia_m <= RAIO_MAX &&
      /estac|terminal|metro|\bbrt\b|\bvlt\b|\btrem\b|bonde|shopping|\bmall\b/.test(semAcento(`${r.nome} ${r.categoria_maps}`));
  }

  // ---------- duplicatas ----------

  const PALAVRAS_GENERICAS = new Set(['estacao', 'estacoes', 'metro', 'brt', 'vlt', 'shopping', 'center', 'mall', 'de', 'da', 'do', 'das', 'dos', 'e', 'linha', 'sentido', 'plataforma', 'terminal', 'parada', 'ponto', 'station']);

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

  function porteOsm(r, osm, areaMin) {
    if (!osm || osm.erro) return { porte_shopping: '', porte_base: 'sem resposta do OSM' };
    const folga = 60 / 111320;
    const dentro = osm.malls.filter((m) => r.lat >= m.minlat - folga && r.lat <= m.maxlat + folga && r.lng >= m.minlon - folga && r.lng <= m.maxlon + folga);
    const perto = osm.malls
      .map((m) => ({ m, d: distancia(r.lat, r.lng, (m.minlat + m.maxlat) / 2, (m.minlon + m.maxlon) / 2) }))
      .filter((x) => x.d <= 200).sort((a, b) => a.d - b.d).map((x) => x.m);
    const m = [...dentro].sort((a, b) => b.area_m2 - a.area_m2)[0] || perto[0];
    if (!m) return { porte_shopping: 'não', porte_base: 'sem polígono shop=mall no OSM' };
    return { porte_shopping: m.area_m2 >= areaMin ? 'sim' : 'não', porte_base: `OSM ${m.area_m2} m² (${m.nome || 'sem nome'})` };
  }

  function porteAbrasce(r, local, lista) {
    if (!lista.length) return { porte_shopping: '', porte_base: 'lista Abrasce não carregada' };
    const cidade = semAcento(local.cidade);
    const s = lista.find((x) => mesmoShopping(r.nome, x.nome) && (!x.cidade || !cidade || semAcento(x.cidade) === cidade));
    return s ? { porte_shopping: 'sim', porte_base: `Abrasce: ${s.nome}${s.cidade ? ` (${s.cidade})` : ''}` } : { porte_shopping: 'não', porte_base: 'fora da lista Abrasce' };
  }

  function porte(r, local, op) {
    if (op.porte === 'abrasce') return porteAbrasce(r, local, op.abrasce);
    if (op.porte === 'avaliacoes') return { porte_shopping: +r.n_avaliacoes >= op.limiar_aval ? 'sim' : 'não', porte_base: `${r.n_avaliacoes || 0} avaliações` };
    return porteOsm(r, local.osm, op.area_min_m2);
  }

  function criterioPorte(op) {
    if (op.porte === 'abrasce') return `lista Abrasce (${op.abrasce.length} shoppings${op.abrasce_arquivo ? `, ${op.abrasce_arquivo}` : ''})`;
    if (op.porte === 'avaliacoes') return `${op.limiar_aval} avaliações ou mais no Maps`;
    return `OSM shop=mall com área >= ${op.area_min_m2} m²`;
  }

  async function buscarOsm(local) {
    const raio = RAIO_MAX + 200;
    const q = `[out:json][timeout:25];(way["shop"="mall"](around:${raio},${local.lat},${local.lng});relation["shop"="mall"](around:${raio},${local.lat},${local.lng}););out tags bb;`;
    const ctl = new AbortController();
    const relogio = setTimeout(() => ctl.abort(), 40000);
    try {
      const resp = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(q)}`, { signal: ctl.signal });
      if (!resp.ok) return { erro: `HTTP ${resp.status}` };
      const j = await resp.json();
      const malls = (j.elements || []).filter((e) => e.bounds).map((e) => ({ nome: e.tags?.name || '', ...e.bounds, area_m2: areaCaixa(e.bounds) }));
      return { malls, consultado_em: agora() };
    } catch (e) {
      return { erro: e.name === 'AbortError' ? 'tempo esgotado' : e.message };
    } finally {
      clearTimeout(relogio);
    }
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
    const linhaCat = linhas.find((l) => l.includes('·')) || '';
    const categoria = linhaCat.split('·')[0].trim();
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

  function tarefasIniciais() {
    return CONSULTAS.map((c) => ({ ...c, norte: 0, leste: 0, alcance: RAIO_MAX, quadrante: '', tentativas: 0, reducao: 0 }));
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

  function problemas(local) {
    const p = [];
    if (local.falhas?.length) p.push('falhou');
    if (local.cobertura_insuf?.length) p.push('cobertura insuficiente');
    if (local.censura?.length) p.push('censura possível');
    return p;
  }

  function resumirLocal(local, rs, op) {
    const validos = rs.filter((r) => !r.duplicata_de);
    const falhos = new Set((local.falhas || []).map(grupoDaConsulta));
    const linha = { place_id: local.place_id, nome: local.nome, cidade: local.cidade || '', lat: local.lat, lng: local.lng };
    for (const [grupo, col] of Object.entries(GRUPOS)) {
      const itens = validos.filter((r) => r.grupo === grupo);
      for (const raio of RAIOS_M) linha[`qt_${col}_${raio}m`] = falhos.has(grupo) ? '' : itens.filter((r) => r.distancia_m <= raio).length;
    }
    const shoppings = validos.filter((r) => r.grupo === 'shopping');
    for (const raio of RAIOS_M) {
      const no_raio = shoppings.filter((r) => r.distancia_m <= raio);
      linha[`qt_shoppings_porte_${raio}m`] = falhos.has('shopping') || no_raio.some((r) => r.porte_shopping === '') ? '' : no_raio.filter((r) => r.porte_shopping === 'sim').length;
    }
    linha.criterio_porte_shopping = criterioPorte(op);
    linha.qt_outros_1000m = validos.filter((r) => r.grupo === 'outro' && r.distancia_m <= RAIO_MAX).length;
    linha.resultados_ate_1000m = validos.filter((r) => r.distancia_m <= RAIO_MAX).length;
    for (const [grupo, col] of Object.entries(GRUPOS)) {
      const d = validos.filter((r) => r.grupo === grupo).map((r) => r.distancia_m);
      linha[`dist_${col}_mais_proxima_lida_m`] = d.length && !falhos.has(grupo) ? Math.min(...d) : '';
    }
    linha.duplicatas_fundidas = rs.filter((r) => r.duplicata_de).length;
    linha.revisoes_manuais = rs.filter((r) => r.revisado).length;
    linha.buscas = local.buscas;
    linha.cobertura_min_m = local.cobertura_min_m ?? '';
    linha.consultas_subdivididas = juntar(local.subdivididas || []);
    linha.consultas_falhas = juntar(local.falhas || []);
    linha.consultas_cobertura_insuficiente = juntar(local.cobertura_insuf || []);
    linha.consultas_censura = juntar(local.censura || []);
    linha.situacao = problemas(local).join('; ') || 'ok';
    linha.coletado_em = local.coletado_em;
    return linha;
  }

  function montarSaida(dados, revisoes, op) {
    const resumo = [];
    const resultados = [];
    for (const local of dados.locais) {
      const rs = dados.resultados.filter((r) => r.origem === local.chave).map((r) => {
        const rev = revisoes[chave(r)];
        return { ...r, grupo: rev || r.grupo_auto, revisado: rev ? 'sim' : '' };
      });
      marcarDuplicatas(rs);
      for (const r of rs) Object.assign(r, r.grupo === 'shopping' ? porte(r, local, op) : { porte_shopping: '', porte_base: '' });
      resultados.push(...rs);
      resumo.push(resumirLocal(local, rs, op));
    }
    return { resumo, resultados };
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
    Object.assign(fila, { tarefas: tarefasIniciais(), tarefa: 0, lidos: [], buscas_local: 0, subdivididas: [], censura: [], falhas: [], cobertura_insuf: [], cobertura_min_m: null });
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
    const pend = dados.locais.filter((l) => problemas(l).length);
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
    // Áreas do OSM só quando há shopping no raio (uma consulta à Overpass).
    const temShopping = unidos.some((r) => r.distancia_m <= RAIO_MAX && /shopping|mall/.test(semAcento(`${r.categoria_maps} ${r.nome}`)));
    let osm = null;
    if (temShopping) { status(`${local.nome}: consultando áreas de shopping no OSM…`); osm = await buscarOsm(local); }
    const dados = lerDados();
    dados.resultados = dados.resultados.filter((r) => r.origem !== k).concat(unidos);
    dados.locais = dados.locais.filter((l) => l.chave !== k).concat([{
      chave: k, ...local, buscas: fila.buscas_local, subdivididas: fila.subdivididas, censura: fila.censura,
      falhas: fila.falhas, cobertura_insuf: fila.cobertura_insuf, cobertura_min_m: fila.cobertura_min_m, osm, coletado_em,
    }]);
    gravar(CHAVE_DADOS, dados);
    fila.locais_fechados += 1;
    fila.buscas_em_fechados += fila.buscas_local;
    const restam = fila.pos + 1 < fila.locais.length;
    if (lerOpcoes().parcial && restam && fila.locais_fechados % PARCIAL_A_CADA === 0) {
      baixarTudo(`_parcial-${String(dados.locais.length).padStart(3, '0')}`);
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
      if (!parar) { tocar('fim'); baixarTudo(); }
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

  const COLS_RESULTADOS = ['origem_place_id', 'origem_nome', 'nome', 'categoria_maps', 'grupo_auto', 'grupo', 'revisado', 'duplicata_de', 'distancia_m', 'n_avaliacoes', 'porte_shopping', 'porte_base', 'lat', 'lng', 'place_id', 'id_maps', 'consultas', 'coletado_em'];

  function colsResumo() {
    const cols = ['place_id', 'nome', 'cidade', 'lat', 'lng'];
    for (const col of Object.values(GRUPOS)) for (const raio of RAIOS_M) cols.push(`qt_${col}_${raio}m`);
    for (const raio of RAIOS_M) cols.push(`qt_shoppings_porte_${raio}m`);
    cols.push('criterio_porte_shopping', 'qt_outros_1000m', 'resultados_ate_1000m');
    for (const col of Object.values(GRUPOS)) cols.push(`dist_${col}_mais_proxima_lida_m`);
    return [...cols, 'duplicatas_fundidas', 'revisoes_manuais', 'buscas', 'cobertura_min_m', 'consultas_subdivididas', 'consultas_falhas', 'consultas_cobertura_insuficiente', 'consultas_censura', 'situacao', 'coletado_em'];
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

  function baixarTudo(sufixo = '') {
    const { resumo, resultados } = montarSaida(lerDados(), ler(CHAVE_REVISOES, {}), lerOpcoes());
    const dia = new Date().toISOString().slice(0, 10);
    baixar(csv(resumo, colsResumo()), `maps_entorno_resumo_${dia}${sufixo}.csv`);
    setTimeout(() => baixar(csv(resultados, COLS_RESULTADOS), `maps_entorno_resultados_${dia}${sufixo}.csv`), 800);
  }

  async function completarOsm() {
    const dados = lerDados();
    const faltam = dados.locais.filter((l) => (!l.osm || l.osm.erro) && dados.resultados.some((r) => r.origem === l.chave && r.distancia_m <= RAIO_MAX && /shopping|mall/.test(semAcento(`${r.categoria_maps} ${r.nome}`))));
    if (!faltam.length) { status('Todas as áreas do OSM já estão guardadas.'); return; }
    for (const [i, l] of faltam.entries()) {
      status(`OSM ${i + 1}/${faltam.length}: ${l.nome}…`);
      l.osm = await buscarOsm(l);
      gravar(CHAVE_DADOS, dados);
      await esperar(1500);
    }
    status(`OSM: ${faltam.filter((l) => !l.osm?.erro).length} de ${faltam.length} consultados.`);
    atualizarPainel();
  }

  // ---------- painel (padrão: canto superior direito, shadow DOM, fora do <body>) ----------

  const el = {};
  let hospedeiro = null;

  function criar(tag, props = {}, filhos = []) {
    const n = document.createElement(tag);
    Object.assign(n, props);
    for (const f of filhos) n.appendChild(f);
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
    el.revisaoTitulo.textContent = `Revisar classificação (${itens.length})`;
    if (!el.revisao.parentElement.open) return;
    el.revisao.replaceChildren(...(itens.length ? itens.map((r) => {
      const k = chave(r);
      const sel = criar('select', {}, ['metro', 'vlt_brt', 'shopping', 'outro'].map((g) => criar('option', { value: g, textContent: g })));
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
    }) : [criar('span', { className: 'status', textContent: 'Nada a revisar.' })]));
  }

  function desenharPorte() {
    const op = lerOpcoes();
    el.porteSel.value = op.porte;
    el.areaMin.value = op.area_min_m2;
    el.limiar.value = op.limiar_aval;
    el.parcial.checked = op.parcial;
    el.abrasceInfo.textContent = op.abrasce.length ? `${op.abrasce.length} shoppings carregados${op.abrasce_arquivo ? ` (${op.abrasce_arquivo})` : ''}.` : 'Nenhuma lista carregada.';
    for (const [k, n] of Object.entries(el.porteBlocos)) n.hidden = k !== op.porte;
  }

  function atualizarPainel() {
    if (!el.resumo) return;
    const dados = lerDados();
    const fila = ler(CHAVE_FILA, null);
    const pend = dados.locais.filter((l) => problemas(l).length).length;
    el.resumo.textContent = `${dados.locais.length} estabelecimentos guardados (${dados.resultados.length} resultados).` +
      (fila?.ativa ? ` Fila: ${fila.pos + 1}/${fila.locais.length}, busca ${fila.tarefa + 1}/${fila.tarefas.length}${fila.pausada ? ' (pausada)' : ''}.` : '');
    el.parar.disabled = !fila?.ativa;
    el.retomar.hidden = !(fila?.ativa && fila.pausada);
    el.pendentes.textContent = `Refazer pendentes (${pend})`;
    el.pendentes.disabled = !pend || !!fila?.ativa;
    desenharPorte();
    desenharRevisao();
  }

  const CSS = `
    #painel{position:fixed;top:12px;right:12px;z-index:2147483647;width:340px;
      max-height:calc(100vh - 24px);overflow:auto;box-sizing:border-box;
      background:#fff;color:#111;border:1px solid #ccc;border-radius:10px;
      box-shadow:0 4px 16px rgba(0,0,0,.18);font:13px/1.4 system-ui,sans-serif;padding:10px}
    @media (prefers-color-scheme:dark){#painel{background:#1e1e1e;color:#eee;border-color:#444}}
    #painel.min>*:not(header){display:none}
    header{display:flex;justify-content:space-between;align-items:center;font-weight:700;cursor:grab;user-select:none}
    p{margin:6px 0}
    .linha{display:flex;flex-wrap:wrap;gap:6px;margin:6px 0;align-items:center}
    button{flex:1 1 auto;padding:5px 8px;border-radius:6px;border:1px solid #888;
      background:transparent;color:inherit;cursor:pointer;font:inherit}
    button:disabled{opacity:.4;cursor:default}
    button[hidden],div[hidden]{display:none}
    textarea{width:100%;box-sizing:border-box;height:70px;font:12px monospace;
      background:transparent;color:inherit;border:1px solid #888;border-radius:6px}
    select,input[type=number]{font:inherit;color:inherit;background:transparent;border:1px solid #888;border-radius:6px;padding:2px 4px}
    input[type=number]{width:80px}
    details{border-top:1px solid #8884;margin-top:6px;padding-top:4px}
    summary{cursor:pointer;font-weight:600}
    .lista{max-height:260px;overflow:auto;display:flex;flex-direction:column;gap:4px;margin-top:4px}
    .item{display:flex;gap:6px;align-items:center;font-size:12px}
    .item span{flex:1}
    .status,.dica{font-size:12px;opacity:.8}`;

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
    const botao = (texto, fn) => criar('button', { textContent: texto, onclick: fn });
    el.resumo = criar('p');
    el.status = criar('p', { className: 'status' });
    el.fila = criar('textarea', { placeholder: 'place_id;nome;lat;lng (uma por linha), ou CSV com cabeçalho' });
    const arqFila = arquivoTexto((texto, nome) => { el.fila.value = texto; status(`${lerFila(texto).length} estabelecimentos com coordenada em ${nome}.`); });
    const bArquivo = botao('Carregar CSV', () => arqFila.click());
    const bEste = botao('Este lugar', () => {
      const l = localAberto();
      if (!l) { status('Abra um lugar no Maps (com a coordenada na URL).'); return; }
      iniciarFila([l]);
    });
    const bFila = botao('Coletar fila', () => {
      const locais = lerFila(el.fila.value);
      if (!locais.length) { status('Nenhuma linha com lat e lng.'); return; }
      iniciarFila(locais);
    });
    el.parar = botao('Parar', () => { const f = ler(CHAVE_FILA, {}); f.parar = true; gravar(CHAVE_FILA, f); status('A fila para depois da busca atual.'); });
    el.retomar = botao('Retomar', () => {
      const f = ler(CHAVE_FILA, null);
      if (!f?.ativa) return;
      f.pausada = false;
      f.motivo_pausa = '';
      irPara(f);
    });
    el.pendentes = botao('Refazer pendentes', refazerPendentes);
    const bCsv = botao('Exportar CSVs', () => baixarTudo());
    const bLimpar = botao('Limpar', () => {
      if (!confirm('Apagar o entorno guardado e as revisões?')) return;
      gravar(CHAVE_DADOS, dadosVazios());
      gravar(CHAVE_REVISOES, {});
      gravar(CHAVE_FILA, null);
      atualizarPainel();
    });
    el.parcial = criar('input', { type: 'checkbox', onchange: () => mudarOpcao('parcial', el.parcial.checked) });

    // Shopping de porte: critério aplicado na exportação.
    el.porteSel = criar('select', { onchange: () => mudarOpcao('porte', el.porteSel.value) }, [
      criar('option', { value: 'osm', textContent: 'OpenStreetMap (área do polígono)' }),
      criar('option', { value: 'abrasce', textContent: 'Lista da Abrasce' }),
      criar('option', { value: 'avaliacoes', textContent: 'Avaliações no Maps' }),
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
      osm: criar('div', {}, [
        criar('div', { className: 'linha' }, [criar('span', { textContent: 'Área mínima (m²)' }), el.areaMin]),
        criar('div', { className: 'linha' }, [botao('Buscar áreas OSM que faltam', completarOsm)]),
        criar('p', { className: 'dica', textContent: 'Área da bounding box do shop=mall, o mesmo corte do B1-c_entorno_osm.py.' }),
      ]),
      abrasce: criar('div', {}, [
        criar('div', { className: 'linha' }, [botao('Carregar lista (CSV: nome, cidade)', () => arqAbrasce.click())]),
        el.abrasceInfo,
      ]),
      avaliacoes: criar('div', {}, [
        criar('div', { className: 'linha' }, [criar('span', { textContent: 'Mínimo de avaliações' }), el.limiar]),
        criar('p', { className: 'dica', textContent: 'Proxy sem fonte; preferir OSM ou Abrasce.' }),
      ]),
    };
    const porteDet = criar('details', {}, [
      criar('summary', { textContent: 'Shopping de porte' }),
      criar('div', { className: 'linha' }, [el.porteSel]),
      ...Object.values(el.porteBlocos),
      arqAbrasce,
    ]);

    el.revisaoTitulo = criar('summary', { textContent: 'Revisar classificação' });
    el.revisao = criar('div', { className: 'lista' });
    const revisaoDet = criar('details', { ontoggle: desenharRevisao }, [el.revisaoTitulo, el.revisao]);

    const sinal = criar('span', { textContent: '–' });
    const cabecalho = criar('header', { title: 'Arraste para mover; duplo clique volta ao canto' }, [criar('span', { textContent: 'Entorno (metrô, VLT/BRT, shopping)' }), sinal]);
    const painel = criar('div', { id: 'painel' }, [
      cabecalho,
      el.resumo,
      el.fila,
      criar('div', { className: 'linha' }, [bArquivo, bEste]),
      criar('div', { className: 'linha' }, [bFila, el.parar, el.retomar]),
      criar('div', { className: 'linha' }, [el.pendentes]),
      criar('div', { className: 'linha' }, [bCsv, bLimpar]),
      criar('label', { className: 'linha dica' }, [el.parcial, criar('span', { textContent: `Baixar CSV parcial a cada ${PARCIAL_A_CADA} estabelecimentos` })]),
      el.status,
      porteDet,
      revisaoDet,
      criar('p', { className: 'dica', textContent: 'Rode numa janela própria: aba em segundo plano deixa a fila lenta.' }),
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
