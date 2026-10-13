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
    + 'Object.assign(globalThis.__test, { infoLugar, rolavel, cartoes, abrirAbaAvaliacoes, ordenarRecentes, expandirTextos, montarLinhas, csv, COLS, salvarArquivo });})();';
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

test('expande texto e restaura idioma original no cartão', async () => {
  let expansoes = 0;
  const mais = { innerText: 'Mais', dataset: {}, classList: { contains: () => false }, click: () => { expansoes++; } };
  const original = { innerText: 'Ver original', dataset: {}, classList: { contains: () => false },
    click: () => { expansoes++; } };
  const cartao = { parentElement: { closest: () => null }, querySelectorAll: () => [mais, original] };
  const document = { querySelectorAll: () => [cartao] };
  assert.equal(await carregar({ document }).expandirTextos(), 2);
  assert.equal(expansoes, 2);
});

test('dispara download do CSV criado', () => {
  let clicado = false;
  const ancora = { click: () => { clicado = true; }, remove: () => {} };
  const document = { createElement: () => ancora, documentElement: { appendChild: () => {} } };
  carregar({ document }).salvarArquivo('avaliacoes.csv', 'review_id;texto\r\nr1;bom');
  assert.equal(ancora.download, 'avaliacoes.csv');
  assert.equal(clicado, true);
});
