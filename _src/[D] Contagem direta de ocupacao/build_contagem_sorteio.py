"""
Bloco D - planilha de sorteio das visitas da contagem direta de ocupação.

Desenho decidido pelo autor em 17/09/2026:
  - 4 visitas no total, divididas entre as duas unidades da São Jogue.
  - Dois períodos de 15 dias, amarrados ao pagamento dos servidores estaduais
    da Bahia: a quinzena pós-pagamento começa no primeiro dia de pagamento de
    setembro (29/09/2026, inativos e pensionistas; ativos recebem em 30/09) e
    vai até 13/10; a quinzena pré-pagamento vai de 14/10 a 28/10, véspera do
    pagamento de outubro (29/10).
  - Em cada quinzena, 1 visita em dia útil (segunda a quinta) e 1 no fim de
    semana (sexta a domingo). Feriados ficam fora (12/10).
  - Cada unidade recebe 2 visitas: uma em cada quinzena e uma de cada tipo de
    dia. Um sorteio decide qual unidade fica com o dia útil da quinzena
    pós-pagamento; as demais atribuições seguem desse resultado.
  - Funcionamento de 12h00 a 22h00; cada visita dura 3 horas, com contagem a
    cada 30 minutos (7 contagens), em um de três turnos fixos: 12h00-15h00,
    15h30-18h30 e 19h00-22h00.

Os números aleatórios são gerados aqui com semente fixa (a do registro prévio)
e gravados como valores; a escolha é feita por fórmulas. Mudar a semente ou o
período exige nova versão deste script, não edição da planilha.

Fonte das datas de pagamento: Governo da Bahia, Secretaria da Administração,
Tabela de Pagamentos 2026 (servidores.rhbahia.ba.gov.br/tabela-de-pagamentos-2026),
consultada em 17/09/2026.

Saída: _data/processed/[D] Contagem direta de ocupacao/contagem_sorteio_visitas.xlsx

Uso:
    python3 "_src/[D] Contagem direta de ocupacao/build_contagem_sorteio.py"
"""
import pathlib
import random
from datetime import date, timedelta

from openpyxl import Workbook
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.worksheet.datavalidation import DataValidation

ROOT = pathlib.Path(__file__).resolve().parents[2]
OUT_PATH = ROOT / "_data" / "processed" / "[D] Contagem direta de ocupacao" / "contagem_sorteio_visitas.xlsx"

SEMENTE = 20260916
PAGAMENTO = date(2026, 9, 29)     # 1º dia de pagamento de setembro (inativos e pensionistas)
DIAS_QUINZENA = 15
FIM = date(2026, 10, 28)          # véspera do pagamento de outubro (29/10)
FERIADOS = [(date(2026, 10, 12), "Nossa Senhora Aparecida (nacional)")]
TURNOS = [
    ("Turno 1", "12h00 às 15h00", "12h00, 12h30, 13h00, 13h30, 14h00, 14h30, 15h00"),
    ("Turno 2", "15h30 às 18h30", "15h30, 16h00, 16h30, 17h00, 17h30, 18h00, 18h30"),
    ("Turno 3", "19h00 às 22h00", "19h00, 19h30, 20h00, 20h30, 21h00, 21h30, 22h00"),
]
QUINZENAS = ["Pós-pagamento", "Pré-pagamento"]
TIPOS = ["Dia útil (seg a qui)", "Fim de semana (sex a dom)"]

FONTE = Font(name="Arial", size=10)
NEGRITO = Font(name="Arial", size=10, bold=True)
TITULO = Font(name="Arial", size=12, bold=True)
AZUL = Font(name="Arial", size=10, color="0000FF")
VERDE = Font(name="Arial", size=10, color="008000")
AMARELO = PatternFill("solid", fgColor="FFFF00")
CINZA = PatternFill("solid", fgColor="E7E6E6")
FINA = Side(style="thin", color="000000")
BORDA = Border(left=FINA, right=FINA, top=FINA, bottom=FINA)
CENTRO = Alignment(horizontal="center", vertical="center", wrap_text=True)
ESQUERDA = Alignment(horizontal="left", vertical="center", wrap_text=True)


def cel(ws, ref, valor, fonte=FONTE, alinhamento=ESQUERDA, fill=None, formato=None, borda=True):
    c = ws[ref]
    c.value = valor
    c.font = fonte
    c.alignment = alinhamento
    if borda:
        c.border = BORDA
    if fill:
        c.fill = fill
    if formato:
        c.number_format = formato
    return c


def cabecalho(ws, linha, titulos, larguras):
    for i, (t, w) in enumerate(zip(titulos, larguras), start=1):
        letra = ws.cell(row=linha, column=i).column_letter
        cel(ws, f"{letra}{linha}", t, NEGRITO, CENTRO, CINZA)
        ws.column_dimensions[letra].width = w


def aba_instrucoes(ws):
    ws.title = "Instruções"
    ws.column_dimensions["A"].width = 110
    linhas = [
        ("Sorteio das visitas da contagem direta de ocupação (Bloco D)", TITULO),
        ("", FONTE),
        ("Como usar", NEGRITO),
        ("1. Na aba Parâmetros, preencha as células amarelas com o nome das duas unidades da São Jogue.", FONTE),
        ("2. Na aba Datas e turnos, marque \"não\" na coluna amarela Unidade aberta? para os dias em que a São Jogue não abre. "
         "Faça isso ANTES de abrir a aba Sorteio: mudar a lista depois de ver o resultado invalida o sorteio.", FONTE),
        ("3. A aba Sorteio mostra as 4 visitas. Se um dia sorteado for marcado como fechado, a fórmula passa para o próximo da ordem.", FONTE),
        ("4. Registre o resultado final: copie a aba Sorteio e cole como valores na aba Registro, com a data do sorteio.", FONTE),
        ("", FONTE),
        ("Regras do sorteio", NEGRITO),
        ("• 4 visitas no total, 2 por unidade.", FONTE),
        ("• Quinzena pós-pagamento: 29/09 a 13/10/2026. Quinzena pré-pagamento: 14/10 a 28/10/2026.", FONTE),
        ("• Em cada quinzena: 1 visita em dia útil (segunda a quinta) e 1 no fim de semana (sexta a domingo). Feriados excluídos.", FONTE),
        ("• Cada unidade fica com 1 visita em cada quinzena e 1 de cada tipo de dia.", FONTE),
        ("• Visita de 3 horas em um de três turnos (12h00-15h00, 15h30-18h30, 19h00-22h00), com contagem a cada 30 minutos.", FONTE),
        ("• Os números aleatórios foram gerados com semente fixa (20260916) pelo script "
         "_src/[D] Contagem direta de ocupacao/build_contagem_sorteio.py e não devem ser editados.", FONTE),
        ("", FONTE),
        ("Legenda de cores", NEGRITO),
        ("Fundo amarelo: célula para preencher. Texto azul: valor fixo (dado ou número sorteado). "
         "Texto preto: fórmula. Texto verde: fórmula que busca dado de outra aba.", FONTE),
        ("", FONTE),
        ("Fonte das datas de pagamento: Governo da Bahia, Tabela de Pagamentos 2026 dos servidores estaduais "
         "(servidores.rhbahia.ba.gov.br/tabela-de-pagamentos-2026), consultada em 17/09/2026. "
         "Setembro: ativos 30/09, inativos e pensionistas 29/09. Outubro: ativos 30/10, inativos e pensionistas 29/10.", FONTE),
    ]
    for i, (texto, fonte) in enumerate(linhas, start=1):
        c = ws.cell(row=i, column=1, value=texto)
        c.font = fonte
        c.alignment = Alignment(wrap_text=True, vertical="top")


def aba_parametros(ws, sorteio_unidade):
    ws.title = "Parâmetros"
    ws.column_dimensions["A"].width = 44
    ws.column_dimensions["B"].width = 24
    ws.column_dimensions["C"].width = 60
    cel(ws, "A1", "Parâmetros do sorteio", TITULO, borda=False)
    cabecalho_param = [("A3", "Parâmetro"), ("B3", "Valor"), ("C3", "Observação")]
    for ref, t in cabecalho_param:
        cel(ws, ref, t, NEGRITO, CENTRO, CINZA)
    linhas = [
        ("Nome da unidade 1", "Unidade 1", "Preencher", AMARELO, FONTE, None),
        ("Nome da unidade 2", "Unidade 2", "Preencher", AMARELO, FONTE, None),
        ("1º dia de pagamento de setembro", PAGAMENTO, "Inativos e pensionistas (ativos: 30/09)", None, AZUL, "DD/MM/YYYY"),
        ("Dias por quinzena", DIAS_QUINZENA, "Quinzena pós-pagamento começa no dia do pagamento", None, AZUL, "0"),
        ("Último dia da quinzena pré-pagamento", FIM, "Véspera do pagamento de outubro (29/10)", None, AZUL, "DD/MM/YYYY"),
        ("Semente dos números aleatórios", SEMENTE, "Mesma do registro prévio", None, AZUL, "0"),
        ("Número sorteado para as unidades", sorteio_unidade,
         "< 0,5: unidade 1 fica com o dia útil pós-pagamento; ≥ 0,5: unidade 2", None, AZUL, "0.0000"),
    ]
    for i, (rotulo, valor, obs, fill, fonte, formato) in enumerate(linhas, start=4):
        cel(ws, f"A{i}", rotulo)
        cel(ws, f"B{i}", valor, fonte, CENTRO, fill, formato)
        cel(ws, f"C{i}", obs)

    cel(ws, "A13", "Turnos", NEGRITO, borda=False)
    for ref, t in [("A14", "Turno"), ("B14", "Horário"), ("C14", "Horários das 7 contagens")]:
        cel(ws, ref, t, NEGRITO, CENTRO, CINZA)
    for i, (turno, horario, contagens) in enumerate(TURNOS, start=15):
        cel(ws, f"A{i}", turno, AZUL)
        cel(ws, f"B{i}", horario, AZUL, CENTRO)
        cel(ws, f"C{i}", contagens, AZUL)

    cel(ws, "A20", "Feriados no período", NEGRITO, borda=False)
    for ref, t in [("A21", "Feriado"), ("B21", "Data")]:
        cel(ws, ref, t, NEGRITO, CENTRO, CINZA)
    for i, (dia, nome) in enumerate(FERIADOS, start=22):
        cel(ws, f"A{i}", nome, AZUL)
        cel(ws, f"B{i}", dia, AZUL, CENTRO, formato="DD/MM/YYYY")
    return 22, 21 + len(FERIADOS)


def aba_datas(ws, rng, fer_ini, fer_fim):
    ws.title = "Datas e turnos"
    cel(ws, "A1", "Todas as combinações de dia e turno do período", TITULO, borda=False)
    titulos = ["Número aleatório", "Data", "Dia da semana", "Tipo de dia", "Quinzena", "Turno",
               "Horário", "Feriado?", "Unidade aberta?", "Elegível?", "Estrato", "Ordem no estrato"]
    cabecalho(ws, 2, titulos, [12, 12, 13, 24, 16, 10, 16, 10, 12, 10, 40, 11])
    ws.freeze_panes = "A3"

    linha = 3
    dia = PAGAMENTO
    while dia <= FIM:
        for t in range(len(TURNOS)):
            i = linha
            cel(ws, f"A{i}", rng.random(), AZUL, CENTRO, formato="0.0000")
            cel(ws, f"B{i}", dia, AZUL, CENTRO, formato="DD/MM/YYYY")
            cel(ws, f"C{i}", f'=CHOOSE(WEEKDAY(B{i},2),"segunda","terça","quarta","quinta","sexta","sábado","domingo")', alinhamento=CENTRO)
            cel(ws, f"D{i}", f'=IF(WEEKDAY(B{i},2)<=4,"{TIPOS[0]}","{TIPOS[1]}")', alinhamento=CENTRO)
            cel(ws, f"E{i}", f"=IF(B{i}<Parâmetros!$B$6+Parâmetros!$B$7,\"{QUINZENAS[0]}\",\"{QUINZENAS[1]}\")", VERDE, CENTRO)
            cel(ws, f"F{i}", f"=Parâmetros!$A${15 + t}", VERDE, CENTRO)
            cel(ws, f"G{i}", f"=Parâmetros!$B${15 + t}", VERDE, CENTRO)
            cel(ws, f"H{i}", f'=IF(COUNTIF(Parâmetros!$B${fer_ini}:$B${fer_fim},B{i})>0,"sim","não")', VERDE, CENTRO)
            cel(ws, f"I{i}", "sim", FONTE, CENTRO, AMARELO)
            cel(ws, f"J{i}", f'=IF(AND(H{i}="não",I{i}="sim"),"sim","não")', alinhamento=CENTRO)
            cel(ws, f"K{i}", f'=E{i}&" | "&D{i}')
            linha += 1
        dia += timedelta(days=1)
    fim = linha - 1
    for i in range(3, fim + 1):
        cel(ws, f"L{i}",
            f'=IF(J{i}="sim",COUNTIFS($K$3:$K${fim},K{i},$J$3:$J${fim},"sim",$A$3:$A${fim},"<="&A{i}),"")',
            alinhamento=CENTRO)
    dv = DataValidation(type="list", formula1='"sim,não"', allow_blank=False)
    ws.add_data_validation(dv)
    dv.add(f"I3:I{fim}")
    return fim


def aba_sorteio(ws, fim):
    ws.title = "Sorteio"
    cel(ws, "A1", "Resultado do sorteio: 4 visitas", TITULO, borda=False)
    titulos = ["Visita", "Quinzena", "Tipo de dia", "Unidade", "Data", "Dia da semana", "Turno",
               "Horário", "Horários das contagens"]
    cabecalho(ws, 2, titulos, [8, 16, 24, 22, 12, 13, 10, 16, 58])
    rng_k = f"'Datas e turnos'!$K$3:$K${fim}"
    rng_l = f"'Datas e turnos'!$L$3:$L${fim}"
    # Unidade 1 fica com (pós, dia útil) e (pré, fim de semana) se o número < 0,5.
    visitas = [
        (QUINZENAS[0], TIPOS[0], True),
        (QUINZENAS[0], TIPOS[1], False),
        (QUINZENAS[1], TIPOS[0], False),
        (QUINZENAS[1], TIPOS[1], True),
    ]
    for n, (quinzena, tipo, com_unidade_1) in enumerate(visitas, start=1):
        i = n + 2
        u_se_menor, u_se_maior = ("$B$4", "$B$5") if com_unidade_1 else ("$B$5", "$B$4")
        # Linha escolhida: a de ordem 1 no estrato "quinzena | tipo".
        linha_escolhida = f'MATCH(1,INDEX(({rng_k}=B{i}&" | "&C{i})*({rng_l}=1),0),0)'
        cel(ws, f"A{i}", n, AZUL, CENTRO)
        cel(ws, f"B{i}", quinzena, AZUL, CENTRO)
        cel(ws, f"C{i}", tipo, AZUL, CENTRO)
        cel(ws, f"D{i}", f"=IF(Parâmetros!$B$10<0.5,Parâmetros!{u_se_menor},Parâmetros!{u_se_maior})", VERDE, CENTRO)
        for col, src, fmt in [("E", "B", "DD/MM/YYYY"), ("F", "C", None), ("G", "F", None), ("H", "G", None)]:
            cel(ws, f"{col}{i}", f"=IFERROR(INDEX('Datas e turnos'!${src}$3:${src}${fim},{linha_escolhida}),\"sem dia elegível\")",
                VERDE, CENTRO, formato=fmt)
        cel(ws, f"I{i}", f'=IFERROR(INDEX(Parâmetros!$C$15:$C$17,MATCH(G{i},Parâmetros!$A$15:$A$17,0)),"")', VERDE)

    cel(ws, "A8", "Conferência", NEGRITO, borda=False)
    cel(ws, "A9", "Visitas por unidade (deve dar 2 e 2):", borda=False)
    cel(ws, "D9", '=Parâmetros!$B$4&": "&COUNTIF($D$3:$D$6,Parâmetros!$B$4)&" | "&Parâmetros!$B$5&": "&COUNTIF($D$3:$D$6,Parâmetros!$B$5)', borda=False)


def aba_registro(ws):
    ws.title = "Registro"
    cel(ws, "A1", "Registro do sorteio (colar como valores)", TITULO, borda=False)
    cel(ws, "A2", "Data do sorteio:", NEGRITO, borda=False)
    cel(ws, "B2", None, fill=AMARELO, formato="DD/MM/YYYY")
    titulos = ["Visita", "Quinzena", "Tipo de dia", "Unidade", "Data", "Dia da semana", "Turno",
               "Horário", "Horários das contagens", "Realizada? (sim/não)", "Observação"]
    cabecalho(ws, 4, titulos, [8, 16, 24, 22, 12, 13, 10, 16, 58, 12, 40])
    for i in range(5, 9):
        for col in "ABCDEFGHIJK":
            cel(ws, f"{col}{i}", None, fill=AMARELO)


def main():
    rng = random.Random(SEMENTE)
    sorteio_unidade = rng.random()
    wb = Workbook()
    aba_instrucoes(wb.active)
    fer_ini, fer_fim = aba_parametros(wb.create_sheet(), sorteio_unidade)
    fim = aba_datas(wb.create_sheet(), rng, fer_ini, fer_fim)
    aba_sorteio(wb.create_sheet(), fim)
    aba_registro(wb.create_sheet())
    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    wb.save(OUT_PATH)
    print(f"OK: {OUT_PATH.name} - {fim - 2} combinações de dia e turno")


if __name__ == "__main__":
    main()
