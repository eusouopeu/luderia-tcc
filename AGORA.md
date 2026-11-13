# AGORA

Atualizado em 13/11/2026. **TMin v33** em `textos/TCC_luderia_v33.docx` e `.pdf` (116 páginas; o nome não leva mais "TMin"), com os dados de 13/11: 63 luderias em 15 metrópoles (Campinas é a 15ª), taxa de entrada de R$ 19,65 (31 casas), 834 pessoas/mês, VPL de R$ 213 mil (R$ 5 mil sem residual), TIR de 28,9%, payback de 4,3 anos, P(VPL > 0) de 60,4% (P10 −R$ 410 mil, P90 R$ 1,45 milhão); rupturas: circulação 5,95 (7% abaixo), gasto R$ 72,77 (8%). Gráficos dos capítulos em `textos/graficos/` como `<cap>-<ordem>_<conteúdo>.png`; `textos/figuras/` só para diagramas e fotos. Planilhas `B<n>_dados_agregados.xlsx` (sem "DMax"); premissas do modelo em `textos/capitulos/modelo_financeiro/*.xlsx`, conferidas contra o modelo a cada execução. `_src/` com `outros/`, `pyScripts/` e `webScripts/`. Banca em 16/11. Escopo congelado: só entra o que muda o TMin.

## Fazendo agora (no máximo duas frentes)

1. **Revisão da v33 pelo autor:** conferir no PDF as Tabelas 4.1, 6.2 e 9.2 a 9.6 e o Quadro 10.2 (aluguel pessimista virou risco alto, D87).
2. **Fechamento para a banca:** citações `[AV]` e ajustes de formatação (teto de 120 páginas).

## Próximos 3 passos

1. Responder o "Lote de decisões" ([pendências](_docs/pendencias.md)): L1, L20 a L24, L27, L29, L30 e L32 (shopping no entorno).
2. Recoletar o entorno com o coletor 2026.11.13-2 e regerar os números do 5.4.2 e do 6.4 (a v33 usa a coleta de 12/11, que pode subcontar estações de metrô).
3. Conferir as citações `[AV]` e passar as conferidas para citação indireta.

## Bloqueado ou aguardando

- Quantidades do investimento (N6): projeto do ponto na Pituba.
- Folha de aprovação: nomes da banca.
- Legislação: a LOUOS de Salvador (Lei 9.148/2016) não tem texto integral em fonte oficial acessível; baixar à mão em `bibliografia/F1_Legislacao/4_funcionamento_e_pesquisa/`.
- Coletas do autor (aluguel, horários de pico, entorno, B2, webscripts): roteiros em [pendências](_docs/pendencias.md), "Coletas em andamento".
- Entorno: a coleta de 12/11 (39 casas) subconta estações de metrô (Maps devolveu ranking de 10 da cidade). Coletor 2026.11.13-2 (sem BRT nem estação tubo); recoletar com ele, no mínimo as casas do Rio, antes de usar o entorno no TMin.
- Webscripts (13/11): pastas renomeadas para `B1_estabelecimentos`, `B2_avaliacoes_recentes`, `B4_bases_publicas` e `B5_ativos_fixos`, e os carregadores apontam para elas; **reinstalar todos** no Tampermonkey (versões 2026.11.13, painéis 20% mais estreitos; pasta agora `_src/webScripts/`) (`python3 _src/outros/G5_outros/gerar_carregadores.py --abrir --todos`), senão os instalados procuram o caminho antigo e param; o coletor do Instagram coleta pela grade quando a API antiga falha (404 em 12/11); recoletar Cineplay, Fortalúdica, Bardo Mago e Comdado no período 01/07 a 01/11. Não muda o TMin até um acervo novo entrar no B1. Aluguel: reinstalar o `portais_aluguel` (2026.11.12-8, recarrega página vazia e retoma de onde parou) e refazer só OLX Pituba, ZAP Caminho das Árvores e Rio Vermelho, Viva Real e OLX Barra; o build usa só `data_coleta` 12/11 (há 296 linhas de 03/11 de Salvador inteira no CSV).

## Onde está o resto

| Preciso de… | Arquivo |
|---|---|
| O que mudou em cada arquivo | mensagens dos commits (`git log`); Notion e divergências em [_docs/registro-de-alteracoes.md](_docs/registro-de-alteracoes.md) |
| Divergências entre capítulos e cortes possíveis | [_docs/melhorias-texto.md](_docs/melhorias-texto.md) |
| Prazos e checklist por semana | [textos/_planejamento/cronograma_luderia.md](textos/_planejamento/cronograma_luderia.md) |
| Situação de cada capítulo | [textos/_planejamento/status_capitulos.md](textos/_planejamento/status_capitulos.md) |
| O que já foi decidido | [_docs/decisoes.md](_docs/decisoes.md) (até 31/10 em `_docs/_arquivo/`) |
| Decisões a tomar, tarefas para a banca e o que ficou para depois | [_docs/pendencias.md](_docs/pendencias.md) |
| Pareceres e análises avulsas | [_docs/pareceres/](_docs/pareceres/) |
| Modelo financeiro | `_src/outros/G3_modelo_financeiro/`; premissas fixas em `textos/capitulos/modelo_financeiro/premissas_autor.xlsx` |
| Que arquivo abrir para cada tarefa | [README.md](README.md), "Por onde começar" |
