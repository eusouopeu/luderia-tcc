"""
Bloco B2 - tabelas agregadas da análise de conteúdo na grade 2 (22 temas) e
concordância da recodificação cega. Substitui, para o texto do TCC, as
tabelas `B2_bardin_*` do livro de códigos de 15/10/2026: a grade validada pela
recodificação é a do Notion (decisão de 03/11/2026).

Entradas:
  dados/B2_avaliacoes/_dados-brutos/analise_conteudo/2026-11-03_2_comentarios_grade2.csv  (B2-b_comentarios_grade2.py)
  dados/B2_avaliacoes/_dados-agregados/analise_conteudo/B2_recodificacao_rodada1.csv e B2_recodificacao_rodada2.csv
Saídas em dados/B2_avaliacoes/_dados-agregados/analise_conteudo/:
  B2_temas_frequencia.csv      tema x polaridade: comentários, % das 1.628, nota média
  B2_temas_contexto.csv        contexto (exploratório), comentários e %
  B2_temas_estabelecimentos.csv comentários e comentários com tema por estabelecimento
  B2_recodificacao_kappa.csv   kappa de Cohen por rodada e variável
Figura: graficos/<png|svg|valores>/B2_temas_polaridade, copiada para
textos/capitulos/figuras/6_temas_avaliacoes.png.

Regras de contagem:
  - unidade = comentário; um tema conta uma vez por comentário e polaridade;
  - temas e contextos não são exclusivos: um comentário entra em vários
    grupos, e a soma das linhas passa do total por desenho (colunas com
    "comentarios_" + polaridade; o total de referência é o de comentários);
  - cada comentário pertence a um único estabelecimento (o da coleta): a
    tabela por estabelecimento fecha com 1.628 (diferença zero, senão para);
  - kappa agrupado: unidade = comentário x tema x polaridade (ou comentário x
    contexto), tabela 2x2 somada; "Costuma ir" e "Voltará" por categoria,
    com vazio = "não foi dito". Mesmo método da comparação registrada em
    03/11/2026 (reproduz 0,83 e 0,58 na rodada 1).

Uso:
    python3 "_src/[B2] Avaliacoes recentes/Google Places (Comentários)/analise/B2-a_temas_grade2.py"
"""
# Caminhos: _src/extras/ (log comum e padrão de gráficos); log em ../logs/
import sys
from pathlib import Path
_AQUI = Path(__file__).resolve()
sys.path[:0] = [str(_AQUI.parents[3] / "extras")]
from log_execucao import registrar_execucao  # noqa: E402
if __name__ == "__main__":
    registrar_execucao(__file__)

import collections  # noqa: E402
import shutil  # noqa: E402

import pandas as pd  # noqa: E402

import graficos_comum as gc  # noqa: E402

ROOT = Path(__file__).resolve().parents[4]
B2 = ROOT / "dados" / "B2_avaliacoes" / "_dados-agregados"
PASTA = B2 / "analise_conteudo"
BASE = ROOT / "dados" / "B2_avaliacoes" / "_dados-brutos" / "analise_conteudo" / "2026-11-03_2_comentarios_grade2.csv"
GRAF = B2 / "graficos"
FIG_CAP = ROOT / "textos" / "capitulos" / "figuras" / "6_temas_avaliacoes.png"

TEMAS = ["ambiente e decoração", "atendimento online", "atendimento presencial", "bebidas", "comemorações e grupos",
         "comida", "conforto e barulho", "curadoria e conservação do acervo", "espaço e lotação",
         "eventos e comunidade", "explicação de jogos", "indicações de jogos", "limpeza", "localização e acesso",
         "porções", "preço da entrada", "preço do cardápio", "preço de outros itens", "rapidez do serviço",
         "regras da casa", "variedade do acervo", "variedade do cardápio"]
CONTEXTOS = ["amigos", "família", "casal", "aniversário", "aluguel", "loja", "apenas loja"]
CRITERIO_KAPPA = 0.70
ROXO, ARDOSIA = "#6b21a8", "#475569"  # roxo-800 e ardósia-600 (planilha_estilo.py), como na Figura 6.2


def itens(v):
    return {t.strip() for t in str(v).split(",") if t.strip()} if pd.notna(v) else set()


def carrega():
    d = pd.read_csv(BASE)
    d["pos"] = d["Itens positivos"].map(itens)
    d["neg"] = d["Itens negativos"].map(itens)
    d["ctx"] = d["Contexto"].map(itens)
    d["nota"] = pd.to_numeric(d["Nota geral"], errors="coerce")
    assert len(d) == 1628, len(d)
    return d


def frequencia(d):
    n = len(d)
    lin = []
    for t in TEMAS:
        p = d["pos"].map(lambda s, t=t: t in s)
        q = d["neg"].map(lambda s, t=t: t in s)
        lin.append({"tema": t, "comentarios_elogio": int(p.sum()), "comentarios_critica": int(q.sum()),
                    "comentarios_com_tema": int((p | q).sum()),
                    "pct_elogio": round(100 * p.mean(), 1), "pct_critica": round(100 * q.mean(), 1),
                    "pct_com_tema": round(100 * (p | q).mean(), 1),
                    "nota_media_elogio": round(d.loc[p, "nota"].mean(), 2) if p.any() else None,
                    "nota_media_critica": round(d.loc[q, "nota"].mean(), 2) if q.any() else None})
    f = pd.DataFrame(lin).sort_values("comentarios_com_tema", ascending=False)
    f.attrs["n"] = n
    return f


def contexto(d):
    return pd.DataFrame([{"contexto": c, "comentarios": int(d["ctx"].map(lambda s, c=c: c in s).sum()),
                          "pct_comentarios": round(100 * d["ctx"].map(lambda s, c=c: c in s).mean(), 1)}
                         for c in CONTEXTOS]).sort_values("comentarios", ascending=False)


def estabelecimentos(d):
    e = (d.assign(com_tema=(d["pos"].map(len) + d["neg"].map(len)) > 0)
         .groupby(["Capital do endereço", "Estabelecimento"])
         .agg(comentarios=("id", "size"), comentarios_com_tema=("com_tema", "sum")).reset_index()
         .rename(columns={"Capital do endereço": "metropole", "Estabelecimento": "estabelecimento"})
         .sort_values("comentarios", ascending=False))
    assert e["comentarios"].sum() == len(d), "estabelecimentos não fecham com o total"
    return e


# ---------------------------------------------------------------- kappa
def kappa(pares):
    n = len(pares)
    po = sum(a == b for a, b in pares) / n
    ca, cb = collections.Counter(a for a, _ in pares), collections.Counter(b for _, b in pares)
    pe = sum(ca[k] * cb[k] for k in set(ca) | set(cb)) / n ** 2
    return ((po - pe) / (1 - pe) if pe < 1 else float("nan")), po


def recodificacao():
    sp = lambda v: {x.strip() for x in str(v).split("|") if x.strip()} if pd.notna(v) else set()
    lin = []
    for rodada in (1, 2):
        r = pd.read_csv(PASTA / f"B2_recodificacao_rodada{rodada}.csv", sep=";", dtype=str)
        temas = sorted(set().union(*[sp(v) for c in ("autor_positivos", "autor_negativos", "claude_positivos",
                                                       "claude_negativos") for v in r[c]]))
        pares, marcas_a, marcas_c, comum = [], 0, 0, 0
        for pa, pc in (("autor_positivos", "claude_positivos"), ("autor_negativos", "claude_negativos")):
            for a, c in zip(r[pa].map(sp), r[pc].map(sp)):
                marcas_a += len(a); marcas_c += len(c); comum += len(a & c)
                pares += [(t in a, t in c) for t in temas]
        k, _ = kappa(pares)
        lin.append({"rodada": rodada, "variavel": "temas (positivos e negativos, agrupados)", "linhas": len(r),
                    "kappa": round(k, 2), "marcas_autor": marcas_a, "marcas_claude": marcas_c, "marcas_em_comum": comum})
        ctx = sorted(set().union(*[sp(v) for c in ("autor_contexto", "claude_contexto") for v in r[c]]))
        pares = [(t in a, t in c) for a, c in zip(r["autor_contexto"].map(sp), r["claude_contexto"].map(sp)) for t in ctx]
        k, _ = kappa(pares)
        lin.append({"rodada": rodada, "variavel": "contexto", "linhas": len(r), "kappa": round(k, 2),
                    "marcas_autor": int(r["autor_contexto"].map(lambda v: len(sp(v))).sum()),
                    "marcas_claude": int(r["claude_contexto"].map(lambda v: len(sp(v))).sum()),
                    "marcas_em_comum": int(sum(len(sp(a) & sp(c)) for a, c in zip(r["autor_contexto"], r["claude_contexto"])))})
        for var, ca, cc in (("costuma ir", "autor_costuma_ir", "claude_costuma_ir"), ("voltará", "autor_voltara", "claude_voltara")):
            if cc not in r:
                lin.append({"rodada": rodada, "variavel": var, "linhas": len(r), "kappa": None})
                continue
            nd = lambda v: v if pd.notna(v) and v else "não foi dito"
            k, po = kappa(list(zip(r[ca].map(nd), r[cc].map(nd))))
            lin.append({"rodada": rodada, "variavel": var, "linhas": len(r), "kappa": round(k, 2),
                        "concordancia_pct": round(100 * po, 1)})
    k = pd.DataFrame(lin)
    k["aceita"] = k["kappa"].map(lambda x: "" if pd.isna(x) else ("sim" if x >= CRITERIO_KAPPA else "não"))
    return k


# ---------------------------------------------------------------- figura
def figura(f):
    """Barras divergentes, sem título nem fonte embutidos: no .docx, a legenda e a fonte vêm do texto. Cores da
    Figura 6.2 (roxo para elogio, ardósia para crítica)."""
    import matplotlib.pyplot as plt
    f = f.sort_values("comentarios_com_tema")
    rot = [t[0].upper() + t[1:] for t in f["tema"]]
    fig, ax = plt.subplots(figsize=(7.0, 5.4))
    fig.subplots_adjust(left=0.33, right=0.97, top=0.93, bottom=0.02)
    y = range(len(f))
    ax.barh(y, -f["pct_critica"], color=ARDOSIA, height=0.7)
    ax.barh(y, f["pct_elogio"], color=ROXO, height=0.7)
    for i, (p, q) in enumerate(zip(f["pct_elogio"], f["pct_critica"])):
        if p:
            ax.text(p + 0.6, i, gc.br(p, 1), va="center", fontsize=8.5, color=ROXO)
        if q:
            ax.text(-q - 0.6, i, gc.br(q, 1), va="center", ha="right", fontsize=8.5, color=ARDOSIA)
    ax.set_yticks(list(y), rot, fontsize=9)
    ax.axvline(0, color=gc.CLARO, lw=0.8)
    ax.set_xlim(-12, f["pct_elogio"].max() + 6)
    ax.set_xticks([])
    ax.set_ylim(-0.6, len(f) - 0.4)
    ax.text(-0.8, len(f) - 0.2, "Crítica (% das avaliações)", ha="right", va="bottom", fontsize=9.5, color=ARDOSIA,
            fontweight="semibold")
    ax.text(0.8, len(f) - 0.2, "Elogio (% das avaliações)", ha="left", va="bottom", fontsize=9.5, color=ROXO,
            fontweight="semibold")
    val = f[["tema", "pct_elogio", "pct_critica", "comentarios_elogio", "comentarios_critica"]]
    gc.salvar(fig, GRAF, "B2_temas_polaridade", val)
    FIG_CAP.parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(GRAF / "png" / "B2_temas_polaridade.png", FIG_CAP)


def main():
    d = carrega()
    f = frequencia(d)
    f.to_csv(PASTA / "B2_temas_frequencia.csv", sep=";", index=False, encoding="utf-8-sig")
    c = contexto(d)
    c.to_csv(PASTA / "B2_temas_contexto.csv", sep=";", index=False, encoding="utf-8-sig")
    e = estabelecimentos(d)
    e.to_csv(PASTA / "B2_temas_estabelecimentos.csv", sep=";", index=False, encoding="utf-8-sig")
    k = recodificacao()
    k.to_csv(PASTA / "B2_recodificacao_kappa.csv", sep=";", index=False, encoding="utf-8-sig")
    figura(f)
    com_tema = int(((d["pos"].map(len) + d["neg"].map(len)) > 0).sum())
    print(f"{len(d)} comentários; {com_tema} com tema; {d['Estabelecimento'].nunique()} estabelecimentos "
          f"(soma por estabelecimento = {e['comentarios'].sum()}, diferença {len(d) - e['comentarios'].sum()})")
    print(f.to_string(index=False))
    print(c.to_string(index=False))
    print(k.to_string(index=False))
    print(f"OK: {FIG_CAP.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
