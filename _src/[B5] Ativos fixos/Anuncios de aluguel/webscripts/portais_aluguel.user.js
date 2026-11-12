// ==UserScript==
// @name         Coletor de anúncios de aluguel (TCC Luderia)
// @namespace    tcc-luderia
// @version      2026.11.12-3
// @description  Lê os anúncios das páginas de busca do OLX, ZAP Imóveis, Viva Real e QuintoAndar (preço, condomínio, IPTU, área, bairro), percorre as páginas e uma fila de buscas entre portais e exporta CSV.
// @match        https://www.olx.com.br/*
// @match        https://www.zapimoveis.com.br/*
// @match        https://www.vivareal.com.br/*
// @match        https://www.quintoandar.com.br/*
// @run-at       document-start
// @noframes
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// @grant        unsafeWindow
// ==/UserScript==

/*
 * Uso pessoal, para o Bloco B5 (ativos fixos): preço pedido de aluguel de pontos comerciais em
 * Salvador (cap. 9, premissas C04 e C05, e 6.4, escolha do bairro). Os portais bloqueiam
 * requisições fora do navegador (Cloudflare), por isso a coleta roda na página.
 *
 * Como usar (fila, o caminho normal): abrir qualquer página do OLX, do ZAP ou do Viva
 * Real e clicar em "Fila". A fila já vem com as 9 buscas do plano (Loja e Outros com
 * 100 m² ou mais na Pituba, na Graça e na Itaigara, nos três portais); a lista é
 * editável, uma URL por linha, e "Padrão" a restaura. Para outra fila, abrir "Montar
 * buscas", escolher bairros (selos ou texto), área mínima e máxima, tipos (loja/ponto,
 * sala, casa comercial, prédio, galpão) e portais, e clicar em "Gerar fila": a lista passa
 * a ter uma busca por portal, bairro e tipo (no OLX, os tipos numa busca só); tipo que o
 * portal não tem fica de fora, com aviso. O script abre cada busca, coleta
 * todas as páginas, confere a cobertura (lidos ÷ total que o portal diz ter), repete a
 * busca uma vez se ela ficar abaixo de 95%, espera 8 a 15 s e passa à próxima, mesmo
 * em outro portal. No fim, toca um som e baixa um CSV só, com tudo o que foi guardado.
 * "Parar" pausa a fila; "Continuar" retoma da busca em que parou. A tabela da fila
 * mostra, por busca, lidos, total e cobertura.
 *
 * Uma busca avulsa: abrir a busca no portal, já filtrada (tipo, cidade, bairro), e clicar
 * em "Todas". O script lê a página, rola até o fim, guarda os anúncios e vai para a página
 * seguinte (?o=N no OLX, ?pagina=N no ZAP e no Viva Real, botão "Ver mais" no
 * QuintoAndar) até uma página vir vazia, não trazer anúncio inédito nesta rodada, ler o
 * total da busca ou chegar ao limite. "Inédito" conta só a rodada: refazer uma busca já
 * guardada percorre todas as páginas de novo. No fim, toca um som e baixa o CSV.
 *
 * Os anúncios ficam no armazenamento do Tampermonkey, comum aos portais (o que estava no
 * localStorage de cada portal, nas versões anteriores, passa para lá ao abrir o portal),
 * até "Apagar". Se aparecer o desafio do Cloudflare, a rodada pausa e retoma da mesma
 * página depois que ele for resolvido. Cada anúncio leva o total de resultados que o
 * portal diz ter na busca (total_busca), para o build medir a cobertura.
 *
 * Painel (mesmas regras de UI do coletor de preços e do de avaliações): botões com ícone
 * (Heroicons) e nome curto, com o nome completo e a explicação na dica ao passar o mouse;
 * filtros em selos que ligam e desligam; arraste pelo cabeçalho e redimensione pelo canto
 * inferior direito (posição e tamanho ficam salvos; duplo clique no cabeçalho volta ao
 * canto); barras de progresso da busca e da fila. Som: o navegador só libera áudio depois
 * de um clique na página; na fila, clique uma vez no painel para o aviso final tocar. Mostra os anúncios fora de CSV (com 100 ou mais, cobra o
 * download e o navegador pede confirmação ao fechar a aba), a cobertura da busca (lidos
 * ÷ total do portal), a coleta mais antiga da busca (alerta acima de 30 dias), a mediana,
 * P25 e P75 do R$/m² pedido, o funil da última página (cards → com id → com preço → com
 * área), o preenchimento de cada campo, a mistura de operação, cidade e tipo, a prévia do
 * que o build vai descartar, quantos anúncios estão no alvo (porte do plano e áreas do
 * 6.4), o histórico da rodada automática e as buscas guardadas, com "Baixar" e "Apagar"
 * por busca (Apagar baixa antes o CSV do que sai). Os filtros só mudam esses indicadores
 * e o destaque dos cards na página; nada é descartado na coleta, e o CSV sai completo.
 *
 * Buscas que funcionam (02/11/2026; por bairro, nos três portais, em 12/11/2026):
 *  - OLX:       /imoveis/comercio-e-industria/aluguel/estado-ba/salvador/<bairro>?commt=6&commt=7&ss=100
 *               (bairro: pituba, graca, itaigara; commt=6 e 7 são Loja e Outros; ss=100 é
 *               área de 100 m² ou mais). Usar o caminho do bairro, não a busca por texto
 *               (?q=pituba): o texto perde anúncios do bairro e traz os de outros bairros
 *               que citam o nome no título (12/11/2026: 3 de 114 perdidos na Pituba).
 *               Sem /aluguel, a busca mistura venda e aluguel (a coluna operacao separa).
 *  - ZAP:       /aluguel/loja-salao/ba+salvador++<bairro>/?areaMinima=100&ordem=LOWEST_PRICE (e
 *               /aluguel/conjunto-comercial-sala/ba+salvador/ para salas)
 *  - Viva Real: /aluguel/bahia/salvador/bairros/<bairro>/ponto-comercial_comercial/?areaMinima=100&ordem=LOWEST_PRICE
 *               ZAP e Viva Real são do mesmo grupo e repetem os anúncios: o build junta pelo
 *               id. Sem ordem=LOWEST_PRICE (menor preço), a ordem "relevância" muda de uma
 *               página para a outra, repete anúncios e deixa outros de fora (12/11/2026,
 *               Pituba: 68 de 74 no ZAP e 70 de 74 no Viva Real; com a ordem, 74 nos dois).
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
  const CHAVE_EXPORTACAO = 'tcc_aluguel_exportado_em';
  const CHAVE_FILA = 'tcc_aluguel_fila';
  const CHAVE_FILA_TEXTO = 'tcc_aluguel_fila_texto';
  const CHAVE_POSICAO = 'tcc_aluguel_posicao';
  const PAUSA_FILA = [8000, 15000]; // ms entre buscas da fila (sorteado)
  const COBERTURA_MIN = 0.95; // abaixo disso, a fila repete a busca uma vez
  const LIMITE_FILA = 50; // páginas por busca na fila
  const NOMES_PORTAL = { olx: 'OLX', zap: 'ZAP', vivareal: 'Viva Real', quintoandar: 'QuintoAndar' };

  const CHAVE_MONTAGEM = 'tcc_aluguel_montagem';

  // ---------- montagem das buscas da fila (bairro, área e tipo) ----------
  // Endereços conferidos nos três portais em 12/11/2026 (Pituba, 100 a 200 m²):
  //  - OLX: tipo no parâmetro commt (1 Escritório, 2 Galpão/Depósito, 6 Loja, 7 Outros;
  //    vários na mesma URL), área em ss (mínima) e se (máxima).
  //  - ZAP: tipo no caminho (loja-salao, conjunto-comercial-sala, casa-comercial,
  //    predio-inteiro); sem galpão para aluguel em Salvador (404).
  //  - Viva Real: tipo no caminho (ponto-comercial_comercial, sala_comercial,
  //    imovel-comercial_comercial, predio_comercial); sem galpão (404).
  //  - ZAP e Viva Real: área em areaMinima e areaMaxima; ordem=LOWEST_PRICE (sem ela, a
  //    ordem muda entre páginas e anúncios ficam de fora).
  // Tipo sem busca num portal fica de fora da fila daquele portal (o painel avisa).
  const TIPOS_BUSCA = {
    loja: { rotulo: 'loja/ponto', dica: 'Loja, salão ou ponto comercial (OLX: Loja e Outros)', olx: [6, 7], zap: 'loja-salao', vivareal: 'ponto-comercial_comercial' },
    sala: { rotulo: 'sala', dica: 'Sala ou conjunto comercial (OLX: Escritório)', olx: [1], zap: 'conjunto-comercial-sala', vivareal: 'sala_comercial' },
    casa: { rotulo: 'casa comercial', dica: 'Casa ou imóvel comercial (só ZAP e Viva Real)', olx: null, zap: 'casa-comercial', vivareal: 'imovel-comercial_comercial' },
    predio: { rotulo: 'prédio', dica: 'Prédio inteiro (só ZAP e Viva Real)', olx: null, zap: 'predio-inteiro', vivareal: 'predio_comercial' },
    galpao: { rotulo: 'galpão', dica: 'Galpão ou depósito (só OLX)', olx: [2], zap: null, vivareal: null },
  };
  // Bairros com selo no painel: os finalistas e as demais áreas do 6.4; outros, por texto.
  const BAIRROS_SELO = ['Pituba', 'Itaigara', 'Graça', 'Barra', 'Rio Vermelho'];
  const PORTAIS_BUSCA = ['olx', 'zap', 'vivareal'];
  // Buscas do plano (C04 e C05, áreas do 6.4): Loja e Outros com 100 m² ou mais.
  const MONTAGEM_PADRAO = { bairros: ['Pituba', 'Graça', 'Itaigara'], outros: '', areaMin: 100, areaMax: null, tipos: ['loja'], portais: PORTAIS_BUSCA };

  // "Rio Vermelho" -> "rio-vermelho"; "Graça" -> "graca" (como os portais escrevem o bairro na URL).
  const slugBairro = (b) => String(b || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const numeroOuNulo = (v) => { const n = parseInt(v, 10); return Number.isFinite(n) && n > 0 ? n : null; };

  // Bairros da montagem: selos ligados mais os digitados (vírgula ou ponto e vírgula), sem repetir.
  function bairrosDaMontagem(m) {
    const todos = [...(m.bairros || []), ...String(m.outros || '').split(/[,;]/)].map(slugBairro).filter(Boolean);
    return [...new Set(todos)];
  }

  // URLs da fila para a montagem: por portal, bairro e tipo (no OLX, os tipos numa URL só).
  // Devolve as URLs e os tipos sem busca em algum portal.
  function montarBuscas(m) {
    const bairros = bairrosDaMontagem(m);
    const min = numeroOuNulo(m.areaMin);
    let max = numeroOuNulo(m.areaMax);
    if (min && max && max < min) max = null;
    const tipos = (m.tipos || []).filter((t) => TIPOS_BUSCA[t]);
    const portais = PORTAIS_BUSCA.filter((p) => (m.portais || []).includes(p));
    const urls = [];
    const semBusca = [];
    for (const p of portais) {
      const comBusca = tipos.filter((t) => TIPOS_BUSCA[t][p]);
      tipos.filter((t) => !TIPOS_BUSCA[t][p]).forEach((t) => semBusca.push(`${TIPOS_BUSCA[t].rotulo} no ${NOMES_PORTAL[p]}`));
      if (!comBusca.length) continue;
      for (const b of bairros) {
        if (p === 'olx') {
          const q = [...new Set(comBusca.flatMap((t) => TIPOS_BUSCA[t].olx))].sort((x, y) => x - y).map((c) => `commt=${c}`);
          if (min) q.push(`ss=${min}`);
          if (max) q.push(`se=${max}`);
          urls.push(`https://www.olx.com.br/imoveis/comercio-e-industria/aluguel/estado-ba/salvador/${b}?${q.join('&')}`);
          continue;
        }
        const q = [min && `areaMinima=${min}`, max && `areaMaxima=${max}`, 'ordem=LOWEST_PRICE'].filter(Boolean).join('&');
        for (const t of comBusca) {
          urls.push(p === 'zap'
            ? `https://www.zapimoveis.com.br/aluguel/${TIPOS_BUSCA[t].zap}/ba+salvador++${b}/?${q}`
            : `https://www.vivareal.com.br/aluguel/bahia/salvador/bairros/${b}/${TIPOS_BUSCA[t].vivareal}/?${q}`);
        }
      }
    }
    return { urls, semBusca, bairros };
  }

  const FILA_PADRAO = montarBuscas(MONTAGEM_PADRAO).urls.join('\n');
  const AVISO_PENDENTES = 100; // anúncios fora de CSV (cerca de 3 páginas) a partir dos quais o painel cobra o download
  const IDADE_MAX = 30; // dias até a coleta mais antiga de uma busca pedir revisão

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

  // Armazenamento do Tampermonkey (comum aos portais, sem o limite do localStorage); sem
  // GM_* (testes), cai no localStorage.
  const temGM = typeof GM_getValue === 'function';
  function gmLer(k, padrao) {
    try {
      if (temGM) return GM_getValue(k, padrao);
      const v = localStorage.getItem(k);
      return v == null ? padrao : JSON.parse(v);
    } catch (e) { return padrao; }
  }
  function gmGravar(k, v) {
    try { if (temGM) GM_setValue(k, v); else localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { console.error(NOME, 'armazenamento recusou', e); return false; }
  }
  const gmApagar = (k) => { try { if (temGM) GM_deleteValue(k); else localStorage.removeItem(k); } catch (e) { /* nada a apagar */ } };

  const carregar = () => gmLer(CHAVE, {}) || {};

  // Devolve false se o armazenamento recusar: quem chama avisa e baixa o CSV.
  const salvar = (dados) => gmGravar(CHAVE, dados);

  // Junta ao armazenamento do Tampermonkey o que as versões anteriores deixaram no
  // localStorage deste portal (fica a coleta mais recente de cada anúncio) e o apaga de lá.
  function migrarLocalStorage() {
    if (!temGM) return 0;
    let antigos = null;
    try { antigos = JSON.parse(localStorage.getItem(CHAVE) || 'null'); } catch (e) { antigos = null; }
    const exportado = Number(localStorage.getItem(CHAVE_EXPORTACAO)) || 0;
    if (exportado > gmLer(CHAVE_EXPORTACAO, 0)) gmGravar(CHAVE_EXPORTACAO, exportado);
    if (!antigos || typeof antigos !== 'object') return 0;
    const dados = carregar();
    let n = 0;
    for (const [k, a] of Object.entries(antigos)) {
      if (!dados[k] || String(a.data_coleta || '') > String(dados[k].data_coleta || '')) { dados[k] = a; n++; }
    }
    if (salvar(dados)) { localStorage.removeItem(CHAVE); localStorage.removeItem(CHAVE_EXPORTACAO); }
    return n;
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
  // Portal do nome do CSV: o das linhas, ou "portais" quando o arquivo mistura mais de um.
  const portalDoArquivo = (linhas, padrao) => { const ps = new Set(linhas.map((l) => l.portal).filter(Boolean)); return ps.size === 1 ? [...ps][0] : ps.size ? 'portais' : padrao; };

  // ---------- fila de buscas (sem DOM: testável) ----------

  // Uma URL de busca por linha, de um portal conhecido; sem repetidas.
  function lerItensFila(texto) {
    const vistos = new Set();
    const itens = [];
    for (const linha of String(texto || '').split(/\r?\n/)) {
      const t = linha.trim();
      if (!t || t.startsWith('#')) continue;
      let u;
      try { u = new URL(t); } catch (e) { continue; }
      if (!portalDe(u.hostname) || vistos.has(u.toString())) continue;
      vistos.add(u.toString());
      itens.push(u.toString());
    }
    return itens;
  }

  // "OLX · pituba": portal e bairro da URL (++bairro no ZAP, /bairros/ no Viva Real, o
  // segmento depois de /salvador/ no OLX e no QuintoAndar).
  function rotuloBusca(url) {
    try {
      const u = new URL(url);
      const p = portalDe(u.hostname);
      const d = decodeURIComponent(u.pathname);
      const m = d.match(/\+\+([^/]+)/) || d.match(/\/bairros\/([^/]+)/) || (p === 'olx' ? d.match(/\/salvador\/([^/]+)/) : null)
        || (p === 'quintoandar' ? d.match(/\/imovel\/([^/]+?)-salvador/) : null);
      return `${NOMES_PORTAL[p] || p}${m ? ` · ${m[1].replace(/-/g, ' ')}` : ''}${tipoDaUrl(p, u)}`;
    } catch (e) { return String(url); }
  }

  // " · sala": tipo da busca no rótulo, quando não é o padrão (loja/ponto), para distinguir
  // na tabela da fila as buscas do mesmo bairro.
  function tipoDaUrl(p, u) {
    const nomes = Object.values(TIPOS_BUSCA).filter((t) => {
      if (p === 'olx') {
        const c = u.searchParams.getAll('commt').map(Number);
        return t.olx && t.olx.every((x) => c.includes(x));
      }
      return t[p] && decodeURIComponent(u.pathname).split('/').includes(t[p]);
    }).map((t) => t.rotulo);
    return nomes.length && !(nomes.length === 1 && nomes[0] === TIPOS_BUSCA.loja.rotulo) ? ` · ${nomes.join(', ')}` : '';
  }

  // Resultado de uma busca da fila: lidos (distintos na rodada), total do portal e cobertura.
  function resultadoBusca(url, lidos, total, paginas, motivo) {
    const t = total > 0 ? total : null;
    return { url, rotulo: rotuloBusca(url), lidos, total: t, cobertura: t ? Math.min(1, lidos / t) : null, paginas, motivo };
  }

  // Mesma busca, para a fila reconhecer a página que abriu: host e caminho, sem a barra
  // final e sem o "/grande-salvador" que o OLX tira no redirecionamento; ignora a query.
  function chaveBusca(url) {
    try {
      const u = new URL(url);
      return `${u.hostname.replace(/^www\./, '')}${decodeURIComponent(u.pathname).replace(/\/grande-[^/]+/, '').replace(/\/+$/, '')}`.toLowerCase();
    } catch (e) { return String(url); }
  }

  // Repete a busca (uma vez) se a cobertura ficou abaixo do mínimo; sem total, não repete.
  const repetirBusca = (r, tentativa) => r.cobertura != null && r.cobertura < COBERTURA_MIN && !(tentativa > 0);

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

  const RE_BUSCA_COMERCIAL = /loja-salao|conjunto-comercial|comercio-e-industria|ponto-comercial|casa-comercial|imovel-comercial|galpao|predio-inteiro|imoveis-comerciais|consultorio/;
  const RE_BUSCA_RESIDENCIAL = /quintoandar\.com\.br|\/apartamentos?[/_-]|\/casas?[/_-]|kitnet|flat|cobertura/;
  const RE_COMERCIAL = /\b(lojas?|(?:salao|saloes|salas?|pontos?|imove(?:l|is)|predios?|conjuntos?|box) comercia(?:l|is)|galpao|galpoes|depositos?|armazem|escritorios?|consultorios?|andar corporativo|sala para escritorio|sala empresarial|centro empresarial)\b/;
  const SUBTIPO_BUSCA = [['loja_ponto', /loja-salao|ponto-comercial/], ['sala', /conjunto-comercial|consultorio/], ['galpao', /galpao/], ['predio', /predio-inteiro/]];
  const SUBTIPO_TEXTO = [
    ['galpao', /\b(galpao|galpoes|depositos?|armazem)\b/],
    ['predio', /\b(predios? comercia(?:l|is)|predio inteiro)\b/],
    ['sala', /\b(salas? comercia(?:l|is)|conjuntos? comercia(?:l|is)|escritorios?|consultorios?|andar corporativo|sala para escritorio|sala empresarial|centro empresarial)\b/],
    ['loja_ponto', /\b(lojas?|pontos? comercia(?:l|is)|salao comercial|saloes comerciais|box comercial)\b/],
  ];

  // Parte da busca que diz o tipo: o parâmetro tipos= do ZAP e do Viva Real, se houver, ou a URL
  // toda. Com mais de um tipo ("tipos=imovel-comercial_comercial,ponto-comercial_comercial"),
  // null: a busca não decide o subtipo, e vale o tipo e o título do anúncio.
  function tiposDaBusca(url) {
    let u = url;
    try { u = decodeURIComponent(url); } catch (e) { /* URL mal codificada: usa como veio */ }
    const m = u.match(/[?&]tipos=([^&]*)/);
    if (!m) return u;
    return m[1].includes(',') ? null : m[1];
  }

  // Segmento e subtipo como no build: pela categoria da busca e, sem ela, pelo tipo e título.
  function classificar(a) {
    const url = String(a.busca_url || '').toLowerCase();
    const txt = semAcento(`${a.tipo || ''} ${a.titulo || ''}`);
    let segmento;
    if (RE_BUSCA_COMERCIAL.test(url)) segmento = 'comercial';
    else if (RE_BUSCA_RESIDENCIAL.test(url)) segmento = 'residencial';
    else segmento = RE_COMERCIAL.test(txt) ? 'comercial' : 'residencial';
    if (segmento === 'residencial') return { segmento, subtipo: 'residencial' };
    const tipos = tiposDaBusca(url);
    const porBusca = tipos === null ? null : SUBTIPO_BUSCA.find(([, re]) => re.test(tipos));
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
      if (a.portal && a.portal !== portal) continue;
      const b = buscaBase(portal, a.busca_url);
      const x = g.get(b) || { busca: b, n: 0, data: '' };
      x.n++;
      if (String(a.data_coleta || '') > x.data) x.data = a.data_coleta;
      g.set(b, x);
    }
    return [...g.values()].sort((p, q) => q.data.localeCompare(p.data) || q.n - p.n);
  }

  // Anúncios lidos depois da última exportação do CSV de tudo (sem alterado_em: lidos antes
  // deste controle, contam como pendentes).
  const pendentes = (dados, exportadoEm) => Object.values(dados).filter((a) => (a.alterado_em || Infinity) > (exportadoEm || 0)).length;

  // Quantil com interpolação linear, como o pandas no build.
  const quantil = (vs, q) => {
    const s = vs.filter((v) => Number.isFinite(v)).sort((a, b) => a - b);
    if (!s.length) return null;
    const pos = (s.length - 1) * q;
    const i = Math.floor(pos);
    return s[i] + (s[Math.min(i + 1, s.length - 1)] - s[i]) * (pos - i);
  };
  const diasEntre = (de, ate) => Math.round((Date.parse(ate) - Date.parse(de)) / 86400000);

  // R$/m² pedido (aluguel ÷ área) dos anúncios de aluguel com área: n, mediana, P25 e P75.
  function resumoM2(lista) {
    const m2 = lista.filter((a) => a.operacao === 'aluguel' && a.aluguel > 0 && a.area_m2 > 0).map((a) => a.aluguel / a.area_m2);
    return { n: m2.length, mediana: quantil(m2, 0.5), p25: quantil(m2, 0.25), p75: quantil(m2, 0.75) };
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

  // Com @grant, o script roda numa caixa isolada: o fetch da página é o do unsafeWindow.
  function interceptarQuinto() {
    const w = typeof unsafeWindow !== 'undefined' ? unsafeWindow : window;
    const original = w.fetch;
    w.fetch = async function (...args) {
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

  // OLX (12/11/2026): o contador "1 - 13 de 13 resultados" fica num <p> dentro da div
  // de classe "…_titleContainer", fora do h1; por isso ela vem antes dos genéricos.
  function totalResultados() {
    const candidatos = document.querySelectorAll('[class*="titleContainer"] p, h1, h2, [data-cy*="title"], [data-testid*="result"], [class*="result"], [class*="Result"]');
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
    const total = totalResultados();
    const novos = guardar(guardados, anuncios, { busca_url: location.href, pagina, total_busca: total, data_coleta: dataLocal(), alterado_em: Date.now() });
    const gravou = salvar(guardados);
    return { anuncios, lidos: anuncios.length, novos, gravou, total };
  }

  let ultimoFunil = null;

  // Histórico da rodada (página, lidos, inéditos, novos, segundos): fica na aba depois do fim.
  const lerHist = () => { try { return JSON.parse(sessionStorage.getItem(CHAVE_HIST) || '[]'); } catch (e) { return []; } };
  const gravarHist = (h) => { try { sessionStorage.setItem(CHAVE_HIST, JSON.stringify(h)); } catch (e) { /* sem histórico */ } };

  const lerFiltros = () => gmLer(CHAVE_FILTROS, {}) || {};
  const gravarFiltros = (f) => gmGravar(CHAVE_FILTROS, f);
  const exportadoEm = () => Number(gmLer(CHAVE_EXPORTACAO, 0)) || 0;

  const doPortal = (a) => !a.portal || a.portal === portal;

  // Apaga os anúncios de uma busca (ou todos os deste portal, sem busca).
  function apagarBusca(busca) {
    const dados = carregar();
    for (const [k, a] of Object.entries(dados)) if (doPortal(a) && (!busca || buscaBase(portal, a.busca_url) === busca)) delete dados[k];
    salvar(dados);
  }

  const daBusca = (dados, busca) => Object.fromEntries(Object.entries(dados).filter(([, a]) => doPortal(a) && buscaBase(portal, a.busca_url) === busca));
  const doPortalTodo = (dados) => Object.fromEntries(Object.entries(dados).filter(([, a]) => doPortal(a)));

  function avisarCheio() {
    gravarAuto(null);
    pararFila();
    atualizarBotoes();
    baixarCsv(guardados);
    status('O armazenamento recusou a gravação: o CSV saiu com tudo o que foi lido. Confira o arquivo, apague buscas em "Buscas guardadas" e retome.');
  }

  // parcial: CSV de uma busca, que não conta como exportação de tudo (aviso de pendentes).
  function baixarCsv(dados = carregar(), parcial = false) {
    const linhas = Object.values(dados).sort((a, b) => (a.pagina - b.pagina) || String(a.id).localeCompare(String(b.id)));
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv(linhas)], { type: 'text/csv;charset=utf-8' }));
    a.download = nomeArquivo(portalDoArquivo(linhas, portal), dataLocal(), horaLocal());
    (document.body || document.documentElement).appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 2000);
    if (!parcial) gmGravar(CHAVE_EXPORTACAO, Date.now());
  }

  // O navegador só libera o áudio depois de um clique: o painel chama liberarAudio a cada clique.
  let audio = null;
  function liberarAudio() {
    try { audio = audio || new AudioContext(); if (audio.state === 'suspended') audio.resume(); } catch (e) { audio = null; }
  }
  function som(ok = true) {
    try {
      liberarAudio();
      const o = audio.createOscillator();
      o.connect(audio.destination);
      o.frequency.value = ok ? 880 : 330;
      o.start();
      o.stop(audio.currentTime + 0.4);
    } catch (e) { /* sem som */ }
  }

  const lerAuto = () => { try { return JSON.parse(sessionStorage.getItem(CHAVE_AUTO) || 'null'); } catch (e) { return null; } };
  const gravarAuto = (v) => { try { v ? sessionStorage.setItem(CHAVE_AUTO, JSON.stringify(v)) : sessionStorage.removeItem(CHAVE_AUTO); } catch (e) { /* sem modo automático */ } };

  function concluir(auto, motivo) {
    gravarAuto(null);
    atualizarBotoes();
    if (auto.fila && lerFila()?.ativa) { fimDaBuscaNaFila(auto, motivo); return; }
    progresso(el.pBusca, null);
    som();
    baixarCsv();
    status(`Concluído: ${auto.paginas} páginas, ${auto.total} anúncios novos (${motivo}).`);
  }

  function progressoBusca(auto) {
    const n = (auto.vistos || []).length;
    const t = auto.totalBusca;
    progresso(el.pBusca, t ? n / t : 0, `Busca: ${n}${t ? ` de ${t}` : ''} anúncios · ${auto.paginas} pág.`);
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
    const { anuncios, lidos, novos, gravou, total } = await coletarPagina(pagina);
    if (!gravou) { avisarCheio(); return; }
    if (total) auto.totalBusca = Math.max(auto.totalBusca || 0, total);
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
    progressoBusca(auto);
    if (lidos === 0) return concluir(auto, 'página vazia');
    if (inedit.length === 0) return concluir(auto, 'página sem anúncio inédito');
    // Total lido: poupa a visita a uma página a mais (que viria vazia ou repetida).
    if (auto.totalBusca && auto.vistos.length >= auto.totalBusca) return concluir(auto, 'total da busca lido');
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

  // ---------- fila em execução (sobrevive à troca de página e de portal pelo Tampermonkey) ----------
  // fila = { itens: [url], i, ativa, tentativa, resultados: [resultadoBusca], inicio }

  const lerFila = () => gmLer(CHAVE_FILA, null);
  const gravarFila = (f) => gmGravar(CHAVE_FILA, f);
  const sortear = ([a, b]) => a + Math.random() * (b - a);
  let contando = false; // pausa entre buscas em curso nesta aba

  // Espera contando no status; devolve false se a fila parar no meio.
  async function esperarContando(ms, texto) {
    contando = true;
    const fim = Date.now() + ms;
    try {
      while (Date.now() < fim) {
        if (!lerFila()?.ativa) return false;
        status(`${texto} ${Math.ceil((fim - Date.now()) / 1000)} s.`);
        await esperar(500);
      }
      return true;
    } finally { contando = false; }
  }

  function progressoFila(fila) {
    if (!fila?.itens?.length) { progresso(el.pFila, null); return; }
    const n = fila.itens.length;
    const atual = fila.itens[fila.i];
    progresso(el.pFila, fila.i / n, `Fila: ${fila.i} de ${n} buscas${atual && fila.ativa ? ` · agora ${rotuloBusca(atual)}` : ''}`);
  }

  function iniciarFila() {
    const texto = el.filaTexto.value;
    gmGravar(CHAVE_FILA_TEXTO, texto);
    const itens = lerItensFila(texto);
    if (!itens.length) { status('A fila está vazia: uma URL de busca do OLX, ZAP, Viva Real ou QuintoAndar por linha.'); return; }
    const antiga = lerFila();
    if (antiga && antiga.i > 0 && antiga.i < antiga.itens.length && !confirm(`Há uma fila em curso (${antiga.i} de ${antiga.itens.length} buscas). Começar outra do zero?`)) return;
    liberarAudio();
    gravarFila({ itens, i: 0, ativa: true, tentativa: 0, resultados: [], inicio: Date.now() });
    abrirItem();
  }

  function continuarFila() {
    const fila = lerFila();
    if (!fila || fila.i >= fila.itens.length) { status('Não há fila para continuar.'); return; }
    liberarAudio();
    gravarFila({ ...fila, ativa: true });
    abrirItem();
  }

  function pararFila() {
    const fila = lerFila();
    if (fila?.ativa) gravarFila({ ...fila, ativa: false });
  }

  // Abre a busca atual da fila; ao carregar, verificar() a começa (iniciarBuscaDaFila).
  function abrirItem() {
    const fila = lerFila();
    if (!fila?.ativa) return;
    progressoFila(fila);
    atualizarBotoes();
    status(`Abrindo ${rotuloBusca(fila.itens[fila.i])}…`);
    location.href = fila.itens[fila.i];
  }

  function iniciarBuscaDaFila() {
    const fila = lerFila();
    iniciouAuto = true;
    gravarAuto({ limite: LIMITE_FILA, paginas: 0, total: 0, fila: true });
    gravarHist([]);
    progressoFila(fila);
    status(`Fila ${fila.i + 1} de ${fila.itens.length}: ${rotuloBusca(fila.itens[fila.i])}…`);
    passoAutomatico();
  }

  async function fimDaBuscaNaFila(auto, motivo) {
    const fila = lerFila();
    const url = fila.itens[fila.i];
    const r = { ...resultadoBusca(url, (auto.vistos || []).length, auto.totalBusca, auto.paginas, motivo), tentativa: fila.tentativa || 0 };
    fila.resultados = [...(fila.resultados || []).filter((x) => x.url !== url), r];
    const cob = r.cobertura == null ? 'sem total' : pctTxt(r.cobertura);
    if (repetirBusca(r, fila.tentativa)) {
      gravarFila({ ...fila, tentativa: 1 });
      mostrar();
      if (!(await esperarContando(sortear(PAUSA_FILA), `${r.rotulo}: ${r.lidos} de ${r.total} (${cob}). Repetindo a busca em`))) return pausada();
      abrirItem();
      return;
    }
    fila.i++;
    fila.tentativa = 0;
    gravarFila(fila);
    mostrar();
    if (fila.i >= fila.itens.length) { encerrarFila(fila); return; }
    if (!(await esperarContando(sortear(PAUSA_FILA), `${r.rotulo}: ${r.lidos} lidos (${cob}). Próxima busca (${fila.i + 1} de ${fila.itens.length}) em`))) return pausada();
    abrirItem();
  }

  function pausada() {
    const fila = lerFila();
    atualizarBotoes();
    status(`Fila pausada em ${fila?.i ?? 0} de ${fila?.itens?.length ?? 0} buscas. "Continuar" retoma.`);
  }

  function encerrarFila(fila) {
    gravarFila({ ...fila, ativa: false, fim: Date.now() });
    atualizarBotoes();
    progresso(el.pBusca, null);
    progressoFila(fila);
    const rs = fila.resultados || [];
    const baixas = rs.filter((r) => r.cobertura != null && r.cobertura < COBERTURA_MIN);
    som(!baixas.length);
    baixarCsv();
    mostrar(`Fila concluída: ${rs.length} buscas, ${rs.reduce((n, r) => n + r.lidos, 0)} anúncios lidos; CSV de tudo baixado.`
      + (baixas.length ? ` Abaixo de ${pctTxt(COBERTURA_MIN)}: ${baixas.map((r) => r.rotulo).join(', ')}.` : ''));
  }

  // ---------- painel (padrão: canto superior direito, shadow DOM, fora do <body>) ----------
  // Mesmas regras de UI do coletor de preços (precos_itens.user.js): botões com ícone
  // (Heroicons) e nome curto, com o nome completo e a explicação na dica; filtros em selos que
  // ligam e desligam; resumo em grade; painel montado com createElement (sem innerHTML).

  const el = {};
  let hospedeiro = null;

  function criar(tag, props = {}, filhos = []) {
    const n = document.createElement(tag);
    Object.assign(n, props);
    for (const f of filhos) n.appendChild(f);
    return n;
  }

  const CSS_PAINEL = `
    #cal-painel{position:fixed;top:12px;right:12px;z-index:2147483647;width:360px;
      max-height:calc(100vh - 24px);overflow:auto;box-sizing:border-box;
      resize:both;min-width:300px;min-height:120px;max-width:calc(100vw - 24px);
      background:#fff;color:#111;border:1px solid #ccc;border-radius:10px;
      box-shadow:0 4px 16px rgba(0,0,0,.18);font:13px/1.4 system-ui,sans-serif;padding:10px;
      --azul:#2563eb;--vermelho:#b91c1c;--linha:rgba(128,128,128,.25)}
    @media (prefers-color-scheme:dark){#cal-painel{background:#1e1e1e;color:#eee;border-color:#444;--azul:#3b82f6;--vermelho:#dc2626}}
    #cal-painel.min>*:not(header){display:none}
    #cal-painel.min{height:auto!important;min-height:0;resize:none}
    #cal-painel.arrastando{user-select:none;opacity:.92}
    header{display:flex;justify-content:space-between;align-items:center;font-weight:700;cursor:grab;touch-action:none;user-select:none}
    #cal-painel.arrastando header{cursor:grabbing}
    textarea{width:100%;box-sizing:border-box;height:72px;font:11px/1.45 ui-monospace,Menlo,monospace;color:inherit;
      background:transparent;border:1px solid #888;border-radius:6px;padding:4px;resize:vertical;white-space:pre;overflow:auto}
    .progresso{margin:6px 0;font-size:12px}
    .progresso[hidden]{display:none}
    .progresso .trilho{height:8px;border-radius:4px;background:var(--linha);overflow:hidden;margin-bottom:2px}
    .progresso .trilho>span{display:block;height:100%;width:0;background:var(--azul);transition:width .3s}
    tr.atual td{font-weight:600}
    p{margin:4px 0}
    svg.ico{width:14px;height:14px;flex:0 0 auto;vertical-align:-2px}
    .linha{display:flex;flex-wrap:wrap;gap:6px;margin:6px 0;align-items:center}
    button{flex:1 1 auto;display:inline-flex;align-items:center;justify-content:center;gap:4px;padding:5px 8px;
      border-radius:6px;border:1px solid #888;background:transparent;color:inherit;cursor:pointer;font:inherit;white-space:nowrap}
    button:disabled{opacity:.4;cursor:default}
    button.principal{background:var(--azul);border-color:var(--azul);color:#fff;font-weight:600}
    button.ativo{background:var(--vermelho);border-color:var(--vermelho);color:#fff;font-weight:600}
    button.ic{flex:0 0 auto;padding:4px 7px}
    .tag{flex:0 0 auto;border-radius:999px;padding:2px 9px;font-size:12px;opacity:.55}
    .tag.on{opacity:1;background:var(--azul);border-color:var(--azul);color:#fff}
    input{font:inherit;color:inherit;background:transparent;border:1px solid #888;border-radius:6px;padding:3px}
    input[type=number]{width:56px}
    input.largo{flex:1 1 140px;min-width:0}
    .rotulo{display:inline-flex;align-items:center;gap:3px;opacity:.7;font-size:12px}
    .info{font-size:12px;display:inline-flex;align-items:center;gap:3px}
    .caixa{border:1px solid var(--linha);border-radius:8px;padding:6px 8px;margin:6px 0}
    .grade{display:grid;grid-template-columns:auto 1fr auto 1fr;gap:2px 8px;font-size:12px;align-items:center}
    .grade+.grade{margin-top:6px;padding-top:6px;border-top:1px solid var(--linha)}
    .grade .k{opacity:.6;display:inline-flex;align-items:center;gap:3px}
    .grade .v{font-variant-numeric:tabular-nums;display:inline-flex;align-items:center;gap:3px}
    .grade .largo{grid-column:2 / -1}
    .grade .todo{grid-column:1 / -1;display:flex;align-items:center;gap:4px}
    ul{list-style:none;margin:6px 0;padding:0;max-height:30vh;overflow:auto}
    li{display:flex;gap:6px;align-items:center;padding:4px 0;border-bottom:1px solid var(--linha);font-size:12px}
    li .corpo{flex:1;min-width:0}
    li .titulo{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    li.atual .titulo{font-weight:600}
    li .meta{font-size:11px;opacity:.75}
    table{width:100%;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums}
    th,td{text-align:right;padding:1px 4px} th:first-child,td:first-child{text-align:left}
    .barra{display:inline-block;width:70px;height:7px;border:1px solid #888;border-radius:4px;vertical-align:middle;overflow:hidden}
    .barra>span{display:block;height:100%;background:currentColor}
    details{margin:6px 0} summary{cursor:pointer;font-size:12px}
    .resumo{font-size:12px;display:flex;flex-wrap:wrap;align-items:center;gap:3px}
    .alerta{color:#b45309} .ok{color:#15803d} .ruim{color:var(--vermelho)}
    @media (prefers-color-scheme:dark){.alerta{color:#fbbf24}.ok{color:#4ade80}.ruim{color:#f87171}}
    .status{font-size:12px;opacity:.8}`;

  // Ícones Heroicons (MIT, Tailwind Labs), versão 2.1.5, 20/solid: só os caminhos do SVG;
  // "e:" marca fill-rule evenodd. Montados com createElementNS (sem innerHTML).
  const ICONES = {
    'adjustments-horizontal': ["M10 3.75a2 2 0 1 0-4 0 2 2 0 0 0 4 0ZM17.25 4.5a.75.75 0 0 0 0-1.5h-5.5a.75.75 0 0 0 0 1.5h5.5ZM5 3.75a.75.75 0 0 1-.75.75h-1.5a.75.75 0 0 1 0-1.5h1.5a.75.75 0 0 1 .75.75ZM4.25 17a.75.75 0 0 0 0-1.5h-1.5a.75.75 0 0 0 0 1.5h1.5ZM17.25 17a.75.75 0 0 0 0-1.5h-5.5a.75.75 0 0 0 0 1.5h5.5ZM9 10a.75.75 0 0 1-.75.75h-5.5a.75.75 0 0 1 0-1.5h5.5A.75.75 0 0 1 9 10ZM17.25 10.75a.75.75 0 0 0 0-1.5h-1.5a.75.75 0 0 0 0 1.5h1.5ZM14 10a2 2 0 1 0-4 0 2 2 0 0 0 4 0ZM10 16.25a2 2 0 1 0-4 0 2 2 0 0 0 4 0Z"],
    'arrow-down-tray': ["M10.75 2.75a.75.75 0 0 0-1.5 0v8.614L6.295 8.235a.75.75 0 1 0-1.09 1.03l4.25 4.5a.75.75 0 0 0 1.09 0l4.25-4.5a.75.75 0 0 0-1.09-1.03l-2.955 3.129V2.75Z", "M3.5 12.75a.75.75 0 0 0-1.5 0v2.5A2.75 2.75 0 0 0 4.75 18h10.5A2.75 2.75 0 0 0 18 15.25v-2.5a.75.75 0 0 0-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5Z"],
    'arrow-path': ["e:M15.312 11.424a5.5 5.5 0 0 1-9.201 2.466l-.312-.311h2.433a.75.75 0 0 0 0-1.5H3.989a.75.75 0 0 0-.75.75v4.242a.75.75 0 0 0 1.5 0v-2.43l.31.31a7 7 0 0 0 11.712-3.138.75.75 0 0 0-1.449-.39Zm1.23-3.723a.75.75 0 0 0 .219-.53V2.929a.75.75 0 0 0-1.5 0V5.36l-.31-.31A7 7 0 0 0 3.239 8.188a.75.75 0 1 0 1.448.389A5.5 5.5 0 0 1 13.89 6.11l.311.31h-2.432a.75.75 0 0 0 0 1.5h4.243a.75.75 0 0 0 .53-.219Z"],
    'chart-bar': ["M15.5 2A1.5 1.5 0 0 0 14 3.5v13a1.5 1.5 0 0 0 1.5 1.5h1a1.5 1.5 0 0 0 1.5-1.5v-13A1.5 1.5 0 0 0 16.5 2h-1ZM9.5 6A1.5 1.5 0 0 0 8 7.5v9A1.5 1.5 0 0 0 9.5 18h1a1.5 1.5 0 0 0 1.5-1.5v-9A1.5 1.5 0 0 0 10.5 6h-1ZM3.5 10A1.5 1.5 0 0 0 2 11.5v5A1.5 1.5 0 0 0 3.5 18h1A1.5 1.5 0 0 0 6 16.5v-5A1.5 1.5 0 0 0 4.5 10h-1Z"],
    'check': ["e:M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"],
    'exclamation-triangle': ["e:M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495ZM10 5a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 5Zm0 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"],
    'forward': ["M3.288 4.818A1.5 1.5 0 0 0 1 6.095v7.81a1.5 1.5 0 0 0 2.288 1.276l6.323-3.905c.155-.096.285-.213.389-.344v2.973a1.5 1.5 0 0 0 2.288 1.276l6.323-3.905a1.5 1.5 0 0 0 0-2.552l-6.323-3.906A1.5 1.5 0 0 0 10 6.095v2.972a1.506 1.506 0 0 0-.389-.343L3.288 4.818Z"],
    'funnel': ["e:M2.628 1.601C5.028 1.206 7.49 1 10 1s4.973.206 7.372.601a.75.75 0 0 1 .628.74v2.288a2.25 2.25 0 0 1-.659 1.59l-4.682 4.683a2.25 2.25 0 0 0-.659 1.59v3.037c0 .684-.31 1.33-.844 1.757l-1.937 1.55A.75.75 0 0 1 8 18.25v-5.757a2.25 2.25 0 0 0-.659-1.591L2.659 6.22A2.25 2.25 0 0 1 2 4.629V2.34a.75.75 0 0 1 .628-.74Z"],
    'magnifying-glass': ["e:M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z"],
    'map-pin': ["e:m9.69 18.933.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 0 0 .281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 1 0 3 9c0 3.492 1.698 5.988 3.355 7.584a13.731 13.731 0 0 0 2.273 1.765 11.842 11.842 0 0 0 .976.544l.062.029.018.008.006.003ZM10 11.25a2.25 2.25 0 1 0 0-4.5 2.25 2.25 0 0 0 0 4.5Z"],
    'minus': ["e:M4 10a.75.75 0 0 1 .75-.75h10.5a.75.75 0 0 1 0 1.5H4.75A.75.75 0 0 1 4 10Z"],
    'plus': ["M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z"],
    'tag': ["e:M4.5 2A2.5 2.5 0 0 0 2 4.5v3.879a2.5 2.5 0 0 0 .732 1.767l7.5 7.5a2.5 2.5 0 0 0 3.536 0l3.878-3.878a2.5 2.5 0 0 0 0-3.536l-7.5-7.5A2.5 2.5 0 0 0 8.38 2H4.5ZM5 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"],
    'trash': ["e:M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z"],
    'stop': ["M5.25 3A2.25 2.25 0 0 0 3 5.25v9.5A2.25 2.25 0 0 0 5.25 17h9.5A2.25 2.25 0 0 0 17 14.75v-9.5A2.25 2.25 0 0 0 14.75 3h-9.5Z"],
    'play': ["M6.3 2.84A1.5 1.5 0 0 0 4 4.11v11.78a1.5 1.5 0 0 0 2.3 1.27l9.344-5.891a1.5 1.5 0 0 0 0-2.538L6.3 2.841Z"],
    'queue-list': ["M2 4.5A2.5 2.5 0 0 1 4.5 2h11a2.5 2.5 0 0 1 0 5h-11A2.5 2.5 0 0 1 2 4.5ZM2.75 9.083a.75.75 0 0 0 0 1.5h14.5a.75.75 0 0 0 0-1.5H2.75ZM2.75 12.663a.75.75 0 0 0 0 1.5h14.5a.75.75 0 0 0 0-1.5H2.75ZM2.75 16.25a.75.75 0 0 0 0 1.5h14.5a.75.75 0 1 0 0-1.5H2.75Z"],
  };
  function icone(nome) {
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', '0 0 20 20');
    svg.setAttribute('fill', 'currentColor');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('class', 'ico');
    for (const d of ICONES[nome] || []) {
      const p = document.createElementNS(ns, 'path');
      if (d.startsWith('e:')) { p.setAttribute('fill-rule', 'evenodd'); p.setAttribute('clip-rule', 'evenodd'); }
      p.setAttribute('d', d.replace(/^e:/, ''));
      svg.appendChild(p);
    }
    return svg;
  }
  // Filhos mistos: texto e nós (ícones), sem vazios
  const partes = (...xs) => xs.filter((x) => x !== '' && x != null && x !== false).map((x) => (typeof x === 'string' ? document.createTextNode(x) : x));

  const status = (t) => { if (el.status) { el.status.textContent = t; el.status.title = ''; } };
  const pctTxt = (x) => (x == null ? '–' : `${Math.round(x * 100)}%`);
  const reais = (v) => (v == null ? '–' : `R$ ${v.toFixed(2).replace('.', ',')}`);
  const doisDig = (n) => String(n).padStart(2, '0');
  const quando = (ms) => { const d = new Date(ms); return `${doisDig(d.getDate())}/${doisDig(d.getMonth() + 1)} ${doisDig(d.getHours())}h${doisDig(d.getMinutes())}`; };
  const diaMes = (iso) => (iso ? iso.split('-').reverse().join('/') : '–');
  // Verde a partir de "bom", âmbar a partir de "medio", vermelho abaixo.
  const nivel = (x, bom = 0.9, medio = 0.6) => (x == null ? '' : x >= bom ? 'ok' : x >= medio ? 'alerta' : 'ruim');
  const NOMES_SUBTIPO = { loja_ponto: 'loja/ponto', sala: 'sala', galpao: 'galpão', predio: 'prédio', outro: 'outro', residencial: 'residencial' };

  // Botão com ícone e nome curto; o nome completo e a explicação vão no title (tooltip)
  const botao = (ico, rotulo, titulo, onclick, className = '') =>
    criar('button', { title: titulo, onclick, className }, partes(icone(ico), rotulo && criar('span', { textContent: rotulo })));
  // Selo que liga e desliga (filtros)
  function selo(rotulo, titulo, ligado, aoMudar) {
    const b = criar('button', { className: 'tag', textContent: rotulo, title: titulo });
    const pintar = (v) => { b.classList.toggle('on', v); b.setAttribute('aria-pressed', String(v)); };
    pintar(ligado);
    b.onclick = () => { const v = !b.classList.contains('on'); pintar(v); aoMudar(v); };
    return b;
  }
  // Casa da grade: rótulo (k) ou valor (v), com ícone opcional
  const casa = (classe, ...xs) => criar('span', { className: classe }, partes(...xs));
  const aviso = (t) => criar('span', { className: 'alerta', title: t }, [icone('exclamation-triangle')]);
  const barra = (x) => { const s = criar('span'); s.style.width = `${Math.round(x * 100)}%`; return criar('span', { className: 'barra' }, [s]); };

  // Barra de progresso (busca e fila): `frac` nulo esconde a barra.
  function novaBarra() {
    const cheio = criar('span');
    const texto = criar('span');
    return { caixa: criar('div', { className: 'progresso', hidden: true }, [criar('div', { className: 'trilho' }, [cheio]), texto]), cheio, texto };
  }
  function progresso(b, frac, texto = '') {
    if (!b) return;
    if (frac == null) { b.caixa.hidden = true; return; }
    b.caixa.hidden = false;
    b.cheio.style.width = `${Math.round(Math.min(1, Math.max(0, frac)) * 100)}%`;
    b.texto.textContent = texto;
  }

  // Tabela da fila: uma linha por busca, com lidos, total e cobertura (as que faltam com "–").
  function mostrarFila() {
    if (!el.filaTabela) return;
    const fila = lerFila();
    progressoFila(fila);
    if (!fila?.itens?.length) { el.filaTabela.replaceChildren(criar('p', { className: 'status', textContent: 'Nenhuma fila rodada ainda.' })); return; }
    const porUrl = new Map((fila.resultados || []).map((r) => [r.url, r]));
    const td = (v, classe = '', dica = '') => criar('td', { textContent: String(v), className: classe, title: dica });
    const linhas = fila.itens.map((url, i) => {
      const r = porUrl.get(url);
      const atual = fila.ativa && i === fila.i;
      const cor = r?.cobertura == null ? '' : r.cobertura >= COBERTURA_MIN ? 'ok' : 'ruim';
      return criar('tr', { className: atual ? 'atual' : '', title: url }, [
        td(`${atual ? '▸ ' : ''}${rotuloBusca(url)}`),
        td(r ? r.lidos : '–'),
        td(r?.total ?? '–'),
        td(r ? (r.cobertura == null ? 's/ total' : pctTxt(r.cobertura)) : '–', cor, r ? `${r.paginas} pág.; parou por ${r.motivo}${r.tentativa ? '; repetida' : ''}` : ''),
      ]);
    });
    const th = (t, dica) => criar('th', { textContent: t, title: dica });
    el.filaTabela.replaceChildren(criar('table', {}, [
      criar('thead', {}, [criar('tr', {}, [th('Busca', 'Portal e bairro da busca'), th('Lidos', 'Anúncios distintos lidos na busca'), th('Total', 'Total que o portal diz ter'), th('Cob.', `Cobertura: lidos ÷ total; abaixo de ${pctTxt(COBERTURA_MIN)}, a fila repete a busca uma vez`)])]),
      criar('tbody', {}, linhas),
    ]));
  }

  // A8 do coletor de preços: anúncios guardados desde o último CSV de tudo.
  function mostrarPendentes(dados) {
    const exportado = exportadoEm();
    const pend = pendentes(dados, exportado);
    el.pendentes.className = pend >= AVISO_PENDENTES ? 'info alerta' : pend ? 'info' : 'info ok';
    el.pendentes.replaceChildren(...partes(pend >= AVISO_PENDENTES ? icone('exclamation-triangle') : !pend && exportado ? icone('check') : '',
      pend ? `${pend} fora do CSV` : exportado ? 'CSV em dia' : 'Nada guardado ainda.'));
    el.pendentes.title = pend
      ? `${pend} anúncio(s) lidos, em todos os portais, desde o último CSV de tudo${exportado ? ` (${quando(exportado)})` : ' (nenhum baixado ainda)'}`
        + `${pend >= AVISO_PENDENTES ? '. Baixe o CSV: os dados só estão no navegador' : ''}`
      : exportado ? `CSV de tudo baixado em ${quando(exportado)}` : '';
  }

  // Portal, cobertura da busca atual e R$/m² pedido dos anúncios de aluguel da busca.
  function mostrarGeral(todos, lista) {
    const totais = lista.map((a) => Number(a.total_busca)).filter((n) => n > 0);
    const total = totais.length ? Math.max(...totais) : totalResultados();
    const cob = total ? Math.min(1, lista.length / total) : null;
    const datas = lista.map((a) => a.data_coleta).filter(Boolean).sort();
    const idade = datas[0] ? diasEntre(datas[0], dataLocal()) : null;
    const semOrdem = (portal === 'zap' || portal === 'vivareal') && lerPagina(portal).length > 0 && !new URL(location.href).searchParams.get('ordem');
    el.geral.replaceChildren(
      ...(semOrdem ? [casa('todo ruim', icone('exclamation-triangle'), 'Sem "ordem=LOWEST_PRICE" na URL: o portal repete anúncios entre páginas e deixa alguns de fora.')] : []),
      casa('k', icone('chart-bar'), 'Portal'), casa('v largo', `${todos.length} anúncios (${todos.filter((a) => a.operacao === 'aluguel').length} de aluguel)`),
      casa('k', icone('magnifying-glass'), 'Busca'),
      cob == null
        ? casa('v largo', `${lista.length}`, aviso('Total da busca não lido na página: sem cobertura'))
        : criar('span', { className: `v largo ${lerAuto() ? '' : nivel(cob, 0.8, 0.5)}`, title: `${lista.length} de ${total} anúncios que o portal diz ter na busca (${pctTxt(cob)})` },
          partes(`${lista.length}/${total}`, barra(cob))),
      ...(lista.length ? [casa('k', 'Desde'), casa(`v largo${idade > IDADE_MAX ? ' alerta' : ''}`, diaMes(datas[0]), idade > IDADE_MAX && aviso(`Coleta mais antiga desta busca com ${idade} dias: refazer?`))] : []),
    );
    const r = resumoM2(lista.filter((a) => passaFiltros(a, lerFiltros())));
    el.resumo.title = 'R$/m² pedido (aluguel ÷ área) dos anúncios de aluguel com área desta busca, nos filtros ligados';
    el.resumo.replaceChildren(...(!r.n ? [casa('todo', icone('tag'), 'Nenhum anúncio de aluguel com área nesta busca.')] : [
      casa('k', icone('tag'), 'Com área'), casa(`v${r.n < MIN_AMOSTRA ? ' alerta' : ''}`, String(r.n)),
      casa('k', 'R$/m²'), criar('b', { className: 'v', textContent: reais(r.mediana) }),
      ...(r.n > 1 ? [casa('k', 'P25'), casa('v', reais(r.p25)), casa('k', 'P75'), casa('v', reais(r.p75))] : []),
      ...(r.n < MIN_AMOSTRA ? [casa('todo alerta', icone('exclamation-triangle'), `faltam ${MIN_AMOSTRA - r.n} para a amostra mínima`)] : []),
    ]));
  }

  // Funil da última página lida, com alerta se há cards sem id (seletor do portal mudou?).
  function mostrarFunil() {
    if (!ultimoFunil) { el.funil.className = 'resumo'; el.funil.replaceChildren(...partes(icone('funnel'), ' Página ainda não lida nesta aba.')); return; }
    const f = ultimoFunil;
    const semId = f.comId < f.cards;
    el.funil.className = `resumo ${semId ? 'ruim' : f.comArea < f.comId * 0.8 ? 'alerta' : 'ok'}`;
    el.funil.replaceChildren(...partes(icone('funnel'), ` ${f.cards} cards → ${f.comId} com id → ${f.comPreco} com preço → ${f.comArea} com área`,
      semId && ' ', semId && icone('exclamation-triangle'), semId && ' cards sem id'));
    el.funil.title = `Funil da última página lida${semId ? '. Há cards sem id: o seletor do portal pode ter mudado' : ''}`;
  }

  // Preenchimento dos campos, mistura da busca, prévia do descarte e anúncios no alvo.
  function mostrarQualidade(lista, filtrados, filtros, todos) {
    const q = qualidade(filtrados);
    const campos = CAMPOS_QUALIDADE.flatMap(([c, nome]) => {
      const cor = c === 'condominio_iptu' ? nivel(q.pct[c], 0.6, 0.3) : nivel(q.pct[c]);
      return [casa('k', nome), casa(`v ${cor}`, pctTxt(q.pct[c]))];
    });
    const filtro = Object.values(filtros).some(Boolean);
    el.campos.title = `Preenchimento de cada campo nos ${filtrados.length} anúncios ${filtro ? 'da busca nos filtros ligados' : 'da busca'}`;
    el.campos.replaceChildren(...(filtro ? [casa('k', icone('adjustments-horizontal'), 'Filtro'), casa('v largo', `${filtrados.length} de ${lista.length}`)] : []), ...campos);

    const m = mistura(lista);
    const d = previaDescarte(filtrados);
    const alvo = noAlvo(todos);
    const linhas = [];
    if (m.n) {
      linhas.push(casa('k', 'Aluguel'), casa('v', pctTxt(m.pctAluguel)), casa('k', 'Venda'), casa(`v${m.pctVenda > 0.1 ? ' ruim' : ''}`, pctTxt(m.pctVenda)));
      linhas.push(casa('k', 'Fora de SSA'), casa(`v largo${m.pctFora > 0.1 ? ' ruim' : ''}`, pctTxt(m.pctFora)));
      const tipos = Object.entries(m.tipos).sort((x, y) => y[1] - x[1]);
      linhas.push(criar('span', { className: 'k', textContent: 'Tipo', title: 'Tipo estimado pela busca e pelo texto, com as regras do build' }),
        casa('v largo', tipos.map(([t, n]) => `${NOMES_SUBTIPO[t] || t} ${n}`).join(' · ')));
      linhas.push(...m.alertas.map((a) => casa('todo ruim', icone('exclamation-triangle'), a)));
    }
    if (d.aluguel) {
      const nomes = { semArea: 'sem área', preco: 'preço fora de R$ 300 a 100 mil', foraSalvador: 'fora de Salvador', m2: 'R$/m² fora de 3 a 500' };
      const motivos = Object.entries(d.motivos).filter(([, n]) => n).map(([k, n]) => `${n} ${nomes[k]}`).join('; ');
      const frac = d.total / d.aluguel;
      linhas.push(criar('span', { className: 'k', textContent: 'Descarte', title: 'Prévia do que o build vai descartar entre os anúncios de aluguel' }),
        criar('span', { className: `v largo ${frac > 0.2 ? 'ruim' : frac > 0.05 ? 'alerta' : 'ok'}`, title: motivos || 'nenhum motivo de descarte' },
          partes(`${d.total} de ${d.aluguel}`, motivos && ` (${motivos})`)));
    }
    el.mistura.replaceChildren(...linhas);

    el.alvo.title = `Anúncios de aluguel deste portal no porte do plano (${PORTE_MIN} a ${PORTE_MAX} m²) e, entre as lojas e pontos no porte, por área do 6.4; ✓ a partir de ${MIN_AMOSTRA}`;
    el.alvo.replaceChildren(
      casa('k', icone('map-pin'), 'No porte'), casa('v largo', `${alvo.porte} de aluguel`),
      ...Object.entries(alvo.porArea).flatMap(([a, n]) => [casa('k', a), casa(`v${n >= MIN_AMOSTRA ? ' ok' : ' alerta'}`, String(n), n >= MIN_AMOSTRA && icone('check'))]),
    );
  }

  function mostrarHist(hist) {
    el.histTitulo.textContent = `Rodada automática (${hist.length} pág.)`;
    if (!hist.length) { el.hist.replaceChildren(criar('p', { className: 'status', textContent: 'Sem rodada automática nesta aba.' })); return; }
    const td = (v) => criar('td', { textContent: String(v) });
    const linhas = hist.map((r) => criar('tr', {
      className: r.lidos === 0 || r.ineditos === 0 ? 'ruim' : r.ineditos < r.lidos / 2 ? 'alerta' : '',
      title: r.lidos === 0 || r.ineditos === 0 ? 'Nada inédito: a rodada para aqui' : r.ineditos < r.lidos / 2 ? 'Menos da metade inédita: a busca pode estar se repetindo' : '',
    }, [td(r.pagina), td(r.lidos), td(r.ineditos), td(r.novos), td(r.seg)]));
    const th = (t, dica) => criar('th', { textContent: t, title: dica });
    el.hist.replaceChildren(criar('table', {}, [
      criar('thead', {}, [criar('tr', {}, [th('Pág.', 'Página'), th('Lidos', 'Anúncios lidos na página'), th('Inéd.', 'Inéditos nesta rodada'), th('Novos', 'Novos no navegador'), th('s', 'Segundos na página')])]),
      criar('tbody', {}, linhas),
    ]));
  }

  // Apagar baixa antes o CSV do que vai sair (como o "Limpar" do coletor de preços).
  function apagarComBackup(busca, n) {
    if (!confirm(busca ? `Apagar os ${n} anúncios guardados desta busca? O CSV dela será baixado antes.` : 'Apagar todos os anúncios guardados deste portal? O CSV de tudo será baixado antes.')) return;
    const dados = carregar();
    if (busca) baixarCsv(daBusca(dados, busca), true); else baixarCsv(dados);
    apagarBusca(busca);
    mostrar(busca ? 'Busca apagada (CSV baixado antes).' : 'Guardados apagados (CSV baixado antes).');
  }

  function mostrarBuscas(buscas, atual) {
    el.buscasTitulo.textContent = `Buscas guardadas (${buscas.length})`;
    const rotulo = (b) => { try { const u = new URL(b); return decodeURIComponent(u.pathname + u.search); } catch (e) { return b; } };
    el.buscas.replaceChildren(...(!buscas.length ? [criar('li', { textContent: 'Nada guardado neste portal.' })] : buscas.map((b) => {
      const velha = diasEntre(b.data, dataLocal()) > IDADE_MAX;
      return criar('li', { className: b.busca === atual ? 'atual' : '' }, [
        criar('div', { className: 'corpo' }, [
          criar('span', { className: 'titulo', textContent: rotulo(b.busca), title: b.busca }),
          criar('span', { className: `meta${velha ? ' alerta' : ''}`, textContent: `${b.n} anúncios · ${diaMes(b.data)}${b.busca === atual ? ' · esta busca' : ''}`, title: velha ? `Coletada há mais de ${IDADE_MAX} dias` : '' }),
        ]),
        botao('arrow-down-tray', '', 'Baixar: CSV só desta busca', () => baixarCsv(daBusca(carregar(), b.busca), true), 'ic'),
        botao('trash', '', 'Apagar: tira esta busca do navegador (baixa antes o CSV dela)', () => apagarComBackup(b.busca, b.n), 'ic'),
      ]);
    })));
  }

  // Com filtro ativo, contorna os cards que passam e esmaece os demais.
  function destacarCards(filtros, dados) {
    const ativo = Object.values(filtros).some(Boolean);
    for (const [k, card] of cardsDaPagina) {
      if (!card.isConnected) continue;
      const passa = !!dados[k] && passaFiltros(dados[k], filtros);
      card.style.outline = ativo && passa ? '3px solid #15803d' : '';
      card.style.outlineOffset = ativo && passa ? '-3px' : '';
      card.style.opacity = ativo && !passa ? '0.35' : '';
    }
  }

  function atualizarPainel() {
    if (!el.geral) return;
    const dados = carregar();
    const todos = Object.values(dados).filter(doPortal);
    const busca = buscaBase(portal, location.href);
    const lista = todos.filter((a) => buscaBase(portal, a.busca_url) === busca);
    const filtros = lerFiltros();
    mostrarPendentes(dados);
    mostrarGeral(todos, lista);
    mostrarFunil();
    mostrarQualidade(lista, lista.filter((a) => passaFiltros(a, filtros)), filtros, todos);
    mostrarHist(lerHist());
    mostrarBuscas(agruparBuscas(portal, dados), busca);
    mostrarFila();
    destacarCards(filtros, dados);
  }

  function mostrar(t) {
    atualizarPainel();
    if (t) status(t);
  }

  function atualizarBotoes() {
    if (!el.bAuto) return;
    const fila = lerFila();
    const naFila = !!fila?.ativa;
    const ativo = !!lerAuto() && !naFila;
    el.bAuto.replaceChildren(...partes(icone(ativo ? 'stop' : 'forward'), criar('span', { textContent: ativo ? 'Parar' : 'Todas' })));
    el.bAuto.title = ativo ? 'Parar a rodada automática' : 'Coletar todas as páginas desta busca: lê esta página e segue para as próximas até uma página vazia, sem anúncio inédito, o total da busca ou o limite; no fim, toca um som e baixa o CSV';
    el.bAuto.classList.toggle('ativo', ativo);
    el.bAuto.disabled = naFila;
    el.bPagina.disabled = ativo || naFila;
    el.bFila.replaceChildren(...partes(icone(naFila ? 'stop' : 'queue-list'), criar('span', { textContent: naFila ? 'Parar fila' : 'Fila' })));
    el.bFila.title = naFila ? 'Parar a fila: a busca atual para; "Continuar" retoma dela'
      : 'Coletar a fila: abre cada busca da lista, lê todas as páginas, confere a cobertura (repete uma vez abaixo de 95%) e passa à próxima, em qualquer portal; no fim, toca um som e baixa um CSV com tudo';
    el.bFila.classList.toggle('ativo', naFila);
    const podeContinuar = !naFila && !!fila && !fila.fim && fila.i < fila.itens.length;
    el.bContinuar.disabled = !podeContinuar;
    el.bContinuar.title = podeContinuar ? `Continuar a fila da busca ${fila.i + 1} de ${fila.itens.length} (${rotuloBusca(fila.itens[fila.i])})` : 'Continuar a fila: nada pausado';
    el.filaTexto.disabled = naFila;
    if (el.bGerar) el.bGerar.disabled = naFila;
  }

  function montarPainel() {
    el.status = criar('p', { className: 'status', textContent: 'Clique em "Fila" para coletar as buscas da lista, ou abra uma busca já filtrada e clique em "Todas".' });
    el.pBusca = novaBarra();
    el.pFila = novaBarra();
    el.filaTexto = criar('textarea', { value: gmLer(CHAVE_FILA_TEXTO, FILA_PADRAO) || FILA_PADRAO, spellcheck: false,
      title: 'Buscas da fila: uma URL por linha (OLX, ZAP, Viva Real ou QuintoAndar), já filtrada; linhas com # são ignoradas',
      onchange: () => { gmGravar(CHAVE_FILA_TEXTO, el.filaTexto.value); el.filaContagem.textContent = `${lerItensFila(el.filaTexto.value).length} buscas`; } });
    el.filaContagem = criar('span', { className: 'rotulo', textContent: `${lerItensFila(el.filaTexto.value).length} buscas` });
    el.filaTabela = criar('div');
    el.bFila = botao('queue-list', 'Fila', '', () => {
      if (lerFila()?.ativa) { pararFila(); gravarAuto(null); atualizarBotoes(); status('Fila parada. "Continuar" retoma da busca atual.'); return; }
      iniciarFila();
    }, 'principal');
    el.bContinuar = botao('play', 'Continuar', '', continuarFila);
    const bPadrao = botao('arrow-path', '', 'Padrão: volta a lista às 9 buscas do plano (Loja e Outros com 100 m² ou mais na Pituba, Graça e Itaigara, no OLX, ZAP e Viva Real)', () => {
      el.filaTexto.value = FILA_PADRAO;
      el.filaTexto.onchange();
      status('Lista da fila de volta ao padrão.');
    }, 'ic');
    // Montar buscas: bairros, área e tipos escolhidos viram a lista da fila ("Gerar fila").
    const montagem = { ...MONTAGEM_PADRAO, ...(gmLer(CHAVE_MONTAGEM, {}) || {}) };
    const alternar = (lista, v, ligado) => (ligado ? [...new Set([...(lista || []), v])] : (lista || []).filter((x) => x !== v));
    el.montagemPrevia = criar('span', { className: 'rotulo' });
    const prever = () => {
      gmGravar(CHAVE_MONTAGEM, montagem);
      const r = montarBuscas(montagem);
      el.montagemPrevia.replaceChildren(...partes(r.semBusca.length ? icone('exclamation-triangle') : '', `${r.urls.length} buscas em ${r.bairros.length} bairro(s)`));
      el.montagemPrevia.className = r.semBusca.length ? 'rotulo alerta' : 'rotulo';
      el.montagemPrevia.title = r.semBusca.length ? `Sem busca no portal (ficam de fora): ${r.semBusca.join('; ')}` : 'Buscas que "Gerar fila" põe na lista';
    };
    const seloLista = (campo, valor, rotulo, dica) => selo(rotulo, dica, (montagem[campo] || []).includes(valor), (v) => { montagem[campo] = alternar(montagem[campo], valor, v); prever(); });
    const selosBairro = BAIRROS_SELO.map((b) => seloLista('bairros', b, b, `Buscar anúncios em ${b}`));
    const outros = criar('input', { type: 'text', value: montagem.outros || '', placeholder: 'outros bairros (vírgula)', className: 'largo',
      title: 'Outros bairros de Salvador, separados por vírgula, como o portal escreve na URL (ex.: Caminho das Árvores, Stiep)',
      oninput: () => { montagem.outros = outros.value; prever(); } });
    const campoArea = (campo, dica) => criar('input', { type: 'number', min: 0, step: 10, value: montagem[campo] ?? '', placeholder: '–', title: dica,
      oninput: (e) => { montagem[campo] = numeroOuNulo(e.target.value); prever(); } });
    const areaMin = campoArea('areaMin', 'Área mínima em m² (vazio: sem mínimo)');
    const areaMax = campoArea('areaMax', 'Área máxima em m² (vazio: sem máximo; menor que a mínima é ignorada)');
    const selosTipo = Object.entries(TIPOS_BUSCA).map(([k, t]) => seloLista('tipos', k, t.rotulo, t.dica));
    const selosPortal = PORTAIS_BUSCA.map((p) => seloLista('portais', p, NOMES_PORTAL[p], `Montar buscas no ${NOMES_PORTAL[p]}`));
    el.bGerar = botao('magnifying-glass', 'Gerar fila', 'Gerar fila: troca a lista da fila pelas buscas montadas aqui (cada portal × bairro × tipo, com a área escolhida); depois, "Fila" coleta', () => {
      const r = montarBuscas(montagem);
      if (!r.urls.length) { status('Nada a buscar: escolha ao menos um bairro, um tipo e um portal que tenha esse tipo.'); return; }
      el.filaTexto.value = r.urls.join('\n');
      el.filaTexto.onchange();
      mostrarFila();
      status(`Fila montada com ${r.urls.length} buscas${r.semBusca.length ? `; sem busca no portal: ${r.semBusca.join(', ')}` : ''}. Clique em "Fila" para coletar.`);
    }, 'principal');
    prever();
    const rotuloIco = (ico, dica) => criar('span', { className: 'rotulo', title: dica }, [icone(ico)]);
    el.montagem = criar('details', {}, [criar('summary', { textContent: 'Montar buscas' }), criar('div', { className: 'caixa' }, [
      criar('div', { className: 'linha' }, [rotuloIco('map-pin', 'Bairros'), ...selosBairro, outros]),
      criar('div', { className: 'linha' }, [rotuloIco('adjustments-horizontal', 'Área em m²'), criar('span', { className: 'rotulo', textContent: 'área de' }), areaMin,
        criar('span', { className: 'rotulo', textContent: 'a' }), areaMax, criar('span', { className: 'rotulo', textContent: 'm²' })]),
      criar('div', { className: 'linha' }, [rotuloIco('tag', 'Tipo de imóvel comercial'), ...selosTipo]),
      criar('div', { className: 'linha' }, [rotuloIco('funnel', 'Portais'), ...selosPortal]),
      criar('div', { className: 'linha' }, [el.bGerar, el.montagemPrevia]),
    ])]);

    el.pendentes = criar('span');
    el.limite =criar('input', { type: 'number', min: 1, value: 50, title: 'Limite de páginas da rodada automática' });
    el.bPagina = botao('arrow-path', 'Esta página', 'Coletar esta página: lê e guarda só os anúncios desta página', async () => {
      el.bPagina.disabled = true;
      status('Lendo a página…');
      const { lidos, novos, gravou } = await coletarPagina();
      el.bPagina.disabled = false;
      if (!gravou) { avisarCheio(); return; }
      mostrar(`${lidos} lidos, ${novos} novos.`);
    });
    el.bAuto = botao('forward', 'Todas', '', () => {
      if (lerAuto()) { gravarAuto(null); atualizarBotoes(); status('Parado.'); return; }
      gravarAuto({ limite: Math.max(1, parseInt(el.limite.value, 10) || 50), paginas: 0, total: 0 });
      gravarHist([]);
      passoAutomatico();
    });
    const bCsv = botao('arrow-down-tray', 'CSV', 'Baixar CSV de tudo: um arquivo com todos os anúncios guardados, de todos os portais', () => { baixarCsv(); mostrar('CSV de tudo baixado.'); }, 'ic');
    const bLimpar = botao('trash', '', 'Apagar tudo deste portal (baixa antes o CSV dele)', () => apagarComBackup(null), 'ic');

    el.geral = criar('div', { className: 'grade' });
    el.resumo = criar('div', { className: 'grade' });
    el.funil = criar('p');
    el.campos = criar('div', { className: 'grade' });
    el.mistura = criar('div', { className: 'grade' });
    el.alvo = criar('div', { className: 'grade' });
    el.hist = criar('div');
    el.histTitulo = criar('summary');
    el.buscas = criar('ul');
    el.buscasTitulo = criar('summary');

    // Filtros: só mudam os indicadores da busca e o destaque dos cards; o CSV sai completo.
    const FILTRO = {
      soAluguel: ['aluguel', 'Só aluguel: deixa de fora os anúncios de venda'],
      soComercial: ['comercial', 'Só comercial: pela busca ou, sem ela, pelo texto do anúncio (regras do build)'],
      soLoja: ['loja/ponto', 'Só loja ou ponto comercial (sem sala, galpão e prédio)'],
      soAreas: ['áreas do 6.4', 'Só as áreas do 6.4: Pituba/Itaigara, Barra/Graça e Rio Vermelho'],
    };
    const selos = Object.entries(FILTRO).map(([k, [nome, dica]]) => selo(nome, `${dica}. Muda só os indicadores e o destaque dos cards; o CSV sai completo`, !!lerFiltros()[k],
      (v) => { gravarFiltros({ ...lerFiltros(), [k]: v }); atualizarPainel(); }));

    const minimizar = criar('span', { className: 'rotulo' }, [icone('minus')]);
    const cabecalho = criar('header', { title: 'Arraste para mover; clique para minimizar; duplo clique volta ao canto' }, [criar('span', { textContent: `Aluguel · ${NOMES_PORTAL[portal] || portal}` }), minimizar]);
    const painel = criar('div', { id: 'cal-painel' }, [
      cabecalho,
      criar('div', { className: 'linha' }, [el.bFila, el.bContinuar, bPadrao, el.filaContagem]),
      el.pFila.caixa,
      el.pBusca.caixa,
      el.status,
      el.montagem,
      criar('details', {}, [criar('summary', { textContent: 'Buscas da fila' }), el.filaTexto, el.filaTabela]),
      criar('div', { className: 'linha' }, [el.bAuto, el.bPagina, criar('span', { className: 'rotulo', title: el.limite.title, textContent: 'máx.' }), el.limite]),
      criar('div', { className: 'linha' }, [criar('span', { className: 'rotulo', title: 'Filtros dos indicadores' }, [icone('adjustments-horizontal')]), ...selos]),
      criar('div', { className: 'linha' }, [bCsv, bLimpar, el.pendentes]),
      criar('div', { className: 'caixa' }, [el.geral, el.resumo]),
      el.funil,
      criar('details', { open: true }, [criar('summary', { textContent: 'Qualidade da busca' }), criar('div', { className: 'caixa' }, [el.campos, el.mistura, el.alvo])]),
      criar('details', {}, [el.histTitulo, el.hist]),
      criar('details', {}, [el.buscasTitulo, el.buscas]),
    ]);
    cabecalho.onclick = () => { if (arrastou) return; painel.classList.toggle('min'); minimizar.replaceChildren(icone(painel.classList.contains('min') ? 'plus' : 'minus')); };
    el.painel = painel;
    prepararArraste(cabecalho, painel);
    painel.addEventListener('click', liberarAudio);
    // As teclas digitadas no painel não chegam aos atalhos do portal.
    for (const tipo of ['keydown', 'keyup', 'keypress']) painel.addEventListener(tipo, (e) => e.stopPropagation());
    // O tamanho só muda pela alça do canto, que grava largura e altura no estilo.
    addEventListener('pointerup', () => {
      if (painel.classList.contains('min')) return;
      const { width, height } = painel.style;
      if (width && (width !== posicao?.width || height !== posicao?.height)) { posicao = { ...posicao, width, height }; gmGravar(CHAVE_POSICAO, posicao); }
    });
    addEventListener('resize', posicionarPainel);

    hospedeiro = criar('div', { id: 'cal-hospedeiro' });
    const raiz = hospedeiro.attachShadow({ mode: 'open' });
    raiz.appendChild(criar('style', { textContent: CSS_PAINEL }));
    raiz.appendChild(painel);
    posicionarPainel();
    atualizarBotoes();
    mostrar();
  }

  // Posição e tamanho escolhidos pelo autor, salvos no Tampermonkey (iguais em todos os
  // portais). Sem posição salva, o painel fica no canto superior direito.
  let posicao = gmLer(CHAVE_POSICAO, null);
  let arrastou = false;

  function prepararArraste(cabecalho, painel) {
    cabecalho.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      const r = painel.getBoundingClientRect();
      const x0 = e.clientX, y0 = e.clientY;
      let moveu = false;
      const mover = (ev) => {
        if (!moveu && Math.hypot(ev.clientX - x0, ev.clientY - y0) < 4) return;
        moveu = true;
        painel.classList.add('arrastando');
        posicao = { ...posicao, left: Math.round(r.left + ev.clientX - x0), top: Math.round(r.top + ev.clientY - y0) };
        posicionarPainel();
      };
      const soltar = () => {
        removeEventListener('pointermove', mover);
        removeEventListener('pointerup', soltar);
        painel.classList.remove('arrastando');
        if (!moveu) return;
        gmGravar(CHAVE_POSICAO, posicao);
        arrastou = true;
        setTimeout(() => { arrastou = false; }, 0);
      };
      addEventListener('pointermove', mover);
      addEventListener('pointerup', soltar);
    });
    cabecalho.addEventListener('dblclick', () => {
      posicao = null;
      gmApagar(CHAVE_POSICAO);
      painel.style.width = painel.style.height = painel.style.left = painel.style.top = painel.style.right = '';
      posicionarPainel();
      status('Painel de volta ao canto, no tamanho padrão.');
    });
  }

  function posicionarPainel() {
    const p = el.painel;
    if (!p) return;
    if (posicao?.width && !p.style.width) { p.style.width = posicao.width; p.style.height = posicao.height || ''; }
    if (posicao?.left == null) return;
    const w = p.offsetWidth || 360;
    p.style.left = `${Math.min(Math.max(0, posicao.left), Math.max(0, innerWidth - w))}px`;
    p.style.top = `${Math.min(Math.max(0, posicao.top), Math.max(0, innerHeight - 48))}px`;
    p.style.right = 'auto';
  }

  // O painel só aparece em página de busca (com cards); depois de aparecer, é reposto se sumir.
  // No modo automático, uma página que não mostra card em 20 s também encerra a coleta.
  let ehBusca = false;
  // Páginas de imóveis (busca ou início do portal), onde o painel aparece mesmo sem card.
  const PAGINA_IMOVEIS = /^\/(?:$|imoveis|aluguel|alugar|venda)/;
  let iniciouAuto = false;
  let tentativas = 0;

  // Durante o desafio do Cloudflare, o painel aparece com o aviso e a contagem de 20 s não corre.
  // Fila: o painel aparece em qualquer página do portal (para "Fila" e para mostrar a
  // espera); a busca da vez começa sozinha ao carregar, se for deste portal.
  function verificar() {
    if (!document.body) return;
    const fila = lerFila();
    const filaAqui = !!fila?.ativa && !!fila.itens[fila.i] && chaveBusca(fila.itens[fila.i]) === chaveBusca(location.href);
    const desafio = (!!lerAuto() || filaAqui) && desafioCloudflare() && lerPagina(portal).length === 0;
    if (!ehBusca) {
      ehBusca = lerPagina(portal).length > 0 || desafio || filaAqui || !!fila?.ativa || PAGINA_IMOVEIS.test(location.pathname)
        || (!!lerAuto() && ++tentativas > 13);
      if (!ehBusca) return;
      console.info(NOME, 'painel montado');
    }
    if (!hospedeiro) montarPainel();
    if (!hospedeiro.isConnected) document.documentElement.appendChild(hospedeiro);
    if (desafio) { status('Bloqueio do Cloudflare: resolva o desafio na página; a coleta retoma desta página.'); return; }
    if (!iniciouAuto && lerAuto()) { iniciouAuto = true; passoAutomatico(); return; }
    if (filaAqui && !iniciouAuto && !contando && !lerAuto()) iniciarBuscaDaFila();
  }

  // Aviso ao fechar a aba ou sair por link do portal com muitos anúncios fora de CSV; a
  // rodada automática troca de página sozinha e não dispara o aviso.
  if (typeof window !== 'undefined' && window.addEventListener) {
    window.addEventListener('beforeunload', (e) => {
      if (lerAuto() || lerFila()?.ativa || pendentes(carregar(), exportadoEm()) < AVISO_PENDENTES) return;
      e.preventDefault();
      e.returnValue = '';
    });
  }

  console.info(NOME, 'carregado');
  try { const n = migrarLocalStorage(); if (n) console.info(NOME, `${n} anúncios do localStorage passaram para o Tampermonkey`); } catch (e) { console.error(NOME, e); }
  if (portal === 'quintoandar') interceptarQuinto();
  setInterval(() => { try { verificar(); } catch (e) { console.error(NOME, e); } }, 1500);
})();
