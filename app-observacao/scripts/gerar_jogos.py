"""Gera src/domain/jogos.json: banco de jogos do app de observação.

Fonte: Bloco B5 (Ludopedia), `_data/processed/[B5] Jogos (ludopedia)/B5_jogos_completo.csv`,
ordenado por `qt_tem` (usuários que têm o jogo) como proxy de popularidade no Brasil.
Entram os 170 primeiros, mais uma lista curada de jogos de massa/familiares/clássicos
que o ranking hobbista da Ludopedia não cobre (comuns em luderias para público casual).
Uso: python3 scripts/gerar_jogos.py
"""
import csv
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SAIDA = Path(__file__).resolve().parents[1] / "src" / "domain" / "jogos.json"
FONTE = ROOT / "_data" / "processed" / "[B5] Jogos (ludopedia)" / "B5_jogos_completo.csv"
TOP = 170

# nome, jogadores mín., máx., minutos (None = não conferido)
CURADOS = [
    ("Uno", 2, 10, 30), ("Dobble", 2, 8, 15), ("Jenga", 1, 8, 20), ("Banco Imobiliário", 2, 6, 90),
    ("War", 3, 6, 120), ("Detetive", 2, 6, 45), ("Imagem & Ação", 4, 16, 60), ("Perfil", 2, 6, 45),
    ("Cara a Cara", 2, 2, 20), ("Jogo da Vida", 2, 6, 60), ("Combate", 2, 2, 45), ("Scotland Yard", 3, 6, 45),
    ("Dominó", 2, 4, 30), ("Baralho", 2, 8, 30), ("Damas", 2, 2, 30), ("Gamão", 2, 2, 30), ("Ludo", 2, 4, 30),
    ("Mancala", 2, 2, 15), ("Rummikub", 2, 4, 60), ("Coup", 2, 6, 15), ("Bang!", 4, 7, 40),
    ("King of Tokyo", 2, 6, 30), ("Sushi Go!", 2, 5, 15), ("The Mind", 2, 4, 20), ("Wavelength", 2, 12, 45),
    ("Exploding Kittens", 2, 5, 15), ("Quarto", 2, 2, 15), ("Lince", 2, 6, 20), ("Pictionary", 3, 16, 60),
    ("Tapple", 2, 8, 10), ("Taco Gato Cabra Queijo Pizza", 2, 8, 10), ("Halli Galli", 2, 6, 15),
    ("Stop", 2, 10, 30), ("Kingdomino", 2, 4, 15), ("Dominion", 2, 4, 30), ("Uno Flip", 2, 10, 30),
    ("Ticket to Ride: Primeira Viagem", 2, 4, 30), ("Cartas contra a Humanidade", 4, 20, 60),
]


def inteiro(x):
    try:
        return int(float(x))
    except (TypeError, ValueError):
        return None


def main():
    linhas = list(csv.DictReader(FONTE.open(encoding="utf-8")))
    linhas.sort(key=lambda r: -(inteiro(r["qt_tem"]) or 0))
    vistos, jogos = set(), []
    for r in linhas[:TOP]:
        nome = r["nm_jogo"].strip()
        if nome.lower() in vistos:
            continue
        vistos.add(nome.lower())
        jogos.append({"n": nome, "min": inteiro(r["qt_jogadores_min"]), "max": inteiro(r["qt_jogadores_max"]),
                      "t": inteiro(r["vl_tempo_jogo"]), "f": "ludopedia"})
    for nome, a, b, t in CURADOS:
        if nome.lower() in vistos:
            continue
        vistos.add(nome.lower())
        jogos.append({"n": nome, "min": a, "max": b, "t": t, "f": "curado"})
    SAIDA.write_text(json.dumps(jogos, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
    print(f"{len(jogos)} jogos → {SAIDA}")


if __name__ == "__main__":
    main()
