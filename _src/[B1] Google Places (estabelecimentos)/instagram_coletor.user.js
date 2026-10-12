// ==UserScript==
// @name         Coletor de perfis do Instagram (TCC Luderia)
// @namespace    tcc-luderia
// @version      2026.10.12-6
// @description  Mostra data, curtidas e comentários sobre cada post da grade; rola até o primeiro post; coleta posts e dados de perfis e exporta CSV/JSON.
// @match        https://www.instagram.com/*
// @run-at       document-start
// @grant        none
// ==/UserScript==

/*
 * Uso pessoal, para a coleta do Bloco B1 (acervo, preço, cobrança e idade do perfil).
 *
 * Como funciona:
 *  - Intercepta as respostas que o próprio site recebe (fetch/XHR) e guarda todo objeto
 *    com `code` + `taken_at` (um post). Assim a grade ganha um selo com data, curtidas
 *    e comentários sem abrir post por post.
 *  - "Rolar até o fim": rola a página sozinho até o site parar de carregar posts.
 *  - Botões de API: pedem os posts direto ao endpoint interno que o site usa,
 *    12 por vez, com pausa aleatória entre pedidos. Mais rápido que rolar.
 *    "Coletar período (API)": só os posts até a data "De" (2-3 pedidos por perfil).
 *    "Histórico completo (API)": vai até o primeiro post; use só para essa data.
 *  - "Fila": coleta vários perfis em sequência, com pausa maior entre perfis,
 *    e baixa dois CSV no fim (posts e perfis).
 *
 *  - Posts, dados de perfil e marcações ficam salvos no navegador (IndexedDB do
 *    instagram.com); recarregar não perde a coleta. "Apagar dados salvos" zera tudo.
 *  - Campos do período contam só posts de que o perfil é dono: colaboração conta uma
 *    vez, para o dono. Cada dado do perfil traz a fonte (API, JSON, cabeçalho, meta).
 *  - ✓/✗ na lista marcam à mão se o post é evento; o painel mostra a precisão do
 *    classificador e o CSV de posts traz a coluna evento_validado.
 *
 * Os CSV usam ";" como separador e UTF-8 com BOM (abrem direto no Excel pt-BR).
 * No pandas: pd.read_csv(caminho, sep=";").
 *
 * Use uma conta secundária. Limite de pedidos (HTTP 429): o script espera 15, 30 e
 * 60 min e tenta de novo; se continuar bloqueado, para. A coleta de um perfil
 * continua da página em que parou (cursor salvo), sem recomeçar do primeiro post.
 * Sessão recusada (401/403): para na hora; entre de novo no Instagram.
 */

(function () {
  'use strict';

  const APP_ID = '936619743392459';
  const PAUSA_PEDIDO = [3000, 6000];   // ms entre páginas de posts
  const PAUSA_PERFIL = [45000, 90000]; // ms entre perfis da fila
  // A cada PAGINAS_POR_BLOCO pedidos, uma pausa longa: espalha a carga e reduz o 429.
  const PAGINAS_POR_BLOCO = 60;
  const PAUSA_BLOCO = [5 * 60000, 8 * 60000];
  const ESPERAS_429 = [15, 30, 60]; // minutos de espera antes de cada nova tentativa
  const RESERVADOS = new Set(['explore', 'p', 'reel', 'reels', 'direct', 'accounts', 'stories', 'about', 'legal', 'developer', 'web']);

  const posts = new Map();   // shortcode -> post normalizado
  const perfis = new Map();  // username -> dados do perfil
  const totais = new Map();  // username -> nº de posts declarado pelo Instagram (respostas/API)
  const totalPagina = new Map(); // username -> nº de posts lido do cabeçalho/meta (exato)
  const validacao = new Map(); // shortcode -> 'sim' | 'não' (é evento? marcado à mão)
  let versaoValidacao = 0;
  let parar = false;
  let ocupado = false;

  // ---------- armazenamento local (IndexedDB) ----------

  // Posts e dados de perfil ficam salvos no navegador: recarregar a página não
  // obriga a coletar de novo. Os posts vão um a um (só os alterados); os mapas
  // pequenos vão inteiros, quando mudam.
  const sujos = new Set(); // shortcodes alterados desde o último salvamento
  let banco = null;
  let ultimoKv = '';

  function abrirBanco() {
    return new Promise((ok, erro) => {
      const r = indexedDB.open('igc-coletor', 1);
      r.onupgradeneeded = () => {
        r.result.createObjectStore('posts', { keyPath: 'shortcode' });
        r.result.createObjectStore('kv');
      };
      r.onsuccess = () => ok(r.result);
      r.onerror = () => erro(r.error);
    });
  }

  const pedido = (r) => new Promise((ok, erro) => { r.onsuccess = () => ok(r.result); r.onerror = () => erro(r.error); });

  function estadoKv() {
    return JSON.stringify({
      perfis: [...perfis], capturados: [...capturados], totais: [...totais],
      totalPagina: [...totalPagina], validacao: [...validacao],
    });
  }

  async function carregarSalvos() {
    try {
      banco = await abrirBanco();
      const tx = banco.transaction(['posts', 'kv'], 'readonly');
      const [lista, kv] = await Promise.all([pedido(tx.objectStore('posts').getAll()), pedido(tx.objectStore('kv').get('estado'))]);
      // O que chegou nesta sessão antes da leitura prevalece sobre o salvo.
      for (const p of lista) { const atual = posts.get(p.shortcode); posts.set(p.shortcode, atual ? mesclar(p, atual) : p); }
      if (kv) {
        const e = JSON.parse(kv);
        for (const [k, v] of e.perfis || []) if (!perfis.has(k)) perfis.set(k, v);
        for (const [k, v] of e.capturados || []) capturados.set(k, mesclar(v, capturados.get(k) || {}));
        for (const [k, v] of e.totais || []) if (!totais.has(k)) totais.set(k, v);
        for (const [k, v] of e.totalPagina || []) if (!totalPagina.has(k)) totalPagina.set(k, v);
        for (const [k, v] of e.validacao || []) if (!validacao.has(k)) validacao.set(k, v);
        versaoValidacao++;
      }
      const nPerfis = new Set(lista.map((p) => p.perfil).filter(Boolean)).size;
      if (lista.length) status(`Dados salvos carregados: ${lista.length} posts de ${nPerfis} perfis.`);
      agendarSelos();
      atualizarResumo();
    } catch (e) { console.warn('[Coletor IG] sem armazenamento local', e); }
  }

  async function salvar() {
    if (!banco) return;
    const kv = estadoKv();
    if (!sujos.size && kv === ultimoKv) return;
    const lote = [...sujos];
    sujos.clear();
    try {
      const tx = banco.transaction(['posts', 'kv'], 'readwrite');
      const loja = tx.objectStore('posts');
      for (const s of lote) { const p = posts.get(s); if (p) loja.put(p); }
      if (kv !== ultimoKv) tx.objectStore('kv').put(kv, 'estado');
      await new Promise((ok, erro) => { tx.oncomplete = ok; tx.onerror = () => erro(tx.error); });
      ultimoKv = kv;
    } catch (e) {
      for (const s of lote) sujos.add(s); // tenta de novo no próximo ciclo
      console.warn('[Coletor IG] falha ao salvar', e);
    }
  }

  async function apagarSalvos() {
    if (!confirm('Apagar todos os posts e perfis salvos neste navegador? Exporte antes o que quiser guardar.')) return;
    posts.clear(); perfis.clear(); capturados.clear(); totais.clear(); totalPagina.clear(); validacao.clear();
    sujos.clear(); versaoValidacao++;
    try { localStorage.removeItem(CHAVE_FILA); localStorage.removeItem(CHAVE_CURSORES); } catch (_) { /* ignora */ }
    if (banco) {
      const tx = banco.transaction(['posts', 'kv'], 'readwrite');
      tx.objectStore('posts').clear();
      tx.objectStore('kv').clear();
    }
    ultimoKv = '';
    status('Dados salvos apagados.');
    lerDadosEmbutidos();
    agendarSelos();
    atualizarResumo();
  }

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
      // Momento em que a contagem de comentários foi lida (ela cresce com o tempo).
      medido_em: o.comment_count != null ? Math.floor(Date.now() / 1000) : '',
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
  function ingerir(dado, pagina = perfilDaGrade() || '', prof = 0) {
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
      sujos.add(novo.shortcode);
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
      bio: typeof u.biography === 'string' ? u.biography : '',
    };
    // Só registra quando veio algo além do nome (dono de post traz só username e nome).
    if (novo.seguidores !== '' || novo.site) novo.coletado_em = dataHora(Date.now() / 1000);
    const chave = u.username.toLowerCase();
    capturados.set(chave, mesclar(capturados.get(chave) || {}, novo));
  }

  function mesclar(a, b) {
    const r = { ...a };
    for (const k in b) if (b[k] !== '' && b[k] != null && !(k === 'pagina_coleta' && a[k])) r[k] = b[k];
    return r;
  }

  function ingerirTexto(t) {
    // Posts têm `taken_at`; os dados do perfil (seguidores, links da bio) vêm em
    // blocos à parte, sem posts, e também precisam passar.
    if (!t || !/taken_at|bio_links|follower_count|media_count|external_url/.test(t)) return;
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

  // Perfil cuja grade de posts está aberta (aba principal ou reels). A aba "marcados"
  // fica de fora: lá aparecem posts de outros perfis que só marcaram este.
  function perfilDaGrade() {
    return /\/tagged\/?$/.test(location.pathname) ? null : perfilAtual();
  }

  // Vínculo do post com o perfil: próprio, colaboração (o perfil é dono ou coautor)
  // ou sem dono identificado (a resposta não trouxe o dono).
  // A presença do post na grade do perfil (p.grades, anotada em aplicarSelos) também
  // conta: as respostas do site às vezes omitem o dono ou a lista de coautores, e um
  // post de outro dono só aparece na grade deste perfil se ele for coautor.
  function vinculo(p, user) {
    const coaut = p.coautores ? p.coautores.split(', ') : [];
    const naGrade = (p.grades || []).includes(user);
    if (p.perfil === user) return coaut.length ? 'colaboração' : 'próprio';
    if (coaut.includes(user) || (p.perfil && naGrade)) return 'colaboração';
    if (!p.perfil && (p.pagina_coleta === user || naGrade)) return 'sem dono identificado';
    return '';
  }

  function postsDe(user) {
    return [...posts.values()]
      .filter((p) => vinculo(p, user))
      .sort((a, b) => a.taken_at - b.taken_at);
  }


  // Total de posts declarado: respostas do site ou API; na falta, o lido da página.
  function totalDe(u) {
    return totais.get(u) ?? totalPagina.get(u);
  }

  // Número do post contado a partir do primeiro publicado (#1 = mais antigo).
  // Com todos os posts carregados, é a ordem cronológica. Com carga parcial, conta
  // de trás para frente a partir do total declarado pelo Instagram; posts fixados
  // ficam sem número até a carga completa, porque aparecem fora de ordem no topo.
  // Posts arquivados ou apagados não entram no total, então o número é o da grade atual.
  let cacheNumeros = { chave: '', mapa: new Map() };

  function numeros(user) {
    const total = totalDe(user);
    const ps = postsDe(user);
    const chave = `${user}|${ps.length}|${total}`;
    if (cacheNumeros.chave === chave) return cacheNumeros.mapa;
    const mapa = new Map();
    if (total && ps.length >= total) ps.forEach((p, i) => mapa.set(p.shortcode, i + 1));
    else if (total) ps.filter((p) => !p.fixado).reverse().forEach((p, i) => mapa.set(p.shortcode, total - i));
    cacheNumeros = { chave, mapa };
    return mapa;
  }

  // Preferência salva; sem valor salvo, vale o padrão.
  function lerPref(chave, padrao = false) {
    try { const v = localStorage.getItem(chave); return v === null ? padrao : v === '1'; } catch (_) { return padrao; }
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
    if (!r.ok) throw Object.assign(new Error(`HTTP ${r.status} em ${caminho.split('?')[0]}`), { http: r.status });
    const j = await r.json();
    if (j.status === 'fail') throw new Error(j.message || 'resposta "fail" do Instagram');
    return j;
  }

  // ---------- exportação ----------

  const COLS_POSTS = ['perfil', 'vinculo', 'coautores', 'pagina_coleta', 'numero_post', 'fixado', 'shortcode', 'url', 'data_hora', 'taken_at', 'tipo', 'curtidas', 'comentarios', 'visualizacoes', 'n_midias', 'local', 'evento', 'categorias_evento', 'evento_validado', 'legenda'];
  // n_posts_coletados conta também colaborações em que o dono é outro perfil (o mesmo
  // post entra em mais de um perfil); n_posts_proprios conta só os do dono, um perfil por post.
  // Colunas *_periodo: só posts cujo dono é o perfil, dentro de periodo_de..periodo_ate.
  // Colunas *_periodo_com_compart: todos os posts do perfil no período, como na grade:
  // somam também colaborações de outro dono e posts sem dono identificado; contagem não
  // exclusiva (o mesmo post entra no dono e no coautor).
  // nome: nome exibido sem o slogan; nome_perfil: como aparece no Instagram.
  const COLS_PERFIS = ['perfil', 'nome', 'nome_perfil', 'fonte_nome', 'categoria', 'privado', 'seguidores', 'fonte_seguidores', 'seguindo',
    'n_posts_declarado', 'fonte_n_posts', 'n_posts_coletados', 'n_posts_proprios', 'grade_completa', 'n_posts_evento',
    'primeiro_post', 'ultimo_post', 'site', 'fonte_site',
    'periodo_de', 'periodo_ate', 'n_posts_periodo', 'comentarios_periodo', 'n_posts_periodo_sem_contagem',
    'n_posts_periodo_com_compart', 'comentarios_periodo_com_compart', 'n_posts_periodo_com_compart_sem_contagem',
    'n_colab_outro_dono_periodo', 'n_sem_dono_periodo',
    'curtidas_periodo', 'n_posts_periodo_sem_curtidas', 'curtidas_periodo_com_compart', 'n_posts_periodo_com_compart_sem_curtidas',
    'comentarios_medidos_de', 'comentarios_medidos_ate', 'periodo_pronto', 'pendencias_periodo', 'primeiro_post_definitivo',
    'indicios_aluguel', 'indicios_venda', 'indicios_precificacao', 'precos_citados_precificacao', 'bio', 'coletado_em'];
  // curtidas_*: soma das curtidas no período (posts com curtidas ocultas ficam em *_sem_curtidas).
  // comentarios_medidos_de/ate: quando as contagens de comentários do período foram lidas.
  // periodo_pronto: "sim" quando os campos do período são definitivos (ver prontidao()).
  // indicios_*: nº de trechos (bio + legendas carregadas) com termos de aluguel, venda ou
  // cobrança; servem para achar evidência, não para decidir sozinhos.

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
    const p = perfis.get(user) || {};
    const ps = postsDe(user);
    const d = dadosPerfil(user);
    const per = resumoPeriodo(ps, user);
    const total = totalDe(user);
    const pr = prontidao(user, ps, d, per && (contarCompartilhados ? per.comCompartilhados : per.proprios));
    const ind = indicios(user, ps);
    return {
      ...p,
      perfil: user,
      nome: d.nome.v, nome_perfil: d.nome_perfil.v, fonte_nome: d.nome.f,
      seguidores: d.seguidores.v, fonte_seguidores: d.seguidores.f,
      n_posts_declarado: d.posts.v, fonte_n_posts: d.posts.f,
      site: d.site.v, fonte_site: d.site.f,
      n_posts_coletados: ps.length,
      n_posts_proprios: ps.filter((x) => x.perfil === user).length,
      grade_completa: total != null && ps.length >= total ? 'sim' : 'não',
      n_posts_evento: ps.filter(ehEvento).length,
      primeiro_post: ps.length ? dataHora(ps[0].taken_at) : '',
      ultimo_post: ps.length ? dataHora(ps[ps.length - 1].taken_at) : '',
      periodo_de: per ? dataDe : '',
      periodo_ate: per ? dataAte : '',
      n_posts_periodo: per?.proprios.n ?? '',
      comentarios_periodo: per?.proprios.comentarios ?? '',
      n_posts_periodo_sem_contagem: per?.proprios.semContagem ?? '',
      n_posts_periodo_com_compart: per?.comCompartilhados.n ?? '',
      comentarios_periodo_com_compart: per?.comCompartilhados.comentarios ?? '',
      n_posts_periodo_com_compart_sem_contagem: per?.comCompartilhados.semContagem ?? '',
      n_colab_outro_dono_periodo: per?.colabOutroDono ?? '',
      n_sem_dono_periodo: per?.semDono ?? '',
      curtidas_periodo: per?.proprios.curtidas ?? '',
      n_posts_periodo_sem_curtidas: per?.proprios.semCurtidas ?? '',
      curtidas_periodo_com_compart: per?.comCompartilhados.curtidas ?? '',
      n_posts_periodo_com_compart_sem_curtidas: per?.comCompartilhados.semCurtidas ?? '',
      comentarios_medidos_de: per?.comCompartilhados.medidoDe ? dataHora(per.comCompartilhados.medidoDe) : '',
      comentarios_medidos_ate: per?.comCompartilhados.medidoAte ? dataHora(per.comCompartilhados.medidoAte) : '',
      periodo_pronto: pr.periodo ? 'sim' : 'não',
      pendencias_periodo: pr.pendencias.join('; '),
      primeiro_post_definitivo: pr.primeiro ? 'sim' : 'não',
      indicios_aluguel: ind.aluguel.length,
      indicios_venda: ind.venda.length,
      indicios_precificacao: ind.precificacao.length,
      precos_citados_precificacao: [...new Set(ind.precificacao.flatMap((x) => x.precos))].join(', '),
      coletado_em: p.coletado_em || capturados.get(user)?.coletado_em || dataHora(Date.now() / 1000),
    };
  }

  function exportar(usuarios, sufixo) {
    const carimbo = new Date().toISOString().slice(0, 10);
    const linhas = usuarios.flatMap((u) => {
      const nums = numeros(u);
      return postsDe(u).map((p) => ({ ...p, vinculo: vinculo(p, u), numero_post: nums.get(p.shortcode) ?? '', data_hora: dataHora(p.taken_at), evento_validado: validacao.get(p.shortcode) || '' }));
    });
    baixar(`instagram_posts_${sufixo}_${carimbo}.csv`, csv(linhas, COLS_POSTS), 'text/csv;charset=utf-8');
    baixar(`instagram_perfis_${sufixo}_${carimbo}.csv`, csv(usuarios.map(linhaPerfil), COLS_PERFIS), 'text/csv;charset=utf-8');
  }

  // ---------- coleta ----------

  let pedidosFeitos = 0;

  // Espera mostrando a contagem regressiva; "Parar" interrompe.
  async function esperarContando(ms, texto) {
    const fim = Date.now() + ms;
    while (Date.now() < fim) {
      if (parar) throw new Error('interrompido');
      const s = Math.ceil((fim - Date.now()) / 1000);
      status(`${texto} ${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`);
      await esperar(1000);
    }
  }

  // Pedido à API com espera em caso de limite (429) e pausa longa a cada bloco de pedidos.
  async function apiPaciente(caminho) {
    if (pedidosFeitos && pedidosFeitos % PAGINAS_POR_BLOCO === 0) {
      await esperarContando(sortear(PAUSA_BLOCO), `Pausa preventiva após ${pedidosFeitos} pedidos. Retoma em`);
    }
    for (let tentativa = 0; ; tentativa++) {
      try {
        const j = await api(caminho);
        pedidosFeitos++;
        return j;
      } catch (e) {
        if (e.http !== 429 || tentativa >= ESPERAS_429.length) throw e;
        await esperarContando(ESPERAS_429[tentativa] * 60000,
          `Instagram limitou os pedidos (429). Tentativa ${tentativa + 2}/${ESPERAS_429.length + 1} em`);
      }
    }
  }

  // Cursor da paginação por perfil (id do usuário e max_id da próxima página), salvo a
  // cada página. Uma coleta interrompida continua daí; ao terminar, o cursor é apagado.
  const CHAVE_CURSORES = 'igc-cursores';

  function cursores() {
    try { return JSON.parse(localStorage.getItem(CHAVE_CURSORES) || '{}'); } catch (_) { return {}; }
  }

  function gravarCursor(user, c) {
    const todos = cursores();
    if (c) todos[user] = c; else delete todos[user];
    try { localStorage.setItem(CHAVE_CURSORES, JSON.stringify(todos)); } catch (_) { /* ignora */ }
  }

  // modo 'periodo': começa do post mais recente e para assim que a página traz um post
  //   (não fixado) anterior à data "De". Poucos pedidos por perfil; não mexe no cursor.
  // modo 'completo': vai até o primeiro post (data do primeiro post); continua do
  //   cursor salvo, se houver.
  async function coletarPerfil(user, modo = 'completo') {
    const info = (await apiPaciente(`/api/v1/users/web_profile_info/?username=${encodeURIComponent(user)}`)).data.user;
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

    const periodo = modo === 'periodo';
    if (periodo && !dataDe) throw new Error('defina a data "De" do período antes de coletar só o período');
    const salvo = periodo ? null : cursores()[user];
    let maxId = salvo?.id === info.id ? salvo.maxId : '';
    if (maxId) status(`@${user}: continuando de onde parou.`);
    for (;;) {
      if (parar) throw new Error('interrompido');
      const j = await apiPaciente(`/api/v1/feed/user/${info.id}/?count=12${maxId ? `&max_id=${maxId}` : ''}`);
      ingerir(j.items || [], user);
      agendarSelos();
      const ps = postsDe(user);
      status(`@${user}: ${ps.length}/${info.edge_owner_to_timeline_media?.count ?? '?'} posts · mais antigo ${ps[0] ? dataCurta(ps[0].taken_at) : '-'}`);
      const passouDoInicio = periodo && (j.items || [])
        .some((i) => !i.timeline_pinned_user_ids?.length && diaLocal(i.taken_at) < dataDe);
      if (passouDoInicio) { status(`@${user}: período coberto (${postsDe(user).filter(passaData).length} posts).`); return; }
      if (!j.more_available || !j.next_max_id) break;
      maxId = j.next_max_id;
      if (!periodo) gravarCursor(user, { id: info.id, maxId });
      await esperar(sortear(PAUSA_PEDIDO));
    }
    if (!periodo) gravarCursor(user, null);
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

  // A fila em curso fica no localStorage: se a página fechar ou o Instagram bloquear,
  // "Coletar fila" com a mesma lista continua dos perfis que faltam.
  const CHAVE_FILA = 'igc-fila';

  function lerFila() {
    try { return JSON.parse(localStorage.getItem(CHAVE_FILA) || 'null'); } catch (_) { return null; }
  }

  function gravarFila(f) {
    try { f ? localStorage.setItem(CHAVE_FILA, JSON.stringify(f)) : localStorage.removeItem(CHAVE_FILA); } catch (_) { /* ignora */ }
  }

  async function coletarFila(usuarios, modo) {
    const salva = lerFila();
    const mesma = salva && salva.todos.join(' ') === usuarios.join(' ') && (salva.modo || 'completo') === modo;
    const feitos = mesma ? salva.feitos.filter((u) => perfis.has(u)) : [];
    // No modo completo, perfil com a grade já toda carregada não precisa de pedido.
    if (modo === 'completo') {
      for (const u of usuarios) {
        const t = totalDe(u);
        if (!feitos.includes(u) && perfis.has(u) && t != null && postsDe(u).length >= t) feitos.push(u);
      }
    }
    gravarFila({ todos: usuarios, feitos, modo });
    if (feitos.length) status(`Continuando a fila: ${feitos.length}/${usuarios.length} perfis já coletados.`);
    try {
      const pendentes = usuarios.filter((u) => !feitos.includes(u));
      for (const [i, u] of pendentes.entries()) {
        status(`Fila ${feitos.length + 1}/${usuarios.length}: @${u}`);
        await coletarPerfil(u, modo);
        feitos.push(u);
        gravarFila({ todos: usuarios, feitos, modo });
        if (i < pendentes.length - 1) {
          const pausa = sortear(PAUSA_PERFIL);
          await esperarContando(pausa, `@${u} pronto. Próximo perfil em`);
        }
      }
      status(`Fila concluída: ${feitos.length} perfis.`);
      gravarFila(null);
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
  // Período padrão da coleta do Bloco B1; 'AAAA-MM-DD' ou vazio; inclusivo nas duas pontas.
  const PERIODO_PADRAO = ['2026-09-01', '2026-10-01'];
  let [dataDe, dataAte] = PERIODO_PADRAO;

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
    let gradeMudou = false;
    for (const a of document.querySelectorAll('a[href*="/p/"], a[href*="/reel/"]')) {
      if (!a.querySelector('img, video')) continue; // só links da grade
      const m = a.getAttribute('href').match(/\/(?:p|reel)\/([\w-]+)/);
      const p = m && posts.get(m[1]);
      // Filtro: apaga os posts que não passam (sem dados conta como não passa).
      const opacidade = filtrando && !passaFiltro(p) ? '0.12' : '';
      if (a.style.opacity !== opacidade) a.style.opacity = opacidade;

      // Anota em que grade o post foi visto (ver vinculo).
      const grade = perfilDaGrade();
      if (p && grade && !(p.grades || []).includes(grade)) {
        p.grades = [...(p.grades || []), grade];
        sujos.add(p.shortcode);
        gradeMudou = true;
      }

      let selo = a.querySelector(':scope > .igc-selo');
      if (!p || !mostrarSelos) { selo?.remove(); continue; }
      const u = perfilAtual() || p.perfil;
      const n = numeros(u).get(p.shortcode);
      const v = vinculo(p, u);
      const marca = v === 'colaboração' ? '🤝 ' : v === 'sem dono identificado' ? '❔ ' : '';
      const prefixo = (mostrarNumero && n ? `#${n} · ` : p.fixado ? '📌 · ' : '') + marca;
      const linha1 = `${prefixo}${dataCurta(p.taken_at)} · ♥ ${compacto(p.curtidas)} · 💬 ${compacto(p.comentarios)}` +
        (p.visualizacoes !== '' ? ` · ▶ ${compacto(p.visualizacoes)}` : '');
      const val = validacao.get(p.shortcode);
      const marcaVal = val === 'sim' ? ' ✔' : val === 'não' ? ' ✘' : '';
      const linha2 = ehEvento(p) ? `🎲 ${p.categorias_evento}${p.evento === 'possível' ? ' (?)' : ''}${marcaVal}`
        : val === 'sim' ? '🎲 evento (marcado à mão) ✔' : '';
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
    // Post novo na grade muda as contagens: atualiza o painel já, sem esperar o ciclo de 1 s.
    if (gradeMudou) atualizarResumo();
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
      for (const k in el.fontes) el.fontes[k].textContent = '';
      el.avisoPrimeiro.textContent = '';
      el.avisoNome.textContent = '';
      el.blocoPeriodo.style.display = 'none';
      atualizarValidacao();
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
    atualizarValidacao();
  }

  // ---------- campos copiáveis do perfil ----------

  // Converte contagem exibida em inteiro: "60,5 mil" e "60.5K" → 60500; "1,2 mi" → 1200000;
  // "3.456" e "1,234" → 3456 e 1234. Com sufixo, o valor é aproximado (só 1 casa decimal).
  function inteiro(texto) {
    const m = String(texto).trim().match(/^([\d.,]+)\s*(mil|mi|k|m)?$/i);
    if (!m) return '';
    if (!m[2]) return m[1].replace(/\D/g, '');
    const fator = { mil: 1e3, k: 1e3, mi: 1e6, m: 1e6 }[m[2].toLowerCase()];
    return String(Math.round(parseFloat(m[1].replace(',', '.')) * fator));
  }

  // Origem de cada dado do perfil, mostrada ao lado do campo e exportada no CSV.
  const FONTES = {
    API: 'botões de coleta via API (web_profile_info)',
    JSON: 'dados internos que o próprio site carregou',
    'cabeçalho': 'texto visível no cabeçalho do perfil',
    'cabeçalho ≈': 'só o domínio exibido no cabeçalho ("dominio.com e mais N"); o caminho do link pode faltar',
    meta: 'resumo da página (meta tag)',
    'meta ≈': 'resumo da página (meta tag), abreviado pelo Instagram: valor aproximado',
    'página (salvo)': 'lido do cabeçalho ou da meta tag numa visita anterior a este perfil',
  };

  // Junta, por ordem de confiança: coleta via API > respostas capturadas > HTML da página.
  // Cada campo vem como { v: valor, f: fonte }. O HTML só vale para o perfil aberto.
  function dadosPerfil(u) {
    const api = perfis.get(u) || {};
    const cap = capturados.get(u) || {};
    const naPagina = perfilAtual() === u;
    const meta = (prop) => document.querySelector(`meta[property="${prop}"]`)?.content || '';
    // As meta tags podem ficar de um perfil anterior após navegar; só valem se citarem este @.
    const titulo = naPagina ? meta('og:title') : '';
    const metaValida = titulo.toLowerCase().includes(`@${u})`);
    const descricao = metaValida ? (meta('og:description') || document.querySelector('meta[name="description"]')?.content || '') : '';
    const nomeMeta = metaValida ? titulo.split(' (@')[0].trim() : '';
    const segMetaTxt = descricao.match(/^([\d.,]+\s*(?:mil|mi|k|m)?)\s*(?:followers|seguidores)/i)?.[1] || '';
    const cab = naPagina ? document.querySelector('header') : null;
    // No cabeçalho, o número abreviado ("60,5 mil") traz o exato no atributo title.
    // Sem login o link de seguidores é href="#"; por isso a busca é pelo texto ao lado.
    const tituloSeg = cab ? [...cab.querySelectorAll('span[title]')]
      .find((s) => /seguidor|follower/i.test(s.closest('a, li')?.textContent || ''))?.title || '' : '';
    // Link da bio na página: o Instagram o embrulha em l.instagram.com/?u=<destino>.
    let siteDom = '', siteDomAprox = false;
    const a = cab?.querySelector('a[href*="l.instagram.com"]');
    if (a) { try { siteDom = new URL(a.href).searchParams.get('u') || ''; } catch (_) { /* ignora */ } }
    // Com mais de um link, o cabeçalho mostra só o texto "dominio.com e mais 1" num botão.
    if (!siteDom && cab) {
      for (const n of cab.querySelectorAll('a, button, span')) {
        const m = n.textContent.trim().match(/^((?:[\w-]+\.)+[a-z]{2,}(?:\/\S*)?)(?:\s+(?:e mais|and) \d+(?: more)?)?$/i);
        if (m && !/instagram\.com/i.test(m[1])) { siteDom = 'https://' + m[1]; siteDomAprox = true; break; }
      }
    }
    // Nº de posts: cabeçalho (logado: "2.003 publicações") ou meta description ("2,003 posts").
    const reqPosts = /([\d.,]+(?:\s*(?:mil|mi|k|m))?)\s*(?:posts?|publica[cç](?:ão|ões|ao|oes))(?![a-z])/i;
    const postsCab = (cab?.innerText || cab?.textContent || '').match(reqPosts)?.[1] || '';
    const postsMeta = descricao.match(reqPosts)?.[1] || '';
    const aprox = (t) => /[a-z]/i.test(t); // "1,2 mil": abreviado, não exato
    // Total exato lido da página passa a valer para numerar posts e saber se a grade está completa.
    if (postsCab && !aprox(postsCab)) totalPagina.set(u, Number(inteiro(postsCab)));
    else if (postsMeta && !aprox(postsMeta)) totalPagina.set(u, Number(inteiro(postsMeta)));

    const escolher = (...pares) => {
      const [v, f] = pares.find(([x]) => x !== '' && x != null) || ['', ''];
      return { v: String(v), f };
    };
    const r = {
      nome_perfil: escolher([api.nome, 'API'], [cap.nome, 'JSON'], [nomeMeta, 'meta']),
      seguidores: escolher([api.seguidores, 'API'], [cap.seguidores, 'JSON'],
        [tituloSeg.replace(/\D/g, ''), 'cabeçalho'], [inteiro(segMetaTxt), aprox(segMetaTxt) ? 'meta ≈' : 'meta']),
      site: escolher([api.site, 'API'], [cap.site, 'JSON'], [siteDom, siteDomAprox ? 'cabeçalho ≈' : 'cabeçalho']),
      posts: escolher([api.n_posts_declarado, 'API'], [totais.get(u), 'JSON'],
        [inteiro(postsCab), aprox(postsCab) ? 'cabeçalho ≈' : 'cabeçalho'], [inteiro(postsMeta), aprox(postsMeta) ? 'meta ≈' : 'meta'], [totalPagina.get(u), 'página (salvo)']),
    };
    r.nome = { v: nomeSemSlogan(r.nome_perfil.v), f: r.nome_perfil.f };
    return r;
  }

  // O nome exibido no perfil costuma vir com slogan: "Café Geek | Cafeteria & Ludoteca",
  // "Chef on Play - Burgers e Games". Fica o trecho antes do primeiro separador
  // (| • · – — ou " - "). Nome sem separador volta inteiro.
  function nomeSemSlogan(nome) {
    const limpo = nome.split(/\s*[|•·–—]\s*|\s+-\s+/)[0].trim();
    return limpo || nome.trim();
  }

  function atualizarCampos(u, ps) {
    const d = dadosPerfil(u);
    const total = totalDe(u);
    const completo = total != null && ps.length >= total;
    const resumo = resumoPeriodo(ps, u);
    // Contagem que alimenta os campos copiáveis, conforme o toggle de compartilhados.
    const per = resumo && (contarCompartilhados ? resumo.comCompartilhados : resumo.proprios);
    const valores = {
      nome: d.nome, url: { v: `https://www.instagram.com/${u}/`, f: '' }, site: d.site,
      seguidores: d.seguidores,
      primeiro: { v: ps.length ? new Date(ps[0].taken_at * 1000).toLocaleDateString('pt-BR') : '', f: '' },
      // Total declarado pelo Instagram no perfil, não o nº de posts carregados.
      total: d.posts,
      n_periodo: { v: per ? String(per.n) : '', f: '' },
      comentarios_periodo: { v: per ? String(per.comentarios) : '', f: '' },
      curtidas_periodo: { v: per ? String(per.curtidas) : '', f: '' },
    };
    for (const k in valores) {
      const { v, f } = valores[k];
      if (el.campos[k].value !== v) el.campos[k].value = v;
      const rotulo = f ? ` · ${f}` : '';
      if (el.fontes[k] && el.fontes[k].textContent !== rotulo) {
        el.fontes[k].textContent = rotulo;
        el.fontes[k].title = FONTES[f] || '';
      }
    }
    el.avisoNome.textContent = d.nome_perfil.v && d.nome_perfil.v !== d.nome.v ? ` (no perfil: "${d.nome_perfil.v}")` : '';
    el.avisoPrimeiro.textContent = !ps.length ? '' : completo ? '' : ` (parcial: ${ps.length}/${total ?? '?'} posts)`;

    atualizarIndicios(u, ps);
    const pr = prontidao(u, ps, d, per);
    el.pronto.className = `pronto ${pr.periodo ? 'ok' : 'pendente'}`;
    el.pronto.textContent = (pr.periodo ? '✅ Pronto para registrar' : `⏳ Pendente: ${pr.pendencias.join('; ')}`) +
      (pr.primeiro ? ' · primeiro post definitivo' : ' · primeiro post ainda parcial (use "Histórico completo")');

    // Campos do período: só aparecem com alguma data no filtro.
    el.blocoPeriodo.style.display = per ? '' : 'none';
    if (!per) return;
    // Se a grade não está toda carregada e o período começa antes do post mais antigo
    // carregado, pode haver posts do período que ainda não vieram.
    const maisAntigo = ps.length ? diaLocal(ps[0].taken_at) : '';
    const podeFaltar = !periodoCoberto(u, ps) && (!dataDe || !maisAntigo || dataDe <= maisAntigo);
    const parcial = podeFaltar ? ' (parcial: carregue mais posts)' : '';
    el.avisoPeriodo.textContent = parcial;
    const dm = (ts) => new Date(ts * 1000).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    const medicao = per.medidoDe ? (dm(per.medidoDe) === dm(per.medidoAte) ? ` · medidos em ${dm(per.medidoDe)}` : ` · medidos entre ${dm(per.medidoDe)} e ${dm(per.medidoAte)}`) : '';
    el.avisoComentarios.textContent = parcial + (per.semContagem ? ` (${per.semContagem} post(s) sem contagem)` : '') + medicao +
      (per.semMedicao ? ` (${per.semMedicao} sem data de medição: coletados antes desta versão)` : '');
    el.avisoCurtidas.textContent = parcial + (per.semCurtidas ? ` (${per.semCurtidas} post(s) com curtidas ocultas)` : '');
    const rotuloPosts = contarCompartilhados ? 'Posts no período (próprios + compartilhados)' : 'Posts próprios no período';
    const rotuloCom = contarCompartilhados ? 'Comentários no período (soma, próprios + compartilhados)' : 'Comentários no período (soma, posts próprios)';
    if (el.rotulos.n_periodo.textContent !== rotuloPosts) el.rotulos.n_periodo.textContent = rotuloPosts;
    if (el.rotulos.comentarios_periodo.textContent !== rotuloCom) el.rotulos.comentarios_periodo.textContent = rotuloCom;
    const rotuloCurt = contarCompartilhados ? 'Curtidas no período (soma, próprios + compartilhados)' : 'Curtidas no período (soma, posts próprios)';
    if (el.rotulos.curtidas_periodo.textContent !== rotuloCurt) el.rotulos.curtidas_periodo.textContent = rotuloCurt;
    const notas = [];
    if (resumo.colabOutroDono) {
      notas.push(contarCompartilhados
        ? `Inclui ${resumo.colabOutroDono} compartilhado(s) cujo dono é outro perfil (também contam para o dono).`
        : `Fora da conta: ${resumo.colabOutroDono} compartilhado(s) cujo dono é outro perfil.`);
    }
    if (resumo.semDono) {
      notas.push(contarCompartilhados
        ? `Inclui ${resumo.semDono} post(s) da grade sem dono identificado na resposta do site.`
        : `Fora da conta: ${resumo.semDono} post(s) sem dono identificado (ative os compartilhados para incluir).`);
    }
    el.foraPeriodo.textContent = notas.join(' ');
  }

  // Posts do período em duas contagens:
  //  - próprios: só aqueles de que o perfil é o dono. Uma colaboração conta uma vez só,
  //    para o dono; assim a soma entre perfis fecha com o total de posts distintos.
  //  - com compartilhados: todos os posts do perfil no período, como aparecem na grade:
  //    próprios + colaborações de outro dono + posts sem dono identificado. A mesma
  //    colaboração entra em mais de um perfil (contagem não exclusiva).
  function resumoPeriodo(ps, u) {
    if (!dataDe && !dataAte) return null;
    const doPeriodo = ps.filter(passaData);
    const conta = (lista) => {
      const medidos = lista.map((p) => p.medido_em).filter(Boolean);
      return {
        n: lista.length,
        comentarios: lista.reduce((s, p) => s + (Number(p.comentarios) || 0), 0),
        semContagem: lista.filter((p) => p.comentarios === '').length,
        curtidas: lista.reduce((s, p) => s + (Number(p.curtidas) || 0), 0),
        semCurtidas: lista.filter((p) => p.curtidas === '').length,
        medidoDe: medidos.length ? Math.min(...medidos) : 0,
        medidoAte: medidos.length ? Math.max(...medidos) : 0,
        semMedicao: lista.filter((p) => p.comentarios !== '' && !p.medido_em).length,
      };
    };
    const colabOutro = doPeriodo.filter((p) => p.perfil && p.perfil !== u);
    return {
      proprios: conta(doPeriodo.filter((p) => p.perfil === u)),
      comCompartilhados: conta(doPeriodo),
      colabOutroDono: colabOutro.length,
      semDono: doPeriodo.filter((p) => !p.perfil).length,
    };
  }

  // Cobertura do período: a grade toda carregada, ou algum post não fixado anterior à
  // data "De" (sinal de que a paginação já passou do início do período).
  function periodoCoberto(u, ps) {
    const total = totalDe(u);
    if (total != null && ps.length >= total) return true;
    return !!dataDe && ps.some((p) => !p.fixado && diaLocal(p.taken_at) < dataDe);
  }

  // Os campos só estão prontos para ir ao Notion quando nenhum é parcial ou aproximado.
  function prontidao(u, ps, d, per) {
    const total = totalDe(u);
    const pendencias = [];
    if (!d.nome.v) pendencias.push('nome não lido');
    if (!d.seguidores.v) pendencias.push('seguidores não lidos');
    else if (d.seguidores.f.includes('≈')) pendencias.push('seguidores aproximados (use "Coletar período")');
    if (!d.posts.v) pendencias.push('total de posts não lido');
    else if (d.posts.f.includes('≈')) pendencias.push('total de posts aproximado');
    if (!per) pendencias.push('sem período definido');
    else {
      if (!periodoCoberto(u, ps)) pendencias.push('período não coberto (carregue mais posts)');
      if (per.semContagem) pendencias.push(`${per.semContagem} post(s) sem contagem de comentários`);
    }
    return { periodo: !pendencias.length, pendencias, primeiro: total != null && ps.length >= total };
  }

  // ---------- indícios de aluguel, venda e cobrança ----------

  // Termos procurados na bio e nas legendas (sem acento, minúsculas). Indício não é
  // prova: a lista mostra o trecho e o link para conferir.
  const INDICIOS = {
    aluguel: /\balug(a|am|amos|ar|ue|uel|ueis)\b|\blocacao de jogos|\bleve (o |seu )?jogo|\bjogos? (para|pra) levar/,
    venda: /\bvend(a|as|emos|endo|e|e-se)\b|\ba venda\b|\bloja (virtual|online|fisica)\b|\bnossa loja\b|\bpre-?venda|\bencomend|\bdisponive(l|is) (na|em) (nossa )?loja/,
    precificacao: /\btaxa (de )?(mesa|ludica|de jogos?|de entrada|de acesso|de uso|do acervo)\b|\bcouvert\b|\bpor pessoa\b|\bconsumacao minima|\bpor hora\b|\bpasse livre\b|\bentrada (gratuita|franca|livre)\b|\bjogue a vontade\b|\bvalor (por|da|de) (pessoa|mesa|hora|entrada)\b|\bsem taxa\b/,
  };

  let cacheIndicios = { chave: '', valor: null };

  function indicios(u, ps) {
    const api = perfis.get(u) || {};
    const bio = api.bio || capturados.get(u)?.bio || '';
    const chave = `${u}|${ps.length}|${bio.length}`;
    if (cacheIndicios.chave === chave) return cacheIndicios.valor;
    const textos = [
      ...(bio ? [{ origem: 'bio', data: '', url: `https://www.instagram.com/${u}/`, texto: bio }] : []),
      ...ps.filter((p) => p.legenda).map((p) => ({ origem: 'post', data: dataCurta(p.taken_at), url: p.url, texto: p.legenda })),
    ].reverse(); // mais recentes primeiro; a bio vai para o fim e volta ao topo abaixo
    const r = {};
    for (const [cat, re] of Object.entries(INDICIOS)) {
      r[cat] = [];
      for (const t of textos) {
        const plano = semAcento(t.texto);
        const m = plano.match(re);
        if (!m) continue;
        // Trecho em volta do termo. As posições do match valem para o texto em NFD sem
        // acentos (o semAcento só remove as marcas e põe em minúsculas).
        const norm = t.texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const ini = Math.max(0, m.index - 50);
        const trecho = norm.slice(ini, m.index + m[0].length + 60).replace(/\s+/g, ' ').trim();
        const precos = cat === 'precificacao' ? (trecho.match(/r\$\s?\d+(?:[.,]\d{2})?/gi) || []).map((x) => x.replace(/\s/g, '')) : [];
        r[cat].push({ ...t, termo: m[0], trecho, precos });
      }
      r[cat].sort((a, b) => (a.origem === 'bio' ? -1 : b.origem === 'bio' ? 1 : 0));
    }
    cacheIndicios = { chave, valor: r };
    return r;
  }

  const ROTULOS_INDICIOS = { aluguel: 'Aluguel de jogos', venda: 'Venda de jogos', precificacao: 'Precificação / couvert' };
  let chaveIndiciosPainel = '';

  function atualizarIndicios(u, ps) {
    const ind = indicios(u, ps);
    const chave = `${u}|${ps.length}|${Object.values(ind).map((x) => x.length).join(',')}`;
    if (chave === chaveIndiciosPainel) return;
    chaveIndiciosPainel = chave;
    el.indiciosTitulo.textContent = `Indícios na bio e legendas (${Object.keys(ind).map((k) => `${ROTULOS_INDICIOS[k].split(' ')[0].toLowerCase()} ${ind[k].length}`).join(' · ')})`;
    el.indicios.replaceChildren(...Object.keys(ind).flatMap((k) => {
      const lista = ind[k];
      const precos = [...new Set(lista.flatMap((x) => x.precos))];
      const cab = criar('p', { className: 'subtitulo', textContent: `${ROTULOS_INDICIOS[k]}: ${lista.length ? `há indício (${lista.length})` : 'sem indício nos textos carregados'}${precos.length ? ` · valores citados: ${precos.join(', ')}` : ''}` });
      const itens = lista.slice(0, 15).map((x) => criar('div', { className: 'item' }, [
        criar('a', { href: x.url, target: '_blank', title: x.texto }, [
          criar('b', { textContent: x.origem === 'bio' ? 'bio' : x.data }),
          criar('span', { textContent: `…${x.trecho}…` }),
        ]),
      ]));
      return [cab, criar('div', { className: 'lista' }, itens)];
    }));
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
    const chave = `${u}|${busca}|${soEventos}|${dataDe}|${dataAte}|${lista.length}|${ps.length}|${versaoValidacao}`;
    if (chave === chaveLista) return;
    chaveLista = chave;
    const periodo = dataDe || dataAte ? ' no período' : '';
    el.listaTitulo.textContent = busca
      ? `Posts com "${el.busca.value.trim()}"${periodo} (${lista.length})`
      : `Possíveis eventos${periodo} (${lista.length} de ${ps.length} posts)`;
    el.lista.replaceChildren(...lista.map((p) => {
      const trecho = p.legenda.replace(/\s+/g, ' ').slice(0, 110);
      const val = validacao.get(p.shortcode);
      const bVal = (valor, texto, dica) => criar('button', {
        textContent: texto, title: dica, className: val === valor ? `ativo-${valor === 'sim' ? 'sim' : 'nao'}` : '',
        onclick: () => marcarValidacao(p.shortcode, valor),
      });
      return criar('div', { className: 'item' }, [
        criar('a', { href: p.url, target: '_blank', title: p.legenda }, [
          criar('b', { textContent: `${dataCurta(p.taken_at)}${p.categorias_evento ? ' · ' + p.categorias_evento : ''}${p.evento === 'possível' ? ' (?)' : ''}` }),
          criar('span', { textContent: trecho + (p.legenda.length > 110 ? '…' : '') }),
        ]),
        criar('div', { className: 'val' }, [bVal('sim', '✓', 'É evento'), bVal('não', '✗', 'Não é evento')]),
      ]);
    }));
  }

  // ---------- validação manual do classificador de eventos ----------

  // Clicar de novo na mesma marca desfaz.
  function marcarValidacao(shortcode, valor) {
    if (validacao.get(shortcode) === valor) validacao.delete(shortcode);
    else validacao.set(shortcode, valor);
    versaoValidacao++;
    agendarSelos();
    atualizarResumo();
  }

  let chaveValidacao = '';

  // Precisão do classificador sobre os posts marcados à mão, de todos os perfis:
  // dos que ele aponta como evento, quantos são; dos que ele não aponta, quantos eram.
  function atualizarValidacao() {
    const chave = `${versaoValidacao}|${posts.size}`;
    if (chave === chaveValidacao) return;
    chaveValidacao = chave;
    const grupos = { 'provável': [0, 0], 'possível': [0, 0], 'não': [0, 0] };
    for (const [s, v] of validacao) {
      const g = grupos[posts.get(s)?.evento];
      if (!g) continue;
      g[0]++;
      if (v === 'sim') g[1]++;
    }
    const pct = ([n, sim]) => (n ? `${sim}/${n} (${Math.round((100 * sim) / n)}%)` : '—');
    const total = grupos['provável'][0] + grupos['possível'][0] + grupos['não'][0];
    const apontados = [grupos['provável'][0] + grupos['possível'][0], grupos['provável'][1] + grupos['possível'][1]];
    el.validacao.textContent = total
      ? `Validação (${total} posts marcados, todos os perfis) · são evento: provável ${pct(grupos['provável'])} · possível ${pct(grupos['possível'])} · ` +
        `precisão geral ${pct(apontados)} · não apontados que eram evento ${pct(grupos['não'])}`
      : 'Validação: marque ✓/✗ nos posts da lista para medir a precisão do classificador.';
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
    summary.subtitulo{cursor:pointer;margin:10px 0 6px}
    .pronto{padding:5px 8px;border-radius:6px;font-size:12px;font-weight:600}
    .pronto.ok{background:#2e7d3222;color:inherit;border:1px solid #2e7d32}
    .pronto.pendente{background:#ef6c0022;color:inherit;border:1px solid #ef6c00}
    select{width:100%;box-sizing:border-box;margin:6px 0;padding:4px 6px;font:inherit;
      background:transparent;color:inherit;border:1px solid #888;border-radius:6px}
    select option{color:#111}
    .lista{max-height:260px;overflow:auto;border-top:1px solid #8885}
    .lista .item{display:flex;gap:4px;align-items:center;border-bottom:1px solid #8885}
    .lista a{flex:1 1 auto;min-width:0;display:block;padding:5px 2px;color:inherit;text-decoration:none;font-size:12px}
    .lista a:hover{background:#8882}
    .val{display:flex;flex-direction:column;gap:2px}
    .val button{flex:0 0 auto;width:26px;padding:1px 0;font-size:12px}
    .val .ativo-sim{background:#2e7d32;color:#fff;border-color:#2e7d32}
    .val .ativo-nao{background:#c62828;color:#fff;border-color:#c62828}
    .fonte{opacity:.8;font-style:italic;cursor:help}
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
  const PREF_COMPART = 'igc-contar-compartilhados';
  let contarCompartilhados = lerPref(PREF_COMPART, true);
  // Número do post (#N) nos selos: oculto por padrão, para o selo caber numa linha.
  const PREF_NUMERO = 'igc-numero-nos-selos';
  let mostrarNumero = lerPref(PREF_NUMERO, false);
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
    const bApi = botao('Coletar período (API)', () => {
      const u = perfilAtual();
      if (u) executar(() => coletarPerfil(u, 'periodo'));
    });
    bApi.title = 'Poucos pedidos: dados do perfil e posts até a data "De". Não chega ao primeiro post.';
    const bHistorico = botao('Histórico completo (API)', () => {
      const u = perfilAtual();
      if (u) executar(() => coletarPerfil(u, 'completo').then(() => status(`@${u} completo.`)));
    });
    bHistorico.title = 'Vai até o primeiro post (data do primeiro post). Muitos pedidos; continua de onde parou.';
    const bCsv = botao('Exportar CSV', () => { const u = perfilAtual(); if (u) exportar([u], u); });
    const bJson = botao('JSON', () => {
      const u = perfilAtual();
      if (u) baixar(`instagram_${u}.json`, JSON.stringify({ perfil: linhaPerfil(u), posts: postsDe(u).map((p) => ({ ...p, evento_validado: validacao.get(p.shortcode) || '' })) }, null, 2), 'application/json');
    });
    const bFila = botao('Coletar fila', () => {
      const us = [...new Set(el.fila.value.split(/\s+/)
        .map((s) => s.replace(/^.*instagram\.com\//, '').replace(/^@/, '').split(/[/?]/)[0].toLowerCase())
        .filter(Boolean))];
      if (us.length) executar(() => coletarFila(us, el.modoFila.value));
    });
    el.modoFila = criar('select', {}, [
      criar('option', { value: 'periodo', textContent: 'Fila: só o período (rápido)' }),
      criar('option', { value: 'completo', textContent: 'Fila: histórico completo (primeiro post)' }),
    ]);
    el.parar = botao('Parar', () => { parar = true; status('Parando…'); });
    el.acoes = [bRolar, bApi, bHistorico, bCsv, bJson, bFila];

    const chk = criar('input', { type: 'checkbox', checked: true, onchange: (e) => { mostrarSelos = e.target.checked; aplicarSelos(); } });
    const chkNumero = criar('input', { type: 'checkbox', checked: mostrarNumero, onchange: (e) => { mostrarNumero = e.target.checked; gravarPref(PREF_NUMERO, mostrarNumero); aplicarSelos(); } });
    const chkAuto = criar('input', { type: 'checkbox', checked: rolarAoAbrir, onchange: (e) => { rolarAoAbrir = e.target.checked; gravarPref(PREF_ROLAR, rolarAoAbrir); } });
    const chkEventos = criar('input', { type: 'checkbox', onchange: (e) => { soEventos = e.target.checked; aplicarSelos(); atualizarResumo(); } });
    el.busca = criar('input', {
      type: 'search',
      placeholder: 'Buscar na legenda (ex.: torneio, quiz)',
      oninput: (e) => { busca = semAcento(e.target.value.trim()); aplicarSelos(); atualizarResumo(); },
    });
    // Campos copiáveis do perfil aberto.
    el.campos = {};
    el.fontes = {};
    el.rotulos = {};
    const campo = (chave, rotulo, extra) => {
      const entrada = criar('input', { type: 'text', readOnly: true });
      el.campos[chave] = entrada;
      el.fontes[chave] = criar('span', { className: 'fonte' });
      el.rotulos[chave] = document.createTextNode(rotulo);
      const bCopiar = criar('button', { textContent: '⧉', title: 'Copiar', onclick: () => copiar(entrada.value, bCopiar) });
      return criar('div', { className: 'campo' }, [
        criar('span', {}, [el.rotulos[chave], el.fontes[chave], ...(extra ? [extra] : [])]),
        criar('div', {}, [entrada, bCopiar]),
      ]);
    };
    el.avisoPrimeiro = criar('span');
    el.avisoNome = criar('span');
    el.pronto = criar('p', { className: 'pronto' });
    const blocoCampos = criar('div', {}, [
      criar('p', { className: 'subtitulo', textContent: 'Dados do perfil' }),
      el.pronto,
      campo('primeiro', 'Data do primeiro post', el.avisoPrimeiro),
      campo('seguidores', 'Seguidores'),
      campo('total', 'Total de posts (declarado no perfil)'),
      campo('site', 'Site / Linktree'),
      campo('url', 'URL do Instagram'),
      campo('nome', 'Nome do estabelecimento', el.avisoNome),
    ]);
    el.avisoPeriodo = criar('span');
    el.avisoComentarios = criar('span');
    el.avisoCurtidas = criar('span');
    el.foraPeriodo = criar('p', { className: 'status' });
    const chkCompart = criar('input', { type: 'checkbox', checked: contarCompartilhados,
      onchange: (e) => { contarCompartilhados = e.target.checked; gravarPref(PREF_COMPART, contarCompartilhados); atualizarResumo(); } });
    el.blocoPeriodo = criar('div', { style: 'display:none' }, [
      criar('label', {}, [chkCompart, document.createTextNode(' Contar posts compartilhados (colaborações de outro dono)')]),
      campo('n_periodo', '', el.avisoPeriodo),
      campo('comentarios_periodo', '', el.avisoComentarios),
      campo('curtidas_periodo', '', el.avisoCurtidas),
      el.foraPeriodo,
    ]);

    // Filtro de data (inclusivo nas duas pontas); começa no período padrão.
    const aoMudarData = () => { dataDe = el.de.value; dataAte = el.ate.value; aplicarSelos(); atualizarResumo(); };
    el.de = criar('input', { type: 'date', value: dataDe, title: 'De (inclusivo)', onchange: aoMudarData });
    el.ate = criar('input', { type: 'date', value: dataAte, title: 'Até (inclusivo)', onchange: aoMudarData });
    const bLimparDatas = criar('button', { textContent: '✕', title: 'Limpar datas', onclick: () => { el.de.value = ''; el.ate.value = ''; aoMudarData(); } });
    const bPadrao = criar('button', { textContent: '↺', title: `Voltar ao período padrão (${PERIODO_PADRAO.map((d) => d.split('-').reverse().join('/')).join(' a ')})`,
      onclick: () => { [el.de.value, el.ate.value] = PERIODO_PADRAO; aoMudarData(); } });
    el.validacao = criar('p', { className: 'status' });
    const bApagar = botao('Apagar dados salvos', apagarSalvos);
    const blocoDatas = criar('div', { className: 'datas' }, [
      document.createTextNode('De'), el.de, document.createTextNode('até'), el.ate, bPadrao, bLimparDatas,
    ]);

    el.listaTitulo = criar('span');
    el.lista = criar('div', { className: 'lista' });
    // Lista de eventos/busca recolhível; começa fechada.
    const blocoLista = criar('details', {}, [criar('summary', { className: 'subtitulo' }, [el.listaTitulo]), el.lista, el.validacao]);
    el.indiciosTitulo = criar('span');
    el.indicios = criar('div');
    const blocoIndicios = criar('details', {}, [criar('summary', { className: 'subtitulo' }, [el.indiciosTitulo]), el.indicios]);
    const minimizar = criar('span', { textContent: '–' });
    const cabecalho = criar('header', {}, [el.titulo, minimizar]);
    const painel = criar('div', { id: 'igc-painel' }, [
      cabecalho,
      el.resumo,
      el.contagens,
      criar('div', { className: 'linha' }, [bRolar, bTopo]),
      criar('div', { className: 'linha' }, [bApi, bHistorico]),
      criar('div', { className: 'linha' }, [bCsv, bJson, el.parar]),
      blocoCampos,
      criar('label', {}, [chkAuto, document.createTextNode(' Rolar até o fim ao abrir um perfil')]),
      criar('label', {}, [chk, document.createTextNode(' Selos na grade')]),
      criar('label', {}, [chkNumero, document.createTextNode(' Número do post nos selos')]),
      criar('p', { className: 'subtitulo', textContent: 'Esmaecer na grade' }),
      blocoDatas,
      el.blocoPeriodo,
      criar('label', {}, [chkEventos, document.createTextNode(' Posts que não são possíveis eventos')]),
      el.busca,
      blocoLista,
      blocoIndicios,
      el.fila,
      el.modoFila,
      criar('div', { className: 'linha' }, [bFila, bApagar]),
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
    carregarSalvos();
    setInterval(salvar, 3000);
    addEventListener('pagehide', salvar);
    // Fila interrompida numa sessão anterior: repõe a lista para continuar.
    const fila = lerFila();
    if (fila && fila.feitos.length < fila.todos.length) {
      el.fila.value = fila.todos.join('\n');
      el.modoFila.value = fila.modo || 'completo';
      status(`Fila interrompida: ${fila.feitos.length}/${fila.todos.length} perfis coletados. "Coletar fila" continua dos que faltam.`);
    }
    new MutationObserver(agendarSelos).observe(document.documentElement, { childList: true, subtree: true });
    agendarSelos();
  }

  console.info('[Coletor IG] carregado');
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
  else iniciar();
})();
