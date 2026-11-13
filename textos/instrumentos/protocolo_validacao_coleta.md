# Protocolo de coleta e validação

Detalhe operacional do método, separado de `_instrucoes/4_metodologia.md` (que fica com o que orienta a escrita do cap. 3). Ler só em tarefa de coleta, auditoria ou validação.

## 1. Dados do app de observação (Bloco B3)

O app exporta um CSV por conteúdo, `contagem_<conteúdo>.csv` (separador `;`, UTF-8 com BOM), guardado intacto em `dados/B3_contagem/_dados-brutos/originais/AAAA-MM-DD_<SJBV|SJPA>/`. O `B3-b_importar_app.py` consolida as visitas em `_dados-brutos/app/contagem_<conteúdo>.csv`, sempre com a unidade e a visita tiradas da pasta, nunca as digitadas no app. Correções de lançamento e descartes ficam em `outros/B3_correcoes_app.csv` e `outros/B3_descartes_app.csv`, com motivo, sem editar os originais; a NFC-e lida da foto entra com `fonte_registro` = `transcricao`. Toda linha leva `visita_id` (`AAAA-MM-DD_<SJBV|SJPA>`), `unidade` (`BV` ou `PA`), `visita_inicio` e `versao_app`.

| Arquivo | Uma linha por | Conteúdo principal |
|---|---|---|
| `contagem_visitas.csv` | Visita | Início, fim, pausas, cobrança e valor, condições, NFC-e de início e de fim (série, número, emissão), CNPJ |
| `contagem_grupos_mesa.csv` | Grupo de mesa | Mesa, entrada, saída, `permanencia_min`, `censurada`, pessoas, crianças, aniversário, `instrutor_vezes`, jogos |
| `contagem_fluxo.csv` | Entrada ou saída na porta | Código do grupo (`BV-n`), tipo, hora, pessoas, crianças |
| `contagem_rodadas.csv` | Contagem periódica | Etapa, hora, mesas no total, ocupadas e vazias |
| `contagem_unidades.csv` | Unidade na visita | Mesas, estantes, capacidade em caixas, instrutores, atendentes |
| `contagem_precos.csv` | Item de preço | Origem (NFC-e ou cardápio), item, quantidade, valor |
| `contagem_pedidos.csv` | Pedido (extra) | Mesa, categoria, hora do pedido, chegada, `espera_min`, pendente |
| `contagem_acustica.csv`, `contagem_medidas.csv`, `contagem_fotos.csv` | Medição | Nível de som estimado (dB), medidas por objeto de referência, fotos do ambiente sem pessoas |

O `B3-a_contagem.py` gera as saídas em `dados/B3_contagem/`: `contagem_resumo_visitas.csv` (uma linha por visita: pessoas por hora, grupos, permanência, ocupação das mesas e dos assentos, notas e pessoas por nota) e `contagem_notas_intervalo.csv` (notas emitidas e notas por dia entre as visitas da mesma unidade). A ocupação é calculada minuto a minuto pelos grupos de mesa, com a mesa do observador fora do denominador: mesas com grupo ÷ (mesas da unidade − mesa do observador; 11 − 1 no Bela Vista, 10 − 1 na Paralela) e pessoas sentadas ÷ (48 assentos − pessoas da mesa do observador; 3 em 10/10, 2 nas demais). Mesa e pessoas do observador por visita em `outros/B3_mesa_observador.csv`; denominadores nas colunas `mesas_denominador` e `assentos_denominador`. As visitas também são lançadas no Notion "3 - Visitas presenciais", uma linha por visita, com os valores do resumo.

## 2. Validação da coleta, por bloco

### Blocos B1 e B2 - censo da fonte

O script coleta todos os estabelecimentos e todas as avaliações do recorte. Por isso, não há erro amostral. A amostra deixa de servir para inferir a população e passa a estimar a taxa de erro do instrumento de coleta. O fato de o script ter sido escrito com apoio de inteligência artificial não muda essa lógica: o que se valida é o dado gerado, não a autoria do código. O código fica no repositório e pode ser auditado.

A validação tem três etapas:

| Etapa | Procedimento |
|---|---|
| 1. Fidelidade | No Bloco B1, amostra aleatória estratificada por capital e faixa de volume de avaliações: 20% dos estabelecimentos curados, com nota média, número de avaliações e endereço conferidos na página. No Bloco B2, amostra estratificada por estabelecimento em duas etapas (abaixo): texto, nota e rótulo de data conferidos na página. A conferência é feita até sete dias após a coleta, e a data de cada conferência é registrada. As demais coletas do B1 seguem o mesmo desenho: entorno, 20% estratificado (distância conferida em linha reta, de pino a pino, como no coletor); posts do Instagram, itens de cardápio e jogos dos acervos, 200 unidades com mínimo de 3 por estrato, como no B2; perfis do Instagram, exaustivo. No B4, uma linha sorteada por série. Todas as amostras saem de script (`*-a_auditoria_*.py`, `_src/extras/amostrar_auditoria.py`), com semente fixa (20261015) e chave SHA-256 por unidade, em `_dados-brutos/<pasta>/auditoria/`, e são conferidas no Notion, um banco "B - Auditoria …" por amostra |
| 2. Completude | Em todos os estabelecimentos do Bloco B2, o número de avaliações com texto no recorte, contado na página, é comparado ao número coletado. Diferença indica avaliação perdida por paginação, tempo de espera ou limite de pedidos. Avaliação só conta como lida com o "Mais" expandido; a coluna `texto_expandido` marca as que ficaram cortadas (inclusive texto terminado no marcador " …" do Google), e o estabelecimento é recoletado |
| 3. Cobertura | A lista do Bloco B1 é comparada a fontes independentes: buscas manuais por termo nas capitais e perfis de luderias no Instagram. No Instagram, snowball pelas listas "seguindo" das casas aprovadas (sementes): conta seguida por k ou mais sementes vira candidata, classificada à mão; o corte k sai da precisão e da sensibilidade medidas, e a cobertura da lista do B1 é estimada por captura e recaptura (Chapman), lida como limite inferior (a segunda lista nasce da primeira). Só agregados e perfis de negócio são publicados; as listas brutas, com @ de pessoas físicas, ficam fora do git (`B1-b_instagram_seguindo.py`, `B1-a_instagram_snowball.py`). Estabelecimento encontrado fora da lista é registrado com o motivo da ausência |

O resultado é a taxa de erro por variável, com intervalo de confiança de 95% (método de Wilson). O critério de aceitação é limite superior do intervalo igual ou inferior a 5%. Variável acima do critério tem o script corrigido e o estrato afetado coletado de novo. Se a recoleta não for possível, a variável é reportada com a taxa de erro medida e entra no cálculo da faixa da premissa que ela alimenta.

#### Amostra de auditoria do Bloco B2

O desenho combina um total calculado pelo critério de aceitação (Wilson) com a regra de inspeção em duas etapas usada no controle de qualidade por atributos (ABNT NBR 5426 `[AV]`). Cada estabelecimento é um estrato, e todos entram na amostra. O motivo é o padrão das falhas: elas tendem a se concentrar em certas páginas, e um estabelecimento fora da amostra esconderia a falha. Explicação em linguagem simples em `docs/pareceres/estatidez.md`.

| Passo | Procedimento |
|---|---|
| 1. Tamanho total | n = 200 avaliações. Pelo intervalo de Wilson, 200 conferências aprovam a variável com até 3 erros (limite superior de 4,3%); o mínimo para aprovar com zero erros seria 73. O tamanho quase não depende do total de avaliações coletadas: a correção para população finita muda o resultado em poucas unidades |
| 2. Mínimo por estabelecimento | 3 avaliações por estabelecimento, ou todas, se o estabelecimento tiver menos de 3 no recorte |
| 3. Alocação do restante | As avaliações que sobram depois dos mínimos são divididas na proporção do número de avaliações de cada estabelecimento no recorte, descontado o mínimo. O arredondamento segue o método dos maiores restos, para que a soma feche com 200 (diferença zero) |
| 4. Sorteio | Chave aleatória gerada com semente fixa e gravada como valor; dentro de cada estabelecimento, entram as avaliações de menor chave. Planilha com a semente, o hash SHA-256 da base de origem e as fórmulas da alocação e da seleção, registrada no repositório antes da primeira conferência |
| 5. Taxa de erro | Por variável, só com a primeira etapa: taxa sem ponderação, com o intervalo de Wilson, e taxa ponderada pelo peso de cada estabelecimento na base. O critério de 5% vale para as duas; se divergirem, prevalece a pior |
| 6. Segunda etapa | Estabelecimento com pelo menos um erro numa variável tem essa variável conferida em mais avaliações: todas as do recorte, se forem até 30; senão, as 20 seguintes na ordem da chave. A segunda etapa não entra na taxa geral, porque concentra a amostra onde já houve erro. Serve para diagnosticar falha concentrada: taxa acima de 5% no estabelecimento leva à correção do script e à recoleta do estabelecimento |

O erro da coleta não é tratado como restrito a uma variável. Falhas de paginação, de carregamento e de limite de pedidos afetam a inclusão do registro inteiro. Essas falhas tendem a se concentrar em grupos específicos, como estabelecimentos com muitas avaliações ou páginas com layout diferente. Erro concentrado em um grupo gera viés, e o tamanho da base não o dilui (Meng, 2018). Por isso, os registros com falha ou campo vazio são comparados aos completos por capital e faixa de volume. Diferença entre os dois grupos é reportada como limitação.

A validação cobre a relação entre o script e a página. A relação entre a página e a realidade é outra camada: estabelecimentos fora do Google Maps, avaliações falsas e autosseleção de quem avalia. Essa camada não é medida pela auditoria e fica declarada em §3.6.

### Bloco B4 - bases públicas

A extração por API copia tabelas inteiras. Não há sorteio nem página a ser lida, e o volume de séries é pequeno. A validação, então, é exaustiva: cada série usada no plano é reconciliada com a tabela publicada no portal da instituição, em ao menos um período e um recorte geográfico. Os totais são conferidos com a soma das linhas, conforme a regra de tabela agregada do projeto. As funções de conferência ficam nos próprios scripts `B4-b_*`.

Os erros mais prováveis são de processamento: código de variável ou de município trocado, filtro aplicado à série errada, unidade (mil, milhão, percentual) e índice de correção monetária. O erro da própria base não é validado pelo trabalho, e sim declarado em §3.6: amostra da POF e da PNAD Contínua, cobertura só do emprego formal no Novo CAGED e preço anunciado, não contratado, no FipeZap.

### Bloco B3 - contagem direta

A contagem não é censo. As quatro visitas são uma amostra de períodos, só em sexta e sábado à noite, para observar o movimento máximo. A escolha é deliberada: a contagem mede a ocupação no pico, não a média do dia. O erro amostral existe e é tratado pela faixa larga da premissa de circulação e pela análise de sensibilidade (§3.4).

O instrumento é o próprio observador, e não há gravação para auditar depois. A validação usa a consistência interna do registro e a comparação entre caminhos independentes:

| Checagem | Procedimento |
|---|---|
| Fechamento do saldo | Contagem inicial + entradas - saídas, comparada à contagem feita a cada 30 minutos. A diferença acumulada mede a omissão de registros na porta |
| Grupos sem saída | Grupos com entrada e sem saída registrada são contados à parte. Os que ainda estão no salão ao fim da visita são censurados; os demais são omissões |
| Caminhos independentes | Pessoas pela porta, pessoas pelos grupos de mesa e notas fiscais emitidas (piso, porque a nota só sai a pedido): as três estimativas de fluxo são comparadas por visita |

Dado não anotado é tratado como faltante. Não há imputação. A taxa de omissão de cada visita é reportada junto com as saídas. Quando a omissão for relevante, a estimativa de fluxo usa o caminho com menos falhas e a faixa da premissa aumenta. O script `B3-a_contagem.py` já conta à parte os grupos sem saída e os pedidos sem chegada (extra), sem imputação. O fechamento do saldo e a separação entre censura e omissão ainda precisam ser acrescentados a ele.
