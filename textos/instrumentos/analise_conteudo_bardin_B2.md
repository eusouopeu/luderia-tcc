# Análise de conteúdo das avaliações das luderias (Bloco B2)

Versão de 15/10/2026. Corpus: coletas do userscript `maps_avaliacoes` de 13 e 14/10/2026, com as avaliações até o rótulo "3 meses atrás". Substitui a versão parcial de 10/10/2026, feita sobre a base do Notion "B - Comentários (manual)" com 575 comentários e janelas diferentes entre lotes. A análise segue o modelo de análise de conteúdo de Bardin (2011) `[AV]` e tem caráter exploratório: identifica e define as categorias. A medição de intensidade dos achados fica para a etapa lexical/categórica posterior.

Arquivos:

- corpus com texto (fora do git): `dados/[B2] Avaliacoes recentes/_dados-brutos/analise_conteudo/B2_bardin_corpus.csv`;
- arquivo de coleta usado por estabelecimento: `dados/[B2] Avaliacoes recentes/analise_conteudo/B2_bardin_arquivos_coleta.csv`;
- codificação comentário a comentário: `dados/[B2] Avaliacoes recentes/analise_conteudo/B2_codificacao_bardin.csv`;
- corpus, contagens, tipologia e amostra de controle: `_src/[B2] Avaliacoes recentes/Google Places (Comentários)/analise/B2-a_conteudo_bardin.py`;
- saídas do script: `B2_bardin_*.csv`, na mesma pasta da codificação.

## 0. Corpus e situação dos dados

| Item | Valor |
|---|---|
| Estabelecimentos do objeto (`B1_resumo_estabelecimentos.xlsx`) | 54 |
| Arquivos de coleta | 64 (10 repetidos, descartados) |
| Avaliações no recorte, nos arquivos escolhidos | 2.423 |
| Comentários com texto no recorte | 1.593 |
| Excluídos: fora do tema (Bravo Jogos, revisão de veículo) | 1 |
| Excluídos: texto-modelo promocional repetido (Bodogami, Ludus, Play Easy, Pitta's) | 4 |
| **Comentários analisados** | **1.588** |
| Estabelecimentos com comentário analisado | 53 (Paladino Hobbies não tem comentário com texto no recorte) |
| Casas de jogos / lojas com espaço de jogo | 1.370 / 218 comentários |

**Arquivo mais completo.** Seis estabelecimentos têm mais de um arquivo de coleta: Arcadea (2), Bardo Mago (2), Bodogami (4), Coletivo Geek (2), Joyjoy (2) e Shelf (4). Para cada um, entra só o arquivo com mais comentários com texto no recorte; o empate é decidido pelo número de avaliações no recorte, depois pelo de linhas lidas e, por fim, pela coleta mais recente. Os arquivos não se somam. No Shelf, o arquivo escolhido tem 243 comentários no recorte, contra 71, 36 e 35 dos outros três. No Bodogami, o escolhido tem 458, contra 451 a 453 dos demais: as coletas do mesmo dia diferem nas avaliações que mudaram do rótulo "3 meses" para "4 meses" entre um horário e outro.

**Recorte.** Entram as avaliações com rótulo de data até "3 meses atrás", inclusive, com ou sem a marca "Editado" (`idade_dias_aprox` até 90). A maior parte dos arquivos foi coletada até "6 meses atrás"; o excedente fica fora.

**Concentração.** Bodogami (457 comentários) e Shelf (243) somam 700 dos 1.370 comentários das casas de jogos (51%). Por isso, o percentual ponderado por estabelecimento (§1.7) é a leitura principal sempre que os dois divergem.

Pendências que afetam a análise:

1. **Salvador.** A São Jogue (Bela Vista) tem só 4 comentários no recorte. A cidade do projeto não tem base para conclusão própria no B2.
2. **Machado Games e Ilusões Industriais.** Saíram do objeto em 15/10/2026 (não são luderias) e não têm coleta. A duplicata Flow Games × Machado Games da versão anterior deixou de existir.
3. **Cinco casas novas.** Bardo Mago, La Tabuleria, TabuClub, Toca do Rato e Tubaleria entraram no objeto e na análise. A tipologia delas (§1.6) foi atribuída pela leitura dos comentários.

## 1. Método

### 1.1 Enquadramento

A análise de conteúdo é organizada em três polos cronológicos: pré-análise, exploração do material e tratamento dos resultados com inferência e interpretação (Bardin, 2011 `[AV]`). A versão aplicada é categorial e temática: o texto é recortado em temas, cada tema é classificado numa categoria e a categoria é enumerada por presença.

A análise responde a uma pergunta do plano: quais atributos da experiência numa luderia o cliente comenta, em que direção e com que peso, para orientar as decisões de formato, A&B, acervo, equipe, preço e capacidade.

### 1.2 Pré-análise

**Constituição do corpus.** O corpus é o universo dos comentários com texto coletados no Bloco B2 para os estabelecimentos do objeto, até o rótulo "3 meses atrás". Não há amostragem. As regras de Bardin foram aplicadas assim:

| Regra | Aplicação |
|---|---|
| Exaustividade | Todos os comentários do recorte entram; a exclusão é feita por critério escrito (tema fora do objeto ou texto-modelo) e registrada na coluna `situacao` |
| Representatividade | Não se aplica: o corpus é o universo coletado. O viés de autosseleção do avaliador é tratado como limitação (§1.9) |
| Homogeneidade | Mesma fonte (Google Maps), mesmo gênero (avaliação pública), mesmo objeto (estabelecimento com jogos de mesa) e mesma janela para todos os estabelecimentos |
| Pertinência | Só entram comentários sobre a experiência no estabelecimento ou sobre a compra nele |

**Leitura flutuante.** O corpus inteiro foi lido uma vez, em ordem de estabelecimento. Nessa leitura foram anotados os temas recorrentes e os casos de fronteira.

**Formulação das categorias.** A grade é mista. Uma parte é dedutiva e vem das variáveis previstas na metodologia (§3.4): acervo, explicação dos jogos, atendimento, comida, preço, ambiente, barulho. Outra parte emergiu da leitura flutuante da versão de 10/10: capacidade e fila, programação, comunidade, varejo, segurança e inclusão, retorno declarado e os códigos de contexto. A grade foi mantida sem alteração na versão de 15/10; nenhum tema novo ficou sem categoria.

### 1.3 Exploração do material

| Elemento | Definição adotada |
|---|---|
| Unidade de registro | Tema: trecho que expressa um juízo ou um fato sobre um atributo da experiência |
| Unidade de contexto | O comentário inteiro. A polaridade de um tema é lida no comentário, não na frase isolada |
| Regra de enumeração | Presença ou ausência por comentário. Um tema citado três vezes no mesmo comentário conta uma vez |
| Polaridade | `+` positiva, `-` negativa, `±` mista (elogio e crítica ao mesmo atributo), `~` neutra ou mediana ("comida honesta, nada demais") |
| Exclusividade | Cada trecho entra numa única categoria. Um comentário pode ter várias categorias |
| Atribuição ao grupo | Cada comentário pertence ao estabelecimento da coleta (pelo cid do Google Maps); cada estabelecimento pertence a um único tipo (§1.6) |

Procedimento de codificação, na ordem em que foi executado:

1. Montagem do corpus pelo script (`--corpus`): um arquivo de coleta por estabelecimento, avaliações com texto até "3 meses atrás". O texto usado é o `texto_avaliacao`, já traduzido pelo Google quando a avaliação é estrangeira.
2. Identificação de cada comentário pelo `id_avaliacao`: os 10 primeiros caracteres do SHA-1 do `review_id` do Google. O id é estável entre coletas e permite voltar ao texto sem copiá-lo para o repositório.
3. Leitura de cada comentário e marcação dos temas pelo livro de códigos (§1.4), com a polaridade de cada um.
4. Aplicação das regras de decisão (§1.5) nos casos de fronteira.
5. Registro de uma linha por comentário no CSV de codificação: `id_avaliacao;sigla;nota;codigos;situacao`.
6. Validação automática pelo script: todo código precisa existir no livro de códigos; toda sigla precisa ter estabelecimento e tipo; os ids da codificação e do corpus precisam coincidir, sem sobra dos dois lados.

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
7. **Comentário traduzido pelo Google** é codificado pelo texto traduzido.
8. **Duplicata:** quando dois estabelecimentos têm os mesmos textos, o conjunto é atribuído ao estabelecimento indicado pelo conteúdo (cidade, nome de funcionário, produto) e o outro é excluído.
9. **Fora do tema:** comentário sobre outro tipo de negócio é excluído.
10. **Texto-modelo promocional:** o mesmo texto, com troca só do nome do produto, publicado em estabelecimentos diferentes e com menção a um perfil de rede social sem relação com a casa, é excluído. O caso de 15/10 repete a frase "só penso nos conteúdos da Julian tribal" em Bodogami, Ludus, Play Easy e Pitta's.
11. **Comentário só com o nome de um funcionário** ("Alex", "Juninho"): NOM e GEN+.

### 1.6 Tipologia dos estabelecimentos

Cada estabelecimento recebe um único tipo, pela atividade principal descrita no nome e nos comentários:

- **Casa de jogos** (31 estabelecimentos, 1.370 comentários): o cliente paga ou consome para usar o acervo no local. Inclui luderias, bares e restaurantes de jogos e bares de videogame. As cinco casas novas entram aqui.
- **Loja com espaço de jogo** (22 estabelecimentos com comentário, 218 comentários): a venda de jogos, cartas ou acessórios é a atividade principal; as mesas servem a partidas, torneios e comunidade, em geral sem taxa. Dungeon Games Store e Paladino Hobbies entram aqui.

A classificação de cada sigla está no dicionário `ESTAB` do script. A categoria do Google (`grupo_categoria`) não foi usada: ela classifica a Luderia Carioca e a Ludoteca BGC como "loja".

### 1.7 Tratamento dos resultados

O script calcula, para cada categoria e polaridade:

- comentários com menção e percentual sobre os comentários analisados;
- percentual ponderado por estabelecimento: média das proporções de cada estabelecimento. A ponderação impede que o Bodogami (457 comentários) e o Shelf (243) dominem o resultado;
- número de estabelecimentos com pelo menos uma menção, para separar tema difuso de caso isolado;
- os mesmos números por tipo de estabelecimento;
- a nota média dos comentários com cada categoria, por polaridade (`B2_bardin_nota_por_categoria.csv`).

Conferência: a soma dos comentários por tipo (1.370 + 218) fecha com o total analisado (1.588). Diferença zero. O corpus (1.593) fecha com a soma dos comentários com texto dos arquivos escolhidos. Diferença zero.

### 1.8 Reprodução

1. Rodar `python3 "_src/[B2] Avaliacoes recentes/Google Places (Comentários)/analise/B2-a_conteudo_bardin.py" --corpus` para montar o corpus a partir das coletas.
2. Codificar cada comentário pelo livro de códigos (§1.4) e pelas regras (§1.5), sem consultar a codificação existente.
3. Gravar o resultado no formato do CSV de codificação.
4. Rodar o script sem opção para gerar as contagens.

### 1.9 Limitações

- **Codificador único.** A codificação foi feita por um único codificador (Claude, modelo de linguagem, em 15/10/2026, a pedido do autor), sem consulta à codificação de 10/10. A confiabilidade só é conhecida depois do controle da §2.
- **Autosseleção e viés positivo.** 85% dos comentários têm nota 5 (1.348 de 1.588). Quem avalia não representa quem frequenta.
- **Indício de avaliação incentivada.** 25% dos comentários citam funcionário pelo nome, com nota média de 4,94 contra 4,54 dos demais. A concentração é alta em três casas: Shelf (87% dos comentários, 212 de 243, a maior parte sobre uma mesma explicadora), Bardo Mago (75%) e Castelos (35%). Os textos curtos e repetidos ("Experiência ótima. Alex me atendeu, foi muito resenha!", três vezes) reforçam o indício.
- **Concentração em duas casas.** Bodogami e Shelf somam 51% dos comentários das casas de jogos (§0).
- **Contagem não mede intensidade.** Presença por comentário não distingue uma queixa leve de uma queixa central. Essa medição é o objetivo da etapa lexical/categórica.

## 2. Controle de qualidade por amostragem

### 2.1 Desenho

O controle é uma **recodificação cega** de uma amostra aleatória. Um segundo codificador (o autor, ou outra pessoa treinada no livro de códigos) recodifica os comentários sorteados sem ver a coluna `codigos`. A comparação entre as duas codificações mede a confiabilidade da categorização.

**Tamanho da amostra.** O alvo é estimar a proporção de comentários com pelo menos um erro de codificação. Parâmetros: proporção esperada de 10%, margem de 5 pontos percentuais, confiança de 95% (z = 1,96).

- n₀ = 1,96² × 0,10 × 0,90 / 0,05² = 138,3
- correção para população finita (N = 1.588): n = 138,3 / (1 + 137,3 / 1.588) = 127,3 → **128 comentários**

**Sorteio.** Amostra estratificada por estabelecimento, com alocação proporcional ao número de comentários e mínimo de um por estabelecimento. Os restos de arredondamento vão para os estratos com maior parte fracionária. O mínimo de um por estabelecimento leva a amostra a **131 comentários**. Semente fixa: 20261015. A lista sai em `B2_bardin_amostra_controle.csv`.

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
| Kappa < 0,70 em categoria com 10 ou mais marcações na amostra | Revisão da definição no livro de códigos e recodificação da categoria nos 1.588 comentários |
| Categoria com menos de 10 marcações na amostra (RUI, LOC, INC, DESC, GEEK, entre outras) | Avaliação por PABAK e leitura caso a caso das divergências; a categoria é reportada como exploratória |
| Limite superior do IC de Wilson da taxa de divergência > 20% | Revisão do livro de códigos e nova recodificação de outros 131 comentários |

O limiar de kappa 0,70 é o mesmo da validação do dicionário na metodologia (§3.4).

### 2.4 Passo a passo

1. Rodar o script para gerar `B2_bardin_amostra_controle.csv`.
2. Abrir cada `id_avaliacao` no corpus (`_dados-brutos/analise_conteudo/B2_bardin_corpus.csv`) e ler o comentário.
3. Codificar pelo livro de códigos, sem abrir o CSV de codificação original.
4. Gravar `B2_bardin_recodificacao.csv`, com as colunas `id_avaliacao;codigos`, na mesma pasta.
5. Rodar o script de novo: ele gera `B2_bardin_concordancia.csv` e imprime a taxa de divergência com o intervalo de Wilson.
6. Resolver as divergências por consenso e registrar no livro de códigos as regras novas que surgirem.

## 3. Principais achados

Os percentuais são sobre os comentários de casas de jogos (n = 1.370, 31 estabelecimentos), salvo indicação. "Ponderado" é a média das proporções por estabelecimento. "Negativas" são as menções com polaridade `-`: 419 nas casas de jogos.

### 3.1 O atendimento é o eixo da avaliação

O atendimento aparece em 55% dos comentários das casas de jogos, em todos os 31 estabelecimentos. É a categoria mais citada no elogio (677 menções positivas) e a segunda na crítica (63 negativas, 15% das negativas). Ponderada por estabelecimento, a crítica ao atendimento sobe de 4,6% para 8,8% dos comentários: o problema está espalhado pelas casas menores. Quando o atendimento é criticado, a nota média cai para 1,8: é a crítica de maior peso na nota. As queixas descrevem rispidez, funcionário ausente, gerente que não resolve o erro e cliente tratado como suspeito.

**Decisão do plano:** equipe e treinamento de hospitalidade entram no plano operacional como item crítico, não como custo acessório.

### 3.2 Preço: a crítica mira a forma de cobrança

Preço passou a ser a categoria com mais menções negativas nas casas de jogos: 68 (16% das negativas), em 16 estabelecimentos. As queixas tratam da forma de cobrança: couvert lúdico somado à comida cara, valor maior no fim de semana ou no domingo, taxa de serviço calculada sobre a taxa de jogo, tempo de jogo limitado depois de pago. O elogio aparece quando a entrada é fixa e dá acesso ao acervo sem limite de tempo (Cartola, Luderia Carioca e Ludoteca BGC, R$ 20,00) ou quando parte da entrada vira consumo (Play Easy). Os valores de entrada citados vão de R$ 15,00 a R$ 38,00.

**Decisão do plano:** a estrutura de preço deve ser simples e anunciada antes da entrada. Os valores citados nos comentários entram como evidência N3 na premissa de ticket.

### 3.3 A experiência vendida é "jogo + comida", e a comida divide opiniões

Alimentos e bebidas aparecem em 44% dos comentários das casas de jogos, contra 20% nas lojas. A comida é a terceira fonte de crítica (61 negativas, 15% das negativas), com nota média de 2,5 quando criticada. Ponderado por estabelecimento, o peso das críticas à comida sobe de 4,5% para 9,2% dos comentários. O Bodogami concentra 20 das 61 críticas, quase todas ao lámen e às frituras. As demais citam porção pequena para o preço, comida fria e uma única opção vegana.

**Decisão do plano:** o modelo de A&B precisa ser decidido de forma explícita. Um cardápio curto e bem executado responde à crítica mais frequente sem exigir cozinha completa.

### 3.4 Capacidade, reserva e fila geram crítica grave

Capacidade, reserva e fila somam 48 menções negativas nas casas de jogos (11% das negativas), em 15 estabelecimentos, com nota média de 2,2. Os casos se dividem em três grupos. Na Fan Hour (9), o tempo máximo na mesa e a saída forçada no fechamento. Na Luderia Carioca (8), a fila de espera do lado de fora, sem reserva, em rua considerada perigosa. Em Castelos, Shelf, TabuClub e Cartola, a reserva não registrada ou cancelada e a recusa em juntar mesas para grupos.

**Decisão do plano:** o projeto do salão precisa de área de espera interna e de política de reserva por escrito, com regra clara para grupos. A ocupação varia muito entre dias: esse dado reforça a contagem direta do Bloco B3.

### 3.5 Tempo de serviço pesa nos dias cheios

Demora e erro de pedido somam 45 menções negativas (11% das negativas), em 17 estabelecimentos, com nota média de 2,4. A queixa aparece em feriados e noites cheias: pedido de uma hora ou mais, comanda trocada, prato que chega depois da sobremesa. Shelf (7), Bodogami (5), Castelos (5) e Toca do Rato (4) concentram os casos.

**Decisão do plano:** o dimensionamento da cozinha e da equipe de salão segue o pico de ocupação, não a média. O cardápio curto do §3.3 também reduz o tempo de preparo.

### 3.6 A mediação lúdica é o diferencial elogiado

A mediação aparece em 18% dos comentários das casas de jogos (25% ponderado), quase sempre positiva (229 positivas contra 20 negativas). O elogio descreve o monitor que recomenda o jogo pelo perfil do grupo e acompanha a primeira rodada. A crítica descreve monitor que não sabe a regra, ensina errado ou demora a aparecer, com nota média de 2,7. Nas lojas, a mediação aparece em 5% dos comentários.

**Decisão do plano:** a monitoria é parte do produto. O acervo deve ser escolhido também pela facilidade de explicar, e o número de monitores segue o número de mesas ocupadas.

### 3.7 O acervo é valorizado pela variedade, mas raramente criticado

O acervo aparece em 29% dos comentários das casas de jogos (39% ponderado), em todos os 31 estabelecimentos. O elogio é genérico: "muitos jogos", "variedade enorme". A crítica é rara (18 menções) e trata de conservação e peças faltando; o Bodogami concentra 9 delas.

**Decisão do plano:** um acervo médio, bem conservado e explicável atende ao público das luderias. Acervo muito grande não aparece como motivo de escolha nem a sua falta como motivo de queixa.

### 3.8 A ocasião é social: amigos, família e aniversário

Entre as ocasiões citadas nas casas de jogos, amigos aparecem em 13% dos comentários, família ou crianças em 6%, aniversário em 4% e casal em 2%. O aniversário concentra problemas: 43% dos comentários que citam aniversário trazem alguma crítica, e a nota média deles é 3,9. As queixas tratam de reserva de grupo, cobrança antecipada da entrada dos convidados e mesa trocada na última hora.

**Decisão do plano:** o produto para grupos e aniversários (reserva, pacote, mesa para mais de 8 pessoas) entra no plano de marketing e no layout, com regra escrita de reserva.

### 3.9 Casas de jogos e lojas atendem públicos diferentes

Nas lojas, 27% dos comentários trazem sinais de hobbyista (TCG, torneio, coleção) e 40% tratam de varejo e pós-venda. Comunidade aparece em 12% dos comentários das lojas e em 1% dos das casas de jogos. Nas casas de jogos, os sinais de hobbyista (1,5%) e de iniciante (0,9%) são raros: o cliente comenta a ocasião e a experiência, não a sua relação com o hobby.

**Decisão do plano:** lojas de TCG não são concorrentes diretas de uma luderia. Esse achado sustenta a separação dos dois tipos nas análises de concorrência e de preço.

### 3.10 Ruído e segurança são raros, mas graves

Ruído aparece em 2% dos comentários das casas de jogos, ligado a salões cheios, feriados e crianças; o Shelf concentra 7 das 18 críticas. Segurança e inclusão aparecem em 2%, com queixas de fila na rua, cliente tratado como suspeito e um relato de discriminação racial, todas com nota baixa; e com elogios a "espaço seguro para mulheres" e a acolhimento do público LGBTQIA+. A Luderia Carioca concentra 5 das 8 críticas.

**Decisão do plano:** tratamento acústico, salas separadas para grupos e famílias com crianças e protocolo de conduta da equipe entram como medidas de mitigação na análise de riscos.

### 3.11 A nota média do Google não mede qualidade

A nota média do corpus é 4,64 e 85% dos comentários têm nota 5. Os comentários que citam funcionário pelo nome têm nota média de 4,94 e se concentram no Shelf e no Bardo Mago. O relato da Cineplay descreve a gerência oferecendo milkshake em troca de avaliação positiva. Quatro comentários com texto-modelo promocional foram excluídos (§1.5, regra 10).

**Decisão do plano:** a nota média do Google não entra como medida de qualidade dos concorrentes. Nas próximas etapas, os comentários com código NOM são analisados à parte.

### 3.12 Salvador não tem base própria no B2

A São Jogue tem 4 comentários no recorte: dois elogios (ambiente, acervo, comida, preço e atendimento) e duas críticas ao karaokê (catálogo limitado, demora e pressão para sair no fim da reserva) e ao lanche.

**Decisão do plano:** as conclusões do B2 valem para o conjunto das metrópoles. A leitura do mercado de Salvador depende do B3 e das fontes do cap. 5.

## Referência

BARDIN, Laurence. *Análise de conteúdo*. São Paulo: Edições 70, 2011. `[AV]`
