// ==UserScript==
// @name         Coletor de preços dos itens (TCC Luderia)
// @namespace    tcc-luderia
// @version      2026.11.02-8
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
 *     "Buscar aqui" abre a busca do site com o termo do item. No seletor, os itens vêm em grupos
 *     por categoria: os que já têm oferta guardada esmaecidos (✓ e o número de ofertas), os que
 *     faltam na cor da categoria (com 1 ou 2 ofertas, em âmbar com ⚠). "Só os que faltam" esconde
 *     os completos; "Próximo que falta" pula para o próximo item abaixo do mínimo (primeiro na
 *     mesma categoria) e abre a busca dele. Com 25+ ofertas fora de CSV, o painel cobra o download
 *     e o navegador pede confirmação ao fechar a aba.
 *  2. A página é lida sozinha ao abrir, ao trocar de página e ao trocar de item ("Ler ofertas"
 *     relê à mão, ex.: depois de rolar): o painel lista as ofertas com preço, frete e tipo de preço; já
 *     vêm marcadas as que têm no título metade ou mais das palavras do termo, todas as
 *     palavras exigidas do item e nenhuma excluída, e que não são patrocinadas, combo com
 *     acessório ("+ 30 bobinas") nem variante de cor ou voltagem de outra da lista. Desmarcar
 *     o que não é o item (outro tamanho, peça avulsa, acessório).
 *     "Somar página" acrescenta as ofertas de outra página ou das que carregaram ao rolar.
 *  3. Se o anúncio vende em caixa, jogo ou kit (pratos, copos), as unidades vêm do título
 *     ("caixa com 24", "(2 un.)") no campo de cada linha, que se pode corrigir; sem elas, vale
 *     "Unidades por embalagem". O preço guardado é o da unidade da lista.
 *  4. "Guardar marcadas". Repetir em outros sites e itens; os dados ficam no Tampermonkey
 *     (comuns a todos os sites). "Guardadas deste item" lista as ofertas do item, com ✕ para
 *     excluir uma: a exclusão vai no CSV (excluida = 1) e o build a respeita.
 *  5. "Baixar CSV": um arquivo por categoria, AAAA-MM-DD_HHmm_<categoria>_precos.csv, com
 *     tudo o que está guardado, para dados/[B5] Ativos fixos/_dados-brutos/<categoria>/.
 *     Depois, rodar build/B5-b_orcamento_itens.py, que junta os arquivos e fica, para cada
 *     item e URL, com a linha do arquivo mais recente. "Limpar" baixa antes um backup JSON.
 *  Em página de produto, a leitura pega o produto pelo JSON-LD (schema.org Product).
 *  "Revisar guardadas" exclui as guardadas (de todos os itens) que não passam nas regras e
 *  nos filtros de agora, sem a faixa de preço: serve às coletas feitas antes das regras.
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
  const AVISO_PENDENTES = 25; // guardadas ou excluídas fora de CSV a partir das quais o painel cobra o download
  const MIN_OFERTAS = 3; // o build usa P25, mediana e P75: abaixo disso o item fica frágil
  const FAIXA = [0.3, 3]; // F2: oferta fora de 0,3× a 3× a mediana do item fica desmarcada
  const DISPERSAO_MAX = 3; // A4: P75/P25 acima disso sugere produtos diferentes no mesmo item
  const IDADE_MAX = 30; // A7: dias até a coleta mais antiga do item pedir revisão
  const FILTROS_PADRAO = { faixa: true, medida: true, avaliacoes: true };

  const lista = (s) => String(s || '').split('|').map((p) => p.trim()).filter(Boolean);

  // Itens de fonte "coleta" da lista da etapa 1: [id, categoria, item, termo de busca, palavras
  // exigidas, palavras excluídas] (colunas termo_busca, termo_exige e termo_exclui; "|" separa
  // as palavras e "/" separa alternativas).
  // O teste (precos_itens.test.cjs) confere esta lista com o CSV.
  const ITENS = [
    ['OB40', 'obra_reforma', 'Ar-condicionado split', 'ar condicionado split 30000 btus inverter', 'split|inverter', 'janela|portatil|on off|controle remoto|suporte|capa'],
    ['OB41', 'obra_reforma', 'Instalação do split', 'kit instalacao ar condicionado split 30000 btus 5 metros', 'kit|instala', 'suporte avulso|dreno|bomba|capa|controle'],
    ['OB42', 'obra_reforma', 'Letreiro de fachada', 'fachada acm letra caixa iluminada led', 'fachada/letreiro|acm', 'adesivo|neon|mini|mesa|placa de sinalizacao|letra avulsa'],
    ['MO01', 'mobiliario', 'Mesa de jogo para 6 lugares', 'mesa retangular restaurante 160x80 tampo madeira pe ferro', 'mesa', 'cadeira|conjunto|jogo de jantar|banco|dobravel|infantil|escritorio|centro|bistro'],
    ['MO02', 'mobiliario', 'Mesa de jogo para 4 lugares', 'mesa quadrada restaurante 80x80 tampo madeira pe ferro', 'mesa|quadrada', 'cadeira|conjunto|jogo de jantar|banco|dobravel|infantil|centro|lateral|bistro|alta'],
    ['MO03', 'mobiliario', 'Cadeira', 'cadeira restaurante estofada encosto madeira', 'cadeira', 'gamer|escritorio|giratoria|rodizio|infantil|praia|capa|almofada|poltrona|banqueta|bistro|alta'],
    ['MO04', 'mobiliario', 'Luminária pendente sobre a mesa', 'luminaria pendente cupula metal e27 mesa jantar', 'pendente', 'abajur|luminaria de mesa|trilho|spot|arandela|lampada avulsa|plafon|fita'],
    ['MO05', 'mobiliario', 'Estante do acervo', 'estante industrial aco madeira 5 prateleiras 180 cm', 'estante|5 prateleira', 'sapateira|banheiro|plastica|plastico|mini|nicho|parede|escada'],
    ['MO06', 'mobiliario', 'Balcão de atendimento e caixa', 'balcao caixa atendimento loja recepcao mdf 180 cm', 'balcao', 'cozinha|pia|banheiro|gabinete|buffet|aereo|rack|tv|mini'],
    ['MO07', 'mobiliario', 'Armário de funcionários', 'armario roupeiro aco 8 portas vestiario', 'roupeiro/vestiario|aco', 'guarda roupa|mdf|infantil|casal|solteiro|cabideiro'],
    ['CB01', 'cozinha_bar', 'Fogão industrial', 'fogao industrial 4 bocas com forno', 'industrial', 'sem forno|embutir|cooktop|mesa vidro'],
    ['CB02', 'cozinha_bar', 'Chapa bifeteira', 'chapa bifeteira industrial gas 70cm', 'chapa|gas', 'ferro fundido|para fogao|eletrica|grill|sanduicheira'],
    ['CB03', 'cozinha_bar', 'Fritadeira', 'fritadeira industrial 2 cubas', 'fritadeira|2 cuba/dupla', 'air fryer|airfryer|sem oleo|cesto avulso'],
    ['CB04', 'cozinha_bar', 'Forno elétrico de bancada', 'forno eletrico industrial bancada', 'industrial/comercial/profissional', 'air fryer|airfryer|micro ondas'],
    ['CB05', 'cozinha_bar', 'Coifa com exaustor', 'coifa industrial inox 150 cm com motor exaustor', 'coifa|industrial', 'depurador|ilha|vidro|filtro avulso|carvao|60 cm|90 cm'],
    ['CB06', 'cozinha_bar', 'Geladeira comercial', 'refrigerador comercial 4 portas', '4 porta', 'frigobar|cervejeira|vidro'],
    ['CB07', 'cozinha_bar', 'Freezer horizontal', 'freezer horizontal 2 tampas 400 litros', 'horizontal', 'vertical|1 tampa|1 porta'],
    ['CB08', 'cozinha_bar', 'Expositor de bebidas', 'expositor vertical bebidas porta vidro', 'vertical|vidro', 'frigobar|mini|cooler'],
    ['CB09', 'cozinha_bar', 'Mesa de inox', 'mesa inox 150 cm cozinha industrial', 'inox', 'escrivaninha|escritorio|gamer|computador|jantar|centro|dobravel'],
    ['CB10', 'cozinha_bar', 'Pia industrial', 'pia inox industrial 2 cubas', 'industrial|2 cuba/dupla', 'embutir|sobrepor|gourmet|torneira|tanque'],
    ['CB11', 'cozinha_bar', 'Liquidificador industrial', 'liquidificador industrial 4 litros', 'industrial', 'portatil|mini|copo avulso|jarra avulsa'],
    ['CB12', 'cozinha_bar', 'Multiprocessador', 'processador de alimentos industrial', 'industrial/comercial/profissional', 'manual|mini|usb|disco avulso|lamina avulsa'],
    ['CB13', 'cozinha_bar', 'Micro-ondas', 'micro-ondas 30 litros', 'micro ondas', 'suporte|prato giratorio|prato avulso|capa'],
    ['CB14', 'cozinha_bar', 'Kit de gás', 'kit regulador gas p45 alta vazao mangueira', 'regulador', 'p13|fogareiro|macarico|maçarico|botijao p13'],
    ['CB15', 'cozinha_bar', 'Utensílios de cozinha', 'kit panelas aluminio grosso industrial hotel', 'panela|industrial/hotel/restaurante', 'brinquedo|infantil|miniatura|tampa avulsa|panela de pressao eletrica'],
    ['CB16', 'cozinha_bar', 'Pratos', 'prato raso porcelana branco 26 cm kit 12', 'prato|raso', 'descartavel|papel|suporte|porta prato|sobremesa|fundo|infantil|decorativo|bolo'],
    ['CB17', 'cozinha_bar', 'Copos', 'copo long drink vidro 300 ml caixa 24', 'copo|long', 'acrilico|plastico|descartavel|taca|caneca|termico|personalizado|gravado|canudo'],
    ['CB18', 'cozinha_bar', 'Talheres', 'kit garfo e faca de mesa inox restaurante 12 pares', 'garfo|faca', 'colher|sobremesa|descartavel|plastico|infantil|faqueiro|churrasco|bolo|peixe'],
    ['CB19', 'cozinha_bar', 'Estante de aço', 'estante aço 5 prateleiras', 'aco', 'sapateira|plastica|plastico|banheiro|mini'],
    ['CB20', 'cozinha_bar', 'Lava-louças', 'lava loucas industrial capota inox', 'capota/industrial', 'servicos|detergente|secante|pastilha|cesto avulso|bancada'],
    ['EQ01', 'equipamentos', 'Computador', 'notebook intel core i5 8gb ssd 256gb', 'notebook|i5', 'recondicionado|usado|seminovo|capa|mochila|suporte|carregador|bateria|para notebook|teclado|memoria'],
    ['EQ02', 'equipamentos', 'Impressora de NFC-e', 'impressora termica nao fiscal 80mm', '80 mm', 'etiqueta|portatil|a4|sem tinta'],
    ['EQ03', 'equipamentos', 'Maquininha de cartão', 'maquininha de cartao credito debito pix chip', 'maquininha/maquina', 'bobina|capa|carregador|bateria|pelicula|suporte|cabo|bolsa|case'],
    ['EQ04', 'equipamentos', 'Roteador Wi-Fi', 'roteador wifi 6 dual band', 'wi fi 6/wifi 6/ax', 'repetidor|xpon|ont|wi fi 7|wifi 7|4g|chip'],
    ['EQ05', 'equipamentos', 'Som ambiente', 'caixa de som ativa amplificada 10 polegadas bivolt', 'caixa|ativa/amplificada', 'portatil|karaoke|automotivo|carro|mini|alto falante|capa|suporte|cabo|trio'],
    ['EQ06', 'equipamentos', 'Câmeras', 'kit cftv 4 cameras full hd dvr 4 canais', 'kit|dvr/nvr', 'fonte avulsa|conector|balun|cabo|suporte|caixa hermetica|falsa|fake|bateria'],
  ].map(([id, categoria, item, termo, exige, exclui]) => ({ id, categoria, item, termo, exige: lista(exige), exclui: lista(exclui) }));

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
  // pratos" (a palavra é a principal do termo: a primeira com 4 letras ou mais). Combo: o kit ou
  // o "+" traz algo fora do termo ("+ 30 bobinas", "kit com 2 bobinas"); conexões ("USB + LAN")
  // não contam. Palavra do termo que não é a principal ("kit 4 câmeras") é a especificação.
  const CONEXOES = new Set(['usb', 'lan', 'wifi', 'wi', 'bluetooth', 'ethernet', 'serial', 'rede', 'hdmi', 'nfc', 'pix', 'debito', 'credito', 'chip', 'mais']);
  function kitDe(titulo, termo) {
    const t = palavras(titulo).join(' ');
    const doTermo = palavras(termo).filter((p) => p.length >= 3 && !/\d/.test(p));
    const principal = doTermo.find((p) => p.length >= 4) || '';
    const casa = (w, p) => w.startsWith(p) || p.startsWith(w.replace(/e?s$/, ''));
    const papel = (w) => (!w || (principal && casa(w, principal)) ? 'item' : doTermo.some((p) => casa(w, p)) ? 'spec' : 'fora');
    const mais = String(titulo || '').match(/\+\s*(?:\d+\s*)?([A-Za-zÀ-ú]{3,})/);
    if (mais && !CONEXOES.has(semAcento(mais[1])) && papel(semAcento(mais[1])) === 'fora') return { combo: semAcento(mais[1]) };
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
  const CORES = new Set(['preto', 'preta', 'branco', 'branca', 'cinza', 'azul', 'amarelo', 'amarela', 'vermelho', 'vermelha', 'verde', 'rosa', 'prata', 'dourado', 'dourada', 'marrom', 'bege', 'grafite', 'cor', 'cores']);
  function chaveVariante(o) {
    const t = palavras(o.produto).join(' ')
      .replace(/(^| )(110|127|220)( v| volts?)(?= |$)/g, ' ')
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
    if (o.varianteDe) m.push(`variante de: ${o.varianteDe.slice(0, 40)}`);
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
    for (const [id, ls] of Object.entries(porItem)) {
      const item = ITENS.find((i) => i.id === id);
      if (!item) continue;
      ls.sort((a, b) => a[0].localeCompare(b[0]));
      const anotadas = marcarVariantes(ls.map(([, l]) => l));
      anotadas.forEach((o, i) => {
        const m = motivosOferta({ ...o, patrocinado: false }, item.termo, { filtros: { ...filtros, faixa: false }, regras: item });
        const kit = kitDe(o.produto, item.termo);
        if (kit.unidades && Number(o.unidades) !== kit.unidades) m.push(`kit de ${kit.unidades} un., guardada com ${o.unidades}`);
        if (m.length) fora.push({ k: ls[i][0], id, produto: o.produto, motivos: m });
      });
    }
    return fora;
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
        url: o.url, busca: o.busca || contexto.busca, data_coleta: contexto.data_coleta, motivo: o.motivo || '', excluida: 0,
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

  const COLS = ['id_item', 'categoria', 'fonte', 'produto', 'preco', 'frete', 'preco_anuncio', 'unidades', 'tipo_preco', 'preco_sem_pix', 'cep', 'avaliacoes', 'leitor', 'url', 'busca', 'data_coleta', 'motivo', 'excluida'];

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

  const itemAtual = () => ITENS.find((i) => i.id === GM_getValue(CHAVE_ITEM, ITENS[0].id)) || ITENS[0];
  const cepAtual = () => cepDoSite() || GM_getValue(CHAVE_CEP, '');
  const filtrosAtuais = () => ({ ...FILTROS_PADRAO, ...GM_getValue(CHAVE_FILTROS, {}) });

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
    GM_setValue(CHAVE_EXPORTACAO, agora.getTime());
    return Object.keys(porCategoria).length;
  }

  // ---------- painel (padrão: canto superior direito, shadow DOM, fora do <body>) ----------

  const el = {};
  let hospedeiro = null;
  let saindoPeloPainel = false; // "Buscar aqui" e "Próximo que falta" não disparam o aviso de CSV pendente

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
    option.obra_reforma{color:#c2410c} option.cozinha_bar{color:#1d4ed8}
    option.mobiliario{color:#15803d} option.equipamentos{color:#7e22ce}
    option.coletado{color:#9ca3af} option.fraco{color:#b45309}
    input[type=number]{width:52px} input.cep{width:90px} li input.u{width:40px;flex:0 0 auto}
    ul{list-style:none;margin:6px 0;padding:0;max-height:40vh;overflow:auto}
    li{display:flex;gap:6px;align-items:flex-start;padding:3px 0;border-bottom:1px solid rgba(128,128,128,.25);font-size:12px}
    li span{flex:1} li b{white-space:nowrap}
    li i{display:block;font-style:normal;font-size:11px;opacity:.75}
    label{font-size:12px;display:flex;gap:3px;align-items:center}
    .barra{display:inline-block;width:80px;height:8px;border:1px solid #888;border-radius:4px;vertical-align:middle;overflow:hidden}
    .barra>span{display:block;height:100%;background:currentColor}
    details{margin:6px 0} summary{cursor:pointer;font-size:12px}
    .resumo{font-size:12px} .alerta{color:#b45309} .ok{color:#15803d}
    @media (prefers-color-scheme:dark){.alerta{color:#fbbf24}.ok{color:#4ade80}}
    .status{font-size:12px;opacity:.8}`;

  const status = (t) => { if (el.status) el.status.textContent = t; };
  const reais = (v) => (v == null ? '–' : `R$ ${v.toFixed(2).replace('.', ',')}`);
  const ROTULO_TIPO = { pix: ' [Pix]', cupom: ' [cupom]', padrao: '' };
  const ROTULO_LEITOR = { proprio: `próprio do site`, jsonld: 'JSON-LD', generico: 'genérico', nenhum: 'nenhum' };
  const decimal = (v) => String(v).replace('.', ',');
  const quando = (ms) => { const d = new Date(ms); return `${doisDig(d.getDate())}/${doisDig(d.getMonth() + 1)} ${doisDig(d.getHours())}h${doisDig(d.getMinutes())}`; };

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

    // A8: o que mudou desde o último CSV
    const exportadoEm = GM_getValue(CHAVE_EXPORTACAO, 0);
    const pend = pendentes(guardados, exportadoEm);
    el.pendentes.className = pend ? 'resumo alerta' : 'resumo ok';
    el.pendentes.textContent = pend
      ? `${pend} oferta(s) guardadas ou excluídas desde o último CSV${exportadoEm ? ` (${quando(exportadoEm)})` : ' (nenhum baixado ainda)'}`
        + `${pend >= AVISO_PENDENTES ? ' ⚠ baixe o CSV: os dados só estão no Tampermonkey' : ''}`
      : exportadoEm ? `CSV em dia (baixado em ${quando(exportadoEm)})` : 'Nada guardado ainda.';

    // A2: cobertura da categoria do item
    const c = coberturaCategoria(guardados, item.categoria);
    el.categoria.className = c.completos === c.itens ? 'resumo ok' : 'resumo';
    const preenchido = criar('span');
    preenchido.style.width = `${Math.round((100 * c.completos) / c.itens)}%`;
    el.categoria.replaceChildren(
      criar('span', { textContent: `Categoria ${item.categoria}: ${c.completos} de ${c.itens} itens com ${MIN_OFERTAS}+ ofertas (${c.comPreco} com alguma) ` }),
      criar('span', { className: 'barra' }, [preenchido]),
    );

    // A4 e A7: dispersão e idade da coleta do item
    const alertas = [];
    if (r.n && r.n < MIN_OFERTAS) alertas.push(`faltam ${MIN_OFERTAS - r.n} para o mínimo`);
    if (r.dispersao > DISPERSAO_MAX) alertas.push(`P75/P25 de ${decimal(r.dispersao)}×: produtos diferentes?`);
    if (r.idade > IDADE_MAX) alertas.push(`coleta mais antiga com ${r.idade} dias`);
    el.resumo.className = r.n >= MIN_OFERTAS && !alertas.length ? 'resumo ok' : 'resumo alerta';
    el.resumo.textContent = r.n
      ? `Este item: ${r.n} ofertas de ${r.sites} site(s) · mediana ${reais(r.mediana)} (${reais(r.min)} a ${reais(r.max)}, preço + frete)`
        + `${r.n > 1 ? ` · P25 ${reais(r.p25)}, P75 ${reais(r.p75)} (${decimal(r.dispersao)}×)` : ''}`
        + `${r.semFrete ? ` · ${r.semFrete} sem frete informado` : ''}${r.pixCupom ? ` · ${r.pixCupom} no Pix ou cupom` : ''}`
        + `${r.leitores.length ? ` · leitor ${r.leitores.map((l) => ROTULO_LEITOR[l] || l).join(', ')}` : ''}`
        + ` · desde ${r.maisAntiga}${alertas.length ? ` · ⚠ ${alertas.join('; ')}` : ''}`
      : 'Este item ainda não tem ofertas guardadas.';
    rotularItens(lista);
    listarGuardadas(guardados, item);
    if (t) status(t);
  }

  // Itens do seletor: com o mínimo de ofertas, esmaecidos (✓ e o número de ofertas); com
  // alguma, abaixo do mínimo, em âmbar (⚠); sem oferta, na cor e com a marca da categoria. A marca
  // vale onde o menu nativo ignora a cor. "Só os que faltam" esconde os completos (menos o atual).
  const MARCA_CATEGORIA = { obra_reforma: '🟠', cozinha_bar: '🔵', mobiliario: '🟢', equipamentos: '🟣' };
  const ofertasPorItem = (lista) => {
    const n = {};
    for (const l of lista) n[l.id_item] = (n[l.id_item] || 0) + 1;
    return n;
  };
  function rotularItens(lista) {
    const n = ofertasPorItem(lista);
    const soFaltam = GM_getValue(CHAVE_SO_FALTAM, false);
    const atual = itemAtual().id;
    for (const o of el.item.querySelectorAll('option')) {
      const i = ITENS.find((x) => x.id === o.value);
      const k = n[i.id] || 0;
      o.className = k >= MIN_OFERTAS ? 'coletado' : k ? 'fraco' : i.categoria;
      o.textContent = k >= MIN_OFERTAS ? `✓ ${i.id} · ${i.item} (${k})`
        : k ? `⚠ ${i.id} · ${i.item} (${k} de ${MIN_OFERTAS})` : `${MARCA_CATEGORIA[i.categoria] || '⚪'} ${i.id} · ${i.item}`;
      o.hidden = soFaltam && k >= MIN_OFERTAS && i.id !== atual;
    }
    for (const g of el.item.querySelectorAll('optgroup')) g.hidden = [...g.querySelectorAll('option')].every((o) => o.hidden);
  }

  // Próximo item abaixo do mínimo de ofertas: primeiro na categoria do atual, depois nas outras,
  // seguindo a ordem da lista a partir do atual.
  function proximoQueFalta(lista, atual) {
    const n = ofertasPorItem(lista);
    const i0 = ITENS.findIndex((i) => i.id === atual.id);
    const ordem = [...ITENS.slice(i0 + 1), ...ITENS.slice(0, i0)].filter((i) => (n[i.id] || 0) < MIN_OFERTAS);
    return ordem.find((i) => i.categoria === atual.categoria) || ordem[0] || null;
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

  // Referência dos filtros: mediana do item guardado, unidades por embalagem e filtros ligados.
  const referencia = () => ({ mediana: resumoItem(carregar(), itemAtual().id).mediana, unidades: el.unidades.value, filtros: filtrosAtuais(), regras: itemAtual() });

  // Unidades de cada oferta: a digitada na linha; senão, a do kit no título ("caixa com 24");
  // senão, a do campo do painel.
  const unidadesDe = (o) => o.unidadesManual ?? kitDe(o.produto, itemAtual().termo).unidades ?? (Number(el.unidades.value) || 1);

  function listarOfertas() {
    const item = itemAtual();
    const ref = referencia();
    el.lista.replaceChildren(...ofertasLidas.map((o, i) => {
      o.unidades = unidadesDe(o);
      const motivos = motivosOferta(o, item.termo, ref);
      const marca = criar('input', { type: 'checkbox', checked: !motivos.length });
      marca.dataset.i = i;
      const u = criar('input', {
        type: 'number', min: 1, value: o.unidades, className: 'u', title: 'Unidades da lista neste anúncio (caixa, jogo ou kit)',
        onchange: () => { o.unidadesManual = Math.max(1, Number(u.value) || 1); o.unidades = o.unidadesManual; },
      });
      const frete = o.frete == null ? '' : o.frete === 0 ? ' + frete grátis' : ` + ${reais(o.frete)}`;
      const avaliacoes = o.avaliacoes == null ? '' : ` · ${o.avaliacoes} avaliações`;
      const semPix = o.preco_sem_pix ? ` (sem Pix ${reais(o.preco_sem_pix)})` : '';
      const notas = [];
      if (motivos.length) notas.push(criar('i', { textContent: `desmarcada: ${motivos.join('; ')}` }));
      if (o.unidades > 1) notas.push(criar('i', { textContent: `${o.unidades} unidades: ${reais(o.preco / o.unidades)} cada` }));
      return criar('li', {}, [marca, criar('span', { textContent: o.produto }, notas), u,
        criar('b', { textContent: `${reais(o.preco)}${frete}${ROTULO_TIPO[o.tipo_preco] || ''}${semPix}${avaliacoes}` })]);
    }));
    el.bGuardar.disabled = !ofertasLidas.length;
    mostrarFunil();
  }

  // A1 e A6: funil da leitura e leitor usado, com alerta se o site tem leitor próprio e ele falhou.
  function mostrarFunil() {
    if (!ofertasLidas.length && !cardsLidos) { el.funil.textContent = ''; return; }
    const f = funil(ofertasLidas, cardsLidos, itemAtual().termo, referencia());
    const falhou = TEM_LEITOR_PROPRIO.includes(site) && leitorLido !== 'proprio';
    el.funil.className = falhou || !f.nosFiltros ? 'resumo alerta' : 'resumo';
    el.funil.textContent = `Funil: ${f.cards} cards → ${f.comPreco} com preço → ${f.semPatrocinado} sem patrocinado → ${f.noTermo} no termo → ${f.nosFiltros} nos filtros`
      + ` · leitor ${ROTULO_LEITOR[leitorLido] || leitorLido}${falhou ? ' ⚠ o seletor do site não leu: o layout pode ter mudado' : ''}`;
  }

  const caixasMarcadas = () => [...el.lista.querySelectorAll('input[type=checkbox]')].filter((m) => m.checked);

  function ler(somar, motivo = '') {
    const { ofertas, cards, leitor } = lerOfertas(site);
    const antes = ofertasLidas.length;
    ofertasLidas = somar ? somarOfertas(ofertasLidas, ofertas) : ofertas;
    cardsLidos = somar ? cardsLidos + cards : cards;
    leitorLido = somar && leitorLido && leitorLido !== leitor ? `${leitorLido}+${leitor}` : leitor;
    urlLida = location.href;
    assinaturaLida = assinatura(ofertas);
    somando = somar;
    listarOfertas();
    const marcadas = caixasMarcadas().length;
    const novas = ofertasLidas.length - (somar ? antes : 0);
    status(!ofertasLidas.length ? `${motivo}Nenhuma oferta com preço nesta página.`
      : `${motivo}${somar ? `+${novas} novas; ` : ''}${ofertasLidas.length} ofertas com preço de ${cardsLidos} cards lidos, ${marcadas} marcadas pelo termo e pelos filtros. Desmarque o que não é o item.`);
  }

  function montarPainel() {
    el.item = criar('select', {
      onchange: () => { GM_setValue(CHAVE_ITEM, el.item.value); mostrar(); ler(false, 'Item trocado: página relida com as regras dele. '); },
    }, [...new Set(ITENS.map((i) => i.categoria))].map((c) => criar('optgroup', { label: c },
      ITENS.filter((i) => i.categoria === c).map((i) => criar('option', { value: i.id, textContent: `${i.id} · ${i.item}` })))));
    el.item.value = itemAtual().id;
    el.cep = criar('input', {
      className: 'cep', placeholder: '40000-000', value: GM_getValue(CHAVE_CEP, ''),
      onchange: () => { GM_setValue(CHAVE_CEP, cepDe(el.cep.value) || ''); el.cep.value = GM_getValue(CHAVE_CEP, ''); mostrarCep(); },
    });
    el.cepAviso = criar('p');
    el.contagem = criar('p', { className: 'resumo' });
    el.pendentes = criar('p');
    el.categoria = criar('p');
    el.resumo = criar('p');
    el.funil = criar('p');
    // F2, F3 e F5: filtros da marcação inicial, guardados no Tampermonkey
    const ROTULO_FILTRO = { faixa: 'faixa de preço', medida: 'medida', avaliacoes: 'sem avaliações (Amazon)' };
    const filtros = criar('div', { className: 'linha' }, [criar('span', { textContent: 'Filtros:' }), ...Object.keys(FILTROS_PADRAO).map((k) => {
      const caixa = criar('input', {
        type: 'checkbox', checked: filtrosAtuais()[k],
        onchange: () => { GM_setValue(CHAVE_FILTROS, { ...filtrosAtuais(), [k]: caixa.checked }); listarOfertas(); },
      });
      return criar('label', {}, [caixa, criar('span', { textContent: ROTULO_FILTRO[k] })]);
    })]);
    el.status = criar('p', { className: 'status', textContent: 'Escolha o item, busque e leia as ofertas.' });
    el.unidades = criar('input', { type: 'number', min: 1, value: 1, onchange: () => listarOfertas() });
    el.lista = criar('ul');
    el.guardadas = criar('ul');
    el.guardadasTitulo = criar('summary');
    const bBuscar = criar('button', {
      textContent: 'Buscar aqui',
      disabled: !urlBusca(site, 'x'),
      onclick: () => { saindoPeloPainel = true; location.href = urlBusca(site, itemAtual().termo); },
    });
    const bLer = criar('button', { textContent: 'Ler ofertas', onclick: () => ler(false) });
    const bProximo = criar('button', {
      textContent: 'Próximo que falta',
      title: `Pula para o próximo item com menos de ${MIN_OFERTAS} ofertas (primeiro na mesma categoria) e abre a busca dele`,
      onclick: () => {
        const prox = proximoQueFalta(ativas(carregar()), itemAtual());
        if (!prox) { status(`Todos os itens têm ${MIN_OFERTAS}+ ofertas.`); return; }
        GM_setValue(CHAVE_ITEM, prox.id);
        el.item.value = prox.id;
        mostrar(`Item ${prox.id} · ${prox.item}.`);
        const url = urlBusca(site, prox.termo);
        if (url) { saindoPeloPainel = true; location.href = url; } else ler(false, `Item ${prox.id}: página relida com as regras dele. `);
      },
    });
    const soFaltam = criar('input', {
      type: 'checkbox', checked: GM_getValue(CHAVE_SO_FALTAM, false),
      onchange: () => { GM_setValue(CHAVE_SO_FALTAM, soFaltam.checked); mostrar(); },
    });
    // F4: desmarca as ofertas de Pix ou cupom, para comparar só preços padrão
    const bPadrao = criar('button', {
      textContent: 'Só preço padrão',
      title: 'Desmarca as ofertas com preço de Pix ou cupom',
      onclick: () => {
        let n = 0;
        for (const m of caixasMarcadas()) if ((ofertasLidas[m.dataset.i].tipo_preco || 'padrao') !== 'padrao') { m.checked = false; n++; }
        status(`${n} oferta(s) de Pix ou cupom desmarcadas; ${caixasMarcadas().length} marcadas.`);
      },
    });
    const bSomar = criar('button', { textContent: 'Somar página', title: 'Acrescenta as ofertas desta página (ou das que carregaram ao rolar) às já lidas', onclick: () => ler(true) });
    el.bGuardar = criar('button', {
      textContent: 'Guardar marcadas',
      disabled: true,
      onclick: () => {
        // motivo: os filtros que a oferta não passou (marcada à mão); o build a deixa de fora
        const ref = referencia();
        const marcadas = caixasMarcadas().map((m) => ofertasLidas[m.dataset.i])
          .map((o) => ({ ...o, motivo: motivosOferta(o, itemAtual().termo, ref).join('; ') }));
        const guardados = carregar();
        const novas = guardar(guardados, itemAtual(), marcadas, el.unidades.value,
          { fonte: site, busca: location.href, data_coleta: dataLocal(), cep: cepAtual(), agora: Date.now() });
        salvar(guardados);
        const comMotivo = marcadas.filter((o) => o.motivo).length;
        mostrar(`${marcadas.length} guardadas (${novas} novas).${comMotivo ? ` ${comMotivo} fora dos filtros: vão com motivo e o build as deixa de fora.` : ''}${cepAtual() && ehSalvador(cepAtual()) ? '' : ' Atenção: sem CEP de Salvador.'}`);
      },
    });
    const bCsv = criar('button', { textContent: 'Baixar CSV', onclick: () => status(`${baixarCsv()} arquivo(s) de categoria baixados.`) });
    // Exclui as guardadas (de todos os itens) que as regras e os filtros de agora não aceitam.
    const bRevisar = criar('button', {
      textContent: 'Revisar guardadas',
      title: 'Exclui as guardadas que não passam nas regras do item e nos filtros ligados (sem a faixa de preço)',
      onclick: () => {
        const g = carregar();
        const fora = revisarGuardadas(g, filtrosAtuais());
        if (!fora.length) { status('Todas as guardadas passam nas regras e nos filtros.'); return; }
        const porItem = {};
        for (const f of fora) porItem[f.id] = (porItem[f.id] || 0) + 1;
        const exemplos = fora.slice(0, 5).map((f) => `${f.id} ${f.produto.slice(0, 40)}: ${f.motivos.join('; ')}`).join('\n');
        if (!confirm(`${fora.length} guardadas não passam (${Object.entries(porItem).map(([id, n]) => `${id} ${n}`).join(', ')}).\n\n${exemplos}\n\nExcluir todas? A exclusão vai no próximo CSV.`)) return;
        const agora = Date.now();
        for (const f of fora) excluir(g, f.k, agora);
        salvar(g);
        mostrar(`${fora.length} guardadas excluídas pela revisão. Baixe o CSV para levar a exclusão ao build.`);
      },
    });
    const bLimpar = criar('button', {
      textContent: 'Limpar',
      onclick: () => {
        const pend = pendentes(carregar(), GM_getValue(CHAVE_EXPORTACAO, 0));
        if (!confirm(`Apagar todas as ofertas guardadas?${pend ? ` ${pend} ainda não estão em nenhum CSV.` : ''} Um backup JSON será baixado antes.`)) return;
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
      criar('div', { className: 'linha' }, [criar('label', {}, [soFaltam, criar('span', { textContent: `só os que faltam (menos de ${MIN_OFERTAS} ofertas)` })]), bProximo]),
      el.contagem,
      el.pendentes,
      el.categoria,
      el.resumo,
      criar('details', {}, [el.guardadasTitulo, el.guardadas]),
      filtros,
      criar('div', { className: 'linha' }, [criar('span', { textContent: 'Unidades por embalagem:' }), el.unidades, el.bGuardar]),
      criar('div', { className: 'linha' }, [bCsv, bRevisar, bLimpar]),
      criar('div', { className: 'linha' }, [bBuscar, bLer, bSomar, bPadrao]),
      el.funil,
      el.lista,
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
          : somando ? 'A página mudou: ofertas dela somadas às já lidas. ' : 'A página mudou: lista relida. ';
        ler(somando && ofertasLidas.length > 0, motivo);
      }
      return;
    }
    espera.ultima = agora;
    if (espera.tentativas >= ESPERA_MAX) {
      espera = null;
      if (ofertasLidas.length) status(`A página mudou e não terminou de carregar: as ${ofertasLidas.length} ofertas da lista são da anterior. Clique em "Ler ofertas".`);
    }
  }

  function verificar() {
    if (!document.body) return;
    if (!hospedeiro) { montarPainel(); espera = { tentativas: 0, ultima: '' }; }
    if (!hospedeiro.isConnected) document.documentElement.appendChild(hospedeiro);
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
