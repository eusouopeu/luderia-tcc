// ==UserScript==
// @name         Coletor de anúncios de aluguel (TCC Luderia)
// @namespace    tcc-luderia
// @version      2026.11.02-4
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
 * Salvador (cap. 9, premissas C04 e C05, e 6.4, escolha do bairro). Os portais bloqueiam
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
 * Painel: além dos botões, mostra a cobertura da busca (lidos ÷ total do portal), o
 * funil da última página (cards → com id → com preço → com área), o preenchimento de
 * cada campo, a mistura de operação, cidade e tipo, a prévia do que o build vai
 * descartar, quantos anúncios estão no alvo (porte do plano e áreas do 6.4), o
 * histórico da rodada automática e as buscas guardadas, com "Baixar" e "Apagar" por
 * busca. Os filtros do painel só mudam esses indicadores e o destaque dos cards na
 * página; nada é descartado na coleta, e o CSV sai completo.
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
  const CHAVE_HIST = 'tcc_aluguel_hist';
  const CHAVE_FILTROS = 'tcc_aluguel_filtros';

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

  // ---------- indicadores de qualidade do painel (sem DOM: testável) ----------
  // Só contam e destacam; nada é descartado na coleta. As regras repetem as do build
  // (build/B5-b_anuncios_aluguel.py) para o painel antecipar o que ele fará.

  // Busca sem o parâmetro de página: agrupa as páginas de uma mesma busca.
  function buscaBase(portal, href) {
    try {
      const u = new URL(href);
      u.searchParams.delete(paramPagina(portal));
      u.hash = '';
      return u.toString();
    } catch (e) { return String(href || ''); }
  }

  const RE_BUSCA_COMERCIAL = /loja-salao|conjunto-comercial|comercio-e-industria|ponto-comercial|galpao|predio-inteiro|imoveis-comerciais|consultorio/;
  const RE_BUSCA_RESIDENCIAL = /quintoandar\.com\.br|\/apartamentos?[/_-]|\/casas?[/_-]|kitnet|flat|cobertura/;
  const RE_COMERCIAL = /\b(lojas?|(?:salao|saloes|salas?|pontos?|imove(?:l|is)|predios?|conjuntos?|box) comercia(?:l|is)|galpao|galpoes|depositos?|armazem|escritorios?|consultorios?|andar corporativo|sala para escritorio|sala empresarial|centro empresarial)\b/;
  const SUBTIPO_BUSCA = [['loja_ponto', /loja-salao|ponto-comercial/], ['sala', /conjunto-comercial|consultorio/], ['galpao', /galpao/], ['predio', /predio-inteiro/]];
  const SUBTIPO_TEXTO = [
    ['galpao', /\b(galpao|galpoes|depositos?|armazem)\b/],
    ['predio', /\b(predios? comercia(?:l|is)|predio inteiro)\b/],
    ['sala', /\b(salas? comercia(?:l|is)|conjuntos? comercia(?:l|is)|escritorios?|consultorios?|andar corporativo|sala para escritorio|sala empresarial|centro empresarial)\b/],
    ['loja_ponto', /\b(lojas?|pontos? comercia(?:l|is)|salao comercial|saloes comerciais|box comercial)\b/],
  ];

  // Segmento e subtipo como no build: pela categoria da busca e, sem ela, pelo tipo e título.
  function classificar(a) {
    const url = String(a.busca_url || '').toLowerCase();
    const txt = semAcento(`${a.tipo || ''} ${a.titulo || ''}`);
    let segmento;
    if (RE_BUSCA_COMERCIAL.test(url)) segmento = 'comercial';
    else if (RE_BUSCA_RESIDENCIAL.test(url)) segmento = 'residencial';
    else segmento = RE_COMERCIAL.test(txt) ? 'comercial' : 'residencial';
    if (segmento === 'residencial') return { segmento, subtipo: 'residencial' };
    const porBusca = SUBTIPO_BUSCA.find(([, re]) => re.test(url));
    const porTexto = SUBTIPO_TEXTO.find(([, re]) => re.test(txt));
    return { segmento, subtipo: (porBusca || porTexto || ['outro'])[0] };
  }

  const PORTE_MIN = 100, PORTE_MAX = 200, MIN_AMOSTRA = 5;
  const AREAS_6_4 = { pituba: 'Pituba/Itaigara', itaigara: 'Pituba/Itaigara', barra: 'Barra/Graça', graca: 'Barra/Graça', 'rio vermelho': 'Rio Vermelho' };
  const areaDe6_4 = (bairro) => AREAS_6_4[semAcento(bairro).replace(/\s+/g, ' ')] || '';
  const noPorte = (a) => a.area_m2 >= PORTE_MIN && a.area_m2 <= PORTE_MAX;

  // Filtros do painel: { soAluguel, soComercial, soLoja, soAreas }.
  function passaFiltros(a, f = {}) {
    const c = classificar(a);
    if (f.soAluguel && a.operacao !== 'aluguel') return false;
    if (f.soComercial && c.segmento !== 'comercial') return false;
    if (f.soLoja && c.subtipo !== 'loja_ponto') return false;
    if (f.soAreas && !areaDe6_4(a.bairro)) return false;
    return true;
  }

  const temValor = (v) => v != null && v !== '' && !(typeof v === 'number' && Number.isNaN(v));
  const fracao = (n, d) => (d ? n / d : null);

  // Funil da página: cards na página → com id → com preço → com área.
  const funil = (anuncios, cards) => ({
    cards,
    comId: anuncios.filter((a) => a.id).length,
    comPreco: anuncios.filter((a) => a.id && temValor(a.aluguel)).length,
    comArea: anuncios.filter((a) => a.id && temValor(a.aluguel) && a.area_m2 > 0).length,
  });

  // Preenchimento de cada campo (fração de 0 a 1) numa lista de anúncios.
  const CAMPOS_QUALIDADE = [['aluguel', 'preço'], ['area_m2', 'área'], ['bairro', 'bairro'], ['condominio_iptu', 'cond. + IPTU']];
  function qualidade(lista) {
    const pct = {};
    for (const [c] of CAMPOS_QUALIDADE) pct[c] = fracao(lista.filter((a) => temValor(a[c]) && (c !== 'area_m2' || a[c] > 0)).length, lista.length);
    return { n: lista.length, pct };
  }

  // Mistura da busca: operação, cidade e tipo estimado; alerta se a busca é comercial e
  // traz mais de 10% de venda ou de residencial.
  function mistura(lista) {
    const n = lista.length;
    const tipos = {};
    for (const a of lista) { const s = classificar(a).subtipo; tipos[s] = (tipos[s] || 0) + 1; }
    const pctVenda = fracao(lista.filter((a) => a.operacao === 'venda').length, n);
    const pctFora = fracao(lista.filter((a) => a.cidade && semAcento(a.cidade) !== 'salvador').length, n);
    const pctResid = fracao(tipos.residencial || 0, n);
    const comercial = lista.some((a) => RE_BUSCA_COMERCIAL.test(String(a.busca_url || '').toLowerCase()));
    const alertas = [];
    if (pctVenda > 0.1) alertas.push(`${Math.round(pctVenda * 100)}% de venda: a busca está sem o filtro de aluguel?`);
    if (comercial && pctResid > 0.1) alertas.push(`${Math.round(pctResid * 100)}% residencial numa busca comercial.`);
    if (pctFora > 0.1) alertas.push(`${Math.round(pctFora * 100)}% fora de Salvador.`);
    return { n, pctAluguel: fracao(lista.filter((a) => a.operacao === 'aluguel').length, n), pctVenda, pctFora, tipos, alertas };
  }

  // Prévia do que o build descarta entre os anúncios de aluguel. O filtro de extremos do
  // build (3·IQR) depende do conjunto: aqui, aproximado por R$/m² fora de 3 a 500.
  function previaDescarte(lista) {
    const aluguel = lista.filter((a) => a.operacao === 'aluguel');
    const motivos = { semArea: 0, preco: 0, foraSalvador: 0, m2: 0 };
    let total = 0;
    for (const a of aluguel) {
      const m = [];
      if (!(a.area_m2 > 0)) m.push('semArea');
      if (!(a.aluguel >= 300 && a.aluguel <= 100000)) m.push('preco');
      if (semAcento(a.cidade) !== 'salvador') m.push('foraSalvador');
      if (a.area_m2 > 0 && a.aluguel > 0 && (a.aluguel / a.area_m2 < 3 || a.aluguel / a.area_m2 > 500)) m.push('m2');
      m.forEach((k) => motivos[k]++);
      if (m.length) total++;
    }
    return { aluguel: aluguel.length, total, motivos };
  }

  // No alvo da C04 e C05: aluguel no porte do plano e, entre as lojas e pontos, por área do 6.4.
  function noAlvo(lista) {
    const porte = lista.filter((a) => a.operacao === 'aluguel' && noPorte(a));
    const porArea = { 'Pituba/Itaigara': 0, 'Barra/Graça': 0, 'Rio Vermelho': 0 };
    for (const a of porte) {
      const area = areaDe6_4(a.bairro);
      if (area && classificar(a).subtipo === 'loja_ponto') porArea[area]++;
    }
    return { porte: porte.length, porArea };
  }

  // Buscas guardadas no navegador: anúncios e última data de cada uma, a mais recente primeiro.
  function agruparBuscas(portal, dados) {
    const g = new Map();
    for (const a of Object.values(dados)) {
      const b = buscaBase(portal, a.busca_url);
      const x = g.get(b) || { busca: b, n: 0, data: '' };
      x.n++;
      if (String(a.data_coleta || '') > x.data) x.data = a.data_coleta;
      g.set(b, x);
    }
    return [...g.values()].sort((p, q) => q.data.localeCompare(p.data) || q.n - p.n);
  }

  // ---------- leitura da página (DOM) ----------

  const texto = (raiz, sel) => raiz.querySelector(sel)?.textContent || '';

  // Card de cada anúncio lido na página (portal:id → elemento), para os filtros destacarem.
  const cardsDaPagina = new Map();
  const SEL_CARDS = { olx: 'section.olx-adcard', zap: '[data-cy="rp-property-cd"]', vivareal: '[data-cy="rp-property-cd"]' };
  const contarCards = (portal) => (SEL_CARDS[portal] ? document.querySelectorAll(SEL_CARDS[portal]).length : lerPaginaQuinto().length);

  function registrarCard(a, card) {
    if (a.id) cardsDaPagina.set(`${a.portal}:${a.id}`, card);
    return a;
  }

  function lerPaginaZap(portal) {
    cardsDaPagina.clear();
    return [...document.querySelectorAll(SEL_CARDS.zap)].map((card) => {
      const cy = (nome) => texto(card, `[data-cy="rp-cardProperty-${nome}-txt"]`);
      const a = card.querySelector('a[href*="/imovel/"]') || card.querySelector('a');
      return registrarCard(normalizarGrupoOlx(portal, {
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
      }), card);
    });
  }

  function lerPaginaOlx() {
    cardsDaPagina.clear();
    return [...document.querySelectorAll(SEL_CARDS.olx)].map((card) => {
      const a = card.querySelector('a[data-testid="adcard-link"]') || card.querySelector('a');
      return registrarCard(normalizarOlx({
        titulo: a?.title || texto(card, 'h2'),
        href: a?.href || '',
        preco: texto(card, '.olx-adcard__price'),
        extras: [...card.querySelectorAll('[data-testid="adcard-price-info-list"] > *')].map((n) => n.textContent).join(' | '),
        detalhes: [...card.querySelectorAll('.olx-adcard__detail')].map((d) => d.getAttribute('aria-label') || d.textContent),
        local: texto(card, '.olx-adcard__location'),
        data: texto(card, '.olx-adcard__date'),
        caminho: location.pathname,
      }), card);
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
    ultimoFunil = funil(anuncios, contarCards(portal));
    guardados = carregar();
    const novos = guardar(guardados, anuncios, { busca_url: location.href, pagina, total_busca: totalResultados(), data_coleta: dataLocal() });
    const gravou = salvar(guardados);
    return { anuncios, lidos: anuncios.length, novos, gravou };
  }

  let ultimoFunil = null;

  // Histórico da rodada (página, lidos, inéditos, novos, segundos): fica na aba depois do fim.
  const lerHist = () => { try { return JSON.parse(sessionStorage.getItem(CHAVE_HIST) || '[]'); } catch (e) { return []; } };
  const gravarHist = (h) => { try { sessionStorage.setItem(CHAVE_HIST, JSON.stringify(h)); } catch (e) { /* sem histórico */ } };

  const lerFiltros = () => { try { return JSON.parse(localStorage.getItem(CHAVE_FILTROS) || '{}'); } catch (e) { return {}; } };
  const gravarFiltros = (f) => { try { localStorage.setItem(CHAVE_FILTROS, JSON.stringify(f)); } catch (e) { /* filtros só na sessão */ } };

  // Apaga os anúncios de uma busca (ou todos, sem busca) do localStorage.
  function apagarBusca(busca) {
    if (!busca) { localStorage.removeItem(CHAVE); return; }
    const dados = carregar();
    for (const [k, a] of Object.entries(dados)) if (buscaBase(portal, a.busca_url) === busca) delete dados[k];
    salvar(dados);
  }

  const daBusca = (dados, busca) => Object.fromEntries(Object.entries(dados).filter(([, a]) => buscaBase(portal, a.busca_url) === busca));

  function avisarCheio() {
    gravarAuto(null);
    atualizarBotoes();
    baixarCsv(guardados);
    status('Armazenamento do navegador cheio: o CSV saiu com tudo o que foi lido. Confira o arquivo, apague buscas em "Buscas guardadas" e retome.');
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
    const inicio = Date.now();
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
    gravarHist([...lerHist(), { pagina, lidos, ineditos: inedit.length, novos, seg: Math.round((Date.now() - inicio) / 1000) }]);
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
    #cal-painel{position:fixed;top:12px;right:12px;z-index:2147483647;width:340px;
      max-height:calc(100vh - 24px);overflow:auto;box-sizing:border-box;
      background:#fff;color:#111;border:1px solid #ccc;border-radius:10px;
      box-shadow:0 4px 16px rgba(0,0,0,.18);font:13px/1.4 system-ui,sans-serif;padding:10px;
      --ok:#2e7d32;--medio:#b26a00;--ruim:#c62828;--trilho:#e5e5e5}
    @media (prefers-color-scheme:dark){#cal-painel{background:#1e1e1e;color:#eee;border-color:#444;
      --ok:#81c784;--medio:#ffb74d;--ruim:#ef9a9a;--trilho:#3a3a3a}}
    #cal-painel.min>*:not(header){display:none}
    header{display:flex;justify-content:space-between;align-items:center;font-weight:700;cursor:pointer}
    p{margin:6px 0}
    .linha{display:flex;flex-wrap:wrap;gap:6px;margin:6px 0;align-items:center}
    button{flex:1 1 auto;padding:5px 8px;border-radius:6px;border:1px solid #888;
      background:transparent;color:inherit;cursor:pointer;font:inherit}
    button.ativo{background:#c62828;color:#fff;border-color:#c62828}
    button:disabled{opacity:.4;cursor:default}
    input[type=number]{width:52px;font:inherit;color:inherit;background:transparent;border:1px solid #888;border-radius:6px;padding:3px}
    .status{font-size:12px;opacity:.8}
    details{border-top:1px solid rgba(128,128,128,.35);margin-top:8px;padding-top:4px}
    summary{cursor:pointer;font-weight:600;font-size:12px;text-transform:uppercase;letter-spacing:.03em;opacity:.8}
    .ind{font-size:12px;margin:5px 0}
    .ok{color:var(--ok)} .medio{color:var(--medio)} .ruim{color:var(--ruim)}
    .barra{height:6px;border-radius:3px;background:var(--trilho);overflow:hidden;margin-top:3px}
    .barra>div{height:100%;background:currentColor}
    .campos{display:grid;grid-template-columns:1fr 1fr;gap:2px 10px}
    table{width:100%;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums}
    th,td{text-align:right;padding:1px 4px} th:first-child,td:first-child{text-align:left}
    .rolagem{max-height:170px;overflow:auto}
    label{display:flex;gap:6px;align-items:center;font-size:12px;margin:3px 0;cursor:pointer}
    .busca{display:grid;grid-template-columns:1fr auto;gap:2px 6px;font-size:12px;padding:4px 0;border-bottom:1px dotted rgba(128,128,128,.4)}
    .busca.atual{font-weight:600}
    .busca .url{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    .busca .acoes{grid-column:1/-1;display:flex;gap:6px}
    .busca button{padding:2px 6px;font-size:12px}`;

  const status = (t) => { if (el.status) el.status.textContent = t; };

  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const pctTxt = (x) => (x == null ? '–' : `${Math.round(x * 100)}%`);
  // Verde a partir de "bom", âmbar a partir de "medio", vermelho abaixo.
  const nivel = (x, bom = 0.9, medio = 0.6) => (x == null ? '' : x >= bom ? 'ok' : x >= medio ? 'medio' : 'ruim');
  const NOMES_SUBTIPO = { loja_ponto: 'loja/ponto', sala: 'sala', galpao: 'galpão', predio: 'prédio', outro: 'outro', residencial: 'residencial' };

  // Cobertura da busca atual e funil da última página lida.
  function htmlPagina(lista) {
    const totais = lista.map((a) => Number(a.total_busca)).filter((n) => n > 0);
    const total = totais.length ? Math.max(...totais) : totalResultados();
    const cob = total ? Math.min(1, lista.length / total) : null;
    const cobTxt = total
      ? `Busca: ${lista.length} de ${total} anúncios (${pctTxt(cob)})`
      : `Busca: ${lista.length} anúncios; total da busca não lido na página`;
    const corCob = lerAuto() ? '' : nivel(cob, 0.8, 0.5);
    let h = `<div class="ind ${corCob}">${esc(cobTxt)}${cob != null ? `<div class="barra"><div style="width:${Math.round(cob * 100)}%"></div></div>` : ''}</div>`;
    if (ultimoFunil) {
      const f = ultimoFunil;
      const cor = f.comId < f.cards ? 'ruim' : f.comArea < f.comId * 0.8 ? 'medio' : 'ok';
      h += `<div class="ind ${cor}">Página: ${f.cards} cards → ${f.comId} com id → ${f.comPreco} com preço → ${f.comArea} com área</div>`;
      if (f.comId < f.cards) h += '<div class="ind ruim">Há cards sem id: o seletor do portal pode ter mudado.</div>';
    } else {
      h += '<div class="ind">Página ainda não lida nesta aba.</div>';
    }
    return h;
  }

  function htmlQualidade(lista, filtrados, filtros, todos) {
    let h = '';
    if (Object.values(filtros).some(Boolean)) h += `<div class="ind">Filtro: ${filtrados.length} de ${lista.length} anúncios da busca.</div>`;

    const q = qualidade(filtrados);
    h += '<div class="ind campos">' + CAMPOS_QUALIDADE.map(([c, nome]) => {
      const cor = c === 'condominio_iptu' ? nivel(q.pct[c], 0.6, 0.3) : nivel(q.pct[c]);
      return `<span class="${cor}">● ${nome} ${pctTxt(q.pct[c])}</span>`;
    }).join('') + '</div>';

    const m = mistura(lista);
    if (m.n) {
      h += `<div class="ind">Aluguel ${pctTxt(m.pctAluguel)} · venda ${pctTxt(m.pctVenda)} · fora de Salvador ${pctTxt(m.pctFora)}</div>`;
      const tipos = Object.entries(m.tipos).sort((x, y) => y[1] - x[1]).map(([t, n]) => `${NOMES_SUBTIPO[t] || t} ${n}`).join(' · ');
      h += `<div class="ind">Tipo estimado: ${esc(tipos)}</div>`;
      h += m.alertas.map((a) => `<div class="ind ruim">${esc(a)}</div>`).join('');
    }

    const d = previaDescarte(filtrados);
    if (d.aluguel) {
      const nomes = { semArea: 'sem área', preco: 'preço fora de R$ 300 a 100 mil', foraSalvador: 'fora de Salvador', m2: 'R$/m² fora de 3 a 500' };
      const motivos = Object.entries(d.motivos).filter(([, n]) => n).map(([k, n]) => `${n} ${nomes[k]}`).join(', ');
      const frac = d.total / d.aluguel;
      const cor = frac > 0.2 ? 'ruim' : frac > 0.05 ? 'medio' : 'ok';
      h += `<div class="ind ${cor}">O build deve descartar ${d.total} de ${d.aluguel} de aluguel${motivos ? `: ${esc(motivos)}` : ''}.</div>`;
    }

    const alvo = noAlvo(todos);
    const areas = Object.entries(alvo.porArea).map(([a, n]) => `<span class="${n >= MIN_AMOSTRA ? 'ok' : 'medio'}">${esc(a)} ${n}${n >= MIN_AMOSTRA ? ' ✓' : ''}</span>`).join(' · ');
    h += `<div class="ind">Neste portal: ${alvo.porte} de aluguel no porte (${PORTE_MIN} a ${PORTE_MAX} m²). Lojas e pontos no porte: ${areas}</div>`;
    return h;
  }

  function htmlHist(hist) {
    if (!hist.length) return '<div class="ind">Sem rodada automática nesta aba.</div>';
    const linhas = hist.map((r) => {
      const cor = r.lidos === 0 || r.ineditos === 0 ? 'ruim' : r.ineditos < r.lidos / 2 ? 'medio' : '';
      return `<tr class="${cor}"><td>${r.pagina}</td><td>${r.lidos}</td><td>${r.ineditos}</td><td>${r.novos}</td><td>${r.seg}</td></tr>`;
    }).join('');
    return `<div class="rolagem"><table><thead><tr><th>Pág.</th><th>Lidos</th><th>Inéditos</th><th>Novos</th><th>s</th></tr></thead><tbody>${linhas}</tbody></table></div>`;
  }

  function htmlBuscas(buscas, atual) {
    const rotulo = (b) => { try { const u = new URL(b); return decodeURIComponent(u.pathname + u.search); } catch (e) { return b; } };
    const linhas = buscas.map((b) => `<div class="busca ${b.busca === atual ? 'atual' : ''}">
      <span class="url" title="${esc(b.busca)}">${esc(rotulo(b.busca))}</span><span>${b.n} · ${esc(b.data)}</span>
      <span class="acoes"><button data-acao="baixar" data-busca="${esc(b.busca)}">Baixar</button><button data-acao="apagar" data-busca="${esc(b.busca)}" data-n="${b.n}">Apagar</button></span></div>`).join('');
    return (linhas || '<div class="ind">Nada guardado neste portal.</div>')
      + (buscas.length ? '<div class="linha"><button data-acao="apagar-tudo">Apagar tudo deste portal</button></div>' : '');
  }

  // Com filtro ativo, contorna os cards que passam e esmaece os demais.
  function destacarCards(filtros, dados) {
    const ativo = Object.values(filtros).some(Boolean);
    for (const [k, card] of cardsDaPagina) {
      if (!card.isConnected) continue;
      const passa = !!dados[k] && passaFiltros(dados[k], filtros);
      card.style.outline = ativo && passa ? '3px solid #2e7d32' : '';
      card.style.outlineOffset = ativo && passa ? '-3px' : '';
      card.style.opacity = ativo && !passa ? '0.35' : '';
    }
  }

  function atualizarPainel() {
    if (!el.contagem) return;
    const dados = carregar();
    const todos = Object.values(dados);
    el.contagem.textContent = `${todos.length} anúncios guardados neste portal (${todos.filter((a) => a.operacao === 'aluguel').length} de aluguel)`;
    const busca = buscaBase(portal, location.href);
    const lista = todos.filter((a) => buscaBase(portal, a.busca_url) === busca);
    const filtros = lerFiltros();
    el.pagina.innerHTML = htmlPagina(lista);
    el.qualidade.innerHTML = htmlQualidade(lista, lista.filter((a) => passaFiltros(a, filtros)), filtros, todos);
    el.hist.innerHTML = htmlHist(lerHist());
    el.buscas.innerHTML = htmlBuscas(agruparBuscas(portal, dados), busca);
    destacarCards(filtros, dados);
  }

  function mostrar(t) {
    atualizarPainel();
    if (t) status(t);
  }

  function atualizarBotoes() {
    if (!el.bAuto) return;
    const ativo = !!lerAuto();
    el.bAuto.textContent = ativo ? 'Parar' : 'Coletar todas as páginas';
    el.bAuto.classList.toggle('ativo', ativo);
    el.bPagina.disabled = ativo;
  }

  const secao = (titulo, conteudo, aberta = true) => criar('details', { open: aberta }, [criar('summary', { textContent: titulo }), conteudo]);

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
        gravarHist([]);
        passoAutomatico();
      },
    });
    const bCsv = criar('button', { textContent: 'Baixar CSV de tudo', onclick: () => baixarCsv() });

    el.pagina = criar('div');
    el.qualidade = criar('div');
    el.hist = criar('div');
    el.buscas = criar('div');
    el.buscas.onclick = (ev) => {
      const b = ev.target.closest('button');
      if (!b) return;
      const { acao, busca, n } = b.dataset;
      if (acao === 'baixar') baixarCsv(daBusca(carregar(), busca));
      if (acao === 'apagar' && confirm(`Apagar os ${n} anúncios guardados desta busca? Baixe o CSV antes.`)) { apagarBusca(busca); mostrar('Busca apagada.'); }
      if (acao === 'apagar-tudo' && confirm('Apagar todos os anúncios guardados deste portal? Baixe o CSV antes.')) { apagarBusca(null); mostrar('Guardados apagados.'); }
    };

    // Filtros: só mudam os indicadores da busca e o destaque dos cards; o CSV sai completo.
    const filtros = lerFiltros();
    const caixas = [['soAluguel', 'Só aluguel'], ['soComercial', 'Só comercial'], ['soLoja', 'Só loja ou ponto'], ['soAreas', 'Só áreas do 6.4 (Pituba/Itaigara, Barra/Graça, Rio Vermelho)']]
      .map(([k, nome]) => {
        const c = criar('input', { type: 'checkbox', checked: !!filtros[k] });
        c.onchange = () => { gravarFiltros({ ...lerFiltros(), [k]: c.checked }); atualizarPainel(); };
        return criar('label', {}, [c, criar('span', { textContent: nome })]);
      });

    const minimizar = criar('span', { textContent: '–' });
    const cabecalho = criar('header', {}, [criar('span', { textContent: `Aluguel · ${portal}` }), minimizar]);
    const painel = criar('div', { id: 'cal-painel' }, [
      cabecalho,
      el.contagem,
      criar('div', { className: 'linha' }, [el.bPagina]),
      criar('div', { className: 'linha' }, [el.bAuto]),
      criar('div', { className: 'linha' }, [criar('span', { textContent: 'Limite de páginas:' }), el.limite]),
      criar('div', { className: 'linha' }, [bCsv]),
      el.status,
      secao('Esta busca e esta página', el.pagina),
      secao('Qualidade', el.qualidade),
      secao('Filtros dos indicadores', criar('div', {}, caixas), false),
      secao('Rodada automática', el.hist, false),
      secao('Buscas guardadas', el.buscas, false),
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
