"""
Bloco B - etapa 3: junta candidatos (etapa 1) e detalhes (etapa 2) e aplica
um filtro de dois estágios para reter apenas os candidatos com alta
probabilidade de serem de fato um ludobar/luderia/quiz-bar:

  1. Palavra-chave no nome do estabelecimento OU no texto das avaliações
     (até 5 por local, retornadas pela própria Places API).
  2. Categoria de negócio (`types` do Google) compatível com formato de
     alimentação/bebidas (bar, cafe, restaurant etc.) - elimina lojas de
     brinquedo, brinquedotecas, lojas de videogame e fliperamas que a
     palavra-chave no nome também capturaria por engano.

Só passa quem bate nos dois estágios. Dois arquivos de saída:
  data/processed/bloco_b_planilha_curadoria.csv - aprovados, uma linha por
      place_id único, pronta para a etapa de codificação manual
      (precificação, alimentação/bebidas, acervo).
  data/processed/bloco_b_descartados_por_filtro.csv - reprovados, com
      motivo_descarte ("sem_termo_chave" ou "categoria_incompativel"),
      mantidos para auditoria/transparência metodológica.

match_tipo indica onde o termo-chave foi encontrado: "nome", "avaliacao" ou
"nome+avaliacao".

Uso:
    python3 src/build_bloco_b_planilha.py
"""
import csv
import json
import pathlib
import unicodedata
from collections import defaultdict

ROOT = pathlib.Path(__file__).resolve().parent.parent
CANDIDATOS_PATH = ROOT / "data" / "raw" / "bloco_b_candidatos.csv"
DETALHES_PATH = ROOT / "data" / "raw" / "bloco_b_detalhes.jsonl"
OUT_PATH = ROOT / "data" / "processed" / "bloco_b_planilha_curadoria.csv"
OUT_DESCARTADOS_PATH = ROOT / "data" / "processed" / "bloco_b_descartados_por_filtro.csv"

# Lista ampla: aplicada ao NOME do estabelecimento, onde a presença do termo
# é sinal forte (um bar não se chama "Games" ou "Jogos" por acaso).
KEYWORDS_NOME = [
    "quiz",
    "jogue",
    "jogos",
    "jogo",
    "ludo",
    "luder",
    "tabuleiro",
    "brinquedo",
    "board",
    "game",
    "bodogami",
]

# Lista restrita: aplicada ao texto das AVALIAÇÕES, onde termos soltos como
# "jogo"/"game"/"brinquedo" geram falso positivo (jogo de futebol na TV,
# fliperama, espaço de festa infantil). Exige termos específicos de board
# game ou frases compostas.
KEYWORDS_AVALIACAO = [
    "quiz",
    "ludo",
    "luder",
    "tabuleiro",
    "bodogami",
    "board game",
    "jogo de tabuleiro",
    "jogos de tabuleiro",
]

# O formato ludobar/luderia/quiz-bar é um estabelecimento de alimentação e
# bebidas - exigir que o `types` do Google inclua ao menos uma categoria
# desse tipo elimina lojas de brinquedo/varejo, brinquedotecas e fliperamas
# que a palavra-chave "brinquedo"/"game" no nome também captura por engano.
TYPES_BAR_CAFE = {
    "bar",
    "restaurant",
    "cafe",
    "coffee_shop",
    "cocktail_bar",
    "night_club",
    "pub",
    "wine_bar",
    "snack_bar",
    "hamburger_restaurant",
    "american_restaurant",
    "meal_takeaway",
    "food",
}

COLUNAS_CURADORIA = [
    "place_id",
    "nome",
    "endereco",
    "capital_busca",
    "match_tipo",
    "categorias_google",
    "avaliacao_media",
    "volume_avaliacoes",
    "site_ou_rede_social",
    "telefone",
    "link_google_maps",
    "status_google",
    "relevante",
    "politica_precificacao",
    "modelo_alimentacao_bebidas",
    "acervo_declarado",
]

COLUNAS_DESCARTADOS = [
    "place_id",
    "nome",
    "endereco",
    "capital_busca",
    "motivo_descarte",
    "categorias_google",
    "avaliacao_media",
    "volume_avaliacoes",
    "site_ou_rede_social",
]


def normaliza(texto):
    if not texto:
        return ""
    sem_acento = unicodedata.normalize("NFKD", texto).encode("ascii", "ignore").decode("ascii")
    return sem_acento.lower()


def contem_keyword(texto, keywords):
    texto_norm = normaliza(texto)
    return any(kw in texto_norm for kw in keywords)


def classifica(detalhe):
    nome = (detalhe.get("displayName") or {}).get("text", "")
    reviews_texto = " ".join(
        (r.get("text") or {}).get("text", "") for r in detalhe.get("reviews", [])
    )

    bate_nome = contem_keyword(nome, KEYWORDS_NOME)
    bate_avaliacao = contem_keyword(reviews_texto, KEYWORDS_AVALIACAO)

    if bate_nome and bate_avaliacao:
        return "nome+avaliacao"
    if bate_nome:
        return "nome"
    if bate_avaliacao:
        return "avaliacao"
    return None


def bate_categoria(detalhe):
    return bool(set(detalhe.get("types", [])) & TYPES_BAR_CAFE)


def load_capitais_por_place_id():
    capitais = defaultdict(set)
    with open(CANDIDATOS_PATH, newline="", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            if row["place_id"]:
                capitais[row["place_id"]].add(row["capital_busca"])
    return capitais


def load_detalhes():
    detalhes = {}
    with open(DETALHES_PATH, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            d = json.loads(line)
            detalhes[d["id"]] = d
    return detalhes


def main():
    capitais_por_id = load_capitais_por_place_id()
    detalhes = load_detalhes()

    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)

    mantidos = []
    descartados = []

    for place_id, d in detalhes.items():
        match_tipo = classifica(d)
        categoria_ok = bate_categoria(d)
        capital_busca = ";".join(sorted(capitais_por_id.get(place_id, [])))
        categorias_google = ";".join(d.get("types", []))
        base = {
            "place_id": place_id,
            "nome": (d.get("displayName") or {}).get("text"),
            "endereco": d.get("formattedAddress"),
            "capital_busca": capital_busca,
            "categorias_google": categorias_google,
            "avaliacao_media": d.get("rating"),
            "volume_avaliacoes": d.get("userRatingCount"),
            "site_ou_rede_social": d.get("websiteUri"),
        }
        if match_tipo and categoria_ok:
            mantidos.append(
                {
                    **base,
                    "match_tipo": match_tipo,
                    "telefone": d.get("internationalPhoneNumber"),
                    "link_google_maps": d.get("googleMapsUri"),
                    "status_google": d.get("businessStatus"),
                    "relevante": "",
                    "politica_precificacao": "",
                    "modelo_alimentacao_bebidas": "",
                    "acervo_declarado": "",
                }
            )
        else:
            if not match_tipo:
                motivo = "sem_termo_chave"
            else:
                motivo = "categoria_incompativel"
            descartados.append({**base, "motivo_descarte": motivo})

    mantidos.sort(key=lambda r: r["nome"] or "")
    descartados.sort(key=lambda r: r["nome"] or "")

    with open(OUT_PATH, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=COLUNAS_CURADORIA)
        writer.writeheader()
        writer.writerows(mantidos)

    with open(OUT_DESCARTADOS_PATH, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=COLUNAS_DESCARTADOS)
        writer.writeheader()
        writer.writerows(descartados)

    print(f"OK: {len(mantidos)} candidatos aprovados no filtro salvos em {OUT_PATH}")
    print(f"    {len(descartados)} descartados (sem termo-chave em nome/avaliações) salvos em {OUT_DESCARTADOS_PATH}")


if __name__ == "__main__":
    main()
