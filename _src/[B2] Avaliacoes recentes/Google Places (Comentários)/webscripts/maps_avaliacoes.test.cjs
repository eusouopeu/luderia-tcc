const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const source = fs.readFileSync(__dirname + '/maps_avaliacoes.user.js', 'utf8');

function carregar(contexto = {}) {
  const valores = new Map();
  const ambiente = {
    __test: {},
    GM_getValue: (k, padrao) => valores.has(k) ? valores.get(k) : padrao,
    GM_setValue: (k, v) => valores.set(k, v),
    GM_deleteValue: (k) => valores.delete(k),
    GM_listValues: () => [...valores.keys()],
    crypto: require('node:crypto').webcrypto,
    TextEncoder,
    URL,
    Blob,
    setTimeout: (fn) => { fn(); return 0; },
    clearTimeout,
    location: { href: 'https://www.google.com/maps/place/Teste' },
    document: { querySelector: () => null, querySelectorAll: () => [] },
    getComputedStyle: (e) => ({ overflowY: e.overflowY }),
    ...contexto,
  };
  const instrumentado = source.slice(0, source.indexOf("  console.info('[Avaliações do Maps] carregado');"))
    + 'Object.assign(globalThis.__test, { infoLugar, fimPeloVolume, rolavel, cartoes, abrirAbaAvaliacoes, ordenarRecentes, expandirTextos, leituraMelhor, checarSeletores, montarLinhas, csv, COLS, salvarArquivo, proximoIndice, wilson, placarConferencia, carregarFiltros, filtrosParaSalvar, passaFiltros, reciboExportacao, aplicarForaDoFiltro, filtros });})();';
  vm.runInNewContext(instrumentado, ambiente, { filename: 'maps_avaliacoes.user.js' });
  return ambiente.__test;
}

test('encontra lista rolável antes de ela ter conteúdo suficiente para transbordar', () => {
  const lista = { overflowY: 'auto', scrollHeight: 400, clientHeight: 600, parentElement: null };
  const cartao = { overflowY: 'visible', scrollHeight: 100, clientHeight: 100, parentElement: lista };
  assert.equal(carregar().rolavel(cartao), lista);
});

test('lê nome e volume na aba de avaliações sem cabeçalho h1', () => {
  const principal = { innerText: 'Avaliações\n4,6\n3.615 avaliações\n', getAttribute: () => 'Bodogami Restaurante e Cafeteria' };
  const document = { querySelector: (s) => s === '[role="main"]' ? principal : null };
  const lugar = carregar({ document }).infoLugar();
  assert.equal(lugar.nome_estabelecimento, 'Bodogami Restaurante e Cafeteria');
  assert.equal(lugar.volume_avaliacoes_estabelecimento, '3615');
  assert.equal(lugar.avaliacao_media_estabelecimento, '4.6');
});

test('volume na aba de avaliações ignora número entre parênteses nos cartões (DDD numa resposta)', () => {
  const principal = { innerText: 'Avaliações\n4,6\n1.742 avaliações\nOrdenar\nResposta do proprietário\nLigue (31) 99999-0000\n',
    getAttribute: () => 'Shelf Bar e Jogos' };
  const document = { querySelector: (s) => s === '[role="main"]' ? principal : null };
  assert.equal(carregar({ document }).infoLugar().volume_avaliacoes_estabelecimento, '1742');
});

test('volume na visão geral vem do cabeçalho com parênteses', () => {
  const principal = { innerText: 'Shelf\n(31) 3333-0000\n', getAttribute: () => 'Shelf Bar e Jogos' };
  const cabecalho = { innerText: '4,6\n(1.742)' };
  const document = { querySelector: (s) => (s === '[role="main"]' ? principal : s === 'div.F7nice' ? cabecalho : null) };
  assert.equal(carregar({ document }).infoLugar().volume_avaliacoes_estabelecimento, '1742');
});

test('volume só encerra a coleta quando a lista também parou de crescer', () => {
  const { fimPeloVolume } = carregar();
  assert.equal(fimPeloVolume(40, 31, 0), false);
  assert.equal(fimPeloVolume(40, 31, 1), false);
  assert.equal(fimPeloVolume(40, 31, 2), true);
  assert.equal(fimPeloVolume(20, 31, 5), false);
  assert.equal(fimPeloVolume(40, 0, 5), false);
});

test('abre avaliações por botão comum e espera os cartões surgirem', async () => {
  let cartoes = [];
  const botao = {
    innerText: 'Avaliações',
    getAttribute: () => 'false',
    closest: () => null,
    click: () => { cartoes = [{ parentElement: { closest: () => null }, dataset: { reviewId: 'r1' } }]; },
  };
  const document = { querySelectorAll: (s) => s === 'div[data-review-id]' ? cartoes : [botao] };
  assert.equal(await carregar({ document }).abrirAbaAvaliacoes(), true);
  assert.equal(cartoes.length, 1);
});

test('ordena por recentes e produz CSV com identificador e texto escapado', async () => {
  let menu = [];
  const botao = { innerText: 'Classificar avaliações', dataset: {}, closest: () => null,
    click: () => { menu = [{ innerText: 'Mais recentes', click: () => { menu = []; } }]; } };
  const document = { querySelectorAll: (s) => s.startsWith('button') ? [botao] : menu };
  const api = carregar({ document });
  assert.equal(await api.ordenarRecentes(), true);
  const conteudo = api.csv([{ review_id: 'r1', texto_avaliacao: 'bom; "jogo"' }], ['review_id', 'texto_avaliacao']);
  assert.match(conteudo, /r1;"bom; ""jogo"""/);
});

// Botão "Mais" que some ao expandir, como no Maps; `ignorar` cliques não pegam.
function botaoMais(botoes, ignorar = 0) {
  const b = { innerText: 'Mais', dataset: {}, classList: { contains: (c) => c === 'w8nwRe' }, cliques: 0,
    click: () => { b.cliques++; if (b.cliques > ignorar) botoes.splice(botoes.indexOf(b), 1); } };
  return b;
}

const cartaoCom = (botoes) => ({ parentElement: { closest: () => null }, querySelectorAll: () => [...botoes] });

test('expande texto e restaura idioma original no cartão', async () => {
  const botoes = [];
  const mais = botaoMais(botoes);
  const original = { innerText: 'Ver original', dataset: {}, classList: { contains: () => false }, click: () => {} };
  botoes.push(mais, original);
  const document = { querySelectorAll: () => [cartaoCom(botoes)] };
  assert.equal(await carregar({ document }).expandirTextos(), 2);
  assert.equal(mais.cliques, 1);
});

test('clica de novo no "Mais" quando o primeiro clique não expande', async () => {
  const botoes = [];
  const mais = botaoMais(botoes, 1);
  botoes.push(mais);
  const document = { querySelectorAll: () => [cartaoCom(botoes)] };
  await carregar({ document }).expandirTextos();
  assert.equal(mais.cliques, 2);
  assert.equal(botoes.length, 0);
});

test('desiste do "Mais" que não abre depois de 6 cliques', async () => {
  const botoes = [];
  const mais = botaoMais(botoes, Infinity);
  botoes.push(mais);
  const api = carregar({ document: { querySelectorAll: () => [cartaoCom(botoes)] } });
  await api.expandirTextos();
  await api.expandirTextos();
  assert.equal(mais.cliques, 6);
});

test('expande o texto original que volta cortado depois de "Ver original"', async () => {
  const botoes = [];
  const maisOriginal = botaoMais(botoes);
  const original = { innerText: 'Ver original', dataset: {}, classList: { contains: () => false },
    click: () => { original.innerText = 'Ver tradução'; botoes.push(maisOriginal); } };
  botoes.push(original);
  const document = { querySelectorAll: () => [cartaoCom(botoes)] };
  await carregar({ document }).expandirTextos();
  assert.equal(maisOriginal.cliques, 1);
  assert.equal(botoes.includes(maisOriginal), false);
});

test('leitura com "Mais" pendente não substitui leitura expandida', () => {
  const { leituraMelhor } = carregar();
  const cheia = { texto_avaliacao: 'texto inteiro', texto_expandido: 'sim' };
  const cortada = { texto_avaliacao: 'texto …', texto_expandido: 'não' };
  assert.equal(leituraMelhor(cheia, cortada), cheia);
  assert.equal(leituraMelhor(cortada, cheia), cheia);
  assert.equal(leituraMelhor(undefined, cortada), cortada);
});

test('avisa na exportação quando sobra avaliação com texto cortado', () => {
  const { checarSeletores } = carregar();
  const linha = { nota_avaliacao: '5', idade_dias_aprox: 3, origem_pseudonimo: 'contrib', tem_texto: 'sim', texto_expandido: 'sim' };
  assert.equal(checarSeletores([linha, linha]), '');
  assert.match(checarSeletores([linha, { ...linha, texto_expandido: 'não' }]), /1 avaliação.*cortad/);
});

test('dispara download do CSV criado', () => {
  let clicado = false;
  const ancora = { click: () => { clicado = true; }, remove: () => {} };
  const document = { createElement: () => ancora, documentElement: { appendChild: () => {} } };
  carregar({ document }).salvarArquivo('avaliacoes.csv', 'review_id;texto\r\nr1;bom');
  assert.equal(ancora.download, 'avaliacoes.csv');
  assert.equal(clicado, true);
});

test('navegação entre filtrados começa na ponta certa e dá a volta', () => {
  const { proximoIndice } = carregar();
  assert.equal(proximoIndice(5, -1, 1), 0);
  assert.equal(proximoIndice(5, -1, -1), 4);
  assert.equal(proximoIndice(5, 4, 1), 0);
  assert.equal(proximoIndice(5, 0, -1), 4);
  assert.equal(proximoIndice(5, 2, 1), 3);
});

test('intervalo de Wilson: 19 de 20 dá 76,4% a 99,1%', () => {
  const [a, b] = carregar().wilson(19, 20);
  assert.equal(a.toFixed(3), '0.764');
  assert.equal(b.toFixed(3), '0.991');
  assert.equal(carregar().wilson(0, 0), null);
});

test('placar da conferência fecha com o total sorteado', () => {
  const conf = { ids: ['a', 'b', 'c', 'd'], marcas: {
    a: { review_id: 'a', resultado: 'confere', nota_confere_auto: 'sim', texto_confere_auto: 'sim' },
    b: { review_id: 'b', resultado: 'diverge', nota_confere_auto: 'não', texto_confere_auto: 'sim' },
    c: { review_id: 'c', resultado: 'confere', nota_confere_auto: 'sim', texto_confere_auto: 'não' },
    x: { review_id: 'x', resultado: 'confere' },
  } };
  const p = carregar().placarConferencia(conf);
  assert.deepEqual([p.ok, p.nd, p.faltam, p.autoNota, p.autoTexto], [2, 1, 1, 1, 1]);
  assert.equal(p.ok + p.nd + p.faltam, p.total);
});

test('filtros salvos voltam iguais e ignoram chaves desconhecidas', () => {
  const t = carregar();
  t.carregarFiltros({ de: 7, ate: 'tudo', temas: ['preco', 'inventado'], opiniao: 'negativa', componentes: ['fotos'], busca: 'couvert', fora: 'ocultar', destacar: false });
  const s = t.filtrosParaSalvar();
  assert.deepEqual(JSON.parse(JSON.stringify(s)), { de: 7, ate: 'tudo', temas: ['preco'], opiniao: 'negativa', componentes: ['fotos'], busca: 'couvert', fora: 'ocultar', destacar: false });
  const r = { idade_dias_aprox: 400, temas: 'preço', opiniao: 'negativa', n_fotos: 2, texto_avaliacao: 'O couvert é caro' };
  assert.equal(t.passaFiltros(r), true);
  assert.equal(t.passaFiltros({ ...r, n_fotos: 0 }), false);
});

test('preferência antiga "esmaecer: true" vira o modo esmaecer', () => {
  const t = carregar();
  t.carregarFiltros({ de: 0, ate: 30, esmaecer: true });
  assert.equal(t.filtrosParaSalvar().fora, 'esmaecer');
  t.carregarFiltros({ de: 0, ate: 30, fora: 'invalido' });
  assert.equal(t.filtrosParaSalvar().fora, '');
});

test('fora do filtro: esmaece, oculta e restaura sem deixar rastro', () => {
  const t = carregar();
  const c = { style: {}, dataset: {} };
  t.filtros.fora = 'esmaecer';
  t.aplicarForaDoFiltro(c, false);
  assert.equal(c.style.opacity, '0.25');
  t.filtros.fora = 'ocultar';
  t.aplicarForaDoFiltro(c, false);
  assert.equal(c.style.opacity, '');
  assert.equal(c.style.display, 'none');
  t.aplicarForaDoFiltro(c, true);
  assert.equal(c.style.display, '');
  assert.equal(c.dataset.tccFora, undefined);
});

test('recibo da exportação diz o que foi aplicado a cada recorte', () => {
  const t = carregar();
  t.carregarFiltros({ de: 0, ate: 180, temas: ['preco', 'servico'], opiniao: 'negativa', componentes: ['fotos'], busca: ' couvert ' });
  const tudo = t.reciboExportacao('tudo');
  assert.equal(tudo.recibo_recorte, 'tudo');
  assert.deepEqual([tudo.recibo_periodo, tudo.recibo_temas, tudo.recibo_opiniao, tudo.recibo_busca], ['nenhum', 'nenhum', 'nenhum', 'nenhum']);
  const periodo = t.reciboExportacao('periodo');
  assert.equal(periodo.recibo_periodo, '0 a 180 dias');
  assert.equal(periodo.recibo_componentes, 'com texto');
  assert.equal(periodo.recibo_temas, 'nenhum');
  const filtros = t.reciboExportacao('filtros');
  assert.equal(filtros.recibo_temas, 'preço; serviço');
  assert.equal(filtros.recibo_opiniao, 'negativa');
  assert.equal(filtros.recibo_componentes, 'fotos');
  assert.equal(filtros.recibo_busca, 'couvert');
  t.carregarFiltros({ de: 0, ate: 'tudo' });
  assert.equal(t.reciboExportacao('filtros').recibo_periodo, '0 a sem limite dias');
});

test('colunas do recibo existem no CSV e as linhas da coleta gravam as entradas', async () => {
  const t = carregar();
  for (const c of ['coleta_parar_em_conhecidas', 'coleta_ordenacao_manual', 'recibo_recorte', 'recibo_periodo', 'recibo_busca', 'recibo_exportado_em']) {
    assert.ok(t.COLS.includes(c), c);
  }
  assert.equal(new Set(t.COLS).size, t.COLS.length);
  const lugar = { place_id: 'p', id_maps: 'm', nome_estabelecimento: 'X' };
  const lidos = [{ review_id: 'a', idade_dias_aprox: 3, tem_texto: 'sim', texto_avaliacao: 'ok' }];
  const [linha] = await t.montarLinhas(lidos, lugar, 'fim da lista', '2026-10-13 20:00', new Set());
  assert.equal(linha.coleta_parar_em_conhecidas, 'não');
  assert.equal(linha.coleta_ordenacao_manual, 'não');
  assert.equal(linha.periodo_ate_dias, 30);
});
