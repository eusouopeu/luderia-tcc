# AGORA

Atualizado em 15/10/2026. Semana 5 do cronograma (10/10 a 16/10). Próxima entrega: **16/10, coleta em estágio avançado**.

## Fazendo agora

- **Coleta do B2** (avaliações até "3 meses atrás"): completa para as 49 luderias do B1 que seguem no objeto (2.218 avaliações no recorte, 1.440 com texto) e para as 5 novas (Bardo Mago, La Tabuleria, TabuClub, Toca do Rato, Tubaleria). Notion "B - Comentários" com 1.628 linhas; Machado Games e Ilusões Industriais excluídas por não serem luderias.

- **Snowball do Instagram (pronto para coletar):** coletor 2026.10.14-1 captura a lista "seguindo" (bloco "Snowball" do painel). Salvar os CSV em `dados/[B1]…/_dados-brutos/redes_sociais/seguindo/`, rodar `B1-b_instagram_seguindo.py`, classificar `B1_snowball_candidatos.csv` e rodar `B1-a_instagram_snowball.py`. Prioridade abaixo do B2.

- **Conferência de conceitos:** checklists em `bibliografia/leituras-P1/` (25 conceitos) e `leituras-P2/` (34), todos `[AV]`. Ao ler, trocar o `[AV]` da linha pela página; o vigia propaga. Situação em `bibliografia/relatorio-conceitos.md`.

- **Entorno no Maps** (`_src/[B1]…/Google Places (Negócios)/webscripts/maps_entorno.user.js`, versão 2026.10.14-2): busca de trem, buscas dispensadas onde o sistema não existe, estação mais próxima e nome de arquivo com data e estabelecimento. Fila das 51 casas em `entorno/B1_entorno_maps_fila.csv`; reinstalar o carregador (`python3 _src/extras/gerar_carregadores.py --abrir`) e rodar a fila.

## Próximos 3 passos

1. Corrigir a triagem do B1 (tirar Machado e Ilusões, incluir as 5 novas) e rodar de novo `B2-b_avaliacoes.py`, para a base do B2 bater com o Notion.
2. Preparar as visitas de retorno de **domingo, 18/10** (app de observação e `textos/instrumentos/roteiro_observacao_sao_jogue.md`).
3. Escrever o rascunho do cap. 3 (metodologia), o mais atrasado e com as instruções prontas.

## Bloqueado ou aguardando

- Coleta do B2 no navegador: os carregadores do Tampermonkey apontam para a pasta antiga `_src/Web scripts/`. Antes da próxima coleta, rodar `python3 _src/extras/gerar_carregadores.py --abrir --todos` e instalar os cinco no Vivaldi.
- Validação do dicionário e cap. 5.2: aguardam a base do B2 completa.
- Estimativa de ocupação e fluxo (B3): aguarda as visitas de retorno (18/10).
- Rascunhos atrasados frente ao cronograma: caps. 2, 3 e 8 e seções 5.1, 5.4 e 5.5 ([status](textos/planejamento/status_capitulos.md)).

## Onde está o resto

| Preciso de… | Arquivo |
|---|---|
| Prazos e checklist por semana | [textos/planejamento/cronograma_luderia.md](textos/planejamento/cronograma_luderia.md) |
| Situação de cada capítulo | [textos/planejamento/status_capitulos.md](textos/planejamento/status_capitulos.md) |
| O que já foi decidido | [docs/decisoes.md](docs/decisoes.md) |
| Dúvidas, ideias e decisões a tomar | [docs/pendencias.md](docs/pendencias.md) |
| Que arquivo abrir para cada tarefa | [README.md](README.md), "Por onde começar" |
