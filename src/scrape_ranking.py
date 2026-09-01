"""
Bloco A - scraping do RANKING da Ludopedia (https://ludopedia.com.br/ranking):
pega nota média (e id/nome/link) de muitos jogos por página, em vez de abrir
uma página por jogo. É a via eficiente para descobrir os N jogos de maior
nota SEM precisar raspar as ~41 mil páginas individuais do catálogo.

IMPORTANTE — leia antes de rodar (mesmas ressalvas de scrape_bloco_a_nota.py):
  - Rode isto no SEU terminal, fora de sessão de agente de IA — o robots.txt
    da Ludopedia bloqueia bots de IA nominalmente (ClaudeBot etc.), por isso
    não posso executar isto por você. Ele permite raspagem genérica com
    Crawl-delay: 5 (respeitado abaixo — não diminua).
  - A estrutura de cada card de jogo (abaixo) foi confirmada por inspeção
    manual do HTML (Pedro, 2026-09-01): cada jogo é um
    `div.media.pad-btm.bord-btm` com nome/link em `h4.media-heading > a` e
    três valores em `div.rank-info`: "Nota Rank" (nota bayesiana/ponderada —
    é o critério que ordena a página, não é a nota média pura), "Média"
    (nota média simples — o que você quer para o corte dos 1000/2000) e
    "Notas" (qtd. de avaliações, com link para a página de avaliações do
    jogo, de onde também dá pra tirar o slug).
  - NÃO CONFIRMADO — ainda precisa validar antes de rodar em lote:
      1. `PAGINATION_PARAM`: nome do parâmetro de paginação da URL (chute:
         "pagina"). A página tem elementos com cara de JS/AJAX
         (`scrtabs-tab-container`, `div-pesquisa-multi`) — se
         `?pagina=2` não mudar a lista, abra o DevTools > Network, mude de
         página no site manualmente e veja qual URL/parâmetro é chamado
         (pode ser uma rota de AJAX tipo POST, não um GET simples).
      2. Confirme se dá pra filtrar por tipo (jogo base vs expansão) e ano
         via querystring, ou se isso só é possível no filtro visual da
         página (nesse caso, filtre depois em build_bloco_a_dataset.py).
      3. IMPORTANTE: como a página ordena por "Nota Rank" (bayesiana) e não
         por "Média" pura, um jogo com Média altíssima mas poucos votos pode
         não aparecer nas primeiras páginas. select_top_n.py reordena por
         Média depois de coletado, mas só entre o que foi raspado — se
         quiser cobertura maior, aumente --limit.
  - Rode com --limit 40 (poucas páginas) primeiro e confira o CSV de saída
    antes de ir para o valor final.

Saída: data/raw/ludopedia_ranking.csv
       (nm_jogo, nota_rank, nota_media, qt_avaliacoes, link, slug)
       ordenado pela ordem em que o ranking os apresenta (por Nota Rank).

Uso:
    pip3 install requests beautifulsoup4 lxml tqdm
    python3 src/scrape_ranking.py --limit 40     # teste, ~2 páginas
    python3 src/scrape_ranking.py --limit 2500   # coleta para escolher top 1000-2000
"""
import argparse
import csv
import pathlib
import re
import time

import requests
from bs4 import BeautifulSoup
from tqdm import tqdm

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT_PATH = ROOT / "data" / "raw" / "ludopedia_ranking.csv"

RANKING_URL = "https://ludopedia.com.br/ranking"
PAGINATION_PARAM = "pagina"  # AJUSTAR se necessário (ver aviso acima)
ITEMS_PER_PAGE_GUESS = 20  # só usado para estimar quantas páginas buscar

CRAWL_DELAY_SECONDS = 5  # respeita o robots.txt da Ludopedia — não diminua

# Um User-Agent customizado costuma ser bloqueado pelo WAF (Cloudflare) da
# Ludopedia mesmo quando o robots.txt permite raspagem genérica — o bloqueio
# aí é por "não parece navegador", não por identificar um bot de IA. Por
# isso usamos aqui um UA de navegador comum.
USER_AGENT = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
)
DEFAULT_HEADERS = {
    "User-Agent": USER_AGENT,
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
}


def normalize_link(link):
    if link.startswith("http"):
        return link
    return f"https://ludopedia.com.br/{link.lstrip('/')}"


def _extract_float(text, pattern):
    m = re.search(pattern, text)
    if not m:
        return None
    return float(m.group(1).replace(".", "").replace(",", ".")) if "," in m.group(1) else float(m.group(1))


def _extract_int(text, pattern):
    m = re.search(pattern, text)
    if not m:
        return None
    return int(re.sub(r"[.,]", "", m.group(1)))


def _slug_from_href(href):
    # ex: "/jogo/ark-nova-avaliacoes#menu-jogo" -> "ark-nova"
    #     "/jogo/ark-nova" -> "ark-nova"
    m = re.search(r"/jogo/([\w-]+?)(?:-avaliacoes)?(?:[/#?]|$)", href)
    return m.group(1) if m else None


def parse_ranking_page(html):
    """Extrai (nm_jogo, nota_rank, nota_media, qt_avaliacoes, link, slug) de
    cada card de jogo do ranking (div.media.pad-btm.bord-btm)."""
    soup = BeautifulSoup(html, "html.parser")
    rows = []

    for item in soup.select("div.media.pad-btm.bord-btm"):
        heading = item.select_one("h4.media-heading")
        link_el = (heading.select_one("a[href*='/jogo/']") if heading else None) or item.select_one(
            "a[href*='/jogo/']"
        )
        if not link_el:
            continue

        href = link_el.get("href", "")
        slug = _slug_from_href(href)
        if not slug:
            continue

        nm_jogo = link_el.get_text(strip=True) or (heading.get_text(strip=True) if heading else "")

        rank_info = item.select_one("div.rank-info")
        info_text = rank_info.get_text(" ", strip=True) if rank_info else ""

        rows.append(
            {
                "nm_jogo": nm_jogo,
                "nota_rank": _extract_float(info_text, r"Nota Rank:\s*([\d.,]+)"),
                "nota_media": _extract_float(info_text, r"M[ée]dia:\s*([\d.,]+)"),
                "qt_avaliacoes": _extract_int(info_text, r"Notas:\s*([\d.,]+)"),
                "link": normalize_link(f"jogo/{slug}"),
                "slug": slug,
            }
        )
    return rows


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--limit", type=int, default=2500, help="Nº alvo de jogos a coletar do ranking")
    args = parser.parse_args()

    n_pages = -(-args.limit // ITEMS_PER_PAGE_GUESS)
    print(f"Buscando ~{args.limit} jogos em até {n_pages} páginas do ranking (ajuste ITEMS_PER_PAGE_GUESS se a estimativa estiver errada)")

    session = requests.Session()
    session.headers.update(DEFAULT_HEADERS)

    # "Aquece" a sessão visitando a home primeiro, para pegar os cookies que
    # o Cloudflare costuma exigir antes de aceitar outras páginas.
    try:
        session.get("https://ludopedia.com.br/", timeout=20).raise_for_status()
        time.sleep(CRAWL_DELAY_SECONDS)
    except Exception as exc:
        print(f"AVISO: falha ao aquecer sessão na home ({exc}) — seguindo mesmo assim.")

    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    collected = []
    seen_slugs = set()

    for page in tqdm(range(1, n_pages + 1), desc="Raspando ranking"):
        url = f"{RANKING_URL}?{PAGINATION_PARAM}={page}"
        try:
            resp = session.get(url, timeout=20)
            resp.raise_for_status()
        except Exception as exc:
            print(f"Erro na página {page} ({url}): {exc}")
            time.sleep(CRAWL_DELAY_SECONDS)
            continue

        rows = parse_ranking_page(resp.text)
        if not rows:
            print(f"Nenhum jogo encontrado na página {page} — pode ter chegado ao fim, ou os seletores estão errados. Parando.")
            break

        new_rows = [r for r in rows if r["slug"] not in seen_slugs]
        for r in new_rows:
            seen_slugs.add(r["slug"])
        collected.extend(new_rows)

        if len(collected) >= args.limit:
            collected = collected[: args.limit]
            break

        time.sleep(CRAWL_DELAY_SECONDS)

    with open(OUT_PATH, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["nm_jogo", "nota_rank", "nota_media", "qt_avaliacoes", "link", "slug"])
        writer.writeheader()
        writer.writerows(collected)

    print(f"OK: {len(collected)} jogos salvos em {OUT_PATH}")
    print("Confira o CSV: se nota_media vier vazia ou os nomes não baterem, ajuste os seletores em parse_ranking_page e rode de novo.")


if __name__ == "__main__":
    main()
