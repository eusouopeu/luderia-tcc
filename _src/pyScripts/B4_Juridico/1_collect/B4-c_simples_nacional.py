"""
Baixa o texto compilado da Lei Complementar nº 123/2006 (Simples Nacional) no
Planalto, com os Anexos I a V na redação da Lei Complementar nº 155/2016.

Saída: dados/B4_juridico/_dados-brutos/legislacao/lcp123_compilada_planalto_<data>.htm
O HTML é guardado sem alteração. A extração das tabelas fica em
B4-b_simples_nacional.py.
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

URL = "https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp123.htm"
OUT_PATH = pasta_bruta("legislacao") / f"lcp123_compilada_planalto_{DATA_COLETA}.htm"


def main() -> None:
    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUT_PATH.write_bytes(baixar(URL).content)
    print(f"baixado: {OUT_PATH.name} ({OUT_PATH.stat().st_size / 1e6:.1f} MB)")


if __name__ == "__main__":
    main()
