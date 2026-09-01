"""
Bloco B - etapa 1: descoberta de estabelecimentos no formato
ludobar/luderia/quiz-bar nas 27 capitais brasileiras via Google Places API
(New) - textSearch, cruzando termos de busca com cada capital. A precisão
fica a cargo da etapa de filtro (build_bloco_b_planilha.py); aqui o
objetivo é maximizar recall.

Saída: data/raw/bloco_b_candidatos.csv (place_id, nome, endereco, capital,
termo_busca) - um place_id pode aparecer mais de uma vez se encontrado por
termos diferentes; o dedup por place_id é feito na etapa de detalhes.

Uso:
    python3 src/collect_bloco_b_places.py
"""
import csv
import pathlib

from tqdm import tqdm

from places_client import PlacesClient

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT_PATH = ROOT / "data" / "raw" / "bloco_b_candidatos.csv"

CAPITAIS = [
    "Rio Branco",
    "Maceió",
    "Macapá",
    "Manaus",
    "Salvador",
    "Fortaleza",
    "Brasília",
    "Vitória",
    "Goiânia",
    "São Luís",
    "Cuiabá",
    "Campo Grande",
    "Belo Horizonte",
    "Belém",
    "João Pessoa",
    "Curitiba",
    "Recife",
    "Teresina",
    "Rio de Janeiro",
    "Natal",
    "Porto Alegre",
    "Porto Velho",
    "Boa Vista",
    "Florianópolis",
    "São Paulo",
    "Aracaju",
    "Palmas",
]

TERMOS = [
    "ludobar",
    "luderia",
    "ludoteca",
    "quiz bar",
    "board game bar",
    "board game café",
    "café de jogos de tabuleiro",
    "bar de jogos de tabuleiro",
    "jogos de tabuleiro",
]


def main():
    client = PlacesClient()
    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)

    rows = []
    combos = [(capital, termo) for capital in CAPITAIS for termo in TERMOS]
    for capital, termo in tqdm(combos, desc="Buscando termo x capital"):
        query = f"{termo} em {capital}"
        places = client.text_search_all(query)
        for place in places:
            rows.append(
                {
                    "place_id": place.get("id"),
                    "nome": (place.get("displayName") or {}).get("text"),
                    "endereco": place.get("formattedAddress"),
                    "capital_busca": capital,
                    "termo_busca": termo,
                }
            )

    with open(OUT_PATH, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["place_id", "nome", "endereco", "capital_busca", "termo_busca"])
        writer.writeheader()
        writer.writerows(rows)

    n_unicos = len({r["place_id"] for r in rows})
    print(f"OK: {len(rows)} ocorrências ({n_unicos} place_id únicos) salvas em {OUT_PATH}")


if __name__ == "__main__":
    main()
