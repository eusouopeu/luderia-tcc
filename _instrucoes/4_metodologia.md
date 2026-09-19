# Cap. 3 — Metodologia

## Função no plano

Mais robusta que a de um plano de negócios comum. O método é defendido pela **confiabilidade do número que ele gera**, não pela teoria. Cada instrumento descrito aqui alimenta uma premissa (cap. 9) ou uma decisão (caps. 5 a 8). Instrumento que não alimenta nada sai.

Aproveitar de `arquivados/metodologia_tcc_luderia.md` a descrição de fontes, filtros e curadoria de estabelecimentos e jogos. Hipóteses H1–H9 do desenho anterior não são retomadas: as hipóteses atuais estão no registro prévio (§3.5). Resultados entram nos capítulos aplicados em linguagem de decisão; testes, estatísticas e valores-p vão para apêndice.

## Escopo adotado

Resumo das decisões de desenho tomadas pelo autor. Mudança de escopo exige atualizar esta seção, `textos/projeto_pesquisa_luderia.md` e `textos/cronograma_luderia.md`.

- **Praça do plano:** Salvador (BA). A decisão de localização é o bairro e o ponto, não a cidade.
- **Sem questionários.** Dados secundários públicos e uma única coleta primária comportamental (contagem direta de ocupação, com leitura do número da NFC-e).
- **Estabelecimentos (Bloco A):** concorrentes com **mais de 100 avaliações** no Google Maps nas **14 capitais classificadas como metrópole pela REGIC** (IBGE); população final esperada de 100 a 150 estabelecimentos após a curadoria.
- **Avaliações (Bloco B):** **todas as avaliações com texto publicadas até "um mês atrás"** (rótulo relativo do Google Maps na data da coleta), por estabelecimento, com texto integral. O número de avaliações varia entre estabelecimentos.
- **Histórico dos avaliadores (Bloco C):** retirado do escopo em 18/09/2026. Saem a nota centrada no avaliador, o lift de categorias, a avaliação no mesmo dia e a sobreposição de clientela.
- **Modelo de alimentos e bebidas:** não é avaliado. Cozinha própria, parceria ou só bar deixa de ser variável do Bloco A e passa a premissa do autor no cap. 9.
- **Cardápios** de cada estabelecimento.
- **Contagem direta de ocupação** nas duas unidades da São Jogue (única luderia de Salvador), feita do lado de fora: 2 visitas sorteadas na quinzena seguinte ao pagamento dos servidores estaduais da Bahia e 2 visitas de retorno 15 dias depois, na mesma unidade. O número da NFC-e lido nas duas visitas dá as notas emitidas no intervalo.
- **Bases públicas:** IBGE (Censo 2022 por setor censitário, estimativas populacionais, POF 2017–2018, PNAD Contínua, PAS, CONCLA), RAIS e Novo CAGED, FipeZap comercial, Lei Complementar 123/2006 e anexos do Simples Nacional, Banco Central (SGS e Focus).
- **Garantias de robustez:** registro prévio das hipóteses com divisão da base em metade exploratória e metade confirmatória; validação do dicionário de codificação; efeito fixo ou ponderação por estabelecimento; tamanho de efeito; correção para múltiplas comparações; análise de sensibilidade; registro de premissas com faixas. Simulação de Monte Carlo opcional.
- **Jogos (Bloco F):** menor relevância para as decisões do plano; pode ser retirado.

### Correspondência entre blocos e arquivos do pipeline

A ordem dos blocos segue a relevância para o plano. Cada bloco tem subpasta própria em `_src/`, `_data/raw/` e `_data/processed/`. Os prefixos dos arquivos já gerados seguem o desenho anterior e foram mantidos.

| Bloco | Conteúdo | Scripts | Pasta em `_data/processed/` | Prefixo |
|---|---|---|---|---|
| A | Estabelecimentos e cardápios | `_src/[A] Google Places (estabelecimentos)/` | `[A] Estabelecimentos e cardapios/` | `bloco_b_` (existentes); `cardapios_` (novo) |
| B | Avaliações recentes | `_src/[B] Google Places (comentarios)/` | `[B] Avaliacoes recentes/` | `bloco_c_` (existentes, a substituir pela nova coleta) |
| C | Histórico dos avaliadores — **retirado em 18/09/2026** | — | — | — |
| D | Contagem direta de ocupação | — | `[D] Contagem direta de ocupacao/` | `contagem_` (novo) |
| E | Bases públicas | `_src/[E] Bases publicas/` | `[E] Bases publicas/` | `bases_` |
| F | Jogos | `_src/[F] Ludopedia (jogos)/` | `[F] Jogos (ludopedia)/` | `bloco_a_` (existentes) |

## Divisão de subcapítulos

| Subcapítulo | Conteúdo |
|---|---|
| **3.1 Caracterização do trabalho** | Plano de negócios baseado em evidências; pesquisa aplicada, descritivo-exploratória, quantitativa com análise de conteúdo; delineamento transversal |
| **3.2 Hierarquia de evidências** | Escala N1–N6 ([8_financeiro.md](8_financeiro.md) §2) e hierarquia de tipos de dados ([../CLAUDE.md](../CLAUDE.md) §2); justificativa da exclusão de questionários |
| **3.3 Fontes e instrumentos de coleta** | Blocos A, B, D, E e F: o que mede, procedimento, recorte, período, limitação |
| **3.4 Tratamento dos dados** | Pipeline; pseudonimização; construção das variáveis; dicionário de codificação e sua validação |
| **3.5 Registro prévio e divisão da base** | Hipóteses, análises e critérios registrados antes da análise; metade exploratória e metade confirmatória |
| **3.6 Técnicas de análise e controles** | Técnicas por área do plano; calibração da ocupação; controles estatísticos |
| **3.7 Matriz de evidências** | Quadro decisão → pergunta → dado usado → fonte → confiança |
| **3.8 Aspectos éticos e legais** | Base legal da coleta, pseudonimização, observação sem identificação, divulgação apenas de dados processados |
| **3.9 Limitações** | Limitações de cada bloco e reflexo nas faixas das premissas |

## 3.3 Fontes e instrumentos de coleta

### Bloco A — Estabelecimentos e cardápios

| Item | Descrição |
|---|---|
| Fonte | Google Places API; site, Instagram e cardápio digital de cada estabelecimento; OpenStreetMap |
| Recorte | Luderias, ludobares e quiz-bares com **mais de 100 avaliações** nas **14 capitais classificadas como metrópole** pela REGIC 2018 (IBGE) e em suas regiões metropolitanas; 164 candidatos antes da curadoria manual (`bloco_b_planilha_curadoria_metropoles_filtrada_mais_100_avaliacoes.csv`); população final esperada de 100 a 150. Cada estabelecimento é atribuído à metrópole pelo endereço |
| Variáveis | Avaliação média, volume de avaliações, política de preço, acervo declarado, entorno em 500 m e 1.000 m. O modelo de A&B não é registrado |
| **Cardápios** | Itens oferecidos, preço por item, variedade por categoria e número de itens que exigem preparo (sem contar itens prontos, como balas, refrigerantes e água). Categorias fixas: **bebidas** (drinks, refrigerante, cerveja, não alcoólicas), **entradas** (batata, outras), **pratos principais** (hambúrguer, pizza, outros), **sobremesas**, **couvert ou taxa de jogo** |
| Registro | Data da coleta e link do cardápio; preços em R$ com duas casas decimais |
| Uso no plano | Concorrência (5.3), preço (6.3), cardápio (6.2), ticket médio (cap. 9) |
| Limitação | O corte de 100 avaliações exclui casas novas ou pequenas: o recorte descreve concorrentes estabelecidos. Cardápios desatualizados ou indisponíveis; preço de cardápio não informa quanto cada pessoa consome |

### Bloco B — Avaliações recentes

| Item | Descrição |
|---|---|
| Fonte | Página pública de avaliações de cada estabelecimento no Google Maps |
| Recorte | **Todas as avaliações com texto cujo rótulo de data seja de até "um mês atrás"**, inclusive, na data da coleta. O número de avaliações varia com o movimento de cada estabelecimento |
| Tamanho esperado | Depende do ritmo de avaliações; estimado depois da coleta de um teste em amostra |
| Procedimento | Cópia integral e automatizada do texto, da nota, da data relativa e do identificador do autor; pseudonimização do autor na própria coleta. Data e hora da coleta registradas por estabelecimento; coleta de todos os estabelecimentos no menor intervalo possível, para que as janelas de um mês coincidam |
| Variáveis derivadas | Aspectos mencionados e polaridade, reclamações, menções a comida, tamanho do grupo, valores em R$ citados, jogos citados, velocidade de avaliações (§3.4) |
| Uso no plano | Marketing (6.1 e 6.2), operacional (7.3), premissas de ocupação e ticket (cap. 9) |
| Limitação | Autosseleção de quem avalia; o rótulo "um mês atrás" é arredondado pelo Google e não tem limite exato; janela de um mês não cobre sazonalidade |

O recorte por período descreve a operação atual de cada concorrente e torna o número de avaliações uma medida direta do ritmo de avaliações. Como estabelecimentos movimentados contribuem com mais avaliações, as análises agregadas ponderam por estabelecimento ou usam efeito fixo.

### Bloco C — Retirado

O histórico dos avaliadores foi retirado do escopo em 18/09/2026. A letra não é reaproveitada, para manter a correspondência com os arquivos já gerados.

### Bloco D — Contagem direta de ocupação

Única coleta primária do trabalho. Fornece a **âncora absoluta** de fluxo, tamanho de grupo e permanência, usada para calibrar a velocidade de avaliações (§3.6). A leitura do número da NFC-e acrescenta um registro transacional (tipo 2 na hierarquia de dados) ao que é observado na porta.

| Item | Descrição |
|---|---|
| Local | As duas unidades da São Jogue, única luderia de Salvador |
| Visitas | 4 no total, 2 por unidade: 1 **sorteada** e 1 de **retorno**, 15 dias depois, na mesma unidade |
| Períodos | Visitas sorteadas na **quinzena pós-pagamento** (29/09 a 13/10/2026), a partir do primeiro dia de pagamento dos servidores estaduais da Bahia (inativos e pensionistas em 29/09; ativos em 30/09). Os retornos caem na **quinzena pré-pagamento** (14/10 a 28/10/2026), até a véspera do pagamento de outubro (29/10). Fonte: Governo da Bahia, Tabela de Pagamentos 2026 |
| Sorteio | Das visitas sorteadas, **1 em dia útil** (segunda a quinta) e **1 no fim de semana** (sexta a domingo); um número sorteado define qual unidade fica com o dia útil. Feriados (12/10) e dias sem funcionamento excluídos. O retorno é fixo (sorteada + 15 dias); se a unidade estiver fechada, passa ao dia seguinte de funcionamento. Como 15 dias não fecham semanas inteiras, o retorno cai no dia da semana seguinte ao da visita sorteada. Semente fixa (20260916), `_src/[D] Contagem direta de ocupacao/build_contagem_sorteio.py`, planilha `contagem_sorteio_visitas.xlsx`; resultado registrado antes da primeira visita |
| Posição do observador | Do lado de fora do estabelecimento, com vista para a entrada |
| Duração da visita | Sem duração fixa. Horário de início e de fim registrados; todas as taxas são calculadas por hora observada |
| Registro contínuo | Entrada e saída de cada grupo: horário e número de pessoas. Grupos identificados por código para ligar entrada e saída (permanência) |
| Registro a cada 30 minutos | Saldo de pessoas no interior (entradas − saídas, a partir da contagem inicial) e mesas ocupadas, quando visíveis de fora |
| NFC-e | Número da nota fiscal de uma compra no início e no fim de cada visita, com data, hora e série. A diferença entre visita sorteada e retorno dá as notas emitidas em 15 dias; a diferença dentro da mesma visita dá as notas emitidas durante a observação |
| Registro complementar | Mesas disponíveis (contagem única por unidade), política de cobrança aplicada, preços do cardápio na data, dia, horário e condições atípicas (evento, chuva, jogo de futebol) |
| Instrumento | Formulário padronizado preenchido no celular; sem fotos de pessoas; sem registro de características individuais |
| Saídas | Pessoas por hora; tamanho dos grupos; permanência média (com observações censuradas); pessoas por nota fiscal (entradas ÷ notas emitidas durante a visita); notas por dia no intervalo de 15 dias; estimativa de visitantes por semana, em faixa |
| Uso no plano | Premissas de ocupação, pessoas por mesa e giro (cap. 9); calibração do fluxo dos demais concorrentes; capacidade (7.2) |
| Limitação | Quatro visitas em um único estabelecimento e uma única cidade; observação de fora não vê o salão inteiro; numeração da NFC-e pode incluir delivery e vendas de balcão, e uma nota pode cobrir um grupo inteiro; permanência censurada pelo início e fim da visita |

### Bloco E — Bases públicas

| Base | Variáveis | Uso no plano |
|---|---|---|
| IBGE — Censo 2022 (município e bairro) e estimativas populacionais | População e faixa etária por município e bairro; renda por município (o agregado por bairro e por setor não divulga renda) | Tamanho do público em Salvador e por bairro (5.2, 6.4, 6.6); avaliações por 100 mil habitantes nas metrópoles (5.3) |
| IBGE — POF 2017–2018 | Gasto familiar com alimentação fora de casa e recreação, por faixa de renda | Checagem do ticket médio (cap. 9); valores corrigidos pelo IPCA |
| IBGE — PNAD Contínua | Rendimento médio por capital | Atualização da renda da POF e do Censo |
| IBGE — Pesquisa Anual de Serviços (PAS) | Receita, custos e pessoal ocupado em serviços de alimentação | Checagens de coerência de margem e custo de pessoal (9.8) |
| IBGE — CONCLA | Códigos CNAE | Enquadramento da atividade (8.1) |
| Novo CAGED (MTE, portal PDET) | Salário médio de admissão por ocupação (CBO) e capital (Salvador no modelo; demais capitais para comparação): últimos 12 meses e série mensal e anual de 2021 a 2026, nominal, real e em múltiplos do salário mínimo | Custo de pessoal (7.5 e cap. 9); projeção de reajustes salariais |
| FipeZap — índice de locação comercial | Preço de locação por m² em Salvador (coberta pelo índice comercial) e nas demais capitais cobertas | Aluguel (cap. 9) |
| Lei Complementar 123/2006 e anexos do Simples Nacional | Alíquotas por faixa de receita | Tributos (8.1 e cap. 9) |
| Banco Central — SGS e relatório Focus | Selic e IPCA observados e projetados; salário mínimo | Taxa mínima de atratividade e inflação do modelo (cap. 9) |

Scripts em `_src/[E] Bases publicas/` (`collect_bases_*` → `build_bases_*`); saídas `bases_*` em `_data/processed/[E] Bases publicas/`; referências ABNT em `bibliografia/referencias_bases_publicas.md`. A RAIS vínculos foi substituída pelo Novo CAGED: o salário de admissão mede o que um negócio novo paga ao contratar, e os microdados da RAIS 2024 somam 3,8 GB compactados.

### Bloco F — Jogos

Bloco de menor relevância para as decisões do plano. Pode ser retirado sem afetar os demais: nesse caso, as variáveis "jogos citados" (Bloco B) e a curadoria por clusters saem do escopo, e o acervo passa a ser definido pelos jogos citados nas avaliações e pelo acervo declarado dos concorrentes.

| Item | Descrição |
|---|---|
| Fonte | API da Ludopedia e raspagem das páginas públicas de jogos; BoardGameGeek (complexidade) |
| Recorte | Jogos com edição nacional, publicados a partir de 2010, com ao menos 100 registros de posse; 563 jogos |
| Variáveis | Contadores de usuário (`qt_tem`, `qt_teve`, `qt_quer`, `qt_favorito`, `qt_jogou`), duração, idade mínima, número de jogadores, mecânicas, nota média |
| Uso no plano | Curadoria do acervo (6.2 e 7.4); dicionário de jogos citados nas avaliações |
| Limitação | Base de jogadores engajados; não inclui jogos de cartas tradicionais |

## 3.4 Tratamento dos dados

### Pipeline

- Scripts em `_src/[bloco]/` seguindo o padrão `collect_*` → `build_*` → `analise_*`; saídas em `_data/processed/` com o prefixo do bloco.
- Dados brutos (textos integrais) ficam em `_data/raw/`, fora do repositório público. O TCC e o repositório divulgam **apenas dados processados**.
- Dicionário de dados com nome, descrição, tipo, unidade e origem de cada variável.
- Todo sorteio (visitas, divisão da base, amostra de validação) usa semente fixa registrada no código.

### Variáveis derivadas dos textos (Bloco B)

| Variável | Construção | Codificação |
|---|---|---|
| Aspectos mencionados | Dicionário de termos por aspecto: ambiente, barulho, atendimento, explicação dos jogos, acervo, estado das peças, comida, bebida, preço, limpeza, conforto | Binária por aspecto; polaridade (positiva, negativa, neutra) |
| Reclamações | Aspectos com polaridade negativa | Frequência absoluta e percentual por aspecto |
| Menção a comida | Aspecto comida | Binária e polaridade |
| Tamanho do grupo | Expressões como "fomos em 6", "casal", "eu e dois amigos" | Número de pessoas |
| Valores citados | Expressões com R$ e contexto ("por pessoa", "a conta", "o couvert") | R$; tipo de valor (por pessoa, conta total, item) |
| Jogos citados | Nomes dos jogos do Bloco F | Binária por jogo; cluster do Bloco F |
| Velocidade de avaliações | Número de avaliações com texto do recorte (até "um mês atrás") ÷ duração da janela, em dias, a partir da data da coleta | Avaliações com texto por mês |

Regras do dicionário: tratar negações ("nada tranquilo") e ambiguidades ("familiar"). Cada versão do dicionário é registrada e datada.

### Validação do dicionário

O dicionário só é aplicado à metade confirmatória depois de validado na metade exploratória.

| Etapa | Procedimento |
|---|---|
| 1. Manual de codificação | Definição operacional de cada variável de texto, com exemplos positivos, negativos e casos de fronteira. Vai para apêndice |
| 2. Amostra | 200 avaliações da metade exploratória, sorteadas com estratificação por estabelecimento |
| 3. Codificação humana 1 | O autor codifica as 200 avaliações pelo manual, sem ver a saída do dicionário |
| 4. Codificação humana 2 | Uma segunda pessoa codifica as mesmas avaliações pelo manual. Alternativa: o autor recodifica após no mínimo 14 dias, sem consultar a primeira codificação |
| 5. Concordância humana | Kappa de Cohen por variável entre as codificações 1 e 2; divergências resolvidas por consenso, gerando a codificação de referência |
| 6. Desempenho do dicionário | Precisão, revocação e F1 do dicionário contra a codificação de referência, por variável |
| 7. Critério de aceitação | Kappa ≥ 0,70 e F1 ≥ 0,70 por variável |
| 8. Revisão | Variável abaixo do critério: revisão do dicionário e novo teste em outras 100 avaliações da metade exploratória. Se continuar abaixo, sai da análise confirmatória e é reportada como exploratória |

Valores numéricos extraídos (tamanho do grupo, valores em R$) são avaliados por taxa de acerto exato na mesma amostra.

## 3.5 Registro prévio e divisão da base

### Registro prévio

- **Documento:** `textos/registro_previo_luderia.md`, versionado no repositório. A data e o identificador do commit comprovam que o registro antecede a análise.
- **Prazo:** antes de qualquer análise das avaliações. A coleta pode ocorrer antes do registro; a análise, não.
- **Conteúdo:**
  - hipóteses confirmatórias, com direção quando houver (ver `textos/projeto_pesquisa_luderia.md` §1.5);
  - análises exploratórias previstas, sem hipótese;
  - variáveis, unidade de análise e técnica de cada teste;
  - nível de significância (0,05 após correção de Benjamini-Hochberg) e medida de tamanho de efeito;
  - critérios de exclusão (avaliações sem texto útil, estabelecimentos fora da curadoria) e tratamento de dados ausentes;
  - procedimento de divisão da base e de validação do dicionário.
- **Emendas:** mudanças decorrentes da metade exploratória são registradas como emenda datada **antes** de abrir a metade confirmatória.
- **No texto do TCC:** resultados confirmatórios e exploratórios são apresentados separadamente; desvios do registro são declarados.

### Divisão da base

- Após o fim da coleta do Bloco B, os **avaliadores** são sorteados em duas metades, com estratificação pelo estabelecimento avaliado e semente fixa. O sorteio é por avaliador para que quem avaliou duas luderias não apareça nas duas metades.
- **Metade exploratória:** construção e validação do dicionário; análises exploratórias; ajuste das especificações.
- **Metade confirmatória:** fica fechada até a emenda final do registro; as análises registradas rodam uma única vez.
- Estatísticas descritivas usadas no plano (reclamações, cardápios, ticket, velocidade de avaliações) usam a base completa depois da análise confirmatória.

## 3.6 Técnicas de análise por área do plano

### Marketing

| Variável ou cruzamento | Pergunta | Técnica |
|---|---|---|
| Aspectos mencionados × nota | Quais aspectos são obrigatórios e quais são diferenciais? | Análise de penalidade e recompensa; regressão da nota com efeito fixo por estabelecimento |
| Menções a comida × nota | Qual o peso da comida na nota? | Regressão da nota sobre menção e polaridade de comida, com efeito fixo por estabelecimento |
| Comparação de cardápios | Como os concorrentes diferem em preço, variedade e itens? | Estatística descritiva por categoria de item e por metrópole, com Salvador em destaque; análise qualitativa dos itens |

### Operacional

| Variável | Pergunta | Técnica |
|---|---|---|
| Principais reclamações | Quais falhas operacionais evitar e em que proporção aparecem? | Frequência absoluta e percentual por aspecto negativo, com intervalo de confiança; ranking total e por estabelecimento |
| Permanência e tamanho dos grupos (Bloco D) | Quantas mesas de cada tamanho e qual capacidade? | Distribuição do tamanho dos grupos na entrada; permanência média com observações censuradas |

### Financeiro — premissas críticas

| Premissa | Evidência | Técnica | Limitação declarada |
|---|---|---|---|
| **Ocupação** | Contagem direta na São Jogue (Bloco D) | Pessoas por hora e saldo no interior por hora do dia; média e amplitude entre as quatro visitas; comparação descritiva entre quinzenas e tipos de dia | Um estabelecimento, quatro visitas |
| **Fluxo** | NFC-e emitidas em 15 dias (Bloco D) | Notas por dia no intervalo × pessoas por nota observadas nas visitas → visitantes por semana, por unidade | Numeração pode incluir delivery e balcão |
| **Ocupação** | Velocidade de avaliações calibrada (Blocos B e D) | Modelo de calibração (abaixo) | Razão avaliações/visitantes pode variar entre estabelecimentos |
| **Pessoas por mesa** | Tamanho do grupo citado (Bloco B) e observado (Bloco D) | Distribuição e comparação entre as duas fontes | Relato espontâneo × poucas observações |
| **Giro de mesa** | Permanência observada (Bloco D) e política de cobrança (Bloco A) | Permanência média; comparação descritiva dos modelos de cobrança | Permanência censurada pelo início e fim da visita |
| **Ticket médio** | Valores citados × cardápio × metrópole | Mediana e intervalo interquartil dos valores por pessoa; comparação com a cesta de cardápio | Poucos textos citam valores |
| **Ticket médio** | Itens fixos do cardápio (bebidas, entradas, principal, sobremesa, couvert) | **Cesta por pessoa** = couvert + bebida + entrada ou prato, por metrópole, com Salvador em destaque; calibrada pelos valores citados e pelos preços observados na São Jogue; checada contra a POF | Consumo por pessoa é premissa com faixa |

### Modelo de calibração da ocupação

1. **Visitantes por semana na São Jogue, por dois caminhos:**
   - **(a) Notas fiscais:** notas emitidas entre a visita sorteada e a de retorno ÷ dias do intervalo × 7 × pessoas por nota (entradas contadas ÷ notas emitidas durante as visitas);
   - **(b) Contagem:** pessoas por hora observadas × horas de funcionamento semanais, ponderadas por tipo de dia.
   Os dois caminhos são comparados; a divergência entra na faixa (mínimo, provável e máximo).
2. **Razão de calibração:** avaliações com texto por semana da São Jogue (velocidade do Bloco B) ÷ visitantes por semana estimados.
3. **Fluxo dos demais concorrentes:** velocidade de avaliações de cada estabelecimento ÷ razão de calibração. Resultado em faixa.
4. **Uso no plano:** faixa de visitantes por semana para estabelecimentos comparáveis ao proposto → premissa de ocupação no registro de premissas (N5 + N3).

Custos (aluguel, pessoal, tributos) e indicadores seguem [8_financeiro.md](8_financeiro.md): registro de premissas com faixas, triangulação, tornado, ponto de ruptura e, opcionalmente, Monte Carlo.

### Controles estatísticos (valem para todas as análises)

- **Unidade de análise explícita:** avaliação, avaliador ou estabelecimento. Decisões sobre modelos de negócio usam o estabelecimento como unidade.
- **Efeito fixo por estabelecimento** nas regressões com avaliações; alternativa: ponderação igual por estabelecimento.
- **Tamanho de efeito** junto com o valor-p (diferença de médias, razão de chances, V de Cramér).
- **Correção de Benjamini-Hochberg** para o conjunto de testes confirmatórios.
- **Sensibilidade:** resultados com e sem os cinco estabelecimentos de maior volume, e com e sem os de menos de 10 avaliações com texto no recorte.
- Resultado não significativo também é reportado.

## 3.7 Matriz de evidências

**Quadro XX -** Matriz de evidências

| Decisão | Pergunta | Dado usado | Fonte | Confiança |
|---|---|---|---|---|
| Em que bairro de Salvador abrir? | Onde está o público-alvo, longe da concorrência direta e com aluguel compatível? | População e faixa etária por bairro; renda; localização da São Jogue; aluguel; entorno | Censo 2022; PNAD Contínua; Bloco A; FipeZap; OpenStreetMap | N2 + N3 |
| Qual modelo de cobrança? | Qual modelo o mercado pratica e qual gera menos reclamação de preço? | Política de preço; reclamações de preço | Blocos A e B | N3 |
| Que cardápio oferecer? | Qual o peso da comida na satisfação e que itens e preços o mercado pratica? | Menções a comida × nota; cardápios | Blocos A e B | N3 |
| Qual ticket médio projetar? | Quanto uma pessoa gasta por visita? | Valores citados; cesta de cardápio; preços observados; gasto familiar | Blocos A, B e D; POF | N3 + N5 + N2 |
| Qual ocupação projetar? | Quantos visitantes por semana um estabelecimento comparável recebe? | Notas fiscais emitidas em 15 dias; contagem direta; velocidade de avaliações calibrada | Blocos B e D | N5 + N3 |
| Qual giro projetar? | Quanto tempo uma mesa fica ocupada? | Permanência observada; modelos de cobrança | Blocos A e D | N5 |
| Quantas mesas e de que tamanho? | Quantas pessoas ocupam cada mesa? | Tamanho do grupo citado e observado | Blocos B e D | N3 + N5 |
| Qual acervo inicial? | Quais jogos o público cita? | Jogos citados; clusters | Blocos B e F | N3 |
| Qual regime tributário? | Qual a carga sobre a receita projetada? | Alíquotas | LC 123/2006; CONCLA | N1 |
| Qual taxa de desconto? | Qual o custo de oportunidade do capital? | Selic e IPCA projetados | Banco Central (Focus) | N2 |

Fonte: elaborado pelo próprio autor

Regras: uma linha por decisão do plano; toda premissa crítica do cap. 9 aparece na matriz; a coluna de confiança usa a escala N1–N6. Premissas críticas só em N6 recebem faixa larga e destaque no cap. 10.

## 3.8 Aspectos éticos e legais

Registrar no texto a base legal da coleta:

1. As avaliações usadas são **informações de acesso público**.
2. O único dado potencialmente identificável (nome do usuário) é substituído por **código aleatório na coleta**; nome e link não são armazenados.
3. O conjunto das demais variáveis (nota, data relativa, texto processado) não permite identificar o usuário.
4. O TCC e o repositório divulgam **apenas dados processados**; textos integrais não são publicados. Trechos ilustrativos, se usados, são curtos e sem elemento identificador.
5. A contagem direta é **observação agregada, feita do lado de fora de espaço comercial aberto ao público**: não há fotos de pessoas, registro de características individuais nem interação com clientes. O número da NFC-e vem de nota emitida para compra do próprio autor.

Citar a Lei nº 13.709/2018 (LGPD) e a Resolução CNS nº 510/2016. Registrar a consulta à orientadora sobre a dispensa de submissão ao Comitê de Ética.

## 3.9 Limitações

| Limitação | Efeito | Tratamento |
|---|---|---|
| Autosseleção de quem avalia | Superrepresenta experiências extremas e usuários ativos | Declarada; efeito fixo por estabelecimento; sem controle do grau de exigência de cada avaliador |
| Recorte de um mês de avaliações | Não cobre sazonalidade; rótulo "um mês atrás" sem limite exato | Declarada; data da coleta registrada; sazonalidade tratada como premissa com faixa |
| Corte de 100 avaliações no Bloco A | Exclui casas novas ou pequenas | Declarada; total da busca apresentado ao lado do total acima do corte |
| Datas relativas | Impossibilita dia da semana e dia do mês das avaliações | Curva semanal vem da contagem direta |
| Contagem em um único estabelecimento e cidade, com quatro visitas | Razão de calibração pode não valer para outros locais; sem sazonalidade | Faixa larga; sensibilidade da ocupação no tornado; validação recomendada antes do investimento |
| Observação do lado de fora | Não vê o salão inteiro; saldo de pessoas acumula erros de contagem | Contagem inicial e final conferidas; comparação com o caminho das notas fiscais |
| Numeração da NFC-e | Pode incluir delivery e balcão; uma nota cobre um grupo | Pessoas por nota medidas nas próprias visitas; série e unidade registradas |
| Permanência censurada pelo início e fim da visita | Subestima a permanência de grupos longos | Declarada; observações censuradas sinalizadas |
| Erro de classificação do dicionário | Viés nas variáveis de texto | Validação com kappa e F1; variáveis reprovadas saem da análise confirmatória |
| Valores citados em poucos textos | Amostra pequena para o ticket | Triangulação com cardápio, preços observados e POF |
| Cardápios desatualizados | Preços defasados | Data da coleta registrada; correção pelo IPCA quando a data do cardápio for conhecida |
| FipeZap por cidade, não por bairro | Aluguel médio de Salvador não distingue bairros | Faixa larga; cotação de pontos (N1) recomendada antes do investimento |
| POF defasada (2017–2018) | Valores monetários antigos | Correção pelo IPCA; atualização da renda pela PNAD Contínua |

## Extensões fora do escopo atual

Entram no cap. 11 como validações recomendadas antes do investimento, ou são adotadas se houver prazo.

| Instrumento | O que resolve | Custo |
|---|---|---|
| Durações citadas nos textos ("ficamos 3 horas") | Segunda fonte para a permanência, além da contagem | Baixo: nova entrada no dicionário |
| Contagem em um segundo estabelecimento de outra capital | Testa se a razão de calibração vale fora de Salvador | Médio |
| Recoleta do volume total de avaliações após 30 dias | Fluxo com todas as avaliações, não só as com texto | Baixo |
| Teste da porta falsa com anúncio segmentado | Demanda de quem ainda não é cliente | Médio |

## Referências de apoio ao método

- BARDIN, Laurence. *Análise de conteúdo*. Edições 70, 2011. — codificação dos textos. `[A VERIFICAR]`
- COHEN, Jacob. A coefficient of agreement for nominal scales. *Educational and Psychological Measurement*, 1960. — kappa. `[A VERIFICAR]`
- BENJAMINI, Yoav; HOCHBERG, Yosef. Controlling the false discovery rate. *Journal of the Royal Statistical Society: Series B*, 1995. — múltiplas comparações. `[A VERIFICAR]`
- MALHOTRA, Naresh K. *Pesquisa de marketing*. 2019. `[A VERIFICAR]`
