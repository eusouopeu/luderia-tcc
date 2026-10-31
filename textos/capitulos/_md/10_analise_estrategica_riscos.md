# 10 ANÁLISE ESTRATÉGICA E DE RISCOS

> **Rascunho (31/10/2026).** Números do modelo do cap. 9 (`gerar_modelo_financeiro.py`, 31/10/2026). A linha "equipe do cap. 7" foi calculada com o mesmo modelo, trocando só o quadro de 12 pessoas pela equipe de 8 do Quadro 7.2; entra no cap. 9 quando o autor decidir a equipe. Itens da SWOT com remissão à seção que os sustenta.

## 10.1 MATRIZ SWOT

A luderia entra num mercado com uma referência forte e um custo fixo alto. O Quadro 10.1 resume os pontos internos e externos que sustentam essa leitura.

**Quadro 10.1 – Matriz SWOT**

| | Pontos | Evidência |
|---|---|---|
| Forças | Preço da referência aceito pelo público: taxa de R$ 28,00 no fim de semana com 4,8 estrelas em 787 avaliações | São Jogue (B1; seção 6.3) |
| | Ponto na Pituba, 1º da matriz de bairros em todos os pesos testados, a até 1.000 m do metrô | Seção 6.4 |
| | Instrutor dedicado ao salão em todas as horas abertas | Seções 7.3 e 7.5 |
| Fraquezas | Folha com encargos de 38,6% da receita e aluguel de 16,0%, contra 25,1% e 4,0% no setor | Seção 9.8; IBGE, PAS 2024 |
| | Investimento sem cotação: reforma, mobiliário e cozinha em N6 | Seção 9.2 |
| | Marca nova contra uma rede com duas unidades | Seção 5.3 |
| Oportunidades | Salvador com uma só luderia no recorte do B1, a São Jogue | Seção 5.3 |
| | Nenhuma unidade da São Jogue entre os bairros mais bem colocados da matriz | Seção 6.4 |
| Ameaças | Selic de 14,0% e TMA real de 15% | BCB, set/2026; seção 9.2 |
| | Aluguel comercial de Salvador com alta de 18,9% em 12 meses | FipeZap, jul/2026 |
| | Reação da São Jogue com uma terceira unidade ou preço menor | Seções 5.3 e 6.3 |

Fonte: elaborado pelo próprio autor com base nos caps. 5 a 9.

O cruzamento da matriz aponta uma estratégia. A luderia usa as forças de preço e ponto para ocupar um bairro sem luderia (FO) e corrige a fraqueza de custo fixo antes de investir (DO): equipe dimensionada pelo fluxo e área no limite inferior da faixa. Contra a reação da concorrente, o diferencial é o serviço de mesa, não o preço (FA).

## 10.2 CENÁRIOS

O plano não é viável no cenário provável com o quadro de 12 pessoas: o VPL é negativo em R$ 479 mil (seção 9.6). Com a equipe de 8 pessoas do cap. 7, o VPL provável sobe para -R$ 214 mil e o ponto de equilíbrio operacional cai de R$ 70,4 mil para R$ 61,5 mil por mês, contra receita madura de R$ 73,1 mil (Quadro 10.2).

**Quadro 10.2 – Indicadores por cenário (R$)**

| Indicador | Pessimista | Provável | Provável, equipe do cap. 7 | Otimista |
|---|---|---|---|---|
| Investimento inicial | 849.497,00 | 503.231,00 | 490.374,00 | 288.832,00 |
| VPL | -2.824.036,00 | -478.829,00 | -213.787,00 | 4.263.293,00 |
| Receita mensal madura | 19.407,00 | 73.101,00 | 73.101,00 | 207.261,00 |
| Ponto de equilíbrio mensal | não atinge | 70.411,00 | 61.545,00 | atinge |

Fonte: elaborado pelo próprio autor com base no modelo do cap. 9 (31/10/2026).

Os cenários extremos põem todas as premissas do mesmo lado da faixa e servem de limite, não de previsão. O pessimista descreve um salão de 8 mesas com grupos de 2,8 pessoas, permanência de 137 minutos e ocupação de 25% no fim de semana: uma luderia que não forma público. O otimista descreve grupos de 4,4 pessoas que ficam 83 minutos, com ocupação de 45%: o comportamento das noites mais cheias medidas, estendido à semana inteira.

## 10.3 PREMISSAS CRÍTICAS E PONTOS DE RUPTURA

Quatro premissas de demanda decidem a viabilidade: permanência, pessoas por grupo e ocupação de fim de semana e de dia útil (Figura 9.1). O Quadro 10.3 compara o provável com o ponto de ruptura de cada uma, com a equipe do cap. 7.

**Quadro 10.3 – Ruptura das premissas críticas com a equipe do cap. 7**

| Premissa | Provável | Ruptura (VPL = 0) | Medido no B3 | Nível |
|---|---|---|---|---|
| Ocupação de fim de semana (R04) | 35,0% | 41,5% | 29,9% a 66,9% nas noites; média de 46,1% | N5 + N6 |
| Ocupação de dia útil (R05) | 18,0% | 23,2% | não medida | N6 |
| Gasto com A&B por pessoa (R08) | R$ 24,00 | R$ 30,94 | R$ 23,91 nas notas dos observadores | N3 + N5 |
| Área do ponto (C03) | 180 m² | 123 m² | não se aplica | N6 |

Fonte: elaborado pelo próprio autor com base no modelo do cap. 9 e no Bloco B3 (2026).

A ocupação de fim de semana tem a menor distância até a ruptura: 6,5 pontos percentuais. A média das noites medidas (46,1%) fica acima da ruptura, mas mede só o horário de pico; o dia inteiro de sábado e domingo fica abaixo. A ocupação de dia útil é a fraqueza de evidência do plano: é premissa crítica sustentada só por estimativa do autor (N6), o que viola a regra de robustez (`_instrucoes/8_financeiro.md`). Nenhuma visita foi feita em dia útil.

Combinações pequenas tornam o VPL positivo. Com a equipe do cap. 7, ocupação de 40% no fim de semana e de 20% no dia útil dá VPL de R$ 33 mil; gasto com A&B de R$ 32,00, com as demais no provável, dá R$ 33 mil; área de 150 m² com gasto de R$ 28,00 dá R$ 23 mil. Com o quadro de 12 pessoas, nenhuma dessas combinações basta.

## 10.4 MATRIZ DE RISCOS

Os riscos de maior impacto são os de demanda e de custo fixo. O Quadro 10.4 classifica cada risco pela probabilidade e pelo impacto, com a evidência que sustenta a classificação.

**Quadro 10.4 – Matriz de riscos**

| Risco | Tipo | Probabilidade | Impacto | Evidência |
|---|---|---|---|---|
| Ocupação de dia útil abaixo de 18% | Mercado | Alta | Alto | N6; nenhuma visita em dia útil |
| Ocupação de fim de semana abaixo de 41,5% | Mercado | Média | Alto | Noites de 29,9% a 66,9% (B3) |
| Aluguel acima de R$ 54,15 por m² na Pituba | Financeiro | Alta | Médio | FipeZap só para Salvador inteira; alta de 18,9% em 12 meses |
| Reforma e cozinha acima do provável | Financeiro | Média | Médio | Sem cotação (N6) |
| Abertura de unidade da São Jogue perto do ponto | Mercado | Média | Alto | Rede com duas unidades (B3) |
| Lotação dos bombeiros abaixo de 48 assentos | Legal | Baixa | Médio | Depende do projeto do imóvel (seção 7.2) |
| Perda e desgaste do acervo acima de 10% ao ano | Operacional | Média | Baixo | N6 (C13) |

Fonte: elaborado pelo próprio autor com base nos caps. 5 a 9.

## 10.5 CONTINGÊNCIA E MONITORAMENTO

O investimento depende de três validações. Primeiro, a ocupação de dia útil precisa de medida própria: uma visita de segunda a quinta à São Jogue, com o mesmo app, troca o N6 por N5. Na sequência, o ponto e a reforma precisam de cotação na Pituba, com área de 150 a 180 m². Por fim, um evento piloto com o acervo inicial mede o gasto com A&B por pessoa fora das mesas dos observadores. O plano só segue se as três confirmarem a combinação da seção 10.3.

Depois da abertura, quatro indicadores semanais acompanham as premissas críticas. O limite de alerta de cada um sai do ponto de ruptura:

- ocupação de fim de semana: alerta abaixo de 41,5% por quatro semanas seguidas;
- ocupação de dia útil: alerta abaixo de 23%;
- gasto com A&B por pessoa, pelas notas: alerta abaixo de R$ 24,00;
- permanência média, pela reserva: alerta acima de 120 minutos.

Cada alerta tem uma ação. Ocupação baixa no dia útil leva a reduzir o horário de segunda a quinta e a equipe do dia. Ocupação baixa no fim de semana leva a eventos e torneios nas noites de sexta. Gasto baixo com A&B leva a rever o cardápio e a oferta do instrutor na mesa. A responsabilidade pelos indicadores é do gerente, com revisão mensal pelo sócio.
