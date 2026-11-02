# Modelo financeiro v0 — arquivado

Primeiro modelo financeiro (15/10/2026), em Python, dirigido por `financeiro_premissas.csv`. Saiu de uso quando o modelo passou a ser gerado por `_src/extras/gerar_modelo_financeiro.py`, que produz `textos/capitulos/9_plano_financeiro_modelo.xlsx` e alimenta o cap. 9 e os apêndices. Arquivado em 02/11/2026, a pedido do autor.

A numeração das premissas é outra e não vale mais: aqui, C04 = área, C05 = aluguel, C06 = IPTU e condomínio (R$/m²) e C07 = monitores; no modelo atual, C03 = área, C04 = aluguel, C05 = condomínio e IPTU (% do aluguel) e C07 = encargos da folha.

- `_src/financeiro-a_modelo.py`: o script. Não roda daqui: lê e grava em `dados/Modelo financeiro/`.
- Entrada e saída: `dados/Modelo financeiro/_arquivo/financeiro_premissas_v0.csv` e `financeiro_modelo_v0.xlsx` (gerados em 31/10/2026).
- `_logs/`: log da última execução (fora do git).
