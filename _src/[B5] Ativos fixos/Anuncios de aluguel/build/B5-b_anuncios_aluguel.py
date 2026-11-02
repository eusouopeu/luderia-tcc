"""
Junta os CSVs do coletor de anúncios (webscripts/portais_aluguel.user.js) num
cadastro único de anúncios de aluguel e num resumo do preço pedido por bairro.

Entrada: dados/[B5] Ativos fixos/_dados-brutos/aluguel/AAAA-MM-DD_HHmm_<portal>_anuncios_aluguel.csv
         (os CSVs baixados pelo coletor, um por portal e data; o nome antigo, sem a hora,
         também vale). CSV da pasta fora desse padrão (ex.: "... (1).csv") gera aviso.
Saídas em dados/[B5] Ativos fixos/aluguel/, no padrão "[B5] {dado} {período} ({fonte}).csv":
  "Anúncios de Aluguel"            um anúncio por linha: aluguel, condomínio + IPTU, área, R$/m², segmento
  "Aluguel Pedido por Bairro"      por segmento e bairro: anúncios, mediana e quartis do R$/m² e do aluguel

Regras:
  - Fica só o que é aluguel em Salvador, com preço entre R$ 300 e R$ 100 mil e área informada.
  - ZAP e Viva Real publicam o mesmo anúncio com o mesmo id: conta uma vez (coluna portais).
  - Anúncio repetido com outro id (mesmo segmento, bairro, área e aluguel) conta uma vez; a
    coleta mais recente de cada anúncio prevalece.
  - Segmento: primeiro pela categoria da busca (busca_url: loja-salao, conjunto-comercial,
    comercio-e-industria, ponto-comercial → comercial; apartamento, casa, QuintoAndar →
    residencial); busca sem categoria, pelo tipo e título com termos só comerciais ("sala
    comercial", não "sala"). A coluna segmento_origem diz qual dos dois decidiu.
  - Bairro: agrupado sem acento, caixa e espaços repetidos; o nome exibido é a grafia mais
    frequente do grupo.
  - R$/m² fora de [Q1 − 3·IQR, Q3 + 3·IQR] do segmento sai (área ou preço digitado errado);
    o print mostra quantos saíram em cada segmento.
  - Resumo: bairro com menos de 5 anúncios fica com amostra_suficiente = "não" e sem quartis.
  - É preço pedido, não preço fechado: o FipeZap (também preço de anúncio) e as cotações
    no ponto completam a premissa C07 do cap. 9.
"""

# Caminhos: _src/extras/ (log comum) e outros/ do objeto (auxiliares); log em ../logs/
import sys
from pathlib import Path
_AQUI = Path(__file__).resolve()
sys.path[:0] = [str(_AQUI.parents[3] / "extras"), str(_AQUI.parents[1] / "outros")]
from log_execucao import registrar_execucao  # noqa: E402
if __name__ == "__main__":
    registrar_execucao(__file__)

import re
import unicodedata

import pandas as pd

ROOT = Path(__file__).resolve().parents[4]
BLOCO = ROOT / "dados" / "[B5] Ativos fixos"
IN_DIR = BLOCO / "_dados-brutos" / "aluguel"
OUT_DIR = BLOCO / "aluguel"
FONTE = {"olx": "OLX", "zap": "ZAP", "vivareal": "Viva Real", "quintoandar": "QuintoAndar"}
ALUGUEL_MIN, ALUGUEL_MAX = 300, 100_000
RE_ARQUIVO = re.compile(r"^\d{4}-\d{2}-\d{2}(_\d{4})?_[a-z]+_anuncios_aluguel\.csv$")
# Categoria da busca (busca_url): decide o segmento quando a busca já filtrou o tipo.
RE_BUSCA_COMERCIAL = re.compile(r"loja-salao|conjunto-comercial|comercio-e-industria|ponto-comercial|galpao|predio-inteiro|imoveis-comerciais|consultorio")
RE_BUSCA_RESIDENCIAL = re.compile(r"quintoandar\.com\.br|/apartamentos?[/_-]|/casas?[/_-]|kitnet|flat|cobertura")
# Busca sem categoria: termos que só aparecem em imóvel comercial ("sala comercial", não "sala";
# "box comercial", não "box", que também é o do banheiro).
RE_COMERCIAL = re.compile(
    r"\b(lojas?|(?:salao|saloes|salas?|pontos?|imove(?:l|is)|predios?|conjuntos?|box) comercia(?:l|is)"
    r"|galpao|galpoes|depositos?|armazem|escritorios?|consultorios?|andar corporativo"
    r"|sala para escritorio|sala empresarial|centro empresarial)\b"
)
NUMERICAS = ["aluguel", "condominio", "iptu", "condominio_iptu", "area_m2", "quartos", "banheiros", "vagas", "pagina"]
IQR_FATOR = 3
MIN_AMOSTRA = 5


def sem_acento(texto) -> str:
    t = unicodedata.normalize("NFD", str(texto or ""))
    return "".join(c for c in t if unicodedata.category(c) != "Mn").lower().strip()


def chave_bairro(texto) -> str:
    return re.sub(r"\s+", " ", re.sub(r"[^\w\s]", " ", sem_acento(texto))).strip()


def segmento_de(busca_url, tipo, titulo) -> tuple[str, str]:
    """Devolve (segmento, origem): pela categoria da busca ou, sem ela, pelo tipo e título."""
    url = str(busca_url or "").lower()
    if RE_BUSCA_COMERCIAL.search(url):
        return "comercial", "busca"
    if RE_BUSCA_RESIDENCIAL.search(url):
        return "residencial", "busca"
    texto = sem_acento(f"{tipo} {titulo}")
    return ("comercial" if RE_COMERCIAL.search(texto) else "residencial"), "texto"


def ler_coletas() -> pd.DataFrame:
    fora = sorted(a.name for a in IN_DIR.glob("*.csv") if not RE_ARQUIVO.match(a.name))
    for nome in fora:
        print(f"AVISO: {nome} fora do padrão AAAA-MM-DD_HHmm_<portal>_anuncios_aluguel.csv; não foi lido. Renomeie se for do coletor.")
    arquivos = sorted(a for a in IN_DIR.glob("*.csv") if RE_ARQUIVO.match(a.name))
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

    segmentos = [segmento_de(u, t, ti) for u, t, ti in zip(df["busca_url"], df["tipo"], df["titulo"])]
    df = df.assign(
        bairro_chave=df["bairro"].map(chave_bairro),
        segmento=[s for s, _ in segmentos],
        segmento_origem=[o for _, o in segmentos],
        aluguel_m2=(df["aluguel"] / df["area_m2"]).round(2),
    )
    # Grafia exibida: a mais frequente de cada bairro (empate: a primeira em ordem alfabética).
    grafia = (df.assign(b=df["bairro"].str.strip()).groupby("bairro_chave")["b"]
              .agg(lambda s: s.value_counts().sort_index().sort_values(ascending=False, kind="stable").index[0]))
    df = df.assign(bairro=df["bairro_chave"].map(grafia))
    print(f"segmento pela busca: {df['segmento_origem'].eq('busca').sum()}; pelo texto: {df['segmento_origem'].eq('texto').sum()}")

    repeticao = df[["segmento", "bairro_chave", "area_m2", "aluguel"]]
    n2 = len(df)
    df = df[~repeticao.duplicated(keep="last")]
    print(f"mesmo segmento, bairro, área e aluguel com outro id: {n2} -> {len(df)}")

    df = sem_extremos(df)

    colunas = ["portais", "id", "url", "segmento", "segmento_origem", "tipo", "titulo", "bairro", "endereco", "aluguel",
               "condominio", "iptu", "condominio_iptu", "area_m2", "aluguel_m2", "quartos", "banheiros", "vagas",
               "anunciante", "publicado", "data_coleta"]
    return df[colunas].sort_values(["segmento", "bairro", "aluguel_m2"]).reset_index(drop=True)


def sem_extremos(df: pd.DataFrame) -> pd.DataFrame:
    """Tira o R$/m² fora de [Q1 − 3·IQR, Q3 + 3·IQR] de cada segmento (área ou preço digitado errado)."""
    g = df.groupby("segmento")["aluguel_m2"]
    q1, q3 = g.transform(lambda s: s.quantile(0.25)), g.transform(lambda s: s.quantile(0.75))
    iqr = q3 - q1
    dentro = df["aluguel_m2"].between(q1 - IQR_FATOR * iqr, q3 + IQR_FATOR * iqr)
    for seg, n in df.loc[~dentro, "segmento"].value_counts().items():
        print(f"R$/m² extremo ({seg}): {n} anúncios fora de Q1 − {IQR_FATOR}·IQR a Q3 + {IQR_FATOR}·IQR")
    print(f"sem extremos de R$/m²: {len(df)} -> {dentro.sum()}")
    return df[dentro]


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
    # Com menos de MIN_AMOSTRA anúncios, os quartis não dizem nada: ficam vazios e a linha é marcada.
    pouca = res["anuncios"] < MIN_AMOSTRA
    res.loc[pouca, ["aluguel_m2_p25", "aluguel_m2_p75"]] = float("nan")
    res.insert(3, "amostra_suficiente", (~pouca).map({True: "sim", False: "não"}))
    # Cada anúncio está num único bairro e segmento: a soma das linhas fecha com o total.
    assert res["anuncios"].sum() == len(df), "resumo por bairro não fecha com o total de anúncios"
    return res.sort_values(["segmento", "anuncios"], ascending=[True, False])


def main() -> None:
    df = tratar(ler_coletas())
    meses = sorted({d[:7] for d in df["data_coleta"]})
    periodo = meses[0] if len(meses) == 1 else f"{meses[0]} a {meses[-1]}"
    fonte = ", ".join(FONTE[p] for p in FONTE if any(FONTE[p] in s for s in df["portais"]))
    resumo = resumo_por_bairro(df)
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    for dado, tabela in [("Anúncios de Aluguel", df), ("Aluguel Pedido por Bairro", resumo)]:
        destino = OUT_DIR / f"[B5] {dado} {periodo} ({fonte}).csv"
        tabela.to_csv(destino, sep=";", decimal=",", index=False, encoding="utf-8-sig")
        print(f"gravado: {destino.name} ({len(tabela)} linhas)")
    for seg, n in df["segmento"].value_counts().items():
        print(f"  {seg}: {n} anúncios, mediana de R$ {df.loc[df['segmento'].eq(seg), 'aluguel_m2'].median():.2f}/m²")


if __name__ == "__main__":
    main()
