// ==UserScript==
// @name         Coletor de acervos de jogos (TCC Luderia)
// @namespace    tcc-luderia
// @version      2026.11.12-3
// @description  Procura as 63 casas do B1 na Ludopedia, no Acervo de Jogos e na rejoy, lê cada acervo achado e exporta o TXT da Ludopedia, um CSV por acervo e o CSV da varredura, com a situação da coleta.
// @match        https://ludopedia.com.br/*
// @match        https://*.acervodejogos.com.br/*
// @match        https://*.rejoy.com.br/*
// @run-at       document-idle
// @noframes
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// @grant        GM_xmlhttpRequest
// @connect      acervodejogos.com.br
// @connect      rejoy.com.br
// @connect      ludopedia.com.br
// ==/UserScript==

/*
 * Uso pessoal, para o acervo de jogos do Bloco B1 (B1-c_jogos_dos_acervos.py).
 *
 * Por que existe: a Ludopedia fica atrás do Cloudflare e não abre para o Python; os
 * títulos entravam colados à mão em ludopedia_<x>.txt. Este script lê a página no
 * navegador e baixa esse mesmo arquivo. Acervo de Jogos e rejoy já são baixados pelo
 * Python (cache em dados/B1_acervo_jogos/_dados-brutos/acervos_luderias/<loja>/); aqui servem de reserva e de
 * conferência, com a mesma leitura do Python.
 *
 * Como lê cada fonte:
 *  - Ludopedia, coleção (/colecao?usuario=…): clica em "Carregar mais jogos (N)" até o
 *    botão sumir e lê os cards (a.ludo-col-card__nome), na ordem da página;
 *  - Ludopedia, lista (/lista/<id>/…): lê as páginas ?pagina=1..N (título do h3 sem o
 *    número de ordem; "Valor de Locação" do item, quando há);
 *  - Acervo de Jogos (<loja>.acervodejogos.com.br): /boardgames?sort=mais_alugados&page=N,
 *    o card de cada título e o preço "R$ X / N dias" (sem período no card, vale o
 *    publicado pela casa: São Jogue, 4 dias);
 *  - rejoy (<loja>.rejoy.com.br): /search?page=N, pelo __NUXT_DATA__ da página.
 *
 * Saídas (";" e UTF-8 com BOM):
 *  - ludopedia_<chave>.txt (só Ludopedia): primeira linha a URL, depois um título por
 *    linha, como o Python lê; vai para dados/B1_acervo_jogos/_dados-brutos/acervos_luderias/;
 *  - AAAA-MM-DD_<chave>_acervo.csv (sempre, mesmo sem título): colunas do
 *    B1_jogos_dos_acervos.csv mais `situacao` (_src/dicionario.md §4.5): ok, vazia
 *    (acervo lido sem título; uma linha com jogo vazio) ou refazer (leitura parou antes do fim).
 *
 * Varredura ("Procurar"): cada uma das 63 casas do B1 (CASAS) é procurada nas três
 * plataformas, não só as de acervo já conhecido (ACERVOS):
 *  - Acervo de Jogos: lista de lojas (/companies), mesma UF;
 *  - rejoy: lojas de cada cidade das UFs do B1 (/locadoras?cidade=…&uf=…);
 *  - Ludopedia: busca de usuário (/search_user) e de lista (/listas, títulos com acervo,
 *    aluguel ou locação) pelo nome da casa e pelo @ do Instagram;
 *  - sondagem direta de <@ ou site>.acervodejogos.com.br e .rejoy.com.br (404 = não existe).
 * Achado com semelhança ≥ 0,75 vira alvo; de 0,5 a 0,75 fica no CSV para conferir.
 * Saída: AAAA-MM-DD_acervos_varredura.csv, uma linha por casa e acervo achado (contagem
 * não exclusiva: casa com dois acervos tem duas linhas), com situacao coletar, vazia
 * (nenhum acervo nas três) ou refazer (pedido falhou).
 *
 * Menu dos acervos (padrão dos coletores): por capital, cada acervo de cada casa, com ✓ ok,
 * ! refazer e ○ falta; casa sem acervo aparece uma vez (✓ depois de procurada). Escolher abre
 * a página e coleta sozinho; "Próximo" segue para o que falta; "Coletar todos" encadeia.
 * Lojas online de venda (B1-c_lojas_venda.py) ficam no Python: cada plataforma
 * (Liga, Tray, Nuvemshop…) pede um leitor próprio e a da Liga esconde o preço em imagens.
 */

(function () {
  'use strict';

  const PAUSA_PAGINA = [700, 1400]; // ms entre páginas lidas por fetch
  const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
  const sortear = ([a, b]) => a + Math.random() * (b - a);
  const hoje = () => new Date().toLocaleDateString('sv-SE');

  // ---------- alvos (FONTES de B1-c_jogos_dos_acervos.py) ----------
  // [chave, casa, fonte, url]
  const ACERVOS = [
    ['arenabg', 'Arena BG', 'ludopedia', 'https://ludopedia.com.br/colecao?usuario=aarenabg&lista=colecao'],
    ['castelos', 'Castelos Bar & Boardgames', 'ludopedia', 'https://ludopedia.com.br/colecao?usuario=Castelos%20Bar&lista=colecao'],
    ['chefonplay', 'Chef on Play', 'ludopedia', 'https://ludopedia.com.br/colecao?usuario=chefnavan&lista=colecao'],
    ['jogasampa', 'Jogasampa', 'ludopedia', 'https://ludopedia.com.br/lista/20376/acervo-jogasampa'],
    ['alcapaojogos', 'Alçapão Jogos De Tabuleiro', 'acervodejogos'],
    ['balboas', "Balboa's Hobby Games", 'acervodejogos'],
    ['bardomago', 'Bardo Mago', 'acervodejogos'],
    ['bodogami', 'Bodogami', 'acervodejogos'],
    ['comdado', 'Comdado Bar', 'acervodejogos'],
    ['dungeon', 'Dungeon Games Store', 'acervodejogos'],
    ['joyjoycafe', 'Joyjoy Café', 'acervodejogos'],
    ['latabuleria', 'La Tabuleria', 'acervodejogos'],
    ['ludocafe', 'LudoCafé', 'acervodejogos'],
    ['luderiacarioca', 'Luderia Carioca', 'acervodejogos'],
    ['ludoteca', 'Ludoteca BGC', 'acervodejogos'],
    ['metropoly', 'Metropoly Bar', 'acervodejogos'],
    ['paladinsgames', 'Paladins Game Store', 'acervodejogos'],
    ['pittas', "Pitta's Board Games", 'acervodejogos'],
    ['placegames', 'Place Games Jogos de Tabuleiro', 'acervodejogos'],
    ['saojogue', 'São Jogue - Bela Vista', 'acervodejogos'],
    ['shelf', 'Shelf bar', 'acervodejogos'],
    ['tabuclub', 'TabuClub', 'acervodejogos'],
    ['tocadorato', 'Toca do Rato - Pizzaria e Jogos de Tabuleiro', 'acervodejogos'],
    ['tubaleria', 'Tubaleria', 'acervodejogos'],
    ['nala', 'Nala Land - Bar de Jogos de Tabuleiro em Recife', 'rejoy'],
    ['sidequest', 'Ludoteca SideQuest', 'rejoy'],
  ].map(([chave, nome, fonte, url]) => ({
    id: chave, chave, nome, fonte,
    url: url || (fonte === 'rejoy' ? `https://${chave}.rejoy.com.br/search` : `https://${chave}.acervodejogos.com.br/boardgames?sort=mais_alugados`),
  }));
  const PLATAFORMA = { ludopedia: 'Ludopedia', acervodejogos: 'Acervo de Jogos', rejoy: 'rejoy' };
  // Período do aluguel básico publicado pela casa, para os cards sem "/ N dias" (PERIODO_DA_CASA do Python).
  const PERIODO_DA_CASA = { saojogue: 4 };

  // ---------- leitura de cada fonte ----------
  const ENTIDADES = { amp: '&', quot: '"', apos: "'", lt: '<', gt: '>', nbsp: ' ' };
  const limpa = (t) => String(t || '')
    .replace(/&(#x[\da-f]+|#\d+|\w+);/gi, (m, e) => (e[0] === '#' ? String.fromCodePoint(e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : +e.slice(1)) : ENTIDADES[e.toLowerCase()] ?? m))
    .replace(/\s+/g, ' ').trim();
  const numero = (t) => (t ? +String(t).replace(/\./g, '').replace(',', '.') : '');

  // Página do Acervo de Jogos: [{ jogo, aluguel_rs, aluguel_dias }] e se há página seguinte.
  function lerAcervoDeJogos(texto, sub, pagina) {
    const jogos = [];
    for (const bloco of texto.split('line-clamp-2').slice(1)) {
      const nome = bloco.match(/^[^"]*" href="\/boardgames\/[^"]+">([^<]+)<\/a>/);
      if (!nome) continue;
      const preco = bloco.match(/R\$\s*([\d.,]+)(?:\s*<span[^>]*>\s*\/\s*(\d+)\s*dias?\s*<\/span>)?/);
      const dias = preco && preco[2] ? +preco[2] : PERIODO_DA_CASA[sub] ?? '';
      jogos.push({ jogo: limpa(nome[1]), aluguel_rs: preco ? numero(preco[1]) : '', aluguel_dias: preco ? dias : '' });
    }
    return { jogos, mais: texto.includes(`page=${pagina + 1}&amp;sort=mais_alugados`) };
  }

  // __NUXT_DATA__ (devalue): lista de valores com referências por índice.
  function nuxt(texto) {
    const m = texto.match(/id="__NUXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
    if (!m) throw new Error('página sem __NUXT_DATA__');
    const d = JSON.parse(m[1]);
    const r = (i) => {
      const v = d[i];
      if (Array.isArray(v) && v.length && typeof v[0] === 'string') return ['ShallowReactive', 'Reactive', 'Ref', 'ShallowRef'].includes(v[0]) ? r(v[1]) : null;
      if (Array.isArray(v)) return v.map(r);
      if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([c, x]) => [c, r(x)]));
      return v;
    };
    return r(0).data;
  }

  function lerRejoy(texto) {
    const dados = nuxt(texto);
    const bloco = Object.entries(dados).find(([c]) => c.startsWith('boardgames'))?.[1];
    if (!bloco) throw new Error('página da rejoy sem a lista de jogos');
    const jogos = bloco.data.map((j) => {
      const p = (j.price_category?.prices || [{}])[0] || {};
      return { jogo: limpa(j.name), aluguel_rs: p.price ? +p.price : '', aluguel_dias: p.days ?? '' };
    });
    return { jogos, ultima: bloco.meta.last_page };
  }

  // Título do item de uma lista da Ludopedia: "12 - Nome do Jogo" (o h3 traz também as curtidas).
  const tituloDaLista = (t) => limpa(t).replace(/^\d+\s*-\s*/, '').replace(/\s+\d+$/, '');

  // ---------- página aberta ----------
  // Acervo da página aberta: entre os alvos do menu (conhecidos e achados na varredura) ou,
  // fora deles, montado do endereço. Página que não é de acervo devolve null.
  function alvoDaPagina(loc = location, lista = null) {
    const h = loc.hostname;
    const sub = h.split('.')[0];
    const todos = () => lista || alvos();
    for (const fonte of ['acervodejogos', 'rejoy']) {
      if (!h.endsWith(`.${fonte}.com.br`) || sub === 'www') continue;
      return todos().find((a) => a.fonte === fonte && a.chave === sub) || { id: `${fonte}:${sub}`, chave: sub, nome: sub, fonte, url: URL_FONTE[fonte](sub) };
    }
    if (h !== 'ludopedia.com.br' || !/^\/(colecao|lista\/)/.test(loc.pathname)) return null;
    const lista_ = loc.pathname.match(/^\/lista\/(\d+)/);
    const usuario = new URLSearchParams(loc.search).get('usuario');
    if (!lista_ && !usuario) return null;
    const casa = todos().find((a) => {
      if (a.fonte !== 'ludopedia') return false;
      const u = new URL(a.url);
      return lista_ ? u.pathname.startsWith(`/lista/${lista_[1]}`) : (u.searchParams.get('usuario') || '').toLowerCase() === usuario.toLowerCase();
    });
    if (casa) return casa;
    const chave = lista_ ? `lista${lista_[1]}` : slug(usuario);
    return { id: `ludopedia:${chave}`, chave, nome: usuario || `lista ${lista_[1]}`, fonte: 'ludopedia', url: loc.href };
  }

  async function baixarTexto(url) {
    const r = await fetch(url, { credentials: 'include' });
    if (!r.ok) throw new Error(`HTTP ${r.status} em ${url}`);
    return r.text();
  }

  // Cada leitor devolve { jogos, completa } e avisa o progresso.
  async function lerColecaoLudopedia() {
    const botaoMais = () => [...document.querySelectorAll('button, a')].find((b) => /carregar mais jogos/i.test(b.textContent));
    const cards = () => document.querySelectorAll('a.ludo-col-card__nome');
    let semMudar = 0, n = 0;
    while (!kit.parar) {
      const b = botaoMais();
      const resta = b ? +(b.textContent.match(/\((\d+)\)/)?.[1] || 0) : 0;
      const atual = cards().length;
      kit.progresso('coleta', b ? atual / (atual + resta || 1) : 1, `${atual} títulos${resta ? `, faltam ${resta}` : ''}`);
      if (!b) break;
      semMudar = atual === n ? semMudar + 1 : 0;
      if (semMudar >= 6) return { jogos: lerCards(), completa: false };
      n = atual;
      b.scrollIntoView({ block: 'center' });
      b.click();
      await esperar(sortear([1200, 2000]));
    }
    return { jogos: lerCards(), completa: !kit.parar };
    function lerCards() {
      return [...cards()].map((a) => ({ jogo: limpa(a.textContent || a.title), aluguel_rs: '', aluguel_dias: '' })).filter((j) => j.jogo);
    }
  }

  async function lerListaLudopedia() {
    const base = location.href.split('?')[0];
    const ultima = Math.max(1, ...[...document.querySelectorAll('a[href*="pagina="]')].map((a) => +(a.href.match(/pagina=(\d+)/)?.[1] || 1)));
    const jogos = [];
    for (let p = 1; p <= ultima; p++) {
      if (kit.parar) return { jogos, completa: false };
      kit.progresso('coleta', (p - 1) / ultima, `página ${p} de ${ultima} · ${jogos.length} títulos`);
      const doc = p === 1 && !location.search.includes('pagina=') ? document
        : new DOMParser().parseFromString(await baixarTexto(`${base}?pagina=${p}`), 'text/html');
      for (const t of doc.querySelectorAll('.bloco-sm-title')) {
        const h3 = t.querySelector('h3');
        if (!h3) continue;
        const titulo = tituloDaLista([...h3.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join(' '));
        const det = doc.getElementById(t.dataset.bloco)?.textContent || '';
        const valor = det.match(/Valor de Loca[cç][aã]o:\s*R\$\s*([\d.,]+)/i);
        if (titulo) jogos.push({ jogo: titulo, aluguel_rs: valor ? numero(valor[1]) : '', aluguel_dias: '' });
      }
      if (p < ultima) await esperar(sortear(PAUSA_PAGINA));
    }
    return { jogos, completa: true };
  }

  async function lerPaginado(alvo) {
    const jogos = [];
    for (let p = 1; ; p++) {
      if (kit.parar) return { jogos, completa: false };
      if (alvo.fonte === 'acervodejogos') {
        kit.progresso('coleta', true, `página ${p} · ${jogos.length} títulos`);
        const r = lerAcervoDeJogos(await baixarTexto(`${location.origin}/boardgames?sort=mais_alugados&page=${p}`), alvo.chave, p);
        jogos.push(...r.jogos);
        if (!r.mais) return { jogos, completa: true };
      } else {
        const r = lerRejoy(await baixarTexto(`${location.origin}/search?page=${p}`));
        jogos.push(...r.jogos);
        kit.progresso('coleta', p / (r.ultima || 1), `página ${p} de ${r.ultima} · ${jogos.length} títulos`);
        if (p >= r.ultima) return { jogos, completa: true };
      }
      await esperar(sortear(PAUSA_PAGINA));
    }
  }

  // ---------- coleta, registro e exportação ----------
  const CHAVE_FEITOS = 'acv:feitos'; // { chave: { n, situacao, em } }
  const CHAVE_MARCAS = 'acv:marcas';
  const CHAVE_ABRIR = 'acv:abrir';
  const CHAVE_ULTIMO = 'acv:ultimo'; // último item escolhido no menu (página que não é acervo)
  const COLS = ['estabelecimento', 'fonte', 'url_fonte', 'posicao', 'jogo', 'aluguel_rs', 'aluguel_dias', 'situacao', 'data_coleta'];
  let resultado = null; // { alvo, jogos, situacao, url }

  // Um título só conta uma vez por casa (como no Python): fica a primeira cópia.
  function semRepetir(jogos) {
    const vistos = new Set();
    return jogos.filter((j) => { const c = j.jogo.toLowerCase(); if (vistos.has(c)) return false; vistos.add(c); return true; });
  }

  function situacaoDe(completa, n) {
    if (!completa) return 'refazer: leitura parou antes do fim';
    return n ? 'ok' : 'vazia';
  }

  async function coletar() {
    const alvo = alvoDaPagina();
    if (!alvo) throw new Error('abra a página de um acervo');
    status(`${alvo.nome}: lendo o acervo…`);
    let r;
    try {
      r = alvo.fonte === 'ludopedia' ? (location.pathname.startsWith('/lista/') ? await lerListaLudopedia() : await lerColecaoLudopedia()) : await lerPaginado(alvo);
    } finally { kit.progresso('coleta', null); }
    const jogos = semRepetir(r.jogos);
    const situacao = situacaoDe(r.completa, jogos.length);
    resultado = { alvo, jogos, situacao, url: alvo.fonte === 'ludopedia' ? alvo.url : `${location.origin}${alvo.fonte === 'rejoy' ? '/search' : '/boardgames?sort=mais_alugados'}` };
    kit.gravar(CHAVE_FEITOS, { ...kit.ler(CHAVE_FEITOS, {}), [alvo.chave]: { n: jogos.length, situacao, em: Date.now() } });
    mostrarResultado();
    // O CSV sai sempre (marcador da coleta); o TXT da Ludopedia, se houver título.
    baixarCsv();
    if (alvo.fonte === 'ludopedia' && jogos.length) baixarTxt();
    menu.rotular();
  }

  function linhasCsv() {
    const { alvo, jogos, situacao, url } = resultado;
    const base = { estabelecimento: alvo.nome, fonte: alvo.fonte, url_fonte: url, situacao, data_coleta: hoje() };
    // Preço com vírgula decimal, como os demais CSV do projeto.
    const rs = (v) => (v === '' ? '' : String(v).replace('.', ','));
    return jogos.length ? jogos.map((j, i) => ({ ...base, posicao: i + 1, ...j, aluguel_rs: rs(j.aluguel_rs) })) : [{ ...base, posicao: '', jogo: '' }];
  }

  function baixarCsv() {
    if (!resultado) return;
    kit.baixarArquivo(`${hoje()}_${resultado.alvo.chave}_acervo.csv`, kit.csv(linhasCsv(), COLS));
    kit.piscar(el.bCsv);
  }

  function baixarTxt() {
    if (!resultado?.jogos.length) return;
    kit.baixarArquivo(`ludopedia_${resultado.alvo.chave}.txt`, [resultado.url, ...resultado.jogos.map((j) => j.jogo)].join('\n') + '\n', 'text/plain;charset=utf-8');
    kit.piscar(el.bTxt);
  }

  // ---------- população do B1 e varredura das plataformas ----------
  // As 63 casas do B1: as 61 com Instagram próprio (POP_IG do instagram_coletor.user.js), o
  // Reduto (sem perfil) e o Covil Game Bar SBC (usa o @covilgb, de Guarulhos). [instagram, nome, capital, UF, domínio do site]. A varredura procura cada uma nas
  // três plataformas, sem depender da lista ACERVOS (que guarda só os acervos já conhecidos).
  const CASAS = [
    ["bardo.mago", "Bardo Mago", "Belo Horizonte", "MG", ""],
    ["comdadobar", "Comdado Bar e Jogos", "Belo Horizonte", "MG", "comdado.bar"],
    ["garagemdonerd", "Garagem do Nerd", "Belo Horizonte", "MG", "garagemdonerd.com.br"],
    ["latabuleria", "La Tabuleria", "Belo Horizonte", "MG", ""],
    ["ludocafebh", "LudoCafé", "Belo Horizonte", "MG", "ludocafe.com.br"],
    ["shelfbar", "Shelf Bar e Jogos", "Belo Horizonte", "MG", "shelfbar.com.br"],
    ["ludotecasidequest", "Ludoteca Sidequest", "Belém", "PA", "ludotecasidequest.com.br"],
    ["fortaludica", "FORTALÚDICA - BURGERS & JOGOS", "Brasília", "DF", "fortaludica.com.br"],
    ["grutabsb", "Gruta BSB", "Brasília", "DF", "grutabsb.com.br"],
    ["insidegamestore", "Inside Games", "Brasília", "DF", "insidegamestore.com.br"],
    ["asgardbrasilia", "Loja de Jogos - Asgard", "Brasília", "DF", "asgardstore.com.br"],
    ["ludotecabgc", "Ludoteca BGC", "Brasília", "DF", "ludoteca.com.br"],
    ["utopiagamesbr", "Utopia Games & Food", "Brasília", "DF", "utopiagames.com.br"],
    ["metropolybar", "Metropoly Bar", "Campinas", "SP", "metropolybar.com.br"],
    ["muito_colecionaveis", "Muito Geek | TCG • Board Games • Fliperama", "Campinas", "SP", "muitocolecionaveis.com.br"],
    ["nergeek", "Nergeek", "Campinas", "SP", "nergeek.com.br"],
    ["alcapaojogos", "Alçapão Jogos", "Curitiba", "PR", "alcapaojogos.com.br"],
    ["boardzgamepub", "BoardZ Game Pub", "Curitiba", "PR", "boardzgamepub.com.br"],
    ["joyjoycafe", "Joyjoy Café", "Curitiba", "PR", "joyjoycafe.com.br"],
    ["paladinohobbies", "Paladino Hobbies", "Curitiba", "PR", "paladinohobbies.com.br"],
    ["tavernagamehouse", "Taverna Game House", "Curitiba", "PR", "tavernagamehouse.com.br"],
    ["vilacelta", "Vila Celta Hobby Store - Jogos e Café", "Curitiba", "PR", "reidascartinhas.com.br"],
    ["ccg_floripa", "CCG Floripa", "Florianópolis", "SC", "grupoccg.com.br"],
    ["chefonplay", "Chef on Play", "Florianópolis", "SC", ""],
    ["cineplay_sc", "Cineplay- Restaurante e Jogos", "Florianópolis", "SC", ""],
    ["balboashobbygames", "Balboa's Hobby Games", "Fortaleza", "CE", "balboas.com.br"],
    ["dominariacg", "Dominaria Cards & Games", "Fortaleza", "CE", "dominariacg.com.br"],
    ["paladinsgames", "Paladins Game Store", "Goiânia", "GO", "paladinsgames.com.br"],
    ["arcadeapub", "Arcadea Gaming Pub", "Porto Alegre", "RS", "arcadeapub.com.br"],
    ["tocadorato_oficial", "Toca do Rato - Pizzaria e Jogos de Tabuleiro", "Porto Alegre", "RS", ""],
    ["nalaland.jogos", "Nala Land - Bar de Jogos de Tabuleiro em Recife", "Recife", "PE", ""],
    ["gob.ludobar", "Game Of Boards", "Rio de Janeiro", "RJ", "gameofboards.com.br"],
    ["luderiacariocajogos", "Luderia Carioca", "Rio de Janeiro", "RJ", "luderiacarioca.com"],
    ["magicstorebrasil", "Magic Store Brazil", "Rio de Janeiro", "RJ", "magicstorebrasil.com.br"],
    ["lojaredjogos", "RED jogos", "Rio de Janeiro", "RJ", "redjogos.com.br"],
    ["tabuclubnit", "TabuClub", "Rio de Janeiro", "RJ", ""],
    ["saojogue", "São Jogue - Bela Vista", "Salvador", "BA", "saojogue.com.br"],
    ["sessenta.minutos", "60 Minutos Escape, Hamburgueria e Boardgames", "São Paulo", "SP", "sessentaminutos.com.br"],
    ["aarenabg", "Arena BG | Jogos de Tabuleiro | Hamburgueria", "São Paulo", "SP", "arenabg.com.br"],
    ["bodogami", "Bodogami Restaurante e Cafeteria", "São Paulo", "SP", "bodogami.com.br"],
    ["bravojogos", "Bravo Jogos", "São Paulo", "SP", "bravojogos.com.br"],
    ["chqjogos.sa", "CHQ Jogos", "São Paulo", "SP", "chqjogos.com.br"],
    ["cartolaluderia", "Cartola Luderia Bar", "São Paulo", "SP", ""],
    ["castelosbareboardgames", "Castelos Bar & Boardgames", "São Paulo", "SP", "castelosbar.com.br"],
    ["coletivogeekbr", "Coletivo Geek", "São Paulo", "SP", ""],
    ["covilgb", "Covil Game Bar", "São Paulo", "SP", ""],
    ["dungeongames.oficial", "Dungeon Games Store", "São Paulo", "SP", "dungeongamesstore.com.br"],
    ["encounter.bg", "Encounter | Jogos de Tabuleiro | Board Games", "São Paulo", "SP", ""],
    ["espaco162karaoke", "Espaço 162 - Meu Karaokê Box", "São Paulo", "SP", "espaco162.com.br"],
    ["fanhourbr", "Fan Hour Games and Burgers", "São Paulo", "SP", "fanhour.com.br"],
    ["flowg4mes", "Flow Games - Burgers, Cards & Comunidade", "São Paulo", "SP", "flowstore.com.br"],
    ["jogasampa", "Jogasampa", "São Paulo", "SP", "jogasampa.com.br"],
    ["ludusluderia", "Ludus Luderia", "São Paulo", "SP", "ludusluderia.com.br"],
    ["omniverselivraria", "OMNIVERSE", "São Paulo", "SP", "omniverse.com.br"],
    ["pittasboardgames", "Pitta's Board Games", "São Paulo", "SP", "pittasstore.com.br"],
    ["lojaplacegames", "Place Games", "São Paulo", "SP", "placegames.com.br"],
    ["playeasyjogos", "Play Easy", "São Paulo", "SP", "playeasy.com.br"],
    ["tubaleria", "Tubaleria", "São Paulo", "SP", ""],
    ["xplaceoficial", "XPlace", "São Paulo", "SP", "xplace.com.br"],
    ["cafegeekvv", "Café Geek Cafeteria e Ludoteca", "Vitória", "ES", ""],
    ["cheiodefomeoficial", "Cheio de Fome - Vila da Penha", "Rio de Janeiro", "RJ", ""],
    ["", "Reduto", "Rio de Janeiro", "RJ", ""],
    ["", "Covil Game Bar SBC", "São Paulo", "SP", ""]
  ].map(([ig, nome, capital, uf, site]) => ({ id: slug(nome), ig, nome, capital, uf, site }));

  function slug(t) {
    return String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '');
  }

  // Semelhança entre a casa e um nome achado numa plataforma (0 a 1), com o critério.
  // Palavras genéricas e o nome da capital saem antes de comparar.
  const PALAVRAS_VAZIAS = new Set(('a o e em de da do das dos the and bar jogos jogo tabuleiro board boardgames boardgame games game '
    + 'cafe cafeteria luderia ludobar restaurante hamburgueria burgers burger pizzaria loja store hobby hobbies oficial pub food '
    + 'cards tcg comunidade fliperama acervo lista aluguel para locacao locadora').split(' '));
  const ACEITE = 0.75;   // a partir daqui o achado vira alvo de coleta
  const CONFERIR = 0.5;  // entre CONFERIR e ACEITE: só no CSV da varredura, para conferir

  function nucleo(nome, capital = '') {
    const cidade = new Set(capital.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().split(/[^a-z0-9]+/));
    const t = String(nome || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
    const n = t.filter((x) => !PALAVRAS_VAZIAS.has(x) && !cidade.has(x));
    return n.length ? n : t;
  }

  function dice(a, b) {
    const pares = (x) => { const m = new Map(); for (let i = 0; i < x.length - 1; i++) { const p = x.slice(i, i + 2); m.set(p, (m.get(p) || 0) + 1); } return m; };
    if (a === b) return a ? 1 : 0;
    if (a.length < 2 || b.length < 2) return 0;
    const pa = pares(a), pb = pares(b);
    let comum = 0;
    for (const [p, n] of pa) comum += Math.min(n, pb.get(p) || 0);
    return (2 * comum) / (a.length - 1 + b.length - 1);
  }

  function parecido(casa, nomeFonte, chave = '') {
    const c = slug(chave), h = slug(casa.ig), s = slug(String(casa.site || '').split('.')[0]);
    const na = nucleo(casa.nome, casa.capital), nb = nucleo(nomeFonte, casa.capital);
    const ja = na.join(''), jb = nb.join('');
    if (c && (c === h || c === s || c === ja)) return { s: 1, criterio: 'endereço igual ao Instagram, ao site ou ao nome' };
    // Contido só vale quando o trecho que sobra é pequeno ("aarenabg" ⊃ "arenabg"), não
    // quando é outra palavra ("dungeonsedados" ⊃ "dungeon").
    const contem = (x, y) => x.length >= 5 && y.length >= 5 && (x.includes(y) || y.includes(x))
      && Math.min(x.length, y.length) / Math.max(x.length, y.length) >= 0.6;
    if (c && (contem(c, h) || contem(c, s) || contem(c, ja))) return { s: 0.9, criterio: 'endereço contém o Instagram, o site ou o nome' };
    const [curto, longo] = na.length <= nb.length ? [na, nb] : [nb, na];
    if (curto.join('').length >= 5 && curto.every((x) => longo.includes(x)) && curto.join('').length / longo.join('').length >= 0.5) {
      return { s: 0.9, criterio: 'nome contido no outro' };
    }
    // Só a grafia parecida passa do aceite quando é quase igual (≥ 0,9); abaixo, vai conferir.
    const d = Math.max(dice(ja, jb), c ? dice(ja, c) : 0);
    return { s: Math.round((d >= 0.9 ? d : Math.min(d, 0.7)) * 100) / 100, criterio: 'nome parecido' };
  }

  // Catálogos públicos das plataformas.
  function lerLojasAcervoDeJogos(texto) {
    const lojas = [];
    for (const [item] of texto.matchAll(/<li data-list-filter-target="item"[\s\S]*?<\/li>/g)) {
      const i = item.replace(/\s+/g, ' ');
      const a = i.match(/href="https:\/\/([^."]+)\.acervodejogos\.com\.br\/?"[^>]*>(.*?)<\/a>/);
      const loc = i.match(/text-slate-500">([^<]*?) · ([A-Z]{2})\s*<\/span>/);
      if (a) lojas.push({ chave: a[1], nome: limpa(a[2].replace(/<[^>]+>/g, '')), cidade: loc ? limpa(loc[1]) : '', uf: loc ? loc[2] : '' });
    }
    return lojas;
  }

  function lerCidadesRejoy(texto) {
    const vistas = new Map();
    for (const [, q] of texto.matchAll(/href="\/locadoras\?([^"]+)"/g)) {
      const p = new URLSearchParams(q.replace(/&amp;/g, '&'));
      if (p.get('cidade') && p.get('uf')) vistas.set(`${p.get('cidade')}|${p.get('uf')}`, { cidade: p.get('cidade'), uf: p.get('uf') });
    }
    return [...vistas.values()];
  }

  function lerLocadorasRejoy(texto) {
    const dados = nuxt(texto);
    return Object.entries(dados).filter(([c]) => c.startsWith('stores:')).flatMap(([, v]) => v || [])
      .filter((l) => l && l.slug).map((l) => ({ chave: l.slug, nome: limpa(l.name), cidade: l.city || '', uf: l.state || '' }));
  }

  function lerUsuariosLudopedia(texto) {
    const m = new Map();
    for (const [, u, t] of texto.matchAll(/<a[^>]+href="https:\/\/ludopedia\.com\.br\/usuario\/([^"/?#]+)"[^>]*>([\s\S]*?)<\/a>/g)) {
      const usuario = limpa(decodeURIComponent(u));
      const nome = limpa(t.replace(/<[^>]+>/g, ''));
      if (!m.has(usuario) || nome) m.set(usuario, { usuario, nome: nome || usuario });
    }
    return [...m.values()];
  }

  function lerListasLudopedia(texto) {
    const m = new Map();
    for (const [, id, sl, t] of texto.matchAll(/href="https:\/\/ludopedia\.com\.br\/lista\/(\d+)\/([^"]+)"[^>]*>([\s\S]*?)<\/a>/g)) {
      const titulo = limpa(t.replace(/<[^>]+>/g, ''));
      if (titulo || !m.has(id)) m.set(id, { id, url: `https://ludopedia.com.br/lista/${id}/${sl}`, titulo: titulo || sl.replace(/-/g, ' ') });
    }
    return [...m.values()];
  }

  // Pedido a outro domínio (GM_xmlhttpRequest, com os cookies do navegador); sem ele, fetch.
  function pedir(url) {
    if (typeof GM_xmlhttpRequest !== 'function') return baixarTexto(url);
    return new Promise((ok, erro) => GM_xmlhttpRequest({
      method: 'GET', url, timeout: 30000,
      onload: (r) => (r.status >= 200 && r.status < 300 ? ok(r.responseText) : erro(Object.assign(new Error(`HTTP ${r.status}`), { http: r.status }))),
      onerror: () => erro(new Error('falha de rede')),
      ontimeout: () => erro(new Error('tempo esgotado')),
    }));
  }

  // Endereço que só existe se a casa tiver loja na plataforma (inexistente responde 404).
  const existe = (url) => pedir(url).then(() => true, (e) => (e.http === 404 ? false : Promise.reject(e)));

  const CHAVE_ACHADOS = 'acv:achados'; // { casa: { em, cands: [{ fonte, chave, url, nome_fonte, semelhanca, criterio }], erros: [] } }
  const CHAVE_CADEIA = 'acv:cadeia';   // true enquanto "Coletar todos" segue de acervo em acervo
  const URL_FONTE = {
    acervodejogos: (c) => `https://${c}.acervodejogos.com.br/boardgames?sort=mais_alugados`,
    rejoy: (c) => `https://${c}.rejoy.com.br/search`,
  };

  // Achados de uma casa nos catálogos, na busca da Ludopedia e na sondagem direta dos endereços.
  function casar(casa, { lojasAdj = [], lojasRejoy = [], usuarios = [], listas = [] }) {
    const cands = [];
    const por = (fonte, chave, url, nomeFonte, uf, bonus = 0) => {
      if (uf && casa.uf && uf !== casa.uf) return;
      const p = parecido(casa, nomeFonte, chave);
      if (p.s >= CONFERIR) cands.push({ fonte, chave, url, nome_fonte: nomeFonte, semelhanca: p.s >= ACEITE ? Math.min(1, p.s + bonus) : p.s, criterio: p.criterio + (bonus ? '; lista de acervo' : '') });
    };
    for (const l of lojasAdj) por('acervodejogos', l.chave, URL_FONTE.acervodejogos(l.chave), l.nome, l.uf);
    for (const l of lojasRejoy) por('rejoy', l.chave, URL_FONTE.rejoy(l.chave), l.nome, l.uf);
    // Na Ludopedia, lista declarada como acervo vem antes da coleção de um usuário homônimo
    // (que pode ser pessoa física): no empate, fica a lista.
    for (const l of listas) if (/acervo|alug|loca/i.test(l.titulo)) por('ludopedia', `lista${l.id}`, l.url, l.titulo, '', 0.1);
    for (const u of usuarios) por('ludopedia', slug(u.usuario), `https://ludopedia.com.br/colecao?usuario=${encodeURIComponent(u.usuario)}&lista=colecao`, u.nome, '');
    const melhor = new Map();
    for (const c of cands.sort((a, b) => b.semelhanca - a.semelhanca)) if (!melhor.has(`${c.fonte}:${c.chave}`)) melhor.set(`${c.fonte}:${c.chave}`, c);
    // Uma loja por plataforma: a mais parecida é aceita; as demais vão conferir.
    const aceitas = new Set();
    return [...melhor.values()].map((c) => {
      if (c.semelhanca < ACEITE) return c;
      if (aceitas.has(c.fonte)) return { ...c, semelhanca: Math.min(c.semelhanca, 0.7), criterio: `${c.criterio}; outra loja da mesma plataforma é mais parecida` };
      aceitas.add(c.fonte);
      return c;
    });
  }

  // Acervo já conhecido (ACERVOS) da casa entra como achado e prevalece na sua plataforma:
  // o mesmo endereço achado por outro nome sai, e outra loja aceita na plataforma vai conferir.
  function juntarConhecidos(casa, cands) {
    const meus = ACERVOS.filter((a) => casaDoAcervo(a) === casa);
    const url = (u) => decodeURIComponent(u).toLowerCase();
    const urls = new Set(meus.map((a) => url(a.url)));
    const fontes = new Set(meus.map((a) => a.fonte));
    return [
      ...meus.map((a) => ({ fonte: a.fonte, chave: a.chave, url: a.url, nome_fonte: a.nome, semelhanca: 1, criterio: 'acervo já conhecido' })),
      ...cands.filter((c) => !urls.has(url(c.url)) && !meus.some((a) => a.fonte === c.fonte && a.chave === c.chave))
        .map((c) => (fontes.has(c.fonte) && c.semelhanca >= ACEITE ? { ...c, semelhanca: 0.7, criterio: `${c.criterio}; a casa já tem acervo conhecido nesta plataforma` } : c)),
    ];
  }

  // Endereços a sondar direto: o @ do Instagram e o nome do site, quando o catálogo não os trouxe.
  const sondaveis = (casa) => [...new Set([slug(casa.ig), slug(String(casa.site || '').split('.')[0])].filter((x) => x.length >= 4))];

  async function varrer(casas = CASAS) {
    const achados = kit.ler(CHAVE_ACHADOS, {});
    const erros = [];
    const passo = (t, f) => { status(t); kit.progresso('varredura', f, t); };
    const tentar = async (rotulo, fn, padrao) => { try { return await fn(); } catch (e) { erros.push(`${rotulo}: ${e.message}`); return padrao; } };
    passo('Acervo de Jogos: lista de lojas…', 0.02);
    const lojasAdj = await tentar('Acervo de Jogos', async () => lerLojasAcervoDeJogos(await pedir('https://www.acervodejogos.com.br/companies')), []);
    const ufs = new Set(casas.map((c) => c.uf));
    const cidades = (await tentar('rejoy', async () => lerCidadesRejoy(await pedir('https://www.rejoy.com.br/locadoras')), [])).filter((c) => ufs.has(c.uf));
    const lojasRejoy = [];
    for (const [i, c] of cidades.entries()) {
      if (kit.parar) throw new Error('interrompido');
      passo(`rejoy: ${c.cidade}/${c.uf} (${i + 1} de ${cidades.length})`, 0.05 + 0.25 * (i / (cidades.length || 1)));
      lojasRejoy.push(...await tentar(`rejoy ${c.cidade}`, async () => lerLocadorasRejoy(await pedir(`https://www.rejoy.com.br/locadoras?cidade=${encodeURIComponent(c.cidade)}&uf=${c.uf}`)), []));
      await esperar(sortear([400, 800]));
    }
    for (const [i, casa] of casas.entries()) {
      if (kit.parar) throw new Error('interrompido');
      passo(`${casa.nome} (${i + 1} de ${casas.length})`, 0.3 + 0.7 * (i / casas.length));
      const errosCasa = [];
      const termos = [...new Set([nucleo(casa.nome, casa.capital).slice(0, 2).join(' '), slug(casa.ig)].filter((t) => t.length >= 4))];
      const usuarios = [], listas = [];
      for (const t of termos) {
        try {
          usuarios.push(...lerUsuariosLudopedia(await pedir(`https://ludopedia.com.br/search_user?search=${encodeURIComponent(t)}`)));
          await esperar(sortear([700, 1300]));
          listas.push(...lerListasLudopedia(await pedir(`https://ludopedia.com.br/listas?search=${encodeURIComponent(t)}`)));
          await esperar(sortear([700, 1300]));
        } catch (e) { errosCasa.push(`Ludopedia: ${e.message}`); }
      }
      const cands = casar(casa, { lojasAdj, lojasRejoy, usuarios, listas });
      for (const fonte of ['acervodejogos', 'rejoy']) {
        if (cands.some((x) => x.fonte === fonte && x.semelhanca >= ACEITE)) continue;
        for (const c of sondaveis(casa)) {
          if (cands.some((x) => x.fonte === fonte && x.chave === c)) continue;
          try {
            if (await existe(URL_FONTE[fonte](c))) cands.push({ fonte, chave: c, url: URL_FONTE[fonte](c), nome_fonte: c, semelhanca: 1, criterio: 'endereço do Instagram ou do site existe na plataforma' });
          } catch (e) { errosCasa.push(`${PLATAFORMA[fonte]} ${c}: ${e.message}`); }
          await esperar(sortear([250, 500]));
        }
      }
      achados[casa.id] = { em: Date.now(), cands: juntarConhecidos(casa, cands), erros: errosCasa };
      kit.gravar(CHAVE_ACHADOS, achados);
    }
    for (const casa of casas) if (erros.length && achados[casa.id]) achados[casa.id].erros = [...erros, ...achados[casa.id].erros];
    kit.gravar(CHAVE_ACHADOS, achados);
    kit.progresso('varredura', null);
    mostrarVarredura(casas);
    baixarVarredura();
    refazerMenu();
  }

  // Situação da casa na varredura (dicionário §4.5): coletar (achou acervo), vazia (nenhum
  // nas três plataformas) ou refazer (algum pedido falhou e nada foi achado).
  function situacaoDaCasa(a) {
    if (!a) return 'coletar: ainda não procurada';
    if (a.cands.some((c) => c.semelhanca >= ACEITE)) return 'coletar';
    return a.erros?.length ? `refazer: ${a.erros[0]}` : 'vazia';
  }

  const COLS_VARREDURA = ['estabelecimento', 'capital', 'uf', 'instagram', 'fonte', 'url_fonte', 'nome_na_fonte', 'semelhanca', 'criterio', 'aceito', 'situacao', 'data_coleta'];

  // Uma linha por casa e acervo achado (casa com mais de um acervo tem mais de uma linha;
  // contagem não exclusiva) e uma linha sem fonte para a casa sem nenhum achado.
  function linhasVarredura(achados = kit.ler(CHAVE_ACHADOS, {})) {
    return CASAS.flatMap((casa) => {
      const a = achados[casa.id];
      const base = { estabelecimento: casa.nome, capital: casa.capital, uf: casa.uf, instagram: casa.ig, situacao: situacaoDaCasa(a), data_coleta: a ? new Date(a.em).toLocaleDateString('sv-SE') : '' };
      const cs = a?.cands || [];
      return cs.length ? cs.map((c) => ({ ...base, fonte: c.fonte, url_fonte: c.url, nome_na_fonte: c.nome_fonte, semelhanca: String(c.semelhanca).replace('.', ','), criterio: c.criterio, aceito: c.semelhanca >= ACEITE ? 'sim' : 'conferir' }))
        : [{ ...base, fonte: '', url_fonte: '', nome_na_fonte: '', semelhanca: '', criterio: '', aceito: '' }];
    });
  }

  function baixarVarredura() {
    kit.baixarArquivo(`${hoje()}_acervos_varredura.csv`, kit.csv(linhasVarredura(), COLS_VARREDURA));
    if (el.bVarredura) kit.piscar(el.bVarredura);
  }

  function mostrarVarredura(casas = CASAS) {
    const achados = kit.ler(CHAVE_ACHADOS, {});
    const sits = casas.map((c) => situacaoDaCasa(achados[c.id]));
    const com = sits.filter((s) => s === 'coletar').length;
    const aceitos = casas.flatMap((c) => (achados[c.id]?.cands || []).filter((x) => x.semelhanca >= ACEITE));
    const conferir = casas.reduce((n, c) => n + (achados[c.id]?.cands || []).filter((x) => x.semelhanca < ACEITE).length, 0);
    const refazer = sits.filter((s) => s.startsWith('refazer')).length;
    kit.resumo({
      titulo: `${com} de ${casas.length} casas com acervo online`,
      sub: 'Acervo de Jogos, rejoy e Ludopedia',
      linhas: Object.keys(PLATAFORMA).map((f) => [aceitos.filter((x) => x.fonte === f).length, PLATAFORMA[f]]),
      avisos: [conferir ? `${conferir} achados parecidos para conferir no CSV` : '', refazer ? `${refazer} casas com pedido falho: procurar de novo` : ''],
      tipo: refazer ? 'alerta' : 'ok',
    });
  }

  // ---------- menu ----------
  const estadoAcervo = (a, feitos = {}, marcas = {}) => {
    if (marcas[a.chave] === true) return 'ok';
    if (marcas[a.chave] === false) return 'falta';
    if (a.semAlvo) return a.varrida ? 'ok' : 'falta';
    const s = String(feitos[a.chave]?.situacao || '');
    return s.startsWith('refazer') ? 'falha' : s ? 'ok' : 'falta';
  };
  const estadoDoAlvo = (a) => estadoAcervo(a, kit.ler(CHAVE_FEITOS, {}), kit.ler(CHAVE_MARCAS, {}));

  // Casa de um acervo conhecido (ACERVOS): a mais parecida, se passar do aceite.
  function casaDoAcervo(a) {
    let melhor = null, s = 0;
    for (const c of CASAS) { const p = parecido(c, a.nome, a.chave).s; if (p > s) { s = p; melhor = c; } }
    return s >= ACEITE ? melhor : null;
  }

  // Itens do menu: cada acervo (conhecido ou achado na varredura) de cada casa, por capital;
  // a casa sem acervo aparece uma vez, sem endereço (✓ depois de procurada, ○ antes).
  function alvos(achados = kit.ler(CHAVE_ACHADOS, {})) {
    const lista = [], vistos = new Set();
    const novo = (a) => { const k = `${a.fonte}:${a.chave}`; if (vistos.has(k)) return false; vistos.add(k); return true; };
    const doCasa = new Map(ACERVOS.map((a) => [a.id, casaDoAcervo(a)]));
    for (const casa of CASAS) {
      const meus = [
        ...ACERVOS.filter((a) => doCasa.get(a.id) === casa),
        ...(achados[casa.id]?.cands || []).filter((c) => c.semelhanca >= ACEITE)
          .map((c) => ({ id: `${c.fonte}:${c.chave}`, chave: c.chave, fonte: c.fonte, url: c.url })),
      ].filter(novo);
      for (const a of meus) lista.push({ ...a, nome: casa.nome, casa: casa.id, capital: casa.capital });
      if (!meus.length) lista.push({ id: `casa:${casa.id}`, chave: `casa:${casa.id}`, nome: casa.nome, casa: casa.id, capital: casa.capital, fonte: '', url: '', semAlvo: true, varrida: !!achados[casa.id] && !situacaoDaCasa(achados[casa.id]).startsWith('refazer') });
    }
    for (const a of ACERVOS) if (novo(a)) lista.push({ ...a, capital: 'Fora do B1' });
    return lista;
  }

  function proximoAcervo(idAtual, feitos = {}, marcas = {}, lista = ACERVOS) {
    const i0 = lista.findIndex((a) => a.id === idAtual);
    const atual = lista[i0] || lista[0];
    const ordem = [...lista.slice(i0 + 1), ...lista.slice(0, Math.max(i0, 0))]
      .filter((a) => a.id !== idAtual && a.url && estadoAcervo(a, feitos, marcas) !== 'ok');
    return ordem.find((a) => (a.capital ?? a.fonte) === (atual.capital ?? atual.fonte)) || ordem[0] || null;
  }

  function abrirAcervo(a) {
    kit.gravar(CHAVE_ABRIR, { id: a.id, chave: a.chave, nome: a.nome, fonte: a.fonte, em: Date.now() });
    location.href = a.url;
  }

  // >>> kit_painel (cópia de _src/WebScripts/_kit_painel/kit_painel.js; regerar com: node _src/WebScripts/_kit_painel/embutir.js)
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
      'arrow-down': 'M19.5 13.5 12 21m0 0-7.5-7.5M12 21V3',
      'arrow-down-tray': 'M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3',
      'arrow-path': 'M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99',
      'arrow-top-right-on-square': 'M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25',
      'arrow-up': 'M4.5 10.5 12 3m0 0 7.5 7.5M12 3v18',
      'arrow-up-tray': 'M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5',
      'arrow-uturn-left': 'M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3',
      'bell': 'M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0',
      'bell-slash': 'M9.143 17.082a24.248 24.248 0 0 0 3.844.148m-3.844-.148a23.856 23.856 0 0 1-5.455-1.31 8.964 8.964 0 0 0 2.3-5.542m3.155 6.852a3 3 0 0 0 5.667 1.97m1.965-2.277L21 21m-4.225-4.225a23.81 23.81 0 0 0 3.536-1.003A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6.53 6.53m10.245 10.245L6.53 6.53M3 3l3.53 3.53',
      'calendar-days': 'M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5',
      'check': 'm4.5 12.75 6 6 9-13.5',
      'chevron-double-down': 'm4.5 5.25 7.5 7.5 7.5-7.5m-15 6 7.5 7.5 7.5-7.5',
      'chevron-left': 'M15.75 19.5 8.25 12l7.5-7.5',
      'chevron-right': 'm8.25 4.5 7.5 7.5-7.5 7.5',
      'clock': 'M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
      'code-bracket': 'M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5',
      'document-check': 'M10.125 2.25h-4.5c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125v-9M10.125 2.25h.375a9 9 0 0 1 9 9v.375M10.125 2.25A3.375 3.375 0 0 1 13.5 5.625v1.5c0 .621.504 1.125 1.125 1.125h1.5a3.375 3.375 0 0 1 3.375 3.375M9 15l2.25 2.25L15 12',
      'document-duplicate': 'M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H9.75',
      'document-text': 'M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z',
      'exclamation-triangle': 'M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z',
      'eye': 'M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178ZM15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z',
      'forward': 'M3 8.689c0-.864.933-1.406 1.683-.977l7.108 4.061a1.125 1.125 0 0 1 0 1.954l-7.108 4.061A1.125 1.125 0 0 1 3 16.811V8.69ZM12.75 8.689c0-.864.933-1.406 1.683-.977l7.108 4.061a1.125 1.125 0 0 1 0 1.954l-7.108 4.061a1.125 1.125 0 0 1-1.683-.977V8.69Z',
      'funnel': 'M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 0 1-.659 1.591l-5.432 5.432a2.25 2.25 0 0 0-.659 1.591v2.927a2.25 2.25 0 0 1-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 0 0-.659-1.591L3.659 7.409A2.25 2.25 0 0 1 3 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0 1 12 3Z',
      'hashtag': 'M5.25 8.25h15m-16.5 7.5h15m-1.8-13.5-3.9 19.5m-2.1-19.5-3.9 19.5',
      'information-circle': 'm11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z',
      'magnifying-glass': 'm21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z',
      'map-pin': 'M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z',
      'minus': 'M5 12h14',
      'bolt': 'm3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z',
      'bolt-slash': 'M11.412 15.655 9.75 21.75l3.745-4.012M9.257 13.5H3.75l2.659-2.849m2.048-2.194L14.25 2.25 12 10.5h8.25l-4.707 5.043M8.457 8.457 3 3m5.457 5.457 7.086 7.086m0 0L21 21',
      'play': 'M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z',
      'plus': 'M12 4.5v15m7.5-7.5h-15',
      'queue-list': 'M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 0 1 0 3.75H5.625a1.875 1.875 0 0 1 0-3.75Z',
      'stop': 'M5.25 7.5A2.25 2.25 0 0 1 7.5 5.25h9a2.25 2.25 0 0 1 2.25 2.25v9a2.25 2.25 0 0 1-2.25 2.25h-9a2.25 2.25 0 0 1-2.25-2.25v-9Z',
      'trash': 'm14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0',
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
      n.setAttribute('data-dica', '');
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

    function baixarArquivo(nome, conteudo, tipo = 'text/csv;charset=utf-8') {
      const url = URL.createObjectURL(new Blob([conteudo], { type: tipo }));
      const a = criar('a', { href: url, download: nome });
      (document.body || document.documentElement).appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    }

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
      #painel{position:fixed;top:12px;right:12px;z-index:2147483647;width:var(--largura,340px);max-height:calc(100vh - 24px);
        overflow:auto;background:var(--fundo);color:var(--texto);border-radius:14px;
        box-shadow:0 8px 28px rgba(0,0,0,.2);font:13.5px/1.45 var(--fonte);padding:8px 12px 10px;
        resize:both;min-width:280px;min-height:44px;max-width:calc(100vw - 24px);transition:box-shadow .2s}
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

    // Posição e tamanho escolhidos pelo autor; sem posição salva, vale posicaoPadrao().
    let posicao = ler(chave('posicao'), null);
    let arrastou = false;

    function posicionar() {
      if (!painel) return;
      const p = painel;
      if (posicao?.width && !p.style.width && !p.classList.contains('min')) { p.style.width = posicao.width; p.style.height = posicao.height || ''; }
      if (posicao && posicao.left != null) {
        const w = p.offsetWidth || 340;
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
      painel = criar('div', { id: 'painel', style: `--largura:${largura}px` }, [cab, ...filhos]);
      k.el.painel = painel;
      k.el.nome.onclick = () => { if (!arrastou) minimizar(); };
      prepararArraste(cab);

      // O tamanho só muda pela alça de redimensionar, que grava largura e altura no estilo.
      addEventListener('pointerup', () => {
        if (!painel || painel.classList.contains('min')) return;
        const { width, height } = painel.style;
        if (width && (width !== posicao?.width || height !== posicao?.height)) {
          posicao = { ...posicao, width, height };
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
      criar, icone, dica, ajuda, botao, botaoPerigo, botaoParar, etiqueta, alternaIcone, pills, secao, naoAlterna,
      linha, esp, rotulo, selo, status, resumo, barra, progresso, estado, atualizarAcoes, executar, tocar, piscar,
      confirmarBotao, copiar, celula, csv, baixarArquivo, menuAlvos, montar, garantir, minimizar,
      nome: (t) => { if (k.el.nome && k.el.nome.textContent !== t) k.el.nome.textContent = t; },
      hospedeiro: () => hospedeiro,
    });
    return k;
  }
  // <<< kit_painel

  // ---------- painel ----------
  const kit = kitPainel({ id: 'acv', abertos: ['titulos'] });
  const el = {};
  const status = (t, tipo = '') => kit.status(t, tipo);
  let menu = null;

  function mostrarResultado() {
    const { alvo, jogos, situacao } = resultado;
    const comPreco = jogos.filter((j) => j.aluguel_rs !== '').length;
    kit.resumo({
      titulo: situacao === 'ok' ? `${jogos.length} títulos lidos` : situacao === 'vazia' ? 'Acervo sem títulos' : 'Leitura incompleta: refazer',
      sub: `${alvo.nome} · ${PLATAFORMA[alvo.fonte]}`,
      linhas: [[jogos.length, 'títulos', 'sem repetição'], ...(alvo.fonte === 'ludopedia' && !comPreco ? [] : [[comPreco, 'com preço de aluguel']])],
      avisos: [alvo.fonte !== 'ludopedia' ? 'O Python já baixa esta fonte; use o CSV para conferir.' : ''],
      tipo: situacao === 'ok' ? 'ok' : situacao === 'vazia' ? 'alerta' : 'erro',
    });
    el.selo.textContent = String(jogos.length);
    el.lista.replaceChildren(...jogos.slice(0, 200).map((j, i) => kit.criar('div', { className: 'jogo' }, [
      kit.criar('span', { className: 'pos', textContent: String(i + 1) }), j.jogo,
      j.aluguel_rs !== '' ? kit.criar('span', { className: 'chip azul', textContent: `R$ ${String(j.aluguel_rs).replace('.', ',')}${j.aluguel_dias ? `/${j.aluguel_dias}d` : ''}` }) : null,
    ])), jogos.length > 200 ? kit.criar('p', { className: 'vazio', textContent: `… e mais ${jogos.length - 200}` }) : null);
    el.bTxt.hidden = alvo.fonte !== 'ludopedia';
  }

  function criarMenu() {
    const lista = alvos();
    return kit.menuAlvos({
      itens: () => lista, grupo: (a) => a.capital || PLATAFORMA[a.fonte], unidade: 'acervos', estadoDe: estadoDoAlvo,
      nome: (a) => (a.semAlvo ? a.nome : `${a.nome} · ${PLATAFORMA[a.fonte]}`),
      atual: () => alvoDaPagina(location, lista)?.id || kit.ler(CHAVE_ULTIMO, '') || lista[0].id,
      detalhe: (a, e) => {
        if (a.semAlvo) return a.varrida ? 'sem acervo online' : 'procurar';
        const f = kit.ler(CHAVE_FEITOS, {})[a.chave];
        return f ? (e === 'falha' ? 'refazer' : `${f.n} títulos`) : '';
      },
      aoEscolher: (a) => {
        kit.gravar(CHAVE_ULTIMO, a.id);
        if (kit.ocupado) { status('Espere a leitura em curso terminar (ou pare).', 'alerta'); menu.rotular(); return; }
        if (a.semAlvo) { const casa = CASAS.find((c) => c.id === a.casa); kit.executar(() => varrer([casa])); return; }
        if (alvoDaPagina(location, lista)?.id === a.id) { menu.rotular(); return; }
        abrirAcervo(a);
      },
      aoProximo: () => {
        const a = proximoAcervo(alvoDaPagina(location, lista)?.id || kit.ler(CHAVE_ULTIMO, ''), kit.ler(CHAVE_FEITOS, {}), kit.ler(CHAVE_MARCAS, {}), lista);
        if (!a) { status('Todos os acervos achados estão coletados.', 'ok'); return; }
        abrirAcervo(a);
      },
      aoMarcar: (a) => {
        const col = estadoDoAlvo(a) === 'ok';
        kit.gravar(CHAVE_MARCAS, { ...kit.ler(CHAVE_MARCAS, {}), [a.chave]: !col });
        status(col ? `${a.nome} volta a faltar.` : `${a.nome} marcado como coletado.`);
        menu.rotular();
      },
    });
  }

  // Depois da varredura, o menu ganha os acervos achados.
  function refazerMenu() {
    const velho = menu.caixa;
    menu = criarMenu();
    velho.replaceWith(menu.caixa);
    menu.rotular();
  }

  // "Coletar todos": abre o próximo acervo que falta e, ao terminar cada leitura, segue para
  // o seguinte, até acabar ou o Parar.
  function seguirCadeia() {
    const lista = alvos();
    const a = proximoAcervo(alvoDaPagina(location, lista)?.id, kit.ler(CHAVE_FEITOS, {}), kit.ler(CHAVE_MARCAS, {}), lista);
    if (!a) { kit.gravar(CHAVE_CADEIA, false); status('Coletar todos: nada mais a coletar.', 'ok'); return; }
    status(`Coletar todos: abrindo ${a.nome} (${PLATAFORMA[a.fonte]})…`);
    abrirAcervo(a);
  }

  function montarPainel() {
    const { botao, linha, secao, selo, criar } = kit;
    menu = criarMenu();
    const bColetar = botao('arrow-down-tray', 'Coletar acervo', () => kit.executar(coletar), { classe: 'primario', dica: 'Lê todas as páginas do acervo aberto e baixa o CSV (e o TXT da Ludopedia)' });
    kit.botaoParar(() => { kit.parar = true; kit.gravar(CHAVE_CADEIA, false); status('Parando…'); });
    const bProcurar = botao('magnifying-glass', 'Procurar', () => kit.executar(() => varrer()),
      { classe: 'mini', dica: 'Procura as 63 casas do B1 no Acervo de Jogos, na rejoy e na Ludopedia (catálogos, busca e endereço do Instagram/site). Leva alguns minutos.' });
    const bTodos = botao('play', 'Coletar todos', () => { kit.gravar(CHAVE_CADEIA, true); seguirCadeia(); },
      { classe: 'mini', dica: 'Abre cada acervo achado que falta, um após o outro, e coleta sozinho' });
    el.bVarredura = botao('queue-list', '', baixarVarredura, { classe: 'leve', dica: 'CSV da varredura: cada casa, onde foi achada, semelhança e situação' });
    el.bCsv = botao('arrow-down-tray', 'CSV', baixarCsv, { classe: 'mini', dica: 'CSV com posição, título, aluguel e situação' });
    el.bTxt = botao('document-text', 'TXT', baixarTxt, { classe: 'mini', dica: 'ludopedia_<chave>.txt, no formato que o Python lê' });
    el.selo = selo();
    el.lista = criar('div', { className: 'lista' });
    kit.acoes = [bColetar, bProcurar, bTodos, el.bCsv, el.bTxt];
    const alvo = alvoDaPagina();
    const varridas = Object.keys(kit.ler(CHAVE_ACHADOS, {})).length;
    kit.montar({
      nome: 'Acervo', largura: 330, minimizado: !alvo && !kit.ler(CHAVE_CADEIA, false),
      css: '.jogo{display:flex;gap:6px;align-items:center;font-size:12.5px;padding:2px 4px;border-radius:6px}.jogo:hover{background:var(--sup)}.jogo .pos{min-width:2.4em;text-align:right}.jogo .chip{margin-left:auto}',
      filhos: [
        menu.caixa,
        linha([bProcurar, bTodos, el.bVarredura]),
        linha([bColetar, kit.el.parar]),
        kit.barra('varredura'), kit.barra('coleta'),
        kit.el.status = criar('div', { className: 'status', textContent: alvo ? `${alvo.nome} (${PLATAFORMA[alvo.fonte]}): clique em "Coletar acervo".`
          : varridas ? 'Escolha um acervo no seletor ou "Coletar todos".' : 'Clique em "Procurar" para achar os acervos das casas do B1.' }),
        linha([kit.rotulo('Baixar'), el.bCsv, el.bTxt]),
        secao('titulos', ['Títulos', el.selo], [el.lista]),
      ],
    });
    el.bTxt.hidden = alvo?.fonte !== 'ludopedia';
    menu.rotular();
  }

  // Acervo aberto pelo menu (ou pela cadeia): coleta sozinho quando a página carrega.
  function seguirPedido() {
    const p = kit.ler(CHAVE_ABRIR, null);
    if (!p) return;
    kit.gravar(CHAVE_ABRIR, null);
    if (Date.now() - p.em > 2 * 60 * 1000 || alvoDaPagina()?.id !== p.id) { kit.gravar(CHAVE_CADEIA, false); return; }
    kit.minimizar(false);
    setTimeout(async () => {
      const ok = await kit.executar(coletar);
      if (!kit.ler(CHAVE_CADEIA, false)) return;
      if (!ok) { kit.gravar(CHAVE_CADEIA, false); status('Coletar todos parou neste acervo.', 'alerta'); return; }
      setTimeout(seguirCadeia, sortear([2000, 3500]));
    }, 1500);
  }

  console.info('[Coletor de acervos] carregado');
  montarPainel();
  seguirPedido();
  setInterval(() => { try { kit.garantir(); } catch (e) { console.error('[Coletor de acervos]', e); } }, 1500);
})();
