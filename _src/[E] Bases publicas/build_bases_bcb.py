"""
Trata as séries do Banco Central coletadas por collect_bases_bcb.py.

Saídas em _data/processed/[E] Bases publicas/:
  bases_bcb_sgs_series.csv     séries do SGS em formato longo (codigo_sgs, serie, data, valor)
  bases_bcb_sgs_ultimos.csv    último valor de cada série
  bases_bcb_focus_ultimo.csv   pesquisa Focus mais recente de cada indicador, por ano de referência
"""

import pandas as pd

from bases_comum import PROCESSED_DIR, RAW_DIR, ler_json

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
    sgs.to_csv(PROCESSED_DIR / "bases_bcb_sgs_series.csv", index=False)
    ultimos = sgs.sort_values("data").groupby(["codigo_sgs", "serie"]).tail(1)
    ultimos.to_csv(PROCESSED_DIR / "bases_bcb_sgs_ultimos.csv", index=False)
    print(ultimos.to_string(index=False))

    focus = pd.DataFrame(ler_json(IN_DIR / "focus_anuais.json")["dados"])
    focus = focus[focus["baseCalculo"] == 0]
    focus = focus[focus["Data"] == focus.groupby("Indicador")["Data"].transform("max")]
    ano_atual = pd.Timestamp.today().year
    focus = focus[focus["DataReferencia"].astype(int).between(ano_atual, ano_atual + 4)]
    colunas = ["Indicador", "IndicadorDetalhe", "Data", "DataReferencia", "Mediana", "Media", "DesvioPadrao",
               "Minimo", "Maximo", "numeroRespondentes"]
    focus = focus[colunas].sort_values(["Indicador", "IndicadorDetalhe", "DataReferencia"], na_position="first")
    focus.to_csv(PROCESSED_DIR / "bases_bcb_focus_ultimo.csv", index=False)
    print(focus.to_string(index=False))


if __name__ == "__main__":
    main()
