const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(__dirname + '/precos_itens.user.js', 'utf8');
const { parseHTML } = require('linkedom');

const LISTA = path.resolve(__dirname, '../../../../dados/[B5] Ativos fixos/orcamento/[B5] Lista de Itens da Etapa 1 (elaboração própria).csv');
const FIXTURES = path.resolve(__dirname, '../outros/fixtures_html');

// Roda o userscript até antes do painel e expõe as funções. Sem html, um documento vazio;
// com html, o DOM da fixture (linkedom) no endereço dado.
function carregar(html, href = 'https://www.amazon.com.br/s?k=x') {
  const url = new URL(href);
  const document = html ? parseHTML(html).document : { querySelector: () => null, querySelectorAll: () => [] };
  const ambiente = {
    __test: {},
    URL,
    GM_getValue: (k, padrao) => padrao,
    GM_setValue() {},
    GM_deleteValue() {},
    location: { href: url.href, hostname: url.hostname },
    document,
  };
  const instrumentado = source.slice(0, source.indexOf("  console.info(NOME, 'carregado');"))
    + 'Object.assign(globalThis.__test, { ITENS, numeroBR, freteDe, precoAtual, tipoPreco, palavras, relevancia, medidas, medidaConflita, motivosRegras, kitDe, marcarVariantes, revisarGuardadas, motivosOferta, funil, quantil, pendentes, coberturaCategoria, cepDe, ehSalvador, ofertasJsonLd, siteDe, urlBusca, guardar, excluir, ativas, resumoItem, mediana, somarOfertas, csv, nomeArquivo, lerOfertas, cepDoSite });})();';
  vm.runInNewContext(instrumentado, ambiente, { filename: 'precos_itens.user.js' });
  return ambiente.__test;
}

const fixture = (nome) => fs.readFileSync(path.join(FIXTURES, nome), 'utf8');

const t = carregar();
const json = (x) => JSON.parse(JSON.stringify(x));

test('a lista embutida é a dos itens de coleta do CSV da etapa 1', () => {
  const linhas = fs.readFileSync(LISTA, 'utf8').replace(/^﻿/, '').trim().split(/\r?\n/).map((l) => l.split(';'));
  const cab = linhas[0];
  const col = (l, nome) => l[cab.indexOf(nome)];
  const esperado = linhas.slice(1).filter((l) => col(l, 'fonte_preco') === 'coleta')
    .map((l) => ({ id: col(l, 'id'), categoria: col(l, 'categoria'), item: col(l, 'item'), termo: col(l, 'termo_busca'),
      exige: col(l, 'termo_exige').split('|').filter(Boolean), exclui: col(l, 'termo_exclui').split('|').filter(Boolean) }));
  assert.deepEqual(json(t.ITENS), esperado);
});

test('lê números no formato brasileiro', () => {
  assert.equal(t.numeroBR('R$ 1.234,56'), 1234.56);
  assert.equal(t.numeroBR('R$1.058'), 1058);
  assert.equal(t.numeroBR('sem preço'), null);
});

test('frete: grátis, valor ou não informado', () => {
  assert.equal(t.freteDe('Entrega GRÁTIS: 5 - 8 de dez.'), 0);
  assert.equal(t.freteDe('Frete grátis'), 0);
  assert.equal(t.freteDe('Entrega R$ 95,41: 2 - 10 de dez.'), 95.41);
  assert.equal(t.freteDe('Chega amanhã'), null);
});

test('preço atual: menor do bloco, sem parcelas', () => {
  assert.equal(t.precoAtual([{ valor: 300, contexto: 'R$ 300,00' }, { valor: 250, contexto: 'R$ 250,00 cada' }]), 250);
  assert.equal(t.precoAtual([{ valor: 2899, contexto: 'R$ 2.899,00' }, { valor: 254.29, contexto: 'em até 12x de R$ 254,29' }]), 2899);
  assert.equal(t.precoAtual([{ valor: 0, contexto: 'Total: R$ 0,00' }]), null);
});

test('relevância pelo termo do item', () => {
  assert.equal(t.relevancia('Freezer Electrolux Horizontal 513L 2 Tampas', 'freezer horizontal 2 tampas 400 litros'), 4 / 6);
  assert.ok(t.relevancia('Frigobar 93 Litros Midea', 'freezer horizontal 2 tampas 400 litros') < 0.5);
  assert.equal(t.relevancia('Fogão Industrial 4 Bocas com Forno', 'fogao industrial 4 bocas com forno'), 1);
  // número só casa inteiro: "4" não está em "40" nem em "14"
  assert.equal(t.relevancia('Fogão Industrial 40 Bocas 14', 'fogao 4'), 1 / 2);
  // medida com espaço, milhar com ponto, unidade colada e plural
  assert.equal(t.relevancia('Mesa Retangular 160 x 90 cm Restaurantes', 'mesa retangular 160x90 restaurante'), 1);
  assert.equal(t.relevancia('Ar Condicionado Split 30.000 BTUs Inverter', 'ar condicionado split 30000 btus inverter'), 1);
  assert.equal(t.relevancia('Liquidificador Industrial 4L', 'liquidificador industrial 4 litros'), 3 / 4);
  assert.deepEqual(json(t.palavras('Mesa 150cm X 70cm')), ['mesa', '150x70', 'cm']);
});

test('tipo de preço e CEP', () => {
  assert.equal(t.tipoPreco(' à vista no Pix ou NuPay '), 'pix');
  assert.equal(t.tipoPreco('R$ 99 com cupom'), 'cupom');
  assert.equal(t.tipoPreco('R$ 99 em 10x'), 'padrao');
  assert.equal(t.tipoPreco('cadaà vista no pix04x de'), 'pix');
  assert.equal(t.tipoPreco('Pixel 8 Pro'), 'padrao');
  assert.equal(t.cepDe('Salvador 40170110'), '40170-110');
  assert.equal(t.cepDe('Atualizar CEP'), '');
  assert.ok(t.ehSalvador('41820-020'));
  assert.ok(!t.ehSalvador('01310-100'));
});

test('JSON-LD: produto, lista de produtos e @graph', () => {
  const produto = { '@type': 'Product', name: 'Cadeira  Estofada', url: 'https://loja/c1', offers: { '@type': 'Offer', price: '199.90' } };
  assert.deepEqual(json(t.ofertasJsonLd(produto)), [{ produto: 'Cadeira Estofada', preco: 199.9, url: 'https://loja/c1', frete: null, patrocinado: false, tipo_preco: 'padrao' }]);
  const lista = { '@type': 'ItemList', itemListElement: [{ '@type': 'ListItem', item: produto }, { '@type': 'ListItem', item: { ...produto, url: 'https://loja/c2', offers: { lowPrice: 150, highPrice: 180 } } }] };
  assert.deepEqual(json(t.ofertasJsonLd(lista).map((o) => o.preco)), [199.9, 150]);
  assert.equal(t.ofertasJsonLd({ '@graph': [{ '@type': 'Organization' }, produto] }).length, 1);
  assert.equal(t.ofertasJsonLd({ '@type': 'Product', name: 'Sem preço', offers: {} }).length, 0);
});

test('site e URL de busca', () => {
  assert.equal(t.siteDe('www.amazon.com.br'), 'amazon');
  assert.equal(t.siteDe('lista.mercadolivre.com.br'), 'mercadolivre');
  assert.equal(t.urlBusca('mercadolivre', 'Fogão industrial 4 bocas'), 'https://lista.mercadolivre.com.br/fogao-industrial-4-bocas');
  assert.equal(t.urlBusca('amazon', 'mesa inox'), 'https://www.amazon.com.br/s?k=mesa%20inox');
  assert.equal(t.urlBusca('outra', 'x'), '');
});

test('guardar: preço por unidade, sem duplicar a mesma oferta do item', () => {
  const g = {};
  const item = { id: 'CB17', categoria: 'cozinha_bar' };
  const ctx = { fonte: 'amazon', busca: 'b', data_coleta: '2026-11-02', agora: 1000 };
  const ofertas = [{ produto: 'Copo long drink caixa com 24', preco: 120, frete: 24, url: 'https://a/1' }, { produto: 'sem preço', preco: null, url: 'https://a/2' }];
  assert.equal(t.guardar(g, item, ofertas, 24, ctx), 1);
  assert.equal(t.guardar(g, item, ofertas, 24, ctx), 0);
  assert.deepEqual(json(g['CB17|https://a/1']), {
    id_item: 'CB17', categoria: 'cozinha_bar', fonte: 'amazon', produto: 'Copo long drink caixa com 24',
    preco: 5, frete: 1, preco_anuncio: 120, unidades: 24, tipo_preco: 'padrao', preco_sem_pix: null, cep: '', avaliacoes: null, leitor: '', url: 'https://a/1', busca: 'b', data_coleta: '2026-11-02', motivo: '', excluida: 0, alterado_em: 1000,
  });
  // unidades da oferta valem sobre as do painel; preço sem Pix e motivo vão por unidade e como vieram
  t.guardar(g, item, [{ produto: 'Copo caixa com 12', preco: 60, frete: null, preco_sem_pix: 63, unidades: 12, motivo: 'sem avaliações', url: 'https://a/3' }], 24, ctx);
  assert.deepEqual(json([g['CB17|https://a/3'].preco, g['CB17|https://a/3'].preco_sem_pix, g['CB17|https://a/3'].unidades, g['CB17|https://a/3'].motivo]), [5, 5.25, 12, 'sem avaliações']);
});

test('excluir: some das ativas e do resumo, e volta se guardada de novo', () => {
  const g = {};
  const item = { id: 'MO03', categoria: 'mobiliario' };
  const ctx = { fonte: 'leroymerlin', busca: 'b', data_coleta: '2026-11-02', cep: '40170-110' };
  const of = [100, 200, 300].map((p, i) => ({ produto: `Cadeira ${i}`, preco: p, frete: i === 0 ? null : 10, url: `https://l/${i}`, tipo_preco: i === 2 ? 'pix' : 'padrao' }));
  t.guardar(g, item, of, 1, ctx);
  assert.deepEqual(json(t.resumoItem(g, 'MO03', '2026-12-10')), {
    n: 3, sites: 1, mediana: 210, min: 100, max: 310, p25: 155, p75: 260, dispersao: 1.68,
    semFrete: 1, pixCupom: 1, leitores: [], maisAntiga: '2026-11-02', idade: 38,
  });
  assert.ok(t.excluir(g, 'MO03|https://l/1'));
  assert.equal(t.ativas(g).length, 2);
  assert.equal(t.resumoItem(g, 'MO03').mediana, 205);
  assert.equal(t.guardar(g, item, [of[1]], 1, ctx), 1);
  assert.equal(g['MO03|https://l/1'].excluida, 0);
});

test('uma oferta por URL: patrocinado repetido dá lugar à versão normal, na posição dela', () => {
  const d = carregar(`<html><body>${['B1', 'B2', 'B1'].map((asin, i) => `<div data-component-type="s-search-result" data-asin="${asin}" class="${i === 0 ? 'AdHolder' : ''}"><h2>Fogão Industrial ${asin}</h2><span class="a-price"><span class="a-offscreen">R$ 1.000,00</span></span></div>`).join('')}</body></html>`);
  const { ofertas, cards } = d.lerOfertas('amazon');
  assert.equal(cards, 3);
  assert.deepEqual(json(ofertas.map((o) => [o.url.slice(-2), o.patrocinado])), [['B2', false], ['B1', false]]);
});

test('somar ofertas sem repetir URL', () => {
  const a = [{ url: 'u1' }, { url: 'u2' }];
  assert.deepEqual(json(t.somarOfertas(a, [{ url: 'u2' }, { url: 'u3' }, { url: 'u3' }]).map((o) => o.url)), ['u1', 'u2', 'u3']);
});

test('CSV: cabeçalho que o build lê, vírgula decimal e nome por categoria', () => {
  // linha antiga, sem tipo_preco, cep e excluida: sai com vazios e excluida = 0
  const s = t.csv([{ id_item: 'MO03', categoria: 'mobiliario', fonte: 'leroymerlin', produto: 'Cadeira; estofada', preco: 250.5, frete: null, preco_anuncio: 250.5, unidades: 1, url: 'u', busca: 'b', data_coleta: 'd' }]);
  const [cab, linha] = s.replace(/^﻿/, '').split('\r\n');
  assert.equal(cab, 'id_item;categoria;fonte;produto;preco;frete;preco_anuncio;unidades;tipo_preco;preco_sem_pix;cep;avaliacoes;leitor;url;busca;data_coleta;motivo;excluida');
  assert.equal(linha, 'MO03;mobiliario;leroymerlin;"Cadeira; estofada";250,5;;250,5;1;;;;;;u;b;d;;0');
  assert.equal(t.nomeArquivo('mobiliario', '2026-11-02', '1405'), '2026-11-02_1405_mobiliario_precos.csv');
});

test('F3: medida conflitante pela grandeza do termo', () => {
  const termo = 'ar condicionado split 30000 btus inverter';
  assert.equal(t.medidaConflita('Ar Condicionado Split 12.000 BTUs Inverter', termo), '12000 btu, termo 30000 btu');
  assert.equal(t.medidaConflita('Ar Condicionado Split 30.000 BTUs', termo), '');
  assert.equal(t.medidaConflita('Ar Condicionado Split Inverter', termo), ''); // sem a grandeza, não conflita
  assert.equal(t.medidaConflita('Fogão Industrial 6 Bocas com Forno', 'fogao industrial 4 bocas com forno'), '6 boca, termo 4 boca');
  assert.equal(t.medidaConflita('Freezer Horizontal 2 Tampas 513L', 'freezer horizontal 2 tampas 400 litros'), '513 l, termo 400 l');
  assert.equal(t.medidaConflita('Mesa Retangular 90 x 160 cm', 'mesa retangular 160x90 restaurante'), ''); // ordem não importa
  assert.equal(t.medidaConflita('Mesa Retangular 120x80', 'mesa retangular 160x90 restaurante'), '80x120, termo 90x160');
  assert.equal(t.medidaConflita('Mesa Inox 150cm X 70cm X 90cm', 'mesa inox 150 cm cozinha industrial'), '');
});

test('F3: decimal com vírgula, folga, metros e dimensões contra comprimento', () => {
  assert.deepEqual(json(t.palavras('Liquidificador 2,4L, Inox.')), ['liquidificador', '2.4', 'l', 'inox']);
  assert.equal(t.medidaConflita('Liquidificador Industrial Jarra de 2,4L', 'liquidificador industrial 4 litros'), '2,4 l, termo 4 l');
  assert.equal(t.medidaConflita('Fritadeira Elétrica 3,5 Litros', 'fritadeira 5 litros'), '3,5 l, termo 5 l');
  assert.equal(t.medidaConflita('Freezer Horizontal 2 Tampas 410 Litros', 'freezer horizontal 2 tampas 400 litros'), ''); // folga de 10%
  assert.equal(t.medidaConflita('Ar Split 32000 BTUs', 'ar condicionado split 30000 btus inverter'), '');
  assert.equal(t.medidaConflita('Coifa Industrial 1,5 m Inox', 'coifa industrial inox 150 cm'), '');
  assert.equal(t.medidaConflita('Chapa Bifeteira Lisa 25x25', 'chapa bifeteira industrial gas 70cm'), '25 cm, termo 70 cm');
  assert.equal(t.medidaConflita('Mesa Inox Profissional 92x53x84cm', 'mesa inox 150 cm cozinha industrial'), '53/84/92 cm, termo 150 cm');
  assert.equal(t.medidaConflita('Mesa Restaurante 160 x 90 cm', 'mesa retangular restaurante 160x80'), ''); // 90 está a 12,5% de 80
  assert.equal(t.medidaConflita('Impressora Térmica 58/80mm USB', 'impressora termica nao fiscal 80mm'), '');
});

test('regras do item: palavras exigidas (com alternativas) e excluídas (palavra inteira)', () => {
  const r = { exige: ['wi fi 6/wifi 6/ax'], exclui: ['repetidor', 'capa'] };
  assert.deepEqual(json(t.motivosRegras('Roteador Wi-Fi 6 AX1500', r)), []);
  assert.deepEqual(json(t.motivosRegras('Roteador AC1200 Dual Band', r)), ['falta: wi fi 6/wifi 6/ax']);
  assert.deepEqual(json(t.motivosRegras('Mercusys ME60X Repetidor de Sinal Wi-Fi 6', r)), ['excluída: repetidor']);
  assert.deepEqual(json(t.motivosRegras('Roteador WiFi 6 com capacidade para 60 dispositivos', r)), []); // "capa" não casa com "capacidade"
  assert.deepEqual(json(t.motivosRegras('Fritadeira Elétrica 2 Cubas', { exige: ['fritadeira', '2 cuba/dupla'] })), []);
  assert.deepEqual(json(t.motivosRegras('Fritadeira Elétrica Cuba 3L', { exige: ['fritadeira', '2 cuba/dupla'] })), ['falta: 2 cuba/dupla']);
  assert.deepEqual(json(t.motivosRegras('Ar Condicionado Split on/off', { exclui: ['on off'] })), ['excluída: on off']);
  const item = t.ITENS.find((i) => i.id === 'EQ04');
  assert.deepEqual(json(t.motivosOferta({ produto: 'Roteador TP-Link Archer C50 AC1200 Dual Band', preco: 199, avaliacoes: 9 }, item.termo, { regras: item })), ['falta: wi fi 6/wifi 6/ax']);
});

test('kits, combos e variantes de cor ou voltagem', () => {
  const imp = 'impressora termica nao fiscal 80mm';
  assert.deepEqual(json(t.kitDe('Impressora térmica Elgin i8 + 30 Bobina de Cupom 80x40', imp)), { combo: 'bobina' });
  assert.deepEqual(json(t.kitDe('Impressora Térmica SI-180M 80mm — Kit com 2 Bobinas', imp)), { combo: 'bobinas' });
  assert.deepEqual(json(t.kitDe('Impressora de recibos USB + LAN de 80 mm', imp)), {});
  assert.deepEqual(json(t.kitDe('Copo Long Drink 300ml Caixa com 24', 'copo long drink vidro 300 ml caixa 24')), { unidades: 24 });
  assert.deepEqual(json(t.kitDe('Mercusys Halo H80X (2 un.) Roteador Mesh', 'roteador wifi 6 dual band')), { unidades: 2 });
  assert.deepEqual(json(t.kitDe('Kit 4 Cadeiras Estofadas', 'cadeira restaurante estofada')), { unidades: 4 });
  assert.deepEqual(json(t.kitDe('Jogo 6 Pratos Rasos Porcelana', 'prato raso porcelana branco 26 cm kit 12')), { unidades: 6 });
  assert.deepEqual(json(t.kitDe('Kit 4 Câmeras Full HD DVR 4 Canais', 'kit cftv 4 cameras full hd dvr 4 canais')), {});
  assert.deepEqual(json(t.kitDe('Fogão Industrial 4 Bocas com Forno', 'fogao industrial 4 bocas com forno')), {});
  assert.deepEqual(json(t.motivosOferta({ produto: 'Impressora Térmica 80mm + Leitor Código Barras', preco: 437 }, imp)), ['combo: + leitor']);
  const cores = ['Azul', 'Branco', 'Cinza'].map((c, i) => ({ produto: `Fogão Industrial com Forno 2 Bocas Duplas Bravo ${c} - Venâncio`, preco: 1460.36, url: `u${i}` }));
  const v = t.marcarVariantes([...cores, { produto: 'Frigobar HQ 130 Litros (127V)', preco: 1489, url: 'f1' }, { produto: 'Frigobar HQ 130 Litros (220v)', preco: 1489, url: 'f2' }, { produto: 'Frigobar HQ 130 Litros (220v)', preco: 1600, url: 'f3' }]);
  assert.deepEqual(json(v.map((o) => Boolean(o.varianteDe))), [false, true, true, false, true, false]);
  assert.match(t.motivosOferta(v[1], 'fogao industrial 4 bocas com forno').join(), /variante de: Fogão Industrial com Forno 2 Bocas/);
});

test('revisar guardadas: regras, medida e variantes, sem a faixa de preço', () => {
  const g = {};
  const ctx = { fonte: 'amazon', busca: 'b', data_coleta: '2026-11-02', agora: 1 };
  t.guardar(g, { id: 'OB40', categoria: 'obra_reforma' }, [
    { produto: 'Ar Condicionado Split Inverter 30.000 BTUs Frio', preco: 4800, url: 'a1', avaliacoes: 5 },
    { produto: 'Ar Condicionado Split Inverter 9000 BTUs Frio', preco: 1700, url: 'a2', avaliacoes: 5 },
    { produto: 'Ar Condicionado Split Inverter 30.000 BTUs Frio Branco', preco: 4800, url: 'a3', avaliacoes: 5 },
    { produto: 'Ar Condicionado Split Inverter 30.000 BTUs Barato', preco: 900, url: 'a4', avaliacoes: 5 },
  ], 1, ctx);
  t.guardar(g, { id: 'EQ04', categoria: 'equipamentos' }, [{ produto: 'Repetidor Wi-Fi 6 AX1500', preco: 224, url: 'r1', avaliacoes: 9 }], 1, ctx);
  const fora = t.revisarGuardadas(g, {});
  assert.deepEqual(json(fora.map((f) => [f.k, f.motivos[0].split(':')[0]])), [['OB40|a2', 'medida'], ['OB40|a3', 'variante de'], ['EQ04|r1', 'termo']]);
  assert.ok(fora[2].motivos.includes('excluída: repetidor'));
  t.excluir(g, 'OB40|a2');
  assert.equal(t.revisarGuardadas(g, {}).length, 2);
});

test('motivos da marcação: patrocinado, termo, faixa (F2), medida (F3) e avaliações (F5)', () => {
  const termo = 'fogao industrial 4 bocas com forno';
  const o = { produto: 'Fogão Industrial 4 Bocas com Forno', preco: 1000, frete: 100, patrocinado: false, avaliacoes: 12 };
  assert.deepEqual(json(t.motivosOferta(o, termo, { mediana: 1000 })), []);
  assert.deepEqual(json(t.motivosOferta({ ...o, preco: 200, frete: 0 }, termo, { mediana: 1000 })), ['faixa: 0,2× a mediana']);
  assert.deepEqual(json(t.motivosOferta({ ...o, preco: 200, frete: 0 }, termo, { mediana: 1000, filtros: { faixa: false } })), []);
  assert.deepEqual(json(t.motivosOferta(o, termo, { mediana: 100, unidades: 4 })), []); // 1100 ÷ 4 = 275, 2,75× a mediana
  assert.deepEqual(json(t.motivosOferta(o, termo, {})), []); // sem guardadas, sem faixa
  assert.deepEqual(json(t.motivosOferta({ ...o, produto: 'Fogão Industrial 6 Bocas com Forno' }, termo)), ['medida: 6 boca, termo 4 boca']);
  assert.deepEqual(json(t.motivosOferta({ ...o, avaliacoes: 0 }, termo)), ['sem avaliações']);
  assert.deepEqual(json(t.motivosOferta({ ...o, avaliacoes: null }, termo)), []); // site sem contagem
  assert.deepEqual(json(t.motivosOferta({ ...o, patrocinado: true, produto: 'Panela de pressão' }, termo)), ['patrocinado', 'termo']);
});

test('A1: funil da leitura', () => {
  const termo = 'fogao industrial 4 bocas com forno';
  const base = { produto: 'Fogão Industrial 4 Bocas com Forno', preco: 1000, frete: 0, avaliacoes: 5 };
  const ofertas = [base, { ...base, patrocinado: true }, { ...base, produto: 'Panela' }, { ...base, avaliacoes: 0 }];
  assert.deepEqual(json(t.funil(ofertas, 6, termo, {})), { cards: 6, comPreco: 4, semPatrocinado: 3, noTermo: 2, nosFiltros: 1 });
});

test('quantil como o pandas, pendências do CSV (A8) e cobertura da categoria (A2)', () => {
  assert.equal(t.quantil([100, 200, 300, 400], 0.25), 175);
  assert.equal(t.quantil([5], 0.75), 5);
  assert.equal(t.quantil([], 0.5), null);
  const g = {};
  const ctx = (agora) => ({ fonte: 'amazon', busca: 'b', data_coleta: '2026-11-02', agora });
  t.guardar(g, { id: 'EQ01', categoria: 'equipamentos' }, [1, 2, 3].map((i) => ({ produto: `Notebook ${i}`, preco: 3000, url: `https://n/${i}` })), 1, ctx(100));
  t.guardar(g, { id: 'EQ02', categoria: 'equipamentos' }, [{ produto: 'Impressora', preco: 500, url: 'https://i/1' }], 1, ctx(300));
  assert.equal(t.pendentes(g, 0), 4);
  assert.equal(t.pendentes(g, 200), 1);
  t.excluir(g, 'EQ01|https://n/1', 400);
  assert.equal(t.pendentes(g, 350), 1);
  assert.deepEqual(json(t.coberturaCategoria(g, 'equipamentos')), { itens: 6, completos: 0, comPreco: 2 });
  t.guardar(g, { id: 'EQ01', categoria: 'equipamentos' }, [{ produto: 'Notebook 4', preco: 3100, url: 'https://n/4' }], 1, ctx(500));
  assert.deepEqual(json(t.coberturaCategoria(g, 'equipamentos')), { itens: 6, completos: 1, comPreco: 2 });
});

// ---------- leitura do DOM, com trechos das páginas em outros/fixtures_html/ ----------

test('DOM Amazon: cards, patrocinado, frete, Pix e CEP do cabeçalho', () => {
  const href = 'https://www.amazon.com.br/s?k=mesa+inox+150+cm+cozinha+industrial';
  const d = carregar(fixture('amazon_busca.html'), href);
  const { ofertas, cards, leitor } = d.lerOfertas('amazon');
  assert.equal(cards, 3);
  assert.equal(leitor, 'proprio');
  assert.deepEqual(json(ofertas.map((o) => o.avaliacoes)), [0, 0, 4]);
  assert.deepEqual(json(ofertas.map((o) => [o.url, o.preco, o.frete, o.patrocinado, o.tipo_preco])), [
    ['https://www.amazon.com.br/dp/B0H7JPXYP7', 246.05, 0, true, 'pix'],
    ['https://www.amazon.com.br/dp/B0DK7V4QHY', 1234.9, 175, false, 'pix'],
    ['https://www.amazon.com.br/dp/B0GWFG3BQ2', 402.2, 0, false, 'pix'],
  ]);
  assert.deepEqual(json(ofertas.map((o) => o.preco_sem_pix)), [259, 1299.9, 423.37]); // preço cinza do card de Pix
  assert.equal(ofertas[1].produto, 'Mesa Inox Nortinox 150cm X 70cm X 90cm');
  assert.equal(ofertas[1].busca, href);
  assert.ok(d.relevancia(ofertas[1].produto, 'mesa inox 150 cm cozinha industrial') >= 0.5);
  assert.equal(d.cepDoSite(), '40170-110');
});

test('DOM Leroy Merlin: leitura genérica, sem carrinho, preço "cada" e Pix', () => {
  const d = carregar(fixture('leroymerlin_busca.html'), 'https://www.leroymerlin.com.br/search?term=cadeira%20restaurante%20estofada');
  const { ofertas, leitor } = d.lerOfertas('leroymerlin');
  assert.equal(leitor, 'generico');
  assert.deepEqual(json(ofertas.map((o) => [o.url.split('/').pop(), o.preco, o.tipo_preco])), [
    ['cadeira-para-sala-de-jantar-estofada-em-madeira-macica-diamante-natural-e-bege-marrom-natural--bege_1572138451', 427.48, 'pix'],
    ['cadeira-de-jantar-lana-em-madeira-macica-estofada-bege_1570346963', 414.9, 'padrao'],
  ]);
  assert.equal(ofertas[1].produto, 'Cadeira de Jantar Lana em Madeira Maciça Estofada Bege');
});

test('DOM Mercado Livre (sintético): preço atual, centavos, frete e URL sem parâmetros', () => {
  const d = carregar(fixture('mercadolivre_busca_sintetico.html'), 'https://lista.mercadolivre.com.br/fogao-industrial-4-bocas-com-forno');
  const { ofertas } = d.lerOfertas('mercadolivre');
  assert.deepEqual(json(ofertas.map((o) => [o.url, o.preco, o.frete, o.patrocinado, o.tipo_preco])), [
    ['https://produto.mercadolivre.com.br/MLB-1111111111-fogao-industrial-4-bocas-com-forno-_JM', 1289.9, 0, true, 'padrao'],
    ['https://www.mercadolivre.com.br/fogao-industrial-4-bocas-40-com-forno/p/MLB22222222', 1750, 89.9, false, 'pix'],
  ]);
  assert.equal(d.cepDoSite(), '41820-020');
});

test('painel: ler, guardar, excluir e aviso de troca de página (fixture da Amazon)', () => {
  const { document, window } = parseHTML(fixture('amazon_busca.html'));
  // linkedom não tem setter de select.value
  Object.defineProperty(window.HTMLSelectElement.prototype, 'value', { get() { return this._v ?? this.querySelector('option')?.value; }, set(v) { this._v = v; }, configurable: true });
  const memoria = {};
  let tique;
  const ambiente = {
    URL, Blob, document, console: { info() {}, error: (...a) => { throw a[1]; } },
    location: { href: 'https://www.amazon.com.br/s?k=mesa+inox', hostname: 'www.amazon.com.br' },
    GM_getValue: (k, d) => (k in memoria ? memoria[k] : d), GM_setValue: (k, v) => { memoria[k] = v; }, GM_deleteValue: (k) => { delete memoria[k]; },
    setInterval: (f) => { tique = f; }, setTimeout() {}, confirm: () => true,
  };
  vm.runInNewContext(source, ambiente, { filename: 'precos_itens.user.js' });
  tique();
  const r = document.getElementById('cpi-hospedeiro').shadowRoot;
  const botao = (t) => [...r.querySelectorAll('button')].find((b) => b.textContent === t);
  const textos = () => [...r.querySelectorAll('p')].map((p) => p.textContent).join(' | ');
  // Ao abrir, a página é lida sozinha quando as ofertas param de mudar: Guardar já fica liberado
  assert.equal(botao('Guardar marcadas').disabled, true);
  tique();
  tique();
  assert.match(r.querySelector('.status').textContent, /^Ofertas lidas sozinhas\. 3 ofertas com preço/);
  assert.equal(botao('Guardar marcadas').disabled, false);
  const select = r.querySelector('select');
  select.value = 'CB09';
  select.onchange();
  assert.match(r.querySelector('.status').textContent, /^Item trocado: página relida com as regras dele\. 3 ofertas/);
  botao('Ler ofertas').onclick();
  assert.match(r.querySelector('.status').textContent, /^3 ofertas com preço de 3 cards lidos, 0 marcadas/);
  assert.match(textos(), /Funil: 3 cards → 3 com preço → 2 sem patrocinado → 2 no termo → 0 nos filtros · leitor próprio do site/);
  const caixas = [...r.querySelectorAll('ul')[1].querySelectorAll('input[type=checkbox]')];
  assert.match(caixas[1].parentElement.textContent, /desmarcada: sem avaliações/);
  caixas[1].checked = true; // o autor confere e marca a Nortinox
  botao('Só preço padrão').onclick(); // todas são Pix na Amazon
  assert.match(caixas[2].parentElement.textContent, /desmarcada: medida: 53\/84\/92 cm, termo 150 cm/);
  assert.match(caixas[1].parentElement.textContent, /\(sem Pix R\$ 1299,90\)/);
  assert.match(r.querySelector('.status').textContent, /^1 oferta\(s\) de Pix ou cupom desmarcadas; 0 marcadas/);
  caixas[1].checked = true;
  caixas[2].checked = true;
  assert.match(textos(), /Nada guardado ainda/);
  botao('Guardar marcadas').onclick();
  assert.match(r.querySelector('.status').textContent, /2 fora dos filtros: vão com motivo e o build as deixa de fora/);
  assert.deepEqual(json(Object.values(JSON.parse(memoria.tcc_precos_v1)).map((l) => l.motivo).sort()), ['medida: 53/84/92 cm, termo 150 cm', 'sem avaliações']);
  assert.match(textos(), /2 oferta\(s\) guardadas ou excluídas desde o último CSV \(nenhum baixado ainda\)/);
  assert.match(textos(), /Categoria cozinha_bar: 0 de 20 itens com 3\+ ofertas \(1 com alguma\)/);
  assert.match(textos(), /P25 R\$ 654,13, P75 R\$ 1157,98 \(1,77×\) · 2 no Pix ou cupom · leitor próprio do site · desde \d{4}-\d{2}-\d{2} · ⚠ faltam 1/);
  assert.match(textos(), /CEP no site: 40170-110 \(Salvador\)/);
  assert.match(textos(), /Este item: 2 ofertas de 1 site\(s\) · mediana R\$ 906,05 \(R\$ 402,20 a R\$ 1409,90/);
  r.querySelector('button.x').onclick();
  assert.match(textos(), /Este item: 1 ofertas/);
  assert.equal(Object.values(JSON.parse(memoria.tcc_precos_v1)).filter((l) => l.excluida).length, 1);
  // Próxima página sem recarregar (como a Amazon faz): a URL muda e os cards trocam depois
  ambiente.location.href = 'https://www.amazon.com.br/s?k=mesa+inox&page=2';
  tique(); // vê a URL nova
  tique(); // 1ª leitura da página nova (ainda igual à antiga)
  tique(); // 2ª leitura igual à lida: nada a reler
  assert.equal(r.querySelectorAll('ul')[1].querySelectorAll('li').length, 3);
  ambiente.location.href = 'https://www.amazon.com.br/s?k=mesa+inox&page=3';
  tique();
  document.querySelector('[data-asin="B0DK7V4QHY"]').remove(); // o site troca os cards
  tique();
  tique();
  assert.match(r.querySelector('.status').textContent, /^A página mudou: lista relida\. 2 ofertas com preço de 2 cards/);
  assert.equal(r.querySelectorAll('ul')[1].querySelectorAll('li').length, 2);
});
