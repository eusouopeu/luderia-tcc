// ==UserScript==
// @name         Coletor de anúncios de aluguel (TCC Luderia)
// @namespace    tcc-luderia
// @version      2026.11.02-3
// @description  Lê os anúncios das páginas de busca do OLX, ZAP Imóveis, Viva Real e QuintoAndar (preço, condomínio, IPTU, área, bairro), percorre as páginas seguintes e exporta CSV.
// @match        https://www.olx.com.br/*
// @match        https://www.zapimoveis.com.br/*
// @match        https://www.vivareal.com.br/*
// @match        https://www.quintoandar.com.br/*
// @run-at       document-start
// @noframes
// @grant        none
// ==/UserScript==

/*
 * Uso pessoal, para o Bloco B5 (ativos fixos): preço pedido de aluguel de pontos comerciais em
 * Salvador (cap. 9, premissa C07, e 6.4, escolha do bairro). Os portais bloqueiam
 * requisições fora do navegador (Cloudflare), por isso a coleta roda na página.
 *
 * Como usar: abrir a busca no portal, já filtrada (tipo, cidade, bairro), e clicar
 * em "Coletar todas as páginas". O script lê a página, rola até o fim, guarda os
 * anúncios e vai para a página seguinte (?o=N no OLX, ?pagina=N no ZAP e no Viva
 * Real, botão "Ver mais" no QuintoAndar) até uma página vir vazia, não trazer
 * anúncio inédito nesta rodada ou chegar ao limite. "Inédito" conta só a rodada:
 * refazer uma busca já guardada percorre todas as páginas de novo. No fim, toca
 * um som e baixa o CSV. Os anúncios ficam guardados no navegador (localStorage,
 * um por portal) até "Limpar"; o CSV traz tudo o que foi guardado. Se o
 * localStorage encher, a rodada para e o CSV sai na hora com o que foi lido. Se
 * aparecer o desafio do Cloudflare, a rodada pausa e retoma da mesma página depois
 * que ele for resolvido. Cada anúncio leva o total de resultados que o portal diz
 * ter na busca (total_busca), para o build medir a cobertura.
 *
 * Buscas que funcionam (02/11/2026):
 *  - OLX:       /imoveis/comercio-e-industria/estado-ba/grande-salvador/salvador
 *               (mistura venda e aluguel; a coluna operacao separa pelo título e preço)
 *  - ZAP:       /aluguel/loja-salao/ba+salvador/ e /aluguel/conjunto-comercial-sala/ba+salvador/
 *  - Viva Real: /aluguel/bahia/salvador/ponto-comercial_comercial/
 *  - QuintoAndar: /alugar/imovel/<bairro>-salvador-ba-brasil (em Salvador, só residencial)
 *
 * Fontes de cada portal:
 *  - OLX: cards section.olx-adcard (título, preço, condomínio, IPTU, área, bairro, data).
 *  - ZAP e Viva Real (mesmo layout, mesmos ids de anúncio): cards [data-cy="rp-property-cd"].
 *  - QuintoAndar: JSON da página (__NEXT_DATA__) e respostas de /search/list.
 *
 * Saída: CSV com ";" e UTF-8 com BOM, uma linha por anúncio. Valores em R$ por mês;
 * condomínio e IPTU vazios quando o anúncio não informa e 0 quando diz "isento".
 * O tratamento (duplicatas entre portais, R$/m², resumo por bairro) fica em
 * build/B5-b_anuncios_aluguel.py.
 */

(function () {
  'use strict';

  const NOME = '[Aluguel]';
  const CHAVE = 'tcc_aluguel_v1';
  const CHAVE_AUTO = 'tcc_aluguel_auto';

  // ---------- leitura de texto ----------

  const semAcento = (t) => String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const limpar = (t) => String(t || '').replace(/\s+/g, ' ').trim();

  // "4.500" -> 4500; "1.234,56" -> 1234.56; "R$ 25 mil" -> 25000
  function numeroBR(txt) {
    if (txt == null) return null;
    const s = String(txt);
    const m = s.match(/\d[\d.]*(?:,\d+)?/);
    if (!m) return null;
    let n = parseFloat(m[0].replace(/\./g, '').replace(',', '.'));
    if (/\d\s*mil\b/i.test(s)) n *= 1000;
    return Number.isFinite(n) ? n : null;
  }

  // Valor depois de um rótulo ("Cond. R$ 1.135", "IPTU R$ 180"); 0 se "isento"; null se ausente.
  function valorRotulado(texto, rotulo) {
    const t = String(texto || '');
    const re = new RegExp(rotulo + '\\.?\\s*(?:R\\$\\s*([\\d.,]+(?:\\s*mil\\b)?)|(isent[oa]))', 'i');
    const m = t.match(re);
    if (!m) return null;
    return m[2] ? 0 : numeroBR(m[1]);
  }

  const area = (t) => { const m = String(t || '').match(/(\d[\d.,]*)\s*m(?:²|2|etros quadrados)/i); return m ? numeroBR(m[1]) : null; };
  const inteiro = (t) => { const m = String(t || '').match(/\d+/); return m ? parseInt(m[0], 10) : null; };

  // Pelo título; se ele cita as duas ("venda ou aluguel") ou nenhuma, pelo preço por m²:
  // aluguel comercial em Salvador fica na casa das dezenas de R$/m² ao mês, venda nos
  // milhares. Sem área, pelo preço: aluguel raramente passa de R$ 100 mil/mês.
  function operacaoDe(titulo, preco, areaM2) {
    const t = semAcento(titulo);
    const aluga = /\b(alug|locac|loca-se)/.test(t);
    const vende = /\b(vend|venda)/.test(t);
    if (aluga !== vende) return aluga ? 'aluguel' : 'venda';
    if (preco != null && areaM2 > 0) return preco / areaM2 >= 1000 ? 'venda' : 'aluguel';
    if (preco != null) return preco >= 100000 ? 'venda' : 'aluguel';
    return '';
  }

  // ---------- normalização por portal (objetos simples, sem DOM: testável) ----------

  // ZAP e Viva Real: campos = { titulo, href, preco, area, local, rua, anunciante, quartos, banheiros, vagas }
  function normalizarGrupoOlx(portal, c) {
    const titulo = limpar(c.titulo);
    // "Ponto comercial com 56 m² para alugar…", "Ponto comercial disponível para locação…"
    const mTipo = titulo.match(/^(.*?)\s+(?:com\s+\d|disponível|para alugar|para locação|à venda|para comprar)/i);
    const aluga = /\/m[eê]s/i.test(c.preco || '');
    const preco = numeroBR((String(c.preco || '').match(/R\$\s*[\d.,]+(?:\s*mil)?/) || [''])[0]);
    const [bairro = '', cidade = ''] = limpar(c.local).split(/\s*,\s*/);
    const condominio = valorRotulado(c.preco, 'Cond');
    const iptu = valorRotulado(c.preco, 'IPTU');
    return {
      portal,
      id: (String(c.href || '').match(/id-(\d+)/) || [])[1] || '',
      url: String(c.href || '').split('?')[0],
      titulo,
      tipo: mTipo ? mTipo[1] : '',
      operacao: aluga ? 'aluguel' : /para alugar/i.test(titulo) ? 'aluguel' : operacaoDe(titulo, preco, area(c.area)),
      aluguel: preco,
      condominio,
      iptu,
      condominio_iptu: condominio != null && iptu != null ? condominio + iptu : null,
      area_m2: area(c.area),
      quartos: inteiro(c.quartos),
      banheiros: inteiro(c.banheiros),
      vagas: inteiro(c.vagas),
      bairro,
      cidade,
      endereco: /não informado/i.test(c.rua || '') ? '' : limpar(c.rua),
      anunciante: limpar(c.anunciante),
      publicado: '',
    };
  }

  // OLX: campos = { titulo, href, preco, extras, detalhes: [aria-labels], local, data, caminho }
  function normalizarOlx(c) {
    const titulo = limpar(c.titulo);
    const preco = numeroBR(c.preco);
    const det = (c.detalhes || []).map(limpar);
    const achar = (re) => det.find((d) => re.test(semAcento(d)));
    // Local vem como "Salvador, Piatã" (cidade antes do bairro).
    const [cidade = '', ...resto] = limpar(c.local).split(/\s*,\s*/);
    const condominio = valorRotulado(c.extras, 'Condom[ií]nio');
    const iptu = valorRotulado(c.extras, 'IPTU');
    const caminho = String(c.caminho || '');
    const areaM2 = area(achar(/metros quadrados|m2|m²/));
    return {
      portal: 'olx',
      id: (String(c.href || '').match(/-(\d{6,})(?:[/?#]|$)/) || [])[1] || '',
      url: String(c.href || '').split('?')[0],
      titulo,
      tipo: '',
      operacao: /\/aluguel(\/|$)/.test(caminho) ? 'aluguel' : /\/venda(\/|$)/.test(caminho) ? 'venda' : operacaoDe(titulo, preco, areaM2),
      aluguel: preco,
      condominio,
      iptu,
      condominio_iptu: condominio != null && iptu != null ? condominio + iptu : null,
      area_m2: areaM2,
      quartos: inteiro(achar(/quarto/)),
      banheiros: inteiro(achar(/banheiro/)),
      vagas: inteiro(achar(/vaga/)),
      bairro: resto.join(', '),
      cidade,
      endereco: '',
      anunciante: '',
      publicado: limpar(c.data),
    };
  }

  // QuintoAndar: objeto da casa no __NEXT_DATA__ (rentPrice, condoIptu) ou _source de /search/list (rent, iptuPlusCondominium).
  function normalizarQuinto(h) {
    const aluguel = h.rentPrice ?? h.rent ?? null;
    const encargos = h.condoIptu ?? h.iptuPlusCondominium ?? null;
    const endereco = typeof h.address === 'string' ? h.address : h.address?.address || '';
    const cidade = h.city || h.address?.city || '';
    const bairro = h.neighbourhood || h.regionName || '';
    return {
      portal: 'quintoandar',
      id: String(h.id ?? ''),
      url: h.id ? `https://www.quintoandar.com.br/imovel/${h.id}` : '',
      titulo: limpar(h.shortRentDescription || `${h.type || 'Imóvel'} em ${bairro}`),
      tipo: h.type || '',
      operacao: h.forRent === false && h.forSale ? 'venda' : 'aluguel',
      aluguel,
      condominio: null,
      iptu: null,
      condominio_iptu: encargos,
      area_m2: h.area ?? null,
      quartos: h.bedrooms ?? null,
      banheiros: h.bathrooms ?? null,
      vagas: h.parkingSpots ?? h.parkingSpaces ?? null,
      bairro,
      cidade,
      endereco,
      anunciante: '',
      publicado: '',
    };
  }

  // Procura objetos de casa do QuintoAndar em qualquer JSON (estado inicial ou resposta de busca).
  function casasQuinto(json, saida = []) {
    if (!json || typeof json !== 'object') return saida;
    if (Array.isArray(json)) { json.forEach((x) => casasQuinto(x, saida)); return saida; }
    const ehCasa = (o) => o && o.id != null && ('rentPrice' in o || 'rent' in o) && ('area' in o);
    if (ehCasa(json)) { saida.push(json); return saida; }
    if (json._source && ehCasa(json._source)) { saida.push(json._source); return saida; }
    for (const v of Object.values(json)) if (v && typeof v === 'object') casasQuinto(v, saida);
    return saida;
  }

  // ---------- portal, paginação e armazenamento ----------

  function portalDe(host) {
    if (/olx\.com\.br$/.test(host)) return 'olx';
    if (/zapimoveis\.com\.br$/.test(host)) return 'zap';
    if (/vivareal\.com\.br$/.test(host)) return 'vivareal';
    if (/quintoandar\.com\.br$/.test(host)) return 'quintoandar';
    return '';
  }

  const paramPagina = (portal) => (portal === 'olx' ? 'o' : 'pagina');

  function paginaAtual(portal, href) {
    const u = new URL(href);
    return parseInt(u.searchParams.get(paramPagina(portal)) || '1', 10) || 1;
  }

  function proximaPagina(portal, href) {
    const u = new URL(href);
    u.searchParams.set(paramPagina(portal), String(paginaAtual(portal, href) + 1));
    return u.toString();
  }

  function carregar() {
    try { return JSON.parse(localStorage.getItem(CHAVE) || '{}'); } catch (e) { return {}; }
  }

  // Devolve false se o localStorage recusar (cheio): quem chama avisa e baixa o CSV.
  function salvar(dados) {
    try { localStorage.setItem(CHAVE, JSON.stringify(dados)); return true; } catch (e) { console.error(NOME, 'localStorage cheio', e); return false; }
  }

  // Chaves lidas nesta página que a rodada ainda não tinha visto.
  const ineditas = (anuncios, vistos) => [...new Set(anuncios.filter((a) => a.id).map((a) => `${a.portal}:${a.id}`))].filter((k) => !vistos.includes(k));

  // Junta os anúncios lidos aos guardados; devolve quantos são novos.
  function guardar(guardados, anuncios, contexto) {
    let novos = 0;
    for (const a of anuncios) {
      if (!a.id) continue;
      const k = `${a.portal}:${a.id}`;
      if (!guardados[k]) novos++;
      guardados[k] = { ...a, ...contexto };
    }
    return novos;
  }

  const COLS = ['portal', 'id', 'url', 'titulo', 'tipo', 'operacao', 'aluguel', 'condominio', 'iptu', 'condominio_iptu',
    'area_m2', 'quartos', 'banheiros', 'vagas', 'bairro', 'cidade', 'endereco', 'anunciante', 'publicado',
    'busca_url', 'pagina', 'total_busca', 'data_coleta'];

  function celula(v) {
    const s = typeof v === 'number' ? String(v).replace('.', ',') : String(v ?? '');
    return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  }

  const csv = (ls) => '﻿' + [COLS.join(';'), ...ls.map((l) => COLS.map((c) => celula(l[c])).join(';'))].join('\r\n');

  const dataLocal = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const horaLocal = (d = new Date()) => `${String(d.getHours()).padStart(2, '0')}${String(d.getMinutes()).padStart(2, '0')}`;

  // AAAA-MM-DD_HHmm_<portal>_anuncios_aluguel.csv: a hora evita o "(1)" do navegador
  // quando o CSV sai duas vezes no mesmo dia.
  const nomeArquivo = (portal, data, hora) => `${data}_${hora}_${portal}_anuncios_aluguel.csv`;

  // ---------- leitura da página (DOM) ----------

  const texto = (raiz, sel) => raiz.querySelector(sel)?.textContent || '';

  function lerPaginaZap(portal) {
    return [...document.querySelectorAll('[data-cy="rp-property-cd"]')].map((card) => {
      const cy = (nome) => texto(card, `[data-cy="rp-cardProperty-${nome}-txt"]`);
      const a = card.querySelector('a[href*="/imovel/"]') || card.querySelector('a');
      return normalizarGrupoOlx(portal, {
        titulo: a?.title || '',
        href: a?.href || '',
        // Os filhos do preço vêm colados no textContent ("R$ 4.000/mêsCond. isento"): junta com " | ".
        preco: [...(card.querySelector('[data-cy="rp-cardProperty-price-txt"]')?.childNodes || [])].map((n) => n.textContent).join(' | '),
        area: cy('propertyArea'),
        local: cy('location'),
        rua: cy('street'),
        anunciante: card.querySelector('[data-cy="rp-cardProperty-image-img"] span[title]')?.title || '',
        quartos: cy('bedroomQuantity'),
        banheiros: cy('bathroomQuantity'),
        vagas: cy('parkingSpacesQuantity'),
      });
    });
  }

  function lerPaginaOlx() {
    return [...document.querySelectorAll('section.olx-adcard')].map((card) => {
      const a = card.querySelector('a[data-testid="adcard-link"]') || card.querySelector('a');
      return normalizarOlx({
        titulo: a?.title || texto(card, 'h2'),
        href: a?.href || '',
        preco: texto(card, '.olx-adcard__price'),
        extras: [...card.querySelectorAll('[data-testid="adcard-price-info-list"] > *')].map((n) => n.textContent).join(' | '),
        detalhes: [...card.querySelectorAll('.olx-adcard__detail')].map((d) => d.getAttribute('aria-label') || d.textContent),
        local: texto(card, '.olx-adcard__location'),
        data: texto(card, '.olx-adcard__date'),
        caminho: location.pathname,
      });
    }).filter((a) => a.id);
  }

  // Respostas de /search/list interceptadas (o QuintoAndar carrega "Ver mais" por fetch).
  const casasInterceptadas = new Map();

  function lerPaginaQuinto() {
    const casas = new Map(casasInterceptadas);
    try {
      const n = document.getElementById('__NEXT_DATA__');
      if (n) for (const h of casasQuinto(JSON.parse(n.textContent).props?.pageProps?.initialState?.houses || {})) casas.set(String(h.id), h);
    } catch (e) { console.warn(NOME, 'sem __NEXT_DATA__', e); }
    return [...casas.values()].map(normalizarQuinto);
  }

  function lerPagina(portal) {
    if (portal === 'olx') return lerPaginaOlx();
    if (portal === 'quintoandar') return lerPaginaQuinto();
    return lerPaginaZap(portal);
  }

  function interceptarQuinto() {
    const original = window.fetch;
    window.fetch = async function (...args) {
      const r = await original.apply(this, args);
      try {
        const url = String(args[0]?.url || args[0]);
        if (/house-listing-search\/.*search\/list/.test(url)) {
          r.clone().json().then((j) => casasQuinto(j).forEach((h) => casasInterceptadas.set(String(h.id), h))).catch(() => {});
        }
      } catch (e) { /* a página segue normalmente */ }
      return r;
    };
  }

  // Total de resultados que o portal diz ter na busca ("1.234 imóveis", "Resultados 1-50 de
  // 1.234"), para o build medir a cobertura. Leitura genérica do título e do contador:
  // null se não achar. Seletores não conferidos em todos os portais.
  function totalDeTexto(t) {
    const s = limpar(t);
    // "Mais de 87" é limite inferior, não total: fica null.
    const m = s.match(/(?<!mais\s)\bde\s+(\d[\d.]*)\s*(?:resultados|an[uú]ncios|im[oó]veis)/i)
      || s.match(/^(\d[\d.]*)\s+(?:resultados|an[uú]ncios|im[oó]veis|lojas|salas|pontos|galp|pr[eé]dios|conjuntos|casas|apartamentos)/i);
    return m ? numeroBR(m[1]) : null;
  }

  function totalResultados() {
    const candidatos = document.querySelectorAll('h1, h2, [data-cy*="title"], [data-testid*="result"], [class*="result"], [class*="Result"]');
    for (const n of candidatos) {
      const v = totalDeTexto(n.textContent);
      if (v != null) return v;
    }
    return null;
  }

  // Desafio do Cloudflare ("Just a moment…"): a página não tem cards, mas não está vazia.
  const desafioDeTexto = (titulo) => /just a moment|um momento|attention required|verifica(?:ndo|ção)/i.test(String(titulo || ''));
  const desafioCloudflare = () => desafioDeTexto(document.title)
    || !!document.querySelector('#challenge-form, #challenge-running, #cf-challenge-running, iframe[src*="challenges.cloudflare.com"]');

  // QuintoAndar: a lista cresce pelo botão "Ver mais", sem trocar de URL.
  const botaoVerMais = () => [...document.querySelectorAll('button, a')]
    .find((b) => /^\s*ver mais\b/i.test(b.textContent || '') && !b.disabled && b.offsetParent !== null);

  const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

  // Rola aos poucos para os cards preguiçosos renderizarem; volta ao topo no fim.
  async function rolarAteOFim() {
    let altura = 0, semMudanca = 0;
    while (semMudanca < 3) {
      window.scrollBy(0, Math.max(600, window.innerHeight * 0.9));
      await esperar(500);
      const h = document.documentElement.scrollHeight;
      const noFim = window.scrollY + window.innerHeight >= h - 5;
      semMudanca = noFim && h === altura ? semMudanca + 1 : 0;
      altura = h;
    }
  }

  // Espera os cards aparecerem (até 20 s) e pararem de aumentar.
  async function esperarCards(portal) {
    let anterior = -1;
    for (let i = 0; i < 40; i++) {
      const n = lerPagina(portal).length;
      if (n > 0 && n === anterior) return n;
      anterior = n;
      await esperar(500);
    }
    return Math.max(anterior, 0);
  }

  // ---------- coleta ----------

  const portal = portalDe(location.hostname);
  let guardados = carregar();

  // No QuintoAndar a "página" é o número de cliques em "Ver mais" mais um (a URL não muda).
  async function coletarPagina(pagina = paginaAtual(portal, location.href)) {
    await esperarCards(portal);
    await rolarAteOFim();
    const anuncios = lerPagina(portal);
    guardados = carregar();
    const novos = guardar(guardados, anuncios, { busca_url: location.href, pagina, total_busca: totalResultados(), data_coleta: dataLocal() });
    const gravou = salvar(guardados);
    return { anuncios, lidos: anuncios.length, novos, gravou };
  }

  function avisarCheio() {
    gravarAuto(null);
    atualizarBotoes();
    baixarCsv(guardados);
    status('Armazenamento do navegador cheio: o CSV saiu com tudo o que foi lido. Confira o arquivo, clique em "Limpar" e retome a busca.');
  }

  function baixarCsv(dados = carregar()) {
    const linhas = Object.values(dados).sort((a, b) => (a.pagina - b.pagina) || String(a.id).localeCompare(String(b.id)));
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv(linhas)], { type: 'text/csv;charset=utf-8' }));
    a.download = nomeArquivo(portal, dataLocal(), horaLocal());
    (document.body || document.documentElement).appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 2000);
  }

  function som() {
    try {
      const ctx = new AudioContext();
      const o = ctx.createOscillator();
      o.connect(ctx.destination);
      o.frequency.value = 880;
      o.start();
      o.stop(ctx.currentTime + 0.4);
    } catch (e) { /* sem som */ }
  }

  const lerAuto = () => { try { return JSON.parse(sessionStorage.getItem(CHAVE_AUTO) || 'null'); } catch (e) { return null; } };
  const gravarAuto = (v) => { try { v ? sessionStorage.setItem(CHAVE_AUTO, JSON.stringify(v)) : sessionStorage.removeItem(CHAVE_AUTO); } catch (e) { /* sem modo automático */ } };

  function concluir(auto, motivo) {
    gravarAuto(null);
    atualizarBotoes();
    som();
    baixarCsv();
    status(`Concluído: ${auto.paginas} páginas, ${auto.total} anúncios novos (${motivo}).`);
  }

  // Modo automático: sobrevive à troca de página pelo sessionStorage da aba. A parada
  // compara com os ids vistos nesta rodada (auto.vistos), não com tudo o que está
  // guardado: refazer uma busca já coletada não para na primeira página.
  async function passoAutomatico() {
    const auto = lerAuto();
    if (!auto) return;
    auto.vistos = auto.vistos || [];
    const pagina = portal === 'quintoandar' ? auto.paginas + 1 : paginaAtual(portal, location.href);
    atualizarBotoes();
    status(`Página ${pagina}: lendo…`);
    const { anuncios, lidos, novos, gravou } = await coletarPagina(pagina);
    if (!gravou) { avisarCheio(); return; }
    if (!lerAuto()) return; // parado durante a leitura
    if (lidos === 0 && desafioCloudflare()) {
      // Não conta como página vazia: espera o desafio e retoma desta mesma página.
      iniciouAuto = false;
      status('Bloqueio do Cloudflare: resolva o desafio na página; a coleta retoma desta página.');
      return;
    }
    const inedit = ineditas(anuncios, auto.vistos);
    auto.vistos.push(...inedit);
    auto.paginas += 1;
    auto.total += novos;
    mostrar(`Página ${pagina}: ${lidos} lidos, ${inedit.length} inéditos na rodada, ${novos} novos no navegador.`);
    if (lidos === 0) return concluir(auto, 'página vazia');
    if (inedit.length === 0) return concluir(auto, 'página sem anúncio inédito');
    if (auto.paginas >= auto.limite) return concluir(auto, 'limite de páginas');
    gravarAuto(auto);
    await esperar(1500 + Math.random() * 1500);
    if (!lerAuto()) return;
    if (portal === 'quintoandar') {
      const b = botaoVerMais();
      if (!b) return concluir(auto, 'sem botão "Ver mais"');
      b.click();
      await esperar(2000); // a resposta de /search/list chega depois do clique
      passoAutomatico();
      return;
    }
    location.href = proximaPagina(portal, location.href);
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
    #cal-painel{position:fixed;top:12px;right:12px;z-index:2147483647;width:300px;
      max-height:calc(100vh - 24px);overflow:auto;box-sizing:border-box;
      background:#fff;color:#111;border:1px solid #ccc;border-radius:10px;
      box-shadow:0 4px 16px rgba(0,0,0,.18);font:13px/1.4 system-ui,sans-serif;padding:10px}
    @media (prefers-color-scheme:dark){#cal-painel{background:#1e1e1e;color:#eee;border-color:#444}}
    #cal-painel.min>*:not(header){display:none}
    header{display:flex;justify-content:space-between;align-items:center;font-weight:700;cursor:pointer}
    p{margin:6px 0}
    .linha{display:flex;flex-wrap:wrap;gap:6px;margin:6px 0;align-items:center}
    button{flex:1 1 auto;padding:5px 8px;border-radius:6px;border:1px solid #888;
      background:transparent;color:inherit;cursor:pointer;font:inherit}
    button.ativo{background:#c62828;color:#fff;border-color:#c62828}
    button:disabled{opacity:.4;cursor:default}
    input{width:52px;font:inherit;color:inherit;background:transparent;border:1px solid #888;border-radius:6px;padding:3px}
    .status{font-size:12px;opacity:.8}`;

  const status = (t) => { if (el.status) el.status.textContent = t; };

  function mostrar(t) {
    const n = Object.values(carregar());
    const aluguel = n.filter((a) => a.operacao === 'aluguel').length;
    el.contagem.textContent = `${n.length} anúncios guardados (${aluguel} de aluguel)`;
    if (t) status(t);
  }

  function atualizarBotoes() {
    if (!el.bAuto) return;
    const ativo = !!lerAuto();
    el.bAuto.textContent = ativo ? 'Parar' : 'Coletar todas as páginas';
    el.bAuto.classList.toggle('ativo', ativo);
    el.bPagina.disabled = ativo;
  }

  function montarPainel() {
    el.contagem = criar('p');
    el.status = criar('p', { className: 'status', textContent: 'Abra a busca já filtrada e clique em "Coletar todas as páginas".' });
    el.limite = criar('input', { type: 'number', min: 1, value: 50 });
    el.bPagina = criar('button', {
      textContent: 'Coletar esta página',
      onclick: async () => {
        el.bPagina.disabled = true;
        status('Lendo a página…');
        const { lidos, novos, gravou } = await coletarPagina();
        el.bPagina.disabled = false;
        if (!gravou) { avisarCheio(); return; }
        mostrar(`${lidos} lidos, ${novos} novos.`);
      },
    });
    el.bAuto = criar('button', {
      onclick: () => {
        if (lerAuto()) { gravarAuto(null); atualizarBotoes(); status('Parado.'); return; }
        gravarAuto({ limite: Math.max(1, parseInt(el.limite.value, 10) || 50), paginas: 0, total: 0 });
        passoAutomatico();
      },
    });
    const bCsv = criar('button', { textContent: 'Baixar CSV', onclick: () => baixarCsv() });
    const bLimpar = criar('button', {
      textContent: 'Limpar',
      onclick: () => {
        if (!confirm('Apagar os anúncios guardados deste portal? Baixe o CSV antes.')) return;
        localStorage.removeItem(CHAVE);
        mostrar('Guardados apagados.');
      },
    });

    const minimizar = criar('span', { textContent: '–' });
    const cabecalho = criar('header', {}, [criar('span', { textContent: `Aluguel · ${portal}` }), minimizar]);
    const painel = criar('div', { id: 'cal-painel' }, [
      cabecalho,
      el.contagem,
      criar('div', { className: 'linha' }, [el.bPagina]),
      criar('div', { className: 'linha' }, [el.bAuto]),
      criar('div', { className: 'linha' }, [criar('span', { textContent: 'Limite de páginas:' }), el.limite]),
      criar('div', { className: 'linha' }, [bCsv, bLimpar]),
      el.status,
    ]);
    cabecalho.onclick = () => { painel.classList.toggle('min'); minimizar.textContent = painel.classList.contains('min') ? '+' : '–'; };

    hospedeiro = criar('div', { id: 'cal-hospedeiro' });
    const raiz = hospedeiro.attachShadow({ mode: 'open' });
    raiz.appendChild(criar('style', { textContent: CSS_PAINEL }));
    raiz.appendChild(painel);
    atualizarBotoes();
    mostrar();
  }

  // O painel só aparece em página de busca (com cards); depois de aparecer, é reposto se sumir.
  // No modo automático, uma página que não mostra card em 20 s também encerra a coleta.
  let ehBusca = false;
  let iniciouAuto = false;
  let tentativas = 0;

  // Durante o desafio do Cloudflare, o painel aparece com o aviso e a contagem de 20 s não corre.
  function verificar() {
    if (!document.body) return;
    const desafio = !!lerAuto() && desafioCloudflare() && lerPagina(portal).length === 0;
    if (!ehBusca) {
      ehBusca = lerPagina(portal).length > 0 || desafio || (!!lerAuto() && ++tentativas > 13);
      if (!ehBusca) return;
      console.info(NOME, 'página de busca');
    }
    if (!hospedeiro) montarPainel();
    if (!hospedeiro.isConnected) document.documentElement.appendChild(hospedeiro);
    if (desafio) { status('Bloqueio do Cloudflare: resolva o desafio na página; a coleta retoma desta página.'); return; }
    if (!iniciouAuto && lerAuto()) { iniciouAuto = true; passoAutomatico(); }
  }

  console.info(NOME, 'carregado');
  if (portal === 'quintoandar') interceptarQuinto();
  setInterval(() => { try { verificar(); } catch (e) { console.error(NOME, e); } }, 1500);
})();
