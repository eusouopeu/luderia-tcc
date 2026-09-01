"""
Bloco A - etapa 3: aplica os critérios de corte da amostra e calcula os
indicadores derivados que dependem só de dados da API (ver metodologia):

Critérios de corte:
  - edição nacional (ano_nacional != null)
  - qt_tem >= 100
  - ano_publicacao >= 2010
  - ao menos 1 mecânica registrada

Indicadores calculados aqui (fórmula explícita na metodologia):
  - tx_retencao        = qt_tem / (qt_tem + qt_teve)
  - idx_desejo          = qt_quer / qt_tem
  - tx_fidelizacao      = qt_favorito / qt_tem
  - diversidade_mecanica = nº de mecânicas distintas do jogo
  - amplitude_publico    = qt_jogadores_max - qt_jogadores_min

NÃO calculados aqui (fórmula não está definida na metodologia, ou dependem
de fonte ainda não integrada):
  - Índice de Engajamento (fórmula a definir)
  - Índice de Acessibilidade Family/Casual (precisa do weight do BGG)
  - qtd. de partidas registradas (só disponível via scraping das páginas
    individuais, que está bloqueado para coleta automatizada por IA no
    robots.txt da Ludopedia — ver scrape_bloco_a_nota.py)

Se data/raw/ludopedia_top_ids.csv existir (gerado por select_top_n.py a
partir do ranking raspado), as colunas nota_media, nota_rank e
qt_avaliacoes de lá são incorporadas aqui.

Uso:
    python3 src/build_bloco_a_dataset.py
"""
import json
import pathlib

import pandas as pd

ROOT = pathlib.Path(__file__).resolve().parent.parent
IN_PATH = ROOT / "data" / "raw" / "ludopedia_jogos.jsonl"
TOP_IDS_PATH = ROOT / "data" / "raw" / "ludopedia_top_ids.csv"
OUT_PATH = ROOT / "data" / "processed" / "bloco_a_jogos.csv"

MIN_QT_TEM = 100
MIN_ANO = 2010


def load_raw():
    rows = []
    with open(IN_PATH, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line:
                rows.append(json.loads(line))
    return rows


def flatten(jogo):
    return {
        "id_jogo": jogo["id_jogo"],
        "nm_jogo": jogo["nm_jogo"],
        "ano_publicacao": jogo.get("ano_publicacao"),
        "ano_nacional": jogo.get("ano_nacional"),
        "qt_jogadores_min": jogo.get("qt_jogadores_min"),
        "qt_jogadores_max": jogo.get("qt_jogadores_max"),
        "vl_tempo_jogo": jogo.get("vl_tempo_jogo"),
        "idade_minima": jogo.get("idade_minima"),
        "qt_tem": jogo.get("qt_tem") or 0,
        "qt_teve": jogo.get("qt_teve") or 0,
        "qt_favorito": jogo.get("qt_favorito") or 0,
        "qt_quer": jogo.get("qt_quer") or 0,
        "qt_jogou": jogo.get("qt_jogou") or 0,
        "n_mecanicas": len(jogo.get("mecanicas") or []),
        "mecanicas": ";".join(m["nm_mecanica"] for m in (jogo.get("mecanicas") or [])),
        "n_categorias": len(jogo.get("categorias") or []),
        "categorias": ";".join(c["nm_categoria"] for c in (jogo.get("categorias") or [])),
        "temas": ";".join(t["nm_tema"] for t in (jogo.get("temas") or [])),
        "link": jogo.get("link"),
    }


def main():
    raw = load_raw()
    df = pd.DataFrame(flatten(j) for j in raw)
    print(f"Bruto coletado: {len(df)} jogos")

    df = df[
        df["ano_nacional"].notna()
        & (df["qt_tem"] >= MIN_QT_TEM)
        & (df["ano_publicacao"] >= MIN_ANO)
        & (df["n_mecanicas"] > 0)
    ].copy()
    print(f"Após critérios de corte (edição nacional, qt_tem>={MIN_QT_TEM}, ano>={MIN_ANO}, com mecânica): {len(df)} jogos")

    df["tx_retencao"] = df["qt_tem"] / (df["qt_tem"] + df["qt_teve"]).replace(0, pd.NA)
    df["idx_desejo"] = df["qt_quer"] / df["qt_tem"].replace(0, pd.NA)
    df["tx_fidelizacao"] = df["qt_favorito"] / df["qt_tem"].replace(0, pd.NA)
    df["diversidade_mecanica"] = df["n_mecanicas"]
    df["amplitude_publico"] = df["qt_jogadores_max"] - df["qt_jogadores_min"]

    if TOP_IDS_PATH.exists():
        cols = [c for c in ("id_jogo", "nota_media", "nota_rank", "qt_avaliacoes") if c in pd.read_csv(TOP_IDS_PATH, nrows=0).columns]
        top_df = pd.read_csv(TOP_IDS_PATH)[cols]
        df = df.merge(top_df, on="id_jogo", how="left")
        print(f"Nota/ranking incorporados de {TOP_IDS_PATH} ({df['nota_media'].notna().sum()} jogos com nota)")

    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(OUT_PATH, index=False)
    print(f"OK: dataset processado salvo em {OUT_PATH}")


if __name__ == "__main__":
    main()
