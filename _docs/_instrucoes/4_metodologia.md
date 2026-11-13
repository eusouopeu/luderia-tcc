# Cap. 3 — Metodologia

## Função no plano

Mais robusta que a de um plano de negócios comum. O método é defendido pela **confiabilidade do número que ele gera**, não pela teoria. Cada instrumento descrito aqui alimenta uma premissa (cap. 9) ou uma decisão (caps. 5 a 8). Instrumento que não alimenta nada sai.

Hipóteses H1–H9 do desenho anterior não entram no plano; o registro prévio de 2026 fica em `textos/_planejamento/_arquivo/registro_previo_luderia.md`, só para o extra. Resultados entram nos capítulos aplicados em linguagem de decisão; testes, estatísticas e valores-p vão para apêndice.

## Escopo adotado

Resumo das decisões de desenho tomadas pelo autor. Mudança de escopo exige atualizar esta seção e `textos/_planejamento/cronograma_luderia.md`.

- **Praça do plano:** Salvador (BA). A decisão de localização é o bairro e o ponto, não a cidade.
- **Sem questionários.** Dados secundários públicos e uma única coleta primária comportamental (contagem direta de ocupação, com leitura do número da NFC-e).
- **Estabelecimentos (Bloco B1):** concorrentes com **mais de 100 avaliações** no Google Maps nas **14 capitais classificadas como metrópole pela REGIC** (IBGE); **54 estabelecimentos** após a curadoria (164 candidatos; Machado Games e Ilusões Industriais excluídas por não serem luderias; Bardo Mago, La Tabuleria, TabuClub, Toca do Rato e Tubaleria incluídas em 14/10/2026).
- **Avaliações (Bloco B2):** **todas as avaliações com texto publicadas até "3 meses atrás"** (rótulo relativo do Google Maps na data da coleta), por estabelecimento, com texto integral. O número de avaliações varia entre estabelecimentos. Não há divisão da base: a etapa exploratória e a descritiva usam a população inteira de avaliações coletadas.
- **Modelo de alimentos e bebidas:** não é avaliado. Cozinha própria, parceria ou só bar deixa de ser variável do Bloco B1 e passa a premissa do autor no cap. 9.
- **Cardápios** de cada estabelecimento.
- **Contagem direta de ocupação** nas duas unidades da São Jogue (única luderia de Salvador), feita dentro do salão, com o app de observação: 4 visitas de cerca de 3 horas, 2 por unidade, só em sexta e sábado à noite, para medir o movimento máximo (orientação de 31/10/2026). Bela Vista em 10/10 (sábado) e 16/10 (sexta); Paralela em 17/10 (sábado) e 30/10 (sexta). O número da NFC-e lido nas duas visitas da mesma unidade dá as notas emitidas no intervalo, piso das vendas.
- **Bases públicas:** IBGE (Censo 2022 por setor censitário, estimativas populacionais, POF 2017–2018, PNAD Contínua, PAS, CONCLA), RAIS e Novo CAGED, FipeZap comercial, Lei Complementar 123/2006 e anexos do Simples Nacional, Banco Central (SGS e Focus).
- **Garantias de robustez (núcleo):** validação da coleta e da codificação; ponderação por estabelecimento; registro de premissas com faixas e nível de evidência; três cenários; tornado; ponto de ruptura.
- **Extra, só se sobrar tempo no fim:** testes de hipótese H1–H9 com registro prévio e correção para múltiplas comparações, na base inteira; se feitos, vão para apêndice. A simulação de Monte Carlo já está feita ([8_financeiro.md](8_financeiro.md) §4.4; Apêndice G do TMin). A banca de um plano de negócios avalia se a premissa se sustenta; os três cenários, o tornado e o ponto de ruptura já respondem sob quais condições o negócio é viável.

### Correspondência entre blocos e arquivos do pipeline

Cada coleta de `dados/` tem pasta própria em `_src/pyScripts/`, `B<n>_<Coleta>/` (ex.: `B1_Estabelecimentos`, `B4_Marketing`); em `dados/`, o bloco se divide em coletas, `B<n>_<coleta>/`, cada uma com `_dados-brutos/`, `_auditoria/` e `_dados-agregados/` (e um `_arquivo/` em cada, para as versões anteriores). Arquivos gerados e scripts levam o código do bloco: `Bn_<conteúdo>` nas saídas, `Bn-<letra>_<conteúdo>.py` nos scripts, guardados na subpasta da etapa (`1_collect/` → `c`, `2_build/` → `b`, `3_analise/` → `a`); cada coleta tem ainda `4_logs/` e `5_outros/`, e os webscripts do bloco ficam em `_src/webScripts/B<n>_<nome>/` (convenções em [`_src/dicionario.md`](../../_src/dicionario.md)). As tabelas do Bloco B4 seguem o padrão `[B4] {dado} {período} ({fonte}).csv`. Módulos auxiliares sem saída própria (`places_client.py`, `osm_client.py`, `recorte_rm.py`, `jogos_comum.py`, `instagram_comum.py`, `bases_comum.py`) não levam código e ficam em `5_outros/`. O que junta dados de mais de um bloco (planilhas DMax, gráficos, quadros e figuras dos capítulos) fica em `textos/planilhas/`, `textos/graficos/`, `textos/quadros/` e `textos/figuras/`. Saídas e scripts do desenho anterior e o Bloco B6, retirado, ficam fora do repositório, em `~/Documents/arquivados/`.

| Bloco | Conteúdo | Scripts | Coletas em `dados/` |
|---|---|---|---|
| B1 | Estabelecimentos e cardápios | `_src/pyScripts/` (`B1_Estabelecimentos/`, `B1_Entorno/`, `B1_Cardapios/`, `B1_Acervo_jogos/`, `B1_Redes_sociais/`) | `B1_estabelecimentos/`, `B1_entorno/`, `B1_cardapios/`, `B1_acervo_jogos/`, `B1_redes_sociais/` |
| B2 | Avaliações recentes | `_src/pyScripts/B2_Avaliacoes/` | `B2_avaliacoes/` |
| B3 | Contagem direta de ocupação | `_src/pyScripts/B3_Contagem/` | `B3_contagem/` |
| B4 | Bases públicas | `_src/pyScripts/` (`B4_Marketing/`, `B4_Operacional/`, `B4_Juridico/`, `B4_Financeiro/`, `B4_Multiuso/`, com o `bases_comum.py` em `B4_Multiuso/5_outros/`) | uma por uso: `B4_marketing/`, `B4_operacional/`, `B4_juridico/`, `B4_financeiro/`, `B4_multiuso/` |
| B5 | Ativos fixos | `_src/pyScripts/` (`B5_Aluguel/`, `B5_Reforma/`, `B5_Mobiliario/`) | três: `B5_aluguel/` (anúncios), `B5_reforma/` (obra e SINAPI) e `B5_mobiliario/` (mobiliário, cozinha e bar, equipamentos, jogos e o orçamento da etapa 1) |

## Divisão de subcapítulos

| Subcapítulo (TMin) | Conteúdo |
|---|---|
| **Abertura** | Plano de negócios baseado em evidências; pesquisa aplicada, descritivo-exploratória, quantitativa com análise de conteúdo; delineamento transversal; exclusão de questionários |
| **3.1 Hierarquia de evidências** | Escala N1–N6 ([8_financeiro.md](8_financeiro.md) §2) e hierarquia de tipos de dados ([1a_principios.md](1a_principios.md), P2) |
| **3.2 Fontes e instrumentos de coleta** | Blocos B1, B2, B3, B4 e B5 (3.2.1 a 3.2.4): o que mede, procedimento, recorte, período, limitação |
| **3.3 Tratamento dos dados** | Pipeline; pseudonimização; análise de conteúdo do B2 (grade de 22 temas) e sua validação; validação da coleta por bloco |
| **3.4 Técnicas de análise** | Técnicas por área do plano; circulação no pico e de dia útil; ticket; controles estatísticos |
| **3.5 Aspectos éticos e legais** | Base legal da coleta, pseudonimização, observação sem identificação, divulgação apenas de dados processados |
| **3.6 Limitações** | Limitações de cada bloco e reflexo nas faixas das premissas |

A matriz de evidências (decisão → pergunta → dado → fonte → confiança) vai para o Apêndice D. As seções abaixo seguem a ordem do TMin.

## 3.2 Fontes e instrumentos de coleta

### Bloco B1 — Estabelecimentos e cardápios

| Item | Descrição |
|---|---|
| Fonte | Google Places API; Google Maps (entorno); site, Instagram, cardápio digital e lista de acervo de cada estabelecimento |
| Recorte | Luderias, ludobares e quiz-bares com **mais de 100 avaliações** nas **14 capitais classificadas como metrópole** pela REGIC 2018 (IBGE) e em suas regiões metropolitanas; 164 candidatos antes da curadoria manual (`estabelecimentos/2_recorte/B1_curadoria_metro_f_av100.csv`); **54 estabelecimentos** no objeto. Cada estabelecimento é atribuído à metrópole pelo endereço |
| Variáveis | Avaliação média, volume de avaliações, política de preço, acervo declarado, horário de funcionamento (Places API, `regularOpeningHours`), entorno em 500 m e 1.000 m. O modelo de A&B não é registrado |
| **Entorno** | Só pelo Google Maps (o OpenStreetMap saiu do coletor e da análise em 30/10/2026): estações de metrô, trem e VLT (BRT e estações-tubo, que são ônibus, ficam fora desde 13/11/2026) e shoppings de porte em 500 m e 1.000 m, e distância da estação e do shopping mais próximos, até 1.000 m, em linha reta de pino a pino. Shopping de porte = 1.000 avaliações ou mais no Maps; contagens com 500 e 5.000 avaliações para sensibilidade (`maps_entorno.user.js`) |
| **Cardápios** | Itens oferecidos, preço por item, variedade por categoria e número de itens que exigem preparo (sem contar itens prontos, como balas, refrigerantes e água). Categorias fixas: **bebidas** (drinks, refrigerante, cerveja, não alcoólicas), **entradas** (batata, outras), **pratos principais** (hambúrguer, pizza, outros), **sobremesas**, **couvert ou taxa de jogo** |
| Registro | Data da coleta e link do cardápio; preços em R$ com duas casas decimais. Cardápios de prints, digitais e Takeat convertidos por regras de categoria; jogos à venda ficam fora. Item com preço por quantidade (chopp 1x, 2x, 3x) entra só com o preço de 1 unidade. Item com mais de uma linha (tamanho, combo ou print de outra data) fica todo na planilha, mas só a linha de referência (`linha_referencia` = S) entra na cesta e nas medianas: cardápio mais recente, sem combo, menor tamanho |
| **Acervos** | Lista de jogos de qualquer das 54 casas que publique uma (Acervo de Jogos, rejoy, Ludopedia, site, Canva ou PDF), com ou sem cardápio. **Cesta de jogos** = jogos presentes em 15 ou mais dos 30 acervos; preço em faixa entre lojas (menor, mediana, p75, máximo); índice por loja só com 10 ou mais jogos comparáveis; custo do acervo inicial estendido pelo preço médio por título (`B1a_cesta_jogos.py`) |
| Uso no plano | Concorrência (5.3), preço (6.3), cardápio (6.2), ponto (6.4), acervo inicial e investimento (7.2, 9.3), ticket médio (cap. 9) |
| Limitação | O corte de 100 avaliações exclui casas novas ou pequenas: o recorte descreve concorrentes estabelecidos. Cardápios desatualizados ou indisponíveis; preço de cardápio não informa quanto cada pessoa consome |

### Bloco B2 — Avaliações recentes

| Item | Descrição |
|---|---|
| Fonte | Página pública de avaliações de cada estabelecimento no Google Maps |
| Recorte | **Todas as avaliações com texto cujo rótulo de data seja de até "3 meses atrás"**, inclusive, na data da coleta. O rótulo "3 meses atrás" cobre de 90 a 119 dias; a janela vai, então, de 90 a 120 dias antes da coleta. O número de avaliações varia com o movimento de cada estabelecimento |
| Tamanho | 1.628 avaliações com texto na base final (retrato de 02/11/2026) |
| Procedimento | Cópia integral e automatizada do texto, da nota, da data relativa e do identificador do autor; pseudonimização do autor na própria coleta. Data e hora da coleta registradas por estabelecimento; coleta de todos os estabelecimentos no menor intervalo possível, para que as janelas de três meses coincidam |
| Variáveis derivadas | Temas da grade de 22, com polaridade (elogio e crítica); contexto da visita, exploratório; gasto por pessoa declarado no Google Maps (§3.3) |
| Uso no plano | Marketing (6.1 e 6.2), operacional (7.3), gasto por pessoa (R06, cap. 9) |
| Limitação | Autosseleção de quem avalia; o rótulo "3 meses atrás" é arredondado pelo Google e não tem limite exato; a janela de três meses cobre só parte do ano e não mede sazonalidade |

O recorte por período descreve a operação atual de cada concorrente. Como estabelecimentos movimentados contribuem com mais avaliações, as análises agregadas ponderam por estabelecimento.

### Bloco B3 — Contagem direta de ocupação

Única coleta primária do trabalho. Fornece a **âncora absoluta** de circulação (pessoas que entram por hora), tamanho de grupo, permanência e ocupação do salão, base da demanda (§3.4 e cap. 6.6). A leitura do número da NFC-e acrescenta um registro transacional (tipo 2 na hierarquia de dados) ao que é observado no salão.

| Item | Descrição |
|---|---|
| Local | As duas unidades da São Jogue, única luderia de Salvador: Bela Vista (`SJBV`, unidade `BV`) e Paralela (`SJPA`, unidade `PA`) |
| Visitas | 4 no total, 2 por unidade, só em **sexta e sábado à noite**, para medir o movimento máximo (orientação de 31/10/2026): Bela Vista em 10/10 (sábado) e 16/10 (sexta); Paralela em 17/10 (sábado) e 30/10 (sexta). Início entre 18h30 e 19h30. O desenho anterior (sábado 03/10 e domingo 18/10, retorno a 15 dias, horários sorteados por `B3b_contagem_sorteio.py`, semente 20260916) fica só como registro |
| Posição do observador | **Dentro do salão**, sentado a uma mesa como cliente. A mesa do próprio observador não entra nos registros: nem o grupo, nem as pessoas, nem o comportamento (3 pessoas na visita de 10/10 ao Bela Vista; 2 nas demais), e sai do denominador da ocupação |
| Duração da visita | Prevista de 3 horas; observada de 2,5 a 3,3 horas. Horário de início e de fim registrados; todas as taxas são calculadas por hora observada |
| Registro contínuo | Entrada e saída de cada grupo na porta (horário, pessoas, crianças), com código para ligar entrada e saída; e cada grupo de mesa: mesa, entrada, saída, permanência, pessoas, crianças, jogos e chamadas do instrutor. Grupo que já estava no salão na chegada é estoque inicial, e grupo ainda no salão no fim tem permanência censurada |
| Contagens periódicas | Mesas ocupadas e vazias a cada 30 minutos, a partir da contagem inicial |
| NFC-e | Série, número e emissão de uma nota no início e no fim de cada visita, lidos pelo QR ou transcritos da foto. A diferença entre as duas visitas da mesma unidade dá as notas emitidas no intervalo; a diferença dentro da visita, as notas emitidas durante a observação. A nota só é emitida a pedido do cliente: as notas emitidas são **piso** das vendas |
| Registro complementar | Estrutura da unidade (mesas, assentos, estantes, capacidade do acervo, instrutores, atendentes; `outros/B3_estrutura_unidades.csv`, com mesas informadas pelo autor e os 48 assentos do site de reservas), política de cobrança aplicada, preços da NFC-e e do cardápio na data, condições atípicas (evento, chuva, jogo de futebol), nível de som e medidas do ambiente |
| **Extra: pedidos** | Pedidos por mesa (categoria, quantidade, chegada e espera). Não foram coletados em todas as visitas: entram só como extra, descritivo, e não sustentam premissa. Hora do pedido da visita de 30/10 desconsiderada |
| Instrumento | **App de observação** (Android, `_src/outros/App_Observacao/`), no celular, com gravação automática, backup diário e exportação em CSV; sem fotos de pessoas; sem registro de características individuais |
| Saídas | Pessoas por hora; tamanho dos grupos; permanência média e mediana (com observações censuradas); ocupação das mesas e dos assentos, média e pico, minuto a minuto; pessoas por nota fiscal (entradas ÷ notas emitidas durante a visita); notas por dia no intervalo entre visitas; estimativa de visitantes por semana, em faixa |
| Uso no plano | Circulação no pico e seu piso pelas notas fiscais (6.6 e cap. 9); pessoas por mesa; capacidade (7.2) |
| Limitação | Quatro visitas em um único estabelecimento e uma única cidade, só em sexta e sábado à noite: a contagem não observa dias úteis nem horários de menor movimento, que entram pelo caminho das notas fiscais; NFC-e só a pedido do cliente (piso das vendas), podendo incluir delivery e balcão, e uma nota pode cobrir um grupo inteiro; um único intervalo entre visitas por unidade (Bela Vista, 10/10 a 16/10, 6 dias; Paralela, 17/10 a 30/10, 13 dias, abaixo dos 15 dias planejados); permanência censurada pelo início e fim da visita; a mesa do observador, fora do denominador, reduz o salão observado em uma mesa |

O formato dos CSV do app e as saídas do `B3a_contagem.py` estão em `textos/_planejamento/_instrumentos/protocolo_validacao_coleta.md` (§1).

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

Scripts em `_src/pyScripts/` (`B4c_*` → `B4b_*`); saídas `[B4] *.csv` em `dados/B4_<uso>/_dados-agregados/`; referências ABNT em `bibliografia/_referencias_bases_publicas.md`.

### Bloco B5 — Ativos fixos

Orçamento da etapa 1 (premissas I01 a I04 do cap. 9), item a item, na lista `dados/B5_mobiliario/_dados-agregados/[B5] Lista de Itens da Etapa 1 (elaboração própria).csv` (75 itens; `fonte_preco` sinapi, coleta ou gratuito).

- **SINAPI (reforma, N2):** composições da Bahia sem desoneração (`B5c_sinapi.py`), com o BDI de construção de edifícios do TCU (Acórdão 2.622/2013): 1º quartil no otimista, médio no provável, 3º quartil no pessimista.
- **Coleta em sites (mobiliário, cozinha e bar, informática, climatização; N3):** `_src/webScripts/B5_ativos_fixos/mobiliario.user.js` (Tampermonkey) na Amazon e no Mercado Livre, CEP de Salvador. Critério (decisão do autor, 03/11/2026): de cada busca, na ordenação padrão do site, entram os **5 primeiros anúncios que cumprem os requisitos técnicos mínimos** do item (medida ou capacidade, palavras exigidas e excluídas), pelo preço do produto, **sem frete, cor, estilo ou acabamento**. O coletor grava a `posicao` na busca e marca o item como coletado **por site**. O build (`B5b_orcamento_itens.py`) corrige kit lido como unidade, descarta anúncio patrocinado sem página de produto e preço fora de 0,4× a 2,5× a mediana do item, e fica com as 5 primeiras por site; item com menos de 3 ofertas fica sem preço. Cenários: P75, mediana e P25 das ofertas.
- **Gratuito (N6):** item sem custo por informação do autor (ex.: maquininha cedida a PJ pelos bancos).
- **Quantidade:** do autor (N6) até haver projeto do ponto; a I01 entra no modelo em R$ por m² (total ÷ área do C03).
- Saídas em `orcamento/`: orçamento por item, por premissa e as ofertas filtradas; o `gerar_modelo_financeiro.py` lê o orçamento por premissa mais recente.

## 3.3 Tratamento dos dados

### Pipeline

- Scripts em `_src/[bloco]/<objeto>/collect/`, `build/` e `analise/`, seguindo o padrão `Bnc_*` → `Bnb_*` → `Bna_*` ([dicionário](../../_src/dicionario.md)); saídas em `dados/B<n>_<coleta>/_dados-agregados/` com o prefixo do bloco.
- Dados brutos (textos integrais) ficam em `dados/B<n>_<coleta>/_dados-brutos/`, fora do repositório público. O TCC e o repositório divulgam **apenas dados processados**.
- Dicionário de dados com nome, descrição, tipo, unidade e origem de cada variável.
- Todo sorteio (amostras da recodificação cega e da auditoria da coleta) usa semente fixa registrada no código.

### Análise de conteúdo do Bloco B2

Concluída em 03/11/2026. A codificação é temática, comentário por comentário, na grade de 22 temas do Notion (`textos/_planejamento/_instrumentos/dicionario_temas_B2.md`), com apoio de IA, nas 1.628 avaliações: unidade de registro = tema; enumeração por presença; elogio e crítica na mesma grade; ocasião da visita e compra na loja numa coluna de contexto, sem polaridade (Bardin, 2002, p. 104–108). Base final: `_src/pyScripts/B2_Avaliacoes/2_build/B2b_comentarios_grade2.py`; tabelas e kappa: `../analise/B2a_temas_grade2.py`; Apêndice F do TMin.

**Validação:** recodificação cega do autor em 199 avaliações sorteadas com estratificação, em duas rodadas (139 antes da revisão da grade e 60 depois), com kappa de Cohen agrupado e critério de 0,70. Temas: 0,83 e 0,84 (aceitos). Contexto: 0,58 e 0,52 (exploratório). "Costuma ir": 0,52 (excluído). "Voltará": 0,75. Variável abaixo do critério é reportada como exploratória e não sustenta premissa sozinha.

### Validação da coleta

A validação da coleta estima o erro que sobra depois que o dado é obtido. A referência é o modelo de erro total da pesquisa (*total survey error*), que separa o erro amostral do erro não amostral: cobertura, medida e processamento. O TMin não cita o modelo: as obras de apoio (Groves et al., Biemer, Amaya et al.) saíram com a lista enxuta de 03/11/2026.

O procedimento muda conforme a natureza de cada bloco. Os Blocos B1 e B2 são censos da fonte. O Bloco B4 é extração integral de tabelas oficiais. O Bloco B3 é uma amostra de períodos observada pelo próprio autor.

**Quadro XX -** Validação da coleta por bloco

| Bloco | Natureza do dado | Erro amostral | Erro a validar | Instrumento de validação |
|---|---|---|---|---|
| B1 e B2 | Censo da fonte (Google Maps), extraído por script | Não há | Cobertura da fonte; fidelidade do script à página | Amostra de auditoria; checagem de cobertura; padrão das falhas |
| B4 | Extração integral de tabelas oficiais por API | Não há na extração; há no desenho de algumas bases (POF, PNAD Contínua) | Processamento: código, filtro, unidade, deflação, junção | Reconciliação com a tabela publicada; conferência de totais |
| B3 | Sexta e sábado à noite, escolhidos e observados pelo autor dentro do salão | Há: quatro visitas no pico representam a operação da unidade | Omissão de registro; erro de contagem | Fechamento do saldo; comparação entre caminhos independentes; dado faltante declarado |

Fonte: elaborado pelo próprio autor

O procedimento completo (etapas por bloco, amostra de auditoria do B2, checagens do B3 e critério de Wilson de 5%) está em `textos/_planejamento/_instrumentos/protocolo_validacao_coleta.md`, lido só em tarefa de coleta ou auditoria.

### Extra: registro prévio e testes de hipótese

Só se sobrar tempo depois de o plano estar completo, e então em apêndice: testes H1–H9 do registro prévio (`textos/_planejamento/_arquivo/registro_previo_luderia.md`), com correção de Benjamini-Hochberg e regressões com efeito fixo por estabelecimento. Não há divisão da base: se o extra for feito, os testes rodam na mesma base em que a grade foi construída, o que é declarado como limitação.

## 3.4 Técnicas de análise por área do plano

### Marketing

| Variável ou cruzamento | Pergunta | Técnica |
|---|---|---|
| Temas × nota | Quais atributos são obrigatórios e quais diferenciam? | Análise de penalidade e recompensa: nota média com e sem crítica a cada tema, com peso igual por concorrente (inclui comida e bebida) |
| Comparação de cardápios | Como os concorrentes diferem em preço, variedade e itens? | Estatística descritiva por categoria de item e por metrópole, com Salvador em destaque; análise qualitativa dos itens |

### Operacional

| Variável | Pergunta | Técnica |
|---|---|---|
| Principais reclamações | Quais falhas operacionais evitar e em que proporção aparecem? | Frequência absoluta e percentual por tema criticado, com intervalo de confiança; ranking total e por estabelecimento |
| Permanência e tamanho dos grupos (Bloco B3) | Quantas mesas de cada tamanho e qual capacidade? | Distribuição do tamanho dos grupos na entrada; permanência média com observações censuradas |

### Financeiro — premissas críticas

| Premissa | Evidência | Técnica | Limitação declarada |
|---|---|---|---|
| **Circulação no pico** | Contagem direta na São Jogue (Bloco B3) | Pessoas que entram por hora: provável na média das visitas, otimista na maior; pessimista pelas NFC-e emitidas entre as visitas (piso) | Um estabelecimento, quatro visitas, só sexta e sábado à noite; nota só a pedido do cliente |
| **Horas de pico equivalentes (R15 fim de semana, R05 dia útil)** | Índice "Horários de pico" do Google Maps dos concorrentes (Bloco B1) | Soma da curva média do índice das casas abertas nas horas do plano ÷ curva nas janelas das visitas; pessimista pela curva mediana (`B1a_horas_pico_indice.py`, 12/11/2026) | Índice relativo à hora mais cheia de cada casa; proporção entre índice e circulação suposta; casas de fora de Salvador |
| **Pessoas por mesa** | Tamanho do grupo observado (Bloco B3) | Distribuição por visita | Poucas observações |
| **Giro de mesa** | Permanência observada (Bloco B3) e política de cobrança (Bloco B1) | Permanência média; comparação descritiva dos modelos de cobrança | Permanência censurada pelo início e fim da visita |
| **Ticket médio** | Itens fixos do cardápio (bebidas, entradas, principal, sobremesa, couvert) | **Cesta de consumo** = bebida + entrada ou prato + taxa de entrada (ponderada pelos dias em que cada taxa vale), só nas casas com taxa conhecida (decisão de 02/11/2026); o gasto por pessoa declarado no Google Maps (B2) dessas casas é a premissa R06, e a parcela da taxa na cesta separa taxa e A&B; checada contra a POF | Gasto por pessoa é premissa com faixa (casa de menor e de maior gasto) |

### Modelo de demanda

Demanda = circulação no pico × horas de pico equivalentes, com a circulação de dia útil pela R05; sem mesas ocupadas nem giros na receita (decisão de 02/11/2026). A derivação fica no 6.6, e o cap. 9 só remete a ela; a conferência pela população de 20 a 39 anos também fica no 6.6.

Custos (aluguel, pessoal, tributos) e indicadores seguem [8_financeiro.md](8_financeiro.md): registro de premissas com faixas, triangulação, tornado e ponto de ruptura. O Monte Carlo está no Apêndice G.

### Controles estatísticos (valem para todas as análises)

- **Unidade de análise explícita:** avaliação, avaliador ou estabelecimento. Decisões sobre modelos de negócio usam o estabelecimento como unidade.
- **Ponderação igual por estabelecimento** nas estatísticas com avaliações, para que casas movimentadas não dominem o resultado.
- **Intervalo de confiança** junto de toda proporção ou média usada em premissa.
- **Só no extra (testes H1–H9):** efeito fixo por estabelecimento nas regressões; tamanho de efeito junto com o valor-p (diferença de médias, razão de chances, V de Cramér); correção de Benjamini-Hochberg para o conjunto de testes registrados.
- **Sensibilidade:** resultados com e sem os cinco estabelecimentos de maior volume, e com e sem os de menos de 10 avaliações com texto no recorte.
- Resultado não significativo também é reportado.

## Matriz de evidências (Apêndice D)

**Quadro D.1 -** Matriz de evidências

| Decisão | Pergunta | Dado usado | Fonte | Confiança |
|---|---|---|---|---|
| Em que bairro de Salvador abrir? | Onde está o público-alvo, longe da concorrência direta e com aluguel compatível? | População e faixa etária por bairro; renda; localização da São Jogue; aluguel; entorno | Censo 2022; PNAD Contínua; Bloco B1 (Google Maps); FipeZap | N2 + N3 |
| Qual modelo de cobrança? | Qual modelo o mercado pratica e qual gera menos reclamação de preço? | Política de preço; reclamações de preço | Blocos B1 e B2 | N3 |
| Que cardápio oferecer? | Qual o peso da comida na satisfação e que itens e preços o mercado pratica? | Críticas a comida e bebida × nota; cardápios | Blocos B1 e B2 | N3 |
| Qual ticket médio projetar? | Quanto uma pessoa gasta por visita? | Gasto por pessoa declarado no Google Maps; cesta de consumo do cardápio; preços observados; gasto familiar | Blocos B1, B2 e B3; POF | N3 + N5 + N2 |
| Qual demanda projetar? | Quantas pessoas por hora entram no pico, e quanto disso sobra no dia útil? | Contagem direta e notas fiscais entre visitas (piso); índice "Horários de pico" dos concorrentes | Blocos B1 e B3 | N5 + N3 |
| Qual giro projetar? | Quanto tempo uma mesa fica ocupada? | Permanência observada; modelos de cobrança | Blocos B1 e B3 | N5 |
| Quantas mesas e de que tamanho? | Quantas pessoas ocupam cada mesa? | Tamanho do grupo observado | Bloco B3 | N5 |
| Qual acervo inicial? | Quais jogos os concorrentes oferecem e quanto custam? | Acervos declarados (joelho da curva de presença); preço nas lojas | Bloco B1 | N3 |
| Qual regime tributário? | Qual a carga sobre a receita projetada? | Alíquotas | LC 123/2006; CONCLA | N1 |
| Qual taxa de desconto? | Qual o custo de oportunidade do capital? | Selic e IPCA projetados, mais prêmio de risco | Banco Central (Focus); Assaf Neto | N2 |

Fonte: elaborado pelo próprio autor

Regras: uma linha por decisão do plano; toda premissa crítica do cap. 9 aparece na matriz; a coluna de confiança usa a escala N1–N6. Premissas críticas só em N6 recebem faixa larga e destaque no cap. 10.

## 3.5 Aspectos éticos e legais

Registrar no texto a base legal da coleta:

1. As avaliações usadas são **informações de acesso público**.
2. O único dado potencialmente identificável (nome do usuário) é substituído por **código aleatório na coleta**; nome e link não são armazenados.
3. O conjunto das demais variáveis (nota, data relativa, texto processado) não permite identificar o usuário.
4. O TCC e o repositório divulgam **apenas dados processados**; textos integrais não são publicados. Trechos ilustrativos, se usados, são curtos e sem elemento identificador.
5. A contagem direta é **observação agregada, feita dentro de espaço comercial aberto ao público**, com o observador sentado como cliente: não há fotos de pessoas, registro de características individuais nem interação com clientes, e a mesa do próprio observador fica fora dos registros. O número da NFC-e vem de nota emitida para compra do próprio autor.

Citar a Lei nº 13.709/2018 (LGPD) e a Resolução CNS nº 510/2016. Registrar a consulta à orientadora sobre a dispensa de submissão ao Comitê de Ética.

## 3.6 Limitações

| Limitação | Efeito | Tratamento |
|---|---|---|
| Autosseleção de quem avalia | Superrepresenta experiências extremas e usuários ativos | Declarada; peso igual por estabelecimento; sem controle do grau de exigência de cada avaliador |
| Recorte de três meses de avaliações | Cobre só parte do ano e não mede sazonalidade; rótulo "3 meses atrás" sem limite exato | Declarada; data da coleta registrada; sazonalidade tratada como premissa com faixa |
| Corte de 100 avaliações no Bloco B1 | Exclui casas novas ou pequenas | Declarada; total da busca apresentado ao lado do total acima do corte |
| Datas relativas | Impossibilita dia da semana e dia do mês das avaliações | Fim de semana vem da contagem direta; dia útil, das notas fiscais |
| Visitas só em sexta e sábado à noite | Ocupação e pessoas por hora do movimento máximo superestimam a média da semana | O caminho das notas fiscais (dias inteiros entre as visitas) dá o piso; o caminho da contagem entra como limite superior da faixa |
| Contagem em um único estabelecimento e cidade, com quatro visitas | A circulação medida pode não valer para outro ponto; sem sazonalidade | Faixa larga; sensibilidade da ocupação no tornado; validação recomendada antes do investimento |
| Observação dentro do salão | A mesa do observador (2 ou 3 pessoas) ocupa um lugar e fica fora dos registros; o observador pode não ver todas as mesas ao mesmo tempo | Mesa e pessoas do observador tiradas do denominador da ocupação, por visita; contagens periódicas de mesas; comparação entre porta, mesas e notas fiscais |
| NFC-e só a pedido do cliente | Notas emitidas são piso das vendas; numeração pode incluir delivery e balcão; uma nota cobre um grupo | Caminho (a) lido como limite inferior; pessoas por nota medidas nas próprias visitas; série e unidade registradas. Volta em 11.3 |
| Um único intervalo entre visitas por unidade | Bela Vista com 6 dias e Paralela com 13, abaixo dos 15 planejados; não capta a variação do mês (pagamento de salários) nem a sazonalidade | Declarada; notas por dia em faixa. Volta em 11.3 |
| Permanência censurada pelo início e fim da visita | Subestima a permanência de grupos longos | Declarada; observações censuradas sinalizadas |
| Cobertura do Google Maps | Estabelecimentos fora da plataforma ou cortados pela busca não entram no censo da fonte | Checagem de cobertura com buscas manuais e Instagram; ausências registradas com o motivo |
| Falhas do script de coleta | Registros perdidos ou campos errados, possivelmente concentrados em um grupo | Amostra de auditoria com taxa de erro e IC 95%; comparação entre registros com falha e completos; recoleta do estrato afetado |
| Omissões na contagem direta | Entradas ou saídas não anotadas reduzem o fluxo e distorcem a permanência | Fechamento do saldo a cada 30 minutos; comparação com mesas e notas fiscais; taxa de omissão reportada, sem imputação |
| Erro de codificação dos temas | Viés nas variáveis de texto | Recodificação cega com kappa; contexto exploratório; "Costuma ir" excluída |
| Cardápios desatualizados | Preços defasados | Data da coleta registrada; correção pelo IPCA quando a data do cardápio for conhecida |
| FipeZap por cidade, não por bairro | Aluguel médio de Salvador não distingue bairros | Faixa larga; cotação de pontos (N1) recomendada antes do investimento |
| POF defasada (2017–2018) | Valores monetários antigos | Correção pelo IPCA; atualização da renda pela PNAD Contínua |

## Extensões fora do escopo atual

Entram no cap. 11 como validações recomendadas antes do investimento, ou são adotadas se houver prazo.

| Instrumento | O que resolve | Custo |
|---|---|---|
| Durações citadas nos textos ("ficamos 3 horas") | Segunda fonte para a permanência, além da contagem | Baixo: novo tema na grade |
| Contagem em um segundo estabelecimento de outra capital | Testa se a circulação no pico vale fora de Salvador | Médio |
| Teste da porta falsa com anúncio segmentado | Demanda de quem ainda não é cliente | Médio |

## Referências de apoio ao método

- BARDIN, Laurence. *Análise de conteúdo*. Lisboa: Edições 70, 2002. — codificação dos textos (p. 104–108).
- COHEN, Jacob. A coefficient of agreement for nominal scales. *Educational and Psychological Measurement*, 1960. — kappa. `[AV]`
- MATTAR, Fauze Najib. *Pesquisa de marketing*: metodologia, planejamento. v. 1. São Paulo: Atlas. `[AV: edição e ano]` — vieses de questionário.
- MENG, Xiao-Li. Statistical paradises and paradoxes in big data (I). *The Annals of Applied Statistics*, v. 12, n. 2, 2018. — viés de seleção em bases grandes. `[AV]`
- WILSON, Edwin B. Probable inference, the law of succession, and statistical inference. *Journal of the American Statistical Association*, v. 22, 1927. — intervalo da taxa de erro. `[AV]`
