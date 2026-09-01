"""
Bloco A - junta o ranking raspado (nota média, scrape_ranking.py) com o
catálogo de ids (API, collect_bloco_a_ids.py) pelo slug do link, e seleciona
os N jogos de maior nota média. A saída vira a entrada de
collect_bloco_a_details.py (--ids-file), limitando a etapa cara da API só a
esses N jogos.

Pré-requisitos:
    python3 src/collect_bloco_a_ids.py     # catálogo completo (id, ano, link)
    python3 src/scrape_ranking.py --limit 2500   # nota média dos melhores colocados

Saída: data/raw/ludopedia_top_ids.csv (id_jogo, ano_publicacao, nota_media, nota_rank, qt_avaliacoes)

Uso:
    python3 src/select_top_n.py --top 1000
"""
import argparse
import pathlib
import re

import pandas as pd

ROOT = pathlib.Path(__file__).resolve().parent.parent
IDS_PATH = ROOT / "data" / "raw" / "ludopedia_ids.csv"
RANKING_PATH = ROOT / "data" / "raw" / "ludopedia_ranking.csv"
OUT_PATH = ROOT / "data" / "raw" / "ludopedia_top_ids.csv"


def slug_from_link(link):
    if not isinstance(link, str):
        return None
    m = re.search(r"jogo/([\w-]+)", link)
    return m.group(1) if m else None


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--top", type=int, default=1000, help="Nº de jogos a manter (top por nota_media)")
    args = parser.parse_args()

    ids_df = pd.read_csv(IDS_PATH)
    ranking_df = pd.read_csv(RANKING_PATH)

    ids_df["slug"] = ids_df["link"].apply(slug_from_link)
    ranking_df["slug"] = ranking_df["slug"].fillna(ranking_df["link"].apply(slug_from_link))

    merged = ranking_df.merge(ids_df[["id_jogo", "ano_publicacao", "slug"]], on="slug", how="left")
    keep_cols = ["id_jogo", "ano_publicacao", "nota_media", "nota_rank", "qt_avaliacoes"]

    n_sem_match = merged["id_jogo"].isna().sum()
    if n_sem_match:
        print(f"AVISO: {n_sem_match} jogos do ranking não casaram com o catálogo de ids (slug divergente) — serão descartados.")
    merged = merged.dropna(subset=["id_jogo", "nota_media"])
    merged["id_jogo"] = merged["id_jogo"].astype(int)

    merged = merged.sort_values("nota_media", ascending=False).drop_duplicates("id_jogo")
    top = merged.head(args.top)

    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    top[keep_cols].to_csv(OUT_PATH, index=False)
    print(f"OK: top {len(top)} jogos por nota_media salvos em {OUT_PATH}")
    if len(top) < args.top:
        print(f"AVISO: pediu top {args.top} mas só {len(top)} casaram/tinham nota — rode scrape_ranking.py com --limit maior.")


if __name__ == "__main__":
    main()
