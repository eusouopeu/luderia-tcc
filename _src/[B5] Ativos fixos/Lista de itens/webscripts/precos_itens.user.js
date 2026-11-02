// ==UserScript==
// @name         Coletor de preços dos itens (TCC Luderia)
// @namespace    tcc-luderia
// @version      2026.11.02-1
// @description  Lê as ofertas das buscas e páginas de produto (Amazon, Mercado Livre, Magalu, Leroy Merlin e lojas com dados estruturados), filtra as que correspondem ao item da lista da etapa 1 e exporta CSV por categoria.
// @match        https://www.amazon.com.br/*
// @match        https://lista.mercadolivre.com.br/*
// @match        https://www.mercadolivre.com.br/*
// @match        https://produto.mercadolivre.com.br/*
// @match        https://www.magazineluiza.com.br/*
// @match        https://www.leroymerlin.com.br/*
// @run-at       document-idle
// @noframes
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// ==/UserScript==

/*
 * Uso pessoal, para o Bloco B5 (ativos fixos): preço de mobiliário, cozinha e bar, caixa e
 * informática e dos itens da reforma sem composição no SINAPI (premissas I01 a I04 do cap. 9).
 * Os sites bloqueiam requisições fora do navegador, por isso a coleta roda na página.
 *
 * Como usar:
 *  1. Escolher o item no painel (a lista vem de "[B5] Lista de Itens da Etapa 1", só os de
 *     fonte "coleta") e clicar em "Buscar aqui": abre a busca do site com o termo do item.
 *  2. "Ler ofertas": o painel lista as ofertas da página com preço e frete; já vêm marcadas
 *     as que têm no título metade ou mais das palavras do termo e não são patrocinadas.
 *     Desmarcar o que não é o item (outro tamanho, peça avulsa, acessório).
 *  3. Se o anúncio vende em caixa ou jogo (pratos, copos), informar as unidades por
 *     embalagem: o preço guardado é o da unidade da lista.
 *  4. "Guardar marcadas". Repetir em outros sites e itens; os dados ficam no Tampermonkey
 *     (comuns a todos os sites) até "Limpar".
 *  5. "Baixar CSV": um arquivo por categoria, AAAA-MM-DD_<categoria>_precos.csv, para
 *     dados/[B5] Ativos fixos/_dados-brutos/<categoria>/. Depois, rodar
 *     build/B5-b_orcamento_itens.py.
 *  Em página de produto, "Ler ofertas" lê o produto pelo JSON-LD (schema.org Product).
 *
 * Leitura por site:
 *  - Amazon: cards [data-component-type="s-search-result"] (preço em .a-price .a-offscreen,
 *    sem o riscado; frete em "Entrega R$ X" ou "GRÁTIS"; link canônico /dp/<ASIN>).
 *  - Mercado Livre: cards .poly-card (preço atual em .poly-price__current).
 *  - Demais: JSON-LD (Product ou ItemList) e, sem ele, leitura genérica: cada preço
 *    "R$ X" da página sobe até o bloco com um único link de produto; o preço da oferta é o
 *    menor do bloco, sem parcelas ("10x de R$ 50").
 *  Conferido em 02/11/2026 na Amazon (busca) e na Leroy Merlin (busca, pela leitura genérica,
 *  e produto, pelo JSON-LD). Mercado Livre e Magalu bloquearam o navegador de teste
 *  (verificação de conta): os seletores do Mercado Livre não foram conferidos; se não lerem,
 *  valem o JSON-LD e a leitura genérica.
 *  O frete depende do CEP do navegador: usar um CEP de Salvador. Frete vazio = o card não
 *  informa (o build conta como 0); 0 = frete grátis.
 *
 * Saída: CSV com ";" e UTF-8 com BOM. Colunas id_item; categoria; fonte; produto; preco;
 * frete; preco_anuncio; unidades; url; busca; data_coleta. preco = preco_anuncio ÷ unidades.
 */

(function () {
  'use strict';

  const NOME = '[Preços]';
  const CHAVE = 'tcc_precos_v1';
  const CHAVE_ITEM = 'tcc_precos_item';

  // Itens de fonte "coleta" da lista da etapa 1: [id, categoria, item, termo de busca].
  // O teste (precos_itens.test.cjs) confere esta lista com o CSV.
  const ITENS = [
    ['OB40', 'obra_reforma', 'Ar-condicionado split', 'ar condicionado split 30000 btus inverter'],
    ['OB41', 'obra_reforma', 'Instalação do split', 'instalação ar condicionado split 30000 salvador'],
    ['OB42', 'obra_reforma', 'Letreiro de fachada', 'letreiro fachada acm iluminado'],
    ['MO01', 'mobiliario', 'Mesa de jogo para 6 lugares', 'mesa retangular 160x90 restaurante'],
    ['MO02', 'mobiliario', 'Mesa de jogo para 4 lugares', 'mesa quadrada 90x90 restaurante'],
    ['MO03', 'mobiliario', 'Cadeira', 'cadeira restaurante estofada'],
    ['MO04', 'mobiliario', 'Luminária pendente sobre a mesa', 'luminaria pendente led mesa'],
    ['MO05', 'mobiliario', 'Estante do acervo', 'estante industrial madeira metal 5 prateleiras'],
    ['MO06', 'mobiliario', 'Balcão de atendimento e caixa', 'balcão de atendimento caixa loja mdf'],
    ['MO07', 'mobiliario', 'Armário de funcionários', 'roupeiro aço 8 portas'],
    ['CB01', 'cozinha_bar', 'Fogão industrial', 'fogao industrial 4 bocas com forno'],
    ['CB02', 'cozinha_bar', 'Chapa bifeteira', 'chapa bifeteira industrial gas 70cm'],
    ['CB03', 'cozinha_bar', 'Fritadeira', 'fritadeira industrial 2 cubas'],
    ['CB04', 'cozinha_bar', 'Forno elétrico de bancada', 'forno eletrico industrial bancada'],
    ['CB05', 'cozinha_bar', 'Coifa com exaustor', 'coifa industrial inox 150 cm exaustor'],
    ['CB06', 'cozinha_bar', 'Geladeira comercial', 'refrigerador comercial 4 portas'],
    ['CB07', 'cozinha_bar', 'Freezer horizontal', 'freezer horizontal 2 tampas 400 litros'],
    ['CB08', 'cozinha_bar', 'Expositor de bebidas', 'expositor vertical bebidas porta vidro'],
    ['CB09', 'cozinha_bar', 'Mesa de inox', 'mesa inox 150 cm cozinha industrial'],
    ['CB10', 'cozinha_bar', 'Pia industrial', 'pia inox industrial 2 cubas'],
    ['CB11', 'cozinha_bar', 'Liquidificador industrial', 'liquidificador industrial 4 litros'],
    ['CB12', 'cozinha_bar', 'Multiprocessador', 'processador de alimentos industrial'],
    ['CB13', 'cozinha_bar', 'Micro-ondas', 'micro-ondas 30 litros'],
    ['CB14', 'cozinha_bar', 'Kit de gás', 'botijao p45 com regulador'],
    ['CB15', 'cozinha_bar', 'Utensílios de cozinha', 'kit cozinha industrial panelas cubas gastronomicas'],
    ['CB16', 'cozinha_bar', 'Pratos', 'prato raso restaurante'],
    ['CB17', 'cozinha_bar', 'Copos', 'copo vidro long drink caixa'],
    ['CB18', 'cozinha_bar', 'Talheres', 'faqueiro restaurante inox'],
    ['CB19', 'cozinha_bar', 'Estante de aço', 'estante aço 5 prateleiras'],
    ['CB20', 'cozinha_bar', 'Lava-louças', 'lava louças industrial capota'],
    ['EQ01', 'equipamentos', 'Computador', 'notebook core i5 8gb ssd'],
    ['EQ02', 'equipamentos', 'Impressora de NFC-e', 'impressora termica nao fiscal 80mm'],
    ['EQ03', 'equipamentos', 'Maquininha de cartão', 'maquininha de cartão'],
    ['EQ04', 'equipamentos', 'Roteador Wi-Fi', 'roteador wifi 6 dual band'],
    ['EQ05', 'equipamentos', 'Som ambiente', 'caixa de som amplificada ambiente'],
    ['EQ06', 'equipamentos', 'Câmeras', 'kit cftv 4 cameras dvr'],
  ].map(([id, categoria, item, termo]) => ({ id, categoria, item, termo }));

  // ---------- leitura de texto ----------

  const semAcento = (t) => String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const limpar = (t) => String(t || '').replace(/\s+/g, ' ').trim();
  const RE_PRECO = /^R\$\s?\d[\d.]*(?:,\d{2})?$/;

  // "R$ 1.234,56" -> 1234.56; "R$1.058" -> 1058
  function numeroBR(txt) {
    const m = String(txt ?? '').match(/\d[\d.]*(?:,\d+)?/);
    if (!m) return null;
    const n = parseFloat(m[0].replace(/\./g, '').replace(',', '.'));
    return Number.isFinite(n) ? n : null;
  }

  // Frete do texto do card: 0 se grátis, valor se "Entrega/Frete R$ X", null se não informa.
  function freteDe(texto) {
    const t = semAcento(texto);
    if (/(frete|entrega)\s*(e\s*)?gratis|gratis.{0,20}(frete|entrega)/.test(t)) return 0;
    const m = String(texto || '').match(/(?:Frete|Entrega)[^R]{0,15}R\$\s?([\d.,]+)/i);
    return m ? numeroBR(m[1]) : null;
  }

  // Preço atual entre os preços de um bloco: tira as parcelas ("10x de R$ 50") e fica com o
  // menor (o riscado "De: R$ X" é sempre maior). precos = [{ valor, contexto }].
  function precoAtual(precos) {
    const validos = precos
      .filter((p) => !/\d+\s*x\s*(de\s*)?R\$/i.test(p.contexto || ''))
      .map((p) => p.valor)
      .filter((v) => v > 0);
    return validos.length ? Math.min(...validos) : null;
  }

  // Parte das palavras do termo (4 letras ou mais, ou números) presentes no título.
  function relevancia(titulo, termo) {
    const t = semAcento(titulo);
    const palavras = semAcento(termo).split(/[^a-z0-9]+/).filter((p) => p.length >= 4 || /\d/.test(p));
    if (!palavras.length) return 0;
    return palavras.filter((p) => t.includes(p)).length / palavras.length;
  }

  // Ofertas de um JSON-LD (Product, ItemList de Product, ou listas e @graph com eles).
  function ofertasJsonLd(json, saida = []) {
    if (!json || typeof json !== 'object') return saida;
    if (Array.isArray(json)) { json.forEach((x) => ofertasJsonLd(x, saida)); return saida; }
    const tipo = [].concat(json['@type'] || []).join(' ');
    if (/\bProduct\b/.test(tipo)) {
      const ofertas = [].concat(json.offers || []);
      const precos = ofertas.flatMap((o) => [o.price, o.lowPrice, o.priceSpecification?.price]).map(Number).filter((v) => v > 0);
      if (precos.length) saida.push({ produto: limpar(json.name), preco: Math.min(...precos), url: json.url || json.offers?.url || '', frete: null, patrocinado: false });
      return saida;
    }
    if (json['@graph']) ofertasJsonLd(json['@graph'], saida);
    if (json.itemListElement) ofertasJsonLd([].concat(json.itemListElement).map((e) => e.item || e), saida);
    return saida;
  }

  // ---------- site, busca e armazenamento ----------

  function siteDe(host) {
    if (/amazon\.com\.br$/.test(host)) return 'amazon';
    if (/mercadolivre\.com\.br$/.test(host)) return 'mercadolivre';
    if (/magazineluiza\.com\.br$/.test(host)) return 'magalu';
    if (/leroymerlin\.com\.br$/.test(host)) return 'leroymerlin';
    return host.replace(/^www\./, '').split('.')[0];
  }

  function urlBusca(site, termo) {
    const q = encodeURIComponent(termo);
    if (site === 'amazon') return `https://www.amazon.com.br/s?k=${q}`;
    if (site === 'mercadolivre') return `https://lista.mercadolivre.com.br/${semAcento(termo).replace(/[^a-z0-9]+/g, '-')}`;
    if (site === 'magalu') return `https://www.magazineluiza.com.br/busca/${q}/`;
    if (site === 'leroymerlin') return `https://www.leroymerlin.com.br/search?term=${q}`;
    return '';
  }

  const carregar = () => { try { return JSON.parse(GM_getValue(CHAVE, '{}')); } catch (e) { return {}; } };
  const salvar = (d) => GM_setValue(CHAVE, JSON.stringify(d));

  // Junta as ofertas marcadas às guardadas (chave: item + url); devolve quantas são novas.
  function guardar(guardados, item, ofertas, unidades, contexto) {
    let novas = 0;
    const u = Math.max(1, Number(unidades) || 1);
    for (const o of ofertas) {
      if (!o.url || !(o.preco > 0)) continue;
      const k = `${item.id}|${o.url}`;
      if (!guardados[k]) novas++;
      guardados[k] = {
        id_item: item.id, categoria: item.categoria, fonte: contexto.fonte, produto: o.produto,
        preco: Math.round((o.preco / u) * 100) / 100, frete: o.frete == null ? null : Math.round((o.frete / u) * 100) / 100,
        preco_anuncio: o.preco, unidades: u, url: o.url, busca: contexto.busca, data_coleta: contexto.data_coleta,
      };
    }
    return novas;
  }

  const COLS = ['id_item', 'categoria', 'fonte', 'produto', 'preco', 'frete', 'preco_anuncio', 'unidades', 'url', 'busca', 'data_coleta'];

  function celula(v) {
    const s = typeof v === 'number' ? String(v).replace('.', ',') : String(v ?? '');
    return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  }

  const csv = (ls) => '﻿' + [COLS.join(';'), ...ls.map((l) => COLS.map((c) => celula(l[c])).join(';'))].join('\r\n');

  const dataLocal = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  // AAAA-MM-DD_<categoria>_precos.csv (o build lê _dados-brutos/*/*_precos.csv)
  const nomeArquivo = (categoria, data) => `${data}_${categoria}_precos.csv`;

  // ---------- leitura da página (DOM) ----------

  const texto = (raiz, sel) => limpar(raiz.querySelector(sel)?.textContent);

  function lerAmazon() {
    return [...document.querySelectorAll('[data-component-type="s-search-result"][data-asin]')].map((c) => {
      const asin = c.dataset.asin;
      const precoTxt = c.querySelector('.a-price:not(.a-text-price) .a-offscreen')?.textContent;
      return {
        produto: texto(c, 'h2'),
        preco: numeroBR(precoTxt),
        frete: freteDe(c.textContent),
        url: asin ? `https://www.amazon.com.br/dp/${asin}` : '',
        patrocinado: /patrocinado/i.test(c.textContent) || c.classList.contains('AdHolder'),
      };
    });
  }

  function lerMercadoLivre() {
    return [...document.querySelectorAll('.poly-card')].map((c) => {
      const a = c.querySelector('a.poly-component__title, .poly-component__title a, h3 a') || c.querySelector('a');
      const atual = c.querySelector('.poly-price__current');
      const fracao = atual?.querySelector('.andes-money-amount__fraction')?.textContent || '';
      const centavos = atual?.querySelector('.andes-money-amount__cents')?.textContent || '00';
      return {
        produto: limpar(a?.textContent),
        preco: fracao ? numeroBR(`${fracao},${centavos}`) : null,
        frete: freteDe(texto(c, '.poly-component__shipping')),
        url: String(a?.href || '').split(/[?#]/)[0],
        patrocinado: /patrocinado/i.test(texto(c, '.poly-component__ads-promotions, .poly-component__ads')),
      };
    });
  }

  function lerJsonLd() {
    const saida = [];
    for (const s of document.querySelectorAll('script[type="application/ld+json"]')) {
      try { ofertasJsonLd(JSON.parse(s.textContent), saida); } catch (e) { /* JSON-LD inválido */ }
    }
    return saida.map((o) => ({ ...o, url: o.url ? new URL(o.url, location.href).href.split(/[?#]/)[0] : location.href.split(/[?#]/)[0] }));
  }

  const RE_LINK_FORA = /carrinho|cart|login|conta|account|javascript:|\/(search|busca|s)(\/|$)/i;

  function lerGenerico() {
    const folhas = [...document.body.querySelectorAll('*')].filter((e) => e.childElementCount === 0 && RE_PRECO.test(limpar(e.textContent)) && !e.closest('#cpi-hospedeiro'));
    const vistos = new Map();
    for (const f of folhas) {
      let bloco = null;
      for (let n = f.parentElement, i = 0; n && n !== document.body && i < 8; n = n.parentElement, i++) {
        const links = [...new Set([...n.querySelectorAll('a[href]')].map((a) => a.href.split(/[?#]/)[0]).filter((h) => !RE_LINK_FORA.test(h)))];
        if (links.length > 1) break;
        if (links.length === 1 && n.innerText.length > 30) bloco = { n, url: links[0] };
      }
      if (!bloco || vistos.has(bloco.url)) continue;
      const precos = [...bloco.n.querySelectorAll('*')]
        .filter((e) => e.childElementCount === 0 && RE_PRECO.test(limpar(e.textContent)))
        .map((e) => ({ valor: numeroBR(e.textContent), contexto: limpar(e.parentElement?.textContent) }));
      const titulos = [...bloco.n.querySelectorAll('a[href], img[alt], h2, h3')]
        .map((e) => limpar(e.title || e.alt || e.innerText))
        .filter((t) => t.length > 10 && !/^R\$/.test(t))
        .sort((x, y) => y.length - x.length);
      vistos.set(bloco.url, { produto: titulos[0] || '', preco: precoAtual(precos), frete: freteDe(bloco.n.innerText), url: bloco.url, patrocinado: /patrocinad/i.test(bloco.n.innerText) });
    }
    return [...vistos.values()];
  }

  function lerOfertas(site) {
    let ofertas = site === 'amazon' ? lerAmazon() : site === 'mercadolivre' ? lerMercadoLivre() : [];
    if (!ofertas.length) ofertas = lerJsonLd();
    if (!ofertas.length) ofertas = lerGenerico();
    return ofertas.filter((o) => o.url && o.preco > 0 && o.produto);
  }

  // ---------- coleta ----------

  const site = siteDe(location.hostname);
  let ofertasLidas = [];

  const itemAtual = () => ITENS.find((i) => i.id === GM_getValue(CHAVE_ITEM, ITENS[0].id)) || ITENS[0];

  function baixarCsv() {
    const porCategoria = {};
    for (const l of Object.values(carregar())) (porCategoria[l.categoria] ||= []).push(l);
    Object.entries(porCategoria).forEach(([categoria, linhas], i) => setTimeout(() => {
      linhas.sort((a, b) => a.id_item.localeCompare(b.id_item) || a.preco - b.preco);
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([csv(linhas)], { type: 'text/csv;charset=utf-8' }));
      a.download = nomeArquivo(categoria, dataLocal());
      (document.body || document.documentElement).appendChild(a);
      a.click();
      setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 2000);
    }, i * 800));
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

  const CSS_PAINEL = `
    #cpi-painel{position:fixed;top:12px;right:12px;z-index:2147483647;width:340px;
      max-height:calc(100vh - 24px);overflow:auto;box-sizing:border-box;
      background:#fff;color:#111;border:1px solid #ccc;border-radius:10px;
      box-shadow:0 4px 16px rgba(0,0,0,.18);font:13px/1.4 system-ui,sans-serif;padding:10px}
    @media (prefers-color-scheme:dark){#cpi-painel{background:#1e1e1e;color:#eee;border-color:#444}}
    #cpi-painel.min>*:not(header){display:none}
    header{display:flex;justify-content:space-between;align-items:center;font-weight:700;cursor:pointer}
    p{margin:6px 0}
    .linha{display:flex;flex-wrap:wrap;gap:6px;margin:6px 0;align-items:center}
    button{flex:1 1 auto;padding:5px 8px;border-radius:6px;border:1px solid #888;
      background:transparent;color:inherit;cursor:pointer;font:inherit}
    button:disabled{opacity:.4;cursor:default}
    select,input{font:inherit;color:inherit;background:transparent;border:1px solid #888;border-radius:6px;padding:3px}
    select{width:100%} select option{color:#111}
    input[type=number]{width:52px}
    ul{list-style:none;margin:6px 0;padding:0;max-height:45vh;overflow:auto}
    li{display:flex;gap:6px;align-items:flex-start;padding:3px 0;border-bottom:1px solid rgba(128,128,128,.25);font-size:12px}
    li span{flex:1} li b{white-space:nowrap}
    .status{font-size:12px;opacity:.8}`;

  const status = (t) => { if (el.status) el.status.textContent = t; };

  function mostrar(t) {
    const guardados = Object.values(carregar());
    const item = itemAtual();
    const doItem = guardados.filter((l) => l.id_item === item.id).length;
    const itensComPreco = new Set(guardados.map((l) => l.id_item)).size;
    el.contagem.textContent = `${doItem} ofertas deste item · ${itensComPreco} de ${ITENS.length} itens com preço · ${guardados.length} no total`;
    if (t) status(t);
  }

  function listarOfertas() {
    const item = itemAtual();
    el.lista.replaceChildren(...ofertasLidas.map((o, i) => {
      const marca = criar('input', { type: 'checkbox', checked: !o.patrocinado && relevancia(o.produto, item.termo) >= 0.5 });
      marca.dataset.i = i;
      const frete = o.frete == null ? '' : o.frete === 0 ? ' + frete grátis' : ` + R$ ${o.frete.toFixed(2)}`;
      return criar('li', {}, [marca, criar('span', { textContent: `${o.patrocinado ? '[patrocinado] ' : ''}${o.produto}` }),
        criar('b', { textContent: `R$ ${o.preco.toFixed(2)}${frete}` })]);
    }));
    el.bGuardar.disabled = !ofertasLidas.length;
  }

  function montarPainel() {
    el.item = criar('select', {
      onchange: () => { GM_setValue(CHAVE_ITEM, el.item.value); ofertasLidas = []; listarOfertas(); mostrar(); },
    }, ITENS.map((i) => criar('option', { value: i.id, textContent: `${i.id} · ${i.item}` })));
    el.item.value = itemAtual().id;
    el.contagem = criar('p');
    el.status = criar('p', { className: 'status', textContent: 'Escolha o item, busque e leia as ofertas.' });
    el.unidades = criar('input', { type: 'number', min: 1, value: 1 });
    el.lista = criar('ul');
    const bBuscar = criar('button', {
      textContent: 'Buscar aqui',
      disabled: !urlBusca(site, 'x'),
      onclick: () => { location.href = urlBusca(site, itemAtual().termo); },
    });
    const bLer = criar('button', {
      textContent: 'Ler ofertas',
      onclick: () => {
        ofertasLidas = lerOfertas(site).slice(0, 40);
        listarOfertas();
        const marcadas = el.lista.querySelectorAll('input:checked').length;
        status(ofertasLidas.length ? `${ofertasLidas.length} ofertas lidas, ${marcadas} marcadas pelo termo. Desmarque o que não é o item.` : 'Nenhuma oferta com preço nesta página.');
      },
    });
    el.bGuardar = criar('button', {
      textContent: 'Guardar marcadas',
      disabled: true,
      onclick: () => {
        const marcadas = [...el.lista.querySelectorAll('input:checked')].map((m) => ofertasLidas[m.dataset.i]);
        const guardados = carregar();
        const novas = guardar(guardados, itemAtual(), marcadas, el.unidades.value,
          { fonte: site, busca: location.href, data_coleta: dataLocal() });
        salvar(guardados);
        mostrar(`${marcadas.length} guardadas (${novas} novas).`);
      },
    });
    const bCsv = criar('button', { textContent: 'Baixar CSV', onclick: baixarCsv });
    const bLimpar = criar('button', {
      textContent: 'Limpar',
      onclick: () => {
        if (!confirm('Apagar todas as ofertas guardadas? Baixe o CSV antes.')) return;
        GM_deleteValue(CHAVE);
        mostrar('Guardadas apagadas.');
      },
    });

    const minimizar = criar('span', { textContent: '–' });
    const cabecalho = criar('header', {}, [criar('span', { textContent: `Preços · ${site}` }), minimizar]);
    const painel = criar('div', { id: 'cpi-painel' }, [
      cabecalho,
      el.item,
      el.contagem,
      criar('div', { className: 'linha' }, [bBuscar, bLer]),
      el.lista,
      criar('div', { className: 'linha' }, [criar('span', { textContent: 'Unidades por embalagem:' }), el.unidades, el.bGuardar]),
      criar('div', { className: 'linha' }, [bCsv, bLimpar]),
      el.status,
    ]);
    cabecalho.onclick = () => { painel.classList.toggle('min'); minimizar.textContent = painel.classList.contains('min') ? '+' : '–'; };

    hospedeiro = criar('div', { id: 'cpi-hospedeiro' });
    const raiz = hospedeiro.attachShadow({ mode: 'open' });
    raiz.appendChild(criar('style', { textContent: CSS_PAINEL }));
    raiz.appendChild(painel);
    mostrar();
  }

  // O painel é reposto se o site refizer a página.
  function verificar() {
    if (!document.body) return;
    if (!hospedeiro) montarPainel();
    if (!hospedeiro.isConnected) document.documentElement.appendChild(hospedeiro);
  }

  console.info(NOME, 'carregado');
  setInterval(() => { try { verificar(); } catch (e) { console.error(NOME, e); } }, 1500);
})();
