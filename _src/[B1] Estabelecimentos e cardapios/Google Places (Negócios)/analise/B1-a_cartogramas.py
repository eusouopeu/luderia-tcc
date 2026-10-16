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
from matplotlib.lines import Line2D  # noqa: E402

from dados_graficos import casas  # noqa: E402
from graficos_comum import COR_REGIAO, CORES, ORDEM_REGIAO, REGIAO, fonte_rodape, salvar  # noqa: E402

ROOT = _AQUI.parents[4]
PASTA = ROOT / "dados" / "[B1] Estabelecimentos e cardapios" / "estabelecimentos" / "5_graficos" / "cartogramas"
MALHA = _AQUI.parents[1] / "outros" / "malha_uf_ibge.geojson"
FONTE = ("Fonte: Google Maps, Instagram, horários e cardápios coletados em 09 e 10/2026 (B1, 54 casas); "
         "malha das UFs: IBGE.")

# Capitais das 14 metrópoles da REGIC (IBGE, 2018): latitude, longitude.
CAPITAIS = {
    "Belém": (-1.456, -48.490), "Manaus": (-3.119, -60.022), "Fortaleza": (-3.732, -38.527),
    "Recife": (-8.048, -34.877), "Salvador": (-12.978, -38.502), "Brasília": (-15.794, -47.883),
    "Goiânia": (-16.687, -49.265), "Belo Horizonte": (-19.917, -43.935), "Rio de Janeiro": (-22.907, -43.173),
    "São Paulo": (-23.551, -46.633), "Vitória": (-20.316, -40.313), "Curitiba": (-25.428, -49.273),
    "Florianópolis": (-27.595, -48.548), "Porto Alegre": (-30.035, -51.218),
}
# Deslocamento do rótulo (graus de lon, lat) para não encavalar no Sudeste e no Sul.
ROTULO = {
    "São Paulo": (-1.2, -0.2, "right"), "Rio de Janeiro": (1.0, -1.2, "left"), "Belo Horizonte": (1.0, 0.4, "left"),
    "Vitória": (1.0, 0.0, "left"), "Curitiba": (-1.2, 0.0, "right"), "Florianópolis": (1.0, -0.4, "left"),
    "Porto Alegre": (-1.2, -0.3, "right"), "Brasília": (1.0, 0.5, "left"), "Goiânia": (-1.0, -0.5, "right"),
    "Salvador": (1.0, 0.0, "left"), "Recife": (0.8, -0.6, "left"), "Fortaleza": (0.8, 0.4, "left"),
    "Belém": (0.8, 0.5, "left"), "Manaus": (0.8, 0.5, "left"),
}

# Posição do rótulo de cada região nos painéis (lon, lat).
POS_REGIAO = {"Norte": (-61, -3), "Nordeste": (-40.5, -7), "Centro-Oeste": (-53, -14),
              "Sudeste": (-44, -21), "Sul": (-55, -28.5)}

# variável -> (coluna, agregação, rótulo, formato, mapa de cor)
VARS = {
    "nota": ("nota_media", "mean", "Nota média no Google (média das casas)", "{:.2f}", "Blues"),
    "avaliacoes": ("volume_avaliacoes", "median", "Avaliações no Google por casa (mediana)", "{:,.0f}", "Blues"),
    "seguidores": ("seguidores", "median", "Seguidores no Instagram por casa (mediana, mil)", "{:.1f} mil", "Oranges"),
    "horas": ("horas_semana", "median", "Horas abertas por semana (mediana)", "{:.0f} h", "Greens"),
    "comentarios_post": ("comentarios_por_post", "median", "Comentários por post no Instagram (mediana)",
                         "{:.1f}", "Oranges"),
    "cesta": ("cesta_mediana", "median", "Cesta por pessoa em R$ (mediana)", "R$ {:.0f}", "Purples"),
}


def br(txt):
    """Número no padrão brasileiro: 1.234,5."""
    return txt.replace(",", "X").replace(".", ",").replace("X", ".")


def base():
    d = casas()
    d["seguidores"] = d.seguidores / 1000
    d["comentarios_por_post"] = (d.comentarios_periodo / d.n_posts_periodo).where(d.n_posts_periodo > 0)
    return d


def agrega(d, por):
    linhas = []
    for g, s in d.groupby(por):
        r = {por: g, "casas": len(s)}
        for k, (col, ag, *_rest) in VARS.items():
            v = s[col].dropna()
            r[f"{k}_n"] = len(v)
            r[k] = round(float(getattr(v, ag)()), 3) if len(v) else np.nan
        linhas.append(r)
    t = pd.DataFrame(linhas)
    assert int(t.casas.sum()) == len(d), f"{por}: soma {t.casas.sum()} != {len(d)}"
    print(f"  casas por {por}: soma das linhas = {int(t.casas.sum())} = total (diferença 0)")
    return t


def fundo(ax, uf, por_regiao=True):
    if por_regiao:
        uf.plot(ax=ax, color=[COR_REGIAO[r] for r in uf.regiao], alpha=0.12, edgecolor="white", linewidth=0.6)
    else:
        uf.plot(ax=ax, color="#f2f2f2", edgecolor="white", linewidth=0.6)
    uf.dissolve(by="regiao").boundary.plot(ax=ax, color="#9a9a9a", linewidth=0.8)
    ax.set_xlim(-74.5, -26)
    ax.set_ylim(-34.2, 5.8)
    ax.set_axis_off()
    ax.set_aspect("equal")


def raio(n):
    return 60 * n  # área (pontos²) proporcional ao número de casas


def legenda_tamanho(ax, ns=(1, 5, 10, 20)):
    h = [plt.scatter([], [], s=raio(n), color="#bbbbbb", edgecolor="#555555", label=f"{n}") for n in ns]
    return ax.legend(handles=h, title="Casas", loc="lower left", bbox_to_anchor=(0.0, 0.0), frameon=True,
                     labelspacing=1.6, borderpad=1.0, scatterpoints=1)


def mapa_casas(d, t, uf):
    fig, ax = plt.subplots(figsize=(8.5, 8.5))
    fundo(ax, uf)
    for m, (lat, lon) in CAPITAIS.items():
        n = int(t.set_index("metropole").casas.get(m, 0))
        cor = CORES["destaque"] if m == "Salvador" else COR_REGIAO[REGIAO[m]]
        if n:
            ax.scatter(lon, lat, s=raio(n), color=cor, alpha=0.85, edgecolor="white", linewidth=0.8, zorder=3)
        else:
            ax.scatter(lon, lat, s=raio(1), facecolor="none", edgecolor="#555555", linewidth=1, zorder=3)
        dx, dy, ha = ROTULO[m]
        ax.text(lon + dx, lat + dy, f"{m} ({n})", fontsize=8.5, ha=ha, va="center", zorder=4,
                color=CORES["destaque"] if m == "Salvador" else "#222222")
    leg = legenda_tamanho(ax)
    ax.add_artist(leg)
    hreg = [Line2D([], [], marker="s", ls="", color=COR_REGIAO[r], alpha=0.5, markersize=10, label=r)
            for r in ORDEM_REGIAO]
    ax.legend(handles=hreg, title="Região", loc="upper left", bbox_to_anchor=(1.0, 1.0), frameon=True)
    ax.set_title(f"Casas do estudo por metrópole: {int(t.casas.max())} em São Paulo, nenhuma em Manaus")
    fonte_rodape(fig, FONTE, y=0.06)
    salvar(fig, PASTA, "B1_mapa_casas_metro", t[["metropole", "casas"]].sort_values("casas", ascending=False))


def mapa_variavel(t, uf, chave):
    col, ag, rot, fmt, cmap = VARS[chave]
    tt = t.set_index("metropole")
    vals = tt[chave].dropna()
    norm = Normalize(vmin=vals.min(), vmax=vals.max())
    cm = plt.get_cmap(cmap)
    fig, ax = plt.subplots(figsize=(8.5, 8.5))
    fundo(ax, uf, por_regiao=False)
    for m, (lat, lon) in CAPITAIS.items():
        n = int(tt.casas.get(m, 0))
        v = tt[chave].get(m, np.nan)
        dx, dy, ha = ROTULO[m]
        if n and not pd.isna(v):
            ax.scatter(lon, lat, s=raio(n), color=cm(0.2 + 0.8 * norm(v)), edgecolor="#444444", linewidth=0.6,
                       zorder=3)
            txt = f"{m}: {br(fmt.format(v))}"
        else:
            ax.scatter(lon, lat, s=raio(max(n, 1)), facecolor="none", edgecolor="#777777", linewidth=1, zorder=3)
            txt = f"{m}: sem dado" if n else f"{m}: sem casa"
        ax.text(lon + dx, lat + dy, txt, fontsize=8.5, ha=ha, va="center", zorder=4,
                color=CORES["destaque"] if m == "Salvador" else "#222222",
                fontweight="bold" if m == "Salvador" else "normal")
    sm = plt.cm.ScalarMappable(norm=Normalize(vmin=vals.min(), vmax=vals.max()),
                               cmap=plt.matplotlib.colors.LinearSegmentedColormap.from_list(
                                   "c", [cm(0.2 + 0.8 * i / 9) for i in range(10)]))
    cb = fig.colorbar(sm, ax=ax, shrink=0.5, pad=0.0, orientation="horizontal", aspect=30)
    cb.set_label(rot)
    ax.add_artist(legenda_tamanho(ax))
    sal = tt[chave].get("Salvador", np.nan)
    ax.set_title(f"{rot.split(' (')[0]}, por metrópole" + (f"; Salvador: {br(fmt.format(sal))}" if not pd.isna(sal)
                                                         else ""))
    fonte_rodape(fig, FONTE + " Área do círculo proporcional ao número de casas.", y=0.06)
    salvar(fig, PASTA, f"B1_mapa_{chave}_metro",
           t[["metropole", "casas", f"{chave}_n", chave]].rename(columns={f"{chave}_n": "casas_com_dado"}))


def painel_regiao(t, uf):
    tt = t.set_index("regiao")
    curto = {"nota": "Nota média no Google", "avaliacoes": "Avaliações por casa (mediana)",
             "seguidores": "Seguidores no Instagram (mediana)", "horas": "Horas abertas na semana (mediana)",
             "cesta": "Cesta por pessoa (mediana)"}
    paineis = [("casas", "Casas no estudo", "{:.0f}", "Greys")] + [
        (k, curto[k], VARS[k][3], VARS[k][4]) for k in curto]
    fig, axs = plt.subplots(2, 3, figsize=(13, 9))
    fig.subplots_adjust(wspace=0.02, hspace=0.08, top=0.92)
    for ax, (k, rot, fmt, cmap) in zip(axs.flat, paineis):
        vals = tt[k]
        norm = Normalize(vmin=vals.min(), vmax=vals.max())
        cm = plt.get_cmap(cmap)
        cor = {r: (to_hex(cm(0.15 + 0.7 * norm(v))) if not pd.isna(v) else "#eeeeee") for r, v in vals.items()}
        uf.plot(ax=ax, color=[cor[r] for r in uf.regiao], edgecolor="white", linewidth=0.4)
        reg = uf.dissolve(by="regiao")
        reg.boundary.plot(ax=ax, color="#555555", linewidth=0.7)
        for r in reg.index:
            x, y = POS_REGIAO[r]
            v = vals.get(r)
            n = int(tt.casas.get(r, 0))
            nn = int(tt[f"{k}_n"].get(r, n)) if f"{k}_n" in tt else n
            txt = f"{r}: {br(fmt.format(v)) if not pd.isna(v) else 'sem dado'}" + ("" if k == "casas" else
                                                                                   f"\nn = {nn}")
            ax.text(x, y, txt, ha="center", va="center", fontsize=7.5, color="#222222",
                    bbox=dict(facecolor="white", edgecolor="#999999", alpha=0.85, pad=1.5, linewidth=0.5))
        ax.set_xlim(-74.5, -31.5)
        ax.set_ylim(-34.2, 5.8)
        ax.set_axis_off()
        ax.set_aspect("equal")
        ax.set_title(rot, fontsize=10.5)
    fig.suptitle("Luderias do estudo por região do Brasil", fontsize=13, fontweight="bold", y=0.97)
    fonte_rodape(fig, FONTE + " n = casas com o dado; cor mais escura, valor maior.", y=0.1)
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
    for k in ("nota", "avaliacoes", "seguidores", "horas", "comentarios_post", "cesta"):
        mapa_variavel(tm, uf, k)
    painel_regiao(tr, uf)


if __name__ == "__main__":
    main()
