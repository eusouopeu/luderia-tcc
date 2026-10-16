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
| `_src/[Bn] Nome/<Objeto>/` | Scripts de um objeto do bloco (ex.: `Google Places (Negócios)`, `Instagram`): `collect/`, `build/`, `analise/`, `webscripts/` (Tampermonkey), `logs/` (fora do git) e `outros/` (auxiliares). Convenções de nomes em [`_src/dicionario.md`](_src/dicionario.md) |
| `_src/extras/` | Utilitários gerais: log comum, carregadores do Tampermonkey, `.docx` do cronograma e do projeto, cópia para o vault, leitura offline dos bancos do Notion (`ler_notion_offline.py`) |
| `dados/[Bn] Nome/_dados-brutos/` | Dados brutos (parte não publicada: ver `.gitignore`) |
| `dados/[Bn] Nome/` | Tabelas e gráficos tratados |
| `bibliografia/` | PDFs de leitura, lista de leitura e referências das bases públicas |
| `docs/` | Decisões, pendências, registro de alterações, diagnóstico bibliográfico |
| `_src/app-observacao/` | App Android usado na contagem direta (Bloco B3) |
| `_src/site-apresentacao/` | Site da apresentação oral |
| `arquivados/` | Rascunhos, saídas do desenho anterior e blocos retirados do escopo (B5, B6), guardados para uso futuro |

## Por onde começar

Abrir sempre o [AGORA.md](AGORA.md) primeiro. Depois, conforme a tarefa:

| Vou… | Abrir | Saída ou registro |
|---|---|---|
| Escrever o cap. N | `_instrucoes/` do capítulo (mapa no [CLAUDE.md](CLAUDE.md)); dados em `dados/[Bn]…`; skill `meu-estilo-escrita` | `textos/capitulos/`; atualizar `textos/planejamento/status_capitulos.md` |
| Escrever o cap. 2 | `_instrucoes/2_ref-teorico.md` e `bibliografia/lista-de-leitura.md` | `textos/capitulos/` |
| Coletar avaliações (B2) | `_src/[B2] Avaliacoes recentes/Google Places (Comentários)/webscripts/maps_avaliacoes.user.js` (Tampermonkey), fila em `dados/[B2] Avaliacoes recentes/B2_fila_coleta.txt` | rodar `B2-b_avaliacoes.py`; situação em `B2_cobertura_coleta.csv` |
| Ir a campo (B3) | `textos/instrumentos/roteiro_observacao_sao_jogue.md` e `_src/app-observacao/` | `dados/[B3] Contagem direta de ocupacao/_dados-brutos/` |
| Mexer em cardápios, acervos ou Instagram (B1) | `_src/[B1] Estabelecimentos e cardapios/Cardápios/`, `_src/[B1] Estabelecimentos e cardapios/Acervo de Jogos/`, `_src/[B1] Estabelecimentos e cardapios/Instagram/` | `dados/[B1] Estabelecimentos e cardapios/` (`cardapios/`, `acervo_jogos/`, `redes_sociais/`) |
| Atualizar uma base pública (B4) | `_src/[B4] Bases publicas/`; referências em `bibliografia/referencias_bases_publicas.md` | `dados/[B4] Bases publicas/<uso>/` |
| Ver ou mudar prazos | `textos/planejamento/cronograma_luderia.md` | `node _src/extras/gerar_docx_cronograma.js` (`--resumo` para a versão curta) gera o `.docx` |
| Tomar ou consultar uma decisão | `docs/decisoes.md` e `docs/pendencias.md` | decisão tomada sai de pendências e entra em decisões |
| Anotar dúvida ou ideia | `docs/pendencias.md` | — |

## Pipeline

Cada script segue a sequência `collect` (coleta) → `build` (tratamento) → `analise`. Os scripts se chamam `Bn-<c|b|a>_<conteúdo>.py` e as saídas, `Bn_<conteúdo>` ([dicionário](_src/dicionario.md)). Os blocos estão em ordem de relevância para o plano.

| Bloco | Fonte | Scripts principais | Uso no plano |
|---|---|---|---|
| **B1** Estabelecimentos e cardápios | Google Places API, OpenStreetMap, curadoria manual | `B1-c_places` → `B1-c_details` (`--sem-reviews`) → `B1-b_planilha` → `B1-b_planilhas_regic` → `B1-a_limiares` → `B1-b_triagem_manual` → `B1-b_cardapios_planilha`; legendas do Instagram: `B1-a_instagram_temas`, `B1-a_instagram_precos`, `B1-a_instagram_eventos` | Concorrência, preço, ticket, eventos |
| **B2** Avaliações recentes | Google Maps (avaliações até "3 meses atrás", inclusive) | userscript `maps_avaliacoes` → `B2-b_avaliacoes` (consolida, confere cobertura, gera a fila) → `B2-a_conteudo_bardin` | Proposta de valor, reclamações, fluxo |
| **B3** Contagem direta de ocupação | Observação na São Jogue (app) e NFC-e | `B3-b_contagem_sorteio` → `B3-a_contagem`, `B3-b_ocr_fotos` | Ocupação, giro, calibração |
| **B4** Bases públicas | IBGE, Novo CAGED, FipeZap, Simples Nacional, BCB, CONCLA | `B4-c_*` → `B4-b_*` | Demanda, custos, tributos, taxa de desconto |
| **B6** Histórico dos avaliadores | — | — | Retirado em 18/09/2026 (`arquivados/B6-avaliadores/`) |

Todo script roda a partir de qualquer diretório:

```bash
python3 "_src/[B1] Estabelecimentos e cardapios/Google Places (Negócios)/analise/B1-a_limiares.py"
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
pnpm --dir _src/site-apresentacao install
```

```bash
pnpm --dir _src/site-apresentacao dev
```

## Regras de dados

- Toda tabela agregada fecha com o total: cada unidade conta em um único grupo, atribuído por atributo próprio.
- Texto integral de avaliações, respostas de API e cardápios de terceiros não são publicados (`.gitignore`).
- Mudanças no projeto ficam em [docs/registro-de-alteracoes.md](docs/registro-de-alteracoes.md).
