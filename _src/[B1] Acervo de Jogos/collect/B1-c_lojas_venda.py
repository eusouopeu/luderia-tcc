"""
Bloco B1 - catálogo de jogos à venda nas lojas online das casas com cardápio.

Pedido do autor em 13/10/2026: preço de venda dos jogos entre as luderias,
só nas lojas das casas com dados de comida no banco "A - Estabelecimentos"
(coluna Loja ou "Venda de jogos" = Sim).

Plataformas:
- Liga (sbrauble/lmcorp: Inside, Flow, Utopia, Asgard, Fortalúdica): a
  listagem por categoria traz nome e código do produto, mas esconde o preço em
  sprites; o preço vem da página do item ("Preço R$ X"). Entram só as
  categorias de jogos de tabuleiro (por editora ou por perfil), escolhidas à
  mão em CATEGORIAS_LIGA. A listagem padrão mostra só itens com estoque.
- Tray (Place Games, TabuLoja): API pública /web_api/products (nome, preço,
  disponibilidade; a listagem pública não traz estoque). Entram só produtos
  com available = 1; vale o preço promocional quando houver.
- Saipos (La Tabuleria): itens da categoria "Jogos de Tabuleiro" já coletados
  em cardapios/B1_cardapios_digitais_itens.csv (B1-c_cardapios_digitais.py).
Sem loja legível: Ludoteca BGC (o site redireciona para o Acervo de Jogos).

Cache: dados/[B1].../dados-brutos/lojas_venda/<loja>/ (HTML da Liga e JSON da Tray).
Saída: acervo_jogos/B1_lojas_venda_produtos.csv, um produto por linha:
estabelecimento, plataforma, produto, preco_rs, url, data_coleta. Acessórios e
TCG entram se estiverem nas categorias escolhidas; o casamento com os jogos
(B1-b_banco_jogos.py) descarta o que não for jogo.
"""
# Caminhos: _src/ (log comum) e outros/ do bloco (auxiliares); log em ../logs/
import sys
from pathlib import Path
_AQUI = Path(__file__).resolve()
sys.path[:0] = [str(_AQUI.parents[2]), str(_AQUI.parents[1] / "outros")]
from log_execucao import registrar_execucao  # noqa: E402
if __name__ == "__main__":
    registrar_execucao(__file__)

import csv
import html
import json
import re
import time
from pathlib import Path

import requests

ROOT = Path(__file__).resolve().parents[3]
RAW = ROOT / "dados" / "[B1] Estabelecimentos e cardapios" / "dados-brutos" / "lojas_venda"
PROC = ROOT / "dados" / "[B1] Estabelecimentos e cardapios"
SAIPOS = PROC / "cardapios" / "B1_cardapios_digitais_itens.csv"
SAIDA = PROC / "acervo_jogos" / "B1_lojas_venda_produtos.csv"
UA = {"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
                    "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"}

# Categorias de jogos de tabuleiro em cada loja da Liga (página ?view=ecom/categorias, 13/10/2026).
CATEGORIAS_LIGA = {
    "Inside Games": ("https://www.insidegamestore.com.br", [146924, 146925, 146926, 146927, 146928, 146929]),
    "Flow Games": ("https://www.flowstore.com.br", [75990]),
    "Utopia Games & Food": ("https://loja.utopiagames.com.br", [275308, 275309, 275306]),
    "Asgard": ("https://www.asgardstore.com.br", [54295, 54294, 54293]),
    "Fortalúdica": ("https://www.fortaludica.com.br", [71615, 242161, 242162, 242163, 242166, 242165, 242167]),
}
TRAY = {
    "Place Games Jogos de Tabuleiro": "https://www.placegames.com.br",
    "TabuClub": "https://www.tabuloja.com",
}
CAMPOS = ["estabelecimento", "plataforma", "produto", "preco_rs", "url", "data_coleta"]


def baixa(url, destino, json_=False):
    if destino.exists():
        texto = destino.read_text(encoding="utf-8")
    else:
        for tentativa in range(1, 5):
            try:
                r = requests.get(url, headers=UA, timeout=40)
                r.raise_for_status()
                break
            except requests.RequestException:
                if tentativa == 4:
                    raise
                time.sleep(3 * tentativa)
        texto = r.text
        destino.parent.mkdir(parents=True, exist_ok=True)
        destino.write_text(texto, encoding="utf-8")
        time.sleep(0.4)
    return json.loads(texto) if json_ else texto


def numero(txt):
    return float(txt.replace(".", "").replace(",", "."))


def liga(est, base, cats):
    pasta = RAW / re.sub(r"\W+", "_", est.lower())
    produtos = {}
    for cat in cats:
        pagina = 1
        while True:
            url = f"{base}/?view=ecom/itens&cat={cat}&txt_limit=100&txt_estoque=0&page={pagina}"
            t = baixa(url, pasta / f"cat{cat}_p{pagina:02d}.html")
            itens = re.findall(r'<div class="title"><a href="\./\?view=ecom/item&prod=(\d+)">([^<]+)</a>', t)
            for prod, nome in itens:
                produtos.setdefault(prod, html.unescape(nome).strip())
            total = re.search(r"de <b>(\d+)</b>", t)
            if not itens or not total or pagina * 100 >= int(total.group(1)):
                break
            pagina += 1
    saida = []
    for prod, nome in produtos.items():
        url = f"{base}/?view=ecom/item&prod={prod}"
        t = baixa(url, pasta / f"item_{prod}.html")
        m = re.search(r"Pre&#231;o.{0,300}?R\$\s*([\d.,]+)", t, re.S)
        if m:
            saida.append({"estabelecimento": est, "plataforma": "liga", "produto": nome,
                          "preco_rs": numero(m.group(1)), "url": url})
    return saida


def tray(est, base):
    pasta = RAW / re.sub(r"\W+", "_", est.lower())
    saida, pagina = [], 1
    while True:
        d = baixa(f"{base}/web_api/products?limit=50&page={pagina}", pasta / f"produtos_p{pagina:03d}.json", json_=True)
        for x in d.get("Products", []):
            p = x["Product"]
            if str(p.get("available")) == "1" and float(p.get("price") or 0) > 0:
                saida.append({"estabelecimento": est, "plataforma": "tray", "produto": html.unescape(p["name"]).strip(),
                              "preco_rs": float(p.get("promotional_price") or 0) or float(p["price"]),
                              "url": p.get("url", {}).get("https", "") if isinstance(p.get("url"), dict) else ""})
        pg = d["paging"]
        if pg["offset"] + pg["limit"] >= pg["total"]:
            return saida
        pagina += 1


def saipos():
    with open(SAIPOS, encoding="utf-8") as f:
        return [{"estabelecimento": x["estabelecimento"], "plataforma": "saipos", "produto": x["item"].strip(),
                 "preco_rs": float(x["preco_rs"]), "url": x["url"]}
                for x in csv.DictReader(f, delimiter=";")
                if x["categoria"].strip() == "Jogos de Tabuleiro" and x["preco_rs"]]


def main():
    data = time.strftime("%Y-%m-%d")
    linhas = []
    for est, (base, cats) in CATEGORIAS_LIGA.items():
        r = liga(est, base, cats)
        print(f"{est}: {len(r)} produtos")
        linhas += r
    for est, base in TRAY.items():
        r = tray(est, base)
        print(f"{est}: {len(r)} produtos")
        linhas += r
    r = saipos()
    print(f"La Tabuleria: {len(r)} produtos")
    linhas += r
    for x in linhas:
        x["data_coleta"] = data
    with open(SAIDA, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=CAMPOS)
        w.writeheader()
        w.writerows(linhas)
    print(f"{len(linhas)} produtos -> {SAIDA}")


if __name__ == "__main__":
    main()
