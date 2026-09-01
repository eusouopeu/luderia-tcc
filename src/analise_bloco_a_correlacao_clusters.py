"""
Bloco A - análises exploratórias de correlação e clusterização por k-means
sobre a tabela de jogos (data/processed/bloco_a_jogos.csv).

Três frentes de análise:

1. Correlação entre variáveis numéricas, em dois recortes:
   a) "derivadas": qt_jogadores_min/max, nota_media, qt_avaliacoes,
      vl_tempo_jogo, idade_minima e as taxas calculadas
      tx_satisfacao = qt_avaliacoes / qt_favorito
      tx_conversao  = qt_avaliacoes / (qt_tem + qt_quer)
   b) "brutas": todas as colunas numéricas originais da tabela que não são
      índices já calculados (exclui tx_retencao, idx_desejo,
      tx_fidelizacao, diversidade_mecanica, amplitude_publico, nota_rank).
   Cada recorte gera matriz de Pearson, matriz de Spearman, p-valores
   pareados e uma listagem de pares ordenada por |r| de Pearson.

2. Correlação "qualitativa": cada mecânica de jogo (coluna `mecanicas`,
   lista separada por ";") vira uma variável dummy (0/1) e é correlacionada
   (point-biserial, equivalente a Pearson binário-contínuo) com cada
   variável bruta. Inclui n (nº de jogos com a mecânica) para o leitor
   avaliar a confiabilidade de cada correlação — mecânicas raras (n baixo)
   produzem r instável.

3. Clusterização k-means:
   a) sobre todas as variáveis brutas padronizadas (multivariada);
   b) quatro clusterizações 1D independentes (duração, idade mínima,
      nota média, nº de avaliações), k=4 cada, com o grupo de menor
      contagem tipicamente correspondendo aos outliers. Para essas quatro,
      o rótulo de cluster é aplicado de volta à tabela inteira e são
      calculadas as estatísticas descritivas (count/mean/std/min/quartis/
      max) de TODAS as variáveis numéricas originais, por grupo.

Uso:
    python3 src/analise_bloco_a_correlacao_clusters.py
"""
import pathlib

import numpy as np
import pandas as pd
from scipy.stats import pearsonr, spearmanr
from sklearn.cluster import KMeans
from sklearn.metrics import silhouette_score
from sklearn.preprocessing import StandardScaler

ROOT = pathlib.Path(__file__).resolve().parent.parent
IN_PATH = ROOT / "data" / "processed" / "bloco_a_jogos.csv"
OUT_DIR = ROOT / "data" / "processed"

VARS_DERIVADAS = [
    "qt_jogadores_min",
    "qt_jogadores_max",
    "nota_media",
    "qt_avaliacoes",
    "vl_tempo_jogo",
    "idade_minima",
    "tx_satisfacao",
    "tx_conversao",
]

VARS_BRUTAS = [
    "ano_publicacao",
    "ano_nacional",
    "qt_jogadores_min",
    "qt_jogadores_max",
    "vl_tempo_jogo",
    "idade_minima",
    "qt_tem",
    "qt_teve",
    "qt_favorito",
    "qt_quer",
    "qt_jogou",
    "n_mecanicas",
    "n_categorias",
    "nota_media",
    "qt_avaliacoes",
]

# todas as variáveis numéricas da tabela original (para as descritivas por
# cluster), excluindo o identificador id_jogo.
COLS_NAO_NUMERICAS = {"id_jogo", "nm_jogo", "mecanicas", "categorias", "temas", "link"}


def carrega_dados():
    df = pd.read_csv(IN_PATH)
    df["tx_satisfacao"] = df["qt_avaliacoes"] / df["qt_favorito"]
    df["tx_conversao"] = df["qt_avaliacoes"] / (df["qt_tem"] + df["qt_quer"])
    df["tx_satisfacao"] = df["tx_satisfacao"].replace([np.inf, -np.inf], np.nan)
    df["tx_conversao"] = df["tx_conversao"].replace([np.inf, -np.inf], np.nan)
    return df


def variaveis_numericas_originais(df):
    return [c for c in df.columns if c not in COLS_NAO_NUMERICAS]


def matriz_correlacao(df, cols, metodo):
    func = spearmanr if metodo == "spearman" else pearsonr
    corr = pd.DataFrame(index=cols, columns=cols, dtype=float)
    pval = pd.DataFrame(index=cols, columns=cols, dtype=float)
    for a in cols:
        for b in cols:
            r, p = func(df[a], df[b])
            corr.loc[a, b] = r
            pval.loc[a, b] = p
    return corr, pval


def pares_ordenados(df, cols):
    linhas = []
    for i in range(len(cols)):
        for j in range(i + 1, len(cols)):
            c1, c2 = cols[i], cols[j]
            r, p = pearsonr(df[c1], df[c2])
            rs, ps = spearmanr(df[c1], df[c2])
            linhas.append((c1, c2, r, p, rs, ps))
    out = pd.DataFrame(
        linhas,
        columns=["var1", "var2", "pearson_r", "pearson_p", "spearman_r", "spearman_p"],
    )
    out["abs_pearson_r"] = out["pearson_r"].abs()
    out = out.sort_values("abs_pearson_r", ascending=False).drop(columns="abs_pearson_r")
    return out


def analisa_correlacoes(df, cols, prefixo):
    sub = df[cols].dropna()
    print(f"\n[{prefixo}] n={len(sub)} linhas completas de {len(df)}")

    corr_pe, pval_pe = matriz_correlacao(sub, cols, "pearson")
    corr_sp, pval_sp = matriz_correlacao(sub, cols, "spearman")
    pares = pares_ordenados(sub, cols)

    corr_pe.to_csv(OUT_DIR / f"bloco_a_correlacao_{prefixo}_pearson.csv")
    pval_pe.to_csv(OUT_DIR / f"bloco_a_correlacao_{prefixo}_pearson_pvalor.csv")
    corr_sp.to_csv(OUT_DIR / f"bloco_a_correlacao_{prefixo}_spearman.csv")
    pval_sp.to_csv(OUT_DIR / f"bloco_a_correlacao_{prefixo}_spearman_pvalor.csv")
    pares.to_csv(OUT_DIR / f"bloco_a_correlacao_{prefixo}_pares_ordenados.csv", index=False)


def analisa_correlacao_mecanicas(df):
    mecs_por_jogo = df["mecanicas"].fillna("").apply(
        lambda s: [m.strip() for m in s.split(";") if m.strip()]
    )
    todas_mecanicas = sorted({m for lst in mecs_por_jogo for m in lst})
    print(f"\n[mecanicas] {len(todas_mecanicas)} mecânicas distintas em {len(df)} jogos")

    dummies = pd.DataFrame(
        {mec: mecs_por_jogo.apply(lambda lst: int(mec in lst)) for mec in todas_mecanicas},
        index=df.index,
    )

    sub_vars = df[VARS_BRUTAS].dropna()
    dummies = dummies.loc[sub_vars.index]

    corr = pd.DataFrame(index=todas_mecanicas, columns=VARS_BRUTAS, dtype=float)
    pval = pd.DataFrame(index=todas_mecanicas, columns=VARS_BRUTAS, dtype=float)
    for mec in todas_mecanicas:
        for var in VARS_BRUTAS:
            r, p = pearsonr(dummies[mec], sub_vars[var])
            corr.loc[mec, var] = r
            pval.loc[mec, var] = p

    corr.insert(0, "n_jogos_com_mecanica", dummies.sum())
    corr.to_csv(OUT_DIR / "bloco_a_correlacao_mecanicas.csv")
    pval.to_csv(OUT_DIR / "bloco_a_correlacao_mecanicas_pvalor.csv")


def escolhe_k(X, k_min=2, k_max=8):
    melhor_k, melhor_score = k_min, -1
    scores = {}
    for k in range(k_min, k_max + 1):
        labels = KMeans(n_clusters=k, n_init=10, random_state=42).fit_predict(X)
        score = silhouette_score(X, labels)
        scores[k] = score
        if score > melhor_score:
            melhor_k, melhor_score = k, score
    return melhor_k, scores


def clusteriza_multivariado(df):
    sub = df[VARS_BRUTAS].dropna().copy()
    X = StandardScaler().fit_transform(sub.values)
    k, scores = escolhe_k(X)
    print(f"\n[k-means multivariado, variáveis brutas] silhueta por k: "
          f"{ {kk: round(vv, 3) for kk, vv in scores.items()} } -> k escolhido: {k}")

    km = KMeans(n_clusters=k, n_init=10, random_state=42).fit(X)
    sub["cluster"] = km.labels_

    cols_id = [c for c in ["id_jogo", "nm_jogo"] if c in df.columns]
    saida = df.loc[sub.index, cols_id].join(sub)
    saida.to_csv(OUT_DIR / "bloco_a_clusters_variaveis_brutas.csv", index=False)

    perfil = sub.groupby("cluster")[VARS_BRUTAS].mean().round(2)
    perfil["n"] = sub.groupby("cluster").size()
    perfil.to_csv(OUT_DIR / "bloco_a_clusters_variaveis_brutas_perfil.csv")


def clusteriza_1d_com_descritivas(df, variavel_cluster, k=4):
    cols_stats = variaveis_numericas_originais(df)
    sub = df.dropna(subset=[variavel_cluster]).copy()

    Xs = StandardScaler().fit_transform(sub[[variavel_cluster]].values)
    km = KMeans(n_clusters=k, n_init=10, random_state=42)
    labels = km.fit_predict(Xs)
    sil = silhouette_score(Xs, labels)
    sub["cluster"] = labels

    # ordena os rótulos de cluster pela média da variável de clusterização,
    # para leitura consistente (cluster 0 = menor, cluster k-1 = maior)
    ordem = sub.groupby("cluster")[variavel_cluster].mean().sort_values().index
    mapa_ordem = {antigo: novo for novo, antigo in enumerate(ordem)}
    sub["cluster"] = sub["cluster"].map(mapa_ordem)

    print(f"\n[cluster 1D: {variavel_cluster}] k={k}, silhueta={sil:.3f}")

    linhas = []
    for cluster_id, grupo in sub.groupby("cluster"):
        desc = grupo[cols_stats].describe().T
        desc.insert(0, "cluster", cluster_id)
        desc.insert(1, "variavel", desc.index)
        linhas.append(desc.reset_index(drop=True))

    saida = pd.concat(linhas, ignore_index=True)
    saida = saida.rename(columns={"50%": "mediana", "25%": "p25", "75%": "p75"})
    saida.to_csv(OUT_DIR / f"bloco_a_cluster_{variavel_cluster}_estatisticas.csv", index=False)


def main():
    df = carrega_dados()

    print("=" * 70)
    print("1) CORRELAÇÕES")
    print("=" * 70)
    analisa_correlacoes(df, VARS_DERIVADAS, "variaveis_derivadas")
    analisa_correlacoes(df, VARS_BRUTAS, "variaveis_brutas")

    print("\n" + "=" * 70)
    print("2) CORRELAÇÃO QUALITATIVA POR MECÂNICA")
    print("=" * 70)
    analisa_correlacao_mecanicas(df)

    print("\n" + "=" * 70)
    print("3) CLUSTERIZAÇÃO K-MEANS")
    print("=" * 70)
    clusteriza_multivariado(df)
    clusteriza_1d_com_descritivas(df, "vl_tempo_jogo")
    clusteriza_1d_com_descritivas(df, "idade_minima")
    clusteriza_1d_com_descritivas(df, "nota_media")
    clusteriza_1d_com_descritivas(df, "qt_avaliacoes")

    print("\nArquivos gravados em", OUT_DIR)


if __name__ == "__main__":
    main()
