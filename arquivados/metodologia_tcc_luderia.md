# METODOLOGIA DESTA PESQUISA

Esta pesquisa possui caráter descritivo-exploratório, com abordagem quantitativa predominante e componente de análise de conteúdo complementar. O objetivo é avaliar a viabilidade de um estabelecimento no formato ludobar/luderia/quiz-bar posicionado para o público casual, a partir de dados sobre jogos de tabuleiro, estabelecimentos concorrentes e avaliações de consumidores. O delineamento é transversal: os dados de cada bloco foram coletados em uma janela concentrada de tempo, sem acompanhamento longitudinal.

A pesquisa combina exclusivamente fontes de dados secundários públicos, organizados em três blocos, ordenados do maior para o menor N: o Bloco A, relativo a jogos de tabuleiro (Ludopedia e BoardGameGeek); o Bloco B, relativo a estabelecimentos do formato ludobar/luderia/quiz-bar nas 27 capitais brasileiras; e o Bloco C, relativo a avaliações individuais de consumidores nesses estabelecimentos no Google Maps. Os três blocos se articulam: o Bloco A fundamenta a construção de perfis de sucesso de jogos, o Bloco B testa a associação desses perfis com o desempenho dos estabelecimentos, e o Bloco C aprofunda essa associação no nível do consumidor individual, via análise de conteúdo e agrupamento descritivo.

**Quadro 01 -** Blocos de dados, fontes e função na pesquisa

  ----------------- -------------------------- --------------- -------------------------
  **Bloco**         **Fonte**                  **N estimado**  **Função analítica**

  A - Jogos         Ludopedia (API OAuth +     Alto            Unidade quantitativa
                     scraping) e BoardGameGeek                 principal: engajamento,
                                                                retenção, desejo e
                                                                clusterização

  B - Estabelecimentos Google Places API,      70 a 90         Unidade estratégica:
                     redes sociais e sites                     desempenho comparado
                     próprios (27 capitais)                    entre estabelecimentos

  C - Avaliações     Google Places API         Até 5 por       Elo entre A e B: análise
                     (avaliações "mais         estabelecimento  de conteúdo e agrupamento
                     relevantes" por local)                     descritivo
  ----------------- -------------------------- --------------- -------------------------

Fonte: elaborado pelo próprio autor

## POPULAÇÃO E AMOSTRA

### Bloco A: jogos de tabuleiro

A população do Bloco A compreende os jogos registrados na Ludopedia com edição nacional. A amostra aplica dois critérios de corte: um limiar mínimo de 100 registros de posse (`qt_tem`), que garante estabilidade estatística aos indicadores derivados de razões entre contadores de usuário; e a restrição a jogos publicados a partir de 2010, período que corresponde à consolidação do mercado moderno de jogos de tabuleiro no Brasil. Jogos sem registro de mecânica ou sem nota média disponível são excluídos, por comprometerem o cálculo dos indicadores compostos.

### Bloco B: estabelecimentos

A população do Bloco B compreende os estabelecimentos no formato ludobar/luderia/quiz-bar identificados nas 27 capitais brasileiras. A identificação combina busca estruturada via Google Places API (cruzando termos de busca associados ao formato com cada capital) e um filtro de dois estágios sobre os candidatos retornados: (1) presença de termo-chave (ex.: "ludo", "tabuleiro", "board game", "quiz") no nome do estabelecimento ou no texto das avaliações públicas, e (2) categoria de negócio do Google Maps compatível com formato de alimentação e bebidas (bar, restaurante, café), que exclui lojas de brinquedos, brinquedotecas e estabelecimentos de varejo correlatos falsamente capturados pelo filtro de termo-chave. Os candidatos aprovados no filtro automatizado passam por curadoria manual de relevância antes de compor a base final. Dado o N estimado entre 70 e 90 estabelecimentos, a coleta adota enumeração completa da população identificada, sem amostragem: cada estabelecimento confirmado é incluído na base.

### Bloco C: avaliações individuais

A população do Bloco C compreende, nesta fase da pesquisa, as avaliações públicas em português retornadas pelo campo `reviews` da Google Places API (Place Details) para cada estabelecimento do Bloco B - até 5 avaliações por local, selecionadas pelo próprio Google como "mais relevantes" (não as mais recentes, nem a totalidade). Avaliações em outros idiomas, presentes em quase metade dos casos retornados pela API, são descartadas nesta fase: tanto o dicionário de análise de conteúdo quanto o filtro de classes gramaticais usados no Bloco C são específicos do português. Essa redução em relação ao desenho original (enumeração completa para estabelecimentos com menos de 100 avaliações, amostra das 100 mais recentes para os demais) é uma decisão metodológica explícita e temporária: como a maioria dos estabelecimentos identificados no Bloco B não acumula 100 avaliações, e a modelagem multinível originalmente prevista para o Bloco C perde poder estatístico com poucas observações de nível 1 por estabelecimento, a coleta completa por raspagem foi adiada para uma eventual expansão futura da pesquisa (ver Limitações Metodológicas e a nota ao final da seção de Técnicas de Análise).

## INSTRUMENTOS E PROCEDIMENTOS DE COLETA

A coleta do Bloco A combina dois instrumentos. O primeiro é a API OAuth da Ludopedia (`/api/v1/jogos/{id}`), que fornece as variáveis estruturadas de jogadores, duração, idade mínima, mecânicas, categorias, temas, ano de publicação e os contadores de usuário (`qt_tem`, `qt_teve`, `qt_favorito`, `qt_quer`, `qt_jogou`). O segundo é a raspagem das páginas públicas de cada jogo (`/jogo/*`), que complementa a API com nota média, quantidade de avaliações e quantidade de partidas registradas - variáveis não disponíveis via API. A conformidade da raspagem foi verificada no robots.txt da Ludopedia: bots de IA são bloqueados, mas a raspagem genérica é permitida, com intervalo mínimo de cinco segundos entre requisições, respeitado no procedimento de coleta. O BoardGameGeek complementa o Bloco A com a pontuação de complexidade (weight) da comunidade internacional, usada como variável secundária no Índice de Acessibilidade Family/Casual.

A coleta do Bloco B combina dois instrumentos. O primeiro é a Google Places API (New) - textSearch para a descoberta de candidatos por termo e capital, e Place Details para avaliação média, volume de avaliações, categoria de negócio, telefone, link do Google Maps e site/rede social declarado -, sobre a qual roda o filtro de dois estágios (termo-chave e categoria) descrito na seção de População e Amostra. O segundo é a observação manual direta de canais públicos - ficha do Google Maps, site institucional e redes sociais de cada estabelecimento aprovado no filtro -, na qual são registrados a política de precificação (couvert, cobrança por hora ou consumo mínimo), o modelo de alimentação e bebidas (cozinha própria, parceria com food truck ou operação somente-bar) e, quando disponível, o acervo de jogos declarado - variáveis que não constam de nenhuma API e exigem checagem individual.

A coleta do Bloco C reaproveita, nesta fase, o campo `reviews` já obtido na mesma chamada de Place Details usada no Bloco B, sem raspagem adicional - texto, nota, data relativa e idioma de até 5 avaliações por estabelecimento. Identificadores pessoais do autor não são coletados nem armazenados, em conformidade com a Lei Geral de Proteção de Dados. A raspagem das avaliações públicas do Google Maps, prevista no desenho original para ampliar essa base até 100 avaliações por estabelecimento, permanece como instrumento de coleta possível para uma expansão futura da pesquisa.

## MODELO DE ANÁLISE

O modelo de análise organiza as variáveis de cada bloco em indicadores compostos, descritos no Quadro 02.

**Quadro 02 -** Indicadores compostos por bloco

  ----------------- ------------------------------------------------------------
  **Bloco**         **Indicadores**

  A                 Índice de Engajamento; Taxa de Retenção (`qt_tem` /
                     (`qt_tem` + `qt_teve`)); Índice de Desejo (`qt_quer` /
                     `qt_tem`); Taxa de Fidelização (`qt_favorito` / `qt_tem`);
                     Diversidade Mecânica; Amplitude de Público; Índice de
                     Acessibilidade Family/Casual

  B                 Avaliação média; volume de avaliações; preços praticados;
                      modelo de alimentação e bebidas;

  C                 Análise de conteúdo; três agrupamentos descritivos: por
                     nota média do estabelecimento e por volume de
                     avaliações (maiores/menores/outliers via IQR), por
                     nota individual da avaliação (promotor/neutro/
                     detrator via NPS)
  ----------------- ------------------------------------------------------------

Fonte: elaborado pelo próprio autor

As variáveis binárias do Bloco C são derivadas por análise de conteúdo (BARDIN, 2011): um dicionário de termos-chave orienta a codificação inicial automatizada, seguida de validação manual em uma subamostra de 10% das avaliações codificadas, para checagem de consistência.

Dois dos três agrupamentos descritivos do Bloco C - por nota média do estabelecimento e por volume de avaliações, ambos do Bloco B - particionam sua variável de referência em três grupos pela regra do intervalo interquartil (IQR): outliers são os casos além de 1,5× o IQR acima do terceiro quartil ou abaixo do primeiro quartil; os casos restantes são divididos em "maiores" e "menores" pela mediana. O terceiro agrupamento, por nota individual da avaliação, não segue essa regra: a variável é discreta (1 a 5 estrelas) e fortemente concentrada em 5 estrelas na base coletada (primeiro e terceiro quartil coincidem em 5), o que zeraria o IQR e classificaria como "outlier" qualquer nota abaixo de 5. Usa-se corte fixo por estrelas, aproximando a lógica do Net Promoter Score (NPS): 5 estrelas = promotor; 4 estrelas = neutro; 1 a 3 estrelas = detrator. As três partições são independentes entre si.

## TÉCNICAS DE ANÁLISE

Foram utilizadas cinco técnicas de análise sobre os dados obtidos: correlação e regressão, comparação entre grupos, clusterização, agrupamento descritivo e análise de conteúdo.

### Correlação e regressão

A técnica de correlação e regressão testa as hipóteses do Bloco A relativas a variáveis contínuas, além da hipótese-ponte H7. H1 é testada por regressão linear múltipla, com `qt_jogou` como variável dependente e idade mínima e duração da partida como preditores, controlando pela Diversidade Mecânica. H3 é testada por correlação de Spearman entre Diversidade Mecânica e Taxa de Fidelização, dada a natureza ordinal da primeira variável. H4 é testada por regressão, com o Índice de Desejo como variável dependente e o tempo desde a publicação como preditor, para verificar o efeito de decaimento do hype.

H7, hipótese-ponte entre os Blocos A e B, é tratada de forma híbrida. Para os estabelecimentos com acervo identificável nos canais públicos, o escore de alinhamento (derivado do agrupamento hobbyista/acessível da Clusterização) é calculado e correlacionado com a avaliação média por correlação de Spearman. Para os estabelecimentos sem acervo identificável, a hipótese é tratada qualitativamente, por estudo de caso descritivo, dada a fragilidade metodológica de inferir estatisticamente a partir de dados incompletos.

### Comparação entre grupos

A técnica de comparação entre grupos testa H2, H5(B) e H6b. H2 compara a Taxa de Fidelização entre jogos de mecânica cooperativa e competitiva por ANCOVA, controlando pelas demais variáveis do modelo. H5(B) compara a avaliação média do Google Maps entre Salvador e as demais capitais por teste de Kruskal-Wallis, não paramétrico em razão do N reduzido do Bloco B. H6 e H6b aplicam o mesmo teste para comparar volume de avaliações e avaliação média entre categorias de política de precificação e de modelo de alimentação e bebidas.

### Clusterização

A técnica de clusterização opera em dois níveis. No nível do jogo, agrupa os títulos do Bloco A por Índice de Engajamento, Taxa de Retenção e Índice de Desejo, testando H5(A) e identificando perfis de sucesso sem depender da nota média. Em paralelo, o Índice de Acessibilidade Family/Casual gera um segundo agrupamento, que classifica os jogos entre o perfil hobbyista e o perfil acessível. Esse segundo agrupamento fundamenta o escore de alinhamento de acervo usado no Bloco B.

### Agrupamento descritivo

A técnica de agrupamento descritivo substitui, nesta fase da pesquisa, a modelagem multinível originalmente prevista para o Bloco C (ver nota ao final desta seção) e testa versões reformuladas de H8 e H9. As avaliações individuais são particionadas em três agrupamentos independentes pela regra do IQR descrita no Quadro 02: por nota média do estabelecimento, por nota individual da avaliação e por volume de avaliações do estabelecimento - cada um dividido em maiores, menores e outliers.

H8' compara, entre os grupos promotor/neutro/detrator do agrupamento por nota individual da avaliação, a proporção de avaliações que mencionam preço identificada pela análise de conteúdo, com a expectativa de que essa proporção seja maior entre os detratores que entre os promotores. A comparação é cruzada com o agrupamento por nota média do estabelecimento (maiores/menores/outliers via IQR), para verificar se o padrão se sustenta tanto em avaliações individuais discrepantes quanto em estabelecimentos consistentemente mal avaliados.

H9' compara, do mesmo modo, a proporção de menções a fricção de complexidade entre os grupos promotor/neutro/detrator, cruzada com o perfil de acervo do estabelecimento (hobbyista ou acessível, do Bloco B), para verificar se a fricção se concentra em estabelecimentos de perfil hobbyista mesmo fora do modelo multinível. Em ambos os casos, a comparação de proporções entre grupos usa teste exato de Fisher, mais adequado que o qui-quadrado dado o N pequeno esperado em cada célula.

**Nota sobre expansão futura:** o desenho original de H8 e H9 previa modelagem multinível, com avaliações individuais aninhadas em estabelecimentos - a nota da avaliação individual como variável dependente, a menção a preço (H8) ou a fricção de complexidade (H9) como preditor de nível 1, e a avaliação média do estabelecimento (H8) ou o perfil de acervo (H9) como preditor de nível 2. Essa técnica permanece a mais adequada para testar H8 e H9 tal como formuladas originalmente, e é reservada para uma eventual expansão da pesquisa em que o Bloco C seja ampliado por raspagem até a população completa de avaliações (ou a amostra de até 100 por estabelecimento prevista no desenho original), o que devolveria ao Bloco C o volume de observações de nível 1 necessário para a técnica.

### Análise de conteúdo

A análise de conteúdo (BARDIN, 2011) gera as variáveis binárias do Bloco C, descritas no Quadro 02, e complementa a interpretação dos agrupamentos descritivos com exemplos ilustrativos de avaliações representativas de cada padrão identificado.

## GARANTIAS ÉTICAS

A pesquisa utiliza exclusivamente dados secundários públicos, sem coleta direta com participantes humanos. A raspagem do Bloco A segue as diretrizes do robots.txt da Ludopedia, com respeito ao intervalo mínimo entre requisições. A coleta dos Blocos B e C limita-se a informações públicas de estabelecimentos e a avaliações públicas de consumidores, sem coleta de identificadores pessoais do autor da avaliação, em conformidade com a Lei nº 13.709/2018 (Lei Geral de Proteção de Dados). A necessidade de submissão ao Comitê de Ética em Pesquisa da UFBA via Plataforma Brasil foi verificada junto à orientadora: pesquisas baseadas exclusivamente em dados secundários públicos e anonimizados dispensam, em geral, esse trâmite, conforme os critérios da Resolução CNS nº 510/2016.

Por decisão metodológica explícita, a pesquisa não coleta nem infere dados individuais de idade dos usuários da Ludopedia ou dos autores de avaliações do Google Maps. Essa restrição decorre de uma limitação estrutural da fonte: não existe meio de acesso público a dados de adesão etária por jogo específico sem a raspagem de perfis e coleções individuais de usuários, procedimento que configuraria tratamento de dado pessoal fora do escopo autorizado por este desenho de pesquisa.

## LIMITAÇÕES METODOLÓGICAS

Sete limitações principais devem ser consideradas na interpretação dos resultados.

A redução do Bloco C a até 5 avaliações por estabelecimento, selecionadas pelo algoritmo do Google como "mais relevantes", introduz uma limitação adicional de representatividade: essas avaliações não são nem as mais recentes nem uma amostra aleatória, e o critério de relevância usado pelo Google não é público. Essa limitação, somada ao N pequeno por estabelecimento, restringe H8' e H9' a um caráter exploratório e descritivo, sem pretensão de generalização estatística - diferente do desenho original com modelagem multinível, que fica reservado para a expansão futura descrita na seção de Técnicas de Análise.

O corte transversal impede a identificação de variações temporais na adesão a jogos e no desempenho de estabelecimentos, e inviabiliza inferências causais (MALHOTRA, 2019).

A variável idade mínima, central para H1, possui confiabilidade reduzida: a própria administração da Ludopedia reconhece, em fórum público, que a classificação etária de jogos no Brasil é frequentemente elevada por exigência legal, e não reflete a jogabilidade real de cada título.

O N reduzido do Bloco B (70 a 90 estabelecimentos) restringe o poder estatístico dos testes de comparação entre grupos, o que motivou a adoção de técnicas não paramétricas ao longo de toda a análise desse bloco.

A hipótese-ponte H7 depende da identificação do acervo real de cada estabelecimento a partir de canais públicos, informação nem sempre disponível ou atualizada, o que fragmenta o teste em um componente estatístico e um componente qualitativo, com generalização limitada.

O Índice de Acessibilidade Family/Casual é um proxy construído a partir de variáveis do próprio jogo - idade mínima, duração, complexidade e tipo de mecânica -, sem validação direta contra dados reais de adesão etária, indisponíveis nas fontes utilizadas.

As avaliações do Google Maps estão sujeitas a viés de autosseleção: representam a parcela de consumidores motivada a avaliar publicamente, não a totalidade dos frequentadores de cada estabelecimento, o que pode superrepresentar experiências extremas - muito positivas ou muito negativas - em relação à experiência média.
