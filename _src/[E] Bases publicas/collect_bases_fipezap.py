"""
Baixa a planilha original de séries históricas do Índice FipeZAP (residencial e
comercial) e a nota metodológica.

Saída: _data/raw/[E] Bases publicas/fipezap/ (xlsx e pdf originais)
A extração da locação comercial fica em build_bases_fipezap_comercial.py.
"""

from bases_comum import DATA_COLETA, RAW_DIR, baixar

OUT_DIR = RAW_DIR / "fipezap"
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
