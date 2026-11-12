// Testes do coletor de acervos: node --test acervo_coletor.test.cjs
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const source = fs.readFileSync(__dirname + '/acervo_coletor.user.js', 'utf8');

function carregar(loc = 'https://ludopedia.com.br/colecao?usuario=aarenabg') {
  const valores = new Map();
  const u = new URL(loc);
  const ambiente = {
    __test: {}, URL, URLSearchParams,
    GM_getValue: (k, p) => (valores.has(k) ? valores.get(k) : p),
    GM_setValue: (k, v) => valores.set(k, v),
    GM_deleteValue: (k) => valores.delete(k),
    location: { hostname: u.hostname, pathname: u.pathname, search: u.search, href: u.href, origin: u.origin },
    document: { querySelector: () => null, querySelectorAll: () => [] },
    setTimeout,
  };
  const instrumentado = source.slice(0, source.indexOf("  console.info('[Coletor de acervos] carregado');"))
    + 'Object.assign(globalThis.__test, { ACERVOS, alvoDaPagina, lerAcervoDeJogos, lerRejoy, nuxt, tituloDaLista, limpa, semRepetir, situacaoDe, estadoAcervo, proximoAcervo });})();';
  vm.runInNewContext(instrumentado, ambiente, { filename: 'acervo_coletor.user.js' });
  return ambiente.__test;
}

test('alvos sem repetição e as 4 casas da Ludopedia', () => {
  const t = carregar();
  assert.equal(new Set(t.ACERVOS.map((a) => a.id)).size, t.ACERVOS.length);
  assert.equal(t.ACERVOS.filter((a) => a.fonte === 'ludopedia').length, 4);
});

test('reconhece a casa pela página aberta', () => {
  assert.equal(carregar('https://ludopedia.com.br/colecao?usuario=AArenaBG').alvoDaPagina().chave, 'arenabg');
  assert.equal(carregar('https://ludopedia.com.br/colecao?usuario=Castelos%20Bar').alvoDaPagina().chave, 'castelos');
  assert.equal(carregar('https://ludopedia.com.br/lista/20376/acervo-jogasampa?pagina=3').alvoDaPagina().chave, 'jogasampa');
  assert.equal(carregar('https://bardomago.acervodejogos.com.br/boardgames').alvoDaPagina().chave, 'bardomago');
  assert.equal(carregar('https://nala.rejoy.com.br/search').alvoDaPagina().fonte, 'rejoy');
  assert.equal(carregar('https://novaloja.acervodejogos.com.br/').alvoDaPagina().chave, 'novaloja');
});

test('lê o card do Acervo de Jogos como o Python (preço, período e período da casa)', () => {
  const t = carregar();
  const html = '<a class="line-clamp-2" href="/boardgames/azul">Azul &amp; Cia</a><b>R$ 15,00<span class="x"> / 3 dias</span></b>'
    + '<a class="line-clamp-2" href="/boardgames/catan">Catan</a><b>R$ 1.020,50</b> href="?page=2&amp;sort=mais_alugados"';
  const r = t.lerAcervoDeJogos(html, 'saojogue', 1);
  assert.equal(JSON.stringify(r.jogos.map((j) => [j.jogo, j.aluguel_rs, j.aluguel_dias])), JSON.stringify([['Azul & Cia', 15, 3], ['Catan', 1020.5, 4]]));
  assert.equal(r.mais, true);
});

test('lê a rejoy pelo __NUXT_DATA__', () => {
  const t = carregar();
  const d = [{ data: 1 }, { 'boardgames-1': 2 }, ['Reactive', 3], { data: 4, meta: 7 }, [5], { name: 6, price_category: null }, ' Azul ', { last_page: 8 }, 2];
  const r = t.lerRejoy(`<script id="__NUXT_DATA__" type="application/json">${JSON.stringify(d)}</script>`);
  assert.equal(JSON.stringify([r.jogos[0].jogo, r.ultima]), JSON.stringify(['Azul', 2]));
});

test('título da lista sem número de ordem nem curtidas; repetidos saem', () => {
  const t = carregar();
  assert.equal(t.tituloDaLista('  12 - 7 Wonders: Duel  0 '), '7 Wonders: Duel');
  assert.equal(t.semRepetir([{ jogo: 'Azul' }, { jogo: 'azul' }, { jogo: 'Catan' }]).length, 2);
});

test('situação e estado do menu', () => {
  const t = carregar();
  assert.equal(t.situacaoDe(true, 10), 'ok');
  assert.equal(t.situacaoDe(true, 0), 'vazia');
  assert.match(t.situacaoDe(false, 10), /^refazer/);
  const a = t.ACERVOS[0];
  assert.equal(t.estadoAcervo(a, { [a.chave]: { situacao: 'refazer: x' } }), 'falha');
  assert.equal(t.estadoAcervo(a, { [a.chave]: { situacao: 'vazia' } }), 'ok');
  assert.equal(t.estadoAcervo(a, {}, { [a.chave]: true }), 'ok');
  assert.equal(t.proximoAcervo(a.id, {}, {}).fonte, 'ludopedia');
});
