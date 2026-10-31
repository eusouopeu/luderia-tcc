# AGORA

Atualizado em 31/10/2026 (02h34). Semana 8 do cronograma (31/10 a 06/11). Próxima entrega: **06/11, versão completa**; versão final para a banca em 16/11.

## Fazendo agora

- **Capítulos:** rascunho nos caps. 1, 2, 3, 8 e 9; cap. 5 é esboço de 15/10; cap. 6 só com 6.3 e 6.4; caps. 4, 7, 10 e 11 sem arquivo ([status](textos/planejamento/status_capitulos.md)). O cap. 9 dá **inviável no provável** (VPL −R$ 479 mil; ruptura com 49,5% de ocupação no fim de semana).
- **Cardápios do B1** (PR #21, 30/10): "cesta" virou consumo por pessoa (bebida + prato, 33 casas, R$ 48,80) e cesta completa (com couvert encontrado, 8 casas, R$ 74,25). Instruções alinhadas em 31/10; caps. 3, 5, 6 e 9 ainda com números e nomes antigos (melhorias D29). A base do B1 está parada em 17/10.
- **B2:** 1.273 linhas codificadas por Claude em 30/10 e levadas ao Notion. Falta a recodificação cega do autor (139 linhas, `b2/notion_comentarios/2026-10-30_B2_amostra_recodificacao.csv`; o gabarito só depois).
- **B3:** quatro visitas feitas (10, 16, 17 e 30/10), ocupação do salão calculada sem a mesa do observador. App 2.5.0 no PR #19.
- **Branches:** `main` parou em 24/10; o Mac está em `fix/entorno-maps-distantes`. Esta revisão juntou a branch do Mac com os PRs #20 e #21.

## Próximos 3 passos

1. No Mac: rodar `B1-b_resumo.py` e `B1-a_estatistica_descritiva.py`, gerar de novo as planilhas e corrigir os números de cardápio nos caps. 3, 5, 6 e 9 (D28, D29, D31) e o CNAE do cap. 5 (D30).
2. Fazer a recodificação cega das 139 linhas e comparar com o gabarito; com isso, refazer o 5.2 e escrever 6.1, 6.2 e 6.5.
3. Escrever o cap. 7 (com o B3) e o cap. 10 (a partir do resultado inviável do cap. 9); depois, 4 e 11.

## Bloqueado ou aguardando

- Validação do dicionário do B2 e cap. 5.2: aguardam a recodificação cega do autor.
- Premissas N6 do cap. 9 (reforma, mobiliário, cozinha, ocupação de dia útil): aguardam cotações.
- Merge em `main`: PRs #19 a #22 abertos; o Mac deve voltar a `main` depois.
- Mac: 23 cópias de arquivos com nome em Unicode decomposto não rastreadas e uma edição não enviada no dicionário do B2 (pendências, divergências).

## Onde está o resto

| Preciso de… | Arquivo |
|---|---|
| Divergências entre capítulos e cortes possíveis | [docs/melhorias-texto.md](docs/melhorias-texto.md) |
| Prazos e checklist por semana | [textos/planejamento/cronograma_luderia.md](textos/planejamento/cronograma_luderia.md) |
| Situação de cada capítulo | [textos/planejamento/status_capitulos.md](textos/planejamento/status_capitulos.md) |
| O que já foi decidido | [docs/decisoes.md](docs/decisoes.md) |
| Dúvidas, ideias e decisões a tomar | [docs/pendencias.md](docs/pendencias.md) |
| Que arquivo abrir para cada tarefa | [README.md](README.md), "Por onde começar" |
| Histórico detalhado de cada frente | [docs/registro-de-alteracoes.md](docs/registro-de-alteracoes.md) |
