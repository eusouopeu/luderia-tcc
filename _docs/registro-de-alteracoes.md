# Registro de alterações

Só o que o git não guarda: **mudanças em bancos do Notion** e **divergências entre documentos**. Mudança em arquivo do projeto fica na mensagem do commit (o que mudou e por quê). Registro anterior, com todas as mudanças até 03/11/2026: `docs/_arquivo/registro-de-alteracoes_ate_2026-11-03.md` (ler por busca de data ou termo, nunca inteiro).

Formato de uma mudança no Notion:

```
## AAAA/MM/DD

### HH:mm
**Objeto**: banco e campos
**Antes**: o que havia
**Depois**: o que passou a haver
**Justificativa**: razão da mudança
```

Formato de uma divergência encontrada entre documentos (data em que foi encontrada):

```
### HH:mm
**Objeto**: arquivos ou trechos em divergência
**Antes**: o que diz o arquivo mais antigo
**Depois**: o que diz o arquivo mais recente
**Efeitos colaterais**: prejuízos que a versão mais recente pode causar ao trabalho, se houver
```

---

## 2026/11/05

### 08:21
**Objeto**: taxa de entrada da Ludus Luderia em `B2-a_gasto_por_pessoa.py` × `B2-a_retorno_e_clusters.py` e `B1_cardapios_itens_precos.xlsx`
**Antes**: `B2-a_gasto_por_pessoa.py` (02/11/2026) usa R$ 34 a R$ 44 por dia (CNN Brasil, 02/10/2024).
**Depois**: o cardápio do B1 e `B2-a_retorno_e_clusters.py` usam R$ 0 (página inicial do site: "não cobra por tempo nem por jogo").
**Efeitos colaterais**: a cesta de consumo da Ludus no B2 (R$ 122) e o gasto por cesta que apoia a R06 usam um valor que o site da casa nega; nos grupos de preço, a Ludus entra como casa sem cobrança.

## 2026/11/13

### 03:54
**Objeto**: Quadro 7.1 de `textos/capitulos/7_plano_operacional.md` × seção 6.6 e Tabela 6.2 de `6_plano_de_marketing.md` (e caps. 9 e 10)
**Antes**: o Quadro 7.1 traz 7,73 horas de pico equivalentes por dia de fim de semana, 4,98 por dia útil e circulação pessimista de 3,87 pessoas por hora.
**Depois**: a seção 6.6, a Tabela 6.2 e os caps. 9 e 10 trazem 7,69, 4,90 e 3,89 (dados de 13/11).
**Efeitos colaterais**: a conta da linha "Demanda provável" do Quadro 7.1 dá 38,9 pessoas por dia aberto com os valores antigos, contra 38,5 na Tabela 9.6; o arredondamento para 39 esconde a diferença, mas os fatores não fecham entre os capítulos.
