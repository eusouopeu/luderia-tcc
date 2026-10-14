"""
Trata as séries do Banco Central coletadas por B4-c_bcb.py.

Saídas em dados/[B4] Bases publicas/:
Saídas em financeiro/, no padrão "[B4] {dado} {período} ({fonte}).csv":
  "Selic IPCA e Salário Mínimo"                séries do SGS em formato longo (codigo_sgs, serie, data, valor)
  "Selic IPCA e Salário Mínimo Último Valor"   último valor de cada série
  "Expectativas Focus"                         pesquisa Focus mais recente de cada indicador, por ano de
                                               referência
"""

# Caminhos: _src/ (log comum) e outros/ do bloco (auxiliares); log em ../logs/
import sys
from pathlib import Path
_AQUI = Path(__file__).resolve()
sys.path[:0] = [str(_AQUI.parents[2]), str(_AQUI.parents[1] / "outros")]
from log_execucao import registrar_execucao  # noqa: E402
if __name__ == "__main__":
    registrar_execucao(__file__)

import pandas as pd

from bases_comum import PROCESSED_DIR, RAW_DIR, caminho_saida, ler_json, rotulo_periodo

IN_DIR = RAW_DIR / "bcb"


def main() -> None:
    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)

    partes = []
    for arq in sorted(IN_DIR.glob("sgs_*.json")):
        bruto = ler_json(arq)
        df = pd.DataFrame(bruto["dados"])
        df["data"] = pd.to_datetime(df["data"], format="%d/%m/%Y")
        df["valor"] = pd.to_numeric(df["valor"])
        df.insert(0, "codigo_sgs", bruto["codigo_sgs"])
        df.insert(1, "serie", bruto["nome"])
        partes.append(df)
    sgs = pd.concat(partes, ignore_index=True)
    sgs.to_csv(caminho_saida("financeiro", "Selic IPCA e Salário Mínimo", rotulo_periodo(sgs["data"]), "BCB"), index=False)
    ultimos = sgs.sort_values("data").groupby(["codigo_sgs", "serie"]).tail(1)
    ultimos.to_csv(caminho_saida("financeiro", "Selic IPCA e Salário Mínimo Último Valor",
                                 rotulo_periodo(ultimos["data"]), "BCB"), index=False)
    print(ultimos.to_string(index=False))

    focus = pd.DataFrame(ler_json(IN_DIR / "focus_anuais.json")["dados"])
    focus = focus[focus["baseCalculo"] == 0]
    focus = focus[focus["Data"] == focus.groupby("Indicador")["Data"].transform("max")]
    ano_atual = pd.Timestamp.today().year
    focus = focus[focus["DataReferencia"].astype(int).between(ano_atual, ano_atual + 4)]
    colunas = ["Indicador", "IndicadorDetalhe", "Data", "DataReferencia", "Mediana", "Media", "DesvioPadrao",
               "Minimo", "Maximo", "numeroRespondentes"]
    focus = focus[colunas].sort_values(["Indicador", "IndicadorDetalhe", "DataReferencia"], na_position="first")
    focus.to_csv(caminho_saida("financeiro", "Expectativas Focus", rotulo_periodo(focus["DataReferencia"]), "BCB"), index=False)
    print(focus.to_string(index=False))


if __name__ == "__main__":
    main()
