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
    + 'Object.assign(globalThis.__test, { capturarPerfil, capturados, lerUsuarios, csv, filaSnowballAtiva });})();';
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
