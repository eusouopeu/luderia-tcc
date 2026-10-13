// ==UserScript==
// @name         Coletor de avaliações do Google Maps (TCC Luderia)
// @namespace    tcc-luderia
// @version      2026.10.13-1
// @description  Abre as avaliações de um lugar, ordena por mais recentes, rola até o fim do período escolhido, expande os textos (no idioma original), filtra por tema, opinião e componentes e exporta CSV com autor pseudonimizado.
// @match        https://www.google.com/maps/*
// @match        https://www.google.com.br/maps/*
// @run-at       document-idle
// @noframes
// @grant        GM_getValue
// @grant        GM_setValue
// ==/UserScript==

/*
 * Uso pessoal, para o Bloco B2: completar estabelecimentos em que a coleta
 * automática falhou. O recorte do método (_instrucoes/4_metodologia.md) é o
 * período padrão "de agora até 1 mês": todas as avaliações COM TEXTO cujo rótulo
 * de data seja de até "um mês atrás", inclusive, na data da coleta.
 *
 * Período "de… até…": serve também para retomar uma coleta interrompida (queda
 * de internet, pausa). Ex.: "de 1 mês até 3 meses" marca como no período só as
 * avaliações dessa janela; "Localizar período" rola a lista até a primeira delas.
 *
 * Passos do botão "Coletar avaliações":
 *  1. abre a aba "Avaliações";
 *  2. ordena por "Mais recentes" (se falhar, ordene à mão, marque "Já ordenei" e
 *     clique de novo) e confere se a lista está mesmo em ordem de data;
 *  3. rola a lista até passar do fim do período (5 avaliações seguidas mais
 *     antigas que o "até"), até carregar o volume total ou até parar de crescer;
 *  4. clica em todos os "Mais" e "Ver original" e lê as avaliações.
 *
 * Filtros (tema, opinião, componentes) e período valem para o CSV "dos filtros"
 * e para esmaecer na página as avaliações que ficam de fora. São regras de
 * palavras-chave para achar comentários, não a codificação do método (Bardin).
 *  - Tema: qualquer um dos marcados aparece no texto.
 *  - Opinião positiva: nota 5 E palavra positiva (ou negação de negativa, como
 *    "não foi caro"). Negativa: nota 4 ou menos E palavra negativa (ou negação
 *    de positiva, como "não foi bom"). A negação vale para até 3 palavras antes,
 *    dentro da mesma oração.
 *  - Componentes: todos os marcados presentes.
 *
 * Pseudonimização na coleta: o nome do autor não sai do navegador. O CSV traz um
 * código (SHA-256 do id de colaborador do Google + um sal, 12 caracteres). O sal
 * fica no armazenamento do Tampermonkey, igual em google.com e google.com.br, e
 * pode ser copiado e importado no painel. Sem o mesmo sal, o mesmo autor recebe
 * códigos diferentes. "origem_pseudonimo" diz se o código veio do id (contrib)
 * ou, na falta dele, do nome exibido (nome; homônimos colidem).
 *
 * Idade em dias: limite inferior do rótulo (semana = 7, mês = 30, ano = 365).
 * "data_min" e "data_max" dão a faixa coberta pelo rótulo ("um mês atrás" vai de
 * 30 a 59 dias). "Editado há…" conta pela data da edição, que é o que o Google
 * mostra; a coluna "editada" marca esses casos.
 *
 * Na "visualização limitada" do Maps (sem login), só aparecem 3 avaliações:
 * use logado.
 */

(function () {
  'use strict';

  const VERSAO = (typeof GM_info !== 'undefined' && GM_info.script?.version) || '?';
  const CHAVE_SAL = 'tcc-avaliacoes-sal';

  // ---------- utilidades ----------

  const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
  const sortear = ([a, b]) => a + Math.random() * (b - a);
  const semAcento = (t) => String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const p2 = (n) => String(n).padStart(2, '0');
  const dataLocal = (d) => `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`;

  function agora() {
    const d = new Date();
    return `${dataLocal(d)} ${p2(d.getHours())}:${p2(d.getMinutes())}`;
  }

  function diasAtras(n) {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return dataLocal(d);
  }

  function novoSal() {
    return [...crypto.getRandomValues(new Uint8Array(16))].map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  // Sal no armazenamento do Tampermonkey (comum aos dois domínios). Na primeira
  // execução desta versão, aproveita o sal antigo do localStorage, se houver.
  function sal() {
    let s = GM_getValue(CHAVE_SAL, '');
    if (!s) {
      try { s = localStorage.getItem(CHAVE_SAL) || ''; } catch (_) { s = ''; }
      if (!s) s = novoSal();
      GM_setValue(CHAVE_SAL, s);
    }
    return s;
  }

  async function pseudonimo(texto) {
    const dados = new TextEncoder().encode(`${sal()}|${texto}`);
    const h = await crypto.subtle.digest('SHA-256', dados);
    return [...new Uint8Array(h)].map((b) => b.toString(16).padStart(2, '0')).join('').slice(0, 12);
  }

  // ---------- análise de texto ----------

  // Faixa de dias coberta pelo rótulo: "há 3 dias" [3, 3]; "uma semana atrás" [7, 13];
  // "um mês atrás" [30, 59]; "2 anos atrás" [730, 1094]; "Editado há 2 meses" [60, 89].
  function faixaDias(rotulo) {
    const t = semAcento(rotulo);
    if (/\b(minutos?|horas?|minutes?|hours?|agora|just now)\b/.test(t)) return [0, 1];
    const m = t.match(/\b(\d+|um|uma|a|an)\s+(dias?|days?|semanas?|weeks?|mes|meses|months?|anos?|years?)\b/);
    if (!m) return null;
    const n = /^\d+$/.test(m[1]) ? +m[1] : 1;
    const u = m[2];
    if (/^(dia|day)/.test(u)) return [n, n];
    if (/^(semana|week)/.test(u)) return [7 * n, 7 * n + 6];
    if (/^(mes|month)/.test(u)) return [30 * n, 30 * n + 29];
    return [365 * n, 365 * n + 364];
  }

  const idadeDias = (rotulo) => faixaDias(rotulo)?.[0] ?? null;

  // Listas de palavras (sem acento, minúsculas). Termo com "*" vale como prefixo.
  const TEMAS = {
    comida: ['comida*', 'comer', 'comi', 'comemos', 'prato*', 'petisco*', 'porcao', 'porcoes', 'lanche*', 'hamburg*', 'burger*',
      'pizza*', 'batata*', 'fritas', 'drink*', 'drinque*', 'cerveja*', 'chopp*', 'chope*', 'bebida*', 'cardapio*', 'sobremesa*',
      'doce*', 'salgado*', 'sanduiche*', 'pastel*', 'pasteis', 'refeic*', 'sabor*', 'saboros*', 'gostos*', 'delicios*', 'tempero*',
      'cozinha*', 'suco*', 'refrigerante*', 'acai', 'coxinha*', 'nachos', 'tabua*', 'cafe', 'cafes', 'milkshake*', 'food',
      'drinks', 'beer*', 'menu', 'tasty', 'delicious'],
    servico: ['atendimento*', 'atend*', 'garcom', 'garcons', 'garconete*', 'funcionari*', 'equipe*', 'staff', 'monitor*',
      'servico*', 'demor*', 'pedido*', 'simpatic*', 'atencios*', 'educad*', 'grosseir*', 'recepc*', 'dono*', 'dona', 'gerente*',
      'mediador*', 'service', 'waiter*', 'friendly', 'rude'],
    acervo: ['acervo*', 'jogo*', 'tabuleiro*', 'boardgame*', 'catan', 'dixit', 'carta*', 'partida*', 'ludoteca*', 'colec*',
      'titulo*', 'game*', 'rpg', 'videogame*', 'fliperama*', 'console*', 'xbox', 'playstation', 'ps5', 'nintendo'],
    preco: ['preco*', 'caro', 'caros', 'carissim*', 'barat*', 'valor*', 'couvert*', 'entrada', 'taxa*', 'custo*', 'pagar', 'paguei',
      'pagamos', 'pago', 'cobr*', 'reais', 'price*', 'expensive', 'cheap'],
    ambiente: ['ambiente*', 'espaco*', 'decorac*', 'decorad*', 'aconcheg*', 'limp*', 'suj*', 'banheiro*', 'climatiz*',
      'barulh*', 'musica*', 'cadeira*', 'apertad*', 'lotad*', 'calor', 'abafad*', 'iluminac*', 'confortave*', 'atmosphere',
      'cozy', 'noisy'],
  };
  const TEMAS_EXPRESSOES = { ambiente: [/ar condicionado/], acervo: [/board ?games?/], preco: [/r\$\s*\d/, /custo.beneficio/] };
  const ROTULO_TEMA = { comida: 'comida e bebida', servico: 'serviço', acervo: 'acervo', preco: 'preço', ambiente: 'ambiente' };

  const POSITIVAS = ['bom', 'boa', 'bons', 'boas', 'otim*', 'excelen*', 'maravilh*', 'incrive*', 'adore*', 'adoramos', 'amei',
    'amo', 'amamos', 'gostei', 'gostamos', 'gostou', 'recomend*', 'perfeit*', 'top', 'sensaciona*', 'delicios*', 'gostos*',
    'saboros*', 'atencios*', 'simpatic*', 'educad*', 'agradave*', 'aconcheg*', 'limp*', 'divertid*', 'barat*', 'justo', 'justos',
    'rapid*', 'voltar', 'voltarei', 'voltaremos', 'volto', 'voltaria', 'lind*', 'espetacula*', 'show', 'fantastic*', 'melhor',
    'melhores', 'impecave*', 'nota10', 'acolhed*', 'confortave*', 'great', 'good', 'excellent', 'amazing', 'love', 'loved',
    'recommend*', 'delicious', 'friendly', 'nice', 'cheap', 'clean', 'fun', 'awesome', 'perfect', 'best'];
  const NEGATIVAS = ['ruim', 'ruins', 'pessim*', 'horrive*', 'horroros*', 'caro', 'caros', 'carissim*', 'demor*', 'lent*',
    'suj*', 'barulh*', 'mal', 'grosse*', 'rude*', 'decepc*', 'decepcion*', 'fraco', 'fraca', 'fracos', 'fracas', 'nojent*',
    'insoss*', 'abafad*', 'lotad*', 'apertad*', 'desorganiz*', 'despreparad*', 'problema*', 'reclam*', 'infelizmente',
    'desagradave*', 'queimad*', 'errad*', 'esquec*', 'descaso', 'ignor*', 'pior', 'piores', 'absurd*', 'desrespeit*', 'frustr*',
    'bad', 'terrible', 'awful', 'worst', 'dirty', 'expensive', 'slow', 'noisy', 'disappoint*', 'overpriced'];
  const NEGATIVAS_EXPRESSOES = [/deix\w* a desejar/g, /nunca mais/g];
  const NEGADORES = new Set(['nao', 'nem', 'nunca', 'nenhum', 'nenhuma', 'nada', 'sem', 'jamais', 'not', 'no', 'never',
    'without', 'nothing', 'isnt', 'wasnt', 'dont', 'didnt']);
  // Expressões com negador que não negam o que vem depois.
  const FALSAS_NEGACOES = /\b(sem duvidas?|nao so|nao somente|nao apenas|nada mais nada menos|not only)\b/g;

  function casaLista(token, lista) {
    for (const termo of lista) {
      if (termo.endsWith('*') ? token.startsWith(termo.slice(0, -1)) : token === termo) return true;
    }
    return false;
  }

  function oracoes(texto) {
    return semAcento(texto).replace(/[’']/g, '').replace(FALSAS_NEGACOES, ' ')
      .split(/[.,;:!?\n()]+|\s(?:mas|porem|entretanto|contudo|but|however)\s/)
      .map((o) => o.split(/[^a-z0-9$]+/).filter(Boolean));
  }

  function temas(texto) {
    if (!texto) return [];
    const t = semAcento(texto);
    const tokens = t.split(/[^a-z0-9$]+/).filter(Boolean);
    return Object.keys(TEMAS).filter((k) => tokens.some((tk) => casaLista(tk, TEMAS[k]))
      || (TEMAS_EXPRESSOES[k] || []).some((re) => re.test(t)));
  }

  // Pontos positivos e negativos, com a negação invertendo o sinal.
  function polaridade(texto) {
    let pos = 0, neg = 0;
    if (!texto) return { pos, neg };
    for (const tokens of oracoes(texto)) {
      tokens.forEach((tk, i) => {
        const p = casaLista(tk, POSITIVAS), n = casaLista(tk, NEGATIVAS);
        if (!p && !n) return;
        const negado = tokens.slice(Math.max(0, i - 3), i).some((x) => NEGADORES.has(x));
        if (p) { if (negado) neg++; else pos++; }
        if (n) { if (negado) pos++; else neg++; }
      });
    }
    const t = semAcento(texto);
    for (const re of NEGATIVAS_EXPRESSOES) neg += (t.match(re) || []).length;
    return { pos, neg };
  }

  function opiniao(nota, texto) {
    const n = +nota;
    if (!n) return '';
    const { pos, neg } = polaridade(texto);
    if (n === 5 && pos > 0) return 'positiva';
    if (n <= 4 && neg > 0) return 'negativa';
    return '';
  }

  // Notas por aspecto ("Comida: 5/5", "Serviço 4", "Ambiente: 5") e preço por pessoa.
  function notasPorAspecto(texto) {
    const t = semAcento(texto);
    const achados = [];
    for (const [rotulo, re] of [['comida', /\b(comida|food)\s*:?\s*([1-5])\b/], ['serviço', /\b(servico|service)\s*:?\s*([1-5])\b/],
      ['ambiente', /\b(ambiente|atmosphere)\s*:?\s*([1-5])\b/]]) {
      const m = t.match(re);
      if (m) achados.push(`${rotulo} ${m[2]}`);
    }
    return achados.join('; ');
  }

  function precoPorPessoa(texto) {
    const m = String(texto || '').match(/(?:pre[çc]o por pessoa|price per person)\s*:?\s*\n?\s*([^\n|]+)/i);
    return m ? m[1].trim() : '';
  }

  const temValorEmReais = (texto) => /r\$\s*\d|\d+\s*reais\b/.test(semAcento(texto));

  // ---------- página ----------

  function infoLugar() {
    const url = location.href;
    const resumo = document.querySelector('div.F7nice')?.innerText || '';
    const volume = (resumo.match(/\(([\d.,\s]+)\)/) || resumo.match(/([\d.]+)\s+(?:avalia|review)/i) || [])[1] || '';
    return {
      place_id: (url.match(/!19s(ChIJ[\w-]+)/) || [])[1] || el.placeId?.value.trim() || '',
      id_maps: (url.match(/!1s(0x[0-9a-f]+:0x[0-9a-f]+)/i) || [])[1] || '',
      nome_estabelecimento: document.querySelector('h1.DUwDvf, div[role="main"] h1')?.innerText.trim() || '',
      avaliacao_media_estabelecimento: (resumo.match(/(\d[.,]\d)/) || [])[1]?.replace(',', '.') || '',
      volume_avaliacoes_estabelecimento: volume.replace(/\D/g, ''),
    };
  }

  const cartoes = () => [...document.querySelectorAll('div[data-review-id]')]
    .filter((c) => !c.parentElement.closest('[data-review-id]'));

  function rolavel(de) {
    for (let e = de; e && e !== document.body; e = e.parentElement) {
      const cs = getComputedStyle(e);
      if (/(auto|scroll)/.test(cs.overflowY) && e.scrollHeight > e.clientHeight + 20) return e;
    }
    return null;
  }

  async function abrirAbaAvaliacoes() {
    const aba = [...document.querySelectorAll('button[role="tab"]')].find((b) => /avalia|reviews/i.test(b.innerText || b.getAttribute('aria-label')));
    if (aba && aba.getAttribute('aria-selected') !== 'true') { aba.click(); await esperar(2500); }
  }

  async function ordenarRecentes() {
    const botao = [...document.querySelectorAll('button')].find((b) => /classificar avalia|ordenar|sort reviews/i.test(b.getAttribute('aria-label') || '') || b.dataset.value === 'Ordenar');
    if (!botao) return false;
    botao.click();
    await esperar(1200);
    const opcao = [...document.querySelectorAll('[role="menuitemradio"], [role="menuitem"]')].find((o) => /recentes|newest/i.test(o.innerText));
    if (!opcao) { document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); return false; }
    opcao.click();
    await esperar(3000);
    return true;
  }

  // Clica em "Mais" e em "Ver original" (para ler o texto no idioma do autor).
  async function expandirTextos() {
    let n = 0;
    for (const b of document.querySelectorAll('div[data-review-id] button.w8nwRe, div[data-review-id] button[aria-label="Ver mais"], div[data-review-id] button[aria-label="See more"]')) {
      b.click();
      n++;
    }
    for (const b of document.querySelectorAll('div[data-review-id] button, div[data-review-id] [role="button"]')) {
      if (b.dataset.tccOriginal) continue;
      if (/^\s*(ver original|see original)/i.test(b.innerText || b.getAttribute('aria-label') || '')) {
        b.dataset.tccOriginal = '1';
        b.click();
        n++;
      }
    }
    if (n) await esperar(400);
    return n;
  }

  const cache = new WeakMap();

  function lerCartao(c) {
    const assinatura = `${c.textContent.length}|${c.querySelectorAll('img, button').length}`;
    const guardado = cache.get(c);
    if (guardado && guardado.assinatura === assinatura) return guardado.linha;

    const resposta = c.querySelector('.CDe7pd');
    const textoResposta = resposta?.innerText || '';
    const textoCartao = c.innerText;
    const fora = textoResposta ? textoCartao.replace(textoResposta, '') : textoCartao;

    const estrela = c.querySelector('[role="img"][aria-label*="estrela"], [role="img"][aria-label*="star"]')?.getAttribute('aria-label') || '';
    let nota = (estrela.match(/(\d)/) || [])[1] || '';
    if (!nota) nota = ((fora.match(/\b(\d)\/5\b/) || [])[1]) || '';
    const data = c.querySelector('.rsqaWe, .xRkPPb')?.innerText.trim()
      || [...c.querySelectorAll('span')].map((s) => s.innerText.trim()).find((t) => /atr[aá]s$|^h[aá] |ago$/i.test(t)) || '';
    const corpo = [...c.querySelectorAll('.wiI7pd')].find((e) => !resposta || !resposta.contains(e));
    const texto = (corpo?.innerText || '').replace(/\s*…?\s*Mais$/, '').trim();
    // Notas por aspecto e campos como "Preço por pessoa", "Tamanho do grupo".
    const detalhes = [...c.querySelectorAll('.PBK6be')].map((e) => e.innerText.replace(/\s*\n\s*/g, ': ').trim()).filter(Boolean).join(' | ');
    const contrib = (c.querySelector('[data-href*="/contrib/"], a[href*="/contrib/"]')?.getAttribute('data-href')
      || c.querySelector('a[href*="/contrib/"]')?.getAttribute('href') || '').match(/contrib\/(\d+)/)?.[1] || '';
    const autor = c.querySelector('.d4r55')?.innerText.trim() || c.getAttribute('aria-label') || '';
    const fotos = [...c.querySelectorAll('button[data-photo-index], button.Tya61d')].filter((b) => !resposta || !resposta.contains(b));
    const traduzida = /traduzido pelo google|translated by google|ver original|see original|ver traduc|see translation/i.test(fora);
    const originalVisivel = /ver traduc|see translation/i.test(fora);
    const faixa = faixaDias(data);

    const linha = {
      review_id: c.dataset.reviewId,
      chave_autor: contrib || autor,
      origem_pseudonimo: contrib ? 'contrib' : (autor ? 'nome' : ''),
      nota_avaliacao: nota,
      data_relativa: data,
      editada: /editad|edited/i.test(data) ? 'sim' : 'não',
      idade_dias_aprox: faixa ? faixa[0] : '',
      data_min: faixa ? diasAtras(faixa[1]) : '',
      data_max: faixa ? diasAtras(faixa[0]) : '',
      tem_texto: texto ? 'sim' : 'não',
      texto_avaliacao: texto,
      traduzida: traduzida ? 'sim' : 'não',
      texto_original: !traduzida || originalVisivel ? 'sim' : 'não',
      detalhes,
      n_fotos: fotos.length,
      notas_por_aspecto: notasPorAspecto(`${detalhes}\n${fora}`),
      preco_por_pessoa: precoPorPessoa(`${detalhes.replace(/ \| /g, '\n')}\n${fora}`),
      valor_rs_no_texto: temValorEmReais(texto) ? 'sim' : 'não',
      temas: temas(texto).map((k) => ROTULO_TEMA[k]).join('; '),
      opiniao: opiniao(nota, texto),
      resposta_dono: resposta ? 'sim' : 'não',
      texto_resposta: resposta ? (resposta.querySelector('.wiI7pd')?.innerText || '').trim() : '',
    };
    cache.set(c, { assinatura, linha });
    return linha;
  }

  // Na ordem "Mais recentes", a idade não pode diminuir ao descer a lista.
  // Avaliações editadas ficam de fora: o rótulo mostra a data da edição.
  function ordemQuebrada(cs) {
    const idades = cs.slice(0, 20).map(lerCartao).filter((r) => r.editada === 'não' && r.idade_dias_aprox !== '').map((r) => r.idade_dias_aprox);
    let inversoes = 0;
    for (let i = 1; i < idades.length; i++) if (idades[i] < idades[i - 1]) inversoes++;
    return inversoes > 1;
  }

  // Aviso quando as classes do Google mudam e a leitura sai vazia.
  function checarSeletores(linhas) {
    const n = linhas.length;
    if (n < 5) return '';
    const falhas = [];
    if (linhas.filter((r) => !r.nota_avaliacao).length / n > 0.5) falhas.push('nota');
    if (linhas.filter((r) => r.idade_dias_aprox === '').length / n > 0.5) falhas.push('data');
    if (n >= 20 && !linhas.some((r) => r.tem_texto === 'sim')) falhas.push('texto');
    if (linhas.filter((r) => !r.origem_pseudonimo).length / n > 0.5) falhas.push('autor');
    return falhas.length ? `Seletores quebrados? Mais da metade sem ${falhas.join(', ')}. Confira a página antes de usar o CSV.` : '';
  }

  // ---------- período e filtros ----------

  const periodo = { de: 0, ate: 30 };
  const filtros = { temas: new Set(), opiniao: '', componentes: new Set(), esmaecer: false };

  const noPeriodo = (r) => r.idade_dias_aprox !== '' && r.idade_dias_aprox >= periodo.de && r.idade_dias_aprox <= periodo.ate;

  const COMPONENTES = {
    texto: ['com texto', (r) => r.tem_texto === 'sim'],
    fotos: ['fotos', (r) => +r.n_fotos > 0],
    aspectos: ['notas de comida, serviço ou ambiente', (r) => !!r.notas_por_aspecto],
    preco: ['preço por pessoa', (r) => !!r.preco_por_pessoa],
    reais: ['valor em R$ no texto', (r) => r.valor_rs_no_texto === 'sim'],
    resposta: ['resposta do dono', (r) => r.resposta_dono === 'sim'],
  };

  function passaFiltros(r) {
    if (!noPeriodo(r)) return false;
    if (filtros.temas.size) {
      const t = r.temas.split('; ');
      if (![...filtros.temas].some((k) => t.includes(ROTULO_TEMA[k]))) return false;
    }
    if (filtros.opiniao && r.opiniao !== filtros.opiniao) return false;
    for (const k of filtros.componentes) if (!COMPONENTES[k][1](r)) return false;
    return true;
  }

  function atualizarFiltrosNaPagina() {
    const cs = cartoes();
    let passam = 0;
    for (const c of cs) {
      const ok = passaFiltros(lerCartao(c));
      if (ok) passam++;
      if (filtros.esmaecer && !ok) {
        c.style.transition = 'opacity .2s';
        c.style.opacity = '0.25';
        c.dataset.tccEsmaecido = '1';
      } else if (c.dataset.tccEsmaecido) {
        c.style.opacity = '';
        delete c.dataset.tccEsmaecido;
      }
    }
    if (el.contador) el.contador.textContent = cs.length ? `${passam} de ${cs.length} avaliações carregadas passam no período e nos filtros.` : '';
  }

  // ---------- coleta ----------

  let parar = false;
  let ocupado = false;
  let resultado = [];
  let alertaSeletores = '';

  // Rola a lista até `alvo(cs)` devolver um motivo, até passar do período, até
  // carregar o volume total ou até a lista parar de crescer.
  async function rolarLista(caixa, alvo) {
    let ultimoN = 0, semCrescer = 0, ordemConferida = false;
    while (true) {
      if (parar) return 'interrompida';
      await expandirTextos();
      const cs = cartoes();
      status(`${cs.length} avaliações carregadas · a última: ${lerCartao(cs[cs.length - 1]).data_relativa || '?'}`);
      atualizarFiltrosNaPagina();
      if (!ordemConferida && cs.length >= 10) {
        ordemConferida = true;
        if (ordemQuebrada(cs)) return 'ordem errada';
      }
      const motivo = alvo(cs);
      if (motivo) return motivo;
      const ultimas = cs.slice(-5).map((c) => lerCartao(c).idade_dias_aprox);
      if (periodo.ate !== Infinity && ultimas.length === 5 && ultimas.every((d) => d !== '' && d > periodo.ate)) return 'passou do período';
      const volume = +infoLugar().volume_avaliacoes_estabelecimento;
      if (volume && cs.length >= volume) return 'fim da lista';
      semCrescer = cs.length === ultimoN ? semCrescer + 1 : 0;
      if (semCrescer >= 8) return 'lista parou de crescer';
      ultimoN = cs.length;
      caixa.scrollTo(0, caixa.scrollHeight);
      await esperar(sortear([1200, 2000]));
    }
  }

  const MSG_MOTIVO = {
    'interrompida': 'Interrompido.',
    'ordem errada': 'A lista não está em ordem de data: ordene por "Mais recentes" e colete de novo.',
    'passou do período': 'Passou do fim do período.',
    'fim da lista': 'Chegou ao fim da lista.',
    'lista parou de crescer': 'A lista parou de crescer (fim da lista ou carregamento lento; confira).',
  };
  const COMPLETA = { 'passou do período': 'sim', 'fim da lista': 'sim', 'lista parou de crescer': 'incerta' };

  async function prepararLista() {
    const lugar = infoLugar();
    if (!lugar.nome_estabelecimento) { status('Abra um lugar no Maps primeiro.'); return null; }
    status('Abrindo a aba de avaliações…');
    await abrirAbaAvaliacoes();
    if (!el.jaOrdenado.checked) {
      status('Ordenando por mais recentes…');
      if (!(await ordenarRecentes())) { status('Não consegui ordenar sozinho. Ordene por "Mais recentes", marque "Já ordenei" e clique de novo.'); return null; }
    }
    const primeira = cartoes()[0];
    const caixa = primeira && rolavel(primeira);
    if (!caixa) { status('Lista de avaliações não encontrada (visualização limitada? entre na conta).'); return null; }
    return caixa;
  }

  async function coletar() {
    parar = false;
    resultado = [];
    alertaSeletores = '';
    const caixa = await prepararLista();
    if (!caixa) return;

    const motivo = await rolarLista(caixa, () => null);
    await expandirTextos();
    await esperar(800);
    await expandirTextos();

    const lugar = infoLugar();
    const coletado_em = agora();
    const lidos = cartoes().map(lerCartao);
    alertaSeletores = checarSeletores(lidos);
    const vistos = new Set();
    let indice = 0;
    for (const r of lidos) {
      if (vistos.has(r.review_id)) continue;
      vistos.add(r.review_id);
      const { chave_autor, ...resto } = r;
      resultado.push({
        ...lugar,
        review_index: ++indice,
        autor_pseudonimo: chave_autor ? await pseudonimo(chave_autor) : '',
        ...resto,
        no_periodo: noPeriodo(r) ? 'sim' : 'não',
        periodo_de_dias: periodo.de,
        periodo_ate_dias: periodo.ate === Infinity ? 'sem limite' : periodo.ate,
        motivo_parada: motivo,
        coleta_completa: COMPLETA[motivo] || 'não',
        versao_script: VERSAO,
        coletado_em,
        url: location.href,
      });
    }
    atualizarFiltrosNaPagina();
    mostrarResumo(motivo, lugar);
  }

  // Rola até a primeira avaliação do período (para retomar uma coleta).
  async function localizarPeriodo() {
    parar = false;
    const caixa = await prepararLista();
    if (!caixa) return;
    let alvo = null;
    const motivo = await rolarLista(caixa, (cs) => {
      alvo = cs.find((c) => noPeriodo(lerCartao(c)));
      return alvo ? 'achou' : null;
    });
    if (!alvo) { status(`Nenhuma avaliação no período. ${MSG_MOTIVO[motivo] || ''}`); return; }
    alvo.scrollIntoView({ block: 'center' });
    alvo.style.outline = '3px solid #e8a400';
    setTimeout(() => { alvo.style.outline = ''; }, 6000);
    const r = lerCartao(alvo);
    status(`Primeira avaliação do período: "${r.data_relativa}", nota ${r.nota_avaliacao || '?'} (contorno amarelo).`);
  }

  function mostrarResumo(motivo, lugar) {
    const noP = resultado.filter((r) => r.no_periodo === 'sim');
    const comTexto = resultado.filter((r) => r.tem_texto === 'sim').length;
    const semTexto = resultado.length - comTexto;
    const semData = resultado.filter((r) => r.idade_dias_aprox === '').length;
    const avisos = [];
    if (!lugar.place_id && !lugar.id_maps) avisos.push('Sem place_id nem id_maps: cole o place_id do B1 no campo antes de exportar.');
    else if (!lugar.place_id) avisos.push('Sem place_id na URL: cole o do B1 no campo, se quiser.');
    if (alertaSeletores) avisos.push(alertaSeletores);
    status(`${MSG_MOTIVO[motivo] || ''} ${resultado.length} lidas (${comTexto} com texto + ${semTexto} sem) · ` +
      `${noP.length} no período, ${noP.filter((r) => r.tem_texto === 'sim').length} delas com texto` +
      (semData ? ` · ${semData} sem data reconhecida (confira)` : '') + '.' + (avisos.length ? `\n${avisos.join('\n')}` : ''));
  }

  // ---------- exportação ----------

  const COLS = ['place_id', 'id_maps', 'nome_estabelecimento', 'avaliacao_media_estabelecimento', 'volume_avaliacoes_estabelecimento',
    'review_index', 'review_id', 'autor_pseudonimo', 'origem_pseudonimo', 'nota_avaliacao', 'data_relativa', 'editada',
    'idade_dias_aprox', 'data_min', 'data_max', 'no_periodo', 'tem_texto', 'texto_avaliacao', 'traduzida', 'texto_original',
    'detalhes', 'n_fotos', 'notas_por_aspecto', 'preco_por_pessoa', 'valor_rs_no_texto', 'temas', 'opiniao', 'resposta_dono',
    'texto_resposta', 'periodo_de_dias', 'periodo_ate_dias', 'motivo_parada', 'coleta_completa', 'versao_script', 'coletado_em', 'url'];

  function celula(v) {
    const s = String(v ?? '');
    return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  }

  function baixar(linhas, sufixo) {
    if (!resultado.length) { status('Nada para exportar: colete primeiro.'); return; }
    if (!linhas.length) { status('Nenhuma avaliação coletada passa neste recorte.'); return; }
    if (alertaSeletores && !confirm(`${alertaSeletores}\n\nExportar mesmo assim?`)) return;
    // O place_id colado depois da coleta também entra.
    const placeId = el.placeId.value.trim();
    const saida = linhas.map((l) => (l.place_id || !placeId ? l : { ...l, place_id: placeId }));
    const texto = '﻿' + [COLS.join(';'), ...saida.map((l) => COLS.map((c) => celula(l[c])).join(';'))].join('\r\n');
    const nome = (linhas[0].nome_estabelecimento || 'lugar').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\w]+/g, '_').replace(/^_|_$/g, '').toLowerCase();
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([texto], { type: 'text/csv;charset=utf-8' }));
    a.download = `${dataLocal(new Date())}_${nome}_maps_avaliacoes_${sufixo}.csv`;
    document.documentElement.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 2000);
  }

  // ---------- painel (padrão: canto superior direito, shadow DOM, fora do <body>) ----------
  // Fica à esquerda do painel de horários de pico, para os dois caberem juntos.

  const el = {};
  let hospedeiro = null;
  let ultimoLugar = '';

  function criar(tag, props = {}, filhos = []) {
    const n = document.createElement(tag);
    Object.assign(n, props);
    for (const f of filhos) n.appendChild(typeof f === 'string' ? document.createTextNode(f) : f);
    return n;
  }

  function status(t) { if (el.status) el.status.textContent = t; }

  const CSS = `
    #painel{position:fixed;top:12px;right:354px;z-index:2147483647;width:330px;
      max-height:calc(100vh - 24px);overflow:auto;box-sizing:border-box;
      background:#fff;color:#111;border:1px solid #ccc;border-radius:10px;
      box-shadow:0 4px 16px rgba(0,0,0,.18);font:13px/1.4 system-ui,sans-serif;padding:10px}
    @media (prefers-color-scheme:dark){#painel{background:#1e1e1e;color:#eee;border-color:#444}}
    #painel.min>*:not(header){display:none}
    header{display:flex;justify-content:space-between;align-items:center;font-weight:700;cursor:pointer}
    p{margin:6px 0}
    label{display:block;margin:3px 0}
    label.inline{display:inline-block;margin:2px 8px 2px 0}
    details{margin:6px 0;border-top:1px solid #8884;padding-top:4px}
    summary{cursor:pointer;font-weight:600}
    .titulo{font-weight:600;margin:6px 0 2px}
    .linha{display:flex;flex-wrap:wrap;gap:6px;margin:6px 0;align-items:center}
    button{flex:1 1 auto;padding:5px 8px;border-radius:6px;border:1px solid #888;
      background:transparent;color:inherit;cursor:pointer;font:inherit}
    button:disabled{opacity:.4;cursor:default}
    select,input[type=text]{font:inherit;color:inherit;background:transparent;border:1px solid #888;border-radius:6px;padding:3px}
    input[type=text]{flex:1 1 auto;min-width:0}
    .status{font-size:12px;opacity:.85;white-space:pre-line}
    .contador{font-size:12px;opacity:.75}`;

  const OPCOES_PERIODO = [[0, 'agora'], [7, '1 semana'], [14, '2 semanas'], [21, '3 semanas'], [28, '4 semanas'],
    [30, '1 mês'], ...[2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((n) => [30 * n, `${n} meses`]),
    [365, '1 ano'], ...[2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => [365 * n, `${n} anos`])];

  function montarPainel() {
    const botao = (texto, fn) => criar('button', { textContent: texto, onclick: fn });
    const caixa = (rotulo, aoMudar, classe = 'inline') => {
      const i = criar('input', { type: 'checkbox', onchange: (e) => { aoMudar(e.target.checked); atualizarFiltrosNaPagina(); } });
      return criar('label', { className: classe }, [i, ` ${rotulo}`]);
    };
    const alternar = (conjunto, k) => (marcado) => { if (marcado) conjunto.add(k); else conjunto.delete(k); };

    el.status = criar('p', { className: 'status', textContent: 'Abra um lugar e clique em "Coletar avaliações".' });
    el.contador = criar('p', { className: 'contador' });
    el.jaOrdenado = criar('input', { type: 'checkbox' });
    el.placeId = criar('input', { type: 'text', placeholder: 'place_id do B1 (se faltar na URL)' });

    const seletorDe = criar('select', { onchange: (e) => { periodo.de = +e.target.value; atualizarFiltrosNaPagina(); } },
      OPCOES_PERIODO.map(([v, t]) => criar('option', { value: v, textContent: t })));
    const seletorAte = criar('select', { onchange: (e) => { periodo.ate = e.target.value === 'tudo' ? Infinity : +e.target.value; atualizarFiltrosNaPagina(); } },
      [...OPCOES_PERIODO.slice(1).map(([v, t]) => criar('option', { value: v, textContent: t })), criar('option', { value: 'tudo', textContent: 'sem limite' })]);
    seletorAte.value = '30';

    const executar = (fn) => async () => {
      if (ocupado) return;
      ocupado = true; bColetar.disabled = bLocalizar.disabled = true; bParar.disabled = false;
      try { await fn(); } catch (e) { status(`Erro: ${e.message}`); }
      ocupado = false; bColetar.disabled = bLocalizar.disabled = false; bParar.disabled = true;
    };
    const bColetar = botao('Coletar avaliações', executar(coletar));
    const bLocalizar = botao('Localizar período', executar(localizarPeriodo));
    const bParar = botao('Parar', () => { parar = true; });
    bParar.disabled = true;

    const seletorOpiniao = criar('select', { onchange: (e) => { filtros.opiniao = e.target.value; atualizarFiltrosNaPagina(); } }, [
      criar('option', { value: '', textContent: 'qualquer' }),
      criar('option', { value: 'positiva', textContent: 'positiva (nota 5 + palavra positiva)' }),
      criar('option', { value: 'negativa', textContent: 'negativa (nota ≤ 4 + palavra negativa)' }),
    ]);

    const filtrosUI = criar('details', { open: true }, [
      criar('summary', { textContent: 'Filtros' }),
      criar('div', { className: 'titulo', textContent: 'Tema mencionado (qualquer um)' }),
      criar('div', {}, Object.keys(TEMAS).map((k) => caixa(ROTULO_TEMA[k], alternar(filtros.temas, k)))),
      criar('div', { className: 'linha' }, [criar('span', { className: 'titulo', textContent: 'Opinião' }), seletorOpiniao]),
      criar('div', { className: 'titulo', textContent: 'Componentes (todos os marcados)' }),
      criar('div', {}, Object.entries(COMPONENTES).map(([k, [rotulo]]) => caixa(rotulo, alternar(filtros.componentes, k)))),
      caixa('Esmaecer na página o que fica fora do período e dos filtros', (m) => { filtros.esmaecer = m; }, ''),
      el.contador,
    ]);

    const salUI = criar('details', {}, [
      criar('summary', { textContent: 'Sal da pseudonimização' }),
      criar('p', { className: 'contador', textContent: 'Guarde uma cópia: sem o mesmo sal, o mesmo autor recebe outro código.' }),
      criar('div', { className: 'linha' }, [
        botao('Copiar sal', () => { prompt('Sal atual (copie e guarde):', sal()); }),
        botao('Importar sal', () => {
          const novo = (prompt('Cole o sal (32 caracteres hexadecimais):') || '').trim().toLowerCase();
          if (!novo) return;
          if (!/^[0-9a-f]{32}$/.test(novo)) { status('Sal inválido: são 32 caracteres de 0-9 e a-f.'); return; }
          if (novo !== sal() && !confirm('Trocar o sal muda os códigos das próximas coletas. Continuar?')) return;
          GM_setValue(CHAVE_SAL, novo);
          status('Sal importado.');
        }),
      ]),
    ]);

    const minimizar = criar('span', { textContent: '–' });
    const cabecalho = criar('header', {}, [criar('span', { textContent: 'Avaliações do Maps' }), minimizar]);
    const painel = criar('div', { id: 'painel' }, [
      cabecalho,
      criar('div', { className: 'linha' }, ['Período: de', seletorDe, 'até', seletorAte]),
      criar('label', {}, [el.jaOrdenado, ' Já ordenei por "Mais recentes"']),
      criar('div', { className: 'linha' }, [bColetar, bParar]),
      criar('div', { className: 'linha' }, [bLocalizar]),
      filtrosUI,
      criar('div', { className: 'linha' }, [
        botao('CSV do período (com texto)', () => baixar(resultado.filter((r) => r.no_periodo === 'sim' && r.tem_texto === 'sim'), 'periodo')),
        botao('CSV dos filtros', () => baixar(resultado.filter(passaFiltros), 'filtros')),
        botao('CSV de tudo', () => baixar(resultado, 'tudo')),
      ]),
      criar('div', { className: 'linha' }, [el.placeId]),
      salUI,
      el.status,
    ]);
    cabecalho.onclick = () => { painel.classList.toggle('min'); minimizar.textContent = painel.classList.contains('min') ? '+' : '–'; };
    el.painel = painel;

    hospedeiro = criar('div', { id: 'tcc-avaliacoes-hospedeiro' });
    const raiz = hospedeiro.attachShadow({ mode: 'open' });
    raiz.appendChild(criar('style', { textContent: CSS }));
    raiz.appendChild(painel);
  }

  function garantirPainel() {
    if (!hospedeiro) montarPainel();
    if (!hospedeiro.isConnected) document.documentElement.appendChild(hospedeiro);
    // Ao trocar de lugar, "Já ordenei" e o place_id colado deixam de valer.
    const lugar = infoLugar();
    const chave = lugar.id_maps || lugar.nome_estabelecimento;
    if (chave && chave !== ultimoLugar) {
      if (ultimoLugar) { el.jaOrdenado.checked = false; el.placeId.value = ''; }
      ultimoLugar = chave;
    }
    if (!ocupado && !el.painel.classList.contains('min')) atualizarFiltrosNaPagina();
  }

  console.info('[Avaliações do Maps] carregado');
  garantirPainel();
  setInterval(() => { try { garantirPainel(); } catch (e) { console.error('[Avaliações do Maps]', e); } }, 1500);
})();
