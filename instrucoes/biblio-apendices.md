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

Conferir o manual ou as normas complementares da UFBA e do curso, e as orientações da orientadora. Em caso de conflito, prevalece a norma da instituição. `[A VERIFICAR]`

## Referências (NBR 6023:2018)

- Lista única, em ordem alfabética, alinhada à margem esquerda, espaço simples, separada por uma linha em branco.
- Título em destaque (itálico ou negrito — escolher um e manter).
- Documentos online: incluir "Disponível em: URL. Acesso em: dia mês abreviado ano."
- Incluir apenas obras citadas no texto. Leituras não citadas não entram.
- Modelos:
  - **Livro:** SOBRENOME, Nome. *Título*: subtítulo. Edição. Local: Editora, ano.
  - **Artigo:** SOBRENOME, Nome. Título do artigo. *Nome do periódico*, local, v. X, n. X, p. X–X, ano. DOI.
  - **Relatório institucional:** INSTITUIÇÃO. *Título*. Local: Instituição, ano. Disponível em: ... Acesso em: ...
  - **Base de dados:** INSTITUIÇÃO. *Nome da base*. Local, ano. Disponível em: ... Acesso em: ...
  - **Legislação:** BRASIL. Lei nº X, de dia de mês de ano. Ementa. *Diário Oficial da União*, ...
  - **Repositório de código:** AUTOR. *Título do repositório*. Ano. Disponível em: URL. Acesso em: ...
- Referência não conferida fica marcada `[A VERIFICAR]` nos arquivos de instrução e não entra na versão final.

## Tabelas, quadros e figuras

### Diferença entre tabela e quadro
- **Tabela:** dado **numérico** tratado estatisticamente. Laterais abertas; traços horizontais apenas no topo, abaixo do cabeçalho e no fim (IBGE, 1993).
- **Quadro:** conteúdo **textual** ou esquemático (ex.: matriz de evidências, registro de premissas quando textual, SWOT). Bordas fechadas.
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

### Apêndices previstos

| Apêndice | Conteúdo | Origem |
|---|---|---|
| A | Matriz de evidências completa (se não couber no cap. 3) | [metodologia.md](metodologia.md) |
| B | Registro de premissas completo | [financeiro.md](financeiro.md) |
| C | Demonstrativos financeiros detalhados (DRE e fluxo de caixa mensais) | Modelo financeiro |
| D | Checagens de coerência | [financeiro.md](financeiro.md) §5 |
| E | Bloco A — base de estabelecimentos, critérios de curadoria e cardápios | `data/processed/bloco_b_*`, `cardapios_*` |
| F | Blocos B e C — manual de codificação, validação do dicionário, resultados confirmatórios e exploratórios | `data/processed/bloco_c_*`, `avaliadores_*` |
| G | Bloco D — protocolo, sorteio e registros da contagem direta | `data/processed/contagem_*` |
| H | Registro prévio e emendas | `textos/registro_previo_luderia.md` |
| I | Bloco F — correlações, clusters e perfis de jogos (se o bloco for mantido) | `data/processed/bloco_a_*` |
| J | Dicionário de variáveis | A criar no repositório |
| K | Repositório e produto visual — links e instruções de reprodução | README do repositório; `site-apresentacao/` |

Testes estatísticos nos apêndices E a I: informar técnica, N, estatística do teste, valor-p e tamanho de efeito; resultado não significativo também é reportado.
