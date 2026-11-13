# Formatação dos .docx e PDF

Regras suplementares à skill `formatacao-texto-ufba`. Valem para todo `.docx` e `.pdf` gerado do TCC. Em conflito com a skill, valem estas. O `_src/outros/G4_textos/gerar_docx_capitulo.js` aplica todas.

## Capa, folha de rosto e títulos (04/11/2026)

O `.docx` do trabalho inteiro abre com a capa (instituição, autor, título, local e ano) e a folha de rosto (autor, título, natureza do trabalho, orientador, local e ano), geradas por `_src/outros/G4_textos/gerar_pretextuais_tmin.py`. A capa não conta: a folha de rosto é a página 1, e o número só é impresso a partir da introdução, no cabeçalho, no canto superior direito, em Arial 10 (manual da UFBA; até a v34, no rodapé). Títulos de capítulo, seção e subseção ficam sem espaçamento antes e depois. A capa, a folha de rosto e a folha de aprovação seguem o leiaute que o autor montou no v33 (13/11/2026): brasão da UFBA; instituição, unidade e curso em corpo 16, 14 e 12; autor, local e ano em corpo 14; título em 16 e subtítulo em 14, em versal; nota de natureza a 6 cm da margem esquerda. Colunas de tabelas e quadros são dimensionadas pelo conteúdo (`gerar_docx_capitulo.js`), e `<br>` na célula do `.md` separa linhas.

## Espaçamentos (13/11/2026)

Todo espaço entre blocos é feito com **linhas em branco de espaçamento simples (1,0)**, e não com o espaçamento antes e depois do parágrafo. A altura da linha em branco é dada pelo corpo da fonte: 6 pt depois do parágrafo do corpo (manual da UFBA); 12 pt antes da legenda de tabela, quadro ou figura, depois da fonte (ou da nota) e entre uma referência e outra; linhas de 12 pt para posicionar os elementos da capa e das folhas de rosto e de aprovação. Entre um título (capítulo, seção, subseção, REFERÊNCIAS ou pré-textual) e o texto que vem logo depois, uma linha em branco de 12 pt; entre dois títulos seguidos, nenhuma. Os geradores (`gerar_docx_capitulo.js`, `gerar_apendices_tmin.py` e `gerar_pretextuais_tmin.py`) usam a função `branco()`.

## Títulos

| Elemento | No `.md` | Formatação |
|---|---|---|
| Título 1 (capítulo) | `# 5 ANÁLISE DE MERCADO` | Caixa alta, negrito, alinhado à esquerda, sem recuo na primeira linha, começa em página nova |
| Título de referências | `**Referências citadas neste capítulo**` no `.md` de cada capítulo | No trabalho inteiro, as listas dos capítulos viram uma só, "REFERÊNCIAS", depois do último capítulo: caixa alta e negrito, **centralizado** e sem número (manual da UFBA, seções sem indicativo numérico), em ordem alfabética e sem repetição. O `.docx` de um capítulo avulso mantém a lista própria |
| Título 2 (seção) | `## 5.1 ANÁLISE DO SETOR` | Caixa alta, **sem negrito**, alinhado à esquerda |
| Título 3 (subseção) | `### 5.1.1 Serviços às famílias` | Como na skill: negrito, só a inicial maiúscula |

## Parágrafos

- **Corpo do texto:** recuo de 1,00 cm na primeira linha e uma linha em branco de 6 pt depois do parágrafo (manual da UFBA; no lugar da linha em branco de 12 pt da skill). Os demais atributos seguem a skill.
- **Referências bibliográficas:** alinhadas só à margem esquerda, em espaço simples, **sem recuo na primeira linha**, com uma linha em branco de 12 pt entre uma e outra (NBR 6023 e manual da UFBA).
- **Abertura de capítulo:** todo capítulo começa com texto, antes da primeira seção numerada.
- **Resumo e abstract:** com a indicação das partes (manual da UFBA), num só parágrafo em espaço simples: **Introdução:**, **Objetivo:**, **Método:**, **Resultados:** e **Conclusão:**, com os rótulos em negrito (*Introduction*, *Objective*, *Method*, *Results* e *Conclusion* no abstract); natureza, objetivos e abordagem da pesquisa no Método; sem siglas.

## Tabelas e quadros

- **Alinhamento vertical:** o texto de toda célula fica centralizado na vertical.
- **Alinhamento horizontal nos quadros:** coluna em que toda célula tem uma só palavra (ex.: "Probabilidade", "Impacto" e "Gatilho" no Quadro 10.2, Matriz de riscos) fica centralizada na horizontal. As demais colunas do quadro ficam à esquerda; nas tabelas, os números continuam à direita.
- **Legenda e fonte:** o título ("Tabela 5.1 – ...", "Quadro 10.2 – ...") e a linha "Fonte: ..." ficam centralizados.
- **Quadros:** todo quadro (legenda "Quadro") tem TODAS as bordas visíveis, pretas e da mesma espessura (0,75 pt), mesmo com números; só a tabela (legenda "Tabela") usa bordas horizontais no cabeçalho e no fim. O `gerar_docx_capitulo.js` decide pela legenda.
- **Números nas tabelas:** tabelas-resumo (indicadores, DRE, fluxo de caixa, matriz de riscos) em reais inteiros, sem centavos e sem "mil" (ex.: 368.898); tabelas de detalhe (investimento, receita e custos do mês, tributos, salários, preços) com os centavos reais. Valor arredondado nunca leva ",00" de enfeite. Total e subtotal fecham com a soma das linhas exibidas.
- **Célula sem número:** "n.a." (não se aplica), centralizado na horizontal, explicado na nota. Zero é "0".
- **Unidade no cabeçalho:** a unidade vai no título, no cabeçalho da coluna ou no rótulo da linha ("(R$)", "(%)", "(anos)", "(0 a 1)"), e não repetida em cada célula.
- **Negrito:** só em títulos, legendas e cabeçalhos de tabela e quadro; no texto corrido, termo definido ou destacado vai em itálico, e expressão citada, entre aspas.
- **Datas:** com o mês por extenso, no texto, nas fontes, nas notas e nas células (manual da UFBA): dia, "10 de outubro de 2026" ("1º de setembro" para o primeiro dia); mês, "julho de 2026"; período, "10 a 30 de outubro de 2026", "17 de outubro a 12 de novembro de 2026". Fica fora a data de acesso das referências, que segue a NBR 6023 ("Acesso em: 2 nov. 2026"). Dados do modelo: "com base no modelo financeiro (Apêndice E)".
- **Unidades de medida:** padrão do SI, com espaço entre o número e o símbolo ("40 h", "150 m²", "2 cm"), e não colado como nos exemplos do manual da UFBA. Hora do dia segue o manual: "9h30", "das 14h às 23h".
- **Siglas:** desdobradas na primeira ocorrência do texto corrido ("forma por extenso (SIGLA)"; dentro de parênteses, "forma por extenso, SIGLA") e reunidas na lista de abreviações e siglas.
- **Fonte e nota:** a fonte tem uma só redação: "Fonte: elaboração própria" (", com base em ..." quando houver base). Ressalvas, critérios e siglas vão numa linha "Nota: ..." logo abaixo da fonte, justificada, em Arial 10.
- **Figuras do modelo financeiro:** tons da paleta purple (pessimista #54278f, otimista #bcbddc no tornado).
