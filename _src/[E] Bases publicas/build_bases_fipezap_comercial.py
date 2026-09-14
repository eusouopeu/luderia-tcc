"""
Extrai da planilha original do Índice FipeZAP as séries de imóveis comerciais
(salas e conjuntos de até 200 m²) e o preço de locação residencial das capitais.

Entrada: _data/raw/[E] Bases publicas/fipezap/fipezap-serieshistoricas_<data>.xlsx
Saídas em _data/processed/[E] Bases publicas/:
  bases_fipezap_comercial_series.csv       série mensal por cidade (só meses com dado)
  bases_fipezap_capitais_ultimo_mes.csv    uma linha por capital: último preço de locação
                                           comercial e residencial (R$/m²) e variação em 12 meses

Layout de cada aba de cidade (linhas 0 a 3 = cabeçalho; coluna 1 = data):
  22-26 locação residencial (índice, total e 1D a 4D); 37 preço médio de locação residencial total
  47-50 venda comercial: índice, var. mensal, var. 12 meses, preço médio (R$/m²)
  51-54 locação comercial: índice, var. mensal, var. 12 meses, preço médio (R$/m²)
  55    rentabilidade do aluguel comercial (% mensal)
"""

import pandas as pd

from bases_comum import CAPITAIS, PROCESSED_DIR, RAW_DIR

IN_DIR = RAW_DIR / "fipezap"
COMERCIAL = {
    47: "venda_indice", 48: "venda_var_mensal_pct", 49: "venda_var_12m_pct", 50: "venda_preco_m2",
    51: "locacao_indice", 52: "locacao_var_mensal_pct", 53: "locacao_var_12m_pct", 54: "locacao_preco_m2",
    55: "rentabilidade_aluguel_mensal_pct",
}
COL_LOCACAO_RESIDENCIAL_PRECO = 37
COL_LOCACAO_RESIDENCIAL_VAR12 = 32
ABAS_NAO_CIDADE = {"Resumo", "Aux", "Índice FipeZAP"}


def conferir_layout(cab: pd.DataFrame, aba: str) -> None:
    linha0, linha1, linha2 = (cab.iloc[i].fillna("").astype(str) for i in range(3))
    ok = ("omercia" in linha0[47] and "enda" in linha1[47] and "ocação" in linha1[51]
          and "Preço médio" in linha2[50] and "Preço médio" in linha2[54]
          and "ocação" in linha1[22] and "Preço médio" in linha2[COL_LOCACAO_RESIDENCIAL_PRECO]
          and "12 meses" in linha2[COL_LOCACAO_RESIDENCIAL_VAR12])
    if not ok:
        raise ValueError(f"Layout inesperado na aba {aba}; revisar o mapa de colunas")


def main() -> None:
    arquivo = sorted(IN_DIR.glob("fipezap-serieshistoricas_*.xlsx"))[-1]
    xls = pd.ExcelFile(arquivo)
    series, ultimos = [], []
    for aba in xls.sheet_names:
        if aba in ABAS_NAO_CIDADE:
            continue
        bruto = xls.parse(aba, header=None)
        conferir_layout(bruto.iloc[:4], aba)
        dados = bruto.iloc[4:].copy()
        dados = dados[pd.to_datetime(dados[1], errors="coerce").notna()]
        df = pd.DataFrame({"cidade": aba, "data": pd.to_datetime(dados[1]).dt.date})
        # A planilha guarda variações e rentabilidade como fração (0,05 = 5%); as saídas usam pontos percentuais
        for col, nome in COMERCIAL.items():
            fator = 100 if nome.endswith("_pct") else 1
            df[nome] = pd.to_numeric(dados[col], errors="coerce").values * fator
        df["residencial_locacao_preco_m2"] = pd.to_numeric(dados[COL_LOCACAO_RESIDENCIAL_PRECO], errors="coerce").values
        df["residencial_locacao_var_12m_pct"] = pd.to_numeric(dados[COL_LOCACAO_RESIDENCIAL_VAR12], errors="coerce").values * 100

        com = df.dropna(subset=list(COMERCIAL.values()), how="all")
        series.append(com.drop(columns=["residencial_locacao_preco_m2", "residencial_locacao_var_12m_pct"]))
        u = {"cidade": aba}
        loc = df.dropna(subset=["locacao_preco_m2"])
        if len(loc):
            u.update(comercial_data=loc["data"].iloc[-1], comercial_locacao_preco_m2=loc["locacao_preco_m2"].iloc[-1],
                     comercial_locacao_var_12m_pct=loc["locacao_var_12m_pct"].iloc[-1],
                     comercial_rentabilidade_mensal_pct=loc["rentabilidade_aluguel_mensal_pct"].iloc[-1])
        res = df.dropna(subset=["residencial_locacao_preco_m2"])
        if len(res):
            u.update(residencial_data=res["data"].iloc[-1],
                     residencial_locacao_preco_m2=res["residencial_locacao_preco_m2"].iloc[-1],
                     residencial_locacao_var_12m_pct=res["residencial_locacao_var_12m_pct"].iloc[-1])
        ultimos.append(u)

    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
    serie = pd.concat(series, ignore_index=True)
    serie.to_csv(PROCESSED_DIR / "bases_fipezap_comercial_series.csv", index=False)

    capitais = pd.DataFrame([{"codigo_ibge": k, "capital": v[0], "uf": v[1]} for k, v in CAPITAIS.items()])
    tabela = capitais.merge(pd.DataFrame(ultimos), left_on="capital", right_on="cidade", how="left").drop(columns="cidade")
    tabela["cobertura_comercial"] = tabela.get("comercial_locacao_preco_m2").notna()
    tabela["cobertura_residencial"] = tabela.get("residencial_locacao_preco_m2").notna()

    # O FipeZAP comercial nunca cobriu as demais capitais (versões de 2017 a 2026 conferidas).
    # Estimativa: locação residencial da capital × razão comercial/residencial das capitais cobertas,
    # em faixa (mínimo, mediana e máximo da razão). É estimativa do autor sobre dado N2, não dado observado.
    ambos = tabela["cobertura_comercial"] & tabela["cobertura_residencial"]
    razao = tabela.loc[ambos, "comercial_locacao_preco_m2"] / tabela.loc[ambos, "residencial_locacao_preco_m2"]
    tabela["razao_comercial_residencial"] = razao.round(3)
    estimar = ~tabela["cobertura_comercial"] & tabela["cobertura_residencial"]
    for nome, valor in [("min", razao.min()), ("mediana", razao.median()), ("max", razao.max())]:
        tabela.loc[estimar, f"comercial_estimado_preco_m2_{nome}"] = (
            tabela.loc[estimar, "residencial_locacao_preco_m2"] * valor).round(2)
    tabela["fonte_locacao_comercial"] = "sem dado FipeZAP"
    tabela.loc[estimar, "fonte_locacao_comercial"] = "estimativa: residencial × razão comercial/residencial das capitais cobertas"
    tabela.loc[tabela["cobertura_comercial"], "fonte_locacao_comercial"] = "FipeZAP comercial"
    print(f"razão comercial/residencial em {len(razao)} capitais: mín. {razao.min():.3f}, "
          f"mediana {razao.median():.3f}, máx. {razao.max():.3f}")
    tabela.to_csv(PROCESSED_DIR / "bases_fipezap_capitais_ultimo_mes.csv", index=False)
    print("cidades com série comercial:", sorted(serie["cidade"].unique()))
    print(tabela.to_string(index=False))


if __name__ == "__main__":
    main()
