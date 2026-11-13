"""
Bloco B1 - ordena a triagem manual dos candidatos da repaginação (B1-a_repaginacao.py).

Entrada: os candidatos à porta da triagem (B1_repaginacao_candidatos.csv), sem as
redes Ri Happy, Kalunga e Leitura (decisão do autor em 11/11/2026), e as decisões
manuais do autor (ROTULOS, abaixo), que crescem a cada rodada.

Método. Regressão logística regularizada, treinada nas 151 casas da triagem
original (51 aprovadas e 100 reprovadas em B1_triagem_manual_metro_av100.xlsx) e
nas rodadas já decididas (peso 3, por serem da mesma população). Só entram
variáveis que existem também para quem não teve o texto das avaliações coletado:
quantos dos 15 termos de busca trouxeram a casa e se algum foi de espaço (bar,
café, clube de jogos, luderia); tipo do Google (bar, loja de brinquedos,
eletrônicos); palavras do nome; nota e volume de avaliações.
Validação: AUC de 0,94 na validação cruzada das 151 originais e de 0,72 nas
24 decididas da rodada 1 (treino só nas 151). A ordenação ajuda a escolher o que
triar primeiro; não decide quem é luderia.

Achado que orienta a fila: 92% das 51 aprovadas e as 6 luderias da rodada 1 foram
achadas por pelo menos um termo de espaço; entre as reprovadas, 20%. A coluna
`termo_de_espaco` marca isso, e a rodada seguinte é o que sobra com o traço.

Saída em dados/B1_estabelecimentos/_dados-agregados/3_triagem/:
  B1_repaginacao_triagem.csv   decisões do autor (rodada 1) e fila da rodada 2

Uso:
    python3 "_src/PyScripts/B1_Estabelecimentos/3_analise/B1-a_repaginacao_priorizar.py"
"""
# Caminhos: _src/extras/ (log comum) e outros/ do objeto (auxiliares); log em ../logs/
import sys
from pathlib import Path
_AQUI = Path(__file__).resolve()
sys.path[:0] = [*map(str, (_AQUI.parents[3] / "Extras").glob("G[0-9]_*")), str(_AQUI.parents[1] / "5_outros")]
from log_execucao import registrar_execucao  # noqa: E402
if __name__ == "__main__":
    registrar_execucao(__file__)

import collections
import csv
import json
import re
import unicodedata

import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import roc_auc_score
from sklearn.preprocessing import StandardScaler

ROOT = Path(__file__).resolve().parents[4]
RAW = ROOT / "dados" / "B1_estabelecimentos" / "_dados-brutos"
CANDIDATOS = ROOT / "dados" / "B1_estabelecimentos" / "_dados-agregados" / "1_busca" / "B1_repaginacao_candidatos.csv"
TRIAGEM_ORIGINAL = ROOT / "dados" / "B1_estabelecimentos" / "_dados-agregados" / "3_triagem" / "B1_triagem_manual_metro_av100.xlsx"
SAIDA = ROOT / "dados" / "B1_estabelecimentos" / "_dados-agregados" / "3_triagem" / "B1_repaginacao_triagem.csv"
REDES_FORA = r"\bri\s*happy\b|\bkalunga\b|\bleitura\b"

# Decisões do autor, 12/11/2026 (rodada 1, na ordem em que a lista foi apresentada).
# (início do nome, resultado, desclassificado por, atividade identificada, observação)
# Sem "por": a confirmação (Maps ou Instagram) não foi registrada pelo autor.
ROTULOS = [
    ("Muito Geek", "aprovado", "", "luderia", "fonte da confirmação não registrada"),
    ("60 Minutos Escape", "aprovado", "", "luderia", "fonte da confirmação não registrada"),
    ("Covil Game Bar SBC", "aprovado", "", "luderia", "fonte da confirmação não registrada"),
    ("Conspiração do Jogo", "reprovado", "maps", "bar de sinuca", "sem Instagram"),
    ("Metropoly Bar", "aprovado", "", "luderia", "fonte da confirmação não registrada"),
    ("Barão Geek House", "reprovado", "maps", "", ""),
    ("Nergeek", "aprovado", "", "luderia", "fonte da confirmação não registrada"),
    ("Round2", "reprovado", "instagram", "", ""),
    ("Taberna do Bruxo", "reprovado", "instagram", "", ""),
    ("CHQ Jogos", "aprovado", "", "luderia", "fonte da confirmação não registrada"),
    ("Medieval Cards", "reprovado", "instagram", "loja de TCG", ""),
    ("Millennium Card Games", "reprovado", "maps", "", ""),
    ("CK Card Games", "reprovado", "maps", "", ""),
    ("Hobby Games", "reprovado", "maps", "", ""),
    ("Citadel Hobby Store", "reprovado", "maps", "", ""),
    ("Struere Games", "reprovado", "maps", "", ""),
    ("Fuga - Ocio e Café", "reprovado", "maps", "", ""),
    ("Resistencia Café e Pub", "reprovado", "maps", "bar de sinuca", ""),
    ("Old School Pinball", "reprovado", "maps", "", ""),
    ("Boteco do Raoni", "inconclusivo", "", "", ""),
    ("Artio Pub", "reprovado", "maps", "arcade", ""),
    ("Mont Shop", "reprovado", "maps", "loja de TCG", ""),
    ("TAG -Games-", "reprovado", "maps", "videogames", ""),
    ("Limited Edition Collectibles", "reprovado", "maps", "bonecos", ""),
    ("Garagem Comics", "reprovado", "maps", "videogames e comic books", ""),
]
DATA_RODADA_1 = "2026-11-12"

# Rodada 2: decisões do autor sobre a fila gerada abaixo (posições 16, 20 e 25 da lista apresentada em
# 12/11/2026). A ordem da fila vem do modelo treinado só com a rodada 1, para que as posições não mudem
# quando as decisões da rodada 2 entram.
ROTULOS_RODADA_2 = [
    ("Cheio de Fome - Vila da Penha", "aprovado", "", "luderia", "fonte da confirmação não registrada"),
    ("Espaço 162", "aprovado", "", "luderia", "fonte da confirmação não registrada"),
    ("Reduto", "aprovado", "", "luderia", "fonte da confirmação não registrada"),
]
DATA_RODADA_2 = "2026-11-12"

ALTA = {"loja de board game", "loja de RPG", "loja de card game", "luderia", "board game café",
        "café de jogos de tabuleiro", "loja de jogos de tabuleiro", "clube de jogos de tabuleiro"}
BAIXA = {"quiz bar", "ludoteca"}
ESPACO = {"board game bar", "bar de jogos de tabuleiro", "café de jogos de tabuleiro", "board game café",
          "clube de jogos de tabuleiro", "luderia", "ludobar"}
AEB = {"bar", "pub", "cocktail_bar", "restaurant", "hamburger_restaurant", "cafe", "coffee_shop", "gastropub",
       "bar_and_grill", "brewery", "snack_bar", "irish_pub", "pizza_restaurant", "night_club", "cafeteria",
       "bistro", "food", "meal_takeaway"}
NOME = {
    "jogo": r"jog(o|os|a|ue)", "game": r"game", "board": r"board", "geek": r"geek|nerd", "ludo": r"ludo|luder",
    "card": r"card|magic|tcg|rpg", "bar": r"\bbar\b|pub|boteco|taberna|tavern|cafe|burg|restaurante",
    "toy": r"brinq|toy|kid", "tech": r"info|tech|assist|eletr|celular|service", "livraria": r"livrar|papel|comic|sebo",
}


def norm(texto):
    return unicodedata.normalize("NFKD", texto or "").encode("ascii", "ignore").decode().lower()


def variaveis(termos, nome, tipos, nota, volume):
    t, nm, ty = termos, norm(nome), set(tipos)
    f = {
        "n_termos": len(t), "n_alta": len(t & ALTA), "so_baixa": int(bool(t) and not (t - BAIXA)),
        "n_espaco": len(t & ESPACO), "aeb": int(bool(ty & AEB)), "toy": int("toy_store" in ty),
        "eletro": int(bool(ty & {"electronics_store", "cell_phone_store"})), "livro": int("book_store" in ty),
        "loja_so": int(ty <= {"store", "point_of_interest", "establishment", "food"} and not (ty & AEB)),
        "rating": float(nota or 0), "logvol": np.log10(float(volume or 0) + 1),
    }
    f["termo_de_espaco"] = int(f["n_espaco"] > 0)
    for k, p in NOME.items():
        f["nome_" + k] = int(bool(re.search(p, nm)))
    return f


def main():
    termos = collections.defaultdict(set)
    for arq in ("B1_candidatos.csv", "B1_candidatos_repaginacao.csv"):
        with open(RAW / arq, newline="", encoding="utf-8") as f:
            for r in csv.DictReader(f):
                termos[r["place_id"]].add(r["termo_busca"])
    detalhes = {}
    for arq in ("B1_detalhes.jsonl", "B1_detalhes_sem_reviews.jsonl"):
        for linha in open(RAW / arq, encoding="utf-8"):
            if linha.strip():
                d = json.loads(linha)
                detalhes[d["id"]] = d

    # Treino: triagem original (aprovado = 1, reprovado = 0; inconclusivo fica fora).
    t = pd.read_excel(TRIAGEM_ORIGINAL, dtype=str).fillna("")
    linhas = []
    for _, r in t.iterrows():
        y = {"aprovado": 1, "reprovado": 0}.get(r["resultado da triagem"])
        d = detalhes.get(r.place_id, {})
        if y is not None:
            linhas.append({"y": y, **variaveis(termos[r.place_id], r.nome, d.get("types", []),
                                               d.get("rating"), d.get("userRatingCount", r.volume_avaliacoes))})
    original = pd.DataFrame(linhas)

    with open(CANDIDATOS, newline="", encoding="utf-8") as f:
        cand = [r for r in csv.DictReader(f) if not re.search(REDES_FORA, norm(r["nome"]))]
    for r in cand:
        r.update(variaveis(termos[r["place_id"]], r["nome"], r["categorias_google"].split(";"),
                           r["avaliacao_media"], r["volume_avaliacoes"]))
    base = pd.DataFrame(cand)
    colunas = [c for c in original.columns if c != "y"]

    # Rodada 1: cada decisão casa com um único candidato.
    base["rodada"], base["ordem"], base["resultado_triagem"] = 0, 0, "pendente"
    for k in ("desclassificado_por", "atividade_identificada", "observacao", "data_triagem"):
        base[k] = ""
    base["rodada"] = base["rodada"].astype(int)
    for ordem, (inicio, res, por, atividade, obs) in enumerate(ROTULOS, 1):
        achou = base.index[base["nome"].map(norm).str.startswith(norm(inicio))]
        assert len(achou) == 1, (inicio, list(base.loc[achou, "nome"]))
        i = achou[0]
        base.loc[i, "rodada"], base.loc[i, "ordem"] = 1, ordem
        for k, v in zip(("resultado_triagem", "desclassificado_por", "atividade_identificada", "observacao",
                         "data_triagem"), (res, por, atividade, obs, DATA_RODADA_1)):
            base.loc[i, k] = v
    decididas = base[(base["rodada"] == 1) & base["resultado_triagem"].isin(["aprovado", "reprovado"])].copy()
    decididas["y"] = (decididas["resultado_triagem"] == "aprovado").astype(int)

    # Validação fora da amostra: treino só nas 151 originais, teste nas decididas.
    sc = StandardScaler().fit(original[colunas])
    m = LogisticRegression(C=0.3, max_iter=3000).fit(sc.transform(original[colunas]), original["y"])
    auc = roc_auc_score(decididas["y"], m.predict_proba(sc.transform(decididas[colunas]))[:, 1])
    print(f"AUC nas {len(decididas)} decididas da rodada 1 (treino nas {len(original)} originais): {auc:.2f}")
    print("Termo de espaço: aprovadas originais "
          f"{original.loc[original.y == 1, 'termo_de_espaco'].mean():.0%}, reprovadas originais "
          f"{original.loc[original.y == 0, 'termo_de_espaco'].mean():.0%}, luderias da rodada 1 "
          f"{decididas.loc[decididas.y == 1, 'termo_de_espaco'].mean():.0%}")

    # Modelo final (originais com peso 1, rodadas decididas com peso 3) e pontuação dos pendentes.
    treino = pd.concat([original.assign(w=1.0), decididas[["y", *colunas]].assign(w=3.0)])
    sc = StandardScaler().fit(treino[colunas])
    m = LogisticRegression(C=0.3, max_iter=3000).fit(sc.transform(treino[colunas]), treino["y"],
                                                     sample_weight=treino["w"])
    pend = base[base["resultado_triagem"] == "pendente"].copy()
    pend["probabilidade"] = m.predict_proba(sc.transform(pend[colunas]))[:, 1].round(3)
    pend = pend.sort_values(["termo_de_espaco", "probabilidade"], ascending=False)
    pend["rodada"] = np.where(pend["termo_de_espaco"] == 1, 2, 3)
    pend["ordem"] = pend.groupby("rodada").cumcount() + 1

    # Decisões da rodada 2 entram depois da ordenação (a fila não muda).
    for inicio, res, por, atividade, obs in ROTULOS_RODADA_2:
        achou = pend.index[(pend["rodada"] == 2) & pend["nome"].map(norm).str.startswith(norm(inicio))]
        assert len(achou) == 1, (inicio, list(pend.loc[achou, "nome"]))
        for k, v in zip(("resultado_triagem", "desclassificado_por", "atividade_identificada", "observacao",
                         "data_triagem"), (res, por, atividade, obs, DATA_RODADA_2)):
            pend.loc[achou[0], k] = v

    campos = ["rodada", "ordem", "place_id", "nome", "grupo", "endereco", "volume_avaliacoes", "avaliacao_media",
              "termo_de_espaco", "n_termos", "probabilidade", "resultado_triagem", "desclassificado_por",
              "atividade_identificada", "observacao", "data_triagem", "link_google_maps"]
    saida = pd.concat([base[base["rodada"] == 1].sort_values("ordem"), pend])
    saida["probabilidade"] = saida.get("probabilidade", "")
    saida[campos].to_csv(SAIDA, index=False)

    # Fechamento: cada candidato em uma única linha e em uma única rodada.
    assert len(saida) == len(base) and saida["place_id"].is_unique
    print(f"{len(saida)} candidatos: rodada 1 {len(ROTULOS)}, rodada 2 {(pend.rodada == 2).sum()}, "
          f"rodada 3 {(pend.rodada == 3).sum()} (sem termo de espaço); soma confere com {len(base)}")
    print(saida.groupby("rodada").resultado_triagem.value_counts().to_string())


if __name__ == "__main__":
    main()
