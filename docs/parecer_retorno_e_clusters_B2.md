# B2: o que acompanha a decisão de voltar e o conteúdo das avaliações por grupo de preço

Parecer de 03/11/2026, a pedido do autor. Script: `_src/[B2] Avaliacoes recentes/Google Places (Comentários)/analise/B2-a_retorno_e_clusters.py`. Tabelas: `dados/[B2] Avaliacoes recentes/retorno_e_clusters/`. Base: as 1.628 avaliações do B2 codificadas na grade de 22 temas (Notion, 03/11/2026).

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

Leitura para o plano: o cliente de ticket alto avalia o serviço, não o cenário. Ele elogia a rapidez e critica o atendimento e a taxa de entrada, que pesa mais numa conta já alta. O plano que mira ticket acima de R$ 100 precisa de atendimento à altura e de taxa justificada pelo serviço (explicação de jogos, curadoria). A Bodogami tem cerca de 40% das avaliações de cada grupo, então o padrão não é efeito de uma casa só.

Limites: o gasto declarado inclui a ocasião (aniversário, grupo grande) e não separa o que é taxa e o que é consumo; a faixa é escolhida pelo cliente no Google Maps, sem conferência.

## Arquivos

| Arquivo | Conteúdo |
|---|---|
| `B2_retorno_temas.csv` | Tema × polaridade nas comparações a, b e c (contagens, %, razão de chances, p e q) |
| `B2_retorno_decisao_resumo.csv` | Nota, notas de aspecto, temas, "costuma ir", gasto e contexto por decisão; fecha com 1.628 |
| `B2_cluster_casas.csv` | 54 casas do B1: taxas, fonte, horas cobertas, taxa por hora, consumo, cesta completa, grupo ou motivo de ficar fora |
| `B2_cluster_casas_resumo.csv` e `_conteudo.csv` | Grupos de casas: centroides, casas, nota, retorno; temas por grupo com qui-quadrado |
| `B2_cluster_clientes_resumo.csv` e `_conteudo.csv` | Grupos de clientes: faixa de gasto, nota, retorno; temas por grupo com qui-quadrado |
| `B2_cluster_silhueta.csv` | Silhueta média de k = 2 a 5 nos dois agrupamentos |
