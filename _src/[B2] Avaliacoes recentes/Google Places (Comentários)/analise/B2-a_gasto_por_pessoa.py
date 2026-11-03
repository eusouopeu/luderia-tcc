"""
Bloco B2 - gasto por pessoa declarado nas avaliações contra a cesta de consumo
de cada casa (B1), para a premissa de gasto por pessoa do cap. 9 (R06).

Cesta de consumo (decisão do autor, 02/11/2026): bebida + entrada ou prato
principal + taxa de entrada da casa. Bebida e entrada ou prato são as medianas
do cardápio da casa (B1_resumo_estabelecimentos, aba cesta).

Gasto declarado: campo "preço por pessoa" do Google Maps, pelo ponto médio da
faixa (R$ 80–100 vira R$ 90); "+R$ 200" vira R$ 200, o limite inferior.

Taxa de entrada: média das taxas de cada dia ponderada pelos dias em que cada
uma vale, só nos dias em que a casa abre (aba estabelecimentos); feriados e
vésperas ignorados. Valores e fontes em TAXAS. Ficam de fora as casas sem
taxa conhecida ou sem cesta no cardápio.

Entradas: B2_avaliacoes_periodo.csv; B1_resumo_estabelecimentos.xlsx
Saída: dados/[B2] Avaliacoes recentes/gasto_por_pessoa/B2_gasto_cesta_por_casa.csv
       (uma linha por casa com gasto declarado; a soma de avaliacoes fecha com o
       total de avaliações com faixa de preço)

Uso:
    python3 "_src/[B2] Avaliacoes recentes/Google Places (Comentários)/analise/B2-a_gasto_por_pessoa.py"
"""
# Caminhos: _src/extras/ (log comum); log em ../logs/
import sys
from pathlib import Path
_AQUI = Path(__file__).resolve()
sys.path[:0] = [str(_AQUI.parents[3] / "extras")]
from log_execucao import registrar_execucao  # noqa: E402
if __name__ == "__main__":
    registrar_execucao(__file__)

import re

import pandas as pd

ROOT = Path(__file__).resolve().parents[4]
B1 = ROOT / "dados" / "[B1] Estabelecimentos e cardapios"
B2 = ROOT / "dados" / "[B2] Avaliacoes recentes"
SAIDA = B2 / "gasto_por_pessoa" / "B2_gasto_cesta_por_casa.csv"
DIAS = ["segunda", "terca", "quarta", "quinta", "sexta", "sabado", "domingo"]

# taxa de entrada por dia da semana, por casa (place_id do B1), com a fonte
_TODOS = lambda v: dict.fromkeys(DIAS, v)  # noqa: E731
TAXAS = {
    "ChIJ6ZLMZw-XpgAR_OR6SwY5xKo": ("Shelf Bar e Jogos", "cardápio (B1)",
                                    {"terca": 15, "quarta": 20, "quinta": 20, "sexta": 30, "sabado": 30, "domingo": 30}),
    "ChIJ_aN4OAxXzpQR0UH63sAeVCA": ("Fan Hour Games and Burgers", "São Paulo para Crianças, 05/10/2026", _TODOS(20)),
    "ChIJTaG5ALpZzpQRUDErQ-RkfTs": ("Ludus Luderia", "CNN Brasil, 02/10/2024 (o site diz que não cobra)",
                                    {"quarta": 34, "quinta": 34, "sexta": 44, "sabado": 44, "domingo": 38}),
    "ChIJY_lqHVLl3JQRvDHacOMDKuc": ("BoardZ Game Pub", "site, Day Pass (opcional; a casa também cobra por jogo)",
                                    {"terca": 10, "quarta": 10, "quinta": 10, "sexta": 15, "sabado": 15, "domingo": 15}),
    "ChIJ-97tiEeNpJIRb_eV7a-sxBs": ("Ludoteca Sidequest", "site",
                                    {"quarta": 23, "quinta": 23, "sexta": 28, "sabado": 28, "domingo": 28}),
    "ChIJ7_DDAlH1zpQRJVJ0UHnItH8": ("Covil Game Bar", "Instagram, 29/04/2024 (perfil de mais de uma unidade)",
                                    {"quarta": 15, "quinta": 15, "domingo": 15, "sexta": 20, "sabado": 20}),
    "ChIJx5jr3zGXpgARQGx9eX7TDmY": ("LudoCafé", "cartaz, jul/2024; com consumo mínimo de R$ 50, que a cesta da casa passa",
                                    {"terca": 10, "quarta": 10, "quinta": 10, "sexta": 20, "sabado": 20, "domingo": 20}),
    "ChIJfyav9YI9uAARjwbBqcRm2_k": ("Café Geek Cafeteria e Ludoteca",
                                    "cardápio (B1); mediana dos 5 níveis do Ludoporte, que varia por nível e não por dia",
                                    _TODOS(10)),
    "ChIJpzB8zc2XpgARoJTUu90J6Pw": ("Comdado Bar e Jogos", "cardápio (B1)",
                                    {"quarta": 15, "quinta": 15, "sexta": 20, "sabado": 20, "domingo": 20}),
    "ChIJKeHwNv5ZzpQRlmzx9rCTWdM": ("Bodogami Restaurante e Cafeteria",
                                    "CNN Brasil, 02/10/2024; fim de semana = sábado e domingo; só para quem joga",
                                    {**dict.fromkeys(DIAS[:5], 25), "sabado": 35, "domingo": 35}),
    "ChIJbZRHQPRfzpQRz97-ZOg0yXA": ("Castelos Bar & Boardgames", "QuintoAndar, 23/09/2025 (sem cobrança)", _TODOS(0)),
    "ChIJoTlvBfMbFgcRHvuCKHBQrXQ": ("São Jogue - Bela Vista", "site, turno de 3 h (B1, busca profunda)",
                                    {**dict.fromkeys(DIAS[:4], 22), "sexta": 28, "sabado": 28, "domingo": 28}),
}


def ponto_medio(faixa: str) -> float:
    n = [float(x) for x in re.findall(r"\d+", faixa)]
    return n[0] if faixa.startswith("+") else (n[0] + n[1]) / 2


def main():
    av = pd.read_csv(B2 / "B2_avaliacoes_periodo.csv", sep=";", dtype=str)
    av = av[av["preco_por_pessoa"].notna()].copy()
    av["gasto"] = av["preco_por_pessoa"].map(ponto_medio)
    g = (av.groupby(["place_id", "nome_estabelecimento"])["gasto"]
         .agg(avaliacoes="size", gasto_medio="mean", gasto_mediano="median").reset_index())
    assert g["avaliacoes"].sum() == len(av), "casas não fecham com o total de avaliações com faixa"

    xl = B1 / "estabelecimentos" / "B1_resumo_estabelecimentos.xlsx"
    ce = pd.read_excel(xl, sheet_name="cesta")
    ce["bebida_mais_entrada_ou_prato"] = ce["bebida_mediana"] + ce["entrada_ou_prato_mediana"]
    es = pd.read_excel(xl, sheet_name="estabelecimentos")
    t = (g.merge(ce[["place_id", "bebida_mediana", "entrada_ou_prato_mediana", "bebida_mais_entrada_ou_prato"]],
                 on="place_id", how="left")
         .merge(es[["place_id"] + DIAS], on="place_id", how="left"))

    def taxa(r):
        if r["place_id"] not in TAXAS:
            return pd.Series({"dias_abertos": float("nan"), "taxa_ponderada": float("nan"), "fonte_taxa": ""})
        _, fonte, regra = TAXAS[r["place_id"]]
        abertos = [d for d in DIAS if pd.notna(r[d])]
        falta = [d for d in abertos if d not in regra]
        assert not falta, f"{r['nome_estabelecimento']}: dia aberto sem taxa {falta}"
        return pd.Series({"dias_abertos": len(abertos),
                          "taxa_ponderada": sum(regra[d] for d in abertos) / len(abertos), "fonte_taxa": fonte})

    t = pd.concat([t, t.apply(taxa, axis=1)], axis=1).drop(columns=DIAS)
    t["cesta_consumo"] = t["bebida_mais_entrada_ou_prato"] + t["taxa_ponderada"]
    t["parcela_taxa"] = t["taxa_ponderada"] / t["cesta_consumo"]
    for k in ("medio", "mediano"):
        t[f"gasto_{k}_por_cesta"] = t[f"gasto_{k}"] / t["cesta_consumo"]
    t["no_recorte"] = t["cesta_consumo"].notna().map({True: "sim", False: "não"})
    t = t.sort_values(["no_recorte", "avaliacoes"], ascending=[False, False])
    SAIDA.parent.mkdir(parents=True, exist_ok=True)
    t.round(4).to_csv(SAIDA, sep=";", index=False, encoding="utf-8-sig")

    u = t[t["no_recorte"] == "sim"]
    print(f"{len(av)} avaliações com faixa em {len(t)} casas; {len(u)} casas no recorte ({u['avaliacoes'].sum()} avaliações)")
    print(f"gasto médio: média {u['gasto_medio'].mean():.2f}, mínimo {u['gasto_medio'].min():.2f} "
          f"({u.loc[u['gasto_medio'].idxmin(), 'nome_estabelecimento']}), máximo {u['gasto_medio'].max():.2f} "
          f"({u.loc[u['gasto_medio'].idxmax(), 'nome_estabelecimento']})")
    print(f"cesta de consumo média {u['cesta_consumo'].mean():.2f}; taxa média {u['taxa_ponderada'].mean():.2f}; "
          f"parcela da taxa {u['taxa_ponderada'].mean() / u['cesta_consumo'].mean():.4f}; "
          f"gasto médio ÷ cesta, média das casas {u['gasto_medio_por_cesta'].mean():.2f}")
    print(f"fora do recorte: {t.loc[t['no_recorte'] == 'não', 'nome_estabelecimento'].tolist()}")
    print(f"OK: {SAIDA.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
