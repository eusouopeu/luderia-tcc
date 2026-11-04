# Referências, Apêndices e Formatação

## Normas aplicáveis

| Norma | Assunto |
|---|---|
| ABNT NBR 14724:2011 | Apresentação de trabalhos acadêmicos |
| ABNT NBR 6023:2018 | Referências |
| ABNT NBR 10520:2023 | Citações |
| ABNT NBR 6024:2012 | Numeração progressiva das seções |
| ABNT NBR 6027:2012 | Sumário |
| ABNT NBR 6028:2021 | Resumo |
| IBGE. *Normas de apresentação tabular*. 3. ed., 1993 | Tabelas |

Conferir o manual ou as normas complementares da UFBA e do curso, e as orientações da orientadora. Em caso de conflito, prevalece a norma da instituição. `[AV]`

## Referências (NBR 6023:2018)

- Lista única, no fim do trabalho, em ordem alfabética. Alinhamento e espaçamento seguem `1d_formatacao.md` (justificada, espaço 1,5), que prevalece sobre a NBR 6023 (esquerda, espaço simples).
- Título em destaque (itálico ou negrito — escolher um e manter).
- Documentos online: incluir "Disponível em: URL. Acesso em: dia mês abreviado ano." Toda referência com versão de acesso público (lei, base pública, artigo em acesso aberto, dissertação em repositório) leva o link, conferido antes de entrar; obra paga ou sem versão aberta (livros, periódicos fechados, ABNT) fica sem link (02/11/2026, pedido do autor).
- Incluir apenas obras citadas no texto. Leituras não citadas não entram.
- Modelos:
  - **Livro:** SOBRENOME, Nome. *Título*: subtítulo. Edição. Local: Editora, ano.
  - **Artigo:** SOBRENOME, Nome. Título do artigo. *Nome do periódico*, local, v. X, n. X, p. X–X, ano. DOI.
  - **Relatório institucional:** INSTITUIÇÃO. *Título*. Local: Instituição, ano. Disponível em: ... Acesso em: ...
  - **Base de dados:** INSTITUIÇÃO. *Nome da base*. Local, ano. Disponível em: ... Acesso em: ...
  - **Legislação:** BRASIL. Lei nº X, de dia de mês de ano. Ementa. *Diário Oficial da União*, ...
  - **Repositório de código:** AUTOR. *Título do repositório*. Ano. Disponível em: URL. Acesso em: ...
- Referência não conferida fica marcada `[AV]` (a verificar) e não entra na versão final.
- Citação com página a conferir leva `[AV]` junto da citação; o autor troca o marcador pela página quando conferir na obra. (Os checklists de conceitos `[AV-<ID>]` e o vigia que os aplicava foram arquivados em 03/11/2026, em `bibliografia/_arquivo/` e `_src/extras/_arquivo/conceitos/`.)

## Tabelas, quadros e figuras

### Diferença entre tabela e quadro
- **Tabela:** dado **numérico** tratado estatisticamente. Laterais abertas; traços horizontais apenas no topo, abaixo do cabeçalho e no fim (IBGE, 1993).
- **Quadro:** conteúdo **textual** ou esquemático (ex.: matriz de evidências, registro de premissas quando textual, SWOT). Todas as bordas visíveis, pretas e da mesma espessura, mesmo com números (`1d_formatacao.md`).
- **Figura:** gráficos, mapas, fluxogramas, plantas, fotografias.

### Padrão de identificação
Seguir o padrão já usado nos rascunhos:

```
**Quadro 01 -** Título descritivo

[conteúdo]

Fonte: elaborado pelo próprio autor
```

- Título **acima**; fonte **abaixo**.
- Numeração sequencial por tipo, com dois dígitos (Tabela 01, Quadro 01, Figura 01).
- Fonte sempre presente:
  - dado próprio: "Fonte: elaborado pelo próprio autor";
  - dado próprio sobre base de terceiros: "Fonte: elaborado pelo próprio autor com base em [fonte] ([ano])";
  - dado de terceiros: "Fonte: SOBRENOME (ano)".
- Citar no texto antes de aparecer ("conforme a Tabela 03") e comentar depois.
- Tabela ou quadro que ultrapassa uma página: repetir o cabeçalho e indicar "continua" / "conclusão".
- Gráficos: seguir a skill `dataviz`; legíveis em escala de cinza para impressão.
- Listas de tabelas, quadros e figuras nos elementos pré-textuais.

## Apêndices e anexos

- **Apêndice:** elaborado pelo autor. **Anexo:** de terceiros.
- Identificação: "APÊNDICE A — Título", "ANEXO A — Título", em letras sequenciais.
- Todo apêndice é citado no texto pelo menos uma vez.

## Quadros e tabelas: texto ou apêndice

Regra: prosa que só descreve um conjunto de itens vira quadro; o texto em volta diz a conclusão e a decisão que ela muda, sem repetir o quadro. No corpo fica a versão curta, com o que sustenta a decisão; a versão completa vai para apêndice. Meta: 30% a 40% menos texto nos caps. 6 a 8.

### No corpo do texto

| Cap. | Elemento | Conteúdo mínimo |
|---|---|---|
| 3.1 | Quadro — escala N1–N6 | Nível, tipo de fonte, exemplo do plano |
| 3.2 | Quadro — blocos de dados | Um quadro único para B1 a B5: fonte, recorte, período, uso no plano, limitação. Substitui a descrição em prosa de cada bloco |
| 5.3 | Tabela — concorrentes por metrópole | Total da busca, total acima do corte de 100 avaliações, avaliação média |
| 5.3 | Figura — mapa de concorrentes | Metrópoles e Salvador |
| 5.3 | Quadro — cinco forças | Força, intensidade, evidência |
| 5.5 | Quadro — PESTEL | Fator, efeito no plano, fonte |
| 6.1 | Quadro — grade ERRC | Eliminar, reduzir, elevar, criar, com a evidência de cada item |
| 6.2–6.5 | Quadro — composto de marketing | Produto, preço, praça, promoção: decisão e evidência |
| 6.3 | Tabela — preços praticados | Couvert, consumo por pessoa e cesta completa por metrópole, Salvador em destaque |
| 6.4 | Quadro — critérios do bairro | Matriz de critérios ponderados, com fonte por critério |
| 6.6 | Tabela — estimativa de demanda | Visitas por mês nos três cenários e caminho de cálculo |
| 7.2 | Tabela — capacidade | Mesas × lugares × giros, comparadas à demanda |
| 8 | Quadro — enquadramento jurídico | CNAE, forma jurídica, regime tributário, licenças, com fonte legal |
| 9.1 | Figura — árvore de direcionadores | Receita e custo até as folhas medidas |
| 9.2 | Quadro — premissas críticas | Premissas do tornado: faixa, fonte, nível N (registro completo no Apêndice E) |
| 9.3 | Tabela — investimento inicial | Por grupo de item |
| 9.3 | Tabela — DRE e fluxo de caixa | 5 anos, cenário provável, numa só tabela (mensal só no modelo) |
| 9.6 / 10.2 | Tabela — indicadores por cenário | Investimento, VPL, TIR, payback, ponto de equilíbrio. Uma só tabela, citada nos dois capítulos |
| 9.7 / 10.3 | Figura — tornado | Com o ponto de ruptura de cada premissa crítica |
| 10.1 | Quadro — SWOT | Com cruzamento FO, FA, DO, DA resumido |
| 10.4–10.5 | Quadro — riscos e contingência | Risco, probabilidade × impacto, gatilho, ação. Um só quadro para as duas seções |

### Apêndices do TMin

Só os apêndices citados no texto, com letras na ordem de citação, num arquivo separado ([1c_versoes.md](1c_versoes.md); `_src/extras/gerar_apendices_tmin.py`). O texto cita só o número-chave.

| Apêndice | Conteúdo | Onde é citado | Origem |
|---|---|---|---|
| A | Concorrentes do B1: lista dos aprovados (nome, metrópole, avaliação, volume; sem texto de avaliações) | 3 | `dados/[B1] Estabelecimentos e cardapios/` |
| B | Contagem direta do B3: protocolo, estrutura das unidades, registros por visita, ocupação, NFC-e | 3 | `dados/[B3] Contagem direta de ocupacao/`; `textos/instrumentos/roteiro_observacao_sao_jogue.md` |
| C | Tabelas de apoio das bases públicas (B4): população por bairro, salários de admissão, faixas do Simples, Selic e IPCA | 3 | `dados/[B4] Bases publicas/` |
| D | Matriz de evidências | 3 | [4_metodologia.md](4_metodologia.md) |
| E | Registro de premissas | 4, 6 a 9 | [8_financeiro.md](8_financeiro.md); `gerar_modelo_financeiro.py` |
| F | Análise de conteúdo das avaliações (B2): grade, frequências, kappa | 6 | `textos/instrumentos/dicionario_temas_B2.md`; `dados/[B2] Avaliacoes recentes/` |
| G | Simulação de Monte Carlo | 9 | [8_financeiro.md](8_financeiro.md) §4.4 |

Teto dos apêndices: 9 páginas. O que não couber fica só no repositório, com o link no apêndice que o resume. Testes de hipótese H1–H9, se feitos, entram num apêndice novo, dentro do mesmo teto.

Testes estatísticos (se feitos, em qualquer apêndice): informar técnica, N, estatística do teste, valor-p e tamanho de efeito; resultado não significativo também é reportado.
