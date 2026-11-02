const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(__dirname + '/precos_itens.user.js', 'utf8');
const { parseHTML } = require('linkedom');

const LISTA = path.resolve(__dirname, '../../../../dados/[B5] Ativos fixos/orcamento/[B5] Lista de Itens da Etapa 1 (elaboração própria).csv');
const FIXTURES = path.resolve(__dirname, '../outros/fixtures_html');

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
    + 'Object.assign(globalThis.__test, { ITENS, numeroBR, freteDe, precoAtual, tipoPreco, palavras, relevancia, cepDe, ehSalvador, ofertasJsonLd, siteDe, urlBusca, guardar, excluir, ativas, resumoItem, mediana, somarOfertas, csv, nomeArquivo, lerOfertas, cepDoSite });})();';
  vm.runInNewContext(instrumentado, ambiente, { filename: 'precos_itens.user.js' });
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
    .map((l) => ({ id: col(l, 'id'), categoria: col(l, 'categoria'), item: col(l, 'item'), termo: col(l, 'termo_busca') }));
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
  const ctx = { fonte: 'amazon', busca: 'b', data_coleta: '2026-11-02' };
  const ofertas = [{ produto: 'Copo long drink caixa com 24', preco: 120, frete: 24, url: 'https://a/1' }, { produto: 'sem preço', preco: null, url: 'https://a/2' }];
  assert.equal(t.guardar(g, item, ofertas, 24, ctx), 1);
  assert.equal(t.guardar(g, item, ofertas, 24, ctx), 0);
  assert.deepEqual(json(g['CB17|https://a/1']), {
    id_item: 'CB17', categoria: 'cozinha_bar', fonte: 'amazon', produto: 'Copo long drink caixa com 24',
    preco: 5, frete: 1, preco_anuncio: 120, unidades: 24, tipo_preco: 'padrao', cep: '', url: 'https://a/1', busca: 'b', data_coleta: '2026-11-02', excluida: 0,
  });
});

test('excluir: some das ativas e do resumo, e volta se guardada de novo', () => {
  const g = {};
  const item = { id: 'MO03', categoria: 'mobiliario' };
  const ctx = { fonte: 'leroymerlin', busca: 'b', data_coleta: '2026-11-02', cep: '40170-110' };
  const of = [100, 200, 300].map((p, i) => ({ produto: `Cadeira ${i}`, preco: p, frete: i === 0 ? null : 10, url: `https://l/${i}`, tipo_preco: i === 2 ? 'pix' : 'padrao' }));
  t.guardar(g, item, of, 1, ctx);
  assert.deepEqual(json(t.resumoItem(g, 'MO03')), { n: 3, sites: 1, mediana: 210, min: 100, max: 310, semFrete: 1, pixCupom: 1 });
  assert.ok(t.excluir(g, 'MO03|https://l/1'));
  assert.equal(t.ativas(g).length, 2);
  assert.equal(t.resumoItem(g, 'MO03').mediana, 205);
  assert.equal(t.guardar(g, item, [of[1]], 1, ctx), 1);
  assert.equal(g['MO03|https://l/1'].excluida, 0);
});

test('somar ofertas sem repetir URL', () => {
  const a = [{ url: 'u1' }, { url: 'u2' }];
  assert.deepEqual(json(t.somarOfertas(a, [{ url: 'u2' }, { url: 'u3' }, { url: 'u3' }]).map((o) => o.url)), ['u1', 'u2', 'u3']);
});

test('CSV: cabeçalho que o build lê, vírgula decimal e nome por categoria', () => {
  // linha antiga, sem tipo_preco, cep e excluida: sai com vazios e excluida = 0
  const s = t.csv([{ id_item: 'MO03', categoria: 'mobiliario', fonte: 'leroymerlin', produto: 'Cadeira; estofada', preco: 250.5, frete: null, preco_anuncio: 250.5, unidades: 1, url: 'u', busca: 'b', data_coleta: 'd' }]);
  const [cab, linha] = s.replace(/^﻿/, '').split('\r\n');
  assert.equal(cab, 'id_item;categoria;fonte;produto;preco;frete;preco_anuncio;unidades;tipo_preco;cep;url;busca;data_coleta;excluida');
  assert.equal(linha, 'MO03;mobiliario;leroymerlin;"Cadeira; estofada";250,5;;250,5;1;;;u;b;d;0');
  assert.equal(t.nomeArquivo('mobiliario', '2026-11-02', '1405'), '2026-11-02_1405_mobiliario_precos.csv');
});

// ---------- leitura do DOM, com trechos das páginas em outros/fixtures_html/ ----------

test('DOM Amazon: cards, patrocinado, frete, Pix e CEP do cabeçalho', () => {
  const href = 'https://www.amazon.com.br/s?k=mesa+inox+150+cm+cozinha+industrial';
  const d = carregar(fixture('amazon_busca.html'), href);
  const { ofertas, cards } = d.lerOfertas('amazon');
  assert.equal(cards, 3);
  assert.deepEqual(json(ofertas.map((o) => [o.url, o.preco, o.frete, o.patrocinado, o.tipo_preco])), [
    ['https://www.amazon.com.br/dp/B0H7JPXYP7', 246.05, 0, true, 'pix'],
    ['https://www.amazon.com.br/dp/B0DK7V4QHY', 1234.9, 175, false, 'pix'],
    ['https://www.amazon.com.br/dp/B0GWFG3BQ2', 402.2, 0, false, 'pix'],
  ]);
  assert.equal(ofertas[1].produto, 'Mesa Inox Nortinox 150cm X 70cm X 90cm');
  assert.equal(ofertas[1].busca, href);
  assert.ok(d.relevancia(ofertas[1].produto, 'mesa inox 150 cm cozinha industrial') >= 0.5);
  assert.equal(d.cepDoSite(), '40170-110');
});

test('DOM Leroy Merlin: leitura genérica, sem carrinho, preço "cada" e Pix', () => {
  const d = carregar(fixture('leroymerlin_busca.html'), 'https://www.leroymerlin.com.br/search?term=cadeira%20restaurante%20estofada');
  const { ofertas } = d.lerOfertas('leroymerlin');
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
  vm.runInNewContext(source, ambiente, { filename: 'precos_itens.user.js' });
  tique();
  const r = document.getElementById('cpi-hospedeiro').shadowRoot;
  const botao = (t) => [...r.querySelectorAll('button')].find((b) => b.textContent === t);
  const textos = () => [...r.querySelectorAll('p')].map((p) => p.textContent).join(' | ');
  const select = r.querySelector('select');
  select.value = 'CB09';
  select.onchange();
  botao('Ler ofertas').onclick();
  assert.match(r.querySelector('.status').textContent, /^3 ofertas com preço de 3 cards lidos, 2 marcadas/);
  botao('Guardar marcadas').onclick();
  assert.match(textos(), /CEP no site: 40170-110 \(Salvador\)/);
  assert.match(textos(), /Este item: 2 ofertas de 1 site\(s\) · mediana R\$ 906,05 \(R\$ 402,20 a R\$ 1409,90/);
  r.querySelector('button.x').onclick();
  assert.match(textos(), /Este item: 1 ofertas/);
  assert.equal(Object.values(JSON.parse(memoria.tcc_precos_v1)).filter((l) => l.excluida).length, 1);
  ambiente.location.href = 'https://www.amazon.com.br/s?k=outra';
  tique();
  assert.match(r.querySelector('.status').textContent, /^A página mudou/);
});
