# 10 ANÁLISE ESTRATÉGICA E DE RISCOS

> **Rascunho (31/10/2026).** Números do modelo do cap. 9 (`gerar_modelo_financeiro.py`, 31/10/2026). A linha "equipe do cap. 7" foi calculada com o mesmo modelo, trocando só o quadro de 12 pessoas pela equipe de 8 do Quadro 7.2, com a diarista nas despesas gerais; entra no cap. 9 quando o autor decidir a equipe. Itens da SWOT com remissão à seção que os sustenta.

A análise estratégica e de riscos reúne os resultados dos capítulos 5 a 9 para responder sob quais condições o negócio se sustenta. O capítulo parte do diagnóstico SWOT, compara os cenários, identifica as premissas críticas e termina na matriz de riscos e no plano de contingência.

## 10.1 MATRIZ SWOT

A luderia entra num mercado com uma referência forte e um custo fixo alto. O Quadro 10.1 resume os pontos internos e externos que sustentam essa leitura.

**Quadro 10.1 – Matriz SWOT**

| | Pontos | Evidência |
|---|---|---|
| Forças | Taxa de entrada de R$ 18,68, média dos concorrentes, abaixo da São Jogue (R$ 28,00 no fim de semana, com 4,8 estrelas em 787 avaliações) | Seções 6.3 e 9.8 |
| | Ponto na Pituba, 1º da matriz de bairros em todos os pesos testados, a até 1.000 m do metrô | Seção 6.4 |
| | Instrutor dedicado ao salão em todas as horas abertas | Seções 7.3 e 7.5 |
| Fraquezas | Folha com encargos de 40,6% da receita e aluguel de 16,8%, contra 25,1% e 4,0% no setor | Seção 9.8; IBGE, PAS 2024 |
| | Consumo por pessoa sem medida própria: pessoas por cesta em N6 | Seções 9.2 e 11.3 |
| | Investimento sem cotação: reforma, mobiliário e cozinha em N6 | Seção 9.2 |
| | Marca nova contra uma rede com duas unidades | Seção 5.3 |
| Oportunidades | Salvador com uma só luderia no recorte do B1, a São Jogue | Seção 5.3 |
| | Nenhuma unidade da São Jogue entre os bairros mais bem colocados da matriz | Seção 6.4 |
| Ameaças | Selic de 14,0% e TMA real de 15% | BCB, set/2026; seção 9.2 |
| | Aluguel comercial de Salvador com alta de 18,9% em 12 meses | FipeZap, jul/2026 |
| | Reação da São Jogue com uma terceira unidade ou preço menor | Seções 5.3 e 6.3 |

Fonte: elaborado pelo próprio autor com base nos caps. 5 a 9.

O cruzamento da matriz aponta uma estratégia. A luderia usa as forças de preço e ponto para ocupar um bairro sem luderia (FO) e corrige a fraqueza de custo fixo antes de investir (DO): equipe dimensionada pelo fluxo e área no limite inferior da faixa. Contra a reação da concorrente, que pode baixar a própria taxa, o diferencial é o serviço de mesa (FA).

## 10.2 CENÁRIOS

O plano não é viável no cenário provável com o quadro de 12 pessoas: o VPL é negativo em R$ 638 mil (seção 9.6). Com a equipe de 8 pessoas do cap. 7, o VPL provável sobe para -R$ 377 mil, e o ponto de equilíbrio operacional cai de R$ 72,6 mil para R$ 63,6 mil por mês, abaixo da receita madura de R$ 69,4 mil (Quadro 10.2). Com essa equipe, o negócio cobre os custos fixos, mas não remunera o investimento.

**Quadro 10.2 – Indicadores por cenário (R$)**

| Indicador | Pessimista | Provável | Provável, equipe do cap. 7 | Otimista |
|---|---|---|---|---|
| Investimento inicial | 849.497,00 | 503.231,00 | 490.571,00 | 288.832,00 |
| VPL | -2.878.100,00 | -637.604,00 | -376.625,00 | 6.644.840,00 |
| Receita mensal madura | 17.516,00 | 69.430,00 | 69.430,00 | 300.082,00 |
| Ponto de equilíbrio mensal | não atinge | 72.590,00 | 63.590,00 | atinge |

Fonte: elaborado pelo próprio autor com base no modelo do cap. 9 (31/10/2026).

Os cenários extremos põem todas as premissas do mesmo lado da faixa e servem de limite, não de previsão. O pessimista descreve 2,7 mesas ocupadas com grupos de 2,5 pessoas, 3,6 giros por dia e uma cesta de consumo para cada trio: 16 clientes por dia, o piso das NFC-e da Paralela. O otimista descreve 6,0 mesas ocupadas com grupos de 5,5 pessoas, que giram o dia inteiro, cada pessoa com a sua cesta: 141 clientes por dia, o comportamento da noite mais cheia estendido à semana inteira.

## 10.3 PREMISSAS CRÍTICAS E PONTOS DE RUPTURA

Quatro premissas de demanda decidem a viabilidade: pessoas por mesa, mesas ocupadas no fim de semana, pessoas por cesta de consumo e giros por dia (Figura 9.2). O Quadro 10.3 compara o provável com o ponto de ruptura de cada uma, com a equipe do cap. 7.

**Quadro 10.3 – Ruptura das premissas críticas com a equipe do cap. 7**

| Premissa | Provável | Ruptura (VPL = 0) | Medido no B3 | Nível |
|---|---|---|---|---|
| Pessoas por mesa ocupada (R02) | 3,6 | 4,4 | 2,4 a 4,6 por visita | N5 + N6 |
| Mesas ocupadas no fim de semana (R04) | 4,37 | 5,32 | 2,69 a 6,02 por visita | N5 |
| Pessoas por cesta de consumo (R08) | 2 | 1,38 | não medida | N6 |
| Giros por mesa por dia (R15) | 4,56 | 5,55 | 3,61 (NFC-e) a 5,51 (horário ÷ permanência) | N5 |
| Mesas ocupadas em dia útil (R05) | 50% | 77% | não medida | N6 |

Fonte: elaborado pelo próprio autor com base no modelo do cap. 9 e no Bloco B3 (2026).

Pessoas por mesa, mesas ocupadas e giros precisam subir cerca de 22% sobre o provável para zerar o VPL. As duas primeiras rupturas ficam dentro do medido: duas das quatro visitas tiveram grupos de 4,4 pessoas ou mais, e uma teve 6,0 mesas ocupadas. O giro de ruptura passa do teto físico de 5,51, o horário inteiro ocupado. As pessoas por cesta são a fraqueza de evidência do plano: premissa crítica sem medida (N6), porque a coleta dos pedidos foi inviável (seção 11.3), o que viola a regra de robustez (`_instrucoes/8_financeiro.md`).

A viabilidade também não depende de uma premissa isolada: combinações de duas premissas pouco acima do provável tornam o VPL positivo. Com a equipe do cap. 7, grupos de 4,0 pessoas com 5,0 mesas ocupadas dão VPL de R$ 95 mil; grupos de 4,0 pessoas com uma cesta para 1,5 pessoa dão R$ 126 mil; 5,0 mesas ocupadas com uma cesta para 1,5 pessoa dão R$ 193 mil. Com o quadro de 12 pessoas, nenhuma dessas combinações basta. Na simulação de Monte Carlo, o VPL fica positivo em 35,4% dos 10 mil cenários com a equipe do cap. 7, contra 25,2% com o quadro de 12.

## 10.4 MATRIZ DE RISCOS

As premissas críticas se traduzem em riscos do negócio, e os de maior impacto são os de demanda e de custo fixo. O Quadro 10.4 classifica cada risco pela probabilidade e pelo impacto, com a evidência que sustenta a classificação.

**Quadro 10.4 – Matriz de riscos**

| Risco | Tipo | Probabilidade | Impacto | Evidência |
|---|---|---|---|---|
| Mesas ocupadas no fim de semana abaixo de 5,3 | Mercado | Alta | Alto | Média de 4,37 nas visitas, de 2,69 a 6,02 (B3) |
| Consumo abaixo de uma cesta para 1,4 pessoa | Mercado | Média | Alto | N6; pedidos não medidos (seção 11.3) |
| Mesas ocupadas em dia útil abaixo de 50% das do fim de semana | Mercado | Alta | Médio | N6; nenhuma visita em dia útil |
| Aluguel acima de R$ 54,15 por m² na Pituba | Financeiro | Alta | Médio | FipeZap só para Salvador inteira; alta de 18,9% em 12 meses |
| Reforma e cozinha acima do provável | Financeiro | Média | Médio | Sem cotação (N6) |
| Abertura de unidade da São Jogue perto do ponto | Mercado | Média | Alto | Rede com duas unidades (B3) |
| Lotação dos bombeiros abaixo de 48 assentos | Legal | Baixa | Médio | Depende do projeto do imóvel (seção 7.2) |
| Perda e desgaste do acervo acima de 10% ao ano | Operacional | Média | Baixo | N6 (C13) |

Fonte: elaborado pelo próprio autor com base nos caps. 5 a 9.

## 10.5 CONTINGÊNCIA E MONITORAMENTO

O investimento depende de três validações. Primeiro, as mesas ocupadas em dia útil precisam de medida própria: uma visita de segunda a quinta à São Jogue, com o mesmo app, troca o N6 por N5. Na sequência, o ponto e a reforma precisam de cotação na Pituba, com área de 150 a 180 m². Por fim, um evento piloto com o acervo inicial mede o consumo por pessoa, que a contagem direta não conseguiu registrar. O plano só segue se as três confirmarem a combinação da seção 10.3.

Depois da abertura, quatro indicadores semanais acompanham as premissas críticas. O limite de alerta de cada um sai do ponto de ruptura:

- mesas ocupadas no fim de semana: alerta abaixo de 5,3 em média por quatro semanas seguidas;
- pessoas por mesa: alerta abaixo de 4,4;
- consumo de A&B por pessoa, pelo caixa: alerta abaixo de R$ 36,85;
- giros por mesa, pela reserva: alerta abaixo de 5,5 por dia.

Cada alerta tem uma ação. Poucas mesas ocupadas no fim de semana levam a eventos e torneios nas noites de sexta. Grupos pequenos levam a promoções para grupos de quatro ou mais. Consumo baixo leva a rever o cardápio e a oferta do instrutor na mesa. Giro baixo leva a reservas por turno e a reduzir o horário e a equipe de segunda a quinta. A responsabilidade pelos indicadores é do gerente, com revisão mensal pelo sócio.
