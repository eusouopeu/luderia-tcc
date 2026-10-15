"""
Bloco B1 - etapa 4c: monta a tabela de entorno, uma linha por estabelecimento
da curadoria que tenha coordenada e contagem coletada.

Seis colunas de contagem, três categorias em dois raios, todas vindas da
Overpass API (OpenStreetMap), que é gratuita. Ver
B1-c_entorno_osm.py para como cada categoria é operacionalizada e
por que a contagem é deduplicada.

  qt_praias_parques_500m      qt_praias_parques_1000m
  qt_shoppings_grandes_500m   qt_shoppings_grandes_1000m
  qt_estacoes_metro_500m      qt_estacoes_metro_1000m

A versão anterior tinha 66 colunas: oito subcategorias comerciais vindas do
OSM, três categorias vindas do Google e, para cada combinação, duas
categóricas derivadas (presente e densidade por tercil). Saíram todas. As
comerciais não mudavam decisão do plano; as derivadas podem ser recalculadas
a partir da contagem a qualquer momento, e fixá-las no arquivo congelava
tercis de uma amostra que ainda cresce.

Saída: dados/[B1] Estabelecimentos e cardapios/entorno/B1_entorno.csv

Uso:
    python3 "_src/[B1] Estabelecimentos e cardapios/Google Places (Negócios)/build/B1-b_entorno.py"
"""
# Caminhos: _src/extras/ (log comum) e outros/ do objeto (auxiliares); log em ../logs/
import sys
from pathlib import Path
_AQUI = Path(__file__).resolve()
sys.path[:0] = [str(_AQUI.parents[3] / "extras"), str(_AQUI.parents[1] / "outros")]
from log_execucao import registrar_execucao  # noqa: E402
if __name__ == "__main__":
    registrar_execucao(__file__)

import csv
import json
import pathlib

ROOT = pathlib.Path(__file__).resolve().parents[4]
RAW = ROOT / "dados" / "[B1] Estabelecimentos e cardapios" / "_dados-brutos"
PROCESSED = ROOT / "dados" / "[B1] Estabelecimentos e cardapios"
CURADORIA_PATH = PROCESSED / "estabelecimentos/2_recorte/B1_curadoria.csv"
LOCALIZACOES_PATH = RAW / "estabelecimentos/B1_localizacoes.jsonl"
ENTORNO_PATH = RAW / "entornos/B1_entorno_osm_ancoras.jsonl"
OUT_PATH = PROCESSED / "entorno/B1_entorno.csv"

RAIOS_M = [500, 1000]
CATEGORIAS = ["praias_parques", "shoppings_grandes", "estacoes_metro"]


def load_curadoria():
    with open(CURADORIA_PATH, newline="", encoding="utf-8") as f:
        return {row["place_id"]: row for row in csv.DictReader(f)}


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


def load_entorno():
    """{(place_id, categoria, raio): qt}"""
    entorno = {}
    with open(ENTORNO_PATH, encoding="utf-8") as f:
        for line in f:
            if not line.strip():
                continue
            d = json.loads(line)
            for cat, qt in d["contagens"].items():
                entorno[(d["place_id"], cat, d["raio_m"])] = qt
    return entorno


def main():
    curadoria = load_curadoria()
    localizacoes = load_localizacoes()
    entorno = load_entorno()

    place_ids = sorted(
        pid
        for pid in curadoria
        if pid in localizacoes and (pid, CATEGORIAS[0], RAIOS_M[0]) in entorno
    )
    sem_coordenada = [pid for pid in curadoria if pid not in localizacoes]
    if sem_coordenada:
        print(
            f"Aviso: {len(sem_coordenada)} dos {len(curadoria)} estabelecimentos da "
            "curadoria não têm coordenada e ficam fora da tabela "
            "(rode B1-c_localizacoes.py para incluí-los)"
        )

    fieldnames = ["place_id", "nome", "endereco", "capital_busca", "lat", "lng"]
    for cat in CATEGORIAS:
        for raio in RAIOS_M:
            fieldnames.append(f"qt_{cat}_{raio}m")

    linhas = []
    for pid in place_ids:
        row = curadoria[pid]
        lat, lng = localizacoes[pid]
        linha = {
            "place_id": pid,
            "nome": row["nome"],
            "endereco": row["endereco"],
            "capital_busca": row["capital_busca"],
            "lat": lat,
            "lng": lng,
        }
        for cat in CATEGORIAS:
            for raio in RAIOS_M:
                qt = entorno.get((pid, cat, raio))
                linha[f"qt_{cat}_{raio}m"] = qt if qt is not None else ""
        linhas.append(linha)

    linhas.sort(key=lambda r: (r["capital_busca"], r["nome"] or ""))

    PROCESSED.mkdir(parents=True, exist_ok=True)
    with open(OUT_PATH, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(linhas)

    print(f"OK: {len(linhas)} estabelecimentos salvos em {OUT_PATH.name}")
    print()
    print(f"{'categoria':<20}{'raio':>6}  {'min':>4}  {'max':>4}  {'media':>7}  {'zeros':>8}")
    for cat in CATEGORIAS:
        for raio in RAIOS_M:
            valores = [
                entorno[(pid, cat, raio)] for pid in place_ids if (pid, cat, raio) in entorno
            ]
            if not valores:
                continue
            zeros = sum(1 for v in valores if v == 0)
            print(
                f"{cat:<20}{raio:>5}m  {min(valores):>4}  {max(valores):>4}  "
                f"{sum(valores) / len(valores):>7.1f}  {zeros:>4}/{len(valores)}"
            )


if __name__ == "__main__":
    main()
