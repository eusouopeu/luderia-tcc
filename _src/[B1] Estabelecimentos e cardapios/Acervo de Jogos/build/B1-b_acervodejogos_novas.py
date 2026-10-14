"""
Bloco B1 - luderias achadas pelo Acervo de Jogos que cumprem o recorte e não
estão na população de aprovadas.

Critérios (os mesmos da população): mais de 100 avaliações no Google; endereço
do Google na capital ou na RM de uma das 14 metrópoles REGIC; jogos de
tabuleiro E comida/bebida no local; place_id fora da curadoria filtrada.
Volume, endereço e place_id vêm de B1_acervodejogos_places.csv. A parte de
comida e bebida é conferência manual (bio do Instagram, linktree, cardápio),
registrada em CURADORIA com a evidência e a data. Lojas com mais de 100
avaliações no recorte que não são luderia, ou cujo resultado do Google é outra
casa, ficam em DESCARTES com o motivo, para a conta fechar.

Entrada: acervo_jogos/B1_acervodejogos_lojas.csv e B1_acervodejogos_places.csv
Saída:   acervo_jogos/B1_acervodejogos_luderias_novas.csv (uma linha por luderia)
         acervo_jogos/B1_acervodejogos_triagem.csv (todas as lojas consultadas no
         Google com mais de 100 avaliações no recorte, com a decisão)
         acervo_jogos/B1_acervodejogos_triagem_50_ou_mais_avaliacoes.csv (mesma
         triagem com corte de 50 ou mais avaliações, para avaliar a expansão da
         população; pedido do autor em 13/10/2026). Na faixa de 50 a 100, a loja
         cujo place_id está na curadoria filtrada de 50+ ainda não passou pela
         triagem manual do autor e fica "triagem manual pendente"; as demais sem
         decisão registrada ficam "a conferir".
"""
# Caminhos: _src/extras/ (log comum) e outros/ do objeto (auxiliares); log em ../logs/
import sys
from pathlib import Path
_AQUI = Path(__file__).resolve()
sys.path[:0] = [str(_AQUI.parents[3] / "extras"), str(_AQUI.parents[1] / "outros")]
from log_execucao import registrar_execucao  # noqa: E402
if __name__ == "__main__":
    registrar_execucao(__file__)

import csv
import sys
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parents[4]
sys.path.insert(0, str(ROOT / "_src" / "[B1] Estabelecimentos e cardapios" / "Google Places (Negócios)" / "outros"))
import recorte_rm as R  # noqa: E402

PROC = ROOT / "dados" / "[B1] Estabelecimentos e cardapios"
PASTA = PROC / "acervo_jogos"
CURADORIA_50 = PROC / "B1_planilha_curadoria_metropoles_filtrada_50_ou_mais_avaliacoes.csv"
METROPOLES = {
    "São Paulo", "Brasília", "Rio de Janeiro", "Belém", "Belo Horizonte", "Curitiba",
    "Florianópolis", "Fortaleza", "Goiânia", "Porto Alegre", "Recife", "Salvador",
    "Vitória", "Manaus",
}

# subdomínio -> (nome, instagram, site, loja, cardápio, outros links, evidência de A&B), conferido em 12/10/2026
CURADORIA = {
    "bardomago": ("Bardo Mago", "https://www.instagram.com/bardo.mago/", "", "",
                  "https://www.vucafood.com.br/funminds/2219/cardapio-digital", "https://linktr.ee/bardomago",
                  "Bio do Instagram: 'Jogos, drinks e burguer'; couvert lúdico; cardápio digital com 111 itens"),
    "latabuleria": ("La Tabuleria", "https://www.instagram.com/latabuleria/", "", "https://latabuleria.saipos.com/home",
                    "https://latabuleria.saipos.com/home", "https://linktr.ee/latabuleria",
                    "Bio: 'Bar & Jogos', 'Burgers incríveis, drinks e jogos'; couvert lúdico de R$ 10 a R$ 20; vende jogos no Saipos"),
    "tabuclub": ("TabuClub", "https://www.instagram.com/tabuclubnit/", "", "https://www.tabuloja.com/",
                 "https://drive.google.com/file/d/1-KDTgvYRZKe4R9KCWVQHRD5xiWqjSgPW/view",
                 "https://linktr.ee/tabuclubnit, http://www.tabulovers.com/tabuclub",
                 "Bio: 'Bar de Jogos de Tabuleiro com o maior acervo do RJ'; cardápio em PDF (hambúrguer, petiscos, drinks)"),
    "tocadorato": ("Toca do Rato - Pizzaria e Jogos de Tabuleiro", "https://www.instagram.com/tocadorato_oficial/", "", "",
                   "https://tocadoratopizzasejogos.saipos.com/home", "",
                   "Nome no Google 'Pizzaria e Jogos de Tabuleiro'; tipo pizza_restaurant; cardápio Saipos com pizzas e bebidas"),
    "tubaleria": ("Tubaleria", "https://www.instagram.com/tubaleria/", "https://www.tubaleria.com.br", "https://tubaleria.store/",
                  "", "https://linktr.ee/tubaleria",
                  "Bio: 'Jogos de Tabuleiro • Hambúrguer • Petiscos • Bebida • Café • Sobremesas'; cardápio só em destaque do Instagram"),
}

# subdomínio -> motivo (lojas com mais de 100 avaliações no recorte que não entram)
DESCARTES = {
    "brecholudico": "luderia sem A&B: aluguel e venda de jogos (já reprovada na triagem manual)",
    "cartasedados": "loja de TCG e jogos, sem comida e bebida no site",
    "coliseudosjogos": "Google: CLOSED_PERMANENTLY; loja",
    "tabuleiramos": "Google: CLOSED_PERMANENTLY",
    "magoburguertabuleria": "resultado do Google (Mago Burguer Original, Olinda) não comprovado como a mesma casa; a loja do Acervo não publica endereço",
    "dungee": "resultado do Google (Dungeons Bar) não comprovado como a mesma casa; loja do Acervo sem endereço nem Instagram",
    "dungeons": "resultado do Google (Dungeons Bar) não comprovado como a mesma casa; loja do Acervo sem endereço nem Instagram",
    "taverna": "resultado do Google (Taverna do Dragão) não comprovado como a mesma casa; loja do Acervo sem endereço",
    "whiplashgamelabs": "resultado do Google (Whiplash Bar, R. Dr. Melo Alves) tem endereço diferente do da loja (Av. Eng. Heitor Antônio Eiras Garcia)",
}
# Similaridade de nome entre 0,5 e 0,85, mas o resultado do Google é claramente outro negócio (conferido pelo nome e tipo).
OUTRA_CASA = {
    "magosbetim": "Clube dos Metalúrgicos", "caixonauta": "Caixa Cultural Belém", "imperialgames": "Arena Imperial",
    "caldeiraodamaga": "Caldeirão da Bola", "padocas": "Padoca Pães Artesanais", "lucas": "Clínica São Lucas",
    "enigmajogos": "Enigma Escape Game", "jogaassim": "Hospital Assim", "templodotabuleiro": "Templo de Quimbanda",
    "recantobg": "Recanto Do Moura (restaurante)", "saojogao": "Casa São João (material de construção)",
    "vidabgames": "Kiko Games", "santadiscordiabg": "Santa Oca Bar", "shhimoclub": "Singo's Bar Club",
}
DESCARTES.update({k: f"resultado do Google é outra casa ({v})" for k, v in OUTRA_CASA.items()})


def main():
    lojas = pd.read_csv(PASTA / "B1_acervodejogos_lojas.csv", dtype=str).fillna("")
    places = pd.read_csv(PASTA / "B1_acervodejogos_places.csv", dtype=str).fillna("")
    df = places.merge(lojas[["subdominio", "acervo", "titulos", "whatsapp", "endereco", "instagram", "outros_links"]],
                      on="subdominio", how="left")
    df["vol"] = pd.to_numeric(df.volume_avaliacoes, errors="coerce").fillna(0)
    no_recorte = df.situacao_google.isin(R.SITUACOES_NO_RECORTE) & df.capital_google.isin(METROPOLES)
    df["na_curadoria_50"] = df.place_id.isin(set(pd.read_csv(CURADORIA_50, dtype=str).place_id)).map(
        {True: "sim", False: "não"})
    triagem = df[(df.vol > 100) & no_recorte].copy()

    def decide(r):
        if r.ja_aprovada == "sim":
            return "já aprovada", "place_id nas 51 aprovadas"
        if r.subdominio in CURADORIA:
            return "nova luderia", CURADORIA[r.subdominio][6]
        if r.subdominio in DESCARTES:
            return "descartada", DESCARTES[r.subdominio]
        if r.ja_na_curadoria == "sim":
            return "descartada", "place_id já passou pela curadoria e não foi aprovado"
        if r.vol <= 100 and r.na_curadoria_50 == "sim":
            return "triagem manual pendente", "place_id na curadoria filtrada de 50+; faixa de 50 a 100 sem triagem manual"
        if r.conferir == "sim":
            return "descartada", f"resultado do Google é outra casa (similaridade de nome {r.similaridade_nome})"
        return "a conferir", ""

    triagem[["decisao", "motivo"]] = triagem.apply(lambda r: pd.Series(decide(r)), axis=1)
    cols = ["subdominio", "nome_acervo", "nome_google", "similaridade_nome", "place_id", "volume_avaliacoes",
            "endereco_google", "capital_google", "tipo_principal", "status_google", "ja_na_curadoria", "ja_aprovada",
            "decisao", "motivo"]
    triagem[cols].sort_values(["decisao", "capital_google"]).to_csv(PASTA / "B1_acervodejogos_triagem.csv", index=False)

    triagem_50 = df[(df.vol >= 50) & no_recorte].copy()
    triagem_50[["decisao", "motivo"]] = triagem_50.apply(lambda r: pd.Series(decide(r)), axis=1)
    cols_50 = cols[:-2] + ["na_curadoria_50", "decisao", "motivo"]
    triagem_50[cols_50].sort_values(["decisao", "capital_google"]).to_csv(
        PASTA / "B1_acervodejogos_triagem_50_ou_mais_avaliacoes.csv", index=False)
    contagem_50 = triagem_50.decisao.value_counts()
    print("corte de 50 ou mais:\n" + contagem_50.to_string())
    assert contagem_50.sum() == len(triagem_50)
    print(f"total {len(triagem_50)} (soma das decisões = {contagem_50.sum()})\n")

    novas = []
    for r in triagem[triagem.decisao == "nova luderia"].itertuples():
        nome, ig, site, loja, cardapio, outros, evid = CURADORIA[r.subdominio]
        novas.append({
            "nome": nome, "place_id": r.place_id, "endereco_google": r.endereco_google,
            "capital_endereco": r.capital_google, "volume_avaliacoes": int(r.vol),
            "avaliacao_media": r.avaliacao_media, "tipo_principal_google": r.tipo_principal,
            "link_google_maps": r.link_google_maps.split("&g_mp")[0], "instagram": ig, "site": site, "loja": loja,
            "acervo": r.acervo, "titulos_acervo": r.titulos, "cardapio": cardapio, "outros_links": outros,
            "whatsapp": r.whatsapp, "evidencia_ab": evid, "data_coleta": r.data_coleta,
        })
    with open(PASTA / "B1_acervodejogos_luderias_novas.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=list(novas[0]))
        w.writeheader()
        w.writerows(novas)
    contagem = triagem.decisao.value_counts()
    print(contagem.to_string())
    assert contagem.sum() == len(triagem)
    print(f"total {len(triagem)} (soma das decisões = {contagem.sum()}); {len(novas)} luderias novas")


if __name__ == "__main__":
    main()
