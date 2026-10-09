# Diagnóstico teórico — inventário das necessidades de fundamentação

Etapa 1 da auditoria bibliográfica reversa. Data: 09/10/2026.

**Escopo desta etapa:** só leitura dos arquivos do projeto. Nenhuma referência nova foi buscada ou verificada. Os arquivos originais não foram alterados.

**Arquivos lidos:** `CLAUDE.md`; `_instrucoes/1` a `10`; `textos/projeto_pesquisa_luderia.md`; `textos/registro_previo_luderia.md`; `textos/1_introducao_plano_luderia.md`; `bibliografia/referencias_bases_publicas.md`.
**Não lidos nesta etapa:** `cronograma_*`, `roteiro_observacao_sao_jogue.md`, os `.docx` e o código de `_src/`.

Legenda do campo **Natureza**:

- **Op** — escolha operacional do autor (basta declarar e justificar pelo contexto).
- **Fund** — precisa de fundamentação na literatura.
- **Op+Fund** — a escolha é do autor, mas a justificativa depende de literatura.
- **Legal** — norma ou fonte oficial, não literatura acadêmica.

---

## 0. Pontos que mudam o diagnóstico

**Decisão do autor (09/10/2026): o recorte "público casual" saiu de vez.** O casual deixa de ser diferencial porque já é o público atual da maioria das luderias. Efeitos: Stebbins, jogador casual × hobbyista e Oceano Azul passam a P3 (contexto); 2.3 e 2.4 dos arquivos de instrução e a introdução ficam desatualizados em relação a essa decisão (não alterados aqui). Em seu lugar, o autor propõe uma hipótese sobre um **público potencial** (§9). Os itens 1 e 2 abaixo ficam como registro da inconsistência encontrada.

1. **O recorte "público casual" saiu do projeto, mas continua nas instruções.** O commit `61599fa` (02/10/2026) retirou o recorte de `projeto_pesquisa_luderia.md`, com a justificativa de que "a maioria das luderias já atende o público casual". `_instrucoes/1_estrutura.md`, `2_ref-teorico.md`, `3_mercado.md`, `5_marketing.md` e `1_introducao_plano_luderia.md` ainda sustentam o posicionamento "casual × hobbyista" (subcapítulos 2.3, 2.4, 5.2, 6.1). A introdução afirma o oposto do commit: que as luderias "operam majoritariamente voltadas ao público hobbyista".
   **Consequência:** a fundamentação de Stebbins, jogador casual × hobbyista e Oceano Azul vale só se o recorte voltar. Este diagnóstico marca esses itens como **condicionais**.
2. **Pressuposto P1 contradiz a introdução.** P1 diz que o público das luderias "é majoritariamente casual". A introdução diz que a oferta atende o hobbyista. Os dois textos não podem coexistir.
3. **O objeto da pesquisa mudou de pergunta.** Hoje é "viabilidade em Salvador" (plano de negócios baseado em evidências), não "segmento casual". Isso desloca o peso bibliográfico para planejamento, viabilidade financeira, proxies de demanda e método de coleta.

---

## 1. Variáveis e indicadores

### 1.1 Variáveis do Bloco A (estabelecimentos e cardápios)

| Cód. | Variável | Definição operacional | Mensuração | Natureza | Problema de validade |
|---|---|---|---|---|---|
| A01 | Avaliação média Google | Nota média do estabelecimento | 1–5 | Fund | Mede satisfação percebida de quem avalia, não desempenho. Distribuição enviesada (autosseleção). O Quadro 03 a fundamenta em "Cinco forças", o que não se sustenta (ver §6.2) |
| A02 | Volume de avaliações | Contagem total no Google | Contagem | Fund | Usado como "porte" e como corte de seleção (>100). Proxy de fluxo sem calibração própria; mistura tempo de existência com movimento |
| A03 | Política de cobrança | Couvert, por hora, consumação mínima, outra | Categórica | Op+Fund | Classificação do autor. Falta teoria de precificação (tarifa em duas partes, preço fixo × por uso) |
| A04 | Acervo declarado | Número de títulos | Contagem | Op | Declaração do estabelecimento, sem verificação |
| A05 | Entorno (shoppings, metrô) | Contagem em 500 m e 1.000 m | Contagem | Op+Fund | Raios arbitrários; falta teoria de localização e atração comercial |
| A06–A08 | Itens, preço por item, couvert | Cardápio coletado em data fixa | R$; contagem | Op | Preço de cardápio não é consumo por pessoa |
| A09 | Notas por aspecto (comida, ambiente, serviço) | Notas por aspecto do Google | 1–5 | Fund | Depende de o Google expor essas notas; aspectos coincidem com construtos de servicescape e qualidade de serviço |
| A10–A11 | Horário, endereço, shopping × rua | Registro | Horas; binária | Op | — |
| — | Cesta por pessoa | Couvert + 1 bebida + 1 entrada ou prato, em P25/mediana/P75 | R$ | Op+Fund | Composição arbitrária. Os percentis definem a "faixa" de H5 pelo mesmo cardápio, o que pode tornar o teste quase tautológico |

### 1.2 Variáveis do Bloco B (avaliações)

| Cód. | Variável | Definição operacional | Natureza | Problema de validade |
|---|---|---|---|---|
| B01 | `nota` | 1–5 por avaliação | Fund | Escala ordinal tratada como linear (regressão linear). Distribuição em J. Falta o argumento de por que a nota mede o que o plano quer medir |
| B02/B03 | `asp_*`, `neg_*`, `pos_*` | Presença e polaridade de 11 aspectos por dicionário de termos | Fund | **Endogeneidade:** quem dá nota baixa tende a citar aspectos negativos; a menção não causa a nota. Validade de construto dos 11 aspectos (de onde vêm?). Dicionário com negação e ambiguidade |
| B04 | Tamanho do grupo citado | Número extraído do texto | Op | Relato espontâneo e raro; vies para grupos grandes |
| B05 | `valor_pessoa` | R$ por pessoa citado, ou conta ÷ pessoas | Fund | Poucos textos citam valor; autosseleção; mistura de conta com consumo individual |
| B06 | Jogos citados | Binária por jogo (dicionário do Bloco F) | Op | Depende do Bloco F, que "pode ser retirado" |
| B07 | **Velocidade de avaliações** | Nº de avaliações com texto até "um mês atrás" ÷ janela em dias | Fund | **Variável central da estimativa de demanda.** Proxy de fluxo com base teórica não demonstrada (§6.1) |
| — | `politica_cobranca` × `reclamacao_preco` | Proporção de avaliações com `neg_preco` por estabelecimento | Fund | Confunde política de cobrança com nível de preço |

### 1.3 Variáveis do Bloco D (contagem direta)

| Cód. | Variável | Definição operacional | Natureza | Problema de validade |
|---|---|---|---|---|
| D01 | Entradas e saídas de grupos | Horário e número de pessoas, registrados da porta | Op+Fund | Observação externa: erro de contagem acumula no saldo |
| D02 | Saldo de pessoas no interior | Entradas − saídas, a cada 30 min | Op+Fund | O saldo exige contagem inicial exata; não há referência de método |
| D03 | Tamanho do grupo | Pessoas por grupo na entrada | Op | — |
| D04 | Mesas disponíveis e ocupadas visíveis | Contagem de fora | Op | Não vê o salão inteiro |
| D05 | Número da NFC-e | Início e fim da visita; notas/dia no intervalo de 15 dias | Fund (metodológica) + Legal | Pressupõe numeração sequencial por série e unidade, sem venda de balcão ou delivery misturada. Sem fonte técnica |
| — | **Taxa de ocupação** | "Proporção dos lugares disponíveis efetivamente ocupados" (projeto, Quadro 01) | Fund | A definição usa lugares; o Bloco D mede pessoas e mesas visíveis. Falta definir o denominador (lugares, mesas, m²) e o período |
| — | **Giro de mesa** | "Número de grupos por mesa por período, inverso da permanência média" | Fund | Definição só vale se a mesa fica ocupada o tempo todo; sem tempo ocioso o inverso da permanência não é o giro |
| — | **Permanência** | Saída − entrada, com observações censuradas | Fund | Censura pelo início e fim da visita exige método próprio (análise de sobrevivência) |
| — | Visitantes/semana | Via notas fiscais × pessoas por nota; ou pessoas/hora × horas | Fund | Duas rotas com dias úteis inferidos; com 1 estabelecimento e 4 visitas |

### 1.4 Variáveis do Bloco E (bases públicas)

| Cód. | Variável | Natureza | Observação |
|---|---|---|---|
| E01/E02 | População por bairro e município; renda | Legal/Fund | Fonte oficial (IBGE). Fundamentação só da lógica de dimensionamento de mercado |
| E03 | Gasto com alimentação fora e recreação (POF 2017–18) | Op+Fund | Correção pelo IPCA; defasagem de 8 anos. Base metodológica da POF é do IBGE |
| E04 | PAS: receita, custos, pessoal | Op | Benchmark de coerência |
| E05 | Salário de admissão (Novo CAGED) | Op | — |
| E06 | Aluguel comercial (FipeZap, por cidade) | Op | Não distingue bairro |
| E07 | Alíquotas do Simples; CNAE | Legal | LC 123/2006; CONCLA |
| E08 | Selic e IPCA projetados (Focus) | Fund | Usados como taxa de desconto, o que não é o mesmo que custo de capital do projeto (§6.6) |

### 1.5 Variáveis do Bloco F (jogos)

| Variável | Natureza | Observação |
|---|---|---|
| `qt_tem`, `qt_teve`, `qt_quer`, `qt_favorito`, `qt_jogou` | Op+Fund | Engajamento do jogo. Índice de "acessibilidade" e clusters dependem da teoria de jogador casual × hobbyista (condicional ao §0.1). **Bloco de menor relevância; pode ser retirado** |
| Duração, idade mínima, nº de jogadores, mecânicas, nota BGG | Op | — |

### 1.6 Variáveis financeiras (cap. 9)

| ID | Variável | Natureza | Observação |
|---|---|---|---|
| R | Clientes/dia, % couvert, preço, dias abertos, ticket de A&B, eventos | Op+Fund | Árvore de direcionadores é escolha do autor |
| C | CMV, taxas de cartão, reposição do acervo, aluguel, pessoal, utilidades | Op | Referências setoriais para CMV (N4) |
| I | Reforma, mobiliário, cozinha, acervo, capital de giro, pré-operacional | Op | — |
| M | TMA, inflação | Fund | Seleção da taxa de desconto sem fonte teórica |
| — | VPL, TIR, payback descontado, ponto de equilíbrio | Fund | Livros-texto; exigem explicitar horizonte de 5 anos e valor residual |
| — | Ponto de ruptura | Fund | Conceito próprio ("valor que zera o VPL"); correspondente a "valor de comutação" (*switching value*) na análise de projetos |
| — | Cenários pessimista/provável/otimista | Op+Fund | Faixas definidas por justificativa individual |
| — | Probabilidade de VPL > 0 (Monte Carlo, opcional) | Fund | Distribuição triangular e independência assumidas |

---

## 2. Conceitos teóricos necessários

| Conceito | Onde entra | Condicional? | Estado no projeto |
|---|---|---|---|
| Plano de negócios (função, estrutura) | 2.1 | não | Dornelas, Sebrae `[A VERIFICAR]` |
| Estudo de viabilidade (mercadológica, operacional, econômico-financeira) | Objetivo geral; 2.1 | não | Definido citando Asakura et al. (2018), que é fonte fraca para definir o conceito (§6.9) |
| Plano de negócios "baseado em evidências" | Cap. 3 inteiro | não | **Sem fundamentação**; é a tese do trabalho |
| Escala de níveis de evidência N1–N6 | Cap. 3, 9 | não | Criação do autor; sem referência a graduações de evidência existentes |
| Modelo de negócio (Canvas) | 2.2, 6.1 | não | Osterwalder `[A VERIFICAR]` |
| Estratégia do Oceano Azul e grade ERRC | 2.2, 6.1 | **sim**, se o recorte casual não voltar | Kim & Mauborgne `[A VERIFICAR]` |
| Cinco forças | 2.2, 5.3 | não | Porter `[A VERIFICAR]`; ver a objeção de escala (§6.4) |
| SWOT | 2.2, 10.1 | não | Sem fonte citada |
| PESTEL | 2.2, 5.5 | não | Sem fonte citada |
| Composto de marketing (4 Ps) | Cap. 6 | não | Sem fonte citada |
| Lazer e lazer sério × casual | 2.3, 2.4 | **sim** | Stebbins, Marcellino `[A VERIFICAR]` |
| Economia da experiência | 2.3; Problema (1.1) | não | Pine & Gilmore `[A VERIFICAR]`; Gilovich et al. (2015) citado |
| Terceiro lugar | 2.5 | não | Oldenburg `[A VERIFICAR]` |
| *Competitive socialising* | 2.5; 5.1 | não | Fontes de mercado (Savills, KAM); falta base acadêmica |
| Luderia / board game café | 2.5; Quadro 01 | não | Definição "elaborado pelo autor"; falta literatura sobre o formato |
| Perfil do jogador de jogos de tabuleiro | 2.4; 5.2 | parcial | Fontes listadas, mas autosselecionadas (hobbyista) |
| Satisfação, qualidade de serviço, atributos obrigatórios × atrativos (Kano) | H1; penalidade-recompensa | não | Kano (1984) `[A VERIFICAR]` |
| Servicescape / ambiente físico | H1 ("ambiente") | não | **Sem fonte** |
| Avaliações online como indicador de demanda e de qualidade | Bloco B inteiro | não | **Sem fonte** |
| Análise de conteúdo e validade de dicionário | 3.4 | não | Bardin (2011) |
| Concordância entre codificadores (kappa) | 3.4 | não | Cohen (1960) `[A VERIFICAR]` |
| Registro prévio e divisão exploratória/confirmatória | 3.5 | não | **Sem fonte** |
| Controle de falsas descobertas | 3.5 | não | Benjamini & Hochberg (1995) `[A VERIFICAR]` |
| Capacidade, giro e utilização de assentos em serviços | 7.2; 9.1 | não | **Sem fonte** |
| Localização do estabelecimento e escolha de ponto | 6.4 | não | **Sem fonte** |
| Preço, estruturas de cobrança | 6.3; H3 | não | **Sem fonte** |
| Estimativa de demanda (top-down × bottom-up, penetração) | 6.6 | não | **Sem fonte** |
| Curva de maturação de novos negócios (6–12 meses) | 6.6; 9.4 | não | Premissa N6 |
| Sobrevivência e fracasso de restaurantes e pequenos negócios | 10.4 | não | Sebrae/CNPJ citados como fonte de dado |
| Análise de investimentos (VPL, TIR, payback, TMA) | 2.6; 9.6 | não | Assaf Neto, Damodaran `[A VERIFICAR]` |
| Sensibilidade, tornado, ponto de ruptura, Monte Carlo | 2.6; 9.7 | não | Savage (2009) `[A VERIFICAR]` |
| Triangulação de evidências | 9.7; 3.7 | não | **Sem fonte** |

---

## 3. Modelos, métodos e ferramentas de Administração

| Ferramenta | Capítulo | Sustentação atual |
|---|---|---|
| Plano de negócios | todos | Dornelas, Sebrae `[A VERIFICAR]` |
| Canvas | 6.1 (apêndice) | Osterwalder `[A VERIFICAR]` |
| ERRC / Oceano Azul | 6.1 | Kim & Mauborgne `[A VERIFICAR]` |
| Cinco forças | 5.3 | Porter `[A VERIFICAR]` |
| SWOT / cruzamento FO-FA-DO-DA | 10.1 | nenhuma |
| PESTEL | 5.5 | nenhuma |
| Composto de marketing | cap. 6 | nenhuma |
| Matriz de critérios ponderados (escolha do bairro) | 6.4 | nenhuma |
| Árvore de direcionadores | 9.1 | nenhuma |
| DRE e fluxo de caixa projetados | 9.5 | nenhuma específica |
| VPL, TIR, payback descontado, ponto de equilíbrio | 9.6 | Assaf Neto `[A VERIFICAR]` |
| Tornado, ponto de ruptura, Monte Carlo | 9.7 | Savage `[A VERIFICAR]` |
| Matriz de riscos probabilidade × impacto | 10.4 | nenhuma |
| Cenários | 10.2 | nenhuma |

---

## 4. Decisões metodológicas que precisam de fundamentação

| # | Decisão | Natureza | Por que precisa de fonte |
|---|---|---|---|
| M1 | Plano de negócios "baseado em evidências" com hierarquia N1–N6 | Fund | É a tese central; escala criada pelo autor |
| M2 | Hierarquia de tipos de dados: comportamental com dinheiro > ... > atitudinal | Op+Fund | Argumento "comportamento > intenção declarada" sustenta a exclusão de questionários |
| M3 | **Sem questionários** | Op+Fund | Decisão defensável, mas o texto precisa da literatura sobre intenção × comportamento e viés de não resposta |
| M4 | Avaliações do Google Maps como fonte de dados | Fund | Validade, autosseleção, viés de resposta; termos de uso da plataforma; ética de coleta automatizada |
| M5 | Recorte do Bloco B: avaliações com texto até "um mês atrás" | Op | Escolha operacional; a limitação (rótulo arredondado, sem sazonalidade) é declarada |
| M6 | Corte de 100 avaliações e 14 metrópoles da REGIC | Op | Fonte oficial (IBGE REGIC 2018); o corte de 100 é do autor |
| M7 | **Velocidade de avaliações como proxy de fluxo, calibrada por 1 estabelecimento** | Fund | Validade do proxy e do estimador por razão. Sem erro-padrão com n=1 |
| M8 | Contagem direta: 4 visitas, 3 h, sorteio de hora de início | Op+Fund | Amostragem de tempo; representatividade; critério de parada |
| M9 | Observação do lado de fora de espaço comercial | Op+Fund | Método de observação sistemática; ética e LGPD |
| M10 | NFC-e como contador de transações | Fund (metodológica) + Legal | Sem fonte técnica sobre numeração; risco de viés |
| M11 | Análise de conteúdo por dicionário, validada com kappa e F1 | Fund | Sem fonte para limiar de 0,70; kappa tem limitações conhecidas em itens raros |
| M12 | Registro prévio + divisão da base em exploratória/confirmatória | Op+Fund | Prática de ciência aberta incomum em planos de negócios; precisa de justificativa |
| M13 | Regressão linear com efeito fixo e erro agrupado | Fund | Nota ordinal; agrupamento por estabelecimento |
| M14 | Kruskal-Wallis, Mann-Whitney, bootstrap agrupado; tamanhos de efeito | Fund | Escolha de testes e de medidas (ε², delta de Cliff) |
| M15 | Correção de Benjamini-Hochberg sobre 2 testes (H1, H3) | Op+Fund | Com 2 testes, o ganho de BH sobre Bonferroni/Holm é mínimo; declarar a escolha |
| M16 | Triangulação com limite de 30% entre bottom-up e top-down | Op | Limite arbitrário; sem fonte |
| M17 | Sensibilidade unidimensional (tornado) + ponto de ruptura | Fund | Ignora correlações (ocupação × ticket) |
| M18 | Monte Carlo com distribuições triangulares e independência | Fund | Escolha da distribuição e da dependência |
| M19 | Taxa mínima de atratividade a partir de Selic/IPCA | Fund | Taxa livre de risco não é custo de capital do projeto |
| M20 | Horizonte de 5 anos e rampa de 6–12 meses | Op+Fund | Sem fonte de maturação |
| M21 | Matriz de critérios ponderados para escolher o bairro | Fund | Origem dos pesos e dos critérios |
| M22 | Tamanho do público-alvo via Meta Ads / planejador de palavras-chave (5.2) | Fund | Instrumento sem validade conhecida como estimador de mercado |

---

## 5. Hipóteses e relações entre variáveis

| Hip. | Enunciado vigente | Justificativa teórica explícita? | O que falta |
|---|---|---|---|
| **H1** | Menções negativas a atendimento e ambiente reduzem mais a nota que menções negativas a comida e bebida (efeito fixo de estabelecimento) | **Não.** O texto não diz por que atendimento/ambiente pesariam mais que comida/bebida num bar de jogos | Teoria de qualidade de serviço e de ambiente físico; estudos que comparam o peso de comida, serviço e ambiente na satisfação de restaurantes e bares. Sem isso, a direção da hipótese é palpite |
| **H3** | A proporção de avaliações com reclamação de preço difere entre políticas de cobrança | Não (bilateral, sem direção) | Teoria de percepção de preço, justiça de preço e estrutura de cobrança. Controle do nível de preço |
| **H5** | A mediana do valor por pessoa citado fica dentro da faixa da cesta do cardápio | Parcial (checagem de validade de construto) | É um teste de consistência entre duas medidas do ticket, não uma hipótese causal. Fundamentar como validação convergente |
| Exploratórias | Comida × nota; ranking de reclamações; penalidade e recompensa | — | Penalidade-recompensa vem de Brandt (1987) e Kano; precisa de fonte própria |
| **P1** | O público das luderias é majoritariamente casual | Não | Contradiz a introdução (§0.2) |
| **P2** | Ocupação e ticket concentram a incerteza | Será testado pelo tornado | Não precisa de fonte; é resultado |
| **P3** | A velocidade de avaliações, calibrada, estima o fluxo com incerteza aceitável | **Não** | **É a hipótese mais frágil do projeto e a que mais precisa de literatura** (§6.1) |

---

## 6. Problemas de validade conceitual, operacionalização e coerência

### 6.1 Velocidade de avaliações como proxy de fluxo (P3, B07, M7) — **crítico**

- A razão de calibração vem de **um** estabelecimento (São Jogue, duas unidades) e quatro visitas. Não permite estimar a variância da razão entre estabelecimentos; a limitação é declarada, mas o modelo de cálculo (item 3 do modelo de calibração) aplica a mesma razão a todos.
- A propensão a avaliar varia por tipo de público, política de incentivo do estabelecimento ("avalie e ganhe"), presença do Google Local Guides, turismo. Nada disso entra no modelo.
- O Bloco B só conta avaliações **com texto**. A razão avaliações-com-texto ÷ visitantes depende de quanto cada público escreve.
- A janela é um mês com rótulo relativo ("um mês atrás") arredondado pelo Google.
- **Falta literatura** sobre: avaliações online como proxy de demanda e de receita; viés de seleção em avaliações; estimador por razão e seu erro.

### 6.2 Fundamentação da coluna "Fundamentação" do Quadro 03

Vários itens citam um construto que não os sustenta: A01 (avaliação média) e A02 (volume) → "Cinco forças"; A05 (shoppings e metrô) → "Cinco forças"; A11 (endereço) → "Cinco forças"; B05 (valores citados) → "Indicadores de viabilidade"; E03 a E08 → "Indicadores de viabilidade" (genérico). A coluna deveria apontar para a teoria que justifica *medir aquilo daquela forma*, não para o capítulo onde o dado entra.

### 6.3 Taxa de ocupação, giro e permanência

- Definida em termos de "lugares", medida em pessoas e mesas visíveis de fora. Denominador indefinido.
- "Giro é o inverso da permanência" só vale com mesa sempre ocupada. Há conceito consolidado de utilização de assentos em operações de restaurante (receita por assento-hora) e relação entre fluxo, tempo de permanência e ocupação média (lei de Little); o projeto não os usa.
- Permanência censurada: usar a média dos observados subestima; o texto reconhece, mas não escolhe um estimador.

### 6.4 Ferramentas estratégicas aplicadas a um negócio único e local

- Cinco forças foi concebida para setores/indústrias. Aplicar a uma luderia em Salvador exige delimitar o "setor" (lazer social? bares? jogos?). Hoje o Bloco A trata como setor "luderias em 14 metrópoles", e a rivalidade que importa é a de Salvador (poucos concorrentes).
- Há divergência entre autores sobre a utilidade de Oceano Azul versus Cinco forças e sobre o uso de SWOT; o texto deve confrontar, como exige `2_ref-teorico.md`.
- **Oceano Azul** só se sustenta se o recorte casual permanecer (§0.1). A afirmação de que o Nintendo Wii "expandiu um mercado de nicho pela eliminação da barreira de entrada" (introdução) precisa de fonte própria; não está confirmado que Kim & Mauborgne tratem do Wii.

### 6.5 Atitudinal × comportamental e a exclusão de questionários (M2, M3)

A decisão é coerente internamente, mas a justificativa ("viés de amostragem e de não resposta") é do autor. A literatura sobre a lacuna entre intenção e comportamento e sobre viés hipotético em preferência declarada fundamentaria. Cuidado: a avaliação online também é um dado declarado e autosselecionado; a hierarquia coloca "rastros digitais" em 5º e "declarado factual" em 6º, o que é defensável, mas precisa de argumento, pois o Bloco B sustenta H1, H3, H5.

### 6.6 Taxa de desconto

O Quadro de evidências lista "Selic e IPCA projetados" como base da taxa de desconto (N2). Selic é taxa livre de risco; o custo de oportunidade de um negócio pequeno e sem liquidez inclui prêmio de risco. Sem ele, o VPL é sistematicamente otimista. Precisa de método (acréscimo de prêmios, "build-up", ou taxa de retorno exigida de pequenas empresas), e coerência real × nominal (a instrução manda declarar).

### 6.7 H1: endogeneidade e interpretação

- A menção negativa ao atendimento não "causa" a nota baixa: ambas decorrem da experiência. O contraste de coeficientes mede associação condicional, não peso causal.
- Aspectos não mencionados não são "ausência de problema".
- Nota 1–5 tratada como contínua: alternativa ordinal declarada como sensibilidade? O registro prévio não prevê.
- Quatro aspectos no contraste, mas 11 no modelo: multicolinearidade entre menções.

### 6.8 H3: confundimento

Política de cobrança correlaciona com nível de preço, porte e público. Sem controle do preço (o cardápio é coletado), a diferença de reclamações não é atribuível à política.

### 6.9 Definição do estudo de viabilidade

O Quadro 01 define "estudo de viabilidade econômica" por Asakura, Silva & Mello (2018), que é um estudo de caso aplicado, não uma fonte conceitual. A definição precisa vir de obra de análise de projetos. O mesmo vale para "plano de negócios" (Dornelas e Sebrae, ambos `[A VERIFICAR]`).

### 6.10 Limiares operacionais sem fonte

Kappa ≥ 0,70 e F1 ≥ 0,70; acerto exato ≥ 0,80; ≥30 menções; ≥10 avaliações por estabelecimento; ≥5 estabelecimentos por categoria; divergência de 30% entre bottom-up e top-down; 10.000 reamostragens; cestas em P25/P75. São escolhas operacionais legítimas, mas devem ser declaradas como convenção ou justificadas.

### 6.11 Coleta automatizada de avaliações

A coleta do Bloco B é automatizada sobre páginas públicas do Google Maps. A seção 3.8 cobre a base legal de dados pessoais (LGPD, Res. CNS 510/2016), mas não os termos de uso da plataforma nem a literatura sobre ética de raspagem. É risco jurídico e de reputação acadêmica, não só estatístico.

### 6.12 Possível inconsistência de datas na lista de leitura

`2_ref-teorico.md` lista "Harrington (2025), *Let's Meetup?*" com URL de DOI `10.1177/15554120231202707`; o identificador sugere submissão em 2023. Conferir ano e volume antes de citar. (Observação sobre a lista existente, ainda não verificada.)

---

## 7. O que é escolha operacional (não exige literatura) e o que exige

**Basta declarar e justificar pelo contexto (Op):**

- Praça: Salvador; 14 metrópoles REGIC como benchmark.
- Corte de 100 avaliações; janela de "um mês atrás"; 4 visitas de 3 h; semente fixa de sorteio.
- Categorias de cardápio; composição da cesta (declarar a arbitrariedade).
- Árvore de direcionadores; IDs de premissas; faixas pessimista/provável/otimista (justificadas caso a caso).
- Uso do Simples Nacional, CNAE, alíquotas (fonte legal).
- Coleta do Bloco E (fontes oficiais, sem literatura).

**Exige fundamentação na literatura (Fund / Op+Fund):** M1–M4, M7, M10–M15, M17–M19, M21–M22; os conceitos de §2 marcados "Sem fonte"; as hipóteses H1, H3 e a justificativa de P3.

**Fundamentação jurídica (Legal), fora da bibliografia acadêmica:** LC 123/2006; LGPD (Lei 13.709/2018); Res. CNS 510/2016; legislação de alvará, bombeiros, vigilância sanitária e ECAD; Lei de Locações; propriedade industrial (INPI). Normas citadas por nome no `6_juridico.md` ainda não têm número ou vigência conferida, exceto as três primeiras.

---

## 8. Resumo das necessidades bibliográficas (para a etapa 2)

Em ordem de criticidade:

1. **Avaliações online como indicador de demanda e de satisfação** (viés de autosseleção, proxy de fluxo, estimação por razão). Sustenta P3, M4, M7, B01, B07.
2. **Planejamento e evidência em novos negócios:** plano de negócios e desempenho; gestão baseada em evidências; planejamento orientado a premissas. Sustenta M1, N1–N6, 2.1.
3. **Análise de investimentos para pequenas empresas:** VPL, TIR, payback, custo de capital em negócio pequeno, real × nominal. Sustenta M19, 2.6, 9.6.
4. **Incerteza e sensibilidade:** tornado, ponto de ruptura, Monte Carlo, dependência entre premissas. Sustenta M17, M18.
5. **Qualidade de serviço, servicescape e satisfação em bares e restaurantes;** modelo de atributos obrigatórios × atrativos. Sustenta H1 e a análise de penalidade-recompensa.
6. **Gestão de capacidade, utilização de assentos e giro** em serviços de alimentação; relação fluxo × permanência × ocupação. Sustenta ocupação, giro, 7.2.
7. **Observação sistemática e amostragem de tempo;** estimação de duração com censura. Sustenta M8, M9, permanência.
8. **Mensuração em análise de conteúdo:** validade de dicionários, concordância entre codificadores, limiares. Sustenta M11.
9. **Ciência aberta aplicada:** registro prévio, divisão confirmatória, controle de falsas descobertas, modelos para dados ordinais e agrupados. Sustenta M12–M15.
10. **Precificação e percepção de preço:** estrutura de cobrança, justiça de preço. Sustenta H3, 6.3.
11. **Localização de pontos de serviço:** escolha de ponto e atração comercial; decisão multicritério. Sustenta 6.4, M21.
12. **Estratégia e marketing básicos:** cinco forças, SWOT, PESTEL, Canvas, composto de marketing; crítica a essas ferramentas.
13. **Lazer, experiência, terceiro lugar, competitive socialising, board game cafés.** Sustenta 2.3 a 2.5. **Parte condicional** ao §0.1.
14. **Consumo de jogos de tabuleiro no Brasil** (perfil, gasto, motivação). Sustenta 5.1, 5.2. Fontes já listadas; limitação de autosseleção.
15. **Fracasso e sobrevivência de bares e restaurantes.** Sustenta 10.4.

**Decisão necessária do autor antes da etapa 2:** o recorte "público casual" volta ao plano ou sai de vez dos textos? A resposta define se os itens 13 (Stebbins, jogador casual) e 12 (Oceano Azul) entram no roteiro como P1/P2 ou como P3.

---

## 9. Hipótese proposta: público potencial (pessoas de 30 anos ou mais, casadas e/ou com filhos)

**Formulação do autor (09/10/2026):** existe um público potencial (30 anos ou mais, casado e/ou com filhos) que frequentaria luderias se houvesse mudança no ambiente, no público ou na qualidade do serviço das luderias atuais.

**Status:** proposta, ainda não registrada. Não consta no registro prévio nem no projeto de pesquisa. Como a coleta do Bloco B e a divisão da base ainda não ocorreram, ela pode entrar como emenda datada antes de qualquer análise (registro prévio, §10).

**Problema de operacionalização (decidir antes de buscar a literatura).** A hipótese é contrafactual ("frequentaria se..."). O projeto não usa questionários e rebaixa dado atitudinal e de intenção ao último nível (CLAUDE.md, §2). Os dados do projeto também têm limites para ela:

| Dado | O que consegue mostrar | O que não consegue |
|---|---|---|
| Censo 2022, PNAD (Bloco E) | Tamanho do segmento em Salvador (30+, casados, com filhos) | Propensão a frequentar luderias |
| Avaliações (Bloco B) | Reclamações sobre ambiente, barulho, público e atendimento; menções a filhos, família, idade | Quem **não foi**. Só vê quem foi e avaliou, ou seja, quem tolerou o ambiente atual |
| Contagem direta (Bloco D) | Composição dos grupos, se o protocolo registrar crianças ou idade aparente | Hoje o protocolo proíbe registro de características individuais (3.8) |
| Cultura nas Capitais, Hábitos Culturais, POF | Comportamento de lazer e gasto do segmento | Relação com jogos de tabuleiro |

Formulações possíveis, da mais testável para a menos:

1. **Descritiva de tamanho (N2):** o segmento é grande em Salvador (Censo). Testável, mas não prova propensão.
2. **De barreira observada (N3):** entre as avaliações, as menções negativas a ambiente, barulho e público associam-se a menções a filhos/família/idade. Testável no Bloco B, com a limitação de só ver quem foi.
3. **Comparativa entre estabelecimentos (N3):** estabelecimentos com outro ambiente (diurno, em shopping, familiar) têm maior proporção de menções a filhos ou família. Testável no Bloco A + B; dependência de coletar `shopping/rua` e horário (A10, A11, já previstos).
4. **De intenção (N6/atitudinal):** "frequentaria se...". Só testável por questionário ou porta falsa, fora do escopo atual; entraria como validação recomendada (cap. 11).

Observação de validade: as três variáveis causais da hipótese (ambiente, público, qualidade do serviço) coincidem com aspectos já codificados no Bloco B (`ambiente`, `barulho`, `atendimento`, `explicacao_jogos`). Falta codificar **perfil do cliente** (filhos, família, idade, estado civil), que hoje não existe no dicionário (3.4).
