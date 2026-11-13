# Princípios do plano

Hierarquias e personalizações que valem para todos os capítulos. Escrita e vocabulário (P5 e P6): [1b_escrita.md](1b_escrita.md).

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

**Precedência entre capítulos**. Os caps. 6 (Plano de Marketing) e 8 (Aspectos Jurídicos e Legais) moldam o negócio: definem o que a luderia é, a quem atende, por quanto e dentro de que regras. Os demais capítulos de plano, em especial o 7 (Plano Operacional) e o 9 (Plano Financeiro), só tornam esse negócio viável. Por isso:

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
7. **Produto visual.** Dashboard ou o próprio `_src/outros/App_Apresentacao/` com mapa de concorrentes, cenários e sensibilidade.

## P7. Desenho enxuto (MVP)

O plano não projeta uma casa do porte da São Jogue, que tem anos de mercado e clientela formada. Projeta uma versão menor, desenhada para reduzir a exposição aos riscos que o tornado aponta: giro de mesa, ocupação e movimento fora do pico. Vale para todos os capítulos.

- **A São Jogue é referência de comportamento, não de porte.** Dela vêm ocupação de pico, pessoas por mesa, permanência e giro (B3); não vêm número de mesas, área, horário nem equipe. As duas unidades ficam dentro dos shoppings Bela Vista e Paralela, e não perto deles. Nas visitas, os instrutores eram 7, 3, 5 e 3 (Bela Vista em 10 e 16/10; Paralela em 17 e 30/10) e, em todas, também atendiam as mesas, cuidavam do balcão e operavam o caixa: não havia caixa, garçom nem atendente separados. Esse arranjo sustenta a equipe sem garçom nem caixa.
- **Salão:** 6 mesas, a maior ocupação vista nas visitas, num ponto que já comporta 8 (decisão do autor, 12/11/2026): de 150 a 200 m², só na Pituba, com aluguel, condomínio e IPTU pela média dos anúncios do B5 nessa faixa. Carga máxima de 7 mesas para 3 pessoas no salão (instrutores e sócio), cerca de 2,3 mesas por pessoa: a maior vista nas visitas (Paralela, 30/10, com os instrutores dando conta do atendimento).
- **Horário (decisão do autor, 12/11/2026):** **de terça a sábado, das 14h às 23h** (45 h por semana). Fecha na segunda, o dia em que mais concorrentes fecham (71% das casas), e no domingo, que só abre na etapa de mesas, das 14h às 20h, com 2 cozinheiros. A diferença de cobertura entre dia útil e fim de semana entra no modelo como ajuste do horário de dia útil (R19).
- **Equipe (decisão do autor, 12/11/2026):** na abertura, 3 empregados e o sócio: 1 cozinheiro-chefe, sem auxiliar de cozinha, 2 instrutores e o sócio na gestão, no caixa e no salão. Turnos de 8 h com 1 h de intervalo, de terça a sábado; todos folgam no domingo e na segunda. O domingo só abre com 2 cozinheiros, na etapa de mesas; nessa escala, todos folgam dois dias por semana (a segunda e mais um), cerca de metade da equipe é de mulheres, que folgam domingo sim, domingo não (CLT, art. 386), e os homens folgam um domingo a cada 4 semanas. Benefícios além dos obrigatórios: refeição no local (custo-benefício, com a cozinha já montada) e PLR de 5% do EBITDA positivo (sem custo quando não há lucro).
- **Tudo o que depende do horário, do salão e da equipe é recalculado:** giros possíveis (horas abertas ÷ permanência), capacidade, equipe, cozinha, área, aluguel, investimento e checagens de coerência.
- **Investimento por etapas.** A casa abre na etapa 1 e só passa à seguinte quando o gatilho dispara e o caixa gerado paga a etapa, com reserva de 2 meses de custo fixo; não há aporte novo. O fluxo de caixa base (cap. 9) é o da etapa 1; as etapas 2 e 3 entram no cap. 10 como opções de expansão, com investimento e efeito estimados.

  | Etapa | O que muda | Gatilho (3 meses seguidos, depois da maturação) |
  |---|---|---|
  | 1. Abertura | 6 mesas; acervo do joelho da curva de presença: os 175 jogos presentes em 12 ou mais dos 30 acervos do B1 (R$ 35 mil no provável, pela mediana de venda nas lojas do B1; ± 15% nos cenários, o 3º quartil da variação do preço do mesmo jogo entre lojas), com sleeves em todas as cartas; cozinha completa desde a abertura (modelo da maioria dos concorrentes, maior fonte de receita e A&B com os dados mais sólidos do B1) | — |
  | 2. Acervo | Acervo até a mediana do B1 (322 títulos), pelos jogos mais pedidos e pelos citados nas avaliações | Pedidos de jogos fora do acervo em pelo menos 10% das mesas; fila pelo mesmo jogo em 1 dia de pico por semana; ou buscas frequentes por jogos para um número de pessoas ou de uma mecânica com pouca oferta no acervo (dados do site de recomendação) |
  | 3. Mesas | +2 mesas (8 no total, no mesmo ponto), instrutores pela carga de 7 mesas para 3 pessoas no salão, segundo cozinheiro e abertura no domingo (14h às 20h) | Ocupação média acima de 85% das mesas nos dias e horários de maior movimento, ou grupos recusados por lotação em todos os fins de semana |

  Os limites dos gatilhos são proposta do autor (N6); o texto declara isso. O cardápio só com comidas recebidas prontas (salgados como coxinha e quibe) não é etapa: é medida de perda máxima, disparada pelo G5 ou pelo G6 do cap. 10.
- **Monitoramento pelo site de recomendação.** Um site no molde do app Tabulado do autor (`~/Codigos/Apps/tabulado`), preenchido pelos clientes ou pelos instrutores: a mesa informa número de pessoas, tempo, idade, peso das regras e estilo, recebe recomendações e tutoriais rápidos dos jogos. As buscas, os jogos escolhidos e os não encontrados alimentam os gatilhos das etapas e os do cap. 10.
- **Ao escrever:** apresentar o porte reduzido como escolha de gestão de risco, com a justificativa, e não como limitação de capital.
