# Pendências

Tudo o que está em aberto, num só lugar. Quando um item for resolvido, ele sai daqui: decisão vai para [decisoes.md](decisoes.md), dúvida respondida vai para o texto ou para as instruções, e ideia adotada vai para o cronograma.

## Decisões a tomar

1. **Validação proporcional da coleta (em estudo, não adotada).** Até decidir, vale o procedimento de `_instrucoes/4_metodologia.md` §3.4, e a proposta não entra no texto. A proposta:
   - B1 e B2, fidelidade: amostra aleatória de 30 estabelecimentos e 100 avaliações, conferidos na página (nota, volume, endereço; texto, nota e rótulo de data);
   - B2, codificação: o autor recodifica 10% das avaliações depois de no mínimo 14 dias, sem consultar a primeira codificação; concordância pelo kappa de Cohen;
   - B4, reconciliação: cada série usada no plano conferida com o portal de origem em ao menos um período e um recorte;
   - erro total da pesquisa (TSE) em uma frase com citação, não numa seção.

   Antes de adotar, estudar: com zero erros, o limite superior de 95% de Wilson é 3,84 ÷ (n + 3,84), cerca de 11% com n = 30 e 3,7% com n = 100. Então 30 estabelecimentos não cumprem o critério de 5%: ou a amostra do B1 sobe para perto de 75, ou o critério muda. Falta ainda ver se a banca aceita a concordância de um codificador consigo mesmo e como estratificar uma amostra pequena (capital e faixa de volume).
2. **Hipótese do público potencial** (30 anos ou mais, casado ou com filhos, que frequentaria luderias se o ambiente, o público ou o serviço mudassem): registrar como emenda ao registro prévio ou guardar como estudo futuro (cap. 11.5)? Formulações testáveis em `docs/bibliografia/diagnostico-teorico.md` §9.
3. **PDFs da P2 que faltam:** Kimes e Robson (2004) no eCommons (bloqueou o download automático); Graham e Harvey, Delmar e Shane, Lambrecht e Skiera (SSRN), Li e Hitt (CORE), Anderson e Magruder (eScholarship), Xia et al. (UNAL) e Novaes e Kanyat (volume da revista) têm cópia aberta, mas só pelo navegador; os demais, pelo Portal CAPES ou pela biblioteca.
4. **Snowball do Instagram: corte k e fundamentação.** Escolher o corte k depois de classificar os candidatos (`B1_snowball_corte.csv`: menor k com precisão aceitável sem perder sensibilidade) e decidir se faz uma segunda onda com as luderias novas como sementes. Conferir antes de citar: LGPD, art. 4º, II, b e art. 7º, §4º; Resolução CNS 510/2016, art. 1º, parágrafo único; Goodman (1961) e Biernacki e Waldorf (1981) para o snowball `[AV]`. Decidir também o que fazer com @arainhadosdados, semente coletada sem ser casa aprovada (sai do build ou a casa entra nas aprovadas).
5. **Replanejar os rascunhos atrasados** (caps. 3 e 8 e seções 5.1, 5.4 e 5.5) ou acionar o plano de corte do cronograma?

6. **Bibliografia v2 (15/10/2026).** Escolher, conceito a conceito, entre a obra original dos checklists P1/P2 e o substituto de `bibliografia/bibliografia-v2/bibliografia-v2.md`; ao adotar um substituto, trocar a linha no checklist da leva para o vigia propagar. R10, R28 e R29 seguem com o original.

7. **Corte de shopping de porte no entorno.** Com o `…_entorno_shoppings.csv` (área no OSM e avaliações no Maps de cada shopping a até 1000 m), escolher o critério da coluna `qt_shoppings_porte` (área ≥ 5.000 m², mínimo de avaliações, ambos ou qualquer) e, se for por avaliações, o limiar e a fonte que o sustenta.

7. **Cap. 2, conferências antes da versão final:** edição, ano e página dos livros marcados `[AV]` (Dornelas, Porter, Kotler e Keller, Kim e Mauborgne, Mintzberg et al., Marcellino, Pine e Gilmore, Oldenburg, Woods, Zeithaml et al., Fitzsimmons et al., Hillier e Lieberman, Brealey et al., Damodaran, Bruni, Bruni e Famá, Casarotto e Kopittke, Pfeffer e Sutton); as edições do texto são a mais recente provável, não conferida. Baixar pelo navegador o PDF do SEBRAE (2016), que veio como HTML, e decidir se entra em 2.1. Incluir no checklist da P1/P2 os conceitos que o cap. 2 tira de obras sem ID (Kano/PRC, ERRC, PESTEL, terceiro lugar, lei de Little pelos livros da v2).

## Divergências entre documentos, ainda sem correção


- Sarpa (2016): capa com *Experiências de consumo com jogos de tabuleiro modernos*; resumo com *Boardgames: um estudo sobre a experiência de consumo*. Conferir no repositório da UFRJ.

- Damodaran: `_instrucoes/8_financeiro.md` cita *Avaliação de investimentos* (ed. brasileira); o roteiro e o checklist da P2 citam *Investment valuation* (Wiley). Definir a edição que será lida.

- Build do B2 aceita "fim da lista" como coleta completa, mas o userscript para em silêncio (Shelf e Bardo Mago, 14/10). Marcar "conferir" quando o volume lido ficar muito abaixo do volume do B1 ou a última avaliação lida for mais nova que "3 meses atrás".
- Triagem do B1 desatualizada: tirar Machado Games e Ilusões Industriais das aprovadas e decidir como entram Bardo Mago, La Tabuleria, TabuClub, Toca do Rato e Tubaleria (hoje só no Notion; fora da base do B2).
- Shelf Bar: poucas avaliações com rótulo "2 meses atrás" (19) e "3 meses atrás" (14) frente a "um mês" (113) e "4 meses" (110). Conferir no Maps se é real ou falha de carregamento.
- Userscript `maps_avaliacoes`: `texto_original` vem "não" nas avaliações traduzidas (6 casos).
- Notion "B - Comentários": as linhas digitadas à mão não têm "ID da avaliação"; depois das coletas de 14/10, 40 delas seguem sem par nas coletas (Magic Store 31, outras 1 cada), quase todas mais antigas que o recorte.

- Instagram: `@ludocafe_editora` coletado para o LudoCafé (triagem: `@ludocafebh`) e `@dominariacg.sp` para a Dominaria de Fortaleza (`@dominariacg`). Sete perfis (Bodogami, Fan Hour, Bravo, Covil, Shelf, Ludoteca BGC, Cartola) vieram do coletor antigo, sem seguidores nem período.

- `_instrucoes/1_estrutura.md` (3.5) fala em "metade exploratória e confirmatória", e o cronograma (semana 3) tem a tarefa "Divisão da base em parte exploratória e parte confirmatória"; a metodologia adotou a base única em 13/10.
- `_instrucoes/1_estrutura.md` (11.5) cita "sem o recorte do último mês"; o recorte vigente é de 3 meses.
- O cronograma ainda fala em "avaliações do último mês" (semana 2).

## Dúvidas

- **Cardápios, conferir à mão:** categorias de 13 casas atribuídas por regra de palavra-chave (`B1-b_cardapios_transcricoes.py`); Cartola só tem entradas, sobremesas e drinks exportados da Takeat; TabuClub baixado e não transcrito; preços de La Tabuleria e Toca do Rato são de delivery (Saipos).


- **Entorno no Maps, três primeiras extrações (14/10):** os CSVs estão em `dados/[B1] Estabelecimentos e cardapios/_dados-brutos/estabelecimentos/maps_entorno_*_2026-10-14*.csv` e não foram conferidos linha a linha; foram coletados antes da busca de trem. Recoletar os três estabelecimentos com a versão atual do coletor e conferir.
- Perguntas abertas para a literatura (validação de avaliações online como medida de visitas, estabilidade da razão avaliações ÷ visitantes, limiar de concordância para variáveis raras, peso de comida, serviço e ambiente, taxa de desconto de negócio pequeno, termos de uso do Google Maps): `docs/bibliografia/lacunas-bibliograficas.md` §6.
- Datas e horários das visitas: o roteiro de campo (`textos/instrumentos/roteiro_observacao_sao_jogue.md`) ainda marca 18h00 às 21h00 nas quatro visitas, e o cronograma (semana 4) chama a de 03/10 de "visita pré-teste". Confirmar se as primeiras visitas foram em 03/10 com entrada às 19h.

## Ideias futuras

- Extensões fora do escopo atual (durações citadas nos textos, contagem em outra capital, recoleta do volume total, teste da porta falsa): `_instrucoes/4_metodologia.md`, "Extensões fora do escopo atual".
- Simulação de Monte Carlo e testes H1–H9, se sobrar tempo (apêndices L e M).
- Hipótese do público potencial, se não virar emenda (item 2).
- Alinhar os valores dos CSV já gerados às regras de `_src/dicionario.md` §4.2 (`sim`/`nao` no lugar de `0`/`1` e `True`/`False`, ponto decimal nas transcrições de cardápio, rótulos de categoria com `_`) quando o script de cada um for alterado; conferir antes que nenhum script leitor dependa do formato antigo.
