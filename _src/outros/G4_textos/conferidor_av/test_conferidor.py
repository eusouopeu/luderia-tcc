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


class Artigos(unittest.TestCase):
    def test_artigo_com_milhar_e_lista(self):
        self.assertEqual(c.artigos_citados("(Lei n. 10.406/2002, art. 1.052)"), [("10.406", "1.052", "")])
        self.assertEqual([a for _, a, _ in c.artigos_citados("CLT, arts. 71, 73, 386 e 457, § 2º")],
                         ["71", "73", "386", "457"])
        self.assertEqual(c.artigos_citados("LC n. 123/2006, art. 18-A"), [("123", "18", "A")])

    def test_cabecalho_do_artigo_pesa_mais_que_a_mencao(self):
        paginas = ["Capa da lei.", "O art. 73 trata disso, ver adiante.", "Art. 7o Texto.\nArt. 73. O trabalho noturno"]
        original = c.paginas_pdf
        c.paginas_pdf = lambda rel: paginas
        try:
            r = c.localizar("hora noturna (CLT, art. 73)", "x.pdf")
        finally:
            c.paginas_pdf = original
        self.assertEqual(r["pagina"], 3)
        self.assertEqual([a["pagina"] for a in r["achados"]], [3, 2])

    def test_artigo_de_outra_norma_nao_conta(self):
        paginas = ["Art. 1.052. Na sociedade limitada", "nada"]
        original = c.paginas_pdf
        c.paginas_pdf = lambda rel: paginas
        try:
            r = c.localizar("(Lei n. 10.406/2002, art. 1.052)", "x.pdf", numeros_pdf={"123"})
        finally:
            c.paginas_pdf = original
        self.assertEqual(r["achados"], [])


class Obras(unittest.TestCase):
    ref = "SALVADOR. Lei nº 9.148, de 2016. Dispõe sobre o uso do solo (LOUOS). *Diário Oficial*. [AV]"

    def test_rotulos(self):
        siglas = c.siglas_das_referencias([self.ref])
        self.assertEqual(siglas, {"LOUOS"})
        self.assertEqual(c.obra_citada(self.ref, siglas), "LOUOS")
        self.assertEqual(c.obra_citada("| Zoneamento | x | LOUOS de Salvador [AV] |", siglas), "LOUOS")
        self.assertEqual(c.obra_citada("A grade ERRC converte evidências (KIM; MAUBORGNE, 2005) [AV].", siglas),
                         "KIM; MAUBORGNE (2005)")
        self.assertEqual(c.obra_citada("PFEFFER, Jeffrey; SUTTON, Robert I. *A verdade*. 2006. [AV]", siglas),
                         "PFEFFER; SUTTON (2006)")
        self.assertEqual(c.obra_citada("| ICMS sobre o A&B (4%) [AV] | n.a. |", siglas), "sem obra na linha")

    def test_faltam_conta_cartoes_e_fecha_com_o_total(self):
        fila = [{"id": str(k), "fontes": [], "obra": o, "ocorrencias": [{"arquivo": "8_j.md", "linha": k}]}
                for k, o in enumerate(["LOUOS", "LOUOS", "CLT", "sem obra na linha"])]
        fila.append({"id": "x", "fontes": [{"arquivo": "a.pdf"}], "obra": "A", "ocorrencias": []})
        grupos = c.obras_faltando(fila)
        self.assertEqual([(g["obra"], g["cartoes"]) for g in grupos],
                         [("LOUOS", 2), ("CLT", 1), ("sem obra na linha", 1)])
        self.assertEqual(sum(g["cartoes"] for g in grupos), sum(1 for x in fila if not x["fontes"]))


class Marcas_e_ordem(unittest.TestCase):
    def test_frase_e_tarefa_de_cada_marca(self):
        texto = "Primeira frase. Segunda frase citada [AV: data de acesso]. Fim [AV]"
        m = c.marcas_do_texto(texto)
        self.assertEqual(texto[m[0]["frase"]:m[0]["ini"]], "Segunda frase citada ")
        self.assertEqual([x["tarefa"] for x in m], ["data de acesso", ""])

    def test_fila_agrupada_por_obra(self):
        def cartao(i, arq, nota, ref=False):
            return {"id": i, "fontes": [{"arquivo": arq}] if arq else [], "nota": nota, "referencia": ref,
                    "obra": "X", "ocorrencias": [{"arquivo": "1.md", "linha": 1}]}
        fila = c.ordenar([cartao("a1", "F/a.pdf", .3), cartao("b1", "F/b.pdf", .8), cartao("a2", "F/a.pdf", .9, True),
                          cartao("s", None, -1)])
        self.assertEqual([x["id"] for x in fila], ["a2", "a1", "b1", "s"])


class Travas(unittest.TestCase):
    def test_confere_exige_texto_e_avisa_av(self):
        self.assertIsNotNone(c.validar_veredito({"veredito": "confere", "texto_novo": "  "}))
        self.assertIsNotNone(c.validar_veredito({"veredito": "confere", "texto_novo": "x [AV]"}))
        self.assertIsNone(c.validar_veredito({"veredito": "confere", "texto_novo": "x [AV]", "manter_av": True}))
        self.assertIsNone(c.validar_veredito({"veredito": "nao_confere", "texto_novo": ""}))
        self.assertIsNotNone(c.validar_veredito({"veredito": "talvez"}))

    def test_caminho_fora_da_bibliografia(self):
        self.assertIsNone(c.pdf_seguro("../CLAUDE.md"))
        self.assertIsNone(c.pdf_seguro("../../../../etc/hosts"))


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
                            "texto_novo": "Forças (PORTER, 2004, p. 22).", "fonte": "F3/Porter (2008) - x.pdf", "pagina": "40",
                            "pagina_impressa": "22"})
                w.writerow({"id": "2", "veredito": "confere", "texto_original": "PORTER, M. *Estratégia*. 2004. [AV]",
                            "texto_novo": "PORTER, M. *Estratégia*. 2004."})
                w.writerow({"id": "3", "veredito": "nao_confere", "texto_original": "Intro.", "texto_novo": "x"})
                w.writerow({"id": "4", "veredito": "confere", "texto_original": "Intro.", "texto_novo": ""})
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
            self.assertEqual(len(r["falhas"]), 1)  # texto vazio não apaga a linha "Intro."
            self.assertIn("| 2 | Porter (2008) - x | 22 | Forças", registro)  # só a citação do texto
            self.assertEqual(registro.count("\n| v"), 1)
            self.assertEqual(c.aplicar()["aplicados"], 0)  # segunda rodada não repete


if __name__ == "__main__":
    unittest.main()
