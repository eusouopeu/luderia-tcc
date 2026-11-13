# TCC Luderia

Plano de negócios baseado em evidências para uma luderia/ludobar/quiz-bar em Salvador (BA). Trabalho de Conclusão de Curso, Bacharelado em Administração, Escola de Administração da UFBA.

Todo número do texto pode ser gerado de novo por um script deste repositório. As decisões de desenho e as limitações de cada bloco estão em [_docs/_instrucoes/4_metodologia.md](_docs/_instrucoes/4_metodologia.md).

## Estrutura

| Pasta | Conteúdo |
|---|---|
| [`AGORA.md`](AGORA.md) | O que está em andamento, os próximos 3 passos e o que está bloqueado |
| `textos/capitulos/` | Capítulos do TCC (TMin: `.md` em `_md/`, fonte única do texto; `.docx` e PDF na raiz) e suas figuras |
| `textos/planejamento/` | Cronograma, status dos capítulos, projeto de pesquisa e registro prévio |
| `textos/instrumentos/` | Roteiro de observação, livro de códigos da análise de conteúdo e quadro de itens |
| `_docs/_instrucoes/` | Instruções por capítulo (ver [CLAUDE.md](CLAUDE.md)) |
| `_src/[Bn] Nome/<Objeto>/` | Scripts de um objeto do bloco (ex.: `Google Places (Negócios)`, `Instagram`): `collect/`, `build/`, `analise/`, `logs/` (fora do git) e `outros/` (auxiliares). Convenções de nomes em [`_src/dicionario.md`](_src/dicionario.md) |
| `_src/Webscripts/` | Webscripts do Tampermonkey e seus testes, uma pasta por bloco (`[Bn] Nome/`); carregadores em `_carregadores/` (fora do git, gerados por `_src/Extras/Gerar_outros/gerar_carregadores.py`) e kit dos painéis em `_kit_painel/` |
| `_src/Extras/` | Utilitários gerais: log comum, gerador dos carregadores do Tampermonkey, `.docx` do cronograma e do projeto, cópia para o vault, leitura offline dos bancos do Notion (`ler_notion_offline.py`) |
| `dados/B<n>_<coleta>/_dados-brutos/` | Dados brutos de uma coleta (parte não publicada: ver `.gitignore`) |
| `dados/B<n>_<coleta>/_auditoria/` | Amostras de conferência da coleta e seus registros de sorteio |
| `dados/B<n>_<coleta>/_dados-agregados/` | Tabelas e gráficos tratados |
| `.../_arquivo/` | Em cada uma das três subpastas: versões anteriores |
| `_src/Modelo financeiro/analise/` e `dados/modelo_financeiro/` | Modelo do cap. 9 (`gerar_modelo_financeiro.py`) e as premissas fixas em CSV (`premissas_autor.csv`, entrada; `premissas_registro.csv`, saída) |
| `dados/dados_agregados/` | Planilhas DMax por bloco e gráficos (`gerar_planilha_agregada.py`) |
| `bibliografia/` | PDFs de leitura, lista de leitura e referências das bases públicas |
| `_docs/` | Decisões, pendências, registro de alterações, melhorias do texto; pareceres avulsos em `_docs/pareceres/` |
| `_src/Extras/App_Observacao/` | App Android usado na contagem direta (Bloco B3) |
| `_src/Extras/App_Apresentacao/` | Site da apresentação oral |
| `arquivados/` | Rascunhos, saídas do desenho anterior e blocos retirados do escopo (antigo B5 de jogos, B6) e o modelo financeiro v0, guardados para uso futuro |

## Por onde começar

Abrir sempre o [AGORA.md](AGORA.md) primeiro. Depois, conforme a tarefa:

| Vou… | Abrir | Saída ou registro |
|---|---|---|
| Escrever o cap. N | `_docs/_instrucoes/` do capítulo (mapa no [CLAUDE.md](CLAUDE.md)); dados em `dados/B<n>_<coleta>/_dados-agregados/`; skill `meu-estilo-escrita` | `textos/capitulos/`; atualizar `textos/planejamento/status_capitulos.md` |
| Escrever o cap. 2 | `_docs/_instrucoes/2_ref-teorico.md` e `bibliografia/_lista-de-leitura_TMin_v2.md` | `textos/capitulos/` |
| Coletar avaliações (B2) | `_src/Webscripts/[B2] Avaliacoes recentes/maps_avaliacoes.user.js` (Tampermonkey), fila em `dados/B2_avaliacoes/_dados-agregados/B2_fila_coleta.txt` | rodar `B2-b_avaliacoes.py`; situação em `B2_cobertura_coleta.csv` |
| Ir a campo (B3) | `textos/instrumentos/roteiro_observacao_sao_jogue.md` e `_src/Extras/App_Observacao/` | `dados/B3_contagem/_dados-brutos/` |
| Mexer em cardápios, acervos ou Instagram (B1) | `_src/PyScripts/B1_Cardapios/`, `_src/PyScripts/B1_Acervo_jogos/`, `_src/PyScripts/B1_Redes_sociais/` | `dados/B1_cardapios/`, `dados/B1_acervo_jogos/`, `dados/B1_redes_sociais/` |
| Atualizar uma base pública (B4) | `_src/PyScripts/`; referências em `bibliografia/referencias_bases_publicas.md` | `dados/B4_<uso>/_dados-agregados/` |
| Ver ou mudar prazos | `textos/planejamento/cronograma_luderia.md` | `node _src/Extras/Gerar_textos/gerar_docx_cronograma.js` (`--resumo` para a versão curta) gera o `.docx` |
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
| **B5** Ativos fixos | Sites e e-commerces (orçamentos de obra, aluguel, mobiliário, cozinha e bar, equipamentos, jogos) | userscript `portais_aluguel` → `B5-b_anuncios_aluguel` | Investimento inicial, aluguel |
| **B6** Histórico dos avaliadores | — | — | Retirado em 18/09/2026 (`arquivados/B6-avaliadores/`) |

Todo script roda a partir de qualquer diretório:

```bash
python3 "_src/PyScripts/B1_Estabelecimentos/3_analise/B1-a_limiares.py"
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
pnpm --dir _src/Extras/App_Apresentacao install
```

```bash
pnpm --dir _src/Extras/App_Apresentacao dev
```

## Regras de dados

- Toda tabela agregada fecha com o total: cada unidade conta em um único grupo, atribuído por atributo próprio.
- Texto integral de avaliações, respostas de API e cardápios de terceiros não são publicados (`.gitignore`).
- Mudanças em arquivos ficam nas mensagens dos commits; mudanças no Notion e divergências entre documentos, em [_docs/registro-de-alteracoes.md](_docs/registro-de-alteracoes.md).
