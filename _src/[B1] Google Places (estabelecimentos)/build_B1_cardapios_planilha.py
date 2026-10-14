"""
Bloco B1 - junta os cardápios transcritos das luderias aprovadas numa planilha
de itens e preços.

Fonte: os 12 aprovados na triagem final cujo link do Google Maps leva a um
cardápio acessível (conferência de 10/10/2026). Cada cardápio foi transcrito
para um CSV em _data/raw/[B1] Estabelecimentos e cardapios/cardapios/transcricao/
(um arquivo por estabelecimento, separador ";"). A transcrição é manual para
imagens e PDFs e automática para páginas em texto (VUCA Food, Wix). As fontes
originais (PDF, imagens, HTML) ficam na pasta cardapios/ e fora do repositório.

Categorias fixas (_instrucoes/4_metodologia.md, Bloco B1):
  bebidas: drinks, refrigerante, cerveja, não alcoólicas
  entradas: batata, outras
  pratos principais: hambúrguer, pizza, outros
  sobremesas
  couvert ou taxa de jogo
  outros: adicionais, taxa de serviço (fora das categorias do método)
Doses, vinhos, garrafas e combos alcoólicos entram em "drinks". Água, suco,
café, energético, milk-shake e drink sem álcool entram em "não alcoólicas".
exige_preparo = "N" para item pronto (lata, garrafa, chopp, dose, água).

Cada linha é uma combinação item x variação (tamanho, dia da semana, combo).
Item sem preço no cardápio fica com preço vazio, não zero.

Saída em _data/processed/[B1] Estabelecimentos e cardapios/:
  B1_cardapios_itens_precos.xlsx  (abas itens, resumo, precos_subcategoria, fontes)

Uso:
    python3 "_src/[B1] Google Places (estabelecimentos)/build_B1_cardapios_planilha.py"
"""
import pathlib

import pandas as pd
from openpyxl import load_workbook
from openpyxl.styles import Alignment, Font
from openpyxl.utils import get_column_letter

ROOT = pathlib.Path(__file__).resolve().parents[2]
RAW = ROOT / "_data" / "raw" / "[B1] Estabelecimentos e cardapios" / "cardapios" / "transcricao"
PROCESSED = ROOT / "_data" / "processed" / "[B1] Estabelecimentos e cardapios"
TRIAGEM = PROCESSED / "B1_triagem_manual_metropoles_mais_100_avaliacoes.xlsx"
SAIDA = PROCESSED / "B1_cardapios_itens_precos.xlsx"

DATA_COLETA = "2026-10-10"

# arquivo de transcrição -> metadados da fonte. data_cardapio só quando o
# próprio arquivo informa (nome, metadado do PDF ou pasta de upload).
FONTES = {
    "ludus": dict(place_id="ChIJTaG5ALpZzpQRUDErQ-RkfTs",
                  url="https://drive.google.com/file/d/1s7GHW2xdsauEU55oIFPCojKY-nSrrKTB/view",
                  formato="PDF (Google Drive, linkado no site)", data_cardapio="2023-06-07",
                  status="extraído", nota="PDF de jun/2023: preços podem estar defasados"),
    "bodogami": dict(place_id="ChIJKeHwNv5ZzpQRlmzx9rCTWdM",
                     url="https://www.bodogami.com.br/wp-content/uploads/2025/03/cardapio_bodogami_19mar2025.pdf",
                     formato="PDF (site)", data_cardapio="2025-03-19", status="extraído", nota=""),
    "fanhour": dict(place_id="ChIJ_aN4OAxXzpQR0UH63sAeVCA", url="https://fanhour.com.br/menu",
                    formato="página do site (texto)", data_cardapio="", status="sem preços",
                    nota="o site lista os itens sem preço"),
    "shelf": dict(place_id="ChIJ6ZLMZw-XpgAR_OR6SwY5xKo",
                  url="https://www.vucafood.com.br/funminds/2365/cardapio-digital",
                  formato="cardápio digital VUCA Food (texto)", data_cardapio="", status="extraído", nota=""),
    "arcadea": dict(place_id="ChIJHSDPTgF5GZURKmSqKITyoGM",
                    url="https://arcadeapub.com.br/wp-content/uploads/2025/03/CARDAPIO-ARCADEA-3.pdf",
                    formato="PDF (site)", data_cardapio="2025-03", status="extraído",
                    nota="data aproximada pela pasta de upload"),
    "boardz": dict(place_id="ChIJY_lqHVLl3JQRvDHacOMDKuc", url="https://www.boardzgamepub.com.br/cardápio",
                   formato="imagens no site (Wix)", data_cardapio="", status="extraído", nota=""),
    "castelos": dict(place_id="ChIJbZRHQPRfzpQRz97-ZOg0yXA", url="https://www.castelosbar.com.br/cardapio",
                     formato="carrossel de imagens no site (Wix)", data_cardapio="", status="extraído", nota=""),
    "placegames": dict(place_id="ChIJkWsGmd1czpQRGLydxc29vbw", url="https://www.placegames.com.br/cardapio",
                       formato="imagens no site", data_cardapio="", status="extraído", nota=""),
    "sidequest": dict(place_id="ChIJ-97tiEeNpJIRb_eV7a-sxBs", url="https://ludotecasidequest.cloudfycardapio.com",
                      formato="cardápio digital Cloudfy (transcrito da tela)", data_cardapio="",
                      status="extraído", nota=""),
    "arenabg": dict(place_id="ChIJYTHwWgBbzpQRFenbJdM5cxU", url="https://www.arenabg.com.br/cardapio",
                    formato="página do site (texto, 4 abas)", data_cardapio="", status="extraído", nota=""),
    "luderia_carioca": dict(place_id="ChIJ90Gs_9rVmwAReA7MnIyPLTE", url="https://i.postimg.cc/T3qJVwfn/cardapio.jpg",
                            formato="imagem (botão Ver cardápio no site)", data_cardapio="",
                            status="extraído", nota=""),
}
# aprovado com cardápio acessível, mas sem transcrição
SEM_TRANSCRICAO = {
    "ChIJF9j3OCRbzpQRkk74_QtOk_0": dict(
        url="https://linktr.ee/coletivogeekbr", formato="PDF no Linktree", data_cardapio="",
        status="não extraído",
        nota="o download do PDF exige preencher formulário com e-mail; não preenchido"),
}

SUBCATEGORIAS = {
    "bebidas": {"drinks", "refrigerante", "cerveja", "não alcoólicas"},
    "entradas": {"batata", "outras"},
    "pratos principais": {"hambúrguer", "pizza", "outros"},
    "sobremesas": {"sobremesas"},
    "couvert ou taxa de jogo": {"couvert ou taxa de jogo"},
    "outros": {"adicionais", "taxa de serviço"},
}
ORDEM_CATEGORIAS = list(SUBCATEGORIAS)


def ler_transcricoes(triagem):
    nomes = triagem.set_index("place_id")[["nome", "capital_endereco"]]
    partes = []
    for arquivo, meta in FONTES.items():
        df = pd.read_csv(RAW / f"{arquivo}.csv", sep=";", dtype=str, keep_default_na=False)
        df["preco"] = pd.to_numeric(df["preco"].str.replace(",", "."), errors="raise")
        df.insert(0, "place_id", meta["place_id"])
        df.insert(1, "estabelecimento", nomes.loc[meta["place_id"], "nome"])
        df.insert(2, "capital", nomes.loc[meta["place_id"], "capital_endereco"])
        df["url_cardapio"] = meta["url"]
        df["formato_fonte"] = meta["formato"]
        df["data_cardapio"] = meta["data_cardapio"]
        df["data_coleta"] = DATA_COLETA
        partes.append(df)
    itens = pd.concat(partes, ignore_index=True)
    validar(itens)
    return itens


def validar(itens):
    erros = []
    for i, r in itens.iterrows():
        if r.categoria not in SUBCATEGORIAS or r.subcategoria not in SUBCATEGORIAS[r.categoria]:
            erros.append(f"linha {i}: {r.categoria} / {r.subcategoria} ({r.estabelecimento}, {r['item']})")
        if r.exige_preparo not in ("S", "N"):
            erros.append(f"linha {i}: exige_preparo = {r.exige_preparo!r}")
        if not r["item"].strip():
            erros.append(f"linha {i}: item vazio")
    if erros:
        raise ValueError("Transcrição inválida:\n" + "\n".join(erros))


def montar_resumo(itens):
    """Uma linha por estabelecimento; cada item conta num só grupo (o seu place_id)."""
    g = itens.groupby(["estabelecimento", "capital"], sort=False)
    resumo = pd.DataFrame({
        "linhas_item_variacao": g.size(),
        "com_preco": g["preco"].count(),
        "sem_preco": g["preco"].apply(lambda s: s.isna().sum()),
        "exige_preparo": g["exige_preparo"].apply(lambda s: (s == "S").sum()),
    })
    por_cat = itens.pivot_table(index=["estabelecimento", "capital"], columns="categoria",
                                values="item", aggfunc="count", fill_value=0)
    por_cat = por_cat.reindex(columns=ORDEM_CATEGORIAS, fill_value=0)
    resumo = resumo.join(por_cat).reset_index()
    total = resumo.drop(columns=["estabelecimento", "capital"]).sum()
    resumo.loc[len(resumo)] = {"estabelecimento": "Total", "capital": "", **total.to_dict()}

    # conferência: linhas somam o total e cada estabelecimento fecha por categoria
    corpo = resumo.iloc[:-1]
    for col in total.index:
        assert corpo[col].sum() == resumo.iloc[-1][col], col
    assert (corpo[ORDEM_CATEGORIAS].sum(axis=1) == corpo["linhas_item_variacao"]).all()
    assert (corpo["com_preco"] + corpo["sem_preco"] == corpo["linhas_item_variacao"]).all()
    assert resumo.iloc[-1]["linhas_item_variacao"] == len(itens)
    return resumo


def montar_precos_subcategoria(itens):
    """Mediana do preço por estabelecimento e subcategoria (só linhas com preço)."""
    com_preco = itens.dropna(subset=["preco"])
    tab = com_preco.pivot_table(index=["estabelecimento", "capital"],
                                columns=["categoria", "subcategoria"],
                                values="preco", aggfunc="median")
    tab.columns = [f"{c} | {s}" for c, s in tab.columns]
    ordem = [f"{c} | {s}" for c in ORDEM_CATEGORIAS for s in sorted(SUBCATEGORIAS[c])
             if f"{c} | {s}" in tab.columns]
    return tab[ordem].round(2).reset_index()


def montar_fontes(itens, triagem):
    linhas = []
    contagem = itens.groupby("place_id").size()
    for meta in FONTES.values():
        linhas.append({**meta, "linhas": int(contagem.get(meta["place_id"], 0))})
    for pid, meta in SEM_TRANSCRICAO.items():
        linhas.append({"place_id": pid, **meta, "linhas": 0})
    fontes = pd.DataFrame(linhas)
    nomes = triagem.set_index("place_id")[["nome", "capital_endereco"]]
    fontes.insert(1, "estabelecimento", fontes.place_id.map(nomes["nome"]))
    fontes.insert(2, "capital", fontes.place_id.map(nomes["capital_endereco"]))
    fontes["data_coleta"] = DATA_COLETA
    return fontes[["place_id", "estabelecimento", "capital", "status", "linhas", "url", "formato",
                   "data_cardapio", "data_coleta", "nota"]]


def formatar(caminho):
    wb = load_workbook(caminho)
    for ws in wb.worksheets:
        ws.freeze_panes = "A2"
        for c in ws[1]:
            c.font = Font(bold=True)
            c.alignment = Alignment(wrap_text=True, vertical="top")
        for col in ws.columns:
            letra = get_column_letter(col[0].column)
            maior = max(len(str(c.value)) if c.value is not None else 0 for c in col)
            ws.column_dimensions[letra].width = min(max(10, maior + 2), 60)
            cab = str(col[0].value)
            if cab == "preco" or " | " in cab:
                for c in col[1:]:
                    c.number_format = '"R$" #,##0.00'
        ws.auto_filter.ref = ws.dimensions
    wb["resumo"].cell(row=wb["resumo"].max_row, column=1).font = Font(bold=True)
    wb.save(caminho)


def main():
    triagem = pd.read_excel(TRIAGEM)
    triagem = triagem[triagem["resultado da triagem"] == "aprovado"]
    itens = ler_transcricoes(triagem)
    resumo = montar_resumo(itens)
    precos = montar_precos_subcategoria(itens)
    fontes = montar_fontes(itens, triagem)

    colunas = ["place_id", "estabelecimento", "capital", "secao_original", "item", "descricao",
               "variacao", "preco", "categoria", "subcategoria", "exige_preparo", "observacao",
               "url_cardapio", "formato_fonte", "data_cardapio", "data_coleta"]
    with pd.ExcelWriter(SAIDA) as w:
        itens[colunas].to_excel(w, sheet_name="itens", index=False)
        resumo.to_excel(w, sheet_name="resumo", index=False)
        precos.to_excel(w, sheet_name="precos_subcategoria", index=False)
        fontes.to_excel(w, sheet_name="fontes", index=False)
    formatar(SAIDA)

    print(f"{len(itens)} linhas de {itens.place_id.nunique()} estabelecimentos "
          f"({itens.preco.notna().sum()} com preço) -> {SAIDA.relative_to(ROOT)}")
    print(resumo.to_string(index=False))


if __name__ == "__main__":
    main()
