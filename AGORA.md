# AGORA

Atualizado em 12/11/2026. **TMin v32** com as taxas de entrada achadas na busca de 11/11 (texto e apêndices num só PDF, 115 páginas, com folha de aprovação). Versão final para a banca em 16/11. Escopo congelado até a banca: só entra o que muda o TMin (`CLAUDE.md`, "Fluxo de trabalho até a banca").

## Fazendo agora (no máximo duas frentes)

1. **TMin v32 com as taxas da busca de 11/11** (12/11): taxa de entrada de R$ 19,62 (29 casas, antes R$ 18,68 em 22) e gasto por pessoa de R$ 77,86 (16 casas, antes R$ 78,68 em 13), sobre as correções da orientação do v31. Provável: investimento de R$ 329 mil, equilíbrio de R$ 51,9 mil, VPL de R$ 639 mil (R$ 220 mil sem residual), TIR de 53,7% (35,7% sem residual), payback de 3,2 anos, P(VPL > 0) de 78,2%. A ruptura da circulação (5,23) fica acima da mediana das visitas (L20).
2. **Fechamento para a banca:** citações `[AV]` (Portaria MTP n. 671/2021, LOUOS, convenção SHRBS × Sindbares, livros) e ajustes de formatação para ganhar páginas (teto agora de 120).

## Próximos 3 passos

1. Responder L20 a L24 no "Lote de decisões" ([pendências](docs/pendencias.md)): circulação provável pela média ou pela mediana; valores da verba I10 (estimados pelo Claude); nomes da banca na folha de aprovação; R05 diante do histograma da São Jogue (dia útil com 94,1% do fim de semana) e dos histogramas de fluxo dos 46 concorrentes por dia × hora, só com as casas abertas (pico no sábado às 20h: média 83%, mediana 92% da hora mais cheia; terça a quinta às 20h, 44% a 53%; planilha `5_graficos/Histogramas.xlsx` com taxas, funcionamento, cestas, acervos e jogos frequentes); busca do B1 sem paginação: 6 luderias novas entraram na população (54 → 60; Campinas, com 3 aprovadas, fica fora até a L24), 22 candidatos na rodada 2 de triagem; dos 236 da rodada 3, verificados pelo Claude, 233 não são luderias e 3 ficam para o autor decidir (Pixel Burger, Shepa Burger, Jardim; `B1_repaginacao_rodada3_verificacao.csv`); as novas seguem sem cardápio, Instagram, entorno, horários de pico e avaliações coletados.
2. Conferir as citações `[AV]` e trocar por citação indireta as conferidas.
3. Ganhos de página só com formatação (116 páginas, dentro do novo teto de 120): referências em espaço simples e fins de capítulo com poucas linhas (melhoria D66).

## Bloqueado ou aguardando

- Quantidades do investimento (N6): aguardam projeto do ponto na Pituba.
- Folha de aprovação: aguarda os nomes dos membros da banca.
- Aluguel (C04 e C05): coleta de 12/11 (OLX, ZAP e Viva Real), limitada a Pituba, Itaigara e Graça, processada pelo build (184 anúncios); lojas de 100 m² ou mais em Pituba, Itaigara e Graça: 150 anúncios, mediana de R$ 47,10/m² (Pituba R$ 48,30 com 117; Itaigara R$ 45,70 com 20; Graça R$ 35,60 com 13). Entra na C04 e na escolha do bairro só depois da L13; falta conferir à mão as 63 "Possíveis Duplicatas". Nova coleta: "Montar buscas" no painel do userscript 2026.11.12-3 (bairros, área mínima e máxima, tipo e portal).
- Horários de pico dos concorrentes: coletor 2026.11.12-1 grava no Tampermonkey (a cota do localStorage travava a coleta perto de 35 casas; Ludus Luderia não gravou) e tem seletor com as 54 casas do B1 e "Próximo". Falta reinstalar, coletar as que faltam, baixar o CSV e rodar `B1-a_horarios_pico.py`.

## Onde está o resto

| Preciso de… | Arquivo |
|---|---|
| O que mudou em cada arquivo | mensagens dos commits (`git log`); Notion e divergências em [docs/registro-de-alteracoes.md](docs/registro-de-alteracoes.md) |
| Divergências entre capítulos e cortes possíveis | [docs/melhorias-texto.md](docs/melhorias-texto.md) |
| Prazos e checklist por semana | [textos/planejamento/cronograma_luderia.md](textos/planejamento/cronograma_luderia.md) |
| Situação de cada capítulo | [textos/planejamento/status_capitulos.md](textos/planejamento/status_capitulos.md) |
| O que já foi decidido | [docs/decisoes.md](docs/decisoes.md) |
| Decisões a tomar, tarefas para a banca e o que ficou para depois | [docs/pendencias.md](docs/pendencias.md) |
| Que arquivo abrir para cada tarefa | [README.md](README.md), "Por onde começar" |
