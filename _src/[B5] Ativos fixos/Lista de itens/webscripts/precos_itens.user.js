// ==UserScript==
// @name         Coletor de preços dos itens (TCC Luderia)
// @namespace    tcc-luderia
// @version      2026.11.02-2
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
 *  1. Informar o CEP de Salvador usado no site (o frete depende dele) e escolher o item no
 *     painel (a lista vem de "[B5] Lista de Itens da Etapa 1", só os de fonte "coleta").
 *     "Buscar aqui" abre a busca do site com o termo do item.
 *  2. "Ler ofertas": o painel lista as ofertas da página com preço, frete e tipo de preço; já
 *     vêm marcadas as que têm no título metade ou mais das palavras do termo e não são
 *     patrocinadas. Desmarcar o que não é o item (outro tamanho, peça avulsa, acessório).
 *     "Somar página" acrescenta as ofertas de outra página ou das que carregaram ao rolar.
 *  3. Se o anúncio vende em caixa ou jogo (pratos, copos), informar as unidades por
 *     embalagem: o preço guardado é o da unidade da lista.
 *  4. "Guardar marcadas". Repetir em outros sites e itens; os dados ficam no Tampermonkey
 *     (comuns a todos os sites). "Guardadas deste item" lista as ofertas do item, com ✕ para
 *     excluir uma: a exclusão vai no CSV (excluida = 1) e o build a respeita.
 *  5. "Baixar CSV": um arquivo por categoria, AAAA-MM-DD_HHmm_<categoria>_precos.csv, com
 *     tudo o que está guardado, para dados/[B5] Ativos fixos/_dados-brutos/<categoria>/.
 *     Depois, rodar build/B5-b_orcamento_itens.py, que junta os arquivos e fica, para cada
 *     item e URL, com a linha do arquivo mais recente. "Limpar" baixa antes um backup JSON.
 *  Em página de produto, "Ler ofertas" lê o produto pelo JSON-LD (schema.org Product).
 *
 * Leitura por site:
 *  - Amazon: cards [data-component-type="s-search-result"] (preço em .a-price .a-offscreen,
 *    sem o riscado; frete em "Entrega R$ X" ou "GRÁTIS"; link canônico /dp/<ASIN>). O preço
 *    do card costuma ser o do Pix ("à vista no Pix ou NuPay"): tipo_preco = pix.
 *  - Mercado Livre: cards .poly-card (preço atual em .poly-price__current).
 *  - Demais: JSON-LD (Product ou ItemList) e, sem ele, leitura genérica: cada preço
 *    "R$ X" da página sobe até o bloco com um único link de produto; o preço da oferta é o
 *    menor do bloco, sem parcelas ("10x de R$ 50").
 *  Conferido em 02/11/2026 na Amazon (busca) e na Leroy Merlin (busca, pela leitura genérica,
 *  e produto, pelo JSON-LD); trechos dessas páginas ficam em outros/fixtures_html/ e entram no
 *  teste. Mercado Livre e Magalu bloquearam o navegador de teste (verificação de conta): os
 *  seletores do Mercado Livre só têm fixture sintética; se não lerem, valem o JSON-LD e a
 *  leitura genérica.
 *  Frete vazio = o card não informa (o build estima); 0 = frete grátis.
 *
 * Saída: CSV com ";" e UTF-8 com BOM. Colunas id_item; categoria; fonte; produto; preco;
 * frete; preco_anuncio; unidades; tipo_preco (padrao, pix ou cupom); cep; url; busca;
 * data_coleta; excluida (0 ou 1). preco = preco_anuncio ÷ unidades.
 */

(function () {
  'use strict';

  const NOME = '[Preços]';
  const CHAVE = 'tcc_precos_v1';
  const CHAVE_ITEM = 'tcc_precos_item';
  const CHAVE_CEP = 'tcc_precos_cep';
  const MIN_OFERTAS = 3; // o build usa P25, mediana e P75: abaixo disso o item fica frágil

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
  const visivel = (n) => (n ? n.innerText ?? n.textContent ?? '' : '');
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

  // Condição do preço lido, pelo texto em volta: pix (à vista no Pix), cupom ou padrao. Sem
  // \b: spans colados viram "no pix04x de" no texto do bloco.
  function tipoPreco(contexto) {
    const t = semAcento(contexto);
    if (/(^|[^a-z])pix(?![a-z])|nupay/.test(t)) return 'pix';
    if (/cupom|cupao/.test(t)) return 'cupom';
    return 'padrao';
  }

  // Palavras comparáveis: sem acento, milhar sem ponto ("30.000" -> "30000"), medida junta
  // ("160 x 90" e "160cm x 90cm" -> "160x90") e número separado da unidade ("513L" -> "513 l", "70cm" -> "70 cm").
  function palavras(t) {
    return semAcento(t)
      .replace(/(\d)\.(\d{3})\b/g, '$1$2')
      .replace(/(\d)\s*(?:mm|cm|m)?\s*x\s*(?=\d)/g, '$1x')
      .replace(/(\d)(?!x\d)([a-z]+)/g, '$1 $2')
      .split(/[^a-z0-9]+/)
      .filter(Boolean);
  }

  // Parte das palavras do termo (4 letras ou mais, ou com número) presentes no título. Palavra
  // com número só vale inteira ("4" não casa com "40"); as demais aceitam plural ("mesa", "mesas").
  function relevancia(titulo, termo) {
    // a medida do título também vale por partes: "150x70x90" contém o "150" do termo
    const doTitulo = palavras(titulo).flatMap((w) => (/^\d+(x\d+)+$/.test(w) ? [w, ...w.split('x')] : [w]));
    const doTermo = palavras(termo).filter((p) => p.length >= 4 || /\d/.test(p));
    if (!doTermo.length) return 0;
    const casa = (p) => doTitulo.some((w) => (/\d/.test(p) ? w === p : w === p || w.startsWith(p) || (w.length >= 4 && p.startsWith(w))));
    return doTermo.filter(casa).length / doTermo.length;
  }

  // CEP de um texto ("Salvador 40170-110" -> "40170-110") e se é de Salvador (40000 a 42599).
  function cepDe(texto) {
    const m = String(texto || '').match(/\b(\d{5})-?(\d{3})\b/);
    return m ? `${m[1]}-${m[2]}` : '';
  }
  const ehSalvador = (cep) => { const n = parseInt(String(cep).slice(0, 5), 10); return n >= 40000 && n <= 42599; };

  // Ofertas de um JSON-LD (Product, ItemList de Product, ou listas e @graph com eles).
  function ofertasJsonLd(json, saida = []) {
    if (!json || typeof json !== 'object') return saida;
    if (Array.isArray(json)) { json.forEach((x) => ofertasJsonLd(x, saida)); return saida; }
    const tipo = [].concat(json['@type'] || []).join(' ');
    if (/\bProduct\b/.test(tipo)) {
      const ofertas = [].concat(json.offers || []);
      const precos = ofertas.flatMap((o) => [o.price, o.lowPrice, o.priceSpecification?.price]).map(Number).filter((v) => v > 0);
      if (precos.length) saida.push({ produto: limpar(json.name), preco: Math.min(...precos), url: json.url || json.offers?.url || '', frete: null, patrocinado: false, tipo_preco: 'padrao' });
      return saida;
    }
    if (json['@graph']) ofertasJsonLd(json['@graph'], saida);
    if (json.itemListElement) ofertasJsonLd([].concat(json.itemListElement).map((e) => e.item || e), saida);
    return saida;
  }

  const mediana = (vs) => {
    const s = vs.filter((v) => Number.isFinite(v)).sort((a, b) => a - b);
    if (!s.length) return null;
    const m = Math.floor(s.length / 2);
    return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
  };

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
  const chave = (idItem, url) => `${idItem}|${url}`;

  // Junta as ofertas marcadas às guardadas (chave: item + url); devolve quantas são novas.
  // Guardar de novo uma oferta excluída a traz de volta.
  function guardar(guardados, item, ofertas, unidades, contexto) {
    let novas = 0;
    const u = Math.max(1, Number(unidades) || 1);
    for (const o of ofertas) {
      if (!o.url || !(o.preco > 0)) continue;
      const k = chave(item.id, o.url);
      if (!guardados[k] || guardados[k].excluida) novas++;
      guardados[k] = {
        id_item: item.id, categoria: item.categoria, fonte: contexto.fonte, produto: o.produto,
        preco: Math.round((o.preco / u) * 100) / 100, frete: o.frete == null ? null : Math.round((o.frete / u) * 100) / 100,
        preco_anuncio: o.preco, unidades: u, tipo_preco: o.tipo_preco || 'padrao', cep: contexto.cep || '',
        url: o.url, busca: o.busca || contexto.busca, data_coleta: contexto.data_coleta, excluida: 0,
      };
    }
    return novas;
  }

  // Exclusão lógica: a linha fica guardada e sai no CSV com excluida = 1, para o build
  // descartar também as cópias de exportações anteriores.
  function excluir(guardados, k) {
    if (!guardados[k]) return false;
    guardados[k].excluida = 1;
    return true;
  }

  const ativas = (guardados) => Object.values(guardados).filter((l) => !l.excluida);

  // Atestado de um item: ofertas ativas, sites, mediana e faixa do preço mais frete, fretes sem
  // informação e preços de Pix ou cupom.
  function resumoItem(guardados, idItem) {
    const ls = ativas(guardados).filter((l) => l.id_item === idItem);
    const totais = ls.map((l) => l.preco + (l.frete || 0));
    return {
      n: ls.length,
      sites: new Set(ls.map((l) => l.fonte)).size,
      mediana: mediana(totais),
      min: ls.length ? Math.min(...totais) : null,
      max: ls.length ? Math.max(...totais) : null,
      semFrete: ls.filter((l) => l.frete == null).length,
      pixCupom: ls.filter((l) => l.tipo_preco && l.tipo_preco !== 'padrao').length,
    };
  }

  const COLS = ['id_item', 'categoria', 'fonte', 'produto', 'preco', 'frete', 'preco_anuncio', 'unidades', 'tipo_preco', 'cep', 'url', 'busca', 'data_coleta', 'excluida'];

  function celula(v) {
    const s = typeof v === 'number' ? String(v).replace('.', ',') : String(v ?? '');
    return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  }

  const csv = (ls) => '﻿' + [COLS.join(';'), ...ls.map((l) => COLS.map((c) => celula(l[c] ?? (c === 'excluida' ? 0 : ''))).join(';'))].join('\r\n');

  const doisDig = (n) => String(n).padStart(2, '0');
  const dataLocal = (d = new Date()) => `${d.getFullYear()}-${doisDig(d.getMonth() + 1)}-${doisDig(d.getDate())}`;
  const horaLocal = (d = new Date()) => `${doisDig(d.getHours())}${doisDig(d.getMinutes())}`;

  // AAAA-MM-DD_HHmm_<categoria>_precos.csv (o build lê _dados-brutos/*/*_precos.csv). A hora
  // evita que o navegador renomeie a segunda exportação do dia para "... (1).csv", que o build
  // não leria.
  const nomeArquivo = (categoria, data, hora) => `${data}_${hora}_${categoria}_precos.csv`;

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
        tipo_preco: tipoPreco(texto(c, '.s-price-instructions-style') || c.textContent),
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
        tipo_preco: tipoPreco(texto(c, '.poly-component__price')),
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
        if (links.length === 1 && visivel(n).length > 30) bloco = { n, url: links[0] };
      }
      if (!bloco || vistos.has(bloco.url)) continue;
      const precos = [...bloco.n.querySelectorAll('*')]
        .filter((e) => e.childElementCount === 0 && RE_PRECO.test(limpar(e.textContent)))
        .map((e) => ({ valor: numeroBR(e.textContent), contexto: limpar(e.parentElement?.textContent) }));
      // título: o do cabeçalho do card, se houver; senão, o texto mais longo de link ou imagem
      const util = (t) => t.length > 10 && !/^R\$/.test(t);
      const cabecalho = [...bloco.n.querySelectorAll('h1, h2, h3, h4, [itemprop="name"]')].map((e) => limpar(visivel(e))).filter(util);
      const titulos = cabecalho.length ? cabecalho : [...bloco.n.querySelectorAll('a[href], img[alt]')]
        .map((e) => limpar(e.title || e.alt || visivel(e)))
        .filter(util)
        .sort((x, y) => y.length - x.length);
      const textoBloco = visivel(bloco.n);
      vistos.set(bloco.url, { produto: titulos[0] || '', preco: precoAtual(precos), frete: freteDe(textoBloco), url: bloco.url, patrocinado: /patrocinad/i.test(textoBloco), tipo_preco: tipoPreco(textoBloco) });
    }
    return [...vistos.values()];
  }

  // Ofertas válidas da página e o total de cards lidos antes do filtro (com e sem preço).
  function lerOfertas(site) {
    let brutas = site === 'amazon' ? lerAmazon() : site === 'mercadolivre' ? lerMercadoLivre() : [];
    if (!brutas.length) brutas = lerJsonLd();
    if (!brutas.length) brutas = lerGenerico();
    const busca = location.href;
    const ofertas = brutas.filter((o) => o.url && o.preco > 0 && o.produto).map((o) => ({ ...o, busca }));
    return { ofertas, cards: brutas.length };
  }

  // Soma ofertas novas às já lidas, sem repetir URL.
  function somarOfertas(lidas, novas) {
    const urls = new Set(lidas.map((o) => o.url));
    return lidas.concat(novas.filter((o) => !urls.has(o.url) && urls.add(o.url)));
  }

  // CEP que o site mostra no cabeçalho, quando mostra.
  function cepDoSite() {
    const sel = '#glow-ingress-line2, #nav-global-location-slot, .nav-menu-cp-send, .nav-menu-cp, [data-testid="zipcode"], [data-testid="header-zipcode"]';
    for (const n of document.querySelectorAll(sel)) { const c = cepDe(n.textContent); if (c) return c; }
    return '';
  }

  // ---------- coleta ----------

  const site = siteDe(location.hostname);
  let ofertasLidas = [];
  let cardsLidos = 0;
  let urlLida = '';

  const itemAtual = () => ITENS.find((i) => i.id === GM_getValue(CHAVE_ITEM, ITENS[0].id)) || ITENS[0];
  const cepAtual = () => cepDoSite() || GM_getValue(CHAVE_CEP, '');

  function baixar(nome, conteudo, tipo, atraso = 0) {
    setTimeout(() => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([conteudo], { type: tipo }));
      a.download = nome;
      (document.body || document.documentElement).appendChild(a);
      a.click();
      setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 2000);
    }, atraso);
  }

  function baixarCsv() {
    const porCategoria = {};
    for (const l of Object.values(carregar())) (porCategoria[l.categoria] ||= []).push(l);
    const agora = new Date();
    Object.entries(porCategoria).forEach(([categoria, linhas], i) => {
      linhas.sort((a, b) => a.id_item.localeCompare(b.id_item) || a.preco - b.preco);
      baixar(nomeArquivo(categoria, dataLocal(agora), horaLocal(agora)), csv(linhas), 'text/csv;charset=utf-8', i * 800);
    });
    return Object.keys(porCategoria).length;
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
    #cpi-painel{position:fixed;top:12px;right:12px;z-index:2147483647;width:360px;
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
    button.x{flex:0 0 auto;padding:0 6px;border:none;opacity:.7}
    select,input{font:inherit;color:inherit;background:transparent;border:1px solid #888;border-radius:6px;padding:3px}
    select{width:100%} select option{color:#111}
    input[type=number]{width:52px} input.cep{width:90px}
    ul{list-style:none;margin:6px 0;padding:0;max-height:40vh;overflow:auto}
    li{display:flex;gap:6px;align-items:flex-start;padding:3px 0;border-bottom:1px solid rgba(128,128,128,.25);font-size:12px}
    li span{flex:1} li b{white-space:nowrap}
    details{margin:6px 0} summary{cursor:pointer;font-size:12px}
    .resumo{font-size:12px} .alerta{color:#b45309} .ok{color:#15803d}
    @media (prefers-color-scheme:dark){.alerta{color:#fbbf24}.ok{color:#4ade80}}
    .status{font-size:12px;opacity:.8}`;

  const status = (t) => { if (el.status) el.status.textContent = t; };
  const reais = (v) => (v == null ? '–' : `R$ ${v.toFixed(2).replace('.', ',')}`);
  const ROTULO_TIPO = { pix: ' [Pix]', cupom: ' [cupom]', padrao: '' };

  function mostrarCep() {
    const doSite = cepDoSite();
    const cep = cepAtual();
    const ok = cep && ehSalvador(cep);
    el.cepAviso.className = ok ? 'resumo ok' : 'resumo alerta';
    el.cepAviso.textContent = doSite
      ? `CEP no site: ${doSite}${ehSalvador(doSite) ? ' (Salvador)' : ' — fora de Salvador: o frete não vale'}`
      : cep ? `CEP informado: ${cep}${ok ? ' (Salvador)' : ' — fora de Salvador'}; o site não mostra o CEP, conferir`
        : 'Informe o CEP de Salvador usado no site.';
  }

  function mostrar(t) {
    const guardados = carregar();
    const lista = ativas(guardados);
    const item = itemAtual();
    const r = resumoItem(guardados, item.id);
    const itensComPreco = new Set(lista.map((l) => l.id_item)).size;
    const itensFracos = ITENS.filter((i) => { const n = resumoItem(guardados, i.id).n; return n > 0 && n < MIN_OFERTAS; }).length;
    el.contagem.textContent = `${itensComPreco} de ${ITENS.length} itens com preço · ${itensFracos} com menos de ${MIN_OFERTAS} ofertas · ${lista.length} ofertas no total`;
    el.resumo.className = r.n >= MIN_OFERTAS ? 'resumo ok' : 'resumo alerta';
    el.resumo.textContent = r.n
      ? `Este item: ${r.n} ofertas de ${r.sites} site(s) · mediana ${reais(r.mediana)} (${reais(r.min)} a ${reais(r.max)}, preço + frete)`
        + `${r.semFrete ? ` · ${r.semFrete} sem frete informado` : ''}${r.pixCupom ? ` · ${r.pixCupom} no Pix ou cupom` : ''}`
        + `${r.n < MIN_OFERTAS ? ` · faltam ${MIN_OFERTAS - r.n} para o mínimo` : ''}`
      : 'Este item ainda não tem ofertas guardadas.';
    listarGuardadas(guardados, item);
    if (t) status(t);
  }

  function listarGuardadas(guardados, item) {
    const ks = Object.keys(guardados).filter((k) => guardados[k].id_item === item.id && !guardados[k].excluida)
      .sort((a, b) => guardados[a].preco - guardados[b].preco);
    el.guardadasTitulo.textContent = `Guardadas deste item (${ks.length})`;
    el.guardadas.replaceChildren(...ks.map((k) => {
      const l = guardados[k];
      const frete = l.frete == null ? ' + frete ?' : l.frete === 0 ? '' : ` + ${reais(l.frete)}`;
      const x = criar('button', {
        className: 'x', textContent: '✕', title: 'Excluir esta oferta',
        onclick: () => { const g = carregar(); excluir(g, k); salvar(g); mostrar(`Excluída: ${l.produto.slice(0, 40)}`); },
      });
      return criar('li', {}, [x, criar('span', { textContent: `${l.fonte} · ${l.produto}` }), criar('b', { textContent: `${reais(l.preco)}${frete}${ROTULO_TIPO[l.tipo_preco] || ''}` })]);
    }));
  }

  function listarOfertas() {
    const item = itemAtual();
    el.lista.replaceChildren(...ofertasLidas.map((o, i) => {
      const marca = criar('input', { type: 'checkbox', checked: !o.patrocinado && relevancia(o.produto, item.termo) >= 0.5 });
      marca.dataset.i = i;
      const frete = o.frete == null ? '' : o.frete === 0 ? ' + frete grátis' : ` + ${reais(o.frete)}`;
      return criar('li', {}, [marca, criar('span', { textContent: `${o.patrocinado ? '[patrocinado] ' : ''}${o.produto}` }),
        criar('b', { textContent: `${reais(o.preco)}${frete}${ROTULO_TIPO[o.tipo_preco] || ''}` })]);
    }));
    el.bGuardar.disabled = !ofertasLidas.length;
  }

  const caixasMarcadas = () => [...el.lista.querySelectorAll('input[type=checkbox]')].filter((m) => m.checked);

  function ler(somar) {
    const { ofertas, cards } = lerOfertas(site);
    const antes = ofertasLidas.length;
    ofertasLidas = somar ? somarOfertas(ofertasLidas, ofertas) : ofertas;
    cardsLidos = somar ? cardsLidos + cards : cards;
    urlLida = location.href;
    listarOfertas();
    const marcadas = caixasMarcadas().length;
    const novas = ofertasLidas.length - (somar ? antes : 0);
    status(!ofertasLidas.length ? 'Nenhuma oferta com preço nesta página.'
      : `${somar ? `+${novas} novas; ` : ''}${ofertasLidas.length} ofertas com preço de ${cardsLidos} cards lidos, ${marcadas} marcadas pelo termo. Desmarque o que não é o item.`);
  }

  function montarPainel() {
    el.item = criar('select', {
      onchange: () => { GM_setValue(CHAVE_ITEM, el.item.value); ofertasLidas = []; cardsLidos = 0; listarOfertas(); mostrar(); },
    }, ITENS.map((i) => criar('option', { value: i.id, textContent: `${i.id} · ${i.item}` })));
    el.item.value = itemAtual().id;
    el.cep = criar('input', {
      className: 'cep', placeholder: '40000-000', value: GM_getValue(CHAVE_CEP, ''),
      onchange: () => { GM_setValue(CHAVE_CEP, cepDe(el.cep.value) || ''); el.cep.value = GM_getValue(CHAVE_CEP, ''); mostrarCep(); },
    });
    el.cepAviso = criar('p');
    el.contagem = criar('p', { className: 'resumo' });
    el.resumo = criar('p');
    el.status = criar('p', { className: 'status', textContent: 'Escolha o item, busque e leia as ofertas.' });
    el.unidades = criar('input', { type: 'number', min: 1, value: 1 });
    el.lista = criar('ul');
    el.guardadas = criar('ul');
    el.guardadasTitulo = criar('summary');
    const bBuscar = criar('button', {
      textContent: 'Buscar aqui',
      disabled: !urlBusca(site, 'x'),
      onclick: () => { location.href = urlBusca(site, itemAtual().termo); },
    });
    const bLer = criar('button', { textContent: 'Ler ofertas', onclick: () => ler(false) });
    const bSomar = criar('button', { textContent: 'Somar página', title: 'Acrescenta as ofertas desta página (ou das que carregaram ao rolar) às já lidas', onclick: () => ler(true) });
    el.bGuardar = criar('button', {
      textContent: 'Guardar marcadas',
      disabled: true,
      onclick: () => {
        const marcadas = caixasMarcadas().map((m) => ofertasLidas[m.dataset.i]);
        const guardados = carregar();
        const novas = guardar(guardados, itemAtual(), marcadas, el.unidades.value,
          { fonte: site, busca: location.href, data_coleta: dataLocal(), cep: cepAtual() });
        salvar(guardados);
        mostrar(`${marcadas.length} guardadas (${novas} novas).${cepAtual() && ehSalvador(cepAtual()) ? '' : ' Atenção: sem CEP de Salvador.'}`);
      },
    });
    const bCsv = criar('button', { textContent: 'Baixar CSV', onclick: () => status(`${baixarCsv()} arquivo(s) de categoria baixados.`) });
    const bLimpar = criar('button', {
      textContent: 'Limpar',
      onclick: () => {
        if (!confirm('Apagar todas as ofertas guardadas? Um backup JSON será baixado antes.')) return;
        const agora = new Date();
        baixar(`${dataLocal(agora)}_${horaLocal(agora)}_precos_backup.json`, JSON.stringify(carregar(), null, 1), 'application/json');
        GM_deleteValue(CHAVE);
        mostrar('Guardadas apagadas (backup baixado).');
      },
    });

    const minimizar = criar('span', { textContent: '–' });
    const cabecalho = criar('header', {}, [criar('span', { textContent: `Preços · ${site}` }), minimizar]);
    const painel = criar('div', { id: 'cpi-painel' }, [
      cabecalho,
      criar('div', { className: 'linha' }, [criar('span', { textContent: 'CEP:' }), el.cep]),
      el.cepAviso,
      el.item,
      el.contagem,
      el.resumo,
      criar('details', {}, [el.guardadasTitulo, el.guardadas]),
      criar('div', { className: 'linha' }, [bBuscar, bLer, bSomar]),
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
    mostrarCep();
    mostrar();
  }

  // O painel é reposto se o site refizer a página. Em site que troca de página sem recarregar
  // (Magalu, Leroy Merlin), avisa que as ofertas lidas são da página anterior: cada uma guarda
  // a URL de onde foi lida, e "Somar página" acrescenta as da página nova.
  let urlVista = location.href;
  function verificar() {
    if (!document.body) return;
    if (!hospedeiro) montarPainel();
    if (!hospedeiro.isConnected) document.documentElement.appendChild(hospedeiro);
    if (location.href !== urlVista) {
      urlVista = location.href;
      mostrarCep();
      if (ofertasLidas.length && urlLida !== location.href) status(`A página mudou: as ${ofertasLidas.length} ofertas lidas são da anterior. "Ler ofertas" para recomeçar ou "Somar página" para acrescentar.`);
    }
  }

  console.info(NOME, 'carregado');
  setInterval(() => { try { verificar(); } catch (e) { console.error(NOME, e); } }, 1500);
})();
