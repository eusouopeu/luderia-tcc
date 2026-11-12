"""
Planilha Histogramas.xlsx: cinco abas com tabelas e histogramas nativos do
Excel sobre os concorrentes do B1 (pedido do autor, 12/11/2026).

Abas e regras:
  1. Taxas de entrada - histograma simples: faixas de R$ 5 da taxa ponderada
     pelos dias de funcionamento (B2-a_gasto_por_pessoa.py), barras = n.º de
     casas na faixa (32 casas com taxa conhecida, com a São Jogue).
  2. Funcionamento - fluxo por dia × hora (B1-a_fluxo_dia_hora.py): uma tabela
     e um gráfico com a média e outra com a mediana do índice do Google, só
     entre as casas abertas na hora; barras = fluxo, linha = n.º das 54 casas
     da população do B1 abertas na hora.
  3. Cestas - histograma simples para a cesta sem a taxa (bebida + hambúrguer)
     e outro para a cesta com a taxa (cesta de consumo da R06), mesmas faixas
     de R$ 10, barras = n.º de casas.
  4. Acervos - histograma simples do n.º de jogos por acervo
     (B1_jogos_dos_acervos.csv), faixas de 200 jogos, barras = n.º de casas.
  5. Jogos frequentes - os jogos presentes em mais acervos (corte que fecha
     em pelo menos 20 jogos, empates incluídos; B1_banco_jogos.csv): uma
     tabela e um gráfico com o aluguel médio e outra com o mediano; barras =
     aluguel (R$, mistura locações de 1, 3 e 7 dias), linha = n.º de casas com
     o jogo no acervo.

As faixas contam com CONT.SES sobre a base listada na própria aba, e cada
tabela fecha com o total da base (conferido aqui e na planilha). Média e
mediana das abas 2 e 5 vêm agregadas pelos scripts de origem.

Saída: dados/[B1] Estabelecimentos e cardapios/estabelecimentos/5_graficos/Histogramas.xlsx

Uso:
    python3 _src/extras/gerar_histogramas_xlsx.py
"""
import sys
from pathlib import Path
_AQUI = Path(__file__).resolve()
sys.path[:0] = [str(_AQUI.parent)]
from log_execucao import registrar_execucao  # noqa: E402
if __name__ == "__main__":
    registrar_execucao(__file__)

import re  # noqa: E402

import pandas as pd  # noqa: E402
from openpyxl import Workbook  # noqa: E402
from openpyxl.chart import BarChart, LineChart, Reference  # noqa: E402
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side  # noqa: E402
from openpyxl.utils import get_column_letter  # noqa: E402

ROOT = _AQUI.parents[2]
B1 = ROOT / "dados" / "[B1] Estabelecimentos e cardapios"
VALORES = B1 / "estabelecimentos" / "5_graficos" / "graficos" / "valores"
SAIDA = B1 / "estabelecimentos" / "5_graficos" / "Histogramas.xlsx"
CESTA = ROOT / "dados" / "[B2] Avaliacoes recentes" / "gasto_por_pessoa" / "B1_cesta_casas_com_taxa.csv"

F = "Arial"
TIT = Font(name=F, size=12, bold=True)
CAB = Font(name=F, size=10, bold=True, color="FFFFFF")
TXT = Font(name=F, size=10)
NOTA = Font(name=F, size=9, italic=True, color="595959")
NEG = Font(name=F, size=10, bold=True)
FUNDO = PatternFill("solid", fgColor="4D4D4D")
FINA = Side(style="thin", color="BFBFBF")
BORDA = Border(top=FINA, bottom=FINA, left=FINA, right=FINA)
DIAS = ["segunda", "terca", "quarta", "quinta", "sexta", "sabado", "domingo"]
ABREV = dict(zip(DIAS, ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"]))
NOME_DIA = dict(zip(DIAS, ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"]))


# ---------- utilidades de escrita ----------
def cab(ws, linha, col, titulos, larguras=None):
    for i, t in enumerate(titulos):
        c = ws.cell(linha, col + i, t)
        c.font, c.fill, c.border = CAB, FUNDO, BORDA
        c.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
    ws.row_dimensions[linha].height = 30
    if larguras:
        for i, w in enumerate(larguras):
            letra = get_column_letter(col + i)
            ws.column_dimensions[letra].width = max(ws.column_dimensions[letra].width or 0, w)


def cel(ws, linha, col, valor, fmt=None, fonte=TXT, alinhar=None):
    c = ws.cell(linha, col, valor)
    c.font, c.border = fonte, BORDA
    if fmt:
        c.number_format = fmt
    if alinhar:
        c.alignment = Alignment(horizontal=alinhar)
    return c


def titulo(ws, texto, fonte, nota):
    ws["A1"] = texto
    ws["A1"].font = TIT
    ws["A2"] = fonte
    ws["A2"].font = NOTA
    ws["A3"] = nota
    ws["A3"].font = NOTA
    ws.sheet_view.showGridLines = False


def eixos_visiveis(*graficos):
    for g in graficos:
        g.x_axis.delete = False
        g.y_axis.delete = False


# ---------- histograma simples (faixas × n.º de casas) ----------
def base(ws, linha, col, df, cols, titulos, fmts, larguras):
    """Lista a base (uma linha por casa) a partir de (linha, col); devolve o intervalo da coluna de valor."""
    ws.cell(linha - 1, col, "Base (uma linha por casa)").font = NEG
    cab(ws, linha, col, titulos, larguras)
    for i, r in enumerate(df[cols].itertuples(index=False), start=1):
        for j, v in enumerate(r):
            cel(ws, linha + i, col + j, None if pd.isna(v) else v, fmts[j])
    return linha + 1, linha + len(df)


def histograma(ws, linha, col, rotulo_var, faixas, rng, unidade, ancora, titulo_graf, eixo_x, fmt_lim):
    """Tabela de faixas com CONT.SES sobre `rng` (texto 'D6:D37') e gráfico de barras ao lado.
    Faixas [a, b); a última inclui o limite superior. Devolve a linha seguinte à tabela."""
    ws.cell(linha - 1, col, titulo_graf).font = NEG
    cab(ws, linha, col, ["Faixa", f"De ({unidade})", f"Até ({unidade})", "N.º de casas"], [18, 10, 10, 11])
    n = len(faixas)
    for i, (a, b) in enumerate(faixas):
        r = linha + 1 + i
        ultimo = i == n - 1
        rot = f"{fmt_lim(a)} a {fmt_lim(b)}" if ultimo else f"{fmt_lim(a)} a < {fmt_lim(b)}"
        cel(ws, r, col, rot, alinhar="left")
        cel(ws, r, col + 1, a, "#,##0")
        cel(ws, r, col + 2, b, "#,##0")
        la, lb = get_column_letter(col + 1), get_column_letter(col + 2)
        op = "<=" if ultimo else "<"
        cel(ws, r, col + 3, f'=COUNTIFS({rng},">="&{la}{r},{rng},"{op}"&{lb}{r})', "0")
    rt = linha + 1 + n
    lc = get_column_letter(col + 3)
    cel(ws, rt, col, "Total", fonte=NEG)
    cel(ws, rt, col + 3, f"=SUM({lc}{linha + 1}:{lc}{rt - 1})", "0", NEG)
    cel(ws, rt + 1, col, "Casas na base", fonte=TXT)
    cel(ws, rt + 1, col + 3, f"=COUNT({rng})", "0")
    cel(ws, rt + 2, col, "Diferença (deve ser 0)")
    cel(ws, rt + 2, col + 3, f"={lc}{rt}-{lc}{rt + 1}", "0")
    cel(ws, rt + 3, col, f"Média ({unidade})")
    cel(ws, rt + 3, col + 3, f"=AVERAGE({rng})", "#,##0.00")
    cel(ws, rt + 4, col, f"Mediana ({unidade})")
    cel(ws, rt + 4, col + 3, f"=MEDIAN({rng})", "#,##0.00")

    g = BarChart()
    g.type, g.gapWidth, g.style = "col", 15, 10
    g.title, g.y_axis.title, g.x_axis.title = titulo_graf, "N.º de casas", eixo_x
    g.add_data(Reference(ws, min_col=col + 3, min_row=linha, max_row=rt - 1), titles_from_data=True)
    g.set_categories(Reference(ws, min_col=col, min_row=linha + 1, max_row=rt - 1))
    g.series[0].graphicalProperties.solidFill = "8F8F8F"
    g.legend = None
    g.y_axis.majorGridlines = None
    g.y_axis.numFmt = "0"
    g.height, g.width = 8, 16
    eixos_visiveis(g)
    ws.add_chart(g, ancora)
    return rt + 6


def faixas(ini, fim, passo):
    return [(a, a + passo) for a in range(ini, fim, passo)]


def real(v):
    return f"R$ {v:,.0f}".replace(",", ".")


# ---------- gráfico de barras + linha ----------
def combinado(ws, col_cat, col_barra, col_linha, l0, l1, titulo_graf, eixo_barra, eixo_linha, fmt_barra, ancora,
              largura=24, altura=10):
    g = BarChart()
    g.type, g.gapWidth = "col", 20
    g.title = titulo_graf
    g.add_data(Reference(ws, min_col=col_barra, min_row=l0, max_row=l1), titles_from_data=True)
    g.set_categories(Reference(ws, min_col=col_cat, min_row=l0 + 1, max_row=l1))
    g.series[0].graphicalProperties.solidFill = "8F8F8F"
    g.y_axis.title, g.y_axis.numFmt = eixo_barra, fmt_barra
    g.y_axis.majorGridlines = None
    ln = LineChart()
    ln.add_data(Reference(ws, min_col=col_linha, min_row=l0, max_row=l1), titles_from_data=True)
    s = ln.series[0]
    s.graphicalProperties.line.solidFill = "1F1F1F"
    s.graphicalProperties.line.width = 22000
    s.smooth = False
    ln.y_axis.axId = 200
    ln.y_axis.title = eixo_linha
    ln.y_axis.crosses = "max"
    ln.y_axis.numFmt = "0"
    ln.y_axis.majorGridlines = None
    eixos_visiveis(g, ln)
    g += ln
    g.legend.position = "b"
    g.height, g.width = altura, largura
    ws.add_chart(g, ancora)


# ---------- abas ----------
def aba_taxas(wb, cesta):
    ws = wb.create_sheet("Taxas de entrada")
    d = cesta.dropna(subset=["taxa_ponderada"]).sort_values("taxa_ponderada").reset_index(drop=True)
    titulo(ws, "Taxa de entrada dos concorrentes, por faixa de valor",
           "Fonte: cardápios, sites, imprensa e Instagram das casas do B1 e site e NFC-e da São Jogue "
           "(B2-a_gasto_por_pessoa.py, B1_cesta_casas_com_taxa.csv).",
           "Taxa média ponderada pelos dias em que a casa abre; faixas [de, até), a última inclui o limite. "
           f"{len(d)} casas com taxa conhecida, com a São Jogue.")
    l0, l1 = base(ws, 6, 7, d, ["nome", "capital_endereco", "taxa_ponderada"],
                  ["Casa", "Metrópole", "Taxa ponderada (R$)"], [None, None, "#,##0.00"], [34, 16, 12])
    histograma(ws, 6, 1, "taxa", faixas(0, 45, 5), f"$I${l0}:$I${l1}", "R$", "A21",
               "Casas por faixa de taxa de entrada", "Taxa de entrada (R$)", real)
    return int(d.shape[0])


def aba_funcionamento(wb):
    ws = wb.create_sheet("Funcionamento")
    titulo(ws, "Fluxo dos concorrentes por dia e hora e casas abertas",
           "Fonte: índice \"Horários de pico\" do Google Maps (coleta de 10 e 11/11/2026) e horários publicados "
           "das casas (15/10/2026), recorte B1 (B1-a_fluxo_dia_hora.py).",
           "Fluxo: índice do Google (100% = hora mais cheia da semana da casa), só entre as casas abertas na hora "
           "(46 concorrentes, sem a São Jogue). Linha: n.º das 54 casas da população do B1 abertas na hora. "
           "Horas de 0h a 5h: madrugada do próprio dia.")
    for k, (col_var, rot, col0) in enumerate([("media_pct", "Fluxo médio", 1), ("mediana_pct", "Fluxo mediano", 8)]):
        v = pd.read_csv(VALORES / f"B1_fluxo_dia_hora_{col_var.split('_')[0]}.csv", sep=";")
        ws.cell(5, col0, f"Tabela {k + 1} - {rot} por dia e hora").font = NEG
        cab(ws, 6, col0, ["Dia", "Hora", "Dia e hora", f"{rot} (%)", "Casas abertas na amostra (de 46)",
                          "Casas abertas na população (de 54)"], [10, 6, 11, 10, 13, 13])
        for i, r in enumerate(v.itertuples(index=False), start=7):
            cel(ws, i, col0, NOME_DIA[r.dia_semana])
            cel(ws, i, col0 + 1, int(r.hora), "0")
            cel(ws, i, col0 + 2, f"{ABREV[r.dia_semana]} {int(r.hora)}h")
            val = getattr(r, col_var)
            cel(ws, i, col0 + 3, None if pd.isna(val) else val / 100, "0%")
            cel(ws, i, col0 + 4, 0 if pd.isna(r.casas_abertas) else int(r.casas_abertas), "0")
            cel(ws, i, col0 + 5, int(r.casas_pop_abertas), "0")
        fim = 6 + len(v)
        combinado(ws, col0 + 2, col0 + 3, col0 + 5, 6, fim, f"{rot} por dia e hora e casas abertas",
                  f"{rot} (% da hora mais cheia)", "Casas abertas (de 54)", "0%",
                  f"O{6 + k * 24}", largura=34, altura=11)
    ws.freeze_panes = "A7"


def aba_cestas(wb, cesta):
    ws = wb.create_sheet("Cestas")
    d = cesta.dropna(subset=["cesta_consumo"]).sort_values("cesta_consumo").reset_index(drop=True)
    titulo(ws, "Cesta de consumo por pessoa dos concorrentes, sem e com a taxa de entrada",
           "Fonte: cardápios do B1 (bebida e hambúrguer) e taxas de entrada (B2-a_gasto_por_pessoa.py, "
           "B1_cesta_casas_com_taxa.csv).",
           "Sem taxa: bebida (mediana do cardápio) + hambúrguer mais barato não vegetariano. Com taxa: soma da "
           f"taxa ponderada. {len(d)} casas com taxa, bebida e hambúrguer no cardápio; faixas de R$ 10.")
    l0, l1 = base(ws, 6, 13, d, ["nome", "capital_endereco", "bebida_mais_hamburguer", "taxa_ponderada",
                                 "cesta_consumo"],
                  ["Casa", "Metrópole", "Cesta sem taxa (R$)", "Taxa ponderada (R$)", "Cesta com taxa (R$)"],
                  [None, None, "#,##0.00", "#,##0.00", "#,##0.00"], [34, 16, 12, 12, 12])
    fx = faixas(20, 120, 10)
    histograma(ws, 6, 1, "sem", fx, f"$O${l0}:$O${l1}", "R$", "A24",
               "Casas por faixa da cesta sem a taxa de entrada", "Cesta sem taxa (R$)", real)
    histograma(ws, 6, 7, "com", fx, f"$Q${l0}:$Q${l1}", "R$", "G24",
               "Casas por faixa da cesta com a taxa de entrada", "Cesta com taxa (R$)", real)
    return int(d.shape[0])


def aba_acervos(wb):
    ws = wb.create_sheet("Acervos")
    a = pd.read_csv(B1 / "acervo_jogos" / "B1_jogos_dos_acervos.csv")
    d = (a.groupby("estabelecimento").agg(jogos=("jogo", "count"), fonte=("fonte", "first"))
         .reset_index().sort_values("jogos"))
    assert d.jogos.sum() == len(a)
    titulo(ws, "Quantidade de jogos nos acervos dos concorrentes, por faixa",
           "Fonte: acervos publicados pelas casas do B1 (acervodejogos, Ludopedia, sites e listas; "
           "B1_jogos_dos_acervos.csv, out. a nov./2026).",
           f"Títulos listados no acervo de cada casa; {len(d)} casas com acervo publicado; faixas de 200 jogos.")
    l0, l1 = base(ws, 6, 7, d, ["estabelecimento", "fonte", "jogos"], ["Casa", "Fonte do acervo", "N.º de jogos"],
                  [None, None, "#,##0"], [40, 14, 10])
    histograma(ws, 6, 1, "jogos", faixas(0, 2000, 200), f"$I${l0}:$I${l1}", "jogos", "A24",
               "Casas por faixa de tamanho do acervo", "N.º de jogos no acervo",
               lambda v: f"{v:,.0f}".replace(",", "."))
    return int(len(d)), int(d.jogos.sum())


def aba_jogos(wb):
    ws = wb.create_sheet("Jogos frequentes")
    b = pd.read_csv(B1 / "acervo_jogos" / "B1_banco_jogos.csv")
    b = b.sort_values(["n_casas_acervo", "jogo"], ascending=[False, True]).reset_index(drop=True)
    corte = b.n_casas_acervo.iloc[19]
    t = b[b.n_casas_acervo >= corte].copy()
    t["n_aluguel"] = t.aluguel_detalhe.fillna("").map(lambda s: len(re.findall(r"R\$", s)))
    titulo(ws, "Aluguel dos jogos mais frequentes nos acervos dos concorrentes",
           "Fonte: acervos e preços de aluguel publicados pelas casas do B1 (B1_banco_jogos.csv, out. a nov./2026).",
           f"Jogos presentes em {corte} ou mais acervos ({len(t)} jogos, empates incluídos). Aluguel: média e "
           "mediana entre as casas que alugam o jogo; mistura locações de 1, 3 e 7 dias. Linha: n.º de casas "
           "com o jogo no acervo (de 31).")
    for k, (col_var, rot, col0) in enumerate([("aluguel_media_rs", "Aluguel médio", 1),
                                              ("aluguel_mediana_rs", "Aluguel mediano", 7)]):
        ws.cell(5, col0, f"Tabela {k + 1} - {rot} dos jogos mais frequentes").font = NEG
        cab(ws, 6, col0, ["Jogo", f"{rot} (R$)", "Casas que alugam", "Casas com o jogo no acervo"],
            [30, 11, 10, 12])
        for i, r in enumerate(t.itertuples(index=False), start=7):
            cel(ws, i, col0, r.jogo)
            val = getattr(r, col_var)
            cel(ws, i, col0 + 1, None if pd.isna(val) else float(val), "#,##0.00")
            cel(ws, i, col0 + 2, int(r.n_aluguel), "0")
            cel(ws, i, col0 + 3, int(r.n_casas_acervo), "0")
        fim = 6 + len(t)
        combinado(ws, col0, col0 + 1, col0 + 3, 6, fim, f"{rot} e casas com o jogo no acervo",
                  f"{rot} (R$)", "Casas com o jogo", '"R$ "#,##0', f"L{6 + k * 26}",
                  largura=28, altura=12)
    return len(t), int(corte)


def main():
    cesta = pd.read_csv(CESTA, sep=";")
    wb = Workbook()
    wb.remove(wb.active)
    n_tx = aba_taxas(wb, cesta)
    aba_funcionamento(wb)
    n_ce = aba_cestas(wb, cesta)
    n_ac, n_jg = aba_acervos(wb)
    n_fr, corte = aba_jogos(wb)
    SAIDA.parent.mkdir(parents=True, exist_ok=True)
    wb.save(SAIDA)
    print(f"  gravado: {SAIDA.relative_to(ROOT)}")
    print(f"  taxas: {n_tx} casas; cestas: {n_ce} casas; acervos: {n_ac} casas ({n_jg} títulos); "
          f"jogos frequentes: {n_fr} (corte {corte} acervos)")


if __name__ == "__main__":
    main()
