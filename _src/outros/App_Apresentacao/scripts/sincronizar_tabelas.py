"""
Extrai as tabelas e os quadros do TMin (textos/capitulos/*.md) para
src/conteudo/tabelas.json, indexados pelo número ("Tabela 9.4", "Quadro 6.2").
O site lê os números daqui, e não de cópias digitadas: rodar de novo depois de
cada versão do texto (pnpm run tabelas).

Uso: python3 scripts/sincronizar_tabelas.py
"""
import json
import re
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[4]
MD = RAIZ / "textos" / "capitulos"
SAIDA = Path(__file__).resolve().parents[1] / "src" / "conteudo" / "tabelas.json"


def limpa(t):
    t = t.replace("<br>", " · ")
    t = re.sub(r"\*\*|`|\*", "", t)
    return t.strip()


def celulas(linha):
    return [limpa(c) for c in linha.strip().strip("|").split("|")]


def main():
    saida = {}
    for arq in sorted(MD.glob("[0-9]*_*.md")):
        linhas = arq.read_text(encoding="utf-8").splitlines()
        i = 0
        while i < len(linhas):
            m = re.match(r"\*\*((?:Tabela|Quadro) [\d.]+) – (.+?)\*\*\s*$", linhas[i])
            if not m:
                i += 1
                continue
            id_, titulo = m.group(1), limpa(m.group(2))
            j = i + 1
            while j < len(linhas) and not linhas[j].startswith("|"):
                j += 1
            tab = []
            while j < len(linhas) and linhas[j].startswith("|"):
                tab.append(linhas[j])
                j += 1
            fonte = nota = ""
            while j < len(linhas) and j < i + len(tab) + 12:
                if linhas[j].startswith("Fonte:"):
                    fonte = limpa(linhas[j][6:])
                elif linhas[j].startswith("Nota:"):
                    nota = limpa(linhas[j][5:])
                elif linhas[j].strip() and not linhas[j].startswith("|"):
                    if fonte or nota:
                        break
                j += 1
            if len(tab) >= 3:
                saida[id_] = {"titulo": titulo, "colunas": celulas(tab[0]),
                              "linhas": [celulas(l) for l in tab[2:]], "fonte": fonte, "nota": nota}
            i = j
    SAIDA.write_text(json.dumps(saida, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"{len(saida)} tabelas e quadros em {SAIDA.relative_to(RAIZ)}")


if __name__ == "__main__":
    main()
