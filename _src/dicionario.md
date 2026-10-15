# Dicionário de nomes

Convenções de nomeação de pastas, arquivos e variáveis do projeto, atuais e passadas. A convenção atual vale para tudo o que for criado ou renomeado; as passadas servem para ler commits, registros e arquivos antigos. Mudança de convenção entra aqui, com data, e no [registro de alterações](../docs/registro-de-alteracoes.md).

Legenda: `Bn` = código do bloco de dados (B1 a B4); `<x>` = parte variável; `[a|b]` = uma das opções.

## 1. Pastas

| Objeto | Convenção atual | Exemplo |
|---|---|---|
| Bloco em `_src/` | `[Bn] <Nome>`, o mesmo nome da pasta do bloco em `dados/` | `_src/[B1] Estabelecimentos e cardapios/` |
| Objeto dentro do bloco em `_src/` | `<Fonte> (<Objeto>)` quando a mesma fonte serve a mais de um objeto, senão só o objeto ou a fonte; maiúsculas e acento como na escrita normal | `Google Places (Negócios)`, `Google Places (Comentários)`, `Cardápios`, `CAGED` |
| Subpastas de cada objeto | `collect/`, `build/`, `analise/` (scripts por etapa), `webscripts/` (Tampermonkey e testes), `logs/` (fora do git) e `outros/` (módulos auxiliares e arquivos de apoio). As seis existem em todo objeto; pasta vazia leva `.gitkeep` | `Cardápios/outros/tessdata/` |
| Auxiliar comum a vários objetos do bloco | pasta `Comum/` no bloco, só com os módulos | `_src/[B4] Bases publicas/Comum/bases_comum.py` |
| Utilitários gerais | `_src/extras/` | `_src/extras/log_execucao.py` |
| Bloco em `dados/` | `[Bn] <Objeto>`: o código e o que os dados descrevem. Uma pasta por bloco | `dados/[B2] Avaliacoes recentes/` |
| Dados brutos | `dados/[Bn] <Objeto>/_dados-brutos/` (o `_` põe a pasta no topo da listagem); os processados ficam na raiz do bloco | `dados/[B4] Bases publicas/_dados-brutos/bcb/` |
| Subpastas dentro dos blocos de `dados/` | minúsculas, sem acento, palavras unidas por `_` (exceção: `_dados-brutos/`) | `acervo_jogos/`, `redes_sociais/analise_legendas/` |
| Etapas de uma seleção | número da ordem + `_` + etapa, dentro de uma pasta do objeto | `estabelecimentos/1_busca/`, `2_recorte/`, `3_triagem/` |
| Pasta por estabelecimento | `<prefixo>_<estabelecimento>/`, agrupada em `<prefixo>_<cidade>/`. Prefixo pelo tipo de material: `rs` (redes sociais), `ca` (cardápios originais). `<estabelecimento>`: perfil do Instagram em `rs`, nome curto em `ca`; `<cidade>`: capital da região metropolitana do endereço (a mesma das tabelas do B1). Ambos em minúsculas, sem acento, com `_` | `redes_sociais/rs_sao_paulo/rs_bodogami/`, `_dados-brutos/cardapios/ca_sao_paulo/ca_cartola/` |
| Pastas fora de uso | `arquivados/<código>-<tema>/`, com a estrutura da época | `arquivados/B5-jogos/` |

**Passadas**

| Até | Convenção | Mudou para |
|---|---|---|
| 12/10/2026 | Blocos por letra, A a F (A estabelecimentos, B avaliações, C histórico dos avaliadores, D contagem, E bases públicas, F jogos), pastas `[A] Nome` | `[Bn] Nome`, B1 a B6 |
| 13/10/2026 | Subpastas com maiúscula, acento e espaço (`Acervo de Jogos/`, `Cardápios/`, `Redes Sociais/Analise das legendas/`, `Mercado e demanda/`) | minúsculas, sem acento, com `_` |
| 14/10/2026 | `_data/raw/[Bn] Nome/` (brutos) e `_data/processed/[Bn] Nome/` (processados) | `dados/[Bn] Nome/dados-brutos/` e `dados/[Bn] Nome/` |
| 14/10/2026 | `site-apresentacao/` e `app-observacao/` na raiz | dentro de `_src/` |
| 14/10/2026 | Scripts soltos na pasta do bloco; webscripts juntos em `_src/Web scripts/`; logs em `_src/_logs/` | subpastas por etapa em cada bloco |
| 14/10/2026 | Pastas de `_src/` por fonte: `[B1] Acervo de Jogos`, `[B1] Cardapios`, `[B1] Google Places (estabelecimentos)`, `[B1] Instagram`, `[B2] Google Places (comentarios)`, `[B3] Contagem direta de ocupacao`, `[B4] Bases publicas` (scripts de todas as fontes juntos) | `_src/[Bn] Nome/<Objeto>/`, com o nome do bloco igual ao de `dados/` |
| 14/10/2026 | `dados/[Bn] Nome/dados-brutos/` | `dados/[Bn] Nome/_dados-brutos/` |
| 14/10/2026 | Utilitários soltos na raiz de `_src/` (`gerar_carregadores.py`, `gerar_docx_*.js`, `log_execucao.py`, `sincronizar_vault.sh`, `carregadores/`) | `_src/extras/` |

## 2. Scripts

| Objeto | Convenção atual | Exemplo |
|---|---|---|
| Script Python de etapa | `[Bn]-[c\|b\|a]_<objeto>.py`: código do bloco ao qual o objeto da ação pertence, hífen, primeira letra da ação (`c` collect, coleta; `b` build, tratamento; `a` analise), `_`, descrição do objeto em minúsculas com `_`. Fica na subpasta da etapa | `build/B1-b_cardapios_ocr.py`, `analise/B1-a_grafico_limiares.py` |
| Módulo auxiliar | `<tema>_<comum\|client>.py` ou nome do que faz, sem código de bloco nem etapa; fica em `outros/` | `outros/bases_comum.py`, `outros/places_client.py`, `outros/recorte_rm.py` |
| Webscript (Tampermonkey) | `<site>_<objeto>.user.js`; teste ao lado, `<mesmo nome>.test.cjs` | `maps_avaliacoes.user.js`, `maps_avaliacoes.test.cjs` |
| Versão do webscript (`@version`) | `AAAA.MM.DD-n` (n-ésima versão do dia) | `2026.10.13-7` |
| Utilitário geral | verbo no infinitivo + objeto, em `_src/extras/` | `gerar_carregadores.py`, `sincronizar_vault.sh`, `log_execucao.py` |

Nomes com hífen não podem ser importados como módulo Python. Por isso, código usado por mais de um script vai para um módulo auxiliar em `outros/`, nunca para um script de etapa.

**Passadas**

| Até | Convenção | Exemplo |
|---|---|---|
| 12/10/2026 | `<etapa>_bloco_<letra>_<conteúdo>.py` e prefixos soltos do desenho anterior (`bloco_b_*`, `collect_bases_*`, `contagem_*`, `cardapios_*`) | `collect_bloco_b_details.py`, `build_bloco_c_analise.py` |
| 14/10/2026 | `<etapa>_Bn_<conteúdo>.py`, com etapa `collect`, `build` ou `analise` (no B5, também `scrape`) | `build_B1_cardapios_ocr.py`, `analise_B1_grafico_limiares.py` |

## 3. Arquivos de dados

| Objeto | Convenção atual | Exemplo |
|---|---|---|
| Saída de script (B1 a B3) | `Bn_<objeto>[_<recorte>][_<filtro>][_<limiar>].<ext>`, com os códigos da tabela abaixo; sem palavras que a pasta ou a extensão já dizem (`planilha_`, `grafico_`, `por_filtro`, `avaliacoes`) | `B1_curadoria_metro_f_av100.csv`, `B1_limiares_regio_f.png` |
| Saída do B4 | `[B4] {dado principal} {período} ({fonte}).csv`, na subpasta de uso (`mercado_demanda/`, `ponto_operacoes/`, `juridico_tributario/`, `financeiro/`, `multiuso/`) | `[B4] Aluguel Comercial por Capital 2026-07 (FipeZap).csv` |
| Resposta bruta de API do B4 | `<série>_<código>_<descrição>.json` ou `<fonte>_<conteúdo>.json`, na subpasta da fonte | `bcb/sgs_1619_salario_minimo.json` |
| Cache bruto do Google Places e afins | `Bn_<conteúdo>.jsonl` (fora do git) | `B1_detalhes.jsonl` |
| Coleta de rede social | `AAAA-MM-DD_<estabelecimento>_instagram_<perfis\|posts\|seguindo>.csv`; duplicata do mesmo dia leva `_2`. As listas `seguindo` (snowball) ficam em `_dados-brutos/redes_sociais/seguindo/`, fora do git; o build gera `B1_snowball_candidatos_grau3.csv` (recorte para classificar) e `B1_snowball_proximas_sementes.{csv,txt}` (fila de sementes) | `2026-10-11_bodogami_instagram_posts.csv` |
| Coleta de avaliações do Maps | `AAAA-MM-DD_<lugar>_maps_avaliacoes_<periodo\|filtros\|tudo>.csv` | `2026-10-13_boardz_game_pub_maps_avaliacoes_tudo.csv` |
| Exportação do app de observação | `contagem_<conteúdo>.csv` | `contagem_visitas.csv`, `contagem_30min.csv` |
| Log de execução | `<script>_AAAA-MM-DD_HHMM.log`, em `logs/` do bloco (fora do git) | `B1-b_planilha_2026-10-14_0930.log` |

Códigos das partes do nome das saídas:

| Parte | Código | Significado |
|---|---|---|
| Recorte | `metro` | metrópoles da REGIC |
| Recorte | `regio` | capitais regionais da REGIC |
| Filtro | `f` | filtrada por termos suspeitos |
| Limiar | `av100` | mais de 100 avaliações (> 100) |
| Limiar | `av50` | 50 avaliações ou mais (≥ 50) |
| Variante | `pct` | em percentual |

**Passadas**

| Até | Convenção | Mudou para |
|---|---|---|
| 12/10/2026 | `bloco_<letra>_<conteúdo>.csv`; `[E] *.csv` nas bases públicas | `Bn_<conteúdo>`; `[B4] ….csv` |
| 12/10/2026 | `instagram_<perfis\|posts>_<perfil>_<data>.csv`, duplicatas com ` (1)` | `AAAA-MM-DD_<perfil>_instagram_<perfis\|posts>.csv`, duplicatas com `_2` |
| 13/10/2026 | `maps_avaliacoes_<lugar>_<sufixo>_<data UTC>.csv` | `AAAA-MM-DD_<lugar>_maps_avaliacoes_<…>.csv`, data local |
| 14/10/2026 | Saídas do B1 soltas na raiz do bloco, com nomes por extenso (`B1_planilha_curadoria_metropoles_filtrada_mais_100_avaliacoes.csv`, `B1_luderias_aprovadas_metropoles_mais_100_avaliacoes.xlsx`, `B1_grafico_limiares_capitais_regionais_filtrada.png`, `B1_descartados_por_filtro.csv`) | `estabelecimentos/<n>_<etapa>/` e `entorno/`, com os códigos (`B1_curadoria_metro_f_av100.csv`, `B1_aprovadas_metro_av100.xlsx`, `B1_limiares_regio_f.png`, `B1_descartados.csv`) |
| 14/10/2026 | Coletas do Instagram soltas em `redes_sociais/`; cardápios originais em `cardapios/<Nome do estabelecimento>/` (com espaço e acento, às vezes com `Cardápio ` na frente) | `redes_sociais/rs_<cidade>/rs_<perfil>/`; `_dados-brutos/cardapios/ca_<cidade>/ca_<estabelecimento>/` |
| 14/10/2026 | Brutos do Google Places soltos em `_dados-brutos/` | `_dados-brutos/estabelecimentos/` |
| 14/10/2026 | Originais transcritos à mão soltos em `_dados-brutos/cardapios/` (`<estabelecimento>_cardapio*.{pdf,html,jpg}`) ou em pastas sem prefixo (`boardz/`, `castelos/`, `placegames/`) | `_dados-brutos/cardapios/ca_<cidade>/ca_<estabelecimento>/` |

## 4. Colunas (variáveis) dos dados

### 4.1 Nome da coluna

Há dois tipos de tabela, e o nome da coluna segue o tipo:

- **Tabela de trabalho** (lida por outro script ou pelo autor para conferir): minúsculas, sem acento, palavras unidas por `_` (`snake_case`).
- **Tabela de leitura** (vai para o texto ou para um apêndice): cabeçalho por extenso, com acento e unidade entre parênteses, como `valor mínimo (R$)`. Contagem não exclusiva declara isso no nome, como `categoria (não exclusiva)`, e não tem linha de total por soma (regra do `CLAUDE.md`).

Prefixos e sufixos da tabela de trabalho:

| Parte | Significado | Exemplos |
|---|---|---|
| `n_` | número de unidades contadas (posts, casas, mídias) | `n_posts_periodo`, `n_casas_acervo` |
| `qt_` | quantidade de pontos de interesse num raio | `qt_estacoes_metro_500m` |
| `tem_`, `na_`, `ja_` | sim/não sobre uma condição | `tem_instagram`, `na_curadoria`, `ja_aprovada` |
| `_rs` | valor em reais | `aluguel_rs`, `preco_rs` |
| `_pct` | percentual, de 0 a 100 | `venda_var_12m_pct` |
| `_m2` | por metro quadrado | `locacao_preco_m2` |
| `_<n>m` | raio em metros (`_500m`, `_1000m`) ou janela em meses (`_6m`, `_12m`), conforme o nome | `qt_shoppings_grandes_1000m`, `ativo_6m` |
| `_min`, `_max`, `_media`, `_mediana`, `_dp` | mínimo, máximo, média, mediana e desvio-padrão | `jogadores_min`, `aluguel_mediana_rs`, `venda_dp_rs` |
| `_minutos` | duração em minutos (nova; ver exceções) | `permanencia_minutos` |
| `_de`, `_ate` | início e fim de um intervalo | `periodo_de`, `periodo_ate` |
| `_em` | data e hora de um evento | `coletado_em`, `baixado_em` |
| `data`, `data_<x>`, `<x>_data` | data | `data_coleta` |
| `_id`, `id_` | identificador | `place_id`, `review_id`, `id_notion` |
| `link_`, `url` | endereço web | `link_google_maps`, `url_fonte` |
| `min_<n>` | estabelecimentos com pelo menos `n` avaliações (tabela de limiares) | `min_100`, `min_100_ativos` |

**Exceções existentes:** `duracao_min` (banco de jogos) e `tempo_min` (`B1_jogos_covil.csv`) estão em **minutos**, não são mínimos. Colunas novas de duração usam `_minutos`. `REGIC` está em maiúsculas por ser sigla da fonte.

### 4.2 Valores das colunas

Valem para arquivos novos e para os existentes quando o script que os gera for alterado. Arquivos já gerados não são convertidos só para seguir a regra, porque isso mudaria saídas já conferidas.

| Tipo | Convenção atual | Situação nos arquivos existentes |
|---|---|---|
| Sim/não | `sim` / `nao` (minúsculas, sem acento) | maioria; há `0`/`1` (ex.: `restaurante_mesma_data` no registro prévio) e `True`/`False` (matriz de codificação do B2, colunas de cobertura do FipeZap) |
| Ausente | célula vazia; nunca `NA`, `-` ou `0` | — |
| Data | `AAAA-MM-DD` | todos |
| Data e hora | `AAAA-MM-DD HH:MM` (ou `:SS`), hora de Salvador | todos |
| Data relativa do Google Maps | o rótulo por extenso, como aparece na página (ex.: `3 meses atrás`), ao lado da data estimada | códigos abreviados (`3m`, `2d`) e por extenso conviviam na planilha de comentários e no Notion até 13/10/2026 |
| Número decimal | ponto (`12.5`), sem separador de milhar | `preco_rs` e `valor_rs` das transcrições de cardápio usam vírgula |
| Moeda | número em reais, sem `R$` no valor (o `R$` vai no nome da coluna) | — |
| Percentual | número de 0 a 100 em coluna `_pct`; proporção de 0 a 1 só com `prop_` no nome | — |
| Categoria | rótulo curto em minúsculas, sem acento, com `_` (`casa_de_jogos`), ou sigla do livro de códigos (`PRC`, `OCA:fam`) | rótulos com espaço e acento (`casa de jogos`, `loja com espaço de jogo`) nas saídas do Instagram |
| Lista dentro da célula | itens separados por ` \| ` | `;` em `categorias_google` e espaço em `tipos_google` (como vieram da API) |
| Texto | como na fonte, sem cortar; quebras de linha preservadas entre aspas | — |

### 4.3 Formato do arquivo CSV

- Separador `;`, codificação UTF-8 com BOM (abre direto no Excel em português). Dos 171 CSV versionados em 14/10/2026, 136 usam `;` e 100 têm BOM. Os de `,` vêm de fontes ou userscripts antigos.
- Fim de linha: o padrão do módulo `csv` do Python (`\r\n`). Scripts que reescrevem um CSV preservam o fim de linha original.

## 5. Variáveis no código

| Objeto | Convenção atual | Exemplo |
|---|---|---|
| Raiz do projeto | `ROOT = Path(__file__).resolve().parents[4]` em scripts de etapa e auxiliares de `outros/` (`parents[3]` em `Comum/`; antes, em 14/10/2026, `parents[3]` e, até então, `parents[2]`) | — |
| Caminhos fixos | constantes em maiúsculas no topo do script, em português nos scripts novos: `BRUTOS` (pasta `_dados-brutos/` do bloco), `PROCESSADOS` (raiz do bloco em `dados/`), `ENTRADA`, `SAIDA` | `SAIDA = PROCESSADOS / "B1_entorno.csv"` |
| Nomes antigos equivalentes | `RAW`/`RAW_DIR`/`BRUTO` = brutos; `PROCESSED`/`PROCESSED_DIR`/`PASTA` = processados; `OUT_PATH`/`*_PATH` = arquivo de saída ou de entrada. Não são renomeados sem outra mudança no script | — |
| Funções e variáveis | `snake_case`, em português | `caminho_saida`, `conferir_capitais` |
| Classes | `CamelCase` | `PlacesClient`, `OverpassClient` |
| Bloco de abertura dos scripts de etapa | inclui `_src/extras/`, `outros/` do objeto e, no B4, `Comum/` no caminho de importação e liga o log (`registrar_execucao`) quando o script é executado diretamente | ver qualquer script de `collect/` |

## 6. Outros nomes do projeto

| Objeto | Convenção atual | Exemplo |
|---|---|---|
| Nota de estudo | `docs/notas/AAAA-MM-DD_<termo>.md` | `2026-10-14_vpl.md` |
| Capítulo | `textos/capitulos/<n>_<tema>_plano_luderia.md` | `1_introducao_plano_luderia.md` |
| Instrumento de pesquisa | `textos/instrumentos/<tema>_<bloco>.md` | `analise_conteudo_bardin_B2.md` |
| Versão do app de observação | `versionName` `AAAA.MM.DD-n`; APK `ObservacaoLuderia-<versionName>.apk` | `ObservacaoLuderia-2026.10.14-1.apk` |
