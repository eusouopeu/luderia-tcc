# Regras da UFBA ainda não seguidas

Comparação de 13/11/2026 entre o *Manual de estilo acadêmico* da UFBA, 7. ed. (trechos em `_docs/`: `Normas-UFBA-formatacao-p1.pdf`, p. 57–84; `manual-UFBA-citacao.pdf`, p. 89–95; `manual-UFBA-formatacao-p2.pdf`, p. 115–121), e o que o projeto aplica hoje: skill `formatacao-texto-ufba`, `_docs/_instrucoes/1d_formatacao.md`, `_docs/_instrucoes/10_biblio-apendices.md`, os geradores de `_src/outros/G4_textos/` e os `.md` de `textos/capitulos/`. Só entra o que diverge ou falta; o que já é seguido ficou de fora.

Resolvidos em 13/11/2026 e retirados desta lista: referências à esquerda, em espaço simples, sob o título centralizado (antigos 2.1 e 2.2); 6 pt depois do parágrafo (4.1); datas com o mês por extenso (5.6); unidades no padrão SI, com espaço (5.5, decisão do autor); e número da página no canto superior direito (4.10). Também saíram os itens da capa, da folha de rosto e da folha de aprovação que o autor ajustou no v33 (brasão, corpos, versal, 6 cm). Os demais seguem abertos.

## 1. Citações no texto (afetam todos os capítulos)

| # | Regra da UFBA | Hoje | Onde ajustar |
|---|---|---|---|
| 1.1 | Autor entre parênteses em **versal capitular** (só a inicial maiúscula): (Dornelas, 2021), (Báez, 2006, p. 21). Autor-entidade também: (Sebrae, 2024), (Unesco). Exceção: siglas lidas letra a letra, como IBGE (p. 91, 118) | Caixa alta entre parênteses: (DORNELAS, 2021), (SEBRAE, 2026), (KAM INSIGHT, 2022, p. 17–21) | `.md` dos caps. 1 a 11; `2_ref-teorico.md` e `10_biblio-apendices.md` (modelos); `bibliografia/citacoes_conferidas.md` |
| 1.2 | Órgão da administração direta entra pela jurisdição: (Brasil. Secretaria de Educação Fundamental, 2002, p. 19); na lista, BRASIL. Secretaria de ... (p. 93) | Sem regra; conferir as citações de leis, ministérios e Receita Federal no cap. 8 | Cap. 8; `10_biblio-apendices.md` |
| 1.3 | Obra sem autoria: entrada pela primeira palavra do título seguida de [...]: (Física [...], 2024); na lista, FÍSICA brasileira após Cesar Lattes, A. (artigo inicial vai para o fim) (p. 93–94) | Sem regra | `10_biblio-apendices.md` |
| 1.4 | Documento sem página: localização após a data (Mangabeira, 2023, local §1º) (p. 95) | Sem regra | `10_biblio-apendices.md` |
| 1.5 | Citação direta transcrita sem alteração; supressão com [...] (p. 89) | Já seguido na prática, mas não escrito; vale para as citações `[AV]` em vermelho | `10_biblio-apendices.md` |
| 1.6 | Citação longa a partir de **quatro linhas**, com recuo de **4 cm**, corpo 10 ou 11 e espaço simples (p. 116) | Skill: mais de três linhas e recuo de 6 cm. Hoje o TCC não tem citação longa (o gerador omite linhas `>`) | Skill `formatacao-texto-ufba` |

## 2. Lista de referências

| # | Regra da UFBA | Hoje | Onde ajustar |
|---|---|---|---|
| 2.3 | Na lista entram **todos** os autores, mesmo com quatro ou mais; o et al. fica só na citação do texto (p. 94–95) | Skill: quatro ou mais autores, só o primeiro + et al. também na lista | Skill `formatacao-texto-ufba`; conferir as referências com 4+ autores |
| 2.4 | Ordem alfabética pela NBR 6033:2022: palavra por palavra; números (1 MILHÃO...) antes das letras; artigo inicial ignorado; sinais ignorados (p. 80, 89, 94) | Ordem alfabética simples no gerador | `gerar_docx_capitulo.js` (ordenação) |
| 2.5 | Nome certo do autor e da entidade conferido no Catálogo de Autoridades da Biblioteca Nacional ou no VIAF; sobrenomes com parentesco (ALVES FILHO, João), compostos e com prefixo (p. 79–80, 93) | Sem regra | `10_biblio-apendices.md` |
| 2.6 | Normas em vigor: NBR 14724:**2024** e NBR 6023:**2025** (p. 59, 79) | `10_biblio-apendices.md` cita NBR 14724:2011 e NBR 6023:2018 | `10_biblio-apendices.md`; referências do cap. 3, se citarem as normas |
| 2.7 | A lista pode incluir obras lidas e não citadas (p. 79–80) | Só citadas (decisão própria; a UFBA permite, não obriga) | Nada, salvo decisão em contrário |

## 3. Elementos pré-textuais (`gerar_pretextuais_tmin.py`)

| # | Regra da UFBA | Hoje |
|---|---|---|
| 3.7 | Orientador precedido da titulação (Orientador: Prof. Dr. ...) (p. 59, 63) | Sem titulação |
| 3.8 | Resumo antecedido da **referência completa** do trabalho (SOBRENOME, Nome. **Título**: subtítulo. Ano. Orientador: ... nº f. Trabalho de Conclusão de Curso (Bacharelado em Administração) – Escola de Administração, Universidade Federal da Bahia, Salvador, ano.), e o abstract da mesma referência em inglês (p. 69–72) | Sem referência |
| 3.9 | Resumo sem siglas, citações, fórmulas e frases negativas; primeira frase diz o tema e a categoria (TCC); explicita natureza, abordagem, objetivos, procedimentos, técnicas, população e lócus da pesquisa (p. 69) | Usa IBGE e Fipe; não declara natureza (aplicada), abordagem (quantitativa/qualiquanti), objetivos (descritiva/exploratória) e procedimentos (documental, estudo de campo) |
| 3.10 | Palavras-chave em minúsculas (salvo nomes próprios), separadas por ponto e vírgula, com ponto no fim (p. 70) | Já segue; conferir só o *Keywords* |
| 3.11 | Listas e sumário em tabela de três colunas sem bordas (número, título, página) (p. 73–74). Recomendação, não obrigação | Tabulação com pontilhado |
| 3.12 | Lista de símbolos, se houver, na ordem em que aparecem (p. 73) | Sem lista; avaliar se as fórmulas do cap. 9 (VPL, TIR) usam símbolos que pedem uma |

## 4. Corpo do texto e layout (`gerar_docx_capitulo.js`)

| # | Regra da UFBA | Hoje | Onde ajustar |
|---|---|---|---|
| 4.3 | Título 3 (seção terciária) em negrito, sem caixa alta; o exemplo do manual capitaliza as palavras (2.3.1 Ambiente da pesquisa) (p. 118) | Segue | — |
| 4.4 | Alíneas: letra alinhada à inicial do texto a que se subordina; subalíneas com hífen, sob a primeira letra do texto da alínea (p. 116) | Listas do gerador com recuo de 1,25 cm e deslocamento; não conferido contra a regra | Numeração em `gerar_docx_capitulo.js` (linhas 317–321) |
| 4.5 | Legendas de ilustrações e tabelas em corpo 10 ou 11 e espaço simples (p. 116) | Segue (10 pt, simples) | — |
| 4.6 | Equações destacadas do texto e numeradas com algarismos arábicos entre parênteses, à direita: (1), (2) (p. 121) | Conferir as fórmulas do cap. 9 (VPL, TIR, payback, ponto de equilíbrio) | Cap. 9; gerador |
| 4.7 | Cor preta; cores só nas ilustrações (p. 115) | Segue, salvo o vermelho temporário das citações `[AV]`, que precisa sair da versão final | — |
| 4.8 | Sem caixas de texto; ilustrações inseridas de modo que se movam sem quebrar o texto (p. 58) | Não conferido nas figuras do `.docx` | Gerador de figuras |
| 4.9 | PDF depositado no RI com número em todas as páginas contadas (p. 117) | Número só a partir da introdução, como manda a NBR; o depósito digital pede conferir com a biblioteca da EAUFBA | Decisão do autor |

## 5. Redação (afeta todos os capítulos; `1b_escrita.md`)

| # | Regra da UFBA | Hoje |
|---|---|---|
| 5.1 | Números de **um a dez por extenso** fora de contexto matemático (seis mesas, três empregados, cinco anos); ordinais de primeiro a décimo também; série com números maiores e menores que dez fica toda em algarismos (p. 120) | Algarismos: "6 mesas" (7×), "3 empregados" (7×), "5 anos", "8 mesas" |
| 5.2 | Número no início da frase por extenso (p. 120) | Não conferido |
| 5.3 | Número terminado em vários zeros escrito com palavra: 2,4 milhões, R$ 382 mil (p. 120) | Já usado no resumo; conferir o corpo (fora das tabelas) |
| 5.4 | Hora: algarismos e h sem espaço (9h30, 10h; nunca 08h nem 10h00); "das 14h às 23h", "entre as 10h e as 14h", "até as 23h" sem crase; hora aproximada por extenso ("por volta das 6 horas") (p. 118–119) | Majoritariamente segue ("14h às 23h"); há "1 h" e "40 h" com espaço (duração, ver 5.5) |
| 5.7 | Itálico em títulos de obras citados no texto, palavras estrangeiras e palavras com sentido especial; estrangeirismo já no VOLP fica em redondo (impeachment, deficit, locus) (p. 118) | Conferir "couvert" (5×), "board game(s)" (5×), "ticket médio" (3×), "benchmark"; "layout" está no VOLP |
| 5.8 | Negrito para destaque maior que o do itálico é permitido (p. 118) | Regra própria proíbe negrito no texto corrido; mais restritiva, sem conflito |

## 6. Apêndices e anexos

| # | Regra da UFBA | Hoje |
|---|---|---|
| 6.1 | Identificação "APÊNDICE A – Título" em versal **sem negrito**, ou "Apêndice A – Título" capitalizado **com negrito** (p. 82) | Versal em negrito (`titulo()`), mistura das duas formas |
| 6.2 | Apêndices e anexos continuam a paginação do texto (p. 117) | Segue desde 09/11/2026 (apêndices no mesmo `.docx`) |
| 6.3 | Material de terceiros vai em ANEXO, com a fonte (p. 82–84) | Sem anexos; nada a fazer |

## Prioridade sugerida

1. **Itens 1.1 e 5.1** (citações em versal capitular e números por extenso): mudam todos os capítulos; dá para fazer por script nos `.md`, com conferência.
2. **Itens 3.7 a 3.9** (titulação do orientador e resumo): no `gerar_pretextuais_tmin.py` e no `resumo_abstract.md`.
3. Os demais (2.3 a 2.6, 4.4, 4.6, 5.7, 6.1): ajustes pontuais na skill, nas instruções e no gerador.
