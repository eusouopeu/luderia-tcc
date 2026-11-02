const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(__dirname + '/precos_itens.user.js', 'utf8');
const LISTA = path.resolve(__dirname, '../../../../dados/[B5] Ativos fixos/orcamento/[B5] Lista de Itens da Etapa 1 (elaboração própria).csv');

function carregar() {
  const ambiente = {
    __test: {},
    URL,
    GM_getValue: (k, padrao) => padrao,
    GM_setValue() {},
    GM_deleteValue() {},
    location: { href: 'https://www.amazon.com.br/s?k=x', hostname: 'www.amazon.com.br' },
    document: { querySelector: () => null, querySelectorAll: () => [] },
  };
  const instrumentado = source.slice(0, source.indexOf("  console.info(NOME, 'carregado');"))
    + 'Object.assign(globalThis.__test, { ITENS, numeroBR, freteDe, precoAtual, relevancia, ofertasJsonLd, siteDe, urlBusca, guardar, csv, nomeArquivo });})();';
  vm.runInNewContext(instrumentado, ambiente, { filename: 'precos_itens.user.js' });
  return ambiente.__test;
}

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
});

test('JSON-LD: produto, lista de produtos e @graph', () => {
  const produto = { '@type': 'Product', name: 'Cadeira  Estofada', url: 'https://loja/c1', offers: { '@type': 'Offer', price: '199.90' } };
  assert.deepEqual(json(t.ofertasJsonLd(produto)), [{ produto: 'Cadeira Estofada', preco: 199.9, url: 'https://loja/c1', frete: null, patrocinado: false }]);
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
    preco: 5, frete: 1, preco_anuncio: 120, unidades: 24, url: 'https://a/1', busca: 'b', data_coleta: '2026-11-02',
  });
});

test('CSV: cabeçalho que o build lê, vírgula decimal e nome por categoria', () => {
  const s = t.csv([{ id_item: 'MO03', categoria: 'mobiliario', fonte: 'leroymerlin', produto: 'Cadeira; estofada', preco: 250.5, frete: null, preco_anuncio: 250.5, unidades: 1, url: 'u', busca: 'b', data_coleta: 'd' }]);
  const [cab, linha] = s.replace(/^﻿/, '').split('\r\n');
  assert.equal(cab, 'id_item;categoria;fonte;produto;preco;frete;preco_anuncio;unidades;url;busca;data_coleta');
  assert.equal(linha, 'MO03;mobiliario;leroymerlin;"Cadeira; estofada";250,5;;250,5;1;u;b;d');
  assert.equal(t.nomeArquivo('mobiliario', '2026-11-02'), '2026-11-02_mobiliario_precos.csv');
});
