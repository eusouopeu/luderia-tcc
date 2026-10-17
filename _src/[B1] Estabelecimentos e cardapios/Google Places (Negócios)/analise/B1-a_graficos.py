"""
Bloco B1 - gráficos principais das luderias do estudo (54 casas em 15/10/2026):
quantas casas por metrópole, nota média e volume de avaliações no Google,
dias e horários de funcionamento, seguidores no Instagram e cesta por pessoa.

Entrada: outros/dados_graficos.py (base do B1-a_estatistica_descritiva.py, com
nota e volume do CSV da curadoria) e estabelecimentos/B1_horarios.csv.

Regras:
- cada place_id conta uma vez, na metrópole do endereço e na região da UF da
  capital; toda tabela por grupo é conferida contra o total (diferença zero);
- estilo editorial de `_src/extras/graficos_comum.py`: título com a
  conclusão, calculada dos dados (muda sozinha se a coleta mudar), cinza
  para tudo e vermelho só para Salvador;
- Instagram de LudoCafé e Dominaria fica de fora (perfil errado coletado);
- casas sem o dado ficam fora só do gráfico daquele dado, com o n no subtítulo.

Saídas (dados/[B1] Estabelecimentos e cardapios/estabelecimentos/5_graficos/graficos/):
  png/<nome>.png (300 dpi, para o .docx), svg/<nome>.svg (texto editável) e
  valores/<nome>.csv (números desenhados). Para atualizar depois de corrigir
  uma coleta, rodar o script de novo.

Uso:
    python3 "_src/[B1] Estabelecimentos e cardapios/Google Places (Negócios)/analise/B1-a_graficos.py"
"""
# Caminhos: _src/extras/ (log e padrão visual) e outros/ do objeto; log em ../logs/
import sys
from pathlib import Path
_AQUI = Path(__file__).resolve()
sys.path[:0] = [str(_AQUI.parents[3] / "extras"), str(_AQUI.parents[1] / "outros")]
from log_execucao import registrar_execucao  # noqa: E402
if __name__ == "__main__":
    registrar_execucao(__file__)

import numpy as np  # noqa: E402
import pandas as pd  # noqa: E402

from dados_graficos import abertas_por_faixa, casas  # noqa: E402
from graficos_comum import (APAGADO, BASE, CLARO, GRADE, HALO, MEDIO, ORDEM_REGIAO, SEQUENCIAL, TINTA,  # noqa: E402
                            TINTA2, TINTA3, VERMELHO, br, cor_casa, figura, grade_x, grade_y, salvar)

ROOT = _AQUI.parents[4]
PASTA = ROOT / "dados" / "[B1] Estabelecimentos e cardapios" / "estabelecimentos" / "5_graficos" / "graficos"
FONTE_MAPS = ("Fonte: elaboração própria com dados do Google Maps (Places API, set. 2026; casas novas em "
              "12/10/2026), recorte B1.")
FONTE_HOR = "Fonte: elaboração própria com horários do Google Maps e dos perfis das casas (15/10/2026), recorte B1."
FONTE_IG = "Fonte: elaboração própria com perfis do Instagram coletados de 11 a 15/10/2026, recorte B1."
DIAS = ["segunda", "terca", "quarta", "quinta", "sexta", "sabado", "domingo"]
NOME_DIA = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"]


def confere_total(tab, col, total, nome):
    soma = int(tab[col].sum())
    assert soma == total, f"{nome}: soma {soma} != total {total}"
    print(f"  {nome}: soma das linhas = {soma} = total (diferença 0)")


def curto(nome, n=30):
    """Nome da casa sem o complemento depois de " - " ou " | ", com no máximo n caracteres."""
    base = nome.split(" - ")[0].split(" | ")[0].strip()
    return base if len(base) <= n else base[:n - 1].rstrip() + "…"


def rotulo_casa(ax, y, nome, metropole, x=-0.012, fs=9.5):
    """Nome da casa à esquerda do eixo, com a metrópole em cinza."""
    sal = metropole == "Salvador"
    ax.text(x, y, nome, transform=ax.get_yaxis_transform(), ha="right", va="center", fontsize=fs,
            color=VERMELHO if sal else TINTA, fontweight="semibold" if sal else "normal")


def barras_ranking(d, col, titulo, subtitulo, fonte, nome, fmt, escala=1.0, unidade=""):
    """Ranking de casas em barras horizontais finas, valor na ponta, mediana tracejada."""
    s = d.dropna(subset=[col]).sort_values(col).reset_index(drop=True)
    fig, ax = figura(8.2, 0.2 * len(s) + 2.0, titulo, subtitulo, fonte, esq=3.0, dir=0.6)
    v = s[col] / escala
    ax.barh(range(len(s)), v, height=0.62, color=[cor_casa(m) for m in s.metropole], zorder=3)
    for i, (val, m) in enumerate(zip(v, s.metropole)):
        ax.text(val + v.max() * 0.01, i, fmt(val), va="center", ha="left", fontsize=8.5,
                color=VERMELHO if m == "Salvador" else TINTA2, path_effects=HALO, zorder=5)
    for i, r in s.iterrows():
        rotulo_casa(ax, i, f"{curto(r.nome)} · {r.metropole}", r.metropole, fs=8.5)
    med = v.median()
    ax.axvline(med, color=TINTA3, lw=0.9, ls=(0, (3, 3)), zorder=1)
    ax.text(med, len(s) - 0.2, f" mediana: {fmt(med)}{unidade}", fontsize=9, color=TINTA2, va="bottom")
    ax.set_ylim(-0.7, len(s) + 0.6)
    ax.set_xlim(0, v.max() * 1.1)
    ax.set_yticks([])
    ax.set_xticks([])
    salvar(fig, PASTA, nome, s[["nome", "metropole", "regiao", col]].iloc[::-1])


# ---------- 1. casas por metrópole, agrupadas por região ----------
def casas_metro(d):
    t = d.groupby(["regiao", "metropole"]).size().rename("casas").reset_index()
    confere_total(t, "casas", len(d), "casas por metrópole")
    sp = int(t.casas.max())
    lider = t.loc[t.casas.idxmax(), "metropole"]
    frac = sp / len(d)
    parte = "um terço" if 0.3 <= frac < 0.37 else f"{frac:.0%}".replace(".", ",")
    linhas = []
    for reg in ORDEM_REGIAO[::-1]:
        s = t[t.regiao == reg].sort_values("casas")
        for r in s.itertuples():
            linhas.append(("barra", r.metropole, r.casas))
        n = int(s.casas.sum())
        linhas.append(("regiao", f"{reg.upper()}  ·  {n} casa{'s' if n != 1 else ''}", None))
    sal = int(t.set_index("metropole").casas.get("Salvador", 0))
    fig, ax = figura(8, 7.4, f"{lider} concentra {parte} das luderias do estudo",
                     f"Casas com mais de 100 avaliações no Google, por metrópole do endereço ({len(d)} casas). "
                     f"Salvador tem {sal}.", FONTE_MAPS, esq=1.75, dir=0.5)
    y = 0
    for tipo, rot, n in linhas:
        if tipo == "regiao":
            ax.text(-1.55 / 5.75, y - 0.05, rot, transform=ax.get_yaxis_transform(), fontsize=9.5,
                    fontweight="bold", color=TINTA3, ha="left", va="center")
            y += 1.3
            continue
        sal_ = rot == "Salvador"
        ax.barh(y, n, height=0.62, color=VERMELHO if sal_ else BASE, zorder=3)
        ax.text(-0.012, y, rot, transform=ax.get_yaxis_transform(), ha="right", va="center", fontsize=11,
                color=VERMELHO if sal_ else TINTA, fontweight="semibold" if sal_ else "normal")
        ax.text(n + 0.25, y, f"{n}", ha="left", va="center", fontsize=11, color=TINTA, fontweight="semibold")
        y += 1
    ax.set_ylim(-0.8, y - 0.4)
    ax.set_xlim(0, sp * 1.08)
    ax.set_xticks([])
    ax.set_yticks([])
    grade_x(ax, range(5, sp + 1, 5))
    salvar(fig, PASTA, "B1_casas_metro", t.sort_values("casas", ascending=False))


# ---------- 2. nota média por casa, por região ----------
def nota_regiao(d):
    rng = np.random.default_rng(20261016)  # semente fixa: o deslocamento dos pontos não muda entre execuções
    lo, hi = d.nota_media.min(), d.nota_media.max()
    acima = (d.nota_media >= 4.5).mean()
    fig, ax = figura(8.4, 5.4, f"Nota alta é o piso do setor: {acima:.0%} das casas têm 4,5 ou mais".replace(
        ".", ","), f"Nota média no Google de cada casa, por região (de {br(lo, 1)} a {br(hi, 1)}). "
                   "Traço: mediana da região.", FONTE_MAPS, esq=1.5, dir=1.6)
    for i, reg in enumerate(ORDEM_REGIAO[::-1]):
        s = d[d.regiao == reg]
        y = i + rng.uniform(-0.2, 0.2, len(s))
        ax.scatter(s.nota_media, y, c=[cor_casa(m) for m in s.metropole], s=46, alpha=0.8, edgecolor="white",
                   linewidth=0.8, zorder=3)
        med = s.nota_media.median()
        ax.plot([med, med], [i - 0.32, i + 0.32], color=TINTA, lw=2, zorder=4, solid_capstyle="round")
        ax.text(-0.012, i, reg, transform=ax.get_yaxis_transform(), ha="right", va="center", fontsize=11)
        ax.text(1.012, i, f"{len(s)} casa{'s' if len(s) != 1 else ''} · mediana {br(med, 1)}",
                transform=ax.get_yaxis_transform(), ha="left", va="center", fontsize=9.5, color=TINTA2)
    sal = d[d.metropole == "Salvador"]
    if len(sal):
        s0 = sal.iloc[0]
        ax.annotate(f"{s0.nome.split(' - ')[0]} ({br(s0.nota_media, 1)})",
                    (s0.nota_media, ORDEM_REGIAO[::-1].index("Nordeste")), xytext=(-12, 16),
                    textcoords="offset points", ha="right", fontsize=9.5, color=VERMELHO, fontweight="semibold",
                    arrowprops=dict(arrowstyle="-", color=VERMELHO, lw=0.8), path_effects=HALO)
    ticks = np.round(np.arange(np.floor(lo * 10) / 10, 5.01, 0.2), 1)
    ax.set_xticks(ticks, [br(t, 1) for t in ticks])
    ax.set_xlim(ticks[0] - 0.05, 5.05)
    ax.set_yticks([])
    ax.set_ylim(-0.6, len(ORDEM_REGIAO) - 0.4)
    grade_x(ax, ticks)
    salvar(fig, PASTA, "B1_nota_regiao",
           d[["nome", "metropole", "regiao", "nota_media"]].sort_values(["regiao", "nota_media"]))


# ---------- 3. volume de avaliações por casa ----------
def avaliacoes_casas(d):
    v = d.volume_avaliacoes.sort_values(ascending=False)
    top5 = v.head(5).sum() / v.sum()
    barras_ranking(d, "volume_avaliacoes", f"As 5 casas mais avaliadas somam {top5:.0%} das avaliações".replace(
        ".", ","), f"Avaliações acumuladas no Google por casa ({len(d)} casas; total de {br(v.sum())}).",
        FONTE_MAPS, "B1_avaliacoes_casas", lambda x: br(x))


# ---------- 4. nota × volume ----------
def dispersao(d, xcol, ycol, titulo, subtitulo, fonte, nome, xticks, yticks, xlog=True, ylog=False, rotular=2):
    s = d.dropna(subset=[xcol, ycol])
    s = s[s[xcol] > 0]
    fig, ax = figura(8.4, 5.8, titulo, subtitulo, fonte, esq=0.75, dir=0.4, base=0.75)
    out = s[s.metropole != "Salvador"]
    ax.scatter(out[xcol], out[ycol], s=48, color=BASE, alpha=0.7, edgecolor="white", linewidth=0.8, zorder=3)
    sal = s[s.metropole == "Salvador"]
    ax.scatter(sal[xcol], sal[ycol], s=80, color=VERMELHO, edgecolor="white", linewidth=1.2, zorder=4)
    for r in sal.itertuples():
        ax.annotate(curto(r.nome), (getattr(r, xcol), getattr(r, ycol)), xytext=(-9, 0), ha="right",
                    va="center", textcoords="offset points", fontsize=9.5, color=VERMELHO, fontweight="semibold",
                    path_effects=HALO, zorder=5)
    for k, r in enumerate(out.nlargest(rotular, xcol).itertuples()):
        ax.annotate(curto(r.nome, 22), (getattr(r, xcol), getattr(r, ycol)),
                    xytext=(0, -8) if k % 2 == 0 else (0, 8), textcoords="offset points",
                    ha="center", va="top" if k % 2 == 0 else "bottom", fontsize=8.5,
                    color=TINTA2, path_effects=HALO, zorder=5)
    if xlog:
        ax.set_xscale("log")
    if ylog:
        ax.set_yscale("log")
    ax.minorticks_off()
    ax.set_xticks([t for t, _ in xticks], [r for _, r in xticks])
    ax.set_yticks([t for t, _ in yticks], [r for _, r in yticks])
    ax.tick_params(axis="y", colors=TINTA3)
    grade_y(ax, [t for t, _ in yticks])
    ax.spines["bottom"].set_visible(True)
    return fig, ax, s


def nota_volume(d):
    rho = d[["volume_avaliacoes", "nota_media"]].corr(method="spearman").iloc[0, 1]
    msg = ("Quanto mais avaliações, um pouco menor a nota" if rho <= -0.3 else
           "Quanto mais avaliações, um pouco maior a nota" if rho >= 0.3 else "O volume de avaliações não muda a nota")
    xt = [(v, br(v)) for v in (100, 200, 500, 1000, 2000, 5000)]
    yt = [(v, br(v, 1)) for v in np.round(np.arange(np.floor(d.nota_media.min() * 10) / 10, 5.01, 0.2), 1)]
    fig, ax, s = dispersao(d, "volume_avaliacoes", "nota_media", msg,
                           f"Cada ponto é uma casa: avaliações no Google (escala logarítmica) e nota média. "
                           f"Correlação de Spearman = {br(rho, 2)}.".replace("-", "−"),
                           FONTE_MAPS, "B1_nota_volume", xt, yt)
    ax.set_xlabel("Avaliações no Google", labelpad=6)
    salvar(fig, PASTA, "B1_nota_volume",
           s[["nome", "metropole", "regiao", "volume_avaliacoes", "nota_media"]].assign(spearman=round(rho, 3)))


# ---------- 5. dias de funcionamento ----------
def dias_abertos(d):
    t = pd.DataFrame({"dia": NOME_DIA, "casas_abertas": [int(d[f"abre_{x}"].sum()) for x in DIAS]})
    t["casas_total"] = len(d)
    t["pct"] = (100 * t.casas_abertas / len(d)).round(1)
    cheios = [NOME_DIA[i].lower() for i in range(7) if t.pct[i] == 100]
    miolo = f"{cheios[0]} a {cheios[-1]}" if len(cheios) > 1 else "o fim de semana"
    fig, ax = figura(8, 5, f"Todas as casas abrem de {miolo}; na segunda, só {t.pct[0]:.0f}%",
                     f"Casas abertas em cada dia da semana ({len(d)} casas).", FONTE_HOR, esq=0.3, dir=0.3, base=0.5)
    cores = [BASE if p == 100 else MEDIO if p >= 50 else CLARO for p in t.pct]
    ax.bar(range(7), t.pct, color=cores, width=0.66, zorder=3)
    for i, (p, n) in enumerate(zip(t.pct, t.casas_abertas)):
        ax.text(i, p + 2, f"{p:.0f}%", ha="center", va="bottom", fontsize=12, fontweight="semibold", color=TINTA)
        ax.text(i, p + 9, f"{n} casas", ha="center", va="bottom", fontsize=9, color=TINTA3)
    ax.set_xticks(range(7), NOME_DIA, fontsize=11, color=TINTA)
    ax.set_yticks([])
    ax.set_ylim(0, 122)
    ax.axhline(0, color=CLARO, lw=0.8)
    salvar(fig, PASTA, "B1_dias_abertos", t)


# ---------- 6. mapa de calor dos horários ----------
def horarios_calor(d):
    a = abertas_por_faixa()
    m = a.pivot(index="dia", columns="faixa_h", values="pct_abertas").loc[DIAS]
    cols = list(m.columns)
    pico = a.loc[a.pct_abertas.idxmax()]
    dia = NOME_DIA[DIAS.index(pico.dia)].lower()
    hora = f"{int(pico.faixa_h) % 24}h{int(round(pico.faixa_h % 1 * 60)):02d}"
    fig, ax = figura(9.5, 4.9, f"O movimento é noturno: às {hora} de {dia}, {pico.pct_abertas:.0f}% das casas "
                               "estão abertas", "Parcela das casas abertas em cada faixa de 30 minutos, por dia da "
                                                "semana. Depois da meia-noite, o horário segue no dia em que a casa "
                                                "abriu.", FONTE_HOR, esq=1.05, dir=0.4, base=1.35)
    x = np.arange(len(cols) + 1)
    ax.pcolormesh(x, np.arange(8), m.values[::-1], cmap=SEQUENCIAL, vmin=0, vmax=100, edgecolors="white",
                  linewidth=1.2)
    ticks = [i for i, h in enumerate(cols) if float(h).is_integer() and int(h) % 2 == 0]
    ax.set_xticks([t for t in ticks], [f"{int(cols[t]) % 24}h" for t in ticks])
    ax.set_yticks(np.arange(7) + 0.5, NOME_DIA[::-1])
    ax.tick_params(axis="x", colors=TINTA2)
    # legenda de cor horizontal, embaixo
    cax = fig.add_axes([1 - 3.3 / 9.5, 0.62 / 4.9, 2.9 / 9.5, 0.12 / 4.9])
    cb = fig.colorbar(ax.collections[0], cax=cax, orientation="horizontal")
    cb.outline.set_visible(False)
    cb.set_ticks([0, 25, 50, 75, 100], labels=["0%", "25%", "50%", "75%", "100%"])
    cb.ax.tick_params(labelsize=8.5, colors=TINTA2, length=0)
    cax.set_title("Casas abertas", fontsize=9, color=TINTA2, loc="left")
    salvar(fig, PASTA, "B1_horarios_calor", a)


# ---------- 7. horas abertas por semana ----------
def horas_semana(d):
    bins = np.arange(0, d.horas_semana.max() + 10, 5)
    med = d.horas_semana.median()
    sal = d[d.metropole == "Salvador"]
    fig, ax = figura(8.2, 5, f"Metade das casas abre até {br(med)} horas por semana",
                     f"Casas por faixa de horas abertas na semana ({len(d)} casas)." +
                     (f" A de Salvador abre {br(sal.horas_semana.iloc[0])} horas." if len(sal) else ""),
                     FONTE_HOR, esq=0.5, dir=0.3, base=0.75)
    cont, borda = np.histogram(d.horas_semana, bins=bins)
    ax.bar(borda[:-1] + 2.5, cont, width=4.4, color=BASE, zorder=3)
    if len(sal):  # a casa de Salvador vira o bloco vermelho do topo da sua faixa
        hs = sal.horas_semana.iloc[0]
        k = np.searchsorted(borda, hs, side="right") - 1
        ax.bar(borda[k] + 2.5, 1, bottom=cont[k] - 1, width=4.4, color=VERMELHO, zorder=4)
    for x, c in zip(borda[:-1] + 2.5, cont):
        if c:
            ax.text(x, c + 0.15, f"{c}", ha="center", va="bottom", fontsize=9.5, color=TINTA2)
    ax.axvline(med, color=TINTA, lw=1, ls=(0, (3, 3)), zorder=2)
    ax.text(med - 0.6, cont.max() + 1.3, f"mediana: {br(med)} h", ha="right", fontsize=9.5, color=TINTA)
    if len(sal):
        ax.text(borda[k] + 2.5, cont[k] + 0.9, f"Salvador\n{br(hs)} h", ha="center", va="bottom", fontsize=9.5,
                color=VERMELHO, fontweight="semibold", linespacing=1.1)
    ini = borda[np.argmax(cont > 0)]
    ax.set_xlim(ini - 3, borda[-1] + 2)
    ax.set_xticks([b for b in bins[::2] if b >= ini - 3], [f"{int(b)} h" for b in bins[::2] if b >= ini - 3])
    ax.set_yticks([])
    ax.set_ylim(0, cont.max() + 2.2)
    ax.axhline(0, color=CLARO, lw=0.8)
    t = pd.DataFrame({"de_horas": borda[:-1], "ate_horas": borda[1:], "casas": cont})
    confere_total(t, "casas", len(d), "horas por semana")
    salvar(fig, PASTA, "B1_horas_semana", t)


# ---------- 8. seguidores no Instagram ----------
def seguidores_casas(d):
    s = d.dropna(subset=["seguidores"])
    barras_ranking(d, "seguidores", f"Metade das casas tem até {br(s.seguidores.median() / 1000, 1)} mil "
                                    "seguidores no Instagram",
                   f"Seguidores por casa, em mil ({len(s)} de {len(d)} casas com perfil coletado).", FONTE_IG,
                   "B1_seguidores_casas", lambda x: br(x, 1), escala=1000, unidade=" mil")


# ---------- 9. seguidores × avaliações ----------
def seguidores_avaliacoes(d):
    s = d.dropna(subset=["seguidores"])
    rho = s[["seguidores", "volume_avaliacoes"]].corr(method="spearman").iloc[0, 1]
    xt = [(v, f"{v // 1000} mil") for v in (2000, 5000, 10000, 20000, 50000, 100000, 200000)]
    yt = [(v, br(v)) for v in (100, 200, 500, 1000, 2000, 5000)]
    tit = ("Quem tem mais seguidores também tem mais avaliações" if rho >= 0.5 else
           "Seguidores e avaliações andam juntos, mas com folga" if rho >= 0.3 else
           "Seguidores não dizem quantas avaliações a casa tem")
    fig, ax, s2 = dispersao(d, "seguidores", "volume_avaliacoes", tit,
                            f"Cada ponto é uma casa (escalas logarítmicas). Correlação de Spearman = {br(rho, 2)}.",
                            FONTE_IG.replace("Fonte: elaboração própria com", "Fonte: elaboração própria com") +
                            " Avaliações: Google Maps.", "B1_seguidores_avaliacoes", xt, yt, ylog=True, rotular=2)
    ax.set_xlabel("Seguidores no Instagram", labelpad=6)
    ax.text(0.0, 1.02, "Avaliações no Google", transform=ax.transAxes, fontsize=10, color=TINTA2)
    salvar(fig, PASTA, "B1_seguidores_avaliacoes",
           s2[["nome", "metropole", "regiao", "seguidores", "volume_avaliacoes"]].assign(spearman=round(rho, 3)))


# ---------- 10. cesta por pessoa ----------
def cesta_casas(d):
    s = d.dropna(subset=["cesta_mediana"]).sort_values("cesta_mediana").reset_index(drop=True)
    med = s.cesta_mediana.median()
    sal_sem = d[(d.metropole == "Salvador") & d.cesta_mediana.isna()]
    fig, ax = figura(8.2, 0.24 * len(s) + 2.2, f"Uma ida à luderia custa, na casa típica, R$ {br(med)} por pessoa",
                     f"Couvert + bebida + entrada ou prato, por pessoa: ponto no nível mediano do cardápio, barra do "
                     f"nível baixo (P25) ao alto (P75). {len(s)} de {len(d)} casas com cardápio transcrito" +
                     ("; a de Salvador ainda sem cardápio." if len(sal_sem) else "."),
                     "Fonte: elaboração própria com cardápios das casas (set. e out. 2026), recorte B1.",
                     esq=3.0, dir=0.7, base=0.75)
    y = np.arange(len(s))
    ax.hlines(y, s.cesta_baixa, s.cesta_alta, color=APAGADO, lw=5, zorder=2, capstyle="round")
    ax.scatter(s.cesta_mediana, y, c=[cor_casa(m) for m in s.metropole], s=46, zorder=3, edgecolor="white", lw=0.8)
    for yy, v, hi in zip(y, s.cesta_mediana, s.cesta_alta.fillna(s.cesta_mediana)):
        ax.text(max(hi, v) + 1.5, yy, f"R$ {br(v)}", va="center", fontsize=8.5, color=TINTA2)
    for i, r in s.iterrows():
        rotulo_casa(ax, i, f"{curto(r.nome)} · {r.metropole}", r.metropole, fs=8.5)
    ax.axvline(med, color=TINTA3, lw=0.9, ls=(0, (3, 3)), zorder=1)
    ticks = list(range(0, int(s.cesta_alta.max()) + 20, 20))
    ax.set_xticks(ticks, [f"R$ {t}" for t in ticks])
    ax.tick_params(axis="x", colors=TINTA3)
    ax.set_xlim(0, s.cesta_alta.max() * 1.12)
    ax.set_yticks([])
    ax.set_ylim(-0.7, len(s) - 0.3)
    grade_x(ax, ticks[1:])
    salvar(fig, PASTA, "B1_cesta_casas",
           s[["nome", "metropole", "regiao", "cesta_baixa", "cesta_mediana", "cesta_alta"]].iloc[::-1])


def main():
    d = casas()
    print(f"{len(d)} casas")
    for f in (casas_metro, nota_regiao, avaliacoes_casas, nota_volume, dias_abertos, horarios_calor, horas_semana,
              seguidores_casas, seguidores_avaliacoes, cesta_casas):
        f(d)


if __name__ == "__main__":
    main()
