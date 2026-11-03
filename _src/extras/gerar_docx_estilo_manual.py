"""Gera o .docx da variante de estilo dos caps. 1 e 2 (textos/capitulos/estilo_manual/).

Converte o .md (títulos #/##, parágrafos, citações longas em linhas "> ",
quadro em tabela markdown, legenda e fonte) em .docx no padrão ABNT/UFBA:
A4, margens 3/2 cm, Arial 12, entrelinha 1,5, recuo de 1,25 cm; citação
longa com recuo de 4 cm, corpo 10 e entrelinha simples. O gerar_docx_capitulo.js
omite as linhas "> ", por isso este script próprio.
Uso: python3 gerar_docx_estilo_manual.py [versao]
"""
import re
import sys
from pathlib import Path

from docx import Document
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_BREAK
from docx.oxml.ns import qn
from docx.shared import Cm, Pt

ROOT = Path(__file__).resolve().parents[2]
PASTA = ROOT / "textos" / "capitulos" / "estilo_manual"
MD = PASTA / "_md" / "1-2_introducao_referencial_estilo_manual.md"
VERSAO = sys.argv[1] if len(sys.argv) > 1 else "1"
SAIDA = PASTA / f"1-2_introducao_referencial_estilo_manual_v{VERSAO}.docx"


def runs(par, texto, tamanho=12):
    """Escreve texto com **negrito** e *itálico* em runs Arial."""
    for parte in re.split(r"(\*\*[^*]+\*\*|\*[^*]+\*)", texto):
        if not parte:
            continue
        r = par.add_run(parte.strip("*") if parte.startswith("*") else parte)
        r.bold = parte.startswith("**")
        r.italic = parte.startswith("*") and not parte.startswith("**")
        r.font.name = "Arial"
        r._element.rPr.rFonts.set(qn("w:eastAsia"), "Arial")
        r.font.size = Pt(tamanho)


def formato(par, recuo=1.25, esquerda=0.0, linha=1.5, depois=0, alinh=WD_ALIGN_PARAGRAPH.JUSTIFY):
    pf = par.paragraph_format
    pf.first_line_indent = Cm(recuo)
    pf.left_indent = Cm(esquerda)
    pf.line_spacing = linha
    pf.space_before = Pt(0)
    pf.space_after = Pt(depois)
    par.alignment = alinh


def main():
    texto = re.sub(r"<!--.*?-->", "", MD.read_text(encoding="utf-8"), flags=re.S)
    doc = Document()
    sec = doc.sections[0]
    sec.page_width, sec.page_height = Cm(21), Cm(29.7)
    sec.left_margin, sec.top_margin = Cm(3), Cm(3)
    sec.right_margin, sec.bottom_margin = Cm(2), Cm(2)
    estilo = doc.styles["Normal"]
    estilo.font.name = "Arial"
    estilo.font.size = Pt(12)

    linhas = texto.splitlines()
    i, primeiro_cap, em_ref = 0, True, False
    while i < len(linhas):
        l = linhas[i].rstrip()
        if not l.strip():
            i += 1
            continue
        if l.startswith("# "):
            if not primeiro_cap:
                doc.add_paragraph().add_run().add_break(WD_BREAK.PAGE)
            primeiro_cap = False
            em_ref = l[2:].strip() == "REFERÊNCIAS"
            p = doc.add_paragraph()
            runs(p, f"**{l[2:].strip()}**")
            formato(p, recuo=0, depois=18,
                    alinh=WD_ALIGN_PARAGRAPH.CENTER if em_ref else WD_ALIGN_PARAGRAPH.LEFT)
        elif l.startswith("## "):
            p = doc.add_paragraph()
            runs(p, f"**{l[3:].strip()}**")
            formato(p, recuo=0, depois=12, alinh=WD_ALIGN_PARAGRAPH.LEFT)
            p.paragraph_format.space_before = Pt(12)
        elif l.startswith(">"):
            bloco = []
            while i < len(linhas) and linhas[i].startswith(">"):
                bloco.append(linhas[i].lstrip(">").strip())
                i += 1
            p = doc.add_paragraph()
            runs(p, " ".join(b for b in bloco if b), tamanho=10)
            formato(p, recuo=0, esquerda=4, linha=1.0, depois=12)
            p.paragraph_format.space_before = Pt(12)
            continue
        elif l.startswith("|"):
            tab = []
            while i < len(linhas) and linhas[i].startswith("|"):
                cel = [c.strip() for c in linhas[i].strip().strip("|").split("|")]
                if not all(re.fullmatch(r":?-+:?", c) for c in cel):
                    tab.append(cel)
                i += 1
            t = doc.add_table(rows=len(tab), cols=len(tab[0]))
            t.style = "Table Grid"
            for r, linha in enumerate(tab):
                for c, val in enumerate(linha):
                    cp = t.cell(r, c).paragraphs[0]
                    runs(cp, f"**{val}**" if r == 0 else val, tamanho=10)
                    formato(cp, recuo=0, linha=1.0, alinh=WD_ALIGN_PARAGRAPH.LEFT)
            continue
        elif l.startswith("**Quadro") or l.startswith("Fonte:"):
            p = doc.add_paragraph()
            runs(p, l, tamanho=12 if l.startswith("**") else 10)
            formato(p, recuo=0, linha=1.0, depois=6, alinh=WD_ALIGN_PARAGRAPH.LEFT)
            if l.startswith("**"):
                p.paragraph_format.space_before = Pt(12)
        else:
            p = doc.add_paragraph()
            runs(p, l)
            if em_ref:
                formato(p, recuo=0, linha=1.0, depois=12, alinh=WD_ALIGN_PARAGRAPH.LEFT)
            else:
                formato(p)
        i += 1
    doc.save(SAIDA)
    print(SAIDA)


if __name__ == "__main__":
    main()
