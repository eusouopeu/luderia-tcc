"""
Salário de admissão por ocupação e capital, a partir das admissões do Novo CAGED
filtradas por collect_bases_caged.py.

Critérios: admissões com jornada contratual de 40 horas semanais ou mais e salário
fixo pago por mês; exclui trabalho intermitente, trabalho parcial e aprendiz;
salário maior que zero.

Saída: _data/processed/[E] Bases publicas/bases_caged_salario_admissao_capitais.csv
  recorte: "todas as atividades" ou "CNAE 56 - alimentação"
  uma linha por recorte × capital × ocupação, mais a linha "27 capitais" de cada ocupação.
  amostra_pequena = menos de 30 admissões.
Uso no plano: custo de pessoal (7.5 e cap. 9), valores nominais do período indicado.
"""

import pandas as pd

from bases_comum import CAPITAIS, PROCESSED_DIR, RAW_DIR
from collect_bases_caged import CBOS

IN_DIR = RAW_DIR / "caged"
OUT_PATH = PROCESSED_DIR / "bases_caged_salario_admissao_capitais.csv"
HORAS_MINIMAS = 40
UNIDADE_MES = "5"  # unidadesaláriocódigo: 5 = Mês (layout do Novo CAGED)
MUNICIPIO_CAPITAL = {cod[:6]: nome for cod, (nome, _) in CAPITAIS.items()}


def numero(s: pd.Series) -> pd.Series:
    return pd.to_numeric(s.str.replace(",", ".", regex=False), errors="coerce")


def agregar(df: pd.DataFrame, chaves: list[str]) -> pd.DataFrame:
    return df.groupby(chaves).agg(
        admissoes=("salario", "size"),
        salario_p25=("salario", lambda s: s.quantile(0.25)),
        salario_mediana=("salario", "median"),
        salario_p75=("salario", lambda s: s.quantile(0.75)),
        salario_medio=("salario", "mean"),
        horas_mediana=("horas", "median"),
    ).reset_index()


def main() -> None:
    arquivos = sorted(IN_DIR.glob("caged_mov_*_admissoes.csv"))
    df = pd.concat((pd.read_csv(a, dtype=str) for a in arquivos), ignore_index=True)
    n_total = len(df)
    df["salario"] = numero(df["salário"])
    df["horas"] = numero(df["horascontratuais"])
    filtro = ((df["indtrabintermitente"] != "1") & (df["indtrabparcial"] != "1")
              & (df["indicadoraprendiz"] != "1") & (df["unidadesaláriocódigo"] == UNIDADE_MES)
              & (df["horas"] >= HORAS_MINIMAS) & (df["salario"] > 0))
    df = df[filtro].copy()
    df["capital"] = df["município"].map(MUNICIPIO_CAPITAL)
    df["cbo"] = df["cbo2002ocupação"]
    df["ocupacao"] = df["cbo"].map(CBOS)
    periodo = f"{df['competênciamov'].min()}-{df['competênciamov'].max()}"

    saidas = []
    for recorte, base in [("todas as atividades", df), ("CNAE 56 - alimentação", df[df["subclasse"].str.startswith("56")])]:
        por_capital = agregar(base, ["capital", "cbo", "ocupacao"])
        todas = agregar(base, ["cbo", "ocupacao"]).assign(capital="27 capitais")
        saidas.append(pd.concat([por_capital, todas], ignore_index=True).assign(recorte=recorte))
    out = pd.concat(saidas, ignore_index=True)
    out["periodo_competencia"] = periodo
    out["amostra_pequena"] = out["admissoes"] < 30
    for c in ["salario_p25", "salario_mediana", "salario_p75", "salario_medio"]:
        out[c] = out[c].round(2)
    out = out[["recorte", "capital", "cbo", "ocupacao", "admissoes", "salario_p25", "salario_mediana",
               "salario_p75", "salario_medio", "horas_mediana", "periodo_competencia", "amostra_pequena"]]

    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
    out.to_csv(OUT_PATH, index=False)
    print(f"{n_total} admissões lidas, {len(df)} após filtros; competências {periodo}")
    print(out[out["capital"] == "27 capitais"].to_string(index=False))


if __name__ == "__main__":
    main()
