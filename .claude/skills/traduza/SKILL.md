---
name: traduza
description: Gera uma nota em docs/notas/ explicando, como para uma criança de 5 a 10 anos, um conteúdo que o autor não entendeu numa resposta (termo, fórmula, procedimento, técnica, sigla). Acione SEMPRE que o autor escrever "/traduza X" ou marcar o conteúdo entre sinais de igual duplos, como "==VPL==" ou "==TIR, payback==", inclusive quando X for um trecho da resposta anterior. Não acione para pedidos de explicação na própria conversa sem os marcadores ("o que é X?", "me explique X"), que seguem resposta normal ou a skill learn.
---

# Traduza

O autor marca o que não entendeu com `/traduza X` ou `==X==`. A explicação vira um arquivo em `docs/notas/`, para ele consultar depois e estudar para a banca, em vez de se perder no histórico da conversa.

## Entrada

- **Um ou mais termos.** `==VPL, TIR, payback==` ou `/traduza VPL; TIR` geram **uma nota por termo**. Separadores: vírgula, ponto e vírgula ou "e".
- **Vários marcadores na mesma mensagem** (`não entendi o ==VPL== nem a ==TIR==`): uma nota por marcador.
- **Sem termo** (`/traduza` sozinho ou `====`): perguntar qual trecho da resposta anterior ele quer, sem gerar nota.
- **Trecho longo** (uma frase inteira ou um procedimento): a nota explica o trecho todo, e o nome do arquivo usa um rótulo curto dele.
- **Contexto:** procurar o termo na resposta anterior e no projeto (instruções, capítulos, scripts) para explicar o sentido em que ele aparece no TCC, não um sentido genérico.

## Arquivo

- Pasta: `docs/notas/`. Criar se não existir.
- Nome: `AAAA-MM-DD_termo.md` (data de `date`; termo em minúsculas, sem acento, com `-` entre palavras). Ex.: `2026-10-14_vpl.md`.
- **Sem duplicata:** antes de criar, procurar em `docs/notas/` uma nota sobre o mesmo termo (qualquer data). Se existir, acrescentar ao fim dela uma seção `## Complemento (AAAA-MM-DD)` com o que a nova dúvida pede, em vez de criar outro arquivo.
- **Índice:** manter `docs/notas/README.md` com uma linha por nota, em ordem alfabética: `- [Termo](arquivo.md) — explicação em uma frase`.
- As notas **não** entram no registro de alterações (`docs/registro-de-alteracoes.md`); entram no commit de fim de sessão.

## Formato da nota

```markdown
# Termo

## Explicando como para uma criança
Explicação para uma criança de 5 a 10 anos: frases curtas, palavras do dia a dia,
uma analogia concreta (mesada, lanchonete, cofrinho, jogo de tabuleiro). Sem jargão;
se precisar de uma palavra difícil, explicar na hora.

## Como isso aparece no seu TCC
Onde e para quê o termo aparece no plano da luderia (capítulo, decisão, script),
em linguagem simples.

## Exemplo com números
Um exemplo pequeno, passo a passo, com contas fáceis de conferir. Se for fórmula,
mostrar cada símbolo com o que ele significa.

## Versão técnica (para citar na banca)
Definição correta em uma ou duas linhas, com a fórmula se houver. A analogia
simplifica; esta é a versão que pode ir para o texto do TCC.
```

Regras:
- A versão técnica é obrigatória e tem de estar correta: a analogia nunca substitui a definição.
- Se o termo depender de outro que o autor provavelmente também não conhece, explicar o outro em uma frase dentro da nota, sem criar nota separada.
- Se a definição tiver fonte relevante para o TCC, citá-la; obra não conferida fica `[A VERIFICAR]`.

## Resposta no chat

Só o link para cada nota e uma frase de resumo. Não repetir a explicação no chat.
