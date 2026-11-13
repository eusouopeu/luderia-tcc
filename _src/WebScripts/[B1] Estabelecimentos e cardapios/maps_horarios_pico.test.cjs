const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const source = fs.readFileSync(__dirname + '/maps_horarios_pico.user.js', 'utf8');

// Armazenamento do Tampermonkey e localStorage simulados (o localStorage com cota).
function carregar({ antigas = null, cota = Infinity } = {}) {
  const gm = new Map();
  const ls = new Map(antigas ? [['tcc-picos-resultados', JSON.stringify(antigas)]] : []);
  const ambiente = {
    __test: {},
    GM_getValue: (k, p) => (gm.has(k) ? structuredClone(gm.get(k)) : p),
    GM_setValue: (k, v) => gm.set(k, structuredClone(v)),
    GM_deleteValue: (k) => gm.delete(k),
    unsafeWindow: { localStorage: {
      getItem: (k) => (ls.has(k) ? ls.get(k) : null),
      setItem: (k, v) => { if (v.length > cota) throw new Error('QuotaExceededError'); ls.set(k, v); },
      removeItem: (k) => ls.delete(k),
    } },
    location: { href: 'https://www.google.com/maps/' },
    document: { querySelector: () => null, querySelectorAll: () => [] },
    structuredClone,
  };
  const instrumentado = source.slice(0, source.indexOf("  console.info('[Horários de pico] carregado');"))
    + 'Object.assign(globalThis.__test, { POP, converterAntigas, migrarLocalStorage, linhasCsv, popDoLugar, registrosPorCasa, estadoCasa, proximaQueFalta, urlCasa, lerBarra, lugaresGuardados });})();';
  vm.runInNewContext(instrumentado, ambiente, { filename: 'maps_horarios_pico.user.js' });
  return { t: ambiente.__test, gm, ls };
}

const URL_A = 'https://www.google.com/maps/place/Bardo+Mago/@-19.9,-43.9,17z/data=!4m6!3m5!1s0x0:0xaaa!8m2!3d-19.905169!4d-43.915835';
function linhasAntigas(url, nome, n) {
  const base = { nome, endereco: 'Rua X', id_maps: '0x0:0xaaa', lat: '-19.905169', lng: '-43.915835', permanencia: '', situacao: 'ok', coletado_em: '2026-11-11 10:00', url };
  return Array.from({ length: n }, (_, i) => ({ ...base, dia_semana: 'domingo', ordem_dia: Math.floor(i / 24), hora: i % 24, ocupacao_relativa: i, ao_vivo: '', leitura: 'rotulo' }));
}

test('a população traz as 63 casas do B1, sem repetição', () => {
  const { t } = carregar();
  assert.equal(t.POP.length, 63);
  assert.equal(new Set(t.POP.map((p) => p.id)).size, 63);
  assert.ok(t.POP.some((p) => p.nome === 'Ludus Luderia'));
});

test('linhas antigas viram um registro por lugar e voltam iguais no CSV', () => {
  const { t } = carregar();
  const antigas = [...linhasAntigas(URL_A, 'Bardo Mago', 100), { nome: 'X', url: 'u', situacao: 'não abriu um lugar' }];
  const lugares = t.converterAntigas(antigas);
  assert.equal(lugares.length, 2);
  assert.equal(lugares[0].linhas.length, 100);
  const csv = t.linhasCsv(lugares);
  assert.equal(csv.length, antigas.length);
  assert.equal(csv[30].hora, 6);
  assert.equal(csv[30].dia_semana, 'segunda');
  assert.equal(csv[30].ocupacao_relativa, 30);
});

test('migração tira tudo do localStorage e grava no Tampermonkey', () => {
  const antigas = [];
  for (let k = 0; k < 40; k++) antigas.push(...linhasAntigas(URL_A.replace('0xaaa', `0x${k + 100}`), `Casa ${k}`, 90));
  const { t, gm, ls } = carregar({ antigas });
  const msg = t.migrarLocalStorage();
  assert.match(msg, /40 lugares \(3600 linhas\)/);
  assert.equal(ls.has('tcc-picos-resultados'), false);
  assert.equal(gm.get('tcc-picos-lugares').length, 40);
  assert.equal(t.linhasCsv(t.lugaresGuardados()).length, 3600);
  // Registro compacto: bem menor que o formato antigo.
  assert.ok(JSON.stringify(gm.get('tcc-picos-lugares')).length < JSON.stringify(antigas).length / 3);
});

test('a coleta se liga à casa do B1 a até 300 m, preferindo a escolhida', () => {
  const { t } = carregar();
  const bardo = t.POP.find((p) => p.nome === 'Bardo Mago');
  assert.equal(t.popDoLugar({ nome: 'Bardo Mago', lat: '-19.9052', lng: '-43.9159' }, '').id, bardo.id);
  assert.equal(t.popDoLugar({ nome: 'Longe', lat: '-19.95', lng: '-43.95' }, bardo.id), null);
  assert.equal(t.popDoLugar({ nome: 'Bardo Mago', lat: '', lng: '' }, bardo.id).id, bardo.id);
});

test('estado por casa e "Próximo" pulam as prontas e voltam às falhas', () => {
  const { t } = carregar();
  const [a, b, c] = t.POP;
  const lugares = [
    { place_id: a.id, linhas: [[0, 10, 50, '', 'rotulo']], situacao: 'ok' },
    { place_id: b.id, linhas: [], situacao: 'sem horários de pico' },
    { place_id: c.id, linhas: [], situacao: 'Nada gravado: nenhum lugar aberto.' },
  ];
  const reg = t.registrosPorCasa(lugares);
  assert.deepEqual([a, b, c].map((p) => t.estadoCasa(reg.get(p.id))), ['ok', 'sem', 'falha']);
  assert.equal(t.estadoCasa(reg.get(t.POP[3].id)), 'falta');
  assert.equal(t.proximaQueFalta(lugares, a.id).id, c.id);
  assert.equal(t.proximaQueFalta(lugares, c.id).id, t.POP[3].id);
});

test('coleta antiga sem place_id casa pela distância', () => {
  const { t } = carregar();
  const bardo = t.POP.find((p) => p.nome === 'Bardo Mago');
  const reg = t.registrosPorCasa([{ place_id: '', lat: '-19.90517', lng: '-43.91584', linhas: [[1, 2, 3, '', '']] }]);
  assert.equal(t.estadoCasa(reg.get(bardo.id)), 'ok');
});

test('URL da casa usa o place_id', () => {
  const { t } = carregar();
  assert.match(t.urlCasa(t.POP[0]), /query_place_id=ChIJ/);
});

test('leitura das barras segue igual', () => {
  const { t } = carregar();
  assert.deepEqual({ ...t.lerBarra('Movimento às 13:00: 39%.') }, { pct: 39, hora: 13 });
  assert.deepEqual({ ...t.lerBarra('Usually 45% busy at 7 PM.') }, { pct: 45, hora: 19 });
});
