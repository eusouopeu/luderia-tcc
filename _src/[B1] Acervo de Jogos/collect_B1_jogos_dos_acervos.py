"""
Bloco B1 - títulos do acervo de jogos de cada estabelecimento com cardápio.

Pedido do autor em 13/10/2026: preencher a coluna "Jogos do acervo" do banco
"A - Estabelecimentos" (Notion) só para as casas com dados de comida no banco,
a partir dos acervos publicados por elas.

Fontes, uma por estabelecimento:
- Acervo de Jogos (<loja>.acervodejogos.com.br/boardgames?sort=mais_alugados):
  a ordem da listagem é a de "mais alugados" da plataforma, guardada em
  `posicao`.
- rejoy (<loja>.rejoy.com.br/search): ordem da própria listagem (alfabética).
- Ludopedia (coleção pública): a página fica atrás do Cloudflare e foi lida no
  navegador; os títulos entram por _data/raw/.../acervos_jogos/ludopedia_<x>.txt
  (um título por linha, na ordem da coleção).
- Covil Game Bar: B1_jogos_covil.csv (PDF de 2023, build_B1_jogos_covil.py).

Entrada: HTML guardado em _data/raw/[B1].../acervos_jogos/ (cache: página já
baixada não é baixada de novo).
Saída: _data/processed/[B1] Estabelecimentos e cardapios/Acervo de Jogos/
B1_jogos_dos_acervos.csv, uma linha por título em cada estabelecimento.
Um título só conta uma vez por estabelecimento (cópias repetidas saem).
A listagem do Acervo de Jogos traz mais nomes que a contagem de "títulos" da
lista /companies (ex.: Bardo Mago, 588 contra 384): a listagem inclui
expansões e grafias diferentes do mesmo jogo, e a contagem da lista não é
documentada. Em `posicao`, o empate de aluguéis cai em ordem alfabética.
"""
import csv
import html
import json
import re
import ssl
import sys
import time
import urllib.request
from pathlib import Path

import certifi

ROOT = Path(__file__).resolve().parents[2]
RAW = ROOT / "_data" / "raw" / "[B1] Estabelecimentos e cardapios" / "acervos_jogos"
PROC = ROOT / "_data" / "processed" / "[B1] Estabelecimentos e cardapios"
SAIDA = PROC / "Acervo de Jogos" / "B1_jogos_dos_acervos.csv"
COVIL = PROC / "Cardápios" / "B1_jogos_covil.csv"
CTX = ssl.create_default_context(cafile=certifi.where())
UA = {"User-Agent": "Mozilla/5.0"}

# Estabelecimento (nome no banco A) -> (fonte, identificador)
FONTES = {
    "Alçapão Jogos De Tabuleiro": ("acervodejogos", "alcapaojogos"),
    "Bardo Mago": ("acervodejogos", "bardomago"),
    "Bodogami": ("acervodejogos", "bodogami"),
    "Comdado Bar": ("acervodejogos", "comdado"),
    "La Tabuleria": ("acervodejogos", "latabuleria"),
    "Luderia Carioca": ("acervodejogos", "luderiacarioca"),
    "Ludoteca BGC": ("acervodejogos", "ludoteca"),
    "Place Games Jogos de Tabuleiro": ("acervodejogos", "placegames"),
    "Shelf bar": ("acervodejogos", "shelf"),
    "TabuClub": ("acervodejogos", "tabuclub"),
    "Toca do Rato - Pizzaria e Jogos de Tabuleiro": ("acervodejogos", "tocadorato"),
    "Ludoteca SideQuest": ("rejoy", "sidequest"),
    "Arena BG": ("ludopedia", "arenabg"),
    "Castelos Bar & Boardgames": ("ludopedia", "castelos"),
    "Chef on Play": ("ludopedia", "chefonplay"),
    "Covil Game Bar": ("covil", ""),
}
CAMPOS = ["estabelecimento", "fonte", "url_fonte", "posicao", "jogo", "data_coleta"]


def baixa(url, destino):
    if destino.exists():
        return destino.read_text(encoding="utf-8")
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=30, context=CTX) as r:
        texto = r.read().decode("utf-8", "replace")
    destino.parent.mkdir(parents=True, exist_ok=True)
    destino.write_text(texto, encoding="utf-8")
    time.sleep(0.5)
    return texto


def limpa(nome):
    return re.sub(r"\s+", " ", html.unescape(nome)).strip()


def acervodejogos(sub):
    base = f"https://{sub}.acervodejogos.com.br/boardgames?sort=mais_alugados"
    jogos, pagina = [], 1
    while True:
        texto = baixa(f"{base}&page={pagina}", RAW / sub / f"p{pagina:02d}.html")
        jogos += [limpa(n) for n in re.findall(r'line-clamp-2[^"]*" href="/boardgames/[^"]+">([^<]+)</a>', texto)]
        if f"page={pagina + 1}&amp;sort=mais_alugados" not in texto:
            return base, jogos
        pagina += 1


def nuxt(texto):
    """Desserializa o __NUXT_DATA__ (lista de valores com referências por índice)."""
    d = json.loads(re.search(r'id="__NUXT_DATA__"[^>]*>(.*?)</script>', texto, re.S).group(1))

    def r(i):
        v = d[i]
        if isinstance(v, list) and v and isinstance(v[0], str):
            # Tipos especiais do devalue: Reactive/Ref apontam para o valor; Date, Set etc. não interessam aqui
            return r(v[1]) if v[0] in ("ShallowReactive", "Reactive", "Ref", "ShallowRef") else None
        if isinstance(v, dict):
            return {k: r(x) for k, x in v.items()}
        if isinstance(v, list):
            return [r(x) for x in v]
        return v
    raiz = r(0)
    return raiz["data"]


def rejoy(sub):
    base = f"https://{sub}.rejoy.com.br/search"
    jogos, pagina = [], 1
    while True:
        dados = nuxt(baixa(f"{base}?page={pagina}", RAW / sub / f"p{pagina:02d}.html"))
        bloco = next(v for k, v in dados.items() if k.startswith("boardgames"))
        jogos += [limpa(j["name"]) for j in bloco["data"]]
        if pagina >= bloco["meta"]["last_page"]:
            return base, jogos
        pagina += 1


def ludopedia(chave):
    arq = RAW / f"ludopedia_{chave}.txt"
    linhas = arq.read_text(encoding="utf-8").splitlines()
    return linhas[0], [limpa(x) for x in linhas[1:] if x.strip()]


def covil():
    with open(COVIL, encoding="utf-8") as f:
        return str(COVIL.relative_to(ROOT)), [limpa(x["jogo"]) for x in csv.DictReader(f, delimiter=";")]


def main():
    data = time.strftime("%Y-%m-%d")
    saida = []
    for est, (fonte, ident) in FONTES.items():
        if fonte == "acervodejogos":
            url, jogos = acervodejogos(ident)
        elif fonte == "rejoy":
            url, jogos = rejoy(ident)
        elif fonte == "ludopedia":
            url, jogos = ludopedia(ident)
        else:
            url, jogos = covil()
        vistos = set()
        for j in jogos:
            if j.casefold() in vistos:
                continue
            vistos.add(j.casefold())
            saida.append({"estabelecimento": est, "fonte": fonte, "url_fonte": url,
                          "posicao": len(vistos), "jogo": j, "data_coleta": data})
        print(f"{est}: {len(vistos)} títulos ({len(jogos)} na listagem)", file=sys.stderr)
    SAIDA.parent.mkdir(parents=True, exist_ok=True)
    with open(SAIDA, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=CAMPOS)
        w.writeheader()
        w.writerows(saida)
    print(f"{len(saida)} linhas -> {SAIDA}")


if __name__ == "__main__":
    main()
