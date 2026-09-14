"""
Bloco B - etapa 4a: para cada place_id da planilha de curadoria
(bloco_b_planilha_curadoria.csv), busca a coordenada (lat/lng) via Place
Details - pré-requisito para o cruzamento com o entorno (Nearby Search).

Resumível: place_ids já salvos em _data/raw/bloco_b_localizacoes.jsonl são
pulados.

Uso:
    python3 src/collect_bloco_b_localizacoes.py
"""
import json
import pathlib
from csv import DictReader

from tqdm import tqdm

from places_client import PlacesClient

ROOT = pathlib.Path(__file__).resolve().parents[2]
CURADORIA_PATH = ROOT / "_data" / "processed" / "[A] Estabelecimentos e cardapios" / "bloco_b_planilha_curadoria.csv"
OUT_PATH = ROOT / "_data" / "raw" / "[A] Estabelecimentos e cardapios" / "bloco_b_localizacoes.jsonl"


def load_place_ids():
    with open(CURADORIA_PATH, newline="", encoding="utf-8") as f:
        return [row["place_id"] for row in DictReader(f) if row["place_id"]]


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
    place_ids = load_place_ids()
    done = load_done_ids()
    pendentes = [p for p in place_ids if p not in done]
    print(f"{len(place_ids)} place_ids na curadoria, {len(done)} já coletados, {len(pendentes)} pendentes")

    with open(OUT_PATH, "a", encoding="utf-8") as f:
        for place_id in tqdm(pendentes, desc="Buscando localização"):
            try:
                detalhe = client.place_location(place_id)
            except RuntimeError as exc:
                print(f"Erro em {place_id}: {exc}")
                continue
            f.write(json.dumps(detalhe, ensure_ascii=False) + "\n")

    print(f"OK: localizações salvas em {OUT_PATH}")


if __name__ == "__main__":
    main()
