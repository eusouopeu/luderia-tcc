# Pendências

Tudo o que está em aberto, num só lugar. Quando um item for resolvido, ele sai daqui: decisão vai para [decisoes.md](decisoes.md), dúvida respondida vai para o texto ou para as instruções, e ideia adotada vai para o cronograma.

## Decisões a tomar

1. **Validação proporcional da coleta (em estudo, não adotada).** Até decidir, vale o procedimento de `_instrucoes/4_metodologia.md` §3.4, e a proposta não entra no texto. A proposta:
   - B1 e B2, fidelidade: amostra aleatória de 30 estabelecimentos e 100 avaliações, conferidos na página (nota, volume, endereço; texto, nota e rótulo de data);
   - B2, codificação: o autor recodifica 10% das avaliações depois de no mínimo 14 dias, sem consultar a primeira codificação; concordância pelo kappa de Cohen;
   - B4, reconciliação: cada série usada no plano conferida com o portal de origem em ao menos um período e um recorte;
   - erro total da pesquisa (TSE) em uma frase com citação, não numa seção.

   Antes de adotar, estudar: com zero erros, o limite superior de 95% de Wilson é 3,84 ÷ (n + 3,84), cerca de 11% com n = 30 e 3,7% com n = 100. Então 30 estabelecimentos não cumprem o critério de 5%: ou a amostra do B1 sobe para perto de 75, ou o critério muda. Falta ainda ver se a banca aceita a concordância de um codificador consigo mesmo e como estratificar uma amostra pequena (capital e faixa de volume). Desde 15/10, a auditoria dos estabelecimentos também usa as 54 casas do objeto como população (11 sorteadas, limite de 25,9% com zero erros), e o mesmo dilema vale para ela. No entorno, a população tem 54 casas: nem a auditoria de todas chega às 73 que o critério de 5% exige com zero erros; decidir entre auditar as 54 e declarar o limite ou usar o item (estação, shopping) como unidade.
2. **Hipótese do público potencial** (30 anos ou mais, casado ou com filhos, que frequentaria luderias se o ambiente, o público ou o serviço mudassem): registrar como emenda ao registro prévio ou guardar como estudo futuro (cap. 11.5)? Formulações testáveis em `docs/bibliografia/diagnostico-teorico.md` §9.
3. **PDFs da P2 que faltam:** Kimes e Robson (2004) no eCommons (bloqueou o download automático); Graham e Harvey, Delmar e Shane, Lambrecht e Skiera (SSRN), Li e Hitt (CORE), Anderson e Magruder (eScholarship), Xia et al. (UNAL) e Novaes e Kanyat (volume da revista) têm cópia aberta, mas só pelo navegador; os demais, pelo Portal CAPES ou pela biblioteca.
4. **Snowball do Instagram: corte k e fundamentação.** Escolher o corte k depois de classificar os candidatos (`B1_snowball_corte.csv`: menor k com precisão aceitável sem perder sensibilidade) e decidir se faz uma segunda onda com as luderias novas como sementes. Conferir antes de citar: LGPD, art. 4º, II, b e art. 7º, §4º; Resolução CNS 510/2016, art. 1º, parágrafo único; Goodman (1961) e Biernacki e Waldorf (1981) para o snowball `[AV]`. Decidir também o que fazer com @arainhadosdados, semente coletada sem ser casa aprovada (sai do build ou a casa entra nas aprovadas).
5. **Replanejar os rascunhos atrasados** (o cap. 5 tem esboço desde 15/10; cap. 8 com rascunho desde 15/10) ou acionar o plano de corte do cronograma?

6. **Bibliografia v2 (15/10/2026).** Escolher, conceito a conceito, entre a obra original dos checklists P1/P2 e o substituto de `bibliografia/bibliografia-v2/bibliografia-v2.md`; ao adotar um substituto, trocar a linha no checklist da leva para o vigia propagar. R10, R28 e R29 seguem com o original.

7. **Corte de shopping de porte no entorno.** Com o `…_entorno_shoppings.csv` (área no OSM e avaliações no Maps de cada shopping a até 1000 m), escolher o critério da coluna `qt_shoppings_porte` (área ≥ 5.000 m², mínimo de avaliações, ambos ou qualquer) e, se for por avaliações, o limiar e a fonte que o sustenta.

7. **Cap. 2, conferências antes da versão final:** edição, ano e página dos livros marcados `[AV]` (Dornelas, Porter, Kotler e Keller, Kim e Mauborgne, Mintzberg et al., Marcellino, Pine e Gilmore, Oldenburg, Woods, Zeithaml et al., Fitzsimmons et al., Hillier e Lieberman, Brealey et al., Damodaran, Bruni, Bruni e Famá, Casarotto e Kopittke, Pfeffer e Sutton); as edições do texto são a mais recente provável, não conferida. Baixar pelo navegador o PDF do SEBRAE (2016), que veio como HTML, e decidir se entra em 2.1. Incluir no checklist da P1/P2 os conceitos que o cap. 2 tira de obras sem ID (Kano/PRC, ERRC, PESTEL, terceiro lugar, lei de Little pelos livros da v2).

8. **Análise de conteúdo do B2: segundo codificador.** Quem faz a recodificação cega dos 131 comentários da amostra (autor ou outra pessoa) e quando; até lá, as categorias seguem sem medida de confiabilidade.

11. **Fonte do VLT/BRT no entorno.** O Maps não traz o BRT de Brasília (e, até a recoleta com "estação tubo", o de Curitiba); o OSM traz, mas ainda conta 4 paradas do bonde de Santa Teresa sem tag de rede. Usar o Maps, o OSM ou a maior das duas contagens no grupo VLT/BRT? Detalhe em `docs/parecer_entorno_B1.md` §7.

10. **Escala de fontes do cap. 5 × P1 e N1–N6** (`docs/melhorias-texto.md`, D01): a ordem de fontes em 4 níveis decidida para o cap. 5 em 15/10 vira a P1 de `_instrucoes/1_estrutura.md` ou sai do capítulo? E que rótulo dar ao tipo de dado da P2, para não confundir com N1–N6?

## Tarefas a fazer (pedidas pelo autor em 15/10/2026)

- **Instagram: aprimorar o coletor e refazer a coleta destes perfis** (status no Notion "Luderias – Status da coleta", 15/10):
  - sem seguidores: Bardo Mago (@bardo.mago), Tubaleria (@tubaleria), La Tabuleria (@latabuleria), TabuClub (@tabuclubnit) e Toca do Rato (@tocadorato_oficial); as três últimas também sem o nº total de posts. Nas coletas de 15/10 veio só o CSV de posts; o coletor deve exportar sempre o CSV de perfil junto;
  - Bardo Mago e Tubaleria: 1 post não carregou (615 de 616 e 339 de 340), e a data do primeiro post pode ser anterior à registrada;
  - Bravo (@bravojogos): sem a data do primeiro post;
  - Ludus (@ludusluderia): sem o nº total de posts;
  - LudoCafé: confirmar o perfil do bar (coletado @ludocafe_editora; a triagem aponta @ludocafebh);
  - Dominaria: coletado @dominariacg.sp (unidade de São Paulo); a casa aprovada fica em Fortaleza (@dominariacg).
- **Entorno: recoletar Curitiba no Maps e exportar tudo.** O OSM foi recoletado em 15/10 (12h49), íntegro, e o coletor passou à versão 2026.10.15-4 (busca "estação tubo" em Curitiba; plataformas de cada sentido, bonde de Santa Teresa e paradas sem nome fora da contagem do OSM; `versao_script` nos resumos). Recarregar o Maps, clicar em "Refazer pendentes" (as 6 casas de Curitiba) e exportar tudo. Conferir de novo (`docs/parecer_entorno_B1.md` §7) e só então levar ao resumo e ao site.
- **Entorno: completar e testar o banco.** Acrescentar ao banco de entornos os dados do OSM e os novos critérios de filtragem de shoppings (ver o item 7 das decisões a tomar) e, em seguida, testar a integridade e a confiabilidade dos dados.
- **Fazer as auditorias.** As amostras estão em `_dados-brutos/<pasta>/auditoria/` (scripts `*-a_auditoria_*.py`, 15/10). Entorno: seguir `textos/instrumentos/roteiro_auditoria_entorno_B1.md`, primeiro os itens do Maps e, depois da recoleta, os do OSM. A amostra do B2 saiu da base do build de 14/10 (2.218 no recorte): rodar `B2-a_auditoria_avaliacoes.py` de novo depois de refazer o build com a triagem corrigida (a chave por `review_id` mantém as já sorteadas). Falta o script que lê as conferências e calcula a taxa de erro com o intervalo de Wilson.
- **Entorno: corrigir o que o parecer apontou** (`docs/parecer_entorno_B1.md` §5 e §7): exportar de novo o arquivo de 51 casas (sem o filtro de 50 km); `B1-b_resumo.py` escolher a coleta pela data do nome, não pela data de modificação. BRT de Curitiba e versão nos CSVs resolvidos no coletor 2026.10.15-4, à espera da recoleta.
- **Sumarização do B2.**

12. **Modelo financeiro v0, escolhas a confirmar:** cobrar couvert de todos os clientes (R14 = 100%; couvert encontrado em 13 das 34 casas com cardápio, sem dado nas demais), equipe de 7 CLT mais o sócio gestor, 12 mesas em 150 m² e 300 títulos. Cada uma muda o VPL e pode virar decisão no cap. 6.3 ou 7.
13. **Cap. 8, `[conferir]`:** anexo I para alimentos e bebidas (e não anexo II por preparo próprio), CNAE secundário 9329-8/99 para o couvert e o número da lei de uso do solo de Salvador; prazo de guarda dos dados de reserva (LGPD). Também: efeito da LC 214/2025 no Simples e regulação de ruído de Salvador (D19 em `docs/melhorias-texto.md`).
14. **Figuras nos capítulos (15/10):** escolher, entre as 29 figuras de `5_graficos/` e `[B2]…/graficos/`, as que respondem a uma decisão do plano (cap. 5: casas por metrópole, nota, horários; cap. 6: pictogramas do B2 e do Instagram; cap. 7: horários) e mandar as demais para apêndice. Lacunas que as figuras mostram: São Jogue sem cardápio transcrito (Salvador e Nordeste ficam sem cesta), 5 casas novas sem seguidores no resumo do Instagram e Manaus sem casa no recorte.

## Divergências entre documentos, ainda sem correção

- Divergências entre capítulos (e contra as instruções) ficam em `docs/melhorias-texto.md`, por gravidade (D01 a D18 em 15/10/2026).
- Estilo: `_instrucoes/1_estrutura.md` P5 pede travessão e passiva sintética; a skill `meu-estilo-escrita` pede hífen e passiva analítica. Caps. 1 e 3 seguem a skill. Decidir qual vale e ajustar a outra.
- `_instrucoes/4_metodologia.md` espera de 100 a 150 concorrentes; a triagem deu 54. Atualizar a instrução.
- Triagem do B1 com 163 linhas para 164 candidatos (falta a Livraria Leitura Amazonas): registrar a exclusão e o motivo.


- Sarpa (2016): capa com *Experiências de consumo com jogos de tabuleiro modernos*; resumo com *Boardgames: um estudo sobre a experiência de consumo*. Conferir no repositório da UFRJ.

- Damodaran: `_instrucoes/8_financeiro.md` cita *Avaliação de investimentos* (ed. brasileira); o roteiro e o checklist da P2 citam *Investment valuation* (Wiley). Definir a edição que será lida.

- Build do B2 aceita "fim da lista" como coleta completa, mas o userscript para em silêncio (Shelf e Bardo Mago, 14/10). Marcar "conferir" quando o volume lido ficar muito abaixo do volume do B1 ou a última avaliação lida for mais nova que "3 meses atrás".
- Triagem do B1 desatualizada: tirar Machado Games e Ilusões Industriais das aprovadas e decidir como entram Bardo Mago, La Tabuleria, TabuClub, Toca do Rato e Tubaleria (hoje só no Notion; fora da base do B2).
- Shelf Bar: poucas avaliações com rótulo "2 meses atrás" (19) e "3 meses atrás" (14) frente a "um mês" (113) e "4 meses" (110). Conferir no Maps se é real ou falha de carregamento.
- Userscript `maps_avaliacoes`: `texto_original` vem "não" nas avaliações traduzidas (6 casos).
- Notion "B - Comentários": as linhas digitadas à mão não têm "ID da avaliação"; depois das coletas de 14/10, 40 delas seguem sem par nas coletas (Magic Store 31, outras 1 cada), quase todas mais antigas que o recorte.

- Instagram: `@ludocafe_editora` coletado para o LudoCafé (triagem: `@ludocafebh`) e `@dominariacg.sp` para a Dominaria de Fortaleza (`@dominariacg`). Sete perfis (Bodogami, Fan Hour, Bravo, Covil, Shelf, Ludoteca BGC, Cartola) vieram do coletor antigo, sem seguidores nem período.

- `_instrucoes/1_estrutura.md` (3.5) fala em "metade exploratória e confirmatória", e o cronograma (semana 3) tem a tarefa "Divisão da base em parte exploratória e parte confirmatória"; a metodologia adotou a base única em 13/10.
- `_instrucoes/1_estrutura.md` (11.5) cita "sem o recorte do último mês"; o recorte vigente é de 3 meses.
- O cronograma ainda fala em "avaliações do último mês" (semana 2).

## Dúvidas

- **Cardápios, conferir à mão:** categorias de 13 casas atribuídas por regra de palavra-chave (`B1-b_cardapios_transcricoes.py`); Cartola só tem entradas, sobremesas e drinks exportados da Takeat; preços de La Tabuleria e Toca do Rato são de delivery (Saipos); preços da Fan Hour e do LudoCafé vêm de matéria e de legenda do TikTok, lidos por resumo automático da página: conferir contra a fonte antes de citar.

- **Cardápios no navegador (busca profunda de 16/10):** abrir com o `cardapio_coletor.user.js` o Goomer da São Jogue (`sao-jogue.goomer.app`, concorrente direta em Salvador) e o iFood do Game Of Boards; abrir à mão `garagemdonerd.com.br/cardapio/`, o botão Cardápio do `beacons.ai/nalaland` e a aba de cardápio do Restaurant Guru do Joyjoy. Coletivo Geek: decidir se preenche o formulário do PDF. Lista completa e próximo passo por casa em `cardapios/B1_cardapios_busca_profunda.csv`.

- **Couvert de imprensa a confirmar (autor confirmando):** a imprensa cita couvert na Ludus (R$ 34 a R$ 44), na Bodogami (R$ 20 a R$ 35) e na Encounter (a partir de R$ 35), sem couvert no cardápio coletado; na Ludus, a página inicial do site diz que não cobra (`cardapios/B1_couvert_fontes_secundarias.csv`). Confirmado, entra na planilha e no R13.
- **R13 a recalcular:** depois de rodar no Mac `B1-b_resumo.py`, o modelo financeiro recalcula os percentis do couvert sobre as 13 casas com couvert encontrado (eram 6).

- **Resumo do B1 desatualizado em relação à planilha de cardápios:** rodar no Mac `B1-b_resumo.py` e depois `B1-a_estatistica_descritiva.py` (dependem de arquivos fora do git); o resumo ainda conta 26 casas com cardápio.

- **Rascunho do cap. 3, pontos `[conferir]`:** origem das 5 luderias novas (busca manual, Instagram ou outra); data e horário efetivos das visitas de 03/10; consulta à orientação sobre a dispensa do Comitê de Ética; números do B2 depois de incluir as 5 novas. A seção 3.5 (registro prévio, extra) ficou fora, e as seguintes subiram um número.

- **Entorno no Maps, três primeiras extrações (14/10):** os CSVs estão em `dados/[B1] Estabelecimentos e cardapios/_dados-brutos/entornos/maps_entorno_*_2026-10-14.csv` (um resumo e um resultados, com Ludus, Shelf e Bodogami) e não foram conferidos linha a linha; foram coletados antes da busca de trem. Recoletar os três estabelecimentos com a versão atual do coletor e conferir.
- Perguntas abertas para a literatura (validação de avaliações online como medida de visitas, estabilidade da razão avaliações ÷ visitantes, limiar de concordância para variáveis raras, peso de comida, serviço e ambiente, taxa de desconto de negócio pequeno, termos de uso do Google Maps): `docs/bibliografia/lacunas-bibliograficas.md` §6.
- Datas e horários das visitas: o roteiro de campo (`textos/instrumentos/roteiro_observacao_sao_jogue.md`) ainda marca 18h00 às 21h00 nas quatro visitas, e o cronograma (semana 4) chama a de 03/10 de "visita pré-teste". A primeira visita ao Bela Vista com dados no app foi no sábado, **10/10**, das 19h às 22h (não 03/10); o retorno em 18/10 fica a 8 dias, não 15. Confirmar a data da primeira visita à outra unidade e se o desenho (03/10, retorno 15 dias depois) muda em `_instrucoes/4_metodologia.md` e no cronograma.
- **B3, visita de 10/10 ao Bela Vista:** só o POV1 vale. Faltam a NFC-e do início (sem ela, não há notas emitidas nem pessoas por nota na visita; a do fim, nº 77977, entra no intervalo até o retorno), o encerramento da visita no app (duração estimada), as contagens de mesas a cada 30 min, a acústica e os preços do cardápio. As 24 pessoas que estavam dentro na chegada não têm campo próprio no app: hoje viram correção de lançamento. Avaliar um campo "pessoas dentro no início" no app antes de 18/10.
- **B3, visita de 16/10 ao Bela Vista (sexta, extra):** confirmar com os observadores (a) se a observação terminou mesmo por volta das 22h (o app foi encerrado às 23:40 e o fim foi corrigido para 22h00); (b) se os grupos do POV1 (entradas de 19:14 a 19:32) já estavam sentados na chegada e por que o POV1, com papel "porta", não lançou nenhuma entrada; (c) a saída do BV-1 na porta às 22:00, contra 21:05 na Mesa 10; (d) quantas mesas tem a unidade (6 em 10/10; 12 e 15 em 16/10). Faltaram a NFC-e do início, as contagens de 30 min e o código do observador em Ajustes. Decidir se a sexta entra como dia útil (R07) ou como fim de semana (R08): a nota cobra a taxa "FDS" na sexta.
- **B3, acervo por ambiente:** na visita de 10/10, um observador contou só o salão (350 caixas, 0 instrutores) e o outro somou a sala separada, provavelmente de RPG (432 e 7). Decidir se o acervo da unidade inclui a sala de RPG e registrar os dois números à parte; o app ainda não tem campo de ambiente no acervo.
- **B3, consumo de comidas e bebidas:** escolher entre as formas de registro propostas em 16/10 em `textos/instrumentos/recomendacoes_registro_consumo_B3.md` (pedido em um toque na mesa, mesas-sentinela, marca de comida e bebida na contagem de 30 min, itens da NFC-e) antes de implementar no app.

## Ideias futuras


- Extensões fora do escopo atual (durações citadas nos textos, contagem em outra capital, recoleta do volume total, teste da porta falsa): `_instrucoes/4_metodologia.md`, "Extensões fora do escopo atual".
- Simulação de Monte Carlo e testes H1–H9, se sobrar tempo (apêndices L e M).
- Hipótese do público potencial, se não virar emenda (item 2).
- Alinhar os valores dos CSV já gerados às regras de `_src/dicionario.md` §4.2 (`sim`/`nao` no lugar de `0`/`1` e `True`/`False`, ponto decimal nas transcrições de cardápio, rótulos de categoria com `_`) quando o script de cada um for alterado; conferir antes que nenhum script leitor dependa do formato antigo.

9. **Cap. 5, lacunas do esboço:** (a) densidade de luderias por habitante: numerador pela capital da região metropolitana do endereço e denominador pelo município-sede; alinhar os recortes (população da RM) e gerar por script; (b) script para os números marcados `[script]` (PAS deflacionada pelo IPCA, receita por empresa, custos em % da receita, custo do acervo); (c) buscar Comex Stat (NCM 9504.90), dados abertos do CNPJ (CNAE 5611-2/05, sobrevivência), PNAD TIC da Bahia, legislação de Salvador sobre ruído e alvará e a fonte original do número do Sebrae; (d) renda por bairro do Censo 2022 para 5.2.1.
