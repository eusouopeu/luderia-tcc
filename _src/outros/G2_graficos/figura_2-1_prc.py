"""
Figura 2.1 - Leitura da penalidade e da recompensa na análise PRC.

Diagrama conceitual (sem dados): para um atributo obrigatório e um atrativo,
mostra quanto a satisfação geral cai quando o desempenho fica abaixo do
esperado (penalidade) e quanto sobe quando fica acima (recompensa), conforme
Picolo e Tontini (2008). Saída: textos/graficos/2-1_prc_penalidade_recompensa.png.
"""

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(Path(__file__).resolve().parent))

import graficos_comum as gc  # noqa: E402
import matplotlib.pyplot as plt  # noqa: E402

SAIDA = ROOT / "textos" / "graficos" / "2-1_prc_penalidade_recompensa.png"

# (título do painel, queda abaixo do esperado, alta acima do esperado), escala ilustrativa
PAINEIS = [
    ("Atributo obrigatório", 1.0, 0.25),
    ("Atributo atrativo", 0.25, 1.0),
]


def painel(ax, titulo, queda, alta):
    xs, ys = [-1, 0, 1], [-queda, 0, alta]
    ax.axhline(0, color=gc.CLARO, lw=0.9, zorder=0)
    ax.axvline(0, color=gc.APAGADO, lw=0.9, zorder=0)
    ax.plot(xs, ys, color=gc.BASE, lw=2.4, marker="o", ms=6, zorder=3)
    # penalidade: queda até o ponto da esquerda
    ax.annotate("", xy=(-1, -queda), xytext=(-1, 0),
                arrowprops=dict(arrowstyle="-|>", color=gc.TINTA2, lw=1.3))
    ax.text(-1, -queda - 0.14, f"Penalidade\n{'grande' if queda > alta else 'pequena'}",
            ha="center", va="top", fontsize=10, color=gc.TINTA, linespacing=1.1)
    # recompensa: alta até o ponto da direita
    ax.annotate("", xy=(1, alta), xytext=(1, 0),
                arrowprops=dict(arrowstyle="-|>", color=gc.TINTA2, lw=1.3))
    ax.text(1, alta + 0.14, f"Recompensa\n{'grande' if alta > queda else 'pequena'}",
            ha="center", va="bottom", fontsize=10, color=gc.TINTA, linespacing=1.1)
    ax.set_title(titulo, fontsize=12, color=gc.TINTA, fontweight="semibold", pad=10)
    ax.set_xlim(-1.35, 1.35)
    ax.set_ylim(-1.75, 1.75)
    ax.set_xticks([-1, 0, 1], ["Abaixo do\nesperado", "Esperado", "Acima do\nesperado"])
    ax.set_yticks([])
    ax.set_xlabel("Desempenho do atributo")


def main():
    fig, eixos = plt.subplots(1, 2, figsize=(6.3, 3.8), sharey=True)
    for ax, (titulo, queda, alta) in zip(eixos, PAINEIS):
        painel(ax, titulo, queda, alta)
    eixos[0].set_ylabel("Satisfação geral")
    fig.tight_layout(w_pad=2.5)
    SAIDA.parent.mkdir(parents=True, exist_ok=True)
    fig.savefig(SAIDA, dpi=300, facecolor="white")
    print(f"gravado: {SAIDA.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
