"""
Bloco B1 - fluxo dos concorrentes por dia da semana e hora (histogramas do
índice "Horários de pico" do Google Maps): um gráfico com a média e outro com
a mediana das casas, em % da hora mais cheia da semana de cada casa.

Entrada (dados/B1_estabelecimentos/_dados-agregados/):
  - B1_horarios_pico_concorrentes_horas.csv (B1-a_horarios_pico.py): índice
    0-100 por casa × dia × hora, com o dia já corrigido;
  - B1_horarios.csv: horário publicado de cada casa (Places API e perfis).

Regra de inclusão: em cada dia × hora entram só as casas abertas naquela hora
pelo horário publicado (aberta se o expediente cobre qualquer parte da hora).
A casa fechada tem índice zero por definição e puxaria a média e a mediana
para baixo; por isso fica fora daquele dia × hora, e o n de cada barra varia.
As horas de 0h a 5h seguem a convenção do Google: pertencem à noite do próprio
dia (a hora 0 do sábado é a madrugada de sábado para domingo). Nessa convenção,
todas as barras com movimento caem dentro do horário publicado (conferido ao
rodar). A São Jogue fica de fora, como nas medidas do B1-a_horarios_pico.py.

Barras com menos de 5 casas abertas saem em cinza claro (leitura frágil). A
faixa sombreada marca o horário do plano (P7: terça a sábado das 14h às 23h,
domingo das 14h às 20h). A linha mostra a % das 54 casas da população do B1
(B1_horarios.csv, com a São Jogue) abertas em cada dia × hora, pela mesma regra
de abertura; não depende da coleta do Google.

Saídas (dados/B1_estabelecimentos/_dados-agregados/5_graficos/graficos/):
  png/, svg/ e valores/ de B1_fluxo_dia_hora_media e B1_fluxo_dia_hora_mediana.

Uso:
    python3 "_src/PyScripts/B1_Estabelecimentos/3_analise/B1-a_fluxo_dia_hora.py"
"""
# Caminhos: _src/extras/ (log e padrão visual); log em ../logs/
import sys
from pathlib import Path
_AQUI = Path(__file__).resolve()
sys.path[:0] = [*map(str, (_AQUI.parents[3] / "Extras").glob("G[0-9]_*"))]
from log_execucao import registrar_execucao  # noqa: E402
if __name__ == "__main__":
    registrar_execucao(__file__)

import pandas as pd  # noqa: E402

from graficos_comum import APAGADO, GRADE, HALO, MEDIO, TINTA, TINTA2, TINTA3, VERMELHO, br, figura, salvar  # noqa: E402

ROOT = _AQUI.parents[4]
EST = ROOT / "dados" / "B1_estabelecimentos" / "_dados-agregados"
PASTA = EST / "5_graficos" / "graficos"
FONTE = ("Fonte: elaboração própria com o índice \"Horários de pico\" do Google Maps (coleta de 10 e "
         "11/11/2026) e os horários publicados das casas (15/10/2026), recorte B1.")
DIAS = ["segunda", "terca", "quarta", "quinta", "sexta", "sabado", "domingo"]
NOME_DIA = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"]
HORAS = list(range(6, 24)) + list(range(0, 6))  # eixo do Google: 6h a 5h da madrugada
PLANO = {"terca": (14, 23), "quarta": (14, 23), "quinta": (14, 23), "sexta": (14, 23),
         "sabado": (14, 23), "domingo": (14, 20)}
N_MIN = 5


def intervalos(texto):
    """'18:00-01:00 | ...' -> [(18.0, 25.0), ...]; fechamento depois da meia-noite soma 24."""
    if pd.isna(texto):
        return []
    out = []
    for parte in str(texto).split("|"):
        a, b = parte.strip().split("-")
        ha, hb = int(a[:2]) + int(a[3:]) / 60, int(b[:2]) + int(b[3:]) / 60
        out.append((ha, hb + 24 if hb <= ha else hb))
    return out


def aberta(expediente, hora):
    """Aberta em alguma parte de [hora, hora+1); horas 0-5 são a madrugada do mesmo dia."""
    x = hora + 24 if hora < 6 else hora
    return any(a < x + 1 and b > x for a, b in expediente)


def tabela():
    h = pd.read_csv(EST / "B1_horarios_pico_concorrentes_horas.csv", sep=";")
    h = h[~h["nome_b1"].str.contains("São Jogue")]
    h["hora"] = h["hora"].astype(int)
    hor = pd.read_csv(EST / "B1_horarios.csv", sep=";").set_index("place_id")
    assert h["place_id"].isin(hor.index).all(), "casa da coleta sem horário publicado"
    h["aberta"] = [aberta(intervalos(hor.at[p, d]), hr) for p, d, hr in zip(h.place_id, h.dia_semana, h.hora)]
    fora = h[(h.ocupacao_relativa > 0) & ~h.aberta]
    print(f"  casas: {h.place_id.nunique()}; barras com movimento fora do horário publicado: {len(fora)}")
    ab = h[h.aberta]
    t = (ab.groupby(["dia_semana", "hora"])["ocupacao_relativa"]
         .agg(casas_abertas="count", media="mean", mediana="median").reset_index())
    # conferência: soma das casas abertas = linhas abertas da base (cada casa × dia × hora uma vez)
    assert t.casas_abertas.sum() == len(ab) and not ab.duplicated(["place_id", "dia_semana", "hora"]).any()
    print(f"  soma das casas abertas por dia × hora = {t.casas_abertas.sum()} = linhas abertas (diferença 0)")
    t["ordem_dia"] = t.dia_semana.map(DIAS.index)
    t["ordem_hora"] = t.hora.map(HORAS.index)
    return t.sort_values(["ordem_dia", "ordem_hora"]).drop(columns=["ordem_dia", "ordem_hora"]), h.place_id.nunique()


def populacao():
    """% das casas do B1 (todas as de B1_horarios.csv) abertas em cada dia × hora (0-23, convenção do Google)."""
    hor = pd.read_csv(EST / "B1_horarios.csv", sep=";")
    exp = {(r.place_id, d): intervalos(getattr(r, d)) for r in hor.itertuples() for d in DIAS}
    linhas = []
    for d in DIAS:
        for hr in range(24):
            n = sum(aberta(exp[(p, d)], hr) for p in hor.place_id)
            linhas.append({"dia_semana": d, "hora": hr, "casas_pop_abertas": n, "pct_pop_abertas": 100 * n / len(hor)})
    return pd.DataFrame(linhas), len(hor)


def grafico(t, n_casas, pop, n_pop, col, rotulo, nome):
    ok = t[t.casas_abertas >= N_MIN]
    topo = ok.loc[ok[col].idxmax()]
    dia_top = NOME_DIA[DIAS.index(topo.dia_semana)].lower()
    art = "no" if topo.dia_semana in ("sabado", "domingo") else "na"
    titulo = (f"{rotulo.capitalize()} do fluxo chega a {br(topo[col], 0)}% do pico semanal "
              f"{art} {dia_top} às {int(topo.hora)}h")
    sub = (f"{rotulo.capitalize()} do índice de movimento do Google (100 = hora mais cheia da semana da "
           f"casa), só entre as casas abertas em cada hora; {n_casas} concorrentes, sem a São Jogue")
    nota = (f"Nota: n de casas abertas varia por barra; barras em cinza claro têm menos de {N_MIN} casas. "
            "Faixa sombreada: horário do plano (terça a sábado, 14h às 23h; domingo, 14h às 20h). "
            f"Linha: % das {n_pop} casas da população do B1 abertas na hora, pelo horário publicado.")
    fig, ax0 = figura(8.2, 10.2, titulo, sub, FONTE, esq=1.45, dir=0.3, base=0.75, nota=nota)
    pos = ax0.get_position()
    ax0.remove()
    alt = pos.height / 7
    vmax = 100
    for i, dia in enumerate(DIAS):
        ax = fig.add_axes([pos.x0, pos.y0 + (6 - i) * alt + alt * 0.12, pos.width, alt * 0.82])
        d = t[t.dia_semana == dia].set_index("hora").reindex(HORAS)
        x = range(len(HORAS))
        if dia in PLANO:
            a, b = PLANO[dia]
            ax.axvspan(HORAS.index(a) - 0.5, HORAS.index(b - 1) + 0.5, color="#f6e7e7", zorder=0, lw=0)
        for v in (25, 50, 75, 100):
            ax.axhline(v, color=GRADE, lw=0.8, zorder=1)
        cores = [APAGADO if (pd.isna(n) or n < N_MIN) else MEDIO for n in d.casas_abertas]
        cores = [VERMELHO if (hr == topo.hora and dia == topo.dia_semana) else c for hr, c in zip(HORAS, cores)]
        ax.bar(x, d[col].fillna(0), width=0.78, color=cores, zorder=3)
        lp = pop[pop.dia_semana == dia].set_index("hora").reindex(HORAS)["pct_pop_abertas"]
        ax.plot(list(x), lp.values, color=TINTA, lw=1.5, marker="o", ms=2.8, zorder=4, path_effects=HALO)
        if i == 0:
            ax.text(len(HORAS) - 0.4, 104, f"linha: % das {n_pop} casas abertas", ha="right", va="bottom",
                    fontsize=8.5, color=TINTA, zorder=5)
        dd = d[d.casas_abertas >= N_MIN]
        if len(dd):
            hm = dd[col].idxmax()
            ax.text(HORAS.index(hm), dd.at[hm, col] + 3, f"{br(dd.at[hm, col], 0)}%", ha="center",
                    va="bottom", fontsize=8.5, color=TINTA, fontweight="semibold", zorder=6,
                    path_effects=HALO)
        ax.set_ylim(0, vmax * 1.12)
        ax.set_xlim(-0.6, len(HORAS) - 0.4)
        ax.set_yticks([0, 50, 100])
        ax.set_yticklabels(["0", "50", "100%"], fontsize=8, color=TINTA3)
        ax.text(-0.075, 0.5, NOME_DIA[i], transform=ax.transAxes, ha="right", va="center", fontsize=10.5,
                color=TINTA, fontweight="semibold")
        ax.set_xticks(list(x))
        ax.set_xticklabels([f"{hr}h" for hr in HORAS] if i == 6 else [], fontsize=8, color=TINTA2)
        ax.tick_params(length=0)
        for s in ("top", "right", "left"):
            ax.spines[s].set_visible(False)
        ax.spines["bottom"].set_color(TINTA3)
    vals = t[["dia_semana", "hora", "casas_abertas", col]].rename(columns={col: f"{col}_pct"})
    vals = pop[pop.hora.isin(HORAS)].merge(vals, on=["dia_semana", "hora"], how="left")
    vals["ordem"] = vals.dia_semana.map(DIAS.index) * 100 + vals.hora.map(HORAS.index)
    vals = vals.sort_values("ordem").drop(columns="ordem")
    vals[f"{col}_pct"] = vals[f"{col}_pct"].round(1)
    vals["pct_pop_abertas"] = vals["pct_pop_abertas"].round(1)
    salvar(fig, PASTA, nome, vals)
    print(f"  {nome}: máximo {topo.dia_semana} {int(topo.hora)}h = {topo[col]:.1f}% (n = {int(topo.casas_abertas)})")


def main():
    global HORAS
    t, n = tabela()
    pop, n_pop = populacao()
    # eixo só com as horas que têm alguma casa aberta (sem colunas vazias nas pontas)
    HORAS = [hr for hr in HORAS if hr in set(t.hora) or hr in set(pop.hora[pop.casas_pop_abertas > 0])]
    grafico(t, n, pop, n_pop, "media", "média", "B1_fluxo_dia_hora_media")
    grafico(t, n, pop, n_pop, "mediana", "mediana", "B1_fluxo_dia_hora_mediana")
    m = pop.loc[pop.pct_pop_abertas.idxmax()]
    print(f"  população aberta: máximo {m.dia_semana} {m.hora}h = {m.pct_pop_abertas:.1f}% ({m.casas_pop_abertas} de {n_pop})")
    por_dia = t.groupby("dia_semana").agg(n_max=("casas_abertas", "max")).reindex(DIAS)
    print("  casas abertas no horário de maior n, por dia:", por_dia.n_max.fillna(0).astype(int).to_dict())


if __name__ == "__main__":
    main()
