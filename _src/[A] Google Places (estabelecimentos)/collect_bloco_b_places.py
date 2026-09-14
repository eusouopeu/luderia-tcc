"""
Bloco B - etapa 1: descoberta de estabelecimentos no formato
ludobar/luderia/quiz-bar nas 27 capitais brasileiras via Google Places API
(New) - textSearch, cruzando termos de busca com cada capital. A precisão
fica a cargo da etapa de filtro (build_bloco_b_planilha.py); aqui o
objetivo é maximizar recall.

Saída: _data/raw/bloco_b_candidatos.csv (place_id, nome, endereco, capital,
termo_busca) - um place_id pode aparecer mais de uma vez se encontrado por
termos diferentes; o dedup por place_id é feito na etapa de detalhes.

Uso:
    python3 src/collect_bloco_b_places.py
"""
import csv
import pathlib

from tqdm import tqdm

from places_client import PlacesClient

ROOT = pathlib.Path(__file__).resolve().parents[2]
OUT_PATH = ROOT / "_data" / "raw" / "[A] Estabelecimentos e cardapios" / "bloco_b_candidatos.csv"

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
    # Lojas de jogos com mesas para partidas: no Google Maps muitas casas que
    # funcionam como espaço de jogo estão categorizadas como loja de jogos ou
    # de brinquedos, e não aparecem nos termos de bar/café acima.
    "loja de jogos de tabuleiro",
    "loja de board game",
    "loja de card game",
    "loja de RPG",
    "board game",
    "clube de jogos de tabuleiro",
]

COLUNAS = ["place_id", "nome", "endereco", "capital_busca", "termo_busca"]


def load_combos_feitos():
    """Combinações capital x termo já presentes no CSV. Permite acrescentar
    termos novos sem repetir (e pagar de novo) as buscas antigas."""
    if not OUT_PATH.exists():
        return set()
    with open(OUT_PATH, newline="", encoding="utf-8") as f:
        return {(r["capital_busca"], r["termo_busca"]) for r in csv.DictReader(f)}


def main():
    client = PlacesClient()
    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)

    feitos = load_combos_feitos()
    combos = [(c, t) for c in CAPITAIS for t in TERMOS if (c, t) not in feitos]
    print(f"{len(combos)} combinações capital x termo pendentes ({len(feitos)} já no CSV)")

    novo = not OUT_PATH.exists()
    n_linhas, ids = 0, set()
    # Grava a cada combinação: uma queda de rede no meio não perde o que já
    # foi pago, e a execução seguinte retoma de onde parou.
    with open(OUT_PATH, "a", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=COLUNAS)
        if novo:
            writer.writeheader()
        for capital, termo in tqdm(combos, desc="Buscando termo x capital"):
            places = client.text_search_all(f"{termo} em {capital}")
            for place in places:
                writer.writerow(
                    {
                        "place_id": place.get("id"),
                        "nome": (place.get("displayName") or {}).get("text"),
                        "endereco": place.get("formattedAddress"),
                        "capital_busca": capital,
                        "termo_busca": termo,
                    }
                )
                ids.add(place.get("id"))
            n_linhas += len(places)
            f.flush()

    print(f"OK: {n_linhas} ocorrências novas ({len(ids)} place_id únicos) acrescentadas a {OUT_PATH}")


if __name__ == "__main__":
    main()
