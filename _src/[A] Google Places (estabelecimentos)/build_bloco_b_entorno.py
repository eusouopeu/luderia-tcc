"""
Bloco B - etapa 4c: junta localizações e contagens de entorno numa planilha
por estabelecimento, com variável contínua (contagem) e duas variáveis
categóricas derivadas para cada combinação subcategoria x raio.

Duas fontes, por razão metodológica (ver docstring de
collect_bloco_b_entorno.py):
  - Google Places: praias_parques, transporte_metro, transporte_onibus.
  - OpenStreetMap (Overpass): as oito subcategorias comerciais, onde o
    Google inflava a contagem por herança de tipo entre empreendimento e
    lojas inquilinas.

Categóricas derivadas, para cada subcategoria x raio:
  - presente (sim/nao) - útil nas subcategorias esparsas (ex.: shoppings,
    transporte_metro).
  - densidade (baixa/media/alta) por tercis da amostra, calculados
    separadamente por raio - útil nas subcategorias densas.

Saída: _data/processed/bloco_b_entorno.csv

Uso:
    python3 src/build_bloco_b_entorno.py
"""
import csv
import json
import pathlib

from collect_bloco_b_entorno import CATEGORIAS as CATEGORIAS_GOOGLE
from collect_bloco_b_entorno_osm import SUBCATEGORIAS as SUBCATEGORIAS_OSM

ROOT = pathlib.Path(__file__).resolve().parents[2]
CURADORIA_PATH = ROOT / "_data" / "processed" / "[A] Estabelecimentos e cardapios" / "bloco_b_planilha_curadoria.csv"
LOCALIZACOES_PATH = ROOT / "_data" / "raw" / "[A] Estabelecimentos e cardapios" / "bloco_b_localizacoes.jsonl"
ENTORNO_GOOGLE_PATH = ROOT / "_data" / "raw" / "[A] Estabelecimentos e cardapios" / "bloco_b_entorno.jsonl"
ENTORNO_OSM_PATH = ROOT / "_data" / "raw" / "[A] Estabelecimentos e cardapios" / "bloco_b_entorno_osm.jsonl"
OUT_PATH = ROOT / "_data" / "processed" / "[A] Estabelecimentos e cardapios" / "bloco_b_entorno.csv"

RAIOS_M = [500, 1000]
SUBCATEGORIAS_GOOGLE = list(CATEGORIAS_GOOGLE.keys())
# Comerciais (OSM) primeiro, depois transporte/parques (Google).
SUBCATEGORIAS = SUBCATEGORIAS_OSM + SUBCATEGORIAS_GOOGLE
FONTE = {**{s: "osm" for s in SUBCATEGORIAS_OSM}, **{s: "google" for s in SUBCATEGORIAS_GOOGLE}}


def load_curadoria():
    with open(CURADORIA_PATH, newline="", encoding="utf-8") as f:
        return {row["place_id"]: row for row in csv.DictReader(f)}


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


def load_entorno():
    """{(place_id, subcategoria, raio): qt} das duas fontes."""
    entorno = {}

    with open(ENTORNO_GOOGLE_PATH, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            d = json.loads(line)
            if d["categoria"] in SUBCATEGORIAS_GOOGLE:
                entorno[(d["place_id"], d["categoria"], d["raio_m"])] = d["qt_lugares"]

    with open(ENTORNO_OSM_PATH, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            d = json.loads(line)
            for sub, qt in d["contagens"].items():
                entorno[(d["place_id"], sub, d["raio_m"])] = qt

    return entorno


def tercis(valores):
    """Retorna os dois pontos de corte (33% e 67%) de uma lista de valores."""
    ordenados = sorted(valores)
    n = len(ordenados)
    if n < 3:
        return None, None
    return ordenados[n // 3], ordenados[(2 * n) // 3]


def classifica_tercil(valor, corte1, corte2):
    if corte1 is None:
        return ""
    if valor <= corte1:
        return "baixa"
    if valor <= corte2:
        return "media"
    return "alta"


def main():
    curadoria = load_curadoria()
    localizacoes = load_localizacoes()
    entorno = load_entorno()

    place_ids = [pid for pid in curadoria if pid in localizacoes]
    faltantes = [pid for pid in curadoria if pid not in localizacoes]
    if faltantes:
        print(f"Aviso: {len(faltantes)} place_ids sem localização (rode collect_bloco_b_localizacoes.py)")

    cortes = {}
    for subcat in SUBCATEGORIAS:
        for raio in RAIOS_M:
            valores = [
                entorno[(pid, subcat, raio)]
                for pid in place_ids
                if (pid, subcat, raio) in entorno
            ]
            cortes[(subcat, raio)] = tercis(valores)

    linhas = []
    for pid in place_ids:
        row = curadoria[pid]
        lat, lng = localizacoes[pid]
        linha = {
            "place_id": pid,
            "nome": row["nome"],
            "endereco": row["endereco"],
            "lat": lat,
            "lng": lng,
        }
        for subcat in SUBCATEGORIAS:
            for raio in RAIOS_M:
                qt = entorno.get((pid, subcat, raio))
                corte1, corte2 = cortes[(subcat, raio)]
                prefixo = f"{subcat}_{raio}m"

                linha[f"qt_{prefixo}"] = qt if qt is not None else ""
                linha[f"presente_{prefixo}"] = (
                    ("sim" if qt > 0 else "nao") if qt is not None else ""
                )
                linha[f"densidade_{prefixo}"] = (
                    classifica_tercil(qt, corte1, corte2) if qt is not None else ""
                )
        linhas.append(linha)

    fieldnames = ["place_id", "nome", "endereco", "lat", "lng"]
    for subcat in SUBCATEGORIAS:
        for raio in RAIOS_M:
            prefixo = f"{subcat}_{raio}m"
            fieldnames += [f"qt_{prefixo}", f"presente_{prefixo}", f"densidade_{prefixo}"]

    with open(OUT_PATH, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(linhas)

    print(f"OK: {len(linhas)} estabelecimentos salvos em {OUT_PATH}")
    print()
    print(f"{'subcategoria':<22}{'fonte':<8}{'raio':>6}  {'min':>4}  {'max':>4}  {'media':>7}  {'zeros':>6}")
    for subcat in SUBCATEGORIAS:
        for raio in RAIOS_M:
            valores = [
                entorno[(pid, subcat, raio)]
                for pid in place_ids
                if (pid, subcat, raio) in entorno
            ]
            if not valores:
                continue
            zeros = sum(1 for v in valores if v == 0)
            print(
                f"{subcat:<22}{FONTE[subcat]:<8}{raio:>5}m  {min(valores):>4}  {max(valores):>4}  "
                f"{sum(valores) / len(valores):>7.1f}  {zeros:>3}/{len(valores)}"
            )


if __name__ == "__main__":
    main()
