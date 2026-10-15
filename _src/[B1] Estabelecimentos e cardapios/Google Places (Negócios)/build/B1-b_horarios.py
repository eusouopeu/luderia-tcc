"""
Bloco B1 - tabela dos horários de funcionamento das luderias do estudo.

Entrada: _dados-brutos/estabelecimentos/B1_horarios.jsonl (B1-c_details.py
--horarios, campo regularOpeningHours da Places API). Objeto: as aprovadas da
triagem manual, menos as que saíram do objeto (EXCLUIDAS), mais as luderias
novas do acervo de jogos. Cada place_id ocupa uma linha.

Saída: dados/[B1] Estabelecimentos e cardapios/estabelecimentos/B1_horarios.csv
(";" e UTF-8 com BOM), com
  - uma coluna por dia (segunda a domingo) no formato "16:00-00:00"; turnos
    do mesmo dia separados por " | "; vazio = fechado;
  - dias_abertos (0 a 7) e horas_semana (soma dos turnos; turno que passa da
    meia-noite conta inteiro no dia em que abre);
  - abre_cedo e fecha_tarde: menor horário de abertura e maior de fechamento
    da semana (fechamento depois da meia-noite vira 24 + h, ex.: 25:00);
  - situacao: "ok", "sem horário no Google" ou "24 horas".
O dia de um turno é o dia da abertura (convenção do Google: 0 = domingo).

Uso:
    python3 "_src/[B1] Estabelecimentos e cardapios/Google Places (Negócios)/build/B1-b_horarios.py"
"""
# Caminhos: _src/extras/ (log comum) e outros/ do objeto (auxiliares); log em ../logs/
import sys
from pathlib import Path
_AQUI = Path(__file__).resolve()
sys.path[:0] = [str(_AQUI.parents[3] / "extras"), str(_AQUI.parents[1] / "outros")]
from log_execucao import registrar_execucao  # noqa: E402
if __name__ == "__main__":
    registrar_execucao(__file__)

import json

import pandas as pd

ROOT = _AQUI.parents[4]
PROCESSED = ROOT / "dados" / "[B1] Estabelecimentos e cardapios"
BRUTO = PROCESSED / "_dados-brutos" / "estabelecimentos" / "B1_horarios.jsonl"
APROVADAS = PROCESSED / "estabelecimentos/3_triagem/B1_aprovadas_metro_av100.xlsx"
NOVAS = PROCESSED / "acervo_jogos/B1_acervodejogos_luderias_novas.csv"
SAIDA = PROCESSED / "estabelecimentos/B1_horarios.csv"

# Saíram do objeto em 14/10/2026 (docs/decisoes.md).
EXCLUIDAS = {"Machado Games", "Ilusões Industriais"}
# Ordem de exibição; índice do Google: 0 = domingo.
DIAS = [(1, "segunda"), (2, "terca"), (3, "quarta"), (4, "quinta"), (5, "sexta"), (6, "sabado"), (0, "domingo")]


def casas():
    aprov = pd.read_excel(APROVADAS)[["place_id", "nome", "capital_endereco"]]
    aprov = aprov[~aprov["nome"].isin(EXCLUIDAS)]
    novas = pd.read_csv(NOVAS)[["place_id", "nome", "capital_endereco"]]
    return pd.concat([aprov, novas]).drop_duplicates("place_id")


def hhmm(minutos):
    return f"{minutos // 60:02d}:{minutos % 60:02d}"


def linha(registro):
    periodos = (registro.get("regularOpeningHours") or {}).get("periods") or []
    out = {f"{nome}": "" for _, nome in DIAS}
    if not periodos:
        return {**out, "dias_abertos": 0, "horas_semana": None, "abre_cedo": "", "fecha_tarde": "",
                "situacao": "sem horário no Google"}
    # Aberto 24 h: um período só, sem "close".
    if len(periodos) == 1 and "close" not in periodos[0]:
        return {**{n: "00:00-24:00" for _, n in DIAS}, "dias_abertos": 7, "horas_semana": 168.0,
                "abre_cedo": "00:00", "fecha_tarde": "24:00", "situacao": "24 horas"}
    turnos = {d: [] for d, _ in DIAS}
    total = 0
    aberturas, fechamentos = [], []
    for p in periodos:
        a, f = p["open"], p["close"]
        ini = a["hour"] * 60 + a.get("minute", 0)
        fim = f["hour"] * 60 + f.get("minute", 0)
        fim_rel = fim + ((f["day"] - a["day"]) % 7) * 24 * 60
        total += fim_rel - ini
        turnos[a["day"]].append(f"{hhmm(ini)}-{hhmm(fim)}")
        aberturas.append(ini)
        fechamentos.append(fim_rel)
    for d, nome in DIAS:
        out[nome] = " | ".join(turnos[d])
    return {**out, "dias_abertos": sum(1 for d, _ in DIAS if turnos[d]), "horas_semana": round(total / 60, 1),
            "abre_cedo": hhmm(min(aberturas)), "fecha_tarde": hhmm(max(fechamentos)), "situacao": "ok"}


def main():
    brutos = {}
    with open(BRUTO, encoding="utf-8") as f:
        for texto in f:
            if texto.strip():
                r = json.loads(texto)
                brutos[r["id"]] = r
    base = casas()
    linhas = []
    for c in base.itertuples():
        r = brutos.get(c.place_id)
        dados = linha(r) if r else {"situacao": "não coletado"}
        linhas.append({"place_id": c.place_id, "nome": c.nome, "capital_endereco": c.capital_endereco,
                       **dados, "data_coleta": (r or {}).get("data_coleta", "")})
    df = pd.DataFrame(linhas)
    df.to_csv(SAIDA, sep=";", index=False, encoding="utf-8-sig")

    contagem = df["situacao"].value_counts()
    print(contagem.to_string())
    print(f"soma: {contagem.sum()} | casas: {len(df)} | diferença: {len(df) - contagem.sum()}")
    print(f"{SAIDA.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
