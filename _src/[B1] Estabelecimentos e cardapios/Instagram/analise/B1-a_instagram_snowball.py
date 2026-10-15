"""
Bloco B1 - snowball pelo Instagram: acerto da regra "conta seguida por k ou
mais luderias", casas novas achadas e estimativa de cobertura da lista do B1.

Pergunta que muda o plano: a lista de concorrentes do B1 (busca no Google
Maps) cobre o mercado? Quantas casas ficaram de fora? A resposta entra no
cap. 3 como limitação com número e, se houver casas novas em Salvador, no
cap. 5 (concorrência).

Entrada: saídas do B1-b_instagram_seguindo.py, com a coluna classe da lista
de candidatos preenchida à mão (classes em snowball_comum.CLASSES).

Medidas, para cada corte k (nº mínimo de sementes que seguem a conta):
  - precisão: entre os candidatos classificados com grau >= k, % que são
    luderia (casa de jogos ou loja com espaço de jogo), com IC 95% de Wilson;
  - sensibilidade: % das casas aprovadas no B1 seguidas por k ou mais
    sementes. As casas aprovadas são as próprias sementes, e uma semente não
    segue a si mesma: a conta é de "deixar uma de fora";
  - casas novas: luderias com grau >= k fora da lista aprovada.

Captura e recaptura (estimador de Chapman), para k >= CORTE_GRAVAR:
  população = luderias nas 14 metrópoles do B1 com mais de 100 avaliações no
  Google Maps (o recorte do B1);
  lista 1 = casas aprovadas no B1 (n1); lista 2 = luderias da população com
  grau >= k (n2); recaptura = aprovadas com grau >= k (m);
  N = (n1 + 1)(n2 + 1)/(m + 1) - 1; cobertura da lista 1 = m / n2.
  Hipóteses violadas, a declarar: a lista 2 nasce das sementes da lista 1
  (dependência positiva) e casas grandes têm mais chance de estar nas duas
  (heterogeneidade); as duas fazem N subestimar a população. Ler N como
  limite inferior. Só vale com todos os candidatos de grau >= k classificados.

Saídas em dados/[B1] Estabelecimentos e cardapios/redes_sociais/snowball/:
  B1_snowball_corte.csv               (k: contas, classificados, precisão, sensibilidade, novas)
  B1_snowball_novas.csv               (perfis de negócio ou grupo fora da lista aprovada; sem pessoas)
  B1_snowball_captura_recaptura.csv   (k: n1, n2, m, N de Chapman com IC 95%, cobertura)

Uso:
    python3 "_src/[B1] Estabelecimentos e cardapios/Instagram/analise/B1-a_instagram_snowball.py"
"""
# Caminhos: _src/extras/ (log comum) e outros/ do objeto (auxiliares); log em ../logs/
import sys
from pathlib import Path
_AQUI = Path(__file__).resolve()
sys.path[:0] = [str(_AQUI.parents[3] / "extras"), str(_AQUI.parents[1] / "outros")]
from log_execucao import registrar_execucao  # noqa: E402
if __name__ == "__main__":
    registrar_execucao(__file__)

import math

import pandas as pd

import snowball_comum as sc

CORTE_GRAVAR = 2  # o mesmo do B1-b_instagram_seguindo.py
K_MAX = 10
Z = 1.96


def wilson(k, n):
    if n == 0:
        return float("nan"), float("nan")
    p = k / n
    centro = (p + Z**2 / (2 * n)) / (1 + Z**2 / n)
    meia = Z * math.sqrt(p * (1 - p) / n + Z**2 / (4 * n**2)) / (1 + Z**2 / n)
    return round(100 * (centro - meia), 1), round(100 * (centro + meia), 1)


def chapman(n1, n2, m):
    n = (n1 + 1) * (n2 + 1) / (m + 1) - 1
    var = (n1 + 1) * (n2 + 1) * (n1 - m) * (n2 - m) / ((m + 1) ** 2 * (m + 2))
    minimo = n1 + n2 - m  # casas distintas já vistas
    return round(n, 1), round(max(minimo, n - Z * math.sqrt(var)), 1), round(n + Z * math.sqrt(var), 1)


def elegivel(c):
    """Luderia do recorte do B1: classe, metrópole e mais de 100 avaliações."""
    av = pd.to_numeric(c["avaliacoes_maps"], errors="coerce")
    return c["classe"].isin(sc.LUDERIA) & c["metropole"].isin(sc.METROPOLES) & (av > sc.LIMIAR_AVALIACOES)


def main():
    cand = pd.read_csv(sc.CANDIDATOS, sep=";", dtype=str).fillna("")
    cand["n_sementes"] = cand["n_sementes"].astype(int)
    invalidas = set(cand["classe"]) - set(sc.CLASSES) - {""}
    assert not invalidas, f"classes fora da lista: {invalidas}"
    grau = pd.read_csv(sc.SAIDA / "B1_snowball_grau.csv", sep=";")
    grau.columns = ["n_sementes", "contas"]
    apr = pd.read_csv(sc.SAIDA / "B1_snowball_grau_aprovadas.csv", sep=";")
    n_sementes = len(pd.read_csv(sc.SAIDA / "B1_snowball_sementes.csv", sep=";"))
    n1 = len(apr)
    print(f"sementes: {n_sementes} | casas aprovadas: {n1} | candidatos: {len(cand)} | "
          f"classificados: {(cand['classe'] != '').sum()}")

    cand["luderia"] = cand["classe"].isin(sc.LUDERIA)
    cand["aprovada"] = cand["situacao"] == "aprovada no B1"
    cand["elegivel"] = elegivel(cand)

    linhas, cr = [], []
    for k in range(1, min(K_MAX, n_sementes) + 1):
        sub = cand[cand["n_sementes"] >= k]
        clas = sub[sub["classe"] != ""]
        lud = int(clas["luderia"].sum())
        lo, hi = wilson(lud, len(clas))
        sens = int((apr["n_sementes"] >= k).sum())
        slo, shi = wilson(sens, n1)
        gravado = k >= CORTE_GRAVAR
        linhas.append({
            "k (seguida por k ou mais sementes)": k,
            "contas": int(grau.loc[grau["n_sementes"] >= k, "contas"].sum()),
            "candidatos classificados": len(clas) if gravado else "",
            "% classificados": round(100 * len(clas) / len(sub), 1) if gravado and len(sub) else "",
            "luderias entre os classificados": lud if gravado else "",
            "precisão (%)": round(100 * lud / len(clas), 1) if gravado and len(clas) else "",
            "precisão IC 95% Wilson (%)": f"{lo} a {hi}" if gravado and len(clas) else "",
            "aprovadas com grau >= k": sens,
            "sensibilidade (%)": round(100 * sens / n1, 1),
            "sensibilidade IC 95% Wilson (%)": f"{slo} a {shi}",
            "luderias novas (fora da lista aprovada)": int((clas["luderia"] & ~clas["aprovada"]).sum()) if gravado else "",
        })
        if gravado:
            m = sens
            novas_eleg = int((sub["elegivel"] & ~sub["aprovada"]).sum())
            n2 = m + novas_eleg
            completo = len(sub) == len(clas)
            n, nlo, nhi = chapman(n1, n2, m) if m else (float("nan"),) * 3
            cr.append({
                "k": k, "n1 (aprovadas no B1)": n1, "n2 (luderias do recorte achadas pela rede)": n2,
                "m (aprovadas achadas pela rede)": m, "novas do recorte": novas_eleg,
                "N de Chapman (limite inferior)": n, "IC 95% de N": f"{nlo} a {nhi}",
                "cobertura da lista do B1 (m/n2, %)": round(100 * m / n2, 1) if n2 else "",
                "candidatos todos classificados": "sim" if completo else "não",
            })

    corte = pd.DataFrame(linhas)
    corte.to_csv(sc.SAIDA / "B1_snowball_corte.csv", sep=";", index=False)
    print("\n" + corte.to_string(index=False))

    crr = pd.DataFrame(cr)
    crr.to_csv(sc.SAIDA / "B1_snowball_captura_recaptura.csv", sep=";", index=False)
    if len(crr):
        print("\n" + crr.to_string(index=False))
        if (crr["candidatos todos classificados"] == "não").any():
            print("\natenção: há candidatos sem classe; N e cobertura desses cortes não valem ainda.")

    # Só perfis de negócio ou grupo, nunca pessoas.
    novas = cand[cand["classe"].isin(sc.PUBLICAVEIS) & ~cand["aprovada"]]
    cols = ["seguido", "nome", "classe", "metropole", "avaliacoes_maps", "n_sementes", "situacao", "eh_semente"]
    novas = novas.assign(**{"no recorte do B1": novas["elegivel"].map({True: "sim", False: "não"})})[cols + ["no recorte do B1"]]
    novas.to_csv(sc.SAIDA / "B1_snowball_novas.csv", sep=";", index=False)
    proximas = novas[novas["classe"].isin(sc.LUDERIA) & (novas["eh_semente"] != "sim")]
    print(f"\nperfis de negócio fora da lista aprovada: {len(novas)} | luderias novas ainda sem lista coletada "
          f"(sementes da próxima onda): {len(proximas)}")
    if len(proximas):
        print(", ".join("@" + s for s in proximas["seguido"]))


if __name__ == "__main__":
    main()
