# Estrutura do TCC

## Descrição geral

**Tipo:** TCC plano de negócios baseado em evidências.
**Objeto:** estabelecimento no formato luderia/ludobar/quiz-bar em Salvador (BA).
**Pergunta central:** o negócio é viável em Salvador, e sob quais condições (bairro e ponto, formato, preço, acervo, investimento)?
**Recorte geográfico:** o plano é para Salvador. A concorrência das 14 metrópoles da REGIC serve de benchmark de preço, satisfação e fluxo; as bases públicas de Salvador (e, quando houver, por bairro) definem demanda e custos.
**Diferencial do trabalho:** premissas rastreáveis e testadas, sustentadas por dados secundários e primários comportamentais, com pipeline reproduzível.

Princípios gerais: ver [../CLAUDE.md](../CLAUDE.md). Este arquivo traz a visão do todo, o teto de páginas e a estrutura dos capítulos. O resto ficou em arquivos próprios (divisão de 31/10/2026, numeração P1 a P6 mantida):

| Arquivo | Conteúdo |
|---|---|
| [1a_principios.md](1a_principios.md) | P1 a P4: hierarquias de fontes, de tipos de dados e de focos; precedência dos caps. 6 e 8; personalização da estrutura |
| [1b_escrita.md](1b_escrita.md) | P5 e P6: regras de escrita e vocabulário controlado |
| [1c_versoes.md](1c_versoes.md) | TMax e TMin, DMax e DMin, numeração `_v<n>` e pastas `_arquivo/` |
| [1d_formatacao.md](1d_formatacao.md) | Formatação dos `.docx` e `.pdf`, suplementar à skill `formatacao-texto-ufba` |

## Extensão: no máximo 90 páginas

O teto de cada capítulo é fixado antes da escrita. Capítulo que estourar o teto perde parágrafos descritivos (nível 5 da hierarquia de focos, P3 em [1a_principios.md](1a_principios.md)) antes de perder evidência de premissa crítica.

| Parte | Teto (páginas) |
|---|---|
| Elementos pré-textuais (folha de rosto a sumário) | 10 |
| 1 Introdução | 4 |
| 2 Referencial teórico | 10 |
| 3 Metodologia | 10 |
| 4 Sumário executivo | 2 |
| 5 Análise de mercado | 7 |
| 6 Plano de marketing | 8 |
| 7 Plano operacional | 4 |
| 8 Aspectos jurídicos e legais | 3 |
| 9 Plano financeiro | 12 |
| 10 Análise estratégica e de riscos | 4 |
| 11 Considerações finais | 2 |
| Referências | 5 |
| Apêndices | 9 |
| **Total** | **90** |

- Referência de conversão: cerca de 350 palavras por página de texto corrido (A4, fonte 12, espaço 1,5). Cada tabela, quadro ou figura desconta meia página do teto do capítulo.
- Prosa que só descreve um conjunto de itens vira quadro (lista em [10_biblio-apendices.md](10_biblio-apendices.md), "Quadros e tabelas: texto ou apêndice"). O texto em volta do quadro diz só a conclusão e a decisão que ela muda.
- O que não muda decisão do plano vai para apêndice ou sai. Os apêndices também têm teto: o que não couber fica só no repositório, com o link citado no apêndice K.
- Extras (testes de hipótese H1–H9 e Monte Carlo) não entram no corpo. Se feitos, vão para os apêndices L e M, e o total de 90 páginas continua valendo: o espaço sai dos demais apêndices, que passam a ser resumidos com link para o repositório.

## Estrutura

Cada capítulo com arquivo de instrução próprio aponta para ele. Capítulos sem arquivo seguem a descrição abaixo.

### 1. Introdução — *sem arquivo próprio*

- **1.1 Contextualização** — crescimento do mercado de jogos de tabuleiro; surgimento das luderias no Brasil.
- **1.2 Problema e oportunidade** — consumo de experiências; falta de evidência para as premissas de um investimento no formato.
- **1.3 Objetivos** — geral (avaliar a viabilidade) e **no máximo 6 específicos, um por decisão do plano**, cada um ligado a um capítulo e respondido em um parágrafo próprio em 11.2. Proposta:

  | Objetivo específico | Decisão do plano | Capítulo |
  |---|---|---|
  | (i) Analisar o mercado e a concorrência nas 14 metrópoles, com destaque para Salvador | Há espaço para o formato? Qual o preço de referência? | 5 |
  | (ii) Definir o posicionamento e o composto de marketing a partir dos aspectos que mais pesam na satisfação dos clientes | Proposta de valor, acervo, cardápio, preço, bairro | 6.1 a 6.5 |
  | (iii) Estimar a demanda e a ocupação de um estabelecimento comparável | Quantos visitantes por semana projetar? | 6.6 e 9.2 |
  | (iv) Dimensionar a operação e os requisitos legais | Capacidade, equipe, layout, regime tributário, licenças | 7 e 8 |
  | (v) Projetar investimento, receitas, custos e indicadores de viabilidade | Investir ou não? | 9 |
  | (vi) Identificar as premissas críticas, os pontos de ruptura e os riscos | Sob quais condições o negócio se sustenta? O que validar antes de investir? | 10 |

  Objetivo que não muda decisão sai. Hipótese estatística não é objetivo.
- **1.4 Justificativa** — acadêmica, social e gerencial.
- **1.5 Estrutura do trabalho** — um parágrafo por capítulo.

### 2. Referencial Teórico → [2_ref-teorico.md](2_ref-teorico.md)

- **2.1 Empreendedorismo e plano de negócios** — função e componentes do plano.
- **2.2 Estratégia e modelo de negócio** — Canvas, Oceano Azul e grade ERRC, cinco forças, SWOT, PESTEL.
- **2.3 Lazer, jogo e economia da experiência** — conceito de lazer, consumo de experiências.
- **2.4 Público de jogos de tabuleiro e cartas** — perfil do jogador de jogos de tabuleiro, Brasil e exterior.
- **2.5 Estabelecimentos de lazer e entretenimento** — bares temáticos, terceiro lugar, luderias.
- **2.6 Viabilidade econômico-financeira e decisão sob incerteza** — VPL, TIR, payback, ponto de equilíbrio, cenários, sensibilidade, simulação.

### 3. Metodologia → [4_metodologia.md](4_metodologia.md)

- **3.1 Caracterização do trabalho** — plano de negócios baseado em evidências.
- **3.2 Hierarquia de evidências** — escala N1–N6 e hierarquia de tipos de dados.
- **3.3 Fontes e instrumentos de coleta** — Blocos B1, B2, B3 e B4, em ordem de relevância.
- **3.4 Tratamento dos dados** — pipeline, pseudonimização, variáveis, validação do dicionário.
- **3.5 Registro prévio e testes de hipótese** — *Extra, só se sobrar tempo no fim (ver [4_metodologia.md](4_metodologia.md) §3.5).* H1–H9, na base inteira (sem divisão em metades). Se não for feito, a seção sai e as seguintes sobem um número.
- **3.6 Técnicas de análise e controles** — técnicas por área, calibração da ocupação, controles estatísticos.
- **3.7 Matriz de evidências** — decisão → pergunta → dado → fonte → confiança.
- **3.8 Aspectos éticos e legais** — base legal, pseudonimização, observação sem identificação.
- **3.9 Limitações** — o que o método não garante e como isso entra nos cenários.

### 4. Sumário Executivo — *sem arquivo próprio*

Escrito por último, em até duas páginas. Não traz informação que não esteja no restante do plano.

- **4.1 Conceito do negócio** — o que é, para quem, proposta de valor em uma frase.
- **4.2 Empreendedor** — perfil e competências relevantes.
- **4.3 Missão, visão e valores**
- **4.4 Síntese de mercado** — tamanho, concorrência, oportunidade.
- **4.5 Síntese financeira** — investimento, VPL, TIR, payback, ponto de equilíbrio nos três cenários.
- **4.6 Parecer de viabilidade** — veredito e condições críticas (pontos de ruptura).

### 5. Análise de Mercado → [3_mercado.md](3_mercado.md)

- **5.1 Análise do setor** — tamanho, crescimento, tendências.
- **5.2 Público-alvo e segmentação** — perfil do público; ocasiões de consumo; público em Salvador. Escrito depois do fim da análise do Bloco B2.
- **5.3 Análise da concorrência** — Bloco B1 (14 metrópoles, mais de 100 avaliações), com destaque para Salvador.
- **5.4 Fornecedores** — jogos, A&B, mobiliário.
- **5.5 Macroambiente (PESTEL)**

### 6. Plano de Marketing → [5_marketing.md](5_marketing.md)

- **6.1 Proposta de valor e posicionamento** — grade ERRC.
- **6.2 Produto/serviço** — experiência, acervo (jogos citados nas avaliações, Bloco B2, e acervo declarado dos concorrentes, Bloco B1), cardápio.
- **6.3 Preço**
- **6.4 Praça** — escolha do bairro e do ponto em Salvador.
- **6.5 Promoção e comunicação**
- **6.6 Estimativa de demanda** — calibração e triangulação.

### 7. Plano Operacional → [7_operacional.md](7_operacional.md)

- **7.1 Localização e layout**
- **7.2 Capacidade instalada**
- **7.3 Processos operacionais**
- **7.4 Gestão do acervo**
- **7.5 Estrutura organizacional e pessoal**

### 8. Aspectos Jurídicos e Legais → [6_juridico.md](6_juridico.md)

- **8.1 Forma jurídica e enquadramento tributário**
- **8.2 Licenças, alvarás e obrigações**
- **8.3 Contratos e propriedade intelectual**

### 9. Plano Financeiro → [8_financeiro.md](8_financeiro.md)

- **9.1 Árvore de direcionadores**
- **9.2 Registro de premissas**
- **9.3 Investimento inicial e financiamento**
- **9.4 Receitas, custos e despesas projetados**
- **9.5 Demonstrativos projetados** — DRE e fluxo de caixa.
- **9.6 Indicadores de viabilidade**
- **9.7 Triangulação, sensibilidade e ponto de ruptura** — Monte Carlo é extra, só se sobrar tempo.
- **9.8 Checagens de coerência**

### 10. Análise Estratégica e de Riscos → [9_anal-riscos.md](9_anal-riscos.md)

- **10.1 Matriz SWOT**
- **10.2 Cenários**
- **10.3 Premissas críticas e pontos de ruptura**
- **10.4 Matriz de riscos**
- **10.5 Plano de contingência e indicadores de monitoramento**

### 11. Considerações Finais — *sem arquivo próprio*

- **11.1 Parecer de viabilidade** — resposta direta à pergunta central, com as condições que a sustentam.
- **11.2 Síntese dos objetivos** — um parágrafo por objetivo específico, na ordem de 1.3, cada um respondendo explicitamente a decisão que o objetivo anunciou.
- **11.3 Limitações** — principalmente das premissas de maior incerteza. Explicitar, entre elas, as do Bloco B3: a NFC-e só é emitida a pedido do cliente, então as notas emitidas são piso das vendas e o caminho das notas fiscais dá limite inferior do fluxo; e houve um único intervalo entre as visitas de cada unidade, abaixo dos 15 dias planejados (Paralela, 17/10 a 30/10/2026, 13 dias; Bela Vista, 6 dias), que não capta a variação do mês nem a sazonalidade ([4_metodologia.md](4_metodologia.md) §3.9).
- **11.4 Próximos passos** — validações a fazer antes de investir (ex.: evento piloto, cotação de ponto).
- **11.5 Estudos futuros** — pesquisa que ficou fora do escopo (ex.: histórico completo de avaliações, sem o recorte de três meses; histórico dos avaliadores; comparação entre modelos de alimentos e bebidas).

### Referências, Apêndices e Anexos → [10_biblio-apendices.md](10_biblio-apendices.md)
