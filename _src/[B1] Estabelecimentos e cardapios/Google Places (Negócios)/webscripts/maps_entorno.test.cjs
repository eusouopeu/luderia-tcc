const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const source = fs.readFileSync(__dirname + '/maps_entorno.user.js', 'utf8');

function carregar() {
  const ambiente = { __test: {}, localStorage: { getItem: () => null, setItem() {}, removeItem() {} }, location: { href: '', pathname: '/maps/' }, document: { querySelector: () => null, querySelectorAll: () => [] } };
  const instrumentado = source.slice(0, source.indexOf("  console.info('[Entorno do Maps] carregado');"))
    + 'Object.assign(globalThis.__test, { classificar, suspeito, distancia, deslocar, mPorPx, planejarBusca, coberturaReal, lerCartao, lerNumeroAvaliacoes, lerFila, cidadeDoEndereco, unir, nomesParecidos, marcarDuplicatas, mesmoShopping, montarSaida, montarShoppings, precisaSubdividir, quadrantes, colsResumo, nomesArquivos, dataLocal, foraDoMapa, tarefasIniciais, consultasDispensadas, uniaoLocais });})();';
  vm.runInNewContext(instrumentado, ambiente, { filename: 'maps_entorno.user.js' });
  return ambiente.__test;
}

const t = carregar();
const json = (x) => JSON.parse(JSON.stringify(x));
const OP = { limiar_aval: 1000 };

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

test('resumo: revisão, duplicata, falha em branco e soma que fecha', () => {
  const local = { consultas: ['estação de metrô', 'estação de trem', 'estação BRT', 'estação VLT', 'shopping center'], chave: 'x', place_id: 'x', nome: 'X', cidade: 'Salvador', lat: -12.99, lng: -38.47, buscas: 5, falhas: ['estação VLT'], censura: [], cobertura_insuf: [], subdivididas: [], cobertura_min_m: 1200, coletado_em: 'h' };
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
  assert.equal(l.qt_estacoes_vlt_brt_1000m, '', 'consulta de VLT falhou: em branco, não zero');
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
  assert.deepEqual(json(consultas('Salvador')), ['estação de metrô', 'estação BRT', 'estação VLT', 'shopping center']);
  assert.deepEqual(json(consultas('São Paulo')), ['estação de metrô', 'estação de trem', 'estação BRT', 'shopping center']);
  assert.deepEqual(json(consultas('Curitiba')), ['estação BRT', 'estação tubo', 'shopping center'], 'estação tubo só em Curitiba');
  assert.equal(consultas('Rio de Janeiro').length, 5);
  assert.equal(consultas('Duque de Caxias').length, 5, 'fora da tabela: todas menos a estação tubo');
  assert.equal(consultas('').length, 5);
});

test('dispensada sai zero, não branco; estação mais próxima entre metrô, trem e VLT/BRT', () => {
  const local = { chave: 'c', place_id: 'c', nome: 'C', cidade: 'Curitiba', lat: -25.43, lng: -49.27, buscas: 3, falhas: [], censura: [], cobertura_insuf: [], subdivididas: [], coletado_em: 'h',
    consultas: ['estação BRT', 'estação tubo', 'shopping center'], consultas_dispensadas: ['estação de metrô', 'estação de trem', 'estação VLT'] };
  const r = (nome, categoria_maps, distancia_m) => ({ origem: 'c', nome, categoria_maps, distancia_m, lat: -25.43 + distancia_m / 111320, lng: -49.27, n_avaliacoes: '1', place_id: nome });
  const { resumo } = t.montarSaida({ locais: [local], resultados: [r('Estação Tubo Central', 'Estação BRT', 640), r('Estação Tubo Praça', 'Estação BRT', 900)] }, {}, OP);
  const l = resumo[0];
  assert.equal(l.qt_estacoes_metro_1000m, 0);
  assert.equal(l.qt_estacoes_trem_1000m, 0);
  assert.equal(l.qt_estacoes_vlt_brt_1000m, 2);
  assert.equal(l.situacao, 'ok');
  assert.equal(l.consultas_dispensadas, 'estação de metrô | estação de trem | estação VLT');
  assert.equal(l.dist_estacao_mais_proxima_m, 640);
  assert.equal(l.estacao_mais_proxima, 'Estação Tubo Central');
  assert.equal(l.tipo_estacao_mais_proxima, 'vlt_brt');

  // Busca de transporte que falhou deixa a estação mais próxima em branco.
  const falhou = { ...local, falhas: ['estação BRT'] };
  assert.equal(t.montarSaida({ locais: [falhou], resultados: [] }, {}, OP).resumo[0].dist_estacao_mais_proxima_m, '');
  // Coleta de Curitiba anterior à busca "estação tubo": VLT/BRT em branco e pendente.
  const antiga = { ...local, consultas: ['estação BRT', 'shopping center'] };
  const la = t.montarSaida({ locais: [antiga], resultados: [] }, {}, OP).resumo[0];
  assert.equal(la.qt_estacoes_vlt_brt_1000m, '');
  assert.equal(la.situacao, 'busca nova não feita');
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
    consultas: ['estação BRT', 'estação tubo', 'shopping center'], consultas_dispensadas: ['estação de metrô', 'estação de trem', 'estação VLT'] };
  const r = (nome, categoria_maps, distancia_m, n = '2000') => ({ origem: 'c', nome, categoria_maps, distancia_m, lat: -25.43 + distancia_m / 111320, lng: -49.27, n_avaliacoes: n, place_id: nome });
  const { resumo, resultados } = t.montarSaida({ locais: [local], resultados: [
    r('Estação BRT Cidadela', 'Serviço de transporte', 1786000), r('Lapa', 'Estação de metrô', 1786280),
    r('Estação Tubo Bigorrilho', '', 3775), r('Shopping Curitiba', 'Shopping center', 800),
  ] }, {}, OP);
  const l = resumo[0];
  assert.equal(l.qt_estacoes_vlt_brt_1000m, 0);
  assert.equal(l.dist_estacoes_vlt_brt_mais_proxima_m, '', 'a 3.775 m a lista não garante a mais próxima');
  assert.equal(l.dist_estacao_mais_proxima_m, '');
  assert.equal(l.estacao_mais_proxima, '');
  assert.equal(l.dist_shoppings_mais_proxima_m, 800);
  assert.equal(resultados.find((x) => x.nome === 'Lapa').fora_da_regiao, 'sim');
  assert.equal(l.qt_shoppings_porte_1000m, 1);
  assert.equal(l.situacao, 'ok');
});


test('porte pelas avaliações: limiar, sensibilidade e não lidas em branco', () => {
  const local = { chave: 'x', place_id: 'x', nome: 'X', cidade: 'Salvador', lat: -12.99, lng: -38.47, buscas: 5, falhas: [], censura: [], cobertura_insuf: [], subdivididas: [], coletado_em: 'h',
    consultas: ['estação de metrô', 'estação BRT', 'estação VLT', 'shopping center'], consultas_dispensadas: ['estação de trem', 'estação tubo'] };
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
  const local = { consultas: ['estação de metrô', 'estação BRT', 'estação VLT', 'shopping center'], consultas_dispensadas: ['estação de trem', 'estação tubo'], chave: 'a', place_id: 'a', nome: 'A', cidade: 'Salvador', lat: -12.99, lng: -38.47, buscas: 4, falhas: [], censura: [], cobertura_insuf: [], subdivididas: [], coletado_em: 'h' };
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
