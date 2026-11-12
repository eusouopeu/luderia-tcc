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
    + 'Object.assign(globalThis.__test, { numeroBR, valorRotulado, operacaoDe, normalizarGrupoOlx, normalizarOlx, normalizarQuinto, casasQuinto, portalDe, paginaAtual, proximaPagina, guardar, ineditas, csv, nomeArquivo, totalDeTexto, desafioDeTexto, buscaBase, classificar, areaDe6_4, passaFiltros, funil, qualidade, mistura, previaDescarte, noAlvo, agruparBuscas, pendentes, resumoM2, lerItensFila, rotuloBusca, resultadoBusca, repetirBusca, portalDoArquivo, chaveBusca, FILA_PADRAO, montarBuscas, slugBairro, BAIRROS_MENU, BAIRROS_DESTAQUE, bairroDaUrl, redirecionada, MONTAGEM_PADRAO, chaveAlvo, estadoAlvo, proximoAlvo });})();';
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
  assert.equal(t.totalDeTexto('1 - 13 de 13 resultados'), 13);
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
  assert.equal(t.classificar({ busca_url: 'https://www.zapimoveis.com.br/aluguel/casa-comercial/ba+salvador/', titulo: 'Casa para alugar com 3 quartos' }).segmento, 'comercial');
  const dois = 'https://www.zapimoveis.com.br/aluguel/casa-comercial/ba+salvador/?tipos=imovel-comercial_comercial%2Cponto-comercial_comercial';
  assert.equal(t.classificar({ busca_url: dois, tipo: 'Imóvel comercial', titulo: 'Imóvel comercial para alugar' }).subtipo, 'outro');
  assert.equal(t.classificar({ busca_url: dois, tipo: 'Ponto comercial/Loja/Box', titulo: 'Ponto comercial para alugar' }).subtipo, 'loja_ponto');
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


test('anúncios fora de CSV e R$/m² pedido da busca', () => {
  const dados = { a: { alterado_em: 100 }, b: { alterado_em: 300 }, c: {} };
  assert.equal(t.pendentes(dados, 200), 2); // b depois do CSV; c sem marca conta como pendente
  assert.equal(t.pendentes(dados, 0), 3);
  const lista = [
    { operacao: 'aluguel', aluguel: 1000, area_m2: 100 },
    { operacao: 'aluguel', aluguel: 3000, area_m2: 100 },
    { operacao: 'aluguel', aluguel: 5000, area_m2: 100 },
    { operacao: 'aluguel', aluguel: 2000, area_m2: null },
    { operacao: 'venda', aluguel: 500000, area_m2: 100 },
  ];
  assert.deepEqual(json(t.resumoM2(lista)), { n: 3, mediana: 30, p25: 20, p75: 40 });
  assert.deepEqual(json(t.resumoM2([])), { n: 0, mediana: null, p25: null, p75: null });
});

test('montar buscas: padrão igual às 9 buscas do plano', () => {
  assert.deepEqual(json(t.lerItensFila(t.FILA_PADRAO)), [
    'https://www.olx.com.br/imoveis/comercio-e-industria/aluguel/estado-ba/salvador/pituba?commt=6&commt=7&ss=100',
    'https://www.olx.com.br/imoveis/comercio-e-industria/aluguel/estado-ba/salvador/graca?commt=6&commt=7&ss=100',
    'https://www.olx.com.br/imoveis/comercio-e-industria/aluguel/estado-ba/salvador/itaigara?commt=6&commt=7&ss=100',
    'https://www.zapimoveis.com.br/aluguel/loja-salao/ba+salvador++pituba/?areaMinima=100&ordem=LOWEST_PRICE',
    'https://www.zapimoveis.com.br/aluguel/loja-salao/ba+salvador++graca/?areaMinima=100&ordem=LOWEST_PRICE',
    'https://www.zapimoveis.com.br/aluguel/loja-salao/ba+salvador++itaigara/?areaMinima=100&ordem=LOWEST_PRICE',
    'https://www.vivareal.com.br/aluguel/bahia/salvador/bairros/pituba/ponto-comercial_comercial/?areaMinima=100&ordem=LOWEST_PRICE',
    'https://www.vivareal.com.br/aluguel/bahia/salvador/bairros/graca/ponto-comercial_comercial/?areaMinima=100&ordem=LOWEST_PRICE',
    'https://www.vivareal.com.br/aluguel/bahia/salvador/bairros/itaigara/ponto-comercial_comercial/?areaMinima=100&ordem=LOWEST_PRICE',
  ]);
});

test('montar buscas: bairros, área, tipos e portais', () => {
  assert.equal(t.slugBairro('Rio Vermelho'), 'rio-vermelho');
  assert.equal(t.slugBairro(' Caminho das Árvores '), 'caminho-das-arvores');
  const r = t.montarBuscas({ bairros: ['Barra'], outros: 'Rio Vermelho; barra', areaMin: 100, areaMax: 200, tipos: ['loja', 'sala', 'galpao'], portais: ['olx', 'zap'] });
  assert.deepEqual(json(r.bairros), ['barra', 'rio-vermelho']);
  assert.deepEqual(json(r.urls), [
    'https://www.olx.com.br/imoveis/comercio-e-industria/aluguel/estado-ba/salvador/barra?commt=1&commt=2&commt=6&commt=7&ss=100&se=200',
    'https://www.olx.com.br/imoveis/comercio-e-industria/aluguel/estado-ba/salvador/rio-vermelho?commt=1&commt=2&commt=6&commt=7&ss=100&se=200',
    'https://www.zapimoveis.com.br/aluguel/loja-salao/ba+salvador++barra/?areaMinima=100&areaMaxima=200&ordem=LOWEST_PRICE',
    'https://www.zapimoveis.com.br/aluguel/conjunto-comercial-sala/ba+salvador++barra/?areaMinima=100&areaMaxima=200&ordem=LOWEST_PRICE',
    'https://www.zapimoveis.com.br/aluguel/loja-salao/ba+salvador++rio-vermelho/?areaMinima=100&areaMaxima=200&ordem=LOWEST_PRICE',
    'https://www.zapimoveis.com.br/aluguel/conjunto-comercial-sala/ba+salvador++rio-vermelho/?areaMinima=100&areaMaxima=200&ordem=LOWEST_PRICE',
  ]);
  assert.deepEqual(json(r.semBusca), ['galpão no ZAP']);
  // máxima menor que a mínima é ignorada; sem mínima, sem o parâmetro
  const s = t.montarBuscas({ bairros: ['Pituba'], areaMin: 300, areaMax: 200, tipos: ['casa'], portais: ['vivareal', 'olx'] });
  assert.deepEqual(json(s.urls), ['https://www.vivareal.com.br/aluguel/bahia/salvador/bairros/pituba/imovel-comercial_comercial/?areaMinima=300&ordem=LOWEST_PRICE']);
  assert.deepEqual(json(s.semBusca), ['casa comercial no OLX']);
  assert.equal(t.montarBuscas({ bairros: [], tipos: ['loja'], portais: ['olx'] }).urls.length, 0);
  // o rótulo da fila mostra o tipo quando não é loja/ponto
  assert.equal(t.rotuloBusca(r.urls[3]), 'ZAP · barra · sala');
  assert.equal(t.rotuloBusca(r.urls[2]), 'ZAP · barra');
  assert.equal(t.rotuloBusca(r.urls[0]), 'OLX · barra · loja/ponto, sala, galpão');
});

test('fila: lê as URLs, rotula as buscas e decide repetir', () => {
  const itens = t.lerItensFila(t.FILA_PADRAO);
  assert.equal(itens.length, 9);
  assert.ok(itens.filter((u) => /zapimoveis|vivareal/.test(u)).every((u) => u.includes('ordem=LOWEST_PRICE')));
  assert.deepEqual(json(itens.map(t.rotuloBusca)), ['OLX · pituba', 'OLX · graca', 'OLX · itaigara', 'ZAP · pituba', 'ZAP · graca', 'ZAP · itaigara', 'Viva Real · pituba', 'Viva Real · graca', 'Viva Real · itaigara']);
  assert.deepEqual(json(t.lerItensFila('# comentário\nhttps://exemplo.com/x\nnão é URL\n' + itens[0] + '\n' + itens[0])), [itens[0]]);
  assert.equal(t.rotuloBusca('https://www.vivareal.com.br/aluguel/bahia/salvador/ponto-comercial_comercial/'), 'Viva Real');
  const r = t.resultadoBusca(itens[0], 111, 114, 3, 'total da busca lido');
  assert.equal(Math.round(r.cobertura * 1000), 974);
  assert.equal(t.repetirBusca(r, 0), false);
  const baixa = t.resultadoBusca(itens[0], 80, 114, 2, 'página sem anúncio inédito');
  assert.equal(t.repetirBusca(baixa, 0), true);
  assert.equal(t.repetirBusca(baixa, 1), false);
  assert.equal(t.repetirBusca(t.resultadoBusca(itens[0], 10, null, 1, 'x'), 0), false);
  assert.equal(t.chaveBusca('https://www.olx.com.br/imoveis/comercio-e-industria/aluguel/estado-ba/grande-salvador/salvador/pituba?commt=6'),
    t.chaveBusca('https://www.olx.com.br/imoveis/comercio-e-industria/aluguel/estado-ba/salvador/pituba?commt=6&commt=7&ss=100&o=2'));
  assert.notEqual(t.chaveBusca(itens[0]), t.chaveBusca(itens[1]));
  assert.equal(t.portalDoArquivo([{ portal: 'zap' }, { portal: 'zap' }], 'olx'), 'zap');
  assert.equal(t.portalDoArquivo([{ portal: 'zap' }, { portal: 'olx' }], 'olx'), 'portais');
  assert.equal(t.portalDoArquivo([], 'olx'), 'olx');
});

test('menu das buscas: estado pela rodada registrada, marca à mão e próxima no mesmo portal', () => {
  const alvos = t.lerItensFila(t.FILA_PADRAO);
  assert.equal(alvos.length, 9);
  assert.equal(new Set(alvos.map(t.chaveAlvo)).size, 9);
  // a página da busca não muda a chave
  const u = new URL(alvos[0]); u.searchParams.set(u.hostname.includes('olx') ? 'o' : 'pagina', '3');
  assert.equal(t.chaveAlvo(u.toString()), t.chaveAlvo(alvos[0]));
  const feitas = {
    [t.chaveAlvo(alvos[0])]: { ...t.resultadoBusca(alvos[0], 74, 74, 3, 'total da busca lido'), chave_busca: t.chaveBusca(alvos[0]), em: 1 },
    [t.chaveAlvo(alvos[1])]: { ...t.resultadoBusca(alvos[1], 60, 74, 3, 'página vazia'), chave_busca: t.chaveBusca(alvos[1]), em: 1 },
  };
  assert.equal(t.estadoAlvo(alvos[0], feitas, {}, alvos).e, 'ok');
  assert.equal(t.estadoAlvo(alvos[1], feitas, {}, alvos).e, 'baixa');
  assert.equal(t.estadoAlvo(alvos[2], feitas, {}, alvos).e, 'falta');
  assert.equal(t.estadoAlvo(alvos[0], feitas, { [t.chaveAlvo(alvos[0])]: false }, alvos).e, 'falta');
  assert.equal(t.estadoAlvo(alvos[2], feitas, { [t.chaveAlvo(alvos[2])]: true }, alvos).e, 'ok');
  // de alvos[0]: a seguinte que falta (alvos[1], cobertura baixa) e, com ela marcada, outra do mesmo portal se houver
  assert.equal(t.proximoAlvo(alvos, alvos[0], feitas, {}), alvos[1]);
  const prox = t.proximoAlvo(alvos, alvos[0], feitas, { [t.chaveAlvo(alvos[1])]: true });
  assert.ok(![alvos[0], alvos[1]].includes(prox));
  const portal = (x) => new URL(x).hostname;
  if (alvos.slice(2).some((x) => portal(x) === portal(alvos[0]))) assert.equal(portal(prox), portal(alvos[0]));
  const todas = Object.fromEntries(alvos.map((a) => [t.chaveAlvo(a), true]));
  assert.equal(t.proximoAlvo(alvos, alvos[0], {}, todas), null);
});

test('menu de bairros: destaques primeiro, sem repetição e com slug válido', () => {
  const menu = json(t.BAIRROS_MENU);
  assert.deepEqual(menu.slice(0, 11), json(t.BAIRROS_DESTAQUE));
  assert.deepEqual(menu.slice(11), [...menu.slice(11)].sort((a, b) => a.localeCompare(b, 'pt')));
  assert.equal(new Set(menu).size, menu.length);
  assert.equal(new Set(menu.map(t.slugBairro)).size, menu.length);
  assert.ok(menu.every((b) => t.slugBairro(b)));
  const r = t.montarBuscas({ bairros: ['Caixa d\'Água', 'Caminho das Árvores'], tipos: ['loja'], portais: ['zap'] });
  assert.deepEqual(json(r.bairros), ['caixa-d-agua', 'caminho-das-arvores']);
});

test('busca desviada pelo portal: o bairro some do caminho', () => {
  const zap = 'https://www.zapimoveis.com.br/aluguel/casa-comercial/ba+salvador++caminho-das-arvores/?areaMinima=100&ordem=LOWEST_PRICE';
  assert.equal(t.bairroDaUrl(zap), 'caminho-das-arvores');
  assert.equal(t.redirecionada(zap, 'https://www.zapimoveis.com.br/aluguel/casa-comercial/ba+salvador/?onde=%2CBahia%2CSalvador&tipos=x'), true);
  assert.equal(t.redirecionada(zap, 'https://www.zapimoveis.com.br/aluguel/casa-comercial/ba+salvador++caminho-das-arvores/?pagina=2'), false);
  const olx = 'https://www.olx.com.br/imoveis/comercio-e-industria/aluguel/estado-ba/salvador/graca?commt=6&ss=100';
  assert.equal(t.redirecionada(olx, 'https://www.olx.com.br/imoveis/comercio-e-industria/aluguel/estado-ba/salvador/grande-salvador?commt=6'), true);
  assert.equal(t.redirecionada(olx, 'https://www.olx.com.br/imoveis/comercio-e-industria/aluguel/estado-ba/salvador/graca?commt=6&o=2'), false);
  assert.equal(t.redirecionada('https://www.zapimoveis.com.br/aluguel/loja-salao/ba+salvador/', 'https://www.zapimoveis.com.br/aluguel/x/'), false);
});
