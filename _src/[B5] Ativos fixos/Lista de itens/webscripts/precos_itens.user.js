// ==UserScript==
// @name         Coletor de preços dos itens (TCC Luderia)
// @namespace    tcc-luderia
// @version      2026.11.03-2
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
 *     "Somar página" acrescenta as ofertas de outra página ou das que carregaram ao rolar.
 *  3. Se o anúncio vende em caixa, jogo ou kit (pratos, copos), as unidades vêm do título
 *     ("caixa com 24", "(2 un.)") no campo de cada linha, que se pode corrigir; sem elas, vale
 *     "Unidades por embalagem". O preço guardado é o da unidade da lista.
 *  4. "Guardar marcadas". Repetir em outros sites e itens; os dados ficam no Tampermonkey
 *     (comuns a todos os sites). "Guardadas deste item" lista as ofertas do item, com um X para
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
  const CHAVE_PULADOS = 'tcc_precos_pulados'; // { id_item: data em que foi pulado }
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
    ['MO01', 'mobiliario', 'Mesa de jogo para 6 lugares', 'mesa industrial 160x80 tampo pinus pe metal preto', 'mesa|industrial/metal/ferro/aco/metalon', 'cadeira|conjunto|jogo de jantar|banco|dobravel|infantil|escritorio|centro|bistro|vidro|marmore|laca'],
    ['MO02', 'mobiliario', 'Mesa de jogo para 4 lugares', 'mesa industrial quadrada 80x80 tampo pinus pe metal preto', 'mesa|quadrada|industrial/metal/ferro/aco/metalon', 'cadeira|conjunto|jogo de jantar|banco|dobravel|infantil|centro|lateral|bistro|alta|vidro|marmore|laca'],
    ['MO03', 'mobiliario', 'Cadeira', 'cadeira industrial metal preta assento madeira', 'cadeira|metal/ferro/aco/industrial', 'gamer|escritorio|giratoria|rodizio|infantil|praia|capa|almofada|poltrona|banqueta|bistro|alta|estofada|veludo|plastico'],
    ['MO04', 'mobiliario', 'Luminária pendente sobre a mesa', 'luminaria pendente industrial cupula metal preto e27', 'pendente|preto/preta', 'abajur|luminaria de mesa|trilho|spot|arandela|lampada avulsa|plafon|fita|dourado|cristal|rose'],
    ['MO05', 'mobiliario', 'Estante do acervo', 'estante industrial metalon preto pinus 5 prateleiras 180 cm', 'estante|5 prateleira|industrial/metalon/ferro/aco', 'sapateira|banheiro|plastica|plastico|mini|nicho|parede|escada'],
    ['MO06', 'mobiliario', 'Balcão de atendimento e caixa', 'balcao industrial metalon preto tampo pinus loja caixa', 'balcao|industrial/metalon/ferro/aco', 'cozinha|pia|banheiro|gabinete|buffet|aereo|rack|tv|mini|refrigerado|vidro'],
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
      box-shadow:0 4px 16px rgba(0,0,0,.18);font:13px/1.4 system-ui,sans-serif;padding:10px;
      --azul:#2563eb;--linha:rgba(128,128,128,.25)}
    @media (prefers-color-scheme:dark){#cpi-painel{background:#1e1e1e;color:#eee;border-color:#444;--azul:#3b82f6}}
    #cpi-painel.min>*:not(header){display:none}
    header{display:flex;justify-content:space-between;align-items:center;font-weight:700;cursor:pointer}
    p{margin:4px 0}
    svg.ico{width:14px;height:14px;flex:0 0 auto;vertical-align:-2px}
    .linha{display:flex;flex-wrap:wrap;gap:6px;margin:6px 0;align-items:center}
    button{flex:1 1 auto;display:inline-flex;align-items:center;justify-content:center;gap:4px;padding:5px 8px;
      border-radius:6px;border:1px solid #888;background:transparent;color:inherit;cursor:pointer;font:inherit;white-space:nowrap}
    button:disabled{opacity:.4;cursor:default}
    button.principal{background:var(--azul);border-color:var(--azul);color:#fff;font-weight:600}
    button.ic{flex:0 0 auto;padding:4px 7px}
    button.x{flex:0 0 auto;padding:0 2px;border:none;opacity:.6}
    .tag{flex:0 0 auto;border-radius:999px;padding:2px 9px;font-size:12px;opacity:.55}
    .tag.on{opacity:1;background:var(--azul);border-color:var(--azul);color:#fff}
    select,input{font:inherit;color:inherit;background:transparent;border:1px solid #888;border-radius:6px;padding:3px}
    select{width:100%} select option,select optgroup{color:#111}
    option.obra_reforma{color:#c2410c} option.cozinha_bar{color:#1d4ed8}
    option.mobiliario{color:#15803d} option.equipamentos{color:#7e22ce}
    option.coletado{color:#9ca3af} option.fraco{color:#b45309} option.pulado{color:#9ca3af;font-style:italic}
    input[type=number]{width:46px} input.cep{width:84px} input.u{width:38px;flex:0 0 auto;font-size:11px;padding:1px 3px}
    .rotulo{display:inline-flex;opacity:.7}
    .info{font-size:12px;display:inline-flex;align-items:center;gap:3px}
    .caixa{border:1px solid var(--linha);border-radius:8px;padding:6px 8px;margin:6px 0}
    .grade{display:grid;grid-template-columns:auto 1fr auto 1fr;gap:2px 8px;font-size:12px;align-items:center}
    .grade+.grade{margin-top:6px;padding-top:6px;border-top:1px solid var(--linha)}
    .grade .k{opacity:.6;display:inline-flex;align-items:center;gap:3px}
    .grade .v{font-variant-numeric:tabular-nums;display:inline-flex;align-items:center;gap:3px}
    .grade .largo{grid-column:2 / -1}
    .grade .todo{grid-column:1 / -1;display:flex;align-items:center;gap:4px}
    ul{list-style:none;margin:6px 0;padding:0;max-height:40vh;overflow:auto}
    li{display:flex;gap:6px;align-items:flex-start;padding:4px 0;border-bottom:1px solid var(--linha);font-size:12px}
    li .corpo{flex:1;min-width:0}
    li .titulo{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;cursor:pointer}
    li .titulo:hover{text-decoration:underline}
    li .meta{display:flex;flex-wrap:wrap;gap:3px 8px;align-items:center;font-size:11px;margin-top:1px}
    li .meta>span{display:inline-flex;align-items:center;gap:2px}
    li .meta b{font-size:12px}
    li .selo{border:1px solid currentColor;border-radius:4px;padding:0 3px;font-size:10px;opacity:.75}
    li.guardada span{flex:1} li.guardada b{white-space:nowrap}
    .barra{display:inline-block;width:70px;height:7px;border:1px solid #888;border-radius:4px;vertical-align:middle;overflow:hidden}
    .barra>span{display:block;height:100%;background:currentColor}
    details{margin:6px 0} summary{cursor:pointer;font-size:12px}
    .resumo{font-size:12px} .alerta{color:#b45309} .ok{color:#15803d}
    @media (prefers-color-scheme:dark){.alerta{color:#fbbf24}.ok{color:#4ade80}}
    .status{font-size:12px;opacity:.8}`;

  // Ícones Heroicons (MIT, Tailwind Labs), versão 2.1.5, 20/solid: só os caminhos do SVG;
  // "e:" marca fill-rule evenodd. Montados com createElementNS (sem innerHTML).
  const ICONES = {
    'adjustments-horizontal': ["M10 3.75a2 2 0 1 0-4 0 2 2 0 0 0 4 0ZM17.25 4.5a.75.75 0 0 0 0-1.5h-5.5a.75.75 0 0 0 0 1.5h5.5ZM5 3.75a.75.75 0 0 1-.75.75h-1.5a.75.75 0 0 1 0-1.5h1.5a.75.75 0 0 1 .75.75ZM4.25 17a.75.75 0 0 0 0-1.5h-1.5a.75.75 0 0 0 0 1.5h1.5ZM17.25 17a.75.75 0 0 0 0-1.5h-5.5a.75.75 0 0 0 0 1.5h5.5ZM9 10a.75.75 0 0 1-.75.75h-5.5a.75.75 0 0 1 0-1.5h5.5A.75.75 0 0 1 9 10ZM17.25 10.75a.75.75 0 0 0 0-1.5h-1.5a.75.75 0 0 0 0 1.5h1.5ZM14 10a2 2 0 1 0-4 0 2 2 0 0 0 4 0ZM10 16.25a2 2 0 1 0-4 0 2 2 0 0 0 4 0Z"],
    'arrow-down-tray': ["M10.75 2.75a.75.75 0 0 0-1.5 0v8.614L6.295 8.235a.75.75 0 1 0-1.09 1.03l4.25 4.5a.75.75 0 0 0 1.09 0l4.25-4.5a.75.75 0 0 0-1.09-1.03l-2.955 3.129V2.75Z", "M3.5 12.75a.75.75 0 0 0-1.5 0v2.5A2.75 2.75 0 0 0 4.75 18h10.5A2.75 2.75 0 0 0 18 15.25v-2.5a.75.75 0 0 0-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5Z"],
    'arrow-path': ["e:M15.312 11.424a5.5 5.5 0 0 1-9.201 2.466l-.312-.311h2.433a.75.75 0 0 0 0-1.5H3.989a.75.75 0 0 0-.75.75v4.242a.75.75 0 0 0 1.5 0v-2.43l.31.31a7 7 0 0 0 11.712-3.138.75.75 0 0 0-1.449-.39Zm1.23-3.723a.75.75 0 0 0 .219-.53V2.929a.75.75 0 0 0-1.5 0V5.36l-.31-.31A7 7 0 0 0 3.239 8.188a.75.75 0 1 0 1.448.389A5.5 5.5 0 0 1 13.89 6.11l.311.31h-2.432a.75.75 0 0 0 0 1.5h4.243a.75.75 0 0 0 .53-.219Z"],
    'bookmark': ["e:M10 2c-1.716 0-3.408.106-5.07.31C3.806 2.45 3 3.414 3 4.517V17.25a.75.75 0 0 0 1.075.676L10 15.082l5.925 2.844A.75.75 0 0 0 17 17.25V4.517c0-1.103-.806-2.068-1.93-2.207A41.403 41.403 0 0 0 10 2Z"],
    'chart-bar': ["M15.5 2A1.5 1.5 0 0 0 14 3.5v13a1.5 1.5 0 0 0 1.5 1.5h1a1.5 1.5 0 0 0 1.5-1.5v-13A1.5 1.5 0 0 0 16.5 2h-1ZM9.5 6A1.5 1.5 0 0 0 8 7.5v9A1.5 1.5 0 0 0 9.5 18h1a1.5 1.5 0 0 0 1.5-1.5v-9A1.5 1.5 0 0 0 10.5 6h-1ZM3.5 10A1.5 1.5 0 0 0 2 11.5v5A1.5 1.5 0 0 0 3.5 18h1A1.5 1.5 0 0 0 6 16.5v-5A1.5 1.5 0 0 0 4.5 10h-1Z"],
    'check': ["e:M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"],
    'cube': ["M10.362 1.093a.75.75 0 0 0-.724 0L2.523 5.018 10 9.143l7.477-4.125-7.115-3.925ZM18 6.443l-7.25 4v8.25l6.862-3.786A.75.75 0 0 0 18 14.25V6.443ZM9.25 18.693v-8.25l-7.25-4v7.807a.75.75 0 0 0 .388.657l6.862 3.786Z"],
    'exclamation-triangle': ["e:M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495ZM10 5a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 5Zm0 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"],
    'folder': ["M3.75 3A1.75 1.75 0 0 0 2 4.75v3.26a3.235 3.235 0 0 1 1.75-.51h12.5c.644 0 1.245.188 1.75.51V6.75A1.75 1.75 0 0 0 16.25 5h-4.836a.25.25 0 0 1-.177-.073L9.823 3.513A1.75 1.75 0 0 0 8.586 3H3.75ZM3.75 9A1.75 1.75 0 0 0 2 10.75v4.5c0 .966.784 1.75 1.75 1.75h12.5A1.75 1.75 0 0 0 18 15.25v-4.5A1.75 1.75 0 0 0 16.25 9H3.75Z"],
    'forward': ["M3.288 4.818A1.5 1.5 0 0 0 1 6.095v7.81a1.5 1.5 0 0 0 2.288 1.276l6.323-3.905c.155-.096.285-.213.389-.344v2.973a1.5 1.5 0 0 0 2.288 1.276l6.323-3.905a1.5 1.5 0 0 0 0-2.552l-6.323-3.906A1.5 1.5 0 0 0 10 6.095v2.972a1.506 1.506 0 0 0-.389-.343L3.288 4.818Z"],
    'funnel': ["e:M2.628 1.601C5.028 1.206 7.49 1 10 1s4.973.206 7.372.601a.75.75 0 0 1 .628.74v2.288a2.25 2.25 0 0 1-.659 1.59l-4.682 4.683a2.25 2.25 0 0 0-.659 1.59v3.037c0 .684-.31 1.33-.844 1.757l-1.937 1.55A.75.75 0 0 1 8 18.25v-5.757a2.25 2.25 0 0 0-.659-1.591L2.659 6.22A2.25 2.25 0 0 1 2 4.629V2.34a.75.75 0 0 1 .628-.74Z"],
    'magnifying-glass': ["e:M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z"],
    'map-pin': ["e:m9.69 18.933.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 0 0 .281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 1 0 3 9c0 3.492 1.698 5.988 3.355 7.584a13.731 13.731 0 0 0 2.273 1.765 11.842 11.842 0 0 0 .976.544l.062.029.018.008.006.003ZM10 11.25a2.25 2.25 0 1 0 0-4.5 2.25 2.25 0 0 0 0 4.5Z"],
    'minus': ["e:M4 10a.75.75 0 0 1 .75-.75h10.5a.75.75 0 0 1 0 1.5H4.75A.75.75 0 0 1 4 10Z"],
    'no-symbol': ["e:m5.965 4.904 9.131 9.131a6.5 6.5 0 0 0-9.131-9.131Zm8.07 10.192L4.904 5.965a6.5 6.5 0 0 0 9.131 9.131ZM4.343 4.343a8 8 0 1 1 11.314 11.314A8 8 0 0 1 4.343 4.343Z"],
    'plus': ["M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z"],
    'tag': ["e:M4.5 2A2.5 2.5 0 0 0 2 4.5v3.879a2.5 2.5 0 0 0 .732 1.767l7.5 7.5a2.5 2.5 0 0 0 3.536 0l3.878-3.878a2.5 2.5 0 0 0 0-3.536l-7.5-7.5A2.5 2.5 0 0 0 8.38 2H4.5ZM5 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"],
    'trash': ["e:M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z"],
    'truck': ["M6.5 3c-1.051 0-2.093.04-3.125.117A1.49 1.49 0 0 0 2 4.607V10.5h9V4.606c0-.771-.59-1.43-1.375-1.489A41.568 41.568 0 0 0 6.5 3ZM2 12v2.5A1.5 1.5 0 0 0 3.5 16h.041a3 3 0 0 1 5.918 0h.791a.75.75 0 0 0 .75-.75V12H2Z", "M6.5 18a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM13.25 5a.75.75 0 0 0-.75.75v8.514a3.001 3.001 0 0 1 4.893 1.44c.37-.275.61-.719.595-1.227a24.905 24.905 0 0 0-1.784-8.549A1.486 1.486 0 0 0 14.823 5H13.25ZM14.5 18a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"],
    'arrow-uturn-left': ["e:M7.793 2.232a.75.75 0 0 1-.025 1.06L3.622 7.25h10.003a5.375 5.375 0 0 1 0 10.75H10.75a.75.75 0 0 1 0-1.5h2.875a3.875 3.875 0 0 0 0-7.75H3.622l4.146 3.957a.75.75 0 0 1-1.036 1.085l-5.5-5.25a.75.75 0 0 1 0-1.085l5.5-5.25a.75.75 0 0 1 1.06.025Z"],
    'arrow-uturn-right': ["e:M12.207 2.232a.75.75 0 0 0 .025 1.06l4.146 3.958H6.375a5.375 5.375 0 0 0 0 10.75H9.25a.75.75 0 0 0 0-1.5H6.375a3.875 3.875 0 0 1 0-7.75h10.003l-4.146 3.957a.75.75 0 0 0 1.036 1.085l5.5-5.25a.75.75 0 0 0 0-1.085l-5.5-5.25a.75.75 0 0 0-1.06.025Z"],
    'x-mark': ["M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z"],
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

  const status = (t) => { if (el.status) el.status.textContent = t; };
  const reais = (v) => (v == null ? '–' : `R$ ${v.toFixed(2).replace('.', ',')}`);
  const ROTULO_TIPO = { pix: ' [Pix]', cupom: ' [cupom]', padrao: '' };
  const ROTULO_LEITOR = { proprio: `próprio do site`, jsonld: 'JSON-LD', generico: 'genérico', nenhum: 'nenhum' };
  const ROTULO_CATEGORIA = { obra_reforma: 'Obra e reforma', cozinha_bar: 'Cozinha e bar', mobiliario: 'Mobiliário', equipamentos: 'Equipamentos' };
  const decimal = (v) => String(v).replace('.', ',');
  const quando = (ms) => { const d = new Date(ms); return `${doisDig(d.getDate())}/${doisDig(d.getMonth() + 1)} ${doisDig(d.getHours())}h${doisDig(d.getMinutes())}`; };
  const diaMes = (iso) => (iso ? iso.split('-').reverse().join('/') : '–');
  // Botão com ícone e nome curto; o nome completo e a explicação vão no title (tooltip)
  function botao(ico, rotulo, titulo, onclick, className = '') {
    const b = criar('button', { title: titulo, onclick, className }, partes(icone(ico), rotulo && criar('span', { textContent: rotulo })));
    return b;
  }
  // Selo que liga e desliga (filtros e "só os que faltam")
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

  function mostrarCep() {
    const doSite = cepDoSite();
    const cep = cepAtual();
    const ok = cep && ehSalvador(cep);
    const bom = doSite ? ehSalvador(doSite) : ok;
    el.cepAviso.className = bom ? 'info ok' : 'info alerta';
    el.cepAviso.replaceChildren(...partes(icone(bom ? 'check' : 'exclamation-triangle'),
      doSite ? `no site: ${doSite}` : cep ? 'site não mostra' : 'informe o CEP'));
    el.cepAviso.title = doSite
      ? `CEP no site: ${doSite}${ehSalvador(doSite) ? ' (Salvador)' : ' — fora de Salvador: o frete não vale'}`
      : cep ? `CEP informado: ${cep}${ok ? ' (Salvador)' : ' — fora de Salvador'}; o site não mostra o CEP, conferir`
        : 'Informe o CEP de Salvador usado no site: o frete depende dele.';
  }

  function mostrar(t) {
    const guardados = carregar();
    const lista = ativas(guardados);
    const item = itemAtual();
    const r = resumoItem(guardados, item.id);
    const itensComPreco = new Set(lista.map((l) => l.id_item)).size;
    const itensFracos = ITENS.filter((i) => { const n = resumoItem(guardados, i.id).n; return n > 0 && n < MIN_OFERTAS; }).length;

    // A8: o que mudou desde o último CSV
    const exportadoEm = GM_getValue(CHAVE_EXPORTACAO, 0);
    const pend = pendentes(guardados, exportadoEm);
    el.pendentes.className = pend ? 'info alerta' : 'info ok';
    el.pendentes.replaceChildren(...partes(pend >= AVISO_PENDENTES ? icone('exclamation-triangle') : !pend && exportadoEm ? icone('check') : '',
      pend ? `${pend} fora do CSV` : exportadoEm ? 'CSV em dia' : 'Nada guardado ainda.'));
    el.pendentes.title = pend
      ? `${pend} oferta(s) guardadas ou excluídas desde o último CSV${exportadoEm ? ` (${quando(exportadoEm)})` : ' (nenhum baixado ainda)'}`
        + `${pend >= AVISO_PENDENTES ? '. Baixe o CSV: os dados só estão no Tampermonkey' : ''}`
      : exportadoEm ? `CSV baixado em ${quando(exportadoEm)}` : '';

    // Coleta toda e A2: cobertura da categoria do item
    const c = coberturaCategoria(guardados, item.categoria);
    const preenchido = criar('span');
    preenchido.style.width = `${Math.round((100 * c.completos) / c.itens)}%`;
    el.geral.replaceChildren(
      casa('k', icone('chart-bar'), 'Itens'), casa('v', `${itensComPreco}/${ITENS.length}`),
      casa('k', 'Abaixo de 3'), casa('v', String(itensFracos)),
      ...(Object.keys(pulados()).length ? [casa('k', icone('arrow-uturn-right'), 'Pulados'), casa('v largo', Object.keys(pulados()).sort().join(', '))] : []),
      casa('k', icone('folder'), ROTULO_CATEGORIA[item.categoria] || item.categoria),
      criar('span', { className: `v largo${c.completos === c.itens ? ' ok' : ''}`, title: `${c.completos} de ${c.itens} itens da categoria com ${MIN_OFERTAS}+ ofertas; ${c.comPreco} com alguma` },
        partes(`${c.completos}/${c.itens}`, criar('span', { className: 'barra' }, [preenchido]))),
    );

    // A4 e A7: resumo do item em grade (preço + frete), com alerta de mínimo, dispersão e idade
    if (!r.n) {
      el.resumo.replaceChildren(casa('todo', icone('tag'), 'Nenhuma oferta guardada deste item.'));
    } else {
      const disperso = r.dispersao > DISPERSAO_MAX;
      const alertas = [];
      if (r.n < MIN_OFERTAS) alertas.push(`faltam ${MIN_OFERTAS - r.n} para o mínimo`);
      if (r.idade > IDADE_MAX) alertas.push(`coleta mais antiga com ${r.idade} dias`);
      el.resumo.title = `Preço + frete das ofertas guardadas deste item${r.leitores.length ? `; leitor ${r.leitores.map((l) => ROTULO_LEITOR[l] || l).join(', ')}` : ''}`;
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
    if (t) status(t);
  }

  // Itens pulados: a busca não trouxe o item pensado. Ficam fora do "Próximo" e de "só os que
  // faltam", não deixam guardar e voltam com "Retomar" (no próprio item, pelo seletor).
  const pulados = () => GM_getValue(CHAVE_PULADOS, {});
  const pulado = (id) => id in pulados();

  // Itens do seletor (o menu nativo só aceita texto): com o mínimo de ofertas, esmaecidos (✓ e o
  // número de ofertas); com alguma, abaixo do mínimo, em âmbar (◐ e n/3); sem oferta, ○ na cor
  // da categoria; pulados, – em itálico. "Só os que faltam" esconde completos e pulados (menos o atual).
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
      const pul = pulado(i.id);
      o.className = pul ? 'pulado' : k >= MIN_OFERTAS ? 'coletado' : k ? 'fraco' : i.categoria;
      o.textContent = pul ? `– ${i.id} · ${i.item} (pulado)` : k >= MIN_OFERTAS ? `✓ ${i.id} · ${i.item} (${k})`
        : k ? `◐ ${i.id} · ${i.item} (${k}/${MIN_OFERTAS})` : `○ ${i.id} · ${i.item}`;
      o.hidden = soFaltam && (k >= MIN_OFERTAS || pul) && i.id !== atual;
    }
    for (const g of el.item.querySelectorAll('optgroup')) g.hidden = [...g.querySelectorAll('option')].every((o) => o.hidden);
  }

  // Próximo item abaixo do mínimo de ofertas e não pulado: primeiro na categoria do atual, depois
  // nas outras, seguindo a ordem da lista a partir do atual.
  function proximoQueFalta(lista, atual, puls = {}) {
    const n = ofertasPorItem(lista);
    const i0 = ITENS.findIndex((i) => i.id === atual.id);
    const ordem = [...ITENS.slice(i0 + 1), ...ITENS.slice(0, i0)].filter((i) => (n[i.id] || 0) < MIN_OFERTAS && !(i.id in puls));
    return ordem.find((i) => i.categoria === atual.categoria) || ordem[0] || null;
  }

  function mostrarPular(item) {
    if (!el.bPular) return;
    const pul = pulado(item.id);
    el.bPular.replaceChildren(...partes(icone(pul ? 'arrow-uturn-left' : 'arrow-uturn-right'), criar('span', { textContent: pul ? 'Retomar' : 'Pular' })));
    el.bPular.title = pul
      ? `Retomar: ${item.id} foi pulado em ${diaMes(pulados()[item.id])}; volta ao "Próximo" e libera o Guardar`
      : 'Pular: a busca não trouxe o item pensado; marca o item como pulado (fora do "Próximo" e de "só os que faltam", sem Guardar) e vai ao próximo';
    if (el.bGuardar) contarMarcadas();
  }

  function listarGuardadas(guardados, item) {
    const ks = Object.keys(guardados).filter((k) => guardados[k].id_item === item.id && !guardados[k].excluida)
      .sort((a, b) => guardados[a].preco - guardados[b].preco);
    el.guardadasTitulo.textContent = `Guardadas deste item (${ks.length})`;
    el.guardadas.replaceChildren(...ks.map((k) => {
      const l = guardados[k];
      const frete = l.frete == null ? ' + frete ?' : l.frete === 0 ? '' : ` + ${reais(l.frete)}`;
      const x = criar('button', {
        className: 'x', title: 'Excluir esta oferta (a exclusão vai no CSV)',
        onclick: () => { const g = carregar(); excluir(g, k); salvar(g); mostrar(`Excluída: ${l.produto.slice(0, 40)}`); },
      }, [icone('x-mark')]);
      return criar('li', { className: 'guardada' }, [x, criar('span', { textContent: `${l.fonte} · ${l.produto}` }), criar('b', { textContent: `${reais(l.preco)}${frete}${ROTULO_TIPO[l.tipo_preco] || ''}` })]);
    }));
  }

  // Referência dos filtros: mediana do item guardado, unidades por embalagem e filtros ligados.
  const referencia = () => ({ mediana: resumoItem(carregar(), itemAtual().id).mediana, unidades: el.unidades.value, filtros: filtrosAtuais(), regras: itemAtual() });

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
    el.lista.replaceChildren(...ofertasLidas.map((o, i) => {
      o.unidades = unidadesDe(o);
      const motivos = motivosOferta(o, item.termo, ref);
      const marca = criar('input', { type: 'checkbox', checked: !motivos.length, onchange: contarMarcadas });
      marca.dataset.i = i;
      const titulo = criar('span', { className: 'titulo', textContent: o.produto, title: `${o.produto}\n(clique para ver na página)` });
      titulo.onclick = () => { if (!localizar(o)) status('Oferta não encontrada na página (pode ter saído da tela).'); };
      const meta = [criar('b', {
        textContent: reais(o.preco),
        title: [o.preco_sem_pix ? `sem Pix ${reais(o.preco_sem_pix)}` : '', o.avaliacoes == null ? '' : `${o.avaliacoes} avaliações`].filter(Boolean).join(' · '),
      })];
      if (o.frete != null) meta.push(criar('span', { title: 'Frete' }, partes(icone('truck'), o.frete === 0 ? 'grátis' : reais(o.frete))));
      if (o.tipo_preco && o.tipo_preco !== 'padrao') meta.push(criar('span', { className: 'selo', textContent: o.tipo_preco === 'pix' ? 'Pix' : 'cupom' }));
      if (o.unidades > 1 || o.unidadesManual) {
        const u = criar('input', {
          type: 'number', min: 1, value: o.unidades, className: 'u', title: 'Unidades da lista neste anúncio (caixa, jogo ou kit)',
          onchange: () => { o.unidadesManual = Math.max(1, Number(u.value) || 1); o.unidades = o.unidadesManual; listarOfertas(); },
        });
        meta.push(criar('span', {}, partes(icone('cube'), u, `${reais(o.preco / o.unidades)} cada`)));
      }
      if (motivos.length) {
        meta.push(criar('span', { className: 'alerta', title: `Desmarcada: ${motivos.join('; ')}. Se marcada à mão, vai com motivo e o build a deixa de fora` },
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
    if (!ofertasLidas.length && !cardsLidos) { el.funil.textContent = ''; el.funil.title = ''; return; }
    const f = funil(ofertasLidas, cardsLidos, itemAtual().termo, referencia());
    const falhou = TEM_LEITOR_PROPRIO.includes(site) && leitorLido !== 'proprio';
    el.funil.className = falhou || !f.nosFiltros ? 'resumo alerta' : 'resumo';
    el.funil.replaceChildren(...partes(icone('funnel'), ` ${f.cards} cards → ${f.comPreco} com preço → ${f.semPatrocinado} sem patrocinado → ${f.noTermo} no termo → ${f.nosFiltros} nos filtros`,
      falhou && ' ', falhou && icone('exclamation-triangle'), falhou && ' leitor do site falhou'));
    el.funil.title = `Funil da leitura desta página; leitor ${ROTULO_LEITOR[leitorLido] || leitorLido}${falhou ? '. O seletor do site não leu: o layout pode ter mudado' : ''}`;
  }

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
      : `${motivo}${somar ? `+${novas} novas; ` : ''}${ofertasLidas.length} ofertas de ${cardsLidos} cards, ${marcadas} marcadas.`);
  }

  function montarPainel() {
    el.item = criar('select', {
      title: 'Item da lista. ✓ completo, ◐ abaixo do mínimo, ○ sem oferta (na cor da categoria)',
      onchange: () => { GM_setValue(CHAVE_ITEM, el.item.value); mostrar(); ler(false, 'Item trocado: página relida. '); },
    }, [...new Set(ITENS.map((i) => i.categoria))].map((c) => criar('optgroup', { label: ROTULO_CATEGORIA[c] || c },
      ITENS.filter((i) => i.categoria === c).map((i) => criar('option', { value: i.id, textContent: `${i.id} · ${i.item}` })))));
    el.item.value = itemAtual().id;
    el.cep = criar('input', {
      className: 'cep', placeholder: '40000-000', value: GM_getValue(CHAVE_CEP, ''), title: 'CEP de Salvador usado no site (o frete depende dele)',
      onchange: () => { GM_setValue(CHAVE_CEP, cepDe(el.cep.value) || ''); el.cep.value = GM_getValue(CHAVE_CEP, ''); mostrarCep(); },
    });
    el.cepAviso = criar('span');
    el.pendentes = criar('span');
    el.geral = criar('div', { className: 'grade' });
    el.resumo = criar('div', { className: 'grade' });
    el.funil = criar('p');
    // F2, F3 e F5: filtros da marcação inicial, guardados no Tampermonkey
    const FILTRO = {
      faixa: ['preço', 'Filtro de faixa de preço: desmarca ofertas abaixo de 0,3× ou acima de 3× a mediana guardada do item'],
      medida: ['medida', 'Filtro de medida: desmarca ofertas cuja medida (cm, L, BTU, W, kg) foge da do termo'],
      avaliacoes: ['avaliações', 'Filtro de avaliações: desmarca ofertas da Amazon sem avaliações'],
    };
    const filtros = Object.keys(FILTROS_PADRAO).map((k) => selo(FILTRO[k][0], FILTRO[k][1], filtrosAtuais()[k],
      (v) => { GM_setValue(CHAVE_FILTROS, { ...filtrosAtuais(), [k]: v }); listarOfertas(); }));
    const soFaltam = selo('só os que faltam', `Esconde no seletor os itens com ${MIN_OFERTAS}+ ofertas`, GM_getValue(CHAVE_SO_FALTAM, false),
      (v) => { GM_setValue(CHAVE_SO_FALTAM, v); mostrar(); });
    el.status = criar('p', { className: 'status' });
    el.unidades = criar('input', { type: 'number', min: 1, value: 1, title: 'Unidades por embalagem: vale para as ofertas sem unidades no título', onchange: () => listarOfertas() });
    el.lista = criar('ul');
    el.guardadas = criar('ul');
    el.guardadasTitulo = criar('summary');
    const bBuscar = botao('magnifying-glass', 'Buscar', 'Buscar aqui: abre a busca do site com o termo do item', () => { saindoPeloPainel = true; location.href = urlBusca(site, itemAtual().termo); });
    bBuscar.disabled = !urlBusca(site, 'x');
    const bLer = botao('arrow-path', 'Reler', 'Ler ofertas: relê a página (ela já é lida sozinha ao abrir e ao trocar de página)', () => ler(false));
    const bSomar = botao('plus', 'Somar', 'Somar página: acrescenta as ofertas desta página (ou das que carregaram ao rolar) às já lidas', () => ler(true));
    // F4: desmarca as ofertas de Pix ou cupom, para comparar só preços padrão
    const bPadrao = botao('no-symbol', 'Pix', 'Só preço padrão: desmarca as ofertas com preço de Pix ou cupom', () => {
      let n = 0;
      for (const m of caixasMarcadas()) if ((ofertasLidas[m.dataset.i].tipo_preco || 'padrao') !== 'padrao') { m.checked = false; n++; }
      contarMarcadas();
      status(`${n} oferta(s) de Pix ou cupom desmarcadas; ${caixasMarcadas().length} marcadas.`);
    });
    const irProximo = (antes = '') => {
      const prox = proximoQueFalta(ativas(carregar()), itemAtual(), pulados());
      if (!prox) { mostrar(`${antes}Todos os itens não pulados têm ${MIN_OFERTAS}+ ofertas.`); return; }
      GM_setValue(CHAVE_ITEM, prox.id);
      el.item.value = prox.id;
      mostrar(`${antes}Item ${prox.id} · ${prox.item}.`);
      const url = urlBusca(site, prox.termo);
      if (url) { saindoPeloPainel = true; location.href = url; } else ler(false, `${antes}Item ${prox.id}: página relida. `);
    };
    const bProximo = botao('forward', 'Próximo', `Próximo que falta: vai para o próximo item com menos de ${MIN_OFERTAS} ofertas e não pulado (primeiro na mesma categoria) e abre a busca dele`, () => irProximo());
    // Pular: marca o item como pulado (a busca não trouxe o item pensado) e vai ao próximo;
    // num item já pulado, o botão vira "Retomar".
    el.bPular = botao('arrow-uturn-right', 'Pular', '', () => {
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
    }, 'ic');
    el.bGuardar = botao('bookmark', 'Guardar', 'Guardar marcadas: guarda as ofertas marcadas no Tampermonkey', () => {
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
    }, 'principal');
    el.bGuardar.disabled = true;
    const bCsv = botao('arrow-down-tray', 'CSV', 'Baixar CSV: um arquivo por categoria, com tudo o que está guardado', () => { status(`${baixarCsv()} arquivo(s) de categoria baixados.`); mostrar(); }, 'ic');
    // Exclui as guardadas (de todos os itens) que as regras e os filtros de agora não aceitam.
    const bRevisar = botao('funnel', 'Revisar', 'Revisar guardadas: exclui as guardadas que não passam nas regras do item e nos filtros ligados (sem a faixa de preço)', () => {
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
    }, 'ic');
    const bLimpar = botao('trash', '', 'Limpar: apaga todas as guardadas (baixa antes um backup JSON)', () => {
      const pend = pendentes(carregar(), GM_getValue(CHAVE_EXPORTACAO, 0));
      if (!confirm(`Apagar todas as ofertas guardadas?${pend ? ` ${pend} ainda não estão em nenhum CSV.` : ''} Um backup JSON será baixado antes.`)) return;
      const agora = new Date();
      baixar(`${dataLocal(agora)}_${horaLocal(agora)}_precos_backup.json`, JSON.stringify(carregar(), null, 1), 'application/json');
      GM_deleteValue(CHAVE);
      mostrar('Guardadas apagadas (backup baixado).');
    }, 'ic');

    const minimizar = criar('span', { className: 'rotulo' }, [icone('minus')]);
    const cabecalho = criar('header', {}, [criar('span', { textContent: `Preços · ${site}` }), minimizar]);
    const painel = criar('div', { id: 'cpi-painel' }, [
      cabecalho,
      criar('div', { className: 'linha' }, [criar('span', { className: 'rotulo' }, [icone('map-pin')]), el.cep, el.cepAviso]),
      el.item,
      criar('div', { className: 'linha' }, [soFaltam, el.bPular, bProximo, el.bGuardar]),
      criar('div', { className: 'linha' }, [bBuscar, bLer, bSomar, bPadrao]),
      criar('div', { className: 'linha' }, [criar('span', { className: 'rotulo', title: 'Filtros da marcação inicial' }, [icone('adjustments-horizontal')]), ...filtros,
        criar('span', { className: 'rotulo', title: el.unidades.title }, [icone('cube')]), el.unidades]),
      criar('div', { className: 'linha' }, [bCsv, bRevisar, bLimpar, el.pendentes]),
      criar('div', { className: 'caixa' }, [el.geral, el.resumo]),
      criar('details', {}, [el.guardadasTitulo, el.guardadas]),
      el.funil,
      el.lista,
      el.status,
    ]);
    cabecalho.onclick = () => { painel.classList.toggle('min'); minimizar.replaceChildren(icone(painel.classList.contains('min') ? 'plus' : 'minus')); };

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
