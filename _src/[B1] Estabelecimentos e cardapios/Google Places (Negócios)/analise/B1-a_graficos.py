"""
Bloco B1 - gráficos principais das luderias do estudo (54 casas em 15/10/2026):
quantas casas por metrópole, nota média e volume de avaliações no Google,
dias e horários de funcionamento, seguidores no Instagram e cesta por pessoa.

Entrada: outros/dados_graficos.py (base do B1-a_estatistica_descritiva.py, com
nota e volume do CSV da curadoria) e estabelecimentos/B1_horarios.csv.

Regras:
- cada place_id conta uma vez, na metrópole do endereço e na região da UF da
  capital; toda tabela por grupo é conferida contra o total (diferença zero);
- Salvador em vermelho (elemento focal), as demais pela cor da região;
- Instagram de LudoCafé e Dominaria fica de fora (perfil errado coletado);
- casas sem o dado ficam fora só do gráfico daquele dado, com o n no rodapé.

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

import matplotlib.pyplot as plt  # noqa: E402
import numpy as np  # noqa: E402
import pandas as pd  # noqa: E402
from matplotlib.patches import Patch  # noqa: E402
from matplotlib.ticker import FuncFormatter, MaxNLocator  # noqa: E402

from dados_graficos import abertas_por_faixa, casas  # noqa: E402
from graficos_comum import (APAGADO, COR_REGIAO, CORES, ORDEM_REGIAO, fonte_rodape,  # noqa: E402
                            legenda_fora, salvar)

ROOT = _AQUI.parents[4]
PASTA = ROOT / "dados" / "[B1] Estabelecimentos e cardapios" / "estabelecimentos" / "5_graficos" / "graficos"
FONTE_MAPS = "Fonte: Google Maps (Places API, 09/2026; casas novas em 12/10/2026), recorte B1 (54 casas)."
FONTE_IG = "Fonte: Instagram, perfis coletados de 11 a 15/10/2026 (B1)."
DIAS = ["segunda", "terca", "quarta", "quinta", "sexta", "sabado", "domingo"]
NOME_DIA = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"]


MILHAR = FuncFormatter(lambda v, _: f"{v:,.0f}".replace(",", "."))


def cor_casa(r):
    return CORES["destaque"] if r.metropole == "Salvador" else COR_REGIAO[r.regiao]


def legenda_regioes(ax, com_salvador=True):
    h = [Patch(color=COR_REGIAO[r], label=r) for r in ORDEM_REGIAO]
    if com_salvador:
        h.append(Patch(color=CORES["destaque"], label="Salvador"))
    return ax.legend(handles=h, loc="upper left", bbox_to_anchor=(1.01, 1), borderaxespad=0, frameon=True,
                     title="Região")


def confere_total(tab, col, total, nome):
    soma = int(tab[col].sum())
    assert soma == total, f"{nome}: soma {soma} != total {total}"
    print(f"  {nome}: soma das linhas = {soma} = total (diferença 0)")


# ---------- 1. casas por metrópole ----------
def casas_metro(d):
    t = d.groupby(["regiao", "metropole"]).size().rename("casas").reset_index()
    confere_total(t, "casas", len(d), "casas por metrópole")
    t["ordem"] = t.regiao.map(ORDEM_REGIAO.index)
    t = t.sort_values(["casas", "ordem"], ascending=[True, False])
    fig, ax = plt.subplots(figsize=(9, 6))
    cores = [CORES["destaque"] if m == "Salvador" else COR_REGIAO[r] for m, r in zip(t.metropole, t.regiao)]
    bars = ax.barh(t.metropole, t.casas, color=cores, height=0.65)
    for b in bars:
        ax.text(b.get_width() + 0.25, b.get_y() + b.get_height() / 2, f"{int(b.get_width())}",
                va="center", ha="left", fontsize=9)
    ax.set_xlabel("Casas no estudo (mais de 100 avaliações no Google)")
    ax.set_xlim(0, t.casas.max() * 1.12)
    ax.xaxis.set_major_locator(MaxNLocator(integer=True))
    ax.grid(axis="y", visible=False)
    ax.set_title(f"São Paulo concentra {t.casas.max()} das {len(d)} casas; Salvador tem uma")
    legenda_regioes(ax)
    fonte_rodape(fig, FONTE_MAPS)
    salvar(fig, PASTA, "B1_casas_metro", t.drop(columns="ordem").sort_values("casas", ascending=False))


# ---------- 2. nota média por casa, por região ----------
def nota_regiao(d):
    rng = np.random.default_rng(20261016)  # semente fixa: o deslocamento dos pontos não muda entre execuções
    fig, ax = plt.subplots(figsize=(9, 5))
    for i, reg in enumerate(ORDEM_REGIAO):
        s = d[d.regiao == reg]
        y = i + rng.uniform(-0.22, 0.22, len(s))
        cores = [cor_casa(r) for r in s.itertuples()]
        ax.scatter(s.nota_media, y, c=cores, s=42, alpha=0.85, edgecolor="white", linewidth=0.5, zorder=3)
        med = s.nota_media.median()
        ax.plot([med, med], [i - 0.32, i + 0.32], color="#333333", lw=1.6, zorder=4)
        ax.text(5.03, i, f"n = {len(s)}; mediana {med:.1f}".replace(".", ","), va="center", fontsize=9)
    sal = d[d.metropole == "Salvador"].iloc[0]
    ax.annotate(f"{sal.nome.split(' - ')[0]} ({sal.nota_media:.1f})".replace(".", ","),
                (sal.nota_media, ORDEM_REGIAO.index("Nordeste")), xytext=(-70, 18), textcoords="offset points",
                fontsize=9, color=CORES["destaque"], arrowprops=dict(arrowstyle="-", color=CORES["destaque"]))
    ax.set_yticks(range(len(ORDEM_REGIAO)), ORDEM_REGIAO)
    ax.set_xlim(4.1, 5.02)
    ax.set_xlabel("Nota média no Google (1 a 5)")
    ax.grid(axis="y", visible=False)
    ax.set_title(f"As notas se espremem entre {d.nota_media.min():.1f} e 5,0: nota alta é piso, não diferencial"
                 .replace(".", ",", 1))
    fonte_rodape(fig, FONTE_MAPS + " Traço preto: mediana da região.")
    salvar(fig, PASTA, "B1_nota_regiao",
           d[["nome", "metropole", "regiao", "nota_media"]].sort_values(["regiao", "nota_media"]))


# ---------- 3. volume de avaliações por casa ----------
def avaliacoes_casas(d):
    s = d.sort_values("volume_avaliacoes")
    fig, ax = plt.subplots(figsize=(9, 12))
    cores = [cor_casa(r) for r in s.itertuples()]
    bars = ax.barh(range(len(s)), s.volume_avaliacoes, color=cores, height=0.7)
    for b in bars:
        ax.text(b.get_width() + 40, b.get_y() + b.get_height() / 2, f"{int(b.get_width()):,}".replace(",", "."),
                va="center", ha="left", fontsize=7.5)
    rot = [f"{n[:34]} ({m})" for n, m in zip(s.nome, s.metropole)]
    ax.set_yticks(range(len(s)), rot, fontsize=7.5)
    ax.set_ylim(-0.7, len(s) - 0.3)
    ax.set_xlim(0, s.volume_avaliacoes.max() * 1.1)
    ax.set_xlabel("Avaliações no Google (total acumulado na data da coleta)")
    ax.grid(axis="y", visible=False)
    med = d.volume_avaliacoes.median()
    ax.axvline(med, color="#333333", ls="--", lw=1)
    ax.text(med + 40, 1, f"mediana: {med:,.0f}".replace(",", "."), fontsize=8.5,
            bbox=dict(facecolor="white", edgecolor="none", pad=1))
    ax.xaxis.set_major_formatter(MILHAR)
    ax.set_title("Poucas casas concentram as avaliações; a mediana fica em "
                 f"{med:,.0f}".replace(",", "."))
    legenda_regioes(ax)
    fonte_rodape(fig, FONTE_MAPS, y=0.0)
    salvar(fig, PASTA, "B1_avaliacoes_casas",
           s[["nome", "metropole", "regiao", "volume_avaliacoes"]].iloc[::-1])


# ---------- 4. nota × volume ----------
def nota_volume(d):
    fig, ax = plt.subplots(figsize=(9, 5.5))
    for reg in ORDEM_REGIAO:
        s = d[(d.regiao == reg) & (d.metropole != "Salvador")]
        ax.scatter(s.volume_avaliacoes, s.nota_media, s=40, color=COR_REGIAO[reg], label=reg, alpha=0.85,
                   edgecolor="white", linewidth=0.5, zorder=3)
    sal = d[d.metropole == "Salvador"]
    ax.scatter(sal.volume_avaliacoes, sal.nota_media, s=70, color=CORES["destaque"], label="Salvador", zorder=4,
               edgecolor="white")
    ax.set_xscale("log")
    ax.set_xticks([100, 200, 500, 1000, 2000, 5000], ["100", "200", "500", "1.000", "2.000", "5.000"])
    ax.minorticks_off()
    ax.set_xlabel("Avaliações no Google (escala logarítmica)")
    ax.set_ylabel("Nota média (1 a 5)")
    rho = d[["volume_avaliacoes", "nota_media"]].corr(method="spearman").iloc[0, 1]
    msg = ("Mais avaliações, nota um pouco menor" if rho <= -0.3 else
           "Mais avaliações, nota um pouco maior" if rho >= 0.3 else "Volume de avaliações não acompanha a nota")
    ax.set_title(f"{msg} (Spearman = {rho:.2f})".replace(".", ",").replace("-", "−"))
    legenda_fora(ax, title="Região")
    fonte_rodape(fig, FONTE_MAPS)
    salvar(fig, PASTA, "B1_nota_volume",
           d[["nome", "metropole", "regiao", "volume_avaliacoes", "nota_media"]].assign(spearman=round(rho, 3)))


# ---------- 5. dias de funcionamento ----------
def dias_abertos(d):
    t = pd.DataFrame({"dia": NOME_DIA, "casas_abertas": [int(d[f"abre_{x}"].sum()) for x in DIAS]})
    t["casas_total"] = len(d)
    t["pct"] = (100 * t.casas_abertas / len(d)).round(1)
    fig, ax = plt.subplots(figsize=(9, 4.8))
    cores = [CORES["principal"] if p >= 50 else CORES["neutro"] for p in t.pct]
    bars = ax.bar(t.dia, t.pct, color=cores, width=0.62)
    for b, n in zip(bars, t.casas_abertas):
        ax.text(b.get_x() + b.get_width() / 2, b.get_height() + 1.5, f"{b.get_height():.0f}%\n({n})",
                ha="center", va="bottom", fontsize=9)
    ax.set_ylim(0, 118)
    ax.set_ylabel(f"% das {len(d)} casas abertas no dia")
    ax.grid(axis="x", visible=False)
    ax.set_title("Quinta a sábado é o miolo da semana; segunda é dia de folga")
    fonte_rodape(fig, "Fonte: horários do Google Maps e dos perfis das casas, consolidados em 15/10/2026 (B1).")
    salvar(fig, PASTA, "B1_dias_abertos", t)


# ---------- 6. mapa de calor dos horários ----------
def horarios_calor(d):
    a = abertas_por_faixa()
    m = a.pivot(index="dia", columns="faixa_h", values="pct_abertas").loc[DIAS]
    fig, ax = plt.subplots(figsize=(11, 4.2))
    im = ax.imshow(m.values, aspect="auto", cmap="Blues", vmin=0, vmax=100)
    ax.grid(False)
    cols = list(m.columns)
    ticks = [i for i, h in enumerate(cols) if float(h).is_integer() and int(h) % 2 == 0]
    ax.set_xticks(ticks, [f"{int(cols[i]) % 24}h" for i in ticks])
    ax.set_yticks(range(7), NOME_DIA)
    ax.set_xlabel("Horário (faixas de 30 minutos; depois de 0h, ainda o mesmo dia de abertura)")
    cb = fig.colorbar(im, ax=ax, pad=0.015)
    cb.set_label("% das casas abertas")
    pico = a.loc[a.pct_abertas.idxmax()]
    dia = NOME_DIA[DIAS.index(pico.dia)].lower()
    ax.set_title(f"O pico é à noite: {pico.pct_abertas:.0f}% das casas abertas às "
                 f"{int(pico.faixa_h) % 24}h{int(round(pico.faixa_h % 1 * 60)):02d} de {dia}")
    fonte_rodape(fig, "Fonte: horários do Google Maps e dos perfis das casas, consolidados em 15/10/2026 (B1).")
    salvar(fig, PASTA, "B1_horarios_calor", a)


# ---------- 7. horas abertas por semana ----------
def horas_semana(d):
    fig, ax = plt.subplots(figsize=(9, 4.8))
    bins = np.arange(0, d.horas_semana.max() + 10, 5)
    ax.hist(d.horas_semana, bins=bins, color=CORES["principal"], edgecolor="white")
    sal = d[d.metropole == "Salvador"].iloc[0]
    ax.axvline(sal.horas_semana, color=CORES["destaque"], lw=2)
    ax.text(sal.horas_semana + 0.8, ax.get_ylim()[1] * 0.9, f"Salvador: {sal.horas_semana:.0f} h".replace(".", ","),
            color=CORES["destaque"], fontsize=9)
    med = d.horas_semana.median()
    ax.axvline(med, color="#333333", ls="--", lw=1)
    ax.text(med - 0.8, ax.get_ylim()[1] * 0.97, f"mediana: {med:.1f} h".replace(".", ","), fontsize=9, ha="right",
            bbox=dict(facecolor="white", edgecolor="none", pad=1))
    ax.set_xlabel("Horas abertas por semana")
    ax.set_ylabel("Casas")
    ax.grid(axis="x", visible=False)
    ax.set_title(f"Metade das casas abre até {med:.0f} horas por semana")
    fonte_rodape(fig, f"Fonte: horários consolidados em 15/10/2026 (B1), {len(d)} casas.")
    t = pd.cut(d.horas_semana, bins=bins, right=False).value_counts().sort_index().rename("casas").reset_index()
    t["horas_semana"] = t["horas_semana"].astype(str)
    confere_total(t, "casas", len(d), "horas por semana")
    salvar(fig, PASTA, "B1_horas_semana", t)


# ---------- 8. seguidores no Instagram ----------
def seguidores_casas(d):
    s = d.dropna(subset=["seguidores"]).sort_values("seguidores")
    fig, ax = plt.subplots(figsize=(9, 11))
    cores = [cor_casa(r) for r in s.itertuples()]
    bars = ax.barh(range(len(s)), s.seguidores / 1000, color=cores, height=0.7)
    for b in bars:
        ax.text(b.get_width() + 0.4, b.get_y() + b.get_height() / 2, f"{b.get_width():.1f}".replace(".", ","),
                va="center", ha="left", fontsize=7.5)
    ax.set_yticks(range(len(s)), [f"{n[:34]} ({m})" for n, m in zip(s.nome, s.metropole)], fontsize=7.5)
    ax.set_ylim(-0.7, len(s) - 0.3)
    ax.set_xlim(0, s.seguidores.max() / 1000 * 1.12)
    ax.set_xlabel("Seguidores no Instagram (mil)")
    ax.grid(axis="y", visible=False)
    med = s.seguidores.median() / 1000
    ax.axvline(med, color="#333333", ls="--", lw=1)
    ax.text(med + 0.4, 1, f"mediana: {med:.1f} mil".replace(".", ","), fontsize=8.5,
            bbox=dict(facecolor="white", edgecolor="none", pad=1))
    ax.set_title(f"Seguidores no Instagram: mediana de {med:.1f} mil".replace(".", ","))
    legenda_regioes(ax)
    fonte_rodape(fig, FONTE_IG + f" {len(s)} de {len(d)} casas com perfil coletado.", y=0.0)
    salvar(fig, PASTA, "B1_seguidores_casas", s[["nome", "metropole", "regiao", "seguidores"]].iloc[::-1])


# ---------- 9. seguidores × avaliações ----------
def seguidores_avaliacoes(d):
    s = d.dropna(subset=["seguidores"])
    s = s[s.seguidores > 0]
    fig, ax = plt.subplots(figsize=(9, 5.5))
    for reg in ORDEM_REGIAO:
        x = s[(s.regiao == reg) & (s.metropole != "Salvador")]
        ax.scatter(x.seguidores, x.volume_avaliacoes, s=40, color=COR_REGIAO[reg], label=reg, alpha=0.85,
                   edgecolor="white", linewidth=0.5, zorder=3)
    sal = s[s.metropole == "Salvador"]
    ax.scatter(sal.seguidores, sal.volume_avaliacoes, s=70, color=CORES["destaque"], label="Salvador", zorder=4,
               edgecolor="white")
    ax.set_xscale("log")
    ax.set_yscale("log")
    ax.set_xticks([2000, 5000, 10000, 20000, 50000, 100000, 200000],
                  ["2 mil", "5 mil", "10 mil", "20 mil", "50 mil", "100 mil", "200 mil"])
    ax.set_yticks([100, 200, 500, 1000, 2000, 5000], ["100", "200", "500", "1.000", "2.000", "5.000"])
    ax.minorticks_off()
    ax.set_xlabel("Seguidores no Instagram (escala logarítmica)")
    ax.set_ylabel("Avaliações no Google (escala logarítmica)")
    rho = s[["seguidores", "volume_avaliacoes"]].corr(method="spearman").iloc[0, 1]
    ax.set_title(f"Casas com mais seguidores tendem a ter mais avaliações (Spearman = {rho:.2f})".replace(".", ","))
    legenda_fora(ax, title="Região")
    fonte_rodape(fig, FONTE_IG + " " + FONTE_MAPS.replace("Fonte: ", ""))
    salvar(fig, PASTA, "B1_seguidores_avaliacoes",
           s[["nome", "metropole", "regiao", "seguidores", "volume_avaliacoes"]].assign(spearman=round(rho, 3)))


# ---------- 10. cesta por pessoa ----------
def cesta_casas(d):
    s = d.dropna(subset=["cesta_mediana"]).sort_values("cesta_mediana")
    fig, ax = plt.subplots(figsize=(9, 8))
    y = np.arange(len(s))
    ax.hlines(y, s.cesta_baixa, s.cesta_alta, color=APAGADO, lw=4, zorder=2)
    cores = [cor_casa(r) for r in s.itertuples()]
    ax.scatter(s.cesta_mediana, y, c=cores, s=45, zorder=3)
    for yy, v, hi in zip(y, s.cesta_mediana, s.cesta_alta.fillna(s.cesta_mediana)):
        ax.text(hi + 1.5, yy, f"R$ {v:.0f}", va="center", fontsize=7.5)
    ax.set_xlim(0, s.cesta_alta.max() * 1.1)
    ax.set_yticks(y, [f"{n[:34]} ({m})" for n, m in zip(s.nome, s.metropole)], fontsize=7.5)
    ax.set_xlabel("Cesta por pessoa (couvert + bebida + entrada ou prato), R$")
    ax.grid(axis="y", visible=False)
    med = s.cesta_mediana.median()
    ax.axvline(med, color="#333333", ls="--", lw=1)
    ax.set_title(f"Cesta por pessoa: mediana de R$ {med:.0f} entre as casas com cardápio".replace(".", ","))
    legenda_regioes(ax, com_salvador=False)
    fonte_rodape(fig, f"Fonte: cardápios transcritos (B1), {len(s)} de {len(d)} casas (a de Salvador ainda sem "
                      "cardápio). Ponto: nível mediano; barra: do nível baixo (P25) ao alto (P75) de cada cardápio.")
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
