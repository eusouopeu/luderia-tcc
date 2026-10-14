"""
Bloco B2 - consolida as coletas do userscript maps_avaliacoes, confere a
cobertura de cada estabelecimento e gera a fila do que falta coletar.

Etapas:
  1. Move de ~/Downloads (ou da pasta de --origem) para dados/[B2] Avaliacoes recentes/dados-brutos/:
       *_maps_avaliacoes_tudo*.csv      -> coletas/
       *_maps_avaliacoes_resumo_*.csv   -> resumos/
     Arquivo idêntico a um já movido é apagado da origem; nome repetido com
     conteúdo diferente recebe sufixo _2, _3...
  2. Liga cada coleta a uma luderia aprovada do B1 pelo cid do Google Maps: a
     segunda parte do id_maps (0x...:0x<cid em hexadecimal>) é o mesmo número
     do "?cid=" do link_google_maps do B1. O place_id vem do B1, mesmo quando a
     URL da coleta não o trazia. Coleta sem par no B1 fica fora da base e é
     listada no terminal.
  3. Monta a base: por estabelecimento, junta todas as coletas e, para cada
     review_id, fica a linha da coleta mais recente. A idade de cada avaliação
     é levada à data da coleta mais recente do estabelecimento (idade_dias_ref),
     para que linhas de coletas anteriores não entrem no período por engano. O
     recorte é o do método (_instrucoes/4_metodologia.md, Bloco B2): rótulo de
     data até "3 meses atrás", inclusive, ou seja, idade_dias_ref <= 90.
  4. Cobertura: uma linha por luderia aprovada, com a situação da coleta mais
     recente:
       ok         - coleta completa (passou do período, fim da lista ou alcançou
                    coleta anterior);
       refazer    - coleta incompleta ou incerta (lista parou de crescer, ordem
                    errada, interrompida, erro);
       conferir   - coleta completa, mas com avaliação sem data reconhecida;
       coletar    - sem coleta.
  5. Fila: place_id das luderias com situação coletar ou refazer, um por linha,
     no formato que o campo "Fila" do userscript aceita. Copiada para a área de
     transferência (macOS).

Conferência de somas (diferença zero, senão o script para):
  - por coleta: lidas = com texto + sem texto;
  - na base: soma de avaliacoes_no_periodo da cobertura = linhas da base;
  - na cobertura: no período = com texto + sem texto.

Saídas em dados/[B2] Avaliacoes recentes/:
  B2_avaliacoes_periodo.csv   avaliações no recorte (fica fora do repositório:
                              contém texto de avaliações)
  B2_cobertura_coleta.csv     uma linha por luderia aprovada (sem texto)
  B2_fila_coleta.txt          place_id a coletar ou refazer

Entrada do B1: B1_luderias_aprovadas_metropoles_mais_100_avaliacoes.xlsx

Uso:
    python3 "_src/[B2] Google Places (comentarios)/build/B2-b_avaliacoes.py"
    python3 "_src/[B2] Google Places (comentarios)/build/B2-b_avaliacoes.py" --origem ~/Desktop
    python3 "_src/[B2] Google Places (comentarios)/build/B2-b_avaliacoes.py" --sem-mover
"""
# Caminhos: _src/ (log comum) e outros/ do bloco (auxiliares); log em ../logs/
import sys
from pathlib import Path
_AQUI = Path(__file__).resolve()
sys.path[:0] = [str(_AQUI.parents[2]), str(_AQUI.parents[1] / "outros")]
from log_execucao import registrar_execucao  # noqa: E402
if __name__ == "__main__":
    registrar_execucao(__file__)

import argparse
import filecmp
import re
import shutil
import subprocess
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parents[3]
B1 = ROOT / "dados" / "[B1] Estabelecimentos e cardapios" / "B1_luderias_aprovadas_metropoles_mais_100_avaliacoes.xlsx"
RAW = ROOT / "dados" / "[B2] Avaliacoes recentes" / "dados-brutos"
PROCESSED = ROOT / "dados" / "[B2] Avaliacoes recentes"
COLETAS = RAW / "coletas"
RESUMOS = RAW / "resumos"

# Recorte do método: rótulo até "3 meses atrás", inclusive (idade aproximada 90 dias).
PERIODO_ATE_DIAS = 90
COMPLETOS = {"passou do período", "fim da lista", "alcançou coleta anterior"}
PADROES = {"*_maps_avaliacoes_tudo*.csv": COLETAS, "*_maps_avaliacoes_resumo_*.csv": RESUMOS}


def mover_downloads(origem):
    """Move os CSV do userscript para dados/[B2] Avaliacoes recentes/dados-brutos/; devolve quantos foram movidos."""
    movidos = 0
    for padrao, destino in PADROES.items():
        destino.mkdir(parents=True, exist_ok=True)
        for arq in sorted(origem.glob(padrao)):
            # "nome (1).csv" do navegador volta ao nome original.
            base = re.sub(r"\s*\(\d+\)$", "", arq.stem)
            alvo, n = destino / f"{base}.csv", 1
            while alvo.exists():
                if filecmp.cmp(arq, alvo, shallow=False):
                    arq.unlink()
                    break
                n += 1
                alvo = destino / f"{base}_{n}.csv"
            else:
                shutil.move(str(arq), alvo)
                movidos += 1
    return movidos


def cid_de_id_maps(id_maps):
    m = re.search(r":0x([0-9a-f]+)$", str(id_maps), re.I)
    return str(int(m.group(1), 16)) if m else ""


def ler_b1():
    b1 = pd.read_excel(B1, dtype=str)
    b1["cid"] = b1["link_google_maps"].str.extract(r"cid=(\d+)", expand=False).fillna("")
    sem_cid = b1[b1["cid"] == ""]
    if len(sem_cid):
        print(f"Aviso: {len(sem_cid)} luderias do B1 sem cid no link: {', '.join(sem_cid['nome'])}")
    return b1[["place_id", "cid", "nome", "capital_endereco", "volume_avaliacoes"]]


def ler_coletas(b1):
    arquivos = sorted(COLETAS.glob("*.csv"))
    if not arquivos:
        return pd.DataFrame(), []
    partes = []
    for arq in arquivos:
        df = pd.read_csv(arq, sep=";", dtype=str, encoding="utf-8-sig", keep_default_na=False)
        df["arquivo_coleta"] = arq.name
        partes.append(df)
    col = pd.concat(partes, ignore_index=True)
    col["cid"] = col["id_maps"].map(cid_de_id_maps)
    por_cid = b1.set_index("cid")["place_id"]
    por_pid = set(b1["place_id"])
    # Par pelo cid; se faltar, pelo place_id que veio da fila ou do campo do painel.
    col["place_id_b1"] = col["cid"].map(por_cid)
    falta = col["place_id_b1"].isna() & col["place_id"].isin(por_pid)
    col.loc[falta, "place_id_b1"] = col.loc[falta, "place_id"]
    sem_par = sorted(col.loc[col["place_id_b1"].isna(), "arquivo_coleta"].unique())
    col = col[col["place_id_b1"].notna()].copy()
    col["place_id"] = col["place_id_b1"]
    col = col.drop(columns=["place_id_b1"])
    col["coletado_em_dt"] = pd.to_datetime(col["coletado_em"], format="%Y-%m-%d %H:%M")
    col["idade_dias_aprox"] = pd.to_numeric(col["idade_dias_aprox"], errors="coerce")
    return col, sem_par


def conferir_coletas(col):
    """lidas = com texto + sem texto, em cada coleta."""
    for arq, g in col.groupby("arquivo_coleta"):
        com = (g["tem_texto"] == "sim").sum()
        sem = (g["tem_texto"] == "não").sum()
        if com + sem != len(g):
            raise SystemExit(f"Soma não confere em {arq}: {com} com texto + {sem} sem texto != {len(g)} lidas")


def montar_base(col):
    """Uma linha por review_id e estabelecimento, da coleta mais recente; idade levada à data de referência."""
    col = col.sort_values("coletado_em_dt")
    base = col.drop_duplicates(["place_id", "review_id"], keep="last").copy()
    ref = col.groupby("place_id")["coletado_em_dt"].max().rename("data_referencia")
    base = base.join(ref, on="place_id")
    atraso = (base["data_referencia"].dt.normalize() - base["coletado_em_dt"].dt.normalize()).dt.days
    base["idade_dias_ref"] = base["idade_dias_aprox"] + atraso
    base["no_recorte"] = (base["idade_dias_ref"] <= PERIODO_ATE_DIAS).map({True: "sim", False: "não"})
    return base


def montar_cobertura(b1, col, base):
    linhas = []
    for _, lugar in b1.iterrows():
        pid = lugar["place_id"]
        c = col[col["place_id"] == pid] if len(col) else col
        linha = {"place_id": pid, "nome": lugar["nome"], "capital": lugar["capital_endereco"],
                 "volume_b1": lugar["volume_avaliacoes"], "coletas": 0}
        if len(c) == 0:
            linhas.append({**linha, "situacao": "coletar", "avaliacoes_no_periodo": 0,
                           "no_periodo_com_texto": 0, "no_periodo_sem_texto": 0})
            continue
        ultima_data = c["coletado_em_dt"].max()
        ultima = c[c["coletado_em_dt"] == ultima_data]
        motivo = ultima["motivo_parada"].iloc[0]
        noP = base[(base["place_id"] == pid) & (base["no_recorte"] == "sim")]
        com = int((noP["tem_texto"] == "sim").sum())
        sem_data = int(ultima["idade_dias_aprox"].isna().sum())
        if motivo not in COMPLETOS:
            situacao = f"refazer: {motivo}"
        elif sem_data:
            situacao = f"conferir: {sem_data} sem data"
        else:
            situacao = "ok"
        linhas.append({**linha,
                       "coletas": c["arquivo_coleta"].nunique(),
                       "ultima_coleta": ultima_data.strftime("%Y-%m-%d %H:%M"),
                       "motivo_parada": motivo,
                       "volume_na_coleta": ultima["volume_avaliacoes_estabelecimento"].iloc[0],
                       "lidas_ultima_coleta": len(ultima),
                       "sem_data": sem_data,
                       "situacao": situacao,
                       "avaliacoes_no_periodo": len(noP),
                       "no_periodo_com_texto": com,
                       "no_periodo_sem_texto": len(noP) - com})
    cob = pd.DataFrame(linhas)
    for c in ("volume_na_coleta", "lidas_ultima_coleta", "sem_data"):
        if c in cob:
            cob[c] = pd.to_numeric(cob[c]).astype("Int64")
    soma = cob["no_periodo_com_texto"] + cob["no_periodo_sem_texto"]
    if (soma != cob["avaliacoes_no_periodo"]).any():
        raise SystemExit("Soma não confere na cobertura: com texto + sem texto != no período")
    return cob


def main():
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[1])
    ap.add_argument("--origem", type=Path, default=Path.home() / "Downloads", help="pasta dos CSV baixados")
    ap.add_argument("--sem-mover", action="store_true", help="não move nada; usa só o que já está em dados/[B2] Avaliacoes recentes/dados-brutos")
    args = ap.parse_args()

    if not args.sem_mover:
        print(f"Movidos de {args.origem}: {mover_downloads(args.origem.expanduser())}")

    b1 = ler_b1()
    col, sem_par = ler_coletas(b1)
    for arq in sem_par:
        print(f"Aviso: {arq} não corresponde a nenhuma luderia aprovada do B1; fica fora da base.")

    PROCESSED.mkdir(parents=True, exist_ok=True)
    if len(col):
        conferir_coletas(col)
        base = montar_base(col)
        no_rec = base[base["no_recorte"] == "sim"].drop(columns=["coletado_em_dt", "cid"])
    else:
        base = no_rec = pd.DataFrame(columns=["place_id", "review_id", "no_recorte", "tem_texto"])
    cob = montar_cobertura(b1, col, base)

    dif = int(cob["avaliacoes_no_periodo"].sum()) - len(no_rec)
    if dif:
        raise SystemExit(f"Soma não confere: cobertura soma {cob['avaliacoes_no_periodo'].sum()}, base tem {len(no_rec)}")

    no_rec.to_csv(PROCESSED / "B2_avaliacoes_periodo.csv", sep=";", index=False, encoding="utf-8-sig")
    cob.to_csv(PROCESSED / "B2_cobertura_coleta.csv", sep=";", index=False, encoding="utf-8-sig")

    fila = cob[cob["situacao"].str.startswith(("coletar", "refazer"))]
    (PROCESSED / "B2_fila_coleta.txt").write_text("".join(f"{p}\n" for p in fila["place_id"]), encoding="utf-8")
    if fila.empty:
        copiado = False
    else:
        try:
            subprocess.run(["pbcopy"], input="\n".join(fila["place_id"]).encode(), check=True)
            copiado = True
        except (FileNotFoundError, subprocess.CalledProcessError):
            copiado = False

    print(f"Base: {len(no_rec)} avaliações no recorte ({(no_rec['tem_texto'] == 'sim').sum()} com texto); "
          f"soma da cobertura confere (diferença {dif}).")
    print("Situação das", len(cob), "luderias aprovadas:")
    for sit, n in cob["situacao"].str.split(":").str[0].value_counts().items():
        print(f"  {sit}: {n}")
    for _, r in cob[~cob["situacao"].isin(["ok", "coletar"])].iterrows():
        print(f"  - {r['nome']} ({r['capital']}): {r['situacao']}")
    if len(col):
        datas = col.groupby("place_id")["coletado_em_dt"].max()
        print(f"Janela das coletas mais recentes: {datas.min():%Y-%m-%d} a {datas.max():%Y-%m-%d} "
              f"({(datas.max() - datas.min()).days} dias).")
    print(f"Fila: {len(fila)} lugares em B2_fila_coleta.txt"
          + (" (copiada para a área de transferência: cole no campo Fila do painel)." if copiado else "."))


if __name__ == "__main__":
    main()
