# AGORA

Atualizado em 13/11/2026. **TMin v35** em `textos/TCC_luderia_v35.docx` e `.pdf` (114 páginas; formatação do manual da UFBA: referências à esquerda e em espaço simples, datas por extenso, espaços por linhas em branco, linha em branco entre título e texto, número no canto superior direito, capa e folhas do autor; resumo com as partes indicadas; novo primeiro parágrafo do cap. 1), com os mesmos números da v33: com os dados de 13/11: 63 luderias em 15 metrópoles (Campinas é a 15ª), taxa de entrada de R$ 19,65 (31 casas), 834 pessoas/mês, VPL de R$ 213 mil (R$ 5 mil sem residual), TIR de 28,9%, payback de 4,3 anos, P(VPL > 0) de 60,4% (P10 −R$ 410 mil, P90 R$ 1,45 milhão); rupturas: circulação 5,95 (7% abaixo), gasto R$ 72,77 (8%). Gráficos dos capítulos em `textos/graficos/` como `<cap>-<ordem>_<conteúdo>.png`; `textos/figuras/` só para diagramas e fotos. Planilhas `B<n>_dados_agregados.xlsx` (sem "DMax"); premissas do modelo em `textos/capitulos/modelo_financeiro/*.xlsx`, conferidas contra o modelo a cada execução. `_src/` com `outros/`, `pyScripts/` e `webScripts/`. Banca em 16/11. Escopo congelado: só entra o que muda o TMin.

## Fazendo agora (no máximo duas frentes)

1. **Revisão da v35 pelo autor:** conferir o resumo estruturado, o primeiro parágrafo do cap. 1 (falta fonte para a tendência, D88) e a formatação nova e conferir no PDF as Tabelas 4.1, 6.2 e 9.2 a 9.6 e o Quadro 10.2 (aluguel pessimista virou risco alto, D87). Comentários do autor nos caps. 1 e 2 (13/11): duas rodadas aplicadas no `.docx` e no `.md` (abertura com os 3M de Dornelas, Figura 2.1 da PRC, 2.4 antiga retirada e lei de Little na 2.4 de viabilidade); seguem abertos no `.docx` "encena" e "lugar de convívio" (2.1) e os três do parágrafo de Porter (2.2). Pergunta de pesquisa saiu do cap. 1 (D91); rascunhos e erros de digitação em D90.
2. **Fechamento para a banca:** citações `[AV]` (58 linhas; conferir pelo conferidor, `python3 _src/outros/G4_textos/conferidor_av/conferidor.py`, regras em `10_biblio-apendices.md`), ajustes de formatação (teto de 120 páginas) e gravação da apresentação (roteiro de 23 slides e 18 minutos em [roteiro_apresentacao.md](textos/_planejamento/roteiro_apresentacao.md)).

## Próximos 3 passos

1. Responder o "Lote de decisões" ([pendências](_docs/pendencias.md)): L1, L20 a L24, L27, L29, L30 e L32 (exigência de metrô no ponto: com a recoleta do entorno de 13/11, a vantagem do metrô caiu para 771 × 572 avaliações, perto da do shopping, 751 × 601; o 5.4.2 e o 6.4 já têm os números novos, a v35 ainda os antigos).
2. Regras da UFBA ainda abertas ([parecer](_docs/pareceres/regras-UFBA-nao-seguidas.md)): citações em versal capitular, números de um a dez por extenso, referência antes do resumo e titulação do orientador.

## Bloqueado ou aguardando

- Quantidades do investimento (N6): projeto do ponto na Pituba.
- Folha de aprovação: nomes da banca.
- Legislação: a LOUOS de Salvador (Lei 9.148/2016) não tem texto integral em fonte oficial acessível; baixar à mão em `bibliografia/F1_Legislacao/4_funcionamento_e_pesquisa/`.
- Coletas do autor (aluguel, horários de pico, entorno, B2, webscripts): roteiros em [pendências](_docs/pendencias.md), "Coletas em andamento".
- Webscripts (13/11, tarde): todos os painéis pelo kit (aluguel, horários de pico, mobiliário e avaliações migrados) e lixeira que reinicia a coleta (dados e histórico, com backup antes). Não exige reinstalar os carregadores: basta recarregar a página. Testados numa página local e nos testes, não nos sites reais: conferir na primeira coleta de cada um.
- Webscripts (13/11): renomeados (`acervo`, `cardapio`, `instagram`, `aluguel`, `mobiliario`), com os itens dos menus em `lista_<script>.js` e a opção da fila "baixar cada item"; **reinstalar todos os carregadores** (`python3 _src/outros/G5_outros/gerar_carregadores.py --abrir --todos`), senão os instalados procuram o arquivo antigo, e apagar no Tampermonkey os de nome antigo que sobrarem. Depois, recoletar OLX Caminho das Árvores e Chame-Chame, horários de pico (permanência), Cineplay, Fortalúdica e 4 itens do B5; roteiro em [pendências](_docs/pendencias.md), "Coletas em andamento". Rodar `B2b_avaliacoes.py`: as 9 casas "coletar" já têm coleta de 12/11. Scripts Python agora sem hífen (`B1b_…`).

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
