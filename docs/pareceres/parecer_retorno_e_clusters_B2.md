# B2: o que acompanha a decisão de voltar e o conteúdo das avaliações por grupo de preço

Parecer de 03/11/2026, a pedido do autor. Script: `_src/[B2] Avaliacoes recentes/Google Places (Comentários)/analise/B2-a_retorno_e_clusters.py`. Tabelas: `dados/B2_avaliacoes/_dados-agregados/retorno_e_clusters/`. Base: as 1.628 avaliações do B2 codificadas na grade de 22 temas (Notion, 03/11/2026).

## Resumo para o plano

1. **O atendimento presencial decide o retorno.** Ele aparece criticado em 17 das 20 avaliações de quem diz que não volta e em 4 das 144 de quem diz que volta. Quem critica e ainda assim volta elogia o atendimento; quem critica e não volta critica o atendimento e a comida. O ambiente não rompe a relação: a nota de ambiente de quem não volta fica em 3,4, contra 1,7 de serviço.
2. **O preço da casa muda o que se elogia, não a nota.** Os três grupos de casas têm nota média entre 4,68 e 4,75. Casas de consumo barato são elogiadas pelo atendimento, pelo acervo e pelo preço da entrada; casas de cardápio caro (restaurante com jogos) são menos elogiadas pelo acervo.
3. **Quem gasta mais exige mais.** A nota cai de 4,82 no gasto baixo para 4,35 no gasto alto, e a crítica ao atendimento sobe de 2% para 12% das avaliações. A crítica à taxa de entrada cresce junto (de 1% para 8%).
4. **A São Jogue é a entrada mais cara por hora da amostra** (R$ 8,19, pelo turno de 3 h), porque as outras cobram o dia inteiro. Isso pesa na escolha do modelo de cobrança do plano (turno ou passe do dia).

Decisões que esses achados sustentam: treinamento e escala dos instrutores como item de retenção (cap. 7), regras da casa escritas e comunicadas na chegada (crítica a regras em 5 das 20 avaliações de quem não volta) e taxa de entrada apresentada como parte do valor, sobretudo para o cliente de ticket alto (cap. 6, preço).

## 1. Volta ou não volta

Unidade: avaliação que diz se o cliente volta (campo "Voltará" da grade 2): 144 "volta" e 20 "não volta", 10% das 1.628. Teste exato de Fisher por tema e polaridade, razão de chances com correção de Haldane e q de Benjamini-Hochberg dentro de cada comparação.

**Quadro A - Temas que mais separam quem volta de quem não volta**

| Tema citado | Volta (n = 144) | Não volta (n = 20) | q |
|---|---|---|---|
| Atendimento presencial, elogio | 69% | 10% | < 0,001 |
| Atendimento presencial, crítica | 3% | 85% | < 0,001 |
| Comida, crítica | 1% | 50% | < 0,001 |
| Regras da casa, crítica | 1% | 25% | 0,003 |
| Preço da entrada, crítica | 0% | 15% | 0,013 |
| Limpeza, crítica | 1% | 15% | 0,040 |
| Preço do cardápio, crítica | 3% | 20% | 0,049 |

Fonte: elaborado pelo próprio autor com base no B2 (Google Maps, avaliações até "3 meses atrás", coleta de 13/10 a 02/11/2026). Tabela completa: `B2_retorno_temas.csv`, comparação a.

**Quem critica e volta mesmo assim (comparação b).** Das 144 avaliações "volta", 15 trazem alguma crítica. Contra as 20 "não volta" (todas com crítica), elas criticam menos o atendimento (27% contra 85%) e a comida (7% contra 50%) e mais a variedade do cardápio (5 de 15, contra nenhuma) e o barulho (4 de 15). Todas elogiam algo, sobretudo atendimento (53%), ambiente, comida e limpeza. Leitura: crítica a sortimento e conforto convive com o retorno; crítica a atendimento e comida, não.

**Nota baixa sem decisão dita (comparação c).** Entre as notas 1 e 2, quem declara que nunca volta critica mais o atendimento (85% contra 51% das outras 94 notas baixas; p = 0,006), mas a diferença não resiste à correção para 22 temas (q = 0,21). Não há outro tema que distinga a ruptura declarada da simples insatisfação.

**Notas de aspecto (resumo por decisão).** Quem não volta dá, em média, 1,7 ao serviço, 2,3 à comida e 3,4 ao ambiente (13 avaliações com as três notas). Quem volta dá de 4,8 a 4,9 aos três.

Limites: 20 avaliações "não volta" é pouco; o teste ordena temas, não mede o tamanho do efeito. Todas as "não volta" têm nota 1 ou 2, então a comparação a mistura "o que leva a não voltar" com "o que acompanha uma nota baixa"; a comparação b é a que isola melhor o efeito do tema. A decisão é declarada pelo próprio cliente, sem acompanhamento posterior.

## 2. Casas agrupadas por preço

**Variáveis (uma linha por casa, padronizadas):**
- taxa de entrada por hora: em cada dia aberto, a taxa do dia dividida pelas horas que ela cobre (o dia inteiro de funcionamento, para quem cobra por dia; 3 h na São Jogue, que cobra por turno), com média dos dias abertos;
- consumo por pessoa: bebida mediana mais entrada ou prato mediano do cardápio do B1, só com os dois itens encontrados.

A cesta completa (consumo mais taxa média do dia) fica como coluna descritiva, fora do agrupamento, para a taxa não contar duas vezes. Entram 23 casas com taxa conhecida (cardápio do B1 ou, na falta, fonte secundária do B1) e consumo completo, com 1.233 avaliações. Taxa não encontrada não vira zero; "sem cobrança" só vale onde a fonte diz (Ludus, pelo site, e Castelos, pelo QuintoAndar). K-means com k de 2 a 5: a maior silhueta média foi a de k = 3 (0,42).

**Quadro B - Grupos de casas por preço**

| Grupo | Casas | Avaliações | Taxa por hora (média) | Consumo por pessoa (média) | Cesta completa (média) | Nota média |
|---|---|---|---|---|---|---|
| 1, consumo barato | 12 | 284 | R$ 2,29 | R$ 44 | R$ 62 | 4,68 |
| 2, consumo caro | 9 | 882 | R$ 1,92 | R$ 70 | R$ 85 | 4,69 |
| 3, taxa por hora alta | 2 | 67 | R$ 6,76 | R$ 58 | R$ 90 | 4,75 |

Fonte: elaborado pelo próprio autor com base no B1 (cardápios e taxas) e no B2. Casas de cada grupo em `B2_cluster_casas_resumo.csv`.

- Grupo 1: Bardo Mago, Luderia Carioca, Ludoteca Sidequest, BoardZ, Ludoteca BGC, Arena BG, Place Games, Nala Land, La Tabuleria, Covil, Café Geek e Asgard (Bardo Mago com 35% das avaliações do grupo).
- Grupo 2: Bodogami, Shelf, Fan Hour, Castelos, Ludus, TabuClub, Toca do Rato, Comdado e LudoCafé. A Bodogami tem 51% das avaliações do grupo.
- Grupo 3: Encounter (R$ 5,33 por hora) e São Jogue (R$ 8,19). A Encounter tem 94% das avaliações do grupo, e o conteúdo do grupo é, na prática, o dela.

**Conteúdo por grupo (qui-quadrado grupo × tema, q de Benjamini-Hochberg).**
- Variedade do acervo é o tema que mais separa os grupos (q < 0,001): elogiada em 27% das avaliações do grupo 1, 14% do grupo 2 e 34% do grupo 3. As casas de cardápio caro são lembradas menos pelos jogos.
- Atendimento presencial, elogio: 59%, 51% e 37% (q = 0,03).
- Preço da entrada, elogio: 3,5% no grupo 1 e quase nenhum nos outros (q < 0,001), embora o grupo 2 tenha as duas casas sem cobrança.
- Comida, elogio: cerca de 33% nos grupos 1 e 2 e 51% no 3 (q = 0,07).
- Regras da casa, crítica: 6% nos grupos 1 e 3, 2% no 2 (q = 0,006).

**Quadro B2 - Distribuição interna das menções em cada grupo de casas (% do total de menções do grupo)**

| Elogios | Grupo 1, consumo barato (657 menções) | Grupo 2, consumo caro (1.524) | Grupo 3, taxa por hora alta (147) |
|---|---|---|---|
| Atendimento presencial | **25%** | **30%** | **17%** |
| Comida | **14%** | **19%** | **23%** |
| Ambiente e decoração | **13%** | **14%** | **11%** |
| Variedade do acervo | **12%** | **8%** | **16%** |
| Explicação de jogos | **8%** | **8%** | **9%** |
| Demais 17 temas | 28% | 22% | 25% |

| Críticas | Grupo 1 (95 menções) | Grupo 2 (279) | Grupo 3 (19) |
|---|---|---|---|
| Atendimento presencial | **22%** | **14%** | **16%** |
| Regras da casa | **18%** | 6% | **21%** |
| Comida | **5%** | **16%** | 5% |
| Preço do cardápio | **10%** | **10%** | 5% |
| Rapidez do serviço | 4% | **8%** | **10%** |
| Explicação de jogos | **5%** | 4% | **10%** |
| Espaço e lotação | **8%** | 5% | 5% |
| Conforto e barulho | **5%** | **8%** | 5% |
| Demais 14 temas | 21% | 28% | 21% |

Fonte: elaborado pelo próprio autor com base no B2. Unidade: menção (avaliação × tema); cada coluna soma 100%. Em negrito, os cinco temas mais mencionados de cada grupo, com empates, desde que tenham 2 menções ou mais (no grupo 3, as críticas empatam em 1 menção a partir do 5º tema). Tabela completa em `B2_cluster_casas_distribuicao.csv`.

Nos elogios, os três grupos têm os mesmos cinco temas no topo. O grupo 3, que na prática é a Encounter, elogia mais a comida e o acervo do que o atendimento. Nas críticas, as casas de consumo barato concentram a reclamação em atendimento (22%) e regras da casa (18%). Nas de consumo caro, a comida passa a ser a primeira crítica (16%), à frente do atendimento (14%): quem paga mais pelo cardápio cobra mais da comida. O grupo 3 tem 19 menções de crítica e fica como registro.

Leitura para o plano: o preço não muda a nota nem a proporção de quem diz que não volta (3, 8 e 0 avaliações nos três grupos); muda o eixo da proposta de valor. A luderia de consumo barato compete por acervo, atendimento e preço da entrada; a de cardápio caro, por comida e ambiente.

Limites: a taxa por hora de quem cobra o dia inteiro supõe que o cliente usa todo o horário; como a permanência é menor, ela subestima o que se paga por hora de uso, e a distância da São Jogue para as outras fica exagerada. O grupo 3 tem duas casas. Teste de qui-quadrado com células de contagem esperada abaixo de 5 em temas raros.

## 3. Clientes agrupados pelo gasto declarado

Variável: o "preço por pessoa" do Google Maps, pelo ponto médio da faixa (R$ 80–100 vira R$ 90; "+R$ 200" vira R$ 200, o limite inferior). Avaliação sem faixa fica de fora: 608 das 1.628. Como o gasto vem em poucas faixas, a silhueta em uma dimensão só cresce com k (0,61 com 2 grupos e 0,71 com 5); fixou-se k = 3 (silhueta de 0,64, menor grupo com 60 avaliações).

**Quadro C - Grupos de clientes pelo gasto declarado**

| Grupo | Avaliações | Gasto declarado | Nota média | Nota 1 ou 2 | Com alguma crítica |
|---|---|---|---|---|---|
| Gasto baixo | 281 | até R$ 70 (média R$ 55) | 4,82 | 3% | 14% |
| Gasto médio | 267 | R$ 90 a R$ 130 (média R$ 104) | 4,54 | 8% | 28% |
| Gasto alto | 60 | R$ 150 a R$ 200 (média R$ 174) | 4,35 | 15% | 25% |

Fonte: elaborado pelo próprio autor com base no B2.

Temas que mudam entre os grupos (q < 0,05):
- crítica ao atendimento presencial: 2%, 7% e 12%;
- crítica ao preço da entrada: 1%, 4% e 8%;
- elogio à rapidez do serviço: 0,4%, 3% e 7%;
- elogio ao ambiente e decoração: 32%, 31% e 12%;
- elogio à explicação de jogos: 10%, 20% e 15%;
- crítica às regras da casa: 1%, 6% e nenhuma.

**Quadro C2 - Distribuição interna das menções em cada grupo de gasto (% do total de menções do grupo)**

| Elogios | Baixo (570 menções) | Médio (560) | Alto (108) |
|---|---|---|---|
| Atendimento presencial | **26%** | **25%** | **23%** |
| Comida | **19%** | **18%** | **23%** |
| Ambiente e decoração | **16%** | **15%** | **6%** |
| Variedade do acervo | **10%** | **8%** | **8%** |
| Explicação de jogos | **5%** | **9%** | **8%** |
| Demais 17 temas | 24% | 25% | 31% |

| Críticas | Baixo (60 menções) | Médio (160) | Alto (38) |
|---|---|---|---|
| Comida | **23%** | **11%** | **18%** |
| Preço do cardápio | **15%** | **12%** | **13%** |
| Atendimento presencial | **8%** | **11%** | **18%** |
| Conforto e barulho | **10%** | **11%** | **10%** |
| Preço da entrada | 5% | 6% | **13%** |
| Rapidez do serviço | **10%** | 6% | 3% |
| Regras da casa | 5% | **9%** | 0% |
| Demais 15 temas | 23% | 34% | 24% |

Fonte: elaborado pelo próprio autor com base no B2. Unidade: menção (avaliação × tema). Cada coluna soma 100%. Linhas: os cinco temas mais mencionados de cada grupo, em negrito no próprio grupo. Nos elogios, os cinco são os mesmos nos três grupos; nas críticas, a união dá 7 temas. Tabela completa em `B2_cluster_clientes_distribuicao.csv`.

Dentro de cada grupo, atendimento e comida dominam os elogios em todas as faixas. O que muda é o peso do ambiente, que cai de 16% para 6% dos elogios no gasto alto. Nas críticas, o cliente de gasto baixo reclama sobretudo da comida e do preço do cardápio. O de gasto alto divide a crítica entre comida, atendimento e preço (cardápio e entrada). Com 38 e 60 menções de crítica, as diferenças nos grupos alto e baixo valem como direção, não como medida.

**Quadro C3 - Elogios de quem diz que volta, por grupo de gasto (% das menções de elogio do grupo)**

| Elogios de quem volta | Baixo (34 avaliações, 78 menções) | Médio (22; 64) | Alto (11; 29) |
|---|---|---|---|
| Atendimento presencial | **31%** | **25%** | **24%** |
| Ambiente e decoração | **15%** | **14%** | **17%** |
| Comida | **15%** | **8%** | **14%** |
| Explicação de jogos | **9%** | **11%** | **7%** |
| Variedade do acervo | **8%** | 6% | **7%** |
| Comemorações e grupos | 0% | **8%** | **7%** |
| Bebidas | 3% | 3% | **7%** |
| Rapidez do serviço | 0% | 5% | **7%** |
| Demais 14 temas | 20% | 21% | 10% |

**Quadro C4 - Críticas de quem diz que não volta, por grupo de gasto (menções)**

| Críticas de quem não volta | Baixo (1 avaliação) | Médio (5) | Alto (1) |
|---|---|---|---|
| Atendimento presencial | **1** | **3** | **1** |
| Comida | 0 | **4** | 0 |
| Preço do cardápio | 0 | **3** | 0 |
| Preço da entrada | 0 | **2** | **1** |
| Regras da casa | 0 | **2** | 0 |
| Porções | 0 | 1 | **1** |
| Rapidez do serviço | 0 | 0 | **1** |
| Demais temas | 0 | 6 | 0 |

Fonte: elaborado pelo próprio autor com base no B2. Em negrito, os cinco temas mais mencionados de cada grupo, com empates. Só entram as avaliações com gasto declarado e decisão dita: 67 das 144 "volta" e 7 das 20 "não volta". Tabela completa em `B2_cluster_clientes_distribuicao_por_decisao.csv`.

Entre quem volta, o atendimento lidera os elogios nos três grupos, com cerca de um quarto a um terço das menções, seguido de ambiente e comida. No gasto médio e no alto, aparecem comemorações e grupos. No gasto alto, aparecem também bebidas e rapidez: quem gasta mais e volta elogia o serviço da ocasião, não só a casa. O Quadro C4 tem 7 avaliações, poucas para comparar grupos, e serve só de registro. Entre as 20 avaliações "não volta" (seção 1, sem filtro de gasto), a crítica ao atendimento aparece em 17 e a crítica à comida em 10.

**Quadro C5 - Robustez: elogios com dois grupos de gasto (k = 2, % das menções de elogio do grupo)**

| Elogios | Todas, gasto baixo (até R$ 90; 406 avaliações) | Todas, gasto alto (R$ 110 a R$ 200; 202) | Quem volta, gasto baixo (44) | Quem volta, gasto alto (23) |
|---|---|---|---|---|
| Atendimento presencial | **26%** | **23%** | **29%** | **25%** |
| Comida | **18%** | **19%** | **12%** | **12%** |
| Ambiente e decoração | **15%** | **12%** | **15%** | **15%** |
| Variedade do acervo | **10%** | **8%** | **8%** | **6%** |
| Explicação de jogos | **6%** | **9%** | **8%** | **11%** |
| Comemorações e grupos | 2% | 2% | 3% | **6%** |
| Demais 16 temas | 22% | 26% | 24% | 24% |

Fonte: elaborado pelo próprio autor com base no B2. K-means com k = 2 no gasto declarado; em negrito, os cinco temas mais mencionados de cada coluna, com empates. Tabela completa em `B2_cluster_clientes_k2_elogios.csv`.

Com dois grupos, o padrão dos Quadros C2 e C3 se mantém: atendimento lidera, seguido de comida e ambiente, nas duas faixas e entre quem volta. O que o k = 2 apaga é o recuo do ambiente no gasto alto, que no k = 3 cai a 6% dos elogios: com o grupo alto começando em R$ 110, ele fica em 12%. Esse recuo é próprio de quem gasta R$ 150 ou mais (60 avaliações), e o achado firme é a liderança do atendimento.

Leitura para o plano: o cliente de ticket alto avalia o serviço, não o cenário. Ele elogia a rapidez e critica o atendimento e a taxa de entrada, que pesa mais numa conta já alta. O plano que mira ticket acima de R$ 100 precisa de atendimento à altura e de taxa justificada pelo serviço (explicação de jogos, curadoria). A Bodogami tem cerca de 40% das avaliações de cada grupo, então o padrão não é efeito de uma casa só.

**Quadro C6 - Robustez: grupos de clientes pelo gasto declarado com k = 2 e k = 5**

| k | Grupo | Avaliações | Gasto declarado | Nota média | Nota 1 ou 2 | Com alguma crítica |
|---|---|---|---|---|---|---|
| 2 | Baixo | 406 | até R$ 90 (média R$ 66) | 4,77 | 4% | 18% |
| 2 | Alto | 202 | R$ 110 a R$ 200 (média R$ 134) | 4,41 | 12% | 29% |
| 5 | 1 | 161 | até R$ 50 (média R$ 44) | 4,83 | 3% | 11% |
| 5 | 2 | 120 | R$ 70 | 4,80 | 3% | 18% |
| 5 | 3 | 221 | R$ 90 a R$ 110 (média R$ 99) | 4,61 | 6% | 26% |
| 5 | 4 | 73 | R$ 130 a R$ 150 (média R$ 137) | 4,25 | 16% | 36% |
| 5 | 5 | 33 | R$ 170 a R$ 200 (média R$ 194) | 4,36 | 15% | 21% |

**Quadro C7 - Robustez: temas do Quadro C com k = 2 e k = 5 (% das avaliações do grupo)**

| Tema | k = 2: baixo / alto | q | k = 5: grupos 1 a 5 | q |
|---|---|---|---|---|
| Atendimento presencial, crítica | 3% / 9% | 0,01 | 0,6% / 3% / 5% / 15% / 9% | 0,003 |
| Preço da entrada, crítica | 2% / 5% | 0,17 | 0,6% / 2% / 3% / 8% / 6% | 0,18 |
| Rapidez do serviço, elogio | 1% / 4% | 0,21 | 0,6% / 0% / 3% / 5% / 3% | 0,27 |
| Ambiente e decoração, elogio | 33% / 23% | 0,11 | 32% / 33% / 30% / 26% / 12% | 0,49 |
| Explicação de jogos, elogio | 14% / 17% | 0,44 | 7% / 14% / 20% / 18% / 12% | 0,14 |
| Regras da casa, crítica | 2% / 5% | 0,17 | 0,6% / 2% / 5% / 4% / 0% | 0,27 |

Fonte: elaborado pelo próprio autor com base no B2. Tabelas completas em `B2_cluster_clientes_k2_k5_resumo.csv` e `_conteudo.csv`.

O resultado que não depende de k é este: a nota cai e a crítica ao atendimento sobe com o gasto, com q abaixo de 0,05 nos três agrupamentos. A crítica ao preço da entrada e a queda do elogio ao ambiente seguem a mesma direção com k = 2 e k = 5, mas perdem a significância (q de 0,11 a 0,49). Por isso, no texto, devem aparecer como tendência, não como achado. Com k = 5, o grupo 2 é uma faixa só (R$ 70) e o grupo 5 tem 33 avaliações.

Limites: o gasto declarado inclui a ocasião (aniversário, grupo grande) e não separa o que é taxa e o que é consumo; a faixa é escolhida pelo cliente no Google Maps, sem conferência.

## 4. Custo-benefício: cardápio de qualidade, preço baixo, acervo ou ambiente

Pedido do autor (03/11/2026): estimar o que rende mais por pessoa e por mês na luderia do plano. Script `B2-a_custo_beneficio_cardapio.py`; tabelas `B2_custo_beneficio_posicoes.csv` e `B2_custo_beneficio_grupos.csv`.

**A premissa de que o cardápio caro tem comida melhor não aparece no B2.** Nas casas do grupo 2 (consumo caro), a nota média de comida é 4,37, contra 4,67 no grupo 1 (média das casas com nota de aspecto). A crítica à comida também é maior: 5% das avaliações, contra 2% (q = 0,17). O cardápio caro cobra mais, mas não é percebido como mais gostoso. A expectativa que o preço cria pode até explicar a crítica maior. Como a crítica à comida aparece em metade das avaliações de quem não volta (seção 1), cobrar mais sem entregar mais é risco de retenção.

**Margem de contribuição por categoria.** A fonte é a cartilha de CMV da Abrasel (jan/2026, seção 6, N4), que dá faixas por categoria: pratos de 25% a 40%; bebidas não alcoólicas de 10% a 30%; chope e cervejas de 30% a 35%; destilados de 10% a 20%. A mesma cartilha diz que CMV mais mão de obra não deve passar de 65% da receita bruta. O plano usa 30% para todo o A&B (C01, IBGE PAS 2023), dentro dessas faixas. Na estimativa, a bebida do cardápio, que mistura as três categorias, fica em 25% (de 20% a 32,5%), e o prato em 32,5% (de 27,5% a 37,5%). No cardápio de qualidade, o prato vai ao topo da faixa, 40%.

**Posições comparadas.** Base: os preços do grupo 1, perto da cesta do plano. O gasto com A&B é o declarado no B2 menos a taxa de entrada, média das casas: R$ 55,73 no grupo 1 e R$ 78,00 no grupo 2. A taxa de entrada fica em R$ 19,83 por pessoa em todas as posições. Simples (9,24%) e cartão (3%) saem da Tabela 9.2.

**Quadro D - Margem por pessoa e público necessário para empatar com a base (cenário provável)**

| Posição | A&B por pessoa | CMV do A&B | Margem por pessoa | Custo fixo extra por mês | Público para empatar com a base |
|---|---|---|---|---|---|
| Base (preços do grupo 1) | R$ 55,73 | 30% | R$ 49,53 | — | 942 por mês |
| Cardápio de qualidade (preços do grupo 2) | R$ 78,00 | 35% | R$ 58,72 | R$ 2.329 (cozinheiros 50% mais caros, N6) | 834 (11% a menos) |
| Preço baixo (A&B 15% mais barato) | R$ 47,37 | 35% | R$ 42,20 | — | 1.106 (17% a mais) |
| Acervo maior (+147 títulos, de 175 para 322) | R$ 55,73 | 30% | R$ 49,53 | R$ 646 (R$ 25,9 mil em 5 anos mais reposição de 10% ao ano) | 955 (+13 pessoas) |
| Ambiente (cada R$ 10 mil investidos) | R$ 55,73 | 30% | R$ 49,53 | R$ 167 (5 anos) | 945 (+3 pessoas) |

Fonte: elaborado pelo próprio autor com base em Abrasel (2026), B1, B2 e no modelo financeiro (cap. 9). No pessimista e no otimista (CMV nas pontas das faixas), o cardápio de qualidade tolera perder de 10% a 13% do público, e o preço baixo pede de 16% a 19% a mais.

**Leitura para o plano.**
- **Preço baixo é a pior aposta.** Cortar 15% do A&B exige 17% mais gente só para empatar. No B2, nada mostra que preço atrai: o elogio ao preço da entrada aparece em 3,5% das avaliações do grupo 1, e a nota é igual nos três grupos.
- **Cardápio mais caro rende mais por pessoa,** cerca de R$ 9 de margem a mais, ou R$ 6 mil por mês depois do custo dos cozinheiros. Esse ganho vem do preço, não da qualidade percebida, e só se paga se a comida sustentar o preço: a crítica à comida é a segunda maior causa declarada de não voltar.
- **Acervo e ambiente são baratos de pagar.** O acervo da mediana custa 13 pessoas a mais por mês (1,4% do público), e cada R$ 10 mil de ambiente, 3 pessoas. São as posições de menor risco. O acervo é o tema que mais distingue as casas de consumo barato e de taxa por hora alta (elogiado em 27% e 34% das avaliações). O ambiente funciona como piso: quase nunca é criticado e não rompe a relação (seção 1).
- Uma ordem coerente com os dados: atendimento primeiro (retenção), depois acervo e ambiente (custo baixo e elogio frequente), e preço de cardápio no meio, com subida só quando a comida sustentar a nota.

Limites: o gasto declarado vem de 13 casas com faixa de preço (6 no grupo 1, 7 no grupo 2). Nenhuma fonte liga qualidade, preço ou acervo a um volume de público medido, por isso o quadro responde quanto público cada posição precisa ganhar ou pode perder, e não quanto ela ganha. O acréscimo dos cozinheiros e o corte de 15% são premissas do autor (N6).

## Arquivos

| Arquivo | Conteúdo |
|---|---|
| `B2_retorno_temas.csv` | Tema × polaridade nas comparações a, b e c (contagens, %, razão de chances, p e q) |
| `B2_retorno_decisao_resumo.csv` | Nota, notas de aspecto, temas, "costuma ir", gasto e contexto por decisão; fecha com 1.628 |
| `B2_cluster_casas.csv` | 54 casas do B1: taxas, fonte, horas cobertas, taxa por hora, consumo, cesta completa, grupo ou motivo de ficar fora |
| `B2_cluster_casas_distribuicao.csv` | Distribuição interna dos elogios e das críticas em cada grupo de casas (cada coluna soma 100%) |
| `B2_cluster_casas_resumo.csv` e `_conteudo.csv` | Grupos de casas: centroides, casas, nota, retorno; temas por grupo com qui-quadrado |
| `B2_cluster_clientes_distribuicao_por_decisao.csv` | Distribuição interna dos elogios de quem volta e das críticas de quem não volta, por grupo de gasto |
| `B2_cluster_clientes_k2_k5_resumo.csv` e `_conteudo.csv` | Robustez: resumo e temas dos grupos de gasto com k = 2 e k = 5 |
| `B2_cluster_clientes_k2_elogios.csv` | Robustez: distribuição interna dos elogios com k = 2, em todas as avaliações com gasto e só nas "volta" |
| `B2_cluster_clientes_distribuicao.csv` | Distribuição interna dos elogios e das críticas em cada grupo de gasto (cada coluna soma 100%) |
| `B2_cluster_clientes_resumo.csv` e `_conteudo.csv` | Grupos de clientes: faixa de gasto, nota, retorno; temas por grupo com qui-quadrado |
| `B2_cluster_silhueta.csv` | Silhueta média de k = 2 a 5 nos dois agrupamentos |
| `B2_custo_beneficio_posicoes.csv` e `_grupos.csv` | Margem por pessoa, custo fixo extra e público de empate de cada posição nos três cenários; preços, gasto e notas de comida por grupo de casas |
