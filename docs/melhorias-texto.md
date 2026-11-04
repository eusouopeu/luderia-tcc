# Melhorias do texto

Divergências entre capítulos (e contra as regras de `_instrucoes/`) e cortes possíveis, levantados a cada capítulo novo ou revisado. Regra em [CLAUDE.md](../CLAUDE.md), "Melhorias do texto". Item resolvido sai; listar não autoriza corrigir o capítulo sem pedido do autor.

Última análise: 04/11/2026, depois da nova equipe (5 empregados em escala 5x2 e o sócio no caixa), dos sanitários do B5 e das obrigações trabalhistas, de saúde e segurança e do consumidor no Quadro 8.1: caps. 4, 7, 8, 9, 10 e 11 revistos; D33 resolvido; D38 revisto; D64 e D65 novos. Anterior: 03/11/2026, TMin v21, depois da conclusão da codificação do B2 (grade de 22 temas; recodificação cega com kappa de 0,84) e da escrita do 6.1, 6.2, 6.5 e 6.6 (demanda vinda do cap. 9). Caps. 3, 4, 5, 6, 7, 9 e 11 revistos; D26, D27 e D47 resolvidos; D04, D54 e D57 revistos; D58 a D60 e C21 novos.

Formato de um item: **ID — título curto.** Onde (cap. e seção). O que diverge ou se repete. Sugestão. Nos cortes, o ganho estimado em palavras (350 palavras ≈ 1 página).

---

# Divergências

## Grave

**D49 — Marcadores pendentes a duas semanas da banca (02/11/2026).** TMin v17: os `[script]` e a correção pelo IPCA foram fechados. Restam 15 `[AV]` no texto corrido, `[pendente]` (9.2: sleeves; 9.5: triangulação com o cap. 6), `[Pendente: alimentos e bebidas...]` (5.3.2), `[figura: croqui do salão]` e `[figura: fluxograma da jornada do cliente]` (7.2 e 7.3), `[BUSCAR]` (8.2), `[resultado do kappa]` (11.2) e a proposta de valor entre colchetes no cap. 4. Sugestão: gerar ou cortar as duas figuras do cap. 7; deixar para o fim só o kappa e a proposta de valor.

**D45 — Páginas do TMin v10 (02/11/2026).** O TMin passou de 59 para 69 páginas: os quadros 10.5 e 10.6 e o Quadro 9.2 com 15 premissas. O cap. 10 já estava acima do teto (C17). Sugestão: levar o Quadro 10.6 ou o 10.5 para apêndice.

**D01 — Três escalas de confiança com os mesmos rótulos.** Cap. 5 (nota de abertura, 5.1.2, 5.1.3, 5.2.3, 5.4.2 e quadro "Fontes por nível de preferência") × cap. 2 (2.1) × `_instrucoes/1a_principios.md` (P1, P2) e `8_financeiro.md` (N1–N6). O cap. 5 usa uma ordem própria de fontes em 4 níveis (oficial → fundação → entidade setorial → imprensa), decidida em 15/10 (`decisoes.md`), que não bate com a P1 (7 níveis: legislação, artigos revisados, teses, relatórios oficiais e setoriais…). Além disso, mistura as escalas no texto: a POF é "N2" (escala N1–N6, correto), o Savills é "nível 3" (da ordem própria; na N1–N6 seria N4), o público do Meta Ads é "N5, rastros digitais" (rastro digital é o tipo 5 da P2; N5 é coleta primária comportamental própria) e a cotação é "N2 na hierarquia de dados" (tipo 2 da P2, não N2). O cap. 2 anuncia só a N1–N6 e a P2 para o cap. 3. A banca lê "N2" e "nível 2" como a mesma coisa. Sugestão: no texto, usar só a N1–N6 para dados e premissas; a ordem de fontes do cap. 5 vira a P1 (atualizar a instrução) ou sai do capítulo; o tipo de dado da P2 ganha rótulo próprio (ex.: "tipo 5").

## Média

**D64 — Domingo com um só instrutor (04/11/2026).** Cap. 7 (7.5: teto de 2 mesas por instrutor no pico e "3 pessoas no salão no pico") × escala do Quadro 7.2. No domingo em que o atendente folga, o salão tem uma atendente das 13h às 17h e, depois, ela e o sócio: teto de 4 mesas, abaixo das 6 do salão. A demanda provável ocupa 3,2 mesas no pico, mas a otimista passa do teto nesse domingo. Sugestão: declarar a exceção no 7.5 ou aceitar a folga do atendente num domingo em que a demanda for menor.

**D65 — Receita da Tabela 8.1 × modelo do cap. 9 (04/11/2026).** Cap. 8 (Tabela 8.1: receita bruta de R$ 661.655,03 no ano maduro) × cap. 9 (Tabela 9.3: R$ 916.823 a partir do ano 2). A Tabela 8.1 compara os regimes com a receita de uma versão anterior do modelo; só a linha da contribuição patronal foi refeita, com a nova folha. Sugestão: refazer a Tabela 8.1 com a receita e a folha do modelo atual, ou gerá-la pelo `gerar_modelo_financeiro.py`.

**D61 — Critério do B5 × coletas de 03/11 (03/11/2026).** Cap. 3 (3.2.4: "os cinco primeiros anúncios de cada busca, na ordem do site") × dados do cap. 9 (Tabela 9.1). As exportações de 03/11 01:11 não têm a posição na busca (o coletor ordenava por preço); o build usa, nelas, até 5 ofertas por site espaçadas na ordem de preço. O texto descreve o critério, e os números só o seguem depois da recoleta com o coletor 2026.11.03-8 (pendências, B5).

**D58 — Acervo mediano dos concorrentes: 468 × 322 títulos (03/11/2026).** Cap. 5 (5.3.2: mediana de 468 títulos nas 17 casas com acervo conhecido) × cap. 7 (7.4: ampliação até 322, "a mediana dos acervos do B1") e cap. 6 (Quadro 6.1: mediana de 322 nos 30 acervos publicados). São recortes diferentes do B1 (número declarado × lista publicada), sem a explicação no texto. Sugestão: usar um só recorte nos três capítulos ou dizer, no 5.3.2, de onde vem cada número.

**D59 — Site e pictogramas com o livro de códigos antigo (03/11/2026).** `_src/site-apresentacao` (`b2-conteudo.json`, `B2-a_conteudo_site.py`) e `B2-a_pictogramas.py` × caps. 5 e 6 e Apêndice F. O site e os pictogramas usam as tabelas `B2_bardin_*` (livro de 15/10, 1.588 avaliações), e o texto usa a grade de 22 temas (1.628 avaliações). Sugestão: refazer o site e os pictogramas com `B2_temas_*.csv` antes da defesa.

**D54 — Figura 6.2 com a base antiga do B2 (02/11/2026; Figura 6.1 até o TMin v20).** Cap. 6 (6.3, Figura 6.2: 602 declarações, 352 sem a Bodogami) × 6.3 e cap. 9 (675 declarações de 12 concorrentes, na base de 769 declarações com faixa de preço). Sugestão: regerar a Figura 6.2 com `B2_avaliacoes_periodo.csv` atual e citar as mesmas contagens nos dois parágrafos.

**D55 — "Consumo por pessoa" depois da nova cesta de consumo (02/11/2026).** Cap. 5 (Figura 5.3, "Consumo por pessoa (uma bebida e uma entrada ou prato)") × `_instrucoes/1b_escrita.md` (P6: cesta de consumo inclui a taxa de entrada, e "consumo por pessoa" não é sinônimo). Sugestão: renomear a figura para "Bebida mais entrada ou prato, mediana por metrópole".

**D56 — Gatilho G1 sem risco correspondente (02/11/2026).** Cap. 10 (Quadro 10.4, G1: pessoas por mesa abaixo de 3) × Quadro 10.2, que deixou de ter o risco de pessoas por mesa: no modelo novo, as pessoas por mesa só limitam o salão. Sugestão: tirar o G1 ou ligá-lo ao gasto por pessoa (grupos pequenos consomem menos por mesa).

**D51 — Cruzamento da SWOT só no texto (02/11/2026).** Cap. 2 (2.2: "O cruzamento dos quadrantes indica a estratégia") × cap. 10. O texto do 10.1 cruza os quadrantes (FO, DO e FA), mas o Quadro 10.1 mostra só os quatro quadrantes, com evidência que remete a seções, e falta o cruzamento de fraquezas com ameaças (DA). Sugestão: trocar a coluna "Evidência" por uma linha de estratégias cruzadas (FO, FA, DO e DA), ligada às etapas e aos gatilhos do 10.4.

**D52 — Quadro 3.2 atribui ao B2 usos que vêm de outros blocos (02/11/2026).** Cap. 3 (Quadro 3.2: B2 para "jogos citados") × caps. 7 e 9 (acervo pelos acervos do B1, I05). O tamanho do grupo do B2 saiu do quadro em 04/11/2026. O cap. 9 não cita o B2. Sugestão: deixar no B2 só proposta de valor e reclamações, como no Apêndice D.

**D15 — Fontes da gestão baseada em evidências (01/11/2026).** Cap. 2 (abertura), parágrafo original e o revisado em verde no TMin v9. O texto põe as quatro fontes de evidência em Figueiredo (2020, p. 31) e inclui "organizações comparáveis"; no artigo, a quarta fonte (valores das partes interessadas) está na p. 32 e não há menção a organizações comparáveis, só a dados da própria organização. Sugestão: citar p. 31–32 e tirar "ou de organizações comparáveis", junto com o corte de citações pedido no comentário 7.


- **Giro e taxa de ocupação no vocabulário (31/10/2026; revisto em 02/11/2026).** `_instrucoes/1b_escrita.md` (P6) mantém giro e taxa de ocupação, mas o modelo do cap. 9 deixou os dois de fora da receita: a demanda é a circulação no pico × horas de pico equivalentes, e o giro só confere o salão (cap. 3). Sugestão: no P6, marcar giro e taxa de ocupação como medidas de conferência, não de receita.
**D02 — Objetivos e seções da introdução fora da estrutura.** Cap. 1 (1.1) × `1_estrutura.md` (1.3). O cap. 1 tem 7 objetivos específicos; a instrução permite no máximo 6, um por decisão, cada um respondido em 11.2. Os itens (vi) e (vii) cabem em um só (o (vi) da proposta da instrução). As seções também divergem: o cap. 1 tem 1.1 Objetivos, 1.2 Justificativa e 1.3 Estrutura; a instrução prevê 1.1 Contextualização, 1.2 Problema e oportunidade, 1.3 Objetivos, 1.4 Justificativa e 1.5 Estrutura. Sugestão: fundir (vi) e (vii) e renumerar, ou ajustar a instrução.

**D03 — "Única luderia em operação" × "única no recorte".** Cap. 1 (contextualização) × cap. 5 (5.3.3, Tabela 5.1). O cap. 1 afirma que a São Jogue é a única luderia em operação em Salvador; o cap. 5 diz "única no recorte", com 13 resultados na busca, 7 acima de 100 avaliações e 1 aprovado na curadoria. A afirmação do cap. 1 é mais forte que o dado. Sugestão: "a única luderia de Salvador com mais de 100 avaliações no Google Maps (Bloco B1, 2026)". Em 31/10, o cap. 3 (3.3.3) também diz "única luderia de Salvador".

**D04 — Categorias da análise de conteúdo do B2 (revisto em 03/11/2026).** Cap. 2 (2.5) × caps. 3, 5 e 6. A grade final é a de 22 temas (cap. 3, Apêndice F), usada em 5.2 e 6.1. O cap. 2 ainda resume as categorias como comida, serviço, ambiente, acervo e preço e diz que a análise está na 6.2; ela está na 6.1 (temas) e na 6.2 (produto). Sugestão: no 2.5, remeter à grade do Apêndice F e às seções 5.2 e 6.1.

**D05 — PRC anunciada e aplicada pela metade.** Cap. 2 (2.2.2) × cap. 5 (5.2.2). O cap. 2 define a PRC pela comparação da nota de quem elogia, de quem critica e de quem não menciona o aspecto (penalidade e recompensa contra uma referência). O cap. 5.2.2 traz só a nota média das menções negativas (2,83 na mediação; 3,11 no preço), sem a referência nem as positivas. Lido isolado, parece que a classificação Kano já saiu. Sugestão: no cap. 5 dar as três notas (ou a diferença para a referência) ou dizer que a classificação fica para o cap. 6. Em 31/10, o cap. 3 (3.5.1) define a PRC como a nota média com e sem crítica a cada tema, sem o grupo de quem elogia; alinhar com a definição do cap. 2.

**D07 — Bares: rival ou substituto?** Cap. 2 (2.2) × cap. 5 (Quadro 5.2). O cap. 2 põe bares e restaurantes entre os substitutos. O Quadro 5.2 põe o "bar comum" na rivalidade ("alta no bar comum") e de novo nos substitutos. A mesma unidade em duas forças contraria a lógica de um grupo por unidade. Sugestão: decidir uma posição (ex.: bar com jogo ou quiz = rival; bar comum = substituto) e usá-la nos dois capítulos.

**D08 — "Principal custo fixo" sem dado e contra o próprio capítulo.** Cap. 5 (5.5, campo econômico × 5.1.1). A 5.5 afirma que o aluguel é o principal custo fixo da luderia; o 5.1.1 mostra, na PAS 2024, pessoal em 25,1% e aluguel em 4,0% da receita da alimentação. Sugestão: tirar "principal" ou sustentar com cotação (N1) e FipeZAP; a frase orienta a sensibilidade do cap. 9.

**D09 — Fonte do IPCA.** Cap. 2 (2.6) × cap. 5 (5.5.1). O cap. 2 diz que a TMA parte "da Selic e do IPCA divulgados pelo Banco Central"; o IPCA é do IBGE (o BCB divulga a expectativa, no Focus), como o cap. 5 cita. Sugestão: "da Selic (BCB) e do IPCA (IBGE), com as expectativas do Focus".

**D10 — Sebrae (R$ 53 bilhões) firme no cap. 1, sob suspeita no cap. 5.** Cap. 1 (contextualização) × cap. 5 (5.1.2). O cap. 1 abre o trabalho com o número sem ressalva; o cap. 5 o marca `[BUSCAR a fonte original]` e propõe cortá-lo se não houver. Sugestão: tratar igual nos dois; se a fonte original não aparecer, sai dos dois.

**D11 — Referência de Asakura, Silva e Mello com título diferente.** Cap. 1 × cap. 2 (referências). O cap. 1 dá "…boardgame café em Ourinhos/SP", sem prenomes; o cap. 2, "…boardgame café no município de Ourinhos/SP", com iniciais. Sugestão: conferir no PDF e usar uma só forma.

**D12 — Contagens do cap. 5 diferentes das do AGORA.** Cap. 5 × `AGORA.md` (15/10). Cardápio coletado: 26 casas no 5.3.4, 27 no AGORA. B2: "1.588 avaliações de 53 casas" no 5.2.2, contra 54 casas no objeto do B1 (5.3.1). Instagram: "49 luderias com perfil coletado" no 5.5.4, contra 18 casas parciais ou sem coleta no Notion. Sugestão: tirar os números dos arquivos de `dados/` na hora de revisar e dizer qual casa falta e por quê (a soma deve fechar com 54).

**D19 — Proporção de mercadorias da PAS em dois anos.** Cap. 5 (5.1.1) × cap. 9 (9.2). O cap. 5 dá 26,8% da receita líquida para mercadorias e materiais (PAS 2024, tabela 10758) e diz que o número entra no cap. 9; o cap. 9 usa 29,6% (PAS 2023, tabela 2613, a base que está no B4) para o CMV provável de 30%. Sugestão: baixar a PAS 2024 para o B4 e usar o mesmo ano nos dois capítulos.

**D20 — Ocupação de dia útil em N6 entre as premissas críticas.** Cap. 9 (9.2 e 9.7) × `8_financeiro.md` (§2, regra de robustez). A taxa de ocupação de dia útil é a 4ª do tornado e só tem estimativa do autor. A regra admite isso com faixa larga e destaque no cap. 10, que ainda não existe. Sugestão: buscar fonte N3 (curva de horários de pico do Google Maps das luderias do B1) ou manter e levar ao cap. 10.

**D32 — Ruído e horário: nenhum capítulo trata.** Cap. 5 (5.5, campo legal) × cap. 8 (Quadro 8.1). A reforma tributária já está no 8.1, e a PESTEL agora a resume no campo político. A regulação municipal de ruído e horário noturno segue `[BUSCAR]` na 5.5 e sem linha no Quadro 8.1. Sugestão: buscar a norma de Salvador e pôr uma linha no Quadro 8.1, ou tirar a menção da 5.5.

**D48 — Referência do Sebrae (02/11/2026).** Cap. 1 ("SEBRAE, 2026") × fonte. A referência "Jogos de tabuleiro movimentaram R$ 53 bilhões em 2024. Agência de Notícias do Sebrae, 2026" tem o título de uma matéria do Estado de Minas (jul. 2026); a matéria da Agência Sebrae com o número ("Mercado de jogos de tabuleiro avança no Brasil, apesar dos grandes desafios") traz data de 24 maio 2023, e o valor é da Statista, para o mercado mundial. Sugestão: citar a matéria da Agência Sebrae (ou a Statista) com o título e a data reais, e o link.

**D38 — Números que mudam entre capítulos (02/11/2026).** 7.5 (48 pessoas por dia) × 4.5, 7.2 e 9.4 (51); 5.3.3 e 6.3 ("22 dos 53") × B1 com 54; 5.3.3 (taxa de R$ 5,00 a R$ 40,00) × Tabela 6.1 (Encounter a R$ 45,00); aluguel pessimista de R$ 64,36 (6.4) × R$ 64,35 (Quadro 9.2); "15 dos 22" que diferenciam o preço (6.3) × 16 na Tabela 6.1 (17 com a BoardZ, que não cobra entrada), que tem 24 linhas. Sugestão: tirar todos do modelo do cap. 9 e do B1 regerados.

**D42 — Taxa da São Jogue fora da média do modelo (02/11/2026).** O B1 (aba cesta) marca a taxa da São Jogue como "não encontrada", embora a Tabela 6.1 e a NFC-e do B3 a tragam (R$ 22,00 e R$ 28,00). A média de R$ 18,68 (caps. 4, 6, 9 e 11) não inclui a única casa de Salvador, e as 22 casas da média não são as 22 da Tabela 6.1. A Ludus tem taxa zero na Tabela 6.1 e couvert de R$ 34,00/44,00 numa fonte secundária de 2024. Sugestão: corrigir o B1 e regerar a média e o modelo.

## Aceitável

**D62 — Mattar sem edição e ano (03/11/2026).** Cap. 3 (3.1 e 3.3) e referências. Os slides de Mattar na pasta não trazem a edição; a citação está como (MATTAR, [AV ano], cap. 5 e 6). Conferir a edição do v. 1 (Atlas) e trocar o marcador pelo ano.

**D63 — Pfeffer e Sutton sem página (03/11/2026).** Cap. 2 (2.5). A gestão baseada em evidências passou de Figueiredo (2020) para Pfeffer e Sutton (2006), livro fora da pasta e sem PDF legal localizado; as duas citações ficam `[AV]` até o autor conferir as páginas.

**D62 — BDI e TCU sem sigla no Apêndice E (03/11/2026).** A fonte da I01 no Apêndice E (vinda de `gerar_modelo_financeiro.py`) usa "BDI" e "TCU", que o texto principal escreve por extenso e a lista de siglas não traz.

**D60 — Grade ERRC sem base no cap. 2 (03/11/2026).** Cap. 6 (6.1, Quadro 6.1, KIM; MAUBORGNE, 2005 [AV]) × cap. 2. A grade ERRC entra no 6.1, como pede `_instrucoes/5_marketing.md`, mas o cap. 2 não a apresenta, e a obra está sem conferência. Sugestão: uma frase no 2.2 ou no 2.3, ou manter só a citação no 6.1 e conferir a obra.

**D57 — Taxa adotada × taxa contida no gasto (02/11/2026; revisto em 03/11/2026).** Cap. 6 (6.3: taxa de R$ 18,68, média dos 22 que cobram) × cap. 9 (9.6: R$ 19,83, 24,7% do gasto de R$ 80,14, R07). Em 03/11, a frase do 6.3 que declarava a diferença (6%) saiu no corte do capítulo; só o 9.6 compara as duas. Sugestão: manter, ou fixar o preço adotado em R$ 19,83 para o texto e o modelo coincidirem.

**D37 — Erros de digitação no cap. 1 (02/11/2026).** §2 da introdução: "São Paul" (São Paulo).

**D14 — Formatação de referências repetidas.** Caps. 1, 2 e 5. Sebrae: "Agência de Notícias do Sebrae" (cap. 1) × "Agência Sebrae de Notícias" (cap. 5). Abrinq sem local no cap. 1 e com local no cap. 5. Resolve-se na lista única de referências.

**D15 — Travessão e linha de fonte.** O cap. 1 usa hífen com espaços ( - ) como travessão; os caps. 2 e 5 usam travessão (—). O cap. 2 escreve "Fonte: elaborado pelo autor."; o cap. 5, "Fonte: elaborado pelo próprio autor com base em…". Padronizar na revisão de forma.

**D16 — Couvert lúdico tratado como dado.** Cap. 2 (2.4, Quadro 1) × cap. 5 (5.3.4). O cap. 2 fala na "definição do couvert lúdico" como se o plano fosse cobrá-lo; o cap. 5 mostra couvert em 22 dos 53 concorrentes, sem dado em 31. Não é contradição, mas o cap. 2 pode dizer "a cobrança ou não de couvert lúdico".

**D17 — Mercado&Consumo como sustentação.** Cap. 1 (contextualização). Dado de shopping (1,4% → 2,2% das lojas) vem de imprensa (P1, nível 6), que pela P1 não sustenta argumento. Já marcado para troca pela Abrasce.

**D18 — Triangulação anunciada sem base teórica.** Cap. 1 (1.2) cita "triangulação" como teste das premissas; o cap. 2 não trata do conceito. Pode ficar só para o cap. 3 (metodologia).

---

**D21 — Árvore de direcionadores como quadro.** Cap. 9 (9.1) × `8_financeiro.md` (§1, "a árvore aparece como figura"). O rascunho usa o Quadro 9.1. Trocar por figura na revisão de forma, se couber no teto.

**D25 — Normas estaduais e municipais sem conferência.** Cap. 8 (Tabela 8.1 e Quadro 8.1) × `6_juridico.md` ("toda informação legal deve citar a norma e ter a vigência conferida"). LOUOS de Salvador, Lei estadual 12.929/2013 (bombeiros), RICMS-BA, ICMS de 4% sobre o A&B, ISS de 5% e contribuição patronal de 27,8% estão `[AV]`. A conclusão (Simples mais barato) não muda com eles: a diferença é de R$ 103 mil por ano.

# Cortes em potencial

Aplicados no TMin v1 (31/10/2026, hoje `textos/capitulos/_md/`): C03, C05, C06, C07, C08, C09, C11, C12, C13 (CNAE no cap. 5), C13 (capacidade no cap. 9), C14, C15 e C16. Seguem valendo para o TMax; C01, C02, C04, C10 e C17 (caps. 1 e 10) não foram aplicados em nenhuma versão.

## Alto ganho

**C21 — Cap. 6 acima do teto (03/11/2026).** No TMin v21, o cap. 6 tem 10 páginas, contra o teto de 8, depois da entrada do 6.1, 6.2, 6.5 e 6.6 (a demanda saiu do cap. 9, que caiu de 14 para 13 páginas). Candidatos: a Tabela 6.1 (24 concorrentes, ~0,9 página) para o apêndice, com a mediana e a São Jogue no texto; o 6.2 só com as decisões, remetendo ao 7.3 e ao 7.4 (~150 palavras); a Tabela 6.3, se o texto do 6.6 trouxer as três faixas (~0,5 página). Ganho: ~2 páginas.

**C01 — Contexto do mercado duplicado entre os caps. 1 e 5.** Abrinq (9,1% → 13,1%, alta de 16%), Sebrae (R$ 53 bilhões) aparecem com o mesmo texto no cap. 1 e no 5.1.2. Manter no 5.1.2, com fonte e nível, e deixar no cap. 1 uma frase com remissão. Ganho: ~90 palavras.

**C02 — Justificativa acadêmica repete a contextualização.** Cap. 1: "O único estudo de viabilidade identificado… (ASAKURA; SILVA; MELLO, 2018)" aparece duas vezes com a mesma redação (contextualização e 1.2), e "não há levantamento setorial" volta no 1.2 e no 5.1.4. O cap. 2 (2.6) cita o mesmo estudo com mais detalhe. Manter a menção do cap. 2 e uma só no cap. 1. Ganho: ~70 palavras.

## Médio ganho

**C18 — Aberturas de capítulo que descrevem o capítulo (01/11/2026).** Caps. 4, 5, 7, 9 e 11 abrem com "O capítulo parte de…", "As seções apresentam…", repetindo o 1.3. Sugestão: abrir com a tese ou o resultado do capítulo em uma frase (ex.: cap. 9, "O negócio não é viável nas premissas prováveis; esta seção mostra de onde vem o número") e cortar o roteiro das seções. Ganho: cerca de 250 palavras.

**C19 — Siglas internas na prosa (01/11/2026).** B1 a B4 aparecem cerca de 95 vezes e N1 a N6 cerca de 55, inclusive nos caps. 4 e 11, que a banca lê isolados. Sugestão: nome por extenso na primeira menção de cada capítulo ("a contagem direta na São Jogue (B3)") e nenhuma sigla nos caps. 4 e 11; nas tabelas, as siglas ficam.


**C17 — Cap. 10 acima do teto.** No TMin v15, o cap. 10 tem a SWOT e três quadros (riscos, etapas e gatilhos), perto de 5 páginas contra o teto de 4; os indicadores e a ruptura saíram para as Tabelas 9.5 e 9.6. Sugestão: levar o Quadro 10.3 (etapas de expansão) para apêndice. Ganho: cerca de meia página.


**C05 — Linha "Fonte: elaborado pelo próprio autor…" no meio da prosa.** Cap. 5: seis parágrafos terminam com a linha de fonte (5.2.2, 5.3.1 a 5.3.4, 5.4.1, 5.5.4), formato de tabela e figura na ABNT. Na prosa, basta a citação entre parênteses: "(Bloco B1, 2026)". Ganho: ~90 palavras.

**C06 — Nota de abertura e quadro de fontes do cap. 5.** São material de trabalho (ordem de exposição, legenda das marcas, situação de coleta) e repetem a P1 com outra numeração (D01). Saem na versão para a banca; o que for método vai para o cap. 3. Ganho: ~250 palavras.

**C07 — Prática de mercado dos indicadores (cap. 2, 2.6).** Os percentuais de Frezatti et al. (54% VPL, 38% TIR) e o uso do payback simples não mudam decisão do plano; o que importa é a crítica ao estudo de Ourinhos (sem sensibilidade). Reduzir o parágrafo a duas frases. Ganho: ~60 palavras.

**C15 — Matriz de evidências no corpo do cap. 3 (3.6).** O cap. 3 fecha em cerca de 10,2 páginas, acima do teto de 10. A matriz (Quadro 3.5, meia página) pode ir para apêndice, com uma frase no 3.6, como a P4.2 permite. Ganho: cerca de 175 palavras.

## Baixo ganho

**C20 — *Competitive socialising* definido duas vezes (01/11/2026; decidido em 02/11).** Cap. 1 (parágrafo revisado com "*") e cap. 2 (2.1, parágrafo com "*", com a definição completa; antes na 2.2). O autor decidiu que a definição fica no cap. 2: sai da introdução quando o início do cap. 1 for reescrito, depois dos caps. 2 e 3. Ganho: cerca de 40 palavras.

**C13 — Estrutura das unidades da São Jogue repetida (cap. 9, 9.2 e 9.8).** Mesas, assentos e turnos do site de reservas aparecem nas premissas e de novo na checagem de capacidade; quando o cap. 3 descrever o B3, os dois trechos viram remissão. Ganho: ~40 palavras.

**C14 — Carga do Simples dita duas vezes (caps. 8 e 9).** O 8.1 e o 9.4 repetem as alíquotas de 8,1% e 11,9%; no 9.4 basta remeter ao 8.1. Ganho: ~40 palavras.

**C16 — Consumo nas NFC-e da São Jogue em dois capítulos (6.3 e 9.2).** O gasto de R$ 23,91 por pessoa e o cardápio da São Jogue aparecem nos dois; no 9.2 basta remeter ao 6.3. Ganho: ~50 palavras.

**C10 — Estrutura do relatório (cap. 1, 1.3).** Os parágrafos repetem o sumário e o Quadro 1 do cap. 2 (que já liga cada conceito ao capítulo). Uma frase por capítulo basta. Ganho: ~80 palavras.

**C12 — Detalhes que não mudam decisão no cap. 5.** Queda de 21,2% em 2020 (5.1.1) e expectativa do PIB (5.5.1). Ganho: ~25 palavras.

**C13 — CNAE explicado no cap. 5 e no cap. 8.** Cap. 5 (5.1, luderia sem código próprio, 5611-2/05 ou 5611-2/01) repete o 8.1, que já escolhe a 5611-2/05. Sugestão: no cap. 5, só remeter ao 8.1. Ganho: ~30 palavras.
