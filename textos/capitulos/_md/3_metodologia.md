# 3 METODOLOGIA

Este trabalho consiste em um plano de negócios baseado em evidências. Cada decisão do plano se baseia em um dado, obtido por meio de uma pesquisa descritivo-exploratória de abordagem mista (quali-quanti) e classificado em uma escala de confiança elaborada pelo próprio autor.

Três termos têm sentido fixo ao longo do texto: *luderia* é o estabelecimento que combina alimentos e bebidas com acervo de jogos de mesa para uso no local, incluídos os formatos ludobar e quiz-bar; *concorrente* é a luderia aprovada na curadoria do Bloco B1; por último, *avaliação* é a avaliação com texto publicada no Google Maps.

Visando mitigar o viés de desejabilidade social, o efeito do entrevistador e o viés de seleção dos respondentes (MATTAR, [AV ano], cap. 5), o trabalho usa dados de comportamento real e observado, em vez de questionários e entrevistas. Todas as premissas vêm de bases públicas, de rastros digitais reais dos concorrentes e de contagens diretas realizadas em visitas presenciais.

## 3.1 HIERARQUIA DE EVIDÊNCIAS

A escala de confiança ordena as fontes pela proximidade com o comportamento real do consumidor. Cada premissa recebe um nível de evidência, de N1, o mais confiável, a N6 (Quadro 3.1). Premissas sustentadas por mais de uma fonte registram todos os níveis em que se sustentam – por exemplo, "N3 + N5".

**Quadro 3.1 – Níveis de evidência das premissas**

| Nível | Tipo de evidência | Exemplo no trabalho |
|---|---|---|
| N1 | Orçamento, cotação, contrato ou tabela oficial | Alíquotas do Simples Nacional |
| N2 | Dado público estruturado | IBGE, Novo CAGED, FipeZap, Banco Central |
| N3 | Benchmark de concorrentes a partir de rastros digitais (Google Maps, redes sociais dos estabelecimentos etc.) | Preços, horários e acervos do Bloco B1 |
| N4 | Referência setorial ou relatório | Margens típicas de bares e restaurantes |
| N5 | Coleta primária comportamental própria | Contagem direta de ocupação (Bloco B3) |
| N6 | Estimativa do autor | Ocupação em dia útil |

Fonte: elaborado pelo próprio autor.

A escala também limita o peso das estimativas próprias. Nenhuma premissa crítica, entre as 5 de maior impacto no VPL, se fundamenta apenas em evidências do nível N6. Quando não há alternativa, a premissa recebe faixa larga e destaque na análise de riscos (capítulo 10). Além disso, entre dados de um mesmo nível, prevalece o mais próximo do comportamento real – por exemplo, o registro transacional prevalece sobre a observação direta, que, por sua vez, prevalece sobre a opinião declarada.

## 3.2 FONTES E INSTRUMENTOS DE COLETA

Os dados que alimentam essa escala vêm de cinco blocos de coleta (Quadro 3.2). Os Blocos B1 e B2 são censos da fonte, o B3 é a única coleta primária, o B4 reúne bases públicas extraídas por inteiro, e o B5 orça o investimento item a item.

**Quadro 3.2 – Blocos de coleta**

| Bloco | Fonte | Recorte | Uso no plano |
|---|---|---|---|
| B1 – Concorrentes | Google Places API; Google Maps; Instagram; Ludopedia; Acervo de Jogos; sites próprios de cada concorrente | Luderias com mais de 100 avaliações nas 14 metrópoles da REGIC 2018 (IBGE): 54 concorrentes | Concorrência, preço, cardápio, ponto, acervo, ticket médio |
| B2 – Avaliações recentes | Página de avaliações de cada concorrente no Google Maps | Avaliações com rótulo de data até "3 meses atrás", inclusive | Proposta de valor, reclamações, tamanho do grupo, jogos citados |
| B3 – Contagem direta | Observação nas duas unidades da São Jogue, com leitura da NFC-e | 4 visitas, sexta e sábado à noite, out/2026 | Taxa de ocupação, permanência, tamanho do grupo, fluxo |
| B4 – Bases públicas | IBGE, Novo CAGED, FipeZap, Simples Nacional, Banco Central, CONCLA | Salvador e demais capitais; 2017 a 2026 | Público, aluguel, salários, tributos, taxa de desconto |
| B5 – Ativos fixos | SINAPI (Caixa); anúncios da Amazon e do Mercado Livre | Bahia, set/2026; até 5 anúncios por item e site, nov/2026 | Investimento em reforma, mobiliário, cozinha e informática |

Fonte: elaborado pelo próprio autor.

### 3.2.1 Bloco B1 – Concorrentes

A busca pela Google Places API levantou 164 candidatos com mais de 100 avaliações nas 14 metrópoles e em suas regiões metropolitanas, e a curadoria manual aprovou 54. Cada concorrente pertence a uma única metrópole, pelo endereço (Apêndice A). O corte de 100 avaliações tem uma razão: ele delimita os concorrentes estabelecidos, que são a referência de preço e de fluxo.

De cada concorrente, são registrados a nota, o volume de avaliações, o horário, a política de cobrança, o cardápio, o acervo e o entorno. Os cardápios têm categorias fixas, e item com vários tamanhos ou combos entra nas medianas só pela linha de referência: cardápio mais recente, sem combo, no menor tamanho. O couvert que não aparece no cardápio é buscado no site, na imprensa e no Instagram da casa, com a data da publicação. A cesta de jogos reúne os títulos presentes em 15 ou mais dos 30 acervos publicados, com preço levantado em lojas online, e sustenta o custo do acervo inicial (capítulo 9). O entorno conta as estações de transporte e os shoppings de porte (1.000 avaliações ou mais) a até 500 m e 1.000 m de cada concorrente.

### 3.2.2 Bloco B2 – Avaliações recentes

O Bloco B2 usa o rótulo de data que o Google Maps mostra em cada avaliação. O rótulo "3 meses atrás" cobre de 90 a 119 dias. O número de avaliações no recorte, dividido pela duração da janela, dá a *velocidade de avaliações*, em avaliações com texto por mês. A coleta foi feita por script no navegador, em outubro de 2026, com o nome do avaliador trocado por um código. Avaliação com texto cortado é marcada, e o concorrente é coletado de novo. A base de codificação tem 1.628 avaliações.

### 3.2.3 Bloco B3 – Contagem direta de ocupação

A contagem direta é a âncora absoluta do trabalho. Foram quatro visitas à São Jogue, única luderia de Salvador, sempre na noite de sexta ou sábado: Bela Vista em 10/10 e 16/10 e Paralela em 17/10 e 30/10/2026, com 10,9 horas observadas e 27 grupos de mesa, com 101 pessoas.

O observador fica sentado a uma mesa como cliente, e essa mesa sai dos registros e do denominador. Um aplicativo para Android, desenvolvido para o trabalho, grava a entrada e a saída de cada grupo, o número de pessoas, os jogos e as chamadas ao instrutor (Apêndice B). A *taxa de ocupação* é a proporção média das mesas ocupadas, calculada minuto a minuto, sobre 10 mesas na Bela Vista e 9 na Paralela. A contagem cobre só as horas observadas; para estimar as vendas fora delas, o trabalho usa a numeração das notas fiscais. A nota fiscal de consumidor eletrônica (NFC-e) de uma compra do autor no início e no fim de cada visita dá o número da nota. A diferença entre as visitas da mesma unidade dá as notas emitidas no intervalo: 183 na Bela Vista, em 6 dias, e 209 na Paralela, em 13 dias. Como as duas unidades só emitem a nota a pedido do cliente, as notas são um piso das vendas.

### 3.2.4 Blocos B4 e B5 – Bases públicas e ativos fixos

As bases públicas dão o público e a renda (Censo 2022, estimativas de população e Pesquisa Nacional por Amostra de Domicílios, PNAD Contínua), o aluguel (FipeZap), os salários (Novo Cadastro Geral de Empregados e Desempregados, Novo CAGED), os tributos (Simples Nacional e Comissão Nacional de Classificação, CONCLA), as margens do setor (Pesquisa Anual de Serviços, PAS), o gasto das famílias (Pesquisa de Orçamentos Familiares, POF 2017-2018) e a taxa de desconto (Banco Central), cada série com recorte e data de referência (Apêndice C).

O Bloco B5 orça o investimento item a item, nos 75 itens da abertura. A reforma usa as composições do Sistema Nacional de Pesquisa de Custos e Índices da Construção Civil (SINAPI) na Bahia, com a taxa de bonificações e despesas indiretas do Tribunal de Contas da União, em N2. Mobiliário, cozinha e informática usam os cinco primeiros anúncios de cada busca na Amazon e no Mercado Livre, na ordem do site, que cumprem a especificação mínima do item, pelo preço sem frete (N3). O 3º quartil, a mediana e o 1º quartil das ofertas dão os cenários; as quantidades, sem projeto do ponto, são N6.

## 3.3 TRATAMENTO DOS DADOS

Os dados passam por coleta, tratamento e análise, cada etapa com scripts próprios. Os brutos com nomes de pessoas ficam fora do repositório público, todo sorteio usa semente fixa, e qualquer número do texto pode ser gerado de novo a partir dos scripts. Cada execução grava um registro com a data e as saídas.

As avaliações são codificadas por análise de conteúdo (BARDIN, 2002, p. 104–108). A unidade de registro é o tema, trecho que expressa um juízo sobre um atributo do concorrente, e a enumeração é por presença. O dicionário tem 22 temas, os mesmos para elogio e crítica: jogos, equipe e serviço, comida e bebida, preço, ambiente e regras da casa. A ocasião da visita e a compra na loja vão para uma coluna de contexto, sem polaridade. A codificação foi feita com apoio de inteligência artificial, pelo dicionário, e é validada pela recodificação do autor, descrita adiante. A validação estima o erro não amostral de cobertura, medida e processamento (MATTAR, [AV ano], cap. 6), com procedimento próprio para cada bloco (Quadro 3.3).

**Quadro 3.3 – Validação por bloco**

| Bloco | Erro a validar | Instrumento |
|---|---|---|
| B1 e B2 | Fidelidade do script à página; completude; cobertura do Google Maps | Amostra de auditoria; contagem na página; buscas independentes |
| B3 | Omissão de registro; erro de contagem | Fechamento do saldo; comparação entre porta, mesas e notas |
| B4 | Código, filtro, unidade, deflação | Reconciliação com a tabela publicada; soma das linhas igual ao total |
| B5 | Anúncio fora da especificação; kit lido como unidade | Requisitos mínimos por item; preço por unidade do kit; faixa em torno da mediana |

Fonte: elaborado pelo próprio autor.

Nos Blocos B1 e B2, uma amostra de auditoria sorteada com semente fixa é conferida na página: 20% dos concorrentes e 200 unidades de cada variável. A taxa de erro sai com intervalo de confiança de 95% pelo método de Wilson (1927) [AV], e a variável é aceita quando o limite superior fica em 5% ou menos. A completude das avaliações é conferida em todos os concorrentes, porque as falhas se concentram em certas páginas. A codificação foi validada por recodificação cega de 199 avaliações sorteadas com estratificação, em duas rodadas: 139 antes da revisão do dicionário e 60 depois. A concordância é medida pelo kappa de Cohen (COHEN, 1960) [AV], com aceitação a partir de 0,70; variável abaixo do critério é reportada como exploratória e não sustenta premissa sozinha. Na rodada final, os temas tiveram kappa de 0,84, e os quatro com 10 ou mais marcas, de 0,82 a 0,94. O contexto da visita ficou em 0,52 e entra só como dado exploratório. A frequência de visita declarada também ficou em 0,52 e foi excluída da análise. No Bloco B3, a contagem inicial mais as entradas e menos as saídas é comparada às contagens periódicas de mesas.

## 3.4 TÉCNICAS DE ANÁLISE

Cada capítulo do plano usa os dados com uma técnica própria. No marketing, a análise de penalidade e recompensa compara a nota média com e sem crítica a cada tema, com peso igual por concorrente, e separa os atributos obrigatórios dos que diferenciam. No operacional, as reclamações são ordenadas pela frequência, e o tamanho dos grupos e a permanência dimensionam as mesas.

No financeiro, a *circulação* no pico, em pessoas que entram por hora, vem da contagem direta, e o piso dela vem das notas fiscais. O horário publicado dos concorrentes leva a circulação do pico às demais horas: cada hora aberta pesa o número de concorrentes abertos nela em relação ao das horas das visitas. A circulação de dia útil segue a razão entre o gasto com cartão de segunda a quinta e o de sexta a domingo em restaurantes (ANR, 2026a; 2026b). O ticket médio é o gasto por pessoa declarado no Google Maps, comparado com a *cesta de consumo* de cada concorrente: uma bebida, uma entrada ou prato principal e a taxa de entrada. O *giro*, número de grupos que uma mesa recebe por dia, confere se a circulação cabe no salão. O *fluxo*, em visitantes por semana, é estimado na São Jogue por dois caminhos. As notas fiscais dão o limite inferior, e a contagem no movimento máximo, estendida às horas de fim de semana, dá o limite superior. A razão entre a velocidade de avaliações e o fluxo da São Jogue estende a estimativa aos demais concorrentes, sempre em faixa (N5 + N3). Toda proporção usada em premissa vem com intervalo de confiança. A matriz de evidências, que liga cada decisão do plano à pergunta, ao dado, à fonte e ao nível, está no Apêndice D.

## 3.5 ASPECTOS ÉTICOS E LEGAIS

As avaliações são informações de acesso público, e o nome de usuário é trocado por um código na coleta. A contagem direta é observação agregada em espaço comercial aberto ao público, sem fotos nem interação com clientes. O tratamento segue a Lei nº 13.709/2018 (LGPD) e a Resolução do Conselho Nacional de Saúde (CNS) nº 510/2016 [AV], e a dispensa de submissão ao Comitê de Ética foi consultada com a orientação.

## 3.6 LIMITAÇÕES

O método mede bem os concorrentes estabelecidos e o movimento máximo da São Jogue, e mede mal a média da semana e a variação ao longo do ano. Cada limitação entra na faixa da premissa que ela afeta (Quadro 3.4).

**Quadro 3.4 – Limitações e tratamento**

| Limitação | Efeito | Tratamento |
|---|---|---|
| Autosseleção de quem avalia | Experiências extremas sobrerrepresentadas | Peso igual por concorrente |
| Recorte de três meses e corte de 100 avaliações | Sem sazonalidade; casas novas fora | Sazonalidade como premissa com faixa |
| Contagem em um só estabelecimento, em quatro noites de pico | Ocupação acima da média da semana | Contagem como limite superior; notas como piso |
| NFC-e só a pedido, um intervalo por unidade | Vendas subestimadas; sem variação do mês | Notas como limite inferior, em faixa |
| Falhas do script e erro de codificação | Registros perdidos; viés nos temas | Auditoria com IC 95%; recodificação cega |
| FipeZap por cidade e POF de 2017-2018 | Aluguel sem bairro; valores defasados | Faixa larga; correção pelo IPCA; cotação do ponto |

Fonte: elaborado pelo próprio autor.

**Referências citadas neste capítulo**

ASSOCIAÇÃO NACIONAL DE RESTAURANTES (ANR). *Panorama do consumo em restaurantes no Rio de Janeiro*: preferências por cozinha, dias da semana e momentos de refeição. São Paulo, 10 set. 2026a. Estudo do Mastercard Economics Institute em parceria com a ANR. Disponível em: https://anrbrasil.org.br/panorama-do-consumo-em-restaurantes-no-rio-de-janeiro-preferencias-por-cozinha-dias-da-semana-e-momentos-de-refeicao/. Acesso em: 2 nov. 2026.

ASSOCIAÇÃO NACIONAL DE RESTAURANTES (ANR). *Calor e chuva esfriam o apetite?* Estudo inédito da Mastercard Economics Institute em parceria com a ANR revela o impacto do clima sobre os gastos em restaurantes de São Paulo. São Paulo, 11 ago. 2026b. Disponível em: https://anrbrasil.org.br/calor-e-chuva-esfriam-o-apetite-estudo-inedito-da-mastercard-economics-institute-em-parceria-com-a-anr-revela-o-impacto-do-clima-sobre-os-gastos-em-restaurantes-de-sao-paulo/. Acesso em: 2 nov. 2026.

BANCO CENTRAL DO BRASIL (BCB). *Relatório Focus*: expectativas de mercado de 11 set. 2026. Brasília, 2026. Disponível em: https://www.bcb.gov.br/content/focus/focus/R20260911.pdf. Acesso em: 2 nov. 2026.

BANCO CENTRAL DO BRASIL (BCB). *Sistema Gerenciador de Séries Temporais (SGS)*: séries 432, 433, 1619 e 13522. Brasília, 2026. Disponível em: https://www3.bcb.gov.br/sgspub/. Acesso em: 14 out. 2026.

BARDIN, Laurence. *Análise de conteúdo*. Tradução de Luís Antero Reto e Augusto Pinheiro. Lisboa: Edições 70, 2002.

BRASIL. Conselho Nacional de Saúde. Resolução nº 510, de 7 de abril de 2016. Dispõe sobre as normas aplicáveis a pesquisas em Ciências Humanas e Sociais. *Diário Oficial da União*: seção 1, Brasília, DF, 24 maio 2016. Disponível em: https://www.gov.br/conselho-nacional-de-saude/pt-br/atos-normativos/resolucoes/2016/resolucao-no-510.pdf/view. Acesso em: 2 nov. 2026. [AV]

BRASIL. Lei nº 13.709, de 14 de agosto de 2018. Lei Geral de Proteção de Dados Pessoais (LGPD). *Diário Oficial da União*: seção 1, Brasília, DF, 15 ago. 2018. Disponível em: https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm. Acesso em: 2 nov. 2026. [AV]

COHEN, Jacob. A coefficient of agreement for nominal scales. *Educational and Psychological Measurement*, v. 20, n. 1, p. 37–46, 1960. [AV]

COMISSÃO NACIONAL DE CLASSIFICAÇÃO (CONCLA). *CNAE 2.3*: subclasse 5611-2/05. Rio de Janeiro: IBGE, 2026. Disponível em: https://concla.ibge.gov.br/busca-online-cnae.html. [AV: data de acesso]

FUNDAÇÃO INSTITUTO DE PESQUISAS ECONÔMICAS (FIPE). *Índice FipeZAP*: locação comercial, julho de 2026. São Paulo, 2026. Disponível em: https://downloads.fipe.org.br/indices/fipezap/fipezap-202607-comercial.pdf. Acesso em: 2 nov. 2026.

IBGE. *Censo Demográfico 2022*: população residente por idade. Rio de Janeiro: IBGE, 2023. Disponível em: https://sidra.ibge.gov.br/tabela/9514. Acesso em: 2 nov. 2026. `[AV ano]`

IBGE. *Estimativas da população residente*: 2026. Rio de Janeiro: IBGE, 2026. Disponível em: https://www.ibge.gov.br/estatisticas/sociais/populacao/9103-estimativas-de-populacao.html. Acesso em: 2 nov. 2026.

IBGE. *Pesquisa Anual de Serviços (PAS)*: tabelas 2611, 2619 e 10758. Rio de Janeiro: IBGE, 2025-2026. Disponível em: https://sidra.ibge.gov.br/tabela/2611, https://sidra.ibge.gov.br/tabela/2619 e https://sidra.ibge.gov.br/tabela/10758. Acesso em: 2 nov. 2026. `[AV ano de cada edição]`

IBGE. *Pesquisa de Orçamentos Familiares 2017-2018*: perfil das despesas no Brasil: indicadores selecionados de alimentação, transporte, lazer e inclusão financeira. Rio de Janeiro: IBGE, 2021. Disponível em: https://biblioteca.ibge.gov.br/visualizacao/livros/liv101844.pdf. Acesso em: 2 nov. 2026.

IBGE. *Pesquisa de Orçamentos Familiares 2017-2018*: tabelas 6715 e 6972. Rio de Janeiro: IBGE, 2019. Disponível em: https://sidra.ibge.gov.br/tabela/6715 e https://sidra.ibge.gov.br/tabela/6972. Acesso em: 2 nov. 2026.

IBGE. *Pesquisa Nacional por Amostra de Domicílios Contínua*: tabelas 5436 e 7395. Rio de Janeiro: IBGE, 2026. Disponível em: https://sidra.ibge.gov.br/tabela/5436 e https://sidra.ibge.gov.br/tabela/7395. Acesso em: 2 nov. 2026.

IBGE. *Regiões de influência das cidades 2018*. Rio de Janeiro: IBGE, 2020. Disponível em: https://biblioteca.ibge.gov.br/visualizacao/livros/liv101728.pdf. Acesso em: 2 nov. 2026.

IBGE. *Sistema Nacional de Índices de Preços ao Consumidor*: IPCA, tabela 7060. Rio de Janeiro: IBGE, 2026. Disponível em: https://sidra.ibge.gov.br/tabela/7060. Acesso em: 2 nov. 2026.

MATTAR, Fauze Najib. *Pesquisa de marketing*: metodologia, planejamento. v. 1. São Paulo: Atlas, [AV: edição e ano].

WILSON, Edwin B. Probable inference, the law of succession, and statistical inference. *Journal of the American Statistical Association*, v. 22, n. 158, p. 209–212, 1927. [AV]
