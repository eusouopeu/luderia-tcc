# Especificações comuns dos webscripts

O que todo webscript (userscript do Tampermonkey) do TCC Luderia segue. Vale para script novo e para painel reescrito. As regras saíram dos pedidos do autor desde 11/10/2026 e das decisões de 02 e 03/11/2026 (`_docs/decisoes.md`). O padrão de referência é o `B2_avaliacoes_recentes/maps_avaliacoes.user.js`, e o código comum fica em `_kit_painel/kit_painel.js`.

## 1. Arquivos e pastas

| Item | Regra |
|---|---|
| Pasta | `_src/webScripts/B<n>_<nome>/`, uma por bloco (`B1_estabelecimentos/`, `B2_avaliacoes_recentes/`, `B4_bases_publicas/`, `B5_ativos_fixos/`) |
| Script | `<objeto>.user.js` (ex.: `acervo`, `cardapio`, `instagram`, `aluguel`, `mobiliario`) ou `<site>_<objeto>.user.js` quando há mais de um script do mesmo objeto (`maps_entorno`, `instagram_snowball`), com o teste ao lado, `<mesmo nome>.test.cjs` |
| Lista do menu | `lista_<script>.js`, ao lado do script: `var LISTA_<SCRIPT> = [...]` com os itens do dropdown (casas, perfis, acervos, buscas, itens). O script declara `// @require lista_<script>.js` no cabeçalho, e o carregador a lê antes dele; sem ela, o script avisa e para. Editar a lista muda o menu no próximo recarregar, sem reinstalar. O teste lê a lista antes do script |
| Kit do painel | `_kit_painel/kit_painel.js`, copiado para dentro do script entre `// >>> kit_painel` e `// <<< kit_painel` por `node _src/webScripts/_kit_painel/embutir.js`. Nunca editar a cópia embutida. Script novo entra na lista `ALVOS` do `embutir.js` |
| Carregador | `_carregadores/<script>.user.js` (fora do git), gerado por `python3 _src/outros/G5_outros/gerar_carregadores.py`: só o cabeçalho e um `@require file://` para a lista do menu (se houver) e outro para o script. O Tampermonkey instala o carregador, então editar o script não exige reinstalar; mudança de cabeçalho (`@match`, `@grant`) exige (`--abrir`) |
| Especificações | esta pasta, `specs/` |

## 2. Cabeçalho

- `@name`: o que faz e `(TCC Luderia)`, ex.: `Entorno no Google Maps (TCC Luderia)`.
- `@namespace tcc-luderia`; `@version AAAA.MM.DD-n` (n-ésima versão do dia), subida a cada mudança.
- `@description` com o que coleta e para onde vai o CSV.
- `@match` só dos sites usados; `@noframes`; `@run-at` `document-idle` (ou `document-start` quando precisa interceptar a rede).
- `@grant GM_getValue`, `GM_setValue` e `GM_deleteValue` quando guarda dados; `unsafeWindow` só se lê variável da página.
- Comentário de abertura: bloco e coleta (`dados/B<n>_<coleta>/`), capítulo que usa o dado, fonte, fluxo de uso em passos numerados, regras de leitura por site e a data em que cada leitura foi conferida.
- `console.info('[Nome] carregado')` ao iniciar.

## 3. Painel

- **Posição e montagem:** canto superior direito, num shadow DOM preso ao `<html>` (não ao `<body>`, que o React refaz), conferido a cada 1 a 1,5 s e reposto se sumir.
- **Tamanho:** compacto (largura padrão de 272 px; o kit aplica ×0,8 à largura pedida pelo script, desde 13/11/2026), arrastável pelo cabeçalho, redimensionável pela alça, com posição e tamanho salvos; minimizável, com o ponto de estado visível no cabeçalho.
- **Fonte:** Montserrat, com fallback de sistema.
- **Teclado:** as teclas digitadas no painel não chegam aos atalhos do site.
- **Seções** recolhíveis que lembram se estavam abertas; o que é raro (importar, limpar, preferências) fica numa seção fechada.

## 4. Menu dos itens a coletar (dropdown)

Todo coletor que trabalha sobre uma lista (estabelecimentos, perfis, cardápios, acervos, itens do orçamento, buscas de aluguel) abre com o menu de alvos do kit (`menuAlvos`):

- Um `<select>` com `<optgroup>` por grupo (cidade, categoria, portal) e uma opção por alvo, nomeado pelo nome curto e, se útil, um detalhe (`· 3 posts`).
- Situação na frente do nome, com símbolo tipográfico (não emoji): `✓` coletado, `◐` parcial, `!` refazer ou pendente, `○` falta. Cores das opções: cinza (ok), azul (parcial), âmbar (refazer).
- Contador `prontos/total <unidade>` com barra fina de progresso.
- Botões na mesma linha: **Próximo** (o próximo que falta, primeiro no mesmo grupo, e já coleta), **Marcar/Desfazer** (marca sem nova coleta, ou volta a faltar) e o filtro **Só os que faltam** (funil, lembrado entre sessões).
- Escolher um alvo abre a página dele e coleta; alvo já coletado pede confirmação antes de refazer.
- A lista vem de um arquivo do pipeline (ex.: `B1_entorno_maps_fila.csv`, a lista de itens do B5), copiada para `lista_<script>.js` (seção 1) ou importada no painel, nunca digitada nele.

## 5. Texto enxuto, ícones e dicas

- **Pouco texto no painel:** rótulos de uma ou duas palavras (`CSV`, `Próximo`, `Guardar`); sem frase explicativa solta. Botão que se entende pelo ícone fica só com o ícone.
- **Explicação na dica:** todo botão, selo e contador tem dica (balão do kit, mais rápido que o `title`), com o que faz, o efeito e o atalho. Explicação mais longa vai no `ⓘ`, que abre na hora e, clicado, fica fixo até Esc, rolagem ou clique fora.
- **Ícones:** só Heroicons 24/outline (traço 1,5), embutidos como SVG pelo kit (`icone(nome)`); nunca emoji. Ícone novo entra no `ICONES` do kit, não no script.
- **Controles juntos:** botões relacionados na mesma linha; filtros como selos (etiquetas liga/desliga), escolhas exclusivas como controle segmentado (`pills`).
- **Números com unidade e formato brasileiro:** vírgula decimal, `R$ 1.234,56`, datas `DD/MM`.

## 6. Cores

Tokens do kit, com versão para o modo escuro (`prefers-color-scheme`):

| Uso | Cor (claro) |
|---|---|
| Ação primária, botão ligado, em curso | roxo `#7e22ce` |
| Concluído, conferido | verde `#15803d` |
| Interrompido, incerto, filtro desligado, dado fora de CSV | âmbar `#b45309` |
| Erro, ação destrutiva | vermelho `#b91c1c` |
| Etiqueta ligada, parcial | azul `#2563eb` |
| Parado, neutro | cinza (`--suave`) |

O ponto do cabeçalho segue a mesma escala: cinza parado, roxo pulsando em curso, verde concluído, âmbar interrompido, vermelho erro. Resumo do desfecho com cabeçalho na cor do resultado e avisos em âmbar.

## 7. Microinterações

- **Botão confirma:** vira um ✓ verde por um instante depois de agir (`confirmarBotao`).
- **Brilho:** verde quando um elemento muda por sucesso e vermelho quando falha (`piscar`).
- **Ação destrutiva em dois cliques:** o primeiro arma (vermelho, treme), o segundo, em até 3 s, executa (`botaoPerigo`).
- **Status animado** a cada mudança e barra de progresso (determinada ou indeterminada) em toda tarefa longa.
- **Som** curto ao terminar (diferente para erro), com botão para desligar; o áudio é liberado no primeiro clique.
- **Ações travadas** durante uma tarefa (`executar`), com **Parar** sempre disponível.

## 8. Fluxo da coleta

- **Coletar não descarta nada:** filtros e regras só marcam (`motivo`, destaque) e o CSV sai completo; quem decide o que entra é o build em Python.
- **Critério registrado:** cada linha leva `data_coleta`, a busca ou a página de origem e a posição na página quando o critério depende da ordem (ex.: os 5 primeiros anúncios que cumprem os requisitos).
- **Exclusão é marcada, não apagada:** o que o autor exclui no painel vai no CSV com `excluida = 1`, e o build respeita.
- **Retomar de onde parou:** a fila e o que já foi lido ficam no armazenamento; página vazia ou erro de carga recarrega e retoma. Avisar no comentário de abertura quando o script precisa rodar numa janela própria (o navegador desacelera abas em segundo plano).
- **Baixar cada item (fila):** todo script cuja fila guarda os itens e só baixa no fim tem a opção de baixar o arquivo de cada item assim que ele termina (`kit.botaoBaixarCada`, ícone `arrow-down-on-square-stack`; nos painéis próprios, o selo "cada …"), desligada por padrão. O nome do arquivo de um item segue a convenção da coleta, para o build ler os dois e ficar com a versão mais recente de cada unidade. Scripts que já baixam um arquivo por item sempre (avaliações, snowball, acervo) não precisam dela; os sem fila (cardápio, mobiliário) também não.
- **Desafio do site (captcha, `sorry`):** o script para e avisa; nunca tenta resolver.

## 9. Dados e arquivos

- **Armazenamento:** `GM_getValue`/`GM_setValue` (comum a todos os sites do script), com `localStorage` como reserva; chaves com prefixo do script e versão (`tcc_precos_v1`).
- **CSV:** separador `;`, BOM UTF-8 e aspas só onde precisa (abre no Excel pt-BR; no pandas, `sep=";"`); cabeçalho fixo, conferido no teste, igual ao que o build lê.
- **Nome:** `AAAA-MM-DD_HHmm_<objeto>.csv` (a hora evita o "(1)" do navegador na segunda exportação do dia), salvo convenção própria da coleta (`_src/dicionario.md`).
- **Destino:** a pasta `_dados-brutos/` da coleta, dita no comentário de abertura e na dica do botão de download. Com `@grant GM_download`, o arquivo vai sem pergunta para `Downloads/TCC Luderia/<coleta>/_dados-brutos/…` (`kit.baixarArquivo` com `pastaDownload`); se o Tampermonkey recusar (modo de download nativo, extensão fora da lista), sai pelo download comum. Vários arquivos seguidos saem um de cada vez, esperando cada download antes de navegar.
- **Download automático** ao fim da coleta, com botão para desligar; aviso em âmbar quando há 25 ou mais registros guardados fora de CSV.
- **Backup antes de apagar:** "Limpar" baixa antes um JSON com tudo o que está guardado; o painel importa CSVs exportados para refazer o armazenamento, com as guardadas valendo sobre o arquivo.
- **Privacidade:** dado de pessoa física (ex.: listas "seguindo") vai para pasta fora do git; o script não envia nada para fora do navegador.

## 10. Testes

- `<script>.test.cjs` roda no Node (`node <arquivo>`), sem navegador: o kit só define funções e nada toca o DOM antes de `montar()`.
- Cobrir a leitura de cada site com HTML salvo em `fixtures` (no `5_outros/` da coleta em `_src/pyScripts/`), o cabeçalho do CSV, o nome do arquivo e as regras de filtro.
- `kit_painel.test.cjs` confere que todo script tem a cópia atual do kit (`node _src/webScripts/_kit_painel/embutir.js --conferir`).

## 11. Antes de entregar

1. Subir `@version`; rodar `embutir.js` se o kit mudou.
2. Rodar os testes do script e o do kit.
3. Rodar `gerar_carregadores.py` e dizer ao autor se é preciso reinstalar o carregador (cabeçalho mudou).
4. Conferir no painel: só ícones e rótulos curtos, toda ação com dica, cores da tabela da seção 6, menu de alvos com contador.
5. Registrar a decisão de coleta nova em `_docs/decisoes.md` e o passo a passo pendente do autor em `_docs/pendencias.md`.
