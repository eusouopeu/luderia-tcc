// ==UserScript==
// @name         Horários de pico do Google Maps (TCC Luderia)
// @namespace    tcc-luderia
// @version      2026.10.11-1
// @description  Lê o gráfico "Horários de pico" (ocupação relativa por dia e hora), o "ao vivo" e o tempo de permanência de lugares do Google Maps; coleta uma fila de lugares e exporta CSV.
// @match        https://www.google.com/maps/*
// @match        https://www.google.com.br/maps/*
// @run-at       document-idle
// @noframes
// @grant        none
// ==/UserScript==

/*
 * Uso pessoal, para as premissas de ocupação e giro (cap. 7 e 9).
 *
 * O que o Google mostra é um ÍNDICE RELATIVO (0–100, onde 100 é a hora mais cheia
 * da semana daquele lugar), não pessoas. Serve para o formato da curva semanal e,
 * calibrado com a contagem do Bloco D na São Jogue, para converter em ocupação.
 *
 * Uso:
 *  - Abra um lugar no Maps e clique em "Coletar este lugar"; ou
 *  - cole na fila links do Maps (ou nomes para busca), um por linha, e clique em
 *    "Coletar fila". O script abre cada lugar, lê o gráfico e passa ao próximo,
 *    com pausa de 4 a 8 s. Os resultados ficam guardados no navegador até
 *    "Limpar", mesmo fechando a aba.
 *
 * CSV (";" e UTF-8 com BOM): uma linha por lugar × dia × hora.
 */

(function () {
  'use strict';

  const CHAVE_DADOS = 'tcc-picos-resultados';
  const CHAVE_FILA = 'tcc-picos-fila';
  const PAUSA_ENTRE_LUGARES = [4000, 8000];
  const DIAS = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
  const DIAS_RE = [/doming|sunday/i, /segunda|monday/i, /terca|terça|tuesday/i, /quarta|wednesday/i, /quinta|thursday/i, /sexta|friday/i, /sabado|sábado|saturday/i];

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

  // ---------- leitura do lugar ----------

  function infoLugar() {
    const url = location.href;
    const nome = document.querySelector('h1.DUwDvf, div[role="main"] h1')?.innerText.trim() || '';
    const endereco = (document.querySelector('button[data-item-id="address"]')?.getAttribute('aria-label') || '')
      .replace(/^(endereço|address):\s*/i, '').trim();
    const cid = (url.match(/!1s(0x[0-9a-f]+:0x[0-9a-f]+)/i) || [])[1] || '';
    const coord = url.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/) || url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/) || [];
    const resumo = document.querySelector('div.F7nice')?.innerText || '';
    const nota = (resumo.match(/(\d[.,]\d)/) || [])[1]?.replace(',', '.') || '';
    const volume = (resumo.match(/\(([\d.,\s]+)\)/) || [])[1]?.replace(/\D/g, '') || '';
    return { nome, endereco, id_maps: cid, lat: coord[1] || '', lng: coord[2] || '', nota_media: nota, n_avaliacoes: volume, url };
  }

  function painelPrincipal() {
    return document.querySelector('div[role="main"]') || document.body;
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

  // "Normalmente 45% cheio às 19 h." / "45% busy at 7 PM." / "Normalmente 45% cheio às 19:00."
  function lerBarra(rotulo) {
    const t = semAcento(rotulo);
    let m = t.match(/(\d{1,3})\s*%.*?\b(?:as|a)\s*(\d{1,2})(?::\d{2})?\s*h?\b/);
    if (m) return { pct: +m[1], hora: +m[2] };
    m = t.match(/(\d{1,3})\s*%\s*busy at\s*(\d{1,2})\s*(am|pm)/);
    if (m) return { pct: +m[1], hora: (+m[2] % 12) + (m[3] === 'pm' ? 12 : 0) };
    return null;
  }

  function lerPicos() {
    const raiz = painelPrincipal();
    const barras = [...raiz.querySelectorAll('[aria-label]')]
      .map((e) => ({ e, b: lerBarra(e.getAttribute('aria-label')) }))
      .filter((x) => x.b);
    if (!barras.length) {
      // Diagnóstico: se o Google mudou o texto das barras, os rótulos com "%" aparecem no console.
      console.info('[Horários de pico] rótulos com %:', [...raiz.querySelectorAll('[aria-label*="%"]')].map((e) => e.getAttribute('aria-label')));
      const limitada = /visualiza[cç][aã]o limitada|limited view/i.test(raiz.innerText);
      return { linhas: [], aviso: limitada ? 'Visualização limitada do Maps (sem login): o gráfico não aparece. Entre na conta.' : 'Sem gráfico de horários de pico neste lugar (ou ainda não carregou).' };
    }

    // Agrupa por dia: o elemento que reúne as barras de um dia (pai comum).
    const grupos = new Map();
    for (const { e, b } of barras) {
      const g = e.parentElement;
      if (!grupos.has(g)) grupos.set(g, []);
      grupos.get(g).push(b);
    }
    const listas = [...grupos.entries()];
    let inferido = false;
    const linhas = [];
    listas.forEach(([g, bs], i) => {
      // Rótulo do dia no próprio grupo ou num ancestro próximo; senão, a ordem do Maps (domingo primeiro).
      let dia = -1;
      for (let a = g, k = 0; a && k < 4 && dia < 0; a = a.parentElement, k++) {
        const r = a.getAttribute?.('aria-label') || '';
        dia = DIAS_RE.findIndex((re) => re.test(r));
      }
      if (dia < 0) { dia = i % 7; inferido = true; }
      for (const b of bs) linhas.push({ dia_semana: DIAS[dia], ordem_dia: dia, hora: b.hora, ocupacao_relativa: b.pct });
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
      if (alvo) alvo.ao_vivo = aoVivo;
      else linhas.push({ dia_semana: DIAS[d.getDay()], ordem_dia: d.getDay(), hora: d.getHours(), ocupacao_relativa: '', ao_vivo: aoVivo });
    }

    const texto = raiz.innerText;
    const permanencia = (texto.match(/(As pessoas (normalmente|costumam)[^\n]*|Normalmente, as pessoas passam[^\n]*|People typically spend[^\n]*)/i) || [])[0] || '';
    return { linhas, aviso: inferido ? 'Dia da semana inferido pela ordem do Maps (domingo primeiro); confira um dia no gráfico.' : '', permanencia, dia_inferido: inferido ? 'sim' : '' };
  }

  async function coletarEste() {
    await abrirVisaoGeral();
    await percorrerPainel();
    const lugar = infoLugar();
    if (!lugar.nome) return { ok: false, msg: 'Nenhum lugar aberto.' };
    const { linhas, aviso, permanencia = '', dia_inferido = '' } = lerPicos();
    const coletado_em = agora();
    const dados = ler(CHAVE_DADOS, []).filter((l) => !(l.id_maps && l.id_maps === lugar.id_maps) && l.nome !== lugar.nome);
    if (!linhas.length) dados.push({ ...lugar, permanencia, situacao: 'sem horários de pico', coletado_em });
    for (const l of linhas) dados.push({ ...lugar, ...l, ao_vivo: l.ao_vivo ?? '', permanencia, dia_inferido, situacao: 'ok', coletado_em });
    gravar(CHAVE_DADOS, dados);
    return { ok: true, msg: `${lugar.nome}: ${linhas.length ? `${linhas.length} barras lidas` : 'sem horários de pico'}. ${aviso}` };
  }

  // ---------- fila ----------

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
      const dados = ler(CHAVE_DADOS, []);
      dados.push({ nome: '', url: atual, situacao: 'não abriu um lugar (busca com vários resultados?)', coletado_em: agora() });
      gravar(CHAVE_DADOS, dados);
      r = { msg: `Não abriu um lugar: ${atual}` };
    } else {
      r = await coletarEste();
    }
    fila.pos += 1;
    if (fila.pos >= fila.itens.length || fila.parar) {
      fila.ativa = false;
      gravar(CHAVE_FILA, fila);
      status(`Fila concluída (${fila.pos} de ${fila.itens.length}). ${r.msg}`);
      atualizarResumo();
      return;
    }
    gravar(CHAVE_FILA, fila);
    const pausa = sortear(PAUSA_ENTRE_LUGARES);
    status(`${fila.pos}/${fila.itens.length} · ${r.msg} Próximo em ${Math.round(pausa / 1000)} s.`);
    atualizarResumo();
    await esperar(pausa);
    if (ler(CHAVE_FILA, {}).parar) { const f = ler(CHAVE_FILA, {}); f.ativa = false; gravar(CHAVE_FILA, f); status('Fila interrompida.'); return; }
    location.href = fila.itens[fila.pos];
  }

  // ---------- exportação ----------

  const COLS = ['nome', 'endereco', 'id_maps', 'lat', 'lng', 'nota_media', 'n_avaliacoes', 'dia_semana', 'ordem_dia', 'hora', 'ocupacao_relativa', 'ao_vivo', 'dia_inferido', 'permanencia', 'situacao', 'coletado_em', 'url'];

  function celula(v) {
    const s = String(v ?? '');
    return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  }

  function baixarCsv() {
    const dados = ler(CHAVE_DADOS, []);
    const texto = '﻿' + [COLS.join(';'), ...dados.map((l) => COLS.map((c) => celula(l[c])).join(';'))].join('\r\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([texto], { type: 'text/csv;charset=utf-8' }));
    a.download = `maps_horarios_pico_${new Date().toISOString().slice(0, 10)}.csv`;
    document.documentElement.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 2000);
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
    const dados = ler(CHAVE_DADOS, []);
    const lugares = new Set(dados.map((l) => l.id_maps || l.nome || l.url)).size;
    const fila = ler(CHAVE_FILA, null);
    el.resumo.textContent = `${lugares} lugares guardados (${dados.length} linhas).` +
      (fila?.ativa ? ` Fila em curso: ${fila.pos}/${fila.itens.length}.` : '');
    el.parar.disabled = !fila?.ativa;
  }

  const CSS = `
    #painel{position:fixed;top:12px;right:12px;z-index:2147483647;width:330px;
      max-height:calc(100vh - 24px);overflow:auto;box-sizing:border-box;
      background:#fff;color:#111;border:1px solid #ccc;border-radius:10px;
      box-shadow:0 4px 16px rgba(0,0,0,.18);font:13px/1.4 system-ui,sans-serif;padding:10px}
    @media (prefers-color-scheme:dark){#painel{background:#1e1e1e;color:#eee;border-color:#444}}
    #painel.min>*:not(header){display:none}
    header{display:flex;justify-content:space-between;align-items:center;font-weight:700;cursor:pointer}
    p{margin:6px 0}
    .linha{display:flex;flex-wrap:wrap;gap:6px;margin:6px 0}
    button{flex:1 1 auto;padding:5px 8px;border-radius:6px;border:1px solid #888;
      background:transparent;color:inherit;cursor:pointer;font:inherit}
    button:disabled{opacity:.4;cursor:default}
    textarea{width:100%;box-sizing:border-box;height:80px;font:12px monospace;
      background:transparent;color:inherit;border:1px solid #888;border-radius:6px}
    .status{font-size:12px;opacity:.8}`;

  function montarPainel() {
    const botao = (texto, fn) => criar('button', { textContent: texto, onclick: fn });
    el.resumo = criar('p');
    el.status = criar('p', { className: 'status' });
    el.fila = criar('textarea', { placeholder: 'Fila: um link do Maps ou nome + cidade por linha' });
    const bEste = botao('Coletar este lugar', async () => {
      bEste.disabled = true;
      status('Lendo…');
      const r = await coletarEste();
      status(r.msg);
      bEste.disabled = false;
      atualizarResumo();
    });
    const bFila = botao('Coletar fila', () => {
      const itens = el.fila.value.split('\n').map(paraUrl).filter(Boolean);
      if (!itens.length) return;
      gravar(CHAVE_FILA, { ativa: true, parar: false, pos: 0, itens });
      location.href = itens[0];
    });
    el.parar = botao('Parar fila', () => { const f = ler(CHAVE_FILA, {}); f.parar = true; f.ativa = false; gravar(CHAVE_FILA, f); status('A fila para depois do lugar atual.'); atualizarResumo(); });
    const bCsv = botao('Exportar CSV', baixarCsv);
    const bLimpar = botao('Limpar', () => { if (confirm('Apagar os horários de pico guardados?')) { gravar(CHAVE_DADOS, []); atualizarResumo(); } });

    const minimizar = criar('span', { textContent: '–' });
    const cabecalho = criar('header', {}, [criar('span', { textContent: 'Horários de pico' }), minimizar]);
    const painel = criar('div', { id: 'painel' }, [
      cabecalho,
      el.resumo,
      criar('div', { className: 'linha' }, [bEste]),
      el.fila,
      criar('div', { className: 'linha' }, [bFila, el.parar]),
      criar('div', { className: 'linha' }, [bCsv, bLimpar]),
      el.status,
    ]);
    cabecalho.onclick = () => { painel.classList.toggle('min'); minimizar.textContent = painel.classList.contains('min') ? '+' : '–'; };

    hospedeiro = criar('div', { id: 'tcc-picos-hospedeiro' });
    const raiz = hospedeiro.attachShadow({ mode: 'open' });
    raiz.appendChild(criar('style', { textContent: CSS }));
    raiz.appendChild(painel);
  }

  function garantirPainel() {
    if (!hospedeiro) { montarPainel(); atualizarResumo(); }
    if (!hospedeiro.isConnected) document.documentElement.appendChild(hospedeiro);
  }

  console.info('[Horários de pico] carregado');
  garantirPainel();
  setInterval(() => { try { garantirPainel(); } catch (e) { console.error('[Horários de pico]', e); } }, 1500);
  continuarFila().catch((e) => status(`Erro na fila: ${e.message}`));
})();
