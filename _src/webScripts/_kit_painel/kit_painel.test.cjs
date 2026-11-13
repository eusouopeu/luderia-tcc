// Testes do kit dos painéis: node --test _src/webScripts/_kit_painel/kit_painel.test.cjs
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { ALVOS, SRC, blocoIndentado, embutir } = require('./embutir.js');

test('todos os webscripts têm a cópia atual do kit', () => {
  const bloco = blocoIndentado();
  for (const rel of ALVOS) {
    const texto = fs.readFileSync(path.join(SRC, rel), 'utf8');
    const novo = embutir(texto, bloco);
    assert.notEqual(novo, null, `sem marcadores: ${rel}`);
    assert.equal(novo, texto, `kit desatualizado em ${rel}: rode node _src/webScripts/_kit_painel/embutir.js`);
  }
});

function kit(ambiente = {}) {
  const ctx = { localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} }, ...ambiente };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, 'kit_painel.js'), 'utf8') + '\nglobalThis.k = kitPainel({ id: "t" });', ctx);
  return ctx.k;
}

test('o kit monta no Node sem tocar o DOM', () => {
  const k = kit();
  assert.equal(k.ocupado, false);
  assert.equal(k.som, true);
});

test('CSV com ";", BOM e aspas só onde precisa', () => {
  const k = kit();
  assert.equal(k.csv([{ a: 'x;y', b: 'diz "oi"', c: 3 }], ['a', 'b', 'c']), '﻿a;b;c\r\n"x;y";"diz ""oi""";3');
});

test('usa o armazenamento do Tampermonkey quando há GM_*', () => {
  const v = new Map();
  const k = kit({ GM_getValue: (c, p) => (v.has(c) ? v.get(c) : p), GM_setValue: (c, x) => v.set(c, x) });
  k.gravar('a', { b: 1 });
  assert.deepEqual(v.get('a'), { b: 1 });
  assert.deepEqual(k.ler('a', null), { b: 1 });
});

test('baixa na pasta da coleta pelo GM_download e espera o download antes de seguir', async () => {
  const pedidos = [];
  const amb = {
    URL: { createObjectURL: () => 'blob:x', revokeObjectURL() {} }, Blob: class { constructor(p) { this.p = p; } },
    GM_download: (o) => { pedidos.push(o); setTimeout(o.onload, 5); },
    setTimeout, document: { createElement: () => ({ click() {}, remove() {} }), documentElement: { appendChild() {} } },
  };
  const ctx = { localStorage: { getItem: () => null, setItem() {}, removeItem() {} }, ...amb };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, 'kit_painel.js'), 'utf8') + '\nglobalThis.k = kitPainel({ id: "t", pastaDownload: "B1_entorno/_dados-brutos" });', ctx);
  const r = await ctx.k.baixarArquivo('a.csv', 'x');
  assert.equal(pedidos[0].name, 'TCC Luderia/B1_entorno/_dados-brutos/a.csv');
  assert.equal(pedidos[0].saveAs, false);
  assert.equal(r.via, 'pasta');
  assert.equal(ctx.k.pastaDoArquivo('', 'b.csv'), 'b.csv');
});

test('cai no download comum quando o Tampermonkey recusa', async () => {
  let cliques = 0;
  const ctx = {
    localStorage: { getItem: () => null, setItem() {}, removeItem() {} }, setTimeout,
    URL: { createObjectURL: () => 'blob:x', revokeObjectURL() {} }, Blob: class {},
    GM_download: (o) => setTimeout(() => o.onerror({ error: 'not_whitelisted' }), 5),
    document: { createElement: () => ({ click() { cliques++; }, remove() {} }), documentElement: { appendChild() {} } },
  };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, 'kit_painel.js'), 'utf8') + '\nglobalThis.k = kitPainel({ id: "t", pastaDownload: "x" });', ctx);
  const r = await ctx.k.baixarArquivo('a.csv', 'x');
  assert.equal(r.via, 'navegador');
  assert.equal(cliques, 1);
});

test('opção da fila "baixar cada item": desligada por padrão e gravada por script', () => {
  const v = new Map();
  const k = kit({ GM_getValue: (c, p) => (v.has(c) ? v.get(c) : p), GM_setValue: (c, x) => v.set(c, x) });
  assert.equal(k.baixarCada, false);
  assert.equal(typeof k.botaoBaixarCada, 'function');
  v.set('t:kit:baixarcada', true);
  assert.equal(kit({ GM_getValue: (c, p) => (v.has(c) ? v.get(c) : p), GM_setValue: () => {} }).baixarCada, true);
});

// Cada webscript com menu lê os itens de lista_<script>.js (o carregador a põe antes, com
// @require). Sem a lista, o script avisa e para em vez de quebrar no meio.
const COM_LISTA = ['B1_estabelecimentos/acervo', 'B1_estabelecimentos/cardapio', 'B1_estabelecimentos/instagram',
  'B1_estabelecimentos/instagram_snowball', 'B1_estabelecimentos/maps_entorno', 'B1_estabelecimentos/maps_horarios_pico',
  'B2_avaliacoes_recentes/maps_avaliacoes', 'B5_ativos_fixos/aluguel', 'B5_ativos_fixos/mobiliario'];

test('cada webscript com menu declara a lista no cabeçalho e para sem ela', () => {
  for (const rel of COM_LISTA) {
    const dir = path.join(__dirname, '..', path.dirname(rel));
    const nome = path.basename(rel);
    const fonte = fs.readFileSync(path.join(dir, `${nome}.user.js`), 'utf8');
    assert.ok(fs.existsSync(path.join(dir, `lista_${nome}.js`)), `falta lista_${nome}.js`);
    assert.match(fonte, new RegExp(`// @require\\s+lista_${nome}\\.js\\n`), `${nome}: sem @require da lista`);
    const avisos = [];
    const ctx = { alert: (m) => avisos.push(m), console: { error: () => {}, info: () => {}, log: () => {} } };
    const ini = fonte.indexOf('  if (typeof LISTA_');
    assert.ok(ini > 0, `${nome}: sem guarda da lista`);
    const guarda = fonte.slice(ini, fonte.indexOf('\n  }\n', ini) + 4);
    vm.runInNewContext(`(function () {\n${guarda}\n  globalThis.seguiu = true;\n})();`, ctx);
    assert.equal(ctx.seguiu, undefined, `${nome}: seguiu sem a lista`);
    assert.equal(avisos.length, 1, `${nome}: não avisou`);
    assert.match(avisos[0], new RegExp(`lista_${nome}\\.js`));
  }
});
