# CLAUDE.md — TCC Luderia

TCC em formato **plano de negócios baseado em evidências** para uma luderia/ludobar/quiz-bar em **Salvador**, posicionada para o **público casual** (não-hobbyista). Cada decisão do plano é amarrada a um dado, e cada dado a uma fonte e a um grau de confiança (N1–N6).

## Mapa dos arquivos de instrução

Ler este arquivo sempre. Ler os demais sob demanda, conforme a tarefa. A numeração é a ordem de leitura, não o número do capítulo.

| Arquivo | Quando ler |
|---|---|
| [_instrucoes/1_estrutura.md](_instrucoes/1_estrutura.md) | Visão do todo; tarefa com mais de um capítulo; caps. 1, 4 e 11 (sem arquivo próprio); teto de páginas; hierarquias de fontes, dados e focos; escrita e vocabulário |
| [_instrucoes/2_ref-teorico.md](_instrucoes/2_ref-teorico.md) | Cap. 2 — escrita, citação, subcapítulos, lista de leitura |
| [_instrucoes/4_metodologia.md](_instrucoes/4_metodologia.md) | Cap. 3 — instrumentos de coleta, blocos de dados, matriz de evidências |
| [_instrucoes/3_mercado.md](_instrucoes/3_mercado.md) | Cap. 5 — análise de mercado |
| [_instrucoes/5_marketing.md](_instrucoes/5_marketing.md) | Cap. 6 — marketing e estimativa de demanda |
| [_instrucoes/7_operacional.md](_instrucoes/7_operacional.md) | Cap. 7 — plano operacional |
| [_instrucoes/6_juridico.md](_instrucoes/6_juridico.md) | Cap. 8 — aspectos jurídicos e legais |
| [_instrucoes/8_financeiro.md](_instrucoes/8_financeiro.md) | Cap. 9 — escala N1–N6, premissas, modelo financeiro, sensibilidade |
| [_instrucoes/9_anal-riscos.md](_instrucoes/9_anal-riscos.md) | Cap. 10 — análise estratégica e de riscos |
| [_instrucoes/10_biblio-apendices.md](_instrucoes/10_biblio-apendices.md) | Referências, apêndices, tabelas, quadros, figuras |

## Estado do projeto

- Pastas: `textos/` (projeto de pesquisa, cronograma e capítulos), `arquivados/` (fora de uso, incluindo `recorte-antigo/`), `bibliografia/`, `docs/`, `_instrucoes/`, `_src/` (scripts), `_data/` (dados), `_logs/`, `site-apresentacao/`, `app-observacao/` (app Android da contagem). Visão geral do pipeline no [README.md](README.md).
- Prazos: `textos/cronograma_luderia.md`. Versão final para a banca em 16/11/2026.
- `arquivados/introducao_tcc_luderia.md` e `arquivados/metodologia_tcc_luderia.md` são do **desenho anterior** (pesquisa de mercado, hipóteses H1–H9): servem de insumo; hipóteses e testes vão para apêndice, salvo quando sustentam decisão do plano.
- Pipeline: `_src/[Bn] Fonte/` → `_data/raw/[Bn] Nome/` → `_data/processed/[Bn] Nome/`. Scripts `<etapa>_Bn_<conteúdo>.py` (`collect` → `build` → `analise`), saídas `Bn_<conteúdo>`; cada script define `ROOT = Path(__file__).resolve().parents[2]` e roda de qualquer diretório. Detalhes em `_instrucoes/4_metodologia.md`. Blocos, em ordem de relevância:
  - **B1** — concorrentes com mais de 100 avaliações nas 14 metrópoles da REGIC (IBGE) e seus cardápios → concorrência, preço, ticket.
  - **B2** — avaliações com texto publicadas até "um mês atrás" (rótulo do Google Maps na data da coleta) → proposta de valor, reclamações, ticket, fluxo.
  - **B3** — contagem direta nas duas unidades da São Jogue (Salvador), com leitura da NFC-e → ocupação, giro, calibração.
  - **B4** — bases públicas (IBGE, Novo CAGED, FipeZap, Simples Nacional, BCB, CONCLA) → demanda, custos, tributos, taxa de desconto. Subpastas por uso definidas em `USOS` no `bases_comum.py`.
  - **B6** — histórico dos avaliadores; retirado em 18/09/2026.

## Versionamento

- **Commit e push automáticos** após qualquer modificação, sem pedir confirmação (`origin`, branch atual). Um commit por conjunto coerente de mudanças, mensagem em português dizendo o que mudou e por quê.
- Antes do commit, conferir com `git status` se nada ignorado pelo `.gitignore` (dados brutos, `.env`, CAGED, zips) entrou por engano.
- Se o push falhar, informar o erro ao autor em vez de forçar (`--force`).

## Registro de alterações

Arquivo: [docs/registro-de-alteracoes.md](docs/registro-de-alteracoes.md) (formato no topo). Registros novos entram no fim, sob `## AAAA/MM/DD` (criado se não existir), com a hora (`### HH:mm`) tirada de `date`, no mesmo commit da mudança.

1. **TODA VEZ** que uma ação mudar qualquer arquivo do projeto, registrar data, hora, **Objeto**, **Antes**, **Depois** e **Justificativa**.
2. **TODA VEZ** que aparecer informação divergente entre documentos ainda sem registro, registrar data, **Objeto**, **Antes** (arquivo mais antigo), **Depois** (mais recente) e **Efeitos colaterais**. Registrar a divergência não autoriza corrigi-la sem pedido do autor.

## Princípios

- **Escrita:** skill `meu-estilo-escrita` para qualquer prosa do TCC, mais as regras de escrita e o vocabulário controlado de `_instrucoes/1_estrutura.md` (P5 e P6).
- **Extensão:** no máximo 90 páginas, com teto por capítulo em `_instrucoes/1_estrutura.md`. Testes de hipótese H1–H9 e Monte Carlo são extras, só se sobrar tempo.
- **Tabela agregada fecha com o total.** Cada unidade (place_id, avaliação, jogo) conta em **um único grupo**, atribuído por atributo próprio (ex.: UF do endereço), nunca pelo contexto da coleta. Antes de entregar, somar as linhas e comparar com o total (diferença zero); vale também ao rodar de novo um script existente. Contagem não exclusiva por desenho fica declarada no nome da coluna e na docstring, sem total como soma.
- **Decisão antes de descrição:** todo resultado responde "que decisão do plano isso muda?". Se nenhuma, vai para apêndice ou sai.
- **Nada de número sem fonte** (instituição, base, recorte, data). **Nada de referência inventada:** obra não conferida fica `[A VERIFICAR]`.
- **Incerteza declarada:** estimativas com faixa (pessimista/provável/otimista) e nível de evidência.
- **Sem questionários** de opinião ou intenção; preferir fontes secundárias e primárias comportamentais.
- **Normas:** ABNT (detalhes em `_instrucoes/10_biblio-apendices.md`). Instituição: UFBA.
- **Idioma:** português do Brasil no texto, nos comentários do código e nos nomes de arquivos de saída.
- **Pastas enxutas:** nenhuma pasta com mais de cerca de 10 itens soltos na raiz; ao criar arquivos ou pastas, agrupar em subpastas por etapa ou tema (ex.: amostragem, curadoria, aprovadas, cardápios, redes sociais). Pedido do autor em 12/10/2026: abrir a pasta e ver dezenas de arquivos de uma vez sobrecarrega.
- **Nome de arquivo de coleta de rede social:** `AAAA-MM-DD_<estabelecimento>_instagram_<perfis|posts>.csv`.
