"""
Bloco B1 - histograma "Horários de pico" do Google Maps dos concorrentes:
razão entre o movimento do dia útil e o do fim de semana, por casa, e a lista
das casas do B1 ainda sem coleta.

Entrada:
  - dados/B1_estabelecimentos/_dados-brutos/horarios_pico/maps_horarios_pico_*.csv
    (webscripts/maps_horarios_pico.user.js; vale o arquivo mais recente);
  - dados/B1_estabelecimentos/_dados-agregados/B1_horarios.csv (horário da Places API, 54 casas);
  - dados/B1_estabelecimentos/_dados-brutos/B1_localizacoes.jsonl (coordenadas).

Correção do dia nas coletas até a versão 2026.11.10-1 do coletor: numa casa
fechada em algum dia, o coletor numerava só os grupos com barras, e os dias
seguintes saíam deslocados (dia_inferido = "sim"). Os grupos vêm na ordem do
Maps, domingo primeiro, e o dia fechado não tem grupo. O script reatribui o
i-ésimo grupo ao i-ésimo dia aberto da casa no B1_horarios.csv e só aceita a
correção se (a) o número de grupos for igual ao de dias abertos e (b) as horas
com movimento caírem no horário publicado, com 1 hora de folga, em pelo menos
90% das barras. Casa que falha fica fora das médias, com o motivo.

Casamento coleta × B1: a casa da coleta mais próxima (até 300 m) de cada
place_id do B1. Cada casa da coleta casa com uma só do B1.

Medidas, por casa (índice do Google, 0-100, 100 = hora mais cheia da semana):
  - movimento do dia = soma do índice nas horas do dia ÷ 100 (horas
    equivalentes à hora mais cheia);
  - dia útil = média dos dias abertos de terça a quinta; fim de semana = média
    dos dias abertos de sexta a domingo (como na R05);
  - razao_util_fds = dia útil ÷ fim de semana.
O índice mede presença (pessoas no local × tempo), não entradas nem gasto, e
casas em shopping recebem o movimento do entorno (ver L23 em docs/pendencias.md).

Saídas (dados/B1_estabelecimentos/_dados-agregados/):
  - B1_horarios_pico_concorrentes.csv: uma linha por casa do B1, com a
    situação da coleta no vocabulário único (_src/dicionario.md §4.5): ok;
    vazia (lugar coletado sem gráfico de horários de pico no Maps); refazer
    (coleta que falhou, dia não corrigido ou horas fora do horário publicado);
    coletar (sem registro), e as medidas;
  - B1_horarios_pico_concorrentes_horas.csv: uma linha por casa × dia × hora,
    com o dia já corrigido.

Uso:
    python3 "_src/PyScripts/B1_Estabelecimentos/3_analise/B1-a_horarios_pico.py"
"""
# Caminhos: _src/extras/ (log comum); log em ../logs/
import sys
from pathlib import Path
_AQUI = Path(__file__).resolve()
sys.path[:0] = [*map(str, (_AQUI.parents[3] / "Extras").glob("G[0-9]_*"))]
from log_execucao import registrar_execucao  # noqa: E402
if __name__ == "__main__":
    registrar_execucao(__file__)

import json
import math
import re

import pandas as pd

ROOT = _AQUI.parents[4]
BRUTOS = ROOT / "dados" / "B1_estabelecimentos" / "_dados-brutos"
HORARIOS = ROOT / "dados" / "B1_estabelecimentos" / "_dados-agregados" / "B1_horarios.csv"
LOCAL = BRUTOS / "B1_localizacoes.jsonl"
SAIDA = ROOT / "dados" / "B1_estabelecimentos" / "_dados-agregados" / "B1_horarios_pico_concorrentes.csv"
SAIDA_HORAS = ROOT / "dados" / "B1_estabelecimentos" / "_dados-agregados" / "B1_horarios_pico_concorrentes_horas.csv"

# Índice do Google: 0 = domingo.
DIAS = ["domingo", "segunda", "terca", "quarta", "quinta", "sexta", "sabado"]
UTIL = ["terca", "quarta", "quinta"]
FDS = ["sexta", "sabado", "domingo"]
RAIO_M = 300
MIN_DENTRO = 0.90


def sem_acento(t):
    return str(t).replace("ç", "c").replace("á", "a")


def distancia_m(a, b):
    (la1, lo1), (la2, lo2) = a, b
    x = math.radians(lo2 - lo1) * math.cos(math.radians((la1 + la2) / 2))
    y = math.radians(la2 - la1)
    return 6_371_000 * math.hypot(x, y)


def turnos(celula):
    """'16:00-23:00 | 01:00-02:00' → [(16, 23), ...]; fechamento depois da meia-noite vira 24 + h."""
    if pd.isna(celula) or not str(celula).strip():
        return []
    out = []
    for t in str(celula).split("|"):
        a, b = t.strip().split("-")
        ha, hb = int(a[:2]), int(b[:2]) + (1 if b[3:5] not in ("00", "") else 0)
        out.append((ha, hb if hb > ha else hb + 24))
    return out


def dentro(hora, ts):
    return any(a - 1 <= hora <= b or a - 1 <= hora + 24 <= b for a, b in ts)


def main():
    # Junta todas as exportações (cada uma é o estado do navegador naquela hora)
    # e fica, por lugar, com a coleta mais recente. Junta todas porque o coletor
    # até a versão 2026.11.11-1 podia apagar uma casa ao gravar outra.
    arqs = sorted((BRUTOS / "horarios_pico").glob("maps_horarios_pico_*.csv"))
    col = pd.concat([pd.read_csv(a, sep=";", encoding="utf-8-sig", dtype={"dia_inferido": str}).assign(arquivo=a.name)
                     for a in arqs], ignore_index=True)
    col["dia_semana"] = col["dia_semana"].map(sem_acento)
    # Até a versão 2026.11.10-1, o coletor pegava o primeiro lugar da URL; quem
    # abriu um lugar a partir de outro ficou com o código e a coordenada do
    # anterior. O lugar aberto é o último da URL.
    def ultimo(padrao, url):
        achados = re.findall(padrao, str(url))
        return achados[-1] if achados else None
    cid = col["url"].map(lambda u: ultimo(r"!1s(0x[0-9a-f]+:0x[0-9a-f]+)", u))
    coord = col["url"].map(lambda u: ultimo(r"!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)", u))
    col["id_maps"] = cid.fillna(col["id_maps"])
    col["lat"] = [float(c[0]) if c else v for c, v in zip(coord, col["lat"])]
    col["lng"] = [float(c[1]) if c else v for c, v in zip(coord, col["lng"])]
    recente = col.groupby("id_maps")["coletado_em"].transform("max")
    col = col[col["coletado_em"] == recente].drop_duplicates(["id_maps", "dia_semana", "hora", "coletado_em"])
    print(f"Coletas: {len(arqs)} arquivo(s), {col['id_maps'].nunique()} lugares, {len(col)} linhas")

    b1 = pd.read_csv(HORARIOS, sep=";", encoding="utf-8-sig")
    loc = {}
    for linha in LOCAL.open(encoding="utf-8"):
        r = json.loads(linha)
        loc[r["id"]] = (r["location"]["latitude"], r["location"]["longitude"])

    # Casamento por coordenada: a casa da coleta mais próxima de cada place_id.
    casas = col.groupby("id_maps", dropna=False).agg(nome_maps=("nome", "first"), lat=("lat", "first"), lng=("lng", "first")).reset_index()
    pares = []
    for _, c in casas.iterrows():
        if pd.isna(c["lat"]):
            continue
        d, pid = min((distancia_m((c["lat"], c["lng"]), loc[p]), p) for p in b1["place_id"])
        if d <= RAIO_M:
            pares.append((pid, c["id_maps"], round(d)))
    casou = pd.DataFrame(pares, columns=["place_id", "id_maps", "distancia_m"])
    if casou["place_id"].duplicated().any() or casou["id_maps"].duplicated().any():
        raise SystemExit(f"Casamento ambíguo:\n{casou[casou.duplicated('place_id', keep=False)]}")
    fora = casas[~casas["id_maps"].isin(casou["id_maps"])]

    linhas, horas = [], []
    for _, casa in b1.iterrows():
        reg = {"place_id": casa["place_id"], "nome": casa["nome"], "capital": casa["capital_endereco"]}
        par = casou[casou["place_id"] == casa["place_id"]]
        if par.empty:
            linhas.append(reg | {"situacao": "coletar"})
            continue
        idm = par["id_maps"].iloc[0]
        c = col[col["id_maps"] == idm].copy()
        reg |= {"nome_maps": c["nome"].iloc[0], "distancia_m": par["distancia_m"].iloc[0], "coletado_em": c["coletado_em"].iloc[0]}
        if (c["situacao"] != "ok").all():
            # Lugar sem gráfico de "Horários de pico" no Maps: coleta feita, sem resultado.
            msg = str(c["situacao"].iloc[0])
            vazia = "sem horários de pico" in msg.lower()
            linhas.append(reg | {"situacao": f"vazia: {msg}" if vazia else f"refazer: {msg}"})
            continue
        c = c[c["ocupacao_relativa"].notna()]
        abertos = [d for d in DIAS if turnos(casa[d])]
        if c["dia_inferido"].eq("sim").any():
            ordem = sorted(c["ordem_dia"].unique())
            if len(ordem) != len(abertos):
                linhas.append(reg | {"situacao": f"refazer: dia não corrigido: {len(ordem)} grupos × {len(abertos)} dias abertos no B1"})
                continue
            c["dia_semana"] = c["ordem_dia"].map(dict(zip(ordem, abertos)))
            reg["dia_corrigido"] = "sim"
        pos = c[c["ocupacao_relativa"] > 0]
        ok = pos.apply(lambda r: dentro(r["hora"], turnos(casa[r["dia_semana"]])), axis=1)
        reg["barras_no_horario"] = round(ok.mean(), 3) if len(ok) else float("nan")
        if len(ok) and ok.mean() < MIN_DENTRO:
            linhas.append(reg | {"situacao": f"refazer: horas fora do horário publicado ({ok.mean():.0%} dentro)"})
            continue
        soma = c.groupby("dia_semana")["ocupacao_relativa"].sum() / 100
        soma = soma[soma > 0]
        u, f = soma.reindex(UTIL).dropna(), soma.reindex(FDS).dropna()
        pico = c.loc[c["ocupacao_relativa"].idxmax()]
        reg |= {
            "situacao": "ok", "dias_com_movimento": len(soma),
            "dia_util": round(u.mean(), 3) if len(u) else float("nan"),
            "fim_de_semana": round(f.mean(), 3) if len(f) else float("nan"),
            "dia_mais_cheio": soma.idxmax(), "hora_mais_cheia": f"{pico['dia_semana']} {int(pico['hora'])}h",
        }
        reg["razao_util_fds"] = round(reg["dia_util"] / reg["fim_de_semana"], 4) if len(u) and len(f) else float("nan")
        linhas.append(reg)
        horas.append(c.assign(place_id=casa["place_id"], nome_b1=casa["nome"])[["place_id", "nome_b1", "dia_semana", "hora", "ocupacao_relativa"]])

    res = pd.DataFrame(linhas)
    assert len(res) == len(b1) and res["place_id"].is_unique, "o resumo precisa de uma linha por casa do B1"
    res.to_csv(SAIDA, sep=";", index=False, encoding="utf-8-sig")
    if horas:
        pd.concat(horas).to_csv(SAIDA_HORAS, sep=";", index=False, encoding="utf-8-sig")

    print(res["situacao"].str.split(":").str[0].value_counts().to_string())
    ok = res[res["situacao"] == "ok"]
    r = ok["razao_util_fds"].dropna()
    sem_sj = ok.loc[~ok["nome"].str.contains("São Jogue"), "razao_util_fds"].dropna()
    print(f"Razão dia útil ÷ fim de semana: média {r.mean():.1%}, mediana {r.median():.1%} (n = {len(r)}); "
          f"sem a São Jogue, média {sem_sj.mean():.1%}, mediana {sem_sj.median():.1%} (n = {len(sem_sj)})")
    if len(fora):
        print("Na coleta, sem casa do B1 a até 300 m:", ", ".join(fora["nome_maps"]))
    print(f"Gravado: {SAIDA.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
