"""
Bloco B2 - nuvem de palavras das avaliações com texto do Google Maps
(até "3 meses atrás", as 1.588 avaliações "analisada" da codificação de Bardin).

Duas figuras:
- B2_nuvem_palavras: todas as avaliações analisadas (cinza);
- B2_nuvem_palavras_criticas: só as de nota 1 a 3 (vermelho, cor de crítica).

Como a palavra pesa:
- conta em quantas avaliações a palavra aparece (não quantas vezes), para um
  texto longo não pesar mais que vários curtos;
- na nuvem geral, o tamanho é o percentual ponderado por estabelecimento
  (média entre as casas do % de avaliações da casa com a palavra), a leitura
  principal do B2 desde 15/10/2026 pela concentração de Bodogami e Shelf;
  na de notas baixas, é o percentual simples, porque muitas casas têm uma ou
  duas avaliações de nota 1 a 3 e uma só valeria 100% da casa; os dois
  percentuais vão na tabela de valores;
- palavras vazias do português (lista em PALAVRAS_VAZIAS) e os nomes
  próprios das casas (tirados de B2_bardin_estabelecimentos.csv, sem as
  palavras genéricas do nome, como "jogos" e "bar") ficam de fora;
- plural e singular viram um termo só quando os dois aparecem (jogos e jogo),
  com o rótulo da forma mais usada.

Uma avaliação pode ter várias palavras (contagem não exclusiva por desenho),
então os percentuais não somam 100% e não há total como soma.

Entradas:
  analise_conteudo/B2_codificacao_bardin.csv            quais avaliações entram (situacao = analisada)
  analise_conteudo/B2_bardin_estabelecimentos.csv       nomes das casas
  _dados-brutos/analise_conteudo/B2_bardin_corpus.csv   textos (fora do git; gerado pelo B2-a_conteudo_bardin.py --corpus)

Saídas (dados/[B2] Avaliacoes recentes/graficos/): png/ (300 dpi), svg/ e
valores/ (as 150 palavras desenhadas, com % simples e ponderado).

Uso:
    python3 -m pip install wordcloud
    python3 "_src/[B2] Avaliacoes recentes/Google Places (Comentários)/analise/B2-a_nuvem_palavras.py"
"""
# Caminhos: _src/extras/ (log e padrão visual); log em ../logs/
import sys
from pathlib import Path
_AQUI = Path(__file__).resolve()
sys.path[:0] = [str(_AQUI.parents[3] / "extras")]
from log_execucao import registrar_execucao  # noqa: E402
if __name__ == "__main__":
    registrar_execucao(__file__)

import re  # noqa: E402
import unicodedata  # noqa: E402
from collections import Counter, defaultdict  # noqa: E402

import pandas as pd  # noqa: E402
from matplotlib.colors import LinearSegmentedColormap  # noqa: E402
from wordcloud import WordCloud  # noqa: E402

from graficos_comum import TINTA, VERMELHO, _FONTES, br, figura, margens, salvar  # noqa: E402

ROOT = _AQUI.parents[4]
B2 = ROOT / "dados" / "[B2] Avaliacoes recentes"
AC = B2 / "analise_conteudo"
CORPUS = B2 / "_dados-brutos" / "analise_conteudo" / "B2_bardin_corpus.csv"
PASTA = B2 / "graficos"
FONTE_TTF = str(_FONTES / "SourceSans3-Semibold.ttf")
FONTE = ("Fonte: elaboração própria com avaliações com texto do Google Maps até \"3 meses atrás\" "
         "(coleta de 13 a 15/10/2026), as mesmas da análise de conteúdo (Bardin) (B2).")
N_PALAVRAS = 150
SEMENTE = 20261022  # disposição das palavras reproduzível

# Palavras vazias: artigos, preposições, pronomes, conjunções, verbos auxiliares
# e advérbios de intensidade, que aparecem em qualquer texto e não dizem do serviço.
PALAVRAS_VAZIAS = set("""
a à às ao aos as o os um uma uns umas de da das do dos em na nas no nos num numa
dum duma pra pro pras pros para por pelo pela pelos pelas com sem sob sobre até
entre após ante desde contra perante e é ou mas porém pois porque que quê se
como quando onde quanto qual quais quem cujo cuja então já ainda também só
apenas mesmo mesma mesmos mesmas eu tu ele ela nós vós eles elas me te lhe nos
vos lhes se si mim ti comigo contigo conosco meu minha meus minhas teu tua seu
sua seus suas nosso nossa nossos nossas dele dela deles delas este esta estes
estas esse essa esses essas aquele aquela aqueles aquelas isto isso aquilo
aqui aí ali lá cá ser sou és somos são era eram fui foi fomos foram seja sejam
será serão seria seriam sido sendo estar estou está estamos estão estava
estavam esteve estive estivemos estiveram estado estando ter tenho tem temos
têm tinha tinham tive teve tivemos tiveram terá tido tendo haver há havia
houve hei vai vão vou ir ia iam fazer faz fez fazem feito vez vezes muito
muita muitos muitas pouco pouca poucos poucas mais menos bem bastante tão tanto
tanta tantos tantas todo toda todos todas tudo nada algo algum alguma alguns
algumas nenhum nenhuma outro outra outros outras cada qualquer sempre nunca
não sim ali assim agora depois antes aqui lá super bem demais pq q vc vcs tb
tbm pra né ah oh eh hein ok etc dá dar deu daí nisso nesse nessa neste nesta
desse dessa deste desta disso disto num lo la los las coisa coisas acho achei
pode podem poder posso pude poderia gente cara além
""".split())

# Palavras genéricas que aparecem nos nomes das casas mas dizem do serviço:
# ficam na nuvem mesmo saindo do nome.
GENERICAS = set("""
jogos jogo games game bar café cafe cafeteria luderia ludoteca tabuleiro board
boardgames burgers burger hamburgueria pizzaria restaurante store loja hobby
cards card comunidade house pub food gaming e de do da em bar & jogasampa
""".split()) - {"jogasampa"}

RE_PALAVRA = re.compile(r"[a-zà-öø-ÿ]+(?:-[a-zà-öø-ÿ]+)*")


def sem_acento(t):
    return "".join(c for c in unicodedata.normalize("NFD", t) if unicodedata.category(c) != "Mn")


def nomes_das_casas(est):
    """Palavras próprias dos nomes das casas (ex.: alçapão, bodogami, shelf),
    com e sem acento, sem as genéricas."""
    fora = set()
    for nome in est.estabelecimento:
        for p in RE_PALAVRA.findall(nome.lower()):
            if p not in GENERICAS and len(p) > 1:
                fora |= {p, sem_acento(p)}
    return fora


def palavras(texto, fora):
    t = unicodedata.normalize("NFC", texto).lower().replace("…", " ")  # acento composto (texto do Mac)
    t = re.sub(r"(.)\1{2,}", r"\1", t)  # "muuuito" -> "muito"
    return {p for p in RE_PALAVRA.findall(t)
            if len(p) > 2 and p not in PALAVRAS_VAZIAS and p not in fora and not p.isdigit()}


def junta_plurais(contagem):
    """Leva o plural ao singular quando os dois existem no corpus
    (jogos -> jogo, opções -> opção, legais -> legal)."""
    destino = {}
    for p in contagem:
        for sufixo, troca in (("ões", "ão"), ("ães", "ão"), ("ais", "al"), ("éis", "el"), ("res", "r"), ("s", "")):
            if p.endswith(sufixo) and p[: -len(sufixo)] + troca in contagem:
                destino[p] = p[: -len(sufixo)] + troca
                break
    return lambda p: destino.get(p, p)


def frequencias(base, fora, peso="pct_ponderado_casa"):
    """Para cada termo: avaliações com o termo, % simples e % ponderado por casa."""
    base = base.assign(pals=base.texto.map(lambda t: palavras(t, fora)))
    bruta = Counter(p for ps in base.pals for p in ps)
    raiz = junta_plurais(bruta)
    formas = defaultdict(Counter)
    for p, n in bruta.items():
        formas[raiz(p)][p] += n
    base["termos"] = base.pals.map(lambda ps: {raiz(p) for p in ps})
    n, casas = len(base), base.sigla.nunique()
    linhas = []
    por_casa = base.groupby("sigla").size()
    conta_casa = defaultdict(Counter)
    for sigla, termos in zip(base.sigla, base.termos):
        conta_casa[sigla].update(termos)
    total = Counter(t for ts in base.termos for t in ts)
    for termo, k in total.items():
        pond = sum(conta_casa[s][termo] / por_casa[s] for s in por_casa.index) / casas * 100
        linhas.append({"termo": formas[termo].most_common(1)[0][0], "avaliacoes_com_termo": k,
                       "pct_simples": round(k / n * 100, 2), "pct_ponderado_casa": round(pond, 2),
                       "formas_juntadas": " ".join(sorted(formas[termo]))})
    tab = pd.DataFrame(linhas).sort_values([peso, "avaliacoes_com_termo"], ascending=False)
    return tab.head(N_PALAVRAS).reset_index(drop=True), n, casas


def desenha(tab, nome, cor, titulo, subtitulo, peso="pct_ponderado_casa"):
    larg, miolo = 8.0, 4.6
    cab, rod = margens(larg, titulo, subtitulo, FONTE, base=0.3)
    fig, ax = figura(larg, cab + miolo + rod, titulo, subtitulo, FONTE, esq=0.18, dir=0.18, base=0.3)
    escala = LinearSegmentedColormap.from_list("escala", ["#b5b5b5", cor])
    pesos = dict(zip(tab.termo, tab[peso]))
    vmax = max(pesos.values())
    nuvem = WordCloud(width=2200, height=int(2200 * miolo / (larg - 0.36)), background_color="white",
                      font_path=FONTE_TTF, prefer_horizontal=1.0, relative_scaling=0.6, margin=6,
                      max_words=N_PALAVRAS, random_state=SEMENTE, collocations=False,
                      color_func=lambda w, **_: "#%02x%02x%02x" % tuple(
                          int(255 * c) for c in escala(0.15 + 0.85 * pesos[w] / vmax)[:3]))
    nuvem.generate_from_frequencies(pesos)
    ax.imshow(nuvem.to_array(), interpolation="bilinear")
    ax.set_axis_off()
    salvar(fig, PASTA, nome, tab)


def main():
    cod = pd.read_csv(AC / "B2_codificacao_bardin.csv", sep=";", dtype=str)
    ids = set(cod.loc[cod.situacao == "analisada", "id_avaliacao"])
    corpus = pd.read_csv(CORPUS, sep=";", dtype=str, encoding="utf-8-sig").fillna("")
    corpus = corpus[corpus.id_avaliacao.isin(ids)].copy()
    if len(corpus) != len(ids):
        raise SystemExit(f"Corpus com {len(corpus)} avaliações, codificação com {len(ids)}: rodar o "
                         "B2-a_conteudo_bardin.py --corpus de novo.")
    corpus["nota"] = corpus.nota.astype(int)
    fora = nomes_das_casas(pd.read_csv(AC / "B2_bardin_estabelecimentos.csv", sep=";", dtype=str))

    tab, n, casas = frequencias(corpus, fora)
    t = tab.iloc[:3]
    desenha(tab, "B2_nuvem_palavras", TINTA,
            f"\"{t.termo[0].capitalize()}\", \"{t.termo[1]}\" e \"{t.termo[2]}\" são o que mais "
            "aparece nas avaliações das luderias",
            f"As {N_PALAVRAS} palavras mais citadas em {br(n)} avaliações com texto de {casas} casas; "
            "tamanho pelo % de avaliações com a palavra, média entre as casas",
    )

    crit = corpus[corpus.nota <= 3]
    tab_c, n_c, casas_c = frequencias(crit, fora, peso="pct_simples")
    t = tab_c.iloc[:3]
    desenha(tab_c, "B2_nuvem_palavras_criticas", VERMELHO,
            f"Nas notas baixas, \"{t.termo[0]}\", \"{t.termo[1]}\" e \"{t.termo[2]}\" "
            "lideram as palavras",
            f"As {N_PALAVRAS} palavras mais citadas em {br(n_c)} avaliações com texto e nota de 1 a 3, "
            f"de {casas_c} casas; tamanho pelo % de avaliações com a palavra",
            peso="pct_simples")
    print(f"Avaliações: {n} (todas), {n_c} (nota 1 a 3). Nomes de casas retirados: {len(fora)} formas.")


if __name__ == "__main__":
    main()
