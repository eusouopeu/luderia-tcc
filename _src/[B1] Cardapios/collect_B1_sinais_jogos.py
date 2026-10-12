"""Procura sinais de venda e aluguel de jogos, e de modelo de precificação (taxa, passe, passaporte), nos sites e links dos estabelecimentos.

Entrada: lista SITES abaixo (Site e Outros links do banco A do Notion, 12/10/2026).
Saída:   _data/processed/[B1] Estabelecimentos e cardapios/Cardápios/B1_sinais_venda_aluguel.csv
Linktree: lê os títulos dos botões (loja, aluguel, ingressos). Demais páginas: conta termos no HTML.
Os sinais são indícios; a decisão final por estabelecimento é manual (preço de jogo no DOM confirma venda).
"""
import csv
import json
import re
import ssl
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

import certifi

ROOT = Path(__file__).resolve().parents[2]
SAIDA = ROOT / "_data/processed/[B1] Estabelecimentos e cardapios/Cardápios/B1_sinais_venda_aluguel.csv"
CTX = ssl.create_default_context(cafile=certifi.where())
UA = {"User-Agent": "Mozilla/5.0"}  # Linktree devolve 403 para User-Agent completo

SITES = {
    "Alçapão Jogos": ["https://linktr.ee/AlcapaoJogos", "https://alcapaojogos.acervodejogos.com.br/boardgames"],
    "Arcadea Gaming Pub": ["https://go.tagme.com.br/arcadeapub"],
    "Arena BG": ["https://linktr.ee/arenabg", "https://www.arenabg.com.br/acervo-de-jogos"],
    "Asgard": ["http://linktr.ee/asgardbsb", "https://www.asgardstore.com.br"],
    "Balboa's Hobby Games": ["https://beacons.page/balboas"],
    "BoardZ Game Pub": ["https://www.boardzgamepub.com.br/"],
    "Bravo Jogos": ["http://www.bravojogos.com.br"],
    "Café Geek": ["https://vilageek.es"],
    "CCG Floripa": ["http://tavernanerdstore.com"],
    "Chef on Play": ["https://ludopedia.com.br/colecao?usuario=chefnavan"],
    "Cineplay SC": ["https://linkin.bio/cineplay_sc"],
    "Coletivo Geek": ["https://linktr.ee/coletivogeekbr"],
    "Comdado Bar": ["https://linktr.ee/comdado", "https://comdado.acervodejogos.com.br"],
    "Covil Game Bar": ["https://linktr.ee/CovilGameBar"],
    "Dominaria": ["http://www.dominariacgsp.com.br"],
    "Dungeon Games": ["https://linktr.ee/dungeongames", "https://dungeon.acervodejogos.com.br/"],
    "Fan Hour": ["https://linktr.ee/fanhourbr"],
    "Flow Games": ["https://linktr.ee/flowg4mes", "http://www.flowgames.com.br"],
    "Fortalúdica": ["https://linktr.ee/fortaludicaa", "https://www.fortaludica.com.br"],
    "Game of Boards": ["https://www.gameofboards.com.br/"],
    "Garagem do Nerd": ["https://linktr.ee/garagemdonerd", "https://www.garagemdonerdtcg.com.br/"],
    "Gruta BSB": ["https://linktr.ee/grutabsb", "https://www.grutabsb.com.br/"],
    "Ilusões Industriais": ["http://www.lojailusoes.com.br/"],
    "Inside Games": ["http://linktr.ee/insidegames", "http://www.insidegamestore.com"],
    "JogaSampa": ["http://www.jogasampa.com.br/"],
    "Encounter": ["https://encounter.com.br/"],
    "Joyjoy Café": ["https://linktr.ee/joyjoycafe", "https://joyjoycafe.acervodejogos.com.br/", "https://loja.joyjoycafe.com.br"],
    "Luderia Carioca": ["http://www.luderiacarioca.com"],
    "LudoCafé editora": ["https://linktr.ee/ludocafe_editora"],
    "Ludoteca BGC": ["https://linktr.ee/ludotecabgc", "https://loja.ludoteca.com.br/", "https://ludoteca.acervodejogos.com.br/"],
    "Ludoteca SideQuest": ["https://linktr.ee/ludotecasidequest"],
    "Magic Store Brasil": ["https://lnk.bio/MagicStoreBrasil"],
    "Nala Land": ["https://beacons.ai/nalaland"],
    "OMNIVERSE": ["http://blog.omniverse.com.br/bio/"],
    "Paladino Hobbies": ["https://www.paladinohobbies.com.br/"],
    "Paladins Games Store": ["https://linktr.ee/paladinsgamesstore"],
    "Pittas Board Games": ["https://heylink.me/pittasboardgames/"],
    "Place Games": ["https://linktr.ee/lojaplacegames", "https://www.placegames.com.br/"],
    "Playeasy": ["https://lnk.bio/playeasy"],
    "RED Jogos": ["https://linklist.bio/REDJogos"],
    "São Jogue": ["https://linktr.ee/saojogue", "https://saojogue.com.br/aluguel/"],
    "Shelf bar": ["https://linktr.ee/shelfbarejogos", "http://shelf.acervodejogos.com.br"],
    "Taverna Game House": ["https://linktr.ee/tavernagamehouse", "https://www.tavernagamehouse.com.br"],
    "Utopia Games & Food": ["http://utopiagames.com.br"],
    "Vila Celta": ["http://www.reidascartinhas.com.br"],
    "XPlace": ["https://linktr.ee/xplacermkt", "http://www.xplace.com.br"],
    "Castelos Bar": ["https://www.castelosbar.com.br/festival"],
    "Cartola Luderia": [],
}
TERMOS = {
    "loja": r"adicionar ao carrinho|add to cart|comprar|carrinho|loja virtual|loja online|ecom/itens",
    "aluguel": r"alug[au]|loca[cç][aã]o de jogos|acervodejogos",
    "taxa": r"passaporte|passe\b|taxa de|couvert|consuma[cç][aã]o m[ií]nima|ingresso|mesa livre|entrada livre",
}
BOTOES_LINKTREE = re.compile(r"loja|compre|aluguel|alugue|ingresso|passaporte|passe|taxa|mesa|reserva|card[aá]pio", re.I)


def baixar(url):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=25, context=CTX) as r:
        return r.read().decode("utf8", "ignore")


def botoes_linktree(html):
    m = re.search(r'<script id="__NEXT_DATA__"[^>]*>(.*?)</script>', html, re.S)
    achados = []
    def anda(x):
        if isinstance(x, dict):
            if x.get("url") and x.get("title") and BOTOES_LINKTREE.search(x["title"]):
                achados.append(f'{x["title"][:45]} -> {x["url"][:80]}')
            for v in x.values():
                anda(v)
        elif isinstance(x, list):
            for v in x:
                anda(v)
    if m:
        anda(json.loads(m.group(1)))
    return list(dict.fromkeys(achados))


def analisa(item):
    nome, url = item
    try:
        html = baixar(url)
    except Exception as e:
        return [nome, url, "ERRO", str(e)[:50], "", "", "", ""]
    texto = re.sub(r"<(script|style)[^>]*>.*?</\1>", " ", html, flags=re.S | re.I)
    texto = re.sub(r"<[^>]+>", " ", texto)
    cont = {k: len(re.findall(v, html if k == "loja" else texto, re.I)) for k, v in TERMOS.items()}
    precos = len(re.findall(r"R\$\s?\d{2,3}[.,]\d{2}", texto))
    botoes = "; ".join(botoes_linktree(html)) if "linktr.ee" in url else ""
    return [nome, url, "ok", precos, cont["loja"], cont["aluguel"], cont["taxa"], botoes]


def main():
    itens = [(n, u) for n, us in SITES.items() for u in us]
    with ThreadPoolExecutor(8) as ex:
        linhas = list(ex.map(analisa, itens))
    with open(SAIDA, "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f, delimiter=";")
        w.writerow(["estabelecimento", "url", "status", "precos_rs_no_html", "termos_loja", "termos_aluguel", "termos_taxa_passe", "botoes_linktree"])
        w.writerows(linhas)
    for l in linhas:
        print(l[0], "|", l[1][:45], "|", l[2], "| R$:", l[3], "loja:", l[4], "alug:", l[5], "taxa:", l[6], "|", l[7][:200])


if __name__ == "__main__":
    main()
