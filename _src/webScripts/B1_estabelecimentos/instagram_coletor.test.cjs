const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const source = fs.readFileSync(__dirname + '/instagram_coletor.user.js', 'utf8');

function carregar(contexto = {}) {
  const ambiente = {
    __test: {},
    window: { fetch: async () => ({}) },
    XMLHttpRequest: function () {},
    localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
    location: { pathname: '/ludusluderia/' },
    document: { querySelector: () => null, querySelectorAll: () => [] },
    Node: { DOCUMENT_POSITION_FOLLOWING: 4 },
    URL,
    Blob,
    setTimeout,
    ...contexto,
  };
  ambiente.XMLHttpRequest.prototype.send = () => {};
  const instrumentado = source.slice(0, source.indexOf("  console.info('[Coletor IG] carregado');"))
    + 'Object.assign(globalThis.__test, { capturarPerfil, capturados, lerUsuarios, csv, filaSnowballAtiva, POP_IG, estadoPerfil, proximoPerfil, apiSumiu, posts, perfis, totais, periodoCoberto, situacaoPerfil, nomeExportacao, PERIODO_PADRAO });})();';
  vm.runInNewContext(instrumentado, ambiente, { filename: 'instagram_coletor.user.js' });
  return ambiente.__test;
}

test('lê a lista colada na fila em @ únicos e minúsculos', () => {
  const t = carregar();
  assert.equal(t.lerUsuarios('@SaoJogue\nhttps://www.instagram.com/covilgb/?hl=pt\nsaojogue  bodogami/').join(' '), 'saojogue covilgb bodogami');
});

test('dados de perfil guardam o nº de seguindo para o CSV de perfis', () => {
  const t = carregar();
  t.capturarPerfil({ username: 'A', full_name: 'A', follower_count: 3, following_count: 42 });
  assert.equal(t.capturados.get('a').seguindo, 42);
});

test('reconhece a fila do Snowball em curso pelo localStorage do outro script', () => {
  const ls = (v) => ({ getItem: (k) => (k === 'igs-fila-seguindo' ? v : null), setItem: () => {}, removeItem: () => {} });
  assert.equal(carregar({ localStorage: ls(JSON.stringify({ ativa: true })) }).filaSnowballAtiva(), true);
  assert.equal(carregar({ localStorage: ls(JSON.stringify({ ativa: false })) }).filaSnowballAtiva(), false);
  assert.equal(carregar({ localStorage: ls(null) }).filaSnowballAtiva(), false);
});

test('o coletor não tem mais o snowball', () => {
  assert.ok(!/RE_SEGUINDO_URL|filaSeguindo|rolarSeguindo/.test(source));
});

test('menu dos perfis: estado e próximo que falta na mesma capital', () => {
  const t = carregar();
  assert.equal(t.POP_IG.length, 61); // 63 casas: Reduto sem perfil, Covil SBC usa o @covilgb
  assert.equal(new Set(t.POP_IG.map((p) => p.u)).size, 61);
  const [a, b, c] = t.POP_IG;
  assert.equal(t.estadoPerfil(a.u, { [a.u]: { modo: 'periodo' } }, {}), 'ok');
  assert.equal(t.estadoPerfil(a.u, { [a.u]: { modo: 'periodo' } }, { [a.u]: false }), 'falta');
  assert.equal(t.estadoPerfil(b.u, {}, {}, (u) => u === b.u), 'perfil');
  assert.equal(t.estadoPerfil(c.u, {}, { [c.u]: true }), 'ok');
  const prox = t.proximoPerfil(a.u, { [b.u]: {} }, {});
  assert.ok(![a.u, b.u].includes(prox.u));
  if (t.POP_IG.slice(2).some((p) => p.capital === a.capital)) assert.equal(prox.capital, a.capital);
  const todos = Object.fromEntries(t.POP_IG.map((p) => [p.u, true]));
  assert.equal(t.proximoPerfil(a.u, {}, todos), null);
});

test('menu dos perfis: coleta com situação "refazer" aparece como falha, e a marca à mão prevalece', () => {
  const t = carregar();
  const [a] = t.POP_IG;
  assert.equal(t.estadoPerfil(a.u, { [a.u]: { modo: 'periodo', situacao: 'refazer: período não coberto' } }, {}), 'falha');
  assert.equal(t.estadoPerfil(a.u, { [a.u]: { modo: 'periodo', situacao: 'vazia' } }, {}), 'ok');
  assert.equal(t.estadoPerfil(a.u, { [a.u]: { situacao: 'refazer: x' } }, { [a.u]: true }), 'ok');
});

test('API desativada (404, HTML no lugar de JSON) leva à coleta pela página; 429 e rede não', () => {
  const t = carregar();
  assert.equal(t.apiSumiu({ http: 404 }), true);
  assert.equal(t.apiSumiu({ naoJson: true }), true);
  assert.equal(t.apiSumiu({ http: 429 }), false);
  assert.equal(t.apiSumiu(new Error('Failed to fetch')), false);
  t.capturarPerfil({ username: 'Casa', full_name: 'Casa', follower_count: 10, is_private: true, category_name: 'Bar' });
  assert.equal(t.capturados.get('casa').privado, 'sim');
  assert.equal(t.capturados.get('casa').categoria, 'Bar');
});

test('bio: capturada da biography das respostas do site', () => {
  const t = carregar();
  t.capturarPerfil({ username: 'casa', biography: 'Jogos e lanches\nReservas no site', follower_count: 1 });
  assert.equal(t.capturados.get('casa').bio, 'Jogos e lanches\nReservas no site');
});

// Cineplay (@cineplay_sc) em 12 e 13/11/2026: 12 posts de novembro na primeira página (2 fixados)
// e 2 de abril na segunda; a coleta parou, e o período (01/07 a 01/11) saiu vazio.
function cineplay(t, antigos) {
  t.posts.clear();
  const ts = (d) => Math.floor(new Date(`${d}T12:00:00`).getTime() / 1000);
  let chegada = 0;
  for (let i = 0; i < 12; i++) {
    const code = `nov${i}`;
    t.posts.set(code, { shortcode: code, perfil: 'cineplay_sc', taken_at: ts(`2026-11-${String(2 + i).padStart(2, '0')}`), fixado: i < 2 ? 'sim' : '', chegada: chegada++ });
  }
  antigos.forEach((d, i) => t.posts.set(`ant${i}`, { shortcode: `ant${i}`, perfil: 'cineplay_sc', taken_at: ts(d), fixado: '', chegada: chegada++ }));
  t.perfis.set('cineplay_sc', { privado: 'não' });
  t.totais.set('cineplay_sc', 1733);
}

test('período padrão do B1 é 01/07 a 01/11', () => {
  const t = carregar();
  assert.deepEqual([...t.PERIODO_PADRAO], ['2026-07-01', '2026-11-01']);
});

test('dois posts antigos soltos não dão o período por coberto; três dão', () => {
  const t = carregar();
  cineplay(t, ['2026-04-20', '2026-04-23']);
  assert.equal(t.periodoCoberto('cineplay_sc', [...t.posts.values()]), false);
  cineplay(t, ['2026-04-20', '2026-04-23', '2026-04-10']);
  assert.equal(t.periodoCoberto('cineplay_sc', [...t.posts.values()]), true);
});

test('perfil ativo sem post no período sai "refazer", não "vazia"', () => {
  const t = carregar();
  cineplay(t, ['2026-04-20', '2026-04-23', '2026-04-10']);
  assert.match(t.situacaoPerfil('cineplay_sc', 'periodo'), /^refazer: nenhum post no período e 12 depois dele/);
});

test('nome do arquivo na convenção, com a data local', () => {
  const t = carregar();
  const quando = new Date(2026, 10, 12, 22, 15).getTime();
  assert.equal(t.nomeExportacao('cineplay_sc', 'posts', quando), '2026-11-12_cineplay_sc_instagram_posts.csv');
});
