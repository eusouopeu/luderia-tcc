"""
Coleta os microdados de movimentação do Novo CAGED (MTE, FTP do PDET) e guarda só
as admissões das ocupações de uma luderia com bar nas 27 capitais.

Uso no plano: salário de contratação por ocupação e capital (7.5 e cap. 9) e sua
série histórica desde 2021 (projeção de reajustes).
O salário de admissão é o que um negócio novo paga ao contratar; por isso o
CAGED substitui a RAIS vínculos (média do estoque, 3,8 GB compactados em 2024).

Uso:
  python collect_bases_caged.py                            # últimos 12 meses disponíveis
  python collect_bases_caged.py --inicio 202101            # de jan/2021 até o último mês disponível
  python collect_bases_caged.py --inicio 202101 --fim 202512
  python collect_bases_caged.py --manter-originais         # não apaga os .7z

Saídas em _data/raw/[E] Bases publicas/caged/:
  caged_mov_<AAAAMM>_admissoes.csv.gz   admissões filtradas, só as colunas usadas no tratamento
  layout_novo_caged_movimentacao.xlsx
Meses já processados (.csv ou .csv.gz) são pulados.
"""

import argparse
import ftplib
import shutil
import time

import pandas as pd
import py7zr

from bases_comum import CAPITAIS, RAW_DIR

FTP_HOST = "ftp.mtps.gov.br"
FTP_BASE = "/pdet/microdados/NOVO CAGED"
OUT_DIR = RAW_DIR / "caged"
TMP_DIR = OUT_DIR / "_tmp"

CBOS = {
    "513405": "Garçom",
    "513415": "Cumim",
    "513420": "Barman",
    "513435": "Atendente de lanchonete",
    "513505": "Auxiliar nos serviços de alimentação",
    "513205": "Cozinheiro geral",
    "421125": "Operador de caixa",
    "141510": "Gerente de restaurante",
    "141515": "Gerente de bar",
    "371410": "Recreador",
    "521140": "Atendente de lojas e mercados",
    "514320": "Faxineiro",
    "991416": "Faxineiro",
}
MUNICIPIOS = {cod[:6] for cod in CAPITAIS}  # o CAGED usa o código de 6 dígitos
COLUNAS = [
    "competênciamov", "município", "subclasse", "saldomovimentação", "cbo2002ocupação",
    "horascontratuais", "indtrabintermitente", "indtrabparcial", "indicadoraprendiz",
    "salário", "unidadesaláriocódigo",
]


def conectar() -> ftplib.FTP:
    ftp = ftplib.FTP(FTP_HOST, timeout=300, encoding="latin-1")
    ftp.login()
    return ftp


def meses_disponiveis(ftp: ftplib.FTP) -> list[str]:
    anos = sorted(a for a in ftp.nlst(FTP_BASE) if a.rsplit("/", 1)[-1].isdigit())
    meses = []
    for ano in anos:
        meses += [m.rsplit("/", 1)[-1] for m in ftp.nlst(ano) if m.rsplit("/", 1)[-1].isdigit()]
    return sorted(meses)


def ler_txt(caminho) -> pd.DataFrame:
    amostra = caminho.open("rb").read(200_000)
    try:
        amostra.decode("utf-8")
        encoding = "utf-8"
    except UnicodeDecodeError:
        encoding = "latin-1"
    cabecalho = pd.read_csv(caminho, sep=";", nrows=0, encoding=encoding).columns
    usar = [c for c in COLUNAS if c in cabecalho]
    faltando = sorted(set(COLUNAS) - set(usar))
    if faltando:
        print("   colunas ausentes neste mês:", faltando)
    partes = []
    for bloco in pd.read_csv(caminho, sep=";", dtype=str, usecols=usar, encoding=encoding, chunksize=500_000):
        filtro = (bloco["município"].isin(MUNICIPIOS) & bloco["cbo2002ocupação"].isin(CBOS)
                  & (bloco["saldomovimentação"] == "1"))
        partes.append(bloco[filtro])
    return pd.concat(partes, ignore_index=True)


def processar_mes(ftp: ftplib.FTP, mes: str, manter: bool) -> None:
    destino = OUT_DIR / f"caged_mov_{mes}_admissoes.csv.gz"
    if destino.exists() or destino.with_suffix("").exists():
        print("já processado:", mes)
        return
    TMP_DIR.mkdir(parents=True, exist_ok=True)
    arquivo_7z = TMP_DIR / f"CAGEDMOV{mes}.7z"
    with arquivo_7z.open("wb") as f:
        ftp.retrbinary(f"RETR {FTP_BASE}/{mes[:4]}/{mes}/CAGEDMOV{mes}.7z", f.write)
    with py7zr.SevenZipFile(arquivo_7z) as z:
        z.extractall(path=TMP_DIR / mes)
    txt = next((TMP_DIR / mes).rglob("*.txt"))
    df = ler_txt(txt)
    df.to_csv(destino, index=False, compression="gzip")
    print(f"{mes}: {len(df):>6} admissões filtradas ({arquivo_7z.stat().st_size / 1e6:.0f} MB baixados)", flush=True)
    shutil.rmtree(TMP_DIR / mes)
    if manter:
        arquivo_7z.rename(OUT_DIR / arquivo_7z.name)
    else:
        arquivo_7z.unlink()


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--meses", type=int, default=12, help="últimos N meses (ignorado se --inicio for usado)")
    parser.add_argument("--inicio", help="primeira competência, AAAAMM")
    parser.add_argument("--fim", help="última competência, AAAAMM")
    parser.add_argument("--manter-originais", action="store_true")
    args = parser.parse_args()

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    ftp = conectar()
    layout = OUT_DIR / "layout_novo_caged_movimentacao.xlsx"
    if not layout.exists():
        with layout.open("wb") as f:
            ftp.retrbinary(f"RETR {FTP_BASE}/Layout Não-identificado Novo Caged Movimentação.xlsx", f.write)
    meses = meses_disponiveis(ftp)
    if args.inicio:
        meses = [m for m in meses if m >= args.inicio and (not args.fim or m <= args.fim)]
    else:
        meses = meses[-args.meses:]
    print("meses:", meses[0], "a", meses[-1], f"({len(meses)})", flush=True)
    for mes in meses:
        for tentativa in range(1, 4):
            try:
                processar_mes(ftp, mes, args.manter_originais)
                break
            except (*ftplib.all_errors, EOFError) as e:
                print(f"{mes}: erro de FTP ({e}); reconectando (tentativa {tentativa} de 3)", flush=True)
                time.sleep(30 * tentativa)
                ftp = conectar()
        else:
            raise RuntimeError(f"{mes}: falhou após 3 tentativas; rode de novo para retomar deste mês")
    if TMP_DIR.exists() and not any(TMP_DIR.iterdir()):
        TMP_DIR.rmdir()


if __name__ == "__main__":
    main()
