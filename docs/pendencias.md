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
5. **Replanejar os rascunhos atrasados** (caps. 3 e 8; o cap. 5 tem esboço desde 15/10) ou acionar o plano de corte do cronograma?

6. **Bibliografia v2 (15/10/2026).** Escolher, conceito a conceito, entre a obra original dos checklists P1/P2 e o substituto de `bibliografia/bibliografia-v2/bibliografia-v2.md`; ao adotar um substituto, trocar a linha no checklist da leva para o vigia propagar. R10, R28 e R29 seguem com o original.

7. **Fonte do limiar de shopping de porte no entorno.** Desde 30/10 o porte é só pelo número de avaliações no Maps (padrão 1.000; o OSM saiu). A distribuição dos 157 shoppings de 15/10 não tem corte natural: o resumo do coletor traz as contagens com 500, 1.000 e 5.000 avaliações. Falta escolher o limiar do texto e justificar com a sensibilidade; o Notion "A - Estabelecimentos" ainda usa o critério de 17/10 (avaliações ou área no OSM).

7. **Cap. 2, conferências antes da versão final:** edição, ano e página dos livros marcados `[AV]` (Dornelas, Porter, Kotler e Keller, Kim e Mauborgne, Mintzberg et al., Marcellino, Pine e Gilmore, Oldenburg, Woods, Zeithaml et al., Fitzsimmons et al., Hillier e Lieberman, Brealey et al., Damodaran, Bruni, Bruni e Famá, Casarotto e Kopittke, Pfeffer e Sutton); as edições do texto são a mais recente provável, não conferida. Baixar pelo navegador o PDF do SEBRAE (2016), que veio como HTML, e decidir se entra em 2.1. Incluir no checklist da P1/P2 os conceitos que o cap. 2 tira de obras sem ID (Kano/PRC, ERRC, PESTEL, terceiro lugar, lei de Little pelos livros da v2).

8. **Análise de conteúdo do B2: segundo codificador.** Quem faz a recodificação cega dos 131 comentários da amostra (autor ou outra pessoa) e quando; até lá, as categorias seguem sem medida de confiabilidade.

11. **BRT de Brasília no entorno.** Sem o OSM (30/10), o Maps é a única fonte, e a busca "estação BRT" não devolve as paradas do BRT Expresso DF. Testar outra busca (ex.: "parada BRT" ou o nome da linha) ou declarar a limitação, com o grupo VLT/BRT das 2 casas de Brasília em branco em vez de zero.

10. **Escala de fontes do cap. 5 × P1 e N1–N6** (`docs/melhorias-texto.md`, D01): a ordem de fontes em 4 níveis decidida para o cap. 5 em 15/10 vira a P1 de `_instrucoes/1_estrutura.md` ou sai do capítulo? E que rótulo dar ao tipo de dado da P2, para não confundir com N1–N6?

12. **Cesta de jogos, premissas do cap. 9.3** (`B1_cesta_jogos.xlsx`, 17/10): tamanho do acervo inicial (p25 = 222, mediana = 322 ou p75 = 622 títulos); desconto de distribuidora sobre o varejo online; frete e reposição por desgaste. A faixa por jogo é estreita porque muitos jogos estão à venda em uma loja só (menor = maior).

13. **Auditoria de cardápios: "Lúdico" da ludotecabgc** (um crepe) aparece como "couvert ou taxa de jogo" na amostra (Notion "B - Auditoria Cardápios"). Provável erro de categoria na transcrição; conferir na auditoria e corrigir a planilha se for o caso.

14. **"2 - Comentários" no Notion, campos ainda não revistos (30/10/2026).** (a) "Costuma ir" e "Voltará": proposta de trocar por "Recorrência" (primeira visita, já foi antes, frequenta, não dito) e "Intenção de voltar" (sim, não, condicional, não dito), mais um campo "Recomenda"; não aplicada. (b) Na recodificação dos temas, só se trocaram os itens já marcados: textos com temas evidentes e não marcados (ex.: couvert lúdico caro, demora e porções pequenas no Bardo Mago; tempo adicional pago no Balboa's) seguem sem o tema. (c) "Preço justo, bom acervo…" virou preço do consumo, mas pode ser o preço da entrada. (d) "Status" = Incompleto em 33 comentários (todos os que terminam no marcador do Google, espaço + "…"; Bardo Mago 9, Luderia Carioca 4, Encounter 3). Coletor corrigido em 30/10 (versão 2026.10.30-1, coluna `texto_expandido`). Recoleta de 30/10: no Bardo Mago, 6 dos 9 voltaram inteiros, com detalhes, preço e notas; os 3 restantes, e 2 do Bodogami, terminam no marcador mesmo sem botão "Mais" (o texto do Maps é esse; conferir logado). Falta recoletar as outras casas com "Incompleto" (Luderia Carioca 4, Encounter 3, Ludoteca Sidequest 2, Bravo Jogos 2 e 11 casas com 1), completar a Bodogami (interrompida em 930) e a Shelf (parou em 40), e levar as coletas novas ao Notion e ao `B2-b_avaliacoes.py`. Teto de campos extras faltando (30/10, `B2_completude_campos.csv`): 177 comentários sem nenhum dos 7 campos do Notion nas 19 casas que usam esses campos; parte é avaliador que não preencheu. Rodar a mesma conta no Notion quando a cota de SQL voltar.

## Tarefas a fazer (pedidas pelo autor em 15/10/2026)

- **Instagram: aprimorar o coletor e refazer a coleta destes perfis** (status no Notion "Luderias – Status da coleta", 15/10):
  - sem seguidores: Bardo Mago (@bardo.mago), Tubaleria (@tubaleria), La Tabuleria (@latabuleria), TabuClub (@tabuclubnit) e Toca do Rato (@tocadorato_oficial); as três últimas também sem o nº total de posts. Nas coletas de 15/10 veio só o CSV de posts; o coletor deve exportar sempre o CSV de perfil junto;
  - Bardo Mago e Tubaleria: 1 post não carregou (615 de 616 e 339 de 340), e a data do primeiro post pode ser anterior à registrada;
  - Bravo (@bravojogos): sem a data do primeiro post;
  - Ludus (@ludusluderia): sem o nº total de posts;
  - LudoCafé: confirmar o perfil do bar (coletado @ludocafe_editora; a triagem aponta @ludocafebh);
  - Dominaria: coletado @dominariacg.sp (unidade de São Paulo); a casa aprovada fica em Fortaleza (@dominariacg).
- **Entorno: recarregar o coletor 2026.10.30-1, refazer pendentes e exportar.** Recarregar o Maps (o carregador lê o script do disco), clicar em "Refazer pendentes" (as 6 casas de Curitiba, sem a busca "estação tubo", e as 5 casas com shopping de avaliações não lidas: Comdado, Ludoteca Sidequest, Asgard, Utopia e Covil, pela simulação sobre a coleta de 15/10) e exportar os 3 CSVs. Depois rodar `B1-b_resumo.py`: até lá ele deixa o porte em branco nas coletas antigas e corta a distância acima de 1000 m. Se quiser, "Apagar OSM antigo" no painel libera o espaço do navegador.
- **Fazer as auditorias.** As amostras estão em `_dados-brutos/<pasta>/auditoria/` (scripts `*-a_auditoria_*.py`, 15/10). Entorno: seguir `textos/instrumentos/roteiro_auditoria_entorno_B1.md`, só os itens do Maps (o OSM saiu do entorno em 30/10; a amostra de 15/10 e o roteiro ainda têm itens do OSM, que ficam de fora da taxa de erro). A amostra do B2 saiu da base do build de 14/10 (2.218 no recorte): rodar `B2-a_auditoria_avaliacoes.py` de novo depois de refazer o build com a triagem corrigida (a chave por `review_id` mantém as já sorteadas). Falta o script que lê as conferências e calcula a taxa de erro com o intervalo de Wilson.
- **Entorno: corrigir o que o parecer apontou** (`docs/parecer_entorno_B1.md` §5 e §7): `B1-b_resumo.py` escolher a coleta pela data do nome, não pela data de modificação. O filtro de 50 km deixou de importar: desde a versão 2026.10.30-1 a distância só sai até 1000 m.
- **Sumarização do B2.**

## Divergências entre documentos, ainda sem correção

- Divergências entre capítulos (e contra as instruções) ficam em `docs/melhorias-texto.md`, por gravidade (D01 a D18 em 15/10/2026).


- Sarpa (2016): capa com *Experiências de consumo com jogos de tabuleiro modernos*; resumo com *Boardgames: um estudo sobre a experiência de consumo*. Conferir no repositório da UFRJ.

- Damodaran: `_instrucoes/8_financeiro.md` cita *Avaliação de investimentos* (ed. brasileira); o roteiro e o checklist da P2 citam *Investment valuation* (Wiley). Definir a edição que será lida.

- Build do B2 aceita "fim da lista" como coleta completa, mas o userscript para em silêncio (Shelf e Bardo Mago, 14/10). Marcar "conferir" quando o volume lido ficar muito abaixo do volume do B1 ou a última avaliação lida for mais nova que "3 meses atrás".
- Triagem do B1 desatualizada: tirar Machado Games e Ilusões Industriais das aprovadas e decidir como entram Bardo Mago, La Tabuleria, TabuClub, Toca do Rato e Tubaleria (hoje só no Notion; fora da base do B2).
- Shelf Bar: poucas avaliações com rótulo "2 meses atrás" (19) e "3 meses atrás" (14) frente a "um mês" (113) e "4 meses" (110). Conferir no Maps se é real ou falha de carregamento.
- Userscript `maps_avaliacoes`: `texto_original` vem "não" nas avaliações traduzidas (6 casos).
- Notion "B - Comentários": as linhas digitadas à mão não têm "ID da avaliação"; depois das coletas de 14/10, 40 delas seguem sem par nas coletas (Magic Store 31, outras 1 cada), quase todas mais antigas que o recorte.

- Instagram: `@ludocafe_editora` coletado para o LudoCafé (triagem: `@ludocafebh`) e `@dominariacg.sp` para a Dominaria de Fortaleza (`@dominariacg`). Sete perfis (Bodogami, Fan Hour, Bravo, Covil, Shelf, Ludoteca BGC, Cartola) vieram do coletor antigo, sem seguidores nem período.

- Asgard: couvert/passaporte de sex-dom R$ 20 no status do Notion (15/10) e R$ 25 no cardápio do site (17/10). Conferir qual vale (registro de 17/10 17:44).

- `_instrucoes/1_estrutura.md` (3.5) fala em "metade exploratória e confirmatória", e o cronograma (semana 3) tem a tarefa "Divisão da base em parte exploratória e parte confirmatória"; a metodologia adotou a base única em 13/10.
- `_instrucoes/1_estrutura.md` (11.5) cita "sem o recorte do último mês"; o recorte vigente é de 3 meses.
- O cronograma ainda fala em "avaliações do último mês" (semana 2).

## Dúvidas

- **Cardápios, conferir à mão:** categorias de 13 casas atribuídas por regra de palavra-chave (`B1-b_cardapios_transcricoes.py`); Cartola só tem entradas, sobremesas e drinks exportados da Takeat; TabuClub baixado e não transcrito; preços de La Tabuleria e Toca do Rato são de delivery (Saipos).


- **Entorno no Maps, três primeiras extrações (14/10):** os CSVs estão em `dados/[B1] Estabelecimentos e cardapios/_dados-brutos/estabelecimentos/maps_entorno_*_2026-10-14*.csv` e não foram conferidos linha a linha; foram coletados antes da busca de trem. Recoletar os três estabelecimentos com a versão atual do coletor e conferir.
- Perguntas abertas para a literatura (validação de avaliações online como medida de visitas, estabilidade da razão avaliações ÷ visitantes, limiar de concordância para variáveis raras, peso de comida, serviço e ambiente, taxa de desconto de negócio pequeno, termos de uso do Google Maps): `docs/bibliografia/lacunas-bibliograficas.md` §6.
- Datas e horários das visitas: o roteiro de campo (`textos/instrumentos/roteiro_observacao_sao_jogue.md`) ainda marca 18h00 às 21h00 nas quatro visitas, e o cronograma (semana 4) chama a de 03/10 de "visita pré-teste". A primeira visita ao Bela Vista com dados no app foi no sábado, **10/10**, das 19h às 22h (não 03/10); o retorno em 18/10 fica a 8 dias, não 15. Confirmar a data da primeira visita à outra unidade e se o desenho (03/10, retorno 15 dias depois) muda em `_instrucoes/4_metodologia.md` e no cronograma.
- **Acervos de 17/10, conferir:** a listagem do Acervo de Jogos traz cópias com marcador ("#2", "COPIA 1") como títulos distintos (Balboa's: 1.833 nomes, contra ~250 títulos na contagem da cidade; Joyjoy: 1.010 contra 276); vale limpar os marcadores antes de comparar tamanho de acervo entre casas. Omniverse: só a parte do blog até a letra D (59). Ludus: PDF de 2020, pode estar defasado. Vila Celta: loja Rei das Cartinhas listada na página de Curitiba (246 títulos), mas o subdomínio redireciona; Taverna Game House: a loja "Taverna" do Acervo de Jogos tem outro telefone.
- **B3, visita de 10/10 ao Bela Vista:** só o POV1 vale. Faltam a NFC-e do início (sem ela, não há notas emitidas nem pessoas por nota na visita; a do fim, nº 77977, entra no intervalo até o retorno), o encerramento da visita no app (duração estimada), as contagens de mesas a cada 30 min, a acústica e os preços do cardápio. As 24 pessoas que estavam dentro na chegada não têm campo próprio no app: hoje viram correção de lançamento. Avaliar um campo "pessoas dentro no início" no app antes de 18/10.
- **B3, visita de 17/10 à Paralela (só o POV2, 19h10 às 21h38):** conferir com o observador (1) se as mesas 1, 2 e 5 (7 pessoas, lançadas às 19h10-19h11) já estavam dentro na chegada (estoque inicial) e se a entrada BV-1 (5 pessoas, 19h11) é o grupo da mesa 3; (2) se os dois registros de acústica de 19h41 (68 dB, idênticos) são um só; (3) se o grupo BV-2 (6 pessoas, "só olhou") e o BV-3 (2, balcão/loja) devem contar como pessoas que entraram, como hoje fazem no resumo (13 pessoas). Faltam a NFC-e do início, as contagens de mesas e o POV1. A nota 12200 cobre uma só mesa (2 taxas de entrada): a taxa de R$ 28,00 parece ser por pessoa e o acréscimo de 10% não incide sobre ela.
- **B3, visita de 16/10 ao Bela Vista (só o POV2, 19h31 às 22h00):** os 12 pedidos ficaram sem chegada registrada (sem espera); faltam as NFC-e, as contagens de mesas e a estrutura do acervo (estantes 0). A mesa 2 (1 adulto e 1 criança) e a 12 ficaram só 17 min: conferir se foram grupos de passagem.

## Ideias futuras


- Extensões fora do escopo atual (durações citadas nos textos, contagem em outra capital, recoleta do volume total, teste da porta falsa): `_instrucoes/4_metodologia.md`, "Extensões fora do escopo atual".
- Simulação de Monte Carlo e testes H1–H9, se sobrar tempo (apêndices L e M).
- Hipótese do público potencial, se não virar emenda (item 2).
- **Preço de venda nas lojas online das casas novas** (links salvos pelo autor em 17/10): Dungeon, Paladino, RED, Taverna, XPlace e Rei das Cartinhas/Vila Celta usam a Liga (já lida por `B1-c_lojas_venda.py`); Pitta's, Gruta e Tubaleria usam Nuvemshop; Paladins e Playeasy, plataforma a identificar. Hoje a venda só entra para as casas com cardápio (Dungeon e Playeasy passaram a ter).
- **B4 no Notion, tabelas longas:** se alguma série virar consulta frequente (população por bairro de Salvador, CAGED anual, FipeZap de Salvador, IPCA de alimentação fora do domicílio), levar ao Notion só o recorte de Salvador; hoje estão só nos CSVs.
- Alinhar os valores dos CSV já gerados às regras de `_src/dicionario.md` §4.2 (`sim`/`nao` no lugar de `0`/`1` e `True`/`False`, ponto decimal nas transcrições de cardápio, rótulos de categoria com `_`) quando o script de cada um for alterado; conferir antes que nenhum script leitor dependa do formato antigo.

9. **Cap. 5, lacunas do esboço:** (a) densidade de luderias por habitante: numerador pela capital da região metropolitana do endereço e denominador pelo município-sede; alinhar os recortes (população da RM) e gerar por script; (b) script para os números marcados `[script]` (PAS deflacionada pelo IPCA, receita por empresa, custos em % da receita, custo do acervo); (c) buscar Comex Stat (NCM 9504.90), dados abertos do CNPJ (CNAE 5611-2/05, sobrevivência), PNAD TIC da Bahia, legislação de Salvador sobre ruído e alvará e a fonte original do número do Sebrae; (d) renda por bairro do Censo 2022 para 5.2.1.

12. **Amostra de auditoria do Instagram com perfis fora do objeto.** O sorteio de 15/10 (`B1-a_auditoria_instagram.py`) incluiu 7 posts de @ilusoesindustriais (excluída do objeto por não ser luderia) e @coviljogos (sem página em "A - Estabelecimentos"); "A" também tem uma segunda página "Bodogami" sem Instagram e uma linha vazia. Decidir se o script filtra os perfis pelas casas do objeto e sorteia de novo, ou se esses 7 posts ficam como auditoria da coleta, fora das casas.

