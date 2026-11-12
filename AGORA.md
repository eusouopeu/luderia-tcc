# AGORA

Atualizado em 12/11/2026. **TMin v32** com as taxas de entrada achadas na busca de 11/11 (texto e apêndices num só PDF, 115 páginas, com folha de aprovação). Versão final para a banca em 16/11. Escopo congelado até a banca: só entra o que muda o TMin (`CLAUDE.md`, "Fluxo de trabalho até a banca").

## Fazendo agora (no máximo duas frentes)

1. **Novo desenho da etapa 1** (12/11, nos `.md`; `.docx` e PDF não regerados): 3 empregados e o sócio, de terça a sábado (45 h); ponto na Pituba de 150 a 200 m², com área para 8 mesas (aluguel médio dos anúncios, R$ 11,6 mil + 11,8%); etapa de mesas com gatilho de 85% e custo completo no Monte Carlo. Provável: investimento de R$ 382 mil, equilíbrio de R$ 49,7 mil, VPL de R$ 349 mil (R$ 72 mil sem residual), TIR de 36,3% (21,1% sem residual), payback de 4,1 anos, P(VPL > 0) de 68,2%. Ruptura da circulação em 5,70 (11% abaixo do provável). O modelo já usa a taxa de R$ 19,65 (31 casas) do B1 de 12/11 (D83).
2. **Fechamento para a banca:** citações `[AV]` (Portaria MTP n. 671/2021, LOUOS, convenção SHRBS × Sindbares, livros) e ajustes de formatação para ganhar páginas (teto agora de 120).

## Próximos 3 passos

1. Responder L31 (taxa pela mediana, dia útil pelos histogramas, circulação da Paralela e 130 m², pedidos em 12/11 e fora do desenho atual), L29 (segundo cozinheiro e domingo junto da etapa de mesas) e L30 (casas comerciais na média do aluguel: só lojas leva o VPL sem residual a −R$ 22 mil); L28 (demanda calibrada pelo índice "Horários de pico", calculada sobre o desenho anterior: 11,75 pessoas/h na hora mais cheia, 1.368 a 1.550 pessoas/mês; o 3.4 e o Quadro 3.4 já trazem a premissa de proporção entre índice e ocupação, D82) e L20 a L24 no "Lote de decisões" ([pendências](docs/pendencias.md)): circulação provável pela média ou pela mediana; valores da verba I10 (estimados pelo Claude); nomes da banca na folha de aprovação; R05 diante do histograma da São Jogue (dia útil com 94,1% do fim de semana) e dos histogramas de fluxo dos 46 concorrentes por dia × hora, só com as casas abertas (pico no sábado às 20h: média 83%, mediana 92% da hora mais cheia; terça a quinta às 20h, 44% a 53%; planilha `5_graficos/Histogramas.xlsx` com taxas, funcionamento, cestas, acervos e jogos frequentes); L27 (taxa de entrada com as 3 casas novas que cobram: R$ 19,62 → R$ 19,48; a 60 Minutos cobra por hora, convertida para 3 h). Busca do B1 sem paginação (L24): população de 63 casas desde 12/11 (6 da repaginação e 3 de Campinas, aceita como 15ª metrópole); os 4 inconclusivos foram descartados pelo autor; das 9 casas novas, só Metropoly Bar (R$ 77,80) e Covil SBC (R$ 57,00) têm cesta; faltam Instagram, entorno, horários de pico e a renda da RM de Campinas no B4.
2. Conferir as citações `[AV]` e trocar por citação indireta as conferidas.
3. Ganhos de página só com formatação (116 páginas, dentro do novo teto de 120): referências em espaço simples e fins de capítulo com poucas linhas (melhoria D66).

## Bloqueado ou aguardando

- Quantidades do investimento (N6): aguardam projeto do ponto na Pituba.
- Folha de aprovação: aguarda os nomes dos membros da banca.
- Aluguel (C04 e C05): coleta de 12/11 (OLX, ZAP e Viva Real), limitada a Pituba, Itaigara e Graça, processada pelo build (184 anúncios); lojas de 100 m² ou mais em Pituba, Itaigara e Graça: 150 anúncios, mediana de R$ 47,10/m² (Pituba R$ 48,30 com 117; Itaigara R$ 45,70 com 20; Graça R$ 35,60 com 13). Entra na C04 e na escolha do bairro só depois da L13; falta conferir à mão as 63 "Possíveis Duplicatas". Nova coleta: "Montar buscas" no painel do userscript 2026.11.12-3 (bairros, área mínima e máxima, tipo e portal).
- Horários de pico dos concorrentes: coletor 2026.11.12-2 grava no Tampermonkey (a cota do localStorage travava a coleta perto de 35 casas; Ludus Luderia não gravou) e tem seletor com as 63 casas do B1 (Campinas incluída) e "Próximo". Falta reinstalar, coletar as que faltam, baixar o CSV e rodar `B1-a_horarios_pico.py`.
- Webscripts com menu de alvos (12/11, padrão do coletor de preços: seletor marcado como coletado, abre e coleta ao escolher, "Próximo", "Coletado/Desfazer"): avaliações (63 casas), entorno (lista carregada), Instagram (60 perfis), snowball (52 sementes), aluguel (buscas da fila) e cardápios (9 cardápios digitais; o script passou a ter `@grant`). Falta reinstalar no Tampermonkey e conferir em uso: não foram testados nos sites.

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
