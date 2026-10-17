"""
Bloco B1 - cartogramas (mapas temáticos) das luderias do estudo, agrupadas
pela metrópole do endereço (círculo na capital) e pela região do Brasil
(UFs pintadas pelo valor da região).

Entrada: outros/dados_graficos.py (mesma base dos gráficos do B1, nota e volume
do CSV da curadoria) e outros/malha_uf_ibge.geojson (malha das UFs do IBGE,
simplificada; cópia de github.com/fititnt/gis-dataset-brasil, uf/geojson).

Regras:
- cada place_id conta uma vez, na metrópole do endereço e na região da UF da
  capital; a soma das casas por metrópole e por região é conferida contra o
  total (diferença zero);
- nos mapas por metrópole, a área do círculo é proporcional ao número de casas
  e a cor dá o valor da variável; Manaus, metrópole da REGIC sem casa no
  recorte, aparece como círculo vazio;
- medianas por grupo usam só as casas com o dado; o n de cada grupo vai na
  tabela de valores.

Saídas (dados/[B1] Estabelecimentos e cardapios/estabelecimentos/5_graficos/cartogramas/):
  png/, svg/ (texto editável) e valores/ (B1_mapa_*). Para atualizar depois de
  corrigir uma coleta, rodar o script de novo.

Uso:
    python3 "_src/[B1] Estabelecimentos e cardapios/Google Places (Negócios)/analise/B1-a_cartogramas.py"
"""
# Caminhos: _src/extras/ (log e padrão visual) e outros/ do objeto; log em ../logs/
import sys
from pathlib import Path
_AQUI = Path(__file__).resolve()
sys.path[:0] = [str(_AQUI.parents[3] / "extras"), str(_AQUI.parents[1] / "outros")]
from log_execucao import registrar_execucao  # noqa: E402
if __name__ == "__main__":
    registrar_execucao(__file__)

import geopandas as gpd  # noqa: E402
import matplotlib.pyplot as plt  # noqa: E402
import numpy as np  # noqa: E402
import pandas as pd  # noqa: E402
from matplotlib.colors import Normalize, to_hex  # noqa: E402

from dados_graficos import casas  # noqa: E402
from graficos_comum import (BASE, HALO, ORDEM_REGIAO, SEQUENCIAL, TINTA, TINTA2, TINTA3, VERMELHO, br,  # noqa: E402
                            figura, salvar)

ROOT = _AQUI.parents[4]
PASTA = ROOT / "dados" / "[B1] Estabelecimentos e cardapios" / "estabelecimentos" / "5_graficos" / "cartogramas"
MALHA = _AQUI.parents[1] / "outros" / "malha_uf_ibge.geojson"
FONTE = ("Fonte: elaboração própria com dados do Google Maps, do Instagram e dos cardápios das casas (set. e out. "
         "2026), recorte B1; malha das UFs: IBGE.")

# Capitais das 14 metrópoles da REGIC (IBGE, 2018): latitude, longitude.
CAPITAIS = {
    "Belém": (-1.456, -48.490), "Manaus": (-3.119, -60.022), "Fortaleza": (-3.732, -38.527),
    "Recife": (-8.048, -34.877), "Salvador": (-12.978, -38.502), "Brasília": (-15.794, -47.883),
    "Goiânia": (-16.687, -49.265), "Belo Horizonte": (-19.917, -43.935), "Rio de Janeiro": (-22.907, -43.173),
    "São Paulo": (-23.551, -46.633), "Vitória": (-20.316, -40.313), "Curitiba": (-25.428, -49.273),
    "Florianópolis": (-27.595, -48.548), "Porto Alegre": (-30.035, -51.218),
}
# Rótulo de cada capital: deslocamento (graus de lon, lat) e alinhamento, para não encavalar no Sudeste e no Sul.
ROTULO = {
    "São Paulo": (-1.6, 0.9, "right"), "Rio de Janeiro": (1.1, -1.3, "left"), "Belo Horizonte": (1.3, 0.6, "left"),
    "Vitória": (0.9, -0.3, "left"), "Curitiba": (-1.4, 0.0, "right"), "Florianópolis": (1.0, -0.3, "left"),
    "Porto Alegre": (-1.0, -0.6, "right"), "Brasília": (1.5, 0.6, "left"), "Goiânia": (-1.0, -0.4, "right"),
    "Salvador": (0.9, 0.0, "left"), "Recife": (0.7, -0.7, "left"), "Fortaleza": (0.8, 0.5, "left"),
    "Belém": (0.8, 0.5, "left"), "Manaus": (0.9, 0.4, "left"),
}
# Nome da região no mapa (lon, lat) e posição do rótulo de valor nos painéis.
NOME_REGIAO = {"Norte": (-62, -6.5), "Nordeste": (-41.5, -9.0), "Centro-Oeste": (-54, -12.5),
               "Sudeste": (-42.3, -16.8), "Sul": (-54.5, -29.5)}
POS_REGIAO = {"Norte": (-61, -4), "Nordeste": (-40.5, -7.5), "Centro-Oeste": (-53, -14),
              "Sudeste": (-45.5, -20.5), "Sul": (-52, -28)}

# variável -> (coluna, agregação, nome curto, formatador)
VARS = {
    "nota": ("nota_media", "mean", "Nota média no Google", lambda v: br(v, 2)),
    "avaliacoes": ("volume_avaliacoes", "median", "Avaliações por casa (mediana)", lambda v: br(v)),
    "seguidores": ("seguidores", "median", "Seguidores no Instagram por casa (mediana)", lambda v: f"{br(v, 1)} mil"),
    "horas": ("horas_semana", "median", "Horas abertas por semana (mediana)", lambda v: f"{br(v)} h"),
    "comentarios_post": ("comentarios_por_post", "median", "Comentários por post no Instagram (mediana)",
                         lambda v: br(v, 1)),
    "cesta": ("cesta_mediana", "median", "Cesta por pessoa (mediana)", lambda v: f"R$ {br(v)}"),
}
AREA = 70  # área do círculo (pontos²) por casa


def base():
    d = casas()
    d["seguidores"] = d.seguidores / 1000
    d["comentarios_por_post"] = (d.comentarios_periodo / d.n_posts_periodo).where(d.n_posts_periodo > 0)
    return d


def agrega(d, por):
    linhas = []
    for g, s in d.groupby(por):
        r = {por: g, "casas": len(s)}
        for k, (col, ag, *_r) in VARS.items():
            v = s[col].dropna()
            r[f"{k}_n"] = len(v)
            r[k] = round(float(getattr(v, ag)()), 3) if len(v) else np.nan
        linhas.append(r)
    t = pd.DataFrame(linhas)
    assert int(t.casas.sum()) == len(d), f"{por}: soma {t.casas.sum()} != {len(d)}"
    print(f"  casas por {por}: soma das linhas = {int(t.casas.sum())} = total (diferença 0)")
    return t


def mapa(fig, ax, uf, nomes_regiao=True):
    uf.plot(ax=ax, color="#f0f0f0", edgecolor="white", linewidth=0.9)
    uf.dissolve(by="regiao").boundary.plot(ax=ax, color="#c8c8c8", linewidth=0.9)
    if nomes_regiao:
        for r, (x, y) in NOME_REGIAO.items():
            ax.text(x, y, r.upper(), fontsize=8.5, color="#a8a8a8", ha="center", fontweight="bold", zorder=2)
    ax.set_xlim(-74.5, -32)
    ax.set_ylim(-34.2, 5.8)
    ax.set_aspect("equal")
    ax.set_axis_off()


def legenda_tamanho(ax, ns=(1, 5, 20)):
    ax.text(-71.5, -24.4, "Casas", fontsize=9.5, color=TINTA2, fontweight="semibold")
    for i, k in enumerate(ns):
        y = -26.6 - i * 2.4 - (0.7 if k >= 20 else 0)
        ax.scatter(-70, y, s=AREA * k, facecolor="none", edgecolor=TINTA3, lw=0.8)
        ax.text(-67.4, y, f"{k}", va="center", fontsize=9, color=TINTA2)


def rotulo(ax, m, lat, lon, linha2, cor=None):
    dx, dy, ha = ROTULO[m]
    sal = m == "Salvador"
    ax.text(lon + dx, lat + dy, m, fontsize=10, ha=ha, va="bottom", color=VERMELHO if sal else TINTA,
            fontweight="semibold", path_effects=HALO, zorder=6)
    ax.text(lon + dx, lat + dy - 0.15, linha2, fontsize=9, ha=ha, va="top", color=VERMELHO if sal else TINTA2,
            path_effects=HALO, zorder=6)


def mapa_casas(d, t, uf):
    n = t.set_index("metropole").casas
    reg = d.groupby("regiao").size()
    ne = int(reg.get("Nordeste", 0))
    lider = reg.idxmax()
    fig, ax = figura(8, 8.6, f"As luderias do estudo se concentram no {lider}; o Nordeste tem {ne}",
                     "Casas com mais de 100 avaliações no Google, por metrópole da REGIC; área do círculo "
                     "proporcional ao número de casas.", FONTE, esq=0.05, dir=0.05, base=0.3)
    mapa(fig, ax, uf)
    for m, (lat, lon) in CAPITAIS.items():
        k = int(n.get(m, 0))
        if k:
            ax.scatter(lon, lat, s=AREA * k, color=VERMELHO if m == "Salvador" else BASE, alpha=0.88,
                       edgecolor="white", linewidth=1.2, zorder=3)
        else:
            ax.scatter(lon, lat, s=AREA, facecolor="white", edgecolor=TINTA3, linewidth=1, zorder=3)
        rotulo(ax, m, lat, lon, f"{k} casa{'s' if k != 1 else ''}")
    legenda_tamanho(ax)
    salvar(fig, PASTA, "B1_mapa_casas_metro", t[["metropole", "casas"]].sort_values("casas", ascending=False))


def mapa_variavel(t, uf, chave):
    col, ag, nome, fmt = VARS[chave]
    tt = t.set_index("metropole")
    vals = tt[chave].dropna()
    norm = Normalize(vmin=vals.min(), vmax=vals.max())
    hi, lo = vals.idxmax(), vals.idxmin()
    sal = tt[chave].get("Salvador", np.nan)
    titulo = f"{nome.split(' (')[0]}: maior em {hi} ({fmt(vals[hi])}), menor em {lo} ({fmt(vals[lo])})"
    sub = (f"{nome}, por metrópole; cor mais escura, valor maior; área do círculo proporcional ao número de casas. "
           + (f"Salvador: {fmt(sal)}." if not pd.isna(sal) else "Salvador ainda sem o dado."))
    fig, ax = figura(8, 8.9, titulo, sub, FONTE, esq=0.05, dir=0.05, base=0.3)
    mapa(fig, ax, uf, nomes_regiao=False)
    for m, (lat, lon) in CAPITAIS.items():
        k = int(tt.casas.get(m, 0))
        v = tt[chave].get(m, np.nan)
        if k and not pd.isna(v):
            ax.scatter(lon, lat, s=AREA * k, color=SEQUENCIAL(0.1 + 0.9 * norm(v)),
                       edgecolor=VERMELHO if m == "Salvador" else "white", linewidth=2 if m == "Salvador" else 1.2,
                       zorder=3)
            txt = fmt(v)
        else:
            ax.scatter(lon, lat, s=AREA * max(k, 1), facecolor="white", edgecolor=TINTA3, linewidth=1, zorder=3)
            txt = "sem dado" if k else "sem casa"
        rotulo(ax, m, lat, lon, txt)
    legenda_tamanho(ax)
    # escala de cor, embaixo à direita, sobre o oceano (abaixo de Florianópolis)
    cax = fig.add_axes([0.66, 0.105, 0.27, 0.014])
    sm = plt.cm.ScalarMappable(norm=norm, cmap=plt.matplotlib.colors.LinearSegmentedColormap.from_list(
        "c", [SEQUENCIAL(0.1 + 0.9 * i / 9) for i in range(10)]))
    cb = fig.colorbar(sm, cax=cax, orientation="horizontal")
    cb.outline.set_visible(False)
    cb.set_ticks([vals.min(), vals.max()], labels=[fmt(vals.min()), fmt(vals.max())])
    cb.ax.tick_params(labelsize=8.5, colors=TINTA2, length=0)
    cax.set_title(nome, fontsize=9, color=TINTA2, loc="left")
    salvar(fig, PASTA, f"B1_mapa_{chave}_metro",
           t[["metropole", "casas", f"{chave}_n", chave]].rename(columns={f"{chave}_n": "casas_com_dado"}))


def painel_regiao(t, uf):
    tt = t.set_index("regiao")
    paineis = [("casas", "Casas no estudo", lambda v: br(v))] + [
        (k, VARS[k][2].replace(" por casa", "").replace(" no Instagram", ""), VARS[k][3])
        for k in ("nota", "avaliacoes", "seguidores", "horas", "cesta")]
    fig, _ = figura(12, 9.4, "O Sul e o Sudeste têm mais casas; o Nordeste, mais seguidores por casa"
                    if tt.seguidores.idxmax() == "Nordeste" else "Luderias do estudo por região do Brasil",
                    "Seis indicadores por região (UF pela capital da metrópole do endereço); cor mais escura, valor "
                    "maior; n = casas com o dado.", FONTE, esq=0.1, dir=0.1, base=0.3)
    fig.axes[0].remove()
    for i, (k, rot, fmt) in enumerate(paineis):
        ax = fig.add_axes([0.01 + (i % 3) * 0.33, 0.5 - (i // 3) * 0.44, 0.32, 0.37])
        vals = tt[k]
        norm = Normalize(vmin=vals.min(), vmax=vals.max())
        cor = {r: (to_hex(SEQUENCIAL(0.08 + 0.75 * norm(v))) if not pd.isna(v) else "#f7f7f7")
               for r, v in vals.items()}
        uf.plot(ax=ax, color=[cor[r] for r in uf.regiao], edgecolor="white", linewidth=0.3)
        uf.dissolve(by="regiao").boundary.plot(ax=ax, color="white", linewidth=1.2)
        for r in ORDEM_REGIAO:
            x, y = POS_REGIAO[r]
            v = vals.get(r)
            nn = int(tt[f"{k}_n"].get(r, 0)) if f"{k}_n" in tt else int(tt.casas.get(r, 0))
            ax.text(x, y + 0.9, "sem dado" if pd.isna(v) else fmt(v), ha="center", va="bottom", fontsize=10,
                    fontweight="semibold", color=TINTA, path_effects=HALO)
            ax.text(x, y + 0.6, f"{r}" + ("" if k == "casas" else f" · n = {nn}"), ha="center", va="top",
                    fontsize=7.8, color=TINTA2, path_effects=HALO)
        ax.set_xlim(-74.5, -33)
        ax.set_ylim(-34.2, 5.8)
        ax.set_aspect("equal")
        ax.set_axis_off()
        ax.set_title(rot, fontsize=11, fontweight="semibold", color=TINTA, loc="left")
    cols = ["regiao", "casas"] + [c for k in ("nota", "avaliacoes", "seguidores", "horas", "cesta")
                                   for c in (f"{k}_n", k)]
    salvar(fig, PASTA, "B1_mapa_painel_regiao", t[cols].assign(
        ordem=t.regiao.map(ORDEM_REGIAO.index)).sort_values("ordem").drop(columns="ordem"))


def main():
    d = base()
    uf = gpd.read_file(MALHA)
    tm = agrega(d, "metropole")
    tr = agrega(d, "regiao")
    mapa_casas(d, tm, uf)
    for k in VARS:
        mapa_variavel(tm, uf, k)
    painel_regiao(tr, uf)


if __name__ == "__main__":
    main()
