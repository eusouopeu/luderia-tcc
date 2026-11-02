# Formatação dos .docx e PDF

Regras suplementares à skill `formatacao-texto-ufba`, pedido do autor em 31/10/2026. Valem para todo `.docx` e `.pdf` gerado do TCC (TMax e TMin). Em conflito com a skill, valem estas. O `_src/extras/gerar_docx_capitulo.js` aplica todas.

## Títulos

| Elemento | No `.md` | Formatação |
|---|---|---|
| Título 1 (capítulo) | `# 5 ANÁLISE DE MERCADO` | Caixa alta, negrito, alinhado à esquerda, sem recuo na primeira linha, começa em página nova |
| Título de referências | `**Referências citadas neste capítulo**` no `.md` de cada capítulo | No trabalho inteiro, as listas dos capítulos viram uma só, "REFERÊNCIAS", depois do último capítulo: igual ao título 1, mas **sem número**, em ordem alfabética e sem repetição (pedido do autor em 31/10/2026). O `.docx` de um capítulo avulso mantém a lista própria |
| Título 2 (seção) | `## 5.1 ANÁLISE DO SETOR` | Caixa alta, **sem negrito**, alinhado à esquerda |
| Título 3 (subseção) | `### 5.1.1 Serviços às famílias` | Como na skill: negrito, só a inicial maiúscula |

## Parágrafos

- **Corpo do texto:** recuo de 1,00 cm na primeira linha e espaçamento de 0,5 cm depois do parágrafo (no lugar da linha em branco da skill). Os demais atributos seguem a skill.
- **Referências bibliográficas:** justificadas, com espaçamento de 1,5, **sem recuo na primeira linha** e com espaçamento de 0,5 cm depois de cada referência (pedido do autor em 31/10/2026; a NBR 6023 pede espaço simples e alinhamento à esquerda, e esta regra prevalece).
- **Abertura de capítulo:** todo capítulo começa com texto, antes da primeira seção numerada.

## Tabelas e quadros

- **Alinhamento vertical:** o texto de toda célula fica centralizado na vertical.
- **Alinhamento horizontal nos quadros:** coluna em que toda célula tem uma só palavra (ex.: "Probabilidade", "Impacto" e "Gatilho" no Quadro 10.2, Matriz de riscos) fica centralizada na horizontal. As demais colunas do quadro ficam à esquerda; nas tabelas, os números continuam à direita.
- **Legenda e fonte:** o título ("Tabela 5.1 – ...", "Quadro 10.2 – ...") e a linha "Fonte: ..." ficam centralizados.
- **Quadros (02/11/2026):** todo quadro (legenda "Quadro") tem TODAS as bordas visíveis, pretas e da mesma espessura (0,75 pt), mesmo com números; só a tabela (legenda "Tabela") usa bordas horizontais no cabeçalho e no fim. O `gerar_docx_capitulo.js` decide pela legenda.
- **Números nas tabelas (02/11/2026):** tabelas-resumo (indicadores, DRE, fluxo de caixa, matriz de riscos) em reais inteiros, sem centavos e sem "mil" (ex.: 368.898); tabelas de detalhe (investimento, receita e custos do mês, tributos, salários, preços) com os centavos reais. Valor arredondado nunca leva ",00" de enfeite. Total e subtotal fecham com a soma das linhas exibidas.
- **Célula sem número (02/11/2026):** "n.a." (não se aplica), centralizado na horizontal, explicado na nota. Zero é "0".
- **Unidade no cabeçalho (02/11/2026):** a unidade vai no título, no cabeçalho da coluna ou no rótulo da linha ("(R$)", "(%)", "(anos)", "(0 a 1)"), e não repetida em cada célula.
- **Negrito (02/11/2026):** só em títulos, legendas e cabeçalhos de tabela e quadro; no texto corrido, termo definido ou destacado vai em itálico, e expressão citada, entre aspas.
- **Fonte e nota (02/11/2026):** a fonte tem uma só redação: "Fonte: elaboração própria" (", com base em ..." quando houver base). Ressalvas, critérios e siglas vão numa linha "Nota: ..." logo abaixo da fonte, justificada, em Arial 10.
- **Figuras do modelo financeiro:** tons da paleta purple (pessimista #54278f, otimista #bcbddc no tornado).
