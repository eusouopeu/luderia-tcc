# Registro de alterações

Mudanças relevantes no TCC e na pasta do projeto: metodologia, arquivos, instruções, capítulos, site de apresentação, app de coleta de observação, scripts de extração, bancos de dados do Notion etc. Registros em ordem cronológica, do mais antigo para o mais recente.

Formato de uma mudança:

```
## AAAA/MM/DD

### HH:mm
**Objeto**: caminho ou nome do objeto da mudança
**Antes**: o que havia na versão anterior
**Depois**: o que passou a haver na versão nova
**Justificativa**: razão da mudança
```

Formato de uma divergência encontrada entre documentos (data em que foi encontrada):

```
### HH:mm
**Objeto**: arquivos ou trechos em divergência
**Antes**: o que diz o arquivo mais antigo
**Depois**: o que diz o arquivo mais recente
**Efeitos colaterais**: prejuízos que a versão mais recente pode causar ao trabalho, se houver
```

---

## 2026/10/12

### 10:22
**Objeto**: `docs/registro-de-alteracoes.md`
**Antes**: arquivo inexistente; as mudanças ficavam registradas só nas mensagens de commit.
**Depois**: registro cronológico de mudanças e divergências, com objeto, antes, depois e justificativa (ou efeitos colaterais).
**Justificativa**: pedido do autor, para rastrear em um só lugar as mudanças relevantes do trabalho.

### 10:22
**Objeto**: `CLAUDE.md`, nova seção "Registro de alterações"
**Antes**: sem regra de registro de mudanças fora do commit.
**Depois**: duas regras obrigatórias: (1) registrar toda mudança em arquivo da pasta; (2) registrar toda divergência entre documentos ainda sem registro, com seus efeitos colaterais.
**Justificativa**: pedido do autor, para que o registro seja mantido em todas as sessões.

### 10:22
**Objeto**: `CLAUDE.md` (seções "Princípios e preferências", "1.1" e "4") × pasta `_instrucoes/`
**Antes**: a tabela "Mapa dos arquivos de instrução" do `CLAUDE.md` aponta para `_instrucoes/4_metodologia.md`, `_instrucoes/8_financeiro.md` e `_instrucoes/10_biblio-apendices.md`, que existem.
**Depois**: outras partes do mesmo `CLAUDE.md` ainda citam `instrucoes/metodologia.md`, `instrucoes/financeiro.md` e `instrucoes/biblio-apendices.md`, caminhos que não existem.
**Efeitos colaterais**: link quebrado em `instrucoes/financeiro.md`; quem seguir as referências antigas não acha a escala N1–N6, a metodologia nem as normas de bibliografia.

### 10:43
**Objeto**: Notion, novo banco de dados "Status da coleta"
**Antes**: sem controle da completude da coleta por estabelecimento; o andamento só aparecia ao consultar os bancos "A - Estabelecimentos" e "B - Comentários".
**Depois**: banco com as 51 luderias aprovadas (`bloco_b_luderias_aprovadas_metropoles_mais_100_avaliacoes.xlsx`) e quatro colunas de status (Instagram, Cardápio, Localização, Comentários), com os valores "Não coletado", "Coleta parcial" ou "Coleta completa", conferidos em 12/10/2026. Critérios estão na descrição de cada coluna. No A, completo quer dizer todos os campos do grupo preenchidos. No B, parcial quer dizer até 40 comentários e nenhum com data relativa de 1 mês ou mais. As colunas são do tipo seleção, não status, porque a API do Notion não deixa criar opções próprias em coluna de status. Os valores não se atualizam sozinhos.
**Justificativa**: pedido do autor, para acompanhar o que falta coletar. Lista base: as 51 aprovadas na curadoria, escolhidas pelo autor no lugar de `bloco_b_triagem.csv`, que é só a fila da triagem manual das lojas (4 aprovadas, uma delas entre as 51).

### 11:39
**Objeto**: `AGENTS.md` (raiz)
**Antes**: cópia não versionada e desatualizada do `CLAUDE.md`, sem a seção "Registro de alterações".
**Depois**: arquivo apagado.
**Justificativa**: pedido do autor (recomendação 1 de enxugamento): duas versões das mesmas instruções divergiam.

### 11:39
**Objeto**: `CLAUDE.md`; `_instrucoes/1_estrutura.md`; `_instrucoes/4_metodologia.md`
**Antes**: `CLAUDE.md` com 139 linhas; caminhos quebrados (`instrucoes/metodologia.md`, `instrucoes/financeiro.md`, `instrucoes/biblio-apendices.md`, `src/`); seções 1 a 4 (hierarquias de fontes, de dados e de focos; personalização da estrutura) dentro do `CLAUDE.md`.
**Depois**: `CLAUDE.md` com cerca de 55 linhas (mapa, estado, versionamento, registro, princípios), caminhos corrigidos. Hierarquias e personalização movidas para a seção "Princípios do plano" de `_instrucoes/1_estrutura.md` (P1 a P4); a lista N1–N6 duplicada saiu, porque já está em `_instrucoes/8_financeiro.md` §2. Referência de `4_metodologia.md` (3.2) atualizada.
**Justificativa**: pedido do autor (recomendações 2 e 3): corrigir links e carregar em toda sessão só o que é usado em toda sessão. A divergência registrada às 10:22 (caminhos `instrucoes/...`) fica resolvida.

### 11:39
**Objeto**: blocos de dados — pastas de `_src/`, `_data/raw/` e `_data/processed/`, nomes de scripts e de saídas, referências em instruções, documentos e código
**Antes**: blocos A–F (A estabelecimentos, B avaliações, C histórico dos avaliadores, D contagem, E bases públicas, F jogos) e prefixos do desenho anterior (`bloco_b_*` no Bloco A, `bloco_a_*` no Bloco F, `bloco_c_*` no Bloco B, `contagem_*`, `cardapios_*`, `[E] *.csv`, `collect_bases_*`). Pastas de `_data/processed/` já renomeadas pelo autor para `[B1]`–`[B6]`.
**Depois**: blocos B1–B6 (B1 estabelecimentos e cardápios, B2 avaliações, B3 contagem, B4 bases públicas, B5 jogos, B6 histórico dos avaliadores, retirado). Pastas `[Bn] Nome` em `_src/` e `_data/raw/`; saídas `Bn_<conteúdo>` (B4: `[B4] {dado} {período} ({fonte}).csv`); scripts `<etapa>_Bn_<conteúdo>.py` (ex.: `collect_B1_places.py`, `build_B3_contagem_sorteio.py`, `collect_B4_bcb.py`, `scrape_B5_ranking.py`; `ocr_fotos.py` virou `build_B3_ocr_fotos.py`). Módulos auxiliares mantêm o nome. `textos/analise_conteudo_bardin_bloco_b.md` → `analise_conteudo_bardin_B2.md`; `textos/figuras/fluxograma_limpeza_bloco_a.*` → `fluxograma_limpeza_B1.*`. `.gitignore`, `CLAUDE.md`, `_instrucoes/`, `docs/bibliografia/`, `bibliografia/referencias_bases_publicas.md`, roteiro de observação, app (`CLAUDE.md`, comentários, `gerar_jogos.py`) atualizados. Conferência: `analise_B1_limiares.py` e `analise_B1_conferencia_rm.py` rodados de novo geraram saídas idênticas byte a byte.
**Justificativa**: pedido do autor (recomendação 10), seguindo a nomenclatura `[Bn]`/`Bn_` que ele aplicou em `_data/processed/`: elimina a tabela de correspondência entre letra do bloco e prefixo.

### 11:39
**Objeto**: `arquivados/recorte-antigo/`
**Antes**: `_data/processed/[B2] Avaliacoes recentes/Google Places/bloco_c_*.csv` (7 arquivos: avaliações do campo `reviews`, texto filtrado, correlações e clusters) e os scripts `build_bloco_c_analise.py`, `build_bloco_c_texto_filtrado.py` e `analise_bloco_c_correlacao_clusters.py` em `_src/[B2]`.
**Depois**: arquivos e scripts movidos, sem exclusão, para `arquivados/recorte-antigo/`, na mesma estrutura de pastas. Ficam no lugar todas as saídas do B1, inclusive as de capitais regionais: elas alimentam `B1_limiares_avaliacoes*.csv`, `B1_grafico_limiares*.png` e `B1_termos_suspeitos.csv`, que fundamentaram o corte de 100 avaliações, a escolha das metrópoles e os termos de exclusão.
**Justificativa**: pedido do autor (recomendação 8): arquivar o recorte antigo (até 5 avaliações por casa via API, desenho anterior) e manter o que fundamenta o recorte atual.

### 11:39
**Objeto**: `_src/[B1] Google Places (estabelecimentos)/collect_B1_details.py`
**Antes**: `collect_bloco_b_details.py` (com `reviews`) e `collect_bloco_b_details_sem_reviews.py` (sem `reviews`), quase idênticos.
**Depois**: um só script, com a opção `--sem-reviews`. Cada modo grava no mesmo arquivo de antes e pula os mesmos place_ids de antes.
**Justificativa**: pedido do autor (recomendação 9).

### 11:39
**Objeto**: `site-apresentacao/`, `app-observacao/`, `.claude/launch.json`, `_src/__pycache__`, `_logs/`
**Antes**: `node_modules` locais instalados pelo npm (cerca de 340 MB, duplicados em cada app); `package-lock.json`; build do Android, `dist/` e caches Python no disco.
**Depois**: pnpm 10.34.7 (instalado globalmente) com repositório global de pacotes (`~/Library/pnpm/store`), compartilhável com os demais apps; `pnpm-lock.yaml` importado do `package-lock.json`, com as mesmas versões; `packageManager` no `package.json`; `app-observacao/.npmrc` com `node-linker=hoisted`, exigido pelo Capacitor; scripts `sync` e `predeploy` e `launch.json` passam a usar pnpm. `android/app/build`, `android/build`, `android/.gradle`, `dist/` e `__pycache__` apagados (regeneráveis). Log `collect_bloco_a_details_errors.log` → `collect_B5_details_errors.log`. App: typecheck e 19 testes passando; versão 7 / `2026.10.12-1`; APK `ObservacaoLuderia-2026.10.12-1.apk` no lugar do anterior. `.tmp.driveupload/` e `.tmp.drivedownload/` não foram apagados: são a área de envio em uso do Google Drive.
**Justificativa**: pedido do autor (recomendação 11): liberar disco e compartilhar pacotes entre os apps.

### 11:39
**Objeto**: `README.md` (raiz)
**Antes**: inexistente, embora exigido pelo `CLAUDE.md` (personalização 6).
**Depois**: README com estrutura de pastas, pipeline por bloco, instalação (Python e pnpm) e regras de dados.
**Justificativa**: pedido do autor (recomendação 12).

### 11:39
**Objeto**: `site-apresentacao/src/conteudo/*.json` × `_instrucoes/4_metodologia.md`
**Antes**: o site usa a nomenclatura do desenho anterior: Bloco A = jogos, Bloco B = estabelecimentos, Bloco C = avaliações; hipóteses H1–H9.
**Depois**: a metodologia usa B1 = estabelecimentos, B2 = avaliações, B3 = contagem, B4 = bases públicas, B5 = jogos, B6 = histórico (retirado).
**Efeitos colaterais**: na banca, o site contradiz o texto (a mesma letra designa blocos diferentes). Não corrigido: a tradução das letras exige reescrever o conteúdo do site para o desenho atual.

### 11:39
**Objeto**: `textos/registro_previo_luderia.md`, `textos/projeto_pesquisa_luderia.md`, `textos/cronograma_luderia*.md` × `_instrucoes/`
**Antes**: esses textos citam os blocos pelas letras A–F e os arquivos pelos prefixos antigos (`bloco_b_*`, `[A]`, `[D]`).
**Depois**: instruções, scripts e dados usam B1–B6. Os textos não foram alterados: o registro prévio é documento datado, o projeto de pesquisa já foi entregue e os cronogramas tinham alterações do autor ainda não salvas.
**Efeitos colaterais**: caminhos citados nesses textos não existem mais; leitor do registro prévio precisa da correspondência A→B1, B→B2, C→B6, D→B3, E→B4, F→B5.

### 11:39
**Objeto**: `CLAUDE.md` × `_instrucoes/4_metodologia.md` (Bloco B6)
**Antes**: o `CLAUDE.md` dizia que a letra do bloco retirado (C) "não é reaproveitada".
**Depois**: o autor criou `_data/processed/[B6] Historico dos avaliadores/` e a numeração B1–B6 inclui o bloco retirado como B6.
**Efeitos colaterais**: nenhum, desde que B6 continue marcado como retirado.

### 12:33
**Objeto**: `_instrucoes/1_estrutura.md` (nova seção "Extensão"; 1.3 Objetivos; 11.2; P5 Escrita; P6 Vocabulário controlado); `CLAUDE.md` (princípios "Escrita" e "Extensão")
**Antes**: sem limite de páginas; objetivos específicos sem número máximo nem ligação explícita com capítulos; regras de estilo só no cap. 2 e na skill `meu-estilo-escrita`; termos sem definição fixa.
**Depois**: teto de 90 páginas com teto por parte (pré-textuais 10, caps. 1 a 11 com 4, 10, 10, 2, 7, 8, 4, 3, 12, 4 e 2, referências 5, apêndices 9) e conversão de cerca de 350 palavras por página; no máximo 6 objetivos específicos, um por decisão do plano, com proposta de redação e capítulo de cada um, respondidos um a um em 11.2; regras de escrita (parágrafo abre pela conclusão, sem metadiscurso, adjetivo vira número ou sai, formato único de números, voz passiva sintética, travessão); vocabulário controlado com 12 termos definidos (luderia, público casual, público hobbyista, concorrente, avaliação, taxa de ocupação, fluxo, permanência, giro, ticket médio, velocidade de avaliações, premissa crítica).
**Justificativa**: pedido do autor (recomendações 1, 9, 10, 11 e 12): entregar a versão final em até 90 páginas, com texto claro e coerente.

### 12:33
**Objeto**: `_instrucoes/2_ref-teorico.md` (divisão de subcapítulos)
**Antes**: seis subcapítulos sem teto e sem a ferramenta que cada um justifica.
**Depois**: teto de 10 páginas, distribuído por subcapítulo (1,5; 3; 1; 1,5; 1; 2), com a ferramenta ou conceito que cada um justifica; história das luderias vai para a introdução; Canvas e Monte Carlo só se forem usados.
**Justificativa**: pedido do autor (recomendação 2): referencial a serviço das ferramentas do plano.

### 12:33
**Objeto**: `_instrucoes/10_biblio-apendices.md` (nova seção "Quadros e tabelas: texto ou apêndice"; apêndices previstos)
**Antes**: apêndices A a K, com H = registro prévio e I = Bloco B5; sem lista do que fica no corpo e do que vai para apêndice.
**Depois**: lista de 22 quadros, tabelas e figuras do corpo (com conteúdo mínimo de cada) e de 14 elementos que vão para apêndice; apêndices A a K revistos (H = tabelas de apoio do B4; I = Canvas e fluxograma de processos), L e M como extras (testes H1–H9 e Monte Carlo); teto de 9 páginas para os apêndices.
**Justificativa**: pedido do autor (recomendações 3 e 4): trocar prosa por quadros e mover para apêndice o que não muda decisão.

### 12:33
**Objeto**: testes de hipótese H1–H9, registro prévio, divisão da base, correção de Benjamini-Hochberg, regressões com efeito fixo e simulação de Monte Carlo — `_instrucoes/4_metodologia.md` (§ decisões, 3.5, 3.6, controles), `1_estrutura.md`, `8_financeiro.md` §4.4, `9_anal-riscos.md` 10.2
**Antes**: parte do núcleo do método ("garantias de robustez"); Monte Carlo opcional.
**Depois**: extras, só se sobrar tempo no fim, com resultado em apêndice (L e M). O núcleo passa a ser validação da coleta e da codificação, ponderação por estabelecimento, intervalo de confiança, registro de premissas com faixas, três cenários, tornado e ponto de ruptura. Os procedimentos dos extras continuam escritos, para o caso de serem feitos.
**Justificativa**: pedido do autor (recomendação 6), mantendo H1–H9 e Monte Carlo como extras.

### 12:33
**Objeto**: Bloco B5 (jogos) — `_src/[B5] Ludopedia (jogos)/`, `_data/raw/[B5] Jogos (ludopedia)/`, `_data/processed/[B5] Jogos (ludopedia)/`, log de coleta; menções em `CLAUDE.md`, `README.md`, `_instrucoes/` (1, 3, 4, 5, 7), `docs/bibliografia/diagnostico-teorico.md` (§1.5 e B06), `textos/1_introducao_plano_luderia.md` (objetivo iii), `requirements.txt`, `.gitignore`, app
**Antes**: bloco ativo de menor relevância; acervo definido por clusters e índice de acessibilidade dos jogos; dependências `scikit-learn`, `scipy` e `spacy`.
**Depois**: pastas movidas para `arquivados/B5-jogos/` (com `LEIAME.md`), sem exclusão; menções retiradas; acervo definido pelos jogos citados nas avaliações (B2) e pelo acervo declarado dos concorrentes (B1); variável "jogos citados" passa a lista aberta construída na codificação; `.gitignore` passa a excluir `.jsonl` e `.log` dentro de `arquivados/`; `requirements.txt` sem `scikit-learn`, `scipy` e `spacy` (sem uso) e com `matplotlib`, `pytesseract` e `Pillow` (em uso, faltavam). `app-observacao/scripts/gerar_jogos.py` lê a base arquivada; `jogos.json` gerado de novo saiu idêntico. App: typecheck e 19 testes passando; versão 8 / `2026.10.12-2`; APK `ObservacaoLuderia-2026.10.12-2.apk`.
**Justificativa**: pedido do autor (recomendação 7): o B5 não mudava nenhuma decisão de peso; dados guardados para eventual uso futuro.

### 12:33
**Objeto**: `_instrucoes/4_metodologia.md` (validação da coleta; tabela de validação por bloco; Bloco B6)
**Antes**: só os procedimentos detalhados (20% dos estabelecimentos, 200 avaliações, segunda codificação, TSE em seção própria); tabela de validação com as letras antigas (A e B, E, D); B6 descrito como "letra não reaproveitada".
**Depois**: proposta de validação proporcional (30 estabelecimentos e 100 avaliações; recodificação de 10% após 14 dias; reconciliação das séries do B4; TSE em uma frase), marcada **em estudo, não adotada**, com a ressalva do autor e os pontos a estudar. Um deles: com zero erros, o limite superior de Wilson é cerca de 11% para n = 30, então 30 estabelecimentos não cumprem o critério de 5%. Para cumprir, a amostra precisaria de cerca de 75. Tabela corrigida para B1 e B2, B4 e B3; B6 descrito como código reservado só para registrar a retirada.
**Justificativa**: pedido do autor (recomendação 8), que ainda vai estudar a etapa para garantir que o método é estatisticamente defensável.

### 12:33
**Objeto**: `textos/1_introducao_plano_luderia.md` × `_instrucoes/1_estrutura.md` (1.3 Objetivos) e P5/P6
**Antes**: a introdução tem 8 objetivos específicos (i a viii), usa "ludobar" e "quiz-bar" como sinônimos e frases que P5 manda cortar ("Para atingir esse propósito, foram traçados…", "Do ponto de vista acadêmico,", "preenche uma lacuna").
**Depois**: as instruções pedem no máximo 6 objetivos, um por decisão, e o vocabulário controlado.
**Efeitos colaterais**: a introdução e as considerações finais ficam desalinhadas até a reescrita; o único ajuste feito no texto foi tirar a menção aos perfis de jogos (B5) do objetivo (iii).

### 12:33
**Objeto**: `_instrucoes/4_metodologia.md` (cesta por pessoa = couvert + A&B, chamada de "ticket médio") × `_instrucoes/8_financeiro.md` (árvore: "ticket médio de A&B", couvert à parte)
**Antes**: a metodologia chama de ticket médio o gasto total por pessoa.
**Depois**: a árvore de direcionadores usa ticket médio só para A&B. O vocabulário controlado (P6) define ticket médio como gasto total e "ticket médio de A&B" como a parte da árvore.
**Efeitos colaterais**: risco de contar o couvert duas vezes no modelo se a cesta com couvert alimentar a folha "ticket médio de A&B".

### 17:58
**Objeto**: `_data/processed/[B1] Estabelecimentos e cardapios/Redes Sociais/` (98 CSV do Instagram)
**Antes**: `instagram_<perfis|posts>_<perfil>_<data>.csv`, com três duplicatas ` (1)` (bravojogos perfis e posts, ludusluderia posts).
**Depois**: `<data>_<perfil>_instagram_<perfis|posts>.csv`; as duplicatas receberam o sufixo `_2`. O tipo (perfis ou posts) foi mantido no fim porque, sem ele, os dois arquivos do mesmo perfil teriam o mesmo nome.
**Justificativa**: pedido do autor; a data no início ordena a pasta por coleta.

### 17:58
**Objeto**: `_src/[B1] Cardapios/` (novo): `collect_B1_cardapios.py`, `build_B1_cardapios_ocr.py`, `collect_B1_sinais_jogos.py`; saídas em `_data/processed/[B1] Estabelecimentos e cardapios/Cardápios/`
**Antes**: cardápios lidos à mão; sem script de download, OCR ou busca de sinais de venda e aluguel.
**Depois**: download de PDFs e imagens por estabelecimento (log em `B1_cardapios_baixados.csv`), texto por OCR ou camada de texto em `transcricao/` e `B1_cardapios_ocr_linhas.csv`, e sinais de venda, aluguel e taxa em `B1_sinais_venda_aluguel.csv`. Tesseract com idioma português em `_src/[B1] Cardapios/tessdata/` (ignorado pelo git). Banco A do Notion preenchido com o que foi extraído.
**Justificativa**: pedido do autor; reprodutibilidade da coleta de cardápios (B1).

### 17:58
**Objeto**: `.gitignore`
**Antes**: só os cardápios de `_data/raw/[B1]*/cardapios/` eram ignorados.
**Depois**: PDFs e imagens de `_data/processed/[B1]*/Cardápios/` e o modelo `tessdata` também.
**Justificativa**: material de terceiros em repositório público; só CSV e transcrições são publicados.

### 17:58
**Objeto**: `CLAUDE.md` (Princípios)
**Antes**: sem regra sobre quantidade de itens por pasta.
**Depois**: regra "Pastas enxutas" e padrão de nome dos arquivos de rede social.
**Justificativa**: pedido do autor, para considerar nas próximas criações de arquivos e pastas.

### 19:45
**Objeto**: banco "A - Estabelecimentos" do Notion (colunas Site, Cardápio, Loja, Acervo, Outros links, Outras anotações), 33 estabelecimentos
**Antes**: todos os links ficavam em Site, Cardápio e Outros links. Linktrees, heylink, beacons, lnk.bio e similares estavam em Site; sites próprios, lojas e acervos de aluguel estavam em Outros links; uma anotação estava em Outros links (Café Geek).
**Depois**: Site só com site próprio (.com.br ou domínio da marca). Linktree e similares em Outros links. Acervo de aluguel (acervodejogos.com.br, página de locação do Game of Boards) em Acervo. Loja online com preços de venda (Asgard, CCG Floripa, Game of Boards) em Loja. Anotações movidas para Outras anotações (Café Geek e JOYJOY CAFÉ). Duplicatas removidas (Bravo Jogos, Chef on Play, Ludoteca BGC). Tracking de links limpo (Coletivo Geek, XPlace, Covil Game Bar, Encounter). Conferido por abertura das páginas: Alçapão (página de aluguel, em Site), Game of Boards (locação com 505 jogos, em Acervo), Ludoteca BGC (redireciona para acervodejogos), CCG Floripa e Asgard (lojas com preços), Arcadea (widget de reservas, em Outros links).
**Justificativa**: pedido do autor; novas colunas separam os tipos de link e alimentam B1 (cardápio, preço, aluguel e venda de jogos).

### 19:45
**Objeto**: `CLAUDE.md` (Registro de alterações)
**Antes**: o registro cobria só arquivos do projeto.
**Depois**: mudanças em bancos de dados do Notion também entram no registro.
**Justificativa**: pedido do autor em 12/10/2026.

### 19:51
**Objeto**: banco "A - Estabelecimentos" do Notion, coluna Cardápio (Café Geek e Cartola Luderia)
**Antes**: sem link de cardápio, embora tenham cardápio baixado em `_data/processed/[B1] Estabelecimentos e cardapios/Cardápios/`.
**Depois**: Cardápio preenchido com o texto "cardápio baixado".
**Justificativa**: pedido do autor; marcar quem tem cardápio local sem link. Covil Game Bar ficou de fora: o PDF baixado é cardápio de jogos, não de comida.

### 19:51
**Objeto**: banco "Status da coleta" do Notion, coluna Cardápio
**Antes**: 3 linhas com "Coleta parcial" (Ludus Luderia, Shelf Bar, Fan Hour), 1 com "NÃO É" (Ilusões Industriais) e 47 com "Não coletado". Calculado antes do preenchimento dos cardápios no A.
**Depois**: 34 linhas com "Coleta parcial" (31 mudaram), 1 "NÃO É" e 16 "Não coletado". Critério da descrição da coluna (24 campos da view CARDAPIO do A), contando o campo do link como preenchido quando há URL ou "cardápio baixado". Nenhum estabelecimento chegou a 24 de 24, então nenhum está em "Coleta completa". Sem coleta: os 15 do A com 0 campos e o Machado Games, que não está no A.
**Justificativa**: pedido do autor; refletir links de cardápio e cardápios baixados.

### 20:19
**Objeto**: banco "Status da coleta" do Notion, coluna Cardápio (critério e valores)
**Antes**: critério de 24 campos, contando "Venda de jogos" e "Aluguel de jogos"; 34 linhas em "Coleta parcial" e 16 em "Não coletado".
**Depois**: critério sem venda e aluguel (campos de apoio, não de cardápio) e sem exigir preenchimento total: completa = itens e preços extraídos (campo vazio por o negócio não oferecer o item não é pendência); parcial = há link, cardápio baixado, precificação ou couvert, sem itens extraídos; não coletado = nenhum. Resultado: 16 completas (Alçapão, Arcadea, Arena BG, Asgard, BoardZ, Bodogami, Café Geek, Cartola, Castelos, Fan Hour, Fortalúdica, Luderia Carioca, Ludoteca SideQuest, Ludus, Place Games, Shelf Bar), 3 parciais (JOYJOY, Garagem do Nerd, Game of Boards), 1 "NÃO É" e 30 não coletadas. Descrição da coluna reescrita.
**Justificativa**: pedido do autor; o status deve mostrar o que ainda falta fazer.

### 20:19
**Objeto**: banco "A - Estabelecimentos" do Notion, colunas Site, Loja, Acervo, Outros links, Venda de jogos e Aluguel de jogos (≈45 estabelecimentos)
**Antes**: Site vazio em ~25 estabelecimentos; Loja e Acervo vazios onde havia loja online ou acervo de aluguel nos sites.
**Depois**: Site preenchido com `site_ou_rede_social` de `B1_luderias_aprovadas_metropoles_mais_100_avaliacoes.xlsx`. Os sites foram abertos e os links achados classificados: lojas online em Loja (Flow, Magic Store, Playeasy, RED, Paladins, Inside, Dungeon, Gruta, OMNIVERSE, JOYJOY, Dominaria, Taverna e outras), acervos de aluguel em Acervo (Nala Land, SideQuest, Pittas, Luderia Carioca, Dominaria), ludopedia, Facebook e acervos sem preço em Outros links (Arena BG, Castelos, Bodogami, Covil, JogaSampa). "Venda de jogos" e "Aluguel de jogos" marcados "Sim" onde a loja ou o acervo comprovam. As planilhas não trazem link de cardápio, só o site.
**Justificativa**: pedido do autor; completar as colunas de URL com as planilhas do Google Places e os links que os próprios sites indicam.

### 20:19
**Objeto**: divergências encontradas ao preencher o banco A
**Antes**: Dominaria Cards & Games: Site no Notion = dominariacgsp.com.br. Comdado: planilha = comdado.bar.
**Depois**: planilha de aprovadas e loja online: dominariacg.com.br (sem "sp"). comdado.bar hoje redireciona para um site de terceiros (thingsreview.com).
**Efeitos colaterais**: Site do Dominaria mantido como estava; Site do Comdado ficou vazio, para não apontar para site que não é do bar.

### 21:14
**Objeto**: `_src/[B1] Acervo de Jogos/` (novo): `collect_B1_acervodejogos.py`, `collect_B1_acervodejogos_places.py`, `build_B1_acervodejogos_novas.py`; saídas em `_data/processed/[B1] Estabelecimentos e cardapios/Acervo de Jogos/`
**Antes**: a população do B1 vinha só da busca no Google Places; o Acervo de Jogos (acervodejogos.com.br, plataforma de aluguel de jogos) aparecia apenas como link de acervo de algumas casas.
**Depois**: as 409 lojas da plataforma (lista /companies e página de cada loja) estão em `B1_acervodejogos_lojas.csv`, com município, situação no recorte, endereço, Instagram, WhatsApp e CNPJ. As 242 lojas em metrópole REGIC ou sem município legível foram buscadas no Google Places (Text Search, 1 chamada por loja, cache em `places.jsonl`): `B1_acervodejogos_places.csv`. Das 87 com mais de 100 avaliações no recorte, 31 já estão aprovadas, 51 foram descartadas com motivo (resultado do Google é outra casa, loja sem comida e bebida, fechada, já reprovada na curadoria) e 5 são luderias novas: Bardo Mago e La Tabuleria (Belo Horizonte), TabuClub (Niterói), Toca do Rato (Ivoti, RM de Porto Alegre) e Tubaleria (São Paulo). Triagem em `B1_acervodejogos_triagem.csv` (soma das decisões = 87); novas em `B1_acervodejogos_luderias_novas.csv`. JogArt Club (BH) é luderia, mas tem 61 avaliações e fica fora.
**Justificativa**: pedido do autor; a plataforma lista casas que a busca do Google não alcançou.

### 21:14
**Objeto**: `_src/[B1] Cardapios/collect_B1_cardapios_digitais.py` (novo) e `collect_B1_cardapios.py` (fonte TabuClub)
**Antes**: só cardápios em PDF, imagem ou página Wix.
**Depois**: itens e preços dos cardápios digitais (API pública da Saipos e JSON da VUCA Food) de La Tabuleria (104 itens), Toca do Rato (25) e Bardo Mago (111) em `Cardápios/B1_cardapios_digitais_itens.csv`. PDF do cardápio do TabuClub baixado em `Cardápios/TabuClub/`. Cardápio da Tubaleria não coletado (só em destaque do Instagram, que exige login).
**Justificativa**: pedido do autor; dados de cardápio das luderias novas.

### 21:14
**Objeto**: `.gitignore`
**Antes**: sem regra para o HTML do Acervo de Jogos.
**Depois**: `_data/raw/[B1]*/acervodejogos/*.html` e `lojas/` ignorados (material de terceiros, cache da coleta).
**Justificativa**: repositório público; só os CSV são publicados.

### 21:14
**Objeto**: banco "A - Estabelecimentos" do Notion: colunas Acervo e Aluguel de jogos de 8 linhas; 5 linhas novas
**Antes**: Acervo vazio em São Jogue, Shelf bar, LudoCafé editora, Dungeon Games Store, Paladins Games Store, Bodogami, Place Games e Vila Celta; Aluguel de jogos vazio em LudoCafé, Paladins, Bodogami, Place Games e Vila Celta. Bardo Mago, La Tabuleria, TabuClub, Toca do Rato e Tubaleria não estavam no banco.
**Depois**: Acervo com o subdomínio da loja no Acervo de Jogos e Aluguel de jogos = "Sim" nessas linhas. Vila Celta recebeu o acervo "Rei das Cartinhas" (Curitiba) porque o site da Vila Celta no Google é reidascartinhas.com.br; o WhatsApp da loja no Acervo difere do telefone do Google, então vale conferir. Cinco linhas novas com links, itens de cardápio (batata, hambúrguer, sobremesa, refri, cerveja, caipirinha e contagens), couvert e endereço em Outras anotações. Critério dos itens: batata e sobremesa mais baratas, hambúrguer mais simples, Heineken como referência de long neck. O banco "Status da coleta" não recebeu as novas linhas.
**Justificativa**: pedido do autor; preencher as células vazias com o que a coleta do Acervo de Jogos achou.

### 21:14
**Objeto**: divergências encontradas na coleta do Acervo de Jogos
**Antes**: Toca do Rato: o Acervo diz Novo Hamburgo-RS. Ludocafé: Instagram no Acervo é @ludocafebh; no Notion é @ludocafe_editora.
**Depois**: Google: Av. Capivara, 241, Ivoti-RS (os dois municípios são da RM de Porto Alegre). O Notion mantém @ludocafe_editora.
**Efeitos colaterais**: nenhum no recorte (o município continua na RM); o Instagram do LudoCafé no Notion pode não ser o do bar.

### 21:42
**Objeto**: `_data/processed/[B1] Estabelecimentos e cardapios/Cardápios/`: `B1_cardapios_prints_itens.csv`, `B1_cardapios_prints_praticas.csv` e `B1_jogos_covil.csv` (novos); `_src/[B1] Cardapios/build_B1_jogos_covil.py` (novo)
**Antes**: prints de cardápio do Google Maps salvos pelo autor em pastas (Cineplay, Comdado, Covil, Ludoteca BGC, Utopia, Chef on Play, Encounter, Flow Games, Inside Games), sem transcrição.
**Depois**: 562 itens transcritos à mão dos 66 prints (estabelecimento, arquivo, data da foto, categoria, item, descrição, preço), com versões de anos diferentes mantidas lado a lado. Práticas que não são item (couvert, rodízio, refil, cozinha terceirizada, promoções) em arquivo à parte (23 linhas). Lista de jogos do Covil (239 jogos, tempo e número de jogadores) extraída do PDF de 2023 por script; os 13 prints do cardápio de jogos impresso (2025) não foram transcritos. Preços com leitura incerta trazem "legibilidade" na descrição.
**Justificativa**: pedido do autor; dados de cardápio dos estabelecimentos que não tinham.

### 21:42
**Objeto**: banco "A - Estabelecimentos" do Notion, view CARDAPIO: Cineplay SC, Comdado Bar, Covil Game Bar, Ludoteca BGC, Utopia Games & Food, Chef on Play, Encounter ("Jogo de Tabuleiro • Board Game"), Flow Games e Inside Games
**Antes**: colunas de cardápio vazias nos 9.
**Depois**: Cardápio = "cardápio baixado"; contagens, itens de referência e preços preenchidos com o cardápio mais recente de cada casa; datas das fotos, mudanças de preço e práticas em Outras anotações. Campo sem dado no print ficou vazio. Comdado: Taxa couvert = 20 (sexta a domingo; R$ 15 qua e qui).
**Justificativa**: pedido do autor.

### 21:42
**Objeto**: banco "A - Estabelecimentos" do Notion, Ludus Luderia, coluna Taxa couvert
**Antes**: 1641.
**Depois**: sem alteração.
**Efeitos colaterais**: valor fora de escala (os demais couverts vão de R$ 10 a R$ 20); foi excluído da sumarização. Provável erro de digitação, a conferir pelo autor.

### 21:51
**Objeto**: banco "Status da coleta" do Notion, coluna Cardápio, frente ao banco "A - Estabelecimentos"
**Antes**: Status (calculado às 20:19): Chef on Play, Cineplay, Comdado, Covil, Encounter, Flow Games e Ludoteca BGC em "Coleta parcial"; Inside Games e Utopia em "Não coletado". Bardo Mago, La Tabuleria, TabuClub, Toca do Rato e Tubaleria ausentes.
**Depois**: A (21:42): os 9 com itens e preços extraídos dos prints, o que pelo critério da coluna é "Coleta completa"; as 5 luderias novas estão no A.
**Efeitos colaterais**: o Status superestima o que falta coletar; a lista de pendências de cardápio deve sair do A, não do Status, até o Status ser recalculado.

## 2026/10/13

### 00:46
**Objeto**: `_src/[B1] Google Places (estabelecimentos)/analise_B1_termos_suspeitos.py` e `_src/[B1] Acervo de Jogos/build_B1_acervodejogos_novas.py`; saídas novas `B1_planilha_curadoria_metropoles_filtrada_50_ou_mais_avaliacoes.csv` e `Acervo de Jogos/B1_acervodejogos_triagem_50_ou_mais_avaliacoes.csv`
**Antes**: só o corte de mais de 100 avaliações: 164 candidatos na curadoria filtrada das metrópoles; 87 lojas do Acervo de Jogos triadas (31 já aprovadas, 51 descartadas, 5 novas).
**Depois**: mesmos filtros (termos suspeitos, metrópole REGIC pelo endereço) com corte de 50 ou mais avaliações: 222 candidatos (164 + 58 na faixa de 50 a 100, sem triagem manual). Triagem do Acervo com 50+: 105 lojas (31 já aprovadas, 54 descartadas, 5 novas, 9 com triagem manual pendente por estarem na curadoria de 50+, 6 a conferir). As saídas de corte 100 não mudaram.
**Justificativa**: pedido do autor, que avalia expandir a população para 50 ou mais avaliações.

### 01:43
**Objeto**: `_src/[B1] Acervo de Jogos/collect_B1_jogos_dos_acervos.py` (novo); saída `Acervo de Jogos/B1_jogos_dos_acervos.csv`; listas da Ludopedia em `_data/raw/[B1]*/acervos_jogos/ludopedia_*.txt`; `.gitignore`
**Antes**: sem lista de jogos por estabelecimento, salvo o Covil (`B1_jogos_covil.csv`).
**Depois**: 8.736 linhas (título × estabelecimento) para as 16 casas com dados de comida no banco A e acervo publicado: 11 no Acervo de Jogos (ordem "mais alugados"), Ludoteca SideQuest no rejoy, Arena BG, Castelos e Chef on Play na coleção da Ludopedia (ordem alfabética; lida no navegador por causa do Cloudflare) e Covil pelo PDF de 2023. Cache das páginas em `acervos_jogos/<loja>/`, ignorado no git.
**Justificativa**: pedido do autor; insumo da coluna "Jogos do acervo" do banco A.

**Objeto**: banco "A - Estabelecimentos" do Notion, coluna "Jogos do acervo"
**Antes**: multi-seleção vazia, sem opções.
**Depois**: tipo texto; 16 linhas com os 100 primeiros títulos de cada acervo, separados por "; " (mais alugados no Acervo de Jogos; ordem alfabética na rejoy e na Ludopedia; ordem do PDF no Covil). Sem preenchimento: casas com comida e sem acervo publicado (Arcadea, Asgard, BoardZ, Café Geek, Cartola, Cineplay, Fan hour, Flow, Fortalúdica, Inside, Encounter, Ludus, Utopia) e casas com acervo e sem dados de comida (Balboa's, Dominaria, Dungeon, Game of Boards, JOYJOY, LudoCafé, Nala Land, Paladins, Pittas, São Jogue, Tubaleria, Vila Celta, JogaSampa).
**Justificativa**: pedido do autor. A multi-seleção não comportava o conteúdo: o conector do Notion aceita no máximo 100 opções na coluna, e os 100 primeiros das 16 casas somam 843 títulos distintos. O autor escolheu texto com os 100 primeiros.

### 02:00
**Objeto**: `_src/[B2] Google Places (comentarios)/maps_avaliacoes.user.js` (versão 2026.10.13-1)
**Antes**: corte único ("até um mês", 3 meses, 1 ano ou sem corte); texto traduzido pelo Google quando havia tradução; sal da pseudonimização no `localStorage`, diferente em google.com e google.com.br; id da avaliação descartado; nome do arquivo `maps_avaliacoes_<lugar>_<sufixo>_<data UTC>.csv`; sem motivo de parada, faixa de datas nem checagem de ordem ou de seletores; sem filtros.
**Depois**: período "de… até…" (padrão: de agora até 1 mês, o recorte do método) e botão "Localizar período" para retomar coleta interrompida; clique em "Ver original" e coluna `texto_original`; sal no armazenamento do Tampermonkey (aproveita o do `localStorage` na primeira execução), com botões para copiar e importar; colunas novas `place_id` (da URL ou colado), `review_id`, `origem_pseudonimo`, `editada`, `data_min`, `data_max`, `n_fotos`, `notas_por_aspecto`, `preco_por_pessoa`, `valor_rs_no_texto`, `temas`, `opiniao`, `periodo_de_dias`, `periodo_ate_dias`, `motivo_parada`, `coleta_completa`, `versao_script`; `no_recorte` passa a `no_periodo`; aviso de lista fora de ordem de data, de seletores quebrados e de falta de identificador do lugar; "Já ordenei" desmarcado ao trocar de lugar; arquivo `AAAA-MM-DD_<lugar>_maps_avaliacoes_<periodo|filtros|tudo>.csv` com data local; filtros por tema (comida e bebida, serviço, acervo, preço, ambiente), opinião (positiva: nota 5 e palavra positiva ou negação de negativa; negativa: nota até 4 e palavra negativa ou negação de positiva) e componentes (texto, fotos, notas por aspecto, preço por pessoa, R$ no texto, resposta do dono), com opção de esmaecer na página as avaliações fora do período e dos filtros e CSV só dos filtrados.
**Justificativa**: pedido do autor: rastrear e retomar coletas, ligar a coleta manual à automática pelo id da avaliação, manter o pseudônimo estável entre domínios e achar comentários sobre comida com fotos (fonte de cardápio dos estabelecimentos sem cardápio oficial). Os filtros são regras de palavras-chave para localizar comentários; não substituem a codificação de Bardin.

### 02:31
**Objeto**: `_src/[B2] Google Places (comentarios)/maps_avaliacoes.user.js` (versão 2026.10.13-2)
**Antes**: versão 2026.10.13-1: coleta perdida se a página caísse; sem registro de avaliações já coletadas; um lugar por vez; fotos só contadas; campos do Google ("Tamanho do grupo", "Tipo de refeição" etc.) misturados em `detalhes`; sem conferência de fidelidade, resumo por lugar, busca livre, destaque de palavras, som ou download automático; rolagem com espera fixa.
**Depois**: progresso salvo a cada 5 s e botão "Recuperar última coleta"; review_id registrado por lugar, com coluna `ja_coletada`, filtro "não coletada antes" e opção de parar ao achar 10 já coletadas seguidas; fila de URLs ou place_id com download por lugar e CSV-resumo no fim; colunas `urls_fotos` (tamanho cheio), `provavel_cardapio`, `tipo_servico`, `tipo_refeicao`, `tamanho_grupo`, `tempo_espera`, `reserva`, `estacionamento`, `pratos_recomendados`; filtros "provável cardápio" e "tamanho do grupo"; destaque no texto das palavras que acionaram o filtro; modo conferência (review_id sorteados → lugar, rolagem até a avaliação, coletado × página, marcas ✓/✗ e CSV); CSV-resumo por coleta (lidas = com texto + sem texto, no período, velocidade com texto por mês em faixa de janela de 30 a 60 dias); busca livre (texto ou expressão regular); espera crescente quando a lista empaca; botões de som ao concluir e de download automático (CSV de tudo).
**Justificativa**: pedido do autor: retomar coletas interrompidas, coletar em lote, achar cardápios nas fotos das avaliações e preparar a conferência de fidelidade e a velocidade de avaliações previstas no método (§3.4 e §3.6).

**Objeto**: `_src/[B1] Google Places (estabelecimentos)/instagram_coletor.user.js` (versão 2026.10.13-1)
**Antes**: versão 2026.10.12-6: sem conferência de fidelidade; a fila sempre baixava os CSV no fim; a coleta por API de um perfil não baixava nada; sem aviso sonoro.
**Depois**: modo conferência (shortcodes ou links sorteados; dados coletados congelados no início; posts contornados na grade; abrir post, ✓/✗ e CSV `AAAA-MM-DD_instagram_conferencia.csv`); botão "Download automático" (ligado por padrão: CSV de posts e perfis ao fim da coleta por API e da fila); botão "Som ao concluir" (dois bipes ao fim de coleta, rolagem ou fila; bipes graves se parou com erro).
**Justificativa**: pedido do autor, para padronizar os dois coletores.

### 02:53
**Objeto**: `_src/[B1] Instagram/` (nova pasta: `instagram_comum.py`, `analise_B1_instagram_temas.py`, `analise_B1_instagram_precos.py`, `analise_B1_instagram_eventos.py`); saídas em `Redes Sociais/Analise das legendas/{Temas,Precos,Eventos}/`; `README.md`
**Antes**: legendas dos 50 CSVs de posts do Instagram sem análise; temas do B2 só nas avaliações; preço de uso do espaço só nos cardápios; eventos só marcados pelo coletor, perfil a perfil.
**Depois**: base única de 54.161 posts de 47 casas aprovadas (post atribuído ao dono, sem duplicata de shortcode; saem 3.156 posts de parceiros e a página `coviljogos`, fora da lista aprovada). (1) Temas: categorias do livro de códigos do B2 por dicionário, em 24 meses (11.942 posts, 45 casas), com o B2 ao lado e amostra de 25 posts por categoria para conferir a precisão. (2) Preços: 8.078 valores em R$ classificados por objeto (uso do espaço, evento, comida, produto, plano, aluguel), unidade (pessoa, hora, turno, dia, passaporte, mensal) e condição (dia da semana, isenção por consumo, assinante, meia, criança), valor vigente por casa e 12 modelos de cobrança citados. (3) Eventos: 12 meses (6.195 posts, 45 casas), eventos por mês por casa, razão de engajamento por categoria contra os posts comuns da própria casa (sem sorteios) e dias da semana citados. O classificador de eventos do coletor foi copiado em Python e concorda 100% com a coluna `evento` dos CSVs.
**Justificativa**: pedido do autor: comparar o que as casas anunciam com o que os clientes avaliam, levantar modelos de cobrança além do preço e medir frequência e retorno dos eventos, sem coleta nova.

### 04:52
**Objeto**: `_src/[B2] Google Places (comentarios)/maps_avaliacoes.user.js` (versão 2026.10.13-3); `maps_avaliacoes.test.cjs`.
**Antes**: na aba de avaliações do Maps, o nome do lugar e o volume podiam não ser encontrados; a lista era recusada antes de transbordar; controles e cartões recém-ordenados podiam aparecer após a tentativa de leitura; a coleta final usava só os cartões ainda presentes no DOM. Isso impedia rolagem, localização por período ou `review_id` e exportação.
**Depois**: nome e volume também lidos do painel principal; abertura e ordenação aguardam os cartões; área rolável reconhecida mesmo com poucos cartões; rolagem leva o último cartão à vista e espera crescimento no fim da lista; avaliações guardadas por `review_id` durante a coleta; expansão dos textos aceita rótulos atuais; CSV do período usa o período selecionado no momento da exportação. Seis testes locais cobrem metadados, lista inicial, abertura, ordenação, expansão, formatação e disparo do download do CSV. Estrutura de cartões, controles e carregamento incremental conferidos no Maps; execução do userscript dentro do Tampermonkey ainda não conferida.
**Justificativa**: falha relatada pelo autor ao tentar rolar, localizar e baixar avaliações; inspeção da interface atual do Maps.

### 05:41
**Objeto**: `_src/[B1] Acervo de Jogos/` (`collect_B1_jogos_dos_acervos.py` alterado; novos `jogos_comum.py`, `collect_B1_jogos_ludopedia.py`, `collect_B1_lojas_venda.py`, `build_B1_banco_jogos.py`); saídas `Acervo de Jogos/B1_jogos_dos_acervos.csv` (colunas novas), `B1_lojas_venda_produtos.csv` e `B1_banco_jogos.csv`; cache da API da Ludopedia em `acervos_jogos/ludopedia_api_{busca,jogos}.json`; `.gitignore`
**Antes**: lista de jogos por casa sem preço de aluguel; sem preços de venda; sem base por jogo; dados de jogo só nas planilhas arquivadas do B5 (`ludopedia_ids.csv`, `ludopedia_jogos.jsonl` com 1.000 jogos, `ludopedia_ranking.csv` com 2.500 notas).
**Depois**: (1) `B1_jogos_dos_acervos.csv` ganha `aluguel_rs` e `aluguel_dias` (card do Acervo de Jogos e da rejoy; Ludopedia e Covil sem preço). (2) `B1_lojas_venda_produtos.csv`: 2.342 produtos à venda nas 8 lojas das casas com comida (Liga: Inside, Flow, Utopia, Asgard, Fortalúdica; Tray: Place Games, TabuClub; Saipos: La Tabuleria), com estoque disponível; cache das páginas em `lojas_venda/`, ignorado no git. (3) `B1_banco_jogos.csv`: 723 jogos presentes em 4 ou mais das 16 casas, com casas do acervo no local, do aluguel pago e da venda, média, mediana e desvio padrão amostral (n-1, só com 2 ou mais preços) do aluguel e da venda, jogadores mínimo e máximo, idade, minutos, mecânicas e nota da Ludopedia. Grafias unificadas pelo slug da Ludopedia (B5 e, na falta, busca na API oficial, similaridade mínima de 0,85); 719 de 723 casados, 575 com nota, 386 com venda. Produto de loja casa com o jogo pelo nome inteiro, sem expansões, promoções, acessórios, usados e kits com "+", e sem preço zero.
**Justificativa**: pedido do autor: base oposta à do banco A, uma linha por jogo, para comparar oferta, aluguel e venda entre casas.

**Objeto**: Notion, banco novo "B - Jogos" (https://app.notion.com/p/6237f9c5509d4927845a5ad10124d444)
**Antes**: inexistente.
**Depois**: 723 páginas (nomes distintos, contagem conferida por SQL), colunas Jogo, Ludopedia, Casas, Acervo no local, Aluguel pago, Venda, Aluguel média/mediana/DP, Venda média/mediana/DP, Jog mín, Jog máx, Idade, Minutos, Mecânicas e Nota. Grafias por casa e preços por casa ficam só no CSV (limite de tamanho do conector).
**Justificativa**: pedido do autor, com as escolhas: linhas só para jogos em 4+ casas; aluguel pago também conta como acervo no local; venda só das casas com comida; jogos fora do B5 buscados na Ludopedia. Ressalvas: preço de aluguel por locação como publicado, sem converter para diária (período de 1, 3 ou 7 dias conforme a casa); 4 jogos sem par na Ludopedia (ex.: Black Stories: Ficção Científica, Cash 'n Guns 2ª edição, Ma Que P#**&) ficam sem dados de jogo; erros da própria Ludopedia mantidos (ex.: Adultos em Ação com máximo de jogadores menor que o mínimo; Scotland Yard ligado ao slug do 221B Baker Street); Ludoteca BGC marca venda, mas o site redireciona para o Acervo de Jogos, sem loja legível. Sugestão futura registrada: incluir jogos presentes em 3 casas. Removidos o cache antigo `ludopedia_busca.jsonl` (raspagem do site, trocada pela API) e a primeira versão do casamento por " - ", que ligava expansões ao jogo base.

### 06:47
**Objeto**: `_src/[B2] Google Places (comentarios)/maps_avaliacoes.user.js` (versão 2026.10.13-4), posição do painel
**Antes**: painel fixo a 354 px da borda direita, para ficar à esquerda do painel de horários de pico; sem esse outro painel, ficava no meio da tela.
**Depois**: painel encostado na borda direita (12 px); se o painel de horários de pico estiver aberto, fica logo abaixo dele, com a altura máxima ajustada.
**Justificativa**: pedido do autor: o painel aparecia no meio da tela. Na mesma sessão, a versão 2026.10.13-3 foi testada injetada no Maps real sem login: abre as avaliações, rola e dispara o download; sem login o Google mostra só 5 avaliações e não deixa ordenar, então a falha relatada no modo logado ainda não foi reproduzida.

### 07:03
**Objeto**: `_src/[B1] Google Places (estabelecimentos)/build_B1_comentarios_aprovadas.py`, coluna "data relativa" da saída `B1_comentarios_aprovadas_metropoles_mais_100_avaliacoes.xlsx`
**Antes**: código no formato número + letra ("2d", "3s", "1m"); a ordenação alfabética misturava as unidades.
**Depois**: código no formato letra + número ("d2", "s3", "m1"); a anotação de entrada aceita as duas ordens. Planilha regerada: 342 comentários, diferença zero com as células da entrada.
**Justificativa**: pedido do autor: ao retomar a coleta, ordenar a coluna agrupa por unidade (dia, semana, mês) e o comentário mais antigo é o maior número do grupo "m".

### 07:31
**Objeto**: banco "B - Comentários" do Notion, coluna "Data relativa" (539 linhas)
**Antes**: códigos em duas grafias, número + letra ("1m", "3s", "2d", "8h"; 293 linhas) e por extenso ("1 mês", "3 meses", "2 semanas", "4 dias"; 246 linhas). Ordenar a coluna misturava unidades e grafias.
**Depois**: todas no formato letra + número: d1–d6 (38), h3, h8 e h15 (3), s1 (51), s2 (44), s3 (78), s4 (19), m1 (198), m2 (46), m3 (63). Ficaram como estavam 48 linhas sem data e 1 com "3" sem unidade (Magic Store Brazil), que precisa de conferência manual. Total do banco conferido depois da troca: 588 linhas, igual ao de antes.
**Justificativa**: pedido do autor: ao retomar a coleta, ordenar a coluna agrupa por unidade (dia, semana, mês), e o comentário mais antigo de cada casa é o maior número do grupo "m". A grafia por extenso entrou na troca porque também quebrava o agrupamento.
