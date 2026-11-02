# Cap. 10 — Análise Estratégica e de Riscos

## Função no plano

Consolidar forças, fraquezas e riscos, e mostrar **o que acontece se as premissas estiverem erradas**. O cálculo de sensibilidade é feito no cap. 9; aqui ele é interpretado e convertido em ações.

## Divisão de subcapítulos

### 10.1 Matriz SWOT
- Forças e fraquezas: internas, ligadas às decisões dos caps. 6 a 8.
- Oportunidades e ameaças: externas, ligadas aos achados do cap. 5.
- Cada item com evidência ou remissão à seção que o sustenta. Nada de item genérico ("equipe motivada").
- Cruzamento SWOT (estratégias FO, FA, DO, DA) em forma resumida.

### 10.2 Cenários
- Pessimista, provável e otimista, construídos a partir das faixas do registro de premissas.
- Narrativa de cada cenário: que combinação de condições de mercado o produz.
- Quadro-resumo com investimento, VPL, TIR, payback e ponto de equilíbrio por cenário.
- Resultado da simulação de Monte Carlo, só se o extra for feito (probabilidade de VPL > 0, com remissão ao apêndice).

### 10.3 Premissas críticas e pontos de ruptura
- Gráfico tornado (do cap. 9) com interpretação.
- Para cada premissa crítica: valor provável, ponto de ruptura, distância entre os dois, nível de evidência.
- Destaque obrigatório para premissa crítica sustentada só por N6 (regra de robustez).

### 10.4 Matriz de riscos
- Riscos de mercado (demanda abaixo do esperado, entrada de concorrente), operacionais (desgaste do acervo, equipe), financeiros (juros, inflação de insumos), legais (licenças, zoneamento).
- Classificação probabilidade × impacto, com fonte para a probabilidade sempre que houver (ex.: sobrevivência via dados abertos do CNPJ e Sebrae).
- Matriz em quadro ou mapa de calor.

### 10.5 Plano de contingência e indicadores de monitoramento
- Para cada risco alto: gatilho observável, ação e responsável.
- Indicadores de monitoramento ligados às premissas críticas (ex.: ocupação semanal, ticket médio), com limite de alerta derivado do ponto de ruptura.
- Validações a fazer antes de investir (ex.: evento piloto, cotação do ponto), que reduzem a incerteza das premissas críticas.
- Opções de expansão: etapas 2 a 4 da P7 ([1a_principios.md](1a_principios.md)), com gatilho, investimento e efeito estimado.

### 10.6 Gatilhos de perda máxima

Indicadores medidos todo mês a partir da maturação (mês 9 no provável), com o caixa e a NFC-e. Cada gatilho dispara um conjunto de medidas, da mais barata à mais drástica. As medidas de preço são contingência: o preço base continua o do cap. 6 (P3). Limites propostos pelo autor (N6), salvo os derivados do modelo.

| Gatilho | Condição | Medidas |
|---|---|---|
| G1. Demanda baixa | Receita mensal abaixo do equilíbrio operacional (custo fixo ÷ margem de contribuição; cerca de R$ 45 mil no provável) por 2 meses seguidos | Marketing dirigido (parcerias com escolas, empresas e grupos de jogos); eventos de comunidade nos dias fracos; reserva com sinal; taxa de entrada reduzida com sessão limitada à permanência média das visitas (cerca de 1h50) |
| G2. Mesa vazia de gente | Média de pessoas por mesa abaixo de 3 por 3 meses | Taxa por mesa, e não por pessoa (cada mesa recebe um só grupo; quanto maior o grupo, mais consumo); desconto progressivo na taxa conforme o número de pessoas na mesa |
| G3. Consumo baixo | Gasto de A&B por pessoa abaixo da metade da cesta de consumo por 3 meses | Taxa de entrada mais cara, revertida em consumação; combos de entrada com bebida |
| G4. Dia útil fraco | Ocupação de terça a quinta abaixo de 40% da do fim de semana por 3 meses | Fechar a terça (ou terça e quarta) e refazer a escala; eventos fechados e aluguel do espaço nos dias fechados; passaporte mensal com direito a um número de dias e de acompanhantes, vendido para os dias úteis |
| G5. Caixa negativo | EBITDA negativo por 3 meses seguidos, ou caixa abaixo de 1 mês de custo fixo | Corte do meio período; renegociação do aluguel; suspensão das etapas de expansão; passaporte mensal e pré-venda para antecipar caixa |
| G6. Saída | EBITDA acumulado de 6 meses negativo depois do mês 12, com G5 ativo e medidas de G1 a G4 já aplicadas | Encerrar ou trocar o formato (só eventos, aluguel e venda de jogos); venda do acervo e do mobiliário para limitar a perda ao investimento menos o valor de revenda |
