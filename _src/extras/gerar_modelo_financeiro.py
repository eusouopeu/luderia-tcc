"""
Cap. 9 - modelo financeiro da luderia (_instrucoes/8_financeiro.md).

Gera `textos/capitulos/9_plano_financeiro_modelo.xlsx`, dirigido por premissas:
abas premissas, pessoal, simples, receitas, custos, investimento, dre,
fluxo_caixa, indicadores, sensibilidade e checagens. Toda fórmula de cálculo lê
a aba premissas (coluna "Valor usado", escolhida pelo cenário ativo em
premissas!D2: 1 pessimista, 2 provável, 3 otimista) pelos nomes definidos
P_<ID> (ex.: P_R04). Nenhum número fica digitado dentro de fórmula.

O mesmo modelo é calculado em Python para o tornado (§4.2), o ponto de ruptura
(§4.3), a tabela dos três cenários e a simulação de Monte Carlo (§4.4),
gravados como valores nas abas sensibilidade e monte_carlo. A planilha é recalculada no LibreOffice nos três cenários e o
VPL de cada um tem de bater com o do Python (diferença < R$ 1,00); senão o
script para.

Modelo em preços constantes (out/2026), com TMA real. Mensal nos 60 meses
(rampa de maturação no ano 1), anual na DRE e no fluxo de caixa. No ano 5
voltam a caução e o capital de giro e entra o valor residual (M03):
perpetuidade sem crescimento do EBITDA do ano 5 menos o reinvestimento anual
(igual à depreciação), à TMA, com piso zero (se a perpetuidade for negativa, o
negócio fecha). A aba sensibilidade mostra o VPL com e sem o valor residual.

Receita (decisão do autor, 02/11/2026): pessoas por dia de fim de semana =
circulação no pico (pessoas que entram por hora nas visitas do B3, sem escala
pelas mesas; pessimista pelas NFC-e) × horas de pico equivalentes (casas do B1 abertas
em cada hora do plano ÷ casas abertas nas janelas das visitas); dia útil = mesma
circulação × horas de pico equivalentes do dia útil (R19) × razão dia útil ÷ fim de
semana do gasto com cartão (ANR/Mastercard).
Receita por pessoa = gasto por pessoa declarado no Google Maps (B2), média das
13 casas com taxa de entrada conhecida; a cesta de consumo é taxa de entrada +
bebida + hambúrguer mais barato sem ser vegetariano, e a parcela da taxa nessa
cesta (10 casas com cesta) separa a receita de taxa (anexo III) da de A&B
(anexo I e CMV).

Desenho enxuto (P7 de _instrucoes/1a_principios.md, 02/11/2026): 6 mesas;
terça a sábado das 14h às 23h (9 h) e domingo das 14h às 20h (6 h), segunda
fechada (decisão do autor, 04/11/2026); equipe de 5 (2 cozinheiros-chefes e 3
atendentes e instrutores, em 5 dias de 8 h, com 6 h no domingo, 39 h por semana na
média; decisão do autor, 04/11/2026), mais o
sócio no caixa em todo o horário aberto (pró-labore, C08).
A remuneração soma ao salário os adicionais legais da escala (ESCALA): noturno,
hora noturna reduzida, repouso sobre eles e feriados em dobro; os encargos e o
vale-transporte (C07) saem da mesma conta, linha a linha (custo_empregado).
A São Jogue entra como referência de comportamento (circulação, pessoas por
mesa, permanência), não de porte. A circulação fica limitada ao salão:
pessoas por hora ≤ mesas × pessoas por mesa ÷ permanência (B3).

Entradas: B1 (cesta de jogos; couvert dos cardápios; casas abertas por hora,
B1-a_abertos_por_hora.py), B2 (gasto por pessoa e cesta por casa,
B2-a_gasto_por_pessoa.py), B3 (contagem_resumo_visitas.csv,
contagem_notas_intervalo.csv), B4 (FipeZap, CAGED, BCB,
Simples Nacional, IBGE PAS e população). As premissas N6 ficam em PREMISSAS,
com a justificativa da faixa.

Saídas: o .xlsx e as figuras 9_tornado.png e 9_monte_carlo.png em
textos/capitulos/figuras/; imprime os
números citados no texto do capítulo.
Uso: python3 _src/extras/gerar_modelo_financeiro.py
"""
import sys
from pathlib import Path
_AQUI = Path(__file__).resolve()
sys.path[:0] = [str(_AQUI.parent)]
from log_execucao import registrar_execucao  # noqa: E402
if __name__ == "__main__":
    registrar_execucao(__file__)

import random
import shutil
import subprocess
import tempfile

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt  # noqa: E402
import matplotlib.ticker  # noqa: E402,F401
import openpyxl  # noqa: E402
import pandas as pd  # noqa: E402
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side  # noqa: E402
from openpyxl.utils import get_column_letter  # noqa: E402
from openpyxl.workbook.defined_name import DefinedName  # noqa: E402

ROOT = Path(__file__).resolve().parents[2]
DADOS = ROOT / "dados"
B1 = DADOS / "[B1] Estabelecimentos e cardapios"
B3 = DADOS / "[B3] Contagem direta de ocupacao"
B4 = DADOS / "[B4] Bases publicas"
B5 = DADOS / "[B5] Ativos fixos"
SAIDA = ROOT / "textos" / "capitulos" / "9_plano_financeiro_modelo.xlsx"
FIGURA = ROOT / "textos" / "capitulos" / "figuras" / "9_tornado.png"
FIGURA_MC = ROOT / "textos" / "capitulos" / "figuras" / "9_monte_carlo.png"
SOFFICE = "/Applications/LibreOffice.app/Contents/MacOS/soffice"

MESES = 60
# Escala (decisão do autor, 04/11/2026): segunda fechada; turnos de 8 h com 1 h de intervalo de
# terça a sábado (das 14h às 23h) e de 6 h com 15 min no domingo (das 14h às 20h); homem folga 1 domingo a cada 4 semanas e mulher, domingo sim, domingo não (CLT,
# art. 386); atendentes 1 e 2 mulheres. Folgas de cada semana do ciclo de 4 semanas.
# Atendentes: 5 dias (1 folga por semana, na terça, na quarta ou no domingo); 3 no salão de quinta
# a sábado e 2 nos demais dias. Cozinheiros (decisão do autor, 04/11/2026): 2, com 5 dias (folga na
# segunda e, em semanas alternadas, na terça ou no domingo); 2 na cozinha de quarta a sábado e 1 na
# terça e no domingo.
ESCALA = {
    "Atendente e instrutor de jogos (recreador)": (
        (("dom",), ("ter",), ("dom",), ("qua",)),
        (("ter",), ("dom",), ("ter",), ("dom",)),
        (("qua",), ("dom",), ("qua",), ("ter",))),
    "Cozinheiro-chefe": (
        (("ter",), ("dom",)),
        (("dom",), ("ter",))),
}
JORNADA_SEM = {"Atendente e instrutor de jogos (recreador)": 39, "Cozinheiro-chefe": 39}  # média: 8 h de terça a sábado, 6 h no domingo
# turnos que fecham às 23h, de terça a sábado, por semana (1 h depois das 22h): todos ficam até o
# fechamento; atendentes, 15 turnos menos as folgas de terça e quarta (média de 13,25 no ciclo de 4
# semanas); cozinheiros, 2 de quarta a sábado e 1 na terça
NOITES_SEM = {"Atendente e instrutor de jogos (recreador)": 13.25, "Cozinheiro-chefe": 9}
ADIC_NOTURNO = 0.20  # CLT, art. 73: 20% das 22h às 5h, hora noturna de 52 min 30 s
HORA_EXTRA = 0.50  # CF, art. 7º, XVI: a hora reduzida das 22h às 23h passa da jornada contratada
FERIADOS_ANO = 14  # 9 nacionais, 2 de julho (BA) e 4 de Salvador (Lei n. 9.093/1995) [AV]
TARIFA_VT = 5.90  # ônibus de Salvador desde 05/01/2026; ida e volta por dia trabalhado (Lei n. 7.418/1985)
SEMANAS_MES = 365.25 / 7 / 12
# vida útil (anos) dos itens depreciáveis, a mesma da aba investimento
VIDA_UTIL = dict(reforma=5, mobiliario=10, cozinha=10, ti=5, acervo=5, preop=5)
ANOS = 5
CENARIOS = ("pessimista", "provavel", "otimista")
N_SIMULACOES = 10_000
SEMENTE = 20261031
# Monte Carlo: faixas próprias pedidas pelo autor (2 ou 3 pessoas por mesa no
# pessimista, 5 ou 6 no otimista) e premissas discretas (giros e pessoas por cesta)
# Monte Carlo (02/11/2026, pedido do autor): distribuição PERT contínua entre o pessimista e o
# otimista, com moda no provável; faixa própria onde indicado. A TMA fica fora do sorteio (o risco já
# está no fluxo). As mesas ocupadas sorteiam a demanda, que pode passar do salão: o excedente aciona
# a etapa de mesas (MC_EXPANSAO). Os gatilhos G5 e G6 do cap. 10 agem na simulação (calcula_mc).
MC_FAIXA = {"R02": (2.0, 6.0)}
MC_FIXAS = {"M01"}
MC_EXPANSAO = 2  # mesas a mais na etapa 3, a partir do ano 2


# ---------------------------------------------------------------- dados-fonte
def ler_fontes() -> dict:
    f = {}
    # B3: médias das visitas (observador válido) e notas por dia
    r = pd.read_csv(B3 / "contagem_resumo_visitas.csv", sep=";", encoding="utf-8-sig")
    r = r[r["observador"] != "media"]
    f["visitas"] = r
    # mesas ocupadas em média em cada visita (ocupação média × mesas da unidade)
    f["mesas_ocupadas"] = r["ocupacao_mesas_media_pct"] / 100 * r["mesas_denominador"]
    f["notas"] = pd.read_csv(B3 / "contagem_notas_intervalo.csv", sep=";", encoding="utf-8-sig")
    # B1: cesta de jogos (acervo inicial) e taxas de jogo dos concorrentes
    ai = pd.read_excel(B1 / "acervo_jogos" / "B1_cesta_jogos.xlsx", sheet_name="acervo_inicial")
    f["acervo"] = dict(zip(ai["tamanho"], ai["custo_provavel_rs"]))
    f["acervo_faixa"] = ai.set_index("tamanho")[["custo_pessimista_rs", "custo_provavel_rs", "custo_otimista_rs"]].to_dict("index")
    f["acervo_titulos"] = dict(zip(ai["tamanho"], ai["titulos"]))
    # B5: orçamento da etapa 1 por premissa (SINAPI e coletas em sites; B5-b_orcamento_itens.py), o mês mais recente
    orc = sorted((B5 / "orcamento").glob("[[]B5[]] Orçamento por Premissa Etapa 1 *.csv"))[-1]
    f["b5"] = pd.read_csv(orc, sep=";", decimal=",", encoding="utf-8-sig").set_index("premissa")
    f["b5_arquivo"] = orc.name
    ps = pd.read_excel(B1 / "cardapios" / "B1_cardapios_itens_precos.xlsx", sheet_name="precos_subcategoria")
    taxa = ps["couvert ou taxa de jogo | couvert ou taxa de jogo"].dropna()
    taxa = taxa[taxa > 0]
    f["taxa_b1_mediana"], f["taxa_b1_n"] = taxa.median(), len(taxa)
    # couvert e cesta de consumo por casa (B1_resumo_estabelecimentos, aba cesta):
    # couvert só nas casas que cobram (encontrado e > 0); cesta de consumo =
    # bebida mediana + hambúrguer não vegetariano mais barato, só nas casas com os dois
    ce = pd.read_excel(B1 / "estabelecimentos" / "B1_resumo_estabelecimentos.xlsx", sheet_name="cesta")
    cv = ce.loc[ce["couvert_no_cardapio"] == "sim", "couvert_mediana"]
    cv = cv[cv > 0]
    co = (ce["bebida_mediana"] + ce["hamburguer_min_nao_veg"]).dropna()
    f["couvert_media"], f["couvert_n"], f["couvert_mediana"] = cv.mean(), len(cv), cv.median()
    f["cesta_consumo_media"], f["cesta_consumo_n"], f["cesta_consumo_mediana"] = co.mean(), len(co), co.median()
    f["couvert_q"], f["cesta_q"] = cv.quantile([.25, .75]).tolist(), co.quantile([.25, .75]).tolist()
    # B2: gasto por pessoa declarado e cesta de consumo (com a taxa) das casas no recorte
    gc = pd.read_csv(DADOS / "[B2] Avaliacoes recentes" / "gasto_por_pessoa" / "B2_gasto_cesta_por_casa.csv",
                     sep=";", encoding="utf-8-sig")
    f["gasto_casas"] = gc[gc["no_recorte"] == "sim"]
    # B1: horas de pico equivalentes por dia do plano (casas abertas por hora ÷ referência das visitas)
    hp = pd.read_csv(B1 / "estabelecimentos" / "B1_horas_pico_equivalentes.csv", sep=";", encoding="utf-8-sig")
    for casa, chave in (("plano", "horas_pico"), ("São Jogue", "horas_pico_sj")):
        h = hp[hp["casa"] == casa]
        f[chave] = dict(zip(h["dia"], h["horas_pico_equivalentes"]))
    # cobertura de cada dia: casas abertas nas horas do plano ÷ casas abertas no dia inteiro (B1)
    ab = pd.read_csv(B1 / "estabelecimentos" / "B1_abertos_por_hora.csv", sep=";", encoding="utf-8-sig").set_index("hora")
    pl = hp[hp["casa"] == "plano"]
    f["cobertura"] = {d: ab.loc[a:b - 1, d].sum() / ab[d].sum() for d, a, b in zip(pl["dia"], pl["abre"], pl["fecha"])}
    # B4
    fz = pd.read_csv(B4 / "financeiro" / "[B4] Aluguel Comercial por Capital 2026-07 (FipeZap).csv")
    fz = fz[fz["capital"] == "Salvador"].iloc[0]
    f["aluguel_m2"], f["aluguel_var12m"] = fz["comercial_locacao_preco_m2"], fz["comercial_locacao_var_12m_pct"]
    bcb = pd.read_csv(B4 / "financeiro" / "[B4] Selic IPCA e Salário Mínimo Último Valor 2026 (BCB).csv")
    f["selic"] = bcb.loc[bcb["serie"] == "selic_meta", "valor"].iloc[0]
    focus = pd.read_csv(B4 / "financeiro" / "[B4] Expectativas Focus 2026-2030 (BCB).csv")
    f["ipca_2027"] = focus[(focus["Indicador"] == "IPCA") & (focus["DataReferencia"] == 2027)]["Mediana"].iloc[0]
    f["juro_real"] = ((1 + f["selic"] / 100) / (1 + f["ipca_2027"] / 100) - 1) * 100
    pas_c = pd.read_csv(B4 / "financeiro" / "[B4] Serviços às Famílias Custos 2019-2023 (IBGE PAS).csv")
    pas_r = pd.read_csv(B4 / "financeiro" / "[B4] Serviços às Famílias Receita 2019-2023 (IBGE PAS).csv")
    sel = lambda d, var: d[(d["periodo"] == 2023) & (d["variavel"] == var)
                           & d["Serviços prestados às famílias"].str.startswith("1.2")]["valor"].iloc[0]
    f["pas_mercadorias_pct"] = sel(pas_c, "Mercadorias, materiais de consumo e de reposição") / sel(pas_r, "Receita operacional líquida") * 100
    cg = pd.read_csv(B4 / "multiuso" / "[B4] Salário Admissão por Capital 2025-2026 (CAGED).csv")
    f["caged"] = cg[cg["capital"] == "Salvador"]
    sn = pd.read_csv(B4 / "juridico_tributario" / "[B4] Faixas e Alíquotas por Anexo 2026 (Simples Nacional).csv")
    f["simples"] = {a: sn[sn["anexo"] == a].reset_index(drop=True) for a in ("I", "III")}
    pop = pd.read_csv(B4 / "mercado_demanda" / "[B4] Resumo de População e Renda por Capital 2022-2026 (IBGE).csv")
    f["pop_salvador"] = pop.loc[pop["capital"] == "Salvador", "pop_estimada_2026"].iloc[0]
    return f


def salario(f, ocupacao: str, recorte: str = "CNAE 56 - alimentação") -> float:
    c = f["caged"]
    return float(c[(c["ocupacao"] == ocupacao) & (c["recorte"] == recorte)]["salario_mediana"].iloc[0])


def quadro_pessoal(f) -> list[tuple]:
    """(cargo, CBO, quantidade, salário, fonte). Equipe do desenho enxuto (P7): 48 h abertas
    por semana, de terça a domingo; o caixa e a gestão ficam com o sócio (pró-labore, C08)."""
    cn56 = "CAGED, admissões ago/2025-jul/2026, Salvador, CNAE 56, mediana"
    todas = "CAGED, admissões ago/2025-jul/2026, Salvador, todas as atividades, mediana (CNAE 56 com amostra pequena)"
    rec = salario(f, "Recreador", "todas as atividades")
    return [
        ("Cozinheiro-chefe", "513205", 2, salario(f, "Cozinheiro geral"),
         cn56 + "; cozinheiro geral, sem chefe de cozinha no recorte"),
        ("Atendente e instrutor de jogos (recreador)", "371410", 3, rec, todas),
    ]


def custo_empregado(sal: float, cargo: str, folgas: tuple, anos_aviso: int = 5, vt: bool = True) -> dict:
    """Custo mensal de um empregado, linha a linha (R$). Remuneração: salário mais adicionais da
    escala; encargos do empregador no Simples (a contribuição patronal fica no DAS dos anexos I e
    III, LC n. 123/2006, art. 13); provisão de uma rescisão sem justa causa a cada anos_aviso anos."""
    sh = sal / (JORNADA_SEM[cargo] * 5)  # salário-hora: divisor de 5 × a jornada semanal
    n = NOITES_SEM[cargo] / len(ESCALA[cargo]) * SEMANAS_MES  # noites depois das 22h por mês
    dias_sem = 6 - sum(len(sem) for sem in folgas) / len(folgas)  # dias trabalhados por semana
    dom, fer = 365.25 / 7 / 12, FERIADOS_ANO / 12
    repouso = (dom + fer) / (365.25 / 12 - dom - fer)  # dias de repouso ÷ dias úteis do mês
    c = {"Salário": sal,
         "Adicional noturno (20%)": n * 1.0 * sh * ADIC_NOTURNO,
         "Hora noturna reduzida (hora extra de 50%)": n / 7 * sh * (1 + ADIC_NOTURNO) * (1 + HORA_EXTRA)}
    c["Repouso semanal sobre os adicionais"] = (c["Adicional noturno (20%)"] + c["Hora noturna reduzida (hora extra de 50%)"]) * repouso
    c["Feriados trabalhados em dobro"] = FERIADOS_ANO * 6 / 7 * dias_sem / 6 / 12 * 2 * sal / 30
    rem = sum(c.values())
    c["Remuneração"] = rem
    c["FGTS (8%)"] = 0.08 * rem
    c["13º salário (1/12)"] = rem / 12
    c["Férias com 1/3 (1/12 × 4/3)"] = rem / 12 * 4 / 3
    c["FGTS sobre 13º e férias"] = 0.08 * (c["13º salário (1/12)"] + c["Férias com 1/3 (1/12 × 4/3)"])
    dias = 30 + 3 * (anos_aviso - 1)
    c[f"Aviso prévio indenizado (provisão, {dias} dias em {anos_aviso * 12} meses)"] = av = sal * dias / 30 / (12 * anos_aviso)
    c["FGTS sobre o aviso prévio"] = 0.08 * av
    c["Multa de 40% do FGTS (provisão)"] = 0.4 * (c["FGTS (8%)"] + c["FGTS sobre 13º e férias"] + c["FGTS sobre o aviso prévio"])
    c["INSS patronal, RAT e terceiros (no DAS)"] = 0.0
    c["Vale-transporte (parte do empregador)"] = max(0.0, 2 * TARIFA_VT * dias_sem * SEMANAS_MES - 0.06 * sal) if vt else 0.0
    ks = list(c)
    c["Custo mensal"] = rem + sum(c[k] for k in ks[ks.index("Remuneração") + 1:])
    return c


def pessoal_detalhe(quadro) -> dict:
    """Por cargo: remuneração média por pessoa e custo linha a linha de cada pessoa da escala."""
    out = {}
    for cargo, _, q, s, _ in quadro:
        pessoas = [custo_empregado(s, cargo, fl) for fl in ESCALA[cargo]]
        assert len(pessoas) == q, cargo
        out[cargo] = dict(pessoas=pessoas, remuneracao=sum(p["Remuneração"] for p in pessoas) / q)
    return out


def encargos_c07(quadro, anos_aviso: int, vt: bool) -> float:
    """Encargos, provisões e vale-transporte ÷ remuneração, na equipe inteira (premissa C07)."""
    rem = enc = 0.0
    for cargo, _, q, s, _ in quadro:
        for fl in ESCALA[cargo]:
            c = custo_empregado(s, cargo, fl, anos_aviso, vt)
            rem += c["Remuneração"]
            enc += c["Custo mensal"] - c["Remuneração"]
    return enc / rem


def premissas(f) -> list[dict]:
    # I01 a I04: totais do orçamento do B5 (P75, mediana e P25 das ofertas; I01 em R$ por m²)
    def b5(pid, col="total"):
        return tuple(round(float(f["b5"].at[pid, f"{col}_{c}"]), 2) for c in CENARIOS)

    def cob(pid):
        r = f["b5"].loc[pid]
        falta = "" if r["itens_com_preco"] == r["itens"] else f", {r['itens'] - r['itens_com_preco']} sem preço ainda"
        return f"{r['itens_com_preco']} de {r['itens']} itens com preço{falta}."
    """Registro de premissas (§3). Percentuais como fração. Ordem = ordem da aba."""
    vis = f["visitas"]
    pg, pm = vis["tamanho_grupo_mesa"], vis["permanencia_mesa_media_min"]
    MESAS = 6
    # dia útil ÷ fim de semana: gasto médio por dia de segunda a quinta ÷ de sexta a domingo, em
    # restaurantes de loja física, 2º tri 2025 a 2º tri 2026 (Mastercard Economics Institute e ANR)
    du_fds = {"Rio de Janeiro": (10.0 + 11.0 + 11.4 + 12.8) / 4 / ((16.9 + 20.2 + 17.7) / 3),
              "São Paulo": (100 - 17.9 - 17.1 - 17.0) / 4 / ((17.0 + 17.9 + 17.1) / 3)}
    # circulação no pico: pessoas que entram por hora nas visitas, sem escala pelas mesas (a demanda
    # vem do público, não do salão, até ele lotar); provável na média e otimista na maior visita.
    # Pessimista: NFC-e por dia de cada unidade convertidas em pessoas por hora no pico, com as horas
    # de pico equivalentes do horário da São Jogue e a semana de 3 dias de fim de semana e 4 úteis
    # no dia útil pessimista; média das duas unidades (decisões do autor, 02/11/2026)
    circ = vis["pessoas_por_hora"]
    f["circulacao_visitas"] = circ
    hs = f["horas_pico_sj"]
    eq_sj = sum(hs[d] for d in ("sexta", "sabado", "domingo")) / 3
    nf = f["notas"].set_index("unidade")
    por_nota = [nf.loc[u, "notas_emitidas"] / nf.loc[u, "dias"] * 7 / (eq_sj * (3 + 4 * min(du_fds.values())))
                for u in ("BV", "PA")]
    circ_nfce = sum(por_nota) / len(por_nota)
    f["circulacao_nfce"], f["horas_pico_sj_fds"] = por_nota, eq_sj
    # gasto por pessoa: média, mínimo e máximo dos gastos médios das casas (B2); parcela da taxa
    gc = f["gasto_casas"]
    gasto = (gc["gasto_medio"].min(), gc["gasto_medio"].mean(), gc["gasto_medio"].max())
    gcc = gc.dropna(subset=["cesta_consumo"])
    parcela = gcc["taxa_ponderada"].mean() / gcc["cesta_consumo"].mean()
    f["gasto_casas_cesta"] = gcc
    f["gasto"], f["parcela_taxa"] = gasto, parcela
    hp = f["horas_pico"]
    r15 = sum(hp[d] for d in ("sexta", "sabado", "domingo")) / 3
    f["teto_circ"] = MESAS * pg.mean() * 60 / pm.mean()
    cb = f["cobertura"]
    cob_du = sum(cb[d] for d in ("terca", "quarta", "quinta")) / 3
    cob_fds = sum(cb[d] for d in ("sexta", "sabado", "domingo")) / 3
    # acréscimo salarial máximo (C06), provisório: maior distância entre o 3º quartil
    # e a mediana do salário de admissão entre os cargos do quadro
    c = f["caged"]
    acr = max(float(c[(c["ocupacao"] == o) & (c["recorte"] == rc)].eval("salario_p75 / salario_mediana - 1").iloc[0])
              for o, rc in (("Cozinheiro geral", "CNAE 56 - alimentação"), ("Recreador", "todas as atividades")))
    a = f["acervo"]
    q_ = quadro_pessoal(f)
    # refeições da equipe (C15): uma por turno trabalhado
    refeicoes = sum(6 - sum(len(sem) for sem in fl) / len(fl) for cargo, _, _, _, _ in q_ for fl in ESCALA[cargo]) * SEMANAS_MES
    R = lambda *x: dict(zip(("id", "nome", "unidade", "pess", "prov", "otim", "fonte", "nivel", "just"), x))
    return [
        R("R01", "Mesas do salão", "mesas", MESAS, MESAS, MESAS,
          "Decisão do autor (desenho enxuto); B3: maior ocupação vista nas visitas", "N5 + N6",
          f"Capacidade do salão; limita a circulação no pico a {f['teto_circ']:.1f} pessoas por hora (mesas × pessoas por mesa ÷ permanência)."),
        R("R02", "Pessoas por mesa ocupada", "pessoas", 2.5, round(pg.mean(), 1), 5.5,
          "B3, 4 visitas (out/2026); faixa do autor", "N5 + N6",
          f"Média das visitas {pg.mean():.1f} (de {pg.min():.1f} a {pg.max():.1f}); não entra na receita, só no teto do salão (R01)."),
        R("R03", "Permanência média", "min", 137, round(pm.mean()), 83,
          "B3, 4 visitas (out/2026)", "N5",
          f"Médias por visita de {pm.min():.0f} a {pm.max():.0f} min; não entra na receita, só no teto do salão (R01)."),
        R("R04", "Circulação no pico de fim de semana", "pessoas por hora", *[round(z, 2) for z in (circ_nfce, circ.mean(), circ.max())],
          "B3, 4 visitas nas noites de sexta e sábado e NFC-e entre visitas (out/2026)", "N5",
          f"Pessoas que entram por hora na São Jogue, sem escala pelas mesas: provável na média das visitas e otimista na maior. Pessimista: NFC-e por dia (uma nota por pessoa, só a pedido) ÷ {eq_sj:.2f} h de pico equivalentes do horário da São Jogue e semana com o dia útil pessimista; média da Bela Vista ({por_nota[0]:.2f}) e da Paralela ({por_nota[1]:.2f})."),
        R("R05", "Circulação de dia útil", "% do fim de semana", round(min(du_fds.values()), 4),
          round(sum(du_fds.values()) / 2, 4), round(max(du_fds.values()), 4),
          "Mastercard Economics Institute e ANR, gasto em restaurantes de loja física, 2º tri 2025 a 2º tri 2026", "N4",
          "Gasto médio por dia de segunda a quinta ÷ de sexta a domingo: Rio de Janeiro no pessimista, São Paulo no otimista, média das duas no provável."),
        R("R06", "Gasto por pessoa (cesta de consumo)", "R$ por pessoa", *[round(z, 2) for z in gasto],
          f"B2, preço por pessoa declarado no Google Maps, {int(gc['avaliacoes'].sum())} avaliações de {len(gc)} casas", "N3",
          "Média dos gastos médios das casas com taxa de entrada conhecida; pessimista e otimista na casa de menor e de maior gasto."),
        R("R07", "Parcela da taxa de entrada no gasto", "% do gasto", round(parcela, 4), round(parcela, 4), round(parcela, 4),
          f"B1, cardápios e taxas de entrada de {len(f['gasto_casas_cesta'])} dessas casas", "N3",
          "Taxa de entrada média ÷ cesta de consumo média (taxa + bebida + hambúrguer); separa a receita de taxa (anexo III) da de A&B (anexo I e CMV)."),
        R("R09", "Aluguéis de jogos", "aluguéis por mês", 10, 30, 60,
          "Estimativa do autor", "N6",
          "Serviço oferecido pela São Jogue; volume não observado."),
        R("R10", "Preço médio do aluguel de jogo", "R$", 15, 30, 40,
          "Tabela da São Jogue (4 dias: R$ 15,00 a R$ 60,00)", "N3",
          "Categoria prata como provável."),
        R("R11", "Ocupação no mês 1", "% da madura", 0.30, 0.40, 0.50,
          "Estimativa do autor (_instrucoes, §5)", "N6",
          "Sem ocupação madura no mês 1."),
        R("R12", "Meses até a maturidade", "meses", 12, 9, 6,
          "Estimativa do autor (_instrucoes, §5)", "N6",
          "Rampa de 6 a 12 meses."),
        R("R13", "Horas abertas por semana, fim de semana", "h", 24, 24, 24,
          "B1: horário de 49 concorrentes (Google Maps, out/2026); decisão do autor", "N3",
          "Sexta e sábado das 14h às 23h (9 h) e domingo das 14h às 20h (6 h): cobre o pico de sábado (18h) e o de domingo (17h); decisão do autor, 04/11/2026."),
        R("R14", "Horas abertas por semana, dia útil", "h", 27, 27, 27,
          "B1: horário de 49 concorrentes (Google Maps, out/2026); decisão do autor", "N3",
          "Terça a quinta das 14h às 23h; segunda fechada (71% dos concorrentes fecham)."),
        R("R15", "Horas de pico equivalentes por dia de fim de semana", "h", round(r15, 2), round(r15, 2), round(r15, 2),
          "B1: horário de 54 concorrentes (Google Maps, out/2026)", "N3",
          f"Soma, nas horas abertas do plano, das casas abertas em cada hora ÷ casas abertas nas janelas das visitas do B3; média de sexta ({hp['sexta']:.2f}), sábado ({hp['sabado']:.2f}) e domingo ({hp['domingo']:.2f})."),
        R("R16", "Dias abertos por semana, fim de semana", "dias", 3, 3, 3,
          "Decisão do autor (desenho enxuto)", "N3", "Sexta a domingo."),
        R("R17", "Dias abertos por semana, dia útil", "dias", 3, 3, 3,
          "Decisão do autor (desenho enxuto); B1", "N3", "Terça a quinta; segunda fechada."),
        R("R18", "Variação anual da demanda a partir do ano 3", "% ao ano", -0.05, 0.0, 0.02,
          "Estimativa do autor", "N6",
          "Pessimista: fim da novidade e reação da São Jogue; otimista: boca a boca, até o teto do salão (02/11/2026)."),
        R("R19", "Ajuste do horário de dia útil", "× fim de semana", round(cob_du / cob_fds, 4), round(cob_du / cob_fds, 4), round(cob_du / cob_fds, 4),
          "B1: horário de 54 concorrentes (Google Maps, out/2026)", "N3",
          f"O dia útil usa as horas de pico do fim de semana (R15), corrigidas pela cobertura do horário: casas abertas nas horas do plano ÷ casas abertas no dia, média de terça a quinta ({cob_du:.1%}) ÷ média de sexta a domingo ({cob_fds:.1%}). Vale 1,00 quando os horários cobrem o dia na mesma proporção."),
        R("C01", "CMV de alimentos e bebidas", "% do A&B", 0.35, 0.30, 0.26,
          "IBGE PAS 2023, serviços de alimentação (B4)", "N2",
          f"Mercadorias e materiais = {f['pas_mercadorias_pct']:.1f}% da receita líquida do setor."),
        R("C02", "Taxa de cartão", "% da receita", 0.035, 0.030, 0.025,
          "Estimativa do autor", "N6",
          "Mistura de débito, crédito e Pix."),
        R("C03", "Área do ponto", "m²", 150, 130, 110,
          "Estimativa do autor; fotos da São Jogue Bela Vista", "N6",
          "Salão de 6 mesas (cerca de 12 m² por mesa) mais 60 m² de cozinha, balcão, acervo e banheiros; a Bela Vista tem salão de 75 a 95 m² para 10 mesas."),
        R("C04", "Aluguel comercial", "R$ por m² ao mês", round(f["aluguel_m2"] * (1 + f["aluguel_var12m"] / 100), 2), round(f["aluguel_m2"], 2), 45,
          "FipeZap, locação comercial, Salvador, jul/2026 (B4)", "N2",
          f"Pessimista com a alta de {f['aluguel_var12m']:.1f}% em 12 meses; otimista para ponto fora de shopping."),
        R("C05", "Condomínio e IPTU", "% do aluguel", 0.30, 0.20, 0.10,
          "Estimativa do autor", "N6", "Maior em shopping."),
        R("C06", "Acréscimo sobre o salário de admissão", "% do salário do CAGED", round(acr, 4), 0.0, 0.0,
          "Novo CAGED, Salvador, 3º quartil ÷ mediana do salário de admissão (B4)", "N2 + N6",
          f"O CAGED registra a admissão, que tende a pagar menos que o estoque; variação só para cima, de 0% a {acr:.1%} (provisório: maior distância do 3º quartil à mediana entre os cargos; x a definir pelo autor)."),
        R("C07", "Encargos, provisões e vale-transporte", "% da remuneração",
          encargos_c07(q_, 1, True), encargos_c07(q_, 5, True), encargos_c07(q_, 5, False),
          "CLT e Lei n. 8.036/1990 (FGTS, 13º, férias, aviso prévio e multa de 40%), Lei n. 7.418/1985 (vale-transporte)", "N1 + N6",
          "No Simples, a contribuição patronal fica no DAS dos anexos I e III. Provável: uma rescisão sem justa causa por vaga em 5 anos; pessimista: uma por ano; otimista: sem vale-transporte."),
        R("C08", "Pró-labore", "R$ por mês", 4000, 3000, 2000, "Estimativa do autor", "N6", "Um sócio na gestão."),
        R("C09", "Utilidades (energia, água, gás, internet)", "R$ por mês", 6000, 4500, 3500, "Estimativa do autor", "N6", "Cozinha própria e ar-condicionado."),
        R("C10", "Marketing", "R$ por mês", 2000, 1500, 1000, "Estimativa do autor", "N6", "Redes sociais e eventos."),
        R("C11", "Contabilidade", "R$ por mês", 1500, 1200, 900, "Estimativa do autor", "N6", "Escritório para empresa do Simples com folha."),
        R("C12", "Sistemas (caixa, reservas, nota fiscal)", "R$ por mês", 600, 450, 300, "Estimativa do autor", "N6", "Assinaturas."),
        R("C13", "Reposição do acervo", "% do acervo ao ano", 0.15, 0.10, 0.05, "Estimativa do autor", "N6", "Peças perdidas e jogos novos."),
        R("C14", "Refeição da equipe no local", "R$ por refeição", 15, 12, 9, "Estimativa do autor", "N6",
          "Insumos de uma refeição por turno, feita pela cozinha da casa (benefício sem natureza salarial: CLT, art. 458, § 2º); decisão do autor, 04/11/2026."),
        R("C15", "Refeições da equipe", "refeições por mês", round(refeicoes, 1), round(refeicoes, 1), round(refeicoes, 1),
          "Escala do cap. 7", "N1", "Uma por turno: dias trabalhados por semana de cada empregado × semanas do mês."),
        R("C16", "Participação nos lucros ou resultados (PLR)", "% do EBITDA positivo do ano", 0.05, 0.05, 0.05,
          "Decisão do autor (04/11/2026); Lei n. 10.101/2000", "N1",
          "Paga só em ano com EBITDA positivo, sem encargos; rateio por pontos e metas da área (cap. 7)."),
        R("I01", "Reforma e instalações", "R$ por m²", *b5("I01", "i01_rs_m2"),
          "B5: SINAPI BA (Caixa, set/2026, com BDI do TCU) e coletas em sites (nov/2026); quantidades do autor", "N2 + N3 + N6",
          f"{cob('I01')} Ponto alugado sem obra estrutural; piso, forro e paredes por cenário; split de 30.000 BTU/h."),
        R("I02", "Mobiliário (mesas, cadeiras, estantes)", "R$", *b5("I02"),
          "B5: coletas na Amazon e no Mercado Livre (nov/2026); quantidades do autor", "N3 + N6",
          f"{cob('I02')} 6 mesas, 33 cadeiras, 6 pendentes, estantes do acervo e armário, em estilo industrial."),
        R("I03", "Cozinha e bar", "R$", *b5("I03"),
          "B5: coletas na Amazon e no Mercado Livre (nov/2026); quantidades do autor", "N3 + N6",
          f"{cob('I03')} Cocção, exaustão, refrigeração, preparo, louça e talheres; lava-louças só no pessimista."),
        R("I04", "Caixa e informática", "R$", *b5("I04"),
          "B5: coletas na Amazon e no Mercado Livre (nov/2026); quantidades do autor", "N3 + N6",
          f"{cob('I04')} Computador, impressora de nota, roteador, som e câmeras; maquininha cedida sem custo a PJ."),
        R("I05", "Acervo inicial de jogos", "R$", *[round(f["acervo_faixa"]["joelho"][c], 2) for c in ("custo_pessimista_rs", "custo_provavel_rs", "custo_otimista_rs")],
          "B1, acervos de 30 concorrentes e preço de venda nas lojas online de 8 deles (out/2026)", "N3",
          f"Joelho da curva de presença: os {f['acervo_titulos']['joelho']} jogos presentes em 12 ou mais das 30 casas (decisão do autor; etapa 1 da P7); provável pela mediana de venda de cada jogo, ± 15% (3º quartil da variação do preço do mesmo jogo entre lojas); a São Jogue lista 370."),
        R("I06", "Gastos pré-operacionais", "R$", 30000, 20000, 12000, "Estimativa do autor", "N6", "Projeto, licenças, contratação e lançamento."),
        R("I07", "Caução do aluguel", "meses de aluguel", 3, 3, 2, "Estimativa do autor", "N6", "Prática de locação comercial."),
        R("I08", "Capital de giro", "meses de custo fixo", 3, 2, 1.5, "Estimativa do autor", "N6", "Cobre a rampa de maturação."),
        R("I09", "Revenda dos ativos na saída (G6)", "% de mobiliário, cozinha, informática e acervo", 0.20, 0.30, 0.40,
          "Estimativa do autor", "N6", "Só no Monte Carlo: valor recuperado quando o gatilho G6 encerra o negócio (02/11/2026)."),
        R("M01", "Taxa mínima de atratividade (real)", "% ao ano", 0.18, 0.15, 0.12,
          "BCB: Selic meta e Focus (B4); prêmio de risco do autor", "N2 + N6",
          f"Juro real de {f['juro_real']:.1f}% (Selic {f['selic']:.1f}% e IPCA esperado de {f['ipca_2027']:.1f}% para 2027) mais 3 a 9 p.p. de risco de pequeno negócio."),
        R("M02", "Semanas por mês", "semanas", 52 / 12, 52 / 12, 52 / 12, "Calendário", "N1", "52 semanas ÷ 12 meses."),
        R("M03", "Valor residual no ano 5", "1 com, 0 sem", 1, 1, 1, "Assaf Neto (2014), perpetuidade sem crescimento", "N1",
          "Fluxo do ano 5 (EBITDA menos reinvestimento igual à depreciação) ÷ TMA, com piso zero; sem valor residual na aba sensibilidade."),
    ]


# --------------------------------------------------------------- modelo (Py)
def aliquota(f, anexo: str, rbt: float) -> float:
    t = f["simples"][anexo]
    if rbt <= 0:
        return 0.0
    linha = t[t["rbt12_min"] <= rbt].iloc[-1]
    return max(0.0, (rbt * linha["aliquota_nominal_pct"] / 100 - linha["parcela_deduzir"]) / rbt)


def calcula(f, v: dict, folha: float) -> dict:
    m = []
    for mes in range(1, MESES + 1):
        ano_ = (mes - 1) // 12 + 1
        rampa = min(1.0, v["R11"] + (1 - v["R11"]) * (mes - 1) / (v["R12"] - 1))
        # tendência da demanda a partir do ano 3 (R18), limitada pelo salão: mesas × pessoas por mesa
        # ÷ permanência; R01_exp só existe no Monte Carlo (etapa de mesas a partir do ano 2)
        tend = (1 + v["R18"]) ** max(0, ano_ - 2)
        mesas = v["R01"] if ano_ == 1 else v.get("R01_exp", v["R01"])
        r04 = min(mesas * v["R02"] * 60 / v["R03"], v["R04"] * tend)
        p_fds = r04 * v["R15"] * v["R16"] * rampa * v["M02"]
        p_du = r04 * v["R05"] * v["R15"] * v["R19"] * v["R17"] * rampa * v["M02"]
        taxa_fds, taxa_du = p_fds * v["R06"] * v["R07"], p_du * v["R06"] * v["R07"]
        ab = (p_fds + p_du) * v["R06"] * (1 - v["R07"])
        alug = v["R09"] * v["R10"] * rampa * tend
        m.append(dict(ano=(mes - 1) // 12 + 1, pessoas=p_fds + p_du, taxa=taxa_fds + taxa_du,
                      ab=ab, alug=alug, bruta=taxa_fds + taxa_du + ab + alug))
    m = pd.DataFrame(m)
    rbt = m.groupby("ano")["bruta"].sum()
    al_i = {a: aliquota(f, "I", rbt[a]) for a in rbt.index}
    al_iii = {a: aliquota(f, "III", rbt[a]) for a in rbt.index}
    m["simples"] = m["ab"] * m["ano"].map(al_i) + (m["taxa"] + m["alug"]) * m["ano"].map(al_iii)
    m["cmv"] = m["ab"] * v["C01"]
    m["cartao"] = m["bruta"] * v["C02"]
    aluguel = v["C03"] * v["C04"]
    fixos = (aluguel * (1 + v["C05"]) + folha * (1 + v["C06"]) * (1 + v["C07"]) + v["C08"] + v["C09"]
             + v["C10"] + v["C11"] + v["C12"] + v["I05"] * v["C13"] / 12 + v["C14"] * v["C15"])
    m["fixos"] = fixos
    m["ebitda"] = m["bruta"] - m["simples"] - m["cmv"] - m["cartao"] - m["fixos"]
    inv = dict(reforma=v["I01"] * v["C03"], mobiliario=v["I02"], cozinha=v["I03"], ti=v["I04"],
               acervo=v["I05"], preop=v["I06"], caucao=v["I07"] * aluguel, giro=v["I08"] * fixos)
    total_inv = sum(inv.values())
    ano = m.groupby("ano")[["bruta", "simples", "cmv", "cartao", "fixos", "ebitda"]].sum()
    # PLR (C16): parcela do EBITDA anual positivo, paga depois do fechamento do ano
    ano["ebitda_pre"] = ano["ebitda"]
    ano["plr"] = v["C16"] * ano["ebitda_pre"].clip(lower=0)
    ano["ebitda"] = ano["ebitda_pre"] - ano["plr"]
    deprec = sum(inv[k] / VIDA_UTIL[k] for k in VIDA_UTIL)
    residual = v["M03"] * max(0.0, (ano.loc[ANOS, "ebitda"] - deprec) / v["M01"])
    fc = [-total_inv] + list(ano["ebitda"])
    fc[-1] += inv["caucao"] + inv["giro"] + residual
    desc = [x / (1 + v["M01"]) ** t for t, x in enumerate(fc)]
    vpl = sum(desc)
    acum, payback = 0.0, float("nan")
    for t, d in enumerate(desc):
        if t and acum < 0 <= acum + d:
            payback = t - 1 + (-acum) / d
            break
        acum += d
    mc_pct = 1 - (ano.loc[ANOS, ["simples", "cmv", "cartao"]].sum() / ano.loc[ANOS, "bruta"])
    return dict(vpl=vpl, tir=tir(fc), payback=payback, investimento=total_inv, inv=inv, fc=fc, residual=residual,
                receita_madura=m["bruta"].iloc[-1], pessoas_madura=m["pessoas"].iloc[-1],
                fixos=fixos, ebitda5=ano.loc[ANOS, "ebitda"], mc_pct=mc_pct,
                receita_equilibrio=fixos / mc_pct, alug_madura=m["alug"].iloc[-1], ano=ano)


def tir(fc: list) -> float:
    def vpl(r):
        return sum(x / (1 + r) ** t for t, x in enumerate(fc))
    lo, hi = -0.99, 10.0
    if vpl(lo) * vpl(hi) > 0:
        return float("nan")
    for _ in range(200):
        mid = (lo + hi) / 2
        if vpl(lo) * vpl(mid) <= 0:
            hi = mid
        else:
            lo = mid
    return (lo + hi) / 2


def valores(prem: list[dict], cenario: str) -> dict:
    return {p["id"]: p[cenario[:4] if cenario != "provavel" else "prov"] for p in prem}


def ruptura(f, prem, folha, pid: str):
    """Valor da premissa que zera o VPL (demais no provável), por bisseção."""
    base = valores(prem, "provavel")
    def vpl(x):
        v = dict(base, **{pid: x})
        return calcula(f, v, folha)["vpl"]
    p0 = base[pid]
    lo, hi = p0 * 0.05, p0 * 6
    if pid == "R05":
        lo, hi = 0.001, 1.0
    if vpl(lo) * vpl(hi) > 0:
        return float("nan")
    for _ in range(80):
        mid = (lo + hi) / 2
        if vpl(lo) * vpl(mid) <= 0:
            hi = mid
        else:
            lo = mid
    return (lo + hi) / 2


def pert(rng, lo, moda, hi):
    """Sorteio da distribuição PERT (beta com moda e extremos dados)."""
    if hi <= lo:
        return lo
    a = 1 + 4 * (moda - lo) / (hi - lo)
    b = 1 + 4 * (hi - moda) / (hi - lo)
    return lo + (hi - lo) * rng.betavariate(a, b)


def calcula_mc(f, v: dict, folha: float, quadro) -> dict:
    """Um cenário do Monte Carlo com as decisões de gestão do cap. 10 (02/11/2026):
    - etapa de mesas: se a demanda sorteada (R04) passa do teto do salão, a luderia abre mais
      MC_EXPANSAO mesas a partir do ano 2, com mobiliário proporcional (I02) pago no fim do ano 1;
    - G5: ano (a partir do 2) com EBITDA negativo corta, no ano seguinte, um cozinheiro
      (cardápio de comidas recebidas prontas), com encargos;
    - G6: se o EBITDA segue negativo com o G5 ativo, a luderia fecha no fim desse ano e recupera
      caução, capital de giro e a revenda dos ativos (I09); sem valor residual."""
    teto = v["R01"] * v["R02"] * 60 / v["R03"]
    expande = v["R04"] > teto
    w = dict(v, R01_exp=v["R01"] + MC_EXPANSAO) if expande else v
    r = calcula(f, w, folha)
    inv, ano = r["inv"], r["ano"]
    deprec = sum(inv[k] / VIDA_UTIL[k] for k in VIDA_UTIL)
    corte = pessoal_detalhe(quadro)["Cozinheiro-chefe"]["remuneracao"] * 12 * (1 + v["C06"]) * (1 + v["C07"])
    revenda = v["I09"] * (inv["mobiliario"] + inv["cozinha"] + inv["ti"] + inv["acervo"])
    fc = [-r["investimento"], float(ano.loc[1, "ebitda"])]
    if expande:
        fc[1] -= v["I02"] * MC_EXPANSAO / v["R01"]
    g5, fechou, e = False, False, 0.0
    for t in range(2, ANOS + 1):
        e = float(ano.loc[t, "ebitda_pre"]) + (corte if g5 else 0.0)
        e -= v["C16"] * max(0.0, e)
        if g5 and e < 0:
            fc.append(e + inv["caucao"] + inv["giro"] + revenda)
            fc += [0.0] * (ANOS - t)
            fechou = True
            break
        fc.append(e)
        g5 = g5 or e < 0
    if not fechou:
        fc[-1] += inv["caucao"] + inv["giro"] + v["M03"] * max(0.0, (e - deprec) / v["M01"])
    desc = [x / (1 + v["M01"]) ** t for t, x in enumerate(fc)]
    acum, payback = 0.0, float("nan")
    for t, dsc in enumerate(desc):
        if t and acum < 0 <= acum + dsc:
            payback = t - 1 + (-acum) / dsc
            break
        acum += dsc
    return dict(vpl=sum(desc), payback=payback, expande=expande, g5=g5, fechou=fechou)


def monte_carlo(f, prem, folha, quadro) -> dict:
    """Simulação de Monte Carlo (§4.4): PERT entre o pessimista e o otimista, moda no provável, salvo
    MC_FAIXA (faixa própria), MC_FIXAS (fora do sorteio) e as mesas ocupadas, que sorteiam a demanda até
    o maior valor visto nas visitas; premissas independentes entre si; gatilhos e etapa em calcula_mc."""
    rng = random.Random(SEMENTE)
    base = valores(prem, "provavel")
    vpls, paybacks, exp, g5, fech = [], [], 0, 0, 0
    for _ in range(N_SIMULACOES):
        v = dict(base)
        for p in prem:
            if p["id"] in MC_FIXAS or p["pess"] == p["otim"]:
                continue
            lo, hi = MC_FAIXA.get(p["id"], (min(p["pess"], p["otim"]), max(p["pess"], p["otim"])))
            v[p["id"]] = pert(rng, lo, p["prov"], hi)
        r = calcula_mc(f, v, folha, quadro)
        vpls.append(r["vpl"])
        paybacks.append(r["payback"])
        exp += r["expande"]; g5 += r["g5"]; fech += r["fechou"]
    s = pd.Series(vpls)
    pb = pd.Series(paybacks)
    n = N_SIMULACOES
    return dict(vpls=vpls, prob_positivo=(s > 0).mean(), media=s.mean(), p05=s.quantile(.05), p10=s.quantile(.10),
                p25=s.quantile(.25), mediana=s.median(), p75=s.quantile(.75), p90=s.quantile(.90), p95=s.quantile(.95),
                payback_5anos=pb.notna().mean(), payback_mediana=pb.dropna().median() if pb.notna().any() else float("nan"),
                expansao=exp / n, g5=g5 / n, fechamento=fech / n,
                erro_prob=((s > 0).mean() * (1 - (s > 0).mean()) / n) ** 0.5)


# --------------------------------------------------------------- planilha
FONTE = Font(name="Arial", size=10, color="000000")
NEGRITO = Font(name="Arial", size=10, color="000000", bold=True)
BRANCO = PatternFill("solid", fgColor="FFFFFF")
FINA = Side(style="thin", color="000000")
MOEDA, PCT, DEC1, DEC2, INT = "#,##0.00", "0.00%", "#,##0.0", "#,##0.00", "#,##0"
COL_MES = [get_column_letter(3 + i) for i in range(MESES)]  # C..BJ


def titulo(ws, texto, ncol):
    ws.cell(1, 1, texto)
    ws.merge_cells(start_row=1, start_column=1, end_row=1, end_column=ncol)


def estilo(ws, linha_cab, ultima, ncol, fmt=None):
    """Arial 10, fundo branco, cabeçalho centralizado em negrito com borda em cima e embaixo,
    borda inferior na última linha; texto à esquerda e número à direita."""
    for row in ws.iter_rows(min_row=1, max_row=max(ws.max_row, ultima), max_col=ncol):
        for c in row:
            c.font, c.fill = FONTE, BRANCO
            if c.row == 1:
                c.font, c.alignment = NEGRITO, Alignment(horizontal="center")
            elif c.row == linha_cab:
                c.font = NEGRITO
                c.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
                c.border = Border(top=FINA, bottom=FINA)
            elif linha_cab < c.row <= ultima:
                txt = isinstance(c.value, str) and not str(c.value).startswith("=")
                c.alignment = Alignment(horizontal="left" if txt else "right", vertical="top", wrap_text=txt)
                if c.row == ultima:
                    c.border = Border(bottom=FINA)
                if fmt and not txt and c.column > 1:
                    c.number_format = fmt


def nota(ws, linha, texto, ncol):
    ws.cell(linha, 1, texto).font = FONTE
    ws.cell(linha, 1).alignment = Alignment(wrap_text=True, vertical="top")
    ws.merge_cells(start_row=linha, start_column=1, end_row=linha, end_column=ncol)
    ws.row_dimensions[linha].height = 15 * max(1, len(texto) // 110 + 1)


def planilha(f, prem, quadro, resultados, tornado, rupt, mc, sem_residual):
    wb = openpyxl.Workbook()
    # ---- premissas
    ws = wb.active
    ws.title = "premissas"
    titulo(ws, "Registro de premissas do modelo financeiro", 11)
    ws["A2"], ws["D2"] = "Cenário ativo (1 = pessimista, 2 = provável, 3 = otimista)", 2
    cab = ["ID", "Premissa", "Unidade", "Pessimista", "Provável", "Otimista", "Valor usado",
           "Fonte", "Nível", "Justificativa da faixa", "Impacto no VPL"]
    for j, h in enumerate(cab, 1):
        ws.cell(4, j, h)
    impacto = {t["id"]: ("Alto" if i < 5 else "Médio" if i < 10 else "Baixo") for i, t in enumerate(tornado)}
    linha_de = {}
    for i, p in enumerate(prem):
        r = 5 + i
        linha_de[p["id"]] = r
        for j, k in enumerate(("id", "nome", "unidade", "pess", "prov", "otim"), 1):
            ws.cell(r, j, p[k])
        ws.cell(r, 7, f"=CHOOSE($D$2,D{r},E{r},F{r})")
        ws.cell(r, 8, p["fonte"]); ws.cell(r, 9, p["nivel"]); ws.cell(r, 10, p["just"])
        ws.cell(r, 11, impacto.get(p["id"], "Baixo"))
        wb.defined_names[f"P_{p['id']}"] = DefinedName(f"P_{p['id']}", attr_text=f"premissas!$G${r}")
    ult = 4 + len(prem)
    estilo(ws, 4, ult, 11)
    for p in prem:
        r = linha_de[p["id"]]
        fmt = PCT if p["unidade"].startswith("%") else (MOEDA if p["unidade"].startswith("R$") else DEC2)
        for c in range(4, 8):
            ws.cell(r, c).number_format = fmt
    ws["A2"].font = NEGRITO
    ws["D2"].font = NEGRITO
    nota(ws, ult + 2, "Fonte: elaboração própria com dados dos Blocos B1, B3 e B4 (out/2026). Níveis de evidência N1 (mais confiável) a N6 (estimativa do autor), conforme _instrucoes/8_financeiro.md. Impacto no VPL pelo tornado (aba sensibilidade): 5 maiores = Alto, 5 seguintes = Médio.", 11)
    for col, w in zip("ABCDEFGHIJK", (6, 34, 16, 12, 12, 12, 12, 36, 9, 52, 10)):
        ws.column_dimensions[col].width = w

    # ---- pessoal
    ws = wb.create_sheet("pessoal")
    titulo(ws, "Quadro de pessoal de referência, salários de admissão em Salvador e adicionais da escala", 7)
    det = pessoal_detalhe(quadro)
    for j, h in enumerate(["Cargo", "CBO", "Quantidade", "Salário mensal (R$)", "Adicionais da escala por pessoa (R$)",
                           "Remuneração total mensal (R$)", "Fonte"], 1):
        ws.cell(2, j, h)
    for i, (cargo, cbo, q, s, fonte) in enumerate(quadro):
        r = 3 + i
        ws.cell(r, 1, cargo); ws.cell(r, 2, cbo); ws.cell(r, 3, q); ws.cell(r, 4, s)
        ws.cell(r, 5, det[cargo]["remuneracao"] - s)
        ws.cell(r, 6, f"=C{r}*(D{r}+E{r})"); ws.cell(r, 7, fonte)
    rt = 3 + len(quadro)
    ws.cell(rt, 1, "Total"); ws.cell(rt, 3, f"=SUM(C3:C{rt - 1})"); ws.cell(rt, 6, f"=SUM(F3:F{rt - 1})")
    estilo(ws, 2, rt, 7)
    for r in range(3, rt + 1):
        ws.cell(r, 3).number_format = INT
        ws.cell(r, 4).number_format = ws.cell(r, 5).number_format = ws.cell(r, 6).number_format = MOEDA
    wb.defined_names["FOLHA_REF"] = DefinedName("FOLHA_REF", attr_text=f"pessoal!$F${rt}")
    wb.defined_names["QUADRO_N"] = DefinedName("QUADRO_N", attr_text=f"pessoal!$C${rt}")
    nota(ws, rt + 2, "Fonte: Novo CAGED (MTE), salário de admissão, mediana, ago/2025 a jul/2026 (B4). Adicionais pela escala de turnos de 7 h "
         "(noturno, hora noturna reduzida, repouso sobre eles e feriados em dobro; CLT, art. 73; Lei n. 605/1949, art. 9º). "
         "Acréscimo salarial e encargos na aba premissas (C06 e C07); custo linha a linha abaixo.", 7)
    # custo linha a linha de cada pessoa da escala (provável)
    r0 = rt + 4
    ws.cell(r0, 1, "Custo mensal por pessoa, cenário provável (R$)")
    linhas = list(det[quadro[0][0]]["pessoas"][0])
    nomes = [f"{cargo} {i + 1}" for cargo, *_ in quadro for i in range(len(det[cargo]["pessoas"]))]
    ws.cell(r0 + 1, 1, "Linha")
    for j, nm in enumerate(nomes, 2):
        ws.cell(r0 + 1, j, nm)
    pessoas = [p for cargo, *_ in quadro for p in det[cargo]["pessoas"]]
    for i, ln in enumerate(linhas):
        ws.cell(r0 + 2 + i, 1, ln)
        for j, p in enumerate(pessoas, 2):
            ws.cell(r0 + 2 + i, j, round(p[ln], 2)).number_format = MOEDA
    estilo(ws, r0 + 1, r0 + 1 + len(linhas), 1 + len(pessoas))
    for col, w in zip("ABCDEFG", (44, 16, 16, 16, 16, 16, 50)):
        ws.column_dimensions[col].width = w

    # ---- simples
    ws = wb.create_sheet("simples")
    titulo(ws, "Simples Nacional: faixas dos anexos I e III e alíquota efetiva por ano", 6)
    blocos = {"I": 4, "III": 13}
    for anexo, r0 in blocos.items():
        ws.cell(r0 - 1, 1, f"Anexo {anexo}")
        for j, h in enumerate(["Faixa", "RBT12 mínima (R$)", "RBT12 máxima (R$)", "Alíquota nominal (%)", "Parcela a deduzir (R$)"], 1):
            ws.cell(r0, j, h)
        for i, row in f["simples"][anexo].iterrows():
            r = r0 + 1 + i
            for j, k in enumerate(("faixa", "rbt12_min", "rbt12_max", "aliquota_nominal_pct", "parcela_deduzir"), 1):
                ws.cell(r, j, float(row[k]) if j > 1 else int(row[k]))
    ws.cell(22, 1, "Ano")
    for a in range(1, ANOS + 1):
        ws.cell(22, 1 + a, a)
    ws.cell(23, 1, "Receita bruta do ano (R$)")
    ws.cell(24, 1, "Alíquota efetiva, anexo I (A&B)")
    ws.cell(25, 1, "Alíquota efetiva, anexo III (taxa de entrada e aluguel de jogos)")
    for a in range(1, ANOS + 1):
        c = get_column_letter(1 + a)
        ws[f"{c}23"] = f"=SUMIF(receitas!$C$3:$BJ$3,{c}22,receitas!$C$12:$BJ$12)"
        for r, r0 in ((24, 4), (25, 13)):
            mins, noms, pds = f"$B${r0 + 1}:$B${r0 + 6}", f"$D${r0 + 1}:$D${r0 + 6}", f"$E${r0 + 1}:$E${r0 + 6}"
            ws[f"{c}{r}"] = f"=IF({c}23<=0,0,MAX(0,({c}23*LOOKUP({c}23,{mins},{noms})/100-LOOKUP({c}23,{mins},{pds}))/{c}23))"
    for row in ws.iter_rows(min_row=1, max_row=25, max_col=6):
        for c in row:
            c.font, c.fill = FONTE, BRANCO
            if isinstance(c.value, (int, float)) and c.column > 1:
                c.alignment = Alignment(horizontal="right")
    ws["A1"].font = NEGRITO
    for r in (3, 4, 12, 13, 22):
        for c in range(1, 7):
            ws.cell(r, c).font = NEGRITO
    for r in (4, 13, 22):
        for c in range(1, 7 if r != 22 else 2 + ANOS):
            ws.cell(r, c).border = Border(top=FINA, bottom=FINA)
            ws.cell(r, c).alignment = Alignment(horizontal="center", wrap_text=True)
    for r in list(range(5, 11)) + list(range(14, 20)):
        for c in (2, 3, 5):
            ws.cell(r, c).number_format = MOEDA
        ws.cell(r, 4).number_format = DEC2
    for a in range(2, 2 + ANOS):
        ws.cell(23, a).number_format = MOEDA
        ws.cell(24, a).number_format = ws.cell(25, a).number_format = PCT
        ws.cell(25, a).border = Border(bottom=FINA)
    ws.cell(25, 1).border = Border(bottom=FINA)
    nota(ws, 27, "Fonte: LC 123/2006, anexos I e III, valores de 2026 (B4). Enquadramento a confirmar no cap. 8: A&B no anexo I (CNAE 5611-2/01); taxa de entrada e aluguel de jogos no anexo III. RBT12 aproximada pela receita do próprio ano.", 6)
    ws.column_dimensions["A"].width = 44
    for col in "BCDEF":
        ws.column_dimensions[col].width = 18

    # ---- receitas (mensal)
    ws = wb.create_sheet("receitas")
    titulo(ws, "Receitas mensais projetadas (preços de out/2026)", 2 + MESES)
    ws["A2"], ws["A3"] = "Mês", "Ano"
    linhas = {4: "Fator de rampa (% da ocupação madura)", 5: "Pessoas, fim de semana", 6: "Pessoas, dia útil",
              7: "Pessoas atendidas", 8: "Taxa de entrada, fim de semana (R$)", 9: "Taxa de entrada, dia útil (R$)",
              10: "Alimentos e bebidas (R$)", 11: "Aluguel de jogos (R$)", 12: "Receita bruta (R$)",
              13: "Fator de tendência da demanda (R18, a partir do ano 3)", 14: "Circulação no pico, fim de semana (limitada ao salão)",
              16: "Teto da circulação no pico (R01 × R02 × 60 ÷ R03, pessoas por hora)"}
    for r, t in linhas.items():
        ws.cell(r, 1, t)
    ws["B16"] = "=P_R01*P_R02*60/P_R03"
    for i, c in enumerate(COL_MES):
        ws[f"{c}2"] = i + 1
        ws[f"{c}3"] = f"=ROUNDUP({c}2/12,0)"
        ws[f"{c}4"] = f"=MIN(1,P_R11+(1-P_R11)*({c}2-1)/(P_R12-1))"
        ws[f"{c}13"] = f"=(1+P_R18)^MAX(0,{c}3-2)"
        ws[f"{c}14"] = f"=MIN($B$16,P_R04*{c}13)"
        ws[f"{c}5"] = f"={c}14*P_R15*P_R16*{c}4*P_M02"
        ws[f"{c}6"] = f"={c}14*P_R05*P_R15*P_R19*P_R17*{c}4*P_M02"
        ws[f"{c}7"] = f"={c}5+{c}6"
        ws[f"{c}8"] = f"={c}5*P_R06*P_R07"
        ws[f"{c}9"] = f"={c}6*P_R06*P_R07"
        ws[f"{c}10"] = f"={c}7*P_R06*(1-P_R07)"
        ws[f"{c}11"] = f"=P_R09*P_R10*{c}4*{c}13"
        ws[f"{c}12"] = f"=SUM({c}8:{c}11)"
    estilo(ws, 2, 14, 2 + MESES)
    ws["B16"].number_format = DEC2
    for c in COL_MES:
        ws[f"{c}4"].number_format = ws[f"{c}13"].number_format = PCT
        ws[f"{c}14"].number_format = DEC2
        for r in (5, 6, 7):
            ws[f"{c}{r}"].number_format = DEC1
        for r in range(8, 13):
            ws[f"{c}{r}"].number_format = MOEDA
    ws.column_dimensions["A"].width = 40
    ws.freeze_panes = "C4"

    # ---- custos (mensal)
    ws = wb.create_sheet("custos")
    titulo(ws, "Custos e despesas mensais projetados (preços de out/2026)", 2 + MESES)
    ws["A2"], ws["A3"] = "Mês", "Ano"
    linhas = {4: "Simples Nacional (R$)", 5: "CMV de alimentos e bebidas (R$)", 6: "Taxa de cartão (R$)",
              7: "Custos variáveis (R$)", 8: "Aluguel (R$)", 9: "Condomínio e IPTU (R$)",
              10: "Pessoal com encargos (R$)", 11: "Pró-labore (R$)", 12: "Utilidades (R$)", 13: "Marketing (R$)",
              14: "Contabilidade (R$)", 15: "Sistemas (R$)", 16: "Reposição do acervo (R$)",
              17: "Refeição da equipe (R$)", 18: "Custos fixos (R$)", 19: "Custos totais (R$)"}
    for r, t in linhas.items():
        ws.cell(r, 1, t)
    for i, c in enumerate(COL_MES):
        ws[f"{c}2"] = i + 1
        ws[f"{c}3"] = f"=receitas!{c}3"
        ws[f"{c}4"] = (f"=receitas!{c}10*INDEX(simples!$B$24:$F$24,{c}3)"
                       f"+(receitas!{c}8+receitas!{c}9+receitas!{c}11)*INDEX(simples!$B$25:$F$25,{c}3)")
        ws[f"{c}5"] = f"=receitas!{c}10*P_C01"
        ws[f"{c}6"] = f"=receitas!{c}12*P_C02"
        ws[f"{c}7"] = f"=SUM({c}4:{c}6)"
        ws[f"{c}8"] = "=P_C03*P_C04"
        ws[f"{c}9"] = f"={c}8*P_C05"
        ws[f"{c}10"] = "=FOLHA_REF*(1+P_C06)*(1+P_C07)"
        ws[f"{c}11"] = "=P_C08"
        ws[f"{c}12"] = "=P_C09"
        ws[f"{c}13"] = "=P_C10"
        ws[f"{c}14"] = "=P_C11"
        ws[f"{c}15"] = "=P_C12"
        ws[f"{c}16"] = "=P_I05*P_C13/12"
        ws[f"{c}17"] = "=P_C14*P_C15"
        ws[f"{c}18"] = f"=SUM({c}8:{c}17)"
        ws[f"{c}19"] = f"={c}7+{c}18"
    estilo(ws, 2, 19, 2 + MESES, MOEDA)
    for c in COL_MES:
        ws[f"{c}2"].number_format = ws[f"{c}3"].number_format = "0"
    ws.column_dimensions["A"].width = 36
    ws.freeze_panes = "C4"

    # ---- investimento
    ws = wb.create_sheet("investimento")
    titulo(ws, "Investimento inicial e depreciação", 4)
    for j, h in enumerate(["Item", "Valor (R$)", "Vida útil (anos)", "Depreciação anual (R$)"], 1):
        ws.cell(2, j, h)
    itens = [("Reforma e instalações", "=P_I01*P_C03", 5), ("Mobiliário", "=P_I02", 10),
             ("Cozinha e bar", "=P_I03", 10), ("Caixa e informática", "=P_I04", 5),
             ("Acervo inicial de jogos", "=P_I05", 5), ("Gastos pré-operacionais", "=P_I06", 5),
             ("Caução do aluguel", "=P_I07*custos!$C$8", 0), ("Capital de giro", "=P_I08*custos!$C$18", 0)]
    for i, (n, fo, vida) in enumerate(itens):
        r = 3 + i
        ws.cell(r, 1, n); ws.cell(r, 2, fo); ws.cell(r, 3, vida)
        ws.cell(r, 4, f"=IF(C{r}>0,B{r}/C{r},0)")
    rt = 3 + len(itens)
    ws.cell(rt, 1, "Total"); ws.cell(rt, 2, f"=SUM(B3:B{rt - 1})"); ws.cell(rt, 4, f"=SUM(D3:D{rt - 1})")
    estilo(ws, 2, rt, 4, MOEDA)
    for r in range(3, rt):
        ws.cell(r, 3).number_format = "0"
    nota(ws, rt + 2, "Fonte: aba premissas (I01 a I08, C03). Reforma depreciada em 5 anos (prazo típico de locação); caução e capital de giro voltam no ano 5. Valor residual na aba fluxo_caixa (M03).", 4)
    ws.column_dimensions["A"].width = 30
    for col in "BCD":
        ws.column_dimensions[col].width = 18

    # ---- dre (anual)
    ws = wb.create_sheet("dre")
    titulo(ws, "Demonstração do resultado projetada (R$, preços de out/2026)", 1 + ANOS)
    ws["A2"] = "Conta"
    for a in range(1, ANOS + 1):
        ws.cell(2, 1 + a, f"Ano {a}")
        ws.cell(3, 1 + a, a)
    ws["A3"] = "Ano (número)"
    soma = lambda aba, lin, c: f"SUMIF({aba}!$C$3:$BJ$3,{c}$3,{aba}!$C${lin}:$BJ${lin})"
    contas = [(4, "Receita bruta", lambda c: "=" + soma("receitas", 12, c)),
              (5, "(-) Simples Nacional", lambda c: "=-" + soma("custos", 4, c)),
              (6, "Receita líquida", lambda c: f"={c}4+{c}5"),
              (7, "(-) CMV de alimentos e bebidas", lambda c: "=-" + soma("custos", 5, c)),
              (8, "(-) Taxa de cartão", lambda c: "=-" + soma("custos", 6, c)),
              (9, "Margem de contribuição", lambda c: f"={c}6+{c}7+{c}8"),
              (10, "(-) Custos fixos", lambda c: "=-" + soma("custos", 18, c)),
              (11, "(-) Participação nos lucros (PLR)", lambda c: f"=-P_C16*MAX(0,{c}9+{c}10)"),
              (12, "EBITDA", lambda c: f"={c}9+{c}10+{c}11"),
              (13, "(-) Depreciação e amortização", lambda c: "=-investimento!$D$11"),
              (14, "Lucro líquido", lambda c: f"={c}12+{c}13"),
              (15, "Margem líquida", lambda c: f"=IF({c}4=0,0,{c}14/{c}4)")]
    for r, n, fo in contas:
        ws.cell(r, 1, n)
        for a in range(1, ANOS + 1):
            c = get_column_letter(1 + a)
            ws[f"{c}{r}"] = fo(c)
    estilo(ws, 2, 15, 1 + ANOS, MOEDA)
    for a in range(2, 2 + ANOS):
        ws.cell(15, a).number_format = PCT
        ws.cell(3, a).number_format = "0"
    nota(ws, 17, "Fonte: abas receitas, custos e investimento. PLR: C16 sobre o EBITDA positivo do ano (Lei n. 10.101/2000). No Simples Nacional, IRPJ e CSLL estão no DAS; não há imposto sobre o lucro à parte.", 1 + ANOS)
    ws.column_dimensions["A"].width = 34
    for a in range(2, 2 + ANOS):
        ws.column_dimensions[get_column_letter(a)].width = 16

    # ---- fluxo de caixa (anual)
    ws = wb.create_sheet("fluxo_caixa")
    titulo(ws, "Fluxo de caixa projetado (R$, preços de out/2026)", 2 + ANOS)
    ws["A2"] = "Linha"
    for t in range(ANOS + 1):
        ws.cell(2, 2 + t, f"Ano {t}")
        ws.cell(3, 2 + t, t)
    ws["A3"] = "Ano (número)"
    rot = {4: "Investimento", 5: "EBITDA", 6: "Retorno da caução e do capital de giro", 7: "Fluxo líquido",
           8: "Fator de desconto", 9: "Fluxo descontado", 10: "Fluxo descontado acumulado",
           11: "Payback descontado (auxiliar)", 12: "Valor residual (perpetuidade sem crescimento, piso zero)"}
    for r, n in rot.items():
        ws.cell(r, 1, n)
    for t in range(ANOS + 1):
        c = get_column_letter(2 + t)
        ws[f"{c}4"] = "=-investimento!$B$11" if t == 0 else 0
        ws[f"{c}5"] = 0 if t == 0 else f"=dre!{get_column_letter(1 + t)}12"
        ws[f"{c}6"] = "=investimento!$B$9+investimento!$B$10" if t == ANOS else 0
        ws[f"{c}12"] = (f"=P_M03*MAX(0,(dre!{get_column_letter(1 + t)}12-investimento!$D$11)/P_M01)"
                        if t == ANOS else 0)
        ws[f"{c}7"] = f"=SUM({c}4:{c}6)+{c}12"
        ws[f"{c}8"] = f"=1/(1+P_M01)^{c}3"
        ws[f"{c}9"] = f"={c}7*{c}8"
        ws[f"{c}10"] = f"={c}9" if t == 0 else f"={get_column_letter(1 + t)}10+{c}9"
        if t:
            p = get_column_letter(1 + t)
            ws[f"{c}11"] = f'=IF(AND({p}10<0,{c}10>=0),{p}3+(-{p}10)/{c}9,"")'
    estilo(ws, 2, 12, 2 + ANOS, MOEDA)
    for t in range(ANOS + 1):
        c = get_column_letter(2 + t)
        ws[f"{c}3"].number_format = "0"
        ws[f"{c}8"].number_format = "0.0000"
        ws[f"{c}11"].number_format = DEC2
    ws.column_dimensions["A"].width = 38
    for t in range(ANOS + 1):
        ws.column_dimensions[get_column_letter(2 + t)].width = 16

    # ---- indicadores
    ws = wb.create_sheet("indicadores")
    titulo(ws, "Indicadores de viabilidade do cenário ativo", 3)
    for j, h in enumerate(["Indicador", "Valor", "Unidade"], 1):
        ws.cell(2, j, h)
    ind = [("Cenário ativo", '=CHOOSE(P_CEN,"pessimista","provável","otimista")', ""),
           ("Investimento inicial", "=investimento!B11", "R$"),
           ("VPL a TMA real", "=SUM(fluxo_caixa!B9:G9)", "R$"),
           ("TIR real", '=IFERROR(IRR(fluxo_caixa!B7:G7),"não há")', "% ao ano"),
           ("Payback descontado", '=IF(COUNT(fluxo_caixa!C11:G11)=0,"mais de 5 anos",MIN(fluxo_caixa!C11:G11))', "anos"),
           ("Receita bruta mensal madura (mês 60)", "=receitas!BJ12", "R$"),
           ("Custos fixos mensais", "=custos!BJ18", "R$"),
           ("Margem de contribuição (ano 5)", "=dre!F9/dre!F4", "% da receita bruta"),
           ("Receita bruta mensal de equilíbrio", "=B9/B10", "R$"),
           ("Receita madura ÷ receita de equilíbrio", "=B8/B11", "vezes"),
           ("Circulação de equilíbrio no pico de fim de semana (dia útil na mesma proporção)", "=P_R04*(B11-receitas!BJ11)/(B8-receitas!BJ11)", "pessoas por hora"),
           ("Pessoas por dia de equilíbrio, fim de semana", "=B13*P_R15", "pessoas")]
    for i, (n, fo, u) in enumerate(ind):
        ws.cell(3 + i, 1, n); ws.cell(3 + i, 2, fo); ws.cell(3 + i, 3, u)
    rt = 2 + len(ind)
    wb.defined_names["P_CEN"] = DefinedName("P_CEN", attr_text="premissas!$D$2")
    estilo(ws, 2, rt, 3, MOEDA)
    ws["B6"].number_format = PCT
    ws["B7"].number_format = DEC2
    ws["B11"].number_format = MOEDA
    ws["B10"].number_format = PCT
    ws["B13"].number_format = ws["B14"].number_format = DEC2
    ws["B12"].number_format = DEC2
    ws["B3"].alignment = Alignment(horizontal="right")
    nota(ws, rt + 2, "Fonte: abas fluxo_caixa, dre, receitas e custos. Circulação de equilíbrio por aproximação linear: a receita sem o aluguel de jogos cresce na proporção da circulação.", 3)
    ws.column_dimensions["A"].width = 58
    ws.column_dimensions["B"].width = 18
    ws.column_dimensions["C"].width = 20

    # ---- sensibilidade (valores do Python)
    ws = wb.create_sheet("sensibilidade")
    titulo(ws, "Cenários, tornado e pontos de ruptura (calculados pelo script com as mesmas fórmulas)", 7)
    for j, h in enumerate(["Cenário", "Investimento (R$)", "Receita mensal madura (R$)", "EBITDA do ano 5 (R$)", "VPL (R$)", "TIR real", "Payback descontado (anos)"], 1):
        ws.cell(2, j, h)
    for i, cen in enumerate(CENARIOS):
        res = resultados[cen]
        r = 3 + i
        vals = [("pessimista", "provável", "otimista")[i], res["investimento"], res["receita_madura"], res["ebitda5"],
                res["vpl"], res["tir"] if res["tir"] == res["tir"] else "não há",
                res["payback"] if res["payback"] == res["payback"] else "mais de 5"]
        for j, x in enumerate(vals, 1):
            ws.cell(r, j, x)
    estilo(ws, 2, 5, 7, MOEDA)
    for r in range(3, 6):
        ws.cell(r, 6).number_format = PCT
        ws.cell(r, 7).number_format = DEC2
    r0 = 8
    ws.cell(r0 - 1, 1, "Tornado: VPL com a premissa no extremo e as demais no provável")
    for j, h in enumerate(["ID", "Premissa", "VPL no pessimista (R$)", "VPL no otimista (R$)", "Amplitude (R$)", "Ordem"], 1):
        ws.cell(r0, j, h)
    for i, t in enumerate(tornado):
        r = r0 + 1 + i
        for j, x in enumerate((t["id"], t["nome"], t["vpl_pess"], t["vpl_otim"], t["amplitude"], i + 1), 1):
            ws.cell(r, j, x)
    ultt = r0 + len(tornado)
    r1 = ultt + 3
    ws.cell(r1 - 1, 1, "Ponto de ruptura das premissas críticas (VPL = 0, demais no provável)")
    for j, h in enumerate(["ID", "Premissa", "Pessimista", "Provável", "Otimista", "Valor de ruptura", "Unidade"], 1):
        ws.cell(r1, j, h)
    for i, rp in enumerate(rupt):
        r = r1 + 1 + i
        for j, x in enumerate((rp["id"], rp["nome"], rp["pess"], rp["prov"], rp["otim"],
                               rp["ruptura"] if rp["ruptura"] == rp["ruptura"] else "fora do intervalo testado", rp["unidade"]), 1):
            ws.cell(r, j, x)
    ultr = r1 + len(rupt)
    # estilo dos três blocos
    for row in ws.iter_rows(min_row=1, max_row=ultr + 3, max_col=7):
        for c in row:
            c.font, c.fill = FONTE, BRANCO
    for rc, ru in ((2, 5), (r0, ultt), (r1, ultr)):
        for c in range(1, 8):
            ws.cell(rc, c).font = NEGRITO
            ws.cell(rc, c).alignment = Alignment(horizontal="center", wrap_text=True, vertical="center")
            ws.cell(rc, c).border = Border(top=FINA, bottom=FINA)
            ws.cell(ru, c).border = Border(bottom=FINA)
        for r in range(rc + 1, ru + 1):
            for c in range(1, 8):
                v = ws.cell(r, c).value
                ws.cell(r, c).alignment = Alignment(horizontal="left" if isinstance(v, str) else "right", wrap_text=True)
    ws["A1"].font = NEGRITO
    ws["A1"].alignment = Alignment(horizontal="center")
    for r in (r0 - 1, r1 - 1):
        ws.cell(r, 1).font = NEGRITO
    for r in range(r0 + 1, ultt + 1):
        for c in (3, 4, 5):
            ws.cell(r, c).number_format = MOEDA
    for i, rp in enumerate(rupt):
        r = r1 + 1 + i
        fmt = PCT if rp["unidade"].startswith("%") else (MOEDA if rp["unidade"].startswith("R$") else DEC2)
        for c in (3, 4, 5, 6):
            ws.cell(r, c).number_format = fmt
    r2 = ultr + 3
    ws.cell(r2 - 1, 1, "VPL com e sem valor residual (M03)").font = NEGRITO
    for j, h in enumerate(["Cenário", "Valor residual no ano 5 (R$)", "VPL com (R$)", "VPL sem (R$)", "Diferença (R$)"], 1):
        ws.cell(r2, j, h).font = NEGRITO
    for i, cen in enumerate(CENARIOS):
        com, sem = resultados[cen], sem_residual[cen]
        for j, x in enumerate((("pessimista", "provável", "otimista")[i], com["residual"], com["vpl"], sem["vpl"], com["vpl"] - sem["vpl"]), 1):
            ws.cell(r2 + 1 + i, j, x)
            if j > 1:
                ws.cell(r2 + 1 + i, j).number_format = MOEDA
    ultr = r2 + len(CENARIOS)
    nota(ws, ultr + 2, "Fonte: elaboração própria. Valores gravados pelo script _src/extras/gerar_modelo_financeiro.py, que recalcula o modelo em Python e confere o VPL com esta planilha nos três cenários; mudar a aba premissas não atualiza esta aba (rodar o script de novo).", 7)
    for col, w in zip("ABCDEFG", (12, 44, 18, 18, 18, 18, 18)):
        ws.column_dimensions[col].width = w

    # ---- monte carlo (valores do Python)
    ws = wb.create_sheet("monte_carlo")
    titulo(ws, f"Simulação de Monte Carlo: {N_SIMULACOES:,} cenários".replace(",", "."), 2)
    for j, h in enumerate(["Medida", "Valor"], 1):
        ws.cell(2, j, h)
    medidas = [("Probabilidade de VPL > 0", mc["prob_positivo"], PCT), ("VPL médio (R$)", mc["media"], MOEDA),
               ("VPL, percentil 5 (R$)", mc["p05"], MOEDA), ("VPL, percentil 25 (R$)", mc["p25"], MOEDA),
               ("VPL, mediana (R$)", mc["mediana"], MOEDA), ("VPL, percentil 75 (R$)", mc["p75"], MOEDA),
               ("VPL, percentil 95 (R$)", mc["p95"], MOEDA),
               ("Probabilidade de payback descontado em até 5 anos", mc["payback_5anos"], PCT),
               ("Payback descontado mediano, entre os que se pagam (anos)", mc["payback_mediana"], DEC2),
               ("VPL, percentil 10 (R$)", mc["p10"], MOEDA), ("VPL, percentil 90 (R$)", mc["p90"], MOEDA),
               ("Cenários com a etapa de mesas", mc["expansao"], PCT), ("Cenários com o gatilho G5", mc["g5"], PCT),
               ("Cenários encerrados pelo gatilho G6", mc["fechamento"], PCT),
               ("Erro padrão da probabilidade de VPL > 0", mc["erro_prob"], PCT)]
    for i, (n, x, fmt) in enumerate(medidas):
        ws.cell(3 + i, 1, n)
        ws.cell(3 + i, 2, x if x == x else "não há")
        ws.cell(3 + i, 2).number_format = fmt
    rt = 2 + len(medidas)
    estilo(ws, 2, rt, 2)
    for i, (_, _, fmt) in enumerate(medidas):
        ws.cell(3 + i, 2).number_format = fmt
    nota(ws, rt + 2, "Fonte: elaboração própria. Distribuição PERT contínua entre o pessimista e o otimista da aba premissas, com moda no "
         "provável, salvo: pessoas por mesa de 2 a 6; TMA fixa "
         "no provável. Demanda acima do salão abre mais 2 mesas a partir do ano 2; EBITDA anual negativo a partir do ano 2 aciona o G5 "
         "(corte de um cozinheiro) e, se persistir, o G6 (encerramento com revenda dos ativos, I09). "
         f"Premissas independentes entre si; semente {SEMENTE}. Valores gravados pelo script.", 2)
    ws.column_dimensions["A"].width = 58
    ws.column_dimensions["B"].width = 18

    # ---- checagens de coerência (§5) e triangulação (§4.1)
    ws = wb.create_sheet("checagens")
    titulo(ws, "Triangulação da receita e checagens de coerência (cenário ativo, mês 60)", 4)
    for j, h in enumerate(["Checagem", "Modelo", "Referência", "Fonte da referência"], 1):
        ws.cell(2, j, h)
    notas = f["notas"].set_index("unidade")
    ch = [
        ("Pessoas atendidas por dia", "=receitas!BJ7/(P_M02*7)", "=P_R01*P_R02*(P_R13+P_R14)*60/P_R03/7",
         "Capacidade: todas as mesas ocupadas todas as horas, com a permanência média"),
        ("Uso da capacidade", "=B3/C3", "", "Tem de ficar abaixo de 100%"),
        ("Mesas ocupadas no pico ÷ mesas do salão", "=P_R04*P_R03/60/P_R02/P_R01", "", "Tem de ficar abaixo de 100%"),
        ("Horas de pico equivalentes por dia de fim de semana", "=P_R15", "=P_R13/P_R16",
         "Horas abertas por dia de fim de semana: as horas de pico equivalentes têm de caber no horário"),
        ("Pessoas atendidas por dia × NFC-e da Bela Vista", "=B3", float(notas.loc["BV", "notas_emitidas"] / notas.loc["BV", "dias"]),
         "NFC-e emitidas por dia, São Jogue Bela Vista, 10/10 a 16/10/2026 (B3); uma nota por pessoa, emitida só a pedido: piso de clientes"),
        ("Pessoas atendidas por dia × NFC-e da Paralela", "=B3", float(notas.loc["PA", "notas_emitidas"] / notas.loc["PA", "dias"]),
         "NFC-e por dia, São Jogue Paralela, 17/10 a 30/10/2026 (B3), com o fim de semana da eleição; piso de clientes"),
        ("Receita por pessoa (R$)", "=receitas!BJ12/receitas!BJ7", float(f["gasto_casas_cesta"]["cesta_consumo"].mean()),
         "Cesta de consumo média (taxa de entrada + bebida + hambúrguer) das casas da R06 (B1)"),
        ("Taxa de entrada (R$)", "=P_R06*P_R07", float(f["taxa_b1_mediana"]),
         f"Mediana do couvert ou taxa de jogo nos cardápios de {f['taxa_b1_n']} concorrentes (B1)"),
        ("Pessoas atendidas por dia por funcionário", "=B3/QUADRO_N", "",
         "Equipe do desenho enxuto (aba pessoal)"),
        ("Visitas por ano ÷ população de Salvador", "=receitas!BJ7*12/C12", float(f["pop_salvador"]),
         "População estimada de Salvador em 2026 (IBGE, B4); visitas, não pessoas distintas"),
        ("Meses até a maturidade", "=P_R12", "", "Entre 6 e 12 meses (_instrucoes, §5)"),
    ]
    for i, (n, mo, ref, fonte) in enumerate(ch):
        r = 3 + i
        ws.cell(r, 1, n); ws.cell(r, 2, mo); ws.cell(r, 3, ref if ref != "" else None); ws.cell(r, 4, fonte)
    rt = 2 + len(ch)
    estilo(ws, 2, rt, 4, DEC2)
    ws["B4"].number_format = ws["B5"].number_format = ws["B12"].number_format = "0.000%"
    for r in (9, 10):
        ws[f"B{r}"].number_format = ws[f"C{r}"].number_format = MOEDA
    ws["C12"].number_format = INT
    nota(ws, rt + 2, "Fonte: abas do modelo e Blocos B1, B3 e B4. A comparação com as notas é de ordem de grandeza: a NFC-e só é emitida quando o cliente pede.", 4)
    for col, w in zip("ABCD", (48, 18, 18, 70)):
        ws.column_dimensions[col].width = w
    return wb


# --------------------------------------------------------------- conferência
def recalcula(xlsx: Path, cenario: int) -> float:
    """Abre uma cópia no LibreOffice com o cenário dado, recalcula e devolve o VPL."""
    with tempfile.TemporaryDirectory() as tmp:
        tmp = Path(tmp)
        wb = openpyxl.load_workbook(xlsx)
        wb["premissas"]["D2"] = cenario
        src = tmp / "modelo.xlsx"
        wb.save(src)
        out = tmp / "out"
        subprocess.run([SOFFICE, "--headless", "--calc", "--convert-to", "xlsx", "--outdir", str(out), str(src)],
                       check=True, capture_output=True, timeout=180)
        v = openpyxl.load_workbook(out / "modelo.xlsx", data_only=True)
        erros = [f"{ws.title}!{c.coordinate}" for ws in v for row in ws.iter_rows() for c in row
                 if isinstance(c.value, str) and c.value.startswith(("#", "Err:"))]
        if erros:
            raise SystemExit(f"Erros de fórmula no LibreOffice: {erros[:10]}")
        return v["indicadores"]["B5"].value


def figura_tornado(tornado, base_vpl):
    top = tornado[:10][::-1]
    fig, ax = plt.subplots(figsize=(6.3, 4.2), dpi=300)
    y = range(len(top))
    mil = lambda x: x / 1000
    for i, t in enumerate(top):
        ax.barh(i, mil(t["vpl_pess"] - base_vpl), left=mil(base_vpl), height=0.6, color="#54278f", label="Premissa no pessimista" if i == 0 else None)
        ax.barh(i, mil(t["vpl_otim"] - base_vpl), left=mil(base_vpl), height=0.6, color="#bcbddc", label="Premissa no otimista" if i == 0 else None)
    ax.axvline(mil(base_vpl), color="black", linewidth=0.8)
    ax.axvline(0, color="black", linewidth=0.8, linestyle=":")
    ax.set_yticks(list(y))
    ax.set_yticklabels([f"{t['id']} {t['nome']}" for t in top], fontsize=7, fontname="Arial")
    ax.set_xlabel("VPL (R$ mil)", fontsize=8, fontname="Arial")
    ax.tick_params(axis="x", labelsize=7)
    for s in ("top", "right"):
        ax.spines[s].set_visible(False)
    ax.legend(prop={"family": "Arial", "size": 7}, frameon=False, loc="lower right")
    for t in ax.get_xticklabels():
        t.set_fontname("Arial")
    ax.xaxis.set_major_formatter(matplotlib.ticker.FuncFormatter(lambda x, _: f"{x:,.0f}".replace(",", ".")))
    fig.tight_layout()
    FIGURA.parent.mkdir(parents=True, exist_ok=True)
    fig.savefig(FIGURA, facecolor="white")
    plt.close(fig)


def figura_monte_carlo(mc):
    fig, ax = plt.subplots(figsize=(6.3, 3.6), dpi=300)
    mil = [x / 1000 for x in mc["vpls"]]
    ax.hist(mil, bins=60, color="#7f7f7f", edgecolor="white", linewidth=0.3)
    ax.axvline(0, color="black", linewidth=0.8, linestyle=":")
    ax.axvline(mc["mediana"] / 1000, color="black", linewidth=0.8)
    ax.set_xlabel("VPL (R$ mil)", fontsize=8, fontname="Arial")
    ax.set_ylabel("Cenários simulados", fontsize=8, fontname="Arial")
    ax.tick_params(labelsize=7)
    for s in ("top", "right"):
        ax.spines[s].set_visible(False)
    for t in ax.get_xticklabels() + ax.get_yticklabels():
        t.set_fontname("Arial")
    ax.xaxis.set_major_formatter(matplotlib.ticker.FuncFormatter(lambda x, _: f"{x:,.0f}".replace(",", ".")))
    fig.tight_layout()
    fig.savefig(FIGURA_MC, facecolor="white")
    plt.close(fig)


def main():
    f = ler_fontes()
    prem = premissas(f)
    quadro = quadro_pessoal(f)
    det = pessoal_detalhe(quadro)
    folha = sum(q * det[cargo]["remuneracao"] for cargo, _, q, _, _ in quadro)
    resultados = {c: calcula(f, valores(prem, c), folha) for c in CENARIOS}
    base = resultados["provavel"]
    tornado = []
    for p in prem:
        if p["pess"] == p["otim"]:
            continue
        vp = calcula(f, dict(valores(prem, "provavel"), **{p["id"]: p["pess"]}), folha)["vpl"]
        vo = calcula(f, dict(valores(prem, "provavel"), **{p["id"]: p["otim"]}), folha)["vpl"]
        if abs(vo - vp) < 1:  # premissa só de checagem (ex.: permanência)
            continue
        tornado.append(dict(id=p["id"], nome=p["nome"], vpl_pess=vp, vpl_otim=vo, amplitude=abs(vo - vp)))
    tornado.sort(key=lambda t: -t["amplitude"])
    por_id = {p["id"]: p for p in prem}
    rupt = [dict(por_id[t["id"]], ruptura=ruptura(f, prem, folha, t["id"])) for t in tornado[:5]]
    mc = monte_carlo(f, prem, folha, quadro)

    sem_residual = {c: calcula(f, dict(valores(prem, c), M03=0), folha) for c in CENARIOS}
    wb = planilha(f, prem, quadro, resultados, tornado, rupt, mc, sem_residual)
    SAIDA.parent.mkdir(parents=True, exist_ok=True)
    wb.save(SAIDA)
    for i, cen in enumerate(CENARIOS, 1):
        vpl_lo = recalcula(SAIDA, i)
        dif = abs(vpl_lo - resultados[cen]["vpl"])
        print(f"Conferência {cen}: VPL Python {resultados[cen]['vpl']:,.2f} × LibreOffice {vpl_lo:,.2f} (diferença {dif:.4f})")
        if dif >= 1:
            raise SystemExit("VPL da planilha diverge do Python")
    figura_tornado(tornado, base["vpl"])
    figura_monte_carlo(mc)

    # números citados no capítulo
    print(f"\nTaxa de entrada média: R$ {f['couvert_media']:.2f} (n={f['couvert_n']}, mediana {f['couvert_mediana']:.2f});"
          f" consumo (bebida + hambúrguer) médio: R$ {f['cesta_consumo_media']:.2f} (n={f['cesta_consumo_n']}, mediana {f['cesta_consumo_mediana']:.2f})")
    print("Mesas ocupadas por visita:", [round(x, 2) for x in f["mesas_ocupadas"]])
    print("Circulação no pico por visita:", [round(x, 2) for x in f["circulacao_visitas"]],
          f"| pelas NFC-e (BV, PA): {[round(x, 2) for x in f['circulacao_nfce']]} com {f['horas_pico_sj_fds']:.2f} h de pico"
          f" | teto do salão {f['teto_circ']:.2f} pessoas/h")
    print(f"Gasto por pessoa (B2): {[round(x, 2) for x in f['gasto']]}; parcela da taxa {f['parcela_taxa']:.4f};"
          f" horas de pico equivalentes: {f['horas_pico']}")
    print(f"Folha de referência (remuneração com adicionais): R$ {folha:,.2f} ({sum(q for _, _, q, _, _ in quadro)} pessoas;"
          f" salários R$ {sum(q * s for _, _, q, s, _ in quadro):,.2f})")
    for cargo, *_ in quadro:
        for i, p in enumerate(det[cargo]["pessoas"], 1):
            print(f"  {cargo} {i}: " + " | ".join(f"{k} {x:,.2f}" for k, x in p.items()))
    print(f"Juro real: {f['juro_real']:.2f}%; PAS mercadorias: {f['pas_mercadorias_pct']:.1f}%; taxa B1 mediana {f['taxa_b1_mediana']} (n={f['taxa_b1_n']})")
    for cen in CENARIOS:
        r = resultados[cen]
        print(f"\n[{cen}] invest {r['investimento']:,.0f} | receita madura {r['receita_madura']:,.0f}/mês | pessoas {r['pessoas_madura']:,.0f}/mês"
              f" | fixos {r['fixos']:,.0f} | MC {r['mc_pct']:.1%} | equilíbrio {r['receita_equilibrio']:,.0f} | EBITDA5 {r['ebitda5']:,.0f}"
              f" | VPL {r['vpl']:,.0f} (sem valor residual {sem_residual[cen]['vpl']:,.0f}; residual {r['residual']:,.0f})"
              f" | TIR {r['tir']:.1%} | payback {r['payback']:.2f}")
        print("   inv:", {k: round(x) for k, x in r["inv"].items()})
        print("   anos:", r["ano"].round(0).to_dict("index"))
    print("\nTornado:")
    for t in tornado:
        print(f"  {t['id']} {t['nome']}: pess {t['vpl_pess']:,.0f} | otim {t['vpl_otim']:,.0f} | amplitude {t['amplitude']:,.0f}")
    print("\nRuptura:")
    for rp in rupt:
        print(f"  {rp['id']} {rp['nome']}: provável {rp['prov']} → ruptura {rp['ruptura']}")
    print(f"\nMonte Carlo ({N_SIMULACOES}): etapa {mc['expansao']:.1%} | G5 {mc['g5']:.1%} | G6 {mc['fechamento']:.1%} | P10 {mc['p10']:,.0f} | P90 {mc['p90']:,.0f} | erro {mc['erro_prob']:.2%}")
    print(f"Monte Carlo: P(VPL>0) {mc['prob_positivo']:.1%} | média {mc['media']:,.0f} | P5 {mc['p05']:,.0f}"
          f" | P25 {mc['p25']:,.0f} | mediana {mc['mediana']:,.0f} | P75 {mc['p75']:,.0f} | P95 {mc['p95']:,.0f}"
          f" | payback em 5 anos {mc['payback_5anos']:.1%} | payback mediano {mc['payback_mediana']:.2f}")
    print(f"\nOK: {SAIDA.relative_to(ROOT)}, {FIGURA.relative_to(ROOT)} e {FIGURA_MC.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
