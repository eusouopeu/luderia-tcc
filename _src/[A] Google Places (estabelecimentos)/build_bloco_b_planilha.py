"""
Bloco A - etapa 3: junta candidatos (etapa 1) e detalhes (etapa 2) e monta a
planilha de curadoria. Desenho do recorte (_instrucoes/4_metodologia.md):

  É do tipo      -> verificação manual do autor (fotos do Maps com mesas ou
                    estantes de jogos, ou texto que menciona jogar no local).
                    Coluna `evidencia_espaco_jogo`, preenchida à mão.
  Está ativa     -> status do Google diferente de fechado e avaliação mais
                    recente com até 6 meses (coluna `ativo_6m`).
  Presença       -> volume de avaliações no Maps OU publicações no Instagram
                    acima do limiar; limiares definidos pela distribuição
                    (analise_bloco_b_limiares.py), não fixados aqui.

Filtro automático, aplicado antes da curadoria:
  1. Palavra-chave no nome OU no texto das avaliações (até 5 por local).
  2. Endereço no Brasil.
  3. Não marcado como fechado definitivamente pelo Google.
  4. No recorte geográfico: município da capital do estado ou da região
     metropolitana dela (recorte_rm.py). Quem passa nos filtros 1 a 3, ou foi
     aprovado na triagem, mas fica fora da RM vai para os descartados com
     motivo `fora_da_rm_da_capital`.

A categoria do Google deixou de eliminar candidatos: casas que funcionam como
espaço de jogo aparecem como loja de jogos ou de brinquedos. A categoria vira
a coluna `grupo_categoria`, só para orientar a curadoria.

O script tem três saídas, não duas:
  bloco_b_planilha_curadoria.csv  -> aprovados, vão para a curadoria manual
  bloco_b_triagem.csv             -> indefinidos: sem palavra-chave no nome e
                                     sem avaliações coletadas. O filtro não
                                     tem como decidir, porque o texto das
                                     avaliações não foi comprado para eles.
  bloco_b_descartados_por_filtro.csv -> reprovados de fato

A triagem manual decide os indefinidos: quem tem `fotos_comprovam` ou
`instagram_comprova` igual a "sim" sobe para a planilha de curadoria, com
`origem` = "triagem_manual" e `evidencia_espaco_jogo` = "sim". "inconclusivo"
conta como eliminado: a regra exige evidência positiva do espaço de jogo. Os
48 que o autor tirou da planilha de triagem por inspeção do nome (redes de
papelaria, brinquedos e livrarias, boliches) foram registrados com fotos no
Maps que não comprovam.

Estabelecimentos da lista manual do autor (bloco_b_lista_manual_rj.csv) com
place_id entram mesmo sem passar no filtro, marcados em `origem`.

A curadoria manual já feita é preservada: colunas manuais de uma versão
anterior da planilha são reaproveitadas pelo place_id.

Uso:
    python3 "_src/[A] Google Places (estabelecimentos)/build_bloco_b_planilha.py"
"""
import csv
import json
import pathlib
import re
import unicodedata

from recorte_rm import no_recorte
from collections import defaultdict
from datetime import datetime, timedelta, timezone

ROOT = pathlib.Path(__file__).resolve().parents[2]
RAW = ROOT / "_data" / "raw" / "[A] Estabelecimentos e cardapios"
PROCESSED = ROOT / "_data" / "processed" / "[A] Estabelecimentos e cardapios"
CANDIDATOS_PATH = RAW / "bloco_b_candidatos.csv"
DETALHES_PATH = RAW / "bloco_b_detalhes.jsonl"
DETALHES_SEM_REVIEWS_PATH = RAW / "bloco_b_detalhes_sem_reviews.jsonl"
LISTA_MANUAL_PATH = RAW / "bloco_b_lista_manual_rj.csv"
OUT_PATH = PROCESSED / "bloco_b_planilha_curadoria.csv"
OUT_DESCARTADOS_PATH = PROCESSED / "bloco_b_descartados_por_filtro.csv"
OUT_TRIAGEM_PATH = PROCESSED / "bloco_b_triagem.csv"

JANELA_ATIVIDADE = timedelta(days=183)

# Lista ampla: aplicada ao NOME, onde o termo é sinal forte.
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
    "rpg",
    "card",
    "magic",
    "geek",
    "nerd",
]

# Lista restrita: aplicada ao texto das AVALIAÇÕES, onde termos soltos geram
# falso positivo (jogo de futebol na TV, fliperama, festa infantil).
KEYWORDS_AVALIACAO = [
    "quiz",
    "ludo",
    "luder",
    "tabuleiro",
    "bodogami",
    "board game",
    "boardgame",
    "jogo de tabuleiro",
    "jogos de tabuleiro",
    "rpg",
    "card game",
    "magic the gathering",
    "pokemon tcg",
]

# Termos de baixa precisão, medida como a fração dos locais que cada termo
# trouxe e que acabou aprovada: "quiz bar" 8%, "ludoteca" 48%, contra 68% a
# 97% dos demais. Quem apareceu só nesses termos e ainda por cima não tem
# palavra-chave é bar de noite de perguntas ou brinquedoteca, não luderia.
# A regra só se aplica a quem já reprovou no filtro de palavra-chave: quem
# passou continua na planilha, tenha vindo do termo que for.
TERMOS_BAIXA_PRECISAO = {"quiz bar", "ludoteca"}

# O outro extremo da mesma medida: termos que aprovaram de 74% a 97% do que
# trouxeram. Não aprovam nem reprovam ninguém; servem só para ordenar a fila
# de checagem manual da triagem.
TERMOS_ALTA_PRECISAO = {
    "loja de board game",
    "loja de RPG",
    "loja de card game",
    "luderia",
    "board game café",
    "café de jogos de tabuleiro",
    "loja de jogos de tabuleiro",
    "clube de jogos de tabuleiro",
}

# Shopping center e varejo grande entram na busca por abrigarem uma loja de
# jogos, não por serem uma. São 20 dos 233 indefinidos e vão para o fim da
# fila: ordenar a triagem só por volume de avaliações punha Shopping da Ilha
# (35.949 avaliações) e Decathlon no topo.
TYPES_VAREJO_GRANDE = {
    "shopping_mall", "department_store", "supermarket", "grocery_store",
    "hardware_store", "furniture_store", "clothing_store",
    "sporting_goods_store", "pharmacy", "convenience_store",
}

TYPES_AEB = {
    "bar", "restaurant", "cafe", "coffee_shop", "cocktail_bar", "night_club",
    "pub", "wine_bar", "snack_bar", "hamburger_restaurant", "american_restaurant",
    "meal_takeaway", "food", "gastropub", "bar_and_grill", "brewery", "irish_pub",
    "pizza_restaurant", "sports_bar", "brazilian_restaurant", "food_court",
}
TYPES_LOJA = {"store", "toy_store", "book_store", "home_goods_store", "electronics_store", "gift_shop"}

RE_INSTAGRAM = re.compile(r"instagram\.com/([A-Za-z0-9_.]+)", re.IGNORECASE)
HANDLES_INVALIDOS = {"p", "reel", "reels", "stories", "explore", "accounts"}

COLUNAS_MANUAIS = [
    "evidencia_espaco_jogo",
    "relevante",
    "politica_precificacao",
    "modelo_alimentacao_bebidas",
    "acervo_declarado",
]

COLUNAS_CURADORIA = [
    "place_id",
    "nome",
    "endereco",
    "capital_busca",
    "origem",
    "match_tipo",
    "grupo_categoria",
    "categorias_google",
    "avaliacao_media",
    "volume_avaliacoes",
    "status_google",
    "ultima_avaliacao_data",
    "ativo_6m",
    "site_ou_rede_social",
    "instagram_usuario",
    "telefone",
    "link_google_maps",
    "data_coleta",
    *COLUNAS_MANUAIS,
]

COLUNAS_MANUAIS_TRIAGEM = [
    "evidencia_espaco_jogo",
    "relevante",
    "observacao",
    "tem_fotos_maps",
    "fotos_comprovam",
    "tem_instagram",
    "instagram_comprova",
]


def aprovado_na_triagem(manuais):
    """Evidência positiva em pelo menos uma das duas checagens manuais."""
    return "sim" in (manuais.get("fotos_comprovam"), manuais.get("instagram_comprova"))

# Indefinidos: sem palavra-chave no nome e sem avaliações coletadas. O filtro
# não os aprova nem os reprova, porque a evidência que decidiria está no texto
# das avaliações, que não foi comprado para eles. Vão para checagem manual.
COLUNAS_TRIAGEM = [
    "place_id",
    "nome",
    "endereco",
    "capital_busca",
    "termos_busca",
    "termos_alta_precisao",
    "varejo_grande",
    "grupo_categoria",
    "categorias_google",
    "avaliacao_media",
    "volume_avaliacoes",
    "status_google",
    "site_ou_rede_social",
    "instagram_usuario",
    "link_google_maps",
    "data_coleta",
    *COLUNAS_MANUAIS_TRIAGEM,
]

COLUNAS_DESCARTADOS = [
    "place_id",
    "nome",
    "endereco",
    "capital_busca",
    "motivo_descarte",
    "termos_busca",
    "categorias_google",
    "avaliacao_media",
    "volume_avaliacoes",
    "site_ou_rede_social",
    "data_coleta",
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


def grupo_categoria(detalhe):
    types = set(detalhe.get("types", []))
    if types & TYPES_AEB:
        return "alimentos_bebidas"
    if types & TYPES_LOJA:
        return "loja"
    return "outro"


def bate_pais(detalhe):
    """A textSearch por termo x capital também retorna locais fora do Brasil."""
    endereco = normaliza(detalhe.get("formattedAddress", "")).strip()
    return endereco.endswith("brazil") or endereco.endswith("brasil")


def ultima_avaliacao(detalhe):
    """Data da avaliação mais recente entre as até 5 que a API devolve. A API
    ordena por relevância, não por data: a data encontrada é um limite
    inferior. Avaliação recente prova atividade; ausência dela é inconclusiva."""
    datas = [r["publishTime"] for r in detalhe.get("reviews", []) if r.get("publishTime")]
    if not datas:
        return None
    # publishTime vem com nanossegundos ("2026-02-04T00:31:21.376434868Z"),
    # que o fromisoformat não aceita; a precisão de segundos basta.
    return max(datetime.fromisoformat(d[:19]).replace(tzinfo=timezone.utc) for d in datas)


def data_referencia(detalhes):
    """Data de corte da janela de atividade: a coleta mais recente do arquivo
    de detalhes. Vem da coluna `data_coleta` de cada registro, não da data de
    modificação do arquivo: a coleta é incremental e o arquivo mistura datas.
    O fallback para o mtime cobre um arquivo anterior à criação da coluna."""
    datas = [d["data_coleta"] for d in detalhes.values() if d.get("data_coleta")]
    if not datas:
        return datetime.fromtimestamp(DETALHES_PATH.stat().st_mtime, tz=timezone.utc)
    return datetime.fromisoformat(max(datas)).replace(tzinfo=timezone.utc)


def instagram_usuario(url):
    m = RE_INSTAGRAM.search(url or "")
    if not m or m.group(1).lower() in HANDLES_INVALIDOS:
        return ""
    return m.group(1).rstrip(".").lower()


def load_buscas_por_place_id():
    """Capitais e termos de busca que encontraram cada place_id."""
    capitais, termos = defaultdict(set), defaultdict(set)
    with open(CANDIDATOS_PATH, newline="", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            if row["place_id"]:
                capitais[row["place_id"]].add(row["capital_busca"])
                termos[row["place_id"]].add(row["termo_busca"])
    return capitais, termos


def load_detalhes():
    """Junta os dois arquivos de detalhes e marca cada registro com
    `reviews_coletadas`. O arquivo sem avaliações foi coletado no SKU barato
    (Place Details Enterprise) e não tem o campo `reviews`; para ele, ausência
    de evidência nas avaliações não é evidência de ausência. O arquivo com
    avaliações tem precedência quando o mesmo place_id está nos dois."""
    detalhes = {}
    for path, tem_reviews in ((DETALHES_SEM_REVIEWS_PATH, False), (DETALHES_PATH, True)):
        if not path.exists():
            continue
        with open(path, encoding="utf-8") as f:
            for line in f:
                if line.strip():
                    d = json.loads(line)
                    d["reviews_coletadas"] = tem_reviews
                    detalhes[d["id"]] = d
    return detalhes


def load_lista_manual():
    if not LISTA_MANUAL_PATH.exists():
        return set()
    with open(LISTA_MANUAL_PATH, newline="", encoding="utf-8") as f:
        return {r["place_id"] for r in csv.DictReader(f) if r["place_id"]}


def load_manuais_anteriores(path, colunas):
    """Colunas manuais já preenchidas, por place_id. Preserva o trabalho de
    curadoria quando o script roda de novo."""
    if not path.exists():
        return {}
    anterior = {}
    with open(path, newline="", encoding="utf-8") as f:
        for r in csv.DictReader(f):
            pid = r.get("place_id", "")
            if pid.startswith("ChIJ"):
                anterior[pid] = {c: r.get(c, "") for c in colunas}
    return anterior


def main():
    capitais_por_id, termos_por_id = load_buscas_por_place_id()
    detalhes = load_detalhes()
    lista_manual = load_lista_manual()
    anterior = load_manuais_anteriores(OUT_PATH, COLUNAS_MANUAIS)
    anterior_triagem = load_manuais_anteriores(OUT_TRIAGEM_PATH, COLUNAS_MANUAIS_TRIAGEM)
    data_ref = data_referencia(detalhes)

    mantidos, triagem, descartados = [], [], []
    for place_id, d in detalhes.items():
        match_tipo = classifica(d)
        status = d.get("businessStatus", "")
        base = {
            "place_id": place_id,
            "nome": (d.get("displayName") or {}).get("text"),
            "endereco": d.get("formattedAddress"),
            "capital_busca": ";".join(sorted(capitais_por_id.get(place_id, []))),
            "categorias_google": ";".join(d.get("types", [])),
            "avaliacao_media": d.get("rating"),
            "volume_avaliacoes": d.get("userRatingCount") or 0,
            "site_ou_rede_social": d.get("websiteUri"),
            "data_coleta": d.get("data_coleta", ""),
        }
        manual = place_id in lista_manual
        termos = termos_por_id.get(place_id, set())

        if not bate_pais(d):
            motivo = "fora_do_brasil"
        elif status == "CLOSED_PERMANENTLY":
            motivo = "fechado_definitivamente"
        elif not match_tipo and not manual:
            # Separa o erro grosseiro (só veio de termo ruim) do caso em que a
            # evidência pode existir mas não apareceu nas até 5 avaliações que
            # a API devolve. Só o segundo grupo merece checagem manual.
            if termos and not (termos - TERMOS_BAIXA_PRECISAO):
                motivo = "so_termo_baixa_precisao"
            elif not d.get("reviews_coletadas"):
                # Sem o texto das avaliações, reprovar seria confundir falta de
                # evidência com evidência de ausência. Vai para checagem manual.
                motivo = "indefinido_sem_reviews"
            else:
                motivo = "sem_termo_chave"
        else:
            motivo = None

        triado = False
        if motivo == "indefinido_sem_reviews":
            manuais_triagem = anterior_triagem.get(
                place_id, {c: "" for c in COLUNAS_MANUAIS_TRIAGEM}
            )
            triagem.append(
                {
                    **base,
                    "termos_busca": ";".join(sorted(termos)),
                    "termos_alta_precisao": len(termos & TERMOS_ALTA_PRECISAO),
                    "varejo_grande": (
                        "sim" if set(d.get("types", [])) & TYPES_VAREJO_GRANDE else "nao"
                    ),
                    "grupo_categoria": grupo_categoria(d),
                    "status_google": status,
                    "instagram_usuario": instagram_usuario(d.get("websiteUri")),
                    "link_google_maps": d.get("googleMapsUri"),
                    **manuais_triagem,
                }
            )
            # A linha fica também na triagem, como registro da decisão.
            if not aprovado_na_triagem(manuais_triagem):
                continue
            triado = True
            motivo = None

        # Recorte geográfico, depois dos filtros de tipo: só para quem iria à
        # curadoria. A triagem guarda a linha como registro da decisão.
        if motivo is None and not no_recorte(d.get("formattedAddress")):
            motivo = "fora_da_rm_da_capital"

        if motivo:
            descartados.append(
                {**base, "motivo_descarte": motivo, "termos_busca": ";".join(sorted(termos))}
            )
            continue

        ultima = ultima_avaliacao(d)
        if ultima and data_ref - ultima <= JANELA_ATIVIDADE:
            ativo = "sim"
        else:
            ativo = "inconclusivo"
        manuais = anterior.get(place_id, {c: "" for c in COLUNAS_MANUAIS})
        if triado and not manuais["evidencia_espaco_jogo"]:
            manuais["evidencia_espaco_jogo"] = "sim"
        if triado:
            origem = "triagem_manual"
        elif manual:
            # "ambas": na lista manual e aprovado pelo filtro automático.
            origem = "ambas" if match_tipo else "lista_manual"
        else:
            origem = "busca_automatica"
        mantidos.append(
            {
                **base,
                "origem": origem,
                "match_tipo": match_tipo or "",
                "grupo_categoria": grupo_categoria(d),
                "status_google": status,
                "ultima_avaliacao_data": ultima.date().isoformat() if ultima else "",
                "ativo_6m": ativo,
                "instagram_usuario": instagram_usuario(d.get("websiteUri")),
                "telefone": d.get("internationalPhoneNumber"),
                "link_google_maps": d.get("googleMapsUri"),
                **manuais,
            }
        )

    mantidos.sort(key=lambda r: (r["capital_busca"], r["nome"] or ""))
    # Prioridade da triagem: primeiro quem foi achado por mais termos de alta
    # precisão, depois por volume de avaliações, com shopping e varejo grande
    # no fim da fila. O critério é a chance de ser um espaço de jogo, não o
    # tamanho do estabelecimento.
    triagem.sort(
        key=lambda r: (
            r["varejo_grande"] == "sim",
            -int(r["termos_alta_precisao"]),
            -int(r["volume_avaliacoes"] or 0),
        )
    )
    descartados.sort(key=lambda r: r["nome"] or "")

    PROCESSED.mkdir(parents=True, exist_ok=True)
    with open(OUT_PATH, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=COLUNAS_CURADORIA)
        writer.writeheader()
        writer.writerows(mantidos)
    with open(OUT_TRIAGEM_PATH, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=COLUNAS_TRIAGEM)
        writer.writeheader()
        writer.writerows(triagem)
    with open(OUT_DESCARTADOS_PATH, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=COLUNAS_DESCARTADOS)
        writer.writeheader()
        writer.writerows(descartados)

    print(f"OK: {len(mantidos)} candidatos na planilha de curadoria ({OUT_PATH.name})")
    print(f"    {len(triagem)} indefinidos para checagem manual ({OUT_TRIAGEM_PATH.name})")
    print(f"    {len(descartados)} descartados ({OUT_DESCARTADOS_PATH.name})")


if __name__ == "__main__":
    main()
