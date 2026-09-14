"""
Bloco B - etapa 4b: para cada estabelecimento localizado (lat/lng obtidos em
collect_bloco_b_localizacoes.py), conta pontos do entorno via Nearby Search
(Google Places API New) em três subcategorias e dois raios (500m e 1000m):
transporte_metro, transporte_onibus e praias_parques.

As subcategorias COMERCIAIS não são coletadas aqui - migraram para o OSM
(collect_bloco_b_entorno_osm.py). Motivo, apurado por diagnóstico contra
ground truth conhecido (São Jogue Paralela, Salvador): o Google atribui o
tipo do empreendimento às lojas inquilinas dentro dele. Uma consulta por
`shopping_mall` em 500m devolveu 20 resultados onde existe 1 shopping real
- os outros 19 eram lojas do próprio shopping tipadas `shopping_mall`, 13
delas compartilhando a coordenada do prédio. Deduplicar por coordenada
reduzia 20 para 8, ainda longe de 1. O mesmo mecanismo infla restaurantes,
lojas e bares, e o teto de 20 resultados por chamada (a Nearby Search não
pagina) impede até medir a magnitude do erro.

As três subcategorias mantidas aqui não sofrem desse mecanismo - estações e
parques não têm "inquilinos" tipados como estação ou parque - e validaram
contra a realidade (0% de censura; capitais sem metrô retornam 0; São Paulo
1-3 estações em 1000m; Salvador/Paralela 1, confirmado pelo autor).

Resumível: cada (place_id, categoria, raio) já salvo em
_data/raw/bloco_b_entorno.jsonl é pulado.

Uso:
    python3 src/collect_bloco_b_entorno.py
"""
import json
import pathlib

from tqdm import tqdm

from places_client import PlacesClient

ROOT = pathlib.Path(__file__).resolve().parents[2]
LOCALIZACOES_PATH = ROOT / "_data" / "raw" / "[A] Estabelecimentos e cardapios" / "bloco_b_localizacoes.jsonl"
OUT_PATH = ROOT / "_data" / "raw" / "[A] Estabelecimentos e cardapios" / "bloco_b_entorno.jsonl"

RAIOS_M = [500, 1000]

# Tipos do Google Places (New, Table A) por subcategoria. Só as categorias
# imunes à herança de tipo por inquilino (ver docstring).
CATEGORIAS = {
    "praias_parques": ["beach", "park"],
    "transporte_metro": ["subway_station", "train_station", "light_rail_station"],
    "transporte_onibus": ["bus_station"],
}


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
                done.add((d["place_id"], d["categoria"], d["raio_m"]))
            except (json.JSONDecodeError, KeyError):
                continue
    return done


def main():
    client = PlacesClient()
    localizacoes = load_localizacoes()
    done = load_done_keys()

    tarefas = [
        (place_id, categoria, raio)
        for place_id in localizacoes
        for categoria in CATEGORIAS
        for raio in RAIOS_M
        if (place_id, categoria, raio) not in done
    ]
    print(f"{len(localizacoes)} estabelecimentos localizados, {len(tarefas)} chamadas pendentes")

    with open(OUT_PATH, "a", encoding="utf-8") as f:
        for place_id, categoria, raio in tqdm(tarefas, desc="Buscando entorno"):
            lat, lng = localizacoes[place_id]
            try:
                resultado = client.nearby_search(lat, lng, raio, CATEGORIAS[categoria])
            except RuntimeError as exc:
                print(f"Erro em {place_id}/{categoria}/{raio}m: {exc}")
                continue
            lugares = resultado.get("places", [])
            registro = {
                "place_id": place_id,
                "categoria": categoria,
                "raio_m": raio,
                "qt_lugares": len(lugares),
                "censurado": len(lugares) >= 20,
            }
            f.write(json.dumps(registro, ensure_ascii=False) + "\n")

    print(f"OK: entorno salvo em {OUT_PATH}")


if __name__ == "__main__":
    main()
