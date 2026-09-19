# CRONOGRAMA INDIVIDUAL - TCC LUDERIA

Atualizado em 18/09/2026.

## Estrutura e objetivos

O trabalho é um plano de negócios baseado em evidências. Ele segue a estrutura de um plano de negócios: análise de mercado, marketing, operação, aspectos jurídicos, finanças e riscos. A diferença está no método: cada decisão do plano é ligada a um dado, e cada dado a uma fonte e a um nível de confiança.

O negócio analisado é uma luderia em Salvador, estabelecimento que combina comida, bebida e um acervo de jogos de tabuleiro. O plano mira o público casual: pessoas que usam o jogo como forma de socializar, e não como hobby. As luderias das 14 metrópoles brasileiras servem de referência de preço, satisfação e movimento.

**Objetivo geral:** avaliar se uma luderia em Salvador voltada ao público casual é viável do ponto de vista de mercado, de operação e financeiro, com premissas sustentadas por dados públicos e por observação direta.

**Objetivos específicos:**

1. Analisar o mercado e a concorrência de luderias nas 14 metrópoles brasileiras, com destaque para Salvador: avaliação dos clientes, preço e cardápio.
2. Caracterizar o comportamento de consumo do público das luderias.
3. Definir o posicionamento e o composto de marketing a partir dos aspectos que mais pesam na satisfação dos clientes.
4. Estimar a demanda, a taxa de ocupação e o giro de mesas.
5. Dimensionar a estrutura operacional e os requisitos jurídicos do negócio.
6. Projetar investimentos, receitas, custos e indicadores de viabilidade.
7. Identificar as premissas que mais afetam o resultado e os valores a partir dos quais o negócio deixa de ser viável.
8. Propor um plano de contingência e as validações necessárias antes do investimento.

## Pressupostos e hipóteses

Os pressupostos orientam o desenho da pesquisa e são verificados ao longo da análise:

- **P1:** o público das luderias é majoritariamente casual. Quem tem o jogo como hobby tende a montar acervo e espaço de jogo em casa.
- **P2:** a taxa de ocupação e o ticket médio concentram a maior parte da incerteza sobre o resultado financeiro.
- **P3:** o ritmo de novas avaliações no Google, calibrado pela contagem de ocupação e pelas notas fiscais, estima o fluxo de clientes dos concorrentes com margem de erro aceitável para a decisão.

As hipóteses foram registradas em 14/09/2026 e ajustadas em 18/09/2026 (emenda 2), antes da coleta das avaliações. Elas são testadas uma única vez, em uma parte da base separada para esse fim. Os códigos seguem o registro prévio:

- **H1 - Atendimento:** reclamações sobre o atendimento e o ambiente reduzem mais a nota do cliente do que reclamações sobre comida e bebida.
- **H3 - Preço:** a proporção de reclamações de preço muda conforme a forma de cobrança (couvert, cobrança por hora ou consumação mínima).
- **H5 - Ticket:** o gasto por pessoa citado nas avaliações fica dentro da faixa calculada a partir dos cardápios do mesmo estabelecimento.

As notas são comparadas dentro de cada estabelecimento. Assim, a diferença de nível entre as luderias não interfere no teste.

## Variáveis e instrumentos de coleta

| Variável | Finalidade | Fonte dos dados | Instrumento de coleta |
|---|---|---|---|
| Avaliação média e número de avaliações | Medir a satisfação e o porte dos concorrentes | Google Maps | Google Places API |
| Forma de cobrança e acervo de jogos | Comparar os formatos de negócio dos concorrentes | Site, Instagram e cardápio de cada estabelecimento | Registro manual em planilha |
| Pontos de fluxo no entorno (parques e praias, shoppings e estações de metrô) | Avaliar a localização dos concorrentes | OpenStreetMap | Contagem automática em raios de 500 m e 1.000 m |
| Preços do cardápio | Definir o preço e estimar o ticket médio | Cardápio digital de cada estabelecimento | Registro manual em planilha |
| Número de itens do cardápio que precisam de preparo (sem contar itens prontos, como balas, refrigerantes e água) | Medir a complexidade da cozinha dos concorrentes | Cardápio digital de cada estabelecimento | Registro manual em planilha |
| Nota e texto de cada avaliação | Identificar o que pesa na satisfação e as principais reclamações | Google Maps (todas as avaliações com texto publicadas até "um mês atrás") | Cópia das avaliações e codificação por dicionário de termos validado |
| Tamanho do grupo e valores em R$ citados nas avaliações | Estimar pessoas por mesa e gasto por pessoa | Texto das avaliações | Codificação por dicionário de termos |
| Data das avaliações | Estimar o ritmo de novos clientes de cada concorrente | Google Maps | Cópia das avaliações, com registro da data da coleta |
| Entrada e saída dos grupos e tamanho de cada grupo | Medir o fluxo de pessoas, as pessoas por mesa e o tempo de permanência | São Jogue, as duas unidades em Salvador | Formulário de observação, do lado de fora, em 4 visitas (2 sorteadas e 2 de retorno) |
| Pessoas no interior e mesas ocupadas | Medir a ocupação em cada horário | São Jogue | Formulário de observação, com contagem a cada 30 minutos |
| Número da nota fiscal (NFC-e) no início e no fim de cada visita | Medir as vendas entre a visita sorteada e a de retorno e as pessoas por nota | São Jogue | Registro da nota emitida em compra própria |
| População e renda de Salvador, por bairro quando disponível | Dimensionar o mercado e escolher o bairro | IBGE (Censo 2022, estimativas populacionais e PNAD Contínua) | Download das bases públicas |
| Gasto das famílias com alimentação fora de casa | Conferir o ticket médio | IBGE (Pesquisa de Orçamentos Familiares) | Download das bases públicas |
| Salário de admissão por ocupação em Salvador | Estimar o custo de pessoal | Novo CAGED (Ministério do Trabalho) | Download das bases públicas |
| Aluguel comercial por m² em Salvador | Estimar o custo de ocupação do imóvel | FipeZap | Download das bases públicas |
| Alíquotas do Simples Nacional | Estimar os tributos | Lei Complementar nº 123/2006 | Consulta à legislação |
| Selic e IPCA projetados | Definir a taxa de desconto e a inflação do modelo financeiro | Banco Central (SGS e Boletim Focus) | Download das bases públicas |

## Situação em 18/09/2026

| Etapa | Situação |
|---|---|
| Introdução (cap. 1) | Rascunho concluído |
| Registro prévio das hipóteses | Concluído em 14/09; emenda 2 em 18/09 |
| Bases públicas (IBGE, CAGED, FipeZap, Simples Nacional, Banco Central) | Coletadas e tratadas em 14/09 |
| Busca dos estabelecimentos concorrentes | Concluída: 737 candidatos nas capitais e em suas regiões metropolitanas |
| Seleção final dos estabelecimentos a analisar | Em andamento: recorte de 164 candidatos com mais de 100 avaliações nas 14 metrópoles; falta a curadoria manual (100 a 150 esperados) |
| Avaliações, cardápios e contagem de ocupação | Não iniciados |

## Etapas que definem o prazo

Cinco etapas condicionam o restante do cronograma:

1. **Coleta das avaliações do último mês.** Todos os estabelecimentos são coletados no menor intervalo possível, para que a janela de um mês seja a mesma para todos. Termina até 27/09.
2. **Validação da codificação das avaliações.** A mesma amostra de 200 avaliações é codificada duas vezes, com intervalo mínimo de 14 dias. A primeira codificação termina em 02/10; a segunda começa em 16/10.
3. **Emenda ao registro prévio.** Os ajustes feitos na parte exploratória da base são registrados até 23/10. Só depois disso a parte confirmatória é aberta.
4. **Contagem de ocupação na São Jogue.** Visitas sorteadas entre 29/09 e 13/10; visitas de retorno até 28/10. A estimativa de ocupação depende delas.
5. **Registro de premissas.** O modelo financeiro só é montado quando ocupação, ticket médio e custos têm faixa e fonte.

## Contagem de ocupação na São Jogue

A contagem é a única coleta presencial do trabalho. Ela mede quantas pessoas entram na luderia, quanto tempo ficam e quantas notas fiscais são emitidas.

- **Quatro visitas no total**, duas em cada unidade da São Jogue: uma sorteada e uma de retorno.
- **Visitas sorteadas** na quinzena após o pagamento dos servidores estaduais da Bahia (29/09 a 13/10; o pagamento começa em 29/09 para inativos e pensionistas e em 30/09 para ativos). Uma visita cai em dia útil (segunda a quinta) e a outra no fim de semana (sexta a domingo). Um sorteio define qual unidade fica com o dia útil.
- **Visitas de retorno** 15 dias depois de cada visita sorteada, na mesma unidade. Caem na quinzena anterior ao pagamento seguinte (14/10 a 28/10). Como 15 dias não fecham semanas inteiras, o retorno cai no dia da semana seguinte ao da visita sorteada.
- **Nota fiscal:** em cada visita, o número da NFC-e é registrado no início e no fim, com uma compra própria. A diferença entre a visita sorteada e a de retorno dá as notas emitidas em 15 dias. A diferença dentro da mesma visita, comparada às entradas contadas, dá as pessoas por nota.
- **Observação do lado de fora**, sem duração fixa. O início e o fim de cada visita são registrados, e os resultados são calculados por hora observada. Entradas e saídas dos grupos são registradas continuamente; pessoas no interior e mesas ocupadas, a cada 30 minutos.
- **Sorteio:** feito na planilha `contagem_sorteio_visitas.xlsx` antes da primeira visita. Feriados e dias sem funcionamento ficam de fora.

Fonte das datas de pagamento: Governo da Bahia, Tabela de Pagamentos 2026 dos servidores estaduais.

## Cronograma semanal

As semanas vão de sábado a sexta-feira. A versão final para a banca tem 16/11 como data de referência, e a defesa ocorre no final de novembro. Feriados nacionais no período: 12/10, 02/11 e 20/11.

| Semana | Período | Coleta e análise | Escrita | Entrega |
|---|---|---|---|---|
| 1 | 12/09 a 18/09 | Busca de trabalhos acadêmicos com temas e recortes similares; definição das variáveis de interesse; coleta das bases públicas (IBGE, CAGED, FipeZap, Simples Nacional, Banco Central) em 14/09; busca dos estabelecimentos nas capitais pelo Google Maps e definição dos critérios de filtragem; recorte dos estabelecimentos com mais de 100 avaliações nas 14 metrópoles | Registro prévio (14/09) e emenda 2 (18/09); cronograma | **18/09: cronograma** |
| 2 | 19/09 a 25/09 | Curadoria manual e lista final de estabelecimentos; teste da coleta das avaliações do último mês em uma amostra; início da coleta das avaliações com texto; elaboração do manual de codificação das avaliações; início da coleta dos cardápios (preços e itens com preparo); sorteio das visitas e formulário de observação da contagem | Projeto: hipóteses, quadro de variáveis e modelo de análise; rascunho do cap. 2 (Referencial teórico) | - |
| 3 | 26/09 a 02/10 | Conclusão da coleta das avaliações (27/09); divisão da base em parte exploratória e parte confirmatória (28/09); primeira codificação das 200 avaliações da amostra (até 02/10); conclusão dos cardápios (30/09); visitas sorteadas, conforme sorteio (a partir de 29/09) | Revisão final do projeto; rascunho do cap. 3 (Metodologia) | **02/10: projeto consolidado** |
| 4 | 03/10 a 09/10 | Visitas sorteadas, conforme sorteio (até 13/10); busca de dados secundários sobre o setor de bares, lanchonetes e espaços de jogos; estatística descritiva dos concorrentes (preço, cardápio e avaliação por metrópole); cotações em Salvador (ponto, mobiliário e acervo); estrutura do modelo financeiro (premissas, cálculos e cenários) | Cap. 5: seções 5.1 (setor), 5.4 (fornecedores) e 5.5 (PESTEL) e esboço das cinco forças; rascunho do cap. 8 (Aspectos jurídicos) | - |
| 5 | 10/10 a 16/10 | Fim das visitas sorteadas (13/10) e início das visitas de retorno (a partir de 14/10); organização das bases e do dicionário de dados; segunda codificação das 200 avaliações (a partir de 16/10); primeira versão do registro de premissas | Cap. 5: seção 5.3 (concorrência); cap. 6: rascunho das seções 6.3 (preço) e 6.4 (bairro e ponto em Salvador) | **16/10: coleta em estágio avançado** |
| 6 | 17/10 a 23/10 | Visitas de retorno, conforme sorteio; concordância entre as duas codificações e revisão do dicionário; análises da parte exploratória; emenda ao registro prévio (até 23/10); modelo financeiro versão 1 | Rascunho do cap. 7 (Plano operacional); esboço do cap. 9 (Plano financeiro) | - |
| 7 | 24/10 a 30/10 | Última visita de retorno (até 28/10); estimativa de ocupação e fluxo, em faixa, pelas notas fiscais e pela contagem; análise da parte confirmatória (rodada única); estatísticas descritivas das avaliações; viabilidade nos três cenários; análise de sensibilidade e pontos de ruptura | Cap. 5: seção 5.2 (público-alvo), depois do fim da análise das avaliações; cap. 6: seções 6.1, 6.2 e 6.6; cap. 9 completo; rascunho do cap. 10 (Análise de riscos) | **30/10: primeira versão dos resultados** |
| 8 | 31/10 a 06/11 | Ajustes finais no modelo financeiro; tabelas e figuras; simulação de Monte Carlo (opcional) | Caps. 5, 6 e 10 completos; caps. 4 (Sumário executivo) e 11 (Considerações finais); revisão da introdução; apêndices; referências | **06/11: versão completa** |
| 9 | 07/11 a 13/11 | Atualização do site de apresentação | Ajustes pedidos pela orientação; revisão de estilo e das normas ABNT; conferência das referências pendentes; roteiro e slides da apresentação | - |
| 10 | 14/11 a 20/11 | - | Preparação da apresentação | **16/11: versão final para a banca** |
| 11 | 21/11 a 27/11 | - | Ensaios da apresentação | **Defesa (data a definir)** |

## Capítulos

| Capítulo | Rascunho | Versão completa |
|---|---|---|
| 1 Introdução | Concluído | 06/11 (revisão) |
| 2 Referencial teórico | 25/09 | 06/11 |
| 3 Metodologia | 02/10 | 06/11 |
| 4 Sumário executivo | 06/11 | 06/11 |
| 5 Análise de mercado | 09/10 (5.1, 5.4, 5.5); 16/10 (5.3); 30/10 (5.2) | 06/11 |
| 6 Plano de marketing | 16/10 (6.3, 6.4); 30/10 (6.1, 6.2, 6.5, 6.6) | 06/11 |
| 7 Plano operacional | 23/10 | 06/11 |
| 8 Aspectos jurídicos | 09/10 | 06/11 |
| 9 Plano financeiro | 23/10 | 30/10 |
| 10 Riscos | 30/10 | 06/11 |
| 11 Considerações finais | 06/11 | 06/11 |
| Referências e apêndices | Contínuo | 06/11 |

## Plano de corte em caso de atraso

Se uma entrega atrasar mais de três dias, os itens abaixo saem do escopo, nesta ordem. Os itens cortados entram nas considerações finais como próximos passos.

1. Simulação de Monte Carlo. A análise de sensibilidade e os pontos de ruptura permanecem.
2. Base de jogos (Ludopedia e BoardGameGeek).
3. Atualização do site de apresentação. As figuras do texto permanecem.
4. Contagem de ocupação reduzida a uma unidade (visita sorteada e visita de retorno).

**Não entram no plano de corte:** registro prévio, validação da codificação e registro de premissas. Custam pouco e sustentam a confiabilidade dos resultados.
