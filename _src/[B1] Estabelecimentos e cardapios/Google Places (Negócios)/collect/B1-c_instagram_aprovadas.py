"""
Bloco B1 - localiza o perfil do Instagram de cada luderia aprovada na triagem.

Ordem de busca, da fonte mais direta para a menos:
  1. coluna instagram_usuario da planilha de aprovadas (Google Places);
  2. site_ou_rede_social já é um link do Instagram;
  3. links para instagram.com no HTML do site do estabelecimento (página
     inicial). Quando há mais de um perfil citado, fica o mais frequente e os
     demais vão para a coluna "candidatos";
  4. MANUAL: perfis achados à mão (busca no Instagram/Google), com a URL que
     comprova o vínculo. Só entram aqui depois de conferidos.
Sem perfil achado, a linha fica com instagram_usuario vazio e fonte "não achado".

Entrada: estabelecimentos/3_triagem/B1_aprovadas_metro_av100.xlsx
         (B1-b_triagem_manual.py)
Saída em dados/[B1] Estabelecimentos e cardapios/:
  estabelecimentos/3_triagem/B1_instagram_aprovadas.csv (uma linha por place_id aprovado)

Uso:
    python3 "_src/[B1] Estabelecimentos e cardapios/Google Places (Negócios)/collect/B1-c_instagram_aprovadas.py"
"""
# Caminhos: _src/extras/ (log comum) e outros/ do objeto (auxiliares); log em ../logs/
import sys
from pathlib import Path
_AQUI = Path(__file__).resolve()
sys.path[:0] = [str(_AQUI.parents[3] / "extras"), str(_AQUI.parents[1] / "outros")]
from log_execucao import registrar_execucao  # noqa: E402
if __name__ == "__main__":
    registrar_execucao(__file__)

import collections
import datetime
import pathlib
import re
import time

import pandas as pd
import requests

ROOT = pathlib.Path(__file__).resolve().parents[4]
PROCESSED = ROOT / "dados" / "[B1] Estabelecimentos e cardapios"
ENTRADA = PROCESSED / "estabelecimentos/3_triagem/B1_aprovadas_metro_av100.xlsx"
SAIDA = PROCESSED / "estabelecimentos/3_triagem/B1_instagram_aprovadas.csv"

CABECALHOS = {"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
                            "(KHTML, like Gecko) Chrome/126.0 Safari/537.36"}
# Caminhos do instagram.com que não são perfis.
RESERVADOS = {"p", "reel", "reels", "explore", "accounts", "stories", "tv", "direct", "about",
              "legal", "developer", "web", "share", "sharer", "intent", "instagram", "v"}
# O lookbehind evita cdninstagram.com (imagens), que não é perfil.
RE_INSTA = re.compile(r"(?<![a-z0-9-])instagram\.com/(?:#!/)?@?([A-Za-z0-9._]{1,30})", re.I)

# place_id -> (usuário, URL que comprova o vínculo). Preencher só com perfil conferido.
# Conferência em 12/10/2026: nome exibido no perfil (og:title) bate com o estabelecimento.
# Sites que recusam o requests (HTTP 403/500) ou montam os links por JavaScript foram
# abertos no navegador; os demais vieram de busca no Bing por "instagram <nome> <cidade>".
BUSCA = "https://www.bing.com/search?q=instagram+"
MANUAL = {
    # link no site, lido no navegador
    "ChIJE43rt29ZzpQRnvADt6pXfto": ("omniverselivraria", "https://www.omniverse.com.br/"),
    "ChIJ7_r9xnMZuAARN1VAw1KnCcI": ("machadogames", "https://www.machadogames.com.br/"),
    "ChIJn7uU0RNbzpQRI4GI9KHOo_s": ("jogasampa", "https://www.jogasampa.com.br/"),
    "ChIJN8BZeb85WpMRgVKT05caxB4": ("utopiagamesbr", "https://loja.utopiagames.com.br/"),
    # busca + perfil conferido
    "ChIJ7_DDAlH1zpQRJVJ0UHnItH8": ("covilgb", BUSCA + "%22Covil+Game+Bar%22+Guarulhos"),
    "ChIJc3F7ka83J5URQZ1XTl-_iak": ("chefonplay", BUSCA + "%22Chef+on+Play%22+Florian%C3%B3polis"),
    "ChIJJz8-gcY3J5URYdZrEXdHaAk": ("cineplay_sc", BUSCA + "Cineplay+restaurante+jogos+Florian%C3%B3polis"),
    "ChIJY_lqHVLl3JQRvDHacOMDKuc": ("boardzgamepub", BUSCA + "%22BoardZ%22+game+pub+Curitiba"),
    "ChIJ1wjBJD7k3JQRQi7trfp_0aQ": ("vilacelta", BUSCA + "%22Vila+Celta%22+hobby+Curitiba"),
    "ChIJbZRHQPRfzpQRz97-ZOg0yXA": ("castelosbareboardgames", BUSCA + "%22Castelos+Bar%22+boardgames+Tatuap%C3%A9"),
    "ChIJx5jr3zGXpgARQGx9eX7TDmY": ("ludocafebh", BUSCA + "LudoCaf%C3%A9+Belo+Horizonte+jogos+de+tabuleiro"),
    "ChIJsUAT-dObpgARCT2C5QpnVKU": ("garagemdonerd", BUSCA + "%22Garagem+do+Nerd%22+Belo+Horizonte"),
    "ChIJrT_EWwBZzpQRGAZzptZbtsY": ("cartolaluderia", BUSCA + "%22Cartola%22+luderia+bar+S%C3%A3o+Paulo"),
    "ChIJRUjwU66WoGgRzc9yJU7jkwM": ("nalaland.jogos", BUSCA + "%22Nala+Land%22+Recife+jogos"),
    "ChIJawIVeV0JM0oR5BtnD_poQeA": ("ccg_floripa", BUSCA + "%22CCG+Floripa%22"),
    "ChIJpzB8zc2XpgARoJTUu90J6Pw": ("comdadobar", BUSCA + "%22Comdado%22+bar+jogos+Belo+Horizonte"),
    "ChIJfyav9YI9uAARjwbBqcRm2_k": ("cafegeekvv", BUSCA + "%22Caf%C3%A9+Geek%22+ludoteca+Vit%C3%B3ria"),
}


def usuario_de_url(url):
    m = RE_INSTA.search(str(url or ""))
    if m and m.group(1).lower() not in RESERVADOS:
        return m.group(1).lower().rstrip(".")
    return ""


def perfis_no_site(url):
    """Usuários do Instagram citados no HTML do site, por frequência."""
    # Uma segunda tentativa cobre quedas passageiras (timeout de conexão).
    for tentativa in range(2):
        try:
            r = requests.get(url, headers=CABECALHOS, timeout=20)
            break
        except (requests.ConnectionError, requests.Timeout):
            if tentativa:
                raise
            time.sleep(5)
    r.raise_for_status()
    achados = [m.lower().rstrip(".") for m in RE_INSTA.findall(r.text)]
    return collections.Counter(u for u in achados if u not in RESERVADOS)


def main():
    aprovadas = pd.read_excel(ENTRADA)
    hoje = datetime.date.today().isoformat()
    linhas = []
    for _, a in aprovadas.iterrows():
        site = a["site_ou_rede_social"] if pd.notna(a["site_ou_rede_social"]) else ""
        linha = {"place_id": a["place_id"], "nome": a["nome"], "capital_endereco": a["capital_endereco"],
                 "site_ou_rede_social": site, "instagram_usuario": "", "fonte": "não achado",
                 "url_fonte": "", "candidatos": "", "erro": "", "data_coleta": hoje}
        if pd.notna(a["instagram_usuario"]) and str(a["instagram_usuario"]).strip():
            linha.update(instagram_usuario=str(a["instagram_usuario"]).strip().lstrip("@").lower(),
                         fonte="Google Places (planilha de aprovadas)")
        elif usuario_de_url(site):
            linha.update(instagram_usuario=usuario_de_url(site), fonte="site_ou_rede_social", url_fonte=site)
        elif site and "facebook.com" not in site:
            try:
                cont = perfis_no_site(site)
                if cont:
                    (topo, _), *resto = cont.most_common()
                    linha.update(instagram_usuario=topo, fonte="link no site", url_fonte=site,
                                 candidatos=", ".join(u for u, _ in resto))
            except requests.RequestException as e:
                linha["erro"] = type(e).__name__
            time.sleep(1)
        if not linha["instagram_usuario"] and a["place_id"] in MANUAL:
            usuario, prova = MANUAL[a["place_id"]]
            linha.update(instagram_usuario=usuario, fonte="manual", url_fonte=prova)
        linhas.append(linha)
        print(f"{linha['nome'][:40]:40} {linha['instagram_usuario'] or '-':25} {linha['fonte']} {linha['erro']}")

    saida = pd.DataFrame(linhas)
    saida.to_csv(SAIDA, index=False, encoding="utf-8-sig", sep=";")
    # Contagem por fonte: cada place_id em uma única fonte; a soma fecha com o total.
    por_fonte = saida["fonte"].value_counts()
    assert por_fonte.sum() == len(aprovadas)
    print(por_fonte.to_string(), f"\ntotal {len(aprovadas)}", f"\n-> {SAIDA.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
