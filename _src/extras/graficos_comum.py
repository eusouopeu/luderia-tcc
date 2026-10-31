"""
Padrão visual das figuras do TCC (gráficos, cartogramas e pictogramas), no
estilo editorial de jornais de dados (FT, Economist): título que diz a
conclusão, subtítulo com o recorte, valor escrito direto na marca (sem
legenda quando dá), eixos e grade quase invisíveis, cinza para tudo e
vermelho só para Salvador ou para o que é crítica. Fonte Source Sans 3
(licença OFL, em `_src/extras/fontes/`), para o script dar o mesmo resultado
no Mac e na nuvem.

Saída em PNG de 300 dpi (para o .docx), SVG com texto editável e CSV dos
valores desenhados (`salvar`). Os ícones dos pictogramas (pessoa, balão,
coração) são desenhados com formas do matplotlib, sem fonte de ícones.
"""

from __future__ import annotations

import textwrap
from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.font_manager as fm  # noqa: E402
import matplotlib.patheffects as pe  # noqa: E402
import matplotlib.pyplot as plt  # noqa: E402
from matplotlib.colors import LinearSegmentedColormap  # noqa: E402
from matplotlib.patches import Circle, FancyBboxPatch, Polygon, Rectangle  # noqa: E402

_FONTES = Path(__file__).resolve().parent / "fontes"
for _f in sorted(_FONTES.glob("*.ttf")):
    fm.fontManager.addfont(str(_f))
FONTE = "Source Sans 3"

# Tinta (texto) e marcas. Vermelho do site (destaque-600) só para Salvador ou crítica.
TINTA, TINTA2, TINTA3 = "#1f1f1f", "#525252", "#8a8a8a"
BASE, MEDIO, CLARO, APAGADO = "#4d4d4d", "#8f8f8f", "#c4c4c4", "#e8e8e8"
VERMELHO = "#b91c1c"
GRADE = "#ececec"
HALO = [pe.withStroke(linewidth=3.2, foreground="white")]
# Escala sequencial de uma cor só (cinza claro -> grafite), para mapas e calor.
SEQUENCIAL = LinearSegmentedColormap.from_list("seq_cinza", ["#e3e3e3", "#9a9a9a", "#4d4d4d", "#1f1f1f"])

plt.rcParams.update({
    "font.family": FONTE,
    "font.size": 11,
    "axes.labelsize": 10.5,
    "axes.labelcolor": TINTA2,
    "xtick.labelsize": 10,
    "ytick.labelsize": 10.5,
    "xtick.color": TINTA3,
    "ytick.color": TINTA,
    "xtick.major.size": 0,
    "ytick.major.size": 0,
    "axes.edgecolor": CLARO,
    "axes.spines.top": False,
    "axes.spines.right": False,
    "axes.spines.left": False,
    "axes.spines.bottom": False,
    "axes.grid": False,
    "grid.color": GRADE,
    "grid.linewidth": 0.8,
    "figure.dpi": 300,
    "savefig.dpi": 300,
    "figure.facecolor": "white",
    "axes.facecolor": "white",
    "legend.frameon": False,
    "legend.fontsize": 10,
    "svg.fonttype": "none",  # texto do SVG fica como texto, editável
})

ORDEM_REGIAO = ["Norte", "Nordeste", "Centro-Oeste", "Sudeste", "Sul"]
REGIAO = {
    "Belém": "Norte", "Manaus": "Norte",
    "Fortaleza": "Nordeste", "Recife": "Nordeste", "Salvador": "Nordeste",
    "Brasília": "Centro-Oeste", "Goiânia": "Centro-Oeste",
    "Belo Horizonte": "Sudeste", "Rio de Janeiro": "Sudeste", "São Paulo": "Sudeste", "Vitória": "Sudeste",
    "Curitiba": "Sul", "Florianópolis": "Sul", "Porto Alegre": "Sul",
}


def br(v, casas=0, milhar=True):
    """Número no padrão brasileiro: 1.234,5."""
    txt = f"{v:,.{casas}f}" if milhar else f"{v:.{casas}f}"
    return txt.replace(",", "X").replace(".", ",").replace("X", ".")


def cor_casa(metropole):
    return VERMELHO if metropole == "Salvador" else BASE


def _quebra(txt, largura_in, pt):
    """Quebra o texto em linhas que cabem na largura (estimativa: 0,5 em por caractere)."""
    por_linha = max(20, int(largura_in * 72 / (pt * 0.5)))
    return "\n".join(textwrap.wrap(txt, por_linha))


def _textos(largura, titulo, subtitulo, fonte, nota):
    tit = _quebra(titulo, largura - 0.4, 15.5)
    sub = _quebra(subtitulo, largura - 0.4, 11.5)
    rod = _quebra(fonte if not nota else f"{nota} {fonte}", largura - 0.4, 8.5)
    return tit, sub, rod


def margens(largura, titulo, subtitulo, fonte, base=0.55, nota=None):
    """Altura (polegadas) do cabeçalho e do rodapé que `figura` vai usar, para
    quem precisa dimensionar a figura pelo miolo (ex.: pictogramas)."""
    tit, sub, rod = _textos(largura, titulo, subtitulo, fonte, nota)
    cab = 0.16 + 0.29 * (tit.count("\n") + 1) + 0.08 + 0.22 * (sub.count("\n") + 1) + 0.3
    return cab, base + 0.16 * (rod.count("\n") + 1)


def figura(largura, altura, titulo, subtitulo, fonte, esq=1.6, dir=0.4, base=0.55, nota=None):
    """Figura com cabeçalho (título e subtítulo) e rodapé (fonte) em polegadas
    fixas, e um eixo no miolo. `esq`, `dir` e `base` são margens do eixo em
    polegadas; o topo do eixo fica logo abaixo do subtítulo."""
    fig = plt.figure(figsize=(largura, altura))
    x0 = 0.18 / largura
    tit, sub, rod = _textos(largura, titulo, subtitulo, fonte, nota)
    cab, base_total = margens(largura, titulo, subtitulo, fonte, base, nota)
    y = 1 - 0.16 / altura
    fig.text(x0, y, tit, fontsize=15.5, fontweight="semibold", color=TINTA, va="top", linespacing=1.15)
    y -= (0.29 * (tit.count("\n") + 1) + 0.08) / altura
    fig.text(x0, y, sub, fontsize=11.5, color=TINTA2, va="top", linespacing=1.25)
    fig.text(x0, 0.12 / altura, rod, fontsize=8.5, color=TINTA3, va="bottom", linespacing=1.25)
    ax = fig.add_axes([esq / largura, base_total / altura, 1 - (esq + dir) / largura, 1 - (cab + base_total) / altura])
    return fig, ax


def grade_x(ax, valores):
    for v in valores:
        ax.axvline(v, color=GRADE, lw=0.8, zorder=0)


def grade_y(ax, valores):
    for v in valores:
        ax.axhline(v, color=GRADE, lw=0.8, zorder=0)


def salvar(fig, pasta: Path, nome: str, valores=None):
    """Grava a figura em três formas, cada uma na sua subpasta de `pasta`:
    png/<nome>.png (300 dpi, para o .docx), svg/<nome>.svg (vetor com texto
    editável no PowerPoint, Inkscape ou Illustrator) e valores/<nome>.csv
    (os números desenhados, para conferir, refazer à mão ou importar no
    Datawrapper). Para atualizar depois de corrigir uma coleta, basta rodar o
    script de novo."""
    for sub in ("png", "svg"):
        (pasta / sub).mkdir(parents=True, exist_ok=True)
        fig.savefig(pasta / sub / f"{nome}.{sub}", dpi=300, facecolor="white")
    plt.close(fig)
    if valores is not None:
        (pasta / "valores").mkdir(parents=True, exist_ok=True)
        valores.to_csv(pasta / "valores" / f"{nome}.csv", sep=";", index=False, encoding="utf-8-sig")
    print(f"  gravado: {nome} (png, svg{', csv' if valores is not None else ''})")


# ---------- ícones (caixa de 1 x 1, canto inferior esquerdo em x, y) ----------
def pessoa(ax, x, y, cor, s=1.0):
    ax.add_patch(Circle((x + 0.5 * s, y + 0.78 * s), 0.17 * s, color=cor, lw=0))
    ax.add_patch(FancyBboxPatch((x + 0.24 * s, y + 0.04 * s), 0.52 * s, 0.5 * s,
                                boxstyle=f"round,pad=0,rounding_size={0.16 * s}", color=cor, lw=0))


def balao(ax, x, y, cor, s=1.0):
    ax.add_patch(FancyBboxPatch((x + 0.08 * s, y + 0.3 * s), 0.84 * s, 0.6 * s,
                                boxstyle=f"round,pad=0,rounding_size={0.18 * s}", color=cor, lw=0))
    ax.add_patch(Polygon([(x + 0.25 * s, y + 0.34 * s), (x + 0.48 * s, y + 0.34 * s), (x + 0.2 * s, y + 0.08 * s)],
                         closed=True, color=cor, lw=0))


def coracao(ax, x, y, cor, s=1.0):
    r = 0.22 * s
    ax.add_patch(Circle((x + 0.3 * s, y + 0.62 * s), r, color=cor, lw=0))
    ax.add_patch(Circle((x + 0.7 * s, y + 0.62 * s), r, color=cor, lw=0))
    ax.add_patch(Polygon([(x + 0.1 * s, y + 0.55 * s), (x + 0.9 * s, y + 0.55 * s), (x + 0.5 * s, y + 0.08 * s)],
                         closed=True, color=cor, lw=0))


ICONES = {"pessoa": pessoa, "balao": balao, "coracao": coracao}


def fileira(ax, y, cheios, total, cor, icone="pessoa", parcial=True, passo=1.0, s=0.85):
    """Desenha `total` ícones numa linha; os `cheios` primeiros em cor, o resto apagado.
    Com parcial=True, a fração do último ícone é desenhada recortada (ex.: 5,6 ícones)."""
    f = ICONES[icone]
    inteiros = int(cheios)
    resto = cheios - inteiros
    for i in range(total):
        x = i * passo
        f(ax, x, y, APAGADO, s=s)
        if i < inteiros:
            f(ax, x, y, cor, s=s)
        elif i == inteiros and parcial and resto > 0.05:
            n0 = len(ax.patches)
            f(ax, x, y, cor, s=s)
            clip = Rectangle((x, y - 0.1), s * (0.1 + 0.8 * resto), 1.2, transform=ax.transData, visible=False)
            ax.add_patch(clip)
            for p in ax.patches[n0:-1]:
                p.set_clip_path(clip)
    return total * passo


def pictograma_linhas(linhas, total, icone, titulo, subtitulo, fonte, nota=None, esq=2.5, dir=1.6,
                      lado=0.27, largura_min=8.5):
    """Pictograma em fileiras, uma por linha de `linhas` (de cima para baixo).
    Cada linha é um dict com: rotulo, icones (quantos ícones pintar, pode ser
    fracionário), valor (texto em destaque à direita), extra (texto cinza ao
    lado do valor, opcional), cor (da marca), destaque (rótulo na cor da marca
    e em negrito) e espaco (linha em branco antes dela). `lado` é o tamanho de
    um ícone em polegadas; a figura cresce para caber as fileiras."""
    passo_y = 1.3
    ys, y = [], 0.0
    for ln in linhas:
        if ln.get("espaco"):
            y += 0.55
        ys.append(y)
        y += passo_y
    h_ax = (y - 0.15) * lado
    largura = max(largura_min, esq + total * lado + dir)
    cab, rod = margens(largura, titulo, subtitulo, fonte, nota=nota)
    fig, ax = figura(largura, cab + h_ax + rod, titulo, subtitulo, fonte, esq=esq,
                     dir=largura - esq - total * lado, nota=nota)
    topo = y - passo_y
    for ln, yy in zip(linhas, ys):
        yb = topo - yy
        fileira(ax, yb, min(ln["icones"], total), total, ln["cor"], icone=icone)
        cor_txt = ln["cor"] if ln.get("destaque") else TINTA
        ax.text(-0.35, yb + 0.45, ln["rotulo"], ha="right", va="center", fontsize=11, color=cor_txt,
                fontweight="semibold" if ln.get("destaque") else "normal")
        t = ax.text(total + 0.3, yb + 0.45, ln["valor"], ha="left", va="center", fontsize=12,
                    fontweight="semibold", color=cor_txt)
        if ln.get("extra"):
            ax.annotate(ln["extra"], xycoords=t, xy=(1, 0.5), xytext=(6, 0), textcoords="offset points",
                        ha="left", va="center", fontsize=9.5, color=TINTA3)
    ax.set_xlim(0, total)
    ax.set_ylim(-0.15, topo + 1.0)
    ax.set_axis_off()
    return fig, ax
