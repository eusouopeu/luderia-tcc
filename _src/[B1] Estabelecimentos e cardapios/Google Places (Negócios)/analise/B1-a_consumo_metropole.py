"""
Bloco B1 - Figura 5.3: consumo por pessoa (bebida mediana + hambúrguer mais barato
não vegetariano) por metrópole, mediana entre as casas com os dois itens no cardápio.

A cesta segue a decisão de 04/11/2026 (hambúrguer no lugar de "uma entrada ou prato").

Entrada: dados/B1_estabelecimentos/_dados-agregados/B1_resumo_estabelecimentos.xlsx (aba cesta)
Saída: textos/capitulos/figuras/5_consumo_por_metropole.png; imprime as estatísticas do texto (5.3.2).

Uso:
    python3 "_src/[B1] Estabelecimentos e cardapios/Google Places (Negócios)/analise/B1-a_consumo_metropole.py"
"""
# Caminhos: _src/extras/ (log comum e estilo dos gráficos); log em ../logs/
import sys
from pathlib import Path
_AQUI = Path(__file__).resolve()
sys.path[:0] = [str(_AQUI.parents[3] / "extras")]
from log_execucao import registrar_execucao  # noqa: E402
if __name__ == "__main__":
    registrar_execucao(__file__)

import pandas as pd

import planilha_estilo as est

ROOT = _AQUI.parents[4]
B1 = ROOT / "dados" / "B1_estabelecimentos" / "_dados-agregados" / "B1_resumo_estabelecimentos.xlsx"
FIG = ROOT / "textos" / "capitulos" / "figuras"


def main():
    c = pd.read_excel(B1, sheet_name="cesta")
    c["consumo"] = c["bebida_mediana"] + c["hamburguer_min_nao_veg"]
    s = c.dropna(subset=["consumo"])
    print(f"{len(s)} casas; mediana R$ {s.consumo.median():.2f}; "
          f"FIQ R$ {s.consumo.quantile(.25):.2f} a R$ {s.consumo.quantile(.75):.2f}; "
          f"de R$ {s.consumo.min():.2f} a R$ {s.consumo.max():.2f}")
    print(s[s.nome.str.contains("Jogue")][["nome", "bebida_mediana", "hamburguer_min_nao_veg", "consumo"]].to_string(index=False))
    cm = s.groupby("capital_endereco").consumo.median().sort_values(ascending=False)
    assert s.groupby("capital_endereco").size().sum() == len(s)
    est.GRAF = FIG
    caminho = est.barras_h("5_consumo_por_metropole", cm.index.tolist(), {"consumo mediano": cm.tolist()},
                           lambda v: est.br(v, 2, pre="R$ "), destaque="Salvador")
    print(cm.to_string())
    print(f"OK: {caminho.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
