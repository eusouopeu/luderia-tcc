// ==UserScript==
// @name         Coletor de perfis do Instagram (TCC Luderia)
// @namespace    tcc-luderia
// @version      2026.10.11-1
// @description  Mostra data, curtidas e comentários sobre cada post da grade; rola até o primeiro post; coleta posts e dados de perfis e exporta CSV/JSON.
// @match        https://www.instagram.com/*
// @run-at       document-start
// @grant        none
// ==/UserScript==

/*
 * Uso pessoal, para a coleta do Bloco A (acervo, preço, cobrança e idade do perfil).
 *
 * Como funciona:
 *  - Intercepta as respostas que o próprio site recebe (fetch/XHR) e guarda todo objeto
 *    com `code` + `taken_at` (um post). Assim a grade ganha um selo com data, curtidas
 *    e comentários sem abrir post por post.
 *  - "Rolar até o fim": rola a página sozinho até o site parar de carregar posts.
 *  - "Coletar via API": pede os posts direto ao endpoint interno que o site usa,
 *    12 por vez, com pausa aleatória entre pedidos. Mais rápido que rolar.
 *  - "Fila": coleta vários perfis em sequência, com pausa maior entre perfis,
 *    e baixa dois CSV no fim (posts e perfis).
 *
 * Os CSV usam ";" como separador e UTF-8 com BOM (abrem direto no Excel pt-BR).
 * No pandas: pd.read_csv(caminho, sep=";").
 *
 * Use uma conta secundária. Se o Instagram responder 401/429, o script para e
 * mantém o que já coletou; espere algumas horas antes de continuar.
 */

(function () {
  'use strict';

  const APP_ID = '936619743392459';
  const PAUSA_PEDIDO = [1500, 3500];   // ms entre páginas de posts
  const PAUSA_PERFIL = [20000, 40000]; // ms entre perfis da fila
  const RESERVADOS = new Set(['explore', 'p', 'reel', 'reels', 'direct', 'accounts', 'stories', 'about', 'legal', 'developer', 'web']);

  const posts = new Map();   // shortcode -> post normalizado
  const perfis = new Map();  // username -> dados do perfil
  let parar = false;
  let ocupado = false;

  // ---------- captura das respostas do site ----------

  function normalizar(o) {
    const tipoMidia = { 1: 'foto', 2: 'video', 8: 'carrossel' }[o.media_type] || String(o.media_type ?? '');
    return {
      perfil: o.user?.username || o.owner?.username || '',
      shortcode: o.code,
      url: `https://www.instagram.com/p/${o.code}/`,
      taken_at: o.taken_at,
      tipo: o.product_type === 'clips' ? 'reels' : tipoMidia,
      curtidas: o.like_count ?? '',
      comentarios: o.comment_count ?? '',
      visualizacoes: o.play_count ?? o.ig_play_count ?? o.view_count ?? '',
      n_midias: o.carousel_media_count ?? 1,
      local: o.location?.name || '',
      legenda: o.caption?.text || '',
    };
  }

  function ingerir(dado, prof = 0) {
    if (!dado || typeof dado !== 'object' || prof > 40) return;
    if (Array.isArray(dado)) { for (const x of dado) ingerir(x, prof + 1); return; }
    if (typeof dado.code === 'string' && typeof dado.taken_at === 'number') {
      const novo = normalizar(dado);
      const velho = posts.get(novo.shortcode);
      // Mantém o campo já preenchido quando a resposta nova vem incompleta.
      posts.set(novo.shortcode, velho ? mesclar(velho, novo) : novo);
    }
    for (const k in dado) {
      const v = dado[k];
      if (v && typeof v === 'object') ingerir(v, prof + 1);
    }
  }

  function mesclar(a, b) {
    const r = { ...a };
    for (const k in b) if (b[k] !== '' && b[k] != null) r[k] = b[k];
    return r;
  }

  function ingerirTexto(t) {
    if (!t || t.indexOf('taken_at') === -1) return;
    try { ingerir(JSON.parse(t.replace(/^for \(;;\);/, ''))); agendarSelos(); } catch (_) { /* não é JSON */ }
  }

  const fetchOriginal = window.fetch;
  window.fetch = async function (...args) {
    const resp = await fetchOriginal.apply(this, args);
    try {
      const url = String(args[0]?.url || args[0]);
      if (/graphql|\/api\/v1\//.test(url)) resp.clone().text().then(ingerirTexto, () => {});
    } catch (_) { /* ignora */ }
    return resp;
  };

  const xhrSend = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.send = function (...args) {
    this.addEventListener('load', function () {
      try {
        if (this.responseType === '' || this.responseType === 'text') ingerirTexto(this.responseText);
        else if (this.responseType === 'json') { ingerir(this.response); agendarSelos(); }
      } catch (_) { /* ignora */ }
    });
    return xhrSend.apply(this, args);
  };

  // Os primeiros 12 posts vêm embutidos no HTML.
  function lerDadosEmbutidos() {
    for (const s of document.querySelectorAll('script[type="application/json"]')) ingerirTexto(s.textContent);
  }

  // ---------- utilidades ----------

  const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
  const sortear = ([a, b]) => a + Math.random() * (b - a);

  function dataHora(ts) {
    if (!ts) return '';
    const d = new Date(ts * 1000);
    const p = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
  }

  function dataCurta(ts) {
    const d = new Date(ts * 1000);
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
  }

  function compacto(n) {
    if (n === '' || n == null) return '?';
    return n >= 1000 ? (n / 1000).toFixed(n >= 10000 ? 0 : 1).replace('.', ',') + ' mil' : String(n);
  }

  function perfilAtual() {
    const m = location.pathname.match(/^\/([A-Za-z0-9._]+)\/?(?:reels|tagged)?\/?$/);
    return m && !RESERVADOS.has(m[1]) ? m[1].toLowerCase() : null;
  }

  function postsDe(user) {
    return [...posts.values()]
      .filter((p) => p.perfil.toLowerCase() === user)
      .sort((a, b) => a.taken_at - b.taken_at);
  }

  function cookie(nome) {
    return document.cookie.split('; ').find((c) => c.startsWith(nome + '='))?.split('=')[1] || '';
  }

  async function api(caminho) {
    const r = await fetchOriginal(caminho, {
      credentials: 'include',
      headers: {
        'X-IG-App-ID': APP_ID,
        'X-Requested-With': 'XMLHttpRequest',
        'X-CSRFToken': cookie('csrftoken'),
      },
    });
    if (!r.ok) throw new Error(`HTTP ${r.status} em ${caminho.split('?')[0]}`);
    const j = await r.json();
    if (j.status === 'fail') throw new Error(j.message || 'resposta "fail" do Instagram');
    return j;
  }

  // ---------- exportação ----------

  const COLS_POSTS = ['perfil', 'shortcode', 'url', 'data_hora', 'taken_at', 'tipo', 'curtidas', 'comentarios', 'visualizacoes', 'n_midias', 'local', 'legenda'];
  const COLS_PERFIS = ['perfil', 'nome', 'categoria', 'privado', 'seguidores', 'seguindo', 'n_posts_declarado', 'n_posts_coletados', 'primeiro_post', 'ultimo_post', 'site', 'bio', 'coletado_em'];

  function celula(v) {
    const s = String(v ?? '');
    return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  }

  function csv(linhas, cols) {
    return '﻿' + [cols.join(';'), ...linhas.map((l) => cols.map((c) => celula(l[c])).join(';'))].join('\r\n');
  }

  function baixar(nome, conteudo, tipo) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([conteudo], { type: tipo }));
    a.download = nome;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 2000);
  }

  function linhaPerfil(user) {
    const p = perfis.get(user) || { perfil: user };
    const ps = postsDe(user);
    return {
      ...p,
      n_posts_coletados: ps.length,
      primeiro_post: ps.length ? dataHora(ps[0].taken_at) : '',
      ultimo_post: ps.length ? dataHora(ps[ps.length - 1].taken_at) : '',
    };
  }

  function exportar(usuarios, sufixo) {
    const carimbo = new Date().toISOString().slice(0, 10);
    const linhas = usuarios.flatMap((u) => postsDe(u).map((p) => ({ ...p, data_hora: dataHora(p.taken_at) })));
    baixar(`instagram_posts_${sufixo}_${carimbo}.csv`, csv(linhas, COLS_POSTS), 'text/csv;charset=utf-8');
    baixar(`instagram_perfis_${sufixo}_${carimbo}.csv`, csv(usuarios.map(linhaPerfil), COLS_PERFIS), 'text/csv;charset=utf-8');
  }

  // ---------- coleta ----------

  async function coletarPerfil(user) {
    const info = (await api(`/api/v1/users/web_profile_info/?username=${encodeURIComponent(user)}`)).data.user;
    perfis.set(user, {
      perfil: user,
      nome: info.full_name,
      categoria: info.category_name || info.business_category_name || '',
      privado: info.is_private ? 'sim' : 'não',
      seguidores: info.edge_followed_by?.count ?? '',
      seguindo: info.edge_follow?.count ?? '',
      n_posts_declarado: info.edge_owner_to_timeline_media?.count ?? '',
      site: info.external_url || '',
      bio: info.biography || '',
      coletado_em: dataHora(Date.now() / 1000),
    });
    if (info.is_private && !info.followed_by_viewer) { status(`@${user} é privado; só dados do perfil.`); return; }

    let maxId = '';
    for (;;) {
      if (parar) throw new Error('interrompido');
      const j = await api(`/api/v1/feed/user/${info.id}/?count=12${maxId ? `&max_id=${maxId}` : ''}`);
      ingerir(j.items || []);
      agendarSelos();
      const ps = postsDe(user);
      status(`@${user}: ${ps.length}/${info.edge_owner_to_timeline_media?.count ?? '?'} posts · mais antigo ${ps[0] ? dataCurta(ps[0].taken_at) : '-'}`);
      if (!j.more_available || !j.next_max_id) break;
      maxId = j.next_max_id;
      await esperar(sortear(PAUSA_PEDIDO));
    }
  }

  async function executar(tarefa) {
    if (ocupado) return;
    ocupado = true; parar = false; atualizarBotoes();
    try { await tarefa(); } catch (e) { status(`Parou: ${e.message}. O que já veio continua disponível para exportar.`); }
    ocupado = false; atualizarBotoes(); atualizarResumo();
  }

  async function rolarAteOFim() {
    let altura = 0, semMudanca = 0;
    while (!parar && semMudanca < 8) {
      window.scrollTo(0, document.documentElement.scrollHeight);
      await esperar(sortear([1200, 2000]));
      const h = document.documentElement.scrollHeight;
      semMudanca = h === altura ? semMudanca + 1 : 0;
      altura = h;
      atualizarResumo();
    }
    status(parar ? 'Rolagem interrompida.' : 'Chegou ao fim da grade.');
  }

  async function coletarFila(usuarios) {
    const feitos = [];
    try {
      for (const [i, u] of usuarios.entries()) {
        status(`Fila ${i + 1}/${usuarios.length}: @${u}`);
        await coletarPerfil(u);
        feitos.push(u);
        if (i < usuarios.length - 1) {
          const pausa = sortear(PAUSA_PERFIL);
          status(`@${u} pronto. Próximo em ${Math.round(pausa / 1000)} s.`);
          await esperar(pausa);
          if (parar) throw new Error('interrompido');
        }
      }
      status(`Fila concluída: ${feitos.length} perfis.`);
    } finally {
      // Baixa o parcial mesmo se a fila parar no meio.
      const comDados = usuarios.filter((u) => perfis.has(u));
      if (comDados.length) exportar(comDados, `fila${comDados.length}`);
    }
  }

  // ---------- selos na grade ----------

  let selosAgendados = false;
  let mostrarSelos = true;

  function agendarSelos() {
    if (selosAgendados) return;
    selosAgendados = true;
    requestAnimationFrame(() => { selosAgendados = false; aplicarSelos(); });
  }

  function aplicarSelos() {
    for (const a of document.querySelectorAll('a[href*="/p/"], a[href*="/reel/"]')) {
      const m = a.getAttribute('href').match(/\/(?:p|reel)\/([\w-]+)/);
      const p = m && posts.get(m[1]);
      let selo = a.querySelector(':scope > .igc-selo');
      if (!p || !mostrarSelos) { selo?.remove(); continue; }
      if (!a.querySelector('img, video')) continue; // só links da grade
      const texto = `${dataCurta(p.taken_at)} · ♥ ${compacto(p.curtidas)} · 💬 ${compacto(p.comentarios)}` +
        (p.visualizacoes !== '' ? ` · ▶ ${compacto(p.visualizacoes)}` : '');
      if (!selo) {
        selo = document.createElement('div');
        selo.className = 'igc-selo';
        if (getComputedStyle(a).position === 'static') a.style.position = 'relative';
        a.appendChild(selo);
      }
      if (selo.textContent !== texto) selo.textContent = texto;
    }
  }

  // ---------- painel ----------

  let el = {};

  function criar(tag, props = {}, filhos = []) {
    const n = document.createElement(tag);
    Object.assign(n, props);
    for (const f of filhos) n.appendChild(f);
    return n;
  }

  function status(t) { if (el.status) el.status.textContent = t; }

  function atualizarResumo() {
    const u = perfilAtual();
    el.titulo.textContent = u ? `Coletor IG · @${u}` : 'Coletor IG';
    if (!u) { el.resumo.textContent = 'Abra um perfil.'; return; }
    const ps = postsDe(u);
    el.resumo.textContent = ps.length
      ? `${ps.length} posts carregados · mais antigo ${dataCurta(ps[0].taken_at)} · mais recente ${dataCurta(ps[ps.length - 1].taken_at)}`
      : 'Nenhum post carregado ainda.';
  }

  function atualizarBotoes() {
    for (const b of el.acoes) b.disabled = ocupado;
    el.parar.disabled = !ocupado;
  }

  function montarPainel() {
    const css = document.createElement('style');
    css.textContent = `
      .igc-selo{position:absolute;left:4px;bottom:4px;z-index:3;pointer-events:none;
        background:rgba(0,0,0,.75);color:#fff;font:600 11px/1.3 system-ui,sans-serif;
        padding:2px 6px;border-radius:4px;white-space:nowrap}
      #igc-painel{position:fixed;right:12px;bottom:12px;z-index:99999;width:300px;
        background:#fff;color:#111;border:1px solid #ccc;border-radius:10px;
        box-shadow:0 4px 16px rgba(0,0,0,.18);font:13px/1.4 system-ui,sans-serif;padding:10px}
      @media (prefers-color-scheme:dark){#igc-painel{background:#1e1e1e;color:#eee;border-color:#444}}
      #igc-painel.min>*:not(header){display:none}
      #igc-painel header{display:flex;justify-content:space-between;align-items:center;font-weight:700;cursor:pointer}
      #igc-painel p{margin:6px 0}
      #igc-painel .linha{display:flex;flex-wrap:wrap;gap:6px;margin:6px 0}
      #igc-painel button{flex:1 1 auto;padding:5px 8px;border-radius:6px;border:1px solid #888;
        background:transparent;color:inherit;cursor:pointer;font:inherit}
      #igc-painel button:disabled{opacity:.4;cursor:default}
      #igc-painel textarea{width:100%;box-sizing:border-box;height:70px;font:12px monospace;
        background:transparent;color:inherit;border:1px solid #888;border-radius:6px}
      #igc-painel .status{font-size:12px;opacity:.8}`;
    document.head.appendChild(css);

    const botao = (texto, fn) => criar('button', { textContent: texto, onclick: fn });

    el.titulo = criar('span', { textContent: 'Coletor IG' });
    el.resumo = criar('p');
    el.status = criar('p', { className: 'status' });
    el.fila = criar('textarea', { placeholder: 'Fila: um @perfil ou link por linha' });

    const bRolar = botao('Rolar até o fim', () => executar(rolarAteOFim));
    const bApi = botao('Coletar via API', () => {
      const u = perfilAtual();
      if (u) executar(() => coletarPerfil(u).then(() => status(`@${u} completo.`)));
    });
    const bCsv = botao('Exportar CSV', () => { const u = perfilAtual(); if (u) exportar([u], u); });
    const bJson = botao('JSON', () => {
      const u = perfilAtual();
      if (u) baixar(`instagram_${u}.json`, JSON.stringify({ perfil: linhaPerfil(u), posts: postsDe(u) }, null, 2), 'application/json');
    });
    const bFila = botao('Coletar fila', () => {
      const us = [...new Set(el.fila.value.split(/\s+/)
        .map((s) => s.replace(/^.*instagram\.com\//, '').replace(/^@/, '').split(/[/?]/)[0].toLowerCase())
        .filter(Boolean))];
      if (us.length) executar(() => coletarFila(us));
    });
    el.parar = botao('Parar', () => { parar = true; status('Parando…'); });
    el.acoes = [bRolar, bApi, bCsv, bJson, bFila];

    const chk = criar('input', { type: 'checkbox', checked: true, onchange: (e) => { mostrarSelos = e.target.checked; aplicarSelos(); } });
    const minimizar = criar('span', { textContent: '–' });
    const cabecalho = criar('header', {}, [el.titulo, minimizar]);
    const painel = criar('div', { id: 'igc-painel' }, [
      cabecalho,
      el.resumo,
      criar('div', { className: 'linha' }, [bRolar, bApi]),
      criar('div', { className: 'linha' }, [bCsv, bJson, el.parar]),
      criar('label', {}, [chk, document.createTextNode(' Selos na grade')]),
      el.fila,
      criar('div', { className: 'linha' }, [bFila]),
      el.status,
    ]);
    cabecalho.onclick = () => { painel.classList.toggle('min'); minimizar.textContent = painel.classList.contains('min') ? '+' : '–'; };
    document.body.appendChild(painel);
    atualizarBotoes();
    atualizarResumo();
  }

  function iniciar() {
    lerDadosEmbutidos();
    montarPainel();
    new MutationObserver(agendarSelos).observe(document.body, { childList: true, subtree: true });
    // O Instagram troca de página sem recarregar; acompanha a URL.
    let caminho = location.pathname;
    setInterval(() => {
      if (location.pathname !== caminho) { caminho = location.pathname; lerDadosEmbutidos(); }
      atualizarResumo();
    }, 1000);
    agendarSelos();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
  else iniciar();
})();
