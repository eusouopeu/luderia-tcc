// ==UserScript==
// @name         Coletor de perfis do Instagram (TCC Luderia)
// @namespace    tcc-luderia
// @version      2026.11.13-1
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
 *    Se a API antiga falhar como endpoint desativado (404, HTML no lugar de JSON; visto
 *    em 12/11/2026), a coleta passa sozinha a rolar a grade do perfil aberto e ler as
 *    respostas GraphQL do próprio site; a fila abre cada perfil e continua ao carregar.
 *  - Bio do perfil: campo "Bio" no painel e colunas bio/fonte_bio no CSV de perfis, da API,
 *    das respostas do site (biography) ou da meta description da página, nessa ordem.
 *  - Período: ao abrir, vale o da última coleta feita (o padrão do B1 só sem coleta ou no ↻).
 *  - Raio no cabeçalho, ao lado do download automático: desligado, abrir um perfil pelo menu
 *    ou "Próximo" não coleta nem rola sozinho (a fila continua, porque é pedida à mão).
 *  - Menu dos perfis (mesmo padrão do coletor de preços): o seletor do topo traz os 60
 *    perfis das casas do B1 por capital, com ✓ coletado pela API, ◐ só dados do perfil e
 *    ○ falta. Escolher um abre o perfil e coleta sozinho (no modo do seletor da fila: só o
 *    período ou o histórico); "Próximo" faz o mesmo com o próximo que falta (primeiro na
 *    mesma capital); "Coletado"/"Desfazer" marca à mão; "Só os que faltam" esconde os prontos.
 *  - "Fila": coleta vários perfis em sequência, com pausa maior entre perfis,
 *    e baixa dois CSV no fim (posts e perfis).
 *  - Snowball (lista "seguindo"): saiu deste script em 15/10/2026 e virou o
 *    "Snowball do Instagram" (instagram_snowball.user.js), que roda junto, com
 *    painel próprio.
 *
 *  - Posts, dados de perfil e marcações ficam salvos no navegador (IndexedDB do
 *    instagram.com); recarregar não perde a coleta. "Apagar dados salvos" zera tudo.
 *  - Campos do período contam só posts de que o perfil é dono: colaboração conta uma
 *    vez, para o dono. Cada dado do perfil traz a fonte (API, JSON, cabeçalho, meta).
 *  - ✓/✗ na lista marcam à mão se o post é evento; o painel mostra a precisão do
 *    classificador e o CSV de posts traz a coluna evento_validado.
 *  - Conferência (fidelidade): cole os shortcodes (ou links) sorteados. O script
 *    guarda o que foi coletado de cada post no momento em que a conferência começa,
 *    contorna os posts na grade, abre um por um e mostra o coletado para comparar
 *    com a página. Marque ✓ ou ✗ e exporte o CSV da conferência.
 *  - Botões "Som ao concluir" (dois bipes ao fim de uma coleta, rolagem ou fila;
 *    bipes graves se parou com erro) e "Download automático" (CSV de posts e de
 *    perfis ao fim da coleta por API e da fila). O navegador só libera o som
 *    depois de um clique na página.
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
  // Painel pelo kit comum (_src/webScripts/_kit_painel/); sem @grant, guarda no localStorage.
  const kit = kitPainel({ id: 'igc', abertos: ['perfil'] });

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
      // Só o estado do coletor: a chave 'seguindo' antiga fica para o snowball ler.
      tx.objectStore('kv').delete('estado');
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
      // O campo do fixado muda conforme a resposta (API antiga, GraphQL, aba de reels).
      fixado: o.timeline_pinned_user_ids?.length || o.clips_tab_pinned_user_ids?.length || o.pinned_for_users?.length || o.is_pinned === true ? 'sim' : '',
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
      // Ordem de chegada (a primeira vez que o post apareceu): separa a primeira página da
      // grade, onde ficam os fixados, das seguintes. Ver periodoCoberto().
      novo.chegada = velho?.chegada ?? marcaChegada();
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
      seguindo: u.edge_follow?.count ?? u.following_count ?? '',
      categoria: u.category_name || u.business_category_name || u.category || '',
      privado: typeof u.is_private === 'boolean' ? (u.is_private ? 'sim' : 'não') : '',
    };
    // Só registra quando veio algo além do nome (dono de post traz só username e nome).
    if (novo.seguidores !== '' || novo.site) novo.coletado_em = dataHora(Date.now() / 1000);
    const chave = u.username.toLowerCase();
    capturados.set(chave, mesclar(capturados.get(chave) || {}, novo));
  }

  let contadorChegada = 0;
  const marcaChegada = () => Date.now() * 1000 + (contadorChegada++ % 1000);

  function mesclar(a, b) {
    const r = { ...a };
    for (const k in b) if (b[k] !== '' && b[k] != null && !(k === 'pagina_coleta' && a[k])) r[k] = b[k];
    return r;
  }

  function ingerirTexto(t) {
    // Posts têm `taken_at`; os dados do perfil (seguidores, links da bio) vêm em
    // blocos à parte, sem posts, e também precisam passar.
    if (!t || !/taken_at|bio_links|biography|follower_count|media_count|external_url/.test(t)) return;
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

  // Fila do "Snowball do Instagram" (outro script) em curso: ela abre perfis um
  // atrás do outro, e a rolagem automática daqui só atrasaria.
  function filaSnowballAtiva() {
    try { return JSON.parse(localStorage.getItem('igs-fila-seguindo') || 'null')?.ativa === true; } catch (_) { return false; }
  }

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
    // Endpoint desativado costuma responder com a página HTML de "não encontrada".
    const j = await r.json().catch(() => { throw Object.assign(new Error(`resposta não é JSON em ${caminho.split('?')[0]}`), { naoJson: true }); });
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
  const COLS_PERFIS = ['perfil', 'situacao', 'nome', 'nome_perfil', 'fonte_nome', 'categoria', 'privado', 'seguidores', 'fonte_seguidores', 'seguindo',
    'n_posts_declarado', 'fonte_n_posts', 'n_posts_coletados', 'n_posts_proprios', 'grade_completa', 'n_posts_evento',
    'primeiro_post', 'ultimo_post', 'site', 'fonte_site',
    'periodo_de', 'periodo_ate', 'n_posts_periodo', 'comentarios_periodo', 'n_posts_periodo_sem_contagem',
    'n_posts_periodo_com_compart', 'comentarios_periodo_com_compart', 'n_posts_periodo_com_compart_sem_contagem',
    'n_colab_outro_dono_periodo', 'n_sem_dono_periodo',
    'curtidas_periodo', 'n_posts_periodo_sem_curtidas', 'curtidas_periodo_com_compart', 'n_posts_periodo_com_compart_sem_curtidas',
    'comentarios_medidos_de', 'comentarios_medidos_ate', 'periodo_pronto', 'pendencias_periodo', 'primeiro_post_definitivo',
    'indicios_aluguel', 'indicios_venda', 'indicios_precificacao', 'precos_citados_precificacao', 'bio', 'fonte_bio', 'coletado_em'];
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
      bio: d.bio.v, fonte_bio: d.bio.f,
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
      situacao: lerLs(CHAVE_FEITOS, {})[user]?.situacao || 'coletar',
      coletado_em: p.coletado_em || capturados.get(user)?.coletado_em || dataHora(Date.now() / 1000),
    };
  }

  function exportar(usuarios, sufixo, { soPerfis = false } = {}) {
    const carimbo = new Date().toISOString().slice(0, 10);
    baixar(`instagram_perfis_${sufixo}_${carimbo}.csv`, csv(usuarios.map(linhaPerfil), COLS_PERFIS), 'text/csv;charset=utf-8');
    if (soPerfis) return;
    const linhas = usuarios.flatMap((u) => {
      const nums = numeros(u);
      return postsDe(u).map((p) => ({ ...p, vinculo: vinculo(p, u), numero_post: nums.get(p.shortcode) ?? '', data_hora: dataHora(p.taken_at), evento_validado: validacao.get(p.shortcode) || '' }));
    });
    baixar(`instagram_posts_${sufixo}_${carimbo}.csv`, csv(linhas, COLS_POSTS), 'text/csv;charset=utf-8');
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
  // A API antiga (/api/v1/users/web_profile_info/ e /api/v1/feed/user/) responde 404 desde
  // nov/2026, ao menos sem login: o site passou a pedir tudo por /api/graphql. Falha desse
  // tipo marca a API como fora por 6 h e a coleta segue pela própria página (rolagem da
  // grade, com as respostas GraphQL que o interceptador já lê).
  const CHAVE_API_FORA = 'igc-api-fora';
  const HORAS_API_FORA = 6;
  const apiSumiu = (e) => !!e && (e.naoJson || [400, 401, 403, 404, 410].includes(e.http));
  const apiFora = () => Date.now() - (lerLs(CHAVE_API_FORA, 0) || 0) < HORAS_API_FORA * 3600e3;

  async function coletarPerfil(user, modo = 'completo') {
    // O período desta coleta vira o padrão ao abrir a página da próxima vez.
    gravarLs(CHAVE_PERIODO, [dataDe, dataAte]);
    if (!apiFora()) {
      try { return await coletarPelaApi(user, modo); } catch (e) {
        if (!apiSumiu(e)) throw e;
        gravarLs(CHAVE_API_FORA, Date.now());
        status(`API do Instagram fora (${e.message}); coletando pela página.`, 'alerta');
      }
    }
    return coletarPelaPagina(user, modo);
  }

  // Coleta pela página aberta: rola a grade até cobrir o período (modo 'periodo') ou chegar
  // ao primeiro post (modo 'completo'). Os dados do perfil vêm das respostas do site e do
  // cabeçalho (dadosPerfil); exige o perfil aberto.
  async function coletarPelaPagina(user, modo) {
    const periodo = modo === 'periodo';
    if (periodo && !dataDe) throw new Error('defina a data "De" do período antes de coletar só o período');
    if (perfilAtual() !== user) throw new Error(`abra o perfil @${user} para coletar pela página`);
    lerDadosEmbutidos();
    const privado = /esta conta é privada|this account is private/i.test(document.querySelector('main')?.textContent || '');
    let altura = 0, semMudanca = 0;
    rolando = true;
    try {
      while (perfilAtual() === user) {
        if (parar) throw new Error('interrompido');
        const ps = postsDe(user);
        const total = totalDe(user);
        const inicio = periodo && Date.parse(`${dataDe}T00:00:00`) / 1000;
        const frac = periodo ? (ps[0] ? (Date.now() / 1000 - ps[0].taken_at) / (Date.now() / 1000 - inicio) : 0) : total ? ps.length / total : true;
        kit.progresso('coleta', frac === true ? true : Math.min(0.99, frac), `@${user}: ${ps.length}${total ? ` de ${total}` : ''} posts (página)`);
        status(`@${user} pela página: ${ps.length}/${total ?? '?'} posts · mais antigo ${ps[0] ? dataCurta(ps[0].taken_at) : '-'}`);
        if (privado || periodoCoberto(user, ps) && (periodo || (total != null && ps.length >= total))) break;
        if (semMudanca >= 8) break;
        window.scrollTo(0, document.documentElement.scrollHeight);
        await esperar(sortear([1200, 2000]));
        const h = document.documentElement.scrollHeight;
        semMudanca = h === altura ? semMudanca + 1 : 0;
        altura = h;
      }
    } finally { rolando = false; }
    if (perfilAtual() !== user) throw new Error('saiu do perfil durante a coleta');
    const cap = capturados.get(user) || {};
    perfis.set(user, {
      perfil: user, categoria: cap.categoria || '', privado: privado || cap.privado === 'sim' ? 'sim' : 'não',
      seguindo: cap.seguindo ?? '', fonte_coleta: 'página',
      coletado_em: dataHora(Date.now() / 1000),
    });
    if (privado) status(`@${user} é privado; só dados do perfil.`);
  }

  async function coletarPelaApi(user, modo) {
    const info =(await apiPaciente(`/api/v1/users/web_profile_info/?username=${encodeURIComponent(user)}`)).data.user;
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
      const total = info.edge_owner_to_timeline_media?.count;
      status(`@${user}: ${ps.length}/${total ?? '?'} posts · mais antigo ${ps[0] ? dataCurta(ps[0].taken_at) : '-'}`);
      // Período: quanto do intervalo entre hoje e a data "De" já foi coberto; histórico: posts ÷ total.
      const inicio = periodo && Date.parse(`${dataDe}T00:00:00`) / 1000;
      const frac = periodo ? (ps[0] ? (Date.now() / 1000 - ps[0].taken_at) / (Date.now() / 1000 - inicio) : 0) : total ? ps.length / total : true;
      kit.progresso('coleta', frac === true ? true : Math.min(0.99, frac), `@${user}: ${ps.length}${total ? ` de ${total}` : ''} posts`);
      const passouDoInicio = periodo && periodoCoberto(user, postsDe(user));
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
    let ok = true;
    try { await tarefa(); } catch (e) { ok = false; status(`Parou: ${e.message}. O que já veio continua para exportar.`, parar ? 'alerta' : 'erro'); }
    ocupado = false; atualizarBotoes(); atualizarResumo();
    kit.progresso('coleta', null);
    kit.estado(ok && !parar ? 'ok' : parar ? 'alerta' : 'erro');
    kit.tocar(ok && !parar);
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
        kit.progresso('fila', feitos.length / usuarios.length, `Fila: @${u} (${feitos.length + 1} de ${usuarios.length})`);
        // Sem a API, a coleta é pela página: abre o perfil e a fila continua ao carregar.
        if (apiFora() && perfilAtual() !== u) {
          gravarLs(CHAVE_ABRIR, { u, em: Date.now(), fila: true });
          status(`Abrindo @${u}…`);
          location.href = `https://www.instagram.com/${u}/`;
          await new Promise(() => {}); // a página vai recarregar
        }
        try { await coletarPerfil(u, modo); } catch (e) { registrarColeta(u, modo, `refazer: ${e.message}`); throw e; }
        registrarColeta(u, modo);
        feitos.push(u);
        gravarFila({ todos: usuarios, feitos, modo });
        if (i < pendentes.length - 1) {
          const pausa = sortear(PAUSA_PERFIL);
          await esperarContando(pausa, `@${u} pronto. Próximo perfil em`);
        }
      }
      status(`Fila concluída: ${feitos.length} perfis.`, 'ok');
      gravarFila(null);
    } finally {
      kit.progresso('fila', null);
      // Baixa o parcial mesmo se a fila parar no meio. O CSV de perfis (com a situação de
      // cada um) sai sempre: é o marcador da coleta; o de posts, com o download automático.
      const comDados = usuarios.filter((u) => perfis.has(u));
      if (comDados.length) exportar(comDados, `fila${comDados.length}`, { soPerfis: !kit.autobaixar });
    }
  }

  // ---------- menu dos perfis do B1 ----------
  // Mesmo padrão do coletor de preços (B5): seletor com os perfis por capital, marcados como
  // coletados; escolher um abre o perfil e coleta sozinho (no modo do seletor da fila);
  // "Próximo" abre o próximo que falta. População: as 61 casas do B1 com perfil próprio
  // (dados/B1_estabelecimentos/_dados-agregados/3_triagem/B1_instagram_aprovadas.csv e dados/B1_redes_sociais/_dados-agregados/B1_instagram_resumo_notion.csv);
  // das 63, Reduto não tem Instagram e Covil Game Bar SBC usa o @covilgb, da unidade de
  // Guarulhos. [perfil, nome, capital]
  const POP_IG = [
    ["bardo.mago", "Bardo Mago", "Belo Horizonte"],
    ["comdadobar", "Comdado Bar e Jogos", "Belo Horizonte"],
    ["garagemdonerd", "Garagem do Nerd", "Belo Horizonte"],
    ["latabuleria", "La Tabuleria", "Belo Horizonte"],
    ["ludocafebh", "LudoCafé", "Belo Horizonte"],
    ["shelfbar", "Shelf Bar e Jogos", "Belo Horizonte"],
    ["ludotecasidequest", "Ludoteca Sidequest", "Belém"],
    ["fortaludica", "FORTALÚDICA - BURGERS & JOGOS", "Brasília"],
    ["grutabsb", "Gruta BSB", "Brasília"],
    ["insidegamestore", "Inside Games", "Brasília"],
    ["asgardbrasilia", "Loja de Jogos - Asgard", "Brasília"],
    ["ludotecabgc", "Ludoteca BGC", "Brasília"],
    ["utopiagamesbr", "Utopia Games & Food", "Brasília"],
    ["metropolybar", "Metropoly Bar", "Campinas"],
    ["muito_colecionaveis", "Muito Geek | TCG • Board Games • Fliperama", "Campinas"],
    ["nergeek", "Nergeek", "Campinas"],
    ["alcapaojogos", "Alçapão Jogos", "Curitiba"],
    ["boardzgamepub", "BoardZ Game Pub", "Curitiba"],
    ["joyjoycafe", "Joyjoy Café", "Curitiba"],
    ["paladinohobbies", "Paladino Hobbies", "Curitiba"],
    ["tavernagamehouse", "Taverna Game House", "Curitiba"],
    ["vilacelta", "Vila Celta Hobby Store - Jogos e Café", "Curitiba"],
    ["ccg_floripa", "CCG Floripa", "Florianópolis"],
    ["chefonplay", "Chef on Play", "Florianópolis"],
    ["cineplay_sc", "Cineplay- Restaurante e Jogos", "Florianópolis"],
    ["balboashobbygames", "Balboa's Hobby Games", "Fortaleza"],
    ["dominariacg", "Dominaria Cards & Games", "Fortaleza"],
    ["paladinsgames", "Paladins Game Store", "Goiânia"],
    ["arcadeapub", "Arcadea Gaming Pub", "Porto Alegre"],
    ["tocadorato_oficial", "Toca do Rato - Pizzaria e Jogos de Tabuleiro", "Porto Alegre"],
    ["nalaland.jogos", "Nala Land - Bar de Jogos de Tabuleiro em Recife", "Recife"],
    ["gob.ludobar", "Game Of Boards", "Rio de Janeiro"],
    ["cheiodefomeoficial", "Cheio de Fome - Vila da Penha", "Rio de Janeiro"],
    ["luderiacariocajogos", "Luderia Carioca", "Rio de Janeiro"],
    ["magicstorebrasil", "Magic Store Brazil", "Rio de Janeiro"],
    ["lojaredjogos", "RED jogos", "Rio de Janeiro"],
    ["tabuclubnit", "TabuClub", "Rio de Janeiro"],
    ["saojogue", "São Jogue - Bela Vista", "Salvador"],
    ["sessenta.minutos", "60 Minutos Escape, Hamburgueria e Boardgames", "São Paulo"],
    ["aarenabg", "Arena BG | Jogos de Tabuleiro | Hamburgueria", "São Paulo"],
    ["bodogami", "Bodogami Restaurante e Cafeteria", "São Paulo"],
    ["bravojogos", "Bravo Jogos", "São Paulo"],
    ["chqjogos.sa", "CHQ Jogos", "São Paulo"],
    ["cartolaluderia", "Cartola Luderia Bar", "São Paulo"],
    ["castelosbareboardgames", "Castelos Bar & Boardgames", "São Paulo"],
    ["coletivogeekbr", "Coletivo Geek", "São Paulo"],
    ["covilgb", "Covil Game Bar", "São Paulo"],
    ["dungeongames.oficial", "Dungeon Games Store", "São Paulo"],
    ["encounter.bg", "Encounter | Jogos de Tabuleiro | Board Games", "São Paulo"],
    ["espaco162karaoke", "Espaço 162 - Meu Karaokê Box", "São Paulo"],
    ["fanhourbr", "Fan Hour Games and Burgers", "São Paulo"],
    ["flowg4mes", "Flow Games - Burgers, Cards & Comunidade", "São Paulo"],
    ["jogasampa", "Jogasampa", "São Paulo"],
    ["ludusluderia", "Ludus Luderia", "São Paulo"],
    ["omniverselivraria", "OMNIVERSE", "São Paulo"],
    ["pittasboardgames", "Pitta's Board Games", "São Paulo"],
    ["lojaplacegames", "Place Games", "São Paulo"],
    ["playeasyjogos", "Play Easy", "São Paulo"],
    ["tubaleria", "Tubaleria", "São Paulo"],
    ["xplaceoficial", "XPlace", "São Paulo"],
    ["cafegeekvv", "Café Geek Cafeteria e Ludoteca", "Vitória"],
  ].map(([u, nome, capital]) => ({ u, nome, capital }));
  const CHAVE_ALVO = 'igc-alvo';
  const CHAVE_ABRIR = 'igc-alvo-abrir';
  const CHAVE_FEITOS = 'igc-alvos-feitos'; // { perfil: { modo, em, n } }
  const CHAVE_MARCAS = 'igc-alvos-marcas'; // { perfil: true (dado por coletado) | false (desfeito) }
  const lerLs = (k, padrao) => { try { return JSON.parse(localStorage.getItem(k) || 'null') ?? padrao; } catch (_) { return padrao; } };
  const gravarLs = (k, v) => { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, JSON.stringify(v)); } catch (_) { /* ignora */ } };

  // Situação da coleta (vocabulário de _src/dicionario.md §4.5): ok, vazia (período coberto
  // sem post) ou refazer (privado, período não coberto, histórico incompleto, erro).
  function situacaoPerfil(u, modo) {
    const info = perfis.get(u);
    if (!info) return 'refazer: sem dados do perfil';
    const ps = postsDe(u);
    if (info.privado === 'sim' && !ps.length) return 'refazer: perfil privado';
    if (modo === 'completo') {
      const t = totalDe(u);
      return t != null && ps.length >= t ? (ps.length ? 'ok' : 'vazia') : 'refazer: histórico incompleto';
    }
    if (!periodoCoberto(u, ps)) return 'refazer: período não coberto';
    return ps.some(passaData) ? 'ok' : 'vazia';
  }

  function registrarColeta(user, modo, situacao = situacaoPerfil(user, modo)) {
    gravarLs(CHAVE_FEITOS, { ...lerLs(CHAVE_FEITOS, {}), [user]: { modo, em: Date.now(), n: postsDe(user).length, situacao } });
    return situacao;
  }

  // Fim da coleta de um perfil: registra a situação, mostra o desfecho e baixa o CSV de
  // perfis (marcador, sempre) e o de posts (com o download automático).
  function concluirPerfil(u, modo) {
    const sit = registrarColeta(u, modo);
    const ps = postsDe(u);
    const tipo = sit === 'ok' ? 'ok' : sit === 'vazia' ? 'alerta' : 'erro';
    kit.resumo({
      titulo: `@${u}: ${sit === 'ok' ? 'coletado' : sit === 'vazia' ? 'sem post no período' : sit.replace('refazer: ', 'refazer, ')}`,
      sub: modo === 'periodo' ? 'só o período' : 'histórico completo',
      linhas: [[ps.length, 'posts carregados', ps.length ? `${dataCurta(ps[0].taken_at)} → ${dataCurta(ps[ps.length - 1].taken_at)}` : ''],
        [ps.filter(passaData).length, 'no período']],
      tipo,
    });
    exportar([u], u, { soPerfis: !kit.autobaixar });
    menu?.rotular();
  }

  // ok (coleta pela API concluída), falha (situação "refazer"), perfil (só dados do perfil,
  // lidos ao navegar) ou falta. A marca à mão prevalece.
  function estadoPerfil(u, feitos = {}, marcas = {}, temPerfil = () => false) {
    if (marcas[u] === true) return 'ok';
    if (marcas[u] === false) return 'falta';
    if (String(feitos[u]?.situacao || '').startsWith('refazer')) return 'falha';
    if (feitos[u]) return 'ok';
    return temPerfil(u) ? 'perfil' : 'falta';
  }

  // Próximo perfil que falta: primeiro na capital do atual, depois nas outras, na ordem do
  // seletor a partir do atual.
  function proximoPerfil(atual, feitos = {}, marcas = {}, temPerfil = () => false) {
    const i0 = POP_IG.findIndex((p) => p.u === atual);
    const a = POP_IG[i0] || POP_IG[0];
    const ordem = [...POP_IG.slice(i0 + 1), ...POP_IG.slice(0, Math.max(i0, 0))]
      .filter((p) => p.u !== atual && estadoPerfil(p.u, feitos, marcas, temPerfil) !== 'ok');
    return ordem.find((p) => p.capital === a.capital) || ordem[0] || null;
  }

  function abrirPerfil(p) {
    gravarLs(CHAVE_ALVO, p.u);
    gravarLs(CHAVE_ABRIR, { u: p.u, em: Date.now() });
    status(`Abrindo @${p.u}…`);
    location.href = `https://www.instagram.com/${p.u}/`;
  }

  const alvoAtual = () => (POP_IG.some((p) => p.u === perfilAtual()) ? perfilAtual() : lerLs(CHAVE_ALVO, POP_IG[0].u));
  const estadoDoAlvo = (u) => estadoPerfil(u, lerLs(CHAVE_FEITOS, {}), lerLs(CHAVE_MARCAS, {}), (x) => perfis.has(x));
  let menu = null;

  function criarMenu() {
    return kit.menuAlvos({
      itens: () => POP_IG, id: (p) => p.u, unidade: 'perfis',
      estadoDe: (p) => ({ ok: 'ok', falha: 'falha', perfil: 'parcial' }[estadoDoAlvo(p.u)] || 'falta'),
      detalhe: (p, e) => {
        const f = lerLs(CHAVE_FEITOS, {})[p.u];
        if (e === 'ok' && f) return `${f.modo === 'periodo' ? 'período' : 'histórico'}, ${f.n} posts`;
        if (e === 'falha') return String(f?.situacao || '').replace('refazer: ', '');
        return e === 'parcial' ? 'só perfil' : `@${p.u}`;
      },
      atual: alvoAtual,
      aoEscolher: (p) => {
        if (perfilAtual() === p.u) { gravarLs(CHAVE_ALVO, p.u); menu.rotular(); return; }
        if (ocupado) { menu.select.value = alvoAtual(); status('Espere a coleta em curso terminar (ou pare).', 'alerta'); return; }
        abrirPerfil(p);
      },
      aoProximo: () => {
        if (ocupado) { status('Espere a coleta em curso terminar (ou pare).', 'alerta'); return; }
        const p = proximoPerfil(alvoAtual(), lerLs(CHAVE_FEITOS, {}), lerLs(CHAVE_MARCAS, {}), (u) => perfis.has(u));
        if (!p) { status('Todos os perfis do B1 estão coletados.', 'ok'); return; }
        abrirPerfil(p);
      },
      aoMarcar: (p) => {
        const col = estadoDoAlvo(p.u) === 'ok';
        gravarLs(CHAVE_MARCAS, { ...lerLs(CHAVE_MARCAS, {}), [p.u]: !col });
        status(col ? `@${p.u} volta a faltar.` : `@${p.u} marcado como coletado.`);
        menu.rotular();
      },
    });
  }

  function rotularPerfis() { menu?.rotular(); }

  // Perfil aberto pelo seletor ou por "Próximo": coleta sozinho quando a página carrega.
  async function coletarAoAbrir() {
    const pedido = lerLs(CHAVE_ABRIR, null);
    if (!pedido) return;
    gravarLs(CHAVE_ABRIR, null);
    if (Date.now() - pedido.em > 2 * 60 * 1000 || perfilAtual() !== pedido.u || filaSnowballAtiva()) return;
    const fila = pedido.fila && lerFila();
    if (fila) {
      el.fila.value = fila.todos.join('\n');
      el.modoFila.valor = fila.modo || 'completo';
      await executar(() => coletarFila(fila.todos, fila.modo || 'completo'));
      rotularPerfis();
      return;
    }
    if (!coletaAuto) { status(`@${pedido.u} aberto. Coleta automática desligada: use "Coletar período".`); return; }
    const modo = el.modoFila?.valor || 'periodo';
    await executar(() => coletarPerfil(pedido.u, modo).then(() => concluirPerfil(pedido.u, modo)));
    rotularPerfis();
  }

  // ---------- selos na grade ----------

  let selosAgendados = false;
  let mostrarSelos = true;
  let soEventos = false;
  let busca = '';
  // Período padrão da coleta do Bloco B1; 'AAAA-MM-DD' ou vazio; inclusivo nas duas pontas.
  const PERIODO_PADRAO = ['2026-09-01', '2026-10-01'];
  // Ao abrir, vale o período da última coleta feita (CHAVE_PERIODO); sem coleta, o padrão.
  const CHAVE_PERIODO = 'igc-periodo-ultima-coleta';
  let [dataDe, dataAte] = (() => {
    const p = lerLs(CHAVE_PERIODO, null);
    return Array.isArray(p) && p.length === 2 && p.every((x) => x === '' || /^\d{4}-\d{2}-\d{2}$/.test(x)) ? p : PERIODO_PADRAO;
  })();

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
      // Conferência: contorna os posts sorteados; o atual, mais grosso.
      const contorno = m && conf.codigos.includes(m[1]) ? (m[1] === conf.codigos[conf.i] ? '4px solid #e8a400' : '2px dashed #e8a400') : '';
      if (a.style.outline !== contorno) { a.style.outline = contorno; a.style.outlineOffset = contorno ? '-4px' : ''; }

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

  // >>> kit_painel (cópia de _src/webScripts/_kit_painel/kit_painel.js; regerar com: node _src/webScripts/_kit_painel/embutir.js)
  // Kit dos painéis dos webscripts do TCC Luderia. Fonte única: o embutir.js copia este
  // bloco para dentro de cada .user.js, entre os marcadores; não editar a cópia.
  // Padrão (o do maps_avaliacoes): canto superior direito, shadow DOM preso ao <html> e
  // reposto se sumir, arrastável e redimensionável com posição salva, Montserrat,
  // Heroicons outline, roxo como cor primária, verde/âmbar/vermelho para o desfecho,
  // explicações em dicas (ⓘ ou sobre o próprio botão) em vez de texto solto.
  // Só define funções: nada toca o DOM antes de montar() (os testes rodam no Node).
  function kitPainel(op = {}) {
    const P = op.prefixo || op.id || 'tcc';
    const temGM = typeof GM_getValue === 'function' && typeof GM_setValue === 'function';
    const ler = op.ler || ((c, padrao) => {
      try {
        if (temGM) return GM_getValue(c, padrao);
        const v = localStorage.getItem(c);
        return v == null ? padrao : JSON.parse(v);
      } catch (_) { return padrao; }
    });
    const gravar = op.gravar || ((c, v) => {
      try {
        if (temGM) { if (v == null && typeof GM_deleteValue === 'function') GM_deleteValue(c); else GM_setValue(c, v); return; }
        if (v == null) localStorage.removeItem(c); else localStorage.setItem(c, JSON.stringify(v));
      } catch (_) { /* sem armazenamento */ }
    });
    const chave = (s) => `${P}:kit:${s}`;
    const k = {
      el: {}, ocupado: false, parar: false, acoes: [], ler, gravar,
      som: ler(chave('som'), true), autobaixar: ler(chave('autobaixar'), true),
    };
    const dicas = new WeakMap();
    let hospedeiro = null, painel = null;

    // ---------- elementos ----------
    function criar(tag, props = {}, filhos = []) {
      const n = document.createElement(tag);
      for (const [a, v] of Object.entries(props)) {
        if (v == null) continue;
        if (a === 'dica') dica(n, v);
        else if (a === 'style') n.style.cssText = v;
        else if (a === 'role' || a.startsWith('aria-') || a.startsWith('data-')) n.setAttribute(a, v);
        else n[a] = v;
      }
      for (const f of [].concat(filhos)) {
        if (f == null || f === false) continue;
        n.appendChild(typeof f === 'object' ? f : document.createTextNode(String(f)));
      }
      return n;
    }

    // Heroicons 24/outline (traço 1.5).
    const ICONES = {
      'arrow-down': 'M19.5 13.5 12 21m0 0-7.5-7.5M12 21V3',
      'arrow-down-tray': 'M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3',
      'arrow-path': 'M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99',
      'arrow-top-right-on-square': 'M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25',
      'arrow-up': 'M4.5 10.5 12 3m0 0 7.5 7.5M12 3v18',
      'arrow-up-tray': 'M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5',
      'arrow-uturn-left': 'M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3',
      'bell': 'M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0',
      'bell-slash': 'M9.143 17.082a24.248 24.248 0 0 0 3.844.148m-3.844-.148a23.856 23.856 0 0 1-5.455-1.31 8.964 8.964 0 0 0 2.3-5.542m3.155 6.852a3 3 0 0 0 5.667 1.97m1.965-2.277L21 21m-4.225-4.225a23.81 23.81 0 0 0 3.536-1.003A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6.53 6.53m10.245 10.245L6.53 6.53M3 3l3.53 3.53',
      'calendar-days': 'M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5',
      'check': 'm4.5 12.75 6 6 9-13.5',
      'chevron-double-down': 'm4.5 5.25 7.5 7.5 7.5-7.5m-15 6 7.5 7.5 7.5-7.5',
      'chevron-left': 'M15.75 19.5 8.25 12l7.5-7.5',
      'chevron-right': 'm8.25 4.5 7.5 7.5-7.5 7.5',
      'clock': 'M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
      'code-bracket': 'M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5',
      'document-check': 'M10.125 2.25h-4.5c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125v-9M10.125 2.25h.375a9 9 0 0 1 9 9v.375M10.125 2.25A3.375 3.375 0 0 1 13.5 5.625v1.5c0 .621.504 1.125 1.125 1.125h1.5a3.375 3.375 0 0 1 3.375 3.375M9 15l2.25 2.25L15 12',
      'document-duplicate': 'M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H9.75',
      'document-text': 'M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z',
      'exclamation-triangle': 'M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z',
      'eye': 'M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178ZM15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z',
      'forward': 'M3 8.689c0-.864.933-1.406 1.683-.977l7.108 4.061a1.125 1.125 0 0 1 0 1.954l-7.108 4.061A1.125 1.125 0 0 1 3 16.811V8.69ZM12.75 8.689c0-.864.933-1.406 1.683-.977l7.108 4.061a1.125 1.125 0 0 1 0 1.954l-7.108 4.061a1.125 1.125 0 0 1-1.683-.977V8.69Z',
      'funnel': 'M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 0 1-.659 1.591l-5.432 5.432a2.25 2.25 0 0 0-.659 1.591v2.927a2.25 2.25 0 0 1-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 0 0-.659-1.591L3.659 7.409A2.25 2.25 0 0 1 3 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0 1 12 3Z',
      'hashtag': 'M5.25 8.25h15m-16.5 7.5h15m-1.8-13.5-3.9 19.5m-2.1-19.5-3.9 19.5',
      'information-circle': 'm11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z',
      'magnifying-glass': 'm21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z',
      'map-pin': 'M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z',
      'minus': 'M5 12h14',
      'bolt': 'm3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z',
      'bolt-slash': 'M11.412 15.655 9.75 21.75l3.745-4.012M9.257 13.5H3.75l2.659-2.849m2.048-2.194L14.25 2.25 12 10.5h8.25l-4.707 5.043M8.457 8.457 3 3m5.457 5.457 7.086 7.086m0 0L21 21',
      'play': 'M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z',
      'plus': 'M12 4.5v15m7.5-7.5h-15',
      'queue-list': 'M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 0 1 0 3.75H5.625a1.875 1.875 0 0 1 0-3.75Z',
      'stop': 'M5.25 7.5A2.25 2.25 0 0 1 7.5 5.25h9a2.25 2.25 0 0 1 2.25 2.25v9a2.25 2.25 0 0 1-2.25 2.25h-9a2.25 2.25 0 0 1-2.25-2.25v-9Z',
      'trash': 'm14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0',
      'x-mark': 'M6 18 18 6M6 6l12 12',
    };

    function icone(nome, classe = '') {
      const NS = 'http://www.w3.org/2000/svg';
      const svg = document.createElementNS(NS, 'svg');
      for (const [a, v] of Object.entries({ viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '1.5', 'aria-hidden': 'true' })) svg.setAttribute(a, v);
      if (classe) svg.setAttribute('class', classe);
      const p = document.createElementNS(NS, 'path');
      p.setAttribute('d', ICONES[nome] || '');
      p.setAttribute('stroke-linecap', 'round');
      p.setAttribute('stroke-linejoin', 'round');
      svg.appendChild(p);
      return svg;
    }

    // ---------- dicas: balão próprio (mais rápido que o title do navegador) ----------
    // Qualquer elemento com dica mostra o balão ao parar o mouse (ou com foco); o ⓘ
    // abre na hora e, clicado, fica fixo até Esc, rolagem ou clique fora.
    let dicaAncora = null, dicaFixa = false, timerDica = 0;

    function dica(n, conteudo) {
      if (!conteudo) { dicas.delete(n); n.removeAttribute('data-dica'); return n; }
      dicas.set(n, conteudo);
      n.setAttribute('data-dica', '');
      if (typeof conteudo === 'string' && n.tagName === 'BUTTON' && !n.textContent.trim()) n.setAttribute('aria-label', conteudo);
      return n;
    }

    function abrirDica(ancora, fixa = false) {
      clearTimeout(timerDica);
      const c = dicas.get(ancora);
      if (!c || !k.el.dica) return;
      dicaAncora = ancora; dicaFixa = fixa;
      const v = typeof c === 'function' ? c() : c;
      k.el.dica.replaceChildren(typeof v === 'object' ? v : document.createTextNode(String(v)));
      k.el.dica.hidden = false;
      const r = ancora.getBoundingClientRect(), d = k.el.dica.getBoundingClientRect(), M = 10;
      const left = Math.min(Math.max(M, r.left + r.width / 2 - d.width / 2), innerWidth - d.width - M);
      let top = r.bottom + 6;
      if (top + d.height > innerHeight - M) top = Math.max(M, r.top - d.height - 6);
      k.el.dica.style.left = `${left}px`;
      k.el.dica.style.top = `${top}px`;
    }

    function fecharDica() {
      clearTimeout(timerDica);
      if (k.el.dica) k.el.dica.hidden = true;
      dicaAncora = null; dicaFixa = false;
    }

    const comDica = (e) => e.composedPath().find((n) => n.nodeType === 1 && dicas.has(n));

    function ajuda(conteudo, rotulo = 'Explicação') {
      const i = criar('span', { className: 'ajuda', tabIndex: 0, role: 'button', 'aria-label': rotulo }, [icone('information-circle')]);
      return dica(i, conteudo);
    }

    // ---------- controles ----------
    // botao('arrow-down-tray', 'CSV', fn, { classe: 'mini', dica: '…' }); sem texto vira botão-ícone.
    function botao(ico, texto, fn, { classe = '', dica: d = '' } = {}) {
      const b = criar('button', { type: 'button', className: `${texto ? '' : 'ico '}${classe}`.trim(), onclick: fn },
        [ico ? icone(ico) : null, texto || null]);
      if (d) dica(b, d);
      return b;
    }

    // Ação destrutiva em dois cliques: o primeiro arma (vermelho, treme) e o segundo, em até 3 s, executa.
    function botaoPerigo(ico, texto, fn, { classe = '', dica: d = '' } = {}) {
      const b = botao(ico, texto, null, { classe: `perigo ${classe}`, dica: d });
      let armado = 0;
      const desarmar = () => { clearTimeout(armado); armado = 0; b.classList.remove('armado'); dica(b, d); };
      b.onclick = () => {
        if (!armado) {
          b.classList.add('armado');
          dica(b, 'Clique de novo para confirmar');
          abrirDica(b);
          armado = setTimeout(desarmar, 3000);
          return;
        }
        desarmar(); fecharDica(); fn();
      };
      return b;
    }

    // Etiqueta liga/desliga: cinza desligada, azul ligada. `checked` imita a caixa de marcar.
    function etiqueta(rotulo, aoAlternar, { ligada = false, dica: d = '', ico = '' } = {}) {
      const b = criar('button', { type: 'button', className: 'tag' }, [ico ? icone(ico) : null, rotulo]);
      if (d) dica(b, d);
      const pintar = (v) => b.setAttribute('aria-pressed', String(v));
      pintar(ligada);
      Object.defineProperty(b, 'checked', { get: () => b.getAttribute('aria-pressed') === 'true', set: (v) => pintar(!!v) });
      b.onclick = () => { pintar(!b.checked); aoAlternar(b.checked); };
      return b;
    }

    // Botão-ícone de preferência (fica roxo ligado); a dica diz o estado.
    function alternaIcone({ ico, icoDesligado = ico, rotulo, ligado, aoMudar, classe = 'leve' }) {
      const b = criar('button', { type: 'button', className: `ico ${classe}` });
      let v = !!ligado;
      const pintar = () => {
        b.setAttribute('aria-pressed', String(v));
        b.replaceChildren(icone(v ? ico : icoDesligado));
        dica(b, `${rotulo}: ${v ? 'ligado' : 'desligado'}`);
        b.setAttribute('aria-label', rotulo);
      };
      b.onclick = () => { v = !v; pintar(); aoMudar(v); if (dicaAncora === b) abrirDica(b); };
      Object.defineProperty(b, 'checked', { get: () => v, set: (x) => { v = !!x; pintar(); } });
      pintar();
      return b;
    }

    // Controle segmentado: [[valor, texto, dica]].
    function pills(opcoes, valor, aoMudar) {
      const caixa = criar('div', { className: 'pills', role: 'tablist' });
      const bs = opcoes.map(([v, t, d]) => {
        const b = criar('button', { type: 'button', className: 'pill', role: 'tab', 'data-valor': v }, [t]);
        if (d) b.appendChild(ajuda(d));
        b.onclick = () => { caixa.valor = v; aoMudar(v); };
        return b;
      });
      Object.defineProperty(caixa, 'valor', {
        get: () => valor,
        set: (v) => { valor = v; for (const b of bs) b.setAttribute('aria-selected', String(b.dataset.valor === String(v))); },
      });
      caixa.append(...bs);
      caixa.valor = valor;
      return caixa;
    }

    // Seção recolhível que lembra se estava aberta.
    const abertos = new Set(ler(chave('abertos'), op.abertos || []));
    function secao(id, cabeca, filhos, aoAbrir = null) {
      const d = criar('details', { open: abertos.has(id) }, [
        criar('summary', {}, [icone('chevron-right', 'seta'), ...[].concat(cabeca)]), ...filhos]);
      d.addEventListener('toggle', () => {
        if (d.open) abertos.add(id); else abertos.delete(id);
        gravar(chave('abertos'), [...abertos]);
        if (d.open && aoAbrir) aoAbrir();
      });
      return d;
    }

    // Botão dentro do <summary> que não abre nem fecha a seção.
    const naoAlterna = (fn) => (e) => { e.preventDefault(); e.stopPropagation(); fn(e); };

    const linha = (filhos, classe = '') => criar('div', { className: `linha ${classe}`.trim() }, filhos);
    const esp = () => criar('span', { className: 'esp' });
    const rotulo = (t, d) => criar('span', { className: 'rotulo' }, [t, d ? ajuda(d) : null]);
    const selo = (t = '', classe = '') => criar('span', { className: `selo ${classe}`.trim(), textContent: t });

    // ---------- status, resumo e progresso ----------
    function animarStatus() {
      const s = k.el.status;
      s.classList.remove('entra');
      void s.offsetWidth;
      s.classList.add('entra');
    }

    function status(t, tipo = '') {
      if (!k.el.status) return;
      const cls = `status${tipo ? ` st-${tipo}` : ''}`;
      if (k.el.status.className.replace(' entra', '') !== cls || k.el.status.textContent !== t) {
        const mudouTipo = k.el.status.className.replace(' entra', '') !== cls;
        k.el.status.className = cls;
        k.el.status.textContent = t;
        if (mudouTipo) animarStatus();
      }
      if (tipo === 'ok' || tipo === 'erro' || tipo === 'alerta') estado(tipo);
    }

    // Resumo do desfecho: cabeçalho com a cor do resultado, contagens e avisos.
    // linhas: [[número, texto, detalhe]]; avisos: textos em âmbar.
    function resumo({ titulo, sub = '', linhas = [], avisos = [], tipo = '' }) {
      if (!k.el.status) return;
      const item = ([n, t, det]) => criar('li', {}, [criar('b', { textContent: String(n) }), ` ${t}`,
        det ? criar('span', { className: 'suave', textContent: ` · ${det}` }) : null]);
      k.el.status.className = `status rico${tipo ? ` st-${tipo}` : ''}`;
      k.el.status.replaceChildren(...[
        criar('div', { className: 'cab' }, [criar('span', { className: 'ponto' }), titulo]),
        sub ? criar('div', { className: 'suave', textContent: sub }) : null,
        linhas.length ? criar('ul', {}, linhas.map(item)) : null,
        ...avisos.filter(Boolean).map((t) => criar('p', { className: 'aviso', textContent: t })),
      ].filter(Boolean));
      animarStatus();
      if (tipo) estado(tipo);
    }

    // Barra de progresso: barra('coleta') cria; progresso('coleta', 0.4, 'texto'),
    // progresso('coleta', true, 'texto') indeterminada e progresso('coleta', null) esconde.
    const barras = {};
    function barra(nome) {
      const b = { preenchido: criar('div', { className: 'preenchido' }), texto: criar('span'), pct: criar('span') };
      b.trilho = criar('div', { className: 'trilho' }, [b.preenchido]);
      b.caixa = criar('div', { className: 'barra', hidden: true }, [criar('div', { className: 'txt' }, [b.texto, b.pct]), b.trilho]);
      barras[nome] = b;
      return b.caixa;
    }

    function progresso(nome, frac, texto = '') {
      const b = barras[nome];
      if (!b) return;
      if (frac == null || frac === false) { b.caixa.hidden = true; return; }
      b.caixa.hidden = false;
      b.texto.textContent = texto;
      const indef = frac === true;
      b.trilho.classList.toggle('indef', indef);
      b.preenchido.classList.toggle('rodando', !indef && k.ocupado);
      if (indef) { b.pct.textContent = ''; return; }
      const pct = Math.round(Math.min(1, Math.max(0, frac)) * 100);
      b.preenchido.style.width = `${pct}%`;
      b.pct.textContent = `${pct}%`;
    }

    // Ponto do cabeçalho (visível minimizado): cinza parado, roxo pulsando em curso,
    // verde concluído, âmbar interrompido ou incerto, vermelho erro.
    function estado(s = '') {
      if (k.el.ponto) k.el.ponto.className = `ponto-estado ${s}`.trim();
    }

    // Liga e desliga as ações conforme a tarefa em curso.
    function atualizarAcoes(ocupado = k.ocupado) {
      for (const b of k.acoes) b.disabled = ocupado;
      if (k.el.parar) k.el.parar.disabled = !ocupado;
      if (ocupado) estado('rodando');
    }

    const botaoParar = (fn = () => { k.parar = true; status('Parando…'); }) =>
      (k.el.parar = botao('stop', '', fn, { classe: 'parar', dica: 'Parar' }));

    // Roda uma tarefa travando as ações; "Parar" põe k.parar = true.
    async function executar(fn, { avisar = true } = {}) {
      if (k.ocupado) return false;
      k.ocupado = true; k.parar = false; atualizarAcoes();
      let ok = true;
      try { await fn(); } catch (e) { ok = false; if (!k.parar) status(`Erro: ${e.message}`, 'erro'); }
      const parado = k.parar;
      k.ocupado = false; atualizarAcoes();
      estado(!ok && !parado ? 'erro' : parado ? 'alerta' : 'ok');
      if (parado && ok) status('Interrompido.', 'alerta');
      if (avisar) tocar(ok && !parado);
      return ok && !parado;
    }

    // ---------- microinterações ----------
    let audio = null;
    function liberarAudio() {
      try { audio = audio || new AudioContext(); if (audio.state === 'suspended') audio.resume(); } catch (_) { audio = null; }
    }

    function tocar(ok = true) {
      if (!k.som) return;
      liberarAudio();
      if (!audio) return;
      (ok ? [880, 1320] : [440, 330]).forEach((f, i) => {
        const o = audio.createOscillator(), g = audio.createGain();
        o.frequency.value = f;
        o.connect(g); g.connect(audio.destination);
        const t = audio.currentTime + i * 0.22;
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.3, t + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
        o.start(t); o.stop(t + 0.21);
      });
    }

    // Brilho rápido num elemento (verde = feito, vermelho = falhou).
    function piscar(n, tipo = 'ok') {
      if (!n) return;
      n.classList.remove('pisca-ok', 'pisca-erro');
      void n.offsetWidth;
      n.classList.add(`pisca-${tipo}`);
      setTimeout(() => n.classList.remove(`pisca-${tipo}`), 800);
    }

    // O botão vira um ✓ verde por um instante.
    function confirmarBotao(b) {
      if (!b) return;
      const antes = [...b.childNodes];
      b.classList.add('feito');
      b.replaceChildren(icone('check'), ...antes.filter((n) => n.nodeType === 3));
      setTimeout(() => { b.classList.remove('feito'); b.replaceChildren(...antes); }, 1200);
    }

    async function copiar(texto, b) {
      try { await navigator.clipboard.writeText(texto); } catch (_) {
        const t = criar('textarea', { value: texto });
        hospedeiro.shadowRoot.appendChild(t);
        t.select();
        document.execCommand('copy');
        t.remove();
      }
      confirmarBotao(b);
    }

    // ---------- arquivos ----------
    const celula = (v) => {
      const s = v == null ? '' : String(v);
      return /[;"\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    // CSV com ";" e BOM (abre direto no Excel pt-BR; no pandas, sep=";").
    const csv = (linhas, cols) => '﻿' + [cols.join(';'), ...linhas.map((l) => cols.map((c) => celula(l[c])).join(';'))].join('\r\n');

    function baixarArquivo(nome, conteudo, tipo = 'text/csv;charset=utf-8') {
      const url = URL.createObjectURL(new Blob([conteudo], { type: tipo }));
      const a = criar('a', { href: url, download: nome });
      (document.body || document.documentElement).appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    }

    // ---------- menu de alvos (casas, perfis, cardápios, acervos) ----------
    // Seletor por grupo com ✓ ok, ◐ parcial, ! refazer, ○ falta; contador com barra fina;
    // botões Próximo (o que falta, primeiro no mesmo grupo), Marcar/Desfazer e Só os que faltam.
    const SIMBOLO = { ok: '✓', parcial: '◐', falha: '!', falta: '○' };
    function menuAlvos({ itens, id = (x) => x.id, grupo = (x) => x.capital, nome = (x) => x.nome, detalhe = () => '',
      estadoDe, atual, aoEscolher, aoProximo, aoMarcar, unidade = 'coletados' }) {
      const lista = itens();
      const grupos = [...new Set(lista.map(grupo))];
      const select = criar('select', { 'aria-label': 'Alvo da coleta' }, grupos.map((g) => criar('optgroup', { label: g },
        lista.filter((x) => grupo(x) === g).map((x) => criar('option', { value: id(x), textContent: nome(x) })))));
      dica(select, `✓ ok · ◐ parcial · ! refazer · ○ falta. Escolher abre o alvo e coleta.`);
      select.onchange = () => aoEscolher(lista.find((x) => id(x) === select.value));
      let soFaltam = ler(chave('soFaltam'), false);
      const bProx = botao('forward', 'Próximo', () => aoProximo(), { classe: 'mini', dica: 'Abre o próximo que falta (primeiro no mesmo grupo) e coleta sozinho' });
      // Sem aoMarcar, o menu fica sem o botão Marcar/Desfazer.
      const bMarcar = aoMarcar ? botao('check', '', () => aoMarcar(lista.find((x) => id(x) === select.value)), { classe: 'leve' }) : null;
      const bFiltro = alternaIcone({ ico: 'funnel', rotulo: 'Só os que faltam', ligado: soFaltam,
        aoMudar: (v) => { soFaltam = v; gravar(chave('soFaltam'), v); rotular(); } });
      const cont = criar('span', { className: 'pos' });
      const trilho = criar('div', { className: 'trilho fino' }, [criar('div', { className: 'preenchido' })]);
      const caixa = criar('div', { className: 'menu' }, [
        linha([select]),
        linha([criar('div', { className: 'contador' }, [cont, trilho]), bProx, bMarcar, bFiltro], 'compacta'),
      ]);
      function rotular() {
        const a = atual();
        let prontos = 0;
        for (const o of select.querySelectorAll('option')) {
          const x = lista.find((y) => id(y) === o.value);
          const e = estadoDe(x);
          if (e === 'ok') prontos++;
          const t = `${SIMBOLO[e] || '○'} ${nome(x)}${detalhe(x, e) ? ` · ${detalhe(x, e)}` : ''}`;
          if (o.textContent !== t) o.textContent = t;
          o.className = e;
          o.hidden = soFaltam && e === 'ok' && id(x) !== a;
        }
        for (const g of select.querySelectorAll('optgroup')) g.hidden = [...g.querySelectorAll('option')].every((o) => o.hidden);
        if (a && select.value !== a) select.value = a;
        cont.textContent = `${prontos}/${lista.length} ${unidade}`;
        trilho.firstChild.style.width = `${Math.round((100 * prontos) / (lista.length || 1))}%`;
        const xa = lista.find((y) => id(y) === select.value);
        const col = xa && estadoDe(xa) === 'ok';
        if (!bMarcar) return;
        bMarcar.replaceChildren(icone(col ? 'arrow-uturn-left' : 'check'));
        dica(bMarcar, col ? 'Desfazer: volta a faltar' : 'Marcar como coletado, sem nova coleta');
      }
      return { caixa, select, rotular, bProx };
    }

    // ---------- painel ----------
    const CSS = `
      :host{--fundo:#fff;--texto:#18181b;--suave:#71717a;--sup:#f4f4f5;--sup2:#e4e4e7;--linha:#ececef;
        --caneta:#7e22ce;--caneta-forte:#6b21a8;--caneta-100:#f3e8ff;--azul:#2563eb;--azul-100:#dbeafe;
        --ok:#15803d;--ok-100:#dcfce7;--erro:#b91c1c;--erro-100:#fee2e2;--alerta:#b45309;--alerta-100:#fef3c7;
        --fonte:Montserrat,system-ui,-apple-system,"Segoe UI",sans-serif}
      @media (prefers-color-scheme:dark){:host{--fundo:#18181b;--texto:#f4f4f5;--suave:#a1a1aa;--sup:#27272a;--sup2:#3f3f46;
        --linha:#27272a;--caneta:#a855f7;--caneta-forte:#9333ea;--caneta-100:#3b0764;--azul:#3b82f6;--azul-100:#172554;
        --ok:#4ade80;--ok-100:#052e16;--erro:#f87171;--erro-100:#450a0a;--alerta:#fbbf24;--alerta-100:#451a03}}
      *{box-sizing:border-box}
      [hidden]{display:none!important}
      #painel{position:fixed;top:12px;right:12px;z-index:2147483647;width:var(--largura,272px);max-height:calc(100vh - 24px);
        overflow:auto;background:var(--fundo);color:var(--texto);border-radius:14px;
        box-shadow:0 8px 28px rgba(0,0,0,.2);font:13.5px/1.45 var(--fonte);padding:8px 12px 10px;
        resize:both;min-width:224px;min-height:44px;max-width:calc(100vw - 24px);transition:box-shadow .2s}
      #painel.min{height:auto!important;min-height:0;resize:none;width:auto!important;min-width:0}
      #painel.min>*:not(header){display:none}
      #painel.arrastando{user-select:none;opacity:.92;box-shadow:0 14px 40px rgba(0,0,0,.3)}
      header{display:flex;align-items:center;gap:2px;cursor:grab;touch-action:none;min-height:32px}
      #painel.arrastando header{cursor:grabbing}
      header .nome{flex:1;font-weight:700;font-size:14.5px;cursor:pointer;user-select:none;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;padding-right:6px}
      .ponto-estado{width:8px;height:8px;border-radius:50%;background:var(--sup2);margin-right:8px;flex:none;transition:background .3s}
      .ponto-estado.rodando{background:var(--caneta);animation:pulso 1.2s ease-in-out infinite}
      .ponto-estado.ok{background:var(--ok)} .ponto-estado.alerta{background:var(--alerta)} .ponto-estado.erro{background:var(--erro)}
      @keyframes pulso{0%,100%{box-shadow:0 0 0 0 rgba(147,51,234,.55)}50%{box-shadow:0 0 0 5px rgba(147,51,234,0)}}
      svg{width:18px;height:18px;flex:none}
      button{font:inherit;color:inherit;border:0;background:var(--sup);border-radius:8px;padding:6px 10px;cursor:pointer;
        display:inline-flex;align-items:center;justify-content:center;gap:6px;white-space:nowrap;
        transition:background .15s,color .15s,transform .1s,box-shadow .2s}
      button:hover:not(:disabled){background:var(--sup2)}
      button:active:not(:disabled){transform:scale(.94)}
      button:disabled{opacity:.35;cursor:default}
      :focus-visible{outline:2px solid var(--azul);outline-offset:1px}
      .ico{width:32px;height:32px;padding:0;flex:none}
      .ico.leve{background:transparent;color:var(--suave)}
      .ico.leve:hover:not(:disabled){background:var(--sup);color:var(--texto)}
      .ico.leve[aria-pressed=true]{color:var(--caneta);background:var(--caneta-100)}
      .primario{background:var(--caneta);color:#fff;font-weight:600;flex:1}
      .primario:hover:not(:disabled){background:var(--caneta-forte)}
      .verde{background:var(--ok-100);color:var(--ok)}
      .vermelho{background:var(--erro-100);color:var(--erro)}
      .verde:hover:not(:disabled),.vermelho:hover:not(:disabled){filter:brightness(.95)}
      .verde[aria-pressed=true]{background:var(--ok);color:#fff} .vermelho[aria-pressed=true]{background:var(--erro);color:#fff}
      .parar:not(:disabled){background:var(--erro-100);color:var(--erro)}
      .perigo{color:var(--suave)} .perigo:hover:not(:disabled){color:var(--erro);background:var(--erro-100)}
      button.armado{background:var(--erro)!important;color:#fff!important;animation:tremer .3s}
      @keyframes tremer{25%{transform:translateX(-2px)}75%{transform:translateX(2px)}}
      button.feito{background:var(--ok-100)!important;color:var(--ok)!important}
      .pisca-ok{animation:piscaOk .8s} .pisca-erro{animation:piscaErro .8s}
      @keyframes piscaOk{0%{box-shadow:0 0 0 0 rgba(21,128,61,.6)}100%{box-shadow:0 0 0 8px rgba(21,128,61,0)}}
      @keyframes piscaErro{0%{box-shadow:0 0 0 0 rgba(185,28,28,.6)}100%{box-shadow:0 0 0 8px rgba(185,28,28,0)}}
      .mini{padding:4px 9px;font-size:12.5px}
      .mini svg{width:16px;height:16px}
      .linha{display:flex;align-items:center;gap:6px;margin:7px 0;flex-wrap:wrap}
      .linha.compacta{flex-wrap:nowrap;margin-top:4px}
      .linha>.primario{min-width:0}
      .esp{flex:1}
      .rotulo{font-size:12px;font-weight:600;color:var(--suave);display:inline-flex;align-items:center;gap:4px}
      .suave{color:var(--suave)}
      select,input[type=text],input[type=search],input[type=date],textarea{font:inherit;color:inherit;background:var(--sup);border:0;border-radius:8px;padding:6px 8px;min-width:0}
      select{padding:5px 4px;cursor:pointer;flex:1;width:100%}
      select option{color:#111;background:#fff}
      select option.ok{color:#9ca3af} select option.parcial{color:#2563eb} select option.falha{color:#b45309}
      input{flex:1}
      input[type=date]{color-scheme:light dark;padding:4px 6px;font-size:12.5px;flex:1 1 0}
      input::placeholder,textarea::placeholder{color:var(--suave)}
      textarea{width:100%;height:60px;font:12px/1.45 ui-monospace,Menlo,monospace;resize:vertical;display:block}
      .busca{display:flex;align-items:center;gap:6px;background:var(--sup);border-radius:8px;padding:0 4px 0 10px;flex:1}
      .busca input{background:transparent;padding:6px 0}
      .busca>svg{color:var(--suave);width:16px;height:16px}
      .contador{flex:1;min-width:0;display:flex;flex-direction:column;gap:3px}
      .barra{margin:7px 0}
      .barra[hidden]{display:none}
      .barra .txt{display:flex;justify-content:space-between;font-size:12px;color:var(--suave);font-variant-numeric:tabular-nums}
      .trilho{height:6px;background:var(--sup);border-radius:999px;overflow:hidden;display:flex;position:relative}
      .trilho.fino{height:4px}
      .preenchido{height:100%;width:0;background:var(--caneta);border-radius:999px;transition:width .35s ease}
      .contador .preenchido{background:var(--ok)}
      .preenchido.rodando{background-image:linear-gradient(90deg,transparent,rgba(255,255,255,.4),transparent);background-size:200% 100%;animation:brilho 1.4s linear infinite}
      .trilho.indef .preenchido{width:35%!important;animation:indef 1.2s ease-in-out infinite}
      @keyframes brilho{from{background-position:200% 0}to{background-position:-200% 0}}
      @keyframes indef{from{transform:translateX(-100%)}to{transform:translateX(300%)}}
      details{border-top:1px solid var(--linha)}
      details[open]{padding-bottom:6px}
      summary{list-style:none;display:flex;align-items:center;gap:6px;cursor:pointer;font-size:14px;font-weight:600;padding:7px 0;user-select:none}
      summary::-webkit-details-marker{display:none}
      summary .seta{width:15px;height:15px;color:var(--suave);transition:transform .2s}
      details[open]>summary .seta{transform:rotate(90deg)}
      summary .ico{width:28px;height:28px;background:transparent;color:var(--suave)}
      summary .ico:hover:not(:disabled){background:var(--sup);color:var(--texto)}
      .selo{font-size:11.5px;font-weight:600;background:var(--sup);color:var(--suave);border-radius:999px;padding:1px 8px;white-space:nowrap}
      .selo:empty{display:none}
      .selo.ok{background:var(--ok-100);color:var(--ok)} .selo.alerta{background:var(--alerta-100);color:var(--alerta)}
      .selo.erro{background:var(--erro-100);color:var(--erro)} .selo.roxo{background:var(--caneta-100);color:var(--caneta)}
      .pos{font-size:12px;color:var(--suave);font-variant-numeric:tabular-nums;font-weight:500;white-space:nowrap}
      .subtitulo{font-size:12px;font-weight:600;color:var(--suave);margin:10px 0 5px;display:flex;align-items:center;gap:4px}
      .tags{display:flex;flex-wrap:wrap;gap:5px;margin:6px 0}
      .tag{padding:3px 10px;border-radius:999px;font-size:12.5px;background:var(--sup);color:var(--suave);gap:4px}
      .tag svg{width:15px;height:15px}
      .tag[aria-pressed=true]{background:var(--azul);color:#fff}
      .tag[aria-pressed=true]:hover{background:var(--azul);filter:brightness(1.08)}
      .tag[aria-pressed=true] .ajuda{color:#fffc}
      .pills{display:flex;background:var(--sup);border-radius:999px;padding:3px;gap:2px;flex:1}
      .pill{flex:1;background:transparent;border-radius:999px;padding:3px 6px;font-size:12.5px;color:var(--suave);gap:4px}
      .pill:hover:not(:disabled){background:var(--sup2)}
      .pill[aria-selected=true]{background:var(--fundo);color:var(--caneta);font-weight:600;box-shadow:0 1px 2px rgba(0,0,0,.08)}
      .ajuda{display:inline-flex;color:var(--suave);cursor:help;border-radius:999px}
      .ajuda svg{width:15px;height:15px}
      .ajuda:hover{color:var(--caneta)}
      .dica{position:fixed;z-index:2147483647;max-width:280px;background:var(--texto);color:var(--fundo);
        font:12.5px/1.5 var(--fonte);padding:7px 10px;border-radius:8px;box-shadow:0 6px 20px rgba(0,0,0,.25);pointer-events:none;
        white-space:pre-line;animation:entra .12s ease-out}
      .dica[hidden]{display:none}
      .status{font-size:13px;border-radius:10px;padding:7px 10px;background:var(--sup);white-space:pre-line;margin:7px 0;transition:background .25s}
      .status:empty{display:none}
      .status.entra{animation:entra .25s ease-out}
      @keyframes entra{from{opacity:0;transform:translateY(-3px)}to{opacity:1;transform:none}}
      .status.rico{white-space:normal}
      .status .cab{font-weight:600;display:flex;gap:8px;align-items:center}
      .status ul{margin:4px 0 0;padding-left:18px}
      .status li::marker{color:var(--suave)}
      .ponto{width:8px;height:8px;border-radius:50%;background:var(--suave);flex:none}
      .st-ok{background:var(--ok-100)} .st-ok .ponto{background:var(--ok)}
      .st-alerta{background:var(--alerta-100)} .st-alerta .ponto{background:var(--alerta)}
      .st-erro{background:var(--erro-100)} .st-erro .ponto{background:var(--erro)}
      .aviso{color:var(--alerta);font-size:12.5px;margin:5px 0 0;font-weight:500}
      .aviso::before{content:"⚠ "}
      .st-alerta .aviso,.st-erro .aviso{color:inherit}
      .info{font-size:12.5px;background:var(--sup);border-radius:10px;padding:7px 10px;margin:7px 0;white-space:pre-line}
      .info:empty{display:none}
      .mono{font:11.5px/1.4 ui-monospace,Menlo,monospace;color:var(--suave);word-break:break-all}
      .chip{font-size:11.5px;font-weight:600;border-radius:999px;padding:1px 8px;white-space:nowrap;background:var(--sup);color:var(--suave)}
      .chip.ok{background:var(--ok-100);color:var(--ok)} .chip.alerta{background:var(--alerta-100);color:var(--alerta)}
      .chip.erro{background:var(--erro-100);color:var(--erro)} .chip.azul{background:var(--azul-100);color:var(--azul)}
      .lista{max-height:280px;overflow:auto;display:flex;flex-direction:column;gap:1px;margin-top:4px}
      .vazio{font-size:12.5px;color:var(--suave);margin:6px 0}
      table{width:100%;border-collapse:collapse;font-size:12px;margin-top:4px;font-variant-numeric:tabular-nums}
      td,th{padding:3px 4px;border-bottom:1px solid var(--linha);text-align:left}
      th{color:var(--suave);font-weight:600} td.n,th.n{text-align:right}
      tr.total td{font-weight:700;border-bottom:0}
      @media (prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}`;

    function carregarFonte() {
      if (document.getElementById('tcc-fonte-montserrat') || !document.head) return;
      document.head.appendChild(criar('link', { id: 'tcc-fonte-montserrat', rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap' }));
    }

    // Painéis 20% mais estreitos desde 13/11/2026: a largura pedida pelo script vale ×ESCALA, e a
    // largura já salva pelo autor é reduzida uma vez (marca `escala`).
    const ESCALA = 0.8;
    // Posição e tamanho escolhidos pelo autor; sem posição salva, vale posicaoPadrao().
    let posicao = ler(chave('posicao'), null);
    if (posicao?.width && posicao.escala !== ESCALA) {
      const px = parseFloat(posicao.width);
      posicao = { ...posicao, width: Number.isFinite(px) ? `${Math.round(px * ESCALA)}px` : posicao.width, escala: ESCALA };
      gravar(chave('posicao'), posicao);
    }
    let arrastou = false;

    function posicionar() {
      if (!painel) return;
      const p = painel;
      if (posicao?.width && !p.style.width && !p.classList.contains('min')) { p.style.width = posicao.width; p.style.height = posicao.height || ''; }
      if (posicao && posicao.left != null) {
        const w = p.offsetWidth || 272;
        const left = Math.min(Math.max(0, posicao.left), Math.max(0, innerWidth - w));
        const top = Math.min(Math.max(0, posicao.top), Math.max(0, innerHeight - 44));
        if (p.style.left !== `${left}px` || p.style.top !== `${top}px`) {
          Object.assign(p.style, { left: `${left}px`, right: 'auto', top: `${top}px`, maxHeight: `calc(100vh - ${top + 12}px)` });
        }
        return;
      }
      const pad = op.posicaoPadrao?.() || {};
      const top = pad.top ?? 12, right = pad.right ?? 12;
      if (p.style.top !== `${top}px` || p.style.right !== `${right}px` || p.style.left) {
        Object.assign(p.style, { left: '', right: `${right}px`, top: `${top}px`, maxHeight: `calc(100vh - ${top + 12}px)` });
      }
    }

    function prepararArraste(cab) {
      cab.addEventListener('pointerdown', (e) => {
        if (e.button !== 0 || e.composedPath().some((n) => n.tagName === 'BUTTON')) return;
        const r = painel.getBoundingClientRect();
        const x0 = e.clientX, y0 = e.clientY;
        let moveu = false;
        const mover = (ev) => {
          if (!moveu && Math.hypot(ev.clientX - x0, ev.clientY - y0) < 4) return;
          moveu = true;
          painel.classList.add('arrastando');
          fecharDica();
          posicao = { ...posicao, left: Math.round(r.left + ev.clientX - x0), top: Math.round(r.top + ev.clientY - y0) };
          posicionar();
        };
        const soltar = () => {
          removeEventListener('pointermove', mover);
          removeEventListener('pointerup', soltar);
          painel.classList.remove('arrastando');
          if (!moveu) return;
          gravar(chave('posicao'), posicao);
          arrastou = true;
          setTimeout(() => { arrastou = false; }, 0);
        };
        addEventListener('pointermove', mover);
        addEventListener('pointerup', soltar);
      });
      cab.addEventListener('dblclick', (e) => {
        if (e.composedPath().some((n) => n.tagName === 'BUTTON')) return;
        posicao = null;
        gravar(chave('posicao'), null);
        painel.style.width = painel.style.height = painel.style.left = '';
        posicionar();
        status('Painel de volta ao canto.');
      });
    }

    function minimizar(v = !painel.classList.contains('min')) {
      painel.classList.toggle('min', v);
      k.el.bMin.replaceChildren(icone(v ? 'plus' : 'minus'));
      dica(k.el.bMin, v ? 'Expandir' : 'Minimizar');
      if (v) { painel.style.width = ''; painel.style.height = ''; } else posicionar();
      gravar(chave('min'), v);
      fecharDica();
    }

    // montar({ nome, filhos, extras (botões do cabeçalho), aposAuto (botões logo depois do download automático), largura, autobaixar, minimizado, css })
    function montar({ nome, filhos, extras = [], aposAuto = [], largura = 340, autobaixar = false, minimizado, css = '' }) {
      carregarFonte();
      k.el.ponto = criar('span', { className: 'ponto-estado' });
      k.el.nome = criar('span', { className: 'nome', textContent: nome });
      k.el.bMin = botao('minus', '', () => minimizar(), { classe: 'leve', dica: 'Minimizar' });
      const bSom = alternaIcone({ ico: 'bell', icoDesligado: 'bell-slash', rotulo: 'Som ao concluir', ligado: k.som,
        aoMudar: (v) => { k.som = v; gravar(chave('som'), v); if (v) tocar(true); } });
      const bAuto = autobaixar ? alternaIcone({ ico: 'arrow-down-tray', rotulo: 'Download automático', ligado: k.autobaixar,
        aoMudar: (v) => { k.autobaixar = v; gravar(chave('autobaixar'), v); } }) : null;
      const cab = criar('header', {}, [k.el.ponto, k.el.nome, ...extras, bSom, bAuto, ...aposAuto, k.el.bMin]);
      dica(k.el.nome, 'Clique para minimizar · arraste para mover · duplo clique volta ao canto');
      painel = criar('div', { id: 'painel', style: `--largura:${Math.round(largura * ESCALA)}px` }, [cab, ...filhos]);
      k.el.painel = painel;
      k.el.nome.onclick = () => { if (!arrastou) minimizar(); };
      prepararArraste(cab);

      // O tamanho só muda pela alça de redimensionar, que grava largura e altura no estilo.
      addEventListener('pointerup', () => {
        if (!painel || painel.classList.contains('min')) return;
        const { width, height } = painel.style;
        if (width && (width !== posicao?.width || height !== posicao?.height)) {
          posicao = { ...posicao, width, height, escala: ESCALA };
          gravar(chave('posicao'), posicao);
        }
      });
      painel.addEventListener('click', liberarAudio);
      painel.addEventListener('scroll', fecharDica);
      // As teclas digitadas no painel não chegam aos atalhos do site.
      for (const tipo of ['keydown', 'keyup', 'keypress']) painel.addEventListener(tipo, (e) => {
        if (tipo === 'keydown' && e.key === 'Escape') fecharDica();
        e.stopPropagation();
      });
      // Dicas: abre com atraso curto sobre botões e na hora sobre o ⓘ.
      painel.addEventListener('pointerover', (e) => {
        const n = comDica(e);
        if (!n || dicaFixa || n === dicaAncora) return;
        clearTimeout(timerDica);
        timerDica = setTimeout(() => abrirDica(n), n.classList.contains('ajuda') ? 0 : 350);
      });
      painel.addEventListener('pointerout', (e) => {
        const n = comDica(e);
        if (!n || dicaFixa || (e.relatedTarget && n.contains(e.relatedTarget))) return;
        clearTimeout(timerDica);
        timerDica = setTimeout(fecharDica, 80);
      });
      painel.addEventListener('focusin', (e) => { const n = comDica(e); if (n && n.matches(':focus-visible')) abrirDica(n); });
      painel.addEventListener('focusout', () => { if (!dicaFixa) fecharDica(); });
      // Captura: tocar no ⓘ dentro de um botão não aciona o botão.
      painel.addEventListener('click', (e) => {
        const i = e.composedPath().find((n) => n.classList?.contains('ajuda'));
        if (!i) return;
        e.stopPropagation(); e.preventDefault();
        if (dicaAncora === i && dicaFixa) fecharDica(); else abrirDica(i, true);
      }, true);
      addEventListener('keydown', (e) => { if (e.key === 'Escape') fecharDica(); });
      addEventListener('scroll', () => { if (!dicaFixa) fecharDica(); }, true);
      addEventListener('click', (e) => { if (dicaAncora && !e.composedPath().includes(dicaAncora)) fecharDica(); });

      k.el.dica = criar('div', { className: 'dica', hidden: true, role: 'tooltip' });
      hospedeiro = criar('div', { id: `${op.id || P}-hospedeiro` });
      const raiz = hospedeiro.attachShadow({ mode: 'open' });
      raiz.append(criar('style', { textContent: CSS + css }), painel, k.el.dica);
      if (minimizado ?? ler(chave('min'), false)) minimizar(true);
      atualizarAcoes();
      garantir();
      return painel;
    }

    // O React e outros sites podem refazer o <body>: o painel fica preso ao <html> e volta se sumir.
    function garantir() {
      if (!hospedeiro || !document.documentElement) return;
      if (!hospedeiro.isConnected) document.documentElement.appendChild(hospedeiro);
      posicionar();
    }

    Object.assign(k, {
      criar, icone, dica, ajuda, botao, botaoPerigo, botaoParar, etiqueta, alternaIcone, pills, secao, naoAlterna,
      linha, esp, rotulo, selo, status, resumo, barra, progresso, estado, atualizarAcoes, executar, tocar, piscar,
      confirmarBotao, copiar, celula, csv, baixarArquivo, menuAlvos, montar, garantir, minimizar,
      nome: (t) => { if (k.el.nome && k.el.nome.textContent !== t) k.el.nome.textContent = t; },
      hospedeiro: () => hospedeiro,
    });
    return k;
  }
  // <<< kit_painel

  // ---------- painel ----------

  let el = {};
  const criar = (...a) => kit.criar(...a);
  const status = (t, tipo = '') => kit.status(t, tipo);

  function atualizarResumo() {
    if (!el.resumo) return;
    const u = perfilAtual();
    kit.nome(u ? `IG · @${u}` : 'Coletor IG');
    if (!u) {
      el.resumo.replaceChildren('Abra um perfil.');
      for (const k in el.campos) el.campos[k].value = '';
      for (const k in el.fontes) el.fontes[k].textContent = '';
      el.avisoPrimeiro.textContent = '';
      el.avisoNome.textContent = '';
      el.blocoPeriodo.hidden = true;
      atualizarValidacao();
      return;
    }
    const ps = postsDe(u);
    const conta = (v) => ps.filter((p) => vinculo(p, u) === v).length;
    const colab = ps.filter((p) => vinculo(p, u) === 'colaboração');
    const chave = `${u}|${ps.length}|${colab.length}`;
    if (el.resumo.dataset.chave !== chave) {
      el.resumo.dataset.chave = chave;
      el.resumo.replaceChildren(...(ps.length ? [
        criar('b', { textContent: `${ps.length} posts` }), ` · ${dataCurta(ps[0].taken_at)} → ${dataCurta(ps[ps.length - 1].taken_at)} `,
        criar('div', { className: 'tags' }, [
          criar('span', { className: 'chip ok', textContent: `${conta('próprio')} próprios`, dica: 'Posts de que o perfil é o dono' }),
          criar('span', { className: 'chip azul', textContent: `${colab.length} colaboração`, dica: `Colaborações; em ${colab.filter((p) => p.perfil !== u).length} o dono é outro perfil` }),
          criar('span', { className: 'chip alerta', textContent: `${conta('sem dono identificado')} sem dono`, dica: 'A resposta do site não disse o dono do post' }),
        ]),
      ] : ['Nenhum post carregado ainda.']));
    }
    atualizarLista(u, ps);
    atualizarCampos(u, ps);
    atualizarValidacao();
    atualizarSeloFila();
  }

  function atualizarSeloFila() {
    if (!el.filaSelo) return;
    const f = lerFila();
    const t = f && f.feitos.length < f.todos.length ? `${f.feitos.length}/${f.todos.length}` : '';
    if (el.filaSelo.textContent !== t) el.filaSelo.textContent = t;
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
    // A meta description traz a bio inteira no fim: '… (@perfil) no Instagram: "bio"'.
    // Só a meta name="description" tem a bio (a og:description não); vale se citar este @.
    const descBio = metaValida ? document.querySelector('meta[name="description"]')?.content || '' : '';
    const bioMeta = descBio.toLowerCase().includes(`(@${u})`) ? descBio.match(/(?:no|on) Instagram:\s*"([\s\S]*)"\s*$/)?.[1] || '' : '';
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
      bio: escolher([api.bio, 'API'], [cap.bio, 'JSON'], [bioMeta.trim(), 'meta']),
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
      nome: d.nome, url: { v: `https://www.instagram.com/${u}/`, f: '' }, site: d.site, bio: d.bio,
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
    const cls = `chip ${pr.periodo ? 'ok' : 'alerta'}`;
    const txtPronto = pr.periodo ? 'pronto' : `${pr.pendencias.length} pendente${pr.pendencias.length > 1 ? 's' : ''}`;
    if (el.pronto.className !== cls || el.pronto.textContent !== txtPronto) {
      el.pronto.className = cls;
      el.pronto.textContent = txtPronto;
      kit.dica(el.pronto, (pr.periodo ? 'Pronto para registrar no Notion.' : `Pendente: ${pr.pendencias.join('; ')}.`) +
        (pr.primeiro ? '\nPrimeiro post definitivo.' : '\nPrimeiro post ainda parcial (use o histórico completo).'));
    }

    // Campos do período: só aparecem com alguma data no filtro.
    el.blocoPeriodo.hidden = !per;
    if (!per) return;
    // Se a grade não está toda carregada e o período começa antes do post mais antigo
    // carregado, pode haver posts do período que ainda não vieram.
    const maisAntigo = ps.length ? diaLocal(ps[0].taken_at) : '';
    const podeFaltar = !periodoCoberto(u, ps) && (!dataDe || !maisAntigo || dataDe <= maisAntigo);
    const parcial = podeFaltar ? ' · parcial' : '';
    const dicaParcial = podeFaltar ? 'Pode haver posts do período ainda não carregados: carregue mais posts.' : '';
    el.avisoPeriodo.textContent = parcial;
    kit.dica(el.avisoPeriodo, dicaParcial);
    const dm = (ts) => new Date(ts * 1000).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    const medicao = per.medidoDe ? (dm(per.medidoDe) === dm(per.medidoAte) ? ` · medidos em ${dm(per.medidoDe)}` : ` · medidos entre ${dm(per.medidoDe)} e ${dm(per.medidoAte)}`) : '';
    el.avisoComentarios.textContent = parcial + (per.semContagem ? ` · ${per.semContagem} sem contagem` : '');
    kit.dica(el.avisoComentarios, [dicaParcial, medicao.replace(' · ', 'Contagens '),
      per.semMedicao ? `${per.semMedicao} sem data de medição (coletados antes desta versão).` : ''].filter(Boolean).join('\n'));
    el.avisoCurtidas.textContent = parcial + (per.semCurtidas ? ` · ${per.semCurtidas} ocultas` : '');
    kit.dica(el.avisoCurtidas, dicaParcial);
    const rotuloPosts = 'Posts';
    const rotuloCom = 'Comentários (soma)';
    if (el.rotulos.n_periodo.textContent !== rotuloPosts) el.rotulos.n_periodo.textContent = rotuloPosts;
    if (el.rotulos.comentarios_periodo.textContent !== rotuloCom) el.rotulos.comentarios_periodo.textContent = rotuloCom;
    const rotuloCurt = 'Curtidas (soma)';
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
  // Período coberto: grade completa ou um post anterior à data "De" que chegou depois da
  // primeira página da grade. Os fixados vêm na primeira página e nem sempre trazem a marca
  // (12/11/2026: Cineplay e Fortalúdica pararam por posts de janeiro e abril fixados sem
  // marca); post antigo na primeira página não prova nada.
  const PRIMEIRA_PAGINA = 12;
  function periodoCoberto(u, ps) {
    const total = totalDe(u);
    if (total != null && ps.length >= total) return true;
    if (!dataDe) return false;
    const ordem = [...ps].sort((a, b) => (a.chegada ?? Infinity) - (b.chegada ?? Infinity));
    const primeira = new Set(ordem.slice(0, PRIMEIRA_PAGINA).map((p) => p.shortcode));
    return ps.some((p) => !p.fixado && diaLocal(p.taken_at) < dataDe && !primeira.has(p.shortcode));
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
    const bio = dadosPerfil(u).bio.v;
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
    el.indiciosSelo.textContent = Object.keys(ind).map((k) => `${ROTULOS_INDICIOS[k].split(' ')[0].toLowerCase()} ${ind[k].length}`).join(' · ');
    el.indicios.replaceChildren(...Object.keys(ind).flatMap((k) => {
      const lista = ind[k];
      const precos = [...new Set(lista.flatMap((x) => x.precos))];
      const cab = criar('p', { className: 'subtitulo' }, [ROTULOS_INDICIOS[k],
        criar('span', { className: `chip ${lista.length ? 'azul' : ''}`, textContent: lista.length ? String(lista.length) : 'nenhum' }),
        precos.length ? criar('span', { className: 'suave', textContent: precos.join(', ') }) : null]);
      const itens = lista.slice(0, 15).map((x) => criar('div', { className: 'item' }, [
        criar('a', { href: x.url, target: '_blank', title: x.texto }, [
          criar('b', { textContent: x.origem === 'bio' ? 'bio' : x.data }),
          criar('span', { textContent: `…${x.trecho}…` }),
        ]),
      ]));
      return [cab, criar('div', { className: 'lista' }, itens)];
    }));
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
    el.listaTitulo.textContent = busca ? `Com "${el.busca.value.trim()}"${periodo}` : `Possíveis eventos${periodo}`;
    el.listaSelo.textContent = busca ? String(lista.length) : `${lista.length}/${ps.length}`;
    el.lista.replaceChildren(...lista.map((p) => {
      const trecho = p.legenda.replace(/\s+/g, ' ').slice(0, 110);
      const val = validacao.get(p.shortcode);
      const bVal = (valor, ico, dica) => {
        const b = kit.botao(ico, '', () => marcarValidacao(p.shortcode, valor), { classe: valor === 'sim' ? 'verde' : 'vermelho', dica });
        b.setAttribute('aria-pressed', String(val === valor));
        return b;
      };
      return criar('div', { className: 'item' }, [
        criar('a', { href: p.url, target: '_blank', title: p.legenda }, [
          criar('b', { textContent: `${dataCurta(p.taken_at)}${p.categorias_evento ? ' · ' + p.categorias_evento : ''}${p.evento === 'possível' ? ' (?)' : ''}` }),
          criar('span', { textContent: trecho + (p.legenda.length > 110 ? '…' : '') }),
        ]),
        criar('div', { className: 'val' }, [bVal('sim', 'check', 'É evento'), bVal('não', 'x-mark', 'Não é evento')]),
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
      ? `Precisão ${pct(apontados)} em ${total} marcados · provável ${pct(grupos['provável'])} · possível ${pct(grupos['possível'])} · não apontados que eram evento ${pct(grupos['não'])}`
      : 'Marque ✓/✗ nos posts para medir a precisão do classificador.';
  }

  function atualizarBotoes() {
    kit.atualizarAcoes(ocupado);
  }

  const CSS_SELOS = `
    .igc-selo{position:absolute;left:4px;bottom:4px;z-index:3;pointer-events:none;
      max-width:calc(100% - 8px);box-sizing:border-box;
      background:rgba(0,0,0,.78);color:#fff;font:600 14px/1.35 system-ui,sans-serif;
      padding:4px 8px;border-radius:6px}
    .igc-selo.igc-evento{background:rgba(196,72,0,.92)}
    .igc-cat{font-size:13px;font-weight:700}`;

  // Complemento do CSS do kit: listas de posts e campos copiáveis.
  const CSS_EXTRA = `
    .item{display:flex;gap:4px;align-items:center;border-radius:8px;padding:1px 4px;flex:none}
    .item:hover{background:var(--sup)}
    .item a{flex:1;min-width:0;color:inherit;text-decoration:none;font-size:12px;padding:4px 0}
    .item b{color:var(--caneta);font-weight:600;display:block}
    .item span{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;color:var(--suave)}
    .val{display:flex;gap:2px} .val .ico{width:26px;height:26px}
    .val .verde[aria-pressed=false],.val .vermelho[aria-pressed=false]{background:transparent;color:var(--suave)}
    .campo{display:grid;grid-template-columns:38% minmax(0,1fr) auto;gap:4px;margin:3px 0;align-items:center}
    .campo .rot{font-size:11.5px;color:var(--suave);line-height:1.25}
    .campo input,.campo textarea{padding:4px 8px;font-size:12.5px}
    .campo textarea{resize:vertical;min-height:0;white-space:pre-wrap}
    .campo .ico{width:28px;height:28px}
    .fonte{font-style:italic;cursor:help}
    .aviso-campo{color:var(--alerta)}`;

  // Chave nova (v2): a rolagem ao abrir um perfil volta a começar desligada, mesmo
  // para quem a tinha ligado; ela atrasava a fila de sementes, que abre perfis.
  const PREF_ROLAR = 'igc-rolar-ao-abrir-v2';
  // Coleta e rolagem automáticas (perfil aberto pelo menu ou "Próximo", e "rolar ao abrir").
  // Desligadas, o perfil só abre; a coleta fica para o botão. A fila não muda: é pedida à mão.
  const PREF_AUTO = 'igc-coleta-automatica';
  let coletaAuto = lerPref(PREF_AUTO, true);
  const PREF_COMPART = 'igc-contar-compartilhados';
  let contarCompartilhados = lerPref(PREF_COMPART, true);

  // ---------- conferência (fidelidade) ----------

  // { codigos, i, coletado: { shortcode: dados no início da conferência }, marcas: { shortcode: marca } }
  const CHAVE_CONF = 'igc-conferencia';
  const confVazia = () => ({ codigos: [], i: 0, coletado: {}, marcas: {} });
  let conf = (() => { try { return JSON.parse(localStorage.getItem(CHAVE_CONF) || 'null') || confVazia(); } catch (_) { return confVazia(); } })();

  function gravarConf() {
    try { localStorage.setItem(CHAVE_CONF, JSON.stringify(conf)); } catch (_) { /* sem armazenamento */ }
    agendarSelos();
    mostrarConferencia();
  }

  // O que foi coletado de cada post fica congelado no início: abrir o post atualiza
  // os dados em memória, e a comparação perderia o sentido.
  function dadosColetados(s) {
    const p = posts.get(s);
    return p ? { perfil: p.perfil, data_hora: dataHora(p.taken_at), curtidas: p.curtidas, comentarios: p.comentarios, tipo: p.tipo, legenda: (p.legenda || '').replace(/\s+/g, ' ').slice(0, 120) } : null;
  }

  function iniciarConferencia() {
    const codigos = [...new Set(el.confCodigos.value.split(/[\s;,]+/)
      .map((t) => (t.match(/\/(?:p|reel)\/([\w-]+)/) || [null, t.trim()])[1]).filter(Boolean))];
    if (!codigos.length) { status('Cole os shortcodes ou links sorteados, um por linha.'); return; }
    if (Object.keys(conf.marcas).length && !confirm('Começar outra conferência apaga as marcas da atual. Exporte antes. Continuar?')) return;
    conf = { codigos, i: 0, coletado: Object.fromEntries(codigos.map((s) => [s, dadosColetados(s)])), marcas: {} };
    const semDados = codigos.filter((s) => !conf.coletado[s]).length;
    gravarConf();
    status(`Conferência com ${codigos.length} posts${semDados ? `; ${semDados} sem dados coletados neste navegador` : ''}.`);
  }

  function moverConferencia(passo) {
    conf.i = Math.max(0, Math.min(conf.codigos.length - 1, conf.i + passo));
    gravarConf();
  }

  function abrirConferido() {
    const s = conf.codigos[conf.i];
    if (s) location.href = `https://www.instagram.com/p/${s}/`;
  }

  function marcarConferencia(resultado) {
    const s = conf.codigos[conf.i];
    if (!s) return;
    const observacao = resultado === 'diverge' ? (prompt('O que diverge? (data, curtidas, comentários, legenda…)') || '') : '';
    const c = conf.coletado[s] || {};
    conf.marcas[s] = {
      shortcode: s, perfil: c.perfil || '', url: `https://www.instagram.com/p/${s}/`, data_coletada: c.data_hora || '',
      curtidas_coletadas: c.curtidas ?? '', comentarios_coletados: c.comentarios ?? '', resultado, observacao, conferido_em: dataHora(Date.now() / 1000),
    };
    if (conf.i < conf.codigos.length - 1) conf.i++;
    gravarConf();
  }

  const COLS_CONF = ['shortcode', 'perfil', 'url', 'data_coletada', 'curtidas_coletadas', 'comentarios_coletados', 'resultado', 'observacao', 'conferido_em'];

  function baixarConferencia() {
    const marcas = Object.values(conf.marcas);
    if (!marcas.length) { status('Nenhum post marcado na conferência.'); return; }
    baixar(`${dataHora(Date.now() / 1000).slice(0, 10)}_instagram_conferencia.csv`, csv(marcas, COLS_CONF), 'text/csv;charset=utf-8');
  }

  function mostrarConferencia() {
    if (!el.confInfo) return;
    const s = conf.codigos[conf.i];
    if (el.confPos) el.confPos.textContent = s ? `${conf.i + 1}/${conf.codigos.length}` : '';
    if (!s) { el.confInfo.textContent = ''; return; }
    const c = conf.coletado[s];
    const m = conf.marcas[s];
    const aberto = location.pathname.includes(`/${s}/`);
    el.confInfo.textContent = `${s}${aberto ? ' · aberto' : ''} · ${Object.keys(conf.marcas).length} marcados\n` +
      (c ? `@${c.perfil} · ${c.data_hora} · ${c.curtidas} curtidas · ${c.comentarios} comentários · ${c.tipo}\n"${c.legenda}"` : 'Sem dados coletados deste post neste navegador.') +
      (m ? `\nMarcado: ${m.resultado}${m.observacao ? ` (${m.observacao})` : ''}` : '');
  }

  const PREF_NUMERO = 'igc-numero-nos-selos';
  let mostrarNumero = lerPref(PREF_NUMERO, false);
  let rolarAoAbrir = lerPref(PREF_ROLAR, false);
  let ultimoAutoRolado = null;

  // Dispara a rolagem uma vez por perfil aberto (abrir um post e voltar não repete).
  function talvezRolarSozinho() {
    const u = perfilAtual();
    if (!coletaAuto || !rolarAoAbrir || !u || u === ultimoAutoRolado || ocupado || filaSnowballAtiva()) return;
    ultimoAutoRolado = u;
    setTimeout(() => { if (perfilAtual() === u && !ocupado) executar(rolarAteOFim); }, 2000);
  }

  // @ de uma lista colada (um por linha; aceita @, link ou nome).
  function lerUsuarios(texto) {
    return [...new Set(texto.split(/\s+/)
      .map((s) => s.replace(/^.*instagram\.com\//, '').replace(/^@/, '').split(/[/?]/)[0].toLowerCase())
      .filter(Boolean))];
  }

  function montarPainel() {
    const { botao, linha, esp, etiqueta, secao, selo, ajuda } = kit;
    const comPerfil = (fn) => () => { const u = perfilAtual(); if (u) fn(u); else status('Abra um perfil primeiro.', 'alerta'); };

    menu = criarMenu();

    // Período (inclusivo nas duas pontas): define o que "Coletar período" busca, os campos
    // do período e o que fica esmaecido na grade.
    const aoMudarData = () => { dataDe = el.de.value; dataAte = el.ate.value; aplicarSelos(); atualizarResumo(); };
    el.de = criar('input', { type: 'date', value: dataDe, 'aria-label': 'De', onchange: aoMudarData });
    el.ate = criar('input', { type: 'date', value: dataAte, 'aria-label': 'Até', onchange: aoMudarData });
    const padrao = PERIODO_PADRAO.map((d) => d.split('-').reverse().join('/')).join(' a ');
    const linhaPeriodo = linha([
      kit.dica(criar('span', { className: 'rotulo' }, [kit.icone('calendar-days')]), 'Período, inclusivo nas duas pontas: vale para a coleta do período, os campos do período e o esmaecer da grade'),
      el.de, criar('span', { className: 'suave', textContent: '→' }), el.ate,
      botao('arrow-path', '', () => { [el.de.value, el.ate.value] = PERIODO_PADRAO; aoMudarData(); }, { classe: 'leve', dica: `Período padrão (${padrao})` }),
      botao('x-mark', '', () => { el.de.value = ''; el.ate.value = ''; aoMudarData(); }, { classe: 'leve', dica: 'Sem período' }),
    ], 'compacta');

    const bApi = botao('arrow-down-tray', 'Coletar período', comPerfil((u) => executar(() => coletarPerfil(u, 'periodo').then(() => concluirPerfil(u, 'periodo')))),
      { classe: 'primario', dica: 'Dados do perfil e posts até a data "De": pela API (2 a 3 pedidos) ou, se ela falhar, rolando a grade. Não chega ao primeiro post.' });
    const bHistorico = botao('clock', '', comPerfil((u) => executar(() => coletarPerfil(u, 'completo').then(() => concluirPerfil(u, 'completo')))),
      { dica: 'Histórico completo pela API, até o primeiro post. Muitos pedidos; continua de onde parou.' });
    kit.botaoParar(() => { parar = true; status('Parando…'); });

    const bRolar = botao('chevron-double-down', '', () => executar(rolarAteOFim), { classe: 'leve', dica: 'Rolar a grade até o fim (sem API)' });
    const bTopo = botao('arrow-up', '', () => { if (rolando) parar = true; window.scrollTo({ top: 0, behavior: 'smooth' }); }, { classe: 'leve', dica: 'Voltar ao topo (para a rolagem)' });
    const bCsv = botao('arrow-down-tray', 'CSV', comPerfil((u) => { exportar([u], u); kit.piscar(bCsv); }), { classe: 'mini', dica: 'CSV de posts e de perfis deste perfil' });
    const bJson = botao('code-bracket', '', comPerfil((u) => {
      baixar(`instagram_${u}.json`, JSON.stringify({ perfil: linhaPerfil(u), posts: postsDe(u).map((p) => ({ ...p, evento_validado: validacao.get(p.shortcode) || '' })) }, null, 2), 'application/json');
      kit.piscar(bJson);
    }), { classe: 'leve', dica: 'JSON com perfil e posts' });

    el.resumo = criar('div', { className: 'info' });

    // ----- dados do perfil (campos copiáveis) -----
    el.campos = {}; el.fontes = {}; el.rotulos = {};
    const campo = (chave, rotulo, extra, linhas = 0) => {
      const entrada = linhas ? criar('textarea', { readOnly: true, rows: linhas, 'aria-label': rotulo })
        : criar('input', { type: 'text', readOnly: true, 'aria-label': rotulo });
      el.campos[chave] = entrada;
      el.fontes[chave] = criar('span', { className: 'fonte' });
      el.rotulos[chave] = document.createTextNode(rotulo);
      const bCopiar = botao('document-duplicate', '', () => kit.copiar(entrada.value, bCopiar), { classe: 'leve', dica: 'Copiar' });
      return criar('div', { className: 'campo' }, [
        criar('span', { className: 'rot' }, [el.rotulos[chave], el.fontes[chave], extra || null]), entrada, bCopiar]);
    };
    el.avisoPrimeiro = criar('span', { className: 'aviso-campo' });
    el.avisoNome = criar('span', { className: 'aviso-campo' });
    el.avisoPeriodo = criar('span', { className: 'aviso-campo' });
    el.avisoComentarios = criar('span', { className: 'aviso-campo' });
    el.avisoCurtidas = criar('span', { className: 'aviso-campo' });
    el.pronto = criar('span', { className: 'chip' });
    el.foraPeriodo = criar('p', { className: 'vazio' });
    const tagCompart = etiqueta('compartilhados', (v) => { contarCompartilhados = v; gravarPref(PREF_COMPART, v); atualizarResumo(); },
      { ligada: contarCompartilhados, dica: 'Conta também colaborações de outro dono e posts sem dono identificado (contagem não exclusiva)' });
    el.blocoPeriodo = criar('div', { hidden: true }, [
      criar('div', { className: 'subtitulo' }, ['No período', esp(), tagCompart]),
      campo('n_periodo', '', el.avisoPeriodo),
      campo('comentarios_periodo', '', el.avisoComentarios),
      campo('curtidas_periodo', '', el.avisoCurtidas),
      el.foraPeriodo,
    ]);
    const secPerfil = secao('perfil', ['Dados do perfil', el.pronto], [
      campo('nome', 'Nome do estabelecimento', el.avisoNome),
      campo('primeiro', 'Primeiro post', el.avisoPrimeiro),
      campo('seguidores', 'Seguidores'),
      campo('total', 'Posts declarados no perfil'),
      campo('site', 'Site / Linktree'),
      campo('bio', 'Bio', null, 3),
      campo('url', 'URL do Instagram'),
      el.blocoPeriodo,
    ]);

    // ----- grade -----
    el.busca = criar('input', { type: 'search', placeholder: 'Buscar na legenda (torneio, quiz…)',
      oninput: (e) => { busca = semAcento(e.target.value.trim()); aplicarSelos(); atualizarResumo(); } });
    const secGrade = secao('grade', ['Grade'], [
      criar('div', { className: 'tags' }, [
        etiqueta('selos', (v) => { mostrarSelos = v; aplicarSelos(); }, { ligada: mostrarSelos, ico: 'eye', dica: 'Data, curtidas e comentários sobre cada post' }),
        etiqueta('nº', (v) => { mostrarNumero = v; gravarPref(PREF_NUMERO, v); aplicarSelos(); }, { ligada: mostrarNumero, ico: 'hashtag', dica: 'Número do post nos selos' }),
        etiqueta('só eventos', (v) => { soEventos = v; aplicarSelos(); atualizarResumo(); }, { ligada: soEventos, dica: 'Esmaece os posts que não são possíveis eventos' }),
        etiqueta('rolar ao abrir', (v) => { rolarAoAbrir = v; gravarPref(PREF_ROLAR, v); }, { ligada: rolarAoAbrir, ico: 'chevron-double-down', dica: 'Rola a grade até o fim ao abrir um perfil' }),
      ]),
      criar('label', { className: 'busca' }, [kit.icone('magnifying-glass'), el.busca]),
    ]);

    // ----- eventos e indícios -----
    el.listaTitulo = criar('span');
    el.listaSelo = selo();
    el.lista = criar('div', { className: 'lista' });
    el.validacao = criar('p', { className: 'vazio' });
    const secEventos = secao('eventos', [el.listaTitulo, el.listaSelo], [el.lista, el.validacao]);
    el.indiciosSelo = selo();
    el.indicios = criar('div');
    const secIndicios = secao('indicios', ['Indícios', ajuda('Termos de aluguel, venda e cobrança na bio e nas legendas carregadas. Indício não é prova: abra o trecho.'), el.indiciosSelo], [el.indicios]);

    // ----- fila -----
    el.fila = criar('textarea', { placeholder: 'Um @perfil ou link por linha' });
    el.modoFila = kit.pills([['periodo', 'Período', 'Rápido: só os posts do período'], ['completo', 'Histórico', 'Até o primeiro post; muitos pedidos']],
      kit.ler('igc-modo-fila', 'periodo'), (v) => kit.gravar('igc-modo-fila', v));
    const bFila = botao('play', 'Coletar fila', () => {
      const us = lerUsuarios(el.fila.value);
      if (us.length) executar(() => coletarFila(us, el.modoFila.valor)); else status('Cole ao menos um @ na fila.', 'alerta');
    }, { classe: 'mini', dica: 'Coleta em sequência, com pausa entre perfis. Com a mesma lista, continua dos que faltam.' });
    el.filaSelo = selo('', 'roxo');
    const secFila = secao('fila', ['Fila', el.filaSelo], [el.fila, linha([el.modoFila, bFila])]);

    // ----- conferência -----
    el.confCodigos = criar('textarea', { placeholder: 'Shortcodes ou links sorteados, um por linha', value: conf.codigos.join('\n') });
    el.confInfo = criar('div', { className: 'info' });
    el.confPos = criar('span', { className: 'pos' });
    const secConf = secao('conferencia', ['Conferência'], [
      el.confCodigos,
      linha([botao('play', 'Começar', iniciarConferencia, { classe: 'mini' }), esp(),
        botao('chevron-left', '', () => moverConferencia(-1), { classe: 'leve', dica: 'Anterior' }), el.confPos,
        botao('chevron-right', '', () => moverConferencia(1), { classe: 'leve', dica: 'Próximo' })]),
      el.confInfo,
      linha([botao('arrow-top-right-on-square', '', abrirConferido, { dica: 'Abrir o post' }), esp(),
        botao('check', '', () => marcarConferencia('confere'), { classe: 'verde', dica: 'Confere' }),
        botao('x-mark', '', () => marcarConferencia('diverge'), { classe: 'vermelho', dica: 'Diverge' }),
        botao('document-check', '', baixarConferencia, { dica: 'CSV da conferência' })]),
    ], mostrarConferencia);

    const bApagar = kit.botaoPerigo('trash', 'Apagar dados salvos', apagarSalvos, { classe: 'mini', dica: 'Apaga posts, perfis e marcações guardados neste navegador' });
    kit.acoes = [bApi, bHistorico, bRolar, bCsv, bJson, bFila];

    kit.montar({
      nome: 'Coletor IG', autobaixar: true, css: CSS_EXTRA, largura: 350,
      aposAuto: [kit.alternaIcone({ ico: 'bolt', icoDesligado: 'bolt-slash', rotulo: 'Coleta e rolagem automáticas ao abrir um perfil', ligado: coletaAuto,
        aoMudar: (v) => { coletaAuto = v; gravarPref(PREF_AUTO, v); status(v ? 'Coleta automática ligada.' : 'Coleta automática desligada: o perfil só abre.'); } })],
      filhos: [
        menu.caixa,
        linhaPeriodo,
        linha([bApi, bHistorico, kit.el.parar]),
        kit.barra('coleta'), kit.barra('fila'),
        kit.el.status = criar('div', { className: 'status', textContent: 'Escolha um perfil no seletor ou abra um no Instagram.' }),
        el.resumo,
        linha([kit.rotulo('Exportar'), bCsv, bJson, esp(), bRolar, bTopo]),
        secPerfil, secGrade, secEventos, secIndicios, secFila, secConf,
        linha([esp(), bApagar]),
      ],
    });
    el.painel = kit.el.painel;
    menu.rotular();
    atualizarBotoes();
  }

  // O React do Instagram pode refazer o <body> ao hidratar a página e apagar o que
  // foi inserido antes: o kit prende o painel ao <html> e o repõe se sumir.
  function garantirPainel() {
    const raiz = document.documentElement;
    if (!raiz) return;
    if (!document.getElementById('igc-estilo-selos')) {
      (document.head || raiz).appendChild(criar('style', { id: 'igc-estilo-selos', textContent: CSS_SELOS }));
    }
    if (!el.painel) montarPainel();
    kit.garantir();
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
        mostrarConferencia();
        talvezRolarSozinho();
        rotularPerfis();
      } catch (e) { console.error('[Coletor IG]', e); }
    }, 1000);
    garantirPainel();
    atualizarResumo();
    carregarSalvos().then(() => setTimeout(() => coletarAoAbrir().catch((e) => status(`Erro na coleta: ${e.message}`)), 2500));
    setInterval(salvar, 3000);
    addEventListener('pagehide', salvar);
    // Fila interrompida numa sessão anterior: repõe a lista para continuar.
    const fila = lerFila();
    if (fila && fila.feitos.length < fila.todos.length) {
      el.fila.value = fila.todos.join('\n');
      el.modoFila.valor = fila.modo || 'completo';
      status(`Fila interrompida: ${fila.feitos.length}/${fila.todos.length} perfis coletados. "Coletar fila" continua dos que faltam.`);
    }
    new MutationObserver(agendarSelos).observe(document.documentElement, { childList: true, subtree: true });
    agendarSelos();
  }

  console.info('[Coletor IG] carregado');
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
  else iniciar();
})();
