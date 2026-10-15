"""
Funções comuns do banco de jogos (B1): chave de nome, dados da Ludopedia e
agrupamento dos títulos dos acervos por jogo.

Identificação do jogo: o título de cada casa vira uma chave (minúsculas, sem
acento, sem pontuação, sem "(2ª edição)" e afins). A chave aponta para um slug
da Ludopedia, nesta ordem:
1. slug de jogo base igual à chave (ludopedia_ids.csv do B5 arquivado);
2. nome igual à chave no ranking ou nos detalhes do B5;
3. melhor resultado da busca da API com semelhança de nome >= 0,85
   (cache ludopedia_api_busca.json, B1-c_jogos_ludopedia.py); sem
   isso, o primeiro resultado cujo nome antes de ":" é igual à chave.
Sem nada disso, o grupo fica só com a chave. Grafias diferentes com o mesmo
slug contam como um jogo; cada casa conta uma vez por jogo.
"""
import csv
import difflib
import json
import re
import unicodedata
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[4]
PROC = ROOT / "dados" / "[B1] Estabelecimentos e cardapios" / "acervo_jogos"
RAW = ROOT / "dados" / "[B1] Estabelecimentos e cardapios" / "_dados-brutos" / "acervos_luderias"
B5 = ROOT / "arquivados" / "B5-jogos" / "_data" / "raw" / "[B5] Jogos (ludopedia)"
ACERVOS = PROC / "B1_jogos_dos_acervos.csv"
API_BUSCA = RAW / "ludopedia_api_busca.json"
API_JOGOS = RAW / "ludopedia_api_jogos.json"
LIMIAR = 0.85


def sem_acento(s):
    s = unicodedata.normalize("NFKD", s.casefold())
    return "".join(c for c in s if not unicodedata.combining(c))


def chave(nome):
    s = sem_acento(nome)
    s = re.sub(r"\((?:[^)]*(?:edi|portugu|ingl|ed\.|second|2nd|1st))[^)]*\)", "", s)
    s = re.sub(r"\s[-–]\s*\d+[ªaº°]?\s*edi\w*$", "", s)
    return re.sub(r"[^a-z0-9]+", "", s)


def le_json(p):
    return json.loads(p.read_text(encoding="utf-8")) if p.exists() else {}


def detalhe_api(d):
    """Campos usados do JSON de /api/v1/jogos/{id} (mesmo formato do B5)."""
    return {
        "id_jogo": d["id_jogo"], "nome": d["nm_jogo"].strip(),
        "jogadores_min": d.get("qt_jogadores_min"), "jogadores_max": d.get("qt_jogadores_max"),
        "idade_min": d.get("idade_minima"), "duracao_min": d.get("vl_tempo_jogo"),
        "mecanicas": "; ".join(m["nm_mecanica"] for m in d.get("mecanicas") or []),
    }


def ludopedia():
    """slug por chave de slug, slug por chave de nome, id por slug, detalhes e nota por slug."""
    slug_por_chave, id_por_slug = {}, {}
    for x in csv.DictReader(open(B5 / "ludopedia_ids.csv", encoding="utf-8")):
        s = x["link"].split("jogo/")[1]
        slug_por_chave.setdefault(re.sub(r"[^a-z0-9]", "", s), s)
        id_por_slug[s] = int(x["id_jogo"])
    slug_por_nome, nota, detalhes = {}, {}, {}
    for x in csv.DictReader(open(B5 / "ludopedia_ranking.csv", encoding="utf-8")):
        slug_por_nome.setdefault(chave(x["nm_jogo"]), x["slug"])
        if x["nota_media"]:
            nota[x["slug"]] = float(x["nota_media"])
    for linha in open(B5 / "ludopedia_jogos.jsonl", encoding="utf-8"):
        d = json.loads(linha)
        s = d["link"].split("jogo/")[1]
        slug_por_nome.setdefault(chave(d["nm_jogo"]), s)
        detalhes[s] = detalhe_api(d)
        id_por_slug.setdefault(s, d["id_jogo"])
    for d in le_json(API_JOGOS).values():
        s = d["link"].split("jogo/")[1]
        detalhes.setdefault(s, detalhe_api(d))
        id_por_slug.setdefault(s, d["id_jogo"])
    return slug_por_chave, slug_por_nome, id_por_slug, detalhes, nota


def melhor_da_busca(k, jogos):
    melhor = (0, None)
    for j in jogos:
        s = max(difflib.SequenceMatcher(None, k, chave(j.get(c) or "")).ratio() for c in ("nm_jogo", "nm_original"))
        if s > melhor[0]:
            melhor = (s, j["link"].split("jogo/")[1])
    if melhor[0] >= LIMIAR:
        return melhor[1]
    # Título curto que é o começo do nome brasileiro ("Catan" -> "Catan: O Jogo"):
    # vale o primeiro resultado cujo nome antes de ":" é igual ao título.
    for j in jogos:
        if chave((j.get("nm_jogo") or "").split(":")[0]) == k:
            return j["link"].split("jogo/")[1]
    return None


def grupos(min_casas=1):
    """Grupos de títulos por jogo: {(tipo, ident): {casas, titulos, chaves}} com min_casas ou mais casas."""
    slug_por_chave, slug_por_nome, _, _, _ = ludopedia()
    busca = le_json(API_BUSCA)
    linhas = list(csv.DictReader(open(ACERVOS, encoding="utf-8")))
    titulos = defaultdict(Counter)
    for x in linhas:
        titulos[chave(x["jogo"])][x["jogo"].strip()] += 1
    grupo_da_chave = {}
    for k, c in titulos.items():
        slug = slug_por_chave.get(k) or slug_por_nome.get(k)
        if not slug:
            slug = melhor_da_busca(k, busca.get(c.most_common(1)[0][0], []))
        grupo_da_chave[k] = ("slug", slug) if slug else ("chave", k)
    gs = defaultdict(lambda: {"casas": {}, "titulos": Counter(), "chaves": set()})
    for x in linhas:
        k = chave(x["jogo"])
        g = gs[grupo_da_chave[k]]
        g["titulos"][x["jogo"].strip()] += 1
        g["chaves"].add(k)
        casa = g["casas"].setdefault(x["estabelecimento"], {"fonte": x["fonte"], "aluguel": None})
        if x["aluguel_rs"] and casa["aluguel"] is None:
            casa["aluguel"] = (float(x["aluguel_rs"]), int(x["aluguel_dias"]))
    return {k: g for k, g in gs.items() if len(g["casas"]) >= min_casas}
