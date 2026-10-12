// ==UserScript==
// @name         Coletor de perfis do Instagram (TCC Luderia)
// @namespace    tcc-luderia
// @version      2026.10.11-7
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
  const totais = new Map();  // username -> nº de posts declarado pelo Instagram
  let parar = false;
  let ocupado = false;

  // ---------- captura das respostas do site ----------

  function normalizar(o) {
    const tipoMidia = { 1: 'foto', 2: 'video', 8: 'carrossel' }[o.media_type] || String(o.media_type ?? '');
    return {
      perfil: (o.user?.username || o.owner?.username || '').toLowerCase(),
      // Posts em colaboração: contas convidadas como coautoras (além do dono).
      coautores: [...(o.coauthor_producers || []), ...(o.invited_coauthor_producers || [])]
        .map((c) => c?.username?.toLowerCase()).filter(Boolean).join(', '),
      shortcode: o.code,
      url: `https://www.instagram.com/p/${o.code}/`,
      taken_at: o.taken_at,
      tipo: o.product_type === 'clips' ? 'reels' : tipoMidia,
      curtidas: o.like_count ?? '',
      comentarios: o.comment_count ?? '',
      visualizacoes: o.play_count ?? o.ig_play_count ?? o.view_count ?? '',
      n_midias: o.carousel_media_count ?? 1,
      local: o.location?.name || '',
      fixado: o.timeline_pinned_user_ids?.length ? 'sim' : '',
      legenda: o.caption?.text || '',
      ...classificar(o.caption?.text || ''),
    };
  }

  // ---------- eventos nas legendas ----------

  // Termos procurados na legenda já sem acento e em minúsculas. A lista é
  // deliberadamente larga: o filtro serve para achar candidatos, e a leitura
  // do post decide. Edite à vontade.
  const CATEGORIAS = {
    'noite temática': /\bnoites? (tematica|de|do|da|dos|das)\b|\btematic|\bfesta\b|\bhalloween\b|\bcarnaval\b|\bsao joao\b|\bjunin|\bnatal(ino|ina)?\b|\bdia dos namorados\b|\bkaraoke\b|\bespecial de\b/,
    'workshop/aula': /\bworkshop|\boficina|\baulas?\b|\bcursos?\b|\bpalestra|\baprend(a|er) a jogar\b|\bensina(r|mos) a jogar\b|\biniciac|\biniciantes?\b/,
    'competição': /\bcampeonato|\btorneio|\bcompetic|\bcopa\b|\bligas?\b|\bdesafio|\bpremi(o|os|ac)|\bchaveamento|\bvencedor|\branking\b|\bclassificat/,
    'quiz/bingo': /\bquiz|\btrivia\b|\bperguntas e respostas\b|\bbingo\b/,
    'encontro/RPG': /\bencontros?\b|\bmeetup|\brpg\b|\bone.?shot|\bsessao de\b|\blancamento|\bmesa aberta\b|\bjogatina|\beventos?\b|\bconvidad/,
  };

  // Indícios de agenda: data, hora, inscrição. Sozinhos não marcam evento,
  // mas elevam o grau de "possível" para "provável".
  const AGENDA = /\b(segunda|terca|quarta|quinta|sexta|sabado|domingo)\b|\bdia \d{1,2}\b|\b\d{1,2} ?h(\d{2})?\b|\b\d{1,2}:\d{2}\b|\b\d{1,2}\/\d{1,2}\b|\binscri|\bvagas?\b|\bingressos?\b|\breserv|\bgaranta\b|\blink na bio\b/;

  function semAcento(t) {
    return t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  }

  function classificar(legenda) {
    if (!legenda) return { evento: '', categorias_evento: '' };
    const t = semAcento(legenda);
    const cats = Object.keys(CATEGORIAS).filter((c) => CATEGORIAS[c].test(t));
    if (!cats.length) return { evento: 'não', categorias_evento: '' };
    return { evento: AGENDA.test(t) ? 'provável' : 'possível', categorias_evento: cats.join(', ') };
  }

  const ehEvento = (p) => p.evento === 'provável' || p.evento === 'possível';

  // `pagina`: perfil em cuja página (ou coleta via API) o post apareceu. Só é usado
  // para situar posts sem dono identificado na resposta.
  function ingerir(dado, pagina = perfilAtual() || '', prof = 0) {
    if (!dado || typeof dado !== 'object' || prof > 40) return;
    if (Array.isArray(dado)) { for (const x of dado) ingerir(x, pagina, prof + 1); return; }
    if (typeof dado.username === 'string') {
      const n = typeof dado.media_count === 'number' ? dado.media_count : dado.edge_owner_to_timeline_media?.count;
      if (typeof n === 'number') totais.set(dado.username.toLowerCase(), n);
      capturarPerfil(dado);
    }
    if (typeof dado.code === 'string' && typeof dado.taken_at === 'number') {
      const novo = { ...normalizar(dado), pagina_coleta: pagina };
      const velho = posts.get(novo.shortcode);
      // Mantém o campo já preenchido quando a resposta nova vem incompleta.
      posts.set(novo.shortcode, velho ? mesclar(velho, novo) : novo);
    }
    for (const k in dado) {
      const v = dado[k];
      if (v && typeof v === 'object') ingerir(v, pagina, prof + 1);
    }
  }

  // Dados do perfil que vêm nas respostas que o site já recebe (sem pedido extra).
  // Objetos de usuário aparecem em vários lugares (dono do post, comentários);
  // cada um só alimenta o próprio username.
  const capturados = new Map(); // username -> { nome, seguidores, site }

  function capturarPerfil(u) {
    const seg = u.edge_followed_by?.count ?? u.follower_count;
    const novo = {
      nome: typeof u.full_name === 'string' ? u.full_name : '',
      seguidores: typeof seg === 'number' ? seg : '',
      site: u.external_url || u.bio_links?.find((b) => b?.url)?.url || '',
    };
    const chave = u.username.toLowerCase();
    capturados.set(chave, mesclar(capturados.get(chave) || {}, novo));
  }

  function mesclar(a, b) {
    const r = { ...a };
    for (const k in b) if (b[k] !== '' && b[k] != null && !(k === 'pagina_coleta' && a[k])) r[k] = b[k];
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

  // Vínculo do post com o perfil: próprio, colaboração (o perfil é dono ou coautor)
  // ou sem dono identificado (a resposta não trouxe o dono; vale a página da coleta).
  function vinculo(p, user) {
    const coaut = p.coautores ? p.coautores.split(', ') : [];
    if (p.perfil === user) return coaut.length ? 'colaboração' : 'próprio';
    if (coaut.includes(user)) return 'colaboração';
    if (!p.perfil && p.pagina_coleta === user) return 'sem dono identificado';
    return '';
  }

  function postsDe(user) {
    return [...posts.values()]
      .filter((p) => vinculo(p, user))
      .sort((a, b) => a.taken_at - b.taken_at);
  }


  // Número do post contado a partir do primeiro publicado (#1 = mais antigo).
  // Com todos os posts carregados, é a ordem cronológica. Com carga parcial, conta
  // de trás para frente a partir do total declarado pelo Instagram; posts fixados
  // ficam sem número até a carga completa, porque aparecem fora de ordem no topo.
  // Posts arquivados ou apagados não entram no total, então o número é o da grade atual.
  let cacheNumeros = { chave: '', mapa: new Map() };

  function numeros(user) {
    const total = totais.get(user);
    const ps = postsDe(user);
    const chave = `${user}|${ps.length}|${total}`;
    if (cacheNumeros.chave === chave) return cacheNumeros.mapa;
    const mapa = new Map();
    if (total && ps.length >= total) ps.forEach((p, i) => mapa.set(p.shortcode, i + 1));
    else if (total) ps.filter((p) => !p.fixado).reverse().forEach((p, i) => mapa.set(p.shortcode, total - i));
    cacheNumeros = { chave, mapa };
    return mapa;
  }

  function lerPref(chave) {
    try { return localStorage.getItem(chave) === '1'; } catch (_) { return false; }
  }

  function gravarPref(chave, valor) {
    try { localStorage.setItem(chave, valor ? '1' : '0'); } catch (_) { /* sem armazenamento */ }
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

  const COLS_POSTS = ['perfil', 'vinculo', 'coautores', 'pagina_coleta', 'numero_post', 'fixado', 'shortcode', 'url', 'data_hora', 'taken_at', 'tipo', 'curtidas', 'comentarios', 'visualizacoes', 'n_midias', 'local', 'evento', 'categorias_evento', 'legenda'];
  const COLS_PERFIS = ['perfil', 'nome', 'categoria', 'privado', 'seguidores', 'seguindo', 'n_posts_declarado', 'n_posts_coletados', 'n_posts_evento', 'primeiro_post', 'ultimo_post', 'site', 'bio', 'coletado_em'];

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
      n_posts_evento: ps.filter(ehEvento).length,
      primeiro_post: ps.length ? dataHora(ps[0].taken_at) : '',
      ultimo_post: ps.length ? dataHora(ps[ps.length - 1].taken_at) : '',
    };
  }

  function exportar(usuarios, sufixo) {
    const carimbo = new Date().toISOString().slice(0, 10);
    const linhas = usuarios.flatMap((u) => {
      const nums = numeros(u);
      return postsDe(u).map((p) => ({ ...p, vinculo: vinculo(p, u), numero_post: nums.get(p.shortcode) ?? '', data_hora: dataHora(p.taken_at) }));
    });
    baixar(`instagram_posts_${sufixo}_${carimbo}.csv`, csv(linhas, COLS_POSTS), 'text/csv;charset=utf-8');
    baixar(`instagram_perfis_${sufixo}_${carimbo}.csv`, csv(usuarios.map(linhaPerfil), COLS_PERFIS), 'text/csv;charset=utf-8');
  }

  // ---------- coleta ----------

  async function coletarPerfil(user) {
    const info = (await api(`/api/v1/users/web_profile_info/?username=${encodeURIComponent(user)}`)).data.user;
    if (typeof info.edge_owner_to_timeline_media?.count === 'number') totais.set(user, info.edge_owner_to_timeline_media.count);
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
      ingerir(j.items || [], user);
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

  let rolando = false;

  async function rolarAteOFim() {
    rolando = true;
    try { await rolarAteOFimInterno(); } finally { rolando = false; }
  }

  async function rolarAteOFimInterno() {
    const inicio = perfilAtual();
    let altura = 0, semMudanca = 0;
    // Para também se o usuário sair do perfil no meio da rolagem.
    while (!parar && semMudanca < 8 && perfilAtual() === inicio) {
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
  let soEventos = false;
  let busca = '';
  let dataDe = '';  // 'AAAA-MM-DD' ou vazio; inclusivo
  let dataAte = ''; // idem

  function diaLocal(ts) {
    return dataHora(ts).slice(0, 10);
  }

  function passaData(p) {
    if (!dataDe && !dataAte) return true;
    if (!p) return false;
    const d = diaLocal(p.taken_at);
    return (!dataDe || d >= dataDe) && (!dataAte || d <= dataAte);
  }

  function passaFiltro(p) {
    if (!passaData(p)) return false;
    if (soEventos && !(p && ehEvento(p))) return false;
    if (busca && !(p && semAcento(`${p.legenda} ${p.local}`).includes(busca))) return false;
    return true;
  }

  function agendarSelos() {
    if (selosAgendados) return;
    selosAgendados = true;
    requestAnimationFrame(() => { selosAgendados = false; aplicarSelos(); });
  }

  function aplicarSelos() {
    const filtrando = soEventos || busca || dataDe || dataAte;
    for (const a of document.querySelectorAll('a[href*="/p/"], a[href*="/reel/"]')) {
      if (!a.querySelector('img, video')) continue; // só links da grade
      const m = a.getAttribute('href').match(/\/(?:p|reel)\/([\w-]+)/);
      const p = m && posts.get(m[1]);
      // Filtro: apaga os posts que não passam (sem dados conta como não passa).
      const opacidade = filtrando && !passaFiltro(p) ? '0.12' : '';
      if (a.style.opacity !== opacidade) a.style.opacity = opacidade;

      let selo = a.querySelector(':scope > .igc-selo');
      if (!p || !mostrarSelos) { selo?.remove(); continue; }
      const u = perfilAtual() || p.perfil;
      const n = numeros(u).get(p.shortcode);
      const v = vinculo(p, u);
      const marca = v === 'colaboração' ? '🤝 ' : v === 'sem dono identificado' ? '❔ ' : '';
      const prefixo = (n ? `#${n} · ` : p.fixado ? '📌 · ' : '') + marca;
      const linha1 = `${prefixo}${dataCurta(p.taken_at)} · ♥ ${compacto(p.curtidas)} · 💬 ${compacto(p.comentarios)}` +
        (p.visualizacoes !== '' ? ` · ▶ ${compacto(p.visualizacoes)}` : '');
      const linha2 = ehEvento(p) ? `🎲 ${p.categorias_evento}${p.evento === 'possível' ? ' (?)' : ''}` : '';
      const chave = `${linha1}|${linha2}`;
      if (!selo) {
        selo = document.createElement('div');
        selo.className = 'igc-selo';
        if (getComputedStyle(a).position === 'static') a.style.position = 'relative';
        a.appendChild(selo);
      }
      if (selo.dataset.chave !== chave) {
        selo.dataset.chave = chave;
        selo.classList.toggle('igc-evento', !!linha2);
        selo.replaceChildren(criar('div', { textContent: linha1 }), ...(linha2 ? [criar('div', { className: 'igc-cat', textContent: linha2 })] : []));
      }
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
    if (!el.titulo) return;
    const u = perfilAtual();
    el.titulo.textContent = u ? `Coletor IG · @${u}` : 'Coletor IG';
    if (!u) {
      el.resumo.textContent = 'Abra um perfil.';
      for (const k in el.campos) el.campos[k].value = '';
      el.avisoPrimeiro.textContent = '';
      return;
    }
    const ps = postsDe(u);
    el.resumo.textContent = ps.length
      ? `${ps.length} posts carregados · mais antigo ${dataCurta(ps[0].taken_at)} · mais recente ${dataCurta(ps[ps.length - 1].taken_at)}`
      : 'Nenhum post carregado ainda.';
    const conta = (v) => ps.filter((p) => vinculo(p, u) === v).length;
    const colab = ps.filter((p) => vinculo(p, u) === 'colaboração');
    const colabOutro = colab.filter((p) => p.perfil !== u).length;
    el.contagens.textContent = ps.length
      ? `Próprios: ${conta('próprio')} · 🤝 Colaboração: ${colab.length} (dono é outro perfil: ${colabOutro}) · ❔ Sem dono identificado: ${conta('sem dono identificado')}`
      : '';
    atualizarLista(u, ps);
    atualizarCampos(u, ps);
  }

  // ---------- campos copiáveis do perfil ----------

  // Junta, por ordem de confiança: coleta via API > respostas capturadas > HTML da página.
  function dadosPerfil(u) {
    const api = perfis.get(u) || {};
    const cap = capturados.get(u) || {};
    const meta = (prop) => document.querySelector(`meta[property="${prop}"]`)?.content || '';
    // As meta tags podem ficar de um perfil anterior após navegar; só valem se citarem este @.
    const titulo = meta('og:title');
    const metaValida = titulo.toLowerCase().includes(`@${u})`);
    const nomeMeta = metaValida ? titulo.split(' (@')[0].trim() : '';
    const segMeta = metaValida ? (meta('og:description').match(/^([\d.,]+\s*(?:mil|mi|k|m)?)\s*(?:followers|seguidores)/i)?.[1]?.trim() || '') : '';
    // Link da bio na página: o Instagram o embrulha em l.instagram.com/?u=<destino>.
    let siteDom = '';
    const a = document.querySelector('header a[href*="l.instagram.com"]');
    if (a) { try { siteDom = new URL(a.href).searchParams.get('u') || ''; } catch (_) { /* ignora */ } }
    const escolher = (...vs) => vs.find((v) => v !== '' && v != null) ?? '';
    return {
      nome: escolher(api.nome, cap.nome, nomeMeta),
      seguidores: String(escolher(api.seguidores, cap.seguidores, segMeta)),
      site: escolher(api.site, cap.site, siteDom),
    };
  }

  function atualizarCampos(u, ps) {
    const d = dadosPerfil(u);
    const total = totais.get(u);
    const completo = total != null && ps.length >= total;
    const valores = {
      nome: d.nome,
      url: `https://www.instagram.com/${u}/`,
      site: d.site,
      seguidores: d.seguidores,
      primeiro: ps.length ? new Date(ps[0].taken_at * 1000).toLocaleDateString('pt-BR') : '',
      // Total declarado pelo Instagram no perfil, não o nº de posts carregados.
      total: total != null ? String(total) : '',
      ...periodo(ps),
    };
    for (const k in valores) if (el.campos[k].value !== valores[k]) el.campos[k].value = valores[k];
    el.avisoPrimeiro.textContent = !ps.length ? '' : completo ? '' : ` (parcial: ${ps.length}/${total ?? '?'} posts)`;

    // Campos do período: só aparecem com alguma data no filtro.
    const comPeriodo = !!(dataDe || dataAte);
    el.blocoPeriodo.style.display = comPeriodo ? '' : 'none';
    if (!comPeriodo) return;
    // Se a grade não está toda carregada e o período começa antes do post mais antigo
    // carregado, pode haver posts do período que ainda não vieram.
    const maisAntigo = ps.length ? diaLocal(ps[0].taken_at) : '';
    const podeFaltar = !completo && (!dataDe || !maisAntigo || dataDe <= maisAntigo);
    el.avisoPeriodo.textContent = podeFaltar ? ' (parcial: carregue mais posts)' : '';
    const semNumero = ps.filter((p) => passaData(p) && p.comentarios === '').length;
    el.avisoComentarios.textContent = (podeFaltar ? ' (parcial: carregue mais posts)' : '') +
      (semNumero ? ` (${semNumero} post(s) sem contagem)` : '');
  }

  // Nº de posts e soma de comentários dos posts carregados dentro do filtro de data.
  function periodo(ps) {
    if (!dataDe && !dataAte) return { n_periodo: '', comentarios_periodo: '' };
    const doPeriodo = ps.filter(passaData);
    const soma = doPeriodo.reduce((s, p) => s + (Number(p.comentarios) || 0), 0);
    return { n_periodo: String(doPeriodo.length), comentarios_periodo: String(soma) };
  }

  async function copiar(texto, botao) {
    try { await navigator.clipboard.writeText(texto); } catch (_) {
      // Sem permissão para a API de área de transferência: usa o método antigo.
      const t = criar('textarea', { value: texto });
      hospedeiro.shadowRoot.appendChild(t);
      t.select();
      document.execCommand('copy');
      t.remove();
    }
    botao.textContent = '✓';
    setTimeout(() => { botao.textContent = '⧉'; }, 1200);
  }

  let chaveLista = '';

  // Lista no painel: com busca, os posts cuja legenda contém o termo; sem busca,
  // os possíveis eventos. Em ambos, só os do período marcado no filtro de data.
  // Mais recentes primeiro; cada item abre o post numa aba nova.
  function atualizarLista(u, ps) {
    const lista = ps.filter((p) => (busca ? passaFiltro(p) : passaData(p) && ehEvento(p))).reverse();
    const chave = `${u}|${busca}|${soEventos}|${dataDe}|${dataAte}|${lista.length}|${ps.length}`;
    if (chave === chaveLista) return;
    chaveLista = chave;
    const periodo = dataDe || dataAte ? ' no período' : '';
    el.listaTitulo.textContent = busca
      ? `Posts com "${el.busca.value.trim()}"${periodo} (${lista.length})`
      : `Possíveis eventos${periodo} (${lista.length} de ${ps.length} posts)`;
    el.lista.replaceChildren(...lista.map((p) => {
      const trecho = p.legenda.replace(/\s+/g, ' ').slice(0, 110);
      return criar('a', { href: p.url, target: '_blank', title: p.legenda }, [
        criar('b', { textContent: `${dataCurta(p.taken_at)}${p.categorias_evento ? ' · ' + p.categorias_evento : ''}${p.evento === 'possível' ? ' (?)' : ''}` }),
        criar('span', { textContent: trecho + (p.legenda.length > 110 ? '…' : '') }),
      ]);
    }));
  }

  function atualizarBotoes() {
    for (const b of el.acoes) b.disabled = ocupado;
    el.parar.disabled = !ocupado;
  }

  const CSS_SELOS = `
    .igc-selo{position:absolute;left:4px;bottom:4px;z-index:3;pointer-events:none;
      max-width:calc(100% - 8px);box-sizing:border-box;
      background:rgba(0,0,0,.78);color:#fff;font:600 14px/1.35 system-ui,sans-serif;
      padding:4px 8px;border-radius:6px}
    .igc-selo.igc-evento{background:rgba(196,72,0,.92)}
    .igc-cat{font-size:13px;font-weight:700}`;

  // O painel fica num shadow DOM: o CSS do Instagram não o afeta.
  const CSS_PAINEL = `
    #igc-painel{position:fixed;top:12px;right:12px;z-index:2147483647;width:340px;
      max-height:calc(100vh - 24px);overflow:auto;box-sizing:border-box;
      background:#fff;color:#111;border:1px solid #ccc;border-radius:10px;
      box-shadow:0 4px 16px rgba(0,0,0,.18);font:13px/1.4 system-ui,sans-serif;padding:10px}
    @media (prefers-color-scheme:dark){#igc-painel{background:#1e1e1e;color:#eee;border-color:#444}}
    #igc-painel.min>*:not(header){display:none}
    header{display:flex;justify-content:space-between;align-items:center;font-weight:700;cursor:pointer}
    p{margin:6px 0}
    .linha{display:flex;flex-wrap:wrap;gap:6px;margin:6px 0}
    button{flex:1 1 auto;padding:5px 8px;border-radius:6px;border:1px solid #888;
      background:transparent;color:inherit;cursor:pointer;font:inherit}
    button:disabled{opacity:.4;cursor:default}
    textarea{width:100%;box-sizing:border-box;height:70px;font:12px monospace;
      background:transparent;color:inherit;border:1px solid #888;border-radius:6px}
    .status{font-size:12px;opacity:.8}
    input[type=search]{width:100%;box-sizing:border-box;margin:6px 0;padding:5px 8px;font:inherit;
      background:transparent;color:inherit;border:1px solid #888;border-radius:6px}
    label{display:inline-block;margin-right:12px}
    .subtitulo{font-weight:700;margin-top:10px}
    .lista{max-height:260px;overflow:auto;border-top:1px solid #8885}
    .lista a{display:block;padding:5px 2px;border-bottom:1px solid #8885;color:inherit;text-decoration:none;font-size:12px}
    .lista a:hover{background:#8882}
    .lista b{color:#d35400}
    .lista span{display:block;opacity:.75}
    .campo{margin:4px 0}
    .campo>span{display:block;font-size:11px;opacity:.75}
    .campo div{display:flex;gap:4px}
    .campo input,.datas input{flex:1 1 auto;min-width:0;padding:4px 6px;font:12px system-ui,sans-serif;
      background:transparent;color:inherit;border:1px solid #888;border-radius:6px}
    .campo button{flex:0 0 30px;padding:2px}
    .datas{display:flex;gap:6px;align-items:center;margin:6px 0}
    .datas input{color-scheme:light dark}
    .datas button{flex:0 0 auto}`;

  let hospedeiro = null;

  const PREF_ROLAR = 'igc-rolar-ao-abrir';
  let rolarAoAbrir = lerPref(PREF_ROLAR);
  let ultimoAutoRolado = null;

  // Dispara a rolagem uma vez por perfil aberto (abrir um post e voltar não repete).
  function talvezRolarSozinho() {
    const u = perfilAtual();
    if (!rolarAoAbrir || !u || u === ultimoAutoRolado || ocupado) return;
    ultimoAutoRolado = u;
    setTimeout(() => { if (perfilAtual() === u && !ocupado) executar(rolarAteOFim); }, 2000);
  }

  function montarPainel() {
    const botao = (texto, fn) => criar('button', { textContent: texto, onclick: fn });

    el.titulo = criar('span', { textContent: 'Coletor IG' });
    el.resumo = criar('p');
    el.status = criar('p', { className: 'status' });
    el.fila = criar('textarea', { placeholder: 'Fila: um @perfil ou link por linha' });

    const bRolar = botao('Rolar até o fim', () => executar(rolarAteOFim));
    // Volta ao topo; se a rolagem automática estiver em curso, para ela antes.
    const bTopo = botao('Voltar ao topo', () => {
      if (rolando) parar = true;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    el.contagens = criar('p', { className: 'status' });
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
    const chkAuto = criar('input', { type: 'checkbox', checked: rolarAoAbrir, onchange: (e) => { rolarAoAbrir = e.target.checked; gravarPref(PREF_ROLAR, rolarAoAbrir); } });
    const chkEventos = criar('input', { type: 'checkbox', onchange: (e) => { soEventos = e.target.checked; aplicarSelos(); atualizarResumo(); } });
    el.busca = criar('input', {
      type: 'search',
      placeholder: 'Buscar na legenda (ex.: torneio, quiz)',
      oninput: (e) => { busca = semAcento(e.target.value.trim()); aplicarSelos(); atualizarResumo(); },
    });
    // Campos copiáveis do perfil aberto.
    el.campos = {};
    const campo = (chave, rotulo, extra) => {
      const entrada = criar('input', { type: 'text', readOnly: true });
      el.campos[chave] = entrada;
      const bCopiar = criar('button', { textContent: '⧉', title: 'Copiar', onclick: () => copiar(entrada.value, bCopiar) });
      return criar('div', { className: 'campo' }, [
        criar('span', {}, [document.createTextNode(rotulo), ...(extra ? [extra] : [])]),
        criar('div', {}, [entrada, bCopiar]),
      ]);
    };
    el.avisoPrimeiro = criar('span');
    const blocoCampos = criar('div', {}, [
      criar('p', { className: 'subtitulo', textContent: 'Dados do perfil' }),
      campo('primeiro', 'Data do primeiro post', el.avisoPrimeiro),
      campo('seguidores', 'Seguidores'),
      campo('total', 'Total de posts (declarado no perfil)'),
      campo('site', 'Site / Linktree'),
      campo('url', 'URL do Instagram'),
      campo('nome', 'Nome do estabelecimento'),
    ]);
    el.avisoPeriodo = criar('span');
    el.avisoComentarios = criar('span');
    el.blocoPeriodo = criar('div', { style: 'display:none' }, [
      campo('n_periodo', 'Posts no período', el.avisoPeriodo),
      campo('comentarios_periodo', 'Comentários no período (soma)', el.avisoComentarios),
    ]);

    // Filtro de data (inclusivo nas duas pontas).
    const aoMudarData = () => { dataDe = el.de.value; dataAte = el.ate.value; aplicarSelos(); atualizarResumo(); };
    el.de = criar('input', { type: 'date', title: 'De (inclusivo)', onchange: aoMudarData });
    el.ate = criar('input', { type: 'date', title: 'Até (inclusivo)', onchange: aoMudarData });
    const bLimparDatas = criar('button', { textContent: '✕', title: 'Limpar datas', onclick: () => { el.de.value = ''; el.ate.value = ''; aoMudarData(); } });
    const blocoDatas = criar('div', { className: 'datas' }, [
      document.createTextNode('De'), el.de, document.createTextNode('até'), el.ate, bLimparDatas,
    ]);

    el.listaTitulo = criar('p', { className: 'subtitulo' });
    el.lista = criar('div', { className: 'lista' });
    const minimizar = criar('span', { textContent: '–' });
    const cabecalho = criar('header', {}, [el.titulo, minimizar]);
    const painel = criar('div', { id: 'igc-painel' }, [
      cabecalho,
      el.resumo,
      el.contagens,
      criar('div', { className: 'linha' }, [bRolar, bTopo, bApi]),
      criar('div', { className: 'linha' }, [bCsv, bJson, el.parar]),
      blocoCampos,
      criar('label', {}, [chkAuto, document.createTextNode(' Rolar até o fim ao abrir um perfil')]),
      criar('label', {}, [chk, document.createTextNode(' Selos na grade')]),
      criar('p', { className: 'subtitulo', textContent: 'Esmaecer na grade' }),
      blocoDatas,
      el.blocoPeriodo,
      criar('label', {}, [chkEventos, document.createTextNode(' Posts que não são possíveis eventos')]),
      el.busca,
      el.listaTitulo,
      el.lista,
      el.fila,
      criar('div', { className: 'linha' }, [bFila]),
      el.status,
    ]);
    cabecalho.onclick = () => { painel.classList.toggle('min'); minimizar.textContent = painel.classList.contains('min') ? '+' : '–'; };

    hospedeiro = criar('div', { id: 'igc-hospedeiro' });
    const raiz = hospedeiro.attachShadow({ mode: 'open' });
    raiz.appendChild(criar('style', { textContent: CSS_PAINEL }));
    raiz.appendChild(painel);
    atualizarBotoes();
  }

  // O React do Instagram pode refazer o <body> ao hidratar a página e apagar o que
  // foi inserido antes. Por isso o painel fica fora do <body> e é reposto se sumir.
  function garantirPainel() {
    const raiz = document.documentElement;
    if (!raiz) return;
    if (!document.getElementById('igc-estilo-selos')) {
      (document.head || raiz).appendChild(criar('style', { id: 'igc-estilo-selos', textContent: CSS_SELOS }));
    }
    if (!hospedeiro) montarPainel();
    if (!hospedeiro.isConnected) raiz.appendChild(hospedeiro);
  }

  function iniciar() {
    console.info('[Coletor IG] iniciado');
    lerDadosEmbutidos();
    let caminho = location.pathname;
    setInterval(() => {
      try {
        garantirPainel();
        // O Instagram troca de página sem recarregar; acompanha a URL.
        if (location.pathname !== caminho) { caminho = location.pathname; lerDadosEmbutidos(); }
        atualizarResumo();
        talvezRolarSozinho();
      } catch (e) { console.error('[Coletor IG]', e); }
    }, 1000);
    garantirPainel();
    atualizarResumo();
    new MutationObserver(agendarSelos).observe(document.documentElement, { childList: true, subtree: true });
    agendarSelos();
  }

  console.info('[Coletor IG] carregado');
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
  else iniciar();
})();
