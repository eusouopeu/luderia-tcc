"""
Trata os JSON do SIDRA coletados por collect_bases_ibge_sidra.py.

Saídas em _data/processed/[E] Bases publicas/:
  bases_ibge_<consulta>.csv        formato longo, uma linha por valor (uma saída por consulta)
  bases_ibge_resumo_capitais.csv   uma linha por capital: população, faixa de 20 a 39 anos e renda
"""

import pandas as pd

from bases_comum import CAPITAIS, PROCESSED_DIR, RAW_DIR, conferir_capitais, ler_json, sidra_para_df

IN_DIR = RAW_DIR / "ibge_sidra"
OUT_RESUMO = PROCESSED_DIR / "bases_ibge_resumo_capitais.csv"
FAIXAS_20_39 = ["20 a 24 anos", "25 a 29 anos", "30 a 34 anos", "35 a 39 anos"]
PADRAO_PNADC = "habitualmente recebido no trabalho principal"  # variável de referência da tabela 5436


def por_capital(df: pd.DataFrame, nome: str) -> pd.Series:
    df = df[df["localidade_id"].isin(CAPITAIS)]
    return df.groupby("localidade_id")["valor"].sum(min_count=1).rename(nome)


def resumo_capitais(t: dict[str, pd.DataFrame]) -> pd.DataFrame:
    out = pd.DataFrame(
        [{"codigo_ibge": k, "capital": v[0], "uf": v[1]} for k, v in CAPITAIS.items()]
    ).set_index("codigo_ibge")

    out = out.join(por_capital(t["populacao_censo_2022"], "pop_censo_2022"))
    est = t["populacao_estimada"]
    ano = est["periodo"].max()
    out = out.join(por_capital(est[est["periodo"] == ano], f"pop_estimada_{ano}"))

    idade = t["populacao_idade_censo_2022"]
    out = out.join(por_capital(idade[idade["Idade"].isin(FAIXAS_20_39)], "pop_20_39_censo_2022"))
    out["pct_pop_20_39"] = (out["pop_20_39_censo_2022"] / out["pop_censo_2022"] * 100).round(1)

    renda = t["renda_censo_2022_idade"]
    renda = renda[renda["Grupo de idade"] == "Total"]
    out = out.join(por_capital(renda[renda["variavel_id"] == 13502], "renda_media_14mais_censo_2022"))
    out = out.join(por_capital(renda[renda["variavel_id"] == 13503], "renda_mediana_14mais_censo_2022"))

    pnad = t["renda_pnadc_trabalho_capitais"]
    alvo = pnad[pnad["variavel"].str.contains(PADRAO_PNADC) & ~pnad["variavel"].str.startswith("Coeficiente")]
    if alvo["variavel_id"].nunique() != 1:
        raise ValueError(f"Variável da PNAD Contínua ambígua: {alvo['variavel'].unique()}")
    tri = alvo["periodo"].max()
    out = out.join(por_capital(alvo[alvo["periodo"] == tri], f"renda_trabalho_habitual_pnadc_{tri}"))
    return out.reset_index()


def main() -> None:
    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
    tabelas = {}
    for arq in sorted(IN_DIR.glob("*.json")):
        df = sidra_para_df(ler_json(arq))
        conferir_capitais(df)
        df.to_csv(PROCESSED_DIR / f"bases_ibge_{arq.stem}.csv", index=False)
        tabelas[arq.stem] = df
        print(f"{arq.stem:34s} {len(df):>6} linhas")
    resumo = resumo_capitais(tabelas)
    resumo.to_csv(OUT_RESUMO, index=False)
    print(resumo.to_string(index=False))


if __name__ == "__main__":
    main()
