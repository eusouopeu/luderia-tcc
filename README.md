# TCC Luderia

Plano de negócios baseado em evidências para uma luderia/ludobar/quiz-bar em Salvador (BA). Trabalho de Conclusão de Curso, Bacharelado em Administração, Escola de Administração da UFBA.

Todo número do texto pode ser gerado de novo por um script deste repositório. As decisões de desenho e as limitações de cada bloco estão em [_docs/_instrucoes/4_metodologia.md](_docs/_instrucoes/4_metodologia.md).

## Estrutura

| Pasta | Conteúdo |
|---|---|
| [`AGORA.md`](AGORA.md) | O que está em andamento, os próximos 3 passos e o que está bloqueado |
| `textos/` | TMin inteiro (`.docx` e PDF) na raiz |
| `textos/capitulos/` | `.md` dos capítulos, fonte única do texto, e os `.docx` avulsos |
| `textos/figuras/`, `textos/quadros/`, `textos/planilhas/`, `textos/graficos/` | O que junta dados de mais de um bloco: figuras dos capítulos, quadros, planilhas DMax por bloco e o modelo financeiro, e os gráficos das planilhas (`agregados/`, `comentarios/`) |
| `textos/_planejamento/` | Cronograma, status dos capítulos, projeto de pesquisa e registro prévio |
| `textos/_planejamento/_instrumentos/` | Roteiro de observação, livro de códigos da análise de conteúdo e protocolo de validação |
| `_docs/_instrucoes/` | Instruções por capítulo (ver [CLAUDE.md](CLAUDE.md)) |
| `_src/pyScripts/B<n>_<Coleta>/` | Scripts de uma coleta (ex.: `B1_Estabelecimentos`, `B4_Marketing`): `1_collect/`, `2_build/`, `3_analise/`, `4_logs/` (fora do git) e `5_outros/` (auxiliares). Convenções de nomes em [`_src/dicionario.md`](_src/dicionario.md) |
| `_src/webScripts/` | Webscripts do Tampermonkey e seus testes, uma pasta por bloco (`B<n>_<nome>/`, ex.: `B1_estabelecimentos/`); carregadores em `_carregadores/` (fora do git, gerados por `_src/outros/G5_outros/gerar_carregadores.py`) e kit dos painéis em `_kit_painel/`; padrão comum em `specs/especificacoes_comuns.md` |
| `_src/outros/` | Utilitários gerais, por função: `G1_planilhas/` (dados agregados e histogramas), `G2_graficos/`, `G3_modelo_financeiro/`, `G4_textos/` (`.docx` dos capítulos, apêndices, pré-textuais, cronograma) e `G5_outros/` (log comum, carregadores do Tampermonkey, cópia para o vault, leitura offline do Notion) |
| `dados/B<n>_<coleta>/_dados-brutos/` | Dados brutos de uma coleta (parte não publicada: ver `.gitignore`) |
| `dados/B<n>_<coleta>/_auditoria/` | Amostras de conferência da coleta e seus registros de sorteio |
| `dados/B<n>_<coleta>/_dados-agregados/` | Tabelas e gráficos tratados |
| `.../_arquivo/` | Em cada uma das três subpastas: versões anteriores |
| `_src/outros/G3_modelo_financeiro/` e `textos/capitulos/modelo_financeiro/` | Modelo do cap. 9 (`gerar_modelo_financeiro.py`) e as premissas fixas em xlsx (`premissas_autor.xlsx`, entrada; `premissas_registro.xlsx`, saída), conferidas a cada execução contra a aba premissas de `textos/planilhas/9_plano_financeiro_modelo.xlsx` (`--conferir` confere sem regerar) |
| `bibliografia/` | PDFs por tipo (`F1_Legislacao/`, `F2_Relatorios/`, `F3_Livros/`, `F4_TCC_plano_negocios/`, `F5_Outros/`; fora do git), trechos citados, lista de leitura e referências das bases públicas |
| `_docs/` | Decisões, pendências, registro de alterações, melhorias do texto; pareceres avulsos em `_docs/pareceres/` |
| `_src/outros/App_Observacao/` | App Android usado na contagem direta (Bloco B3) |
| `_src/outros/App_Apresentacao/` | Site da apresentação oral |
| `~/Documents/arquivados/` | Fora do repositório: rascunhos, saídas do desenho anterior, blocos retirados do escopo (antigo B5 de jogos, B6) e o modelo financeiro v0 |

## Por onde começar

Abrir sempre o [AGORA.md](AGORA.md) primeiro. Depois, conforme a tarefa:

| Vou… | Abrir | Saída ou registro |
|---|---|---|
| Escrever o cap. N | `_docs/_instrucoes/` do capítulo (mapa no [CLAUDE.md](CLAUDE.md)); dados em `dados/B<n>_<coleta>/_dados-agregados/`; skill `meu-estilo-escrita` | `textos/capitulos/`; atualizar `textos/_planejamento/status_capitulos.md` |
| Escrever o cap. 2 | `_docs/_instrucoes/2_ref-teorico.md` e `bibliografia/_lista-de-leitura_TMin_v2.md` | `textos/capitulos/` |
| Coletar avaliações (B2) | `_src/webScripts/B2_avaliacoes_recentes/maps_avaliacoes.user.js` (Tampermonkey), fila em `dados/B2_avaliacoes/_dados-agregados/B2_fila_coleta.txt` | rodar `B2-b_avaliacoes.py`; situação em `B2_cobertura_coleta.csv` |
| Ir a campo (B3) | `textos/_planejamento/_instrumentos/roteiro_observacao_sao_jogue.md` e `_src/outros/App_Observacao/` | `dados/B3_contagem/_dados-brutos/` |
| Mexer em cardápios, acervos ou Instagram (B1) | `_src/pyScripts/B1_Cardapios/`, `_src/pyScripts/B1_Acervo_jogos/`, `_src/pyScripts/B1_Redes_sociais/` | `dados/B1_cardapios/`, `dados/B1_acervo_jogos/`, `dados/B1_redes_sociais/` |
| Atualizar uma base pública (B4) | `_src/pyScripts/`; referências em `bibliografia/_referencias_bases_publicas.md` | `dados/B4_<uso>/_dados-agregados/` |
| Ver ou mudar prazos | `textos/_planejamento/cronograma_luderia.md` | `node _src/outros/G4_textos/gerar_docx_cronograma.js` (`--resumo` para a versão curta) gera o `.docx` |
| Tomar ou consultar uma decisão | `_docs/decisoes.md` e `_docs/pendencias.md` | decisão tomada sai de pendências e entra em decisões |
| Anotar dúvida ou ideia | `_docs/pendencias.md` | — |

## Pipeline

Cada script segue a sequência `collect` (coleta) → `build` (tratamento) → `analise`. Os scripts se chamam `Bn-<c|b|a>_<conteúdo>.py` e as saídas, `Bn_<conteúdo>` ([dicionário](_src/dicionario.md)). Os blocos estão em ordem de relevância para o plano.

| Bloco | Fonte | Scripts principais | Uso no plano |
|---|---|---|---|
| **B1** Estabelecimentos e cardápios | Google Places API, OpenStreetMap, curadoria manual | `B1-c_places` → `B1-c_details` (`--sem-reviews`) → `B1-b_planilha` → `B1-b_planilhas_regic` → `B1-a_limiares` → `B1-b_triagem_manual` → `B1-b_cardapios_planilha`; legendas do Instagram: `B1-a_instagram_temas`, `B1-a_instagram_precos`, `B1-a_instagram_eventos` | Concorrência, preço, ticket, eventos |
| **B2** Avaliações recentes | Google Maps (avaliações até "3 meses atrás", inclusive) | userscript `maps_avaliacoes` → `B2-b_avaliacoes` (consolida, confere cobertura, gera a fila) → `B2-a_conteudo_bardin` | Proposta de valor, reclamações, fluxo |
| **B3** Contagem direta de ocupação | Observação na São Jogue (app) e NFC-e | `B3-b_contagem_sorteio` → `B3-a_contagem`, `B3-b_ocr_fotos` | Ocupação, giro, calibração |
| **B4** Bases públicas | IBGE, Novo CAGED, FipeZap, Simples Nacional, BCB, CONCLA | `B4-c_*` → `B4-b_*` | Demanda, custos, tributos, taxa de desconto |
| **B5** Ativos fixos | Sites e e-commerces (orçamentos de obra, aluguel, mobiliário, cozinha e bar, equipamentos, jogos) | `B5_aluguel`: userscript `portais_aluguel` → `B5-b_anuncios_aluguel`; `B5_reforma`: `B5-c_sinapi`; `B5_mobiliario`: userscript `precos_itens` → `B5-b_orcamento_itens` | Investimento inicial, aluguel |
| **B6** Histórico dos avaliadores | — | — | Retirado em 18/09/2026 (`~/Documents/arquivados/B6-avaliadores/`) |

Todo script roda a partir de qualquer diretório:

```bash
python3 "_src/pyScripts/B1_Estabelecimentos/3_analise/B1-a_limiares.py"
```

## Instalação

Python 3.11+:

```bash
pip install -r requirements.txt
```

As chaves de API ficam em `.env`, na raiz, que não é versionado: `GOOGLE_PLACES_API_KEY`.

O site e o app usam [pnpm](https://pnpm.io). Os pacotes ficam num repositório global (`~/Library/pnpm/store`), compartilhado entre projetos, e cada `node_modules` só tem links para ele.

```bash
npm i -g pnpm
```

```bash
pnpm --dir _src/outros/App_Apresentacao install
```

```bash
pnpm --dir _src/outros/App_Apresentacao dev
```

## Regras de dados

- Toda tabela agregada fecha com o total: cada unidade conta em um único grupo, atribuído por atributo próprio.
- Texto integral de avaliações, respostas de API e cardápios de terceiros não são publicados (`.gitignore`).
- Mudanças em arquivos ficam nas mensagens dos commits; mudanças no Notion e divergências entre documentos, em [_docs/registro-de-alteracoes.md](_docs/registro-de-alteracoes.md).
