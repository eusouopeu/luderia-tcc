// ==UserScript==
// @name         Snowball do Instagram (TCC Luderia)
// @namespace    tcc-luderia
// @version      2026.11.12-2
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
 *    carga não retoma. "Continuar" (ou "Coletar fila" com a mesma lista) retoma de onde parou.
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
  // Painel pelo kit comum (_src/extras/kit_painel/). Sem posição salva, fica à esquerda
  // do painel do coletor, quando ele está aberto.
  const kit = kitPainel({ id: 'igs', posicaoPadrao: () => {
    const r = document.getElementById('igc-hospedeiro')?.shadowRoot?.getElementById('painel')?.getBoundingClientRect();
    return r && r.width ? { top: 12, right: Math.round(innerWidth - r.left + 10) } : { top: 12, right: 12 };
  } });

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
  async function rolarSeguindo(baixarNoFim = kit.autobaixar) {
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
      const dec = declaradoSeguindo(sem);
      kit.progresso('lista', dec ? Math.min(0.99, atual / dec) : true, `@${sem}: ${atual}${dec ? ` de ${dec}` : ''} contas`);
      mostrar();
    }
    const completo = !parar && sementeAtual() === sem;
    const total = seguindo.get(sem)?.size || 0;
    const dec = declaradoSeguindo(sem);
    kit.progresso('lista', null);
    kit.resumo({
      titulo: completo ? `@${sem}: lista completa` : `@${sem}: rolagem interrompida`,
      linhas: [[total, 'contas capturadas', dec ? `de ${dec} declaradas` : '']],
      avisos: [completo && dec && total < dec * 0.95 ? `Faltaram ${dec - total} contas do total declarado (privadas ou removidas?).` : ''],
      tipo: completo ? (dec && total < dec * 0.95 ? 'alerta' : 'ok') : 'alerta',
    });
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

  // Retoma a fila salva (parada por "Parar", erro ou página fechada).
  function continuarFila() {
    const f = lerFila();
    if (!f || !pendentes(f).length) { status('Não há fila parada para continuar.', 'alerta'); return; }
    f.ativa = true;
    gravarFila(f);
    executar(rodarFila);
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
        kit.progresso('fila', null);
        const nf = Object.keys(f.falhas).length;
        status(`Fila concluída: ${f.feitos.length} listas${nf ? `; ${nf} sem lista` : ''}.`, nf ? 'alerta' : 'ok');
        return;
      }
      const u = pend[0];
      const pos = `${f.todos.length - pend.length + 1}/${f.todos.length}`;
      if (f.todos.length > 1) kit.progresso('fila', (f.todos.length - pend.length) / f.todos.length, `Fila: @${u} (${pos})`);
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

  const alvoAtual = () => { const ab = sementeAtual() || perfilAtual(); return SEMENTES.some((p) => p.u === ab) ? ab : lerLs(CHAVE_ALVO, SEMENTES[0].u); };
  const estadoDoAlvo = (u) => estadoSemente(u, seguindoMeta, lerFila()?.falhas || {}, lerLs(CHAVE_MARCAS, {}));
  let menu = null;

  function criarMenu() {
    return kit.menuAlvos({
      itens: () => SEMENTES, id: (p) => p.u, grupo: (p) => p.grupo, nome: (p) => (p.nome ? `${p.nome} (@${p.u})` : `@${p.u}`), unidade: 'sementes',
      estadoDe: (p) => estadoDoAlvo(p.u),
      detalhe: (p, e) => {
        const n = seguindo.get(p.u)?.size || 0;
        return e === 'ok' ? `${n} seguidos` : e === 'parcial' ? `${n} até agora` : e === 'falha' ? 'sem lista' : '';
      },
      atual: alvoAtual,
      aoEscolher: (p) => {
        if (ocupado) { menu.select.value = alvoAtual(); status('Espere a lista em curso terminar (ou pare).', 'alerta'); return; }
        if (estadoDoAlvo(p.u) === 'ok' && !confirm(`@${p.u} já foi coletada. Rolar a lista de novo?`)) { gravarLs(CHAVE_ALVO, p.u); menu.rotular(); return; }
        if (!coletarSemente(p)) menu.rotular();
      },
      aoProximo: () => {
        if (ocupado) { status('Espere a lista em curso terminar (ou pare).', 'alerta'); return; }
        const p = proximaSemente(alvoAtual(), seguindoMeta, lerFila()?.falhas || {}, lerLs(CHAVE_MARCAS, {}));
        if (!p) { status('Todas as sementes estão coletadas.', 'ok'); return; }
        coletarSemente(p);
      },
      aoMarcar: (p) => {
        const col = estadoDoAlvo(p.u) === 'ok';
        gravarLs(CHAVE_MARCAS, { ...lerLs(CHAVE_MARCAS, {}), [p.u]: !col });
        status(col ? `@${p.u} volta a faltar.` : `@${p.u} marcada como coletada.`);
        menu.rotular();
      },
    });
  }

  function rotularSementes() { menu?.rotular(); }

  async function executar(tarefa) {
    if (ocupado) return;
    ocupado = true; parar = false; atualizarBotoes();
    let ok = true;
    try { await tarefa(); } catch (e) {
      ok = false;
      const f = lerFila();
      if (f && f.ativa) { f.ativa = false; gravarFila(f); }
      status(`Parou: ${e.message}. As listas capturadas continuam para exportar.`, parar ? 'alerta' : 'erro');
    }
    ocupado = false; atualizarBotoes();
    kit.progresso('lista', null);
    if (!lerFila()?.ativa) kit.progresso('fila', null);
    kit.estado(ok && !parar ? 'ok' : parar ? 'alerta' : 'erro');
    kit.tocar(ok && !parar);
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
    limparFila();
    seguindo.clear(); seguindoMeta.clear();
    sujo = true;
    await salvar();
    status('Listas apagadas.');
  }

  // >>> kit_painel (cópia de _src/extras/kit_painel/kit_painel.js; regerar com: node _src/extras/kit_painel/embutir.js)
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
      const bMarcar = botao('check', '', () => aoMarcar(lista.find((x) => id(x) === select.value)), { classe: 'leve' });
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
      #painel{position:fixed;top:12px;right:12px;z-index:2147483647;width:var(--largura,340px);max-height:calc(100vh - 24px);
        overflow:auto;background:var(--fundo);color:var(--texto);border-radius:14px;
        box-shadow:0 8px 28px rgba(0,0,0,.2);font:13.5px/1.45 var(--fonte);padding:8px 12px 10px;
        resize:both;min-width:280px;min-height:44px;max-width:calc(100vw - 24px);transition:box-shadow .2s}
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

    // Posição e tamanho escolhidos pelo autor; sem posição salva, vale posicaoPadrao().
    let posicao = ler(chave('posicao'), null);
    let arrastou = false;

    function posicionar() {
      if (!painel) return;
      const p = painel;
      if (posicao?.width && !p.style.width && !p.classList.contains('min')) { p.style.width = posicao.width; p.style.height = posicao.height || ''; }
      if (posicao && posicao.left != null) {
        const w = p.offsetWidth || 340;
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
      painel = criar('div', { id: 'painel', style: `--largura:${largura}px` }, [cab, ...filhos]);
      k.el.painel = painel;
      k.el.nome.onclick = () => { if (!arrastou) minimizar(); };
      prepararArraste(cab);

      // O tamanho só muda pela alça de redimensionar, que grava largura e altura no estilo.
      addEventListener('pointerup', () => {
        if (!painel || painel.classList.contains('min')) return;
        const { width, height } = painel.style;
        if (width && (width !== posicao?.width || height !== posicao?.height)) {
          posicao = { ...posicao, width, height };
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
  const status = (t, tipo = '') => kit.status(t, tipo);

  function mostrar() {
    if (!el.info) return;
    const f = lerFila();
    const t = f && pendentes(f).length ? `${f.todos.length - pendentes(f).length}/${f.todos.length}${f.ativa ? '' : ' parada'}` : '';
    if (el.filaSelo.textContent !== t) el.filaSelo.textContent = t;
    const falhas = Object.entries(f?.falhas || {});
    el.falhas.textContent = falhas.length ? `Sem lista: ${falhas.map(([u, m]) => `@${u} (${m})`).join(', ')}` : '';
    const sem = sementeAtual();
    kit.nome(sem ? `Snowball · @${sem}` : 'Snowball IG');
    const total = seguindo.size;
    const txt = sem
      ? `@${sem}: ${seguindo.get(sem)?.size || 0}${declaradoSeguindo(sem) ? ` de ${declaradoSeguindo(sem)} declarados` : ''} · ${total} lista(s) no total`
      : `${total} lista(s) capturada(s). Abra a lista "seguindo" de um perfil ou use o seletor.`;
    if (el.info.textContent !== txt) el.info.textContent = txt;
  }

  function atualizarBotoes() {
    kit.atualizarAcoes(ocupado);
    // "Parar" também desliga uma fila ativa que ainda não começou nesta página.
    if (kit.el.parar) kit.el.parar.disabled = !ocupado && !lerFila()?.ativa;
    if (el.bContinuar) { const f = lerFila(); el.bContinuar.disabled = ocupado || !f || f.ativa || !pendentes(f).length; }
  }

  function montarPainel() {
    const { botao, linha, esp, secao, selo } = kit;
    menu = criarMenu();
    el.info = kit.criar('div', { className: 'info' });
    const bRolar = botao('chevron-double-down', 'Rolar lista aberta', () => executar(() => rolarSeguindo()),
      { classe: 'primario', dica: 'Rola a lista "seguindo" aberta até o fim; com o download automático, baixa o CSV' });
    kit.botaoParar(pararFila);
    const bCsv = botao('arrow-down-tray', 'Esta lista', () => { exportar(false); kit.piscar(bCsv); }, { classe: 'mini', dica: 'CSV da lista aberta (ou da última)' });
    const bCsvTodas = botao('arrow-down-tray', 'Todas', () => { exportar(true); kit.piscar(bCsvTodas); }, { classe: 'mini', dica: 'Um CSV por semente capturada' });
    el.fila = kit.criar('textarea', { placeholder: 'Sementes: um @perfil ou link por linha' });
    const bFila = botao('play', 'Coletar fila', () => {
      const us = lerUsuarios(el.fila.value);
      if (us.length) iniciarFila(us); else status('Cole ao menos um @ na fila.', 'alerta');
    }, { classe: 'mini', dica: 'Abre cada perfil e a lista "seguindo", rola, baixa o CSV e pausa antes da próxima' });
    el.bContinuar = botao('forward', '', continuarFila, { dica: 'Continuar a fila parada de onde parou' });
    const bLimpar = kit.botaoPerigo('x-mark', '', limparFila, { dica: 'Limpar a fila salva (as listas capturadas ficam)' });
    el.filaSelo = selo('', 'roxo');
    el.falhas = kit.criar('p', { className: 'aviso' });
    const bApagar = kit.botaoPerigo('trash', 'Apagar listas salvas', apagarSalvos, { classe: 'mini', dica: 'Apaga as listas "seguindo" guardadas neste navegador' });
    kit.acoes = [bRolar, bFila, bApagar];
    kit.montar({
      nome: 'Snowball IG', autobaixar: true, largura: 300,
      filhos: [
        menu.caixa,
        linha([bRolar, kit.el.parar]),
        kit.barra('lista'), kit.barra('fila'),
        kit.el.status = kit.criar('div', { className: 'status' }),
        el.info,
        linha([kit.rotulo('CSV'), bCsv, bCsvTodas]),
        secao('fila', ['Fila', el.filaSelo], [el.fila, linha([bFila, el.bContinuar, esp(), bLimpar]), el.falhas]),
        linha([esp(), bApagar]),
      ],
    });
    el.painel = kit.el.painel;
    menu.rotular();
    atualizarBotoes();
  }

  // O React pode refazer o <body>: o kit prende o painel ao <html> e o repõe se sumir.
  function garantirPainel() {
    if (!document.documentElement) return;
    if (!el.painel) montarPainel();
    kit.garantir();
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
