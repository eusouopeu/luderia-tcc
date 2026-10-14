# Pendências

Tudo o que está em aberto, num só lugar. Quando um item for resolvido, ele sai daqui: decisão vai para [decisoes.md](decisoes.md), dúvida respondida vai para o texto ou para as instruções, e ideia adotada vai para o cronograma.

## Decisões a tomar

1. **Validação proporcional da coleta (em estudo, não adotada).** Até decidir, vale o procedimento de `_instrucoes/4_metodologia.md` §3.4, e a proposta não entra no texto. A proposta:
   - B1 e B2, fidelidade: amostra aleatória de 30 estabelecimentos e 100 avaliações, conferidos na página (nota, volume, endereço; texto, nota e rótulo de data);
   - B2, codificação: o autor recodifica 10% das avaliações depois de no mínimo 14 dias, sem consultar a primeira codificação; concordância pelo kappa de Cohen;
   - B4, reconciliação: cada série usada no plano conferida com o portal de origem em ao menos um período e um recorte;
   - erro total da pesquisa (TSE) em uma frase com citação, não numa seção.

   Antes de adotar, estudar: com zero erros, o limite superior de 95% de Wilson é 3,84 ÷ (n + 3,84), cerca de 11% com n = 30 e 3,7% com n = 100. Então 30 estabelecimentos não cumprem o critério de 5%: ou a amostra do B1 sobe para perto de 75, ou o critério muda. Falta ainda ver se a banca aceita a concordância de um codificador consigo mesmo e como estratificar uma amostra pequena (capital e faixa de volume).
2. **Hipótese do público potencial** (30 anos ou mais, casado ou com filhos, que frequentaria luderias se o ambiente, o público ou o serviço mudassem): registrar como emenda ao registro prévio ou guardar como estudo futuro (cap. 11.5)? Formulações testáveis em `docs/bibliografia/diagnostico-teorico.md` §9.
3. **Replanejar os rascunhos atrasados** (caps. 2, 3 e 8 e seções 5.1, 5.4 e 5.5) ou acionar o plano de corte do cronograma?

## Divergências entre documentos, ainda sem correção

- `_instrucoes/1_estrutura.md` (3.5) fala em "metade exploratória e confirmatória", e o cronograma (semana 3) tem a tarefa "Divisão da base em parte exploratória e parte confirmatória"; a metodologia adotou a base única em 13/10.
- `_instrucoes/1_estrutura.md` (11.5) cita "sem o recorte do último mês"; o recorte vigente é de 3 meses.
- O cronograma ainda fala em "avaliações do último mês" (semana 2).

## Dúvidas

- **Entorno no Maps, três primeiras extrações (14/10):** os CSVs ficaram só no Mac do autor e não foram conferidos linha a linha. Recoletar os três estabelecimentos com a versão 2026.10.14-2 ("Refazer pendentes" já os inclui, pela busca de trem) e rodar o `build_B1_entorno_maps.py`, que move os CSVs para `_data/raw/[B1] Estabelecimentos e cardapios/entorno_maps/`.
- **Tabela de sistemas por metrópole (`SEM_SISTEMA` no `maps_entorno.user.js`):** montada sem fonte oficial conferida. Pontos de menor segurança: ausência de BRT em operação em Florianópolis, Manaus e Vitória; ausência de VLT em Salvador (obra em andamento; a busca de VLT foi mantida); trem só como metropolitano (o de passageiros da Vitória a Minas, intermunicipal, fica de fora). Conferir nos sites dos operadores antes da coleta em massa.
- Perguntas abertas para a literatura (validação de avaliações online como medida de visitas, estabilidade da razão avaliações ÷ visitantes, limiar de concordância para variáveis raras, peso de comida, serviço e ambiente, taxa de desconto de negócio pequeno, termos de uso do Google Maps): `docs/bibliografia/lacunas-bibliograficas.md` §6.
- Datas e horários das visitas: o roteiro de campo (`textos/instrumentos/roteiro_observacao_sao_jogue.md`) ainda marca 18h00 às 21h00 nas quatro visitas, e o cronograma (semana 4) chama a de 03/10 de "visita pré-teste". Confirmar se as primeiras visitas foram em 03/10 com entrada às 19h.

## Ideias futuras

- Extensões fora do escopo atual (durações citadas nos textos, contagem em outra capital, recoleta do volume total, teste da porta falsa): `_instrucoes/4_metodologia.md`, "Extensões fora do escopo atual".
- Simulação de Monte Carlo e testes H1–H9, se sobrar tempo (apêndices L e M).
- Hipótese do público potencial, se não virar emenda (item 2).
