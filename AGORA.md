# AGORA

Atualizado em 13/11/2026. Pastas reorganizadas (sem efeito em números): B4 em `marketing`, `operacional`, `juridico`, `financeiro` e `multiuso`; B5 em `aluguel`, `reforma` e `mobiliario`; DMax, modelo financeiro, gráficos, quadros e figuras em `textos/planilhas/`, `textos/graficos/`, `textos/quadros/` e `textos/figuras/`; utilitários em `_src/Extras/G1_` a `G5_`; PDFs da bibliografia em `F1_` a `F5_`; `arquivados/` fora do repositório (`~/Documents/arquivados/`). **TMin v32** no PDF; os `.md` e o modelo já têm a demanda pelo índice "Horários de pico", a faixa do Monte Carlo na Tabela 9.4, o gasto da L31 e quatro limitações novas no Quadro 3.4 (`.docx`, PDF e apêndices não regerados). Banca em 16/11. Escopo congelado: só entra o que muda o TMin.

## Fazendo agora (no máximo duas frentes)

1. **Fechar a versão v33:** regerar `.docx`, PDF, apêndices (E, G e matriz do D já atualizada no gerador; trocar `DATA_MODELO`) e pré-textuais. Provável: 843 pessoas/mês, VPL de R$ 245 mil (R$ 21 mil sem residual), TIR de 30,7%, payback de 4,3 anos, P(VPL > 0) de 62,1% (P10 −R$ 403 mil, P90 R$ 1,5 milhão); rupturas: circulação 5,89 (8% abaixo), gasto R$ 71,91 (9%).
2. **Fechamento para a banca:** citações `[AV]` e ajustes de formatação (teto de 120 páginas).

## Próximos 3 passos

1. Regerar o TMin v33 e conferir as Tabelas 6.2, 9.2 a 9.6 e 4.1 no PDF.
2. Responder o "Lote de decisões" ([pendências](_docs/pendencias.md)): L1, L20 a L24, L27, L29, L30 e L31 (pedidos de 12/11 fora do desenho atual: taxa pela mediana, dia útil pelos histogramas, circulação da Paralela, 130 m²).
3. Conferir as citações `[AV]` e passar as conferidas para citação indireta.

## Bloqueado ou aguardando

- Quantidades do investimento (N6): projeto do ponto na Pituba.
- Folha de aprovação: nomes da banca.
- `B4-a_renda_rm.py` para: Campinas tem luderia no B1, mas a PNAD Contínua não tem a RM de Campinas; a Figura 5.x de renda por RM não regera até decidir (tirar Campinas da figura ou usar outra fonte).
- Coletas do autor (aluguel, horários de pico, entorno, B2, webscripts): roteiros em [pendências](_docs/pendencias.md), "Coletas em andamento".
- Entorno: a coleta de 12/11 (39 casas) subconta estações de metrô (Maps devolveu ranking de 10 da cidade). Coletor 2026.11.13-2 (sem BRT nem estação tubo); recoletar com ele, no mínimo as casas do Rio, antes de usar o entorno no TMin.
- Webscripts (13/11): os carregadores apontam agora para `_src/WebScripts/`; **reinstalar todos** no Tampermonkey (`python3 _src/Extras/G5_outros/gerar_carregadores.py --abrir --todos`), senão os instalados procuram o caminho antigo e param; o coletor do Instagram coleta pela grade quando a API antiga falha (404 em 12/11); recoletar Cineplay, Fortalúdica, Bardo Mago e Comdado no período 01/07 a 01/11. Não muda o TMin até um acervo novo entrar no B1. Aluguel: reinstalar o `portais_aluguel` (2026.11.12-8, recarrega página vazia e retoma de onde parou) e refazer só OLX Pituba, ZAP Caminho das Árvores e Rio Vermelho, Viva Real e OLX Barra; o build usa só `data_coleta` 12/11 (há 296 linhas de 03/11 de Salvador inteira no CSV).

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
| Modelo financeiro | `_src/Extras/G3_modelo_financeiro/`; premissas fixas em `dados/modelo_financeiro/premissas_autor.csv` |
| Que arquivo abrir para cada tarefa | [README.md](README.md), "Por onde começar" |
