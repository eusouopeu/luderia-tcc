# AGORA

Atualizado em 17/10/2026. Semana 5 do cronograma (10/10 a 16/10). Próxima entrega: **16/10, coleta em estágio avançado**.

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

- **Estatística descritiva do B1** (15/10): geral, por metrópole e por região em `dados/[B1]…/estabelecimentos/4_estatistica_descritiva/` e nas abas 08 a 10 do site (`_src/site-apresentacao`, publicado em 15/10; visual editorial novo publicado em 15/10; publicar de novo com `pnpm run deploy` quando os dados mudarem). Rodar de novo `B1-a_estatistica_descritiva.py` depois de cada atualização do `B1_resumo_estabelecimentos.xlsx`.

- **Cardápios, busca profunda** (16/10): planilha com 34 casas e 1.991 linhas (TabuClub transcrito; Fan Hour com preços de imprensa; LudoCafé, São Jogue, Game Of Boards, Garagem do Nerd, Joyjoy e Asgard parciais). Das 28 casas que faltavam, 16 são lojas sem A&B localizado; o que só abre no navegador (Goomer da São Jogue, iFood do GOB e outros 3) está em `cardapios/B1_cardapios_busca_profunda.csv`. Falta rodar no Mac `B1-b_resumo.py` e `B1-a_estatistica_descritiva.py`.

- **Contagem do B3, Bela Vista:** duas visitas consolidadas por `B3-b_importar_app.py` (originais em `_dados-brutos/app/originais/<visita>/POVn/`, correções com motivo em `outros/`). Sábado, 10/10 (só o POV1): 38 pessoas em 14 grupos (11,4 por hora), permanência de 99 min na porta e 116 min nas mesas. Sexta, 16/10 (extra, 19h15 às 22h): 10 pessoas em 4 grupos (4,0 por hora, POV2), permanência de 96 min em 3 grupos de mesa vistos do início ao fim; o POV1 só registrou grupos já sentados. NFC-e 77977 (10/10) e 78160 (16/10): 183 notas em 6 dias, 30,5 por dia. Dúvidas para os observadores em `docs/pendencias.md`.

- **App de observação 2.4.0** (16/10): CSVs com visita, observador e versão em todas as tabelas, entrada da porta ligada à mesa, motivo da saída rápida, "Fechamento da casa", posição e pausas do observador, condições do dia em lista, marcas de estimado e incerto e roteiro da visita no Temporizador. Em 2.4.1, a porta e a mesa se ligam nos dois sentidos (seção "Da porta" no grupo da mesa). APK `ObservacaoLuderia-2026.10.16-2.apk`: antes de instalar por cima, fazer backup em Ajustes (o APK da nuvem tem outra assinatura de depuração e pode exigir desinstalar). Antes de 18/10, preencher o código do observador em Ajustes de cada celular.

- **Status da coleta no Notion** ("Luderias – Status da coleta", 16/10): 54 casas recalculadas com o PR #10; em cada linha, o que falta e como fechar. Lacunas que restam: acervo sem lista (38), porte de shopping no entorno (25), VLT/BRT de Curitiba (6), cardápio parcial ou sem preço (13) e Instagram (Ludus, LudoCafé, Dominaria). Rodar `B1-b_resumo.py` para levar ao resumo os perfis de 15/10 das 5 casas novas.

- **Modelo financeiro v0** (15/10): `_src/Modelo financeiro/analise/financeiro-a_modelo.py` lê o registro de premissas (`dados/Modelo financeiro/financeiro_premissas.csv`, 53 linhas com faixa, fonte e nível) e grava `financeiro_modelo.xlsx` (indicadores, DRE e fluxo por cenário, tornado, ruptura, coerência, conferência das fontes). Provável: investimento de R$ 390 mil, VPL de R$ 465 mil, payback descontado de 30 meses. Premissas críticas: permanência, ocupação em dia útil e no fim de semana (só N6 até o B3), horas abertas e ticket de A&B. Rodar de novo depois de cada premissa trocada.

- **Cap. 8 (jurídico):** rascunho em 15/10 (`textos/capitulos/8_aspectos_juridicos.md`): SLU, CNAE 5611-2/05, Simples (A&B no anexo I, couvert e eventos no anexo III), licenças em Salvador, LGPD, locação, jogos e marca. Normas `[AV]` e três `[conferir]`.

- **Notion offline** (15/10): `python3 _src/extras/ler_notion_offline.py` lista os bancos do cache do app; com o nome do banco e `--saida`, exporta CSV. O cache é parcial (B - Comentários: 889 de 1.628 linhas) e não traz fórmulas; serve para consulta, não como fonte.

## Próximos 3 passos

1. Preparar as visitas de retorno de **domingo, 18/10**: tirar as dúvidas das visitas de 10/10 e 16/10 com os observadores (pendências do B3) e reforçar no roteiro o código do observador em Ajustes, o encerramento no app na hora em que a observação acaba, a NFC-e no início e no fim e as contagens de mesas a cada 30 min.
2. Trocar as premissas N6 de custo e investimento por cotações (aluguel do ponto, reforma, contador, utilidades) e rodar o modelo de novo.
3. Corrigir a triagem do B1 (tirar Machado e Ilusões, incluir as 5 novas) e rodar de novo `B2-b_avaliacoes.py`, para a base do B2 bater com o Notion.

## Bloqueado ou aguardando

- Coleta do B2 no navegador: os carregadores do Tampermonkey apontam para a pasta antiga `_src/Web scripts/`. Antes da próxima coleta, rodar `python3 _src/extras/gerar_carregadores.py --abrir --todos` e instalar os cinco no Vivaldi.
- Validação do dicionário e cap. 5.2: aguardam a recodificação cega da amostra do Bardin (§2 do instrumento).
- Estimativa de ocupação e fluxo (B3): aguarda as visitas de retorno (18/10).
- Rascunhos: o cap. 5 tem esboço com lacunas; o cap. 9 tem o modelo, mas não o texto ([status](textos/planejamento/status_capitulos.md)).
- Mac: está na branch `fix/entorno-maps-distantes`. Depois do merge do PR desta sessão, `git checkout main && git pull` para trazer o cap. 3, o cap. 8 e o modelo financeiro.

## Onde está o resto

| Preciso de… | Arquivo |
|---|---|
| Divergências entre capítulos e cortes possíveis | [docs/melhorias-texto.md](docs/melhorias-texto.md) |
| Prazos e checklist por semana | [textos/planejamento/cronograma_luderia.md](textos/planejamento/cronograma_luderia.md) |
| Situação de cada capítulo | [textos/planejamento/status_capitulos.md](textos/planejamento/status_capitulos.md) |
| O que já foi decidido | [docs/decisoes.md](docs/decisoes.md) |
| Dúvidas, ideias e decisões a tomar | [docs/pendencias.md](docs/pendencias.md) |
| Que arquivo abrir para cada tarefa | [README.md](README.md), "Por onde começar" |
