# Cap. 9 — Plano Financeiro

## Função no plano

Responder se o negócio é viável e sob quais condições. O capítulo não vale pelos indicadores em si, mas pela **rastreabilidade e pelo teste das premissas** que os geram.

## Divisão de subcapítulos

| Subcapítulo | Conteúdo |
|---|---|
| **9.1 Árvore de direcionadores** | Decomposição de receita e custo (§1) |
| **9.2 Registro de premissas** | Quadro com faixas, fonte e nível de evidência (§2 e §3) |
| **9.3 Investimento inicial e financiamento** | Fixo, pré-operacional, acervo, capital de giro; fontes de recursos |
| **9.4 Receitas, custos e despesas projetados** | Mensal no ano 1 (rampa de maturação), anual nos seguintes |
| **9.5 Demonstrativos projetados** | DRE e fluxo de caixa, horizonte de 5 anos |
| **9.6 Indicadores de viabilidade** | Ponto de equilíbrio, VPL, TIR, payback descontado, nos três cenários; taxa mínima de atratividade justificada |
| **9.7 Triangulação, sensibilidade e ponto de ruptura** | §4 |
| **9.8 Checagens de coerência** | §5 |

Interpretação estratégica do tornado e dos pontos de ruptura: cap. 10 ([9_anal-riscos.md](9_anal-riscos.md)).

## 1. Árvore de direcionadores

**Nenhum número grande entra direto.** Receita e custo são decompostos até chegar a variáveis que dá para medir ou comparar com referências.

```
Receita mensal
├── Couvert lúdico = clientes/dia × % que paga couvert × preço do couvert × dias abertos
├── Alimentos e bebidas = clientes/dia × ticket médio de A&B × dias abertos
│     └── clientes/dia = mesas × pessoas/mesa × giros/dia × taxa de ocupação
│           └── ocupação separada por dia útil × fim de semana
└── Eventos/aluguel de espaço = eventos/mês × preço médio

Custos
├── Variáveis: CMV de A&B (% da receita), taxas de cartão, reposição e desgaste do acervo
├── Fixos: aluguel, pessoal (salário + encargos), utilidades, marketing, contador, software
└── Investimento: reforma, mobiliário, cozinha e bar, acervo inicial, capital de giro, pré-operacional
```

- **Taxa de ocupação e ticket médio costumam concentrar quase todo o risco.** Eles merecem mais evidência que o resto (ver instrumentos em [4_metodologia.md](4_metodologia.md)).
- A árvore aparece como figura no texto; cada folha corresponde a uma linha do registro de premissas.

## 2. Hierarquia de evidências

Cada premissa recebe um nível. **Quanto mais alto o nível, mais confiável** (N1 é o mais confiável).

| Nível | Tipo de evidência | Exemplo |
|---|---|---|
| **N1** | Orçamento ou cotação real, contrato, tabela oficial | Cotação de aluguel do ponto, tabela do Simples Nacional, piso da convenção coletiva |
| **N2** | Dado público estruturado | IBGE (população, renda), RAIS/CAGED (salários), FipeZap (aluguel comercial) |
| **N3** | Benchmark de concorrentes medido pelo autor | Preços e horários do Bloco A |
| **N4** | Referências setoriais e relatórios | Sebrae, Abrasel, CMV típico de bares |
| **N5** | Coleta primária comportamental própria | Contagem direta de ocupação (Bloco D) |
| **N6** | Estimativa do autor ou entrevista informal | "Acho que dá 3 giros por noite" |

**Regra de robustez:** nenhuma premissa crítica (definida pelo tornado, §4.2) pode ficar só em N6. Se não houver alternativa, ela precisa de faixa larga e aparecer destacada na análise de risco (cap. 10).

Premissas sustentadas por mais de uma fonte registram todos os níveis (ex.: `N3 + N5`).

## 3. Registro de premissas (com faixas)

Tabela única, no apêndice do TCC e na aba `premissas` do modelo. Uma linha por folha da árvore de direcionadores.

| ID | Premissa | Unidade | Pessimista | Provável | Otimista | Fonte | Nível | Justificativa da faixa | Impacto no VPL |
|---|---|---|---|---|---|---|---|---|---|
| R03 | Ocupação em dia útil | % | 25 | 40 | 55 | Blocos B e D | N3/N5 | ... | Alto |
| C07 | Aluguel | R$/mês | ... | ... | ... | FipeZap + 3 cotações | N1/N2 | ... | Médio |

Regras:
- **Toda premissa tem faixa**, não só valor único. Os cenários saem daí.
- **Fonte específica:** "FipeZap, locação comercial, [capital], [mês/ano]" — nunca "internet".
- **Justificativa explícita da faixa:** por que o pessimista é 25% e não 15%.
- **IDs estáveis:** `R` receita, `C` custo, `I` investimento, `M` macro/financeiro (ex.: TMA, inflação). O ID é usado no texto, no modelo e no código.
- A coluna "Impacto no VPL" é preenchida depois do tornado (§4.2).

## 4. Triangulação, tornado e ponto de ruptura

### 4.1 Triangulação da receita
Calcular a receita por dois caminhos independentes:
- **Bottom-up:** capacidade × ocupação × ticket.
- **Top-down:** receita implícita de concorrentes parecidos, ou fatia do público-alvo × frequência × gasto.

Se a diferença passar de ~30%, alguma premissa está errada. Registrar a conciliação no texto.

### 4.2 Sensibilidade (gráfico tornado)
Variar cada premissa entre pessimista e otimista, mantendo as demais no provável; ordenar pelo impacto no VPL. As 3 a 5 primeiras são as **premissas críticas**.

### 4.3 Ponto de ruptura
Para cada premissa crítica, calcular o valor que zera o VPL. Redação padrão: "o negócio é viável enquanto a ocupação média ficar acima de X%". A discussão passa a ser a plausibilidade de ficar acima do ponto de ruptura.

### 4.4 Simulação de Monte Carlo (opcional)
Distribuições triangulares com os três valores do registro; 10 mil simulações; resultado como probabilidade de VPL > 0 e distribuição do payback. Declarar a hipótese de independência entre premissas ou modelar correlações relevantes (ex.: ocupação × ticket).

## 5. Checagens de coerência

Verificar antes de fechar o modelo e registrar o resultado em apêndice:
- A capacidade física comporta a demanda projetada? (clientes/dia ≤ lugares × giros possíveis no horário)
- A equipe dimensionada (7.5) atende a ocupação projetada?
- CMV e margens batem com referências setoriais?
- O preço está na faixa dos concorrentes do Bloco A? Se acima, o posicionamento justifica?
- A rampa de maturação é realista (6 a 12 meses, sem ocupação madura no mês 1)?
- Encargos e impostos batem com o regime tributário do cap. 8?
- A demanda projetada é compatível com o tamanho do público-alvo (penetração plausível)?

## Modelo financeiro (planilha ou código)

- **Dirigido por premissas:** aba `premissas` (registro), abas de cálculo (`receitas`, `custos`, `investimento`, `dre`, `fluxo_caixa`, `indicadores`), aba `sensibilidade`.
- **Cenário como parâmetro:** um seletor (pessimista/provável/otimista) alimenta todo o modelo.
- **Nenhum número digitado dentro de fórmula de cálculo.** Todo valor vem da aba de premissas.
- Valores em termos reais (preços constantes) ou nominais — declarar a escolha e manter a TMA coerente com ela.
- Se implementado em Python, seguir o padrão do pipeline em `_src/` e exportar resultados para `_data/processed/` com prefixo `financeiro_`.

## Referências de apoio

- ASSAF NETO, Alexandre. *Finanças corporativas e valor*. Atlas. `[A VERIFICAR]`
- DAMODARAN, Aswath. *Avaliação de investimentos*. `[A VERIFICAR]`
- SAVAGE, Sam L. *The flaw of averages*. Wiley, 2009. — por que usar distribuições em vez de médias. `[A VERIFICAR]`
