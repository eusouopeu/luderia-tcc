"""
Bloco B1 - histograma "Horários de pico" do Google Maps da São Jogue, lido dos
prints (um por dia da semana).

Por que dos prints: o Maps só mostra o gráfico com a conta Google conectada, e
o coletor (webscripts/maps_horarios_pico.user.js) depende do HTML da página,
que muda sem aviso. O print guarda a prova do que foi lido.

Entrada: dados/B1_estabelecimentos/_dados-brutos/horarios_pico/prints_sao_jogue/
  AAAA-MM-DD_sao_jogue_horarios_pico_<dia>.png, print do gráfico de um dia,
  capturado no navegador (escala 1:1, tema claro).

Método (leitura por pixel, sem ajuste manual):
  1. Base do gráfico: a linha cinza contínua (#CCCCCC) abaixo das barras.
  2. Barras: colunas com a cor das barras (#5F8C99; a barra da hora atual,
     #376F7F, também conta). Cada barra tem 19 px e 1 px branco de separação,
     e a altura é a distância da base ao topo da barra.
  3. Hora de cada barra: o centro dos rótulos 06, 09, 12, 15, 18 e 21 marca o
     início da hora; a reta rótulo × posição dá a hora da borda esquerda de cada
     barra. O script confere que a borda cai a menos de 0,2 h de uma hora
     inteira e que as horas lidas batem com o horário de funcionamento
     publicado no Maps (HORARIO).
  4. Índice: o Google normaliza o gráfico de cada lugar pela hora mais cheia da
     semana (=100), na mesma escala para todos os dias. O script repete isso:
     altura / maior altura da semana × 100. A leitura tem erro de ±1 px, cerca
     de ±1,3 ponto do índice.

Validação (10/11/2026): o coletor corrigido leu os rótulos do Maps ("Movimento
às 13:00: 39%.") da mesma página; os 68 pares dia × hora batem com a leitura
dos prints, com diferença máxima de 0,7 ponto e média de -0,1.

O índice é relativo (forma da curva), não pessoas. Serve para a razão entre
dias e para as horas de pico equivalentes; a escala em pessoas vem do B3.

Saídas (dados/B1_estabelecimentos/_dados-agregados/):
  - B1_horarios_pico_sao_jogue.csv: uma linha por dia × hora aberta, com
    altura_px, base_px (altura da linha tracejada) e indice_semana (0-100);
  - B1_horarios_pico_sao_jogue_resumo.csv: por dia, soma do índice (volume do
    dia, em horas da hora mais cheia), hora de pico e grupo (dia útil = terça a
    quinta; fim de semana = sexta a domingo, como em R05), mais as razões entre
    grupos no dia inteiro e no horário do plano.

Uso:
    python3 "_src/[B1] Estabelecimentos e cardapios/Google Places (Negócios)/build/B1-b_horarios_pico_prints.py"
"""
# Caminhos: _src/extras/ (log comum); log em ../logs/
import sys
from pathlib import Path
_AQUI = Path(__file__).resolve()
sys.path[:0] = [str(_AQUI.parents[3] / "extras")]
from log_execucao import registrar_execucao  # noqa: E402
if __name__ == "__main__":
    registrar_execucao(__file__)

import numpy as np
import pandas as pd
from PIL import Image

ROOT = _AQUI.parents[4]
PRINTS = ROOT / "dados" / "B1_estabelecimentos" / "_dados-brutos" / "horarios_pico" / "prints_sao_jogue"
SAIDA = ROOT / "dados" / "B1_estabelecimentos" / "_dados-agregados" / "B1_horarios_pico_sao_jogue.csv"
SAIDA_RESUMO = ROOT / "dados" / "B1_estabelecimentos" / "_dados-agregados" / "B1_horarios_pico_sao_jogue_resumo.csv"

DIAS = ["segunda", "terca", "quarta", "quinta", "sexta", "sabado", "domingo"]
GRUPO = {"terca": "dia util", "quarta": "dia util", "quinta": "dia util",
         "sexta": "fim de semana", "sabado": "fim de semana", "domingo": "fim de semana",
         "segunda": "fechado no plano"}
# Horário da São Jogue no Google Maps, consultado em 10/11/2026: [abre, fecha).
HORARIO = {d: (12, 22) for d in DIAS} | {"domingo": (13, 21)}
# Horário do plano (seção 7.1): terça a sábado 14h-23h, domingo 14h-20h.
PLANO = {"terca": (14, 23), "quarta": (14, 23), "quinta": (14, 23), "sexta": (14, 23),
         "sabado": (14, 23), "domingo": (14, 20)}
ROTULOS = [6, 9, 12, 15, 18, 21]

COR_BARRA = [(95, 140, 153), (55, 111, 127)]
COR_BASE = (204, 204, 204)


def ler_print(caminho):
    px = np.asarray(Image.open(caminho).convert("RGB")).astype(int)
    H, W, _ = px.shape
    barra = np.zeros((H, W), bool)
    for c in COR_BARRA:
        barra |= np.abs(px - np.array(c)).sum(axis=2) <= 30

    # 1. Base: linha com mais pixels #CCCCCC, abaixo do topo das barras.
    base_px = (np.abs(px - np.array(COR_BASE)).sum(axis=2) <= 6) | barra
    linhas_base = [y for y in range(H) if base_px[y].mean() > 0.6 and not barra[y + 1:y + 3].any()]
    if not linhas_base:
        raise ValueError(f"{caminho.name}: base do gráfico não encontrada")
    base = max(linhas_base)

    # Linha tracejada (referência do topo): cinza claro intermitente acima das barras.
    cinza = np.abs(px - np.array((192, 192, 192))).sum(axis=2) <= 6
    tracejadas = [y for y in range(base) if cinza[y].mean() > 0.3]
    tracejada = tracejadas[0] if tracejadas else None

    # 2. Barras: corridas de colunas com cor de barra logo acima da base.
    col = barra[base - 2]
    corridas, x = [], 0
    while x < W:
        if col[x]:
            x0 = x
            while x < W and col[x]:
                x += 1
            corridas.append((x0, x - 1))
        x += 1
    barras = []
    for x0, x1 in corridas:
        if x1 - x0 + 1 < 10:
            continue
        meio = slice(x0 + 2, x1 - 1)
        topos = [np.argmax(barra[:base, c]) for c in range(meio.start, meio.stop)]
        topo = int(np.median(topos))
        destaque = bool((np.abs(px[base - 2, x0:x1 + 1] - np.array(COR_BARRA[1])).sum(axis=1) <= 30).mean() > 0.5)
        barras.append({"x0": x0, "x1": x1, "altura_px": base - topo, "hora_atual_no_print": destaque})

    # 3. Rótulos do eixo: grupos de pixels escuros na faixa abaixo da base.
    faixa = px[base + 4:min(H, base + 30)].sum(axis=2) < 450
    cols = np.where(faixa.any(axis=0))[0]
    grupos = np.split(cols, np.where(np.diff(cols) > 6)[0] + 1)
    centros = [(g[0] + g[-1]) / 2 for g in grupos if len(g)]
    if len(centros) != len(ROTULOS):
        raise ValueError(f"{caminho.name}: {len(centros)} rótulos no eixo, esperados {len(ROTULOS)}")
    b, a = np.polyfit(ROTULOS, centros, 1)  # x = a + b * hora
    for br in barras:
        h = (br["x0"] - a) / b
        br["hora"] = int(round(h))
        br["desvio_hora"] = round(h - round(h), 3)
    return {"base_y": base, "tracejada_y": tracejada, "px_por_hora": b, "barras": barras}


def main():
    linhas, problemas = [], []
    for dia in DIAS:
        arqs = sorted(PRINTS.glob(f"*_horarios_pico_{dia}.png"))
        if not arqs:
            problemas.append(f"{dia}: sem print")
            continue
        arq = arqs[-1]  # o mais recente
        r = ler_print(arq)
        horas = [br["hora"] for br in r["barras"]]
        esperado = list(range(*HORARIO[dia]))
        if horas != esperado:
            problemas.append(f"{dia}: horas lidas {horas} ≠ horário publicado {esperado}")
        for br in r["barras"]:
            if abs(br["desvio_hora"]) > 0.2:
                problemas.append(f"{dia} {br['hora']}h: borda a {br['desvio_hora']} h de uma hora inteira")
            linhas.append({
                "dia_semana": dia, "grupo": GRUPO[dia], "hora": br["hora"],
                "altura_px": br["altura_px"],
                "base_px": (r["base_y"] - r["tracejada_y"]) if r["tracejada_y"] is not None else "",
                "hora_atual_no_print": "sim" if br["hora_atual_no_print"] else "",
                "px_por_hora": round(r["px_por_hora"], 2), "arquivo": arq.name,
            })
        print(f"{dia:8s} {len(r['barras'])} barras, {r['px_por_hora']:.2f} px/h, base y={r['base_y']}, tracejada y={r['tracejada_y']}")

    df = pd.DataFrame(linhas)
    escala = df["altura_px"].max()
    df["indice_semana"] = (df["altura_px"] / escala * 100).round(1)
    if df["base_px"].nunique() != 1:
        problemas.append(f"altura da linha tracejada varia entre prints: {sorted(df['base_px'].unique())}")

    # Resumo por dia: soma do índice (horas equivalentes à hora mais cheia).
    def soma(d, faixa):
        s = df[(df.dia_semana == d) & df.hora.between(faixa[0], faixa[1] - 1)]
        return s["indice_semana"].sum() / 100

    res = []
    for d in DIAS:
        s = df[df.dia_semana == d]
        if s.empty:
            continue
        pico = s.loc[s["indice_semana"].idxmax()]
        res.append({
            "dia_semana": d, "grupo": GRUPO[d], "horas_abertas": len(s),
            "horas_equivalentes_dia": round(soma(d, HORARIO[d]), 3),
            "horas_equivalentes_plano": round(soma(d, PLANO[d]), 3) if d in PLANO else "",
            "hora_pico": int(pico["hora"]), "indice_pico": pico["indice_semana"],
        })
    res = pd.DataFrame(res)

    # Conferência: a soma das linhas do resumo bate com o total do detalhe.
    dif = round(res["horas_equivalentes_dia"].sum() - df["indice_semana"].sum() / 100, 6)
    if abs(dif) > 1e-6:
        problemas.append(f"resumo não fecha com o detalhe (diferença {dif})")

    def razao(col):
        g = res[res.grupo != "fechado no plano"].groupby("grupo")[col].apply(lambda v: pd.to_numeric(v).mean())
        return g["dia util"] / g["fim de semana"]

    extra = pd.DataFrame([
        {"dia_semana": "razao dia util / fim de semana", "grupo": "",
         "horas_equivalentes_dia": round(razao("horas_equivalentes_dia"), 4),
         "horas_equivalentes_plano": round(razao("horas_equivalentes_plano"), 4)},
    ])
    SAIDA.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(SAIDA, sep=";", index=False, encoding="utf-8-sig")
    pd.concat([res, extra]).to_csv(SAIDA_RESUMO, sep=";", index=False, encoding="utf-8-sig")

    print(res.to_string(index=False))
    print(f"Razão dia útil / fim de semana: dia inteiro {razao('horas_equivalentes_dia'):.1%}; "
          f"horário do plano (até 22h, fim do gráfico) {razao('horas_equivalentes_plano'):.1%}")
    print(f"Conferência resumo × detalhe: diferença {dif}")
    if problemas:
        print("PROBLEMAS:\n  " + "\n  ".join(problemas))
        sys.exit(1)
    print(f"Gravado: {SAIDA.relative_to(ROOT)} e {SAIDA_RESUMO.name}")


if __name__ == "__main__":
    main()
