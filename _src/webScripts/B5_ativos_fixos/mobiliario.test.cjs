const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

// A lista do menu (lista_mobiliario.js) vem antes, como no carregador (@require).
const source = fs.readFileSync(__dirname + '/lista_mobiliario.js', 'utf8') + '\n' + fs.readFileSync(__dirname + '/mobiliario.user.js', 'utf8');
const { parseHTML } = require('linkedom');

const LISTA = path.resolve(__dirname, '../../../dados/B5_mobiliario/_dados-agregados/[B5] Lista de Itens da Etapa 1 (elaboração própria).csv');
const FIXTURES = path.resolve(__dirname, '../../pyScripts/B5_Mobiliario/5_outros/fixtures_html');

// Roda o userscript até antes do painel e expõe as funções. Sem html, um documento vazio;
// com html, o DOM da fixture (linkedom) no endereço dado.
function carregar(html, href = 'https://www.amazon.com.br/s?k=x') {
  const url = new URL(href);
  const document = html ? parseHTML(html).document : { querySelector: () => null, querySelectorAll: () => [] };
  const ambiente = {
    __test: {},
    URL,
    GM_getValue: (k, padrao) => padrao,
    GM_setValue() {},
    GM_deleteValue() {},
    location: { href: url.href, hostname: url.hostname },
    document,
  };
  const instrumentado = source.slice(0, source.indexOf("  console.info(NOME, 'carregado');"))
    + 'Object.assign(globalThis.__test, { ITENS, numeroBR, freteDe, precoAtual, tipoPreco, palavras, relevancia, medidas, medidaConflita, motivosRegras, kitDe, marcarVariantes, revisarGuardadas, lerCsv, importar, motivosOferta, funil, quantil, pendentes, coberturaCategoria, cepDe, ehSalvador, ofertasJsonLd, siteDe, urlBusca, guardar, excluir, ativas, resumoItem, mediana, somarOfertas, csv, nomeArquivo, lerOfertas, cepDoSite, resumoItens, csvResumo, COLS_RESUMO });})();';
  vm.runInNewContext(instrumentado, ambiente, { filename: 'mobiliario.user.js' });
  return ambiente.__test;
}

const fixture = (nome) => fs.readFileSync(path.join(FIXTURES, nome), 'utf8');

const t = carregar();
const json = (x) => JSON.parse(JSON.stringify(x));

test('a lista embutida é a dos itens de coleta do CSV da etapa 1', () => {
  const linhas = fs.readFileSync(LISTA, 'utf8').replace(/^﻿/, '').trim().split(/\r?\n/).map((l) => l.split(';'));
  const cab = linhas[0];
  const col = (l, nome) => l[cab.indexOf(nome)];
  const esperado = linhas.slice(1).filter((l) => col(l, 'fonte_preco') === 'coleta')
    .map((l) => ({ id: col(l, 'id'), categoria: col(l, 'categoria'), item: col(l, 'item'), termo: col(l, 'termo_busca'),
      exige: col(l, 'termo_exige').split('|').filter(Boolean), exclui: col(l, 'termo_exclui').split('|').filter(Boolean) }));
  assert.deepEqual(json(t.ITENS), esperado);
});

test('lê números no formato brasileiro', () => {
  assert.equal(t.numeroBR('R$ 1.234,56'), 1234.56);
  assert.equal(t.numeroBR('R$1.058'), 1058);
  assert.equal(t.numeroBR('sem preço'), null);
});

test('frete: grátis, valor ou não informado', () => {
  assert.equal(t.freteDe('Entrega GRÁTIS: 5 - 8 de dez.'), 0);
  assert.equal(t.freteDe('Frete grátis'), 0);
  assert.equal(t.freteDe('Entrega R$ 95,41: 2 - 10 de dez.'), 95.41);
  assert.equal(t.freteDe('Chega amanhã'), null);
});

test('preço atual: menor do bloco, sem parcelas', () => {
  assert.equal(t.precoAtual([{ valor: 300, contexto: 'R$ 300,00' }, { valor: 250, contexto: 'R$ 250,00 cada' }]), 250);
  assert.equal(t.precoAtual([{ valor: 2899, contexto: 'R$ 2.899,00' }, { valor: 254.29, contexto: 'em até 12x de R$ 254,29' }]), 2899);
  assert.equal(t.precoAtual([{ valor: 0, contexto: 'Total: R$ 0,00' }]), null);
});

test('relevância pelo termo do item', () => {
  assert.equal(t.relevancia('Freezer Electrolux Horizontal 513L 2 Tampas', 'freezer horizontal 2 tampas 400 litros'), 4 / 6);
  assert.ok(t.relevancia('Frigobar 93 Litros Midea', 'freezer horizontal 2 tampas 400 litros') < 0.5);
  assert.equal(t.relevancia('Fogão Industrial 4 Bocas com Forno', 'fogao industrial 4 bocas com forno'), 1);
  // número só casa inteiro: "4" não está em "40" nem em "14"
  assert.equal(t.relevancia('Fogão Industrial 40 Bocas 14', 'fogao 4'), 1 / 2);
  // medida com espaço, milhar com ponto, unidade colada e plural
  assert.equal(t.relevancia('Mesa Retangular 160 x 90 cm Restaurantes', 'mesa retangular 160x90 restaurante'), 1);
  assert.equal(t.relevancia('Ar Condicionado Split 30.000 BTUs Inverter', 'ar condicionado split 30000 btus inverter'), 1);
  assert.equal(t.relevancia('Liquidificador Industrial 4L', 'liquidificador industrial 4 litros'), 3 / 4);
  assert.deepEqual(json(t.palavras('Mesa 150cm X 70cm')), ['mesa', '150x70', 'cm']);
});

test('tipo de preço e CEP', () => {
  assert.equal(t.tipoPreco(' à vista no Pix ou NuPay '), 'pix');
  assert.equal(t.tipoPreco('R$ 99 com cupom'), 'cupom');
  assert.equal(t.tipoPreco('R$ 99 em 10x'), 'padrao');
  assert.equal(t.tipoPreco('cadaà vista no pix04x de'), 'pix');
  assert.equal(t.tipoPreco('Pixel 8 Pro'), 'padrao');
  assert.equal(t.cepDe('Salvador 40170110'), '40170-110');
  assert.equal(t.cepDe('Atualizar CEP'), '');
  assert.ok(t.ehSalvador('41820-020'));
  assert.ok(!t.ehSalvador('01310-100'));
});

test('JSON-LD: produto, lista de produtos e @graph', () => {
  const produto = { '@type': 'Product', name: 'Cadeira  Estofada', url: 'https://loja/c1', offers: { '@type': 'Offer', price: '199.90' } };
  assert.deepEqual(json(t.ofertasJsonLd(produto)), [{ produto: 'Cadeira Estofada', preco: 199.9, url: 'https://loja/c1', frete: null, patrocinado: false, tipo_preco: 'padrao' }]);
  const lista = { '@type': 'ItemList', itemListElement: [{ '@type': 'ListItem', item: produto }, { '@type': 'ListItem', item: { ...produto, url: 'https://loja/c2', offers: { lowPrice: 150, highPrice: 180 } } }] };
  assert.deepEqual(json(t.ofertasJsonLd(lista).map((o) => o.preco)), [199.9, 150]);
  assert.equal(t.ofertasJsonLd({ '@graph': [{ '@type': 'Organization' }, produto] }).length, 1);
  assert.equal(t.ofertasJsonLd({ '@type': 'Product', name: 'Sem preço', offers: {} }).length, 0);
});

test('site e URL de busca', () => {
  assert.equal(t.siteDe('www.amazon.com.br'), 'amazon');
  assert.equal(t.siteDe('lista.mercadolivre.com.br'), 'mercadolivre');
  assert.equal(t.urlBusca('mercadolivre', 'Fogão industrial 4 bocas'), 'https://lista.mercadolivre.com.br/fogao-industrial-4-bocas');
  assert.equal(t.urlBusca('amazon', 'mesa inox'), 'https://www.amazon.com.br/s?k=mesa%20inox');
  assert.equal(t.urlBusca('outra', 'x'), '');
});

test('guardar: preço por unidade, sem duplicar a mesma oferta do item', () => {
  const g = {};
  const item = { id: 'CB17', categoria: 'cozinha_bar' };
  const ctx = { fonte: 'amazon', busca: 'b', data_coleta: '2026-11-02', agora: 1000 };
  const ofertas = [{ produto: 'Copo long drink caixa com 24', preco: 120, frete: 24, url: 'https://a/1' }, { produto: 'sem preço', preco: null, url: 'https://a/2' }];
  assert.equal(t.guardar(g, item, ofertas, 24, ctx), 1);
  assert.equal(t.guardar(g, item, ofertas, 24, ctx), 0);
  assert.deepEqual(json(g['CB17|https://a/1']), {
    id_item: 'CB17', categoria: 'cozinha_bar', fonte: 'amazon', produto: 'Copo long drink caixa com 24',
    preco: 5, frete: 1, preco_anuncio: 120, unidades: 24, tipo_preco: 'padrao', preco_sem_pix: null, cep: '', avaliacoes: null, leitor: '', url: 'https://a/1', busca: 'b', posicao: null, data_coleta: '2026-11-02', motivo: '', excluida: 0, unidades_manual: false, filtros_off: [], alterado_em: 1000,
  });
  // unidades da oferta valem sobre as do painel; preço sem Pix e motivo vão por unidade e como vieram
  t.guardar(g, item, [{ produto: 'Copo caixa com 12', preco: 60, frete: null, preco_sem_pix: 63, unidades: 12, motivo: 'sem avaliações', url: 'https://a/3' }], 24, ctx);
  assert.deepEqual(json([g['CB17|https://a/3'].preco, g['CB17|https://a/3'].preco_sem_pix, g['CB17|https://a/3'].unidades, g['CB17|https://a/3'].motivo]), [5, 5.25, 12, 'sem avaliações']);
});

test('excluir: some das ativas e do resumo, e volta se guardada de novo', () => {
  const g = {};
  const item = { id: 'MO03', categoria: 'mobiliario' };
  const ctx = { fonte: 'leroymerlin', busca: 'b', data_coleta: '2026-11-02', cep: '40170-110' };
  const of = [100, 200, 300].map((p, i) => ({ produto: `Cadeira ${i}`, preco: p, frete: i === 0 ? null : 10, url: `https://l/${i}`, tipo_preco: i === 2 ? 'pix' : 'padrao' }));
  t.guardar(g, item, of, 1, ctx);
  assert.deepEqual(json(t.resumoItem(g, 'MO03', '2026-12-10')), {
    n: 3, sites: 1, mediana: 210, min: 100, max: 310, p25: 155, p75: 260, dispersao: 1.68,
    semFrete: 1, pixCupom: 1, leitores: [], maisAntiga: '2026-11-02', idade: 38,
  });
  assert.ok(t.excluir(g, 'MO03|https://l/1'));
  assert.equal(t.ativas(g).length, 2);
  assert.equal(t.resumoItem(g, 'MO03').mediana, 205);
  assert.equal(t.guardar(g, item, [of[1]], 1, ctx), 1);
  assert.equal(g['MO03|https://l/1'].excluida, 0);
});

test('uma oferta por URL: patrocinado repetido dá lugar à versão normal, na posição dela', () => {
  const d = carregar(`<html><body>${['B1', 'B2', 'B1'].map((asin, i) => `<div data-component-type="s-search-result" data-asin="${asin}" class="${i === 0 ? 'AdHolder' : ''}"><h2>Fogão Industrial ${asin}</h2><span class="a-price"><span class="a-offscreen">R$ 1.000,00</span></span></div>`).join('')}</body></html>`);
  const { ofertas, cards } = d.lerOfertas('amazon');
  assert.equal(cards, 3);
  assert.deepEqual(json(ofertas.map((o) => [o.url.slice(-2), o.patrocinado])), [['B2', false], ['B1', false]]);
});

test('somar ofertas sem repetir URL', () => {
  const a = [{ url: 'u1' }, { url: 'u2' }];
  assert.deepEqual(json(t.somarOfertas(a, [{ url: 'u2' }, { url: 'u3' }, { url: 'u3' }]).map((o) => o.url)), ['u1', 'u2', 'u3']);
});

test('CSV: cabeçalho que o build lê, vírgula decimal e nome por categoria', () => {
  // linha antiga, sem tipo_preco, cep e excluida: sai com vazios e excluida = 0
  const s = t.csv([{ id_item: 'MO03', categoria: 'mobiliario', fonte: 'leroymerlin', produto: 'Cadeira; estofada', preco: 250.5, frete: null, preco_anuncio: 250.5, unidades: 1, url: 'u', busca: 'b', data_coleta: 'd' }]);
  const [cab, linha] = s.replace(/^﻿/, '').split('\r\n');
  assert.equal(cab, 'id_item;categoria;fonte;produto;preco;frete;preco_anuncio;unidades;tipo_preco;preco_sem_pix;cep;avaliacoes;leitor;url;busca;posicao;data_coleta;motivo;excluida');
  assert.equal(linha, 'MO03;mobiliario;leroymerlin;"Cadeira; estofada";250,5;;250,5;1;;;;;;u;b;;d;;0');
  assert.equal(t.nomeArquivo('mobiliario', '2026-11-02', '1405'), '2026-11-02_1405_mobiliario_precos.csv');
});

test('F3: medida conflitante pela grandeza do termo', () => {
  const termo = 'ar condicionado split 30000 btus inverter';
  assert.equal(t.medidaConflita('Ar Condicionado Split 12.000 BTUs Inverter', termo), '12000 btu, termo 30000 btu');
  assert.equal(t.medidaConflita('Ar Condicionado Split 30.000 BTUs', termo), '');
  assert.equal(t.medidaConflita('Ar Condicionado Split Inverter', termo), ''); // sem a grandeza, não conflita
  assert.equal(t.medidaConflita('Fogão Industrial 6 Bocas com Forno', 'fogao industrial 4 bocas com forno'), '6 boca, termo 4 boca');
  assert.equal(t.medidaConflita('Freezer Horizontal 2 Tampas 513L', 'freezer horizontal 2 tampas 400 litros'), '513 l, termo 400 l');
  assert.equal(t.medidaConflita('Mesa Retangular 90 x 160 cm', 'mesa retangular 160x90 restaurante'), ''); // ordem não importa
  assert.equal(t.medidaConflita('Mesa Retangular 120x80', 'mesa retangular 160x90 restaurante'), '80x120, termo 90x160');
  assert.equal(t.medidaConflita('Mesa Inox 150cm X 70cm X 90cm', 'mesa inox 150 cm cozinha industrial'), '');
});

test('F3: decimal com vírgula, folga, metros e dimensões contra comprimento', () => {
  assert.deepEqual(json(t.palavras('Liquidificador 2,4L, Inox.')), ['liquidificador', '2.4', 'l', 'inox']);
  assert.equal(t.medidaConflita('Liquidificador Industrial Jarra de 2,4L', 'liquidificador industrial 4 litros'), '2,4 l, termo 4 l');
  assert.equal(t.medidaConflita('Fritadeira Elétrica 3,5 Litros', 'fritadeira 5 litros'), '3,5 l, termo 5 l');
  assert.equal(t.medidaConflita('Freezer Horizontal 2 Tampas 410 Litros', 'freezer horizontal 2 tampas 400 litros'), ''); // folga de 10%
  assert.equal(t.medidaConflita('Ar Split 32000 BTUs', 'ar condicionado split 30000 btus inverter'), '');
  assert.equal(t.medidaConflita('Coifa Industrial 1,5 m Inox', 'coifa industrial inox 150 cm'), '');
  assert.equal(t.medidaConflita('Chapa Bifeteira Lisa 25x25', 'chapa bifeteira industrial gas 70cm'), '25 cm, termo 70 cm');
  assert.equal(t.medidaConflita('Mesa Inox Profissional 92x53x84cm', 'mesa inox 150 cm cozinha industrial'), '53/84/92 cm, termo 150 cm');
  assert.equal(t.medidaConflita('Mesa Restaurante 160 x 90 cm', 'mesa retangular restaurante 160x80'), ''); // 90 está a 12,5% de 80
  assert.equal(t.medidaConflita('Impressora Térmica 58/80mm USB', 'impressora termica nao fiscal 80mm'), '');
});

test('regras do item: palavras exigidas (com alternativas) e excluídas (palavra inteira)', () => {
  const r = { exige: ['wi fi 6/wifi 6/ax'], exclui: ['repetidor', 'capa'] };
  assert.deepEqual(json(t.motivosRegras('Roteador Wi-Fi 6 AX1500', r)), []);
  assert.deepEqual(json(t.motivosRegras('Roteador AC1200 Dual Band', r)), ['falta: wi fi 6/wifi 6/ax']);
  assert.deepEqual(json(t.motivosRegras('Mercusys ME60X Repetidor de Sinal Wi-Fi 6', r)), ['excluída: repetidor']);
  assert.deepEqual(json(t.motivosRegras('Roteador WiFi 6 com capacidade para 60 dispositivos', r)), []); // "capa" não casa com "capacidade"
  assert.deepEqual(json(t.motivosRegras('Fritadeira Elétrica 2 Cubas', { exige: ['fritadeira', '2 cuba/dupla'] })), []);
  assert.deepEqual(json(t.motivosRegras('Fritadeira Elétrica Cuba 3L', { exige: ['fritadeira', '2 cuba/dupla'] })), ['falta: 2 cuba/dupla']);
  assert.deepEqual(json(t.motivosRegras('Ar Condicionado Split on/off', { exclui: ['on off'] })), ['excluída: on off']);
  const item = t.ITENS.find((i) => i.id === 'EQ04');
  assert.deepEqual(json(t.motivosOferta({ produto: 'Roteador TP-Link Archer C50 AC1200 Dual Band', preco: 199, avaliacoes: 9 }, item.termo, { regras: item })), ['falta: wi fi 6/wifi 6/ax']);
});

test('kits, combos e variantes de cor ou voltagem', () => {
  const imp = 'impressora termica nao fiscal 80mm';
  assert.deepEqual(json(t.kitDe('Impressora térmica Elgin i8 + 30 Bobina de Cupom 80x40', imp)), { combo: 'bobina' });
  assert.deepEqual(json(t.kitDe('Impressora Térmica SI-180M 80mm — Kit com 2 Bobinas', imp)), { combo: 'bobinas' });
  assert.deepEqual(json(t.kitDe('Impressora de recibos USB + LAN de 80 mm', imp)), {});
  assert.deepEqual(json(t.kitDe('Copo Long Drink 300ml Caixa com 24', 'copo long drink vidro 300 ml caixa 24')), { unidades: 24 });
  assert.deepEqual(json(t.kitDe('Mercusys Halo H80X (2 un.) Roteador Mesh', 'roteador wifi 6 dual band')), { unidades: 2 });
  assert.deepEqual(json(t.kitDe('Kit 4 Cadeiras Estofadas', 'cadeira restaurante estofada')), { unidades: 4 });
  assert.deepEqual(json(t.kitDe('Jogo 6 Pratos Rasos Porcelana', 'prato raso porcelana branco 26 cm kit 12')), { unidades: 6 });
  assert.deepEqual(json(t.kitDe('Kit 4 Câmeras Full HD DVR 4 Canais', 'kit cftv 4 cameras full hd dvr 4 canais')), {});
  assert.deepEqual(json(t.kitDe('Fogão Industrial 4 Bocas com Forno', 'fogao industrial 4 bocas com forno')), {});
  assert.deepEqual(json(t.motivosOferta({ produto: 'Impressora Térmica 80mm + Leitor Código Barras', preco: 437 }, imp)), ['combo: + leitor']);
  const cores = ['Azul', 'Branco', 'Cinza'].map((c, i) => ({ produto: `Fogão Industrial com Forno 2 Bocas Duplas Bravo ${c} - Venâncio`, preco: 1460.36, url: `u${i}` }));
  const v = t.marcarVariantes([...cores, { produto: 'Frigobar HQ 130 Litros (127V)', preco: 1489, url: 'f1' }, { produto: 'Frigobar HQ 130 Litros (220v)', preco: 1489, url: 'f2' }, { produto: 'Frigobar HQ 130 Litros (220v)', preco: 1600, url: 'f3' }]);
  assert.deepEqual(json(v.map((o) => Boolean(o.varianteDe))), [false, true, true, false, true, false]);
  assert.match(t.motivosOferta(v[1], 'fogao industrial 4 bocas com forno').join(), /variante de: Fogão Industrial com Forno 2 Bocas/);
});

test('kits: Nº é tamanho, lista de opções, pacote da Amazon, peças e pares', () => {
  const k = (titulo, termo) => json(t.kitDe(titulo, termo));
  assert.deepEqual(k('Caçarola Nº 50 Panela Grande Linha Hotel', 'kit panelas aluminio grosso industrial hotel'), {});
  assert.deepEqual(k('Conjunto De Copos Nadir Long Drink 450 Ml 3/6/12/24 Unid', 'copo long drink vidro 300 ml caixa 24'), { ambiguo: '3/6/12/24' });
  assert.deepEqual(k('Jogo de Talheres Aço Inox 24 48 ou 72 Peças', 'kit garfo e faca de mesa inox restaurante 12 pares'), { ambiguo: '24/48/72' });
  assert.deepEqual(k('Cadeira de Jantar Dora Industrial Metal (4, Preto, 0)', 'cadeira industrial metal preta assento madeira'), { unidades: 4 });
  assert.deepEqual(k('Cadeira de Jantar Dora Industrial Metal (1, Preto, 0)', 'cadeira industrial metal preta assento madeira'), {});
  assert.deepEqual(k('Refrigerador Expositor Vertical HQ 509 Litros Porta de Vidro (110, Preto)', 'expositor vertical bebidas porta vidro'), {});
  assert.deepEqual(k('Conjunto de Talheres em Aço Inoxidável 430, 36 Peças, 12 Facas, 12 Garfos', 'kit garfo e faca de mesa inox restaurante 12 pares'), { unidades: 12 });
  assert.deepEqual(k('Tenda Roteador Wi-Fi 6, Roteador Dual Band Gigabit AX3000', 'roteador wifi 6 dual band'), {});
  assert.deepEqual(k('2 peças ® Luminária de teto pendente retrô E27', 'luminaria pendente industrial cupula metal preto e27'), { unidades: 2 });
  const pares = 'kit garfo e faca de mesa inox restaurante 12 pares';
  assert.deepEqual(k('Kit 200 Garfo e Faca Talheres 100% Aço Inox 100 Garfo e 100 Faca', pares), { unidades: 100 });
  assert.deepEqual(k('Kit 24 Peças com 12 Garfos E 12 Facas de mesa em Inox', pares), { unidades: 12 });
  assert.deepEqual(k('Kit 12 Garfo 12 Faca Aço Inox Mesa Restaurante', pares), { unidades: 12 });
  assert.deepEqual(k('Jogo Garfo e Faca Inox 12 pares', pares), { unidades: 12 });
  // lista de opções desmarca até o autor digitar as unidades; frete acima de 3× o preço também
  const o = { produto: 'Copo Americano Long Drink Nadir 450 ml Kit 6/12/24 Unid', preco: 54.97, frete: 0, avaliacoes: 3 };
  assert.match(t.motivosOferta(o, 'copo long drink vidro 300 ml caixa 24', { filtros: { medida: false } }).join(), /unidades: 6\/12\/24, conferir no anúncio/);
  assert.equal(t.motivosOferta({ ...o, unidadesManual: 6 }, 'copo long drink vidro 300 ml caixa 24', { filtros: { medida: false } }).length, 0);
  assert.match(t.motivosOferta({ ...o, produto: 'Copo Long Drink 300ml Kit 24', frete: 200 }, 'copo long drink vidro 300 ml caixa 24').join(), /frete suspeito: R\$ 200,00/);
});

test('importar CSV: aspas, decimais, excluídas e prioridade das guardadas', () => {
  const cab = 'id_item;categoria;fonte;produto;preco;frete;preco_anuncio;unidades;tipo_preco;preco_sem_pix;cep;avaliacoes;leitor;url;busca;data_coleta;motivo;excluida';
  const texto = '\ufeff' + [cab,
    'OB41;obra_reforma;amazon;"Kit Hulter 3/8"" 5/8"" 24000 a 30000 Btus";358,78;89,9;358,78;1;pix;377,67;40150-140;0;proprio;https://a/1;b;2026-11-03;;0',
    'CB16;cozinha_bar;amazon;Kit 6 Pratos;19,7;;118,21;6;pix;;40150-140;;proprio;https://a/2;b;2026-11-02;;1',
    'MO03;mobiliario;amazon;Cadeira Tolix;313,4;0;313,4;1;pix;329,9;40150-140;2;proprio;https://a/3;b;2026-11-03;;0',
  ].join('\r\n');
  const ls = t.lerCsv(texto);
  assert.deepEqual(json(ls.map((l) => [l.produto, l.preco, l.frete, l.unidades, l.avaliacoes, l.excluida])), [
    ['Kit Hulter 3/8" 5/8" 24000 a 30000 Btus', 358.78, 89.9, 1, 0, 0], ['Kit 6 Pratos', 19.7, null, 6, null, 1], ['Cadeira Tolix', 313.4, 0, 1, 2, 0]]);
  const g = {};
  t.guardar(g, { id: 'MO03', categoria: 'mobiliario' }, [{ produto: 'Cadeira Tolix', preco: 300, url: 'https://a/3' }], 1, { fonte: 'amazon', busca: 'b', data_coleta: '2026-11-03', agora: 1 });
  assert.equal(t.importar(g, ls, 5), 2);
  assert.equal(g['MO03|https://a/3'].preco, 300);
  assert.equal(g['CB16|https://a/2'].excluida, 1);
  assert.equal(t.importar(g, ls, 6), 0);
  assert.deepEqual(json(t.lerCsv('a;b\n1;2')), []);
});

test('variantes: cores como off white e bronze, voltagem solta', () => {
  const v = t.marcarVariantes([
    { produto: 'Mesa Industrial Retangular 160x80 Pé Metal Cozinha Jantar (Preto/Preto)', preco: 550.9 },
    { produto: 'Mesa Industrial Retangular 160x80 Pé Metal Cozinha Jantar (Off White/Dourado)', preco: 550.9 },
    { produto: 'Mesa Industrial Retangular 160x80 Pé Metal Cozinha Jantar (Off White/Bronze)', preco: 550.9 },
    { produto: 'Fritadeira Elétrica Industrial 2 Cubas Inox 10 Litros(110)', preco: 415.95 },
    { produto: 'Fritadeira Elétrica Industrial 2 Cubas Inox 10 Litros(220)', preco: 415.95 },
  ]);
  assert.deepEqual(json(v.map((o) => Boolean(o.varianteDe))), [false, true, true, false, true]);
});

test('revisar guardadas: mesmo produto em dois itens fica no primeiro', () => {
  const g = {};
  const ctx = { fonte: 'amazon', busca: 'b', data_coleta: '2026-11-03' };
  const oferta = { produto: 'Estante Industrial Preta com 5 Prateleiras de Madeira e Metalon', preco: 339, url: 'e1', avaliacoes: 2 };
  t.guardar(g, { id: 'MO05', categoria: 'mobiliario' }, [oferta], 1, { ...ctx, agora: 1 });
  t.guardar(g, { id: 'CB19', categoria: 'cozinha_bar' }, [oferta], 1, { ...ctx, agora: 2 });
  const fora = t.revisarGuardadas(g, {});
  assert.deepEqual(json(fora.map((f) => [f.k, f.motivos.at(-1)])), [['CB19|e1', 'já guardada em MO05']]);
});

test('revisar guardadas: regras, medida e variantes, sem a faixa de preço', () => {
  const g = {};
  const ctx = { fonte: 'amazon', busca: 'b', data_coleta: '2026-11-02', agora: 1 };
  t.guardar(g, { id: 'OB40', categoria: 'obra_reforma' }, [
    { produto: 'Ar Condicionado Split Inverter 30.000 BTUs Frio', preco: 4800, url: 'a1', avaliacoes: 5 },
    { produto: 'Ar Condicionado Split Inverter 9000 BTUs Frio', preco: 1700, url: 'a2', avaliacoes: 5 },
    { produto: 'Ar Condicionado Split Inverter 30.000 BTUs Frio Branco', preco: 4800, url: 'a3', avaliacoes: 5 },
    { produto: 'Ar Condicionado Split Inverter 30.000 BTUs Barato', preco: 900, url: 'a4', avaliacoes: 5 },
  ], 1, ctx);
  t.guardar(g, { id: 'EQ04', categoria: 'equipamentos' }, [{ produto: 'Repetidor Wi-Fi 6 AX1500', preco: 224, url: 'r1', avaliacoes: 9 }], 1, ctx);
  const fora = t.revisarGuardadas(g, {});
  assert.deepEqual(json(fora.map((f) => [f.k, f.motivos[0].split(':')[0]])), [['OB40|a2', 'medida'], ['OB40|a3', 'variante de'], ['EQ04|r1', 'termo']]);
  assert.ok(fora[2].motivos.includes('excluída: repetidor'));
  t.excluir(g, 'OB40|a2');
  assert.equal(t.revisarGuardadas(g, {}).length, 2);
  // sem avaliações não conta; guardada com o filtro de medida desligado, a medida não conta para ela
  t.guardar(g, { id: 'OB40', categoria: 'obra_reforma' }, [
    { produto: 'Ar Condicionado Split Inverter 30.000 BTUs Quente e Frio', preco: 5000, url: 'a5', avaliacoes: 0 },
    { produto: 'Ar Condicionado Split Inverter 24.000 BTUs Quente e Frio', preco: 4000, url: 'a6', avaliacoes: 3 },
  ], 1, { ...ctx, filtros: { faixa: true, medida: false, avaliacoes: true } });
  assert.deepEqual(json(g['OB40|a6'].filtros_off), ['medida']);
  assert.equal(t.revisarGuardadas(g, { medida: true, avaliacoes: true }).length, 2);
});

test('motivos da marcação: patrocinado, termo, faixa (F2), medida (F3) e avaliações (F5)', () => {
  const termo = 'fogao industrial 4 bocas com forno';
  const o = { produto: 'Fogão Industrial 4 Bocas com Forno', preco: 1000, frete: 100, patrocinado: false, avaliacoes: 12 };
  assert.deepEqual(json(t.motivosOferta(o, termo, { mediana: 1000 })), []);
  assert.deepEqual(json(t.motivosOferta({ ...o, preco: 200, frete: 0 }, termo, { mediana: 1000 })), ['faixa: 0,2× a mediana']);
  assert.deepEqual(json(t.motivosOferta({ ...o, preco: 200, frete: 0 }, termo, { mediana: 1000, filtros: { faixa: false } })), []);
  assert.deepEqual(json(t.motivosOferta(o, termo, { mediana: 100, unidades: 4 })), []); // 1100 ÷ 4 = 275, 2,75× a mediana
  assert.deepEqual(json(t.motivosOferta(o, termo, {})), []); // sem guardadas, sem faixa
  assert.deepEqual(json(t.motivosOferta({ ...o, produto: 'Fogão Industrial 6 Bocas com Forno' }, termo)), ['medida: 6 boca, termo 4 boca']);
  assert.deepEqual(json(t.motivosOferta({ ...o, avaliacoes: 0 }, termo)), ['sem avaliações']);
  assert.deepEqual(json(t.motivosOferta({ ...o, avaliacoes: null }, termo)), []); // site sem contagem
  assert.deepEqual(json(t.motivosOferta({ ...o, patrocinado: true, produto: 'Panela de pressão' }, termo)), ['patrocinado', 'termo']);
});

test('A1: funil da leitura', () => {
  const termo = 'fogao industrial 4 bocas com forno';
  const base = { produto: 'Fogão Industrial 4 Bocas com Forno', preco: 1000, frete: 0, avaliacoes: 5 };
  const ofertas = [base, { ...base, patrocinado: true }, { ...base, produto: 'Panela' }, { ...base, avaliacoes: 0 }];
  assert.deepEqual(json(t.funil(ofertas, 6, termo, {})), { cards: 6, comPreco: 4, semPatrocinado: 3, noTermo: 2, nosFiltros: 1 });
});

test('quantil como o pandas, pendências do CSV (A8) e cobertura da categoria (A2)', () => {
  assert.equal(t.quantil([100, 200, 300, 400], 0.25), 175);
  assert.equal(t.quantil([5], 0.75), 5);
  assert.equal(t.quantil([], 0.5), null);
  const g = {};
  const ctx = (agora) => ({ fonte: 'amazon', busca: 'b', data_coleta: '2026-11-02', agora });
  t.guardar(g, { id: 'EQ01', categoria: 'equipamentos' }, [1, 2, 3].map((i) => ({ produto: `Notebook ${i}`, preco: 3000, url: `https://n/${i}` })), 1, ctx(100));
  t.guardar(g, { id: 'EQ02', categoria: 'equipamentos' }, [{ produto: 'Impressora', preco: 500, url: 'https://i/1' }], 1, ctx(300));
  assert.equal(t.pendentes(g, 0), 4);
  assert.equal(t.pendentes(g, 200), 1);
  t.excluir(g, 'EQ01|https://n/1', 400);
  assert.equal(t.pendentes(g, 350), 1);
  assert.deepEqual(json(t.coberturaCategoria(g, 'equipamentos')), { itens: 5, completos: 0, comPreco: 2 });
  t.guardar(g, { id: 'EQ01', categoria: 'equipamentos' }, [{ produto: 'Notebook 4', preco: 3100, url: 'https://n/4' }], 1, ctx(500));
  assert.deepEqual(json(t.coberturaCategoria(g, 'equipamentos')), { itens: 5, completos: 1, comPreco: 2 });
});

// ---------- leitura do DOM, com trechos das páginas em outros/fixtures_html/ ----------

test('DOM Amazon: cards, patrocinado, frete, Pix e CEP do cabeçalho', () => {
  const href = 'https://www.amazon.com.br/s?k=mesa+inox+150+cm+cozinha+industrial';
  const d = carregar(fixture('amazon_busca.html'), href);
  const { ofertas, cards, leitor } = d.lerOfertas('amazon');
  assert.equal(cards, 3);
  assert.equal(leitor, 'proprio');
  assert.deepEqual(json(ofertas.map((o) => o.avaliacoes)), [0, 0, 4]);
  assert.deepEqual(json(ofertas.map((o) => [o.url, o.preco, o.frete, o.patrocinado, o.tipo_preco])), [
    ['https://www.amazon.com.br/dp/B0H7JPXYP7', 246.05, 0, true, 'pix'],
    ['https://www.amazon.com.br/dp/B0DK7V4QHY', 1234.9, 175, false, 'pix'],
    ['https://www.amazon.com.br/dp/B0GWFG3BQ2', 402.2, 0, false, 'pix'],
  ]);
  assert.deepEqual(json(ofertas.map((o) => o.preco_sem_pix)), [259, 1299.9, 423.37]); // preço cinza do card de Pix
  assert.equal(ofertas[1].produto, 'Mesa Inox Nortinox 150cm X 70cm X 90cm');
  assert.equal(ofertas[1].busca, href);
  assert.ok(d.relevancia(ofertas[1].produto, 'mesa inox 150 cm cozinha industrial') >= 0.5);
  assert.equal(d.cepDoSite(), '40170-110');
});

test('DOM Leroy Merlin: leitura genérica, sem carrinho, preço "cada" e Pix', () => {
  const d = carregar(fixture('leroymerlin_busca.html'), 'https://www.leroymerlin.com.br/search?term=cadeira%20restaurante%20estofada');
  const { ofertas, leitor } = d.lerOfertas('leroymerlin');
  assert.equal(leitor, 'generico');
  assert.deepEqual(json(ofertas.map((o) => [o.url.split('/').pop(), o.preco, o.tipo_preco])), [
    ['cadeira-para-sala-de-jantar-estofada-em-madeira-macica-diamante-natural-e-bege-marrom-natural--bege_1572138451', 427.48, 'pix'],
    ['cadeira-de-jantar-lana-em-madeira-macica-estofada-bege_1570346963', 414.9, 'padrao'],
  ]);
  assert.equal(ofertas[1].produto, 'Cadeira de Jantar Lana em Madeira Maciça Estofada Bege');
});

test('DOM Mercado Livre (sintético): preço atual, centavos, frete e URL sem parâmetros', () => {
  const d = carregar(fixture('mercadolivre_busca_sintetico.html'), 'https://lista.mercadolivre.com.br/fogao-industrial-4-bocas-com-forno');
  const { ofertas } = d.lerOfertas('mercadolivre');
  assert.deepEqual(json(ofertas.map((o) => [o.url, o.preco, o.frete, o.patrocinado, o.tipo_preco])), [
    ['https://produto.mercadolivre.com.br/MLB-1111111111-fogao-industrial-4-bocas-com-forno-_JM', 1289.9, 0, true, 'padrao'],
    ['https://www.mercadolivre.com.br/fogao-industrial-4-bocas-40-com-forno/p/MLB22222222', 1750, 89.9, false, 'pix'],
  ]);
  assert.equal(d.cepDoSite(), '41820-020');
});

test('painel: ler, guardar, excluir e aviso de troca de página (fixture da Amazon)', () => {
  const { document, window } = parseHTML(fixture('amazon_busca.html'));
  // linkedom não tem setter de select.value
  Object.defineProperty(window.HTMLSelectElement.prototype, 'value', { get() { return this._v ?? this.querySelector('option')?.value; }, set(v) { this._v = v; }, configurable: true });
  const memoria = {};
  let tique;
  const ambiente = {
    URL, Blob, document, console: { info() {}, error: (...a) => { throw a[1]; } },
    location: { href: 'https://www.amazon.com.br/s?k=mesa+inox', hostname: 'www.amazon.com.br' },
    GM_getValue: (k, d) => (k in memoria ? memoria[k] : d), GM_setValue: (k, v) => { memoria[k] = v; }, GM_deleteValue: (k) => { delete memoria[k]; },
    setInterval: (f) => { tique = f; }, setTimeout() {}, confirm: () => true,
  };
  vm.runInNewContext(source, ambiente, { filename: 'mobiliario.user.js' });
  tique();
  const r = document.getElementById('cpi-hospedeiro').shadowRoot;
  const botao = (t) => [...r.querySelectorAll('button')].find((b) => b.title.startsWith(`${t}:`) || b.textContent === t);
  const textos = () => [...r.querySelectorAll('p, .info, .grade')].map((p) => `${p.textContent} ${p.title || ''}`).join(' | ');
  // Ao abrir, a página é lida sozinha quando as ofertas param de mudar: Guardar já fica liberado
  assert.equal(botao('Guardar marcadas').disabled, true);
  tique();
  tique();
  assert.match(r.querySelector('.status').textContent, /^Ofertas lidas sozinhas\. 3 ofertas de 3 cards/);
  assert.equal(botao('Guardar marcadas').disabled, false);
  assert.equal(botao('Guardar marcadas').textContent, 'Guardar (0)');
  const select = r.querySelector('select');
  select.value = 'CB09';
  select.onchange();
  assert.match(r.querySelector('.status').textContent, /^Item trocado: página relida\. 3 ofertas/);
  botao('Ler ofertas').onclick();
  assert.match(r.querySelector('.status').textContent, /^3 ofertas de 3 cards, 0 marcadas\./);
  assert.match(textos(), /3 cards → 3 com preço → 2 sem patrocinado → 2 no termo → 0 nos filtros Funil da leitura desta página; leitor próprio do site/);
  const motivo = (c) => c.closest('li').querySelector('.alerta').title;
  const caixas = [...r.querySelectorAll('ul')[1].querySelectorAll('input[type=checkbox]')];
  assert.match(motivo(caixas[1]), /sem avaliações/);
  caixas[1].checked = true; // o autor confere e marca a Nortinox
  botao('Só preço padrão').onclick(); // todas são Pix na Amazon
  assert.match(motivo(caixas[2]), /medida: 53\/84\/92 cm, termo 150 cm/);
  assert.match(caixas[1].closest('li').querySelector('b').title, /sem Pix R\$ 1299,90/);
  assert.match(r.querySelector('.status').textContent, /^1 oferta\(s\) de Pix ou cupom desmarcadas; 0 marcadas/);
  caixas[1].checked = true;
  caixas[2].checked = true;
  assert.match(textos(), /Nada guardado ainda/);
  // Revisão automática ao guardar: a de medida errada sai; a sem avaliações fica (não vale na revisão)
  botao('Guardar marcadas').onclick();
  assert.match(r.querySelector('.status').textContent, /^2 guardadas \(2 novas\)\. Revisão: 1 excluída\(s\) \(CB09 1\)\./);
  assert.match(r.querySelector('.status').title, /CB09 .*: medida: 53\/84\/92 cm, termo 150 cm/);
  assert.deepEqual(json(Object.values(JSON.parse(memoria.tcc_precos_v1)).map((l) => [l.motivo, l.excluida]).sort()), [['medida: 53/84/92 cm, termo 150 cm', 1], ['sem avaliações', 0]]);
  // Guardada com o filtro de medida desligado, a oferta fica: a revisão respeita o filtro desligado ao guardar
  memoria.tcc_precos_filtros = { medida: false };
  botao('Guardar marcadas').onclick();
  assert.match(r.querySelector('.status').textContent, /^2 guardadas \(1 novas\)\.(?! Revisão)/);
  assert.deepEqual(json(Object.values(JSON.parse(memoria.tcc_precos_v1)).map((l) => [l.motivo, l.excluida, l.filtros_off]).sort()), [['faixa: 0,3× a mediana', 0, ['medida']], ['sem avaliações', 0, ['medida']]]);
  // Filtro desligado: aviso ao lado dos selos; ao trocar de item, os filtros voltam a ligar
  delete memoria.tcc_precos_filtros;
  botao('Filtro de medida').onclick(); // desliga
  assert.match(r.querySelector('.filtros-off').textContent, /medida desligado/);
  select.value = 'CB10';
  select.onchange();
  assert.deepEqual(json(memoria.tcc_precos_filtros), {});
  assert.equal(botao('Filtro de medida').getAttribute('aria-pressed'), 'true');
  assert.equal(r.querySelector('.filtros-off').textContent, '');
  select.value = 'CB09';
  select.onchange();
  assert.match(textos(), /2 oferta\(s\) guardadas ou excluídas desde o último CSV \(nenhum baixado ainda\)/);
  assert.match(textos(), /Cozinha e bar0\/20/);
  assert.match(textos(), /Ofertas2 \(1 site\)MedianaR\$ 906,05MínimoR\$ 402,20MáximoR\$ 1409,90P25R\$ 654,13P75R\$ 1157,98P75\/P251,77×Pix\/cupom2Desde\d{2}\/\d{2}\/\d{4}faltam 1 para o mínimo Preço \+ frete .*leitor próprio do site/);
  assert.match(textos(), /CEP no site: 40170-110 \(Salvador\)/);
  // seletor: CB09, guardado neste site, sai como coletado (✓ e o número de ofertas do site);
  // Desfazer tira a marca só neste site, e Coletado a põe de volta
  const opcao = (id) => r.querySelector(`option[value="${id}"]`);
  assert.equal(opcao('CB09').className, 'coletado');
  assert.match(opcao('CB09').textContent, /^✓ CB09 · .* \(2\)$/);
  botao('Desfazer coletado').onclick();
  assert.equal(opcao('CB09').className, 'fraco');
  assert.match(opcao('CB09').textContent, /^◐ CB09 · .* \(2\/5\)$/);
  assert.deepEqual(json(Object.values(memoria.tcc_precos_coletados)), [{ CB09: false }]);
  botao('Marcar coletado').onclick();
  assert.equal(opcao('CB09').className, 'coletado');
  botao('Desfazer coletado').onclick();
  // só os que faltam: nenhum completo, nada escondido; próximo que falta fica na categoria
  const so = botao('só os que faltam');
  so.onclick();
  assert.equal(so.getAttribute('aria-pressed'), 'true');
  assert.equal(memoria.tcc_precos_so_faltam, true);
  assert.equal([...r.querySelectorAll('option')].filter((o) => o.hidden).length, 0);
  // Pular: CB10 fica fora do Próximo, esconde-se em "só os que faltam" e não deixa guardar; Retomar desfaz
  memoria.tcc_precos_pulados = { CB10: '2026-11-03' };
  botao('Próximo que falta').onclick();
  assert.equal(memoria.tcc_precos_item, 'CB11');
  select.value = 'CB09';
  select.onchange();
  assert.equal(opcao('CB10').hidden, true);
  assert.match(opcao('CB10').textContent, /^– CB10 · .*\(pulado\)$/);
  assert.match(textos(), /PuladosCB10/);
  botao('Pular').onclick();
  assert.deepEqual(Object.keys(memoria.tcc_precos_pulados).sort(), ['CB09', 'CB10']);
  assert.equal(memoria.tcc_precos_item, 'CB11');
  select.value = 'CB09';
  select.onchange();
  assert.equal(botao('Guardar marcadas').disabled, true);
  botao('Retomar').onclick();
  assert.equal(botao('Guardar marcadas').disabled, false);
  delete memoria.tcc_precos_pulados;
  botao('Próximo que falta').onclick();
  assert.equal(memoria.tcc_precos_item, 'CB10');
  assert.match(ambiente.location.href, /amazon\.com\.br\/s\?k=/);
  ambiente.location.href = 'https://www.amazon.com.br/s?k=mesa+inox';
  select.value = 'CB09';
  select.onchange();
  assert.equal(opcao('CB01').className, 'cozinha_bar');
  assert.match(opcao('CB01').textContent, /^○ CB01 · /);
  assert.equal(r.querySelectorAll('optgroup').length, 4);
  r.querySelector('button.x').onclick();
  assert.match(textos(), /Ofertas1 \(1 site\)/);
  assert.equal(Object.values(JSON.parse(memoria.tcc_precos_v1)).filter((l) => l.excluida).length, 1);
  // Próxima página sem recarregar (como a Amazon faz): a URL muda e os cards trocam depois
  ambiente.location.href = 'https://www.amazon.com.br/s?k=mesa+inox&page=2';
  tique(); // vê a URL nova
  tique(); // 1ª leitura da página nova (ainda igual à antiga)
  tique(); // 2ª leitura igual à lida: nada a reler
  assert.equal(r.querySelectorAll('ul')[1].querySelectorAll('li').length, 3);
  ambiente.location.href = 'https://www.amazon.com.br/s?k=mesa+inox&page=3';
  tique();
  document.querySelector('[data-asin="B0DK7V4QHY"]').remove(); // o site troca os cards
  tique();
  tique();
  assert.match(r.querySelector('.status').textContent, /^A página mudou: lista relida\. 2 ofertas de 2 cards/);
  assert.equal(r.querySelectorAll('ul')[1].querySelectorAll('li').length, 2);
});

test('somar: abre a próxima página e, ao carregar, soma as ofertas dela às anteriores', () => {
  const memoria = { tcc_precos_item: 'CB09' };
  const abrir = (href) => {
    const { document, window } = parseHTML(fixture('amazon_busca.html'));
    Object.defineProperty(window.HTMLSelectElement.prototype, 'value', { get() { return this._v ?? this.querySelector('option')?.value; }, set(v) { this._v = v; }, configurable: true });
    let tique;
    const ambiente = {
      URL, Blob, document, console: { info() {}, error: (...a) => { throw a[1]; } },
      location: { href, hostname: 'www.amazon.com.br' },
      GM_getValue: (k, d) => (k in memoria ? memoria[k] : d), GM_setValue: (k, v) => { memoria[k] = v; }, GM_deleteValue: (k) => { delete memoria[k]; },
      setInterval: (f) => { tique = f; }, setTimeout() {}, confirm: () => true,
    };
    vm.runInNewContext(source, ambiente, { filename: 'mobiliario.user.js' });
    tique(); tique(); tique();
    const r = document.getElementById('cpi-hospedeiro').shadowRoot;
    const botao = (t) => [...r.querySelectorAll('button')].find((b) => b.title.startsWith(`${t}:`));
    return { document, ambiente, r, botao };
  };
  // página 1: a próxima vem do link de paginação da Amazon
  const p1 = abrir('https://www.amazon.com.br/s?k=mesa+inox');
  const a = p1.document.createElement('a');
  a.className = 's-pagination-next';
  a.setAttribute('href', '/s?k=mesa+inox&page=2');
  p1.document.body.appendChild(a);
  p1.botao('Somar próxima página').onclick();
  assert.equal(p1.ambiente.location.href, 'https://www.amazon.com.br/s?k=mesa+inox&page=2');
  assert.equal(memoria.tcc_precos_soma.ofertas.length, 3);
  // página 2 (outra oferta guardada da página 1, para a soma aparecer)
  memoria.tcc_precos_soma.ofertas.push({ produto: 'Mesa Inox Industrial 150x70 da página 1', preco: 999, url: 'https://www.amazon.com.br/dp/PAGINA1', leitor: 'proprio' });
  const p2 = abrir('https://www.amazon.com.br/s?k=mesa+inox&page=2');
  assert.match(p2.r.querySelector('.status').textContent, /^Página 2 somada às anteriores\. \+0 novas; 4 ofertas de 6 cards/);
  assert.equal(memoria.tcc_precos_soma, undefined);
  // sem link de paginação, a Amazon usa page=N
  p2.botao('Somar próxima página').onclick();
  assert.equal(p2.ambiente.location.href, 'https://www.amazon.com.br/s?k=mesa+inox&page=3');
  assert.equal(memoria.tcc_precos_soma.paginas, 2);
});

test('resumo por item separa ok, abaixo de 3, sem oferta e não buscado (03/11: OB42 e MO06 sem linha)', () => {
  const g = {};
  const of = (id, fonte, k) => { g[`${id}|${fonte}|${k}`] = { id_item: id, fonte, preco: 100 + k, excluida: 0 }; };
  [1, 2, 3].forEach((k) => of('OB40', 'amazon', k));
  of('CB14', 'mercadolivre', 1); of('CB14', 'mercadolivre', 2);
  const buscas = { 'OB42|mercadolivre': { id_item: 'OB42', site: 'mercadolivre', data_coleta: '2026-11-13' } };
  const r = Object.fromEntries(t.resumoItens(g, buscas).map((l) => [l.id_item, l.situacao]));
  assert.equal(r.OB40, 'ok');
  assert.equal(r.CB14, 'abaixo de 3');
  assert.equal(r.OB42, 'sem oferta');
  assert.equal(r.MO06, 'não buscado');
  const cab = t.csvResumo([]).replace(/^\ufeff/, '').split('\r\n')[0];
  assert.equal(cab, t.COLS_RESUMO.join(';'));
});
