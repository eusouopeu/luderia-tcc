# Cap. 3 — Metodologia

## Função no plano

Mais robusta que a de um plano de negócios comum. O método é defendido pela **confiabilidade do número que ele gera**, não pela teoria. Cada instrumento descrito aqui alimenta uma premissa (cap. 9) ou uma decisão (caps. 5 a 8). Instrumento que não alimenta nada sai.

Aproveitar de `arquivados/metodologia_tcc_luderia.md` a descrição de fontes, filtros e curadoria de estabelecimentos e jogos. Hipóteses H1–H9 do desenho anterior não são retomadas: as hipóteses atuais estão no registro prévio (§3.5). Resultados entram nos capítulos aplicados em linguagem de decisão; testes, estatísticas e valores-p vão para apêndice.

## Escopo adotado

Resumo das decisões de desenho tomadas pelo autor. Mudança de escopo exige atualizar esta seção, `textos/projeto_pesquisa_luderia.md` e `textos/cronograma_luderia.md`.

- **Sem questionários.** Dados secundários públicos e uma única coleta primária comportamental (contagem direta de ocupação).
- **Avaliações:** as **30 a 50 avaliações mais recentes com texto** de cada estabelecimento, com texto integral.
- **Perfis dos avaliadores:** histórico público de cada autor dessas avaliações, com o nome substituído por código aleatório.
- **Cardápios** de cada estabelecimento.
- **Contagem direta de ocupação** nas duas unidades da São Jogue (única luderia de Salvador), com três visitas por unidade em dias e horários sorteados.
- **Bases públicas:** IBGE (Censo 2022 por setor censitário, estimativas populacionais, POF 2017–2018, PNAD Contínua, PAS, CONCLA), RAIS e Novo CAGED, FipeZap comercial, Lei Complementar 123/2006 e anexos do Simples Nacional, Banco Central (SGS e Focus).
- **Garantias de robustez:** registro prévio das hipóteses com divisão da base em metade exploratória e metade confirmatória; validação do dicionário de codificação; efeito fixo ou ponderação por estabelecimento; nota centrada no avaliador; tamanho de efeito; correção para múltiplas comparações; análise de sensibilidade; registro de premissas com faixas. Simulação de Monte Carlo opcional.
- **Jogos (Bloco F):** menor relevância para as decisões do plano; pode ser retirado.

### Correspondência entre blocos e arquivos do pipeline

A ordem dos blocos segue a relevância para o plano. Cada bloco tem subpasta própria em `_src/`, `_data/raw/` e `_data/processed/`. Os prefixos dos arquivos já gerados seguem o desenho anterior e foram mantidos.

| Bloco | Conteúdo | Scripts | Pasta em `_data/processed/` | Prefixo |
|---|---|---|---|---|
| A | Estabelecimentos e cardápios | `_src/[A] Google Places (estabelecimentos)/` | `[A] Estabelecimentos e cardapios/` | `bloco_b_` (existentes); `cardapios_` (novo) |
| B | Avaliações recentes | `_src/[B] Google Places (comentarios)/` | `[B] Avaliacoes recentes/` | `bloco_c_` (existentes, a substituir pela nova coleta) |
| C | Histórico dos avaliadores | — | `[C] Historico dos avaliadores/` | `avaliadores_` (novo) |
| D | Contagem direta de ocupação | — | `[D] Contagem direta de ocupacao/` | `contagem_` (novo) |
| E | Bases públicas | `_src/[E] Bases publicas/` | `[E] Bases publicas/` | `bases_` |
| F | Jogos | `_src/[F] Ludopedia (jogos)/` | `[F] Jogos (ludopedia)/` | `bloco_a_` (existentes) |

## Divisão de subcapítulos

| Subcapítulo | Conteúdo |
|---|---|
| **3.1 Caracterização do trabalho** | Plano de negócios baseado em evidências; pesquisa aplicada, descritivo-exploratória, quantitativa com análise de conteúdo; delineamento transversal |
| **3.2 Hierarquia de evidências** | Escala N1–N6 ([8_financeiro.md](8_financeiro.md) §2) e hierarquia de tipos de dados ([../CLAUDE.md](../CLAUDE.md) §2); justificativa da exclusão de questionários |
| **3.3 Fontes e instrumentos de coleta** | Blocos A a F: o que mede, procedimento, recorte, período, limitação |
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
| Recorte | Luderias, ludobares e quiz-bares nas 27 capitais; 73 candidatos, sujeitos a curadoria manual (coluna `relevante`) |
| Variáveis | Avaliação média, volume de avaliações, política de preço, modelo de A&B, acervo declarado, entorno em 500 m e 1.000 m |
| **Cardápios** | Itens oferecidos, preço por item e variedade por categoria. Categorias fixas: **bebidas** (drinks, refrigerante, cerveja, não alcoólicas), **entradas** (batata, outras), **pratos principais** (hambúrguer, pizza, outros), **sobremesas**, **couvert ou taxa de jogo** |
| Registro | Data da coleta e link do cardápio; preços em R$ com duas casas decimais |
| Uso no plano | Concorrência (5.3), preço (6.3), modelo de A&B (6.2), ticket médio (cap. 9) |
| Limitação | Cardápios desatualizados ou indisponíveis; preço de cardápio não informa quanto cada pessoa consome |

### Bloco B — Avaliações recentes

| Item | Descrição |
|---|---|
| Fonte | Página pública de avaliações de cada estabelecimento no Google Maps |
| Recorte | **As 30 a 50 avaliações mais recentes que tenham texto**, por estabelecimento. Estabelecimentos com menos de 30 avaliações com texto entram com todas as disponíveis e ficam sinalizados |
| Tamanho esperado | Até 3.650 avaliações (73 × 50); o número real depende dos locais com poucas avaliações |
| Procedimento | Cópia integral e automatizada do texto, da nota, da data relativa e do identificador do autor; pseudonimização do autor na própria coleta |
| Variáveis derivadas | Aspectos mencionados e polaridade, reclamações, menções a comida, tamanho do grupo, valores em R$ citados, jogos citados, velocidade de avaliações (§3.4) |
| Uso no plano | Marketing (6.1 e 6.2), operacional (7.3), premissas de ocupação e ticket (cap. 9) |
| Limitação | Autosseleção de quem avalia; datas relativas; recorte recente não cobre sazonalidade de longo prazo |

O recorte das mais recentes descreve a operação atual de cada concorrente e **equilibra o peso dos estabelecimentos**: locais com milhares de avaliações não dominam a base.

### Bloco C — Histórico dos avaliadores

| Item | Descrição |
|---|---|
| Fonte | Perfil público de cada autor de avaliação do Bloco B no Google Maps |
| Variáveis | Total de avaliações e classificações; para cada avaliação do histórico: categoria do lugar, cidade, nota e data relativa |
| Procedimento | Nome e link do perfil substituídos por código aleatório na coleta; nome e link não são armazenados |
| Uso no plano | Nota centrada no avaliador (controle de exigência); perfil de consumo do público (5.2 e 6.5); jornada da ocasião (6.2); sobreposição de clientela entre concorrentes (5.3) |
| Limitação | Perfis com histórico privado ou curto; categorias atribuídas pelo Google |

### Bloco D — Contagem direta de ocupação

Única coleta primária do trabalho. Fornece a **âncora absoluta** de ocupação, tamanho de grupo e permanência, usada para calibrar a velocidade de avaliações (§3.6).

| Item | Descrição |
|---|---|
| Local | As duas unidades da São Jogue, única luderia de Salvador |
| Visitas | 3 por unidade, 6 no total, entre 25/09/2026 e 11/10/2026 |
| Sorteio | Lista de todos os turnos de funcionamento de cada unidade no período (dia × bloco de 2 horas dentro do horário de funcionamento). Sorteio estratificado por unidade: **1 turno em dia útil** (segunda a quinta), **1 turno em sexta ou sábado** e **1 turno livre** entre os restantes. Feriados excluídos. Turnos simultâneos nas duas unidades são ressorteados (um único observador). Sorteio feito por script com semente fixa, registrado antes da primeira visita |
| Duração da visita | 2 horas, com contagem a cada 30 minutos (5 contagens por visita) |
| Registro por contagem | Mesas disponíveis; mesas ocupadas; pessoas presentes; tamanho de cada grupo sentado |
| Registro contínuo | Horário de chegada e saída dos grupos que entram ou saem durante a visita (permanência observada) |
| Registro complementar | Política de cobrança aplicada, preços do cardápio na data, dia, horário e condições atípicas (evento, chuva, jogo de futebol) |
| Instrumento | Formulário padronizado preenchido no celular; sem fotos de pessoas; sem registro de características individuais |
| Saídas | Taxa de ocupação por turno; pessoas por mesa; permanência média (com observações censuradas); estimativa de visitantes por semana, em faixa |
| Uso no plano | Premissas de ocupação, pessoas por mesa e giro (cap. 9); calibração do fluxo dos demais concorrentes; capacidade (7.2) |
| Limitação | Seis visitas em um único estabelecimento e uma única cidade; permanência censurada pela duração da visita; resultado com faixa larga |

### Bloco E — Bases públicas

| Base | Variáveis | Uso no plano |
|---|---|---|
| IBGE — Censo 2022 (município e bairro) e estimativas populacionais | População e faixa etária por município e bairro; renda por município (o agregado por bairro e por setor não divulga renda) | Tamanho do público por capital e bairro; avaliações por 100 mil habitantes (5.2, 6.4, 6.6) |
| IBGE — POF 2017–2018 | Gasto familiar com alimentação fora de casa e recreação, por faixa de renda | Checagem do ticket médio (cap. 9); valores corrigidos pelo IPCA |
| IBGE — PNAD Contínua | Rendimento médio por capital | Atualização da renda da POF e do Censo |
| IBGE — Pesquisa Anual de Serviços (PAS) | Receita, custos e pessoal ocupado em serviços de alimentação | Checagens de coerência de margem e custo de pessoal (9.8) |
| IBGE — CONCLA | Códigos CNAE | Enquadramento da atividade (8.1) |
| Novo CAGED (MTE, portal PDET) | Salário de admissão por ocupação (CBO) e capital, 12 meses | Custo de pessoal (7.5 e cap. 9) |
| FipeZap — índice de locação comercial | Preço de locação por m² nas capitais cobertas (10 cidades, 8 capitais); locação residencial como referência nas demais | Aluguel (cap. 9) |
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
- Dados brutos (textos integrais e históricos) ficam em `_data/raw/`, fora do repositório público. O TCC e o repositório divulgam **apenas dados processados**.
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
| Velocidade de avaliações | Número de avaliações do recorte ÷ intervalo entre a mais antiga e a mais recente | Avaliações com texto por mês |

Regras do dicionário: tratar negações ("nada tranquilo") e ambiguidades ("familiar"). Cada versão do dicionário é registrada e datada.

### Variáveis derivadas do histórico (Bloco C)

| Variável | Construção |
|---|---|
| Nota centrada no avaliador | Nota dada à luderia − nota média do avaliador em todo o histórico |
| Proporção por categoria | Avaliações do avaliador em cada categoria ÷ total do histórico |
| Lift de categoria | Proporção da categoria entre avaliadores de luderias ÷ proporção na base de comparação da mesma cidade |
| Avaliação no mesmo dia | Outra avaliação com a mesma data relativa da avaliação da luderia; categoria desse lugar |
| Luderias avaliadas | Número de estabelecimentos do Bloco A no histórico do avaliador |

Datas relativas só permitem identificar "mesmo dia" em avaliações recentes (dias ou semanas). Nas demais, a variável fica ausente.

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
- **Prazo:** antes de qualquer análise das avaliações e dos históricos. A coleta pode ocorrer antes do registro; a análise, não.
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
| Aspectos mencionados × nota | Quais aspectos são obrigatórios e quais são diferenciais? | Análise de penalidade e recompensa; regressão da nota centrada com efeito fixo por estabelecimento |
| Menções a comida × nota × modelo de A&B | Qual o peso da comida na nota? Vale cozinha própria, parceria ou só bar? | Regressão da nota centrada sobre menção e polaridade de comida; comparação entre modelos de A&B com o estabelecimento como unidade (testes exatos) |
| Comparação de cardápios | Como os concorrentes diferem em preço, variedade e itens? | Estatística descritiva por categoria de item; comparação entre modelos de A&B e capitais; análise qualitativa dos itens |
| Avaliação no mesmo dia (antes ou depois) | A luderia é destino principal ou parte de uma sequência? | Frequência das categorias avaliadas no mesmo dia; comparação entre modelos de A&B |
| Categorias sobrerrepresentadas no histórico | Com quais negócios fazer parceria e perto de quais abrir? | Lift por categoria, com intervalo de confiança por bootstrap |
| Avaliadores com duas ou mais luderias (análise parcial) | Os concorrentes dividem clientela? | Proporção de avaliadores; sobreposição entre pares de estabelecimentos da mesma capital |

**Decisão de A&B:** nota e reclamações indicam o peso da comida na satisfação, mas não decidem sozinhas. A decisão final compara o custo de cada modelo no modelo financeiro (cap. 9).

### Operacional

| Variável | Pergunta | Técnica |
|---|---|---|
| Principais reclamações | Quais falhas operacionais evitar e em que proporção aparecem? | Frequência absoluta e percentual por aspecto negativo, com intervalo de confiança; ranking total e por estabelecimento |
| Permanência e tamanho dos grupos (Bloco D) | Quantas mesas de cada tamanho e qual capacidade? | Distribuição de pessoas por mesa; permanência média com observações censuradas |

### Financeiro — premissas críticas

| Premissa | Evidência | Técnica | Limitação declarada |
|---|---|---|---|
| **Ocupação** | Contagem direta na São Jogue (Bloco D) | Taxa de ocupação por turno; média e amplitude entre as seis visitas | Um estabelecimento, seis visitas |
| **Ocupação** | Velocidade de avaliações calibrada (Blocos B e D) | Modelo de calibração (abaixo) | Razão avaliações/visitantes pode variar entre estabelecimentos |
| **Pessoas por mesa** | Tamanho do grupo citado (Bloco B) e observado (Bloco D) | Distribuição e comparação entre as duas fontes | Relato espontâneo × poucas observações |
| **Giro de mesa** | Permanência observada (Bloco D) e política de cobrança (Bloco A) | Permanência média; comparação descritiva dos modelos de cobrança | Permanência censurada pela duração da visita |
| **Ticket médio** | Valores citados × cardápio × capital | Mediana e intervalo interquartil dos valores por pessoa; comparação com a cesta de cardápio | Poucos textos citam valores |
| **Ticket médio** | Itens fixos do cardápio (bebidas, entradas, principal, sobremesa, couvert) | **Cesta por pessoa** = couvert + bebida + entrada ou prato, por capital; calibrada pelos valores citados e pelos preços observados na São Jogue; checada contra a POF | Consumo por pessoa é premissa com faixa |

### Modelo de calibração da ocupação

1. **Visitantes por semana na São Jogue:** ocupação média observada × lugares × horas de funcionamento semanais ÷ permanência média. Resultado em faixa (mínimo, médio e máximo das visitas).
2. **Razão de calibração:** avaliações com texto por semana da São Jogue (velocidade do Bloco B) ÷ visitantes por semana estimados.
3. **Fluxo dos demais concorrentes:** velocidade de avaliações de cada estabelecimento ÷ razão de calibração. Resultado em faixa.
4. **Uso no plano:** faixa de visitantes por semana para estabelecimentos comparáveis ao proposto → premissa de ocupação no registro de premissas (N5 + N3).

Custos (aluguel, pessoal, tributos) e indicadores seguem [8_financeiro.md](8_financeiro.md): registro de premissas com faixas, triangulação, tornado, ponto de ruptura e, opcionalmente, Monte Carlo.

### Controles estatísticos (valem para todas as análises)

- **Unidade de análise explícita:** avaliação, avaliador ou estabelecimento. Decisões sobre modelos de negócio usam o estabelecimento como unidade.
- **Efeito fixo por estabelecimento** nas regressões com avaliações; alternativa: ponderação igual por estabelecimento.
- **Nota centrada no avaliador** sempre que a nota for variável dependente.
- **Tamanho de efeito** junto com o valor-p (diferença de médias, razão de chances, V de Cramér).
- **Correção de Benjamini-Hochberg** para o conjunto de testes confirmatórios.
- **Sensibilidade:** resultados com e sem os cinco estabelecimentos de maior volume, e com e sem os de menos de 30 avaliações com texto.
- Resultado não significativo também é reportado.

## 3.7 Matriz de evidências

**Quadro XX -** Matriz de evidências

| Decisão | Pergunta | Dado usado | Fonte | Confiança |
|---|---|---|---|---|
| Em quais capitais abrir? | Onde há demanda com pouca concorrência? | Densidade de concorrentes; fluxo calibrado; população e renda | Blocos A, B e D; Censo 2022; PNAD Contínua | N3 + N5 + N2 |
| Qual modelo de cobrança? | Qual modelo o mercado pratica e qual gera menos reclamação de preço? | Política de preço; reclamações de preço | Blocos A e B | N3 |
| Qual modelo de A&B? | Qual o peso da comida na satisfação e quanto custa cada modelo? | Menções a comida × nota centrada; cardápios; custos | Blocos A, B e C; RAIS/CAGED; FipeZap | N3 + N2 |
| Qual ticket médio projetar? | Quanto uma pessoa gasta por visita? | Valores citados; cesta de cardápio; preços observados; gasto familiar | Blocos A, B e D; POF | N3 + N5 + N2 |
| Qual ocupação projetar? | Quantos visitantes por semana um estabelecimento comparável recebe? | Contagem direta; velocidade de avaliações calibrada | Blocos B e D | N5 + N3 |
| Qual giro projetar? | Quanto tempo uma mesa fica ocupada? | Permanência observada; modelos de cobrança | Blocos A e D | N5 |
| Quantas mesas e de que tamanho? | Quantas pessoas ocupam cada mesa? | Tamanho do grupo citado e observado | Blocos B e D | N3 + N5 |
| Com quem fazer parceria e onde abrir? | Que outros negócios o público frequenta? | Lift de categorias; avaliações no mesmo dia | Bloco C | N3 |
| Qual acervo inicial? | Quais jogos o público cita? | Jogos citados; clusters | Blocos B e F | N3 |
| Qual regime tributário? | Qual a carga sobre a receita projetada? | Alíquotas | LC 123/2006; CONCLA | N1 |
| Qual taxa de desconto? | Qual o custo de oportunidade do capital? | Selic e IPCA projetados | Banco Central (Focus) | N2 |

Fonte: elaborado pelo próprio autor

Regras: uma linha por decisão do plano; toda premissa crítica do cap. 9 aparece na matriz; a coluna de confiança usa a escala N1–N6. Premissas críticas só em N6 recebem faixa larga e destaque no cap. 10.

## 3.8 Aspectos éticos e legais

Registrar no texto a base legal da coleta:

1. Avaliações e perfis usados são **informações de acesso público**.
2. O único dado potencialmente identificável (nome do usuário) é substituído por **código aleatório na coleta**; nome e link não são armazenados.
3. O conjunto das demais variáveis (categoria, cidade, nota, data relativa, texto processado) não permite identificar o usuário.
4. O TCC e o repositório divulgam **apenas dados processados**; textos integrais não são publicados. Trechos ilustrativos, se usados, são curtos e sem elemento identificador.
5. A contagem direta é **observação agregada em espaço comercial aberto ao público**: não há fotos de pessoas, registro de características individuais nem interação com clientes.

Citar a Lei nº 13.709/2018 (LGPD) e a Resolução CNS nº 510/2016. Registrar a consulta à orientadora sobre a dispensa de submissão ao Comitê de Ética.

## 3.9 Limitações

| Limitação | Efeito | Tratamento |
|---|---|---|
| Autosseleção de quem avalia | Superrepresenta experiências extremas e usuários ativos | Declarada; nota centrada no avaliador reduz o viés de exigência |
| Recorte das 30 a 50 mais recentes | Não cobre sazonalidade de longo prazo | Declarada; sazonalidade tratada como premissa com faixa |
| Datas relativas | Impossibilita dia da semana e dia do mês das avaliações | Curva semanal vem da contagem direta |
| Contagem em um único estabelecimento e cidade, com seis visitas | Razão de calibração pode não valer para outros locais; sem sazonalidade | Faixa larga; sensibilidade da ocupação no tornado; validação recomendada antes do investimento |
| Permanência censurada pela duração da visita | Subestima a permanência de grupos longos | Declarada; observações censuradas sinalizadas |
| Erro de classificação do dicionário | Viés nas variáveis de texto | Validação com kappa e F1; variáveis reprovadas saem da análise confirmatória |
| Valores citados em poucos textos | Amostra pequena para o ticket | Triangulação com cardápio, preços observados e POF |
| Cardápios desatualizados | Preços defasados | Data da coleta registrada; correção pelo IPCA quando a data do cardápio for conhecida |
| Cobertura do FipeZap | Nem todas as capitais têm índice | Declarar capitais sem cobertura |
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
