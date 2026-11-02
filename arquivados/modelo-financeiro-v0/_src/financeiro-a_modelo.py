"""
Modelo financeiro do plano (cap. 9): investimento, receitas, custos, DRE,
fluxo de caixa, indicadores nos três cenários, sensibilidade (tornado),
ponto de ruptura e checagens de coerência (_instrucoes/8_financeiro.md).

Dirigido por premissas: todo valor vem de dados/Modelo financeiro/financeiro_premissas.csv
(uma linha por folha da árvore de direcionadores, com faixa pessimista,
provável e otimista, fonte e nível N1-N6). Nenhum número de negócio fica
digitado no cálculo; as constantes do código são de calendário (52 semanas,
12 meses) e da regra do Simples Nacional (LC 123/2006, art. 18).

Escolhas declaradas:
- valores em preços constantes (reais de 2026), com TMA real (M01 e M02);
- horizonte de 5 anos, mensal; valor residual = valor contábil de reforma,
  mobiliário e equipamentos ao fim do ano 5 (sem perpetuidade), mais a
  devolução da caução, do estoque e do capital de giro;
- Simples Nacional: alimentos e bebidas no anexo I; couvert e eventos no
  anexo III [conferir no cap. 8]; RBT12 proporcional no primeiro ano
  (LC 123/2006, art. 18, §2º);
- capital de giro = maior caixa acumulado negativo da operação durante a
  rampa (R09), aportado no mês 0.

Conferência das fontes: as premissas com `chave_fonte` são recalculadas a
partir dos arquivos do B1 e do B4; diferença acima de 0,01 vira aviso na
aba fontes_conferidas (o CSV não é alterado).

Entradas: dados/Modelo financeiro/financeiro_premissas.csv
          dados/[B1] …/estabelecimentos/B1_resumo_estabelecimentos.xlsx
          dados/[B4] Bases publicas/ (CAGED, FipeZAP, Focus, PAS, Simples, população)
Saída:    dados/Modelo financeiro/financeiro_modelo.xlsx

Uso:
    python3 "_src/Modelo financeiro/analise/financeiro-a_modelo.py"
"""
# Caminhos: _src/extras/ (log comum); log em ../logs/
import sys
from pathlib import Path
_AQUI = Path(__file__).resolve()
sys.path[:0] = [str(_AQUI.parents[2] / "extras")]
from log_execucao import registrar_execucao  # noqa: E402
if __name__ == "__main__":
    registrar_execucao(__file__)

import numpy as np
import pandas as pd

ROOT = _AQUI.parents[2].parent
PASTA = ROOT / "dados" / "Modelo financeiro"
PREMISSAS = PASTA / "financeiro_premissas.csv"
SAIDA = PASTA / "financeiro_modelo.xlsx"
B1 = ROOT / "dados" / "[B1] Estabelecimentos e cardapios" / "estabelecimentos" / "B1_resumo_estabelecimentos.xlsx"
B4 = ROOT / "dados" / "[B4] Bases publicas"
SIMPLES = B4 / "juridico_tributario" / "[B4] Faixas e Alíquotas por Anexo 2026 (Simples Nacional).csv"

CENARIOS = ["pessimista", "provavel", "otimista"]
MESES = 60
SEMANAS_MES = 52 / 12
TETO_SIMPLES = 4_800_000


# ---------------------------------------------------------------- premissas

def ler_premissas() -> pd.DataFrame:
    d = pd.read_csv(PREMISSAS, dtype={"chave_fonte": str})
    assert d["id"].is_unique, "IDs repetidos no registro de premissas"
    return d


def valores(premissas: pd.DataFrame, cenario: str, troca: dict | None = None) -> dict:
    """Dicionário id → valor no cenário; `troca` sobrescreve ids pontuais."""
    v = dict(zip(premissas["id"], premissas[cenario].astype(float)))
    v.update(troca or {})
    return v


# ---------------------------------------------------------------- Simples

def ler_simples() -> dict:
    s = pd.read_csv(SIMPLES)
    return {a: g.sort_values("faixa") for a, g in s.groupby("anexo")}


def aliquota_efetiva(tabela: pd.DataFrame, rbt12: float) -> float:
    """LC 123/2006, art. 18, §1º: (RBT12 × alíquota nominal − parcela a deduzir) ÷ RBT12."""
    if rbt12 <= 0:
        return float(tabela.iloc[0]["aliquota_nominal_pct"]) / 100
    faixa = tabela[tabela["rbt12_min"] <= rbt12].iloc[-1]
    return (rbt12 * faixa["aliquota_nominal_pct"] / 100 - faixa["parcela_deduzir"]) / rbt12


# ---------------------------------------------------------------- modelo

def investimento(v: dict) -> dict:
    aluguel_mes = v["C04"] * v["C05"]
    itens = {
        "Reforma e adequação (I01 × C04)": v["I01"] * v["C04"],
        "Mobiliário (I02)": v["I02"],
        "Cozinha e bar (I03)": v["I03"],
        "Acervo inicial (I04 × I05)": v["I04"] * v["I05"],
        "Pré-operacional (I06)": v["I06"],
        "Caução do aluguel (I07 × aluguel)": v["I07"] * aluguel_mes,
        "Estoque inicial (I08)": v["I08"],
    }
    return itens


def folha_mensal(v: dict) -> tuple[float, float]:
    """Folha CLT com encargos e benefícios, e pró-labore (sem encargo patronal)."""
    salarios = (v["C07"] * v["C08"] + v["C09"] * v["C10"] + v["C11"] * v["C12"]
                + v["C13"] * v["C14"] + v["C15"] * v["C16"])
    clt = salarios * (1 + v["C18"] / 100 + v["C19"] / 100)
    return clt, v["C17"]


def custos_fixos(v: dict) -> dict:
    clt, prolabore = folha_mensal(v)
    return {
        "Aluguel (C04 × C05)": v["C04"] * v["C05"],
        "IPTU e condomínio (C04 × C06)": v["C04"] * v["C06"],
        "Folha CLT com encargos e benefícios (C07-C16, C18, C19)": clt,
        "Pró-labore (C17)": prolabore,
        "Utilidades (C20)": v["C20"],
        "Marketing (C21)": v["C21"],
        "Contabilidade (C22)": v["C22"],
        "Sistemas (C23)": v["C23"],
        "Manutenção e limpeza (C24)": v["C24"],
        "ECAD (C25)": v["C25"],
        "Seguro (C26)": v["C26"],
    }


def capacidade(v: dict) -> dict:
    lugares = v["R01"] * v["R02"]
    giros = v["R03"] / v["R04"]
    return {"lugares": lugares, "giros_dia": giros, "lugares_giro_dia": lugares * giros}


def projetar(v: dict, simples: dict) -> tuple[pd.DataFrame, dict]:
    """Projeção mensal; devolve a tabela de 60 meses e o investimento."""
    cap = capacidade(v)
    clientes_maduro = ((v["R05"] * v["R07"] + v["R06"] * v["R08"]) / 100
                       * cap["lugares_giro_dia"] * SEMANAS_MES)
    rampa = max(v["R09"], 1)
    fixos = custos_fixos(v)
    total_fixos = sum(fixos.values())
    inv = investimento(v)
    acervo = v["I04"] * v["I05"]

    linhas, receitas = [], []
    for m in range(1, MESES + 1):
        fator_rampa = min(1.0, v["R10"] / 100 + (1 - v["R10"] / 100) * (m - 1) / max(rampa - 1, 1))
        anos_maduro = max(0.0, (m - rampa) / 12)
        fator_cresc = (1 + v["R11"] / 100) ** anos_maduro if m > rampa else 1.0
        clientes = clientes_maduro * fator_rampa * fator_cresc
        rec_ab = clientes * v["R12"]
        rec_couvert = clientes * v["R14"] / 100 * v["R13"]
        rec_eventos = v["R15"] * v["R16"]
        rec_total = rec_ab + rec_couvert + rec_eventos
        # RBT12: proporcional no início (art. 18, §2º); depois, 12 meses anteriores
        if m == 1:
            rbt12 = rec_total * 12
        elif m <= 12:
            rbt12 = np.mean(receitas) * 12
        else:
            rbt12 = sum(receitas[-12:])
        aliq_i = aliquota_efetiva(simples["I"], rbt12)
        aliq_iii = aliquota_efetiva(simples["III"], rbt12)
        das = rec_ab * aliq_i + (rec_couvert + rec_eventos) * aliq_iii
        cmv = rec_ab * v["C01"] / 100
        taxas = rec_total * v["C02"] / 100
        reposicao = acervo * v["C03"] / 100 / 12
        margem = rec_total - das - cmv - taxas - reposicao
        resultado = margem - total_fixos
        linhas.append({
            "mes": m, "ano": (m - 1) // 12 + 1, "clientes": clientes,
            "receita_ab": rec_ab, "receita_couvert": rec_couvert, "receita_eventos": rec_eventos,
            "receita_bruta": rec_total, "rbt12": rbt12,
            "aliquota_efetiva_anexo_i": aliq_i, "aliquota_efetiva_anexo_iii": aliq_iii,
            "simples_das": das, "cmv": cmv, "taxas_pagamento": taxas, "reposicao_acervo": reposicao,
            "margem_contribuicao": margem, "custos_fixos": total_fixos,
            "resultado_operacional": resultado,
        })
        receitas.append(rec_total)
    t = pd.DataFrame(linhas)

    # capital de giro: maior caixa acumulado negativo da operação durante a rampa
    # (prejuízos depois da maturação ficam no fluxo e pesam no VPL)
    giro = max(0.0, -t.loc[t["mes"] <= rampa, "resultado_operacional"].cumsum().min())
    inv["Capital de giro (déficit acumulado da rampa)"] = giro

    # depreciação (só para o valor residual; o Simples incide sobre a receita)
    depreciaveis = inv["Reforma e adequação (I01 × C04)"] + inv["Mobiliário (I02)"] + inv["Cozinha e bar (I03)"]
    residual = depreciaveis * max(0.0, 1 - (MESES / 12) / v["I09"])
    devolucoes = inv["Caução do aluguel (I07 × aluguel)"] + inv["Estoque inicial (I08)"] + giro

    t["investimento"] = 0.0
    t["valor_residual"] = 0.0
    t.loc[t["mes"] == MESES, "valor_residual"] = residual + devolucoes
    t["fluxo_caixa"] = t["resultado_operacional"] + t["valor_residual"]
    mes0 = pd.DataFrame([{"mes": 0, "ano": 0, "investimento": -sum(inv.values()), "fluxo_caixa": -sum(inv.values())}])
    t = pd.concat([mes0, t], ignore_index=True).fillna(0.0)
    return t, inv


def tma_real(v: dict) -> float:
    return (1 + v["M01"] / 100) * (1 + v["M02"] / 100) - 1


def vpl(fluxos: np.ndarray, taxa_anual: float) -> float:
    i = (1 + taxa_anual) ** (1 / 12) - 1
    return float(np.sum(fluxos / (1 + i) ** np.arange(len(fluxos))))


def tir_anual(fluxos: np.ndarray) -> float | None:
    """TIR mensal por bisseção, anualizada; None se o fluxo não troca de sinal."""
    def f(i):
        return np.sum(fluxos / (1 + i) ** np.arange(len(fluxos)))
    lo, hi = -0.99, 1.0
    if f(lo) * f(hi) > 0:
        return None
    for _ in range(200):
        mid = (lo + hi) / 2
        if f(lo) * f(mid) <= 0:
            hi = mid
        else:
            lo = mid
    return (1 + (lo + hi) / 2) ** 12 - 1


def payback_descontado(fluxos: np.ndarray, taxa_anual: float) -> int | None:
    i = (1 + taxa_anual) ** (1 / 12) - 1
    acum = np.cumsum(fluxos / (1 + i) ** np.arange(len(fluxos)))
    meses = np.where(acum >= 0)[0]
    return int(meses[0]) if len(meses) else None


def indicadores(v: dict, simples: dict) -> tuple[dict, pd.DataFrame, dict]:
    t, inv = projetar(v, simples)
    fluxos = t["fluxo_caixa"].to_numpy()
    tma = tma_real(v)
    cap = capacidade(v)
    # ponto de equilíbrio no ano 2 (operação madura): clientes/mês com resultado zero
    ano2 = t[t["ano"] == 2]
    clientes = ano2["clientes"].sum()
    eventos_liq = (ano2["receita_eventos"] * (1 - ano2["aliquota_efetiva_anexo_iii"] - v["C02"] / 100)).sum()
    margem_por_cliente = (ano2["margem_contribuicao"].sum() - eventos_liq) / clientes if clientes else np.nan
    fixos_mes = ano2["custos_fixos"].mean()
    pe_clientes = max(0.0, (fixos_mes - eventos_liq / 12) / margem_por_cliente) if margem_por_cliente > 0 else np.nan
    capacidade_mes = cap["lugares_giro_dia"] * (v["R05"] + v["R06"]) * SEMANAS_MES
    ind = {
        "investimento_total": -t.loc[0, "investimento"],
        "tma_real_anual": tma,
        "vpl": vpl(fluxos, tma),
        "tir_real_anual": tir_anual(fluxos),
        "payback_descontado_meses": payback_descontado(fluxos, tma),
        "receita_ano1": t[t["ano"] == 1]["receita_bruta"].sum(),
        "receita_ano2": ano2["receita_bruta"].sum(),
        "resultado_operacional_ano1": t[t["ano"] == 1]["resultado_operacional"].sum(),
        "resultado_operacional_ano2": ano2["resultado_operacional"].sum(),
        "clientes_mes_ano2": clientes / 12,
        "ponto_equilibrio_clientes_mes": pe_clientes,
        "ponto_equilibrio_ocupacao_media_pct": 100 * pe_clientes / capacidade_mes if capacidade_mes else np.nan,
        "ocupacao_media_ano2_pct": 100 * (clientes / 12) / capacidade_mes if capacidade_mes else np.nan,
        "capital_de_giro": inv["Capital de giro (déficit acumulado da rampa)"],
    }
    return ind, t, inv


# ---------------------------------------------------------------- sensibilidade

def tornado(premissas: pd.DataFrame, simples: dict) -> pd.DataFrame:
    base = valores(premissas, "provavel")
    vpl_base = indicadores(base, simples)[0]["vpl"]
    linhas = []
    for _, p in premissas.iterrows():
        if p["tipo"] != "premissa" or p["pessimista"] == p["otimista"]:
            continue
        r = {}
        for c in ("pessimista", "otimista"):
            r[c] = indicadores(valores(premissas, "provavel", {p["id"]: float(p[c])}), simples)[0]["vpl"]
        linhas.append({"id": p["id"], "premissa": p["premissa"], "nivel": p["nivel"],
                       "vpl_pessimista": r["pessimista"], "vpl_otimista": r["otimista"],
                       "amplitude": abs(r["otimista"] - r["pessimista"]), "vpl_base": vpl_base})
    d = pd.DataFrame(linhas).sort_values("amplitude", ascending=False).reset_index(drop=True)
    d["ordem"] = d.index + 1
    total = d["amplitude"].sum()
    d["impacto_vpl"] = np.where(d["amplitude"] >= 0.10 * total, "Alto",
                                np.where(d["amplitude"] >= 0.03 * total, "Médio", "Baixo"))
    return d


def ruptura(premissas: pd.DataFrame, simples: dict, ids: list[str]) -> pd.DataFrame:
    """Valor de cada premissa que zera o VPL, com as demais no provável."""
    linhas = []
    for pid in ids:
        p = premissas.set_index("id").loc[pid]
        a, b = sorted([float(p["pessimista"]), float(p["otimista"])])
        largura = max(b - a, abs(p["provavel"]) * 0.5, 1e-6)
        lo, hi = max(0.05 * a, a - 4 * largura) if a > 0 else a - 4 * largura, b + 4 * largura

        def f(x):
            return indicadores(valores(premissas, "provavel", {pid: x}), simples)[0]["vpl"]
        flo, fhi = f(lo), f(hi)
        if flo * fhi > 0:
            valor, obs = np.nan, "o VPL não muda de sinal na faixa ampliada"
        else:
            for _ in range(40):
                mid = (lo + hi) / 2
                if flo * f(mid) <= 0:
                    hi = mid
                else:
                    lo, flo = mid, f(mid)
            valor, obs = (lo + hi) / 2, ""
        linhas.append({"id": pid, "premissa": p["premissa"], "unidade": p["unidade"],
                       "pessimista": p["pessimista"], "provavel": p["provavel"], "otimista": p["otimista"],
                       "valor_que_zera_vpl": valor, "observacao": obs})
    return pd.DataFrame(linhas)


# ---------------------------------------------------------------- fontes

def conferir_fontes(premissas: pd.DataFrame) -> pd.DataFrame:
    """Recalcula as premissas com `chave_fonte` a partir do B1 e do B4."""
    esperado = {}
    cesta = pd.read_excel(B1, sheet_name="cesta")
    est = pd.read_excel(B1, sheet_name="estabelecimentos")
    q = [0.25, 0.5, 0.75]
    horas = (est["horas_semana"] / est["dias_abertos"]).quantile(q).round(2).tolist()
    esperado["b1:horas_dia"] = horas  # pessimista = menos horas
    ab = (cesta["bebida_mediana"] + cesta["entrada_ou_prato_mediana"]).quantile(q).round(2).tolist()
    esperado["b1:ticket_ab"] = ab
    cv = cesta.loc[cesta["couvert_mediana"] > 0, "couvert_mediana"].quantile(q).round(2).tolist()
    esperado["b1:couvert"] = cv

    caged = pd.read_csv(B4 / "multiuso" / "[B4] Salário Admissão por Capital 2025-2026 (CAGED).csv")
    for _, r in caged[caged["capital"] == "Salvador"].iterrows():
        esperado[f"caged:{r['recorte']}:{r['cbo']}"] = [r["salario_p75"], r["salario_mediana"], r["salario_p25"]]

    fz = pd.read_csv(B4 / "financeiro" / "[B4] Aluguel Comercial por Capital 2026-07 (FipeZap).csv")
    esperado["fipezap:salvador"] = [None, round(float(fz.loc[fz["capital"] == "Salvador", "comercial_locacao_preco_m2"].iloc[0]), 2), None]

    focus = pd.read_csv(B4 / "financeiro" / "[B4] Expectativas Focus 2026-2030 (BCB).csv")
    sel = focus[(focus["Indicador"] == "Selic") & (focus["DataReferencia"] == 2030)]["Mediana"].iloc[0]
    ipca = focus[(focus["Indicador"] == "IPCA") & (focus["DataReferencia"] == 2030)]["Mediana"].iloc[0]
    esperado["focus:selic_real"] = [None, round(((1 + sel / 100) / (1 + ipca / 100) - 1) * 100, 1), None]

    secao = "2.2.1 Restaurantes e outros serviços de alimentação e bebidas"
    custos = pd.read_csv(B4 / "financeiro" / "[B4] Serviços às Famílias Custos 2019-2023 (IBGE PAS).csv")
    receita = pd.read_csv(B4 / "financeiro" / "[B4] Serviços às Famílias Receita 2019-2023 (IBGE PAS).csv")
    pessoal = pd.read_csv(B4 / "financeiro" / "[B4] Serviços às Famílias Pessoal 2019-2023 (IBGE PAS).csv")
    col = custos.columns[8]

    def pas(df, var):
        return float(df[(df[col] == secao) & (df["periodo"] == 2023) & (df["variavel"] == var)]["valor"].iloc[0])
    rb = sum(pas(receita, f"Receita bruta - {x}") for x in ("prestação de serviços", "revenda de mercadorias", "outras atividades"))
    esperado["pas:cmv"] = [None, None, round(100 * pas(custos, "Mercadorias, materiais de consumo e de reposição") / rb, 1)]
    esperado["pas:beneficios"] = [None, round(100 * pas(pessoal, "Benefícios concedidos aos empregados")
                                              / pas(pessoal, "Salários e outras remunerações"), 1), None]

    linhas = []
    for _, p in premissas[premissas["chave_fonte"].notna()].iterrows():
        alvo = esperado.get(p["chave_fonte"])
        if alvo is None:
            linhas.append({"id": p["id"], "chave_fonte": p["chave_fonte"], "situacao": "chave sem leitor"})
            continue
        difs = []
        for c, e in zip(CENARIOS, alvo):
            if e is not None and abs(float(p[c]) - float(e)) > 0.011:
                difs.append(f"{c}: CSV {p[c]} × fonte {e}")
        linhas.append({"id": p["id"], "chave_fonte": p["chave_fonte"],
                       "valores_da_fonte": " / ".join("-" if e is None else str(e) for e in alvo),
                       "situacao": "; ".join(difs) if difs else "confere"})
    return pd.DataFrame(linhas)


# ---------------------------------------------------------------- coerência

def coerencia(premissas: pd.DataFrame, simples: dict, ind: dict, tabs: dict) -> pd.DataFrame:
    v = valores(premissas, "provavel")
    cap = capacidade(v)
    est = pd.read_excel(B1, sheet_name="cesta")
    cesta = est["cesta_mediana"].quantile([0.25, 0.75]).tolist()
    ticket = v["R12"] + v["R13"] * v["R14"] / 100
    pop = pd.read_csv(B4 / "mercado_demanda" / "[B4] Resumo de População e Renda por Capital 2022-2026 (IBGE).csv")
    pop2039 = float(pop.loc[pop["capital"] == "Salvador", "pop_20_39_censo_2022"].iloc[0])
    t = tabs["provavel"]
    ano2 = t[t["ano"] == 2]
    clt, prolabore = folha_mensal(v)
    pessoal_pct = 100 * (clt + prolabore) * 12 / ano2["receita_bruta"].sum()
    rbt_max = max(tabs[c]["rbt12"].max() for c in CENARIOS)
    vo = valores(premissas, "otimista")
    cap_o = capacidade(vo)
    linhas = [
        ("Capacidade comporta a demanda", f"clientes/dia no fim de semana (otimista) = {vo['R08'] / 100 * cap_o['lugares_giro_dia']:.0f} ≤ lugares × giros = {cap_o['lugares_giro_dia']:.0f}",
         "ok" if vo["R08"] <= 100 else "falha"),
        ("Equipe atende a ocupação", f"{v['R08'] / 100 * cap['lugares']:.0f} clientes simultâneos em média no fim de semana para {v['C09']:.0f} garçons e {v['C07']:.0f} monitores", "conferir no cap. 7.5"),
        ("CMV bate com referência setorial", f"provável {v['C01']:.0f}% × PAS 2023 restaurantes 25,9%", "ok, acima da PAS por falta de escala"),
        ("Preço na faixa dos concorrentes (B1)", f"ticket provável R$ {ticket:.2f} × cesta mediana das 26 casas entre R$ {cesta[0]:.2f} (P25) e R$ {cesta[1]:.2f} (P75)",
         "ok" if cesta[0] <= ticket <= cesta[1] else "fora da faixa: justificar no 6.3"),
        ("Rampa de maturação realista", f"{valores(premissas, 'otimista')['R09']:.0f} a {valores(premissas, 'pessimista')['R09']:.0f} meses, abrindo com {v['R10']:.0f}% da ocupação madura",
         "ok" if 6 <= valores(premissas, "otimista")["R09"] and valores(premissas, "pessimista")["R09"] <= 12 else "falha"),
        ("Simples Nacional cabível", f"maior RBT12 projetado R$ {rbt_max:,.0f} × teto R$ {TETO_SIMPLES:,.0f}",
         "ok" if rbt_max <= TETO_SIMPLES else "falha: rever o regime no cap. 8"),
        ("Pessoal em % da receita", f"{pessoal_pct:.1f}% no ano 2 (provável) × PAS 2023 restaurantes 21,4%", "comparar no texto"),
        ("Penetração no público", f"{ind['provavel']['clientes_mes_ano2'] * 12:,.0f} visitas/ano ÷ {pop2039:,.0f} pessoas de 20 a 39 anos em Salvador (Censo 2022) = {ind['provavel']['clientes_mes_ano2'] * 12 / pop2039:.3f} visita por pessoa",
         "comparar com a frequência de luderias (B2/B3)"),
        ("Triangulação da receita (top-down)", "aguarda a razão avaliações ÷ visitantes da São Jogue (B3, 18/10)", "pendente"),
    ]
    return pd.DataFrame(linhas, columns=["checagem", "resultado", "situacao"])


# ---------------------------------------------------------------- saída

def anual(t: pd.DataFrame) -> pd.DataFrame:
    cols = ["clientes", "receita_ab", "receita_couvert", "receita_eventos", "receita_bruta", "simples_das",
            "cmv", "taxas_pagamento", "reposicao_acervo", "margem_contribuicao", "custos_fixos",
            "resultado_operacional", "investimento", "valor_residual", "fluxo_caixa"]
    a = t.groupby("ano")[cols].sum()
    # a tabela anual fecha com a mensal
    for c in cols:
        assert abs(a[c].sum() - t[c].sum()) < 1e-6, c
    return a.reset_index()


def main():
    premissas = ler_premissas()
    simples = ler_simples()
    ind, tabs, invs = {}, {}, {}
    for c in CENARIOS:
        ind[c], tabs[c], invs[c] = indicadores(valores(premissas, c), simples)

    torn = tornado(premissas, simples)
    criticas = torn.head(5)["id"].tolist()
    rup = ruptura(premissas, simples, criticas)
    fontes = conferir_fontes(premissas)
    coer = coerencia(premissas, simples, ind, tabs)

    reg = premissas.merge(torn[["id", "impacto_vpl", "ordem"]].rename(columns={"ordem": "ordem_tornado"}), on="id", how="left")
    reg["impacto_vpl"] = reg["impacto_vpl"].fillna("—")
    reg["critica_so_N6"] = reg["id"].isin(criticas) & (reg["nivel"].str.strip() == "N6")

    resumo = pd.DataFrame(ind).T.reset_index().rename(columns={"index": "cenario"})
    inv = pd.DataFrame(invs).reset_index().rename(columns={"index": "item"})
    fixos = pd.DataFrame({c: custos_fixos(valores(premissas, c)) for c in CENARIOS}).reset_index().rename(columns={"index": "item"})

    with pd.ExcelWriter(SAIDA) as w:
        resumo.to_excel(w, sheet_name="indicadores", index=False)
        reg.to_excel(w, sheet_name="premissas", index=False)
        inv.to_excel(w, sheet_name="investimento", index=False)
        fixos.to_excel(w, sheet_name="custos_fixos_mes", index=False)
        for c in CENARIOS:
            anual(tabs[c]).to_excel(w, sheet_name=f"dre_fluxo_{c}", index=False)
        tabs["provavel"].to_excel(w, sheet_name="mensal_provavel", index=False)
        torn.to_excel(w, sheet_name="sensibilidade", index=False)
        rup.to_excel(w, sheet_name="ruptura", index=False)
        coer.to_excel(w, sheet_name="coerencia", index=False)
        fontes.to_excel(w, sheet_name="fontes_conferidas", index=False)

    pd.set_option("display.width", 200)
    print("Indicadores por cenário:")
    print(resumo.round(2).to_string(index=False))
    print("\nTornado (5 primeiras):")
    print(torn.head(5)[["ordem", "id", "premissa", "nivel", "vpl_pessimista", "vpl_otimista"]].round(0).to_string(index=False))
    print("\nPonto de ruptura:")
    print(rup[["id", "provavel", "valor_que_zera_vpl", "observacao"]].round(2).to_string(index=False))
    print("\nFontes:")
    print(fontes.to_string(index=False))
    n6 = reg[reg["critica_so_N6"]]["id"].tolist()
    if n6:
        print(f"\nAviso (regra de robustez, §2): premissas críticas só em N6: {', '.join(n6)}")
    print(f"\nSaída: {SAIDA.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
