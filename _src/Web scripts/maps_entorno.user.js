// ==UserScript==
// @name         Entorno no Google Maps (TCC Luderia)
// @namespace    tcc-luderia
// @version      2026.10.13-1
// @description  Conta estações de metrô, estações de VLT/BRT e shoppings a 500 m e 1000 m de cada estabelecimento, buscando no Google Maps em volta da coordenada; coleta uma fila e exporta CSV.
// @match        https://www.google.com/maps/*
// @match        https://www.google.com.br/maps/*
// @run-at       document-idle
// @noframes
// @grant        none
// ==/UserScript==

/*
 * Bloco B1, entorno dos estabelecimentos: âncoras de fluxo (cap. 5 e 7.1).
 *
 * Para cada estabelecimento da fila (place_id, nome, lat, lng), o script faz
 * buscas do Maps centradas na coordenada, lê todos os resultados da lista
 * (nome, categoria do Maps, coordenada, avaliações), calcula a distância em
 * linha reta (haversine) e conta os que caem a até 500 m e 1000 m.
 *
 * Buscas: "estação de metrô", "estação BRT", "estação VLT", "shopping center".
 * A busca só abre a consulta; cada resultado vai para UM grupo pela própria
 * categoria e nome no Maps (classificar), nunca pela busca que o trouxe. Um
 * resultado que aparece em duas buscas conta uma vez (chave: place_id, senão
 * id do Maps, senão nome + coordenada).
 *
 *   metro    categoria com "metrô"/"subway", ou nome com "metrô" e categoria
 *            de estação. Trem metropolitano (CPTM, CBTU como trem) fica fora,
 *            como no collect_B1_entorno_osm.py.
 *   vlt_brt  categoria com VLT/BRT/bonde/light rail, ou nome com VLT/BRT e
 *            categoria de transporte (em Salvador o Maps chama a estação de
 *            BRT de "Serviço de transporte").
 *   shopping categoria exatamente "Shopping center"/"Shopping". O Maps também
 *            dá essa categoria a galerias e prédios comerciais ("Empresarial
 *            104", "Free Shop" em Salvador); por isso o resumo conta à parte
 *            os de porte, com LIMIAR_AVALIACOES_SHOPPING avaliações ou mais
 *            (proxy de porte, a calibrar no build a partir do CSV de
 *            resultados, que guarda todos).
 *
 * Censura: a lista do Maps tem teto (10 sem login, 20 por página com login) e
 * não vem em ordem de distância. Se a lista lota sem chegar ao fim, o script
 * refaz a busca em quatro quadrantes com zoom maior (ZOOM + 1, centros a
 * ±DESLOCAMENTO_QUADRANTE_M) e une os resultados. Se um quadrante também
 * lota, a linha do resumo sai com censura_possivel = sim.
 *
 * Uso:
 *  - "Carregar CSV": arquivo com colunas place_id, nome, lat, lng (o
 *    B1_entorno.csv serve); ou cole linhas "place_id;nome;lat;lng";
 *  - "Este lugar": usa o lugar aberto no Maps (coordenada da URL).
 *  - Logado no Google, a lista vem maior e a coleta é mais rápida.
 *
 * CSVs (";" e UTF-8 com BOM):
 *  - maps_entorno_resumo_AAAA-MM-DD.csv: um estabelecimento por linha;
 *  - maps_entorno_resultados_AAAA-MM-DD.csv: um resultado lido por linha,
 *    com a distância e o grupo atribuído, para auditar a classificação.
 *    Colunas qt_*_500m estão contidas em qt_*_1000m (raios aninhados, não
 *    somam).
 */

(function () {
  'use strict';

  const CHAVE_DADOS = 'tcc-entorno-dados';
  const CHAVE_FILA = 'tcc-entorno-fila';
  const CHAVE_POSICAO = 'tcc-entorno-posicao';
  const RAIOS_M = [500, 1000];
  const ZOOM = 15;
  const DESLOCAMENTO_QUADRANTE_M = 600;
  const LIMIAR_AVALIACOES_SHOPPING = 1000;
  const PAUSA_ENTRE_BUSCAS = [3000, 6000];
  const CONSULTAS = ['estação de metrô', 'estação BRT', 'estação VLT', 'shopping center'];
  const GRUPOS = { metro: 'estacoes_metro', vlt_brt: 'estacoes_vlt_brt', shopping: 'shoppings' };

  // ---------- utilidades ----------

  const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
  const sortear = ([a, b]) => a + Math.random() * (b - a);
  const semAcento = (t) => String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

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

  // ---------- classificação: um grupo por resultado, pelo próprio atributo ----------

  function classificar(nome, categoria) {
    const n = semAcento(nome);
    const c = semAcento(categoria).trim();
    if (/^(shopping|shopping center|shopping mall|outlet)$/.test(c)) return 'shopping';
    if (/metro|subway/.test(c)) return 'metro';
    const transporte = /transporte|estacao|parada|ponto|terminal|onibus|trem|bonde/.test(c);
    if (/\b(brt|vlt)\b|veiculo leve|light rail|bonde|tram\b/.test(c)) return 'vlt_brt';
    if (/\b(brt|vlt)\b/.test(n) && transporte) return 'vlt_brt';
    if (/\bmetro\b/.test(n) && /estacao|transporte/.test(c)) return 'metro';
    return 'outro';
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

  function resultadosNaTela() {
    return [...document.querySelectorAll('a.hfpxzc')].map((a) => lerCartao(a.getAttribute('aria-label'), a.parentElement?.innerText, a.href));
  }

  // Espera a busca: lista, lugar único (h1) ou "nenhum resultado".
  async function esperarBusca() {
    for (let i = 0; i < 30; i++) {
      if (lista() && document.querySelector('a.hfpxzc')) return 'lista';
      if (document.querySelector('h1.DUwDvf') && /\/maps\/place\//.test(location.href)) return 'lugar';
      if (/n[aã]o encontrou|nenhum resultado|no results|can't find/i.test(document.querySelector('div[role="main"]')?.innerText || '')) return 'vazio';
      await esperar(500);
    }
    return lista() ? 'lista' : 'vazio';
  }

  async function lerBusca() {
    const tipo = await esperarBusca();
    await esperar(1200);
    if (tipo === 'vazio') return { itens: [], lotou: false };
    if (tipo === 'lugar') {
      const nome = document.querySelector('h1.DUwDvf')?.innerText || '';
      const categoria = document.querySelector('button[jsaction*="category"]')?.innerText || '';
      const resumo = document.querySelector('div.F7nice')?.innerText || '';
      const avaliacoes = (resumo.match(/\(([\d.\s]+)\)/) || [])[1]?.replace(/\D/g, '') || '';
      return { itens: [{ nome, categoria_maps: categoria, n_avaliacoes: avaliacoes, ...lerHref(location.href) }], lotou: false };
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
    return { itens, lotou: precisaSubdividir(itens.length, fimDaLista(feed)) };
  }

  // Lista com 10 ou mais itens sem a marca de fim pode ter cortado resultados.
  function precisaSubdividir(n, chegouAoFim) { return n >= 10 && !chegouAoFim; }

  // ---------- plano de buscas e resumo ----------

  function tarefasIniciais() {
    return CONSULTAS.map((consulta) => ({ consulta, zoom: ZOOM, norte: 0, leste: 0, quadrante: '' }));
  }

  function quadrantes(consulta) {
    const d = DESLOCAMENTO_QUADRANTE_M;
    return [[d, -d, 'NO'], [d, d, 'NE'], [-d, -d, 'SO'], [-d, d, 'SE']]
      .map(([norte, leste, q]) => ({ consulta, zoom: ZOOM + 1, norte, leste, quadrante: q }));
  }

  function chave(r) {
    return r.place_id || r.id_maps || `${semAcento(r.nome)}@${r.lat?.toFixed(4)},${r.lng?.toFixed(4)}`;
  }

  // Une os resultados das buscas de um estabelecimento: cada um entra uma vez.
  function unir(resultados) {
    const vistos = new Map();
    for (const r of resultados) {
      const k = chave(r);
      const ja = vistos.get(k);
      if (ja) { ja.consultas = [...new Set([...ja.consultas.split(' | '), r.consulta])].join(' | '); continue; }
      vistos.set(k, { ...r, consultas: r.consulta });
    }
    return [...vistos.values()];
  }

  function resumir(local, resultados, extras = {}) {
    const linha = { place_id: local.place_id, nome: local.nome, lat: local.lat, lng: local.lng };
    const porGrupo = { metro: [], vlt_brt: [], shopping: [] };
    for (const r of resultados) if (porGrupo[r.grupo]) porGrupo[r.grupo].push(r);
    for (const [grupo, nomeCol] of Object.entries(GRUPOS)) {
      const itens = porGrupo[grupo];
      for (const raio of RAIOS_M) linha[`qt_${nomeCol}_${raio}m`] = itens.filter((r) => r.distancia_m <= raio).length;
      if (grupo === 'shopping') {
        const grandes = itens.filter((r) => +r.n_avaliacoes >= LIMIAR_AVALIACOES_SHOPPING);
        for (const raio of RAIOS_M) linha[`qt_shoppings_${LIMIAR_AVALIACOES_SHOPPING}_aval_${raio}m`] = grandes.filter((r) => r.distancia_m <= raio).length;
      }
      linha[`dist_${nomeCol}_mais_proxima_lida_m`] = itens.length ? Math.min(...itens.map((r) => r.distancia_m)) : '';
    }
    return { ...linha, ...extras };
  }

  // ---------- fila ----------

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

  // Aceita CSV com cabeçalho (place_id, nome, lat, lng em qualquer ordem) ou
  // linhas soltas "place_id;nome;lat;lng".
  function lerFila(texto) {
    const linhas = String(texto || '').replace(/^﻿/, '').split(/\r?\n/).filter((l) => l.trim());
    if (!linhas.length) return [];
    const sep = (linhas[0].match(/;/g) || []).length >= (linhas[0].match(/,/g) || []).length ? ';' : ',';
    const cab = campos(linhas[0], sep).map(semAcento);
    const temCab = cab.includes('lat') && cab.includes('lng');
    const idx = temCab
      ? { place_id: cab.indexOf('place_id'), nome: cab.indexOf('nome'), lat: cab.indexOf('lat'), lng: cab.indexOf('lng') }
      : { place_id: 0, nome: 1, lat: 2, lng: 3 };
    const vistos = new Set();
    const out = [];
    for (const l of temCab ? linhas.slice(1) : linhas) {
      const c = campos(l, sep);
      const lat = parseFloat(String(c[idx.lat] ?? '').replace(',', '.'));
      const lng = parseFloat(String(c[idx.lng] ?? '').replace(',', '.'));
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
      const local = { place_id: idx.place_id >= 0 ? c[idx.place_id] || '' : '', nome: idx.nome >= 0 ? c[idx.nome] || '' : '', lat, lng };
      const k = local.place_id || `${lat},${lng}`;
      if (vistos.has(k)) continue;
      vistos.add(k);
      out.push(local);
    }
    return out;
  }

  function localAberto() {
    const nome = document.querySelector('h1.DUwDvf')?.innerText.trim() || '';
    const h = lerHref(location.href);
    if (!nome || h.lat == null) return null;
    return { place_id: h.place_id, nome, lat: h.lat, lng: h.lng };
  }

  function iniciarFila(locais) {
    const dados = ler(CHAVE_DADOS, { resumo: [], resultados: [] });
    const feitos = new Set(dados.resumo.map((r) => r.place_id || `${r.lat},${r.lng}`));
    const pendentes = locais.filter((l) => !feitos.has(l.place_id || `${l.lat},${l.lng}`));
    if (!pendentes.length) { status('Todos já coletados. "Limpar" para refazer.'); return; }
    const fila = { ativa: true, parar: false, locais: pendentes, pos: 0, tarefas: tarefasIniciais(), tarefa: 0, lidos: [], buscas: 0, subdivididas: [], censura: false };
    gravar(CHAVE_FILA, fila);
    irPara(fila);
  }

  function irPara(fila) {
    const local = fila.locais[fila.pos];
    const t = fila.tarefas[fila.tarefa];
    const [lat, lng] = deslocar(local.lat, local.lng, t.norte, t.leste);
    location.href = urlBusca(t.consulta, lat, lng, t.zoom);
  }

  function fecharLocal(fila) {
    const local = fila.locais[fila.pos];
    const coletado_em = agora();
    const unidos = unir(fila.lidos).map((r) => ({
      origem_place_id: local.place_id,
      origem_nome: local.nome,
      ...r,
      grupo: classificar(r.nome, r.categoria_maps),
      distancia_m: distancia(local.lat, local.lng, r.lat, r.lng),
      coletado_em,
    }));
    const dados = ler(CHAVE_DADOS, { resumo: [], resultados: [] });
    dados.resultados.push(...unidos);
    dados.resumo.push(resumir(local, unidos, {
      buscas: fila.buscas,
      consultas_subdivididas: fila.subdivididas.join(' | '),
      censura_possivel: fila.censura ? 'sim' : 'não',
      resultados_lidos: unidos.length,
      coletado_em,
    }));
    gravar(CHAVE_DADOS, dados);
  }

  async function continuarFila() {
    const fila = ler(CHAVE_FILA, null);
    if (!fila || !fila.ativa) return;
    const t = fila.tarefas[fila.tarefa];
    status(`${fila.pos + 1}/${fila.locais.length} · lendo "${t.consulta}"${t.quadrante ? ` (${t.quadrante})` : ''}…`);
    const { itens, lotou } = await lerBusca();
    fila.buscas += 1;
    fila.lidos.push(...itens.map((r) => ({ ...r, consulta: t.consulta + (t.quadrante ? ` ${t.quadrante}` : '') })));
    if (lotou && !t.quadrante) { fila.tarefas.push(...quadrantes(t.consulta)); fila.subdivididas.push(t.consulta); }
    if (lotou && t.quadrante) fila.censura = true;

    fila.tarefa += 1;
    if (fila.tarefa >= fila.tarefas.length) {
      fecharLocal(fila);
      Object.assign(fila, { pos: fila.pos + 1, tarefas: tarefasIniciais(), tarefa: 0, lidos: [], buscas: 0, subdivididas: [], censura: false });
    }
    const parar = ler(CHAVE_FILA, {}).parar;
    if (fila.pos >= fila.locais.length || parar) {
      fila.ativa = false;
      gravar(CHAVE_FILA, fila);
      status(parar ? 'Fila interrompida.' : `Fila concluída: ${fila.pos} estabelecimentos.`);
      atualizarResumo();
      if (!parar) baixarTudo();
      return;
    }
    gravar(CHAVE_FILA, fila);
    atualizarResumo();
    await esperar(sortear(PAUSA_ENTRE_BUSCAS));
    if (ler(CHAVE_FILA, {}).parar) { fila.ativa = false; gravar(CHAVE_FILA, fila); status('Fila interrompida.'); atualizarResumo(); return; }
    irPara(fila);
  }

  // ---------- exportação ----------

  const COLS_RESULTADOS = ['origem_place_id', 'origem_nome', 'nome', 'categoria_maps', 'grupo', 'distancia_m', 'n_avaliacoes', 'lat', 'lng', 'place_id', 'id_maps', 'consultas', 'coletado_em'];

  function colsResumo() {
    const cols = ['place_id', 'nome', 'lat', 'lng'];
    for (const nomeCol of Object.values(GRUPOS)) for (const raio of RAIOS_M) cols.push(`qt_${nomeCol}_${raio}m`);
    for (const raio of RAIOS_M) cols.push(`qt_shoppings_${LIMIAR_AVALIACOES_SHOPPING}_aval_${raio}m`);
    for (const nomeCol of Object.values(GRUPOS)) cols.push(`dist_${nomeCol}_mais_proxima_lida_m`);
    return [...cols, 'resultados_lidos', 'buscas', 'consultas_subdivididas', 'censura_possivel', 'coletado_em'];
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

  function baixarTudo() {
    const dados = ler(CHAVE_DADOS, { resumo: [], resultados: [] });
    const dia = new Date().toISOString().slice(0, 10);
    baixar(csv(dados.resumo, colsResumo()), `maps_entorno_resumo_${dia}.csv`);
    setTimeout(() => baixar(csv(dados.resultados, COLS_RESULTADOS), `maps_entorno_resultados_${dia}.csv`), 800);
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

  function atualizarResumo() {
    if (!el.resumo) return;
    const dados = ler(CHAVE_DADOS, { resumo: [], resultados: [] });
    const fila = ler(CHAVE_FILA, null);
    el.resumo.textContent = `${dados.resumo.length} estabelecimentos guardados (${dados.resultados.length} resultados lidos).` +
      (fila?.ativa ? ` Fila: ${fila.pos + 1}/${fila.locais.length}, busca ${fila.tarefa + 1}/${fila.tarefas.length}.` : '');
    el.parar.disabled = !fila?.ativa;
  }

  const CSS = `
    #painel{position:fixed;top:12px;right:12px;z-index:2147483647;width:330px;
      max-height:calc(100vh - 24px);overflow:auto;box-sizing:border-box;
      background:#fff;color:#111;border:1px solid #ccc;border-radius:10px;
      box-shadow:0 4px 16px rgba(0,0,0,.18);font:13px/1.4 system-ui,sans-serif;padding:10px}
    @media (prefers-color-scheme:dark){#painel{background:#1e1e1e;color:#eee;border-color:#444}}
    #painel.min>*:not(header){display:none}
    header{display:flex;justify-content:space-between;align-items:center;font-weight:700;cursor:grab;user-select:none}
    p{margin:6px 0}
    .linha{display:flex;flex-wrap:wrap;gap:6px;margin:6px 0}
    button{flex:1 1 auto;padding:5px 8px;border-radius:6px;border:1px solid #888;
      background:transparent;color:inherit;cursor:pointer;font:inherit}
    button:disabled{opacity:.4;cursor:default}
    textarea{width:100%;box-sizing:border-box;height:70px;font:12px monospace;
      background:transparent;color:inherit;border:1px solid #888;border-radius:6px}
    .status{font-size:12px;opacity:.8}`;

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

  function montarPainel() {
    const botao = (texto, fn) => criar('button', { textContent: texto, onclick: fn });
    el.resumo = criar('p');
    el.status = criar('p', { className: 'status' });
    el.fila = criar('textarea', { placeholder: 'place_id;nome;lat;lng (uma por linha), ou CSV com cabeçalho' });
    const arquivo = criar('input', { type: 'file', accept: '.csv,text/csv', hidden: true });
    arquivo.onchange = async () => {
      const f = arquivo.files[0];
      if (!f) return;
      el.fila.value = await f.text();
      status(`${lerFila(el.fila.value).length} estabelecimentos com coordenada em ${f.name}.`);
      arquivo.value = '';
    };
    const bArquivo = botao('Carregar CSV', () => arquivo.click());
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
    const bCsv = botao('Exportar CSVs', baixarTudo);
    const bLimpar = botao('Limpar', () => {
      if (!confirm('Apagar o entorno guardado?')) return;
      gravar(CHAVE_DADOS, { resumo: [], resultados: [] });
      gravar(CHAVE_FILA, null);
      atualizarResumo();
    });

    const sinal = criar('span', { textContent: '–' });
    const cabecalho = criar('header', { title: 'Arraste para mover; duplo clique volta ao canto' }, [criar('span', { textContent: 'Entorno (metrô, VLT/BRT, shopping)' }), sinal]);
    const painel = criar('div', { id: 'painel' }, [
      cabecalho,
      el.resumo,
      el.fila,
      criar('div', { className: 'linha' }, [bArquivo, bEste]),
      criar('div', { className: 'linha' }, [bFila, el.parar]),
      criar('div', { className: 'linha' }, [bCsv, bLimpar]),
      el.status,
      arquivo,
    ]);
    arrastavel(painel, cabecalho, () => { painel.classList.toggle('min'); sinal.textContent = painel.classList.contains('min') ? '+' : '–'; });
    posicionar(painel);

    hospedeiro = criar('div', { id: 'tcc-entorno-hospedeiro' });
    const raiz = hospedeiro.attachShadow({ mode: 'open' });
    raiz.appendChild(criar('style', { textContent: CSS }));
    raiz.appendChild(painel);
  }

  function garantirPainel() {
    if (!hospedeiro) { montarPainel(); atualizarResumo(); }
    if (!hospedeiro.isConnected) document.documentElement.appendChild(hospedeiro);
  }

  console.info('[Entorno do Maps] carregado');
  garantirPainel();
  setInterval(() => { try { garantirPainel(); } catch (e) { console.error('[Entorno do Maps]', e); } }, 1500);
  continuarFila().catch((e) => status(`Erro na fila: ${e.message}`));
})();
