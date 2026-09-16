"""
Bloco A - etapa 4b: conta âncoras de fluxo no entorno de cada estabelecimento
da curadoria, em dois raios (500m e 1000m), via Overpass API (OpenStreetMap).

Só três categorias, todas de API gratuita. A versão anterior deste script
contava oito subcategorias comerciais; foram retiradas porque nenhuma delas
mudava decisão do plano. O que sobrou são âncoras de fluxo de público
casual, que é o que a decisão de localização precisa.

  praias_parques    -> natural=beach OU leisure=park
  shoppings_grandes -> shop=mall com área de polígono >= 5.000 m2
  estacoes_metro    -> station=subway

Três operacionalizações foram medidas antes de serem fixadas, porque a
contagem ingênua erra feio:

1. Metrô conta a ESTAÇÃO, não suas entradas. `railway=subway_entrance` devolve
   17 elementos num raio de 1km da Av. Paulista, que são as bocas de três
   estações. `railway=station` sem qualificação pegaria trem metropolitano
   (CPTM), que não foi pedido.

2. Shopping exige área. `shop=mall` sozinho devolve 18 elementos na Paulista,
   incluindo galeria de rua e ponto sem nome. Numa amostra de 17 shoppings
   reais do entorno dos estabelecimentos, a área do polígono separa os dois
   grupos: galerias ficam entre 262 e 1.617 m2 (Shopping Biz, Cartier Plaza,
   Galeria Moinhos de Vento) e shoppings de porte entre 9.398 e 99.779 m2
   (Moinhos, Macapá Shopping, Mueller, Praia da Costa, Shopping Total). O
   corte de 5.000 m2 cai no vale entre eles.

3. Tudo é deduplicado. No OSM a mesma feição costuma existir como nó e como
   via ou relação: a Praia do Farol da Barra aparece 4 vezes, uma estação
   aparece como nó e como polígono da plataforma. Sem deduplicar, a contagem
   infla por qualidade de mapeamento, não por realidade do entorno.

A área vem da bounding box do polígono, que superestima footprint irregular.
É proxy de porte, não medida de ABL, e só é usada contra um corte grosso.

Saída: _data/raw/[A] Estabelecimentos e cardapios/bloco_b_entorno_osm_ancoras.jsonl
       uma linha por (place_id, raio).

Resumível: pares (place_id, raio) já salvos são pulados.

A Overpass é um bem público mantido por doação. O cliente mantém intervalo
entre requisições e o script faz uma consulta por par, não uma por categoria.

Uso:
    python3 "_src/[A] Google Places (estabelecimentos)/collect_bloco_b_entorno_osm.py"
"""
import json
import math
import pathlib
from csv import DictReader

from tqdm import tqdm

from osm_client import OverpassClient

ROOT = pathlib.Path(__file__).resolve().parents[2]
RAW = ROOT / "_data" / "raw" / "[A] Estabelecimentos e cardapios"
PROCESSED = ROOT / "_data" / "processed" / "[A] Estabelecimentos e cardapios"
CURADORIA_PATH = PROCESSED / "bloco_b_planilha_curadoria.csv"
LOCALIZACOES_PATH = RAW / "bloco_b_localizacoes.jsonl"
OUT_PATH = RAW / "bloco_b_entorno_osm_ancoras.jsonl"

RAIOS_M = [500, 1000]

CATEGORIAS = ["praias_parques", "shoppings_grandes", "estacoes_metro"]

# Ver item 2 do docstring: corte medido, não arbitrado.
AREA_MINIMA_SHOPPING_M2 = 5000

QL = """[out:json][timeout:120];
(
  nwr(around:{raio},{lat},{lng})[leisure=park];
  nwr(around:{raio},{lat},{lng})[natural=beach];
  nwr(around:{raio},{lat},{lng})[shop=mall];
  nwr(around:{raio},{lat},{lng})[station=subway];
);
out tags center bb;"""


def categoria_de(tags):
    if tags.get("natural") == "beach" or tags.get("leisure") == "park":
        return "praias_parques"
    if tags.get("shop") == "mall":
        return "shoppings_grandes"
    if tags.get("station") == "subway":
        return "estacoes_metro"
    return None


def centro(el):
    """Nó traz lat/lon direto; via e relação trazem `center`."""
    if "center" in el:
        return el["center"].get("lat"), el["center"].get("lon")
    return el.get("lat"), el.get("lon")


def area_bbox_m2(el):
    """Área da bounding box do polígono, em m2. Nó não tem bounds e devolve
    None: sem footprint mapeado não dá para afirmar porte."""
    b = el.get("bounds")
    if not b:
        return None
    lat_ref = (b["maxlat"] + b["minlat"]) / 2
    dlat = (b["maxlat"] - b["minlat"]) * 111320
    dlon = (b["maxlon"] - b["minlon"]) * 111320 * math.cos(math.radians(lat_ref))
    return dlat * dlon


def chave_dedup(el, categoria):
    """Mesma feição mapeada como nó e como polígono é uma coisa só. Com nome,
    o nome identifica; sem nome, a coordenada arredondada a ~11m identifica."""
    nome = (el.get("tags", {}).get("name") or "").strip().lower()
    if nome:
        return (categoria, nome)
    lat, lon = centro(el)
    return (categoria, round(lat or 0, 4), round(lon or 0, 4))


def conta(elementos):
    """Deduplica, aplica o corte de área dos shoppings e conta por categoria."""
    grupos = {}
    for el in elementos:
        cat = categoria_de(el.get("tags", {}))
        if not cat:
            continue
        k = chave_dedup(el, cat)
        area = area_bbox_m2(el)
        anterior = grupos.get(k)
        # Entre duplicatas da mesma feição, fica a que tem footprint mapeado.
        if anterior is None or (area or 0) > (anterior[1] or 0):
            grupos[k] = (cat, area)

    contagens = {c: 0 for c in CATEGORIAS}
    sem_area = 0
    for cat, area in grupos.values():
        if cat == "shoppings_grandes":
            if area is None:
                sem_area += 1
                continue
            if area < AREA_MINIMA_SHOPPING_M2:
                continue
        contagens[cat] += 1
    return contagens, sem_area


def load_place_ids():
    with open(CURADORIA_PATH, newline="", encoding="utf-8") as f:
        return {row["place_id"] for row in DictReader(f) if row["place_id"]}


def load_localizacoes():
    locs = {}
    with open(LOCALIZACOES_PATH, encoding="utf-8") as f:
        for line in f:
            if not line.strip():
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
            if not line.strip():
                continue
            try:
                d = json.loads(line)
                done.add((d["place_id"], d["raio_m"]))
            except (json.JSONDecodeError, KeyError):
                continue
    return done


def main():
    client = OverpassClient()
    place_ids = load_place_ids()
    localizacoes = {k: v for k, v in load_localizacoes().items() if k in place_ids}
    done = load_done_keys()

    tarefas = [
        (pid, raio)
        for pid in sorted(localizacoes)
        for raio in RAIOS_M
        if (pid, raio) not in done
    ]
    print(f"{len(localizacoes)} estabelecimentos com coordenada, {len(tarefas)} consultas pendentes")

    with open(OUT_PATH, "a", encoding="utf-8") as f:
        for place_id, raio in tqdm(tarefas, desc="Consultando OSM"):
            lat, lng = localizacoes[place_id]
            try:
                elementos = client.query(QL.format(raio=raio, lat=lat, lng=lng)).get("elements", [])
            except RuntimeError as exc:
                print(f"Erro em {place_id}/{raio}m: {exc}")
                continue

            contagens, sem_area = conta(elementos)
            f.write(
                json.dumps(
                    {
                        "place_id": place_id,
                        "raio_m": raio,
                        "qt_elementos_brutos": len(elementos),
                        "contagens": contagens,
                        "shoppings_sem_area_mapeada": sem_area,
                    },
                    ensure_ascii=False,
                )
                + "\n"
            )
            f.flush()

    print(f"OK: entorno salvo em {OUT_PATH.name}")


if __name__ == "__main__":
    main()
