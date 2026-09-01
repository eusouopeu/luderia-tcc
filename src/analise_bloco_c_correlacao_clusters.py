"""
Bloco C - análises exploratórias de correlação e clusterização por k-means
sobre quatro variáveis, no nível da avaliação individual:

    avaliacao_media_estabelecimento  (Bloco B)
    nota_avaliacao                   (Bloco C, nota individual)
    volume_avaliacoes_estabelecimento (Bloco B, número de avaliações)
    num_caracteres_texto             (Bloco C, tamanho do comentário)

Correlação: matriz de Spearman (mais adequada que Pearson dada a natureza
ordinal/discreta das notas) com p-valor pareado, e matriz de Pearson para
referência.

Clusterização: k-means sobre as 4 variáveis padronizadas (z-score). O k é
escolhido pelo maior coeficiente de silhueta entre k=2 e k=6; os clusters
resultantes são descritos pela média de cada variável em unidade original,
para interpretação.

Lê data/processed/bloco_c_avaliacoes_texto_filtrado.csv (saída de
build_bloco_c_texto_filtrado.py, que é quem calcula num_caracteres_texto).

Saídas:
    data/processed/bloco_c_correlacao_spearman.csv
    data/processed/bloco_c_correlacao_spearman_pvalor.csv
    data/processed/bloco_c_correlacao_pearson.csv
    data/processed/bloco_c_clusters.csv (dados originais + rótulo de cluster)
    data/processed/bloco_c_clusters_perfil.csv (média das 4 variáveis por cluster)

Uso:
    python3 src/analise_bloco_c_correlacao_clusters.py
"""
import pathlib

import numpy as np
import pandas as pd
from scipy.stats import pearsonr, spearmanr
from sklearn.cluster import KMeans
from sklearn.metrics import silhouette_score
from sklearn.preprocessing import StandardScaler

ROOT = pathlib.Path(__file__).resolve().parent.parent
IN_PATH = ROOT / "data" / "processed" / "bloco_c_avaliacoes_texto_filtrado.csv"
OUT_DIR = ROOT / "data" / "processed"

VARIAVEIS = [
    "avaliacao_media_estabelecimento",
    "nota_avaliacao",
    "volume_avaliacoes_estabelecimento",
    "num_caracteres_texto",
]


def matriz_correlacao(df, metodo):
    func = spearmanr if metodo == "spearman" else pearsonr
    cols = VARIAVEIS
    corr = pd.DataFrame(index=cols, columns=cols, dtype=float)
    pval = pd.DataFrame(index=cols, columns=cols, dtype=float)
    for a in cols:
        for b in cols:
            r, p = func(df[a], df[b])
            corr.loc[a, b] = r
            pval.loc[a, b] = p
    return corr, pval


def escolhe_k(X, k_min=2, k_max=6):
    melhor_k, melhor_score = k_min, -1
    scores = {}
    for k in range(k_min, k_max + 1):
        labels = KMeans(n_clusters=k, n_init=10, random_state=0).fit_predict(X)
        score = silhouette_score(X, labels)
        scores[k] = score
        if score > melhor_score:
            melhor_k, melhor_score = k, score
    return melhor_k, scores


def main():
    df = pd.read_csv(IN_PATH)
    df = df.dropna(subset=VARIAVEIS).copy()
    print(f"{len(df)} avaliações com as 4 variáveis completas")

    corr_sp, pval_sp = matriz_correlacao(df, "spearman")
    corr_pe, _ = matriz_correlacao(df, "pearson")

    corr_sp.to_csv(OUT_DIR / "bloco_c_correlacao_spearman.csv")
    pval_sp.to_csv(OUT_DIR / "bloco_c_correlacao_spearman_pvalor.csv")
    corr_pe.to_csv(OUT_DIR / "bloco_c_correlacao_pearson.csv")

    print("\nCorrelação de Spearman:")
    print(corr_sp.round(2))
    print("\np-valor (Spearman):")
    print(pval_sp.round(3))

    X = StandardScaler().fit_transform(df[VARIAVEIS])
    k, scores = escolhe_k(X)
    print(f"\nSilhueta por k: { {kk: round(vv, 3) for kk, vv in scores.items()} }")
    print(f"k escolhido: {k}")

    km = KMeans(n_clusters=k, n_init=10, random_state=0).fit(X)
    df["cluster"] = km.labels_

    cols_id = [c for c in ["place_id", "nome_estabelecimento", "review_index"] if c in df.columns]
    df[cols_id + VARIAVEIS + ["cluster"]].to_csv(OUT_DIR / "bloco_c_clusters.csv", index=False)

    perfil = df.groupby("cluster")[VARIAVEIS].mean().round(2)
    perfil["n"] = df.groupby("cluster").size()
    perfil.to_csv(OUT_DIR / "bloco_c_clusters_perfil.csv")

    print("\nPerfil dos clusters (médias em unidade original):")
    print(perfil)


if __name__ == "__main__":
    main()
