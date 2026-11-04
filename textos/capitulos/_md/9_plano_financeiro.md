# 9 PLANO FINANCEIRO

O plano financeiro converte as decisões dos capítulos 5 a 8 em receitas, custos e indicadores de viabilidade. O modelo projeta o desenho enxuto do plano operacional na etapa de abertura: 6 mesas, 48 horas por semana, equipe de 5 empregados e o sócio e acervo com 175 jogos. As etapas de expansão ficam fora do fluxo de caixa base, entrando apenas na análise estratégica (capítulo 10) como opções. O capítulo parte da estrutura do modelo e do registro de premissas, projeta investimento, resultado e fluxo de caixa e termina na sensibilidade e nas checagens de coerência.

A receita nasce do número de pessoas atendidas, estimado na seção 6.6 a partir da circulação medida no pico da São Jogue (B3), levada ao dia pelo horário dos concorrentes (B1) e ao dia útil pelo gasto com cartão em restaurantes (ANR, 2026a; 2026b). No mês maduro do cenário provável, a luderia recebe 43,8 pessoas por dia de fim de semana e 28,7 por dia útil, ou 942 pessoas por mês.

Cada pessoa gasta, em média, uma cesta de consumo: uma bebida, uma entrada ou prato principal e a taxa de entrada. O gasto provável é o declarado pelos avaliadores no Google Maps (B2), em média, nos 12 concorrentes com cesta de consumo conhecida: R$ 80,14 por pessoa (seção 6.3). A taxa de entrada responde por 24,7% da cesta nesses concorrentes; o restante é alimentos e bebidas (A&B). Somado o aluguel de jogos para levar para casa, a receita por pessoa é:

receita por pessoa = gasto por pessoa + aluguel de jogos (2)

80,14 + 0,96 = R$ 81,10

O Quadro 9.1 organiza essas contas como uma árvore de direcionadores: cada linha de receita, custo ou investimento se desdobra em premissas, e cada premissa é uma linha do registro de premissas (seção 9.1).

**Quadro 9.1 – Árvore de direcionadores do modelo financeiro**

| Direcionador | Cálculo | Premissas |
|---|---|---|
| Pessoas por mês | circulação no pico × horas de pico equivalentes × dias abertos × fator de rampa × semanas por mês; o dia útil recebe a razão dia útil ÷ fim de semana | R04, R05, R11, R12, R15 a R17, M02 |
| Receita de taxa de entrada | pessoas × gasto por pessoa × parcela da taxa de entrada | R06, R07 |
| Receita de A&B | pessoas × gasto por pessoa × (1 − parcela da taxa de entrada) | R06, R07 |
| Receita de aluguel de jogos | aluguéis por mês × preço médio × fator de rampa | R09, R10 |
| Custos variáveis | Simples Nacional sobre a receita; CMV sobre o A&B; taxa de cartão | C01, C02, aba simples |
| Custos fixos | aluguel e condomínio; pessoal com encargos; pró-labore; utilidades; marketing; contabilidade; sistemas; reposição do acervo | C03 a C13 |
| Investimento | reforma; mobiliário; cozinha e bar; caixa; acervo; pré-operacional; caução; capital de giro | I01 a I08 |

Fonte: elaborado pelo próprio autor.

As mesas do salão (R01), as pessoas por mesa (R02), a permanência (R03) e o horário (R13 e R14) não entram na receita: servem para conferir se a circulação cabe no salão e no horário (seção 9.6). A projeção é mensal nos 60 meses e anual nos demonstrativos. O mês é a unidade de cálculo porque o ano 1 tem rampa: o período em que o movimento cresce até o nível maduro. A rampa começa com 40% do fluxo maduro no mês 1 e chega a 100% no mês 9.

Quatro elementos ficam fora do modelo, cada um por um motivo. A inflação fica fora porque todos os valores estão em preços de outubro de 2026 e a taxa de desconto é real, isto é, descontada da inflação; assim, receitas e custos não precisam de reajuste. O financiamento fica fora porque o plano supõe capital próprio; por isso, não há juros nem parcelas no fluxo de caixa. O imposto sobre o lucro não aparece em separado, porque o Simples Nacional já o inclui na alíquota sobre a receita (seção 8.1). As etapas de expansão ficam fora do fluxo base porque dependem de gatilhos de demanda e entram no capítulo 10 como opções.

## 9.1 REGISTRO DE PREMISSAS

Premissa é um valor que o modelo assume sobre o futuro, como o gasto por pessoa. O modelo tem 42 premissas, cada uma com três valores, um por cenário, além de fonte e nível de evidência (Apêndice E). O cenário provável usa o valor mais bem sustentado pelos dados; o pessimista e o otimista usam os extremos plausíveis da faixa. O Quadro 9.2 traz as dez premissas que mais movem o VPL entre os extremos da faixa, na ordem do tornado (seção 9.5).

**Quadro 9.2 – Premissas de maior impacto no VPL**

| ID | Premissa | Pessimista | Provável | Otimista | Amplitude no VPL (R$) | Nível |
|---|---|---|---|---|---|---|
| R04 | Circulação no pico de fim de semana (pessoas por hora) | 4,13 | 6,40 | 11,43 | 4.080.619 | N5 |
| R06 | Gasto por pessoa (R$) | 40,00 | 80,14 | 109,84 | 2.828.262 | N3 |
| R18 | Variação anual da demanda a partir do ano 3 (% ao ano) | -5% | 0% | 2% | 517.828 | N6 |
| M01 | Taxa mínima de atratividade real (% ao ano) | 18% | 15% | 12% | 496.800 | N2 + N6 |
| C01 | CMV de alimentos e bebidas (% do A&B) | 35% | 30% | 26% | 397.117 | N2 |
| C03 | Área do ponto (m²) | 150 | 130 | 110 | 268.106 | N6 |
| C04 | Aluguel comercial (R$ por m² ao mês) | 64,35 | 54,15 | 45,00 | 248.318 | N2 |
| C09 | Utilidades (R$ por mês) | 6.000,00 | 4.500,00 | 3.500,00 | 202.514 | N6 |
| R05 | Circulação de dia útil (% do fim de semana) | 61,9% | 65,5% | 69,2% | 163.196 | N4 |
| C08 | Pró-labore (R$ por mês) | 4.000,00 | 3.000,00 | 2.000,00 | 162.011 | N6 |

Fonte: elaborado pelo próprio autor, com base no modelo financeiro (Apêndice E), nos Blocos B1 a B4 (10/2026) e em ANR (2026a; 2026b).

As premissas de demanda vêm da contagem direta na São Jogue (B3). Nas quatro noites, entraram de 4,03 a 11,43 pessoas por hora, com média de 6,40. A circulação provável é essa média, e a otimista, a maior visita. A circulação não é reduzida na proporção das mesas, de 10 na São Jogue para 6 no plano: a demanda vem do público, não do tamanho do salão, enquanto o salão não lota. Nas visitas, a São Jogue não lotou: a ocupação média das mesas foi de 30% a 67%. O salão de 6 mesas comporta até 11,9 pessoas por hora, com grupos de 3,6 pessoas e permanência média de 109 minutos.

A circulação pessimista vem das notas fiscais (NFC-e) da São Jogue. A Bela Vista emitiu 30,5 notas por dia, e a Paralela, 16,1. Cada cliente recebe uma nota, mas a nota só sai quando o cliente pede: o número de notas é, portanto, um piso do número de clientes. O caminho inverso da equação 1 converte esse piso em circulação no pico, com as horas de pico equivalentes do horário da São Jogue, 7,21, e uma semana de 3 dias de fim de semana e 4 dias úteis. O resultado é de 5,42 pessoas por hora na Bela Vista e 2,85 na Paralela, com média de 4,13. As horas de pico equivalentes (R15) não variam entre os cenários, porque vêm do horário publicado dos concorrentes (N3). A razão entre o dia útil e o fim de semana (R05) usa o Rio de Janeiro no pessimista e São Paulo no otimista (N4).

Os preços vêm dos concorrentes (seção 6.3). A cesta de consumo de cada concorrente soma a mediana das bebidas, a mediana das entradas ou pratos principais e a taxa de entrada. Quando a taxa muda com o dia, entra a média das taxas, ponderada pelos dias em que cada uma vale. Nos 12 concorrentes com cesta e gasto declarado, a cesta média é de R$ 79,20, e o gasto médio, de R$ 80,14: cada pessoa gasta, em média, uma cesta de consumo. O gasto pessimista é o do concorrente de menor gasto, R$ 40,00, e o otimista, o do de maior gasto, R$ 109,84. A taxa de entrada responde por 24,7% da cesta (R$ 19,59 de R$ 79,20), e essa parcela separa a receita de taxa da de A&B nos três cenários (R07). Com isso, o cenário muda o volume e o preço.

Do lado dos custos, o modelo usa bases públicas sempre que possível: o aluguel do FipeZap, os salários das medianas de admissão em Salvador no Novo CAGED e o custo das mercadorias vendidas (CMV) da PAS 2023. O CMV é o custo dos ingredientes e das bebidas que a casa revende, e fica em 30% da receita de A&B. O salário de admissão tende a ficar abaixo do pago a quem já está no cargo; por isso, o pessimista soma 11,4% aos salários, a maior distância entre o 3º quartil e a mediana de admissão entre os cargos da equipe. Área e despesas gerais não têm cotação e ficam em N6; reforma, mobiliário, cozinha e informática vêm do orçamento da etapa 1 (seção 9.2).

Falta a taxa que traz os valores futuros para o presente. A TMA é o retorno mínimo que o investidor exige para pôr o dinheiro na luderia, em vez de aplicá-lo numa alternativa segura (seção 2.5). Ela soma duas parcelas: o juro real, que é o ganho de uma aplicação segura acima da inflação, e um prêmio pelo risco de um pequeno negócio novo. O juro real sai da Selic meta de 14,0% (BCB, set/2026) e do IPCA esperado de 4,3% para 2027 (Focus):

juro real = (1 + Selic) ÷ (1 + IPCA esperado) − 1 (3)

1,140 ÷ 1,043 − 1 = 9,3% ao ano

Com um prêmio de 5,7 pontos percentuais, a TMA provável fica em 15% ao ano. Os cenários usam prêmios de cerca de 3 e 9 pontos: TMA de 12% no otimista e de 18% no pessimista. A Figura 9.1 mostra que o Focus prevê queda da Selic até 2029, o que favorece a TMA otimista.

**Figura 9.1 – Selic meta e IPCA em 12 meses, com projeção do Relatório Focus**

![Selic meta e IPCA em 12 meses, com projeção do Relatório Focus](../figuras/9_selic_ipca.png)

Fonte: elaborado pelo próprio autor, com base no Banco Central do Brasil, SGS (séries 432 e 13522) e Relatório Focus de 11/09/2026.

## 9.2 INVESTIMENTO INICIAL

O investimento inicial é o dinheiro gasto antes da abertura: obra, equipamentos, acervo, caução e uma reserva de caixa. A Tabela 9.1 mostra os oito itens por cenário. No provável, o investimento é de R$ 309 mil, com a reforma (34%) e o capital de giro (21%) como maiores itens. Reforma, mobiliário, cozinha e informática vêm do orçamento item a item do Bloco B5 (seção 3.2.4), sem frete. Ainda sem preço, o letreiro, o balcão e o kit de gás ficam fora da soma; a maquininha de cartão é cedida sem custo pelo banco. O acervo de 175 jogos custa R$ 35 mil, com faixa de 15% para cada lado: a variação típica do preço do mesmo jogo entre as lojas do B1. O acervo também recebe *sleeves* (capas plásticas) em todas as cartas, ainda sem custo levantado [pendente].

**Tabela 9.1 – Investimento inicial por cenário (R$)**

| Item | Pessimista | Provável | Otimista |
|---|---|---|---|
| Reforma e instalações | 157.912,50 | 106.103,40 | 70.745,40 |
| Mobiliário | 18.768,82 | 14.806,11 | 12.006,37 |
| Cozinha e bar | 89.253,32 | 38.917,61 | 32.331,02 |
| Caixa e informática | 9.764,79 | 7.762,90 | 5.414,15 |
| Acervo inicial de jogos | 40.285,51 | 35.030,88 | 29.776,25 |
| Gastos pré-operacionais | 30.000,00 | 20.000,00 | 12.000,00 |
| Caução do aluguel | 28.957,50 | 21.118,50 | 9.900,00 |
| Capital de giro | 127.333,31 | 65.122,53 | 38.490,14 |
| Total | 502.275,75 | 308.861,93 | 210.663,33 |

Fonte: elaborado pelo próprio autor, com base no modelo financeiro (Apêndice E) e no Bloco B5 (SINAPI de set/2026; anúncios de 03/11/2026).

O capital de giro é a reserva de caixa que paga as contas enquanto a receita ainda não cobre os custos. Ele equivale a dois meses de custos fixos, R$ 65 mil, e cobre os primeiros meses da rampa, em que a receita ainda fica abaixo dos custos. A caução são três meses de aluguel, exigidos pelo locador como garantia. Os dois valores voltam ao caixa no ano 5, no fim do horizonte de análise. A cozinha completa desde a abertura custa R$ 39 mil e sustenta o CMV de 30%; no pessimista, com a lava-louças de capota, chega a R$ 89 mil.

## 9.3 RECEITAS, CUSTOS E RESULTADOS PROJETADOS

Na maturidade, o cenário provável atende 942 pessoas por mês, cerca de 36 por dia aberto, e a receita bruta mensal chega a R$ 76,4 mil. A Tabela 9.2 separa essa receita em três fontes e a confronta com os custos do mês.

**Tabela 9.2 – Receita e custos mensais no cenário provável, mês maduro (R$)**

| Conta | Valor mensal | Participação na receita bruta (%) |
|---|---|---|
| Taxa de entrada | 18.679,17 | 24,4 |
| Alimentos e bebidas | 56.822,74 | 74,4 |
| Aluguel de jogos | 900,00 | 1,2 |
| Receita bruta | 76.401,91 | 100,0 |
| Simples Nacional | 7.057,09 | 9,2 |
| CMV de A&B | 17.046,82 | 22,3 |
| Taxa de cartão | 2.292,06 | 3,0 |
| Pessoal com encargos (5 empregados) | 13.171,94 | 17,2 |
| Aluguel, condomínio e IPTU | 8.447,40 | 11,1 |
| Pró-labore e despesas gerais | 10.941,92 | 14,3 |
| Subtotal: custos fixos (as três linhas anteriores) | 32.561,27 | 42,6 |
| Resultado operacional (EBITDA) | 17.444,68 | 22,8 |

Fonte: elaborado pelo próprio autor, com base no modelo financeiro (Apêndice E).

Os custos se dividem em dois tipos. Os variáveis crescem com cada pessoa atendida: o Simples Nacional, o CMV e a taxa de cartão. Os fixos não mudam com o movimento: pessoal, aluguel, pró-labore e despesas gerais. O pessoal é o maior custo fixo: 5 empregados, com remuneração de R$ 9,2 mil, já com os adicionais da escala, e encargos, provisões e vale-transporte de 43,7%. O A&B é a maior receita, com 74,4%, porque a taxa de entrada é cerca de um quarto da cesta de consumo dos concorrentes. O Simples Nacional custa 9,2% da receita, com o enquadramento da seção 8.1.

A margem de contribuição é o que sobra de cada pessoa atendida depois dos custos variáveis. É essa sobra que paga os custos fixos e, depois deles, gera lucro:

margem por pessoa = receita por pessoa − Simples − CMV − cartão (4)

81,10 − 7,49 − 18,09 − 2,43 = R$ 53,09

Cada pessoa deixa R$ 53,09, ou 65% do que paga, para cobrir os custos fixos de R$ 32,6 mil por mês. O ponto de equilíbrio operacional é o movimento em que essa margem paga exatamente os custos fixos, sem lucro nem prejuízo:

pessoas no equilíbrio = custos fixos ÷ margem por pessoa (5)

32.561,27 ÷ 53,09 = 613 pessoas por mês

O equilíbrio exige 613 pessoas por mês, 23,6 por dia aberto, o que equivale a R$ 49,7 mil de receita mensal. O cenário provável fica 54% acima desse ponto. A conta usa as alíquotas do ano maduro.

A Tabela 9.3 junta o resultado de cada ano e o fluxo de caixa. O resultado operacional antes de juros, impostos, depreciação e amortização (EBITDA) é a receita menos todos os custos que saem do caixa: mede o dinheiro que a operação gera. A depreciação é a perda de valor dos bens pelo uso, lançada como custo ao longo da vida útil, sem saída de dinheiro. O cenário provável dá lucro desde o ano 1, mesmo com a rampa. A partir do ano 2, o EBITDA é de R$ 209 mil por ano, e o lucro, depois da depreciação de R$ 39 mil, de R$ 170 mil.

O fluxo de caixa registra o dinheiro que entra e sai em cada ano: o investimento no ano 0 e o EBITDA nos anos 1 a 5. O ano 5 tem três parcelas a mais. Voltam a caução e o capital de giro, e entra o valor residual: o valor que o negócio ainda tem no fim do horizonte, já que a luderia não fecha no ano 6. O modelo calcula esse valor como uma perpetuidade, isto é, supõe que o resultado do ano 5 se repete todos os anos, sem crescimento, e traz essa sequência para o valor presente pela TMA (ASSAF NETO, 2014). Do EBITDA sai um reinvestimento igual à depreciação, para repor os bens gastos:

valor residual = (EBITDA do ano 5 − depreciação) ÷ TMA (6)

(209.336 − 39.152) ÷ 0,15 = R$ 1.134.562

A Tabela 9.3 também traz o fluxo descontado: cada valor futuro dividido por 1,15 elevado ao número de anos, o que o torna comparável ao dinheiro de hoje. A última linha acumula esses valores e, no ano 5, chega ao VPL. Sem o valor residual, o VPL provável segue positivo (seção 9.4).

**Tabela 9.3 – Demonstração do resultado e fluxo de caixa projetados, cenário provável (R$)**

| Conta | Ano 0 | Ano 1 | Ano 2 | Ano 3 | Ano 4 | Ano 5 |
|---|---|---|---|---|---|---|
| Receita bruta | 0 | 710.538 | 916.823 | 916.823 | 916.823 | 916.823 |
| (-) Simples Nacional | 0 | -59.956 | -84.685 | -84.685 | -84.685 | -84.685 |
| (-) CMV e taxa de cartão | 0 | -179.852 | -232.067 | -232.067 | -232.067 | -232.067 |
| Margem de contribuição | 0 | 470.730 | 600.071 | 600.071 | 600.071 | 600.071 |
| (-) Custos fixos | 0 | -390.735 | -390.735 | -390.735 | -390.735 | -390.735 |
| EBITDA | 0 | 79.995 | 209.336 | 209.336 | 209.336 | 209.336 |
| (-) Depreciação e amortização | 0 | -39.152 | -39.152 | -39.152 | -39.152 | -39.152 |
| Lucro líquido | 0 | 40.843 | 170.184 | 170.184 | 170.184 | 170.184 |
| Investimento inicial | -308.862 | 0 | 0 | 0 | 0 | 0 |
| Caução e capital de giro devolvidos | 0 | 0 | 0 | 0 | 0 | 86.241 |
| Valor residual | 0 | 0 | 0 | 0 | 0 | 1.134.562 |
| Fluxo de caixa | -308.862 | 79.995 | 209.336 | 209.336 | 209.336 | 1.430.139 |
| Fluxo descontado a 15% | -308.862 | 69.561 | 158.288 | 137.642 | 119.689 | 711.032 |
| Descontado acumulado | -308.862 | -239.301 | -81.013 | 56.629 | 176.318 | 887.350 |

Fonte: elaborado pelo próprio autor, com base no modelo financeiro (Apêndice E).

Nota: o lucro líquido não desconta impostos sobre o lucro, que já estão no Simples Nacional. Sem o valor residual, o VPL é de R$ 323.272.

## 9.4 INDICADORES DE VIABILIDADE

Os indicadores de viabilidade resumem o fluxo de caixa em respostas a três perguntas: quanto o negócio gera além do que a TMA exige, quanto ele rende e em quanto tempo devolve o investimento (seção 2.5). A Tabela 9.4 traz os indicadores por cenário.

**Tabela 9.4 – Indicadores de viabilidade por cenário**

| Indicador | Pessimista | Provável | Otimista |
|---|---|---|---|
| Investimento inicial (R$) | 502.276 | 308.862 | 210.663 |
| Receita bruta mensal madura (R$) | 20.514 | 76.402 | 203.033 |
| Ponto de equilíbrio mensal (R$) | 65.497 | 49.749 | 38.794 |
| EBITDA do ano 5 (R$) | -349.806 | 209.336 | 1.303.617 |
| VPL a 15% real (R$) | -1.526.733 | 887.350 | 10.180.153 |
| VPL sem valor residual (R$) | -1.526.733 | 323.272 | 4.148.425 |
| TIR real (%) | n.a. | 66,3 | 510,0 |
| Payback descontado (anos) | mais de 5 | 2,6 | 0,2 |

Fonte: elaborado pelo próprio autor, com base no modelo financeiro (Apêndice E).

Nota: n.a.: não há TIR, porque o fluxo do pessimista não muda de sinal.

O VPL soma o fluxo descontado e mostra quanto o negócio gera além do que a TMA exige. No provável, o VPL é de R$ 887 mil: o negócio paga os 15% ao ano e gera esse valor a mais, em dinheiro de hoje. Sem o valor residual, o VPL cai para R$ 323 mil e segue positivo: a viabilidade não depende de a luderia seguir aberta depois do ano 5.

A TIR é o rendimento anual do próprio negócio: a taxa que zera o VPL. A TIR provável é de 66,3% ao ano, em termos reais, mais de quatro vezes a TMA.

O payback descontado é o tempo até o fluxo descontado acumulado devolver o investimento. No provável, ele é de 2,6 anos, dentro do horizonte de 5 anos.

O ponto de equilíbrio completa a leitura: a receita madura fica 54% acima dos R$ 49,7 mil mensais que pagam os custos (seção 9.3). Os quatro indicadores apontam na mesma direção: no cenário provável, o negócio é viável, com folga.

Os cenários extremos põem todas as premissas no mesmo lado da faixa ao mesmo tempo, uma combinação pouco provável: servem de limite, e não de previsão. A decisão depende de onde as premissas críticas ficam (seção 9.5).

## 9.5 TRIANGULAÇÃO, SENSIBILIDADE E PONTO DE RUPTURA

A análise de sensibilidade mede quanto o VPL muda quando uma premissa muda (seção 2.5). A Figura 9.2 mostra o tornado: cada barra leva uma premissa ao pessimista e ao otimista, com as demais no provável. As barras são ordenadas da maior para a menor, o que dá ao gráfico a forma de um funil.

Duas premissas concentram o risco: a circulação no pico (R04) e o gasto por pessoa (R06), cada uma com efeito de mais de R$ 2,8 milhões sobre o VPL entre os extremos da faixa. As três seguintes, com efeito de R$ 400 mil a R$ 520 mil, completam as premissas críticas: a variação anual da demanda (R18), a TMA (M01) e o CMV (C01). As duas primeiras têm dado próprio: a circulação vem da contagem direta (N5), e o gasto, das avaliações e dos cardápios dos concorrentes (N3).

**Figura 9.2 – Tornado: VPL com cada premissa no extremo da faixa e as demais no provável**

![Tornado do VPL](../figuras/9_tornado.png)

Fonte: elaborado pelo próprio autor, com base no modelo financeiro (Apêndice E).

A circulação pesa mais que o gasto porque a faixa medida é mais larga: a maior visita teve 2,8 vezes a circulação da menor. As duas multiplicam a taxa e o A&B ao mesmo tempo. O teto do salão não encurta o lado otimista: as 11,43 pessoas por hora da maior visita ficam abaixo das 11,9 que o salão comporta.

O tornado move uma premissa por vez; a simulação de Monte Carlo move todas juntas. Ela sorteia 10 mil combinações de premissas dentro das faixas, calcula o VPL de cada uma e conta em quantas ele fica positivo. Em cada sorteio, os gatilhos de contingência e a etapa de mesas agem como decisões de gestão (Apêndice G). O VPL fica positivo em 83,5% dos cenários, com mediana de R$ 881 mil. Os gatilhos agem em poucos sorteios: o G5 em 5,8% e o encerramento pelo G6 em 2,8%.

O ponto de ruptura é o valor de uma premissa que zera o VPL, com as demais no provável (seção 2.5). Ele transforma o resultado numa condição que pode ser acompanhada. A Tabela 9.5 traz a ruptura das cinco premissas críticas. O negócio é viável, por exemplo, enquanto a circulação no pico ficar acima de 4,85 pessoas por hora: 24% abaixo do provável.

**Tabela 9.5 – Ponto de ruptura das premissas críticas (VPL = 0)**

| ID | Premissa | Provável | Ruptura | Faixa testada | Valor medido | Nível |
|---|---|---|---|---|---|---|
| R04 | Circulação no pico de fim de semana (pessoas por hora) | 6,40 | 4,85 | 4,13 a 11,43 | 4,03 a 11,43 por visita (B3) | N5 |
| R06 | Gasto por pessoa (R$) | 80,14 | 60,79 | 40,00 a 109,84 | 40,00 a 109,84, gasto médio de 12 concorrentes (B2) | N3 |
| R18 | Variação anual da demanda a partir do ano 3 (% ao ano) | 0% | fora da faixa | -5% a 2% | n.a. | N6 |
| M01 | Taxa mínima de atratividade real (% ao ano) | 15% | 53,5% | 18% a 12% | juro real de 9,3% (BCB) | N2 + N6 |
| C01 | CMV de alimentos e bebidas (% do A&B) | 30% | 50,1% | 35% a 26% | 29,6% (IBGE, PAS 2023) | N2 |

Fonte: elaborado pelo próprio autor, com base no modelo financeiro (Apêndice E) e nos Blocos B1 a B4 (10/10/2026 a 30/10/2026).

Nota: n.a.: premissa sem medida. Fora da faixa: o VPL fica positivo em toda a faixa testada.

Só a circulação e o gasto têm ruptura dentro da faixa, e as duas ficam 24% abaixo do provável. As outras três não mudam o sinal do VPL dentro da faixa: a TMA teria de passar de 53% ao ano, e o CMV, de 50% do A&B. A ruptura define o equilíbrio econômico do negócio: o movimento em que o VPL é zero. Esse ponto fica acima do equilíbrio operacional da seção 9.3, porque, além dos custos do mês, o negócio precisa devolver o investimento com a TMA.

A Tabela 9.6 junta os números de demanda do capítulo numa escada, em pessoas por dia aberto, do piso medido ao teto do salão. Dois degraus vêm de fora do modelo: são os pisos de clientes da São Jogue, pela numeração das NFC-e (B3). A Bela Vista emitiu 30,5 notas por dia, e a Paralela, 16,1; como a nota só sai a pedido, o número real de clientes é maior.

**Tabela 9.6 – Escada da demanda, do piso de clientes à capacidade do salão**

| Degrau | Pessoas por dia aberto | Origem |
|---|---|---|
| Piso de clientes da São Jogue Paralela (NFC-e) | 16,1 | Bloco B3 |
| Equilíbrio operacional (EBITDA = 0) | 23,6 | Equação 5 (seção 9.3) |
| Equilíbrio econômico (VPL = 0) | 27,5 | Ruptura da circulação no pico (Tabela 9.5) |
| Piso de clientes da São Jogue Bela Vista (NFC-e) | 30,5 | Bloco B3 |
| Cenário provável | 36,2 | Equação 1 (início do capítulo) |
| Capacidade do salão | 95 | Seção 7.2 |

Fonte: elaborado pelo próprio autor, com base no modelo financeiro (Apêndice E) e no Bloco B3 (10/10/2026 a 30/10/2026).

Nota: o equilíbrio econômico usa a ruptura da circulação no pico, com as demais premissas no provável. A São Jogue abre todos os dias, e o dia de calendário é também o dia aberto.

A escada mostra três coisas. Primeiro, o provável fica 1,2 vez acima do piso da Bela Vista, o que é plausível, porque o piso conta só quem pediu nota. Segundo, o provável usa 38% da capacidade do salão, o que deixa folga para o pico. Terceiro, o provável fica 32% acima do equilíbrio econômico: o negócio tolera perder 24% dos clientes do provável antes de o VPL zerar. A estimativa de demanda do capítulo 6 completa a triangulação [pendente]. A plausibilidade de ficar acima das rupturas, os gatilhos de contingência e as opções de expansão são discutidos no capítulo 10.

## 9.6 CHECAGENS DE COERÊNCIA

A capacidade comporta a demanda: as 36 pessoas por dia aberto usam 38% da capacidade do salão, de 95 pessoas por dia aberto (capítulo 7). No pico, a circulação provável de 6,40 pessoas por hora, com permanência de 109 minutos, ocupa 3,2 das 6 mesas. As horas de pico equivalentes também cabem no horário: 6,84 horas, contra 8 horas abertas por dia.

A comparação com o setor mostra onde a luderia se afasta dos serviços de alimentação. A folha com encargos custa 17,2% da receita, contra 25,1% de gastos com pessoal no setor (IBGE, PAS 2024); a diferença vem da equipe de 5 empregados do desenho enxuto, com o sócio no caixa. O aluguel com condomínio custa 11,1%, contra 4,0% no setor. Essa diferença vem do formato: cada grupo ocupa uma mesa por 109 minutos em média para jogar, o que exige mais área para cada real de receita. O ponto é o custo que mais se afasta do setor e o primeiro a cotar.

No preço, a taxa de entrada contida no gasto provável, R$ 19,83 por pessoa (24,7% de R$ 80,14), fica perto da mediana de R$ 20,00 dos concorrentes que cobram e abaixo da São Jogue, de R$ 28,00 no fim de semana (seção 6.3). A distância para a São Jogue vem da decisão de entrar pela média dos concorrentes: o preço não exige posicionamento acima do mercado. A demanda projetada também cabe no mercado da cidade (seção 6.6).

**Referências citadas neste capítulo**

ASSAF NETO, Alexandre. *Finanças corporativas e valor*. 7. ed. São Paulo: Atlas, 2014.

ASSOCIAÇÃO NACIONAL DE RESTAURANTES (ANR). *Panorama do consumo em restaurantes no Rio de Janeiro*: preferências por cozinha, dias da semana e momentos de refeição. São Paulo, 10 set. 2026a. Estudo do Mastercard Economics Institute em parceria com a ANR. Disponível em: https://anrbrasil.org.br/panorama-do-consumo-em-restaurantes-no-rio-de-janeiro-preferencias-por-cozinha-dias-da-semana-e-momentos-de-refeicao/. Acesso em: 2 nov. 2026.

ASSOCIAÇÃO NACIONAL DE RESTAURANTES (ANR). *Calor e chuva esfriam o apetite?* Estudo inédito da Mastercard Economics Institute em parceria com a ANR revela o impacto do clima sobre os gastos em restaurantes de São Paulo. São Paulo, 11 ago. 2026b. Disponível em: https://anrbrasil.org.br/calor-e-chuva-esfriam-o-apetite-estudo-inedito-da-mastercard-economics-institute-em-parceria-com-a-anr-revela-o-impacto-do-clima-sobre-os-gastos-em-restaurantes-de-sao-paulo/. Acesso em: 2 nov. 2026.

BANCO CENTRAL DO BRASIL (BCB). *Relatório Focus*: expectativas de mercado de 11 set. 2026. Brasília, 2026. Disponível em: https://www.bcb.gov.br/content/focus/focus/R20260911.pdf. Acesso em: 2 nov. 2026.

BANCO CENTRAL DO BRASIL (BCB). *Sistema Gerenciador de Séries Temporais (SGS)*: séries 432, 433, 1619 e 13522. Brasília, 2026. Disponível em: https://www3.bcb.gov.br/sgspub/. Acesso em: 14 out. 2026.

BRASIL. Constituição (1988). Emenda Constitucional nº 132, de 20 de dezembro de 2023. Altera o Sistema Tributário Nacional. *Diário Oficial da União*: seção 1, Brasília, DF, 21 dez. 2023. Disponível em: https://www.planalto.gov.br/ccivil_03/constituicao/emendas/emc/emc132.htm. Acesso em: 2 nov. 2026. [AV]

FUNDAÇÃO INSTITUTO DE PESQUISAS ECONÔMICAS (FIPE). *Índice FipeZAP*: locação comercial, julho de 2026. São Paulo, 2026. Disponível em: https://downloads.fipe.org.br/indices/fipezap/fipezap-202607-comercial.pdf. Acesso em: 2 nov. 2026.

IBGE. *Censo Demográfico 2022*: população residente por idade. Rio de Janeiro: IBGE, 2023. Disponível em: https://sidra.ibge.gov.br/tabela/9514. Acesso em: 2 nov. 2026. `[AV ano]`

IBGE. *Estimativas da população residente*: 2026. Rio de Janeiro: IBGE, 2026. Disponível em: https://www.ibge.gov.br/estatisticas/sociais/populacao/9103-estimativas-de-populacao.html. Acesso em: 2 nov. 2026.

IBGE. *Pesquisa Anual de Serviços (PAS)*: tabelas 2611, 2619 e 10758. Rio de Janeiro: IBGE, 2025-2026. Disponível em: https://sidra.ibge.gov.br/tabela/2611, https://sidra.ibge.gov.br/tabela/2619 e https://sidra.ibge.gov.br/tabela/10758. Acesso em: 2 nov. 2026. `[AV ano de cada edição]`

IBGE. *Pesquisa de Orçamentos Familiares 2017-2018*: perfil das despesas no Brasil: indicadores selecionados de alimentação, transporte, lazer e inclusão financeira. Rio de Janeiro: IBGE, 2021. Disponível em: https://biblioteca.ibge.gov.br/visualizacao/livros/liv101844.pdf. Acesso em: 2 nov. 2026.

IBGE. *Pesquisa de Orçamentos Familiares 2017-2018*: tabelas 6715 e 6972. Rio de Janeiro: IBGE, 2019. Disponível em: https://sidra.ibge.gov.br/tabela/6715 e https://sidra.ibge.gov.br/tabela/6972. Acesso em: 2 nov. 2026.

IBGE. *Pesquisa Nacional por Amostra de Domicílios Contínua*: tabelas 5436 e 7395. Rio de Janeiro: IBGE, 2026. Disponível em: https://sidra.ibge.gov.br/tabela/5436 e https://sidra.ibge.gov.br/tabela/7395. Acesso em: 2 nov. 2026.

IBGE. *Regiões de influência das cidades 2018*. Rio de Janeiro: IBGE, 2020. Disponível em: https://biblioteca.ibge.gov.br/visualizacao/livros/liv101728.pdf. Acesso em: 2 nov. 2026.

IBGE. *Sistema Nacional de Índices de Preços ao Consumidor*: IPCA, tabela 7060. Rio de Janeiro: IBGE, 2026. Disponível em: https://sidra.ibge.gov.br/tabela/7060. Acesso em: 2 nov. 2026.
