# 9 PLANO FINANCEIRO

O plano financeiro converte as decisões dos capítulos 5 a 8 em receitas, custos e indicadores de viabilidade. O modelo projeta o desenho enxuto do plano operacional na etapa de abertura: 6 mesas, 45 horas por semana, de terça a sábado, equipe de 3 empregados e o sócio e acervo com 175 jogos, num ponto na Pituba que já comporta 8 mesas. As etapas de expansão ficam fora do fluxo de caixa base, entrando apenas na análise estratégica (capítulo 10) e na simulação de Monte Carlo como opções.

A receita nasce do número de pessoas atendidas, estimado na seção 6.6 a partir da circulação medida no pico da São Jogue (B3), levada às demais horas e ao dia útil pelo índice "Horários de pico" dos concorrentes no Google Maps (B1). No mês maduro do cenário provável, a luderia recebe 49,5 pessoas por dia de fim de semana (sexta e sábado) e 31,9 por dia útil (terça a quinta), ou 843 pessoas por mês.

Cada pessoa gasta, em média, uma cesta de consumo: a taxa de entrada, uma bebida e o hambúrguer não vegetariano mais barato do cardápio. O gasto provável é o declarado pelos avaliadores no Google Maps (B2), em média, nos 18 concorrentes com taxa de entrada conhecida: R$ 78,94 por pessoa (seção 6.3). Desse gasto, R$ 19,65 são a taxa de entrada adotada, e R$ 59,29, alimentos e bebidas (A&B). Somado o aluguel de jogos para levar para casa, a receita por pessoa é:

receita por pessoa = gasto por pessoa + aluguel de jogos (2)

78,94 + 1,07 = R$ 80,01

O Quadro 9.1 organiza essas contas como uma árvore de direcionadores: cada linha de receita, custo ou investimento se desdobra em premissas, e cada premissa é uma linha do registro de premissas (seção 9.1).

**Quadro 9.1 – Árvore de direcionadores do modelo financeiro**

| Direcionador | Cálculo | Premissas |
|---|---|---|
| Pessoas por mês | circulação no pico × horas de pico equivalentes do dia × dias abertos × fator de rampa × semanas por mês, em separado para o fim de semana e o dia útil | R04, R05, R11, R12, R15 a R17, M02 |
| Receita de taxa de entrada | pessoas × taxa de entrada | R07 |
| Receita de A&B | pessoas × (gasto por pessoa − taxa de entrada) | R06, R07 |
| Receita de aluguel de jogos | aluguéis por mês × preço médio × fator de rampa | R09, R10 |
| Custos variáveis | Simples Nacional sobre a receita; CMV sobre o A&B; taxa de cartão | C01, C02, aba simples |
| Custos fixos | aluguel e condomínio; pessoal com encargos; pró-labore; utilidades; marketing; contabilidade; sistemas; reposição do acervo; refeição da equipe | C03 a C15 |
| Participação nos lucros | parcela do EBITDA anual, só quando positivo | C16 |
| Investimento | reforma; mobiliário; cozinha e bar; caixa; acervo; pré-operacional; itens sem cotação; caução; capital de giro | I01 a I08, I10 |

Fonte: elaborado pelo próprio autor.

As mesas do salão (R01), as pessoas por mesa (R02), a permanência (R03) e o horário (R13 e R14) não entram na receita: servem para conferir se a circulação cabe no salão e no horário (seção 9.6). A projeção é mensal nos 60 meses e anual nos demonstrativos. O mês é a unidade de cálculo porque o ano 1 tem rampa: o período em que o movimento cresce até o nível maduro. A rampa começa com 40% do fluxo maduro no mês 1 e chega a 100% no mês 9. Depois dela, o movimento fica constante até o ano 5: o modelo não supõe crescimento nem queda da demanda, porque não há dado que sustente nenhum dos dois.

Quatro elementos ficam fora do modelo, cada um por um motivo. A inflação fica fora porque todos os valores estão em preços de outubro de 2026 e a taxa de desconto é real, isto é, descontada da inflação; assim, receitas e custos não precisam de reajuste. O financiamento fica fora porque o plano supõe capital próprio; por isso, não há juros nem parcelas no fluxo de caixa. O imposto sobre o lucro não aparece em separado, porque o Simples Nacional já o inclui na alíquota sobre a receita (seção 8.1). As etapas de expansão ficam fora do fluxo base porque dependem de gatilhos de demanda e entram no capítulo 10 como opções.

## 9.1 REGISTRO DE PREMISSAS

Premissa é um valor que o modelo assume sobre o futuro, como o gasto por pessoa. O modelo tem 45 premissas, cada uma com três valores, um por cenário, além de fonte e nível de evidência (Apêndice E). O cenário provável usa o valor mais bem sustentado pelos dados; o pessimista e o otimista usam os extremos plausíveis da faixa. O Quadro 9.2 traz as dez premissas que mais movem o VPL entre os extremos da faixa, na ordem do tornado (seção 9.5).

**Quadro 9.2 – Premissas de maior impacto no VPL**

| ID | Premissa | Pessimista | Provável | Otimista | Amplitude no VPL (R$) | Nível |
|---|---|---|---|---|---|---|
| R04 | Circulação no pico de fim de semana (pessoas por hora) | 3,87 | 6,40 | 11,43 | 3.250.459 | N5 |
| R06 | Gasto por pessoa (R$) | 40,00 | 78,94 | 111,09 | 2.035.950 | N3 |
| C04 | Aluguel comercial (R$ por m² ao mês) | 75,00 | 63,79 | 50,00 | 410.105 | N3 |
| C01 | CMV de alimentos e bebidas (% do A&B) | 35% | 30% | 26% | 331.877 | N2 |
| M01 | Taxa mínima de atratividade real (% ao ano) | 18% | 15% | 12% | 249.297 | N2 + N6 |
| C09 | Utilidades (R$ por mês) | 6.000,00 | 4.500,00 | 3.500,00 | 195.000 | N6 |
| C08 | Pró-labore (R$ por mês) | 4.000,00 | 3.000,00 | 2.000,00 | 156.000 | N6 |
| R05 | Horas de pico equivalentes por dia útil (h) | 4,51 | 4,98 | 4,98 | 142.531 | N3 |
| I01 | Reforma e instalações (R$ por m²) | 1.052,75 | 816,18 | 643,14 | 123.832 | N2 + N3 + N6 |
| R09 | Aluguéis de jogos (por mês) | 10 | 30 | 60 | 91.157 | N6 |

Fonte: elaborado pelo próprio autor, com base no modelo financeiro (Apêndice E) e nos Blocos B1 a B5 (10 e 11/2026).

As premissas de demanda vêm da contagem direta na São Jogue (B3). Nas quatro noites, entraram de 4,03 a 11,43 pessoas por hora, com média simples de 6,40, em que cada visita pesa o mesmo (Tabela 3.1). A circulação provável é essa média, e a otimista, a maior visita. A média é puxada pela visita de 10/10, a única acima de 5,26: a mediana das quatro é de 5,08, e a média ponderada pelas horas, 74 pessoas em 10,92 horas, de 6,78. Com a mediana, o VPL fica negativo, porque ela fica abaixo da ruptura da seção 9.5; com a média ponderada, sobe. A escolha da média simples segue o desenho das visitas, uma noite por unidade e por dia, mas a distância entre média e mediana mostra o quanto o provável depende de uma só noite. A circulação não é reduzida na proporção das mesas, de 10 na São Jogue para 6 no plano: a demanda vem do público, não do tamanho do salão, enquanto o salão não lota. Nas visitas, a São Jogue não lotou: a ocupação média das mesas foi de 30% a 67%. O salão de 6 mesas comporta até 11,9 pessoas por hora, com grupos de 3,6 pessoas e permanência média de 109 minutos.

A circulação pessimista vem das notas fiscais (NFC-e) da São Jogue. A Bela Vista emitiu 30,5 notas por dia, e a Paralela, 16,1. A nota só sai quando o cliente pede, e o número de pessoas por nota não foi medido: uma nota pode cobrir um grupo inteiro ou uma só pessoa. As notas são, portanto, um piso das vendas, e não uma contagem de clientes. O modelo supõe uma nota por pessoa e usa o caminho inverso da equação 1 para converter as notas em circulação no pico, com as horas de pico equivalentes dos sete dias do horário da São Jogue, 42,15 por semana. O resultado é de 5,07 pessoas por hora na Bela Vista e 2,67 na Paralela, com média de 3,87. O pessimista usa as notas, e não a visita de menor circulação (4,03), porque elas cobrem 19 dias e todas as horas abertas, e não só uma noite; os dois valores ficam próximos e abaixo da ruptura (5,89), o que explica o VPL negativo do pessimista. As horas de pico equivalentes do fim de semana (R15) e do dia útil (R05) vêm da curva média do índice "Horários de pico" dos concorrentes (N3; seção 6.6); o pessimista usa a curva mediana, mais baixa. Não há otimista acima da média, porque a curva já mede o movimento de casas estabelecidas.

Os preços vêm dos concorrentes (seção 6.3). A cesta de consumo de cada concorrente soma a taxa de entrada, a mediana das bebidas e o hambúrguer não vegetariano mais barato do cardápio, prato presente em quase todas as casas, o que torna as cestas comparáveis entre elas. Quando a taxa muda com o dia, entra a média das taxas, ponderada pelos dias em que cada uma vale. Nos 18 concorrentes com taxa de entrada conhecida e gasto declarado, o gasto médio é de R$ 78,94: média simples dos gastos das casas, cada uma pela média das declarações no ponto médio das faixas (seção 6.3). Nos 14 deles com cesta completa, a cesta média é de R$ 71,09: cada pessoa gasta pouco mais de uma cesta de consumo. O gasto pessimista é o do concorrente de menor gasto, R$ 40,00, e o otimista, o do de maior gasto, R$ 111,09. A taxa de entrada é a adotada na seção 6.3, R$ 19,65 nos três cenários (R07), e o restante do gasto é A&B. Com isso, o cenário muda o volume e o gasto em A&B.

Do lado dos custos, o modelo usa dados públicos sempre que possível: o aluguel dos anúncios do Bloco B5, os salários das medianas de admissão em Salvador no Novo CAGED e o custo das mercadorias vendidas (CMV) da PAS. O CMV é o custo dos ingredientes e das bebidas que a casa revende. Nos serviços de alimentação, as mercadorias e os materiais de consumo e de reposição somaram 29,6% da receita líquida em 2023 (IBGE, PAS 2023), e o consumo de mercadorias, 26,8% em 2024 (IBGE, PAS 2024, tabela 10758; seção 5.1). O provável fica em 30% da receita de A&B, perto do dado de 2023, que inclui os materiais de consumo de uma cozinha; o otimista, em 26%, perto do de 2024; e o pessimista, em 35%, para a perda e o desperdício de uma casa nova. O salário de admissão tende a ficar abaixo do pago a quem já está no cargo; por isso, o pessimista soma 11,4% aos salários, a maior distância entre o 3º quartil e a mediana de admissão entre os cargos da equipe. O ponto fica na Pituba, com área para 8 mesas desde a abertura, para a etapa de mesas não exigir mudança nem obra (decisão do autor; seção 7.1). A área e o aluguel vêm dos 17 anúncios de 150 a 200 m² na Pituba (B5, nov/2026): área média de 182 m² e aluguel médio de R$ 11,6 mil por mês, ou R$ 63,79 por m², com condomínio e IPTU de 11,8% do aluguel. O pessimista e o otimista usam o 3º e o 1º quartil do preço por m², R$ 75,00 e R$ 50,00. O preço pedido no anúncio tende a ficar acima do fechado. As despesas gerais não têm cotação e ficam em N6; reforma, mobiliário, cozinha e informática vêm do orçamento da etapa 1 (seção 9.2). A refeição da equipe (C14 e C15) e a PLR (C16) são decisões do autor (N6) sobre benefícios, e não dados medidos.

Falta a taxa que traz os valores futuros para o presente. A TMA é o retorno mínimo que o investidor exige para pôr o dinheiro na luderia, em vez de aplicá-lo numa alternativa segura (seção 2.5). Ela soma duas parcelas: o juro real, que é o ganho de uma aplicação segura acima da inflação, e um prêmio pelo risco de um pequeno negócio novo. O juro real sai da Selic meta de 14,0% (BCB, set/2026) e do IPCA esperado de 4,3% para 2027 (Focus):

juro real = (1 + Selic) ÷ (1 + IPCA esperado) − 1 (3)

1,140 ÷ 1,043 − 1 = 9,3% ao ano

A TMA provável é de 15% ao ano, um prêmio de 5,7 pontos percentuais sobre o juro real. O prêmio não vem de uma base de dados (N6), e três razões sustentam o valor. Primeiro, ele soma o risco de um pequeno negócio novo, em que 25,8% das micro e pequenas empresas fecham nos primeiros cinco anos (SEBRAE, 2024), e o de liquidez de um investimento sem mercado, que não se vende rápido por um valor justo (ASSAF NETO, 2014, p. 89). Segundo, o risco de demanda e de preço já está nos cenários e no Monte Carlo, e um prêmio alto o contaria duas vezes. Terceiro, a escolha pesa pouco na decisão: o VPL provável fica positivo até uma TMA de 24,9% (seção 9.5). Os cenários usam prêmios de cerca de 3 e 9 pontos: TMA de 12% no otimista e de 18% no pessimista. A Figura 9.1 mostra que o Focus prevê queda da Selic até 2029, o que favorece a TMA otimista.

**Figura 9.1 – Selic meta e IPCA em 12 meses, com projeção do Relatório Focus**

![Selic meta e IPCA em 12 meses, com projeção do Relatório Focus](../graficos/9-1_selic_ipca.png)

Fonte: elaborado pelo próprio autor, com base no Banco Central do Brasil, SGS (séries 432 e 13522) e Relatório Focus de 11/09/2026.

## 9.2 INVESTIMENTO INICIAL

O investimento inicial é o dinheiro gasto antes da abertura: obra, equipamentos, acervo, caução e uma reserva de caixa. A Tabela 9.1 mostra os nove itens por cenário. No provável, o investimento é de R$ 382 mil, com a reforma (39%) e o capital de giro (17%) como maiores itens. A reforma cobre a área inteira do ponto, de 182 m², incluídos os cerca de 24 m² que só a etapa de mesas ocupa. Reforma, mobiliário, cozinha e informática vêm do orçamento item a item do Bloco B5 (seção 3.2.4), sem frete; a maquininha de cartão é cedida sem custo pelo banco. O acervo de 175 jogos custa R$ 35 mil, com faixa de 15% para cada lado: a variação típica do preço do mesmo jogo entre as lojas do B1. Quatro itens da abertura ficaram sem preço no B5: o letreiro, o balcão do caixa, a instalação de gás e os *sleeves* (capas plásticas) das cartas do acervo. Eles entram como uma verba estimada pelo autor (I10, N6), de R$ 17 mil no provável, de R$ 11 mil a R$ 25 mil nos cenários.

**Tabela 9.1 – Investimento inicial por cenário (R$)**

| Item | Pessimista | Provável | Otimista |
|---|---|---|---|
| Reforma e instalações | 191.389,95 | 148.381,52 | 116.922,85 |
| Mobiliário | 18.768,82 | 14.806,11 | 12.006,37 |
| Cozinha e bar | 89.253,32 | 38.917,61 | 32.331,02 |
| Caixa e informática | 9.764,79 | 7.762,90 | 5.414,15 |
| Acervo inicial de jogos | 40.285,51 | 35.030,88 | 29.776,25 |
| Gastos pré-operacionais | 30.000,00 | 20.000,00 | 12.000,00 |
| Itens sem cotação (letreiro, balcão, gás e sleeves) | 25.000,00 | 17.000,00 | 11.000,00 |
| Caução do aluguel | 40.905,00 | 34.791,07 | 18.180,00 |
| Capital de giro | 121.780,56 | 65.428,60 | 38.445,64 |
| Total | 567.147,95 | 382.118,69 | 276.076,28 |

Fonte: elaborado pelo próprio autor, com base no modelo financeiro (Apêndice E) e no Bloco B5 (SINAPI de set/2026; anúncios de 03/11/2026; anúncios de aluguel de 12/11/2026).

O capital de giro é a reserva de caixa que paga as contas enquanto a receita ainda não cobre os custos. Ele equivale a dois meses de custos fixos, R$ 65 mil, e cobre os primeiros meses da rampa, em que a receita ainda fica abaixo dos custos. A caução são três meses de aluguel, exigidos pelo locador como garantia. Os dois valores ficam presos no negócio enquanto ele funciona e só voltam ao caixa se ele fechar (seção 9.3). A cozinha completa desde a abertura custa R$ 39 mil e sustenta o CMV de 30%; no pessimista, com a lava-louças de capota, chega a R$ 89 mil.

## 9.3 RECEITAS, CUSTOS E RESULTADOS PROJETADOS

Na maturidade, o cenário provável atende 843 pessoas por mês, cerca de 39 por dia aberto, e a receita bruta mensal chega a R$ 67,5 mil. A Tabela 9.2 separa essa receita em três fontes e a confronta com os custos do mês.

**Tabela 9.2 – Receita e custos mensais no cenário provável, mês maduro (R$)**

| Conta | Valor mensal | Participação na receita bruta (%) |
|---|---|---|
| Taxa de entrada | 16.566,78 | 24,6 |
| Alimentos e bebidas | 49.987,00 | 74,1 |
| Aluguel de jogos | 900,00 | 1,3 |
| Receita bruta | 67.453,79 | 100,0 |
| Simples Nacional | 5.984,75 | 8,9 |
| CMV de A&B | 14.996,10 | 22,2 |
| Taxa de cartão | 2.023,61 | 3,0 |
| Pessoal com encargos (3 empregados) | 8.023,34 | 11,9 |
| Refeição da equipe | 782,40 | 1,2 |
| Aluguel, condomínio e IPTU | 12.966,63 | 19,2 |
| Pró-labore e despesas gerais | 10.941,92 | 16,2 |
| Subtotal: custos fixos (as quatro linhas anteriores) | 32.714,30 | 48,5 |
| Participação nos lucros (5% do EBITDA, provisão mensal) | 586,75 | 0,9 |
| Resultado operacional (EBITDA) | 11.148,27 | 16,5 |

Fonte: elaborado pelo próprio autor, com base no modelo financeiro (Apêndice E).

Os custos se dividem em dois tipos. Os variáveis crescem com cada pessoa atendida: o Simples Nacional, o CMV e a taxa de cartão. Os fixos não mudam com o movimento: pessoal, aluguel, pró-labore e despesas gerais. O ponto é o maior custo fixo: R$ 13,0 mil por mês com condomínio e IPTU, porque a área já comporta a etapa de mesas. O pessoal vem depois: 3 empregados, com remuneração de R$ 5,6 mil, já com os adicionais da escala, e encargos, provisões e vale-transporte de 43,5%. A refeição da equipe soma R$ 0,8 mil. A participação nos lucros (PLR) não é custo fixo: é 5% do EBITDA de cada ano, paga só quando ele é positivo (seção 7.5). O A&B é a maior receita, com 74,1%, porque a taxa de entrada, de R$ 19,65, é cerca de um quarto do gasto por pessoa. O Simples Nacional custa 8,9% da receita, com o enquadramento da seção 8.1.

A margem de contribuição é o que sobra de cada pessoa atendida depois dos custos variáveis. É essa sobra que paga os custos fixos e, depois deles, gera lucro:

margem por pessoa = receita por pessoa − Simples − CMV − cartão (4)

80,01 − 7,10 − 17,79 − 2,40 = R$ 52,72

Cada pessoa deixa R$ 52,72, ou 66% do que paga, para cobrir os custos fixos de R$ 32,7 mil por mês. O ponto de equilíbrio operacional é o movimento em que essa margem paga exatamente os custos fixos, sem lucro nem prejuízo:

pessoas no equilíbrio = custos fixos ÷ margem por pessoa (5)

32.714,30 ÷ 52,72 = 621 pessoas por mês

O equilíbrio exige 621 pessoas por mês, 28,6 por dia aberto, o que equivale a R$ 49,6 mil de receita mensal. O cenário provável fica 36% acima desse ponto. A PLR não muda o equilíbrio: com EBITDA zero, ela também é zero. A conta usa as alíquotas do ano maduro.

A Tabela 9.3 junta o resultado de cada ano e o fluxo de caixa. O resultado operacional antes de juros, impostos, depreciação e amortização (EBITDA) é a receita menos todos os custos que saem do caixa: mede o dinheiro que a operação gera. A depreciação é a perda de valor dos bens pelo uso, lançada como custo ao longo da vida útil, sem saída de dinheiro. No cenário provável, o EBITDA é positivo desde o ano 1, mesmo com a rampa, mas o lucro do ano 1 fica negativo depois da depreciação. A partir do ano 2, o EBITDA é de R$ 134 mil por ano, já descontada a PLR de R$ 7 mil, e o lucro, depois da depreciação de R$ 51 mil, de R$ 83 mil.

O fluxo de caixa registra o dinheiro que entra e sai em cada ano: o investimento no ano 0 e o EBITDA nos anos 1 a 5. No ano 5 entra o valor residual: o valor que o negócio ainda tem no fim do horizonte, já que a luderia não fecha no ano 6. Como o negócio segue aberto, a caução e o capital de giro continuam presos nele e não voltam ao caixa: o valor residual já os inclui, e somá-los a ele contaria o mesmo dinheiro duas vezes. Só no cálculo sem valor residual, em que a luderia fecha no fim do ano 5, os dois voltam. O modelo calcula esse valor como uma perpetuidade, isto é, supõe que o resultado do ano 5 se repete todos os anos, sem crescimento, e traz essa sequência para o valor presente pela TMA (ASSAF NETO, 2014). Do EBITDA sai um reinvestimento igual à depreciação, para repor os bens gastos:

valor residual = (EBITDA do ano 5 − depreciação) ÷ TMA (6)

(133.779 − 51.007) ÷ 0,15 = R$ 551.812

A Tabela 9.3 também traz o fluxo descontado: cada valor futuro dividido por 1,15 elevado ao número de anos, o que o torna comparável ao dinheiro de hoje. A última linha acumula esses valores e, no ano 5, chega ao VPL. Sem o valor residual, o VPL provável segue positivo (seção 9.4).

**Tabela 9.3 – Demonstração do resultado e fluxo de caixa projetados, cenário provável (R$)**

| Conta | Ano 0 | Ano 1 | Ano 2 | Ano 3 | Ano 4 | Ano 5 |
|---|---|---|---|---|---|---|
| Receita bruta | 0 | 627.320 | 809.445 | 809.445 | 809.445 | 809.445 |
| (-) Simples Nacional | 0 | -51.254 | -71.817 | -71.817 | -71.817 | -71.817 |
| (-) CMV e taxa de cartão | 0 | -158.283 | -204.237 | -204.237 | -204.237 | -204.237 |
| Margem de contribuição | 0 | 417.783 | 533.392 | 533.392 | 533.392 | 533.392 |
| (-) Custos fixos | 0 | -392.572 | -392.572 | -392.572 | -392.572 | -392.572 |
| (-) Participação nos lucros (PLR) | 0 | -1.261 | -7.041 | -7.041 | -7.041 | -7.041 |
| EBITDA | 0 | 23.951 | 133.779 | 133.779 | 133.779 | 133.779 |
| (-) Depreciação e amortização | 0 | -51.007 | -51.007 | -51.007 | -51.007 | -51.007 |
| Lucro líquido | 0 | -27.057 | 82.772 | 82.772 | 82.772 | 82.772 |
| Investimento inicial | -382.119 | 0 | 0 | 0 | 0 | 0 |
| Valor residual | 0 | 0 | 0 | 0 | 0 | 551.812 |
| Fluxo de caixa | -382.119 | 23.951 | 133.779 | 133.779 | 133.779 | 685.592 |
| Fluxo descontado a 15% | -382.119 | 20.827 | 101.156 | 87.962 | 76.489 | 340.860 |
| Descontado acumulado | -382.119 | -361.292 | -260.136 | -172.174 | -95.685 | 245.175 |

Fonte: elaborado pelo próprio autor, com base no modelo financeiro (Apêndice E).

Nota: o lucro líquido não desconta impostos sobre o lucro, que já estão no Simples Nacional. A caução e o capital de giro não voltam no ano 5, porque o negócio segue aberto e o valor residual já os inclui. Sem o valor residual, a luderia fecha no fim do ano 5, a caução e o capital de giro (R$ 100.220) voltam ao caixa, e o VPL é de R$ 20.654.

## 9.4 INDICADORES DE VIABILIDADE

Os indicadores de viabilidade resumem o fluxo de caixa em respostas a três perguntas: quanto o negócio gera além do que a TMA exige, quanto ele rende e em quanto tempo devolve o investimento (seção 2.5). A Tabela 9.4 traz os indicadores do cenário provável e a faixa que a simulação de Monte Carlo dá a cada um (seção 9.5): o percentil 10 (P10), valor que 90% dos sorteios superam; a mediana; e o percentil 90 (P90), que só 10% superam.

**Tabela 9.4 – Indicadores de viabilidade: cenário provável e faixa do Monte Carlo**

| Indicador | Provável | P10 | Mediana | P90 |
|---|---|---|---|---|
| Investimento inicial (R$) | 382.119 | 366.765 | 392.258 | 418.892 |
| Receita bruta mensal madura (R$) | 67.454 | 47.309 | 68.245 | 98.393 |
| Ponto de equilíbrio mensal (R$) | 49.645 | 46.439 | 49.686 | 52.905 |
| EBITDA do ano 5 (R$) | 133.779 | 11.333 | 135.393 | 330.679 |
| VPL a 15% real (R$) | 245.175 | -402.677 | 240.583 | 1.501.736 |
| VPL sem valor residual (R$) | 20.654 | -402.677 | 14.596 | 628.806 |
| TIR real (%) | 30,7 | -24,4 | 30,0 | 81,6 |
| TIR real sem valor residual (%) | 16,8 | -24,4 | 16,2 | 62,9 |
| Payback descontado (anos) | 4,3 | 2,0 | 4,3 | mais de 5 |

Fonte: elaborado pelo próprio autor, com base no modelo financeiro (Apêndice E), com 10 mil sorteios.

Nota: cada percentil é calculado sobre a distribuição do próprio indicador; os valores de uma coluna não vêm do mesmo sorteio. O Monte Carlo aplica as decisões de gestão do Quadro 10.4: o G5 dispensa o cozinheiro no ano seguinte ao primeiro EBITDA negativo, e o G6 fecha o negócio se o prejuízo continuar, com a volta da caução e do capital de giro e a revenda dos ativos (I09); por isso, no P10, o VPL com e sem valor residual coincide. No cenário provável, os gatilhos não são acionados. Os cenários extremos, com todas as premissas no mesmo lado da faixa, dão VPL de −R$ 1,54 milhão no pessimista (−R$ 1,17 milhão com os gatilhos) e de R$ 7,5 milhões no otimista (Apêndice E).

O VPL soma o fluxo descontado e mostra quanto o negócio gera além do que a TMA exige. No provável, o VPL é de R$ 245 mil: o negócio paga os 15% ao ano e gera esse valor a mais, em dinheiro de hoje. Sem o valor residual, o VPL cai para R$ 21 mil e segue positivo, por pouco: a viabilidade depende de a luderia seguir aberta depois do ano 5.

A TIR é o rendimento anual do próprio negócio: a taxa que zera o VPL. A TIR provável é de 30,7% ao ano, em termos reais, duas vezes a TMA. Sem o valor residual, ela cai para 16,8%, pouco acima da TMA: a perpetuidade pesa no resultado, e a TIR sem ela é a leitura mais prudente. A TIR repousa em quatro visitas a uma só concorrente, e o VPL zera se a circulação no pico ficar 8% abaixo do provável, ou o gasto por pessoa, 9% (seção 9.5).

O payback descontado é o tempo até o fluxo descontado acumulado devolver o investimento. No provável, ele é de 4,3 anos, dentro do horizonte de 5 anos.

O ponto de equilíbrio completa a leitura: a receita madura fica 36% acima dos R$ 49,6 mil mensais que pagam os custos (seção 9.3).

A faixa do Monte Carlo mostra o que o provável sozinho esconde. A mediana dos sorteios fica perto do provável em todos os indicadores, mas a distribuição é assimétrica: no P10, o negócio perde R$ 403 mil e não devolve o investimento; no P90, ganha R$ 1,5 milhão. O risco está no lado de baixo da demanda e do gasto, e não no investimento nem no custo fixo, cuja faixa é estreita. A decisão depende de onde as premissas críticas ficam (seção 9.5).

## 9.5 TRIANGULAÇÃO, SENSIBILIDADE E PONTO DE RUPTURA

A análise de sensibilidade mede quanto o VPL muda quando uma premissa muda (seção 2.5). A Figura 9.2 mostra o tornado: cada barra leva uma premissa ao pessimista e ao otimista, com as demais no provável. As barras são ordenadas da maior para a menor, o que dá ao gráfico a forma de um funil.

Duas premissas concentram o risco: a circulação no pico (R04) e o gasto por pessoa (R06), cada uma com efeito de R$ 2 milhões ou mais sobre o VPL entre os extremos da faixa. As três seguintes, com efeito de R$ 250 mil a R$ 410 mil, completam as premissas críticas: o aluguel (C04), o CMV (C01) e a TMA (M01). As duas primeiras têm dado próprio: a circulação vem da contagem direta (N5), e o gasto, das avaliações e dos cardápios dos concorrentes (N3).

**Figura 9.2 – Tornado: VPL com cada premissa no extremo da faixa e as demais no provável**

![Tornado do VPL](../graficos/9-2_tornado.png)

Fonte: elaborado pelo próprio autor, com base no modelo financeiro (Apêndice E).

A circulação pesa mais que o gasto porque a faixa medida é mais larga: a maior visita teve 2,8 vezes a circulação da menor. As duas multiplicam a taxa e o A&B ao mesmo tempo. O teto do salão não encurta o lado otimista: as 11,43 pessoas por hora da maior visita ficam abaixo das 11,9 que o salão comporta.

O tornado move uma premissa por vez; a simulação de Monte Carlo move todas juntas. Ela sorteia 10 mil combinações de premissas dentro das faixas, calcula o VPL de cada uma e conta em quantas ele fica positivo. Em cada sorteio, os gatilhos de contingência e a etapa de mesas agem como decisões de gestão (Apêndice G). O VPL fica positivo em 62,1% dos cenários, com mediana de R$ 241 mil. Os gatilhos agem em poucos sorteios: o G5 em 11,5% e o encerramento pelo G6 em 6,0%. A etapa de mesas, com o custo completo (2 mesas, um instrutor, o segundo cozinheiro e o domingo), entra em 8,1% dos sorteios: só quando a demanda de pico chega a 85% do teto do salão de 6 mesas. Os 62,1% dependem das hipóteses da simulação: das faixas do registro de premissas, da distribuição PERT e da independência entre as premissas. Se a circulação e o gasto caíssem juntos, como numa crise de renda, a probabilidade seria menor.

O ponto de ruptura é o valor de uma premissa que zera o VPL, com as demais no provável (seção 2.5). Ele transforma o resultado numa condição que pode ser acompanhada. A Tabela 9.5 traz a ruptura das cinco premissas críticas. O negócio é viável, por exemplo, enquanto a circulação no pico ficar acima de 5,89 pessoas por hora: 8% abaixo do provável.

**Tabela 9.5 – Ponto de ruptura das premissas críticas (VPL = 0)**

| ID | Premissa | Provável | Ruptura | Faixa testada | Valor medido | Nível |
|---|---|---|---|---|---|---|
| R04 | Circulação no pico de fim de semana (pessoas por hora) | 6,40 | 5,89 | 3,87 a 11,43 | 4,03 a 11,43 por visita, mediana de 5,08 (B3) | N5 |
| R06 | Gasto por pessoa (R$) | 78,94 | 71,91 | 40,00 a 111,09 | 40,00 a 111,09, gasto médio de 18 concorrentes (B2) | N3 |
| C04 | Aluguel comercial (R$ por m² ao mês) | 63,79 | 78,71 | 75,00 a 50,00 | 50,00 a 75,00 do 1º ao 3º quartil, 17 anúncios na Pituba (B5) | N3 |
| C01 | CMV de alimentos e bebidas (% do A&B) | 30% | 36,6% | 35% a 26% | 29,6% (IBGE, PAS 2023) | N2 |
| M01 | Taxa mínima de atratividade real (% ao ano) | 15% | 24,9% | 18% a 12% | juro real de 9,3% (BCB) | N2 + N6 |

Fonte: elaborado pelo próprio autor, com base no modelo financeiro (Apêndice E) e nos Blocos B1 a B5 (10/10/2026 a 12/11/2026).

Nota: a faixa testada vai do pessimista ao otimista do registro de premissas.

Só a circulação e o gasto têm ruptura dentro da faixa: a circulação 8% abaixo do provável, e o gasto, 9%. A ruptura da circulação, de 5,89 pessoas por hora, fica acima de três das quatro visitas e da mediana delas (5,08): o provável só passa da ruptura por causa da noite de 10/10. As outras três premissas não mudam o sinal do VPL dentro da faixa: o aluguel teria de passar de R$ 78,71 por m², 5% acima do 3º quartil dos anúncios, o CMV, de 37% do A&B, e a TMA, de 24,9% ao ano. A ruptura define o equilíbrio econômico do negócio: o movimento em que o VPL é zero. Esse ponto fica acima do equilíbrio operacional da seção 9.3, porque, além dos custos do mês, o negócio precisa devolver o investimento com a TMA.

A Tabela 9.6 junta os números de demanda do capítulo numa escada, em pessoas por dia aberto, das notas fiscais ao teto do salão. Dois degraus vêm de fora do modelo: as NFC-e emitidas por dia na São Jogue (B3), 30,5 na Bela Vista e 16,1 na Paralela. Elas entram como ordem de grandeza, com uma nota por pessoa: a nota só sai a pedido, e o número de pessoas por nota não foi medido.

**Tabela 9.6 – Escada da demanda, do piso de clientes à capacidade do salão**

| Degrau | Pessoas por dia aberto | Origem |
|---|---|---|
| NFC-e por dia da São Jogue Paralela | 16,1 | Bloco B3 |
| Equilíbrio operacional (EBITDA = 0) | 28,6 | Equação 5 (seção 9.3) |
| NFC-e por dia da São Jogue Bela Vista | 30,5 | Bloco B3 |
| Equilíbrio econômico (VPL = 0) | 35,8 | Ruptura da circulação no pico (Tabela 9.5) |
| Cenário provável | 38,9 | Equação 1 (início do capítulo) |
| Capacidade do salão | 107 | Seção 7.2 |

Fonte: elaborado pelo próprio autor, com base no modelo financeiro (Apêndice E) e no Bloco B3 (10/10/2026 a 30/10/2026).

Nota: o equilíbrio econômico usa a ruptura da circulação no pico, com as demais premissas no provável. A São Jogue abre todos os dias, e o dia de calendário é também o dia aberto.

A escada mostra três coisas. Primeiro, o provável fica 1,3 vez acima das notas da Bela Vista, na mesma ordem de grandeza. Segundo, o provável usa 36% da capacidade do salão, o que deixa folga para o pico. Terceiro, o provável fica 9% acima do equilíbrio econômico: o negócio tolera perder 8% dos clientes do provável antes de o VPL zerar. O equilíbrio econômico já passa das notas da Bela Vista, porque o ponto paga, desde a abertura, a área da etapa de mesas. A plausibilidade de ficar acima das rupturas, os gatilhos de contingência e as opções de expansão são discutidos no capítulo 10.

## 9.6 CHECAGENS DE COERÊNCIA

A capacidade comporta a demanda: as 39 pessoas por dia aberto usam 36% da capacidade do salão, de 107 pessoas por dia aberto (capítulo 7). No pico, a circulação provável de 6,40 pessoas por hora, com permanência de 109 minutos, ocupa 3,2 das 6 mesas.

A comparação com o setor mostra onde a luderia se afasta dos serviços de alimentação. O CMV de A&B soma 22,2% da receita bruta, abaixo dos 26,8% do consumo de mercadorias no setor (IBGE, PAS 2024), porque a taxa de entrada não tem custo de mercadoria. A folha com encargos custa 11,9% da receita, e 13,1% com as refeições, contra 25,1% de gastos com pessoal no setor (IBGE, PAS 2024); a diferença vem da equipe de 3 empregados do desenho enxuto, com o sócio no caixa e no salão. O aluguel com condomínio custa 19,2%, contra 4,0% no setor. O ponto é o custo que mais se afasta do setor: paga, desde a abertura, a área da etapa de mesas, e o aluguel pedido nos anúncios ainda precisa da cotação com corretor.

No preço, a taxa de entrada de R$ 19,65 é 24,9% do gasto provável, abaixo dos 27,4% que a taxa pesa na cesta dos 14 concorrentes com cesta completa, e fica perto da mediana de R$ 20,00 dos concorrentes que cobram, abaixo dos R$ 28,00 da São Jogue no fim de semana (seção 6.3).

**Referências citadas neste capítulo**

ASSAF NETO, Alexandre. *Finanças corporativas e valor*. 7. ed. São Paulo: Atlas, 2014.

BANCO CENTRAL DO BRASIL (BCB). *Relatório Focus*: expectativas de mercado de 11 set. 2026. Brasília, 2026. Disponível em: https://www.bcb.gov.br/content/focus/focus/R20260911.pdf. Acesso em: 2 nov. 2026.

BANCO CENTRAL DO BRASIL (BCB). *Sistema Gerenciador de Séries Temporais (SGS)*: séries 432, 433, 1619 e 13522. Brasília, 2026. Disponível em: https://www3.bcb.gov.br/sgspub/. Acesso em: 14 out. 2026.

BRASIL. Constituição (1988). Emenda Constitucional nº 132, de 20 de dezembro de 2023. Altera o Sistema Tributário Nacional. *Diário Oficial da União*: seção 1, Brasília, DF, 21 dez. 2023. Disponível em: https://www.planalto.gov.br/ccivil_03/constituicao/emendas/emc/emc132.htm. Acesso em: 2 nov. 2026. [AV]

FUNDAÇÃO INSTITUTO DE PESQUISAS ECONÔMICAS (FIPE). *Índice FipeZAP*: locação comercial, julho de 2026. São Paulo, 2026. Disponível em: https://downloads.fipe.org.br/indices/fipezap/fipezap-202607-comercial.pdf. Acesso em: 2 nov. 2026.

IBGE. *Censo Demográfico 2022*: população residente por idade. Rio de Janeiro: IBGE, 2023. Disponível em: https://sidra.ibge.gov.br/tabela/9514. Acesso em: 2 nov. 2026.

IBGE. *Estimativas da população residente*: 2026. Rio de Janeiro: IBGE, 2026. Disponível em: https://www.ibge.gov.br/estatisticas/sociais/populacao/9103-estimativas-de-populacao.html. Acesso em: 2 nov. 2026.

IBGE. *Pesquisa Anual de Serviços (PAS)*: tabelas 2611, 2619 e 10758. Rio de Janeiro: IBGE, 2025-2026. Disponível em: https://sidra.ibge.gov.br/tabela/2611, https://sidra.ibge.gov.br/tabela/2619 e https://sidra.ibge.gov.br/tabela/10758. Acesso em: 2 nov. 2026. `[AV ano de cada edição]`

IBGE. *Pesquisa de Orçamentos Familiares 2017-2018*: perfil das despesas no Brasil: indicadores selecionados de alimentação, transporte, lazer e inclusão financeira. Rio de Janeiro: IBGE, 2021. Disponível em: https://biblioteca.ibge.gov.br/visualizacao/livros/liv101844.pdf. Acesso em: 2 nov. 2026.

IBGE. *Pesquisa de Orçamentos Familiares 2017-2018*: tabelas 6715 e 6972. Rio de Janeiro: IBGE, 2019. Disponível em: https://sidra.ibge.gov.br/tabela/6715 e https://sidra.ibge.gov.br/tabela/6972. Acesso em: 2 nov. 2026.

IBGE. *Pesquisa Nacional por Amostra de Domicílios Contínua*: tabelas 5436 e 7395. Rio de Janeiro: IBGE, 2026. Disponível em: https://sidra.ibge.gov.br/tabela/5436 e https://sidra.ibge.gov.br/tabela/7395. Acesso em: 2 nov. 2026.

IBGE. *Regiões de influência das cidades 2018*. Rio de Janeiro: IBGE, 2020. Disponível em: https://biblioteca.ibge.gov.br/visualizacao/livros/liv101728.pdf. Acesso em: 2 nov. 2026.

IBGE. *Sistema Nacional de Índices de Preços ao Consumidor*: IPCA, tabela 7060. Rio de Janeiro: IBGE, 2026. Disponível em: https://sidra.ibge.gov.br/tabela/7060. Acesso em: 2 nov. 2026.

SEBRAE. *Sobrevivência das empresas mercantis brasileiras (2019–2023)*: relatório técnico. Brasília: Sebrae, 2024. Disponível em: https://datasebrae.com.br/wp-content/uploads/2024/09/2024-08-13-Relatorio-tecnico-Sobrevivencia-das-empresas-mercantis-brasileiras.pdf. Acesso em: 2 nov. 2026.
