"""
Bloco B4 - Figura 5.1: renda do trabalho nas regiões metropolitanas com luderia
no B1 (PNAD Contínua, tabela 5436, último trimestre coletado).

A comparação usa a região metropolitana, e não o município da capital, porque o
B1 conta as luderias pela capital da região metropolitana do endereço, e algumas
capitais têm pouca população dentro do limite municipal. Brasília entra pelo
Distrito Federal (a PNAD Contínua não publica a RIDE).

Entradas: dados/B4_marketing/_dados-agregados/[B4] Renda do Trabalho por
          Região Metropolitana 2024-2026 (IBGE PNADC).csv;
          dados/B1_estabelecimentos/_dados-agregados/B1_resumo_estabelecimentos.xlsx (metrópoles com luderia)
Saída: textos/graficos/5-2_renda_trabalho_rm.png; imprime a posição de Salvador.

Uso:
    python3 "_src/pyScripts/B4_Marketing/3_analise/B4-a_renda_rm.py"
"""
# Caminhos: _src/extras/ (log comum e estilo dos gráficos); log em ../logs/
import sys
from pathlib import Path
_AQUI = Path(__file__).resolve()
sys.path[:0] = [*map(str, (_AQUI.parents[3] / "outros").glob("G[0-9]_*"))]
from log_execucao import registrar_execucao  # noqa: E402
if __name__ == "__main__":
    registrar_execucao(__file__)

import pandas as pd

import planilha_estilo as est

ROOT = _AQUI.parents[4]
ENTRADA = ROOT / "dados" / "B4_marketing" / "_dados-agregados" / "[B4] Renda do Trabalho por Região Metropolitana 2024-2026 (IBGE PNADC).csv"
B1 = ROOT / "dados" / "B1_estabelecimentos" / "_dados-agregados" / "B1_resumo_estabelecimentos.xlsx"
FIG = ROOT / "textos" / "graficos"
VARIAVEL = 5932  # rendimento médio real habitual do trabalho principal


def main():
    d = pd.read_csv(ENTRADA)
    d = d[(d["variavel_id"] == VARIAVEL) & (d["nivel"] != "Brasil")]
    tri = d["periodo"].max()
    d = d[d["periodo"] == tri].copy()
    d["metropole"] = d["localidade"].str.replace(r" \(DF\)| - [A-Z]{2}$", "", regex=True).str.replace("Grande ", "")
    com_luderia = set(pd.read_excel(B1, sheet_name="estabelecimentos")["capital_endereco"])
    d = d.sort_values("valor", ascending=False).reset_index(drop=True)
    d["posicao_geral"] = d.index + 1
    b1 = d[d["metropole"].isin(com_luderia)].reset_index(drop=True)
    # A PNAD Contínua não divulga a RM de Campinas (15ª metrópole da REGIC, no B1 desde 12/11/2026):
    # ela fica fora do gráfico e o texto declara "N com dado entre as M com luderia".
    sem_dado = sorted(com_luderia - set(b1["metropole"]))
    assert set(sem_dado) <= {"Campinas"}, f"metrópole sem renda: {sem_dado}"
    if sem_dado:
        print(f"sem dado na PNAD Contínua: {', '.join(sem_dado)} ({len(b1)} com dado entre {len(com_luderia)} metrópoles com luderia)")
    est.GRAF = FIG
    caminho = est.barras_h("5-2_renda_trabalho_rm", b1["metropole"].tolist(), {"renda do trabalho": b1["valor"].tolist()},
                           lambda v: est.br(v, 0, pre="R$ "), destaque="Salvador")
    s = d[d["metropole"] == "Salvador"].iloc[0]
    print(f"trimestre {tri}; Salvador R$ {s['valor']:.0f}: {s['posicao_geral']}º de {len(d)} (RMs e DF); "
          f"{b1.index[b1['metropole'] == 'Salvador'][0] + 1}º de {len(b1)} com luderia no B1")
    print(b1[["metropole", "valor"]].to_string(index=False))
    print(f"OK: {caminho.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
