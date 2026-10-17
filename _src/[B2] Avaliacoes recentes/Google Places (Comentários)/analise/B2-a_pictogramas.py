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

Estilo editorial (`graficos_comum`): temas e ocasiões em cinza, reclamações
em vermelho; o título diz a categoria que lidera.

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

import pandas as pd  # noqa: E402

from graficos_comum import (APAGADO, BASE, HALO, TINTA, TINTA2, VERMELHO, br, figura, margens,  # noqa: E402
                            pessoa, pictograma_linhas, salvar)

ROOT = _AQUI.parents[4]
B2 = ROOT / "dados" / "[B2] Avaliacoes recentes"
AC = B2 / "analise_conteudo"
PASTA = B2 / "graficos"
FONTE = ("Fonte: elaboração própria com avaliações com texto do Google Maps até \"3 meses atrás\" "
         "(coleta de 13 a 15/10/2026), codificadas por análise de conteúdo (Bardin) (B2).")


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


def tabela_valores(tab, n):
    return tab[["categoria", "avaliacoes", "pct_simples", "pct"]].rename(
        columns={"pct": "pct_ponderado_estabelecimento"}).assign(n_avaliacoes=n)


def proporcao(pct):
    """Fração por extenso para o título (ex.: 56% -> "mais da metade")."""
    if pct > 50:
        return "mais da metade"
    if 30 <= pct < 36:
        return "cerca de um terço"
    return f"{br(pct, 0)}%"


def linhas_icones(tab, titulo, subtitulo, por_icone, total_icones, cor, nome, n, casas, nota):
    tab = tab.sort_values("pct", ascending=False).reset_index(drop=True)
    linhas = [{"rotulo": r.categoria, "icones": r.pct / por_icone, "valor": f"{br(r.pct, 1)}%",
               "extra": f"{r.avaliacoes} aval.", "cor": cor} for r in tab.itertuples()]
    fig, _ = pictograma_linhas(linhas, total_icones, "pessoa", titulo, subtitulo, FONTE,
                               nota=f"{nota} n = {milhar(n)} avaliações de {casas} casas.", esq=2.9)
    salvar(fig, PASTA, nome, tabela_valores(tab, n))


def grade_100(tab, titulo, subtitulo, nome, n, casas, nota):
    """Uma grade de 10 x 10 por categoria (1 pessoa = 1 em cada 100 avaliações)."""
    k, cols = len(tab), 4
    lin = (k + cols - 1) // cols
    lado, gap, rot, entre = 2.0, 0.45, 0.7, 0.3  # polegadas: grade, espaço lateral, rótulo acima, entre fileiras
    largura = 0.25 + cols * lado + (cols - 1) * gap + 0.25
    cab, rod = margens(largura, titulo, subtitulo, FONTE, nota=nota)
    altura = cab + lin * (lado + rot) + (lin - 1) * entre + rod
    fig, ax0 = figura(largura, altura, titulo, subtitulo, FONTE, nota=nota)
    ax0.remove()
    for i, r in enumerate(tab.itertuples()):
        c, li = i % cols, i // cols
        x0 = 0.18 + c * (lado + gap)
        y0 = rod + (lin - 1 - li) * (lado + rot + entre)
        ax = fig.add_axes([x0 / largura, y0 / altura, lado / largura, lado / altura])
        cheios = round(r.pct)  # 1 ícone = 1 em 100, arredondado
        for j in range(100):
            pessoa(ax, j % 10, 9 - j // 10, BASE if j < cheios else APAGADO, s=0.9)
        ax.set_xlim(0, 10)
        ax.set_ylim(0, 10)
        ax.set_axis_off()
        ax.text(0.05, 10.3, f"{br(r.pct, 0)}%", fontsize=16, fontweight="semibold", color=TINTA, va="bottom")
        rotulo = r.categoria.replace("Ocasião: ", "")
        ax.text(0.05, 12.0, rotulo[0].upper() + rotulo[1:], fontsize=10.5, color=TINTA2, va="bottom",
                path_effects=HALO)
    salvar(fig, PASTA, nome, tabela_valores(tab, n))


def main():
    n, casas, freq, ctx = ler()
    q = freq[freq.polaridade == "qualquer"].copy()
    top = q.sort_values("pct", ascending=False).iloc[0]
    linhas_icones(q, f"{top.categoria.split(' e ')[0]} aparece em {proporcao(top.pct)} das avaliações com texto",
                  "Temas citados, em qualquer tom, de cada 20 avaliações da casa típica (média do percentual "
                  f"das {casas} casas).", 5, 20, BASE, "B2_pict_temas", n, casas,
                  "Cada pessoa = 5% das avaliações. Uma avaliação pode tratar de vários temas: as linhas não "
                  "somam 100%.")
    neg = freq[freq.polaridade == "negativa"].copy()
    neg = neg[neg.avaliacoes >= 5]
    neg["categoria"] = neg.categoria.replace(NEGATIVA)
    pior = neg.sort_values("pct", ascending=False).iloc[0]
    linhas_icones(neg, f"A reclamação mais comum é sobre {pior.categoria.split(' e ')[0].lower()}: "
                       f"{br(pior.pct, 0)} de cada 100 avaliações",
                  "Avaliações que citam o tema em tom negativo, de cada 100 da casa típica (média do percentual "
                  f"das {casas} casas).", 1, 10, VERMELHO, "B2_pict_reclamacoes", n, casas,
                  "Cada pessoa = 1% das avaliações. Só a polaridade negativa; categorias com menos de 5 "
                  "reclamações ficam de fora.")
    ctx = ctx[~ctx.código.isin(["DESC", "GEEK"])].sort_values("pct", ascending=False)
    primeira = ctx[ctx.categoria.str.startswith("Ocasião")].iloc[0]
    grade_100(ctx, f"Ir com {primeira.categoria.split(': ')[1]} é a ocasião mais declarada: "
                   f"{br(primeira.pct, 0)} de cada 100 avaliações",
              f"Com quem e por que o público vai, de cada 100 avaliações da casa típica (média do percentual "
              f"das {casas} casas).", "B2_pict_ocasiao_perfil", n, casas,
              "Cada pessoa = 1 avaliação em 100. Ocasião e perfil só contam quando a avaliação os declara; "
              f"o resto não é \"não\", é \"não dito\". n = {milhar(n)} avaliações de {casas} casas.")


if __name__ == "__main__":
    main()
