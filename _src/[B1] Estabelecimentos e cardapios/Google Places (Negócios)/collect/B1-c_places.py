"""
Bloco B1 - etapa 1: descoberta de estabelecimentos no formato
ludobar/luderia/quiz-bar nas 27 capitais brasileiras via Google Places API
(New) - textSearch, cruzando termos de busca com cada capital. A precisão
fica a cargo da etapa de filtro (B1-b_planilha.py); aqui o
objetivo é maximizar recall.

Saída: dados/B1_estabelecimentos/_dados-brutos/B1_candidatos.csv (place_id, nome, endereco, capital,
termo_busca) - um place_id pode aparecer mais de uma vez se encontrado por
termos diferentes; o dedup por place_id é feito na etapa de detalhes.

Modo --repaginar (11/11/2026). A coleta de setembro de 2026 não pedia o
campo nextPageToken na máscara de campos, e a API, sem ele, não devolve a
página seguinte: nenhuma das 403 buscas passou de 20 resultados, e 101 pararam
exatamente em 20. O modo refaz essas 101 buscas com as três páginas e
acrescenta Campinas, a única das 15 metrópoles da REGIC 2018 que não é
capital e que por isso não tinha sido buscada. A saída vai para um arquivo à
parte (B1_candidatos_repaginacao.csv), sem tocar no B1_candidatos.csv: a
medição do que entrou de novo fica em B1-a_repaginacao.py.

Uso:
    python3 "_src/[B1] Estabelecimentos e cardapios/Google Places (Negócios)/collect/B1-c_places.py"
    python3 "_src/[B1] Estabelecimentos e cardapios/Google Places (Negócios)/collect/B1-c_places.py" --repaginar
"""
# Caminhos: _src/extras/ (log comum) e outros/ do objeto (auxiliares); log em ../logs/
import sys
from pathlib import Path
_AQUI = Path(__file__).resolve()
sys.path[:0] = [str(_AQUI.parents[3] / "extras"), str(_AQUI.parents[1] / "outros")]
from log_execucao import registrar_execucao  # noqa: E402
if __name__ == "__main__":
    registrar_execucao(__file__)

import argparse
import csv
import pathlib
from collections import Counter
from datetime import datetime, timezone

from tqdm import tqdm

from places_client import SEARCH_MEDICAO_FIELD_MASK, PlacesClient

ROOT = pathlib.Path(__file__).resolve().parents[4]
OUT_PATH = ROOT / "dados" / "B1_estabelecimentos" / "_dados-brutos" / "B1_candidatos.csv"

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

REPAGINACAO_PATH = OUT_PATH.with_name("B1_candidatos_repaginacao.csv")
# Metrópole da REGIC 2018 que não é capital: fora da lista CAPITAIS.
METROPOLES_NAO_CAPITAIS = ["Campinas"]
COLUNAS_REPAGINACAO = [
    *COLUNAS, "pagina", "volume_avaliacoes", "avaliacao_media", "status_google",
    "categorias_google", "link_google_maps", "data_coleta",
]


def load_combos_feitos():
    """Combinações capital x termo já presentes no CSV. Permite acrescentar
    termos novos sem repetir (e pagar de novo) as buscas antigas."""
    if not OUT_PATH.exists():
        return set()
    with open(OUT_PATH, newline="", encoding="utf-8") as f:
        return {(r["capital_busca"], r["termo_busca"]) for r in csv.DictReader(f)}


def combos_truncados():
    """Combinações que pararam exatamente em 20 resultados na coleta sem paginação."""
    with open(OUT_PATH, newline="", encoding="utf-8") as f:
        n = Counter((r["capital_busca"], r["termo_busca"]) for r in csv.DictReader(f))
    return sorted(k for k, v in n.items() if v == 20)


def repaginar():
    client = PlacesClient()
    combos = combos_truncados() + [(c, t) for c in METROPOLES_NAO_CAPITAIS for t in TERMOS]
    feitos = set()
    if REPAGINACAO_PATH.exists():
        with open(REPAGINACAO_PATH, newline="", encoding="utf-8") as f:
            feitos = {(r["capital_busca"], r["termo_busca"]) for r in csv.DictReader(f)}
    pendentes = [c for c in combos if c not in feitos]
    print(f"{len(combos)} buscas a refazer com paginação, {len(pendentes)} pendentes")

    novo = not REPAGINACAO_PATH.exists()
    n_linhas = 0
    with open(REPAGINACAO_PATH, "a", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=COLUNAS_REPAGINACAO)
        if novo:
            writer.writeheader()
        for capital, termo in tqdm(pendentes, desc="Repaginando"):
            places = client.text_search_all(f"{termo} em {capital}", field_mask=SEARCH_MEDICAO_FIELD_MASK)
            hoje = datetime.now(timezone.utc).date().isoformat()
            for place in places:
                writer.writerow(
                    {
                        "place_id": place.get("id"),
                        "nome": (place.get("displayName") or {}).get("text"),
                        "endereco": place.get("formattedAddress"),
                        "capital_busca": capital,
                        "termo_busca": termo,
                        "pagina": place.get("_pagina"),
                        "volume_avaliacoes": place.get("userRatingCount") or 0,
                        "avaliacao_media": place.get("rating"),
                        "status_google": place.get("businessStatus", ""),
                        "categorias_google": ";".join(place.get("types", [])),
                        "link_google_maps": place.get("googleMapsUri"),
                        "data_coleta": hoje,
                    }
                )
            n_linhas += len(places)
            f.flush()
    print(f"OK: {n_linhas} ocorrências acrescentadas a {REPAGINACAO_PATH.name}")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--repaginar", action="store_true",
                        help="refaz com paginação as buscas truncadas em 20 e acrescenta Campinas")
    if parser.parse_args().repaginar:
        return repaginar()

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
