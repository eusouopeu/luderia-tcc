const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const source = fs.readFileSync(__dirname + '/maps_entorno.user.js', 'utf8');

function carregar() {
  const ambiente = { __test: {}, localStorage: { getItem: () => null, setItem() {}, removeItem() {} }, location: { href: '', pathname: '/maps/' }, document: { querySelector: () => null, querySelectorAll: () => [] } };
  const instrumentado = source.slice(0, source.indexOf("  console.info('[Entorno do Maps] carregado');"))
    + 'Object.assign(globalThis.__test, { classificar, suspeito, distancia, deslocar, mPorPx, planejarBusca, coberturaReal, lerCartao, lerFila, lerListaShoppings, cidadeDoEndereco, unir, nomesParecidos, marcarDuplicatas, mesmoShopping, areaCaixa, porteOsm, porteAbrasce, montarSaida, precisaSubdividir, quadrantes, colsResumo, nomesArquivos, dataLocal, foraDoMapa, tarefasIniciais, consultasDispensadas, classificarOsm, linhasOsm, resumirOsm, colsOsm, montarShoppings, decidir, distCaixa, elementoOsm, uniaoLocais });})();';
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
    osm_resumo: '2026-10-14_sao_jogue_rio_vermelho_entorno_osm_resumo.csv',
    osm_resultados: '2026-10-14_sao_jogue_rio_vermelho_entorno_osm_resultados.csv',
    shoppings: '2026-10-14_sao_jogue_rio_vermelho_entorno_shoppings.csv',
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

test('busca dispensada em cidade sem o sistema; cidade fora da tabela faz todas', () => {
  const consultas = (cidade) => t.tarefasIniciais({ cidade }).map((x) => x.consulta);
  assert.deepEqual(json(consultas('Salvador')), ['estação de metrô', 'estação BRT', 'estação VLT', 'shopping center']);
  assert.deepEqual(json(consultas('São Paulo')), ['estação de metrô', 'estação de trem', 'estação BRT', 'shopping center']);
  assert.deepEqual(json(consultas('Curitiba')), ['estação BRT', 'shopping center']);
  assert.equal(consultas('Rio de Janeiro').length, 5);
  assert.equal(consultas('Duque de Caxias').length, 5, 'fora da tabela: todas');
  assert.equal(consultas('').length, 5);
});

test('dispensada sai zero, não branco; estação mais próxima entre metrô, trem e VLT/BRT', () => {
  const local = { chave: 'c', place_id: 'c', nome: 'C', cidade: 'Curitiba', lat: -25.43, lng: -49.27, buscas: 2, falhas: [], censura: [], cobertura_insuf: [], subdivididas: [], osm: { malls: [] }, coletado_em: 'h',
    consultas: ['estação BRT', 'shopping center'], consultas_dispensadas: ['estação de metrô', 'estação de trem', 'estação VLT'] };
  const r = (nome, categoria_maps, distancia_m) => ({ origem: 'c', nome, categoria_maps, distancia_m, lat: -25.43 + distancia_m / 111320, lng: -49.27, n_avaliacoes: '1', place_id: nome });
  const { resumo } = t.montarSaida({ locais: [local], resultados: [r('Estação Tubo Central', 'Estação BRT', 640), r('Estação Tubo Praça', 'Estação BRT', 900)] }, {}, { porte: 'osm', area_min_m2: 5000, abrasce: [] });
  const l = resumo[0];
  assert.equal(l.qt_estacoes_metro_1000m, 0);
  assert.equal(l.qt_estacoes_trem_1000m, 0);
  assert.equal(l.qt_estacoes_vlt_brt_1000m, 2);
  assert.equal(l.situacao, 'ok');
  assert.equal(l.consultas_dispensadas, 'estação de metrô | estação de trem | estação VLT');
  assert.equal(l.dist_estacao_mais_proxima_lida_m, 640);
  assert.equal(l.estacao_mais_proxima, 'Estação Tubo Central');
  assert.equal(l.tipo_estacao_mais_proxima, 'vlt_brt');

  // Busca de transporte que falhou deixa a estação mais próxima em branco.
  const falhou = { ...local, falhas: ['estação BRT'] };
  assert.equal(t.montarSaida({ locais: [falhou], resultados: [] }, {}, { porte: 'osm', area_min_m2: 5000, abrasce: [] }).resumo[0].dist_estacao_mais_proxima_lida_m, '');
});

test('coleta de 15/10: estação-tubo, operador, futura estação e sede de companhia', () => {
  assert.equal(t.classificar('Estação Tubo Mariano Torres', ''), 'vlt_brt');
  assert.equal(t.classificar('Estação Tubo Praça Osório', 'Estação de ônibus'), 'vlt_brt');
  assert.equal(t.classificar('Trensurb Estação Rodoviária', 'Estação de metrô'), 'trem');
  assert.equal(t.classificar('Futura estação Rua do Grito (BRT ABC)', 'Empresa de ônibus'), 'outro');
  assert.equal(t.classificar('Companhia do Metropolitano do Distrito Federal', 'Companhia ferroviária'), 'outro');
});

test('categoria do cartão ignora a nota e o preço antes do "·"', () => {
  assert.equal(t.lerCartao('Estação 102', 'Estação 102\n4,0(1.731) · $$\nRestaurante · Av. X, 10', '').categoria_maps, 'Restaurante');
  assert.equal(t.lerCartao('Shopping Hauer', 'Shopping Hauer\n4,4(6.234) · \nShopping center ·  · R. Y', '').categoria_maps, 'Shopping center');
});

test('resultado de outra região fica fora das distâncias; porte sem OSM aparece na situação', () => {
  const local = { chave: 'c', place_id: 'c', nome: 'C', cidade: 'Curitiba', lat: -25.43, lng: -49.27, buscas: 2, falhas: [], censura: [], cobertura_insuf: [], subdivididas: [], osm: { erro: 'HTTP 429' }, coletado_em: 'h',
    consultas: ['estação BRT', 'shopping center'], consultas_dispensadas: ['estação de metrô', 'estação de trem', 'estação VLT'] };
  const r = (nome, categoria_maps, distancia_m) => ({ origem: 'c', nome, categoria_maps, distancia_m, lat: -25.43 + distancia_m / 111320, lng: -49.27, n_avaliacoes: '1', place_id: nome });
  const { resumo, resultados } = t.montarSaida({ locais: [local], resultados: [
    r('Estação BRT Cidadela', 'Serviço de transporte', 1786000), r('Lapa', 'Estação de metrô', 1786280),
    r('Estação Tubo Bigorrilho', '', 3775), r('Shopping Curitiba', 'Shopping center', 800),
  ] }, {}, { porte: 'osm', area_min_m2: 5000, abrasce: [] });
  const l = resumo[0];
  assert.equal(l.dist_estacoes_vlt_brt_mais_proxima_lida_m, 3775);
  assert.equal(l.dist_estacoes_metro_mais_proxima_lida_m, '');
  assert.equal(l.estacao_mais_proxima, 'Estação Tubo Bigorrilho');
  assert.equal(resultados.find((x) => x.nome === 'Lapa').fora_da_regiao, 'sim');
  assert.equal(l.qt_shoppings_porte_1000m, '');
  assert.equal(l.situacao, 'porte sem OSM');
});

const OP = { porte: 'osm', area_min_m2: 5000, limiar_aval: 1000, abrasce: [] };

test('OSM: grupo pelas tags (metrô, trem, VLT, BRT, tubo, terminal, barca)', () => {
  assert.equal(t.classificarOsm({ railway: 'station', station: 'subway' }, 'Consolação'), 'metro');
  assert.equal(t.classificarOsm({ public_transport: 'station', subway: 'yes' }, 'Estação Lapa'), 'metro');
  assert.equal(t.classificarOsm({ railway: 'station', station: 'monorail' }, 'Vila Prudente'), 'metro');
  assert.equal(t.classificarOsm({ railway: 'station' }, 'Barra Funda'), 'trem');
  assert.equal(t.classificarOsm({ railway: 'station', station: 'subway', operator: 'Trensurb' }, 'Mercado'), 'trem');
  assert.equal(t.classificarOsm({ railway: 'station', operator: 'Companhia do Metropolitano de São Paulo;CPTM' }, 'Luz'), 'trem');
  assert.equal(t.classificarOsm({ railway: 'tram_stop' }, 'Parada dos Navios'), 'vlt_brt');
  assert.equal(t.classificarOsm({ railway: 'station', station: 'light_rail' }, 'Cinelândia'), 'vlt_brt');
  assert.equal(t.classificarOsm({ public_transport: 'station', bus: 'yes', network: 'BRT Salvador' }, 'Estação Rodoviária'), 'vlt_brt');
  assert.equal(t.classificarOsm({ highway: 'bus_stop' }, 'Estação Tubo Praça Osório'), 'vlt_brt');
  assert.equal(t.classificarOsm({ amenity: 'bus_station' }, 'Terminal da Lapa'), 'outro');
  assert.equal(t.classificarOsm({ public_transport: 'station', ferry: 'yes' }, 'Terminal de São Joaquim'), 'outro');
  assert.equal(t.classificarOsm({ railway: 'station', station: 'funicular' }, 'Plano Inclinado'), 'outro');
  assert.equal(t.classificarOsm({ railway: 'station' }, 'Futura estação Ipiranga'), 'outro');
  assert.equal(t.classificarOsm({ shop: 'mall' }, 'Shopping da Bahia'), 'shopping');
  assert.equal(t.classificarOsm({ leisure: 'park' }, 'Parque da Cidade'), 'praia_parque');
  assert.equal(t.classificarOsm({ natural: 'beach' }, 'Praia do Farol'), 'praia_parque');
});

test('OSM: distância até a borda da caixa e elemento reduzido', () => {
  const caixa = { minlat: -13.01, maxlat: -13.0, minlon: -38.5, maxlon: -38.49 };
  assert.equal(t.distCaixa(-13.005, -38.495, caixa), 0, 'dentro da caixa');
  const e = t.elementoOsm({ type: 'way', id: 5, center: { lat: -13.005, lon: -38.495 }, bounds: caixa, tags: { name: 'Praia X', natural: 'beach', source: 'bing' } }, { lat: -13.012, lng: -38.495 });
  assert.equal(e.osm_id, 'way/5');
  assert.ok(e.distancia_m > 200 && e.distancia_m < 250, `${e.distancia_m}`);
  assert.deepEqual(json(e.tags), { natural: 'beach' }, 'só as tags usadas');
  assert.equal(e.caixa, undefined, 'caixa só para shopping');
});

test('OSM: duplicatas, sistema sem operação e soma que fecha', () => {
  const local = { place_id: 's', nome: 'S', cidade: 'Salvador', lat: -13, lng: -38.5 };
  const el = (id, nome, tags, distancia_m, extra = {}) => ({ osm_id: id, nome, tags, lat: -13 + distancia_m / 111320, lng: -38.5, area_m2: null, distancia_m, ...extra });
  const entrada = { consultado_em: 'h', elementos: [
    el('node/1', 'Rio Vermelho', { railway: 'station', station: 'subway' }, 400),
    el('way/2', 'Estação Rio Vermelho', { public_transport: 'station', subway: 'yes' }, 410, { area_m2: 900 }),
    el('node/3', 'Calçada', { railway: 'station' }, 800),
    el('way/4', 'Shopping X', { shop: 'mall' }, 300, { area_m2: 20000 }),
    el('node/5', 'Galeria Y', { shop: 'mall' }, 600),
    el('way/6', 'Praça A', { leisure: 'park' }, 100, { area_m2: 3000 }),
    el('way/7', 'Praça B', { leisure: 'park' }, 150, { area_m2: 2000 }),
    el('node/8', 'Terminal Z', { amenity: 'bus_station' }, 900),
    el('node/9', 'Metrô longe', { railway: 'station', station: 'subway' }, 1700),
  ] };
  const rs = t.linhasOsm(local, entrada);
  assert.equal(rs.find((r) => r.osm_id === 'node/1').duplicata_de, 'Estação Rio Vermelho', 'fica o polígono');
  assert.equal(rs.find((r) => r.osm_id === 'node/3').grupo, 'outro', 'trem em Salvador: sem operação');
  assert.equal(rs.find((r) => r.osm_id === 'node/3').observacao, 'sistema sem operação na cidade');
  assert.equal(rs.find((r) => r.osm_id === 'way/7').duplicata_de, '', 'praças diferentes');
  const l = t.resumirOsm(local, entrada, rs, OP);
  assert.equal(l.qt_estacoes_metro_500m, 1);
  assert.equal(l.qt_estacoes_metro_1000m, 1);
  assert.equal(l.qt_estacoes_trem_1000m, 0);
  assert.equal(l.qt_shoppings_1000m, 2);
  assert.equal(l.qt_shoppings_area_min_1000m, 1);
  assert.equal(l.qt_praias_parques_500m, 2);
  assert.equal(l.dist_estacoes_metro_mais_proxima_m, 410);
  assert.equal(l.estacao_mais_proxima, 'Estação Rio Vermelho');
  assert.equal(l.sistemas_sem_operacao, 'trem');
  assert.equal(l.qt_estacoes_metro_1000m + l.qt_estacoes_trem_1000m + l.qt_estacoes_vlt_brt_1000m + l.qt_shoppings_1000m + l.qt_praias_parques_1000m + l.qt_outros_1000m, l.elementos_ate_1000m);
  for (const c of t.colsOsm()) assert.ok(c in l, c);
  assert.equal(t.resumirOsm(local, undefined, [], OP).situacao, 'não coletado no OSM');
  assert.equal(t.resumirOsm(local, { erro: 'HTTP 429' }, [], OP).situacao, 'erro no OSM: HTTP 429');
});

test('shoppings: área do OSM e avaliações do Maps na mesma linha', () => {
  const local = { place_id: 'x', nome: 'X', cidade: 'Salvador', lat: -12.99, lng: -38.47 };
  const malls = [
    { id: 'way/1', nome: 'Shopping da Bahia', area_m2: 75000, distancia_m: 300, minlat: -12.9828, maxlat: -12.9806, minlon: -38.4657, maxlon: -38.4629 },
    { id: 'way/2', nome: 'Galeria', area_m2: 1200, distancia_m: 700, minlat: -12.97, maxlat: -12.9699, minlon: -38.45, maxlon: -38.4499 },
    { id: 'way/3', nome: 'Só no OSM', area_m2: 9000, distancia_m: 900, minlat: -12.96, maxlat: -12.959, minlon: -38.44, maxlon: -38.439 },
  ];
  const r = (nome, lat, lng, n, distancia_m) => ({ grupo: 'shopping', nome, categoria_maps: 'Shopping center', lat, lng, n_avaliacoes: String(n), distancia_m, place_id: nome });
  const maps = [
    r('Shopping da Bahia', -12.9815, -38.464, 90000, 300), r('Shopping da Bahia - Piso L2', -12.9816, -38.4641, 50, 305),
    r('Galeria', -12.96995, -38.44995, 3000, 700), r('Empresarial 104', -12.98, -38.47, 20, 800),
  ];
  const s = t.montarShoppings(local, maps, malls, true, { ...OP, porte: 'ambos' });
  const por = (n) => s.find((x) => (x.nome_maps || x.nome_osm) === n);
  assert.equal(por('Shopping da Bahia').area_osm_m2, 75000);
  assert.equal(por('Shopping da Bahia').porte, 'sim');
  assert.equal(por('Shopping da Bahia - Piso L2').mesmo_poligono_de, 'Shopping da Bahia');
  assert.equal(por('Galeria').porte_osm, 'não');
  assert.equal(por('Galeria').porte_avaliacoes, 'sim');
  assert.equal(por('Galeria').porte, 'não', 'ambos: falta a área');
  assert.equal(por('Empresarial 104').fonte, 'só maps');
  assert.equal(por('Só no OSM').fonte, 'só osm');
  assert.equal(por('Só no OSM').porte_avaliacoes, 'não', 'o Maps cobriu o raio e não o trouxe');
  assert.equal(s.length, 5);
  assert.equal(t.montarShoppings(local, maps, malls, true, { ...OP, porte: 'qualquer' }).find((x) => x.nome_maps === 'Galeria').porte, 'sim');
  // Sem OSM: área desconhecida; "ambos" fica em branco se a avaliação passa.
  const semOsm = t.montarShoppings(local, maps, null, true, { ...OP, porte: 'ambos' });
  assert.equal(semOsm.find((x) => x.nome_maps === 'Galeria').porte, '');
  assert.equal(semOsm.find((x) => x.nome_maps === 'Empresarial 104').porte, 'não');
  assert.equal(t.decidir(['sim', ''], 'ou'), 'sim');
  assert.equal(t.decidir(['não', ''], 'ou'), '');
});

test('exportação pela lista: linha para quem falta e porte com OSM novo', () => {
  const local = { consultas: ['estação de metrô', 'estação BRT', 'estação VLT', 'shopping center'], consultas_dispensadas: ['estação de trem'], chave: 'a', place_id: 'a', nome: 'A', cidade: 'Salvador', lat: -12.99, lng: -38.47, buscas: 4, falhas: [], censura: [], cobertura_insuf: [], subdivididas: [], coletado_em: 'h' };
  const dados = { locais: [local], resultados: [{ origem: 'a', nome: 'Shopping X', categoria_maps: 'Shopping center', distancia_m: 300, lat: -12.99 + 300 / 111320, lng: -38.47, n_avaliacoes: '5000', place_id: 'sx' }] };
  const osm = { a: { place_id: 'a', nome: 'A', cidade: 'Salvador', lat: -12.99, lng: -38.47, consultado_em: 'h', elementos: [
    { osm_id: 'way/9', nome: 'Shopping X', tags: { shop: 'mall' }, lat: -12.99 + 300 / 111320, lng: -38.47, area_m2: 30000, distancia_m: 290, caixa: { minlat: -12.9875, maxlat: -12.9850, minlon: -38.4710, maxlon: -38.4690 } },
  ] } };
  const lista = [{ place_id: 'a', nome: 'A', cidade: 'Salvador', lat: -12.99, lng: -38.47 }, { place_id: 'b', nome: 'B', cidade: 'Recife', lat: -8.05, lng: -34.9 }];
  const s = t.montarSaida(dados, {}, { ...OP, porte: 'ambos' }, osm, lista);
  assert.equal(s.resumo.length, 2);
  assert.equal(s.resumo[0].qt_shoppings_porte_1000m, 1);
  assert.equal(s.resumo[0].qt_shoppings_porte_osm_1000m, 1);
  assert.equal(s.resumo[0].qt_shoppings_porte_aval_1000m, 1);
  assert.equal(s.resumo[0].situacao, 'ok');
  assert.equal(s.resumo[1].situacao, 'não coletado no Maps');
  assert.equal(s.osmResumo[1].situacao, 'não coletado no OSM');
  assert.equal(s.shoppings.length, 1);
  assert.equal(s.shoppings[0].fonte, 'maps e osm');
  assert.equal(s.resultados[0].porte_shopping, 'sim');
  // Sem lista: tudo o que está guardado, cada um uma vez.
  assert.equal(t.montarSaida(dados, {}, OP, osm).universo.length, 1);
});
