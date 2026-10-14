"""
Bloco B1 - lojas da plataforma Acervo de Jogos (acervodejogos.com.br).

A plataforma intermedeia o aluguel de jogos de tabuleiro. Cada loja tem um
subdomínio (<loja>.acervodejogos.com.br) com acervo, endereço, WhatsApp e,
às vezes, Instagram e site. A lista de lojas (/companies) achou casas que a
busca do Google Places não alcançou (ex.: Bardo Mago e JogArt Club, em Belo
Horizonte). Pedido do autor em 12/10/2026.

Entrada: https://www.acervodejogos.com.br/companies e a página inicial de
cada loja (HTML guardado em dados/[B1].../dados-brutos/acervodejogos/, que serve de
cache: página já baixada não é baixada de novo).
Saída: dados/[B1] Estabelecimentos e cardapios/acervo_jogos/
B1_acervodejogos_lojas.csv, uma linha por loja (todas as lojas da
plataforma), com a situação do município no recorte (recorte_rm.py).

Município e UF: primeiro o que a lista mostra ("Cidade · UF"); se faltar, o
endereço estruturado da página da loja (JSON-LD LocalBusiness); se faltar,
o texto do endereço. Loja sem município legível fica com situação
"sem_municipio_no_endereco" e é resolvida pelo endereço do Google no script
collect_B1_acervodejogos_places.py.
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
sys.path.insert(0, str(ROOT / "_src" / "[B1] Google Places (estabelecimentos)"))
import recorte_rm as R  # noqa: E402

RAW = ROOT / "dados" / "[B1] Estabelecimentos e cardapios" / "dados-brutos" / "acervodejogos"
SAIDA = ROOT / "dados" / "[B1] Estabelecimentos e cardapios" / "acervo_jogos" / "B1_acervodejogos_lojas.csv"
URL_LISTA = "https://www.acervodejogos.com.br/companies"
CTX = ssl.create_default_context(cafile=certifi.where())
UA = {"User-Agent": "Mozilla/5.0"}

# As 14 capitais classificadas como metrópole pela REGIC 2018 (Metrópoles.md).
METROPOLES = {
    "São Paulo", "Brasília", "Rio de Janeiro", "Belém", "Belo Horizonte", "Curitiba",
    "Florianópolis", "Fortaleza", "Goiânia", "Porto Alegre", "Recife", "Salvador",
    "Vitória", "Manaus",
}

CAMPOS = [
    "subdominio", "nome", "acervo", "titulos", "whatsapp", "municipio", "uf",
    "fonte_municipio", "capital_referencia", "situacao", "metropole_regic",
    "endereco", "lat", "lon", "telefone", "email", "instagram", "outros_links",
    "cnpj", "erro", "data_coleta",
]


def baixa(url, destino):
    if destino.exists():
        return destino.read_text(encoding="utf-8")
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=30, context=CTX) as r:
        texto = r.read().decode("utf-8", "replace")
    destino.write_text(texto, encoding="utf-8")
    time.sleep(0.5)
    return texto


def lista_lojas(texto):
    """Itens <li> da página /companies: nome, subdomínio, cidade, UF, títulos e WhatsApp."""
    lojas = []
    for item in re.findall(r'<li data-list-filter-target="item".*?</li>', texto, re.S):
        item = re.sub(r"\s+", " ", item)
        a = re.search(r'href="(https://([^."]+)\.acervodejogos\.com\.br)">(.*?)</a>', item)
        loc = re.search(r'text-slate-500">([^<]*?) · ([A-Z]{2})\s*</span>', item)
        n = re.search(r'font-extrabold text-slate-900">([\d\.]+)</span>', item)
        w = re.search(r'href="(https://wa\.me/[^"]+)"', item)
        nome = html.unescape(re.sub(r"<[^>]+>", "", a.group(3))).strip()
        lojas.append({
            "subdominio": a.group(2), "nome": nome, "acervo": a.group(1),
            "titulos": n.group(1).replace(".", "") if n else "",
            "whatsapp": w.group(1) if w else "",
            "municipio": html.unescape(loc.group(1)).strip() if loc else "",
            "uf": loc.group(2) if loc else "",
        })
    return lojas


def detalhe_loja(texto):
    """JSON-LD LocalBusiness, links externos e CNPJ da página inicial da loja."""
    ld = {}
    for bloco in re.findall(r'application/ld\+json">(.*?)</script>', texto, re.S):
        try:
            d = json.loads(bloco)
        except json.JSONDecodeError:
            continue
        if d.get("@type") == "LocalBusiness":
            ld = d
    end = ld.get("address") or {}
    geo = ld.get("geo") or {}
    corpo = texto[texto.find("<body"):]
    externos = sorted({
        u for u in re.findall(r'href="(https?://[^"]+)"', corpo)
        if not re.search(r"acervodejogos|wa\.me|api\.whatsapp|esm\.sh", u)
    })
    cnpj = re.search(r"CNPJ\s*([\d\./-]{14,20})", re.sub(r"<[^>]+>", " ", corpo))
    return {
        "endereco": html.unescape(end.get("streetAddress") or "").strip(),
        "cidade_ld": (end.get("addressLocality") or "").strip(),
        "uf_ld": (end.get("addressRegion") or "").strip(),
        "lat": geo.get("latitude", ""), "lon": geo.get("longitude", ""),
        "telefone": ld.get("telephone", ""), "email": ld.get("email", ""),
        "instagram": " ".join(u for u in externos if "instagram.com" in u),
        "outros_links": " ".join(u for u in externos if "instagram.com" not in u),
        "cnpj": cnpj.group(1) if cnpj else "",
    }


def main():
    (RAW / "lojas").mkdir(parents=True, exist_ok=True)
    SAIDA.parent.mkdir(parents=True, exist_ok=True)
    data = time.strftime("%Y-%m-%d")
    lojas = lista_lojas(baixa(URL_LISTA, RAW / "companies.html"))
    saida = []
    for loja in lojas:
        linha = {**loja, "erro": "", "data_coleta": data}
        try:
            det = detalhe_loja(baixa(loja["acervo"], RAW / "lojas" / f"{loja['subdominio']}.html"))
        except Exception as e:  # noqa: BLE001 - registra e segue
            det = {}
            linha["erro"] = str(e)[:200]
        cidade_ld, uf_ld = det.pop("cidade_ld", ""), det.pop("uf_ld", "")
        linha.update(det)
        if "," in linha["municipio"]:
            # A lista agrupa algumas lojas por região ("São Paulo, Santo André, ... e Diadema"):
            # vale a cidade do endereço da loja; sem ela, a primeira cidade da região (todas são da RM de São Paulo).
            # O JSON-LD dessas lojas repete a região, por isso não serve aqui.
            mun, uf = R.municipio_uf(linha.get("endereco", ""))
            if mun and "," not in mun:
                linha["municipio"], linha["uf"], linha["fonte_municipio"] = mun, uf, "endereco"
            else:
                linha["municipio"], linha["fonte_municipio"] = linha["municipio"].split(",")[0].strip(), "lista_regiao"
        elif linha["municipio"] and linha["uf"]:
            linha["fonte_municipio"] = "lista"
        elif cidade_ld and uf_ld:
            linha["municipio"], linha["uf"], linha["fonte_municipio"] = cidade_ld, uf_ld, "json_ld"
        else:
            mun, uf = R.municipio_uf(linha.get("endereco", ""))
            linha["municipio"], linha["uf"] = mun, uf
            linha["fonte_municipio"] = "endereco" if mun else ""
        c = R.classifica(f"X, {linha['municipio']} - {linha['uf']}, 00000-000, Brazil")
        linha["capital_referencia"] = c["capital_referencia"]
        linha["situacao"] = c["situacao"] if linha["municipio"] else "sem_municipio_no_endereco"
        linha["metropole_regic"] = "sim" if c["capital_referencia"] in METROPOLES else "não"
        saida.append(linha)
    with open(SAIDA, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=CAMPOS, extrasaction="ignore")
        w.writeheader()
        w.writerows(saida)
    no_recorte = [x for x in saida if x["situacao"] in R.SITUACOES_NO_RECORTE and x["metropole_regic"] == "sim"]
    sem_mun = [x for x in saida if x["situacao"] == "sem_municipio_no_endereco"]
    print(f"{len(saida)} lojas; {len(no_recorte)} em metrópole REGIC (capital ou RM); "
          f"{len(sem_mun)} sem município; {sum(1 for x in saida if x['erro'])} com erro -> {SAIDA}")


if __name__ == "__main__":
    main()
