"""
Bloco D - planilha de sorteio das visitas da contagem direta de ocupação.

Desenho decidido pelo autor em 18/09/2026 (substitui o de 17/09/2026):
  - 4 visitas no total, 2 em cada unidade da São Jogue.
  - Só as 2 primeiras visitas são sorteadas, ambas na quinzena pós-pagamento:
    de 29/09/2026 (1º dia de pagamento de setembro dos servidores estaduais da
    Bahia; ativos recebem em 30/09) a 13/10/2026. Uma visita em dia útil
    (segunda a quinta) e uma no fim de semana (sexta a domingo). Feriados ficam
    fora (12/10). Um sorteio decide qual unidade fica com o dia útil.
  - As 2 visitas de retorno ocorrem 15 dias depois da visita sorteada, na
    mesma unidade. Caem entre 14/10 e 28/10 (quinzena pré-pagamento, até a
    véspera do pagamento de outubro, 29/10). Se a unidade estiver fechada no
    dia de retorno, a visita passa para o dia seguinte de funcionamento.
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
PAGAMENTO = date(2026, 9, 29)     # 1º dia de pagamento de setembro (inativos e pensionistas)
DIAS_QUINZENA = 15
FIM = date(2026, 10, 28)          # véspera do pagamento de outubro (29/10)
DIAS_RETORNO = 15                 # intervalo entre a visita sorteada e a de retorno
FERIADOS = [(date(2026, 10, 12), "Nossa Senhora Aparecida (nacional)")]
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
        ("2. Na aba Datas, marque \"não\" nas colunas amarelas de cada unidade para os dias em que ela não abre. "
         "Faça isso ANTES de abrir a aba Sorteio: mudar a lista depois de ver o resultado invalida o sorteio.", FONTE),
        ("3. A aba Sorteio mostra as 2 visitas sorteadas e as 2 de retorno. Se um dia sorteado for marcado como fechado, "
         "a fórmula passa para o próximo da ordem; se o dia de retorno estiver fechado, passa para o dia seguinte de funcionamento.", FONTE),
        ("4. Registre o resultado final: copie a aba Sorteio e cole como valores na aba Registro, com a data do sorteio.", FONTE),
        ("", FONTE),
        ("Regras do sorteio", NEGRITO),
        ("• 4 visitas no total, 2 por unidade: 1 sorteada e 1 de retorno.", FONTE),
        ("• Visitas sorteadas na quinzena pós-pagamento (29/09 a 13/10/2026): 1 em dia útil (segunda a quinta) "
         "e 1 no fim de semana (sexta a domingo). Feriados excluídos. Um número sorteado define qual unidade fica com o dia útil.", FONTE),
        ("• Visita de retorno: 15 dias depois da sorteada, na mesma unidade, dentro da quinzena pré-pagamento (14/10 a 28/10/2026). "
         "Como 15 dias não são semanas inteiras, o dia da semana do retorno é o seguinte ao da visita sorteada.", FONTE),
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
        ("1º dia de pagamento de setembro", PAGAMENTO, "Inativos e pensionistas (ativos: 30/09)", None, AZUL, "DD/MM/YYYY"),
        ("Dias por quinzena", DIAS_QUINZENA, "Quinzena pós-pagamento começa no dia do pagamento", None, AZUL, "0"),
        ("Último dia da quinzena pré-pagamento", FIM, "Véspera do pagamento de outubro (29/10)", None, AZUL, "DD/MM/YYYY"),
        ("Semente dos números aleatórios", SEMENTE, "Mesma do registro prévio", None, AZUL, "0"),
        ("Número sorteado para as unidades", sorteio_unidade,
         "< 0,5: unidade 1 fica com o dia útil; ≥ 0,5: unidade 2", None, AZUL, "0.0000"),
        ("Dias até a visita de retorno", DIAS_RETORNO, "Contados a partir da visita sorteada", None, AZUL, "0"),
    ]
    for i, (rotulo, valor, obs, fill, fonte, formato) in enumerate(linhas, start=4):
        cel(ws, f"A{i}", rotulo)
        cel(ws, f"B{i}", valor, fonte, CENTRO, fill, formato)
        cel(ws, f"C{i}", obs)

    cel(ws, "A14", "Feriados no período", NEGRITO, borda=False)
    for ref, t in [("A15", "Feriado"), ("B15", "Data")]:
        cel(ws, ref, t, NEGRITO, CENTRO, CINZA)
    for i, (dia, nome) in enumerate(FERIADOS, start=16):
        cel(ws, f"A{i}", nome, AZUL)
        cel(ws, f"B{i}", dia, AZUL, CENTRO, formato="DD/MM/YYYY")
    return 16, 15 + len(FERIADOS)


# Unidade que fica com cada tipo de dia, conforme o número sorteado (Parâmetros!B10).
UNIDADE_UTIL = "IF(Parâmetros!$B$10<0.5,Parâmetros!$B$4,Parâmetros!$B$5)"
UNIDADE_FDS = "IF(Parâmetros!$B$10<0.5,Parâmetros!$B$5,Parâmetros!$B$4)"


def aba_datas(ws, rng, fer_ini, fer_fim):
    ws.title = "Datas"
    cel(ws, "A1", "Dias do período", TITULO, borda=False)
    titulos = ["Número aleatório", "Data", "Dia da semana", "Tipo de dia", "Quinzena", "Feriado?",
               "Unidade 1 aberta?", "Unidade 2 aberta?", "Unidade que visita neste tipo de dia",
               "Elegível para o sorteio?", "Ordem no tipo de dia"]
    cabecalho(ws, 2, titulos, [12, 12, 13, 24, 16, 10, 12, 12, 22, 12, 11])
    ws.freeze_panes = "A3"

    linha = 3
    dia = PAGAMENTO
    while dia <= FIM:
        i = linha
        cel(ws, f"A{i}", rng.random(), AZUL, CENTRO, formato="0.0000")
        cel(ws, f"B{i}", dia, AZUL, CENTRO, formato="DD/MM/YYYY")
        cel(ws, f"C{i}", f'=CHOOSE(WEEKDAY(B{i},2),"segunda","terça","quarta","quinta","sexta","sábado","domingo")', alinhamento=CENTRO)
        cel(ws, f"D{i}", f'=IF(WEEKDAY(B{i},2)<=4,"{TIPOS[0]}","{TIPOS[1]}")', alinhamento=CENTRO)
        cel(ws, f"E{i}", f"=IF(B{i}<Parâmetros!$B$6+Parâmetros!$B$7,\"{QUINZENAS[0]}\",\"{QUINZENAS[1]}\")", VERDE, CENTRO)
        cel(ws, f"F{i}", f'=IF(COUNTIF(Parâmetros!$B${fer_ini}:$B${fer_fim},B{i})>0,"sim","não")', VERDE, CENTRO)
        cel(ws, f"G{i}", "sim", FONTE, CENTRO, AMARELO)
        cel(ws, f"H{i}", "sim", FONTE, CENTRO, AMARELO)
        cel(ws, f"I{i}", f'=IF(D{i}="{TIPOS[0]}",{UNIDADE_UTIL},{UNIDADE_FDS})', VERDE, CENTRO)
        cel(ws, f"J{i}",
            f'=IF(AND(E{i}="{QUINZENAS[0]}",F{i}="não",IF(I{i}=Parâmetros!$B$4,G{i},H{i})="sim"),"sim","não")',
            alinhamento=CENTRO)
        linha += 1
        dia += timedelta(days=1)
    fim = linha - 1
    for i in range(3, fim + 1):
        cel(ws, f"K{i}",
            f'=IF(J{i}="sim",COUNTIFS($D$3:$D${fim},D{i},$J$3:$J${fim},"sim",$A$3:$A${fim},"<="&A{i}),"")',
            alinhamento=CENTRO)
    dv = DataValidation(type="list", formula1='"sim,não"', allow_blank=False)
    ws.add_data_validation(dv)
    dv.add(f"G3:H{fim}")
    return fim


def aba_sorteio(ws, fim):
    ws.title = "Sorteio"
    cel(ws, "A1", "Resultado do sorteio: 2 visitas sorteadas e 2 de retorno", TITULO, borda=False)
    titulos = ["Visita", "Tipo de visita", "Quinzena", "Unidade", "Data", "Dia da semana", "Tipo de dia"]
    cabecalho(ws, 2, titulos, [8, 22, 16, 22, 12, 13, 24])
    r = lambda col: f"Datas!${col}$3:${col}${fim}"

    # Visitas 1 e 2: sorteadas (ordem 1 no tipo de dia, entre os dias elegíveis).
    for n, (tipo, unidade) in enumerate([(TIPOS[0], UNIDADE_UTIL), (TIPOS[1], UNIDADE_FDS)], start=1):
        i = n + 2
        linha_escolhida = f'MATCH(1,INDEX(({r("D")}="{tipo}")*({r("K")}=1),0),0)'
        cel(ws, f"A{i}", n, AZUL, CENTRO)
        cel(ws, f"B{i}", "Sorteada", AZUL, CENTRO)
        cel(ws, f"C{i}", QUINZENAS[0], AZUL, CENTRO)
        cel(ws, f"D{i}", f"={unidade}", VERDE, CENTRO)
        cel(ws, f"E{i}", f'=IFERROR(INDEX({r("B")},{linha_escolhida}),"sem dia elegível")', VERDE, CENTRO, formato="DD/MM/YYYY")

    # Visitas 3 e 4: retorno na mesma unidade, no 1º dia aberto a partir de sorteada + 15 dias.
    for n, origem in [(3, 3), (4, 4)]:
        i = n + 2
        alvo = f"(E{origem}+Parâmetros!$B$11)"
        aberta = (f'((D{i}=Parâmetros!$B$4)*({r("G")}="sim")+(D{i}<>Parâmetros!$B$4)*({r("H")}="sim"))')
        linha_retorno = f'MATCH(1,INDEX(({r("B")}>={alvo})*({r("F")}="não")*{aberta},0),0)'
        cel(ws, f"A{i}", n, AZUL, CENTRO)
        cel(ws, f"B{i}", f"Retorno da visita {origem - 2}", AZUL, CENTRO)
        cel(ws, f"C{i}", QUINZENAS[1], AZUL, CENTRO)
        cel(ws, f"D{i}", f"=D{origem}", alinhamento=CENTRO)
        cel(ws, f"E{i}", f'=IFERROR(INDEX({r("B")},{linha_retorno}),"sem dia de retorno")', VERDE, CENTRO, formato="DD/MM/YYYY")

    for i in range(3, 7):
        cel(ws, f"F{i}", f'=IFERROR(CHOOSE(WEEKDAY(E{i},2),"segunda","terça","quarta","quinta","sexta","sábado","domingo"),"")', alinhamento=CENTRO)
        cel(ws, f"G{i}", f'=IFERROR(IF(WEEKDAY(E{i},2)<=4,"{TIPOS[0]}","{TIPOS[1]}"),"")', alinhamento=CENTRO)

    cel(ws, "A8", "Conferência", NEGRITO, borda=False)
    cel(ws, "A9", "Visitas por unidade (deve dar 2 e 2):", borda=False)
    cel(ws, "D9", '=Parâmetros!$B$4&": "&COUNTIF($D$3:$D$6,Parâmetros!$B$4)&" | "&Parâmetros!$B$5&": "&COUNTIF($D$3:$D$6,Parâmetros!$B$5)', borda=False)
    cel(ws, "A10", "Retornos dentro do período (até 28/10):", borda=False)
    cel(ws, "D10", '=IF(AND(ISNUMBER(E5),ISNUMBER(E6),MAX(E5:E6)<=Parâmetros!$B$8),"sim","não")', borda=False)


def aba_registro(ws):
    ws.title = "Registro"
    cel(ws, "A1", "Registro do sorteio e das visitas (colar o sorteio como valores)", TITULO, borda=False)
    cel(ws, "A2", "Data do sorteio:", NEGRITO, borda=False)
    cel(ws, "B2", None, fill=AMARELO, formato="DD/MM/YYYY")
    titulos = ["Visita", "Tipo de visita", "Quinzena", "Unidade", "Data", "Dia da semana", "Tipo de dia",
               "Início", "Fim", "Nº NFC-e no início", "Nº NFC-e no fim", "Realizada? (sim/não)", "Observação"]
    cabecalho(ws, 4, titulos, [8, 22, 16, 22, 12, 13, 24, 9, 9, 14, 14, 12, 40])
    for i in range(5, 9):
        for col in "ABCDEFGHIJKLM":
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
    print(f"OK: {OUT_PATH.name} - {fim - 2} dias no período")


if __name__ == "__main__":
    main()
