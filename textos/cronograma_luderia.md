# CRONOGRAMA INDIVIDUAL - TCC LUDERIA

Atualizado em 18/09/2026.

## Estrutura e objetivos

O trabalho é um plano de negócios baseado em evidências. Ele segue a estrutura de um plano de negócios: análise de mercado, marketing, operação, aspectos jurídicos, finanças e riscos. A diferença está no método: cada decisão do plano é ligada a um dado, e cada dado a uma fonte e a um nível de confiança.

O negócio analisado é uma luderia, estabelecimento que combina comida, bebida e um acervo de jogos de tabuleiro. O plano mira o público casual: pessoas que usam o jogo como forma de socializar, e não como hobby.

**Objetivo geral:** avaliar se uma luderia voltada ao público casual é viável do ponto de vista de mercado, de operação e financeiro, com premissas sustentadas por dados públicos e por observação direta.

**Objetivos específicos:**

1. Analisar o mercado e a concorrência de luderias nas 27 capitais: avaliação dos clientes, preço, cardápio e modelo de comida e bebida.
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
- **P3:** o ritmo de novas avaliações no Google, calibrado pela contagem de ocupação, estima o fluxo de clientes dos concorrentes com margem de erro aceitável para a decisão.

As hipóteses foram registradas em 14/09/2026, antes da coleta das avaliações. Elas são testadas uma única vez, em uma parte da base separada para esse fim:

- **H1 - Atendimento:** reclamações sobre atendimento e sobre a explicação dos jogos reduzem mais a nota do cliente do que reclamações sobre comida e bebida.
- **H2 - Comida:** elogios à comida estão associados a notas mais altas, na comparação dentro de um mesmo estabelecimento.
- **H3 - Preço:** a proporção de reclamações de preço muda conforme a forma de cobrança (couvert, cobrança por hora ou consumação mínima).
- **H4 - Roteiro da saída:** nas luderias sem cozinha própria, é mais comum que o cliente avalie também um restaurante no mesmo dia.
- **H5 - Ticket:** o gasto por pessoa citado nas avaliações fica dentro da faixa calculada a partir dos cardápios da mesma capital.

A nota usada nas hipóteses é a nota centrada no avaliador: a nota dada à luderia menos a média das notas que a mesma pessoa dá a todos os lugares. Isso separa a experiência na luderia do grau de exigência de quem avalia.

## Variáveis e instrumentos de coleta

| Variável | Finalidade | Fonte dos dados | Instrumento de coleta |
|---|---|---|---|
| Avaliação média e número de avaliações | Medir a satisfação e o porte dos concorrentes | Google Maps | Google Places API |
| Forma de cobrança, modelo de comida e bebida e acervo de jogos | Comparar os formatos de negócio dos concorrentes | Site, Instagram e cardápio de cada estabelecimento | Registro manual em planilha |
| Pontos de fluxo no entorno (parques e praias, shoppings, estações de metrô) | Avaliar a localização dos concorrentes | OpenStreetMap | Contagem automática em raios de 500 m e 1.000 m |
| Itens e preços do cardápio | Definir o preço e estimar o ticket médio | Cardápio digital de cada estabelecimento | Registro manual em planilha |
| Nota e texto de cada avaliação | Identificar o que pesa na satisfação e as principais reclamações | Google Maps (30 a 50 avaliações mais recentes com texto por estabelecimento) | Cópia das avaliações e codificação por dicionário de termos validado |
| Tamanho do grupo e valores em R$ citados nas avaliações | Estimar pessoas por mesa e gasto por pessoa | Texto das avaliações | Codificação por dicionário de termos |
| Data das avaliações | Estimar o ritmo de novos clientes de cada concorrente | Google Maps | Cópia das avaliações |
| Histórico de avaliações de cada avaliador | Calcular a nota centrada e o perfil de consumo do público | Perfil público do avaliador no Google Maps, com o nome trocado por código | Cópia do histórico |
| Mesas ocupadas, pessoas presentes e tamanho dos grupos | Medir a taxa de ocupação e as pessoas por mesa | São Jogue, as duas unidades em Salvador | Formulário de observação, com contagem a cada 30 minutos em 4 visitas sorteadas |
| Chegada e saída dos grupos | Medir o tempo de permanência e o giro de mesas | São Jogue | Formulário de observação |
| População e renda por capital e bairro | Dimensionar o mercado e escolher a praça | IBGE (Censo 2022 e estimativas populacionais) | Download das bases públicas |
| Gasto das famílias com alimentação fora de casa | Conferir o ticket médio | IBGE (Pesquisa de Orçamentos Familiares) | Download das bases públicas |
| Salário de admissão por ocupação | Estimar o custo de pessoal | Novo CAGED (Ministério do Trabalho) | Download das bases públicas |
| Aluguel comercial por m² | Estimar o custo de ocupação do imóvel | FipeZap | Download das bases públicas |
| Alíquotas do Simples Nacional | Estimar os tributos | Lei Complementar nº 123/2006 | Consulta à legislação |
| Selic e IPCA projetados | Definir a taxa de desconto e a inflação do modelo financeiro | Banco Central (SGS e Boletim Focus) | Download das bases públicas |

## Situação em 17/09/2026

| Etapa | Situação |
|---|---|
| Introdução (cap. 1) | Rascunho concluído |
| Registro prévio das hipóteses | Concluído e datado em 14/09 |
| Bases públicas (IBGE, CAGED, FipeZap, Simples Nacional, Banco Central) | Coletadas e tratadas em 14/09 |
| Busca dos estabelecimentos concorrentes nas 27 capitais | Concluída: 737 candidatos nas capitais e em suas regiões metropolitanas |
| Seleção final dos estabelecimentos a analisar | Em andamento: falta definir o número mínimo de avaliações e confirmar quais são espaços de jogo |
| Avaliações, perfis dos avaliadores, cardápios e contagem de ocupação | Não iniciados |

## Etapas que definem o prazo

Cinco etapas condicionam o restante do cronograma:

1. **Perfis dos avaliadores.** É a coleta mais longa. Começa quando as primeiras avaliações estiverem copiadas e termina até 14/10.
2. **Validação da codificação das avaliações.** A mesma amostra de 200 avaliações é codificada duas vezes, com intervalo mínimo de 14 dias. A primeira codificação termina em 02/10; a segunda começa em 16/10.
3. **Emenda ao registro prévio.** Os ajustes feitos na parte exploratória da base são registrados até 23/10. Só depois disso a parte confirmatória é aberta.
4. **Contagem de ocupação na São Jogue.** São quatro visitas entre 29/09 e 28/10. A estimativa de ocupação depende delas.
5. **Registro de premissas.** O modelo financeiro só é montado quando ocupação, ticket médio e custos têm faixa e fonte.

## Contagem de ocupação na São Jogue

A contagem é a única coleta presencial do trabalho. Ela mede quantas mesas e pessoas ocupam a luderia em cada horário.

- **Quatro visitas no total**, duas em cada unidade da São Jogue.
- **Dois períodos**, definidos pelo pagamento dos servidores estaduais da Bahia (29/09 para inativos e pensionistas; 30/09 para ativos):
  - quinzena após o pagamento: 29/09 a 13/10;
  - quinzena antes do pagamento seguinte: 14/10 a 28/10.
- **Em cada quinzena**, uma visita em dia útil (segunda a quinta) e uma no fim de semana (sexta a domingo). Cada unidade recebe uma visita por quinzena e uma de cada tipo de dia.
- **Horário:** a São Jogue funciona das 12h00 às 22h00. Cada visita dura 3 horas, em um de três turnos (12h00-15h00, 15h30-18h30 ou 19h00-22h00), com uma contagem a cada 30 minutos.
- **Sorteio:** os dias e turnos são sorteados na planilha `contagem_sorteio_visitas.xlsx` antes da primeira visita. Feriados e dias sem funcionamento ficam de fora.

Fonte das datas de pagamento: Governo da Bahia, Tabela de Pagamentos 2026 dos servidores estaduais.

## Cronograma semanal

As semanas vão de sábado a sexta-feira. Assim, cada entrega definida pela orientação (18/09, 02/10, 16/10, 30/10 e 06/11) cai no último dia de uma semana. A versão final para a banca tem 16/11 como data de referência, e a defesa ocorre no final de novembro. Feriados nacionais no período: 12/10, 02/11 e 20/11.

| Semana | Período | Coleta e análise | Escrita | Entrega |
|---|---|---|---|---|
| 1 | 12/09 a 18/09 | Coleta e tratamento das bases públicas (14/09); busca e triagem dos estabelecimentos concorrentes; recorte pelas regiões metropolitanas das capitais; datas de pagamento dos servidores e planilha de sorteio da contagem | Registro prévio (14/09); leitura das cinco referências essenciais; cronograma | **18/09: cronograma** |
| 2 | 19/09 a 25/09 | Definição do número mínimo de avaliações por estabelecimento (teste em amostra); lista final de estabelecimentos; início da cópia das avaliações; início da coleta dos cardápios; sorteio das visitas e formulário de observação da contagem; manual de codificação das avaliações | Projeto: hipóteses, quadro de variáveis e modelo de análise; rascunho do cap. 2 | - |
| 3 | 26/09 a 02/10 | Conclusão da cópia das avaliações (27/09); início da coleta dos perfis dos avaliadores; divisão da base em parte exploratória e parte confirmatória (28/09); primeira codificação das 200 avaliações da amostra (até 02/10); conclusão dos cardápios (30/09); visitas da contagem, conforme sorteio (quinzena pós-pagamento a partir de 29/09) | Revisão final do projeto; rascunho do cap. 3 | **02/10: projeto consolidado** |
| 4 | 03/10 a 09/10 | Coleta dos perfis; visitas da contagem, conforme sorteio; estrutura do modelo financeiro (premissas, cálculos e cenários) | Rascunho do cap. 5 | - |
| 5 | 10/10 a 16/10 | Fim da quinzena pós-pagamento (13/10) e início da pré-pagamento (14/10); conclusão dos perfis (14/10); organização das bases e do dicionário de dados; segunda codificação das 200 avaliações (a partir de 16/10); primeira versão do registro de premissas | Rascunho do cap. 6 | **16/10: coleta em estágio avançado** |
| 6 | 17/10 a 23/10 | Concordância entre as duas codificações e revisão do dicionário; análises da parte exploratória; emenda ao registro prévio (até 23/10); modelo financeiro versão 1; visitas da contagem, conforme sorteio | Rascunhos dos caps. 7 e 8 | - |
| 7 | 24/10 a 30/10 | Última visita da contagem (até 28/10); estimativa de ocupação e fluxo, em faixa; análise da parte confirmatória (rodada única); estatísticas descritivas; viabilidade nos três cenários; análise de sensibilidade e pontos de ruptura | Caps. 5, 6 e 9 completos; rascunho do cap. 10 | **30/10: primeira versão dos resultados** |
| 8 | 31/10 a 06/11 | Ajustes finais no modelo financeiro; tabelas e figuras; simulação de Monte Carlo (opcional) | Cap. 10 completo; caps. 4 e 11; revisão da introdução; apêndices; referências | **06/11: versão completa** |
| 9 | 07/11 a 13/11 | Atualização do site de apresentação | Ajustes pedidos pela orientação; revisão de estilo e das normas ABNT; conferência das referências pendentes | - |
| 10 | 14/11 a 20/11 | - | Preparação da apresentação | **16/11: versão final para a banca** |
| 11 | 21/11 a 27/11 | - | Ensaios da apresentação | **Defesa (data a definir)** |

## Capítulos

| Capítulo | Rascunho | Versão completa |
|---|---|---|
| 1 Introdução | Concluído | 06/11 (revisão) |
| 2 Referencial teórico | 25/09 | 06/11 |
| 3 Metodologia | 02/10 | 06/11 |
| 4 Sumário executivo | 06/11 | 06/11 |
| 5 Análise de mercado | 09/10 | 30/10 |
| 6 Plano de marketing | 16/10 | 30/10 |
| 7 Plano operacional | 23/10 | 06/11 |
| 8 Aspectos jurídicos | 23/10 | 06/11 |
| 9 Plano financeiro | 23/10 | 30/10 |
| 10 Riscos | 30/10 | 06/11 |
| 11 Considerações finais | 06/11 | 06/11 |
| Referências e apêndices | Contínuo | 06/11 |

## Plano de corte em caso de atraso

Se uma entrega atrasar mais de três dias, os itens abaixo saem do escopo, nesta ordem. Os itens cortados entram nas considerações finais como próximos passos.

1. Simulação de Monte Carlo. A análise de sensibilidade e os pontos de ruptura permanecem.
2. Comparação de avaliadores em comum entre luderias.
3. Base de jogos (Ludopedia e BoardGameGeek).
4. Atualização do site de apresentação. As figuras do texto permanecem.
5. Perfis dos avaliadores reduzidos a uma amostra de 20 avaliadores por estabelecimento.
6. Contagem de ocupação reduzida a duas visitas, uma por quinzena, ambas no fim de semana.

**Não entram no plano de corte:** registro prévio, validação da codificação e registro de premissas. Custam pouco e sustentam a confiabilidade dos resultados.
