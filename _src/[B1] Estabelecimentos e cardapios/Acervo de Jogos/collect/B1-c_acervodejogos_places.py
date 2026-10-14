"""
Bloco B1 - lojas do Acervo de Jogos no Google Places: volume de avaliações,
tipo do negócio e endereço do Google.

Entrada: B1_acervodejogos_lojas.csv (B1-c_acervodejogos.py). Entram as
lojas em metrópole REGIC (capital ou RM) e as sem município legível.
Chamada: uma Text Search (Places API New) por loja, "<nome> <município> <UF>",
com viés de localização quando a loja publica coordenadas. A máscara pede
userRatingCount e types, o que cobra o SKU Text Search Enterprise (franquia
mensal de 1.000 chamadas).
Escolha do resultado: entre os 3 primeiros, o de nome mais parecido com o da
loja (razão de similaridade sobre o nome normalizado). Similaridade abaixo de
0,5 fica marcada "conferir", porque pode ser outra casa.
Saída: acervo_jogos/B1_acervodejogos_places.csv, uma linha por loja
consultada, e resposta bruta em dados/[B1].../_dados-brutos/acervodejogos/places.jsonl.
Cache: loja que já tem resposta no places.jsonl não é consultada de novo (a
API cobra por chamada); para atualizar, apagar o arquivo.
Colunas de cruzamento com a população: ja_na_curadoria (place_id está em
B1_planilha_curadoria_metropoles_filtrada_mais_100_avaliacoes.csv) e
ja_aprovada (place_id está nas 51 aprovadas).
"""
# Caminhos: _src/extras/ (log comum) e outros/ do objeto (auxiliares); log em ../logs/
import sys
from pathlib import Path
_AQUI = Path(__file__).resolve()
sys.path[:0] = [str(_AQUI.parents[3] / "extras"), str(_AQUI.parents[1] / "outros")]
from log_execucao import registrar_execucao  # noqa: E402
if __name__ == "__main__":
    registrar_execucao(__file__)

import csv
import json
import os
import re
import sys
import time
from difflib import SequenceMatcher
from pathlib import Path

import pandas as pd
import requests
from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parents[4]
sys.path.insert(0, str(ROOT / "_src" / "[B1] Estabelecimentos e cardapios" / "Google Places (Negócios)" / "outros"))
import recorte_rm as R  # noqa: E402

load_dotenv(ROOT / ".env")
PROC = ROOT / "dados" / "[B1] Estabelecimentos e cardapios"
ENTRADA = PROC / "acervo_jogos" / "B1_acervodejogos_lojas.csv"
SAIDA = PROC / "acervo_jogos" / "B1_acervodejogos_places.csv"
BRUTO = ROOT / "dados" / "[B1] Estabelecimentos e cardapios" / "_dados-brutos" / "acervodejogos" / "places.jsonl"
CURADORIA = PROC / "B1_planilha_curadoria_metropoles_filtrada_mais_100_avaliacoes.csv"
APROVADAS = PROC / "B1_luderias_aprovadas_metropoles_mais_100_avaliacoes.xlsx"

MASCARA = ",".join("places." + c for c in [
    "id", "displayName", "formattedAddress", "rating", "userRatingCount", "types",
    "primaryType", "websiteUri", "googleMapsUri", "businessStatus",
])
# Tipos do Google que indicam venda de comida ou bebida no local.
TIPOS_AB = re.compile(r"restaurant|cafe|coffee|bar\b|pub|food|bakery|meal|brewery|tea_house|ice_cream|snack|pizza|hamburger|_bar$")


def busca(sessao, chave, loja):
    corpo = {"textQuery": f"{loja['nome']} {loja['municipio']} {loja['uf']}".strip(), "languageCode": "pt-BR",
             "regionCode": "BR", "maxResultCount": 3}
    if loja["lat"] and loja["lon"]:
        corpo["locationBias"] = {"circle": {"center": {"latitude": float(loja["lat"]), "longitude": float(loja["lon"])},
                                            "radius": 5000.0}}
    for tentativa in range(4):
        r = sessao.post("https://places.googleapis.com/v1/places:searchText", json=corpo, timeout=20,
                        headers={"X-Goog-Api-Key": chave, "X-Goog-FieldMask": MASCARA})
        if r.status_code == 200:
            return corpo, r.json().get("places", [])
        time.sleep(2 ** tentativa)
    r.raise_for_status()


def main():
    lojas = [x for x in csv.DictReader(open(ENTRADA, encoding="utf-8"))
             if (x["metropole_regic"] == "sim" and x["situacao"] in R.SITUACOES_NO_RECORTE)
             or x["situacao"] == "sem_municipio_no_endereco"]
    cur = set(pd.read_csv(CURADORIA).place_id)
    apr = set(pd.read_excel(APROVADAS).place_id)
    chave = os.environ["GOOGLE_PLACES_API_KEY"]
    sessao = requests.Session()
    cache = {}
    if BRUTO.exists():
        for linha in open(BRUTO, encoding="utf-8"):
            d = json.loads(linha)
            cache[d["subdominio"]] = d["resultados"]
    saida = []
    with open(BRUTO, "a", encoding="utf-8") as bruto:
        for loja in lojas:
            if loja["subdominio"] in cache:
                resultados = cache[loja["subdominio"]]
            else:
                corpo, resultados = busca(sessao, chave, loja)
                bruto.write(json.dumps({"subdominio": loja["subdominio"], "consulta": corpo, "resultados": resultados},
                                       ensure_ascii=False) + "\n")
                time.sleep(0.2)
            melhor, sim = {}, 0.0
            for p in resultados:
                s = SequenceMatcher(None, re.sub(r"[^a-z0-9]", "", R.chave(loja["nome"])),
                                    re.sub(r"[^a-z0-9]", "", R.chave(p.get("displayName", {}).get("text", "")))).ratio()
                if s > sim:
                    melhor, sim = p, s
            end = melhor.get("formattedAddress", "")
            c = R.classifica(end) if end else {"situacao": "", "capital_referencia": ""}
            tipos = melhor.get("types", [])
            saida.append({
                "subdominio": loja["subdominio"], "nome_acervo": loja["nome"],
                "place_id": melhor.get("id", ""), "nome_google": melhor.get("displayName", {}).get("text", ""),
                "similaridade_nome": round(sim, 2), "conferir": "sim" if sim < 0.5 else "",
                "endereco_google": end, "situacao_google": c["situacao"],
                "capital_google": c["capital_referencia"],
                "volume_avaliacoes": melhor.get("userRatingCount", ""), "avaliacao_media": melhor.get("rating", ""),
                "tipo_principal": melhor.get("primaryType", ""), "tipos_google": " ".join(tipos),
                "tipo_ab_google": "sim" if any(TIPOS_AB.search(t) for t in tipos) else "não",
                "status_google": melhor.get("businessStatus", ""), "site_google": melhor.get("websiteUri", ""),
                "link_google_maps": melhor.get("googleMapsUri", ""),
                "ja_na_curadoria": "sim" if melhor.get("id") in cur else "não",
                "ja_aprovada": "sim" if melhor.get("id") in apr else "não",
                "data_coleta": time.strftime("%Y-%m-%d"),
            })
    with open(SAIDA, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=list(saida[0]))
        w.writeheader()
        w.writerows(saida)
    print(f"{len(saida)} lojas consultadas -> {SAIDA}")


if __name__ == "__main__":
    main()
