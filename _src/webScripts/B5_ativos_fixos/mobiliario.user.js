// ==UserScript==
// @name         Coletor de preços dos itens (TCC Luderia)
// @namespace    tcc-luderia
// @version      2026.11.13-3
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
// @grant        GM_download
// @require      lista_mobiliario.js
// ==/UserScript==

/*
 * Uso pessoal, para o Bloco B5 (ativos fixos): preço de mobiliário, cozinha e bar, caixa e
 * informática e dos itens da reforma sem composição no SINAPI (premissas I01 a I04 do cap. 9).
 * Os sites bloqueiam requisições fora do navegador, por isso a coleta roda na página.
 *
 * Os botões do painel trazem ícone (Heroicons) e nome curto; o nome completo ("Guardar marcadas", "Ler
 * ofertas"...) e a explicação ficam na dica ao passar o mouse. Os filtros são selos que ligam e
 * desligam.
 *
 * Como usar:
 *  1. Informar o CEP de Salvador usado no site (o frete depende dele) e escolher o item no
 *     painel (a lista vem de "[B5] Lista de Itens da Etapa 1", só os de fonte "coleta").
 *     "Buscar aqui" abre a busca do site com o termo do item. No seletor, os itens vêm em grupos
 *     por categoria: os que já têm oferta guardada esmaecidos (✓ e o número de ofertas), os que
 *     faltam com ○ na cor da categoria (com 1 ou 2 ofertas, ◐ em âmbar). "Só os que faltam" esconde
 *     os completos; "Próximo que falta" pula para o próximo item abaixo do mínimo (primeiro na
 *     mesma categoria) e abre a busca dele. "Pular" marca o item cuja busca não trouxe o item pensado: ele sai do
 *     "Próximo" e de "só os que faltam" e não deixa guardar, até "Retomar" (no próprio item). Com 25+ ofertas fora de CSV, o painel cobra o download
 *     e o navegador pede confirmação ao fechar a aba.
 *  2. A página é lida sozinha ao abrir, ao trocar de página e ao trocar de item ("Ler ofertas"
 *     relê à mão, ex.: depois de rolar): o painel lista as ofertas com preço, frete e tipo de preço; já
 *     vêm marcadas as que têm no título metade ou mais das palavras do termo, todas as
 *     palavras exigidas do item e nenhuma excluída, e que não são patrocinadas, combo com
 *     acessório ("+ 30 bobinas") nem variante de cor ou voltagem de outra da lista. Desmarcar
 *     o que não é o item (outro tamanho, peça avulsa, acessório).
 *     "Somar" abre a próxima página da busca e soma as ofertas dela às já lidas (sem próxima
 *     página, soma as que carregaram ao rolar).
 *  3. Se o anúncio vende em caixa, jogo ou kit (pratos, copos), as unidades vêm do título
 *     ("caixa com 24", "(2 un.)") no campo de cada linha, que se pode corrigir; sem elas, vale
 *     "Unidades por embalagem". O preço guardado é o da unidade da lista.
 *  4. "Guardar marcadas". Repetir em outros sites e itens; os dados ficam no Tampermonkey
 *     (comuns a todos os sites). "Guardadas deste item" lista as ofertas do item, com um X para
 *     excluir uma: a exclusão vai no CSV (excluida = 1) e o build a respeita.
 *  5. "Baixar CSV": um arquivo por categoria, AAAA-MM-DD_HHmm_<categoria>_precos.csv, com
 *     tudo o que está guardado, para dados/B5_reforma/_dados-brutos/ (obra_reforma) ou
 *     dados/B5_mobiliario/_dados-brutos/ (as demais categorias).
 *     Depois, rodar build/B5b_orcamento_itens.py, que junta os arquivos e fica, para cada
 *     item e URL, com a linha do arquivo mais recente. "Limpar" baixa antes um backup JSON.
 *  Em página de produto, a leitura pega o produto pelo JSON-LD (schema.org Product).
 *  A cada "Guardar", o painel revisa as guardadas de todos os itens e exclui as que não passam
 *  nas regras do item e nos filtros ligados (sem a faixa de preço e as avaliações); o filtro
 *  desligado ao guardar uma oferta não vale para ela. A lista do que saiu fica na dica do status.
 *
 * Leitura por site:
 *  - Amazon: cards [data-component-type="s-search-result"] (preço em .a-price .a-offscreen,
 *    sem o riscado; frete em "Entrega R$ X" ou "GRÁTIS"; link canônico /dp/<ASIN>). O preço
 *    do card costuma ser o do Pix ("à vista no Pix ou NuPay"): tipo_preco = pix, e o preço
 *    cinza ao lado, sem o desconto, vai em preco_sem_pix.
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
 * frete; preco_anuncio; unidades; tipo_preco (padrao, pix ou cupom); preco_sem_pix (Amazon,
 * por unidade); cep; avaliacoes (só Amazon); leitor (proprio, jsonld ou generico); url; busca;
 * data_coleta; motivo (filtros que a oferta não passou e que o autor marcou à mão; o build
 * deixa de fora); excluida (0 ou 1). preco = preco_anuncio ÷ unidades.
 *
 * Filtros da marcação inicial (desligáveis no painel; cada oferta desmarcada mostra o motivo):
 * faixa de preço (fora de 0,3× a 3× a mediana do que já está guardado do item), medida (o
 * título traz a mesma grandeza do termo com outro valor: "12000 btus" para "30000 btus", com
 * folga de 10% a 20% nas grandezas contínuas; comprimento em cm, comparado também às
 * dimensões "25x25" do título) e sem avaliações (card da Amazon sem nenhuma). As regras do
 * item (termo_exige e termo_exclui da lista) não se desligam. "Só preço padrão" desmarca Pix
 * e cupom.
 * Atestados: funil da leitura (cards → com preço → sem patrocinado → no termo → nos filtros)
 * e leitor usado; cobertura da categoria; quartis e dispersão P75/P25 do item (alerta acima
 * de 3×); coleta mais antiga (alerta acima de 30 dias); ofertas mudadas desde o último CSV.
 */

(function () {
  'use strict';

  const NOME = '[Preços]';
  const CHAVE = 'tcc_precos_v1';
  const CHAVE_ITEM = 'tcc_precos_item';
  const CHAVE_CEP = 'tcc_precos_cep';
  const CHAVE_FILTROS = 'tcc_precos_filtros';
  const CHAVE_EXPORTACAO = 'tcc_precos_exportado_em';
  const CHAVE_SO_FALTAM = 'tcc_precos_so_faltam';
  const CHAVE_PULADOS = 'tcc_precos_pulados'; // { id_item: data em que foi pulado }
  // Buscas feitas por item e site, com ou sem oferta guardada (desde 2026.11.13-2): sem elas o CSV
  // não distinguia "não buscado" de "buscado sem oferta" (OB42 e MO06 sem linha em 03/11).
  const CHAVE_BUSCAS = 'tcc_precos_buscas'; // { 'id|site': { id_item, site, busca, data_coleta, paginas, lidas, nos_filtros } }
  const CHAVE_COLETADOS = 'tcc_precos_coletados'; // { site: { id_item: true (coletado) | false (desfeito) } }
  const AVISO_PENDENTES = 25; // guardadas ou excluídas fora de CSV a partir das quais o painel cobra o download
  const MIN_OFERTAS = 3; // o build usa P25, mediana e P75: abaixo disso o item fica frágil
  const POR_SITE = 5; // critério da coleta: os 5 primeiros anúncios da busca, na ordem do site, que passam nos filtros
  const FAIXA = [0.3, 3]; // F2: oferta fora de 0,3× a 3× a mediana do item fica desmarcada
  const DISPERSAO_MAX = 3; // A4: P75/P25 acima disso sugere produtos diferentes no mesmo item
  const IDADE_MAX = 30; // A7: dias até a coleta mais antiga do item pedir revisão
  const FILTROS_PADRAO = { faixa: true, medida: true, avaliacoes: true };

  const lista = (s) => String(s || '').split('|').map((p) => p.trim()).filter(Boolean);

  // A lista vem de lista_mobiliario.js, lida pelo carregador (@require) antes deste arquivo.
  if (typeof LISTA_MOBILIARIO === 'undefined') {
    const msg = '[Coletor de preços do mobiliário] lista_mobiliario.js não foi carregada: reinstale o carregador (python3 _src/outros/G5_outros/gerar_carregadores.py --abrir).';
    console.error(msg);
    if (typeof alert === 'function') alert(msg);
    return;
  }
  // Itens do menu em lista_mobiliario.js (pasta deste script).
  const ITENS = LISTA_MOBILIARIO.map(([id, categoria, item, termo, exige, exclui]) => ({ id, categoria, item, termo, exige: lista(exige), exclui: lista(exclui) }));

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

  // Palavras comparáveis: sem acento, milhar sem ponto ("30.000" -> "30000"), decimal com ponto
  // ("2,4L" -> "2.4 l"), medida junta ("160 x 90" e "160cm x 90cm" -> "160x90") e número
  // separado da unidade ("513L" -> "513 l", "70cm" -> "70 cm").
  function palavras(t) {
    return semAcento(t)
      .replace(/(\d)\.(\d{3})\b/g, '$1$2')
      .replace(/(\d),(\d)/g, '$1.$2')
      .replace(/(\d)\s*(?:mm|cm|m)?\s*x\s*(?=\d)/g, '$1x')
      .replace(/(\d)(?!x\d)([a-z]+)/g, '$1 $2')
      .split(/[^a-z0-9.]+/)
      .map((w) => w.replace(/^\.+|\.+$/g, ''))
      .filter(Boolean);
  }

  // A frase aparece no título em palavras inteiras. Exigida: a última palavra aceita sufixo
  // ("2 cuba" casa com "2 cubas", "industria" com "industrial"). Excluída: só o plural em "s",
  // para "capa" não casar com "capacidade" nem "mini" com "minimalista".
  function temFrase(tituloNorm, frase, exata = false) {
    const f = palavras(frase).join(' ').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return f !== '' && new RegExp(`(^| )${f}${exata ? 's?(?= |$)' : ''}`).test(tituloNorm);
  }

  // Regras do item (termo_exige e termo_exclui): falta uma exigida (nenhuma das alternativas
  // "a/b" no título) ou aparece uma excluída. Devolve os motivos.
  function motivosRegras(titulo, regras = {}) {
    const t = palavras(titulo).join(' ');
    const m = [];
    for (const e of regras.exige || []) if (!e.split('/').some((alt) => temFrase(t, alt))) m.push(`falta: ${e}`);
    const fora = (regras.exclui || []).filter((e) => temFrase(t, e, true));
    if (fora.length) m.push(`excluída: ${fora.join(', ')}`);
    return m;
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

  // Unidade de medida normalizada ("litros" -> "l", "BTUs" -> "btu", "bocas" -> "boca").
  const UNIDADES = { l: 'l', litro: 'l', litros: 'l', ml: 'ml', btu: 'btu', btus: 'btu', cm: 'cm', mm: 'mm', m: 'm',
    boca: 'boca', bocas: 'boca', porta: 'porta', portas: 'porta', prateleira: 'prateleira', prateleiras: 'prateleira',
    cuba: 'cuba', cubas: 'cuba', tampa: 'tampa', tampas: 'tampa', gb: 'gb', tb: 'tb', w: 'w', kg: 'kg', polegadas: 'pol', pol: 'pol',
    lugar: 'lugar', lugares: 'lugar', cameras: 'camera', camera: 'camera', canais: 'canal', canal: 'canal' };

  // Comprimentos vão para cm ("1,5 m" e "1500 mm" -> 150 cm); "80 mm" vira 8 cm nos dois lados.
  const PARA_CM = { mm: 0.1, cm: 1, m: 100 };
  // Folga da comparação por grandeza (o termo é aproximado: "cerca de 400 L"); contagens
  // (bocas, portas, cubas) e as demais são exatas.
  const FOLGA = { cm: 0.15, l: 0.15, ml: 0.2, btu: 0.1, w: 0.15, kg: 0.15 };
  const FOLGA_DIM = 0.15;

  // Medidas de um texto: pares número + unidade ("30000 btu") e dimensões ("160x90", em ordem crescente).
  function medidas(t) {
    const ps = palavras(t);
    const pares = {};
    ps.forEach((p, i) => {
      let u = UNIDADES[ps[i + 1]];
      if (!/^\d+(\.\d+)?$/.test(p) || !u) return;
      let v = Number(p);
      if (PARA_CM[u]) { v = Math.round(v * PARA_CM[u] * 10) / 10; u = 'cm'; }
      (pares[u] ||= new Set()).add(v);
    });
    const dims = new Set(ps.filter((p) => /^\d+(x\d+)+$/.test(p)).map((p) => p.split('x').map(Number).sort((a, b) => a - b).join('x')));
    return { pares, dims };
  }

  const perto = (v, ref, folga) => Math.abs(v - ref) <= folga * ref;
  const fmtMedida = (vs) => [...vs].map((v) => String(v).replace('.', ',')).join('/');

  // Cada lado da dimensão do termo tem um lado próximo no título ("160x80" casa com "80x160x75").
  const dimCasa = (dt, dTitulo) => {
    const ladosTitulo = dTitulo.split('x').map(Number);
    return dt.split('x').map(Number).every((l) => ladosTitulo.some((x) => perto(x, l, FOLGA_DIM)));
  };

  // F3: o título traz a mesma grandeza do termo com outro valor (e não traz o do termo, com a
  // folga da grandeza). Comprimento do termo ("70 cm") também se compara às dimensões do título
  // ("25x25"). Devolve o motivo ("12000 btu, termo 30000 btu") ou ''.
  function medidaConflita(titulo, termo) {
    const mt = medidas(termo);
    const mo = medidas(titulo);
    for (const [u, valores] of Object.entries(mt.pares)) {
      const doTitulo = new Set(mo.pares[u] || []);
      if (u === 'cm') for (const d of mo.dims) d.split('x').forEach((l) => doTitulo.add(Number(l)));
      const casa = (v) => [...valores].some((ref) => perto(v, ref, FOLGA[u] || 0));
      if (doTitulo.size && ![...doTitulo].some(casa)) return `${fmtMedida(doTitulo)} ${u}, termo ${fmtMedida(valores)} ${u}`;
    }
    if (mt.dims.size && mo.dims.size && ![...mt.dims].some((d) => [...mo.dims].some((dt) => dimCasa(d, dt)))) return `${[...mo.dims].join('/')}, termo ${[...mt.dims].join('/')}`;
    return '';
  }

  // Kit ou combo no título. Unidades: "(2 un.)", "caixa com 24", "kit com 4 cadeiras", "12
  // pratos" (a palavra é a principal do termo: a primeira com 4 letras ou mais), "2 peças
  // luminária" e o pacote da variante da Amazon, "(4, Preto)". Combo: o kit ou o "+" traz algo
  // fora do termo ("+ 30 bobinas", "kit com 2 bobinas"); conexões ("USB + LAN") não contam.
  // Palavra do termo que não é a principal ("kit 4 câmeras") é a especificação. "Nº 50" é
  // tamanho, não unidade. Lista de opções ("3/6/12/24 unid.", "24, 48 ou 72 peças") devolve
  // { ambiguo }: o preço é de uma delas. Termo em pares ("12 pares"): o menor número entre as
  // peças do par ("12 garfos e 12 facas" = 12).
  const CONEXOES = new Set(['usb', 'lan', 'wifi', 'wi', 'bluetooth', 'ethernet', 'serial', 'rede', 'hdmi', 'nfc', 'pix', 'debito', 'credito', 'chip', 'mais']);
  function kitDe(titulo, termo) {
    // "Nº 50" é tamanho; "Wi-Fi 6", "USB 3" e afins são especificação, não unidades
    const t = palavras(titulo).join(' ').replace(/(^| )(?:n|nro|numero|fi|wifi|usb|ax|ac|bluetooth|hdmi) \d+(?= |$)/g, ' ');
    const doTermo = palavras(termo).filter((p) => p.length >= 3 && !/\d/.test(p));
    const principal = doTermo.find((p) => p.length >= 4) || '';
    const casa = (w, p) => w.startsWith(p) || p.startsWith(w.replace(/e?s$/, ''));
    const papel = (w) => (!w || (principal && casa(w, principal)) ? 'item' : doTermo.some((p) => casa(w, p)) ? 'spec' : 'fora');
    const mais = String(titulo || '').match(/\+\s*(?:\d+\s*)?([A-Za-zÀ-ú]{3,})/);
    if (mais && !CONEXOES.has(semAcento(mais[1])) && papel(semAcento(mais[1])) === 'fora') return { combo: semAcento(mais[1]) };
    // lista de opções: números separados por "/" ou "ou" antes de un./peças ("430, 36 peças" não)
    const opcoes = semAcento(String(titulo || '')).match(/(\d+(?:(?:\s*(?:\/|,|\bou\b|\be\b)\s*|\s+)\d+)+)\s*(?:un|unid|unidades?|pecas?|pcs)\b/i);
    if (opcoes && /\/|\bou\b/.test(opcoes[1])) return { ambiguo: opcoes[1].split(/(?:\s*(?:\/|,|\bou\b|\be\b)\s*|\s+)/).join('/') };
    if (/(^| )pares?( |$)/.test(palavras(termo).join(' '))) {
      const menor = {};
      for (const p of doTermo.filter((w) => w.length >= 4 && w !== 'pares')) {
        for (const m of t.matchAll(new RegExp(`(?:^| )(\\d+) ${p.slice(0, 4)}[a-z]*(?= |$)`, 'g'))) menor[p] = Math.min(menor[p] ?? Infinity, Number(m[1]));
      }
      const ns = Object.values(menor);
      if (ns.length >= 2) return Math.min(...ns) > 1 ? { unidades: Math.min(...ns) } : {};
      const pares = t.match(/(?:^| )(\d+) pares(?= |$)/);
      if (pares) return { unidades: Number(pares[1]) };
    }
    // pacote da variante: "(4, Preto)"; voltagem ("(110, Cinza)") não é pacote
    const pacote = String(titulo || '').match(/\((\d+)\s*,[^)]*\)\s*$/);
    if (pacote && Number(pacote[1]) > 1 && Number(pacote[1]) <= 50) return { unidades: Number(pacote[1]) };
    const pecas = principal && t.match(new RegExp(`(?:^| )(\\d+) (?:pecas?|pcs) ${principal.slice(0, 4)}`));
    if (pecas && Number(pecas[1]) > 1) return { unidades: Number(pecas[1]) };
    const kit = t.match(/(?:^| )(?:kit|caixa|jogo|conjunto|pack|cx)(?: (?:com|c))? (\d+)(?: ([a-z]+))?/);
    if (kit) {
      const w = /^(un|unid|unidades?|pecas?|pcs?)$/.test(kit[2] || '') ? '' : kit[2];
      const p = papel(w);
      if (p === 'fora') return { combo: w };
      if (p === 'item' && Number(kit[1]) > 1) return { unidades: Number(kit[1]) };
      if (p === 'spec') return {};
    }
    const un = t.match(/(?:^| )(\d+) (?:un|unid|unidades?)(?= |$)/);
    if (un && Number(un[1]) > 1) return { unidades: Number(un[1]) };
    const n = principal && t.match(new RegExp(`(?:^| )(\\d+) (${principal.slice(0, 4)}[a-z]*)(?= |$)`));
    if (n && Number(n[1]) > 1 && papel(n[2]) === 'item') return { unidades: Number(n[1]) };
    return {};
  }

  // Variantes de cor ou voltagem: mesmo título sem cor nem voltagem e mesmo preço. A primeira
  // fica; as demais recebem varianteDe (título da primeira). Devolve as ofertas anotadas.
  const CORES = new Set(['preto', 'preta', 'branco', 'branca', 'cinza', 'azul', 'amarelo', 'amarela', 'vermelho', 'vermelha', 'verde', 'rosa', 'prata', 'dourado', 'dourada', 'marrom', 'bege', 'grafite', 'cor', 'cores',
    'off', 'white', 'offwhite', 'bronze', 'mel', 'natural', 'nature', 'amadeirado', 'prateado', 'prateada']);
  function chaveVariante(o) {
    const t = palavras(o.produto).join(' ')
      .replace(/(^| )(110|127|220)v?( v| volts?)?(?= |$)/g, ' ')
      .replace(/(^| )(bivolt|monofasico|volts?)(?= |$)/g, ' ');
    return t.split(' ').filter((w) => w && !CORES.has(w)).join(' ') + '|' + Math.round(o.preco || 0);
  }
  function marcarVariantes(ofertas) {
    const primeira = new Map();
    return ofertas.map((o) => {
      const k = chaveVariante(o);
      const p = primeira.get(k);
      if (!p) { primeira.set(k, o); const { varianteDe, ...resto } = o; return resto; }
      return { ...o, varianteDe: p.produto };
    });
  }

  // Motivos para uma oferta lida não vir marcada, na ordem do funil: patrocinado, termo, regras
  // do item (falta uma exigida, tem uma excluída), combo com acessório, variante de cor ou
  // voltagem e os filtros ligados (F2 faixa de preço, F3 medida, F5 sem avaliações). Vazio =
  // marcada. ref = { mediana (preço + frete por unidade das guardadas do item), unidades,
  // filtros, regras: { exige, exclui } }. A faixa usa as unidades da oferta, se ela tiver.
  function motivosOferta(o, termo, ref = {}) {
    const f = { ...FILTROS_PADRAO, ...(ref.filtros || {}) };
    const m = [];
    if (o.patrocinado) m.push('patrocinado');
    if (relevancia(o.produto, termo) < 0.5) m.push('termo');
    m.push(...motivosRegras(o.produto, ref.regras));
    const kit = kitDe(o.produto, termo);
    if (kit.combo) m.push(`combo: + ${kit.combo}`);
    if (kit.ambiguo && !o.unidadesManual && !o.unidades_manual) m.push(`unidades: ${kit.ambiguo}, conferir no anúncio`);
    if (o.varianteDe) m.push(`variante de: ${o.varianteDe.slice(0, 40)}`);
    if (o.frete > 3 * o.preco) m.push(`frete suspeito: R$ ${o.frete.toFixed(2).replace('.', ',')}`);
    if (ref.outros && ref.outros[o.url]) m.push(`já guardada em ${ref.outros[o.url]}`);
    if (f.faixa && ref.mediana > 0) {
      const v = (o.preco + (o.frete || 0)) / Math.max(1, Number(o.unidades ?? ref.unidades) || 1);
      if (v < FAIXA[0] * ref.mediana || v > FAIXA[1] * ref.mediana) m.push(`faixa: ${(v / ref.mediana).toFixed(1).replace('.', ',')}× a mediana`);
    }
    const conflito = f.medida ? medidaConflita(o.produto, termo) : '';
    if (conflito) m.push(`medida: ${conflito}`);
    if (f.avaliacoes && o.avaliacoes === 0) m.push('sem avaliações');
    return m;
  }

  // A1: funil da leitura: cards → com preço → sem patrocinado → no termo e nas regras do item →
  // nos filtros.
  const ehDoTermo = (x) => x === 'termo' || x.startsWith('falta:') || x.startsWith('excluída:');
  function funil(ofertas, cards, termo, ref) {
    const ms = ofertas.map((o) => motivosOferta(o, termo, ref));
    const semPat = ms.filter((m) => !m.includes('patrocinado'));
    const noTermo = semPat.filter((m) => !m.some(ehDoTermo));
    return { cards, comPreco: ofertas.length, semPatrocinado: semPat.length, noTermo: noTermo.length, nosFiltros: ms.filter((m) => !m.length).length };
  }

  // Revisão das guardadas pelas regras e filtros de agora (sem a faixa de preço, que depende das
  // próprias guardadas): chaves das ofertas ativas que não passam, com os motivos, incluídas as
  // variantes de cor ou voltagem de uma oferta já guardada do mesmo item e os kits guardados
  // com outras unidades que as do título (a coletar de novo).
  function revisarGuardadas(guardados, filtros = {}) {
    const fora = [];
    const porItem = {};
    for (const [k, l] of Object.entries(guardados)) if (!l.excluida) (porItem[l.id_item] ||= []).push([k, l]);
    // o mesmo produto em dois itens fica no primeiro em que foi guardado
    const donoUrl = {};
    for (const [k, l] of Object.entries(guardados).filter(([, l]) => !l.excluida).sort((a, b) => (a[1].alterado_em || 0) - (b[1].alterado_em || 0) || a[0].localeCompare(b[0]))) donoUrl[l.url] ||= l.id_item;
    for (const [id, ls] of Object.entries(porItem)) {
      const item = ITENS.find((i) => i.id === id);
      if (!item) continue;
      ls.sort((a, b) => a[0].localeCompare(b[0]));
      const anotadas = marcarVariantes(ls.map(([, l]) => l));
      anotadas.forEach((o, i) => {
        // a faixa de preço e as avaliações não valem na revisão; o filtro desligado ao guardar a
        // oferta (filtros_off) também não, para manter o que o autor guardou de propósito
        const desligados = Object.fromEntries((o.filtros_off || []).map((f) => [f, false]));
        const outros = donoUrl[o.url] !== id ? { [o.url]: donoUrl[o.url] } : {};
        const m = motivosOferta({ ...o, patrocinado: false }, item.termo, { filtros: { ...filtros, faixa: false, avaliacoes: false, ...desligados }, regras: item, outros });
        const kit = kitDe(o.produto, item.termo);
        if (kit.unidades && !o.unidades_manual && Number(o.unidades) !== kit.unidades) m.push(`kit de ${kit.unidades} un., guardada com ${o.unidades}`);
        if (m.length) fora.push({ k: ls[i][0], id, produto: o.produto, motivos: m });
      });
    }
    return fora;
  }

  // Revisão automática (após Guardar e Importar): exclui as guardadas que não passam e devolve o
  // texto do status (quantas por item) e a dica (cada uma com os motivos).
  function revisarAgora(guardados, agora = Date.now()) {
    const fora = revisarGuardadas(guardados, filtrosAtuais());
    for (const f of fora) excluir(guardados, f.k, agora);
    const porItem = {};
    for (const f of fora) porItem[f.id] = (porItem[f.id] || 0) + 1;
    return {
      fora,
      texto: fora.length ? ` Revisão: ${fora.length} excluída(s) (${Object.entries(porItem).map(([id, n]) => `${id} ${n}`).join(', ')}).` : '',
      dica: fora.map((f) => `${f.id} ${f.produto.slice(0, 50)}: ${f.motivos.join('; ')}`).join('\n'),
    };
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

  // Quantil com interpolação linear, como o pandas no build.
  const quantil = (vs, q) => {
    const s = vs.filter((v) => Number.isFinite(v)).sort((a, b) => a - b);
    if (!s.length) return null;
    const pos = (s.length - 1) * q;
    const i = Math.floor(pos);
    return s[i] + (s[Math.min(i + 1, s.length - 1)] - s[i]) * (pos - i);
  };

  const diasEntre = (de, ate) => Math.round((Date.parse(ate) - Date.parse(de)) / 86400000);

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
  // Guardar de novo uma oferta excluída a traz de volta. As unidades da oferta (o.unidades,
  // do campo da linha) valem sobre as do painel; o.motivo traz os filtros que ela não passou.
  const porUnidade = (v, u) => (v == null ? null : Math.round((v / u) * 100) / 100);
  function guardar(guardados, item, ofertas, unidades, contexto) {
    let novas = 0;
    for (const o of ofertas) {
      if (!o.url || !(o.preco > 0)) continue;
      const u = Math.max(1, Number(o.unidades ?? unidades) || 1);
      const k = chave(item.id, o.url);
      if (!guardados[k] || guardados[k].excluida) novas++;
      guardados[k] = {
        id_item: item.id, categoria: item.categoria, fonte: contexto.fonte, produto: o.produto,
        preco: porUnidade(o.preco, u), frete: porUnidade(o.frete, u),
        preco_anuncio: o.preco, unidades: u, tipo_preco: o.tipo_preco || 'padrao', preco_sem_pix: porUnidade(o.preco_sem_pix, u),
        cep: contexto.cep || '',
        avaliacoes: o.avaliacoes ?? null, leitor: o.leitor || '',
        url: o.url, busca: o.busca || contexto.busca, posicao: o.posicao ?? null, data_coleta: contexto.data_coleta, motivo: o.motivo || '', excluida: 0,
        unidades_manual: Boolean(o.unidadesManual),
        filtros_off: Object.keys(contexto.filtros || {}).filter((f) => !contexto.filtros[f]),
        alterado_em: contexto.agora || Date.now(),
      };
    }
    return novas;
  }

  // Exclusão lógica: a linha fica guardada e sai no CSV com excluida = 1, para o build
  // descartar também as cópias de exportações anteriores.
  function excluir(guardados, k, agora = Date.now()) {
    if (!guardados[k]) return false;
    guardados[k].excluida = 1;
    guardados[k].alterado_em = agora;
    return true;
  }

  // A8: linhas guardadas ou excluídas depois da última exportação do CSV.
  const pendentes = (guardados, exportadoEm) => Object.values(guardados).filter((l) => (l.alterado_em || Infinity) > (exportadoEm || 0)).length;

  // A2: cobertura da categoria: itens com o mínimo de ofertas sobre os itens da categoria.
  function coberturaCategoria(guardados, categoria) {
    const itens = ITENS.filter((i) => i.categoria === categoria);
    const n = (id) => ativas(guardados).filter((l) => l.id_item === id).length;
    return { itens: itens.length, completos: itens.filter((i) => n(i.id) >= MIN_OFERTAS).length, comPreco: itens.filter((i) => n(i.id) > 0).length };
  }

  const ativas = (guardados) => Object.values(guardados).filter((l) => !l.excluida);

  // Atestado de um item: ofertas ativas, sites, mediana, faixa e quartis do preço mais frete
  // (A4: dispersão P75/P25), fretes sem informação, preços de Pix ou cupom, leitores usados e
  // a coleta mais antiga (A7, em dias até hoje).
  function resumoItem(guardados, idItem, hoje = dataLocal()) {
    const ls = ativas(guardados).filter((l) => l.id_item === idItem);
    const totais = ls.map((l) => l.preco + (l.frete || 0));
    const p25 = quantil(totais, 0.25);
    const p75 = quantil(totais, 0.75);
    const datas = ls.map((l) => l.data_coleta).filter(Boolean).sort();
    return {
      n: ls.length,
      sites: new Set(ls.map((l) => l.fonte)).size,
      mediana: mediana(totais),
      min: ls.length ? Math.min(...totais) : null,
      max: ls.length ? Math.max(...totais) : null,
      p25, p75,
      dispersao: p25 > 0 && ls.length > 1 ? Math.round((p75 / p25) * 100) / 100 : null,
      semFrete: ls.filter((l) => l.frete == null).length,
      pixCupom: ls.filter((l) => l.tipo_preco && l.tipo_preco !== 'padrao').length,
      leitores: [...new Set(ls.map((l) => l.leitor).filter(Boolean))].sort(),
      maisAntiga: datas[0] || null,
      idade: datas[0] ? diasEntre(datas[0], hoje) : null,
    };
  }

  const COLS = ['id_item', 'categoria', 'fonte', 'produto', 'preco', 'frete', 'preco_anuncio', 'unidades', 'tipo_preco', 'preco_sem_pix', 'cep', 'avaliacoes', 'leitor', 'url', 'busca', 'posicao', 'data_coleta', 'motivo', 'excluida'];

  function celula(v) {
    const s = typeof v === 'number' ? String(v).replace('.', ',') : String(v ?? '');
    return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  }

  // Lê um CSV exportado pelo painel (";", BOM, aspas com "" dentro) em linhas como as guardadas.
  function lerCsv(texto) {
    const t = String(texto || '').replace(/^\ufeff/, '');
    const linhas = [];
    let campo = '';
    let linha = [];
    let aspas = false;
    for (let i = 0; i < t.length; i++) {
      const c = t[i];
      if (aspas) {
        if (c !== '"') campo += c;
        else if (t[i + 1] === '"') { campo += '"'; i++; } else aspas = false;
      } else if (c === '"') aspas = true;
      else if (c === ';') { linha.push(campo); campo = ''; } else if (c === '\n' || c === '\r') {
        if (c === '\r' && t[i + 1] === '\n') i++;
        linha.push(campo); linhas.push(linha); linha = []; campo = '';
      } else campo += c;
    }
    if (campo || linha.length) { linha.push(campo); linhas.push(linha); }
    const [cab, ...resto] = linhas.filter((l) => l.some((x) => x !== ''));
    if (!cab || !cab.includes('id_item') || !cab.includes('url')) return [];
    const num = (v) => (v === '' || v == null ? null : Number(String(v).replace(',', '.')));
    return resto.map((l) => {
      const o = Object.fromEntries(cab.map((c, i) => [c, l[i] ?? '']));
      for (const c of ['preco', 'frete', 'preco_anuncio', 'unidades', 'preco_sem_pix', 'avaliacoes', 'posicao']) o[c] = num(o[c]);
      o.unidades = o.unidades || 1;
      o.excluida = Number(o.excluida) || 0;
      return o;
    }).filter((o) => o.id_item && o.url && o.preco > 0);
  }

  // Junta às guardadas as ofertas de CSVs exportados que não estão guardadas (item + url); as
  // guardadas valem sobre o arquivo, e a primeira linha de cada oferta vale sobre as seguintes
  // (passar os arquivos do mais recente para o mais antigo). Devolve quantas entraram.
  function importar(guardados, linhas, agora = Date.now()) {
    let novas = 0;
    for (const l of linhas) {
      const k = chave(l.id_item, l.url);
      if (guardados[k]) continue;
      guardados[k] = { ...l, motivo: l.motivo || '', filtros_off: [], unidades_manual: false, alterado_em: agora };
      novas++;
    }
    return novas;
  }

  const csv = (ls) => '﻿' + [COLS.join(';'), ...ls.map((l) => COLS.map((c) => celula(l[c] ?? (c === 'excluida' ? 0 : ''))).join(';'))].join('\r\n');

  const doisDig = (n) => String(n).padStart(2, '0');
  const dataLocal = (d = new Date()) => `${d.getFullYear()}-${doisDig(d.getMonth() + 1)}-${doisDig(d.getDate())}`;
  const horaLocal = (d = new Date()) => `${doisDig(d.getHours())}${doisDig(d.getMinutes())}`;

  // AAAA-MM-DD_HHmm_<categoria>_precos.csv (o build lê dados/B5_*/_dados-brutos/*_precos.csv). A hora
  // evita que o navegador renomeie a segunda exportação do dia para "... (1).csv", que o build
  // não leria.
  const nomeArquivo = (categoria, data, hora) => `${data}_${hora}_${categoria}_precos.csv`;

  // ---------- leitura da página (DOM) ----------

  const texto = (raiz, sel) => limpar(raiz.querySelector(sel)?.textContent);

  // F5: número de avaliações do card da Amazon ("(4)", "(1,2 mil)"); 0 se o card não mostra.
  function avaliacoesAmazon(c) {
    for (const n of c.querySelectorAll('span, a')) {
      const t = limpar(n.textContent);
      const m = t.match(/^\(([\d.,]+)\s*(mil)?\)$/i);
      if (m) return Math.round((m[2] ? parseFloat(m[1].replace(/\./g, '').replace(',', '.')) * 1000 : numeroBR(m[1])) || 0);
    }
    const rotulo = c.querySelector('[aria-label*="avalia"]')?.getAttribute('aria-label');
    return rotulo ? numeroBR(rotulo) || 0 : 0;
  }

  function lerAmazon() {
    return [...document.querySelectorAll('[data-component-type="s-search-result"][data-asin]')].map((c) => {
      const asin = c.dataset.asin;
      const principal = c.querySelector('.a-price:not(.a-text-price)');
      const preco = numeroBR(principal?.querySelector('.a-offscreen')?.textContent);
      const tipo = tipoPreco(texto(c, '.s-price-instructions-style') || c.textContent);
      // No card de Pix, o preço cinza no mesmo link é o sem desconto (o riscado "De:" só
      // aparece no card sem Pix); fora de 1× a 1,15× o preço, não é o do Pix.
      const cinza = numeroBR(principal?.parentElement?.querySelector('.a-price.a-text-price .a-offscreen')?.textContent);
      return {
        produto: texto(c, 'h2'),
        preco,
        preco_sem_pix: tipo === 'pix' && cinza > preco && cinza <= 1.15 * preco ? cinza : null,
        frete: freteDe(c.textContent),
        url: asin ? `https://www.amazon.com.br/dp/${asin}` : '',
        patrocinado: /patrocinado/i.test(c.textContent) || c.classList.contains('AdHolder'),
        tipo_preco: tipo,
        avaliacoes: avaliacoesAmazon(c),
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

  // Ofertas válidas da página, o total de cards lidos antes do filtro (com e sem preço) e o
  // leitor que as achou (A6): proprio (seletor do site), jsonld, generico ou nenhum.
  const TEM_LEITOR_PROPRIO = ['amazon', 'mercadolivre'];
  function lerOfertas(site) {
    let leitor = 'proprio';
    let brutas = site === 'amazon' ? lerAmazon() : site === 'mercadolivre' ? lerMercadoLivre() : [];
    if (!brutas.length) { leitor = 'jsonld'; brutas = lerJsonLd(); }
    if (!brutas.length) { leitor = 'generico'; brutas = lerGenerico(); }
    if (!brutas.length) leitor = 'nenhum';
    const busca = location.href;
    const ofertas = marcarVariantes(semRepetidas(brutas.filter((o) => o.url && o.preco > 0 && o.produto).map((o) => ({ ...o, busca, leitor }))));
    return { ofertas, cards: brutas.length, leitor };
  }

  // Uma oferta por URL. Na Amazon o patrocinado do topo repete produtos da lista normal: fica a
  // versão normal, na posição dela na página.
  function semRepetidas(ofertas) {
    const porUrl = new Map();
    for (const o of ofertas) {
      const antes = porUrl.get(o.url);
      if (!antes) porUrl.set(o.url, o);
      else if (antes.patrocinado && !o.patrocinado) { porUrl.delete(o.url); porUrl.set(o.url, o); }
    }
    return [...porUrl.values()];
  }

  // Assinatura das ofertas de uma leitura (as URLs em ordem), para saber se a página mudou.
  const assinatura = (ofertas) => ofertas.map((o) => o.url).join('|');

  // Soma ofertas novas às já lidas, sem repetir URL; as variantes valem no conjunto.
  function somarOfertas(lidas, novas) {
    const urls = new Set(lidas.map((o) => o.url));
    return marcarVariantes(lidas.concat(novas.filter((o) => !urls.has(o.url) && urls.add(o.url))));
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
  let leitorLido = '';
  let assinaturaLida = ''; // ofertas da última leitura da página (não do acumulado)
  let somando = false; // a última leitura foi "Somar página"
  let paginas = 0; // páginas da busca somadas na lista

  // Soma entre páginas: "Somar" guarda as ofertas lidas e abre a próxima página da busca; ao
  // carregar, o painel as recupera (mesmo item, até 10 min) e a leitura soma as da página nova.
  const CHAVE_SOMA = 'tcc_precos_soma';
  function proximaPagina() {
    if (document.querySelector('.s-pagination-next.s-pagination-disabled')) return '';
    const sel = ['a.s-pagination-next', 'li.andes-pagination__button--next a', 'a[rel="next"]', 'link[rel="next"]',
      'a[aria-label*="próxima" i]', 'a[aria-label*="next page" i]', 'a[title="Seguinte"]', 'a[title="Próxima"]'];
    for (const s of sel) {
      const e = document.querySelector(s);
      const href = e && e.getAttribute('href');
      if (href && e.getAttribute('aria-disabled') !== 'true') return new URL(href, location.href).href;
    }
    // sem link: o parâmetro page da busca (Amazon, Magalu e Leroy Merlin usam page=N)
    const u = new URL(location.href);
    if (!u.searchParams.has('page') && site !== 'amazon') return '';
    u.searchParams.set('page', String((Number(u.searchParams.get('page')) || 1) + 1));
    return u.href;
  }

  const itemAtual = () => ITENS.find((i) => i.id === GM_getValue(CHAVE_ITEM, ITENS[0].id)) || ITENS[0];
  const cepAtual = () => cepDoSite() || GM_getValue(CHAVE_CEP, '');
  const filtrosAtuais = () => ({ ...FILTROS_PADRAO, ...GM_getValue(CHAVE_FILTROS, {}) });

  // Com GM_download, em Downloads/TCC Luderia/<pasta da categoria>/ sem perguntar; recusado, o comum.
  const PASTA_CATEGORIA = { obra_reforma: 'B5_reforma/_dados-brutos' };
  const pastaDe = (nome) => PASTA_CATEGORIA[Object.keys(PASTA_CATEGORIA).find((c) => nome.includes(`_${c}_`))] || 'B5_mobiliario/_dados-brutos';
  function baixar(nome, conteudo, tipo, atraso = 0) {
    setTimeout(() => {
      kp.baixarArquivo(nome, conteudo, tipo, { pasta: pastaDe(nome) });
    }, atraso);
  }

  function registrarBusca(item, siteBusca, info) {
    const b = GM_getValue(CHAVE_BUSCAS, {}) || {};
    b[`${item.id}|${siteBusca}`] = { id_item: item.id, categoria: item.categoria, site: siteBusca, data_coleta: dataLocal(), ...info };
    GM_setValue(CHAVE_BUSCAS, b);
  }

  // Resumo por item da lista: sites buscados, ofertas ativas e situação (ok, abaixo de 3, sem
  // oferta, não buscado). Sai com o CSV, num arquivo que o build não lê como preço.
  const COLS_RESUMO = ['id_item', 'categoria', 'item', 'sites_buscados', 'buscas', 'ofertas_ativas', 'sites_com_oferta', 'situacao', 'ultima_busca'];
  function resumoItens(guardados, buscas) {
    const bs = Object.values(buscas || {});
    return ITENS.map((i) => {
      const minhas = bs.filter((b) => b.id_item === i.id);
      const ofertas = ativas(guardados).filter((l) => l.id_item === i.id);
      const n = ofertas.length;
      const situacao = n >= MIN_OFERTAS ? 'ok' : n > 0 ? `abaixo de ${MIN_OFERTAS}` : minhas.length ? 'sem oferta' : 'não buscado';
      return {
        id_item: i.id, categoria: i.categoria, item: i.item, sites_buscados: [...new Set(minhas.map((b) => b.site))].sort().join(', '),
        buscas: minhas.length, ofertas_ativas: n, sites_com_oferta: [...new Set(ofertas.map((l) => l.fonte))].sort().join(', '),
        situacao, ultima_busca: minhas.map((b) => b.data_coleta).sort().pop() || '',
      };
    });
  }
  const csvResumo = (linhas) => '\ufeff' + [COLS_RESUMO.join(';'), ...linhas.map((l) => COLS_RESUMO.map((c) => celula(l[c])).join(';'))].join('\r\n');

  function baixarCsv() {
    const porCategoria = {};
    for (const l of Object.values(carregar())) (porCategoria[l.categoria] ||= []).push(l);
    const agora = new Date();
    Object.entries(porCategoria).forEach(([categoria, linhas], i) => {
      linhas.sort((a, b) => a.id_item.localeCompare(b.id_item) || a.fonte.localeCompare(b.fonte) || (a.posicao ?? Infinity) - (b.posicao ?? Infinity) || a.preco - b.preco);
      baixar(nomeArquivo(categoria, dataLocal(agora), horaLocal(agora)), csv(linhas), 'text/csv;charset=utf-8', i * 800);
    });
    const n = Object.keys(porCategoria).length;
    baixar(`${dataLocal(agora)}_${horaLocal(agora)}_resumo_itens_coleta.csv`, csvResumo(resumoItens(carregar(), GM_getValue(CHAVE_BUSCAS, {}))), 'text/csv;charset=utf-8', n * 800);
    GM_setValue(CHAVE_EXPORTACAO, agora.getTime());
    return n;
  }

  // ---------- painel (kit dos painéis: _kit_painel/kit_painel.js) ----------
  // Mesmo padrão dos demais coletores: canto superior direito, shadow DOM preso ao <html>,
  // arrastável e redimensionável, Montserrat, Heroicons outline, explicações em dicas e ação
  // destrutiva em dois cliques. O seletor é próprio (estados por site, pulados e cor da
  // categoria), com o contador, o "Próximo", o marcar e o funil na mesma linha, como no kit.
  // "kp" e não "kit": aqui, kit é a embalagem do anúncio (kitDe).

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

  const kp = kitPainel({ id: 'cpi', prefixo: 'tcc_precos' });
  const { criar, icone } = kp;
  const el = {};
  let saindoPeloPainel = false; // "Buscar aqui" e "Próximo que falta" não disparam o aviso de CSV pendente

  // Só o que o kit não traz: grade do resumo, listas de ofertas e cores do seletor.
  const CSS_PAINEL = `
    option.obra_reforma{color:#c2410c} option.cozinha_bar{color:#1d4ed8}
    option.mobiliario{color:#15803d} option.equipamentos{color:#7e22ce}
    option.coletado{color:#9ca3af} option.fraco{color:#b45309} option.pulado{color:#9ca3af;font-style:italic}
    input[type=number]{font:inherit;color:inherit;background:var(--sup);border:0;border-radius:8px;padding:4px 6px;width:50px;flex:none}
    input.cep{flex:0 1 96px} input.u{width:40px;font-size:11.5px;padding:1px 4px}
    input[type=checkbox]{flex:none;margin:2px 0 0;accent-color:var(--caneta)}
    .caixa{background:var(--sup);border-radius:10px;padding:7px 10px;margin:7px 0}
    .grade{display:grid;grid-template-columns:auto minmax(0,1fr) auto minmax(0,1fr);gap:2px 6px;font-size:11.5px;align-items:center}
    .grade+.grade{margin-top:6px;padding-top:6px;border-top:1px solid var(--sup2)}
    .grade .k{color:var(--suave);display:inline-flex;align-items:center;gap:3px}
    .grade .v{font-variant-numeric:tabular-nums;display:inline-flex;align-items:center;gap:4px;font-weight:500}
    .grade .largo{grid-column:2 / -1}
    .grade .todo{grid-column:1 / -1;display:flex;align-items:center;gap:4px}
    .grade svg,.resumo svg,.rotulo svg,.selo svg,li .meta svg{width:14px;height:14px}
    .selo{display:inline-flex;align-items:center;gap:3px}
    .mbarra{display:inline-block;width:64px;height:6px;background:var(--sup2);border-radius:999px;overflow:hidden}
    .mbarra>span{display:block;height:100%;background:currentColor;border-radius:999px}
    ul{list-style:none;margin:6px 0;padding:0;max-height:40vh;overflow:auto}
    li{display:flex;gap:6px;align-items:flex-start;padding:5px 0;border-bottom:1px solid var(--linha);font-size:12.5px}
    li .corpo{flex:1;min-width:0}
    li .titulo{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;cursor:pointer}
    li .titulo:hover{text-decoration:underline}
    li .meta{display:flex;flex-wrap:wrap;gap:3px 8px;align-items:center;font-size:11.5px;margin-top:2px;color:var(--suave)}
    li .meta>span{display:inline-flex;align-items:center;gap:3px}
    li .meta b{font-size:12.5px;color:var(--texto)}
    li.guardada{align-items:center} li.guardada span{flex:1} li.guardada b{white-space:nowrap}
    button.x{width:22px;height:22px} button.x svg{width:14px;height:14px}
    .resumo{font-size:12.5px;display:flex;flex-wrap:wrap;align-items:center;gap:3px;margin:7px 0;color:var(--suave)}
    .resumo:empty{display:none}
    .ok{color:var(--ok)} .alerta{color:var(--alerta)}
    .filtros-off{font-size:12px;display:inline-flex;align-items:center;gap:3px}`;

  // Filhos mistos: texto e nós (ícones), sem vazios
  const partes = (...xs) => xs.filter((x) => x !== '' && x != null && x !== false).map((x) => (typeof x === 'string' ? document.createTextNode(x) : x));

  // tipo: '' (neutro), 'ok', 'alerta' ou 'erro' (pinta o status e o ponto do cabeçalho).
  const status = (t, tipo = '') => kp.status(t, tipo);
  const reais = (v) => (v == null ? '–' : `R$ ${v.toFixed(2).replace('.', ',')}`);
  const ROTULO_TIPO = { pix: ' [Pix]', cupom: ' [cupom]', padrao: '' };
  const ROTULO_LEITOR = { proprio: `próprio do site`, jsonld: 'JSON-LD', generico: 'genérico', nenhum: 'nenhum' };
  const ROTULO_CATEGORIA = { obra_reforma: 'Obra e reforma', cozinha_bar: 'Cozinha e bar', mobiliario: 'Mobiliário', equipamentos: 'Equipamentos' };
  const decimal = (v) => String(v).replace('.', ',');
  const quando = (ms) => { const d = new Date(ms); return `${doisDig(d.getDate())}/${doisDig(d.getMonth() + 1)} ${doisDig(d.getHours())}h${doisDig(d.getMinutes())}`; };
  const diaMes = (iso) => (iso ? iso.split('-').reverse().join('/') : '–');
  // Botão com ícone e nome curto; o nome completo e a explicação vão na dica
  const botao = (ico, rotulo, dica, fn, classe = '') => kp.botao(ico, rotulo, fn, { classe, dica });
  // Selo que liga e desliga (filtros)
  const selo = (rotulo, dica, ligado, aoMudar) => kp.etiqueta(rotulo, aoMudar, { ligada: ligado, dica });
  // Casa da grade: rótulo (k) ou valor (v), com ícone opcional
  const casa = (classe, ...xs) => criar('span', { className: classe }, partes(...xs));
  const aviso = (t) => criar('span', { className: 'alerta', dica: t }, [icone('exclamation-triangle')]);

  function mostrarCep() {
    const doSite = cepDoSite();
    const cep = cepAtual();
    const ok = cep && ehSalvador(cep);
    const bom = doSite ? ehSalvador(doSite) : ok;
    el.cepAviso.className = bom ? 'selo cep-aviso ok' : 'selo cep-aviso alerta';
    el.cepAviso.replaceChildren(...partes(icone(bom ? 'check' : 'exclamation-triangle'),
      doSite ? `no site: ${doSite}` : cep ? 'site não mostra' : 'informe o CEP'));
    kp.dica(el.cepAviso, doSite
      ? `CEP no site: ${doSite}${ehSalvador(doSite) ? ' (Salvador)' : ' — fora de Salvador: o frete não vale'}`
      : cep ? `CEP informado: ${cep}${ok ? ' (Salvador)' : ' — fora de Salvador'}; o site não mostra o CEP, conferir`
        : 'Informe o CEP de Salvador usado no site: o frete depende dele.');
  }

  function mostrar(t, tipo = '') {
    const guardados = carregar();
    const lista = ativas(guardados);
    const item = itemAtual();
    const r = resumoItem(guardados, item.id);
    const itensComPreco = new Set(lista.map((l) => l.id_item)).size;
    const itensFracos = ITENS.filter((i) => { const n = resumoItem(guardados, i.id).n; return n > 0 && n < MIN_OFERTAS; }).length;

    // A8: o que mudou desde o último CSV
    const exportadoEm = GM_getValue(CHAVE_EXPORTACAO, 0);
    const pend = pendentes(guardados, exportadoEm);
    el.pendentes.className = pend ? 'selo alerta' : exportadoEm ? 'selo ok' : 'selo';
    el.pendentes.replaceChildren(...partes(pend >= AVISO_PENDENTES ? icone('exclamation-triangle') : !pend && exportadoEm ? icone('check') : '',
      pend ? `${pend} fora do CSV` : exportadoEm ? 'CSV em dia' : ''));
    kp.dica(el.pendentes, pend
      ? `${pend} oferta(s) guardadas ou excluídas desde o último CSV${exportadoEm ? ` (${quando(exportadoEm)})` : ' (nenhum baixado ainda)'}`
        + `${pend >= AVISO_PENDENTES ? '. Baixe o CSV: os dados só estão no Tampermonkey' : ''}`
      : exportadoEm ? `CSV baixado em ${quando(exportadoEm)}` : 'Nada guardado ainda.');

    // Coleta toda e A2: cobertura da categoria do item
    const c = coberturaCategoria(guardados, item.categoria);
    const preenchido = criar('span');
    preenchido.style.width = `${Math.round((100 * c.completos) / c.itens)}%`;
    el.geral.replaceChildren(
      casa('k', icone('chart-bar'), 'Itens'), casa('v', `${itensComPreco}/${ITENS.length}`),
      casa('k', 'Abaixo de 3'), casa('v', String(itensFracos)),
      ...(Object.keys(pulados()).length ? [casa('k', icone('arrow-uturn-right'), 'Pulados'), casa('v largo', Object.keys(pulados()).sort().join(', '))] : []),
      casa('k', icone('folder'), ROTULO_CATEGORIA[item.categoria] || item.categoria),
      criar('span', { className: `v largo${c.completos === c.itens ? ' ok' : ''}`, dica: `${c.completos} de ${c.itens} itens da categoria com ${MIN_OFERTAS}+ ofertas; ${c.comPreco} com alguma` },
        partes(`${c.completos}/${c.itens}`, criar('span', { className: 'mbarra' }, [preenchido]))),
    );

    // A4 e A7: resumo do item em grade (preço + frete), com alerta de mínimo, dispersão e idade
    if (!r.n) {
      kp.dica(el.resumo, '');
      el.resumo.replaceChildren(casa('todo', icone('tag'), 'Nenhuma oferta guardada deste item.'));
    } else {
      const disperso = r.dispersao > DISPERSAO_MAX;
      const alertas = [];
      if (r.n < MIN_OFERTAS) alertas.push(`faltam ${MIN_OFERTAS - r.n} para o mínimo`);
      if (r.idade > IDADE_MAX) alertas.push(`coleta mais antiga com ${r.idade} dias`);
      kp.dica(el.resumo, `Preço + frete das ofertas guardadas deste item${r.leitores.length ? `; leitor ${r.leitores.map((l) => ROTULO_LEITOR[l] || l).join(', ')}` : ''}`);
      el.resumo.replaceChildren(
        casa('k', icone('tag'), 'Ofertas'), casa(`v${r.n < MIN_OFERTAS ? ' alerta' : ''}`, `${r.n} (${r.sites} site${r.sites > 1 ? 's' : ''})`),
        casa('k', 'Mediana'), criar('b', { className: 'v', textContent: reais(r.mediana) }),
        casa('k', 'Mínimo'), casa('v', reais(r.min)),
        casa('k', 'Máximo'), casa('v', reais(r.max)),
        ...(r.n > 1 ? [
          casa('k', 'P25'), casa('v', reais(r.p25)),
          casa('k', 'P75'), casa('v', reais(r.p75)),
          casa('k', 'P75/P25'), casa(`v${disperso ? ' alerta' : ''}`, `${decimal(r.dispersao)}×`, disperso && aviso(`Acima de ${decimal(DISPERSAO_MAX)}×: produtos diferentes?`)),
        ] : []),
        casa('k', 'Pix/cupom'), casa('v', String(r.pixCupom || 0)),
        ...(r.semFrete ? [casa('k', 'Sem frete'), casa('v', String(r.semFrete))] : []),
        casa('k', 'Desde'), casa(`v${r.idade > IDADE_MAX ? ' alerta' : ''}`, diaMes(r.maisAntiga)),
        ...(alertas.length ? [casa('todo alerta', icone('exclamation-triangle'), alertas.join('; '))] : []),
      );
    }
    rotularItens(lista);
    mostrarPular(item);
    listarGuardadas(guardados, item);
    if (t) status(t, tipo);
  }

  // Itens pulados: a busca não trouxe o item pensado. Ficam fora do "Próximo" e de "só os que
  // faltam", não deixam guardar e voltam com "Retomar" (no próprio item, pelo seletor).
  const pulados = () => GM_getValue(CHAVE_PULADOS, {});
  const pulado = (id) => id in pulados();

  // Coletado é por site: o item coletado no Mercado Livre segue a coletar na Amazon e no Magalu.
  // Guardar marca o item como coletado no site aberto; "Desfazer" tira a marca. Sem marca nem
  // desfeito, vale o número de ofertas guardadas do site (POR_SITE ou mais).
  const coletadosSite = () => GM_getValue(CHAVE_COLETADOS, {})[site] || {};
  function marcarColetado(id, v) {
    const g = GM_getValue(CHAVE_COLETADOS, {});
    GM_setValue(CHAVE_COLETADOS, { ...g, [site]: { ...(g[site] || {}), [id]: v } });
  }
  const doSite = (lista) => lista.filter((l) => l.fonte === site);
  function coletado(id, n) {
    const m = coletadosSite()[id];
    return m ?? (n[id] || 0) >= POR_SITE;
  }

  // Itens do seletor (o menu nativo só aceita texto): com o mínimo de ofertas, esmaecidos (✓ e o
  // número de ofertas); com alguma, abaixo do mínimo, em âmbar (◐ e n/3); sem oferta, ○ na cor
  // da categoria; pulados, – em itálico. "Só os que faltam" esconde completos e pulados (menos o atual).
  const ofertasPorItem = (lista) => {
    const n = {};
    for (const l of lista) n[l.id_item] = (n[l.id_item] || 0) + 1;
    return n;
  };
  function rotularItens(lista) {
    const n = ofertasPorItem(doSite(lista));
    const soFaltam = GM_getValue(CHAVE_SO_FALTAM, false);
    const atual = itemAtual().id;
    let prontos = 0;
    for (const o of el.item.querySelectorAll('option')) {
      const i = ITENS.find((x) => x.id === o.value);
      const k = n[i.id] || 0;
      const pul = pulado(i.id);
      const col = coletado(i.id, n);
      if (col && !pul) prontos++;
      o.className = pul ? 'pulado' : col ? 'coletado' : k ? 'fraco' : i.categoria;
      o.textContent = pul ? `– ${i.id} · ${i.item} (pulado)` : col ? `✓ ${i.id} · ${i.item} (${k})`
        : k ? `◐ ${i.id} · ${i.item} (${k}/${POR_SITE})` : `○ ${i.id} · ${i.item}`;
      o.hidden = soFaltam && (col || pul) && i.id !== atual;
    }
    for (const g of el.item.querySelectorAll('optgroup')) g.hidden = [...g.querySelectorAll('option')].every((o) => o.hidden);
    el.contagem.textContent = `${prontos}/${ITENS.length}`;
    kp.dica(el.contagem, `${prontos} de ${ITENS.length} itens coletados neste site`);
    el.contagemBarra.style.width = `${Math.round((100 * prontos) / (ITENS.length || 1))}%`;
  }

  // Próximo item não coletado neste site e não pulado: primeiro na categoria do atual, depois
  // nas outras, seguindo a ordem da lista a partir do atual.
  function proximoQueFalta(lista, atual, puls = {}) {
    const n = ofertasPorItem(doSite(lista));
    const i0 = ITENS.findIndex((i) => i.id === atual.id);
    const ordem = [...ITENS.slice(i0 + 1), ...ITENS.slice(0, i0)].filter((i) => !coletado(i.id, n) && !(i.id in puls));
    return ordem.find((i) => i.categoria === atual.categoria) || ordem[0] || null;
  }

  function mostrarPular(item) {
    if (!el.bPular) return;
    const pul = pulado(item.id);
    el.bPular.replaceChildren(icone(pul ? 'arrow-uturn-left' : 'arrow-uturn-right'));
    kp.dica(el.bPular, pul
      ? `Retomar: ${item.id} foi pulado em ${diaMes(pulados()[item.id])}; volta ao "Próximo" e libera o Guardar`
      : 'Pular: a busca não trouxe o item pensado; marca o item como pulado (fora do "Próximo" e de "só os que faltam", sem Guardar) e vai ao próximo');
    mostrarColetado(item);
    if (el.bGuardar) contarMarcadas();
  }

  function mostrarColetado(item) {
    if (!el.bColetado) return;
    const col = coletado(item.id, ofertasPorItem(doSite(ativas(carregar()))));
    el.bColetado.replaceChildren(icone(col ? 'x-mark' : 'check'));
    kp.dica(el.bColetado, col
      ? `Desfazer coletado: ${item.id} volta a faltar em ${site} (seletor, "Próximo" e "só os que faltam"); as ofertas guardadas ficam`
      : `Marcar coletado: dá ${item.id} por coletado em ${site} (ex.: a busca tem menos de ${POR_SITE} anúncios que servem)`);
  }

  function listarGuardadas(guardados, item) {
    const ks = Object.keys(guardados).filter((k) => guardados[k].id_item === item.id && !guardados[k].excluida)
      .sort((a, b) => guardados[a].preco - guardados[b].preco);
    el.guardadasTitulo.textContent = `Guardadas deste item (${ks.length})`;
    el.guardadas.replaceChildren(...ks.map((k) => {
      const l = guardados[k];
      const frete = l.frete == null ? ' + frete ?' : l.frete === 0 ? '' : ` + ${reais(l.frete)}`;
      const x = botao('x-mark', '', 'Excluir esta oferta (a exclusão vai no CSV)',
        () => { const g = carregar(); excluir(g, k); salvar(g); mostrar(`Excluída: ${l.produto.slice(0, 40)}`); }, 'x leve');
      return criar('li', { className: 'guardada' }, [x, criar('span', { textContent: `${l.fonte} · ${l.produto}` }), criar('b', { textContent: `${reais(l.preco)}${frete}${ROTULO_TIPO[l.tipo_preco] || ''}` })]);
    }));
  }

  // Referência dos filtros: mediana do item guardado, unidades por embalagem e filtros ligados.
  // outros: URL já guardada em outro item -> id desse item (cada produto conta num item só).
  function referencia() {
    const g = carregar();
    const item = itemAtual();
    const outros = {};
    for (const l of ativas(g)) if (l.id_item !== item.id) outros[l.url] ||= l.id_item;
    return { mediana: resumoItem(g, item.id).mediana, unidades: el.unidades.value, filtros: filtrosAtuais(), regras: item, outros };
  }

  // Unidades de cada oferta: a digitada na linha; senão, a do kit no título ("caixa com 24");
  // senão, a do campo do painel.
  const unidadesDe = (o) => o.unidadesManual ?? kitDe(o.produto, itemAtual().termo).unidades ?? (Number(el.unidades.value) || 1);

  // Clicar no título rola a página até o card da oferta e o contorna por 2 s, para conferir.
  function localizar(o) {
    let caminho = '';
    try { caminho = new URL(o.url).pathname; } catch (e) { return false; }
    const a = [...document.querySelectorAll('a[href]')].find((x) => x.href && x.href.includes(caminho));
    if (!a) return false;
    const alvo = a.closest('[data-asin], li, article') || a;
    alvo.scrollIntoView({ block: 'center', behavior: 'smooth' });
    const antes = alvo.style.outline;
    alvo.style.outline = '3px solid #2563eb';
    setTimeout(() => { alvo.style.outline = antes; }, 2000);
    return true;
  }

  // Linha da oferta: título em até 2 linhas (inteiro na dica), preço, frete, Pix, unidades do kit e
  // o motivo de vir desmarcada; o resto (preço sem Pix, avaliações) fica na dica do preço.
  function listarOfertas() {
    const item = itemAtual();
    const ref = referencia();
    let aptas = 0; // vêm marcadas só as POR_SITE primeiras que passam nos filtros
    el.lista.replaceChildren(...ofertasLidas.map((o, i) => {
      o.unidades = unidadesDe(o);
      const motivos = motivosOferta(o, item.termo, ref);
      const marca = criar('input', { type: 'checkbox', checked: !motivos.length && aptas++ < POR_SITE, onchange: contarMarcadas });
      marca.dataset.i = i;
      const titulo = criar('span', { className: 'titulo', textContent: o.produto, dica: `${o.produto}\n(clique para ver na página)` });
      titulo.onclick = () => { if (!localizar(o)) status('Oferta não encontrada na página (pode ter saído da tela).', 'alerta'); };
      const meta = [criar('b', {
        textContent: reais(o.preco),
        dica: [o.preco_sem_pix ? `sem Pix ${reais(o.preco_sem_pix)}` : '', o.avaliacoes == null ? '' : `${o.avaliacoes} avaliações`].filter(Boolean).join(' · '),
      })];
      if (o.frete != null) meta.push(criar('span', { dica: 'Frete' }, partes(icone('truck'), o.frete === 0 ? 'grátis' : reais(o.frete))));
      if (o.tipo_preco && o.tipo_preco !== 'padrao') meta.push(criar('span', { className: 'selo', textContent: o.tipo_preco === 'pix' ? 'Pix' : 'cupom' }));
      if (o.unidades > 1 || o.unidadesManual) {
        const u = criar('input', {
          type: 'number', min: 1, value: o.unidades, className: 'u', dica: 'Unidades da lista neste anúncio (caixa, jogo ou kit)',
          onchange: () => { o.unidadesManual = Math.max(1, Number(u.value) || 1); o.unidades = o.unidadesManual; listarOfertas(); },
        });
        meta.push(criar('span', {}, partes(icone('cube'), u, `${reais(o.preco / o.unidades)} cada`)));
      }
      if (motivos.length) {
        meta.push(criar('span', { className: 'alerta', dica: `Desmarcada: ${motivos.join('; ')}. Se marcada à mão, vai com motivo e o build a deixa de fora` },
          partes(icone('no-symbol'), motivos.length > 1 ? `${motivos[0]} +${motivos.length - 1}` : motivos[0])));
      }
      return criar('li', {}, [marca, criar('div', { className: 'corpo' }, [titulo, criar('div', { className: 'meta' }, meta)])]);
    }));
    contarMarcadas();
    mostrarFunil();
  }

  const caixasMarcadas = () => [...el.lista.querySelectorAll('input[type=checkbox]')].filter((m) => m.checked);
  function contarMarcadas() {
    const n = caixasMarcadas().length;
    el.bGuardar.lastChild.textContent = `Guardar${ofertasLidas.length ? ` (${n})` : ''}`;
    el.bGuardar.disabled = !ofertasLidas.length || pulado(itemAtual().id);
  }

  // A1 e A6: funil da leitura e leitor usado, com alerta se o site tem leitor próprio e ele falhou.
  function mostrarFunil() {
    if (!ofertasLidas.length && !cardsLidos) { el.funil.replaceChildren(); kp.dica(el.funil, ''); return; }
    const f = funil(ofertasLidas, cardsLidos, itemAtual().termo, referencia());
    const falhou = TEM_LEITOR_PROPRIO.includes(site) && leitorLido !== 'proprio';
    el.funil.className = falhou || !f.nosFiltros ? 'resumo alerta' : 'resumo';
    el.funil.replaceChildren(...partes(icone('funnel'), ` ${f.cards} cards → ${f.comPreco} com preço → ${f.semPatrocinado} sem patrocinado → ${f.noTermo} no termo → ${f.nosFiltros} nos filtros`,
      falhou && ' ', falhou && icone('exclamation-triangle'), falhou && ' leitor do site falhou'));
    kp.dica(el.funil, `Funil da leitura desta página; leitor ${ROTULO_LEITOR[leitorLido] || leitorLido}${falhou ? '. O seletor do site não leu: o layout pode ter mudado' : ''}`);
  }

  function ler(somar, motivo = '') {
    const { ofertas, cards, leitor } = lerOfertas(site);
    const antes = ofertasLidas.length;
    ofertasLidas = somar ? somarOfertas(ofertasLidas, ofertas) : ofertas;
    ofertasLidas.forEach((o, i) => { o.posicao ??= i + 1; }); // posição na busca, na ordem do site
    cardsLidos = somar ? cardsLidos + cards : cards;
    leitorLido = somar && leitorLido && leitorLido !== leitor ? `${leitorLido}+${leitor}` : leitor;
    urlLida = location.href;
    assinaturaLida = assinatura(ofertas);
    somando = somar;
    paginas = somar ? paginas + 1 : 1;
    registrarBusca(itemAtual(), site, { busca: urlLida, paginas, lidas: ofertasLidas.length,
      nos_filtros: ofertasLidas.filter((o) => !motivosOferta(o, itemAtual().termo, referencia()).length).length });
    listarOfertas();
    const marcadas = caixasMarcadas().length;
    const novas = ofertasLidas.length - (somar ? antes : 0);
    status(!ofertasLidas.length ? `${motivo}Nenhuma oferta com preço nesta página.`
      : `${motivo}${somar ? `+${novas} novas; ` : ''}${ofertasLidas.length} ofertas de ${cardsLidos} cards, ${marcadas} marcadas.`, ofertasLidas.length ? '' : 'alerta');
  }

  // Reiniciar (lixeira): volta o coletor ao zero. Até 13/11/2026 a lixeira só apagava as ofertas:
  // as marcas de coletado por site (✓ do seletor, "Próximo" e "só os que faltam"), os pulados,
  // o registro das buscas e a data do último CSV ficavam, e a coleta seguinte herdava esse
  // histórico. Baixa antes um backup JSON com tudo; ficam o CEP, os filtros e as preferências.
  const CHAVES_COLETA = [CHAVE, CHAVE_COLETADOS, CHAVE_PULADOS, CHAVE_BUSCAS, CHAVE_EXPORTACAO, CHAVE_SOMA, CHAVE_ITEM];
  function reiniciar() {
    const guardadas = carregar();
    const n = Object.keys(guardadas).length;
    const agora = new Date();
    baixar(`${dataLocal(agora)}_${horaLocal(agora)}_precos_backup.json`, JSON.stringify({ guardadas, coletados: GM_getValue(CHAVE_COLETADOS, {}),
      pulados: pulados(), buscas: GM_getValue(CHAVE_BUSCAS, {}) }, null, 1), 'application/json');
    for (const c of CHAVES_COLETA) GM_deleteValue(c);
    el.item.value = itemAtual().id;
    kp.estado('');
    mostrar();
    listarOfertas();
    status(`Reiniciado: ${n} ofertas apagadas e histórico de coleta zerado (backup JSON baixado antes).`, 'ok');
  }

  function montarPainel() {
    el.item = criar('select', {
      dica: 'Item da lista, neste site. ✓ coletado, ◐ com ofertas e não coletado, ○ sem oferta (na cor da categoria), – pulado',
      onchange: () => { GM_setValue(CHAVE_ITEM, el.item.value); religarFiltros(); mostrar(); ler(false, 'Item trocado: página relida. '); },
    }, [...new Set(ITENS.map((i) => i.categoria))].map((c) => criar('optgroup', { label: ROTULO_CATEGORIA[c] || c },
      ITENS.filter((i) => i.categoria === c).map((i) => criar('option', { value: i.id, textContent: `${i.id} · ${i.item}` })))));
    el.item.value = itemAtual().id;
    el.cep = criar('input', {
      type: 'text', className: 'cep', placeholder: '40000-000', value: GM_getValue(CHAVE_CEP, ''), dica: 'CEP de Salvador usado no site (o frete depende dele)',
      onchange: () => { GM_setValue(CHAVE_CEP, cepDe(el.cep.value) || ''); el.cep.value = GM_getValue(CHAVE_CEP, ''); mostrarCep(); },
    });
    el.cepAviso = kp.selo('', 'cep-aviso');
    el.pendentes = kp.selo('');
    el.geral = criar('div', { className: 'grade' });
    el.resumo = criar('div', { className: 'grade' });
    el.funil = criar('div', { className: 'resumo' });
    el.contagem = criar('span', { className: 'pos' });
    el.contagemBarra = criar('div', { className: 'preenchido' });
    // F2, F3 e F5: filtros da marcação inicial, guardados no Tampermonkey
    const FILTRO = {
      faixa: ['preço', 'Filtro de faixa de preço: desmarca ofertas abaixo de 0,3× ou acima de 3× a mediana guardada do item'],
      medida: ['medida', 'Filtro de medida: desmarca ofertas cuja medida (cm, L, BTU, W, kg) foge da do termo'],
      avaliacoes: ['avaliações', 'Filtro de avaliações: desmarca ofertas da Amazon sem avaliações'],
    };
    const filtros = Object.keys(FILTROS_PADRAO).map((k) => selo(FILTRO[k][0], FILTRO[k][1], filtrosAtuais()[k],
      (v) => { GM_setValue(CHAVE_FILTROS, { ...filtrosAtuais(), [k]: v }); avisarFiltros(); listarOfertas(); }));
    // Filtro desligado: aviso ao lado dos selos; todos voltam a ligar ao trocar de item, para não
    // ficarem desligados sem querer (a oferta guardada com um filtro desligado fica fora da revisão dele)
    el.avisoFiltros = criar('span', { className: 'alerta filtros-off' });
    const avisarFiltros = () => {
      const off = Object.keys(FILTROS_PADRAO).filter((k) => !filtrosAtuais()[k]).map((k) => FILTRO[k][0]);
      el.avisoFiltros.replaceChildren(...(off.length ? partes(icone('exclamation-triangle'), `${off.join(', ')} desligado${off.length > 1 ? 's' : ''}`) : []));
      kp.dica(el.avisoFiltros, off.length ? 'As ofertas guardadas agora ficam fora da revisão desse filtro. Os filtros voltam a ligar ao trocar de item.' : '');
    };
    const religarFiltros = () => {
      if (Object.keys(FILTROS_PADRAO).every((k) => filtrosAtuais()[k])) return;
      GM_setValue(CHAVE_FILTROS, {});
      for (const b of filtros) b.checked = true;
      avisarFiltros();
    };
    avisarFiltros();
    const soFaltam = kp.alternaIcone({ ico: 'funnel', rotulo: 'Só os que faltam', ligado: GM_getValue(CHAVE_SO_FALTAM, false),
      aoMudar: (v) => { GM_setValue(CHAVE_SO_FALTAM, v); mostrar(); } });
    kp.el.status = criar('div', { className: 'status' });
    el.unidades = criar('input', { type: 'number', min: 1, value: 1, dica: 'Unidades por embalagem: vale para as ofertas sem unidades no título', onchange: () => listarOfertas() });
    el.lista = criar('ul');
    el.guardadas = criar('ul');
    el.guardadasTitulo = criar('span');
    const bBuscar = botao('magnifying-glass', 'Buscar', 'Buscar aqui: abre a busca do site com o termo do item', () => { saindoPeloPainel = true; location.href = urlBusca(site, itemAtual().termo); }, 'mini');
    bBuscar.disabled = !urlBusca(site, 'x');
    const bLer = botao('arrow-path', 'Reler', 'Ler ofertas: relê a página (ela já é lida sozinha ao abrir e ao trocar de página)', () => ler(false), 'mini');
    const bSomar = botao('plus', 'Somar', 'Somar próxima página: guarda as ofertas lidas, abre a próxima página da busca e soma as dela (sem próxima página, soma as que carregaram ao rolar)', () => {
      const url = proximaPagina();
      if (!url) { ler(true, 'Sem próxima página: somadas as que carregaram nesta. '); return; }
      if (!ofertasLidas.length) ler(false);
      GM_setValue(CHAVE_SOMA, { item: itemAtual().id, ofertas: ofertasLidas, cards: cardsLidos, leitor: leitorLido, paginas, em: Date.now() });
      saindoPeloPainel = true;
      status(`Abrindo a página ${paginas + 1} para somar às ${ofertasLidas.length} ofertas lidas...`);
      location.href = url;
    }, 'mini');
    // F4: desmarca as ofertas de Pix ou cupom, para comparar só preços padrão
    const bPadrao = botao('no-symbol', 'Pix', 'Só preço padrão: desmarca as ofertas com preço de Pix ou cupom', () => {
      let n = 0;
      for (const m of caixasMarcadas()) if ((ofertasLidas[m.dataset.i].tipo_preco || 'padrao') !== 'padrao') { m.checked = false; n++; }
      contarMarcadas();
      status(`${n} oferta(s) de Pix ou cupom desmarcadas; ${caixasMarcadas().length} marcadas.`);
    }, 'mini');
    const irProximo = (antes = '') => {
      const prox = proximoQueFalta(ativas(carregar()), itemAtual(), pulados());
      if (!prox) { mostrar(`${antes}Todos os itens não pulados estão coletados em ${site}.`, 'ok'); return; }
      GM_setValue(CHAVE_ITEM, prox.id);
      religarFiltros();
      el.item.value = prox.id;
      mostrar(`${antes}Item ${prox.id} · ${prox.item}.`);
      const url = urlBusca(site, prox.termo);
      if (url) { saindoPeloPainel = true; location.href = url; } else ler(false, `${antes}Item ${prox.id}: página relida. `);
    };
    const bProximo = botao('forward', 'Próximo', `Próximo que falta: vai para o próximo item não coletado neste site e não pulado (primeiro na mesma categoria) e abre a busca dele`, () => irProximo(), 'mini');
    // Pular: marca o item como pulado (a busca não trouxe o item pensado) e vai ao próximo;
    // num item já pulado, o botão vira "Retomar".
    el.bPular = botao('arrow-uturn-right', '', '', () => {
      const item = itemAtual();
      const g = pulados();
      if (item.id in g) {
        delete g[item.id];
        GM_setValue(CHAVE_PULADOS, g);
        mostrar(`${item.id} retomado.`);
        listarOfertas();
        return;
      }
      GM_setValue(CHAVE_PULADOS, { ...g, [item.id]: dataLocal() });
      irProximo(`${item.id} pulado. `);
    }, 'leve');
    el.bGuardar = botao('bookmark', 'Guardar', 'Guardar marcadas: guarda as ofertas marcadas no Tampermonkey', () => {
      // motivo: os filtros que a oferta não passou (marcada à mão); o build a deixa de fora
      const ref = referencia();
      const marcadas = caixasMarcadas().map((m) => ofertasLidas[m.dataset.i])
        .map((o) => ({ ...o, motivo: motivosOferta(o, itemAtual().termo, ref).join('; ') }));
      const guardados = carregar();
      const agora = Date.now();
      const novas = guardar(guardados, itemAtual(), marcadas, el.unidades.value,
        { fonte: site, busca: location.href, data_coleta: dataLocal(), cep: cepAtual(), agora, filtros: filtrosAtuais() });
      const r = revisarAgora(guardados, agora);
      salvar(guardados);
      if (marcadas.length) marcarColetado(itemAtual().id, true);
      const semCep = !(cepAtual() && ehSalvador(cepAtual()));
      if (marcadas.length) kp.confirmarBotao(el.bGuardar);
      mostrar(`${marcadas.length} guardadas (${novas} novas).${r.texto}${semCep ? ' Atenção: sem CEP de Salvador.' : ''}`, semCep ? 'alerta' : 'ok');
      contarMarcadas();
      kp.dica(kp.el.status, r.dica);
    }, 'primario');
    el.bColetado = botao('check', '', '', () => {
      const item = itemAtual();
      const col = coletado(item.id, ofertasPorItem(doSite(ativas(carregar()))));
      marcarColetado(item.id, !col);
      mostrar(col ? `${item.id} volta a faltar em ${site}.` : `${item.id} marcado como coletado em ${site}.`);
    }, 'leve');
    // Importar CSV: refaz as guardadas a partir de exportações anteriores (ex.: depois de
    // reinstalar o script) e revisa tudo.
    const arquivo = criar('input', {
      type: 'file', accept: '.csv,text/csv', multiple: true, hidden: true,
      onchange: async () => {
        const fs = [...arquivo.files].sort((a, b) => b.name.localeCompare(a.name));
        const linhas = [];
        for (const f of fs) linhas.push(...lerCsv(await f.text()));
        arquivo.value = '';
        const g = carregar();
        const agora = Date.now();
        const n = importar(g, linhas, agora);
        const r = revisarAgora(g, agora);
        salvar(g);
        mostrar(`${n} ofertas importadas de ${fs.length} arquivo(s) (${linhas.length - n} já guardadas ou repetidas).${r.texto}`, 'ok');
        kp.dica(kp.el.status, r.dica);
      },
    });
    const bImportar = botao('arrow-up-tray', '', 'Importar CSV: junta às guardadas as ofertas de CSVs exportados (as já guardadas valem sobre o arquivo) e revisa', () => arquivo.click(), 'leve');
    el.bGuardar.disabled = true;
    const bCsv = botao('arrow-down-tray', 'CSV', 'Baixar CSV: um arquivo por categoria, com tudo o que está guardado, em B5_mobiliario/_dados-brutos/ (obra e reforma em B5_reforma/_dados-brutos/)', () => {
      const n = baixarCsv();
      kp.confirmarBotao(bCsv);
      mostrar(`${n} arquivo(s) de categoria baixados.`, 'ok');
    }, 'mini');
    const bLimpar = kp.botaoPerigo('trash', '', reiniciar, { classe: 'leve',
      dica: 'Reiniciar: apaga as ofertas guardadas e o histórico de coleta (coletados por site, pulados e registro das buscas). Baixa antes um backup JSON. Ficam o CEP, os filtros e as preferências' });

    const rotuloIco = (ico, dica) => criar('span', { className: 'rotulo', dica }, [icone(ico)]);
    kp.montar({
      nome: `Preços · ${site}`,
      largura: 360,
      css: CSS_PAINEL,
      filhos: [
        kp.linha([rotuloIco('map-pin', 'CEP usado no site'), el.cep, el.cepAviso], 'compacta'),
        criar('div', { className: 'menu' }, [
          kp.linha([el.item]),
          kp.linha([criar('div', { className: 'contador' }, [el.contagem, criar('div', { className: 'trilho fino' }, [el.contagemBarra])]), bProximo, el.bColetado, el.bPular, soFaltam], 'compacta'),
        ]),
        kp.linha([el.bGuardar]),
        kp.linha([bBuscar, bLer, bSomar, bPadrao]),
        criar('div', { className: 'tags' }, [rotuloIco('adjustments-horizontal', 'Filtros da marcação inicial'), ...filtros,
          rotuloIco('cube', 'Unidades por embalagem: vale para as ofertas sem unidades no título'), el.unidades, el.avisoFiltros]),
        kp.el.status,
        kp.linha([bCsv, bImportar, arquivo, el.pendentes, kp.esp(), bLimpar]),
        criar('div', { className: 'caixa' }, [el.geral, el.resumo]),
        kp.secao('guardadas', [el.guardadasTitulo], [el.guardadas]),
        el.funil,
        el.lista,
      ],
    });
    mostrarCep();
    mostrar();
  }

  // O painel é reposto se o site refizer a página. A página é lida sozinha ao abrir e a cada troca
  // de URL (Amazon, Magalu e Leroy Merlin trocam a busca sem recarregar): a cada verificação até
  // as ofertas pararem de mudar (duas leituras iguais); se forem outras que as da lista, ela é
  // relida, somando se a última leitura foi "Somar página". "Ler ofertas" fica para reler à mão
  // (ex.: depois de rolar a página).
  let urlVista = location.href;
  let espera = null; // { tentativas, ultima } enquanto a página nova carrega
  const ESPERA_MAX = 10; // verificações (15 s) até desistir

  function acompanharTroca() {
    espera.tentativas++;
    const agora = assinatura(lerOfertas(site).ofertas);
    if (agora && agora === espera.ultima) {
      espera = null;
      if (agora !== assinaturaLida) {
        const motivo = !ofertasLidas.length ? 'Ofertas lidas sozinhas. '
          : somando ? `Página ${paginas + 1} somada às anteriores. ` : 'A página mudou: lista relida. ';
        const somou = somando && ofertasLidas.length > 0;
        ler(somou, motivo);
        if (somou) kp.tocar(true); // a página somada terminou de carregar
      }
      return;
    }
    espera.ultima = agora;
    if (espera.tentativas >= ESPERA_MAX) {
      espera = null;
      if (ofertasLidas.length) status(`A página mudou e não terminou de carregar: as ${ofertasLidas.length} ofertas da lista são da anterior. Clique em "Reler".`, 'alerta')
    }
  }

  function retomarSoma() {
    const s = GM_getValue(CHAVE_SOMA, null);
    if (!s) return;
    GM_deleteValue(CHAVE_SOMA);
    if (s.item !== itemAtual().id || Date.now() - s.em > 10 * 60 * 1000) return;
    ofertasLidas = s.ofertas;
    cardsLidos = s.cards;
    leitorLido = s.leitor;
    paginas = s.paginas;
    somando = true;
    listarOfertas();
    status(`Lendo a página ${paginas + 1} para somar às ${ofertasLidas.length} ofertas das anteriores...`);
  }

  function verificar() {
    if (!document.body) return;
    if (!kp.hospedeiro()) { montarPainel(); retomarSoma(); espera = { tentativas: 0, ultima: '' }; }
    kp.garantir();
    if (location.href !== urlVista) {
      urlVista = location.href;
      mostrarCep();
      espera = { tentativas: 0, ultima: '' };
    } else if (espera) {
      acompanharTroca();
    }
  }

  // Aviso ao fechar a aba ou sair por link do site com muitas ofertas fora de CSV.
  if (typeof window !== 'undefined' && window.addEventListener) {
    window.addEventListener('beforeunload', (e) => {
      if (saindoPeloPainel || pendentes(carregar(), GM_getValue(CHAVE_EXPORTACAO, 0)) < AVISO_PENDENTES) return;
      e.preventDefault();
      e.returnValue = '';
    });
  }

  console.info(NOME, 'carregado');
  setInterval(() => { try { verificar(); } catch (e) { console.error(NOME, e); } }, 1500);
})();
