"""
Bloco B1 - conferência do recorte geográfico: onde fica cada candidato que
passou nos filtros de tipo, em relação à região metropolitana (RM) da capital
do seu estado. Regra e fonte em recorte_rm.py.

Lê a planilha de curadoria (já no recorte) e os descartados com motivo
`fora_da_rm_da_capital`, para que o registro mostre também quem saiu. Se a
curadoria tiver alguém fora do recorte, ou um descartado por esse motivo
estiver dentro, o script para: é sinal de que o build não aplicou a regra.

Saída em dados/[B1] Estabelecimentos e cardapios/:
  B1_conferencia_rm.csv - uma linha por estabelecimento, com município,
                               capital de referência e situação

Uso:
    python3 "_src/[B1] Estabelecimentos e cardapios/Google Places (Negócios)/analise/B1-a_conferencia_rm.py"
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
import pathlib
from collections import Counter

from recorte_rm import SITUACOES_NO_RECORTE, classifica

ROOT = pathlib.Path(__file__).resolve().parents[4]
PROCESSED = ROOT / "dados" / "[B1] Estabelecimentos e cardapios"
CURADORIA_PATH = PROCESSED / "B1_planilha_curadoria.csv"
DESCARTADOS_PATH = PROCESSED / "B1_descartados_por_filtro.csv"
OUT_PATH = PROCESSED / "B1_conferencia_rm.csv"

MOTIVO_FORA = "fora_da_rm_da_capital"
ORDEM = ["sem_municipio_no_endereco", "fora_da_rm", "dentro_da_rm", "municipio_da_capital"]
COLUNAS = [
    "place_id", "nome", "endereco", "municipio", "uf", "capital_referencia",
    "recorte_ibge", "situacao", "na_curadoria",
]


def main():
    with open(CURADORIA_PATH, newline="", encoding="utf-8") as f:
        curadoria = list(csv.DictReader(f))
    with open(DESCARTADOS_PATH, newline="", encoding="utf-8") as f:
        fora = [r for r in csv.DictReader(f) if r["motivo_descarte"] == MOTIVO_FORA]

    saida = []
    for linhas, na_curadoria in ((curadoria, "sim"), (fora, "nao")):
        for r in linhas:
            c = classifica(r["endereco"])
            dentro = c["situacao"] in SITUACOES_NO_RECORTE
            assert dentro == (na_curadoria == "sim"), f"regra não aplicada: {r['nome']} {c}"
            saida.append({
                "place_id": r["place_id"], "nome": r["nome"], "endereco": r["endereco"],
                **c, "na_curadoria": na_curadoria,
            })

    saida.sort(key=lambda s: (ORDEM.index(s["situacao"]), s["capital_referencia"], s["municipio"]))
    with open(OUT_PATH, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=COLUNAS)
        writer.writeheader()
        writer.writerows(saida)

    contagem = Counter(s["situacao"] for s in saida)
    assert sum(contagem.values()) == len(curadoria) + len(fora)
    print(f"OK: {OUT_PATH.name} - {len(curadoria)} na curadoria + {len(fora)} fora: {dict(contagem)}")


if __name__ == "__main__":
    main()
