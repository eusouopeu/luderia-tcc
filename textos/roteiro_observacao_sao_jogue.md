# Roteiro de observação — São Jogue (Bloco D)

Roteiro de campo da contagem direta de ocupação. Protocolo em `_instrucoes/4_metodologia.md` (Bloco D) e no `textos/registro_previo_luderia.md`. Este arquivo diz **o que fazer, em que ordem e o que anotar**. As fichas em branco da seção 7 são para preencher em campo.

## 1. Agenda

Todas as visitas têm horário fixo: **18h00 às 21h00**.

| Visita | Tipo | Unidade | Data | Início | Fim |
|---|---|---|---|---|---|
| 1 | Sorteada | Bela Vista (Unidade 1) | sáb., 03/10/2026 | 18h00 | 21h00 |
| 2 | Sorteada | Paralela (Unidade 2) | sáb., 03/10/2026 | 18h00 | 21h00 |
| 3 | Retorno da visita 1 | Bela Vista (Unidade 1) | dom., 18/10/2026 | 18h00 | 21h00 |
| 4 | Retorno da visita 2 | Paralela (Unidade 2) | dom., 18/10/2026 | 18h00 | 21h00 |

Unidades:

- **São Jogue – Bela Vista:** Alameda Euvaldo Luz, 92, Pernambués.
- **São Jogue – Paralela:** Av. Luís Viana Filho, 8544, Alphaville.

### Antes de sair

- [ ] Conferir se as duas unidades ficam abertas das 18h00 às 21h00 no sábado e no domingo.
- [ ] Preencher a aba **Registro** da planilha `contagem_sorteio_visitas.xlsx` com a agenda acima.

## 2. Material

- Celular carregado e carregador portátil.
- Fichas da seção 7 (impressas ou no celular) e caneta.
- Relógio sincronizado com o celular: todos os horários em hh:mm.
- Dinheiro ou cartão para duas compras por visita (início e fim).
- Água e lanche: o observador não sai do posto durante as 3 horas.

## 3. Regras gerais

- Posição do lado de fora, com vista para a entrada. Escolher o ponto antes do início e mantê-lo até o fim.
- Sem fotos de pessoas. Sem anotar características individuais (sexo, idade, roupa). Só horário e número de pessoas.
- Sem conversa com clientes. Com funcionários, só o necessário para a compra.
- **Grupo** = pessoas que chegam juntas e entram juntas. Quem chega depois e se junta a uma mesa já ocupada é um grupo novo, com nota "junta-se a G__".
- **Não contar:** funcionários, entregadores, fornecedores. Anotar à parte quantos entregadores de aplicativo passam (indicam delivery na numeração da NFC-e).
- Quem sai e volta em poucos minutos (fumar, telefone, carro) não conta como saída. Saída é a saída definitiva do grupo.
- Saída parcial (parte do grupo vai embora): anotar na coluna "Nota" o horário e o número de pessoas que saiu.
- Dúvida sobre um caso: registrar o que foi visto, com nota. Não decidir na hora se entra ou não na análise.

## 4. Passo a passo de cada visita

### 4.1 Chegada (17h45)

1. Anotar condições do dia: tempo (sol, chuva), evento na unidade, jogo de futebol, outra condição atípica.
2. Escolher o ponto de observação.

### 4.2 Abertura (18h00)

1. Anotar o **horário real de início**.
2. Entrar e fazer uma compra pequena (água, refrigerante).
3. Pedir a nota fiscal. Anotar da NFC-e: **número, série, data e hora de emissão**. Guardar a nota.
4. Dentro, fazer a **contagem inicial**: pessoas no salão e mesas ocupadas.
5. Na primeira visita a cada unidade, contar as **mesas disponíveis** (total de mesas de jogo, ocupadas ou não).
6. Anotar a **política de cobrança** praticada (couvert lúdico, por hora, por pessoa, consumação mínima, sem cobrança) e o valor.
7. Anotar ou fotografar o **cardápio com preços** (só o cardápio, sem pessoas na foto).
8. Voltar ao ponto de observação. Tempo dentro: o mínimo possível. Se um grupo entrar ou sair nesse intervalo, registrar.

### 4.3 Registro contínuo (18h00 às 21h00)

Uma linha da ficha de grupos por grupo. A entrada e a saída do mesmo grupo ficam na mesma linha.

- **Grupo que entra:** código sequencial (G01, G02, …), horário de entrada e número de pessoas. Nota "com crianças", se houver.
- **Grupo que sai:** localizar a linha do grupo e preencher horário de saída e número de pessoas. Se o grupo não for identificado, abrir linha nova só com a saída e código "?".
- **Grupo que já estava dentro às 18h00 e sai:** código P01, P02, … (presente no início), só com a saída.

### 4.4 Registro a cada 30 minutos

Às 18h30, 19h00, 19h30, 20h00 e 20h30:

- saldo de pessoas no interior (contagem inicial + entradas − saídas);
- mesas ocupadas, se visíveis de fora (senão, "não visível").

### 4.5 Encerramento (21h00)

1. Anotar o **horário real de fim**.
2. Entrar e fazer a segunda compra. Anotar da NFC-e: **número, série, data e hora**.
3. Fazer a **contagem final**: pessoas no salão e mesas ocupadas. Comparar com o saldo calculado; anotar a diferença, sem corrigir os registros.
4. Grupos ainda dentro ficam sem saída (permanência censurada).

## 5. Depois de cada visita

- No mesmo dia, digitar as fichas em `_data/raw/[D] Contagem direta de ocupacao/`: `contagem_visitas.csv` (cabeçalho), `contagem_grupos.csv` (grupos) e `contagem_30min.csv`.
- Preencher a linha da visita na aba **Registro** da planilha: início, fim, NFC-e no início e no fim, "Realizada?", observação.
- Guardar as notas fiscais (foto da nota ou do QR Code; sem dados pessoais).
- Não analisar os números antes da última visita, além da conferência de digitação.

## 6. O que cada registro alimenta

| Registro | Saída | Decisão do plano |
|---|---|---|
| Entradas por hora | Pessoas por hora | Ocupação projetada; horário de funcionamento e escala |
| Pessoas por grupo | Tamanho dos grupos | Quantas mesas de cada tamanho |
| Entrada e saída do mesmo grupo | Permanência média (com censura) | Giro de mesa; capacidade |
| Saldo e mesas ocupadas a cada 30 min | Ocupação por hora do dia | Taxa de ocupação |
| NFC-e no início e no fim da mesma visita | Notas na visita; pessoas por nota | Conversão de notas em visitantes |
| NFC-e da visita sorteada e do retorno | Notas em 15 dias | Visitantes por semana (caminho das notas) |
| Cardápio e cobrança | Preços na data | Ticket médio; preço |

## 7. Fichas de campo

### Visita 1 — Bela Vista, sáb., 03/10/2026, 18h00 às 21h00 (sorteada)


**Cabeçalho**


| Campo | Valor |
|---|---|
| Início real | |
| Fim real | |
| NFC-e início: número / série | |
| NFC-e início: data e hora | |
| NFC-e fim: número / série | |
| NFC-e fim: data e hora | |
| Pessoas no salão: início | |
| Pessoas no salão: fim | |
| Mesas ocupadas: início | |
| Mesas ocupadas: fim | |
| Mesas disponíveis | |
| Política de cobrança e valor | |
| Entregadores de aplicativo vistos | |
| Tempo e condições atípicas | |
| Observação | |

**Grupos** (uma linha por grupo; entrada e saída na mesma linha)


| Código | Entrada (hh:mm) | Pessoas na entrada | Saída (hh:mm) | Pessoas na saída | Nota |
|---|---|---|---|---|---|
| G01 | | | | | |
| G02 | | | | | |
| G03 | | | | | |
| G04 | | | | | |
| G05 | | | | | |
| G06 | | | | | |
| G07 | | | | | |
| G08 | | | | | |
| G09 | | | | | |
| G10 | | | | | |
| G11 | | | | | |
| G12 | | | | | |
| G13 | | | | | |
| G14 | | | | | |
| G15 | | | | | |
| G16 | | | | | |
| G17 | | | | | |
| G18 | | | | | |
| G19 | | | | | |
| G20 | | | | | |
| G21 | | | | | |
| G22 | | | | | |
| G23 | | | | | |
| G24 | | | | | |
| G25 | | | | | |
| G26 | | | | | |
| G27 | | | | | |
| G28 | | | | | |
| G29 | | | | | |
| G30 | | | | | |
| G31 | | | | | |
| G32 | | | | | |
| G33 | | | | | |
| G34 | | | | | |
| G35 | | | | | |
| G36 | | | | | |
| G37 | | | | | |
| G38 | | | | | |
| G39 | | | | | |
| G40 | | | | | |
| P01 | (já dentro) | | | | |
| P02 | (já dentro) | | | | |
| P03 | (já dentro) | | | | |
| P04 | (já dentro) | | | | |
| P05 | (já dentro) | | | | |
| ? | | | | | |
| ? | | | | | |

**A cada 30 minutos**


| Horário | Saldo de pessoas | Mesas ocupadas | Nota |
|---|---|---|---|
| 18h00 (contagem inicial) | | | |
| 18h30 | | | |
| 19h00 | | | |
| 19h30 | | | |
| 20h00 | | | |
| 20h30 | | | |
| 21h00 (contagem final) | | | |

### Visita 2 — Paralela, sáb., 03/10/2026, 18h00 às 21h00 (sorteada)


**Cabeçalho**


| Campo | Valor |
|---|---|
| Início real | |
| Fim real | |
| NFC-e início: número / série | |
| NFC-e início: data e hora | |
| NFC-e fim: número / série | |
| NFC-e fim: data e hora | |
| Pessoas no salão: início | |
| Pessoas no salão: fim | |
| Mesas ocupadas: início | |
| Mesas ocupadas: fim | |
| Mesas disponíveis | |
| Política de cobrança e valor | |
| Entregadores de aplicativo vistos | |
| Tempo e condições atípicas | |
| Observação | |

**Grupos** (uma linha por grupo; entrada e saída na mesma linha)


| Código | Entrada (hh:mm) | Pessoas na entrada | Saída (hh:mm) | Pessoas na saída | Nota |
|---|---|---|---|---|---|
| G01 | | | | | |
| G02 | | | | | |
| G03 | | | | | |
| G04 | | | | | |
| G05 | | | | | |
| G06 | | | | | |
| G07 | | | | | |
| G08 | | | | | |
| G09 | | | | | |
| G10 | | | | | |
| G11 | | | | | |
| G12 | | | | | |
| G13 | | | | | |
| G14 | | | | | |
| G15 | | | | | |
| G16 | | | | | |
| G17 | | | | | |
| G18 | | | | | |
| G19 | | | | | |
| G20 | | | | | |
| G21 | | | | | |
| G22 | | | | | |
| G23 | | | | | |
| G24 | | | | | |
| G25 | | | | | |
| G26 | | | | | |
| G27 | | | | | |
| G28 | | | | | |
| G29 | | | | | |
| G30 | | | | | |
| G31 | | | | | |
| G32 | | | | | |
| G33 | | | | | |
| G34 | | | | | |
| G35 | | | | | |
| G36 | | | | | |
| G37 | | | | | |
| G38 | | | | | |
| G39 | | | | | |
| G40 | | | | | |
| P01 | (já dentro) | | | | |
| P02 | (já dentro) | | | | |
| P03 | (já dentro) | | | | |
| P04 | (já dentro) | | | | |
| P05 | (já dentro) | | | | |
| ? | | | | | |
| ? | | | | | |

**A cada 30 minutos**


| Horário | Saldo de pessoas | Mesas ocupadas | Nota |
|---|---|---|---|
| 18h00 (contagem inicial) | | | |
| 18h30 | | | |
| 19h00 | | | |
| 19h30 | | | |
| 20h00 | | | |
| 20h30 | | | |
| 21h00 (contagem final) | | | |

### Visita 3 — Bela Vista, dom., 18/10/2026, 18h00 às 21h00 (retorno da visita 1)


**Cabeçalho**


| Campo | Valor |
|---|---|
| Início real | |
| Fim real | |
| NFC-e início: número / série | |
| NFC-e início: data e hora | |
| NFC-e fim: número / série | |
| NFC-e fim: data e hora | |
| Pessoas no salão: início | |
| Pessoas no salão: fim | |
| Mesas ocupadas: início | |
| Mesas ocupadas: fim | |
| Mesas disponíveis | |
| Política de cobrança e valor | |
| Entregadores de aplicativo vistos | |
| Tempo e condições atípicas | |
| Observação | |

**Grupos** (uma linha por grupo; entrada e saída na mesma linha)


| Código | Entrada (hh:mm) | Pessoas na entrada | Saída (hh:mm) | Pessoas na saída | Nota |
|---|---|---|---|---|---|
| G01 | | | | | |
| G02 | | | | | |
| G03 | | | | | |
| G04 | | | | | |
| G05 | | | | | |
| G06 | | | | | |
| G07 | | | | | |
| G08 | | | | | |
| G09 | | | | | |
| G10 | | | | | |
| G11 | | | | | |
| G12 | | | | | |
| G13 | | | | | |
| G14 | | | | | |
| G15 | | | | | |
| G16 | | | | | |
| G17 | | | | | |
| G18 | | | | | |
| G19 | | | | | |
| G20 | | | | | |
| G21 | | | | | |
| G22 | | | | | |
| G23 | | | | | |
| G24 | | | | | |
| G25 | | | | | |
| G26 | | | | | |
| G27 | | | | | |
| G28 | | | | | |
| G29 | | | | | |
| G30 | | | | | |
| G31 | | | | | |
| G32 | | | | | |
| G33 | | | | | |
| G34 | | | | | |
| G35 | | | | | |
| G36 | | | | | |
| G37 | | | | | |
| G38 | | | | | |
| G39 | | | | | |
| G40 | | | | | |
| P01 | (já dentro) | | | | |
| P02 | (já dentro) | | | | |
| P03 | (já dentro) | | | | |
| P04 | (já dentro) | | | | |
| P05 | (já dentro) | | | | |
| ? | | | | | |
| ? | | | | | |

**A cada 30 minutos**


| Horário | Saldo de pessoas | Mesas ocupadas | Nota |
|---|---|---|---|
| 18h00 (contagem inicial) | | | |
| 18h30 | | | |
| 19h00 | | | |
| 19h30 | | | |
| 20h00 | | | |
| 20h30 | | | |
| 21h00 (contagem final) | | | |

### Visita 4 — Paralela, dom., 18/10/2026, 18h00 às 21h00 (retorno da visita 2)


**Cabeçalho**


| Campo | Valor |
|---|---|
| Início real | |
| Fim real | |
| NFC-e início: número / série | |
| NFC-e início: data e hora | |
| NFC-e fim: número / série | |
| NFC-e fim: data e hora | |
| Pessoas no salão: início | |
| Pessoas no salão: fim | |
| Mesas ocupadas: início | |
| Mesas ocupadas: fim | |
| Mesas disponíveis | |
| Política de cobrança e valor | |
| Entregadores de aplicativo vistos | |
| Tempo e condições atípicas | |
| Observação | |

**Grupos** (uma linha por grupo; entrada e saída na mesma linha)


| Código | Entrada (hh:mm) | Pessoas na entrada | Saída (hh:mm) | Pessoas na saída | Nota |
|---|---|---|---|---|---|
| G01 | | | | | |
| G02 | | | | | |
| G03 | | | | | |
| G04 | | | | | |
| G05 | | | | | |
| G06 | | | | | |
| G07 | | | | | |
| G08 | | | | | |
| G09 | | | | | |
| G10 | | | | | |
| G11 | | | | | |
| G12 | | | | | |
| G13 | | | | | |
| G14 | | | | | |
| G15 | | | | | |
| G16 | | | | | |
| G17 | | | | | |
| G18 | | | | | |
| G19 | | | | | |
| G20 | | | | | |
| G21 | | | | | |
| G22 | | | | | |
| G23 | | | | | |
| G24 | | | | | |
| G25 | | | | | |
| G26 | | | | | |
| G27 | | | | | |
| G28 | | | | | |
| G29 | | | | | |
| G30 | | | | | |
| G31 | | | | | |
| G32 | | | | | |
| G33 | | | | | |
| G34 | | | | | |
| G35 | | | | | |
| G36 | | | | | |
| G37 | | | | | |
| G38 | | | | | |
| G39 | | | | | |
| G40 | | | | | |
| P01 | (já dentro) | | | | |
| P02 | (já dentro) | | | | |
| P03 | (já dentro) | | | | |
| P04 | (já dentro) | | | | |
| P05 | (já dentro) | | | | |
| ? | | | | | |
| ? | | | | | |

**A cada 30 minutos**


| Horário | Saldo de pessoas | Mesas ocupadas | Nota |
|---|---|---|---|
| 18h00 (contagem inicial) | | | |
| 18h30 | | | |
| 19h00 | | | |
| 19h30 | | | |
| 20h00 | | | |
| 20h30 | | | |
| 21h00 (contagem final) | | | |
