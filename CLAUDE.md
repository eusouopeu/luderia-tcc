# CLAUDE.md — TCC Luderia

TCC em formato **plano de negócios baseado em evidências** para uma luderia/ludobar/quiz-bar em **Salvador**. Cada decisão do plano é amarrada a um dado, e cada dado a uma fonte e a um grau de confiança (N1–N6).

## Mapa dos arquivos de instrução

Ler este arquivo e o [AGORA.md](AGORA.md) sempre; não carregar documentação ou arquivos grandes por padrão. Estrutura da documentação segue `../_shared/docs-standards.md`. Ler os demais sob demanda, conforme a tarefa (roteiro por tarefa no [README.md](README.md), "Por onde começar"). A numeração é a ordem de leitura, não o número do capítulo.

| Arquivo | Quando ler |
|---|---|
| [_instrucoes/1_estrutura.md](_instrucoes/1_estrutura.md) | Visão do todo; tarefa com mais de um capítulo; caps. 1, 4 e 11 (sem arquivo próprio); teto de páginas; hierarquias de fontes, dados e focos; escrita e vocabulário |
| [_instrucoes/2_ref-teorico.md](_instrucoes/2_ref-teorico.md) | Cap. 2 — escrita, citação, subcapítulos (lista de leitura em `bibliografia/lista-de-leitura.md`) |
| [_instrucoes/4_metodologia.md](_instrucoes/4_metodologia.md) | Cap. 3 — instrumentos de coleta, blocos de dados, matriz de evidências |
| [_instrucoes/3_mercado.md](_instrucoes/3_mercado.md) | Cap. 5 — análise de mercado |
| [_instrucoes/5_marketing.md](_instrucoes/5_marketing.md) | Cap. 6 — marketing e estimativa de demanda |
| [_instrucoes/7_operacional.md](_instrucoes/7_operacional.md) | Cap. 7 — plano operacional |
| [_instrucoes/6_juridico.md](_instrucoes/6_juridico.md) | Cap. 8 — aspectos jurídicos e legais |
| [_instrucoes/8_financeiro.md](_instrucoes/8_financeiro.md) | Cap. 9 — escala N1–N6, premissas, modelo financeiro, sensibilidade |
| [_instrucoes/9_anal-riscos.md](_instrucoes/9_anal-riscos.md) | Cap. 10 — análise estratégica e de riscos |
| [_instrucoes/10_biblio-apendices.md](_instrucoes/10_biblio-apendices.md) | Referências, apêndices, tabelas, quadros, figuras |

## Estado do projeto

- Pastas: `textos/` (`capitulos/`, `planejamento/`, `instrumentos/`), `arquivados/` (fora de uso, incluindo `recorte-antigo/`, B5 e B6), `bibliografia/`, `docs/`, `_instrucoes/`, `_src/` (scripts por bloco; `_src/dicionario.md` com as convenções de nomes; o atalho `_src/_shared`, `_src/site-apresentacao/` e `_src/app-observacao/`, app Android da contagem), `dados/` (uma pasta por bloco, com os processados na raiz e os brutos em `dados-brutos/`). Visão geral do pipeline no [README.md](README.md).
- Prazos: `textos/planejamento/cronograma_luderia.md`, a única fonte do cronograma (o `.docx` é gerado por `_src/gerar_docx_cronograma.js` e não é versionado). Situação de cada capítulo: `textos/planejamento/status_capitulos.md`. Versão final para a banca em 16/11/2026.
- Decisões tomadas: `docs/decisoes.md`. Dúvidas, ideias futuras, decisões a tomar e divergências abertas: `docs/pendencias.md`.
- `arquivados/introducao_tcc_luderia.md` e `arquivados/metodologia_tcc_luderia.md` são do **desenho anterior** (pesquisa de mercado, hipóteses H1–H9): servem de insumo; hipóteses e testes vão para apêndice, salvo quando sustentam decisão do plano.
- Pipeline: `_src/[Bn] Fonte/` → `dados/[Bn] Nome/dados-brutos/` → `dados/[Bn] Nome/`. Cada `_src/[Bn] Fonte/` tem `collect/`, `build/`, `analise/`, `webscripts/`, `logs/` e `outros/` (auxiliares). Scripts `Bn-<c|b|a>_<conteúdo>.py` (`c` collect → `b` build → `a` analise), saídas `Bn_<conteúdo>`; cada script define `ROOT = Path(__file__).resolve().parents[3]`, roda de qualquer diretório e grava log em `logs/` (`_src/log_execucao.py`). Convenções de nomes, atuais e passadas: `_src/dicionario.md`. Detalhes em `_instrucoes/4_metodologia.md`. Blocos, em ordem de relevância:
  - **B1** — concorrentes com mais de 100 avaliações nas 14 metrópoles da REGIC (IBGE) e seus cardápios → concorrência, preço, ticket.
  - **B2** — avaliações com texto publicadas até "3 meses atrás", inclusive (rótulo do Google Maps na data da coleta) → proposta de valor, reclamações, ticket, fluxo.
  - **B3** — contagem direta nas duas unidades da São Jogue (Salvador), com leitura da NFC-e → ocupação, giro, calibração.
  - **B4** — bases públicas (IBGE, Novo CAGED, FipeZap, Simples Nacional, BCB, CONCLA) → demanda, custos, tributos, taxa de desconto. Subpastas por uso (`mercado_demanda`, `ponto_operacoes`, `juridico_tributario`, `financeiro`, `multiuso`) definidas em `USOS` no `bases_comum.py`.
  - **B6** — histórico dos avaliadores; retirado em 18/09/2026 (`arquivados/B6-avaliadores/`).
  - Subpastas dentro de `dados/[Bn]…/` e `dados/[Bn]…/dados-brutos/`: minúsculas, sem acento, com `_` (ex.: `cardapios/`, `acervo_jogos/`, `redes_sociais/analise_legendas/`).

## Versionamento

- **Um commit por sessão de trabalho**, com push, sem pedir confirmação (`origin`, branch atual): ao concluir o que o autor pediu na sessão, não a cada arquivo. Se a sessão tratar de assuntos sem relação entre si, um commit por assunto. Mensagem em português no formato "o que avançou no TCC" (ex.: "B2: 12 luderias coletadas e cobertura atualizada"), seguida do porquê.
- Antes do commit, conferir com `git status` se nada ignorado pelo `.gitignore` (dados brutos, `.env`, CAGED, zips) entrou por engano.
- Se o push falhar, informar o erro ao autor em vez de forçar (`--force`).

## Registro de alterações

Arquivo: [docs/registro-de-alteracoes.md](docs/registro-de-alteracoes.md) (formato no topo). Registros novos entram no fim, sob `## AAAA/MM/DD` (criado se não existir), com a hora (`### HH:mm`) tirada de `date`, no mesmo commit da mudança.

1. **TODA VEZ** que uma ação mudar qualquer arquivo do projeto **ou qualquer banco de dados do Notion**, registrar data, hora, **Objeto**, **Antes**, **Depois** e **Justificativa**.
2. **TODA VEZ** que aparecer informação divergente entre documentos ainda sem registro, registrar data, **Objeto**, **Antes** (arquivo mais antigo), **Depois** (mais recente) e **Efeitos colaterais**. Registrar a divergência não autoriza corrigi-la sem pedido do autor.

Exceção: as notas de estudo em `docs/notas/` (skill `/traduza` ou `==termo==`) não entram no registro; entram só no commit de fim de sessão.

## Fim de sessão

Antes do commit, atualizar:

1. [AGORA.md](AGORA.md): o que está em andamento, os próximos 3 passos e o que está bloqueado (no máximo uma tela).
2. `docs/decisoes.md`: uma linha no topo para cada decisão tomada na sessão.
3. `docs/pendencias.md`: dúvida, ideia ou decisão em aberto que surgiu; item resolvido sai.
4. `textos/planejamento/status_capitulos.md`, se algum capítulo mudou; checklist do cronograma, se alguma tarefa terminou.
5. Depois do commit, rodar `_src/sincronizar_vault.sh`: copia `docs/`, `textos/` e `bibliografia/` para o vault do Obsidian (só leitura no celular, sentido único).

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
