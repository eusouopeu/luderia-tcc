# AGORA

Atualizado em 15/10/2026. Semana 5 do cronograma (10/10 a 16/10). Próxima entrega: **16/10, coleta em estágio avançado**.

## Fazendo agora

- **Coleta do B2** (avaliações até "3 meses atrás"): completa para as 49 luderias do B1 que seguem no objeto (2.218 avaliações no recorte, 1.440 com texto) e para as 5 novas (Bardo Mago, La Tabuleria, TabuClub, Toca do Rato, Tubaleria). Notion "B - Comentários" com 1.628 linhas; Machado Games e Ilusões Industriais excluídas por não serem luderias.

- **Análise de conteúdo do B2** (15/10): refeita sobre as coletas (1.588 comentários de 53 casas, um arquivo por casa, até "3 meses atrás"), em `textos/instrumentos/analise_conteudo_bardin_B2.md`. Falta a recodificação cega da amostra de controle (131 ids em `B2_bardin_amostra_controle.csv`, textos em `_dados-brutos/analise_conteudo/B2_bardin_corpus.csv`).

- **Instagram, casas novas** (15/10): perfis de 8 casas (Bardo Mago, La Tabuleria, Tubaleria, Encounter, Toca do Rato, BoardZ, TabuClub, Luderia Carioca) guardados em `redes_sociais/rs_<cidade>/rs_<perfil>/`, ao lado dos posts.

- **Snowball do Instagram:** 11 listas coletadas (14-15/10), íntegras. O snowball saiu do coletor em 15/10 e virou um userscript próprio (`instagram_snowball.user.js`; instalar com `python3 _src/extras/gerar_carregadores.py --abrir`). Nele, "Coletar fila": colar `dados/[B1]…/redes_sociais/snowball/B1_snowball_proximas_sementes.txt` (41 casas) e deixar rodar; CSVs vão para `_dados-brutos/redes_sociais/seguindo/`. Classificar primeiro `_dados-brutos/redes_sociais/snowball/B1_snowball_candidatos_grau3.csv` (237 contas) e rodar `B1-b_instagram_seguindo.py`. Prioridade abaixo do B2.

- **Conferência de conceitos:** checklists em `bibliografia/leituras-P1/` (25 conceitos) e `leituras-P2/` (34), todos `[AV]`. Ao ler, trocar o `[AV]` da linha pela página; o vigia propaga. Situação em `bibliografia/relatorio-conceitos.md`. Alternativa nacional em `bibliografia/bibliografia-v2/` (15/10): 10 PDFs com página conferida e lista do que buscar na Minha Biblioteca da UFBA.

- **Entorno (Maps + OSM)** (`maps_entorno.user.js`, versão 2026.10.15-4): OSM recoletado em 15/10 (12h49) para as 54 casas, íntegro (somas e recontagens batem em 54/54, polígonos com área). Incompleto no VLT/BRT: o Maps zera Curitiba e Brasília, e o OSM contava plataformas de cada sentido e o bonde de Santa Teresa. Coletor corrigido; falta "Refazer pendentes" no Maps (6 casas de Curitiba) e exportar tudo. Parecer em `docs/parecer_entorno_B1.md` §7. O entorno ainda não sustenta decisão do plano.

- **Auditoria da coleta** (15/10): amostras sorteadas por script (`*-a_auditoria_*.py`, semente 20261015) em `_dados-brutos/<pasta>/auditoria/` de cada bloco: estabelecimentos, entorno, Instagram, cardápios, acervos, B2 e B4. Roteiro do entorno em `textos/instrumentos/roteiro_auditoria_entorno_B1.md`. Falta conferir e escrever o script que calcula a taxa de erro.

- **Cap. 5 (análise de mercado):** esboço em 15/10 (`textos/capitulos/5_analise_de_mercado.md`), do nacional para Salvador, com B4 e B1; 5.2 provisória até o Bardin. Lacunas em `docs/pendencias.md`, item 9.

- **Cap. 2 (referencial teórico):** rascunho pronto em 15/10 (`textos/capitulos/2_referencial_teorico.md`, 8,3/10 páginas). Falta conferir edição e página dos livros `[AV]` na Minha Biblioteca da UFBA (`bibliografia/bibliografia-v2/procurar-manualmente.md`).

- **Estatística descritiva do B1** (15/10): geral, por metrópole e por região em `dados/[B1]…/estabelecimentos/4_estatistica_descritiva/` e nas abas 08 a 10 do site (`_src/site-apresentacao`, publicado em 15/10; publicar de novo com `pnpm run deploy` quando os dados mudarem). Rodar de novo `B1-a_estatistica_descritiva.py` depois de cada atualização do `B1_resumo_estabelecimentos.xlsx`.

- **Status da coleta no Notion** ("Luderias – Status da coleta", 15/10): 54 casas com status por fonte e, em cada linha, o que falta e como fechar. Horários (54 casas) e cardápios de 27 casas consolidados em 15/10. Lacunas que restam: acervo sem lista (25), porte de shopping no entorno (22) e Instagram (18 casas parciais ou sem coleta).

## Próximos 3 passos

1. Corrigir a triagem do B1 (tirar Machado e Ilusões, incluir as 5 novas) e rodar de novo `B2-b_avaliacoes.py`, para a base do B2 bater com o Notion.
2. Preparar as visitas de retorno de **domingo, 18/10** (app de observação e `textos/instrumentos/roteiro_observacao_sao_jogue.md`).
3. Escrever o rascunho do cap. 3 (metodologia), o mais atrasado e com as instruções prontas.

## Bloqueado ou aguardando

- Coleta do B2 no navegador: os carregadores do Tampermonkey apontam para a pasta antiga `_src/Web scripts/`. Antes da próxima coleta, rodar `python3 _src/extras/gerar_carregadores.py --abrir --todos` e instalar os cinco no Vivaldi.
- Validação do dicionário e cap. 5.2: aguardam a recodificação cega da amostra do Bardin (§2 do instrumento).
- Estimativa de ocupação e fluxo (B3): aguarda as visitas de retorno (18/10).
- Rascunhos atrasados frente ao cronograma: caps. 3 e 8 (o cap. 5 tem esboço, com lacunas) ([status](textos/planejamento/status_capitulos.md)).

## Onde está o resto

| Preciso de… | Arquivo |
|---|---|
| Divergências entre capítulos e cortes possíveis | [docs/melhorias-texto.md](docs/melhorias-texto.md) |
| Prazos e checklist por semana | [textos/planejamento/cronograma_luderia.md](textos/planejamento/cronograma_luderia.md) |
| Situação de cada capítulo | [textos/planejamento/status_capitulos.md](textos/planejamento/status_capitulos.md) |
| O que já foi decidido | [docs/decisoes.md](docs/decisoes.md) |
| Dúvidas, ideias e decisões a tomar | [docs/pendencias.md](docs/pendencias.md) |
| Que arquivo abrir para cada tarefa | [README.md](README.md), "Por onde começar" |
