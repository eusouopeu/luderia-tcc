"""Coleta itens e preços dos cardápios digitais (Saipos e VUCA Food) das luderias achadas pelo Acervo de Jogos.

Saipos: API pública do site de pedidos (delivery-api.saipos.com), a mesma que a página <loja>.saipos.com chama.
        Preço do item = menor preço entre as variações (tamanhos); "a_partir" = sim quando há mais de uma.
VUCA Food: a página /cardapio-digital traz os itens num JSON embutido (campos categoria, nome, descricao, preco).
Os preços do cardápio de delivery podem diferir do salão; a coluna plataforma deixa isso visível.

Saída: dados/[B1] Estabelecimentos e cardapios/cardapios/B1_cardapios_digitais_itens.csv
       (estabelecimento;plataforma;url;categoria;item;descricao;preco_rs;a_partir;data_coleta)
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
import json
import re
import ssl
import urllib.parse
import urllib.request
from datetime import date
from pathlib import Path

import certifi

ROOT = Path(__file__).resolve().parents[3]
SAIDA = ROOT / "dados/[B1] Estabelecimentos e cardapios/cardapios/B1_cardapios_digitais_itens.csv"
CTX = ssl.create_default_context(cafile=certifi.where())
UA = "Mozilla/5.0 (Macintosh) AppleWebKit/537.36 Chrome/120 Safari/537.36"

# (estabelecimento, plataforma, endereço do cardápio): links tirados do linktree de cada casa em 12/10/2026
FONTES = [
    ("La Tabuleria", "saipos", "latabuleria.saipos.com"),
    ("Toca do Rato", "saipos", "tocadoratopizzasejogos.saipos.com"),
    ("Bardo Mago", "vucafood", "https://www.vucafood.com.br/funminds/2219/cardapio-digital"),
]


def get(url, cabecalhos=None):
    req = urllib.request.Request(url, headers={"User-Agent": UA, **(cabecalhos or {})})
    with urllib.request.urlopen(req, timeout=60, context=CTX) as r:
        return r.read().decode("utf-8", "replace")


def saipos(dominio):
    cab = {"Origin": f"https://{dominio}", "Referer": f"https://{dominio}/"}
    filtro = urllib.parse.quote(json.dumps({"domain_name": dominio, "is_table_module": False}))
    loja = json.loads(get(f"https://delivery-api.saipos.com/v1/stores?filter={filtro}", cab))[0]
    dados = urllib.parse.quote(json.dumps({"saleModule": "delivery", "idStoreSiteData": loja["id_store_site_data"]}))
    menu = json.loads(get(f"https://delivery-api.saipos.com/v1/stores/{loja['id_store']}/sales/view-data?data={dados}", cab))
    escolhas = {c["id_store_choice"]: c for c in menu.get("choices", [])}
    for item in menu["items"]:
        precos = [v["price"] for v in item.get("variations", []) if v.get("enabled", "Y") == "Y"]
        if not any(precos):
            # Preço zero no item (ex.: pizza): o valor está nos sabores, escolha obrigatória. Vale o menor sabor.
            precos = [v["aditional_price"]
                      for c in item.get("choices", []) if escolhas.get(c["id_store_choice"], {}).get("min_choices", 0) >= 1
                      for ci in escolhas[c["id_store_choice"]]["choice_items"] if ci.get("enabled", "Y") == "Y"
                      for v in ci.get("variations", []) if v.get("aditional_price")] or precos
        yield {
            "categoria": (item.get("category_item") or {}).get("desc_store_category_item", ""),
            "item": item.get("desc_store_item_delivery") or item["desc_store_item"],
            "descricao": (item.get("detail") or "").strip(),
            "preco_rs": min(precos) if precos else "",
            "a_partir": "sim" if len(set(precos)) > 1 else "",
        }


def vucafood(url):
    html = get(url).replace('\\"', '"')
    padrao = re.compile(r'\{"id":\d+,"categoria":"((?:[^"\\]|\\.)*)","nome":"((?:[^"\\]|\\.)*)",'
                        r'"descricao":"((?:[^"\\]|\\.)*)","preco":([\d.]+)')
    vistos = set()
    for cat, nome, desc, preco in padrao.findall(html):
        if (cat, nome) in vistos:  # o JSON aparece repetido na página
            continue
        vistos.add((cat, nome))
        yield {"categoria": cat, "item": nome, "descricao": desc.replace("\\n", " ").strip(),
               "preco_rs": float(preco), "a_partir": ""}


def main():
    hoje = date.today().isoformat()
    linhas = []
    for nome, plataforma, endereco in FONTES:
        itens = list(saipos(endereco) if plataforma == "saipos" else vucafood(endereco))
        url = f"https://{endereco}/home" if plataforma == "saipos" else endereco
        linhas += [{"estabelecimento": nome, "plataforma": plataforma, "url": url, **i, "data_coleta": hoje} for i in itens]
        print(f"{nome}: {len(itens)} itens")
    with open(SAIDA, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=["estabelecimento", "plataforma", "url", "categoria", "item", "descricao",
                                          "preco_rs", "a_partir", "data_coleta"], delimiter=";")
        w.writeheader()
        w.writerows(linhas)
    print(f"{len(linhas)} itens -> {SAIDA}")


if __name__ == "__main__":
    main()
