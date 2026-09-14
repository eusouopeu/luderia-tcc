# REGISTRO PRÉVIO - TCC LUDERIA

| Campo | Conteúdo |
|---|---|
| Trabalho | Plano de negócios de uma luderia para o público casual |
| Instituição | UFBA |
| Versão | 1 |
| Data do registro | 14/09/2026 |
| Comprovação da data | Data e identificador do commit que adiciona este arquivo ao repositório |
| Documentos relacionados | `textos/projeto_pesquisa_luderia.md`; `instrucoes/metodologia.md` |

Este documento registra as hipóteses, variáveis, técnicas e critérios de decisão **antes da análise** dos Blocos B (avaliações recentes) e C (histórico dos avaliadores). Mudanças posteriores só são válidas como emenda datada (§10), registrada antes da abertura da metade confirmatória da base.

## 1 CONHECIMENTO PRÉVIO DOS DADOS

Declaração do que o autor já acessou na data do registro:

1. **Estabelecimentos:** base de 73 candidatos com avaliação média, volume de avaliações, política de preço, modelo de alimentação e bebidas, acervo declarado e entorno (curadoria ainda não concluída).
2. **Avaliações do desenho anterior:** 190 avaliações em português obtidas pela Google Places API (até 5 por estabelecimento, selecionadas pelo Google como "mais relevantes"), codificadas para menção a preço e a fricção de complexidade. Em 13/09/2026, foi feita uma contagem exploratória de termos nessas avaliações (ambiente, barulho, lotação, família, amigos, explicação dos jogos), sem teste estatístico.
3. **Jogos:** base de 563 jogos com correlações e clusters.
4. **Nova coleta:** nenhuma avaliação dos Blocos B e C foi coletada ou analisada.

As hipóteses H1 a H5 foram formuladas depois do contato com as 190 avaliações do item 2. Essas avaliações podem se sobrepor parcialmente à nova coleta. Por esse motivo, o teste das hipóteses usa apenas a metade confirmatória da nova base, sorteada depois do registro.

## 2 HIPÓTESES CONFIRMATÓRIAS

| Código | Hipótese | Direção |
|---|---|---|
| H1 | Menções negativas a atendimento e à explicação dos jogos associam-se a uma redução da nota centrada no avaliador maior que a de menções negativas a comida e bebida | Unilateral |
| H2 | Menções positivas a comida associam-se a nota centrada maior, controlado o estabelecimento | Unilateral |
| H3 | A proporção de avaliações com reclamação de preço difere entre as políticas de cobrança | Bilateral |
| H4 | A proporção de avaliações acompanhadas de avaliação de restaurante na mesma data relativa é maior em estabelecimentos sem cozinha própria | Unilateral |
| H5 | A mediana dos valores por pessoa citados nas avaliações fica dentro da faixa da cesta de cardápio do próprio estabelecimento | Critério de intervalo |

## 3 DEFINIÇÕES OPERACIONAIS

### 3.1 Unidades e recortes

- **Avaliação elegível:** avaliação do Bloco B em português, com texto de pelo menos 3 palavras, de estabelecimento aprovado na curadoria.
- **Estabelecimento elegível para testes com o estabelecimento como unidade (H3, H4):** pelo menos 10 avaliações elegíveis na metade confirmatória.
- **Avaliador com histórico válido:** pelo menos 5 avaliações no histórico, sem contar as avaliações de luderias do Bloco A.

### 3.2 Variáveis

| Variável | Definição |
|---|---|
| `nota` | Nota da avaliação (1 a 5) |
| `nota_centrada` | `nota` − média das notas do avaliador no histórico válido. Ausente para avaliador sem histórico válido |
| `asp_<aspecto>` | 1 se o aspecto é mencionado, 0 caso contrário. Aspectos: ambiente, barulho, atendimento, explicacao_jogos, acervo, estado_pecas, comida, bebida, preco, limpeza, conforto |
| `neg_<aspecto>` / `pos_<aspecto>` | 1 se o aspecto é mencionado com polaridade negativa / positiva, 0 caso contrário |
| `reclamacao_preco` | Igual a `neg_preco` |
| `politica_cobranca` | Categórica do Bloco A: couvert, por hora, consumação mínima, outra. Categoria com menos de 5 estabelecimentos elegíveis é agrupada em "outra" |
| `cozinha_propria` | 1 se o modelo de A&B é cozinha própria; 0 se parceria ou somente bar |
| `restaurante_mesma_data` | 1 se o avaliador tem, no histórico, avaliação de restaurante com o mesmo rótulo de data relativa da avaliação da luderia; 0 se não tem; ausente se o rótulo da luderia estiver em meses ou anos |
| Categorias de restaurante | Categorias do Google que contenham: restaurante, hamburgueria, pizzaria, lanchonete, churrascaria, sushi, comida. Bares, cafeterias e padarias não entram |
| `valor_pessoa` | Valor em R$ citado como gasto por pessoa. Conta total citada junto com o tamanho do grupo é dividida pelo número de pessoas. Valores de itens isolados não entram |
| Cesta do estabelecimento | Couvert ou taxa de jogo + uma bebida + uma entrada ou um prato principal, calculada com os preços do cardápio do próprio estabelecimento em três níveis: **baixa** (percentil 25 de cada categoria), **mediana** (mediana) e **alta** (percentil 75) |

Rótulos de data relativa ("há 2 dias", "há 3 semanas") são comparados como texto. A mesma data relativa corresponde ao mesmo dia quando o rótulo está em dias e à mesma semana quando está em semanas.

## 4 ANÁLISES CONFIRMATÓRIAS

### H1 - Aspectos da experiência

- **Base:** avaliações elegíveis da metade confirmatória com `nota_centrada` não ausente.
- **Modelo:** regressão linear `nota_centrada ~ neg_atendimento + neg_explicacao_jogos + neg_comida + neg_bebida + neg_ambiente + neg_barulho + neg_acervo + neg_estado_pecas + neg_preco + neg_limpeza + neg_conforto + efeito fixo de estabelecimento`, com erro padrão agrupado por estabelecimento.
- **Teste:** contraste `(β_neg_atendimento + β_neg_explicacao_jogos)/2 − (β_neg_comida + β_neg_bebida)/2 < 0`, teste de Wald unilateral.
- **Tamanho de efeito:** valor do contraste em pontos de nota, com intervalo de confiança de 95%.
- **Suficiência:** se algum dos quatro aspectos do contraste tiver menos de 30 menções negativas na base, H1 é reportada como **inconclusiva por falta de dados**.

### H2 - Comida

- **Base:** a mesma de H1.
- **Modelo:** regressão linear `nota_centrada ~ pos_comida + neg_comida + asp_<demais aspectos> + efeito fixo de estabelecimento`, com erro padrão agrupado por estabelecimento.
- **Teste:** `β_pos_comida > 0`, teste t unilateral.
- **Tamanho de efeito:** `β_pos_comida` em pontos de nota, com intervalo de confiança de 95%.
- **Suficiência:** menos de 30 menções positivas a comida → inconclusiva.

### H3 - Preço

- **Unidade:** estabelecimento elegível.
- **Variável:** proporção de avaliações com `reclamacao_preco = 1` por estabelecimento.
- **Teste:** Kruskal-Wallis entre as categorias de `politica_cobranca`, bilateral. Se restarem apenas duas categorias, Mann-Whitney bilateral.
- **Tamanho de efeito:** épsilon ao quadrado (Kruskal-Wallis) ou delta de Cliff (Mann-Whitney).
- **Suficiência:** menos de duas categorias com 5 estabelecimentos elegíveis → inconclusiva.

### H4 - Jornada da ocasião

- **Unidade:** estabelecimento elegível com pelo menos 5 avaliações em que `restaurante_mesma_data` não é ausente.
- **Variável:** proporção de avaliações com `restaurante_mesma_data = 1` por estabelecimento.
- **Teste:** Mann-Whitney unilateral (sem cozinha própria > com cozinha própria).
- **Tamanho de efeito:** delta de Cliff.
- **Suficiência:** menos de 5 estabelecimentos em algum dos grupos → inconclusiva. Espera-se N reduzido, porque só rótulos em dias e semanas são comparáveis.

### H5 - Ticket

- **Base:** valores `valor_pessoa` da metade confirmatória, de estabelecimentos com cardápio coletado.
- **Padronização:** `z = valor_pessoa ÷ cesta mediana do estabelecimento`.
- **Limites da faixa:** `L` = mediana, entre estabelecimentos, de `cesta baixa ÷ cesta mediana`; `U` = mediana, entre estabelecimentos, de `cesta alta ÷ cesta mediana`.
- **Critério:** H5 é sustentada se o intervalo de confiança de 95% da mediana de `z`, obtido por bootstrap agrupado por estabelecimento (10.000 reamostragens), estiver inteiramente contido em `[L, U]`. É refutada se o intervalo estiver inteiramente fora. Nos demais casos, é inconclusiva.
- **Suficiência:** menos de 30 valores ou menos de 10 estabelecimentos → inconclusiva.
- **Valores extremos:** valores abaixo de R$ 5,00 ou acima de R$ 500,00 por pessoa são conferidos no texto original; só são removidos se houver erro de extração.

## 5 CRITÉRIOS DE DECISÃO

- **Nível de significância:** 0,05.
- **Múltiplas comparações:** correção de Benjamini-Hochberg sobre os valores-p de H1, H2, H3 e H4 (taxa de descobertas falsas de 5%). H5 usa critério de intervalo e fica fora da correção.
- **Resultados possíveis:** sustentada, não sustentada ou inconclusiva por falta de dados.
- **Direção contrária:** efeito significativo na direção oposta à hipótese unilateral é reportado como não sustentado, com descrição do efeito.
- Todos os resultados são reportados, inclusive os não sustentados e os inconclusivos.

## 6 DADOS AUSENTES E EXCLUSÕES

- Análise com casos completos em cada teste; o N de cada teste é reportado.
- Exclusões previstas: avaliações fora do português, textos com menos de 3 palavras, estabelecimentos reprovados na curadoria, variáveis de texto reprovadas na validação do dicionário (§8).
- Não há exclusão de avaliações por nota extrema.

## 7 DIVISÃO DA BASE

1. Ocorre depois do fim da coleta do Bloco B e antes de qualquer análise dos Blocos B e C.
2. **Unidade do sorteio:** avaliador. Cada avaliador é associado ao estabelecimento de sua primeira avaliação coletada, que define o estrato.
3. **Sorteio:** 50% dos avaliadores de cada estrato para a metade exploratória e 50% para a confirmatória. Em estratos com número ímpar, o avaliador excedente vai para a confirmatória.
4. **Semente:** 20260914, no script `src/sorteio_divisao_base.py`.
5. **Integridade:** o arquivo da metade confirmatória é salvo separadamente, e seu hash SHA-256 é registrado na emenda seguinte ao sorteio. O arquivo não é aberto até a emenda final.
6. **Metade exploratória:** construção e validação do dicionário, análises exploratórias, ajuste de especificações.
7. **Metade confirmatória:** análises das seções 4 e 5, em rodada única, com o script congelado e versionado antes da execução.
8. Estatísticas descritivas para o plano (reclamações, cardápios, ticket, velocidade de avaliações) usam a base completa, depois da rodada confirmatória.

## 8 VALIDAÇÃO DO DICIONÁRIO

1. **Manual de codificação** com definição, exemplos e casos de fronteira de cada variável de texto, concluído antes da codificação humana.
2. **Amostra:** 200 avaliações da metade exploratória, sorteadas com estratificação por estabelecimento (semente 20260915, `src/sorteio_validacao.py`).
3. **Codificação humana 1:** autor, sem ver a saída do dicionário.
4. **Codificação humana 2:** segunda pessoa com o manual. Na falta dela, recodificação pelo autor após no mínimo 14 dias, sem consultar a codificação 1.
5. **Concordância humana:** kappa de Cohen por variável; divergências resolvidas por consenso, formando a codificação de referência.
6. **Desempenho do dicionário:** precisão, revocação e F1 contra a codificação de referência.
7. **Critério de aceitação:** kappa ≥ 0,70 e F1 ≥ 0,70 por variável. Para `valor_pessoa` e tamanho do grupo: taxa de acerto exato ≥ 0,80.
8. **Reprovação:** revisão do dicionário e novo teste em outras 100 avaliações da metade exploratória. Persistindo a reprovação, a variável sai das análises confirmatórias. Hipótese que dependa dela é reportada como inconclusiva.

## 9 ANÁLISES EXPLORATÓRIAS E DESCRITIVAS

Sem hipótese prévia, sem uso para confirmação e apresentadas como exploratórias no texto:

- Análise de penalidade e recompensa de todos os aspectos.
- Ranking de reclamações, total e por estabelecimento.
- Comparação de cardápios (preço, variedade e itens) por capital e modelo de A&B.
- Lift de categorias no histórico dos avaliadores, com intervalo de confiança por bootstrap.
- Sobreposição de avaliadores entre luderias da mesma capital.
- Jogos citados nas avaliações.
- Velocidade de avaliações por estabelecimento e modelo de calibração da ocupação.
- Contagem direta de ocupação (Bloco D): taxa de ocupação, pessoas por mesa e permanência, por turno. Protocolo e sorteio dos turnos (semente 20260916, `src/sorteio_contagem.py`) em `instrucoes/metodologia.md`.

**Análises de sensibilidade** para H1 a H5, reportadas junto aos resultados confirmatórios, sem substituí-los:

- sem os cinco estabelecimentos de maior volume de avaliações;
- sem os estabelecimentos com menos de 30 avaliações com texto;
- H1 e H2 com `nota` no lugar de `nota_centrada`, incluindo avaliadores sem histórico válido;
- sem avaliações de avaliadores que avaliaram duas ou mais luderias.

## 10 EMENDAS

Cada emenda recebe número, data, descrição, justificativa e commit. Emendas feitas depois da abertura da metade confirmatória são declaradas como desvios no texto do TCC.

| Nº | Data | Descrição | Justificativa | Commit |
|---|---|---|---|---|
| - | - | - | - | - |

## 11 SOFTWARE

Python, com pandas, statsmodels e scipy. Versões registradas em `requirements.txt` no commit da rodada confirmatória.
