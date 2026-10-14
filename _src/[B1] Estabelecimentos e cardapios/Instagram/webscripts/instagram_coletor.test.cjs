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
    location: { pathname: '/ludusluderia/following/' },
    document: { querySelector: () => null, querySelectorAll: () => [] },
    Node: { DOCUMENT_POSITION_FOLLOWING: 4 },
    URL,
    Blob,
    setTimeout,
    ...contexto,
  };
  ambiente.XMLHttpRequest.prototype.send = () => {};
  const instrumentado = source.slice(0, source.indexOf("  console.info('[Coletor IG] carregado');"))
    + 'Object.assign(globalThis.__test, { sementeAtual, registrarSeguido, ingerirSeguindo, lerSeguindoDom, linhasSeguindo, seguindo, csv, COLS_SEGUINDO, RE_SEGUINDO_URL });})();';
  vm.runInNewContext(instrumentado, ambiente, { filename: 'instagram_coletor.user.js' });
  return ambiente.__test;
}

test('reconhece a semente pela URL da lista "seguindo"', () => {
  assert.equal(carregar().sementeAtual(), 'ludusluderia');
  assert.equal(carregar({ location: { pathname: '/ludusluderia/' } }).sementeAtual(), null);
  assert.equal(carregar({ location: { pathname: '/explore/following/' } }).sementeAtual(), null);
});

test('só aceita o pedido de "seguindo" da própria página', () => {
  const { RE_SEGUINDO_URL } = carregar();
  assert.ok(RE_SEGUINDO_URL.test('https://www.instagram.com/api/v1/friendships/123/following/?count=12'));
  assert.ok(!RE_SEGUINDO_URL.test('https://www.instagram.com/api/v1/friendships/123/followers/?count=12'));
});

test('guarda os seguidos da resposta da página, sem repetir e sem a própria semente', () => {
  const t = carregar();
  t.ingerirSeguindo({ users: [
    { username: 'SaoJogue', full_name: 'São Jogue', is_verified: false, is_private: false },
    { username: 'ludusluderia' },
    { username: 'saojogue', full_name: 'São Jogue' },
  ] });
  const m = t.seguindo.get('ludusluderia');
  assert.equal(m.size, 1);
  assert.equal(m.get('saojogue').nome, 'São Jogue');
  assert.equal(m.get('saojogue').fonte, 'api');
  assert.equal(m.get('saojogue').verificado, 'não');
});

test('a resposta da página prevalece sobre a leitura do diálogo, mantendo a ordem', () => {
  const t = carregar();
  t.registrarSeguido('ludusluderia', { username: 'covilgb' }, 'dom');
  t.registrarSeguido('ludusluderia', { username: 'covilgb', full_name: 'Covil' }, 'api');
  t.registrarSeguido('ludusluderia', { username: 'covilgb' }, 'dom');
  const d = t.seguindo.get('ludusluderia').get('covilgb');
  assert.equal(d.fonte, 'api');
  assert.equal(d.nome, 'Covil');
  assert.equal(d.ordem, 1);
});

test('a leitura do diálogo para no bloco "Sugestões para você"', () => {
  const corte = { childElementCount: 0, textContent: 'Sugestões para você', compareDocumentPosition: (a) => (a.depois ? 4 : 2) };
  const links = [
    { getAttribute: () => '/bodogami/', depois: false },
    { getAttribute: () => '/p/abc/', depois: false },
    { getAttribute: () => '/sugerida/', depois: true },
  ];
  const dialogo = { querySelectorAll: (s) => (s.startsWith('a') ? links : [corte]) };
  const t = carregar({ document: { querySelector: () => dialogo, querySelectorAll: () => [] } });
  t.lerSeguindoDom();
  assert.deepEqual([...t.seguindo.get('ludusluderia').keys()], ['bodogami']);
});

test('CSV de seguindo traz uma linha por seguido com a semente', () => {
  const t = carregar();
  t.ingerirSeguindo({ users: [{ username: 'a' }, { username: 'b' }] });
  const texto = t.csv(t.linhasSeguindo('ludusluderia'), t.COLS_SEGUINDO);
  const linhas = texto.replace(/^﻿/, '').split('\r\n');
  assert.equal(linhas[0], t.COLS_SEGUINDO.join(';'));
  assert.equal(linhas.length, 3);
  assert.ok(linhas[1].startsWith('ludusluderia;a;'));
});
