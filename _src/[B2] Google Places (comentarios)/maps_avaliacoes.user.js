// ==UserScript==
// @name         Coletor de avaliações do Google Maps (TCC Luderia)
// @namespace    tcc-luderia
// @version      2026.10.13-4
// @description  Abre as avaliações de um lugar, ordena por mais recentes, rola até o fim do período, expande os textos (no idioma original), filtra por tema, opinião, componentes e busca, salva o progresso, coleta em fila, confere amostras e exporta CSV com autor pseudonimizado.
// @match        https://www.google.com/maps/*
// @match        https://www.google.com.br/maps/*
// @run-at       document-idle
// @noframes
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// @grant        GM_listValues
// ==/UserScript==

/*
 * Uso pessoal, para o Bloco B2: completar estabelecimentos em que a coleta
 * automática falhou. O recorte do método (_instrucoes/4_metodologia.md) é o
 * período padrão "de agora até 1 mês": todas as avaliações COM TEXTO cujo rótulo
 * de data seja de até "um mês atrás", inclusive, na data da coleta.
 *
 * Passos do botão "Coletar avaliações":
 *  1. abre a aba "Avaliações";
 *  2. ordena por "Mais recentes" (se falhar, ordene à mão, marque "Já ordenei" e
 *     clique de novo) e confere se a lista está mesmo em ordem de data;
 *  3. rola a lista até passar do fim do período (5 avaliações seguidas mais
 *     antigas que o "até"), até carregar o volume total, até encontrar 10 já
 *     coletadas seguidas (se marcado) ou até a lista parar de crescer; quando a
 *     lista empaca, espera cada vez mais antes de desistir;
 *  4. clica em todos os "Mais" e "Ver original" e lê as avaliações.
 *
 * Retomada:
 *  - O progresso é salvo a cada poucos segundos no armazenamento do Tampermonkey.
 *    Se a internet cair ou a aba fechar, "Recuperar última coleta" devolve o que
 *    foi lido, pronto para exportar.
 *  - Cada review_id lido fica registrado por lugar. Na coleta seguinte, a coluna
 *    "ja_coletada" marca os já vistos, o filtro "não coletada antes" isola as
 *    novas e, se marcado, a rolagem para ao achar 10 já coletadas seguidas.
 *  - Período "de… até…" e "Localizar período" levam até uma janela de datas.
 *
 * Fila: uma URL do Maps ou um place_id por linha. O script abre cada lugar,
 * coleta, baixa o CSV de tudo (sempre, mesmo com o download automático desligado,
 * porque a página muda), espera 20-40 s e passa ao próximo. No fim, baixa o
 * CSV-resumo da fila. "Parar" pausa; "Continuar fila" retoma do lugar em que parou.
 *
 * CSV-resumo: uma linha por coleta, com lidas = com texto + sem texto, avaliações
 * no período e velocidade de avaliações com texto por mês, em faixa: o rótulo
 * "um mês atrás" cobre de 30 a 59 dias, então a janela vai de 30 a 60 dias.
 *
 * Conferência (fidelidade, §3.6 do método): cole os review_id sorteados. O script
 * diz de que lugar é cada um, rola até ele, destaca e mostra lado a lado o que foi
 * coletado e o que está na página. Marque ✓ ou ✗ e exporte o CSV da conferência.
 *
 * Filtros (tema, opinião, componentes, busca) e período valem para o CSV "dos
 * filtros", para esmaecer na página o que fica de fora e para destacar no texto
 * as palavras que acionaram o filtro (tema em amarelo, positiva em verde,
 * negativa em vermelho, negação sublinhada em laranja, busca em azul). São regras
 * de palavras-chave para achar comentários, não a codificação do método (Bardin).
 *  - Tema: qualquer um dos marcados aparece no texto.
 *  - Opinião positiva: nota 5 E palavra positiva (ou negação de negativa, como
 *    "não foi caro"). Negativa: nota 4 ou menos E palavra negativa (ou negação
 *    de positiva, como "não foi bom"). A negação vale para até 3 palavras antes,
 *    dentro da mesma oração.
 *  - Componentes: todos os marcados presentes. "Provável cardápio": tem foto e o
 *    texto cita cardápio, menu, preço ou valor.
 *  - Busca: texto ou expressão regular, sem diferença de maiúsculas.
 *
 * Pseudonimização na coleta: o nome do autor não sai do navegador. O CSV traz um
 * código (SHA-256 do id de colaborador do Google + um sal, 12 caracteres). O sal
 * fica no armazenamento do Tampermonkey, igual em google.com e google.com.br, e
 * pode ser copiado e importado no painel. Sem o mesmo sal, o mesmo autor recebe
 * códigos diferentes. "origem_pseudonimo" diz se o código veio do id (contrib)
 * ou, na falta dele, do nome exibido (nome; homônimos colidem).
 *
 * Idade em dias: limite inferior do rótulo (semana = 7, mês = 30, ano = 365).
 * "data_min" e "data_max" dão a faixa coberta pelo rótulo. "Editado há…" conta
 * pela data da edição, que é o que o Google mostra; a coluna "editada" marca esses
 * casos.
 *
 * Som: o navegador só libera áudio depois de um clique na página. Na fila, depois
 * que a página muda, clique uma vez no painel para o aviso final tocar.
 *
 * Na "visualização limitada" do Maps (sem login), só aparecem 3 avaliações:
 * use logado.
 */

(function () {
  'use strict';

  const VERSAO = (typeof GM_info !== 'undefined' && GM_info.script?.version) || '?';
  const CHAVE_SAL = 'tcc-avaliacoes-sal';
  const CHAVE_ANDAMENTO = 'coleta:andamento';
  const CHAVE_RESUMOS = 'resumos';
  const CHAVE_FILA = 'fila';
  const CHAVE_CONF = 'conferencia';
  const PREFIXO_LUGAR = 'lugar:';
  const PAUSA_FILA = [20000, 40000];

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
  // execução, aproveita o sal antigo do localStorage, se houver.
  function sal() {
    let s = GM_getValue(CHAVE_SAL, '');
    if (!s) {
      try { s = localStorage.getItem(CHAVE_SAL) || ''; } catch (_) { s = ''; }
      if (!s) s = novoSal();
      GM_setValue(CHAVE_SAL, s);
    }
    return s;
  }

  const pseudonimos = new Map();

  async function pseudonimo(texto) {
    if (pseudonimos.has(texto)) return pseudonimos.get(texto);
    const dados = new TextEncoder().encode(`${sal()}|${texto}`);
    const h = await crypto.subtle.digest('SHA-256', dados);
    const codigo = [...new Uint8Array(h)].map((b) => b.toString(16).padStart(2, '0')).join('').slice(0, 12);
    pseudonimos.set(texto, codigo);
    return codigo;
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

  // Último dia coberto pelo rótulo que corresponde a um limite do período (30 -> 59).
  function fimDoRotulo(dias) {
    if (dias > 0 && dias % 365 === 0) return dias + 364;
    if (dias > 0 && dias % 30 === 0) return dias + 29;
    if (dias > 0 && dias % 7 === 0) return dias + 6;
    return dias;
  }

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

  // Campos que o Google mostra em cada avaliação, fora do texto do autor.
  const CAMPOS_DETALHE = {
    tipo_servico: ['servico', 'service'],
    tipo_refeicao: ['tipo de refeicao', 'meal type'],
    preco_por_pessoa: ['preco por pessoa', 'price per person'],
    tamanho_grupo: ['tamanho do grupo', 'group size'],
    tempo_espera: ['tempo de espera', 'wait time'],
    reserva: ['reserva', 'reservation'],
    estacionamento: ['opcoes de estacionamento', 'estacionamento', 'parking options', 'parking space', 'parking'],
    pratos_recomendados: ['pratos recomendados', 'recommended dishes'],
  };

  // `meta`: texto do cartão sem o texto do autor e sem a resposta do dono.
  // O valor vem depois do rótulo, na mesma linha ou na seguinte.
  function camposDetalhe(meta) {
    const segs = String(meta || '').split(/\n|\s\|\s/).map((s) => s.trim()).filter(Boolean);
    const saida = {};
    segs.forEach((s, i) => {
      const n = semAcento(s);
      for (const [campo, rotulos] of Object.entries(CAMPOS_DETALHE)) {
        if (saida[campo]) continue;
        const r = rotulos.find((x) => n === x || n.startsWith(`${x}:`) || n.startsWith(`${x} `));
        if (!r) continue;
        let v = s.slice(r.length).replace(/^\s*:?\s*/, '').trim();
        if (!v) v = segs[i + 1] || '';
        // "Serviço: 4" e "Serviço 4/5" são notas por aspecto, não o tipo de serviço.
        if (/^[1-5](\/5)?$/.test(v)) continue;
        saida[campo] = v;
      }
    });
    return saida;
  }

  // Notas por aspecto ("Comida: 5/5", "Serviço 4", "Ambiente: 5").
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

  const temValorEmReais = (texto) => /r\$\s*\d|\d+\s*reais\b/.test(semAcento(texto));
  const citaCardapio = (texto) => /\b(cardapio|menu|precos?|valores?)\b|r\$/.test(semAcento(texto));

  // ---------- página ----------

  let placeIdFila = '';

  function infoLugar() {
    const url = location.href;
    const painelLugar = document.querySelector('[role="main"]');
    const resumo = document.querySelector('div.F7nice')?.innerText || painelLugar?.innerText || '';
    const volume = (resumo.match(/\(([\d.,\s]+)\)/) || resumo.match(/([\d.]+)\s+(?:avalia|review)/i) || [])[1] || '';
    return {
      place_id: (url.match(/!19s(ChIJ[\w-]+)/) || url.match(/place_id:(ChIJ[\w-]+)/) || [])[1] || placeIdFila || el.placeId?.value.trim() || '',
      id_maps: (url.match(/!1s(0x[0-9a-f]+:0x[0-9a-f]+)/i) || [])[1] || '',
      nome_estabelecimento: document.querySelector('h1.DUwDvf, div[role="main"] h1')?.innerText.trim()
        || painelLugar?.getAttribute('aria-label')?.trim() || '',
      avaliacao_media_estabelecimento: (resumo.match(/(\d[.,]\d)/) || [])[1]?.replace(',', '.') || '',
      volume_avaliacoes_estabelecimento: volume.replace(/\D/g, ''),
    };
  }

  // Chave do lugar no registro de ids: o id do Maps é o mais estável na URL.
  const chaveLugar = (l) => l.id_maps || l.place_id || l.nome_estabelecimento;

  const cartoes = () => [...document.querySelectorAll('div[data-review-id]')]
    .filter((c) => !c.parentElement.closest('[data-review-id]'));

  const cartaoPorId = (id) => cartoes().find((c) => c.dataset.reviewId === id) || null;

  function rolavel(de) {
    let candidato = null;
    for (let e = de; e && e !== document.body; e = e.parentElement) {
      const cs = getComputedStyle(e);
      if (!/(auto|scroll)/.test(cs.overflowY)) continue;
      if (e.scrollHeight > e.clientHeight + 20) return e;
      // No começo a lista pode ter poucos cartões e ainda não transbordar.
      if (!candidato) candidato = e;
    }
    return candidato;
  }

  const textoControle = (e) => (e.innerText || e.textContent || e.getAttribute('aria-label') || '').trim();

  async function abrirAbaAvaliacoes() {
    const botoes = [...document.querySelectorAll('button, [role="tab"]')]
      .filter((b) => !b.closest('[data-review-id]'));
    const aba = botoes.find((b) => /^(avaliações|reviews)$/i.test(textoControle(b)))
      || botoes.find((b) => /\b(avaliações|reviews)\b/i.test(textoControle(b))
        && !/classificar|ordenar|sort|escrever|write/i.test(textoControle(b)));
    if (!aba) return cartoes().length > 0;
    if (aba.getAttribute('aria-selected') !== 'true') aba.click();
    return aguardar(() => cartoes().length > 0, 10000);
  }

  async function ordenarRecentes() {
    const botao = [...document.querySelectorAll('button, [role="button"]')].find((b) =>
      !b.closest('[data-review-id]') && (/classificar avalia|ordenar|sort reviews|sort by/i.test(textoControle(b))
        || b.dataset.value === 'Ordenar'));
    if (!botao) return false;
    botao.click();
    await aguardar(() => [...document.querySelectorAll('[role="menuitemradio"], [role="menuitem"], [role="option"]')]
      .some((o) => /recentes|newest/i.test(textoControle(o))), 4000);
    const opcao = [...document.querySelectorAll('[role="menuitemradio"], [role="menuitem"], [role="option"]')]
      .find((o) => /recentes|newest/i.test(textoControle(o)));
    if (!opcao) { document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); return false; }
    opcao.click();
    await esperar(1200);
    return true;
  }

  // Clica em "Mais" e em "Ver original" (para ler o texto no idioma do autor).
  async function expandirTextos() {
    let n = 0;
    for (const c of cartoes()) {
      for (const b of c.querySelectorAll('button, [role="button"]')) {
        const rotulo = textoControle(b);
        if (/^(mais|more|ver mais|see more)$/i.test(rotulo) || b.classList.contains('w8nwRe')) {
          b.click();
          n++;
        }
      }
    }
    for (const c of cartoes()) {
      for (const b of c.querySelectorAll('button, [role="button"]')) {
        if (b.dataset.tccOriginal) continue;
        if (!/^(ver original|see original)/i.test(textoControle(b))) continue;
        b.dataset.tccOriginal = '1';
        b.click();
        n++;
      }
    }
    if (n) await esperar(400);
    return n;
  }

  function corpoDoCartao(c) {
    const resposta = c.querySelector('.CDe7pd');
    return [...c.querySelectorAll('.wiI7pd')].find((e) => !resposta || !resposta.contains(e)) || null;
  }

  // Link da foto em tamanho cheio: "=s0" no lugar do tamanho da miniatura.
  function urlFoto(b) {
    const fundo = b.style.backgroundImage || getComputedStyle(b).backgroundImage || '';
    const u = (fundo.match(/url\(["']?([^"')]+)/) || [])[1] || b.querySelector('img')?.src || '';
    return u.replace(/=[swh]\d[^=/]*$/, '=s0');
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
    const corpo = corpoDoCartao(c);
    const textoBruto = corpo?.innerText || '';
    const texto = textoBruto.replace(/\s*…?\s*Mais$/, '').trim();
    const meta = textoBruto ? fora.replace(textoBruto, '') : fora;
    // Notas por aspecto e campos como "Preço por pessoa", "Tamanho do grupo".
    const detalhes = [...c.querySelectorAll('.PBK6be')].map((e) => e.innerText.replace(/\s*\n\s*/g, ': ').trim()).filter(Boolean).join(' | ');
    const campos = camposDetalhe(`${detalhes.replace(/ \| /g, '\n')}\n${meta}`);
    const contrib = (c.querySelector('[data-href*="/contrib/"], a[href*="/contrib/"]')?.getAttribute('data-href')
      || c.querySelector('a[href*="/contrib/"]')?.getAttribute('href') || '').match(/contrib\/(\d+)/)?.[1] || '';
    const autor = c.querySelector('.d4r55')?.innerText.trim() || c.getAttribute('aria-label') || '';
    const fotos = [...c.querySelectorAll('button[data-photo-index], button.Tya61d')].filter((b) => !resposta || !resposta.contains(b));
    const traduzida = /traduzido pelo google|translated by google|ver original|see original|ver traduc|see translation/i.test(meta);
    const originalVisivel = /ver traduc|see translation/i.test(meta);
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
      tipo_servico: campos.tipo_servico || '',
      tipo_refeicao: campos.tipo_refeicao || '',
      preco_por_pessoa: campos.preco_por_pessoa || '',
      tamanho_grupo: campos.tamanho_grupo || '',
      tempo_espera: campos.tempo_espera || '',
      reserva: campos.reserva || '',
      estacionamento: campos.estacionamento || '',
      pratos_recomendados: campos.pratos_recomendados || '',
      notas_por_aspecto: notasPorAspecto(`${detalhes}\n${meta}`),
      n_fotos: fotos.length,
      urls_fotos: fotos.map(urlFoto).filter(Boolean).join(' '),
      provavel_cardapio: fotos.length && citaCardapio(texto) ? 'sim' : 'não',
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

  // ---------- registro de ids por lugar (retomada e conferência) ----------

  // lugar:<chave> = { nome, url, place_id, ids: { review_id: [nota, rótulo de data, início do texto, coletado_em] } }
  function lerLugar(chave) {
    return GM_getValue(PREFIXO_LUGAR + chave, null) || { nome: '', url: '', place_id: '', ids: {} };
  }

  function registrarIds(lugar, linhas, coletado_em) {
    const chave = chaveLugar(lugar);
    if (!chave || !linhas.length) return;
    const reg = lerLugar(chave);
    reg.nome = lugar.nome_estabelecimento || reg.nome;
    reg.url = location.href;
    reg.place_id = lugar.place_id || reg.place_id;
    for (const r of linhas) {
      if (!reg.ids[r.review_id] || (!reg.ids[r.review_id][2] && r.texto_avaliacao)) {
        reg.ids[r.review_id] = [r.nota_avaliacao, r.data_relativa, r.texto_avaliacao.slice(0, 160), coletado_em];
      }
    }
    GM_setValue(PREFIXO_LUGAR + chave, reg);
  }

  function lugarDoId(id) {
    for (const k of GM_listValues()) {
      if (!k.startsWith(PREFIXO_LUGAR)) continue;
      const reg = GM_getValue(k, null);
      if (reg?.ids?.[id]) return { chave: k.slice(PREFIXO_LUGAR.length), ...reg, registro: reg.ids[id] };
    }
    return null;
  }

  // Ids já vistos no lugar aberto, congelados no início de cada coleta.
  let idsConhecidos = new Set();
  let chaveIdsConhecidos = '';

  function atualizarIdsConhecidos(forcar = false) {
    const chave = chaveLugar(infoLugar());
    if (!forcar && chave === chaveIdsConhecidos) return;
    chaveIdsConhecidos = chave;
    idsConhecidos = new Set(chave ? Object.keys(lerLugar(chave).ids) : []);
  }

  // ---------- período e filtros ----------

  const periodo = { de: 0, ate: 30 };
  const filtros = { temas: new Set(), opiniao: '', componentes: new Set(), busca: null, esmaecer: false, destacar: true };

  const noPeriodo = (r) => r.idade_dias_aprox !== '' && r.idade_dias_aprox >= periodo.de && r.idade_dias_aprox <= periodo.ate;
  const jaColetada = (r) => (r.ja_coletada ? r.ja_coletada === 'sim' : idsConhecidos.has(r.review_id));

  const COMPONENTES = {
    texto: ['com texto', (r) => r.tem_texto === 'sim'],
    fotos: ['fotos', (r) => +r.n_fotos > 0],
    cardapio: ['provável cardápio', (r) => r.provavel_cardapio === 'sim'],
    aspectos: ['notas de comida, serviço ou ambiente', (r) => !!r.notas_por_aspecto],
    preco: ['preço por pessoa', (r) => !!r.preco_por_pessoa],
    grupo: ['tamanho do grupo', (r) => !!r.tamanho_grupo],
    reais: ['valor em R$ no texto', (r) => r.valor_rs_no_texto === 'sim'],
    resposta: ['resposta do dono', (r) => r.resposta_dono === 'sim'],
    nova: ['não coletada antes', (r) => !jaColetada(r)],
  };

  function lerBusca(v) {
    v = v.trim();
    if (!v) return null;
    try { return new RegExp(v, 'i'); } catch (_) { return new RegExp(v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'); }
  }

  function passaFiltros(r) {
    if (!noPeriodo(r)) return false;
    if (filtros.temas.size) {
      const t = r.temas.split('; ');
      if (![...filtros.temas].some((k) => t.includes(ROTULO_TEMA[k]))) return false;
    }
    if (filtros.opiniao && r.opiniao !== filtros.opiniao) return false;
    for (const k of filtros.componentes) if (!COMPONENTES[k][1](r)) return false;
    if (filtros.busca && !(filtros.busca.test(r.texto_avaliacao) || filtros.busca.test(semAcento(r.texto_avaliacao)))) return false;
    return true;
  }

  // ---------- destaque das palavras que acionaram o filtro ----------

  const CORES = { tema: '#ffe08a', positiva: '#b9f0c0', negativa: '#ffc4c4', busca: '#bfe1ff' };

  function chaveDestaque() {
    if (!filtros.destacar) return '';
    const partes = [[...filtros.temas].join(','), filtros.opiniao, filtros.busca?.source || ''];
    return partes.some(Boolean) ? partes.join('|') : '';
  }

  function classeDoToken(tk) {
    if (filtros.opiniao) {
      if (NEGADORES.has(tk)) return 'negador';
      if (casaLista(tk, POSITIVAS)) return 'positiva';
      if (casaLista(tk, NEGATIVAS)) return 'negativa';
    }
    if ([...filtros.temas].some((k) => casaLista(tk, TEMAS[k]))) return 'tema';
    return '';
  }

  function limparDestaques(raiz) {
    const marcas = raiz.querySelectorAll('mark.tcc-destaque');
    if (!marcas.length) return;
    for (const m of marcas) m.replaceWith(document.createTextNode(m.textContent));
    raiz.normalize();
  }

  function marca(texto, classe) {
    const m = document.createElement('mark');
    m.className = 'tcc-destaque';
    m.textContent = texto;
    m.style.cssText = classe === 'negador'
      ? 'background:transparent;color:inherit;text-decoration:underline 2px #e8790c'
      : `background:${CORES[classe]};color:#111;border-radius:2px;padding:0 1px`;
    return m;
  }

  function destacarCartao(c, chave) {
    const corpo = corpoDoCartao(c);
    if (!corpo) return;
    const assinatura = `${chave}|${corpo.textContent.length}`;
    if (corpo.dataset.tccDestaque === assinatura) return;
    limparDestaques(corpo);
    corpo.dataset.tccDestaque = assinatura;
    if (!chave) return;
    const nos = [];
    const andarilho = document.createTreeWalker(corpo, NodeFilter.SHOW_TEXT);
    while (andarilho.nextNode()) nos.push(andarilho.currentNode);
    const buscaGlobal = filtros.busca && new RegExp(filtros.busca.source, 'gi');
    for (const no of nos) {
      const s = no.nodeValue;
      const trechos = []; // [início, fim, classe]
      if (buscaGlobal) {
        for (const m of s.matchAll(buscaGlobal)) if (m[0]) trechos.push([m.index, m.index + m[0].length, 'busca']);
      }
      for (const m of s.matchAll(/[\p{L}\p{N}$]+/gu)) {
        const classe = classeDoToken(semAcento(m[0]));
        if (classe && !trechos.some(([a, b]) => m.index < b && m.index + m[0].length > a)) trechos.push([m.index, m.index + m[0].length, classe]);
      }
      if (!trechos.length) continue;
      trechos.sort((a, b) => a[0] - b[0]);
      const frag = document.createDocumentFragment();
      let pos = 0;
      for (const [a, b, classe] of trechos) {
        if (a < pos) continue;
        if (a > pos) frag.appendChild(document.createTextNode(s.slice(pos, a)));
        frag.appendChild(marca(s.slice(a, b), classe));
        pos = b;
      }
      if (pos < s.length) frag.appendChild(document.createTextNode(s.slice(pos)));
      no.replaceWith(frag);
    }
  }

  function atualizarFiltrosNaPagina() {
    atualizarIdsConhecidos();
    const cs = cartoes();
    const chave = chaveDestaque();
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
      destacarCartao(c, ok ? chave : '');
    }
    if (el.contador) el.contador.textContent = cs.length ? `${passam} de ${cs.length} avaliações carregadas passam no período e nos filtros.` : '';
  }

  // ---------- som e preferências ----------

  const prefs = { som: GM_getValue('pref:som', true), autobaixar: GM_getValue('pref:autobaixar', true) };
  let audio = null;

  // O navegador só libera áudio depois de um clique: o painel chama isto a cada clique.
  function liberarAudio() {
    try { audio = audio || new AudioContext(); if (audio.state === 'suspended') audio.resume(); } catch (_) { audio = null; }
  }

  function tocar(ok = true) {
    if (!prefs.som) return;
    liberarAudio();
    if (!audio) return;
    (ok ? [880, 1320] : [440, 330]).forEach((f, i) => {
      const o = audio.createOscillator(), g = audio.createGain();
      o.frequency.value = f;
      o.connect(g); g.connect(audio.destination);
      const t = audio.currentTime + i * 0.22;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.3, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
      o.start(t); o.stop(t + 0.21);
    });
  }

  // ---------- coleta ----------

  let parar = false;
  let ocupado = false;
  let resultado = [];
  let alertaSeletores = '';
  let ultimoResumo = null;

  // Rola a lista até `alvo(cs)` devolver um motivo, até passar do período, até
  // carregar o volume total ou até a lista parar de crescer. Quando a lista
  // empaca, sobe um pouco, desce de novo e espera cada vez mais.
  async function rolarLista(caixa, alvo, { usarPeriodo = true, conferirOrdem = true, aCada = null } = {}) {
    let ultimoN = 0, semCrescer = 0, ordemConferida = !conferirOrdem, fator = 1;
    while (true) {
      if (parar) return 'interrompida';
      await expandirTextos();
      const cs = cartoes();
      status(`${cs.length} avaliações carregadas · a última: ${cs.length ? lerCartao(cs[cs.length - 1]).data_relativa || '?' : '?'}` +
        (semCrescer ? ` · esperando carregar (${semCrescer}/8)` : ''));
      atualizarFiltrosNaPagina();
      if (aCada) await aCada(cs);
      if (!ordemConferida && cs.length >= 10) {
        ordemConferida = true;
        if (ordemQuebrada(cs)) return 'ordem errada';
      }
      const motivo = alvo(cs);
      if (motivo) return motivo;
      const ultimas = cs.slice(-5).map((c) => lerCartao(c).idade_dias_aprox);
      if (usarPeriodo && periodo.ate !== Infinity && ultimas.length === 5 && ultimas.every((d) => d !== '' && d > periodo.ate)) return 'passou do período';
      const volume = +infoLugar().volume_avaliacoes_estabelecimento;
      if (volume && cs.length >= volume) return 'fim da lista';
      const noFim = caixa.scrollTop + caixa.clientHeight >= caixa.scrollHeight - 20;
      semCrescer = cs.length === ultimoN && noFim ? semCrescer + 1 : 0;
      if (semCrescer >= 8) return 'lista parou de crescer';
      ultimoN = cs.length;
      if (semCrescer) {
        fator = Math.min(fator * 1.5, 5);
        caixa.scrollBy(0, -400);
        await esperar(300);
      } else fator = 1;
      // O Maps carrega mais avaliações quando o último cartão entra na viewport.
      cs[cs.length - 1]?.scrollIntoView({ block: 'end' });
      caixa.scrollTo(0, caixa.scrollHeight);
      await esperar(sortear([1200, 2000]) * fator);
    }
  }

  const MSG_MOTIVO = {
    'interrompida': 'Interrompido.',
    'ordem errada': 'A lista não está em ordem de data: ordene por "Mais recentes" e colete de novo.',
    'passou do período': 'Passou do fim do período.',
    'fim da lista': 'Chegou ao fim da lista.',
    'lista parou de crescer': 'A lista parou de crescer (fim da lista ou carregamento lento; confira).',
    'alcançou coleta anterior': 'Encontrou 10 avaliações já coletadas seguidas.',
    'lista não encontrada': 'Lista de avaliações não encontrada.',
  };
  const COMPLETA = { 'passou do período': 'sim', 'fim da lista': 'sim', 'alcançou coleta anterior': 'sim', 'lista parou de crescer': 'incerta' };

  async function prepararLista() {
    const lugar = infoLugar();
    if (!lugar.nome_estabelecimento) { status('Abra um lugar no Maps primeiro.'); return null; }
    status('Abrindo a aba de avaliações…');
    if (!(await abrirAbaAvaliacoes())) {
      status('Não consegui abrir as avaliações. Abra a lista no Maps e tente novamente.');
      return null;
    }
    if (!el.jaOrdenado.checked) {
      status('Ordenando por mais recentes…');
      if (!(await ordenarRecentes())) { status('Não consegui ordenar sozinho. Ordene por "Mais recentes", marque "Já ordenei" e clique de novo.'); return null; }
    }
    await aguardar(() => cartoes().length > 0, 10000);
    const primeira = cartoes()[0];
    const caixa = primeira && rolavel(primeira);
    if (!caixa) { status('Lista de avaliações não encontrada (visualização limitada? entre na conta).'); return null; }
    return caixa;
  }

  // Linhas do CSV a partir dos cartões lidos (sem repetir review_id).
  async function montarLinhas(lidos, lugar, motivo, coletado_em, antes) {
    const vistos = new Set();
    const linhas = [];
    for (const r of lidos) {
      if (vistos.has(r.review_id)) continue;
      vistos.add(r.review_id);
      const { chave_autor, ...resto } = r;
      linhas.push({
        ...lugar,
        review_index: linhas.length + 1,
        autor_pseudonimo: chave_autor ? await pseudonimo(chave_autor) : '',
        ...resto,
        ja_coletada: antes.has(r.review_id) ? 'sim' : 'não',
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
    return linhas;
  }

  // Grava o que já foi lido, para recuperar se a página cair.
  async function salvarAndamento(lugar, linhas, motivo) {
    GM_setValue(CHAVE_ANDAMENTO, { lugar, motivo, quando: agora(), linhas });
    registrarIds(lugar, linhas, linhas[0]?.coletado_em || agora());
  }

  function linhaResumo(lugar, linhas, motivo) {
    const comTexto = linhas.filter((r) => r.tem_texto === 'sim').length;
    const noP = linhas.filter((r) => r.no_periodo === 'sim');
    const noPT = noP.filter((r) => r.tem_texto === 'sim').length;
    const finito = periodo.ate !== Infinity;
    const jMin = finito ? periodo.ate - periodo.de : 0;
    const jMax = finito ? fimDoRotulo(periodo.ate) + 1 - periodo.de : 0;
    const porMes = (j) => (j > 0 ? +(noPT / j * 30).toFixed(2) : '');
    return {
      data_coleta: agora(),
      place_id: lugar.place_id, id_maps: lugar.id_maps, nome_estabelecimento: lugar.nome_estabelecimento,
      avaliacao_media_estabelecimento: lugar.avaliacao_media_estabelecimento,
      volume_avaliacoes_estabelecimento: lugar.volume_avaliacoes_estabelecimento,
      lidas: linhas.length, com_texto: comTexto, sem_texto: linhas.length - comTexto,
      soma_confere: comTexto + (linhas.length - comTexto) === linhas.length ? 'sim' : 'não',
      novas: linhas.filter((r) => r.ja_coletada === 'não').length,
      no_periodo: noP.length, no_periodo_com_texto: noPT,
      periodo_de_dias: periodo.de, periodo_ate_dias: finito ? periodo.ate : 'sem limite',
      janela_dias_min: jMin || '', janela_dias_max: jMax || '',
      texto_por_mes_min: porMes(jMax), texto_por_mes_max: porMes(jMin),
      motivo_parada: motivo, coleta_completa: COMPLETA[motivo] || 'não', versao_script: VERSAO, url: location.href,
    };
  }

  async function coletar() {
    resultado = [];
    alertaSeletores = '';
    const lugarInicial = infoLugar();
    const caixa = await prepararLista();
    if (!caixa) {
      ultimoResumo = { ...linhaResumo(lugarInicial, [], 'lista não encontrada') };
      return 'lista não encontrada';
    }
    atualizarIdsConhecidos(true);
    const antes = new Set(idsConhecidos);
    const coletado_em = agora();
    let ultimoSalvo = 0;
    const lidosPorId = new Map();
    const guardarVisiveis = (cs) => {
      for (const c of cs) {
        const r = lerCartao(c);
        if (r.review_id) lidosPorId.set(r.review_id, r);
      }
    };

    const pararNasConhecidas = el.pararConhecidas.checked && antes.size > 0;
    const motivo = await rolarLista(caixa, (cs) => {
      if (!pararNasConhecidas) return null;
      const fim = cs.slice(-10);
      return fim.length === 10 && fim.every((c) => antes.has(c.dataset.reviewId)) ? 'alcançou coleta anterior' : null;
    }, {
      aCada: async (cs) => {
        guardarVisiveis(cs);
        if (Date.now() - ultimoSalvo < 5000) return;
        ultimoSalvo = Date.now();
        await salvarAndamento(infoLugar(), await montarLinhas([...lidosPorId.values()], infoLugar(), 'em andamento', coletado_em, antes), 'em andamento');
      },
    });
    await expandirTextos();
    await esperar(800);
    await expandirTextos();

    const lugar = infoLugar();
    guardarVisiveis(cartoes());
    const lidos = [...lidosPorId.values()];
    alertaSeletores = checarSeletores(lidos);
    resultado = await montarLinhas(lidos, lugar, motivo, coletado_em, antes);
    await salvarAndamento(lugar, resultado, motivo);
    ultimoResumo = linhaResumo(lugar, resultado, motivo);
    GM_setValue(CHAVE_RESUMOS, [...GM_getValue(CHAVE_RESUMOS, []), ultimoResumo]);
    atualizarIdsConhecidos(true);
    atualizarFiltrosNaPagina();
    mostrarResumo(motivo, lugar);
    return motivo;
  }

  // Rola até a primeira avaliação do período (para retomar uma coleta).
  async function localizarPeriodo() {
    const caixa = await prepararLista();
    if (!caixa) return;
    let alvo = null;
    const motivo = await rolarLista(caixa, (cs) => {
      alvo = cs.find((c) => noPeriodo(lerCartao(c)));
      return alvo ? 'achou' : null;
    });
    if (!alvo) { status(`Nenhuma avaliação no período. ${MSG_MOTIVO[motivo] || ''}`); return; }
    contornar(alvo);
    const r = lerCartao(alvo);
    status(`Primeira avaliação do período: "${r.data_relativa}", nota ${r.nota_avaliacao || '?'} (contorno amarelo).`);
  }

  let contornado = null;

  function contornar(c, fixo = false) {
    if (contornado && contornado !== c) contornado.style.outline = '';
    contornado = c;
    c.scrollIntoView({ block: 'center' });
    c.style.outline = '3px solid #e8a400';
    if (!fixo) setTimeout(() => { if (contornado === c) c.style.outline = ''; }, 6000);
  }

  function recuperarAndamento() {
    const a = GM_getValue(CHAVE_ANDAMENTO, null);
    if (!a || !a.linhas?.length) { status('Não há coleta salva.'); return; }
    resultado = a.linhas;
    alertaSeletores = checarSeletores(resultado);
    mostrarResumo(a.motivo, a.lugar);
    status(`Recuperada a coleta de ${a.lugar.nome_estabelecimento} (${a.quando}, ${a.motivo}): ${resultado.length} avaliações. Use os botões de CSV.`);
  }

  function mostrarResumo(motivo, lugar) {
    const noP = resultado.filter((r) => r.no_periodo === 'sim');
    const comTexto = resultado.filter((r) => r.tem_texto === 'sim').length;
    const semTexto = resultado.length - comTexto;
    const semData = resultado.filter((r) => r.idade_dias_aprox === '').length;
    const novas = resultado.filter((r) => r.ja_coletada === 'não').length;
    const avisos = [];
    if (!lugar.place_id && !lugar.id_maps) avisos.push('Sem place_id nem id_maps: cole o place_id do B1 no campo antes de exportar.');
    else if (!lugar.place_id) avisos.push('Sem place_id na URL: cole o do B1 no campo, se quiser.');
    if (alertaSeletores) avisos.push(alertaSeletores);
    status(`${MSG_MOTIVO[motivo] || ''} ${resultado.length} lidas (${comTexto} com texto + ${semTexto} sem; ${novas} novas) · ` +
      `${noP.length} no período, ${noP.filter((r) => r.tem_texto === 'sim').length} delas com texto` +
      (semData ? ` · ${semData} sem data reconhecida (confira)` : '') + '.' + (avisos.length ? `\n${avisos.join('\n')}` : ''));
  }

  // ---------- fila ----------

  function lerItensFila(texto) {
    return texto.split(/\n+/).map((s) => s.trim()).filter(Boolean).map((s) => {
      const pid = (s.match(/\b(ChIJ[\w-]+)/) || [])[1] || '';
      const url = /^https?:\/\//.test(s) ? s : pid ? `https://www.google.com/maps/place/?q=place_id:${pid}` : '';
      return url ? { url, place_id: pid } : null;
    }).filter(Boolean);
  }

  async function esperarContando(ms, texto) {
    const fim = Date.now() + ms;
    while (Date.now() < fim) {
      if (parar) return false;
      status(`${texto} ${Math.ceil((fim - Date.now()) / 1000)} s`);
      await esperar(500);
    }
    return true;
  }

  async function aguardar(cond, ms) {
    const fim = Date.now() + ms;
    while (Date.now() < fim) { if (cond()) return true; await esperar(500); }
    return false;
  }

  function iniciarFila() {
    const itens = lerItensFila(el.fila.value);
    if (!itens.length) { status('Fila vazia: uma URL do Maps ou um place_id por linha.'); return; }
    const antiga = GM_getValue(CHAVE_FILA, null);
    if (antiga && antiga.i < antiga.itens.length && !confirm(`Há uma fila em curso (${antiga.i}/${antiga.itens.length}). Substituir?`)) return;
    GM_setValue(CHAVE_FILA, { itens, i: 0, ativa: true, resumos: [], inicio: agora() });
    location.href = itens[0].url;
  }

  function continuarFila() {
    const fila = GM_getValue(CHAVE_FILA, null);
    if (!fila || fila.i >= fila.itens.length) { status('Não há fila para continuar.'); return; }
    fila.ativa = true;
    GM_setValue(CHAVE_FILA, fila);
    location.href = fila.itens[fila.i].url;
  }

  function encerrarFila(fila) {
    fila.ativa = false;
    GM_setValue(CHAVE_FILA, fila);
    baixarResumo(fila.resumos, 'fila');
    const ok = fila.resumos.filter((r) => r.coleta_completa === 'sim').length;
    status(`Fila concluída: ${fila.resumos.length} lugares (${ok} com coleta completa). CSV-resumo baixado.`);
    tocar(true);
  }

  // Roda ao carregar a página, se houver fila ativa.
  async function rodarFilaNestaPagina() {
    const fila = GM_getValue(CHAVE_FILA, null);
    if (!fila || !fila.ativa) return;
    const item = fila.itens[fila.i];
    if (!item) { encerrarFila(fila); return; }
    placeIdFila = item.place_id || '';
    ocupado = true; atualizarBotoes();
    try {
      status(`Fila ${fila.i + 1}/${fila.itens.length}: esperando o lugar carregar…`);
      let resumo;
      if (!(await aguardar(() => infoLugar().nome_estabelecimento, 45000))) {
        resumo = { data_coleta: agora(), place_id: item.place_id, url: item.url, motivo_parada: 'lugar não carregou', coleta_completa: 'não', versao_script: VERSAO };
      } else {
        await esperar(2500);
        el.jaOrdenado.checked = false;
        status(`Fila ${fila.i + 1}/${fila.itens.length}: coletando ${infoLugar().nome_estabelecimento}…`);
        let motivo;
        try { motivo = await coletar(); } catch (e) { motivo = `erro: ${e.message}`; }
        resumo = ultimoResumo || { data_coleta: agora(), place_id: item.place_id, url: item.url, motivo_parada: motivo, coleta_completa: 'não' };
        if (resultado.length) baixar(resultado, 'tudo', { forcar: true });
      }
      fila.resumos.push(resumo);
      fila.i++;
      if (parar) {
        fila.ativa = false;
        GM_setValue(CHAVE_FILA, fila);
        status(`Fila pausada em ${fila.i}/${fila.itens.length}. "Continuar fila" retoma do próximo lugar.`);
        tocar(false);
        return;
      }
      GM_setValue(CHAVE_FILA, fila);
      if (fila.i >= fila.itens.length) { encerrarFila(fila); return; }
      if (!(await esperarContando(sortear(PAUSA_FILA), `Fila ${fila.i}/${fila.itens.length} pronto. Próximo lugar em`))) {
        fila.ativa = false;
        GM_setValue(CHAVE_FILA, fila);
        status(`Fila pausada em ${fila.i}/${fila.itens.length}. "Continuar fila" retoma do próximo lugar.`);
        return;
      }
      location.href = fila.itens[fila.i].url;
    } finally {
      ocupado = false; atualizarBotoes();
    }
  }

  // ---------- conferência (fidelidade) ----------

  let conferida = null; // { id, pagina, registro, nome }

  const lerConf = () => GM_getValue(CHAVE_CONF, null) || { ids: [], i: 0, marcas: {} };

  function iniciarConferencia() {
    const ids = [...new Set(el.confIds.value.split(/[\s;,]+/).map((s) => s.trim()).filter(Boolean))];
    if (!ids.length) { status('Cole os review_id sorteados, um por linha.'); return; }
    const antiga = lerConf();
    if (Object.keys(antiga.marcas).length && !confirm('Começar outra conferência apaga as marcas da atual. Exporte antes. Continuar?')) return;
    GM_setValue(CHAVE_CONF, { ids, i: 0, marcas: {} });
    conferida = null;
    mostrarConferencia();
  }

  function moverConferencia(passo) {
    const conf = lerConf();
    conf.i = Math.max(0, Math.min(conf.ids.length - 1, conf.i + passo));
    GM_setValue(CHAVE_CONF, conf);
    conferida = null;
    mostrarConferencia();
  }

  const normalizarTexto = (t) => semAcento(t).replace(/\s+/g, ' ').trim();

  function mostrarConferencia() {
    const conf = lerConf();
    const id = conf.ids[conf.i];
    if (!id) { el.confInfo.textContent = 'Sem conferência em curso.'; return; }
    const dono = lugarDoId(id);
    const marcada = conf.marcas[id];
    const feitas = Object.keys(conf.marcas).length;
    let t = `${conf.i + 1}/${conf.ids.length} (${feitas} marcadas) · ${id}\n`;
    t += dono ? `Lugar: ${dono.nome}` : 'Lugar: desconhecido (id não está no registro deste navegador)';
    if (dono) {
      const [nota, data, texto, quando] = dono.registro;
      t += `\nColetado (${quando}): nota ${nota || '?'} · ${data || '?'} · "${texto.slice(0, 90)}${texto.length > 90 ? '…' : ''}"`;
    }
    if (conferida?.id === id) {
      const p = conferida.pagina;
      t += `\nNa página: nota ${p.nota_avaliacao || '?'} · ${p.data_relativa || '?'} · "${p.texto_avaliacao.slice(0, 90)}${p.texto_avaliacao.length > 90 ? '…' : ''}"`;
      if (dono) {
        const [nota, , texto] = dono.registro;
        t += `\nAutomático: nota ${nota === p.nota_avaliacao ? 'confere' : 'DIVERGE'} · texto ${normalizarTexto(p.texto_avaliacao).startsWith(normalizarTexto(texto)) ? 'confere' : 'DIVERGE'}`;
      }
    }
    if (marcada) t += `\nMarcada: ${marcada.resultado}${marcada.observacao ? ` (${marcada.observacao})` : ''}`;
    el.confInfo.textContent = t;
    el.confAbrir.disabled = !dono || chaveLugar(infoLugar()) === dono.chave;
  }

  async function acharConferida() {
    const conf = lerConf();
    const id = conf.ids[conf.i];
    if (!id) return;
    const dono = lugarDoId(id);
    if (dono && dono.chave !== chaveLugar(infoLugar())) { status(`Esta avaliação é de ${dono.nome}: clique em "Abrir lugar".`); return; }
    let alvo = cartaoPorId(id);
    if (!alvo) {
      const caixa = await prepararLista();
      if (!caixa) return;
      const motivo = await rolarLista(caixa, () => ((alvo = cartaoPorId(id)) ? 'achou' : null), { usarPeriodo: false, conferirOrdem: false });
      if (!alvo) { status(`Não achei ${id}. ${MSG_MOTIVO[motivo] || motivo}`); return; }
    }
    await expandirTextos();
    contornar(alvo, true);
    conferida = { id, pagina: lerCartao(alvo) };
    status('Avaliação contornada em amarelo. Compare e marque ✓ ou ✗.');
    mostrarConferencia();
  }

  function marcarConferencia(resultadoConf) {
    const conf = lerConf();
    const id = conf.ids[conf.i];
    if (!id) return;
    const observacao = resultadoConf === 'diverge' ? (prompt('O que diverge? (nota, data, texto…)') || '') : '';
    const dono = lugarDoId(id);
    const p = conferida?.id === id ? conferida.pagina : null;
    const [nota, data, texto, quando] = dono?.registro || ['', '', '', ''];
    conf.marcas[id] = {
      review_id: id, nome_estabelecimento: dono?.nome || infoLugar().nome_estabelecimento, coletado_em: quando,
      nota_coletada: nota, nota_pagina: p?.nota_avaliacao ?? '', nota_confere_auto: p ? (nota === p.nota_avaliacao ? 'sim' : 'não') : '',
      data_coletada: data, data_pagina: p?.data_relativa ?? '',
      texto_confere_auto: p ? (normalizarTexto(p.texto_avaliacao).startsWith(normalizarTexto(texto)) ? 'sim' : 'não') : '',
      resultado: resultadoConf, observacao, conferido_em: agora(),
    };
    const proximo = conf.ids[conf.i + 1];
    if (conf.i < conf.ids.length - 1) conf.i++;
    GM_setValue(CHAVE_CONF, conf);
    conferida = null;
    mostrarConferencia();
    // Próxima no mesmo lugar: já procura.
    if (proximo && lugarDoId(proximo)?.chave === chaveLugar(infoLugar())) executar(acharConferida);
  }

  function abrirLugarConferido() {
    const id = lerConf().ids[lerConf().i];
    const dono = id && lugarDoId(id);
    if (dono?.url) location.href = dono.url;
  }

  // ---------- exportação ----------

  const COLS = ['place_id', 'id_maps', 'nome_estabelecimento', 'avaliacao_media_estabelecimento', 'volume_avaliacoes_estabelecimento',
    'review_index', 'review_id', 'ja_coletada', 'autor_pseudonimo', 'origem_pseudonimo', 'nota_avaliacao', 'data_relativa', 'editada',
    'idade_dias_aprox', 'data_min', 'data_max', 'no_periodo', 'tem_texto', 'texto_avaliacao', 'traduzida', 'texto_original',
    'detalhes', 'tipo_servico', 'tipo_refeicao', 'preco_por_pessoa', 'tamanho_grupo', 'tempo_espera', 'reserva', 'estacionamento',
    'pratos_recomendados', 'notas_por_aspecto', 'n_fotos', 'urls_fotos', 'provavel_cardapio', 'valor_rs_no_texto', 'temas', 'opiniao',
    'resposta_dono', 'texto_resposta', 'periodo_de_dias', 'periodo_ate_dias', 'motivo_parada', 'coleta_completa', 'versao_script',
    'coletado_em', 'url'];
  const COLS_RESUMO = ['data_coleta', 'place_id', 'id_maps', 'nome_estabelecimento', 'avaliacao_media_estabelecimento',
    'volume_avaliacoes_estabelecimento', 'lidas', 'com_texto', 'sem_texto', 'soma_confere', 'novas', 'no_periodo',
    'no_periodo_com_texto', 'periodo_de_dias', 'periodo_ate_dias', 'janela_dias_min', 'janela_dias_max', 'texto_por_mes_min',
    'texto_por_mes_max', 'motivo_parada', 'coleta_completa', 'versao_script', 'url'];
  const COLS_CONF = ['review_id', 'nome_estabelecimento', 'coletado_em', 'nota_coletada', 'nota_pagina', 'nota_confere_auto',
    'data_coletada', 'data_pagina', 'texto_confere_auto', 'resultado', 'observacao', 'conferido_em'];

  function celula(v) {
    const s = String(v ?? '');
    return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  }

  const csv = (linhas, cols) => '﻿' + [cols.join(';'), ...linhas.map((l) => cols.map((c) => celula(l[c])).join(';'))].join('\r\n');
  const nomeArquivo = (t) => String(t || 'lugar').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\w]+/g, '_').replace(/^_|_$/g, '').toLowerCase();

  function salvarArquivo(nome, conteudo) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([conteudo], { type: 'text/csv;charset=utf-8' }));
    a.download = nome;
    document.documentElement.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 2000);
  }

  function baixar(linhas, sufixo, { forcar = false } = {}) {
    if (!resultado.length) { status('Nada para exportar: colete ou recupere uma coleta primeiro.'); return; }
    if (!linhas.length) { status('Nenhuma avaliação coletada passa neste recorte.'); return; }
    if (alertaSeletores && !forcar && !confirm(`${alertaSeletores}\n\nExportar mesmo assim?`)) return;
    // O place_id colado depois da coleta também entra.
    const placeId = el.placeId.value.trim();
    const saida = linhas.map((l) => (l.place_id || !placeId ? l : { ...l, place_id: placeId }));
    salvarArquivo(`${dataLocal(new Date())}_${nomeArquivo(linhas[0].nome_estabelecimento)}_maps_avaliacoes_${sufixo}.csv`, csv(saida, COLS));
  }

  function baixarResumo(linhas, sufixo) {
    if (!linhas.length) { status('Sem coletas no histórico.'); return; }
    salvarArquivo(`${dataLocal(new Date())}_maps_avaliacoes_resumo_${sufixo}.csv`, csv(linhas, COLS_RESUMO));
  }

  function baixarConferencia() {
    const marcas = Object.values(lerConf().marcas);
    if (!marcas.length) { status('Nenhuma avaliação marcada na conferência.'); return; }
    salvarArquivo(`${dataLocal(new Date())}_maps_avaliacoes_conferencia.csv`, csv(marcas, COLS_CONF));
  }

  // ---------- painel (padrão: canto superior direito, shadow DOM, fora do <body>) ----------
  // Na lateral direita. Se o painel de horários de pico estiver aberto, fica logo abaixo dele.

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

  function atualizarBotoes() {
    for (const b of el.acoes || []) b.disabled = ocupado;
    if (el.parar) el.parar.disabled = !ocupado;
  }

  async function executar(fn, { avisar = false } = {}) {
    if (ocupado) return;
    ocupado = true; parar = false; atualizarBotoes();
    let ok = true;
    try { await fn(); } catch (e) { ok = false; status(`Erro: ${e.message}`); }
    ocupado = false; atualizarBotoes();
    if (avisar) tocar(ok && !parar);
  }

  const CSS = `
    #painel{position:fixed;top:12px;right:12px;z-index:2147483647;width:340px;
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
    button.toggle[aria-pressed=true]{background:#2e7d32;border-color:#2e7d32;color:#fff}
    select,input[type=text],input[type=search]{font:inherit;color:inherit;background:transparent;border:1px solid #888;border-radius:6px;padding:3px}
    input[type=text],input[type=search]{flex:1 1 auto;min-width:0}
    select option{color:#111}
    textarea{width:100%;box-sizing:border-box;height:60px;font:12px monospace;background:transparent;color:inherit;border:1px solid #888;border-radius:6px}
    .status,.info{font-size:12px;opacity:.85;white-space:pre-line}
    .info{background:#8881;border-radius:6px;padding:4px 6px}
    .contador{font-size:12px;opacity:.75}
    .legenda span{padding:0 4px;border-radius:3px;color:#111;font-size:11px}`;

  const OPCOES_PERIODO = [[0, 'agora'], [7, '1 semana'], [14, '2 semanas'], [21, '3 semanas'], [28, '4 semanas'],
    [30, '1 mês'], ...[2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((n) => [30 * n, `${n} meses`]),
    [365, '1 ano'], ...[2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => [365 * n, `${n} anos`])];

  function montarPainel() {
    const botao = (texto, fn) => criar('button', { textContent: texto, onclick: fn });
    const caixa = (rotulo, aoMudar, classe = 'inline', marcado = false) => {
      const i = criar('input', { type: 'checkbox', checked: marcado, onchange: (e) => { aoMudar(e.target.checked); atualizarFiltrosNaPagina(); } });
      return criar('label', { className: classe }, [i, ` ${rotulo}`]);
    };
    const alternar = (conjunto, k) => (marcado) => { if (marcado) conjunto.add(k); else conjunto.delete(k); };
    const toggle = (rotulo, chave) => {
      const b = criar('button', { className: 'toggle' });
      const pintar = () => { b.setAttribute('aria-pressed', String(prefs[chave])); b.textContent = `${rotulo}: ${prefs[chave] ? 'ligado' : 'desligado'}`; };
      b.onclick = () => { prefs[chave] = !prefs[chave]; GM_setValue(`pref:${chave}`, prefs[chave]); pintar(); if (chave === 'som' && prefs.som) tocar(true); };
      pintar();
      return b;
    };

    el.status = criar('p', { className: 'status', textContent: 'Abra um lugar e clique em "Coletar avaliações".' });
    el.contador = criar('p', { className: 'contador' });
    el.jaOrdenado = criar('input', { type: 'checkbox' });
    el.pararConhecidas = criar('input', { type: 'checkbox' });
    el.placeId = criar('input', { type: 'text', placeholder: 'place_id do B1 (se faltar na URL)' });

    const seletorDe = criar('select', { onchange: (e) => { periodo.de = +e.target.value; atualizarFiltrosNaPagina(); } },
      OPCOES_PERIODO.map(([v, t]) => criar('option', { value: v, textContent: t })));
    const seletorAte = criar('select', { onchange: (e) => { periodo.ate = e.target.value === 'tudo' ? Infinity : +e.target.value; atualizarFiltrosNaPagina(); } },
      [...OPCOES_PERIODO.slice(1).map(([v, t]) => criar('option', { value: v, textContent: t })), criar('option', { value: 'tudo', textContent: 'sem limite' })]);
    seletorAte.value = '30';

    const bColetar = botao('Coletar avaliações', () => executar(async () => {
      const motivo = await coletar();
      if (prefs.autobaixar && resultado.length) baixar(resultado, 'tudo');
      if (motivo === 'ordem errada' || motivo === 'lista não encontrada') throw new Error(MSG_MOTIVO[motivo]);
    }, { avisar: true }));
    const bLocalizar = botao('Localizar período', () => executar(localizarPeriodo));
    const bRecuperar = botao('Recuperar última coleta', recuperarAndamento);
    el.parar = botao('Parar', () => { parar = true; status('Parando…'); });
    el.parar.disabled = true;

    const seletorOpiniao = criar('select', { onchange: (e) => { filtros.opiniao = e.target.value; atualizarFiltrosNaPagina(); } }, [
      criar('option', { value: '', textContent: 'qualquer' }),
      criar('option', { value: 'positiva', textContent: 'positiva (nota 5 + palavra positiva)' }),
      criar('option', { value: 'negativa', textContent: 'negativa (nota ≤ 4 + palavra negativa)' }),
    ]);
    const busca = criar('input', { type: 'search', placeholder: 'Busca no texto (ex.: rodízio|couvert)',
      oninput: (e) => { filtros.busca = lerBusca(e.target.value); atualizarFiltrosNaPagina(); } });

    const legenda = criar('div', { className: 'legenda contador' }, ['Destaques: ',
      criar('span', { textContent: 'tema', style: `background:${CORES.tema}` }), ' ',
      criar('span', { textContent: 'positiva', style: `background:${CORES.positiva}` }), ' ',
      criar('span', { textContent: 'negativa', style: `background:${CORES.negativa}` }), ' ',
      criar('span', { textContent: 'busca', style: `background:${CORES.busca}` }), ' negação sublinhada']);

    const filtrosUI = criar('details', { open: true }, [
      criar('summary', { textContent: 'Filtros' }),
      criar('div', { className: 'titulo', textContent: 'Tema mencionado (qualquer um)' }),
      criar('div', {}, Object.keys(TEMAS).map((k) => caixa(ROTULO_TEMA[k], alternar(filtros.temas, k)))),
      criar('div', { className: 'linha' }, [criar('span', { className: 'titulo', textContent: 'Opinião' }), seletorOpiniao]),
      criar('div', { className: 'titulo', textContent: 'Componentes (todos os marcados)' }),
      criar('div', {}, Object.entries(COMPONENTES).map(([k, [rotulo]]) => caixa(rotulo, alternar(filtros.componentes, k)))),
      criar('div', { className: 'linha' }, [busca]),
      caixa('Esmaecer na página o que fica fora do período e dos filtros', (m) => { filtros.esmaecer = m; }, ''),
      caixa('Destacar as palavras que acionaram o filtro', (m) => { filtros.destacar = m; }, '', true),
      legenda,
      el.contador,
    ]);

    el.fila = criar('textarea', { placeholder: 'Fila: uma URL do Maps ou um place_id por linha' });
    const bFila = botao('Iniciar fila', iniciarFila);
    const bContinuarFila = botao('Continuar fila', continuarFila);
    const bResumo = botao('CSV-resumo (histórico)', () => baixarResumo(GM_getValue(CHAVE_RESUMOS, []), 'historico'));
    const bLimparResumo = botao('Limpar histórico', () => {
      if (confirm('Apagar o histórico de resumos? Exporte antes.')) { GM_setValue(CHAVE_RESUMOS, []); status('Histórico de resumos apagado.'); }
    });
    const bEsquecer = botao('Esquecer ids deste lugar', () => {
      const chave = chaveLugar(infoLugar());
      if (chave && confirm(`Esquecer os review_id já coletados de ${infoLugar().nome_estabelecimento}? A conferência deles deixa de achar o lugar.`)) {
        GM_deleteValue(PREFIXO_LUGAR + chave); atualizarIdsConhecidos(true); atualizarFiltrosNaPagina(); status('Ids esquecidos.');
      }
    });
    const retomadaUI = criar('details', {}, [
      criar('summary', { textContent: 'Retomada, fila e resumo' }),
      criar('label', {}, [el.pararConhecidas, ' Parar ao encontrar 10 já coletadas seguidas']),
      criar('div', { className: 'linha' }, [bRecuperar, bEsquecer]),
      el.fila,
      criar('div', { className: 'linha' }, [bFila, bContinuarFila]),
      criar('div', { className: 'linha' }, [bResumo, bLimparResumo]),
    ]);

    el.confIds = criar('textarea', { placeholder: 'Conferência: review_id sorteados, um por linha' });
    el.confInfo = criar('p', { className: 'info' });
    el.confAbrir = botao('Abrir lugar', abrirLugarConferido);
    const bAchar = botao('Achar na página', () => executar(acharConferida));
    const conferenciaUI = criar('details', { ontoggle: mostrarConferencia }, [
      criar('summary', { textContent: 'Conferência de fidelidade' }),
      el.confIds,
      criar('div', { className: 'linha' }, [botao('Começar', iniciarConferencia), botao('◀', () => moverConferencia(-1)), botao('▶', () => moverConferencia(1))]),
      el.confInfo,
      criar('div', { className: 'linha' }, [el.confAbrir, bAchar]),
      criar('div', { className: 'linha' }, [botao('✓ confere', () => marcarConferencia('confere')), botao('✗ diverge', () => marcarConferencia('diverge'))]),
      criar('div', { className: 'linha' }, [botao('CSV da conferência', baixarConferencia)]),
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
          pseudonimos.clear();
          status('Sal importado.');
        }),
      ]),
    ]);

    el.acoes = [bColetar, bLocalizar, bRecuperar, bFila, bContinuarFila, bAchar];

    const minimizar = criar('span', { textContent: '–' });
    const cabecalho = criar('header', {}, [criar('span', { textContent: 'Avaliações do Maps' }), minimizar]);
    const painel = criar('div', { id: 'painel' }, [
      cabecalho,
      criar('div', { className: 'linha' }, [toggle('🔔 Som ao concluir', 'som'), toggle('⬇ Download automático', 'autobaixar')]),
      criar('div', { className: 'linha' }, ['Período: de', seletorDe, 'até', seletorAte]),
      criar('label', {}, [el.jaOrdenado, ' Já ordenei por "Mais recentes"']),
      criar('div', { className: 'linha' }, [bColetar, el.parar]),
      criar('div', { className: 'linha' }, [bLocalizar]),
      filtrosUI,
      criar('div', { className: 'linha' }, [
        botao('CSV do período (com texto)', () => baixar(resultado.filter((r) => noPeriodo(r) && r.tem_texto === 'sim'), 'periodo')),
        botao('CSV dos filtros', () => baixar(resultado.filter(passaFiltros), 'filtros')),
        botao('CSV de tudo', () => baixar(resultado, 'tudo')),
      ]),
      criar('div', { className: 'linha' }, [el.placeId]),
      retomadaUI,
      conferenciaUI,
      salUI,
      el.status,
    ]);
    cabecalho.onclick = () => { painel.classList.toggle('min'); minimizar.textContent = painel.classList.contains('min') ? '+' : '–'; };
    painel.addEventListener('click', liberarAudio);
    el.painel = painel;

    hospedeiro = criar('div', { id: 'tcc-avaliacoes-hospedeiro' });
    const raiz = hospedeiro.attachShadow({ mode: 'open' });
    raiz.appendChild(criar('style', { textContent: CSS }));
    raiz.appendChild(painel);
    atualizarBotoes();
  }

  function posicionarPainel() {
    const picos = document.getElementById('tcc-picos-hospedeiro')?.shadowRoot?.getElementById('painel');
    const r = picos?.getBoundingClientRect();
    const topo = r && r.height ? Math.round(r.bottom + 8) : 12;
    if (el.painel.style.top !== `${topo}px`) {
      el.painel.style.top = `${topo}px`;
      el.painel.style.maxHeight = `calc(100vh - ${topo + 12}px)`;
    }
  }

  function garantirPainel() {
    if (!hospedeiro) montarPainel();
    if (!hospedeiro.isConnected) document.documentElement.appendChild(hospedeiro);
    posicionarPainel();
    // Ao trocar de lugar, "Já ordenei" e o place_id colado deixam de valer.
    const nome = infoLugar().nome_estabelecimento;
    if (nome && nome !== ultimoLugar) {
      if (ultimoLugar && !ocupado) { el.jaOrdenado.checked = false; el.placeId.value = ''; }
      ultimoLugar = nome;
    }
    if (!ocupado && !el.painel.classList.contains('min')) atualizarFiltrosNaPagina();
  }

  function avisosAoAbrir() {
    const fila = GM_getValue(CHAVE_FILA, null);
    if (fila && !fila.ativa && fila.i < fila.itens.length) {
      el.fila.value = fila.itens.map((x) => x.place_id || x.url).join('\n');
      status(`Fila pausada em ${fila.i}/${fila.itens.length}. "Continuar fila" retoma do próximo lugar.`);
      return;
    }
    const a = GM_getValue(CHAVE_ANDAMENTO, null);
    if (a?.motivo === 'em andamento') status(`A coleta de ${a.lugar.nome_estabelecimento} (${a.quando}) não terminou: ${a.linhas.length} avaliações salvas. Use "Recuperar última coleta".`);
    const conf = lerConf();
    if (conf.ids.length) el.confIds.value = conf.ids.join('\n');
  }

  console.info('[Avaliações do Maps] carregado');
  garantirPainel();
  avisosAoAbrir();
  setInterval(() => { try { garantirPainel(); } catch (e) { console.error('[Avaliações do Maps]', e); } }, 1500);
  rodarFilaNestaPagina();
})();
