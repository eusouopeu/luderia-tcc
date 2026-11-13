# Dicionário de nomes

Convenções de nomeação de pastas, arquivos e variáveis do projeto, atuais e passadas. A convenção atual vale para tudo o que for criado ou renomeado; as passadas servem para ler commits, registros e arquivos antigos. Mudança de convenção entra aqui, com data, e na mensagem do commit.

Legenda: `Bn` = código do bloco de dados (B1 a B4); `<x>` = parte variável; `[a|b]` = uma das opções.

## 1. Pastas

| Objeto | Convenção atual | Exemplo |
|---|---|---|
| Coleta em `_src/` | `_src/pyScripts/B<n>_<Coleta>/`, uma pasta por coleta de `dados/`, com a inicial maiúscula | `_src/pyScripts/B4_Marketing/`, `_src/pyScripts/B5_Mobiliario/` |
| Subpastas de cada coleta em `_src/` | `1_collect/`, `2_build/`, `3_analise/` (scripts por etapa), `4_logs/` (fora do git) e `5_outros/` (módulos auxiliares e arquivos de apoio). As cinco existem em toda coleta; pasta vazia leva `.gitkeep` | `B1_Cardapios/5_outros/tessdata/` |
| Auxiliar comum a várias coletas do bloco | no B4, `B4_Multiuso/5_outros/` (módulos) e `B4_Multiuso/3_analise/` (script que vale para todas as fontes) | `_src/pyScripts/B4_Multiuso/5_outros/bases_comum.py`, `B4_Multiuso/3_analise/B4a_auditoria_bases.py` |
| Utilitários gerais | `_src/outros/G<n>_<função>/`: `G1_planilhas`, `G2_graficos`, `G3_modelo_financeiro`, `G4_textos`, `G5_outros`; os apps em `App_<Nome>/` | `_src/outros/G5_outros/log_execucao.py` |
| Webscripts (Tampermonkey) | `_src/webScripts/B<n>_<nome>/`, uma pasta por bloco, com o script (`<conteúdo>.user.js`) e o teste (`<conteúdo>.test.cjs`) lado a lado; carregadores em `_src/webScripts/_carregadores/` (fora do git) e kit dos painéis em `_src/webScripts/_kit_painel/` | `_src/webScripts/B1_estabelecimentos/maps_entorno.user.js` |
| Coleta em `dados/` | `B<n>_<coleta>/`, direto na raiz de `dados/`: o código do bloco e o que a coleta descreve. B4: uma por uso (`USOS`); B5: `aluguel`, `reforma` (obra e SINAPI) e `mobiliario` (mobiliário, cozinha e bar, equipamentos, jogos e o orçamento) | `dados/B1_entorno/`, `dados/B4_financeiro/` |
| Subpastas de cada coleta | `_dados-brutos/` (brutos), `_auditoria/` (amostras de conferência) e `_dados-agregados/` (tabelas e gráficos tratados); o `_` põe as três no topo da listagem. Em cada uma, `_arquivo/` guarda as versões anteriores. Coleta com mais de uma fonte nos brutos separa por fonte | `dados/B4_financeiro/_dados-brutos/bcb/`, `dados/B1_entorno/_dados-agregados/_arquivo/` |
| Subpastas dentro das coletas | minúsculas, sem acento, palavras unidas por `_` (exceção: `_dados-brutos/`, `_dados-agregados/`) | `_dados-agregados/analise_legendas/`, `_dados-brutos/acervos_luderias/` |
| Amostras de auditoria | `_auditoria/` da coleta que a amostra confere (no B4, `_auditoria/<fonte>/`), com `<Bn>_auditoria_<objeto>.csv` e `auditoria_registro.csv` (uma linha por sorteio) | `dados/B1_entorno/_auditoria/B1_auditoria_entorno_itens.csv` |
| Etapas de uma seleção | número da ordem + `_` + etapa, dentro de `_dados-agregados/` da coleta | `B1_estabelecimentos/_dados-agregados/1_busca/`, `2_recorte/`, `3_triagem/` |
| Pasta por estabelecimento | `<prefixo>_<estabelecimento>/`, agrupada em `<prefixo>_<cidade>/`. Prefixo pelo tipo de material: `rs` (redes sociais), `ca` (cardápios originais). `<estabelecimento>`: perfil do Instagram em `rs`, nome curto em `ca`; `<cidade>`: capital da região metropolitana do endereço (a mesma das tabelas do B1). Ambos em minúsculas, sem acento, com `_` | `B1_redes_sociais/_dados-agregados/rs_sao_paulo/rs_bodogami/`, `B1_cardapios/_dados-brutos/ca_sao_paulo/ca_cartola/` |
| Saídas que juntam blocos | `textos/graficos/` (gráficos dos capítulos na raiz, `<cap>-<ordem>_<conteúdo>.png`, ex.: `5-1_casas_por_metropole.png`, apêndice com a letra, `G-1_monte_carlo.png`; os só das planilhas em `agregados/` e `comentarios/`, `NN_<conteúdo>.png`), `textos/figuras/` (diagramas, desenhos, fotos e modelos, mesmo padrão de nome), `textos/quadros/` e `textos/planilhas/` (DMax por bloco e modelo financeiro) | `textos/planilhas/B4_dados_agregados_DMax.xlsx` |
| Bibliografia | `bibliografia/F1_Legislacao/`, `F2_Relatorios/`, `F3_Livros/`, `F4_TCC_plano_negocios/`, `F5_Outros/` (artigos, dissertações); PDFs fora do git | `bibliografia/F3_Livros/` |
| Pastas fora de uso | `~/Documents/arquivados/<código>-<tema>/` (fora do repositório), com a estrutura da época | `~/Documents/arquivados/B5-jogos/` |

**Passadas**

| Até | Convenção | Mudou para |
|---|---|---|
| 12/10/2026 | Blocos por letra, A a F (A estabelecimentos, B avaliações, C histórico dos avaliadores, D contagem, E bases públicas, F jogos), pastas `[A] Nome` | `[Bn] Nome`, B1 a B6 |
| 13/10/2026 | Subpastas com maiúscula, acento e espaço (`Acervo de Jogos/`, `Cardápios/`, `Redes Sociais/Analise das legendas/`, `Mercado e demanda/`) | minúsculas, sem acento, com `_` |
| 14/10/2026 | `_data/raw/[Bn] Nome/` (brutos) e `_data/processed/[Bn] Nome/` (processados) | `dados/[Bn] Nome/dados-brutos/` e `dados/[Bn] Nome/` |
| 14/10/2026 | `site-apresentacao/` e `app-observacao/` na raiz | dentro de `_src/` |
| 14/10/2026 | Scripts soltos na pasta do bloco; webscripts juntos em `_src/Web scripts/`; logs em `_src/_logs/` | subpastas por etapa em cada bloco |
| 14/10/2026 | Pastas de `_src/` por fonte: `[B1] Acervo de Jogos`, `[B1] Cardapios`, `[B1] Google Places (estabelecimentos)`, `[B1] Instagram`, `[B2] Google Places (comentarios)`, `[B3] Contagem direta de ocupacao`, `B4_bases_publicas` (scripts de todas as fontes juntos) | `_src/[Bn] Nome/<Objeto>/`, com o nome do bloco igual ao de `dados/` |
| 14/10/2026 | `dados/[Bn] Nome/dados-brutos/` | `dados/[Bn] Nome/_dados-brutos/` |
| 14/10/2026 | Utilitários soltos na raiz de `_src/` (`gerar_carregadores.py`, `gerar_docx_*.js`, `log_execucao.py`, `sincronizar_vault.sh`, `carregadores/`) | `_src/outros/` |
| 12/11/2026 | Uma pasta por bloco em `dados/` (`dados/[Bn] Nome/`, processados na raiz e brutos em `_dados-brutos/<objeto>/`, auditorias em `_dados-brutos/<objeto>/auditoria/`; no B4, processados por uso e brutos por fonte) | uma pasta por coleta, `dados/B<n>_<coleta>/`, com `_dados-brutos/`, `_auditoria/` e `_dados-agregados/`, cada uma com `_arquivo/`; no B4, uma coleta por uso, com os brutos de cada fonte no uso de `FONTE_USO` |
| 13/11/2026 | B4 por uso `mercado_demanda`, `ponto_operacoes`, `juridico_tributario`; B5 em `acervo_jogos`, `cozinha_bar`, `equipamentos`, `mobiliario`, `obra_reforma` e `orcamento`; `dados/dados_agregados/` (DMax e gráficos); `textos/capitulos/_md/`, `textos/planejamento/`, `textos/instrumentos/`; `_src/outros/Gerar_*` e `_src/Modelo financeiro/analise/`; `arquivados/` no repositório | B4 `marketing`, `operacional`, `juridico`; B5 `aluguel`, `reforma`, `mobiliario`; `textos/planilhas/` e `textos/graficos/`; `textos/capitulos/`, `textos/_planejamento/`, `textos/_planejamento/_instrumentos/`; `_src/outros/G<n>_*`; `~/Documents/arquivados/` |
| 13/11/2026 | Webscripts em `_src/webScripts/[Bn] Nome/` (`[B1] Estabelecimentos e cardapios`, `[B2] Avaliacoes recentes`, `[B4] Bases publicas`, `[B5] Ativos fixos`) | `_src/webScripts/B<n>_<nome>/` (`B1_estabelecimentos`, `B2_avaliacoes_recentes`, `B4_bases_publicas`, `B5_ativos_fixos`) |
| 12/11/2026 | `webscripts/` em cada objeto de `_src/[Bn] Nome/`; carregadores em `_src/outros/carregadores/` e kit dos painéis em `_src/outros/kit_painel/` | `_src/webScripts/B<n>_<nome>/`; `_src/webScripts/_carregadores/` e `_src/webScripts/_kit_painel/` |

## 2. Scripts

| Objeto | Convenção atual | Exemplo |
|---|---|---|
| Script Python de etapa | `[Bn][c\|b\|a]_<objeto>.py`: código do bloco ao qual o objeto da ação pertence, primeira letra da ação colada ao código (`c` collect, coleta; `b` build, tratamento; `a` analise), `_`, descrição do objeto em minúsculas com `_`. Fica na subpasta da etapa; o log em `4_logs/` leva o mesmo nome | `2_build/B1b_cardapios_ocr.py`, `3_analise/B1a_grafico_limiares.py` |
| Módulo auxiliar | `<tema>_<comum\|client>.py` ou nome do que faz, sem código de bloco nem etapa; fica em `outros/` | `outros/bases_comum.py`, `outros/places_client.py`, `outros/recorte_rm.py` |
| Webscript (Tampermonkey) | `<objeto>.user.js`, ou `<site>_<objeto>.user.js` quando há mais de um script do objeto; teste ao lado, `<mesmo nome>.test.cjs`; itens do menu em `lista_<mesmo nome>.js` | `aluguel.user.js`, `aluguel.test.cjs`, `lista_aluguel.js`; `maps_avaliacoes.user.js` |
| Versão do webscript (`@version`) | `AAAA.MM.DD-n` (n-ésima versão do dia) | `2026.10.13-7` |
| Painel do webscript | kit comum `_src/webScripts/_kit_painel/kit_painel.js`, copiado para dentro do script entre `// >>> kit_painel` e `// <<< kit_painel` por `node _src/webScripts/_kit_painel/embutir.js` (não editar a cópia); o teste `kit_painel.test.cjs` falha se alguma cópia ficar velha. Usam o kit: coletor e snowball do Instagram, cardápios e acervos | `const kit = kitPainel({ id: 'acv' })` |
| Utilitário geral | verbo no infinitivo + objeto, em `_src/outros/` | `gerar_carregadores.py`, `sincronizar_vault.sh`, `log_execucao.py` |

Nomes com hífen não podem ser importados como módulo Python. Por isso, código usado por mais de um script vai para um módulo auxiliar em `outros/`, nunca para um script de etapa.

**Passadas**

| Até | Convenção | Exemplo |
|---|---|---|
| 12/10/2026 | `<etapa>_bloco_<letra>_<conteúdo>.py` e prefixos soltos do desenho anterior (`bloco_b_*`, `collect_bases_*`, `contagem_*`, `cardapios_*`) | `collect_bloco_b_details.py`, `build_bloco_c_analise.py` |
| 14/10/2026 | `<etapa>_Bn_<conteúdo>.py`, com etapa `collect`, `build` ou `analise` (no B5, também `scrape`) | `build_B1_cardapios_ocr.py`, `analise_B1_grafico_limiares.py` |
| 13/11/2026 | `[Bn]-[c\|b\|a]_<objeto>.py`, com hífen entre o bloco e a etapa (scripts e logs) | `B1-b_cardapios_ocr.py`, `B1-a_grafico_limiares.py` |
| 13/11/2026 | webscripts `acervo_coletor`, `cardapio_coletor`, `instagram_coletor`, `portais_aluguel` e `precos_itens` (`.user.js` e `.test.cjs`), com a lista do menu dentro do script | `precos_itens.user.js` (hoje `mobiliario.user.js`) |

## 3. Arquivos de dados

| Objeto | Convenção atual | Exemplo |
|---|---|---|
| Saída de script (B1 a B3) | `Bn_<objeto>[_<recorte>][_<filtro>][_<limiar>].<ext>`, com os códigos da tabela abaixo; sem palavras que a pasta ou a extensão já dizem (`planilha_`, `grafico_`, `por_filtro`, `avaliacoes`) | `B1_curadoria_metro_f_av100.csv`, `B1_limiares_regio_f.png` |
| Figura de script (B1 e B2) | `Bn_<objeto>` para gráficos, `Bn_mapa_<variável>_<metro\|regiao>` para cartogramas `Bn_pict_<variável>` para pictogramas e `Bn_nuvem_palavras[_<recorte>]` para nuvens de palavras; cada figura em três subpastas: `png/` (300 dpi, para o .docx), `svg/` (texto editável) e `valores/` (CSV com os números desenhados). No B1, em `estabelecimentos/5_graficos/<graficos\|cartogramas\|pictogramas>/`; no B2, em `graficos/` | `5_graficos/cartogramas/png/B1_mapa_nota_metro.png`, `graficos/svg/B2_pict_temas.svg` |
| Saída do B4 | `[B4] {dado principal} {período} ({fonte}).csv`, em `dados/B4_<uso>/_dados-agregados/` (usos: `marketing`, `operacional`, `juridico`, `financeiro`, `multiuso`) | `[B4] Aluguel Comercial por Capital 2026-07 (FipeZap).csv` |
| Resposta bruta de API do B4 | `<série>_<código>_<descrição>.json` ou `<fonte>_<conteúdo>.json`, em `_dados-brutos/<fonte>/` da coleta do uso (`FONTE_USO`) | `B4_financeiro/_dados-brutos/bcb/sgs_1619_salario_minimo.json` |
| Cache bruto do Google Places e afins | `Bn_<conteúdo>.jsonl` (fora do git) | `B1_detalhes.jsonl` |
| Coleta de rede social | `AAAA-MM-DD_<estabelecimento>_instagram_<perfis\|posts\|seguindo>.csv`; duplicata do mesmo dia leva `_2`. As listas `seguindo` (snowball) ficam em `dados/B1_redes_sociais/_dados-brutos/seguindo/`, fora do git; o build gera `B1_snowball_candidatos_grau3.csv` (recorte para classificar) e `B1_snowball_proximas_sementes.{csv,txt}` (fila de sementes) | `2026-10-11_bodogami_instagram_posts.csv` |
| Coleta de avaliações do Maps | `AAAA-MM-DD_<lugar>_maps_avaliacoes_<periodo\|filtros\|tudo>.csv` | `2026-10-13_boardz_game_pub_maps_avaliacoes_tudo.csv` |
| Exportação do app de observação | `contagem_<conteúdo>.csv` | `contagem_visitas.csv`, `contagem_30min.csv` |
| Log de execução | `<script>_AAAA-MM-DD_HHMM.log`, em `logs/` do bloco (fora do git) | `B1b_planilha_2026-10-14_0930.log` |
| PDF da bibliografia | `Sobrenome[ e Sobrenome \| et al.] (ano) - Título curto.pdf`; TCC com a sigla da instituição no fim; sem autor, `Sem autor (s.d.)`. Trecho fotografado, em `trechos_citados/`, `Autor (ano) - p. <páginas>.pdf` | `F3_Livros/Assaf Neto (2014) - Finanças corporativas e valor.pdf`, `F4_TCC_plano_negocios/Coelho (2021) - Plano de negócios Casa 388 bar e restaurante (UFMG).pdf` |

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

### 4.4 Grupos de estação do entorno (B1)

Cada resultado do coletor de entorno (`maps_entorno.user.js`) cai em um só grupo, pela categoria e pelo nome no Google Maps, nunca pela busca que o trouxe. No resumo do coletor, `qt_estacoes_<grupo>_<raio>m` e `dist_estacoes_<grupo>_mais_proxima_m`; no `B1_resumo_estabelecimentos.xlsx`, `<grupo>_<raio>m` e `dist_<grupo>_m`.

| Grupo | O que entra | Desde |
|---|---|---|
| `metro` | metrôs, inclusive o monotrilho das linhas 15 e 17 de São Paulo quando o Maps o põe na categoria de metrô | 13/10/2026 |
| `trem` | trens metropolitanos (CPTM, SuperVia, Trensurb), pelo operador mesmo na categoria de metrô | 15/10/2026 |
| `vlt` | VLT (Carioca, Baixada Santista, Fortaleza, Salvador), bonde de uso urbano, aeromóvel de Porto Alegre, monotrilho fora da categoria de metrô | 12/11/2026 (coletor 2026.11.12-2) |
| `brt` (retirado) | BRT e estações-tubo da RIT de Curitiba (ônibus): fora da coleta desde o coletor 2026.11.13-2; estação de BRT trazida por outra busca cai em `outro` | 12 a 13/11/2026 |
| `trilhos` (derivado) | `metro` + `trem` + `vlt`; vazio se algum dos três ficou vazio | 12/11/2026 |
| `vlt_brt` (antigo) | VLT ou BRT, sem separação: coletas até o coletor 2026.11.12-1 (15/10/2026); no resumo do B1, vazio nas coletas novas | 13/10 a 12/11/2026 |

Coleta antiga (só `vlt_brt`): `vlt` fica vazio, nunca zero; `trilhos` só sai onde VLT = 0 é certo (`vlt_brt` = 0 no raio, ou busca de VLT dispensada na cidade).

### 4.5 Situação da coleta (vocabulário único)

Toda tabela de cobertura (uma linha por unidade da população) diz, na coluna `situacao`, o que se sabe da coleta daquela unidade. O valor começa por uma das quatro palavras; depois de ":" vem o motivo, quando houver (`refazer: lista parou de crescer`).

| Valor | Significado | Números da linha |
|---|---|---|
| `ok` | coleta completa, com resultado | os medidos |
| `vazia` | coleta completa, zero itens no recorte; há marcador que prova a coleta | 0 |
| `refazer` | coleta incompleta ou incerta (parou antes do fim, falhou, dado inconsistente) | os lidos, ou vazios se nada foi lido |
| `coletar` | sem registro de coleta | vazios, nunca 0 |

Onde fica o marcador de cada coletor (levantamento de 12/11/2026; mudou só o que tem build que depende da distinção):

| Coletor | O que é "vazio" | Marcador | Build que lê | Mudou? |
|---|---|---|---|---|
| `maps_avaliacoes.user.js` (B2) | lugar sem avaliação no recorte | CSV-resumo por lugar, `AAAA-MM-DD_<lugar>_maps_avaliacoes_resumo.csv`, baixado sempre, mesmo com zero lidas (desde 2026.11.12-2) | `B2b_avaliacoes.py` (`resumos/`) | sim |
| `maps_horarios_pico.user.js` (B1) | lugar sem gráfico de "Horários de pico" | linha do lugar no CSV, com `situacao` = "sem horários de pico" (já existia) | `B1a_horarios_pico.py` (vazia, refazer, coletar) | só o build |
| `maps_entorno.user.js` (B1) | nenhuma estação ou shopping no raio | linha do lugar no resumo com contagem 0 (branco = busca não feita) e `situacao` | `B1b_resumo.py` | não (já distingue) |
| `instagram.user.js` (B1) | perfil sem post no período | linha do perfil no CSV de perfis, baixado sempre ao fim de cada coleta (mesmo com o download automático desligado), com `situacao` (desde 2026.11.12-2) | Notion "A - Estabelecimentos" | sim (só o marcador) |
| `instagram_snowball.user.js` (B1) | perfil sem lista de "seguindo" | CSV de seguindo, sempre baixado | `B1b_instagram_seguindo.py` (não depende) | não |
| `cardapio.user.js` (B1) | casa sem cardápio | `B1_busca_minuciosa_taxa_cardapio_acervo.csv` (busca à mão); no menu do painel, a última extração sem itens fica `refazer` (!) e a de fontes divergentes, `conferir` (◐) (desde 2026.11.12-2) | `B1b_cardapios_planilha.py` (não depende) | não |
| `acervo.user.js` (B1) | acervo publicado sem título | `AAAA-MM-DD_<chave>_acervo.csv`, baixado sempre, com `situacao` (uma linha de jogo vazio quando `vazia`) | `B1c_jogos_dos_acervos.py` lê o `ludopedia_<chave>.txt` (não depende do CSV) | novo (12/11/2026) |
| `acervo.user.js` (B1), varredura | casa do B1 sem acervo em nenhuma das três plataformas | `AAAA-MM-DD_acervos_varredura.csv`, uma linha por casa e acervo achado (não exclusiva) e uma sem fonte para a casa sem achado; `situacao` coletar, vazia ou refazer | nenhum script lê ainda | novo (12/11/2026) |
| `mobiliario.user.js` (B5) | item sem oferta | nenhum; item sem preço sai da soma, buscado ou não | `B5b_orcamento_itens.py` (não depende: a cobertura de itens com preço decide) | não |
| `aluguel.user.js` (B5) | busca sem anúncio | parada "página vazia" no painel | `B5b_anuncios_aluguel.py` (não depende) | não |
| `collect/*.py` (B1, B4, B5) | API ou base sem resultado | log de `logs/` (`log_execucao.py`), com o que cada chamada devolveu | builds de cada bloco (não dependem) | não |

## 5. Variáveis no código

| Objeto | Convenção atual | Exemplo |
|---|---|---|
| Raiz do projeto | `ROOT = Path(__file__).resolve().parents[4]` em scripts de etapa e auxiliares de `outros/` (`parents[3]` em `Comum/`; antes, em 14/10/2026, `parents[3]` e, até então, `parents[2]`) | — |
| Caminhos fixos | constantes em maiúsculas no topo do script, em português nos scripts novos: `BRUTOS` (`_dados-brutos/` da coleta), `PROCESSADOS` (`_dados-agregados/` da coleta), `ENTRADA`, `SAIDA`; no B4, `pasta_bruta(fonte)`, `pasta_auditoria(fonte)` e `pasta_uso(uso)` do `bases_comum.py` | `SAIDA = ROOT / "dados" / "B1_entorno" / "_dados-agregados" / "B1_entorno.csv"` |
| Nomes antigos equivalentes | `RAW`/`RAW_DIR`/`BRUTO` = brutos; `PROCESSED`/`PROCESSED_DIR`/`PASTA` = processados; `OUT_PATH`/`*_PATH` = arquivo de saída ou de entrada. Não são renomeados sem outra mudança no script | — |
| Funções e variáveis | `snake_case`, em português | `caminho_saida`, `conferir_capitais` |
| Classes | `CamelCase` | `PlacesClient`, `OverpassClient` |
| Bloco de abertura dos scripts de etapa | inclui `_src/outros/`, `outros/` do objeto e, no B4, `Comum/` no caminho de importação e liga o log (`registrar_execucao`) quando o script é executado diretamente | ver qualquer script de `collect/` |

## 6. Outros nomes do projeto

| Objeto | Convenção atual | Exemplo |
|---|---|---|
| Nota de estudo | `_docs/notas/AAAA-MM-DD_<termo>.md` | `2026-10-14_vpl.md` |
| Capítulo | `textos/capitulos/<n>_<tema>.md` | `6_plano_de_marketing.md` |
| `.docx` e `.pdf` de capítulo | `<n>_<tema>_v<n>.docx`; `TCC_luderia_v<n>` para o trabalho (sem `TMin` desde 13/11/2026); versões antigas em `_arquivo/` | `6_plano_de_marketing_v2.docx` |
| Instrumento de pesquisa | `textos/_planejamento/_instrumentos/<tema>_<bloco>.md` | `dicionario_temas_B2.md` |
| Versão do app de observação | `versionName` `AAAA.MM.DD-n`; APK `ObservacaoLuderia-<versionName>.apk` | `ObservacaoLuderia-2026.10.14-1.apk` |
