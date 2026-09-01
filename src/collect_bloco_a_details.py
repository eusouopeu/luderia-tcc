"""
Bloco A - etapa 2: para cada id_jogo listado por collect_bloco_a_ids.py,
busca o detalhe completo (/api/v1/jogos/{id}: jogadores, duração, idade
mínima, mecânicas, categorias, temas, ano nacional, contadores de usuário).

Resumível: se interrompido, rode de novo — ids já salvos em
data/raw/ludopedia_jogos.jsonl são pulados.

Por padrão lê data/raw/ludopedia_ids.csv (catálogo inteiro, ~41 mil jogos).
Para limitar aos N jogos de maior nota (fluxo: scrape_ranking.py ->
select_top_n.py), passe --ids-file data/raw/ludopedia_top_ids.csv.

Uso:
    python3 src/collect_bloco_a_details.py [--limit N] [--ids-file PATH]
"""
import argparse
import csv
import json
import pathlib

from tqdm import tqdm

from ludopedia_client import LudopediaClient

ROOT = pathlib.Path(__file__).resolve().parent.parent
IDS_PATH = ROOT / "data" / "raw" / "ludopedia_ids.csv"
OUT_PATH = ROOT / "data" / "raw" / "ludopedia_jogos.jsonl"


def load_ids(ids_path):
    with open(ids_path, newline="", encoding="utf-8") as f:
        return [int(row["id_jogo"]) for row in csv.DictReader(f)]


def load_done_ids():
    if not OUT_PATH.exists():
        return set()
    done = set()
    with open(OUT_PATH, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                done.add(json.loads(line)["id_jogo"])
            except (json.JSONDecodeError, KeyError):
                continue
    return done


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--limit", type=int, default=None, help="Limita a N jogos (teste)")
    parser.add_argument("--ids-file", type=pathlib.Path, default=IDS_PATH, help="CSV com coluna id_jogo (default: catálogo inteiro)")
    args = parser.parse_args()

    ids = load_ids(args.ids_file)
    if args.limit:
        ids = ids[: args.limit]

    done = load_done_ids()
    pending = [i for i in ids if i not in done]
    print(f"Total: {len(ids)} | já coletados: {len(done)} | pendentes: {len(pending)}")

    client = LudopediaClient()
    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    errors = []
    with open(OUT_PATH, "a", encoding="utf-8") as f:
        for id_jogo in tqdm(pending, desc="Coletando detalhes"):
            try:
                jogo = client.get_jogo(id_jogo)
            except Exception as exc:
                errors.append((id_jogo, str(exc)))
                continue
            f.write(json.dumps(jogo, ensure_ascii=False) + "\n")
            f.flush()

    print(f"OK: {len(pending) - len(errors)} novos jogos salvos em {OUT_PATH}")
    if errors:
        err_path = ROOT / "logs" / "collect_bloco_a_details_errors.log"
        with open(err_path, "w", encoding="utf-8") as f:
            for id_jogo, msg in errors:
                f.write(f"{id_jogo}\t{msg}\n")
        print(f"AVISO: {len(errors)} falhas registradas em {err_path}. Rode o script de novo para tentar de novo.")


if __name__ == "__main__":
    main()
