const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const source = fs.readFileSync(__dirname + '/maps_entorno.user.js', 'utf8');

function carregar() {
  const ambiente = { __test: {}, localStorage: { getItem: () => null, setItem() {}, removeItem() {} }, location: { href: '' }, document: { querySelector: () => null, querySelectorAll: () => [] } };
  const instrumentado = source.slice(0, source.indexOf("  console.info('[Entorno do Maps] carregado');"))
    + 'Object.assign(globalThis.__test, { classificar, distancia, deslocar, lerCartao, lerFila, unir, resumir, precisaSubdividir, quadrantes, colsResumo, urlBusca });})();';
  vm.runInNewContext(instrumentado, ambiente, { filename: 'maps_entorno.user.js' });
  return ambiente.__test;
}

const t = carregar();

test('classifica cada resultado pela própria categoria e nome', () => {
  assert.equal(t.classificar('Pernambués', 'Estação de metrô'), 'metro');
  assert.equal(t.classificar('Estação BRT Cidadela', 'Serviço de transporte'), 'vlt_brt');
  assert.equal(t.classificar('Parada dos Navios', 'Estação de VLT'), 'vlt_brt');
  assert.equal(t.classificar('Salvador Shopping', 'Shopping center'), 'shopping');
  assert.equal(t.classificar('Lojas Renner', 'Loja de roupas'), 'outro');
  assert.equal(t.classificar('Estação Barra Funda', 'Estação de trem'), 'outro');
  assert.equal(t.classificar('Ponto de ônibus', 'Ponto de ônibus'), 'outro');
});

test('lê o cartão da lista do Maps', () => {
  const href = 'https://www.google.com/maps/place/X/data=!4m7!3m6!1s0x7161b1c2e0717ed:0x1afb82eb6ca850b5!8m2!3d-12.9756553!4d-38.4578312!16s%2Fg%2F11!19sChIJ7RcHLhwbFgcRtVCobOuC-xo?authuser=0';
  const r = t.lerCartao('Pátio Santa Luzia', 'Pátio Santa Luzia\n4,5(1.077)\nShopping center ·  · Av. Santa Luzia, 656\nAberto', href);
  assert.equal(r.categoria_maps, 'Shopping center');
  assert.equal(r.n_avaliacoes, '1077');
  assert.equal(r.lat, -12.9756553);
  assert.equal(r.lng, -38.4578312);
  assert.equal(r.place_id, 'ChIJ7RcHLhwbFgcRtVCobOuC-xo');
  assert.equal(r.id_maps, '0x7161b1c2e0717ed:0x1afb82eb6ca850b5');
});

test('distância e deslocamento em metros', () => {
  const [lat, lng] = t.deslocar(-12.97, -38.45, 0, 1000);
  assert.ok(Math.abs(t.distancia(-12.97, -38.45, lat, lng) - 1000) <= 2);
  assert.equal(t.quadrantes('estação BRT').length, 4);
});

test('fila aceita o B1_entorno.csv (vírgula, aspas) e linhas soltas', () => {
  const csv = 'place_id,nome,endereco,capital_busca,lat,lng\nA1,"Bar, Jogos","Rua 1, 2",Salvador,-12.9,-38.4\nA1,"Bar, Jogos",x,Salvador,-12.9,-38.4\nB2,Sem coord,x,y,,\n';
  assert.equal(JSON.stringify(t.lerFila(csv).map((l) => [l.place_id, l.nome, l.lat, l.lng])), JSON.stringify([['A1', 'Bar, Jogos', -12.9, -38.4]]));
  assert.equal(t.lerFila('C3;Casa;-12,95;-38,41').length, 1);
});

test('subdivide quando a lista lota sem chegar ao fim', () => {
  assert.equal(t.precisaSubdividir(10, false), true);
  assert.equal(t.precisaSubdividir(10, true), false);
  assert.equal(t.precisaSubdividir(4, false), false);
});

test('une repetidos, cada resultado conta em um grupo e os raios aninham', () => {
  const lidos = t.unir([
    { place_id: 'm1', nome: 'Pernambués', consulta: 'estação de metrô' },
    { place_id: 'm1', nome: 'Pernambués', consulta: 'estação BRT' },
    { place_id: 'b1', nome: 'BRT Cidadela', consulta: 'estação BRT' },
  ]);
  assert.equal(lidos.length, 2);
  assert.equal(lidos[0].consultas, 'estação de metrô | estação BRT');
  const resultados = [
    { grupo: 'metro', distancia_m: 330 }, { grupo: 'metro', distancia_m: 950 },
    { grupo: 'vlt_brt', distancia_m: 182 }, { grupo: 'shopping', distancia_m: 130, n_avaliacoes: '50000' },
    { grupo: 'shopping', distancia_m: 800, n_avaliacoes: '77' }, { grupo: 'outro', distancia_m: 10 },
  ];
  const r = t.resumir({ place_id: 'x', nome: 'X', lat: 0, lng: 0 }, resultados);
  assert.equal(r.qt_estacoes_metro_500m, 1);
  assert.equal(r.qt_estacoes_metro_1000m, 2);
  assert.equal(r.qt_estacoes_vlt_brt_500m, 1);
  assert.equal(r.qt_shoppings_1000m, 2);
  assert.equal(r.qt_shoppings_1000_aval_1000m, 1);
  assert.equal(r.dist_estacoes_metro_mais_proxima_lida_m, 330);
  // Soma dos grupos a 1000 m + fora dos grupos = total de resultados até 1000 m.
  const ate1000 = resultados.filter((x) => x.distancia_m <= 1000).length;
  assert.equal(r.qt_estacoes_metro_1000m + r.qt_estacoes_vlt_brt_1000m + r.qt_shoppings_1000m + 1, ate1000);
  for (const c of t.colsResumo()) assert.ok(c in r || ['resultados_lidos', 'buscas', 'consultas_subdivididas', 'censura_possivel', 'coletado_em'].includes(c), c);
});
