# CLAUDE.md — TCC Luderia

TCC em formato **plano de negócios baseado em evidências** para uma luderia/ludobar/quiz-bar em **Salvador**, posicionada para o **público casual** (não-hobbyista). A estrutura é de plano de negócios; cada decisão relevante é amarrada a um dado, e cada dado a uma fonte e a um grau de confiança.

## Mapa dos arquivos de instrução

Ler este arquivo sempre. Ler os demais sob demanda, conforme a tarefa.

| Arquivo | Quando ler |
|---|---|
| [_instrucoes/1_estrutura.md](_instrucoes/1_estrutura.md) | Visão do todo; qualquer tarefa que envolva mais de um capítulo ou a ordem dos capítulos |
| [_instrucoes/2_ref-teorico.md](_instrucoes/2_ref-teorico.md) | Cap. 2 — escrita, citação, subcapítulos, lista de leitura |
| [_instrucoes/4_metodologia.md](_instrucoes/4_metodologia.md) | Cap. 3 — subcapítulos, instrumentos de coleta, matriz de evidências |
| [_instrucoes/3_mercado.md](_instrucoes/3_mercado.md) | Cap. 5 — análise de mercado |
| [_instrucoes/5_marketing.md](_instrucoes/5_marketing.md) | Cap. 6 — plano de marketing e estimativa de demanda |
| [_instrucoes/7_operacional.md](_instrucoes/7_operacional.md) | Cap. 7 — plano operacional |
| [_instrucoes/6_juridico.md](_instrucoes/6_juridico.md) | Cap. 8 — aspectos jurídicos e legais |
| [_instrucoes/8_financeiro.md](_instrucoes/8_financeiro.md) | Cap. 9 — premissas, modelo financeiro, sensibilidade |
| [_instrucoes/9_anal-riscos.md](_instrucoes/9_anal-riscos.md) | Cap. 10 — análise estratégica e de riscos |
| [_instrucoes/10_biblio-apendices.md](_instrucoes/10_biblio-apendices.md) | Referências, apêndices, tabelas, quadros, figuras |

A numeração dos arquivos de instrução é a ordem de leitura, não o número do capítulo. Introdução (cap. 1), sumário executivo (cap. 4) e considerações finais (cap. 11) não têm arquivo próprio: seguem a descrição em `_instrucoes/1_estrutura.md`.

## Estado do projeto

- Pastas: `textos/` (projeto de pesquisa, cronograma e capítulos do TCC), `arquivados/` (arquivos fora de uso), `bibliografia/` (PDFs das referências e `referencias_bases_publicas.md`), `_instrucoes/` (arquivos de instrução), `_src/` (scripts), `_data/` (dados), `_logs/` (logs de erro das coletas).
- Prazos: ver `textos/cronograma_luderia.md`. Versão final para a banca em 16/11/2026.
- `arquivados/introducao_tcc_luderia.md` e `arquivados/metodologia_tcc_luderia.md` são rascunhos escritos no **desenho anterior (TCC pesquisa de mercado)**, com hipóteses H1–H9. Servem de insumo, mas precisam ser adaptados ao formato plano de negócios: hipóteses e testes estatísticos saem do corpo do texto e vão para apêndice, salvo quando sustentam uma decisão do plano.
- Pipeline de dados em `_src/[bloco] Fonte/` (`collect_*` → `build_*` → `analise_*`). Brutos em `_data/raw/[bloco] Nome/`, processados em `_data/processed/[bloco] Nome/`, com uma subpasta por bloco (letra entre colchetes). Cada script define `ROOT = Path(__file__).resolve().parents[2]` e roda de qualquer diretório. Os prefixos dos arquivos seguem o desenho anterior (ex.: Bloco A gera `bloco_b_*`); a correspondência está em `_instrucoes/4_metodologia.md`. Blocos de dados, em ordem de relevância:
  - **Bloco A** — estabelecimentos concorrentes com mais de 100 avaliações nas 14 capitais classificadas como metrópole pela REGIC (IBGE), e seus cardápios → concorrência, preço, ticket. O modelo de alimentos e bebidas (cozinha própria, parceria ou só bar) não é avaliado.
  - **Bloco B** — todas as avaliações com texto publicadas até "um mês atrás" (rótulo do Google Maps na data da coleta), por estabelecimento → proposta de valor, reclamações, ticket, fluxo.
  - **Bloco C** — retirado em 18/09/2026 (histórico dos avaliadores). A letra não é reaproveitada.
  - **Bloco D** — contagem direta, do lado de fora, nas duas unidades da São Jogue (Salvador): 2 visitas sorteadas e 2 de retorno 15 dias depois, com leitura do número da NFC-e → ocupação, giro, transações no intervalo, calibração.
  - **Bloco E** — bases públicas (IBGE, Novo CAGED, FipeZap, Simples Nacional, Banco Central, CONCLA) → demanda, custos, tributos, taxa de desconto. Coletado em 14/09/2026; referências ABNT em `bibliografia/referencias_bases_publicas.md`. As saídas tratadas ficam em subpastas por uso no plano (`Mercado e demanda/`, `Ponto e operacoes/`, `Juridico e tributario/`, `Financeiro/`, `Multiuso/`), definidas em `USOS` no `bases_comum.py`.
  - **Bloco F** — jogos (Ludopedia, BoardGameGeek) → acervo; menor relevância, pode ser retirado.
- Site de apresentação em `site-apresentacao/`.

## Versionamento

- **Commit e push automáticos.** Após qualquer modificação em arquivos do projeto, fazer o commit local e, em seguida, o push para o repositório do GitHub (`origin`, branch atual). Não é preciso pedir confirmação.
- Um commit por conjunto coerente de mudanças, com mensagem em português que diga o que mudou e por quê.
- Antes do commit, conferir com `git status` se nenhum arquivo ignorado por regra do `.gitignore` (dados brutos, `.env`, CAGED, zips) entrou por engano.
- Se o push falhar (conflito, rede, autenticação), informar o erro ao autor em vez de forçar (`--force`).

## Princípios e preferências

- **Escrita:** usar a skill `meu-estilo-escrita` para qualquer texto em prosa do TCC (frases curtas, lógica dedutiva, tom impessoal, vocabulário técnico direto).
- **Tabela agregada fecha com o total.** Em toda tabela com linhas por grupo (capital, UF, região, categoria) e linha de total:
  - cada unidade (place_id, avaliação, jogo) conta em **um único grupo**, atribuído por atributo próprio dela (ex.: UF do endereço), nunca pelo contexto da coleta (ex.: capital da busca que a encontrou);
  - antes de entregar, somar as linhas de cada coluna e comparar com o total; a diferença deve ser zero. Se a tabela for de contagem não exclusiva por desenho, isso fica escrito no nome da coluna e na docstring, e o total não é apresentado como soma;
  - vale também ao rodar de novo um script existente: ler a regra de atribuição antes de confiar na saída. Gráfico feito a partir da linha de total não dispensa conferir as linhas.
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
2. **Matriz de evidências** (quadro no cap. 3 ou apêndice). Tabela com: **decisão → pergunta → dado usado → fonte → confiança (N1–N6)**. Ex.: "Em que bairro de Salvador abrir?" → população e renda por bairro (IBGE) + localização dos concorrentes (Bloco A) → N2 + N3.
3. **Plano financeiro (cap. 9) com premissas rastreáveis**, triangulação e sensibilidade. Detalhes em `instrucoes/financeiro.md`.
4. **Modelo financeiro dirigido por premissas.** Premissas numa aba, cálculos em outra, cenários como parâmetros. Nenhum número digitado dentro de fórmula de cálculo.
5. **Apêndices técnicos** com correlações, clusters, dicionário de variáveis e link para o repositório.
6. **Pipeline reproduzível.** Repositório com coleta → tratamento → análise, README na raiz e dicionário de dados. Qualquer número do texto deve ser regenerável a partir de um script de `src/`.
7. **Produto visual.** Dashboard ou o próprio `site-apresentacao/` com mapa de concorrentes, cenários e sensibilidade.
