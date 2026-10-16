"""
Padrão visual comum dos gráficos, pictogramas e cartogramas do TCC (skill
graficos-tcc): fonte, 300 dpi, fundo branco, sem bordas superior e direita,
legenda fora da área de plotagem, paleta legível em preto e branco.

Também desenha os ícones dos pictogramas (pessoa, balão de comentário,
coração) só com formas do matplotlib, sem fonte de ícones externa, para o
script rodar igual no Mac e na nuvem.
"""

from __future__ import annotations

from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt  # noqa: E402
from matplotlib.patches import Circle, FancyBboxPatch, Polygon, Rectangle  # noqa: E402

plt.rcParams.update({
    "font.family": "DejaVu Sans",
    "font.size": 11,
    "axes.titlesize": 12,
    "axes.titleweight": "bold",
    "axes.labelsize": 11,
    "xtick.labelsize": 10,
    "ytick.labelsize": 10,
    "legend.fontsize": 10,
    "figure.dpi": 300,
    "savefig.dpi": 300,
    "figure.facecolor": "white",
    "axes.facecolor": "white",
    "axes.grid": True,
    "grid.color": "#dddddd",
    "grid.linewidth": 0.6,
    "axes.spines.top": False,
    "axes.spines.right": False,
})

CORES = {
    "principal": "#2c6e9e",
    "secundaria": "#e07b2a",
    "terciaria": "#5a9e5a",
    "destaque": "#c0392b",  # só Salvador ou elemento focal
    "neutro": "#7f7f7f",
}
APAGADO = "#d9d9d9"

# Regiões do Brasil (IBGE), na ordem norte -> sul. Cores distintas também em tons de cinza.
ORDEM_REGIAO = ["Norte", "Nordeste", "Centro-Oeste", "Sudeste", "Sul"]
COR_REGIAO = {
    "Norte": "#5a9e5a",
    "Nordeste": "#e07b2a",
    "Centro-Oeste": "#8e6bb0",
    "Sudeste": "#2c6e9e",
    "Sul": "#7f7f7f",
}
REGIAO = {
    "Belém": "Norte", "Manaus": "Norte",
    "Fortaleza": "Nordeste", "Recife": "Nordeste", "Salvador": "Nordeste",
    "Brasília": "Centro-Oeste", "Goiânia": "Centro-Oeste",
    "Belo Horizonte": "Sudeste", "Rio de Janeiro": "Sudeste", "São Paulo": "Sudeste", "Vitória": "Sudeste",
    "Curitiba": "Sul", "Florianópolis": "Sul", "Porto Alegre": "Sul",
}


plt.rcParams["svg.fonttype"] = "none"  # texto do SVG fica como texto, editável


def salvar(fig, pasta: Path, nome: str, valores=None):
    """Grava a figura em três formas, cada uma na sua subpasta de `pasta`:
    png/<nome>.png (300 dpi, para o .docx), svg/<nome>.svg (vetor com texto
    editável no PowerPoint, Inkscape ou Illustrator) e valores/<nome>.csv
    (os números desenhados, para conferir ou refazer à mão). Para atualizar
    depois de corrigir uma coleta, basta rodar o script de novo."""
    for sub in ("png", "svg"):
        (pasta / sub).mkdir(parents=True, exist_ok=True)
        fig.savefig(pasta / sub / f"{nome}.{sub}", dpi=300, bbox_inches="tight", facecolor="white")
    plt.close(fig)
    if valores is not None:
        (pasta / "valores").mkdir(parents=True, exist_ok=True)
        valores.to_csv(pasta / "valores" / f"{nome}.csv", sep=";", index=False, encoding="utf-8-sig")
    print(f"  gravado: {nome} (png, svg{', csv' if valores is not None else ''})")


def legenda_fora(ax, **kw):
    """Legenda à direita, fora da área de plotagem."""
    return ax.legend(loc="upper left", bbox_to_anchor=(1.01, 1), borderaxespad=0, frameon=True,
                     framealpha=0.9, **kw)


def fonte_rodape(fig, texto, y=-0.02):
    """Linha de fonte embaixo da figura (o título e a fonte ABNT ficam no .docx; esta é a nota de origem)."""
    fig.text(0.0, y, texto, ha="left", va="top", fontsize=8, color="#555555", wrap=True)


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


def fileira(ax, y, cheios, total, cor, icone="pessoa", parcial=True, passo=1.1):
    """Desenha `total` ícones numa linha; os `cheios` primeiros em cor, o resto apagado.
    Com parcial=True, a fração do último ícone é desenhada recortada (ex.: 5,6 ícones)."""
    f = ICONES[icone]
    inteiros = int(cheios)
    resto = cheios - inteiros
    for i in range(total):
        x = i * passo
        f(ax, x, y, APAGADO)
        if i < inteiros:
            f(ax, x, y, cor)
        elif i == inteiros and parcial and resto > 0.05:
            n0 = len(ax.patches)
            f(ax, x, y, cor)
            clip = Rectangle((x, y - 0.1), resto, 1.2, transform=ax.transData, visible=False)
            ax.add_patch(clip)
            for p in ax.patches[n0:-1]:
                p.set_clip_path(clip)
    return total * passo
