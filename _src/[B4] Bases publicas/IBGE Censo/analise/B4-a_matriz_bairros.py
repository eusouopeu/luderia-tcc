"""
Matriz de critérios ponderados para o bairro da luderia em Salvador (6.4).

Candidatos: bairros com 80% ou mais de domicílios em apartamento e 3.500 ou
mais pessoas de 20 a 39 anos (Censo 2022). O Censo 2022 não publica renda por
bairro; a proporção de apartamentos é a substituta declarada.
Critérios, normalizados de 0 a 1 entre os candidatos (mín.-máx.), e pesos do
autor (N6): público de 20 a 39 anos (50%), proporção de apartamentos (30%) e
público de 20 a 39 anos por km² (20%). A ordem é testada com três outros
conjuntos de pesos.

Entrada: dados/[B4] Bases publicas/ponto_operacoes/[B4] População por Bairro 2022 (IBGE Censo).csv
Saída: dados/[B4] Bases publicas/ponto_operacoes/B4_matriz_bairros_salvador.csv
"""

# Caminhos: _src/extras/ (log comum) e outros/ do objeto (auxiliares); log em ../logs/
import sys
from pathlib import Path
_AQUI = Path(__file__).resolve()
sys.path[:0] = [str(_AQUI.parents[3] / "extras"), str(_AQUI.parents[1] / "outros"), str(_AQUI.parents[2] / "Comum")]
from log_execucao import registrar_execucao  # noqa: E402
if __name__ == "__main__":
    registrar_execucao(__file__)

import pandas as pd

from bases_comum import PROCESSED_DIR

ENTRADA = PROCESSED_DIR / "ponto_operacoes" / "[B4] População por Bairro 2022 (IBGE Censo).csv"
SAIDA = PROCESSED_DIR / "ponto_operacoes" / "B4_matriz_bairros_salvador.csv"
PESOS = {"pop_20_39": 0.5, "pct_apartamento": 0.3, "pop_20_39_km2": 0.2}
TESTES = [(0.4, 0.4, 0.2), (0.6, 0.2, 0.2), (1 / 3, 1 / 3, 1 / 3)]


def main() -> None:
    s = pd.read_csv(ENTRADA)
    s = s[s["capital"] == "Salvador"].copy()
    s["pop_20_39_km2"] = (s["pop_20_39"] / s["area_km2"]).round(1)
    k = s[(s["pct_apartamento"] >= 80) & (s["pop_20_39"] >= 3500)].copy()
    for c in PESOS:
        k[f"norm_{c}"] = ((k[c] - k[c].min()) / (k[c].max() - k[c].min())).round(3)
    k["nota"] = sum(p * k[f"norm_{c}"] for c, p in PESOS.items()).round(3)
    for i, w in enumerate(TESTES, 1):
        nota = sum(p * k[f"norm_{c}"] for c, p in zip(PESOS, w))
        k[f"posicao_teste{i}"] = nota.rank(ascending=False, method="min").astype(int)
    k["posicao"] = k["nota"].rank(ascending=False, method="min").astype(int)
    k = k.sort_values("posicao")
    cols = ["posicao", "nm_bairro", "pessoas", "pop_20_39", "pct_apartamento", "pop_20_39_km2", "nota",
            "posicao_teste1", "posicao_teste2", "posicao_teste3"]
    k[cols].to_csv(SAIDA, index=False)
    print(f"{len(s)} bairros em Salvador; {len(k)} candidatos")
    print(k[cols].to_string(index=False))


if __name__ == "__main__":
    main()
