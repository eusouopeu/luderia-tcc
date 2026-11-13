"""
Elementos pré-textuais do TMin: listas de figuras, de quadros, de tabelas e de
abreviações e siglas, e o sumário, no padrão do trabalho Dance Forrónejo
(título centralizado em caixa alta e negrito; entradas com pontilhado até o
número da página; siglas em duas colunas, com a sigla em negrito; sumário com
capítulos em negrito e caixa alta, seções em caixa alta e subseções em negrito).

Uso: python3 _src/Extras/Gerar_textos/gerar_pretextuais_tmin.py textos/capitulos/TCC_luderia_TMin_v<n>.docx

Reescreve o .docx no lugar. Tudo o que vem antes do título "1 INTRODUÇÃO" é
trocado pela capa, pela folha de rosto, pela folha de aprovação e pelos elementos novos, numa seção própria, sem número de página
impresso; a numeração do texto continua a contagem (ABNT NBR 14724). As
páginas saem do PDF gerado pelo LibreOffice: o script gera o documento com
páginas provisórias, converte, lê em que página está cada título e legenda,
preenche e confere numa segunda conversão. Rodar depois de cada versão nova do
principal (regra em `_docs/_instrucoes/1c_versoes.md`).
"""
import html
import re
import subprocess
import sys
import tempfile
import zipfile
from pathlib import Path

SOFFICE = "/Applications/LibreOffice.app/Contents/MacOS/soffice"

# Siglas e abreviações do TMin, em ordem alfabética na lista. Sigla usada no
# texto e ausente daqui faz o script parar.
SIGLAS = {
    "A&B": "Alimentos e bebidas",
    "ABNT": "Associação Brasileira de Normas Técnicas",
    "ABRINQ": "Associação Brasileira dos Fabricantes de Brinquedos",
    "ANPD": "Autoridade Nacional de Proteção de Dados",
    "ANR": "Associação Nacional de Restaurantes",
    "API": "Interface de programação de aplicações (Application Programming Interface)",
    "B1 a B5": "Blocos de coleta de dados do trabalho (Quadro 3.2)",
    "BCB": "Banco Central do Brasil",
    "CBMBA": "Corpo de Bombeiros Militar da Bahia",
    "CBO": "Classificação Brasileira de Ocupações",
    "CBS": "Contribuição Social sobre Bens e Serviços",
    "CLT": "Consolidação das Leis do Trabalho",
    "CDC": "Código de Defesa do Consumidor",
    "INSS": "Instituto Nacional do Seguro Social",
    "PCMSO": "Programa de Controle Médico de Saúde Ocupacional",
    "RAT": "Riscos Ambientais do Trabalho",
    "SHRBS": "Sindicato de Hotéis, Restaurantes, Bares e Similares de Salvador e Litoral Norte",
    "TST": "Tribunal Superior do Trabalho",
    "CMV": "Custo das mercadorias vendidas",
    "CNAE": "Classificação Nacional de Atividades Econômicas",
    "CNPJ": "Cadastro Nacional da Pessoa Jurídica",
    "CNS": "Conselho Nacional de Saúde",
    "Cofins": "Contribuição para o Financiamento da Seguridade Social",
    "CONCLA": "Comissão Nacional de Classificação",
    "CSLL": "Contribuição Social sobre o Lucro Líquido",
    "DAS": "Documento de Arrecadação do Simples Nacional",
    "EBITDA": "Lucro antes de juros, impostos, depreciação e amortização (Earnings Before Interest, Taxes, Depreciation and Amortization)",
    "EC": "Emenda Constitucional",
    "ECAD": "Escritório Central de Arrecadação e Distribuição",
    "ERRC": "Eliminar, reduzir, elevar e criar",
    "FA, FO, DO": "Cruzamentos da matriz SWOT (forças × ameaças, forças × oportunidades, fraquezas × oportunidades)",
    "FGTS": "Fundo de Garantia do Tempo de Serviço",
    "FIPE": "Fundação Instituto de Pesquisas Econômicas",
    "IBGE": "Instituto Brasileiro de Geografia e Estatística",
    "IBS": "Imposto sobre Bens e Serviços",
    "IC": "Intervalo de confiança",
    "ID": "Identificador da premissa no modelo financeiro",
    "JUCEB": "Junta Comercial do Estado da Bahia",
    "ICMS": "Imposto sobre Circulação de Mercadorias e Serviços",
    "INPI": "Instituto Nacional da Propriedade Industrial",
    "IPCA": "Índice Nacional de Preços ao Consumidor Amplo",
    "IISU": "Índice de Infraestrutura e Serviços Urbanos",
    "IPTU": "Imposto Predial e Territorial Urbano",
    "IRPJ": "Imposto de Renda da Pessoa Jurídica",
    "ISS": "Imposto sobre Serviços",
    "LC": "Lei Complementar",
    "LGPD": "Lei Geral de Proteção de Dados Pessoais",
    "LOUOS": "Lei de Ordenamento do Uso e da Ocupação do Solo de Salvador",
    "MEI": "Microempreendedor individual",
    "MTE": "Ministério do Trabalho e Emprego",
    "N1 a N6": "Níveis de evidência das premissas, do mais ao menos confiável",
    "NBR": "Norma Brasileira",
    "NFC-e": "Nota fiscal de consumidor eletrônica",
    "Novo CAGED": "Novo Cadastro Geral de Empregados e Desempregados",
    "PAS": "Pesquisa Anual de Serviços",
    "PESTEL": "Fatores políticos, econômicos, sociais, tecnológicos, ambientais e legais",
    "PIS": "Programa de Integração Social",
    "PLR": "Participação nos lucros ou resultados",
    "MTP": "Ministério do Trabalho e Previdência",
    "PERT": "Distribuição de três pontos da Program Evaluation and Review Technique",
    "PNAD": "Pesquisa Nacional por Amostra de Domicílios",
    "POF": "Pesquisa de Orçamentos Familiares",
    "PRC": "Análise do contraste da penalidade e da recompensa",
    "RDC": "Resolução da Diretoria Colegiada",
    "REGIC": "Regiões de Influência das Cidades",
    "Selic": "Sistema Especial de Liquidação e de Custódia",
    "SGS": "Sistema Gerenciador de Séries Temporais",
    "SIDRA": "Sistema IBGE de Recuperação Automática",
    "SINAPI": "Sistema Nacional de Pesquisa de Custos e Índices da Construção Civil",
    "SWOT": "Forças, fraquezas, oportunidades e ameaças (Strengths, Weaknesses, Opportunities, Threats)",
    "TIR": "Taxa interna de retorno",
    "TMA": "Taxa mínima de atratividade",
    "VLT": "Veículo leve sobre trilhos",
    "VPL": "Valor presente líquido",
}

esc = lambda s: s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
txt = lambda e: html.unescape("".join(re.findall(r"<w:t[^>]*>([^<]*)</w:t>", e))).strip()
FONTE = '<w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:eastAsia="Arial" w:cs="Arial"/>'


def rpr(b=False, caps=False):
    return f'<w:rPr>{FONTE}{"<w:b/><w:bCs/>" if b else ""}{"<w:caps/>" if caps else ""}<w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr>'


def titulo(t, quebra=True):
    return ('<w:p><w:pPr>' + ('<w:pageBreakBefore/>' if quebra else '') +
            '<w:spacing w:before="0" w:after="283" w:line="360" w:lineRule="auto"/><w:ind w:firstLine="0"/><w:jc w:val="center"/></w:pPr>'
            f'<w:r>{rpr(b=True)}<w:t xml:space="preserve">{esc(t)}</w:t></w:r></w:p>')

# Dados da capa e da folha de rosto (NBR 14724). A capa não entra na contagem das páginas:
# a folha de rosto é a página 1, e o número só é impresso a partir da introdução.
AUTOR = "Pedro Caio Feitosa Teles"
TITULO = "Dados em jogo"
SUBTITULO = "plano de negócios baseado em evidências para uma luderia em Salvador"
ORIENTADOR = "Jair Sampaio Soares Junior"
LOCAL, ANO = "Salvador", "2026"
NATUREZA = ("Trabalho de Conclusão de Curso apresentado ao curso de Administração da Escola de Administração da "
            "Universidade Federal da Bahia, como requisito parcial para a obtenção do grau de Bacharel em Administração.")


def linha(t, b=False, antes=0, depois=0, jc="center", esq=0, simples=True, quebra=False):
    return ('<w:p><w:pPr>' + ('<w:pageBreakBefore/>' if quebra else '') +
            f'<w:spacing w:before="{antes}" w:after="{depois}" w:line="{240 if simples else 360}" w:lineRule="auto"/>'
            f'<w:ind w:left="{esq}" w:firstLine="0"/><w:jc w:val="{jc}"/></w:pPr>'
            f'<w:r>{rpr(b)}<w:t xml:space="preserve">{esc(t)}</w:t></w:r></w:p>')


def titulo_trabalho(antes):
    return ('<w:p><w:pPr>' f'<w:spacing w:before="{antes}" w:after="0" w:line="360" w:lineRule="auto"/><w:ind w:firstLine="0"/><w:jc w:val="center"/></w:pPr>'
            f'<w:r>{rpr(True)}<w:t xml:space="preserve">{esc(TITULO.upper())}:</w:t></w:r>'
            f'<w:r>{rpr(False)}<w:br/><w:t xml:space="preserve">{esc(SUBTITULO)}</w:t></w:r></w:p>')


def capa_e_rosto():
    capa = [linha("UNIVERSIDADE FEDERAL DA BAHIA", b=True), linha("ESCOLA DE ADMINISTRAÇÃO", b=True),
            linha(AUTOR.upper(), antes=2600), titulo_trabalho(2900),
            linha(LOCAL, antes=4300), linha(ANO)]
    rosto = [linha(AUTOR.upper(), quebra=True), titulo_trabalho(2900),
             linha(NATUREZA, antes=2400, jc="both", esq=4536),
             linha(f"Orientador: {ORIENTADOR}", antes=360, jc="left", esq=4536),
             linha(LOCAL, antes=2700), linha(ANO)]
    # folha de aprovação (NBR 14724, 4.2.1.3): os nomes da banca e a data entram quando a banca for definida
    membro = lambda nome, inst: [linha("_" * 50, antes=700), linha(nome), linha(inst)]
    aprov = ([linha(AUTOR.upper(), quebra=True), titulo_trabalho(900),
              linha(NATUREZA, antes=900, jc="both", esq=4536),
              linha(f"Aprovado em ____ de ________________ de {ANO}.", antes=900, jc="left"),
              linha("BANCA EXAMINADORA", b=True, antes=600)]
             + membro(f"{ORIENTADOR} – Orientador", "Universidade Federal da Bahia")
             + membro("Membro da banca examinadora", "Instituição")
             + membro("Membro da banca examinadora", "Instituição"))
    return "".join(capa + rosto + aprov)



def par_md(t, depois=0, antes=0):
    """Parágrafo justificado, espaço simples e sem recuo (NBR 6028), com **negrito** do .md."""
    runs = "".join(f'<w:r>{rpr(i % 2 == 1)}<w:t xml:space="preserve">{esc(s)}</w:t></w:r>'
                   for i, s in enumerate(t.split("**")) if s)
    return ('<w:p><w:pPr>'
            f'<w:spacing w:before="{antes}" w:after="{depois}" w:line="240" w:lineRule="auto"/><w:ind w:firstLine="0"/><w:jc w:val="both"/></w:pPr>'
            f'{runs}</w:p>')


def resumo_e_abstract():
    """RESUMO e ABSTRACT com as palavras-chave, de textos/capitulos/_md/resumo_abstract.md (fonte única)."""
    md = Path(__file__).resolve().parents[3] / "textos" / "capitulos" / "_md" / "resumo_abstract.md"
    if not md.exists():
        return ""
    out = []
    for bloco in re.split(r"^# ", md.read_text(encoding="utf-8"), flags=re.M)[1:]:
        tit, *paras = [l for l in bloco.splitlines() if l.strip()]
        out.append(titulo(tit.strip()))
        for i, par in enumerate(paras):
            out.append(par_md(par.strip(), depois=283 if i < len(paras) - 1 else 0))
    return "".join(out)


def entrada(t, pag, b=False, caps=False):
    return ('<w:p><w:pPr><w:tabs><w:tab w:val="right" w:leader="dot" w:pos="9071"/></w:tabs>'
            '<w:spacing w:before="0" w:after="0" w:line="360" w:lineRule="auto"/><w:ind w:left="0" w:firstLine="0"/><w:jc w:val="both"/></w:pPr>'
            f'<w:r>{rpr(b, caps)}<w:t xml:space="preserve">{esc(t)}</w:t></w:r><w:r>{rpr(b, caps)}<w:tab/><w:t>{pag}</w:t></w:r></w:p>')


def tabela_siglas(itens):
    sem = '<w:tcBorders><w:top w:val="nil"/><w:left w:val="nil"/><w:bottom w:val="nil"/><w:right w:val="nil"/></w:tcBorders>'
    linhas = ""
    for sg, ext in itens:
        cel = lambda w, t, b: (f'<w:tc><w:tcPr><w:tcW w:w="{w}" w:type="dxa"/>{sem}</w:tcPr><w:p><w:pPr><w:spacing w:before="0" w:after="0" '
                               f'w:line="360" w:lineRule="auto"/><w:jc w:val="left"/></w:pPr><w:r>{rpr(b)}<w:t xml:space="preserve">{esc(t)}</w:t></w:r></w:p></w:tc>')
        linhas += "<w:tr><w:trPr><w:cantSplit/></w:trPr>" + cel(1700, sg, True) + cel(7371, ext, False) + "</w:tr>"
    return ('<w:tbl><w:tblPr><w:tblW w:w="9071" w:type="dxa"/><w:tblBorders><w:top w:val="nil"/><w:left w:val="nil"/><w:bottom w:val="nil"/>'
            '<w:right w:val="nil"/><w:insideH w:val="nil"/><w:insideV w:val="nil"/></w:tblBorders><w:tblLayout w:type="fixed"/>'
            '<w:tblCellMar><w:left w:w="0" w:type="dxa"/><w:right w:w="80" w:type="dxa"/></w:tblCellMar></w:tblPr>'
            '<w:tblGrid><w:gridCol w:w="1700"/><w:gridCol w:w="7371"/></w:tblGrid>' + linhas + "</w:tbl>")


def siglas_usadas(texto):
    usadas = []
    for sg in SIGLAS:
        partes = [p.strip() for p in re.split(r",| a ", sg)]
        if sg == "B1 a B5":
            ok = bool(re.search(r"\bB[1-5]\b", texto))
        elif sg == "N1 a N6":
            ok = bool(re.search(r"\bN[1-6]\b", texto))
        else:
            ok = any(re.search(r"(?<![\w&])" + re.escape(p) + r"(?![\w&])", texto) for p in partes)
        if ok:
            usadas.append(sg)
    # siglas do texto que faltam no dicionário (só maiúsculas de 2 a 6 letras, fora as citações)
    sem_cit = re.sub(r"\([^()]*(?:\d{4}|\[AV)[^()]*\)", " ", texto)
    candidatas = set(re.findall(r"(?<![\w&-])([A-Z]{2,6})(?![\w&-])", sem_cit))
    conhecidas = {p.strip() for sg in SIGLAS for p in re.split(r",| a ", sg)} | {"CAGED"}
    ignorar = {"II", "III", "IV", "VI", "VII", "AV", "SP", "UK", "DF", "BA", "RJ", "MG", "PR", "PE", "PA", "BV", "TMIN", "TMAX", "MVP",
               "NETO", "KAM", "ERRC", "DRE", "UFBA", "BUSCAR", "BG", "STIEP", "OLX", "ZAP"}
    faltam = sorted(c for c in candidatas - conhecidas - ignorar if not c.isdigit())
    return sorted(usadas, key=lambda s: s.lower()), faltam


def paginas(docx):
    with tempfile.TemporaryDirectory() as d:
        subprocess.run([SOFFICE, "--headless", "--convert-to", "pdf", "--outdir", d, str(docx)], capture_output=True, check=True)
        pdf = Path(d) / (Path(docx).stem + ".pdf")
        t = subprocess.run(["pdftotext", str(pdf), "-"], capture_output=True, text=True).stdout
    return t.split("\f")


norm = lambda s: re.sub(r"\s+", "", s)


def localiza(entradas, pags, inicio):
    """Página de cada entrada, procurando em ordem a partir da página `inicio` (índice 0)."""
    out, p = [], inicio
    for e in entradas:
        alvo = norm(e)[:45]
        while p < len(pags) and alvo not in norm(pags[p]):
            p += 1
        if p == len(pags):
            raise SystemExit(f"não achei no PDF: {e}")
        out.append(p + 1)
    return out


def main():
    arq = Path(sys.argv[1])
    with zipfile.ZipFile(arq) as z:  # lido inteiro antes: o arquivo é reescrito no fim
        itens = [(i, z.read(i.filename)) for i in z.infolist()]
    x = dict((i.filename, d) for i, d in itens)["word/document.xml"].decode()
    ini = x.find("<w:body>") + len("<w:body>")
    els = re.findall(r"<w:p[ >].*?</w:p>|<w:tbl>.*?</w:tbl>", x[ini:], re.S)
    i1 = next(i for i, e in enumerate(els) if 'w:val="Title"' in e and txt(e).startswith("1 "))
    corpo_xml = x[ini:][x[ini:].find(els[i1]):]
    corpo = els[i1:]

    figs, quads, tabs, sumario = [], [], [], []
    for e in corpo:
        if e.startswith("<w:tbl"):
            continue
        s = txt(e)
        st = (re.search(r'<w:pStyle w:val="([^"]+)"', e) or [None, ""])[1]
        if st == "Title":
            sumario.append((1, s))
        elif st == "Heading1":
            sumario.append((2, s))
        elif st == "Heading2":
            sumario.append((3, s))
        elif re.match(r"Figura [\dA-G.]+ –", s):
            figs.append(s)
        elif re.match(r"Quadro [\dA-G.]+ –", s):
            quads.append(s)
        elif re.match(r"Tabela [\dA-G.]+ –", s):
            tabs.append(s)
    i_ref = next(i for i, e in enumerate(corpo) if txt(e).upper() == "REFERÊNCIAS")
    texto = " ".join(html.unescape(" ".join(re.findall(r"<w:t[^>]*>([^<]*)</w:t>", e))) for e in corpo[:i_ref] if not re.search(r'<w:pStyle w:val="(Title|Heading\d)"', e[:300]))
    usadas, faltam = siglas_usadas(texto)
    if faltam:
        print("Aviso: siglas sem entrada na lista:", ", ".join(faltam))

    imp = lambda p: p - 1 if isinstance(p, int) else p  # página impressa: a capa não conta

    def monta(pf, pq, pt, ps, ini_num=1):
        f = [capa_e_rosto(), resumo_e_abstract(), titulo("LISTA DE FIGURAS")] + [entrada(s, imp(p)) for s, p in zip(figs, pf)]
        f += [titulo("LISTA DE QUADROS")] + [entrada(s, imp(p)) for s, p in zip(quads, pq)]
        f += [titulo("LISTA DE TABELAS")] + [entrada(s, imp(p)) for s, p in zip(tabs, pt)]
        f += [titulo("LISTA DE ABREVIAÇÕES E SIGLAS"), tabela_siglas([(s, SIGLAS[s]) for s in usadas])]
        f += [titulo("SUMÁRIO")]
        for (nivel, s), p in zip(sumario, ps):
            f.append(entrada(s, imp(p), b=nivel in (1, 3), caps=nivel in (1, 2)))
        sect = x[x.rfind("<w:sectPr"):x.rfind("</w:sectPr>") + len("</w:sectPr>")]
        sect = re.sub(r"<w:footerReference[^>]*/>", "", sect)
        sect = re.sub(r"<w:pgNumType[^>]*/>", "", sect)
        f.append(f'<w:p><w:pPr>{sect}</w:pPr></w:p>')
        corpo = re.sub(r"<w:pgNumType[^>]*/>", "", corpo_xml)
        i = corpo.rfind("<w:pgMar")
        j = corpo.find("/>", i) + 2
        corpo = corpo[:j] + f'<w:pgNumType w:start="{ini_num}"/>' + corpo[j:]
        return x[:ini] + "".join(f) + corpo

    def grava(doc, destino):
        with zipfile.ZipFile(destino, "w", zipfile.ZIP_DEFLATED) as zo:
            for item, dado in itens:
                zo.writestr(item, doc.encode() if item.filename == "word/document.xml" else dado)

    zeros = lambda l: ["00"] * len(l)
    with tempfile.TemporaryDirectory() as d:
        prov = Path(d) / arq.name
        grava(monta(zeros(figs), zeros(quads), zeros(tabs), zeros(sumario)), prov)
        pags = paginas(prov)
        n_pre = next(i for i, p in enumerate(pags) if norm("1 INTRODUÇÃO") in norm(p) and "SUMÁRIO" not in p)
        res = [localiza(l, pags, n_pre) for l in (figs, quads, tabs, [s for _, s in sumario])]
        doc = monta(*res, ini_num=n_pre)
        grava(doc, prov)
        pags2 = paginas(prov)
        res2 = [localiza(l, pags2, n_pre) for l in (figs, quads, tabs, [s for _, s in sumario])]
        if res2 != res:
            raise SystemExit("as páginas mudaram entre as duas conversões; rodar de novo")
    grava(doc, arq)
    print(f"OK: {arq.name}; {len(figs)} figuras, {len(quads)} quadros, {len(tabs)} tabelas, {len(usadas)} siglas, "
          f"{len(sumario)} entradas no sumário; capa e pré-textuais em {n_pre} páginas (a capa não conta); texto da p. {n_pre} à {len(pags2) - 2}")


if __name__ == "__main__":
    main()
