"""
Bloco B1 - dados da Ludopedia para o banco de jogos (API oficial).

Pedido do autor em 13/10/2026: jogadores mínimo e máximo, idade mínima,
duração, mecânicas e nota de cada jogo do banco. O B5 arquivado tem detalhes
de 1.000 jogos e nota de 2.500; o resto vem da API (token
LUDOPEDIA_ACCESS_TOKEN no .env, o mesmo do B5).

Etapas (regras de identificação em jogos_comum.py):
1. Busca (/api/v1/jogos?search=) dos títulos de grupos em 3 ou mais casas que
   não casam com slug nem com nome do B5. Margem de uma casa: a busca pode
   juntar grafias e levar o grupo a 4 casas.
2. Detalhe (/api/v1/jogos/{id}) dos jogos em 4 ou mais casas sem detalhe no B5.
A nota média não vem na API; fica a do ranking do B5 (2.500 jogos).

Ritmo: 1,5 s entre chamadas; em 429, espera 60 s e tenta de novo. Uma rajada
em 13/10/2026 levou a bloqueio temporário da API e do site.
Cache: _data/raw/[B1].../acervos_jogos/ludopedia_api_busca.json e
ludopedia_api_jogos.json (consulta já feita não volta à API).
"""
import json
import os
import re
import sys
import time

import requests
from dotenv import load_dotenv

import jogos_comum as J

API = "https://ludopedia.com.br/api/v1"
UA = ("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36")


def main():
    load_dotenv(J.ROOT / ".env")
    sessao = requests.Session()
    sessao.headers.update({"Authorization": f"Bearer {os.environ['LUDOPEDIA_ACCESS_TOKEN']}", "User-Agent": UA})

    def get(caminho, params=None):
        while True:
            r = sessao.get(f"{API}/{caminho}", params=params, timeout=30)
            if r.status_code == 429:
                print("429; esperando 60 s", file=sys.stderr, flush=True)
                time.sleep(60)
                continue
            r.raise_for_status()
            time.sleep(1.5)
            return r.json()

    busca = J.le_json(J.API_BUSCA)
    pendentes = [g["titulos"].most_common(1)[0][0] for (tipo, _), g in J.grupos(3).items() if tipo == "chave"]
    pendentes = [t for t in pendentes if t not in busca]
    print(f"busca: {len(pendentes)} títulos", file=sys.stderr, flush=True)
    for i, t in enumerate(pendentes, 1):
        q = re.sub(r"[?#*!]", " ", t).strip()
        busca[t] = get("jogos", {"search": q, "rows": 10}).get("jogos", [])
        if not busca[t] and ":" in q:
            busca[t] = get("jogos", {"search": q.split(":")[0], "rows": 10}).get("jogos", [])
        if i % 20 == 0:
            J.API_BUSCA.write_text(json.dumps(busca, ensure_ascii=False), encoding="utf-8")
    J.API_BUSCA.write_text(json.dumps(busca, ensure_ascii=False), encoding="utf-8")

    _, _, id_por_slug, detalhes, _ = J.ludopedia()
    jogos = J.le_json(J.API_JOGOS)
    for b in busca.values():
        for j in b:
            id_por_slug.setdefault(j["link"].split("jogo/")[1], j["id_jogo"])
    faltam = [s for (tipo, s), _ in J.grupos(4).items() if tipo == "slug" and s not in detalhes and s in id_por_slug]
    print(f"detalhes: {len(faltam)} jogos", file=sys.stderr, flush=True)
    for i, s in enumerate(faltam, 1):
        jogos[s] = get(f"jogos/{id_por_slug[s]}")
        if i % 20 == 0:
            J.API_JOGOS.write_text(json.dumps(jogos, ensure_ascii=False), encoding="utf-8")
            print(f"  {i}/{len(faltam)}", file=sys.stderr, flush=True)
    J.API_JOGOS.write_text(json.dumps(jogos, ensure_ascii=False), encoding="utf-8")
    print(f"{len(busca)} buscas e {len(jogos)} detalhes em cache")


if __name__ == "__main__":
    main()
