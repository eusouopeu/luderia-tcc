// ==UserScript==
// @name         Coletor de avaliações do Google Maps (TCC Luderia)
// @namespace    tcc-luderia
// @version      2026.11.13-3
// @description  Abre as avaliações de um lugar, ordena por mais recentes, rola até o fim do período, expande os textos (no idioma original), filtra por tema, opinião, componentes e busca, salva o progresso, coleta em fila, confere amostras e exporta CSV com autor pseudonimizado.
// @match        https://www.google.com/maps/*
// @match        https://www.google.com.br/maps/*
// @run-at       document-idle
// @noframes
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// @grant        GM_listValues
// @grant        GM_download
// @require      lista_maps_avaliacoes.js
// ==/UserScript==

/*
 * Uso pessoal, para o Bloco B2: completar estabelecimentos em que a coleta
 * automática falhou. O recorte do método (_docs/_instrucoes/4_metodologia.md) é o
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
 * Menu das casas (mesmo padrão do coletor de preços do B5): o seletor do topo traz as 63
 * casas do B1 por capital, com ✓ coletada (avaliações lidas), ◐ lista parou de crescer,
 * ! coleta incompleta e ○ falta. Escolher uma casa abre o lugar no Maps, coleta sozinho
 * quando ele carrega e baixa o CSV de tudo; "Próximo" faz o mesmo com a próxima que falta
 * (primeiro na mesma capital); "Coletada"/"Desfazer" marca à mão; "só as que faltam"
 * esconde as prontas. O estado vem dos resumos de coleta guardados (place_id ou nome).
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
 * Marcador de coleta (desde 2026.11.12-2): depois de cada lugar, avulso, pelo menu
 * ou em fila, baixa SEMPRE o CSV-resumo daquele lugar
 * (AAAA-MM-DD_<lugar>_maps_avaliacoes_resumo.csv), mesmo com zero avaliações
 * lidas; o CSV de tudo continua só quando há linhas. É a prova de que a coleta
 * foi feita. A coluna situacao segue o vocabulário de _src/dicionario.md §4.5:
 * ok (completa, com avaliação no período), vazia (completa, zero no período) ou
 * refazer (incompleta ou incerta).
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
 * sem expandir ou com texto (ou resposta do dono) terminado no marcador " …" do
 * Google (a coleta avisa ao terminar e na exportação); recolete o lugar.
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
    const cabecalho = document.querySelector('div.F7nice')?.innerText || '';
    const resumo = cabecalho || painelLugar?.innerText || '';
    // Número entre parênteses só no cabeçalho: no painel inteiro ele pega o DDD
    // de um telefone numa resposta do dono ("(31)") e encerra a coleta cedo.
    const volume = ((cabecalho && cabecalho.match(/\(([\d.,\s]+)\)/)) || resumo.match(/([\d.]+)\s+(?:avalia|review)/i) || [])[1] || '';
    return {
      place_id: (url.match(/!19s(ChIJ[\w-]+)/) || url.match(/place_id:(ChIJ[\w-]+)/) || [])[1] || placeIdFila || el.placeId?.value.trim() || '',
      id_maps: (url.match(/!1s(0x[0-9a-f]+:0x[0-9a-f]+)/i) || [])[1] || '',
      nome_estabelecimento: document.querySelector('h1.DUwDvf, div[role="main"] h1')?.innerText.trim()
        || painelLugar?.getAttribute('aria-label')?.trim() || '',
      avaliacao_media_estabelecimento: (resumo.match(/(\d[.,]\d)/) || [])[1]?.replace(',', '.') || '',
      volume_avaliacoes_estabelecimento: volume.replace(/\D/g, ''),
    };
  }

  // O volume do lugar só encerra a coleta se a lista também parou de crescer:
  // um volume lido errado não pode cortar a lista no meio.
  const fimPeloVolume = (carregadas, volume, semCrescer) => volume > 0 && carregadas >= volume && semCrescer >= 2;

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
  // Nem todo "Mais" é <button>: nos textos cortados depois de um emoji ele chegou
  // como "… Mais" dentro do próprio texto. Vale o elemento mais interno: o <span>
  // "Mais" que embrulha o botão não abre nada, e o clique no interno sobe até ele.
  const ehMais = (b) => b.classList.contains('w8nwRe') || /^(mais|more|ver mais|see more)$/i.test(textoControle(b));
  const botoesMais = (c) => {
    const achados = [...c.querySelectorAll('button, [role="button"], a, span')].filter(ehMais);
    return achados.filter((b) => !achados.some((o) => o !== b && b.contains?.(o)));
  };
  // Marcador do Google no fim do texto cortado: espaço + "…".
  const terminaCortado = (t) => /\s…$/.test((t || '').trim());

  // Clica em "Ver original" (para ler o texto no idioma do autor) e em "Mais", e
  // repete enquanto sobrar "Mais": o original volta cortado, e o Maps às vezes
  // ignora o clique ou redesenha o cartão recolhido. Cartão recém-carregado pode
  // ainda não responder: a espera cresce a cada rodada. Botão que não abre depois
  // de 6 cliques fica de lado (a coluna texto_expandido marca o cartão).
  async function expandirTextos() {
    let n = 0;
    for (let rodada = 0; rodada < 4; rodada++) {
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
          const tentativas = +(b.dataset.tccCliques || 0);
          if (tentativas >= 6) continue;
          b.dataset.tccCliques = tentativas + 1;
          if (rodada) b.scrollIntoView?.({ block: 'nearest' });
          b.click();
          cliques++;
        }
      }
      if (!cliques) break;
      n += cliques;
      await esperar(400 * (rodada + 1));
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
      texto_expandido: botoesMais(c).length || terminaCortado(texto)
        || terminaCortado(resposta?.querySelector('.wiI7pd')?.innerText) ? 'não' : 'sim',
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

  // Ficam no kit do painel (botões do cabeçalho); aqui, só o atalho para a lógica da coleta.
  const prefs = { get som() { return kit.som; }, get autobaixar() { return kit.autobaixar; } };
  const tocar = (ok = true) => kit.tocar(ok);

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
      const noFim = caixa.scrollTop + caixa.clientHeight >= caixa.scrollHeight - 20;
      semCrescer = cs.length === ultimoN && noFim ? semCrescer + 1 : 0;
      if (fimPeloVolume(cs.length, +infoLugar().volume_avaliacoes_estabelecimento, semCrescer)) return 'fim da lista';
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
      situacao: situacaoColeta(COMPLETA[motivo] || 'não', noP.length),
    };
  }

  // Vocabulário único das coletas (_src/dicionario.md §4.5).
  function situacaoColeta(completa, noPeriodo) {
    if (completa !== 'sim') return 'refazer';
    return noPeriodo > 0 ? 'ok' : 'vazia';
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
    rotularCasas();
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
        resumo = { data_coleta: agora(), place_id: item.place_id, url: item.url, motivo_parada: 'lugar não carregou', coleta_completa: 'não', versao_script: VERSAO, situacao: 'refazer' };
      } else {
        await esperar(2500);
        el.jaOrdenado.checked = false;
        status(`Fila ${fila.i + 1}/${fila.itens.length}: coletando ${infoLugar().nome_estabelecimento}…`);
        let motivo;
        try { motivo = await coletar(); } catch (e) { motivo = `erro: ${e.message}`; }
        resumo = ultimoResumo || { data_coleta: agora(), place_id: item.place_id, url: item.url, motivo_parada: motivo, coleta_completa: 'não', versao_script: VERSAO, situacao: 'refazer' };
        if (resultado.length) baixar(resultado, 'tudo', { forcar: true });
      }
      baixarResumoLugar(resumo, item.nome || item.place_id);
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

  // A lista vem de lista_maps_avaliacoes.js, lida pelo carregador (@require) antes deste arquivo.
  if (typeof LISTA_MAPS_AVALIACOES === 'undefined') {
    const msg = '[Avaliações do Maps] lista_maps_avaliacoes.js não foi carregada: reinstale o carregador (python3 _src/outros/G5_outros/gerar_carregadores.py --abrir).';
    console.error(msg);
    if (typeof alert === 'function') alert(msg);
    return;
  }
  // Itens do menu em lista_maps_avaliacoes.js (pasta deste script).
  const POP = LISTA_MAPS_AVALIACOES.map(([id, nome, capital]) => ({ id, nome, capital }));
  const CHAVE_ALVO = 'alvo:atual';
  const CHAVE_ABRIR = 'alvo:abrir';
  const CHAVE_MARCAS = 'alvo:marcas'; // { place_id: true (dada por coletada) | false (desfeita) }
  const CHAVE_SO_FALTAM = 'pref:soFaltam';
  const urlCasa = (p) => `https://www.google.com/maps/place/?q=place_id:${p.id}`;
  const pidAtual = () => GM_getValue(CHAVE_ALVO, POP[0].id);

  // Casa do B1 do lugar aberto: pelo place_id (URL, fila ou campo) ou pelo nome exato.
  function casaDoLugar(lugar) {
    if (lugar.place_id) { const p = POP.find((x) => x.id === lugar.place_id); if (p) return p; }
    const n = semAcento(lugar.nome_estabelecimento).trim();
    return n ? POP.find((x) => semAcento(x.nome).trim() === n) || null : null;
  }

  // ok (coleta completa), incerta (a lista parou de crescer), falha (coleta incompleta)
  // ou falta. A marca à mão ("Coletada"/"Desfazer") prevalece sobre os resumos.
  function estadoCasa(p, resumos = GM_getValue(CHAVE_RESUMOS, []), marcas = GM_getValue(CHAVE_MARCAS, {})) {
    if (marcas[p.id] === true) return { e: 'ok', n: '' };
    if (marcas[p.id] === false) return { e: 'falta', n: '' };
    const rs = resumos.filter((r) => r.place_id === p.id || (!r.place_id && semAcento(r.nome_estabelecimento).trim() === semAcento(p.nome).trim()));
    if (!rs.length) return { e: 'falta', n: '' };
    const melhor = rs.find((r) => r.coleta_completa === 'sim') || rs.find((r) => r.coleta_completa === 'incerta') || rs[rs.length - 1];
    const e = melhor.coleta_completa === 'sim' ? 'ok' : melhor.coleta_completa === 'incerta' ? 'incerta' : 'falha';
    return { e, n: melhor.lidas ?? '' };
  }

  // Próxima casa que falta (ou cuja coleta falhou): primeiro na capital da atual, depois
  // nas outras, na ordem do seletor a partir da atual.
  function proximaQueFalta(pid, resumos, marcas) {
    const i0 = POP.findIndex((p) => p.id === pid);
    const atual = POP[i0] || POP[0];
    const ordem = [...POP.slice(i0 + 1), ...POP.slice(0, Math.max(i0, 0))]
      .filter((p) => ['falta', 'falha'].includes(estadoCasa(p, resumos, marcas).e));
    return ordem.find((p) => p.capital === atual.capital) || ordem[0] || null;
  }

  function abrirCasa(p) {
    GM_setValue(CHAVE_ALVO, p.id);
    GM_setValue(CHAVE_ABRIR, { pid: p.id, em: Date.now() });
    status(`Abrindo ${p.nome}…`);
    location.href = urlCasa(p);
  }

  function rotularCasas() {
    if (el.menu) el.menu.rotular();
  }

  // Casa aberta pelo seletor ou por "Próximo": coleta sozinha quando o lugar carrega e
  // baixa o CSV de tudo (a página muda na próxima casa, como na fila).
  async function coletarAoAbrir() {
    const pedido = GM_getValue(CHAVE_ABRIR, null);
    if (!pedido) return;
    GM_deleteValue(CHAVE_ABRIR);
    if (Date.now() - pedido.em > 2 * 60 * 1000) return;
    const casa = POP.find((p) => p.id === pedido.pid);
    if (!casa) return;
    placeIdFila = casa.id;
    await executar(async () => {
      status(`${casa.nome}: esperando o lugar carregar…`);
      if (!(await aguardar(() => infoLugar().nome_estabelecimento, 45000))) throw new Error(`${casa.nome} não carregou. Escolha a casa de novo ou abra o lugar à mão.`);
      await esperar(2500);
      el.jaOrdenado.checked = false;
      status(`Coletando ${casa.nome}…`);
      ultimoResumo = null;
      let motivo;
      try { motivo = await coletar(); } finally {
        if (resultado.length) baixar(resultado, 'tudo', { forcar: true });
        baixarResumoLugar(ultimoResumo || { data_coleta: agora(), place_id: casa.id, nome_estabelecimento: casa.nome, motivo_parada: motivo || 'erro', coleta_completa: 'não', versao_script: VERSAO, situacao: 'refazer' }, casa.nome);
      }
      rotularCasas();
      if (motivo === 'ordem errada' || motivo === 'lista não encontrada') throw new Error(MSG_MOTIVO[motivo]);
    }, { avisar: true });
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
    'texto_por_mes_max', 'motivo_parada', 'coleta_completa', 'versao_script', 'url', 'situacao'];
  const COLS_CONF = ['review_id', 'nome_estabelecimento', 'coletado_em', 'nota_coletada', 'nota_pagina', 'nota_confere_auto',
    'data_coletada', 'data_pagina', 'texto_confere_auto', 'resultado', 'observacao', 'conferido_em'];

  function celula(v) {
    const s = String(v ?? '');
    return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  }

  const csv = (linhas, cols) => '﻿' + [cols.join(';'), ...linhas.map((l) => cols.map((c) => celula(l[c])).join(';'))].join('\r\n');
  const nomeArquivo = (t) => String(t || 'lugar').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\w]+/g, '_').replace(/^_|_$/g, '').toLowerCase();

  // Nome do lugar no arquivo: o da população do B1 quando o place_id está nela. O Maps chama
  // as duas unidades de "São Jogue", e o segundo arquivo do dia virava "(1)" ou sobrescrevia.
  function nomeParaArquivo(placeId, nome) {
    const p = placeId && POP.find((x) => x.id === placeId);
    return nomeArquivo(p ? p.nome : nome);
  }

  // Com GM_download, em Downloads/TCC Luderia/B2_avaliacoes/_dados-brutos/coletas/ sem perguntar;
  // recusado (modo nativo, extensão fora da lista), o download comum.
  const PASTA_DOWNLOAD = 'B2_avaliacoes/_dados-brutos/coletas';
  function salvarArquivo(nome, conteudo, tipo = 'text/csv;charset=utf-8') {
    kit.baixarArquivo(nome, conteudo, tipo);
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
    salvarArquivo(`${dataLocal(new Date())}_${nomeParaArquivo(saida[0].place_id, linhas[0].nome_estabelecimento)}_maps_avaliacoes_${sufixo}.csv`, csv(saida, COLS));
  }

  function baixarResumo(linhas, sufixo) {
    if (!linhas.length) { status('Sem coletas no histórico.'); return; }
    salvarArquivo(`${dataLocal(new Date())}_maps_avaliacoes_resumo_${sufixo}.csv`, csv(linhas, COLS_RESUMO));
  }

  // Resumo de um lugar só, baixado depois de cada coleta, mesmo com zero linhas.
  function nomeResumoLugar(resumo, reserva = '', data = new Date()) {
    return `${dataLocal(data)}_${nomeParaArquivo(resumo.place_id, resumo.nome_estabelecimento || reserva || resumo.place_id)}_maps_avaliacoes_resumo.csv`;
  }

  function baixarResumoLugar(resumo, reserva = '') {
    if (!resumo) return;
    salvarArquivo(nomeResumoLugar(resumo, reserva), csv([resumo], COLS_RESUMO));
  }

  function baixarConferencia() {
    const marcas = Object.values(lerConf().marcas);
    if (!marcas.length) { status('Nenhuma avaliação marcada na conferência.'); return; }
    salvarArquivo(`${dataLocal(new Date())}_maps_avaliacoes_conferencia.csv`, csv(marcas, COLS_CONF));
  }

  // ---------- painel (kit dos painéis: _kit_painel/kit_painel.js) ----------
  // Na lateral direita. Se o painel de horários de pico estiver aberto, fica logo abaixo dele.
  // O kit nasceu deste painel (Montserrat, Heroicons outline, roxo como cor primária, botões
  // delineados por fundo, explicações em dicas); desde 2026.11.13-3 o painel usa o próprio kit.

  // >>> kit_painel (cópia de _src/webScripts/_kit_painel/kit_painel.js; regerar com: node _src/webScripts/_kit_painel/embutir.js)
  // Kit dos painéis dos webscripts do TCC Luderia. Fonte única: o embutir.js copia este
  // bloco para dentro de cada .user.js, entre os marcadores; não editar a cópia.
  // Padrão (o do maps_avaliacoes): canto superior direito, shadow DOM preso ao <html> e
  // reposto se sumir, arrastável e redimensionável com posição salva, Montserrat,
  // Heroicons outline, roxo como cor primária, verde/âmbar/vermelho para o desfecho,
  // explicações em dicas (ⓘ ou sobre o próprio botão) em vez de texto solto.
  // Só define funções: nada toca o DOM antes de montar() (os testes rodam no Node).
  function kitPainel(op = {}) {
    const P = op.prefixo || op.id || 'tcc';
    const temGM = typeof GM_getValue === 'function' && typeof GM_setValue === 'function';
    const ler = op.ler || ((c, padrao) => {
      try {
        if (temGM) return GM_getValue(c, padrao);
        const v = localStorage.getItem(c);
        return v == null ? padrao : JSON.parse(v);
      } catch (_) { return padrao; }
    });
    const gravar = op.gravar || ((c, v) => {
      try {
        if (temGM) { if (v == null && typeof GM_deleteValue === 'function') GM_deleteValue(c); else GM_setValue(c, v); return; }
        if (v == null) localStorage.removeItem(c); else localStorage.setItem(c, JSON.stringify(v));
      } catch (_) { /* sem armazenamento */ }
    });
    const chave = (s) => `${P}:kit:${s}`;
    const k = {
      el: {}, ocupado: false, parar: false, acoes: [], ler, gravar,
      som: ler(chave('som'), true), autobaixar: ler(chave('autobaixar'), true),
      // Modo semiautomático (fila): baixar o arquivo de cada item (casa, perfil, busca) assim que
      // ele termina, além do arquivo do fim da fila. Desligado por padrão.
      baixarCada: ler(chave('baixarcada'), false),
    };
    const dicas = new WeakMap();
    let hospedeiro = null, painel = null;

    // ---------- elementos ----------
    function criar(tag, props = {}, filhos = []) {
      const n = document.createElement(tag);
      for (const [a, v] of Object.entries(props)) {
        if (v == null) continue;
        if (a === 'dica') dica(n, v);
        else if (a === 'style') n.style.cssText = v;
        else if (a === 'role' || a.startsWith('aria-') || a.startsWith('data-')) n.setAttribute(a, v);
        else n[a] = v;
      }
      for (const f of [].concat(filhos)) {
        if (f == null || f === false) continue;
        n.appendChild(typeof f === 'object' ? f : document.createTextNode(String(f)));
      }
      return n;
    }

    // Heroicons 24/outline (traço 1.5).
    const ICONES = {
      'adjustments-horizontal': 'M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75',
      'arrow-down': 'M19.5 13.5 12 21m0 0-7.5-7.5M12 21V3',
      'arrow-down-on-square': 'M9 8.25H7.5a2.25 2.25 0 0 0-2.25 2.25v9a2.25 2.25 0 0 0 2.25 2.25h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25H15M9 12l3 3m0 0 3-3m-3 3V2.25',
      'arrow-down-on-square-stack': 'M7.5 7.5h-.75A2.25 2.25 0 0 0 4.5 9.75v7.5a2.25 2.25 0 0 0 2.25 2.25h7.5a2.25 2.25 0 0 0 2.25-2.25v-7.5a2.25 2.25 0 0 0-2.25-2.25h-.75m-6 3.75 3 3m0 0 3-3m-3 3V1.5m6 9h.75a2.25 2.25 0 0 1 2.25 2.25v7.5a2.25 2.25 0 0 1-2.25 2.25h-7.5a2.25 2.25 0 0 1-2.25-2.25v-.75',
    'arrow-down-tray': 'M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3',
      'arrow-path': 'M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99',
      'arrow-top-right-on-square': 'M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25',
      'arrow-up': 'M4.5 10.5 12 3m0 0 7.5 7.5M12 3v18',
      'arrow-up-tray': 'M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5',
      'arrow-uturn-right': 'm15 15 6-6m0 0-6-6m6 6H9a6 6 0 0 0 0 12h3',
      'arrow-uturn-left': 'M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3',
      'bell': 'M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0',
      'bell-slash': 'M9.143 17.082a24.248 24.248 0 0 0 3.844.148m-3.844-.148a23.856 23.856 0 0 1-5.455-1.31 8.964 8.964 0 0 0 2.3-5.542m3.155 6.852a3 3 0 0 0 5.667 1.97m1.965-2.277L21 21m-4.225-4.225a23.81 23.81 0 0 0 3.536-1.003A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6.53 6.53m10.245 10.245L6.53 6.53M3 3l3.53 3.53',
      'bookmark': 'M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z',
      'calendar-days': 'M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5',
      'chart-bar': 'M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z',
      'check': 'm4.5 12.75 6 6 9-13.5',
      'chevron-double-down': 'm4.5 5.25 7.5 7.5 7.5-7.5m-15 6 7.5 7.5 7.5-7.5',
      'chevron-down': 'm19.5 8.25-7.5 7.5-7.5-7.5',
      'chevron-left': 'M15.75 19.5 8.25 12l7.5-7.5',
      'chevron-right': 'm8.25 4.5 7.5 7.5-7.5 7.5',
      'chevron-up': 'm4.5 15.75 7.5-7.5 7.5 7.5',
      'clock': 'M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
      'code-bracket': 'M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5',
      'cube': 'm21 7.5-9-5.25L3 7.5m18 0-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9',
      'document-chart-bar': 'M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25M9 16.5v.75m3-3v3M15 12v5.25m-4.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z',
      'document-check': 'M10.125 2.25h-4.5c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125v-9M10.125 2.25h.375a9 9 0 0 1 9 9v.375M10.125 2.25A3.375 3.375 0 0 1 13.5 5.625v1.5c0 .621.504 1.125 1.125 1.125h1.5a3.375 3.375 0 0 1 3.375 3.375M9 15l2.25 2.25L15 12',
      'document-duplicate': 'M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H9.75',
      'document-text': 'M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z',
      'exclamation-triangle': 'M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z',
      'eye': 'M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178ZM15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z',
      'folder': 'M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z',
      'forward': 'M3 8.689c0-.864.933-1.406 1.683-.977l7.108 4.061a1.125 1.125 0 0 1 0 1.954l-7.108 4.061A1.125 1.125 0 0 1 3 16.811V8.69ZM12.75 8.689c0-.864.933-1.406 1.683-.977l7.108 4.061a1.125 1.125 0 0 1 0 1.954l-7.108 4.061a1.125 1.125 0 0 1-1.683-.977V8.69Z',
      'funnel': 'M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 0 1-.659 1.591l-5.432 5.432a2.25 2.25 0 0 0-.659 1.591v2.927a2.25 2.25 0 0 1-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 0 0-.659-1.591L3.659 7.409A2.25 2.25 0 0 1 3 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0 1 12 3Z',
      'hashtag': 'M5.25 8.25h15m-16.5 7.5h15m-1.8-13.5-3.9 19.5m-2.1-19.5-3.9 19.5',
      'information-circle': 'm11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z',
      'magnifying-glass': 'm21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z',
      'map-pin': 'M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z',
      'minus': 'M5 12h14',
      'bolt': 'm3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z',
      'bolt-slash': 'M11.412 15.655 9.75 21.75l3.745-4.012M9.257 13.5H3.75l2.659-2.849m2.048-2.194L14.25 2.25 12 10.5h8.25l-4.707 5.043M8.457 8.457 3 3m5.457 5.457 7.086 7.086m0 0L21 21',
      'no-symbol': 'M18.364 18.364A9 9 0 0 0 5.636 5.636m12.728 12.728A9 9 0 0 1 5.636 5.636m12.728 12.728L5.636 5.636',
      'play': 'M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z',
      'plus': 'M12 4.5v15m7.5-7.5h-15',
      'queue-list': 'M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 0 1 0 3.75H5.625a1.875 1.875 0 0 1 0-3.75Z',
      'stop': 'M5.25 7.5A2.25 2.25 0 0 1 7.5 5.25h9a2.25 2.25 0 0 1 2.25 2.25v9a2.25 2.25 0 0 1-2.25 2.25h-9a2.25 2.25 0 0 1-2.25-2.25v-9Z',
      'tag': 'M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z M6 6h.008v.008H6V6Z',
      'trash': 'm14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0',
      'truck': 'M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12',
      'x-mark': 'M6 18 18 6M6 6l12 12',
    };

    function icone(nome, classe = '') {
      const NS = 'http://www.w3.org/2000/svg';
      const svg = document.createElementNS(NS, 'svg');
      for (const [a, v] of Object.entries({ viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '1.5', 'aria-hidden': 'true' })) svg.setAttribute(a, v);
      if (classe) svg.setAttribute('class', classe);
      const p = document.createElementNS(NS, 'path');
      p.setAttribute('d', ICONES[nome] || '');
      p.setAttribute('stroke-linecap', 'round');
      p.setAttribute('stroke-linejoin', 'round');
      svg.appendChild(p);
      return svg;
    }

    // ---------- dicas: balão próprio (mais rápido que o title do navegador) ----------
    // Qualquer elemento com dica mostra o balão ao parar o mouse (ou com foco); o ⓘ
    // abre na hora e, clicado, fica fixo até Esc, rolagem ou clique fora.
    let dicaAncora = null, dicaFixa = false, timerDica = 0;

    function dica(n, conteudo) {
      if (!conteudo) { dicas.delete(n); n.removeAttribute('data-dica'); return n; }
      dicas.set(n, conteudo);
      n.setAttribute('data-dica', typeof conteudo === 'string' ? conteudo : '');
      if (typeof conteudo === 'string' && n.tagName === 'BUTTON' && !n.textContent.trim()) n.setAttribute('aria-label', conteudo);
      return n;
    }

    function abrirDica(ancora, fixa = false) {
      clearTimeout(timerDica);
      const c = dicas.get(ancora);
      if (!c || !k.el.dica) return;
      dicaAncora = ancora; dicaFixa = fixa;
      const v = typeof c === 'function' ? c() : c;
      k.el.dica.replaceChildren(typeof v === 'object' ? v : document.createTextNode(String(v)));
      k.el.dica.hidden = false;
      const r = ancora.getBoundingClientRect(), d = k.el.dica.getBoundingClientRect(), M = 10;
      const left = Math.min(Math.max(M, r.left + r.width / 2 - d.width / 2), innerWidth - d.width - M);
      let top = r.bottom + 6;
      if (top + d.height > innerHeight - M) top = Math.max(M, r.top - d.height - 6);
      k.el.dica.style.left = `${left}px`;
      k.el.dica.style.top = `${top}px`;
    }

    function fecharDica() {
      clearTimeout(timerDica);
      if (k.el.dica) k.el.dica.hidden = true;
      dicaAncora = null; dicaFixa = false;
    }

    const comDica = (e) => e.composedPath().find((n) => n.nodeType === 1 && dicas.has(n));

    function ajuda(conteudo, rotulo = 'Explicação') {
      const i = criar('span', { className: 'ajuda', tabIndex: 0, role: 'button', 'aria-label': rotulo }, [icone('information-circle')]);
      return dica(i, conteudo);
    }

    // ---------- controles ----------
    // botao('arrow-down-tray', 'CSV', fn, { classe: 'mini', dica: '…' }); sem texto vira botão-ícone.
    function botao(ico, texto, fn, { classe = '', dica: d = '' } = {}) {
      const b = criar('button', { type: 'button', className: `${texto ? '' : 'ico '}${classe}`.trim(), onclick: fn },
        [ico ? icone(ico) : null, texto || null]);
      if (d) dica(b, d);
      return b;
    }

    // Ação destrutiva em dois cliques: o primeiro arma (vermelho, treme) e o segundo, em até 3 s, executa.
    function botaoPerigo(ico, texto, fn, { classe = '', dica: d = '' } = {}) {
      const b = botao(ico, texto, null, { classe: `perigo ${classe}`, dica: d });
      let armado = 0;
      const desarmar = () => { clearTimeout(armado); armado = 0; b.classList.remove('armado'); dica(b, d); };
      b.onclick = () => {
        if (!armado) {
          b.classList.add('armado');
          dica(b, 'Clique de novo para confirmar');
          abrirDica(b);
          armado = setTimeout(desarmar, 3000);
          return;
        }
        desarmar(); fecharDica(); fn();
      };
      return b;
    }

    // Etiqueta liga/desliga: cinza desligada, azul ligada. `checked` imita a caixa de marcar.
    function etiqueta(rotulo, aoAlternar, { ligada = false, dica: d = '', ico = '' } = {}) {
      const b = criar('button', { type: 'button', className: 'tag' }, [ico ? icone(ico) : null, rotulo]);
      if (d) dica(b, d);
      const pintar = (v) => b.setAttribute('aria-pressed', String(v));
      pintar(ligada);
      Object.defineProperty(b, 'checked', { get: () => b.getAttribute('aria-pressed') === 'true', set: (v) => pintar(!!v) });
      b.onclick = () => { pintar(!b.checked); aoAlternar(b.checked); };
      return b;
    }

    // Botão-ícone de preferência (fica roxo ligado); a dica diz o estado.
    function alternaIcone({ ico, icoDesligado = ico, rotulo, ligado, aoMudar, classe = 'leve' }) {
      const b = criar('button', { type: 'button', className: `ico ${classe}` });
      let v = !!ligado;
      const pintar = () => {
        b.setAttribute('aria-pressed', String(v));
        b.replaceChildren(icone(v ? ico : icoDesligado));
        dica(b, `${rotulo}: ${v ? 'ligado' : 'desligado'}`);
        b.setAttribute('aria-label', rotulo);
      };
      b.onclick = () => { v = !v; pintar(); aoMudar(v); if (dicaAncora === b) abrirDica(b); };
      Object.defineProperty(b, 'checked', { get: () => v, set: (x) => { v = !!x; pintar(); } });
      pintar();
      return b;
    }

    // Opção da fila: baixar cada item ao terminar (k.baixarCada, gravada por script).
    function botaoBaixarCada(rotulo = 'Baixar cada item ao terminar (fila)') {
      return alternaIcone({ ico: 'arrow-down-on-square-stack', rotulo, ligado: k.baixarCada,
        aoMudar: (v) => { k.baixarCada = v; gravar(chave('baixarcada'), v); } });
    }

    // Controle segmentado: [[valor, texto, dica]].
    function pills(opcoes, valor, aoMudar) {
      const caixa = criar('div', { className: 'pills', role: 'tablist' });
      const bs = opcoes.map(([v, t, d]) => {
        const b = criar('button', { type: 'button', className: 'pill', role: 'tab', 'data-valor': v }, [t]);
        if (d) b.appendChild(ajuda(d));
        b.onclick = () => { caixa.valor = v; aoMudar(v); };
        return b;
      });
      Object.defineProperty(caixa, 'valor', {
        get: () => valor,
        set: (v) => { valor = v; for (const b of bs) b.setAttribute('aria-selected', String(b.dataset.valor === String(v))); },
      });
      caixa.append(...bs);
      caixa.valor = valor;
      return caixa;
    }

    // Seção recolhível que lembra se estava aberta.
    const abertos = new Set(ler(chave('abertos'), op.abertos || []));
    function secao(id, cabeca, filhos, aoAbrir = null) {
      const d = criar('details', { open: abertos.has(id) }, [
        criar('summary', {}, [icone('chevron-right', 'seta'), ...[].concat(cabeca)]), ...filhos]);
      d.addEventListener('toggle', () => {
        if (d.open) abertos.add(id); else abertos.delete(id);
        gravar(chave('abertos'), [...abertos]);
        if (d.open && aoAbrir) aoAbrir();
      });
      return d;
    }

    // Botão dentro do <summary> que não abre nem fecha a seção.
    const naoAlterna = (fn) => (e) => { e.preventDefault(); e.stopPropagation(); fn(e); };

    const linha = (filhos, classe = '') => criar('div', { className: `linha ${classe}`.trim() }, filhos);
    const esp = () => criar('span', { className: 'esp' });
    const rotulo = (t, d) => criar('span', { className: 'rotulo' }, [t, d ? ajuda(d) : null]);
    const selo = (t = '', classe = '') => criar('span', { className: `selo ${classe}`.trim(), textContent: t });

    // ---------- status, resumo e progresso ----------
    function animarStatus() {
      const s = k.el.status;
      s.classList.remove('entra');
      void s.offsetWidth;
      s.classList.add('entra');
    }

    function status(t, tipo = '') {
      if (!k.el.status) return;
      const cls = `status${tipo ? ` st-${tipo}` : ''}`;
      if (k.el.status.className.replace(' entra', '') !== cls || k.el.status.textContent !== t) {
        const mudouTipo = k.el.status.className.replace(' entra', '') !== cls;
        k.el.status.className = cls;
        k.el.status.textContent = t;
        if (mudouTipo) animarStatus();
      }
      if (tipo === 'ok' || tipo === 'erro' || tipo === 'alerta') estado(tipo);
    }

    // Resumo do desfecho: cabeçalho com a cor do resultado, contagens e avisos.
    // linhas: [[número, texto, detalhe]]; avisos: textos em âmbar.
    function resumo({ titulo, sub = '', linhas = [], avisos = [], tipo = '' }) {
      if (!k.el.status) return;
      const item = ([n, t, det]) => criar('li', {}, [criar('b', { textContent: String(n) }), ` ${t}`,
        det ? criar('span', { className: 'suave', textContent: ` · ${det}` }) : null]);
      k.el.status.className = `status rico${tipo ? ` st-${tipo}` : ''}`;
      k.el.status.replaceChildren(...[
        criar('div', { className: 'cab' }, [criar('span', { className: 'ponto' }), titulo]),
        sub ? criar('div', { className: 'suave', textContent: sub }) : null,
        linhas.length ? criar('ul', {}, linhas.map(item)) : null,
        ...avisos.filter(Boolean).map((t) => criar('p', { className: 'aviso', textContent: t })),
      ].filter(Boolean));
      animarStatus();
      if (tipo) estado(tipo);
    }

    // Barra de progresso: barra('coleta') cria; progresso('coleta', 0.4, 'texto'),
    // progresso('coleta', true, 'texto') indeterminada e progresso('coleta', null) esconde.
    const barras = {};
    function barra(nome) {
      const b = { preenchido: criar('div', { className: 'preenchido' }), texto: criar('span'), pct: criar('span') };
      b.trilho = criar('div', { className: 'trilho' }, [b.preenchido]);
      b.caixa = criar('div', { className: 'barra', hidden: true }, [criar('div', { className: 'txt' }, [b.texto, b.pct]), b.trilho]);
      barras[nome] = b;
      return b.caixa;
    }

    function progresso(nome, frac, texto = '') {
      const b = barras[nome];
      if (!b) return;
      if (frac == null || frac === false) { b.caixa.hidden = true; return; }
      b.caixa.hidden = false;
      b.texto.textContent = texto;
      const indef = frac === true;
      b.trilho.classList.toggle('indef', indef);
      b.preenchido.classList.toggle('rodando', !indef && k.ocupado);
      if (indef) { b.pct.textContent = ''; return; }
      const pct = Math.round(Math.min(1, Math.max(0, frac)) * 100);
      b.preenchido.style.width = `${pct}%`;
      b.pct.textContent = `${pct}%`;
    }

    // Ponto do cabeçalho (visível minimizado): cinza parado, roxo pulsando em curso,
    // verde concluído, âmbar interrompido ou incerto, vermelho erro.
    function estado(s = '') {
      if (k.el.ponto) k.el.ponto.className = `ponto-estado ${s}`.trim();
    }

    // Liga e desliga as ações conforme a tarefa em curso.
    function atualizarAcoes(ocupado = k.ocupado) {
      for (const b of k.acoes) b.disabled = ocupado;
      if (k.el.parar) k.el.parar.disabled = !ocupado;
      if (ocupado) estado('rodando');
    }

    const botaoParar = (fn = () => { k.parar = true; status('Parando…'); }) =>
      (k.el.parar = botao('stop', '', fn, { classe: 'parar', dica: 'Parar' }));

    // Roda uma tarefa travando as ações; "Parar" põe k.parar = true.
    async function executar(fn, { avisar = true } = {}) {
      if (k.ocupado) return false;
      k.ocupado = true; k.parar = false; atualizarAcoes();
      let ok = true;
      try { await fn(); } catch (e) { ok = false; if (!k.parar) status(`Erro: ${e.message}`, 'erro'); }
      const parado = k.parar;
      k.ocupado = false; atualizarAcoes();
      estado(!ok && !parado ? 'erro' : parado ? 'alerta' : 'ok');
      if (parado && ok) status('Interrompido.', 'alerta');
      if (avisar) tocar(ok && !parado);
      return ok && !parado;
    }

    // ---------- microinterações ----------
    let audio = null;
    function liberarAudio() {
      try { audio = audio || new AudioContext(); if (audio.state === 'suspended') audio.resume(); } catch (_) { audio = null; }
    }

    function tocar(ok = true) {
      if (!k.som) return;
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

    // Brilho rápido num elemento (verde = feito, vermelho = falhou).
    function piscar(n, tipo = 'ok') {
      if (!n) return;
      n.classList.remove('pisca-ok', 'pisca-erro');
      void n.offsetWidth;
      n.classList.add(`pisca-${tipo}`);
      setTimeout(() => n.classList.remove(`pisca-${tipo}`), 800);
    }

    // O botão vira um ✓ verde por um instante.
    function confirmarBotao(b) {
      if (!b) return;
      const antes = [...b.childNodes];
      b.classList.add('feito');
      b.replaceChildren(icone('check'), ...antes.filter((n) => n.nodeType === 3));
      setTimeout(() => { b.classList.remove('feito'); b.replaceChildren(...antes); }, 1200);
    }

    async function copiar(texto, b) {
      try { await navigator.clipboard.writeText(texto); } catch (_) {
        const t = criar('textarea', { value: texto });
        hospedeiro.shadowRoot.appendChild(t);
        t.select();
        document.execCommand('copy');
        t.remove();
      }
      confirmarBotao(b);
    }

    // ---------- arquivos ----------
    const celula = (v) => {
      const s = v == null ? '' : String(v);
      return /[;"\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    // CSV com ";" e BOM (abre direto no Excel pt-BR; no pandas, sep=";").
    const csv = (linhas, cols) => '﻿' + [cols.join(';'), ...linhas.map((l) => cols.map((c) => celula(l[c])).join(';'))].join('\r\n');

    // Baixa o arquivo e devolve uma Promise que resolve quando o download foi entregue ao
    // navegador (quem navega logo depois espera por ela; até 13/11/2026 o segundo CSV de um
    // par se perdia na navegação). Com GM_download (script com @grant) e op.pasta (ex.:
    // "B1_entorno/_dados-brutos"), salva sem perguntar em Downloads/TCC Luderia/<pasta>/,
    // para o arquivo não cair na pasta de outra coleta; se o Tampermonkey recusar (modo de
    // download nativo, extensão fora da lista), cai no download comum.
    const pastaDoArquivo = (pasta, nome) => (pasta ? `TCC Luderia/${String(pasta).replace(/^\/+|\/+$/g, '')}/${nome}` : nome);
    function baixarComum(nome, url) {
      const a = criar('a', { href: url, download: nome });
      (document.body || document.documentElement).appendChild(a);
      a.click();
      a.remove();
    }
    function baixarArquivo(nome, conteudo, tipo = 'text/csv;charset=utf-8', opcoes = {}) {
      const pasta = opcoes.pasta ?? op.pastaDownload ?? '';
      const url = URL.createObjectURL(new Blob([conteudo], { type: tipo }));
      const soltar = () => setTimeout(() => URL.revokeObjectURL(url), 10000);
      if (typeof GM_download !== 'function' || !pasta) {
        baixarComum(nome, url);
        soltar();
        return esperarMs(600).then(() => ({ nome, via: 'navegador' }));
      }
      return new Promise((resolve) => {
        let feito = false;
        const fim = (via) => { if (feito) return; feito = true; soltar(); resolve({ nome: via === 'pasta' ? pastaDoArquivo(pasta, nome) : nome, via }); };
        const comum = () => { baixarComum(nome, url); setTimeout(() => fim('navegador'), 600); };
        try {
          GM_download({ url, name: pastaDoArquivo(pasta, nome), saveAs: false, onload: () => fim('pasta'), onerror: () => { if (!feito) comum(); }, ontimeout: () => { if (!feito) comum(); } });
          // Sem resposta do Tampermonkey em 15 s: segue (o download pode ainda sair).
          setTimeout(() => fim('pasta'), 15000);
        } catch (_) { comum(); }
      });
    }
    const esperarMs = (ms) => new Promise((r) => setTimeout(r, ms));

    // ---------- menu de alvos (casas, perfis, cardápios, acervos) ----------
    // Seletor por grupo com ✓ ok, ◐ parcial, ! refazer, ○ falta; contador com barra fina;
    // botões Próximo (o que falta, primeiro no mesmo grupo), Marcar/Desfazer e Só os que faltam.
    const SIMBOLO = { ok: '✓', parcial: '◐', falha: '!', falta: '○' };
    function menuAlvos({ itens, id = (x) => x.id, grupo = (x) => x.capital, nome = (x) => x.nome, detalhe = () => '',
      estadoDe, atual, aoEscolher, aoProximo, aoMarcar, unidade = 'coletados' }) {
      const lista = itens();
      const grupos = [...new Set(lista.map(grupo))];
      const select = criar('select', { 'aria-label': 'Alvo da coleta' }, grupos.map((g) => criar('optgroup', { label: g },
        lista.filter((x) => grupo(x) === g).map((x) => criar('option', { value: id(x), textContent: nome(x) })))));
      dica(select, `✓ ok · ◐ parcial · ! refazer · ○ falta. Escolher abre o alvo e coleta.`);
      select.onchange = () => aoEscolher(lista.find((x) => id(x) === select.value));
      let soFaltam = ler(chave('soFaltam'), false);
      const bProx = botao('forward', 'Próximo', () => aoProximo(), { classe: 'mini', dica: 'Abre o próximo que falta (primeiro no mesmo grupo) e coleta sozinho' });
      // Sem aoMarcar, o menu fica sem o botão Marcar/Desfazer.
      const bMarcar = aoMarcar ? botao('check', '', () => aoMarcar(lista.find((x) => id(x) === select.value)), { classe: 'leve' }) : null;
      const bFiltro = alternaIcone({ ico: 'funnel', rotulo: 'Só os que faltam', ligado: soFaltam,
        aoMudar: (v) => { soFaltam = v; gravar(chave('soFaltam'), v); rotular(); } });
      const cont = criar('span', { className: 'pos' });
      const trilho = criar('div', { className: 'trilho fino' }, [criar('div', { className: 'preenchido' })]);
      const caixa = criar('div', { className: 'menu' }, [
        linha([select]),
        linha([criar('div', { className: 'contador' }, [cont, trilho]), bProx, bMarcar, bFiltro], 'compacta'),
      ]);
      function rotular() {
        const a = atual();
        let prontos = 0;
        for (const o of select.querySelectorAll('option')) {
          const x = lista.find((y) => id(y) === o.value);
          const e = estadoDe(x);
          if (e === 'ok') prontos++;
          const t = `${SIMBOLO[e] || '○'} ${nome(x)}${detalhe(x, e) ? ` · ${detalhe(x, e)}` : ''}`;
          if (o.textContent !== t) o.textContent = t;
          o.className = e;
          o.hidden = soFaltam && e === 'ok' && id(x) !== a;
        }
        for (const g of select.querySelectorAll('optgroup')) g.hidden = [...g.querySelectorAll('option')].every((o) => o.hidden);
        if (a && select.value !== a) select.value = a;
        cont.textContent = `${prontos}/${lista.length} ${unidade}`;
        trilho.firstChild.style.width = `${Math.round((100 * prontos) / (lista.length || 1))}%`;
        const xa = lista.find((y) => id(y) === select.value);
        const col = xa && estadoDe(xa) === 'ok';
        if (!bMarcar) return;
        bMarcar.replaceChildren(icone(col ? 'arrow-uturn-left' : 'check'));
        dica(bMarcar, col ? 'Desfazer: volta a faltar' : 'Marcar como coletado, sem nova coleta');
      }
      return { caixa, select, rotular, bProx };
    }

    // ---------- painel ----------
    const CSS = `
      :host{--fundo:#fff;--texto:#18181b;--suave:#71717a;--sup:#f4f4f5;--sup2:#e4e4e7;--linha:#ececef;
        --caneta:#7e22ce;--caneta-forte:#6b21a8;--caneta-100:#f3e8ff;--azul:#2563eb;--azul-100:#dbeafe;
        --ok:#15803d;--ok-100:#dcfce7;--erro:#b91c1c;--erro-100:#fee2e2;--alerta:#b45309;--alerta-100:#fef3c7;
        --fonte:Montserrat,system-ui,-apple-system,"Segoe UI",sans-serif}
      @media (prefers-color-scheme:dark){:host{--fundo:#18181b;--texto:#f4f4f5;--suave:#a1a1aa;--sup:#27272a;--sup2:#3f3f46;
        --linha:#27272a;--caneta:#a855f7;--caneta-forte:#9333ea;--caneta-100:#3b0764;--azul:#3b82f6;--azul-100:#172554;
        --ok:#4ade80;--ok-100:#052e16;--erro:#f87171;--erro-100:#450a0a;--alerta:#fbbf24;--alerta-100:#451a03}}
      *{box-sizing:border-box}
      [hidden]{display:none!important}
      #painel{position:fixed;top:12px;right:12px;z-index:2147483647;width:var(--largura,272px);max-height:calc(100vh - 24px);
        overflow:auto;background:var(--fundo);color:var(--texto);border-radius:14px;
        box-shadow:0 8px 28px rgba(0,0,0,.2);font:13.5px/1.45 var(--fonte);padding:8px 12px 10px;
        resize:both;min-width:224px;min-height:44px;max-width:calc(100vw - 24px);transition:box-shadow .2s}
      #painel.min{height:auto!important;min-height:0;resize:none;width:auto!important;min-width:0}
      #painel.min>*:not(header){display:none}
      #painel.arrastando{user-select:none;opacity:.92;box-shadow:0 14px 40px rgba(0,0,0,.3)}
      header{display:flex;align-items:center;gap:2px;cursor:grab;touch-action:none;min-height:32px}
      #painel.arrastando header{cursor:grabbing}
      header .nome{flex:1;font-weight:700;font-size:14.5px;cursor:pointer;user-select:none;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;padding-right:6px}
      .ponto-estado{width:8px;height:8px;border-radius:50%;background:var(--sup2);margin-right:8px;flex:none;transition:background .3s}
      .ponto-estado.rodando{background:var(--caneta);animation:pulso 1.2s ease-in-out infinite}
      .ponto-estado.ok{background:var(--ok)} .ponto-estado.alerta{background:var(--alerta)} .ponto-estado.erro{background:var(--erro)}
      @keyframes pulso{0%,100%{box-shadow:0 0 0 0 rgba(147,51,234,.55)}50%{box-shadow:0 0 0 5px rgba(147,51,234,0)}}
      svg{width:18px;height:18px;flex:none}
      button{font:inherit;color:inherit;border:0;background:var(--sup);border-radius:8px;padding:6px 10px;cursor:pointer;
        display:inline-flex;align-items:center;justify-content:center;gap:6px;white-space:nowrap;
        transition:background .15s,color .15s,transform .1s,box-shadow .2s}
      button:hover:not(:disabled){background:var(--sup2)}
      button:active:not(:disabled){transform:scale(.94)}
      button:disabled{opacity:.35;cursor:default}
      :focus-visible{outline:2px solid var(--azul);outline-offset:1px}
      .ico{width:32px;height:32px;padding:0;flex:none}
      .ico.leve{background:transparent;color:var(--suave)}
      .ico.leve:hover:not(:disabled){background:var(--sup);color:var(--texto)}
      .ico.leve[aria-pressed=true]{color:var(--caneta);background:var(--caneta-100)}
      .primario{background:var(--caneta);color:#fff;font-weight:600;flex:1}
      .primario:hover:not(:disabled){background:var(--caneta-forte)}
      .verde{background:var(--ok-100);color:var(--ok)}
      .vermelho{background:var(--erro-100);color:var(--erro)}
      .verde:hover:not(:disabled),.vermelho:hover:not(:disabled){filter:brightness(.95)}
      .verde[aria-pressed=true]{background:var(--ok);color:#fff} .vermelho[aria-pressed=true]{background:var(--erro);color:#fff}
      .parar:not(:disabled){background:var(--erro-100);color:var(--erro)}
      .perigo{color:var(--suave)} .perigo:hover:not(:disabled){color:var(--erro);background:var(--erro-100)}
      button.armado{background:var(--erro)!important;color:#fff!important;animation:tremer .3s}
      @keyframes tremer{25%{transform:translateX(-2px)}75%{transform:translateX(2px)}}
      button.feito{background:var(--ok-100)!important;color:var(--ok)!important}
      .pisca-ok{animation:piscaOk .8s} .pisca-erro{animation:piscaErro .8s}
      @keyframes piscaOk{0%{box-shadow:0 0 0 0 rgba(21,128,61,.6)}100%{box-shadow:0 0 0 8px rgba(21,128,61,0)}}
      @keyframes piscaErro{0%{box-shadow:0 0 0 0 rgba(185,28,28,.6)}100%{box-shadow:0 0 0 8px rgba(185,28,28,0)}}
      .mini{padding:4px 9px;font-size:12.5px}
      .mini svg{width:16px;height:16px}
      .linha{display:flex;align-items:center;gap:6px;margin:7px 0;flex-wrap:wrap}
      .linha.compacta{flex-wrap:nowrap;margin-top:4px}
      .linha>.primario{min-width:0}
      .esp{flex:1}
      .rotulo{font-size:12px;font-weight:600;color:var(--suave);display:inline-flex;align-items:center;gap:4px}
      .suave{color:var(--suave)}
      select,input[type=text],input[type=search],input[type=date],textarea{font:inherit;color:inherit;background:var(--sup);border:0;border-radius:8px;padding:6px 8px;min-width:0}
      select{padding:5px 4px;cursor:pointer;flex:1;width:100%}
      select option{color:#111;background:#fff}
      select option.ok{color:#9ca3af} select option.parcial{color:#2563eb} select option.falha{color:#b45309}
      input{flex:1}
      input[type=date]{color-scheme:light dark;padding:4px 6px;font-size:12.5px;flex:1 1 0}
      input::placeholder,textarea::placeholder{color:var(--suave)}
      textarea{width:100%;height:60px;font:12px/1.45 ui-monospace,Menlo,monospace;resize:vertical;display:block}
      .busca{display:flex;align-items:center;gap:6px;background:var(--sup);border-radius:8px;padding:0 4px 0 10px;flex:1}
      .busca input{background:transparent;padding:6px 0}
      .busca>svg{color:var(--suave);width:16px;height:16px}
      .contador{flex:1;min-width:0;display:flex;flex-direction:column;gap:3px}
      .barra{margin:7px 0}
      .barra[hidden]{display:none}
      .barra .txt{display:flex;justify-content:space-between;font-size:12px;color:var(--suave);font-variant-numeric:tabular-nums}
      .trilho{height:6px;background:var(--sup);border-radius:999px;overflow:hidden;display:flex;position:relative}
      .trilho.fino{height:4px}
      .preenchido{height:100%;width:0;background:var(--caneta);border-radius:999px;transition:width .35s ease}
      .contador .preenchido{background:var(--ok)}
      .preenchido.rodando{background-image:linear-gradient(90deg,transparent,rgba(255,255,255,.4),transparent);background-size:200% 100%;animation:brilho 1.4s linear infinite}
      .trilho.indef .preenchido{width:35%!important;animation:indef 1.2s ease-in-out infinite}
      @keyframes brilho{from{background-position:200% 0}to{background-position:-200% 0}}
      @keyframes indef{from{transform:translateX(-100%)}to{transform:translateX(300%)}}
      details{border-top:1px solid var(--linha)}
      details[open]{padding-bottom:6px}
      summary{list-style:none;display:flex;align-items:center;gap:6px;cursor:pointer;font-size:14px;font-weight:600;padding:7px 0;user-select:none}
      summary::-webkit-details-marker{display:none}
      summary .seta{width:15px;height:15px;color:var(--suave);transition:transform .2s}
      details[open]>summary .seta{transform:rotate(90deg)}
      summary .ico{width:28px;height:28px;background:transparent;color:var(--suave)}
      summary .ico:hover:not(:disabled){background:var(--sup);color:var(--texto)}
      .selo{font-size:11.5px;font-weight:600;background:var(--sup);color:var(--suave);border-radius:999px;padding:1px 8px;white-space:nowrap}
      .selo:empty{display:none}
      .selo.ok{background:var(--ok-100);color:var(--ok)} .selo.alerta{background:var(--alerta-100);color:var(--alerta)}
      .selo.erro{background:var(--erro-100);color:var(--erro)} .selo.roxo{background:var(--caneta-100);color:var(--caneta)}
      .pos{font-size:12px;color:var(--suave);font-variant-numeric:tabular-nums;font-weight:500;white-space:nowrap}
      .subtitulo{font-size:12px;font-weight:600;color:var(--suave);margin:10px 0 5px;display:flex;align-items:center;gap:4px}
      .tags{display:flex;flex-wrap:wrap;gap:5px;margin:6px 0}
      .tag{padding:3px 10px;border-radius:999px;font-size:12.5px;background:var(--sup);color:var(--suave);gap:4px}
      .tag svg{width:15px;height:15px}
      .tag[aria-pressed=true]{background:var(--azul);color:#fff}
      .tag[aria-pressed=true]:hover{background:var(--azul);filter:brightness(1.08)}
      .tag[aria-pressed=true] .ajuda{color:#fffc}
      .pills{display:flex;background:var(--sup);border-radius:999px;padding:3px;gap:2px;flex:1}
      .pill{flex:1;background:transparent;border-radius:999px;padding:3px 6px;font-size:12.5px;color:var(--suave);gap:4px}
      .pill:hover:not(:disabled){background:var(--sup2)}
      .pill[aria-selected=true]{background:var(--fundo);color:var(--caneta);font-weight:600;box-shadow:0 1px 2px rgba(0,0,0,.08)}
      .ajuda{display:inline-flex;color:var(--suave);cursor:help;border-radius:999px}
      .ajuda svg{width:15px;height:15px}
      .ajuda:hover{color:var(--caneta)}
      .dica{position:fixed;z-index:2147483647;max-width:280px;background:var(--texto);color:var(--fundo);
        font:12.5px/1.5 var(--fonte);padding:7px 10px;border-radius:8px;box-shadow:0 6px 20px rgba(0,0,0,.25);pointer-events:none;
        white-space:pre-line;animation:entra .12s ease-out}
      .dica[hidden]{display:none}
      .status{font-size:13px;border-radius:10px;padding:7px 10px;background:var(--sup);white-space:pre-line;margin:7px 0;transition:background .25s}
      .status:empty{display:none}
      .status.entra{animation:entra .25s ease-out}
      @keyframes entra{from{opacity:0;transform:translateY(-3px)}to{opacity:1;transform:none}}
      .status.rico{white-space:normal}
      .status .cab{font-weight:600;display:flex;gap:8px;align-items:center}
      .status ul{margin:4px 0 0;padding-left:18px}
      .status li::marker{color:var(--suave)}
      .ponto{width:8px;height:8px;border-radius:50%;background:var(--suave);flex:none}
      .st-ok{background:var(--ok-100)} .st-ok .ponto{background:var(--ok)}
      .st-alerta{background:var(--alerta-100)} .st-alerta .ponto{background:var(--alerta)}
      .st-erro{background:var(--erro-100)} .st-erro .ponto{background:var(--erro)}
      .aviso{color:var(--alerta);font-size:12.5px;margin:5px 0 0;font-weight:500}
      .aviso::before{content:"⚠ "}
      .st-alerta .aviso,.st-erro .aviso{color:inherit}
      .info{font-size:12.5px;background:var(--sup);border-radius:10px;padding:7px 10px;margin:7px 0;white-space:pre-line}
      .info:empty{display:none}
      .mono{font:11.5px/1.4 ui-monospace,Menlo,monospace;color:var(--suave);word-break:break-all}
      .chip{font-size:11.5px;font-weight:600;border-radius:999px;padding:1px 8px;white-space:nowrap;background:var(--sup);color:var(--suave)}
      .chip.ok{background:var(--ok-100);color:var(--ok)} .chip.alerta{background:var(--alerta-100);color:var(--alerta)}
      .chip.erro{background:var(--erro-100);color:var(--erro)} .chip.azul{background:var(--azul-100);color:var(--azul)}
      .lista{max-height:280px;overflow:auto;display:flex;flex-direction:column;gap:1px;margin-top:4px}
      .vazio{font-size:12.5px;color:var(--suave);margin:6px 0}
      table{width:100%;border-collapse:collapse;font-size:12px;margin-top:4px;font-variant-numeric:tabular-nums}
      td,th{padding:3px 4px;border-bottom:1px solid var(--linha);text-align:left}
      th{color:var(--suave);font-weight:600} td.n,th.n{text-align:right}
      tr.total td{font-weight:700;border-bottom:0}
      @media (prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}`;

    function carregarFonte() {
      if (document.getElementById('tcc-fonte-montserrat') || !document.head) return;
      document.head.appendChild(criar('link', { id: 'tcc-fonte-montserrat', rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap' }));
    }

    // Painéis 20% mais estreitos desde 13/11/2026: a largura pedida pelo script vale ×ESCALA, e a
    // largura já salva pelo autor é reduzida uma vez (marca `escala`).
    const ESCALA = 0.8;
    // Posição e tamanho escolhidos pelo autor; sem posição salva, vale posicaoPadrao().
    let posicao = ler(chave('posicao'), null);
    if (posicao?.width && posicao.escala !== ESCALA) {
      const px = parseFloat(posicao.width);
      posicao = { ...posicao, width: Number.isFinite(px) ? `${Math.round(px * ESCALA)}px` : posicao.width, escala: ESCALA };
      gravar(chave('posicao'), posicao);
    }
    let arrastou = false;

    function posicionar() {
      if (!painel) return;
      const p = painel;
      if (posicao?.width && !p.style.width && !p.classList.contains('min')) { p.style.width = posicao.width; p.style.height = posicao.height || ''; }
      if (posicao && posicao.left != null) {
        const w = p.offsetWidth || 272;
        const left = Math.min(Math.max(0, posicao.left), Math.max(0, innerWidth - w));
        const top = Math.min(Math.max(0, posicao.top), Math.max(0, innerHeight - 44));
        if (p.style.left !== `${left}px` || p.style.top !== `${top}px`) {
          Object.assign(p.style, { left: `${left}px`, right: 'auto', top: `${top}px`, maxHeight: `calc(100vh - ${top + 12}px)` });
        }
        return;
      }
      const pad = op.posicaoPadrao?.() || {};
      const top = pad.top ?? 12, right = pad.right ?? 12;
      if (p.style.top !== `${top}px` || p.style.right !== `${right}px` || p.style.left) {
        Object.assign(p.style, { left: '', right: `${right}px`, top: `${top}px`, maxHeight: `calc(100vh - ${top + 12}px)` });
      }
    }

    function prepararArraste(cab) {
      cab.addEventListener('pointerdown', (e) => {
        if (e.button !== 0 || e.composedPath().some((n) => n.tagName === 'BUTTON')) return;
        const r = painel.getBoundingClientRect();
        const x0 = e.clientX, y0 = e.clientY;
        let moveu = false;
        const mover = (ev) => {
          if (!moveu && Math.hypot(ev.clientX - x0, ev.clientY - y0) < 4) return;
          moveu = true;
          painel.classList.add('arrastando');
          fecharDica();
          posicao = { ...posicao, left: Math.round(r.left + ev.clientX - x0), top: Math.round(r.top + ev.clientY - y0) };
          posicionar();
        };
        const soltar = () => {
          removeEventListener('pointermove', mover);
          removeEventListener('pointerup', soltar);
          painel.classList.remove('arrastando');
          if (!moveu) return;
          gravar(chave('posicao'), posicao);
          arrastou = true;
          setTimeout(() => { arrastou = false; }, 0);
        };
        addEventListener('pointermove', mover);
        addEventListener('pointerup', soltar);
      });
      cab.addEventListener('dblclick', (e) => {
        if (e.composedPath().some((n) => n.tagName === 'BUTTON')) return;
        posicao = null;
        gravar(chave('posicao'), null);
        painel.style.width = painel.style.height = painel.style.left = '';
        posicionar();
        status('Painel de volta ao canto.');
      });
    }

    function minimizar(v = !painel.classList.contains('min')) {
      painel.classList.toggle('min', v);
      k.el.bMin.replaceChildren(icone(v ? 'plus' : 'minus'));
      dica(k.el.bMin, v ? 'Expandir' : 'Minimizar');
      if (v) { painel.style.width = ''; painel.style.height = ''; } else posicionar();
      gravar(chave('min'), v);
      fecharDica();
    }

    // montar({ nome, filhos, extras (botões do cabeçalho), aposAuto (botões logo depois do download automático), largura, autobaixar, minimizado, css })
    function montar({ nome, filhos, extras = [], aposAuto = [], largura = 340, autobaixar = false, minimizado, css = '' }) {
      carregarFonte();
      k.el.ponto = criar('span', { className: 'ponto-estado' });
      k.el.nome = criar('span', { className: 'nome', textContent: nome });
      k.el.bMin = botao('minus', '', () => minimizar(), { classe: 'leve', dica: 'Minimizar' });
      const bSom = alternaIcone({ ico: 'bell', icoDesligado: 'bell-slash', rotulo: 'Som ao concluir', ligado: k.som,
        aoMudar: (v) => { k.som = v; gravar(chave('som'), v); if (v) tocar(true); } });
      const bAuto = autobaixar ? alternaIcone({ ico: 'arrow-down-tray', rotulo: 'Download automático', ligado: k.autobaixar,
        aoMudar: (v) => { k.autobaixar = v; gravar(chave('autobaixar'), v); } }) : null;
      const cab = criar('header', {}, [k.el.ponto, k.el.nome, ...extras, bSom, bAuto, ...aposAuto, k.el.bMin]);
      dica(k.el.nome, 'Clique para minimizar · arraste para mover · duplo clique volta ao canto');
      painel = criar('div', { id: 'painel', style: `--largura:${Math.round(largura * ESCALA)}px` }, [cab, ...filhos]);
      k.el.painel = painel;
      k.el.nome.onclick = () => { if (!arrastou) minimizar(); };
      prepararArraste(cab);

      // O tamanho só muda pela alça de redimensionar, que grava largura e altura no estilo.
      addEventListener('pointerup', () => {
        if (!painel || painel.classList.contains('min')) return;
        const { width, height } = painel.style;
        if (width && (width !== posicao?.width || height !== posicao?.height)) {
          posicao = { ...posicao, width, height, escala: ESCALA };
          gravar(chave('posicao'), posicao);
        }
      });
      painel.addEventListener('click', liberarAudio);
      painel.addEventListener('scroll', fecharDica);
      // As teclas digitadas no painel não chegam aos atalhos do site.
      for (const tipo of ['keydown', 'keyup', 'keypress']) painel.addEventListener(tipo, (e) => {
        if (tipo === 'keydown' && e.key === 'Escape') fecharDica();
        e.stopPropagation();
      });
      // Dicas: abre com atraso curto sobre botões e na hora sobre o ⓘ.
      painel.addEventListener('pointerover', (e) => {
        const n = comDica(e);
        if (!n || dicaFixa || n === dicaAncora) return;
        clearTimeout(timerDica);
        timerDica = setTimeout(() => abrirDica(n), n.classList.contains('ajuda') ? 0 : 350);
      });
      painel.addEventListener('pointerout', (e) => {
        const n = comDica(e);
        if (!n || dicaFixa || (e.relatedTarget && n.contains(e.relatedTarget))) return;
        clearTimeout(timerDica);
        timerDica = setTimeout(fecharDica, 80);
      });
      painel.addEventListener('focusin', (e) => { const n = comDica(e); if (n && n.matches(':focus-visible')) abrirDica(n); });
      painel.addEventListener('focusout', () => { if (!dicaFixa) fecharDica(); });
      // Captura: tocar no ⓘ dentro de um botão não aciona o botão.
      painel.addEventListener('click', (e) => {
        const i = e.composedPath().find((n) => n.classList?.contains('ajuda'));
        if (!i) return;
        e.stopPropagation(); e.preventDefault();
        if (dicaAncora === i && dicaFixa) fecharDica(); else abrirDica(i, true);
      }, true);
      addEventListener('keydown', (e) => { if (e.key === 'Escape') fecharDica(); });
      addEventListener('scroll', () => { if (!dicaFixa) fecharDica(); }, true);
      addEventListener('click', (e) => { if (dicaAncora && !e.composedPath().includes(dicaAncora)) fecharDica(); });

      k.el.dica = criar('div', { className: 'dica', hidden: true, role: 'tooltip' });
      hospedeiro = criar('div', { id: `${op.id || P}-hospedeiro` });
      const raiz = hospedeiro.attachShadow({ mode: 'open' });
      raiz.append(criar('style', { textContent: CSS + css }), painel, k.el.dica);
      if (minimizado ?? ler(chave('min'), false)) minimizar(true);
      atualizarAcoes();
      garantir();
      return painel;
    }

    // O React e outros sites podem refazer o <body>: o painel fica preso ao <html> e volta se sumir.
    function garantir() {
      if (!hospedeiro || !document.documentElement) return;
      if (!hospedeiro.isConnected) document.documentElement.appendChild(hospedeiro);
      posicionar();
    }

    Object.assign(k, {
      criar, icone, dica, ajuda, botao, botaoPerigo, botaoParar, etiqueta, alternaIcone, botaoBaixarCada, pills, secao, naoAlterna,
      linha, esp, rotulo, selo, status, resumo, barra, progresso, estado, atualizarAcoes, executar, tocar, piscar,
      confirmarBotao, copiar, celula, csv, baixarArquivo, pastaDoArquivo, menuAlvos, montar, garantir, minimizar,
      nome: (t) => { if (k.el.nome && k.el.nome.textContent !== t) k.el.nome.textContent = t; },
      hospedeiro: () => hospedeiro,
    });
    return k;
  }
  // <<< kit_painel

  // Preferências das versões anteriores passam para as chaves do kit (uma vez).
  for (const [velha, nova] of [['pref:posicao', 'posicao'], ['pref:som', 'som'], ['pref:autobaixar', 'autobaixar'], ['pref:abertos', 'abertos'], [CHAVE_SO_FALTAM, 'soFaltam']]) {
    const v = GM_getValue(velha, null);
    if (v != null) { if (GM_getValue(`tcc-avaliacoes:kit:${nova}`, null) == null) GM_setValue(`tcc-avaliacoes:kit:${nova}`, v); GM_deleteValue(velha); }
  }

  // Sem posição salva, o painel fica no canto direito, abaixo do de horários de pico.
  function posicaoPadrao() {
    const picos = document.getElementById('tcc-picos-hospedeiro')?.shadowRoot?.getElementById('painel');
    const r = picos?.getBoundingClientRect();
    return { top: r && r.height ? Math.round(r.bottom + 8) : 12 };
  }

  const kit = kitPainel({ id: 'tcc-avaliacoes', prefixo: 'tcc-avaliacoes', abertos: ['filtros'], pastaDownload: PASTA_DOWNLOAD, posicaoPadrao });
  const { criar, icone, ajuda, etiqueta, secao, naoAlterna } = kit;
  const el = {};
  let ultimoLugar = '';

  const status = (t, tipo = '') => kit.status(t, tipo);

  function statusRico(nos, tipo = '') {
    const s = kit.el.status;
    if (!s) return;
    s.className = `status rico${tipo ? ` st-${tipo}` : ''}`;
    s.replaceChildren(...nos);
    if (tipo) kit.estado(tipo);
  }

  function atualizarBotoes() {
    kit.atualizarAcoes(ocupado);
    if (!ocupado) progresso('coleta', null);
  }

  // Barras de progresso (coleta e fila). `frac` nulo esconde a barra.
  const progresso = (tipo, frac, texto = '') => kit.progresso(tipo, frac, texto);

  async function executar(fn, { avisar = false } = {}) {
    if (ocupado) return;
    ocupado = true; parar = false; atualizarBotoes();
    let ok = true;
    try { await fn(); } catch (e) { ok = false; status(`Erro: ${e.message}`, 'erro'); }
    ocupado = false; atualizarBotoes();
    kit.estado(!ok ? 'erro' : parar ? 'alerta' : 'ok');
    if (avisar) tocar(ok && !parar);
  }

  // ---------- controles ----------

  const botaoIcone = (nome, rotulo, fn, classe = '') => kit.botao(nome, '', fn, { classe, dica: rotulo });
  const botaoTexto = (nome, texto, fn, classe = '', dica = '') => kit.botao(nome, texto, fn, { classe, dica });

  // Só o que o kit não traz: placar da conferência, lista dos comentários e legenda dos destaques.
  const CSS = `
    .periodo{flex-wrap:nowrap}
    select option.incerta{color:#9ca3af}
    .selo.ativos{background:var(--azul);color:#fff}
    .selo.nova{background:var(--caneta-100);color:var(--caneta)}
    .busca input::-webkit-search-cancel-button{display:none}
    .busca .ico{width:28px;height:28px;background:transparent;color:var(--suave)}
    details>:not(summary){margin-left:2px}
    .placar{margin:8px 0}
    .placar .trilho{margin:4px 0}
    .placar .seg-ok{background:var(--ok);transition:width .25s}
    .placar .seg-erro{background:var(--erro);transition:width .25s}
    .placar .nums{display:flex;gap:10px;font-size:12.5px;font-weight:600;align-items:center}
    .placar .fid{font-size:12.5px}
    .dica .legenda{display:flex;flex-wrap:wrap;gap:4px;margin-top:6px}
    .dica .legenda span{padding:0 6px;border-radius:4px;color:#111}
    .info{white-space:normal}
    .info .cab{display:flex;gap:6px;align-items:center;justify-content:space-between}
    .info .linha{margin:6px 0 0}
    .lado{margin-top:8px}
    .lado .trecho,.item .trecho{color:var(--suave);font-size:12.5px}
    .chip.sim{background:var(--ok-100);color:var(--ok)}
    .chip.nao{background:var(--erro-100);color:var(--erro)}
    .lista{max-height:320px}
    .item{display:flex;flex-direction:column;align-items:stretch;text-align:left;background:transparent;padding:6px 8px;gap:2px;flex:none}
    .item:hover:not(:disabled){background:var(--sup)}
    .item.atual{background:var(--caneta-100)}
    .item .meta{display:flex;gap:8px;align-items:center;font-size:12px;font-weight:600}
    .item .trecho{display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;font-weight:400}
    .item .temas{font-size:11.5px;color:var(--caneta)}
    .op-positiva{color:var(--ok)}
    .op-negativa{color:var(--erro)}`;

  const OPCOES_PERIODO = [[0, 'agora'], [7, '1 semana'], [14, '2 semanas'], [21, '3 semanas'], [28, '4 semanas'],
    [30, '1 mês'], ...[2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((n) => [30 * n, `${n} meses`]),
    [365, '1 ano'], ...[2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => [365 * n, `${n} anos`])];

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
    carregarFiltros(GM_getValue(CHAVE_FILTROS, null));
    const reaplicar = () => { salvarFiltros(); pintarAtivos(); atualizarFiltrosNaPagina(); };
    const pintarAtivos = () => { const n = filtrosAtivos(); el.nAtivos.textContent = n ? `${n} ativo${n > 1 ? 's' : ''}` : ''; };
    const alternar = (conjunto, k) => (ligada) => { if (ligada) conjunto.add(k); else conjunto.delete(k); reaplicar(); };

    el.status = kit.el.status = criar('div', { className: 'status', textContent: 'Abra um lugar e clique em "Coletar avaliações".' });
    el.jaOrdenado = etiqueta('Já ordenei por "Mais recentes"', () => {}, { dica: 'Marque se já ordenou a lista à mão. O script pula a etapa de ordenar.' });
    el.pararConhecidas = etiqueta('Parar em 10 já coletadas seguidas', () => {}, { dica: 'A rolagem para ao achar 10 avaliações já coletadas em sequência: retoma de onde a última coleta parou.' });
    el.placeId = criar('input', { type: 'text', placeholder: 'place_id do B1 (se faltar na URL)' });

    // ----- menu das casas do B1 (menuAlvos do kit) -----
    const estadoMenu = (p) => ({ ok: 'ok', incerta: 'parcial', falha: 'falha' }[estadoCasa(p).e] || 'falta');
    el.menu = kit.menuAlvos({
      itens: () => POP, unidade: 'casas', estadoDe: estadoMenu, atual: pidAtual,
      detalhe: (p) => { const { e, n } = estadoCasa(p); return e === 'ok' ? String(n) : e === 'incerta' ? `${n}, incerta` : e === 'falha' ? 'incompleta' : ''; },
      aoEscolher: (p) => {
        if (!p) return;
        if (casaDoLugar(infoLugar())?.id === p.id) { GM_setValue(CHAVE_ALVO, p.id); rotularCasas(); return; }
        if (ocupado) { rotularCasas(); status('Espere a coleta em curso terminar (ou "Parar").', 'alerta'); return; }
        if (estadoMenu(p) === 'ok' && !confirm(`${p.nome} já está coletada. Refazer?`)) { rotularCasas(); return; }
        abrirCasa(p);
      },
      aoProximo: () => {
        if (ocupado) { status('Espere a coleta em curso terminar (ou "Parar").', 'alerta'); return; }
        const p = proximaQueFalta(pidAtual(), GM_getValue(CHAVE_RESUMOS, []), GM_getValue(CHAVE_MARCAS, {}));
        if (!p) { status('Todas as casas do B1 estão coletadas.', 'ok'); return; }
        abrirCasa(p);
      },
      aoMarcar: (p) => {
        if (!p) return;
        const col = ['ok', 'incerta'].includes(estadoCasa(p).e);
        GM_setValue(CHAVE_MARCAS, { ...GM_getValue(CHAVE_MARCAS, {}), [p.id]: !col });
        GM_setValue(CHAVE_ALVO, p.id);
        status(col ? `${p.nome} volta a faltar.` : `${p.nome} marcada como coletada.`);
        rotularCasas();
      },
    });
    kit.dica(el.menu.select, 'Casas do B1, por capital: escolher uma abre no Maps e coleta. ✓ coletada (avaliações lidas), ◐ lista parou de crescer, ! incompleta, ○ falta');

    // ----- topo: período e ações principais -----
    const seletorDe = criar('select', { onchange: (e) => { periodo.de = +e.target.value; reaplicar(); } },
      OPCOES_PERIODO.map(([v, t]) => criar('option', { value: v, textContent: t })));
    const seletorAte = criar('select', { onchange: (e) => { periodo.ate = e.target.value === 'tudo' ? Infinity : +e.target.value; reaplicar(); } },
      [...OPCOES_PERIODO.slice(1).map(([v, t]) => criar('option', { value: v, textContent: t })), criar('option', { value: 'tudo', textContent: 'sem limite' })]);
    seletorDe.value = String(periodo.de);
    seletorAte.value = periodo.ate === Infinity ? 'tudo' : String(periodo.ate);
    if (seletorAte.value === '') { seletorAte.value = '30'; periodo.ate = 30; }

    const bColetar = botaoTexto('arrow-down-tray', 'Coletar avaliações', () => executar(async () => {
      ultimoResumo = null;
      const motivo = await coletar();
      if (prefs.autobaixar && resultado.length) baixar(resultado, 'tudo');
      // O resumo sai sempre (mesmo com zero lidas): é a prova da coleta.
      if (ultimoResumo) baixarResumoLugar(ultimoResumo);
      if (motivo === 'ordem errada' || motivo === 'lista não encontrada') throw new Error(MSG_MOTIVO[motivo]);
    }, { avisar: true }), 'primario');
    el.parar = kit.botaoParar(() => { parar = true; status('Parando…'); });
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

    el.contagem = criar('span', { className: 'selo', dica: 'Carregadas na página que passam no período e nos filtros' });
    el.nAtivos = criar('span', { className: 'selo ativos', dica: 'Filtros ligados (ficam salvos ao recarregar a página)' });
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
    const bEsquecer = kit.botaoPerigo('trash', '', () => {
      const chave = chaveLugar(infoLugar());
      if (!chave) { status('Abra um lugar para esquecer os ids dele.', 'alerta'); return; }
      GM_deleteValue(PREFIXO_LUGAR + chave); atualizarIdsConhecidos(true); reaplicar(); status(`Ids de ${infoLugar().nome_estabelecimento} esquecidos.`, 'ok');
    }, { dica: 'Esquecer os review_id já coletados deste lugar (a conferência deles deixa de achar o lugar)' });
    const bFila = botaoIcone('play', 'Iniciar a fila', iniciarFila);
    const bContinuarFila = botaoIcone('forward', 'Continuar a fila de onde parou', continuarFila);
    const bResumo = botaoIcone('document-chart-bar', 'CSV-resumo do histórico de coletas', () => baixarResumo(GM_getValue(CHAVE_RESUMOS, []), 'historico'));
    const bLimparResumo = kit.botaoPerigo('trash', '', () => {
      const rs = GM_getValue(CHAVE_RESUMOS, []);
      if (rs.length) baixarResumo(rs, 'historico');
      GM_setValue(CHAVE_RESUMOS, []); rotularCasas(); status('Histórico de resumos apagado (CSV-resumo baixado antes).', 'ok');
    }, { dica: 'Limpar o histórico de resumos (baixa antes o CSV-resumo); as casas voltam a faltar no menu, salvo as marcadas à mão' });
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
    el.confSelo = criar('span', { className: 'selo', dica: 'Marcadas / sorteadas' });
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
    el.salResumo = criar('span', { className: 'mono', dica: 'Início e fim do sal atual, para conferir se é o mesmo nos dois domínios' });
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

    // Reiniciar (lixeira): volta o coletor ao zero. Apaga o histórico de coleta (resumos, marcas
    // do menu, fila, coleta em andamento, casa escolhida e os review_id já coletados de cada
    // lugar), depois de baixar um backup JSON de tudo. Ficam o sal, os filtros, a conferência
    // de fidelidade e as preferências do painel.
    const bReiniciar = kit.botaoPerigo('trash', '', () => {
      const lugares = GM_listValues().filter((k) => k.startsWith(PREFIXO_LUGAR));
      const copia = { resumos: GM_getValue(CHAVE_RESUMOS, []), marcas: GM_getValue(CHAVE_MARCAS, {}), fila: GM_getValue(CHAVE_FILA, null),
        andamento: GM_getValue(CHAVE_ANDAMENTO, null), lugares: Object.fromEntries(lugares.map((k) => [k, GM_getValue(k, null)])) };
      const d = new Date(), z = (n) => String(n).padStart(2, '0');
      salvarArquivo(`${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}_${z(d.getHours())}${z(d.getMinutes())}_avaliacoes_backup.json`, JSON.stringify(copia, null, 1), 'application/json');
      for (const c of [CHAVE_RESUMOS, CHAVE_MARCAS, CHAVE_FILA, CHAVE_ANDAMENTO, CHAVE_ALVO, CHAVE_ABRIR, ...lugares]) GM_deleteValue(c);
      resultado = [];
      atualizarIdsConhecidos(true);
      reaplicar();
      rotularCasas();
      atualizarSeloFila();
      kit.estado('');
      status(`Reiniciado: histórico de coleta zerado (${copia.resumos.length} resumos e ${lugares.length} lugares; backup JSON baixado antes).`, 'ok');
    }, { classe: 'leve', dica: 'Reiniciar: apaga o histórico de coleta (resumos, ✓ e marcas do menu, fila, coleta em andamento e os ids já coletados de cada lugar). Baixa antes um backup JSON. Ficam o sal, os filtros, a conferência e as preferências' });

    kit.acoes = [bColetar, bLocalizar, bRecuperar, bFila, bContinuarFila, bAchar, bReiniciar, el.menu.bProx];

    const filhos = [
      el.menu.caixa,
      criar('div', { className: 'linha periodo' }, [
        criar('span', { className: 'rotulo' }, ['Período', ajuda('Idade pelo rótulo do Google (semana = 7 dias, mês = 30, ano = 365). "Até 1 mês" inclui todo o rótulo "um mês atrás" (30 a 59 dias).')]),
        seletorDe, criar('span', { className: 'suave', textContent: 'até' }), seletorAte,
      ]),
      criar('div', { className: 'tags' }, [el.jaOrdenado]),
      criar('div', { className: 'linha' }, [bColetar, el.parar, bLocalizar]),
      kit.barra('fila'),
      kit.barra('coleta'),
      el.status,
      criar('div', { className: 'linha' }, [
        criar('span', { className: 'rotulo', textContent: 'CSV' }),
        bCsv('período', 'Avaliações do período com texto', () => baixar(resultado.filter((r) => noPeriodo(r) && r.tem_texto === 'sim'), 'periodo')),
        bCsv('filtros', 'Avaliações que passam no período e nos filtros', () => baixar(resultado.filter(passaFiltros), 'filtros')),
        bCsv('tudo', 'Todas as avaliações lidas', () => baixar(resultado, 'tudo')),
        criar('span', { className: 'esp' }), bReiniciar,
      ]),
      criar('div', { className: 'linha' }, [el.placeId, ajuda('Use o place_id do B1 quando a URL não traz o identificador. Ele entra no CSV.')]),
      filtrosUI,
      retomadaUI,
      conferenciaUI,
      salUI,
      el.listaUI,
    ];
    kit.montar({ nome: 'Avaliações', filhos, largura: 360, autobaixar: true, css: CSS });
    el.painel = kit.el.painel;
    atualizarBotoes();
    mostrarConferencia();
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
    if (!kit.hospedeiro()) montarPainel();
    kit.garantir();
    // Ao trocar de lugar, "Já ordenei" e o place_id colado deixam de valer.
    const nome = infoLugar().nome_estabelecimento;
    if (nome && nome !== ultimoLugar) {
      if (ultimoLugar && !ocupado) { el.jaOrdenado.checked = false; el.placeId.value = ''; }
      ultimoLugar = nome;
      const casa = casaDoLugar(infoLugar());
      if (casa && casa.id !== pidAtual()) GM_setValue(CHAVE_ALVO, casa.id);
      rotularCasas();
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
  rotularCasas();
  if (GM_getValue(CHAVE_FILA, null)?.ativa) rodarFilaNestaPagina();
  else coletarAoAbrir();
})();
