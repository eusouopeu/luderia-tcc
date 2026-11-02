"""
Apêndices do TMin num .docx separado do trabalho principal.

Uso: python3 _src/extras/gerar_apendices_tmin.py textos/capitulos/TCC_luderia_TMin_v<n>.docx

Gera `textos/capitulos/TCC_luderia_TMin_apendices_v<n>.docx` (mesmo número de
versão do principal) com os apêndices citados no texto, na ordem de citação:
A (concorrentes do B1), B (contagem direta do B3), C (bases públicas do B4),
D (matriz de evidências), E (registro de premissas) e F (Monte Carlo). Os
números vêm dos dados e do modelo financeiro (`gerar_modelo_financeiro.py`),
não do texto. Estilos, rodapé e margens são copiados do .docx principal.

Toda vez que o principal mudar, rodar de novo: o script confere se o principal
cita exatamente os apêndices A a F e se os números-chave citados no texto
(concorrentes, premissas, P(VPL > 0)) batem com os dos apêndices; se não,
para com a lista das divergências (regra em `_instrucoes/1c_versoes.md`).
"""
import html
import re
import struct
import sys
import zipfile
from pathlib import Path

import pandas as pd

sys.path.insert(0, str(Path(__file__).resolve().parent))
import gerar_modelo_financeiro as g  # noqa: E402

ROOT = Path(__file__).resolve().parents[2]
B1 = ROOT / "dados" / "[B1] Estabelecimentos e cardapios"
B3 = ROOT / "dados" / "[B3] Contagem direta de ocupacao"
FIG_MC = ROOT / "textos" / "capitulos" / "figuras" / "9_monte_carlo.png"
LETRAS = "ABCDEF"


# --------------------------------------------------------------- formato
def brl(x, d=2):
    s = f"{abs(x):,.{d}f}".replace(",", "X").replace(".", ",").replace("X", ".")
    return ("-" if x < 0 and round(abs(x), d) else "") + s


def num(x):
    """Número sem casas inúteis: 6 → 6; 3,6 → 3,6; 4,37 → 4,37."""
    if float(x).is_integer():
        return brl(x, 0)
    return brl(x, 2).rstrip("0").rstrip(",")


def valor(x, unidade):
    if unidade.startswith("%"):
        return num(100 * x)
    if unidade.startswith("R$"):
        return brl(x)
    return num(x)


def unidade_rotulo(u):
    return {"1 com, 0 sem": "1 com, 0 sem"}.get(u, u)


# --------------------------------------------------------------- XML
esc = lambda s: s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
RPR = '<w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:eastAsia="Arial" w:cs="Arial"/>{b}<w:sz w:val="{sz}"/><w:szCs w:val="{sz}"/></w:rPr>'
B = lambda on: "<w:b/><w:bCs/>" if on else '<w:b w:val="0"/><w:bCs w:val="0"/>'
LIN = lambda v: 'w:val="single" w:sz="6" w:space="0" w:color="000000"' if v else 'w:val="nil" w:sz="0" w:space="0" w:color="FFFFFF"'
TBLPR = ('<w:tblPr><w:tblW w:w="9071" w:type="dxa"/><w:tblLook w:val="04A0" w:firstRow="1" w:lastRow="0" '
         'w:firstColumn="1" w:lastColumn="0" w:noHBand="0" w:noVBand="1"/></w:tblPr>')


def titulo(t):
    return ('<w:p><w:pPr><w:pStyle w:val="Title"/><w:keepNext/><w:pageBreakBefore/><w:spacing w:after="480" w:line="360" '
            'w:lineRule="auto"/><w:ind w:firstLine="0"/><w:jc w:val="left"/></w:pPr>'
            f'<w:r>{RPR.format(b=B(1), sz=24)}<w:t xml:space="preserve">{esc(t)}</w:t></w:r></w:p>')


def par(t):
    return ('<w:p><w:pPr><w:spacing w:after="284" w:line="360" w:lineRule="auto"/><w:ind w:firstLine="567"/><w:jc w:val="both"/></w:pPr>'
            f'<w:r>{RPR.format(b="", sz=24)}<w:t xml:space="preserve">{esc(t)}</w:t></w:r></w:p>')


def legenda(t):
    return ('<w:p><w:pPr><w:keepNext/><w:spacing w:before="240" w:after="0" w:line="240" w:lineRule="auto"/><w:jc w:val="center"/></w:pPr>'
            f'<w:r>{RPR.format(b=B(1), sz=20)}<w:t xml:space="preserve">{esc(t)}</w:t></w:r></w:p>')


def fonte(t, fim=True):
    return (f'<w:p><w:pPr><w:spacing w:before="0" w:after="{240 if fim else 0}" w:line="240" w:lineRule="auto"/><w:jc w:val="center"/></w:pPr>'
            f'<w:r>{RPR.format(b="", sz=20)}<w:t xml:space="preserve">{esc(t)}</w:t></w:r></w:p>')


def nota(t):
    return ('<w:p><w:pPr><w:spacing w:before="0" w:after="240" w:line="240" w:lineRule="auto"/><w:jc w:val="both"/></w:pPr>'
            f'<w:r>{RPR.format(b="", sz=20)}<w:t xml:space="preserve">{esc(t)}</w:t></w:r></w:p>')


def tabela(tipo, larg, linhas, jc, sz=20):
    """Tabela: só traços no topo, abaixo do cabeçalho e no fim; Quadro: todas as bordas (1d_formatacao.md)."""
    assert sum(larg) == 9071 and all(len(l) == len(larg) for l in linhas)
    out = TBLPR + "<w:tblGrid>" + "".join(f'<w:gridCol w:w="{w}"/>' for w in larg) + "</w:tblGrid>"
    n = len(linhas)
    for r, lin in enumerate(linhas):
        out += "<w:tr><w:trPr><w:cantSplit/>" + ("<w:tblHeader/>" if r == 0 else "") + "</w:trPr>"
        for c, (w, t) in enumerate(zip(larg, lin)):
            bd = dict(top=1, left=1, bottom=1, right=1) if tipo == "Quadro" else \
                dict(top=r == 0, left=0, bottom=r in (0, n - 1), right=0)
            al = "center" if r == 0 or t == "n.a." else jc[c]
            out += (f'<w:tc><w:tcPr><w:tcW w:w="{w}" w:type="dxa"/><w:tcBorders>'
                    + "".join(f"<w:{k} {LIN(bd[k])}/>" for k in ("top", "left", "bottom", "right"))
                    + '</w:tcBorders><w:tcMar><w:top w:w="40" w:type="dxa"/><w:left w:w="80" w:type="dxa"/>'
                    '<w:bottom w:w="40" w:type="dxa"/><w:right w:w="80" w:type="dxa"/></w:tcMar><w:vAlign w:val="center"/></w:tcPr>'
                    f'<w:p><w:pPr><w:spacing w:after="0" w:line="240" w:lineRule="auto"/><w:jc w:val="{al}"/></w:pPr>'
                    f'<w:r>{RPR.format(b=B(r == 0), sz=sz)}<w:t xml:space="preserve">{esc(str(t))}</w:t></w:r></w:p></w:tc>')
        out += "</w:tr>"
    return "<w:tbl>" + out + "</w:tbl>"


def figura(rid, png, descr):
    w, h = struct.unpack(">II", png.read_bytes()[16:24])
    cx = 4572000; cy = round(cx * h / w)  # 12,7 cm, para caber na página do texto
    return ('<w:p><w:pPr><w:keepNext/><w:spacing w:after="0"/><w:jc w:val="center"/></w:pPr><w:r><w:drawing>'
            f'<wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="{cx}" cy="{cy}"/><wp:effectExtent l="0" t="0" r="0" b="0"/>'
            f'<wp:docPr id="901" name="Figura 901" descr="{esc(descr)}"/><wp:cNvGraphicFramePr/>'
            '<a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic>'
            f'<pic:nvPicPr><pic:cNvPr id="0" name="{png.name}" descr="{esc(descr)}"/><pic:cNvPicPr><a:picLocks noChangeAspect="1" noChangeArrowheads="1"/></pic:cNvPicPr></pic:nvPicPr>'
            f'<pic:blipFill><a:blip r:embed="{rid}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill>'
            f'<pic:spPr bwMode="auto"><a:xfrm><a:off x="0" y="0"/><a:ext cx="{cx}" cy="{cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr>'
            '</pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>')


# --------------------------------------------------------------- dados
def dados():
    f = g.ler_fontes()
    prem = g.premissas(f)
    quadro = g.quadro_pessoal(f)
    folha = sum(q * s for _, _, q, s, _ in quadro)
    mc = g.monte_carlo(f, prem, folha, quadro)
    est = pd.read_excel(B1 / "estabelecimentos" / "B1_resumo_estabelecimentos.xlsx", sheet_name="estabelecimentos")
    vis = pd.read_csv(B3 / "contagem_resumo_visitas.csv", sep=";", encoding="utf-8-sig")
    vis = vis[vis["observador"] != "media"]
    notas = pd.read_csv(B3 / "contagem_notas_intervalo.csv", sep=";", encoding="utf-8-sig")
    return dict(f=f, prem=prem, quadro=quadro, mc=mc, est=est, vis=vis, notas=notas)


UNIDADE = {"BV": "Bela Vista", "PA": "Paralela"}


# --------------------------------------------------------------- apêndices
def apendice_a(d):
    est = d["est"]
    por = est.groupby("capital_endereco").size()
    lista = est.sort_values(["capital_endereco", "volume_avaliacoes"], ascending=[True, False])
    t2 = [["Concorrente", "Metrópole", "Nota (1 a 5)", "Avaliações"]] + [
        [r.nome, r.capital_endereco, num(r.avaliacao_media), brl(r.volume_avaliacoes, 0)] for r in lista.itertuples()]
    fonte_b1 = "Fonte: elaboração própria, com base no Bloco B1 (Google Places API, 09/2026 e 12/10/2026)."
    return [titulo("APÊNDICE A – CONCORRENTES DO BLOCO B1"),
            par(f"A busca pela Google Places API levantou 164 candidatos com mais de 100 avaliações nas 14 metrópoles da REGIC 2018 "
                f"e em suas regiões metropolitanas, e a curadoria manual aprovou {len(est)}. Cada concorrente pertence a uma única "
                f"metrópole: a capital da região metropolitana do seu endereço. {len(por)} das 14 metrópoles têm ao menos um concorrente, "
                "com a contagem por metrópole na Figura 5.2. A Tabela A.1 lista os concorrentes, com a nota e o número de avaliações no Google Maps."),
            legenda("Tabela A.1 – Concorrentes aprovados"),
            tabela("Tabela", [4271, 2300, 1300, 1200], t2, ["left", "left", "right", "right"], sz=18),
            fonte(fonte_b1)], dict(concorrentes=len(est))


def apendice_b(d):
    v = d["vis"].copy()
    v["mesas_ocupadas"] = v["ocupacao_mesas_media_pct"] / 100 * v["mesas_denominador"]
    t1 = [["Visita", "Unidade", "Horas observadas", "Grupos sentados", "Pessoas por grupo", "Permanência média (min)",
           "Mesas ocupadas em média", "Ocupação no pico (%)"]]
    for r in v.itertuples():
        t1.append([r.visita_inicio[:10].split("-")[2] + "/" + r.visita_inicio[5:7], UNIDADE[r.unidade], num(round(r.horas_observadas, 1)),
                   str(int(r.grupos_mesa)), num(round(r.tamanho_grupo_mesa, 1)), num(round(r.permanencia_mesa_media_min)),
                   num(round(r.mesas_ocupadas, 2)), num(round(r.ocupacao_mesas_pico_pct, 1))])
    n = d["notas"]
    t2 = [["Unidade", "De", "Até", "Dias", "NFC-e emitidas", "NFC-e por dia"]] + [
        [UNIDADE[r.unidade], r.de[8:10] + "/" + r.de[5:7] + " " + r.de[11:16], r.ate[8:10] + "/" + r.ate[5:7] + " " + r.ate[11:16],
         num(round(r.dias, 1)), str(int(r.notas_emitidas)), num(round(r.notas_por_dia, 1))] for r in n.itertuples()]
    return [titulo("APÊNDICE B – CONTAGEM DIRETA NA SÃO JOGUE (BLOCO B3)"),
            par(f"A contagem direta cobriu {len(v)} visitas às duas unidades da São Jogue, em noites de sexta e sábado de outubro de 2026. "
                "O observador fica sentado a uma mesa como cliente, e essa mesa sai dos registros e do denominador. Um aplicativo para "
                "Android, desenvolvido para o trabalho, grava a entrada e a saída de cada grupo, o número de pessoas, os jogos e as "
                "chamadas ao instrutor. A ocupação é a proporção das mesas ocupadas, calculada minuto a minuto, sobre 10 mesas na "
                "Bela Vista e 9 na Paralela (Tabela B.1)."),
            legenda("Tabela B.1 – Registros por visita"),
            tabela("Tabela", [800, 1171, 1050, 1050, 1050, 1350, 1300, 1300], t1, ["left", "left"] + ["right"] * 6),
            fonte("Fonte: elaboração própria, com base no Bloco B3 (10/10/2026 a 30/10/2026).", fim=False),
            nota("Nota: visita pela data de início. Mesas ocupadas em média = ocupação média × mesas da unidade; pessoas por grupo e "
                 "permanência só dos grupos sentados durante a visita."),
            par("As vendas fora das horas observadas vêm da numeração das notas fiscais. A NFC-e de uma compra do autor no início e no "
                "fim de cada visita dá o número da nota, e a diferença entre duas visitas da mesma unidade dá as notas emitidas no "
                "intervalo (Tabela B.2). Como nem toda venda gera nota, o valor é um piso."),
            legenda("Tabela B.2 – Notas fiscais emitidas entre visitas"),
            tabela("Tabela", [1771, 1800, 1800, 1000, 1350, 1350], t2, ["left", "left", "left", "right", "right", "right"]),
            fonte("Fonte: elaboração própria, com base no Bloco B3 (NFC-e da São Jogue, 10/10/2026 a 30/10/2026).")], {}


def apendice_c(d):
    q = [["Base", "Tabela ou série", "Recorte e referência", "Uso no plano"],
         ["IBGE, Censo 2022", "Agregados por bairro; SIDRA 9514", "Salvador, por bairro; 2022", "Matriz de bairros (seção 6.4)"],
         ["IBGE, Estimativas da população", "Estimativas de 2026", "Salvador; 2026", "Penetração da demanda"],
         ["IBGE, PNAD Contínua", "SIDRA 5436 e 7395", "Capitais; 2º trimestre de 2026", "Renda (seção 5.2)"],
         ["IBGE, POF 2017-2018", "SIDRA 6715 e 6972; perfil das despesas", "Brasil e Bahia; 2017-2018", "Gasto com lazer e alimentação fora (seções 5.1 e 5.5)"],
         ["IBGE, PAS", "SIDRA 2611, 2619 e 10758", "Brasil; 2023", "CMV de A&B (C01)"],
         ["IBGE, IPCA", "SIDRA 7060", "Brasil e Salvador; 12 meses até ago/2026", "Preços (Figura 5.4)"],
         ["MTE, Novo CAGED", "Admissões", "Salvador; ago/2025 a jul/2026", "Salários (Quadro 7.2; C06)"],
         ["Fipe, FipeZap", "Locação comercial", "Salvador; jul/2026", "Aluguel (C04)"],
         ["LC n. 123/2006", "Anexos I e III", "Vigentes em 2026", "Simples Nacional (seção 8.1)"],
         ["IBGE, CONCLA", "CNAE 2.3", "Subclasses; 2026", "Enquadramento (seção 8.1)"],
         ["BCB", "SGS 432, 1619 e 13522; Focus", "Brasil; Focus de 11/09/2026", "Taxa de desconto (M01)"]]
    s = pd.concat([d["f"]["simples"]["I"], d["f"]["simples"]["III"]])
    t2 = [["Anexo", "Faixa", "Receita bruta em 12 meses (R$)", "Alíquota nominal (%)", "Parcela a deduzir (R$)"]] + [
        [r.anexo, str(int(r.faixa)), f"{brl(r.rbt12_min)} a {brl(r.rbt12_max)}", num(r.aliquota_nominal_pct), brl(r.parcela_deduzir)]
        for r in s.itertuples()]
    t3 = [["Função", "CBO", "Pessoas", "Salário de admissão (R$)"]] + [
        [fn, cbo, str(n), brl(sal)] for fn, cbo, n, sal, _ in d["quadro"]]
    return [titulo("APÊNDICE C – TABELAS DE APOIO DAS BASES PÚBLICAS (BLOCO B4)"),
            par("O Bloco B4 reúne as bases públicas extraídas por inteiro, cada série com recorte e data de referência (Quadro C.1). "
                "As faixas do Simples Nacional (Tabela C.2) e os salários de admissão (Tabela C.3) entram direto no modelo financeiro."),
            legenda("Quadro C.1 – Séries das bases públicas usadas no plano"),
            tabela("Quadro", [2200, 2300, 2271, 2300], q, ["left"] * 4),
            fonte("Fonte: elaboração própria, com base no Bloco B4 (10/2026)."),
            legenda("Tabela C.2 – Faixas do Simples Nacional, anexos I e III"),
            tabela("Tabela", [900, 800, 3371, 1900, 2100], t2, ["center", "center", "right", "right", "right"]),
            fonte("Fonte: elaboração própria, com base na LC n. 123/2006 (anexos I e III)."),
            legenda("Tabela C.3 – Salários de admissão da equipe"),
            tabela("Tabela", [4371, 1200, 1200, 2300], t3, ["left", "center", "right", "right"]),
            fonte("Fonte: elaboração própria, com base no Novo CAGED (Salvador, admissões de 08/2025 a 07/2026, mediana).", fim=False),
            nota("Nota: recreador em todas as atividades e cozinheiro geral na CNAE 56; meio período proporcional a 20 h de 44 h.")], {}


def apendice_d(d):
    q = [["Decisão", "Pergunta", "Dado usado (premissas)", "Fonte", "Nível"],
         ["Bairro", "Onde está o público, longe da concorrência direta?", "Pessoas de 20 a 39 anos, apartamentos e densidade por bairro; endereço da São Jogue", "Censo 2022 (B4); B1", "N2 + N3"],
         ["Modelo de cobrança", "Como o mercado cobra a entrada?", "Taxa por dia e turno nos concorrentes; NFC-e da São Jogue", "B1; B3", "N3 + N5"],
         ["Taxa de entrada", "Quanto cobrar por pessoa?", "Couvert ou taxa de jogo de 22 casas (R06)", "B1", "N3"],
         ["Consumo", "Quanto cada pessoa consome?", "Cesta de 36 casas (R07); pessoas por cesta (R08)", "B1; autor", "N3 + N6"],
         ["Mesas e ocupação", "Quantas mesas e quantas ocupadas?", "Ocupação nas visitas (R01, R04); dia útil (R05)", "B3; autor", "N5 + N6"],
         ["Tamanho do grupo", "Quantas pessoas por mesa?", "Pessoas por mesa ocupada nas visitas (R02)", "B3", "N5 + N6"],
         ["Giro", "Quantas vezes a mesa vira por dia?", "NFC-e entre visitas e permanência (R15)", "B3", "N5"],
         ["Horário", "Em que dias e horas abrir?", "Horário de 49 concorrentes (R13, R14, R16, R17)", "B1", "N3"],
         ["Equipe", "Quantas pessoas e a que custo?", "Fluxo nas visitas; salário de admissão (C06); encargos (C07)", "B3; Novo CAGED (B4); CLT", "N5 + N2 + N1"],
         ["Acervo inicial", "Quais jogos e a que custo?", "Acervos de 30 concorrentes e preço nas lojas (I05)", "B1", "N3"],
         ["Ponto", "Quanto custa o ponto?", "Aluguel por m² (C04); área (C03)", "FipeZap (B4); autor", "N2 + N6"],
         ["Custo das mercadorias", "Qual o CMV do A&B?", "CMV dos serviços de alimentação (C01)", "PAS (B4)", "N2"],
         ["Regime tributário", "Qual a carga sobre a receita?", "Anexos I e III; CNAE", "LC n. 123/2006; CONCLA", "N1"],
         ["Taxa de desconto", "Qual o custo de oportunidade?", "Selic e IPCA projetados; prêmio de risco (M01)", "BCB (B4); autor", "N2 + N6"],
         ["Investimento", "Quanto custa abrir?", "Reforma, mobiliário, cozinha, informática e pré-operacionais (I01 a I04, I06)", "Autor", "N6"]]
    return [titulo("APÊNDICE D – MATRIZ DE EVIDÊNCIAS"),
            par("A matriz liga cada decisão do plano à pergunta que ela responde, ao dado usado, à fonte e ao nível de evidência, de N1, "
                "o mais confiável, a N6, a estimativa do autor (Quadro 3.1). Os códigos entre parênteses são as premissas do modelo "
                "financeiro, com faixa e justificativa no Apêndice E (Quadro D.1)."),
            legenda("Quadro D.1 – Matriz de evidências"),
            tabela("Quadro", [1500, 2000, 2771, 1800, 1000], q, ["left", "left", "left", "left", "center"]),
            fonte("Fonte: elaboração própria.")], {}


def apendice_e(d):
    linhas = [["ID", "Premissa (unidade)", "Pessimista", "Provável", "Otimista", "Fonte", "Nível"]]
    for p in d["prem"]:
        linhas.append([p["id"], f"{p['nome']} ({unidade_rotulo(p['unidade'])})", valor(p["pess"], p["unidade"]),
                       valor(p["prov"], p["unidade"]), valor(p["otim"], p["unidade"]), p["fonte"], p["nivel"]])
    return [titulo("APÊNDICE E – REGISTRO DE PREMISSAS"),
            par(f"O modelo do cap. 9 tem {len(d['prem'])} premissas, cada uma com faixa pessimista, provável e otimista, fonte e nível "
                "de evidência (Quadro E.1). O código diz o grupo: R, receita e demanda; C, custos; I, investimento; M, parâmetros do "
                "modelo. Nas unidades em %, os valores estão em pontos percentuais."),
            legenda("Quadro E.1 – Registro de premissas do modelo financeiro"),
            tabela("Quadro", [550, 2450, 1050, 1050, 1050, 2221, 700], linhas,
                   ["center", "left", "center", "center", "center", "left", "center"], sz=18),
            fonte("Fonte: elaboração própria, com base no modelo financeiro e nos Blocos B1, B3 e B4 (10/2026).")], \
        dict(premissas=len(d["prem"]))


def apendice_f(d):
    mc = d["mc"]
    pct = lambda x: num(round(100 * x, 1))
    t = [["Medida", "Valor"],
         ["Probabilidade de VPL > 0 (%)", pct(mc["prob_positivo"])],
         ["Erro padrão da probabilidade (pontos percentuais)", num(round(100 * mc["erro_prob"], 1))],
         ["VPL médio (R$)", brl(mc["media"], 0)],
         ["VPL, percentil 5 (R$)", brl(mc["p05"], 0)],
         ["VPL, percentil 10 (R$)", brl(mc["p10"], 0)],
         ["VPL, percentil 25 (R$)", brl(mc["p25"], 0)],
         ["VPL, mediana (R$)", brl(mc["mediana"], 0)],
         ["VPL, percentil 75 (R$)", brl(mc["p75"], 0)],
         ["VPL, percentil 90 (R$)", brl(mc["p90"], 0)],
         ["VPL, percentil 95 (R$)", brl(mc["p95"], 0)],
         ["Cenários com a etapa de mesas (%)", pct(mc["expansao"])],
         ["Cenários com o gatilho G5 (%)", pct(mc["g5"])],
         ["Cenários encerrados pelo gatilho G6 (%)", pct(mc["fechamento"])],
         ["Cenários com payback em até 5 anos (%)", pct(mc["payback_5anos"])],
         ["Payback descontado mediano (anos)", num(round(mc["payback_mediana"], 1))]]
    return [titulo("APÊNDICE F – SIMULAÇÃO DE MONTE CARLO"),
            par(f"A simulação sorteia {brl(g.N_SIMULACOES, 0)} cenários do modelo do cap. 9. Em cada cenário, toda premissa com faixa "
                "recebe um valor contínuo de uma distribuição PERT entre o pessimista e o otimista, com moda no provável: a PERT dá menos "
                "peso às pontas que a triangular. Há três exceções. As pessoas por mesa (R02) vão de 2 a 6. As mesas ocupadas no fim de "
                "semana (R04) representam a demanda e vão até 6,02, o maior valor das visitas, mesmo acima do que o salão comporta. A taxa "
                "mínima de atratividade fica no provável, 15%: o risco já está no fluxo de caixa, e sorteá-la contaria o risco duas vezes."),
            par("A simulação inclui as decisões de gestão do cap. 10. Se a demanda sorteada passa do salão, a luderia abre mais 2 mesas a "
                "partir do ano 2, com o mobiliário proporcional pago no fim do ano 1. Se o EBITDA de um ano, a partir do ano 2, fica "
                "negativo, o gatilho G5 corta o meio período e um cozinheiro no ano seguinte. Se o EBITDA segue negativo, o gatilho G6 "
                "encerra o negócio no fim desse ano, com a devolução da caução e do capital de giro e a revenda dos ativos (I09), sem valor "
                "residual. A semente é fixa, e o resultado se repete a cada execução."),
            par("As premissas são sorteadas de forma independente. A simulação mede o efeito conjunto das faixas melhor que os cenários "
                "extremos, que põem todas as premissas no mesmo lado ao mesmo tempo (Tabela F.1 e Figura F.1). Com 10 mil cenários, a "
                "probabilidade de VPL positivo tem erro padrão de 0,5 ponto percentual."),
            legenda("Tabela F.1 – Resultados da simulação de Monte Carlo"),
            tabela("Tabela", [6071, 3000], t, ["left", "right"]),
            fonte("Fonte: elaboração própria, com base no modelo financeiro (02/11/2026)."),
            legenda("Figura F.1 – Distribuição do VPL na simulação de Monte Carlo"),
            figura("rIdApF1", FIG_MC, "Figura F.1 – Distribuição do VPL na simulação de Monte Carlo"),
            fonte("Fonte: elaboração própria, com base no modelo financeiro (02/11/2026).")], dict(prob=pct(mc["prob_positivo"]))


# --------------------------------------------------------------- conferência com o principal
def confere(texto, chaves):
    erros = []
    citadas = sorted(set(re.findall(r"Apêndices? ([A-Z])\b", texto)))
    if citadas != list(LETRAS):
        erros.append(f"o principal cita os apêndices {citadas}, e o arquivo de apêndices tem {list(LETRAS)}")
    if "Apêndice [" in texto:
        erros.append("o principal ainda tem 'Apêndice [letra]'")
    for rotulo, padrao, valor_ in (("concorrentes", r"aprovou (\d+)", str(chaves["concorrentes"])),
                                   ("premissas", r"modelo tem (\d+) premissas", str(chaves["premissas"])),
                                   ("P(VPL > 0)", r"positivo em ([\d,]+)% d", chaves["prob"])):
        achados = set(re.findall(padrao, texto))
        if achados and achados != {valor_}:
            erros.append(f"{rotulo}: texto {sorted(achados)} × apêndice {valor_}")
    return erros


def main():
    principal = Path(sys.argv[1])
    versao = re.search(r"_v(\d+)\.docx$", principal.name).group(1)
    saida = principal.with_name(f"TCC_luderia_TMin_apendices_v{versao}.docx")
    z = zipfile.ZipFile(principal)
    x = z.read("word/document.xml").decode()
    i_body = x.find("<w:body>") + len("<w:body>")
    sect = x[x.rfind("<w:sectPr"):x.rfind("</w:body>")]
    texto = html.unescape(" ".join(re.findall(r"<w:t[^>]*>([^<]*)</w:t>", x[:x.rfind("REFERÊNCIAS")])))

    d = dados()
    corpo, chaves = [], {}
    for fn in (apendice_a, apendice_b, apendice_c, apendice_d, apendice_e, apendice_f):
        els, ch = fn(d)
        corpo += els; chaves.update(ch)
    erros = confere(texto, chaves)
    if erros:
        raise SystemExit("Principal e apêndices divergem:\n- " + "\n- ".join(erros))
    corpo[0] = corpo[0].replace("<w:pageBreakBefore/>", "")
    doc = x[:i_body] + "".join(corpo) + sect + "</w:body></w:document>"

    rels = re.sub(r'<Relationship [^>]*Target="(?:media/|comments)[^>]*/>', "", z.read("word/_rels/document.xml.rels").decode())
    rels = rels.replace("</Relationships>", '<Relationship Id="rIdApF1" Type="http://schemas.openxmlformats.org/officeDocument/2006/'
                                            f'relationships/image" Target="media/{FIG_MC.name}"/></Relationships>')
    with zipfile.ZipFile(saida, "w", zipfile.ZIP_DEFLATED) as zo:
        for item in z.infolist():
            if item.filename.startswith("word/media/") or item.filename.startswith("word/comments"):
                continue
            dado = z.read(item.filename)
            if item.filename == "word/document.xml":
                dado = doc.encode()
            elif item.filename == "word/_rels/document.xml.rels":
                dado = rels.encode()
            elif item.filename == "[Content_Types].xml":
                dado = re.sub(rb'<Override PartName="/word/comments[^>]*/>', b"", dado)
            zo.writestr(item, dado)
        zo.write(FIG_MC, f"word/media/{FIG_MC.name}")
    print(f"OK: {saida.name}; conferência com {principal.name} sem divergência ({chaves})")


if __name__ == "__main__":
    main()
