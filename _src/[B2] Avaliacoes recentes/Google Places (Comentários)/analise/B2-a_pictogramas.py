"""
Bloco B2 - pictogramas do que o público escreve nas avaliações do Google
(análise de conteúdo de Bardin, avaliações com texto até "3 meses atrás").

Três figuras, todas em "de cada N avaliações com texto":
- temas: quantas falam de cada categoria, qualquer polaridade (1 ícone = 5 em 100);
- reclamações: quantas trazem a categoria com polaridade negativa (1 ícone = 1 em 100);
- ocasião e perfil: com quem e para que o público vai (amigos, família,
  aniversário...), perfil declarado e funcionário citado pelo nome
  (grade de 100 ícones, 1 ícone = 1 avaliação em 100).

Entradas (saídas do B2-a_conteudo_bardin.py, em dados/[B2] Avaliacoes recentes/analise_conteudo/):
  B2_codificacao_bardin.csv          uma linha por avaliação; o total (n) é o das "analisada"
  B2_bardin_frequencia_categorias.csv  contagem por categoria e polaridade
  B2_bardin_contexto.csv             ocasião e sinais de perfil

Regras:
- o percentual desenhado é o ponderado por estabelecimento (média entre as
  casas do % de cada casa), leitura principal do B2 desde 15/10/2026 pela
  concentração de Bodogami e Shelf; o simples (contagem ÷ avaliações) vai
  na tabela de valores. Os dois são refeitos aqui a partir da codificação e
  conferidos contra o publicado pelo script de Bardin (até 0,05 p.p.);
- uma avaliação pode cair em várias categorias (contagem não exclusiva por
  desenho), então as linhas não somam 100%; por isso não há total como soma.

Saídas (dados/[B2] Avaliacoes recentes/graficos/): png/ (300 dpi), svg/ (texto
editável) e valores/ (B2_pict_*). Para atualizar depois de refazer a
codificação, rodar o B2-a_conteudo_bardin.py e depois este script.

Uso:
    python3 "_src/[B2] Avaliacoes recentes/Google Places (Comentários)/analise/B2-a_pictogramas.py"
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

import matplotlib.pyplot as plt  # noqa: E402
import pandas as pd  # noqa: E402

from graficos_comum import APAGADO, CORES, ICONES, fileira, fonte_rodape, salvar  # noqa: E402

ROOT = _AQUI.parents[4]
B2 = ROOT / "dados" / "[B2] Avaliacoes recentes"
AC = B2 / "analise_conteudo"
PASTA = B2 / "graficos"
FONTE = ("Fonte: avaliações com texto no Google Maps até \"3 meses atrás\" (coleta de 13 a 15/10/2026), "
         "codificadas por análise de conteúdo (Bardin) (B2).")


def milhar(v):
    return f"{v:,}".replace(",", ".")


# Rótulo da categoria quando só a polaridade negativa entra.
NEGATIVA = {"Retorno declarado": "Diz que não volta", "Avaliação genérica": "Crítica genérica"}


RE_CODIGO = re.compile(r"^(?P<cat>[A-Z]+(?::[a-z]+)?)(?P<pol>[+\-±~]?)$")


def ler():
    """Refaz, a partir da codificação, o percentual simples e o ponderado por
    estabelecimento (média entre as casas do % de cada casa, leitura principal
    do B2 por causa da concentração de Bodogami e Shelf) e confere os dois
    contra as tabelas publicadas pelo B2-a_conteudo_bardin.py."""
    cod = pd.read_csv(AC / "B2_codificacao_bardin.csv", sep=";", dtype=str).fillna("")
    cod = cod[cod.situacao == "analisada"].copy()
    n, casas = len(cod), cod.sigla.nunique()
    cod["pares"] = cod.codigos.map(lambda t: [(m["cat"], m["pol"]) for m in map(RE_CODIGO.match, t.split())])

    def mede(codigo, pol=""):
        tem = cod.pares.map(lambda ps: any(c == codigo and (pol == "" or p == pol) for c, p in ps))
        return int(tem.sum()), 100 * tem.mean(), 100 * tem.groupby(cod.sigla).mean().mean()

    freq = pd.read_csv(AC / "B2_bardin_frequencia_categorias.csv", sep=";")
    freq = freq[freq.polaridade.isin(["qualquer", "negativa"])].copy()
    ctx = pd.read_csv(AC / "B2_bardin_contexto.csv", sep=";")
    for t, pol in ((freq, None), (ctx, "")):
        med = [mede(r.código, "" if pol == "" or r.polaridade == "qualquer" else "-") for r in t.itertuples()]
        t["avaliacoes"] = [m[0] for m in med]
        t["pct_simples"] = [round(m[1], 2) for m in med]
        t["pct"] = [round(m[2], 2) for m in med]  # ponderado por estabelecimento
        assert (t.avaliacoes == t["total: comentários"]).all(), "contagem difere da tabela de Bardin"
        assert (t.pct_simples - t["total: % dos comentários"]).abs().max() <= 0.051
        if "total: % ponderado por estabelecimento" in t:
            assert (t.pct - t["total: % ponderado por estabelecimento"]).abs().max() <= 0.051
    print(f"  {n} avaliações analisadas de {casas} casas; contagens e percentuais conferem com o script de Bardin")
    return n, casas, freq, ctx


def linhas_icones(tab, titulo, por_icone, total_icones, cor, nome, n, casas, nota, icone="pessoa"):
    tab = tab.sort_values("pct", ascending=True).reset_index(drop=True)
    alt = 0.55 * len(tab) + 1.3
    fig, ax = plt.subplots(figsize=(5 + 0.3 * total_icones, alt))
    passo = 1.1
    for i, r in tab.iterrows():
        y = i * 1.45
        fileira(ax, y, r.pct / por_icone, total_icones, cor, icone=icone, passo=passo)
        ax.text(-0.4, y + 0.5, r.categoria, ha="right", va="center", fontsize=10)
        ax.text(total_icones * passo + 0.3, y + 0.5, f"{r.pct:.1f}%".replace(".", ",") + f"  ({r.avaliacoes} avaliações)",
                ha="left", va="center", fontsize=9.5, color="#333333")
    ax.set_xlim(-0.2, total_icones * passo + 0.2)
    ax.set_ylim(-0.4, len(tab) * 1.45)
    ax.set_aspect("equal")
    ax.set_axis_off()
    fig.suptitle(titulo, fontsize=12, fontweight="bold", x=0.02, ha="left")
    leg_y = -1.6
    ICONES[icone](ax, 0, leg_y, cor, s=0.8)
    ax.text(1.0, leg_y + 0.4, f"= {str(por_icone).replace('.', ',')} em cada 100 avaliações com texto da casa típica "
                              "(média das casas); cinza: as demais", va="center", fontsize=9)
    ax.set_ylim(leg_y - 0.3, len(tab) * 1.45)
    fonte_rodape(fig, FONTE + f" n = {milhar(n)} avaliações de {casas} casas. {nota}", y=0.0)
    salvar(fig, PASTA, nome, tab.iloc[::-1][["categoria", "avaliacoes", "pct_simples", "pct"]].rename(
        columns={"pct": "pct_ponderado_estabelecimento"}).assign(n_avaliacoes=n))


def grade_100(tab, titulo, cor, nome, n, casas, nota):
    k = len(tab)
    cols = 4
    lin = (k + cols - 1) // cols
    fig, axs = plt.subplots(lin, cols, figsize=(12, 3.6 * lin))
    for ax in axs.flat:
        ax.set_axis_off()
    for ax, (_, r) in zip(axs.flat, tab.iterrows()):
        cheios = round(r.pct)  # grade de 100: 1 ícone = 1 em 100, arredondado
        for j in range(100):
            x, y = j % 10, 9 - j // 10
            ICONES["pessoa"](ax, x * 1.05, y * 1.05, cor if j < cheios else APAGADO, s=0.95)
        ax.set_xlim(-0.1, 10.6)
        ax.set_ylim(-0.1, 10.6)
        ax.set_aspect("equal")
        ax.set_title(f"{r.categoria}\n{r.pct:.1f}% ({r.avaliacoes})".replace(".", ","), fontsize=10)
    fig.suptitle(titulo, fontsize=12, fontweight="bold", x=0.02, ha="left")
    fonte_rodape(fig, FONTE + f" n = {milhar(n)} avaliações de {casas} casas. {nota}", y=0.02)
    salvar(fig, PASTA, nome, tab[["categoria", "avaliacoes", "pct_simples", "pct"]].rename(
        columns={"pct": "pct_ponderado_estabelecimento"}).assign(n_avaliacoes=n))


def main():
    n, casas, freq, ctx = ler()
    q = freq[freq.polaridade == "qualquer"].copy()
    top = q.sort_values("pct", ascending=False).iloc[0]
    linhas_icones(q, f"De cada 20 avaliações com texto, {top.pct / 5:.0f} falam de "
                     f"{top.categoria.split(' e ')[0].lower()}", 5, 20, CORES["principal"], "B2_pict_temas", n,
                  casas, "Uma avaliação pode tratar de vários temas: as linhas não somam 100%.")
    neg = freq[freq.polaridade == "negativa"].copy()
    neg = neg[neg.avaliacoes >= 5]
    neg["categoria"] = neg.categoria.replace(NEGATIVA)
    pior = neg.sort_values("pct", ascending=False).iloc[0]
    linhas_icones(neg, f"Reclamações: de cada 100 avaliações com texto, {pior.pct:.0f} reclamam de "
                       f"{pior.categoria.split(' e ')[0].lower()}", 1, 6, CORES["secundaria"],
                  "B2_pict_reclamacoes", n, casas,
                  "Só a polaridade negativa; categorias com menos de 5 reclamações ficam de fora.")
    ctx = ctx[~ctx.código.isin(["DESC", "GEEK"])].sort_values("pct", ascending=False)
    grade_100(ctx, "Com quem e por que o público vai: de cada 100 avaliações com texto (média das casas)", CORES["terciaria"],
              "B2_pict_ocasiao_perfil", n, casas,
              "Ocasião e perfil só contam quando a avaliação os declara; o resto não é \"não\", é \"não dito\".")


if __name__ == "__main__":
    main()
