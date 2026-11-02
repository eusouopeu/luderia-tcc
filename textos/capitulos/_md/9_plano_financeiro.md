# 9 PLANO FINANCEIRO

O plano financeiro converte as decisões dos capítulos 5 a 8 em receitas, custos e indicadores de viabilidade. O modelo projeta o desenho enxuto do cap. 7 na etapa de abertura: 6 mesas, 48 horas por semana, equipe de 6 e acervo de 175 títulos. As etapas de expansão ficam fora do fluxo de caixa base e entram no cap. 10 como opções. O capítulo parte da estrutura do modelo e do registro de premissas, projeta investimento, resultado e fluxo de caixa e termina na sensibilidade e nas checagens de coerência. A receita da luderia depende de três grandezas físicas e de dois preços. As pessoas atendidas saem das mesas ocupadas, das pessoas por mesa e dos giros por dia, e a receita sai dessas pessoas multiplicadas pela taxa de entrada e pelo consumo de alimentos e bebidas (A&B). O consumo por pessoa é a cesta de consumo, uma bebida e uma entrada ou prato, dividida pelas pessoas que a compartilham. As mesas ocupadas se separam em fim de semana (sexta a domingo) e dia útil (terça a quinta). Cada folha da árvore corresponde a uma linha do registro de premissas (Quadro 9.1).

**Quadro 9.1 – Árvore de direcionadores do modelo financeiro**

| Direcionador | Cálculo | Premissas |
|---|---|---|
| Pessoas por mês | mesas ocupadas × pessoas por mesa × giros por dia × dias abertos × fator de rampa × semanas por mês, em separado para fim de semana e dia útil | R02, R04, R05, R11, R12, R15 a R17, M02 |
| Receita de taxa de entrada | pessoas × taxa de entrada | R06 |
| Receita de A&B | pessoas × cesta de consumo ÷ pessoas por cesta | R07, R08 |
| Receita de aluguel de jogos | aluguéis por mês × preço médio × fator de rampa | R09, R10 |
| Custos variáveis | Simples Nacional sobre a receita; CMV sobre o A&B; taxa de cartão | C01, C02, aba simples |
| Custos fixos | aluguel e condomínio; pessoal com encargos; pró-labore; utilidades; marketing; contabilidade; sistemas; reposição do acervo | C03 a C13 |
| Investimento | reforma; mobiliário; cozinha e bar; caixa; acervo; pré-operacional; caução; capital de giro | I01 a I08 |

Fonte: elaboração própria.

As mesas do salão (R01), a permanência (R03) e o horário (R13 e R14) não entram na receita: conferem se as mesas ocupadas e os giros cabem no salão e no horário (seção 9.6). O modelo usa preços constantes de outubro de 2026 e taxa mínima de atratividade (TMA) real. A projeção é mensal nos 60 meses, para capturar a rampa do ano 1, e anual nos demonstrativos.

## 9.1 REGISTRO DE PREMISSAS

O modelo tem 41 premissas, cada uma com faixa pessimista, provável e otimista, fonte e nível de evidência (Apêndice [letra]). O Quadro 9.2 traz as que movem o VPL em mais de R$ 100 mil entre os extremos da faixa.

**Quadro 9.2 – Premissas de maior impacto no VPL**

| ID | Premissa | Pessimista | Provável | Otimista | Fonte | Nível |
|---|---|---|---|---|---|---|
| R02 | Pessoas por mesa ocupada | 2,5 | 3,6 | 5,5 | B3, 4 visitas; faixa do autor | N5 + N6 |
| R08 | Pessoas por cesta de consumo | 3 | 2 | 1 | Decisão do autor | N6 |
| R04 | Mesas ocupadas em média, fim de semana | 2,71 | 4,37 | 4,65 | B3, 4 visitas; teto do salão | N5 |
| R15 | Giros por mesa por dia | 3,61 | 4,01 | 4,41 | B3, NFC-e e permanência | N5 |
| R05 | Mesas ocupadas em dia útil (% do fim de semana) | 40% | 50% | 60% | Estimativa do autor | N6 |
| C03 | Área do ponto (m²) | 150 | 130 | 110 | Estimativa do autor | N6 |
| C04 | Aluguel comercial (R$/m² ao mês) | 64,35 | 54,15 | 45,00 | FipeZap, Salvador, jul/2026 | N2 |
| C01 | CMV de A&B | 35% | 30% | 26% | IBGE, PAS 2023 | N2 |
| C09 | Utilidades (R$ por mês) | 6.000,00 | 4.500,00 | 3.500,00 | Estimativa do autor | N6 |
| I01 | Reforma (R$/m²) | 1.400,00 | 1.000,00 | 600,00 | Estimativa do autor | N6 |
| C08 | Pró-labore (R$ por mês) | 4.000,00 | 3.000,00 | 2.000,00 | Estimativa do autor | N6 |
| M01 | TMA real | 18% | 15% | 12% | BCB; prêmio de risco do autor | N2 + N6 |
| C06 | Acréscimo sobre o salário de admissão | 11,4% | 0% | 0% | Novo CAGED, Salvador | N2 + N6 |
| C05 | Condomínio e IPTU (% do aluguel) | 30% | 20% | 10% | Estimativa do autor | N6 |
| C07 | Encargos sobre a folha | 45% | 37% | 30% | CLT; estimativa do autor | N1 + N6 |

Fonte: elaboração própria, com dados dos Blocos B1, B3 e B4 (out/2026).

As premissas de demanda vêm da contagem direta na São Jogue (B3). Nas quatro noites, os grupos tiveram 3,6 pessoas em média, a permanência média foi de 109 minutos, e 4,37 mesas ficaram ocupadas em média, de 2,69 a 6,02 por visita. A faixa das mesas ocupadas vai 38% para cada lado: é a distância média dos extremos observados até a média. O salão de 6 mesas corta o otimista em 4,65 mesas: nas visitas, o pico foi 1,29 vez a média, e uma média maior faria o pico passar do salão. As mesas ocupadas em dia útil são estimativa do autor (N6), em cerca de metade das do fim de semana, porque não houve visita em dia útil.

Os giros partem de dois limites medidos. O pessimista, de 3,61 grupos por mesa ocupada por dia, é calibrado para atender as NFC-e emitidas por dia na Paralela, 16,1, com a semana de funcionamento da São Jogue; como cada cliente recebe uma nota, mas a nota só sai a pedido, esse número é piso (seção 9.5). O otimista, de 4,41, divide as 8 horas abertas por dia pela permanência média de 109 minutos. O provável fica na média dos dois: 4,01. As horas de menor movimento das concorrentes ficam fora do horário (cap. 7), o que sustenta o giro calibrado num dia de 10 horas.

Os preços vêm dos cardápios dos concorrentes (seção 6.3). A taxa de entrada é a média das 22 casas que a cobram, R$ 18,68 por pessoa, em todos os dias. O consumo parte da cesta média de 36 casas, R$ 50,82, dividida por três pessoas no pessimista, duas no provável e uma no otimista: de R$ 16,94 a R$ 50,82 por pessoa. Taxa e cesta são iguais nos três cenários; a variação do consumo entra pelas pessoas por cesta. Com isso, o cenário muda o volume, e não o preço.

Do lado dos custos, o modelo usa bases públicas sempre que possível: o aluguel do FipeZap, os salários das medianas de admissão em Salvador no Novo CAGED e o CMV de 30% da PAS 2023. O salário de admissão tende a ficar abaixo do pago a quem já está no cargo; por isso, o pessimista soma 11,4% aos salários, a maior distância entre o 3º quartil e a mediana de admissão entre os cargos da equipe. Área, reforma, mobiliário, cozinha e despesas gerais não têm cotação e ficam em N6.

Falta a taxa que desconta esses fluxos. A TMA real provável é de 15% ao ano. A Selic meta de 14,0% (BCB, set/2026), descontado o IPCA esperado de 4,3% para 2027 (Focus), dá juro real de 9,3%, somado a um prêmio de 3 a 9 pontos percentuais pelo risco de pequeno negócio novo. A curva do Focus prevê queda da Selic até 2029 (Figura 9.1), o que favorece a TMA otimista.

**Figura 9.1 – Selic meta e IPCA em 12 meses, com projeção do Relatório Focus**

![Selic meta e IPCA em 12 meses, com projeção do Relatório Focus](../figuras/9_selic_ipca.png)

Fonte: elaboração própria, com base no Banco Central do Brasil, SGS (séries 432 e 13522) e Relatório Focus de 11/09/2026.

## 9.2 INVESTIMENTO INICIAL

O investimento inicial provável é de R$ 369 mil, com a reforma (35%) e o capital de giro (17%) como maiores itens (Tabela 9.1). O acervo de 175 títulos custa R$ 35 mil, com faixa de 15% para cada lado: a variação típica do preço do mesmo jogo entre as lojas do B1. O acervo também recebe sleeves em todas as cartas, ainda sem custo levantado [pendente].

**Tabela 9.1 – Investimento inicial por cenário (R$)**

| Item | Pessimista | Provável | Otimista |
|---|---|---|---|
| Reforma e instalações | 210.000,00 | 130.000,00 | 66.000,00 |
| Mobiliário | 44.000,00 | 33.000,00 | 22.000,00 |
| Cozinha e bar | 80.000,00 | 60.000,00 | 40.000,00 |
| Caixa e informática | 8.000,00 | 6.000,00 | 4.000,00 |
| Acervo inicial de jogos | 40.285,51 | 35.030,88 | 29.776,25 |
| Gastos pré-operacionais | 30.000,00 | 20.000,00 | 12.000,00 |
| Caução do aluguel | 28.957,50 | 21.118,50 | 9.900,00 |
| Capital de giro | 125.607,99 | 63.748,14 | 37.673,86 |
| Total | 566.851,00 | 368.897,52 | 221.350,11 |

Fonte: elaboração própria (aba investimento do modelo).

O A&B tem cozinha completa desde a abertura: R$ 60 mil de investimento e CMV de 30%. O capital de giro cobre dois meses de custos fixos, R$ 64 mil, e absorve o EBITDA negativo de R$ 14 mil do ano 1. O modelo supõe capital próprio, sem financiamento. Por isso, não há juros nem parcelas no fluxo de caixa.

## 9.3 RECEITAS, CUSTOS E RESULTADOS PROJETADOS

Na maturidade, o cenário provável atende 1.230 pessoas por mês, cerca de 47 por dia aberto, e a receita bruta mensal chega a R$ 55,1 mil (Tabela 9.2). A rampa começa em 40% do fluxo maduro e chega a 100% no mês 9.

**Tabela 9.2 – Receita e custos mensais no cenário provável, mês maduro (R$)**

| Conta | Valor mensal | Participação na receita bruta (%) |
|---|---|---|
| Taxa de entrada | 22.979,46 | 41,7 |
| Alimentos e bebidas | 31.258,46 | 56,7 |
| Aluguel de jogos | 900,00 | 1,6 |
| Receita bruta | 55.137,92 | 100,0 |
| Simples Nacional | 4.901,86 | 8,9 |
| CMV de A&B | 9.377,54 | 17,0 |
| Taxa de cartão | 1.654,14 | 3,0 |
| Pessoal com encargos (6 pessoas) | 12.484,75 | 22,6 |
| Aluguel, condomínio e IPTU | 8.447,40 | 15,3 |
| Pró-labore e despesas gerais | 10.941,92 | 19,8 |
| Subtotal: custos fixos (as três linhas anteriores) | 31.874,07 | 57,8 |
| Resultado operacional (EBITDA) | 7.330,31 | 13,3 |

Fonte: elaboração própria (abas receitas e custos do modelo).

O pessoal é o maior custo fixo: 6 pessoas, com folha de R$ 9,1 mil e encargos de 37%. O A&B é a maior receita, com 56,7%, porque a taxa média dos concorrentes é menor que a cesta dividida por dupla. O Simples Nacional custa 8,9% da receita, com o enquadramento da seção 8.1.

O cenário provável dá prejuízo só no ano 1, durante a rampa. A partir do ano 2, o EBITDA é de R$ 88 mil por ano, e o lucro, depois da depreciação de R$ 48 mil, de R$ 40 mil (Tabela 9.3). O fluxo de caixa (Tabela 9.4) repete o EBITDA, com o investimento no ano 0. No ano 5 voltam a caução e o capital de giro e entra o valor residual: a perpetuidade, sem crescimento, do EBITDA do ano 5 menos um reinvestimento igual à depreciação, descontada à TMA (ASSAF NETO, 2014). No provável, o valor residual é de R$ 270 mil. Sem ele, o VPL provável fica negativo (seção 9.4).

**Tabela 9.3 – Demonstração do resultado projetada, cenário provável (R$)**

| Conta | Ano 1 | Anos 2 a 5 (cada) |
|---|---|---|
| Receita bruta | 512.783 | 661.655 |
| (-) Simples Nacional | -42.100 | -58.822 |
| (-) CMV e taxa de cartão | -102.595 | -132.380 |
| Margem de contribuição | 368.088 | 470.453 |
| (-) Custos fixos | -382.489 | -382.489 |
| EBITDA | -14.401 | 87.964 |
| (-) Depreciação e amortização | -47.506 | -47.506 |
| Lucro líquido | -61.907 | 40.458 |

Fonte: elaboração própria (aba dre do modelo).

**Tabela 9.4 – Fluxo de caixa projetado, cenário provável (R$)**

| Conta | Ano 0 | Ano 1 | Ano 2 | Ano 3 | Ano 4 | Ano 5 |
|---|---|---|---|---|---|---|
| Investimento inicial | -368.898 | 0 | 0 | 0 | 0 | 0 |
| EBITDA | 0 | -14.401 | 87.964 | 87.964 | 87.964 | 87.964 |
| Caução e capital de giro devolvidos | 0 | 0 | 0 | 0 | 0 | 84.867 |
| Valor residual | 0 | 0 | 0 | 0 | 0 | 269.717 |
| Fluxo de caixa | -368.898 | -14.401 | 87.964 | 87.964 | 87.964 | 442.548 |
| Fluxo descontado a 15% | -368.898 | -12.523 | 66.513 | 57.838 | 50.294 | 220.024 |
| Descontado acumulado | -368.898 | -381.421 | -314.908 | -257.070 | -206.776 | 13.248 |

Fonte: elaboração própria (aba fluxo_caixa do modelo).

Nota: valor residual = (EBITDA do ano 5 - depreciação de R$ 47.506) ÷ TMA de 15%. O VPL é a soma do fluxo descontado, R$ 13.248; sem o valor residual, é de R$ -120.849.

## 9.4 INDICADORES DE VIABILIDADE

O negócio fica no limite da viabilidade no cenário provável. O VPL a 15% real é de R$ 13 mil, a TIR real é de 16,0% ao ano, um ponto acima da TMA, e o investimento se paga em 4,9 anos (Tabela 9.5). A receita madura fica 23% acima do ponto de equilíbrio operacional, de R$ 44,8 mil por mês. O resultado depende do valor residual: sem ele, o VPL provável é negativo em R$ 121 mil. Os cenários extremos põem todas as premissas no mesmo lado da faixa ao mesmo tempo: servem de limite, não de previsão. A decisão depende de onde as premissas críticas ficam (seção 9.5).

**Tabela 9.5 – Indicadores de viabilidade por cenário**

| Indicador | Pessimista | Provável | Otimista |
|---|---|---|---|
| Investimento inicial (R$) | 566.851 | 368.898 | 221.350 |
| Receita bruta mensal madura (R$) | 16.006 | 55.138 | 165.443 |
| Ponto de equilíbrio mensal (R$) | 56.063 | 44.828 | 37.193 |
| EBITDA do ano 5 (R$) | -358.991 | 87.964 | 1.039.273 |
| VPL a 15% real (R$) | -1.664.176 | 13.248 | 8.190.297 |
| VPL sem valor residual (R$) | -1.664.176 | -120.849 | 3.411.062 |
| TIR real (%) | n.a. | 16,0 | 416,2 |
| Payback descontado (anos) | mais de 5 | 4,9 | 0,3 |

Fonte: elaboração própria (aba sensibilidade do modelo).

Nota: cada cenário põe todas as premissas no mesmo extremo ao mesmo tempo, uma combinação pouco provável: o pessimista e o otimista marcam os limites da faixa, e não previsões. A distribuição conjunta está na simulação de Monte Carlo (seção 9.5). n.a.: não há TIR, porque o fluxo do pessimista não muda de sinal.

## 9.5 TRIANGULAÇÃO, SENSIBILIDADE E PONTO DE RUPTURA

O fluxo provável fica acima dos dois pisos de clientes da São Jogue. Pela numeração das NFC-e (B3), a Bela Vista emitiu 30,5 notas por dia e a Paralela, 16,1. Cada cliente recebe uma comanda e uma nota, mas a nota só sai quando o cliente pede: as notas são piso do número de clientes. O modelo atende 40,5 pessoas por dia de calendário no provável, 1,3 vez o piso da Bela Vista; o pessimista foi calibrado no piso da Paralela. A estimativa de demanda do cap. 6 completa a triangulação [pendente].

Quatro premissas de demanda concentram o risco: pessoas por mesa, pessoas por cesta de consumo, mesas ocupadas no fim de semana e giros por dia. Cada uma move o VPL em mais de R$ 500 mil entre os extremos da faixa (Figura 9.2). Três têm dado próprio (N5); as pessoas por cesta são decisão do autor (N6), o que viola a regra de robustez e exige destaque no cap. 10.

**Figura 9.2 – Tornado: VPL com cada premissa no extremo da faixa e as demais no provável**

![Tornado do VPL](../figuras/9_tornado.png)

Fonte: elaboração própria (aba sensibilidade do modelo).

As pessoas por mesa e as mesas ocupadas pesam mais porque multiplicam a taxa e a cesta ao mesmo tempo; as pessoas por cesta pesam só sobre o A&B. O teto do salão encurta o lado otimista das mesas ocupadas: o ganho máximo é de R$ 185 mil, contra uma perda de R$ 669 mil no pessimista. Na simulação de Monte Carlo, com 10 mil cenários sorteados dentro das faixas, o VPL fica positivo em 44,9% deles (Apêndice [letra]). O risco, portanto, pende para o lado da perda.

As cinco premissas críticas têm ruptura colada no provável (Tabela 9.6). O negócio é viável enquanto as mesas ocupadas no fim de semana ficarem acima de 4,35 em média, com as demais premissas no provável: 0,5% abaixo do provável.

**Tabela 9.6 – Ponto de ruptura das premissas críticas (VPL = 0)**

| ID | Premissa | Provável | Ruptura | Faixa testada | Medido no B3 | Nível |
|---|---|---|---|---|---|---|
| R02 | Pessoas por mesa ocupada | 3,6 | 3,58 | 2,5 a 5,5 | 2,4 a 4,6 por visita | N5 + N6 |
| R08 | Pessoas por cesta de consumo | 2 | 2,02 | 3 a 1 | n.a. | N6 |
| R04 | Mesas ocupadas em média, fim de semana | 4,37 | 4,35 | 2,71 a 4,65 | 2,69 a 6,02 por visita | N5 |
| R15 | Giros por mesa por dia | 4,01 | 3,99 | 3,61 a 4,41 | 3,61 (NFC-e) a 4,41 (horário ÷ permanência) | N5 |
| R05 | Mesas ocupadas em dia útil (% do fim de semana) | 50 | 49,3 | 40 a 60 | n.a. | N6 |

Fonte: elaboração própria (aba sensibilidade do modelo e Bloco B3, 2026).

Nota: n.a.: premissa sem medida no B3.

Todas as rupturas ficam dentro das faixas e a menos de 2% do provável. O provável é o ponto de equilíbrio econômico do negócio: qualquer desvio das premissas críticas decide o sinal do VPL. A plausibilidade de ficar acima das rupturas, os gatilhos de contingência e as opções de expansão são discutidos no cap. 10.

## 9.6 CHECAGENS DE COERÊNCIA

A capacidade comporta a demanda: as 47 pessoas por dia aberto usam 50% da capacidade do salão, de 95 pessoas por dia aberto (cap. 7). Os giros também cabem no horário: 4,01 grupos de 109 minutos ocupam 7,3 horas de mesa, contra 8 horas abertas por dia.

A equipe pesa menos que no setor, e o ponto, mais. A folha com encargos custa 22,6% da receita, contra 25,1% de gastos com pessoal nos serviços de alimentação, e o aluguel com condomínio, 15,3%, contra 4,0% (IBGE, PAS 2024). O ponto é o custo que mais se afasta do setor e o primeiro a cotar.

No preço, a taxa de entrada de R$ 18,68 fica abaixo da mediana de R$ 20,00 dos concorrentes que cobram e da São Jogue, de R$ 28,00 no fim de semana (seção 6.3). O preço não exige posicionamento acima do mercado. Por fim, a demanda projetada equivale a 14,8 mil visitas por ano, ou 0,6% da população de Salvador em 2026 (IBGE), abaixo da penetração que exigiria um mercado novo.

**Referências citadas neste capítulo**

ASSAF NETO, Alexandre. *Finanças corporativas e valor*. 7. ed. São Paulo: Atlas, 2014.

BANCO CENTRAL DO BRASIL (BCB). *Relatório Focus*: expectativas de mercado de 11 set. 2026. Brasília, 2026.

BANCO CENTRAL DO BRASIL (BCB). *Sistema Gerenciador de Séries Temporais (SGS)*: séries 432, 1619 e 13522. Brasília, 2026. Acesso em: 14 out. 2026.

BRASIL. Constituição (1988). Emenda Constitucional nº 132, de 20 de dezembro de 2023. Altera o Sistema Tributário Nacional. *Diário Oficial da União*: seção 1, Brasília, DF, 21 dez. 2023. [AV]

FUNDAÇÃO INSTITUTO DE PESQUISAS ECONÔMICAS (FIPE). *Índice FipeZAP*: locação comercial, julho de 2026. São Paulo, 2026.

IBGE. *Censo Demográfico 2022*: população residente por idade. Rio de Janeiro: IBGE, 2023. `[AV ano]`

IBGE. *Estimativas da população residente*: 2026. Rio de Janeiro: IBGE, 2026.

IBGE. *Pesquisa Anual de Serviços (PAS)*: tabelas 2611, 2619 e 10758. Rio de Janeiro: IBGE, 2025-2026. `[AV ano de cada edição]`

IBGE. *Pesquisa de Orçamentos Familiares 2017-2018*: perfil das despesas no Brasil: indicadores selecionados de alimentação, transporte, lazer e inclusão financeira. Rio de Janeiro: IBGE, 2021. Disponível em: https://biblioteca.ibge.gov.br/visualizacao/livros/liv101844.pdf. Acesso em: 2 nov. 2026.

IBGE. *Pesquisa de Orçamentos Familiares 2017-2018*: tabelas 6715 e 6972. Rio de Janeiro: IBGE, 2019.

IBGE. *Pesquisa Nacional por Amostra de Domicílios Contínua*: tabelas 5436 e 7395. Rio de Janeiro: IBGE, 2026.

IBGE. *Regiões de influência das cidades 2018*. Rio de Janeiro: IBGE, 2020.

IBGE. *Sistema Nacional de Índices de Preços ao Consumidor*: IPCA, tabela 7060. Rio de Janeiro: IBGE, 2026.
