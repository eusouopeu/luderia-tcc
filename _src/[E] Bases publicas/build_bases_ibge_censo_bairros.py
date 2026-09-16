"""
Trata os Agregados por Bairros do Censo 2022 (IBGE) para as 27 capitais.

Entrada: zips e dicionário em _data/raw/[E] Bases publicas/ibge_censo_2022/
Saída: "[E] População por Bairro 2022 (IBGE Censo).csv"
  uma linha por bairro: população, domicílios, média de moradores, área, densidade,
  população por faixa etária e participação da faixa de 20 a 39 anos.

Só entram capitais com divisão oficial de bairros cadastrada no IBGE.
Uso no plano: escolha do bairro e perfil do entorno (6.4, 7.1).
"""

import re
import zipfile

import pandas as pd

from bases_comum import CAPITAIS, PROCESSED_DIR, RAW_DIR, caminho_saida

IN_DIR = RAW_DIR / "ibge_censo_2022"
OUT_PATH = caminho_saida("População por Bairro", "2022", "IBGE Censo")
BASICO = {"v0001": "pessoas", "v0002": "domicilios", "v0007": "domicilios_particulares_ocupados",
          "v0005": "media_moradores"}


def dentro_de_20_39(coluna: str) -> bool:
    """Faixas do agregado por bairros contidas em 20 a 39 anos (ex.: pop_30_a_39_anos)."""
    limites = [int(n) for n in re.findall(r"\d+", coluna)]
    return len(limites) == 2 and limites[0] >= 20 and limites[1] <= 39


def ler_zip(padrao: str) -> pd.DataFrame:
    arquivo = sorted(IN_DIR.glob(padrao))[-1]
    with zipfile.ZipFile(arquivo) as zf:
        bruto = zf.read(zf.namelist()[0])
    for encoding in ("utf-8", "latin-1"):
        try:
            texto = bruto.decode(encoding)
            break
        except UnicodeDecodeError:
            continue
    from io import StringIO
    return pd.read_csv(StringIO(texto), sep=";", dtype=str)


def numero(serie: pd.Series) -> pd.Series:
    # "X" = sigilo; "." = não se aplica
    return pd.to_numeric(serie.str.replace(",", ".", regex=False), errors="coerce")


def rotulos_faixas() -> dict[str, str]:
    dic = pd.read_excel(sorted(IN_DIR.glob("dicionario*.xlsx"))[-1], sheet_name="Dicionário não PCT",
                        header=None, dtype=str)
    dic = dic[dic[1].str.strip() == "Demografia"]
    faixas = dic[dic[3].str.strip().str.match(r"^\d+ (a \d+ anos|anos ou mais)$")]
    return {v.strip(): "pop_" + re.sub(r"\W+", "_", d.strip()) for v, d in zip(faixas[2], faixas[3])}


def main() -> None:
    basico = ler_zip("Agregados_por_bairros_basico_*.zip")
    basico.columns = [c.lower() if c.lower().startswith("v") else c for c in basico.columns]
    basico = basico[basico["CD_MUN"].isin(CAPITAIS)]

    rotulos = rotulos_faixas()
    demo = ler_zip("Agregados_por_bairros_demografia_*.zip")
    demo = demo[["CD_BAIRRO"] + list(rotulos)].rename(columns=rotulos)

    df = basico[["CD_BAIRRO", "NM_BAIRRO", "CD_MUN", "AREA_KM2"] + list(BASICO)].rename(columns=BASICO)
    df = df.merge(demo, on="CD_BAIRRO", how="left")
    for c in df.columns:
        if c not in ("CD_BAIRRO", "NM_BAIRRO", "CD_MUN"):
            df[c] = numero(df[c])
    df.insert(3, "capital", df["CD_MUN"].map(lambda c: CAPITAIS[c][0]))
    df.insert(4, "uf", df["CD_MUN"].map(lambda c: CAPITAIS[c][1]))
    df["densidade_hab_km2"] = (df["pessoas"] / df["AREA_KM2"]).round(1)
    faixas_20_39 = [c for c in rotulos.values() if dentro_de_20_39(c)]
    print("faixas somadas em pop_20_39:", faixas_20_39)
    df["pop_20_39"] = df[faixas_20_39].sum(axis=1, min_count=len(faixas_20_39))
    df["pct_pop_20_39"] = (df["pop_20_39"] / df["pessoas"] * 100).round(1)
    df.columns = [c.lower() for c in df.columns]

    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
    df.to_csv(OUT_PATH, index=False)
    print(f"{len(df)} bairros em {df['capital'].nunique()} capitais")
    print(df.groupby("capital").agg(bairros=("cd_bairro", "size"), pessoas=("pessoas", "sum")).to_string())
    sem = sorted({v[0] for v in CAPITAIS.values()} - set(df["capital"]))
    print("capitais sem bairros cadastrados:", sem)


if __name__ == "__main__":
    main()
