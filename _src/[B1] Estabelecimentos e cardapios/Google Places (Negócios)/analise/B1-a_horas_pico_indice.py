"""
Bloco B1 - horas de pico equivalentes pelo índice "Horários de pico" do Google
Maps (premissas R05 e R15 do cap. 9; decisão do autor, 12/11/2026, que troca a
contagem de casas abertas por hora, B1-a_abertos_por_hora.py, por uma medida
de movimento).

Curva dos concorrentes: em cada dia × hora, a média (e a mediana) do índice
das casas com coleta "ok" que estão abertas nessa hora pelo horário publicado
(meio da faixa, h:30, dentro do horário; o índice é 0-100, 100 = hora mais
cheia da semana da casa). A casa fechada fica fora da média da hora, porque o
plano está aberto nela.

Referência: o valor da curva nas janelas das visitas do B3 (noites de sexta e
sábado), ponderado pela sobreposição de cada janela com cada faixa, média das
quatro visitas. As horas de pico equivalentes de um dia são a soma da curva
nas horas abertas ÷ referência: quantas horas com o movimento das visitas o
dia contém. A mesma conta vale para o dia útil, que deixa de precisar da razão
de gasto com cartão (antiga R05) e do ajuste do horário (antiga R19). Com o
horário da São Jogue, os sete dias da semana convertem as NFC-e por dia em
circulação no pico (R04 pessimista).

Entradas: dados/B1_estabelecimentos/_dados-agregados/B1_horarios_pico_concorrentes_horas.csv
          (B1-a_horarios_pico.py); B1_resumo_estabelecimentos.xlsx (horários);
          dados/B3_contagem/_dados-agregados/contagem_resumo_visitas.csv
Saídas em dados/B1_estabelecimentos/_dados-agregados/:
  B1_curva_pico_concorrentes.csv  dia × hora: média, mediana e casas abertas
  B1_horas_pico_indice.csv        referência e horas de pico equivalentes por
                                  dia, no horário do plano e no da São Jogue,
                                  pela curva média e pela mediana

Uso:
    python3 "_src/[B1] Estabelecimentos e cardapios/Google Places (Negócios)/analise/B1-a_horas_pico_indice.py"
"""
# Caminhos: _src/extras/ (log comum); log em ../logs/
import sys
from pathlib import Path
_AQUI = Path(__file__).resolve()
sys.path[:0] = [str(_AQUI.parents[3] / "extras")]
from log_execucao import registrar_execucao  # noqa: E402
if __name__ == "__main__":
    registrar_execucao(__file__)

import pandas as pd

ROOT = Path(__file__).resolve().parents[4]
PASTA = ROOT / "dados" / "B1_estabelecimentos" / "_dados-agregados"
VISITAS = ROOT / "dados" / "B3_contagem" / "_dados-agregados" / "contagem_resumo_visitas.csv"
DIAS = ["segunda", "terca", "quarta", "quinta", "sexta", "sabado", "domingo"]
# horário do plano (P7 de _instrucoes/1a_principios.md): [abre, fecha); domingo só na etapa de mesas
PLANO = {"terca": (14, 23), "quarta": (14, 23), "quinta": (14, 23), "sexta": (14, 23),
         "sabado": (14, 23), "domingo": (14, 20)}


def intervalos(texto):
    if pd.isna(texto):
        return []
    out = []
    for parte in str(texto).split("|"):
        a, b = parte.strip().split("-")
        ha, hb = int(a[:2]) + int(a[3:]) / 60, int(b[:2]) + int(b[3:]) / 60
        out.append((ha, hb + 24 if hb <= ha else hb))
    return out


def aberta(texto, h):
    return any(a <= h + 0.5 < b for a, b in intervalos(texto))


def main():
    es = pd.read_excel(PASTA / "B1_resumo_estabelecimentos.xlsx", sheet_name="estabelecimentos").set_index("place_id")
    d = pd.read_csv(PASTA / "B1_horarios_pico_concorrentes_horas.csv", sep=";", encoding="utf-8-sig")
    d["hora"] = d["hora"].astype(int)
    d["aberta"] = [aberta(es.at[p, dia], h) for p, dia, h in zip(d["place_id"], d["dia_semana"], d["hora"])]
    ab = d[d["aberta"]]
    g = ab.groupby(["dia_semana", "hora"])["ocupacao_relativa"]
    curva = pd.DataFrame({"media": g.mean(), "mediana": g.median(), "casas_abertas": g.size()}).reset_index()
    curva = curva.rename(columns={"dia_semana": "dia"})
    curva["dia"] = pd.Categorical(curva["dia"], DIAS, ordered=True)
    curva = curva.sort_values(["dia", "hora"])
    curva.to_csv(PASTA / "B1_curva_pico_concorrentes.csv", sep=";", index=False, encoding="utf-8-sig")

    vis = pd.read_csv(VISITAS, sep=";", encoding="utf-8-sig")
    vis = vis[vis["observador"] != "media"]
    sj = es[es["nome"].str.startswith("São Jogue")].iloc[0]
    sao_jogue = {}
    for dia in DIAS:
        (a, b), = intervalos(sj[dia])
        sao_jogue[dia] = (int(a), int(b))
    linhas = []
    for est in ("media", "mediana"):
        c = curva.pivot(index="hora", columns="dia", values=est).reindex(range(24)).fillna(0.0)
        refs = []
        for _, v in vis.iterrows():
            ini = pd.Timestamp(v["visita_inicio"])
            dia, a = DIAS[ini.dayofweek], ini.hour + ini.minute / 60
            b = a + v["horas_observadas"]
            peso = {h: max(0.0, min(b, h + 1) - max(a, h)) for h in range(24)}
            refs.append(sum(c.loc[h, dia] * w for h, w in peso.items()) / sum(peso.values()))
        ref = sum(refs) / len(refs)
        print(f"curva {est}: referência {ref:.2f} (visitas: {', '.join(f'{x:.1f}' for x in refs)})")
        for casa, horario in (("plano", PLANO), ("São Jogue", sao_jogue)):
            for dia, (a, b) in horario.items():
                linhas.append(dict(curva=est, casa=casa, dia=dia, abre=a, fecha=b, referencia=round(ref, 4),
                                   horas_pico_equivalentes=round(sum(c.loc[h, dia] for h in range(a, min(b, 24))) / ref, 4)))
    eq = pd.DataFrame(linhas)
    eq.to_csv(PASTA / "B1_horas_pico_indice.csv", sep=";", index=False, encoding="utf-8-sig")
    print(f"{ab['place_id'].nunique()} casas com índice; menor número de casas abertas numa hora do plano: "
          f"{int(curva[curva['dia'].isin(list(PLANO)) & curva['hora'].between(14, 22)]['casas_abertas'].min())}")
    for est in ("media", "mediana"):
        p = eq[(eq["curva"] == est) & (eq["casa"] == "plano")].set_index("dia")["horas_pico_equivalentes"]
        fds, du = p[["sexta", "sabado"]].mean(), p[["terca", "quarta", "quinta"]].mean()
        s = eq[(eq["curva"] == est) & (eq["casa"] == "São Jogue")]["horas_pico_equivalentes"].sum()
        print(f"{est}: plano {p.round(2).to_dict()} | fim de semana {fds:.2f}, dia útil {du:.2f} ({du / fds:.1%})"
              f" | São Jogue, semana {s:.2f}")


if __name__ == "__main__":
    main()
