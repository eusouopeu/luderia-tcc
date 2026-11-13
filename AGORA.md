# AGORA

Atualizado em 13/11/2026. **TMin v35** em `textos/TCC_luderia_v35.docx` e `.pdf` (114 páginas; formatação do manual da UFBA: referências à esquerda e em espaço simples, datas por extenso, espaços por linhas em branco, linha em branco entre título e texto, número no canto superior direito, capa e folhas do autor; resumo com as partes indicadas; novo primeiro parágrafo do cap. 1), com os mesmos números da v33: com os dados de 13/11: 63 luderias em 15 metrópoles (Campinas é a 15ª), taxa de entrada de R$ 19,65 (31 casas), 834 pessoas/mês, VPL de R$ 213 mil (R$ 5 mil sem residual), TIR de 28,9%, payback de 4,3 anos, P(VPL > 0) de 60,4% (P10 −R$ 410 mil, P90 R$ 1,45 milhão); rupturas: circulação 5,95 (7% abaixo), gasto R$ 72,77 (8%). Gráficos dos capítulos em `textos/graficos/` como `<cap>-<ordem>_<conteúdo>.png`; `textos/figuras/` só para diagramas e fotos. Planilhas `B<n>_dados_agregados.xlsx` (sem "DMax"); premissas do modelo em `textos/capitulos/modelo_financeiro/*.xlsx`, conferidas contra o modelo a cada execução. `_src/` com `outros/`, `pyScripts/` e `webScripts/`. Banca em 16/11. Escopo congelado: só entra o que muda o TMin.

## Fazendo agora (no máximo duas frentes)

1. **Revisão da v35 pelo autor:** conferir o resumo estruturado, o primeiro parágrafo do cap. 1 (falta fonte para a tendência, D88) e a formatação nova e conferir no PDF as Tabelas 4.1, 6.2 e 9.2 a 9.6 e o Quadro 10.2 (aluguel pessimista virou risco alto, D87).
2. **Fechamento para a banca:** citações `[AV]`, ajustes de formatação (teto de 120 páginas) e gravação da apresentação (roteiro de 23 slides e 18 minutos em [roteiro_apresentacao.md](textos/_planejamento/roteiro_apresentacao.md)).

## Próximos 3 passos

1. Responder o "Lote de decisões" ([pendências](_docs/pendencias.md)): L1, L20 a L24, L27, L29, L30, L31 (pedidos de 12/11 fora do desenho atual: taxa pela mediana, dia útil pelos histogramas, circulação da Paralela, 130 m²) e L32 (shopping no entorno).
2. Recoletar o entorno com o coletor 2026.11.13-6 e regerar os números do 5.4.2 e do 6.4 (a v33 usa a coleta de 12/11, que pode subcontar estações de metrô).
3. Regras da UFBA ainda abertas ([parecer](_docs/pareceres/regras-UFBA-nao-seguidas.md)): citações em versal capitular, números de um a dez por extenso, referência antes do resumo e titulação do orientador.

## Bloqueado ou aguardando

- Quantidades do investimento (N6): projeto do ponto na Pituba.
- Folha de aprovação: nomes da banca.
- Legislação: a LOUOS de Salvador (Lei 9.148/2016) não tem texto integral em fonte oficial acessível; baixar à mão em `bibliografia/F1_Legislacao/4_funcionamento_e_pesquisa/`.
- Coletas do autor (aluguel, horários de pico, entorno, B2, webscripts): roteiros em [pendências](_docs/pendencias.md), "Coletas em andamento".
- Entorno: a coleta de 12/11 (39 casas) subconta estações de metrô (Maps devolveu ranking de 10 da cidade). Coletor 2026.11.13-6 (sem BRT nem estação tubo; quadrantes logo após a busca que os gera, com "busca i/N" no status: casa de Salvador faz 11 buscas, do Rio até 20); recoletar com ele, no mínimo as casas do Rio, antes de usar o entorno no TMin.
- Webscripts (13/11): renomeados (`acervo`, `cardapio`, `instagram`, `aluguel`, `mobiliario`), com os itens dos menus em `lista_<script>.js` e a opção da fila "baixar cada item"; **reinstalar todos os carregadores** (`python3 _src/outros/G5_outros/gerar_carregadores.py --abrir --todos`), senão os instalados procuram o arquivo antigo, e apagar no Tampermonkey os de nome antigo que sobrarem. Depois, recoletar entorno (63 casas), OLX Caminho das Árvores e Chame-Chame, horários de pico (permanência), Cineplay, Fortalúdica e 4 itens do B5; roteiro em [pendências](_docs/pendencias.md), "Coletas em andamento". Rodar `B2b_avaliacoes.py`: as 9 casas "coletar" já têm coleta de 12/11. Scripts Python agora sem hífen (`B1b_…`).

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
