# TCC Luderia

Plano de negócios baseado em evidências para uma luderia/ludobar/quiz-bar em Salvador (BA). Trabalho de Conclusão de Curso, Bacharelado em Administração, Escola de Administração da UFBA.

Todo número do texto pode ser gerado de novo por um script deste repositório. As decisões de desenho e as limitações de cada bloco estão em [_instrucoes/4_metodologia.md](_instrucoes/4_metodologia.md).

## Estrutura

| Pasta | Conteúdo |
|---|---|
| [`AGORA.md`](AGORA.md) | O que está em andamento, os próximos 3 passos e o que está bloqueado |
| `textos/capitulos/` | Capítulos do TCC e suas figuras |
| `textos/planejamento/` | Cronograma, status dos capítulos, projeto de pesquisa e registro prévio |
| `textos/instrumentos/` | Roteiro de observação, livro de códigos da análise de conteúdo e quadro de itens |
| `_instrucoes/` | Instruções por capítulo (ver [CLAUDE.md](CLAUDE.md)) |
| `_src/[Bn] Fonte/` | Scripts de coleta, tratamento e análise, um bloco por pasta |
| `_data/raw/[Bn] Nome/` | Dados brutos (parte não publicada: ver `.gitignore`) |
| `_data/processed/[Bn] Nome/` | Tabelas e gráficos tratados |
| `bibliografia/` | PDFs de leitura, lista de leitura e referências das bases públicas |
| `docs/` | Decisões, pendências, registro de alterações, diagnóstico bibliográfico |
| `app-observacao/` | App Android usado na contagem direta (Bloco B3) |
| `site-apresentacao/` | Site da apresentação oral |
| `arquivados/` | Rascunhos, saídas do desenho anterior e blocos retirados do escopo (B5, B6), guardados para uso futuro |

## Por onde começar

Abrir sempre o [AGORA.md](AGORA.md) primeiro. Depois, conforme a tarefa:

| Vou… | Abrir | Saída ou registro |
|---|---|---|
| Escrever o cap. N | `_instrucoes/` do capítulo (mapa no [CLAUDE.md](CLAUDE.md)); dados em `_data/processed/[Bn]…`; skill `meu-estilo-escrita` | `textos/capitulos/`; atualizar `textos/planejamento/status_capitulos.md` |
| Escrever o cap. 2 | `_instrucoes/2_ref-teorico.md` e `bibliografia/lista-de-leitura.md` | `textos/capitulos/` |
| Coletar avaliações (B2) | `_src/Web scripts/maps_avaliacoes.user.js` (Tampermonkey), fila em `_data/processed/[B2] Avaliacoes recentes/B2_fila_coleta.txt` | rodar `build_B2_avaliacoes.py`; situação em `B2_cobertura_coleta.csv` |
| Ir a campo (B3) | `textos/instrumentos/roteiro_observacao_sao_jogue.md` e `app-observacao/` | `_data/raw/[B3] Contagem direta de ocupacao/` |
| Mexer em cardápios, acervos ou Instagram (B1) | `_src/[B1] Cardapios/`, `_src/[B1] Acervo de Jogos/`, `_src/[B1] Instagram/` | `_data/processed/[B1] Estabelecimentos e cardapios/` (`cardapios/`, `acervo_jogos/`, `redes_sociais/`) |
| Atualizar uma base pública (B4) | `_src/[B4] Bases publicas/`; referências em `bibliografia/referencias_bases_publicas.md` | `_data/processed/[B4] Bases publicas/<uso>/` |
| Ver ou mudar prazos | `textos/planejamento/cronograma_luderia.md` | `node _src/gerar_docx_cronograma.js` (`--resumo` para a versão curta) gera o `.docx` |
| Tomar ou consultar uma decisão | `docs/decisoes.md` e `docs/pendencias.md` | decisão tomada sai de pendências e entra em decisões |
| Anotar dúvida ou ideia | `docs/pendencias.md` | — |

## Pipeline

Cada script segue a sequência `collect` (coleta) → `build` (tratamento) → `analise`. Os scripts se chamam `<etapa>_Bn_<conteúdo>.py` e as saídas, `Bn_<conteúdo>`. Os blocos estão em ordem de relevância para o plano.

| Bloco | Fonte | Scripts principais | Uso no plano |
|---|---|---|---|
| **B1** Estabelecimentos e cardápios | Google Places API, OpenStreetMap, curadoria manual | `collect_B1_places` → `collect_B1_details` (`--sem-reviews`) → `build_B1_planilha` → `build_B1_planilhas_regic` → `analise_B1_limiares` → `build_B1_triagem_manual` → `build_B1_cardapios_planilha`; legendas do Instagram: `analise_B1_instagram_temas`, `analise_B1_instagram_precos`, `analise_B1_instagram_eventos` | Concorrência, preço, ticket, eventos |
| **B2** Avaliações recentes | Google Maps (avaliações até "3 meses atrás", inclusive) | userscript `maps_avaliacoes` → `build_B2_avaliacoes` (consolida, confere cobertura, gera a fila) → `analise_B2_conteudo_bardin` | Proposta de valor, reclamações, fluxo |
| **B3** Contagem direta de ocupação | Observação na São Jogue (app) e NFC-e | `build_B3_contagem_sorteio` → `analise_B3_contagem`, `build_B3_ocr_fotos` | Ocupação, giro, calibração |
| **B4** Bases públicas | IBGE, Novo CAGED, FipeZap, Simples Nacional, BCB, CONCLA | `collect_B4_*` → `build_B4_*` | Demanda, custos, tributos, taxa de desconto |
| **B6** Histórico dos avaliadores | — | — | Retirado em 18/09/2026 (`arquivados/B6-avaliadores/`) |

Todo script roda a partir de qualquer diretório:

```bash
python3 "_src/[B1] Google Places (estabelecimentos)/analise_B1_limiares.py"
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
pnpm --dir site-apresentacao install
```

```bash
pnpm --dir site-apresentacao dev
```

## Regras de dados

- Toda tabela agregada fecha com o total: cada unidade conta em um único grupo, atribuído por atributo próprio.
- Texto integral de avaliações, respostas de API e cardápios de terceiros não são publicados (`.gitignore`).
- Mudanças no projeto ficam em [docs/registro-de-alteracoes.md](docs/registro-de-alteracoes.md).
