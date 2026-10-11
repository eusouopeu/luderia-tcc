// ==UserScript==
// @name         Coletor de cardápios virtuais (TCC Luderia)
// @namespace    tcc-luderia
// @version      2026.10.11-1
// @description  Extrai itens (seção, nome, descrição, variação, preço) de cardápios on-line, conta itens por categoria e exporta CSV completo e CSV dos 2 itens mais baratos por categoria.
// @match        *://*/*
// @exclude      *://*.google.*/*
// @exclude      *://*.instagram.com/*
// @exclude      *://*.facebook.com/*
// @exclude      *://*.youtube.com/*
// @exclude      *://github.com/*
// @exclude      *://claude.ai/*
// @exclude      *://mail.*/*
// @run-at       document-start
// @noframes
// @grant        none
// ==/UserScript==

/*
 * Uso pessoal, para completar o Bloco A com cardápios que a busca automática não achou.
 *
 * Duas fontes de itens, escolhidas no painel:
 *  - "Dados da página": intercepta o JSON que o site baixa (iFood, Goomer, Anota AI,
 *    Cardápio Web e afins carregam o cardápio assim) e o JSON embutido no HTML
 *    (Next.js, schema.org/Menu). Costuma ser a fonte mais limpa.
 *  - "Texto da tela": procura cada "R$ 00,00" visível, sobe até o bloco do item e
 *    lê nome e descrição; a seção é o título mais próximo acima do item.
 * No modo "auto", usa a fonte que achou mais itens.
 *
 * O painel só aparece quando a página tem cara de cardápio (5+ preços em R$ ou
 * itens no JSON). Cardápio em PDF ou imagem não é lido: precisa de transcrição.
 *
 * Saídas (";" e UTF-8 com BOM, como as transcrições em _data/.../cardapios/transcricao/):
 *  - CSV completo: secao_original;item;descricao;variacao;preco;categoria;subcategoria;
 *    exige_preparo;observacao;fonte;url — categoria e subcategoria seguem as categorias
 *    fixas do método do Bloco A e vêm de palavras-chave: revisar antes de usar.
 *  - CSV plano B: os 2 itens mais baratos de refrigerante, cerveja, drink alcoólico,
 *    batata frita, hambúrguer e sobremesa.
 */

(function () {
  'use strict';

  // ---------- classificação nas categorias fixas do Bloco A ----------

  const semAcento = (t) => String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

  // Ordem importa: a primeira regra que casar vence (drink antes de refrigerante
  // por causa de "cuba libre"; hambúrguer antes de batata por causa de "acompanha fritas").
  const REGRAS = [
    ['couvert ou taxa de jogo', 'couvert ou taxa de jogo', /\bcouvert\b|\btaxa de (jogo|mesa|entrada)\b|\bhora de jogo\b|\bday ?use\b|\bacesso (a|ao) (acervo|ludoteca)\b/],
    ['outros', 'taxa de serviço', /\btaxa de servico\b|\bgorjeta\b/],
    ['outros', 'combos', /\bcombos?\b/],
    ['outros', 'adicionais', /^adicion|^\+ ?\w|\badicionais\b|\bacrescimo\b|\bextra\b/],
    ['bebidas', 'não alcoólicas', /\bsem alcool\b|\bzero alcool\b|\bnao alcoolic|\bmocktail|\b0,?0 ?%/],
    ['bebidas', 'drinks', /\bdrinks?\b|\bcaipi|\bgin\b|\bmojito|\bmargarita|\bnegroni|\baperol|\bspritz|\bcuba libre|\bmoscow mule|\bsex on the beach|\bbatida\b|\bcoquetel|\bcocktail|\bdaiquiri|\bpina colada|\bwhisk|\bvodka|\brum\b|\btequila|\bcachaca|\blicor|\bsangria|\bmimosa|\bjager|\bshots?\b|\bvinho|\bespumante|\bclericot|\bcampari|\bmartini|\bbloody mary|\bfitzgerald|\bcosmopolitan/],
    ['bebidas', 'cerveja', /\bcervej|\bchop+e?\b|\bheineken|\bbrahma|\bskol\b|\bbudweiser|\bstella artois|\bcorona\b|\bamstel|\bitaipava|\beisenbahn|\bspaten|\bpatagonia|\bbaden|\bcolorado\b|\bipa\b|\bapa\b|\blager\b|\bpilsen|\bweiss|\bstout\b|\blong ?neck/],
    ['bebidas', 'refrigerante', /\brefri(gerante)?s?\b|\bcoca[- ]?cola\b|\bcoca\b|\bguarana\b|\bfanta\b|\bsprite\b|\bpepsi\b|\bschweppes|\bh2oh|\btonica\b|\bkuat\b|\bsukita/],
    ['bebidas', 'não alcoólicas', /\bagua\b|\bsucos?\b|\bchas?\b|\bcafe\b|\bespresso|\bexpresso\b|\bcappuc+ino|\blatte\b|\blimonada|\bmilk ?shake|\bsoda italiana|\benergetico|\bred bull|\bmonster\b|\bmate\b|\bchocolate quente|\bfrappe|\bachocolatado|\bkombucha|\biced tea/],
    ['sobremesas', 'sobremesas', /\bsobremesas?\b|\bbrownie|\bsorvetes?\b|\bpudim|\bpetit gateau|\btortas? doce|\bmousse|\bacai\b|\bchurros|\bcheesecake|\bbrigadeiro|\bcookies?\b|\bbolo\b|\bbanoffee|\btiramisu|\bsundae|\bdoces?\b|\bpave\b|\bnutella|\bpetit four/],
    ['pratos principais', 'hambúrguer', /\bhamburg|\bburg(u)?er|\bsmash|\bx[- ]?(burg|salada|bacon|tudo|egg|frango|calabresa)\b|\bcheese ?burg/],
    ['entradas', 'batata', /\bbatata|\bfritas\b|\bfries\b/],
    ['pratos principais', 'outros', /\bpizzas?\b|\bpratos?\b|\bsanduiches?\b|\bsandubas?\b|\bwraps?\b|\blanches?\b|\bhot ?dogs?\b|\bcachorro[- ]quente|\bcrepes?\b|\bmassas?\b|\brisoto|\bparmegiana|\bexecutivo|\bpanini|\bquesadilla|\bburrito|\btacos?\b|\bfile\b|\bpicanha|\bomelete|\bbaguete|\bciabatta|\bbeirute/],
    ['entradas', 'outras', /\bporc(ao|oes)\b|\bpetiscos?\b|\bnachos|\biscas?\b|\bfrango a passarinho|\bdadinhos?\b|\bcoxinhas?\b|\bpasteis?\b|\bpastel\b|\bbolinhos?\b|\btabuas?\b|\bonion rings|\bentradas?\b|\baperitivos?\b|\baipim|\bmandioca|\bcalabresa|\bmini|\bsalgad|\bchips|\bpipoca|\bkibe|\besfiha|\bempanad|\bdrumet|\bnuggets|\bpalitos?\b|\btiras\b|\bbruschett|\bcroquete|\bcalzone/],
  ];

  // Uma regra testa primeiro o nome, depois nome + descrição, por fim a seção.
  function classificar(item) {
    for (const texto of [item.item, `${item.item} ${item.descricao}`, item.secao_original]) {
      const t = semAcento(texto);
      if (!t.trim()) continue;
      for (const [cat, sub, re] of REGRAS) if (re.test(t)) return { categoria: cat, subcategoria: sub };
    }
    return { categoria: '', subcategoria: '' };
  }

  // Plano B: categoria do pedido -> subcategoria do Bloco A.
  const PLANO_B = [
    ['refrigerante', 'refrigerante'],
    ['cerveja', 'cerveja'],
    ['drink alcoólico', 'drinks'],
    ['batata frita', 'batata'],
    ['hambúrguer', 'hambúrguer'],
    ['sobremesa', 'sobremesas'],
  ];

  // ---------- preço ----------

  const RE_PRECO = /R\$\s*(\d{1,3}(?:\.\d{3})*(?:,\d{1,2})?|\d+(?:[.,]\d{1,2})?)/g;

  function numeroBR(txt) {
    let t = String(txt).replace(/[^\d.,]/g, '');
    if (t.includes(',')) t = t.replace(/\./g, '').replace(',', '.');
    const n = parseFloat(t);
    return Number.isFinite(n) ? n : null;
  }

  const CHAVES_PRECO = ['price', 'preco', 'valor', 'unitPrice', 'unit_price', 'value', 'amount', 'priceValue', 'salePrice', 'sale_price', 'minPrice', 'min_price', 'originalPrice', 'basePrice', 'base_price', 'lowPrice'];

  function precoDe(o) {
    for (const k of Object.keys(o)) {
      const v = o[k];
      const kl = k.toLowerCase();
      const ehCentavos = /cent/.test(kl);
      if (!ehCentavos && !CHAVES_PRECO.some((c) => c.toLowerCase() === kl)) continue;
      let n = null;
      if (typeof v === 'number') n = v;
      else if (typeof v === 'string' && /\d/.test(v)) n = numeroBR(v);
      else if (v && typeof v === 'object' && !Array.isArray(v)) n = typeof v.value === 'number' ? v.value : typeof v.amount === 'number' ? v.amount : null;
      if (n == null || n < 0) continue;
      return ehCentavos ? n / 100 : n;
    }
    // schema.org: offers.price
    if (o.offers && typeof o.offers === 'object') return precoDe(Array.isArray(o.offers) ? o.offers[0] || {} : o.offers);
    return null;
  }

  // ---------- fonte 1: JSON da página ----------

  const itensJson = new Map(); // chave -> item

  // iFood usa "description" como nome do item e "details" como descrição.
  const estiloIfood = (o) => !o.name && !o.title && typeof o.description === 'string' && ('details' in o || 'unitPrice' in o);
  const nomeDe = (o) => [o.name, o.nome, o.title, o.titulo, estiloIfood(o) ? o.description : null]
    .find((v) => typeof v === 'string' && v.trim().length > 1 && v.length < 120);
  const descDe = (o) => (estiloIfood(o) ? [o.details] : [o.description, o.descricao, o.details, o.detalhes, o.subtitle])
    .find((v) => typeof v === 'string') || '';

  function ehItem(o) {
    return o && typeof o === 'object' && !Array.isArray(o) && nomeDe(o) && precoDe(o) != null;
  }

  function guardarJson(o, secao) {
    const it = {
      secao_original: secao || '',
      item: nomeDe(o).trim(),
      descricao: descDe(o).replace(/\s+/g, ' ').trim(),
      variacao: '',
      preco: precoDe(o),
      fonte: 'dados da página',
    };
    const chave = `${it.secao_original}|${it.item}|${it.preco}`;
    if (!itensJson.has(chave)) itensJson.set(chave, it);
  }

  // Percorre o JSON. Um objeto com nome e uma lista de itens é tratado como seção.
  function ingerir(dado, secao = '', prof = 0) {
    if (!dado || typeof dado !== 'object' || prof > 30) return;
    if (Array.isArray(dado)) { for (const x of dado) ingerir(x, secao, prof + 1); return; }
    // Não desce dentro do item: complementos e adicionais também têm nome e preço.
    if (ehItem(dado)) { guardarJson(dado, secao); return; }
    const nome = nomeDe(dado);
    for (const k in dado) {
      const v = dado[k];
      if (!v || typeof v !== 'object') continue;
      const temItens = Array.isArray(v) && v.some(ehItem);
      ingerir(v, temItens && nome && !ehItem(dado) ? nome : secao, prof + 1);
    }
  }

  function ingerirTexto(t) {
    if (!t || t.length > 8e6 || !/price|preco|valor/i.test(t)) return;
    try { ingerir(JSON.parse(t)); } catch (_) { /* não é JSON */ }
  }

  const fetchOriginal = window.fetch;
  window.fetch = async function (...args) {
    const resp = await fetchOriginal.apply(this, args);
    try {
      if (/json/.test(resp.headers.get('content-type') || '')) resp.clone().text().then(ingerirTexto, () => {});
    } catch (_) { /* ignora */ }
    return resp;
  };

  const xhrSend = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.send = function (...args) {
    this.addEventListener('load', function () {
      try {
        if (this.responseType === 'json') ingerir(this.response);
        else if (this.responseType === '' || this.responseType === 'text') ingerirTexto(this.responseText);
      } catch (_) { /* ignora */ }
    });
    return xhrSend.apply(this, args);
  };

  function lerJsonEmbutido() {
    for (const s of document.querySelectorAll('script[type="application/json"], script[type="application/ld+json"], script#__NEXT_DATA__')) {
      ingerirTexto(s.textContent);
    }
  }

  // ---------- fonte 2: texto da tela ----------

  const contarPrecos = (t) => (String(t).match(RE_PRECO) || []).length;
  const visivel = (e) => e.getClientRects().length > 0;
  const linhas = (t) => String(t).split('\n').map((l) => l.trim()).filter(Boolean);
  const ehSelo = (l) => /^(novo|nova|promo(cao)?|mais pedido|destaque|popular|esgotado|indisponivel|vegano|vegetariano|-?\d+ ?%( off)?)$/i.test(semAcento(l));
  const ehLinhaPreco = (l) => /^(a partir de\s*)?R\$\s*[\d.,]+$/i.test(l) || /^de\s*R\$.*por\s*R\$/i.test(l);

  // Menor elemento que contém o texto de um preço.
  function elementosDePreco() {
    const res = [];
    const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let n = w.nextNode(); n; n = w.nextNode()) {
      if (!/R\$\s*\d/.test(n.nodeValue)) continue;
      const e = n.parentElement;
      if (!e || e.closest('#ccv-hospedeiro, script, style, noscript') || !visivel(e)) continue;
      if (!res.includes(e)) res.push(e);
    }
    // Preço quebrado em vários nós ("R$" num span, "12,90" noutro).
    if (!res.length) {
      for (const e of document.body.querySelectorAll('*')) {
        if (e.childElementCount <= 3 && contarPrecos(e.textContent) === 1 && /^\s*R\$/.test(e.textContent) && visivel(e)) res.push(e);
      }
    }
    return res;
  }

  // Sobe enquanto o pai continuar com um único preço: esse é o bloco do item.
  function blocoDoItem(e) {
    let b = e;
    while (b.parentElement && b.parentElement !== document.body && contarPrecos(b.parentElement.innerText) <= 1) b = b.parentElement;
    return b;
  }

  function candidatosTitulo(blocos) {
    const res = [];
    const sel = 'h1,h2,h3,h4,h5,[role=heading],[class*="categor" i],[class*="section" i] > *:first-child,[id*="categor" i]';
    const ok = (e) => {
      const t = e.innerText?.trim();
      return t && t.length >= 3 && t.length <= 50 && !t.includes('\n') && !contarPrecos(t) && visivel(e) &&
        !blocos.some((b) => b.contains(e));
    };
    for (const e of document.body.querySelectorAll(sel)) if (ok(e)) res.push(e);
    // Títulos feitos com <div> em negrito e fonte grande.
    for (const e of document.body.querySelectorAll('div,span,p,strong,b')) {
      if (e.childElementCount || res.includes(e) || !ok(e)) continue;
      const cs = getComputedStyle(e);
      if (parseFloat(cs.fontSize) >= 18 && parseInt(cs.fontWeight, 10) >= 600) res.push(e);
    }
    return res;
  }

  function extrairTela() {
    const antes = (a, b) => !!(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);

    // 1) Cada preço vira um item: bloco do item, variação e linhas de texto.
    const brutos = [];
    for (const elPreco of elementosDePreco()) {
      const bloco = blocoDoItem(elPreco);
      let alvo = bloco;
      let variacao = '';
      let ls = linhas(bloco.innerText).filter((l) => !ehLinhaPreco(l) && !ehSelo(l));
      // Bloco pequeno demais (só "Pequena R$ 10"): é uma variação; o item é o pai.
      const pai = bloco.parentElement;
      if (ls.join(' ').length <= 25 && pai && contarPrecos(pai.innerText) >= 2 && contarPrecos(pai.innerText) <= 8) {
        variacao = ls.join(' ').replace(RE_PRECO, '').trim();
        alvo = pai;
        ls = linhas(pai.innerText).filter((l) => !ehLinhaPreco(l) && !ehSelo(l) && !contarPrecos(l));
      }
      const valores = (elPreco.textContent.match(RE_PRECO) || []).map((m) => numeroBR(m));
      // "De R$ 30 por R$ 25": fica o último (preço praticado).
      const preco = valores.length ? valores[valores.length - 1] : null;
      if (preco == null || !ls.length) continue;
      brutos.push({ alvo, variacao, ls, preco });
    }

    // 2) Títulos de seção: fora de qualquer item, em ordem de documento.
    const alvos = [...new Set(brutos.map((b) => b.alvo))];
    const titulos = candidatosTitulo(alvos).sort((a, b) => (antes(a, b) ? -1 : 1));

    // 3) Seção de cada item = último título antes dele.
    const itens = [];
    const vistos = new Set();
    for (const { alvo, variacao, ls, preco } of brutos) {
      const item = ls[0].replace(RE_PRECO, '').trim();
      const descricao = ls.slice(1).filter((l) => l !== variacao).join(' ').replace(RE_PRECO, '').replace(/\s+/g, ' ').trim().slice(0, 300);
      let secao = '';
      for (const t of titulos) { if (antes(t, alvo)) secao = t.innerText.trim(); else break; }
      const chave = `${secao}|${item}|${variacao}|${preco}`;
      if (vistos.has(chave)) continue;
      vistos.add(chave);
      itens.push({ secao_original: secao, item, descricao, variacao, preco, fonte: 'texto da tela' });
    }
    return itens;
  }

  // ---------- montagem e exportação ----------

  let modo = 'auto';
  let ultimo = [];

  function coletar() {
    lerJsonEmbutido();
    const tela = extrairTela();
    const json = [...itensJson.values()];
    const base = modo === 'json' ? json : modo === 'tela' ? tela : (json.length >= tela.length ? json : tela);
    ultimo = base.map((it) => ({
      ...it,
      ...classificar(it),
      exige_preparo: '',
      observacao: '',
      url: location.href,
    }));
    return { tela: tela.length, json: json.length };
  }

  const COLS = ['secao_original', 'item', 'descricao', 'variacao', 'preco', 'categoria', 'subcategoria', 'exige_preparo', 'observacao', 'fonte', 'url'];
  const COLS_B = ['grupo', 'posicao', ...COLS];

  function celula(v) {
    const s = typeof v === 'number' ? String(v).replace('.', ',') : String(v ?? '');
    return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  }

  const csv = (ls, cols) => '﻿' + [cols.join(';'), ...ls.map((l) => cols.map((c) => celula(l[c])).join(';'))].join('\r\n');

  function baixar(nome, conteudo) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([conteudo], { type: 'text/csv;charset=utf-8' }));
    a.download = nome;
    (document.body || document.documentElement).appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 2000);
  }

  function nomeArquivo(sufixo) {
    const site = location.hostname.replace(/^www\./, '').replace(/[^\w.-]/g, '_');
    const caminho = location.pathname.split('/').filter(Boolean).pop() || '';
    return `cardapio_${site}${caminho ? '_' + caminho.replace(/[^\w-]/g, '_').slice(0, 40) : ''}_${sufixo}_${new Date().toISOString().slice(0, 10)}.csv`;
  }

  function planoB() {
    const res = [];
    for (const [grupo, sub] of PLANO_B) {
      ultimo.filter((i) => i.subcategoria === sub && i.preco > 0)
        .sort((a, b) => a.preco - b.preco)
        .slice(0, 2)
        .forEach((i, k) => res.push({ grupo, posicao: k + 1, ...i }));
    }
    return res;
  }

  async function rolarAteOFim() {
    let altura = 0, semMudanca = 0;
    while (semMudanca < 5 && !pararRolagem) {
      window.scrollTo(0, document.documentElement.scrollHeight);
      await new Promise((r) => setTimeout(r, 900));
      const h = document.documentElement.scrollHeight;
      semMudanca = h === altura ? semMudanca + 1 : 0;
      altura = h;
    }
    window.scrollTo(0, 0);
  }
  let pararRolagem = false;

  // ---------- painel (padrão: canto superior direito, shadow DOM, fora do <body>) ----------

  const el = {};
  let hospedeiro = null;

  function criar(tag, props = {}, filhos = []) {
    const n = document.createElement(tag);
    Object.assign(n, props);
    for (const f of filhos) n.appendChild(f);
    return n;
  }

  const CSS_PAINEL = `
    #ccv-painel{position:fixed;top:12px;right:12px;z-index:2147483647;width:340px;
      max-height:calc(100vh - 24px);overflow:auto;box-sizing:border-box;
      background:#fff;color:#111;border:1px solid #ccc;border-radius:10px;
      box-shadow:0 4px 16px rgba(0,0,0,.18);font:13px/1.4 system-ui,sans-serif;padding:10px}
    @media (prefers-color-scheme:dark){#ccv-painel{background:#1e1e1e;color:#eee;border-color:#444}}
    #ccv-painel.min>*:not(header){display:none}
    header{display:flex;justify-content:space-between;align-items:center;font-weight:700;cursor:pointer}
    p{margin:6px 0}
    .linha{display:flex;flex-wrap:wrap;gap:6px;margin:6px 0}
    button{flex:1 1 auto;padding:5px 8px;border-radius:6px;border:1px solid #888;
      background:transparent;color:inherit;cursor:pointer;font:inherit}
    button:disabled{opacity:.4;cursor:default}
    select{font:inherit;color:inherit;background:transparent;border:1px solid #888;border-radius:6px;padding:3px}
    table{width:100%;border-collapse:collapse;font-size:12px;margin-top:6px}
    td,th{padding:3px 4px;border-bottom:1px solid #8885;text-align:left}
    td.n,th.n{text-align:right}
    .status{font-size:12px;opacity:.8}
    .subtitulo{font-weight:700;margin-top:10px}`;

  function tabela(cabecalho, ls) {
    return criar('table', {}, [
      criar('tr', {}, cabecalho.map((c, i) => criar('th', { textContent: c, className: i ? 'n' : '' }))),
      ...ls.map((l) => criar('tr', {}, l.map((c, i) => criar('td', { textContent: String(c), className: i ? 'n' : '' })))),
    ]);
  }

  const brl = (n) => n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  function mostrarResultado(contagem) {
    el.status.textContent = `Dados da página: ${contagem.json} itens · Texto da tela: ${contagem.tela} itens · Usando: ${ultimo[0]?.fonte || '-'} (${ultimo.length}).`;
    const porSecao = new Map();
    for (const i of ultimo) porSecao.set(i.secao_original || '(sem seção)', (porSecao.get(i.secao_original || '(sem seção)') || 0) + 1);
    const porCat = new Map();
    for (const i of ultimo) {
      const k = i.subcategoria ? `${i.categoria} › ${i.subcategoria}` : '(sem categoria)';
      porCat.set(k, (porCat.get(k) || 0) + 1);
    }
    const ordenar = (m) => [...m.entries()].sort((a, b) => b[1] - a[1]);
    const totalCat = [...porCat.values()].reduce((a, b) => a + b, 0);
    el.resultado.replaceChildren(
      criar('p', { className: 'subtitulo', textContent: 'Itens por categoria (Bloco A)' }),
      tabela(['Categoria', 'Itens'], [...ordenar(porCat), ['Total', totalCat]]),
      criar('p', { className: 'subtitulo', textContent: 'Itens por seção do cardápio' }),
      tabela(['Seção', 'Itens'], [...ordenar(porSecao), ['Total', ultimo.length]]),
      criar('p', { className: 'subtitulo', textContent: 'Plano B: 2 mais baratos' }),
      tabela(['Grupo', 'Item', 'R$'], planoB().map((b) => [b.grupo, b.item.slice(0, 28), brl(b.preco)])),
    );
  }

  function montarPainel() {
    el.titulo = criar('span', { textContent: 'Coletor de cardápio' });
    el.status = criar('p', { className: 'status', textContent: 'Clique em "Extrair". Se o cardápio carrega aos poucos, use "Rolar e extrair".' });
    el.resultado = criar('div');
    const seletor = criar('select', { onchange: (e) => { modo = e.target.value; } }, [
      criar('option', { value: 'auto', textContent: 'Fonte: automática' }),
      criar('option', { value: 'json', textContent: 'Fonte: dados da página' }),
      criar('option', { value: 'tela', textContent: 'Fonte: texto da tela' }),
    ]);
    const extrair = () => mostrarResultado(coletar());
    const bExtrair = criar('button', { textContent: 'Extrair', onclick: extrair });
    const bRolar = criar('button', {
      textContent: 'Rolar e extrair',
      onclick: async () => {
        bRolar.disabled = true; pararRolagem = false;
        el.status.textContent = 'Rolando a página…';
        await rolarAteOFim();
        bRolar.disabled = false;
        extrair();
      },
    });
    const exigeDados = (fn) => () => { if (!ultimo.length) extrair(); if (ultimo.length) fn(); else el.status.textContent = 'Nenhum item encontrado.'; };
    const bCompleto = criar('button', { textContent: 'CSV completo', onclick: exigeDados(() => baixar(nomeArquivo('completo'), csv(ultimo, COLS))) });
    const bPlanoB = criar('button', { textContent: 'CSV plano B (2 mais baratos)', onclick: exigeDados(() => baixar(nomeArquivo('planoB'), csv(planoB(), COLS_B))) });

    const minimizar = criar('span', { textContent: '+' });
    const cabecalho = criar('header', {}, [el.titulo, minimizar]);
    const painel = criar('div', { id: 'ccv-painel', className: 'min' }, [
      cabecalho,
      criar('div', { className: 'linha' }, [seletor]),
      criar('div', { className: 'linha' }, [bExtrair, bRolar]),
      criar('div', { className: 'linha' }, [bCompleto, bPlanoB]),
      el.status,
      el.resultado,
    ]);
    cabecalho.onclick = () => { painel.classList.toggle('min'); minimizar.textContent = painel.classList.contains('min') ? '+' : '–'; };

    hospedeiro = criar('div', { id: 'ccv-hospedeiro' });
    const raiz = hospedeiro.attachShadow({ mode: 'open' });
    raiz.appendChild(criar('style', { textContent: CSS_PAINEL }));
    raiz.appendChild(painel);
  }

  // Só mostra o painel em páginas com cara de cardápio; depois de aparecer, é
  // reposto se a página o remover.
  let pareceCardapio = false;
  let tentativas = 0;

  function verificar() {
    if (!document.body) return;
    if (!pareceCardapio) {
      // Procura por 45 s; depois desiste, para não pesar em sites que não são cardápio.
      if (++tentativas > 30) return;
      lerJsonEmbutido();
      pareceCardapio = itensJson.size >= 5 || contarPrecos(document.body.innerText) >= 5;
      if (!pareceCardapio) return;
      console.info('[Coletor de cardápio] página com cara de cardápio');
    }
    if (!hospedeiro) montarPainel();
    if (!hospedeiro.isConnected) document.documentElement.appendChild(hospedeiro);
  }

  console.info('[Coletor de cardápio] carregado');
  setInterval(() => { try { verificar(); } catch (e) { console.error('[Coletor de cardápio]', e); } }, 1500);
})();
