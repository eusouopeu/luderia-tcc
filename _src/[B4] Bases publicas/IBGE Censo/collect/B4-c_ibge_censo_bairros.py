"""
Baixa os arquivos originais dos Agregados por Bairros do Censo 2022 (IBGE) e o
dicionário de dados.

Temas: básico (pessoas, domicílios, média de moradores) e demografia (sexo e idade).
Renda não é divulgada nesse recorte; a renda por capital vem do SIDRA
(B4-c_ibge_sidra.py).

Saída: dados/[B4] Bases publicas/_dados-brutos/ibge_censo_2022/ (zips e xlsx originais)
"""

# Caminhos: _src/extras/ (log comum) e outros/ do objeto (auxiliares); log em ../logs/
import sys
from pathlib import Path
_AQUI = Path(__file__).resolve()
sys.path[:0] = [str(_AQUI.parents[3] / "extras"), str(_AQUI.parents[1] / "outros"), str(_AQUI.parents[2] / "Comum")]
from log_execucao import registrar_execucao  # noqa: E402
if __name__ == "__main__":
    registrar_execucao(__file__)

import re

from bases_comum import RAW_DIR, baixar

BASE = "https://ftp.ibge.gov.br/Censos/Censo_Demografico_2022/Agregados_por_Setores_Censitarios/"
TEMAS = ["basico", "demografia"]
OUT_DIR = RAW_DIR / "ibge_censo_2022"


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    arquivos = re.findall(r'href="(dicionario_de_dados[^"]+\.xlsx)"', baixar(BASE).text)
    listagem = baixar(BASE + "Agregados_por_Bairro_csv/").text
    for tema in TEMAS:
        arquivos += ["Agregados_por_Bairro_csv/" + a
                     for a in re.findall(rf'href="(Agregados_por_bairros_{tema}_BR[^"]*\.zip)"', listagem)]
    for rel in arquivos:
        destino = OUT_DIR / rel.split("/")[-1]
        if destino.exists():
            print("já existe:", destino.name)
            continue
        destino.write_bytes(baixar(BASE + rel, timeout=600).content)
        print(f"baixado: {destino.name} ({destino.stat().st_size / 1e6:.1f} MB)")


if __name__ == "__main__":
    main()
