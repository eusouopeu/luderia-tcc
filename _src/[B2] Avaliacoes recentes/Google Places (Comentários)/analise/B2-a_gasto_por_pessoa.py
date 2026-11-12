"""
Bloco B2 - gasto por pessoa declarado nas avaliações contra a cesta de consumo
de cada casa (B1), para a premissa de gasto por pessoa do cap. 9 (R06).

Cesta de consumo (decisão do autor, 04/11/2026; antes, bebida + entrada ou
prato): taxa de entrada + bebida + hambúrguer da casa. A bebida é a mediana do
cardápio da casa, e o hambúrguer, o mais barato sem ser vegetariano
(B1_resumo_estabelecimentos, aba cesta).

Gasto declarado: campo "preço por pessoa" do Google Maps, pelo ponto médio da
faixa (R$ 80–100 vira R$ 90); "+R$ 200" vira R$ 200, o limite inferior.

Taxa de entrada: média das taxas de cada dia ponderada pelos dias em que cada
uma vale, só nos dias em que a casa abre (aba estabelecimentos); feriados e
vésperas ignorados. Valores e fontes em TAXAS: todas as casas com taxa
conhecida no B1 (cardápio, site, imprensa ou Instagram) e a São Jogue. Recorte
do gasto (R06): casas com taxa conhecida e gasto declarado. A cesta só existe
nas casas do recorte com bebida e hambúrguer no cardápio.

Saída 2: gasto_por_pessoa/B1_cesta_casas_com_taxa.csv, a cesta de todas as casas
com taxa conhecida, com ou sem gasto declarado.

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
    "ChIJTaG5ALpZzpQRUDErQ-RkfTs": ("Ludus Luderia", "Instagram, 01/03/2026",
                                    {"quinta": 38, "sexta": 48, "sabado": 48, "domingo": 42}),
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
                                    "site, 11/11/2026; fim de semana = sábado e domingo; só para quem joga",
                                    {**dict.fromkeys(DIAS[:5], 28), "sabado": 38, "domingo": 38}),
    "ChIJbZRHQPRfzpQRz97-ZOg0yXA": ("Castelos Bar & Boardgames", "Instagram, 27/03/2024 (sem cobrança)", _TODOS(0)),
    "ChIJoTlvBfMbFgcRHvuCKHBQrXQ": ("São Jogue - Bela Vista", "site, turno de 3 h (B1, busca profunda)",
                                    {**dict.fromkeys(DIAS[:4], 22), "sexta": 28, "sabado": 28, "domingo": 28}),
    # demais casas com taxa no cardápio (B1_cardapios_itens_precos.xlsx); dia sem
    # valor divulgado recebe o valor de dia útil
    "ChIJYTHwWgBbzpQRFenbJdM5cxU": ("Arena BG", "rodapé do cardápio",
                                    {**dict.fromkeys(DIAS[:5], 0), "sexta": 12.5, "sabado": 25, "domingo": 25}),
    "ChIJRcWOaPabpgARDvX2Bad0qb0": ("Bardo Mago", "Instagram, 12/02/2026",
                                    {**dict.fromkeys(DIAS[:4], 15), "sexta": 25, "sabado": 25, "domingo": 25}),
    "ChIJZz29dnVXzpQRvRh7_YKyUN4": ("Encounter", "Instagram, 03/01/2026",
                                    {**dict.fromkeys(DIAS[:4], 35), "sexta": 40, "sabado": 45, "domingo": 40}),
    "ChIJu1yUroF_mQAR7qxqAfxKSw4": ("Game Of Boards", "site",
                                    {**dict.fromkeys(DIAS[:4], 15), "sexta": 25, "sabado": 25, "domingo": 25}),
    "ChIJsUAT-dObpgARCT2C5QpnVKU": ("Garagem do Nerd", "Diário do Comércio, 23/06/2024", _TODOS(10)),
    "ChIJOczn8z7l3JQRNBEL_ZJ3iQo": ("Joyjoy Café", "Curitibando em Família, 01/08/2024",
                                    {**dict.fromkeys(DIAS[:5], 10), "sabado": 15, "domingo": 15}),
    "ChIJ-17ZQDG9pgARc-AxpXmaNRU": ("La Tabuleria", "cardápio Saipos (B1)", _TODOS(20)),
    "ChIJzdFNP3AyWpMRH2P6HEuhE-I": ("Loja de Jogos - Asgard", "cardápio (B1)",
                                    {**dict.fromkeys(DIAS[:4], 10), "sexta": 25, "sabado": 25, "domingo": 25}),
    "ChIJ90Gs_9rVmwAReA7MnIyPLTE": ("Luderia Carioca", "Instagram, 07/04/2026", _TODOS(20)),
    "ChIJRUjwU66WoGgRzc9yJU7jkwM": ("Nala Land", "Instagram, 29/04/2026",
                                    {**dict.fromkeys(DIAS[:5], 20), "sabado": 25, "domingo": 25}),
    "ChIJkWsGmd1czpQRGLydxc29vbw": ("Place Games", "Instagram, 31/07/2026 (quinta de confraria grátis)",
                                    {**_TODOS(25), "quinta": 0}),
    "ChIJOcVssmeDmQARZZrnWu2mnwA": ("TabuClub", "Instagram, 27/01/2026",
                                    {**dict.fromkeys(DIAS[:5], 20), "sabado": 25, "domingo": 25}),
    "ChIJ41pgHNFDGZURC7yTegyn7nU": ("Toca do Rato", "Instagram, 04/10/2025", _TODOS(5)),
    "ChIJsU5BAwBRzpQRAgLVvqg68os": ("Tubaleria", "Instagram, 12/03/2026", _TODOS(28)),
    # busca minuciosa de 11/11/2026 (cardapios/B1_busca_minuciosa_taxa_cardapio_acervo.csv)
    "ChIJHSDPTgF5GZURKmSqKITyoGM": ("Arcadea Gaming Pub", "Instagram, 06/10/2026 (isenta com consumo de R$ 60)", _TODOS(15)),
    "ChIJrT_EWwBZzpQRGAZzptZbtsY": ("Cartola Luderia Bar", "Instagram, 30/07/2025", _TODOS(15)),
    "ChIJc3F7ka83J5URQZ1XTl-_iak": ("Chef on Play", "Instagram, 12/01/2026 (sem cobrança)", _TODOS(0)),
    "ChIJyXjE650xWpMRJL-J6QbGkt4": ("FORTALÚDICA - BURGERS & JOGOS", "Instagram, 20/05/2026 (R$ 5 com consumo de R$ 50)",
                                    {**dict.fromkeys(DIAS[:5], 15), "sabado": 20, "domingo": 20}),
    "ChIJ0yXbI35IxwcR0_jLi-uINUU": ("Balboa's Hobby Games",
                                    "Instagram, 30/07/2025; média do esquenta de 3 h (R$ 20) e da diária (R$ 30)", _TODOS(25)),
    "ChIJ1wjBJD7k3JQRQi7trfp_0aQ": ("Vila Celta Hobby Store - Jogos e Café", "Instagram, 30/04/2024 (quarta sem cobrança)",
                                    {"segunda": 5, "terca": 5, "quarta": 0, "quinta": 5, "sexta": 10, "sabado": 10, "domingo": 10}),
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
    ce["bebida_mais_hamburguer"] = ce["bebida_mediana"] + ce["hamburguer_min_nao_veg"]
    es = pd.read_excel(xl, sheet_name="estabelecimentos")
    COLS = ["place_id", "bebida_mediana", "hamburguer_min_nao_veg", "bebida_mais_hamburguer"]

    def taxa(r):
        if r["place_id"] not in TAXAS:
            return pd.Series({"dias_abertos": float("nan"), "taxa_ponderada": float("nan"), "fonte_taxa": ""})
        _, fonte, regra = TAXAS[r["place_id"]]
        abertos = [d for d in DIAS if pd.notna(r[d])]
        falta = [d for d in abertos if d not in regra]
        assert not falta, f"{r['place_id']}: dia aberto sem taxa {falta}"
        return pd.Series({"dias_abertos": len(abertos),
                          "taxa_ponderada": sum(regra[d] for d in abertos) / len(abertos), "fonte_taxa": fonte})

    def montar(base):
        x = base.merge(ce[COLS], on="place_id", how="left").merge(es[["place_id"] + DIAS], on="place_id", how="left")
        x = pd.concat([x, x.apply(taxa, axis=1)], axis=1).drop(columns=DIAS)
        x["cesta_consumo"] = x["bebida_mais_hamburguer"] + x["taxa_ponderada"]
        x["parcela_taxa"] = x["taxa_ponderada"] / x["cesta_consumo"]
        return x

    t = montar(g)
    for k in ("medio", "mediano"):
        t[f"gasto_{k}_por_cesta"] = t[f"gasto_{k}"] / t["cesta_consumo"]
    t["no_recorte"] = t["taxa_ponderada"].notna().map({True: "sim", False: "não"})
    # cesta de todas as casas com taxa conhecida (com ou sem gasto declarado)
    nomes = es[["place_id", "nome", "capital_endereco"]]
    todas = montar(nomes[nomes["place_id"].isin(TAXAS)])
    todas.round(4).to_csv(SAIDA.parent / "B1_cesta_casas_com_taxa.csv", sep=";", index=False, encoding="utf-8-sig")
    tc = todas.dropna(subset=["cesta_consumo"])
    print(f"casas com taxa: {len(todas)}; com cesta: {len(tc)}; cesta média {tc['cesta_consumo'].mean():.2f}; "
          f"taxa média {todas['taxa_ponderada'].mean():.2f}; sem cesta: {todas.loc[todas['cesta_consumo'].isna(), 'nome'].tolist()}")
    t = t.sort_values(["no_recorte", "avaliacoes"], ascending=[False, False])
    SAIDA.parent.mkdir(parents=True, exist_ok=True)
    t.round(4).to_csv(SAIDA, sep=";", index=False, encoding="utf-8-sig")

    u = t[t["no_recorte"] == "sim"]
    print(f"{len(av)} avaliações com faixa em {len(t)} casas; {len(u)} casas no recorte ({u['avaliacoes'].sum()} avaliações)")
    print(f"gasto médio: média {u['gasto_medio'].mean():.2f}, mínimo {u['gasto_medio'].min():.2f} "
          f"({u.loc[u['gasto_medio'].idxmin(), 'nome_estabelecimento']}), máximo {u['gasto_medio'].max():.2f} "
          f"({u.loc[u['gasto_medio'].idxmax(), 'nome_estabelecimento']})")
    uc = u.dropna(subset=["cesta_consumo"])
    print(f"recorte com cesta: {len(uc)} casas; cesta média {uc['cesta_consumo'].mean():.2f}; gasto médio delas "
          f"{uc['gasto_medio'].mean():.2f}; taxa média {uc['taxa_ponderada'].mean():.2f}; "
          f"parcela da taxa {uc['taxa_ponderada'].mean() / uc['cesta_consumo'].mean():.4f}; "
          f"gasto médio ÷ cesta, média das casas {uc['gasto_medio_por_cesta'].mean():.2f}")
    print(f"fora do recorte: {t.loc[t['no_recorte'] == 'não', 'nome_estabelecimento'].tolist()}")
    print(f"OK: {SAIDA.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
