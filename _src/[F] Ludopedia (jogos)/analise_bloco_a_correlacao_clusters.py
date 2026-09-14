"""
Bloco A - análises exploratórias de correlação e clusterização por k-means
sobre a tabela final de jogos (_data/processed/bloco_a_jogos_completo.csv).

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

3. Sumarização geral: estatísticas descritivas (count/mean/std/min/quartis/
   max) de todas as variáveis numéricas originais, sobre a base inteira,
   sem nenhuma clusterização (bloco_a_sumarizacao_geral.csv).

4. Clusterização k-means:
   a) sobre todas as variáveis brutas padronizadas (multivariada). Além do
      perfil médio por cluster, gera também as mesmas estatísticas
      descritivas completas do item 3, mas quebradas por cluster
      (bloco_a_clusters_variaveis_brutas_estatisticas.csv);
   b) quatro clusterizações 1D independentes (duração, idade mínima,
      nota média, nº de avaliações), k=4 cada, com o grupo de menor
      contagem tipicamente correspondendo aos outliers. Para essas quatro,
      o rótulo de cluster é aplicado de volta à tabela inteira e são
      calculadas as estatísticas descritivas (count/mean/std/min/quartis/
      max) de TODAS as variáveis numéricas originais, por grupo.

5. Remoção de outliers (regra de Tukey/IQR, fator 1.5) sobre as variáveis
   de VARS_BRUTAS: uma linha é removida se estiver fora de
   [Q1 - 1.5*IQR, Q3 + 1.5*IQR] em QUALQUER uma dessas variáveis. Gera
   bloco_a_jogos_sem_outliers.csv com a tabela completa filtrada.

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

ROOT = pathlib.Path(__file__).resolve().parents[2]
IN_PATH = ROOT / "_data" / "processed" / "[F] Jogos (ludopedia)" / "bloco_a_jogos_completo.csv"
OUT_DIR = ROOT / "_data" / "processed" / "[F] Jogos (ludopedia)"

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


def descritivas_por_grupo(df, cols_stats, coluna_grupo=None):
    """Describe (count/mean/std/min/quartis/max) de cols_stats, em formato
    longo (uma linha por variável), opcionalmente agrupado por coluna_grupo.
    Sem coluna_grupo, descreve o df inteiro (sumarização geral)."""
    linhas = []
    if coluna_grupo is None:
        desc = df[cols_stats].describe().T
        desc.insert(0, "variavel", desc.index)
        linhas.append(desc.reset_index(drop=True))
    else:
        for grupo_id, grupo in df.groupby(coluna_grupo):
            desc = grupo[cols_stats].describe().T
            desc.insert(0, coluna_grupo, grupo_id)
            desc.insert(1, "variavel", desc.index)
            linhas.append(desc.reset_index(drop=True))
    saida = pd.concat(linhas, ignore_index=True)
    saida = saida.rename(columns={"50%": "mediana", "25%": "p25", "75%": "p75"})
    return saida


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


def sumarizacao_geral(df):
    """Descritivas (count/mean/std/min/quartis/max) de todas as variáveis
    numéricas originais, sobre a base inteira (sem clusterizar)."""
    cols_stats = variaveis_numericas_originais(df)
    saida = descritivas_por_grupo(df, cols_stats)
    saida.to_csv(OUT_DIR / "bloco_a_sumarizacao_geral.csv", index=False)


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

    # descritivas completas por cluster, sobre TODAS as variáveis numéricas
    # originais (mesmo formato longo dos clusters 1D), não só VARS_BRUTAS.
    cols_stats = variaveis_numericas_originais(df)
    completo_com_cluster = df.loc[sub.index, cols_stats].copy()
    completo_com_cluster["cluster"] = sub["cluster"]
    estat = descritivas_por_grupo(completo_com_cluster, cols_stats, "cluster")
    estat.to_csv(OUT_DIR / "bloco_a_clusters_variaveis_brutas_estatisticas.csv", index=False)


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

    saida = descritivas_por_grupo(sub, cols_stats, "cluster")
    saida.to_csv(OUT_DIR / f"bloco_a_cluster_{variavel_cluster}_estatisticas.csv", index=False)


def remove_outliers_iqr(df, cols, fator=1.5):
    """Remove linhas com outlier (regra de Tukey) em qualquer uma das cols.
    Limite = [Q1 - fator*IQR, Q3 + fator*IQR]; NaN não é tratado como
    outlier (linha só é removida se o valor existir e estiver fora do
    intervalo)."""
    mask_outlier = pd.Series(False, index=df.index)
    limites = {}
    for col in cols:
        q1, q3 = df[col].quantile(0.25), df[col].quantile(0.75)
        iqr = q3 - q1
        lim_inf, lim_sup = q1 - fator * iqr, q3 + fator * iqr
        limites[col] = (lim_inf, lim_sup)
        mask_outlier |= df[col].notna() & ((df[col] < lim_inf) | (df[col] > lim_sup))

    print(f"\n[outliers IQR, fator={fator}] limites por variável:")
    for col, (lim_inf, lim_sup) in limites.items():
        n_col_outlier = (df[col].notna() & ((df[col] < lim_inf) | (df[col] > lim_sup))).sum()
        print(f"  {col}: [{lim_inf:.2f}, {lim_sup:.2f}] -> {n_col_outlier} outliers")

    saida = df.loc[~mask_outlier].copy()
    print(f"  total: {mask_outlier.sum()} jogos removidos de {len(df)} "
          f"({saida.shape[0]} restantes)")
    return saida


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
    print("3) SUMARIZAÇÃO GERAL")
    print("=" * 70)
    sumarizacao_geral(df)

    print("\n" + "=" * 70)
    print("4) CLUSTERIZAÇÃO K-MEANS")
    print("=" * 70)
    clusteriza_multivariado(df)
    clusteriza_1d_com_descritivas(df, "vl_tempo_jogo")
    clusteriza_1d_com_descritivas(df, "idade_minima")
    clusteriza_1d_com_descritivas(df, "nota_media")
    clusteriza_1d_com_descritivas(df, "qt_avaliacoes")

    print("\n" + "=" * 70)
    print("5) REMOÇÃO DE OUTLIERS (IQR)")
    print("=" * 70)
    sem_outliers = remove_outliers_iqr(df, VARS_BRUTAS)
    sem_outliers.to_csv(OUT_DIR / "bloco_a_jogos_sem_outliers.csv", index=False)

    print("\nArquivos gravados em", OUT_DIR)


if __name__ == "__main__":
    main()
