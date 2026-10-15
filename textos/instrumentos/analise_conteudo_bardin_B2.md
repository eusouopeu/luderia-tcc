# Análise de conteúdo das avaliações das luderias (Bloco B2)

Versão parcial de 10/10/2026. Corpus: base do Notion "B - Comentários (manual)" na mesma data. A análise segue o modelo de análise de conteúdo de Bardin (2011) `[AV]` e tem caráter exploratório: identifica e define as categorias. A medição de intensidade dos achados fica para a etapa lexical/categórica posterior.

Arquivos:

- codificação comentário a comentário: `dados/[B2] Avaliacoes recentes/analise_conteudo/B2_codificacao_bardin.csv`;
- contagens, tipologia e amostra de controle: `_src/[B2] Avaliacoes recentes/Google Places (Comentários)/analise/B2-a_conteudo_bardin.py`;
- saídas do script: `B2_bardin_*.csv`, na mesma pasta da codificação.

## 0. Corpus e situação dos dados

| Item | Valor |
|---|---|
| Comentários na base do Notion | 589 |
| Excluídos: duplicatas (Machado Games repete os 13 comentários da Flow Games) | 13 |
| Excluídos: fora do tema (Bravo Jogos, comentário sobre revisão de veículo) | 1 |
| **Comentários analisados** | **575** |
| Estabelecimentos com comentário analisado | 48 |
| Casas de jogos / lojas com espaço de jogo | 390 / 185 comentários |
| Lote "planilha" (coleta até "um mês atrás", importada em 09/10/2026) | 328 comentários, 33 estabelecimentos |
| Lote "formulário" (coleta até "3 meses atrás", em 09-10/10/2026) | 247 comentários, 15 estabelecimentos |

Pendências que afetam a análise:

1. **Janelas diferentes.** O lote da planilha seguiu o recorte da metodologia (§3.4: até "um mês atrás"). O lote do formulário foi até "3 meses atrás". Todos os 33 estabelecimentos da planilha param no rótulo "1 mês" (RED jogos para em "5 dias"). Faltam, portanto, os comentários de "2 meses" e "3 meses" de todos eles, e não só dos que tiveram o limite de 30 comentários.
2. **Limite de 30 comentários.** Shelf Bar e Jogos (30), Bodogami (34) e Castelos (40) foram cortados pelo número de comentários antes de chegar ao fim da janela de um mês: Bodogami para em "2 semanas". Shelf não tem data relativa registrada; Bodogami (8 primeiros) e Ludus (10 primeiros) também não.
3. **Duplicata Flow Games × Machado Games.** Os textos citam São Paulo, Pokémon e os atendentes Gustavo e Arch, o que aponta para a Flow Games (São Paulo). Os comentários reais da Machado Games (Vitória) não foram coletados.
4. **Aprovados sem comentário.** Dungeon Games Store e Paladino Hobbies estão entre os 51 aprovados e não têm registro na base.
5. **Retirados da triagem em 10/10/2026.** Bolsa do Infinito, Polar Jogos e PlayGround Game Store passaram a reprovados (Instagram confirma loja de TCG). Nenhum dos três tinha comentário na base. Com isso, Salvador fica com um único concorrente aprovado: a São Jogue (Bela Vista), com 4 comentários.

## 1. Método

### 1.1 Enquadramento

A análise de conteúdo é organizada em três polos cronológicos: pré-análise, exploração do material e tratamento dos resultados com inferência e interpretação (Bardin, 2011 `[AV]`). A versão aplicada é categorial e temática: o texto é recortado em temas, cada tema é classificado numa categoria e a categoria é enumerada por presença.

A análise responde a uma pergunta do plano: quais atributos da experiência numa luderia o cliente comenta, em que direção e com que peso, para orientar as decisões de formato, A&B, acervo, equipe, preço e capacidade.

### 1.2 Pré-análise

**Constituição do corpus.** O corpus é o universo dos comentários com texto coletados no Bloco B2 para os estabelecimentos aprovados na triagem do Bloco B1. Não há amostragem. As regras de Bardin foram aplicadas assim:

| Regra | Aplicação |
|---|---|
| Exaustividade | Todos os comentários da base entram; a exclusão é feita por critério escrito (duplicata ou tema fora do objeto) e registrada na coluna `situacao` |
| Representatividade | Não se aplica: o corpus é o universo coletado. O viés de autosseleção do avaliador é tratado como limitação (§1.9) |
| Homogeneidade | Mesma fonte (Google Maps), mesmo gênero (avaliação pública), mesmo objeto (estabelecimento com jogos de mesa). A diferença de janela entre lotes é registrada como variável `lote` |
| Pertinência | Só entram comentários sobre a experiência no estabelecimento ou sobre a compra nele |

**Leitura flutuante.** O corpus inteiro foi lido uma vez, sem codificar, em ordem de estabelecimento. Nessa leitura foram anotados os temas recorrentes e os casos de fronteira.

**Formulação das categorias.** A grade é mista. Uma parte é dedutiva e vem das variáveis previstas na metodologia (§3.4): acervo, explicação dos jogos, atendimento, comida, preço, ambiente, barulho. Outra parte emergiu da leitura flutuante: capacidade e fila, programação, comunidade, varejo, segurança e inclusão, retorno declarado e os códigos de contexto.

### 1.3 Exploração do material

| Elemento | Definição adotada |
|---|---|
| Unidade de registro | Tema: trecho que expressa um juízo ou um fato sobre um atributo da experiência |
| Unidade de contexto | O comentário inteiro. A polaridade de um tema é lida no comentário, não na frase isolada |
| Regra de enumeração | Presença ou ausência por comentário. Um tema citado três vezes no mesmo comentário conta uma vez |
| Polaridade | `+` positiva, `-` negativa, `±` mista (elogio e crítica ao mesmo atributo), `~` neutra ou mediana ("comida honesta, nada demais") |
| Exclusividade | Cada trecho entra numa única categoria. Um comentário pode ter várias categorias |
| Atribuição ao grupo | Cada comentário pertence ao estabelecimento selecionado no Notion; cada estabelecimento pertence a um único tipo (§1.6) |

Procedimento de codificação, na ordem em que foi executado:

1. Extração da base por consulta SQL ao Notion, ordenada por estabelecimento, data de envio e número do comentário. O texto usado é o campo `Texto`; quando vazio, o `Comentário original`.
2. Identificação de cada comentário pelos 6 últimos caracteres do id da página do Notion (`id_notion`). O id é estável e permite voltar ao texto sem copiá-lo para o repositório.
3. Leitura de cada comentário e marcação dos temas pelo livro de códigos (§1.4), com a polaridade de cada um.
4. Aplicação das regras de decisão (§1.5) nos casos de fronteira.
5. Registro de uma linha por comentário no CSV de codificação: `id_notion;sigla;nota;codigos;situacao`.
6. Validação automática pelo script: todo código precisa existir no livro de códigos; toda sigla precisa ter estabelecimento e tipo.

### 1.4 Livro de códigos

Categorias com polaridade:

| Código | Categoria | Inclui | Não inclui |
|---|---|---|---|
| ACV | Acervo de jogos | Variedade, quantidade, novidades, estado de conservação, peças faltando, consoles e fliperamas nos bares de videogame | Explicação dos jogos (MED); venda de jogos (VAR) |
| MED | Mediação lúdica | Monitor explica regras, recomenda jogo pelo perfil do grupo, ajuda na primeira rodada; ou monitor ausente, que não sabe a regra, que ensina errado | Cordialidade do monitor sem menção a jogo (ATD) |
| ATD | Atendimento e hospitalidade | Cordialidade, atenção, recepção, rispidez, descaso, funcionário elogiado, gestão do conflito | Demora ou erro de pedido (TMP); regra de mesa ou fila (CAP) |
| AB | Alimentos e bebidas | Sabor, qualidade, variedade do cardápio, opções vegetarianas e veganas, rodízio | Preço da comida (PRC); demora (TMP) |
| TMP | Tempo de serviço e erros de pedido | Demora da comida, pedido esquecido, comanda trocada, rapidez | Espera para entrar (CAP) |
| PRC | Preço e valor percebido | Couvert lúdico, entrada, taxa de serviço, preço da comida, custo-benefício, preço de produto na loja | Qualidade da comida em si (AB) |
| AMB | Ambiente físico e conforto | Aconchego, decoração, tema, limpeza, banheiro, climatização, cadeiras, espaço apertado, cheiro | Ruído (RUI) |
| RUI | Ruído | Barulho do salão, gritaria, possibilidade de conversar | - |
| CAP | Capacidade, reserva e fila | Lotação, fila de espera, reserva não registrada, regra de ocupação de mesas, pressa para liberar a mesa, horário de fechamento, casa vazia | Segurança na fila (INC, codificado junto) |
| PRG | Programação e atrações | Trívia, quiz, karaokê, sinuca, escape room, palco, torneios, eventos, pré-lançamentos | - |
| COMU | Comunidade de jogadores | Jogadores frequentes, acolhimento ou exclusão de novatos, fazer amizade, ambiente "sem intolerância" | Atendimento da equipe (ATD) |
| VAR | Varejo e pós-venda | Compra no balcão ou online, entrega, embalagem, troca de cartas, aluguel de jogos | Preço do produto (PRC) |
| LOC | Localização e acesso | Metrô, estacionamento, flanelinha, rampa | Fila na rua (CAP e INC) |
| INC | Segurança, inclusão e respeito | Segurança de mulheres, fila na rua perigosa, discriminação, acessibilidade, cliente tratado como suspeito | Grosseria comum (ATD) |
| RET | Retorno declarado | "Voltarei", "frequento toda semana", "não volto nunca mais" | Recomendação genérica |
| GEN | Avaliação genérica | Comentário sem atributo identificável ("Muito bom", "Amei", "Não gostei") | - |

Códigos de contexto, sem polaridade:

| Código | Definição |
|---|---|
| OCA:ami / OCA:fam / OCA:casal / OCA:aniv | Ocasião ou companhia citada: amigos; família ou crianças; casal ou encontro; aniversário ou comemoração |
| NOV | Sinal de público iniciante ou não jogador: "não conheço muito de jogos", "para quem nunca jogou", "voltando ao hobby" |
| HOB | Sinal de público hobbyista: frequenta luderias há anos, jogo competitivo, TCG, coleção, comparação técnica com outras casas |
| DESC | Desconexão de telas: "zero tela", "esquecer o celular" |
| DIV | Diversão ou sociabilidade como benefício principal, sem outro atributo |
| GEEK | Identidade geek ou nerd do espaço citada |
| NOM | Funcionário citado pelo nome |

### 1.5 Regras de decisão

1. **Elogio ao funcionário que explicou o jogo:** ATD+ e MED+. Elogio ao funcionário sem menção a jogo: só ATD+.
2. **"Comida boa, mas cara":** AB+ e PRC-. Os dois atributos são codificados separadamente.
3. **Mesma categoria com sinais opostos no comentário:** polaridade `±`.
4. **Nota geral não define polaridade.** Uma nota 5 com "a comida deixou a desejar" recebe AB-.
5. **Fila na rua, insegurança na espera:** CAP- e INC-.
6. **Ocasião só é codificada quando explícita.** "Ótimo para ir com amigos" conta; "lugar legal" não.
7. **Comentário traduzido pelo Google** ("(inglês) ...") é codificado pelo texto traduzido.
8. **Duplicata:** quando dois estabelecimentos têm os mesmos textos, o conjunto é atribuído ao estabelecimento indicado pelo conteúdo (cidade, nome de funcionário, produto) e o outro é excluído.
9. **Fora do tema:** comentário sobre outro tipo de negócio é excluído.

### 1.6 Tipologia dos estabelecimentos

Cada estabelecimento recebe um único tipo, pela atividade principal descrita no nome e nos comentários:

- **Casa de jogos** (26 estabelecimentos, 390 comentários): o cliente paga ou consome para usar o acervo no local. Inclui luderias, bares e restaurantes de jogos e bares de videogame.
- **Loja com espaço de jogo** (22 estabelecimentos, 185 comentários): a venda de jogos, cartas ou acessórios é a atividade principal; as mesas servem a partidas, torneios e comunidade, em geral sem taxa.

A classificação de cada sigla está no dicionário `ESTAB` do script. A categoria do Google (`grupo_categoria`) não foi usada: ela classifica a Luderia Carioca e a Ludoteca BGC como "loja".

### 1.7 Tratamento dos resultados

O script calcula, para cada categoria e polaridade:

- comentários com menção e percentual sobre os comentários analisados;
- percentual ponderado por estabelecimento: média das proporções de cada estabelecimento. A ponderação impede que a Luderia Carioca (69 comentários) ou o Castelos (40) dominem o resultado;
- número de estabelecimentos com pelo menos uma menção, para separar tema difuso de caso isolado;
- os mesmos números por tipo de estabelecimento.

Conferência: a soma dos comentários por tipo (390 + 185) fecha com o total analisado (575). Diferença zero.

### 1.8 Reprodução

1. Exportar a base do Notion com a consulta do passo 1 de §1.3.
2. Codificar cada comentário pelo livro de códigos (§1.4) e pelas regras (§1.5), sem consultar a codificação existente.
3. Gravar o resultado no formato do CSV de codificação.
4. Rodar `python3 "_src/[B2] Avaliacoes recentes/Google Places (Comentários)/analise/B2-a_conteudo_bardin.py"`.

### 1.9 Limitações

- **Codificador único.** A codificação foi feita por um único codificador (Claude, modelo de linguagem, em 10/10/2026, a pedido do autor). A confiabilidade só é conhecida depois do controle da §2.
- **Autosseleção e viés positivo.** 81% dos comentários têm nota 5 (466 de 575). Quem avalia não representa quem frequenta.
- **Indício de avaliação incentivada.** 14% dos comentários citam funcionário pelo nome, com nota média de 4,98 contra 4,44 dos demais. A concentração é alta em dois casos: Shelf (90% dos comentários) e Castelos (16 comentários citam a mesma atendente, todos com o rótulo "3 semanas").
- **Janelas diferentes entre lotes** e cortes por número de comentários (§0).
- **Contagem não mede intensidade.** Presença por comentário não distingue uma queixa leve de uma queixa central. Essa medição é o objetivo da etapa lexical/categórica.

## 2. Controle de qualidade por amostragem

### 2.1 Desenho

O controle é uma **recodificação cega** de uma amostra aleatória. Um segundo codificador (o autor, ou outra pessoa treinada no livro de códigos) recodifica os comentários sorteados sem ver a coluna `codigos`. A comparação entre as duas codificações mede a confiabilidade da categorização.

**Tamanho da amostra.** O alvo é estimar a proporção de comentários com pelo menos um erro de codificação. Parâmetros: proporção esperada de 10%, margem de 5 pontos percentuais, confiança de 95% (z = 1,96).

- n₀ = 1,96² × 0,10 × 0,90 / 0,05² = 138,3
- correção para população finita (N = 575): n = 138,3 / (1 + 137,3 / 575) = 111,6 → **112 comentários**

**Sorteio.** Amostra estratificada por estabelecimento, com alocação proporcional ao número de comentários e mínimo de um por estabelecimento. Os restos de arredondamento vão para os estratos com maior parte fracionária. Semente fixa: 20261010. A lista sai em `B2_bardin_amostra_controle.csv`.

### 2.2 Métricas

| Métrica | O que mede | Uso |
|---|---|---|
| Kappa de Cohen por categoria | Concordância na presença da categoria, descontado o acaso | Critério principal |
| PABAK (2 × concordância − 1) | Concordância ajustada para prevalência baixa | Leitura das categorias raras, em que o kappa é instável |
| Concordância de polaridade | Proporção de casos com o mesmo sinal, entre os comentários em que os dois codificadores marcaram a categoria | Confiabilidade do sinal |
| Taxa de comentários com divergência | Proporção de comentários em que o conjunto de códigos difere | Taxa de erro global, com intervalo de confiança de Wilson a 95% |

### 2.3 Critérios de aceitação

| Situação | Ação |
|---|---|
| Kappa ≥ 0,70 e concordância de polaridade ≥ 80% | Categoria aceita |
| Kappa < 0,70 em categoria com 10 ou mais marcações na amostra | Revisão da definição no livro de códigos e recodificação da categoria nos 575 comentários |
| Categoria com menos de 10 marcações na amostra (RUI, LOC, INC, DESC, GEEK, entre outras) | Avaliação por PABAK e leitura caso a caso das divergências; a categoria é reportada como exploratória |
| Limite superior do IC de Wilson da taxa de divergência > 20% | Revisão do livro de códigos e nova recodificação de outros 112 comentários |

O limiar de kappa 0,70 é o mesmo da validação do dicionário na metodologia (§3.4).

### 2.4 Passo a passo

1. Rodar o script para gerar `B2_bardin_amostra_controle.csv`.
2. Abrir cada `id_notion` na base do Notion e ler o comentário.
3. Codificar pelo livro de códigos, sem abrir o CSV de codificação original.
4. Gravar `B2_bardin_recodificacao.csv`, com as colunas `id_notion;codigos`, na mesma pasta.
5. Rodar o script de novo: ele gera `B2_bardin_concordancia.csv` e imprime a taxa de divergência com o intervalo de Wilson.
6. Resolver as divergências por consenso e registrar no livro de códigos as regras novas que surgirem.

## 3. Principais achados

Os percentuais são sobre os comentários de casas de jogos (n = 390), salvo indicação. "Negativas" são as menções com polaridade `-`: 192 nas casas de jogos.

### 3.1 O atendimento é o eixo da avaliação

O atendimento aparece em 58% dos comentários das casas de jogos. É a categoria mais citada no elogio (190 menções positivas) e na crítica (28 negativas, 15% das negativas). Quando o atendimento é criticado, a nota média cai para 1,7: é a crítica de maior peso na nota. As queixas descrevem rispidez, funcionário ausente e cliente tratado como suspeito.

**Decisão do plano:** equipe e treinamento de hospitalidade entram no plano operacional como item crítico, não como custo acessório.

### 3.2 A experiência vendida é "jogo + comida", e a comida é o ponto fraco

Alimentos e bebidas aparecem em 47% dos comentários das casas de jogos, contra 25% nas lojas. A comida é a segunda fonte de crítica (27 negativas, 14% das negativas). Ponderado por estabelecimento, o peso das críticas à comida sobe de 5,6% para 9,2% dos comentários: o problema está espalhado por casas menores. As críticas citam comida mediana para o preço, porções pequenas, falta de opção vegetariana e rodízio mal organizado.

**Decisão do plano:** o modelo de A&B precisa ser decidido de forma explícita. Um cardápio curto e bem executado responde à crítica mais frequente sem exigir cozinha completa.

### 3.3 Capacidade e fila geram crítica grave

Capacidade, reserva e fila somam 25 menções negativas nas casas de jogos (13% das negativas), com nota média de 2,0 quando presentes. A Luderia Carioca concentra 10 delas: fila de espera do lado de fora, sem reserva, em rua considerada perigosa. Também aparecem reserva não registrada, regra rígida de mesas para grupos grandes e pressa para liberar a mesa. Em sentido oposto, dois comentários descrevem a casa quase vazia numa sexta-feira à noite (Cartola e Shelf).

**Decisão do plano:** o projeto do salão precisa de área de espera interna e de política de reserva. A ocupação varia muito entre dias: esse dado reforça a contagem direta do Bloco B3.

### 3.4 A mediação lúdica é o diferencial elogiado

A mediação aparece em 21% dos comentários das casas de jogos, quase sempre positiva (74 positivas contra 9 negativas). O elogio descreve o monitor que recomenda o jogo pelo perfil do grupo e acompanha a primeira rodada. A crítica descreve monitor que não sabe a regra ou não aparece, com nota média de 2,1. Nas lojas, a mediação aparece em só 6,5% dos comentários.

**Decisão do plano:** a monitoria é parte do produto. O acervo deve ser escolhido também pela facilidade de explicar.

### 3.5 O acervo é valorizado pela variedade, mas raramente criticado

O acervo aparece em 37% dos comentários das casas de jogos. O elogio é genérico: "muitos jogos", "variedade enorme". A crítica é rara (11 menções) e trata de conservação, peças faltando e falta de lançamentos, esta citada por hobbyistas.

**Decisão do plano:** um acervo médio, bem conservado e explicável atende ao público das luderias. Acervo muito grande não aparece como motivo de escolha nem a sua falta como motivo de queixa.

### 3.6 Preço: a crítica mira a cobrança, não o valor absoluto

Preço aparece em 16% dos comentários das casas de jogos, com 24 negativas (13% das negativas). As queixas tratam da forma de cobrança: couvert lúdico somado a consumo obrigatório, taxa de serviço calculada sobre a taxa de jogo, taxa maior em feriado, comida cara. O elogio aparece quando a entrada é fixa e dá acesso ao acervo sem limite de tempo (Cartola e Luderia Carioca, R$ 20,00).

**Decisão do plano:** a estrutura de preço deve ser simples e anunciada antes da entrada. Os valores citados nos comentários (couvert entre R$ 20,00 e R$ 38,00) entram como evidência N3 na premissa de ticket.

### 3.7 A ocasião é social: amigos, família e aniversário

Entre as ocasiões citadas nas casas de jogos, amigos aparecem em 16% dos comentários, família ou crianças em 11%, aniversário em 6% e casal em 3%. O aniversário aparece com frequência nas críticas: reserva de grupo grande, cobrança dos convidados e regras de mesa.

**Decisão do plano:** o produto para grupos e aniversários (reserva, pacote, mesa para mais de 8 pessoas) entra no plano de marketing e no layout.

### 3.8 Casas de jogos e lojas atendem públicos diferentes

Nas lojas, 28% dos comentários trazem sinais de hobbyista (TCG, torneio, coleção) e 40% tratam de varejo e pós-venda. Comunidade aparece em 13% dos comentários das lojas e em 1% dos das casas de jogos. Nas casas de jogos, os sinais de hobbyista (3%) e de iniciante (2%) são raros: o cliente comenta a ocasião e a experiência, não a sua relação com o hobby.

**Decisão do plano:** lojas de TCG não são concorrentes diretas de uma luderia. Esse achado sustenta a retirada das três lojas de TCG da triagem e a separação dos dois tipos nas análises de concorrência e de preço.

### 3.9 Ruído e segurança são raros, mas graves

Ruído aparece em 2% dos comentários, ligado a feriados, crianças e salões com acústica ruim. Segurança e inclusão aparecem em 3%, com queixas de fila na rua, cliente tratado como suspeito e um relato de discriminação racial; e com elogios a "espaço seguro para mulheres". As duas categorias têm baixa frequência e alta gravidade: os comentários são longos e com nota 1 ou 2.

**Decisão do plano:** tratamento acústico, áreas separadas para famílias com crianças e protocolo de conduta da equipe entram como medidas de mitigação na análise de riscos.

### 3.10 A nota média do Google não mede qualidade

A nota média do corpus é 4,52 e 81% dos comentários têm nota 5. Os comentários que citam funcionário pelo nome têm nota média de 4,98 e se concentram em poucos estabelecimentos. O relato da Cineplay descreve a gerência oferecendo milkshake em troca de avaliação positiva.

**Decisão do plano:** a nota média do Google não entra como medida de qualidade dos concorrentes. Nas próximas etapas, os comentários com código NOM são analisados à parte.

## Referência

BARDIN, Laurence. *Análise de conteúdo*. São Paulo: Edições 70, 2011. `[AV]`
