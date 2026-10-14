# Decisões

Uma linha por decisão já tomada sobre o TCC, da mais recente para a mais antiga. Serve para consultar o que foi decidido sem garimpar o registro de alterações. Decisão nova entra no topo, com data e onde está detalhada; decisão ainda em aberto fica em [pendencias.md](pendencias.md).

| Data | Decisão | Detalhe em |
|---|---|---|
| 14/10/2026 | Marcador único `[AV]` (a verificar) no lugar de `[A VERIFICAR]`; citação de conceito com página a conferir leva `[AV-<ID>]`, ligado ao `checklist-conceitos.md` da leva | `_instrucoes/10_biblio-apendices.md` |
| 14/10/2026 | Um `checklist-conceitos.md` por leva de leitura (`bibliografia/leituras-Pn/`), versionado; vigia do launchd roda `_src/extras/conceitos/verificar_conceitos.py` a cada mudança e propaga as páginas conferidas | `bibliografia/leituras-P1/checklist-conceitos.md` |
| 14/10/2026 | Banco "B - Comentários" do Notion alimentado pelas coletas do userscript (só avaliações com texto no recorte), com a coluna "ID da avaliação" (`review_id`) como chave para não duplicar | `docs/registro-de-alteracoes.md`, 14/10 16:56 |
| 14/10/2026 | B1 sem arquivos soltos: saídas em `estabelecimentos/{1_busca,2_recorte,3_triagem}/` e `entorno/`, nomes com `metro`, `regio`, `f`, `av50`, `av100`; Instagram em `rs_<cidade>/rs_<perfil>/`, cardápios originais em `_dados-brutos/cardapios/ca_<cidade>/ca_<estabelecimento>/` (cidade = capital da RM) | `_src/dicionario.md` |
| 14/10/2026 | `_src/` espelha os blocos de `dados/`, com uma pasta por objeto (B4: uma por fonte, auxiliar em `Comum/`); utilitários em `_src/extras/`; brutos em `_dados-brutos/` | `_src/dicionario.md` |
| 14/10/2026 | Scripts por etapa em cada bloco de `_src/` (`collect/`, `build/`, `analise/`, `webscripts/`, `logs/`, `outros/`), nomes `Bn-<c\|b\|a>_<conteúdo>.py`, log automático fora do git e convenções de nomes e valores em `_src/dicionario.md` | `_src/dicionario.md` |
| 14/10/2026 | Dados numa pasta por bloco, `dados/[Bn] Nome/`, com os processados na raiz e os brutos em `dados-brutos/`; site e app de observação dentro de `_src/` | `CLAUDE.md`, "Estado do projeto" |
| 14/10/2026 | Skill de projeto `/traduza` (ou `==termo==`) gera notas de estudo em `docs/notas/`, fora do registro de alterações | `.claude/skills/traduza/SKILL.md` |
| 14/10/2026 | Documentação do projeto segue o padrão geral `../_shared/docs-standards.md`, derivado deste projeto e do rotinas; `AGENTS.md` é link para o `CLAUDE.md` | `CLAUDE.md` |
| 13/10/2026 | Público casual fora do objeto de pesquisa; retirado de instruções, introdução, projeto, cronograma, CLAUDE.md e README | `textos/capitulos/1_introducao_plano_luderia.md` |
| 13/10/2026 | Horários das visitas planejados para o pico de fluxo provável, não sorteados: em cada unidade, sábado com entrada às 19h e domingo com entrada às 18h, 15 dias depois. A contagem mede o pico; a média do dia vem das notas fiscais | `_instrucoes/4_metodologia.md`, Bloco B3 |
| 13/10/2026 | Cronograma num só arquivo (`textos/planejamento/cronograma_luderia.md`, com checklist por semana); o `.docx` é gerado na hora de enviar | `_src/gerar_docx_cronograma.js` |
| 13/10/2026 | Commit e push uma vez por sessão de trabalho, não a cada arquivo | `CLAUDE.md`, "Versionamento" |
| 13/10/2026 | Auditoria da coleta do B2: n = 200 avaliações, mínimo de 3 por estabelecimento, restante proporcional pelos maiores restos, chave aleatória com semente fixa | `_instrucoes/4_metodologia.md` §3.4; `docs/estatidez.md` |
| 13/10/2026 | Base única: sem divisão em parte exploratória e confirmatória; a exploração e a descrição usam todas as avaliações coletadas (orientação do orientador) | `_instrucoes/4_metodologia.md` §3.5 |
| 13/10/2026 | Recorte do B2: avaliações com texto até "3 meses atrás", inclusive (antes: "um mês atrás") | `_instrucoes/4_metodologia.md` §3.3 |
| 12/10/2026 | Teto de 90 páginas, com teto por capítulo | `_instrucoes/1_estrutura.md`, "Extensão" |
| 12/10/2026 | Testes de hipótese H1–H9 e Monte Carlo viram extras, só se sobrar tempo, em apêndice. O núcleo é validação, ponderação por estabelecimento, intervalo de confiança, premissas com faixa, três cenários, tornado e ponto de ruptura | `_instrucoes/4_metodologia.md`, "Escopo adotado" |
| 12/10/2026 | Bloco B5 (jogos da Ludopedia) arquivado; o acervo sai dos jogos citados nas avaliações (B2) e do acervo declarado dos concorrentes (B1) | `arquivados/B5-jogos/LEIAME.md` |
| 12/10/2026 | Blocos numerados B1 a B6, em ordem de relevância para o plano | `CLAUDE.md`, "Estado do projeto" |
| 09/10/2026 | O recorte "público casual" sai de vez: já é o público da maioria das luderias e deixa de ser diferencial. | `docs/bibliografia/diagnostico-teorico.md` §0 |
| 02/10/2026 | Projeto de pesquisa sem o recorte casual: a pergunta passa a ser a viabilidade de uma luderia em Salvador, sem segmentação de público | commit `61599fa` |
| 02/10/2026 | Primeiras visitas da contagem concentradas no sábado, 03/10, nas duas unidades; retornos no domingo, 18/10 | `_instrucoes/4_metodologia.md`, Bloco B3 |
| Semana 3 | Dois formulários de observação, um por gatilho e um por tempo, com perguntas de fluxo, ocupação, permanência e busca | `textos/planejamento/cronograma_luderia.md`, semana 3 |
| 18/09/2026 | Plano para Salvador; concorrentes com mais de 100 avaliações nas 14 metrópoles da REGIC servem de referência | `_instrucoes/4_metodologia.md`, "Escopo adotado" |
| 18/09/2026 | Bloco B6 (histórico dos avaliadores) retirado do escopo | `arquivados/B6-avaliadores/LEIAME.md` |
| 18/09/2026 | Modelo de alimentos e bebidas deixa de ser variável do B1 e vira premissa do autor no cap. 9 | `_instrucoes/4_metodologia.md`, "Escopo adotado" |
| 18/09/2026 | Emenda 2 ao registro prévio: saem H2 e H4; H1 passa a comparar atendimento e ambiente com comida e bebida | `textos/planejamento/registro_previo_luderia.md` |
| 14/09/2026 | Registro prévio das hipóteses, antes da coleta das avaliações | `textos/planejamento/registro_previo_luderia.md` |
| Até 14/09/2026 | Novo CAGED no lugar da RAIS vínculos: o salário de admissão mede o que um negócio novo paga ao contratar, e os microdados da RAIS 2024 somam 3,8 GB compactados | `bibliografia/referencias_bases_publicas.md` |
| Desde o início | Sem questionários de opinião ou intenção; fontes secundárias e uma coleta primária comportamental (contagem direta com NFC-e) | `CLAUDE.md`, "Princípios" |
