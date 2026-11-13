"""Testes do conferidor: remoção das marcas, escolha da obra e aplicação nos .md.

Uso: python3 -m unittest _src/outros/G4_textos/conferidor_av/test_conferidor.py
"""
import csv
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import conferidor as c  # noqa: E402


class Marcas(unittest.TestCase):
    def test_remove_variantes(self):
        self.assertEqual(c.remover_marcas("(PORTER, 2004, [AV])."), "(PORTER, 2004).")
        self.assertEqual(c.remover_marcas("art. 18-A) [AV]."), "art. 18-A).")
        self.assertEqual(c.remover_marcas("2026. `[AV ano de cada edição]`"), "2026.")
        self.assertEqual(c.remover_marcas("editoras [AV – conferir termos]. O"), "editoras. O")
        self.assertEqual(c.remover_marcas("| LOUOS [AV] | x |"), "| LOUOS | x |")

    def test_nao_confunde_palavra(self):
        self.assertIsNone(c.MARCA.search("[AVALIAR] e [AVISO]"))


class Candidatos(unittest.TestCase):
    livros = [
        {"arquivo": "a.pdf", "autor": "brasil", "ano": "1990", "titulo": "Lei 8.069, ECA", "numeros": {"8.069"}},
        {"arquivo": "b.pdf", "autor": "brasil", "ano": "2015", "titulo": "Lei 13.106", "numeros": {"13.106"}},
        {"arquivo": "c.pdf", "autor": "santos", "ano": "2007", "titulo": "x", "numeros": set()},
        {"arquivo": "d.pdf", "autor": "santos", "ano": "2025", "titulo": "y", "numeros": set()},
        {"arquivo": "e.pdf", "autor": "porter", "ano": "2008", "titulo": "z", "numeros": set()},
    ]

    def arquivos(self, texto):
        return [x["arquivo"] for x in c.candidatos(texto, self.livros)]

    def test_referencia_de_lei_usa_so_o_proprio_numero(self):
        self.assertEqual(self.arquivos("BRASIL. Lei nº 13.106, de 2015. Altera a Lei nº 8.069. [AV]"), ["b.pdf"])

    def test_autor_com_varias_obras_exige_ano(self):
        self.assertEqual(self.arquivos("ambiente (SANTOS et al., 2022, p. 92) [AV]"), [])

    def test_obra_unica_aceita_outra_edicao(self):
        self.assertEqual(self.arquivos("forças (PORTER, 2004, [AV])"), ["e.pdf"])


class Aplicar(unittest.TestCase):
    def test_troca_linha_arquiva_e_registra(self):
        with tempfile.TemporaryDirectory() as d:
            d = Path(d)
            cap = d / "capitulos"; cap.mkdir()
            (cap / "2_ref.md").write_text("Intro.\nForças (PORTER, 2004, [AV]).\nPORTER, M. *Estratégia*. 2004. [AV]\n")
            (cap / "5_merc.md").write_text("PORTER, M. *Estratégia*. 2004. [AV]\n")
            conf = d / "conferidas.md"
            conf.write_text("# C\n\n| V | Cap | Obra | P | T |\n|---|---|---|---|---|\n")
            ver = d / "v.csv"
            with ver.open("w", newline="") as f:
                w = csv.DictWriter(f, fieldnames=c.CAMPOS); w.writeheader()
                w.writerow({"id": "1", "veredito": "confere", "texto_original": "Forças (PORTER, 2004, [AV]).",
                            "texto_novo": "Forças (PORTER, 2004, p. 22).", "fonte": "F3/Porter (2008) - x.pdf", "pagina": "40"})
                w.writerow({"id": "2", "veredito": "confere", "texto_original": "PORTER, M. *Estratégia*. 2004. [AV]",
                            "texto_novo": "PORTER, M. *Estratégia*. 2004."})
                w.writerow({"id": "3", "veredito": "nao_confere", "texto_original": "Intro.", "texto_novo": "x"})
            arquivados = []
            antigos = (c.CAP, c.VEREDITOS, c.CONFERIDAS)
            c.CAP, c.VEREDITOS, c.CONFERIDAS = cap, ver, conf
            import arquivar_md
            original = arquivar_md.arquivar
            arquivar_md.arquivar = lambda md, carimbo: arquivados.append(md.name)
            try:
                r = c.aplicar()
            finally:
                c.CAP, c.VEREDITOS, c.CONFERIDAS = antigos
                arquivar_md.arquivar = original
            self.assertEqual(r["aplicados"], 2)
            self.assertEqual(sorted(arquivados), ["2_ref.md", "5_merc.md"])
            self.assertEqual((cap / "2_ref.md").read_text(),
                             "Intro.\nForças (PORTER, 2004, p. 22).\nPORTER, M. *Estratégia*. 2004.\n")
            self.assertEqual((cap / "5_merc.md").read_text(), "PORTER, M. *Estratégia*. 2004.\n")
            registro = conf.read_text()
            self.assertIn("| 2 | Porter (2008) - x | 40 | Forças", registro)  # só a citação do texto
            self.assertEqual(registro.count("\n| v"), 1)
            self.assertEqual(c.aplicar()["aplicados"], 0)  # segunda rodada não repete


if __name__ == "__main__":
    unittest.main()
