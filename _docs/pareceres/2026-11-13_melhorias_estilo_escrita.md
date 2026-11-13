# Melhorias no estilo da escrita do TMin v35

Análise de 13/11/2026 dos `.md` de `textos/capitulos/` (caps. 1 a 11 e resumo) contra a P5 e a P6 (`_docs/_instrucoes/1b_escrita.md`) e a skill `meu-estilo-escrita`. São só sugestões: nada foi mudado nos capítulos.

## O que já está bom

Varredura automática da prosa (sem tabelas, títulos e legendas): nenhum termo arcaico (*viabiliza*, *ademais*, *destarte*), nenhuma passiva sintética ("adotou-se"), nenhum "Tais" no início de frase e nenhuma frase de metadiscurso ("Esta seção apresenta…"). Os parágrafos de resultado abrem pela conclusão na maioria dos casos (ex.: 11.1, "A luderia em Salvador é viável nas premissas prováveis deste plano, com margem estreita na demanda."). Não há o que corrigir nesses pontos.

## Sugestões, por ganho

### 1. Parágrafos longos demais (maior ganho de leitura)

A P5 e a skill pedem uma ideia por parágrafo. Há 80 parágrafos com mais de 110 palavras, metade deles nos caps. 9 (15), 6 (10), 3 (10), 1 (7) e 11 (7). O padrão é o mesmo: o parágrafo abre pela conclusão, mas junta duas ou três ideias com números próprios.

| Onde | Palavras | Ideias misturadas | Sugestão de corte |
|---|---|---|---|
| 6.3, taxa de entrada ("Dos 63 concorrentes do B1, 31 cobram…") | 247 | (a) quem cobra; (b) regra da média; (c) São Jogue no alto da faixa; (d) defasagem das fontes | Quatro parágrafos: (a+b), (c), dia útil × fim de semana, e as ressalvas (d) numa nota da Tabela A.2 |
| 11.1, primeiro parágrafo | 239 | viabilidade, folga operacional, VPL sem residual, rupturas, Monte Carlo, decisão | Dois: o resultado (VPL, TIR, residual) e o risco (rupturas, Monte Carlo, decisão de investir) |
| 3.2, população do B1 ("O primeiro recorte…") | 201 | lugar, metrópoles, buscas, curadoria, corte de 100 | Dois: recortes (lugar e metrópoles) e o processo (buscas → 164 → 63), com o corte de 100 logo depois do número que ele explica |
| 6.1, proposta de valor ("O Interlúdio vende…") | 187 | posicionamento e o resultado da PRC | Dois: posicionamento, depois os números do B2 que o sustentam |
| 3.2, variáveis do B1 ("De cada concorrente…") | 179 | cardápio, couvert, cesta de jogos, entorno | Uma variável por frase já está; cabe virar lista curta ou ir para o Quadro 3.x |

### 2. Vocabulário controlado (P6) com sinônimos proibidos

Registrado como D90 em `_docs/melhorias-texto.md`.

- **"casa" por "concorrente":** 53 ocorrências fora de citação (cap. 5: 16; cap. 6: 10; cap. 7: 8; cap. 3: 7; cap. 9: 6). A P6 proíbe "casa" fora de citação. Decisão do autor: trocar por "concorrente(s)" ou "luderia(s)" ou liberar "casa" na P6 (a palavra é natural no texto e não gera ambiguidade, mas vários trechos alternam "concorrentes" e "casas" na mesma frase, o que a P6 quer evitar).
- **"movimento"** (18 ocorrências; caps. 9: 6, 3: 4, 6: 4) no lugar de fluxo ou circulação: "o movimento cresce até o nível maduro" (9.2) é fluxo; "o índice mede o movimento de todos os dias" (6.2) é circulação relativa.
- **"gasto médio"** (6.3 e 9.1) no lugar de "ticket médio" ou "gasto por pessoa", que é como a R06 aparece no resto do texto.
- **"público"** (21 ocorrências): só vale quando é público-alvo; como sinônimo de fluxo ("o público de jogos de carta"), trocar.

### 3. Adjetivos e advérbios sem número (P5.3)

Ocorrências pontuais, a maioria no cap. 1, que é a primeira página que a banca lê:

- 1, §1: "O consumo passa por uma mudança de padrão" e "cada vez mais estabelecimentos convertem a oferta…" afirmam tendência sem fonte (já é a D88). Ou entra a fonte, ou a frase começa pelo número do IBGE ("Entre 2019 e 2023, a receita dos serviços prestados às famílias passou de R$ 223,9 bilhões para R$ 388,9 bilhões").
- 1, §2: "atualmente conta com", "principalmente capitais", "ramo recente mais amplo": "atualmente" sai (a data da fonte já diz); "principalmente capitais" vira número (das 63 luderias do B1, quantas estão nas capitais).
- 6.1: "para todos os tipos de grupos e de pessoas" — afirma sem medir; trocar pelo que o acervo cobre (faixa de jogadores e de duração da cesta de jogos).
- "tende a ficar acima/abaixo" (caps. 7, 9 e 11, 4 vezes): é um hedge; vale manter só onde há fonte para a direção do viés (anúncio × contrato; admissão × salário de quem fica) e citar a fonte na mesma frase.

### 4. Travessão (P5.6) e traço em faixas

O texto não tem nenhum travessão (—): os apostos usam meia-risca (–), e o cap. 1 usa hífen com espaços num aposto ("taxa de ocupação e ticket médio - costumam", no parágrafo "Um investimento nesse formato…"). A D15 já registra o problema. Regra prática para a revisão de forma: aposto e intercalação com "—" sem espaço extra ou com espaços, de forma única; "–" só em intervalos de página ("p. 17–21"); hífen só em palavra composta. A skill `meu-estilo-escrita` pede hífen; vale a P5.6, que é do projeto.

### 5. Frases-fórmula e legendas presas no parágrafo

Nos caps. 6 e 9, as contas (ex.: "6,40 × 7,69 = 49,2 pessoas por dia de fim de semana") estão no meio do parágrafo, sem recuo nem numeração da equação em todas. Sugestão: equação numerada em linha própria, como já está a (1) e a (2), e o parágrafo seguinte começando pelo resultado ("O dia útil recebe 63,7% do fim de semana, porque…").

### 6. Resumo

A mediana das frases do resumo é a maior do texto (38 palavras por frase contra 15 a 21 nos capítulos). Duas frases passam de 60 palavras. Sugestão: uma informação por frase, como no resto do texto, e cortar "Este trabalho de conclusão de curso" (o objetivo pode abrir por "O trabalho elabora um plano de negócios…").

### 7. "Este trabalho" e "isto é"

"Este trabalho" (dêitico, 9 vezes) é aceito; o que a skill proíbe é o anafórico ("Este resultado", retomando a frase anterior), e não há casos. "Isto é" (2 vezes no cap. 9) pode virar dois pontos: "a taxa de desconto é real: descontada da inflação".

## Ordem sugerida para a revisão antes da banca

1. Cap. 1, §1 e §2 e resumo (primeira leitura da banca; D88).
2. Os 5 parágrafos da tabela do item 1.
3. Decidir "casa" na P6 (D90) e aplicar em lote nos caps. 3, 5, 6, 7 e 9.
4. Travessão e hífen na revisão de forma (D15), junto com a geração do `.docx`.
