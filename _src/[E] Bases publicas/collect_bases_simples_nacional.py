"""
Baixa o texto compilado da Lei Complementar nº 123/2006 (Simples Nacional) no
Planalto, com os Anexos I a V na redação da Lei Complementar nº 155/2016.

Saída: _data/raw/[E] Bases publicas/legislacao/lcp123_compilada_planalto_<data>.htm
O HTML é guardado sem alteração. A extração das tabelas fica em
build_bases_simples_nacional.py.
"""

from bases_comum import DATA_COLETA, RAW_DIR, baixar

URL = "https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp123.htm"
OUT_PATH = RAW_DIR / "legislacao" / f"lcp123_compilada_planalto_{DATA_COLETA}.htm"


def main() -> None:
    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUT_PATH.write_bytes(baixar(URL).content)
    print(f"baixado: {OUT_PATH.name} ({OUT_PATH.stat().st_size / 1e6:.1f} MB)")


if __name__ == "__main__":
    main()
