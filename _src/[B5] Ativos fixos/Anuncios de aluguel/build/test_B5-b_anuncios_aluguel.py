"""Testes do B5-b_anuncios_aluguel.py com coletas falsas em pasta temporária.

Uso: python3 -m unittest "_src/[B5] Ativos fixos/Anuncios de aluguel/build/test_B5-b_anuncios_aluguel.py"
"""

import contextlib
import importlib.util
import io
import tempfile
import unittest
from pathlib import Path

import pandas as pd

_SPEC = importlib.util.spec_from_file_location("b5_aluguel", Path(__file__).resolve().parent / "B5-b_anuncios_aluguel.py")
b = importlib.util.module_from_spec(_SPEC)
_SPEC.loader.exec_module(b)

COLS = ["portal", "id", "url", "titulo", "tipo", "operacao", "aluguel", "condominio", "iptu", "condominio_iptu",
        "area_m2", "quartos", "banheiros", "vagas", "bairro", "cidade", "endereco", "anunciante", "publicado",
        "busca_url", "pagina", "total_busca", "data_coleta"]
ZAP_LOJA = "https://www.zapimoveis.com.br/aluguel/loja-salao/ba+salvador/?pagina=1"
ZAP_SALA = "https://www.zapimoveis.com.br/aluguel/conjunto-comercial-sala/ba+salvador/"
OLX_GERAL = "https://www.olx.com.br/imoveis/estado-ba/grande-salvador/salvador?o=2"


def anuncio(id_, aluguel, area, bairro, busca=ZAP_LOJA, portal="zap", titulo="Ponto comercial", **extra):
    return {"portal": portal, "id": str(id_), "titulo": titulo, "operacao": "aluguel", "aluguel": str(aluguel),
            "area_m2": str(area), "bairro": bairro, "cidade": "Salvador", "busca_url": busca, "pagina": "1",
            "data_coleta": "2026-11-02", **extra}


class TestAnunciosAluguel(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        raiz = Path(self.tmp.name)
        b.IN_DIR, b.OUT_DIR = raiz / "in", raiz / "out"
        b.CENSO, b.APELIDOS = raiz / "censo.csv", raiz / "apelidos.csv"
        b.IN_DIR.mkdir()
        pd.DataFrame({"cd_mun": [2927408] * 6 + [1100205],
                      "nm_bairro": ["Pituba", "Caminho das Árvores", "Graça", "Barra", "Beiru / Tancredo Neves",
                                    "Centro Administrativo da Bahia - CAB", "Tiradentes"]}).to_csv(b.CENSO, index=False)
        b.APELIDOS.write_text("bairro_portal;bairro_oficial\nCAB;Centro Administrativo da Bahia - CAB\n")

        linhas = [anuncio(100 + i, 9000 + 100 * i, 150, "Pituba", condominio_iptu="1500", total_busca="40") for i in range(6)]
        linhas += [anuncio(200 + i, 3000 + 100 * i, 50, "caminho das arvores") for i in range(5)]
        linhas += [
            anuncio(300, 5000, 1, "Pituba"),                                  # R$ 5.000/m²: extremo
            anuncio(301, 9020, 151, "Pituba"),                                # quase igual ao 100
            anuncio(302, 4000, 60, "Graça", busca=ZAP_SALA, titulo="Sala comercial"),
            anuncio(303, 20000, 400, "Tancredo Neves", titulo="Galpão"),
            anuncio(304, 6000, 120, "CAB"),
            anuncio(305, 7000, 130, "Iguatemi"),                              # fora do Censo
            anuncio(5000001, 2500, 70, "Pituba", busca=OLX_GERAL, portal="olx", titulo="Apartamento com sala ampla e box blindex"),
            anuncio(5000002, 2400, 35, "Barra", busca=OLX_GERAL, portal="olx", titulo="Aluga-se sala comercial"),
            anuncio(5000003, 9000, 160, "Barra", busca=OLX_GERAL, portal="olx", titulo="Loja de esquina"),
        ]
        # Lojas de shopping com a mesma área e aluguel: só os encargos as distinguem.
        shopping = dict(busca=OLX_GERAL, portal="olx", titulo="Loja no shopping")
        linhas += [
            anuncio(5000010, 10000, 219, "Pituba", condominio="15365", iptu="3096", **shopping),
            anuncio(5000011, 10000, 219, "Pituba", condominio="14852", iptu="2852", **shopping),
            anuncio(5000012, 10000, 219, "Pituba", condominio="15365", iptu="3096", **shopping),  # repete o 5000010
            anuncio(5000013, 20000, 580, "Pituba", condominio="0", iptu="875", **shopping),
            anuncio(5000014, 20000, 580, "Pituba", iptu="875", **shopping),  # o mesmo, condomínio vazio em vez de isento
        ]
        pd.DataFrame(linhas).reindex(columns=COLS).fillna("").to_csv(
            b.IN_DIR / "2026-11-02_1846_zap_anuncios_aluguel.csv", sep=";", index=False, encoding="utf-8-sig")
        (b.IN_DIR / "2026-11-02_zap_anuncios_aluguel (1).csv").write_text("x")

        self.saida = io.StringIO()
        with contextlib.redirect_stdout(self.saida):
            self.t = b.montar(b.ler_coletas())
        self.df = self.t["Anúncios de Aluguel"].set_index("id")

    def tearDown(self):
        self.tmp.cleanup()

    def test_avisa_csv_fora_do_padrao(self):
        self.assertIn("(1).csv fora do padrão", self.saida.getvalue())

    def test_segmento_e_subtipo(self):
        self.assertEqual(self.df.loc["5000001", "segmento"], "residencial")
        self.assertEqual(self.df.loc["5000002", ["segmento", "subtipo"]].tolist(), ["comercial", "sala"])
        self.assertEqual(self.df.loc["5000003", "subtipo"], "loja_ponto")
        self.assertEqual(self.df.loc["302", "subtipo"], "sala")      # pela busca
        self.assertEqual(self.df.loc["100", "subtipo"], "loja_ponto")
        # "/casa-comercial/" é busca comercial, não a "/casa-" do residencial
        url = "https://www.zapimoveis.com.br/aluguel/casa-comercial/ba+salvador/"
        self.assertEqual(b.segmento_de(url, "Casa", "Casa para alugar com 3 quartos"), ("comercial", "busca"))
        # busca com dois tipos: o subtipo vem do anúncio, não da URL
        dois = url + "?tipos=imovel-comercial_comercial%2Cponto-comercial_comercial"
        self.assertEqual(b.subtipo_de("comercial", dois, "Imóvel comercial", "Imóvel comercial para alugar"), "outro")
        self.assertEqual(b.subtipo_de("comercial", dois, "Ponto comercial/Loja/Box", "Ponto comercial para alugar"), "loja_ponto")
        self.assertEqual(b.subtipo_de("comercial", url + "?tipos=ponto-comercial_comercial", "Casa", "Casa"), "loja_ponto")

    def test_bairros_oficiais_e_area_6_4(self):
        self.assertEqual(self.df.loc["200", "bairro"], "Caminho das Árvores")
        self.assertEqual(self.df.loc["303", "bairro"], "Beiru / Tancredo Neves")
        self.assertEqual(self.df.loc["304", "bairro"], "Centro Administrativo da Bahia - CAB")
        self.assertEqual(self.df.loc["305", ["bairro", "bairro_no_censo"]].tolist(), ["Iguatemi", "não"])
        self.assertEqual(self.df.loc["100", "area_6_4"], "Pituba/Itaigara")
        self.assertEqual(self.df.loc["5000003", "area_6_4"], "Barra/Graça")
        self.assertEqual(self.df.loc["200", "area_6_4"], b.DEMAIS)

    def test_extremo_sai_e_quase_duplicata_fica(self):
        self.assertNotIn("300", self.df.index)
        self.assertIn("301", self.df.index)
        pares = self.t["Possíveis Duplicatas de Aluguel"]
        self.assertTrue(((pares["id_a"].isin(["100", "301"])) & (pares["id_b"].isin(["100", "301"]))).any())

    def test_lojas_com_encargos_distintos_nao_sao_duplicatas(self):
        self.assertIn("5000011", self.df.index)
        self.assertEqual(len({"5000010", "5000012"} & set(self.df.index)), 1)
        self.assertEqual(len({"5000013", "5000014"} & set(self.df.index)), 1)

    def test_iptu_anual_vira_mensal(self):
        df = pd.DataFrame({
            "titulo": ["Ponto para alugar, 580 m² por R$ 20.875,00/mês - Pituba",    # anual pelo título
                       "Loja para alugar, 219 m² por R$ 28.460,20/mês - Itaigara",   # mensal pelo título (31%)
                       "Prédio para Locação em Salvador",                            # anual: 211% do aluguel
                       "Loja na Pituba",                                             # mensal: 10%
                       "Loja sem IPTU"],
            "aluguel": [20000, 10000, 87750, 9000, 5000],
            "condominio": [None, 15365, 36800, 500, 300],
            "iptu": [10500, 3095.2, 185500, 900, None],
            "condominio_iptu": [None, 18460.2, 222300, 1400, None],
        })
        with contextlib.redirect_stdout(io.StringIO()):
            r = b.ajustar_iptu(df)
        self.assertEqual(r["iptu"].tolist()[:4], [875.0, 3095.2, round(185500 / 12, 2), 900])
        self.assertTrue(pd.isna(r["iptu"].iloc[4]))
        self.assertEqual(r["iptu_ajuste"].tolist(), ["anual pelo título", "", "anual por passar de 50% do aluguel", "", ""])
        self.assertEqual(r["iptu_informado"].iloc[0], 10500)
        self.assertEqual(r["condominio_iptu"].iloc[2], 36800 + round(185500 / 12, 2))
        self.assertTrue(pd.isna(r["condominio_iptu"].iloc[0]))  # sem condomínio informado, sem soma

    def test_porte_e_custo_de_ocupacao(self):
        self.assertEqual(self.df.loc["100", "porte_plano"], "sim")
        self.assertEqual(self.df.loc["200", "porte_plano"], "não")
        self.assertEqual(self.df.loc["100", "encargos_m2"], 10.0)
        self.assertEqual(self.df.loc["100", "custo_ocupacao_m2"], 70.0)
        self.assertTrue(pd.isna(self.df.loc["200", "custo_ocupacao_m2"]))

    def test_resumos_fecham_e_marcam_amostra(self):
        bairro = self.t["Aluguel Pedido por Bairro"]
        self.assertEqual(bairro["anuncios"].sum(), len(self.df))
        pouca = bairro[bairro["anuncios"] < b.MIN_AMOSTRA]
        self.assertTrue(pouca["aluguel_m2_p25"].isna().all())
        self.assertTrue(pouca["amostra_suficiente"].eq("não").all())

        area = self.t["Aluguel Pedido por Área do 6.4"].set_index("area_6_4")
        recorte = self.df[self.df["subtipo"].eq("loja_ponto") & self.df["porte_plano"].eq("sim")]
        self.assertEqual(area["anuncios"].sum(), len(recorte))
        self.assertEqual(area.index[0], "Pituba/Itaigara")
        self.assertEqual(area.loc["Pituba/Itaigara", "anuncios"], 7)
        self.assertEqual(area.loc["Pituba/Itaigara", "anuncios_com_encargos"], 6)
        self.assertEqual(area.loc["Pituba/Itaigara", "encargos_m2_mediana"], 10.0)
        self.assertEqual(self.df.loc["100", "encargos_pct_aluguel"], round(1500 / 9000, 3))

    def test_cobertura_por_busca(self):
        cob = self.t["Cobertura das Buscas de Aluguel"]
        loja = cob[cob["busca"].str.contains("loja-salao")].iloc[0]
        self.assertNotIn("pagina=", loja["busca"])
        self.assertEqual(loja["total_busca"], 40)
        self.assertEqual(loja["anuncios_lidos"], 16)
        olx = cob[cob["portal"].eq("olx")].iloc[0]
        self.assertNotIn("o=2", olx["busca"])
        self.assertTrue(pd.isna(olx["cobertura"]))


if __name__ == "__main__":
    unittest.main()
