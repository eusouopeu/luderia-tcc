# Registro de alterações

Mudanças relevantes no TCC e na pasta do projeto: metodologia, arquivos, instruções, capítulos, site de apresentação, app de coleta de observação, scripts de extração etc. Registros em ordem cronológica, do mais antigo para o mais recente.

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
