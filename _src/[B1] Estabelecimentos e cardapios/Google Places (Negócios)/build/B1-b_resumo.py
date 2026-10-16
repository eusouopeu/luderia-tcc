"""
Bloco B1 - planilha-resumo das luderias do estudo: um estabelecimento por linha,
com Google Maps, horários, entorno, Instagram, cardápio (cesta), acervo e o
volume de avaliações do B2.

Objeto: as aprovadas da triagem manual, menos as que saíram do objeto
(EXCLUIDAS), mais as luderias novas do acervo de jogos (54 casas em 15/10/2026).
Cada place_id ocupa uma linha.

Fontes (dados/[B1] Estabelecimentos e cardapios/, salvo indicação):
  estabelecimentos/3_triagem/B1_aprovadas_metro_av100.xlsx e
  acervo_jogos/B1_acervodejogos_luderias_novas.csv  -> endereço, nota, volume
  estabelecimentos/B1_horarios.csv                    -> horários (Places API)
  _dados-brutos/entornos/*_entorno_resumo.csv         -> entorno (coletor do Maps;
      vale o export mais recente de cada casa; distância a estação a mais de
      50 km, de outra cidade, fica vazia)
  redes_sociais/B1_instagram_resumo_notion.csv        -> Instagram (retrato do
      Notion "A - Estabelecimentos" de 15/10/2026; período 01/09 a 01/10 com
      colaborações da grade)
  cardapios/B1_cardapios_itens_precos.xlsx            -> cesta por pessoa
  acervo_jogos/B1_jogos_dos_acervos.csv e B1_acervodejogos_luderias_novas.csv
                                                      -> títulos do acervo
  dados/[B2] Avaliacoes recentes/B2_cobertura_coleta.csv -> avaliações no recorte

Cesta por pessoa (textos/planejamento/registro_previo_luderia.md): couvert ou
taxa de jogo + uma bebida + uma entrada ou um prato principal, com os preços do
cardápio da própria casa, em três níveis: baixa (percentil 25 de cada
categoria), mediana e alta (percentil 75). Couvert que não aparece no cardápio
coletado não quer dizer que a casa não cobra: a coluna couvert_no_cardapio diz
"não encontrado", os preços de couvert ficam vazios e a cesta também (decisão do
autor, 16/10/2026). Cobrança por sala ou por
hora (Café Geek) não é couvert por pessoa e fica de fora. Na planilha, as
cestas são fórmulas sobre as colunas de preço.

Saída: dados/[B1] Estabelecimentos e cardapios/estabelecimentos/B1_resumo_estabelecimentos.xlsx
  abas estabelecimentos, cesta, por_capital (fórmulas sobre estabelecimentos),
  dicionario.

Uso:
    python3 "_src/[B1] Estabelecimentos e cardapios/Google Places (Negócios)/build/B1-b_resumo.py"
"""
# Caminhos: _src/extras/ (log comum) e outros/ do objeto (auxiliares); log em ../logs/
import sys
from pathlib import Path
_AQUI = Path(__file__).resolve()
sys.path[:0] = [str(_AQUI.parents[3] / "extras"), str(_AQUI.parents[1] / "outros")]
from log_execucao import registrar_execucao  # noqa: E402
if __name__ == "__main__":
    registrar_execucao(__file__)

import pandas as pd
from openpyxl import Workbook
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.utils import get_column_letter

ROOT = _AQUI.parents[4]
B1 = ROOT / "dados" / "[B1] Estabelecimentos e cardapios"
B2 = ROOT / "dados" / "[B2] Avaliacoes recentes"
SAIDA = B1 / "estabelecimentos" / "B1_resumo_estabelecimentos.xlsx"
EXCLUIDAS = {"Machado Games", "Ilusões Industriais"}  # fora do objeto desde 14/10/2026

# Nome do estabelecimento em B1_jogos_dos_acervos.csv -> nome na triagem.
APELIDOS_ACERVO = {
    "Alçapão Jogos De Tabuleiro": "Alçapão Jogos", "Arena BG": "Arena BG | Jogos de Tabuleiro | Hamburgueria",
    "Bodogami": "Bodogami Restaurante e Cafeteria", "Comdado Bar": "Comdado Bar e Jogos",
    "Ludoteca SideQuest": "Ludoteca Sidequest", "Place Games Jogos de Tabuleiro": "Place Games",
    "Shelf bar": "Shelf Bar e Jogos",
}
DIAS = ["segunda", "terca", "quarta", "quinta", "sexta", "sabado", "domingo"]
FONTE = "Arial"


def casas():
    a = pd.read_excel(B1 / "estabelecimentos/3_triagem/B1_aprovadas_metro_av100.xlsx")
    a = a[~a["nome"].isin(EXCLUIDAS)].assign(origem="triagem manual")
    n = pd.read_csv(B1 / "acervo_jogos/B1_acervodejogos_luderias_novas.csv").rename(
        columns={"endereco_google": "endereco"}).assign(origem="acervodejogos")
    cols = ["place_id", "nome", "capital_endereco", "endereco", "avaliacao_media", "volume_avaliacoes",
            "link_google_maps", "origem"]
    return pd.concat([a[cols], n[cols]]).drop_duplicates("place_id").reset_index(drop=True)


def horarios():
    h = pd.read_csv(B1 / "estabelecimentos/B1_horarios.csv", sep=";", encoding="utf-8-sig")
    return h[["place_id", "dias_abertos", "horas_semana", "abre_cedo", "fecha_tarde", *DIAS]]


def entorno():
    pasta = B1 / "_dados-brutos" / "entornos"
    partes = []
    for f in sorted(pasta.glob("*_entorno_resumo*.csv")):
        if "parcial" in f.name:
            continue
        d = pd.read_csv(f, sep=";", encoding="utf-8-sig")
        d["_arquivo"] = f.stat().st_mtime
        partes.append(d)
    e = pd.concat(partes).sort_values("_arquivo").drop_duplicates("place_id", keep="last")
    dist = e["dist_estacoes_metro_mais_proxima_lida_m"]
    e["dist_metro_m"] = dist.where(dist <= 50000)
    return e.rename(columns={
        "qt_estacoes_metro_500m": "metro_500m", "qt_estacoes_metro_1000m": "metro_1000m",
        "qt_shoppings_porte_500m": "shopping_porte_500m", "qt_shoppings_porte_1000m": "shopping_porte_1000m",
        "dist_shoppings_mais_proxima_lida_m": "dist_shopping_m"})[
        ["place_id", "metro_500m", "metro_1000m", "dist_metro_m", "shopping_porte_500m", "shopping_porte_1000m",
         "dist_shopping_m"]]


def instagram():
    i = pd.read_csv(B1 / "redes_sociais/B1_instagram_resumo_notion.csv", sep=";", encoding="utf-8-sig")
    return i.drop(columns=["estabelecimento"]).rename(columns={"observacao": "obs_instagram"})


def cesta():
    it = pd.read_excel(B1 / "cardapios/B1_cardapios_itens_precos.xlsx", sheet_name="itens")
    it = it.dropna(subset=["preco"])
    linhas = []
    for pid, g in it.groupby("place_id"):
        cov = g[(g.categoria == "couvert ou taxa de jogo") & ~g["item"].str.contains("sala", case=False)]
        beb = g[g.categoria == "bebidas"].preco
        com = g[g.categoria.isin(["entradas", "pratos principais"])].preco
        q = lambda s, p: round(float(s.quantile(p)), 2) if len(s) else None
        linhas.append(dict(
            place_id=pid, itens_com_preco=len(g), couvert_no_cardapio="sim" if len(cov) else "não encontrado",
            couvert_p25=q(cov.preco, .25), couvert_mediana=q(cov.preco, .5), couvert_p75=q(cov.preco, .75),
            bebida_p25=q(beb, .25), bebida_mediana=q(beb, .5), bebida_p75=q(beb, .75),
            entrada_ou_prato_p25=q(com, .25), entrada_ou_prato_mediana=q(com, .5), entrada_ou_prato_p75=q(com, .75),
            hamburguer_mediana=q(g[g.subcategoria == "hambúrguer"].preco, .5),
            batata_mediana=q(g[g.subcategoria == "batata"].preco, .5),
            cerveja_mediana=q(g[g.subcategoria == "cerveja"].preco, .5),
            refrigerante_mediana=q(g[g.subcategoria == "refrigerante"].preco, .5),
            drinks_mediana=q(g[g.subcategoria == "drinks"].preco, .5),
            data_cardapio=", ".join(sorted({str(x) for x in g.data_cardapio.dropna() if str(x) != "nan"})) or "sem data"))
    return pd.DataFrame(linhas)


def acervo(base):
    j = pd.read_csv(B1 / "acervo_jogos/B1_jogos_dos_acervos.csv", sep=None, engine="python")
    j["nome"] = j["estabelecimento"].replace(APELIDOS_ACERVO)
    t = j.groupby("nome").agg(titulos_acervo=("jogo", "nunique"), fonte_acervo=("fonte", "first")).reset_index()
    t = base[["place_id", "nome"]].merge(t, on="nome", how="inner")
    sem = set(t.place_id)
    n = pd.read_csv(B1 / "acervo_jogos/B1_acervodejogos_luderias_novas.csv")
    extra = n[~n.place_id.isin(sem)][["place_id", "titulos_acervo"]].assign(fonte_acervo="acervodejogos (contagem da página)")
    return pd.concat([t[["place_id", "titulos_acervo", "fonte_acervo"]], extra])


def b2():
    c = pd.read_csv(B2 / "B2_cobertura_coleta.csv", sep=";", encoding="utf-8-sig")
    return c[["place_id", "avaliacoes_no_periodo", "no_periodo_com_texto"]].rename(
        columns={"avaliacoes_no_periodo": "avaliacoes_b2", "no_periodo_com_texto": "avaliacoes_b2_com_texto"})


# Coluna -> (grupo, descrição, fonte)
DIC = {
    "place_id": ("Identificação", "Identificador do lugar no Google", "Google Places API"),
    "nome": ("Identificação", "Nome no Google Maps", "Google Places API"),
    "capital_endereco": ("Identificação", "Capital da região metropolitana do endereço", "triagem do B1"),
    "origem": ("Identificação", "Como a casa entrou no B1: triagem manual das metrópoles ou acervodejogos", "B1"),
    "endereco": ("Google Maps", "Endereço no Google", "Google Places API"),
    "avaliacao_media": ("Google Maps", "Nota média (1 a 5)", "Google Places API, 09/2026; novas em 12/10/2026"),
    "volume_avaliacoes": ("Google Maps", "Nº de avaliações no Google", "Google Places API, 09/2026; novas em 12/10/2026"),
    "link_google_maps": ("Google Maps", "Link do lugar no Maps", "Google Places API"),
    "dias_abertos": ("Horários", "Dias da semana com funcionamento (0 a 7)", "Places API regularOpeningHours, 15/10/2026"),
    "horas_semana": ("Horários", "Horas abertas por semana (turno que passa da meia-noite conta no dia em que abre)", "idem"),
    "abre_cedo": ("Horários", "Horário de abertura mais cedo da semana", "idem"),
    "fecha_tarde": ("Horários", "Fechamento mais tarde da semana (depois da meia-noite: 24 + h, ex. 25:00)", "idem"),
    **{d: ("Horários", f"Turnos de {d} (vazio = fechado)", "idem") for d in DIAS},
    "metro_500m": ("Entorno", "Estações de metrô até 500 m", "coletor de entorno do Maps, 15/10/2026"),
    "metro_1000m": ("Entorno", "Estações de metrô até 1000 m", "idem"),
    "dist_metro_m": ("Entorno", "Distância (m) à estação de metrô mais próxima lida; vazio = nenhuma na cidade ou leitura de outra cidade (> 50 km)", "idem"),
    "shopping_porte_500m": ("Entorno", "Shoppings de porte (OSM shop=mall, área ≥ 5.000 m²) até 500 m; vazio = porte não buscado", "idem + OpenStreetMap"),
    "shopping_porte_1000m": ("Entorno", "Shoppings de porte até 1000 m; vazio = porte não buscado", "idem + OpenStreetMap"),
    "dist_shopping_m": ("Entorno", "Distância (m) ao shopping mais próximo lido (qualquer porte)", "idem"),
    "perfil_instagram": ("Instagram", "@ do perfil", "Notion A - Estabelecimentos, 15/10/2026"),
    "seguidores": ("Instagram", "Seguidores", "idem (cabeçalho do perfil ou coletor)"),
    "n_posts_total": ("Instagram", "Nº de posts declarado pelo perfil", "idem"),
    "primeiro_post": ("Instagram", "Data do primeiro post", "idem"),
    "n_posts_periodo": ("Instagram", "Posts de 01/09 a 01/10/2026, próprios e colaborações da grade", "CSVs de posts do coletor"),
    "curtidas_periodo": ("Instagram", "Curtidas desses posts", "idem"),
    "comentarios_periodo": ("Instagram", "Comentários desses posts", "idem"),
    "obs_instagram": ("Instagram", "Ressalva da coleta", "B1"),
    "itens_com_preco": ("Cardápio", "Linhas item × variação com preço no cardápio", "B1_cardapios_itens_precos.xlsx"),
    "couvert_no_cardapio": ("Cardápio", "Couvert ou taxa de jogo por pessoa encontrado no cardápio: sim ou não encontrado (não quer dizer que não cobra)", "idem"),
    "cesta_baixa": ("Cardápio", "Couvert + bebida + entrada ou prato, percentil 25 de cada categoria (R$)", "fórmula na aba cesta"),
    "cesta_mediana": ("Cardápio", "Idem, medianas (R$)", "fórmula na aba cesta"),
    "cesta_alta": ("Cardápio", "Idem, percentil 75 (R$)", "fórmula na aba cesta"),
    "titulos_acervo": ("Acervo", "Títulos distintos no acervo publicado", "acervodejogos, Ludopedia, Rejoy ou lista da casa"),
    "fonte_acervo": ("Acervo", "De onde veio a lista", "B1"),
    "avaliacoes_b2": ("B2", "Avaliações no recorte do B2 (até '3 meses atrás')", "B2_cobertura_coleta.csv"),
    "avaliacoes_b2_com_texto": ("B2", "Dessas, com texto", "idem"),
}
CESTA_COLS = ["place_id", "nome", "capital_endereco", "itens_com_preco", "couvert_no_cardapio",
              "couvert_p25", "couvert_mediana", "couvert_p75", "bebida_p25", "bebida_mediana", "bebida_p75",
              "entrada_ou_prato_p25", "entrada_ou_prato_mediana", "entrada_ou_prato_p75",
              "cesta_baixa", "cesta_mediana", "cesta_alta",
              "hamburguer_mediana", "batata_mediana", "cerveja_mediana", "refrigerante_mediana", "drinks_mediana",
              "data_cardapio"]
REAIS = '"R$" #,##0.00'


def estilo_cabecalho(ws, n_cols, cor="DDEBF7"):
    for c in range(1, n_cols + 1):
        cel = ws.cell(row=1, column=c)
        cel.font = Font(name=FONTE, bold=True)
        cel.fill = PatternFill("solid", fgColor=cor)
        cel.alignment = Alignment(wrap_text=True, vertical="top")
    ws.freeze_panes = "C2"
    ws.auto_filter.ref = ws.dimensions


def escrever(ws, df):
    ws.append(list(df.columns))
    for r in df.itertuples(index=False):
        ws.append([None if (isinstance(v, float) and pd.isna(v)) else v for v in r])


def larguras(ws, padrao=14, especiais=None):
    especiais = especiais or {}
    for i, cel in enumerate(ws[1], start=1):
        ws.column_dimensions[get_column_letter(i)].width = especiais.get(cel.value, padrao)
    for row in ws.iter_rows(min_row=2):
        for c in row:
            c.font = Font(name=FONTE)


def main():
    base = casas()
    ces = cesta()
    df = (base.merge(horarios(), on="place_id", how="left")
          .merge(entorno(), on="place_id", how="left")
          .merge(instagram(), on="place_id", how="left")
          .merge(ces[["place_id", "itens_com_preco", "couvert_no_cardapio"]], on="place_id", how="left")
          .merge(acervo(base), on="place_id", how="left")
          .merge(b2(), on="place_id", how="left"))
    assert df.place_id.is_unique and len(df) == len(base)
    df = df.sort_values(["capital_endereco", "nome"]).reset_index(drop=True)
    for c in ["cesta_baixa", "cesta_mediana", "cesta_alta"]:
        df[c] = None
    ordem = [c for c in DIC if c in df.columns]
    df = df[ordem]

    wb = Workbook()
    # --- cesta ---
    wc = wb.active
    wc.title = "cesta"
    tc = base[["place_id", "nome", "capital_endereco"]].merge(ces, on="place_id").sort_values(["capital_endereco", "nome"])
    tc["cesta_baixa"] = tc["cesta_mediana"] = tc["cesta_alta"] = None
    tc = tc[CESTA_COLS]
    escrever(wc, tc)
    col = {c: get_column_letter(i + 1) for i, c in enumerate(CESTA_COLS)}
    for r in range(2, len(tc) + 2):
        for nivel, suf in [("cesta_baixa", "p25"), ("cesta_mediana", "mediana"), ("cesta_alta", "p75")]:
            wc[f"{col[nivel]}{r}"] = (f"=IF(OR({col['couvert_' + suf]}{r}=\"\",{col['bebida_' + suf]}{r}=\"\",{col['entrada_ou_prato_' + suf]}{r}=\"\"),\"\","
                                      f"{col['couvert_' + suf]}{r}+{col['bebida_' + suf]}{r}+{col['entrada_ou_prato_' + suf]}{r})")
        for c in CESTA_COLS[5:22]:
            wc[f"{col[c]}{r}"].number_format = REAIS
    estilo_cabecalho(wc, len(CESTA_COLS))
    larguras(wc, 12, {"nome": 34, "capital_endereco": 16, "place_id": 12, "data_cardapio": 20})
    nc = len(tc) + 1

    # --- estabelecimentos ---
    we = wb.create_sheet("estabelecimentos", 0)
    escrever(we, df)
    ce = {c: get_column_letter(i + 1) for i, c in enumerate(df.columns)}
    rng = lambda c: f"cesta!${col[c]}$2:${col[c]}${nc}"
    for r in range(2, len(df) + 2):
        for nivel in ["cesta_baixa", "cesta_mediana", "cesta_alta"]:
            we[f"{ce[nivel]}{r}"] = f"=IFERROR(INDEX({rng(nivel)},MATCH($A{r},{rng('place_id')},0)),\"\")"
            we[f"{ce[nivel]}{r}"].number_format = REAIS
        we[f"{ce['avaliacao_media']}{r}"].number_format = "0.0"
        for c in ["volume_avaliacoes", "seguidores", "n_posts_total", "curtidas_periodo", "comentarios_periodo"]:
            we[f"{ce[c]}{r}"].number_format = "#,##0"
    # Faixas de cor por grupo de colunas.
    cores = {"Identificação": "D9D9D9", "Google Maps": "DDEBF7", "Horários": "E2EFDA", "Entorno": "FFF2CC",
             "Instagram": "FCE4D6", "Cardápio": "EDE2F6", "Acervo": "DEEBF7", "B2": "F2F2F2"}
    estilo_cabecalho(we, len(df.columns))
    for i, c in enumerate(df.columns, start=1):
        we.cell(row=1, column=i).fill = PatternFill("solid", fgColor=cores[DIC[c][0]])
    larguras(we, 12, {"nome": 34, "endereco": 40, "link_google_maps": 22, "obs_instagram": 40, "place_id": 12,
                      "capital_endereco": 16, **{d: 16 for d in DIAS}})
    ne = len(df) + 1

    # --- por_capital (fórmulas sobre estabelecimentos) ---
    wp = wb.create_sheet("por_capital", 1)
    caps = sorted(df.capital_endereco.unique())
    cab = ["capital", "casas", "com cardápio", "cesta mediana (média, R$)", "seguidores (média)",
           "posts no período (média)", "horas por semana (média)", "nota média (média)", "avaliações B2 (soma)"]
    wp.append(cab)
    E = lambda c: f"estabelecimentos!${ce[c]}$2:${ce[c]}${ne}"
    cap = E("capital_endereco")
    for i, c in enumerate(caps, start=2):
        wp.append([c,
                   f"=COUNTIF({cap},A{i})",
                   f"=COUNTIFS({cap},A{i},{E('cesta_mediana')},\">0\")",
                   f"=IFERROR(AVERAGEIFS({E('cesta_mediana')},{cap},A{i},{E('cesta_mediana')},\">0\"),\"\")",
                   f"=IFERROR(AVERAGEIFS({E('seguidores')},{cap},A{i}),\"\")",
                   f"=IFERROR(AVERAGEIFS({E('n_posts_periodo')},{cap},A{i}),\"\")",
                   f"=IFERROR(AVERAGEIFS({E('horas_semana')},{cap},A{i}),\"\")",
                   f"=IFERROR(AVERAGEIFS({E('avaliacao_media')},{cap},A{i}),\"\")",
                   f"=SUMIF({cap},A{i},{E('avaliacoes_b2')})"])
    t = len(caps) + 2
    wp.append(["Total", f"=SUM(B2:B{t - 1})", f"=SUM(C2:C{t - 1})",
               f"=IFERROR(AVERAGEIF({E('cesta_mediana')},\">0\"),\"\")", f"=AVERAGE({E('seguidores')})",
               f"=AVERAGE({E('n_posts_periodo')})", f"=AVERAGE({E('horas_semana')})", f"=AVERAGE({E('avaliacao_media')})",
               f"=SUM(I2:I{t - 1})"])
    wp.append(["Conferência (total − linhas da aba estabelecimentos; deve ser 0)", f"=B{t}-COUNTA({E('place_id')})"])
    for r in range(2, t + 1):
        wp[f"D{r}"].number_format = REAIS
        for c in "EFGH":
            wp[f"{c}{r}"].number_format = "#,##0.0"
    estilo_cabecalho(wp, len(cab))
    larguras(wp, 16, {"capital": 18})
    for c in range(1, len(cab) + 1):
        wp.cell(row=t, column=c).font = Font(name=FONTE, bold=True)
    wp.cell(row=t + 1, column=1).font = Font(name=FONTE, italic=True)
    wp.cell(row=t + 1, column=1).alignment = Alignment(wrap_text=True)

    # --- dicionario ---
    wd = wb.create_sheet("dicionario")
    wd.append(["aba", "coluna", "grupo", "descrição", "fonte"])
    for c in df.columns:
        g, d, f = DIC[c]
        wd.append(["estabelecimentos", c, g, d, f])
    for c in CESTA_COLS[3:]:
        if c not in df.columns:
            wd.append(["cesta", c, "Cardápio", "Preço da categoria no cardápio da casa (percentil indicado no nome; vazio = sem preço no cardápio coletado; no couvert, não encontrado, o que não quer dizer que a casa não cobra)" if c != "data_cardapio" else "Data do cardápio, quando a fonte informa",
                       "B1_cardapios_itens_precos.xlsx (aba itens)"])
    wd.append(["por_capital", "—", "Resumo", "Contagens e médias por capital, com fórmulas sobre a aba estabelecimentos; média das cestas só entre casas com cardápio", "—"])
    estilo_cabecalho(wd, 5)
    wd.freeze_panes = "A2"
    larguras(wd, 18, {"descrição": 80, "fonte": 45})
    for row in wd.iter_rows(min_row=2):
        for c in row:
            c.alignment = Alignment(wrap_text=True, vertical="top")

    wb.save(SAIDA)
    print(f"{len(df)} casas, {len(tc)} com cesta -> {SAIDA.relative_to(ROOT)}")
    print(df.capital_endereco.value_counts().sort_index().to_string())
    print("soma por capital:", df.capital_endereco.value_counts().sum(), "| total:", len(df))


if __name__ == "__main__":
    main()
