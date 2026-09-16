"""
Salário de admissão por ocupação e capital, a partir das admissões do Novo CAGED
filtradas por collect_bases_caged.py, em corte recente e em série histórica.

Critérios: admissões com jornada contratual de 40 horas semanais ou mais e salário
fixo pago por mês; exclui trabalho intermitente, trabalho parcial e aprendiz.
Colunas ausentes em meses antigos não filtram (o mês entra sem aquele critério).
Para a média não ser distorcida por erro de declaração, ficam de fora salários
abaixo de 50% ou acima de 30 vezes o salário mínimo vigente na competência.

Saídas em _data/processed/[E] Bases publicas/:
Saídas em Multiuso/ (custo de pessoal em 7.5 e cap. 9), no padrão "[E] {dado} {período} ({fonte}).csv":
  "Salário Admissão por Capital"   últimos 12 meses: média, p25, mediana, p75
  "Salário Admissão Mensal"        por competência: média nominal e real, mediana, salário mínimo
                                   vigente e razão média/mínimo
  "Salário Admissão Anual"         por ano: média nominal e real, variação anual, razão média/mínimo;
                                   ano incompleto sinalizado
Cada saída tem os recortes "todas as atividades" e "CNAE 56 - alimentação" e a linha
"27 capitais" de cada ocupação. amostra_pequena = menos de 30 admissões.
Valores reais a preços do último mês do IPCA disponível (SGS 433).
Uso no plano: custo de pessoal (7.5 e cap. 9) e projeção de reajustes salariais.
"""

import pandas as pd

from bases_comum import CAPITAIS, PROCESSED_DIR, RAW_DIR, caminho_saida, ler_json, rotulo_periodo
from collect_bases_caged import CBOS

IN_DIR = RAW_DIR / "caged"
BCB_DIR = RAW_DIR / "bcb"
HORAS_MINIMAS = 40
UNIDADE_MES = "5"  # unidadesaláriocódigo: 5 = Mês (layout do Novo CAGED)
LIMITE_INFERIOR_SM = 0.5
LIMITE_SUPERIOR_SM = 30
MUNICIPIO_CAPITAL = {cod[:6]: nome for cod, (nome, _) in CAPITAIS.items()}
FILTROS_EXCLUSAO = {"indtrabintermitente": "1", "indtrabparcial": "1", "indicadoraprendiz": "1"}


def numero(s: pd.Series) -> pd.Series:
    return pd.to_numeric(s.str.replace(",", ".", regex=False), errors="coerce")


def salario_minimo_mensal() -> pd.Series:
    dados = pd.DataFrame(ler_json(BCB_DIR / "sgs_1619_salario_minimo.json")["dados"])
    comp = pd.to_datetime(dados["data"], format="%d/%m/%Y").dt.strftime("%Y%m").astype(int)
    return pd.Series(pd.to_numeric(dados["valor"]).values, index=comp, name="salario_minimo")


def ipca_indice() -> pd.Series:
    dados = pd.DataFrame(ler_json(BCB_DIR / "sgs_433_ipca_variacao_mensal.json")["dados"])
    comp = pd.to_datetime(dados["data"], format="%d/%m/%Y").dt.strftime("%Y%m").astype(int)
    indice = (1 + pd.to_numeric(dados["valor"]) / 100).cumprod()
    return pd.Series(indice.values, index=comp, name="ipca_indice")


def ler_mes(arquivo, sm: pd.Series) -> tuple[pd.DataFrame, dict]:
    df = pd.read_csv(arquivo, dtype=str)
    n = len(df)
    filtro = pd.Series(True, index=df.index)
    ausentes = []
    for coluna, valor in FILTROS_EXCLUSAO.items():
        if coluna in df:
            filtro &= df[coluna] != valor
        else:
            ausentes.append(coluna)
    if "unidadesaláriocódigo" in df:
        filtro &= df["unidadesaláriocódigo"] == UNIDADE_MES
    else:
        ausentes.append("unidadesaláriocódigo")
    salario = numero(df["salário"])
    horas = numero(df["horascontratuais"])
    comp = df["competênciamov"].astype(int)
    minimo = comp.map(sm)
    filtro &= (horas >= HORAS_MINIMAS) & (salario >= LIMITE_INFERIOR_SM * minimo) & (salario <= LIMITE_SUPERIOR_SM * minimo)
    out = pd.DataFrame({
        "competencia": comp[filtro].values,
        "capital": df.loc[filtro, "município"].map(MUNICIPIO_CAPITAL).values,
        "cbo": df.loc[filtro, "cbo2002ocupação"].values,
        "cnae56": df.loc[filtro, "subclasse"].str.startswith("56").values,
        "salario": salario[filtro].values,
        "horas": horas[filtro].values,
    })
    return out, {"arquivo": arquivo.name, "lidas": n, "validas": len(out), "sem_coluna": ",".join(ausentes)}


def agregar(df: pd.DataFrame, chaves: list[str]) -> pd.DataFrame:
    """Agrega por recorte; acrescenta a linha "27 capitais" de cada ocupação."""
    partes = []
    for recorte, base in [("todas as atividades", df), ("CNAE 56 - alimentação", df[df["cnae56"]])]:
        for por_capital in (True, False):
            grupo = chaves + ["cbo"] + (["capital"] if por_capital else [])
            g = base.groupby(grupo).agg(
                admissoes=("salario", "size"),
                salario_medio=("salario", "mean"),
                salario_p25=("salario", lambda s: s.quantile(0.25)),
                salario_mediana=("salario", "median"),
                salario_p75=("salario", lambda s: s.quantile(0.75)),
                salario_medio_real=("salario_real", "mean"),
                horas_mediana=("horas", "median"),
            ).reset_index()
            if not por_capital:
                g["capital"] = "27 capitais"
            partes.append(g.assign(recorte=recorte))
    out = pd.concat(partes, ignore_index=True)
    out["ocupacao"] = out["cbo"].map(CBOS)
    out["amostra_pequena"] = out["admissoes"] < 30
    for c in [c for c in out.columns if c.startswith("salario_")]:
        out[c] = out[c].round(2)
    return out


def main() -> None:
    sm = salario_minimo_mensal()
    ipca = ipca_indice()
    arquivos = sorted(IN_DIR.glob("caged_mov_*_admissoes.csv*"))
    partes, controle = [], []
    for arq in arquivos:
        df, info = ler_mes(arq, sm)
        partes.append(df)
        controle.append(info)
    df = pd.concat(partes, ignore_index=True)
    controle = pd.DataFrame(controle)
    print(f"{controle['lidas'].sum()} admissões lidas, {len(df)} válidas em {len(arquivos)} meses")
    if controle["sem_coluna"].str.len().gt(0).any():
        print(controle.loc[controle["sem_coluna"].str.len() > 0, ["arquivo", "sem_coluna"]].to_string(index=False))

    base_ipca = ipca.loc[ipca.index <= df["competencia"].max()].iloc[-1]
    df["salario_real"] = df["salario"] * base_ipca / df["competencia"].map(ipca)
    df["ano"] = df["competencia"] // 100
    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
    colunas = ["recorte", "capital", "cbo", "ocupacao", "admissoes", "salario_medio", "salario_p25", "salario_mediana",
               "salario_p75", "salario_medio_real", "horas_mediana", "amostra_pequena"]

    # Corte recente: últimos 12 meses
    ultimos = sorted(df["competencia"].unique())[-12:]
    recente = agregar(df[df["competencia"].isin(ultimos)], [])
    recente["periodo_competencia"] = f"{ultimos[0]}-{ultimos[-1]}"
    recente[colunas + ["periodo_competencia"]].to_csv(
        caminho_saida("Multiuso", "Salário Admissão por Capital", rotulo_periodo(ultimos), "CAGED"), index=False)

    # Série mensal
    mensal = agregar(df, ["competencia"])
    mensal["salario_minimo"] = mensal["competencia"].map(sm)
    mensal["razao_medio_salario_minimo"] = (mensal["salario_medio"] / mensal["salario_minimo"]).round(3)
    mensal = mensal[["competencia"] + colunas + ["salario_minimo", "razao_medio_salario_minimo"]]
    mensal.sort_values(["recorte", "capital", "cbo", "competencia"]).to_csv(
        caminho_saida("Multiuso", "Salário Admissão Mensal", rotulo_periodo(mensal["competencia"]), "CAGED"), index=False)

    # Série anual
    anual = agregar(df, ["ano"])
    meses_ano = df.groupby("ano")["competencia"].nunique()
    sm_ano = sm.groupby(sm.index // 100).mean()
    anual["meses_no_ano"] = anual["ano"].map(meses_ano)
    anual["ano_incompleto"] = anual["meses_no_ano"] < 12
    anual["salario_minimo_medio_ano"] = anual["ano"].map(sm_ano).round(2)
    anual["razao_medio_salario_minimo"] = (anual["salario_medio"] / anual["salario_minimo_medio_ano"]).round(3)
    anual = anual.sort_values(["recorte", "capital", "cbo", "ano"])
    chave = ["recorte", "capital", "cbo"]
    # Variação só entre anos consecutivos; ano ausente na série não gera variação
    consecutivo = anual.groupby(chave)["ano"].diff() == 1
    for coluna, destino in [("salario_medio", "var_anual_nominal_pct"), ("salario_medio_real", "var_anual_real_pct")]:
        anual[destino] = (anual.groupby(chave)[coluna].pct_change() * 100).round(2).where(consecutivo)
    anual = anual[["ano"] + colunas + ["meses_no_ano", "ano_incompleto", "salario_minimo_medio_ano",
                                       "razao_medio_salario_minimo", "var_anual_nominal_pct", "var_anual_real_pct"]]
    anual.to_csv(caminho_saida("Multiuso", "Salário Admissão Anual", rotulo_periodo(anual["ano"]), "CAGED"), index=False)

    print(f"preços reais de {df['competencia'].max()}")
    vis = anual[(anual["capital"] == "27 capitais") & (anual["recorte"] == "CNAE 56 - alimentação")]
    print(vis[["ano", "ocupacao", "admissoes", "salario_medio", "salario_medio_real", "razao_medio_salario_minimo",
               "var_anual_nominal_pct", "ano_incompleto"]].to_string(index=False))


if __name__ == "__main__":
    main()
