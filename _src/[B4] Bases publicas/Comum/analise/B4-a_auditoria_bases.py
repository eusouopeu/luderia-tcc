"""
Bloco B4 - lista de reconciliação das bases públicas com o portal de origem
(_instrucoes/4_metodologia.md §3.4, "Bloco B4 - bases públicas").

A validação do B4 é exaustiva: cada série usada no plano é conferida no portal
em ao menos um período e um recorte. O script sorteia, com semente fixa, UMA
linha de cada série de cada arquivo processado (série = valor da coluna
`serie`, `codigo_sgs`, `variavel`, `indicador` ou `anexo`, quando houver; sem
essa coluna, o arquivo é uma série). A linha sorteada traz o período e o
recorte geográfico a conferir.

Entrada: dados/[B4] Bases publicas/<uso>/[B4] *.csv (saídas dos B4-b_*)
Saídas: dados/[B4] Bases publicas/_dados-brutos/<fonte>/auditoria/B4_auditoria_<fonte>.csv,
  uma por pasta de fonte (bcb, caged, concla, fipezap, ibge_censo_2022,
  ibge_sidra, legislacao), mais auditoria_registro.csv em cada uma.

Conferência: abrir portal, achar o mesmo período e recorte, anotar
valor_no_portal e marcar confere (sim/nao), atento a unidade (mil, milhão, %)
e a deflação.

Fica em Comum/analise/ porque vale para todas as fontes do bloco; o log vai
para Comum/logs/.

Uso:
    python3 "_src/[B4] Bases publicas/Comum/analise/B4-a_auditoria_bases.py"
"""
# Caminhos: _src/extras/ (log comum e sorteio); log em ../logs/ (Comum/logs/)
import sys
from pathlib import Path
_AQUI = Path(__file__).resolve()
sys.path[:0] = [str(_AQUI.parents[3] / "extras")]
from log_execucao import registrar_execucao  # noqa: E402
if __name__ == "__main__":
    registrar_execucao(__file__)

import re

import pandas as pd

import amostrar_auditoria as aa

ROOT = Path(__file__).resolve().parents[4]
PROCESSADOS = ROOT / "dados" / "[B4] Bases publicas"
BRUTOS = PROCESSADOS / "_dados-brutos"
USOS = ["mercado_demanda", "ponto_operacoes", "juridico_tributario", "financeiro", "multiuso"]

SEMENTE = 20261015
COLUNAS_SERIE = ["serie", "codigo_sgs", "variavel", "indicador", "anexo"]
CONFERIR = ["valor_no_portal", "confere"]
# Fonte entre parênteses no nome do arquivo -> pasta dos brutos e portal de conferência.
FONTES = [
    ("BCB", "bcb", "https://www3.bcb.gov.br/sgspub/ (séries SGS) ou https://www.bcb.gov.br/publicacoes/focus"),
    ("FipeZap", "fipezap", "https://www.fipe.org.br/pt-br/indices/fipezap/"),
    ("CAGED", "caged", "https://pdet.mte.gov.br/novo-caged"),
    ("CONCLA", "concla", "https://concla.ibge.gov.br/busca-online-cnae.html"),
    ("Simples Nacional", "legislacao", "https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp123.htm (anexos da LC 123/2006)"),
    ("IBGE Censo", "ibge_censo_2022", "https://sidra.ibge.gov.br/pesquisa/censo-demografico/demografico-2022/inicial"),
    ("IBGE", "ibge_sidra", "https://sidra.ibge.gov.br/"),
]


def fonte_do_arquivo(nome: str):
    m = re.search(r"\(([^)]+)\)\.csv$", nome)
    rotulo = m.group(1) if m else ""
    for prefixo, pasta, portal in FONTES:
        if rotulo.startswith(prefixo):
            return pasta, portal
    return None, ""


def linhas_sorteadas(caminho: Path) -> pd.DataFrame:
    d = pd.read_csv(caminho, sep=None, engine="python", dtype=str, encoding="utf-8-sig")
    d["linha_arquivo"] = range(2, len(d) + 2)
    col = next((c for c in COLUNAS_SERIE if c in d), None)
    d["serie_auditada"] = d[col].fillna("") if col else "(arquivo inteiro)"
    d["id_linha"] = caminho.name + ":" + d.linha_arquivo.astype(str)
    amostra = aa.sortear(d.drop_duplicates("id_linha"), "id_linha", d.serie_auditada.nunique(), SEMENTE,
                         estrato="serie_auditada", minimo=1)
    dados = [c for c in d.columns if c not in ("linha_arquivo", "serie_auditada", "id_linha")]
    amostra["valores"] = amostra[dados].apply(
        lambda r: " | ".join(f"{c}={v}" for c, v in r.items() if pd.notna(v) and v != ""), axis=1)
    amostra["arquivo"] = f"{caminho.parent.name}/{caminho.name}"
    return amostra[["estrato_sorteio", "chave_sorteio", "arquivo", "linha_arquivo", "serie_auditada", "valores"]]


def main():
    por_pasta, origens, populacao = {}, {}, {}
    for uso in USOS:
        for f in sorted((PROCESSADOS / uso).glob("*.csv")):
            pasta, portal = fonte_do_arquivo(f.name)
            if not pasta:
                print(f"AVISO: fonte não reconhecida em {f.name}; arquivo fora da lista")
                continue
            a = linhas_sorteadas(f)
            a.insert(5, "portal", portal)
            por_pasta.setdefault(pasta, []).append(a)
            origens.setdefault(pasta, []).append(f)
            populacao[pasta] = populacao.get(pasta, 0) + 1
    for pasta, partes in sorted(por_pasta.items()):
        tabela = pd.concat(partes, ignore_index=True)
        aa.gravar(tabela, BRUTOS / pasta / "auditoria", f"B4_auditoria_{pasta}.csv", CONFERIR, script=__file__,
                  semente=SEMENTE, populacao=populacao[pasta], origem=origens[pasta],
                  desenho="uma linha sorteada por série de cada arquivo processado (reconciliação exaustiva)")
        print(f"{pasta}: {populacao[pasta]} arquivos, {len(tabela)} séries a conferir")
    print(f"total: {sum(populacao.values())} arquivos, {sum(len(pd.concat(p)) for p in por_pasta.values())} linhas")


if __name__ == "__main__":
    main()
