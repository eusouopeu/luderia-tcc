"""
Baixa a planilha original de séries históricas do Índice FipeZAP (residencial e
comercial) e a nota metodológica.

Saída: dados/B4_financeiro/_dados-brutos/fipezap/ (xlsx e pdf originais)
A extração da locação comercial fica em B4b_fipezap_comercial.py.
"""

# Caminhos: _src/outros/ (log comum) e outros/ do objeto (auxiliares); log em ../logs/
import sys
from pathlib import Path
_AQUI = Path(__file__).resolve()
sys.path[:0] = [*map(str, (_AQUI.parents[3] / "outros").glob("G[0-9]_*")), str(_AQUI.parents[1] / "5_outros"), str(_AQUI.parents[2] / "B4_Multiuso" / "5_outros")]
from log_execucao import registrar_execucao  # noqa: E402
if __name__ == "__main__":
    registrar_execucao(__file__)

from bases_comum import DATA_COLETA, baixar, pasta_bruta

OUT_DIR = pasta_bruta("fipezap")
ARQUIVOS = {
    "https://downloads.fipe.org.br/indices/fipezap/fipezap-serieshistoricas.xlsx":
        f"fipezap-serieshistoricas_{DATA_COLETA}.xlsx",
    "http://downloads.fipe.org.br/indices/fipezap/metodologia/indice-fipezap-metodologia-2019.pdf":
        "indice-fipezap-metodologia-2019.pdf",
}


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for url, nome in ARQUIVOS.items():
        destino = OUT_DIR / nome
        destino.write_bytes(baixar(url, timeout=300).content)
        print(f"baixado: {nome} ({destino.stat().st_size / 1e6:.1f} MB)")


if __name__ == "__main__":
    main()
