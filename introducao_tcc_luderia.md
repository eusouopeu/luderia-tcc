# INTRODUÇÃO

O mercado global de jogos de tabuleiro movimentou mais de R$ 53 bilhões em 2024, segundo levantamento da Agência de Notícias do Sebrae (SEBRAE, 2026). No Brasil, o segmento acompanha essa expansão: os jogos de tabuleiro e cartas passaram a representar 13,1% das vendas da indústria de brinquedos em 2025, ante 9,1% em 2017 (ABRINQ, 2026). A indústria brasileira de brinquedos faturou R$ 10,39 bilhões em 2025, e o segmento de jogos de tabuleiro cresceu 16% nesse período - taxa superior à média geral do setor (ABRINQ, 2026). Estimativas de mercado apontam o segmento brasileiro de jogos de tabuleiro na ordem de US$ 345 milhões em 2025, com projeção de dobrar de tamanho na próxima década (FAST COMPANY BRASIL, 2026).

Esse crescimento estrutural sustenta um modelo de negócio específico: o bar temático de jogos de tabuleiro, conhecido como ludobar, luderia ou quiz-bar. A Ludus Luderia, pioneira do segmento em São Paulo desde 2007, opera hoje com acervo superior a 2 mil jogos e consolidou o formato como ponto de encontro social alternativo ao lazer digital (DIVERSÓRIO, 2026). O modelo se difundiu para outras capitais brasileiras, com variações de posicionamento - do foco em jogos de tabuleiro ao quiz-bar, a exemplo de referências como São Jogue e Lord of the Quiz.

Esses estabelecimentos operam, porém, majoritariamente voltados ao público hobbyista: acervos extensos, com centenas a milhares de títulos, cobrança por acesso ilimitado ao catálogo e monitoria especializada para jogos de regras complexas. O Censo Ludopedia 2020, maior levantamento demográfico da comunidade de jogadores brasileiros (n = 4.166), evidencia essa concentração: apenas 3% dos respondentes têm menos de 18 anos, e a faixa de 19 a 40 anos concentra 84% da amostra (LUDOPEDIA, 2020). Esse perfil demográfico estreito indica um público já consolidado do hobby, mas não descreve a adesão do público casual - o consumidor que busca uma ocasião social pontual, sem envolvimento prévio com jogos de tabuleiro.

É nesse contexto que se insere a proposta deste trabalho: um estudo de viabilidade híbrido para um estabelecimento no formato ludobar/luderia/quiz-bar, posicionado para o público não-hobbyista. A proposta parte da lógica do Nintendo Wii, marco histórico de expansão de um mercado de nicho para o público casual por meio da eliminação da barreira de entrada, e não do aprofundamento do catálogo. Nesse modelo, o jogo funciona como decisão de baixo envolvimento, e a proposta de valor central é a curva de aprendizado mínima, a diversão rápida e garantida e a ocasião social - encontro, aniversário, evento corporativo - em sessões curtas, de 20 a 30 minutos.

## OBJETIVOS

Este trabalho tem como objetivo geral avaliar a viabilidade de uma luderia posicionado para o público casual, a partir da análise de dados de jogos físicos, de estabelecimentos similares e de avaliações de consumidores nas seis capitais brasileiras mais populosas: Salvador, São Paulo, Rio de Janeiro, Brasília, Fortaleza e Belo Horizonte.

Para atingir esse propósito, foram traçados os seguintes objetivos específicos: (i) mapear indicadores de engajamento, retenção e fidelização de jogos de cartas e de tabuleiro a partir de dados da Ludopedia e do BoardGameGeek; (ii) construir um índice de acessibilidade family/casual e identificar, por clusterização, perfis de jogos hobbyistas e perfis de jogos acessíveis; (iii) mapear e comparar estabelecimentos do formato ludobar/luderia/quiz-bar nas seis capitais quanto a avaliação, volume de avaliações, política de precificação e modelo de alimentação e bebidas; (iv) testar a associação entre o alinhamento do acervo de cada estabelecimento aos perfis de jogos identificados e a avaliação recebida; (v) analisar avaliações individuais de consumidores quanto a menções de preço e de fricção de complexidade ou intimidação, e sua associação com a nota atribuída; e (vi) aplicar a grade ERRC (Eliminar-Reduzir-Elevar-Criar) para delimitar o posicionamento estratégico do estabelecimento proposto, tanto na curadoria do acervo de jogos quanto no modelo de alimentação e bebidas.

## JUSTIFICATIVA

A relevância de um estudo de viabilidade sobre um ludobar posicionado para o público casual sustenta-se em três frentes complementares: a acadêmica, a social e a gerencial.

Do ponto de vista acadêmico, este trabalho preenche uma lacuna na literatura de estudos de viabilidade de negócios no setor de entretenimento social presencial. Os levantamentos disponíveis sobre o mercado brasileiro de jogos de tabuleiro concentram-se no varejo e na indústria editorial, sem tratar o nível do estabelecimento. Além disso, o desenho da pesquisa articula três blocos de dados de naturezas distintas - indicadores de jogos via API e scraping, perfil de estabelecimentos via dados públicos e avaliações individuais via análise multinível -, o que amplia o escopo metodológico da aplicação de testes de correlação, clusterização e regressão a um problema real de posicionamento de mercado.

Do ponto de vista social, o formato ludobar oferece um espaço de lazer social presencial, alternativo ao consumo de entretenimento mediado por telas. O posicionamento voltado ao público casual amplia esse benefício para além da comunidade já consolidada de jogadores: reduz a barreira de entrada representada pela cultura hobbyista - catálogos extensos, jogos de regras complexas, sessões longas - e abre o formato a ocasiões sociais cotidianas, como encontros entre amigos, aniversários e confraternizações corporativas.

Do ponto de vista gerencial, os resultados deste trabalho orientam decisões concretas de investimento: a curadoria do acervo de jogos, a política de precificação, o modelo de alimentação e bebidas e o posicionamento de marca voltado à atração do público casual e ao afastamento controlado do público hobbyista exigente. A aplicação da grade ERRC documenta um processo de delimitação estratégica replicável por empreendedores em fase de estruturação de negócios similares, minimizando o investimento inicial em cozinha própria e amplitude de catálogo sem comprometer a experiência do público-alvo.

## ESTRUTURA DO RELATÓRIO

O relatório organiza-se a partir de três blocos de dados, ordenados do maior para o menor N: o Bloco A, relativo aos jogos de tabuleiro (Ludopedia e BoardGameGeek); o Bloco B, relativo aos estabelecimentos nas seis capitais pesquisadas; e o Bloco C, relativo às avaliações individuais de consumidores, que articula os Blocos A e B por meio de análise multinível.

O capítulo de metodologia descreve as fontes de dados, os indicadores construídos para cada bloco e as técnicas de análise estatística empregadas - testes de correlação e associação, clusterização e regressão para o Bloco A; comparação entre capitais e testes de associação para o Bloco B; e modelagem multinível para o Bloco C. O capítulo de resultados apresenta os achados organizados pelos mesmos três blocos, com a identificação dos perfis de jogos por clusterização e o teste das hipóteses de associação entre acervo e avaliação.

Por fim, o capítulo de recomendações estratégicas aplica a grade ERRC para consolidar o posicionamento do estabelecimento proposto, cobrindo a curadoria do acervo, o modelo de alimentação e bebidas e a estratégia de comunicação voltada à atração do público casual.

---

**Referências citadas nesta introdução**

ABRINQ. *Anuário da Abrinq 2026*. Associação Brasileira dos Fabricantes de Brinquedos, 2026.

DIVERSÓRIO. Onde jogar board games em São Paulo? Conheça a Ludus Luderia com mais de 2 mil jogos. 2026.

FAST COMPANY BRASIL. Em breve, você estará jogando boardgames. 2026.

LUDOPEDIA. Censo Ludopedia 2020. Ludopedia, 2020.

SEBRAE. Jogos de tabuleiro movimentaram R$ 53 bilhões em 2024. Agência de Notícias do Sebrae, 2026.
