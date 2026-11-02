"""
Junta os CSVs do coletor de anúncios (webscripts/portais_aluguel.user.js) num
cadastro único de anúncios de aluguel e num resumo do preço pedido por bairro.

Entrada: dados/[B4] Bases publicas/_dados-brutos/anuncios_aluguel/AAAA-MM-DD_<portal>_anuncios_aluguel.csv
         (os CSVs baixados pelo coletor, um por portal e data)
Saídas em financeiro/, no padrão "[B4] {dado} {período} ({fonte}).csv":
  "Anúncios de Aluguel"            um anúncio por linha: aluguel, condomínio + IPTU, área, R$/m², segmento
  "Aluguel Pedido por Bairro"      por segmento e bairro: anúncios, mediana e quartis do R$/m² e do aluguel

Regras:
  - Fica só o que é aluguel em Salvador, com preço entre R$ 300 e R$ 100 mil e área informada.
  - ZAP e Viva Real publicam o mesmo anúncio com o mesmo id: conta uma vez (coluna portais).
  - Anúncio repetido com outro id (mesmo bairro, área e aluguel) conta uma vez; a coleta
    mais recente de cada anúncio prevalece.
  - Segmento: comercial pelo tipo ou título (loja, sala, ponto, galpão, prédio comercial...);
    o resto é residencial (o QuintoAndar, em Salvador, só tem residencial).
  - É preço pedido, não preço fechado: o FipeZap (também preço de anúncio) e as cotações
    no ponto completam a premissa C07 do cap. 9.
"""

# Caminhos: _src/extras/ (log comum) e outros/ do objeto (auxiliares); log em ../logs/
import sys
from pathlib import Path
_AQUI = Path(__file__).resolve()
sys.path[:0] = [str(_AQUI.parents[3] / "extras"), str(_AQUI.parents[1] / "outros"), str(_AQUI.parents[2] / "Comum")]
from log_execucao import registrar_execucao  # noqa: E402
if __name__ == "__main__":
    registrar_execucao(__file__)

import re
import unicodedata

import pandas as pd

from bases_comum import RAW_DIR, caminho_saida

IN_DIR = RAW_DIR / "anuncios_aluguel"
FONTE = {"olx": "OLX", "zap": "ZAP", "vivareal": "Viva Real", "quintoandar": "QuintoAndar"}
ALUGUEL_MIN, ALUGUEL_MAX = 300, 100_000
RE_COMERCIAL = re.compile(r"\b(loja|sala|salao|ponto|galpao|deposito|armazem|comerci|conjunto|box|predio|escritorio|consultorio|andar corporativo)")
NUMERICAS = ["aluguel", "condominio", "iptu", "condominio_iptu", "area_m2", "quartos", "banheiros", "vagas", "pagina"]


def sem_acento(texto) -> str:
    t = unicodedata.normalize("NFD", str(texto or ""))
    return "".join(c for c in t if unicodedata.category(c) != "Mn").lower().strip()


def ler_coletas() -> pd.DataFrame:
    arquivos = sorted(IN_DIR.glob("*_anuncios_aluguel.csv"))
    if not arquivos:
        raise FileNotFoundError(f"Nenhum CSV do coletor em {IN_DIR}")
    partes = []
    for arq in arquivos:
        df = pd.read_csv(arq, sep=";", dtype=str, encoding="utf-8-sig", keep_default_na=False)
        df["arquivo"] = arq.name
        partes.append(df)
        print(f"lido: {arq.name} ({len(df)} anúncios)")
    df = pd.concat(partes, ignore_index=True)
    for c in NUMERICAS:
        # O coletor grava sem separador de milhar e com vírgula decimal.
        df[c] = pd.to_numeric(df[c].str.replace(",", ".", regex=False), errors="coerce")
    return df


def tratar(df: pd.DataFrame) -> pd.DataFrame:
    n0 = len(df)
    df = df[df["operacao"].eq("aluguel")]
    df = df[df["cidade"].map(sem_acento).eq("salvador")]
    df = df[df["aluguel"].between(ALUGUEL_MIN, ALUGUEL_MAX) & df["area_m2"].gt(0)]
    print(f"filtro (aluguel em Salvador, preço e área válidos): {n0} -> {len(df)}")

    # ZAP e Viva Real dividem os ids; a coleta mais recente de cada anúncio prevalece.
    df = df.assign(chave=df["portal"].where(~df["portal"].isin(["zap", "vivareal"]), "grupo_olx") + ":" + df["id"])
    df = df.sort_values(["data_coleta", "pagina"])
    portais = df.groupby("chave")["portal"].agg(lambda s: ", ".join(sorted({FONTE[p] for p in s})))
    n1 = len(df)
    df = df.drop_duplicates("chave", keep="last").assign(portais=lambda d: d["chave"].map(portais))
    print(f"mesmo id em mais de um portal ou coleta: {n1} -> {len(df)}")

    df = df.assign(
        bairro=df["bairro"].str.strip(),
        segmento=(df["tipo"] + " " + df["titulo"]).map(sem_acento).map(lambda t: "comercial" if RE_COMERCIAL.search(t) else "residencial"),
        aluguel_m2=(df["aluguel"] / df["area_m2"]).round(2),
    )
    repeticao = pd.DataFrame({"s": df["segmento"], "b": df["bairro"].map(sem_acento), "a": df["area_m2"], "v": df["aluguel"]})
    n2 = len(df)
    df = df[~repeticao.duplicated(keep="last")]
    print(f"mesmo segmento, bairro, área e aluguel com outro id: {n2} -> {len(df)}")

    colunas = ["portais", "id", "url", "segmento", "tipo", "titulo", "bairro", "endereco", "aluguel", "condominio", "iptu",
               "condominio_iptu", "area_m2", "aluguel_m2", "quartos", "banheiros", "vagas", "anunciante", "publicado", "data_coleta"]
    return df[colunas].sort_values(["segmento", "bairro", "aluguel_m2"]).reset_index(drop=True)


def resumo_por_bairro(df: pd.DataFrame) -> pd.DataFrame:
    g = df.groupby(["segmento", "bairro"])
    res = pd.DataFrame({
        "anuncios": g.size(),
        "aluguel_m2_p25": g["aluguel_m2"].quantile(0.25),
        "aluguel_m2_mediana": g["aluguel_m2"].median(),
        "aluguel_m2_p75": g["aluguel_m2"].quantile(0.75),
        "aluguel_mediana": g["aluguel"].median(),
        "area_m2_mediana": g["area_m2"].median(),
        "condominio_iptu_mediana": g["condominio_iptu"].median(),
    }).round(2).reset_index()
    # Cada anúncio está num único bairro e segmento: a soma das linhas fecha com o total.
    assert res["anuncios"].sum() == len(df), "resumo por bairro não fecha com o total de anúncios"
    return res.sort_values(["segmento", "anuncios"], ascending=[True, False])


def main() -> None:
    df = tratar(ler_coletas())
    meses = sorted({d[:7] for d in df["data_coleta"]})
    periodo = meses[0] if len(meses) == 1 else f"{meses[0]} a {meses[-1]}"
    fonte = ", ".join(FONTE[p] for p in FONTE if any(FONTE[p] in s for s in df["portais"]))
    resumo = resumo_por_bairro(df)

    for dado, tabela in [("Anúncios de Aluguel", df), ("Aluguel Pedido por Bairro", resumo)]:
        destino = caminho_saida("financeiro", dado, periodo, fonte)
        tabela.to_csv(destino, sep=";", decimal=",", index=False, encoding="utf-8-sig")
        print(f"gravado: {destino.name} ({len(tabela)} linhas)")
    for seg, n in df["segmento"].value_counts().items():
        print(f"  {seg}: {n} anúncios, mediana de R$ {df.loc[df['segmento'].eq(seg), 'aluguel_m2'].median():.2f}/m²")


if __name__ == "__main__":
    main()
