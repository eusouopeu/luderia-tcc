// ==UserScript==
// @name         Coletor de avaliações do Google Maps (TCC Luderia)
// @namespace    tcc-luderia
// @version      2026.10.30-1
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
 * O placar mostra confere, diverge, faltam e a fidelidade com intervalo de Wilson (95%).
 *
 * Filtros (tema, opinião, componentes, busca) e período valem para o CSV "dos
 * filtros", para esmaecer ou ocultar na página o que fica de fora e para destacar no texto
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
 *  - As setas ao lado de "Filtros" (ou Enter e Shift+Enter na busca) vão ao próximo
 *    e ao anterior que passa, como o "localizar na página" do navegador. A seção
 *    "Comentários filtrados" lista os que passam; clicar num item rola até ele.
 *  - Período e filtros ficam salvos: valem depois de recarregar e em cada lugar da fila.
 *  - "Fora do filtro" (Manter, Esmaecer ou Ocultar) decide o que a página faz com os
 *    comentários que não passam. Ocultar não age durante a coleta, para não mexer na
 *    rolagem da lista; os comentários reaparecem ao fim.
 *
 * Recibo dos filtros: cada CSV diz com que entradas foi gerado, para que o arquivo
 * seja auditável sem a memória de quem coletou.
 *  - Na coleta (colunas periodo_de_dias, periodo_ate_dias, coleta_parar_em_conhecidas,
 *    coleta_ordenacao_manual): o período e as opções valem no momento em que a lista
 *    foi rolada, e ficam gravados em cada linha, inclusive na coleta recuperada.
 *  - Na exportação (colunas recibo_*): o recorte do arquivo (tudo, período ou filtros),
 *    o período, os temas, a opinião, os componentes e a busca realmente aplicados às
 *    linhas, e a data e hora do arquivo. No recorte "tudo", nada foi aplicado.
 *  - O CSV-resumo leva as mesmas entradas da coleta.
 *
 * Painel: arraste pelo cabeçalho e redimensione pelo canto inferior direito; posição
 * e tamanho ficam salvos. Duplo clique no cabeçalho volta ao canto, no tamanho padrão.
 * Durante a coleta, uma barra mostra o maior entre carregadas ÷ volume do lugar e
 * idade da última ÷ fim do período; na fila, outra barra mostra o lugar atual.
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
 * Texto cortado: o "Mais" esconde o fim do texto e também as notas, o preço e os
 * demais detalhes. "texto_expandido" = não marca o cartão que ficou com "Mais"
 * sem expandir (a coleta avisa ao terminar e na exportação); recolete o lugar.
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

  // "Mais" ainda por clicar: texto, notas, preço ou resposta do dono cortados.
  const botoesMais = (c) => [...c.querySelectorAll('button, [role="button"]')]
    .filter((b) => b.classList.contains('w8nwRe') || /^(mais|more|ver mais|see more)$/i.test(textoControle(b)));

  // Clica em "Ver original" (para ler o texto no idioma do autor) e em "Mais", e
  // repete enquanto sobrar "Mais": o original volta cortado, e o Maps às vezes
  // ignora o clique ou redesenha o cartão recolhido.
  async function expandirTextos() {
    let n = 0;
    for (let rodada = 0; rodada < 3; rodada++) {
      let cliques = 0;
      for (const c of cartoes()) {
        for (const b of c.querySelectorAll('button, [role="button"]')) {
          if (b.dataset.tccOriginal || !/^(ver original|see original)/i.test(textoControle(b))) continue;
          b.dataset.tccOriginal = '1';
          b.click();
          cliques++;
        }
      }
      if (cliques) await esperar(400);
      for (const c of cartoes()) {
        for (const b of botoesMais(c)) {
          if (rodada) b.scrollIntoView?.({ block: 'nearest' });
          b.click();
          cliques++;
        }
      }
      if (!cliques) break;
      n += cliques;
      await esperar(400);
    }
    return n;
  }

  // A leitura expandida vale mais que uma releitura do cartão recolhido.
  const leituraMelhor = (antiga, nova) =>
    (antiga?.texto_expandido === 'sim' && nova.texto_expandido !== 'sim' ? antiga : nova);

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
      texto_expandido: botoesMais(c).length ? 'não' : 'sim',
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

  // Aviso quando as classes do Google mudam e a leitura sai vazia, ou quando
  // sobra "Mais" sem expandir.
  function checarSeletores(linhas) {
    const n = linhas.length;
    const cortadas = linhas.filter((r) => r.texto_expandido === 'não').length;
    const avisoCortadas = cortadas
      ? `${cortadas} avaliação(ões) com texto cortado ("Mais" sem expandir; texto_expandido = não). Colete o lugar de novo.` : '';
    if (n < 5) return avisoCortadas;
    const falhas = [];
    if (linhas.filter((r) => !r.nota_avaliacao).length / n > 0.5) falhas.push('nota');
    if (linhas.filter((r) => r.idade_dias_aprox === '').length / n > 0.5) falhas.push('data');
    if (n >= 20 && !linhas.some((r) => r.tem_texto === 'sim')) falhas.push('texto');
    if (linhas.filter((r) => !r.origem_pseudonimo).length / n > 0.5) falhas.push('autor');
    const avisoSeletores = falhas.length ? `Seletores quebrados? Mais da metade sem ${falhas.join(', ')}. Confira a página antes de usar o CSV.` : '';
    return [avisoSeletores, avisoCortadas].filter(Boolean).join(' ');
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
  const filtros = { temas: new Set(), opiniao: '', componentes: new Set(), busca: null, buscaTexto: '', fora: '', destacar: true };

  // Período e filtros ficam salvos no Tampermonkey: valem depois de recarregar a
  // página e em cada lugar da fila.
  const CHAVE_FILTROS = 'pref:filtros';

  const filtrosParaSalvar = () => ({
    de: periodo.de, ate: periodo.ate === Infinity ? 'tudo' : periodo.ate,
    temas: [...filtros.temas], opiniao: filtros.opiniao, componentes: [...filtros.componentes],
    busca: filtros.buscaTexto, fora: filtros.fora, destacar: filtros.destacar,
  });

  function carregarFiltros(s) {
    if (!s) return;
    if (Number.isFinite(+s.de)) periodo.de = +s.de;
    periodo.ate = s.ate === 'tudo' ? Infinity : Number.isFinite(+s.ate) ? +s.ate : 30;
    filtros.temas = new Set((s.temas || []).filter((k) => k in TEMAS));
    filtros.componentes = new Set((s.componentes || []).filter((k) => k in COMPONENTES));
    filtros.opiniao = ['positiva', 'negativa'].includes(s.opiniao) ? s.opiniao : '';
    filtros.buscaTexto = String(s.busca || '');
    filtros.busca = lerBusca(filtros.buscaTexto);
    // Antes havia só o liga/desliga "esmaecer"; o valor antigo vira "esmaecer".
    filtros.fora = ['esmaecer', 'ocultar'].includes(s.fora) ? s.fora : s.esmaecer ? 'esmaecer' : '';
    filtros.destacar = s.destacar !== false;
  }

  const salvarFiltros = () => GM_setValue(CHAVE_FILTROS, filtrosParaSalvar());
  const filtrosAtivos = () => filtros.temas.size + filtros.componentes.size + (filtros.opiniao ? 1 : 0) + (filtros.buscaTexto.trim() ? 1 : 0);

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

  // Só refaz o trabalho na página quando a lista mudou (observador de mutações) ou
  // quando mudou o lugar; mudanças de filtro chamam sem `seMudou` e sempre refazem.
  let paginaMudou = true;
  let listaObservada = null;
  let observador = null;
  let chaveAplicada = '';

  function vigiarLista() {
    const primeiro = cartoes()[0];
    const raiz = primeiro ? (rolavel(primeiro) || primeiro.parentElement) : null;
    if (raiz === listaObservada) return;
    observador?.disconnect();
    listaObservada = raiz;
    paginaMudou = true;
    if (!raiz) return;
    observador = observador || new MutationObserver(() => { paginaMudou = true; });
    observador.observe(raiz, { childList: true, subtree: true, characterData: true });
  }

  // O que a página faz com um comentário que não passa: nada, esmaece ou oculta. Durante a
  // coleta o ocultar vira esmaecer, porque a rolagem depende da altura da lista.
  function aplicarForaDoFiltro(c, ok) {
    const modo = ok ? '' : filtros.fora === 'ocultar' && ocupado ? 'esmaecer' : filtros.fora;
    const marca = c.dataset.tccFora || '';
    if (modo === marca) return;
    if (marca === 'esmaecer') c.style.opacity = '';
    if (marca === 'ocultar') c.style.display = '';
    if (modo === 'esmaecer') { c.style.transition = 'opacity .2s'; c.style.opacity = '0.25'; }
    if (modo === 'ocultar') c.style.display = 'none';
    if (modo) c.dataset.tccFora = modo; else delete c.dataset.tccFora;
  }

  function atualizarFiltrosNaPagina({ seMudou = false } = {}) {
    atualizarIdsConhecidos();
    const chaveAgora = `${chaveIdsConhecidos}|${idsConhecidos.size}|${filtros.fora}|${ocupado}`;
    if (seMudou && !paginaMudou && chaveAgora === chaveAplicada) return;
    paginaMudou = false;
    chaveAplicada = chaveAgora;
    const cs = cartoes();
    const chave = chaveDestaque();
    const passam = [];
    for (const c of cs) {
      const ok = passaFiltros(lerCartao(c));
      if (ok) passam.push(c);
      aplicarForaDoFiltro(c, ok);
      destacarCartao(c, ok ? chave : '');
    }
    if (el.contagem) {
      el.contagem.textContent = `${passam.length} de ${cs.length}`;
      const i = passam.indexOf(contornado);
      el.navPos.textContent = i >= 0 ? `${i + 1}/${passam.length}` : '';
    }
    atualizarListaFiltrados(passam);
  }

  // Avança ou volta entre os comentários carregados que passam nos filtros,
  // como o "localizar na página" do navegador (dá a volta nas pontas).
  const proximoIndice = (n, atual, passo) => (atual < 0 ? (passo > 0 ? 0 : n - 1) : (atual + passo + n) % n);

  function navegarFiltrados(passo) {
    const alvos = cartoes().filter((c) => passaFiltros(lerCartao(c)));
    if (!alvos.length) { status('Nenhum comentário carregado passa no período e nos filtros.'); return; }
    irPara(alvos[proximoIndice(alvos.length, alvos.indexOf(contornado), passo)]);
  }

  function irPara(c) {
    contornar(c, true);
    atualizarFiltrosNaPagina();
  }

  // Lista resumida dos comentários filtrados; só é montada com a seção aberta.
  const LIMITE_LISTA = 200;
  let chaveListaFiltrados = '';

  function atualizarListaFiltrados(alvos) {
    if (!el.lista) return;
    el.listaContagem.textContent = String(alvos.length);
    if (!el.listaUI.open) return;
    const chave = `${periodo.de}-${periodo.ate}|${alvos.map((c) => c.dataset.reviewId).join(',')}|${contornado?.dataset.reviewId || ''}`;
    if (chave === chaveListaFiltrados) return;
    chaveListaFiltrados = chave;
    if (!alvos.length) {
      el.lista.replaceChildren(criar('p', { className: 'vazio', textContent: 'Nenhum comentário carregado passa no período e nos filtros.' }));
      return;
    }
    const itens = alvos.slice(0, LIMITE_LISTA).map((c) => {
      const r = lerCartao(c);
      const meta = [criar('span', { textContent: `★ ${r.nota_avaliacao || '?'}` }),
        criar('span', { className: 'suave', textContent: r.data_relativa || 'sem data' })];
      if (r.opiniao) meta.push(criar('span', { className: `op-${r.opiniao}`, textContent: r.opiniao }));
      if (!jaColetada(r)) meta.push(criar('span', { className: 'selo nova', textContent: 'nova' }));
      if (+r.n_fotos) meta.push(criar('span', { className: 'suave', textContent: `${r.n_fotos} foto${+r.n_fotos > 1 ? 's' : ''}` }));
      const texto = r.texto_avaliacao.replace(/\s+/g, ' ');
      return criar('button', { className: `item${c === contornado ? ' atual' : ''}`, title: 'Mostrar na página', onclick: () => irPara(c) }, [
        criar('span', { className: 'meta' }, meta),
        criar('span', { className: 'trecho', textContent: texto ? texto.slice(0, 220) : '(sem texto)' }),
        ...(r.temas ? [criar('span', { className: 'temas', textContent: r.temas })] : []),
      ]);
    });
    if (alvos.length > LIMITE_LISTA) itens.push(criar('p', { className: 'vazio', textContent: `… e mais ${alvos.length - LIMITE_LISTA}. Use as setas dos filtros para percorrer todos.` }));
    el.lista.replaceChildren(...itens);
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
      mostrarProgressoColeta(cs, usarPeriodo);
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

  // Barra de progresso: o maior entre carregadas ÷ volume do lugar e idade da última
  // carregada ÷ fim do período (a coleta para ao passar do período).
  function mostrarProgressoColeta(cs, usarPeriodo) {
    const volume = +infoLugar().volume_avaliacoes_estabelecimento;
    const idade = cs.length ? lerCartao(cs[cs.length - 1]).idade_dias_aprox : '';
    const fracVolume = volume ? cs.length / volume : 0;
    const fracPeriodo = usarPeriodo && periodo.ate !== Infinity && idade !== '' ? idade / (periodo.ate + 1) : 0;
    // Enquanto roda, para em 99%: 100% só quando a coleta termina (e a barra some).
    progresso('coleta', Math.min(0.99, Math.max(fracVolume, fracPeriodo)), `${cs.length}${volume ? ` de ${volume}` : ''} carregadas`);
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

  // Entradas da coleta que não aparecem nos dados: ficam gravadas em cada linha.
  const entradasDaColeta = () => ({
    coleta_parar_em_conhecidas: el.pararConhecidas?.checked ? 'sim' : 'não',
    coleta_ordenacao_manual: el.jaOrdenado?.checked ? 'sim' : 'não',
  });

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
        ...entradasDaColeta(),
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
      ...entradasDaColeta(),
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
        if (r.review_id) lidosPorId.set(r.review_id, leituraMelhor(lidosPorId.get(r.review_id), r));
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
    status(`Primeira avaliação do período: "${r.data_relativa}", nota ${r.nota_avaliacao || '?'} (contorno roxo).`);
  }

  let contornado = null;

  function contornar(c, fixo = false) {
    if (contornado && contornado !== c) { contornado.style.outline = ''; contornado.style.outlineOffset = ''; }
    contornado = c;
    c.scrollIntoView({ block: 'center' });
    c.style.outline = '3px solid #9333ea';
    c.style.outlineOffset = '-3px';
    if (!fixo) setTimeout(() => { if (contornado === c) c.style.outline = ''; }, 6000);
  }

  function recuperarAndamento() {
    const a = GM_getValue(CHAVE_ANDAMENTO, null);
    if (!a || !a.linhas?.length) { status('Não há coleta salva.'); return; }
    resultado = a.linhas;
    alertaSeletores = checarSeletores(resultado);
    mostrarResumo(a.motivo, a.lugar, `Recuperada (${a.quando}): ${MSG_MOTIVO[a.motivo] || a.motivo}`);
  }

  // Resumo da coleta no painel: cabeçalho com a cor do desfecho, contagens em
  // tópicos e avisos em destaque.
  function mostrarResumo(motivo, lugar, titulo = '') {
    const noP = resultado.filter((r) => r.no_periodo === 'sim');
    const noPT = noP.filter((r) => r.tem_texto === 'sim').length;
    const comTexto = resultado.filter((r) => r.tem_texto === 'sim').length;
    const semTexto = resultado.length - comTexto;
    const semData = resultado.filter((r) => r.idade_dias_aprox === '').length;
    const novas = resultado.filter((r) => r.ja_coletada === 'não').length;
    const avisos = [];
    if (!lugar.place_id && !lugar.id_maps) avisos.push('Sem place_id nem id_maps: cole o place_id do B1 no campo antes de exportar.');
    else if (!lugar.place_id) avisos.push('Sem place_id na URL: cole o do B1 no campo, se quiser.');
    if (semData) avisos.push(`${semData} sem data reconhecida: confira na página.`);
    if (alertaSeletores) avisos.push(alertaSeletores);
    const tipo = COMPLETA[motivo] === 'sim' ? 'ok' : (COMPLETA[motivo] === 'incerta' || motivo === 'em andamento') ? 'alerta' : 'erro';
    const item = (n, texto, detalhe = '') => criar('li', {}, [criar('b', { textContent: String(n) }), ` ${texto}`,
      ...(detalhe ? [criar('span', { className: 'suave', textContent: ` · ${detalhe}` })] : [])]);
    statusRico([
      criar('div', { className: 'cab' }, [criar('span', { className: 'ponto' }), titulo || MSG_MOTIVO[motivo] || motivo]),
      ...(lugar.nome_estabelecimento ? [criar('div', { className: 'suave', textContent: lugar.nome_estabelecimento })] : []),
      criar('ul', {}, [
        item(resultado.length, 'lidas', `${comTexto} com texto + ${semTexto} sem`),
        item(noP.length, 'no período', `${noPT} com texto`),
        item(novas, 'novas', 'não coletadas antes'),
      ]),
      ...avisos.map((t) => criar('p', { className: 'aviso', textContent: t })),
    ], tipo);
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

  const trecho = (t, n = 110) => `"${t.slice(0, n)}${t.length > n ? '…' : ''}"`;
  const chipConfere = (rotulo, ok) => criar('span', { className: `chip ${ok ? 'sim' : 'nao'}`, textContent: `${rotulo} ${ok ? 'confere' : 'diverge'}` });

  // Intervalo de confiança de Wilson (95%) para a proporção k/n.
  function wilson(k, n, z = 1.96) {
    if (!n) return null;
    const p = k / n, z2 = z * z, d = 1 + z2 / n;
    const centro = (p + z2 / (2 * n)) / d;
    const margem = (z * Math.sqrt(p * (1 - p) / n + z2 / (4 * n * n))) / d;
    return [Math.max(0, centro - margem), Math.min(1, centro + margem)];
  }

  const pct = (x) => `${(x * 100).toFixed(1).replace('.', ',')}%`;

  // Placar da conferência: marcadas, faltam, fidelidade com IC 95% e divergências
  // apontadas pela comparação automática.
  function placarConferencia(conf) {
    const marcas = conf.ids.map((id) => conf.marcas[id]).filter(Boolean);
    const ok = marcas.filter((m) => m.resultado === 'confere').length;
    const nd = marcas.length - ok;
    const autoNota = marcas.filter((m) => m.nota_confere_auto === 'não').length;
    const autoTexto = marcas.filter((m) => m.texto_confere_auto === 'não').length;
    return { total: conf.ids.length, ok, nd, faltam: conf.ids.length - marcas.length, ic: wilson(ok, marcas.length), autoNota, autoTexto };
  }

  function mostrarPlacar(conf) {
    const pl = placarConferencia(conf);
    el.placar.hidden = !pl.total;
    if (!pl.total) return;
    el.placarOk.style.width = `${pl.ok / pl.total * 100}%`;
    el.placarErro.style.width = `${pl.nd / pl.total * 100}%`;
    el.placarNums.replaceChildren(
      criar('span', { className: 'op-positiva', textContent: `✓ ${pl.ok}` }),
      criar('span', { className: 'op-negativa', textContent: `✗ ${pl.nd}` }),
      criar('span', { className: 'suave', textContent: `faltam ${pl.faltam}` }));
    const n = pl.ok + pl.nd;
    const nos = n ? [criar('b', { textContent: `Fidelidade ${pct(pl.ok / n)}` }), criar('span', { className: 'suave', textContent: ` · IC 95% ${pct(pl.ic[0])} a ${pct(pl.ic[1])}` })]
      : [criar('span', { className: 'suave', textContent: 'Fidelidade aparece com a primeira marca.' })];
    if (pl.autoNota || pl.autoTexto) nos.push(criar('div', { className: 'suave', textContent: `Automático divergiu: nota ${pl.autoNota}, texto ${pl.autoTexto}` }));
    el.placarFid.replaceChildren(...nos);
  }

  function mostrarConferencia() {
    if (!el.confInfo) return;
    const conf = lerConf();
    mostrarPlacar(conf);
    const id = conf.ids[conf.i];
    const feitas = Object.keys(conf.marcas).length;
    el.confPos.textContent = conf.ids.length ? `${conf.i + 1}/${conf.ids.length}` : '';
    el.confSelo.textContent = conf.ids.length ? `${feitas}/${conf.ids.length}` : '';
    if (!id) {
      el.confInfo.replaceChildren(criar('span', { className: 'suave', textContent: 'Cole os review_id sorteados e clique em começar.' }));
      el.confAbrir.disabled = true;
      return;
    }
    const dono = lugarDoId(id);
    const marcada = conf.marcas[id];
    const bloco = (titulo, nota, data, texto) => criar('div', { className: 'lado' }, [
      criar('div', { className: 'rotulo', textContent: titulo }),
      criar('div', { textContent: `★ ${nota || '?'} · ${data || '?'}` }),
      criar('div', { className: 'trecho', textContent: texto ? trecho(texto) : '(sem texto)' }),
    ]);
    const nos = [
      criar('div', { className: 'cab' }, [criar('b', { textContent: dono ? dono.nome : 'Lugar desconhecido' }),
        ...(marcada ? [criar('span', { className: `chip ${marcada.resultado === 'confere' ? 'sim' : 'nao'}`, title: marcada.observacao || '',
          textContent: marcada.resultado === 'confere' ? '✓ marcada' : '✗ marcada' })] : [])]),
      criar('div', { className: 'mono', textContent: id }),
    ];
    if (!dono) nos.push(criar('p', { className: 'aviso', textContent: 'O id não está no registro deste navegador.' }));
    if (dono) {
      const [nota, data, texto, quando] = dono.registro;
      nos.push(bloco(`Coletado em ${quando}`, nota, data, texto));
    }
    if (conferida?.id === id) {
      const p = conferida.pagina;
      nos.push(bloco('Na página', p.nota_avaliacao, p.data_relativa, p.texto_avaliacao));
      if (dono) {
        const [nota, , texto] = dono.registro;
        nos.push(criar('div', { className: 'linha' }, [chipConfere('nota', nota === p.nota_avaliacao),
          chipConfere('texto', normalizarTexto(p.texto_avaliacao).startsWith(normalizarTexto(texto)))]));
      }
    }
    if (marcada?.observacao) nos.push(criar('div', { className: 'suave', textContent: `Divergência: ${marcada.observacao}` }));
    el.confInfo.replaceChildren(...nos);
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
    status('Avaliação contornada em roxo. Compare e marque ✓ ou ✗.');
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
    'texto_expandido', 'detalhes', 'tipo_servico', 'tipo_refeicao', 'preco_por_pessoa', 'tamanho_grupo', 'tempo_espera', 'reserva', 'estacionamento',
    'pratos_recomendados', 'notas_por_aspecto', 'n_fotos', 'urls_fotos', 'provavel_cardapio', 'valor_rs_no_texto', 'temas', 'opiniao',
    'resposta_dono', 'texto_resposta', 'periodo_de_dias', 'periodo_ate_dias', 'motivo_parada', 'coleta_completa', 'versao_script',
    'coletado_em', 'url',
    'coleta_parar_em_conhecidas', 'coleta_ordenacao_manual', 'recibo_recorte', 'recibo_periodo', 'recibo_temas', 'recibo_opiniao',
    'recibo_componentes', 'recibo_busca', 'recibo_exportado_em'];
  const COLS_RESUMO = ['data_coleta', 'place_id', 'id_maps', 'nome_estabelecimento', 'avaliacao_media_estabelecimento',
    'volume_avaliacoes_estabelecimento', 'lidas', 'com_texto', 'sem_texto', 'soma_confere', 'novas', 'no_periodo',
    'no_periodo_com_texto', 'periodo_de_dias', 'periodo_ate_dias', 'coleta_parar_em_conhecidas', 'coleta_ordenacao_manual', 'janela_dias_min', 'janela_dias_max', 'texto_por_mes_min',
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

  // Recibo da exportação: o que foi aplicado às linhas do arquivo. No recorte "tudo"
  // nada foi aplicado; em "período", o período e "com texto"; em "filtros", o período e
  // todos os filtros ligados. O que não foi aplicado fica "nenhum".
  function reciboExportacao(recorte) {
    const nenhum = 'nenhum';
    const filtra = recorte === 'filtros';
    const aplicaPeriodo = recorte === 'periodo' || filtra;
    return {
      recibo_recorte: recorte,
      recibo_periodo: aplicaPeriodo ? `${periodo.de} a ${periodo.ate === Infinity ? 'sem limite' : periodo.ate} dias` : nenhum,
      recibo_temas: (filtra && [...filtros.temas].map((k) => ROTULO_TEMA[k]).join('; ')) || nenhum,
      recibo_opiniao: (filtra && filtros.opiniao) || nenhum,
      recibo_componentes: recorte === 'periodo' ? 'com texto'
        : (filtra && [...filtros.componentes].map((k) => COMPONENTES[k][0]).join('; ')) || nenhum,
      recibo_busca: (filtra && filtros.buscaTexto.trim()) || nenhum,
      recibo_exportado_em: agora(),
    };
  }

  function baixar(linhas, sufixo, { forcar = false } = {}) {
    if (!resultado.length) { status('Nada para exportar: colete ou recupere uma coleta primeiro.'); return; }
    if (!linhas.length) { status('Nenhuma avaliação coletada passa neste recorte.'); return; }
    if (alertaSeletores && !forcar && !confirm(`${alertaSeletores}\n\nExportar mesmo assim?`)) return;
    // O place_id colado depois da coleta também entra.
    const placeId = el.placeId.value.trim();
    const recibo = reciboExportacao(sufixo);
    const saida = linhas.map((l) => ({ ...(l.place_id || !placeId ? l : { ...l, place_id: placeId }), ...recibo }));
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
  // Visual pelos padrões de _shared (design-standards.md e minimalismo.md): Montserrat,
  // Heroicons outline, roxo como cor primária, botões delineados por fundo (sem borda),
  // botões-ícone onde o ícone basta e explicações recolhidas em ⓘ.

  const el = {};
  let hospedeiro = null;
  let ultimoLugar = '';

  function criar(tag, props = {}, filhos = []) {
    const n = document.createElement(tag);
    Object.assign(n, props);
    for (const f of filhos) n.appendChild(typeof f === 'string' ? document.createTextNode(f) : f);
    return n;
  }

  // Heroicons 24/outline (traço 1.5).
  const ICONES = {
    'arrow-down-tray': 'M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3',
    'arrow-down-on-square': 'M9 8.25H7.5a2.25 2.25 0 0 0-2.25 2.25v9a2.25 2.25 0 0 0 2.25 2.25h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25H15M9 12l3 3m0 0 3-3m-3 3V2.25',
    'arrow-top-right-on-square': 'M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25',
    'arrow-uturn-left': 'M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3',
    'bell': 'M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0',
    'bell-slash': 'M9.143 17.082a24.248 24.248 0 0 0 3.844.148m-3.844-.148a23.856 23.856 0 0 1-5.455-1.31 8.964 8.964 0 0 0 2.3-5.542m3.155 6.852a3 3 0 0 0 5.667 1.97m1.965-2.277L21 21m-4.225-4.225a23.81 23.81 0 0 0 3.536-1.003A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6.53 6.53m10.245 10.245L6.53 6.53M3 3l3.53 3.53',
    'calendar-days': 'M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5',
    'check': 'm4.5 12.75 6 6 9-13.5',
    'chevron-down': 'm19.5 8.25-7.5 7.5-7.5-7.5',
    'chevron-left': 'M15.75 19.5 8.25 12l7.5-7.5',
    'chevron-right': 'm8.25 4.5 7.5 7.5-7.5 7.5',
    'chevron-up': 'm4.5 15.75 7.5-7.5 7.5 7.5',
    'document-chart-bar': 'M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25M9 16.5v.75m3-3v3M15 12v5.25m-4.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z',
    'document-check': 'M10.125 2.25h-4.5c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125v-9M10.125 2.25h.375a9 9 0 0 1 9 9v.375M10.125 2.25A3.375 3.375 0 0 1 13.5 5.625v1.5c0 .621.504 1.125 1.125 1.125h1.5a3.375 3.375 0 0 1 3.375 3.375M9 15l2.25 2.25L15 12',
    'document-duplicate': 'M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H9.75',
    'forward': 'M3 8.689c0-.864.933-1.406 1.683-.977l7.108 4.061a1.125 1.125 0 0 1 0 1.954l-7.108 4.061A1.125 1.125 0 0 1 3 16.811V8.69ZM12.75 8.689c0-.864.933-1.406 1.683-.977l7.108 4.061a1.125 1.125 0 0 1 0 1.954l-7.108 4.061a1.125 1.125 0 0 1-1.683-.977V8.69Z',
    'information-circle': 'm11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z',
    'magnifying-glass': 'm21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z',
    'minus': 'M5 12h14',
    'play': 'M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z',
    'plus': 'M12 4.5v15m7.5-7.5h-15',
    'stop': 'M5.25 7.5A2.25 2.25 0 0 1 7.5 5.25h9a2.25 2.25 0 0 1 2.25 2.25v9a2.25 2.25 0 0 1-2.25 2.25h-9a2.25 2.25 0 0 1-2.25-2.25v-9Z',
    'trash': 'm14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0',
    'x-mark': 'M6 18 18 6M6 6l12 12',
  };

  function icone(nome, classe = '') {
    const NS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(NS, 'svg');
    for (const [k, v] of Object.entries({ viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '1.5', 'aria-hidden': 'true' })) svg.setAttribute(k, v);
    if (classe) svg.setAttribute('class', classe);
    const p = document.createElementNS(NS, 'path');
    p.setAttribute('d', ICONES[nome]);
    p.setAttribute('stroke-linecap', 'round');
    p.setAttribute('stroke-linejoin', 'round');
    svg.appendChild(p);
    return svg;
  }

  function status(t, tipo = '') {
    if (!el.status) return;
    el.status.className = `status${tipo ? ` st-${tipo}` : ''}`;
    el.status.textContent = t;
  }

  function statusRico(nos, tipo = '') {
    if (!el.status) return;
    el.status.className = `status rico${tipo ? ` st-${tipo}` : ''}`;
    el.status.replaceChildren(...nos);
  }

  function atualizarBotoes() {
    for (const b of el.acoes || []) b.disabled = ocupado;
    if (el.parar) el.parar.disabled = !ocupado;
    if (!ocupado) progresso('coleta', null);
  }

  // Barras de progresso (coleta e fila). `frac` nulo esconde a barra.
  function progresso(tipo, frac, texto = '') {
    const b = el.barras?.[tipo];
    if (!b) return;
    if (frac == null) { b.caixa.hidden = true; return; }
    const pct = Math.round(Math.min(1, Math.max(0, frac)) * 100);
    b.caixa.hidden = false;
    b.preenchido.style.width = `${pct}%`;
    b.texto.textContent = texto;
    b.pct.textContent = `${pct}%`;
  }

  async function executar(fn, { avisar = false } = {}) {
    if (ocupado) return;
    ocupado = true; parar = false; atualizarBotoes();
    let ok = true;
    try { await fn(); } catch (e) { ok = false; status(`Erro: ${e.message}`, 'erro'); }
    ocupado = false; atualizarBotoes();
    if (avisar) tocar(ok && !parar);
  }

  // ---------- dica (ⓘ): balão flutuante ao lado do termo ----------
  // Abre ao parar o mouse (ou com foco/toque) e fecha ao sair, com Esc, rolagem ou clique fora.

  let dicaAncora = null, dicaFixa = false, timerDica = 0;

  function abrirDica(ancora, conteudo, fixa = false) {
    clearTimeout(timerDica);
    dicaAncora = ancora; dicaFixa = fixa;
    el.dica.replaceChildren(typeof conteudo === 'function' ? conteudo() : document.createTextNode(conteudo));
    el.dica.hidden = false;
    const r = ancora.getBoundingClientRect(), d = el.dica.getBoundingClientRect(), M = 12;
    const left = Math.min(Math.max(M, r.left + r.width / 2 - d.width / 2), innerWidth - d.width - M);
    let top = r.bottom + 6;
    if (top + d.height > innerHeight - M) top = Math.max(M, r.top - d.height - 6);
    el.dica.style.left = `${left}px`;
    el.dica.style.top = `${top}px`;
  }

  function fecharDica() {
    if (!el.dica) return;
    el.dica.hidden = true;
    dicaAncora = null; dicaFixa = false;
  }

  function ajuda(conteudo, rotulo = 'Explicação') {
    const i = criar('span', { className: 'ajuda', tabIndex: 0, role: 'button' }, [icone('information-circle')]);
    i.setAttribute('aria-label', rotulo);
    i.addEventListener('mouseenter', () => { if (!dicaFixa) abrirDica(i, conteudo); });
    i.addEventListener('mouseleave', () => { if (!dicaFixa) timerDica = setTimeout(fecharDica, 120); });
    i.addEventListener('focus', () => abrirDica(i, conteudo));
    i.addEventListener('blur', () => { if (dicaAncora === i) fecharDica(); });
    // Dentro de uma etiqueta ou aba clicável, tocar no ⓘ não aciona o controle.
    i.addEventListener('click', (e) => {
      e.stopPropagation(); e.preventDefault();
      if (dicaAncora === i && dicaFixa) fecharDica(); else abrirDica(i, conteudo, true);
    });
    return i;
  }

  // ---------- controles ----------

  function botaoIcone(nome, rotulo, fn, classe = '') {
    const b = criar('button', { type: 'button', className: `ico ${classe}`.trim(), title: rotulo, onclick: fn }, [icone(nome)]);
    b.setAttribute('aria-label', rotulo);
    return b;
  }

  const botaoTexto = (nome, texto, fn, classe = '', dica = '') =>
    criar('button', { type: 'button', className: classe, title: dica, onclick: fn }, [...(nome ? [icone(nome)] : []), texto]);

  // Etiqueta liga/desliga: cinza desligada, azul ligada. `checked` imita a caixa de marcar.
  function etiqueta(rotulo, aoAlternar, { ligada = false, dica = '' } = {}) {
    const b = criar('button', { type: 'button', className: 'tag' }, [rotulo]);
    if (dica) b.appendChild(ajuda(dica));
    const pintar = (v) => b.setAttribute('aria-pressed', String(v));
    pintar(ligada);
    Object.defineProperty(b, 'checked', { get: () => b.getAttribute('aria-pressed') === 'true', set: (v) => pintar(!!v) });
    b.onclick = () => { pintar(!b.checked); aoAlternar(b.checked); };
    return b;
  }

  // Botão-ícone de preferência (som, download automático), salvo no Tampermonkey.
  function alternaPref(chave, rotulo, nomeLigado, nomeDesligado) {
    const b = criar('button', { type: 'button', className: 'ico leve' });
    const pintar = () => {
      b.setAttribute('aria-pressed', String(prefs[chave]));
      b.replaceChildren(icone(prefs[chave] ? nomeLigado : nomeDesligado));
      b.title = `${rotulo}: ${prefs[chave] ? 'ligado' : 'desligado'}`;
      b.setAttribute('aria-label', b.title);
    };
    b.onclick = () => { prefs[chave] = !prefs[chave]; GM_setValue(`pref:${chave}`, prefs[chave]); pintar(); if (chave === 'som' && prefs.som) tocar(true); };
    pintar();
    return b;
  }

  // Seção recolhível; lembra quais estavam abertas.
  const abertos = new Set(GM_getValue('pref:abertos', ['filtros']));

  function secao(id, cabeca, filhos, aoAbrir = null) {
    const d = criar('details', { open: abertos.has(id) }, [
      criar('summary', {}, [icone('chevron-right', 'seta'), ...cabeca]), ...filhos]);
    d.addEventListener('toggle', () => {
      if (d.open) abertos.add(id); else abertos.delete(id);
      GM_setValue('pref:abertos', [...abertos]);
      if (d.open && aoAbrir) aoAbrir();
    });
    return d;
  }

  // Botão dentro do <summary> que não abre nem fecha a seção.
  const naoAlterna = (fn) => (e) => { e.preventDefault(); e.stopPropagation(); fn(); };

  const CSS = `
    :host{--fundo:#fff;--texto:#18181b;--suave:#71717a;--sup:#f4f4f5;--sup2:#e4e4e7;--linha:#ececef;
      --caneta:#7e22ce;--caneta-forte:#6b21a8;--caneta-100:#f3e8ff;--azul:#2563eb;
      --ok:#15803d;--ok-100:#dcfce7;--erro:#b91c1c;--erro-100:#fee2e2;--alerta:#b45309;--alerta-100:#fef3c7;
      --fonte:Montserrat,system-ui,-apple-system,"Segoe UI",sans-serif}
    @media (prefers-color-scheme:dark){:host{--fundo:#18181b;--texto:#f4f4f5;--suave:#a1a1aa;--sup:#27272a;--sup2:#3f3f46;
      --linha:#27272a;--caneta:#a855f7;--caneta-forte:#9333ea;--caneta-100:#3b0764;--azul:#3b82f6;
      --ok:#4ade80;--ok-100:#052e16;--erro:#f87171;--erro-100:#450a0a;--alerta:#fbbf24;--alerta-100:#451a03}}
    *{box-sizing:border-box}
    #painel{position:fixed;top:12px;right:12px;z-index:2147483647;width:360px;max-height:calc(100vh - 24px);
      overflow:auto;background:var(--fundo);color:var(--texto);border-radius:14px;
      box-shadow:0 8px 28px rgba(0,0,0,.2);font:14px/1.5 var(--fonte);padding:10px 14px 12px}
    #painel{resize:both;min-width:300px;min-height:120px;max-width:calc(100vw - 24px)}
    #painel.min{padding-bottom:10px;height:auto!important;min-height:0;resize:none}
    #painel.arrastando{user-select:none;opacity:.92}
    #painel.min>*:not(header){display:none}
    header{display:flex;align-items:center;gap:2px;cursor:grab;touch-action:none}
    #painel.arrastando header{cursor:grabbing}
    header .nome{flex:1;font-weight:700;font-size:15px;cursor:pointer;user-select:none}
    .barra{margin:8px 0}
    .barra[hidden]{display:none}
    .barra .txt{display:flex;justify-content:space-between;font-size:12px;color:var(--suave);font-variant-numeric:tabular-nums}
    .trilho{height:6px;background:var(--sup);border-radius:999px;overflow:hidden;display:flex}
    .preenchido{height:100%;background:var(--caneta);border-radius:999px;transition:width .25s}
    .selo.ativos{background:var(--azul);color:#fff}
    .placar{margin:8px 0}
    .placar[hidden]{display:none}
    .placar .trilho{margin:4px 0}
    .placar .seg-ok{background:var(--ok);transition:width .25s}
    .placar .seg-erro{background:var(--erro);transition:width .25s}
    .placar .nums{display:flex;gap:10px;font-size:12.5px;font-weight:600;align-items:center}
    .placar .fid{font-size:12.5px}
    svg{width:18px;height:18px;flex:none}
    button{font:inherit;color:inherit;border:0;background:var(--sup);border-radius:8px;padding:6px 10px;cursor:pointer;
      display:inline-flex;align-items:center;justify-content:center;gap:6px;transition:background .15s,color .15s,transform .1s}
    button:hover:not(:disabled){background:var(--sup2)}
    button:active:not(:disabled){transform:scale(.95)}
    button:disabled{opacity:.35;cursor:default}
    :focus-visible{outline:2px solid var(--azul);outline-offset:1px}
    .ico{width:32px;height:32px;padding:0;flex:none}
    .ico.leve{background:transparent;color:var(--suave)}
    .ico.leve:hover:not(:disabled){background:var(--sup);color:var(--texto)}
    .ico.leve[aria-pressed=true]{color:var(--caneta)}
    .primario{background:var(--caneta);color:#fff;font-weight:600;flex:1}
    .primario:hover:not(:disabled){background:var(--caneta-forte)}
    .verde{background:var(--ok-100);color:var(--ok)}
    .vermelho{background:var(--erro-100);color:var(--erro)}
    .verde:hover:not(:disabled),.vermelho:hover:not(:disabled){filter:brightness(.95)}
    .parar:not(:disabled){background:var(--erro-100);color:var(--erro)}
    .perigo:hover:not(:disabled){color:var(--erro)}
    .mini{padding:4px 10px;font-size:13px}
    .mini svg{width:16px;height:16px}
    .linha{display:flex;align-items:center;gap:6px;margin:8px 0;flex-wrap:wrap}
    .esp{flex:1}
    .rotulo{font-size:12px;font-weight:600;color:var(--suave);display:inline-flex;align-items:center;gap:4px}
    .suave{color:var(--suave)}
    select,input[type=text],input[type=search],textarea{font:inherit;color:inherit;background:var(--sup);border:0;border-radius:8px;padding:6px 8px}
    select{padding:5px 4px;cursor:pointer;flex:1;min-width:0}
    .periodo{flex-wrap:nowrap}
    select option{color:#111;background:#fff}
    input{min-width:0;flex:1}
    input::placeholder,textarea::placeholder{color:var(--suave)}
    textarea{width:100%;height:64px;font:12px/1.45 ui-monospace,Menlo,monospace;resize:vertical;display:block}
    .busca{display:flex;align-items:center;gap:6px;background:var(--sup);border-radius:8px;padding:0 4px 0 10px;flex:1}
    .busca input{background:transparent;padding:7px 0}
    .busca input::-webkit-search-cancel-button{display:none}
    .busca>svg{color:var(--suave);width:16px;height:16px}
    .busca .ico{width:28px;height:28px;background:transparent;color:var(--suave)}
    details{border-top:1px solid var(--linha)}
    details>:not(summary){margin-left:2px}
    details[open]{padding-bottom:8px}
    summary{list-style:none;display:flex;align-items:center;gap:6px;cursor:pointer;font-size:15px;font-weight:600;
      padding:8px 0;user-select:none}
    summary::-webkit-details-marker{display:none}
    summary .seta{width:16px;height:16px;color:var(--suave);transition:transform .2s}
    details[open]>summary .seta{transform:rotate(90deg)}
    summary .ico{width:28px;height:28px;background:transparent;color:var(--suave)}
    summary .ico:hover:not(:disabled){background:var(--sup);color:var(--texto)}
    .selo{font-size:12px;font-weight:600;background:var(--sup);color:var(--suave);border-radius:999px;padding:1px 8px;white-space:nowrap}
    .selo:empty{display:none}
    .selo.nova{background:var(--caneta-100);color:var(--caneta)}
    .pos{font-size:12px;color:var(--suave);font-variant-numeric:tabular-nums;font-weight:500}
    .subtitulo{font-size:12px;font-weight:600;color:var(--suave);margin:12px 0 6px;display:flex;align-items:center;gap:4px}
    .tags{display:flex;flex-wrap:wrap;gap:6px}
    .tag{padding:4px 12px;border-radius:999px;font-size:13px;background:var(--sup);color:var(--suave);gap:4px}
    .tag[aria-pressed=true]{background:var(--azul);color:#fff}
    .tag[aria-pressed=true]:hover{background:var(--azul);filter:brightness(1.08)}
    .tag[aria-pressed=true] .ajuda{color:#fffc}
    .pills{display:flex;background:var(--sup);border-radius:999px;padding:3px;gap:2px}
    .pill{flex:1;background:transparent;border-radius:999px;padding:4px 6px;font-size:13px;color:var(--suave);gap:4px}
    .pill:hover:not(:disabled){background:var(--sup2)}
    .pill[aria-selected=true]{background:var(--fundo);color:var(--caneta);font-weight:600}
    .ajuda{display:inline-flex;color:var(--suave);cursor:help;border-radius:999px}
    .ajuda svg{width:15px;height:15px}
    .ajuda:hover{color:var(--caneta)}
    .dica{position:fixed;z-index:2147483647;max-width:280px;background:var(--texto);color:var(--fundo);
      font:12.5px/1.5 var(--fonte);padding:8px 10px;border-radius:8px;box-shadow:0 6px 20px rgba(0,0,0,.25);pointer-events:none}
    .dica[hidden]{display:none}
    .dica .legenda{display:flex;flex-wrap:wrap;gap:4px;margin-top:6px}
    .dica .legenda span{padding:0 6px;border-radius:4px;color:#111}
    .status{font-size:13px;border-radius:10px;padding:8px 10px;background:var(--sup);white-space:pre-line;margin:8px 0}
    .status:empty{display:none}
    .status.rico{white-space:normal}
    .status .cab{font-weight:600;display:flex;gap:8px;align-items:center}
    .status ul{margin:4px 0 0;padding-left:18px}
    .status li::marker{color:var(--suave)}
    .ponto{width:8px;height:8px;border-radius:50%;background:var(--suave);flex:none}
    .st-ok{background:var(--ok-100)} .st-ok .ponto{background:var(--ok)}
    .st-alerta{background:var(--alerta-100)} .st-alerta .ponto{background:var(--alerta)}
    .st-erro{background:var(--erro-100)} .st-erro .ponto{background:var(--erro)}
    .aviso{color:var(--alerta);font-size:12.5px;margin:6px 0 0;font-weight:500}
    .aviso::before{content:"⚠ "}
    .st-alerta .aviso,.st-erro .aviso{color:inherit}
    .info{font-size:13px;background:var(--sup);border-radius:10px;padding:8px 10px;margin:8px 0}
    .info .cab{display:flex;gap:6px;align-items:center;justify-content:space-between}
    .lado{margin-top:8px}
    .lado .trecho,.item .trecho{color:var(--suave);font-size:12.5px}
    .mono{font:11.5px/1.4 ui-monospace,Menlo,monospace;color:var(--suave);word-break:break-all}
    .chip{font-size:12px;font-weight:600;border-radius:999px;padding:1px 8px;white-space:nowrap}
    .chip.sim{background:var(--ok-100);color:var(--ok)}
    .chip.nao{background:var(--erro-100);color:var(--erro)}
    .info .linha{margin:6px 0 0}
    .lista{max-height:320px;overflow:auto;display:flex;flex-direction:column;gap:2px;margin-top:4px}
    .item{display:flex;flex-direction:column;align-items:stretch;text-align:left;background:transparent;padding:6px 8px;gap:2px;flex:none}
    .item:hover:not(:disabled){background:var(--sup)}
    .item.atual{background:var(--caneta-100)}
    .item .meta{display:flex;gap:8px;align-items:center;font-size:12px;font-weight:600}
    .item .trecho{display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;font-weight:400}
    .item .temas{font-size:11.5px;color:var(--caneta)}
    .op-positiva{color:var(--ok)}
    .op-negativa{color:var(--erro)}
    .vazio{font-size:13px;color:var(--suave);margin:6px 0}`;

  const OPCOES_PERIODO = [[0, 'agora'], [7, '1 semana'], [14, '2 semanas'], [21, '3 semanas'], [28, '4 semanas'],
    [30, '1 mês'], ...[2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((n) => [30 * n, `${n} meses`]),
    [365, '1 ano'], ...[2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => [365 * n, `${n} anos`])];

  // Montserrat vem do Google Fonts; a @font-face declarada no documento vale dentro do shadow DOM.
  function carregarFonte() {
    if (document.getElementById('tcc-fonte-montserrat') || !document.head) return;
    document.head.appendChild(criar('link', { id: 'tcc-fonte-montserrat', rel: 'stylesheet',
      href: 'https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap' }));
  }

  const legendaDestaques = () => criar('div', {}, [
    'Palavras que acionaram o filtro:',
    criar('div', { className: 'legenda' }, [
      criar('span', { textContent: 'tema', style: `background:${CORES.tema}` }),
      criar('span', { textContent: 'positiva', style: `background:${CORES.positiva}` }),
      criar('span', { textContent: 'negativa', style: `background:${CORES.negativa}` }),
      criar('span', { textContent: 'busca', style: `background:${CORES.busca}` }),
      criar('span', { textContent: 'negação', style: 'background:#fff;text-decoration:underline 2px #e8790c' }),
    ]),
  ]);

  function montarPainel() {
    carregarFonte();
    carregarFiltros(GM_getValue(CHAVE_FILTROS, null));
    const reaplicar = () => { salvarFiltros(); pintarAtivos(); atualizarFiltrosNaPagina(); };
    const pintarAtivos = () => { const n = filtrosAtivos(); el.nAtivos.textContent = n ? `${n} ativo${n > 1 ? 's' : ''}` : ''; };
    const alternar = (conjunto, k) => (ligada) => { if (ligada) conjunto.add(k); else conjunto.delete(k); reaplicar(); };

    el.status = criar('div', { className: 'status', textContent: 'Abra um lugar e clique em "Coletar avaliações".' });
    el.jaOrdenado = etiqueta('Já ordenei por "Mais recentes"', () => {}, { dica: 'Marque se já ordenou a lista à mão. O script pula a etapa de ordenar.' });
    el.pararConhecidas = etiqueta('Parar em 10 já coletadas seguidas', () => {}, { dica: 'A rolagem para ao achar 10 avaliações já coletadas em sequência: retoma de onde a última coleta parou.' });
    el.placeId = criar('input', { type: 'text', placeholder: 'place_id do B1 (se faltar na URL)' });

    // ----- topo: período e ações principais -----
    const seletorDe = criar('select', { onchange: (e) => { periodo.de = +e.target.value; reaplicar(); } },
      OPCOES_PERIODO.map(([v, t]) => criar('option', { value: v, textContent: t })));
    const seletorAte = criar('select', { onchange: (e) => { periodo.ate = e.target.value === 'tudo' ? Infinity : +e.target.value; reaplicar(); } },
      [...OPCOES_PERIODO.slice(1).map(([v, t]) => criar('option', { value: v, textContent: t })), criar('option', { value: 'tudo', textContent: 'sem limite' })]);
    seletorDe.value = String(periodo.de);
    seletorAte.value = periodo.ate === Infinity ? 'tudo' : String(periodo.ate);
    if (seletorAte.value === '') { seletorAte.value = '30'; periodo.ate = 30; }

    const bColetar = botaoTexto('arrow-down-tray', 'Coletar avaliações', () => executar(async () => {
      const motivo = await coletar();
      if (prefs.autobaixar && resultado.length) baixar(resultado, 'tudo');
      if (motivo === 'ordem errada' || motivo === 'lista não encontrada') throw new Error(MSG_MOTIVO[motivo]);
    }, { avisar: true }), 'primario');
    el.parar = botaoIcone('stop', 'Parar', () => { parar = true; status('Parando…'); }, 'parar');
    const bLocalizar = botaoIcone('calendar-days', 'Localizar o período na lista (rola até a primeira avaliação dele)', () => executar(localizarPeriodo));

    const bCsv = (texto, dica, fn) => botaoTexto('arrow-down-tray', texto, fn, 'mini', dica);

    // ----- filtros -----
    let timerBusca = 0;
    const campoBusca = criar('input', { type: 'search', placeholder: 'Buscar no texto (aceita regex)', value: filtros.buscaTexto });
    const lerCampoBusca = () => { filtros.buscaTexto = campoBusca.value; filtros.busca = lerBusca(campoBusca.value); };
    campoBusca.setAttribute('aria-label', 'Buscar no texto');
    campoBusca.oninput = () => {
      clearTimeout(timerBusca);
      timerBusca = setTimeout(() => { lerCampoBusca(); reaplicar(); }, 200);
    };
    // Enter vai ao próximo, Shift+Enter ao anterior (como o "localizar" do navegador).
    campoBusca.onkeydown = (e) => {
      if (e.key !== 'Enter') return;
      e.preventDefault();
      clearTimeout(timerBusca);
      lerCampoBusca();
      salvarFiltros(); pintarAtivos();
      navegarFiltrados(e.shiftKey ? -1 : 1);
    };

    const tagsTema = Object.keys(TEMAS).map((k) => etiqueta(ROTULO_TEMA[k], alternar(filtros.temas, k), { ligada: filtros.temas.has(k) }));
    const dicasComp = {
      cardapio: 'Tem foto e o texto cita cardápio, menu, preço ou valor.',
      aspectos: 'Notas de comida, serviço ou ambiente que o Google mostra no cartão.',
      nova: 'O review_id ainda não está no registro de coletas deste lugar.',
    };
    const rotulosComp = { aspectos: 'notas por aspecto' };
    const tagsComp = Object.entries(COMPONENTES).map(([k, [rotulo]]) =>
      etiqueta(rotulosComp[k] || rotulo, alternar(filtros.componentes, k), { ligada: filtros.componentes.has(k), dica: dicasComp[k] || '' }));

    const DICAS_OPINIAO = {
      positiva: 'Nota 5 e ao menos uma palavra positiva no texto (ou negação de uma negativa, como "não foi caro"). A negação vale para até 3 palavras antes, na mesma oração.',
      negativa: 'Nota 4 ou menos e ao menos uma palavra negativa no texto (ou negação de uma positiva, como "não foi bom"). A negação vale para até 3 palavras antes, na mesma oração.',
    };
    const pills = [['', 'Todas'], ['positiva', 'Positivas'], ['negativa', 'Negativas']].map(([v, t]) => {
      const b = criar('button', { type: 'button', className: 'pill', onclick: () => { filtros.opiniao = v; pintarPills(); reaplicar(); } }, [t]);
      b.setAttribute('role', 'tab');
      b.dataset.valor = v;
      if (DICAS_OPINIAO[v]) b.appendChild(ajuda(DICAS_OPINIAO[v], `O que conta como ${t.toLowerCase()}`));
      return b;
    });
    const pintarPills = () => pills.forEach((b) => b.setAttribute('aria-selected', String(b.dataset.valor === filtros.opiniao)));
    pintarPills();
    const grupoPills = criar('div', { className: 'pills' }, pills);
    grupoPills.setAttribute('role', 'tablist');

    const pillsFora = [['', 'Manter'], ['esmaecer', 'Esmaecer'], ['ocultar', 'Ocultar']].map(([v, t]) => {
      const b = criar('button', { type: 'button', className: 'pill', onclick: () => { filtros.fora = v; pintarFora(); reaplicar(); } }, [t]);
      b.dataset.valor = v;
      b.setAttribute('role', 'tab');
      return b;
    });
    const pintarFora = () => pillsFora.forEach((b) => b.setAttribute('aria-selected', String(b.dataset.valor === filtros.fora)));
    pintarFora();
    const grupoFora = criar('div', { className: 'pills' }, pillsFora);
    grupoFora.setAttribute('role', 'tablist');

    const limparFiltros = () => {
      filtros.temas.clear(); filtros.componentes.clear(); filtros.opiniao = ''; filtros.busca = null; filtros.buscaTexto = '';
      campoBusca.value = '';
      for (const t of [...tagsTema, ...tagsComp]) t.checked = false;
      pintarPills();
      reaplicar();
      status('Filtros limpos.');
    };

    el.contagem = criar('span', { className: 'selo', title: 'Carregadas na página que passam no período e nos filtros' });
    el.nAtivos = criar('span', { className: 'selo ativos', title: 'Filtros ligados (ficam salvos ao recarregar a página)' });
    pintarAtivos();
    el.navPos = criar('span', { className: 'pos' });
    const filtrosUI = secao('filtros', [
      'Filtros', el.nAtivos, el.contagem, criar('span', { className: 'esp' }), el.navPos,
      botaoIcone('chevron-up', 'Comentário anterior que passa nos filtros (Shift+Enter na busca)', naoAlterna(() => navegarFiltrados(-1))),
      botaoIcone('chevron-down', 'Próximo comentário que passa nos filtros (Enter na busca)', naoAlterna(() => navegarFiltrados(1))),
    ], [
      criar('div', { className: 'linha' }, [
        criar('label', { className: 'busca' }, [icone('magnifying-glass'), campoBusca]),
        botaoIcone('x-mark', 'Limpar todos os filtros', limparFiltros, 'leve'),
      ]),
      criar('div', { className: 'subtitulo' }, ['Tema', ajuda('Passa se qualquer um dos temas marcados aparecer no texto (lista de palavras-chave).')]),
      criar('div', { className: 'tags' }, tagsTema),
      criar('div', { className: 'subtitulo' }, ['Opinião']),
      grupoPills,
      criar('div', { className: 'subtitulo' }, ['Componentes', ajuda('Passa só se tiver todos os marcados.')]),
      criar('div', { className: 'tags' }, tagsComp),
      criar('div', { className: 'subtitulo' }, ['Fora do filtro', ajuda('O que a página faz com as avaliações fora do período e dos filtros: manter como estão, deixar translúcidas ou ocultar. Durante a coleta, ocultar age como esmaecer, para não mexer na rolagem.')]),
      grupoFora,
      criar('div', { className: 'subtitulo' }, ['Na página']),
      criar('div', { className: 'tags' }, [
        etiqueta('Destacar palavras', (v) => { filtros.destacar = v; reaplicar(); }, { ligada: filtros.destacar, dica: legendaDestaques }),
      ]),
    ]);

    // ----- retomada, fila e histórico -----
    el.fila = criar('textarea', { placeholder: 'Uma URL do Maps ou um place_id por linha' });
    const bRecuperar = botaoIcone('arrow-uturn-left', 'Recuperar a última coleta salva', recuperarAndamento);
    const bEsquecer = botaoIcone('trash', 'Esquecer os ids já coletados deste lugar', () => {
      const chave = chaveLugar(infoLugar());
      if (chave && confirm(`Esquecer os review_id já coletados de ${infoLugar().nome_estabelecimento}? A conferência deles deixa de achar o lugar.`)) {
        GM_deleteValue(PREFIXO_LUGAR + chave); atualizarIdsConhecidos(true); reaplicar(); status('Ids esquecidos.');
      }
    }, 'perigo');
    const bFila = botaoIcone('play', 'Iniciar a fila', iniciarFila);
    const bContinuarFila = botaoIcone('forward', 'Continuar a fila de onde parou', continuarFila);
    const bResumo = botaoIcone('document-chart-bar', 'CSV-resumo do histórico de coletas', () => baixarResumo(GM_getValue(CHAVE_RESUMOS, []), 'historico'));
    const bLimparResumo = botaoIcone('trash', 'Limpar o histórico de resumos', () => {
      if (confirm('Apagar o histórico de resumos? Exporte antes.')) { GM_setValue(CHAVE_RESUMOS, []); status('Histórico de resumos apagado.'); }
    }, 'perigo');
    el.filaSelo = criar('span', { className: 'selo' });
    const retomadaUI = secao('retomada', ['Retomada, fila e resumo', el.filaSelo], [
      criar('div', { className: 'tags' }, [el.pararConhecidas]),
      criar('div', { className: 'linha' }, [criar('span', { className: 'rotulo', textContent: 'Coleta salva' }), criar('span', { className: 'esp' }), bRecuperar, bEsquecer]),
      criar('div', { className: 'subtitulo' }, ['Fila', ajuda('O script abre cada lugar, coleta, baixa o CSV de tudo e espera 20–40 s antes do próximo. No fim, baixa o CSV-resumo da fila. "Parar" pausa; continuar retoma do lugar em que parou.')]),
      el.fila,
      criar('div', { className: 'linha' }, [bFila, bContinuarFila, criar('span', { className: 'esp' }),
        criar('span', { className: 'rotulo', textContent: 'Histórico' }), bResumo, bLimparResumo]),
    ]);

    // ----- conferência -----
    el.confIds = criar('textarea', { placeholder: 'review_id sorteados, um por linha' });
    el.confInfo = criar('div', { className: 'info' });
    el.placarOk = criar('div', { className: 'seg-ok' });
    el.placarErro = criar('div', { className: 'seg-erro' });
    el.placarNums = criar('div', { className: 'nums' });
    el.placarFid = criar('div', { className: 'fid' });
    el.placar = criar('div', { className: 'placar', hidden: true }, [el.placarNums, criar('div', { className: 'trilho' }, [el.placarOk, el.placarErro]), el.placarFid]);
    el.confPos = criar('span', { className: 'pos' });
    el.confSelo = criar('span', { className: 'selo', title: 'Marcadas / sorteadas' });
    el.confAbrir = botaoIcone('arrow-top-right-on-square', 'Abrir o lugar desta avaliação', abrirLugarConferido);
    const bAchar = botaoIcone('magnifying-glass', 'Achar na página', () => executar(acharConferida));
    const conferenciaUI = secao('conferencia', ['Conferência de fidelidade', el.confSelo], [
      el.confIds,
      criar('div', { className: 'linha' }, [
        botaoTexto('play', 'Começar', iniciarConferencia, 'mini'),
        criar('span', { className: 'esp' }),
        botaoIcone('chevron-left', 'Anterior', () => moverConferencia(-1), 'leve'), el.confPos,
        botaoIcone('chevron-right', 'Próxima', () => moverConferencia(1), 'leve'),
      ]),
      el.placar,
      el.confInfo,
      criar('div', { className: 'linha' }, [
        el.confAbrir, bAchar, criar('span', { className: 'esp' }),
        botaoIcone('check', 'Confere', () => marcarConferencia('confere'), 'verde'),
        botaoIcone('x-mark', 'Diverge', () => marcarConferencia('diverge'), 'vermelho'),
        botaoIcone('document-check', 'CSV da conferência', baixarConferencia),
      ]),
    ], mostrarConferencia);

    // ----- sal -----
    el.salResumo = criar('span', { className: 'mono', title: 'Início e fim do sal atual, para conferir se é o mesmo nos dois domínios' });
    const pintarSal = () => { const s = sal(); el.salResumo.textContent = `${s.slice(0, 4)}…${s.slice(-4)}`; };
    const salUI = secao('sal', ['Sal da pseudonimização', ajuda('Guarde uma cópia: sem o mesmo sal, o mesmo autor recebe outro código no CSV.')], [
      criar('div', { className: 'linha' }, [criar('span', { className: 'rotulo', textContent: 'Sal atual' }), el.salResumo, criar('span', { className: 'esp' }),
        botaoIcone('document-duplicate', 'Copiar o sal', async () => {
          try { await navigator.clipboard.writeText(sal()); status('Sal copiado. Guarde-o fora do navegador.', 'ok'); }
          catch (_) { prompt('Sal atual (copie e guarde):', sal()); }
        }),
        botaoIcone('arrow-down-on-square', 'Importar um sal', () => {
          const novo = (prompt('Cole o sal (32 caracteres hexadecimais):') || '').trim().toLowerCase();
          if (!novo) return;
          if (!/^[0-9a-f]{32}$/.test(novo)) { status('Sal inválido: são 32 caracteres de 0-9 e a-f.', 'erro'); return; }
          if (novo !== sal() && !confirm('Trocar o sal muda os códigos das próximas coletas. Continuar?')) return;
          GM_setValue(CHAVE_SAL, novo);
          pseudonimos.clear();
          pintarSal();
          status('Sal importado.', 'ok');
        }),
      ]),
    ]);
    pintarSal();

    // ----- lista dos comentários filtrados -----
    el.lista = criar('div', { className: 'lista' });
    el.listaContagem = criar('span', { className: 'selo' });
    el.listaUI = secao('lista', ['Comentários filtrados', el.listaContagem], [el.lista],
      () => { chaveListaFiltrados = ''; reaplicar(); });

    el.acoes = [bColetar, bLocalizar, bRecuperar, bFila, bContinuarFila, bAchar];

    const barra = () => {
      const b = { preenchido: criar('div', { className: 'preenchido' }), texto: criar('span'), pct: criar('span') };
      b.caixa = criar('div', { className: 'barra', hidden: true }, [criar('div', { className: 'txt' }, [b.texto, b.pct]),
        criar('div', { className: 'trilho' }, [b.preenchido])]);
      return b;
    };
    el.barras = { fila: barra(), coleta: barra() };

    const bMin = botaoIcone('minus', 'Minimizar', null, 'leve');
    const cabecalho = criar('header', { title: 'Arraste para mover · duplo clique volta ao canto' }, [
      criar('span', { className: 'nome', textContent: 'Avaliações do Maps' }),
      alternaPref('som', 'Som ao concluir', 'bell', 'bell-slash'),
      alternaPref('autobaixar', 'Download automático do CSV', 'arrow-down-tray', 'arrow-down-tray'),
      bMin,
    ]);
    const painel = criar('div', { id: 'painel' }, [
      cabecalho,
      criar('div', { className: 'linha periodo' }, [
        criar('span', { className: 'rotulo' }, ['Período', ajuda('Idade pelo rótulo do Google (semana = 7 dias, mês = 30, ano = 365). "Até 1 mês" inclui todo o rótulo "um mês atrás" (30 a 59 dias).')]),
        seletorDe, criar('span', { className: 'suave', textContent: 'até' }), seletorAte,
      ]),
      criar('div', { className: 'tags' }, [el.jaOrdenado]),
      criar('div', { className: 'linha' }, [bColetar, el.parar, bLocalizar]),
      el.barras.fila.caixa,
      el.barras.coleta.caixa,
      el.status,
      criar('div', { className: 'linha' }, [
        criar('span', { className: 'rotulo', textContent: 'CSV' }),
        bCsv('período', 'Avaliações do período com texto', () => baixar(resultado.filter((r) => noPeriodo(r) && r.tem_texto === 'sim'), 'periodo')),
        bCsv('filtros', 'Avaliações que passam no período e nos filtros', () => baixar(resultado.filter(passaFiltros), 'filtros')),
        bCsv('tudo', 'Todas as avaliações lidas', () => baixar(resultado, 'tudo')),
      ]),
      criar('div', { className: 'linha' }, [el.placeId, ajuda('Use o place_id do B1 quando a URL não traz o identificador. Ele entra no CSV.')]),
      filtrosUI,
      retomadaUI,
      conferenciaUI,
      salUI,
      el.listaUI,
    ]);
    const minimizar = () => {
      painel.classList.toggle('min');
      const min = painel.classList.contains('min');
      bMin.replaceChildren(icone(min ? 'plus' : 'minus'));
      bMin.title = min ? 'Expandir' : 'Minimizar';
      bMin.setAttribute('aria-label', bMin.title);
      fecharDica();
    };
    bMin.onclick = minimizar;
    cabecalho.querySelector('.nome').onclick = () => { if (!arrastou) minimizar(); };
    prepararArraste(cabecalho, painel);
    // O tamanho só muda pela alça de redimensionar, que grava largura e altura no estilo.
    addEventListener('pointerup', () => {
      if (painel.classList.contains('min')) return;
      const { width, height } = painel.style;
      if (width && (width !== posicao?.width || height !== posicao?.height)) {
        posicao = { ...posicao, width, height };
        GM_setValue(CHAVE_POSICAO, posicao);
      }
    });
    painel.addEventListener('click', liberarAudio);
    painel.addEventListener('scroll', fecharDica);
    // As teclas digitadas no painel não chegam aos atalhos do Maps.
    for (const tipo of ['keydown', 'keyup', 'keypress']) painel.addEventListener(tipo, (e) => {
      if (tipo === 'keydown' && e.key === 'Escape') fecharDica();
      e.stopPropagation();
    });
    el.painel = painel;

    el.dica = criar('div', { className: 'dica', hidden: true });
    el.dica.setAttribute('role', 'tooltip');
    addEventListener('keydown', (e) => { if (e.key === 'Escape') fecharDica(); });
    addEventListener('scroll', () => { if (!dicaFixa) fecharDica(); }, true);
    addEventListener('click', (e) => { if (dicaAncora && !e.composedPath().includes(dicaAncora)) fecharDica(); });

    hospedeiro = criar('div', { id: 'tcc-avaliacoes-hospedeiro' });
    const raiz = hospedeiro.attachShadow({ mode: 'open' });
    raiz.appendChild(criar('style', { textContent: CSS }));
    raiz.appendChild(painel);
    raiz.appendChild(el.dica);
    atualizarBotoes();
    mostrarConferencia();
  }

  // Posição e tamanho escolhidos pelo autor, salvos no Tampermonkey. Sem posição
  // salva, o painel fica no canto direito (abaixo do de horários de pico).
  const CHAVE_POSICAO = 'pref:posicao';
  let posicao = GM_getValue(CHAVE_POSICAO, null);
  let arrastou = false;

  function prepararArraste(cabecalho, painel) {
    cabecalho.addEventListener('pointerdown', (e) => {
      if (e.button !== 0 || e.target.closest('button, .ajuda')) return;
      const r = painel.getBoundingClientRect();
      const x0 = e.clientX, y0 = e.clientY;
      let moveu = false;
      const mover = (ev) => {
        if (!moveu && Math.hypot(ev.clientX - x0, ev.clientY - y0) < 4) return;
        moveu = true;
        painel.classList.add('arrastando');
        posicao = { ...posicao, left: Math.round(r.left + ev.clientX - x0), top: Math.round(r.top + ev.clientY - y0) };
        posicionarPainel();
      };
      const soltar = () => {
        removeEventListener('pointermove', mover);
        removeEventListener('pointerup', soltar);
        painel.classList.remove('arrastando');
        if (!moveu) return;
        GM_setValue(CHAVE_POSICAO, posicao);
        arrastou = true;
        setTimeout(() => { arrastou = false; }, 0);
      };
      addEventListener('pointermove', mover);
      addEventListener('pointerup', soltar);
    });
    cabecalho.addEventListener('dblclick', (e) => {
      if (e.target.closest('button, .ajuda')) return;
      posicao = null;
      GM_deleteValue(CHAVE_POSICAO);
      painel.style.width = painel.style.height = painel.style.left = '';
      posicionarPainel();
      status('Painel de volta ao canto, no tamanho padrão.');
    });
  }

  function posicionarPainel() {
    const p = el.painel;
    if (posicao?.width && !p.style.width) { p.style.width = posicao.width; p.style.height = posicao.height || ''; }
    if (posicao && posicao.left != null) {
      const w = p.offsetWidth || 360;
      const left = Math.min(Math.max(0, posicao.left), Math.max(0, innerWidth - w));
      const top = Math.min(Math.max(0, posicao.top), Math.max(0, innerHeight - 48));
      if (p.style.left !== `${left}px` || p.style.top !== `${top}px`) {
        p.style.left = `${left}px`;
        p.style.right = 'auto';
        p.style.top = `${top}px`;
        p.style.maxHeight = `calc(100vh - ${top + 12}px)`;
      }
      return;
    }
    if (p.style.left || p.style.right) { p.style.left = ''; p.style.right = ''; }
    const picos = document.getElementById('tcc-picos-hospedeiro')?.shadowRoot?.getElementById('painel');
    const r = picos?.getBoundingClientRect();
    const topo = r && r.height ? Math.round(r.bottom + 8) : 12;
    if (el.painel.style.top !== `${topo}px`) {
      el.painel.style.top = `${topo}px`;
      el.painel.style.maxHeight = `calc(100vh - ${topo + 12}px)`;
    }
  }

  // Selo da fila no cabeçalho da seção: posição quando há fila em curso ou pausada.
  function atualizarSeloFila() {
    const fila = GM_getValue(CHAVE_FILA, null);
    const texto = fila && fila.i < fila.itens.length ? `${fila.ativa ? 'fila' : 'pausada'} ${fila.i}/${fila.itens.length}` : '';
    if (el.filaSelo.textContent !== texto) el.filaSelo.textContent = texto;
    if (fila?.ativa && fila.i < fila.itens.length) progresso('fila', fila.i / fila.itens.length, `Fila: lugar ${fila.i + 1} de ${fila.itens.length}`);
    else progresso('fila', null);
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
    atualizarSeloFila();
    vigiarLista();
    if (!ocupado && !el.painel.classList.contains('min')) atualizarFiltrosNaPagina({ seMudou: true });
  }

  function avisosAoAbrir() {
    const conf = lerConf();
    if (conf.ids.length) { el.confIds.value = conf.ids.join('\n'); mostrarConferencia(); }
    const fila = GM_getValue(CHAVE_FILA, null);
    if (fila && !fila.ativa && fila.i < fila.itens.length) {
      el.fila.value = fila.itens.map((x) => x.place_id || x.url).join('\n');
      status(`Fila pausada em ${fila.i}/${fila.itens.length}. "Continuar fila" retoma do próximo lugar.`, 'alerta');
      return;
    }
    const a = GM_getValue(CHAVE_ANDAMENTO, null);
    if (a?.motivo === 'em andamento') status(`A coleta de ${a.lugar.nome_estabelecimento} (${a.quando}) não terminou: ${a.linhas.length} avaliações salvas. Use "Recuperar última coleta" em Retomada.`, 'alerta');
  }

  console.info('[Avaliações do Maps] carregado');
  garantirPainel();
  avisosAoAbrir();
  setInterval(() => { try { garantirPainel(); } catch (e) { console.error('[Avaliações do Maps]', e); } }, 1500);
  rodarFilaNestaPagina();
})();
