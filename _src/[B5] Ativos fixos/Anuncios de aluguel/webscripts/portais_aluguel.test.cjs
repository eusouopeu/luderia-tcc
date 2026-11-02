const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const source = fs.readFileSync(__dirname + '/portais_aluguel.user.js', 'utf8');

function carregar() {
  const ambiente = {
    __test: {},
    URL,
    localStorage: { getItem: () => null, setItem() {}, removeItem() {} },
    sessionStorage: { getItem: () => null, setItem() {}, removeItem() {} },
    location: { href: 'https://www.zapimoveis.com.br/aluguel/loja-salao/ba+salvador/', hostname: 'www.zapimoveis.com.br', pathname: '/aluguel/loja-salao/ba+salvador/' },
    document: { querySelector: () => null, querySelectorAll: () => [], getElementById: () => null },
  };
  const instrumentado = source.slice(0, source.indexOf("  console.info(NOME, 'carregado');"))
    + 'Object.assign(globalThis.__test, { numeroBR, valorRotulado, operacaoDe, normalizarGrupoOlx, normalizarOlx, normalizarQuinto, casasQuinto, portalDe, paginaAtual, proximaPagina, guardar, ineditas, csv, nomeArquivo, totalDeTexto, desafioDeTexto, buscaBase, classificar, areaDe6_4, passaFiltros, funil, qualidade, mistura, previaDescarte, noAlvo, agruparBuscas });})();';
  vm.runInNewContext(instrumentado, ambiente, { filename: 'portais_aluguel.user.js' });
  return ambiente.__test;
}

const t = carregar();
const json = (x) => JSON.parse(JSON.stringify(x));

test('lê números no formato brasileiro', () => {
  assert.equal(t.numeroBR('R$ 4.500'), 4500);
  assert.equal(t.numeroBR('R$ 1.234,56'), 1234.56);
  assert.equal(t.numeroBR('R$ 25 mil'), 25000);
  assert.equal(t.numeroBR('Sob consulta'), null);
});

test('condomínio e IPTU: valor, isento (0) ou ausente (null)', () => {
  const p = 'R$ 4.500/mês | Cond. R$ 1.135 • IPTU R$ 180';
  assert.equal(t.valorRotulado(p, 'Cond'), 1135);
  assert.equal(t.valorRotulado(p, 'IPTU'), 180);
  const q = 'R$ 4.000/mês | Cond. isento • IPTU não informado';
  assert.equal(t.valorRotulado(q, 'Cond'), 0);
  assert.equal(t.valorRotulado(q, 'IPTU'), null);
  const r = 'R$ 30.000/mês | Cond. R$ 1,2 mil • IPTU R$ 2 mil';
  assert.equal(t.valorRotulado(r, 'Cond'), 1200);
  assert.equal(t.valorRotulado(r, 'IPTU'), 2000);
});

test('parada da rodada: inéditos contam só os ids vistos nesta rodada', () => {
  const pagina = [{ portal: 'zap', id: '1' }, { portal: 'zap', id: '2' }, { portal: 'zap', id: '2' }, { portal: 'zap', id: '' }];
  assert.deepEqual(json(t.ineditas(pagina, [])), ['zap:1', 'zap:2']);
  assert.deepEqual(json(t.ineditas(pagina, ['zap:1'])), ['zap:2']);
  assert.deepEqual(json(t.ineditas(pagina, ['zap:1', 'zap:2'])), []);
});

test('card do ZAP e do Viva Real', () => {
  const a = json(t.normalizarGrupoOlx('zap', {
    titulo: 'Ponto comercial/Loja/Box para alugar com 20 m² em Avenida Antônio Carlos Magalhães, Itaigara, Salvador',
    href: 'https://www.zapimoveis.com.br/imovel/aluguel-loja-salao-com-elevador-itaigara-salvador-ba-20m2-id-2900560915/?source=ranking%2Crp',
    preco: 'R$ 4.500/mês | Cond. R$ 1.135 • IPTU R$ 180',
    area: 'Tamanho do imóvel 20 m²',
    local: 'Itaigara, Salvador',
    rua: 'Avenida Antônio Carlos Magalhães',
    vagas: 'Quantidade de vagas de garagem 1',
  }));
  assert.equal(a.id, '2900560915');
  assert.equal(a.url, 'https://www.zapimoveis.com.br/imovel/aluguel-loja-salao-com-elevador-itaigara-salvador-ba-20m2-id-2900560915/');
  assert.equal(a.tipo, 'Ponto comercial/Loja/Box');
  assert.equal(a.operacao, 'aluguel');
  assert.equal(a.aluguel, 4500);
  assert.equal(a.condominio_iptu, 1315);
  assert.equal(a.area_m2, 20);
  assert.equal(a.vagas, 1);
  assert.equal(a.quartos, null);
  assert.equal(a.bairro, 'Itaigara');
  assert.equal(a.cidade, 'Salvador');

  const b = json(t.normalizarGrupoOlx('vivareal', {
    titulo: 'Ponto comercial/Loja/Box para alugar com 90 m², 1 banheiro em São Cristóvão, Salvador',
    href: 'https://www.vivareal.com.br/imovel/ponto-comercial-sao-cristovao-bairros-salvador-90m2-aluguel-RS6000-id-2886096973/?source=ranking%2Crp',
    preco: 'R$ 6.000/mês | Cond. isento • IPTU não informado',
    local: 'São Cristóvão, Salvador',
    rua: 'Endereço não informado',
  }));
  assert.equal(b.id, '2886096973');
  assert.equal(b.condominio, 0);
  assert.equal(b.iptu, null);
  assert.equal(b.condominio_iptu, null);
  assert.equal(b.endereco, '');

  const tipo = (titulo) => t.normalizarGrupoOlx('vivareal', { titulo }).tipo;
  assert.equal(tipo('Ponto comercial com 56 m² para alugar em Rua Elias Nazaré, Calçada, Salvador'), 'Ponto comercial');
  assert.equal(tipo('Ponto comercial disponível para locação com 75 m² em Narandiba, Salvador'), 'Ponto comercial');
  assert.equal(t.normalizarGrupoOlx('vivareal', { titulo: 'Ponto comercial disponível para locação com 75 m²', preco: 'R$ 2.000/mês' }).operacao, 'aluguel');
});

test('card do OLX: cidade antes do bairro e operação pelo título', () => {
  const a = json(t.normalizarOlx({
    titulo: 'Alugo Lojas no Cabula - Av Silveira Martins',
    href: 'https://ba.olx.com.br/grande-salvador/imoveis/alugo-lojas-no-cabula-1546961380',
    preco: 'R$ 25.000',
    extras: 'Condomínio R$ 500 | IPTU R$ 80',
    detalhes: ['120 metros quadrados', '2 banheiros'],
    local: 'Salvador, Patamares',
    data: 'Ontem, 21:16',
    caminho: '/imoveis/comercio-e-industria/estado-ba/grande-salvador/salvador',
  }));
  assert.equal(a.id, '1546961380');
  assert.equal(a.operacao, 'aluguel');
  assert.equal(a.aluguel, 25000);
  assert.equal(a.condominio_iptu, 580);
  assert.equal(a.area_m2, 120);
  assert.equal(a.banheiros, 2);
  assert.equal(a.bairro, 'Patamares');
  assert.equal(a.cidade, 'Salvador');

  const venda = t.normalizarOlx({ titulo: 'Vendo Ponto Comercial bem localizado!', href: 'https://ba.olx.com.br/x-1234567890', preco: 'R$ 360.000', caminho: '/imoveis/comercio-e-industria/' });
  assert.equal(venda.operacao, 'venda');
  const semPista = t.normalizarOlx({ titulo: 'Loja 40 m² Pituba', href: 'https://ba.olx.com.br/x-1234567891', preco: 'R$ 3.000', caminho: '/imoveis/comercio-e-industria/' });
  assert.equal(semPista.operacao, 'aluguel');
  assert.equal(t.operacaoDe('VENDA OU ALUGUEL DE LOJA COMERCIAL 310m²', 1000000), 'venda');
  assert.equal(t.operacaoDe('VENDA OU ALUGUEL DE LOJA COMERCIAL 310m²', 9000), 'aluguel');
  assert.equal(t.operacaoDe('Sala Comercial para Venda em Salvador, Graça', 900), 'venda');
  // Sem pista no título e com área: pelo R$/m² (venda nos milhares, aluguel nas dezenas).
  assert.equal(t.operacaoDe('Box 20 m² no Comércio', 80000, 20), 'venda');
  assert.equal(t.operacaoDe('Loja ampla na Paralela', 120000, 2000), 'aluguel');
  assert.equal(t.operacaoDe('Loja ampla na Paralela', 120000, null), 'venda');
  const olx = t.normalizarOlx({ titulo: 'Box no Comércio', href: 'https://ba.olx.com.br/x-1234567892', preco: 'R$ 80.000', detalhes: ['20 metros quadrados'], caminho: '/imoveis/comercio-e-industria/' });
  assert.equal(olx.operacao, 'venda');
});

test('total de resultados da busca e desafio do Cloudflare', () => {
  assert.equal(t.totalDeTexto('1.234 Lojas/Salões para alugar em Salvador - BA'), 1234);
  assert.equal(t.totalDeTexto('Resultados 1-50 de 2.345 resultados'), 2345);
  assert.equal(t.totalDeTexto('Mais de 87 imóveis'), null);
  assert.equal(t.totalDeTexto('Aluguel de lojas em Salvador'), null);
  assert.equal(t.desafioDeTexto('Just a moment...'), true);
  assert.equal(t.desafioDeTexto('Um momento…'), true);
  assert.equal(t.desafioDeTexto('Lojas para alugar em Salvador | ZAP Imóveis'), false);
});

test('QuintoAndar: estado inicial e resposta de busca dão o mesmo formato', () => {
  const inicial = { houses: { 1: { id: '893599525', rentPrice: 2600, area: 110, bedrooms: 3, condoIptu: 1223, address: { address: 'Rua A', city: 'Salvador' }, neighbourhood: 'Pituba', type: 'Apartamento', forRent: true, parkingSpots: 1 } } };
  const busca = { hits: { hits: [{ _id: '895775220', _source: { id: 895775220, rent: 4500, area: 100, iptuPlusCondominium: 1400, address: 'Rua B', regionName: 'Pituba', city: 'Salvador', type: 'Apartamento', forRent: true, parkingSpaces: 1 } }] } };
  const [a] = t.casasQuinto(inicial).map(t.normalizarQuinto);
  const [b] = t.casasQuinto(busca).map(t.normalizarQuinto);
  assert.deepEqual([a.id, a.aluguel, a.condominio_iptu, a.vagas, a.endereco, a.bairro], ['893599525', 2600, 1223, 1, 'Rua A', 'Pituba']);
  assert.deepEqual([b.id, b.aluguel, b.condominio_iptu, b.vagas, b.endereco, b.cidade], ['895775220', 4500, 1400, 1, 'Rua B', 'Salvador']);
  assert.equal(b.url, 'https://www.quintoandar.com.br/imovel/895775220');
});

test('portal e paginação', () => {
  assert.equal(t.portalDe('www.vivareal.com.br'), 'vivareal');
  assert.equal(t.portalDe('www.olx.com.br'), 'olx');
  assert.equal(t.paginaAtual('zap', 'https://www.zapimoveis.com.br/aluguel/loja-salao/ba+salvador/'), 1);
  assert.equal(t.proximaPagina('zap', 'https://www.zapimoveis.com.br/aluguel/loja-salao/ba+salvador/?pagina=2'), 'https://www.zapimoveis.com.br/aluguel/loja-salao/ba+salvador/?pagina=3');
  assert.equal(t.proximaPagina('olx', 'https://www.olx.com.br/imoveis/comercio-e-industria/estado-ba?sf=1'), 'https://www.olx.com.br/imoveis/comercio-e-industria/estado-ba?sf=1&o=2');
});

test('guardar conta só os novos e o CSV usa vírgula decimal', () => {
  const g = {};
  assert.equal(t.guardar(g, [{ portal: 'zap', id: '1', aluguel: 10.5 }, { portal: 'zap', id: '2' }, { portal: 'zap', id: '' }], { pagina: 1 }), 2);
  assert.equal(t.guardar(g, [{ portal: 'zap', id: '1' }, { portal: 'zap', id: '3' }], { pagina: 2 }), 1);
  assert.equal(Object.keys(g).length, 3);
  const linhas = t.csv([{ portal: 'zap', id: '1', titulo: 'Loja; esquina', aluguel: 10.5 }]).split('\r\n');
  assert.ok(linhas[0].startsWith('﻿portal;id;url;titulo'));
  assert.ok(linhas[1].startsWith('zap;1;;"Loja; esquina";;;10,5'));
  assert.equal(t.nomeArquivo('zap', '2026-11-02', '1846'), '2026-11-02_1846_zap_anuncios_aluguel.csv');
});

const LOJA = 'https://www.zapimoveis.com.br/aluguel/loja-salao/ba+salvador/';
const OLX = 'https://www.olx.com.br/imoveis/estado-ba/grande-salvador/salvador';
const base = { portal: 'zap', operacao: 'aluguel', cidade: 'Salvador', busca_url: LOJA, data_coleta: '2026-11-02' };
const amostra = [
  { ...base, id: '1', aluguel: 9000, area_m2: 150, bairro: 'Pituba', condominio_iptu: 1500 },
  { ...base, id: '2', aluguel: 8000, area_m2: 120, bairro: 'Itaigara', busca_url: LOJA + '?pagina=2' },
  { ...base, id: '3', aluguel: 200, area_m2: 50, bairro: 'Graça' },                       // preço baixo
  { ...base, id: '4', aluguel: 5000, area_m2: null, bairro: 'Barra' },                    // sem área
  { ...base, id: '5', aluguel: 600000, area_m2: 300, bairro: 'Pituba', operacao: 'venda' },
  { ...base, id: '6', aluguel: 3000, area_m2: 80, bairro: 'Centro', cidade: 'Lauro de Freitas' },
  { ...base, id: '7', aluguel: 2500, area_m2: 70, bairro: 'Rio Vermelho', busca_url: OLX, titulo: 'Apartamento com sala ampla' },
];

test('busca sem a página e buscas guardadas', () => {
  assert.equal(t.buscaBase('zap', LOJA + '?pagina=3'), LOJA);
  assert.equal(t.buscaBase('olx', OLX + '?o=2&sf=1'), OLX + '?sf=1');
  const g = json(t.agruparBuscas('zap', Object.fromEntries(amostra.map((a) => [a.id, a]))));
  assert.deepEqual(g.map((b) => [b.busca, b.n]), [[LOJA, 6], [OLX, 1]]);
});

test('classificação e filtros iguais aos do build', () => {
  assert.deepEqual(json(t.classificar(amostra[0])), { segmento: 'comercial', subtipo: 'loja_ponto' });
  assert.deepEqual(json(t.classificar(amostra[6])), { segmento: 'residencial', subtipo: 'residencial' });
  assert.equal(t.classificar({ busca_url: OLX, titulo: 'Aluga-se sala comercial' }).subtipo, 'sala');
  assert.equal(t.areaDe6_4('Graça'), 'Barra/Graça');
  assert.equal(t.areaDe6_4('Centro'), '');
  assert.equal(t.passaFiltros(amostra[4], { soAluguel: true }), false);
  assert.equal(t.passaFiltros(amostra[6], { soComercial: true }), false);
  assert.equal(t.passaFiltros(amostra[5], { soAreas: true }), false);
  assert.equal(t.passaFiltros(amostra[0], { soAluguel: true, soComercial: true, soLoja: true, soAreas: true }), true);
});

test('funil, preenchimento e mistura', () => {
  const pagina = [{ id: '1', aluguel: 10, area_m2: 5 }, { id: '2', aluguel: 10, area_m2: null }, { id: '3', aluguel: null }, { id: '' }];
  assert.deepEqual(json(t.funil(pagina, 5)), { cards: 5, comId: 3, comPreco: 2, comArea: 1 });
  const q = t.qualidade(amostra);
  assert.equal(q.n, 7);
  assert.equal(q.pct.area_m2, 6 / 7);
  assert.equal(q.pct.condominio_iptu, 1 / 7);
  const m = json(t.mistura(amostra));
  assert.equal(m.pctVenda, 1 / 7);
  assert.equal(m.pctFora, 1 / 7);
  assert.equal(m.tipos.residencial, 1);
  assert.equal(m.alertas.length, 3);
});

test('prévia do descarte e anúncios no alvo', () => {
  const d = json(t.previaDescarte(amostra));
  assert.equal(d.aluguel, 6);
  assert.deepEqual(d.motivos, { semArea: 1, preco: 1, foraSalvador: 1, m2: 0 });
  assert.equal(d.total, 3);
  const alvo = json(t.noAlvo(amostra));
  assert.equal(alvo.porte, 2);
  assert.deepEqual(alvo.porArea, { 'Pituba/Itaigara': 2, 'Barra/Graça': 0, 'Rio Vermelho': 0 });
});

