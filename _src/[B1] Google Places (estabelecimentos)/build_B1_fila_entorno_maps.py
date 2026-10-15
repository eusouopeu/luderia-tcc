"""
Bloco B1 - fila do entorno no Google Maps: uma linha por luderia aprovada,
com a coordenada que o coletor (_src/Web scripts/maps_entorno.user.js) usa
para buscar estações e shoppings em volta.

Lista: as luderias aprovadas do B1 (metrópoles, mais de 100 avaliações),
lidas do B1_luderias_aprovadas_metropoles_mais_100_avaliacoes.xlsx; se a
planilha não estiver na máquina (fica fora do repositório), do
B2_cobertura_coleta.csv, que tem uma linha por luderia aprovada.

Coordenada, na ordem: B1_localizacoes.jsonl (Place Details, bruto, fora do
repositório) e, na falta dele, B1_entorno.csv (mesma origem). Luderia sem
coordenada entra na fila com lat e lng em branco e situacao_coordenada
"sem coordenada": o coletor pula a linha. Para preenchê-la, rodar
collect_B1_localizacoes.py e depois este script.

Colunas (";" e UTF-8 com BOM, como o coletor lê e exporta):
  place_id; nome; cidade; lat; lng; endereco; link_google_maps;
  situacao_coordenada; fonte_coordenada

Saída: _data/processed/[B1] Estabelecimentos e cardapios/entorno_maps/B1_fila_entorno_maps.csv

Uso:
    python3 "_src/[B1] Google Places (estabelecimentos)/build_B1_fila_entorno_maps.py"
"""
import json
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parents[2]
RAW = ROOT / "_data" / "raw" / "[B1] Estabelecimentos e cardapios"
PROCESSED = ROOT / "_data" / "processed" / "[B1] Estabelecimentos e cardapios"
APROVADAS = PROCESSED / "B1_luderias_aprovadas_metropoles_mais_100_avaliacoes.xlsx"
COBERTURA_B2 = ROOT / "_data" / "processed" / "[B2] Avaliacoes recentes" / "B2_cobertura_coleta.csv"
CURADORIA = PROCESSED / "B1_planilha_curadoria_metropoles_filtrada_mais_100_avaliacoes.csv"
LOCALIZACOES = RAW / "B1_localizacoes.jsonl"
ENTORNO_OSM = PROCESSED / "B1_entorno.csv"
SAIDA = PROCESSED / "entorno_maps" / "B1_fila_entorno_maps.csv"

COLUNAS = ["place_id", "nome", "cidade", "lat", "lng", "endereco", "link_google_maps",
           "situacao_coordenada", "fonte_coordenada"]


def ler_aprovadas():
    if APROVADAS.exists():
        b1 = pd.read_excel(APROVADAS, dtype=str).fillna("")
        origem = APROVADAS.name
    else:
        b1 = pd.read_csv(COBERTURA_B2, sep=";", dtype=str, encoding="utf-8-sig", keep_default_na=False)
        b1 = b1.rename(columns={"capital": "capital_endereco"})
        origem = f"{COBERTURA_B2.name} ({APROVADAS.name} ausente)"
    b1 = b1[["place_id", "nome", "capital_endereco"]].drop_duplicates("place_id")
    # Endereço e link vêm da curadoria, que tem todas as aprovadas.
    cur = pd.read_csv(CURADORIA, dtype=str, keep_default_na=False)[["place_id", "endereco", "link_google_maps"]]
    return b1.merge(cur, on="place_id", how="left").fillna(""), origem


def ler_coordenadas():
    coords = {}
    if ENTORNO_OSM.exists():
        osm = pd.read_csv(ENTORNO_OSM, dtype=str, keep_default_na=False)
        for r in osm.itertuples():
            if r.lat and r.lng:
                coords[r.place_id] = (r.lat, r.lng, ENTORNO_OSM.name)
    # O bruto, quando existe, prevalece.
    if LOCALIZACOES.exists():
        with open(LOCALIZACOES, encoding="utf-8") as f:
            for linha in f:
                if not linha.strip():
                    continue
                d = json.loads(linha)
                loc = d.get("location")
                if loc:
                    coords[d["id"]] = (str(loc["latitude"]), str(loc["longitude"]), LOCALIZACOES.name)
    return coords


def main():
    b1, origem = ler_aprovadas()
    coords = ler_coordenadas()

    linhas = []
    for r in b1.itertuples():
        lat, lng, fonte = coords.get(r.place_id, ("", "", ""))
        linhas.append({
            "place_id": r.place_id, "nome": r.nome, "cidade": r.capital_endereco,
            "lat": lat, "lng": lng, "endereco": r.endereco, "link_google_maps": r.link_google_maps,
            "situacao_coordenada": "ok" if lat else "sem coordenada", "fonte_coordenada": fonte,
        })
    fila = pd.DataFrame(linhas, columns=COLUNAS).sort_values(["cidade", "nome"])

    SAIDA.parent.mkdir(parents=True, exist_ok=True)
    fila.to_csv(SAIDA, sep=";", index=False, encoding="utf-8-sig")

    # Conferência: cada luderia em um único grupo de situação; a soma fecha com o total.
    por_situacao = fila["situacao_coordenada"].value_counts()
    assert por_situacao.sum() == len(fila) == b1["place_id"].nunique()
    print(f"Lista: {origem}")
    print(f"OK: {len(fila)} luderias em {SAIDA.relative_to(ROOT)}")
    for situacao, n in por_situacao.items():
        print(f"  {situacao}: {n}")
    sem = fila[fila["situacao_coordenada"] != "ok"]
    if len(sem):
        print("Sem coordenada (o coletor pula; rodar collect_B1_localizacoes.py e depois este script):")
        for r in sem.itertuples():
            print(f"  - {r.nome} ({r.cidade})")


if __name__ == "__main__":
    main()
