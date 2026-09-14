"""
Bloco B - etapa 4b (OSM): conta estabelecimentos COMERCIAIS no entorno de
cada estabelecimento do Bloco B via Overpass API (OpenStreetMap), em dois
raios (500m e 1000m).

Substitui a coleta comercial via Google Places, inviabilizada pela herança
de tipo por inquilino (ver docstring de collect_bloco_b_entorno.py). No OSM
um shopping é um objeto `shop=mall` e as lojas dentro dele são objetos
próprios com tags próprias, então a contagem por categoria é real - e a
Overpass não trunca resultado.

Uma consulta por (estabelecimento, raio) traz todos os POIs de interesse de
uma vez; a classificação nas 8 subcategorias é feita localmente. Cada
elemento entra em exatamente uma subcategoria (primeira regra que casa),
para que "outras_lojas" não recontabilize o que já foi classificado.

Saída: _data/raw/bloco_b_entorno_osm.jsonl, uma linha por (place_id, raio).

Resumível: pares (place_id, raio) já salvos são pulados.

Uso:
    python3 src/collect_bloco_b_entorno_osm.py
"""
import json
import pathlib
from csv import DictReader

from tqdm import tqdm

from osm_client import OverpassClient

ROOT = pathlib.Path(__file__).resolve().parents[2]
CURADORIA_PATH = ROOT / "_data" / "processed" / "[A] Estabelecimentos e cardapios" / "bloco_b_planilha_curadoria.csv"
LOCALIZACOES_PATH = ROOT / "_data" / "raw" / "[A] Estabelecimentos e cardapios" / "bloco_b_localizacoes.jsonl"
OUT_PATH = ROOT / "_data" / "raw" / "[A] Estabelecimentos e cardapios" / "bloco_b_entorno_osm.jsonl"

RAIOS_M = [500, 1000]

# amenity=* de interesse (shop=* é pego por completo e filtrado localmente).
AMENITIES = ["restaurant", "fast_food", "cafe", "bar", "pub", "nightclub", "cinema"]

# Subcategorias comerciais, na ordem de avaliação. "outras_lojas" é o
# resíduo: qualquer shop=* que não caiu nas anteriores.
SUBCATEGORIAS = [
    "shoppings",
    "restaurantes",
    "padarias_lanchonetes",
    "boates_cinemas",
    "bares_pubs_cafes",
    "supermercados",
    "lojas_roupa",
    "outras_lojas",
]


def classifica(tags):
    shop = tags.get("shop")
    amenity = tags.get("amenity")

    if shop == "mall":
        return "shoppings"
    if amenity == "restaurant":
        return "restaurantes"
    if shop == "bakery" or amenity == "fast_food":
        return "padarias_lanchonetes"
    if amenity in ("nightclub", "cinema"):
        return "boates_cinemas"
    if amenity in ("bar", "pub", "cafe"):
        return "bares_pubs_cafes"
    if shop == "supermarket":
        return "supermercados"
    if shop == "clothes":
        return "lojas_roupa"
    if shop:
        return "outras_lojas"
    return None


def load_place_ids():
    with open(CURADORIA_PATH, newline="", encoding="utf-8") as f:
        return [row["place_id"] for row in DictReader(f) if row["place_id"]]


def load_localizacoes():
    locs = {}
    with open(LOCALIZACOES_PATH, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            d = json.loads(line)
            loc = d.get("location")
            if loc:
                locs[d["id"]] = (loc["latitude"], loc["longitude"])
    return locs


def load_done_keys():
    if not OUT_PATH.exists():
        return set()
    done = set()
    with open(OUT_PATH, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                d = json.loads(line)
                done.add((d["place_id"], d["raio_m"]))
            except (json.JSONDecodeError, KeyError):
                continue
    return done


def main():
    client = OverpassClient()
    place_ids = set(load_place_ids())
    localizacoes = {k: v for k, v in load_localizacoes().items() if k in place_ids}
    done = load_done_keys()

    tarefas = [
        (place_id, raio)
        for place_id in localizacoes
        for raio in RAIOS_M
        if (place_id, raio) not in done
    ]
    print(f"{len(localizacoes)} estabelecimentos, {len(tarefas)} consultas Overpass pendentes")

    with open(OUT_PATH, "a", encoding="utf-8") as f:
        for place_id, raio in tqdm(tarefas, desc="Consultando OSM"):
            lat, lng = localizacoes[place_id]
            try:
                elementos = client.pois_no_raio(lat, lng, raio, AMENITIES)
            except RuntimeError as exc:
                print(f"Erro em {place_id}/{raio}m: {exc}")
                continue

            contagens = {sub: 0 for sub in SUBCATEGORIAS}
            for el in elementos:
                sub = classifica(el.get("tags", {}))
                if sub:
                    contagens[sub] += 1

            registro = {
                "place_id": place_id,
                "raio_m": raio,
                "qt_elementos_brutos": len(elementos),
                "contagens": contagens,
            }
            f.write(json.dumps(registro, ensure_ascii=False) + "\n")

    print(f"OK: entorno OSM salvo em {OUT_PATH}")


if __name__ == "__main__":
    main()
