"""Baixa os cardápios (PDF e imagens) dos estabelecimentos do banco A do Notion.

Saída: dados/[B1] Estabelecimentos e cardapios/cardapios/<Estabelecimento>/
Cada arquivo baixado é registrado em B1_cardapios_baixados.csv (estabelecimento, url, arquivo, tipo, tamanho, baixado_em).
Arquivos já baixados são pulados. Páginas Wix são varridas por imagens hospedadas em static.wixstatic.com.
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
import re
import ssl
import urllib.request

import certifi
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
SAIDA = ROOT / "dados/[B1] Estabelecimentos e cardapios/cardapios"
LOG = SAIDA / "B1_cardapios_baixados.csv"
CTX = ssl.create_default_context(cafile=certifi.where())
UA = {"User-Agent": "Mozilla/5.0 (Macintosh) AppleWebKit/537.36 Chrome/120 Safari/537.36"}

# (estabelecimento, tipo, url): "arquivo" = download direto; "wix" = página Wix com imagens do cardápio
FONTES = [
    ("Arcadea Gaming Pub", "arquivo", "https://arcadeapub.com.br/wp-content/uploads/2025/03/CARDAPIO-ARCADEA-3.pdf"),
    ("Fortalúdica", "arquivo", "https://drive.google.com/uc?export=download&id=1cl7YIKdJhuuhNCUKAO0-96czajLGInqJ"),
    ("Ludus Luderia", "arquivo", "https://drive.google.com/uc?export=download&id=1s7GHW2xdsauEU55oIFPCojKY-nSrrKTB"),
    ("Luderia Carioca", "arquivo", "https://i.postimg.cc/T3qJVwfn/cardapio.jpg"),
    # Achado pelo Acervo de Jogos (12/10/2026): link "Cardápio TabuClub" do linktr.ee/tabuclubnit
    ("TabuClub", "arquivo", "https://drive.google.com/uc?export=download&id=1-KDTgvYRZKe4R9KCWVQHRD5xiWqjSgPW"),
    ("Alçapão Jogos", "wix", "https://www.alcapaojogos.com.br/card%C3%A1pio"),
    ("BoardZ Game Pub", "wix", "https://www.boardzgamepub.com.br/card%C3%A1pio"),
    ("Castelos Bar", "wix", "https://www.castelosbar.com.br/cardapio"),
]
EXT = {"application/pdf": ".pdf", "image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp"}


MAGIC = {b"%PDF": "application/pdf", b"\xff\xd8\xff": "image/jpeg", b"\x89PNG": "image/png", b"RIFF": "image/webp"}


def baixar(url):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=60, context=CTX) as r:
        dados, ctype = r.read(), r.headers.get_content_type()
    if ctype == "application/octet-stream":  # Drive e CDNs devolvem tipo genérico: identifica pelo cabeçalho do arquivo
        ctype = next((t for m, t in MAGIC.items() if dados.startswith(m)), ctype)
    return dados, ctype


def imagens_wix(url):
    html, _ = baixar(url)
    html = html.decode("utf8", "ignore")
    achadas = re.findall(r"https://static\.wixstatic\.com/media/[^\s\"'<>\\)]+?\.(?:png|jpe?g)", html)
    return sorted({re.sub(r"/v1/.*", "", x).replace("%7E", "~") for x in achadas})


def main():
    SAIDA.mkdir(parents=True, exist_ok=True)
    linhas = []
    for nome, tipo, url in FONTES:
        pasta = SAIDA / nome
        try:
            alvos = [url] if tipo == "arquivo" else imagens_wix(url)
        except Exception as e:
            print(f"FALHA {nome}: página {url[:60]} ({e})")
            continue
        for i, alvo in enumerate(alvos, 1):
            try:
                dados, ctype = baixar(alvo)
            except Exception as e:
                print(f"FALHA {nome}: {alvo[:80]} ({e})")
                continue
            if ctype not in EXT or len(dados) < 20_000:
                print(f"PULADO {nome}: {ctype}, {len(dados)} bytes")
                continue
            pasta.mkdir(exist_ok=True)
            arq = pasta / f"{nome} {i:02d}{EXT[ctype]}"
            if arq.exists():
                continue
            arq.write_bytes(dados)
            linhas.append([nome, alvo, arq.relative_to(SAIDA), ctype, len(dados), datetime.now().isoformat(timespec="seconds")])
            print(f"OK {arq.name} ({len(dados)//1024} KB)")
    novo = not LOG.exists()
    with open(LOG, "a", newline="", encoding="utf-8") as f:
        w = csv.writer(f, delimiter=";")
        if novo:
            w.writerow(["estabelecimento", "url", "arquivo", "tipo", "bytes", "baixado_em"])
        w.writerows(linhas)


if __name__ == "__main__":
    main()
