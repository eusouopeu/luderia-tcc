// ==UserScript==
// @name         Horários de pico do Google Maps (TCC Luderia)
// @namespace    tcc-luderia
// @version      2026.11.12-2
// @description  Lê o gráfico "Horários de pico" (ocupação relativa por dia e hora), o "ao vivo" e o tempo de permanência dos lugares do Google Maps; seletor com as 63 casas do B1, botão "Próximo" e exportação em CSV.
// @match        https://www.google.com/maps/*
// @match        https://www.google.com.br/maps/*
// @run-at       document-idle
// @noframes
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// @grant        unsafeWindow
// ==/UserScript==

/*
 * Uso pessoal, para as premissas de ocupação e giro (cap. 7 e 9).
 *
 * O que o Google mostra é um ÍNDICE RELATIVO (0–100, onde 100 é a hora mais cheia
 * da semana daquele lugar), não pessoas. Serve para o formato da curva semanal e,
 * calibrado com a contagem do Bloco B3 na São Jogue, para converter em ocupação.
 *
 * Os botões do painel trazem ícone (Heroicons) e nome curto; a explicação fica na
 * dica ao passar o mouse.
 *
 * Uso:
 *  - O seletor traz as 63 casas do B1 (B1_horarios.csv), em grupos por capital:
 *    ✓ coletada (com o número de barras), – sem gráfico de pico, ! coleta que
 *    falhou, ○ falta. "Só as que faltam" esconde as prontas.
 *  - Escolher uma casa no seletor abre a casa no Maps e coleta sozinho quando ela
 *    carrega (como "Abrir").
 *  - "Próximo" abre a próxima casa que falta (falhas incluídas) e coleta sozinho
 *    quando ela carrega; o resultado fica no status, para conferir antes de
 *    seguir. "Abrir" faz o mesmo com a casa escolhida; "Coletar" lê o lugar
 *    aberto de novo.
 *  - A coleta se liga à casa do B1 pela distância (até 300 m, como na análise
 *    B1-a_horarios_pico.py); se o lugar aberto não for a casa escolhida, o
 *    status avisa e a coleta vai para a casa certa (ou para nenhuma).
 *  - Fila de links (opcional): links do Maps ou nomes, um por linha.
 *
 * Armazenamento: no Tampermonkey (GM_setValue), um registro por lugar com as
 * barras em lista curta. Até a versão 2026.11.11-4 tudo ia para o localStorage
 * do google.com, uma linha por barra, cada uma com a URL inteira; perto de 35
 * lugares (3.000 linhas) a cota de ~5 MB acabava, a gravação falhava e a
 * mensagem de erro era apagada pela de sucesso (ex.: Ludus Luderia, 12/11/2026).
 * Ao carregar, o que estiver no localStorage passa para o Tampermonkey.
 *
 * CSV (";" e UTF-8 com BOM): uma linha por lugar × dia × hora.
 */

(function () {
  'use strict';

  const CHAVE_DADOS = 'tcc-picos-lugares';
  const CHAVE_FILA = 'tcc-picos-fila';
  const CHAVE_ITEM = 'tcc-picos-item';
  const CHAVE_ABRIR = 'tcc-picos-abrir';
  const CHAVE_SO_FALTAM = 'tcc-picos-so-faltam';
  const CHAVE_EXPORTACAO = 'tcc-picos-exportado-em';
  const ANTIGA_DADOS = 'tcc-picos-resultados'; // localStorage, até 2026.11.11-4
  const ANTIGA_FILA = 'tcc-picos-fila';
  const LIMITE_M = 300;
  const PAUSA_ENTRE_LUGARES = [4000, 8000];
  const DIAS = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
  const DIAS_RE = [/doming|sunday/i, /segunda|monday/i, /terca|terça|tuesday/i, /quarta|wednesday/i, /quinta|thursday/i, /sexta|friday/i, /sabado|sábado|saturday/i];

  // População: as 63 casas do B1 (dados/[B1]…/estabelecimentos/B1_horarios.csv), com as
  // coordenadas de dados/[B1]…/entorno/B1_entorno_maps_fila.csv (Places API).
  // [place_id, nome, capital, lat, lng]
  const POP = [
    ["ChIJRcWOaPabpgARDvX2Bad0qb0", "Bardo Mago", "Belo Horizonte", -19.905169, -43.915835],
    ["ChIJpzB8zc2XpgARoJTUu90J6Pw", "Comdado Bar e Jogos", "Belo Horizonte", -19.927646, -43.954388],
    ["ChIJsUAT-dObpgARCT2C5QpnVKU", "Garagem do Nerd", "Belo Horizonte", -19.917242, -43.901223],
    ["ChIJ-17ZQDG9pgARc-AxpXmaNRU", "La Tabuleria", "Belo Horizonte", -19.976597, -43.977367],
    ["ChIJx5jr3zGXpgARQGx9eX7TDmY", "LudoCafé", "Belo Horizonte", -19.944717, -43.946234],
    ["ChIJ6ZLMZw-XpgAR_OR6SwY5xKo", "Shelf Bar e Jogos", "Belo Horizonte", -19.937803, -43.944948],
    ["ChIJ-97tiEeNpJIRb_eV7a-sxBs", "Ludoteca Sidequest", "Belém", -1.44916, -48.486457],
    ["ChIJyXjE650xWpMRJL-J6QbGkt4", "FORTALÚDICA - BURGERS & JOGOS", "Brasília", -15.833121, -47.983815],
    ["ChIJ172cu2U7WpMR-GxnGmUHCkc", "Gruta BSB", "Brasília", -15.76649, -47.877086],
    ["ChIJdUv4La46WpMRnBvNknmOqWo", "Inside Games", "Brasília", -15.82264, -47.919744],
    ["ChIJzdFNP3AyWpMRH2P6HEuhE-I", "Loja de Jogos - Asgard", "Brasília", -15.84384, -48.029229],
    ["ChIJ15nLgwAwWpMRY1whwD29ZSo", "Ludoteca BGC", "Brasília", -15.819414, -47.899706],
    ["ChIJN8BZeb85WpMRgVKT05caxB4", "Utopia Games & Food", "Brasília", -15.737604, -47.895234],
    ["ChIJGXginrXGyJQR0LFEVIzp4hI", "Metropoly Bar", "Campinas", -22.821702, -47.076784],
    ["ChIJz-2zsLTHyJQRyn6ZZtDZgBI", "Muito Geek | TCG • Board Games • Fliperama", "Campinas", -22.883997, -47.070259],
    ["ChIJ5ehtIcbFyJQRf7QBB6TJ6XE", "Nergeek", "Campinas", -22.88954, -47.033546],
    ["ChIJ3ekLtDjl3JQRHwtNgmINgLo", "Alçapão Jogos", "Curitiba", -25.418006, -49.265488],
    ["ChIJY_lqHVLl3JQRvDHacOMDKuc", "BoardZ Game Pub", "Curitiba", -25.452186, -49.268753],
    ["ChIJOczn8z7l3JQRNBEL_ZJ3iQo", "Joyjoy Café", "Curitiba", -25.437043, -49.241465],
    ["ChIJK5Dhtunj3JQRniPWHB3haDU", "Paladino Hobbies", "Curitiba", -25.434156, -49.302922],
    ["ChIJc66HomXk3JQRNl28jz_VsPc", "Taverna Game House", "Curitiba", -25.441605, -49.270879],
    ["ChIJ1wjBJD7k3JQRQi7trfp_0aQ", "Vila Celta Hobby Store - Jogos e Café", "Curitiba", -25.44302, -49.266283],
    ["ChIJawIVeV0JM0oR5BtnD_poQeA", "CCG Floripa", "Florianópolis", -27.58156, -48.526293],
    ["ChIJc3F7ka83J5URQZ1XTl-_iak", "Chef on Play", "Florianópolis", -27.587931, -48.523133],
    ["ChIJJz8-gcY3J5URYdZrEXdHaAk", "Cineplay- Restaurante e Jogos", "Florianópolis", -27.611552, -48.627225],
    ["ChIJ0yXbI35IxwcR0_jLi-uINUU", "Balboa's Hobby Games", "Fortaleza", -3.734689, -38.500261],
    ["ChIJQURqeMZJxwcR95O-XLbS2mk", "Dominaria Cards & Games", "Fortaleza", -3.738413, -38.53968],
    ["ChIJ89uEICDxXpMRdaEvN0XiWK0", "Paladins Game Store", "Goiânia", -16.712706, -49.264019],
    ["ChIJHSDPTgF5GZURKmSqKITyoGM", "Arcadea Gaming Pub", "Porto Alegre", -30.021524, -51.206899],
    ["ChIJ41pgHNFDGZURC7yTegyn7nU", "Toca do Rato - Pizzaria e Jogos de Tabuleiro", "Porto Alegre", -29.61081, -51.166349],
    ["ChIJRUjwU66WoGgRzc9yJU7jkwM", "Nala Land - Bar de Jogos de Tabuleiro em Recife", "Recife", -8.023976, -34.895067],
    ["ChIJPx_QtT17mQAR9cO9ARQW00g", "Cheio de Fome - Vila da Penha", "Rio de Janeiro", -22.840402, -43.308167],
    ["ChIJu1yUroF_mQAR7qxqAfxKSw4", "Game Of Boards", "Rio de Janeiro", -22.954819, -43.180991],
    ["ChIJ90Gs_9rVmwAReA7MnIyPLTE", "Luderia Carioca", "Rio de Janeiro", -22.9232, -43.177488],
    ["ChIJYzHxUhR-mQARpqVtYD9th0c", "Magic Store Brazil", "Rio de Janeiro", -22.916493, -43.241072],
    ["ChIJ1SAzAGF_mQARQgP-yrPBxbQ", "RED jogos", "Rio de Janeiro", -22.909066, -43.177219],
    ["ChIJxXhMZN5_mQARj2JCqcWfTD8", "Reduto", "Rio de Janeiro", -22.953503, -43.196112],
    ["ChIJOcVssmeDmQARZZrnWu2mnwA", "TabuClub", "Rio de Janeiro", -22.898584, -43.10234],
    ["ChIJoTlvBfMbFgcRHvuCKHBQrXQ", "São Jogue - Bela Vista", "Salvador", -12.969436, -38.473681],
    ["ChIJfWR3S3ZazpQR6aC6xpbPMwU", "60 Minutos Escape, Hamburgueria e Boardgames", "São Paulo", -23.624451, -46.669091],
    ["ChIJYTHwWgBbzpQRFenbJdM5cxU", "Arena BG | Jogos de Tabuleiro | Hamburgueria", "São Paulo", -23.599307, -46.601688],
    ["ChIJKeHwNv5ZzpQRlmzx9rCTWdM", "Bodogami Restaurante e Cafeteria", "São Paulo", -23.556847, -46.6366],
    ["ChIJ__9TTnxCzpQRwVSzrOijkRY", "Bravo Jogos", "São Paulo", -23.662974, -46.525198],
    ["ChIJRU7FUX1CzpQRj3E7xMzGPvA", "CHQ Jogos", "São Paulo", -23.668268, -46.538039],
    ["ChIJrT_EWwBZzpQRGAZzptZbtsY", "Cartola Luderia Bar", "São Paulo", -23.563561, -46.638521],
    ["ChIJbZRHQPRfzpQRz97-ZOg0yXA", "Castelos Bar & Boardgames", "São Paulo", -23.542591, -46.562184],
    ["ChIJF9j3OCRbzpQRkk74_QtOk_0", "Coletivo Geek", "São Paulo", -23.614642, -46.666278],
    ["ChIJ7_DDAlH1zpQRJVJ0UHnItH8", "Covil Game Bar", "São Paulo", -23.465036, -46.523386],
    ["ChIJSU_eTQBDzpQRv_GdRUp0f-g", "Covil Game Bar SBC", "São Paulo", -23.687824, -46.56191],
    ["ChIJiZJ_DnIDz5QRaVafFCXGkUE", "Dungeon Games Store", "São Paulo", -23.509005, -46.873919],
    ["ChIJZz29dnVXzpQRvRh7_YKyUN4", "Encounter | Jogos de Tabuleiro | Board Games", "São Paulo", -23.606458, -46.673858],
    ["ChIJBUzaCedbzpQRkSqbwW7yAvQ", "Espaço 162 - Meu Karaokê Box", "São Paulo", -23.585295, -46.611131],
    ["ChIJ_aN4OAxXzpQR0UH63sAeVCA", "Fan Hour Games and Burgers", "São Paulo", -23.561704, -46.680473],
    ["ChIJa3UsDhRczpQRPPSuDl6acO8", "Flow Games - Burgers, Cards & Comunidade", "São Paulo", -23.581556, -46.58485],
    ["ChIJn7uU0RNbzpQRI4GI9KHOo_s", "Jogasampa", "São Paulo", -23.612477, -46.663246],
    ["ChIJTaG5ALpZzpQRUDErQ-RkfTs", "Ludus Luderia", "São Paulo", -23.561838, -46.64621],
    ["ChIJE43rt29ZzpQRnvADt6pXfto", "OMNIVERSE", "São Paulo", -23.613038, -46.676947],
    ["ChIJo-6lZMlezpQRmgUpUPfmRIs", "Pitta's Board Games", "São Paulo", -23.547275, -46.592412],
    ["ChIJkWsGmd1czpQRGLydxc29vbw", "Place Games", "São Paulo", -23.621405, -46.561556],
    ["ChIJNcHw7jNYzpQRKRHPOrb4jEw", "Play Easy", "São Paulo", -23.551913, -46.656812],
    ["ChIJsU5BAwBRzpQRAgLVvqg68os", "Tubaleria", "São Paulo", -23.632058, -46.709815],
    ["ChIJi5zbZadgzpQRIYeuK_eqQio", "XPlace", "São Paulo", -23.532507, -46.515814],
    ["ChIJfyav9YI9uAARjwbBqcRm2_k", "Café Geek Cafeteria e Ludoteca", "Vitória", -20.344746, -40.310846],
  ].map(([id, nome, capital, lat, lng]) => ({ id, nome, capital, lat, lng }));

  // ---------- utilidades ----------

  const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
  const sortear = ([a, b]) => a + Math.random() * (b - a);
  const semAcento = (t) => String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

  function agora() {
    const d = new Date();
    const p = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
  }

  // Tampermonkey: sem a cota do localStorage. Devolve false se a gravação falhar.
  function ler(chave, padrao) {
    try { const v = GM_getValue(chave, padrao); return v ?? padrao; } catch (_) { return padrao; }
  }

  function gravar(chave, valor) {
    try { GM_setValue(chave, valor); return true; } catch (e) { status(`Não consegui gravar no Tampermonkey: ${e.message}`); return false; }
  }

  function distancia(lat1, lng1, lat2, lng2) {
    const r = Math.PI / 180;
    const a = Math.sin((lat2 - lat1) * r / 2) ** 2 + Math.cos(lat1 * r) * Math.cos(lat2 * r) * Math.sin((lng2 - lng1) * r / 2) ** 2;
    return 2 * 6371000 * Math.asin(Math.sqrt(a));
  }

  const codigoDe = (l) => ([...String(l.url || '').matchAll(/!1s(0x[0-9a-f]+:0x[0-9a-f]+)/gi)].pop() || [])[1] || l.id_maps || '';

  // ---------- leitura do lugar ----------

  function infoLugar() {
    const url = location.href;
    const nome = document.querySelector('h1.DUwDvf, div[role="main"] h1')?.innerText.trim() || '';
    const endereco = (document.querySelector('button[data-item-id="address"]')?.getAttribute('aria-label') || '')
      .replace(/^(endereço|address):\s*/i, '').trim();
    // Quem abre um lugar a partir de outro leva os dois na URL; o aberto é o último.
    const ultimo = (re) => [...url.matchAll(re)].pop();
    const cid = (ultimo(/!1s(0x[0-9a-f]+:0x[0-9a-f]+)/gi) || [])[1] || '';
    const coord = ultimo(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/g) || url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/) || [];
    const resumo = document.querySelector('div.F7nice')?.innerText || '';
    const nota = (resumo.match(/(\d[.,]\d)/) || [])[1]?.replace(',', '.') || '';
    const volume = (resumo.match(/\(([\d.,\s]+)\)/) || [])[1]?.replace(/\D/g, '') || '';
    return { nome, endereco, id_maps: cid, lat: coord[1] || '', lng: coord[2] || '', nota_media: nota, n_avaliacoes: volume, url };
  }

  function painelPrincipal() {
    const paineis = [...document.querySelectorAll('div[role="main"]')];
    return paineis.find((p) => p.getClientRects().length > 0) || paineis[0] || document.body;
  }

  // ---------- conferência do lugar ----------
  // Ao ir de um lugar a outro sem recarregar a página, o Maps troca o painel, o
  // gráfico e a URL em momentos diferentes, e a URL pode levar os dois lugares.
  // Só se coleta quando os quatro nomes batem: título do painel, rótulo do
  // painel, rótulo do gráfico ("Horários de pico em <nome>") e o lugar no fim
  // da URL (/maps/place/<nome>/, com o código do lugar).

  const chave = (t) => semAcento(t).replace(/[^a-z0-9]/g, '');

  function nomesDoLugar() {
    const painel = painelPrincipal();
    const url = location.href;
    let nomeUrl = '';
    try { nomeUrl = decodeURIComponent(((url.match(/\/maps\/place\/([^/@?]+)/) || [])[1] || '').replace(/\+/g, ' ')); } catch (_) { /* URL malformada */ }
    const grafico = [...painel.querySelectorAll('[aria-label]')]
      .map((e) => e.getAttribute('aria-label'))
      .find((t) => /^(hor[aá]rios de pico em|popular times (at|for)) /i.test(t)) || '';
    return {
      titulo: painel.querySelector('h1')?.innerText.trim() || '',
      painel: painel.getAttribute('aria-label') || '',
      grafico: grafico.replace(/^(hor[aá]rios de pico em|popular times (at|for)) /i, '').trim(),
      url: nomeUrl,
      temCodigo: /!1s0x[0-9a-f]+:0x[0-9a-f]+/i.test(url),
    };
  }

  // Devolve '' se o lugar está coerente, ou o motivo da recusa.
  function incoerencia(exigirGrafico) {
    const n = nomesDoLugar();
    const t = chave(n.titulo);
    if (!t) return 'nenhum lugar aberto';
    if (!n.temCodigo || !n.url) return 'a URL ainda não traz o lugar aberto';
    const iguais = (a) => { const k = chave(a); return k === t || (k.length >= 4 && (t.startsWith(k) || k.startsWith(t))); };
    if (n.painel && !iguais(n.painel)) return `painel com "${n.painel}" e título "${n.titulo}"`;
    if (!iguais(n.url)) return `URL em "${n.url}" e painel em "${n.titulo}"`;
    if (exigirGrafico && n.grafico && !iguais(n.grafico)) return `gráfico de "${n.grafico}" no painel de "${n.titulo}"`;
    return '';
  }

  async function esperarCoerencia(exigirGrafico, ms = 10000) {
    let motivo = '';
    for (let t = 0; t < ms; t += 500) {
      motivo = incoerencia(exigirGrafico);
      if (!motivo) return '';
      await esperar(500);
    }
    return motivo;
  }

  // Container que rola o painel do lugar.
  function rolavel(de) {
    for (let e = de; e && e !== document.body; e = e.parentElement) {
      const cs = getComputedStyle(e);
      if (/(auto|scroll)/.test(cs.overflowY) && e.scrollHeight > e.clientHeight + 20) return e;
    }
    return null;
  }

  async function abrirVisaoGeral() {
    const aba = [...document.querySelectorAll('button[role="tab"]')].find((b) => /vis[aã]o geral|overview/i.test(b.innerText || b.getAttribute('aria-label')));
    if (aba && aba.getAttribute('aria-selected') !== 'true') { aba.click(); await esperar(1500); }
  }

  // O gráfico pode só ser montado quando aparece na tela: rola o painel até o fim.
  async function percorrerPainel() {
    const c = rolavel(document.querySelector('div[role="main"] h1') || painelPrincipal());
    if (!c) return;
    for (let i = 0; i < 15 && c.scrollTop + c.clientHeight < c.scrollHeight - 5; i++) {
      c.scrollBy(0, 700);
      await esperar(350);
    }
    c.scrollTo(0, 0);
  }

  // Formatos do rótulo de cada barra (o Google muda sem aviso):
  //   "Movimento às 13:00: 39%."            (desde nov/2026)
  //   "Normalmente 45% cheio às 19 h."      (antigo)
  //   "Usually 45% busy at 7 PM." / "45% busy at 7 PM."
  // Com o "ao vivo", o rótulo traz dois números; vale o depois de "normalmente/usually".
  function lerBarra(rotulo) {
    const t = semAcento(rotulo);
    if (!/%/.test(t) || !/(moviment|cheio|busy|ocupa|lotad)/.test(t)) return null;
    const usual = t.match(/(?:normalmente|usually|geralmente)\D{0,20}?(\d{1,3})\s*%/);
    const pct = usual ? +usual[1] : +(t.match(/(\d{1,3})\s*%/) || [])[1];
    if (!Number.isFinite(pct)) return null;
    const semPct = t.replace(/\d{1,3}\s*%/g, ' ');
    let m = semPct.match(/\b(\d{1,2})\s*(am|pm)\b/);
    if (m) return { pct, hora: (+m[1] % 12) + (m[2] === 'pm' ? 12 : 0) };
    m = semPct.match(/\b(\d{1,2})(?::\d{2}|\s*h\b)/);
    if (m && +m[1] < 24) return { pct, hora: +m[1] };
    return null;
  }

  // O bloco do gráfico ("Horários de pico em <lugar>"); sem ele, o painel inteiro.
  function raizGrafico() {
    const p = painelPrincipal();
    return [...p.querySelectorAll('[aria-label]')].find((e) => /^(hor[aá]rios de pico em|popular times (at|for)) /i.test(e.getAttribute('aria-label'))) || p;
  }

  function lerPicos() {
    const raiz = raizGrafico();
    const barras = [...raiz.querySelectorAll('[aria-label]')]
      .map((e) => ({ e, b: lerBarra(e.getAttribute('aria-label')) }))
      .filter((x) => x.b);
    if (!barras.length) {
      // Diagnóstico: se o Google mudou o texto das barras, os rótulos com "%" aparecem no console.
      console.info('[Horários de pico] rótulos com %:', [...raiz.querySelectorAll('[aria-label*="%"]')].map((e) => e.getAttribute('aria-label')));
      const limitada = /visualiza[cç][aã]o limitada|limited view/i.test(painelPrincipal().innerText);
      return { linhas: [], aviso: limitada ? 'Visualização limitada do Maps (sem login): o gráfico não aparece. Entre na conta.' : 'Sem gráfico de horários de pico neste lugar (ou ainda não carregou).' };
    }

    // Altura da barra: o primeiro filho de cada barra tem "top" em px (0% fica no
    // fundo). Calibra top → % com as barras de rótulo lido (mínimos quadrados) e
    // usa a reta para a barra cujo rótulo não se lê: a da hora atual, que tem
    // outro texto quando o lugar está aberto (até a versão 2026.11.11-2 ela se
    // perdia, ex.: Chef on Play e Cineplay às 23h de terça).
    const topo = (e) => parseFloat(e.firstElementChild?.style.top);
    const pares = barras.map(({ e, b }) => [topo(e), b.pct]).filter(([t]) => Number.isFinite(t));
    let reta = null;
    if (pares.length >= 3) {
      const n = pares.length, mx = pares.reduce((s, [x]) => s + x, 0) / n, my = pares.reduce((s, [, y]) => s + y, 0) / n;
      const sxx = pares.reduce((s, [x]) => s + (x - mx) ** 2, 0);
      if (sxx > 0) { const b = pares.reduce((s, [x, y]) => s + (x - mx) * (y - my), 0) / sxx; reta = (t) => my + b * (t - mx); }
    }

    // Agrupa por dia: o elemento que reúne as barras de um dia (pai comum). Cada
    // grupo é percorrido barra a barra, na ordem, para não pular nenhuma hora.
    const lidas = new Map(barras.map(({ e, b }) => [e, b]));
    const grupos = new Map();
    for (const { e } of barras) {
      const g = e.parentElement;
      if (grupos.has(g)) continue;
      const bs = [];
      for (const filho of g.children) {
        const b = lidas.get(filho);
        if (b) { bs.push({ ...b, leitura: 'rotulo' }); continue; }
        const anterior = bs[bs.length - 1];
        if (!anterior || !Number.isFinite(topo(filho))) continue;
        // Hora atual com o lugar aberto: "Movimento atual: 41%, movimento esperado: 12%."
        // (11/11/2026). O esperado é o valor do gráfico; sem ele, vale a altura,
        // que deu o mesmo número nas 3 barras conferidas.
        const rotulo = filho.getAttribute('aria-label') || '';
        const t = semAcento(rotulo);
        const vivo = t.match(/(?:atual|atualmente|currently)\D{0,5}(\d{1,3})\s*%/) || t.match(/(\d{1,3})\s*%/);
        const esperado = t.match(/(?:esperado|normalmente|usually)\D{0,5}(\d{1,3})\s*%/);
        bs.push({
          hora: (anterior.hora + 1) % 24,
          pct: esperado ? +esperado[1] : (reta ? Math.max(0, Math.round(reta(topo(filho)))) : ''),
          ao_vivo: vivo ? +vivo[1] : '',
          leitura: esperado ? 'rotulo da hora atual' : `altura (rótulo: "${rotulo}")`,
        });
      }
      grupos.set(g, bs);
    }
    const listas = [...grupos.entries()];
    // O Maps monta 7 vagas de dia, domingo primeiro. O dia fechado continua lá,
    // sem barras, com o texto "Fechada às segundas-feiras". O dia de cada grupo é
    // a posição da sua vaga entre as 7; o texto dos dias fechados confere a ordem.
    // (Até 10/11/2026 o script só contava os grupos com barras, e numa casa
    // fechada em algum dia os dias seguintes saíam deslocados.)
    const vagaDe = (g) => {
      for (let a = g; a && a.parentElement && a !== raiz; a = a.parentElement) {
        if (a.parentElement.children.length === 7) return a;
      }
      return null;
    };
    const vagas = vagaDe(listas[0][0])?.parentElement;
    let inferido = !vagas || !listas.every(([g]) => vagas.contains(g));
    if (!inferido) {
      [...vagas.children].forEach((v, i) => {
        const fechado = semAcento(v.textContent).match(/fechad[ao] (?:as|aos|no|na)?\s*(\S+)|closed on (\S+)/);
        if (fechado && DIAS_RE.findIndex((re) => re.test(fechado[1] || fechado[2])) !== i) inferido = true;
      });
    }
    const linhas = [];
    listas.forEach(([g, bs], i) => {
      const dia = inferido ? i % 7 : [...vagas.children].findIndex((v) => v.contains(g));
      for (const b of bs) linhas.push({ dia_semana: DIAS[dia], ordem_dia: dia, hora: b.hora, ocupacao_relativa: b.pct, ao_vivo: b.ao_vivo ?? '', leitura: b.leitura });
    });

    // Ao vivo: "Atualmente 60% cheio; normalmente 45%." / "Currently 60% busy, usually 45% busy."
    let aoVivo = '';
    for (const e of raiz.querySelectorAll('[aria-label]')) {
      const m = semAcento(e.getAttribute('aria-label')).match(/(atualmente|currently)\s*(\d{1,3})\s*%/);
      if (m) { aoVivo = +m[2]; break; }
    }
    if (aoVivo !== '') {
      const d = new Date();
      const alvo = linhas.find((l) => l.ordem_dia === d.getDay() && l.hora === d.getHours());
      if (alvo && alvo.ao_vivo === '') alvo.ao_vivo = aoVivo;
      else linhas.push({ dia_semana: DIAS[d.getDay()], ordem_dia: d.getDay(), hora: d.getHours(), ocupacao_relativa: '', ao_vivo: aoVivo });
    }

    const texto = painelPrincipal().innerText;
    const permanencia = (texto.match(/(As pessoas (normalmente|costumam)[^\n]*|Normalmente, as pessoas passam[^\n]*|People typically spend[^\n]*)/i) || [])[0] || '';
    return { linhas, aviso: inferido ? 'Dia da semana inferido pela ordem dos grupos (as 7 vagas de dia não foram achadas); confira um dia no gráfico.' : '', permanencia, dia_inferido: inferido ? 'sim' : '' };
  }

  // ---------- armazenamento ----------
  // Um registro por lugar: os dados do lugar uma vez só e as barras em
  // [ordem_dia, hora, ocupacao_relativa, ao_vivo, leitura].

  const lugaresGuardados = () => ler(CHAVE_DADOS, []);

  // Linhas antigas (uma por barra) → registros por lugar. Lugar sem código (coleta
  // que falhou) fica com a própria linha.
  function converterAntigas(linhas) {
    const grupos = new Map();
    linhas.forEach((l, i) => {
      const k = codigoDe(l) || `sem-codigo-${i}`;
      if (!grupos.has(k)) {
        const { dia_semana, ordem_dia, hora, ocupacao_relativa, ao_vivo, leitura, ...lugar } = l;
        grupos.set(k, { ...lugar, id_maps: codigoDe(l), place_id: '', linhas: [] });
      }
      if (l.situacao === 'ok' && l.hora !== '' && l.hora != null) {
        grupos.get(k).linhas.push([+l.ordem_dia, +l.hora, l.ocupacao_relativa ?? '', l.ao_vivo ?? '', l.leitura ?? '']);
      }
    });
    return [...grupos.values()];
  }

  function migrarLocalStorage() {
    let ls;
    try { ls = (typeof unsafeWindow !== 'undefined' ? unsafeWindow : window).localStorage; } catch (_) { return ''; }
    if (!ls) return '';
    let antigas;
    try { antigas = JSON.parse(ls.getItem(ANTIGA_DADOS)); } catch (_) { antigas = null; }
    let msg = '';
    if (Array.isArray(antigas) && antigas.length) {
      const novos = converterAntigas(antigas);
      const atuais = lugaresGuardados();
      const vistos = new Set(atuais.map(codigoDe).filter(Boolean));
      const juntos = [...atuais, ...novos.filter((l) => !l.id_maps || !vistos.has(l.id_maps))];
      if (!gravar(CHAVE_DADOS, juntos)) return '';
      ls.removeItem(ANTIGA_DADOS);
      msg = `${novos.length} lugares (${antigas.length} linhas) passados do localStorage para o Tampermonkey. `;
    }
    try {
      const fila = JSON.parse(ls.getItem(ANTIGA_FILA));
      if (fila && !ler(CHAVE_FILA, null)) gravar(CHAVE_FILA, fila);
      ls.removeItem(ANTIGA_FILA);
    } catch (_) { /* sem fila antiga */ }
    return msg;
  }

  // ---------- população ----------

  // Casa do B1 do lugar aberto: a escolhida, se estiver a até 300 m; senão a mais próxima
  // a até 300 m. Sem coordenadas, só a escolhida e com nome parecido.
  function popDoLugar(lugar, pidEscolhido) {
    const lat = parseFloat(lugar.lat), lng = parseFloat(lugar.lng);
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      const perto = POP.map((p) => ({ p, d: distancia(lat, lng, p.lat, p.lng) })).filter((x) => x.d <= LIMITE_M).sort((a, b) => a.d - b.d);
      return (perto.find((x) => x.p.id === pidEscolhido) || perto[0] || {}).p || null;
    }
    const esc = POP.find((p) => p.id === pidEscolhido);
    const k = (t) => semAcento(t).replace(/[^a-z0-9]/g, '');
    if (esc && k(lugar.nome) && (k(esc.nome).startsWith(k(lugar.nome).slice(0, 6)))) return esc;
    return null;
  }

  // Registro guardado de cada casa do B1: pelo place_id gravado na coleta ou, nas coletas
  // antigas (sem place_id), pelo lugar a até 300 m.
  function registrosPorCasa(lugares) {
    const m = new Map();
    for (const p of POP) {
      let r = lugares.filter((l) => l.place_id === p.id).pop();
      if (!r) {
        let dmin = LIMITE_M + 1;
        for (const l of lugares) {
          const lat = parseFloat(l.lat), lng = parseFloat(l.lng);
          if (l.place_id || !Number.isFinite(lat) || !Number.isFinite(lng)) continue;
          const d = distancia(p.lat, p.lng, lat, lng);
          if (d < dmin) { dmin = d; r = l; }
        }
      }
      if (r) m.set(p.id, r);
    }
    return m;
  }

  // ok (com barras), sem (sem gráfico de pico), falha (coleta recusada) ou falta.
  function estadoCasa(r) {
    if (!r) return 'falta';
    if (r.linhas?.length) return 'ok';
    if (/sem hor[aá]rios de pico/i.test(r.situacao || '')) return 'sem';
    return 'falha';
  }

  // Próxima casa que falta (ou cuja coleta falhou), na ordem do seletor, a partir da atual.
  function proximaQueFalta(lugares, pidAtual) {
    const reg = registrosPorCasa(lugares);
    const i0 = POP.findIndex((p) => p.id === pidAtual);
    const ordem = [...POP.slice(i0 + 1), ...POP.slice(0, i0 + 1)];
    return ordem.find((p) => p.id !== pidAtual && ['falta', 'falha'].includes(estadoCasa(reg.get(p.id)))) || null;
  }

  const urlCasa = (p) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.nome)}&query_place_id=${p.id}`;

  // ---------- coleta ----------

  async function coletarEste(pidEscolhido = '') {
    // Antes e depois de rolar o painel: o gráfico só aparece depois da rolagem.
    let motivo = await esperarCoerencia(false);
    if (!motivo) {
      await abrirVisaoGeral();
      await percorrerPainel();
      motivo = await esperarCoerencia(true);
    }
    const escolhida = POP.find((p) => p.id === pidEscolhido);
    if (motivo) {
      const r = { ok: false, msg: `Nada gravado: ${motivo}. Espere a página terminar de carregar e colete de novo.` };
      // Falha fica ligada à casa, para o seletor marcar "!" e o "Próximo" voltar a ela;
      // não encobre uma coleta boa já guardada da mesma casa.
      if (escolhida && ['falta', 'falha'].includes(estadoCasa(registrosPorCasa(lugaresGuardados()).get(escolhida.id)))) {
        const dados = lugaresGuardados().filter((l) => !(l.place_id === escolhida.id && !l.linhas?.length));
        dados.push({ nome: infoLugar().nome, url: location.href, place_id: escolhida.id, situacao: r.msg, coletado_em: agora(), coletado_ms: Date.now(), linhas: [] });
        gravar(CHAVE_DADOS, dados);
      }
      return r;
    }
    const lugar = infoLugar();
    const casa = popDoLugar(lugar, pidEscolhido);
    const { linhas, aviso, permanencia = '', dia_inferido = '' } = lerPicos();
    // Substitui só a coleta anterior do MESMO lugar: pelo código tirado da URL gravada
    // (o último lugar dela) ou pela mesma casa do B1. Até a versão 2026.11.11-1 o código
    // gravado podia ser o do lugar de onde se partiu, e comparar por ele ou pelo nome
    // apagava outra casa (ex.: coletar a Magic Store apagou o Garagem do Nerd).
    const dados = lugaresGuardados().filter((l) => !((lugar.id_maps && codigoDe(l) === lugar.id_maps) || (casa && l.place_id === casa.id)));
    dados.push({
      ...lugar, place_id: casa?.id || '', permanencia, dia_inferido,
      situacao: linhas.length ? 'ok' : 'sem horários de pico', coletado_em: agora(), coletado_ms: Date.now(),
      linhas: linhas.map((l) => [l.ordem_dia, l.hora, l.ocupacao_relativa, l.ao_vivo ?? '', l.leitura ?? '']),
    });
    if (!gravar(CHAVE_DADOS, dados)) return { ok: false, msg: `Nada gravado: o Tampermonkey recusou a gravação (${lugar.nome}).` };
    // Confere a gravação: a falha silenciosa do localStorage não pode voltar.
    const gravado = lugaresGuardados().some((l) => l.coletado_ms === dados[dados.length - 1].coletado_ms && l.url === lugar.url);
    if (!gravado) return { ok: false, msg: `Nada gravado: a leitura de volta não achou ${lugar.nome}.` };
    const outra = escolhida && casa?.id !== escolhida.id
      ? ` Atenção: o lugar aberto não é ${escolhida.nome}${casa ? `; gravado como ${casa.nome}` : ' nem outra casa do B1'}.` : '';
    return { ok: true, casa, msg: `${lugar.nome}: ${linhas.length ? `${linhas.length} barras lidas` : 'sem horários de pico'}.${outra} ${aviso}`.trim() };
  }

  // Casa aberta por "Próximo" ou "Abrir": coleta sozinha quando a página carrega.
  async function coletarAoAbrir() {
    const pedido = ler(CHAVE_ABRIR, null);
    if (!pedido) return;
    GM_deleteValue(CHAVE_ABRIR);
    if (Date.now() - pedido.em > 2 * 60 * 1000) return;
    const casa = POP.find((p) => p.id === pedido.pid);
    status(`Abrindo ${casa?.nome || 'a casa'}…`);
    for (let i = 0; i < 30 && !infoLugar().nome; i++) await esperar(500);
    await esperar(1500);
    status(`Lendo ${casa?.nome || 'a casa'}…`);
    const r = await coletarEste(pedido.pid);
    status(r.msg);
    atualizar();
  }

  // ---------- fila de links ----------

  function paraUrl(linha) {
    const t = linha.trim();
    if (!t) return null;
    return /^https?:\/\//.test(t) ? t : `https://www.google.com/maps/search/${encodeURIComponent(t)}`;
  }

  async function continuarFila() {
    const fila = ler(CHAVE_FILA, null);
    if (!fila || !fila.ativa) return;
    // Espera o lugar carregar (h1) por até 15 s.
    for (let i = 0; i < 30 && !infoLugar().nome; i++) await esperar(500);
    await esperar(2000);
    const atual = fila.itens[fila.pos];
    let r;
    if (!infoLugar().nome) {
      const dados = lugaresGuardados();
      dados.push({ nome: '', url: atual, place_id: '', situacao: 'não abriu um lugar (busca com vários resultados?)', coletado_em: agora(), coletado_ms: Date.now(), linhas: [] });
      gravar(CHAVE_DADOS, dados);
      r = { msg: `Não abriu um lugar: ${atual}` };
    } else {
      r = await coletarEste();
      if (!r.ok) {
        const dados = lugaresGuardados();
        dados.push({ nome: infoLugar().nome, url: atual, place_id: '', situacao: r.msg, coletado_em: agora(), coletado_ms: Date.now(), linhas: [] });
        gravar(CHAVE_DADOS, dados);
      }
    }
    fila.pos += 1;
    if (fila.pos >= fila.itens.length || fila.parar) {
      fila.ativa = false;
      gravar(CHAVE_FILA, fila);
      status(`Fila concluída (${fila.pos} de ${fila.itens.length}). ${r.msg}`);
      atualizar();
      return;
    }
    gravar(CHAVE_FILA, fila);
    const pausa = sortear(PAUSA_ENTRE_LUGARES);
    status(`${fila.pos}/${fila.itens.length} · ${r.msg} Próximo em ${Math.round(pausa / 1000)} s.`);
    atualizar();
    await esperar(pausa);
    if (ler(CHAVE_FILA, {}).parar) { const f = ler(CHAVE_FILA, {}); f.ativa = false; gravar(CHAVE_FILA, f); status('Fila interrompida.'); return; }
    location.href = fila.itens[fila.pos];
  }

  // ---------- exportação ----------

  const COLS = ['nome', 'endereco', 'id_maps', 'place_id', 'lat', 'lng', 'nota_media', 'n_avaliacoes', 'dia_semana', 'ordem_dia', 'hora', 'ocupacao_relativa', 'ao_vivo', 'leitura', 'dia_inferido', 'permanencia', 'situacao', 'coletado_em', 'url'];

  // Registros por lugar → uma linha por barra (lugar sem barras: uma linha só).
  function linhasCsv(lugares) {
    const out = [];
    for (const l of lugares) {
      const { linhas = [], ...base } = l;
      if (!linhas.length) { out.push(base); continue; }
      for (const [d, h, p, v, le] of linhas) out.push({ ...base, dia_semana: DIAS[d], ordem_dia: d, hora: h, ocupacao_relativa: p, ao_vivo: v, leitura: le });
    }
    return out;
  }

  function celula(v) {
    const s = String(v ?? '');
    return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  }

  function baixarCsv() {
    const linhas = linhasCsv(lugaresGuardados());
    const texto = '﻿' + [COLS.join(';'), ...linhas.map((l) => COLS.map((c) => celula(l[c])).join(';'))].join('\r\n');
    const d = new Date();
    const p = (n) => String(n).padStart(2, '0');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([texto], { type: 'text/csv;charset=utf-8' }));
    a.download = `maps_horarios_pico_${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}.csv`;
    document.documentElement.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 2000);
    gravar(CHAVE_EXPORTACAO, Date.now());
    return linhas.length;
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

  const CSS = `
    #painel{position:fixed;top:12px;right:12px;z-index:2147483647;width:360px;
      max-height:calc(100vh - 24px);overflow:auto;box-sizing:border-box;
      background:#fff;color:#111;border:1px solid #ccc;border-radius:10px;
      box-shadow:0 4px 16px rgba(0,0,0,.18);font:13px/1.4 system-ui,sans-serif;padding:10px;
      --azul:#2563eb;--linha:rgba(128,128,128,.25)}
    @media (prefers-color-scheme:dark){#painel{background:#1e1e1e;color:#eee;border-color:#444;--azul:#3b82f6}}
    #painel.min>*:not(header){display:none}
    header{display:flex;justify-content:space-between;align-items:center;font-weight:700;cursor:pointer}
    p{margin:4px 0}
    svg.ico{width:14px;height:14px;flex:0 0 auto;vertical-align:-2px}
    .linha{display:flex;flex-wrap:wrap;gap:6px;margin:6px 0;align-items:center}
    button{flex:1 1 auto;display:inline-flex;align-items:center;justify-content:center;gap:4px;padding:5px 8px;
      border-radius:6px;border:1px solid #888;background:transparent;color:inherit;cursor:pointer;font:inherit;white-space:nowrap}
    button:disabled{opacity:.4;cursor:default}
    button.principal{background:var(--azul);border-color:var(--azul);color:#fff;font-weight:600}
    button.ic{flex:0 0 auto;padding:4px 7px}
    .tag{flex:0 0 auto;border-radius:999px;padding:2px 9px;font-size:12px;opacity:.55}
    .tag.on{opacity:1;background:var(--azul);border-color:var(--azul);color:#fff}
    select{font:inherit;color:inherit;background:transparent;border:1px solid #888;border-radius:6px;padding:3px;width:100%}
    select option,select optgroup{color:#111}
    option.falta{color:#1d4ed8} option.ok{color:#9ca3af} option.sem{color:#9ca3af;font-style:italic} option.falha{color:#b45309}
    textarea{width:100%;box-sizing:border-box;height:70px;font:12px monospace;margin-top:6px;
      background:transparent;color:inherit;border:1px solid #888;border-radius:6px}
    .rotulo{display:inline-flex;opacity:.7}
    .info{font-size:12px;display:inline-flex;align-items:center;gap:3px}
    .caixa{border:1px solid var(--linha);border-radius:8px;padding:6px 8px;margin:6px 0}
    .grade{display:grid;grid-template-columns:auto 1fr auto 1fr;gap:2px 8px;font-size:12px;align-items:center}
    .grade .k{opacity:.6}
    .grade .v{font-variant-numeric:tabular-nums}
    .grade .todo{grid-column:1 / -1;display:flex;align-items:center;gap:4px}
    .barra{display:inline-block;width:100%;height:7px;border:1px solid #888;border-radius:4px;overflow:hidden;box-sizing:border-box}
    .barra>span{display:block;height:100%;background:var(--azul)}
    details{margin:6px 0} summary{cursor:pointer;font-size:12px}
    .alerta{color:#b45309} .ok{color:#15803d}
    @media (prefers-color-scheme:dark){.alerta{color:#fbbf24}.ok{color:#4ade80}}
    .status{font-size:12px;opacity:.8}`;

  // Ícones Heroicons (MIT, Tailwind Labs), versão 2.1.5, 20/solid: só os caminhos do SVG;
  // "e:" marca fill-rule evenodd. Montados com createElementNS (sem innerHTML).
  const ICONES = {
    'arrow-down-tray': ["M10.75 2.75a.75.75 0 0 0-1.5 0v8.614L6.295 8.235a.75.75 0 1 0-1.09 1.03l4.25 4.5a.75.75 0 0 0 1.09 0l4.25-4.5a.75.75 0 0 0-1.09-1.03l-2.955 3.129V2.75Z", "M3.5 12.75a.75.75 0 0 0-1.5 0v2.5A2.75 2.75 0 0 0 4.75 18h10.5A2.75 2.75 0 0 0 18 15.25v-2.5a.75.75 0 0 0-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5Z"],
    'arrow-path': ["e:M15.312 11.424a5.5 5.5 0 0 1-9.201 2.466l-.312-.311h2.433a.75.75 0 0 0 0-1.5H3.989a.75.75 0 0 0-.75.75v4.242a.75.75 0 0 0 1.5 0v-2.43l.31.31a7 7 0 0 0 11.712-3.138.75.75 0 0 0-1.449-.39Zm1.23-3.723a.75.75 0 0 0 .219-.53V2.929a.75.75 0 0 0-1.5 0V5.36l-.31-.31A7 7 0 0 0 3.239 8.188a.75.75 0 1 0 1.448.389A5.5 5.5 0 0 1 13.89 6.11l.311.31h-2.432a.75.75 0 0 0 0 1.5h4.243a.75.75 0 0 0 .53-.219Z"],
    'chart-bar': ["M15.5 2A1.5 1.5 0 0 0 14 3.5v13a1.5 1.5 0 0 0 1.5 1.5h1a1.5 1.5 0 0 0 1.5-1.5v-13A1.5 1.5 0 0 0 16.5 2h-1ZM9.5 6A1.5 1.5 0 0 0 8 7.5v9A1.5 1.5 0 0 0 9.5 18h1a1.5 1.5 0 0 0 1.5-1.5v-9A1.5 1.5 0 0 0 10.5 6h-1ZM3.5 10A1.5 1.5 0 0 0 2 11.5v5A1.5 1.5 0 0 0 3.5 18h1A1.5 1.5 0 0 0 6 16.5v-5A1.5 1.5 0 0 0 4.5 10h-1Z"],
    'check': ["e:M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"],
    'exclamation-triangle': ["e:M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495ZM10 5a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 5Zm0 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"],
    'forward': ["M3.288 4.818A1.5 1.5 0 0 0 1 6.095v7.81a1.5 1.5 0 0 0 2.288 1.276l6.323-3.905c.155-.096.285-.213.389-.344v2.973a1.5 1.5 0 0 0 2.288 1.276l6.323-3.905a1.5 1.5 0 0 0 0-2.552l-6.323-3.906A1.5 1.5 0 0 0 10 6.095v2.972a1.506 1.506 0 0 0-.389-.343L3.288 4.818Z"],
    'map-pin': ["e:m9.69 18.933.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 0 0 .281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 1 0 3 9c0 3.492 1.698 5.988 3.355 7.584a13.731 13.731 0 0 0 2.273 1.765 11.842 11.842 0 0 0 .976.544l.062.029.018.008.006.003ZM10 11.25a2.25 2.25 0 1 0 0-4.5 2.25 2.25 0 0 0 0 4.5Z"],
    'minus': ["e:M4 10a.75.75 0 0 1 .75-.75h10.5a.75.75 0 0 1 0 1.5H4.75A.75.75 0 0 1 4 10Z"],
    'plus': ["M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z"],
    'trash': ["e:M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z"],
    'x-mark': ["M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z"],
  };
  function icone(nome) {
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', '0 0 20 20');
    svg.setAttribute('fill', 'currentColor');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('class', 'ico');
    for (const d of ICONES[nome] || []) {
      const p = document.createElementNS(ns, 'path');
      if (d.startsWith('e:')) { p.setAttribute('fill-rule', 'evenodd'); p.setAttribute('clip-rule', 'evenodd'); }
      p.setAttribute('d', d.replace(/^e:/, ''));
      svg.appendChild(p);
    }
    return svg;
  }
  const partes = (...xs) => xs.filter((x) => x !== '' && x != null && x !== false).map((x) => (typeof x === 'string' ? document.createTextNode(x) : x));
  // Botão com ícone e nome curto; o nome completo e a explicação vão no title (dica)
  const botao = (ico, rotulo, titulo, onclick, className = '') =>
    criar('button', { title: titulo, onclick, className }, partes(icone(ico), rotulo && criar('span', { textContent: rotulo })));
  function selo(rotulo, titulo, ligado, aoMudar) {
    const b = criar('button', { className: 'tag', textContent: rotulo, title: titulo });
    const pintar = (v) => { b.classList.toggle('on', v); b.setAttribute('aria-pressed', String(v)); };
    pintar(ligado);
    b.onclick = () => { const v = !b.classList.contains('on'); pintar(v); aoMudar(v); };
    return b;
  }
  const casaGrade = (classe, t) => criar('span', { className: classe, textContent: t });

  function status(t) { if (el.status) el.status.textContent = t; }

  const pidAtual = () => ler(CHAVE_ITEM, POP[0].id);

  // Rótulos do seletor (o menu nativo só aceita texto) e quadro-resumo.
  function atualizar() {
    if (!el.item) return;
    const lugares = lugaresGuardados();
    const reg = registrosPorCasa(lugares);
    const soFaltam = ler(CHAVE_SO_FALTAM, false);
    const atual = pidAtual();
    const n = { ok: 0, sem: 0, falha: 0, falta: 0 };
    for (const o of el.item.querySelectorAll('option')) {
      const p = POP.find((x) => x.id === o.value);
      const r = reg.get(p.id);
      const e = estadoCasa(r);
      n[e]++;
      o.className = e;
      o.textContent = e === 'ok' ? `✓ ${p.nome} (${r.linhas.length})` : e === 'sem' ? `– ${p.nome} (sem gráfico)`
        : e === 'falha' ? `! ${p.nome} (falhou)` : `○ ${p.nome}`;
      o.hidden = soFaltam && (e === 'ok' || e === 'sem') && p.id !== atual;
    }
    for (const g of el.item.querySelectorAll('optgroup')) g.hidden = [...g.querySelectorAll('option')].every((o) => o.hidden);
    el.item.value = atual;

    const prontas = n.ok + n.sem;
    const usados = new Set(reg.values());
    const fora = lugares.filter((l) => !usados.has(l)).length;
    const nLinhas = linhasCsv(lugares).length;
    const exportado = ler(CHAVE_EXPORTACAO, 0);
    const pend = lugares.filter((l) => (l.coletado_ms || 0) > exportado).length;
    const barra = criar('span', { className: 'barra' }, [criar('span')]);
    barra.firstChild.style.width = `${Math.round((100 * prontas) / POP.length)}%`;
    el.grade.replaceChildren(
      casaGrade('k', 'Prontas'), casaGrade('v', `${prontas} de ${POP.length}`),
      casaGrade('k', 'Faltam'), casaGrade(`v${n.falta + n.falha ? ' alerta' : ' ok'}`, `${n.falta + n.falha}${n.falha ? ` (${n.falha} falhou)` : ''}`),
      criar('span', { className: 'todo' }, [barra]),
      casaGrade('k', 'Com gráfico'), casaGrade('v', String(n.ok)),
      casaGrade('k', 'Sem gráfico'), casaGrade('v', String(n.sem)),
      casaGrade('k', 'Guardados'), casaGrade('v', `${lugares.length} lugares`),
      casaGrade('k', 'Linhas'), casaGrade('v', String(nLinhas)),
      ...(fora ? [criar('span', { className: 'todo', title: 'Lugares guardados que não casam com nenhuma das casas do B1 (fila de links, falhas antigas ou fora dos 300 m)' },
        partes(icone('exclamation-triangle'), `${fora} lugar(es) fora da população`))] : []),
    );
    el.pendentes.className = pend ? 'info alerta' : 'info ok';
    el.pendentes.replaceChildren(...partes(icone(pend ? 'exclamation-triangle' : 'check'), pend ? `${pend} fora do CSV` : 'CSV em dia'));
    el.pendentes.title = exportado ? `Último CSV: ${new Date(exportado).toLocaleString('pt-BR')}` : 'Nenhum CSV baixado ainda';
    const fila = ler(CHAVE_FILA, null);
    el.parar.disabled = !fila?.ativa;
    el.filaInfo.textContent = fila?.ativa ? `Fila em curso: ${fila.pos}/${fila.itens.length}.` : '';
    mostrarAberto();
  }

  // Lugar aberto × casa escolhida, pelas coordenadas da URL.
  function mostrarAberto() {
    const lugar = infoLugar();
    const esc = POP.find((p) => p.id === pidAtual());
    if (!el.aberto) return;
    if (!lugar.nome || incoerencia(false)) { el.aberto.className = 'info'; el.aberto.replaceChildren(...partes('Nenhum lugar aberto (ou carregando).')); return; }
    const casa = popDoLugar(lugar, esc?.id);
    const confere = casa && casa.id === esc?.id;
    el.aberto.className = confere ? 'info ok' : 'info alerta';
    el.aberto.replaceChildren(...partes(icone(confere ? 'check' : 'exclamation-triangle'),
      confere ? `Aberto: ${lugar.nome}` : casa ? `Aberto: ${lugar.nome} (é ${casa.nome})` : `Aberto: ${lugar.nome} (fora do B1)`));
  }

  function abrirCasa(p) {
    gravar(CHAVE_ITEM, p.id);
    gravar(CHAVE_ABRIR, { pid: p.id, em: Date.now() });
    status(`Abrindo ${p.nome}…`);
    location.href = urlCasa(p);
  }

  function montarPainel() {
    const capitais = [...new Set(POP.map((p) => p.capital))];
    el.item = criar('select', {
      title: 'Casas do B1, por capital: escolher uma abre no Maps e coleta. ✓ coletada (barras lidas), – sem gráfico de pico, ! falhou, ○ falta',
      // Escolher no menu abre a casa no Maps e coleta sozinho quando ela carrega
      // (mesmo efeito de "Abrir"); com a casa já aberta, só troca a escolha.
      onchange: () => {
        const p = POP.find((x) => x.id === el.item.value);
        if (popDoLugar(infoLugar(), p.id)?.id === p.id) { gravar(CHAVE_ITEM, p.id); atualizar(); return; }
        abrirCasa(p);
      },
    }, capitais.map((c) => criar('optgroup', { label: c },
      POP.filter((p) => p.capital === c).map((p) => criar('option', { value: p.id, textContent: p.nome })))));
    const soFaltam = selo('só as que faltam', 'Esconde no seletor as casas já coletadas e as sem gráfico', ler(CHAVE_SO_FALTAM, false),
      (v) => { gravar(CHAVE_SO_FALTAM, v); atualizar(); });
    const bAbrir = botao('map-pin', 'Abrir', 'Abrir: abre no Maps a casa escolhida e coleta sozinho quando carregar', () => abrirCasa(POP.find((p) => p.id === el.item.value)), 'ic');
    const bColetar = botao('chart-bar', 'Coletar', 'Coletar este lugar: lê o gráfico do lugar aberto e grava (substitui a coleta anterior do mesmo lugar)', async () => {
      bColetar.disabled = true;
      status('Lendo…');
      const r = await coletarEste(el.item.value);
      if (r.casa && r.casa.id !== el.item.value) gravar(CHAVE_ITEM, r.casa.id);
      status(r.msg);
      bColetar.disabled = false;
      atualizar();
    }, 'principal');
    const bProximo = botao('forward', 'Próximo', 'Próxima que falta: abre a próxima casa sem coleta (ou cuja coleta falhou), na ordem do seletor, e coleta sozinho quando carregar', () => {
      const p = proximaQueFalta(lugaresGuardados(), el.item.value);
      if (!p) { status('Todas as casas do B1 estão coletadas.'); return; }
      abrirCasa(p);
    });
    el.aberto = criar('span', { className: 'info' });
    el.grade = criar('div', { className: 'grade' });
    el.pendentes = criar('span');
    el.status = criar('p', { className: 'status' });
    el.filaInfo = criar('p', { className: 'status' });
    el.fila = criar('textarea', { placeholder: 'Um link do Maps ou nome + cidade por linha' });
    const bFila = botao('arrow-path', 'Coletar fila', 'Coletar fila: abre cada link da lista, lê o gráfico e passa ao próximo (pausa de 4 a 8 s)', () => {
      const itens = el.fila.value.split('\n').map(paraUrl).filter(Boolean);
      if (!itens.length) return;
      gravar(CHAVE_FILA, { ativa: true, parar: false, pos: 0, itens });
      location.href = itens[0];
    });
    el.parar = botao('x-mark', 'Parar', 'Parar fila: para depois do lugar atual', () => { const f = ler(CHAVE_FILA, {}); f.parar = true; f.ativa = false; gravar(CHAVE_FILA, f); status('A fila para depois do lugar atual.'); atualizar(); });
    const bCsv = botao('arrow-down-tray', 'CSV', 'Baixar CSV: uma linha por lugar × dia × hora, com tudo o que está guardado', () => { status(`CSV baixado (${baixarCsv()} linhas).`); atualizar(); }, 'ic');
    const bLimpar = botao('trash', '', 'Limpar: apaga os horários de pico guardados', () => {
      const pend = lugaresGuardados().filter((l) => (l.coletado_ms || 0) > ler(CHAVE_EXPORTACAO, 0)).length;
      if (!confirm(`Apagar os horários de pico guardados?${pend ? ` ${pend} lugar(es) ainda não estão em nenhum CSV.` : ''}`)) return;
      gravar(CHAVE_DADOS, []);
      status('Guardados apagados.');
      atualizar();
    }, 'ic');

    const minimizar = criar('span', { className: 'rotulo' }, [icone('minus')]);
    const cabecalho = criar('header', {}, [criar('span', { textContent: 'Horários de pico' }), minimizar]);
    const painel = criar('div', { id: 'painel' }, [
      cabecalho,
      el.item,
      criar('div', { className: 'linha' }, [soFaltam, bAbrir, bProximo, bColetar]),
      criar('div', { className: 'linha' }, [el.aberto]),
      criar('div', { className: 'caixa' }, [el.grade]),
      criar('div', { className: 'linha' }, [bCsv, bLimpar, el.pendentes]),
      criar('details', {}, [criar('summary', { textContent: 'Fila de links' }), el.fila,
        criar('div', { className: 'linha' }, [bFila, el.parar]), el.filaInfo]),
      el.status,
    ]);
    cabecalho.onclick = () => { painel.classList.toggle('min'); minimizar.replaceChildren(icone(painel.classList.contains('min') ? 'plus' : 'minus')); };

    hospedeiro = criar('div', { id: 'tcc-picos-hospedeiro' });
    const raiz = hospedeiro.attachShadow({ mode: 'open' });
    raiz.appendChild(criar('style', { textContent: CSS }));
    raiz.appendChild(painel);
  }

  // Ao abrir um lugar da população, o seletor passa para ele, quando painel e URL já
  // mostram o mesmo lugar (a URL de busca traz o centro do mapa, não o lugar).
  let urlVista = '';
  let urlResolvida = '';
  function verificar() {
    if (!hospedeiro) { montarPainel(); atualizar(); }
    if (!hospedeiro.isConnected) document.documentElement.appendChild(hospedeiro);
    if (location.href !== urlVista) { urlVista = location.href; atualizar(); }
    if (urlResolvida !== location.href && !incoerencia(false)) {
      urlResolvida = location.href;
      const casa = popDoLugar(infoLugar(), pidAtual());
      if (casa && casa.id !== pidAtual()) gravar(CHAVE_ITEM, casa.id);
      atualizar();
    }
  }

  console.info('[Horários de pico] carregado');
  const migrado = migrarLocalStorage();
  verificar();
  if (migrado) status(migrado);
  setInterval(() => { try { verificar(); } catch (e) { console.error('[Horários de pico]', e); } }, 1500);
  continuarFila().catch((e) => status(`Erro na fila: ${e.message}`));
  if (!ler(CHAVE_FILA, null)?.ativa) coletarAoAbrir().catch((e) => status(`Erro na coleta: ${e.message}`));
})();
