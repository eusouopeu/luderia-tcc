"""
Bloco B1 - consolida as coletas do userscript maps_entorno (entorno no Google
Maps), confere as somas, compara o metrô com o OpenStreetMap e gera a fila do
que falta coletar.

Etapas:
  1. Move de ~/Downloads (ou da pasta de --origem) para _data/raw/[B1]/entorno_maps:
       *entorno_resumo*.csv      -> resumos/
       *entorno_resultados*.csv  -> resultados/
     Vale para o nome novo (AAAA-MM-DD_<estabelecimento>_entorno_resumo.csv) e
     para o antigo (maps_entorno_resumo_AAAA-MM-DD.csv). Arquivo idêntico a um
     já movido é apagado da origem; nome repetido com conteúdo diferente recebe
     sufixo _2, _3...
  2. Consolida: cada estabelecimento (place_id; sem ele, o nome) fica com a
     coleta mais recente (coletado_em); empate fica com o arquivo de nome mais
     recente. Os resultados entram só os dessa coleta, uma vez cada, ainda que
     a mesma coleta apareça em vários arquivos (exportações cumulativas e
     parciais).
  3. Confere (diferença zero, senão o script para):
       - por estabelecimento, sem grupo em branco: soma dos grupos a 1000 m
         (metrô, trem, VLT/BRT, shoppings, outros) = resultados_ate_1000m;
       - raios aninhados: qt_*_500m <= qt_*_1000m;
       - por estabelecimento, grupo e raio: a contagem do resumo = resultados
         do grupo, sem duplicata, dentro do raio;
       - no total: soma de resultados_ate_1000m = linhas de resultados sem
         duplicata a até 1000 m.
     Coletas da versão anterior à busca de trem não têm as colunas de trem; a
     soma usa as colunas presentes.
  4. Compara o metrô do Maps com o do OSM (B1_entorno.csv, station=subway),
     a 500 m e 1000 m. O OSM não conta trem metropolitano; por isso a
     conferência traz também o trem do Maps ao lado.
  5. Fila: estabelecimentos do B1_entorno.csv sem coleta e coletados com
     situação diferente de "ok", em CSV "place_id;nome;lat;lng" com cabeçalho,
     que o campo de fila do userscript aceita. Copiada para a área de transferência
     (macOS).

Saídas em _data/processed/[B1] Estabelecimentos e cardapios/entorno_maps/:
  B1_entorno_maps.csv                 um estabelecimento por linha (resumo)
  B1_entorno_maps_resultados.csv      um resultado do Maps por linha
  B1_entorno_maps_conferencia_osm.csv metrô do Maps x OSM por estabelecimento
  B1_entorno_maps_fila.txt            estabelecimentos a coletar ou refazer
                                      (place_id;nome;lat;lng, com cabeçalho)

Uso:
    python3 "_src/[B1] Google Places (estabelecimentos)/build_B1_entorno_maps.py"
    python3 "_src/[B1] Google Places (estabelecimentos)/build_B1_entorno_maps.py" --origem ~/Desktop
    python3 "_src/[B1] Google Places (estabelecimentos)/build_B1_entorno_maps.py" --sem-mover
"""
import argparse
import filecmp
import re
import shutil
import subprocess
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parents[2]
RAW = ROOT / "_data" / "raw" / "[B1] Estabelecimentos e cardapios" / "entorno_maps"
PROCESSED_B1 = ROOT / "_data" / "processed" / "[B1] Estabelecimentos e cardapios"
PROCESSED = PROCESSED_B1 / "entorno_maps"
OSM = PROCESSED_B1 / "B1_entorno.csv"
RESUMOS = RAW / "resumos"
RESULTADOS = RAW / "resultados"
PADROES = {"*entorno_resumo*.csv": RESUMOS, "*entorno_resultados*.csv": RESULTADOS}

RAIOS = [500, 1000]
# Grupos do resumo, na ordem do userscript; "outros" só existe a 1000 m.
GRUPOS = {"metro": "estacoes_metro", "trem": "estacoes_trem", "vlt_brt": "estacoes_vlt_brt", "shopping": "shoppings"}


def mover_downloads(origem):
    """Move os CSV do userscript para _data/raw; devolve quantos foram movidos."""
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


def ler_pasta(pasta):
    partes = []
    for arq in sorted(pasta.glob("*.csv")):
        df = pd.read_csv(arq, sep=";", dtype=str, encoding="utf-8-sig", keep_default_na=False)
        df["arquivo"] = arq.name
        partes.append(df)
    return pd.concat(partes, ignore_index=True) if partes else pd.DataFrame()


def chave(place_id, nome):
    return place_id.where(place_id != "", "nome:" + nome)


def consolidar(resumos, resultados):
    """Fica a coleta mais recente de cada estabelecimento e os resultados dela."""
    resumos = resumos.copy()
    resumos["chave"] = chave(resumos["place_id"], resumos["nome"])
    resumos = resumos.sort_values(["chave", "coletado_em", "arquivo"]).drop_duplicates("chave", keep="last")
    resultados = resultados.copy()
    resultados["chave"] = chave(resultados["origem_place_id"], resultados["origem_nome"])
    ficam = resumos[["chave", "coletado_em"]]
    resultados = resultados.merge(ficam, on=["chave", "coletado_em"], how="inner")
    id_resultado = ["chave", "coletado_em", "place_id", "id_maps", "nome", "lat", "lng"]
    resultados = resultados.drop_duplicates(id_resultado, keep="last")
    return resumos.reset_index(drop=True), resultados.reset_index(drop=True)


def num(serie):
    return pd.to_numeric(serie, errors="coerce")


def conferir(resumos, resultados):
    """Somas e contagens com diferença zero; devolve a lista de erros."""
    erros = []
    validos = resultados[resultados["duplicata_de"] == ""].copy()
    validos["dist"] = num(validos["distancia_m"])
    ate1000 = validos[validos["dist"] <= 1000]
    for _, r in resumos.iterrows():
        cols = [f"qt_{c}_1000m" for c in GRUPOS.values() if f"qt_{c}_1000m" in resumos.columns] + ["qt_outros_1000m"]
        vals = [r[c] for c in cols]
        if all(v != "" for v in vals):
            soma = sum(int(v) for v in vals)
            if soma != int(r["resultados_ate_1000m"]):
                erros.append(f"{r['nome']}: grupos somam {soma}, resultados_ate_1000m = {r['resultados_ate_1000m']}")
        doc = ate1000[ate1000["chave"] == r["chave"]]
        for grupo, col in list(GRUPOS.items()) + [("outro", "outros")]:
            for raio in RAIOS:
                c = f"qt_{col}_{raio}m"
                if c not in resumos.columns or r[c] == "":
                    continue
                if raio == 500 and int(r[c]) > int(r[f"qt_{col}_1000m"]):
                    erros.append(f"{r['nome']}: {c} maior que a 1000 m")
                n = int(((doc["grupo"] == grupo) & (doc["dist"] <= raio)).sum())
                if n != int(r[c]):
                    erros.append(f"{r['nome']}: {c} = {r[c]}, resultados do grupo = {n}")
    total = int(num(resumos["resultados_ate_1000m"]).sum())
    if total != len(ate1000):
        erros.append(f"Total: resumo soma {total} resultados a até 1000 m, base de resultados tem {len(ate1000)}")
    return erros


def comparar_osm(resumos):
    osm = pd.read_csv(OSM, dtype=str, keep_default_na=False)
    osm = osm[["place_id", "qt_estacoes_metro_500m", "qt_estacoes_metro_1000m"]].rename(
        columns={"qt_estacoes_metro_500m": "metro_osm_500m", "qt_estacoes_metro_1000m": "metro_osm_1000m"})
    cols = {"qt_estacoes_metro_500m": "metro_maps_500m", "qt_estacoes_metro_1000m": "metro_maps_1000m",
            "qt_estacoes_trem_1000m": "trem_maps_1000m"}
    base = resumos[["place_id", "nome", "cidade"] + [c for c in cols if c in resumos.columns]].rename(columns=cols)
    comp = base.merge(osm, on="place_id", how="left")
    for raio in RAIOS:
        maps, o = num(comp.get(f"metro_maps_{raio}m")), num(comp[f"metro_osm_{raio}m"])
        comp[f"dif_metro_{raio}m"] = (maps - o).astype("Int64")
    comp["situacao"] = "confere"
    comp.loc[comp["metro_osm_1000m"].isna(), "situacao"] = "fora do B1_entorno.csv"
    comp.loc[comp["metro_maps_1000m"] == "", "situacao"] = "metrô do Maps em branco"
    difere = comp["dif_metro_500m"].fillna(0).ne(0) | comp["dif_metro_1000m"].fillna(0).ne(0)
    comp.loc[difere & (comp["situacao"] == "confere"), "situacao"] = "difere"
    return comp


def montar_fila(resumos):
    alvo = pd.read_csv(OSM, dtype=str, keep_default_na=False)[["place_id", "nome", "lat", "lng"]]
    sem_coleta = alvo[~alvo["place_id"].isin(resumos["place_id"])].assign(motivo="sem coleta")
    pend = resumos[resumos["situacao"] != "ok"][["place_id", "nome", "lat", "lng", "situacao"]].rename(columns={"situacao": "motivo"})
    return pd.concat([sem_coleta, pend], ignore_index=True)


def main():
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[1])
    ap.add_argument("--origem", type=Path, default=Path.home() / "Downloads", help="pasta dos CSV baixados")
    ap.add_argument("--sem-mover", action="store_true", help="não move nada; usa só o que já está em _data/raw")
    args = ap.parse_args()

    if not args.sem_mover:
        print(f"Movidos de {args.origem}: {mover_downloads(args.origem.expanduser())}")

    resumos, resultados = ler_pasta(RESUMOS), ler_pasta(RESULTADOS)
    if resumos.empty:
        raise SystemExit(f"Nenhum resumo em {RESUMOS}.")
    if resultados.empty:
        raise SystemExit(f"Nenhum arquivo de resultados em {RESULTADOS}.")
    resumos, resultados = consolidar(resumos, resultados)

    erros = conferir(resumos, resultados)
    if erros:
        raise SystemExit("Conferência não fecha:\n  " + "\n  ".join(erros))

    PROCESSED.mkdir(parents=True, exist_ok=True)
    resumos.drop(columns=["chave"]).to_csv(PROCESSED / "B1_entorno_maps.csv", sep=";", index=False, encoding="utf-8-sig")
    resultados.drop(columns=["chave"]).to_csv(PROCESSED / "B1_entorno_maps_resultados.csv", sep=";", index=False, encoding="utf-8-sig")
    comp = comparar_osm(resumos)
    comp.to_csv(PROCESSED / "B1_entorno_maps_conferencia_osm.csv", sep=";", index=False, encoding="utf-8-sig")

    fila = montar_fila(resumos)
    # Com cabeçalho e aspas onde o nome tem ";": o campo de fila do userscript lê os dois.
    texto = fila[["place_id", "nome", "lat", "lng"]].to_csv(sep=";", index=False, lineterminator="\n")
    (PROCESSED / "B1_entorno_maps_fila.txt").write_text(texto, encoding="utf-8")
    linhas = texto.splitlines()[1:]
    copiado = False
    if linhas:
        try:
            subprocess.run(["pbcopy"], input=texto.encode(), check=True)
            copiado = True
        except (FileNotFoundError, subprocess.CalledProcessError):
            pass

    print(f"Base: {len(resumos)} estabelecimentos e {len(resultados)} resultados; conferência fecha (diferença 0).")
    print("Situação:")
    for sit, n in resumos["situacao"].value_counts().items():
        print(f"  {sit}: {n}")
    print("Metrô Maps x OSM:")
    for sit, n in comp["situacao"].value_counts().items():
        print(f"  {sit}: {n}")
    print(f"Fila: {len(linhas)} estabelecimentos ({(fila['motivo'] == 'sem coleta').sum()} sem coleta)"
          + (", copiada para a área de transferência." if copiado else "."))


if __name__ == "__main__":
    main()
