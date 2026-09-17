"""
Bloco A - gráfico da distribuição de frequências de todos os candidatos da
planilha de curadoria (ativos ou não) por volume de avaliações no Google Maps.
Lê a linha TOTAL_UNICOS das colunas `min_x` de bloco_b_limiares_avaliacoes.csv
(gerada por analise_bloco_b_limiares.py); as colunas `min_x_ativos` ficam de
fora.

As colunas `min_x` são acumuladas (volume >= x). O painel da esquerda
desacumula em faixas (frequência simples); o da direita mostra o acumulado,
que é o número de estabelecimentos que sobra em cada limiar de corte.

Saídas em _data/processed/[A] Estabelecimentos e cardapios/:
  bloco_b_grafico_limiares.png            -> contagens
  bloco_b_grafico_limiares_percentual.png -> % do total de candidatos

Uso:
    python3 "_src/[A] Google Places (estabelecimentos)/analise_bloco_b_grafico_limiares.py"
"""
import csv
import pathlib

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt

ROOT = pathlib.Path(__file__).resolve().parents[2]
PROCESSED = ROOT / "_data" / "processed" / "[A] Estabelecimentos e cardapios"
LIMIARES_PATH = PROCESSED / "bloco_b_limiares_avaliacoes.csv"
OUT_PATH = PROCESSED / "bloco_b_grafico_limiares.png"
OUT_PERCENTUAL_PATH = PROCESSED / "bloco_b_grafico_limiares_percentual.png"

COR_BARRA = "#2a78d6"
COR_TEXTO = "#0b0b0b"
COR_TEXTO_SECUNDARIO = "#52514e"
COR_GRADE = "#e4e3df"
COR_FUNDO = "#fcfcfb"


def carrega_total():
    with open(LIMIARES_PATH, newline="", encoding="utf-8") as f:
        total = next(r for r in csv.DictReader(f) if r["capital"] == "TOTAL_UNICOS")
    # Limiares na ordem das colunas: min_0, min_10, ... (sem as `_ativos`)
    limiares = sorted(
        int(c.split("_")[1]) for c in total if c.startswith("min_") and not c.endswith("_ativos")
    )
    return limiares, [int(total[f"min_{lim}"]) for lim in limiares]


def faixas(limiares, acumulado):
    """Desacumula: frequência de cada faixa [limiar, próximo limiar)."""
    rotulos, freq = [], []
    for i, lim in enumerate(limiares):
        if i + 1 < len(limiares):
            rotulos.append(f"{lim}–{limiares[i + 1] - 1}")
            freq.append(acumulado[i] - acumulado[i + 1])
        else:
            rotulos.append(f"{lim} ou mais")
            freq.append(acumulado[i])
    return rotulos, freq


def formata_pct(v):
    return f"{v:.1f}%".replace(".", ",")


def estiliza(ax, titulo, rotulo_x, percentual=False):
    ax.set_facecolor(COR_FUNDO)
    ax.set_title(titulo, loc="left", fontsize=11, color=COR_TEXTO, pad=10)
    ax.set_xlabel(rotulo_x, fontsize=9, color=COR_TEXTO_SECUNDARIO)
    rotulo_y = "% dos estabelecimentos" if percentual else "Estabelecimentos"
    ax.set_ylabel(rotulo_y, fontsize=9, color=COR_TEXTO_SECUNDARIO)
    if percentual:
        ax.yaxis.set_major_formatter(lambda v, _: f"{v:.0f}%")
    ax.grid(axis="y", color=COR_GRADE, linewidth=0.8)
    ax.set_axisbelow(True)
    for lado in ("top", "right", "left"):
        ax.spines[lado].set_visible(False)
    ax.spines["bottom"].set_color(COR_TEXTO_SECUNDARIO)
    ax.tick_params(colors=COR_TEXTO_SECUNDARIO, labelsize=9, length=0)


def barras(ax, rotulos, valores, percentual=False):
    pos = range(len(valores))
    ax.bar(pos, valores, width=0.7, color=COR_BARRA, edgecolor=COR_FUNDO, linewidth=2)
    ax.set_xticks(list(pos), rotulos)
    for x, v in zip(pos, valores):
        ax.text(x, v, formata_pct(v) if percentual else f"{v}", ha="center", va="bottom", fontsize=9, color=COR_TEXTO)
    ax.set_ylim(0, max(valores) * 1.12)


def grafico(limiares, freq, acumulado, rotulos, out_path, percentual):
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(11, 4.2), facecolor=COR_FUNDO)
    barras(ax1, rotulos, freq, percentual)
    estiliza(ax1, "Frequência por faixa", "Avaliações no Google Maps", percentual)
    barras(ax2, [f"≥ {lim}" for lim in limiares], acumulado, percentual)
    estiliza(
        ax2,
        "Frequência acumulada (restantes em cada limiar)",
        "Limiar mínimo de avaliações",
        percentual,
    )
    fig.tight_layout()
    fig.savefig(out_path, dpi=200, facecolor=COR_FUNDO)
    plt.close(fig)
    print(f"OK: {out_path.name}")


def main():
    limiares, acumulado = carrega_total()
    rotulos, freq = faixas(limiares, acumulado)
    grafico(limiares, freq, acumulado, rotulos, OUT_PATH, percentual=False)

    # Base do percentual: todos os candidatos (limiar 0), para as duas visões.
    base = acumulado[0]
    grafico(
        limiares,
        [100 * v / base for v in freq],
        [100 * v / base for v in acumulado],
        rotulos,
        OUT_PERCENTUAL_PATH,
        percentual=True,
    )


if __name__ == "__main__":
    main()
