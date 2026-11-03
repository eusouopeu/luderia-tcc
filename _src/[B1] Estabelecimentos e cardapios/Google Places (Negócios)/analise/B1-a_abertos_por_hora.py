"""
Bloco B1 - concorrentes abertos em cada hora de cada dia da semana, para levar
a circulação medida no pico (B3) ao dia inteiro (premissa R15 do cap. 9).

Uma casa conta como aberta numa faixa de 1 h quando o meio da faixa (h:30) cai
num intervalo do horário do Google Maps; a madrugada conta no dia em que a
casa abriu. A referência é a média das casas abertas nas janelas das visitas
do B3, ponderada pela sobreposição de cada janela com cada faixa. As horas de
pico equivalentes de um dia são a soma, nas horas abertas do plano, das casas
abertas ÷ referência (decisão do autor, 02/11/2026). As mesmas horas, com o
horário da São Jogue, convertem as NFC-e por dia em circulação no pico (R04
pessimista).

Entradas: B1_resumo_estabelecimentos.xlsx (aba estabelecimentos);
          dados/[B3] Contagem direta de ocupacao/contagem_resumo_visitas.csv
Saídas em dados/[B1] Estabelecimentos e cardapios/estabelecimentos/:
  B1_abertos_por_hora.csv         casas abertas por faixa de hora (linhas) e dia (colunas)
  B1_horas_pico_equivalentes.csv  referência e horas de pico equivalentes por dia, no horário
                                  do plano (casa = plano) e no da São Jogue Bela Vista

Uso:
    python3 "_src/[B1] Estabelecimentos e cardapios/Google Places (Negócios)/analise/B1-a_abertos_por_hora.py"
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
PASTA = ROOT / "dados" / "[B1] Estabelecimentos e cardapios" / "estabelecimentos"
VISITAS = ROOT / "dados" / "[B3] Contagem direta de ocupacao" / "contagem_resumo_visitas.csv"
DIAS = ["segunda", "terca", "quarta", "quinta", "sexta", "sabado", "domingo"]
HORAS = range(0, 30)  # 24 a 29 = madrugada do dia seguinte
# horário do plano (P7 de _instrucoes/1a_principios.md): [abre, fecha)
PLANO = {"terca": (15, 23), "quarta": (15, 23), "quinta": (15, 23), "sexta": (15, 23),
         "sabado": (14, 22), "domingo": (14, 22)}


def intervalos(texto):
    if pd.isna(texto):
        return []
    out = []
    for parte in str(texto).split("|"):
        a, b = parte.strip().split("-")
        ha, hb = int(a[:2]) + int(a[3:]) / 60, int(b[:2]) + int(b[3:]) / 60
        out.append((ha, hb + 24 if hb <= ha else hb))
    return out


def main():
    es = pd.read_excel(PASTA / "B1_resumo_estabelecimentos.xlsx", sheet_name="estabelecimentos")
    tab = pd.DataFrame(0, index=list(HORAS), columns=DIAS)
    for _, r in es.iterrows():
        for d in DIAS:
            for a, b in intervalos(r[d]):
                for h in HORAS:
                    tab.loc[h, d] += a <= h + 0.5 < b
    tab.index.name = "hora"

    vis = pd.read_csv(VISITAS, sep=";", encoding="utf-8-sig")
    vis = vis[vis["observador"] != "media"]
    refs = []
    for _, v in vis.iterrows():
        ini = pd.Timestamp(v["visita_inicio"])
        d, a = DIAS[ini.dayofweek], ini.hour + ini.minute / 60
        b = a + v["horas_observadas"]
        peso = {h: max(0.0, min(b, h + 1) - max(a, h)) for h in HORAS}
        refs.append(sum(tab.loc[h, d] * w for h, w in peso.items()) / sum(peso.values()))
        print(f"{v['visita_id']} ({d}, {a:.2f} h a {b:.2f} h): {refs[-1]:.1f} casas abertas na janela")
    ref = sum(refs) / len(refs)
    # horário da São Jogue (B1, Bela Vista): converte as NFC-e por dia em circulação no pico
    sj = es[es["nome"].str.startswith("São Jogue")].iloc[0]
    sao_jogue = {}
    for d in ("sexta", "sabado", "domingo"):
        (a, b), = intervalos(sj[d])
        sao_jogue[d] = (int(a), int(b))
    eq = [dict(casa=casa, dia=d, abre=a, fecha=b, casas_abertas_referencia=round(ref, 4),
               horas_pico_equivalentes=round(sum(tab.loc[h, d] for h in range(a, b)) / ref, 4))
          for casa, horario in (("plano", PLANO), ("São Jogue", sao_jogue)) for d, (a, b) in horario.items()]
    tab.to_csv(PASTA / "B1_abertos_por_hora.csv", sep=";", encoding="utf-8-sig")
    pd.DataFrame(eq).to_csv(PASTA / "B1_horas_pico_equivalentes.csv", sep=";", index=False, encoding="utf-8-sig")
    print(f"{len(es)} casas; referência {ref:.2f} casas abertas")
    for casa in ("plano", "São Jogue"):
        fds = [e["horas_pico_equivalentes"] for e in eq if e["casa"] == casa and e["dia"] in ("sexta", "sabado", "domingo")]
        print(f"{casa}: " + ", ".join(f"{e['dia']} {e['horas_pico_equivalentes']:.2f}" for e in eq if e["casa"] == casa)
              + f" | média de sexta a domingo {sum(fds) / len(fds):.3f}")


if __name__ == "__main__":
    main()
