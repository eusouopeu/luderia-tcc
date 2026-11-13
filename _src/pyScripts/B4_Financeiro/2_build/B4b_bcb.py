"""
Trata as séries do Banco Central coletadas por B4c_bcb.py.

Saídas:
Saídas em dados/B4_financeiro/_dados-agregados/, no padrão "[B4] {dado} {período} ({fonte}).csv":
  "Selic IPCA e Salário Mínimo"                séries do SGS em formato longo (codigo_sgs, serie, data, valor)
  "Selic IPCA e Salário Mínimo Último Valor"   último valor de cada série
  "Expectativas Focus"                         pesquisa Focus mais recente de cada indicador, por ano de
                                               referência
"""

# Caminhos: _src/outros/ (log comum) e outros/ do objeto (auxiliares); log em ../logs/
import sys
from pathlib import Path
_AQUI = Path(__file__).resolve()
sys.path[:0] = [*map(str, (_AQUI.parents[3] / "outros").glob("G[0-9]_*")), str(_AQUI.parents[1] / "5_outros"), str(_AQUI.parents[2] / "B4_Multiuso" / "5_outros")]
from log_execucao import registrar_execucao  # noqa: E402
if __name__ == "__main__":
    registrar_execucao(__file__)

import pandas as pd

from bases_comum import caminho_saida, ler_json, pasta_bruta, rotulo_periodo

IN_DIR = pasta_bruta("bcb")


def main() -> None:

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
