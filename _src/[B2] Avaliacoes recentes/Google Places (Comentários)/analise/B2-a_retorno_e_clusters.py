"""
Bloco B2 - o que acompanha a decisão de voltar e o conteúdo das avaliações por
grupo de preço (pedido do autor, 03/11/2026).

1. Retorno: nas avaliações que dizem se o cliente volta ("Voltará" = sim ou
   não, grade 2 do Notion), associação entre cada tema citado (elogio ou
   crítica) e a decisão. Teste exato de Fisher bilateral por tema e
   polaridade, razão de chances com correção de Haldane (+0,5) e q de
   Benjamini-Hochberg dentro de cada comparação. Três comparações:
     a) "volta" x "não volta" (todas as avaliações com a decisão dita);
     b) só avaliações com alguma crítica: "volta mesmo criticando" x "não volta";
     c) só notas 1 e 2: "não volta" x nota baixa sem decisão dita.
   Com 20 avaliações "não volta", o teste serve para ordenar temas; p
   pequeno não é efeito medido com precisão.

2. Agrupamento de casas por preço (k-means): duas variáveis padronizadas
   (escore z), uma linha por casa:
     - taxa de entrada por hora: em cada dia aberto, taxa do dia ÷ horas que
       ela cobre (o dia inteiro de funcionamento, para quem cobra por dia; 3 h
       na São Jogue, que cobra por turno); média dos dias abertos;
     - consumo por pessoa: bebida mediana + entrada ou prato mediano do
       cardápio (B1, aba cesta), só com os dois itens encontrados.
   Entram as casas com taxa conhecida (cardápio do B1 ou, na falta, fonte
   secundária do B1) e consumo completo. Taxa não encontrada não vira 0; "sem
   cobrança" só quando a fonte diz (Ludus, Castelos). Valores e fontes em
   TAXAS; a cesta completa (consumo + taxa média do dia) sai como coluna
   descritiva, fora do agrupamento, para não contar a taxa duas vezes.

3. Agrupamento de clientes pelo gasto declarado (k-means em uma dimensão):
   "Preço por pessoa" do Google Maps, pelo ponto médio da faixa (R$ 80–100
   vira R$ 90); "+R$ 200" vira R$ 200, o limite inferior; valor único fica
   como está. Avaliação sem faixa fica fora (não vira 0).

k-means: k de 2 a 5 escolhido pela maior silhueta média; 100 inícios
aleatórios com semente fixa (SEMENTE); grupos numerados pela soma do
centroide padronizado (casas) ou do mais barato ao mais caro (clientes). Implementação própria (numpy), sem scikit-learn.

Conteúdo por grupo: % de avaliações com elogio e com crítica a cada tema
(a soma passa de 100% por desenho: temas não são exclusivos), nota média,
decisão de voltar e contexto. Diferença entre grupos por qui-quadrado de
independência (grupo x tema citado), com q de Benjamini-Hochberg.

Entrada:
  _dados-brutos/analise_conteudo/2026-11-03_2_comentarios_grade2.csv (fora do git)
  dados/[B1] Estabelecimentos e cardapios/estabelecimentos/B1_resumo_estabelecimentos.xlsx
Saídas em dados/[B2] Avaliacoes recentes/retorno_e_clusters/:
  B2_retorno_decisao_resumo.csv     nota, aspectos, contexto e gasto por decisão
  B2_retorno_temas.csv              tema x polaridade x comparação (a, b, c)
  B2_cluster_casas.csv              uma linha por casa: variáveis, fonte e grupo
  B2_cluster_casas_conteudo.csv     tema x polaridade x grupo de casas
  B2_cluster_casas_resumo.csv       grupo: casas, avaliações, centroides, nota, retorno
  B2_cluster_clientes_conteudo.csv  tema x polaridade x grupo de clientes
  B2_cluster_clientes_resumo.csv    grupo: avaliações, faixa de gasto, nota, retorno
  B2_cluster_silhueta.csv           silhueta média por k nos dois agrupamentos
Cada avaliação entra em um único grupo; os resumos fecham com o total
(diferença zero, senão o script para).

Uso:
    python3 "_src/[B2] Avaliacoes recentes/Google Places (Comentários)/analise/B2-a_retorno_e_clusters.py"
"""
# Caminhos: _src/extras/ (log comum); log em ../logs/
import sys
from pathlib import Path
_AQUI = Path(__file__).resolve()
sys.path[:0] = [str(_AQUI.parents[3] / "extras")]
from log_execucao import registrar_execucao  # noqa: E402
if __name__ == "__main__":
    registrar_execucao(__file__)

import math  # noqa: E402
import re  # noqa: E402

import numpy as np  # noqa: E402
import pandas as pd  # noqa: E402

ROOT = Path(__file__).resolve().parents[4]
B1 = ROOT / "dados" / "[B1] Estabelecimentos e cardapios" / "estabelecimentos" / "B1_resumo_estabelecimentos.xlsx"
B2 = ROOT / "dados" / "[B2] Avaliacoes recentes"
BASE = B2 / "_dados-brutos" / "analise_conteudo" / "2026-11-03_2_comentarios_grade2.csv"
PASTA = B2 / "retorno_e_clusters"
SEMENTE = 20261103
K_CANDIDATOS = range(2, 6)
# clientes: o gasto declarado vem em faixas (poucos valores distintos), e em uma
# dimensão a silhueta só cresce com k (0,61 com 2 grupos, 0,71 com 5); fixa-se
# k = 3 (gasto baixo, médio e alto), com silhueta de 0,64 e grupos de 60 ou mais
K_CLIENTES = 3
DIAS = ["segunda", "terca", "quarta", "quinta", "sexta", "sabado", "domingo"]
TEMAS = ["ambiente e decoração", "atendimento online", "atendimento presencial", "bebidas", "comemorações e grupos",
         "comida", "conforto e barulho", "curadoria e conservação do acervo", "espaço e lotação",
         "eventos e comunidade", "explicação de jogos", "indicações de jogos", "limpeza", "localização e acesso",
         "porções", "preço da entrada", "preço do cardápio", "preço de outros itens", "rapidez do serviço",
         "regras da casa", "variedade do acervo", "variedade do cardápio"]
CONTEXTOS = ["amigos", "família", "casal", "aniversário", "aluguel", "loja", "apenas loja"]


def _dias(**v):
    """Atalho: _dias(ter_qui=10, sex_dom=15) -> taxa por dia da semana."""
    faixa = {"seg": 0, "ter": 1, "qua": 2, "qui": 3, "sex": 4, "sab": 5, "dom": 6}
    out = {}
    for chave, valor in v.items():
        partes = chave.split("_")
        a, b = faixa[partes[0]], faixa[partes[-1]]
        for i in range(a, b + 1):
            out[DIAS[i]] = valor
    return out


# taxa de entrada por dia (R$ por pessoa), por place_id: (casa, fonte, taxas, horas cobertas)
# horas cobertas None = o dia inteiro de funcionamento (passe do dia, couvert da permanência)
TAXAS = {
    "ChIJRcWOaPabpgARDvX2Bad0qb0": ("Bardo Mago", "cardápio (B1), Instagram 12/02/2026",
                                    _dias(qua_qui=15, sex_dom=25), None),
    "ChIJpzB8zc2XpgARoJTUu90J6Pw": ("Comdado Bar e Jogos", "cardápio (B1), print dez/2025",
                                    _dias(qua_qui=15, sex_dom=20), None),
    "ChIJ-17ZQDG9pgARc-AxpXmaNRU": ("La Tabuleria", "cardápio (B1), Saipos; sem consumo de R$ 80, que a cesta não passa",
                                    _dias(qua_qui=10, sex_sab=20, dom=15), None),
    "ChIJx5jr3zGXpgARQGx9eX7TDmY": ("LudoCafé", "cardápio (B1), cartaz jul/2024; com consumo mínimo de R$ 50, que a cesta passa",
                                    _dias(ter_qui=10, sex_dom=20), None),
    "ChIJ6ZLMZw-XpgAR_OR6SwY5xKo": ("Shelf Bar e Jogos", "cardápio (B1)",
                                    _dias(ter=15, qua_qui=20, sex_dom=30), None),
    "ChIJ-97tiEeNpJIRb_eV7a-sxBs": ("Ludoteca Sidequest", "cardápio (B1), site",
                                    _dias(qua_qui=23, sex_dom=28), None),
    "ChIJ15nLgwAwWpMRY1whwD29ZSo": ("Ludoteca BGC", "fonte secundária (B1): Metrópoles, 31/10/2024",
                                    _dias(ter_qui=15, sex_dom=20), None),
    "ChIJzdFNP3AyWpMRH2P6HEuhE-I": ("Loja de Jogos - Asgard", "cardápio (B1); isenção a cada R$ 60, que a cesta não passa",
                                    _dias(seg_qui=10, sex_dom=25), None),
    "ChIJY_lqHVLl3JQRvDHacOMDKuc": ("BoardZ Game Pub", "cardápio (B1), Day Pass do site",
                                    _dias(ter_qui=10, sex_dom=15), None),
    "ChIJ41pgHNFDGZURC7yTegyn7nU": ("Toca do Rato - Pizzaria e Jogos de Tabuleiro", "cardápio (B1), Instagram 04/10/2025",
                                    _dias(seg_sab=5), None),
    "ChIJRUjwU66WoGgRzc9yJU7jkwM": ("Nala Land - Bar de Jogos de Tabuleiro em Recife", "cardápio (B1), Instagram 29/04/2026",
                                    _dias(qui_sex=20, sab_dom=25), None),
    "ChIJ90Gs_9rVmwAReA7MnIyPLTE": ("Luderia Carioca", "cardápio (B1), Instagram 07/04/2026",
                                    _dias(qua_dom=20), None),
    "ChIJOcVssmeDmQARZZrnWu2mnwA": ("TabuClub", "cardápio (B1), Instagram 27/01/2026",
                                    _dias(ter_sex=20, sab_dom=25), None),
    "ChIJoTlvBfMbFgcRHvuCKHBQrXQ": ("São Jogue - Bela Vista", "busca profunda (B1), site: por turno de 3 h",
                                    _dias(seg_qui=22, sex_dom=28), 3.0),
    "ChIJYTHwWgBbzpQRFenbJdM5cxU": ("Arena BG | Jogos de Tabuleiro | Hamburgueria", "cardápio (B1)",
                                    _dias(qua_qui=0, sex=12.5, sab_dom=25), None),
    "ChIJKeHwNv5ZzpQRlmzx9rCTWdM": ("Bodogami Restaurante e Cafeteria", "fonte secundária (B1): CNN Brasil, 02/10/2024; só para quem joga",
                                    _dias(seg_sex=25, sab_dom=35), None),
    "ChIJbZRHQPRfzpQRz97-ZOg0yXA": ("Castelos Bar & Boardgames", "fonte secundária (B1): QuintoAndar, 23/09/2025 (sem cobrança)",
                                    _dias(seg_dom=0), None),
    "ChIJ7_DDAlH1zpQRJVJ0UHnItH8": ("Covil Game Bar", "cardápio (B1), Instagram 29/04/2024",
                                    _dias(qua_qui=15, sex_sab=20, dom=15), None),
    "ChIJZz29dnVXzpQRvRh7_YKyUN4": ("Encounter | Jogos de Tabuleiro | Board Games", "cardápio (B1), Instagram 03/01/2026",
                                    _dias(ter_qui=35, sex=40, sab=45, dom=40), None),
    "ChIJ_aN4OAxXzpQR0UH63sAeVCA": ("Fan Hour Games and Burgers", "cardápio (B1), São Paulo para Crianças 05/10/2026",
                                    _dias(seg_dom=20), None),
    "ChIJTaG5ALpZzpQRUDErQ-RkfTs": ("Ludus Luderia", "cardápio (B1), site: não cobra por tempo nem por jogo",
                                    _dias(seg_dom=0), None),
    "ChIJkWsGmd1czpQRGLydxc29vbw": ("Place Games", "cardápio (B1), Instagram 31/07/2026; quinta (confraria) grátis",
                                    _dias(qua=25, qui=0, sex_dom=25), None),
    "ChIJfyav9YI9uAARjwbBqcRm2_k": ("Café Geek Cafeteria e Ludoteca", "cardápio (B1); mediana dos 5 níveis do Ludoporte",
                                    _dias(seg_dom=10), None),
}


# ---------------------------------------------------------------- utilidades estatísticas
def fisher_bilateral(a, b, c, d):
    """Teste exato de Fisher bilateral na tabela [[a, b], [c, d]]."""
    n1, n2, m = a + b, c + d, a + c
    n = n1 + n2
    total = math.comb(n, m)
    def p(x):
        return math.comb(n1, x) * math.comb(n2, m - x) / total
    obs = p(a)
    lo, hi = max(0, m - n2), min(n1, m)
    return min(1.0, sum(p(x) for x in range(lo, hi + 1) if p(x) <= obs * (1 + 1e-9)))


def qui2_sf(x, gl):
    """P(X > x) para qui-quadrado com gl inteiro (fórmulas fechadas)."""
    if x <= 0:
        return 1.0
    h = x / 2
    if gl % 2 == 0:
        return math.exp(-h) * sum(h ** i / math.factorial(i) for i in range(gl // 2))
    s = math.erfc(math.sqrt(h))
    s += math.exp(-h) * sum(h ** (i - 0.5) / math.gamma(i + 0.5) for i in range(1, (gl - 1) // 2 + 1))
    return min(1.0, s)


def qui2_independencia(tabela):
    t = np.asarray(tabela, dtype=float)
    t = t[:, t.sum(axis=0) > 0]
    if t.shape[1] < 2 or (t.sum(axis=1) == 0).any():
        return float("nan"), float("nan")
    esp = t.sum(axis=1, keepdims=True) @ t.sum(axis=0, keepdims=True) / t.sum()
    x = float(((t - esp) ** 2 / esp).sum())
    return x, qui2_sf(x, (t.shape[0] - 1) * (t.shape[1] - 1))


def bh(p):
    """q de Benjamini-Hochberg (NaN fica NaN)."""
    p = pd.Series(p, dtype=float)
    ok = p.dropna().sort_values()
    m = len(ok)
    q = (ok * m / np.arange(1, m + 1))[::-1].cummin()[::-1].clip(upper=1)
    return q.reindex(p.index)


def kmeans(x, k, rng, inicios=100, iter_max=300):
    best = None
    for _ in range(inicios):
        c = x[rng.choice(len(x), k, replace=False)]
        for _ in range(iter_max):
            rot = ((x[:, None, :] - c[None]) ** 2).sum(-1).argmin(1)
            novo = np.array([x[rot == j].mean(0) if (rot == j).any() else c[j] for j in range(k)])
            if np.allclose(novo, c):
                break
            c = novo
        inercia = ((x - c[rot]) ** 2).sum()
        if best is None or inercia < best[0] - 1e-12:
            best = (inercia, rot, c)
    return best[1], best[2]


def silhueta(x, rot):
    dist = np.sqrt(((x[:, None, :] - x[None]) ** 2).sum(-1))
    s = np.zeros(len(x))
    for i in range(len(x)):
        mesmo = rot == rot[i]
        if mesmo.sum() <= 1:
            continue
        a = dist[i, mesmo].sum() / (mesmo.sum() - 1)
        b = min(dist[i, rot == j].mean() for j in set(rot) if j != rot[i])
        s[i] = (b - a) / max(a, b) if max(a, b) > 0 else 0
    return float(s.mean())


def agrupar(x, nome, silh, k_fixo=None):
    """k pela maior silhueta (ou k_fixo); rótulos 1..k do centroide mais baixo ao mais alto (soma das coordenadas)."""
    res = {}
    for k in K_CANDIDATOS:
        rot, c = kmeans(x, k, np.random.default_rng(SEMENTE))
        res[k] = (rot, c, silhueta(x, rot))
        silh.append({"agrupamento": nome, "k": k, "silhueta_media": round(res[k][2], 3),
                     "menor_grupo": int(np.bincount(rot).min())})
    k = k_fixo or max(res, key=lambda j: res[j][2])
    rot, c, _ = res[k]
    ordem = np.argsort(c.sum(1))
    mapa = {int(o): i + 1 for i, o in enumerate(ordem)}
    return np.array([mapa[int(r)] for r in rot]), k


# ---------------------------------------------------------------- dados
def itens(v):
    return {t.strip() for t in str(v).split(",") if t.strip()} if pd.notna(v) else set()


def gasto(v):
    if pd.isna(v):
        return float("nan")
    s = str(v).strip()
    n = [float(x) for x in re.findall(r"\d+", s)]
    if s.startswith("+") or s.endswith("+"):
        return n[0]
    return (n[0] + n[1]) / 2 if len(n) >= 2 else n[0]


def carrega():
    d = pd.read_csv(BASE)
    assert len(d) == 1628, len(d)
    d["pos"] = d["Itens positivos"].map(itens)
    d["neg"] = d["Itens negativos"].map(itens)
    d["ctx"] = d["Contexto"].map(itens)
    desconhecidos = set().union(*d["pos"], *d["neg"]) - set(TEMAS)
    assert not desconhecidos, desconhecidos
    d["nota"] = pd.to_numeric(d["Nota geral"], errors="coerce")
    d["gasto"] = d["Preço por pessoa (R$)"].map(gasto)
    return d


def marcas(d):
    """Colunas booleanas tema|polaridade, mais 'qualquer'."""
    m = {}
    for t in TEMAS:
        m[(t, "elogio")] = d["pos"].map(lambda s, t=t: t in s)
        m[(t, "crítica")] = d["neg"].map(lambda s, t=t: t in s)
    m[("qualquer tema", "elogio")] = d["pos"].map(bool)
    m[("qualquer tema", "crítica")] = d["neg"].map(bool)
    return m


# ---------------------------------------------------------------- 1. retorno
def comparar(d, grupo_a, grupo_b, rotulo, nome_a, nome_b):
    m = marcas(d)
    lin = []
    for (t, pol), s in m.items():
        a, c = int(s[grupo_a].sum()), int(s[grupo_b].sum())
        na, nb = int(grupo_a.sum()), int(grupo_b.sum())
        if a + c == 0:
            continue
        b, dd = na - a, nb - c
        rc = ((a + .5) * (dd + .5)) / ((b + .5) * (c + .5))
        lin.append({"comparacao": rotulo, "tema": t, "polaridade": pol,
                    "n_grupo_a": a, "pct_grupo_a": round(100 * a / na, 1),
                    "n_grupo_b": c, "pct_grupo_b": round(100 * c / nb, 1),
                    "dif_pp": round(100 * (a / na - c / nb), 1), "razao_chances": round(rc, 2),
                    "p_fisher": fisher_bilateral(a, b, c, dd)})
    r = pd.DataFrame(lin)
    r.insert(1, "grupo_a", f"{nome_a} (n = {int(grupo_a.sum())})")
    r.insert(2, "grupo_b", f"{nome_b} (n = {int(grupo_b.sum())})")
    tem = r["tema"] != "qualquer tema"
    r.loc[tem, "q_bh"] = bh(r.loc[tem, "p_fisher"])
    r["p_fisher"] = r["p_fisher"].round(4)
    r["q_bh"] = r["q_bh"].round(4)
    return r.sort_values("p_fisher")


def retorno(d):
    v = d["Voltará"]
    sim, nao = v.eq("sim"), v.eq("não")
    critica = d["neg"].map(bool)
    baixa = d["nota"].le(2)
    t = pd.concat([
        comparar(d, sim, nao, "a) volta x não volta", "volta", "nao_volta"),
        comparar(d, sim & critica, nao & critica, "b) com crítica: volta x não volta", "volta_criticando", "nao_volta"),
        comparar(d, nao & baixa, v.isna() & baixa, "c) nota 1-2: não volta x sem decisão", "nao_volta", "nota_baixa_sem_decisao"),
    ])
    # resumo numérico por decisão (uma avaliação em um único grupo)
    grupo = np.select([sim, nao], ["volta", "não volta"], "não dito")
    lin = []
    for g in ["volta", "não volta", "não dito"]:
        x = d[grupo == g]
        lin.append({"decisao": g, "avaliacoes": len(x), "nota_media": round(x["nota"].mean(), 2),
                    **{f"{a.lower()}_media": round(x[a].mean(), 2) for a in ("Comida", "Serviço", "Ambiente")},
                    **{f"{a.lower()}_n": int(x[a].notna().sum()) for a in ("Comida", "Serviço", "Ambiente")},
                    "temas_elogio_media": round(x["pos"].map(len).mean(), 2),
                    "temas_critica_media": round(x["neg"].map(len).mean(), 2),
                    "pct_com_critica": round(100 * x["neg"].map(bool).mean(), 1),
                    "costuma_ir_sim": int(x["Costuma ir"].eq("sim").sum()),
                    "costuma_ir_segunda_vez": int(x["Costuma ir"].eq("segunda vez").sum()),
                    "costuma_ir_nao": int(x["Costuma ir"].eq("não").sum()),
                    "gasto_declarado_n": int(x["gasto"].notna().sum()),
                    "gasto_declarado_medio": round(x["gasto"].mean(), 2),
                    **{f"contexto_{c}": int(x["ctx"].map(lambda s, c=c: c in s).sum()) for c in CONTEXTOS}})
    r = pd.DataFrame(lin)
    assert r["avaliacoes"].sum() == len(d), "decisões não fecham com o total"
    return t, r


# ---------------------------------------------------------------- 2 e 3. conteúdo por grupo
def conteudo(d, col, rotulos):
    """Tema x polaridade x grupo: % das avaliações do grupo, mais qui-quadrado entre grupos."""
    m = marcas(d)
    lin = []
    grupos = sorted(d[col].dropna().unique())
    for (t, pol), s in m.items():
        tab = [[int(s[d[col] == g].sum()), int((~s[d[col] == g]).sum())] for g in grupos]
        x2, p = qui2_independencia(tab)
        reg = {"tema": t, "polaridade": pol}
        for g, (n_sim, n_nao) in zip(grupos, tab):
            reg[f"pct_{rotulos[g]}"] = round(100 * n_sim / (n_sim + n_nao), 1)
            reg[f"n_{rotulos[g]}"] = n_sim
        reg["qui2"], reg["p"] = round(x2, 2), p
        lin.append(reg)
    r = pd.DataFrame(lin)
    tem = r["tema"] != "qualquer tema"
    r.loc[tem, "q_bh"] = bh(r.loc[tem, "p"])
    r["p"], r["q_bh"] = r["p"].round(4), r["q_bh"].round(4)
    return r.sort_values("p")


def distribuicao_interna(conteudo_df, rotulos):
    """Dentro de cada grupo: % de cada tema no total de menções de elogio (ou de crítica) do grupo.
    Unidade = menção (avaliação × tema); cada coluna soma 100% (diferença zero, senão para)."""
    x = conteudo_df[conteudo_df["tema"] != "qualquer tema"]
    lin = []
    for pol in ("elogio", "crítica"):
        t = x[x["polaridade"] == pol].set_index("tema")[[f"n_{r}" for r in rotulos.values()]]
        tot = t.sum(axis=0)
        for tema, linha in t.iterrows():
            lin.append({"polaridade": pol, "tema": tema,
                        **{f"mencoes_{r}": int(linha[f"n_{r}"]) for r in rotulos.values()},
                        **{f"pct_mencoes_{r}": round(100 * linha[f"n_{r}"] / tot[f"n_{r}"], 1) for r in rotulos.values()}})
        for r in rotulos.values():
            assert int(t[f"n_{r}"].sum()) == int(tot[f"n_{r}"])
    return pd.DataFrame(lin)


def resumo_grupo(d, col, rotulos, extra=None):
    lin = []
    for g in sorted(d[col].dropna().unique()):
        x = d[d[col] == g]
        v = x["Voltará"]
        maior = x["Estabelecimento"].value_counts()
        reg = {"grupo": rotulos[g], "avaliacoes": len(x), "nota_media": round(x["nota"].mean(), 2),
               "pct_nota_1_2": round(100 * x["nota"].le(2).mean(), 1),
               "volta": int(v.eq("sim").sum()), "nao_volta": int(v.eq("não").sum()),
               "pct_com_critica": round(100 * x["neg"].map(bool).mean(), 1),
               "gasto_declarado_n": int(x["gasto"].notna().sum()),
               "gasto_declarado_medio": round(x["gasto"].mean(), 2),
               "gasto_declarado_min": x["gasto"].min(), "gasto_declarado_max": x["gasto"].max(),
               "casas": x["Estabelecimento"].nunique(),
               "casa_com_mais_avaliacoes": maior.index[0], "pct_da_maior_casa": round(100 * maior.iloc[0] / len(x), 1),
               **{f"contexto_{c}": int(x["ctx"].map(lambda s, c=c: c in s).sum()) for c in CONTEXTOS}}
        if extra is not None:
            reg.update(extra(g))
        lin.append(reg)
    return pd.DataFrame(lin)


def chave(nome):
    """Nome sem pontuação nem caixa: o Notion grafa "Flow Games - Burgers Cards" sem a vírgula do B1."""
    return re.sub(r"[^a-z0-9à-ü]+", " ", str(nome).lower()).strip()


def horas(intervalo):
    if pd.isna(intervalo):
        return 0.0
    tot = 0.0
    for seg in str(intervalo).split("|"):
        a, b = [int(h) + int(m) / 60 for h, m in (x.strip().split(":") for x in seg.split("-"))]
        tot += (b - a) % 24 or 24
    return tot


def casas(d, silh):
    es = pd.read_excel(B1, sheet_name="estabelecimentos")
    ce = pd.read_excel(B1, sheet_name="cesta")
    t = es[["place_id", "nome", "capital_endereco"] + DIAS].merge(
        ce[["place_id", "bebida_mediana", "entrada_ou_prato_mediana"]], on="place_id", how="left")
    nomes = es.set_index("place_id")["nome"]
    errados = {k: v[0] for k, v in TAXAS.items() if nomes.get(k) != v[0]}
    assert not errados, f"place_id de TAXAS fora do B1 ou com outro nome: {errados}"
    lin = []
    for r in t.itertuples():
        base = {"place_id": r.place_id, "nome": r.nome, "metropole": r.capital_endereco,
                "bebida_mediana": r.bebida_mediana, "entrada_ou_prato_mediana": r.entrada_ou_prato_mediana}
        if r.place_id not in TAXAS:
            lin.append({**base, "situacao_taxa": "não encontrada"})
            continue
        _, fonte, regra, cobre = TAXAS[r.place_id]
        abertos = [x for x in DIAS if pd.notna(getattr(r, x))]
        falta = [x for x in abertos if x not in regra]
        assert not falta, f"{r.nome}: dia aberto sem taxa {falta}"
        por_hora = [regra[x] / (cobre or horas(getattr(r, x))) for x in abertos]
        lin.append({**base, "situacao_taxa": "encontrada", "fonte_taxa": fonte, "dias_abertos": len(abertos),
                    "horas_cobertas": "3 h (turno)" if cobre else "dia inteiro",
                    "taxa_media_dia": round(sum(regra[x] for x in abertos) / len(abertos), 2),
                    "taxa_por_hora": round(sum(por_hora) / len(por_hora), 3)})
    c = pd.DataFrame(lin)
    c["consumo_por_pessoa"] = c["bebida_mediana"] + c["entrada_ou_prato_mediana"]
    c["cesta_completa"] = c["consumo_por_pessoa"] + c["taxa_media_dia"]
    n_aval = d.groupby(d["Estabelecimento"].map(chave)).size()
    c["avaliacoes_b2"] = c["nome"].map(chave).map(n_aval).fillna(0).astype(int)
    ok = c["taxa_por_hora"].notna() & c["consumo_por_pessoa"].notna() & (c["avaliacoes_b2"] > 0)
    c["no_agrupamento"] = np.where(ok, "sim", "não")
    c["motivo_fora"] = np.select(
        [ok, c["taxa_por_hora"].isna(), c["consumo_por_pessoa"].isna()],
        ["", "taxa não encontrada", "bebida ou prato não encontrado"], "sem avaliação no B2")
    x = c.loc[ok, ["taxa_por_hora", "consumo_por_pessoa"]].to_numpy(float)
    z = (x - x.mean(0)) / x.std(0)
    rot, k = agrupar(z, "casas (taxa por hora, consumo)", silh)
    c.loc[ok, "grupo"] = rot
    return c.sort_values(["no_agrupamento", "grupo", "taxa_por_hora"], ascending=[False, True, True]), k


ROT_PRECO = {2: ["mais barato", "mais caro"], 3: ["mais barato", "intermediário", "mais caro"],
             4: ["mais barato", "intermediário baixo", "intermediário alto", "mais caro"],
             5: ["1 mais barato", "2", "3", "4", "5 mais caro"]}


def main():
    PASTA.mkdir(parents=True, exist_ok=True)
    d = carrega()
    silh = []

    # 1. retorno
    t, r = retorno(d)
    t.to_csv(PASTA / "B2_retorno_temas.csv", sep=";", index=False, encoding="utf-8-sig")
    r.to_csv(PASTA / "B2_retorno_decisao_resumo.csv", sep=";", index=False, encoding="utf-8-sig")
    print(r[["decisao", "avaliacoes", "nota_media", "pct_com_critica", "gasto_declarado_medio"]].to_string(index=False))
    print(t[t["q_bh"].lt(0.10)][["comparacao", "tema", "polaridade", "pct_grupo_a", "pct_grupo_b", "razao_chances",
                                 "p_fisher", "q_bh"]].to_string(index=False))

    # 2. casas por preço
    c, k = casas(d, silh)
    c.to_csv(PASTA / "B2_cluster_casas.csv", sep=";", index=False, encoding="utf-8-sig")
    # duas dimensões: o rótulo é só o número; o perfil (centroide em desvios-padrão) sai no resumo
    rot_c = {i + 1: f"casas_grupo_{i + 1}" for i in range(k)}
    mapa = c.dropna(subset=["grupo"]).assign(k=lambda x: x["nome"].map(chave)).set_index("k")["grupo"].astype(int)
    dc = d.assign(grupo_casa=d["Estabelecimento"].map(chave).map(mapa))
    dc = dc[dc["grupo_casa"].notna()].copy()
    dc["grupo_casa"] = dc["grupo_casa"].astype(int)
    assert len(dc) == c.loc[c["no_agrupamento"] == "sim", "avaliacoes_b2"].sum(), "avaliações das casas não fecham"
    cc = conteudo(dc, "grupo_casa", rot_c)
    cc.to_csv(PASTA / "B2_cluster_casas_conteudo.csv", sep=";", index=False, encoding="utf-8-sig")
    distribuicao_interna(cc, rot_c).to_csv(PASTA / "B2_cluster_casas_distribuicao.csv", sep=";", index=False,
                                           encoding="utf-8-sig")

    def extra_casa(g):
        x = c[c["grupo"] == g]
        ok = c["no_agrupamento"] == "sim"
        z = {v: (x[v].mean() - c.loc[ok, v].mean()) / c.loc[ok, v].std(ddof=0) for v in ("taxa_por_hora", "consumo_por_pessoa")}
        return {"n_casas_grupo": len(x),
                "centroide_z_taxa_por_hora": round(z["taxa_por_hora"], 2),
                "centroide_z_consumo": round(z["consumo_por_pessoa"], 2), "taxa_por_hora_media": round(x["taxa_por_hora"].mean(), 2),
                "taxa_por_hora_min": x["taxa_por_hora"].min(), "taxa_por_hora_max": x["taxa_por_hora"].max(),
                "consumo_medio": round(x["consumo_por_pessoa"].mean(), 2),
                "consumo_min": x["consumo_por_pessoa"].min(), "consumo_max": x["consumo_por_pessoa"].max(),
                "cesta_completa_media": round(x["cesta_completa"].mean(), 2),
                "lista_casas": ", ".join(x["nome"])}
    rc = resumo_grupo(dc, "grupo_casa", rot_c, extra_casa)
    assert rc["avaliacoes"].sum() == len(dc)
    rc.to_csv(PASTA / "B2_cluster_casas_resumo.csv", sep=";", index=False, encoding="utf-8-sig")
    print(f"\ncasas: k = {k}; {int((c['no_agrupamento'] == 'sim').sum())} casas, {len(dc)} avaliações")
    print(rc[["grupo", "n_casas_grupo", "avaliacoes", "taxa_por_hora_media", "consumo_medio", "nota_media",
              "volta", "nao_volta", "pct_da_maior_casa"]].to_string(index=False))

    # 3. clientes pelo gasto declarado
    dg = d[d["gasto"].notna()].copy()
    rot, kg = agrupar(dg[["gasto"]].to_numpy(float), "clientes (gasto declarado)", silh, K_CLIENTES)
    dg["grupo_cliente"] = rot
    rot_g = {i + 1: f"gasto_{n.replace(' ', '_')}" for i, n in enumerate(ROT_PRECO[kg])}
    cg = conteudo(dg, "grupo_cliente", rot_g)
    cg.to_csv(PASTA / "B2_cluster_clientes_conteudo.csv", sep=";", index=False, encoding="utf-8-sig")
    distribuicao_interna(cg, rot_g).to_csv(PASTA / "B2_cluster_clientes_distribuicao.csv", sep=";", index=False,
                                           encoding="utf-8-sig")
    # mesma distribuição interna, só nas avaliações com a decisão dita (volta: elogios; não volta: críticas)
    partes = []
    for decisao, pol in (("sim", "elogio"), ("não", "crítica")):
        sub = dg[dg["Voltará"] == decisao]
        dist = distribuicao_interna(conteudo(sub, "grupo_cliente", {g: rot_g[g] for g in sorted(sub["grupo_cliente"].unique())}),
                                    {g: rot_g[g] for g in sorted(sub["grupo_cliente"].unique())})
        partes.append(dist[dist["polaridade"] == pol].assign(decisao=("volta" if decisao == "sim" else "não volta"),
                                                             avaliacoes=len(sub)))
    pd.concat(partes).to_csv(PASTA / "B2_cluster_clientes_distribuicao_por_decisao.csv", sep=";", index=False,
                             encoding="utf-8-sig")
    # robustez (pedido do autor): elogios com k = 2, em todas as avaliações com gasto e só nas "volta"
    rot2, _ = agrupar(dg[["gasto"]].to_numpy(float), "clientes k = 2 (robustez)", [], 2)
    d2 = dg.assign(grupo_k2=rot2)
    r2 = {1: "gasto_baixo_k2", 2: "gasto_alto_k2"}
    partes = []
    for nome, sub in (("todas", d2), ("volta", d2[d2["Voltará"] == "sim"])):
        dist = distribuicao_interna(conteudo(sub, "grupo_k2", r2), r2)
        partes.append(dist[dist["polaridade"] == "elogio"].assign(
            avaliacoes=nome, **{f"n_avaliacoes_{r2[g]}": int((sub["grupo_k2"] == g).sum()) for g in r2},
            **{f"gasto_min_{r2[g]}": d2.loc[d2["grupo_k2"] == g, "gasto"].min() for g in r2},
            **{f"gasto_max_{r2[g]}": d2.loc[d2["grupo_k2"] == g, "gasto"].max() for g in r2}))
    pd.concat(partes).to_csv(PASTA / "B2_cluster_clientes_k2_elogios.csv", sep=";", index=False, encoding="utf-8-sig")
    # robustez (pedido do autor): resumo e temas dos grupos de gasto com k = 2 e k = 5
    res_k, cont_k = [], []
    for kk in (2, 5):
        rk, _ = agrupar(dg[["gasto"]].to_numpy(float), f"clientes k = {kk} (robustez)", [], kk)
        dk = dg.assign(grupo_k=rk)
        rotk = {i + 1: f"k{kk}_grupo_{i + 1}" for i in range(kk)}
        r = resumo_grupo(dk, "grupo_k", rotk)
        assert r["avaliacoes"].sum() == len(dk)
        res_k.append(r.assign(k=kk))
        cont_k.append(conteudo(dk, "grupo_k", rotk).assign(k=kk))
    pd.concat(res_k).to_csv(PASTA / "B2_cluster_clientes_k2_k5_resumo.csv", sep=";", index=False, encoding="utf-8-sig")
    pd.concat(cont_k).to_csv(PASTA / "B2_cluster_clientes_k2_k5_conteudo.csv", sep=";", index=False, encoding="utf-8-sig")
    rg = resumo_grupo(dg, "grupo_cliente", rot_g)
    assert rg["avaliacoes"].sum() == len(dg), "grupos de clientes não fecham com o total com gasto"
    rg.to_csv(PASTA / "B2_cluster_clientes_resumo.csv", sep=";", index=False, encoding="utf-8-sig")
    pd.DataFrame(silh).to_csv(PASTA / "B2_cluster_silhueta.csv", sep=";", index=False, encoding="utf-8-sig")
    print(f"\nclientes: k = {kg}; {len(dg)} avaliações com gasto")
    print(rg[["grupo", "avaliacoes", "gasto_declarado_min", "gasto_declarado_max", "gasto_declarado_medio", "nota_media",
              "volta", "nao_volta", "casas", "pct_da_maior_casa"]].to_string(index=False))
    print(pd.DataFrame(silh).to_string(index=False))
    for nome, x in (("casas", cc), ("clientes", cg)):
        print(f"\n{nome}: temas com q < 0,10")
        print(x[x["q_bh"].lt(0.10)].drop(columns=[k for k in x.columns if k.startswith("n_")]).to_string(index=False))
    print(f"OK: {PASTA.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
