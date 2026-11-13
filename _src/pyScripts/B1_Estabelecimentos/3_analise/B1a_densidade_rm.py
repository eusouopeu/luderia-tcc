"""
Bloco B1 - densidade de luderias por 100 mil habitantes da região metropolitana (5.3.1).

O B1 conta cada casa na capital da região metropolitana do endereço; o denominador
é, portanto, a população estimada da região metropolitana inteira (soma dos
municípios da composição do IBGE), e não só a da capital. Manaus entra com zero casa.

Entradas: dados/B4_marketing/_dados-brutos/ibge_rm/Composicao_RM_2025.xlsx (via recorte_rm.py);
          dados/B4_marketing/_dados-agregados/[B4] População Estimada por Município 2026 (IBGE).csv;
          dados/B1_estabelecimentos/_dados-agregados/B1_resumo_estabelecimentos.xlsx
Saída: dados/B1_estabelecimentos/_dados-agregados/4_estatistica_descritiva/B1_densidade_rm.csv

Uso:
    python3 "_src/pyScripts/B1_Estabelecimentos/3_analise/B1a_densidade_rm.py"
"""
# Caminhos: _src/extras/ (log comum) e outros/ do objeto (recorte_rm); log em ../logs/
import sys
from pathlib import Path
_AQUI = Path(__file__).resolve()
sys.path[:0] = [*map(str, (_AQUI.parents[3] / "outros").glob("G[0-9]_*")), str(_AQUI.parents[1] / "5_outros")]
from log_execucao import registrar_execucao  # noqa: E402
if __name__ == "__main__":
    registrar_execucao(__file__)

import pandas as pd
from openpyxl import load_workbook

import recorte_rm as rr

ROOT = _AQUI.parents[4]
POP = ROOT / "dados" / "B4_marketing" / "_dados-agregados" / "[B4] População Estimada por Município 2026 (IBGE).csv"
EST = ROOT / "dados" / "B1_estabelecimentos" / "_dados-agregados"
METROPOLES = ["Belém", "Belo Horizonte", "Brasília", "Curitiba", "Florianópolis", "Fortaleza", "Goiânia",
              "Manaus", "Porto Alegre", "Recife", "Rio de Janeiro", "Salvador", "São Paulo", "Vitória", "Campinas"]


def main():
    ws = load_workbook(rr.RM_PATH, read_only=True).worksheets[0]
    linhas = list(ws.iter_rows(values_only=True))
    comp = pd.DataFrame(linhas[1:], columns=linhas[0])
    pop = pd.read_csv(POP)
    pop = pop[pop["nivel"] != "Brasil"]
    casas = pd.read_excel(EST / "B1_resumo_estabelecimentos.xlsx", sheet_name="estabelecimentos")["capital_endereco"].value_counts()
    assert set(casas.index) <= set(METROPOLES)
    recortes = rr.rms()
    saida = []
    for cap in METROPOLES:
        nome_rm = recortes[cap][0]
        cods = comp.loc[comp["NOME_CATMETROPOL"] == nome_rm, "COD_MUN"].astype(int).unique()
        p = pop.loc[pop["localidade_id"].isin(cods), "valor"].sum()
        assert len(cods) and p > 0, cap
        saida.append(dict(metropole=cap, recorte_ibge=nome_rm, municipios=len(cods), populacao_2026=int(p),
                          casas=int(casas.get(cap, 0)), casas_por_100_mil=round(casas.get(cap, 0) / p * 1e5, 3)))
    d = pd.DataFrame(saida).sort_values("casas_por_100_mil")
    assert d["casas"].sum() == casas.sum(), "soma das casas difere do total do B1"
    caminho = EST / "4_estatistica_descritiva" / "B1_densidade_rm.csv"
    d.to_csv(caminho, index=False)
    print(d.to_string(index=False))
    print(f"total {d['casas'].sum()} casas; OK: {caminho.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
