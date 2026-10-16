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

### 11:28
**Objeto**: `_src/[B2] Google Places (comentarios)/maps_avaliacoes.user.js` (versão 2026.10.13-5), painel; `maps_avaliacoes.test.cjs`
**Antes**: painel com fonte do sistema a 13 px, botões de texto com borda ocupando linha inteira ou meia linha, filtros em caixas de marcar, opinião em lista suspensa com a definição no texto da opção, legenda dos destaques e explicações sempre visíveis, resumo da coleta em texto corrido no fim do painel, sem como percorrer os comentários filtrados.
**Depois**: visual pelos padrões de `_shared` (design-standards.md e minimalismo.md): Montserrat, Heroicons outline, roxo como cor primária, botões delineados por fundo, tema claro e escuro. Títulos das seções a 15 px; seções lembram se estavam abertas. Filtros: busca primeiro (com botão de limpar todos), temas e componentes em etiquetas cinza que ficam azuis quando ligadas, opinião em abas "Todas / Positivas / Negativas", definições em balões ⓘ. Setas ao lado de "Filtros" (e Enter/Shift+Enter na busca) vão ao próximo e ao anterior que passa, com a posição (ex.: 3/12). Botões-ícone: localizar período (calendário), achar na página (lupa), confere e diverge (verde e vermelho), CSV da conferência (documento com check), fila, histórico e sal. Resumo da coleta logo abaixo do botão de coletar, com cor pelo desfecho, contagens em tópicos e avisos destacados; conferência com o coletado e a página em blocos e selos "confere/diverge". Sal mostra início e fim para conferir entre domínios e copia direto para a área de transferência. Nova seção "Comentários filtrados", abaixo do sal: lista com nota, data, opinião, "nova", fotos, trecho e temas; clicar rola até o comentário. Busca com espera de 200 ms ao digitar; teclas digitadas no painel não acionam atalhos do Maps. Contorno do comentário em foco passa de amarelo a roxo. Teste novo da navegação (7 de 7 passando).
**Justificativa**: pedido do autor: melhorar a UX/UI do painel seguindo os princípios de `_shared`. Conferido numa página local com cartões simulados (filtros, navegação, balões, lista, resumo, claro e escuro); falta testar no Maps real.

### 11:44
**Objeto**: `_src/[B2] Google Places (comentarios)/maps_avaliacoes.user.js` (versão 2026.10.13-6); `maps_avaliacoes.test.cjs`
**Antes**: filtros e período voltavam ao padrão a cada página carregada (inclusive entre lugares da fila); painel fixo no canto, sem mudar tamanho; progresso só em texto; a conferência mostrava só a posição e o número de marcadas; a página era refiltrada inteira a cada 1,5 s, mesmo sem mudança.
**Depois**: (1) período e filtros salvos no Tampermonkey e restaurados ao abrir, com selo azul "n ativos" no título "Filtros". (2) Painel arrastável pelo cabeçalho e redimensionável pelo canto, com posição e tamanho salvos; duplo clique no cabeçalho volta ao canto e ao tamanho padrão. (3) Barra de progresso da coleta (maior entre carregadas ÷ volume do lugar e idade da última ÷ fim do período, até 99% enquanto roda) e da fila (lugar atual ÷ total). (4) Refiltragem periódica só quando a lista muda (observador de mutações na lista) ou muda o lugar; mudanças de filtro continuam aplicando na hora. (5) Placar da conferência: confere, diverge e faltam em barra verde e vermelha, fidelidade com intervalo de Wilson (95%) e quantas divergências a comparação automática apontou. Três testes novos (Wilson, placar fecha com o total sorteado, filtros salvos); 10 de 10 passando.
**Justificativa**: pedido do autor (sugestões 1, 2, 4, 6 e 7 da rodada anterior). Conferido na página local com cartões simulados: filtros restaurados, arraste salvo sem minimizar, duplo clique, barra durante a coleta e placar; falta testar no Maps real.

### 12:23
**Objeto**: `_instrucoes/4_metodologia.md`, recorte temporal do Bloco B2 (escopo, §3.3, variável velocidade de avaliações, quadro de limitações)
**Antes**: avaliações com texto até "um mês atrás"; janela de um mês.
**Depois**: avaliações com texto até "3 meses atrás"; o rótulo cobre de 90 a 119 dias, e a janela vai de 90 a 120 dias antes da coleta. Limitação reescrita: a janela cobre só parte do ano e não mede sazonalidade.
**Justificativa**: pedido do autor: o período de coleta foi ampliado para "até três meses atrás".

### 12:23
**Objeto**: `_instrucoes/4_metodologia.md`, divisão da base em metades (escopo, quadro do cap. 3, §3.4 pipeline e validação do dicionário, §3.5, §3.6)
**Antes**: avaliadores sorteados em metade exploratória e metade confirmatória; dicionário validado em 200 avaliações da metade exploratória; seção "Divisão da base".
**Depois**: base única. A etapa exploratória e a descritiva usam a população inteira de avaliações; as 200 avaliações da validação do dicionário saem da base inteira; a seção vira "Base única" e declara que, se o extra for feito, os testes rodam na mesma base em que o dicionário foi construído. §3.5 passa a "Registro prévio — extra".
**Justificativa**: orientação do orientador, repassada pelo autor em 13/10/2026: fazer as etapas exploratória e descritiva com a população total de comentários.

### 12:23
**Objeto**: `docs/estatidez.md` (novo)
**Antes**: não existia.
**Depois**: explicação em linguagem simples do sorteio com semente fixa e chave aleatória (passo a passo e consequências), da fórmula de Cochran e do intervalo de Wilson, com tabela de aprovação pelo critério de 5% e referências marcadas [A VERIFICAR].
**Justificativa**: pedido do autor, para entender e defender na banca o método de sorteio e o cálculo do tamanho da amostra da auditoria.

### 12:23
**Objeto**: divergência entre `_instrucoes/4_metodologia.md` e outros documentos sobre o recorte do B2 e a divisão da base
**Antes**: "até 'um mês atrás'" em `CLAUDE.md`, `README.md`, `_instrucoes/1_estrutura.md` (vocabulário controlado), `docs/bibliografia/diagnostico-teorico.md`, `textos/projeto_pesquisa_luderia.md`, `textos/cronograma_luderia.md`, `textos/cronograma_luderia_semanas.md` e no cabeçalho do `maps_avaliacoes.user.js`; metade exploratória e confirmatória em `_instrucoes/1_estrutura.md` (§3.5), `textos/projeto_pesquisa_luderia.md` e `textos/registro_previo_luderia.md`.
**Depois**: `_instrucoes/4_metodologia.md` (13/10/2026): até "3 meses atrás" e base única.
**Efeitos colaterais**: os demais documentos descrevem um recorte e um desenho que não valem mais; a velocidade de avaliações calculada com janela de um mês fica incomparável com a de três meses. Correção depende de pedido do autor.

### 12:36
**Objeto**: `_instrucoes/4_metodologia.md`, §3.4 validação da coleta do Bloco B2 (etapas 1 e 2 e nova subseção "Amostra de auditoria do Bloco B2")
**Antes**: fidelidade conferida nas mesmas 200 avaliações da validação do dicionário, em amostra estratificada por capital e faixa de volume; completude só nos estabelecimentos sorteados.
**Depois**: amostra estratificada por estabelecimento, todos incluídos: n = 200 pelo critério de Wilson (aprova com até 3 erros), mínimo de 3 por estabelecimento, restante proporcional com maiores restos, chave aleatória com semente fixa; taxa sem e com ponderação, prevalece a pior; segunda etapa nos estabelecimentos com erro (todas até 30, senão mais 20), fora da taxa geral. Completude em todos os estabelecimentos. B1 mantém o desenho anterior.
**Justificativa**: pedido do autor (opções B + E discutidas na sessão): auditar cada estabelecimento, porque falhas do script tendem a se concentrar em certas páginas.

### 12:36
**Objeto**: `docs/estatidez.md`, nova seção 4
**Antes**: seções 1 a 3 (semente fixa, Cochran, Wilson).
**Depois**: seção 4 com estratificação por estabelecimento, percentual × número absoluto, quadro das opções A a E, receita B + E e tabela hipergeométrica mostrando que o tamanho da base quase não muda a amostra; NBR 5426 nas referências.
**Justificativa**: pedido do autor.

### 15:01
**Objeto**: scripts do Tampermonkey (`instagram_coletor.user.js`, `cardapio_coletor.user.js`, `maps_horarios_pico.user.js`, `maps_avaliacoes.user.js`) e o teste `maps_avaliacoes.test.cjs`
**Antes**: os três primeiros em `_src/[B1] Google Places (estabelecimentos)/`; `maps_avaliacoes.user.js` e o teste em `_src/[B2] Google Places (comentarios)/`.
**Depois**: todos em `_src/Web scripts/`; o teste foi junto porque lê o script pela própria pasta. Caminho citado em `_src/[B1] Instagram/instagram_comum.py` atualizado.
**Justificativa**: pedido do autor: separar os scripts de navegador dos scripts Python do pipeline.

### 15:11
**Objeto**: `_src/Web scripts/gerar_carregadores.py` (novo); `.gitignore`
**Antes**: cada melhoria num script do Tampermonkey exigia colar o código de novo no navegador.
**Depois**: o gerador cria em `_src/Web scripts/carregadores/` (fora do git, com o caminho absoluto da máquina) um carregador por script, com o mesmo cabeçalho, @name e @namespace e um @require file:/// para o arquivo do repositório. Instalado uma vez, o navegador lê o código do disco a cada página; só mudança de cabeçalho pede reinstalação, que o gerador detecta e abre no Chrome com `--abrir`.
**Justificativa**: pedido do autor: atualizar os scripts no navegador automaticamente quando o código melhora.

### 15:23
**Objeto**: `_src/Web scripts/gerar_carregadores.py`
**Antes**: abria os carregadores no Google Chrome, que não está instalado, e gravava o cabeçalho como instalado mesmo quando a abertura falhava.
**Depois**: abre no Vivaldi, o navegador com o Tampermonkey (opção `--navegador` para outro); só marca como instalado o que abriu sem erro.
**Justificativa**: a primeira execução falhou; o Firefox também tem o Tampermonkey, mas lá ele não lê `@require file:///`.

### 15:41
**Objeto**: `docs/estatidez.md`, seção 1, passos 5 e 6 do método da chave fixa
**Antes**: descrição abstrata: "uma fórmula viva (COUNTIFS) conta quantas da mesma urna têm bilhete menor" e "a soma dos n_h tem que dar o n total".
**Depois**: dois exemplos numéricos: urna com 5 avaliações e 2 vagas, com a fórmula CONT.SES; divisão de 10 vagas entre 4 urnas, mostrando o arredondamento comum somando 11 e o método dos maiores restos fechando em 10.
**Justificativa**: o autor não entendeu os dois passos.

### 19:51
**Objeto**: `_src/[B2] Google Places (comentarios)/build_B2_avaliacoes.py` (novo); `.gitignore`; `README.md` (linha do B2 no pipeline); saídas `B2_cobertura_coleta.csv`, `B2_fila_coleta.txt` e `B2_avaliacoes_periodo.csv` (fora do git)
**Antes**: cada coleta do userscript ficava solta em `~/Downloads`; não havia script do B2 que juntasse as coletas, preenchesse o `place_id` ausente, conferisse a cobertura ou dissesse o que faltava coletar.
**Depois**: o script move os CSV `_tudo` e `_resumo` para `_data/raw/[B2] Avaliacoes recentes/` (`coletas/` fora do git, por conter texto), liga cada coleta à luderia aprovada do B1 pelo cid do Maps (segunda parte do `id_maps` = `?cid=` do link do B1, conferido no BoardZ), deduplica por `review_id` ficando a coleta mais recente, aplica o recorte do método (até "3 meses atrás", idade ≤ 90 dias, levada à data da coleta mais recente), confere as somas (diferença zero) e classifica cada uma das 51 aprovadas em ok, refazer, conferir ou coletar. Os `place_id` a coletar ou refazer vão para `B2_fila_coleta.txt` e para a área de transferência, prontos para o campo Fila do userscript. Primeira execução: 2 ok (BoardZ, Bodogami), 49 a coletar, 758 avaliações no recorte (482 com texto). O CSV de Ludus Luderia em `~/Downloads` veio de uma página de teste (`localhost`), não do Maps, e foi devolvido à pasta.
**Justificativa**: pedido do autor: reduzir o trabalho manual da coleta do B2 e conferir a cobertura de cada estabelecimento.

### 19:51 — divergência
**Objeto**: recorte do Bloco B2
**Antes**: `CLAUDE.md` e `README.md`: avaliações até "um mês atrás".
**Depois**: `_instrucoes/4_metodologia.md`: avaliações até "3 meses atrás", inclusive (registrado em 13/10/2026).
**Efeitos colaterais**: `build_B2_avaliacoes.py` segue a metodologia (90 dias). Os dois arquivos mais antigos não foram corrigidos; aguardam pedido do autor.

### 19:58
**Objeto**: recorte do Bloco B2 em `CLAUDE.md`, `README.md` e `_instrucoes/1_estrutura.md` (vocabulário controlado, "Velocidade de avaliações")
**Antes**: avaliações até "um mês atrás".
**Depois**: avaliações até "3 meses atrás", inclusive, como em `_instrucoes/4_metodologia.md`.
**Justificativa**: o autor confirmou o recorte de 3 meses; resolve a divergência registrada às 19:51.

### 20:45
**Objeto**: `_src/Web scripts/maps_avaliacoes.user.js` (versão 2026.10.13-7) e `maps_avaliacoes.test.cjs`
**Antes**: o CSV registrava só `periodo_de_dias` e `periodo_ate_dias` da coleta; os filtros (tema, opinião, componentes, busca) e o período usados na exportação não ficavam em lugar nenhum. O liga/desliga "Esmaecer o que fica fora" era a única opção para os comentários fora do filtro.
**Depois**: recibo dos filtros. Cada linha do CSV de avaliações leva `coleta_parar_em_conhecidas` e `coleta_ordenacao_manual` (entradas da coleta) e `recibo_recorte`, `recibo_periodo`, `recibo_temas`, `recibo_opiniao`, `recibo_componentes`, `recibo_busca` e `recibo_exportado_em` (o que foi aplicado ao arquivo: "nenhum" quando nada). O CSV-resumo leva as duas entradas da coleta. O liga/desliga virou a tab pill "Fora do filtro" com Manter, Esmaecer e Ocultar; ocultar vira esmaecer durante a coleta para não alterar a rolagem; a preferência antiga `esmaecer` é lida como "Esmaecer". Cinco testes novos (14 passam).
**Justificativa**: pedido do autor, depois de a conferência dos quatro CSV mostrar que o filtro de período da coleta não ficava registrado de modo auditável.

### 21:30
**Objeto**: `_src/Web scripts/maps_entorno.user.js` e `maps_entorno.test.cjs` (novos)
**Antes**: o entorno do B1 (`B1_entorno.csv`) vinha só da Overpass (OpenStreetMap) e da Places API: metrô, shoppings grandes (área do polígono ≥ 5.000 m²) e praias/parques. Não havia contagem de estações de VLT/BRT nem coleta por raspagem do Google Maps.
**Depois**: userscript do Tampermonkey que, para cada estabelecimento da fila (`place_id`, `nome`, `lat`, `lng`; aceita o próprio `B1_entorno.csv`), busca no Maps "estação de metrô", "estação BRT", "estação VLT" e "shopping center" centradas na coordenada (zoom 15), lê todos os resultados (nome, categoria do Maps, coordenada, avaliações, `place_id`), deduplica, classifica cada um em um único grupo pela própria categoria e nome (metrô, VLT/BRT, shopping, outro) e calcula a distância em linha reta. Exporta `maps_entorno_resumo_AAAA-MM-DD.csv` (qt de estações de metrô, de VLT/BRT e de shoppings a 500 m e 1000 m, shoppings com 1.000 avaliações ou mais como proxy de porte, distância do mais próximo lido, sinal de censura) e `maps_entorno_resultados_AAAA-MM-DD.csv` (um resultado por linha, para auditar). Quando a lista lota sem chegar ao fim, refaz a busca em quatro quadrantes a zoom 16 (±600 m). Testado no Maps em Salvador: a busca única de "estação BRT" no Itaigara lotou em 10 resultados fora de ordem de distância e omitiu a Estação BRT Hiper (686 m), achada no quadrante. Seis testes passam.
**Justificativa**: pedido do autor: coletar por raspagem do Google Maps os dados de localização (metrô, VLT/BRT e shopping a 500 m e 1000 m). O corte de 1.000 avaliações para shopping é provisório: o Maps dá a categoria "Shopping center" também a galerias e prédios comerciais ("Empresarial 104", "Free Shop" em Salvador), e o CSV de resultados permite recalibrar o corte no build.

### 22:12
**Objeto**: `_src/Web scripts/maps_entorno.user.js` (versão 2026.10.13-2) e `maps_entorno.test.cjs`
**Antes**: busca do Maps centrada no estabelecimento a zoom 15 fixo; página que não carregava em 15 s virava zero resultados; mesma estação cadastrada duas vezes contava duas; resultado mal classificado só se corrigia no CSV; shopping de porte por 1.000 avaliações ou mais (sem fonte); sem previsão de término, sem salvamento parcial e sem como refazer só os problemáticos.
**Depois**: (1) busca que não carrega é tentada de novo até 2 vezes e depois sai como falha, com os grupos que ela alimenta em branco no resumo (não zero); a tela de "tráfego incomum" (inclusive `google.com/sorry`, novo @match) pausa a fila com alarme e a retoma ao voltar ao Maps. (2) Conferido no Maps que o "@" da URL é o centro da janela, com o lado esquerdo sob o painel lateral (408 px): o centro agora vai painel/2 px para oeste, o zoom é o maior que cobre 1.000 m no mapa visível, e a cobertura real é medida em cada busca (`cobertura_min_m`); abaixo do raio, refaz com zoom menor. Teste no Iguatemi (Salvador): 1.266 m de cobertura; sem o deslocamento seriam cerca de 150 m. (3) Resultados do mesmo grupo a até 150 m e com nome parecido contam uma vez (`duplicata_de`, `duplicatas_fundidas`). (4) Painel "Revisar classificação": "outros" a até 1.000 m com cara de estação ou shopping, reclassificados com um clique (`grupo_auto`, `grupo`, `revisado`). (5) Critério de shopping de porte escolhido no painel: OpenStreetMap (shop=mall com área da bounding box ≥ 5.000 m², via Overpass, padrão), lista da Abrasce carregada como CSV, ou avaliações no Maps; colunas `qt_shoppings_porte_*` e `criterio_porte_shopping`. (8) Botão "Refazer pendentes" (falha, cobertura insuficiente ou censura possível). (11) Previsão de término no painel e CSV parcial a cada 10 estabelecimentos (opção). (12) Aviso de janela própria no cabeçalho, no painel e no status quando a aba está em segundo plano. Resumo passa a ser montado na exportação (revisões e critério de porte valem retroativamente) e fecha a soma a 1.000 m com `qt_outros_1000m` e `resultados_ate_1000m`. Recomendações 7 (build do B1 a partir dos CSVs) e 10 (ler a resposta interna da busca) registradas no cabeçalho do script como implementação futura. Onze testes passam.
**Justificativa**: pedido do autor: implementar as recomendações 1, 2, 3, 4, 5 (com OSM e Abrasce como opções no painel), 8, 11 e 12, guardando a 7 e a 10.

### 22:26
**Objeto**: `textos/` (subpastas `capitulos/`, `planejamento/`, `instrumentos/`); `_src/gerar_docx_projeto.js`; caminhos em `_instrucoes/4_metodologia.md`, `_instrucoes/10_biblio-apendices.md`, `textos/instrumentos/roteiro_observacao_sao_jogue.md`, `textos/instrumentos/analise_conteudo_bardin_B2.md`, `analise_B2_conteudo_bardin.py` e `analise_B1_instagram_temas.py`
**Antes**: 12 itens soltos em `textos/`, misturando capítulo, projeto, cronogramas, roteiro de campo, livro de códigos e planilha.
**Depois**: `capitulos/` (introdução e `figuras/`), `planejamento/` (cronograma, status dos capítulos, projeto de pesquisa e registro prévio) e `instrumentos/` (roteiro de observação, livro de códigos do B2 e quadro de itens). O registro prévio não foi editado: é documento datado, e a menção a `textos/projeto_pesquisa_luderia.md` dentro dele ficou como estava.
**Justificativa**: pedido do autor (recomendação 4): achar cada arquivo pela função.

### 22:26
**Objeto**: cronograma — `textos/cronograma_luderia.md`, `textos/cronograma_luderia_semanas.md`, `cronograma_luderia.docx`, `cronograma_luderia_atual.docx`; `_src/gerar_docx_cronograma.js`; `.gitignore`
**Antes**: quatro arquivos com o mesmo cronograma: a versão em tabela única, a versão com checklist por semana (com edições do autor não salvas) e dois `.docx` gerados da versão em tabela.
**Depois**: uma só fonte, `textos/planejamento/cronograma_luderia.md` (a versão com checklist, com as edições do autor). A versão em tabela única foi guardada em `arquivados/cronograma/cronograma_luderia_tabela-unica_2026-10-02.md`. O gerador lê a nova fonte, desenha os títulos de semana e os itens de checklist (☑/☐) e, no `--resumo`, junta as tabelas semanais numa só; os `.docx` são gerados na pasta `planejamento/` e não são mais versionados.
**Justificativa**: pedido do autor (recomendação 2): o mesmo cronograma em quatro arquivos ia divergir.

### 22:26
**Objeto**: `_shared` e `_logs/` (raiz); `.gitignore`
**Antes**: na raiz, um atalho do macOS `_shared` (não versionado) e a pasta `_logs/`, vazia.
**Depois**: `_src/_shared` e `_src/_logs/`; o `.gitignore` ignora `_src/_logs/*.log` e o atalho, que só vale nesta máquina.
**Justificativa**: pedido do autor (recomendação 6): mover para `_src/` em vez de apagar.

### 22:26
**Objeto**: subpastas de `_data/` — B1: `Acervo de Jogos/`, `Cardápios/`, `Redes Sociais/Analise das legendas/{Eventos,Precos,Temas}/`, `raw/…/acervos_jogos/`; B2: `Analise de conteudo/`; B4: `Mercado e demanda/`, `Ponto e operacoes/`, `Juridico e tributario/`, `Financeiro/`, `Multiuso/`; os scripts de `_src/[B1]`, `_src/[B2]` e `_src/[B4]` que as citam (`USOS` em `bases_comum.py`); `bibliografia/referencias_bases_publicas.md`; `.gitignore`; coluna de origem em `B1_jogos_dos_acervos.csv`
**Antes**: nomes com maiúscula, acento e espaço misturados a nomes em minúsculas (`Cardápios/` em processed e `cardapios/` em raw), e `acervos_jogos/` ao lado de `acervodejogos/`, com nomes quase iguais e conteúdos diferentes.
**Depois**: minúsculas, sem acento, com `_`: `acervo_jogos/`, `cardapios/`, `redes_sociais/analise_legendas/{eventos,precos,temas}/`, `analise_conteudo/`, `mercado_demanda/`, `ponto_operacoes/`, `juridico_tributario/`, `financeiro/`, `multiuso/`; `acervos_jogos/` virou `acervos_luderias/` (acervo de cada luderia), e `acervodejogos/` (cache do site acervodejogos.com.br) ficou como estava. As subpastas por estabelecimento dentro de `cardapios/` não mudaram. Os scripts compilam, e os caminhos de `instagram_comum.py`, `jogos_comum.py` e `bases_comum.py` existem.
**Justificativa**: pedido do autor (recomendação 7): um padrão único de nome.

### 22:26
**Objeto**: `_data/raw/[B6] Historico dos avaliadores/` e `_data/processed/[B6] Historico dos avaliadores/`; `_instrucoes/4_metodologia.md` (escopo, tabela de blocos, seção "Bloco B6 — Retirado")
**Antes**: pastas vazias do B6 em `_data/` e três menções à retirada na metodologia.
**Depois**: pastas em `arquivados/B6-avaliadores/`, com `LEIAME.md` explicando a retirada; a metodologia não cita mais o B6 (a decisão está em `docs/decisoes.md`).
**Justificativa**: pedido do autor (recomendação 7): `_data/` só com os blocos em uso, como já é feito com o B5.

### 22:26
**Objeto**: `_instrucoes/` — `4_metodologia.md`, `1_estrutura.md` e `2_ref-teorico.md`; `bibliografia/lista-de-leitura.md` (novo)
**Antes**: 1.270 linhas de instrução, com histórico e justificativas misturados às regras: proposta de validação "em estudo, não adotada", troca da RAIS pelo CAGED, datas de orientação, retirada do B6, "Movidos do CLAUDE.md em 12/10/2026", aproveitamento de `introducao_tcc_luderia.md` (introdução já escrita) e a lista de leitura do cap. 2, com cerca de 110 linhas.
**Depois**: 1.142 linhas, só com regras vigentes. A proposta de validação foi para `docs/pendencias.md` (decisões a tomar, item 3); RAIS → CAGED, base única, B6 e a data da orientação foram para `docs/decisoes.md`; a lista de leitura foi para `bibliografia/lista-de-leitura.md`, com um link em `2_ref-teorico.md`. O conteúdo das regras não mudou.
**Justificativa**: pedido do autor (recomendação 10): separar regra vigente de histórico.

### 22:26
**Objeto**: `AGORA.md`, `textos/planejamento/status_capitulos.md`, `docs/decisoes.md` e `docs/pendencias.md` (novos)
**Antes**: não havia lugar com o próximo passo, a situação dos capítulos, as decisões tomadas ou as questões em aberto; essas informações estavam espalhadas pelo registro de alterações, pelas instruções, pelo diagnóstico bibliográfico e pelo cronograma.
**Depois**: `AGORA.md` (em andamento, próximos 3 passos, bloqueios e mapa de arquivos); painel de capítulos (situação, páginas contra o teto, prazo, dependência e pendência principal); 20 decisões datadas com a fonte; pendências divididas em decisões a tomar, divergências abertas, dúvidas e ideias futuras.
**Justificativa**: pedido do autor (recomendações 1, 3 e 9, mais um arquivo para dúvidas, ideias futuras e decisões a tomar).

### 22:26
**Objeto**: `CLAUDE.md` (mapa, "Estado do projeto", "Versionamento", nova seção "Fim de sessão") e `README.md` (estrutura, nova seção "Por onde começar", linha do B6)
**Antes**: commit e push após qualquer modificação, um por conjunto coerente de mudanças; caminhos antigos de `textos/` e `_logs/`; nenhum roteiro do tipo "para tal tarefa, abrir tais arquivos".
**Depois**: um commit por sessão de trabalho (ou por assunto, se a sessão tratar de assuntos sem relação entre si), com mensagem "o que avançou no TCC"; ao fim de cada sessão, atualizar `AGORA.md`, decisões, pendências e status; caminhos novos; padrão de nome das subpastas de dados; tabela do README dizendo, para cada tarefa, o que abrir e onde fica a saída.
**Justificativa**: pedido do autor (recomendações 11 e 12): menos commits picados e entrada direta por tarefa.

### 22:26
**Objeto**: divergência entre `_instrucoes/4_metodologia.md` (Bloco B3) e `textos/planejamento/cronograma_luderia.md` (semana 3) sobre a hora das visitas
**Antes**: metodologia: hora de início sorteada entre 12h e 19h, de hora em hora, com semente fixa.
**Depois**: cronograma (edição do autor): as reservas só permitiam 12h, 15h e 18h, e se optou por 18h/19h, por ser o horário de maior fluxo esperado.
**Efeitos colaterais**: o cap. 3 e o apêndice do protocolo de observação podem descrever um sorteio que não ocorreu; o argumento de que o sorteio reduz o viés na escolha dos períodos (§3.4, Bloco B3) deixa de valer se a hora foi escolhida. Registrado em `docs/pendencias.md` (item 2); a correção depende do autor.

### 22:26
**Objeto**: divergências ainda abertas entre `_instrucoes/1_estrutura.md` (3.5 e 11.5), o cronograma (semanas 2 e 3) e `CLAUDE.md`/instruções × decisão de 09/10/2026 sobre o público casual
**Antes**: `1_estrutura.md`: "metade exploratória e confirmatória" e "recorte do último mês"; cronograma: divisão da base e "avaliações do último mês"; `CLAUDE.md` e instruções: plano posicionado para o público casual.
**Depois**: base única e recorte de 3 meses (`4_metodologia.md`, 13/10/2026); recorte casual retirado (`docs/bibliografia/diagnostico-teorico.md` §0, 09/10/2026).
**Efeitos colaterais**: já registradas (13/10 e 12/10); agora também listadas em `docs/pendencias.md` para não ficarem escondidas no registro. Nenhum texto foi corrigido.

### 22:50
**Objeto**: recorte do público casual — `CLAUDE.md`, `README.md`, `_instrucoes/1_estrutura.md` (objeto, 1.2, objetivo ii, 2.3, 2.4, 5.2, P6), `2_ref-teorico.md`, `3_mercado.md`, `5_marketing.md`, `textos/capitulos/1_introducao_plano_luderia.md`, `textos/planejamento/projeto_pesquisa_luderia.md` (e `.docx`), `cronograma_luderia.md`, `textos/instrumentos/analise_conteudo_bardin_B2.md` (decisões do plano), `bibliografia/lista-de-leitura.md`, docstring de `collect_B1_entorno_osm.py`, `docs/bibliografia/lacunas-bibliograficas.md` §5
**Antes**: plano "posicionado para o público casual" em CLAUDE.md, README e instruções; introdução construída sobre a lacuna "oferta voltada ao hobbyista × público casual" (parágrafos 3 a 5, objetivo ii, justificativa social); pressuposto P1 ("o público das luderias é majoritariamente casual") no projeto e no cronograma; conceito "público hobbyista × casual" no quadro teórico do projeto e como fundamentação de A04, B06, F01 e F02; termos "público casual" e "público hobbyista" no vocabulário controlado.
**Depois**: objeto = luderia em Salvador, sem segmentação de público. Na introdução, os parágrafos 3 a 5 passaram a tratar do consumo de experiências (Gilovich, Kumar e Jampol, 2015; Mercado&Consumo, 2025), do problema de evidência e da São Jogue como única luderia de Salvador; os objetivos foram alinhados aos 7 do projeto; a justificativa social perdeu o trecho sobre a barreira hobbyista; as referências Figueiredo e Mantovani, Fundação Itaú e Ludopedia saíram, e Gilovich e Mercado&Consumo entraram. P1 saiu do projeto e do cronograma, e P2 e P3 viraram P1 e P2. A fundamentação de A04, B06, F01 e F02 passou a ser a grade ERRC. Os termos casual e hobbyista saíram do vocabulário controlado. Não foram alterados: o registro prévio (documento datado), o site de apresentação (desenho anterior, refeito na semana 9), a categoria HOB da análise de conteúdo (sinal observado nas avaliações), comentários do app de observação, dados do Instagram e diagnósticos bibliográficos datados.
**Justificativa**: decisão do autor (13/10/2026): o público casual não faz mais parte do objeto de pesquisa e sai de onde aparecer.

### 22:50
**Objeto**: horário das visitas da contagem (B3) — `_instrucoes/4_metodologia.md` (escopo, quadro do B3, §3.4 pipeline e validação, §3.6, limitações), `textos/planejamento/cronograma_luderia.md`, `textos/planejamento/projeto_pesquisa_luderia.md` (e `.docx`), rótulos do roteiro de observação
**Antes**: hora de início sorteada (12h a 19h, semente 20260916), com retorno 15 dias depois na mesma hora; "visita sorteada" como rótulo; o sorteio justificado como redutor do viés de escolha dos períodos.
**Depois**: horários planejados para o pico de fluxo provável, não sorteados: em cada unidade, sábado com entrada às 19h e domingo com entrada às 18h, 15 dias depois. A contagem passa a medir o pico, não a média do dia: nova linha de limitação, com as notas fiscais (15 dias inteiros) dando a média e a contagem entrando como limite superior. "Visita sorteada" virou "primeira visita". A planilha de sorteio fica como registro do desenho anterior. As horas do roteiro de campo (18h00 às 21h00) não foram mudadas, à espera de confirmação do autor (`docs/pendencias.md`).
**Justificativa**: decisão do autor (13/10/2026), que resolve a divergência registrada às 22h.

### 22:50
**Objeto**: `textos/planejamento/cronograma_luderia.md` (semana 2), `docs/pendencias.md`, `docs/decisoes.md`, `AGORA.md`, `textos/planejamento/status_capitulos.md`
**Antes**: tarefa "Elaboração do manual de codificação das avaliações :ma"; pendências com as decisões sobre o público casual e o horário das visitas e a dúvida sobre ":ma"; próximo passo 3 = decidir o recorte casual.
**Depois**: ":ma" trocado por "?" (atalho do autor para o ponto de interrogação); as duas decisões foram para `decisoes.md`; nova dúvida sobre as datas e horas do roteiro de campo; próximo passo 3 = rascunho do cap. 3.
**Justificativa**: respostas do autor às decisões pendentes.

## 2026/10/14

### 07:01
**Objeto**: `CLAUDE.md`, `AGENTS.md`
**Antes**: o `CLAUDE.md` não citava o padrão de documentação dos projetos; não havia `AGENTS.md`.
**Depois**: o `CLAUDE.md` passa a citar `../_shared/docs-standards.md` (derivado deste projeto e do rotinas) e manda não carregar documentação por padrão; `AGENTS.md` criado como link simbólico para o `CLAUDE.md`, para outros agentes lerem as mesmas instruções.
**Justificativa**: pedido do autor, para padronizar a documentação de todos os projetos.

### 07:19
**Objeto**: `.claude/skills/traduza/SKILL.md`, `docs/notas/` (`README.md`, `2026-10-14_vpl.md`), `CLAUDE.md` ("Registro de alterações")
**Antes**: não havia forma padronizada de pedir e guardar explicações de conteúdos não entendidos nas respostas do Claude.
**Depois**: skill de projeto `traduza`, acionada por `/traduza termos` ou `==termos==`, gera uma nota por termo em `docs/notas/` (explicação para criança de 5 a 10 anos, uso no TCC, exemplo com números e versão técnica), com índice em `docs/notas/README.md`; primeira nota (VPL) gerada como teste. O `CLAUDE.md` passa a dispensar as notas do registro de alterações.
**Justificativa**: pedido do autor, para guardar as explicações fora do histórico da conversa e estudar para a banca; pasta em `docs/` para respeitar a regra de pastas enxutas na raiz.

### 08:05
**Objeto**: `_src/sincronizar_vault.sh`, `CLAUDE.md` ("Fim de sessão")
**Antes**: não havia cópia das pastas do TCC para o vault do Obsidian; leitura no celular indisponível.
**Depois**: script com `rsync` em sentido único copia `docs/`, `textos/` e `bibliografia/` (inclusive `leituras-P1/`, ignorada pelo git) para `~/Documents/2oCerebro/C4-Projetos/TCC Luderia/`; `--simular` mostra o que mudaria. O `CLAUDE.md` manda rodá-lo depois do commit de fim de sessão.
**Justificativa**: pedido do autor, para ler o TCC no celular pela sincronização do vault; cópia em vez de mover pastas ou usar atalhos, para o git continuar versionando o conteúdo.

### 08:20
**Objeto**: `_src/sincronizar_vault.sh`
**Antes**: destino da cópia em `~/Documents/2oCerebro/C4-Projetos/TCC Luderia/`.
**Depois**: destino em `~/Documents/2oCerebro/1-Graduação/12-TCC/Luderia/` (subpastas `docs`, `textos`, `bibliografia`); a cópia antiga foi apagada. Os dois arquivos que já estavam na raiz de `Luderia/` não são tocados, pois o `--delete` age só dentro das três subpastas.
**Justificativa**: pedido do autor, para manter o TCC junto das demais pastas da graduação no vault.

### 08:25
**Objeto**: pastas `_data/`, `Anexos/`, `site-apresentacao/`, `app-observacao/`; caminhos em todos os scripts de `_src/`, `.gitignore`, `.claude/launch.json`, `CLAUDE.md`, `README.md`, `AGORA.md`, `_instrucoes/`, `bibliografia/`, `textos/`, nos userscripts e nas colunas de caminho dos CSV de `dados/` (ex.: `B1_jogos_dos_acervos.csv`); `_src/app-observacao/scripts/gerar_jogos.py` e `CLAUDE.md` do app; versão do app (`versionCode` 9, `2026.10.14-1`)
**Antes**: dados em `_data/raw/[Bn] Nome/` e `_data/processed/[Bn] Nome/`; `site-apresentacao/` e `app-observacao/` na raiz; `Anexos/` com uma subpasta vazia (`Cardápios (fotos)`).
**Depois**: `dados/[Bn] Nome/` com os arquivos processados na raiz do bloco e os brutos em `dados/[Bn] Nome/dados-brutos/`; site e app em `_src/site-apresentacao/` e `_src/app-observacao/` (no app, `parents[3]` e `../../../_shared`); `Anexos/` apagada. As regras do `.gitignore` seguem os novos caminhos e deixam de fora os mesmos arquivos (244 arquivos de dados rastreados antes e depois). `arquivados/` e os registros antigos deste arquivo mantêm os caminhos da época.
**Justificativa**: pedido do autor, para deixar a raiz mais enxuta e juntar processados e brutos de cada bloco numa só pasta; `Anexos/` não tinha mais conteúdo nem menção.

### 08:57
**Objeto**: `_src/` — pastas dos blocos, os 51 scripts de etapa, os 7 módulos auxiliares, `_src/Web scripts/` (5 webscripts, 2 testes, `gerar_carregadores.py`), `_src/_logs/`; novos `_src/dicionario.md`, `_src/log_execucao.py` e `[B1] Google Places (estabelecimentos)/outros/regic.py`; `.gitignore`; menções em `CLAUDE.md`, `README.md`, `_instrucoes/4_metodologia.md`, `bibliografia/referencias_bases_publicas.md`, `textos/instrumentos/analise_conteudo_bardin_B2.md`, `requirements.txt` e no `CLAUDE.md` do app; `dados/[B3] Contagem direta de ocupacao/B3_contagem_sorteio_visitas.xlsx`
**Antes**: scripts soltos na pasta de cada bloco, com nomes `<etapa>_Bn_<conteúdo>.py` e `ROOT = …parents[2]`; webscripts juntos em `_src/Web scripts/`; `_src/_logs/` vazia e nenhum script gravava log; `B1-b_planilhas_regic` importava `load_regic` de `analise_B1_limiares.py` e `build_B4_caged_salarios` importava `CBOS` de `collect_B4_caged.py`; convenções de nomes espalhadas pelo registro de alterações; a aba "Instruções" do sorteio do B3 ainda citava "Bloco D" e `_src/[D] …/build_contagem_sorteio.py`.
**Depois**: cada bloco de `_src/` tem `collect/`, `build/`, `analise/`, `webscripts/`, `logs/` e `outros/` (pasta vazia com `.gitkeep`); scripts renomeados para `Bn-<c|b|a>_<conteúdo>.py` (ex.: `build_B1_cardapios_ocr.py` → `build/B1-b_cardapios_ocr.py`), com `parents[3]` e um bloco de abertura que inclui `_src/` e `outros/` no caminho de importação e liga o log (`registrar_execucao`, só quando executado diretamente); auxiliares em `outros/`, `load_regic` e constantes da REGIC no novo `regic.py` e `CBOS` em `bases_comum.py`, porque nome com hífen não pode ser importado; webscripts em `webscripts/` do bloco (`maps_horarios_pico` e `maps_entorno` em `[B1] Google Places`), `gerar_carregadores.py` na raiz de `_src/`, varrendo `[B*]/webscripts/`, com carregadores em `_src/carregadores/`; logs em `logs/<script>_AAAA-MM-DD_HHMM.log`, fora do git; `_src/dicionario.md` com as convenções atuais e passadas de pastas, scripts, arquivos, colunas, valores e variáveis, incluindo regras novas para valores (`sim`/`nao`, célula vazia para ausente, ponto decimal, `;` com BOM) que não convertem arquivos já gerados. Conferência: 54 arquivos compilam; 60 caminhos de constantes existem, salvo `dados-brutos/app` do B3, ainda sem coleta; testes dos webscripts passam (14 e 11); 16 scripts sem API rodaram e geraram log, e só o `.xlsx` do sorteio do B3 mudou, nas duas linhas de texto da aba "Instruções" (números iguais, mesma semente).
**Justificativa**: pedido do autor, para separar os scripts por etapa, encurtar os nomes, guardar o histórico das execuções e reunir as convenções de nomes num só lugar.

### 09:29
**Objeto**: `dados/[Bn] Nome/dados-brutos/` (4 pastas); estrutura de `_src/` (102 arquivos movidos); utilitários da raiz de `_src/`; caminhos nos scripts, `.gitignore`, `CLAUDE.md`, `README.md`, `AGORA.md`, `_instrucoes/4_metodologia.md`, `bibliografia/referencias_bases_publicas.md`, `textos/instrumentos/`, `_src/app-observacao/CLAUDE.md` e `_src/dicionario.md`; `dados/[B3] Contagem direta de ocupacao/B3_contagem_sorteio_visitas.xlsx`
**Antes**: brutos em `dados/[Bn] Nome/dados-brutos/`; `_src/` com uma pasta por fonte (`[B1] Acervo de Jogos`, `[B1] Cardapios`, `[B1] Google Places (estabelecimentos)`, `[B1] Instagram`, `[B2] Google Places (comentarios)`, `[B3] Contagem direta de ocupacao`, `[B4] Bases publicas` com as sete fontes juntas); `gerar_carregadores.py`, `gerar_docx_cronograma.js`, `gerar_docx_projeto.js`, `log_execucao.py`, `sincronizar_vault.sh` e `carregadores/` soltos na raiz de `_src/`.
**Depois**: brutos em `_dados-brutos/`. `_src/` com as pastas de bloco iguais às de `dados/` e, dentro, uma pasta por objeto, cada uma com `collect/`, `build/`, `analise/`, `webscripts/`, `logs/` e `outros/`: B1 → `Google Places (Negócios)`, `Cardápios`, `Acervo de Jogos`, `Instagram`; B2 → `Google Places (Comentários)`; B3 → `Contagem direta`; B4 → `BCB`, `CAGED`, `CONCLA`, `FipeZap`, `IBGE Censo`, `IBGE SIDRA`, `Simples Nacional`, com `bases_comum.py` em `Comum/`. Utilitários em `_src/extras/` (com `ROOT` e caminhos ajustados). Scripts com `parents[4]` e caminho de importação para `_src/extras/`, `outros/` e, no B4, `Comum/`. O `.xlsx` do sorteio do B3 mudou só no caminho do script, na aba "Instruções". Conferência: 60 arquivos Python compilam; 60 caminhos de constantes existem, salvo `_dados-brutos/app` do B3, ainda sem coleta; testes dos webscripts passam (14 e 11); 16 scripts sem API rodaram e gravaram log na pasta do objeto; o `.docx` do cronograma é gerado; 46 arquivos rastreados de `_dados-brutos/` e nenhum arquivo ignorado entrou no git.
**Justificativa**: pedido do autor, para espelhar em `_src/` os blocos de `dados/`, separar os scripts por objeto e deixar a raiz de `_src/` só com as pastas de bloco, `extras/`, o app, o site e o dicionário.

### 11:59
**Objeto**: `dados/[B1] Estabelecimentos e cardapios/` (26 saídas da raiz, 7 brutos do Google Places, 98 coletas do Instagram, 21 pastas de cardápios); scripts do B1 e `B2-b_avaliacoes.py`; novo `_src/[B1] Estabelecimentos e cardapios/Cardápios/outros/cardapios_comum.py`; `.gitignore`; `CLAUDE.md`, `_instrucoes/10_biblio-apendices.md`, `_src/dicionario.md`, `docs/pendencias.md`
**Antes**: 26 saídas soltas na raiz do B1, com nomes por extenso (ex.: `B1_planilha_curadoria_metropoles_filtrada_mais_100_avaliacoes.csv`); brutos do Google Places soltos em `_dados-brutos/`; 98 CSV do Instagram soltos em `redes_sociais/`; originais dos cardápios em `cardapios/<Nome>/` (com espaço, acento e às vezes `Cardápio ` na frente); `B1-b_cardapios_planilha.py` gravava `B1_cardapios_itens_precos.xlsx` na raiz do B1, embora o arquivo versionado estivesse em `cardapios/`.
**Depois**: raiz do B1 só com pastas. Saídas em `estabelecimentos/1_busca/` (triagem, termos suspeitos, descartados, conferência da RM, cobertura da lista manual), `estabelecimentos/2_recorte/` (curadorias e limiares) e `estabelecimentos/3_triagem/` (triagem manual, aprovadas, comentários, base de amostragem, Instagram das aprovadas), e `entorno/`, com nomes curtos (`metro`, `regio`, `f`, `av50` = 50 ou mais, `av100` = mais de 100; ex.: `B1_curadoria_metro_f_av100.csv`, `B1_aprovadas_metro_av100.xlsx`, `B1_limiares_regio_f.png`). Brutos do Google Places em `_dados-brutos/estabelecimentos/`. Instagram em `redes_sociais/rs_<cidade>/rs_<perfil>/` (13 cidades; `coviljogos`, `dominariacg.sp` e `ludocafe_editora`, fora da lista de aprovadas, pela cidade do endereço na curadoria). Cardápios em `_dados-brutos/cardapios/ca_<cidade>/ca_<estabelecimento>/` (19 pastas; `Alçapão` e `Alçapão Jogos` juntas em `ca_alcapao_jogos`), salvo `Cardapio de jogos Covil Game bar`, em `_dados-brutos/acervos_luderias/`; a pasta de cada nome fica em `PASTAS` (`cardapios_comum.py`), usada pela coleta e pelo OCR, que mantêm o nome antigo na coluna `estabelecimento`; coluna `arquivo` de `B1_cardapios_baixados.csv` com o caminho novo. Cidade = capital da região metropolitana do endereço. `.gitignore` aponta as aprovadas e os comentários para `estabelecimentos/3_triagem/`. Conferência: 16 scripts sem API rodaram; todos os CSV regenerados ficaram iguais (só renomeados); nos `.xlsx`, `B1_base_amostragem` mudou só o título das abas ("Bloco A" → "Bloco B1"); 61 arquivos Python compilam; testes dos webscripts passam (14 e 11); nenhum arquivo ignorado entrou no git.
**Justificativa**: pedido do autor, para abrir a pasta do B1 sem ver dezenas de arquivos de uma vez e encurtar os nomes.

### 13:06
**Objeto**: `dados/[B1] Estabelecimentos e cardapios/cardapios/` (4 PDFs soltos) e `_dados-brutos/cardapios/` (arquivos soltos e pastas `boardz/`, `castelos/`, `placegames/`), todos fora do git; `B1-b_jogos_covil.py`, `cardapios_comum.py`, `_src/dicionario.md`
**Antes**: 4 PDFs de cardápio soltos em `cardapios/` e originais transcritos à mão soltos em `_dados-brutos/cardapios/` ou em pastas sem o prefixo `ca_`.
**Depois**: 34 arquivos movidos para `ca_<cidade>/ca_<estabelecimento>/` (novas `ca_sao_paulo/ca_arena_bg`, `ca_bodogami`, `ca_fan_hour`, `ca_place_games` e `ca_belo_horizonte/ca_shelf_bar`; `boardz` e `castelos` juntos com as pastas já existentes do BoardZ e do Castelos); o PDF de jogos do Covil foi para `_dados-brutos/acervos_luderias/Cardapio de jogos Covil Game bar/`, e `B1-b_jogos_covil.py` lê de lá (saída igual, 239 jogos). 9 arquivos idênticos byte a byte a outro da pasta de destino foram para a Lixeira do macOS (Arcadea, 2 do BoardZ, Bodogami, 2 do Castelos, Luderia Carioca, Ludus, Fortalúdica). `_dados-brutos/cardapios/` fica só com as pastas `ca_<cidade>/` e `transcricao/`; `cardapios/` só com as saídas e `transcricao/`.
**Justificativa**: pedido do autor, para aplicar o padrão `ca_` a todos os originais de cardápio.

### 16:56
**Objeto**: `dados/[B2] Avaliacoes recentes/` (`B2_avaliacoes_periodo.csv`, fora do git; `B2_cobertura_coleta.csv`; `B2_fila_coleta.txt`), regerados por `B2-b_avaliacoes.py --sem-mover` com as 52 coletas coladas em `_dados-brutos/coletas/` em 13 e 14/10
**Antes**: 2 de 51 luderias com coleta (BoardZ, Bodogami); 49 na fila.
**Depois**: 46 ok e 5 a coletar (Flow Games, Machado Games, Ilusões Industriais, Dungeon Games Store, Paladino Hobbies); 1.948 avaliações no recorte, 1.213 com texto; soma da cobertura confere (diferença 0).
**Justificativa**: pedido do autor: atualizar a base a partir das coletas novas e dizer o que falta coletar.

### 16:56
**Objeto**: banco "B - Comentários" do Notion (coluna nova "ID da avaliação"; 715 páginas novas; 1 página corrigida)
**Antes**: 595 linhas digitadas à mão, sem identificador da avaliação.
**Depois**: 1.310 linhas. Coluna "ID da avaliação" (texto, `review_id` do Google Maps) criada; entram as 715 avaliações com texto no recorte que ainda não estavam no banco (as outras 498 já estavam, conferidas pelos primeiros 16 caracteres do texto sem acento nem pontuação, por estabelecimento). 715 IDs distintos, sem repetição. Campos: Comentário original, Estabelecimento (nome do B1), Nota geral, notas de comida, serviço e ambiente, Data relativa no formato letra + número (h0 para "minutos atrás"), Data da coleta registrada, Preço por pessoa (faixa sem "R$"), Tamanho do grupo, Nível de barulho e Tempo de espera mapeados para as opções do banco, Nº do comentário (posição na lista do Maps). As linhas antigas ficaram como estavam, sem ID. A página do Play Easy com título "não" foi corrigida para o texto da avaliação.
**Justificativa**: pedido do autor. A coluna de ID permite atualizar o banco depois sem duplicar.

### 16:56 — divergência
**Objeto**: coleta do Shelf Bar e Jogos (`2026-10-13_shelf_bar_e_jogos_maps_avaliacoes_tudo.csv`)
**Antes**: `B2_cobertura_coleta.csv` classifica como "ok" (motivo de parada "fim da lista").
**Depois**: a coleta leu só 40 avaliações, a mais antiga de "uma semana atrás", com `volume_na_coleta` = 31, enquanto o B1 registra 1.505 avaliações.
**Efeitos colaterais**: o Shelf está incompleto no B2 e no Notion (só a última semana). O build trata "fim da lista" como coleta completa mesmo quando o volume lido fica muito abaixo do volume do B1.

### 16:56 — divergência
**Objeto**: coluna `texto_original` das avaliações traduzidas no CSV do userscript `maps_avaliacoes`
**Antes**: esperado o texto no idioma original.
**Depois**: nas 6 avaliações com `traduzida` = sim, a coluna traz "não".
**Efeitos colaterais**: o texto original dessas avaliações não foi coletado; no Notion entrou a tradução do Google.

### 16:56 — divergência
**Objeto**: banco "B - Comentários" do Notion, Flow Games e Machado Games
**Antes**: as 13 linhas de Machado Games.
**Depois**: têm os mesmos textos das 13 linhas de Flow Games - Burgers Cards & Comunidade.
**Efeitos colaterais**: um dos dois conjuntos foi lançado no estabelecimento errado; contagens por casa ficam infladas até a correção.

### 17:32
**Objeto**: `bibliografia/leituras-P2/`, `bibliografia/leituras-P1/` (PDFs de Asakura, Figueiredo e Mantovani e KAM Insight), `.gitignore`
**Antes**: PDFs de Asakura, Figueiredo e Mantovani e KAM Insight soltos em `bibliografia/` (versionados); nenhum PDF da P2 baixado; `.gitignore` ignorava `leituras-P1/` inteira.
**Depois**: os três PDFs em `leituras-P1/` (movidos pelo autor), fora do git. `leituras-P2/` com 5 PDFs abertos (Luca, McHugh, Cameron e Miller, Liddell e Kruschke, Fiesler et al.), indicados no roteiro de leitura. Kimes e Robson (2004) não baixou: o eCommons recusou o acesso automático (erro 429). `.gitignore` ignora o conteúdo de `bibliografia/leituras-*/`, menos o `checklist-conceitos.md`.
**Justificativa**: pedido do autor de uma pasta com a segunda leva (P2); os checklists precisam ser versionados, os PDFs de terceiros não.

### 17:32
**Objeto**: `bibliografia/leituras-P1/checklist-conceitos.md`, `bibliografia/leituras-P2/checklist-conceitos.md`, `bibliografia/relatorio-conceitos.md`, `_src/extras/conceitos/` (`verificar_conceitos.py`, testes, `instalar_vigia.sh`), LaunchAgent `br.ufba.tcc-luderia.verificar-conceitos`
**Antes**: sem lista dos conceitos tirados de cada obra; páginas a conferir marcadas só pelo status VM da matriz.
**Depois**: checklist por leva com termo (com ID `Rnn-x`), definição atual (com arquivo de origem), definição real (em branco), autores e referência ABNT terminada em `[AV]`: 25 conceitos na P1 (R01–R16, R50, Figueiredo e Mantovani, KAM Insight) e 34 na P2 (R17–R49). Script troca `[AV-<ID>]` pela página quando o autor tira o `[AV]` da linha, tira o `[AV]` da obra nas listas de referências (completando o intervalo de páginas se faltar), muda VM para VT na matriz quando a obra fecha e grava o relatório de pendências e divergências; 7 testes passam. Vigia do launchd roda o script a cada mudança nas pastas `leituras-*`.
**Justificativa**: pedido do autor: conferir conceito a conceito contra a obra e propagar a página sem edição manual.

### 17:32
**Objeto**: marcador de referência não conferida em `CLAUDE.md`, `.claude/skills/traduza/SKILL.md`, `_instrucoes/4_metodologia.md`, `_instrucoes/8_financeiro.md`, `_instrucoes/10_biblio-apendices.md`, `bibliografia/lista-de-leitura.md`, `bibliografia/referencias_bases_publicas.md`, `docs/estatidez.md`, `docs/bibliografia/diagnostico-teorico.md`, `docs/bibliografia/roteiro-leitura.md`, `textos/planejamento/projeto_pesquisa_luderia.md`, `textos/instrumentos/analise_conteudo_bardin_B2.md`
**Antes**: `[A VERIFICAR]` (84 ocorrências, duas com nota após dois-pontos).
**Depois**: `[AV]`, com as notas mantidas (`[AV: ...]`); novo marcador `[AV-<ID>]` para página de conceito, descrito no `CLAUDE.md` e em `_instrucoes/10_biblio-apendices.md`. Não alterados: este registro e `arquivados/` (históricos).
**Justificativa**: pedido do autor de um marcador único e curto.

### 17:32 — divergência
**Objeto**: obra de Damodaran em `_instrucoes/8_financeiro.md` e `docs/bibliografia/roteiro-leitura.md` (R18)
**Antes**: `8_financeiro.md` cita DAMODARAN, *Avaliação de investimentos* (edição brasileira).
**Depois**: o roteiro (09/10) cita *Investment valuation* (Wiley, ISBN 1394254628), e o checklist da P2 seguiu o roteiro.
**Efeitos colaterais**: edição e paginação diferentes; a página conferida no checklist só vale para a edição lida.

### 18:04
**Objeto**: `_src/[B1] Estabelecimentos e cardapios/Instagram/`: `webscripts/instagram_coletor.user.js` (2026.10.14-1) e teste novo `instagram_coletor.test.cjs`; `build/B1-b_instagram_seguindo.py`, `analise/B1-a_instagram_snowball.py` e `outros/snowball_comum.py` (novos); `.gitignore`; `_instrucoes/4_metodologia.md` (Cobertura); `_src/dicionario.md`; `CLAUDE.md`; `docs/decisoes.md`; `docs/pendencias.md`; `AGORA.md`
**Antes**: sem coleta da lista "seguindo"; checagem de cobertura do B1 pelo Instagram prevista só como busca manual de perfis.
**Depois**: o coletor lê a lista "seguindo" de uma luderia sem pedido próprio: guarda as respostas que a página recebe ao rolar o diálogo (botão "Rolar lista de seguindo") e, como reserva, os @ visíveis antes de "Sugestões para você"; salva no navegador e exporta `AAAA-MM-DD_<perfil>_instagram_seguindo.csv`. O build junta as listas, conta o grau de entrada de cada conta (nº de sementes que a seguem), marca a situação (aprovada no B1, na curadoria do Maps, no Acervo de Jogos, nova) e grava a lista de candidatos com grau 2 ou mais e colunas de classificação manual, preservadas entre execuções; casas aprovadas entram já classificadas. A análise calcula, por corte k, precisão e sensibilidade com IC de Wilson, lista as casas novas (só perfis de negócio ou grupo) e estima a cobertura do B1 por captura e recaptura (Chapman, limite inferior). Brutos e candidatos em `_dados-brutos/redes_sociais/`, ignorados no git. Testado com listas sintéticas (somas fecham) e 6 testes do coletor.
**Justificativa**: pedido do autor: usar o fato de as luderias se seguirem umas às outras para achar casas fora do Google Maps e do Acervo de Jogos, sem a API do Instagram e com a LGPD em mente (só perfis de negócio publicados).

### 18:14
**Objeto**: `dados/[B2] Avaliacoes recentes/B2_cobertura_coleta.csv`, `B2_fila_coleta.txt` e `B2_avaliacoes_periodo.csv` (fora do git), regerados por `B2-b_avaliacoes.py --sem-mover`
**Antes**: 46 de 51 luderias "ok", 1.948 avaliações no recorte (1.213 com texto); fila com 5 lugares.
**Depois**: 49 de 51 "ok" (entraram Flow Games, Dungeon Games Store, Paladino Hobbies e a coleta completa do Shelf Bar, 650 lidas até "8 meses atrás"); 2.218 avaliações no recorte (1.440 com texto); fila só com Machado Games e Ilusões Industriais. As coletas de Bardo Mago, La Tabuleria, TabuClub, Toca do Rato e Tubaleria ficaram fora da base, por não estarem entre as aprovadas do B1.
**Justificativa**: novas coletas do autor em `_dados-brutos/coletas/`.

### 18:14
**Objeto**: banco "B - Comentários" do Notion
**Antes**: 1.310 linhas; opções de "Estabelecimento" com Machado Games e Ilusões Industriais e sem as 5 luderias novas.
**Depois**: 1.628 linhas (1.049 com "ID da avaliação", todos distintos). Entraram 334 avaliações com texto no recorte (idade ≤ 90 dias), lidas direto da coleta mais recente de cada casa: Shelf Bar 179, Bardo Mago 100, Tubaleria 24, TabuClub 11, Toca do Rato 7, La Tabuleria 6, Dungeon 4, Flow 3 (Paladino não tem avaliação com texto no recorte). Antes de inserir, 64 do Shelf e 13 do Flow foram reconhecidas como já existentes (por ID ou pelos 16 primeiros caracteres do texto) e não repetidas. Saíram para a lixeira as 16 linhas de Machado Games (13) e Ilusões Industriais (3), e as duas opções; entraram as opções Bardo Mago, La Tabuleria, TabuClub, Toca do Rato - Pizzaria e Jogos de Tabuleiro e Tubaleria.
**Justificativa**: pedido do autor: subir as novas coletas e excluir as duas casas que passaram pela triagem mas não são luderias (Machado Games é loja de videogame; Ilusões Industriais é loja e espaço de TCG sem acervo de jogos de tabuleiro).

### 18:14
**Objeto**: bancos "Status da coleta" e "A - Estabelecimentos" do Notion
**Antes**: "Status da coleta" com Machado Games e Ilusões Industriais; "A - Estabelecimentos" com Ilusões Industriais.
**Depois**: as três páginas na lixeira do Notion (recuperáveis).
**Justificativa**: mesmo pedido do autor.

### 18:14 — divergência
**Objeto**: lista de luderias aprovadas do B1 e bancos do Notion
**Antes**: `B1_aprovadas_metro_av100.xlsx` (e `B1_triagem_manual_metro_av100.xlsx`) mantém Machado Games e Ilusões Industriais como "aprovado" e não traz Bardo Mago, La Tabuleria, TabuClub, Toca do Rato e Tubaleria (os quatro primeiros estão na base de sorteio; Toca do Rato, nem nela).
**Depois**: no Notion, as duas primeiras foram excluídas e as cinco estão em "A - Estabelecimentos" e agora em "B - Comentários".
**Efeitos colaterais**: o build do B2 continua pedindo coleta de Machado e Ilusões e deixa as cinco novas fora de `B2_avaliacoes_periodo.csv`; contagens do B1 e do B2 divergem das do Notion até a triagem do B1 ser corrigida.

### 18:14 — divergência
**Objeto**: coletas do userscript `maps_avaliacoes` do Shelf Bar e do Bardo Mago
**Antes**: tentativas curtas marcadas "fim da lista": Shelf com 40 e 80 lidas (13/10 e 14/10); Bardo Mago com 130 lidas.
**Depois**: coletas refeitas pelo autor com rolagem manual: Shelf com 650 lidas e Bardo Mago com 220, ambas "passou do período". As avaliações das tentativas curtas estão todas contidas nas longas; no Bardo, o recorte de 90 dias não mudou (126 nas duas).
**Efeitos colaterais**: o motivo "fim da lista" não garante coleta completa; o build trata como "ok" uma coleta interrompida em silêncio. No Shelf, a contagem por rótulo cai em "2 meses atrás" (19) e "3 meses atrás" (14), entre "um mês atrás" (113) e "4 meses atrás" (110), sem inversão de ordem; pode ser sazonalidade ou falha de carregamento.

### 18:35
**Objeto**: `_src/[B1] Estabelecimentos e cardapios/Instagram/webscripts/instagram_coletor.user.js` (2026.10.14-2) e `instagram_coletor.test.cjs`
**Antes**: a captura da lista "seguindo" só reconhecia a semente pelo endereço `/<perfil>/following/`; no desktop a lista abre numa janela sobre o perfil, sem mudar o endereço, e nada era capturado.
**Depois**: a semente também é reconhecida pelo diálogo com título "Seguindo" (ou "Following") aberto sobre o perfil; o diálogo de seguidores, que tem "Seguindo" só nos botões das linhas, não conta. Dois testes novos (8 no total, todos passando).
**Justificativa**: erro relatado pelo autor na primeira coleta (perfil da Flow Games).

### 18:16
**Objeto**: `_src/Web scripts/maps_entorno.user.js` (versão 2026.10.14-1) e `_src/Web scripts/maps_entorno.test.cjs`
**Antes**: arquivos baixados como `maps_entorno_resumo_AAAA-MM-DD.csv` e `maps_entorno_resultados_AAAA-MM-DD.csv`, sempre com o mesmo nome e com a data em UTC (depois das 21h de Brasília, saía o dia seguinte); o fim de cada fila baixava tudo o que estava guardado, de modo que cada extração repetia as anteriores; buscas de metrô, BRT, VLT e shopping, com "Estação de trem" classificada como "outro"; classificação gravada na coleta e nunca refeita; lista lotada subdividida em quadrantes mesmo quando o Maps já completava a lista com lugares fora do mapa.
**Depois**: nome começa pela data local e traz o estabelecimento, como no coletor de avaliações (`2026-10-14_sao_jogue_rio_vermelho_entorno_resumo.csv`; com mais de um, `..._3_estabelecimentos_entorno_...`); o fim da fila baixa só os estabelecimentos daquela fila, e "Exportar CSVs" segue baixando tudo; nova busca "estação de trem" e novo grupo `trem` (colunas `qt_estacoes_trem_500m`, `qt_estacoes_trem_1000m`, `dist_estacoes_trem_mais_proxima_lida_m`), com categorias de trem, ferroviária e nomes CPTM, SuperVia e Trensurb; classificação refeita na exportação; estabelecimento coletado antes da busca de trem fica com o grupo em branco, coluna `consultas_nao_feitas` e situação "busca nova não feita" (entra em "Refazer pendentes"); lista lotada com item fora do mapa visível não subdivide nem marca censura. Testes: 14 de 14 passando.
**Justificativa**: pedido do autor ao revisar as três primeiras extrações: nomes de arquivo indistinguíveis e ausência dos trens metropolitanos, que em São Paulo, no Rio e em Porto Alegre funcionam como o metrô. O trem fica em coluna própria, sem somar ao metrô, para manter um grupo por resultado e deixar a soma "trilhos" para a análise.

## 2026/10/15

### 00:35
**Objeto**: `dados/[B1] Estabelecimentos e cardapios/entorno/B1_entorno_maps_fila.csv` (novo)
**Antes**: o coletor `maps_entorno.user.js` aceitava o `B1_entorno.csv` (separador `,`, 66 estabelecimentos, inclusive 3 já coletados em 14/10).
**Depois**: fila própria para o coletor, separador `;`, UTF-8 com BOM, colunas `place_id;nome;capital_endereco;lat;lng`, ordenada por capital e nome, sem os estabelecimentos já presentes nos resumos de 14/10.
**Justificativa**: pedido do autor de um CSV para extração em fila dos entornos.

### 00:38
**Objeto**: `dados/[B1] Estabelecimentos e cardapios/entorno/B1_entorno_maps_fila.csv` e `_src/[B1] …/Google Places (Negócios)/build/B1-b_entorno_maps_fila.py` (novo); `_dados-brutos/estabelecimentos/B1_localizacoes.jsonl` (+26 coordenadas)
**Antes**: a fila das 63 casas vinha do `B1_entorno.csv` (curadoria OSM antiga): incluía capitais regionais e reprovadas na triagem e omitia aprovadas.
**Depois**: a fila sai da triagem manual das metrópoles (51 aprovadas, menos Machado Games e Ilusões Industriais) mais as 5 "nova luderia" do acervo (Bardo Mago, La Tabuleria, Toca do Rato, TabuClub, Tubaleria): 54 no objeto, 51 na fila (Ludus, Bodogami e Shelf já têm resumo de 14/10). As 26 coordenadas que faltavam foram buscadas na Places API (Place Details, só `location`) e acrescentadas ao jsonl. Script reproduzível, com conferência de soma (54 = 51 + 3 + 0).
**Justificativa**: correção pedida pelo autor; a lista anterior estava desatualizada.

### 01:23
**Objeto**: merge de `origin/main` (PR #3, branch `claude/cool-einstein-qywu6n`) em `plano-de-negocios`: `maps_entorno.user.js` e `maps_entorno.test.cjs`, 4 CSVs `maps_entorno_*_2026-10-14*.csv`, `AGORA.md`, `docs/decisoes.md`, `docs/pendencias.md`, este registro
**Antes**: o GitHub tinha o coletor 2026.10.14-1 no caminho antigo `_src/Web scripts/` e os 4 CSVs soltos na raiz do repositório; o local tinha o coletor 2026.10.14-2 (não commitado) no caminho novo e os mesmos CSVs, idênticos byte a byte, sem versionar em `_dados-brutos/estabelecimentos/`.
**Depois**: fica a versão local do coletor (contém tudo da 14-1); CSVs só em `dados/[B1] Estabelecimentos e cardapios/_dados-brutos/estabelecimentos/`; decisões e registro do PR #3 mantidos, com o caminho novo do coletor; `AGORA.md` e a pendência do entorno apontam para os caminhos atuais. A branch `claude/gallant-cannon-bmcew0` (fila de 51, mesma do commit 714fee6) não entrou.
**Justificativa**: pedido do autor de resolver a divergência entre o repositório local e o do GitHub.

### 01:46
**Objeto**: `_src/[B1] Estabelecimentos e cardapios/Instagram/webscripts/instagram_coletor.user.js` (versão 2026.10.15-1) e `instagram_coletor.test.cjs`
**Antes**: a resposta da lista "seguindo" ia para a semente da janela aberta no momento em que chegava (resposta atrasada após fechar a janela se perdia); a rolagem só parava após 8 voltas sem conta nova e o CSV era baixado à mão, perfil por perfil; cada semente exigia abrir o perfil, clicar em "seguindo", rolar e baixar.
**Depois**: o coletor guarda o id numérico de cada perfil e atribui a resposta pela URL do pedido (`/friendships/<id>/following/`), com a janela aberta como reserva; a rolagem para 2 voltas depois de alcançar o total declarado e, com "Download automático", baixa o CSV; novo "Coletar fila de seguindo" (lista de sementes): abre o perfil, clica em "seguindo", rola, baixa, pausa 45-90 s e segue; o estado fica no localStorage, a fila continua sozinha após cada recarga e, parada, retoma da mesma lista; perfis sem link "seguindo" ou cuja janela não abre são pulados com o motivo; lista já rolada até o fim e baixada não é pedida de novo. Testes: 12 de 12 passando.
**Justificativa**: revisão das 11 primeiras listas (dados íntegros, sem bug) e pedido do autor de implementar as melhorias que reduzem o trabalho manual.

### 01:46
**Objeto**: `_src/[B1] Estabelecimentos e cardapios/Instagram/build/B1-b_instagram_seguindo.py` e `outros/snowball_comum.py`; saídas novas `redes_sociais/snowball/B1_snowball_proximas_sementes.csv` e `.txt` e `_dados-brutos/redes_sociais/snowball/B1_snowball_candidatos_grau3.csv` (fora do git); `B1_snowball_sementes.csv` com a coluna `semente_aprovada`
**Antes**: só a lista de candidatos com grau 2+ (590 contas) para classificar; nenhuma indicação de que semente coletar a seguir nem de semente fora das casas aprovadas.
**Depois**: recorte para leitura com as 237 contas seguidas por 3+ sementes (novas primeiro, com link e sementes que seguem); a classe preenchida nele volta para a lista de candidatos e vale sobre ela; lista das 41 casas aprovadas ainda sem lista coletada, em rodízio entre capitais (menos sementes primeiro; dentro da capital, a mais seguida), com o `.txt` pronto para a fila do coletor (conferência 10 + 41 = 51, diferença 0); aviso de semente fora das aprovadas (@arainhadosdados, A Rainha dos Dados, Vila Velha).
**Justificativa**: pedido do autor de separar as seguidas por 3+ perfis para análise e de priorizar as próximas sementes.

### 01:46 (divergência)
**Objeto**: sementes do snowball
**Antes**: `B1-a_instagram_snowball.py` supõe que as sementes são as casas aprovadas no B1.
**Depois**: @arainhadosdados (A Rainha dos Dados) foi coletada como semente sem estar em `B1_instagram_aprovadas.csv`; entra no grau de entrada de 74 contas.
**Efeitos colaterais**: infla levemente a precisão e a sensibilidade por corte; decidir se a semente sai do build ou se a casa entra nas aprovadas.


### 01:52
**Objeto**: `_src/[B1] Estabelecimentos e cardapios/Google Places (Negócios)/webscripts/maps_entorno.user.js` (2026.10.14-2 → 2026.10.15-1) e `maps_entorno.test.cjs`
**Antes**: na fila das 51 casas de 15/10, a estação mais próxima em Curitiba saía a 653–669 km (BRT do Rio e de Salvador que o Maps põe na lista quando a área se esgota) e o metrô dispensado de Curitiba ganhava distância; as 109 estações-tubo de Curitiba caíam em "outro" (qt_estacoes_vlt_brt zero em todas as 6 casas); "Futura estação Rua do Grito (BRT ABC)" contava como BRT a 526 m da Arena BG; a sede do Metrô-DF ("Companhia ferroviária") contava como estação de trem a 767 m da Asgard; "Trensurb Estação Rodoviária" ia para metrô; 16 cartões tinham a nota no lugar da categoria; a Overpass falhou em 22 das 51 casas e o porte do shopping saiu em branco com situação "ok".
**Depois**: resultado a mais de 50 km fica no CSV de resultados com `fora_da_regiao = sim` e sai das distâncias do resumo (695 resultados); estação-tubo → vlt_brt; futura estação, em obras ou desativada → outro; companhia ou empresa ferroviária não é trem; nome Trensurb, CPTM ou SuperVia vale sobre a categoria; categoria do cartão ignora nota e preço; Overpass com dois espelhos e pausa; fim da fila repete as consultas ao OSM antes do CSV; porte em branco aparece como "porte sem OSM" na situação. Reprocessando os resultados de 15/10: Curitiba passa a 170–1.998 m da estação mais próxima, com 1 a 3 estações-tubo a 1.000 m em 4 casas; Arena BG e Asgard perdem a estação inexistente.
**Justificativa**: conferência dos resultados da fila de 15/10 pedida pelo autor. A classificação é refeita na exportação, então "Exportar CSVs" com a versão nova corrige o que já está guardado sem recoletar.

### 02:32
**Objeto**: `bibliografia/bibliografia-v2/` (novo: `bibliografia-v2.md`, `procurar-manualmente.md`, `pdfs/` e `amostras-sumarios/`, os dois últimos fora do git) e `.gitignore`
**Antes**: os conceitos dos checklists P1 e P2 dependiam de cerca de 40 artigos internacionais, quase todos sem leitura e vários sem acesso aberto.
**Depois**: tabela de substituição conceito a conceito por livros-texto consagrados ou artigos e dissertações de universidades brasileiras (USP, UFRJ, PUC-Rio, FGV, Mackenzie, UFABC), com aderência e local do conceito; 10 PDFs baixados com a página conferida no texto (ex.: Sampaio e Lycarião p. 89–92; Frezatti et al. p. 6 e 12; Picolo e Tontini p. 42–45 e 50–51); capítulo provável dos livros (sumário conferido para Fitzsimmons, Hillier e Lieberman e Colosimo e Giolo; os demais inferidos); lista priorizada de 22 obras para buscar à mão. R10, R28 e R29 ficam sem substituto. Os checklists e a lista de leitura não mudaram.
**Justificativa**: pedido do autor de uma segunda versão da bibliografia com fontes nacionais ou livros-texto e de baixar o que estiver disponível.

### 03:35
**Objeto**: `_src/[B1] Estabelecimentos e cardapios/Instagram/webscripts/instagram_coletor.user.js` (versão 2026.10.15-2)
**Antes**: "Rolar até o fim ao abrir um perfil" guardado ligado no navegador; "Dados do perfil" sempre visível; bloco "Snowball" fechado ao abrir o painel.
**Depois**: rolagem ao abrir um perfil desligada (preferência em chave nova, `igc-rolar-ao-abrir-v2`, que começa desligada; a caixa continua no painel) e nunca disparada com a fila de sementes ativa; "Dados do perfil" vira bloco recolhível, fechado ao abrir; "Snowball" abre expandido.
**Justificativa**: pedido do autor; a rolagem automática atrasava a fila de sementes, que abre um perfil por vez.

### 07:19
**Objeto**: `textos/capitulos/2_referencial_teorico.md` (novo)
**Antes**: cap. 2 não iniciado (prazo do rascunho em 25/09).
**Depois**: rascunho com as seções 2.1 a 2.6 de `_instrucoes/2_ref-teorico.md`, cerca de 2.700 palavras e um quadro (cerca de 8,3 páginas, teto 10), com referências da bibliografia v2. Páginas conferidas nos PDFs: Figueiredo (2020, p. 31–32), Tontini e Theiss (2005, p. 35–36), Picolo e Tontini (2008, p. 42–45, 50–51 e 56), Sarpa (2016, p. 39–46), Figueiredo e Mantovani (2022, p. 4, 5 e 12), Vasconcellos (2016, p. 45–47), Frezatti et al. (2012, p. 12 e 18). Livros da v2 citados com `[AV]` (edição, ano e página a conferir); obras originais mantidas com `[AV-<ID>]` (Assaf Neto, KAM Insight, Asakura et al.). Fora da v2, vindas da lista de leitura: Kim e Mauborgne, Marcellino, Oldenburg, Woods e Gilovich et al. Canvas não entrou (não é usado no cap. 6).
**Justificativa**: pedido do autor de escrever o referencial teórico com as instruções, o teto de páginas e a bibliografia v2.

### 07:19 (divergência)
**Objeto**: `bibliografia/bibliografia-v2/pdfs/SEBRAE - Sobrevivencia das empresas no Brasil (2016).pdf`
**Antes**: `bibliografia-v2.md` e o registro de 02:32 contam o arquivo entre os PDFs baixados.
**Depois**: o arquivo é uma página HTML, não um PDF (o `pdftotext` não o lê); `procurar-manualmente.md` já dizia que o site bloqueou o download.
**Efeitos colaterais**: SEBRAE (2016) não entrou no cap. 2; baixar o PDF pelo navegador.

### 07:19 (divergência)
**Objeto**: título da dissertação de Sarpa (2016)
**Antes**: capa e folha de rosto: *Experiências de consumo com jogos de tabuleiro modernos* (usado na v2 e no cap. 2).
**Depois**: o resumo (p. 6) traz *Boardgames: um estudo sobre a experiência de consumo*.
**Efeitos colaterais**: conferir o título no repositório da UFRJ antes da versão final.

### 09:27
**Objeto**: Notion, banco "Luderias – Status da coleta"
**Antes**: 49 linhas (aprovadas do B1); "Acervo de jogos", "Google maps (...)", "O que ainda falta?" e "Como proceder..." vazias; status de cardápio, entorno e Instagram preenchidos antes dos exports de 15/10 (ex.: entorno "Não coletado" em 44 casas; Fan Hour com cardápio "completa" sem preços).
**Depois**: 54 linhas, com as 5 casas vindas do acervodejogos (Bardo Mago, La Tabuleria, TabuClub, Toca do Rato, Tubaleria). Status recalculados a partir dos arquivos do B1: cardápio 26 completa / 18 parcial / 10 não coletado; acervo 16 / 13 / 25; entorno 26 / 28 / 0 (export do Maps de 15/10, 6 campos; parcial = sem porte de shopping, distância a estação de outra cidade ou só no export de 14/10); Instagram 36 / 9 / 9; Google Maps "parcial" em todas (endereço, nota e volume coletados; horários não). As duas colunas de texto trazem, por casa, a lacuna e o script ou passo para fechá-la. Critério do Instagram: grade com até 7 posts a menos que o declarado conta como primeiro post coletado.
**Justificativa**: pedido do autor de atualizar o banco com as casas novas, os status e as lacunas de coleta com recomendação.

### 09:27 (divergência)
**Objeto**: `dados/[B1] Estabelecimentos e cardapios/estabelecimentos/3_triagem/B1_aprovadas_metro_av100.xlsx`, coluna `avaliacao_media`
**Antes**: nota média numérica (curadoria do B1).
**Depois**: células gravadas como data (4,6 → 2026-06-04).
**Efeitos colaterais**: qualquer leitura da nota a partir desse xlsx sai errada; usar a curadoria em CSV até corrigir.

### 09:56
**Objeto**: `_src/[B1] Estabelecimentos e cardapios/Google Places (Negócios)/build/B1-b_triagem_manual.py` e `estabelecimentos/3_triagem/B1_aprovadas_metro_av100.xlsx`
**Antes**: `avaliacao_media` copiada da planilha anotada à mão, onde o Excel gravou notas decimais como data (4,6 → 04/06/2026).
**Depois**: nota lida da curadoria em CSV (`B1_curadoria_metro_f_av100.csv`) pelo place_id, com recurso de desfazer a data (dia + mês/10) para quem não tiver par; 163 de 163 vieram do CSV. Nota das 51 aprovadas entre 4,2 e 5,0; demais colunas iguais às da versão anterior.
**Justificativa**: pedido do autor de corrigir a nota gravada como data.

### 09:56
**Objeto**: `B1-c_details.py` (modo `--horarios`), `outros/places_client.py`, `build/B1-b_horarios.py` (novo), `estabelecimentos/B1_horarios.csv` (novo)
**Antes**: nenhum horário de funcionamento coletado.
**Depois**: `regularOpeningHours` coletado pela Places API para as 56 casas (51 aprovadas e 5 novas; 56 chamadas no SKU Place Details Enterprise, o mesmo de nota e volume, conferido na documentação do Google em 15/10). Tabela com as 54 casas do estudo: turnos por dia, dias abertos, horas por semana, abertura mais cedo e fechamento mais tarde; 54 com horário, soma = total.
**Justificativa**: pedido do autor de fechar a lacuna de horários do Google Maps.

### 09:56
**Objeto**: `Cardápios/build/B1-b_cardapios_transcricoes.py` (novo), `_dados-brutos/cardapios/transcricao/` (16 CSVs novos), `B1-b_cardapios_planilha.py`, `cardapios/B1_cardapios_itens_precos.xlsx`
**Antes**: planilha com 11 casas (939 linhas); prints de 9 casas, cardápios digitais de 3, Cartola e OCR de 3 casas fora dela.
**Depois**: 27 casas e 1.887 linhas (1.825 com preço). Prints, digitais e Cartola convertidos por regra de categoria (802 linhas; item repetido em fotos de datas diferentes fica na mais recente; jogos à venda e avisos fora; couvert lúdico dos prints de práticas incluído). Alçapão, Café Geek e Fortalúdica transcritos à mão das imagens/PDF (o OCR não servia). TabuClub entra nas fontes como "não extraído". Conferências de soma do resumo passaram.
**Justificativa**: pedido do autor de incluir na planilha consolidada os cardápios extraídos fora dela.

### 09:56
**Objeto**: Notion, banco "Luderias – Status da coleta"
**Antes**: Google Maps "Coleta parcial" nas 54 casas; 16 linhas com "Cardápio: ... fora do B1_cardapios_itens_precos.xlsx".
**Depois**: Google Maps "Coleta completa" nas 54; linhas de horários e de cardápio fora do xlsx retiradas de "O que ainda falta?" e "Como proceder..."; Ludoteca Sidequest, Arena BG, Castelos e Comdado sem lacuna ("Nada: todas as fontes completas"); Cartola ganhou a lacuna das seções não exportadas da Takeat.
**Justificativa**: refletir a coleta de horários e a consolidação dos cardápios.

### 10:08
**Objeto**: `_src/[B1] Estabelecimentos e cardapios/Instagram/webscripts/instagram_snowball.user.js` (novo, versão 2026.10.15-1), `instagram_coletor.user.js` (versão 2026.10.15-3) e testes (`instagram_snowball.test.cjs`, `instagram_coletor.test.cjs`)
**Antes**: snowball dentro do coletor do Instagram. A fila de "seguindo" pulava as sementes sem abrir a lista (o link era procurado só pelo `href` exato `/<perfil>/following/`); "Parar" só valia na memória da página, e a fila, salva como ativa, voltava a rodar a cada recarga; o campo da fila era reescrito com a fila salva a cada carga, e não havia como apagá-la.
**Depois**: snowball num userscript próprio, com painel à esquerda do coletor e armazenamento próprio (IndexedDB `igs-snowball`), que na primeira carga copia as listas, os ids e a fila do coletor (a fila entra parada). A lista é aberta pelo link (relativo, absoluto ou com parâmetros), pelo contador "seguindo" do cabeçalho ou, uma vez por semente, pelo endereço `/<perfil>/following/`; sem lista na tela, a página rola. "Parar" grava a fila como parada na hora, inclusive durante a troca de perfil; "Limpar fila" apaga a fila salva; o campo só recebe a fila salva quando está vazio. CSV com o mesmo nome e as mesmas colunas. O coletor perdeu o bloco do snowball e só lê a fila do outro script para não rolar sozinho durante ela. 21 testes passam.
**Justificativa**: pedido do autor de corrigir a fila de "seguindo" (não abria a lista, não parava, não deixava apagar a fila) e de separar o snowball do coletor.

### 10:23
**Objeto**: `textos/capitulos/3_metodologia_plano_luderia.md` (novo)
**Antes**: capítulo 3 não iniciado.
**Depois**: rascunho completo (cerca de 2.470 palavras de prosa e 6 quadros, perto de 10 páginas): 3.1 caracterização e vocabulário controlado; 3.2 escala N1-N6 e hierarquia de dados; 3.3 quadro único dos blocos B1 a B4 (B4 detalhado no apêndice H), com B1/B2 e B3 em prosa curta; 3.4 tratamento, validação da coleta e do dicionário; 3.5 técnicas e calibração; 3.6 matriz de evidências resumida (completa no apêndice A); 3.7 ética; 3.8 limitações. O registro prévio (extra) ficou fora, e as seções seguintes subiram um número. Pontos a conferir marcados entre colchetes no texto; todas as referências com `[AV]`.
**Justificativa**: passo 3 do AGORA.md; capítulo com prazo vencido em 02/10.

### 10:23 — divergência
**Objeto**: `_instrucoes/4_metodologia.md` ("Escopo adotado" e Bloco B1) e triagem do B1
**Antes**: população final esperada de 100 a 150 estabelecimentos após a curadoria.
**Depois**: `B1_triagem_manual_metro_av100.xlsx` tem 51 aprovadas (49 depois de tirar Machado e Ilusões) e, com as 5 novas, 54 concorrentes; 8 inconclusivos e 4 pendentes.
**Efeitos colaterais**: o texto do cap. 3 usa 54; a estimativa de 100 a 150 nas instruções fica sem uso.

### 10:23 — divergência
**Objeto**: `B1_curadoria_metro_f_av100.csv` e `B1_triagem_manual_metro_av100.xlsx`
**Antes**: 164 candidatos no recorte.
**Depois**: 163 linhas na triagem; falta a Livraria Leitura Amazonas (Manaus, 5.271 avaliações).
**Efeitos colaterais**: a triagem não fecha com o total do recorte (diferença 1) até a exclusão ser registrada com o motivo.

### 10:23 — divergência
**Objeto**: `_instrucoes/1_estrutura.md` (P5, itens 5 e 6) e skill `meu-estilo-escrita`
**Antes**: P5 pede travessão (—) para aposto e voz passiva sintética ("adotou-se").
**Depois**: a skill pede hífen com espaços ("-"), nunca travessão, e prefere a passiva analítica ("foi adotado"); o cap. 1 segue a skill.
**Efeitos colaterais**: o rascunho do cap. 3 segue o cap. 1 e a skill (hífen; voz ativa, passiva analítica quando preciso); se valer a P5, os dois capítulos mudam juntos.

### 10:34
**Objeto**: `_src/[B1] Estabelecimentos e cardapios/Google Places (Negócios)/webscripts/maps_entorno.user.js` (versão 2026.10.15-2) e `maps_entorno.test.cjs`
**Antes**: painel com uma fila só do Google Maps; "Buscar áreas OSM que faltam" consultava a Overpass só para os estabelecimentos guardados com shopping do Maps a até 1000 m e sem resposta do OSM (não para os 55, nem para um só), e só trazia `shop=mall`; porte de shopping por um critério de cada vez (OSM, Abrasce ou avaliações); "Coletar fila" e "Exportar" sem dizer quantos estabelecimentos iam buscar ou exportar.
**Depois**: painel em quatro passos sobre uma lista guardada (a população): 1. lista; 2. Google Maps ("Coletar no Maps os N que faltam", "Refazer N pendentes"); 3. OpenStreetMap ("Coletar no OSM os N que faltam", "Refazer OSM de todos"), uma consulta à Overpass por estabelecimento com estações de metrô, trem, VLT, BRT e tubo (até 2 km), shoppings com área, parques e praias (até 1.200 m); 4. "Exportar 5 CSVs": resumo e resultados do Maps, resumo e resultados do OSM e tabela de shoppings com área no OSM e avaliações no Maps na mesma linha (casamento espacial; dois cadastros no mesmo polígono contam uma vez). Critério de porte com "ambos" e "qualquer" além de OSM, avaliações e Abrasce; colunas `qt_shoppings_porte_osm_*` e `_aval_*` sempre presentes. Estabelecimento da lista sem coleta sai com linha e situação "não coletado". Espelho da Mail.ru na lista da Overpass (a principal respondia 406/429 em 15/10). A fila do Maps não consulta mais a Overpass. 24 testes passam.
**Justificativa**: pedido do autor de deixar claro o que cada botão faz, refazer o entorno no OSM com a população atual (ex.: Bardo Mago) e com VLT, BRT e trem, e ter área e avaliações dos shoppings juntas para filtrar o ruído.

### 10:34
**Objeto**: `build/B1-b_entorno_maps_fila.py`, `entorno/B1_entorno_maps_fila.csv`
**Antes**: a fila tirava quem já tinha `maps_entorno_resumo_*.csv` em `_dados-brutos/estabelecimentos/` (51 de 54).
**Depois**: a lista traz o objeto inteiro (54 casas; soma = total); o coletor pula, em cada fonte, quem já está guardado.
**Justificativa**: a mesma lista serve às duas coletas; o controle do que falta passou para o painel.

### 10:34
**Objeto**: `collect/B1-c_entorno_osm.py`, `collect/B1-c_entorno.py`, `build/B1-b_entorno.py`
**Antes**: liam e gravavam `B1_entorno_osm_ancoras.jsonl` e `B1_entorno.jsonl` em `_dados-brutos/estabelecimentos/`.
**Depois**: caminhos em `_dados-brutos/entornos/`, para onde o autor moveu os arquivos de entorno; `B1-c_entorno_osm.py` marcado como substituído pela coleta OSM do painel.
**Justificativa**: os scripts quebravam depois da mudança de pasta.

### 10:39
**Objeto**: `dados/[B1] Estabelecimentos e cardapios/redes_sociais/` (8 coletas novas de posts do Instagram)
**Antes**: arquivos soltos na raiz da pasta, no nome do export do coletor (`instagram_posts_<perfil>_2026-10-15.csv`).
**Depois**: movidos para `rs_<cidade>/rs_<perfil>/2026-10-15_<perfil>_instagram_posts.csv` (Bardo Mago e La Tabuleria em BH; BoardZ em Curitiba; Encounter e Tubaleria em SP; Luderia Carioca e TabuClub no Rio; Toca do Rato em Porto Alegre). Conferência: sem shortcode repetido, data igual ao `taken_at`, curtidas e comentários preenchidos em todos os posts do período, `pagina_coleta` do próprio perfil (1 colaboração da Tubaleria lida na página da Arena BG). Ressalvas: só o CSV de posts, sem o de perfil (seguidores e nº de posts declarado); Bardo Mago (615 de 616) e Tubaleria (339 de 340) com 1 post não carregado, o que deixa a data do primeiro post incerta.
**Justificativa**: pedido do autor de conferir as coletas e lançá-las no Notion; nome e pasta seguem a convenção de `CLAUDE.md`.

### 10:39
**Objeto**: Notion, bancos "A - Estabelecimentos" e "Luderias – Status da coleta"
**Antes**: no "A", Bardo Mago, La Tabuleria, TabuClub, Toca do Rato e Tubaleria sem dados de Instagram; BoardZ, Encounter e Luderia Carioca sem curtidas. No status, as 8 casas com Instagram "Não coletado".
**Depois**: no "A", nº de posts, curtidas e comentários de 01/09 a 01/10/2026 (inclusive, contando colaborações compartilhadas, como nas linhas já preenchidas de Luderia Carioca, BoardZ e Encounter) e data do primeiro post das 8 casas; nº de posts total de Bardo Mago (616) e Tubaleria (340), declarado pelo Instagram na coleta. No status, Instagram "Coleta completa" para BoardZ, Encounter e Luderia Carioca (seguidores e total já estavam no "A") e "Coleta parcial" para as outras 5, com a lacuna e o modo de completar.
**Justificativa**: pedido do autor de lançar as coletas novas e atualizar o status.

### 10:39 (divergência)
**Objeto**: Notion "A - Estabelecimentos" × status da coleta e arquivos `*_instagram_perfis.csv`
**Antes**: o status de Instagram (15/10, 09:27) foi calculado só pelos arquivos do repositório; os perfis do coletor contam no período só os posts de que o perfil é dono.
**Depois**: o "A" já tinha seguidores e totais de BoardZ, Encounter e Luderia Carioca (marcadas "Não coletado" no status); 30 casas do "A" estão sem curtidas do período; nº de posts e comentários do "A" ora contam colaborações compartilhadas (Cineplay, CCG, Omniverse, Dungeon, XPlace), ora não (Play Easy e as que batem com o CSV de perfis).
**Efeitos colaterais**: o status de Instagram das outras 46 casas pode estar errado nos dois sentidos; uma regra única de contagem precisa ser escolhida antes de usar esses números no cap. 6.

### 10:46
**Objeto**: Notion "A - Estabelecimentos" (Instagram, período 01/09 a 01/10/2026) e "Luderias – Status da coleta" (coluna Instagram)
**Antes**: 30 casas sem curtidas do período; nº de posts e comentários ora com, ora sem colaborações compartilhadas; Covil com o Linktree no campo Instagram; status de Instagram calculado pelos arquivos do repositório.
**Depois**: nº de posts, curtidas e comentários das 54 casas recalculados pelos CSVs de posts com a regra do painel do coletor: posts próprios e colaborações que aparecem na grade do perfil, um por shortcode, de 01/09 a 01/10 inclusive (posts sem coluna `vinculo`, do export antigo da Ludus, ficam de fora porque o arquivo novo cobre o período). 29 casas mudaram: 26 só ganharam curtidas; Comdado (3/11 → 2/4 posts/comentários), Ludus (158 → 92 comentários), Paladins (3/1 → 1/3, colunas trocadas) e Play Easy (15/38 → 16/42) mudaram também posts ou comentários. Instagram da Covil corrigido para @covilgb. Status refeito pelos sete campos do "A": 45 completas, 8 parciais (Bardo Mago, Tubaleria, La Tabuleria, TabuClub e Toca do Rato sem seguidores; Bravo sem data do primeiro post; Ludus sem total; LudoCafé com perfil a confirmar) e Dominaria "Não coletado" (perfil da unidade errada).
**Justificativa**: pedido do autor de uniformizar a regra de contagem com colaborações compartilhadas, preencher as curtidas e refazer o status pelo banco "A".

### 10:53
**Objeto**: `_src/[B1] Estabelecimentos e cardapios/Google Places (Negócios)/build/B1-b_resumo.py` (novo), `estabelecimentos/B1_resumo_estabelecimentos.xlsx` (novo) e `redes_sociais/B1_instagram_resumo_notion.csv` (novo)
**Antes**: dados do B1 espalhados por triagem, horários, entorno, Instagram (Notion), cardápios, acervos e B2.
**Depois**: planilha-resumo com uma linha por casa (54): Google Maps, horários, entorno (export mais recente do coletor; distância a estação de outra cidade vazia), Instagram (retrato do Notion "A" de 15/10, salvo em CSV), cesta por pessoa (couvert + bebida + entrada ou prato, P25/mediana/P75, em fórmulas; 26 casas com preços), acervo (17 casas com lista) e avaliações do B2 (49 casas, 2.218 no recorte). Abas: estabelecimentos, cesta, por_capital (fórmulas; total 54, conferência 0) e dicionario. 353 fórmulas, nenhum erro no recálculo.
**Justificativa**: pedido do autor de uma planilha que resuma os dados do B1 coletados até agora.

### 10:58
**Objeto**: `docs/pendencias.md`, seção nova "Tarefas a fazer (pedidas pelo autor em 15/10/2026)"
**Antes**: sem as tarefas abaixo.
**Depois**: refazer a coleta do Instagram de 9 perfis (lacunas de seguidores, total, primeiro post e perfil errado) com o coletor aprimorado; completar o banco de entornos com OSM e o novo critério de shopping e testá-lo; scripts de amostragem de auditoria por conjunto de dados; roteiro .md da auditoria do entorno (linha reta, como o coletor, ou trajeto); sumarização do B1 com parecer sobre o script de entornos; sumarização do B2.
**Justificativa**: pedido do autor.

### 11:14
**Objeto**: `_src/[B1] Estabelecimentos e cardapios/Google Places (Negócios)/analise/B1-a_estatistica_descritiva.py` (novo), `estabelecimentos/4_estatistica_descritiva/B1_estatistica_descritiva_geral.xlsx` e `…_por_grupo.xlsx` (novos)
**Antes**: o B1 só tinha a planilha-resumo com uma linha por casa (`B1_resumo_estabelecimentos.xlsx`), sem estatísticas do conjunto.
**Depois**: estatística descritiva de 35 variáveis e 10 proporções das 54 casas (n, média, mediana, desvio padrão amostral, mínimo, quartis, máximo, amplitude e coeficiente de variação), em fórmulas sobre a aba dados. Arquivo geral com abas geral, frequencias (casas por região e por metrópole: total 54, conferência 0), dados e dicionario; arquivo por grupo com painel e detalhe por metrópole (13) e por região do Brasil (5, IBGE pela UF da capital). Regras: Instagram de LudoCafé e Dominaria vazio (perfil coletado não é o da casa); couvert só nas casas que cobram; shoppings de porte só onde o porte foi buscado. 447 e 4.722 fórmulas, nenhum erro no recálculo; valores conferidos contra o pandas sem divergência.
**Justificativa**: pedido do autor de uma sumarização com médias, medianas, amplitudes e desvios do conjunto, e de outra por metrópole e por região.

### 11:14 (site)
**Objeto**: `_src/site-apresentacao/` (abas 08 a 10, `src/sections/S8Panorama.jsx`, `S9Metropoles.jsx`, `S10Regioes.jsx`, `src/components/graficos.jsx`, `src/formato.js`, `src/conteudo/b1-estatisticas.json`, `b1-achados.js`, `s8-b1-resultados.json`, `site.json`, `App.jsx`)
**Antes**: sete abas, sem resultados de dados.
**Depois**: três abas novas com a estatística descritiva do B1: panorama geral (indicadores, achados, dias e horários de funcionamento, cesta casa a casa, nota × volume, seguidores × interações e tabela por variável), por metrópole e por região (achados, gráficos e painel). Os números vêm do JSON gerado pelo script acima, e os achados são frases montadas sobre esses números. Build e lint sem erro; conferido no navegador em desktop e celular. Não publicado no GitHub Pages.
**Justificativa**: pedido do autor de páginas com as sumarizações e os gráficos dos achados mais pertinentes.

### 11:16
**Objeto**: site de apresentação no GitHub Pages (https://eusouopeu.github.io/luderia-tcc/, branch `gh-pages`)
**Antes**: site publicado com as sete abas de 01/09/2026.
**Depois**: publicadas as abas 08 a 10 (estatística descritiva do B1: panorama, por metrópole e por região) com `pnpm run deploy`; conferido no endereço público, sem erro no console.
**Justificativa**: pedido do autor.

### 11:16
**Objeto**: `dados/[B1] Estabelecimentos e cardapios/_dados-brutos/estabelecimentos/maps_entorno_resultados_2026-10-14.csv` e `maps_entorno_resumo_2026-10-14.csv`; cópias `(1)` removidas; `docs/pendencias.md`
**Antes**: dois pares de CSVs do entorno de 14/10 (sem sufixo e com `(1)`). Os sem sufixo tinham Ludus e Shelf (499 linhas em resultados, 2 em resumo); os `(1)`, exportação cumulativa do coletor, tinham os mesmos e mais Bodogami (787 e 3 linhas). Todas as linhas dos sem sufixo estão nos `(1)` (conferido linha a linha, diferença zero). O `B1-b_entorno_maps_fila.py` lê `maps_entorno_resumo_*.csv` e via os dois resumos.
**Depois**: um arquivo por tipo, com o conteúdo do `(1)` sob o nome sem sufixo; nenhuma linha perdida. A raiz do repositório já estava limpa desde o PR #4.
**Justificativa**: pedido do autor de organizar os CSVs do entorno e resolver as duplicatas.

### 11:26
**Objeto**: `_src/site-apresentacao/src/conteudo/` (`s1-estrutura.json` a `s7-contribuicoes.json`, `site.json`) e grades de `S3Metodologia.jsx`, `S5Modelo.jsx` e `S6Tecnicas.jsx`
**Antes**: abas 01 a 07 com o desenho anterior: luderia para o público casual, blocos A (jogos da Ludopedia), B (estabelecimentos nas 27 capitais) e C (5 avaliações por casa), hipóteses H1-H9 e seis objetivos.
**Depois**: conteúdo do desenho atual: plano de negócios baseado em evidências para Salvador; questão de pesquisa, objetivo geral e sete objetivos da introdução; conceitos do rascunho do cap. 2 em quatro grupos; blocos B1 a B4 com recorte, tamanho e procedimento da metodologia; Quadro 03 de itens (A01-E08); modelo de análise por objetivo (Quadros 04 e 05), com H1, H3 e H5 como extras; técnicas por área do plano e situação da coleta em 15/10; contribuições, limitações da §3.9 e próximos passos do cronograma. Abas 04 e 05 renomeadas para "Quadro de itens" e "Modelo de análise", como no projeto. Build e lint sem erro; conferido no navegador.
**Justificativa**: pedido do autor de atualizar as abas 01 a 07 com as informações vigentes de `textos/planejamento`, `docs` e `_instrucoes`.

### 11:29
**Objeto**: site de apresentação no GitHub Pages (https://eusouopeu.github.io/luderia-tcc/, branch `gh-pages`)
**Antes**: abas 01 a 07 publicadas com o desenho anterior (público casual, blocos A a C).
**Depois**: publicadas as abas 01 a 07 atualizadas (commit 475bb95) com `pnpm run deploy`; conferido no endereço público, sem erro no console.
**Justificativa**: pedido do autor.

### 11:45
**Objeto**: `_src/site-apresentacao/src/sections/S8Panorama.jsx` e `src/components/graficos.jsx` (componente `Pilulas`)
**Antes**: cartões do panorama só com medianas; tabelas por variável sempre com as 11 colunas.
**Depois**: seletor em pílulas nos cartões (média, padrão, ou mediana) e em cada grupo da tabela (simplificado, padrão, com n, média, mediana, DP e CV; ou completo, com mínimo, quartis, máximo e amplitude). Conferido no navegador, sem erro no console.
**Justificativa**: pedido do autor.

### 11:45 (divergência)
**Objeto**: `_dados-brutos/entornos/2026-10-15_54_estabelecimentos_entorno_osm_*.csv` e `…_entorno_shoppings.csv` (coletor `maps_entorno.user.js`, versão 2026.10.15-2)
**Antes**: coleta do Maps (51 + 3 casas) com metrô e shoppings lidos no próprio Maps.
**Depois**: a coleta do OSM das 54 casas tem os 479 elementos como nós (`node/`), nenhum `way` ou `relation`; nenhum shopping tem área, então `qt_shoppings_area_min_*` dá 0 em todas as casas e o porte dá "não" nos 182 shoppings. Estações mapeadas como área ficam de fora: Eucaliptos, Moema, Campo Belo, Higienópolis-Mackenzie e Paulista aparecem no Maps a 555-820 m e não aparecem no OSM, e 9 casas de São Paulo divergem no nº de estações a 1.000 m. Na planilha de shoppings, um mesmo nó do OSM foi ligado a três shoppings do Maps (RED jogos) e a três (Ludus). Causa provável: a consulta termina em `out tags center bb`, e o filtro da linha 546 descarta elementos sem `center` (ways e relations voltam só com `bounds`). Contagens e distâncias do resumo batem com o arquivo de resultados, e as coordenadas batem com as do Maps.
**Efeitos colaterais**: os dados do OSM não entram no site nem no resumo do B1 até a correção do coletor e uma nova coleta no OSM; o site segue com o entorno do Maps.

### 11:51
**Objeto**: `_src/[B1] Estabelecimentos e cardapios/Google Places (Negócios)/webscripts/maps_entorno.user.js` (2026.10.15-2 → 2026.10.15-3) e `maps_entorno.test.cjs`
**Antes**: a consulta à Overpass terminava em `out tags center bb`, que devolve ways e relations só com `bounds`, sem `center` (conferido na overpass-api.de em 15/10); o filtro exigia `center` e descartava todo polígono. Um nó `shop=mall` podia casar com vários shoppings do Maps a até 200 m, e os seguintes viravam "mesmo polígono" e saíam da contagem.
**Depois**: consulta em `out tags bb`; o ponto de way e relation é o centro da caixa (`centroOsm`), e os polígonos voltam com área. Nó sem polígono casa com um único shopping do Maps: primeiro o de nome igual (reservado antes), depois o mais próximo ainda livre; "mesmo polígono" só vale para polígono. Dois testes novos; 26 testes passando.
**Justificativa**: pedido do autor de corrigir o coletor do OSM antes de coletar de novo.

### 11:58
**Objeto**: análise de conteúdo do B2 - `_src/[B2] Avaliacoes recentes/Google Places (Comentários)/analise/B2-a_conteudo_bardin.py`, `dados/[B2] Avaliacoes recentes/analise_conteudo/` (`B2_codificacao_bardin.csv`, `B2_bardin_*.csv`, novos `B2_bardin_arquivos_coleta.csv` e `B2_bardin_nota_por_categoria.csv`), `textos/instrumentos/analise_conteudo_bardin_B2.md` e `.gitignore`
**Antes**: codificação de 10/10 sobre a base do Notion "B - Comentários (manual)": 589 comentários (575 analisados, 48 estabelecimentos), janelas diferentes entre lotes (planilha até "1 mês", formulário até "3 meses"), ids do Notion, siglas com Machado Games e Ilusões Industriais e sem as 5 casas novas; achados do §3 sobre 390 comentários de casas de jogos.
**Depois**: o script monta o corpus direto das coletas (`--corpus`): um arquivo por estabelecimento, o mais completo (mais comentários com texto no recorte; 10 arquivos repetidos descartados), só avaliações até "3 meses atrás". Corpus de 1.593 comentários de 53 casas (texto em `_dados-brutos/analise_conteudo/`, fora do git), recodificados um a um pelo mesmo livro de códigos, com `id_avaliacao` (SHA-1 do `review_id`). 1.588 analisados (1.370 em 31 casas de jogos, 218 em 22 lojas); excluídos 1 fora do tema e 4 textos-modelo promocionais (regra 10 nova). Somas por tipo e corpus × arquivos fecham com diferença zero. Amostra de controle refeita: 131 comentários (alvo 128), semente 20261015. Instrumento reescrito (§0, §1, §2.1 e §3): preço passa a ser a maior fonte de crítica nas casas (16% das negativas), seguido de atendimento (15%), comida (15%), capacidade (11%) e tempo de serviço (11%, achado novo); São Jogue com só 4 comentários.
**Justificativa**: pedido do autor de refazer a análise de Bardin com as amostras atualizadas, usando só o arquivo de extração mais completo de cada estabelecimento e só os comentários até "3 meses atrás".

### 11:58 (divergência)
**Objeto**: contagem do B2 em `AGORA.md` e `B2_avaliacoes_periodo.csv` (build `B2-b_avaliacoes.py`, 14/10 17:50) × corpus da análise de conteúdo (15/10) × Notion "B - Comentários"
**Antes**: 2.218 avaliações no recorte e 1.440 com texto (build, sobre as 51 aprovadas do B1, juntando as coletas por `review_id` e mantendo a linha mais recente); Notion com 1.628 linhas.
**Depois**: 2.423 avaliações no recorte e 1.593 com texto nos arquivos mais completos das 54 casas do `B1_resumo_estabelecimentos.xlsx`.
**Efeitos colaterais**: os números do B2 citados fora da análise de conteúdo seguem a base do build até ela ser refeita com a triagem corrigida (próximo passo 1 do AGORA). A diferença vem do conjunto de casas (5 novas dentro, Machado e Ilusões fora) e da regra de escolha dos arquivos.

### 12:00
**Objeto**: `_src/site-apresentacao/src/sections/S8Panorama.jsx`, `src/conteudo/s8-b1-resultados.json`, `b1-estatisticas.json` e `B1-a_estatistica_descritiva.py` (campo `completa` nas cestas)
**Antes**: o gráfico "Cesta por pessoa, casa a casa" mostrava as 26 casas com cardápio, inclusive as 19 sem couvert no cardápio, cuja cesta soma couvert 0; os cartões do resumo tinham seis indicadores.
**Depois**: o gráfico mostra só as 7 casas com os três itens da cesta no cardápio (couvert, bebida, entrada ou prato), com a linha na mediana dessas casas; os cartões ganham itens no cardápio, posts de 01/09 a 01/10 e comentários nesses posts, por casa, em média ou mediana. As demais estatísticas da cesta seguem com as 26 casas. Planilhas recalculadas sem erro.
**Justificativa**: pedido do autor.

### 12:01
**Objeto**: regra de cesta completa do gráfico "Cesta por pessoa, casa a casa" (`B1-a_estatistica_descritiva.py`, `b1-estatisticas.json`, `S8Panorama.jsx`, `s8-b1-resultados.json`)
**Antes**: só as 7 casas com couvert no cardápio.
**Depois**: couvert não cobrado não conta como item faltando; saem só as casas sem bebida ou sem entrada ou prato. Nenhuma das 26 casas com cesta sai, porque a cesta só é calculada quando bebida e entrada ou prato existem. O gráfico volta a mostrar as 26 casas, com a linha na mediana delas (R$ 58,50).
**Justificativa**: pedido do autor.

### 12:03
**Objeto**: amostras de auditoria da coleta - `_src/extras/amostrar_auditoria.py` (novo), `B1-a_auditoria_estabelecimentos.py`, `B1-a_auditoria_entorno.py`, `B1-a_auditoria_instagram.py`, `B1-a_auditoria_cardapios.py`, `B1-a_auditoria_acervos.py`, `B2-a_auditoria_avaliacoes.py` e `_src/[B4] Bases publicas/Comum/analise/B4-a_auditoria_bases.py` (novos); saídas em `dados/[Bn]…/_dados-brutos/<pasta>/auditoria/`; `_src/dicionario.md`
**Antes**: nenhuma amostra de auditoria gerada; o método (`_instrucoes/4_metodologia.md` §3.4) descrevia o sorteio só no texto.
**Depois**: sete scripts geram as listas com as colunas de conferência em branco e registram semente, população, n, hash SHA-256 da origem e limite de Wilson com zero erros em `auditoria_registro.csv`. Tamanhos de 15/10: estabelecimentos 33 de 164; entorno 11 de 54 casas e 61 itens; Instagram 47 perfis e 200 de 60.809 posts; cardápios 200 de 1.825 itens; acervos 200 de 8.736 jogos; B2 200 de 1.440 avaliações com texto e completude das 49 casas (soma 2.218, diferença zero); B4 170 séries de 27 arquivos. Os arquivos ignorados pelo git (redes sociais, cardápios, acervos, coletas do B2, CAGED) ficam só na máquina. Dicionário: pasta `auditoria/` e `Comum/analise/`.
**Justificativa**: pedido do autor de criar e rodar scripts de amostragem de auditoria para cada conjunto de dados, com as amostras em `auditoria/` dentro de cada pasta dos brutos.

### 12:03
**Objeto**: `textos/instrumentos/roteiro_auditoria_entorno_B1.md` (novo)
**Antes**: sem roteiro de conferência do entorno.
**Depois**: passo a passo da auditoria no Google Maps: distância em linha reta, de pino a pino, com a ferramenta Medir distância (a do coletor); distância a pé opcional, à parte, para medir o quanto a linha reta subestima o trajeto; rota de carro descartada; completude pelas buscas do Maps, pela camada de transporte público e pelo mapa do OSM; tolerância de 50 m.
**Justificativa**: pedido do autor.

### 12:03
**Objeto**: `docs/parecer_entorno_B1.md` (novo)
**Antes**: sem avaliação do coletor de entorno.
**Depois**: parecer de integridade (somas fecham nas 54 casas; 695 de 3.828 resultados do arquivo de 51 casas a mais de 50 km), confiabilidade (concordância Maps × OSM por grupo) e validade (linha reta, contagem de estações, categoria de shopping), com 9 vulnerabilidades e a ordem de correção. Achado principal: as 6 casas de Curitiba têm zero estação de BRT no Maps, e o OSM acha de 2 a 7 estações-tubo a 1000 m de cada uma.
**Justificativa**: pedido do autor de opinar sobre integridade, confiabilidade e validade dos dados do script de entornos.

### 12:03 (divergência)
**Objeto**: porte de shopping em `B1_resumo_estabelecimentos.xlsx` (via `B1-b_resumo.py`) × `docs/pendencias.md` (item 7 das decisões a tomar)
**Antes**: o resumo traz `shopping_porte_*` com o critério "OSM shop=mall com área >= 5000 m²" para 29 casas (caixas do OSM consultadas pela fila do Maps) e vazio para 25.
**Depois**: a pendência diz que o critério de porte ainda não foi escolhido.
**Efeitos colaterais**: a estatística descritiva e o site mostram um porte de shopping com critério não decidido e incomparável entre casas.

### 12:05
**Objeto**: `_src/[B2] Avaliacoes recentes/Google Places (Comentários)/analise/B2-a_conteudo_site.py` (novo); aba 11 do site (`src/sections/S11Conteudo.jsx`, `src/conteudo/b2-conteudo.json`, `s11-b2-conteudo.json`, `site.json`, `App.jsx`, `README.md`)
**Antes**: a análise de conteúdo do B2 (1.588 comentários de 53 casas, 15/10) só estava nos CSVs de `analise_conteudo/` e no documento do instrumento.
**Depois**: aba 11 "Análise de conteúdo" com números do corpus, temas mais citados (elogio, crítica e mista ou neutra), composição das críticas, nota média com elogio e com crítica, ocasião e público citados, os 12 achados do §3 com a decisão do plano e a tabela por estabelecimento. Seletores de tipo (casas de jogos, lojas, total) e de medida (% dos comentários ou ponderado). O JSON sai do script novo, que lê os CSVs e o §3; a soma dos comentários por tipo fecha com 1.588. A nota avisa que a recodificação cega da amostra de 131 ainda não foi feita. Conferido no navegador, sem erro no console.
**Justificativa**: pedido do autor.

### 12:10
**Objeto**: `_src/extras/auditorias_site.py` (novo); aba 12 do site (`src/sections/S12Auditorias.jsx`, `src/conteudo/auditorias.json`, `s12-auditorias.json`, `site.json`, `App.jsx`, `README.md`)
**Antes**: as amostras de auditoria (commit 08d9ac7) só estavam nas pastas `auditoria/` dos brutos e nos registros de sorteio.
**Depois**: aba 12 "Auditoria da coleta" com as regras comuns (critério de Wilson ≤ 5%, sorteio por SHA-256 com semente 20261015, estratos com mínimo e maiores restos, registro com hash), o cálculo do tamanho (n mínimo de 73 com zero erros; 200 aceita até 3 erros), a curva do limite com as amostras do trabalho, a tabela com população, amostra, estratos e se cada uma cumpre o critério, e uma seção por conjunto (o que conferir, tipo de amostragem, justificativa, tamanho, comparação e ressalvas). Ficam declarados: estabelecimentos (33, limite de 10,4%) e entorno (11 casas, 25,9%; 61 itens, 5,9%) não cumprem o critério nem com zero erros; a amostra do entorno precisa ser sorteada de novo depois da nova coleta do OSM. Conferido no navegador, sem erro no console.
**Justificativa**: pedido do autor.

### 12:13
**Objeto**: `B1-a_auditoria_estabelecimentos.py`, `_dados-brutos/estabelecimentos/auditoria/` (amostra e registro), aba 12 do site (`auditorias.json`, `s12-auditorias.json`), `docs/decisoes.md` e `docs/pendencias.md`
**Antes**: população da auditoria = 164 candidatos antes da curadoria (`B1_curadoria_metro_f_av100.csv`); amostra de 33 (limite de 10,4% com zero erros).
**Depois**: população = as 54 casas do objeto (`B1_resumo_estabelecimentos.xlsx`), com a data de coleta da curadoria e do acervodejogos; amostra de 11 (20%, 9 estratos de capital e faixa de volume, limite de 25,9% com zero erros), sorteada de novo com a mesma semente. A aba 12 e a pendência sobre o tamanho das amostras foram atualizadas.
**Justificativa**: pedido do autor: a auditoria deve considerar o total de 54 estabelecimentos.

### 13:28
**Objeto**: site de apresentação (`src/index.css`, `src/tema.js`, `src/formato.js`, `components/graficos.jsx` e seções 05, 08 a 12)
**Antes**: paleta em azul e rosa em todo o site (texto, fundos, blocos, pílulas e séries dos gráficos).
**Depois**: tokens de cor resolvem para preto, cinza e branco; as séries dos gráficos são cinza. Uma única cor (vermelho, token `destaque`) fica reservada a Salvador e ao Nordeste nos gráficos e linhas de tabela, às críticas na análise de conteúdo, às amostras de auditoria fora do critério de 5% e ao aviso "Atenção". Linhas de referência (mediana, critério) passam a cinza tracejado. O site não foi publicado.
**Justificativa**: pedido do autor: paleta mais sóbria, com cor só nos casos pertinentes.

### 13:40
**Objeto**: `textos/capitulos/5_analise_de_mercado.md` (novo), `AGORA.md`, `docs/decisoes.md`, `docs/pendencias.md`, `textos/planejamento/status_capitulos.md`
**Antes**: cap. 5 não iniciado.
**Depois**: esboço das seções 5.1 a 5.5, do maior para o menor (Brasil → Bahia → Salvador; serviços às famílias → alimentação fora do lar e lazer → luderias), com números do B4 (PAS, POF, PNAD Contínua, Censo, IPCA, BCB, FipeZAP) e do B1; 5.2 com números provisórios do B2. Lacunas marcadas `[script]`, `[AV]` e `[BUSCAR]`; quadro de fontes por nível de preferência no fim.
**Justificativa**: pedido do autor: esboços do cap. 5 com fontes oficiais antes das setoriais e da imprensa.


### 13:57
**Objeto**: `CLAUDE.md` (seção "Melhorias do texto"), `docs/melhorias-texto.md` (novo), `docs/pendencias.md`, `docs/decisoes.md`, `AGORA.md`
**Antes**: sem rotina de conferência cruzada entre capítulos; divergências e repetições entre os caps. 1, 2 e 5 sem registro.
**Depois**: regra no `CLAUDE.md`: a cada capítulo gerado ou revisado, analisar todos os capítulos e atualizar `docs/melhorias-texto.md`, com divergências (grave, média, aceitável) e cortes em potencial (alto, médio, baixo ganho). Primeira análise sobre os caps. 1, 2 e 5: 18 divergências (D01 grave: escalas de fontes e de confiança misturadas no cap. 5) e 12 cortes (~930 palavras, cerca de 2,7 páginas). Pendência 10 aberta para a escala de fontes; linha nova em `decisoes.md`; link no `AGORA.md`.
**Justificativa**: pedido do autor: manter um registro vivo das divergências e dos cortes possíveis para revisar o texto e respeitar o teto de páginas.

### 13:57
**Objeto**: `textos/capitulos/1_introducao_plano_luderia.md`, `2_referencial_teorico.md` e `5_analise_de_mercado.md`; `_instrucoes/1_estrutura.md` (P1, 1.3) e `_instrucoes/8_financeiro.md` (N1–N6)
**Antes**: caps. 1 e 2 e as instruções (P1 em 7 níveis, N1–N6, P2; até 6 objetivos específicos).
**Depois**: cap. 5 (15/10) com ordem de fontes em 4 níveis e rótulos de escalas misturados; cap. 1 com 7 objetivos; demais divergências D02 a D18 descritas em `docs/melhorias-texto.md`.
**Efeitos colaterais**: a banca pode ler "N2" e "nível 2" como a mesma escala; objetivos a mais desalinham o 11.2. Nada foi corrigido nos capítulos.

### 14:11
**Objeto**: `dados/[B1] Estabelecimentos e cardapios/_dados-brutos/entornos/` (OSM de 54 casas, São Jogue Paralela, `versoes_superadas/`) e `redes_sociais/rs_<cidade>/rs_<perfil>/` (perfis de 8 casas)
**Antes**: OSM de 15/10 (11h38) só com nós; perfis do Instagram de Bardo Mago, La Tabuleria, Tubaleria, Encounter, Toca do Rato, BoardZ, TabuClub e Luderia Carioca na pasta Downloads; coleta avulsa da São Jogue Paralela e versão de 13h28 do Maps de 14/10 na pasta Downloads.
**Depois**: `2026-10-15_54_estabelecimentos_entorno_osm_resumo.csv`, `_osm_resultados.csv` e `_shoppings.csv` substituídos pela recoleta de 12h49 (versão 2026.10.15-3, com polígonos); `2026-10-15_sao_jogue_paralela_entorno_*.csv` nos brutos do entorno; a versão de 13h28 de `maps_entorno_*_2026-10-14.csv`, menor que a já guardada, em `versoes_superadas/` com sufixo `_1328`; perfis renomeados para `2026-10-15_<perfil>_instagram_perfis.csv`.
**Justificativa**: pedido do autor: mover os arquivos de perfis e de entorno da pasta Downloads para os lugares do projeto.

### 14:11
**Objeto**: `_src/[B1] Estabelecimentos e cardapios/Google Places (Negócios)/webscripts/maps_entorno.user.js` (2026.10.15-3 → 2026.10.15-4) e `docs/parecer_entorno_B1.md` (§7 novo)
**Antes**: no OSM, plataformas de cada sentido da mesma estação (a 160-190 m) contavam como duas estações; paradas do bonde de Santa Teresa e paradas sem nome contavam como VLT; no Maps, sem busca que trouxesse as estações-tubo de Curitiba; versão do coletor fora dos CSVs.
**Depois**: no OSM, mesmo nome, mesmo grupo e mesma rede até 400 m contam uma vez; bonde de Santa Teresa e parada ou plataforma sem nome vão para "outro" (com `observacao`); no Maps, busca "estação tubo" só em Curitiba (dispensada nas demais), o que deixa as 6 casas de Curitiba pendentes até a recoleta; `versao_script` nos dois resumos. Simulado sobre a coleta de 12h49: VLT/BRT a 1000 m cai de 88 para 59 e metrô de 45 para 44, somas fechando em 54/54.
**Justificativa**: pedido do autor: analisar a última rodada do entorno e, se não tivesse extraído todas as variáveis em Maps e OSM, achar o problema e corrigir o extrator. A rodada não extraiu o VLT/BRT de forma confiável em nenhuma das duas fontes.


### 16:26
**Objeto**: branches `fix/entorno-maps-distantes` (Mac), `main` (cap. 3, PR #5) e `claude/project-thread-anqzoo` (PR #6), juntadas em `claude/project-thread-cc98ij`; `AGORA.md`, `docs/pendencias.md`, `docs/decisoes.md`, `docs/registro-de-alteracoes.md`, `textos/planejamento/status_capitulos.md`; cópias `(1)` dos CSVs do entorno de 14/10 em `_dados-brutos/entornos/`
**Antes**: o Mac tinha 29 commits fora do main (caps. 2 e 5, Bardin, auditoria, site, entorno) e não tinha o cap. 3; o main não tinha os 29 commits; o PR #6 mexia nos mesmos documentos de controle e na pasta antiga `estabelecimentos/` dos CSVs do entorno.
**Depois**: uma branch com os três; nos conflitos, mantidas as duas versões (registro na ordem da hora; status com cap. 2 do Mac e cap. 3 do main; divergências de estilo, triagem e 100 a 150 concorrentes devolvidas às pendências). As cópias `(1)`, idênticas aos arquivos sem sufixo (`cmp`), saíram também da pasta nova `entornos/`.
**Justificativa**: pedido do autor (item 1 das melhorias de 15/10): evitar perda de texto e conflitos maiores.

### 16:26
**Objeto**: `_src/Modelo financeiro/analise/financeiro-a_modelo.py` (novo), `dados/Modelo financeiro/financeiro_premissas.csv` (novo), `dados/Modelo financeiro/financeiro_modelo.xlsx` (novo), `.gitignore` (logs do modelo)
**Antes**: cap. 9 sem modelo nem registro de premissas; tarefas "Estrutura do modelo financeiro" (semana 4) e "Primeira versão do registro de premissas" (semana 5) abertas.
**Depois**: registro com 53 premissas (R, C, I, M), cada uma com faixa, fonte, nível e justificativa; o script calcula investimento, receitas com rampa, Simples por anexo e RBT12, DRE e fluxo mensais de 60 meses, VPL, TIR, payback descontado, ponto de equilíbrio, tornado, ruptura das 5 premissas críticas, coerência e a conferência de 13 premissas contra os arquivos do B1 e do B4 (13 conferem). Provável: investimento de R$ 390 mil, VPL de R$ 465 mil a TMA real de 14,8%, payback de 30 meses; pessimista com VPL negativo (−R$ 1,7 milhão); otimista com VPL de R$ 5,5 milhões. Críticas: permanência, ocupação em dia útil, horas abertas, ticket de A&B e ocupação no fim de semana; três delas só em N6.
**Justificativa**: pedido do autor (item 2 das melhorias de 15/10); rascunho do cap. 9 vence em 23/10.

### 16:26
**Objeto**: `textos/capitulos/8_aspectos_juridicos.md` (novo)
**Antes**: cap. 8 não iniciado, prazo vencido em 09/10.
**Depois**: rascunho com 8.1 (SLU, CNAE, Simples em dois anexos, Quadro 01 com a carga por cenário), 8.2 (Quadro 02 de licenças em Salvador, bebida alcoólica, LGPD) e 8.3 (locação, uso de jogos comprados, marca). Cerca de 3,9 páginas com as referências do capítulo; normas `[AV]`, exceto a LC 123/2006 conferida no texto compilado de 14/09/2026.
**Justificativa**: pedido do autor (item 3 das melhorias de 15/10). Sem travessão e sem voz passiva, porque P5 e a skill de escrita ainda divergem (pendência aberta).
### 18:03
**Objeto**: `dados/[B3] Contagem direta de ocupacao/_dados-brutos/app/` (`originais/2026-10-10_SJBV/POV1/` e `POV2/`, novos; `contagem_*.csv`, novos), `dados/[B3] Contagem direta de ocupacao/contagem_resumo_visitas.csv` e `contagem_notas_intervalo.csv` (novos), `_src/[B3] Contagem direta de ocupacao/Contagem direta/build/B3-b_importar_app.py` (novo), `outros/B3_descartes_app.csv` (novo), `analise/B3-a_contagem.py`, `AGORA.md`, `docs/decisoes.md`, `docs/pendencias.md`
**Antes**: nenhum dado de visita no B3; a análise lia um único arquivo por conteúdo, sem observador, e exigia `visita_fim` para calcular as taxas.
**Depois**: 19 CSVs exportados do app na visita de 10/10 ao Bela Vista (POV1: 9; POV2: 10) guardados intactos; consolidação com `visita_id` e `observador`, unidade tirada do nome da pasta (o POV2 digitou "BV 10.10") e descarte por lista (mesas do POV2: 5 grupos sem saída, registro até 19h27). A análise dá uma linha por observador e uma de média por visita; sem `visita_fim`, o fim é o maior entre o previsto e o último registro (`fim_estimado`). Fluxo: 52 linhas (32 + 20); mesas: 9 (POV1).
**Justificativa**: pedido do autor: importar os dados da primeira visita presencial, com dois observadores simultâneos, tomando a média dos dois e sabendo que uma das rotinas do POV2 está errada.

### 18:03
**Objeto**: `docs/decisoes.md` (02/10 e 13/10), `textos/planejamento/cronograma_luderia.md` e `_instrucoes/4_metodologia.md` (B3) × CSVs da visita ao Bela Vista
**Antes**: primeiras visitas no sábado, 03/10, entrada às 19h; retorno 15 dias depois, domingo, 18/10.
**Depois**: a visita ao Bela Vista registrada no app começou em 10/10 (18h37 no POV1, 19h02 no POV2); o retorno de 18/10 fica 8 dias depois.
**Efeitos colaterais**: o intervalo de notas fiscais entre as visitas (base das vendas no período) passa de 15 para 8 dias, e a visita deixa de cair na quinzena após o pagamento dos servidores estaduais (29 e 30/09). Nada foi corrigido nos documentos.


### 18:19
**Objeto**: `_src/[B3] Contagem direta de ocupacao/Contagem direta/build/B3-b_importar_app.py`, `outros/B3_descartes_app.csv`, `outros/B3_correcoes_app.csv` (novo), `dados/[B3] Contagem direta de ocupacao/_dados-brutos/app/originais/2026-10-10_SJBV/POV1/2026-10-10_SJBV_POV1_transcricao_precos.csv` (novo), `_dados-brutos/app/contagem_*.csv`, `contagem_resumo_visitas.csv`, `AGORA.md`, `docs/decisoes.md`, `docs/pendencias.md`
**Antes**: média dos dois observadores, com só as mesas do POV2 descartadas; o POV1 contava como entrada as 24 pessoas que já estavam dentro (B-1, 18h39, e B-7, 19h14): 86 entradas, 25,9 por hora; sem NFC-e.
**Depois**: todo o POV2 ignorado na visita; B-1 e B-7 excluídos do fluxo como estoque inicial; NFC-e final (série 2, nº 77977, 22h08:04, CNPJ 34.128.755/0001-98) e seus 4 itens mais o acréscimo de serviço (R$ 8,19, 10% sobre o consumo sem a taxa de entrada) transcritos da foto da nota. Resultado: 38 pessoas em 14 grupos, 11,4 por hora, permanência de 99 min na porta. A foto fica em `_dados-brutos/app/fotos/` (fora do git: traz CPF e nome do consumidor; CPF não transcrito).
**Justificativa**: pedido do autor: ignorar o POV2 nesta visita; as 24 pessoas eram as que já estavam dentro na chegada; incluir a nota fiscal final.

### 21:56
**Objeto**: `_src/extras/ler_notion_offline.py` (novo), `README.md` (linha de `_src/extras/`), `AGORA.md`
**Antes**: os bancos do Notion só eram lidos com internet (conector ou exportação manual).
**Depois**: leitor do cache SQLite do app desktop (`~/Library/Application Support/Notion/notion.db`), aberto só para leitura e copiado antes de ler: sem argumento lista os bancos com o número de linhas; com o nome do banco, exporta CSV com as colunas pelo nome, menções e relações resolvidas para o título da página e datas em ISO. Fórmulas e rollups vêm vazios (calculados no servidor). Em 15/10, o cache tinha 55 linhas em "A - Estabelecimentos", 54 em "Luderias – Status da coleta", 650 em "B - Jogos", 889 em "B - Comentários" (o banco tem 1.628: o cache guarda só o que o app baixou), 19 em "Bibliografia" e 590 em "B1_snowball_candidatos.csv".
**Justificativa**: pedido do autor: engenharia reversa do Notion desktop (skill REA) para ler os bancos do TCC offline. A análise do `app.asar` (7.38.1) mostrou o cache em `notion.db`, servido ao app pelo processo "Sqlite Server".

### 22:46
**Objeto**: `_src/site-apresentacao/` (`index.html`, `src/index.css`, `src/App.jsx`, `src/components/ui.jsx`, `src/components/graficos.jsx`, `src/formato.js`, `src/tema.js`, `src/conteudo/site.json`, `src/sections/*.jsx`, `README.md`), `docs/decisoes.md`, `AGORA.md`
**Antes**: paleta neutra (preto, cinza e branco) com vermelho de destaque; Montserrat em tudo; barra lateral preta com aba ativa cinza; cartões com cantos de 12 px e sombra; `site.json` definia `corFundo` e `corAbaAtiva` da barra.
**Depois**: visual editorial: fundo creme com grade de pontos quase invisível, cinzas quentes e um único acento terracota (`destaque`, também nos gráficos); títulos em Fraunces, corpo em Inter, números tabulares em JetBrains Mono; barra lateral clara com marcador terracota na seção ativa e subtítulo só nela; cabeçalho de seção com "NN / 12", régua e tempo previsto; cartões planos (cantos de 8 px, sem sombra); barra inferior do celular clara. `corFundo` e `corAbaAtiva` saíram do `site.json`.
**Justificativa**: pedido do autor: design sóbrio, bonito e inovador para o site-apresentação; direção "Editorial" escolhida entre três propostas.

### 22:49
**Objeto**: site de apresentação publicado (branch `gh-pages`, https://eusouopeu.github.io/luderia-tcc/), `AGORA.md`
**Antes**: o site no ar tinha a paleta preto/cinza/vermelho e Montserrat.
**Depois**: `pnpm run deploy` publicou o visual editorial (commit 095e81c); conferido no ar (Fraunces carregada, fundo creme).
**Justificativa**: pedido do autor: publicar o novo visual.

## 2026/10/16

### 16:45
**Objeto**: `_src/app-observacao/` (`src/domain/model.ts`, `resumo.ts`, `store.ts`, `App.tsx`, `screens/Visita.tsx`, `Ajustes.tsx`, `Folhas.tsx`, `FormMesa.tsx`, `abas/Fluxo.tsx`, `abas/Temporizador.tsx`, `ui/SeletorJogos.tsx`, testes, `package.json` 2.4.0, `android/app/build.gradle` 2026.10.16-1), APK `ObservacaoLuderia-2026.10.16-1.apk` (fora do git)
**Antes**: cada CSV exportado saía sem identificar visita, observador ou versão do app (o importador tirava isso do nome da pasta); entrada na porta e grupo na mesa eram lançados à parte, sem ligação; saída rápida sem motivo; sem botão de fechamento (grupos ainda dentro às 22h ficavam sem saída ou com saída falsa); nada sobre a posição, as pausas e o papel do observador; condições do dia como texto livre; pessoas e jogos sem marca de incerteza; tarefas extras (NFC-e, som, foto do cardápio, acervo) espalhadas em módulos.
**Depois**: (3) todos os CSVs começam com `visita_id`, `observador`, `versao_app`, `papel`, `unidade` e `visita_inicio`; o botão "Exportar esta visita" grava `<visita_id>_<observador>_contagem_<x>.csv`; código do observador e prefixo da casa em Ajustes. (6) Na porta, "Foi para" liga a entrada a uma mesa livre (abre o grupo com a hora da porta) ou ocupada (soma pessoas), ou a Balcão/loja, Retirada/delivery, Outro; saída em até 10 min sem mesa pede o motivo (Lotado, Só olhou, Balcão/loja, Retirada/delivery, Outro). (7) "Fechamento da casa" (Ações e Temporizador) dá saída a todos os grupos abertos com tipo `fechamento`, e o resumo e a análise tratam essa saída como censura. (8) Seção "Observador" na ficha: código, papel (porta, mesas, porta e mesas), posição e pausas registradas pelo temporizador. (10) "Condições do dia" como lista: Dia comum (exclusivo), feriado, véspera, feriado prolongado, evento (com nome), promoção e outras; encerrar sem marcar pergunta se foi dia comum. (13) "≈" marca pessoas estimadas na porta e na mesa, e "?" marca jogo incerto. (15) O Temporizador traz o "Roteiro da visita" (início, durante, fim) com as tarefas e o atalho para cada uma. 21 testes passam.
**Justificativa**: pedido do autor: implementar os itens 3, 6, 7, 8, 10, 13 (também para jogos) e 15 da revisão da visita de 10/10, antes das visitas de retorno.

### 16:45
**Objeto**: `_src/[B3] Contagem direta de ocupacao/Contagem direta/build/B3-b_importar_app.py`, `analise/B3-a_contagem.py`
**Antes**: o importador sempre inseria `visita_id` e `observador` a partir da pasta; a análise contava toda saída na permanência média e não separava desistências.
**Depois**: arquivo do formato novo (com `visita_id` e `observador` próprios) é conferido contra a pasta e interrompe se divergir; o formato antigo continua lido. A permanência na porta exclui saídas com motivo "Fechamento" e a das mesas usa só `censurada != sim`; colunas novas `desistencias_porta` e `pessoas_desistiram` (motivo Lotado ou Só olhou). Rodado sobre a visita de 10/10: consolidados idênticos aos versionados; o resumo só ganha as duas colunas (zero).
**Justificativa**: acompanhar o formato novo do app sem perder os originais de 10/10.

### 16:45
**Objeto**: `docs/registro-de-alteracoes.md` × anotação da revisão da visita de 10/10 (`/mnt/project-files/b3/revisao_visita_2026-10-10_e_app.md`)
**Antes**: a revisão tratou a diferença de acervo entre os observadores (432 contra 350 caixas; 7 contra 0 instrutores) como erro de contagem.
**Depois**: o autor explicou que um observador contou só o salão de jogos e o outro somou a sala separada (provavelmente de RPG).
**Efeitos colaterais**: o acervo da unidade depende do ambiente contado; o protocolo precisa dizer se a sala de RPG entra (pendência aberta).

### 16:50
**Objeto**: `textos/instrumentos/recomendacoes_registro_consumo_B3.md` (novo), `docs/pendencias.md`
**Antes**: o módulo de pedidos do app exigia categoria, hora do pedido e chegada, e ficou vazio na visita de 10/10.
**Depois**: sete formas de registrar comidas e bebidas, da mais barata à mais cara, com a ordem sugerida (marca de comida e bebida na contagem de 30 min, consumo próprio com NFC-e e notas emitidas no intervalo primeiro); nada implementado no app.
**Justificativa**: pedido do autor: recomendações para facilitar o registro de consumo de comidas e bebidas.

## 2026/10/16

### 16:48
**Objeto**: Notion, banco "Luderias – Status da coleta" (54 linhas: Cardápio, Entornos, Instagram, Acervo de jogos, Google maps, "O que ainda falta?" e "Como proceder para conseguir os dados que faltam?")
**Antes**: status de 15/10 (Instagram 45 completas; Bardo Mago, La Tabuleria, TabuClub, Toca do Rato e Tubaleria parciais por falta de seguidores; Taverna e Encounter com acervo "Coleta parcial"; lojas sem A&B com cardápio ora "Coleta parcial", ora "Não coletado").
**Depois**: recalculado pelos arquivos do B1 (main + PR #10): cardápio 26 completa / 8 parcial / 20 não coletado (15 delas com "A&B não encontrado" na busca profunda de 16/10); entorno 26 / 28 / 0; Instagram 51 / 2 / 1 (perfis de 15/10 das casas novas trazem seguidores; Bravo completa pelo CSV de 12/10); acervo 16 / 9 / 29 (Taverna e Encounter caem para "Não coletado": o subdomínio foi ligado por nome com similaridade baixa); Google Maps 54 completas. As colunas de texto trazem uma linha por lacuna (cardápio, entorno, Instagram, snowball, acervo, B2) e o passo para fechá-la. Gerador e CSV em `/mnt/project-files/notion/` (fora do repositório).
**Justificativa**: pedido do autor de atualizar o banco com as casas do acervodejogos, os status e as lacunas com recomendação.

### 16:48 (divergência)
**Objeto**: `B1_resumo_estabelecimentos.xlsx` × perfis do Instagram de 15/10 (`redes_sociais/rs_<cidade>/rs_<perfil>/2026-10-15_*_perfis.csv`)
**Antes**: resumo sem seguidores de Bardo Mago, La Tabuleria, TabuClub, Toca do Rato e Tubaleria, e sem total de posts de La Tabuleria, TabuClub e Toca do Rato.
**Depois**: os perfis de 15/10 trazem esses números (ex.: Bardo Mago, 31.314 seguidores).
**Efeitos colaterais**: estatística descritiva e site leem o resumo e seguem sem essas casas no Instagram até rodar `B1-b_resumo.py`.

