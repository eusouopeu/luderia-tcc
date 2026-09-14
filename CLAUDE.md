# CLAUDE.md — TCC Luderia

TCC em formato **plano de negócios baseado em evidências** para uma luderia/ludobar/quiz-bar posicionada para o **público casual** (não-hobbyista). A estrutura é de plano de negócios; cada decisão relevante é amarrada a um dado, e cada dado a uma fonte e a um grau de confiança.

## Mapa dos arquivos de instrução

Ler este arquivo sempre. Ler os demais sob demanda, conforme a tarefa.

| Arquivo | Quando ler |
|---|---|
| [instrucoes/estrutura.md](instrucoes/estrutura.md) | Visão do todo; qualquer tarefa que envolva mais de um capítulo ou a ordem dos capítulos |
| [instrucoes/ref-teorico.md](instrucoes/ref-teorico.md) | Cap. 2 — escrita, citação, subcapítulos, lista de leitura |
| [instrucoes/metodologia.md](instrucoes/metodologia.md) | Cap. 3 — subcapítulos, instrumentos de coleta, matriz de evidências |
| [instrucoes/mercado.md](instrucoes/mercado.md) | Cap. 5 — análise de mercado |
| [instrucoes/marketing.md](instrucoes/marketing.md) | Cap. 6 — plano de marketing e estimativa de demanda |
| [instrucoes/operacional.md](instrucoes/operacional.md) | Cap. 7 — plano operacional |
| [instrucoes/juridico.md](instrucoes/juridico.md) | Cap. 8 — aspectos jurídicos e legais |
| [instrucoes/financeiro.md](instrucoes/financeiro.md) | Cap. 9 — premissas, modelo financeiro, sensibilidade |
| [instrucoes/anal-riscos.md](instrucoes/anal-riscos.md) | Cap. 10 — análise estratégica e de riscos |
| [instrucoes/biblio-apendices.md](instrucoes/biblio-apendices.md) | Referências, apêndices, tabelas, quadros, figuras |

Introdução (cap. 1), sumário executivo (cap. 4) e considerações finais (cap. 11) não têm arquivo próprio: seguem a descrição em `estrutura.md`.

## Estado do projeto

- Pastas: `textos/` (projeto de pesquisa, cronograma e capítulos do TCC), `arquivados/` (arquivos fora de uso), `bibliografia/` (PDFs das referências), `instrucoes/` (arquivos de instrução).
- Prazos: ver `textos/cronograma_luderia.md`. Versão final para a banca em 16/11/2026.
- `arquivados/introducao_tcc_luderia.md` e `arquivados/metodologia_tcc_luderia.md` são rascunhos escritos no **desenho anterior (TCC pesquisa de mercado)**, com hipóteses H1–H9. Servem de insumo, mas precisam ser adaptados ao formato plano de negócios: hipóteses e testes estatísticos saem do corpo do texto e vão para apêndice, salvo quando sustentam uma decisão do plano.
- Pipeline de dados em `src/` (`collect_*` → `build_*` → `analise_*`), saídas em `data/processed/`. Blocos de dados, em ordem de relevância (correspondência com os prefixos dos arquivos em `instrucoes/metodologia.md`):
  - **Bloco A** — estabelecimentos concorrentes nas 27 capitais e cardápios → concorrência, preço, A&B, ticket.
  - **Bloco B** — 30 a 50 avaliações mais recentes com texto por estabelecimento → proposta de valor, reclamações, ticket, fluxo.
  - **Bloco C** — histórico pseudonimizado dos avaliadores → nota centrada, perfil de consumo, parcerias.
  - **Bloco D** — contagem direta de ocupação nas duas unidades da São Jogue (Salvador) → ocupação, giro, calibração.
  - **Bloco E** — bases públicas (IBGE, RAIS/CAGED, FipeZap, Simples Nacional, Banco Central) → demanda, custos, tributos, taxa de desconto.
  - **Bloco F** — jogos (Ludopedia, BoardGameGeek) → acervo; menor relevância, pode ser retirado.
- Site de apresentação em `site-apresentacao/`.

## Princípios e preferências

- **Escrita:** usar a skill `meu-estilo-escrita` para qualquer texto em prosa do TCC (frases curtas, lógica dedutiva, tom impessoal, vocabulário técnico direto).
- **Decisão antes de descrição:** todo resultado precisa responder "que decisão do plano isso muda?". Se não muda nenhuma, vai para apêndice ou sai.
- **Nada de número sem fonte.** Toda afirmação quantitativa tem fonte específica (instituição, base, recorte, data), não "internet" ou "estudos mostram".
- **Nada de referência inventada.** Não citar obra que não foi localizada e conferida. Referência não verificada fica marcada como `[A VERIFICAR]`.
- **Incerteza declarada.** Estimativas são apresentadas com faixa (pessimista/provável/otimista) e nível de evidência, nunca como valor único.
- **Sem questionários.** O autor não usa questionários de opinião/intenção (dados atitudinais, viés de amostragem e de não-resposta). Preferir fontes secundárias e primárias comportamentais (ver `instrucoes/metodologia.md`).
- **Normas:** ABNT (detalhes em `instrucoes/biblio-apendices.md`). Instituição: UFBA.
- **Idioma:** português do Brasil em todo o texto, código comentado e nomes de arquivos de saída.

---

## 1. Hierarquia de fontes

Ordem de preferência quando duas fontes tratam do mesmo ponto. Fonte mais alta prevalece; divergência relevante entre fontes é registrada, não escondida.

### 1.1 Fontes para números e premissas

Usar a escala de evidência **N1–N6** definida em [instrucoes/financeiro.md](instrucoes/financeiro.md) §2. Resumo:

1. **N1** — orçamento, cotação, contrato, tabela oficial (legislação, tributos, piso salarial)
2. **N2** — dados públicos estruturados (IBGE, RAIS/CAGED, Receita Federal, FipeZap)
3. **N3** — benchmark de concorrentes medido pelo autor (Blocos A, B e C)
4. **N4** — relatórios setoriais e institucionais (Sebrae, Abrasel, Abrinq)
5. **N5** — coleta primária comportamental própria (contagem, porta falsa, evento piloto)
6. **N6** — estimativa do autor, entrevista informal, imprensa sem dado primário

### 1.2 Fontes bibliográficas e documentais

1. Legislação e normas técnicas oficiais
2. Artigos revisados por pares e livros acadêmicos
3. Teses e dissertações (BDTD, repositórios institucionais)
4. Relatórios de institutos oficiais e entidades setoriais
5. Livros profissionais e manuais de referência (ex.: guias de plano de negócios)
6. Imprensa especializada e de negócios
7. Blogs, sites institucionais de empresas, redes sociais — só como fato pontual (ex.: preço praticado), nunca como sustentação de argumento

Imprensa que cita um dado deve ser substituída pela fonte original sempre que ela for localizável.

## 2. Hierarquia de tipos de dados

Da maior para a menor confiabilidade para estimar comportamento de consumo:

1. **Comportamental com dinheiro** — compra, ingresso pago, pré-venda, depósito
2. **Registros operacionais e transacionais** — dados de caixa, reservas, contratos, cotações
3. **Comportamental observado diretamente** — contagem de ocupação, cliente oculto
4. **Comportamental sem dinheiro** — clique, cadastro em lista de espera, reserva gratuita
5. **Rastros digitais e proxies** — avaliações, volume de buscas, horários de pico, seguidores, público estimado de anúncios
6. **Declarado factual** — entrevista sobre números operacionais ("quantas mesas giram numa sexta?")
7. **Atitudinal** — opinião, intenção de compra, disposição a pagar declarada. **Evitar; nunca usar como base de premissa crítica.**

Critérios de desempate dentro do mesmo tipo:

- **Absoluto > relativo** (pessoas/hora > índice de 0 a 100)
- **Proxy calibrado > proxy não calibrado** (avaliações/mês convertidas por taxa medida > convertidas por taxa suposta)
- **Local > nacional > internacional**
- **Recente > defasado** (corrigir valores monetários antigos pelo IPCA)
- **Medido > estimado**

## 3. Hierarquia de focos

Onde investir tempo, texto e rigor, em ordem de prioridade:

1. **Decisões do plano** — abrir ou não, onde, formato, preço, acervo, investimento
2. **Premissas críticas** — as que mais movem o VPL no tornado; por padrão, **taxa de ocupação** e **ticket médio**
3. **Evidência dessas premissas** — triangulação, calibração, ponto de ruptura
4. **Coerência do conjunto** — capacidade × demanda, equipe × ocupação, preço × concorrência
5. **Contexto descritivo** — setor, tendências, perfil do público
6. **Rigor estatístico acessório** — correlações, testes, clusters que não mudam decisão → apêndice

Na dúvida entre aprofundar um item de nível baixo ou fortalecer um de nível alto, fortalecer o de nível alto.

## 4. Personalização da estrutura

Diferenças deliberadas em relação a um plano de negócios comum. Aplicar sempre.

1. **Metodologia (cap. 3) robusta.** Descreve fontes, critérios de coleta, tratamento, limitações e a hierarquia de evidências. O método é defendido pela **confiabilidade do número gerado**, não pela teoria. Detalhes em `instrucoes/metodologia.md`.
2. **Matriz de evidências** (quadro no cap. 3 ou apêndice). Tabela com: **decisão → pergunta → dado usado → fonte → confiança (N1–N6)**. Ex.: "Em quais capitais abrir?" → densidade de concorrentes (Bloco A) + renda e população (IBGE) → N3 + N2.
3. **Plano financeiro (cap. 9) com premissas rastreáveis**, triangulação e sensibilidade. Detalhes em `instrucoes/financeiro.md`.
4. **Modelo financeiro dirigido por premissas.** Premissas numa aba, cálculos em outra, cenários como parâmetros. Nenhum número digitado dentro de fórmula de cálculo.
5. **Apêndices técnicos** com correlações, clusters, dicionário de variáveis e link para o repositório.
6. **Pipeline reproduzível.** Repositório com coleta → tratamento → análise, README na raiz e dicionário de dados. Qualquer número do texto deve ser regenerável a partir de um script de `src/`.
7. **Produto visual.** Dashboard ou o próprio `site-apresentacao/` com mapa de concorrentes, cenários e sensibilidade.
