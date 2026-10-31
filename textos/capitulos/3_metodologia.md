# 3 METODOLOGIA

> **Rascunho (31/10/2026).** Escrito a partir de `_instrucoes/4_metodologia.md` (versão de 31/10). Números do B2 provisórios até a base do B1 ser corrigida e o `B2-b_avaliacoes.py` rodar de novo; resultados das auditorias e da recodificação cega ainda não existem e entram quando forem feitos. A seção 3.5 (registro prévio e testes de hipótese) é extra e não foi escrita: as seguintes sobem um número.

## 3.1 CARACTERIZAÇÃO DO TRABALHO

O trabalho é um plano de negócios baseado em evidências. Cada decisão do plano — abrir ou não, onde, com que formato, preço, acervo e investimento — liga-se a um dado, e cada dado a uma fonte e a um nível de confiança. O método é defendido pela confiabilidade do número gerado, não pela teoria que o cerca.

A pesquisa é aplicada, descritivo-exploratória e quantitativa, com análise de conteúdo das avaliações. O delineamento é transversal: os dados descrevem o mercado em outubro de 2026.

Três termos são usados sempre no mesmo sentido. **Luderia** é o estabelecimento que combina alimentos e bebidas com acervo de jogos de mesa para uso no local; abrange os formatos chamados ludobar e quiz-bar. **Concorrente** é a luderia aprovada na curadoria do Bloco B1. **Avaliação** é a avaliação com texto publicada no Google Maps. Os demais termos — taxa de ocupação, fluxo, permanência, giro, ticket médio e velocidade de avaliações — são definidos na primeira vez em que aparecem.

O trabalho não usa questionários de opinião ou de intenção de compra. O entrevistado declara o que faria, não o que faz. As premissas vêm de bases públicas, de rastros digitais dos concorrentes e da contagem direta de ocupação.

## 3.2 HIERARQUIA DE EVIDÊNCIAS

Cada premissa do plano recebe um nível de evidência, de N1 a N6 (Quadro 3.1). A escala ordena a confiabilidade da fonte do número: N1 é a mais confiável. Premissa sustentada por mais de uma fonte registra todos os níveis, como "N3 + N5".

**Quadro 3.1 – Níveis de evidência das premissas**

| Nível | Tipo de evidência | Exemplo no trabalho |
|---|---|---|
| N1 | Orçamento, cotação, contrato ou tabela oficial | Alíquotas do Simples Nacional |
| N2 | Dado público estruturado | IBGE, Novo CAGED, FipeZap, Banco Central |
| N3 | Benchmark de concorrentes medido pelo autor | Preços, horários e acervos do Bloco B1 |
| N4 | Referência setorial ou relatório | Margens típicas de bares e restaurantes |
| N5 | Coleta primária comportamental própria | Contagem direta de ocupação (Bloco B3) |
| N6 | Estimativa do autor | Ocupação em dia útil |

Fonte: elaboração própria, com base em _instrucoes/8_financeiro.md.

A escala tem uma regra de uso: nenhuma premissa crítica — uma das 3 a 5 premissas de maior impacto no VPL no tornado — fica só em N6. Quando não há alternativa, a premissa recebe faixa larga e destaque na análise de riscos (cap. 10).

Uma segunda hierarquia ordena o tipo de dado pela proximidade com o consumo: compra com dinheiro, registro transacional, observação direta, rastro digital e, por último, opinião declarada. No mesmo tipo, prevalece o dado absoluto, calibrado, local, recente e medido.

## 3.3 FONTES E INSTRUMENTOS DE COLETA

A coleta organiza-se em quatro blocos, em ordem de relevância para as decisões do plano (Quadro 3.2). Os Blocos B1 e B2 são censos da fonte: o script coleta todos os estabelecimentos e todas as avaliações do recorte. O Bloco B3 é a única coleta primária. O Bloco B4 reúne bases públicas extraídas por inteiro.

**Quadro 3.2 – Blocos de coleta**

| Bloco | Fonte | Recorte | Uso no plano |
|---|---|---|---|
| B1 — Concorrentes | Google Places API; Google Maps; site, Instagram, cardápio e lista de acervo de cada concorrente | Luderias com mais de 100 avaliações nas 14 metrópoles da REGIC 2018 (IBGE) e suas regiões metropolitanas: 54 concorrentes | Concorrência, preço, cardápio, ponto, acervo inicial, ticket médio |
| B2 — Avaliações recentes | Página pública de avaliações de cada concorrente no Google Maps | Todas as avaliações com rótulo de data até "3 meses atrás", inclusive, na data da coleta | Proposta de valor, reclamações, ticket médio, tamanho do grupo, jogos citados |
| B3 — Contagem direta | Observação nas duas unidades da São Jogue, com leitura da NFC-e | 4 visitas, sexta e sábado à noite, out/2026 | Taxa de ocupação, permanência, tamanho do grupo, fluxo, calibração |
| B4 — Bases públicas | IBGE, Novo CAGED, FipeZap, Simples Nacional, Banco Central, CONCLA | Salvador e demais capitais; séries de 2017 a 2026 | Público, aluguel, salários, tributos, taxa de desconto |

Fonte: elaboração própria.

### 3.3.1 Bloco B1 — Concorrentes

A busca pela Google Places API levantou 164 candidatos com mais de 100 avaliações nas 14 capitais classificadas como metrópole pela REGIC 2018 (IBGE) e em suas regiões metropolitanas. A curadoria manual aprovou 54 concorrentes. Cada concorrente pertence a uma única metrópole, pelo endereço. São Paulo reúne 19; Salvador tem 1, a São Jogue; Manaus não tem nenhum. A distribuição completa está no Apêndice E.

O corte de 100 avaliações delimita concorrentes estabelecidos. Casas novas ou pequenas ficam fora: o recorte descreve quem já opera com volume, que é a referência de preço e de fluxo para o plano.

De cada concorrente, são registrados a avaliação média, o volume de avaliações, o horário de funcionamento (Places API), a política de cobrança, o cardápio, o acervo de jogos e o entorno. Os cardápios têm categorias fixas — bebidas, entradas, pratos principais, sobremesas e couvert ou taxa de jogo — e preço em reais na data da coleta. Item com vários tamanhos ou combos entra nas medianas só pela linha de referência: cardápio mais recente, sem combo, no menor tamanho.

Os acervos vêm de qualquer concorrente que publique a lista de jogos, em plataformas como Acervo de Jogos e Ludopedia, no site ou em PDF. A cesta de jogos reúne os títulos presentes em 15 ou mais dos 30 acervos coletados. O preço de cada título é levantado em lojas online e expresso em faixa, do menor preço ao máximo, com a mediana como valor provável. A cesta sustenta o custo do acervo inicial (cap. 9).

O entorno é medido no Google Maps. São contados as estações de metrô, trem, VLT e BRT e os shoppings de porte num raio de 500 m e de 1.000 m de cada concorrente, e é medida a distância em linha reta até a estação e o shopping mais próximos. Shopping de porte é o que tem 1.000 avaliações ou mais no Maps; os limiares de 500 e 5.000 avaliações servem de sensibilidade.

### 3.3.2 Bloco B2 — Avaliações recentes

O recorte reúne todas as avaliações com texto cujo rótulo de data seja de até "3 meses atrás", inclusive, na data da coleta. O rótulo "3 meses atrás" cobre de 90 a 119 dias. O número de avaliações no recorte, dividido pela duração da janela, dá a **velocidade de avaliações**, em avaliações com texto por mês.

A coleta foi feita por script no navegador, em outubro de 2026, com cópia do texto, da nota, do rótulo de data e das notas por aspecto. O nome do autor da avaliação é trocado por um código na própria coleta. O script só conta uma avaliação como lida com o texto expandido; avaliação que ficou cortada é marcada, e o concorrente é coletado de novo. Nos 49 concorrentes da lista original, o recorte reuniu 2.218 avaliações, 1.440 delas com texto. Com as cinco luderias incluídas depois, a base de codificação tem 1.628 avaliações.

### 3.3.3 Bloco B3 — Contagem direta de ocupação

A contagem direta é a âncora absoluta do trabalho: mede pessoas, grupos, permanência e taxa de ocupação na São Jogue, única luderia de Salvador, nas unidades Bela Vista e Paralela.

Foram quatro visitas, duas por unidade, sempre na noite de sexta ou sábado: Bela Vista em 10/10 (sábado) e 16/10 (sexta); Paralela em 17/10 (sábado) e 30/10/2026 (sexta). Os dias medem o movimento máximo da semana. As visitas duraram de 2,5 a 3,3 horas, com 10,9 horas observadas no total, e as taxas são calculadas por hora observada.

O observador fica dentro do salão, sentado a uma mesa como cliente. A mesa do próprio observador não entra nos registros — nem o grupo, nem as pessoas, nem o comportamento — e sai do denominador da taxa de ocupação. Registram-se a entrada e a saída de cada grupo na porta e, em cada mesa, a hora em que o grupo senta e sai, o número de pessoas, as crianças, os jogos e as chamadas ao instrutor. Grupo que já estava no salão na chegada é estoque inicial; grupo ainda no salão ao fim da visita tem permanência censurada. As quatro visitas registraram 27 grupos de mesa, com 101 pessoas.

O instrumento é um aplicativo de observação para Android, desenvolvido para o trabalho. Ele grava cada registro na hora e exporta um arquivo CSV por conteúdo — visita, grupos de mesa, porta, contagens de mesas, estrutura da unidade e preços —, descrito no Apêndice G. Os originais são guardados sem edição; correções ficam numa lista à parte, com o motivo.

A **taxa de ocupação** é a proporção das mesas ocupadas, em média, no período observado. O cálculo é feito minuto a minuto, a partir dos intervalos de entrada e saída dos grupos de mesa. O denominador é o número de mesas da unidade, menos a do observador: 10 na Bela Vista e 9 na Paralela. A ocupação dos assentos segue a mesma lógica, sobre os 48 lugares por turno do site de reservas, menos as pessoas da mesa do observador.

A NFC-e de uma compra do autor no início e no fim de cada visita dá a série e o número da nota. A diferença entre as duas visitas da mesma unidade dá as notas emitidas no intervalo: 183 na Bela Vista, de 10/10 a 16/10 (6 dias), e 209 na Paralela, de 17/10 a 30/10/2026 (13 dias). As duas unidades só emitem a nota quando o cliente pede. As notas emitidas são, portanto, um piso das vendas.

Os pedidos de cada mesa — categoria, quantidade e hora de chegada — foram registrados em parte das visitas. Como não cobrem as quatro, entram só como descrição, sem sustentar premissa.

### 3.3.4 Bloco B4 — Bases públicas

As bases públicas dão o tamanho e a renda do público (Censo 2022, estimativas de população e PNAD Contínua), o aluguel (FipeZap), os salários (Novo CAGED), os tributos (Simples Nacional e CONCLA), as margens do setor (Pesquisa Anual de Serviços), o gasto das famílias (POF 2017-2018, corrigida pelo IPCA) e a taxa de desconto (Banco Central). Cada série guarda o recorte e a data de referência; a lista completa está no Apêndice H.

## 3.4 TRATAMENTO DOS DADOS

### 3.4.1 Pipeline

Os dados percorrem três etapas, cada uma com scripts próprios: coleta, tratamento e análise. Os brutos — textos integrais e listas com nomes de pessoas — ficam fora do repositório público. O trabalho e o repositório divulgam só dados processados. Todo sorteio usa semente fixa registrada no código, e qualquer número do texto pode ser gerado de novo a partir dos scripts.

### 3.4.2 Codificação das avaliações

As avaliações são codificadas por análise de conteúdo (BARDIN, 2011) `[AV]`. A unidade de registro é o tema: trecho que expressa um juízo sobre um atributo do concorrente. A unidade de contexto é a avaliação inteira, mais as notas por aspecto do Google quando o texto é ambíguo. A enumeração é por presença: tema citado duas vezes na mesma avaliação conta uma vez.

O dicionário de temas tem 22 temas, os mesmos para elogio e crítica: a coluna em que o tema entra dá a polaridade. Os temas cobrem jogos (variedade e curadoria do acervo, conservação, explicação dos jogos), equipe e serviço, comida e bebida, preço, ambiente e regras da casa. Cada tema tem definição, exemplos do que entra e do que não entra e regra para os casos de fronteira. Ocasião da visita, público e aluguel de jogos vão para uma coluna de contexto, sem polaridade. A codificação foi feita com apoio de inteligência artificial, pelo dicionário, e é validada contra a recodificação do autor (seção 3.4.3). Do texto saem ainda o tamanho do grupo, os valores em reais e os jogos citados.

### 3.4.3 Validação da coleta e da codificação

A validação estima o erro que sobra depois que o dado é obtido. A referência é o modelo de erro total da pesquisa, que separa o erro amostral do erro não amostral: cobertura, medida e processamento (GROVES et al., 2009; BIEMER, 2010) `[AV]`. A adaptação desse modelo a dados de plataformas digitais está em Amaya, Biemer e Kinyon (2020) `[AV]`. O procedimento muda com a natureza de cada bloco (Quadro 3.3).

**Quadro 3.3 – Validação por bloco**

| Bloco | Erro amostral | Erro a validar | Instrumento |
|---|---|---|---|
| B1 e B2 | Não há: censo da fonte | Fidelidade do script à página; completude; cobertura do Google Maps | Amostra de auditoria; contagem na página; buscas independentes e Instagram |
| B3 | Há: quatro noites representam a operação | Omissão de registro; erro de contagem | Fechamento do saldo; comparação entre porta, mesas e notas |
| B4 | Não há na extração | Processamento: código, filtro, unidade, deflação | Reconciliação com a tabela publicada; soma das linhas igual ao total |

Fonte: elaboração própria.

Nos Blocos B1 e B2, a amostra estima a taxa de erro do script. Cada coleta tem uma amostra de auditoria sorteada por script, com semente fixa: 20% dos concorrentes e do entorno, estratificados por capital e faixa de volume; 200 avaliações, 200 posts do Instagram, 200 itens de cardápio e 200 jogos, com mínimo de 3 por concorrente. Cada unidade sorteada é conferida na página. A taxa de erro de cada variável sai com intervalo de confiança de 95% pelo método de Wilson (1927) `[AV]`. A variável é aceita quando o limite superior do intervalo fica em 5% ou menos: com 200 conferências, isso admite até 3 erros. Variável reprovada tem o script corrigido e o estrato coletado de novo.

A amostra das avaliações inclui todos os concorrentes. A razão é o padrão das falhas: elas se concentram em certas páginas, e um concorrente fora da amostra esconderia a falha. Erro concentrado num grupo gera viés, e o tamanho da base não o dilui (MENG, 2018) `[AV]`. Por isso, a completude é conferida em todos os concorrentes: o número de avaliações com texto no recorte, contado na página, é comparado ao coletado.

A cobertura do Bloco B1 é checada por buscas manuais nas capitais e por uma bola de neve no Instagram: conta seguida por três ou mais concorrentes vira candidata e é classificada à mão. A sobreposição das duas listas estima a cobertura por captura e recaptura, como limite inferior.

A codificação das avaliações é validada por recodificação cega. O autor codifica de novo 139 avaliações sorteadas com estratificação, sem ver a primeira codificação. A concordância é medida pelo kappa de Cohen (COHEN, 1960) `[AV]`, por tema, com aceitação a partir de 0,70. Tema abaixo do critério tem a definição revista; se continuar abaixo, é reportado como exploratório e não sustenta premissa sozinho.

No Bloco B3 não há gravação para auditar depois. A validação usa a consistência do próprio registro: a contagem inicial mais as entradas e menos as saídas é comparada às contagens periódicas de mesas, e os grupos sem saída são separados entre censurados, ainda no salão, e omissões. As três estimativas de fluxo — pela porta, pelas mesas e pelas notas — são comparadas em cada visita. Dado não anotado é tratado como faltante, sem imputação.

## 3.5 TÉCNICAS DE ANÁLISE E CONTROLES

### 3.5.1 Análises por área do plano

No marketing, a análise de penalidade e recompensa — nota média com e sem crítica a cada tema, ponderada por concorrente — separa os atributos obrigatórios dos que diferenciam. Os cardápios são comparados por categoria e por metrópole.

No operacional, as reclamações são ordenadas pela frequência de cada tema negativo; o tamanho dos grupos e a permanência do Bloco B3 dimensionam as mesas.

No financeiro, cada premissa crítica tem técnica e limitação próprias. A taxa de ocupação de fim de semana vem da contagem direta. O ticket médio vem do consumo por pessoa — uma bebida e uma entrada ou prato, por metrópole, com o couvert somado só onde foi encontrado (cesta completa) —, calibrada pelos valores citados nas avaliações e pelos preços da São Jogue e checada contra a POF. A **permanência** — tempo entre a entrada e a saída de um grupo — sai das visitas; o **giro**, número de grupos que uma mesa recebe por dia, é o horário de funcionamento dividido pela permanência média.

### 3.5.2 Calibração do fluxo

O **fluxo** é o número de visitantes por semana. Na São Jogue, ele é estimado por dois caminhos independentes. O primeiro usa as notas fiscais: notas emitidas no intervalo entre as visitas, por dia, vezes sete, vezes as pessoas por nota observadas. Como a nota só sai a pedido, esse caminho dá o limite inferior. O segundo usa a contagem: pessoas por hora no movimento máximo vezes as horas de funcionamento do fim de semana, o que dá o limite superior. A divergência entre os dois define a faixa da premissa.

A calibração estende a medida aos demais concorrentes. A velocidade de avaliações da São Jogue, dividida pelo seu fluxo estimado, dá a razão entre avaliações e visitantes. A velocidade de avaliações de cada concorrente, dividida por essa razão, estima o seu fluxo, sempre em faixa. O resultado entra no registro de premissas com nível N5 + N3.

### 3.5.3 Controles estatísticos

As análises com avaliações dão peso igual a cada concorrente, para que os mais movimentados não dominem o resultado. Toda proporção ou média usada em premissa vem com intervalo de confiança. Os resultados são refeitos sem os cinco concorrentes de maior volume e sem os de menos de 10 avaliações no recorte.

## 3.6 MATRIZ DE EVIDÊNCIAS

A matriz liga cada decisão do plano à pergunta que ela responde, ao dado usado, à fonte e ao nível de evidência (Quadro 3.4). Toda premissa crítica do cap. 9 aparece nela.

**Quadro 3.4 – Matriz de evidências**

| Decisão | Pergunta | Dado usado | Fonte | Nível |
|---|---|---|---|---|
| Em que bairro abrir? | Onde está o público, longe da concorrência e com aluguel compatível? | População, idade e renda; localização da São Jogue; aluguel; entorno | Censo 2022; PNAD Contínua; B1; FipeZap | N2 + N3 |
| Qual modelo de cobrança? | Qual modelo o mercado pratica e qual gera menos reclamação de preço? | Política de cobrança; críticas a preço | B1 e B2 | N3 |
| Que cardápio oferecer? | Qual o peso da comida na nota e que itens e preços o mercado pratica? | Temas de comida × nota; cardápios | B1 e B2 | N3 |
| Qual ticket médio projetar? | Quanto uma pessoa gasta por visita? | Consumo por pessoa do cardápio; valores citados; NFC-e; POF | B1, B2, B3 e B4 | N3 + N5 + N2 |
| Qual taxa de ocupação projetar? | Quantas mesas um concorrente comparável ocupa? | Ocupação minuto a minuto; notas emitidas (piso); velocidade de avaliações calibrada | B2 e B3 | N5 + N3 |
| Qual giro projetar? | Quanto tempo uma mesa fica ocupada? | Permanência observada; modelos de cobrança | B1 e B3 | N5 |
| Quantas mesas e de que tamanho? | Quantas pessoas ocupam cada mesa? | Tamanho do grupo citado e observado | B2 e B3 | N3 + N5 |
| Qual acervo inicial? | Que jogos o público cita, quais os concorrentes têm e quanto custam? | Jogos citados; acervos; cesta de jogos | B1 e B2 | N3 |
| Qual regime tributário? | Qual a carga sobre a receita projetada? | Alíquotas | LC 123/2006; CONCLA | N1 |
| Qual taxa de desconto? | Qual o custo de oportunidade do capital? | Selic e IPCA projetados | Banco Central (Focus) | N2 |

Fonte: elaboração própria.

## 3.7 ASPECTOS ÉTICOS E LEGAIS

As avaliações são informações de acesso público. O nome de usuário, único dado que identificaria o autor, é trocado por um código aleatório na coleta, e nem nome nem link são guardados. Trechos citados são curtos e sem elemento identificador.

A contagem direta é observação agregada, feita dentro de espaço comercial aberto ao público, com o observador sentado como cliente. Não há fotos de pessoas, registro de características individuais nem interação com clientes. O número da NFC-e vem de nota emitida para compra do próprio autor.

O tratamento segue a Lei nº 13.709/2018 (Lei Geral de Proteção de Dados) e a Resolução CNS nº 510/2016, que trata das pesquisas em ciências humanas e sociais com dados de acesso público e informações agregadas `[AV]`. A dispensa de submissão ao Comitê de Ética foi consultada com a orientação.

## 3.8 LIMITAÇÕES

O método mede bem o que acontece nos concorrentes estabelecidos e no movimento máximo da São Jogue; mede mal a média da semana e a variação ao longo do ano. Cada limitação entra na faixa da premissa que ela afeta (Quadro 3.5).

**Quadro 3.5 – Limitações e tratamento**

| Limitação | Efeito | Tratamento |
|---|---|---|
| Autosseleção de quem avalia | Experiências extremas e usuários ativos ficam sobrerrepresentados | Peso igual por concorrente; declarada |
| Recorte de três meses de avaliações | Não mede sazonalidade; o rótulo do Google é arredondado | Data da coleta registrada; sazonalidade como premissa com faixa |
| Corte de 100 avaliações | Exclui casas novas ou pequenas | Total da busca apresentado ao lado do recorte |
| Contagem em um só estabelecimento, quatro noites de sexta e sábado | Ocupação do movimento máximo supera a média da semana; a razão de calibração pode não valer em outros locais | Contagem como limite superior; notas como piso; ocupação no tornado |
| NFC-e só a pedido do cliente | Notas emitidas são piso das vendas | Caminho das notas como limite inferior; retomada em 11.3 |
| Um único intervalo de notas por unidade (6 e 13 dias, abaixo dos 15 planejados) | Não capta a variação do mês nem a sazonalidade | Notas por dia em faixa; retomada em 11.3 |
| Observação dentro do salão | A mesa do observador ocupa um lugar; nem todas as mesas são vistas ao mesmo tempo | Mesa do observador fora do denominador; contagens periódicas |
| Permanência censurada pelo início e fim da visita | Subestima a permanência dos grupos longos | Censurados sinalizados e contados à parte |
| Falhas do script de coleta | Registros perdidos ou campos errados, concentrados em algumas páginas | Auditoria com taxa de erro e IC 95%; recoleta do estrato |
| Erro de codificação das avaliações | Viés nos temas | Recodificação cega com kappa; tema reprovado vira exploratório |
| FipeZap por cidade e POF de 2017-2018 | Aluguel sem distinção de bairro; valores defasados | Faixa larga; correção pelo IPCA; cotação do ponto antes de investir |

Fonte: elaboração própria.
