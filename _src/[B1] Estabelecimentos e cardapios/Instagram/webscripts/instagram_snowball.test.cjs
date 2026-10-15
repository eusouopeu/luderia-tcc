const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const source = fs.readFileSync(__dirname + '/instagram_snowball.user.js', 'utf8');

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
  const instrumentado = source.slice(0, source.indexOf("  console.info('[Snowball IG] carregado');"))
    + 'Object.assign(globalThis.__test, { sementeAtual, registrarSeguido, ingerirSeguindo, capturar, lerUsuarios, declaradoSeguindo, pendentes, lerSeguindoDom, linhasSeguindo, seguindo, csv, COLS_SEGUINDO, RE_SEGUINDO_URL, linkSeguindo, contadorSeguindo, pararFila, limparFila, lerFila, gravarFila, iniciarFila, RE_CONTADOR_SEGUINDO, ativo: () => parar });})();';
  vm.runInNewContext(instrumentado, ambiente, { filename: 'instagram_snowball.user.js' });
  return ambiente.__test;
}

test('reconhece a semente pela URL da lista "seguindo"', () => {
  assert.equal(carregar().sementeAtual(), 'ludusluderia');
  assert.equal(carregar({ location: { pathname: '/ludusluderia/' } }).sementeAtual(), null);
  assert.equal(carregar({ location: { pathname: '/explore/following/' } }).sementeAtual(), null);
});

function folha(texto, emBotao = false) {
  return { childElementCount: 0, textContent: texto, closest: () => (emBotao ? {} : null) };
}

test('reconhece a semente com a lista "seguindo" aberta em janela sobre o perfil', () => {
  const dialogo = { querySelectorAll: () => [folha('Seguindo'), folha('jeremycorbell')] };
  const document = { querySelector: () => dialogo, querySelectorAll: (s) => (s === 'div[role="dialog"]' ? [dialogo] : []) };
  assert.equal(carregar({ location: { pathname: '/flowg4mes/' }, document }).sementeAtual(), 'flowg4mes');
});

test('não confunde o diálogo de seguidores (botões "Seguindo" nas linhas) com a lista "seguindo"', () => {
  const dialogo = { querySelectorAll: () => [folha('Seguidores'), folha('Seguindo', true)] };
  const document = { querySelector: () => dialogo, querySelectorAll: (s) => (s === 'div[role="dialog"]' ? [dialogo] : []) };
  assert.equal(carregar({ location: { pathname: '/flowg4mes/' }, document }).sementeAtual(), null);
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

test('a resposta vai para a semente do id no pedido, mesmo com outra lista aberta', () => {
  const t = carregar();
  t.capturar({ username: 'Alcapaojogos', pk: '555', follower_count: 10 });
  t.ingerirSeguindo({ users: [{ username: 'x' }] }, 'https://www.instagram.com/api/v1/friendships/555/following/?count=12');
  t.ingerirSeguindo({ users: [{ username: 'y' }] }, 'https://www.instagram.com/api/v1/friendships/999/following/?count=12');
  assert.deepEqual([...t.seguindo.get('alcapaojogos').keys()], ['x']);
  assert.deepEqual([...t.seguindo.get('ludusluderia').keys()], ['y']);
});

test('lê a lista colada na fila em @ únicos e minúsculos', () => {
  const t = carregar();
  assert.equal(t.lerUsuarios('@SaoJogue\nhttps://www.instagram.com/covilgb/?hl=pt\nsaojogue  bodogami/').join(' '), 'saojogue covilgb bodogami');
});

test('total declarado de seguindo vem do primeiro valor preenchido', () => {
  const t = carregar();
  t.capturar({ username: 'a', full_name: 'A', follower_count: 3, following_count: 42 });
  assert.equal(t.declaradoSeguindo('a'), 42);
  assert.equal(t.declaradoSeguindo('desconhecido'), 0);
});

test('fila de seguindo: pendentes excluem feitas e puladas', () => {
  const t = carregar();
  assert.equal(t.pendentes({ todos: ['a', 'b', 'c', 'd'], feitos: ['a'], falhas: { c: 'privado' } }).join(' '), 'b d');
});

function armazenamento(inicial = {}) {
  const d = { ...inicial };
  return { getItem: (k) => (k in d ? d[k] : null), setItem: (k, v) => { d[k] = String(v); }, removeItem: (k) => { delete d[k]; }, dados: d };
}

test('acha o link "seguindo" relativo, absoluto ou com parâmetros', () => {
  const links = [
    { getAttribute: () => '/outra/following/' },
    { getAttribute: () => 'https://www.instagram.com/SaoJogue/following/?next=1' },
  ];
  const document = { querySelector: () => null, querySelectorAll: (s) => (s === 'a[href]' ? links : []) };
  const t = carregar({ location: { pathname: '/saojogue/', origin: 'https://www.instagram.com' }, document });
  assert.equal(t.linkSeguindo('saojogue'), links[1]);
  assert.equal(t.linkSeguindo('covilgb'), null);
});

test('reconhece o contador "seguindo" do cabeçalho em vários formatos', () => {
  const { RE_CONTADOR_SEGUINDO: re } = carregar();
  for (const t of ['312 seguindo', 'Seguindo', '1.234 following', '2,5 mil seguindo', 'seguindo 312']) assert.ok(re.test(t), t);
  for (const t of ['312 seguidores', 'Seguir', 'Seguindo você']) assert.ok(!re.test(t), t);
});

test('sem link, clica no contador "seguindo" do cabeçalho', () => {
  const botao = { tagName: 'A' };
  const n = { textContent: ' 312  seguindo ', closest: () => botao };
  const outro = { textContent: '1.200 seguidores', closest: () => null };
  const header = { querySelectorAll: () => [outro, n] };
  const document = { querySelector: (s) => (s === 'header' ? header : null), querySelectorAll: () => [] };
  assert.equal(carregar({ location: { pathname: '/saojogue/' }, document }).contadorSeguindo(), botao);
});

test('"Parar" desliga a fila no armazenamento, e a próxima carga não retoma', () => {
  const ls = armazenamento();
  const t = carregar({ localStorage: ls, location: { pathname: '/saojogue/' } });
  t.gravarFila({ todos: ['a', 'b'], feitos: [], falhas: {}, ativa: true });
  t.pararFila();
  assert.equal(t.lerFila().ativa, false);
  assert.equal(t.ativo(), true);
});

test('"Limpar fila" apaga a fila salva', () => {
  const ls = armazenamento();
  const t = carregar({ localStorage: ls, location: { pathname: '/saojogue/' } });
  t.gravarFila({ todos: ['a'], feitos: [], falhas: {}, ativa: true });
  t.limparFila();
  assert.equal(t.lerFila(), null);
});
