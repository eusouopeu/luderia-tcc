"""
Planilha Histogramas.xlsx: tabelas e histogramas nativos do Excel sobre os
concorrentes do B1 (pedidos do autor, 12/11/2026).

Padrão: tabelas no formato ABNT do TCC (`planilha_estilo.py`: Arial 10, fundo
branco, borda preta só no cabeçalho e no fim, texto à esquerda e números à
direita, fonte abaixo) e gráficos só com as paletas purple e slate do Tailwind.
Cada tabela se chama "Tabela {aba}.{n.º na aba} – título"; a aba Sumário (aba 0)
lista e liga todas.

Abas:
  0. Sumário.
  1. Taxas de entrada - só as casas que cobram em algum dia (as que nunca
     cobram têm outro modelo de preço e ficam fora das abas 1 e 2); faixas de R$ 5 da taxa ponderada (média dos dias em
     que a casa abre), da mais barata e da mais cara de cada casa; barras =
     n.º de casas. A base (Tabela 1.4) traz a taxa de cada dia da semana nos
     dias em que a casa abre (TAXAS de B2a_gasto_por_pessoa.py e horários de
     B1_resumo_estabelecimentos.xlsx); ponderada, mínima e máxima são fórmulas.
  2. Taxas por dia - média, mediana, mínimo e máximo da taxa em cada dia,
     entre as casas abertas, e quantas cobram o próprio máximo, o próprio
     mínimo, um valor único em todos os dias ou um valor intermediário (as
     quatro somam as casas abertas no dia). Fórmulas sobre a Tabela 1.4.
  3. Funcionamento - fluxo por dia × hora (B1a_fluxo_dia_hora.py), média e
     mediana entre as casas abertas; linha = n.º das 54 casas da população
     abertas na hora (valores agregados pelo script de origem).
  4. Cestas - faixas de R$ 10 da cesta sem a taxa (bebida + hambúrguer) e com
     a taxa ponderada (fórmula sobre a Tabela 1.4).
  5. Acervos - faixas de 200 jogos do n.º de jogos por acervo.
  6. Jogos frequentes - jogos em mais acervos (corte que fecha em pelo menos
     20, empates incluídos): aluguel médio e mediano (R$; mistura locações de
     1, 3 e 7 dias) e linha com o n.º de casas com o jogo no acervo.

Conferências: cada tabela de faixas fecha com o total da base (fórmula de
diferença na aba e assert aqui); a taxa ponderada da fórmula é conferida contra
B1_cesta_casas_com_taxa.csv.

Saída: dados/B1_estabelecimentos/_dados-agregados/5_graficos/Histogramas.xlsx

Uso:
    python3 _src/outros/G1_planilhas/gerar_histogramas_xlsx.py
"""
import sys
from pathlib import Path
_AQUI = Path(__file__).resolve()
sys.path[:0] = [*map(str, _AQUI.parents[1].glob("G[0-9]_*"))]
from log_execucao import registrar_execucao  # noqa: E402
if __name__ == "__main__":
    registrar_execucao(__file__)

import importlib.util  # noqa: E402
import re  # noqa: E402

import pandas as pd  # noqa: E402
from openpyxl import Workbook  # noqa: E402
from openpyxl.chart import BarChart, LineChart, Reference  # noqa: E402
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side  # noqa: E402
from openpyxl.utils import get_column_letter as L  # noqa: E402

ROOT = _AQUI.parents[3]
VALORES = ROOT / "dados" / "B1_estabelecimentos" / "_dados-agregados" / "5_graficos" / "graficos" / "valores"
SAIDA = ROOT / "dados" / "B1_estabelecimentos" / "_dados-agregados" / "5_graficos" / "Histogramas.xlsx"
CESTA = ROOT / "dados" / "B2_avaliacoes" / "_dados-agregados" / "gasto_por_pessoa" / "B1_cesta_casas_com_taxa.csv"
SCRIPT_TAXAS = ROOT / "_src" / "pyScripts" / "B2_Avaliacoes" / "3_analise" / \
    "B2a_gasto_por_pessoa.py"

# Tailwind CSS v3 (mesmas cores de planilha_estilo.py)
ROXO_800, ROXO_500, ROXO_300 = "6B21A8", "A855F7", "D8B4FE"
SLATE_300, SLATE_600, SLATE_800 = "CBD5E1", "475569", "1E293B"

ARIAL = Font(name="Arial", size=10, color="000000")
ARIAL_N = Font(name="Arial", size=10, color="000000", bold=True)
LINK = Font(name="Arial", size=10, color="6B21A8", underline="single")
BRANCO = PatternFill("solid", start_color="FFFFFF", end_color="FFFFFF")
FINA = Side(style="thin", color="000000")
SEM = Side(style="thin", color="FFFFFF")
FMT = {"int": "#,##0", "dec": "#,##0.00", "rs": "#,##0.00", "pct": "0.00%", "txt": "@"}

DIAS = ["segunda", "terca", "quarta", "quinta", "sexta", "sabado", "domingo"]
NOME_DIA = dict(zip(DIAS, ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"]))
ABREV = dict(zip(DIAS, ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"]))

SUMARIO: list[tuple[str, str, str, int]] = []  # (aba, título, fonte, linha do título)


# ---------------------------------------------------------------- tabelas ABNT
def tabela(ws, aba_n, k, linha, titulo, cabecalho, linhas, tipos, fonte, larguras=None, notas=()):
    """Tabela ABNT a partir de (linha, coluna A): título mesclado, cabeçalho, dados, fonte e notas.
    Células que começam com "=" viram fórmula. Devolve (1.ª linha de dados, última linha, próxima linha livre)."""
    nome = f"Tabela {aba_n}.{k} – {titulo}"
    nc = len(cabecalho)
    ws.cell(linha, 1, nome)
    ws.merge_cells(start_row=linha, start_column=1, end_row=linha, end_column=nc)
    for j, c in enumerate(cabecalho, 1):
        ws.cell(linha + 1, j, c)
    for i, lin in enumerate(linhas, linha + 2):
        for j, v in enumerate(lin, 1):
            ws.cell(i, j, None if (isinstance(v, float) and pd.isna(v)) else v)
    ult = linha + 1 + len(linhas)
    for r in range(linha, ult + 1):
        for j in range(1, nc + 1):
            c = ws.cell(r, j)
            c.fill = BRANCO
            if r == linha:
                c.font, c.alignment = ARIAL_N, Alignment(horizontal="center", vertical="center", wrap_text=True)
            elif r == linha + 1:
                c.font = ARIAL_N
                c.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
                c.border = Border(top=FINA, bottom=FINA, left=SEM, right=SEM)
            else:
                t = tipos[j - 1]
                c.font = ARIAL_N if str(ws.cell(r, 1).value).startswith("Total") else ARIAL
                c.alignment = Alignment(horizontal="left" if t == "txt" else "right", vertical="center")
                if t != "txt":
                    c.number_format = FMT[t]
                c.border = Border(top=SEM, left=SEM, right=SEM, bottom=FINA if r == ult else SEM)
    ws.row_dimensions[linha].height = 28
    ws.row_dimensions[linha + 1].height = 42
    rod = ult + 1
    for t in (f"Fonte: {fonte}", *notas):
        ws.cell(rod, 1, t).font = ARIAL
        rod += 1
    if larguras:
        for j, w in enumerate(larguras, 1):
            col = ws.column_dimensions[L(j)]
            col.width = max(col.width or 0, w)
    SUMARIO.append((ws.title, nome, fonte, linha))
    return linha + 2, ult, rod + 1


def linha_texto(ws, linha, rotulo, formula, fmt):
    """Linha avulsa abaixo de uma tabela (média, mediana, conferência), sem bordas."""
    ws.cell(linha, 1, rotulo).font = ARIAL
    c = ws.cell(linha, 2, formula)
    c.font, c.number_format, c.alignment = ARIAL, fmt, Alignment(horizontal="right")


def nova_aba(wb, nome):
    ws = wb.create_sheet(nome)
    ws.sheet_view.showGridLines = False
    return ws


# ---------------------------------------------------------------- gráficos
def _eixos(*gs):
    for g in gs:
        g.x_axis.delete = False
        g.y_axis.delete = False
        g.y_axis.majorGridlines = None


def _cor_serie(s, cor, linha=False):
    if linha:
        s.graphicalProperties.line.solidFill = cor
        s.graphicalProperties.line.width = 25000
        s.smooth = False
    else:
        s.graphicalProperties.solidFill = cor
        s.graphicalProperties.line.solidFill = cor


def grafico_barras(ws, titulo, cats, series, cores, eixo_y, eixo_x, ancora, fmt="0", empilhar=False,
                   largura=16, altura=8.5):
    """cats: (col, l0, l1); series: lista de (col, linha do cabeçalho, l1)."""
    g = BarChart()
    g.type, g.gapWidth = "col", 30 if len(series) > 1 else 15
    if empilhar:
        g.grouping, g.overlap = "stacked", 100
    g.title, g.y_axis.title, g.x_axis.title = titulo, eixo_y, eixo_x
    for (col, l0, l1), cor in zip(series, cores):
        g.add_data(Reference(ws, min_col=col, min_row=l0, max_row=l1), titles_from_data=True)
        _cor_serie(g.series[-1], cor)
    g.set_categories(Reference(ws, min_col=cats[0], min_row=cats[1], max_row=cats[2]))
    g.y_axis.numFmt = fmt
    if len(series) == 1:
        g.legend = None
    else:
        g.legend.position = "b"
    _eixos(g)
    g.height, g.width = altura, largura
    ws.add_chart(g, ancora)


def grafico_combinado(ws, titulo, cats, barra, linha_, eixo_barra, eixo_linha, fmt_barra, ancora,
                      largura=26, altura=11):
    g = BarChart()
    g.type, g.gapWidth, g.title = "col", 20, titulo
    g.add_data(Reference(ws, min_col=barra[0], min_row=barra[1], max_row=barra[2]), titles_from_data=True)
    _cor_serie(g.series[0], ROXO_500)
    g.set_categories(Reference(ws, min_col=cats[0], min_row=cats[1], max_row=cats[2]))
    g.y_axis.title, g.y_axis.numFmt = eixo_barra, fmt_barra
    ln = LineChart()
    ln.add_data(Reference(ws, min_col=linha_[0], min_row=linha_[1], max_row=linha_[2]), titles_from_data=True)
    _cor_serie(ln.series[0], SLATE_800, linha=True)
    ln.y_axis.axId, ln.y_axis.crosses = 200, "max"
    ln.y_axis.title, ln.y_axis.numFmt = eixo_linha, "0"
    _eixos(g, ln)
    g += ln
    g.legend.position = "b"
    g.height, g.width = altura, largura
    ws.add_chart(g, ancora)


# ---------------------------------------------------------------- histograma por faixas
def faixas(ini, fim, passo):
    return [(a, a + passo) for a in range(ini, fim, passo)]


def real(v):
    return f"R$ {v:,.0f}".replace(",", ".")


def inteiro(v):
    return f"{v:,.0f}".replace(",", ".")


def tabela_faixas(ws, aba_n, k, linha, titulo, fx, rng, unidade, fmt_lim, fonte, eixo_x, cor=ROXO_800,
                  fmt_med="#,##0.00"):
    """Faixas [de, até) com CONT.SES sobre `rng`; a última inclui o limite. Gráfico à direita da tabela.
    Abaixo, média, mediana e a conferência contra a base. Devolve a próxima linha livre."""
    linhas = []
    l_dados = linha + 2
    for i, (a, b) in enumerate(fx):
        r = l_dados + i
        ultimo = i == len(fx) - 1
        op = "<=" if ultimo else "<"
        rot = f"{fmt_lim(a)} a {fmt_lim(b)}" if ultimo else f"{fmt_lim(a)} a menos de {fmt_lim(b)}"
        linhas.append([rot, a, b, f'=COUNTIFS({rng},">="&B{r},{rng},"{op}"&C{r})'])
    rt = l_dados + len(fx)
    linhas.append(["Total", None, None, f"=SUM(D{l_dados}:D{rt - 1})"])
    d0, ult, prox = tabela(ws, aba_n, k, linha, titulo, ["Faixa", f"De ({unidade})", f"Até ({unidade})",
                                                         "N.º de casas"], linhas, ["txt", "int", "int", "int"],
                           fonte, larguras=[26, 11, 11, 11])
    linha_texto(ws, prox - 1, f"Média ({unidade})", f"=AVERAGE({rng})", fmt_med)
    linha_texto(ws, prox, f"Mediana ({unidade})", f"=MEDIAN({rng})", fmt_med)
    linha_texto(ws, prox + 1, "Conferência: total − casas na base", f"=D{rt}-COUNT({rng})", "0")
    grafico_barras(ws, f"Gráfico {aba_n}.{k} – {titulo}", (1, d0, rt - 1), [(4, d0 - 1, rt - 1)], [cor],
                   "N.º de casas", eixo_x, f"F{linha}")
    return max(prox + 3, linha + 19)


# ---------------------------------------------------------------- dados
def carregar_taxas():
    spec = importlib.util.spec_from_file_location("b2_gasto", SCRIPT_TAXAS)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    es = pd.read_excel(ROOT / "dados" / "B1_estabelecimentos" / "_dados-agregados" / "B1_resumo_estabelecimentos.xlsx", sheet_name="estabelecimentos")
    es = es.set_index("place_id")
    linhas = []
    for pid, (_, fonte, regra) in mod.TAXAS.items():
        r = es.loc[pid]
        lin = {"place_id": pid, "nome": r["nome"], "metropole": r["capital_endereco"], "fonte": fonte}
        for d in DIAS:
            lin[d] = regra[d] if pd.notna(r[d]) else None  # só dias em que a casa abre
        linhas.append(lin)
    t = pd.DataFrame(linhas)
    t["ponderada"] = t[DIAS].mean(axis=1)
    # casas que não cobram em nenhum dia têm outro modelo de preço (consumo), não uma taxa mais baixa:
    # ficam fora das abas 1 e 2, como na taxa do plano ("média dos concorrentes que a cobram", 31/10/2026)
    sem = t[t[DIAS].fillna(0).max(axis=1) == 0]
    t = t.drop(sem.index)
    return t.sort_values(["ponderada", "nome"]).reset_index(drop=True), sem.nome.tolist()


# ---------------------------------------------------------------- abas
def aba_taxas(wb, tx, sem):
    ws = nova_aba(wb, "1 Taxas de entrada")
    fonte = ("cardápios, sites, imprensa e Instagram das casas do B1 e site e NFC-e da São Jogue "
             "(TAXAS em B2a_gasto_por_pessoa.py; horários em B1_resumo_estabelecimentos.xlsx).")
    n = len(tx)
    # base primeiro no layout? Não: faixas em cima, base embaixo; as faixas apontam para a base.
    l_base = 3 + 3 * 19 + 1
    b0, b1 = l_base + 2, l_base + 1 + n
    rng = {k: f"${c}${b0}:${c}${b1}" for k, c in (("pond", "J"), ("min", "K"), ("max", "L"))}
    ws.cell(1, 1, "Taxas de entrada dos concorrentes").font = ARIAL_N
    nota = (f"{n} casas que cobram taxa, com a São Jogue; só os dias em que a casa abre. Fora: casas sem "
            f"cobrança em nenhum dia ({'; '.join(sem)}), por terem outro modelo de preço. Faixas de R$ 5; a "
            "última inclui o limite superior.")
    ws.cell(2, 1, nota).font = ARIAL
    prox = 4
    for k, (chave, tit, eixo) in enumerate([("pond", "Casas por faixa de taxa de entrada ponderada pelos dias "
                                              "de funcionamento", "Taxa ponderada (R$)"),
                                             ("min", "Casas por faixa da taxa de entrada mais barata da casa",
                                              "Taxa mais barata (R$)"),
                                             ("max", "Casas por faixa da taxa de entrada mais cara da casa",
                                              "Taxa mais cara (R$)")], 1):
        prox = tabela_faixas(ws, 1, k, prox, tit, faixas(0, 50, 5), rng[chave], "R$", real, fonte, eixo,
                             cor=[ROXO_800, ROXO_300, ROXO_500][k - 1])
    assert prox <= l_base, "faixas invadem a base"
    linhas = []
    for i, r in enumerate(tx.itertuples(index=False)):
        lr = b0 + i
        dias = [getattr(r, d) for d in DIAS]
        linhas.append([r.nome, r.metropole, *dias, f"=AVERAGE(C{lr}:I{lr})", f"=MIN(C{lr}:I{lr})",
                       f"=MAX(C{lr}:I{lr})", r.fonte])
    tabela(ws, 1, 4, l_base, "Taxa de entrada por casa e dia da semana",
           ["Casa", "Metrópole", *[NOME_DIA[d] for d in DIAS], "Ponderada (R$)", "Mais barata (R$)",
            "Mais cara (R$)", "Fonte da taxa"],
           linhas, ["txt", "txt"] + ["rs"] * 10 + ["txt"], fonte,
           larguras=[36, 16] + [10] * 10 + [60],
           notas=("Nota: célula vazia = casa fechada no dia. Ponderada = média dos dias em que a casa abre.",))
    return {"base": (b0, b1), "aba": ws.title}


def aba_taxas_dia(wb, ref):
    ws = nova_aba(wb, "2 Taxas por dia")
    b0, b1 = ref["base"]
    a = f"'{ref['aba']}'!"
    fonte = f"Tabela 1.4 ({ref['aba']})."
    ws.cell(1, 1, "Taxas de entrada por dia da semana").font = ARIAL_N
    ws.cell(2, 1, "Só as casas que cobram taxa (Tabela 1.4) e estão abertas no dia; dia gratuito de casa que cobra "
                  "nos outros dias entra como R$ 0. Próprio máximo/mínimo: a taxa do dia é a mais cara/barata da "
                  "semana da casa (casas com mais de um valor); valor único: a casa cobra o mesmo em todos os "
                  "dias em que abre.").font = ARIAL
    mx, mn = f"{a}$L${b0}:$L${b1}", f"{a}$K${b0}:$K${b1}"
    linhas = []
    l0 = 6
    for i, d in enumerate(DIAS):
        c = L(3 + i)
        col = f"{a}${c}${b0}:${c}${b1}"
        r = l0 + i
        linhas.append([NOME_DIA[d], f"=COUNT({col})", f"=AVERAGE({col})", f"=MEDIAN({col})", f"=MIN({col})",
                       f"=MAX({col})",
                       f"=SUMPRODUCT(ISNUMBER({col})*({col}={mx})*({mx}>{mn}))",
                       f"=SUMPRODUCT(ISNUMBER({col})*({col}={mn})*({mx}>{mn}))",
                       f"=SUMPRODUCT(ISNUMBER({col})*({mx}={mn}))",
                       f"=B{r}-G{r}-H{r}-I{r}"])
    d0, ult, prox = tabela(ws, 2, 1, 4, "Taxa de entrada por dia da semana entre as casas abertas",
                           ["Dia", "Casas abertas com taxa", "Média (R$)", "Mediana (R$)", "Mínimo (R$)",
                            "Máximo (R$)", "Casas no próprio máximo", "Casas no próprio mínimo",
                            "Casas com valor único", "Casas em valor intermediário"],
                           linhas, ["txt", "int", "rs", "rs", "rs", "rs", "int", "int", "int", "int"], fonte,
                           larguras=[12, 12, 11, 11, 11, 11, 12, 12, 12, 13],
                           notas=("Nota: as quatro últimas colunas somam as casas abertas com taxa no dia.",))
    assert d0 == l0
    grafico_barras(ws, "Gráfico 2.1 – Taxa de entrada média, mediana, mínima e máxima por dia",
                   (1, d0, ult), [(c, d0 - 1, ult) for c in (3, 4, 5, 6)],
                   [ROXO_800, ROXO_500, SLATE_300, SLATE_600], "Taxa de entrada (R$)", "Dia da semana",
                   f"A{prox + 1}", fmt='"R$ "#,##0', largura=20, altura=9.5)
    grafico_barras(ws, "Gráfico 2.2 – Casas abertas por posição da taxa do dia na semana da casa",
                   (1, d0, ult), [(c, d0 - 1, ult) for c in (7, 8, 9, 10)],
                   [ROXO_800, ROXO_300, SLATE_600, SLATE_300], "N.º de casas", "Dia da semana",
                   f"A{prox + 22}", empilhar=True, largura=20, altura=9.5)


def aba_funcionamento(wb):
    ws = nova_aba(wb, "3 Funcionamento")
    fonte = ("índice \"Horários de pico\" do Google Maps (coleta de 10 e 11/11/2026) e horários publicados das "
             "casas (15/10/2026), recorte B1 (B1a_fluxo_dia_hora.py; valores agregados pelo script).")
    ws.cell(1, 1, "Fluxo dos concorrentes por dia e hora e casas abertas").font = ARIAL_N
    ws.cell(2, 1, "Fluxo: índice do Google (100% = hora mais cheia da semana da casa), só entre as casas abertas na "
                  "hora (46 concorrentes, sem a São Jogue). Horas de 0h a 5h: madrugada do próprio dia.").font = ARIAL
    for k, (arq, col_var, rot) in enumerate([("media", "media_pct", "Fluxo médio"),
                                             ("mediana", "mediana_pct", "Fluxo mediano")], 1):
        v = pd.read_csv(VALORES / f"B1_fluxo_dia_hora_{arq}.csv", sep=";")
        linhas = [[NOME_DIA[r.dia_semana], int(r.hora), f"{ABREV[r.dia_semana]} {int(r.hora)}h",
                   None if pd.isna(getattr(r, col_var)) else getattr(r, col_var) / 100,
                   0 if pd.isna(r.casas_abertas) else int(r.casas_abertas), int(r.casas_pop_abertas)]
                  for r in v.itertuples(index=False)]
        linha = 4 if k == 1 else 4 + len(v) + 6
        d0, ult, _ = tabela(ws, 3, k, linha, f"{rot} por dia e hora e casas abertas",
                            ["Dia", "Hora", "Dia e hora", f"{rot} (%)", "Casas abertas na amostra (de 46)",
                             "Casas abertas na população (de 54)"],
                            linhas, ["txt", "int", "txt", "pct", "int", "int"], fonte,
                            larguras=[11, 7, 11, 11, 13, 13])
        grafico_combinado(ws, f"Gráfico 3.{k} – {rot} por dia e hora e casas abertas", (3, d0, ult),
                          (4, d0 - 1, ult), (6, d0 - 1, ult), f"{rot} (% da hora mais cheia)",
                          "Casas abertas (de 54)", "0%", f"H{linha}", largura=34)


def aba_cestas(wb, cesta, ref):
    ws = nova_aba(wb, "4 Cestas")
    d = cesta.dropna(subset=["cesta_consumo"]).sort_values(["bebida_mais_hamburguer", "nome"]).reset_index(drop=True)
    n = len(d)
    fonte = ("cardápios do B1 (bebida e hambúrguer; B1_cesta_casas_com_taxa.csv) e taxa ponderada da Tabela 1.4 "
             "(R$ 0 nas casas sem cobrança, fora da Tabela 1.4).")
    ws.cell(1, 1, "Cesta de consumo por pessoa dos concorrentes, sem e com a taxa de entrada").font = ARIAL_N
    ws.cell(2, 1, f"Sem taxa: bebida (mediana do cardápio) + hambúrguer mais barato não vegetariano. Com taxa: soma "
                  f"da taxa ponderada. {n} casas com taxa, bebida e hambúrguer no cardápio; faixas de R$ 10.").font = ARIAL
    l_base = 4 + 2 * 19 + 1
    b0, b1 = l_base + 2, l_base + 1 + n
    a = f"'{ref['aba']}'!"
    t0, t1 = ref["base"]
    prox = 4
    for k, (c, tit, eixo, cor) in enumerate([("C", "Casas por faixa da cesta sem a taxa de entrada",
                                              "Cesta sem taxa (R$)", SLATE_600),
                                             ("E", "Casas por faixa da cesta com a taxa de entrada",
                                              "Cesta com taxa (R$)", ROXO_800)], 1):
        prox = tabela_faixas(ws, 4, k, prox, tit, faixas(20, 120, 10), f"${c}${b0}:${c}${b1}", "R$", real,
                             fonte, eixo, cor=cor)
    assert prox <= l_base
    linhas = []
    for i, r in enumerate(d.itertuples(index=False)):
        lr = b0 + i
        linhas.append([r.nome, r.capital_endereco, r.bebida_mais_hamburguer,
                       f"=IFERROR(INDEX({a}$J${t0}:$J${t1},MATCH(A{lr},{a}$A${t0}:$A${t1},0)),0)",
                       f"=C{lr}+D{lr}"])
    tabela(ws, 4, 3, l_base, "Cesta de consumo por casa", ["Casa", "Metrópole", "Cesta sem taxa (R$)",
                                                           "Taxa ponderada (R$)", "Cesta com taxa (R$)"],
           linhas, ["txt", "txt", "rs", "rs", "rs"], fonte, larguras=[36, 16, 12, 12, 12])
    return d


def aba_acervos(wb):
    ws = nova_aba(wb, "5 Acervos")
    a = pd.read_csv(ROOT / "dados" / "B1_acervo_jogos" / "_dados-agregados" / "B1_jogos_dos_acervos.csv")
    d = (a.groupby("estabelecimento").agg(jogos=("jogo", "count"), fonte=("fonte", "first"))
         .reset_index().sort_values(["jogos", "estabelecimento"]).reset_index(drop=True))
    assert d.jogos.sum() == len(a)
    fonte = ("acervos publicados pelas casas do B1 (acervodejogos, Ludopedia, sites e listas; "
             "B1_jogos_dos_acervos.csv, out. a nov./2026).")
    ws.cell(1, 1, "Quantidade de jogos nos acervos dos concorrentes").font = ARIAL_N
    ws.cell(2, 1, f"Títulos listados no acervo de cada casa; {len(d)} casas com acervo publicado; faixas de 200 "
                  "jogos.").font = ARIAL
    l_base = 4 + 19 + 1
    b0, b1 = l_base + 2, l_base + 1 + len(d)
    prox = tabela_faixas(ws, 5, 1, 4, "Casas por faixa de tamanho do acervo", faixas(0, 2000, 200),
                         f"$C${b0}:$C${b1}", "jogos", inteiro, fonte, "N.º de jogos no acervo")
    assert prox <= l_base
    tabela(ws, 5, 2, l_base, "Jogos no acervo por casa", ["Casa", "Fonte do acervo", "N.º de jogos"],
           [[r.estabelecimento, r.fonte, int(r.jogos)] for r in d.itertuples(index=False)],
           ["txt", "txt", "int"], fonte, larguras=[40, 14, 11])
    return d


def aba_jogos(wb):
    ws = nova_aba(wb, "6 Jogos frequentes")
    b = pd.read_csv(ROOT / "dados" / "B1_acervo_jogos" / "_dados-agregados" / "B1_banco_jogos.csv")
    b = b.sort_values(["n_casas_acervo", "jogo"], ascending=[False, True]).reset_index(drop=True)
    corte = int(b.n_casas_acervo.iloc[19])
    t = b[b.n_casas_acervo >= corte].copy()
    t["n_aluguel"] = t.aluguel_detalhe.fillna("").map(lambda s: len(re.findall(r"R\$", s)))
    fonte = "acervos e preços de aluguel publicados pelas casas do B1 (B1_banco_jogos.csv, out. a nov./2026)."
    ws.cell(1, 1, "Aluguel dos jogos mais frequentes nos acervos dos concorrentes").font = ARIAL_N
    ws.cell(2, 1, f"Jogos presentes em {corte} ou mais acervos ({len(t)} jogos, empates incluídos). Aluguel entre as "
                  "casas que alugam o jogo; mistura locações de 1, 3 e 7 dias. Linha: casas com o jogo no acervo "
                  "(de 31).").font = ARIAL
    for k, (col_var, rot) in enumerate([("aluguel_media_rs", "Aluguel médio"),
                                        ("aluguel_mediana_rs", "Aluguel mediano")], 1):
        linha = 4 if k == 1 else 4 + len(t) + 6
        linhas = [[r.jogo, None if pd.isna(getattr(r, col_var)) else float(getattr(r, col_var)), int(r.n_aluguel),
                   int(r.n_casas_acervo)] for r in t.itertuples(index=False)]
        d0, ult, _ = tabela(ws, 6, k, linha, f"{rot} dos jogos mais frequentes nos acervos",
                            ["Jogo", f"{rot} (R$)", "Casas que alugam", "Casas com o jogo no acervo"],
                            linhas, ["txt", "rs", "int", "int"], fonte, larguras=[30, 12, 11, 12])
        grafico_combinado(ws, f"Gráfico 6.{k} – {rot} e casas com o jogo no acervo", (1, d0, ult),
                          (2, d0 - 1, ult), (4, d0 - 1, ult), f"{rot} (R$)", "Casas com o jogo", '"R$ "#,##0',
                          f"F{linha}", largura=26, altura=12)
    return len(t), corte


def aba_sumario(wb):
    ws = wb.create_sheet("0 Sumário", 0)
    ws.sheet_view.showGridLines = False
    ws.cell(1, 1, "Sumário – Histogramas dos concorrentes do B1")
    ws.merge_cells("A1:C1")
    for j, c in enumerate(["Aba", "Tabela", "Fonte"], 1):
        ws.cell(2, j, c)
    for i, (aba, tit, fonte, lin) in enumerate(SUMARIO, 3):
        ws.cell(i, 1, aba).hyperlink = f"#'{aba}'!A1"
        ws.cell(i, 2, tit).hyperlink = f"#'{aba}'!A{lin}"
        ws.cell(i, 3, fonte)
    ult = 2 + len(SUMARIO)
    for r in range(1, ult + 1):
        for j in range(1, 4):
            c = ws.cell(r, j)
            c.fill = BRANCO
            if r <= 2:
                c.font = ARIAL_N
                c.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
                if r == 2:
                    c.border = Border(top=FINA, bottom=FINA, left=SEM, right=SEM)
            else:
                c.font = LINK if j <= 2 else ARIAL
                c.alignment = Alignment(horizontal="left", vertical="center", wrap_text=True)
                c.border = Border(top=SEM, left=SEM, right=SEM, bottom=FINA if r == ult else SEM)
    ws.row_dimensions[1].height = 28
    for j, w in enumerate([20, 70, 80], 1):
        ws.column_dimensions[L(j)].width = w
    ws.cell(ult + 1, 1, "Fonte: elaboração própria. Clique na aba ou na tabela para ir até ela.").font = ARIAL


def main():
    cesta = pd.read_csv(CESTA, sep=";")
    tx, sem = carregar_taxas()
    # conferência: taxa ponderada (média dos dias abertos) = a do script do B2; casas que cobram + sem cobrança = total
    chk = tx.merge(cesta[["place_id", "taxa_ponderada"]], on="place_id", how="left")
    assert len(chk) + len(sem) == len(cesta.dropna(subset=["taxa_ponderada"])), "casas com taxa não fecham"
    assert (chk.ponderada - chk.taxa_ponderada).abs().max() < 0.01, "taxa ponderada diverge do B2"
    wb = Workbook()
    wb.remove(wb.active)
    ref = aba_taxas(wb, tx, sem)
    aba_taxas_dia(wb, ref)
    aba_funcionamento(wb)
    d = aba_cestas(wb, cesta, ref)
    ac = aba_acervos(wb)
    n_fr, corte = aba_jogos(wb)
    aba_sumario(wb)
    SAIDA.parent.mkdir(parents=True, exist_ok=True)
    wb.save(SAIDA)
    print(f"  gravado: {SAIDA.relative_to(ROOT)} ({len(SUMARIO)} tabelas)")
    print(f"  taxas: {len(tx)} casas que cobram (fora: {', '.join(sem)}); cestas: {len(d)}; acervos: {len(ac)}; jogos frequentes: {n_fr} (corte {corte})")


if __name__ == "__main__":
    main()
