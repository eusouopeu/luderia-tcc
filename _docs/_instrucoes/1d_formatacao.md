# Formatação dos .docx e PDF

Regras suplementares à skill `formatacao-texto-ufba`. Valem para todo `.docx` e `.pdf` gerado do TCC. Em conflito com a skill, valem estas. O `_src/Extras/G4_textos/gerar_docx_capitulo.js` aplica todas.

## Capa, folha de rosto e títulos (04/11/2026)

O `.docx` do trabalho inteiro abre com a capa (instituição, autor, título, local e ano) e a folha de rosto (autor, título, natureza do trabalho, orientador, local e ano), geradas por `_src/Extras/G4_textos/gerar_pretextuais_tmin.py`. A capa não conta: a folha de rosto é a página 1, e o número só é impresso a partir da introdução. Títulos de capítulo, seção e subseção ficam sem espaçamento antes e depois; só o parágrafo de texto tem 0,5 cm depois. Colunas de tabelas e quadros são dimensionadas pelo conteúdo (`gerar_docx_capitulo.js`), e `<br>` na célula do `.md` separa linhas.

## Títulos

| Elemento | No `.md` | Formatação |
|---|---|---|
| Título 1 (capítulo) | `# 5 ANÁLISE DE MERCADO` | Caixa alta, negrito, alinhado à esquerda, sem recuo na primeira linha, começa em página nova |
| Título de referências | `**Referências citadas neste capítulo**` no `.md` de cada capítulo | No trabalho inteiro, as listas dos capítulos viram uma só, "REFERÊNCIAS", depois do último capítulo: igual ao título 1, mas **sem número**, em ordem alfabética e sem repetição. O `.docx` de um capítulo avulso mantém a lista própria |
| Título 2 (seção) | `## 5.1 ANÁLISE DO SETOR` | Caixa alta, **sem negrito**, alinhado à esquerda |
| Título 3 (subseção) | `### 5.1.1 Serviços às famílias` | Como na skill: negrito, só a inicial maiúscula |

## Parágrafos

- **Corpo do texto:** recuo de 1,00 cm na primeira linha e espaçamento de 0,5 cm depois do parágrafo (no lugar da linha em branco da skill). Os demais atributos seguem a skill.
- **Referências bibliográficas:** justificadas, com espaçamento de 1,5, **sem recuo na primeira linha** e com espaçamento de 0,5 cm depois de cada referência (a NBR 6023 pede espaço simples e alinhamento à esquerda, e esta regra prevalece).
- **Abertura de capítulo:** todo capítulo começa com texto, antes da primeira seção numerada.

## Tabelas e quadros

- **Alinhamento vertical:** o texto de toda célula fica centralizado na vertical.
- **Alinhamento horizontal nos quadros:** coluna em que toda célula tem uma só palavra (ex.: "Probabilidade", "Impacto" e "Gatilho" no Quadro 10.2, Matriz de riscos) fica centralizada na horizontal. As demais colunas do quadro ficam à esquerda; nas tabelas, os números continuam à direita.
- **Legenda e fonte:** o título ("Tabela 5.1 – ...", "Quadro 10.2 – ...") e a linha "Fonte: ..." ficam centralizados.
- **Quadros:** todo quadro (legenda "Quadro") tem TODAS as bordas visíveis, pretas e da mesma espessura (0,75 pt), mesmo com números; só a tabela (legenda "Tabela") usa bordas horizontais no cabeçalho e no fim. O `gerar_docx_capitulo.js` decide pela legenda.
- **Números nas tabelas:** tabelas-resumo (indicadores, DRE, fluxo de caixa, matriz de riscos) em reais inteiros, sem centavos e sem "mil" (ex.: 368.898); tabelas de detalhe (investimento, receita e custos do mês, tributos, salários, preços) com os centavos reais. Valor arredondado nunca leva ",00" de enfeite. Total e subtotal fecham com a soma das linhas exibidas.
- **Célula sem número:** "n.a." (não se aplica), centralizado na horizontal, explicado na nota. Zero é "0".
- **Unidade no cabeçalho:** a unidade vai no título, no cabeçalho da coluna ou no rótulo da linha ("(R$)", "(%)", "(anos)", "(0 a 1)"), e não repetida em cada célula.
- **Negrito:** só em títulos, legendas e cabeçalhos de tabela e quadro; no texto corrido, termo definido ou destacado vai em itálico, e expressão citada, entre aspas.
- **Datas nas fontes:** sempre em números: dia, "10/10/2026"; mês, "07/2026"; período, "10/10/2026 a 30/10/2026". Dados do modelo: "com base no modelo financeiro (Apêndice E)".
- **Siglas:** desdobradas na primeira ocorrência do texto corrido ("forma por extenso (SIGLA)"; dentro de parênteses, "forma por extenso, SIGLA") e reunidas na lista de abreviações e siglas.
- **Fonte e nota:** a fonte tem uma só redação: "Fonte: elaboração própria" (", com base em ..." quando houver base). Ressalvas, critérios e siglas vão numa linha "Nota: ..." logo abaixo da fonte, justificada, em Arial 10.
- **Figuras do modelo financeiro:** tons da paleta purple (pessimista #54278f, otimista #bcbddc no tornado).
