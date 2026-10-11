// ==UserScript==
// @name         Coletor de avaliações do Google Maps (TCC Luderia)
// @namespace    tcc-luderia
// @version      2026.10.11-1
// @description  Abre as avaliações de um lugar, ordena por mais recentes, rola até o corte de data ("um mês atrás"), expande os textos e exporta CSV com autor pseudonimizado.
// @match        https://www.google.com/maps/*
// @match        https://www.google.com.br/maps/*
// @run-at       document-idle
// @noframes
// @grant        none
// ==/UserScript==

/*
 * Uso pessoal, para o Bloco B: completar estabelecimentos em que a coleta
 * automática falhou. Segue o recorte do método (_instrucoes/4_metodologia.md):
 * todas as avaliações COM TEXTO cujo rótulo de data seja de até "um mês atrás",
 * inclusive, na data da coleta.
 *
 * Passos do botão "Coletar avaliações":
 *  1. abre a aba "Avaliações";
 *  2. ordena por "Mais recentes" (se falhar, ordene à mão e clique de novo);
 *  3. rola a lista até passar do corte (5 avaliações seguidas mais antigas que o
 *     limite) ou até a lista parar de crescer;
 *  4. clica em todos os "Mais" e lê as avaliações.
 *
 * Pseudonimização na coleta: o nome do autor não sai do navegador. O CSV traz um
 * código (SHA-256 do id de colaborador do Google + um sal guardado só neste
 * navegador, 12 caracteres). O mesmo autor recebe o mesmo código entre lugares.
 *
 * A idade em dias é aproximada a partir do rótulo (semana = 7, mês = 30, ano = 365).
 * "Editado há…" conta pela data da edição, que é o que o Google mostra.
 *
 * Na "visualização limitada" do Maps (sem login), só aparecem 3 avaliações:
 * use logado.
 */

(function () {
  'use strict';

  const CHAVE_SAL = 'tcc-avaliacoes-sal';

  // ---------- utilidades ----------

  const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
  const sortear = ([a, b]) => a + Math.random() * (b - a);
  const semAcento = (t) => String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

  function agora() {
    const d = new Date();
    const p = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
  }

  function sal() {
    try {
      let s = localStorage.getItem(CHAVE_SAL);
      if (!s) {
        s = [...crypto.getRandomValues(new Uint8Array(16))].map((b) => b.toString(16).padStart(2, '0')).join('');
        localStorage.setItem(CHAVE_SAL, s);
      }
      return s;
    } catch (_) { return 'sem-armazenamento'; }
  }

  async function pseudonimo(texto) {
    const dados = new TextEncoder().encode(`${sal()}|${texto}`);
    const h = await crypto.subtle.digest('SHA-256', dados);
    return [...new Uint8Array(h)].map((b) => b.toString(16).padStart(2, '0')).join('').slice(0, 12);
  }

  // "há 3 dias", "uma semana atrás", "um mês atrás", "2 anos atrás", "a month ago", "Editado há 2 meses"
  function idadeDias(rotulo) {
    const t = semAcento(rotulo);
    if (/(minuto|hora|minute|hour|agora|just now)/.test(t)) return 0;
    const m = t.match(/(\d+|um|uma|a|an)\s+(dia|day|semana|week|mes|meses|month|ano|year)/);
    if (!m) return null;
    const n = /^\d+$/.test(m[1]) ? +m[1] : 1;
    const u = m[2];
    if (/^(dia|day)/.test(u)) return n;
    if (/^(semana|week)/.test(u)) return 7 * n;
    if (/^(mes|month)/.test(u)) return 30 * n;
    return 365 * n;
  }

  // ---------- página ----------

  function infoLugar() {
    const url = location.href;
    const resumo = document.querySelector('div.F7nice')?.innerText || '';
    return {
      nome_estabelecimento: document.querySelector('h1.DUwDvf, div[role="main"] h1')?.innerText.trim() || '',
      id_maps: (url.match(/!1s(0x[0-9a-f]+:0x[0-9a-f]+)/i) || [])[1] || '',
      avaliacao_media_estabelecimento: (resumo.match(/(\d[.,]\d)/) || [])[1]?.replace(',', '.') || '',
      volume_avaliacoes_estabelecimento: (resumo.match(/\(([\d.,\s]+)\)/) || [])[1]?.replace(/\D/g, '') || '',
    };
  }

  const cartoes = () => [...document.querySelectorAll('div[data-review-id]')]
    .filter((c) => !c.parentElement.closest('[data-review-id]'));

  function rolavel(de) {
    for (let e = de; e && e !== document.body; e = e.parentElement) {
      const cs = getComputedStyle(e);
      if (/(auto|scroll)/.test(cs.overflowY) && e.scrollHeight > e.clientHeight + 20) return e;
    }
    return null;
  }

  async function abrirAbaAvaliacoes() {
    const aba = [...document.querySelectorAll('button[role="tab"]')].find((b) => /avalia|reviews/i.test(b.innerText || b.getAttribute('aria-label')));
    if (aba && aba.getAttribute('aria-selected') !== 'true') { aba.click(); await esperar(2500); }
  }

  async function ordenarRecentes() {
    const botao = [...document.querySelectorAll('button')].find((b) => /classificar avalia|ordenar|sort reviews/i.test(b.getAttribute('aria-label') || '') || b.dataset.value === 'Ordenar');
    if (!botao) return false;
    botao.click();
    await esperar(1200);
    const opcao = [...document.querySelectorAll('[role="menuitemradio"], [role="menuitem"]')].find((o) => /recentes|newest/i.test(o.innerText));
    if (!opcao) { document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); return false; }
    opcao.click();
    await esperar(3000);
    return true;
  }

  function expandirTextos() {
    let n = 0;
    for (const b of document.querySelectorAll('div[data-review-id] button.w8nwRe, div[data-review-id] button[aria-label="Ver mais"], div[data-review-id] button[aria-label="See more"]')) {
      b.click();
      n++;
    }
    return n;
  }

  function lerCartao(c) {
    const estrela = c.querySelector('[role="img"][aria-label*="estrela"], [role="img"][aria-label*="star"]')?.getAttribute('aria-label') || '';
    let nota = (estrela.match(/(\d)/) || [])[1] || '';
    if (!nota) nota = ((c.innerText.match(/\b(\d)\/5\b/) || [])[1]) || '';
    const data = c.querySelector('.rsqaWe, .xRkPPb')?.innerText.trim()
      || [...c.querySelectorAll('span')].map((s) => s.innerText.trim()).find((t) => /atr[aá]s$|^h[aá] |ago$/i.test(t)) || '';
    const resposta = c.querySelector('.CDe7pd');
    const corpo = [...c.querySelectorAll('.wiI7pd')].find((e) => !resposta || !resposta.contains(e));
    const texto = (corpo?.innerText || '').replace(/\s*…?\s*Mais$/, '').trim();
    // Notas por aspecto e campos como "Preço por pessoa", "Tamanho do grupo".
    const detalhes = [...c.querySelectorAll('.PBK6be')].map((e) => e.innerText.replace(/\s*\n\s*/g, ': ').trim()).filter(Boolean).join(' | ');
    const contrib = (c.querySelector('[data-href*="/contrib/"], a[href*="/contrib/"]')?.getAttribute('data-href')
      || c.querySelector('a[href*="/contrib/"]')?.getAttribute('href') || '').match(/contrib\/(\d+)/)?.[1] || '';
    const autor = c.querySelector('.d4r55')?.innerText.trim() || c.getAttribute('aria-label') || '';
    return {
      id: c.dataset.reviewId,
      chave_autor: contrib || autor,
      nota_avaliacao: nota,
      data_relativa: data,
      idade_dias_aprox: idadeDias(data) ?? '',
      tem_texto: texto ? 'sim' : 'não',
      texto_avaliacao: texto,
      detalhes,
      traduzida: /traduzido pelo google|translated by google/i.test(c.innerText) ? 'sim' : 'não',
      resposta_dono: resposta ? 'sim' : 'não',
      texto_resposta: resposta ? (resposta.querySelector('.wiI7pd')?.innerText || '').trim() : '',
    };
  }

  // ---------- coleta ----------

  let parar = false;
  let limite = 30;
  let resultado = [];

  async function coletar() {
    parar = false;
    resultado = [];
    const lugar = infoLugar();
    if (!lugar.nome_estabelecimento) { status('Abra um lugar no Maps primeiro.'); return; }

    status('Abrindo a aba de avaliações…');
    await abrirAbaAvaliacoes();
    if (!el.jaOrdenado.checked) {
      status('Ordenando por mais recentes…');
      if (!(await ordenarRecentes())) status('Não consegui ordenar sozinho. Ordene por "Mais recentes", marque "Já ordenei" e clique de novo.');
    }

    const primeira = cartoes()[0];
    const caixa = primeira && rolavel(primeira);
    if (!caixa) { status('Lista de avaliações não encontrada (visualização limitada? entre na conta).'); return; }

    let ultimoN = 0, semCrescer = 0;
    while (!parar) {
      expandirTextos();
      const cs = cartoes();
      // Para quando as últimas 5 já passaram do limite (lista ordenada da mais nova à mais antiga).
      const ultimas = cs.slice(-5).map((c) => idadeDias(lerCartao(c).data_relativa));
      const passou = limite !== Infinity && ultimas.length === 5 && ultimas.every((d) => d != null && d > limite);
      status(`${cs.length} avaliações carregadas · a última: ${lerCartao(cs[cs.length - 1]).data_relativa || '?'}`);
      if (passou) break;
      semCrescer = cs.length === ultimoN ? semCrescer + 1 : 0;
      if (semCrescer >= 6) break;
      ultimoN = cs.length;
      caixa.scrollTo(0, caixa.scrollHeight);
      await esperar(sortear([1200, 2000]));
    }

    expandirTextos();
    await esperar(800);
    const coletado_em = agora();
    const lidos = cartoes().map(lerCartao);
    const vistos = new Set();
    let indice = 0;
    for (const r of lidos) {
      if (vistos.has(r.id)) continue;
      vistos.add(r.id);
      const { id, chave_autor, ...resto } = r;
      resultado.push({
        ...lugar,
        review_index: ++indice,
        autor_pseudonimo: chave_autor ? await pseudonimo(chave_autor) : '',
        ...resto,
        no_recorte: (r.tem_texto === 'sim' && r.idade_dias_aprox !== '' && r.idade_dias_aprox <= limite) ? 'sim' : 'não',
        coletado_em,
        url: location.href,
      });
    }
    mostrarResumo();
  }

  function mostrarResumo() {
    const noRecorte = resultado.filter((r) => r.no_recorte === 'sim').length;
    const comTexto = resultado.filter((r) => r.tem_texto === 'sim').length;
    const semData = resultado.filter((r) => r.idade_dias_aprox === '').length;
    status(`${parar ? 'Interrompido. ' : ''}${resultado.length} avaliações lidas · ${comTexto} com texto · ${noRecorte} no recorte` +
      (semData ? ` · ${semData} sem data reconhecida (confira)` : '') + '.');
  }

  // ---------- exportação ----------

  const COLS = ['id_maps', 'nome_estabelecimento', 'avaliacao_media_estabelecimento', 'volume_avaliacoes_estabelecimento',
    'review_index', 'autor_pseudonimo', 'nota_avaliacao', 'data_relativa', 'idade_dias_aprox', 'no_recorte', 'tem_texto',
    'texto_avaliacao', 'detalhes', 'traduzida', 'resposta_dono', 'texto_resposta', 'coletado_em', 'url'];

  function celula(v) {
    const s = String(v ?? '');
    return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  }

  function baixar(linhas, sufixo) {
    if (!linhas.length) { status('Nada para exportar: colete primeiro.'); return; }
    const texto = '﻿' + [COLS.join(';'), ...linhas.map((l) => COLS.map((c) => celula(l[c])).join(';'))].join('\r\n');
    const nome = (linhas[0].nome_estabelecimento || 'lugar').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\w]+/g, '_').toLowerCase();
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([texto], { type: 'text/csv;charset=utf-8' }));
    a.download = `maps_avaliacoes_${nome}_${sufixo}_${new Date().toISOString().slice(0, 10)}.csv`;
    document.documentElement.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 2000);
  }

  // ---------- painel (padrão: canto superior direito, shadow DOM, fora do <body>) ----------
  // Fica à esquerda do painel de horários de pico, para os dois caberem juntos.

  const el = {};
  let hospedeiro = null;

  function criar(tag, props = {}, filhos = []) {
    const n = document.createElement(tag);
    Object.assign(n, props);
    for (const f of filhos) n.appendChild(f);
    return n;
  }

  function status(t) { if (el.status) el.status.textContent = t; }

  const CSS = `
    #painel{position:fixed;top:12px;right:354px;z-index:2147483647;width:330px;
      max-height:calc(100vh - 24px);overflow:auto;box-sizing:border-box;
      background:#fff;color:#111;border:1px solid #ccc;border-radius:10px;
      box-shadow:0 4px 16px rgba(0,0,0,.18);font:13px/1.4 system-ui,sans-serif;padding:10px}
    @media (prefers-color-scheme:dark){#painel{background:#1e1e1e;color:#eee;border-color:#444}}
    #painel.min>*:not(header){display:none}
    header{display:flex;justify-content:space-between;align-items:center;font-weight:700;cursor:pointer}
    p{margin:6px 0}
    label{display:block;margin:4px 0}
    .linha{display:flex;flex-wrap:wrap;gap:6px;margin:6px 0}
    button{flex:1 1 auto;padding:5px 8px;border-radius:6px;border:1px solid #888;
      background:transparent;color:inherit;cursor:pointer;font:inherit}
    button:disabled{opacity:.4;cursor:default}
    select{font:inherit;color:inherit;background:transparent;border:1px solid #888;border-radius:6px;padding:3px}
    .status{font-size:12px;opacity:.8}`;

  function montarPainel() {
    const botao = (texto, fn) => criar('button', { textContent: texto, onclick: fn });
    el.status = criar('p', { className: 'status', textContent: 'Abra um lugar e clique em "Coletar avaliações".' });
    el.jaOrdenado = criar('input', { type: 'checkbox' });
    const seletor = criar('select', { onchange: (e) => { limite = e.target.value === 'tudo' ? Infinity : +e.target.value; } }, [
      criar('option', { value: '30', textContent: 'Corte: até "um mês atrás" (método)' }),
      criar('option', { value: '90', textContent: 'Corte: até 3 meses' }),
      criar('option', { value: '365', textContent: 'Corte: até 1 ano' }),
      criar('option', { value: 'tudo', textContent: 'Sem corte (todas)' }),
    ]);
    const bColetar = botao('Coletar avaliações', async () => {
      bColetar.disabled = true; bParar.disabled = false;
      try { await coletar(); } catch (e) { status(`Erro: ${e.message}`); }
      bColetar.disabled = false; bParar.disabled = true;
    });
    const bParar = botao('Parar', () => { parar = true; });
    bParar.disabled = true;
    const bRecorte = botao('CSV do recorte', () => baixar(resultado.filter((r) => r.no_recorte === 'sim'), 'recorte'));
    const bTudo = botao('CSV de tudo o que carregou', () => baixar(resultado, 'tudo'));

    const minimizar = criar('span', { textContent: '–' });
    const cabecalho = criar('header', {}, [criar('span', { textContent: 'Avaliações do Maps' }), minimizar]);
    const painel = criar('div', { id: 'painel' }, [
      cabecalho,
      criar('div', { className: 'linha' }, [seletor]),
      criar('label', {}, [el.jaOrdenado, document.createTextNode(' Já ordenei por "Mais recentes"')]),
      criar('div', { className: 'linha' }, [bColetar, bParar]),
      criar('div', { className: 'linha' }, [bRecorte, bTudo]),
      el.status,
    ]);
    cabecalho.onclick = () => { painel.classList.toggle('min'); minimizar.textContent = painel.classList.contains('min') ? '+' : '–'; };

    hospedeiro = criar('div', { id: 'tcc-avaliacoes-hospedeiro' });
    const raiz = hospedeiro.attachShadow({ mode: 'open' });
    raiz.appendChild(criar('style', { textContent: CSS }));
    raiz.appendChild(painel);
  }

  function garantirPainel() {
    if (!hospedeiro) montarPainel();
    if (!hospedeiro.isConnected) document.documentElement.appendChild(hospedeiro);
  }

  console.info('[Avaliações do Maps] carregado');
  garantirPainel();
  setInterval(() => { try { garantirPainel(); } catch (e) { console.error('[Avaliações do Maps]', e); } }, 1500);
})();
