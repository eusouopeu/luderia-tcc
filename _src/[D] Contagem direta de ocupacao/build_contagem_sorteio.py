"""
Bloco D - planilha de sorteio das visitas da contagem direta de ocupação.

Desenho decidido pelo autor em 18/09/2026 (substitui os de 17/09 e da manhã
de 18/09/2026):
  - 4 visitas no total, 2 em cada unidade da São Jogue: 1 sorteada e 1 de
    retorno.
  - Visitas sorteadas entre 02/10 e 04/10/2026 (sexta a domingo), dentro da
    quinzena posterior ao pagamento dos servidores estaduais da Bahia
    (29/09/2026). Cada combinação de dia e hora de início (12h00, 13h00, ...,
    19h00) é uma possibilidade. As duas unidades ficam em dias diferentes,
    para que o observador possa ficar o tempo que precisar em cada visita.
    Um número sorteado define qual unidade escolhe primeiro.
  - Visita de retorno 15 dias depois, na mesma unidade e na mesma hora de
    início (17/10 a 19/10/2026, quinzena anterior ao pagamento seguinte). Se
    a unidade estiver fechada, a visita passa ao dia seguinte de
    funcionamento.
  - O número da NFC-e registrado na visita sorteada e na de retorno dá o total
    de notas emitidas no intervalo, por unidade.
  - Visitas sem duração fixa, do lado de fora do estabelecimento; início e
    fim são registrados, e as taxas são calculadas por hora observada.

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
INICIO = date(2026, 10, 2)        # primeiro dia possível das visitas sorteadas
FIM = date(2026, 10, 4)           # último dia possível das visitas sorteadas
HORAS = list(range(12, 20))       # horas de início possíveis: 12h00 a 19h00
DIAS_RETORNO = 15                 # intervalo entre a visita sorteada e a de retorno
DIAS_RETORNO_LISTA = 7            # dias listados a partir do primeiro retorno possível
FERIADOS = []                     # não há feriado entre 02/10 e 23/10/2026

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


# MINIFS precisa do prefixo _xlfn. para ser reconhecida pelo Excel e pelo LibreOffice.
MINIFS = "_xlfn.MINIFS"
DIAS_SEMANA = '"segunda","terça","quarta","quinta","sexta","sábado","domingo"'


def aba_instrucoes(ws):
    ws.title = "Instruções"
    ws.column_dimensions["A"].width = 110
    linhas = [
        ("Sorteio das visitas da contagem direta de ocupação (Bloco D)", TITULO),
        ("", FONTE),
        ("Como usar", NEGRITO),
        ("1. Na aba Parâmetros, preencha as células amarelas com o nome das duas unidades da São Jogue.", FONTE),
        ("2. Nas abas Dias e horas e Retorno, marque \"não\" nas colunas amarelas de cada unidade para os dias e horas "
         "em que ela não abre. Faça isso ANTES de abrir a aba Sorteio: mudar a lista depois de ver o resultado invalida o sorteio.", FONTE),
        ("3. A aba Sorteio mostra as 2 visitas sorteadas e as 2 de retorno.", FONTE),
        ("4. Registre o resultado final: copie a aba Sorteio e cole como valores na aba Registro, com a data do sorteio.", FONTE),
        ("", FONTE),
        ("Regras do sorteio", NEGRITO),
        ("• 4 visitas no total, 2 por unidade: 1 sorteada e 1 de retorno.", FONTE),
        ("• Visitas sorteadas entre 02/10 e 04/10/2026. Cada combinação de dia e hora de início (12h00 a 19h00, de hora em hora) "
         "é uma possibilidade. As duas unidades ficam em dias diferentes.", FONTE),
        ("• Um número sorteado define qual unidade escolhe primeiro. Cada unidade fica com a combinação aberta de menor "
         "número aleatório; a segunda unidade não pode ficar no mesmo dia da primeira.", FONTE),
        ("• Visita de retorno: 15 dias depois da sorteada, na mesma unidade e na mesma hora de início (17/10 a 19/10/2026). "
         "Se a unidade estiver fechada, a visita passa ao dia seguinte de funcionamento.", FONTE),
        ("• Em cada visita, registrar o número da NFC-e no início e no fim, e o horário de início e de fim. "
         "A diferença entre os números da visita sorteada e da de retorno dá as notas emitidas no intervalo.", FONTE),
        ("• Visitas sem duração fixa, do lado de fora do estabelecimento, com contagem a cada 30 minutos.", FONTE),
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
    for ref, t in [("A3", "Parâmetro"), ("B3", "Valor"), ("C3", "Observação")]:
        cel(ws, ref, t, NEGRITO, CENTRO, CINZA)
    linhas = [
        ("Nome da unidade 1", "Unidade 1", "Preencher", AMARELO, FONTE, None),
        ("Nome da unidade 2", "Unidade 2", "Preencher", AMARELO, FONTE, None),
        ("Primeiro dia das visitas sorteadas", INICIO, "Sexta-feira", None, AZUL, "DD/MM/YYYY"),
        ("Último dia das visitas sorteadas", FIM, "Domingo", None, AZUL, "DD/MM/YYYY"),
        ("Semente dos números aleatórios", SEMENTE, "Mesma do registro prévio", None, AZUL, "0"),
        ("Número sorteado para as unidades", sorteio_unidade,
         "< 0,5: unidade 1 escolhe primeiro; ≥ 0,5: unidade 2", None, AZUL, "0.0000"),
        ("Dias até a visita de retorno", DIAS_RETORNO, "Contados a partir da visita sorteada", None, AZUL, "0"),
    ]
    for i, (rotulo, valor, obs, fill, fonte, formato) in enumerate(linhas, start=4):
        cel(ws, f"A{i}", rotulo)
        cel(ws, f"B{i}", valor, fonte, CENTRO, fill, formato)
        cel(ws, f"C{i}", obs)


# Unidades na ordem de escolha, conforme o número sorteado (Parâmetros!B9).
PRIMEIRA = "IF(Parâmetros!$B$9<0.5,Parâmetros!$B$4,Parâmetros!$B$5)"
SEGUNDA = "IF(Parâmetros!$B$9<0.5,Parâmetros!$B$5,Parâmetros!$B$4)"


def aba_dias_horas(ws, rng):
    ws.title = "Dias e horas"
    cel(ws, "A1", "Combinações de dia e hora de início das visitas sorteadas", TITULO, borda=False)
    titulos = ["Número aleatório", "Data", "Dia da semana", "Hora de início", "Unidade 1 aberta?", "Unidade 2 aberta?"]
    cabecalho(ws, 2, titulos, [12, 12, 13, 12, 12, 12])
    ws.freeze_panes = "A3"
    linha = 3
    dia = INICIO
    while dia <= FIM:
        for h in HORAS:
            i = linha
            cel(ws, f"A{i}", rng.random(), AZUL, CENTRO, formato="0.0000")
            cel(ws, f"B{i}", dia, AZUL, CENTRO, formato="DD/MM/YYYY")
            cel(ws, f"C{i}", f"=CHOOSE(WEEKDAY(B{i},2),{DIAS_SEMANA})", alinhamento=CENTRO)
            cel(ws, f"D{i}", f"{h:02d}h00", AZUL, CENTRO)
            cel(ws, f"E{i}", "sim", FONTE, CENTRO, AMARELO)
            cel(ws, f"F{i}", "sim", FONTE, CENTRO, AMARELO)
            linha += 1
        dia += timedelta(days=1)
    fim = linha - 1
    dv = DataValidation(type="list", formula1='"sim,não"', allow_blank=False)
    ws.add_data_validation(dv)
    dv.add(f"E3:F{fim}")
    return fim


def aba_retorno(ws):
    ws.title = "Retorno"
    cel(ws, "A1", "Dias possíveis para as visitas de retorno", TITULO, borda=False)
    cabecalho(ws, 2, ["Data", "Dia da semana", "Unidade 1 aberta?", "Unidade 2 aberta?"], [12, 13, 12, 12])
    primeiro = INICIO + timedelta(days=DIAS_RETORNO)
    for n in range(DIAS_RETORNO_LISTA):
        i = n + 3
        cel(ws, f"A{i}", primeiro + timedelta(days=n), AZUL, CENTRO, formato="DD/MM/YYYY")
        cel(ws, f"B{i}", f"=CHOOSE(WEEKDAY(A{i},2),{DIAS_SEMANA})", alinhamento=CENTRO)
        cel(ws, f"C{i}", "sim", FONTE, CENTRO, AMARELO)
        cel(ws, f"D{i}", "sim", FONTE, CENTRO, AMARELO)
    fim = DIAS_RETORNO_LISTA + 2
    dv = DataValidation(type="list", formula1='"sim,não"', allow_blank=False)
    ws.add_data_validation(dv)
    dv.add(f"C3:D{fim}")
    return fim


def aba_sorteio(ws, fim, fim_ret):
    ws.title = "Sorteio"
    cel(ws, "A1", "Resultado do sorteio: 2 visitas sorteadas e 2 de retorno", TITULO, borda=False)
    titulos = ["Visita", "Tipo de visita", "Unidade", "Data", "Dia da semana", "Hora de início", "Número aleatório"]
    cabecalho(ws, 2, titulos, [8, 22, 22, 12, 13, 13, 12])
    r = lambda col: f"'Dias e horas'!${col}$3:${col}${fim}"
    aberta = lambda un: f'IF({un}=Parâmetros!$B$4,{r("E")},{r("F")})'
    # Visita 1: menor número aleatório entre as combinações abertas da primeira unidade.
    # Visita 2: idem para a segunda unidade, excluído o dia da visita 1.
    cel(ws, "A3", 1, AZUL, CENTRO)
    cel(ws, "B3", "Sorteada", AZUL, CENTRO)
    cel(ws, "C3", f"={PRIMEIRA}", VERDE, CENTRO)
    cel(ws, "G3", f'=IF(C3=Parâmetros!$B$4,{MINIFS}({r("A")},{r("E")},"sim"),{MINIFS}({r("A")},{r("F")},"sim"))',
        VERDE, CENTRO, formato="0.0000")
    cel(ws, "A4", 2, AZUL, CENTRO)
    cel(ws, "B4", "Sorteada", AZUL, CENTRO)
    cel(ws, "C4", f"={SEGUNDA}", VERDE, CENTRO)
    cel(ws, "G4", f'=IF(C4=Parâmetros!$B$4,{MINIFS}({r("A")},{r("E")},"sim",{r("B")},"<>"&D3),{MINIFS}({r("A")},{r("F")},"sim",{r("B")},"<>"&D3))',
        VERDE, CENTRO, formato="0.0000")
    for i in (3, 4):
        linha = f'MATCH(G{i},{r("A")},0)'
        cel(ws, f"D{i}", f'=IFERROR(INDEX({r("B")},{linha}),"sem combinação")', VERDE, CENTRO, formato="DD/MM/YYYY")
        cel(ws, f"F{i}", f'=IFERROR(INDEX({r("D")},{linha}),"")', VERDE, CENTRO)

    rr = lambda col: f"Retorno!${col}$3:${col}${fim_ret}"
    for n, origem in [(5, 3), (6, 4)]:
        alvo = f"(D{origem}+Parâmetros!$B$10)"
        aberta_ret = f'((C{n}=Parâmetros!$B$4)*({rr("C")}="sim")+(C{n}<>Parâmetros!$B$4)*({rr("D")}="sim"))'
        linha = f'MATCH(1,INDEX(({rr("A")}>={alvo})*{aberta_ret},0),0)'
        cel(ws, f"A{n}", n - 2, AZUL, CENTRO)
        cel(ws, f"B{n}", f"Retorno da visita {origem - 2}", AZUL, CENTRO)
        cel(ws, f"C{n}", f"=C{origem}", alinhamento=CENTRO)
        cel(ws, f"D{n}", f'=IFERROR(INDEX({rr("A")},{linha}),"sem dia de retorno")', VERDE, CENTRO, formato="DD/MM/YYYY")
        cel(ws, f"F{n}", f"=F{origem}", alinhamento=CENTRO)
        cel(ws, f"G{n}", None)
    for i in range(3, 7):
        cel(ws, f"E{i}", f'=IFERROR(CHOOSE(WEEKDAY(D{i},2),{DIAS_SEMANA}),"")', alinhamento=CENTRO)

    cel(ws, "A8", "Conferência", NEGRITO, borda=False)
    cel(ws, "A9", "Visitas por unidade (deve dar 2 e 2):", borda=False)
    cel(ws, "D9", '=Parâmetros!$B$4&": "&COUNTIF($C$3:$C$6,Parâmetros!$B$4)&" | "&Parâmetros!$B$5&": "&COUNTIF($C$3:$C$6,Parâmetros!$B$5)', borda=False)
    cel(ws, "A10", "Visitas sorteadas em dias diferentes:", borda=False)
    cel(ws, "D10", '=IF(AND(ISNUMBER(D3),ISNUMBER(D4),D3<>D4),"sim","não")', borda=False)


def aba_registro(ws):
    ws.title = "Registro"
    cel(ws, "A1", "Registro do sorteio e das visitas (colar o sorteio como valores)", TITULO, borda=False)
    cel(ws, "A2", "Data do sorteio:", NEGRITO, borda=False)
    cel(ws, "B2", None, fill=AMARELO, formato="DD/MM/YYYY")
    titulos = ["Visita", "Tipo de visita", "Unidade", "Data", "Dia da semana", "Hora de início prevista",
               "Início", "Fim", "Nº NFC-e no início", "Nº NFC-e no fim", "Realizada? (sim/não)", "Observação"]
    cabecalho(ws, 4, titulos, [8, 22, 22, 12, 13, 13, 9, 9, 14, 14, 12, 40])
    for i in range(5, 9):
        for col in "ABCDEFGHIJKL":
            cel(ws, f"{col}{i}", None, fill=AMARELO)


def main():
    rng = random.Random(SEMENTE)
    sorteio_unidade = rng.random()
    wb = Workbook()
    aba_instrucoes(wb.active)
    aba_parametros(wb.create_sheet(), sorteio_unidade)
    fim = aba_dias_horas(wb.create_sheet(), rng)
    fim_ret = aba_retorno(wb.create_sheet())
    aba_sorteio(wb.create_sheet(), fim, fim_ret)
    aba_registro(wb.create_sheet())
    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    wb.save(OUT_PATH)
    print(f"OK: {OUT_PATH.name} - {fim - 2} combinações de dia e hora")


if __name__ == "__main__":
    main()
