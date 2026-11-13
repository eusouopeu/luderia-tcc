"""
Apêndices do TMin num .docx separado do trabalho principal.

Uso: python3 _src/outros/G4_textos/gerar_apendices_tmin.py textos/TCC_luderia_v<n>.docx

Acrescenta ao fim do próprio .docx principal, depois das referências (9 de novembro de 2026: texto e apêndices num só
documento, pedido da orientação; antes, um .docx separado), os apêndices citados no texto, na ordem de citação:
A (concorrentes do B1), B (contagem direta do B3), C (bases públicas do B4),
D (matriz de evidências), E (registro de premissas), F (análise de conteúdo
das avaliações do B2) e G (Monte Carlo). Os números vêm dos dados e do modelo
financeiro (`gerar_modelo_financeiro.py`), não do texto; os do F, das saídas de
`_src/pyScripts/B2_Avaliacoes/3_analise/B2a_temas_grade2.py`. Estilos, rodapé e margens são os do .docx principal.

Toda vez que o principal mudar, rodar de novo: o script confere se o principal
cita exatamente os apêndices A a G e se os números-chave citados no texto
(concorrentes, premissas, P(VPL > 0)) batem com os dos apêndices; se não,
para com a lista das divergências (regra em `_docs/_instrucoes/1c_versoes.md`).
"""
import html
import json
import re
import struct
import sys
import zipfile
from pathlib import Path

import pandas as pd

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "outros" / "G3_modelo_financeiro"))
import gerar_modelo_financeiro as g  # noqa: E402

ROOT = Path(__file__).resolve().parents[3]
B3 = ROOT / "dados" / "B3_contagem" / "_dados-agregados"
B2 = ROOT / "dados" / "B2_avaliacoes" / "_dados-agregados" / "analise_conteudo"
FIG_MC = ROOT / "textos" / "graficos" / "G-1_monte_carlo.png"
LETRAS = "ABCDEFG"
DATA_MODELO = "9 de novembro de 2026"  # versão do modelo financeiro de que saem os apêndices E e G


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
    return ('<w:p><w:pPr><w:pStyle w:val="Title"/><w:keepNext/><w:pageBreakBefore/><w:spacing w:after="0" w:line="360" '
            'w:lineRule="auto"/><w:ind w:firstLine="0"/><w:jc w:val="left"/></w:pPr>'
            f'<w:r>{RPR.format(b=B(1), sz=24)}<w:t xml:space="preserve">{esc(t)}</w:t></w:r></w:p>') + branco(12)  # todo apêndice abre com texto


def branco(pt=12, keep=False):
    """Linha em branco de espaçamento simples, com a altura do corpo `pt`: separa os blocos no lugar do
    espaçamento antes e depois do parágrafo (_docs/_instrucoes/1d_formatacao.md, 13 de novembro de 2026)."""
    return (f'<w:p><w:pPr>{"<w:keepNext/>" if keep else ""}<w:spacing w:before="0" w:after="0" w:line="240" w:lineRule="auto"/>'
            f'<w:ind w:firstLine="0"/><w:rPr><w:sz w:val="{pt * 2}"/><w:szCs w:val="{pt * 2}"/></w:rPr></w:pPr></w:p>')


def par(t):
    return ('<w:p><w:pPr><w:spacing w:before="0" w:after="0" w:line="360" w:lineRule="auto"/><w:ind w:firstLine="567"/><w:jc w:val="both"/></w:pPr>'
            f'<w:r>{RPR.format(b="", sz=24)}<w:t xml:space="preserve">{esc(t)}</w:t></w:r></w:p>' + branco(6))


def legenda(t):
    return branco(12, keep=True) + ('<w:p><w:pPr><w:keepNext/><w:spacing w:before="0" w:after="0" w:line="240" w:lineRule="auto"/><w:jc w:val="center"/></w:pPr>'
            f'<w:r>{RPR.format(b=B(1), sz=20)}<w:t xml:space="preserve">{esc(t)}</w:t></w:r></w:p>')


def fonte(t, fim=True):
    return (f'<w:p><w:pPr><w:spacing w:before="0" w:after="0" w:line="240" w:lineRule="auto"/><w:jc w:val="center"/></w:pPr>'
            f'<w:r>{RPR.format(b="", sz=20)}<w:t xml:space="preserve">{esc(t)}</w:t></w:r></w:p>') + (branco(12) if fim else "")


def nota(t):
    return ('<w:p><w:pPr><w:spacing w:before="0" w:after="0" w:line="240" w:lineRule="auto"/><w:jc w:val="both"/></w:pPr>'
            f'<w:r>{RPR.format(b="", sz=20)}<w:t xml:space="preserve">{esc(t)}</w:t></w:r></w:p>') + branco(12)


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
    det = g.pessoal_detalhe(quadro)  # remuneração com os adicionais da escala, como no modelo
    folha = sum(q * det[cargo]["remuneracao"] for cargo, _, q, _, _ in quadro)
    # etapa de mesas no Monte Carlo, como no main() do modelo
    q_exp = g.quadro_pessoal(f, "expansao")
    d_exp = g.pessoal_detalhe(q_exp, "expansao")
    f["exp"] = dict(R01=6 + g.MC_EXPANSAO, R15=f["r15_exp"], R16=3, C15=g.refeicoes_mes("expansao"),
                    folha=sum(q * d_exp[c]["remuneracao"] for c, _, q, _, _ in q_exp))
    f["exp_quadro"] = {c: q for c, _, q, _, _ in q_exp}
    mc = g.monte_carlo(f, prem, folha, quadro)
    est = pd.read_excel(ROOT / "dados" / "B1_estabelecimentos" / "_dados-agregados" / "B1_resumo_estabelecimentos.xlsx", sheet_name="estabelecimentos")
    vis = pd.read_csv(B3 / "contagem_resumo_visitas.csv", sep=";", encoding="utf-8-sig")
    vis = vis[vis["observador"] != "media"]
    notas = pd.read_csv(B3 / "contagem_notas_intervalo.csv", sep=";", encoding="utf-8-sig")
    temas = pd.read_csv(B2 / "B2_temas_frequencia.csv", sep=";", encoding="utf-8-sig")
    kappa = pd.read_csv(B2 / "B2_recodificacao_kappa.csv", sep=";", encoding="utf-8-sig")
    ctx = pd.read_csv(B2 / "B2_temas_contexto.csv", sep=";", encoding="utf-8-sig")
    return dict(f=f, prem=prem, quadro=quadro, mc=mc, est=est, vis=vis, notas=notas, temas=temas, kappa=kappa, ctx=ctx)


UNIDADE = {"BV": "Bela Vista", "PA": "Paralela"}


# --------------------------------------------------------------- apêndices
def taxas_entrada():
    """Tabela A.2: taxa de entrada dos concorrentes que a divulgam (saiu do cap. 6 para o apêndice)."""
    pasta = ROOT / "dados" / "B1_estabelecimentos" / "_dados-agregados"
    ta = pd.read_csv(pasta / "B1_taxa_entrada_concorrentes.csv", sep=";", encoding="utf-8-sig", dtype=str)
    notas = json.loads((pasta / "B1_taxa_entrada_concorrentes_notas.json").read_text(encoding="utf-8"))
    linhas = [["Concorrente", "Capital", "Dia útil", "Fim de semana"]] + ta.values.tolist()
    return [par("A Tabela A.2 traz a taxa de entrada de cada concorrente que a divulga, usada no preço da luderia (seção 6.3)."),
            legenda("Tabela A.2 – Taxa de entrada por pessoa nos concorrentes que a divulgam (R$)"),
            tabela("Tabela", [3071, 2300, 1800, 1900], linhas, ["left", "left", "right", "right"], sz=18),
            fonte(notas["fonte"], fim=False), nota("Nota: " + notas["nota"].replace("em negrito, a São Jogue", "São Jogue"))]


def termos_busca(est):
    """Termos da busca na Google Places API, só com os candidatos do recorte da busca inicial nas 14 capitais (164 com mais de 100
    avaliações) e os aprovados. Um estabelecimento pode ser achado por vários termos: as linhas não somam."""
    import collections
    cur = pd.read_csv(ROOT / "dados" / "B1_estabelecimentos" / "_dados-agregados" / "2_recorte" / "B1_curadoria_metro_f_av100.csv", sep=None, engine="python",
                      encoding="utf-8-sig")
    brutos = pd.read_csv(ROOT / "dados" / "B1_estabelecimentos" / "_dados-brutos" / "B1_candidatos.csv", encoding="utf-8-sig")
    rec, apr = set(cur.place_id), set(est.place_id)
    achados = collections.defaultdict(set)
    for r in brutos.itertuples():
        achados[r.termo_busca].add(r.place_id)
    linhas = sorted(((t, len(s & rec), len(s & apr)) for t, s in achados.items()), key=lambda x: (-x[1], x[0]))
    todos = set().union(*achados.values())
    assert rec <= todos and len(rec) == 164
    q = [["Termo de busca", "Candidatos do recorte", "Aprovados"]] + [[t, str(c), str(a)] for t, c, a in linhas]
    q.append(["Estabelecimentos distintos (as linhas se sobrepõem)", str(len(rec & todos)), str(len(apr & todos))])
    return q, len(achados), brutos.capital_busca.nunique(), sorted(est[~est.place_id.isin(todos)].nome)


def apendice_a(d):
    est = d["est"]
    por = est.groupby("capital_endereco").size()
    lista = est.sort_values(["capital_endereco", "volume_avaliacoes"], ascending=[True, False])
    t2 = [["Concorrente", "Metrópole", "Nota (1 a 5)", "Avaliações"]] + [
        [r.nome, r.capital_endereco, num(r.avaliacao_media), brl(r.volume_avaliacoes, 0)] for r in lista.itertuples()]
    fonte_b1 = "Fonte: elaborado pelo próprio autor, com base no Bloco B1 (Google Places API, setembro a 12 de novembro de 2026)."
    q1, n_termos, n_cap, sem_termo = termos_busca(est)
    return [titulo("APÊNDICE A – CONCORRENTES DO BLOCO B1"),
            par(f"A busca inicial pela Google Places API levantou 164 candidatos com mais de 100 avaliações nas 14 capitais metropolitanas "
                f"da REGIC 2018 e em suas regiões metropolitanas; uma segunda rodada de buscas, em novembro de 2026, somou candidatos e a região "
                f"metropolitana de Campinas, a 15ª metrópole, e a curadoria manual aprovou {len(est)}. Cada concorrente pertence a uma única "
                f"metrópole: a da região metropolitana do seu endereço. {len(por)} das 15 metrópoles têm ao menos um concorrente, "
                "com a contagem por metrópole na Figura 5.1. A busca cruzou "
                f"{n_termos} termos com {n_cap} capitais (Quadro A.1). A Tabela A.1 lista os concorrentes, com a nota e o número de avaliações no Google Maps."),
            legenda("Quadro A.1 – Termos da busca na Google Places API"),
            tabela("Quadro", [4871, 2300, 1900], q1, ["left", "right", "right"], sz=18),
            fonte(fonte_b1, fim=False),
            nota(f"Nota: contagens só dos 164 candidatos do recorte da busca inicial (mais de 100 avaliações) e dos {len(est)} aprovados. "
                 "Um estabelecimento pode ser achado por vários termos, então as linhas não somam o total. "
                 + (f"{len(sem_termo)} aprovados não foram retornados por nenhum termo e entraram pelo Acervo de Jogos ou pela segunda rodada de buscas: "
                    + ", ".join(sem_termo) + "." if sem_termo else "")),
            legenda("Tabela A.1 – Concorrentes aprovados"),
            tabela("Tabela", [4271, 2300, 1300, 1200], t2, ["left", "left", "right", "right"], sz=18),
            fonte(fonte_b1)] + taxas_entrada(), dict(concorrentes=len(est))


def apendice_b(d):
    v = d["vis"].copy()
    v["mesas_ocupadas"] = v["ocupacao_mesas_media_pct"] / 100 * v["mesas_denominador"]
    t1 = [["Visita", "Unidade", "Horas observadas", "Circulação na entrada (pessoas por hora)", "Grupos sentados", "Pessoas por grupo",
           "Permanência média (min)", "Mesas ocupadas em média", "Ocupação no pico (%)"]]
    for r in v.itertuples():
        t1.append([r.visita_inicio[:10].split("-")[2] + "/" + r.visita_inicio[5:7], UNIDADE[r.unidade], num(round(r.horas_observadas, 1)),
                   brl(r.pessoas_por_hora), str(int(r.grupos_mesa)), num(round(r.tamanho_grupo_mesa, 1)),
                   num(round(r.permanencia_mesa_media_min)), num(round(r.mesas_ocupadas, 2)), num(round(r.ocupacao_mesas_pico_pct, 1))])
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
            tabela("Tabela", [800, 1071, 900, 1200, 900, 900, 1100, 1100, 1100], t1, ["left", "left"] + ["right"] * 7),
            fonte("Fonte: elaborado pelo próprio autor, com base no Bloco B3 (10 a 30 de outubro de 2026).", fim=False),
            nota("Nota: visita pela data de início. Circulação: pessoas que entraram pela porta ÷ horas observadas, sem quem já estava "
                 "dentro na chegada (Tabela 3.1). Mesas ocupadas em média = ocupação média × mesas da unidade; pessoas por grupo e "
                 "permanência só dos grupos sentados durante a visita."),
            par("As vendas fora das horas observadas vêm da numeração das notas fiscais. A NFC-e de uma compra do autor no início e no "
                "fim de cada visita dá o número da nota, e a diferença entre duas visitas da mesma unidade dá as notas emitidas no "
                "intervalo (Tabela B.2). Como a nota só sai a pedido do cliente, o valor é um piso das vendas, e não uma contagem de clientes: "
                "o número de pessoas por nota não foi medido."),
            legenda("Tabela B.2 – Notas fiscais emitidas entre visitas"),
            tabela("Tabela", [1771, 1800, 1800, 1000, 1350, 1350], t2, ["left", "left", "left", "right", "right", "right"]),
            fonte("Fonte: elaborado pelo próprio autor, com base no Bloco B3 (NFC-e da São Jogue, 10 a 30 de outubro de 2026).")], {}


def apendice_c(d):
    q = [["Base", "Tabela ou série", "Recorte e referência", "Uso no plano"],
         ["IBGE, Censo 2022", "Agregados por bairro; SIDRA 9514", "Salvador, por bairro; 2022", "Densidade da matriz de bairros (seção 6.4)"],
         ["UFBA, QUALISalvador", "IQUASalvador: IISU e renda familiar per capita", "160 bairros; 2018-2020", "Matriz de bairros (seção 6.4)"],
         ["IBGE, Estimativas da população", "Estimativas de 2026", "Salvador; 2026", "Penetração da demanda"],
         ["IBGE, PNAD Contínua", "SIDRA 5436 e 7395", "Capitais; 2º trimestre de 2026", "Renda (seção 5.2)"],
         ["IBGE, POF 2017-2018", "SIDRA 6715 e 6972; perfil das despesas", "Brasil e Bahia; 2017-2018", "Gasto com lazer e alimentação fora (seções 5.1 e 5.5)"],
         ["IBGE, PAS", "SIDRA 2611, 2619 e 10758", "Brasil; 2023", "CMV de A&B (C01)"],
         ["IBGE, IPCA", "SIDRA 7060", "Brasil e Salvador; 12 meses até agosto de 2026", "Preços (Figura 5.3)"],
         ["MTE, Novo CAGED", "Admissões", "Salvador; agosto de 2025 a julho de 2026", "Salários (Quadro 7.2; C06)"],
         ["Fipe, FipeZap", "Locação comercial", "Salvador; julho de 2026", "Aluguel (C04)"],
         ["LC n. 123/2006", "Anexos I e III", "Vigentes em 2026", "Simples Nacional (seção 8.1)"],
         ["IBGE, CONCLA", "CNAE 2.3", "Subclasses; 2026", "Enquadramento (seção 8.1)"],
         ["BCB", "SGS 432, 1619 e 13522; Focus", "Brasil; Focus de 11 de setembro de 2026", "Taxa de desconto (M01)"]]
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
            fonte("Fonte: elaborado pelo próprio autor, com base no Bloco B4 (outubro de 2026)."),
            legenda("Tabela C.2 – Faixas do Simples Nacional, anexos I e III"),
            tabela("Tabela", [900, 800, 3371, 1900, 2100], t2, ["center", "center", "right", "right", "right"]),
            fonte("Fonte: elaborado pelo próprio autor, com base na LC n. 123/2006 (anexos I e III)."),
            legenda("Tabela C.3 – Salários de admissão da equipe"),
            tabela("Tabela", [4371, 1200, 1200, 2300], t3, ["left", "center", "right", "right"]),
            fonte("Fonte: elaborado pelo próprio autor, com base no Novo CAGED (Salvador, admissões de agosto de 2025 a julho de 2026, mediana).", fim=False),
            nota("Nota: recreador em todas as atividades, porque a CNAE 56 tem amostra pequena para a ocupação, e cozinheiro geral na "
                 "CNAE 56, sem chefe de cozinha no recorte. Salário mensal de admissão, pago inteiro nas jornadas de 38 a 40 h por semana "
                 "do plano (seção 7.5); sem empregado de meio período.")], {}


def apendice_d(d):
    q = [["Decisão", "Pergunta", "Dado usado (premissas)", "Fonte", "Nível"],
         ["Bairro", "Onde instalar o ponto?", "IISU, renda per capita e densidade por bairro, com pesos do autor; estação de metrô a até 1.000 m", "QUALISalvador e Censo 2022 (B4); B1", "N2 + N3 + N6"],
         ["Modelo de cobrança", "Como o mercado cobra a entrada?", "Taxa por dia e turno nos concorrentes; NFC-e da São Jogue", "B1; B3", "N3 + N5"],
         ["Taxa de entrada", "Quanto cobrar por pessoa?", "Média da taxa das 31 casas que cobram, fora a São Jogue (R07)", "B1", "N3"],
         ["Consumo", "Quanto cada pessoa gasta?", "Gasto por pessoa declarado no Google Maps em 18 casas (804 declarações) e cesta de consumo de 14 casas (R06)", "B1; B2", "N3"],
         ["Demanda", "Quantas pessoas entram por dia?", "Circulação no pico nas visitas e pelas NFC-e (R04); índice \"Horários de pico\" dos concorrentes no fim de semana (R15)", "B1; B3", "N5 + N3"],
         ["Dia útil", "Quanto o dia útil recebe do fim de semana?", "Índice \"Horários de pico\" dos concorrentes de terça a quinta (R05)", "B1", "N3"],
         ["Mesas e grupo", "Quantas mesas o salão precisa?", "Mesas, pessoas por mesa e permanência nas visitas (R01 a R03)", "B3", "N5 + N6"],
         ["Horário", "Em que dias e horas abrir?", "Horário de 63 concorrentes (R13, R14, R16, R17)", "B1", "N3"],
         ["Equipe", "Quantas pessoas e a que custo?", "Fluxo nas visitas; salário de admissão (C06); encargos (C07)", "B3; Novo CAGED (B4); CLT", "N5 + N2 + N1"],
         ["Acervo inicial", "Quais jogos e a que custo?", "Jogos presentes em 12 ou mais dos 34 acervos e preço nas lojas de 8 concorrentes (I05)", "B1", "N3"],
         ["Ponto", "Quanto custa o ponto?", "Aluguel por m² (C04); área (C03)", "FipeZap (B4); autor", "N2 + N6"],
         ["Custo das mercadorias", "Qual o CMV do A&B?", "Mercadorias dos serviços de alimentação, 2023 e 2024 (C01)", "PAS (B4)", "N2"],
         ["Regime tributário", "Qual a carga sobre a receita?", "Anexos I e III; CNAE", "LC n. 123/2006; CONCLA", "N1"],
         ["Taxa de desconto", "Qual o custo de oportunidade?", "Selic e IPCA projetados; prêmio de risco (M01)", "BCB (B4); autor", "N2 + N6"],
         ["Investimento", "Quanto custa abrir?", "Reforma, mobiliário, cozinha e informática, item a item (I01 a I04); pré-operacionais (I06); itens sem cotação (I10)", "SINAPI e anúncios de sites (B5); autor", "N2 + N3 + N6"]]
    return [titulo("APÊNDICE D – MATRIZ DE EVIDÊNCIAS"),
            par("A matriz liga cada decisão do plano à pergunta que ela responde, ao dado usado, à fonte e ao nível de evidência, de N1, "
                "o mais confiável, a N6, a estimativa do autor (Quadro 3.1). Os códigos entre parênteses são as premissas do modelo "
                "financeiro, com faixa e justificativa no Apêndice E (Quadro D.1)."),
            legenda("Quadro D.1 – Matriz de evidências"),
            tabela("Quadro", [1500, 2000, 2771, 1800, 1000], q, ["left", "left", "left", "left", "center"]),
            fonte("Fonte: elaborado pelo próprio autor.")], {}


def apendice_e(d):
    linhas = [["ID", "Premissa (unidade)", "Pessimista", "Provável", "Otimista", "Fonte", "Nível"]]
    for p in d["prem"]:
        linhas.append([p["id"], f"{p['nome']} ({unidade_rotulo(p['unidade'])})", valor(p["pess"], p["unidade"]),
                       valor(p["prov"], p["unidade"]), valor(p["otim"], p["unidade"]), p["fonte"], p["nivel"]])
    return [titulo("APÊNDICE E – REGISTRO DE PREMISSAS"),
            par(f"O modelo do capítulo 9 tem {len(d['prem'])} premissas, cada uma com faixa pessimista, provável e otimista, fonte e nível "
                "de evidência (Quadro E.1). O código diz o grupo: R, receita e demanda; C, custos; I, investimento; M, parâmetros do "
                "modelo. Nas unidades em %, os valores estão em pontos percentuais."),
            legenda("Quadro E.1 – Registro de premissas do modelo financeiro"),
            tabela("Quadro", [550, 2450, 1050, 1050, 1050, 2221, 700], linhas,
                   ["center", "left", "center", "center", "center", "left", "center"], sz=18),
            fonte("Fonte: elaborado pelo próprio autor, com base no modelo financeiro e nos Blocos B1, B3 e B4 (outubro de 2026).")], \
        dict(premissas=len(d["prem"]))


# o que cada tema marca (resumo da descrição do banco "2 - Comentários" e do dicionário de 2 de novembro de 2026)
DEF_TEMAS = {
    "atendimento presencial": "Cordialidade e atenção da equipe; atendimento e serviço genéricos",
    "comida": "Sabor e qualidade dos pratos",
    "ambiente e decoração": "Atmosfera, aconchego, tema e decoração",
    "variedade do acervo": "Quantidade de jogos",
    "explicação de jogos": "Ensino das regras, monitor, troca de jogos na mesa",
    "curadoria e conservação do acervo": "Jogos bons de jogar; peças faltando; estado dos jogos",
    "espaço e lotação": "Tamanho do salão e das mesas, conseguir mesa, fila, reserva",
    "bebidas": "Sabor e qualidade das bebidas",
    "eventos e comunidade": "Torneios, trívia, público frequente",
    "preço de outros itens": "Jogos, produtos da loja, aluguel e preço sem objeto declarado",
    "conforto e barulho": "Cadeiras, temperatura, ventilação, ruído",
    "preço do cardápio": "Preço de comida e bebida",
    "regras da casa": "Taxa de serviço, pagamento, limite de tempo, idade, horário",
    "rapidez do serviço": "Tempo do pedido",
    "variedade do cardápio": "Opções de comida e bebida",
    "indicações de jogos": "Recomendação de jogo pela equipe",
    "comemorações e grupos": "Serviço a aniversários e grupos",
    "preço da entrada": "Couvert, taxa de jogo, tempo adicional",
    "porções": "Tamanho das porções",
    "limpeza": "Limpeza do salão, dos sanitários e dos jogos",
    "atendimento online": "WhatsApp, telefone, redes, reserva e compra a distância",
    "localização e acesso": "Localização, acesso e estacionamento",
}
VARIAVEL = {"temas (positivos e negativos, agrupados)": "Temas (elogio e crítica)", "contexto": "Contexto",
            "costuma ir": "Frequência de visita declarada", "voltará": "Intenção de voltar"}


def apendice_f(d):
    t = d["temas"]
    assert set(t["tema"]) == set(DEF_TEMAS), "temas do B2 fora da lista do apêndice"
    q1 = [["Tema", "O que marca", "Elogio", "Crítica", "Nota média na crítica (1 a 5)"]] + [
        [r.tema[0].upper() + r.tema[1:], DEF_TEMAS[r.tema], str(r.comentarios_elogio), str(r.comentarios_critica),
         brl(r.nota_media_critica)] for r in t.itertuples()]
    k = d["kappa"]
    k = k[k["kappa"].notna()]
    t2 = [["Rodada", "Variável", "Avaliações", "Kappa", "Situação"]] + [
        [str(r.rodada), VARIAVEL[r.variavel], str(r.linhas), brl(r.kappa),
         "aceita" if r.kappa >= 0.70 else ("excluída" if r.variavel == "costuma ir" else "exploratória")]
        for r in k.itertuples()]
    c = d["ctx"]
    ctx = "; ".join(f"{r.contexto}, {r.comentarios}" for r in c.itertuples())
    k2 = k[(k["rodada"] == 2) & (k["variavel"].str.startswith("temas"))].iloc[0]
    return [titulo("APÊNDICE F – ANÁLISE DE CONTEÚDO DAS AVALIAÇÕES (BLOCO B2)"),
            par("As 1.628 avaliações com texto do B2 foram codificadas numa grade de 22 temas, os mesmos para elogio e crítica: "
                "a coluna em que o tema entra dá a polaridade, e um tema conta uma vez por avaliação. A primeira codificação foi feita "
                "pelo modelo de linguagem Claude, da Anthropic, com o dicionário de temas como instrução, e validada pela "
                "recodificação cega do autor (seção 3.3). "
                "O Quadro F.1 traz a grade, o número de avaliações que elogiam e que criticam cada tema e a nota média das "
                "avaliações com crítica."),
            legenda("Quadro F.1 – Grade de temas e frequência nas avaliações"),
            tabela("Quadro", [2100, 3471, 900, 900, 1700], q1, ["left", "left", "right", "right", "right"], sz=18),
            fonte("Fonte: elaborado pelo próprio autor, com base no Bloco B2 (avaliações até \"3 meses atrás\", coletadas de "
                  "9 a 30 de outubro de 2026).", fim=False),
            nota("Nota: temas não exclusivos; uma avaliação pode elogiar e criticar vários temas. Elogio e crítica em número de "
                 "avaliações, de 1.628."),
            par(f"A recodificação cega cobriu 199 avaliações sorteadas com estratificação por concorrente: 139 na rodada 1, antes da "
                f"revisão do dicionário, e 60 na rodada 2, fora das primeiras. O kappa de Cohen agrupa os temas: cada avaliação, "
                f"tema e polaridade é uma unidade. Na rodada 2, as duas codificações tiveram {int(k2.marcas_em_comum)} marcas em comum, "
                f"de {int(k2.marcas_autor)} do autor e {int(k2.marcas_claude)} da primeira codificação (Tabela F.2). O contexto da visita, "
                f"sem polaridade, é exploratório; nas 1.628 avaliações, aparece assim: {ctx}."),
            legenda("Tabela F.2 – Concordância da recodificação cega"),
            tabela("Tabela", [1000, 3871, 1400, 1200, 1600], t2, ["center", "left", "right", "right", "left"]),
            fonte("Fonte: elaborado pelo próprio autor, com base no Bloco B2 (recodificação de 2 e 3 de novembro de 2026).", fim=False),
            nota("Nota: critério de aceitação de 0,70. Na rodada 1, a frequência de visita e a intenção de voltar não foram "
                 "comparadas, porque só o autor as codificou.")], dict(kappa_temas=num(k2.kappa))


def apendice_g(d):
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
    return [titulo("APÊNDICE G – SIMULAÇÃO DE MONTE CARLO"),
            par(f"A simulação sorteia {brl(g.N_SIMULACOES, 0)} cenários do mesmo modelo do capítulo 9, na versão de {DATA_MODELO}. Em cada cenário, toda premissa com faixa "
                "recebe um valor contínuo de uma distribuição PERT entre o pessimista e o otimista, com moda no provável. A PERT usa os "
                "três valores que o registro de premissas já tem (Apêndice E) e concentra a probabilidade perto do provável, enquanto a "
                "triangular, com os mesmos três valores, dá mais peso às pontas; a uniforme ignoraria o provável. Há duas exceções. As pessoas por mesa (R02), que só limitam o salão, vão de 2 a 6. A taxa "
                "mínima de atratividade fica no provável, 15%: o risco já está no fluxo de caixa, e sorteá-la contaria o risco duas vezes."),
            par("A simulação inclui as decisões de gestão do capítulo 10. Se a circulação sorteada passa do que o salão comporta, a luderia abre mais 2 mesas a "
                "partir do ano 2, com o mobiliário proporcional pago no fim do ano 1. Se o EBITDA de um ano, a partir do ano 2, fica "
                "negativo, o gatilho G5 troca o cardápio por comidas recebidas prontas e corta um cozinheiro no ano seguinte. Se o EBITDA segue negativo, o gatilho G6 "
                "encerra o negócio no fim desse ano, com a devolução da caução e do capital de giro e a revenda dos ativos (I09), sem valor "
                "residual. No cenário que chega ao ano 5, entra o valor residual, e a caução e o capital de giro ficam no negócio, como no "
                "capítulo 9. A semente é fixa, e o resultado se repete a cada execução."),
            par("As premissas são sorteadas de forma independente. A independência é uma hipótese, e não um dado: as fontes de cada "
                "premissa são diferentes (contagem direta, avaliações, bases públicas, estimativas do autor), e o trabalho não tem "
                "observações conjuntas para medir a correlação entre elas. A hipótese tem um efeito conhecido. Se a circulação e o gasto "
                "por pessoa caíssem juntos, como numa crise de renda, as caudas da distribuição seriam mais largas, e a probabilidade de "
                "VPL positivo, menor. A simulação mede o efeito conjunto das faixas melhor que os cenários "
                "extremos, que põem todas as premissas no mesmo lado ao mesmo tempo (Tabela G.1 e Figura G.1). Com 10 mil cenários, a "
                f"probabilidade de VPL positivo tem erro padrão de {num(round(100 * mc['erro_prob'], 1))} ponto percentual. Ela vale para "
                "as hipóteses simuladas – as faixas do Apêndice E, a PERT e a independência – e não é a chance de sucesso do negócio."),
            legenda("Tabela G.1 – Resultados da simulação de Monte Carlo"),
            tabela("Tabela", [6071, 3000], t, ["left", "right"]),
            fonte(f"Fonte: elaborado pelo próprio autor, com base no modelo financeiro ({DATA_MODELO})."),
            legenda("Figura G.1 – Distribuição do VPL na simulação de Monte Carlo"),
            figura("rIdApF1", FIG_MC, "Figura G.1 – Distribuição do VPL na simulação de Monte Carlo"),
            fonte(f"Fonte: elaborado pelo próprio autor, com base no modelo financeiro ({DATA_MODELO}).", fim=False),
            nota("Nota: barras: número de cenários em cada faixa de VPL. Linha pontilhada: VPL igual a zero; à esquerda dela, os "
                 "cenários com VPL negativo. Linha cheia: VPL mediano dos 10 mil cenários.")], dict(prob=pct(mc["prob_positivo"]))


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
                                   ("P(VPL > 0)", r"positivo em ([\d,]+)% d", chaves["prob"]),
                                   ("kappa dos temas", r"temas tiveram kappa de (\d,\d+)", chaves["kappa_temas"])):
        achados = set(re.findall(padrao, texto))
        if achados and achados != {valor_}:
            erros.append(f"{rotulo}: texto {sorted(achados)} × apêndice {valor_}")
    return erros


def main():
    """Põe os apêndices no fim do próprio .docx principal, depois das referências (um só documento com o texto e os
    apêndices, pedido da orientação de 9 de novembro de 2026). Rodar uma vez sobre o .docx recém-gerado, antes dos pré-textuais."""
    principal = Path(sys.argv[1])
    z = zipfile.ZipFile(principal)
    itens = [(i, z.read(i.filename)) for i in z.infolist()]
    z.close()
    arq = dict((i.filename, d) for i, d in itens)
    x = arq["word/document.xml"].decode()
    if "APÊNDICE A –" in html.unescape(x):
        raise SystemExit(f"{principal.name} já tem os apêndices; gerar o principal de novo antes")
    texto = html.unescape(" ".join(re.findall(r"<w:t[^>]*>([^<]*)</w:t>", x[:x.rfind("REFERÊNCIAS")])))

    d = dados()
    corpo, chaves = [], {}
    for fn in (apendice_a, apendice_b, apendice_c, apendice_d, apendice_e, apendice_f, apendice_g):
        els, ch = fn(d)
        corpo += els; chaves.update(ch)
    erros = confere(texto, chaves)
    if erros:
        raise SystemExit("Principal e apêndices divergem:\n- " + "\n- ".join(erros))
    k = x.rfind("<w:sectPr")
    doc = x[:k] + "".join(corpo) + x[k:]
    # a raiz vem do principal; o .docx do gerar_docx_capitulo.js não declara os prefixos da figura
    ns = {"a": "http://schemas.openxmlformats.org/drawingml/2006/main",
          "pic": "http://schemas.openxmlformats.org/drawingml/2006/picture",
          "wp": "http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing",
          "r": "http://schemas.openxmlformats.org/officeDocument/2006/relationships"}
    raiz = re.search(r"<w:document[^>]*>", doc).group(0)
    falta = "".join(f' xmlns:{p}="{u}"' for p, u in ns.items() if f"xmlns:{p}=" not in raiz)
    doc = doc.replace(raiz, raiz[:-1] + falta + ">", 1)
    rels = arq["word/_rels/document.xml.rels"].decode()
    rels = rels.replace("</Relationships>", '<Relationship Id="rIdApF1" Type="http://schemas.openxmlformats.org/officeDocument/2006/'
                                            f'relationships/image" Target="media/{FIG_MC.name}"/></Relationships>')
    tipos = arq["[Content_Types].xml"]
    if b'Extension="png"' not in tipos:
        tipos = tipos.replace(b"<Default ", b'<Default Extension="png" ContentType="image/png"/><Default ', 1)
    with zipfile.ZipFile(principal, "w", zipfile.ZIP_DEFLATED) as zo:
        for item, dado in itens:
            if item.filename == f"word/media/{FIG_MC.name}":
                continue
            dado = {"word/document.xml": doc.encode(), "word/_rels/document.xml.rels": rels.encode(),
                    "[Content_Types].xml": tipos}.get(item.filename, dado)
            zo.writestr(item, dado)
        zo.write(FIG_MC, f"word/media/{FIG_MC.name}")
    print(f"OK: apêndices A a G no fim de {principal.name}; conferência sem divergência ({chaves})")


if __name__ == "__main__":
    main()
