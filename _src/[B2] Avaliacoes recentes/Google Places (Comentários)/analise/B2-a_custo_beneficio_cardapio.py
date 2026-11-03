"""
Bloco B2 - estimativa do custo-benefício de quatro posições para a luderia do
plano (pedido do autor, 03/11/2026): cardápio de qualidade (preço do grupo de
casas de consumo caro), preço baixo, acervo maior e ambiente.

Margem de contribuição por pessoa = A&B × (1 − CMV) + taxa de entrada
− (Simples + cartão) × (A&B + taxa).

Fontes:
  - CMV por categoria: Abrasel, "Custo de mercadoria vendida (CMV) para bares e
    restaurantes", jan/2026, seção 6 (N4): pratos de 25% a 40%; bebidas não
    alcoólicas de 10% a 30%; chope e cervejas de 30% a 35%; destilados de 10%
    a 20%. Bebida do cardápio = mistura das três; usa-se o meio do intervalo
    conjunto (25%), com 20% e 32,5% nas pontas.
  - Preços e gasto: B1 (bebida e entrada ou prato medianos por casa) e B2
    (gasto declarado), por grupo de casas de B2-a_retorno_e_clusters.py, média
    das casas (cada casa pesa igual; a Bodogami não domina).
  - Plano (cap. 9, Tabela 9.2, cenário provável, mês maduro): 942 pessoas por
    mês, taxa de entrada de R$ 19,83 por pessoa, Simples de 9,24% e cartão de
    3,0% da receita bruta. Cozinheiro-chefe: R$ 1.700 (cap. 7), encargos de 37%
    (C07).
  - Acervo: B1_cesta_jogos.xlsx, aba acervo_inicial (joelho e mediana), vida
    útil de 5 anos e reposição de 10% ao ano (C13 provável).
Premissas do autor (N6): o cardápio de qualidade custa 40% em pratos (topo da
faixa da Abrasel) e pede cozinheiros com salário 50% maior; o preço baixo corta
15% do A&B sem mudar o custo em reais; ambiente é medido por R$ 10 mil
investidos, sem orçamento no B5.

Saída: dados/[B2] Avaliacoes recentes/retorno_e_clusters/B2_custo_beneficio_posicoes.csv

Uso:
    python3 "_src/[B2] Avaliacoes recentes/Google Places (Comentários)/analise/B2-a_custo_beneficio_cardapio.py"
"""
# Caminhos: _src/extras/ (log comum); log em ../logs/
import sys
from pathlib import Path
_AQUI = Path(__file__).resolve()
sys.path[:0] = [str(_AQUI.parents[3] / "extras")]
from log_execucao import registrar_execucao  # noqa: E402
if __name__ == "__main__":
    registrar_execucao(__file__)

import re  # noqa: E402

import numpy as np  # noqa: E402
import pandas as pd  # noqa: E402

ROOT = Path(__file__).resolve().parents[4]
B2 = ROOT / "dados" / "[B2] Avaliacoes recentes"
PASTA = B2 / "retorno_e_clusters"
BASE = B2 / "_dados-brutos" / "analise_conteudo" / "2026-11-03_2_comentarios_grade2.csv"
ACERVO = ROOT / "dados" / "[B1] Estabelecimentos e cardapios" / "acervo_jogos" / "B1_cesta_jogos.xlsx"

PESSOAS = 942            # cap. 9, provável, mês maduro
TAXA = 19.83             # R$ por pessoa (18.679,17 ÷ 942)
IMPOSTO_CARTAO = 0.0924 + 0.030
SALARIO_COZINHA, N_COZINHA, ENCARGOS = 1700.0, 2, 0.37
ACRESCIMO_COZINHA = 0.50  # N6
CMV_BEBIDA = {"pessimista": 0.325, "provavel": 0.25, "otimista": 0.20}
CMV_PRATO = {"pessimista": 0.375, "provavel": 0.325, "otimista": 0.275}  # cardápio comum
CMV_PRATO_QUALIDADE = 0.40
CORTE_PRECO = 0.15
MESES_VIDA = 60
REPOSICAO_ACERVO = 0.10


def chave(n):
    return re.sub(r"[^a-z0-9à-ü]+", " ", str(n).lower()).strip()


def gasto(v):
    if pd.isna(v):
        return np.nan
    s = str(v)
    n = [float(x) for x in re.findall(r"\d+", s)]
    return n[0] if s.startswith("+") or s.endswith("+") else ((n[0] + n[1]) / 2 if len(n) >= 2 else n[0])


def grupos():
    c = pd.read_csv(PASTA / "B2_cluster_casas.csv", sep=";")
    c = c[c["no_agrupamento"] == "sim"].copy()
    d = pd.read_csv(BASE)
    d["gasto"] = d["Preço por pessoa (R$)"].map(gasto)
    d["k"] = d["Estabelecimento"].map(chave)
    d["comida_elogio"] = d["Itens positivos"].fillna("").str.contains("comida")
    d["comida_critica"] = d["Itens negativos"].fillna("").str.contains("comida")
    a = d.groupby("k").agg(gasto=("gasto", "mean"), nota_comida=("Comida", "mean"),
                           comida_elogio=("comida_elogio", "mean"), comida_critica=("comida_critica", "mean"))
    c = c.merge(a, left_on=c["nome"].map(chave), right_index=True, how="left")
    c["ab_gasto"] = c["gasto"] - c["taxa_media_dia"]
    g = c.groupby("grupo").agg(casas=("nome", "size"), bebida=("bebida_mediana", "mean"),
                               prato=("entrada_ou_prato_mediana", "mean"), consumo=("consumo_por_pessoa", "mean"),
                               casas_com_gasto=("gasto", "count"), gasto_declarado=("gasto", "mean"),
                               ab_declarado=("ab_gasto", "mean"), nota_comida=("nota_comida", "mean"),
                               comida_elogio=("comida_elogio", "mean"), comida_critica=("comida_critica", "mean"))
    return g


def margem(ab, pct_bebida, cmv_bebida, cmv_prato, taxa=TAXA):
    cmv = pct_bebida * cmv_bebida + (1 - pct_bebida) * cmv_prato
    return ab * (1 - cmv) + taxa - IMPOSTO_CARTAO * (ab + taxa), cmv


def main():
    g = grupos()
    barato, caro = g.loc[1], g.loc[2]
    print(g.round(2).to_string())
    ai = pd.read_excel(ACERVO, sheet_name="acervo_inicial").set_index("tamanho")
    extra_acervo = ai.loc["mediana", "custo_provavel_rs"] - ai.loc["joelho", "custo_provavel_rs"]
    titulos = int(ai.loc["mediana", "titulos"] - ai.loc["joelho", "titulos"])
    lin = []
    for cen in CMV_BEBIDA:
        cb, cp = CMV_BEBIDA[cen], CMV_PRATO[cen]
        pb_barato = barato.bebida / barato.consumo
        pb_caro = caro.bebida / caro.consumo
        base, cmv_base = margem(barato.ab_declarado, pb_barato, cb, cp)
        # qualidade: A&B do grupo de cardápio caro; pratos no topo da faixa (ou acima, no pessimista)
        q_prato = CMV_PRATO_QUALIDADE + (cp - CMV_PRATO["provavel"])
        qual, cmv_q = margem(caro.ab_declarado, pb_caro, cb, q_prato)
        fixo_q = SALARIO_COZINHA * N_COZINHA * ACRESCIMO_COZINHA * (1 + ENCARGOS)
        # preço baixo: mesmo custo em reais, preço 15% menor
        ab_b = barato.ab_declarado * (1 - CORTE_PRECO)
        baixo, cmv_b = margem(ab_b, pb_barato, cb / (1 - CORTE_PRECO), cp / (1 - CORTE_PRECO))
        acervo_mes = extra_acervo / MESES_VIDA + extra_acervo * REPOSICAO_ACERVO / 12
        amb_mes = 10000 / MESES_VIDA
        base_mes = base * PESSOAS
        lin += [
            {"cenario": cen, "posicao": "base (preços do grupo de consumo barato)", "ab_por_pessoa": barato.ab_declarado,
             "cmv_ab": cmv_base, "margem_por_pessoa": base, "custo_fixo_extra_mes": 0.0, "margem_mes_942": base_mes,
             "pessoas_para_empatar_com_base": PESSOAS, "variacao_de_publico_tolerada_pct": 0.0},
            {"cenario": cen, "posicao": "cardápio de qualidade (preços do grupo de consumo caro)", "ab_por_pessoa": caro.ab_declarado,
             "cmv_ab": cmv_q, "margem_por_pessoa": qual, "custo_fixo_extra_mes": fixo_q,
             "margem_mes_942": qual * PESSOAS - fixo_q,
             "pessoas_para_empatar_com_base": (base_mes + fixo_q) / qual},
            {"cenario": cen, "posicao": "preço baixo (A&B 15% mais barato)", "ab_por_pessoa": ab_b,
             "cmv_ab": cmv_b, "margem_por_pessoa": baixo, "custo_fixo_extra_mes": 0.0, "margem_mes_942": baixo * PESSOAS,
             "pessoas_para_empatar_com_base": base_mes / baixo},
            {"cenario": cen, "posicao": f"acervo maior (+{titulos} títulos, joelho → mediana)", "ab_por_pessoa": barato.ab_declarado,
             "cmv_ab": cmv_base, "margem_por_pessoa": base, "custo_fixo_extra_mes": acervo_mes,
             "margem_mes_942": base_mes - acervo_mes, "pessoas_para_empatar_com_base": (base_mes + acervo_mes) / base},
            {"cenario": cen, "posicao": "ambiente (cada R$ 10 mil investidos)", "ab_por_pessoa": barato.ab_declarado,
             "cmv_ab": cmv_base, "margem_por_pessoa": base, "custo_fixo_extra_mes": amb_mes,
             "margem_mes_942": base_mes - amb_mes, "pessoas_para_empatar_com_base": (base_mes + amb_mes) / base},
        ]
    t = pd.DataFrame(lin)
    t["variacao_de_publico_tolerada_pct"] = 100 * (t["pessoas_para_empatar_com_base"] / PESSOAS - 1)
    t = t.round(2)
    t.to_csv(PASTA / "B2_custo_beneficio_posicoes.csv", sep=";", index=False, encoding="utf-8-sig")
    g.round(3).reset_index().to_csv(PASTA / "B2_custo_beneficio_grupos.csv", sep=";", index=False, encoding="utf-8-sig")
    print(t.to_string(index=False))
    print(f"acervo: +R$ {extra_acervo:,.0f} por {titulos} títulos")


if __name__ == "__main__":
    main()
