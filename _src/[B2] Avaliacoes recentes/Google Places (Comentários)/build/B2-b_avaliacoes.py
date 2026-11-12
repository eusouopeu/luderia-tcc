"""
Bloco B2 - consolida as coletas do userscript maps_avaliacoes, confere a
cobertura de cada estabelecimento e gera a fila do que falta coletar.

Etapas:
  1. Move de ~/Downloads (ou da pasta de --origem) e da raiz de _dados-brutos/
     para dados/[B2] Avaliacoes recentes/_dados-brutos/:
       *_maps_avaliacoes_tudo*.csv      -> coletas/
       *_maps_avaliacoes_resumo*.csv    -> resumos/ (um por lugar, desde o
                                           coletor 2026.11.12-2, e os da fila
                                           ou do histórico)
     A raiz entra porque as coletas de 31/10 e 02/11 foram baixadas direto nela
     (pasta de download do navegador) e o build só varria ~/Downloads.
     Arquivo idêntico a um já movido é apagado da origem; nome repetido com
     conteúdo diferente recebe sufixo _2, _3...
  2. Liga cada coleta e cada resumo a uma casa da população do B1 (a mesma do
     B1-b_resumo.py: aprovadas da triagem, menos as excluídas, mais as luderias
     novas do acervo) pelo cid do Google Maps: a
     segunda parte do id_maps (0x...:0x<cid em hexadecimal>) é o mesmo número
     do "?cid=" do link_google_maps do B1. O place_id vem do B1, mesmo quando a
     URL da coleta não o trazia. Coleta sem par no B1 fica fora da base e é
     listada no terminal. Até 12/11/2026 a população era só a planilha de
     aprovadas: as luderias novas do acervo ficavam fora e as 2 excluídas, dentro.
  3. Monta a base: por estabelecimento, junta todas as coletas e, para cada
     review_id, fica a linha da coleta mais recente. A idade de cada avaliação
     é levada à data da coleta mais recente do estabelecimento (idade_dias_ref),
     para que linhas de coletas anteriores não entrem no período por engano. O
     recorte é o do método (_instrucoes/4_metodologia.md, Bloco B2): rótulo de
     data até "3 meses atrás", inclusive, ou seja, idade_dias_ref <= 90.
  4. Cobertura: uma linha por casa da população, com a situação da coleta mais
     recente, no vocabulário único das coletas (_src/dicionario.md §4.5):
       ok         - coleta completa (passou do período, fim da lista ou alcançou
                    coleta anterior) com avaliação no recorte;
       vazia      - coleta completa com zero avaliações no recorte: pelo CSV de
                    tudo, ou só pelo CSV-resumo (lugar sem nenhuma avaliação lida,
                    painel com período que cobre o recorte); números = 0;
       refazer    - coleta incompleta ou incerta (lista parou de crescer, ordem
                    errada, interrompida, erro, avaliação sem data reconhecida,
                    período do painel menor que o recorte);
       coletar    - sem registro de coleta (nem tudo nem resumo); números vazios,
                    nunca 0.
  5. Fila: place_id das luderias com situação coletar ou refazer, um por linha,
     no formato que o campo "Fila" do userscript aceita. Copiada para a área de
     transferência (macOS).

Conferência de somas (diferença zero, senão o script para):
  - por coleta: lidas = com texto + sem texto;
  - na base: soma de avaliacoes_no_periodo da cobertura = linhas da base
    (casas "coletar" ficam vazias e não entram na soma);
  - na cobertura: no período = com texto + sem texto.

Saídas em dados/[B2] Avaliacoes recentes/:
  B2_avaliacoes_periodo.csv   avaliações no recorte (fica fora do repositório:
                              contém texto de avaliações)
  B2_cobertura_coleta.csv     uma linha por casa da população do B1 (sem texto)
  B2_fila_coleta.txt          place_id a coletar ou refazer

Entrada do B1: casas() do B1-b_resumo.py (estabelecimentos/3_triagem/B1_aprovadas_metro_av100.xlsx
menos as excluídas, mais acervo_jogos/B1_acervodejogos_luderias_novas.csv)

Uso:
    python3 "_src/[B2] Avaliacoes recentes/Google Places (Comentários)/build/B2-b_avaliacoes.py"
    python3 "_src/[B2] Avaliacoes recentes/Google Places (Comentários)/build/B2-b_avaliacoes.py" --origem ~/Desktop
    python3 "_src/[B2] Avaliacoes recentes/Google Places (Comentários)/build/B2-b_avaliacoes.py" --sem-mover
"""
# Caminhos: _src/extras/ (log comum) e outros/ do objeto (auxiliares); log em ../logs/
import sys
from pathlib import Path
_AQUI = Path(__file__).resolve()
sys.path[:0] = [str(_AQUI.parents[3] / "extras"), str(_AQUI.parents[1] / "outros")]
from log_execucao import registrar_execucao  # noqa: E402
if __name__ == "__main__":
    registrar_execucao(__file__)

import argparse
import filecmp
import importlib.util
import re
import shutil
import subprocess
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parents[4]
# População do B1: a mesma função do B1-b_resumo.py, para as duas bases terem as mesmas casas.
B1_RESUMO = ROOT / "_src" / "[B1] Estabelecimentos e cardapios" / "Google Places (Negócios)" / "build" / "B1-b_resumo.py"
RAW = ROOT / "dados" / "[B2] Avaliacoes recentes" / "_dados-brutos"
PROCESSED = ROOT / "dados" / "[B2] Avaliacoes recentes"
COLETAS = RAW / "coletas"
RESUMOS = RAW / "resumos"

# Recorte do método: rótulo até "3 meses atrás", inclusive (idade aproximada 90 dias).
PERIODO_ATE_DIAS = 90
COMPLETOS = {"passou do período", "fim da lista", "alcançou coleta anterior"}
PADROES = {"*_maps_avaliacoes_tudo*.csv": COLETAS, "*_maps_avaliacoes_resumo*.csv": RESUMOS}
# Período do painel que cobre o recorte (o resumo só prova "vazia" se o painel olhou os 90 dias).
COBRE_RECORTE = PERIODO_ATE_DIAS


def mover_downloads(*origens):
    """Move os CSV do userscript para dados/[B2] Avaliacoes recentes/_dados-brutos/; devolve quantos foram movidos."""
    movidos = 0
    for padrao, destino in PADROES.items():
        destino.mkdir(parents=True, exist_ok=True)
        for arq in sorted(a for o in origens for a in o.glob(padrao)):
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
    spec = importlib.util.spec_from_file_location("b1_resumo", B1_RESUMO)
    m = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(m)
    b1 = m.casas().astype(str)
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


def ler_resumos(b1):
    """CSV-resumo de cada coleta (um por lugar, da fila ou do histórico), ligado à casa do B1."""
    arquivos = sorted(RESUMOS.glob("*.csv"))
    if not arquivos:
        return pd.DataFrame(columns=["place_id", "data_coleta_dt"])
    partes = []
    for arq in arquivos:
        df = pd.read_csv(arq, sep=";", dtype=str, encoding="utf-8-sig", keep_default_na=False)
        df["arquivo_resumo"] = arq.name
        partes.append(df)
    r = pd.concat(partes, ignore_index=True)
    for c in ("id_maps", "place_id", "lidas", "no_periodo", "no_periodo_com_texto", "periodo_ate_dias",
              "coleta_completa", "motivo_parada", "data_coleta"):
        if c not in r:
            r[c] = ""
    cid = r["id_maps"].map(cid_de_id_maps)
    pid = cid.map(b1.set_index("cid")["place_id"])
    pid = pid.where(pid.notna(), r["place_id"].where(r["place_id"].isin(set(b1["place_id"]))))
    r["place_id"] = pid
    r = r[r["place_id"].notna()].copy()
    r["data_coleta_dt"] = pd.to_datetime(r["data_coleta"], format="%Y-%m-%d %H:%M", errors="coerce")
    # O mesmo resumo aparece no arquivo do lugar, no da fila e no do histórico: conta uma vez.
    return r.drop_duplicates(["place_id", "data_coleta", "motivo_parada", "lidas"])


def situacao_por_resumo(r):
    """Situação de uma casa que só tem CSV-resumo (nenhuma avaliação lida, então sem CSV de tudo)."""
    lidas = pd.to_numeric(r["lidas"], errors="coerce")
    ate = r["periodo_ate_dias"]
    cobre = ate == "sem limite" or (pd.to_numeric(ate, errors="coerce") or 0) >= COBRE_RECORTE
    if r["coleta_completa"] != "sim":
        return f"refazer: {r['motivo_parada'] or 'sem motivo'}"
    if lidas and lidas > 0:
        return "refazer: resumo sem o CSV de tudo"
    if r["motivo_parada"] == "fim da lista" or cobre:
        return "vazia"
    return f"refazer: período do painel ({ate} dias) menor que o recorte"


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


def montar_cobertura(b1, col, base, res):
    linhas = []
    nd = float("nan")
    for _, lugar in b1.iterrows():
        pid = lugar["place_id"]
        c = col[col["place_id"] == pid] if len(col) else col
        rs = res[res["place_id"] == pid].sort_values("data_coleta_dt") if len(res) else res
        linha = {"place_id": pid, "nome": lugar["nome"], "capital": lugar["capital_endereco"],
                 "volume_b1": lugar["volume_avaliacoes"], "coletas": 0, "resumos": len(rs)}
        if len(c) == 0 and len(rs) == 0:
            linhas.append({**linha, "situacao": "coletar", "avaliacoes_no_periodo": nd,
                           "no_periodo_com_texto": nd, "no_periodo_sem_texto": nd})
            continue
        if len(c) == 0:
            # Só o CSV-resumo: coleta feita sem nenhuma avaliação lida (ou que falhou).
            u = rs.iloc[-1]
            sit = situacao_por_resumo(u)
            zero = 0 if sit == "vazia" else nd
            linhas.append({**linha, "ultima_coleta": u["data_coleta"], "motivo_parada": u["motivo_parada"],
                           "lidas_ultima_coleta": pd.to_numeric(u["lidas"], errors="coerce"),
                           "situacao": sit, "avaliacoes_no_periodo": zero,
                           "no_periodo_com_texto": zero, "no_periodo_sem_texto": zero})
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
            situacao = f"refazer: {sem_data} sem data"
        elif len(noP) == 0:
            situacao = "vazia"
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
    for c in ("volume_na_coleta", "lidas_ultima_coleta", "sem_data", "avaliacoes_no_periodo",
              "no_periodo_com_texto", "no_periodo_sem_texto"):
        if c in cob:
            cob[c] = pd.to_numeric(cob[c]).astype("Int64")
    soma = cob["no_periodo_com_texto"] + cob["no_periodo_sem_texto"]
    medido = cob["avaliacoes_no_periodo"].notna()
    if (soma[medido] != cob.loc[medido, "avaliacoes_no_periodo"]).any():
        raise SystemExit("Soma não confere na cobertura: com texto + sem texto != no período")
    # Vazio só em "coletar" (sem registro) e em "refazer" só com resumo; nunca em ok ou vazia.
    assert cob.loc[cob["situacao"].isin(["ok", "vazia"]), "avaliacoes_no_periodo"].notna().all()
    assert (cob.loc[cob["situacao"] == "vazia", "avaliacoes_no_periodo"] == 0).all()
    assert len(cob) == len(b1) and cob["place_id"].is_unique, "uma linha por casa da população"
    return cob


def main():
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[1])
    ap.add_argument("--origem", type=Path, default=Path.home() / "Downloads", help="pasta dos CSV baixados")
    ap.add_argument("--sem-mover", action="store_true", help="não move nada; usa só o que já está em dados/[B2] Avaliacoes recentes/_dados-brutos")
    args = ap.parse_args()

    if not args.sem_mover:
        print(f"Movidos de {args.origem} e da raiz de _dados-brutos/: {mover_downloads(args.origem.expanduser(), RAW)}")

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
    res = ler_resumos(b1)
    cob = montar_cobertura(b1, col, base, res)

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
    print("Situação das", len(cob), "casas da população do B1:")
    for sit, n in cob["situacao"].str.split(":").str[0].value_counts().items():
        print(f"  {sit}: {n}")
    for _, r in cob[~cob["situacao"].isin(["ok"])].iterrows():
        print(f"  - {r['nome']} ({r['capital']}): {r['situacao']}")
    if len(col):
        datas = col.groupby("place_id")["coletado_em_dt"].max()
        print(f"Janela das coletas mais recentes: {datas.min():%Y-%m-%d} a {datas.max():%Y-%m-%d} "
              f"({(datas.max() - datas.min()).days} dias).")
    print(f"Fila: {len(fila)} lugares em B2_fila_coleta.txt"
          + (" (copiada para a área de transferência: cole no campo Fila do painel)." if copiado else "."))


if __name__ == "__main__":
    main()
