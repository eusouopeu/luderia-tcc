"""Lista de jogos do "Cardápio de Jogos Digital" do Covil Game Bar (PDF do Canva, criado em 03/05/2023).

Entrada: dados/[B1] Estabelecimentos e cardapios/cardapios/Cardapio de Jogos Digital - Covil Game bar.pdf
Saída:   .../cardapios/B1_jogos_covil.csv (pagina;jogo;tempo_min;jogadores)
Cada jogo do PDF é título + descrição + linha "NN min  X-Y pessoas". O título é a última linha curta
(até 50 caracteres) antes da descrição. Jogo sem a linha de tempo (ex.: Mini Sinuca) entra com tempo e
jogadores vazios. "Recém Adicionados" é cabeçalho de seção, não jogo.
Os prints de jul. 2025 (pasta "Cardapio de jogos Covil Game bar") mostram a versão impressa, dividida
em Fácil, Médio e Difícil; não foram transcritos, porque cobrem só parte da lista.
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
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
BASE = ROOT / "dados/[B1] Estabelecimentos e cardapios/cardapios"
PDF = BASE / "Cardapio de Jogos Digital - Covil Game bar.pdf"
SAIDA = BASE / "B1_jogos_covil.csv"
META = re.compile(r"^\s*(\d+)\s*min\s+([\d\-–a ]+?)\s*pessoas?", re.I)
CABECALHOS = {"Recém Adicionados", "CARDÁPIO", "DE", "JOGOS", "COVIL GAME BAR"}
# Descrição curta lida como título: vale o título anterior (conferido no PDF).
DESCRICOES_CURTAS = {"Jogo de sinuca em miniatura": "Mini Sinuca"}


def main():
    texto = subprocess.run(["pdftotext", "-layout", str(PDF), "-"], capture_output=True, text=True, check=True).stdout
    jogos = []
    for pagina, conteudo in enumerate(texto.split("\f"), 1):
        bloco = []
        for linha in conteudo.split("\n"):
            m = META.match(linha)
            if not m:
                bloco.append(linha)
                continue
            linhas = [b.strip() for b in bloco if b.strip()]
            fim = next((k for k, b in enumerate(linhas) if len(b) > 50), len(linhas))
            curtas = [b for b in linhas[:fim] if len(b) <= 50 and b not in CABECALHOS]
            curtas = list(dict.fromkeys(DESCRICOES_CURTAS.get(b, b) for b in curtas))
            for sem_meta in curtas[:-1]:  # título sem linha de tempo, seguido de outro jogo
                jogos.append((pagina, sem_meta, "", ""))
            if curtas:
                jogos.append((pagina, curtas[-1], m.group(1), m.group(2).strip()))
            bloco = []
    with open(SAIDA, "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f, delimiter=";")
        w.writerow(["pagina", "jogo", "tempo_min", "jogadores"])
        w.writerows(jogos)
    print(f"{len(jogos)} jogos -> {SAIDA}")


if __name__ == "__main__":
    main()
