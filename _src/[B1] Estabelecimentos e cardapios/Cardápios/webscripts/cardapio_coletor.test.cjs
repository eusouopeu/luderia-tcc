// Testes do menu dos cardápios: node --test cardapio_coletor.test.cjs
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const source = fs.readFileSync(__dirname + '/cardapio_coletor.user.js', 'utf8');

function carregar() {
  const valores = new Map();
  function XHR() {}
  XHR.prototype.send = () => {};
  const ambiente = {
    __test: {},
    GM_getValue: (k, padrao) => (valores.has(k) ? valores.get(k) : padrao),
    GM_setValue: (k, v) => valores.set(k, v),
    GM_deleteValue: (k) => valores.delete(k),
    unsafeWindow: { fetch: async () => ({}), XMLHttpRequest: XHR },
    window: {},
    URL,
    location: { hostname: 'latabuleria.saipos.com', href: 'https://latabuleria.saipos.com/home' },
    document: { querySelector: () => null, querySelectorAll: () => [] },
  };
  const instrumentado = source.slice(0, source.indexOf("  console.info('[Coletor de cardápio] carregado');"))
    + 'Object.assign(globalThis.__test, { ALVOS, estadoCardapio, proximoCardapio, alvoAqui, classificar });})();';
  vm.runInNewContext(instrumentado, ambiente, { filename: 'cardapio_coletor.user.js' });
  return ambiente.__test;
}

test('menu: cardápios sem repetição, estado e próximo que falta na mesma capital', () => {
  const t = carregar();
  assert.equal(new Set(t.ALVOS.map((a) => a.id)).size, t.ALVOS.length);
  const bardo = t.ALVOS.find((a) => a.id === 'bardo_mago');
  const garagem = t.ALVOS.find((a) => a.id === 'garagem_do_nerd');
  assert.equal(t.estadoCardapio(bardo, {}, {}), 'ok'); // já coletado em 12/10
  assert.equal(t.estadoCardapio(bardo, {}, { bardo_mago: false }), 'falta');
  assert.equal(t.estadoCardapio(garagem, {}, {}), 'falta');
  assert.equal(t.estadoCardapio(garagem, { garagem_do_nerd: { itens: 30 } }, {}), 'ok');
  assert.equal(t.proximoCardapio('bardo_mago', {}, {}).id, 'garagem_do_nerd');
  // com os de Belo Horizonte prontos, vai para outra capital
  assert.notEqual(t.proximoCardapio('bardo_mago', { garagem_do_nerd: {} }, {}).capital, 'Belo Horizonte');
  const todos = Object.fromEntries(t.ALVOS.map((a) => [a.id, true]));
  assert.equal(t.proximoCardapio('bardo_mago', {}, todos), null);
});

test('reconhece o cardápio da página aberta pelo host', () => {
  assert.equal(carregar().alvoAqui().id, 'la_tabuleria');
});
