# Cap. 3 — Metodologia

## Função no plano

Mais robusta que a de um plano de negócios comum. O método é defendido pela **confiabilidade do número que ele gera**, não pela teoria. Cada instrumento descrito aqui alimenta uma premissa (cap. 9) ou uma decisão (caps. 5 a 8). Instrumento que não alimenta nada sai.

Aproveitar de `arquivados/metodologia_tcc_luderia.md` a descrição de fontes, filtros e curadoria de estabelecimentos e jogos. Hipóteses H1–H9 do desenho anterior não são retomadas: as hipóteses atuais estão no registro prévio (§3.5). Resultados entram nos capítulos aplicados em linguagem de decisão; testes, estatísticas e valores-p vão para apêndice.

## Escopo adotado

Resumo das decisões de desenho tomadas pelo autor. Mudança de escopo exige atualizar esta seção, `textos/planejamento/projeto_pesquisa_luderia.md` e `textos/planejamento/cronograma_luderia.md`.

- **Praça do plano:** Salvador (BA). A decisão de localização é o bairro e o ponto, não a cidade.
- **Sem questionários.** Dados secundários públicos e uma única coleta primária comportamental (contagem direta de ocupação, com leitura do número da NFC-e).
- **Estabelecimentos (Bloco B1):** concorrentes com **mais de 100 avaliações** no Google Maps nas **14 capitais classificadas como metrópole pela REGIC** (IBGE); população final esperada de 100 a 150 estabelecimentos após a curadoria.
- **Avaliações (Bloco B2):** **todas as avaliações com texto publicadas até "3 meses atrás"** (rótulo relativo do Google Maps na data da coleta), por estabelecimento, com texto integral. O número de avaliações varia entre estabelecimentos. Não há divisão da base: a etapa exploratória e a descritiva usam a população inteira de avaliações coletadas.
- **Modelo de alimentos e bebidas:** não é avaliado. Cozinha própria, parceria ou só bar deixa de ser variável do Bloco B1 e passa a premissa do autor no cap. 9.
- **Cardápios** de cada estabelecimento.
- **Contagem direta de ocupação** nas duas unidades da São Jogue (única luderia de Salvador), feita do lado de fora: 4 visitas de 3 horas, 2 por unidade, em horários planejados para os momentos de maior fluxo provável. Em cada unidade, a primeira visita é num sábado (03/10/2026), com entrada às 19h, e a segunda num domingo, 15 dias depois (18/10/2026), com entrada às 18h. O número da NFC-e lido nas duas visitas dá as notas emitidas no intervalo.
- **Bases públicas:** IBGE (Censo 2022 por setor censitário, estimativas populacionais, POF 2017–2018, PNAD Contínua, PAS, CONCLA), RAIS e Novo CAGED, FipeZap comercial, Lei Complementar 123/2006 e anexos do Simples Nacional, Banco Central (SGS e Focus).
- **Garantias de robustez (núcleo):** validação da coleta e da codificação; ponderação por estabelecimento; registro de premissas com faixas e nível de evidência; três cenários; tornado; ponto de ruptura.
- **Extras, só se sobrar tempo no fim:** testes de hipótese H1–H9 com registro prévio e correção para múltiplas comparações, na base inteira (§3.5); simulação de Monte Carlo ([8_financeiro.md](8_financeiro.md) §4.4). Se feitos, vão para apêndice. A banca de um plano de negócios avalia se a premissa se sustenta; os três cenários, o tornado e o ponto de ruptura já respondem sob quais condições o negócio é viável.

### Correspondência entre blocos e arquivos do pipeline

Cada bloco tem subpasta `[Bn] Nome` em `_src/`, `_data/raw/` e `_data/processed/`. Arquivos gerados e scripts levam o código do bloco: `Bn_<conteúdo>` nas saídas, `<etapa>_Bn_<conteúdo>.py` nos scripts (etapa = `collect`, `build` ou `analise`). As tabelas do Bloco B4 seguem o padrão `[B4] {dado} {período} ({fonte}).csv`. Módulos auxiliares sem saída própria (`places_client.py`, `osm_client.py`, `recorte_rm.py`, `bases_comum.py`, `ludopedia_client.py`) não levam código. Saídas e scripts do desenho anterior e o Bloco B6, retirado, ficam em `arquivados/`.

| Bloco | Conteúdo | Scripts | Pasta de dados |
|---|---|---|---|
| B1 | Estabelecimentos e cardápios | `_src/[B1] Google Places (estabelecimentos)/` | `[B1] Estabelecimentos e cardapios/` |
| B2 | Avaliações recentes | `_src/[B2] Google Places (comentarios)/` | `[B2] Avaliacoes recentes/` |
| B3 | Contagem direta de ocupação | `_src/[B3] Contagem direta de ocupacao/` | `[B3] Contagem direta de ocupacao/` |
| B4 | Bases públicas | `_src/[B4] Bases publicas/` | `[B4] Bases publicas/` |

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
| Fonte | Google Places API; site, Instagram e cardápio digital de cada estabelecimento; OpenStreetMap |
| Recorte | Luderias, ludobares e quiz-bares com **mais de 100 avaliações** nas **14 capitais classificadas como metrópole** pela REGIC 2018 (IBGE) e em suas regiões metropolitanas; 164 candidatos antes da curadoria manual (`B1_planilha_curadoria_metropoles_filtrada_mais_100_avaliacoes.csv`); população final esperada de 100 a 150. Cada estabelecimento é atribuído à metrópole pelo endereço |
| Variáveis | Avaliação média, volume de avaliações, política de preço, acervo declarado, entorno em 500 m e 1.000 m. O modelo de A&B não é registrado |
| **Cardápios** | Itens oferecidos, preço por item, variedade por categoria e número de itens que exigem preparo (sem contar itens prontos, como balas, refrigerantes e água). Categorias fixas: **bebidas** (drinks, refrigerante, cerveja, não alcoólicas), **entradas** (batata, outras), **pratos principais** (hambúrguer, pizza, outros), **sobremesas**, **couvert ou taxa de jogo** |
| Registro | Data da coleta e link do cardápio; preços em R$ com duas casas decimais |
| Uso no plano | Concorrência (5.3), preço (6.3), cardápio (6.2), ticket médio (cap. 9) |
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

Única coleta primária do trabalho. Fornece a **âncora absoluta** de fluxo, tamanho de grupo e permanência, usada para calibrar a velocidade de avaliações (§3.6). A leitura do número da NFC-e acrescenta um registro transacional (tipo 2 na hierarquia de dados) ao que é observado na porta.

| Item | Descrição |
|---|---|
| Local | As duas unidades da São Jogue, única luderia de Salvador |
| Visitas | 4 no total, 2 por unidade: a **primeira** e a de **retorno**, 15 dias depois, na mesma unidade |
| Períodos | Primeiras visitas no **sábado, 03/10/2026**, as duas unidades no mesmo dia, na quinzena posterior ao pagamento dos servidores estaduais da Bahia (29/09 para inativos e pensionistas; 30/09 para ativos). Os retornos caem no **domingo, 18/10/2026**, na quinzena anterior ao pagamento de outubro (29/10). Fonte: Governo da Bahia, Tabela de Pagamentos 2026 |
| Horário | Planejado, não sorteado: os horários cobrem os momentos de maior fluxo provável. Sábado, entrada às 19h; domingo, entrada às 18h; nas duas unidades. As reservas da São Jogue só abrem às 12h, 15h e 18h, e o início da noite é o horário de maior fluxo esperado. A planilha de sorteio (`build_B3_contagem_sorteio.py`, semente 20260916) fica como registro do desenho anterior |
| Posição do observador | Do lado de fora do estabelecimento, com vista para a entrada |
| Duração da visita | Fixa, de 3 horas. Horário de início e de fim registrados; todas as taxas são calculadas por hora observada |
| Registro contínuo | Entrada e saída de cada grupo: horário e número de pessoas. Grupos identificados por código para ligar entrada e saída (permanência) |
| Registro a cada 30 minutos | Saldo de pessoas no interior (entradas − saídas, a partir da contagem inicial) e mesas ocupadas, quando visíveis de fora |
| NFC-e | Número da nota fiscal de uma compra no início e no fim de cada visita, com data, hora e série. A diferença entre a primeira visita e o retorno dá as notas emitidas em 15 dias; a diferença dentro da mesma visita dá as notas emitidas durante a observação |
| Registro complementar | Mesas disponíveis (contagem única por unidade), política de cobrança aplicada, preços do cardápio na data, dia, horário e condições atípicas (evento, chuva, jogo de futebol) |
| Instrumento | Formulário padronizado preenchido no celular; sem fotos de pessoas; sem registro de características individuais |
| Saídas | Pessoas por hora; tamanho dos grupos; permanência média (com observações censuradas); pessoas por nota fiscal (entradas ÷ notas emitidas durante a visita); notas por dia no intervalo de 15 dias; estimativa de visitantes por semana, em faixa |
| Uso no plano | Premissas de ocupação, pessoas por mesa e giro (cap. 9); calibração do fluxo dos demais concorrentes; capacidade (7.2) |
| Limitação | Quatro visitas em um único estabelecimento e uma única cidade, em um sábado e um domingo: a contagem não observa dias úteis, que entram pelo caminho das notas fiscais; observação de fora não vê o salão inteiro; numeração da NFC-e pode incluir delivery e vendas de balcão, e uma nota pode cobrir um grupo inteiro; permanência censurada pelo início e fim da visita |

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

Scripts em `_src/[B4] Bases publicas/` (`collect_B4_*` → `build_B4_*`); saídas `[B4] *.csv` em `_data/processed/[B4] Bases publicas/`; referências ABNT em `bibliografia/referencias_bases_publicas.md`.

## 3.4 Tratamento dos dados

### Pipeline

- Scripts em `_src/[bloco]/` seguindo o padrão `collect_*` → `build_*` → `analise_*`; saídas em `_data/processed/` com o prefixo do bloco.
- Dados brutos (textos integrais) ficam em `_data/raw/`, fora do repositório público. O TCC e o repositório divulgam **apenas dados processados**.
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
| B3 | Períodos de maior fluxo provável, escolhidos e observados pelo autor | Há: quatro visitas no pico representam a operação da unidade | Omissão de registro; erro de contagem | Fechamento do saldo; comparação entre caminhos independentes; dado faltante declarado |

Fonte: elaborado pelo próprio autor

#### Blocos B1 e B2 - censo da fonte

O script coleta todos os estabelecimentos e todas as avaliações do recorte. Por isso, não há erro amostral. A amostra deixa de servir para inferir a população e passa a estimar a taxa de erro do instrumento de coleta. O fato de o script ter sido escrito com apoio de inteligência artificial não muda essa lógica: o que se valida é o dado gerado, não a autoria do código. O código fica no repositório e pode ser auditado.

A validação tem três etapas:

| Etapa | Procedimento |
|---|---|
| 1. Fidelidade | No Bloco B1, amostra aleatória estratificada por capital e faixa de volume de avaliações: 20% dos estabelecimentos curados, com nota média, número de avaliações e endereço conferidos na página. No Bloco B2, amostra estratificada por estabelecimento em duas etapas (abaixo): texto, nota e rótulo de data conferidos na página. As 200 avaliações da primeira etapa são as mesmas da validação do dicionário. A conferência é feita até sete dias após a coleta, e a data de cada conferência é registrada |
| 2. Completude | Em todos os estabelecimentos do Bloco B2, o número de avaliações com texto no recorte, contado na página, é comparado ao número coletado. Diferença indica avaliação perdida por paginação, tempo de espera ou limite de pedidos |
| 3. Cobertura | A lista do Bloco B1 é comparada a fontes independentes: buscas manuais por termo nas capitais e perfis de luderias no Instagram. Estabelecimento encontrado fora da lista é registrado com o motivo da ausência |

O resultado é a taxa de erro por variável, com intervalo de confiança de 95% (método de Wilson). O critério de aceitação é limite superior do intervalo igual ou inferior a 5%. Variável acima do critério tem o script corrigido e o estrato afetado coletado de novo. Se a recoleta não for possível, a variável é reportada com a taxa de erro medida e entra no cálculo da faixa da premissa que ela alimenta.

##### Amostra de auditoria do Bloco B2

O desenho combina um total calculado pelo critério de aceitação (Wilson) com a regra de inspeção em duas etapas usada no controle de qualidade por atributos (ABNT NBR 5426 `[A VERIFICAR]`). Cada estabelecimento é um estrato, e todos entram na amostra. O motivo é o padrão das falhas: elas tendem a se concentrar em certas páginas, e um estabelecimento fora da amostra esconderia a falha. Explicação em linguagem simples em `docs/estatidez.md`.

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

A extração por API copia tabelas inteiras. Não há sorteio nem página a ser lida, e o volume de séries é pequeno. A validação, então, é exaustiva: cada série usada no plano é reconciliada com a tabela publicada no portal da instituição, em ao menos um período e um recorte geográfico. Os totais são conferidos com a soma das linhas, conforme a regra de tabela agregada do projeto. As funções de conferência ficam nos próprios scripts `build_B4_*`.

Os erros mais prováveis são de processamento: código de variável ou de município trocado, filtro aplicado à série errada, unidade (mil, milhão, percentual) e índice de correção monetária. O erro da própria base não é validado pelo trabalho, e sim declarado em §3.9: amostra da POF e da PNAD Contínua, cobertura só do emprego formal no Novo CAGED e preço anunciado, não contratado, no FipeZap.

#### Bloco B3 - contagem direta

A contagem não é censo. As quatro visitas são uma amostra de períodos, escolhidos para observar o pico de fluxo provável. A escolha é deliberada: a contagem mede a ocupação no pico, não a média do dia. O erro amostral existe e é tratado pela faixa larga da premissa de ocupação e pela análise de sensibilidade (§3.6).

O instrumento é o próprio observador, e não há gravação para auditar depois. A validação usa a consistência interna do registro e a comparação entre caminhos independentes:

| Checagem | Procedimento |
|---|---|
| Fechamento do saldo | Contagem inicial + entradas - saídas, comparada à contagem feita a cada 30 minutos. A diferença acumulada mede a omissão de registros na porta |
| Grupos sem saída | Grupos com entrada e sem saída registrada são contados à parte. Os que ainda estão no salão ao fim da visita são censurados; os demais são omissões |
| Caminhos independentes | Pessoas pela porta, pessoas pelas mesas e notas fiscais emitidas: as três estimativas de fluxo são comparadas por visita |

Dado não anotado é tratado como faltante. Não há imputação. A taxa de omissão de cada visita é reportada junto com as saídas. Quando a omissão for relevante, a estimativa de fluxo usa o caminho com menos falhas e a faixa da premissa aumenta. O script `analise_B3_contagem.py` já conta à parte os grupos sem saída e os pedidos sem chegada, sem imputação. O fechamento do saldo e a separação entre censura e omissão ainda precisam ser acrescentados a ele.

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
| **Ocupação** | Contagem direta na São Jogue (Bloco B3) | Pessoas por hora e saldo no interior por hora do dia; média e amplitude entre as quatro visitas; comparação descritiva entre a primeira visita e o retorno | Um estabelecimento, quatro visitas, só fim de semana |
| **Fluxo** | NFC-e emitidas em 15 dias (Bloco B3) | Notas por dia no intervalo × pessoas por nota observadas nas visitas → visitantes por semana, por unidade | Numeração pode incluir delivery e balcão |
| **Ocupação** | Velocidade de avaliações calibrada (Blocos B2 e B3) | Modelo de calibração (abaixo) | Razão avaliações/visitantes pode variar entre estabelecimentos |
| **Pessoas por mesa** | Tamanho do grupo citado (Bloco B2) e observado (Bloco B3) | Distribuição e comparação entre as duas fontes | Relato espontâneo × poucas observações |
| **Giro de mesa** | Permanência observada (Bloco B3) e política de cobrança (Bloco B1) | Permanência média; comparação descritiva dos modelos de cobrança | Permanência censurada pelo início e fim da visita |
| **Ticket médio** | Valores citados × cardápio × metrópole | Mediana e intervalo interquartil dos valores por pessoa; comparação com a cesta de cardápio | Poucos textos citam valores |
| **Ticket médio** | Itens fixos do cardápio (bebidas, entradas, principal, sobremesa, couvert) | **Cesta por pessoa** = couvert + bebida + entrada ou prato, por metrópole, com Salvador em destaque; calibrada pelos valores citados e pelos preços observados na São Jogue; checada contra a POF | Consumo por pessoa é premissa com faixa |

### Modelo de calibração da ocupação

1. **Visitantes por semana na São Jogue, por dois caminhos:**
   - **(a) Notas fiscais:** notas emitidas entre a primeira visita e a de retorno ÷ dias do intervalo × 7 × pessoas por nota (entradas contadas ÷ notas emitidas durante as visitas);
   - **(b) Contagem:** pessoas por hora observadas × horas de funcionamento de fim de semana; os dias úteis entram pela razão entre dia útil e fim de semana implícita no caminho (a), declarada como premissa com faixa.
   Os dois caminhos são comparados; a divergência entra na faixa (mínimo, provável e máximo).
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
| Em que bairro de Salvador abrir? | Onde está o público-alvo, longe da concorrência direta e com aluguel compatível? | População e faixa etária por bairro; renda; localização da São Jogue; aluguel; entorno | Censo 2022; PNAD Contínua; Bloco B1; FipeZap; OpenStreetMap | N2 + N3 |
| Qual modelo de cobrança? | Qual modelo o mercado pratica e qual gera menos reclamação de preço? | Política de preço; reclamações de preço | Blocos B1 e B2 | N3 |
| Que cardápio oferecer? | Qual o peso da comida na satisfação e que itens e preços o mercado pratica? | Menções a comida × nota; cardápios | Blocos B1 e B2 | N3 |
| Qual ticket médio projetar? | Quanto uma pessoa gasta por visita? | Valores citados; cesta de cardápio; preços observados; gasto familiar | Blocos B1, B2 e B3; POF | N3 + N5 + N2 |
| Qual ocupação projetar? | Quantos visitantes por semana um estabelecimento comparável recebe? | Notas fiscais emitidas em 15 dias; contagem direta; velocidade de avaliações calibrada | Blocos B2 e B3 | N5 + N3 |
| Qual giro projetar? | Quanto tempo uma mesa fica ocupada? | Permanência observada; modelos de cobrança | Blocos B1 e B3 | N5 |
| Quantas mesas e de que tamanho? | Quantas pessoas ocupam cada mesa? | Tamanho do grupo citado e observado | Blocos B2 e B3 | N3 + N5 |
| Qual acervo inicial? | Quais jogos o público cita e quais os concorrentes oferecem? | Jogos citados; acervo declarado | Blocos B1 e B2 | N3 |
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
| Recorte de três meses de avaliações | Cobre só parte do ano e não mede sazonalidade; rótulo "3 meses atrás" sem limite exato | Declarada; data da coleta registrada; sazonalidade tratada como premissa com faixa |
| Corte de 100 avaliações no Bloco B1 | Exclui casas novas ou pequenas | Declarada; total da busca apresentado ao lado do total acima do corte |
| Datas relativas | Impossibilita dia da semana e dia do mês das avaliações | Curva semanal vem da contagem direta |
| Visitas no horário de maior fluxo provável | Pessoas por hora do pico superestimam a média do dia | O caminho das notas fiscais (15 dias inteiros) dá a média; o caminho da contagem entra como limite superior da faixa |
| Contagem em um único estabelecimento e cidade, com quatro visitas | Razão de calibração pode não valer para outros locais; sem sazonalidade | Faixa larga; sensibilidade da ocupação no tornado; validação recomendada antes do investimento |
| Observação do lado de fora | Não vê o salão inteiro; saldo de pessoas acumula erros de contagem | Contagem inicial e final conferidas; comparação com o caminho das notas fiscais |
| Numeração da NFC-e | Pode incluir delivery e balcão; uma nota cobre um grupo | Pessoas por nota medidas nas próprias visitas; série e unidade registradas |
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

- BARDIN, Laurence. *Análise de conteúdo*. Edições 70, 2011. — codificação dos textos. `[A VERIFICAR]`
- COHEN, Jacob. A coefficient of agreement for nominal scales. *Educational and Psychological Measurement*, 1960. — kappa. `[A VERIFICAR]`
- BENJAMINI, Yoav; HOCHBERG, Yosef. Controlling the false discovery rate. *Journal of the Royal Statistical Society: Series B*, 1995. — múltiplas comparações. `[A VERIFICAR]`
- MALHOTRA, Naresh K. *Pesquisa de marketing*. 2019. `[A VERIFICAR]`
- GROVES, Robert M. et al. *Survey methodology*. 2. ed. Wiley, 2009. — erro total da pesquisa. `[A VERIFICAR]`
- BIEMER, Paul P. Total survey error: design, implementation, and evaluation. *Public Opinion Quarterly*, v. 74, n. 5, 2010. — erro amostral e não amostral. `[A VERIFICAR]`
- AMAYA, Ashley; BIEMER, Paul P.; KINYON, David. Total error in a big data world: adapting the TSE framework to big data. *Journal of Survey Statistics and Methodology*, v. 8, n. 1, 2020. — erro total em dados de plataforma. `[A VERIFICAR]`
- MENG, Xiao-Li. Statistical paradises and paradoxes in big data (I). *The Annals of Applied Statistics*, v. 12, n. 2, 2018. — viés de seleção em bases grandes. `[A VERIFICAR]`
- WILSON, Edwin B. Probable inference, the law of succession, and statistical inference. *Journal of the American Statistical Association*, v. 22, 1927. — intervalo da taxa de erro. `[A VERIFICAR]`
