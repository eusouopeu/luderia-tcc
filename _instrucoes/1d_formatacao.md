# Formatação dos .docx e PDF

Regras suplementares à skill `formatacao-texto-ufba`, pedido do autor em 31/10/2026. Valem para todo `.docx` e `.pdf` gerado do TCC (TMax e TMin). Em conflito com a skill, valem estas. O `_src/extras/gerar_docx_capitulo.js` aplica todas.

## Títulos

| Elemento | No `.md` | Formatação |
|---|---|---|
| Título 1 (capítulo) | `# 5 ANÁLISE DE MERCADO` | Caixa alta, negrito, alinhado à esquerda, sem recuo na primeira linha, começa em página nova |
| Título de referências do capítulo | `**Referências citadas neste capítulo**` | Igual ao título 1 (caixa alta, negrito, à esquerda, sem recuo, página nova), mas **sem número** |
| Título 2 (seção) | `## 5.1 ANÁLISE DO SETOR` | Caixa alta, **sem negrito**, alinhado à esquerda |
| Título 3 (subseção) | `### 5.1.1 Serviços às famílias` | Como na skill: negrito, só a inicial maiúscula |

## Parágrafos

- **Corpo do texto:** recuo de 1,00 cm na primeira linha e espaçamento de 0,5 cm depois do parágrafo (no lugar da linha em branco da skill). Os demais atributos seguem a skill.
- **Referências bibliográficas:** alinhadas à esquerda (não justificadas), **sem recuo na primeira linha** e com espaçamento de 0,5 cm depois de cada referência.

## Tabelas e quadros

- **Alinhamento vertical:** o texto de toda célula fica centralizado na vertical.
- **Alinhamento horizontal nos quadros:** coluna em que toda célula tem uma só palavra (ex.: "Tipo", "Probabilidade" e "Impacto" no Quadro 10.4, Matriz de riscos) fica centralizada na horizontal. As demais colunas do quadro ficam à esquerda; nas tabelas, os números continuam à direita.
- **Legenda e fonte:** o título ("Tabela 5.1 – ...", "Quadro 10.4 – ...") e a linha "Fonte: ..." ficam centralizados.
