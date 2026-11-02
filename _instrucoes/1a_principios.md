# Princípios do plano

Hierarquias e personalizações que valem para todos os capítulos. Parte de [1_estrutura.md](1_estrutura.md), separada em 31/10/2026; a numeração P1 a P4 foi mantida. P7 (desenho enxuto) entrou em 02/11/2026. Escrita e vocabulário (P5 e P6): [1b_escrita.md](1b_escrita.md).

## P1. Hierarquia de fontes

Ordem de preferência quando duas fontes tratam do mesmo ponto. Fonte mais alta prevalece; divergência relevante entre fontes é registrada, não escondida.

Fontes bibliográficas e documentais (para números e premissas, usar a escala N1–N6 de [8_financeiro.md](8_financeiro.md) §2):

1. Legislação e normas técnicas oficiais
2. Artigos revisados por pares e livros acadêmicos
3. Teses e dissertações (BDTD, repositórios institucionais)
4. Relatórios de institutos oficiais e entidades setoriais
5. Livros profissionais e manuais de referência (ex.: guias de plano de negócios)
6. Imprensa especializada e de negócios
7. Blogs, sites institucionais de empresas, redes sociais — só como fato pontual (ex.: preço praticado), nunca como sustentação de argumento

Imprensa que cita um dado deve ser substituída pela fonte original sempre que ela for localizável.

## P2. Hierarquia de tipos de dados

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

## P3. Hierarquia de focos

Onde investir tempo, texto e rigor, em ordem de prioridade:

1. **Decisões do plano** — abrir ou não, onde, formato, preço, acervo, investimento
2. **Premissas críticas** — as que mais movem o VPL no tornado; por padrão, **taxa de ocupação** e **ticket médio**
3. **Evidência dessas premissas** — triangulação, calibração, ponto de ruptura
4. **Coerência do conjunto** — capacidade × demanda, equipe × ocupação, preço × concorrência
5. **Contexto descritivo** — setor, tendências, perfil do público
6. **Rigor estatístico acessório** — correlações, testes, clusters que não mudam decisão → apêndice

Na dúvida entre aprofundar um item de nível baixo ou fortalecer um de nível alto, fortalecer o de nível alto.

**Precedência entre capítulos** (pedido do autor em 31/10/2026). Os caps. 6 (Plano de Marketing) e 8 (Aspectos Jurídicos e Legais) moldam o negócio: definem o que a luderia é, a quem atende, por quanto e dentro de que regras. Os demais capítulos de plano, em especial o 7 (Plano Operacional) e o 9 (Plano Financeiro), só tornam esse negócio viável. Por isso:

1. Em informação divergente entre capítulos, valem os caps. 6 e 8; os outros se ajustam a eles, e não o contrário.
2. Toda mudança nos caps. 6 ou 8 leva a um alerta imediato ao autor, na mesma resposta, com os capítulos a ajustar (7, 9, 10, 4, 11 e, se for o caso, 3 e 5) e o que muda em cada um. O alerta não autoriza ajustar os outros capítulos sem pedido do autor.
3. Se a viabilidade (caps. 7 e 9) pedir mudança no negócio, a proposta vai ao autor como mudança nos caps. 6 ou 8, e não como ajuste silencioso no operacional ou no financeiro.

## P4. Personalização da estrutura

Diferenças deliberadas em relação a um plano de negócios comum. Aplicar sempre.

1. **Metodologia (cap. 3) robusta.** Descreve fontes, critérios de coleta, tratamento, limitações e a hierarquia de evidências. O método é defendido pela **confiabilidade do número gerado**, não pela teoria. Detalhes em [4_metodologia.md](4_metodologia.md).
2. **Matriz de evidências** (quadro no cap. 3 ou apêndice). Tabela com: **decisão → pergunta → dado usado → fonte → confiança (N1–N6)**. Ex.: "Em que bairro de Salvador abrir?" → população e renda por bairro (IBGE) + localização dos concorrentes (Bloco B1) → N2 + N3.
3. **Plano financeiro (cap. 9) com premissas rastreáveis**, triangulação e sensibilidade. Detalhes em [8_financeiro.md](8_financeiro.md).
4. **Modelo financeiro dirigido por premissas.** Premissas numa aba, cálculos em outra, cenários como parâmetros. Nenhum número digitado dentro de fórmula de cálculo.
5. **Apêndices técnicos** com protocolos, dicionário de variáveis e link para o repositório (lista em [10_biblio-apendices.md](10_biblio-apendices.md)).
6. **Pipeline reproduzível.** Repositório com coleta → tratamento → análise, README na raiz e dicionário de dados. Qualquer número do texto deve ser regenerável a partir de um script de `_src/`.
7. **Produto visual.** Dashboard ou o próprio `_src/site-apresentacao/` com mapa de concorrentes, cenários e sensibilidade.

## P7. Desenho enxuto (MVP)

Decisão do autor em 02/11/2026. O plano não projeta uma casa do porte da São Jogue, que tem anos de mercado e clientela formada. Projeta uma versão menor, desenhada para reduzir a exposição aos riscos que o tornado aponta: giro de mesa, ocupação e movimento fora do pico. Vale para todos os capítulos.

- **A São Jogue é referência de comportamento, não de porte.** Dela vêm ocupação de pico, pessoas por mesa, permanência e giro (B3); não vêm número de mesas, área, horário nem equipe.
- **Salão:** 6 mesas, a maior ocupação vista nas visitas. Teto de carga de 2 mesas (cerca de 10 clientes) por instrutor no pico.
- **Horário:** 8 horas contínuas por dia, de terça a domingo, na janela com mais luderias abertas em cada dia (B1, 49 casas, horário do Google Maps). O texto declara essa regra como simplificação. Resultado: **de terça a sexta, das 15h às 23h; sábado e domingo, das 14h às 22h** (48 h por semana). A casa fecha na segunda, o dia em que mais concorrentes fecham (71% das casas).
- **Equipe:** dois cozinheiros-chefes, sem auxiliar de cozinha: pelo menos um em cada dia útil (terça a quinta) e os dois nos dias de pico (sexta a domingo). Instrutores de tempo integral folgam na segunda e em um dia entre terça e quinta. Um instrutor de meio período, 20 h por semana: das 17h às 22h na quinta e na sexta e das 15h às 20h no sábado e no domingo. Dias úteis com 2 instrutores e dias de pico com 3, no mínimo.
- **Tudo o que depende do horário, do salão e da equipe é recalculado:** giros possíveis (horas abertas ÷ permanência), capacidade, equipe, cozinha, área, aluguel, investimento e checagens de coerência.
- **Crescimento é etapa posterior,** condicionada ao desempenho observado (mais mesas, horas ou dias). Não entra no fluxo de caixa base; pode aparecer como opção no cap. 10 ou 11.
- **Ao escrever:** apresentar o porte reduzido como escolha de gestão de risco, com a justificativa, e não como limitação de capital.
