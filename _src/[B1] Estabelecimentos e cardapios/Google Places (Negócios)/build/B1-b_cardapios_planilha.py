"""
Bloco B1 - junta os cardápios transcritos das luderias aprovadas numa planilha
de itens e preços.

Fonte: os 12 aprovados na triagem final cujo link do Google Maps leva a um
cardápio acessível (conferência de 10/10/2026) e, desde 15/10/2026, mais 16
casas com cardápio em prints do Maps/Instagram, cardápio digital (Saipos e VUCA
Food), página Takeat ou imagem/PDF transcritos à mão. Os 13 primeiros desses
são convertidos por Cardápios/build/B1-b_cardapios_transcricoes.py; Alçapão,
Café Geek e Fortalúdica foram transcritos à mão das imagens. Em 16/10/2026, a busca
profunda (cardapios/B1_cardapios_busca_profunda.csv) trouxe o TabuClub (PDF transcrito à
mão), preços de imprensa para a Fan Hour e cardápios parciais (couvert ou poucos itens,
de site, imprensa ou TikTok) de LudoCafé, Game Of Boards, Garagem do Nerd e Joyjoy
(São Jogue e Asgard ganharam cardápio completo em 17/10). Em 31/10/2026, prints do
Instagram trouxeram o couvert de 10 casas que não o tinham no cardápio (arquivos
<casa>_couvert); no mesmo dia, o Day Pass da BoardZ (página "Como funciona" do
site) e o cartaz do couvert do LudoCafé (foto do Google Maps de jul/2024, que substitui
o valor de jun/2024 da imprensa). Cada cardápio foi transcrito
para um CSV em dados/[B1] Estabelecimentos e cardapios/_dados-brutos/cardapios/transcricao/
(um arquivo por estabelecimento, separador ";"). A transcrição é manual para
imagens e PDFs e automática para páginas em texto (VUCA Food, Wix). As fontes
originais (PDF, imagens, HTML) ficam em _dados-brutos/cardapios/ca_<cidade>/ca_<estabelecimento>/ e fora do repositório.

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
Preço por quantidade do mesmo item (chopp "2 x 475 ml", licor "2 shots"): fica
só o preço de 1 unidade; os preços de 2 ou mais unidades vão para a observação
da linha de 1 unidade (pedido do autor, 19/10/2026). A transcrição em
_dados-brutos/ continua fiel ao cardápio, porque é ela que a auditoria confere.
Linha de referência (decisão do autor, 22/10/2026): o mesmo item (casa, seção e
nome) pode ter várias linhas, por tamanho, combo ou print de outra data. Todas
ficam na planilha, mas só uma entra na cesta e nas medianas (linha_referencia =
"S"): a do cardápio mais recente, sem combo e no menor tamanho (o menor preço;
sem preço, o menor número da variação). Variações de sabor ou de dia da semana
não são tamanho e ficam todas como referência. motivo_fora_referencia diz por
que uma linha ficou de fora.
Item sem preço no cardápio fica com preço vazio, não zero. Quando a
transcrição traz a coluna data_cardapio (prints com datas diferentes), ela
vale linha a linha; vazia, vale a data da fonte em FONTES.

Saída em dados/[B1] Estabelecimentos e cardapios/:
  B1_cardapios_itens_precos.xlsx  (abas itens, resumo, precos_subcategoria, fontes)

Uso:
    python3 "_src/[B1] Estabelecimentos e cardapios/Google Places (Negócios)/build/B1-b_cardapios_planilha.py"
"""
# Caminhos: _src/extras/ (log comum) e outros/ do objeto (auxiliares); log em ../logs/
import sys
from pathlib import Path
_AQUI = Path(__file__).resolve()
sys.path[:0] = [str(_AQUI.parents[3] / "extras"), str(_AQUI.parents[1] / "outros")]
from log_execucao import registrar_execucao  # noqa: E402
if __name__ == "__main__":
    registrar_execucao(__file__)

import pathlib
import re

import pandas as pd
from openpyxl import load_workbook
from openpyxl.styles import Alignment, Font
from openpyxl.utils import get_column_letter

ROOT = pathlib.Path(__file__).resolve().parents[4]
RAW = ROOT / "dados" / "[B1] Estabelecimentos e cardapios" / "_dados-brutos" / "cardapios" / "transcricao"
PROCESSED = ROOT / "dados" / "[B1] Estabelecimentos e cardapios"
TRIAGEM = PROCESSED / "estabelecimentos/3_triagem/B1_triagem_manual_metro_av100.xlsx"
NOVAS = PROCESSED / "acervo_jogos/B1_acervodejogos_luderias_novas.csv"
SAIDA = PROCESSED / "cardapios" / "B1_cardapios_itens_precos.xlsx"

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
                    formato="página do site (texto) + preços de matéria de imprensa", data_cardapio="",
                    status="parcial", data_coleta="2026-10-16",
                    nota="itens do site (sem preço); 26 preços e a taxa de jogo da matéria São Paulo para "
                         "Crianças, atualizada em 05/10/2026; 24 itens seguem sem preço"),
    "shelf": dict(place_id="ChIJ6ZLMZw-XpgAR_OR6SwY5xKo",
                  url="https://www.vucafood.com.br/funminds/2365/cardapio-digital",
                  formato="cardápio digital VUCA Food (texto)", data_cardapio="", status="extraído", nota=""),
    "arcadea": dict(place_id="ChIJHSDPTgF5GZURKmSqKITyoGM",
                    url="https://arcadeapub.com.br/wp-content/uploads/2025/03/CARDAPIO-ARCADEA-3.pdf",
                    formato="PDF (site)", data_cardapio="2025-03", status="extraído",
                    nota="data aproximada pela pasta de upload"),
    "boardz": dict(place_id="ChIJY_lqHVLl3JQRvDHacOMDKuc", url="https://www.boardzgamepub.com.br/cardápio",
                   formato="imagens no site (Wix)", data_cardapio="", status="extraído", nota=""),
    "boardz_couvert": dict(place_id="ChIJY_lqHVLl3JQRvDHacOMDKuc", url="https://www.boardzgamepub.com.br/",
                           formato="página \"Como funciona\" do site", data_cardapio="", status="extraído",
                           data_coleta="2026-10-31", nota="só o Day Pass; sem entrada, jogo avulso pago por título"),
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
    # 15/10/2026: prints de fotos do Maps/Instagram (data por linha = data da foto)
    **{arq: dict(place_id=pid, url="fotos do Google Maps / Instagram", formato="prints transcritos à mão",
                 data_cardapio="", status="extraído", data_coleta="2026-10-12",
                 nota="mesmo item em fotos de datas diferentes: fica a mais recente")
       for arq, pid in [("chefonplay", "ChIJc3F7ka83J5URQZ1XTl-_iak"), ("cineplay", "ChIJJz8-gcY3J5URYdZrEXdHaAk"),
                        ("comdado", "ChIJpzB8zc2XpgARoJTUu90J6Pw"), ("covil", "ChIJ7_DDAlH1zpQRJVJ0UHnItH8"),
                        ("encounter", "ChIJZz29dnVXzpQRvRh7_YKyUN4"), ("flowgames", "ChIJa3UsDhRczpQRPPSuDl6acO8"),
                        ("insidegames", "ChIJdUv4La46WpMRnBvNknmOqWo"), ("ludotecabgc", "ChIJ15nLgwAwWpMRY1whwD29ZSo"),
                        ("utopia", "ChIJN8BZeb85WpMRgVKT05caxB4")]},
    "bardomago": dict(place_id="ChIJRcWOaPabpgARDvX2Bad0qb0",
                      url="https://www.vucafood.com.br/funminds/2219/cardapio-digital",
                      formato="cardápio digital VUCA Food (texto)", data_cardapio="", status="extraído",
                      data_coleta="2026-10-12", nota=""),
    "latabuleria": dict(place_id="ChIJ-17ZQDG9pgARc-AxpXmaNRU", url="https://latabuleria.saipos.com/home",
                        formato="cardápio de delivery Saipos (API)", data_cardapio="", status="extraído",
                        data_coleta="2026-10-12", nota="preço de delivery; jogos à venda fora"),
    "tocadorato": dict(place_id="ChIJ41pgHNFDGZURC7yTegyn7nU", url="https://tocadoratopizzasejogos.saipos.com/home",
                       formato="cardápio de delivery Saipos (API)", data_cardapio="", status="extraído",
                       data_coleta="2026-10-12", nota="preço de delivery"),
    "cartola": dict(place_id="ChIJrT_EWwBZzpQRGAZzptZbtsY", url="cardápio Takeat (link do perfil)",
                    formato="página Takeat exportada em CSV", data_cardapio="", status="extraído",
                    data_coleta="2026-10-12", nota="só entradas, sobremesas e drinks foram exportados"),
    "alcapao": dict(place_id="ChIJ3ekLtDjl3JQRHwtNgmINgLo",
                    url="https://static.wixstatic.com/media/113cf2_d07290d78d5140cbaf4c18b47ceb4f4a~mv2.jpeg",
                    formato="imagem no site (Wix), transcrita à mão", data_cardapio="", status="extraído",
                    data_coleta="2026-10-12", nota="cafeteria: sem bebida alcoólica no cardápio"),
    "cafegeek": dict(place_id="ChIJfyav9YI9uAARjwbBqcRm2_k", url="https://www.instagram.com/cafegeekvv/",
                     formato="destaque 'Cardápio' do Instagram, transcrito à mão", data_cardapio="",
                     status="extraído", data_coleta="2026-10-12",
                     nota="sala medieval por hora e grupo na categoria couvert"),
    # 17/10/2026: cardápios achados pelo autor (PDFs baixados e links salvos nos favoritos)
    **{arq: dict(place_id=pid, url=url, formato=formato, data_cardapio=data, status="extraído",
                 data_coleta="2026-10-17", nota=nota)
       for arq, pid, url, formato, data, nota in [
           ("asgard", "ChIJzdFNP3AyWpMRH2P6HEuhE-I", "https://asgard.app.br/cardapio",
            "página do site (texto), exportada pelo cardapio_coletor", "", "passaporte de jogo na categoria couvert"),
           ("dungeon", "ChIJiZJ_DnIDz5QRaVafFCXGkUE", "https://dungeongamesstore.goomer.app/menu",
            "cardápio digital Goomer, exportado pelo cardapio_coletor", "",
            "doces avulsos vinham como variações de um item; corrigido"),
           ("nalaland", "ChIJRUjwU66WoGgRzc9yJU7jkwM", "https://nalaland.menudino.com/",
            "cardápio de delivery Menudino, exportado pelo cardapio_coletor", "", "preço de delivery"),
           ("balboas", "ChIJ0yXbI35IxwcR0_jLi-uINUU", "PDF baixado pelo autor (Canva)",
            "PDF (Canva), transcrito à mão", "2026-01", "data pelo metadado do PDF"),
           ("saojogue", "ChIJoTlvBfMbFgcRHvuCKHBQrXQ", "PDF baixado pelo autor (Canva)",
            "PDF (Canva), transcrito à mão", "2026-10", "unidade Bela Vista; data pelo metadado do PDF"),
           ("coletivogeek", "ChIJF9j3OCRbzpQRkk74_QtOk_0", "PDF baixado pelo autor (Linktree)",
            "PDF (Canva), transcrito à mão", "2026-05", "data pelo metadado do PDF"),
           ("playeasy", "ChIJNcHw7jNYzpQRKRHPOrb4jEw",
            "https://www.canva.com/design/DAGT9cLv7FI/Vey8vkMqP5ilBVHe0H8n7w/view",
            "design no Canva, transcrito da tela", "", "só lanches prontos; sem taxa de jogo no cardápio"),
       ]},
    # 17/10/2026: prints enviados pelo autor (data por linha: foto do Maps ou idade do story)
    **{arq: dict(place_id=pid, url=url, formato="prints transcritos à mão", data_cardapio="", status="extraído",
                 data_coleta="2026-10-17", nota=nota)
       for arq, pid, url, nota in [
           ("ccgfloripa", "ChIJawIVeV0JM0oR5BtnD_poQeA", "foto do Google Maps (jul. 2023)",
            "logo da Taverna Nerd Store, loja da própria CCG; só lanches e fritas"),
           ("jogasampa", "ChIJn7uU0RNbzpQRI4GI9KHOo_s", "foto do Google Maps (out. 2023)",
            "quadro de letras: bebidas sem álcool e doces"),
           ("tubaleria", "ChIJsU5BAwBRzpQRAgLVvqg68os", "destaque \"Cardápio\" do Instagram",
            "data do story pela idade exibida (45, 38, 31 e 21 semanas); sem bebidas nos prints"),
       ]},
    "fortaludica": dict(place_id="ChIJyXjE650xWpMRJL-J6QbGkt4",
                        url="https://drive.google.com/uc?export=download&id=1cl7YIKdJhuuhNCUKAO0-96czajLGInqJ",
                        formato="PDF (Canva), transcrito à mão", data_cardapio="2025-12", status="extraído",
                        data_coleta="2026-10-12", nota=""),
    # Busca profunda de 16/10/2026 (registro em cardapios/B1_cardapios_busca_profunda.csv)
    "tabuclub": dict(place_id="ChIJOcVssmeDmQARZZrnWu2mnwA",
                     url="https://drive.google.com/file/d/1-KDTgvYRZKe4R9KCWVQHRD5xiWqjSgPW/view",
                     formato="PDF no Google Drive (link do Linktree), transcrito à mão", data_cardapio="",
                     status="extraído", data_coleta="2026-10-16", nota="sem couvert no cardápio"),
    "ludocafe": dict(place_id="ChIJx5jr3zGXpgARQGx9eX7TDmY",
                     url="https://www.tiktok.com/@ossaboresdomundo/video/7437960404552224056",
                     formato="legenda de vídeo do TikTok",
                     data_cardapio="", status="parcial", data_coleta="2026-10-16",
                     nota="10 itens de destaque (nov/2024); couvert em ludocafe_couvert; sem refrigerante nem cerveja"),
    "ludocafe_couvert": dict(place_id="ChIJx5jr3zGXpgARQGx9eX7TDmY", url="",
                             formato="foto do cartaz na casa (Google Maps), enviada pelo autor", data_cardapio="2024-07",
                             status="extraído", data_coleta="2026-10-31",
                             nota="só o couvert; substitui o do Diário do Comércio (jun/2024)"),
    "garagemdonerd": dict(place_id="ChIJsUAT-dObpgARCT2C5QpnVKU",
                          url="https://diariodocomercio.com.br/negocios/bares-jogos-luderias-belo-horizonte/",
                          formato="matéria de imprensa", data_cardapio="", status="parcial",
                          data_coleta="2026-10-16",
                          nota="só o couvert; garagemdonerd.com.br/cardapio existe, mas bloqueia leitura automática"),
    "gameofboards": dict(place_id="ChIJu1yUroF_mQAR7qxqAfxKSw4", url="https://www.gameofboards.com.br/",
                         formato="página do site (texto)", data_cardapio="", status="parcial",
                         data_coleta="2026-10-16",
                         nota="só o passaporte; cardápio no iFood (Game of Boards - Ludobar & Pizzaria), "
                              "que só abre no navegador"),
    "joyjoy": dict(place_id="ChIJOczn8z7l3JQRNBEL_ZJ3iQo",
                   url="https://curitibandoemfamilia.com.br/experiencias/ctba-indoor/joyjoy-cafe/",
                   formato="guia on-line", data_cardapio="", status="parcial", data_coleta="2026-10-16",
                   nota="só a taxa de jogo (página de ago/2024)"),
    # 31/10/2026: couvert de prints do Instagram (posts e destaques) enviados pelo autor,
    # um arquivo <casa>_couvert por casa (data por linha = data do post ou do story)
    **{f"{arq}_couvert": dict(place_id=pid, url=f"https://www.instagram.com/{perfil}/",
                              formato="print do Instagram (post ou destaque), transcrito à mão", data_cardapio="",
                              status="extraído", data_coleta="2026-10-31", nota="só o couvert ou a taxa de entrada")
       for arq, pid, perfil in [
           ("tabuclub", "ChIJOcVssmeDmQARZZrnWu2mnwA", "tabuclubnit"),
           ("cafegeek", "ChIJfyav9YI9uAARjwbBqcRm2_k", "cafegeekvv"),
           ("tubaleria", "ChIJsU5BAwBRzpQRAgLVvqg68os", "tubaleria"),
           ("placegames", "ChIJkWsGmd1czpQRGLydxc29vbw", "lojaplacegames"),
           ("encounter", "ChIJZz29dnVXzpQRvRh7_YKyUN4", "encounter.bg"),
           ("covil", "ChIJ7_DDAlH1zpQRJVJ0UHnItH8", "covilgb"),
           ("luderia_carioca", "ChIJ90Gs_9rVmwAReA7MnIyPLTE", "luderiacariocajogos"),
           ("bardomago", "ChIJRcWOaPabpgARDvX2Bad0qb0", "bardo.mago"),
           ("tocadorato", "ChIJ41pgHNFDGZURC7yTegyn7nU", "tocadorato_oficial"),
           ("nalaland", "ChIJRUjwU66WoGgRzc9yJU7jkwM", "nalaland.jogos"),
       ]},
}
# aprovado com cardápio acessível, mas sem transcrição
SEM_TRANSCRICAO = {
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
        df = so_preco_unitario(df)
        df.insert(0, "place_id", meta["place_id"])
        df.insert(1, "estabelecimento", nomes.loc[meta["place_id"], "nome"])
        df.insert(2, "capital", nomes.loc[meta["place_id"], "capital_endereco"])
        df["url_cardapio"] = meta["url"]
        df["formato_fonte"] = meta["formato"]
        por_linha = df["data_cardapio"] if "data_cardapio" in df else pd.Series("", index=df.index)
        df["data_cardapio"] = por_linha.where(por_linha != "", meta["data_cardapio"])
        df["data_coleta"] = meta.get("data_coleta", DATA_COLETA)
        partes.append(df)
    itens = pd.concat(partes, ignore_index=True)
    validar(itens)
    marcar_referencia(itens)
    return itens


# "2 x 475 ml", "3x", "2 shots de 25 ml": quantidade de unidades na variação
QUANTIDADE = re.compile(r"^\s*(\d+)\s*(?:x\b|shots?\b)", re.IGNORECASE)


def so_preco_unitario(df):
    """Tira as linhas de 2 ou mais unidades de um item que também tem a linha de 1 unidade.

    O preço tirado vai para a observação da linha de 1 unidade. Item vendido só em
    pacote (ex.: drink game de 4, 8 ou 9 shots) fica como está, porque não há preço unitário."""
    if "variacao" not in df:
        return df
    qtd = df["variacao"].str.extract(QUANTIDADE, expand=False).astype(float).fillna(1)
    tirar, notas = [], {}
    for _, g in df.groupby(["secao_original", "item"], sort=False):
        unidade = g.index[qtd[g.index] == 1]
        multiplos = g.index[qtd[g.index] > 1]
        if len(unidade) != 1 or not len(multiplos):
            continue
        tirar += list(multiplos)
        notas[unidade[0]] = "; ".join(
            f"{df.at[i, 'variacao']}: R$ {df.at[i, 'preco']:.2f}".replace(".", ",") for i in multiplos)
    for i, nota in notas.items():
        obs = df.at[i, "observacao"]
        df.at[i, "observacao"] = f"{obs}; {nota}" if obs else nota
    return df.drop(index=tirar).reset_index(drop=True)


# variação que é tamanho ou porção (concorre pela linha de referência); o resto
# (sabor, dia da semana, com ou sem álcool) é variante e fica sempre como referência
TAMANHO = re.compile(r"\d+(?:,\d+)?\s*(?:g|kg|ml|l)\b|^[pmg]$|pequen|médi|grande|individual|completa|"
                     r"porção|unidades|bolas?\b|burgers?\b|shots?\b|smash|^lata$|^hambúrguer$", re.IGNORECASE)
NUMERO = re.compile(r"(\d+(?:,\d+)?)")


def marcar_referencia(itens):
    """Marca uma linha de referência por item: cardápio mais recente, sem combo, menor tamanho."""
    itens["linha_referencia"] = "S"
    itens["motivo_fora_referencia"] = ""
    var = itens["variacao"].fillna("").astype(str) if "variacao" in itens else pd.Series("", index=itens.index)
    data = itens["data_cardapio"].fillna("").astype(str)

    def fora(idx, motivo):
        itens.loc[idx, "linha_referencia"] = "N"
        itens.loc[idx, "motivo_fora_referencia"] = motivo

    for _, g in itens.groupby(["place_id", "secao_original", "item"], sort=False):
        if len(g) < 2:
            continue
        datas = data[g.index]
        if datas.nunique() > 1 and (datas != "").all():
            antigas = g.index[datas < datas.max()]
            fora(antigas, "cardápio mais antigo")
            g = g.drop(antigas)
        v = var[g.index]
        combo = v.str.contains("combo", case=False)
        if combo.any() and not combo.all():
            fora(g.index[combo], "combo")
            g = g[~combo]
            v = v[~combo]
        tamanho = g.index[(v == "") | v.str.contains(TAMANHO)]
        if len(tamanho) < 2:
            continue
        num = v[tamanho].str.extract(NUMERO, expand=False).str.replace(",", ".").astype(float)
        chave = pd.DataFrame({"preco": itens.loc[tamanho, "preco"], "num": num}).sort_values(
            ["preco", "num"], na_position="last", kind="stable")
        fora(chave.index[1:], "tamanho maior")


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
        "linhas_referencia": g["linha_referencia"].apply(lambda s: (s == "S").sum()),
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
    """Mediana do preço por estabelecimento e subcategoria (só linhas de referência com preço)."""
    com_preco = itens[itens.linha_referencia == "S"].dropna(subset=["preco"])
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
        linhas.append({"data_coleta": DATA_COLETA, **meta, "linhas": int(contagem.get(meta["place_id"], 0))})
    for pid, meta in SEM_TRANSCRICAO.items():
        linhas.append({"data_coleta": DATA_COLETA, "place_id": pid, **meta, "linhas": 0})
    fontes = pd.DataFrame(linhas)
    nomes = triagem.set_index("place_id")[["nome", "capital_endereco"]]
    fontes.insert(1, "estabelecimento", fontes.place_id.map(nomes["nome"]))
    fontes.insert(2, "capital", fontes.place_id.map(nomes["capital_endereco"]))
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
    triagem = triagem[triagem["resultado da triagem"] == "aprovado"][["place_id", "nome", "capital_endereco"]]
    # luderias novas do acervo de jogos (fora da triagem manual)
    novas = pd.read_csv(NOVAS)[["place_id", "nome", "capital_endereco"]]
    triagem = pd.concat([triagem, novas]).drop_duplicates("place_id")
    itens = ler_transcricoes(triagem)
    resumo = montar_resumo(itens)
    precos = montar_precos_subcategoria(itens)
    fontes = montar_fontes(itens, triagem)

    colunas = ["place_id", "estabelecimento", "capital", "secao_original", "item", "descricao",
               "variacao", "preco", "linha_referencia", "motivo_fora_referencia", "categoria", "subcategoria",
               "exige_preparo", "observacao",
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
