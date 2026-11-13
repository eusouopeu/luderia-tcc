// ==UserScript==
// @name         Horários de pico do Google Maps (TCC Luderia)
// @namespace    tcc-luderia
// @version      2026.11.13-4
// @description  Lê o gráfico "Horários de pico" (ocupação relativa por dia e hora), o "ao vivo" e o tempo de permanência dos lugares do Google Maps; seletor com as 63 casas do B1, botão "Próximo" e exportação em CSV.
// @match        https://www.google.com/maps/*
// @match        https://www.google.com.br/maps/*
// @run-at       document-idle
// @noframes
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// @grant        unsafeWindow
// @grant        GM_download
// @require      lista_maps_horarios_pico.js
// ==/UserScript==

/*
 * Uso pessoal, para as premissas de ocupação e giro (cap. 7 e 9).
 *
 * O que o Google mostra é um ÍNDICE RELATIVO (0–100, onde 100 é a hora mais cheia
 * da semana daquele lugar), não pessoas. Serve para o formato da curva semanal e,
 * calibrado com a contagem do Bloco B3 na São Jogue, para converter em ocupação.
 *
 * Painel pelo kit dos painéis (_kit_painel/kit_painel.js, o mesmo dos demais coletores):
 * arrastável e redimensionável, com som, download automático e "baixar cada lugar" no
 * cabeçalho, "Parar" sempre à mão e explicações em dicas. A lixeira é o "Reiniciar": dois
 * cliques, baixa antes o CSV de tudo e apaga os horários guardados e o histórico de
 * coleta (marcas e fila).
 *
 * Uso:
 *  - O seletor traz as 63 casas do B1 (B1_horarios.csv), em grupos por capital:
 *    ✓ coletada (com o número de barras), – sem gráfico de pico, ! coleta que
 *    falhou, ○ falta. O funil esconde as prontas; o ✓ ao lado marca a casa como
 *    coletada sem nova coleta (ou a faz voltar a faltar).
 *  - Escolher uma casa no seletor abre a casa no Maps e coleta sozinho quando ela
 *    carrega (como "Abrir").
 *  - "Próximo" abre a próxima casa que falta (falhas incluídas) e coleta sozinho
 *    quando ela carrega; o resultado fica no status, para conferir antes de
 *    seguir. "Abrir" faz o mesmo com a casa escolhida; "Coletar" lê o lugar
 *    aberto de novo.
 *  - A coleta se liga à casa do B1 pela distância (até 300 m, como na análise
 *    B1a_horarios_pico.py); se o lugar aberto não for a casa escolhida, o
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
  const CHAVE_CADA = 'tcc-picos-baixar-cada'; // até 2026.11.13-3; agora no kit
  const CHAVE_MARCAS = 'tcc-picos-marcas'; // { place_id: true (dada por coletada) | false (desfeita) }
  const PASTA_DOWNLOAD = 'B1_estabelecimentos/_dados-brutos/horarios_pico';
  const ANTIGA_DADOS = 'tcc-picos-resultados'; // localStorage, até 2026.11.11-4
  const ANTIGA_FILA = 'tcc-picos-fila';
  const LIMITE_M = 300;
  const PAUSA_ENTRE_LUGARES = [4000, 8000];
  const DIAS = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
  const DIAS_RE = [/doming|sunday/i, /segunda|monday/i, /terca|terça|tuesday/i, /quarta|wednesday/i, /quinta|thursday/i, /sexta|friday/i, /sabado|sábado|saturday/i];

  // A lista vem de lista_maps_horarios_pico.js, lida pelo carregador (@require) antes deste arquivo.
  if (typeof LISTA_MAPS_HORARIOS_PICO === 'undefined') {
    const msg = '[Horários de pico] lista_maps_horarios_pico.js não foi carregada: reinstale o carregador (python3 _src/outros/G5_outros/gerar_carregadores.py --abrir).';
    console.error(msg);
    if (typeof alert === 'function') alert(msg);
    return;
  }
  // Itens do menu em lista_maps_horarios_pico.js (pasta deste script).
  const POP = LISTA_MAPS_HORARIOS_PICO.map(([id, nome, capital, lat, lng]) => ({ id, nome, capital, lat, lng }));

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
    try { GM_setValue(chave, valor); return true; } catch (e) { status(`Não consegui gravar no Tampermonkey: ${e.message}`, 'erro'); return false; }
  }

  function apagar(chave) {
    try { GM_deleteValue(chave); } catch (_) { /* nada a apagar */ }
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
  // Devolve true se chegou ao fim do painel.
  async function percorrerPainel(passos = 15, pausa = 350) {
    const c = rolavel(document.querySelector('div[role="main"] h1') || painelPrincipal());
    if (!c) return false;
    for (let i = 0; i < passos && c.scrollTop + c.clientHeight < c.scrollHeight - 5; i++) {
      c.scrollBy(0, 700);
      await esperar(pausa);
    }
    const noFim = c.scrollTop + c.clientHeight >= c.scrollHeight - 5;
    c.scrollTo(0, 0);
    return noFim;
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

    const permanencia = lerPermanencia([painelPrincipal().innerText, painelPrincipal().textContent,
      ...[...painelPrincipal().querySelectorAll('[aria-label]')].map((e) => e.getAttribute('aria-label'))]);
    if (!permanencia) console.info('[Horários de pico] permanência não achada; linhas com "pessoas":', painelPrincipal().innerText.split('\n').filter((l) => /pessoas|people/i.test(l)));
    return { linhas, aviso: inferido ? 'Dia da semana inferido pela ordem dos grupos (as 7 vagas de dia não foram achadas); confira um dia no gráfico.' : '', permanencia, dia_inferido: inferido ? 'sim' : '' };
  }

  // Permanência ("As pessoas costumam passar de 1 a 2,5 h aqui", "Normalmente as pessoas passam
  // até 2 horas aqui", "People typically spend 1.5 hours here"). Até 2026.11.13-1 a expressão
  // pedia "As pessoas normalmente|costumam" no começo da linha e saiu vazia nas 63 casas de 12/11.
  // Procura em vários textos (innerText, textContent, rótulos), na primeira frase que case.
  const RE_PERMANENCIA = /((?:as )?pessoas[^.\n]{0,30}(?:passam|passar|ficam|ficar|permanecem)(?:[^.\n]|\.\d){0,60}|people (?:typically|usually) spend(?:[^.\n]|\.\d){0,60})/i;
  function lerPermanencia(textos) {
    for (const t of textos) {
      const m = String(t || '').match(RE_PERMANENCIA);
      if (m && /\d|meia|uma|um /i.test(m[1])) return m[1].trim();
    }
    return '';
  }
  // Minutos da permanência: { min, max } ("de 1 a 2,5 h" → 60 e 150; "até 2 horas" → '' e 120;
  // "45 min" → 45 e 45; "15 min a 1 h" → 15 e 60).
  function minutosPermanencia(texto) {
    const t = semAcento(texto).replace(/(\d),(\d)/g, '$1.$2').replace(/\bmeia hora\b/g, '30 min').replace(/\buma hora\b/g, '1 h');
    const partes = [...t.matchAll(/(\d+(?:\.\d+)?)\s*(h|hora|horas|hr|hours?|min|minutos?|minutes?)?\b/g)]
      .filter((m) => m[1]).map((m) => ({ n: +m[1], u: m[2] || '' }));
    if (!partes.length) return { min: '', max: '' };
    // Unidade que falta ("de 1 a 2,5 h") é a do número seguinte.
    for (let i = partes.length - 2; i >= 0; i--) if (!partes[i].u) partes[i].u = partes[i + 1].u;
    const emMin = (p) => Math.round(/^h|hora|hr|hour/.test(p.u) ? p.n * 60 : p.n);
    const vals = partes.filter((p) => p.u).map(emMin);
    if (!vals.length) return { min: '', max: '' };
    if (/\bate\b|up to/.test(t) && vals.length === 1) return { min: '', max: vals[0] };
    return { min: Math.min(...vals), max: Math.max(...vals) };
  }

  // Lugar sem barras lidas: "sem horários de pico" só com prova de que o Maps não tem a seção
  // (painel lido até o fim, com a seção de avaliações e sem "Horários de pico"); sem a prova,
  // é falha ("!" no seletor) e entra no "Próximo". Até 2026.11.13-1 bastava não achar barras
  // (7 casas em 12/11: Café Geek, Coletivo Geek, Jogasampa, Asgard, Paladino, RED, Reduto).
  function provaSemGrafico({ texto = '', limitada = false, rolouAteOFim = false }) {
    const t = semAcento(texto);
    if (limitada) return { sem: false, motivo: 'visualização limitada do Maps (sem login): entre na conta' };
    if (/horarios de pico|popular times/.test(t)) return { sem: false, motivo: 'a seção de horários de pico está no painel, mas as barras não carregaram' };
    const fim = (t.match(/resumo das avaliacoes|review summary|avaliacoes|reviews/) || [])[0];
    if (rolouAteOFim && fim) return { sem: true, prova: `painel lido até o fim (achado "${fim}"), sem a seção de horários de pico` };
    return { sem: false, motivo: 'o painel não carregou até a seção de avaliações; o gráfico pode não ter carregado' };
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
    // "Sem" só com a prova gravada (desde 2026.11.13-2); as anteriores voltam a falhar.
    if (/sem hor[aá]rios de pico/i.test(r.situacao || '') && r.leitura) return 'sem';
    return 'falha';
  }

  // A marca à mão prevalece sobre o registro: true dá a casa por coletada, false a faz faltar.
  const estadoComMarca = (estado, marca) => (marca === true ? (estado === 'sem' ? 'sem' : 'ok') : marca === false ? 'falta' : estado);

  // Próxima casa que falta (ou cuja coleta falhou), na ordem do seletor, a partir da atual.
  function proximaQueFalta(lugares, pidAtual, marcas = {}) {
    const reg = registrosPorCasa(lugares);
    const i0 = POP.findIndex((p) => p.id === pidAtual);
    const ordem = [...POP.slice(i0 + 1), ...POP.slice(0, i0 + 1)];
    return ordem.find((p) => p.id !== pidAtual && ['falta', 'falha'].includes(estadoComMarca(estadoCasa(reg.get(p.id)), marcas[p.id]))) || null;
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
    let leitura = lerPicos();
    let prova = '';
    if (!leitura.linhas.length) {
      // Sem barras: espera mais, rola devagar até o fim e decide com prova.
      await esperar(3000);
      const rolou = await percorrerPainel(30, 700);
      leitura = lerPicos();
      if (!leitura.linhas.length) {
        const texto = painelPrincipal().innerText;
        const p = provaSemGrafico({ texto, limitada: /visualiza[cç][aã]o limitada|limited view/i.test(texto), rolouAteOFim: rolou });
        if (!p.sem) {
          const r = { ok: false, msg: `Nada gravado: ${p.motivo}. Colete de novo.` };
          if (escolhida && ['falta', 'falha'].includes(estadoCasa(registrosPorCasa(lugaresGuardados()).get(escolhida.id)))) {
            const dados = lugaresGuardados().filter((l) => !(l.place_id === escolhida.id && !l.linhas?.length));
            dados.push({ nome: lugar.nome, url: location.href, place_id: escolhida.id, situacao: r.msg, coletado_em: agora(), coletado_ms: Date.now(), linhas: [] });
            gravar(CHAVE_DADOS, dados);
          }
          return r;
        }
        prova = p.prova;
      }
    }
    const { linhas, aviso, permanencia = '', dia_inferido = '' } = leitura;
    const minutos = minutosPermanencia(permanencia);
    // Substitui só a coleta anterior do MESMO lugar: pelo código tirado da URL gravada
    // (o último lugar dela) ou pela mesma casa do B1. Até a versão 2026.11.11-1 o código
    // gravado podia ser o do lugar de onde se partiu, e comparar por ele ou pelo nome
    // apagava outra casa (ex.: coletar a Magic Store apagou o Garagem do Nerd).
    const dados = lugaresGuardados().filter((l) => !((lugar.id_maps && codigoDe(l) === lugar.id_maps) || (casa && l.place_id === casa.id)));
    dados.push({
      ...lugar, place_id: casa?.id || '', permanencia, permanencia_min_min: minutos.min, permanencia_max_min: minutos.max, dia_inferido,
      leitura: linhas.length ? '' : prova,
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
    apagar(CHAVE_ABRIR);
    if (Date.now() - pedido.em > 2 * 60 * 1000) return;
    const casa = POP.find((p) => p.id === pedido.pid);
    status(`Abrindo ${casa?.nome || 'a casa'}…`);
    for (let i = 0; i < 30 && !infoLugar().nome; i++) await esperar(500);
    await esperar(1500);
    status(`Lendo ${casa?.nome || 'a casa'}…`);
    const r = await coletarEste(pedido.pid);
    atualizar();
    status(r.msg, r.ok ? 'ok' : 'erro');
    kit.tocar(r.ok);
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
    // Opção "baixar cada lugar": o CSV só do lugar que acabou de ser lido (o registro mais recente).
    if (kit.baixarCada) {
      const ultimo = lugaresGuardados().reduce((a, l) => ((l.coletado_ms || 0) > (a?.coletado_ms || 0) ? l : a), null);
      if (ultimo) baixarCsv([ultimo], nomeCurto(ultimo.nome || 'lugar'));
    }
    fila.pos += 1;
    if (fila.pos >= fila.itens.length || fila.parar) {
      fila.ativa = false;
      gravar(CHAVE_FILA, fila);
      atualizar();
      if (kit.autobaixar) baixarCsv();
      status(`Fila concluída (${fila.pos} de ${fila.itens.length}). ${r.msg}${kit.autobaixar ? ' CSV baixado.' : ''}`, fila.parar ? 'alerta' : 'ok');
      kit.tocar(!fila.parar);
      atualizar();
      return;
    }
    gravar(CHAVE_FILA, fila);
    const pausa = sortear(PAUSA_ENTRE_LUGARES);
    status(`${fila.pos}/${fila.itens.length} · ${r.msg} Próximo em ${Math.round(pausa / 1000)} s.`);
    atualizar();
    await esperar(pausa);
    if (ler(CHAVE_FILA, {}).parar) { const f = ler(CHAVE_FILA, {}); f.ativa = false; gravar(CHAVE_FILA, f); status('Fila interrompida.', 'alerta'); atualizar(); return; }
    location.href = fila.itens[fila.pos];
  }

  // ---------- exportação ----------

  const COLS = ['nome', 'endereco', 'id_maps', 'place_id', 'lat', 'lng', 'nota_media', 'n_avaliacoes', 'dia_semana', 'ordem_dia', 'hora', 'ocupacao_relativa', 'ao_vivo', 'leitura', 'dia_inferido', 'permanencia', 'permanencia_min_min', 'permanencia_max_min', 'situacao', 'coletado_em', 'url'];

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

  // "Ludus Luderia" -> "ludus_luderia" (nome do arquivo de um lugar só).
  const nomeCurto = (s) => String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') || 'lugar';

  // Sem argumentos, tudo o que está guardado; com "lugar", só os registros dados, e o nome
  // ganha o lugar no fim (maps_horarios_pico_<data>_<hora>_<lugar>.csv: o build lê os dois e
  // fica com a coleta mais recente de cada lugar).
  function baixarCsv(lugares = null, lugar = '') {
    const linhas = linhasCsv(lugares || lugaresGuardados());
    const texto = '﻿' + [COLS.join(';'), ...linhas.map((l) => COLS.map((c) => celula(l[c])).join(';'))].join('\r\n');
    const d = new Date();
    const p = (n) => String(n).padStart(2, '0');
    const nome = `maps_horarios_pico_${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}${lugar ? `_${lugar}` : ''}.csv`;
    // Com GM_download, em Downloads/TCC Luderia/<PASTA_DOWNLOAD>/ sem perguntar.
    kit.baixarArquivo(nome, texto);
    if (!lugares) gravar(CHAVE_EXPORTACAO, Date.now());
    return linhas.length;
  }

  // ---------- painel (kit dos painéis: _kit_painel/kit_painel.js) ----------
  // Mesmo padrão dos demais coletores: canto superior direito, shadow DOM preso ao <html>,
  // arrastável e redimensionável, Montserrat, Heroicons outline, explicações em dicas, ação
  // destrutiva em dois cliques, "Parar" sempre à mão, som e download automático no cabeçalho.

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
      // Modo semiautomático (fila): baixar o arquivo de cada item (casa, perfil, busca) assim que
      // ele termina, além do arquivo do fim da fila. Desligado por padrão.
      baixarCada: ler(chave('baixarcada'), false),
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
      'adjustments-horizontal': 'M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75',
      'arrow-down': 'M19.5 13.5 12 21m0 0-7.5-7.5M12 21V3',
      'arrow-down-on-square': 'M9 8.25H7.5a2.25 2.25 0 0 0-2.25 2.25v9a2.25 2.25 0 0 0 2.25 2.25h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25H15M9 12l3 3m0 0 3-3m-3 3V2.25',
      'arrow-down-on-square-stack': 'M7.5 7.5h-.75A2.25 2.25 0 0 0 4.5 9.75v7.5a2.25 2.25 0 0 0 2.25 2.25h7.5a2.25 2.25 0 0 0 2.25-2.25v-7.5a2.25 2.25 0 0 0-2.25-2.25h-.75m-6 3.75 3 3m0 0 3-3m-3 3V1.5m6 9h.75a2.25 2.25 0 0 1 2.25 2.25v7.5a2.25 2.25 0 0 1-2.25 2.25h-7.5a2.25 2.25 0 0 1-2.25-2.25v-.75',
    'arrow-down-tray': 'M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3',
      'arrow-path': 'M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99',
      'arrow-top-right-on-square': 'M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25',
      'arrow-up': 'M4.5 10.5 12 3m0 0 7.5 7.5M12 3v18',
      'arrow-up-tray': 'M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5',
      'arrow-uturn-right': 'm15 15 6-6m0 0-6-6m6 6H9a6 6 0 0 0 0 12h3',
      'arrow-uturn-left': 'M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3',
      'bell': 'M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0',
      'bell-slash': 'M9.143 17.082a24.248 24.248 0 0 0 3.844.148m-3.844-.148a23.856 23.856 0 0 1-5.455-1.31 8.964 8.964 0 0 0 2.3-5.542m3.155 6.852a3 3 0 0 0 5.667 1.97m1.965-2.277L21 21m-4.225-4.225a23.81 23.81 0 0 0 3.536-1.003A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6.53 6.53m10.245 10.245L6.53 6.53M3 3l3.53 3.53',
      'bookmark': 'M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z',
      'calendar-days': 'M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5',
      'chart-bar': 'M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z',
      'check': 'm4.5 12.75 6 6 9-13.5',
      'chevron-double-down': 'm4.5 5.25 7.5 7.5 7.5-7.5m-15 6 7.5 7.5 7.5-7.5',
      'chevron-down': 'm19.5 8.25-7.5 7.5-7.5-7.5',
      'chevron-left': 'M15.75 19.5 8.25 12l7.5-7.5',
      'chevron-right': 'm8.25 4.5 7.5 7.5-7.5 7.5',
      'chevron-up': 'm4.5 15.75 7.5-7.5 7.5 7.5',
      'clock': 'M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
      'code-bracket': 'M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5',
      'cube': 'm21 7.5-9-5.25L3 7.5m18 0-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9',
      'document-chart-bar': 'M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25M9 16.5v.75m3-3v3M15 12v5.25m-4.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z',
      'document-check': 'M10.125 2.25h-4.5c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125v-9M10.125 2.25h.375a9 9 0 0 1 9 9v.375M10.125 2.25A3.375 3.375 0 0 1 13.5 5.625v1.5c0 .621.504 1.125 1.125 1.125h1.5a3.375 3.375 0 0 1 3.375 3.375M9 15l2.25 2.25L15 12',
      'document-duplicate': 'M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H9.75',
      'document-text': 'M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z',
      'exclamation-triangle': 'M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z',
      'eye': 'M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178ZM15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z',
      'folder': 'M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z',
      'forward': 'M3 8.689c0-.864.933-1.406 1.683-.977l7.108 4.061a1.125 1.125 0 0 1 0 1.954l-7.108 4.061A1.125 1.125 0 0 1 3 16.811V8.69ZM12.75 8.689c0-.864.933-1.406 1.683-.977l7.108 4.061a1.125 1.125 0 0 1 0 1.954l-7.108 4.061a1.125 1.125 0 0 1-1.683-.977V8.69Z',
      'funnel': 'M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 0 1-.659 1.591l-5.432 5.432a2.25 2.25 0 0 0-.659 1.591v2.927a2.25 2.25 0 0 1-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 0 0-.659-1.591L3.659 7.409A2.25 2.25 0 0 1 3 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0 1 12 3Z',
      'hashtag': 'M5.25 8.25h15m-16.5 7.5h15m-1.8-13.5-3.9 19.5m-2.1-19.5-3.9 19.5',
      'information-circle': 'm11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z',
      'magnifying-glass': 'm21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z',
      'map-pin': 'M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z',
      'minus': 'M5 12h14',
      'bolt': 'm3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z',
      'bolt-slash': 'M11.412 15.655 9.75 21.75l3.745-4.012M9.257 13.5H3.75l2.659-2.849m2.048-2.194L14.25 2.25 12 10.5h8.25l-4.707 5.043M8.457 8.457 3 3m5.457 5.457 7.086 7.086m0 0L21 21',
      'no-symbol': 'M18.364 18.364A9 9 0 0 0 5.636 5.636m12.728 12.728A9 9 0 0 1 5.636 5.636m12.728 12.728L5.636 5.636',
      'play': 'M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z',
      'plus': 'M12 4.5v15m7.5-7.5h-15',
      'queue-list': 'M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 0 1 0 3.75H5.625a1.875 1.875 0 0 1 0-3.75Z',
      'stop': 'M5.25 7.5A2.25 2.25 0 0 1 7.5 5.25h9a2.25 2.25 0 0 1 2.25 2.25v9a2.25 2.25 0 0 1-2.25 2.25h-9a2.25 2.25 0 0 1-2.25-2.25v-9Z',
      'tag': 'M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z M6 6h.008v.008H6V6Z',
      'trash': 'm14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0',
      'truck': 'M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12',
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
      n.setAttribute('data-dica', typeof conteudo === 'string' ? conteudo : '');
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

    // Opção da fila: baixar cada item ao terminar (k.baixarCada, gravada por script).
    function botaoBaixarCada(rotulo = 'Baixar cada item ao terminar (fila)') {
      return alternaIcone({ ico: 'arrow-down-on-square-stack', rotulo, ligado: k.baixarCada,
        aoMudar: (v) => { k.baixarCada = v; gravar(chave('baixarcada'), v); } });
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

    // Baixa o arquivo e devolve uma Promise que resolve quando o download foi entregue ao
    // navegador (quem navega logo depois espera por ela; até 13/11/2026 o segundo CSV de um
    // par se perdia na navegação). Com GM_download (script com @grant) e op.pasta (ex.:
    // "B1_entorno/_dados-brutos"), salva sem perguntar em Downloads/TCC Luderia/<pasta>/,
    // para o arquivo não cair na pasta de outra coleta; se o Tampermonkey recusar (modo de
    // download nativo, extensão fora da lista), cai no download comum.
    const pastaDoArquivo = (pasta, nome) => (pasta ? `TCC Luderia/${String(pasta).replace(/^\/+|\/+$/g, '')}/${nome}` : nome);
    function baixarComum(nome, url) {
      const a = criar('a', { href: url, download: nome });
      (document.body || document.documentElement).appendChild(a);
      a.click();
      a.remove();
    }
    function baixarArquivo(nome, conteudo, tipo = 'text/csv;charset=utf-8', opcoes = {}) {
      const pasta = opcoes.pasta ?? op.pastaDownload ?? '';
      const url = URL.createObjectURL(new Blob([conteudo], { type: tipo }));
      const soltar = () => setTimeout(() => URL.revokeObjectURL(url), 10000);
      if (typeof GM_download !== 'function' || !pasta) {
        baixarComum(nome, url);
        soltar();
        return esperarMs(600).then(() => ({ nome, via: 'navegador' }));
      }
      return new Promise((resolve) => {
        let feito = false;
        const fim = (via) => { if (feito) return; feito = true; soltar(); resolve({ nome: via === 'pasta' ? pastaDoArquivo(pasta, nome) : nome, via }); };
        const comum = () => { baixarComum(nome, url); setTimeout(() => fim('navegador'), 600); };
        try {
          GM_download({ url, name: pastaDoArquivo(pasta, nome), saveAs: false, onload: () => fim('pasta'), onerror: () => { if (!feito) comum(); }, ontimeout: () => { if (!feito) comum(); } });
          // Sem resposta do Tampermonkey em 15 s: segue (o download pode ainda sair).
          setTimeout(() => fim('pasta'), 15000);
        } catch (_) { comum(); }
      });
    }
    const esperarMs = (ms) => new Promise((r) => setTimeout(r, ms));

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
      criar, icone, dica, ajuda, botao, botaoPerigo, botaoParar, etiqueta, alternaIcone, botaoBaixarCada, pills, secao, naoAlterna,
      linha, esp, rotulo, selo, status, resumo, barra, progresso, estado, atualizarAcoes, executar, tocar, piscar,
      confirmarBotao, copiar, celula, csv, baixarArquivo, pastaDoArquivo, menuAlvos, montar, garantir, minimizar,
      nome: (t) => { if (k.el.nome && k.el.nome.textContent !== t) k.el.nome.textContent = t; },
      hospedeiro: () => hospedeiro,
    });
    return k;
  }
  // <<< kit_painel

  // Preferências das versões anteriores passam para as chaves do kit (uma vez).
  for (const [velha, nova] of [[CHAVE_SO_FALTAM, 'tcc-picos:kit:soFaltam'], [CHAVE_CADA, 'tcc-picos:kit:baixarcada']]) {
    const v = ler(velha, null);
    if (v != null) { if (ler(nova, null) == null) gravar(nova, v); apagar(velha); }
  }

  const kit = kitPainel({ id: 'tcc-picos', prefixo: 'tcc-picos', ler, gravar: (c, v) => (v == null ? apagar(c) : gravar(c, v)), pastaDownload: PASTA_DOWNLOAD });
  const { criar, icone } = kit;
  const el = {};

  // Só o que o kit não traz: a grade do quadro-resumo e a linha do lugar aberto.
  const CSS_PAINEL = `
    .caixa{background:var(--sup);border-radius:10px;padding:7px 10px;margin:7px 0}
    .grade{display:grid;grid-template-columns:auto 1fr auto 1fr;gap:2px 8px;font-size:12.5px;align-items:center}
    .grade .k{color:var(--suave)}
    .grade .v{font-variant-numeric:tabular-nums;font-weight:500}
    .grade .todo{grid-column:1 / -1;display:flex;align-items:center;gap:4px}
    .grade svg,.aberto svg,.selo svg{width:14px;height:14px}
    .selo{display:inline-flex;align-items:center;gap:3px}
    .mbarra{display:block;width:100%;height:4px;background:var(--sup2);border-radius:999px;overflow:hidden;margin:3px 0}
    .mbarra>span{display:block;height:100%;background:var(--ok);border-radius:999px}
    .aberto{font-size:12.5px;display:flex;align-items:center;gap:4px;margin:7px 0;color:var(--suave)}
    .ok{color:var(--ok)} .alerta{color:var(--alerta)}
    textarea{white-space:pre;overflow:auto}`;

  const partes = (...xs) => xs.filter((x) => x !== '' && x != null && x !== false).map((x) => (typeof x === 'string' ? document.createTextNode(x) : x));
  // Botão com ícone e nome curto; o nome completo e a explicação vão na dica
  const botao = (ico, rotulo, dica, fn, classe = '') => kit.botao(ico, rotulo, fn, { classe, dica });
  const casaGrade = (classe, t) => criar('span', { className: classe, textContent: t });

  // tipo: '' (neutro), 'ok', 'alerta' ou 'erro' (pinta o status e o ponto do cabeçalho).
  function status(t, tipo = '') { kit.status(t, tipo); }

  const pidAtual = () => ler(CHAVE_ITEM, POP[0].id);
  const lerMarcas = () => ler(CHAVE_MARCAS, {}) || {};
  const filaAtiva = () => !!ler(CHAVE_FILA, null)?.ativa;

  // Seletor (menuAlvos do kit) e quadro-resumo.
  function atualizar() {
    if (!el.menu) return;
    const lugares = lugaresGuardados();
    const reg = registrosPorCasa(lugares);
    const marcas = lerMarcas();
    const n = { ok: 0, sem: 0, falha: 0, falta: 0 };
    for (const p of POP) n[estadoComMarca(estadoCasa(reg.get(p.id)), marcas[p.id])]++;
    el.menu.rotular();

    const prontas = n.ok + n.sem;
    const usados = new Set(reg.values());
    const fora = lugares.filter((l) => !usados.has(l)).length;
    const nLinhas = linhasCsv(lugares).length;
    const exportado = ler(CHAVE_EXPORTACAO, 0);
    const pend = lugares.filter((l) => (l.coletado_ms || 0) > exportado).length;
    el.grade.replaceChildren(
      casaGrade('k', 'Com gráfico'), casaGrade('v', String(n.ok)),
      casaGrade('k', 'Sem gráfico'), casaGrade('v', String(n.sem)),
      casaGrade('k', 'Faltam'), casaGrade(`v${n.falta + n.falha ? ' alerta' : ' ok'}`, `${n.falta + n.falha}${n.falha ? ` (${n.falha} falhou)` : ''}`),
      casaGrade('k', 'Prontas'), casaGrade('v', `${prontas}/${POP.length}`),
      casaGrade('k', 'Lugares'), casaGrade('v', String(lugares.length)),
      casaGrade('k', 'Linhas'), casaGrade('v', String(nLinhas)),
      ...(fora ? [criar('span', { className: 'todo alerta', dica: 'Lugares guardados que não casam com nenhuma das casas do B1 (fila de links, falhas antigas ou fora dos 300 m)' },
        partes(icone('exclamation-triangle'), `${fora} lugar(es) fora da população`))] : []),
    );
    el.pendentes.className = pend ? 'selo alerta' : exportado ? 'selo ok' : 'selo';
    el.pendentes.replaceChildren(...partes(pend ? icone('exclamation-triangle') : exportado ? icone('check') : '', pend ? `${pend} fora do CSV` : exportado ? 'CSV em dia' : ''));
    kit.dica(el.pendentes, exportado ? `Último CSV: ${new Date(exportado).toLocaleString('pt-BR')}` : 'Nenhum CSV baixado ainda');
    const fila = ler(CHAVE_FILA, null);
    if (!kit.ocupado) {
      kit.atualizarAcoes(!!fila?.ativa);
      if (!fila?.ativa && kit.el.ponto.classList.contains('rodando')) kit.estado('');
    }
    if (fila?.ativa) kit.progresso('fila', fila.pos / fila.itens.length, `Fila: ${fila.pos} de ${fila.itens.length} lugares`); else kit.progresso('fila', null);
    mostrarAberto();
  }

  // Lugar aberto × casa escolhida, pelas coordenadas da URL.
  function mostrarAberto() {
    const lugar = infoLugar();
    const esc = POP.find((p) => p.id === pidAtual());
    if (!el.aberto) return;
    if (!lugar.nome || incoerencia(false)) { el.aberto.className = 'aberto'; el.aberto.replaceChildren(...partes('Nenhum lugar aberto (ou carregando).')); return; }
    const casa = popDoLugar(lugar, esc?.id);
    const confere = casa && casa.id === esc?.id;
    el.aberto.className = confere ? 'aberto ok' : 'aberto alerta';
    el.aberto.replaceChildren(...partes(icone(confere ? 'check' : 'exclamation-triangle'),
      confere ? `Aberto: ${lugar.nome}` : casa ? `Aberto: ${lugar.nome} (é ${casa.nome})` : `Aberto: ${lugar.nome} (fora do B1)`));
  }

  function abrirCasa(p) {
    gravar(CHAVE_ITEM, p.id);
    gravar(CHAVE_ABRIR, { pid: p.id, em: Date.now() });
    status(`Abrindo ${p.nome}…`);
    location.href = urlCasa(p);
  }

  // Parar: a fila para depois do lugar atual; a leitura em curso termina.
  function parar() {
    const f = ler(CHAVE_FILA, null);
    if (f?.ativa) { f.parar = true; f.ativa = false; gravar(CHAVE_FILA, f); }
    kit.parar = true;
    status('Parado: a fila não segue para o próximo lugar.', 'alerta');
    atualizar();
  }

  // Reiniciar (lixeira): baixa antes o CSV de tudo e apaga os horários guardados e o histórico
  // de coleta (marcas, fila, pedido de abertura e data do último CSV). As preferências ficam.
  const CHAVES_COLETA = [CHAVE_DADOS, CHAVE_MARCAS, CHAVE_FILA, CHAVE_ABRIR, CHAVE_EXPORTACAO, CHAVE_ITEM];
  function reiniciar() {
    const n = lugaresGuardados().length;
    if (n) baixarCsv(lugaresGuardados(), 'antes_de_reiniciar');
    for (const c of CHAVES_COLETA) apagar(c);
    kit.estado('');
    atualizar();
    status(n ? `Reiniciado: ${n} lugares apagados (CSV baixado antes) e histórico de coleta zerado.` : 'Reiniciado: histórico de coleta zerado.', 'ok');
  }

  function montarPainel() {
    // O registro de todas as casas é lido uma vez por rotulagem, não uma por opção.
    let cache = null;
    const registro = () => { if (!cache) { cache = { reg: registrosPorCasa(lugaresGuardados()), marcas: lerMarcas() }; setTimeout(() => { cache = null; }, 0); } return cache; };
    const estadoCru = (p) => estadoComMarca(estadoCasa(registro().reg.get(p.id)), registro().marcas[p.id]);
    const estadoDe = (p) => (estadoCru(p) === 'sem' ? 'ok' : estadoCru(p));
    el.menu = kit.menuAlvos({
      itens: () => POP, unidade: 'casas', estadoDe,
      detalhe: (p) => { const e = estadoCru(p), r = registro().reg.get(p.id); return e === 'sem' ? 'sem gráfico' : e === 'falha' ? 'falhou' : e === 'ok' && r?.linhas?.length ? `${r.linhas.length} barras` : ''; },
      atual: pidAtual,
      // Escolher no menu abre a casa no Maps e coleta sozinho quando ela carrega
      // (mesmo efeito de "Abrir"); com a casa já aberta, só troca a escolha.
      aoEscolher: (p) => {
        if (!p) return;
        if (filaAtiva() || kit.ocupado) { atualizar(); status('Espere a coleta em curso terminar (ou pare).', 'alerta'); return; }
        if (popDoLugar(infoLugar(), p.id)?.id === p.id) { gravar(CHAVE_ITEM, p.id); atualizar(); return; }
        if (estadoDe(p) === 'ok' && !confirm(`${p.nome} já está coletada. Refazer?`)) { atualizar(); return; }
        abrirCasa(p);
      },
      aoProximo: () => {
        if (filaAtiva() || kit.ocupado) { status('Espere a coleta em curso terminar (ou pare).', 'alerta'); return; }
        const p = proximaQueFalta(lugaresGuardados(), pidAtual(), lerMarcas());
        if (!p) { status('Todas as casas do B1 estão coletadas.', 'ok'); return; }
        abrirCasa(p);
      },
      aoMarcar: (p) => {
        if (!p) return;
        const col = estadoDe(p) === 'ok';
        gravar(CHAVE_MARCAS, { ...lerMarcas(), [p.id]: !col });
        gravar(CHAVE_ITEM, p.id);
        status(col ? `${p.nome} volta a faltar.` : `${p.nome} marcada como coletada.`);
        atualizar();
      },
    });
    kit.dica(el.menu.select, 'Casas do B1, por capital: escolher uma abre no Maps e coleta. ✓ coletada (barras lidas ou sem gráfico de pico), ! falhou, ○ falta');
    const bAbrir = botao('map-pin', '', 'Abrir: abre no Maps a casa escolhida e coleta sozinho quando carregar', () => abrirCasa(POP.find((p) => p.id === el.menu.select.value)));
    const bColetar = botao('chart-bar', 'Coletar', 'Coletar este lugar: lê o gráfico do lugar aberto e grava (substitui a coleta anterior do mesmo lugar)', () => kit.executar(async () => {
      status('Lendo…');
      const r = await coletarEste(el.menu.select.value);
      if (r.casa && r.casa.id !== el.menu.select.value) gravar(CHAVE_ITEM, r.casa.id);
      atualizar();
      if (!r.ok) throw new Error(r.msg);
      status(r.msg, 'ok');
    }).then(atualizar), 'primario');
    const bParar = kit.botaoParar(parar);
    kit.dica(bParar, 'Parar: a fila para depois do lugar atual');
    el.aberto = criar('div', { className: 'aberto' });
    el.grade = criar('div', { className: 'grade' });
    el.pendentes = kit.selo('');
    kit.el.status = criar('div', { className: 'status' });
    el.fila = criar('textarea', { placeholder: 'Um link do Maps ou nome + cidade por linha' });
    const bFila = botao('queue-list', 'Coletar fila', 'Coletar fila: abre cada link da lista, lê o gráfico e passa ao próximo (pausa de 4 a 8 s); no fim, toca um som e baixa o CSV', () => {
      const itens = el.fila.value.split('\n').map(paraUrl).filter(Boolean);
      if (!itens.length) { status('A fila está vazia: um link do Maps ou nome + cidade por linha.', 'alerta'); return; }
      gravar(CHAVE_FILA, { ativa: true, parar: false, pos: 0, itens });
      location.href = itens[0];
    }, 'mini');
    const bCsv = botao('arrow-down-tray', 'CSV', `Baixar CSV: uma linha por lugar × dia × hora, com tudo o que está guardado, em ${PASTA_DOWNLOAD}/`, () => {
      const n = baixarCsv();
      kit.confirmarBotao(bCsv);
      atualizar();
      status(`CSV baixado (${n} linhas).`, 'ok');
    }, 'mini');
    const bLimpar = kit.botaoPerigo('trash', '', reiniciar, { classe: 'leve',
      dica: 'Reiniciar: apaga os horários de pico guardados e o histórico de coleta (marcas e fila). Baixa antes o CSV de tudo. As preferências ficam' });

    kit.acoes = [bColetar, bAbrir, bFila, bCsv, bLimpar, el.menu.bProx];
    kit.montar({
      nome: 'Picos',
      largura: 380,
      autobaixar: true,
      css: CSS_PAINEL,
      extras: [kit.botaoBaixarCada('Baixar cada lugar ao terminar (fila): além do CSV do fim')],
      filhos: [
        el.menu.caixa,
        kit.linha([bColetar, bAbrir, bParar]),
        el.aberto,
        kit.barra('fila'),
        kit.el.status,
        kit.linha([bCsv, el.pendentes, kit.esp(), bLimpar]),
        criar('div', { className: 'caixa' }, [el.grade]),
        kit.secao('fila', 'Fila de links', [el.fila, kit.linha([bFila])]),
      ],
    });
  }

  // Ao abrir um lugar da população, o seletor passa para ele, quando painel e URL já
  // mostram o mesmo lugar (a URL de busca traz o centro do mapa, não o lugar).
  let urlVista = '';
  let urlResolvida = '';
  function verificar() {
    if (!kit.hospedeiro()) { montarPainel(); atualizar(); }
    kit.garantir();
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
  if (migrado) status(migrado, 'ok');
  setInterval(() => { try { verificar(); } catch (e) { console.error('[Horários de pico]', e); } }, 1500);
  continuarFila().catch((e) => status(`Erro na fila: ${e.message}`, 'erro'));
  if (!ler(CHAVE_FILA, null)?.ativa) coletarAoAbrir().catch((e) => status(`Erro na coleta: ${e.message}`, 'erro'));
})();
