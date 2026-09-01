"""
Bloco B - etapa 2: para cada place_id único listado por
collect_bloco_b_places.py, busca o detalhe (Place Details: avaliação média,
volume de avaliações, site/rede social declarado, telefone, link do Maps).

O campo websiteUri é o mais importante para a etapa manual seguinte: para a
maioria dos pequenos estabelecimentos, é o link do Instagram/Linktree
cadastrado no perfil do Google Maps, não necessariamente um site próprio.

Resumível: se interrompido, rode de novo - place_ids já salvos em
data/raw/bloco_b_detalhes.jsonl são pulados.

Uso:
    python3 src/collect_bloco_b_details.py
"""
import json
import pathlib
from csv import DictReader

from tqdm import tqdm

from places_client import PlacesClient

ROOT = pathlib.Path(__file__).resolve().parent.parent
CANDIDATOS_PATH = ROOT / "data" / "raw" / "bloco_b_candidatos.csv"
OUT_PATH = ROOT / "data" / "raw" / "bloco_b_detalhes.jsonl"


def load_unique_place_ids():
    with open(CANDIDATOS_PATH, newline="", encoding="utf-8") as f:
        ids = [row["place_id"] for row in DictReader(f) if row["place_id"]]
    return sorted(set(ids))


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
                done.add(json.loads(line)["id"])
            except (json.JSONDecodeError, KeyError):
                continue
    return done


def main():
    client = PlacesClient()
    place_ids = load_unique_place_ids()
    done = load_done_ids()
    pendentes = [p for p in place_ids if p not in done]
    print(f"{len(place_ids)} place_ids únicos, {len(done)} já coletados, {len(pendentes)} pendentes")

    with open(OUT_PATH, "a", encoding="utf-8") as f:
        for place_id in tqdm(pendentes, desc="Buscando detalhes"):
            try:
                detalhe = client.place_details(place_id)
            except RuntimeError as exc:
                print(f"Erro em {place_id}: {exc}")
                continue
            f.write(json.dumps(detalhe, ensure_ascii=False) + "\n")

    print(f"OK: detalhes salvos em {OUT_PATH}")


if __name__ == "__main__":
    main()
