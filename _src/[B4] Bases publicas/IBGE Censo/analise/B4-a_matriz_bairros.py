"""
Matriz de critérios ponderados para o bairro da luderia em Salvador (6.4).

Candidatos: bairros com 3.500 ou mais pessoas de 20 a 39 anos (Censo 2022) e
renda média dos responsáveis por domicílio de pelo menos o dobro da média de
Salvador (Censo 2010, pelas páginas de bairro do ObservaSSA/UFBA). O Censo 2022
não publica renda por bairro; a renda de 2010 entra no lugar da proporção de
apartamentos, a substituta usada até 04/11/2026, que confundia conjuntos
habitacionais com bairros de renda alta. A média de Salvador é a dos bairros com
renda, ponderada pela população de 2010.
Critérios, normalizados de 0 a 1 entre os candidatos (mín.-máx.), e pesos do
autor (N6): público de 20 a 39 anos (50%), renda média dos responsáveis (30%) e
público de 20 a 39 anos por km² (20%). A ordem é testada com três outros
conjuntos de pesos.

Entradas: dados/[B4] Bases publicas/ponto_operacoes/[B4] População por Bairro 2022 (IBGE Censo).csv;
          dados/[B4] Bases publicas/ponto_operacoes/[B4] Renda Média do Responsável por Bairro 2010 (ObservaSSA).csv
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
RENDA = PROCESSED_DIR / "ponto_operacoes" / "[B4] Renda Média do Responsável por Bairro 2010 (ObservaSSA).csv"
SAIDA = PROCESSED_DIR / "ponto_operacoes" / "B4_matriz_bairros_salvador.csv"
PESOS = {"pop_20_39": 0.5, "renda_2010": 0.3, "pop_20_39_km2": 0.2}
TESTES = [(0.4, 0.4, 0.2), (0.6, 0.2, 0.2), (1 / 3, 1 / 3, 1 / 3)]


def main() -> None:
    s = pd.read_csv(ENTRADA)
    s = s[s["capital"] == "Salvador"].copy()
    s["pop_20_39_km2"] = (s["pop_20_39"] / s["area_km2"]).round(1)
    r = pd.read_csv(RENDA).rename(columns={"renda_media_responsavel_2010": "renda_2010"})
    s = s.merge(r[["nm_bairro", "renda_2010", "populacao_2010"]], on="nm_bairro", how="left")
    com = s.dropna(subset=["renda_2010"])
    media = (com["renda_2010"] * com["populacao_2010"]).sum() / com["populacao_2010"].sum()
    k = s[(s["renda_2010"] >= 2 * media) & (s["pop_20_39"] >= 3500)].copy()
    print(f"renda média de Salvador (2010): R$ {media:,.0f}; corte: R$ {2 * media:,.0f}; "
          f"{len(com)} de {len(s)} bairros com renda")
    for c in PESOS:
        k[f"norm_{c}"] = ((k[c] - k[c].min()) / (k[c].max() - k[c].min())).round(3)
    k["nota"] = sum(p * k[f"norm_{c}"] for c, p in PESOS.items()).round(3)
    for i, w in enumerate(TESTES, 1):
        nota = sum(p * k[f"norm_{c}"] for c, p in zip(PESOS, w))
        k[f"posicao_teste{i}"] = nota.rank(ascending=False, method="min").astype(int)
    k["posicao"] = k["nota"].rank(ascending=False, method="min").astype(int)
    k = k.sort_values("posicao")
    cols = ["posicao", "nm_bairro", "pessoas", "pop_20_39", "renda_2010", "pct_apartamento", "pop_20_39_km2", "nota",
            "posicao_teste1", "posicao_teste2", "posicao_teste3"]
    k[cols].to_csv(SAIDA, index=False)
    print(f"{len(s)} bairros em Salvador; {len(k)} candidatos")
    print(k[cols].to_string(index=False))


if __name__ == "__main__":
    main()
