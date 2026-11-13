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
    + 'Object.assign(globalThis.__test, { ACERVOS, alvoDaPagina, lerAcervoDeJogos, lerRejoy, nuxt, tituloDaLista, limpa, semRepetir, situacaoDe, estadoAcervo, proximoAcervo, CASAS, parecido, casar, lerLojasAcervoDeJogos, lerCidadesRejoy, lerLocadorasRejoy, lerUsuariosLudopedia, lerListasLudopedia, alvos, situacaoDaCasa, linhasVarredura, ACEITE });})();';
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

const casa = (t, nome) => t.CASAS.find((c) => c.nome.startsWith(nome));

test('população: 63 casas do B1, sem repetição, com UF', () => {
  const t = carregar();
  assert.equal(t.CASAS.length, 63);
  assert.equal(new Set(t.CASAS.map((c) => c.id)).size, 63);
  assert.ok(t.CASAS.every((c) => /^[A-Z]{2}$/.test(c.uf)));
});

test('semelhança: @ igual ao endereço aceita; outra palavra ou grafia só parecida vai conferir', () => {
  const t = carregar();
  assert.equal(t.parecido(casa(t, 'Arena BG'), 'aarenabg', 'aarenabg').s, 1);
  assert.ok(t.parecido(casa(t, 'Toca do Rato'), 'Toca do Rato', 'tocadorato').s >= t.ACEITE);
  assert.ok(t.parecido(casa(t, 'XPlace'), 'Place Games', 'placegames').s < t.ACEITE);
  assert.ok(t.parecido(casa(t, 'Dungeon'), 'Dungeons e Dados', 'dungeonsedados').s < t.ACEITE);
  assert.ok(t.parecido(casa(t, 'Ludus'), 'Ludum', 'ludum').s < t.ACEITE);
});

test('casar: uma loja aceita por plataforma, mesma UF, lista de acervo antes de usuário homônimo', () => {
  const t = carregar();
  const c = casa(t, 'Dungeon');
  const r = t.casar(c, { lojasAdj: [{ chave: 'dungeon', nome: 'Dungeon Games Store', uf: 'SP' }, { chave: 'dungeonluderia', nome: 'Dungeon Luderia', uf: 'SP' }, { chave: 'dungeonrj', nome: 'Dungeon Games Store', uf: 'RJ' }] });
  assert.equal(JSON.stringify(r.filter((x) => x.semelhanca >= t.ACEITE).map((x) => x.chave)), JSON.stringify(['dungeon']));
  assert.ok(!r.some((x) => x.chave === 'dungeonrj'));
  const e = t.casar(casa(t, 'Encounter'), { usuarios: [{ usuario: 'Encounter', nome: 'Encounter' }], listas: [{ id: '1', url: 'https://ludopedia.com.br/lista/1/x', titulo: 'Encounter Board Games - Acervo de Jogos' }] });
  assert.equal(e.filter((x) => x.semelhanca >= t.ACEITE).map((x) => x.chave)[0], 'lista1');
});

test('leitores dos catálogos: Acervo de Jogos, rejoy (cidades e lojas) e busca da Ludopedia', () => {
  const t = carregar();
  const adj = '<li data-list-filter-target="item" x><h4><a target="_blank" href="https://saojogue.acervodejogos.com.br">SÃO <b>JOGUE</b></a></h4><span class="text-slate-500">Salvador · BA </span></li>';
  assert.equal(JSON.stringify(t.lerLojasAcervoDeJogos(adj)), JSON.stringify([{ chave: 'saojogue', nome: 'SÃO JOGUE', cidade: 'Salvador', uf: 'BA' }]));
  assert.equal(JSON.stringify(t.lerCidadesRejoy('<a href="/locadoras?cidade=S%C3%A3o+Paulo&amp;uf=SP">x</a><a href="/locadoras?cidade=S%C3%A3o+Paulo&uf=SP">')), JSON.stringify([{ cidade: 'São Paulo', uf: 'SP' }]));
  const d = [{ data: 1 }, { 'stores:Recife:PE': 2 }, [3], { slug: 4, name: 5, city: 6, state: 7 }, 'nala', 'Nala Land', 'Recife', 'PE'];
  assert.equal(JSON.stringify(t.lerLocadorasRejoy(`<script id="__NUXT_DATA__" type="application/json">${JSON.stringify(d)}</script>`)), JSON.stringify([{ chave: 'nala', nome: 'Nala Land', cidade: 'Recife', uf: 'PE' }]));
  const u = '<a href="https://ludopedia.com.br/usuario/Castelos Bar"><img></a><a class="n" href="https://ludopedia.com.br/usuario/Castelos Bar">Castelos Bar</a>';
  assert.equal(JSON.stringify(t.lerUsuariosLudopedia(u)), JSON.stringify([{ usuario: 'Castelos Bar', nome: 'Castelos Bar' }]));
  const l = '<a href="https://ludopedia.com.br/lista/20376/acervo-jogasampa"><img></a><a href="https://ludopedia.com.br/lista/20376/acervo-jogasampa">Acervo Jogasampa</a>';
  assert.equal(t.lerListasLudopedia(l)[0].titulo, 'Acervo Jogasampa');
});

test('menu e CSV da varredura: todo acervo conhecido tem casa; cada casa aparece; situação por casa', () => {
  const t = carregar();
  const lista = t.alvos({});
  assert.ok(!lista.some((a) => a.capital === 'Fora do B1'));
  assert.equal(new Set(lista.map((a) => a.casa)).size, 63);
  const reduto = casa(t, 'Reduto');
  const achados = { [reduto.id]: { em: 1, cands: [], erros: [] } };
  assert.equal(t.situacaoDaCasa(achados[reduto.id]), 'vazia');
  assert.equal(t.alvos(achados).find((a) => a.casa === reduto.id).varrida, true);
  achados[reduto.id].cands = [{ fonte: 'rejoy', chave: 'reduto', url: 'https://reduto.rejoy.com.br/search', nome_fonte: 'Reduto', semelhanca: 1, criterio: 'x' }];
  assert.equal(t.situacaoDaCasa(achados[reduto.id]), 'coletar');
  assert.ok(t.alvos(achados).some((a) => a.id === 'rejoy:reduto' && a.nome === reduto.nome));
  const linhas = t.linhasVarredura(achados);
  assert.equal(new Set(linhas.map((l) => l.estabelecimento)).size, 63);
  assert.equal(t.situacaoDaCasa({ em: 1, cands: [], erros: ['rejoy: HTTP 500'] }), 'refazer: rejoy: HTTP 500');
});

test('páginas que não são acervo não viram alvo', () => {
  assert.equal(carregar('https://www.acervodejogos.com.br/companies').alvoDaPagina(), null);
  assert.equal(carregar('https://www.rejoy.com.br/locadoras').alvoDaPagina(), null);
  assert.equal(carregar('https://ludopedia.com.br/').alvoDaPagina(), null);
  assert.equal(carregar('https://saojogue.acervodejogos.com.br/').alvoDaPagina().nome, 'São Jogue - Bela Vista');
});
