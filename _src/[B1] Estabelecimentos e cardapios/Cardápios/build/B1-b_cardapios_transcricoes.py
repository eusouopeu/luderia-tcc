"""
Bloco B1 - converte os cardápios extraídos fora da transcrição manual para o
formato de _dados-brutos/cardapios/transcricao/ (um CSV por estabelecimento,
";"), que o B1-b_cardapios_planilha.py junta na planilha de itens e preços.

Fontes convertidas:
  - prints (cardapios/B1_cardapios_prints_itens.csv): 9 casas, fotos do Maps
    ou do Instagram transcritas à mão; o mesmo item em fotos de datas
    diferentes fica só na mais recente (foto sem data perde para a datada);
  - cardápios digitais (cardapios/B1_cardapios_digitais_itens.csv): Bardo Mago,
    La Tabuleria e Toca do Rato (Saipos e VUCA Food); jogos à venda e avisos
    ("Esclarecimentos") ficam de fora;
  - couvert lúdico dos prints de práticas (B1_cardapios_prints_praticas.csv);
  - Cartola: CSVs exportados da página Takeat (_dados-brutos/cardapios/
    ca_sao_paulo/ca_cartola/); com dois preços, o primeiro é o de tabela e o
    segundo vai para a observação.

Categoria e subcategoria seguem as categorias fixas de
_instrucoes/4_metodologia.md (Bloco B1): regras por palavra-chave no item e
na seção original, na ordem de CLASSIFICAR. exige_preparo = "N" para item
pronto (lata, garrafa, long neck, chopp, dose, água, energético).

Uso:
    python3 "_src/[B1] Estabelecimentos e cardapios/Cardápios/build/B1-b_cardapios_transcricoes.py"
"""
# Caminhos: _src/extras/ (log comum) e outros/ do objeto (auxiliares); log em ../logs/
import sys
from pathlib import Path
_AQUI = Path(__file__).resolve()
sys.path[:0] = [str(_AQUI.parents[3] / "extras"), str(_AQUI.parents[1] / "outros")]
from log_execucao import registrar_execucao  # noqa: E402
if __name__ == "__main__":
    registrar_execucao(__file__)

import re
import unicodedata

import pandas as pd

ROOT = _AQUI.parents[4]
PROCESSED = ROOT / "dados" / "[B1] Estabelecimentos e cardapios"
CARD = PROCESSED / "cardapios"
BRUTOS = PROCESSED / "_dados-brutos" / "cardapios"
SAIDA = BRUTOS / "transcricao"
CARTOLA = BRUTOS / "ca_sao_paulo" / "ca_cartola"

COLUNAS = ["secao_original", "item", "descricao", "variacao", "preco", "categoria", "subcategoria",
           "exige_preparo", "observacao", "data_cardapio"]

# estabelecimento no arquivo de origem -> nome do CSV de transcrição
ARQUIVO = {
    "Chef on Play": "chefonplay", "Cineplay SC": "cineplay", "Comdado Bar": "comdado",
    "Covil Game Bar": "covil", "Encounter": "encounter", "Flow Games": "flowgames",
    "Inside Games": "insidegames", "Ludoteca BGC": "ludotecabgc", "Utopia Games & Food": "utopia",
    "Bardo Mago": "bardomago", "La Tabuleria": "latabuleria", "Toca do Rato": "tocadorato",
}
# Seções que não são consumo no salão.
FORA = {"Jogos de Tabuleiro", "Esclarecimentos"}
# Seções cujo conteúdo o nome não diz: (estabelecimento, seção) -> classe.
SECAO_FIXA = {
    ("Comdado Bar", "Especiais"): ("bebidas", "drinks", "S"),  # combos e dobro de shots
    ("Chef on Play", "Carnes"): ("pratos principais", "hambúrguer", "S"),  # hambúrgueres por proteína
}


def norm(t):
    t = unicodedata.normalize("NFD", str(t or "")).encode("ascii", "ignore").decode().lower()
    return re.sub(r"\s+", " ", t.replace("-", " "))


def tem(t, *palavras):
    return any(re.search(rf"\b{p}", t) for p in palavras)


CERVEJA = ("cerveja", "chop", "heineken", "budweiser", "stella", "ipa\\b", "pilsen", "corona", "long neck",
           "brahma", "skol", "eisenbahn", "amstel", "spaten", "original\\b", "lager", "weiss", "apa\\b",
           "baden", "colorado", "patagonia", "michelob", "becks", "praya", "sol\\b", "lagunitas")
REFRI = ("refri", "coca", "guarana\\b", "sprite", "fanta\\b", "pepsi", "schweppes", "h2o", "kuat", "tonica",
         "itubaina")
NAO_ALC = ("agua", "suco", "cafe", "espresso", "expresso", "cappuccino", "capuccino", "cha\\b", "cha ",
           "energetico", "red bull", "monster", "milk", "shake", "limonada", "soda italiana", "chocolate quente",
           "mate", "sem alcool", "nao alcoolico", "drinkids", "sem gas", "com gas", "achocolatado", "leite")
ALCOOL = ("dose", "drink", "caipi", "gin", "vodka", "vodca", "whisk", "cachaca", "vinho", "tequila", "rum\\b",
          "shot", "batida", "saque", "sake", "aperol", "licor", "destilad", "mule", "negroni", "mojito", "spritz",
          "smirnoff", "jager", "campari", "martini", "margarita", "sangria", "absolut", "jack daniel",
          "johnnie", "ballantine", "chivas", "cuba libre", "pina colada", "drinks", "alcoolic", "sex on")
PRONTO = ("lata", "garrafa", "long neck", "chop", "dose", "agua", "energetico", "red bull", "monster", "350",
          "600 ml", "600ml", "1l", "2l", "smirnoff ice", "h2oh")


def bebida(t, secao):
    """Subcategoria de bebida; t = item + seção normalizados."""
    if tem(t, "energetico", "energy", "monster", "red bull"):
        return "não alcoólicas"
    if tem(t, "sem alcool", "nao alcoolico", "drinkids", "zero alcool") or tem(secao, "nao alcool", "drinkids"):
        return "não alcoólicas"
    if tem(t, *ALCOOL) and not tem(t, "milk", "shake") or tem(secao, "drink", "dose", "destilad", "shot",
                                                                "caipira", "batida", "alcool"):
        if tem(t, *CERVEJA) and not tem(secao, "drink"):
            return "cerveja"
        return "drinks"
    if tem(t, *CERVEJA) or tem(secao, "cerveja"):
        return "cerveja"
    if tem(t, *REFRI) or tem(secao, "refrigerante"):
        return "refrigerante"
    return "não alcoólicas"


def classificar(secao, item, descricao=""):
    """(categoria, subcategoria, exige_preparo) ou None para linha fora do cardápio."""
    s, i = norm(secao), norm(item)
    t = f"{i} {s}"
    if tem(t, "couvert", "taxa de jogo", "ludico", "day use"):
        return "couvert ou taxa de jogo", "couvert ou taxa de jogo", "N"
    if tem(t, "taxa de servico", "servico 10"):
        return "outros", "taxa de serviço", "N"
    if tem(s, "adicion", "extra", "molho", "paes") or tem(i, "^ad ", "adicional", "^molho", "^maionese",
                                                           "^barbecue", "^geleia", "^mostarda", "pao sem gluten"):
        return "outros", "adicionais", "N"
    if tem(i, "crepe") or tem(s, "crepe"):
        doce = tem(s, "doce") or tem(i, "nutella", "doce de leite", "banana", "chocolate")
        return ("sobremesas", "sobremesas", "S") if doce else ("pratos principais", "outros", "S")
    if tem(i, "sorvete", "brownie", "petit gateau", "acai", "churros", "pudim", "banana split"):
        return "sobremesas", "sobremesas", "S"
    if tem(t, "milk", "shake") and tem(t, *ALCOOL, "alcoolic") and not tem(t, "nao alcool", "sem alcool"):
        return "bebidas", "drinks", "S"
    if tem(t, "milk", "shake"):
        return "bebidas", "não alcoólicas", "S"
    if tem(s, "bebida", "drink", "dose", "cerveja", "destilad", "shot", "caipira", "batida", "suco", "refriger",
           "cafe", "musicais", "energetico") or tem(i, *CERVEJA, *REFRI, *ALCOOL) or tem(i, "^agua", "^suco",
                                                                                         "^cha ", "energetico",
                                                                                         "^cafe", "espresso",
                                                                                         "cappuccino"):
        sub = bebida(t, s)
        pronto = tem(t, *PRONTO) or sub in ("cerveja", "refrigerante") and not tem(t, "drink")
        return "bebidas", sub, "N" if pronto else "S"
    if tem(s, "sobremesa", "doce", "acai", "crepes doces", "pizzas doces") or tem(i, "sorvete", "brownie",
                                                                                   "petit gateau", "acai",
                                                                                   "churros", "pudim"):
        return "sobremesas", "sobremesas", "S"
    if tem(i, "batata", "fritas") and not tem(i, "hamburg", "burger", "lanche", "\\+ fritas", "com fritas"):
        return "entradas", "batata", "S"
    if tem(t, "pizza", "rodizio de pizza"):
        return "pratos principais", "pizza", "S"
    if tem(t, "burger", "burguer", "hamburg", "lanche", "power-up", "rodizio de mini", "rodizio de hamb",
           "trio degust", "x-", "smash") or tem(s, "burger", "burguer", "hamburg", "lanche"):
        return "pratos principais", "hambúrguer", "S"
    if tem(s, "porc", "petisco", "entrada", "salgado", "salada", "conjuracao", "fenda do biquini"):
        return "entradas", "outras", "S"
    return "pratos principais", "outros", "S"


def preco_br(v):
    if pd.isna(v) or str(v).strip() == "":
        return None
    v = re.sub(r"[^\d,\.]", "", str(v))
    if "," in v:
        v = v.replace(".", "").replace(",", ".")
    return float(v) if v else None


def linha(secao, item, descricao, variacao, preco, observacao, data, estab=""):
    cls = SECAO_FIXA.get((estab, secao)) or classificar(secao, item, descricao)
    return dict(secao_original=secao, item=str(item).strip(), descricao=re.sub(r"\s+", " ", str(descricao or "")).strip(),
                variacao=variacao or "", preco=preco, categoria=cls[0], subcategoria=cls[1], exige_preparo=cls[2],
                observacao=observacao or "", data_cardapio=data or "")


def de_prints():
    p = pd.read_csv(CARD / "B1_cardapios_prints_itens.csv", sep=None, engine="python", dtype=str)
    p["ordem"] = p["data_foto"].where(p["data_foto"] != "s/d", "0000")
    p["chave"] = p["item"].map(norm) + "|" + p["descricao"].fillna("").map(norm).str[:40]
    p = p.sort_values("ordem", ascending=False).drop_duplicates(["estabelecimento", "chave"])
    out = {}
    for r in p.sort_index().itertuples():
        data = "" if r.data_foto == "s/d" else r.data_foto
        out.setdefault(r.estabelecimento, []).append(
            linha(r.categoria, r.item, r.descricao, "", preco_br(r.preco_rs), f"print: {r.arquivo}", data,
                  r.estabelecimento))
    pr = pd.read_csv(CARD / "B1_cardapios_prints_praticas.csv", sep=None, engine="python", dtype=str)
    for r in pr[pr["tipo"].str.contains("couvert", na=False)].itertuples():
        out.setdefault(r.estabelecimento, []).append(
            linha("Couvert", "Couvert lúdico", r.descricao, r.descricao, preco_br(r.valor_rs),
                  f"print: {r.arquivo}", "" if r.data_foto == "s/d" else r.data_foto))
    return out


def de_digitais():
    d = pd.read_csv(CARD / "B1_cardapios_digitais_itens.csv", sep=None, engine="python", dtype=str)
    d = d[~d["categoria"].isin(FORA)]
    out = {}
    for r in d.itertuples():
        obs = f"{r.plataforma}; menor preço entre tamanhos" if r.a_partir == "sim" else r.plataforma
        out.setdefault(r.estabelecimento, []).append(
            linha(r.categoria, r.item, r.descricao, "", preco_br(r.preco_rs), obs, ""))
    return out


def de_cartola():
    secoes = {"Cartola - Entradas 1.csv": "Entradas", "Cartola - Entradas 2.csv": "Entradas",
              "Cartola - Sobremesas.csv": "Sobremesas", "cartola - drinks.csv": "Drinks"}
    linhas = []
    for arquivo, secao in secoes.items():
        df = pd.read_csv(CARTOLA / arquivo, dtype=str, keep_default_na=False)
        for r in df.to_dict("records"):
            vals = list(r.values())[1:]
            precos = [v for v in vals if v.startswith("R$")]
            textos = [v for v in vals if v and not v.startswith("R$")]
            item, descricao = textos[0], " ".join(textos[1:])
            obs = f"segundo preço na página: {precos[1]}" if len(precos) > 1 and precos[1] else ""
            linhas.append(linha(secao, item, descricao, "", preco_br(precos[0]), obs, ""))
    return {"Cartola": linhas}


def main():
    fontes = {**de_prints(), **de_digitais(), **de_cartola()}
    arquivos = {**ARQUIVO, "Cartola": "cartola"}
    total = 0
    for estab, linhas in fontes.items():
        df = pd.DataFrame(linhas, columns=COLUNAS)
        df.to_csv(SAIDA / f"{arquivos[estab]}.csv", sep=";", index=False)
        total += len(df)
        print(f"{arquivos[estab]:<14}{len(df):>5} linhas  {df['preco'].notna().sum():>4} com preço")
    print(f"total: {total} linhas em {len(fontes)} arquivos")


if __name__ == "__main__":
    main()
