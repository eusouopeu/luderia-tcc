# Estrutura do TCC

## Descrição geral

**Tipo:** TCC plano de negócios baseado em evidências.
**Objeto:** estabelecimento no formato luderia/ludobar/quiz-bar em Salvador (BA).
**Pergunta central:** o negócio é viável em Salvador, e sob quais condições (bairro e ponto, formato, preço, acervo, investimento)?
**Recorte geográfico:** o plano é para Salvador. A concorrência das 14 metrópoles da REGIC serve de benchmark de preço, satisfação e fluxo; as bases públicas de Salvador (e, quando houver, por bairro) definem demanda e custos.
**Diferencial do trabalho:** premissas rastreáveis e testadas, sustentadas por dados secundários e primários comportamentais, com pipeline reproduzível.

Princípios gerais: ver [../CLAUDE.md](../CLAUDE.md). Hierarquias e personalizações da estrutura: seção "Princípios do plano", no fim deste arquivo.

## Versões do texto e dos dados

Pedido do autor em 31/10/2026.

- **TMax (Texto Máximo):** a versão completa dos capítulos, em `textos/capitulos/*.md`. É a fonte de verdade: dado, número ou correção entra primeiro nela.
- **TMin (Texto Mínimo):** a versão concisa, só com o estritamente necessário: menos citações (ver `2_ref-teorico.md`, "Escolha das obras"), sem repetições entre capítulos e sem parágrafos descritivos que não mudam decisão. Fica em `textos/capitulos/TMin/`, um `.md` por capítulo cortado; capítulo sem arquivo em `TMin/` entra no TMin igual ao TMax. Toda mudança de conteúdo no TMax é levada ao TMin do mesmo capítulo, se houver.
- **DMax (Dados Máximos):** as planilhas de dados agregados com todos os dados coletados (`dados/Dados agregados/*_DMax.xlsx`).
- **DMin (Dados Mínimos):** a versão essencial dos dados agregados, só com os dados mais relevantes para o plano e com menor risco de distorção por erro de coleta ou extração. O conteúdo será definido pelo autor; até lá, não existe arquivo DMin (a `B1_dados_agregados_resumido.xlsx` é anterior à regra e não é a DMin).
- **Numeração:** todo `.docx` e `.pdf` gerado leva o texto e a versão, `<nome>_<TMax|TMin>_v<n>`, em ordem crescente (v1, v2, v3...). A versão nova fica na pasta, e as anteriores vão para a subpasta `_arquivo/` da mesma pasta. O `_src/extras/gerar_docx_capitulo.js` faz a numeração e o arquivamento sozinho (opção `--pdf` para o trabalho inteiro).
- **Pastas `_arquivo/`:** cada pasta de saída de `dados/` (as subpastas de cada bloco, ou o próprio bloco quando não há subpasta, e `Dados agregados` e `Modelo financeiro`), de `textos/` (`capitulos`, `capitulos/TMin`, `instrumentos`, `planejamento`) e de `bibliografia/` tem uma `_arquivo/` para as versões antigas.

## Extensão: no máximo 90 páginas

O teto de cada capítulo é fixado antes da escrita. Capítulo que estourar o teto perde parágrafos descritivos (nível 5 da hierarquia de focos, P3) antes de perder evidência de premissa crítica.

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

## Princípios do plano

### P1. Hierarquia de fontes

Ordem de preferência quando duas fontes tratam do mesmo ponto. Fonte mais alta prevalece; divergência relevante entre fontes é registrada, não escondida.

Fontes bibliográficas e documentais (para números e premissas, usar a escala N1–N6 de [8_financeiro.md](8_financeiro.md) §2):

1. Legislação e normas técnicas oficiais
2. Artigos revisados por pares e livros acadêmicos
3. Teses e dissertações (BDTD, repositórios institucionais)
4. Relatórios de institutos oficiais e entidades setoriais
5. Livros profissionais e manuais de referência (ex.: guias de plano de negócios)
6. Imprensa especializada e de negócios
7. Blogs, sites institucionais de empresas, redes sociais — só como fato pontual (ex.: preço praticado), nunca como sustentação de argumento

Imprensa que cita um dado deve ser substituída pela fonte original sempre que ela for localizável.

### P2. Hierarquia de tipos de dados

Da maior para a menor confiabilidade para estimar comportamento de consumo:

1. **Comportamental com dinheiro** — compra, ingresso pago, pré-venda, depósito
2. **Registros operacionais e transacionais** — dados de caixa, reservas, contratos, cotações
3. **Comportamental observado diretamente** — contagem de ocupação, cliente oculto
4. **Comportamental sem dinheiro** — clique, cadastro em lista de espera, reserva gratuita
5. **Rastros digitais e proxies** — avaliações, volume de buscas, horários de pico, seguidores, público estimado de anúncios
6. **Declarado factual** — entrevista sobre números operacionais ("quantas mesas giram numa sexta?")
7. **Atitudinal** — opinião, intenção de compra, disposição a pagar declarada. **Evitar; nunca usar como base de premissa crítica.**

Critérios de desempate dentro do mesmo tipo:

- **Absoluto > relativo** (pessoas/hora > índice de 0 a 100)
- **Proxy calibrado > proxy não calibrado** (avaliações/mês convertidas por taxa medida > convertidas por taxa suposta)
- **Local > nacional > internacional**
- **Recente > defasado** (corrigir valores monetários antigos pelo IPCA)
- **Medido > estimado**

### P3. Hierarquia de focos

Onde investir tempo, texto e rigor, em ordem de prioridade:

1. **Decisões do plano** — abrir ou não, onde, formato, preço, acervo, investimento
2. **Premissas críticas** — as que mais movem o VPL no tornado; por padrão, **taxa de ocupação** e **ticket médio**
3. **Evidência dessas premissas** — triangulação, calibração, ponto de ruptura
4. **Coerência do conjunto** — capacidade × demanda, equipe × ocupação, preço × concorrência
5. **Contexto descritivo** — setor, tendências, perfil do público
6. **Rigor estatístico acessório** — correlações, testes, clusters que não mudam decisão → apêndice

Na dúvida entre aprofundar um item de nível baixo ou fortalecer um de nível alto, fortalecer o de nível alto.

**Precedência entre capítulos** (pedido do autor em 31/10/2026). Os caps. 6 (Plano de Marketing) e 8 (Aspectos Jurídicos e Legais) moldam o negócio: definem o que a luderia é, a quem atende, por quanto e dentro de que regras. Os demais capítulos de plano, em especial o 7 (Plano Operacional) e o 9 (Plano Financeiro), só tornam esse negócio viável. Por isso:

1. Em informação divergente entre capítulos, valem os caps. 6 e 8; os outros se ajustam a eles, e não o contrário.
2. Toda mudança nos caps. 6 ou 8 leva a um alerta imediato ao autor, na mesma resposta, com os capítulos a ajustar (7, 9, 10, 4, 11 e, se for o caso, 3 e 5) e o que muda em cada um. O alerta não autoriza ajustar os outros capítulos sem pedido do autor.
3. Se a viabilidade (caps. 7 e 9) pedir mudança no negócio, a proposta vai ao autor como mudança nos caps. 6 ou 8, e não como ajuste silencioso no operacional ou no financeiro.

### P4. Personalização da estrutura

Diferenças deliberadas em relação a um plano de negócios comum. Aplicar sempre.

1. **Metodologia (cap. 3) robusta.** Descreve fontes, critérios de coleta, tratamento, limitações e a hierarquia de evidências. O método é defendido pela **confiabilidade do número gerado**, não pela teoria. Detalhes em [4_metodologia.md](4_metodologia.md).
2. **Matriz de evidências** (quadro no cap. 3 ou apêndice). Tabela com: **decisão → pergunta → dado usado → fonte → confiança (N1–N6)**. Ex.: "Em que bairro de Salvador abrir?" → população e renda por bairro (IBGE) + localização dos concorrentes (Bloco B1) → N2 + N3.
3. **Plano financeiro (cap. 9) com premissas rastreáveis**, triangulação e sensibilidade. Detalhes em [8_financeiro.md](8_financeiro.md).
4. **Modelo financeiro dirigido por premissas.** Premissas numa aba, cálculos em outra, cenários como parâmetros. Nenhum número digitado dentro de fórmula de cálculo.
5. **Apêndices técnicos** com protocolos, dicionário de variáveis e link para o repositório (lista em [10_biblio-apendices.md](10_biblio-apendices.md)).
6. **Pipeline reproduzível.** Repositório com coleta → tratamento → análise, README na raiz e dicionário de dados. Qualquer número do texto deve ser regenerável a partir de um script de `_src/`.
7. **Produto visual.** Dashboard ou o próprio `_src/site-apresentacao/` com mapa de concorrentes, cenários e sensibilidade.

### P5. Escrita

Vale para todos os capítulos, junto com a skill `meu-estilo-escrita`.

1. **Parágrafo abre pela conclusão.** A primeira frase traz o achado ou a decisão; as seguintes trazem o número e a fonte; a última, quando preciso, liga ao plano.
2. **Sem metadiscurso.** Corta-se a frase que anuncia o que o texto vai fazer em vez de fazê-lo. Exemplos a evitar: "Esta seção apresenta…", "Para atingir esse propósito, foram traçados…", "A relevância… sustenta-se em três frentes complementares", "Do ponto de vista X,". O título da seção já diz do que ela trata.
3. **Adjetivo vira número ou sai.** Expressões como "crescimento estrutural", "público amplo", "majoritariamente", "preenche uma lacuna" e "fundamental" afirmam sem medir. Cada uma vira um número com fonte ("13,1% das vendas em 2025 (ABRINQ, 2026)") ou uma afirmação delimitada ("o único estudo de viabilidade localizado…"). Se não houver número, a frase sai.
4. **Números em formato único:** "R$ 53 bilhões" (não "R$ 53 bi"); percentuais com vírgula decimal ("13,1%"); faixa com "a" ("de 20 a 30 minutos"); unidade, recorte e data junto do número.
5. **Voz ativa ou passiva analítica**, como na skill `meu-estilo-escrita`, evitando a sintética: "foi adotado", não "adotou-se"; "o trabalho estima", não "estima-se" (decisão do autor, 31/10/2026).
6. **Travessão (—) para aposto e intercalação**, nunca hífen com espaços.

### P6. Vocabulário controlado

Cada termo é definido uma vez, no cap. 3 (ou na primeira ocorrência, se aparecer antes) e usado sempre com o mesmo sentido. Sinônimos não alternam com o termo.

| Termo | Definição | Não usar como sinônimo |
|---|---|---|
| **Luderia** | Estabelecimento que combina alimentos e bebidas com acervo de jogos de mesa para uso no local. Abrange os formatos chamados ludobar e quiz-bar, citados só na definição | ludobar, bar de jogos, board game café, game bar |
| **Concorrente** | Estabelecimento aprovado na curadoria do Bloco B1 | rival, player, casa (fora de citação) |
| **Avaliação** | Avaliação com texto publicada no Google Maps | comentário, review, resenha |
| **Taxa de ocupação** | Proporção das mesas ocupadas, em média, no horário de funcionamento; separada em dia útil e fim de semana ([8_financeiro.md](8_financeiro.md) §1) | lotação, movimento |
| **Fluxo** | Visitantes por semana | movimento, público, demanda (demanda é o total do mercado) |
| **Permanência** | Tempo entre a entrada e a saída de um grupo | duração da sessão, estadia |
| **Giro** | Número de grupos que uma mesa recebe por dia (horas de funcionamento ÷ permanência média) | rotatividade |
| **Ticket médio** | Gasto médio por pessoa por visita, em R$, com couvert e alimentos e bebidas. A árvore de direcionadores separa as duas partes: couvert lúdico e ticket médio de A&B | gasto médio, consumo médio, conta média |
| **Velocidade de avaliações** | Avaliações com texto por mês, no recorte até "3 meses atrás", inclusive | ritmo, frequência de avaliações |
| **Premissa crítica** | Uma das 3 a 5 premissas de maior impacto no VPL no tornado | premissa-chave, variável principal |
