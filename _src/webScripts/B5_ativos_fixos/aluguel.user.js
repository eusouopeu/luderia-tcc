// ==UserScript==
// @name         Coletor de anúncios de aluguel (TCC Luderia)
// @namespace    tcc-luderia
// @version      2026.11.13-5
// @description  Lê os anúncios das páginas de busca do OLX, ZAP Imóveis, Viva Real, NetImóveis e QuintoAndar (preço, condomínio, IPTU, área, bairro), percorre as páginas e uma fila de buscas entre portais e exporta CSV.
// @match        https://www.olx.com.br/*
// @match        https://www.zapimoveis.com.br/*
// @match        https://www.vivareal.com.br/*
// @match        https://www.quintoandar.com.br/*
// @match        https://www.netimoveis.com/*
// @run-at       document-start
// @noframes
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// @grant        unsafeWindow
// @grant        GM_download
// @require      lista_aluguel.js
// ==/UserScript==

/*
 * Uso pessoal, para o Bloco B5 (ativos fixos): preço pedido de aluguel de pontos comerciais em
 * Salvador (cap. 9, premissas C04 e C05, e 6.4, escolha do bairro). Os portais bloqueiam
 * requisições fora do navegador (Cloudflare), por isso a coleta roda na página.
 *
 * Como usar (fila, o caminho normal): abrir qualquer página do OLX, do ZAP, do Viva Real
 * ou do NetImóveis e clicar em "Fila". A fila já vem com as 33 buscas do plano (loja ou
 * ponto de 100 a 200 m² nos 11 bairros de maior renda, com Ondina e Chame-Chame separados,
 * no OLX, no ZAP e no NetImóveis; 6.4, decisão do autor de 13/11/2026); a lista é
 * editável, uma URL por linha, e "Padrão" a restaura. Para outra fila, abrir "Montar
 * buscas", escolher bairros (selos ou texto), área mínima e máxima, tipos (loja/ponto,
 * sala, casa comercial, prédio, galpão) e portais, e clicar em "Gerar fila": a lista passa
 * a ter uma busca por portal, bairro e tipo (no OLX, os tipos numa busca só); tipo que o
 * portal não tem fica de fora, com aviso. O script abre cada busca, coleta
 * todas as páginas, confere a cobertura (lidos ÷ total que o portal diz ter), repete a
 * busca uma vez se ela ficar abaixo de 95%, espera 8 a 15 s e passa à próxima, mesmo
 * em outro portal. Página vazia ou repetida antes do total (falha de carga ou bloqueio, como
 * na rodada de 12/11/2026, que parou na página 1 do OLX na Pituba) é recarregada até 2 vezes;
 * se ainda falhar, a repetição da busca retoma dessa página. No fim, toca um som e baixa um
 * CSV só, com tudo o que foi guardado, e o resumo da fila (AAAA-MM-DD_HHmm_fila_resumo_aluguel.csv:
 * lidos, total, cobertura e motivo da parada de cada busca).
 * "Parar" pausa a fila; "Continuar" retoma da busca em que parou. A tabela da fila
 * mostra, por busca, lidos, total e cobertura.
 *
 * Menu das buscas (mesmo padrão do coletor de preços): o seletor do topo traz as buscas da
 * lista da fila, por portal, com ✓ coletada (lidos/total), ◐ cobertura abaixo de 95% e
 * ○ falta. Escolher uma abre a busca e coleta todas as páginas sozinho (como "Todas");
 * "Próximo" faz o mesmo com a próxima que falta (primeiro no mesmo portal);
 * "Coletada"/"Desfazer" marca à mão; "só as que faltam" esconde as prontas. A rodada que
 * termina (pelo menu, por "Todas" ou pela fila) fica registrada no Tampermonkey.
 *
 * Uma busca avulsa: abrir a busca no portal, já filtrada (tipo, cidade, bairro), e clicar
 * em "Todas". O script lê a página, rola até o fim, guarda os anúncios e vai para a página
 * seguinte (?o=N no OLX, ?pagina=N no ZAP e no Viva Real, botão "Próxima página" no
 * NetImóveis, botão "Ver mais" no QuintoAndar) até uma página vir vazia, não trazer anúncio inédito nesta rodada, ler o
 * total da busca ou chegar ao limite. "Inédito" conta só a rodada: refazer uma busca já
 * guardada percorre todas as páginas de novo. No fim, toca um som e baixa o CSV.
 *
 * Os anúncios ficam no armazenamento do Tampermonkey, comum aos portais (o que estava no
 * localStorage de cada portal, nas versões anteriores, passa para lá ao abrir o portal),
 * até "Reiniciar" (lixeira). Se aparecer o desafio do Cloudflare, a rodada pausa e retoma da mesma
 * página depois que ele for resolvido. Cada anúncio leva o total de resultados que o
 * portal diz ter na busca (total_busca), para o build medir a cobertura.
 *
 * Painel pelo kit dos painéis (_kit_painel/kit_painel.js, o mesmo dos demais coletores):
 * menu das buscas com contador, "Próximo", marcar e "só os que faltam"; "Parar" sempre à
 * mão; som, download automático e "baixar cada busca" no cabeçalho; explicações em dicas;
 * arraste pelo cabeçalho e redimensione pelo canto inferior direito (posição e tamanho
 * ficam salvos; duplo clique no cabeçalho volta ao canto); barras de progresso da busca e
 * da fila. A lixeira é o "Reiniciar": dois cliques, baixa antes o CSV de tudo e apaga os
 * anúncios de todos os portais e o histórico de coleta (buscas feitas, marcas, fila e
 * rodada); ficam a lista de buscas e as preferências. Som: o navegador só libera áudio depois
 * de um clique na página; na fila, clique uma vez no painel para o aviso final tocar. Mostra os anúncios fora de CSV (com 100 ou mais, cobra o
 * download e o navegador pede confirmação ao fechar a aba), a cobertura da busca (lidos
 * ÷ total do portal), a coleta mais antiga da busca (alerta acima de 30 dias), a mediana,
 * P25 e P75 do R$/m² pedido, o funil da última página (cards → com id → com preço → com
 * área), o preenchimento de cada campo, a mistura de operação, cidade e tipo, a prévia do
 * que o build vai descartar, quantos anúncios estão no alvo (porte do plano e áreas do
 * 6.4), o histórico da rodada automática e as buscas guardadas, com "Baixar" e "Apagar"
 * por busca (Apagar baixa antes o CSV do que sai e tira o registro da coleta dela). Os filtros só mudam esses indicadores
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
 *  - NetImóveis (13/11/2026): /locacao/bahia/salvador/bairros/<bairro>/loja?localizacao=BR-BA-salvador-<bairro>--&transacao=locacao&areaMin=100&areaMax=200
 *               (tipo no caminho: loja, sala, predio, galpao). A página seguinte só abre pelo
 *               botão "Próxima página", que troca a lista sem recarregar a página: a URL leva
 *               pag=N com uma assinatura (sig, ts), e pag=N sem ela volta à página 1. 21
 *               anúncios por página; no fim, o botão fica desabilitado. Cada anúncio aparece duas vezes no HTML (listas de
 *               celular e de computador): conta uma vez, pelo código. Busca sem resultado:
 *               "0 Lojas para alugar…" e "Nenhum imóvel encontrado".
 *  - QuintoAndar: /alugar/imovel/<bairro>-salvador-ba-brasil (em Salvador, só residencial)
 *
 * Fontes de cada portal:
 *  - OLX: cards section.olx-adcard (título, preço, condomínio, IPTU, área, bairro, data).
 *  - ZAP e Viva Real (mesmo layout, mesmos ids de anúncio): cards [data-cy="rp-property-cd"].
 *  - NetImóveis: cards li.list-none com link /imovel/ (título, endereço, bairro, área,
 *    banheiros, vagas, código, aluguel, condomínio e IPTU). O IPTU vem como "R$ 763 (11)":
 *    o valor da parcela e, entre parênteses, o número de parcelas; grava-se a parcela, como
 *    valor mensal (a diferença para o anual ÷ 12 fica abaixo de 1% do custo de ocupação).
 *  - QuintoAndar: JSON da página (__NEXT_DATA__) e respostas de /search/list.
 *
 * Saída: CSV com ";" e UTF-8 com BOM, uma linha por anúncio. Valores em R$ por mês;
 * condomínio e IPTU vazios quando o anúncio não informa e 0 quando diz "isento".
 * O tratamento (duplicatas entre portais, R$/m², resumo por bairro) fica em
 * build/B5b_anuncios_aluguel.py.
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
  const CHAVE_FEITAS = 'tcc_aluguel_buscas_feitas'; // { chaveAlvo: resultadoBusca + chave_busca, em }
  const CHAVE_MARCAS = 'tcc_aluguel_buscas_marcas'; // { chaveAlvo: true (dada por coletada) | false (desfeita) }
  const CHAVE_ALVO = 'tcc_aluguel_alvo';
  const CHAVE_ABRIR = 'tcc_aluguel_abrir';
  const CHAVE_SO_FALTAM = 'tcc_aluguel_so_faltam';
  const CHAVE_CADA = 'tcc_aluguel_baixar_cada'; // fila: baixar o CSV de cada busca ao terminar
  const PAUSA_FILA = [8000, 15000]; // ms entre buscas da fila (sorteado)
  const COBERTURA_MIN = 0.95; // abaixo disso, a fila repete a busca uma vez
  const LIMITE_FILA = 50; // páginas por busca na fila
  const MAX_RECARGAS = 2; // recargas da mesma página vazia antes do total, antes de encerrar a busca
  const PAUSA_RECARGA = [10000, 20000]; // ms antes de recarregar a página vazia (sorteado)
  const NOMES_PORTAL = { olx: 'OLX', zap: 'ZAP', vivareal: 'Viva Real', netimoveis: 'NetImóveis', quintoandar: 'QuintoAndar' };

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
  //  - NetImóveis (13/11/2026): tipo no caminho (loja, sala, predio, galpao); área em areaMin
  //    e areaMax; sem casa comercial.
  // Tipo sem busca num portal fica de fora da fila daquele portal (o painel avisa).
  const TIPOS_BUSCA = {
    loja: { rotulo: 'loja/ponto', dica: 'Loja, salão ou ponto comercial (OLX: Loja e Outros)', olx: [6, 7], zap: 'loja-salao', vivareal: 'ponto-comercial_comercial', netimoveis: 'loja' },
    sala: { rotulo: 'sala', dica: 'Sala ou conjunto comercial (OLX: Escritório)', olx: [1], zap: 'conjunto-comercial-sala', vivareal: 'sala_comercial', netimoveis: 'sala' },
    casa: { rotulo: 'casa comercial', dica: 'Casa ou imóvel comercial (só ZAP e Viva Real)', olx: null, zap: 'casa-comercial', vivareal: 'imovel-comercial_comercial', netimoveis: null },
    predio: { rotulo: 'prédio', dica: 'Prédio inteiro (ZAP, Viva Real e NetImóveis)', olx: null, zap: 'predio-inteiro', vivareal: 'predio_comercial', netimoveis: 'predio' },
    galpao: { rotulo: 'galpão', dica: 'Galpão ou depósito (OLX e NetImóveis)', olx: [2], zap: null, vivareal: null, netimoveis: 'galpao' },
  };
  // As listas vêm de lista_aluguel.js, lida pelo carregador (@require) antes deste arquivo.
  if (typeof LISTA_ALUGUEL === 'undefined') {
    const msg = '[Coletor de aluguel] lista_aluguel.js não foi carregada: reinstale o carregador (python3 _src/outros/G5_outros/gerar_carregadores.py --abrir).';
    console.error(msg);
    if (typeof alert === 'function') alert(msg);
    return;
  }
  // Bairros do menu (os 11 de maior renda no topo, depois os demais em ordem alfabética): lista_aluguel.js.
  const BAIRROS_DESTAQUE = LISTA_ALUGUEL.bairros_destaque;
  const BAIRROS_SALVADOR = LISTA_ALUGUEL.bairros_salvador;
  const BAIRROS_MENU = [...BAIRROS_DESTAQUE, ...BAIRROS_SALVADOR.filter((b) => !BAIRROS_DESTAQUE.includes(b)).sort((a, b) => a.localeCompare(b, 'pt'))];
  const PORTAIS_BUSCA = ['olx', 'zap', 'vivareal', 'netimoveis'];
  // Buscas do plano (montagem padrão, com os portais dela): lista_aluguel.js.
  const MONTAGEM_PADRAO = { portais: PORTAIS_BUSCA, ...LISTA_ALUGUEL.montagem_padrao };

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
        if (p === 'netimoveis') {
          const q = [`localizacao=BR-BA-salvador-${b}--`, 'transacao=locacao', min && `areaMin=${min}`, max && `areaMax=${max}`].filter(Boolean).join('&');
          for (const t of comBusca) urls.push(`https://www.netimoveis.com/locacao/bahia/salvador/bairros/${b}/${TIPOS_BUSCA[t].netimoveis}?${q}`);
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
      publicado: NAO_INFORMADO,
    };
  }

  // Campo que o portal não mostra na listagem: "não informado", não vazio (vazio parece falha de leitura).
  const NAO_INFORMADO = 'não informado';
  const TIPO_TITULO = [
    [/\b(galpao|galpoes|deposito|armazem)\b/, 'Galpão (pelo título)'],
    [/\b(predio comercial|predio inteiro)\b/, 'Prédio (pelo título)'],
    [/\b(sala comercial|salas comerciais|conjunto comercial|escritorio|consultorio)\b/, 'Sala comercial (pelo título)'],
    [/\b(loja|lojas|ponto comercial|pontos comerciais|salao comercial|box comercial)\b/, 'Loja/ponto (pelo título)'],
    [/\b(casa|sobrado)\b/, 'Casa (pelo título)'],
  ];
  const tipoPeloTitulo = (titulo) => (TIPO_TITULO.find(([re]) => re.test(semAcento(titulo))) || [null, NAO_INFORMADO])[1];

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
      // O card da OLX não traz o tipo (até 2026.11.13-1 saía vazio nos 323 anúncios de 13/11):
      // vem do título, marcado como tal, ou "não informado".
      tipo: tipoPeloTitulo(titulo),
      id: (String(c.href || '').match(/-(\d{6,})(?:[/?#]|$)/) || [])[1] || '',
      url: String(c.href || '').split('?')[0],
      titulo,
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
      publicado: limpar(c.data) || NAO_INFORMADO,
    };
  }

  // NetImóveis: campos = { titulo, href, linhas: [textos do card, na ordem] }. O card não tem
  // rótulos por campo fora dos números (área, quartos, banheiros, vagas vêm depois do rótulo);
  // bairro na linha "<bairro>, Salvador", endereço na linha anterior, aluguel na linha "R$ …",
  // encargos na linha "Condomínio: R$ … • IPTU: R$ … (parcelas)".
  function normalizarNet(c) {
    const titulo = limpar(c.titulo);
    const linhas = (c.linhas || []).map(limpar).filter(Boolean);
    const depois = (re) => { const i = linhas.findIndex((l) => re.test(semAcento(l))); return i >= 0 ? linhas[i + 1] : null; };
    // "<bairro>, Salvador"; sem ela, a primeira linha com vírgula depois do título que não é preço nem rótulo.
    const ehLocal = (l) => /,\s*[^,]+$/.test(l) && !/^R\$|:/.test(l) && l !== titulo;
    let iLocal = linhas.findIndex((l) => ehLocal(l) && /,\s*salvador$/i.test(l));
    if (iLocal < 0) iLocal = linhas.findIndex(ehLocal);
    const local = iLocal >= 0 ? linhas[iLocal] : '';
    const corte = local.lastIndexOf(',');
    const endereco = iLocal > 0 && linhas[iLocal - 1] !== titulo ? linhas[iLocal - 1] : '';
    const preco = numeroBR(linhas.find((l) => /^R\$\s*\d/.test(l)));
    const encargos = linhas.filter((l) => /^(condom|iptu)/i.test(semAcento(l))).join(' • ');
    const condominio = valorRotulado(encargos, 'Condom[ií]nio:');
    const iptu = valorRotulado(encargos, 'IPTU:');
    const areaM2 = area(depois(/^tamanho do imovel/)) ?? area(titulo);
    const href = String(c.href || '');
    return {
      portal: 'netimoveis',
      id: (href.match(/\/(\d+)(?:[?#]|$)/) || [])[1] || (linhas.join(' ').match(/C[oó]digo:\s*(\d+)/) || [])[1] || '',
      url: href.split('?')[0],
      titulo,
      tipo: (titulo.match(/^(.*?)\s+(?:para alugar|à venda|para comprar)/i) || [])[1] || tipoPeloTitulo(titulo),
      operacao: /\/imovel\/locacao-/.test(href) || /para alugar/i.test(titulo) ? 'aluguel' : /\/imovel\/venda-/.test(href) ? 'venda' : operacaoDe(titulo, preco, areaM2),
      aluguel: preco,
      condominio,
      iptu,
      condominio_iptu: condominio != null && iptu != null ? condominio + iptu : null,
      area_m2: areaM2,
      quartos: inteiro(depois(/^quantidade de quartos/)),
      banheiros: inteiro(depois(/^quantidade de banheiros/)),
      vagas: inteiro(depois(/^quantidade de vagas/)),
      bairro: corte > 0 ? local.slice(0, corte).trim() : local,
      cidade: corte > 0 ? local.slice(corte + 1).trim() : '',
      endereco,
      anunciante: '',
      publicado: NAO_INFORMADO,
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
      publicado: NAO_INFORMADO,
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
    if (/netimoveis\.com$/.test(host)) return 'netimoveis';
    return '';
  }

  const paramPagina = (portal) => (portal === 'olx' ? 'o' : portal === 'netimoveis' ? 'pag' : 'pagina');
  // Assinatura da paginação do NetImóveis (pag=N vem com sig e ts): fora da URL da busca.
  const PARAMS_ASSINATURA = ['sig', 'ts'];
  function semAssinatura(href) {
    try { const u = new URL(href); PARAMS_ASSINATURA.forEach((k) => u.searchParams.delete(k)); return u.toString(); } catch (e) { return String(href || ''); }
  }

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
    'busca_url', 'pagina', 'total_busca', 'data_coleta', 'rodada'];

  function celula(v) {
    const s = typeof v === 'number' ? String(v).replace('.', ',') : String(v ?? '');
    return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  }

  const csv = (ls) => '﻿' + [COLS.join(';'), ...ls.map((l) => COLS.map((c) => celula(l[c])).join(';'))].join('\r\n');

  // lidos: anúncios vistos na busca (base da cobertura contra o total do portal); guardados: os
  // do bairro pedido; bairro_reconhecido "não" quando o portal devolveu a cidade inteira.
  const COLS_FILA = ['rotulo', 'url', 'lidos', 'guardados', 'fora_do_bairro', 'bairro_reconhecido', 'total', 'cobertura', 'paginas', 'motivo', 'tentativa'];
  const csvResumoFila = (rs) => '﻿' + [COLS_FILA.join(';'), ...(rs || []).map((r) => COLS_FILA.map((c) => celula(c === 'cobertura' && r[c] != null ? Math.round(r[c] * 1000) / 1000 : r[c])).join(';'))].join('\r\n');

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

  // Bairro que a URL da busca pede (mesma leitura do rótulo), em minúsculas e com hífen; '' sem bairro.
  function bairroDaUrl(url) {
    try {
      const u = new URL(url);
      const p = portalDe(u.hostname);
      const d = decodeURIComponent(u.pathname).toLowerCase();
      const m = d.match(/\+\+([^/]+)/) || d.match(/\/bairros\/([^/]+)/) || (p === 'olx' ? d.match(/\/salvador\/([^/]+)/) : null)
        || (p === 'quintoandar' ? d.match(/\/imovel\/([^/]+?)-salvador/) : null);
      return m ? m[1] : '';
    } catch (e) { return ''; }
  }

  // O portal desviou a busca? Sem resultado no bairro pedido, o ZAP (e outros) redirecionam para
  // a listagem de Salvador inteira: o bairro some do caminho e a página traria imóveis de todos os
  // bairros, com o total da cidade. Só vale para busca com bairro na URL.
  function redirecionada(pedida, atual) {
    const b = bairroDaUrl(pedida);
    if (!b) return false;
    try { return !decodeURIComponent(new URL(atual).pathname).toLowerCase().includes(b); } catch (e) { return false; }
  }

  // URL que a fila abre: a da busca ou, na repetição que retoma, a da página em que a rodada parou
  // (QuintoAndar e NetImóveis não paginam por URL montada: recomeçam).
  const SEM_PAGINA_NA_URL = ['quintoandar', 'netimoveis'];
  function urlDeAbertura(busca, retomada) {
    try {
      const p = portalDe(new URL(busca).hostname);
      return retomada?.pagina > 1 && !SEM_PAGINA_NA_URL.includes(p) ? paginaDaBusca(p, busca, retomada.pagina) : busca;
    } catch (e) { return busca; }
  }

  // Página n de uma busca, montada a partir da URL pedida (não da barra de endereço): se o portal
  // trocar a URL no meio da rodada (bairro some, cidade inteira), a próxima página continua no bairro.
  function paginaDaBusca(portal, busca, n) {
    const u = new URL(busca);
    if (n > 1) u.searchParams.set(paramPagina(portal), String(n)); else u.searchParams.delete(paramPagina(portal));
    return u.toString();
  }

  // Anúncio de outro bairro numa busca por bairro (patrocinado do OLX, listagem trocada pelo portal):
  // não é guardado. Anúncio sem bairro fica (não dá para saber).
  function foraDoBairro(a, busca) {
    const b = bairroDaUrl(busca);
    const ab = slugBairro(a.bairro);
    return !!b && !!ab && ab !== b;
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
  function resultadoBusca(url, lidos, total, paginas, motivo, extra = {}) {
    const t = total > 0 ? total : null;
    return {
      url, rotulo: rotuloBusca(url), lidos, guardados: extra.guardados ?? lidos, fora_do_bairro: extra.fora ?? 0,
      bairro_reconhecido: extra.cidadeInteira ? 'não' : 'sim', total: t, cobertura: t ? Math.min(1, lidos / t) : null, paginas, motivo,
    };
  }
  const extraDe = (auto) => ({ guardados: auto.guardadosBusca, fora: auto.foraBusca, cidadeInteira: auto.cidadeInteira });

  // Busca por bairro que o portal não reconheceu: a página traz a cidade inteira (total de
  // Salvador) com o bairro ainda na URL. Visto na OLX em 13/11/2026: Caminho das Árvores e
  // Chame-Chame com totais de 1.423 e 1.424 e quase todos os anúncios de outros bairros.
  // Nesse caso a rodada pagina a cidade até o total, guardando só os do bairro.
  const bairroNaoReconhecido = ({ lidos, fora, total }) => lidos >= 10 && fora / lidos >= 0.5 && total > 0;

  // Mesma busca, para a fila reconhecer a página que abriu: host e caminho, sem a barra
  // final e sem o "/grande-salvador" que o OLX tira no redirecionamento; ignora a query.
  function chaveBusca(url) {
    try {
      const u = new URL(url);
      return `${u.hostname.replace(/^www\./, '')}${decodeURIComponent(u.pathname).replace(/\/grande-[^/]+/, '').replace(/\/+$/, '')}`.toLowerCase();
    } catch (e) { return String(url); }
  }

  // ---------- menu das buscas (mesmo padrão do coletor de preços) ----------
  // Uma opção por busca da lista da fila. Chave: host, caminho e parâmetros (sem o da página),
  // para distinguir as buscas do mesmo caminho com tipos ou áreas diferentes (OLX).
  function chaveAlvo(url) {
    try {
      const u = new URL(url);
      for (const k of ['o', 'pagina', 'pag', ...PARAMS_ASSINATURA]) u.searchParams.delete(k);
      const q = [...u.searchParams.entries()].map(([k, v]) => `${k}=${v}`).sort().join('&');
      return `${chaveBusca(url)}?${q}`;
    } catch (e) { return String(url); }
  }

  // Registro de coletas (feitas ou marcas, por chaveAlvo) sem as entradas de uma busca: a de
  // chave igual ou, sem ela (o portal mudou a query), as do mesmo caminho.
  function semBusca(registro, busca) {
    const chaves = Object.keys(registro || {});
    const fora = chaves.includes(chaveAlvo(busca)) ? [chaveAlvo(busca)] : chaves.filter((k) => k.startsWith(`${chaveBusca(busca)}?`));
    return Object.fromEntries(Object.entries(registro || {}).filter(([k]) => !fora.includes(k)));
  }

  // Estado de uma busca: ok (rodada com cobertura de 95% ou mais, ou sem total), baixa
  // (cobertura abaixo de 95%) ou falta. A marca à mão prevalece. Sem registro pela chave
  // completa, vale o da mesma chaveBusca, quando só uma busca da lista tem esse caminho.
  function estadoAlvo(url, feitas = {}, marcas = {}, alvos = [url]) {
    const k = chaveAlvo(url);
    if (marcas[k] === true) return { e: 'ok', r: feitas[k] || null };
    if (marcas[k] === false) return { e: 'falta', r: null };
    let r = feitas[k];
    if (!r && alvos.filter((a) => chaveBusca(a) === chaveBusca(url)).length === 1) {
      r = Object.values(feitas).filter((x) => x.chave_busca === chaveBusca(url)).sort((a, b) => (b.em || 0) - (a.em || 0))[0];
    }
    if (!r) return { e: 'falta', r: null };
    return { e: r.cobertura != null && r.cobertura < COBERTURA_MIN ? 'baixa' : 'ok', r };
  }

  // Próxima busca que falta (ou com cobertura baixa): primeiro no portal da atual, depois nos
  // outros, na ordem da lista a partir da atual.
  function proximoAlvo(alvos, atual, feitas = {}, marcas = {}) {
    const i0 = alvos.indexOf(atual);
    const ordem = [...alvos.slice(i0 + 1), ...alvos.slice(0, Math.max(i0, 0))]
      .filter((u) => u !== atual && estadoAlvo(u, feitas, marcas, alvos).e !== 'ok');
    const p = (u) => { try { return portalDe(new URL(u).hostname); } catch (e) { return ''; } };
    return ordem.find((u) => p(u) === p(atual)) || ordem[0] || null;
  }

  // Repete a busca (uma vez) se a cobertura ficou abaixo do mínimo; sem total, não repete.
  const repetirBusca = (r, tentativa) => r.cobertura != null && r.cobertura < COBERTURA_MIN && !(tentativa > 0);

  // Próximo passo da rodada depois de ler uma página. Página vazia ou sem anúncio inédito antes
  // de ler o total que o portal informa é falha de carga ou bloqueio (o portal serve a mesma
  // página normalmente quando aberta de novo): recarrega a mesma página até MAX_RECARGAS vezes
  // antes de encerrar. Sem total, ou com o total já lido, encerra como antes.
  // s = { lidos, ineditos, vistos, total, paginas, limite, recargas, semResultado }
  function decidirPasso(s) {
    const faltam = s.total > 0 && s.vistos < s.total;
    if (s.lidos === 0 || s.ineditos === 0) {
      // "Sem resultado no portal" só quando a busca inteira não trouxe nada (até 2026.11.13-1 a
      // página depois da última, com o aviso de sem resultado, encerrava assim buscas com 75 de 76).
      if (s.lidos === 0 && s.semResultado && !s.vistos) return { acao: 'concluir', motivo: 'sem resultado no portal' };
      if (faltam && (s.recargas || 0) < MAX_RECARGAS) return { acao: 'recarregar' };
      const base = s.lidos === 0 ? 'página vazia' : 'página sem anúncio inédito';
      return { acao: 'concluir', motivo: faltam ? `${base} antes do total (${s.vistos} de ${s.total})` : base, falha: faltam };
    }
    if (s.total > 0 && s.vistos >= s.total) return { acao: 'concluir', motivo: 'total da busca lido' };
    if (s.paginas >= s.limite) return { acao: 'concluir', motivo: 'limite de páginas' };
    return { acao: 'seguir' };
  }

  // "Nenhum imóvel encontrado com esses filtros" (ZAP, Viva Real), "Nenhum anúncio encontrado" (OLX).
  const semResultadoDeTexto = (t) => /nenhum(?:a)?\s+(?:im[oó]ve(?:l|is)|an[uú]ncios?|resultados?)\s+(?:foi\s+)?encontrad/i.test(String(t || ''));

  // ---------- indicadores de qualidade do painel (sem DOM: testável) ----------
  // Só contam e destacam; nada é descartado na coleta. As regras repetem as do build
  // (build/B5b_anuncios_aluguel.py) para o painel antecipar o que ele fará.

  // Busca sem o parâmetro de página: agrupa as páginas de uma mesma busca.
  function buscaBase(portal, href) {
    try {
      const u = new URL(href);
      u.searchParams.delete(paramPagina(portal));
      PARAMS_ASSINATURA.forEach((k) => u.searchParams.delete(k));
      u.hash = '';
      return u.toString();
    } catch (e) { return String(href || ''); }
  }

  // NetImóveis: o tipo é o último trecho do caminho (/bairros/<bairro>/loja?…).
  const reNet = (tipos) => `netimoveis\\.com/locacao/[^?#]*/(?:${tipos})(?:[?#]|$)`;
  const RE_BUSCA_COMERCIAL = new RegExp('loja-salao|conjunto-comercial|comercio-e-industria|ponto-comercial|casa-comercial|imovel-comercial|galpao|predio-inteiro|imoveis-comerciais|consultorio|' + reNet('loja|sala|predio'));
  const RE_BUSCA_RESIDENCIAL = /quintoandar\.com\.br|\/apartamentos?[/_-]|\/casas?[/_-]|kitnet|flat|cobertura/;
  const RE_COMERCIAL = /\b(lojas?|(?:salao|saloes|salas?|pontos?|imove(?:l|is)|predios?|conjuntos?|box) comercia(?:l|is)|galpao|galpoes|depositos?|armazem|escritorios?|consultorios?|andar corporativo|sala para escritorio|sala empresarial|centro empresarial)\b/;
  const SUBTIPO_BUSCA = [['loja_ponto', new RegExp('loja-salao|ponto-comercial|' + reNet('loja'))], ['sala', new RegExp('conjunto-comercial|consultorio|' + reNet('sala'))],
    ['galpao', /galpao/], ['predio', new RegExp('predio-inteiro|' + reNet('predio'))]];
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
  const contarCards = (portal) => (portal === 'netimoveis' ? cardsNet().length : SEL_CARDS[portal] ? document.querySelectorAll(SEL_CARDS[portal]).length : lerPaginaQuinto().length);

  // NetImóveis: cada anúncio sai duas vezes no HTML (lista de celular e de computador); fica o
  // card visível de cada código.
  function cardsNet() {
    const porId = new Map();
    for (const card of document.querySelectorAll('li.list-none')) {
      const a = card.querySelector('a[href*="/imovel/"]');
      if (!a || card.parentElement?.closest('li.list-none')) continue;
      const id = (a.href.match(/\/(\d+)(?:[?#]|$)/) || [])[1] || a.href;
      if (!porId.has(id) || (card.offsetParent !== null && porId.get(id).offsetParent === null)) porId.set(id, card);
    }
    return [...porId.values()];
  }

  function lerPaginaNet() {
    cardsDaPagina.clear();
    return cardsNet().map((card) => registrarCard(normalizarNet({
      titulo: texto(card, 'h2'),
      href: card.querySelector('a[href*="/imovel/"]')?.href || '',
      linhas: String(card.innerText || card.textContent || '').split('\n'),
    }), card)).filter((a) => a.id);
  }

  // Botão "Próxima página" do NetImóveis (a URL da página seguinte é assinada pelo site).
  const botaoProximaNet = () => [...document.querySelectorAll('button, a')]
    .find((b) => /pr[oó]xima p[aá]gina/i.test(`${b.textContent || ''} ${b.getAttribute('aria-label') || ''}`) && !b.disabled && b.getAttribute('aria-disabled') !== 'true' && b.offsetParent !== null);

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
    if (portal === 'netimoveis') return lerPaginaNet();
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
  // Com `alvo` (a busca pedida), confere antes e depois da leitura se o portal não desviou a página
  // (bairro sumiu da URL): desviada, nada é guardado. Anúncios de outro bairro não são guardados.
  async function coletarPagina(pagina = paginaAtual(portal, location.href), alvo = '', rodada = '') {
    if (alvo && redirecionada(alvo, location.href)) return { desviada: true, anuncios: [], lidos: 0, novos: 0, gravou: true, total: null, fora: 0 };
    await esperarCards(portal);
    await rolarAteOFim();
    const anuncios = lerPagina(portal);
    if (alvo && redirecionada(alvo, location.href)) return { desviada: true, anuncios: [], lidos: 0, novos: 0, gravou: true, total: null, fora: 0 };
    ultimoFunil = funil(anuncios, contarCards(portal));
    guardados = carregar();
    const total = totalResultados();
    const doBairro = alvo ? anuncios.filter((a) => !foraDoBairro(a, alvo)) : anuncios;
    const novos = guardar(guardados, doBairro, { busca_url: semAssinatura(location.href), pagina, total_busca: total, data_coleta: dataLocal(), rodada, alterado_em: Date.now() });
    const gravou = salvar(guardados);
    const semResultado = !anuncios.length && semResultadoDeTexto(document.body?.innerText);
    return { anuncios, doBairro, lidos: anuncios.length, novos, gravou, total, fora: anuncios.length - doBairro.length, semResultado };
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
    status('O armazenamento recusou a gravação: o CSV saiu com tudo o que foi lido. Confira o arquivo, apague buscas em "Buscas guardadas" e retome.', 'erro');
  }

  // Resumo da fila, ao lado do CSV dos anúncios: por que cada busca parou e com que cobertura.
  // Sem ele, uma busca que parou cedo (página vazia, bloqueio) não deixa rastro no CSV.
  // Download: com GM_download, em Downloads/TCC Luderia/B5_aluguel/_dados-brutos/ sem perguntar;
  // recusado (modo nativo do Tampermonkey, extensão fora da lista), o download comum.
  const PASTA_DOWNLOAD = 'B5_aluguel/_dados-brutos';
  const baixarTexto = (nome, texto) => kit.baixarArquivo(nome, texto);

  // Resumo da fila, ao lado do CSV dos anúncios: por que cada busca parou e com que cobertura.
  // Sem ele, uma busca que parou cedo (página vazia, bloqueio) não deixa rastro no CSV.
  function baixarResumoFila(rs) {
    baixarTexto(`${dataLocal()}_${horaLocal()}_fila_resumo_aluguel.csv`, csvResumoFila(rs));
  }

  // Opção "baixar cada busca": CSV só dos anúncios guardados por esta busca (com o bairro não
  // reconhecido, só os do bairro), com hora e segundos no nome para não colidir com a busca
  // seguinte (o build lê AAAA-MM-DD_HHmm[ss]_<portal>_anuncios_aluguel.csv e fica com a
  // última versão de cada anúncio).
  function anunciosDaBusca(dados, auto) {
    const chaves = new Set(auto.cidadeInteira ? (auto.vistosBairro || []) : (auto.vistos || []));
    return Object.fromEntries(Object.entries(dados).filter(([k]) => chaves.has(k)));
  }
  function baixarDaBusca(auto) {
    const linhas = Object.values(anunciosDaBusca(carregar(), auto)).sort((a, b) => (a.pagina - b.pagina) || String(a.id).localeCompare(String(b.id)));
    if (!linhas.length) return 0;
    const s = String(new Date().getSeconds()).padStart(2, '0');
    baixarTexto(nomeArquivo(portalDoArquivo(linhas, portal), dataLocal(), `${horaLocal()}${s}`), csv(linhas));
    return linhas.length;
  }

  // Rodada: data e hora de início da fila (ou da busca avulsa), gravada em cada anúncio.
  function rodadaDe(ms) {
    const d = new Date(ms || Date.now());
    const z = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())} ${z(d.getHours())}:${z(d.getMinutes())}`;
  }
  // Só os anúncios da rodada (o CSV de 13/11 levou 296 linhas de 03/11, de outra busca).
  const daRodada = (dados, rodada) => Object.fromEntries(Object.entries(dados).filter(([, a]) => a.rodada === rodada));

  // parcial: CSV de uma busca, que não conta como exportação de tudo (aviso de pendentes).
  function baixarCsv(dados = carregar(), parcial = false) {
    const linhas = Object.values(dados).sort((a, b) => (a.pagina - b.pagina) || String(a.id).localeCompare(String(b.id)));
    baixarTexto(nomeArquivo(portalDoArquivo(linhas, portal), dataLocal(), horaLocal()), csv(linhas));
    if (!parcial) gmGravar(CHAVE_EXPORTACAO, Date.now());
  }

  const lerAuto = () => { try { return JSON.parse(sessionStorage.getItem(CHAVE_AUTO) || 'null'); } catch (e) { return null; } };
  const gravarAuto = (v) => { try { v ? sessionStorage.setItem(CHAVE_AUTO, JSON.stringify(v)) : sessionStorage.removeItem(CHAVE_AUTO); } catch (e) { /* sem modo automático */ } };

  // Rodada concluída: fica registrada para o menu (✓ ou ◐ pela cobertura).
  function registrarBusca(url, auto, motivo) {
    if (!url) return;
    const r = resultadoBusca(url, (auto.vistos || []).length, auto.totalBusca, auto.paginas, motivo, extraDe(auto));
    gmGravar(CHAVE_FEITAS, { ...(gmLer(CHAVE_FEITAS, {}) || {}), [chaveAlvo(url)]: { ...r, chave_busca: chaveBusca(url), em: Date.now() } });
  }

  function concluir(auto, motivo) {
    gravarAuto(null);
    const filaAtiva = auto.fila && lerFila()?.ativa;
    registrarBusca(filaAtiva ? lerFila().itens[lerFila().i] : auto.alvo || location.href, auto, motivo);
    atualizarBotoes();
    if (auto.fila && lerFila()?.ativa) { fimDaBuscaNaFila(auto, motivo); return; }
    progresso('busca', null);
    kit.tocar(true);
    if (kit.autobaixar) baixarCsv();
    mostrar(`Concluído: ${auto.paginas} páginas, ${auto.total} anúncios novos (${motivo}).${kit.autobaixar ? '' : ' Download automático desligado: baixe o CSV.'}`, 'ok');
  }

  function progressoBusca(auto) {
    const n = (auto.vistos || []).length;
    const t = auto.totalBusca;
    progresso('busca', t ? n / t : 0, `Busca: ${n}${t ? ` de ${t}` : ''} anúncios · ${auto.paginas} pág.`);
  }

  // Modo automático: sobrevive à troca de página pelo sessionStorage da aba. A parada
  // compara com os ids vistos nesta rodada (auto.vistos), não com tudo o que está
  // guardado: refazer uma busca já coletada não para na primeira página.
  async function passoAutomatico() {
    const auto = lerAuto();
    if (!auto) return;
    auto.vistos = auto.vistos || [];
    const pagina = portal === 'quintoandar' ? auto.paginas + 1 : paginaAtual(portal, location.href);
    const fila = auto.fila ? lerFila() : null;
    const alvo = (fila?.ativa ? fila.itens[fila.i] : auto.alvo) || '';
    const inicio = Date.now();
    atualizarBotoes();
    status(`Página ${pagina}: lendo…`);
    const { anuncios = [], doBairro, lidos, novos, gravou, total, desviada, fora, semResultado } = await coletarPagina(pagina, alvo, auto.rodada || '');
    if (desviada) {
      // O portal levou a rodada para fora do bairro: para aqui, sem guardar a página.
      if (fila?.ativa) { gravarAuto(null); buscaDesviada(auto); return; }
      gravarAuto(null);
      atualizarBotoes();
      status(`${rotuloBusca(alvo)}: o portal desviou a busca para ${location.pathname}; a rodada parou e esta página não foi guardada.`, 'alerta');
      return;
    }
    if (!gravou) { avisarCheio(); return; }
    if (total) auto.totalBusca = Math.max(auto.totalBusca || 0, total);
    if (!lerAuto()) return; // parado durante a leitura
    if (lidos === 0 && desafioCloudflare()) {
      // Não conta como página vazia: espera o desafio e retoma desta mesma página.
      iniciouAuto = false;
      status('Bloqueio do Cloudflare: resolva o desafio na página; a coleta retoma desta página.', 'alerta');
      return;
    }
    if (alvo && !auto.cidadeInteira && bairroNaoReconhecido({ lidos, fora, total })) {
      auto.cidadeInteira = true;
      status(`${rotuloBusca(alvo)}: o portal não reconheceu o bairro e devolveu a cidade (${total} anúncios); a rodada lê a cidade até o total e guarda só os do bairro.`);
    }
    // Só os anúncios do bairro contam para o total: o total do portal é o do bairro. Com o
    // bairro não reconhecido, o total é o da cidade, e contam todos os anúncios vistos.
    const doBairroIneditos = ineditas(doBairro, auto.vistosBairro || auto.vistos);
    const inedit = auto.cidadeInteira ? ineditas(anuncios, auto.vistos) : doBairroIneditos;
    if (auto.cidadeInteira) auto.vistosBairro = [...(auto.vistosBairro || []), ...doBairroIneditos];
    auto.vistos.push(...inedit);
    auto.guardadosBusca = (auto.guardadosBusca || 0) + doBairroIneditos.length;
    auto.foraBusca = (auto.foraBusca || 0) + (fora || 0);
    auto.total += novos;
    gravarHist([...lerHist(), { pagina, lidos, ineditos: inedit.length, novos, seg: Math.round((Date.now() - inicio) / 1000) }]);
    mostrar(`Página ${pagina}: ${lidos} lidos, ${inedit.length} inéditos na rodada, ${novos} novos no navegador${fora ? `, ${fora} de outro bairro descartados` : ''}.`);
    const passo = decidirPasso({ lidos, ineditos: inedit.length, vistos: auto.vistos.length, total: auto.totalBusca, paginas: auto.paginas + 1, limite: auto.limite, recargas: auto.recargas, semResultado });
    if (passo.acao === 'recarregar' && portal !== 'quintoandar') {
      // Mesma página de novo, depois de uma pausa: falha de carga ou bloqueio passageiro.
      auto.recargas = (auto.recargas || 0) + 1;
      gravarAuto(auto);
      progressoBusca(auto);
      status(`Página ${pagina} veio ${lidos ? 'repetida' : 'vazia'} com ${auto.vistos.length} de ${auto.totalBusca} lidos: recarregando (${auto.recargas} de ${MAX_RECARGAS})…`);
      await esperar(sortear(PAUSA_RECARGA));
      if (!lerAuto()) return;
      if (alvo && portalDe(new URL(alvo).hostname) === portal && !SEM_PAGINA_NA_URL.includes(portal)) location.href = paginaDaBusca(portal, alvo, pagina);
      else location.reload();
      return;
    }
    if (lidos > 0) auto.paginas += 1;
    auto.recargas = 0;
    progressoBusca(auto);
    // Página em que a rodada parou: a repetição da fila retoma dela, não da primeira.
    auto.parouEm = passo.falha ? pagina : null;
    if (passo.acao !== 'seguir') return concluir(auto, passo.motivo || (lidos ? 'página sem anúncio inédito' : 'página vazia'));
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
    if (portal === 'netimoveis') {
      // O botão troca a lista sem recarregar a página (13/11/2026): espera a página mudar
      // (pag na URL ou primeiro card diferente, até 20 s) e segue a rodada nesta mesma aba.
      const b = botaoProximaNet();
      if (!b) return concluir(auto, 'sem botão "Próxima página"');
      const antes = `${location.href}|${cardsNet()[0]?.querySelector('a[href*="/imovel/"]')?.href || ''}`;
      b.click();
      for (let i = 0; i < 40; i++) {
        await esperar(500);
        if (`${location.href}|${cardsNet()[0]?.querySelector('a[href*="/imovel/"]')?.href || ''}` !== antes) break;
      }
      if (!lerAuto()) return;
      passoAutomatico();
      return;
    }
    location.href = alvo && portalDe(new URL(alvo).hostname) === portal ? paginaDaBusca(portal, alvo, pagina + 1) : proximaPagina(portal, location.href);
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
    if (!fila?.itens?.length) { progresso('fila', null); return; }
    const n = fila.itens.length;
    const atual = fila.itens[fila.i];
    progresso('fila', fila.i / n, `Fila: ${fila.i} de ${n} buscas${atual && fila.ativa ? ` · agora ${rotuloBusca(atual)}` : ''}`);
  }

  function iniciarFila() {
    const texto = el.filaTexto.value;
    gmGravar(CHAVE_FILA_TEXTO, texto);
    const itens = lerItensFila(texto);
    if (!itens.length) { status('A fila está vazia: uma URL de busca do OLX, ZAP, Viva Real, NetImóveis ou QuintoAndar por linha.'); return; }
    const antiga = lerFila();
    if (antiga && antiga.i > 0 && antiga.i < antiga.itens.length && !confirm(`Há uma fila em curso (${antiga.i} de ${antiga.itens.length} buscas). Começar outra do zero?`)) return;
    gravarFila({ itens, i: 0, ativa: true, tentativa: 0, resultados: [], inicio: Date.now() });
    abrirItem();
  }

  function continuarFila() {
    const fila = lerFila();
    if (!fila || fila.i >= fila.itens.length) { status('Não há fila para continuar.'); return; }
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
    gravarFila({ ...fila, abertoEm: Date.now() });
    location.href = urlDeAbertura(fila.itens[fila.i], fila.retomada);
  }

  function iniciarBuscaDaFila() {
    const fila = lerFila();
    iniciouAuto = true;
    const ret = fila.retomada;
    gravarAuto({ limite: LIMITE_FILA, paginas: ret?.paginas || 0, total: 0, fila: true, vistos: ret?.vistos || [], totalBusca: ret?.totalBusca || undefined, rodada: rodadaDe(fila.inicio) });
    if (ret) gravarFila({ ...fila, retomada: null });
    gravarHist([]);
    progressoFila(fila);
    status(`Fila ${fila.i + 1} de ${fila.itens.length}: ${rotuloBusca(fila.itens[fila.i])}…`);
    passoAutomatico();
  }

  async function fimDaBuscaNaFila(auto, motivo) {
    const fila = lerFila();
    const url = fila.itens[fila.i];
    const r = { ...resultadoBusca(url, (auto.vistos || []).length, auto.totalBusca, auto.paginas, motivo, extraDe(auto)), tentativa: fila.tentativa || 0 };
    fila.resultados = [...(fila.resultados || []).filter((x) => x.url !== url), r];
    const cob = r.cobertura == null ? 'sem total' : pctTxt(r.cobertura);
    if (repetirBusca(r, fila.tentativa)) {
      // Parou numa página vazia antes do total: a repetição retoma dessa página, com o que já leu.
      const retomada = auto.parouEm > 1 ? { pagina: auto.parouEm, vistos: auto.vistos || [], totalBusca: auto.totalBusca, paginas: auto.paginas } : null;
      gravarFila({ ...fila, tentativa: 1, retomada });
      mostrar();
      if (!(await esperarContando(sortear(PAUSA_FILA), `${r.rotulo}: ${r.lidos} de ${r.total} (${cob}). Repetindo a busca em`))) return pausada();
      abrirItem();
      return;
    }
    if (kit.baixarCada) baixarDaBusca(auto);
    fila.i++;
    fila.tentativa = 0;
    fila.retomada = null;
    gravarFila(fila);
    mostrar();
    if (fila.i >= fila.itens.length) { encerrarFila(fila); return; }
    if (!(await esperarContando(sortear(PAUSA_FILA), `${r.rotulo}: ${r.lidos} lidos (${cob}). Próxima busca (${fila.i + 1} de ${fila.itens.length}) em`))) return pausada();
    abrirItem();
  }

  // A busca aberta pela fila foi desviada pelo portal (bairro sem resultado, listagem da cidade):
  // nada é lido nem guardado; a busca fica sem coleta no menu e a fila segue para a próxima.
  let desviando = false;
  function buscaDesviada(auto = { vistos: [], totalBusca: null, paginas: 0 }) {
    desviando = true;
    const fila = lerFila();
    let onde = location.pathname;
    try { onde = decodeURIComponent(location.pathname); } catch (e) { /* mantém o caminho cru */ }
    status(`${rotuloBusca(fila.itens[fila.i])}: o portal desviou a busca para ${onde}; nada foi lido.`);
    fimDaBuscaNaFila(auto, `desviada pelo portal para ${onde}`);
  }

  function pausada() {
    const fila = lerFila();
    atualizarBotoes();
    status(`Fila pausada em ${fila?.i ?? 0} de ${fila?.itens?.length ?? 0} buscas. "Continuar" retoma.`, 'alerta');
  }

  function encerrarFila(fila) {
    gravarFila({ ...fila, ativa: false, fim: Date.now() });
    atualizarBotoes();
    progresso('busca', null);
    progressoFila(fila);
    const rs = fila.resultados || [];
    const baixas = rs.filter((r) => r.cobertura != null && r.cobertura < COBERTURA_MIN);
    const desviadas = rs.filter((r) => /^desviada/.test(r.motivo || ''));
    const limpa = !baixas.length && !desviadas.length;
    kit.tocar(limpa);
    // CSV só da rodada; o de tudo continua no botão "CSV".
    if (kit.autobaixar) {
      const rodada = daRodada(carregar(), rodadaDe(fila.inicio));
      baixarCsv(Object.keys(rodada).length ? rodada : carregar(), true);
      setTimeout(() => baixarResumoFila(rs), 1500);
    }
    const cidade = rs.filter((r) => r.bairro_reconhecido === 'não');
    mostrar(`Fila concluída: ${rs.length} buscas, ${rs.reduce((n, r) => n + (r.guardados ?? r.lidos), 0)} anúncios guardados; ${kit.autobaixar ? `CSV da rodada baixado em ${PASTA_DOWNLOAD}/` : 'download automático desligado: baixe o CSV'}.`
      + (cidade.length ? ` Bairro não reconhecido pelo portal (lida a cidade, guardados só os do bairro): ${cidade.map((r) => r.rotulo).join(', ')}.` : '')
      + (baixas.length ? ` Abaixo de ${pctTxt(COBERTURA_MIN)}: ${baixas.map((r) => r.rotulo).join(', ')}.` : '')
      + (desviadas.length ? ` Desviadas pelo portal (sem resultado no bairro, nada lido): ${desviadas.map((r) => r.rotulo).join(', ')}.` : ''), limpa ? 'ok' : 'alerta');
  }

  // ---------- painel (kit dos painéis: _kit_painel/kit_painel.js) ----------
  // Mesmo padrão dos demais coletores: canto superior direito, shadow DOM preso ao <html>,
  // Montserrat, Heroicons outline, roxo como cor primária, explicações em dicas, ação
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
  for (const [velha, nova] of [[CHAVE_POSICAO, 'tcc_aluguel:kit:posicao'], [CHAVE_CADA, 'tcc_aluguel:kit:baixarcada'], [CHAVE_SO_FALTAM, 'tcc_aluguel:kit:soFaltam']]) {
    const v = gmLer(velha, null);
    if (v != null) { if (gmLer(nova, null) == null) gmGravar(nova, v); gmApagar(velha); }
  }

  const kit = kitPainel({ id: 'cal', prefixo: 'tcc_aluguel', ler: gmLer, gravar: (c, v) => (v == null ? gmApagar(c) : gmGravar(c, v)),
    abertos: ['qualidade'], pastaDownload: PASTA_DOWNLOAD });
  const { criar, icone } = kit;
  const el = {};

  // Só o que o kit não traz: grade dos indicadores, lista das buscas guardadas e menu de bairros.
  const CSS_PAINEL = `
    .caixa{background:var(--sup);border-radius:10px;padding:7px 10px;margin:7px 0}
    .grade{display:grid;grid-template-columns:auto 1fr auto 1fr;gap:2px 8px;font-size:12.5px;align-items:center}
    .grade+.grade{margin-top:6px;padding-top:6px;border-top:1px solid var(--sup2)}
    .grade .k{color:var(--suave);display:inline-flex;align-items:center;gap:3px}
    .grade .v{font-variant-numeric:tabular-nums;display:inline-flex;align-items:center;gap:4px;font-weight:500}
    .grade .largo{grid-column:2 / -1}
    .grade .todo{grid-column:1 / -1;display:flex;align-items:center;gap:4px}
    .grade svg,.resumo svg,.rotulo svg,.selo svg{width:14px;height:14px}
    .selo{display:inline-flex;align-items:center;gap:3px}
    .resumo{font-size:12.5px;display:flex;flex-wrap:wrap;align-items:center;gap:3px;margin:7px 0}
    .ok{color:var(--ok)} .alerta{color:var(--alerta)} .ruim{color:var(--erro)}
    .mbarra{display:inline-block;width:64px;height:6px;background:var(--sup2);border-radius:999px;overflow:hidden}
    .mbarra>span{display:block;height:100%;background:currentColor;border-radius:999px}
    ul.buscas{list-style:none;margin:4px 0;padding:0;max-height:30vh;overflow:auto}
    ul.buscas li{display:flex;gap:2px;align-items:center;padding:4px 0;border-bottom:1px solid var(--linha);font-size:12.5px}
    li .corpo{flex:1;min-width:0}
    li .titulo{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    li.atual .titulo{font-weight:600}
    li .meta{font-size:11.5px;color:var(--suave)}
    li .meta.alerta{color:var(--alerta)}
    tr.atual td{font-weight:600}
    th,td{text-align:right} th:first-child,td:first-child{text-align:left}
    input[type=number]{font:inherit;color:inherit;background:var(--sup);border:0;border-radius:8px;padding:5px 6px;width:52px;flex:none}
    input[type=checkbox]{flex:none;margin:0;accent-color:var(--caneta)}
    textarea{white-space:pre;overflow:auto;height:72px}
    details.multi{flex:1 1 100%;border:0;background:var(--sup);border-radius:8px;padding:0 8px}
    details.multi>summary{display:block;font-size:13px;font-weight:500;padding:6px 0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    details.multi input[type=search]{background:var(--fundo)}
    .opcoes{max-height:28vh;overflow:auto;border-top:1px solid var(--sup2);padding:4px 0}
    .opc{display:flex;align-items:center;gap:6px;padding:2px 0;font-size:12.5px;cursor:pointer}
    .opc.fim-destaque{border-bottom:1px solid var(--sup2);padding-bottom:4px;margin-bottom:2px}`;

  // Filhos mistos: texto e nós (ícones), sem vazios
  const partes = (...xs) => xs.filter((x) => x !== '' && x != null && x !== false).map((x) => (typeof x === 'string' ? document.createTextNode(x) : x));

  // tipo: '' (neutro), 'ok', 'alerta' ou 'erro' (pinta o status e o ponto do cabeçalho).
  const status = (t, tipo = '') => kit.status(t, tipo);
  const progresso = (nome, frac, texto = '') => kit.progresso(nome, frac, texto);
  const pctTxt = (x) => (x == null ? '–' : `${Math.round(x * 100)}%`);
  const reais = (v) => (v == null ? '–' : `R$ ${v.toFixed(2).replace('.', ',')}`);
  const doisDig = (n) => String(n).padStart(2, '0');
  const quando = (ms) => { const d = new Date(ms); return `${doisDig(d.getDate())}/${doisDig(d.getMonth() + 1)} ${doisDig(d.getHours())}h${doisDig(d.getMinutes())}`; };
  const diaMes = (iso) => (iso ? iso.split('-').reverse().join('/') : '–');
  // Verde a partir de "bom", âmbar a partir de "medio", vermelho abaixo.
  const nivel = (x, bom = 0.9, medio = 0.6) => (x == null ? '' : x >= bom ? 'ok' : x >= medio ? 'alerta' : 'ruim');
  const NOMES_SUBTIPO = { loja_ponto: 'loja/ponto', sala: 'sala', galpao: 'galpão', predio: 'prédio', outro: 'outro', residencial: 'residencial' };

  // Botão com ícone e nome curto; o nome completo e a explicação vão na dica
  const botao = (ico, rotulo, dica, fn, classe = '') => kit.botao(ico, rotulo, fn, { classe, dica });
  // Selo que liga e desliga (filtros)
  const selo = (rotulo, dica, ligado, aoMudar) => kit.etiqueta(rotulo, aoMudar, { ligada: ligado, dica });
  // Menu suspenso de múltipla escolha: o resumo mostra a escolha; dentro, busca por nome, "Todos" e
  // "Nenhum" (valem para os bairros filtrados) e uma caixa de marcação por opção. Devolve o nó.
  function menuMulti({ opcoes, destaques = [], marcados = [], rotulo, dica, aoMudar }) {
    const escolhidos = new Set(marcados);
    const resumo = criar('summary', { dica });
    const busca = criar('input', { type: 'search', placeholder: 'filtrar…', dica: 'Filtrar a lista pelo nome (sem acento)' });
    const caixas = new Map();
    const itens = opcoes.map((o, i) => {
      const cx = criar('input', { type: 'checkbox', checked: escolhidos.has(o) });
      cx.onchange = () => { if (cx.checked) escolhidos.add(o); else escolhidos.delete(o); mudou(); };
      caixas.set(o, cx);
      const l = criar('label', { className: i === destaques.length - 1 ? 'opc fim-destaque' : 'opc' }, partes(cx, o));
      l.dataset.nome = semAcento(o);
      return l;
    });
    const lista = criar('div', { className: 'opcoes' }, itens);
    const visiveis = () => itens.filter((l) => !l.hidden).map((l) => l.textContent);
    const marcarVisiveis = (v) => { for (const o of visiveis()) { caixas.get(o).checked = v; if (v) escolhidos.add(o); else escolhidos.delete(o); } mudou(); };
    function mudou() {
      const sel = opcoes.filter((o) => escolhidos.has(o)).concat([...escolhidos].filter((o) => !opcoes.includes(o)));
      resumo.textContent = `${rotulo}: ${!sel.length ? 'nenhum' : sel.length <= 2 ? sel.join(', ') : `${sel.slice(0, 2).join(', ')} +${sel.length - 2}`}`;
      aoMudar(sel);
    }
    busca.oninput = () => {
      const q = semAcento(busca.value).trim();
      for (const l of itens) l.hidden = !!q && !l.dataset.nome.includes(q);
    };
    const barraMenu = kit.linha([busca,
      botao('check', '', 'Todos: marca os bairros que aparecem na lista (respeita o filtro)', () => marcarVisiveis(true), 'leve'),
      botao('x-mark', '', 'Nenhum: desmarca os bairros que aparecem na lista (respeita o filtro)', () => marcarVisiveis(false), 'leve')], 'compacta');
    const det = criar('details', { className: 'multi' }, [resumo, barraMenu, lista]);
    mudou();
    return det;
  }
  // Casa da grade: rótulo (k) ou valor (v), com ícone opcional
  const casa = (classe, ...xs) => criar('span', { className: classe }, partes(...xs));
  const aviso = (t) => criar('span', { className: 'alerta', dica: t }, [icone('exclamation-triangle')]);
  const miniBarra = (x) => { const s = criar('span'); s.style.width = `${Math.round(x * 100)}%`; return criar('span', { className: 'mbarra' }, [s]); };
  const vazio = (t) => criar('p', { className: 'vazio', textContent: t });

  // Tabela da fila: uma linha por busca, com lidos, total e cobertura (as que faltam com "–").
  function mostrarFila() {
    if (!el.filaTabela) return;
    const fila = lerFila();
    progressoFila(fila);
    if (!fila?.itens?.length) { el.filaTabela.replaceChildren(vazio('Nenhuma fila rodada ainda.')); return; }
    const porUrl = new Map((fila.resultados || []).map((r) => [r.url, r]));
    const td = (v, classe = '', dica = '') => criar('td', { textContent: String(v), className: classe, dica });
    const linhas = fila.itens.map((url, i) => {
      const r = porUrl.get(url);
      const atual = fila.ativa && i === fila.i;
      const cor = r?.cobertura == null ? '' : r.cobertura >= COBERTURA_MIN ? 'ok' : 'ruim';
      return criar('tr', { className: atual ? 'atual' : '' }, [
        td(`${atual ? '▸ ' : ''}${rotuloBusca(url)}`, '', url),
        td(r ? r.lidos : '–'),
        td(r?.total ?? '–'),
        td(r ? (r.cobertura == null ? 's/ total' : pctTxt(r.cobertura)) : '–', cor, r ? `${r.paginas} pág.; parou por ${r.motivo}${r.tentativa ? '; repetida' : ''}` : ''),
      ]);
    });
    const th = (t, dica) => criar('th', { textContent: t, dica });
    el.filaTabela.replaceChildren(criar('table', {}, [
      criar('thead', {}, [criar('tr', {}, [th('Busca', 'Portal e bairro da busca'), th('Lidos', 'Anúncios distintos lidos na busca'), th('Total', 'Total que o portal diz ter'), th('Cob.', `Cobertura: lidos ÷ total; abaixo de ${pctTxt(COBERTURA_MIN)}, a fila repete a busca uma vez`)])]),
      criar('tbody', {}, linhas),
    ]));
  }

  // A8 do coletor de preços: anúncios guardados desde o último CSV de tudo.
  function mostrarPendentes(dados) {
    const exportado = exportadoEm();
    const pend = pendentes(dados, exportado);
    el.pendentes.className = pend >= AVISO_PENDENTES ? 'selo alerta' : pend ? 'selo' : 'selo ok';
    el.pendentes.replaceChildren(...partes(pend >= AVISO_PENDENTES ? icone('exclamation-triangle') : !pend && exportado ? icone('check') : '',
      pend ? `${pend} fora do CSV` : exportado ? 'CSV em dia' : ''));
    kit.dica(el.pendentes, pend
      ? `${pend} anúncio(s) lidos, em todos os portais, desde o último CSV de tudo${exportado ? ` (${quando(exportado)})` : ' (nenhum baixado ainda)'}`
        + `${pend >= AVISO_PENDENTES ? '. Baixe o CSV: os dados só estão no navegador' : ''}`
      : exportado ? `CSV de tudo baixado em ${quando(exportado)}` : '');
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
        : criar('span', { className: `v largo ${lerAuto() ? '' : nivel(cob, 0.8, 0.5)}`, dica: `${lista.length} de ${total} anúncios que o portal diz ter na busca (${pctTxt(cob)})` },
          partes(`${lista.length}/${total}`, miniBarra(cob))),
      ...(lista.length ? [casa('k', 'Desde'), casa(`v largo${idade > IDADE_MAX ? ' alerta' : ''}`, diaMes(datas[0]), idade > IDADE_MAX && aviso(`Coleta mais antiga desta busca com ${idade} dias: refazer?`))] : []),
    );
    const r = resumoM2(lista.filter((a) => passaFiltros(a, lerFiltros())));
    el.resumo.replaceChildren(...(!r.n ? [casa('todo', icone('tag'), 'Nenhum anúncio de aluguel com área nesta busca.')] : [
      casa('k', icone('tag'), 'Com área'), casa(`v${r.n < MIN_AMOSTRA ? ' alerta' : ''}`, String(r.n)),
      casa('k', 'R$/m²'), criar('b', { className: 'v', textContent: reais(r.mediana) }),
      ...(r.n > 1 ? [casa('k', 'P25'), casa('v', reais(r.p25)), casa('k', 'P75'), casa('v', reais(r.p75))] : []),
      ...(r.n < MIN_AMOSTRA ? [casa('todo alerta', icone('exclamation-triangle'), `faltam ${MIN_AMOSTRA - r.n} para a amostra mínima`)] : []),
    ]));
  }

  // Funil da última página lida, com alerta se há cards sem id (seletor do portal mudou?).
  function mostrarFunil() {
    if (!ultimoFunil) { el.funil.className = 'resumo suave'; el.funil.replaceChildren(...partes(icone('funnel'), ' Página ainda não lida nesta aba.')); kit.dica(el.funil, ''); return; }
    const f = ultimoFunil;
    const semId = f.comId < f.cards;
    el.funil.className = `resumo ${semId ? 'ruim' : f.comArea < f.comId * 0.8 ? 'alerta' : 'ok'}`;
    el.funil.replaceChildren(...partes(icone('funnel'), ` ${f.cards} cards → ${f.comId} com id → ${f.comPreco} com preço → ${f.comArea} com área`,
      semId && ' ', semId && icone('exclamation-triangle'), semId && ' cards sem id'));
    kit.dica(el.funil, `Funil da última página lida${semId ? '. Há cards sem id: o seletor do portal pode ter mudado' : ''}`);
  }

  // Preenchimento dos campos, mistura da busca, prévia do descarte e anúncios no alvo.
  function mostrarQualidade(lista, filtrados, filtros, todos) {
    const q = qualidade(filtrados);
    const campos = CAMPOS_QUALIDADE.flatMap(([c, nome]) => {
      const cor = c === 'condominio_iptu' ? nivel(q.pct[c], 0.6, 0.3) : nivel(q.pct[c]);
      return [casa('k', nome), casa(`v ${cor}`, pctTxt(q.pct[c]))];
    });
    const filtro = Object.values(filtros).some(Boolean);
    kit.dica(el.campos, `Preenchimento de cada campo nos ${filtrados.length} anúncios ${filtro ? 'da busca nos filtros ligados' : 'da busca'}`);
    el.campos.replaceChildren(...(filtro ? [casa('k', icone('adjustments-horizontal'), 'Filtro'), casa('v largo', `${filtrados.length} de ${lista.length}`)] : []), ...campos);

    const m = mistura(lista);
    const d = previaDescarte(filtrados);
    const alvo = noAlvo(todos);
    const linhas = [];
    if (m.n) {
      linhas.push(casa('k', 'Aluguel'), casa('v', pctTxt(m.pctAluguel)), casa('k', 'Venda'), casa(`v${m.pctVenda > 0.1 ? ' ruim' : ''}`, pctTxt(m.pctVenda)));
      linhas.push(casa('k', 'Fora de SSA'), casa(`v largo${m.pctFora > 0.1 ? ' ruim' : ''}`, pctTxt(m.pctFora)));
      const tipos = Object.entries(m.tipos).sort((x, y) => y[1] - x[1]);
      linhas.push(criar('span', { className: 'k', textContent: 'Tipo', dica: 'Tipo estimado pela busca e pelo texto, com as regras do build' }),
        casa('v largo', tipos.map(([t, n]) => `${NOMES_SUBTIPO[t] || t} ${n}`).join(' · ')));
      linhas.push(...m.alertas.map((a) => casa('todo ruim', icone('exclamation-triangle'), a)));
    }
    if (d.aluguel) {
      const nomes = { semArea: 'sem área', preco: 'preço fora de R$ 300 a 100 mil', foraSalvador: 'fora de Salvador', m2: 'R$/m² fora de 3 a 500' };
      const motivos = Object.entries(d.motivos).filter(([, n]) => n).map(([k, n]) => `${n} ${nomes[k]}`).join('; ');
      const frac = d.total / d.aluguel;
      linhas.push(criar('span', { className: 'k', textContent: 'Descarte', dica: 'Prévia do que o build vai descartar entre os anúncios de aluguel' }),
        criar('span', { className: `v largo ${frac > 0.2 ? 'ruim' : frac > 0.05 ? 'alerta' : 'ok'}`, dica: motivos || 'nenhum motivo de descarte' },
          partes(`${d.total} de ${d.aluguel}`, motivos && ` (${motivos})`)));
    }
    el.mistura.replaceChildren(...linhas);

    el.alvo.replaceChildren(
      casa('k', icone('map-pin'), 'No porte'), casa('v largo', `${alvo.porte} de aluguel`),
      ...Object.entries(alvo.porArea).flatMap(([a, n]) => [casa('k', a), casa(`v${n >= MIN_AMOSTRA ? ' ok' : ' alerta'}`, String(n), n >= MIN_AMOSTRA && icone('check'))]),
    );
  }

  function mostrarHist(hist) {
    el.histTitulo.textContent = `Rodada automática (${hist.length} pág.)`;
    if (!hist.length) { el.hist.replaceChildren(vazio('Sem rodada automática nesta aba.')); return; }
    const td = (v) => criar('td', { textContent: String(v) });
    const linhas = hist.map((r) => criar('tr', {
      className: r.lidos === 0 || r.ineditos === 0 ? 'ruim' : r.ineditos < r.lidos / 2 ? 'alerta' : '',
      dica: r.lidos === 0 || r.ineditos === 0 ? 'Nada inédito: a rodada para aqui' : r.ineditos < r.lidos / 2 ? 'Menos da metade inédita: a busca pode estar se repetindo' : '',
    }, [td(r.pagina), td(r.lidos), td(r.ineditos), td(r.novos), td(r.seg)]));
    const th = (t, dica) => criar('th', { textContent: t, dica });
    el.hist.replaceChildren(criar('table', {}, [
      criar('thead', {}, [criar('tr', {}, [th('Pág.', 'Página'), th('Lidos', 'Anúncios lidos na página'), th('Inéd.', 'Inéditos nesta rodada'), th('Novos', 'Novos no navegador'), th('s', 'Segundos na página')])]),
      criar('tbody', {}, linhas),
    ]));
  }

  // Apagar uma busca: baixa antes o CSV dela, tira os anúncios e o registro da coleta
  // (o ✓ do menu), para a busca voltar a faltar.
  function apagarComBackup(busca) {
    const dela = daBusca(carregar(), busca);
    if (Object.keys(dela).length) baixarCsv(dela, true);
    apagarBusca(busca);
    gmGravar(CHAVE_FEITAS, semBusca(gmLer(CHAVE_FEITAS, {}), busca));
    gmGravar(CHAVE_MARCAS, semBusca(gmLer(CHAVE_MARCAS, {}), busca));
    mostrar('Busca apagada (CSV baixado antes); ela volta a faltar no menu.', 'ok');
  }

  // Reiniciar (lixeira): volta o coletor ao zero. Até 13/11/2026 a lixeira só tirava os
  // anúncios do portal aberto: o registro das buscas feitas (✓ do menu, "Próximo" e "só as que
  // faltam"), as marcas à mão, a fila com os resultados, a rodada da aba e os anúncios dos
  // outros portais ficavam, e a coleta seguinte herdava esse histórico. Baixa antes o CSV
  // de tudo; ficam a lista de buscas, a montagem, os filtros e as preferências do painel.
  const CHAVES_COLETA = [CHAVE, CHAVE_FEITAS, CHAVE_MARCAS, CHAVE_FILA, CHAVE_EXPORTACAO, CHAVE_ABRIR, CHAVE_ALVO];
  function reiniciar() {
    const dados = carregar();
    const n = Object.keys(dados).length;
    if (n) baixarCsv(dados, true);
    gravarAuto(null);
    gravarHist([]);
    for (const c of CHAVES_COLETA) gmApagar(c);
    // Sobra das versões anteriores no localStorage deste portal: sem isto, voltaria na próxima carga.
    try { localStorage.removeItem(CHAVE); localStorage.removeItem(CHAVE_EXPORTACAO); } catch (e) { /* sem localStorage */ }
    guardados = {};
    ultimoFunil = null;
    iniciouAuto = false;
    progresso('busca', null);
    progresso('fila', null);
    atualizarBotoes();
    kit.estado('');
    mostrar(n ? `Reiniciado: ${n} anúncios apagados (CSV baixado antes) e histórico de coleta zerado.` : 'Reiniciado: histórico de coleta zerado.', 'ok');
  }

  function mostrarBuscas(buscas, atual) {
    el.buscasTitulo.textContent = `Buscas guardadas (${buscas.length})`;
    const rotulo = (b) => { try { const u = new URL(b); return decodeURIComponent(u.pathname + u.search); } catch (e) { return b; } };
    el.buscas.replaceChildren(...(!buscas.length ? [vazio('Nada guardado neste portal.')] : buscas.map((b) => {
      const velha = diasEntre(b.data, dataLocal()) > IDADE_MAX;
      return criar('li', { className: b.busca === atual ? 'atual' : '' }, [
        criar('div', { className: 'corpo' }, [
          criar('span', { className: 'titulo', textContent: rotulo(b.busca), dica: b.busca }),
          criar('span', { className: `meta${velha ? ' alerta' : ''}`, textContent: `${b.n} anúncios · ${diaMes(b.data)}${b.busca === atual ? ' · esta busca' : ''}`, dica: velha ? `Coletada há mais de ${IDADE_MAX} dias` : '' }),
        ]),
        botao('arrow-down-tray', '', 'Baixar: CSV só desta busca', () => baixarCsv(daBusca(carregar(), b.busca), true), 'leve'),
        kit.botaoPerigo('trash', '', () => apagarComBackup(b.busca), { classe: 'leve', dica: 'Apagar: tira do navegador os anúncios desta busca e o registro da coleta dela (baixa antes o CSV)' }),
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
    rotularAlvos();
  }

  function mostrar(t, tipo = '') {
    atualizarPainel();
    if (t) status(t, tipo);
  }

  const emCurso = () => !!lerFila()?.ativa || !!lerAuto();

  // Trava as ações durante a fila ou a rodada; "Parar" fica sempre disponível.
  function atualizarBotoes() {
    if (!el.bAuto) return;
    const fila = lerFila();
    const naFila = !!fila?.ativa;
    const rodando = naFila || !!lerAuto();
    kit.atualizarAcoes(rodando);
    if (!rodando && kit.el.ponto.classList.contains('rodando')) kit.estado('');
    const podeContinuar = !rodando && !!fila && !fila.fim && fila.i < fila.itens.length;
    el.bContinuar.disabled = !podeContinuar;
    kit.dica(el.bContinuar, podeContinuar ? `Continuar a fila da busca ${fila.i + 1} de ${fila.itens.length} (${rotuloBusca(fila.itens[fila.i])})` : 'Continuar a fila: nada pausado');
    el.filaTexto.disabled = naFila;
    if (el.menu) el.menu.bProx.disabled = rodando;
  }

  // Parar: interrompe a fila (retomável por "Continuar") ou a rodada desta busca.
  function parar() {
    const naFila = !!lerFila()?.ativa;
    pararFila();
    gravarAuto(null);
    atualizarBotoes();
    status(naFila ? 'Fila parada. "Continuar" retoma da busca atual.' : 'Parado.', 'alerta');
  }

  // Menu das buscas (menuAlvos do kit): ✓ coletada, ◐ cobertura abaixo de 95%, ○ falta;
  // escolher uma abre a busca e coleta todas as páginas. Refeito quando a lista da fila muda.
  function criarMenu() {
    const alvos = alvosDaLista();
    const est = (u) => estadoAlvo(u, gmLer(CHAVE_FEITAS, {}) || {}, gmLer(CHAVE_MARCAS, {}) || {}, alvos);
    return kit.menuAlvos({
      itens: () => alvos, id: (u) => u, grupo: (u) => rotuloBusca(u).split(' · ')[0], nome: rotuloBusca, unidade: 'buscas',
      estadoDe: (u) => ({ ok: 'ok', baixa: 'parcial' }[est(u).e] || 'falta'),
      detalhe: (u, e) => { const { r } = est(u); return !r || e === 'falta' ? '' : `${r.lidos}${r.total ? `/${r.total}` : ''}${e === 'parcial' ? `, ${pctTxt(r.cobertura)}` : ''}`; },
      atual: alvoAtual,
      aoEscolher: (url) => {
        if (!url) return;
        if (emCurso()) { rotularAlvos(); status('Espere a rodada em curso terminar (ou pare).', 'alerta'); return; }
        if (est(url).e === 'ok' && !confirm(`${rotuloBusca(url)} já está coletada. Refazer?`)) { rotularAlvos(); return; }
        abrirAlvo(url);
      },
      aoProximo: () => {
        if (emCurso()) { status('Espere a rodada em curso terminar (ou pare).', 'alerta'); return; }
        const prox = proximoAlvo(alvos, alvoAtual(), gmLer(CHAVE_FEITAS, {}) || {}, gmLer(CHAVE_MARCAS, {}) || {});
        if (!prox) { status('Todas as buscas da lista estão coletadas.', 'ok'); return; }
        abrirAlvo(prox);
      },
      aoMarcar: (url) => {
        if (!url) return;
        const col = est(url).e === 'ok';
        gmGravar(CHAVE_MARCAS, { ...(gmLer(CHAVE_MARCAS, {}) || {}), [chaveAlvo(url)]: !col });
        gmGravar(CHAVE_ALVO, url);
        status(col ? `${rotuloBusca(url)} volta a faltar.` : `${rotuloBusca(url)} marcada como coletada.`);
        rotularAlvos();
      },
    });
  }

  function montarPainel() {
    kit.el.status = criar('div', { className: 'status', textContent: '"Fila" coleta as buscas da lista; "Todas", a busca aberta.' });
    el.filaContagem = kit.selo('');
    const contarFila = () => { el.filaContagem.textContent = `${lerItensFila(el.filaTexto.value).length} buscas`; };
    el.filaTexto = criar('textarea', { value: gmLer(CHAVE_FILA_TEXTO, FILA_PADRAO) || FILA_PADRAO, spellcheck: false,
      dica: 'Buscas da fila: uma URL por linha (OLX, ZAP, Viva Real, NetImóveis ou QuintoAndar), já filtrada; linhas com # são ignoradas',
      onchange: () => { gmGravar(CHAVE_FILA_TEXTO, el.filaTexto.value); contarFila(); preencherAlvos(); } });
    contarFila();
    el.menu = criarMenu();
    el.menuCaixa = el.menu.caixa;
    el.filaTabela = criar('div');
    el.bFila = botao('queue-list', 'Fila', 'Coletar a fila: abre cada busca da lista, lê todas as páginas, confere a cobertura (repete uma vez abaixo de 95%) e passa à próxima, em qualquer portal; no fim, toca um som e baixa o CSV da rodada', iniciarFila, 'primario');
    el.bContinuar = botao('play', '', '', continuarFila);
    const bParar = kit.botaoParar(parar);
    kit.dica(bParar, 'Parar: interrompe a fila ("Continuar" retoma da busca atual) ou a rodada desta busca');
    const bPadrao = botao('arrow-path', 'Padrão', `Padrão: volta a lista às buscas do plano em lista_aluguel.js (${montarBuscas(MONTAGEM_PADRAO).urls.length} buscas: ${MONTAGEM_PADRAO.bairros.join(', ')}, a partir de ${MONTAGEM_PADRAO.areaMin} m²)`, () => {
      el.filaTexto.value = FILA_PADRAO;
      el.filaTexto.onchange();
      kit.confirmarBotao(bPadrao);
      status('Lista da fila de volta ao padrão.');
    }, 'mini');
    // Montar buscas: bairros, área e tipos escolhidos viram a lista da fila ("Gerar fila").
    const montagem = { ...MONTAGEM_PADRAO, ...(gmLer(CHAVE_MONTAGEM, {}) || {}) };
    const alternar = (lista, v, ligado) => (ligado ? [...new Set([...(lista || []), v])] : (lista || []).filter((x) => x !== v));
    el.montagemPrevia = criar('span', { className: 'rotulo' });
    const prever = () => {
      gmGravar(CHAVE_MONTAGEM, montagem);
      const r = montarBuscas(montagem);
      el.montagemPrevia.replaceChildren(...partes(r.semBusca.length ? icone('exclamation-triangle') : '', `${r.urls.length} buscas em ${r.bairros.length} bairro(s)`));
      el.montagemPrevia.className = r.semBusca.length ? 'rotulo alerta' : 'rotulo';
      kit.dica(el.montagemPrevia, r.semBusca.length ? `Sem busca no portal (ficam de fora): ${r.semBusca.join('; ')}` : 'Buscas que "Gerar fila" põe na lista');
    };
    const seloLista = (campo, valor, rotulo, dica) => selo(rotulo, dica, (montagem[campo] || []).includes(valor), (v) => { montagem[campo] = alternar(montagem[campo], valor, v); prever(); });
    const menuBairros = menuMulti({
      opcoes: BAIRROS_MENU, destaques: BAIRROS_DESTAQUE, marcados: montagem.bairros || [],
      rotulo: 'Bairros', dica: 'Bairros de Salvador para montar as buscas: marque um ou mais; os 11 primeiros (10 bairros) são os de maior renda, os demais seguem em ordem alfabética',
      aoMudar: (lista) => { montagem.bairros = lista; prever(); },
    });
    const outros = criar('input', { type: 'text', value: montagem.outros || '', placeholder: 'outros bairros (vírgula)',
      dica: 'Outros bairros de Salvador, separados por vírgula, como o portal escreve na URL (ex.: Caminho das Árvores, Stiep)',
      oninput: () => { montagem.outros = outros.value; prever(); } });
    const campoArea = (campo, dica) => criar('input', { type: 'number', min: 0, step: 10, value: montagem[campo] ?? '', placeholder: '–', dica,
      oninput: (e) => { montagem[campo] = numeroOuNulo(e.target.value); prever(); } });
    const areaMin = campoArea('areaMin', 'Área mínima em m² (vazio: sem mínimo)');
    const areaMax = campoArea('areaMax', 'Área máxima em m² (vazio: sem máximo; menor que a mínima é ignorada)');
    const selosTipo = Object.entries(TIPOS_BUSCA).map(([k, t]) => seloLista('tipos', k, t.rotulo, t.dica));
    const selosPortal = PORTAIS_BUSCA.map((p) => seloLista('portais', p, NOMES_PORTAL[p], `Montar buscas no ${NOMES_PORTAL[p]}`));
    el.bGerar = botao('magnifying-glass', 'Gerar fila', 'Gerar fila: troca a lista da fila pelas buscas montadas aqui (cada portal × bairro × tipo, com a área escolhida); depois, "Fila" coleta', () => {
      const r = montarBuscas(montagem);
      if (!r.urls.length) { status('Nada a buscar: escolha ao menos um bairro, um tipo e um portal que tenha esse tipo.', 'alerta'); return; }
      el.filaTexto.value = r.urls.join('\n');
      el.filaTexto.onchange();
      mostrarFila();
      kit.confirmarBotao(el.bGerar);
      status(`Fila montada com ${r.urls.length} buscas${r.semBusca.length ? `; sem busca no portal: ${r.semBusca.join(', ')}` : ''}. Clique em "Fila" para coletar.`);
    }, 'mini');
    prever();
    const rotuloIco = (ico, dica) => criar('span', { className: 'rotulo', dica }, [icone(ico)]);
    const rotuloTxt = (t, dica = '') => criar('span', { className: 'rotulo', textContent: t, dica });

    el.pendentes = kit.selo('');
    el.limite = criar('input', { type: 'number', min: 1, value: 50, dica: 'Limite de páginas da rodada automática' });
    el.bPagina = botao('document-text', 'Página', 'Coletar esta página: lê e guarda só os anúncios desta página', async () => {
      el.bPagina.disabled = true;
      status('Lendo a página…');
      const { lidos, novos, gravou } = await coletarPagina();
      el.bPagina.disabled = false;
      if (!gravou) { avisarCheio(); return; }
      kit.confirmarBotao(el.bPagina);
      mostrar(`${lidos} lidos, ${novos} novos.`, 'ok');
    }, 'mini');
    el.bAuto = botao('forward', 'Todas', 'Coletar todas as páginas desta busca: lê esta página e segue para as próximas até uma página vazia, sem anúncio inédito, o total da busca ou o limite; no fim, toca um som e baixa o CSV', () => {
      gravarAuto({ rodada: rodadaDe(Date.now()), limite: Math.max(1, parseInt(el.limite.value, 10) || 50), paginas: 0, total: 0, alvo: alvoAtual() && chaveBusca(alvoAtual()) === chaveBusca(location.href) ? alvoAtual() : buscaBase(portal, location.href) });
      gravarHist([]);
      passoAutomatico();
    }, 'mini');
    const bCsv = botao('arrow-down-tray', 'CSV', `Baixar CSV de tudo: um arquivo com todos os anúncios guardados, de todos os portais, em ${PASTA_DOWNLOAD}/`, () => { baixarCsv(); kit.confirmarBotao(bCsv); mostrar('CSV de tudo baixado.', 'ok'); }, 'mini');
    const bLimpar = kit.botaoPerigo('trash', '', reiniciar, { classe: 'leve',
      dica: 'Reiniciar: apaga os anúncios guardados (de todos os portais) e o histórico de coleta (✓ do menu, marcas, fila e rodada). Baixa antes o CSV de tudo. Ficam a lista de buscas e as preferências' });

    el.geral = criar('div', { className: 'grade' });
    el.resumo = criar('div', { className: 'grade', dica: 'R$/m² pedido (aluguel ÷ área) dos anúncios de aluguel com área desta busca, nos filtros ligados' });
    el.funil = criar('div', { className: 'resumo' });
    el.campos = criar('div', { className: 'grade' });
    el.mistura = criar('div', { className: 'grade' });
    el.alvo = criar('div', { className: 'grade', dica: `Anúncios de aluguel deste portal no porte do plano (${PORTE_MIN} a ${PORTE_MAX} m²) e, entre as lojas e pontos no porte, por área do 6.4; ✓ a partir de ${MIN_AMOSTRA}` });
    el.hist = criar('div');
    el.histTitulo = criar('span');
    el.buscas = criar('ul', { className: 'buscas' });
    el.buscasTitulo = criar('span');

    // Filtros: só mudam os indicadores da busca e o destaque dos cards; o CSV sai completo.
    const FILTRO = {
      soAluguel: ['aluguel', 'Só aluguel: deixa de fora os anúncios de venda'],
      soComercial: ['comercial', 'Só comercial: pela busca ou, sem ela, pelo texto do anúncio (regras do build)'],
      soLoja: ['loja/ponto', 'Só loja ou ponto comercial (sem sala, galpão e prédio)'],
      soAreas: ['áreas do 6.4', 'Só as áreas do 6.4: Pituba/Itaigara, Barra/Graça e Rio Vermelho'],
    };
    const selos = Object.entries(FILTRO).map(([k, [nome, dica]]) => selo(nome, `${dica}. Muda só os indicadores e o destaque dos cards; o CSV sai completo`, !!lerFiltros()[k],
      (v) => { gravarFiltros({ ...lerFiltros(), [k]: v }); atualizarPainel(); }));

    kit.acoes = [el.bFila, el.bAuto, el.bPagina, el.bGerar, bPadrao, bLimpar];
    kit.montar({
      nome: `Aluguel · ${NOMES_PORTAL[portal] || portal}`,
      largura: 360,
      autobaixar: true,
      css: CSS_PAINEL,
      extras: [kit.botaoBaixarCada('Baixar cada busca ao terminar (fila): além do CSV da rodada no fim')],
      filhos: [
        el.menuCaixa,
        kit.linha([el.bFila, el.bContinuar, bParar]),
        kit.barra('fila'),
        kit.barra('busca'),
        kit.el.status,
        kit.linha([el.bAuto, el.bPagina, kit.esp(), rotuloTxt('máx.', 'Limite de páginas da rodada automática'), el.limite], 'compacta'),
        kit.linha([bCsv, el.pendentes, kit.esp(), bLimpar]),
        criar('div', { className: 'caixa' }, [el.geral, el.resumo]),
        el.funil,
        criar('div', { className: 'tags' }, [rotuloIco('adjustments-horizontal', 'Filtros dos indicadores'), ...selos]),
        kit.secao('qualidade', 'Qualidade da busca', [criar('div', { className: 'caixa' }, [el.campos, el.mistura, el.alvo])]),
        kit.secao('montar', 'Montar buscas', [
          kit.linha([rotuloIco('map-pin', 'Bairros'), menuBairros, outros]),
          kit.linha([rotuloIco('adjustments-horizontal', 'Área em m²'), rotuloTxt('de'), areaMin, rotuloTxt('a'), areaMax, rotuloTxt('m²')]),
          criar('div', { className: 'tags' }, [rotuloIco('tag', 'Tipo de imóvel comercial'), ...selosTipo]),
          criar('div', { className: 'tags' }, [rotuloIco('funnel', 'Portais'), ...selosPortal]),
          kit.linha([el.bGerar, el.montagemPrevia]),
        ]),
        kit.secao('fila', ['Buscas da fila', el.filaContagem], [el.filaTexto, kit.linha([bPadrao]), el.filaTabela]),
        kit.secao('hist', [el.histTitulo], [el.hist]),
        kit.secao('buscas', [el.buscasTitulo], [el.buscas]),
      ],
    });
    atualizarBotoes();
    mostrar();
  }

  const alvosDaLista = () => lerItensFila(el.filaTexto ? el.filaTexto.value : (gmLer(CHAVE_FILA_TEXTO, FILA_PADRAO) || FILA_PADRAO));
  // Busca atual do menu: a aberta (se está na lista) ou a última escolhida.
  function alvoAtual() {
    const alvos = alvosDaLista();
    const aberta = alvos.find((u) => chaveAlvo(u) === chaveAlvo(buscaBase(portal, location.href)))
      || alvos.find((u) => chaveBusca(u) === chaveBusca(location.href));
    const salvo = gmLer(CHAVE_ALVO, '');
    return aberta || (alvos.includes(salvo) ? salvo : alvos[0] || '');
  }

  function abrirAlvo(url) {
    gmGravar(CHAVE_ALVO, url);
    gmGravar(CHAVE_ABRIR, { url, em: Date.now() });
    status(`Abrindo ${rotuloBusca(url)}…`);
    location.href = url;
  }

  // A lista da fila mudou: o menu é refeito com as buscas novas.
  function preencherAlvos() {
    if (!el.menuCaixa) return;
    const m = criarMenu();
    el.menuCaixa.replaceWith(m.caixa);
    el.menu = m;
    el.menuCaixa = m.caixa;
    rotularAlvos();
    atualizarBotoes();
  }

  function rotularAlvos() {
    if (el.menu) el.menu.rotular();
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
    const pedido = gmLer(CHAVE_ABRIR, null);
    const pedidoAqui = !!pedido && Date.now() - pedido.em < 2 * 60 * 1000 && chaveBusca(pedido.url) === chaveBusca(location.href);
    const desviada = !!fila?.ativa && !filaAqui && !desviando && !iniciouAuto && !contando && !lerAuto()
      && Date.now() - (fila.abertoEm || 0) < 2 * 60 * 1000 && redirecionada(fila.itens[fila.i], location.href);
    const desafio = (!!lerAuto() || filaAqui) && desafioCloudflare() && lerPagina(portal).length === 0;
    if (!ehBusca) {
      ehBusca = lerPagina(portal).length > 0 || desafio || filaAqui || pedidoAqui || !!fila?.ativa || PAGINA_IMOVEIS.test(location.pathname)
        || (!!lerAuto() && ++tentativas > 13);
      if (!ehBusca) return;
      console.info(NOME, 'painel montado');
    }
    if (!kit.hospedeiro()) montarPainel();
    kit.garantir();
    if (desafio) { status('Bloqueio do Cloudflare: resolva o desafio na página; a coleta retoma desta página.', 'alerta'); return; }
    if (desviada) { buscaDesviada(); return; }
    if (!iniciouAuto && lerAuto()) { iniciouAuto = true; passoAutomatico(); return; }
    if (filaAqui && !iniciouAuto && !contando && !lerAuto()) { iniciarBuscaDaFila(); return; }
    // Busca escolhida no menu (ou por "Próximo"): coleta todas as páginas sozinha.
    if (pedidoAqui && !fila?.ativa && !iniciouAuto && !lerAuto()) {
      gmGravar(CHAVE_ABRIR, null);
      iniciouAuto = true;
      gravarAuto({ limite: Math.max(1, parseInt(el.limite.value, 10) || 50), paginas: 0, total: 0, alvo: pedido.url, rodada: rodadaDe(Date.now()) });
      gravarHist([]);
      status(`${rotuloBusca(pedido.url)}: coletando todas as páginas…`);
      passoAutomatico();
    }
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
