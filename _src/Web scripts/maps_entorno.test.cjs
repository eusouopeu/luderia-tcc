const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const source = fs.readFileSync(__dirname + '/maps_entorno.user.js', 'utf8');

function carregar() {
  const ambiente = { __test: {}, localStorage: { getItem: () => null, setItem() {}, removeItem() {} }, location: { href: '', pathname: '/maps/' }, document: { querySelector: () => null, querySelectorAll: () => [] } };
  const instrumentado = source.slice(0, source.indexOf("  console.info('[Entorno do Maps] carregado');"))
    + 'Object.assign(globalThis.__test, { classificar, suspeito, distancia, deslocar, mPorPx, planejarBusca, coberturaReal, lerCartao, lerFila, lerListaShoppings, cidadeDoEndereco, unir, nomesParecidos, marcarDuplicatas, mesmoShopping, areaCaixa, porteOsm, porteAbrasce, montarSaida, precisaSubdividir, quadrantes, colsResumo, nomesArquivos, dataLocal, foraDoMapa });})();';
  vm.runInNewContext(instrumentado, ambiente, { filename: 'maps_entorno.user.js' });
  return ambiente.__test;
}

const t = carregar();
const json = (x) => JSON.parse(JSON.stringify(x));

test('classifica cada resultado pela própria categoria e nome', () => {
  assert.equal(t.classificar('Pernambués', 'Estação de metrô'), 'metro');
  assert.equal(t.classificar('Estação BRT Cidadela', 'Serviço de transporte'), 'vlt_brt');
  assert.equal(t.classificar('Parada dos Navios', 'Estação de VLT'), 'vlt_brt');
  assert.equal(t.classificar('Salvador Shopping', 'Shopping center'), 'shopping');
  assert.equal(t.classificar('Lojas Renner', 'Loja de roupas'), 'outro');
  assert.equal(t.classificar('Estação Barra Funda', 'Estação de trem'), 'trem');
  assert.equal(t.classificar('Estação Central do Brasil', 'Estação ferroviária'), 'trem');
  assert.equal(t.classificar('Estação Luz - CPTM', 'Estação de transporte público'), 'trem');
  assert.equal(t.classificar('Trem Corcovado', 'Atração turística'), 'outro');
  assert.equal(t.classificar('Instituto X', 'Laboratório de metrologia'), 'outro');
});

test('estação classificada como outro dentro do raio vai para revisão', () => {
  assert.equal(t.suspeito({ grupo_auto: 'outro', distancia_m: 400, nome: 'Estação Recife', categoria_maps: 'Estação de transporte público' }), true);
  assert.equal(t.suspeito({ grupo_auto: 'outro', distancia_m: 1400, nome: 'Estação Recife', categoria_maps: 'Estação de transporte público' }), false);
  assert.equal(t.suspeito({ grupo_auto: 'outro', distancia_m: 100, nome: 'Padaria', categoria_maps: 'Padaria' }), false);
});

test('o centro da busca põe o alvo no meio do mapa visível e o zoom cobre o raio', () => {
  const jan = { w: 1024, h: 768, painel: 480 };
  const b = t.planejarBusca(-12.98, -38.46, 1000, jan);
  // mapa visível de 544 px: a 15z cobre ~1.240 m (> 1.100); a 16z, ~620 m.
  assert.equal(b.zoom, 15);
  assert.ok(b.lng < -38.46, 'centro vai para oeste do alvo');
  const cob = t.coberturaReal(-12.98, -38.46, b, jan);
  assert.ok(cob >= 1000 && cob <= 1300, `cobertura ${cob}`);
  // Sem o deslocamento, o alvo ficaria na borda do painel do Maps (cobertura ~150 m).
  assert.ok(t.coberturaReal(-12.98, -38.46, { zoom: 15, lat: -12.98, lng: -38.46 }, jan) < 200);
  // Janela estreita pede zoom menor; reducao força mais um nível.
  assert.equal(t.planejarBusca(-12.98, -38.46, 1000, { w: 800, h: 600, painel: 480 }).zoom, 14);
  assert.equal(t.planejarBusca(-12.98, -38.46, 1000, jan, 1).zoom, 14);
});

test('lê o cartão da lista do Maps', () => {
  const href = 'https://www.google.com/maps/place/X/data=!4m7!3m6!1s0x7161b1c2e0717ed:0x1afb82eb6ca850b5!8m2!3d-12.9756553!4d-38.4578312!16s%2Fg%2F11!19sChIJ7RcHLhwbFgcRtVCobOuC-xo?authuser=0';
  const r = t.lerCartao('Pátio Santa Luzia', 'Pátio Santa Luzia\n4,5(1.077)\nShopping center ·  · Av. Santa Luzia, 656\nAberto', href);
  assert.equal(r.categoria_maps, 'Shopping center');
  assert.equal(r.n_avaliacoes, '1077');
  assert.equal(r.lat, -12.9756553);
  assert.equal(r.place_id, 'ChIJ7RcHLhwbFgcRtVCobOuC-xo');
  assert.equal(r.id_maps, '0x7161b1c2e0717ed:0x1afb82eb6ca850b5');
});

test('fila aceita o B1_entorno.csv, com cidade tirada do endereço', () => {
  const csv = 'place_id,nome,endereco,capital_busca,lat,lng\nA1,"Bar, Jogos","R. Chile, 2077 - Rebouças, Curitiba - PR, 80220-181, Brazil",Curitiba,-12.9,-38.4\nA1,"Bar, Jogos",x,y,-12.9,-38.4\nB2,Sem coord,x,y,,\n';
  assert.deepEqual(json(t.lerFila(csv)), [{ place_id: 'A1', nome: 'Bar, Jogos', cidade: 'Curitiba', lat: -12.9, lng: -38.4 }]);
  assert.equal(t.lerFila('C3;Casa;-12,95;-38,41').length, 1);
  assert.equal(t.cidadeDoEndereco('Av. Amazonas, 2310 - Santo Agostinho, Belo Horizonte - MG, 30180-012, Brazil'), 'Belo Horizonte');
});

test('lista da Abrasce com ou sem cabeçalho', () => {
  assert.deepEqual(json(t.lerListaShoppings('Shopping;Cidade\nShopping da Bahia;Salvador\n')), [{ nome: 'Shopping da Bahia', cidade: 'Salvador' }]);
  assert.deepEqual(json(t.lerListaShoppings('Salvador Shopping\nShopping Barra\n')).map((s) => s.nome), ['Salvador Shopping', 'Shopping Barra']);
});

test('subdivide quando a lista lota sem chegar ao fim', () => {
  assert.equal(t.precisaSubdividir(10, false), true);
  assert.equal(t.precisaSubdividir(10, true), false);
  assert.equal(t.precisaSubdividir(4, false), false);
  const q = t.quadrantes({ consulta: 'estação BRT', grupo: 'vlt_brt' });
  assert.equal(q.length, 4);
  assert.ok(q.every((x) => x.alcance === 500 && Math.abs(x.norte) === 500));
});

test('nomes parecidos para fundir duplicatas', () => {
  assert.equal(t.nomesParecidos('Pernambués', 'Estação Pernambués - Linha 2'), true);
  assert.equal(t.nomesParecidos('Estação BRT - Parque da Cidade', 'Estação BRT Parque da Cidade (sentido Iguatemi)'), true);
  assert.equal(t.nomesParecidos('Estação BRT - Hiper', 'Estação BRT Cidadela'), false);
});

test('duplicata: mesmo grupo, até 150 m e nome parecido; fica o de mais avaliações', () => {
  const rs = t.marcarDuplicatas([
    { nome: 'Estação BRT Cidadela', grupo: 'vlt_brt', lat: -12.99, lng: -38.47, n_avaliacoes: '10' },
    { nome: 'Estação BRT Cidadela (sentido Lapa)', grupo: 'vlt_brt', lat: -12.9905, lng: -38.47, n_avaliacoes: '40' },
    { nome: 'Estação BRT Hiper', grupo: 'vlt_brt', lat: -12.9906, lng: -38.47, n_avaliacoes: '5' },
    { nome: 'Estação BRT Cidadela', grupo: 'vlt_brt', lat: -12.995, lng: -38.47, n_avaliacoes: '1' },
  ]);
  assert.equal(rs[0].duplicata_de, 'Estação BRT Cidadela (sentido Lapa)');
  assert.equal(rs[1].duplicata_de, '');
  assert.equal(rs[2].duplicata_de, '');
  assert.equal(rs[3].duplicata_de, '', 'a 550 m não é duplicata');
});

test('porte pelo OSM e pela Abrasce', () => {
  const caixa = { minlat: -12.9828, maxlat: -12.9806, minlon: -38.4657, maxlon: -38.4629 };
  const area = t.areaCaixa(caixa);
  assert.ok(area > 70000 && area < 80000, `área ${area}`);
  const osm = { malls: [{ nome: 'Shopping da Bahia', ...caixa, area_m2: area }, { nome: 'Galeria', minlat: -12.97, maxlat: -12.9699, minlon: -38.45, maxlon: -38.4499, area_m2: 1200 }] };
  assert.equal(t.porteOsm({ lat: -12.9815, lng: -38.464 }, osm, 5000).porte_shopping, 'sim');
  assert.equal(t.porteOsm({ lat: -12.96995, lng: -38.44995 }, osm, 5000).porte_shopping, 'não');
  assert.equal(t.porteOsm({ lat: -12.9, lng: -38.4 }, osm, 5000).porte_base, 'sem polígono shop=mall no OSM');
  assert.equal(t.porteOsm({ lat: -12.9, lng: -38.4 }, { erro: 'x' }, 5000).porte_shopping, '');

  const lista = [{ nome: 'Shopping Barra', cidade: 'Salvador' }, { nome: 'BarraShopping', cidade: 'Rio de Janeiro' }];
  assert.equal(t.porteAbrasce({ nome: 'Shopping Barra' }, { cidade: 'Salvador' }, lista).porte_shopping, 'sim');
  assert.equal(t.porteAbrasce({ nome: 'Empresarial 104' }, { cidade: 'Salvador' }, lista).porte_shopping, 'não');
  assert.equal(t.porteAbrasce({ nome: 'Barra Shopping' }, { cidade: 'Recife' }, lista).porte_shopping, 'não', 'cidade diferente');
  assert.equal(t.porteAbrasce({ nome: 'X' }, {}, []).porte_shopping, '');
  assert.equal(t.mesmoShopping('Salvador Shopping', 'Shopping Salvador'), true);
});

test('resumo: revisão, duplicata, falha em branco e soma que fecha', () => {
  const local = { consultas: ['estação de metrô', 'estação de trem', 'estação BRT', 'estação VLT', 'shopping center'], chave: 'x', place_id: 'x', nome: 'X', cidade: 'Salvador', lat: -12.99, lng: -38.47, buscas: 5, falhas: ['estação VLT'], censura: [], cobertura_insuf: [], subdivididas: [], cobertura_min_m: 1200, osm: { malls: [] }, coletado_em: 'h' };
  const categoria = { metro: 'Estação de metrô', shopping: 'Shopping center', outro: 'Padaria' };
  const r = (nome, grupo_auto, distancia_m, extra = {}) => ({ origem: 'x', nome, grupo_auto, categoria_maps: categoria[grupo_auto], distancia_m, lat: -12.99 + distancia_m / 111320, lng: -38.47, n_avaliacoes: '1', place_id: nome, ...extra });
  const dados = {
    locais: [local],
    resultados: [
      r('Pernambués', 'metro', 330), r('Iguatemi', 'metro', 950),
      r('Estação Pernambués - Linha 2', 'metro', 340),
      r('Estação Recife', 'outro', 600, { categoria_maps: 'Estação de transporte público' }),
      r('Estação Luz', 'outro', 700, { categoria_maps: 'Estação de trem' }),
      r('Empresarial 104', 'shopping', 800),
      r('Padaria', 'outro', 200), r('Longe', 'metro', 2500),
    ],
  };
  const { resumo, resultados } = t.montarSaida(dados, { 'Estação Recife': 'metro' }, { porte: 'osm', area_min_m2: 5000, abrasce: [] });
  const l = resumo[0];
  assert.equal(l.qt_estacoes_metro_500m, 1, 'Pernambués e sua duplicata contam uma vez');
  assert.equal(l.qt_estacoes_metro_1000m, 3, 'Pernambués, Iguatemi e a revisada');
  assert.equal(l.qt_estacoes_vlt_brt_1000m, '', 'consulta de VLT falhou: em branco, não zero');
  assert.equal(l.qt_shoppings_1000m, 1);
  assert.equal(l.qt_estacoes_trem_1000m, 1, 'reclassificada na exportação');
  assert.equal(l.qt_shoppings_porte_1000m, 0);
  assert.equal(l.duplicatas_fundidas, 1);
  assert.equal(l.revisoes_manuais, 1);
  assert.equal(l.situacao, 'falhou');
  assert.equal(l.qt_estacoes_metro_1000m + l.qt_estacoes_trem_1000m + l.qt_shoppings_1000m + l.qt_outros_1000m, l.resultados_ate_1000m);
  assert.equal(resultados.find((x) => x.nome === 'Estação Recife').grupo, 'metro');
  for (const c of t.colsResumo()) assert.ok(c in l, c);
});

test('estabelecimento coletado antes da busca de trem: grupo trem em branco e pendente', () => {
  const local = { chave: 'y', place_id: 'y', nome: 'Y', lat: -12.99, lng: -38.47, buscas: 4, falhas: [], censura: [], cobertura_insuf: [], subdivididas: [], osm: { malls: [] }, coletado_em: 'h' };
  const { resumo } = t.montarSaida({ locais: [local], resultados: [] }, {}, { porte: 'osm', area_min_m2: 5000, abrasce: [] });
  assert.equal(resumo[0].qt_estacoes_trem_1000m, '');
  assert.equal(resumo[0].qt_estacoes_metro_1000m, 0);
  assert.equal(resumo[0].consultas_nao_feitas, 'estação de trem');
  assert.equal(resumo[0].situacao, 'busca nova não feita');
});

test('nome do arquivo: data local primeiro, depois o estabelecimento', () => {
  assert.deepEqual(json(t.nomesArquivos([{ nome: 'São Jogue - Rio Vermelho' }], '2026-10-14')), {
    resumo: '2026-10-14_sao_jogue_rio_vermelho_entorno_resumo.csv',
    resultados: '2026-10-14_sao_jogue_rio_vermelho_entorno_resultados.csv',
  });
  assert.equal(t.nomesArquivos([{ nome: 'A' }, { nome: 'B' }, { nome: 'C' }], '2026-10-14', 'parcial-010').resumo, '2026-10-14_3_estabelecimentos_entorno_resumo_parcial-010.csv');
  assert.equal(t.dataLocal(new Date(2026, 9, 14, 23, 30)), '2026-10-14', 'às 23h30 ainda é dia 14');
});

test('lista lotada com item fora do mapa visível não subdivide', () => {
  const jan = { w: 1024, h: 768, painel: 480 };
  const b = t.planejarBusca(-12.98, -38.46, 1000, jan);
  assert.equal(t.foraDoMapa({ lat: -12.985, lng: -38.46 }, b, jan), false);
  assert.equal(t.foraDoMapa({ lat: -12.90, lng: -38.46 }, b, jan), true, '9 km ao norte');
});
