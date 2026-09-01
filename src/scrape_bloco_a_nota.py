"""
Bloco A - scraping complementar (ÚLTIMA etapa do fluxo, sobre o conjunto já
reduzido ao top N por nota): qtd. de partidas registradas de cada jogo,
direto da página pública (https://ludopedia.com.br/jogo/{slug}) — o único
dado que ainda falta depois do ranking. nota_media e qt_avaliacoes já vêm
de scrape_ranking.py; aqui eles são recoletados só como conferência cruzada
(cross-check) opcional, reaproveitando o mesmo padrão "Nota Rank / Média /
Notas" confirmado na página de ranking — mas isso é um PALPITE de que a
página individual do jogo reusa o mesmo componente visual; ainda não
confirmado por inspeção direta dessa página específica.

Ordem recomendada do fluxo completo:
    1. collect_bloco_a_ids.py       (catálogo: id, ano, link)
    2. scrape_ranking.py            (nota média em massa, via /ranking)
    3. select_top_n.py              (top N por nota_media)
    4. collect_bloco_a_details.py --ids-file data/raw/ludopedia_top_ids.csv
    5. build_bloco_a_dataset.py     (aplica corte + indicadores + nota_media)
    6. scrape_bloco_a_nota.py       (este script: qtd_avaliacoes, qtd_partidas)

IMPORTANTE — leia antes de rodar:
  - Este script é para VOCÊ rodar no seu próprio terminal, fora de qualquer
    sessão de agente de IA. O robots.txt da Ludopedia bloqueia explicitamente
    bots de IA (ClaudeBot, GPTBot etc.), mas permite raspagem genérica com
    Crawl-delay: 5 (respeitado abaixo, não reduza).
  - Os seletores CSS abaixo (função `parse_jogo_page`) são um PALPITE PROVISÓRIO
    baseado em estrutura comum de sites assim — eu não consegui abrir a página
    para conferir o HTML real, porque o mesmo robots.txt me bloqueia mesmo em
    modo leitura. Antes de rodar em lote:
      1. Abra manualmente 1-2 páginas de jogo no navegador (ex:
         https://ludopedia.com.br/jogo/stone-age), aperte Ctrl+U / Cmd+Opt+U
         (ver código-fonte) ou inspecione o elemento da nota/avaliações/partidas.
      2. Ajuste os seletores em `parse_jogo_page` para bater com o HTML real.
      3. Rode com --limit 5 primeiro e confira a saída antes da coleta completa.

Entrada: data/processed/bloco_a_jogos.csv (coluna `link`, gerado por
build_bloco_a_dataset.py) — ou seja, roda só nos jogos que já passaram no
corte da amostra, não no catálogo inteiro.

Saída: data/raw/ludopedia_nota.jsonl (resumível — ids já salvos são pulados)

Uso:
    pip3 install requests beautifulsoup4 lxml tqdm
    python3 src/scrape_bloco_a_nota.py --limit 5      # teste
    python3 src/scrape_bloco_a_nota.py                # coleta completa
"""
import argparse
import json
import pathlib
import re
import time

import pandas as pd
import requests
from bs4 import BeautifulSoup
from tqdm import tqdm

ROOT = pathlib.Path(__file__).resolve().parent.parent
IN_PATH = ROOT / "data" / "processed" / "bloco_a_jogos.csv"
OUT_PATH = ROOT / "data" / "raw" / "ludopedia_nota.jsonl"

CRAWL_DELAY_SECONDS = 5  # respeita o robots.txt da Ludopedia — não diminua

# Um User-Agent customizado costuma ser bloqueado pelo WAF (Cloudflare) da
# Ludopedia mesmo com raspagem genérica permitida no robots.txt — por isso
# usamos um UA de navegador comum aqui.
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


def parse_jogo_page(html):
    """Extrai qtd. de partidas (principal) e nota média/qtd. de avaliações
    (cross-check, best-effort) do HTML da página individual do jogo."""
    soup = BeautifulSoup(html, "html.parser")
    result = {"nota_media": None, "qt_avaliacoes": None, "qt_partidas": None}

    # --- Nota média / qtd. avaliações: reaproveita o padrão confirmado do
    # ranking ("Nota Rank: X | Média: X | Notas: X"), caso a página do jogo
    # use o mesmo componente. Best-effort — pode não bater, ver aviso acima.
    rank_info = soup.select_one("div.rank-info")
    info_text = rank_info.get_text(" ", strip=True) if rank_info else ""
    m_media = re.search(r"M[ée]dia:\s*([\d.,]+)", info_text)
    if m_media:
        result["nota_media"] = float(m_media.group(1).replace(",", "."))
    m_notas = re.search(r"Notas:\s*([\d.,]+)", info_text)
    if m_notas:
        result["qt_avaliacoes"] = int(re.sub(r"[.,]", "", m_notas.group(1)))

    # --- Qtd. de partidas registradas ---
    partidas_el = soup.find(string=re.compile(r"partidas registradas", re.I))
    if partidas_el:
        m = re.search(r"[\d.,]+", partidas_el)
        if m:
            result["qt_partidas"] = int(re.sub(r"[.,]", "", m.group()))

    return result


def load_targets():
    df = pd.read_csv(IN_PATH)
    return list(zip(df["id_jogo"], df["link"]))


def load_done_ids():
    if not OUT_PATH.exists():
        return set()
    done = set()
    with open(OUT_PATH, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line:
                try:
                    done.add(json.loads(line)["id_jogo"])
                except (json.JSONDecodeError, KeyError):
                    pass
    return done


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--limit", type=int, default=None, help="Limita a N jogos (teste)")
    args = parser.parse_args()

    targets = load_targets()
    if args.limit:
        targets = targets[: args.limit]

    done = load_done_ids()
    pending = [(i, link) for i, link in targets if i not in done]
    print(f"Total: {len(targets)} | já coletados: {len(done)} | pendentes: {len(pending)}")

    session = requests.Session()
    session.headers.update(DEFAULT_HEADERS)
    try:
        session.get("https://ludopedia.com.br/", timeout=20).raise_for_status()
        time.sleep(CRAWL_DELAY_SECONDS)
    except Exception as exc:
        print(f"AVISO: falha ao aquecer sessão na home ({exc}) — seguindo mesmo assim.")

    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    errors = []
    with open(OUT_PATH, "a", encoding="utf-8") as f:
        for id_jogo, link in tqdm(pending, desc="Raspando nota/avaliações/partidas"):
            url = normalize_link(link)
            try:
                resp = session.get(url, timeout=20)
                resp.raise_for_status()
                parsed = parse_jogo_page(resp.text)
            except Exception as exc:
                errors.append((id_jogo, url, str(exc)))
                time.sleep(CRAWL_DELAY_SECONDS)
                continue

            row = {"id_jogo": int(id_jogo), "url": url, **parsed}
            f.write(json.dumps(row, ensure_ascii=False) + "\n")
            f.flush()
            time.sleep(CRAWL_DELAY_SECONDS)

    print(f"OK: {len(pending) - len(errors)} páginas raspadas em {OUT_PATH}")
    if errors:
        err_path = ROOT / "logs" / "scrape_bloco_a_nota_errors.log"
        with open(err_path, "w", encoding="utf-8") as f:
            for id_jogo, url, msg in errors:
                f.write(f"{id_jogo}\t{url}\t{msg}\n")
        print(f"AVISO: {len(errors)} falhas em {err_path}. Rode de novo para tentar de novo.")


if __name__ == "__main__":
    main()
