# CLAUDE.md — TCC Luderia

TCC em formato **plano de negócios baseado em evidências** para uma luderia/ludobar/quiz-bar em **Salvador**. Cada decisão do plano é amarrada a um dado, e cada dado a uma fonte e a um grau de confiança (N1–N6).

## Mapa dos arquivos de instrução

Ler este arquivo e o [AGORA.md](AGORA.md) sempre; não carregar documentação ou arquivos grandes por padrão. **Arquivos grandes** (`_docs/decisoes.md`, `_docs/pendencias.md`, `_docs/melhorias-texto.md`, `_docs/_instrucoes/4_metodologia.md`, os registros em `_docs/_arquivo/` e os capítulos de `textos/capitulos/_md/`) nunca são abertos inteiros: buscar por termo, data ou ID (`grep -n`) e ler só o trecho (`offset`/`limit`). Estrutura da documentação segue `../_shared/docs-standards.md`. Ler os demais sob demanda, conforme a tarefa (roteiro por tarefa no [README.md](README.md), "Por onde começar"). A numeração é a ordem de leitura, não o número do capítulo.

| Arquivo | Quando ler |
|---|---|
| [_docs/_instrucoes/1_estrutura.md](_docs/_instrucoes/1_estrutura.md) | Visão do todo; tarefa com mais de um capítulo; caps. 1, 4 e 11 (sem arquivo próprio); teto de páginas |
| [_docs/_instrucoes/1a_principios.md](_docs/_instrucoes/1a_principios.md) | Hierarquias de fontes, dados e focos (P1 a P3); precedência dos caps. 6 e 8; personalização da estrutura (P4); desenho enxuto, MVP (P7) |
| [_docs/_instrucoes/1b_escrita.md](_docs/_instrucoes/1b_escrita.md) | Qualquer prosa do TCC: regras de escrita (P5) e vocabulário controlado (P6) |
| [_docs/_instrucoes/1c_versoes.md](_docs/_instrucoes/1c_versoes.md) | TMin, DMax/DMin, numeração `_v<n>` e `_arquivo/`; `.md` como fonte única do texto |
| [_docs/_instrucoes/1d_formatacao.md](_docs/_instrucoes/1d_formatacao.md) | Gerar ou revisar `.docx` e `.pdf` (suplementar à skill `formatacao-texto-ufba`) |
| [_docs/_instrucoes/2_ref-teorico.md](_docs/_instrucoes/2_ref-teorico.md) | Cap. 2 — escrita, citação, subcapítulos (lista de leitura em `bibliografia/_lista-de-leitura_TMin_v2.md`) |
| [_docs/_instrucoes/4_metodologia.md](_docs/_instrucoes/4_metodologia.md) | Cap. 3 — instrumentos de coleta, blocos de dados, matriz de evidências (protocolos de validação e auditoria em `textos/instrumentos/protocolo_validacao_coleta.md`, só para coleta ou auditoria) |
| [_docs/_instrucoes/3_mercado.md](_docs/_instrucoes/3_mercado.md) | Cap. 5 — análise de mercado |
| [_docs/_instrucoes/5_marketing.md](_docs/_instrucoes/5_marketing.md) | Cap. 6 — marketing e estimativa de demanda |
| [_docs/_instrucoes/7_operacional.md](_docs/_instrucoes/7_operacional.md) | Cap. 7 — plano operacional |
| [_docs/_instrucoes/6_juridico.md](_docs/_instrucoes/6_juridico.md) | Cap. 8 — aspectos jurídicos e legais |
| [_docs/_instrucoes/8_financeiro.md](_docs/_instrucoes/8_financeiro.md) | Cap. 9 — escala N1–N6, premissas, modelo financeiro, sensibilidade |
| [_docs/_instrucoes/9_anal-riscos.md](_docs/_instrucoes/9_anal-riscos.md) | Cap. 10 — análise estratégica e de riscos |
| [_docs/_instrucoes/10_biblio-apendices.md](_docs/_instrucoes/10_biblio-apendices.md) | Referências, apêndices, tabelas, quadros, figuras |

## Estado do projeto

- Pastas: `textos/` (`capitulos/`, `planejamento/`, `instrumentos/`), `arquivados/` (fora de uso, incluindo `recorte-antigo/`, o antigo B5 de jogos e o B6), `bibliografia/`, `_docs/`, `_docs/_instrucoes/`, `_src/` (scripts por bloco e objeto; `_src/Modelo financeiro/analise/` com o modelo do cap. 9, que lê as premissas fixas de `dados/modelo_financeiro/premissas_autor.csv`; `_src/Webscripts/` com os webscripts do Tampermonkey, uma pasta por bloco, mais os carregadores (`_carregadores/`, fora do git) e o kit dos painéis (`_kit_painel/`); `_src/Extras/` com utilitários gerais; `_src/dicionario.md` com as convenções de nomes; o atalho `_src/_shared`, `_src/Extras/App_Apresentacao/` e `_src/Extras/App_Observacao/`, app Android da contagem), `dados/` (uma pasta por coleta, `B<n>_<coleta>/`, cada uma com `_dados-brutos/`, `_auditoria/` e `_dados-agregados/`, e em cada uma destas um `_arquivo/` para as versões anteriores; mais `dados_agregados/` e `modelo_financeiro/`). Visão geral do pipeline no [README.md](README.md).
- Prazos: `textos/planejamento/cronograma_luderia.md`, a única fonte do cronograma (o `.docx` é gerado por `_src/Extras/Gerar_textos/gerar_docx_cronograma.js` e não é versionado). Situação de cada capítulo: `textos/planejamento/status_capitulos.md`. Versão final para a banca em 16/11/2026.
- Decisões tomadas: `_docs/decisoes.md` (até 31/10/2026 em `_docs/_arquivo/`). Pareceres e análises avulsas: `_docs/pareceres/`. Dúvidas, ideias futuras, decisões a tomar e divergências abertas: `_docs/pendencias.md`.
- `arquivados/introducao_tcc_luderia.md` e `arquivados/metodologia_tcc_luderia.md` são do **desenho anterior** (pesquisa de mercado, hipóteses H1–H9): como todo o `arquivados/`, só são lidos com pedido explícito do autor (ver "Só a versão atual", em Princípios); hipóteses e testes vão para apêndice, salvo quando sustentam decisão do plano.
- Pipeline: `_src/[Bn] Nome/<Objeto>/` → `dados/B<n>_<coleta>/_dados-brutos/` → `dados/B<n>_<coleta>/_dados-agregados/` (amostras de conferência em `_auditoria/`). Coletas: B1 `estabelecimentos`, `entorno`, `cardapios`, `acervo_jogos`, `redes_sociais`; B2 `avaliacoes`; B3 `contagem`; B4 uma por uso (ver abaixo); B5 uma por categoria. Dentro de cada bloco de `_src/`, uma pasta por objeto (ex.: `Google Places (Negócios)`, `Instagram`), cada uma com `collect/`, `build/`, `analise/`, `logs/` e `outros/` (auxiliares); os webscripts ficam em `_src/Webscripts/[Bn] Nome/`. Scripts `Bn-<c|b|a>_<conteúdo>.py` (`c` collect → `b` build → `a` analise), saídas `Bn_<conteúdo>`; cada script define `ROOT = Path(__file__).resolve().parents[4]`, roda de qualquer diretório e grava log em `logs/` (`_src/Extras/Gerar_outros/log_execucao.py`). Convenções de nomes, atuais e passadas: `_src/dicionario.md`. Detalhes em `_docs/_instrucoes/4_metodologia.md`. Blocos, em ordem de relevância:
  - **B1** — concorrentes com mais de 100 avaliações nas 14 metrópoles da REGIC (IBGE) e seus cardápios → concorrência, preço, ticket.
  - **B2** — avaliações com texto publicadas até "3 meses atrás", inclusive (rótulo do Google Maps na data da coleta) → proposta de valor, reclamações, ticket, fluxo.
  - **B3** — contagem direta nas duas unidades da São Jogue (Salvador), com leitura da NFC-e → ocupação, giro, calibração.
  - **B4** — bases públicas (IBGE, Novo CAGED, FipeZap, Simples Nacional, BCB, CONCLA) → demanda, custos, tributos, taxa de desconto. Uma coleta por uso (`B4_mercado_demanda`, `B4_ponto_operacoes`, `B4_juridico_tributario`, `B4_financeiro`, `B4_multiuso`), definida em `USOS` no `bases_comum.py`; os brutos de cada fonte ficam no uso dado por `FONTE_USO` (fonte de mais de um uso, em `B4_multiuso`).
  - **B5** — ativos fixos: orçamentos de obra, aluguel, mobiliário, cozinha e bar, equipamentos e jogos, coletados em sites e e-commerces → investimento inicial (9.3), aluguel e condomínio (C04 e C05). Uma coleta por categoria (`B5_aluguel`, `B5_obra_reforma`, `B5_orcamento` etc.). O código B5 já foi do bloco de jogos da Ludopedia, retirado (`arquivados/B5-jogos/`).
  - **B6** — histórico dos avaliadores; retirado em 18/09/2026 (`arquivados/B6-avaliadores/`).
  - Pastas de coleta e subpastas dentro delas: minúsculas, sem acento, com `_` (ex.: `B1_acervo_jogos/`, `_dados-agregados/analise_legendas/`).

## Versionamento

- **Um commit por sessão de trabalho**, com push, sem pedir confirmação (`origin`, branch atual): ao concluir o que o autor pediu na sessão, não a cada arquivo. Se a sessão tratar de assuntos sem relação entre si, um commit por assunto. Mensagem em português no formato "o que avançou no TCC" (ex.: "B2: 12 luderias coletadas e cobertura atualizada"), seguida do porquê.
- Antes do commit, conferir com `git status` se nada ignorado pelo `.gitignore` (dados brutos, `.env`, CAGED, zips) entrou por engano.
- Se o push falhar, informar o erro ao autor em vez de forçar (`--force`).

## Registro de alterações

Arquivo: [_docs/registro-de-alteracoes.md](_docs/registro-de-alteracoes.md) (formato no topo), só para o que o git não guarda. Entradas no fim, sob `## AAAA/MM/DD`, com a hora (`### HH:mm`) tirada de `date`, no mesmo commit da mudança.

1. Mudança em **banco de dados do Notion**: data, hora, **Objeto**, **Antes**, **Depois** e **Justificativa**.
2. **Informação divergente entre documentos** ainda sem registro: data, **Objeto**, **Antes** (arquivo mais antigo), **Depois** (mais recente) e **Efeitos colaterais**. Registrar a divergência não autoriza corrigi-la sem pedido do autor.

Mudança em arquivo do projeto não entra no registro: fica na mensagem do commit.

## Melhorias do texto

**TODA VEZ** que um capítulo for gerado, ou que o autor implementar ou pedir aprimoramento de um capítulo já escrito, analisar esse capítulo junto com os demais de `textos/capitulos/_md/` (e as regras de `_docs/_instrucoes/`) e atualizar [_docs/melhorias-texto.md](_docs/melhorias-texto.md), no mesmo commit:

- **# Divergências** (`## Grave`, `## Média`, `## Aceitável`): informações, citações ou uso de técnicas, modelos e métodos que divergem entre capítulos ou contra as instruções.
- **# Cortes em potencial** (`## Alto ganho`, `## Médio ganho`, `## Baixo ganho`): trechos que podem sair sem perder qualidade, profundidade ou clareza (repetidos em vários pontos, ou que perderam importância no todo do trabalho).

Item resolvido sai do arquivo. Listar uma divergência não autoriza corrigi-la no capítulo sem pedido do autor.

## Fluxo de trabalho até a banca

- **Escopo congelado:** só entra trabalho que muda número, texto ou decisão do TMin. Coleta, auditoria, site e recoleta que não mudam o TMin vão para "Depois da banca", em `_docs/pendencias.md`.
- **No máximo duas frentes** em "Fazendo agora" no AGORA.md. Frente nova só entra quando uma sai.
- **Decisões do autor em lote:** toda decisão que depende do autor entra como pergunta fechada (opções e recomendação) em "Lote de decisões", no topo de `_docs/pendencias.md`, e não é perguntada de novo a cada sessão.
- **Pendência sem solução possível** (ex.: dado do B3 que só uma nova visita traria) vira limitação no texto (3.6) e sai das pendências.
- **Gatilho por entrega:** pré-textuais, apêndices e PDF só são regerados no fechamento de uma versão para a orientação, não a cada ajuste.

## Formato das respostas

Abrir pelo efeito no plano: que decisão, premissa ou número do TMin muda; depois, os capítulos a ajustar (alerta da P3 quando mudar o cap. 6 ou o 8) e o que ficou sem verificar. Não relatar o passo a passo do que foi feito.

## Fim de sessão

1. **Sempre:** atualizar o [AGORA.md](AGORA.md) (no máximo duas frentes, os próximos 3 passos e o que está bloqueado, em uma tela) e fazer o commit com push. O hook `post-commit` do git roda `_src/Extras/Gerar_outros/sincronizar_vault.sh` sozinho (cópia de `_docs/`, `textos/` e `bibliografia/` para o vault do Obsidian, sentido único).
2. **Só quando houver o que registrar:** `_docs/decisoes.md` (uma linha no topo por decisão tomada), `_docs/pendencias.md` (item novo ou resolvido) e `textos/planejamento/status_capitulos.md` (capítulo que mudou de estado) e o checklist do cronograma (tarefa concluída).

## Princípios

- **Escrita:** skill `meu-estilo-escrita` para qualquer prosa do TCC, mais as regras de escrita e o vocabulário controlado de `_docs/_instrucoes/1b_escrita.md` (P5 e P6).
- **Extensão:** no máximo 120 páginas, com teto por capítulo em `_docs/_instrucoes/1_estrutura.md`. Testes de hipótese H1–H9 são extra, só se sobrar tempo; o Monte Carlo está no Apêndice G.
- **Tabela agregada fecha com o total.** Cada unidade (place_id, avaliação, jogo) conta em **um único grupo**, atribuído por atributo próprio (ex.: UF do endereço), nunca pelo contexto da coleta. Antes de entregar, somar as linhas e comparar com o total (diferença zero); vale também ao rodar de novo um script existente. Contagem não exclusiva por desenho fica declarada no nome da coluna e na docstring, sem total como soma.
- **Mudança na população propaga:** ao incluir ou retirar um estabelecimento da população (B1), ou gravar valor novo numa variável de um estabelecimento (taxa, cesta, horário, acervo, fluxo etc.), localizar sem esperar pedido as tabelas, gráficos e planilhas que usam esse dado (scripts que leem o arquivo alterado, as saídas deles e as dos scripts que dependem delas, como `Histogramas.xlsx` e os `5_graficos/`), rodá-los de novo, conferir os totais e incluir tudo no mesmo commit. Os valores que dependem da população (taxa de entrada média e mediana, a mais barata e a mais cara por casa, horários de funcionamento e fluxo por dia e hora, cesta de consumo, gasto por pessoa, acervo, contagens de casas) são atualizados também no texto dos capítulos, nas tabelas, nos apêndices e na planilha do modelo (`gerar_modelo_financeiro.py`), sem esperar pedido nem passar pelo "Lote de decisões" (decisão do autor, 12/11/2026); a resposta lista os números que mudaram e os capítulos tocados. Só vai ao lote o que muda o parecer de viabilidade ou uma decisão de desenho do plano.
- **Precedência dos caps. 6 e 8:** em divergência entre capítulos, valem o Plano de Marketing (cap. 6) e os Aspectos Jurídicos (cap. 8), que moldam o negócio; os demais (7, 9 e os que dependem deles) só o tornam viável. Toda mudança nos caps. 6 ou 8 gera alerta imediato ao autor sobre os capítulos a ajustar. Detalhes em `_docs/_instrucoes/1a_principios.md` (P3).
- **Decisão antes de descrição:** todo resultado responde "que decisão do plano isso muda?". Se nenhuma, vai para apêndice ou sai.
- **Nada de número sem fonte** (instituição, base, recorte, data). **Nada de referência inventada:** obra não conferida ou citação com página a conferir fica `[AV]` (a verificar), em vermelho e em citação direta até o autor conferir; o ciclo (vermelho → preto = conferida → citação indireta) está em `_docs/_instrucoes/10_biblio-apendices.md`.
- **Desenho enxuto (MVP):** o plano projeta uma versão menor que a São Jogue (6 mesas, num ponto na Pituba de 150 a 200 m² que já comporta 8; terça a sábado das 14h às 23h, 45 h por semana; 1 cozinheiro-chefe e 2 instrutores, 40 h por semana, e o sócio na gestão, no caixa e no salão; benefícios além dos obrigatórios: refeição no local e PLR de 5% do EBITDA; a etapa de mesas soma 2 mesas, um instrutor, o segundo cozinheiro e o domingo), para reduzir o risco de giro, ocupação e horário fora do pico; a São Jogue é referência de comportamento, não de porte. Detalhes em `_docs/_instrucoes/1a_principios.md` (P7).
- **Incerteza declarada:** estimativas com faixa (pessimista/provável/otimista) e nível de evidência.
- **Sem questionários** de opinião ou intenção; preferir fontes secundárias e primárias comportamentais.
- **Normas:** ABNT (detalhes em `_docs/_instrucoes/10_biblio-apendices.md`). Instituição: UFBA.
- **Idioma:** português do Brasil no texto, nos comentários do código e nos nomes de arquivos de saída.
- **Só a versão atual como contexto:** ao buscar ou usar contexto, ler só a versão mais atual de cada arquivo (`.md`, `.pdf`, `.docx`, `.xlsx`, `.csv` etc.): a que está fora de `_arquivo/` e de `arquivados/`, com o maior `_v<n>` ou, quando a versão está na data e hora do nome (`AAAA-MM-DD_HHmm_…`), a mais recente. Versões anteriores, `_arquivo/`, `arquivados/` e o histórico do git só entram com pedido **explícito** do autor; não abrir nem citar para comparar, conferir ou completar. Não vale para coletas de datas diferentes que não substituem umas às outras (ex.: perfis distintos de rede social) nem muda a lógica dos scripts, que escolhem seus insumos sozinhos. Detalhes em `_docs/_instrucoes/1c_versoes.md`.
- **Versões:** o texto tem uma só versão, o TMin (`textos/capitulos/`, com os `.md` em `_md/`, fonte única do texto: o autor comenta no `.docx`, o Claude aplica no `.md` e regera, sem pares original/revisado com "*"); DMax e DMin para os dados agregados; `.docx` e `.pdf` numerados `_v<n>`, com as versões antigas em `_arquivo/`. Regras em `_docs/_instrucoes/1c_versoes.md`. Apêndices do TMin num `.docx` separado, regerado e conferido a cada nova versão do principal (`_src/Extras/Gerar_textos/gerar_apendices_tmin.py`), e pré-textuais (listas e sumário) refeitos a cada versão (`gerar_pretextuais_tmin.py`; regras em `1c_versoes.md`). Formatação dos `.docx` e `.pdf`: skill `formatacao-texto-ufba` mais `_docs/_instrucoes/1d_formatacao.md`, que prevalece. Escolha de obras citadas: `_docs/_instrucoes/2_ref-teorico.md`, com prioridade para as obras da pasta `bibliografia/` e, para conceitos e fórmulas, várias citações de um mesmo livro-texto da área em vez de uma obra por conceito.
- **Pastas enxutas:** nenhuma pasta com mais de cerca de 10 itens soltos na raiz; ao criar arquivos ou pastas, agrupar em subpastas por etapa ou tema (ex.: amostragem, curadoria, aprovadas, cardápios, redes sociais).
- **Nome de arquivo de coleta de rede social:** `AAAA-MM-DD_<estabelecimento>_instagram_<perfis|posts>.csv`, em `dados/B1_redes_sociais/_dados-agregados/rs_<cidade>/rs_<perfil>/`; listas do snowball, `AAAA-MM-DD_<perfil>_instagram_seguindo.csv`, em `dados/B1_redes_sociais/_dados-brutos/seguindo/` (fora do git: trazem @ de pessoas físicas). Cardápios originais em `_dados-brutos/cardapios/ca_<cidade>/ca_<estabelecimento>/`. A cidade é a capital da região metropolitana do endereço. Demais convenções: `_src/dicionario.md`.
