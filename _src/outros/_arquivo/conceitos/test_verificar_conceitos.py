"""Testes do verificar_conceitos.py com um projeto falso em pasta temporária.

Uso: python3 -m unittest _src/extras/conceitos/test_verificar_conceitos.py
"""

import sys
import tempfile
import unittest
from datetime import datetime
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import verificar_conceitos as vc  # noqa: E402

CABECALHO = "| Termo | Definição atual | Definição real | Autores | Referência |\n|---|---|---|---|---|\n"
REF_KIMES = ("KIMES, Sheryl E. et al. Restaurant revenue management. *CHRAQ*, v. 39, n. 3, "
             "p. 32–39, 1998.")
REF_KAM = ("KAM INSIGHT. *Competitive socialising*. KAM Media, 2022. Disponível em: "
           "https://kaminsight.com/2023/07/x.pdf.")


def linha(id_, termo, real, autores, ref):
    return f"| {id_} — {termo} | definição atual | {real} | {autores} | {ref} |\n"


class TestVerificarConceitos(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.root = Path(self.tmp.name)
        (self.root / "bibliografia" / "leituras-P1").mkdir(parents=True)
        (self.root / "textos").mkdir()
        (self.root / "docs" / "bibliografia").mkdir(parents=True)
        (self.root / "arquivados").mkdir()
        (self.root / "docs" / "registro-de-alteracoes.md").write_text("# Registro\n", encoding="utf-8")
        (self.root / "docs" / "bibliografia" / "matriz-fundamentacao.md").write_text(
            "| E | T | J | R | Páginas | Status | P |\n|---|---|---|---|---|---|---|\n"
            "| E05 Giro | Variável | x | R05 — Kimes et al. (1998) | não verificadas (teto 12 p.) | VM | P1 |\n",
            encoding="utf-8",
        )
        self.texto = self.root / "textos" / "cap.md"
        self.texto.write_text(
            "O giro (KIMES et al., 1998, [AV-R05-a]) e a capacidade (KIMES et al., 1998, [AV-R05-b]).\n"
            "O segmento (KAM INSIGHT, 2022, [AV-X02-a]).\n\n"
            "KIMES, Sheryl E. et al. Restaurant revenue management. *CHRAQ*, 1998. [AV]\n\n"
            "KAM INSIGHT. *Competitive socialising*. KAM Media, 2022. Disponível em: "
            "https://kaminsight.com/2023/07/x.pdf. [AV]\n",
            encoding="utf-8",
        )
        (self.root / "arquivados" / "velho.md").write_text("(KIMES, 1998, [AV-R05-a])\n", encoding="utf-8")

    def tearDown(self):
        self.tmp.cleanup()

    def escrever_checklist(self, linhas):
        caminho = self.root / "bibliografia" / "leituras-P1" / "checklist-conceitos.md"
        caminho.write_text("# Checklist\n\n" + CABECALHO + "".join(linhas), encoding="utf-8")

    def rodar(self, simular=False):
        return vc.main(self.root, simular=simular, agora=datetime(2026, 10, 14, 18, 30))

    def test_nada_conferido_nao_muda_nada(self):
        antes = self.texto.read_text(encoding="utf-8")
        self.escrever_checklist([linha("R05-a", "Giro", "", "KIMES, Sheryl E. et al.", REF_KIMES + " [AV]")])
        resultado = self.rodar()
        self.assertEqual(resultado.mudancas, {})
        self.assertEqual(self.texto.read_text(encoding="utf-8"), antes)
        self.assertNotIn("###", (self.root / "docs" / "registro-de-alteracoes.md").read_text(encoding="utf-8"))

    def test_conferido_troca_marcador_e_referencia(self):
        self.escrever_checklist([
            linha("R05-a", "Giro", "igual", "KIMES, Sheryl E. et al.", REF_KIMES + " p. 34"),
            linha("R05-b", "Capacidade", "", "KIMES, Sheryl E. et al.", REF_KIMES + " [AV]"),
        ])
        self.rodar()
        texto = self.texto.read_text(encoding="utf-8")
        self.assertIn("(KIMES et al., 1998, p. 34)", texto)
        self.assertIn("[AV-R05-b]", texto)  # conceito ainda pendente
        self.assertIn("KIMES, Sheryl E. et al. Restaurant revenue management. *CHRAQ*, p. 32–39, 1998.", texto)
        self.assertIn("KAM Media, 2022. Disponível em: https://kaminsight.com/2023/07/x.pdf. [AV]", texto)
        # arquivados/ fica intacto
        self.assertIn("[AV-R05-a]", (self.root / "arquivados" / "velho.md").read_text(encoding="utf-8"))
        # obra com conceito pendente continua VM
        self.assertIn("| VM |", (self.root / "docs" / "bibliografia" / "matriz-fundamentacao.md").read_text(encoding="utf-8"))

    def test_obra_completa_vira_vt_e_registra(self):
        self.escrever_checklist([
            linha("R05-a", "Giro", "igual", "KIMES, Sheryl E. et al.", REF_KIMES + " p. 34"),
            linha("R05-b", "Capacidade", "", "KIMES, Sheryl E. et al.", REF_KIMES + " p. 35-36."),
        ])
        self.rodar()
        matriz = (self.root / "docs" / "bibliografia" / "matriz-fundamentacao.md").read_text(encoding="utf-8")
        self.assertIn("| R05 — Kimes et al. (1998) | pp. 34; 35–36 | VT | P1 |", matriz)
        self.assertIn("p. 35–36)", self.texto.read_text(encoding="utf-8"))
        registro = (self.root / "docs" / "registro-de-alteracoes.md").read_text(encoding="utf-8")
        self.assertIn("## 2026/10/14", registro)
        self.assertIn("### 18:30", registro)
        self.assertIn("`textos/cap.md`", registro)

    def test_ano_no_link_nao_confunde(self):
        self.escrever_checklist([linha("X02-a", "Competitive socialising", "", "KAM INSIGHT", REF_KAM + " p. 4")])
        self.rodar()
        texto = self.texto.read_text(encoding="utf-8")
        self.assertIn("(KAM INSIGHT, 2022, p. 4)", texto)
        self.assertIn("KAM Media, 2022. Disponível em: https://kaminsight.com/2023/07/x.pdf.\n", texto)

    def test_segunda_execucao_nao_muda_nada(self):
        self.escrever_checklist([linha("R05-a", "Giro", "", "KIMES, Sheryl E. et al.", REF_KIMES + " p. 34")])
        self.rodar()
        self.assertEqual(self.rodar().mudancas, {})

    def test_simular_nao_grava(self):
        antes = self.texto.read_text(encoding="utf-8")
        self.escrever_checklist([linha("R05-a", "Giro", "", "KIMES, Sheryl E. et al.", REF_KIMES + " p. 34")])
        resultado = self.rodar(simular=True)
        self.assertTrue(resultado.mudancas)
        self.assertEqual(self.texto.read_text(encoding="utf-8"), antes)

    def test_relatorio_lista_divergencia(self):
        self.escrever_checklist([
            linha("R05-a", "Giro de mesa", '"Número de vezes que o assento é ocupado"', "KIMES, Sheryl E. et al.",
                  REF_KIMES + " [AV]"),
        ])
        self.texto.write_text("O giro de mesa é o inverso da permanência.\n", encoding="utf-8")
        self.rodar()
        relatorio = (self.root / "bibliografia" / "relatorio-conceitos.md").read_text(encoding="utf-8")
        self.assertIn("| leituras-P1 | 1 | 0 | 1 |", relatorio)
        self.assertIn("### R05-a — Giro de mesa", relatorio)
        self.assertIn("`textos/cap.md:1`", relatorio)


if __name__ == "__main__":
    unittest.main()
