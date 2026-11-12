// ==UserScript==
// @name         Snowball do Instagram (TCC Luderia)
// @namespace    tcc-luderia
// @version      2026.11.12-1
// @description  Captura a lista "seguindo" de perfis-semente (snowball), um por vez ou em fila, e baixa um CSV por perfil.
// @match        https://www.instagram.com/*
// @run-at       document-start
// @grant        none
// ==/UserScript==

/*
 * Uso pessoal, para o snowball do Bloco B1 (achar luderias que as luderias seguem).
 * Separado do "Coletor de perfis do Instagram" em 15/10/2026; os dois rodam juntos
 * na mesma página, cada um com o próprio painel e o próprio armazenamento.
 *
 * Como funciona:
 *  - O script não faz pedido próprio: lê as respostas que a página recebe enquanto a
 *    lista "seguindo" rola (/friendships/<id>/following/) e, como reserva, os @
 *    visíveis na lista, antes do bloco "Sugestões para você" (contas que o perfil
 *    não segue). A resposta vai para a semente pelo id no endereço do pedido.
 *  - Um perfil: abra a lista "seguindo" (clique em "seguindo" no perfil) e use
 *    "Rolar lista aberta". A rolagem para ao alcançar o total declarado ou quando a
 *    lista para de crescer; com "Download automático", baixa o CSV.
 *  - Fila: cole as sementes (um @ ou link por linha) e clique em "Coletar fila".
 *    Para cada semente: abre o perfil, abre a lista (link "seguindo"; se não achar,
 *    o texto "seguindo" do cabeçalho; se ainda assim não abrir, o endereço
 *    /<perfil>/following/), rola, baixa e pausa antes da próxima. Abrir um perfil
 *    recarrega a página; a fila fica no localStorage e continua sozinha.
 *  - Menu das sementes (mesmo padrão do coletor de preços): o seletor do topo traz as 11
 *    sementes da rodada 1 e as 41 próximas, por capital, com ✓ coletada, ◐ capturada em
 *    parte, ! sem lista e ○ falta. Escolher uma roda a fila só com ela (abre o perfil, a
 *    lista, rola e baixa); "Próximo" faz o mesmo com a próxima que falta (primeiro no mesmo
 *    grupo); "Coletada"/"Desfazer" marca à mão; "Só as que faltam" esconde as prontas.
 *  - "Parar" desliga a fila na hora, também durante a troca de página: a próxima
 *    carga não retoma. "Coletar fila" com a mesma lista continua de onde parou.
 *    "Limpar fila" para e apaga a fila salva. O campo da fila só é preenchido com a
 *    fila salva quando está vazio, e pode ser editado à vontade.
 *  - CSV: AAAA-MM-DD_<perfil>_instagram_seguindo.csv (";" e UTF-8 com BOM). A lista
 *    traz @ de pessoas físicas: o CSV fica em _dados-brutos, fora do git
 *    (ver B1-b_instagram_seguindo.py).
 *  - Listas capturadas ficam salvas no navegador (IndexedDB "igs-snowball"). Na
 *    primeira carga, o script copia as listas e a fila que o coletor antigo guardou.
 */

(function () {
  'use strict';

  const PAUSA_PERFIL = [45000, 90000]; // ms entre sementes da fila
  const ESPERA_LINK = 15000;           // ms à espera do link "seguindo" no perfil
  const ESPERA_LISTA = 10000;          // ms à espera da lista depois do clique
  const RESERVADOS = new Set(['explore', 'p', 'reel', 'reels', 'direct', 'accounts', 'stories', 'about', 'legal', 'developer', 'web']);
  const RE_SEGUINDO_URL = /\/friendships\/(\d+)\/following\//;
  const RE_SUGESTOES = /^(sugest(ões|oes) para voc(ê|e)|suggested for you|sugerido para voc(ê|e))$/i;
  const RE_TITULO_SEGUINDO = /^(seguindo|following)$/i;
  // Contador do cabeçalho do perfil: "312 seguindo", "seguindo 312", "1.234 following".
  const RE_CONTADOR_SEGUINDO = /^(?:[\d.,]+\s*(?:mil|k|mi|m)?\s*)?(seguindo|following)(?:\s*[\d.,]+\s*(?:mil|k|mi|m)?)?$/i;
  const CHAVE_FILA = 'igs-fila-seguindo';
  const CHAVE_FILA_ANTIGA = 'igc-fila-seguindo';
  const CHAVE_MIGRADO = 'igs-migrado-do-coletor';

  const seguindo = new Map();     // semente -> Map(@ seguido -> dados)
  const seguindoMeta = new Map(); // semente -> { inicio, fim, fim_rolagem, baixado }
  const ids = new Map();          // id numérico -> @
  const declarados = new Map();   // @ -> nº de contas que diz seguir
  let sujo = false;
  let parar = false;
  let ocupado = false;

  // ---------- utilidades ----------

  const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
  const sortear = ([a, b]) => a + Math.random() * (b - a);

  function dataHora(ts) {
    if (!ts) return '';
    const d = new Date(ts * 1000);
    const p = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
  }
  const agora = () => dataHora(Date.now() / 1000);

  function perfilAtual() {
    const m = location.pathname.match(/^\/([A-Za-z0-9._]+)\/?$/);
    return m && !RESERVADOS.has(m[1].toLowerCase()) ? m[1].toLowerCase() : null;
  }

  // @ de uma lista colada (um por linha; aceita @, link ou nome).
  function lerUsuarios(texto) {
    return [...new Set(texto.split(/\s+/)
      .map((s) => s.replace(/^.*instagram\.com\//, '').replace(/^@/, '').split(/[/?]/)[0].toLowerCase())
      .filter((s) => s && !RESERVADOS.has(s)))];
  }

  function lerPref(chave, padrao) {
    try { const v = localStorage.getItem(chave); return v == null ? padrao : v === '1'; } catch (_) { return padrao; }
  }
  function gravarPref(chave, valor) {
    try { localStorage.setItem(chave, valor ? '1' : '0'); } catch (_) { /* ignora */ }
  }

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
    (document.body || document.documentElement).appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 2000);
  }

  // ---------- captura das respostas da página ----------

  // Objetos de usuário: guardam o id (para achar a semente do pedido) e o nº de
  // contas que o usuário diz seguir.
  function capturar(dado, prof = 0) {
    if (!dado || typeof dado !== 'object' || prof > 40) return;
    if (Array.isArray(dado)) { for (const x of dado) capturar(x, prof + 1); return; }
    if (typeof dado.username === 'string') {
      const u = dado.username.toLowerCase();
      const id = String(dado.pk ?? dado.pk_id ?? dado.id ?? '');
      if (/^\d+$/.test(id) && ids.get(id) !== u) { ids.set(id, u); sujo = true; }
      const n = dado.edge_follow?.count ?? dado.following_count;
      if (typeof n === 'number' && declarados.get(u) !== n) { declarados.set(u, n); sujo = true; }
    }
    for (const k in dado) {
      const v = dado[k];
      if (v && typeof v === 'object') capturar(v, prof + 1);
    }
  }

  function capturarTexto(t) {
    if (!t || !/"username"/.test(t) || !/following_count|edge_follow|"pk"/.test(t)) return;
    try { capturar(JSON.parse(t.replace(/^for \(;;\);/, ''))); } catch (_) { /* não é JSON */ }
  }

  const fetchOriginal = window.fetch;
  window.fetch = async function (...args) {
    const resp = await fetchOriginal.apply(this, args);
    try {
      const url = String(args[0]?.url || args[0]);
      if (RE_SEGUINDO_URL.test(url)) resp.clone().json().then((j) => ingerirSeguindo(j, url), () => {});
      else if (/graphql|\/api\/v1\//.test(url)) resp.clone().text().then(capturarTexto, () => {});
    } catch (_) { /* ignora */ }
    return resp;
  };

  const xhrSend = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.send = function (...args) {
    this.addEventListener('load', function () {
      try {
        const json = this.responseType === 'json';
        if (RE_SEGUINDO_URL.test(this.responseURL || '')) {
          ingerirSeguindo(json ? this.response : JSON.parse(this.responseText), this.responseURL);
        } else if (json) capturar(this.response);
        else if (this.responseType === '' || this.responseType === 'text') capturarTexto(this.responseText);
      } catch (_) { /* ignora */ }
    });
    return xhrSend.apply(this, args);
  };

  function lerDadosEmbutidos() {
    for (const s of document.querySelectorAll('script[type="application/json"]')) capturarTexto(s.textContent);
  }

  // ---------- lista "seguindo" ----------

  // Diálogo cujo título é "Seguindo". No diálogo de seguidores, "Seguindo" também
  // aparece, mas só nos botões das linhas; por isso botões não contam.
  function dialogoSeguindoAberto() {
    for (const dlg of document.querySelectorAll('div[role="dialog"]')) {
      const titulo = [...dlg.querySelectorAll('h1, h2, div, span')].find((n) => n.childElementCount === 0
        && RE_TITULO_SEGUINDO.test(n.textContent.trim()) && !n.closest('button, [role="button"], a'));
      if (titulo) return dlg;
    }
    return null;
  }

  // Semente: pelo endereço /<perfil>/following/ ou, com o diálogo "Seguindo" aberto
  // sobre o perfil, pelo perfil da página.
  function sementeAtual() {
    const m = location.pathname.match(/^\/([A-Za-z0-9._]+)\/following\/?$/);
    if (m && !RESERVADOS.has(m[1].toLowerCase())) return m[1].toLowerCase();
    return dialogoSeguindoAberto() ? perfilAtual() : null;
  }

  function registrarSeguido(sem, u, fonte) {
    const nome = String(u.username || '').toLowerCase();
    if (!nome || nome === sem) return;
    let m = seguindo.get(sem);
    if (!m) { m = new Map(); seguindo.set(sem, m); }
    const velho = m.get(nome);
    // A resposta da página (api) vale mais que a leitura da tela (dom).
    if (velho && (velho.fonte === 'api' || fonte === 'dom')) return;
    m.set(nome, {
      nome: typeof u.full_name === 'string' ? u.full_name : (velho?.nome || ''),
      verificado: u.is_verified === true ? 'sim' : u.is_verified === false ? 'não' : '',
      privado: u.is_private === true ? 'sim' : u.is_private === false ? 'não' : '',
      ordem: velho?.ordem ?? m.size + 1,
      fonte,
    });
    const meta = seguindoMeta.get(sem) || { inicio: agora() };
    meta.fim = agora();
    seguindoMeta.set(sem, meta);
    sujo = true;
  }

  function sementeDoPedido(url) {
    const id = String(url || '').match(RE_SEGUINDO_URL)?.[1];
    return (id && ids.get(id)) || sementeAtual();
  }

  function ingerirSeguindo(dado, url = '') {
    if (dado && typeof dado === 'object') capturar(dado);
    const sem = sementeDoPedido(url);
    if (!sem || !dado || !Array.isArray(dado.users)) return;
    for (const u of dado.users) if (u && typeof u.username === 'string') registrarSeguido(sem, u, 'api');
    mostrar();
  }

  // Lista aberta: o diálogo ou, sem diálogo (lista em página cheia), a página.
  function containerLista() {
    if (!sementeAtual()) return null;
    return dialogoSeguindoAberto() || document.querySelector('div[role="dialog"]') || document.querySelector('main') || document.body;
  }

  // Reserva: @ visíveis na lista, parando no bloco "Sugestões para você".
  function lerSeguindoDom() {
    const sem = sementeAtual();
    const lista = containerLista();
    if (!sem || !lista) return;
    const corte = [...lista.querySelectorAll('span, h2, h3, div')].find((n) => n.childElementCount === 0 && RE_SUGESTOES.test(n.textContent.trim()));
    for (const a of lista.querySelectorAll('a[href^="/"]')) {
      if (corte && (corte.compareDocumentPosition(a) & Node.DOCUMENT_POSITION_FOLLOWING)) break;
      const m = a.getAttribute('href').match(/^\/([A-Za-z0-9._]+)\/?$/);
      if (m && !RESERVADOS.has(m[1].toLowerCase())) registrarSeguido(sem, { username: m[1] }, 'dom');
    }
  }

  // Elemento que rola a lista: o maior com rolagem própria dentro da lista; sem
  // ele, a página.
  function areaRolavel(lista) {
    const cands = [...lista.querySelectorAll('div')].filter((d) => d.scrollHeight > d.clientHeight + 20
      && /(auto|scroll)/.test(getComputedStyle(d).overflowY));
    cands.sort((a, b) => b.scrollHeight - a.scrollHeight);
    return cands[0] || document.scrollingElement;
  }

  const declaradoSeguindo = (sem) => Number(declarados.get(sem)) || 0;

  // Rola até a lista parar de crescer: 8 voltas sem conta nova, ou 2 depois de
  // alcançar o total declarado. Devolve true se chegou ao fim sem interrupção.
  async function rolarSeguindo(baixarNoFim = autoBaixar) {
    const sem = sementeAtual();
    if (!sem) { status('Abra a lista "seguindo" de um perfil (clique em "seguindo" no perfil).'); return false; }
    let semMudanca = 0, n = -1, voltas = 0;
    const limite = () => { const dec = declaradoSeguindo(sem); return dec && n >= dec ? 2 : 8; };
    while (!parar && semMudanca < limite() && sementeAtual() === sem) {
      const lista = containerLista();
      const area = lista && areaRolavel(lista);
      if (area) area.scrollTop = area.scrollHeight;
      await esperar(sortear([1500, 3000]));
      lerSeguindoDom();
      const atual = seguindo.get(sem)?.size || 0;
      semMudanca = atual === n ? semMudanca + 1 : 0;
      n = atual;
      // Pausa longa de vez em quando: a página pede 12 contas por vez.
      if (++voltas % 25 === 0) await esperarContando(sortear([20000, 40000]), `@${sem}: ${atual} capturados; pausa curta…`);
      mostrar();
    }
    const completo = !parar && sementeAtual() === sem;
    const total = seguindo.get(sem)?.size || 0;
    const dec = declaradoSeguindo(sem);
    status(`@${sem}: ${total}${dec ? ` de ${dec}` : ''} contas capturadas${completo ? '' : ' (rolagem interrompida)'}.`);
    if (completo && total) {
      const meta = seguindoMeta.get(sem) || {};
      meta.fim_rolagem = agora();
      seguindoMeta.set(sem, meta);
      sujo = true;
      if (baixarNoFim) baixarSeguindo(sem);
    }
    return completo;
  }

  const COLS_SEGUINDO = ['perfil_semente', 'seguido', 'nome', 'verificado', 'privado', 'ordem', 'fonte',
    'n_seguindo_declarado', 'n_capturados', 'captura_de', 'captura_ate'];

  function linhasSeguindo(sem) {
    const m = seguindo.get(sem) || new Map();
    const meta = seguindoMeta.get(sem) || {};
    const declarado = declaradoSeguindo(sem) || '';
    return [...m].map(([u, d]) => ({
      perfil_semente: sem, seguido: u, nome: d.nome, verificado: d.verificado, privado: d.privado,
      ordem: d.ordem, fonte: d.fonte, n_seguindo_declarado: declarado, n_capturados: m.size,
      captura_de: meta.inicio || '', captura_ate: meta.fim || '',
    }));
  }

  function baixarSeguindo(sem, hoje = agora().slice(0, 10)) {
    baixar(`${hoje}_${sem}_instagram_seguindo.csv`, csv(linhasSeguindo(sem), COLS_SEGUINDO), 'text/csv;charset=utf-8');
    const meta = seguindoMeta.get(sem) || {};
    meta.baixado = agora();
    seguindoMeta.set(sem, meta);
    sujo = true;
  }

  function ultimaSemente() {
    return [...seguindoMeta].sort((a, b) => String(b[1].fim).localeCompare(String(a[1].fim)))[0]?.[0] || null;
  }

  function exportar(todas) {
    const hoje = agora().slice(0, 10);
    const sementes = todas ? [...seguindo.keys()] : [sementeAtual() || ultimaSemente()].filter(Boolean);
    if (!sementes.length) { status('Nenhuma lista "seguindo" capturada.'); return; }
    for (const sem of sementes) baixarSeguindo(sem, hoje);
    status(`CSV de seguindo: ${sementes.length} perfil(is).`);
  }

  // ---------- abrir a lista "seguindo" de um perfil ----------

  function caminho(a) {
    try { return new URL(a.getAttribute('href'), location.origin).pathname.toLowerCase().replace(/\/?$/, '/'); } catch (_) { return ''; }
  }

  // 1º: link para /<perfil>/following/ (relativo ou absoluto, com ou sem parâmetros).
  function linkSeguindo(u) {
    return [...document.querySelectorAll('a[href]')].find((a) => caminho(a) === `/${u}/following/`) || null;
  }

  // 2º: o contador "N seguindo" do cabeçalho do perfil, seja qual for a marcação.
  function contadorSeguindo() {
    const raiz = document.querySelector('header') || document.querySelector('main');
    if (!raiz) return null;
    for (const n of raiz.querySelectorAll('a, button, [role="link"], [role="button"], li, span, div')) {
      const t = n.textContent.replace(/\s+/g, ' ').trim();
      if (t.length > 40 || !RE_CONTADOR_SEGUINDO.test(t)) continue;
      return n.closest('a, button, [role="link"], [role="button"]') || n;
    }
    return null;
  }

  async function esperarAte(cond, ms) {
    const fim = Date.now() + ms;
    while (Date.now() < fim) {
      if (parar) throw new Error('interrompido');
      const r = cond();
      if (r) return r;
      await esperar(500);
    }
    return null;
  }

  async function esperarContando(ms, texto) {
    const fim = Date.now() + ms;
    while (Date.now() < fim) {
      if (parar) throw new Error('interrompido');
      const s = Math.ceil((fim - Date.now()) / 1000);
      status(`${texto} ${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`);
      await esperar(1000);
    }
  }

  // Abre a lista do perfil aberto. Devolve 'aberta', 'navegando' (foi para o
  // endereço /<perfil>/following/; a página recarrega) ou o motivo da falha.
  async function abrirLista(u, f, pos) {
    if (sementeAtual() === u) return 'aberta';
    status(`Fila ${pos}: @${u}, procurando "seguindo" no perfil…`);
    const alvo = await esperarAte(() => linkSeguindo(u) || contadorSeguindo(), ESPERA_LINK);
    if (alvo) {
      if (declaradoSeguindo(u) === 0 && declarados.has(u)) return 'não segue ninguém';
      console.info('[Snowball IG] clicando em', alvo.tagName, alvo.getAttribute?.('href') || alvo.textContent.trim());
      alvo.click();
      if (await esperarAte(() => sementeAtual() === u, ESPERA_LISTA)) return 'aberta';
    }
    // Reserva: o endereço da lista. Uma vez por semente, para não entrar em laço.
    f.tentativas = f.tentativas || {};
    if (!f.tentativas[u]) {
      f.tentativas[u] = 1;
      gravarFila(f);
      status(`Fila ${pos}: @${u}, abrindo /${u}/following/ direto…`);
      location.href = `https://www.instagram.com/${u}/following/`;
      return 'navegando';
    }
    return alvo ? 'a lista não abriu depois do clique nem pelo endereço' : 'sem "seguindo" no perfil: privado, inexistente ou página não carregou';
  }

  // ---------- fila de sementes ----------

  function lerFila() {
    try { return JSON.parse(localStorage.getItem(CHAVE_FILA) || 'null'); } catch (_) { return null; }
  }

  function gravarFila(f) {
    try { f ? localStorage.setItem(CHAVE_FILA, JSON.stringify(f)) : localStorage.removeItem(CHAVE_FILA); } catch (_) { /* ignora */ }
    mostrar();
  }

  const pendentes = (f) => f.todos.filter((u) => !f.feitos.includes(u) && !(u in f.falhas));

  function iniciarFila(usuarios) {
    const salva = lerFila();
    const mesma = salva && salva.todos.join(' ') === usuarios.join(' ');
    // Mesma lista: continua das que faltam e tenta de novo as que falharam.
    const f = mesma ? { ...salva, falhas: {}, tentativas: {} } : { todos: usuarios, feitos: [], falhas: {}, tentativas: {} };
    for (const u of usuarios) if (!f.feitos.includes(u) && seguindoMeta.get(u)?.fim_rolagem && seguindoMeta.get(u)?.baixado) f.feitos.push(u);
    f.ativa = true;
    gravarFila(f);
    executar(rodarFila);
  }

  // Desliga a fila no armazenamento antes de tudo: se a página estiver trocando
  // de perfil, a próxima carga já não retoma.
  function pararFila() {
    parar = true;
    const f = lerFila();
    if (f && f.ativa) { f.ativa = false; gravarFila(f); }
    status('Parado. "Coletar fila" com a mesma lista continua de onde parou.');
    atualizarBotoes();
  }

  function limparFila() {
    pararFila();
    gravarFila(null);
    if (el.fila) el.fila.value = '';
    status('Fila apagada.');
  }

  async function rodarFila() {
    for (;;) {
      const f = lerFila();
      if (!f || !f.ativa) return;
      const pend = pendentes(f);
      if (!pend.length) {
        f.ativa = false;
        gravarFila(f);
        status(`Fila concluída: ${f.feitos.length} listas; ${Object.keys(f.falhas).length} sem lista.`);
        return;
      }
      const u = pend[0];
      const pos = `${f.todos.length - pend.length + 1}/${f.todos.length}`;
      const falhar = (motivo) => { f.falhas[u] = motivo; gravarFila(f); status(`Fila ${pos}: @${u} pulado (${motivo}).`); };
      if (sementeAtual() !== u && perfilAtual() !== u) {
        status(`Fila ${pos}: abrindo @${u}…`);
        location.href = `https://www.instagram.com/${u}/`;
        await esperarAte(() => false, 60000); // a página recarrega antes disso
        return;
      }
      const r = await abrirLista(u, f, pos);
      if (r === 'navegando') { await esperarAte(() => false, 60000); return; }
      if (r !== 'aberta') { falhar(r); continue; }
      await esperar(sortear([1500, 3000]));
      status(`Fila ${pos}: @${u}, rolando a lista…`);
      const ok = await rolarSeguindo(true);
      if (parar) throw new Error('interrompido');
      if (!ok) { falhar('a lista fechou durante a rolagem'); continue; }
      const g = lerFila();
      if (!g || !g.ativa) return;
      if (!g.feitos.includes(u)) g.feitos.push(u);
      gravarFila(g);
      if (pendentes(g).length) await esperarContando(sortear(PAUSA_PERFIL), `@${u} pronto (${pos}). Próxima lista em`);
    }
  }

  // ---------- menu das sementes ----------
  // Mesmo padrão do coletor de preços (B5): seletor com as sementes, marcadas como coletadas;
  // escolher uma abre o perfil, abre a lista "seguindo", rola e baixa (uma fila de uma
  // semente); "Próximo" faz o mesmo com a próxima que falta. Sementes: as 11 da rodada 1
  // (redes_sociais/snowball/B1_snowball_sementes.csv) e as 41 próximas, por capital
  // (B1_snowball_proximas_sementes.csv). [perfil, estabelecimento, grupo]
  const SEMENTES = [
    ["alcapaojogos", "", "Rodada 1"],
    ["arainhadosdados", "", "Rodada 1"],
    ["balboashobbygames", "", "Rodada 1"],
    ["flowg4mes", "", "Rodada 1"],
    ["fortaludica", "", "Rodada 1"],
    ["grutabsb", "", "Rodada 1"],
    ["jogasampa", "", "Rodada 1"],
    ["lojaredjogos", "", "Rodada 1"],
    ["ludotecabgc", "", "Rodada 1"],
    ["ludotecasidequest", "", "Rodada 1"],
    ["paladinohobbies", "", "Rodada 1"],
    ["garagemdonerd", "Garagem do Nerd", "Belo Horizonte"],
    ["ccg_floripa", "CCG Floripa", "Florianópolis"],
    ["paladinsgames", "Paladins Game Store", "Goiânia"],
    ["arcadeapub", "Arcadea Gaming Pub", "Porto Alegre"],
    ["nalaland.jogos", "Nala Land - Bar de Jogos de Tabuleiro em Recife", "Recife"],
    ["saojogue", "São Jogue - Bela Vista", "Salvador"],
    ["cafegeekvv", "Café Geek Cafeteria e Ludoteca", "Vitória"],
    ["dominariacg", "Dominaria Cards & Games", "Fortaleza"],
    ["gob.ludobar", "Game Of Boards", "Rio de Janeiro"],
    ["joyjoycafe", "Joyjoy Café", "Curitiba"],
    ["encounter.bg", "Encounter | Jogos de Tabuleiro | Board Games", "São Paulo"],
    ["insidegamestore", "Inside Games", "Brasília"],
    ["ludocafebh", "LudoCafé", "Belo Horizonte"],
    ["chefonplay", "Chef on Play", "Florianópolis"],
    ["ilusoesindustriais", "Ilusões Industriais", "Porto Alegre"],
    ["machadogames", "Machado Games", "Vitória"],
    ["luderiacariocajogos", "Luderia Carioca", "Rio de Janeiro"],
    ["boardzgamepub", "BoardZ Game Pub", "Curitiba"],
    ["covilgb", "Covil Game Bar", "São Paulo"],
    ["asgardbrasilia", "Loja de Jogos - Asgard", "Brasília"],
    ["shelfbar", "Shelf Bar e Jogos", "Belo Horizonte"],
    ["cineplay_sc", "Cineplay- Restaurante e Jogos", "Florianópolis"],
    ["magicstorebrasil", "Magic Store Brazil", "Rio de Janeiro"],
    ["vilacelta", "Vila Celta Hobby Store - Jogos e Café", "Curitiba"],
    ["bodogami", "Bodogami Restaurante e Cafeteria", "São Paulo"],
    ["utopiagamesbr", "Utopia Games & Food", "Brasília"],
    ["comdadobar", "Comdado Bar e Jogos", "Belo Horizonte"],
    ["tavernagamehouse", "Taverna Game House", "Curitiba"],
    ["bravojogos", "Bravo Jogos", "São Paulo"],
    ["ludusluderia", "Ludus Luderia", "São Paulo"],
    ["pittasboardgames", "Pitta's Board Games", "São Paulo"],
    ["playeasyjogos", "Play Easy", "São Paulo"],
    ["xplaceoficial", "XPlace", "São Paulo"],
    ["coletivogeekbr", "Coletivo Geek", "São Paulo"],
    ["lojaplacegames", "Place Games", "São Paulo"],
    ["castelosbareboardgames", "Castelos Bar & Boardgames", "São Paulo"],
    ["dungeongames.oficial", "Dungeon Games Store", "São Paulo"],
    ["omniverselivraria", "OMNIVERSE", "São Paulo"],
    ["aarenabg", "Arena BG | Jogos de Tabuleiro | Hamburgueria", "São Paulo"],
    ["cartolaluderia", "Cartola Luderia Bar", "São Paulo"],
    ["fanhourbr", "Fan Hour Games and Burgers", "São Paulo"],
  ].map(([u, nome, grupo]) => ({ u, nome, grupo }));
  const CHAVE_ALVO = 'igs-alvo';
  const CHAVE_MARCAS = 'igs-alvos-marcas'; // { perfil: true (dada por coletada) | false (desfeita) }
  const CHAVE_SO_FALTAM = 'igs-alvos-so-faltam';
  const lerLs = (k, padrao) => { try { return JSON.parse(localStorage.getItem(k) || 'null') ?? padrao; } catch (_) { return padrao; } };
  const gravarLs = (k, v) => { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, JSON.stringify(v)); } catch (_) { /* ignora */ } };

  // ok (lista rolada até o fim), parcial (capturada em parte), falha (a fila não abriu a
  // lista) ou falta. A marca à mão prevalece.
  function estadoSemente(u, meta = seguindoMeta, falhas = {}, marcas = {}) {
    if (marcas[u] === true) return 'ok';
    if (marcas[u] === false) return 'falta';
    const m = meta.get(u);
    if (m?.fim_rolagem) return 'ok';
    if (u in falhas) return 'falha';
    return seguindo.get(u)?.size ? 'parcial' : 'falta';
  }

  // Próxima semente que falta: primeiro no grupo da atual, depois nos outros, na ordem do
  // seletor a partir da atual.
  function proximaSemente(atual, meta = seguindoMeta, falhas = {}, marcas = {}) {
    const i0 = SEMENTES.findIndex((p) => p.u === atual);
    const a = SEMENTES[i0] || SEMENTES[0];
    const ordem = [...SEMENTES.slice(i0 + 1), ...SEMENTES.slice(0, Math.max(i0, 0))]
      .filter((p) => p.u !== atual && estadoSemente(p.u, meta, falhas, marcas) !== 'ok');
    return ordem.find((p) => p.grupo === a.grupo) || ordem[0] || null;
  }

  // Uma fila de uma semente: abre o perfil, a lista, rola e baixa (rodarFila).
  function coletarSemente(p) {
    const f = lerFila();
    if (f && f.todos.length > 1 && pendentes(f).length && !confirm(`Há uma fila de ${f.todos.length} sementes com ${pendentes(f).length} por fazer. Trocar por @${p.u}? (as listas já capturadas ficam)`)) return false;
    gravarLs(CHAVE_ALVO, p.u);
    gravarFila({ todos: [p.u], feitos: [], falhas: {}, tentativas: {}, ativa: true });
    if (el.fila) el.fila.value = p.u;
    executar(rodarFila);
    return true;
  }

  function rotularSementes() {
    if (!el.alvo) return;
    const falhas = lerFila()?.falhas || {};
    const marcas = lerLs(CHAVE_MARCAS, {});
    const soFaltam = lerLs(CHAVE_SO_FALTAM, false);
    const aberta = sementeAtual() || perfilAtual();
    const atual = SEMENTES.some((p) => p.u === aberta) ? aberta : lerLs(CHAVE_ALVO, SEMENTES[0].u);
    let prontas = 0;
    for (const o of el.alvo.querySelectorAll('option')) {
      const p = SEMENTES.find((x) => x.u === o.value);
      const e = estadoSemente(p.u, seguindoMeta, falhas, marcas);
      if (e === 'ok') prontas++;
      const n = seguindo.get(p.u)?.size || 0;
      const nome = p.nome ? `${p.nome} (@${p.u}` : `@${p.u} (`;
      const sep = p.nome ? ', ' : '';
      o.className = e;
      o.textContent = e === 'ok' ? `✓ ${nome}${sep}${n} seguidos)` : e === 'parcial' ? `◐ ${nome}${sep}${n} até agora)`
        : e === 'falha' ? `! ${nome}${sep}sem lista)` : `○ ${p.nome ? `${p.nome} (@${p.u})` : `@${p.u}`}`;
      o.hidden = soFaltam && e === 'ok' && p.u !== atual;
    }
    for (const g of el.alvo.querySelectorAll('optgroup')) g.hidden = [...g.querySelectorAll('option')].every((o) => o.hidden);
    if (el.alvo.value !== atual) el.alvo.value = atual;
    el.alvoInfo.textContent = `${prontas} de ${SEMENTES.length} sementes coletadas`;
    const col = estadoSemente(atual, seguindoMeta, falhas, marcas) === 'ok';
    el.bMarcar.textContent = col ? '✕ Desfazer' : '✓ Coletada';
    el.bMarcar.title = col ? 'Desfazer: a semente volta a faltar (seletor, "Próximo" e "só as que faltam"); a lista capturada fica'
      : 'Marcar coletada: dá a semente por coletada sem rolar a lista (ex.: perfil privado ou removido)';
  }

  async function executar(tarefa) {
    if (ocupado) return;
    ocupado = true; parar = false; atualizarBotoes();
    let ok = true;
    try { await tarefa(); } catch (e) {
      ok = false;
      const f = lerFila();
      if (f && f.ativa) { f.ativa = false; gravarFila(f); }
      status(`Parou: ${e.message}. As listas capturadas continuam disponíveis para exportar.`);
    }
    ocupado = false; atualizarBotoes();
    tocar(ok && !parar);
  }

  // ---------- armazenamento (IndexedDB próprio) ----------

  let banco = null;

  function abrirBanco(nome, versao, criar) {
    return new Promise((ok, erro) => {
      const r = versao ? indexedDB.open(nome, versao) : indexedDB.open(nome);
      if (criar) r.onupgradeneeded = () => criar(r.result);
      r.onsuccess = () => ok(r.result);
      r.onerror = () => erro(r.error);
    });
  }

  const pedido = (r) => new Promise((ok, erro) => { r.onsuccess = () => ok(r.result); r.onerror = () => erro(r.error); });

  function mesclarEstado(e) {
    for (const [sem, lista] of e.listas || []) {
      const m = seguindo.get(sem) || new Map();
      for (const [u, d] of lista) if (!m.has(u)) m.set(u, d);
      seguindo.set(sem, m);
    }
    for (const [sem, d] of e.meta || []) if (!seguindoMeta.has(sem)) seguindoMeta.set(sem, d);
    for (const [k, v] of e.ids || []) if (!ids.has(k)) ids.set(k, v);
    for (const [k, v] of e.declarados || []) if (!declarados.has(k)) declarados.set(k, v);
  }

  // Cópia única do que o coletor guardava antes da separação (só leitura). Abre o
  // banco antigo só se ele existir: abrir um banco inexistente o criaria vazio e
  // quebraria o coletor.
  async function migrarDoColetor() {
    if (lerPref(CHAVE_MIGRADO, false)) return;
    try {
      const antiga = localStorage.getItem(CHAVE_FILA_ANTIGA);
      if (antiga && !localStorage.getItem(CHAVE_FILA)) {
        const f = JSON.parse(antiga);
        f.ativa = false; // não retoma sozinha a fila que estava travada
        localStorage.setItem(CHAVE_FILA, JSON.stringify(f));
      }
      localStorage.removeItem(CHAVE_FILA_ANTIGA);
      const lista = indexedDB.databases ? await indexedDB.databases() : [];
      if (lista.some((d) => d.name === 'igc-coletor')) {
        const velho = await abrirBanco('igc-coletor');
        if (velho.objectStoreNames.contains('kv')) {
          const tx = velho.transaction('kv', 'readonly');
          const [seg, est] = await Promise.all([pedido(tx.objectStore('kv').get('seguindo')), pedido(tx.objectStore('kv').get('estado'))]);
          if (seg) mesclarEstado(JSON.parse(seg));
          if (est) {
            const e = JSON.parse(est);
            mesclarEstado({ ids: e.ids || [] });
            for (const [u, d] of e.capturados || []) if (typeof d?.seguindo === 'number' && !declarados.has(u)) declarados.set(u, d.seguindo);
          }
        }
        velho.close();
      }
      gravarPref(CHAVE_MIGRADO, true);
      sujo = true;
      console.info(`[Snowball IG] migrado do coletor: ${seguindo.size} listas`);
    } catch (e) { console.warn('[Snowball IG] migração do coletor falhou', e); }
  }

  async function carregarSalvos() {
    try {
      banco = await abrirBanco('igs-snowball', 1, (db) => db.createObjectStore('kv'));
      const salvo = await pedido(banco.transaction('kv', 'readonly').objectStore('kv').get('estado'));
      if (salvo) mesclarEstado(JSON.parse(salvo));
      await migrarDoColetor();
      mostrar();
    } catch (e) { console.warn('[Snowball IG] sem armazenamento local', e); }
  }

  async function salvar() {
    if (!banco || !sujo) return;
    sujo = false;
    try {
      const tx = banco.transaction('kv', 'readwrite');
      tx.objectStore('kv').put(JSON.stringify({
        listas: [...seguindo].map(([k, m]) => [k, [...m]]), meta: [...seguindoMeta], ids: [...ids], declarados: [...declarados],
      }), 'estado');
      await new Promise((ok, erro) => { tx.oncomplete = ok; tx.onerror = () => erro(tx.error); });
    } catch (e) { sujo = true; console.warn('[Snowball IG] falha ao salvar', e); }
  }

  async function apagarSalvos() {
    if (!confirm('Apagar todas as listas "seguindo" salvas neste navegador? Exporte antes o que quiser guardar.')) return;
    limparFila();
    seguindo.clear(); seguindoMeta.clear();
    sujo = true;
    await salvar();
    status('Listas apagadas.');
  }

  // ---------- som ----------

  const PREF_SOM = 'igs-som-ao-concluir';
  const PREF_AUTOBAIXAR = 'igs-download-automatico';
  let somAoConcluir = lerPref(PREF_SOM, true);
  let autoBaixar = lerPref(PREF_AUTOBAIXAR, true);
  let audio = null;

  function liberarAudio() {
    try { audio = audio || new AudioContext(); if (audio.state === 'suspended') audio.resume(); } catch (_) { audio = null; }
  }

  function tocar(ok = true) {
    if (!somAoConcluir) return;
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

  // ---------- painel ----------

  let el = {};

  function criar(tag, props = {}, filhos = []) {
    const n = document.createElement(tag);
    Object.assign(n, props);
    for (const f of filhos) n.appendChild(f);
    return n;
  }

  function status(t) { if (el.status) el.status.textContent = t; }

  function resumoFila() {
    const f = lerFila();
    if (!f) return '';
    const falhas = Object.entries(f.falhas || {});
    return `\nFila: ${f.feitos.length}/${f.todos.length} listas${f.ativa ? ' (em curso)' : ' (parada)'}` +
      (falhas.length ? ` · sem lista: ${falhas.map(([u, m]) => `@${u} (${m})`).join(', ')}` : '');
  }

  function mostrar() {
    if (!el.info) return;
    const sem = sementeAtual();
    const total = seguindo.size;
    if (!sem) {
      el.info.textContent = `${total} lista(s) capturada(s). Abra a lista "seguindo" de um perfil ou cole as sementes na fila.${resumoFila()}`;
      return;
    }
    const n = seguindo.get(sem)?.size || 0;
    const dec = declaradoSeguindo(sem);
    el.info.textContent = `@${sem}: ${n}${dec ? ` de ${dec} declarados` : ''} capturados · ${total} lista(s) no total.${resumoFila()}`;
  }

  function atualizarBotoes() {
    if (!el.acoes) return;
    for (const b of el.acoes) b.disabled = ocupado;
    el.parar.disabled = !ocupado && !lerFila()?.ativa;
  }

  const CSS = `
    #igs-painel{position:fixed;top:12px;right:364px;z-index:2147483647;width:300px;
      max-height:calc(100vh - 24px);overflow:auto;box-sizing:border-box;
      background:#fff;color:#111;border:1px solid #ccc;border-radius:10px;
      box-shadow:0 4px 16px rgba(0,0,0,.18);font:13px/1.4 system-ui,sans-serif;padding:10px}
    @media (prefers-color-scheme:dark){#igs-painel{background:#1e1e1e;color:#eee;border-color:#444}}
    #igs-painel.min>*:not(header){display:none}
    header{display:flex;justify-content:space-between;align-items:center;font-weight:700;cursor:pointer}
    p{margin:6px 0}
    .linha{display:flex;flex-wrap:wrap;gap:6px;margin:6px 0}
    button{flex:1 1 auto;padding:5px 8px;border-radius:6px;border:1px solid #888;
      background:transparent;color:inherit;cursor:pointer;font:inherit}
    button:disabled{opacity:.4;cursor:default}
    button.perigo:not(:disabled){border-color:#c62828;color:#c62828}
    textarea{width:100%;box-sizing:border-box;height:90px;font:12px monospace;
      background:transparent;color:inherit;border:1px solid #888;border-radius:6px}
    .status{font-size:12px;opacity:.8}
    .info{white-space:pre-line;background:#8881;border-radius:6px;padding:4px 6px}
    button.toggle[aria-pressed=true]{background:#2e7d32;border-color:#2e7d32;color:#fff}
    select{width:100%;box-sizing:border-box;margin:6px 0;padding:4px 6px;font:inherit;color:inherit;background:transparent;border:1px solid #888;border-radius:6px}
    select option,select optgroup{color:#111} option.ok{color:#9ca3af} option.parcial,option.falha{color:#b45309}`;

  let hospedeiro = null;

  function montarPainel() {
    const botao = (texto, fn, titulo = '') => criar('button', { textContent: texto, onclick: fn, title: titulo });
    const toggle = (rotulo, ler, gravar) => {
      const b = criar('button', { className: 'toggle' });
      const pintar = () => { b.setAttribute('aria-pressed', String(ler())); b.textContent = `${rotulo}: ${ler() ? 'ligado' : 'desligado'}`; };
      b.onclick = () => { gravar(!ler()); pintar(); };
      pintar();
      return b;
    };
    el.info = criar('p', { className: 'status info' });
    el.status = criar('p', { className: 'status' });
    el.fila = criar('textarea', { placeholder: 'Fila de sementes: um @perfil ou link por linha' });
    // Menu das sementes: escolher uma abre o perfil e captura a lista "seguindo".
    const grupos = [...new Set(SEMENTES.map((p) => p.grupo))];
    el.alvo = criar('select', {
      title: 'Sementes do snowball: escolher uma abre o perfil, a lista "seguindo", rola e baixa. ✓ coletada, ◐ capturada em parte, ! a fila não abriu a lista, ○ falta',
      onchange: () => {
        const p = SEMENTES.find((x) => x.u === el.alvo.value);
        if (ocupado) { el.alvo.value = lerLs(CHAVE_ALVO, SEMENTES[0].u); status('Espere a lista em curso terminar (ou "Parar").'); return; }
        if (estadoSemente(p.u, seguindoMeta, lerFila()?.falhas || {}, lerLs(CHAVE_MARCAS, {})) === 'ok' && !confirm(`@${p.u} já foi coletada. Rolar a lista de novo?`)) { gravarLs(CHAVE_ALVO, p.u); rotularSementes(); return; }
        if (!coletarSemente(p)) rotularSementes();
      },
    }, grupos.map((g) => criar('optgroup', { label: g },
      SEMENTES.filter((p) => p.grupo === g).map((p) => criar('option', { value: p.u, textContent: `@${p.u}` })))));
    el.alvoInfo = criar('p', { className: 'status' });
    const bProximo = botao('▶ Próximo', () => {
      if (ocupado) { status('Espere a lista em curso terminar (ou "Parar").'); return; }
      const aberta = sementeAtual() || perfilAtual();
      const atual = SEMENTES.some((p) => p.u === aberta) ? aberta : lerLs(CHAVE_ALVO, '');
      const p = proximaSemente(atual, seguindoMeta, lerFila()?.falhas || {}, lerLs(CHAVE_MARCAS, {}));
      if (!p) { status('Todas as sementes estão coletadas.'); return; }
      coletarSemente(p);
    }, 'Próxima que falta: abre a próxima semente sem lista completa (primeiro no mesmo grupo), captura a lista "seguindo" e baixa.');
    el.bMarcar = botao('', () => {
      const u = el.alvo.value;
      const col = estadoSemente(u, seguindoMeta, lerFila()?.falhas || {}, lerLs(CHAVE_MARCAS, {})) === 'ok';
      gravarLs(CHAVE_MARCAS, { ...lerLs(CHAVE_MARCAS, {}), [u]: !col });
      status(col ? `@${u} volta a faltar.` : `@${u} marcada como coletada.`);
      rotularSementes();
    });
    const chkSoFaltam = criar('input', { type: 'checkbox', checked: lerLs(CHAVE_SO_FALTAM, false), onchange: () => { gravarLs(CHAVE_SO_FALTAM, chkSoFaltam.checked); rotularSementes(); } });
    const bRolar = botao('Rolar lista aberta', () => executar(() => rolarSeguindo()), 'Rola a lista "seguindo" aberta na tela até o fim.');
    const bFila = botao('Coletar fila', () => {
      const us = lerUsuarios(el.fila.value);
      if (us.length) iniciarFila(us); else status('Cole ao menos um @ na fila.');
    }, 'Abre cada perfil, abre a lista "seguindo", rola, baixa o CSV e pausa antes do próximo.');
    el.parar = botao('Parar', pararFila, 'Interrompe agora; a fila não retoma na próxima carga da página.');
    el.parar.className = 'perigo';
    const bLimpar = botao('Limpar fila', limparFila, 'Para e apaga a fila salva (as listas capturadas ficam).');
    const bCsv = botao('CSV desta lista', () => exportar(false));
    const bCsvTodas = botao('CSV de todas', () => exportar(true));
    const bApagar = botao('Apagar listas salvas', apagarSalvos);
    el.acoes = [bRolar, bFila, bApagar];
    const bSom = toggle('🔔 Som', () => somAoConcluir, (v) => { somAoConcluir = v; gravarPref(PREF_SOM, v); if (v) tocar(true); });
    const bAuto = toggle('⬇ Download automático', () => autoBaixar, (v) => { autoBaixar = v; gravarPref(PREF_AUTOBAIXAR, v); });

    const minimizar = criar('span', { textContent: '–' });
    const cabecalho = criar('header', {}, [criar('span', { textContent: 'Snowball IG (seguindo)' }), minimizar]);
    const painel = criar('div', { id: 'igs-painel' }, [
      cabecalho,
      el.alvo,
      criar('div', { className: 'linha' }, [bProximo, el.bMarcar]),
      criar('label', {}, [chkSoFaltam, document.createTextNode(' Só as que faltam')]),
      el.alvoInfo,
      criar('div', { className: 'linha' }, [bSom, bAuto]),
      el.info,
      criar('div', { className: 'linha' }, [bRolar]),
      el.fila,
      criar('div', { className: 'linha' }, [bFila, el.parar, bLimpar]),
      criar('div', { className: 'linha' }, [bCsv, bCsvTodas]),
      criar('div', { className: 'linha' }, [bApagar]),
      el.status,
    ]);
    cabecalho.onclick = () => { painel.classList.toggle('min'); minimizar.textContent = painel.classList.contains('min') ? '+' : '–'; };
    painel.addEventListener('click', liberarAudio);
    hospedeiro = criar('div', { id: 'igs-hospedeiro' });
    const raiz = hospedeiro.attachShadow({ mode: 'open' });
    raiz.appendChild(criar('style', { textContent: CSS }));
    raiz.appendChild(painel);
    atualizarBotoes();
  }

  // O React pode refazer o <body>: o painel fica preso ao <html> e é reposto se sumir.
  function garantirPainel() {
    const raiz = document.documentElement;
    if (!raiz) return;
    if (!hospedeiro) montarPainel();
    if (!hospedeiro.isConnected) raiz.appendChild(hospedeiro);
  }

  // Campo vazio recebe a fila salva; texto digitado não é sobrescrito.
  function reporFila() {
    const f = lerFila();
    if (f && el.fila && !el.fila.value.trim()) el.fila.value = f.todos.join('\n');
    if (f && f.ativa && !ocupado) executar(rodarFila);
  }

  function iniciar() {
    console.info('[Snowball IG] iniciado');
    garantirPainel();
    lerDadosEmbutidos();
    let caminhoAtual = location.pathname;
    setInterval(() => {
      try {
        garantirPainel();
        if (location.pathname !== caminhoAtual) { caminhoAtual = location.pathname; lerDadosEmbutidos(); }
        lerSeguindoDom();
        mostrar();
        atualizarBotoes();
        rotularSementes();
      } catch (e) { console.error('[Snowball IG]', e); }
    }, 1000);
    carregarSalvos().then(() => setTimeout(reporFila, 2500));
    setInterval(salvar, 3000);
    addEventListener('pagehide', salvar);
  }

  console.info('[Snowball IG] carregado');
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
  else iniciar();
})();
