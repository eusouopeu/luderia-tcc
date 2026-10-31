# Cap. 3 — Metodologia

## Função no plano

Mais robusta que a de um plano de negócios comum. O método é defendido pela **confiabilidade do número que ele gera**, não pela teoria. Cada instrumento descrito aqui alimenta uma premissa (cap. 9) ou uma decisão (caps. 5 a 8). Instrumento que não alimenta nada sai.

Aproveitar de `arquivados/metodologia_tcc_luderia.md` a descrição de fontes, filtros e curadoria de estabelecimentos e jogos. Hipóteses H1–H9 do desenho anterior não são retomadas: as hipóteses atuais estão no registro prévio (§3.5). Resultados entram nos capítulos aplicados em linguagem de decisão; testes, estatísticas e valores-p vão para apêndice.

## Escopo adotado

Resumo das decisões de desenho tomadas pelo autor. Mudança de escopo exige atualizar esta seção, `textos/planejamento/projeto_pesquisa_luderia.md` e `textos/planejamento/cronograma_luderia.md`.

- **Praça do plano:** Salvador (BA). A decisão de localização é o bairro e o ponto, não a cidade.
- **Sem questionários.** Dados secundários públicos e uma única coleta primária comportamental (contagem direta de ocupação, com leitura do número da NFC-e).
- **Estabelecimentos (Bloco B1):** concorrentes com **mais de 100 avaliações** no Google Maps nas **14 capitais classificadas como metrópole pela REGIC** (IBGE); **54 estabelecimentos** após a curadoria (164 candidatos; Machado Games e Ilusões Industriais excluídas por não serem luderias; Bardo Mago, La Tabuleria, TabuClub, Toca do Rato e Tubaleria incluídas em 14/10/2026).
- **Avaliações (Bloco B2):** **todas as avaliações com texto publicadas até "3 meses atrás"** (rótulo relativo do Google Maps na data da coleta), por estabelecimento, com texto integral. O número de avaliações varia entre estabelecimentos. Não há divisão da base: a etapa exploratória e a descritiva usam a população inteira de avaliações coletadas.
- **Modelo de alimentos e bebidas:** não é avaliado. Cozinha própria, parceria ou só bar deixa de ser variável do Bloco B1 e passa a premissa do autor no cap. 9.
- **Cardápios** de cada estabelecimento.
- **Contagem direta de ocupação** nas duas unidades da São Jogue (única luderia de Salvador), feita dentro do salão, com o app de observação: 4 visitas de cerca de 3 horas, 2 por unidade, só em sexta e sábado à noite, para medir o movimento máximo (orientação de 31/10/2026). Bela Vista em 10/10 (sábado) e 16/10 (sexta); Paralela em 17/10 (sábado) e 30/10 (sexta). O número da NFC-e lido nas duas visitas da mesma unidade dá as notas emitidas no intervalo, piso das vendas.
- **Bases públicas:** IBGE (Censo 2022 por setor censitário, estimativas populacionais, POF 2017–2018, PNAD Contínua, PAS, CONCLA), RAIS e Novo CAGED, FipeZap comercial, Lei Complementar 123/2006 e anexos do Simples Nacional, Banco Central (SGS e Focus).
- **Garantias de robustez (núcleo):** validação da coleta e da codificação; ponderação por estabelecimento; registro de premissas com faixas e nível de evidência; três cenários; tornado; ponto de ruptura.
- **Extras, só se sobrar tempo no fim:** testes de hipótese H1–H9 com registro prévio e correção para múltiplas comparações, na base inteira (§3.5); simulação de Monte Carlo ([8_financeiro.md](8_financeiro.md) §4.4). Se feitos, vão para apêndice. A banca de um plano de negócios avalia se a premissa se sustenta; os três cenários, o tornado e o ponto de ruptura já respondem sob quais condições o negócio é viável.

### Correspondência entre blocos e arquivos do pipeline

Cada bloco tem pasta `[Bn] Nome`, com o mesmo nome, em `_src/` e em `dados/`; em `_src/`, o bloco se divide em uma pasta por objeto (ex.: `Google Places (Negócios)`, `Instagram`, `CAGED`); dentro de `dados/[Bn] Nome/` ficam os arquivos processados e a subpasta `_dados-brutos/`. Arquivos gerados e scripts levam o código do bloco: `Bn_<conteúdo>` nas saídas, `Bn-<letra>_<conteúdo>.py` nos scripts, guardados na subpasta da etapa (`collect/` → `c`, `build/` → `b`, `analise/` → `a`); cada objeto tem ainda `webscripts/`, `logs/` e `outros/` (convenções em [`_src/dicionario.md`](../_src/dicionario.md)). As tabelas do Bloco B4 seguem o padrão `[B4] {dado} {período} ({fonte}).csv`. Módulos auxiliares sem saída própria (`places_client.py`, `osm_client.py`, `recorte_rm.py`, `jogos_comum.py`, `instagram_comum.py`, `bases_comum.py`) não levam código e ficam em `outros/` do bloco. Saídas e scripts do desenho anterior e o Bloco B6, retirado, ficam em `arquivados/`.

| Bloco | Conteúdo | Scripts | Pasta de dados |
|---|---|---|---|
| B1 | Estabelecimentos e cardápios | `_src/[B1] Estabelecimentos e cardapios/` (`Google Places (Negócios)/`, `Cardápios/`, `Acervo de Jogos/`, `Instagram/`) | `[B1] Estabelecimentos e cardapios/` |
| B2 | Avaliações recentes | `_src/[B2] Avaliacoes recentes/Google Places (Comentários)/` | `[B2] Avaliacoes recentes/` |
| B3 | Contagem direta de ocupação | `_src/[B3] Contagem direta de ocupacao/Contagem direta/` | `[B3] Contagem direta de ocupacao/` |
| B4 | Bases públicas | `_src/[B4] Bases publicas/` (uma pasta por fonte; `Comum/bases_comum.py`) | `[B4] Bases publicas/` |

## Divisão de subcapítulos

| Subcapítulo | Conteúdo |
|---|---|
| **3.1 Caracterização do trabalho** | Plano de negócios baseado em evidências; pesquisa aplicada, descritivo-exploratória, quantitativa com análise de conteúdo; delineamento transversal |
| **3.2 Hierarquia de evidências** | Escala N1–N6 ([8_financeiro.md](8_financeiro.md) §2) e hierarquia de tipos de dados ([1_estrutura.md](1_estrutura.md), "Princípios do plano", P2); justificativa da exclusão de questionários |
| **3.3 Fontes e instrumentos de coleta** | Blocos B1, B2, B3 e B4: o que mede, procedimento, recorte, período, limitação |
| **3.4 Tratamento dos dados** | Pipeline; pseudonimização; validação da coleta (auditoria dos censos da fonte, reconciliação das bases públicas, consistência da contagem); construção das variáveis; dicionário de codificação e sua validação |
| **3.5 Registro prévio e testes de hipótese** | **Extra, só se sobrar tempo.** Hipóteses H1–H9 e registro prévio, na base inteira. Se não for feito, a seção sai e as seguintes sobem um número |
| **3.6 Técnicas de análise e controles** | Técnicas por área do plano; calibração da ocupação; controles estatísticos |
| **3.7 Matriz de evidências** | Quadro decisão → pergunta → dado usado → fonte → confiança |
| **3.8 Aspectos éticos e legais** | Base legal da coleta, pseudonimização, observação sem identificação, divulgação apenas de dados processados |
| **3.9 Limitações** | Limitações de cada bloco e reflexo nas faixas das premissas |

## 3.3 Fontes e instrumentos de coleta

### Bloco B1 — Estabelecimentos e cardápios

| Item | Descrição |
|---|---|
| Fonte | Google Places API; Google Maps (entorno); site, Instagram, cardápio digital e lista de acervo de cada estabelecimento |
| Recorte | Luderias, ludobares e quiz-bares com **mais de 100 avaliações** nas **14 capitais classificadas como metrópole** pela REGIC 2018 (IBGE) e em suas regiões metropolitanas; 164 candidatos antes da curadoria manual (`estabelecimentos/2_recorte/B1_curadoria_metro_f_av100.csv`); **54 estabelecimentos** no objeto. Cada estabelecimento é atribuído à metrópole pelo endereço |
| Variáveis | Avaliação média, volume de avaliações, política de preço, acervo declarado, horário de funcionamento (Places API, `regularOpeningHours`), entorno em 500 m e 1.000 m. O modelo de A&B não é registrado |
| **Entorno** | Só pelo Google Maps (o OpenStreetMap saiu do coletor e da análise em 30/10/2026): estações de metrô, trem, VLT e BRT e shoppings de porte em 500 m e 1.000 m, e distância da estação e do shopping mais próximos, até 1.000 m, em linha reta de pino a pino. Shopping de porte = 1.000 avaliações ou mais no Maps; contagens com 500 e 5.000 avaliações para sensibilidade (`maps_entorno.user.js`) |
| **Cardápios** | Itens oferecidos, preço por item, variedade por categoria e número de itens que exigem preparo (sem contar itens prontos, como balas, refrigerantes e água). Categorias fixas: **bebidas** (drinks, refrigerante, cerveja, não alcoólicas), **entradas** (batata, outras), **pratos principais** (hambúrguer, pizza, outros), **sobremesas**, **couvert ou taxa de jogo** |
| Registro | Data da coleta e link do cardápio; preços em R$ com duas casas decimais. Cardápios de prints, digitais e Takeat convertidos por regras de categoria; jogos à venda ficam fora. Item com preço por quantidade (chopp 1x, 2x, 3x) entra só com o preço de 1 unidade. Item com mais de uma linha (tamanho, combo ou print de outra data) fica todo na planilha, mas só a linha de referência (`linha_referencia` = S) entra na cesta e nas medianas: cardápio mais recente, sem combo, menor tamanho |
| **Acervos** | Lista de jogos de qualquer das 54 casas que publique uma (Acervo de Jogos, rejoy, Ludopedia, site, Canva ou PDF), com ou sem cardápio. **Cesta de jogos** = jogos presentes em 15 ou mais dos 30 acervos; preço em faixa entre lojas (menor, mediana, p75, máximo); índice por loja só com 10 ou mais jogos comparáveis; custo do acervo inicial estendido pelo preço médio por título (`B1-a_cesta_jogos.py`) |
| Uso no plano | Concorrência (5.3), preço (6.3), cardápio (6.2), ponto (6.4), acervo inicial e investimento (7.2, 9.3), ticket médio (cap. 9) |
| Limitação | O corte de 100 avaliações exclui casas novas ou pequenas: o recorte descreve concorrentes estabelecidos. Cardápios desatualizados ou indisponíveis; preço de cardápio não informa quanto cada pessoa consome |

### Bloco B2 — Avaliações recentes

| Item | Descrição |
|---|---|
| Fonte | Página pública de avaliações de cada estabelecimento no Google Maps |
| Recorte | **Todas as avaliações com texto cujo rótulo de data seja de até "3 meses atrás"**, inclusive, na data da coleta. O rótulo "3 meses atrás" cobre de 90 a 119 dias; a janela vai, então, de 90 a 120 dias antes da coleta. O número de avaliações varia com o movimento de cada estabelecimento |
| Tamanho esperado | Depende do ritmo de avaliações; estimado depois da coleta de um teste em amostra |
| Procedimento | Cópia integral e automatizada do texto, da nota, da data relativa e do identificador do autor; pseudonimização do autor na própria coleta. Data e hora da coleta registradas por estabelecimento; coleta de todos os estabelecimentos no menor intervalo possível, para que as janelas de três meses coincidam |
| Variáveis derivadas | Aspectos mencionados e polaridade, reclamações, menções a comida, tamanho do grupo, valores em R$ citados, jogos citados (base do acervo inicial), velocidade de avaliações (§3.4) |
| Uso no plano | Marketing (6.1 e 6.2), operacional (7.3), premissas de ocupação e ticket (cap. 9) |
| Limitação | Autosseleção de quem avalia; o rótulo "3 meses atrás" é arredondado pelo Google e não tem limite exato; a janela de três meses cobre só parte do ano e não mede sazonalidade |

O recorte por período descreve a operação atual de cada concorrente e torna o número de avaliações uma medida direta do ritmo de avaliações. Como estabelecimentos movimentados contribuem com mais avaliações, as análises agregadas ponderam por estabelecimento ou usam efeito fixo.

### Bloco B3 — Contagem direta de ocupação

Única coleta primária do trabalho. Fornece a **âncora absoluta** de fluxo, tamanho de grupo, permanência e ocupação do salão, usada para calibrar a velocidade de avaliações (§3.6). A leitura do número da NFC-e acrescenta um registro transacional (tipo 2 na hierarquia de dados) ao que é observado no salão.

| Item | Descrição |
|---|---|
| Local | As duas unidades da São Jogue, única luderia de Salvador: Bela Vista (`SJBV`, unidade `BV`) e Paralela (`SJPA`, unidade `PA`) |
| Visitas | 4 no total, 2 por unidade, só em **sexta e sábado à noite**, para medir o movimento máximo (orientação de 31/10/2026): Bela Vista em 10/10 (sábado) e 16/10 (sexta); Paralela em 17/10 (sábado) e 30/10 (sexta). Início entre 18h30 e 19h30. O desenho anterior (sábado 03/10 e domingo 18/10, retorno a 15 dias, horários sorteados por `B3-b_contagem_sorteio.py`, semente 20260916) fica só como registro |
| Posição do observador | **Dentro do salão**, sentado a uma mesa como cliente. A mesa do próprio observador não entra nos registros: nem o grupo, nem as pessoas, nem o comportamento (3 pessoas na visita de 10/10 ao Bela Vista; 2 nas demais), e sai do denominador da ocupação |
| Duração da visita | Prevista de 3 horas; observada de 2,5 a 3,3 horas. Horário de início e de fim registrados; todas as taxas são calculadas por hora observada |
| Registro contínuo | Entrada e saída de cada grupo na porta (horário, pessoas, crianças), com código para ligar entrada e saída; e cada grupo de mesa: mesa, entrada, saída, permanência, pessoas, crianças, jogos e chamadas do instrutor. Grupo que já estava no salão na chegada é estoque inicial, e grupo ainda no salão no fim tem permanência censurada |
| Contagens periódicas | Mesas ocupadas e vazias a cada 30 minutos, a partir da contagem inicial |
| NFC-e | Série, número e emissão de uma nota no início e no fim de cada visita, lidos pelo QR ou transcritos da foto. A diferença entre as duas visitas da mesma unidade dá as notas emitidas no intervalo; a diferença dentro da visita, as notas emitidas durante a observação. A nota só é emitida a pedido do cliente: as notas emitidas são **piso** das vendas |
| Registro complementar | Estrutura da unidade (mesas, assentos, estantes, capacidade do acervo, instrutores, atendentes; `outros/B3_estrutura_unidades.csv`, com mesas informadas pelo autor e os 48 assentos do site de reservas), política de cobrança aplicada, preços da NFC-e e do cardápio na data, condições atípicas (evento, chuva, jogo de futebol), nível de som e medidas do ambiente |
| **Extra: pedidos** | Pedidos por mesa (categoria, quantidade, chegada e espera). Não foram coletados em todas as visitas: entram só como extra, descritivo, e não sustentam premissa. Hora do pedido da visita de 30/10 desconsiderada |
| Instrumento | **App de observação** (Android, `_src/app-observacao/`), no celular, com gravação automática, backup diário e exportação em CSV; sem fotos de pessoas; sem registro de características individuais |
| Saídas | Pessoas por hora; tamanho dos grupos; permanência média e mediana (com observações censuradas); ocupação das mesas e dos assentos, média e pico, minuto a minuto; pessoas por nota fiscal (entradas ÷ notas emitidas durante a visita); notas por dia no intervalo entre visitas; estimativa de visitantes por semana, em faixa |
| Uso no plano | Premissas de ocupação, pessoas por mesa e giro (cap. 9); calibração do fluxo dos demais concorrentes; capacidade (7.2) |
| Limitação | Quatro visitas em um único estabelecimento e uma única cidade, só em sexta e sábado à noite: a contagem não observa dias úteis nem horários de menor movimento, que entram pelo caminho das notas fiscais; NFC-e só a pedido do cliente (piso das vendas), podendo incluir delivery e balcão, e uma nota pode cobrir um grupo inteiro; um único intervalo entre visitas por unidade (Bela Vista, 10/10 a 16/10, 6 dias; Paralela, 17/10 a 30/10, 13 dias, abaixo dos 15 dias planejados); permanência censurada pelo início e fim da visita; a mesa do observador, fora do denominador, reduz o salão observado em uma mesa |

#### Dados do app de observação

O app exporta um CSV por conteúdo, `contagem_<conteúdo>.csv` (separador `;`, UTF-8 com BOM), guardado intacto em `dados/[B3] Contagem direta de ocupacao/_dados-brutos/app/originais/AAAA-MM-DD_<SJBV|SJPA>/`. O `B3-b_importar_app.py` consolida as visitas em `_dados-brutos/app/contagem_<conteúdo>.csv`, sempre com a unidade e a visita tiradas da pasta, nunca as digitadas no app. Correções de lançamento e descartes ficam em `outros/B3_correcoes_app.csv` e `outros/B3_descartes_app.csv`, com motivo, sem editar os originais; a NFC-e lida da foto entra com `fonte_registro` = `transcricao`. Toda linha leva `visita_id` (`AAAA-MM-DD_<SJBV|SJPA>`), `unidade` (`BV` ou `PA`), `visita_inicio` e `versao_app`.

| Arquivo | Uma linha por | Conteúdo principal |
|---|---|---|
| `contagem_visitas.csv` | Visita | Início, fim, pausas, cobrança e valor, condições, NFC-e de início e de fim (série, número, emissão), CNPJ |
| `contagem_grupos_mesa.csv` | Grupo de mesa | Mesa, entrada, saída, `permanencia_min`, `censurada`, pessoas, crianças, aniversário, `instrutor_vezes`, jogos |
| `contagem_fluxo.csv` | Entrada ou saída na porta | Código do grupo (`BV-n`), tipo, hora, pessoas, crianças |
| `contagem_rodadas.csv` | Contagem periódica | Etapa, hora, mesas no total, ocupadas e vazias |
| `contagem_unidades.csv` | Unidade na visita | Mesas, estantes, capacidade em caixas, instrutores, atendentes |
| `contagem_precos.csv` | Item de preço | Origem (NFC-e ou cardápio), item, quantidade, valor |
| `contagem_pedidos.csv` | Pedido (extra) | Mesa, categoria, hora do pedido, chegada, `espera_min`, pendente |
| `contagem_acustica.csv`, `contagem_medidas.csv`, `contagem_fotos.csv` | Medição | Nível de som estimado (dB), medidas por objeto de referência, fotos do ambiente sem pessoas |

O `B3-a_contagem.py` gera as saídas em `dados/[B3] Contagem direta de ocupacao/`: `contagem_resumo_visitas.csv` (uma linha por visita: pessoas por hora, grupos, permanência, ocupação das mesas e dos assentos, notas e pessoas por nota) e `contagem_notas_intervalo.csv` (notas emitidas e notas por dia entre as visitas da mesma unidade). A ocupação é calculada minuto a minuto pelos grupos de mesa, com a mesa do observador fora do denominador: mesas com grupo ÷ (mesas da unidade − mesa do observador; 11 − 1 no Bela Vista, 10 − 1 na Paralela) e pessoas sentadas ÷ (48 assentos − pessoas da mesa do observador; 3 em 10/10, 2 nas demais). Mesa e pessoas do observador por visita em `outros/B3_mesa_observador.csv`; denominadores nas colunas `mesas_denominador` e `assentos_denominador`. As visitas também são lançadas no Notion "3 - Visitas presenciais", uma linha por visita, com os valores do resumo.

### Bloco B4 — Bases públicas

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

Scripts em `_src/[B4] Bases publicas/` (`B4-c_*` → `B4-b_*`); saídas `[B4] *.csv` em `dados/[B4] Bases publicas/`; referências ABNT em `bibliografia/referencias_bases_publicas.md`.

## 3.4 Tratamento dos dados

### Pipeline

- Scripts em `_src/[bloco]/<objeto>/collect/`, `build/` e `analise/`, seguindo o padrão `Bn-c_*` → `Bn-b_*` → `Bn-a_*` ([dicionário](../_src/dicionario.md)); saídas em `dados/[bloco]/` com o prefixo do bloco.
- Dados brutos (textos integrais) ficam em `dados/[bloco]/_dados-brutos/`, fora do repositório público. O TCC e o repositório divulgam **apenas dados processados**.
- Dicionário de dados com nome, descrição, tipo, unidade e origem de cada variável.
- Todo sorteio (amostra de validação do dicionário, amostra de auditoria da coleta) usa semente fixa registrada no código.

### Variáveis derivadas dos textos (Bloco B2)

| Variável | Construção | Codificação |
|---|---|---|
| Aspectos mencionados | Dicionário de termos por aspecto: ambiente, barulho, atendimento, explicação dos jogos, acervo, estado das peças, comida, bebida, preço, limpeza, conforto | Binária por aspecto; polaridade (positiva, negativa, neutra) |
| Reclamações | Aspectos com polaridade negativa | Frequência absoluta e percentual por aspecto |
| Menção a comida | Aspecto comida | Binária e polaridade |
| Tamanho do grupo | Expressões como "fomos em 6", "casal", "eu e dois amigos" | Número de pessoas |
| Valores citados | Expressões com R$ e contexto ("por pessoa", "a conta", "o couvert") | R$; tipo de valor (por pessoa, conta total, item) |
| Jogos citados | Nomes de jogos identificados no texto; lista aberta, construída durante a codificação | Binária por jogo; frequência por jogo e por estabelecimento |
| Velocidade de avaliações | Número de avaliações com texto do recorte (até "3 meses atrás") ÷ duração da janela, em dias, a partir da data da coleta | Avaliações com texto por mês |

Regras do dicionário: tratar negações ("nada tranquilo") e ambiguidades ("familiar"). Cada versão do dicionário é registrada e datada.

### Validação da coleta

A validação da coleta estima o erro que sobra depois que o dado é obtido. A referência é o modelo de erro total da pesquisa (*total survey error*), que separa o erro amostral do erro não amostral: cobertura, medida e processamento (Groves et al., 2009; Biemer, 2010). A adaptação desse modelo a dados de plataformas digitais está em Amaya, Biemer e Kinyon (2020).

O procedimento muda conforme a natureza de cada bloco. Os Blocos B1 e B2 são censos da fonte. O Bloco B4 é extração integral de tabelas oficiais. O Bloco B3 é uma amostra de períodos observada pelo próprio autor.

**Quadro XX -** Validação da coleta por bloco

| Bloco | Natureza do dado | Erro amostral | Erro a validar | Instrumento de validação |
|---|---|---|---|---|
| B1 e B2 | Censo da fonte (Google Maps), extraído por script | Não há | Cobertura da fonte; fidelidade do script à página | Amostra de auditoria; checagem de cobertura; padrão das falhas |
| B4 | Extração integral de tabelas oficiais por API | Não há na extração; há no desenho de algumas bases (POF, PNAD Contínua) | Processamento: código, filtro, unidade, deflação, junção | Reconciliação com a tabela publicada; conferência de totais |
| B3 | Sexta e sábado à noite, escolhidos e observados pelo autor dentro do salão | Há: quatro visitas no pico representam a operação da unidade | Omissão de registro; erro de contagem | Fechamento do saldo; comparação entre caminhos independentes; dado faltante declarado |

Fonte: elaborado pelo próprio autor

#### Blocos B1 e B2 - censo da fonte

O script coleta todos os estabelecimentos e todas as avaliações do recorte. Por isso, não há erro amostral. A amostra deixa de servir para inferir a população e passa a estimar a taxa de erro do instrumento de coleta. O fato de o script ter sido escrito com apoio de inteligência artificial não muda essa lógica: o que se valida é o dado gerado, não a autoria do código. O código fica no repositório e pode ser auditado.

A validação tem três etapas:

| Etapa | Procedimento |
|---|---|
| 1. Fidelidade | No Bloco B1, amostra aleatória estratificada por capital e faixa de volume de avaliações: 20% dos estabelecimentos curados, com nota média, número de avaliações e endereço conferidos na página. No Bloco B2, amostra estratificada por estabelecimento em duas etapas (abaixo): texto, nota e rótulo de data conferidos na página. As 200 avaliações da primeira etapa são as mesmas da validação do dicionário. A conferência é feita até sete dias após a coleta, e a data de cada conferência é registrada. As demais coletas do B1 seguem o mesmo desenho: entorno, 20% estratificado (distância conferida em linha reta, de pino a pino, como no coletor); posts do Instagram, itens de cardápio e jogos dos acervos, 200 unidades com mínimo de 3 por estrato, como no B2; perfis do Instagram, exaustivo. No B4, uma linha sorteada por série. Todas as amostras saem de script (`*-a_auditoria_*.py`, `_src/extras/amostrar_auditoria.py`), com semente fixa (20261015) e chave SHA-256 por unidade, em `_dados-brutos/<pasta>/auditoria/`, e são conferidas no Notion, um banco "B - Auditoria …" por amostra |
| 2. Completude | Em todos os estabelecimentos do Bloco B2, o número de avaliações com texto no recorte, contado na página, é comparado ao número coletado. Diferença indica avaliação perdida por paginação, tempo de espera ou limite de pedidos. Avaliação só conta como lida com o "Mais" expandido; a coluna `texto_expandido` marca as que ficaram cortadas (inclusive texto terminado no marcador " …" do Google), e o estabelecimento é recoletado |
| 3. Cobertura | A lista do Bloco B1 é comparada a fontes independentes: buscas manuais por termo nas capitais e perfis de luderias no Instagram. No Instagram, snowball pelas listas "seguindo" das casas aprovadas (sementes): conta seguida por k ou mais sementes vira candidata, classificada à mão; o corte k sai da precisão e da sensibilidade medidas, e a cobertura da lista do B1 é estimada por captura e recaptura (Chapman), lida como limite inferior (a segunda lista nasce da primeira). Só agregados e perfis de negócio são publicados; as listas brutas, com @ de pessoas físicas, ficam fora do git (`B1-b_instagram_seguindo.py`, `B1-a_instagram_snowball.py`). Estabelecimento encontrado fora da lista é registrado com o motivo da ausência |

O resultado é a taxa de erro por variável, com intervalo de confiança de 95% (método de Wilson). O critério de aceitação é limite superior do intervalo igual ou inferior a 5%. Variável acima do critério tem o script corrigido e o estrato afetado coletado de novo. Se a recoleta não for possível, a variável é reportada com a taxa de erro medida e entra no cálculo da faixa da premissa que ela alimenta.

##### Amostra de auditoria do Bloco B2

O desenho combina um total calculado pelo critério de aceitação (Wilson) com a regra de inspeção em duas etapas usada no controle de qualidade por atributos (ABNT NBR 5426 `[AV]`). Cada estabelecimento é um estrato, e todos entram na amostra. O motivo é o padrão das falhas: elas tendem a se concentrar em certas páginas, e um estabelecimento fora da amostra esconderia a falha. Explicação em linguagem simples em `docs/estatidez.md`.

| Passo | Procedimento |
|---|---|
| 1. Tamanho total | n = 200 avaliações. Pelo intervalo de Wilson, 200 conferências aprovam a variável com até 3 erros (limite superior de 4,3%); o mínimo para aprovar com zero erros seria 73. O tamanho quase não depende do total de avaliações coletadas: a correção para população finita muda o resultado em poucas unidades |
| 2. Mínimo por estabelecimento | 3 avaliações por estabelecimento, ou todas, se o estabelecimento tiver menos de 3 no recorte |
| 3. Alocação do restante | As avaliações que sobram depois dos mínimos são divididas na proporção do número de avaliações de cada estabelecimento no recorte, descontado o mínimo. O arredondamento segue o método dos maiores restos, para que a soma feche com 200 (diferença zero) |
| 4. Sorteio | Chave aleatória gerada com semente fixa e gravada como valor; dentro de cada estabelecimento, entram as avaliações de menor chave. Planilha com a semente, o hash SHA-256 da base de origem e as fórmulas da alocação e da seleção, registrada no repositório antes da primeira conferência |
| 5. Taxa de erro | Por variável, só com a primeira etapa: taxa sem ponderação, com o intervalo de Wilson, e taxa ponderada pelo peso de cada estabelecimento na base. O critério de 5% vale para as duas; se divergirem, prevalece a pior |
| 6. Segunda etapa | Estabelecimento com pelo menos um erro numa variável tem essa variável conferida em mais avaliações: todas as do recorte, se forem até 30; senão, as 20 seguintes na ordem da chave. A segunda etapa não entra na taxa geral, porque concentra a amostra onde já houve erro. Serve para diagnosticar falha concentrada: taxa acima de 5% no estabelecimento leva à correção do script e à recoleta do estabelecimento |

O erro da coleta não é tratado como restrito a uma variável. Falhas de paginação, de carregamento e de limite de pedidos afetam a inclusão do registro inteiro. Essas falhas tendem a se concentrar em grupos específicos, como estabelecimentos com muitas avaliações ou páginas com layout diferente. Erro concentrado em um grupo gera viés, e o tamanho da base não o dilui (Meng, 2018). Por isso, os registros com falha ou campo vazio são comparados aos completos por capital e faixa de volume. Diferença entre os dois grupos é reportada como limitação.

A validação cobre a relação entre o script e a página. A relação entre a página e a realidade é outra camada: estabelecimentos fora do Google Maps, avaliações falsas e autosseleção de quem avalia. Essa camada não é medida pela auditoria e fica declarada em §3.9.

#### Bloco B4 - bases públicas

A extração por API copia tabelas inteiras. Não há sorteio nem página a ser lida, e o volume de séries é pequeno. A validação, então, é exaustiva: cada série usada no plano é reconciliada com a tabela publicada no portal da instituição, em ao menos um período e um recorte geográfico. Os totais são conferidos com a soma das linhas, conforme a regra de tabela agregada do projeto. As funções de conferência ficam nos próprios scripts `B4-b_*`.

Os erros mais prováveis são de processamento: código de variável ou de município trocado, filtro aplicado à série errada, unidade (mil, milhão, percentual) e índice de correção monetária. O erro da própria base não é validado pelo trabalho, e sim declarado em §3.9: amostra da POF e da PNAD Contínua, cobertura só do emprego formal no Novo CAGED e preço anunciado, não contratado, no FipeZap.

#### Bloco B3 - contagem direta

A contagem não é censo. As quatro visitas são uma amostra de períodos, só em sexta e sábado à noite, para observar o movimento máximo. A escolha é deliberada: a contagem mede a ocupação no pico, não a média do dia. O erro amostral existe e é tratado pela faixa larga da premissa de ocupação e pela análise de sensibilidade (§3.6).

O instrumento é o próprio observador, e não há gravação para auditar depois. A validação usa a consistência interna do registro e a comparação entre caminhos independentes:

| Checagem | Procedimento |
|---|---|
| Fechamento do saldo | Contagem inicial + entradas - saídas, comparada à contagem feita a cada 30 minutos. A diferença acumulada mede a omissão de registros na porta |
| Grupos sem saída | Grupos com entrada e sem saída registrada são contados à parte. Os que ainda estão no salão ao fim da visita são censurados; os demais são omissões |
| Caminhos independentes | Pessoas pela porta, pessoas pelos grupos de mesa e notas fiscais emitidas (piso, porque a nota só sai a pedido): as três estimativas de fluxo são comparadas por visita |

Dado não anotado é tratado como faltante. Não há imputação. A taxa de omissão de cada visita é reportada junto com as saídas. Quando a omissão for relevante, a estimativa de fluxo usa o caminho com menos falhas e a faixa da premissa aumenta. O script `B3-a_contagem.py` já conta à parte os grupos sem saída e os pedidos sem chegada (extra), sem imputação. O fechamento do saldo e a separação entre censura e omissão ainda precisam ser acrescentados a ele.

### Validação do dicionário

O dicionário é validado numa amostra antes de ser aplicado à base inteira. A amostra sai da própria base inteira, já que não há divisão em metades.

| Etapa | Procedimento |
|---|---|
| 1. Manual de codificação | Definição operacional de cada variável de texto, com exemplos positivos, negativos e casos de fronteira. Vai para apêndice |
| 2. Amostra | 200 avaliações da base inteira, sorteadas com estratificação por estabelecimento |
| 3. Codificação humana 1 | O autor codifica as 200 avaliações pelo manual, sem ver a saída do dicionário |
| 4. Codificação humana 2 | Uma segunda pessoa codifica as mesmas avaliações pelo manual. Alternativa: o autor recodifica após no mínimo 14 dias, sem consultar a primeira codificação |
| 5. Concordância humana | Kappa de Cohen por variável entre as codificações 1 e 2; divergências resolvidas por consenso, gerando a codificação de referência |
| 6. Desempenho do dicionário | Precisão, revocação e F1 do dicionário contra a codificação de referência, por variável |
| 7. Critério de aceitação | Kappa ≥ 0,70 e F1 ≥ 0,70 por variável |
| 8. Revisão | Variável abaixo do critério: revisão do dicionário e novo teste em outras 100 avaliações da base, fora das já sorteadas. Se continuar abaixo, a variável é reportada como exploratória, com o desempenho medido, e não sustenta premissa sozinha |

Valores numéricos extraídos (tamanho do grupo, valores em R$) são avaliados por taxa de acerto exato na mesma amostra.

## 3.5 Registro prévio — extra

> **Extra, só se sobrar tempo no fim.** O corpo do plano usa estatística descritiva com intervalo de confiança, três cenários, tornado e ponto de ruptura. Os testes de hipótese H1–H9 (`textos/planejamento/registro_previo_luderia.md`), a correção de Benjamini-Hochberg e as regressões com efeito fixo só entram se houver tempo depois de o plano estar completo, e então vão para apêndice. O procedimento abaixo fica registrado para esse caso.

### Registro prévio

- **Documento:** `textos/planejamento/registro_previo_luderia.md`, versionado no repositório. A data e o identificador do commit comprovam que o registro antecede a análise.
- **Prazo:** antes de qualquer análise das avaliações. A coleta pode ocorrer antes do registro; a análise, não.
- **Conteúdo:**
  - hipóteses, com direção quando houver (ver `textos/planejamento/projeto_pesquisa_luderia.md` §1.5);
  - análises exploratórias previstas, sem hipótese;
  - variáveis, unidade de análise e técnica de cada teste;
  - nível de significância (0,05 após correção de Benjamini-Hochberg) e medida de tamanho de efeito;
  - critérios de exclusão (avaliações sem texto útil, estabelecimentos fora da curadoria) e tratamento de dados ausentes;
  - procedimento de validação do dicionário.
- **Emendas:** mudanças feitas depois do registro são registradas como emenda datada **antes** da rodada dos testes.
- **No texto do TCC:** resultados dos testes registrados e análises exploratórias são apresentados separadamente; desvios do registro são declarados.

### Base única

- Não há divisão da base em metades. A etapa exploratória (construção e validação do dicionário, ajuste das especificações) e a descritiva (reclamações, cardápios, ticket, velocidade de avaliações) usam a população inteira de avaliações coletadas.
- Consequência: se o extra for feito, os testes rodam na mesma base em que o dicionário foi construído. Isso é declarado como limitação dos testes, que vão para apêndice.

## 3.6 Técnicas de análise por área do plano

### Marketing

| Variável ou cruzamento | Pergunta | Técnica |
|---|---|---|
| Aspectos mencionados × nota | Quais aspectos são obrigatórios e quais são diferenciais? | Análise de penalidade e recompensa (descritiva, ponderada por estabelecimento). Extra: regressão da nota com efeito fixo por estabelecimento (H1) |
| Menções a comida × nota | Qual o peso da comida na nota? | Nota média com e sem menção negativa a comida, ponderada por estabelecimento. Extra: regressão com efeito fixo por estabelecimento |
| Comparação de cardápios | Como os concorrentes diferem em preço, variedade e itens? | Estatística descritiva por categoria de item e por metrópole, com Salvador em destaque; análise qualitativa dos itens |

### Operacional

| Variável | Pergunta | Técnica |
|---|---|---|
| Principais reclamações | Quais falhas operacionais evitar e em que proporção aparecem? | Frequência absoluta e percentual por aspecto negativo, com intervalo de confiança; ranking total e por estabelecimento |
| Permanência e tamanho dos grupos (Bloco B3) | Quantas mesas de cada tamanho e qual capacidade? | Distribuição do tamanho dos grupos na entrada; permanência média com observações censuradas |

### Financeiro — premissas críticas

| Premissa | Evidência | Técnica | Limitação declarada |
|---|---|---|---|
| **Ocupação** | Contagem direta na São Jogue (Bloco B3) | Ocupação das mesas e dos assentos minuto a minuto, pelos grupos de mesa (média e pico por visita); pessoas por hora; média e amplitude entre as quatro visitas | Um estabelecimento, quatro visitas, só sexta e sábado à noite |
| **Fluxo** | NFC-e emitidas entre as duas visitas da unidade (Bloco B3) | Notas por dia no intervalo × pessoas por nota observadas nas visitas → visitantes por semana, por unidade | Nota só a pedido do cliente (piso das vendas); numeração pode incluir delivery e balcão; um único intervalo por unidade (6 e 13 dias) |
| **Ocupação** | Velocidade de avaliações calibrada (Blocos B2 e B3) | Modelo de calibração (abaixo) | Razão avaliações/visitantes pode variar entre estabelecimentos |
| **Pessoas por mesa** | Tamanho do grupo citado (Bloco B2) e observado (Bloco B3) | Distribuição e comparação entre as duas fontes | Relato espontâneo × poucas observações |
| **Giro de mesa** | Permanência observada (Bloco B3) e política de cobrança (Bloco B1) | Permanência média; comparação descritiva dos modelos de cobrança | Permanência censurada pelo início e fim da visita |
| **Ticket médio** | Valores citados × cardápio × metrópole | Mediana e intervalo interquartil dos valores por pessoa; comparação com o consumo por pessoa do cardápio | Poucos textos citam valores |
| **Ticket médio** | Itens fixos do cardápio (bebidas, entradas, principal, sobremesa, couvert) | **Consumo por pessoa** = bebida + entrada ou prato; **cesta completa** = consumo + couvert, só nas casas com couvert encontrado (couvert não encontrado não entra como 0; decisão de 30/10); por metrópole, com Salvador em destaque; calibrada pelos valores citados e pelos preços observados na São Jogue; checada contra a POF | Consumo por pessoa é premissa com faixa |

### Modelo de calibração da ocupação

1. **Visitantes por semana na São Jogue, por dois caminhos:**
   - **(a) Notas fiscais:** notas emitidas entre as duas visitas da unidade ÷ dias do intervalo × 7 × pessoas por nota (entradas contadas ÷ notas emitidas durante as visitas). Como a nota só sai a pedido do cliente, as notas emitidas são piso das vendas: com pessoas por grupo no lugar de pessoas por nota, o caminho (a) dá **limite inferior**; com pessoas por nota medida na visita, a proporção de clientes que pedem nota só se compensa se for a mesma na visita e no intervalo, o que é premissa declarada;
   - **(b) Contagem:** pessoas por hora observadas × horas de funcionamento de fim de semana; os dias úteis entram pela razão entre dia útil e fim de semana implícita no caminho (a), declarada como premissa com faixa.
   Os dois caminhos são comparados; a divergência entra na faixa (mínimo, provável e máximo). O caminho (a) informa o mínimo; o (b), medido no movimento máximo, o máximo.
2. **Razão de calibração:** avaliações com texto por semana da São Jogue (velocidade do Bloco B2) ÷ visitantes por semana estimados.
3. **Fluxo dos demais concorrentes:** velocidade de avaliações de cada estabelecimento ÷ razão de calibração. Resultado em faixa.
4. **Uso no plano:** faixa de visitantes por semana para estabelecimentos comparáveis ao proposto → premissa de ocupação no registro de premissas (N5 + N3).

Custos (aluguel, pessoal, tributos) e indicadores seguem [8_financeiro.md](8_financeiro.md): registro de premissas com faixas, triangulação, tornado e ponto de ruptura. Monte Carlo é extra, só se sobrar tempo.

### Controles estatísticos (valem para todas as análises)

- **Unidade de análise explícita:** avaliação, avaliador ou estabelecimento. Decisões sobre modelos de negócio usam o estabelecimento como unidade.
- **Ponderação igual por estabelecimento** nas estatísticas com avaliações, para que casas movimentadas não dominem o resultado.
- **Intervalo de confiança** junto de toda proporção ou média usada em premissa.
- **Só no extra (§3.5):** efeito fixo por estabelecimento nas regressões; tamanho de efeito junto com o valor-p (diferença de médias, razão de chances, V de Cramér); correção de Benjamini-Hochberg para o conjunto de testes registrados.
- **Sensibilidade:** resultados com e sem os cinco estabelecimentos de maior volume, e com e sem os de menos de 10 avaliações com texto no recorte.
- Resultado não significativo também é reportado.

## 3.7 Matriz de evidências

**Quadro XX -** Matriz de evidências

| Decisão | Pergunta | Dado usado | Fonte | Confiança |
|---|---|---|---|---|
| Em que bairro de Salvador abrir? | Onde está o público-alvo, longe da concorrência direta e com aluguel compatível? | População e faixa etária por bairro; renda; localização da São Jogue; aluguel; entorno | Censo 2022; PNAD Contínua; Bloco B1 (Google Maps); FipeZap | N2 + N3 |
| Qual modelo de cobrança? | Qual modelo o mercado pratica e qual gera menos reclamação de preço? | Política de preço; reclamações de preço | Blocos B1 e B2 | N3 |
| Que cardápio oferecer? | Qual o peso da comida na satisfação e que itens e preços o mercado pratica? | Menções a comida × nota; cardápios | Blocos B1 e B2 | N3 |
| Qual ticket médio projetar? | Quanto uma pessoa gasta por visita? | Valores citados; consumo por pessoa do cardápio; preços observados; gasto familiar | Blocos B1, B2 e B3; POF | N3 + N5 + N2 |
| Qual ocupação projetar? | Quantos visitantes por semana um estabelecimento comparável recebe? | Notas fiscais emitidas entre visitas (piso); ocupação do salão e contagem direta; velocidade de avaliações calibrada | Blocos B2 e B3 | N5 + N3 |
| Qual giro projetar? | Quanto tempo uma mesa fica ocupada? | Permanência observada; modelos de cobrança | Blocos B1 e B3 | N5 |
| Quantas mesas e de que tamanho? | Quantas pessoas ocupam cada mesa? | Tamanho do grupo citado e observado | Blocos B2 e B3 | N3 + N5 |
| Qual acervo inicial? | Quais jogos o público cita, quais os concorrentes oferecem e quanto custam? | Jogos citados; acervos declarados; cesta de jogos e preço nas lojas | Blocos B1 e B2 | N3 |
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
5. A contagem direta é **observação agregada, feita dentro de espaço comercial aberto ao público**, com o observador sentado como cliente: não há fotos de pessoas, registro de características individuais nem interação com clientes, e a mesa do próprio observador fica fora dos registros. O número da NFC-e vem de nota emitida para compra do próprio autor.

Citar a Lei nº 13.709/2018 (LGPD) e a Resolução CNS nº 510/2016. Registrar a consulta à orientadora sobre a dispensa de submissão ao Comitê de Ética.

## 3.9 Limitações

| Limitação | Efeito | Tratamento |
|---|---|---|
| Autosseleção de quem avalia | Superrepresenta experiências extremas e usuários ativos | Declarada; efeito fixo por estabelecimento; sem controle do grau de exigência de cada avaliador |
| Recorte de três meses de avaliações | Cobre só parte do ano e não mede sazonalidade; rótulo "3 meses atrás" sem limite exato | Declarada; data da coleta registrada; sazonalidade tratada como premissa com faixa |
| Corte de 100 avaliações no Bloco B1 | Exclui casas novas ou pequenas | Declarada; total da busca apresentado ao lado do total acima do corte |
| Datas relativas | Impossibilita dia da semana e dia do mês das avaliações | Fim de semana vem da contagem direta; dia útil, das notas fiscais |
| Visitas só em sexta e sábado à noite | Ocupação e pessoas por hora do movimento máximo superestimam a média da semana | O caminho das notas fiscais (dias inteiros entre as visitas) dá o piso; o caminho da contagem entra como limite superior da faixa |
| Contagem em um único estabelecimento e cidade, com quatro visitas | Razão de calibração pode não valer para outros locais; sem sazonalidade | Faixa larga; sensibilidade da ocupação no tornado; validação recomendada antes do investimento |
| Observação dentro do salão | A mesa do observador (2 ou 3 pessoas) ocupa um lugar e fica fora dos registros; o observador pode não ver todas as mesas ao mesmo tempo | Mesa e pessoas do observador tiradas do denominador da ocupação, por visita; contagens periódicas de mesas; comparação entre porta, mesas e notas fiscais |
| NFC-e só a pedido do cliente | Notas emitidas são piso das vendas; numeração pode incluir delivery e balcão; uma nota cobre um grupo | Caminho (a) lido como limite inferior; pessoas por nota medidas nas próprias visitas; série e unidade registradas. Volta em 11.3 |
| Um único intervalo entre visitas por unidade | Bela Vista com 6 dias e Paralela com 13, abaixo dos 15 planejados; não capta a variação do mês (pagamento de salários) nem a sazonalidade | Declarada; notas por dia em faixa. Volta em 11.3 |
| Permanência censurada pelo início e fim da visita | Subestima a permanência de grupos longos | Declarada; observações censuradas sinalizadas |
| Cobertura do Google Maps | Estabelecimentos fora da plataforma ou cortados pela busca não entram no censo da fonte | Checagem de cobertura com buscas manuais e Instagram; ausências registradas com o motivo |
| Falhas do script de coleta | Registros perdidos ou campos errados, possivelmente concentrados em um grupo | Amostra de auditoria com taxa de erro e IC 95%; comparação entre registros com falha e completos; recoleta do estrato afetado |
| Omissões na contagem direta | Entradas ou saídas não anotadas reduzem o fluxo e distorcem a permanência | Fechamento do saldo a cada 30 minutos; comparação com mesas e notas fiscais; taxa de omissão reportada, sem imputação |
| Erro de classificação do dicionário | Viés nas variáveis de texto | Validação com kappa e F1; variável reprovada é reportada como exploratória |
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

- BARDIN, Laurence. *Análise de conteúdo*. Edições 70, 2011. — codificação dos textos. `[AV]`
- COHEN, Jacob. A coefficient of agreement for nominal scales. *Educational and Psychological Measurement*, 1960. — kappa. `[AV]`
- BENJAMINI, Yoav; HOCHBERG, Yosef. Controlling the false discovery rate. *Journal of the Royal Statistical Society: Series B*, 1995. — múltiplas comparações. `[AV]`
- MALHOTRA, Naresh K. *Pesquisa de marketing*. 2019. `[AV]`
- GROVES, Robert M. et al. *Survey methodology*. 2. ed. Wiley, 2009. — erro total da pesquisa. `[AV]`
- BIEMER, Paul P. Total survey error: design, implementation, and evaluation. *Public Opinion Quarterly*, v. 74, n. 5, 2010. — erro amostral e não amostral. `[AV]`
- AMAYA, Ashley; BIEMER, Paul P.; KINYON, David. Total error in a big data world: adapting the TSE framework to big data. *Journal of Survey Statistics and Methodology*, v. 8, n. 1, 2020. — erro total em dados de plataforma. `[AV]`
- MENG, Xiao-Li. Statistical paradises and paradoxes in big data (I). *The Annals of Applied Statistics*, v. 12, n. 2, 2018. — viés de seleção em bases grandes. `[AV]`
- WILSON, Edwin B. Probable inference, the law of succession, and statistical inference. *Journal of the American Statistical Association*, v. 22, 1927. — intervalo da taxa de erro. `[AV]`
