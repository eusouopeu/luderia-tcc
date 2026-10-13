# Estatidez

Explicações de estatística em linguagem simples, para entender e defender as escolhas do método. Não é texto do TCC: é material de estudo do autor.

---

## 1. Sorteio com semente fixa

### O problema que o sorteio resolve

Você precisa conferir algumas avaliações para saber se o script copiou tudo certo. Se você mesmo escolher quais conferir, alguém pode dizer: "você escolheu as fáceis". O sorteio tira essa escolha da sua mão. Mas cria outro problema: como provar que o sorteio foi honesto e que você não sorteou dez vezes até sair um resultado bonito?

A semente fixa resolve esse segundo problema.

### O computador não sorteia de verdade

O computador não joga dados. Ele segue uma receita de conta que gera uma fila de números que **parecem** aleatórios. Por isso eles se chamam **pseudoaleatórios**.

Pense num robô que embaralha cartas. Ele não tem vontade própria: sempre faz os mesmos movimentos. A única coisa que muda o resultado é um número que você fala para ele antes de começar. Esse número é a **semente**.

- Mesma semente → o robô faz os mesmos movimentos → o baralho sai na mesma ordem.
- Semente diferente → movimentos diferentes → outra ordem.

Exemplo em Python:

```python
import random
random.seed(20261013)
random.random()   # sempre 0,6103…, em qualquer computador, toda vez
```

"Semente fixa" quer dizer só isto: o número é escolhido uma vez, escrito no código e nunca mais trocado. Qualquer pessoa que rodar o mesmo código com a mesma semente obtém exatamente o mesmo sorteio.

### Por que o RAND() do Excel não serve

O `RAND()` (ALEATÓRIO, no Excel em português) não tem semente. E sorteia de novo a cada mudança na planilha: você digita algo numa célula e os números mudam. Abriu o arquivo amanhã, a amostra é outra. Ninguém, nem você, consegue mostrar qual foi o sorteio "oficial".

### O método da chave fixa, passo a passo

É uma rifa. Cada avaliação recebe um bilhete com um número, e ganham os menores números.

1. **Escolher a semente antes de tudo** e escrevê-la no código e na planilha (ex.: a data do dia, 20261013). A escolha é arbitrária. O que importa é que seja anterior ao sorteio e não seja trocada depois.
2. **Dar um bilhete para cada avaliação.** O script usa a semente para gerar um número entre 0 e 1 para cada review_id. Esse número é a **chave**. Ele é gravado na planilha como valor, e não como fórmula, para não mudar mais.
3. **Separar em urnas (estratos).** Cada estabelecimento é uma urna. As avaliações de uma luderia só concorrem com as da mesma luderia.
4. **Decidir quantas sair de cada urna** (o *n_h*). Isso é a parte de tamanho de amostra, nas seções 2 e 3.
5. **Ganham os menores bilhetes de cada urna.** Uma fórmula viva (`COUNTIFS`) conta, para cada avaliação, quantas da mesma urna têm bilhete menor. Se essa contagem for menor que *n_h*, a avaliação entra na amostra.
6. **Conferir o total:** a soma dos *n_h* tem que dar o *n* total, com diferença zero.
7. **Registrar antes de conferir:** commit da planilha com a data, antes da primeira conferência, do mesmo jeito que foi feito no sorteio das visitas do B3.

O sorteio fica no passo 2 e é feito uma vez só. Toda a regra de quem entra (passos 3 a 6) fica à vista em fórmulas que você consegue auditar.

### Consequências para a pesquisa

O que você ganha:
- **Reprodutibilidade.** Qualquer pessoa repete o sorteio e chega à mesma amostra. É isso que a banca quer dizer quando pergunta "como eu confiro isso?".
- **Imparcialidade.** Quem decidiu quais avaliações conferir foi o sorteio, e não você.
- **Transparência.** A regra de seleção está nas fórmulas, e a semente e o código estão no repositório.

O que você assume:
- **Não pode sortear de novo** porque não gostou do resultado. Se precisar sortear de novo (ex.: a base mudou), registra o motivo, a nova semente e a data.
- **A amostra é justa, não "boa".** O sorteio pode, por azar, pegar avaliações parecidas. Isso não é defeito: é o que o intervalo de confiança (seção 3) já leva em conta.
- **Qualquer semente vale o mesmo.** Não existe semente melhor. Escolher uma data é só um jeito fácil de mostrar que ela foi escolhida antes.

### Como responder à banca

> "O sorteio usou um gerador pseudoaleatório com semente fixa, registrada no código antes da seleção. Cada avaliação recebeu uma chave aleatória, e foram selecionadas as de menor chave dentro de cada estabelecimento, na quantidade definida pelo cálculo de tamanho da amostra. Com a mesma semente, qualquer pessoa reproduz exatamente a mesma amostra."

Se perguntarem qual gerador: o `random` do Python usa o Mersenne Twister (Matsumoto; Nishimura, 1998).

---

## 2. Fórmula de Cochran

### A pergunta que ela responde

"Quantas pessoas eu preciso entrevistar para saber uma porcentagem com margem de erro de X pontos?"

É a conta das pesquisas eleitorais: "o candidato tem 40%, com margem de 3 pontos para mais ou para menos".

### A ideia

Se você prova uma colherada de sopa, tem uma ideia do sal da panela inteira. Com mais colheradas, a ideia fica mais certa. A fórmula de Cochran diz quantas colheradas são precisas para errar no máximo X pontos.

```
n = z² × p × (1 − p) ÷ e²
```

- **z** = 1,96 para 95% de confiança (explicado na seção 3);
- **p** = o palpite da porcentagem que você vai achar. Sem palpite, usa-se 0,5, que é o pior caso e dá o maior *n*;
- **e** = a margem de erro que você aceita (0,05 = 5 pontos).

Exemplo: 1,96² × 0,5 × 0,5 ÷ 0,05² = **384**.

Quando a população é pequena, existe uma correção (correção para população finita):

```
n ajustado = n ÷ (1 + (n − 1) ÷ N)
```

Com N = 2.000 avaliações, os 384 caem para cerca de 322. Com N = 500, para cerca de 217.

### Por que não serve bem para a sua auditoria

Cochran responde a pergunta "qual é a porcentagem, com margem para os dois lados?". A sua pergunta é outra: "a taxa de erro do script é, no máximo, 5%?". Você quer só um teto, não uma margem para cima e para baixo. E a taxa de erro esperada é perto de zero, onde a fórmula de Cochran funciona mal: com p perto de 0 ela dá um *n* pequeno demais, e com p = 0,5 dá um *n* grande demais.

---

## 3. Intervalo de Wilson

### Primeiro: o que é um intervalo de confiança

Você conferiu 100 avaliações e achou 1 erro. A taxa de erro **da amostra** é 1%. Mas a taxa **de verdade**, em todas as avaliações, pode ser um pouco maior ou um pouco menor: você viu só um pedaço.

O intervalo de confiança é uma rede. Ele diz: "a taxa de verdade provavelmente está entre tanto e tanto". Os "95%" querem dizer que, se você repetisse o sorteio muitas vezes, a rede pegaria a taxa de verdade em 95 de cada 100 vezes. O 1,96 da fórmula é o número que deixa a rede desse tamanho.

### Por que não a fórmula mais simples

A fórmula que aparece em todo livro (chamada de Wald) é:

```
p ± 1,96 × √( p × (1 − p) ÷ n )
```

Ela quebra justamente no seu caso. Se você conferir 100 avaliações e achar **zero** erros, ela dá p = 0 e intervalo de 0% a 0%. Ela diz que o script é perfeito com certeza, e isso é absurdo: você só olhou 100.

### O que o Wilson faz

Edwin Wilson (1927) montou a rede de outro jeito, e ela continua com tamanho de verdade mesmo quando você acha zero erros. Com zero erros, o teto fica:

```
limite superior = 1,96² ÷ (n + 1,96²) = 3,84 ÷ (n + 3,84)
```

Com 100 avaliações e zero erros: 3,84 ÷ 103,84 = **3,7%**. Em palavras: "não achei erro em 100, então a taxa de verdade provavelmente não passa de 3,7%".

A fórmula completa, para qualquer número de erros *k* em *n* conferidas (p = k ÷ n, z = 1,96):

```
centro  = (p + z² ÷ 2n) ÷ (1 + z² ÷ n)
meia-largura = z × √( p(1 − p) ÷ n + z² ÷ 4n² ) ÷ (1 + z² ÷ n)
intervalo = centro ± meia-largura
```

Brown, Cai e DasGupta (2001) e Newcombe (1998) compararam vários intervalos para proporções e recomendam o Wilson no lugar do Wald, sobretudo com amostra pequena ou taxa perto de 0.

### Como o método usa o Wilson

Regra: a variável é aprovada se o **teto** do intervalo de Wilson for de no máximo 5%.

| Conferidas (n) | Erros achados | Intervalo de 95% | Aprovada? |
|---|---|---|---|
| 20 | 0 | 0% a 16,1% | Não: amostra pequena demais para provar algo |
| 100 | 0 | 0% a 3,7% | Sim |
| 100 | 1 | 0,2% a 5,5% | Não |
| 200 | 3 | 0,5% a 4,3% | Sim |
| 200 | 4 | 0,8% a 5,0% (5,03%) | Não, por pouco |

Daí sai o tamanho mínimo: com zero erros, o teto só fica abaixo de 5% a partir de **73** avaliações conferidas. Com menos que isso, nem uma conferência perfeita aprova a variável.

### Cochran e Wilson juntos

- **Cochran:** "quero uma margem de X; de quantas conferências preciso?" Pergunta feita **antes**, com margem para os dois lados.
- **Wilson:** "vi *k* erros em *n*; até onde pode ir a taxa de verdade?" Pergunta feita **depois**, sobre o que você viu.

No seu método, o Wilson é usado também ao contrário, para escolher o *n*: qual o menor *n* que ainda aprova a variável se você achar 0, 1, 2… erros? É por isso que a tabela acima serve para decidir o tamanho da amostra.

---

## Referências citadas

Todas `[A VERIFICAR]` até a conferência da obra.

- BROWN, Lawrence D.; CAI, T. Tony; DASGUPTA, Anirban. Interval estimation for a binomial proportion. *Statistical Science*, v. 16, n. 2, p. 101-133, 2001. `[A VERIFICAR]`
- COCHRAN, William G. *Sampling techniques*. 3. ed. New York: Wiley, 1977. `[A VERIFICAR]`
- MATSUMOTO, Makoto; NISHIMURA, Takuji. Mersenne twister: a 623-dimensionally equidistributed uniform pseudo-random number generator. *ACM Transactions on Modeling and Computer Simulation*, v. 8, n. 1, p. 3-30, 1998. `[A VERIFICAR]`
- NEWCOMBE, Robert G. Two-sided confidence intervals for the single proportion: comparison of seven methods. *Statistics in Medicine*, v. 17, n. 8, p. 857-872, 1998. `[A VERIFICAR]`
- WILSON, Edwin B. Probable inference, the law of succession, and statistical inference. *Journal of the American Statistical Association*, v. 22, n. 158, p. 209-212, 1927. `[A VERIFICAR]`
