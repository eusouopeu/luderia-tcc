# 10 ANÁLISE ESTRATÉGICA E DE RISCOS

> **Rascunho (02/11/2026).** Números do modelo do cap. 9 (`gerar_modelo_financeiro.py`, 02/11/2026), com o desenho enxuto (P7 de `_instrucoes/1a_principios.md`). Itens da SWOT com remissão à seção que os sustenta. O efeito das opções de expansão no VPL ainda não foi calculado.

A análise estratégica e de riscos reúne os resultados dos capítulos 5 a 9 para responder sob quais condições o negócio se sustenta. O capítulo parte do diagnóstico SWOT, compara os cenários, identifica as premissas críticas e termina na matriz de riscos, no plano de contingência e nos gatilhos de expansão e de perda máxima.

## 10.1 MATRIZ SWOT

A luderia entra num mercado com uma referência forte e com margem estreita no provável. O Quadro 10.1 resume os pontos internos e externos que sustentam essa leitura. O cruzamento da matriz aponta uma estratégia. A luderia usa as forças de preço e ponto para ocupar um bairro sem luderia (FO) e reduz a margem estreita com o desenho enxuto e as etapas (DO): só investe em acervo e mesas quando a demanda medida pede. Contra a reação da concorrente, que pode baixar a própria taxa, o diferencial é o serviço de mesa (FA).

**Quadro 10.1 – Matriz SWOT**

|  | Pontos | Evidência |
|---|---|---|
| Forças | Taxa de entrada de R$ 18,68, média dos concorrentes, abaixo da São Jogue (R$ 28,00 no fim de semana, com 4,8 estrelas em 787 avaliações) | Seções 6.3 e 9.6 |
|  | Ponto na Pituba, 1º da matriz de bairros em todos os pesos testados, a até 1.000 m do metrô | Seção 6.4 |
|  | Instrutor dedicado ao salão em todas as horas abertas, com no máximo 2 mesas por instrutor no pico | Seções 7.3 e 7.5 |
|  | Desenho enxuto: 6 mesas, horário de maior movimento e investimento por etapas, pago com o caixa gerado | Seções 7.2 e 10.4 |
| Fraquezas | Aluguel com condomínio de 15,3% da receita, contra 4,0% no setor | Seção 9.6; IBGE, PAS 2024 |
|  | VPL provável de R$ 13 mil, dependente do valor residual e com rupturas a menos de 2% do provável | Seções 9.4 e 9.5 |
|  | Consumo por pessoa sem medida própria: pessoas por cesta em N6 | Seções 9.1 e 11.2 |
|  | Investimento sem cotação: reforma, mobiliário e cozinha em N6 | Seção 9.1 |
|  | Marca nova contra uma rede com duas unidades | Seção 5.3 |
| Oportunidades | Salvador com uma só luderia no recorte do B1, a São Jogue | Seção 5.3 |
|  | Nenhuma unidade da São Jogue entre os bairros mais bem colocados da matriz | Seção 6.4 |
| Ameaças | Selic de 14,0% e TMA real de 15% | BCB, set/2026; seção 9.1 |
|  | Aluguel comercial de Salvador com alta de 18,9% em 12 meses | FipeZap, jul/2026 |
|  | Reação da São Jogue com uma terceira unidade ou preço menor | Seções 5.3 e 6.3 |

Fonte: elaboração própria, com base nos caps. 5 a 9.

## 10.2 CENÁRIOS

O plano fica no limite da viabilidade no cenário provável: o VPL é de R$ 13 mil, e a TIR, de 16,0%, contra a TMA de 15% (seção 9.4). A receita madura, de R$ 55,1 mil por mês, cobre o ponto de equilíbrio operacional, de R$ 44,8 mil, com 23% de folga. O VPL positivo depende do valor residual: sem ele, o provável fica negativo em R$ 121 mil (Tabela 9.5).

Os cenários extremos põem todas as premissas do mesmo lado da faixa e servem de limite, não de previsão. O pessimista descreve 2,7 mesas ocupadas com grupos de 2,5 pessoas, 3,6 giros por dia e uma cesta de R$ 38,38 para cada trio, com taxa de R$ 12,50 e demanda caindo 5% ao ano a partir do ano 3: 17 clientes por dia aberto, perto do piso das NFC-e da Paralela. O otimista descreve 4,65 mesas ocupadas, o teto do salão, com grupos de 5,5 pessoas, cada pessoa com a sua cesta, de R$ 65,70, e taxa de R$ 21,88: 90 clientes por dia aberto.

## 10.3 PREMISSAS CRÍTICAS, RUPTURA E RISCOS

Cinco premissas decidem a viabilidade: três de demanda (pessoas por mesa, pessoas por cesta de consumo e mesas ocupadas no fim de semana) e duas de preço (cesta de consumo e taxa de entrada) (Figura 9.2). A Tabela 9.5 compara o provável com o ponto de ruptura de cada uma e com o valor medido nos Blocos B1 e B3.

Todas as rupturas ficam a menos de 2% do provável. O negócio é viável se as premissas críticas ficarem no provável ou acima dele, e o risco está na simetria: um desvio pequeno para cima ou para baixo decide o sinal do VPL. Grupos de 4,0 pessoas dão VPL de R$ 332 mil; grupos de 3,3 pessoas, de -R$ 227 mil. Uma cesta para 1,5 pessoa dá R$ 470 mil; uma cesta para 2,5 pessoas, -R$ 256 mil. As pessoas por cesta são a fraqueza de evidência do plano: premissa crítica sem medida (N6), porque a coleta dos pedidos foi inviável (seção 11.2), o que viola a regra de robustez (seção 3.1). O lado otimista das mesas ocupadas é curto. O salão de 6 mesas limita a média do fim de semana a 4,65 mesas, e esse teto dá VPL de R$ 198 mil. O ganho acima disso vem das etapas de expansão (seção 10.4), não do salão inicial. Na simulação de Monte Carlo, o VPL fica positivo em 49,1% dos 10 mil cenários; os gatilhos G5 e G6 agem em 26% deles e encerram o negócio em 15%, o que limita a perda.

As premissas críticas se traduzem em riscos do negócio, e os de maior impacto são os de demanda e de custo fixo. O Quadro 10.2 classifica cada risco pela probabilidade e pelo impacto, com o VPL da premissa no pessimista, o gatilho que trata o risco e a evidência.

**Quadro 10.2 – Matriz de riscos**

| Risco | Probabilidade | Impacto | VPL com a premissa no pessimista (R$) | Gatilho | Evidência |
|---|---|---|---|---|---|
| Aluguel acima de R$ 54,15 por m² na Pituba | Alta | Alto | -274.076 | G5 | FipeZap só para Salvador inteira; alta de 18,9% em 12 meses |
| Mesas ocupadas no fim de semana abaixo de 4,35 | Média | Alto | -656.231 | G4 | Média de 4,37 nas visitas, de 2,69 a 6,02 (B3) |
| Pessoas por mesa ocupada abaixo de 3,58 | Média | Alto | -550.925 | G1 | Média de 3,6 nas visitas, de 2,4 a 4,6 (B3) |
| Taxa de entrada abaixo de R$ 18,51 (reação da concorrência) | Média | Alto | -362.448 | G4 | Quartis de R$ 12,50 a R$ 21,88 (B1); São Jogue a R$ 22,00 no dia útil |
| Consumo abaixo de uma cesta para 2 pessoas | Média | Alto | -346.505 | G2 | N6; pedidos não medidos (seção 11.2) |
| Cesta de consumo abaixo de R$ 50,34 | Média | Alto | -286.616 | G2 | Quartis de R$ 38,38 a R$ 65,70 nos concorrentes (B1) |
| Abertura de unidade da São Jogue perto do ponto | Média | Alto | n.a. | G4 | Rede com duas unidades (B3) |
| Mesas ocupadas em dia útil abaixo de 50% das do fim de semana | Alta | Médio | -179.113 | G3 | N6; nenhuma visita em dia útil |
| Salários acima da admissão do Novo CAGED | Média | Médio | -101.841 | G5 | Acréscimo de 11,4% no pessimista (seção 9.1) |
| Reforma e cozinha acima do provável | Média | Médio | -99.852 | n.a. | Sem cotação (N6) |
| Lotação dos bombeiros abaixo de 30 assentos | Baixa | Médio | n.a. | n.a. | Depende do projeto do imóvel (seção 7.2) |
| Perda e desgaste do acervo acima de 10% ao ano | Média | Baixo | 1.425 | n.a. | N6 (C13) |

Fonte: elaboração própria, com base nos caps. 5 a 9.

Nota: riscos do mais para o menos grave. Probabilidade, pelo critério do autor (N6): alta, se a evidência disponível já aponta para o valor adverso; média, se a faixa medida ou estimada inclui o valor adverso; baixa, se o risco depende de um fato que o projeto controla antes da abertura. Impacto, pelo VPL com a premissa no pessimista e as demais no provável (Figura 9.2): alto, abaixo de -R$ 250 mil; médio, de -R$ 250 mil a -R$ 50 mil; baixo, acima de -R$ 50 mil. Aluguel: área e preço por m² no pessimista; reforma e cozinha: premissas I01 e I03. Gatilhos G1 a G6 no Quadro 10.4. n.a.: risco sem premissa própria no modelo (a São Jogue atua sobre as mesas ocupadas e as pessoas por mesa; a lotação, sobre o número de mesas) ou sem gatilho na operação.

## 10.4 CONTINGÊNCIA E MONITORAMENTO

O investimento depende de duas validações feitas sem nova ida a campo. Primeiro, o ponto e a reforma precisam de cotação na Pituba, com área de 110 a 150 m²: os anúncios dos portais de aluguel dão o preço pedido por bairro, e o orçamento da reforma sai do imóvel escolhido. Na sequência, o consumo por pessoa precisa de uma segunda fonte: o gasto por pessoa declarado nas avaliações do Google Maps (B2) é comparado com a cesta de consumo e a taxa de entrada dos concorrentes. O plano só segue se as duas confirmarem as premissas na altura do provável.

Depois da abertura, o caixa, a NFC-e e o site de recomendação de jogos (seção 7.3) dão os indicadores mensais. Eles alimentam dois conjuntos de gatilhos: os de expansão, que liberam investimento, e os de perda máxima, que cortam receita perdida e custo. As etapas de expansão são opções: só são exercidas se a demanda medida pedir e se o caixa gerado pagar a etapa, com reserva de dois meses de custo fixo. O Quadro 10.3 resume as etapas.

**Quadro 10.3 – Etapas de expansão**

| Etapa | O que muda | Gatilho (3 meses seguidos, depois da maturação) |
|---|---|---|
| 1. Abertura | 6 mesas; acervo de 175 títulos; cozinha completa | - |
| 2. Acervo | Acervo até 322 títulos, a mediana do B1 | Jogos fora do acervo pedidos em pelo menos 10% das mesas; fila pelo mesmo jogo em um dia de pico por semana; ou buscas frequentes no site por jogos para um número de pessoas ou de uma mecânica com pouca oferta |
| 3. Mesas | Mais 2 mesas por vez, até 10, com no máximo 2 mesas por instrutor no pico | Ocupação de pico acima de 80% das mesas, ou grupos recusados por lotação em todos os fins de semana |

Fonte: elaboração própria. Limites dos gatilhos propostos pelo autor (N6).

Os gatilhos de perda máxima seguem uma ordem de análise (Quadro 10.4). Os três primeiros apontam uma causa específica e pedem medida dirigida e barata. O G4 é o alarme geral: quando ele dispara, a análise começa pelo G1, e as medidas do G4 só entram se nenhuma das três causas explicar a queda. O G5 e o G6 cortam custo e limitam a perda. As medidas de preço são contingência: o preço base continua o da seção 6.3. Cada gatilho tem um limite e uma medida no Quadro 10.4.

**Quadro 10.4 – Gatilhos de perda máxima, em ordem de análise**

| Gatilho | Condição | Medidas |
|---|---|---|
| G1. Pouca gente por mesa | Média de pessoas por mesa abaixo de 3 por 3 meses | Taxa de entrada por mesa, e não por pessoa: cada mesa recebe um só grupo, e quanto maior o grupo, maior o consumo; desconto progressivo na taxa conforme o número de pessoas na mesa |
| G2. Consumo baixo | Gasto de A&B por pessoa abaixo da metade da cesta de consumo por 3 meses | Taxa de entrada mais cara, revertida em consumação; combos de entrada com bebida |
| G3. Dia útil fraco | Ocupação de terça a quinta abaixo de 40% da do fim de semana por 3 meses | Passaporte mensal com direito a um número de dias e de acompanhantes, vendido para os dias úteis; eventos fechados e aluguel do espaço; se persistir, fechar a terça e refazer a escala |
| G4. Demanda baixa | Receita abaixo do equilíbrio operacional (R$ 44,8 mil por mês no provável) por 2 meses, sem causa apontada de G1 a G3 | Marketing dirigido a escolas, empresas e grupos de jogos; eventos de comunidade nos dias fracos; reserva com sinal; taxa de entrada menor, com sessão limitada à permanência média das visitas (cerca de 1h50) |
| G5. Caixa negativo | EBITDA negativo por 3 meses seguidos, ou caixa abaixo de 1 mês de custo fixo | Corte do meio período; renegociação do aluguel; suspensão das etapas de expansão; passaporte mensal e pré-venda para antecipar caixa; troca do cardápio por comidas recebidas prontas (salgados como coxinha e quibe), com corte de um cozinheiro |
| G6. Saída | EBITDA acumulado de 6 meses negativo depois do mês 12, com G5 ativo e as medidas de G1 a G4 já aplicadas | Troca de formato (só eventos, aluguel e venda de jogos, com comidas recebidas prontas) ou encerramento, com venda do acervo e do mobiliário para limitar a perda ao investimento menos o valor de revenda |

Fonte: elaboração própria. Limites propostos pelo autor (N6), salvo o equilíbrio operacional, do modelo do cap. 9.

**Referências citadas neste capítulo**

BANCO CENTRAL DO BRASIL (BCB). *Relatório Focus*: expectativas de mercado de 11 set. 2026. Brasília, 2026. Disponível em: https://www.bcb.gov.br/content/focus/focus/R20260911.pdf. Acesso em: 2 nov. 2026.

BANCO CENTRAL DO BRASIL (BCB). *Sistema Gerenciador de Séries Temporais (SGS)*: séries 432, 433, 1619 e 13522. Brasília, 2026. Disponível em: https://www3.bcb.gov.br/sgspub/. Acesso em: 14 out. 2026.

FUNDAÇÃO INSTITUTO DE PESQUISAS ECONÔMICAS (FIPE). *Índice FipeZAP*: locação comercial, julho de 2026. São Paulo, 2026. Disponível em: https://downloads.fipe.org.br/indices/fipezap/fipezap-202607-comercial.pdf. Acesso em: 2 nov. 2026.

IBGE. *Censo Demográfico 2022*: população residente por idade. Rio de Janeiro: IBGE, 2023. Disponível em: https://sidra.ibge.gov.br/tabela/9514. Acesso em: 2 nov. 2026. `[AV ano]`

IBGE. *Estimativas da população residente*: 2026. Rio de Janeiro: IBGE, 2026. Disponível em: https://www.ibge.gov.br/estatisticas/sociais/populacao/9103-estimativas-de-populacao.html. Acesso em: 2 nov. 2026.

IBGE. *Pesquisa Anual de Serviços (PAS)*: tabelas 2611, 2619 e 10758. Rio de Janeiro: IBGE, 2025-2026. Disponível em: https://sidra.ibge.gov.br/tabela/2611, https://sidra.ibge.gov.br/tabela/2619 e https://sidra.ibge.gov.br/tabela/10758. Acesso em: 2 nov. 2026. `[AV ano de cada edição]`

IBGE. *Pesquisa de Orçamentos Familiares 2017-2018*: perfil das despesas no Brasil: indicadores selecionados de alimentação, transporte, lazer e inclusão financeira. Rio de Janeiro: IBGE, 2021. Disponível em: https://biblioteca.ibge.gov.br/visualizacao/livros/liv101844.pdf. Acesso em: 2 nov. 2026.

IBGE. *Pesquisa de Orçamentos Familiares 2017-2018*: tabelas 6715 e 6972. Rio de Janeiro: IBGE, 2019. Disponível em: https://sidra.ibge.gov.br/tabela/6715 e https://sidra.ibge.gov.br/tabela/6972. Acesso em: 2 nov. 2026.

IBGE. *Pesquisa Nacional por Amostra de Domicílios Contínua*: tabelas 5436 e 7395. Rio de Janeiro: IBGE, 2026. Disponível em: https://sidra.ibge.gov.br/tabela/5436 e https://sidra.ibge.gov.br/tabela/7395. Acesso em: 2 nov. 2026.

IBGE. *Regiões de influência das cidades 2018*. Rio de Janeiro: IBGE, 2020. Disponível em: https://biblioteca.ibge.gov.br/visualizacao/livros/liv101728.pdf. Acesso em: 2 nov. 2026.

IBGE. *Sistema Nacional de Índices de Preços ao Consumidor*: IPCA, tabela 7060. Rio de Janeiro: IBGE, 2026. Disponível em: https://sidra.ibge.gov.br/tabela/7060. Acesso em: 2 nov. 2026.
