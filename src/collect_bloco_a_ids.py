"""
Bloco A - etapa 1: enumera todos os IDs de jogos de tabuleiro (tp_jogo=b)
cadastrados na Ludopedia, com o ano de publicação já retornado na listagem.

Saída: data/raw/ludopedia_ids.csv (id_jogo, ano_publicacao, link)

Uso:
    python3 src/collect_bloco_a_ids.py
"""
import csv
import pathlib

from tqdm import tqdm

from ludopedia_client import LudopediaClient, PAGE_SIZE

OUT_PATH = pathlib.Path(__file__).resolve().parent.parent / "data" / "raw" / "ludopedia_ids.csv"


def main():
    client = LudopediaClient()
    first = client.list_jogos_page(1)
    total = first["total"]
    n_pages = -(-total // PAGE_SIZE)
    print(f"Total de jogos (tp_jogo=b): {total} em {n_pages} páginas")

    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    seen = set()
    with open(OUT_PATH, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["id_jogo", "ano_publicacao", "link"])

        for jogo in first["jogos"]:
            id_jogo = jogo["id_jogo"]
            if id_jogo not in seen:
                seen.add(id_jogo)
                writer.writerow([id_jogo, jogo.get("ano_publicacao"), jogo.get("link")])

        for page in tqdm(range(2, n_pages + 1), desc="Paginando catálogo"):
            data = client.list_jogos_page(page)
            for jogo in data["jogos"]:
                id_jogo = jogo["id_jogo"]
                if id_jogo not in seen:
                    seen.add(id_jogo)
                    writer.writerow([id_jogo, jogo.get("ano_publicacao"), jogo.get("link")])

    print(f"OK: {len(seen)} ids únicos salvos em {OUT_PATH}")


if __name__ == "__main__":
    main()
