const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const source = fs.readFileSync(__dirname + '/maps_entorno.user.js', 'utf8');

function carregar() {
  const ambiente = { __test: {}, localStorage: { getItem: () => null, setItem() {}, removeItem() {} }, location: { href: '', pathname: '/maps/' }, document: { querySelector: () => null, querySelectorAll: () => [] } };
  const instrumentado = source.slice(0, source.indexOf("  console.info('[Entorno do Maps] carregado');"))
    + 'Object.assign(globalThis.__test, { estadoLocal, proximoLocal, classificar, suspeito, distancia, deslocar, mPorPx, planejarBusca, coberturaReal, lerCartao, lerNumeroAvaliacoes, lerFila, cidadeDoEndereco, unir, nomesParecidos, marcarDuplicatas, mesmoShopping, montarSaida, montarShoppings, precisaSubdividir, decidirLista, cruzamento, quadrantes, colsResumo, nomesArquivos, dataLocal, foraDoMapa, tarefasIniciais, consultasDispensadas, uniaoLocais, classificarNaCidade, gruposAusentes, grupoRevisto, semRetiradas });})();';
  vm.runInNewContext(instrumentado, ambiente, { filename: 'maps_entorno.user.js' });
  return ambiente.__test;
}

const t = carregar();
const json = (x) => JSON.parse(JSON.stringify(x));
const OP = { limiar_aval: 1000 };

test('classifica cada resultado pela própria categoria e nome', () => {
  assert.equal(t.classificar('Pernambués', 'Estação de metrô'), 'metro');
  assert.equal(t.classificar('Estação BRT Cidadela', 'Serviço de transporte'), 'outro', 'BRT fora do plano');
  assert.equal(t.classificar('Parada dos Navios', 'Estação de VLT'), 'vlt');
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

test('subdivide quando a lista lota sem chegar ao fim', () => {
  assert.equal(t.precisaSubdividir(10, false), true);
  assert.equal(t.precisaSubdividir(10, true), false);
  assert.equal(t.precisaSubdividir(4, false), false);
  const q = t.quadrantes({ consulta: 'estação de metrô', grupo: 'metro' });
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
    { nome: 'Estação BRT Cidadela', grupo: 'metro', lat: -12.99, lng: -38.47, n_avaliacoes: '10' },
    { nome: 'Estação BRT Cidadela (sentido Lapa)', grupo: 'metro', lat: -12.9905, lng: -38.47, n_avaliacoes: '40' },
    { nome: 'Estação BRT Hiper', grupo: 'metro', lat: -12.9906, lng: -38.47, n_avaliacoes: '5' },
    { nome: 'Estação BRT Cidadela', grupo: 'metro', lat: -12.995, lng: -38.47, n_avaliacoes: '1' },
  ]);
  assert.equal(rs[0].duplicata_de, 'Estação BRT Cidadela (sentido Lapa)');
  assert.equal(rs[1].duplicata_de, '');
  assert.equal(rs[2].duplicata_de, '');
  assert.equal(rs[3].duplicata_de, '', 'a 550 m não é duplicata');
});

test('resumo: revisão, duplicata, falha em branco e soma que fecha', () => {
  const local = { consultas: ['estação de metrô', 'estação de trem', 'estação VLT', 'shopping center'], chave: 'x', place_id: 'x', nome: 'X', cidade: 'São Paulo', lat: -12.99, lng: -38.47, buscas: 5, falhas: ['estação VLT'], censura: [], cobertura_insuf: [], subdivididas: [], cobertura_min_m: 1200, coletado_em: 'h' };
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
  const { resumo, resultados } = t.montarSaida(dados, { 'Estação Recife': 'metro' }, OP);
  const l = resumo[0];
  assert.equal(l.qt_estacoes_metro_500m, 1, 'Pernambués e sua duplicata contam uma vez');
  assert.equal(l.qt_estacoes_metro_1000m, 3, 'Pernambués, Iguatemi e a revisada');
  assert.equal(l.qt_estacoes_vlt_1000m, '', 'consulta de VLT falhou: em branco, não zero');
  assert.ok(!('qt_estacoes_brt_1000m' in l), 'BRT fora da coleta');
  assert.equal(l.qt_estacoes_trilhos_1000m, '', 'VLT em branco deixa trilhos em branco');
  assert.equal(l.dist_trilhos_mais_proxima_m, '');
  assert.equal(l.qt_shoppings_1000m, 1);
  assert.equal(l.qt_estacoes_trem_1000m, 1, 'reclassificada na exportação');
  assert.equal(l.qt_shoppings_porte_1000m, 0, 'Empresarial 104 tem 1 avaliação');
  assert.equal(l.duplicatas_fundidas, 1);
  assert.equal(l.revisoes_manuais, 1);
  assert.equal(l.situacao, 'falhou');
  assert.equal(l.qt_estacoes_metro_1000m + l.qt_estacoes_trem_1000m + l.qt_shoppings_1000m + l.qt_outros_1000m, l.resultados_ate_1000m);
  assert.equal(resultados.find((x) => x.nome === 'Estação Recife').grupo, 'metro');
  for (const c of t.colsResumo()) assert.ok(c in l, c);
});

test('estabelecimento coletado antes da busca de trem: grupo trem em branco e pendente', () => {
  const local = { chave: 'y', place_id: 'y', nome: 'Y', lat: -12.99, lng: -38.47, buscas: 4, falhas: [], censura: [], cobertura_insuf: [], subdivididas: [], coletado_em: 'h' };
  const { resumo } = t.montarSaida({ locais: [local], resultados: [] }, {}, OP);
  assert.equal(resumo[0].qt_estacoes_trem_1000m, '');
  assert.equal(resumo[0].qt_estacoes_metro_1000m, 0);
  assert.equal(resumo[0].consultas_nao_feitas, 'estação de trem');
  assert.equal(resumo[0].situacao, 'busca nova não feita');
});

test('nome do arquivo: data local primeiro, depois o estabelecimento', () => {
  assert.deepEqual(json(t.nomesArquivos([{ nome: 'São Jogue - Rio Vermelho' }], '2026-10-14')), {
    resumo: '2026-10-14_sao_jogue_rio_vermelho_entorno_resumo.csv',
    resultados: '2026-10-14_sao_jogue_rio_vermelho_entorno_resultados.csv',
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
  assert.deepEqual(json(consultas('Salvador')), ['estação de metrô', 'estação VLT', 'shopping center']);
  assert.deepEqual(json(consultas('São Paulo')), ['estação de metrô', 'estação de trem', 'estação VLT', 'shopping center'], 'VLT: monotrilho fora da categoria de metrô');
  assert.deepEqual(json(consultas('Campinas')), ['shopping center']);
  assert.equal(consultas('Porto Alegre').length, 4, 'aeromóvel');
  assert.deepEqual(json(consultas('Curitiba')), ['shopping center'], 'sem BRT nem estação tubo');
  assert.equal(consultas('Rio de Janeiro').length, 4);
  assert.equal(consultas('Duque de Caxias').length, 4, 'fora da tabela: todas');
  assert.equal(consultas('').length, 4);
});

test('dispensada sai zero, não branco; estação-tubo vai para outro', () => {
  const local = { chave: 'c', place_id: 'c', nome: 'C', cidade: 'Curitiba', lat: -25.43, lng: -49.27, buscas: 1, falhas: [], censura: [], cobertura_insuf: [], subdivididas: [], coletado_em: 'h',
    consultas: ['shopping center'], consultas_dispensadas: ['estação de metrô', 'estação de trem', 'estação VLT'] };
  const r = (nome, categoria_maps, distancia_m) => ({ origem: 'c', nome, categoria_maps, distancia_m, lat: -25.43 + distancia_m / 111320, lng: -49.27, n_avaliacoes: '1', place_id: nome });
  const { resumo, resultados } = t.montarSaida({ locais: [local], resultados: [r('Estação Tubo Central', 'Estação BRT', 640), r('Estação Tubo Praça', 'Ponto de ônibus', 900)] }, {}, OP);
  const l = resumo[0];
  assert.equal(l.qt_estacoes_metro_1000m, 0);
  assert.equal(l.qt_estacoes_trem_1000m, 0);
  assert.equal(l.qt_estacoes_vlt_1000m, 0);
  assert.equal(l.qt_estacoes_trilhos_1000m, 0, 'dispensadas: trilhos zero, não branco');
  assert.equal(l.qt_outros_1000m, 2, 'estação-tubo é outro');
  assert.ok(resultados.every((x) => !t.suspeito(x)), 'BRT não vai para a revisão');
  assert.equal(l.dist_trilhos_mais_proxima_m, '');
  assert.equal(l.dist_estacao_mais_proxima_m, '');
  assert.equal(l.situacao, 'ok');
  assert.equal(l.consultas_dispensadas, 'estação de metrô | estação de trem | estação VLT');
  // Coleta antiga com as buscas de BRT e estação tubo: nada pendente.
  const antiga = { ...local, consultas: ['estação BRT', 'estação tubo', 'shopping center'] };
  assert.equal(t.montarSaida({ locais: [antiga], resultados: [] }, {}, OP).resumo[0].situacao, 'ok');
});

test('dados guardados: buscas de BRT e estação tubo saem', () => {
  const d = t.semRetiradas({
    locais: [{ chave: 'c', consultas: ['estação de metrô', 'estação BRT', 'estação tubo', 'shopping center'], falhas: ['estação BRT'], subdivididas: ['estação tubo'], censura: ['estação BRT NO'], cobertura_insuf: [], consultas_dispensadas: ['estação tubo'] }],
    resultados: [
      { nome: 'Estação Tubo Central', consultas: 'estação tubo' },
      { nome: 'Estação BRT X', consultas: 'estação BRT | estação tubo' },
      { nome: 'Estação Lapa', consultas: 'estação de metrô | estação BRT' },
      { nome: 'Shopping', consultas: 'shopping center' },
    ],
  });
  assert.deepEqual(json(d.resultados.map((r) => r.nome)), ['Estação Lapa', 'Shopping']);
  assert.equal(d.resultados[0].consultas, 'estação de metrô');
  const l = d.locais[0];
  assert.deepEqual(json(l.consultas), ['estação de metrô', 'shopping center']);
  assert.deepEqual(json([...l.falhas, ...l.subdivididas, ...l.censura, ...l.consultas_dispensadas]), []);
});

test('coleta de 15/10: estação-tubo, operador, futura estação e sede de companhia', () => {
  assert.equal(t.classificar('Estação Tubo Mariano Torres', ''), 'outro');
  assert.equal(t.classificar('Estação Tubo Praça Osório', 'Estação de ônibus'), 'outro');
  assert.equal(t.classificar('Trensurb Estação Rodoviária', 'Estação de metrô'), 'trem');
  assert.equal(t.classificar('Futura estação Rua do Grito (BRT ABC)', 'Empresa de ônibus'), 'outro');
  assert.equal(t.classificar('Companhia do Metropolitano do Distrito Federal', 'Companhia ferroviária'), 'outro');
});

test('categoria do cartão ignora a nota e o preço antes do "·"', () => {
  assert.equal(t.lerCartao('Estação 102', 'Estação 102\n4,0(1.731) · $$\nRestaurante · Av. X, 10', '').categoria_maps, 'Restaurante');
  assert.equal(t.lerCartao('Shopping Hauer', 'Shopping Hauer\n4,4(6.234) · \nShopping center ·  · R. Y', '').categoria_maps, 'Shopping center');
});

test('avaliações: milhar com ponto, "mil", "Nenhuma avaliação" e não lidas', () => {
  assert.equal(t.lerNumeroAvaliacoes('4,5(1.077)'), '1077');
  assert.equal(t.lerNumeroAvaliacoes('4,5 (77)'), '77');
  assert.equal(t.lerNumeroAvaliacoes('4,6(12 mil)'), '12000');
  assert.equal(t.lerNumeroAvaliacoes('4,6(1,2 mil)'), '1200');
  assert.equal(t.lerNumeroAvaliacoes('4,6(46.168)'), '46168');
  assert.equal(t.lerNumeroAvaliacoes('(4,5)'), '', 'a nota não é número de avaliações');
  assert.equal(t.lerNumeroAvaliacoes(''), '');
  assert.equal(t.lerCartao('Galeria Z', 'Galeria Z\nNenhuma avaliação\nShopping center · R. Z', '').n_avaliacoes, '0');
  assert.equal(t.lerCartao('Galeria Z', 'Galeria Z\nShopping center · R. Z', '').n_avaliacoes, '', 'sem número: não lida');
});

test('distância só até 1000 m; acima, em branco com contagem zero', () => {
  const local = { chave: 'c', place_id: 'c', nome: 'C', cidade: 'Curitiba', lat: -25.43, lng: -49.27, buscas: 3, falhas: [], censura: [], cobertura_insuf: [], subdivididas: [], coletado_em: 'h',
    consultas: ['shopping center'], consultas_dispensadas: ['estação de metrô', 'estação de trem', 'estação VLT'] };
  const r = (nome, categoria_maps, distancia_m, n = '2000') => ({ origem: 'c', nome, categoria_maps, distancia_m, lat: -25.43 + distancia_m / 111320, lng: -49.27, n_avaliacoes: n, place_id: nome });
  const { resumo, resultados } = t.montarSaida({ locais: [local], resultados: [
    r('Estação BRT Cidadela', 'Serviço de transporte', 1786000), r('Lapa', 'Estação de metrô', 1786280),
    r('Estação Tubo Bigorrilho', '', 3775), r('Shopping Curitiba', 'Shopping center', 800),
  ] }, {}, OP);
  const l = resumo[0];
  assert.equal(l.qt_estacoes_vlt_1000m, 0);
  assert.equal(l.dist_estacoes_vlt_mais_proxima_m, '');
  assert.equal(l.dist_estacao_mais_proxima_m, '');
  assert.equal(l.estacao_mais_proxima, '');
  assert.equal(l.dist_shoppings_mais_proxima_m, 800);
  assert.equal(resultados.find((x) => x.nome === 'Lapa').fora_da_regiao, 'sim');
  assert.equal(l.qt_shoppings_porte_1000m, 1);
  assert.equal(l.situacao, 'ok');
});


test('porte pelas avaliações: limiar, sensibilidade e não lidas em branco', () => {
  const local = { chave: 'x', place_id: 'x', nome: 'X', cidade: 'Salvador', lat: -12.99, lng: -38.47, buscas: 5, falhas: [], censura: [], cobertura_insuf: [], subdivididas: [], coletado_em: 'h',
    consultas: ['estação de metrô', 'estação VLT', 'shopping center'], consultas_dispensadas: ['estação de trem'] };
  const s = (nome, distancia_m, n, lng = -38.47) => ({ origem: 'x', nome, categoria_maps: 'Shopping center', distancia_m, lat: -12.99 + distancia_m / 111320, lng, n_avaliacoes: n, place_id: nome });
  const dados = { locais: [local], resultados: [
    s('Shopping da Bahia', 300, '90000'), s('Galeria Norte', 450, '700', -38.475), s('Empresarial 104', 800, '20', -38.465),
  ] };
  const { resumo, shoppings, resultados } = t.montarSaida(dados, {}, OP);
  const l = resumo[0];
  assert.equal(l.qt_shoppings_1000m, 3);
  assert.equal(l.qt_shoppings_porte_500m, 1);
  assert.equal(l.qt_shoppings_porte_1000m, 1);
  assert.equal(l.qt_shoppings_aval_min_500_1000m, 2);
  assert.equal(l.qt_shoppings_aval_min_1000_1000m, 1);
  assert.equal(l.qt_shoppings_aval_min_5000_1000m, 1);
  assert.equal(l.criterio_porte_shopping, '1000 avaliações ou mais no Maps');
  assert.equal(l.shoppings_sem_avaliacao_lida, 0);
  assert.equal(shoppings.length, 3);
  assert.equal(resultados.find((x) => x.nome === 'Galeria Norte').porte_shopping, 'não');
  assert.equal(t.montarSaida(dados, {}, { limiar_aval: 500 }).resumo[0].qt_shoppings_porte_1000m, 2);

  // Avaliações não lidas: porte em branco (nunca "não"), total do raio em branco, aviso na situação.
  const semLeitura = { ...dados, resultados: [...dados.resultados, s('Shopping Sem Número', 900, '', -38.46)] };
  const ls = t.montarSaida(semLeitura, {}, OP);
  assert.equal(ls.shoppings.find((x) => x.nome === 'Shopping Sem Número').porte, '');
  assert.equal(ls.shoppings.find((x) => x.nome === 'Shopping Sem Número').porte_base, 'avaliações não lidas');
  assert.equal(ls.resumo[0].qt_shoppings_porte_500m, 1, 'o não lido está a 900 m');
  assert.equal(ls.resumo[0].qt_shoppings_porte_1000m, '');
  assert.equal(ls.resumo[0].shoppings_sem_avaliacao_lida, 1);
  assert.equal(ls.resumo[0].situacao, 'avaliações não lidas');
});

test('shoppings: nome sem espaços e partes do shopping até 400 m são o mesmo shopping', () => {
  assert.equal(t.mesmoShopping('DiamondMall', 'Diamond Mall'), true);
  assert.equal(t.mesmoShopping('Salvador Shopping', 'Shopping Salvador'), true);
  assert.equal(t.mesmoShopping('Shopping Barra', 'Shopping da Bahia'), false);
  const s = (nome, metros, n) => ({ nome, grupo: 'shopping', lat: -19.93 + metros / 111320, lng: -43.94, n_avaliacoes: n });
  const rs = t.marcarDuplicatas([
    s('DiamondMall', 0, '60000'),
    s('Entrada C - Diamond Mall', 250, '30'),
    s('Sala VIP Cinemark - Diamond Mall', 120, '400'),
    s('Garagem boulevard', 300, '15'),
    s('Galeria Ouvidor', 350, '900'),
    s('Diamond Mall Anexo', 700, '50'),
  ]);
  const dup = (n) => rs.find((r) => r.nome === n).duplicata_de;
  assert.equal(dup('DiamondMall'), '');
  assert.equal(dup('Entrada C - Diamond Mall'), 'DiamondMall');
  assert.equal(dup('Sala VIP Cinemark - Diamond Mall'), 'DiamondMall');
  assert.equal(dup('Garagem boulevard'), 'DiamondMall', 'parte de shopping perto de outro shopping');
  assert.equal(dup('Galeria Ouvidor'), '', 'outro nome, sem palavra de parte');
  assert.equal(dup('Diamond Mall Anexo'), '', 'a 700 m não é duplicata');
  // Estações seguem com 150 m.
  const e = (nome, metros) => ({ nome, grupo: 'metro', lat: -19.93 + metros / 111320, lng: -43.94, n_avaliacoes: '1' });
  assert.equal(t.marcarDuplicatas([e('Estação Central', 0), e('Estação Central', 300)])[1].duplicata_de, '');
});

test('exportação pela lista: linha para quem falta; três CSVs', () => {
  const local = { consultas: ['estação de metrô', 'estação VLT', 'shopping center'], consultas_dispensadas: ['estação de trem'], chave: 'a', place_id: 'a', nome: 'A', cidade: 'Salvador', lat: -12.99, lng: -38.47, buscas: 4, falhas: [], censura: [], cobertura_insuf: [], subdivididas: [], coletado_em: 'h' };
  const dados = { locais: [local], resultados: [{ origem: 'a', nome: 'Shopping X', categoria_maps: 'Shopping center', distancia_m: 300, lat: -12.99 + 300 / 111320, lng: -38.47, n_avaliacoes: '5000', place_id: 'sx' }] };
  const lista = [{ place_id: 'a', nome: 'A', cidade: 'Salvador', lat: -12.99, lng: -38.47 }, { place_id: 'b', nome: 'B', cidade: 'Recife', lat: -8.05, lng: -34.9 }];
  const s = t.montarSaida(dados, {}, OP, lista);
  assert.equal(s.resumo.length, 2);
  assert.equal(s.resumo[0].qt_shoppings_porte_1000m, 1);
  assert.equal(s.resumo[0].situacao, 'ok');
  assert.equal(s.resumo[1].situacao, 'não coletado no Maps');
  for (const c of t.colsResumo()) assert.ok(c in s.resumo[1], c);
  assert.equal(s.shoppings.length, 1);
  assert.equal(s.resultados[0].porte_shopping, 'sim');
  assert.deepEqual(Object.keys(s).sort(), ['resultados', 'resumo', 'shoppings', 'universo']);
  // Sem lista: tudo o que está guardado, cada um uma vez.
  assert.equal(t.montarSaida(dados, {}, OP).universo.length, 1);
});

test('menu: estado do estabelecimento e próximo que falta na mesma cidade', () => {
  const t = carregar();
  const base = [
    { place_id: 'a', nome: 'A', cidade: 'Salvador', lat: -13, lng: -38 },
    { place_id: 'b', nome: 'B', cidade: 'Salvador', lat: -13, lng: -38 },
    { place_id: 'c', nome: 'C', cidade: 'Recife', lat: -8, lng: -35 },
    { place_id: 'd', nome: 'D', cidade: 'Salvador', lat: -13, lng: -38 },
  ];
  const ok = (chave) => ({ chave, consultas: [], falhas: [], cobertura_insuf: [], censura: [] });
  const dados = { locais: [ok('a'), { ...ok('b'), falhas: ['estação de metrô'] }], resultados: [] };
  assert.equal(t.estadoLocal(base[0], dados) === 'ok' || t.estadoLocal(base[0], dados) === 'pend', true);
  assert.equal(t.estadoLocal(base[1], dados), 'pend');
  assert.equal(t.estadoLocal(base[2], dados), 'falta');
  // de c (Recife): a seguinte é d (falta), depois b (pendente) — sem outra de Recife
  assert.equal(t.proximoLocal(base, 'c', dados).place_id, 'd');
  // de a (Salvador): b (pendente, mesma cidade) antes de c
  assert.equal(t.proximoLocal(base, 'a', dados).place_id, 'b');
});

test('sistemas sobre trilhos de cada metrópole; BRT fora', () => {
  const c = t.classificar;
  // Trem metropolitano, pelo operador.
  assert.equal(c('Estação Brás - CPTM', 'Estação de transporte público'), 'trem');
  assert.equal(c('Estação Deodoro (SuperVia)', 'Estação de trem'), 'trem');
  assert.equal(c('Estação Mercado - Trensurb', 'Estação de metrô'), 'trem');
  // VLT, bonde urbano e aeromóvel.
  assert.equal(c('Parada Cinelândia - VLT Carioca', 'Estação de metrô'), 'vlt', 'VLT no nome vale mais que a categoria');
  assert.equal(c('Estação Pinheiro Machado (VLT da Baixada Santista)', 'Estação de transporte público'), 'vlt');
  assert.equal(c('Estação Papicu - VLT Parangaba-Mucuripe', 'Estação de trem'), 'vlt');
  assert.equal(c('Estação VLT Calçada (em obras)', 'Estação de transporte público'), 'outro', 'VLT de Salvador em obras');
  assert.equal(c('Estação Porto (VLT Cuiabá) - desativada', 'Estação de transporte público'), 'outro');
  assert.equal(c('Estação Carioca do Bonde de Santa Teresa', 'Estação de bonde'), 'vlt');
  assert.equal(c('Estação Aeromóvel Aeroporto', 'Estação de transporte público'), 'vlt');
  assert.equal(c('Bondinho Pão de Açúcar', 'Teleférico'), 'outro', 'bondinho é teleférico');
  // Monotrilho: metrô quando o Maps o põe na categoria de metrô; senão, vlt.
  assert.equal(c('Estação Oratório - Linha 15-Prata', 'Estação de metrô'), 'metro');
  assert.equal(c('Estação Morumbi - Monotrilho Linha 17-Ouro', 'Estação de transporte público'), 'vlt');
  // BRT é ônibus, fora do plano: outro.
  assert.equal(c('Estação BRT Lapa', 'Estação de ônibus'), 'outro');
  assert.equal(c('Estação Tubo Eufrásio Correia', 'Ponto de ônibus'), 'outro');
  assert.equal(c('Estação Recreio Shopping (BRT Transoeste)', 'Estação de transporte público'), 'outro');
  assert.equal(c('BRT MOVE Estação São Judas Tadeu', 'Ponto de ônibus'), 'outro');
});

test('sistema ausente na cidade vira outro e vai para a revisão', () => {
  assert.deepEqual(json(t.gruposAusentes('Salvador')), ['trem']);
  assert.deepEqual(json(t.gruposAusentes('Curitiba')), ['metro', 'trem', 'vlt']);
  assert.deepEqual(json(t.gruposAusentes('Florianópolis')), ['metro', 'trem', 'vlt']);
  assert.deepEqual(json(t.gruposAusentes('Campinas')), ['metro', 'trem', 'vlt']);
  assert.deepEqual(json(t.gruposAusentes('Rio de Janeiro')), []);
  assert.deepEqual(json(t.gruposAusentes('Niterói')), [], 'fora da tabela');
  // Trem do subúrbio de Salvador, desativado em 2021.
  assert.equal(t.classificarNaCidade('Estação Calçada', 'Estação de trem', 'Salvador'), 'outro');
  assert.equal(t.suspeito({ grupo_auto: 'outro', distancia_m: 300, nome: 'Estação Calçada', categoria_maps: 'Estação de trem' }), true);
  assert.equal(t.classificarNaCidade('Estação Lapa', 'Estação de metrô', 'Salvador'), 'metro');
  assert.equal(t.classificarNaCidade('Estação Aeromóvel Aeroporto', 'Estação de transporte público', 'Porto Alegre'), 'vlt');
});

test('revisão manual antiga "vlt_brt" ou "brt": vlt ou outro', () => {
  assert.equal(t.grupoRevisto('vlt_brt', 'Estação Tubo Central', ''), 'outro');
  assert.equal(t.grupoRevisto('vlt_brt', 'Parada Praça XV', 'Estação de VLT'), 'vlt');
  assert.equal(t.grupoRevisto('vlt_brt', 'Estação Cidadela', 'Estação BRT'), 'outro');
  assert.equal(t.grupoRevisto('brt', 'Estação BRT Lapa', ''), 'outro');
  assert.equal(t.grupoRevisto('metro', 'X', ''), 'metro');
  assert.equal(t.grupoRevisto(undefined, 'X', ''), undefined);
});

test('trilhos = metrô + trem + VLT; BRT fora; distância da mais próxima até 1000 m', () => {
  const local = { chave: 'r', place_id: 'r', nome: 'R', cidade: 'Rio de Janeiro', lat: -22.9, lng: -43.18, buscas: 4, falhas: [], censura: [], cobertura_insuf: [], subdivididas: [], coletado_em: 'h',
    consultas: ['estação de metrô', 'estação de trem', 'estação VLT', 'shopping center'] };
  const r = (nome, categoria_maps, distancia_m) => ({ origem: 'r', nome, categoria_maps, distancia_m, lat: -22.9 + distancia_m / 111320, lng: -43.18, n_avaliacoes: '1', place_id: nome });
  const { resumo } = t.montarSaida({ locais: [local], resultados: [
    r('Estação Carioca', 'Estação de metrô', 700),
    r('Estação Central do Brasil (SuperVia)', 'Estação de trem', 950),
    r('Parada Sete de Setembro - VLT Carioca', 'Estação de VLT', 420),
    r('Estação BRT Gentileza', 'Estação de ônibus', 150),
    r('Estação Cardeal Arcoverde', 'Estação de metrô', 1600),
  ] }, {}, OP);
  const l = resumo[0];
  assert.equal(l.qt_estacoes_metro_1000m, 1);
  assert.equal(l.qt_estacoes_trem_1000m, 1);
  assert.equal(l.qt_estacoes_vlt_1000m, 1);
  assert.equal(l.qt_outros_1000m, 1, 'BRT é outro');
  assert.equal(l.qt_estacoes_trilhos_500m, 1);
  assert.equal(l.qt_estacoes_trilhos_1000m, 3);
  assert.equal(l.dist_trilhos_mais_proxima_m, 420);
  assert.equal(l.dist_estacao_mais_proxima_m, 420, 'BRT não conta como estação');
  assert.equal(l.tipo_estacao_mais_proxima, 'vlt');
  assert.equal(l.qt_estacoes_metro_1000m + l.qt_estacoes_trem_1000m + l.qt_estacoes_vlt_1000m + l.qt_shoppings_1000m + l.qt_outros_1000m, l.resultados_ate_1000m);
  for (const c of ['qt_estacoes_vlt_500m', 'dist_estacoes_vlt_mais_proxima_m', 'qt_estacoes_trilhos_500m', 'qt_estacoes_trilhos_1000m', 'dist_trilhos_mais_proxima_m']) assert.ok(t.colsResumo().includes(c), c);
  assert.ok(!t.colsResumo().some((c) => c.includes('brt')));
});

test('estações: lista cheia divide sempre; demais, só lotada sem fim e sem item fora do mapa', () => {
  // Coleta de 12/11: metrô com 10 itens, marca de fim e itens fora do mapa (ranking da cidade).
  assert.equal(t.decidirLista({ n: 10, fim: true, quadrante: '', grupo: 'metro', algumForaDoMapa: true }), 'subdividir');
  assert.equal(t.decidirLista({ n: 9, fim: true, quadrante: '', grupo: 'metro', algumForaDoMapa: false }), '');
  assert.equal(t.decidirLista({ n: 10, fim: true, quadrante: 'NO', grupo: 'metro', algumForaDoMapa: true }), '', 'quadrante com item fora do mapa: área esgotada');
  assert.equal(t.decidirLista({ n: 12, fim: false, quadrante: 'NO', grupo: 'vlt', algumForaDoMapa: false }), 'censura');
  assert.equal(t.decidirLista({ n: 70, fim: true, quadrante: '', grupo: 'shopping', algumForaDoMapa: true }), '');
  assert.equal(t.decidirLista({ n: 70, fim: false, quadrante: '', grupo: 'shopping', algumForaDoMapa: false }), 'subdividir');
});

test('cruzamento: estação no raio trazida só por outra busca, com a lista do grupo cheia', () => {
  const lidos = [...Array(10)].map((_, i) => ({ consulta: 'estação de metrô', nome: `M${i}` })).concat([{ consulta: 'estação VLT' }]);
  const base = { lat: -22.9259, lng: -43.1765 };
  const unidos = [
    { nome: 'Catete', grupo_auto: 'metro', distancia_m: 302, consultas: 'estação VLT', ...base },
    { nome: 'Carioca', grupo_auto: 'metro', distancia_m: 1676, consultas: 'estação VLT', lat: -22.90, lng: -43.17 },
    { nome: 'Praça Onze', grupo_auto: 'metro', distancia_m: 900, consultas: 'estação de metrô', lat: -22.91, lng: -43.19 },
  ];
  assert.deepEqual(json(t.cruzamento(unidos, lidos)), ['estação de metrô (cruzamento: Catete)']);
  // Lista do metrô com menos de 10: não acusa.
  assert.deepEqual(json(t.cruzamento(unidos, lidos.slice(5))), []);
  // Outro cadastro da mesma estação veio pela busca de metrô: não acusa.
  const comPar = unidos.concat([{ nome: 'Estação Catete', grupo_auto: 'metro', distancia_m: 310, consultas: 'estação de metrô NO', lat: -22.9260, lng: -43.1766 }]);
  assert.deepEqual(json(t.cruzamento(comPar, lidos)), []);
});

test('parada ou saída da mesma estação com outro nome funde; estações vizinhas não', () => {
  const rs = t.marcarDuplicatas([
    { nome: 'Sete de Setembro', grupo: 'vlt', lat: -22.9052875, lng: -43.1775573, n_avaliacoes: '' },
    { nome: 'Parada VLT - Colombo', grupo: 'vlt', lat: -22.9053281, lng: -43.1782631, n_avaliacoes: '' },
    { nome: 'Carioca', grupo: 'vlt', lat: -22.90799, lng: -43.17655, n_avaliacoes: '' },
  ]);
  assert.equal(rs[1].duplicata_de, 'Sete de Setembro');
  assert.equal(rs[2].duplicata_de, '');
});

test('ruído: traçado da linha, loja com categoria de shopping e centro comercial com shopping no nome', () => {
  assert.equal(t.classificar('Traçado do mapa do vlt rio de janeiro', 'Serviço de transporte'), 'outro');
  assert.equal(t.classificar('Loja T-Rex Brasil', 'Shopping center'), 'outro');
  assert.equal(t.classificar('Minds Idiomas - Águas Claras', 'Shopping center'), 'outro');
  assert.equal(t.classificar('Shopping Buritis', 'Centro comercial'), 'shopping');
  assert.equal(t.classificar('Centro Comercial Riviera Buritis', 'Shopping center'), 'shopping');
  assert.equal(t.classificar('Galeria do Centro', 'Centro comercial'), 'outro');
});
