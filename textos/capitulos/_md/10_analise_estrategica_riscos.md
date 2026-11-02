# 10 ANÁLISE ESTRATÉGICA E DE RISCOS

> **Rascunho (02/11/2026).** Números do modelo do cap. 9 (`gerar_modelo_financeiro.py`, 02/11/2026), com o desenho enxuto (P7 de `_instrucoes/1a_principios.md`). Itens da SWOT com remissão à seção que os sustenta. O efeito das opções de expansão no VPL ainda não foi calculado.

A análise estratégica e de riscos reúne os resultados dos capítulos 5 a 9 para responder sob quais condições o negócio se sustenta. O capítulo parte do diagnóstico SWOT, compara os cenários, identifica as premissas críticas e termina na matriz de riscos, no plano de contingência e nos gatilhos de expansão e de perda máxima.

## 10.1 MATRIZ SWOT

A luderia entra num mercado com uma referência forte e com margem estreita no provável. O Quadro 10.1 resume os pontos internos e externos que sustentam essa leitura.

**Quadro 10.1 – Matriz SWOT**

| | Pontos | Evidência |
|---|---|---|
| Forças | Taxa de entrada de R$ 18,68, média dos concorrentes, abaixo da São Jogue (R$ 28,00 no fim de semana, com 4,8 estrelas em 787 avaliações) | Seções 6.3 e 9.8 |
| | Ponto na Pituba, 1º da matriz de bairros em todos os pesos testados, a até 1.000 m do metrô | Seção 6.4 |
| | Instrutor dedicado ao salão em todas as horas abertas, com no máximo 2 mesas por instrutor no pico | Seções 7.3 e 7.5 |
| | Desenho enxuto: 6 mesas, horário de maior movimento e investimento por etapas, pago com o caixa gerado | Seções 7.2 e 10.5 |
| Fraquezas | Aluguel com condomínio de 15,3% da receita, contra 4,0% no setor | Seção 9.8; IBGE, PAS 2024 |
| | VPL provável de R$ 13 mil, dependente do valor residual e com rupturas a menos de 2% do provável | Seções 9.6 e 9.7.3 |
| | Consumo por pessoa sem medida própria: pessoas por cesta em N6 | Seções 9.2 e 11.3 |
| | Investimento sem cotação: reforma, mobiliário e cozinha em N6 | Seção 9.2 |
| | Marca nova contra uma rede com duas unidades | Seção 5.3 |
| Oportunidades | Salvador com uma só luderia no recorte do B1, a São Jogue | Seção 5.3 |
| | Nenhuma unidade da São Jogue entre os bairros mais bem colocados da matriz | Seção 6.4 |
| Ameaças | Selic de 14,0% e TMA real de 15% | BCB, set/2026; seção 9.2 |
| | Aluguel comercial de Salvador com alta de 18,9% em 12 meses | FipeZap, jul/2026 |
| | Reação da São Jogue com uma terceira unidade ou preço menor | Seções 5.3 e 6.3 |

Fonte: elaborado pelo próprio autor com base nos caps. 5 a 9.

O cruzamento da matriz aponta uma estratégia. A luderia usa as forças de preço e ponto para ocupar um bairro sem luderia (FO) e reduz a margem estreita com o desenho enxuto e as etapas (DO): só investe em acervo e mesas quando a demanda medida pede. Contra a reação da concorrente, que pode baixar a própria taxa, o diferencial é o serviço de mesa (FA).

## 10.2 CENÁRIOS

O plano fica no limite da viabilidade no cenário provável: o VPL é de R$ 13 mil, e a TIR, de 16,0%, contra a TMA de 15% (seção 9.6). A receita madura, de R$ 55,1 mil por mês, cobre o ponto de equilíbrio operacional, de R$ 44,8 mil, com 23% de folga. O VPL positivo depende do valor residual: sem ele, o provável fica negativo em R$ 121 mil (Quadro 10.2).

**Quadro 10.2 – Indicadores por cenário (R$)**

| Indicador | Pessimista | Provável | Otimista |
|---|---|---|---|
| Investimento inicial | 566.851,00 | 368.898,00 | 221.350,00 |
| VPL | -1.664.176,00 | 13.248,00 | 8.190.297,00 |
| VPL sem valor residual | -1.664.176,00 | -120.849,00 | 3.411.062,00 |
| Receita mensal madura | 16.006,00 | 55.138,00 | 165.443,00 |
| Ponto de equilíbrio mensal | 56.063,00 | 44.828,00 | 37.193,00 |

Fonte: elaborado pelo próprio autor com base no modelo do cap. 9 (02/11/2026).

Os cenários extremos põem todas as premissas do mesmo lado da faixa e servem de limite, não de previsão. O pessimista descreve 2,7 mesas ocupadas com grupos de 2,5 pessoas, 3,6 giros por dia e uma cesta de consumo para cada trio: 17 clientes por dia aberto, perto do piso das NFC-e da Paralela. O otimista descreve 4,65 mesas ocupadas, o teto do salão, com grupos de 5,5 pessoas, cada pessoa com a sua cesta: 90 clientes por dia aberto.

## 10.3 PREMISSAS CRÍTICAS E PONTOS DE RUPTURA

Cinco premissas de demanda decidem a viabilidade: pessoas por mesa, pessoas por cesta de consumo, mesas ocupadas no fim de semana, giros por dia e mesas ocupadas em dia útil (Figura 9.2). O Quadro 10.3 compara o provável com o ponto de ruptura de cada uma.

**Quadro 10.3 – Ruptura das premissas críticas**

| Premissa | Provável | Ruptura (VPL = 0) | Medido no B3 | Nível |
|---|---|---|---|---|
| Pessoas por mesa ocupada (R02) | 3,6 | 3,58 | 2,4 a 4,6 por visita | N5 + N6 |
| Pessoas por cesta de consumo (R08) | 2 | 2,02 | não medida | N6 |
| Mesas ocupadas no fim de semana (R04) | 4,37 | 4,35 | 2,69 a 6,02 por visita | N5 |
| Giros por mesa por dia (R15) | 4,01 | 3,99 | 3,61 (NFC-e) a 4,41 (horário ÷ permanência) | N5 |
| Mesas ocupadas em dia útil (R05) | 50% | 49,3% | não medida | N6 |

Fonte: elaborado pelo próprio autor com base no modelo do cap. 9 e no Bloco B3 (2026).

Todas as rupturas ficam a menos de 2% do provável. O negócio é viável se as premissas críticas ficarem no provável ou acima dele, e o risco está na simetria: um desvio pequeno para cima ou para baixo decide o sinal do VPL. Grupos de 4,0 pessoas dão VPL de R$ 332 mil; grupos de 3,3 pessoas, de -R$ 227 mil. Uma cesta para 1,5 pessoa dá R$ 470 mil; uma cesta para 2,5 pessoas, -R$ 256 mil. As pessoas por cesta são a fraqueza de evidência do plano: premissa crítica sem medida (N6), porque a coleta dos pedidos foi inviável (seção 11.3), o que viola a regra de robustez (seção 3.1).

O lado otimista das mesas ocupadas é curto. O salão de 6 mesas limita a média do fim de semana a 4,65 mesas, e esse teto dá VPL de R$ 198 mil. O ganho acima disso vem das etapas de expansão (seção 10.5), não do salão inicial. Na simulação de Monte Carlo, o VPL fica positivo em 44,9% dos 10 mil cenários.

## 10.4 MATRIZ DE RISCOS

As premissas críticas se traduzem em riscos do negócio, e os de maior impacto são os de demanda e de custo fixo. O Quadro 10.4 classifica cada risco pela probabilidade e pelo impacto, com a evidência que sustenta a classificação.

**Quadro 10.4 – Matriz de riscos**

| Risco | Tipo | Probabilidade | Impacto | Evidência |
|---|---|---|---|---|
| Mesas ocupadas no fim de semana abaixo de 4,35 | Mercado | Média | Alto | Média de 4,37 nas visitas, de 2,69 a 6,02 (B3) |
| Consumo abaixo de uma cesta para 2 pessoas | Mercado | Média | Alto | N6; pedidos não medidos (seção 11.3) |
| Mesas ocupadas em dia útil abaixo de 50% das do fim de semana | Mercado | Alta | Médio | N6; nenhuma visita em dia útil |
| Aluguel acima de R$ 54,15 por m² na Pituba | Financeiro | Alta | Alto | FipeZap só para Salvador inteira; alta de 18,9% em 12 meses; com o aluguel e a área do pessimista, o VPL cai para -R$ 274 mil |
| Reforma e cozinha acima do provável | Financeiro | Média | Médio | Sem cotação (N6) |
| Abertura de unidade da São Jogue perto do ponto | Mercado | Média | Alto | Rede com duas unidades (B3) |
| Lotação dos bombeiros abaixo de 30 assentos | Legal | Baixa | Médio | Depende do projeto do imóvel (seção 7.2) |
| Salários acima da admissão do Novo CAGED | Financeiro | Média | Baixo | Acréscimo de 11,4% no pessimista (seção 9.2) |
| Perda e desgaste do acervo acima de 10% ao ano | Operacional | Média | Baixo | N6 (C13) |

Fonte: elaborado pelo próprio autor com base nos caps. 5 a 9.

## 10.5 CONTINGÊNCIA E MONITORAMENTO

O investimento depende de duas validações feitas sem nova ida a campo. Primeiro, o ponto e a reforma precisam de cotação na Pituba, com área de 110 a 150 m²: os anúncios dos portais de aluguel dão o preço pedido por bairro, e o orçamento da reforma sai do imóvel escolhido. Na sequência, o consumo por pessoa precisa de uma segunda fonte: o gasto por pessoa declarado nas avaliações do Google Maps (B2) é comparado com a cesta de consumo e a taxa de entrada dos concorrentes. O plano só segue se as duas confirmarem as premissas na altura do provável.

Depois da abertura, o caixa, a NFC-e e o site de recomendação de jogos (seção 7.3) dão os indicadores mensais. Eles alimentam dois conjuntos de gatilhos: os de expansão, que liberam investimento, e os de perda máxima, que cortam receita perdida e custo.

As etapas de expansão são opções: só são exercidas se a demanda medida pedir e se o caixa gerado pagar a etapa, com reserva de dois meses de custo fixo. O Quadro 10.5 resume as etapas.

**Quadro 10.5 – Etapas de expansão**

| Etapa | O que muda | Gatilho (3 meses seguidos, depois da maturação) |
|---|---|---|
| 1. Abertura | 6 mesas; acervo de 175 títulos; cozinha completa | - |
| 2. Acervo | Acervo até 322 títulos, a mediana do B1 | Jogos fora do acervo pedidos em pelo menos 10% das mesas; fila pelo mesmo jogo em um dia de pico por semana; ou buscas frequentes no site por jogos para um número de pessoas ou de uma mecânica com pouca oferta |
| 3. Mesas | Mais 2 mesas por vez, até 10, com no máximo 2 mesas por instrutor no pico | Ocupação de pico acima de 80% das mesas, ou grupos recusados por lotação em todos os fins de semana |

Fonte: elaborado pelo próprio autor. Limites dos gatilhos propostos pelo autor (N6).

Os gatilhos de perda máxima seguem uma ordem de análise (Quadro 10.6). Os três primeiros apontam uma causa específica e pedem medida dirigida e barata. O G4 é o alarme geral: quando ele dispara, a análise começa pelo G1, e as medidas do G4 só entram se nenhuma das três causas explicar a queda. O G5 e o G6 cortam custo e limitam a perda. As medidas de preço são contingência: o preço base continua o da seção 6.3.

**Quadro 10.6 – Gatilhos de perda máxima, em ordem de análise**

| Gatilho | Condição | Medidas |
|---|---|---|
| G1. Pouca gente por mesa | Média de pessoas por mesa abaixo de 3 por 3 meses | Taxa de entrada por mesa, e não por pessoa: cada mesa recebe um só grupo, e quanto maior o grupo, maior o consumo; desconto progressivo na taxa conforme o número de pessoas na mesa |
| G2. Consumo baixo | Gasto de A&B por pessoa abaixo da metade da cesta de consumo por 3 meses | Taxa de entrada mais cara, revertida em consumação; combos de entrada com bebida |
| G3. Dia útil fraco | Ocupação de terça a quinta abaixo de 40% da do fim de semana por 3 meses | Passaporte mensal com direito a um número de dias e de acompanhantes, vendido para os dias úteis; eventos fechados e aluguel do espaço; se persistir, fechar a terça e refazer a escala |
| G4. Demanda baixa | Receita abaixo do equilíbrio operacional (R$ 44,8 mil por mês no provável) por 2 meses, sem causa apontada de G1 a G3 | Marketing dirigido a escolas, empresas e grupos de jogos; eventos de comunidade nos dias fracos; reserva com sinal; taxa de entrada menor, com sessão limitada à permanência média das visitas (cerca de 1h50) |
| G5. Caixa negativo | EBITDA negativo por 3 meses seguidos, ou caixa abaixo de 1 mês de custo fixo | Corte do meio período; renegociação do aluguel; suspensão das etapas de expansão; passaporte mensal e pré-venda para antecipar caixa; troca do cardápio por comidas recebidas prontas (salgados como coxinha e quibe), com corte de um cozinheiro |
| G6. Saída | EBITDA acumulado de 6 meses negativo depois do mês 12, com G5 ativo e as medidas de G1 a G4 já aplicadas | Troca de formato (só eventos, aluguel e venda de jogos, com comidas recebidas prontas) ou encerramento, com venda do acervo e do mobiliário para limitar a perda ao investimento menos o valor de revenda |

Fonte: elaborado pelo próprio autor. Limites propostos pelo autor (N6), salvo o equilíbrio operacional, do modelo do cap. 9.

A responsabilidade pelos indicadores e pela revisão mensal dos gatilhos é do sócio.
