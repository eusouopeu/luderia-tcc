"""
Orça a lista de itens da etapa 1 (reforma, mobiliário, cozinha e bar, caixa e
informática) com os custos do SINAPI e os preços coletados em sites, nos três
cenários do modelo, e resume por premissa (I01 a I04 do cap. 9).

Entradas em dados/[B5] Ativos fixos/:
  orcamento/"[B5] Lista de Itens da Etapa 1 (elaboração própria).csv"
      um item por linha: premissa, unidade, base (fixa ou por_m2), quantidade por cenário,
      fonte da quantidade, fonte do preço (sinapi ou coleta), código SINAPI e termo de busca
  obra_reforma/"[B5] SINAPI Composições BA AAAA-MM (Caixa).csv"   (B5-c_sinapi.py; o mês mais recente)
  _dados-brutos/<categoria>/*_precos.csv                          (coletas em sites, quando houver)
      do webscripts/precos_itens.user.js; usa id_item, url, preco (por unidade da lista), frete
      (vazio = não informado), motivo e excluida, com vírgula decimal. Cada exportação traz tudo o que
      estava guardado no navegador, então os arquivos se repetem entre si.
Saídas em dados/[B5] Ativos fixos/orcamento/:
  "[B5] Orçamento por Item Etapa 1 {mês} (SINAPI e coletas).csv"
      quantidade, preço unitário e total de cada item nos três cenários, com o nível de evidência
  "[B5] Orçamento por Premissa Etapa 1 {mês} (SINAPI e coletas).csv"
      total de cada premissa por cenário, itens com preço e, na I01, o R$ por m² que o modelo usa

Regras:
  - Quantidade "por_m2" multiplica o coeficiente pela área do ponto (C03: 150, 130 e 110 m²).
  - SINAPI: custo da composição na Bahia (sem desoneração) mais o BDI de construção de
    edifícios do TCU (Acórdão 2.622/2013-Plenário): 1º quartil no otimista, médio no
    provável e 3º quartil no pessimista.
  - Coleta: uma linha por item e URL, a do arquivo mais recente (o nome começa por
    AAAA-MM-DD_HHmm); a oferta cuja última linha tem excluida = 1 sai, e também a que tem
    motivo (filtro do painel que ela não passou: medida, palavra exigida ou excluída, combo,
    variante, faixa, sem avaliações), marcada à mão pelo autor. Frete não informado é
    estimado: mediana dos fretes informados do item; sem eles, a mediana da razão frete/preço
    da categoria vezes o preço; sem nenhum frete na categoria, 0. Depois, preço mais frete de
    cada oferta; P75 no pessimista, mediana no provável e P25 no otimista, entre as ofertas
    do item.
  - Item sem preço fica com total vazio e sai da soma: a cobertura (itens com preço sobre
    itens da lista) acompanha o total de cada premissa, que só substitui a estimativa do
    autor no modelo quando a cobertura for completa.
  - Nível: preço do SINAPI é N2 (dado público estruturado) e preço coletado é N3; a
    quantidade é N6 enquanto não houver projeto do ponto.
"""

# Caminhos: _src/extras/ (log comum); log em ../logs/
import sys
from pathlib import Path
_AQUI = Path(__file__).resolve()
sys.path[:0] = [str(_AQUI.parents[3] / "extras")]
from log_execucao import registrar_execucao  # noqa: E402
if __name__ == "__main__":
    registrar_execucao(__file__)

import re

import pandas as pd

ROOT = Path(__file__).resolve().parents[4]
BLOCO = ROOT / "dados" / "[B5] Ativos fixos"
OUT_DIR = BLOCO / "orcamento"
LISTA = OUT_DIR / "[B5] Lista de Itens da Etapa 1 (elaboração própria).csv"
RAW_DIR = BLOCO / "_dados-brutos"
CENARIOS = ["pessimista", "provavel", "otimista"]
AREA_M2 = {"pessimista": 150, "provavel": 130, "otimista": 110}       # C03 do registro de premissas
BDI = {"pessimista": 0.2500, "provavel": 0.2212, "otimista": 0.2034}  # TCU, Acórdão 2.622/2013
QUANTIL_COLETA = {"pessimista": 0.75, "provavel": 0.50, "otimista": 0.25}
PREMISSAS = {"I01": "Reforma e instalações", "I02": "Mobiliário", "I03": "Cozinha e bar", "I04": "Caixa e informática"}
RE_MES = re.compile(r"(\d{4}-\d{2})")


def ler_csv(caminho: Path) -> pd.DataFrame:
    return pd.read_csv(caminho, sep=";", decimal=",", dtype={"codigo_sinapi": "Int64"}, encoding="utf-8-sig")


def ler_lista() -> pd.DataFrame:
    df = ler_csv(LISTA)
    assert df["id"].is_unique, "id repetido na lista de itens"
    assert df["base"].isin(["fixa", "por_m2"]).all(), "base deve ser fixa ou por_m2"
    assert df["fonte_preco"].isin(["sinapi", "coleta"]).all(), "fonte_preco deve ser sinapi ou coleta"
    assert df["premissa"].isin(PREMISSAS).all(), "premissa fora de I01 a I04"
    sem_codigo = df[df["fonte_preco"].eq("sinapi") & df["codigo_sinapi"].isna()]
    assert sem_codigo.empty, f"itens do SINAPI sem código: {', '.join(sem_codigo['id'])}"
    print(f"lista: {len(df)} itens ({df['fonte_preco'].value_counts().to_dict()})")
    return df


def ler_sinapi() -> tuple[str, pd.DataFrame]:
    arquivos = sorted((BLOCO / "obra_reforma").glob("[[]B5[]] SINAPI Composições BA *.csv"))
    if not arquivos:
        raise FileNotFoundError("Sem SINAPI: rodar B5-c_sinapi.py antes")
    arq = arquivos[-1]
    mes = RE_MES.search(arq.name).group(1)
    df = pd.read_csv(arq, sep=";", decimal=",", encoding="utf-8-sig").set_index("codigo")
    print(f"SINAPI: {arq.name} ({len(df)} composições)")
    return mes, df


def ler_coletas() -> pd.DataFrame:
    arquivos = sorted(RAW_DIR.glob("*/*_precos.csv"), key=lambda a: a.name)
    if not arquivos:
        print("coletas em sites: nenhuma ainda")
        return pd.DataFrame(columns=["id_item", "categoria", "fonte", "produto", "preco", "frete", "url", "data_coleta"])
    df = pd.concat([pd.read_csv(a, sep=";", decimal=",", encoding="utf-8-sig", dtype={"cep": str})
                    .assign(arquivo=a.name) for a in arquivos], ignore_index=True)
    if "excluida" not in df:  # exportações anteriores à exclusão no painel
        df["excluida"] = 0
    df["excluida"] = df["excluida"].fillna(0).astype(int)
    if "motivo" not in df:  # exportações anteriores ao registro do motivo
        df["motivo"] = ""
    df["motivo"] = df["motivo"].fillna("").astype(str).str.strip()
    linhas = len(df)
    # Arquivos em ordem de nome (data e hora da exportação): fica a última linha de cada oferta.
    df = df.drop_duplicates(["id_item", "url"], keep="last")
    excluidas = int(df["excluida"].sum())
    fora_filtro = int((df["excluida"].eq(0) & df["motivo"].ne("")).sum())
    df = df[df["excluida"].eq(0) & df["motivo"].eq("") & df["preco"].gt(0)].copy()
    df = estimar_frete(df)
    print(f"coletas em sites: {len(arquivos)} arquivos, {linhas} linhas, {len(df)} ofertas de {df['id_item'].nunique()} itens "
          f"({linhas - len(df) - excluidas - fora_filtro} repetidas entre exportações ou sem preço, {excluidas} excluídas no painel, "
          f"{fora_filtro} fora dos filtros; "
          f"frete estimado em {int(df['frete_estimado'].sum())})")
    return df


def estimar_frete(df: pd.DataFrame) -> pd.DataFrame:
    """Frete vazio (o anúncio não informa): mediana do item; senão, razão frete/preço da categoria."""
    df["frete_estimado"] = df["frete"].isna()
    informado = df[~df["frete_estimado"]]
    por_item = informado.groupby("id_item")["frete"].median()
    razao_categoria = (informado["frete"] / informado["preco"]).groupby(informado["categoria"]).median()
    estimado = df["id_item"].map(por_item)
    estimado = estimado.fillna(df["categoria"].map(razao_categoria) * df["preco"]).fillna(0)
    df["frete"] = df["frete"].fillna(estimado.round(2))
    return df


def precos_unitarios(lista: pd.DataFrame, sinapi: pd.DataFrame, coletas: pd.DataFrame) -> pd.DataFrame:
    precos = pd.DataFrame(index=lista.index, columns=CENARIOS, dtype=float)
    ofertas = pd.Series(0, index=lista.index)

    eh_sinapi = lista["fonte_preco"].eq("sinapi")
    codigos = lista.loc[eh_sinapi, "codigo_sinapi"].astype(int)
    faltando = sorted(set(codigos) - set(sinapi.index))
    assert not faltando, f"códigos fora do SINAPI do mês (composição sem custo na BA?): {faltando}"
    custo = codigos.map(sinapi["custo_rs"])
    for c in CENARIOS:
        precos.loc[eh_sinapi, c] = custo * (1 + BDI[c])
    ofertas[eh_sinapi] = 1

    if not coletas.empty:
        total_oferta = coletas.assign(v=coletas["preco"] + coletas["frete"]).groupby("id_item")["v"]
        idx = lista.index[lista["fonte_preco"].eq("coleta")]
        for c in CENARIOS:
            precos.loc[idx, c] = lista.loc[idx, "id"].map(total_oferta.quantile(QUANTIL_COLETA[c]))
        ofertas[idx] = lista.loc[idx, "id"].map(total_oferta.size()).fillna(0)

    sinapi_desc = lista["codigo_sinapi"].map(lambda c: sinapi.at[int(c), "descricao"] if pd.notna(c) else "")
    return precos.round(2), ofertas.astype(int), sinapi_desc


def orcar(lista: pd.DataFrame, sinapi: pd.DataFrame, coletas: pd.DataFrame) -> pd.DataFrame:
    precos, ofertas, sinapi_desc = precos_unitarios(lista, sinapi, coletas)
    df = lista[["id", "premissa", "categoria", "grupo", "item", "especificacao", "unidade", "base"]].copy()
    for c in CENARIOS:
        coef = lista[f"qtd_{c}"]
        df[f"qtd_{c}"] = (coef * AREA_M2[c]).round(1).where(lista["base"].eq("por_m2"), coef)
    for c in CENARIOS:
        df[f"preco_unit_{c}"] = precos[c]
    for c in CENARIOS:
        df[f"total_{c}"] = (df[f"qtd_{c}"] * precos[c]).round(2)
    df["com_preco"] = precos["provavel"].notna()
    df["ofertas"] = ofertas
    df["fonte_preco"] = lista["fonte_preco"].map({"sinapi": "SINAPI BA, sem desoneração, com BDI", "coleta": "Coleta em sites"})
    df["codigo_sinapi"] = lista["codigo_sinapi"]
    df["descricao_sinapi"] = sinapi_desc
    df["nivel_preco"] = lista["fonte_preco"].map({"sinapi": "N2", "coleta": "N3"}).where(df["com_preco"], "")
    df["nivel_qtd"] = "N6"
    df["fonte_qtd"] = lista["fonte_qtd"]
    df["termo_busca"] = lista["termo_busca"]
    return df


def resumo_por_premissa(itens: pd.DataFrame) -> pd.DataFrame:
    g = itens.groupby("premissa")
    res = pd.DataFrame({
        "descricao": pd.Series(PREMISSAS),
        "itens": g.size(),
        "itens_com_preco": g["com_preco"].sum(),
        **{f"total_{c}": g[f"total_{c}"].sum(min_count=1) for c in CENARIOS},
    }).fillna({"itens_com_preco": 0}).astype({"itens_com_preco": int})
    res["cobertura"] = (res["itens_com_preco"] / res["itens"]).round(3)
    for c in CENARIOS:
        # A premissa I01 do modelo é em R$ por m²; as demais, em R$.
        res[f"i01_rs_m2_{c}"] = (res[f"total_{c}"] / AREA_M2[c]).round(2).where(res.index == "I01")
    # Cada item está numa única premissa: a soma das linhas fecha com o total da lista.
    assert res["itens"].sum() == len(itens), "resumo por premissa não fecha com o número de itens"
    for c in CENARIOS:
        diferenca = res[f"total_{c}"].sum() - itens[f"total_{c}"].sum()
        assert abs(diferenca) < 0.01, f"resumo por premissa não fecha com a soma dos itens ({c})"
    return res.rename_axis("premissa").reset_index()


def main() -> None:
    lista = ler_lista()
    mes, sinapi = ler_sinapi()
    itens = orcar(lista, sinapi, ler_coletas())
    resumo = resumo_por_premissa(itens)

    for dado, tabela in [("Orçamento por Item", itens), ("Orçamento por Premissa", resumo)]:
        destino = OUT_DIR / f"[B5] {dado} Etapa 1 {mes} (SINAPI e coletas).csv"
        tabela.to_csv(destino, sep=";", decimal=",", index=False, encoding="utf-8-sig")
        print(f"gravado: {destino.name} ({len(tabela)} linhas)")
    for _, r in resumo.iterrows():
        totais = " | ".join(f"{c} R$ {r[f'total_{c}']:,.0f}" if pd.notna(r[f"total_{c}"]) else f"{c} sem preço" for c in CENARIOS)
        print(f"  {r['premissa']} {r['descricao']}: {r['itens_com_preco']}/{r['itens']} itens com preço; {totais}")
        if r["premissa"] == "I01":
            print("      R$/m²: " + " | ".join(f"{c} {r[f'i01_rs_m2_{c}']:,.2f}" for c in CENARIOS))


if __name__ == "__main__":
    main()
