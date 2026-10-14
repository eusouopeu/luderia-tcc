"""
Bloco B1 - snowball pelo Instagram: junta as listas "seguindo" das luderias
(sementes) e conta, para cada conta seguida, quantas sementes a seguem
(grau de entrada). Conta seguida por várias luderias tende a ser outra
luderia, loja, editora ou evento do meio, e não uma pessoa qualquer.

Para que serve: achar casas fora da lista do B1 e medir a cobertura da busca
no Google Maps (B1-a_instagram_snowball.py). Não é amostra probabilística.

Entrada (fora do git: a lista traz @ de pessoas físicas):
  dados/[B1] Estabelecimentos e cardapios/_dados-brutos/redes_sociais/seguindo/**/
      AAAA-MM-DD_<perfil>_instagram_seguindo.csv   (coletor do Instagram, bloco "Snowball")

Regras:
  - unidade = par (semente, conta seguida); a mesma semente coletada em dois dias
    fica só com o arquivo mais recente;
  - grau de entrada = nº de sementes distintas que seguem a conta; a semente não
    conta a si mesma;
  - situação, por atributo da própria conta, numa só categoria, na ordem:
    "aprovada no B1" (@ em B1_instagram_aprovadas.csv ou ALIAS) >
    "na curadoria do Maps" (@ em B1_curadoria.csv, busca do Google Places) >
    "no Acervo de Jogos" (@ em B1_acervodejogos_lojas.csv) > "nova";
  - minimização (LGPD): só contas seguidas por ao menos CORTE_GRAVAR sementes
    vão para a lista de candidatos; as demais ficam só no bruto e entram nas
    contagens agregadas.

Saídas:
  _dados-brutos/redes_sociais/snowball/B1_snowball_candidatos.csv  (fora do git)
      uma linha por conta com grau >= CORTE_GRAVAR, com as colunas de
      classificação manual (classe, metropole, avaliacoes_maps, observacao),
      preservadas de uma execução para a outra;
  redes_sociais/snowball/B1_snowball_sementes.csv
      uma linha por semente: capturados, declarados e % capturada;
  redes_sociais/snowball/B1_snowball_grau.csv
      nº de contas por grau de entrada (fecha com o total de contas distintas);
  redes_sociais/snowball/B1_snowball_grau_aprovadas.csv
      grau de entrada de cada casa aprovada (base da sensibilidade); casa com
      dois @ fica com o maior grau.

Classificação manual (coluna classe), uma por conta; casas aprovadas já entram
com o tipo do B1:
  casa de jogos | loja com espaço de jogo | loja sem espaço de jogo |
  editora ou distribuidora | evento, grupo ou associação |
  criador ou influenciador | pessoa | outro
metropole: capital da região metropolitana do endereço (uma das 14 do B1) ou "fora".
avaliacoes_maps: nº de avaliações no Google Maps; vazio se o lugar não está no Maps.

Uso:
    python3 "_src/[B1] Estabelecimentos e cardapios/Instagram/build/B1-b_instagram_seguindo.py"
"""
# Caminhos: _src/extras/ (log comum) e outros/ do objeto (auxiliares); log em ../logs/
import sys
from pathlib import Path
_AQUI = Path(__file__).resolve()
sys.path[:0] = [str(_AQUI.parents[3] / "extras"), str(_AQUI.parents[1] / "outros")]
from log_execucao import registrar_execucao  # noqa: E402
if __name__ == "__main__":
    registrar_execucao(__file__)

import re

import pandas as pd

import instagram_comum as ic
import snowball_comum as sc

CORTE_GRAVAR = 2
# Termos no @ ou no nome que sugerem negócio do meio (filtro de leitura, não de inclusão).
TERMOS = re.compile(r"ludo|luder|jog|game|board|tabul|meeple|dado|tavern|covil|rpg|geek|nerd|card|tcg|"
                    r"\bbar\b|pub|cafe|play|hobby|arena|guild|clube|club", re.ASCII)
RE_ARQUIVO = re.compile(r"^(?P<data>\d{4}-\d{2}-\d{2})_(?P<perfil>.+?)_instagram_seguindo(?:_\d+)?\.csv$")


def handle(texto):
    """@ a partir de usuário ou link do Instagram."""
    m = re.search(r"instagram\.com/([A-Za-z0-9._]+)", str(texto))
    t = m.group(1) if m else str(texto).strip().lstrip("@")
    return t.lower().strip("/") if re.fullmatch(r"[A-Za-z0-9._]+", t or "") else ""


def conhecidos():
    """@ conhecidos por fonte, para a coluna situacao."""
    apr = set(ic.casas()["perfil"])
    cur = pd.read_csv(sc.CURADORIA, dtype=str).fillna("")
    acv = pd.read_csv(sc.ACERVO_LOJAS, dtype=str).fillna("")
    cur_h = {handle(x) for x in cur["instagram_usuario"]} - {""}
    acv_h = {handle(x) for v in acv["instagram"] for x in str(v).split()} - {""}
    return apr, cur_h, acv_h


def carrega_listas():
    arquivos = {}
    for f in sorted(sc.BRUTOS_SEGUINDO.rglob("*_instagram_seguindo*.csv")):
        m = RE_ARQUIVO.match(f.name)
        if not m:
            continue
        semente = m["perfil"].lower()
        # Mais recente vence; empate de data: o de nome maior (_2).
        if semente not in arquivos or (m["data"], f.name) > (arquivos[semente][0], arquivos[semente][1].name):
            arquivos[semente] = (m["data"], f)
    partes = []
    for semente, (data, f) in arquivos.items():
        d = pd.read_csv(f, sep=";", dtype=str, encoding="utf-8-sig").fillna("")
        d["perfil_semente"] = semente
        d["data_coleta"] = data
        partes.append(d)
    if not partes:
        raise SystemExit(f"nenhuma lista em {sc.BRUTOS_SEGUINDO}")
    pares = pd.concat(partes, ignore_index=True)
    pares["seguido"] = pares["seguido"].str.lower()
    pares = pares[pares["seguido"] != pares["perfil_semente"]]
    return pares.drop_duplicates(["perfil_semente", "seguido"]), arquivos


def main():
    sc.SAIDA.mkdir(parents=True, exist_ok=True)
    sc.BRUTOS_SNOWBALL.mkdir(parents=True, exist_ok=True)
    pares, arquivos = carrega_listas()
    sementes = sorted(arquivos)
    print(f"sementes: {len(sementes)} | pares semente-seguido: {len(pares)} | contas distintas: {pares['seguido'].nunique()}")

    sem = pares.groupby("perfil_semente").agg(
        data_coleta=("data_coleta", "first"), n_capturados=("seguido", "size"),
        n_seguindo_declarado=("n_seguindo_declarado", "first"))
    decl = pd.to_numeric(sem["n_seguindo_declarado"], errors="coerce")
    sem["capturado_pct"] = (100 * sem["n_capturados"] / decl).round(1)
    sem.to_csv(sc.SAIDA / "B1_snowball_sementes.csv", sep=";")
    ic.conferir_soma(sem["n_capturados"], len(pares), "pares por semente")
    incompletas = sem[sem["capturado_pct"] < 95]
    if len(incompletas):
        print("sementes com menos de 95% da lista capturada:", incompletas["capturado_pct"].to_dict())

    grau = pares.groupby("seguido").agg(
        n_sementes=("perfil_semente", "nunique"),
        sementes=("perfil_semente", lambda s: ", ".join(sorted(s))),
        nome=("nome", lambda s: next((x for x in s if x), "")),
        verificado=("verificado", lambda s: next((x for x in s if x), "")))
    grau["pct_sementes"] = (100 * grau["n_sementes"] / len(sementes)).round(1)

    dist = grau["n_sementes"].value_counts().sort_index().rename("contas").to_frame()
    dist.index.name = "n_sementes que seguem"
    dist.to_csv(sc.SAIDA / "B1_snowball_grau.csv", sep=";")
    ic.conferir_soma(dist["contas"], len(grau), "contas por grau")

    casas = ic.casas()
    casas["n_sementes"] = casas["perfil"].map(grau["n_sementes"]).fillna(0).astype(int)
    casas["eh_semente"] = casas["perfil"].isin(sementes)
    por_casa = casas.sort_values("n_sementes").groupby("estabelecimento").agg(
        perfil=("perfil", "last"), tipo_casa=("tipo_casa", "first"), capital=("capital", "first"),
        n_sementes=("n_sementes", "max"), eh_semente=("eh_semente", "max"))
    por_casa["eh_semente"] = por_casa["eh_semente"].map({True: "sim", False: "não"})
    por_casa.to_csv(sc.SAIDA / "B1_snowball_grau_aprovadas.csv", sep=";")

    apr, cur_h, acv_h = conhecidos()
    cand = grau[grau["n_sementes"] >= CORTE_GRAVAR].copy()
    cand["eh_semente"] = ["sim" if u in sementes else "não" for u in cand.index]
    cand["situacao"] = [
        "aprovada no B1" if u in apr else "na curadoria do Maps" if u in cur_h
        else "no Acervo de Jogos" if u in acv_h else "nova" for u in cand.index]
    cand["termo_no_nome"] = [
        (m.group(0) if (m := TERMOS.search(ic.sem_acento(f"{u} {n}"))) else "") for u, n in zip(cand.index, cand["nome"])]
    for col in sc.COLS_MANUAIS:
        cand[col] = ""
    # Preserva a classificação manual já feita.
    if sc.CANDIDATOS.exists():
        velho = pd.read_csv(sc.CANDIDATOS, sep=";", dtype=str).fillna("").set_index("seguido")
        for col in sc.COLS_MANUAIS:
            if col in velho.columns:
                cand[col] = velho[col].reindex(cand.index).fillna("")
    # Casa aprovada já tem tipo no B1: entra classificada.
    tipo_apr = casas.drop_duplicates("perfil").set_index("perfil")["tipo_casa"]
    vazia = (cand["classe"] == "") & cand.index.isin(tipo_apr.index)
    cand.loc[vazia, "classe"] = tipo_apr.reindex(cand.index[vazia]).values
    cand.index.name = "seguido"
    cand = cand.sort_values(["n_sementes", "situacao"], ascending=[False, True])
    cand.to_csv(sc.CANDIDATOS, sep=";")
    print(f"\ncandidatos (seguidos por {CORTE_GRAVAR}+ sementes): {len(cand)} | "
          f"classificados: {(cand['classe'] != '').sum()}")
    print(cand.groupby("situacao").size().to_string())
    novas = cand[(cand["situacao"] == "nova") & (cand["termo_no_nome"] != "")]
    print(f"\nnovas com termo do meio no nome: {len(novas)} (as 15 mais seguidas)")
    print(novas[["nome", "n_sementes", "termo_no_nome"]].head(15).to_string())


if __name__ == "__main__":
    main()
