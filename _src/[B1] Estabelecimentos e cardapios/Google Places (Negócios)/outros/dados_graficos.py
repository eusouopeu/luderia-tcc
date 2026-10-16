"""
Base por casa usada pelos gráficos, pictogramas e cartogramas do B1.

Parte de `montar_dados()` do B1-a_estatistica_descritiva.py (mesmas regras:
cada place_id uma vez, na metrópole do endereço; Instagram de LudoCafé e
Dominaria vazio; couvert só onde se cobra) e troca a nota média e o volume de
avaliações pelos do CSV da curadoria (B1_curadoria_metro_f_av100.csv) e, para
as 5 casas novas, de B1_acervodejogos_luderias_novas.csv. A planilha anotada à
mão já gravou nota como data no Excel; o CSV não tem esse risco.
"""

from __future__ import annotations

import importlib.util
from pathlib import Path

import pandas as pd

_AQUI = Path(__file__).resolve()
ROOT = _AQUI.parents[4]
B1 = ROOT / "dados" / "[B1] Estabelecimentos e cardapios"
_ED = _AQUI.parents[1] / "analise" / "B1-a_estatistica_descritiva.py"


def _modulo_estatistica():
    spec = importlib.util.spec_from_file_location("b1_estatistica_descritiva", _ED)
    m = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(m)
    return m


def casas() -> pd.DataFrame:
    d = _modulo_estatistica().montar_dados()
    cur = pd.read_csv(B1 / "estabelecimentos/2_recorte/B1_curadoria_metro_f_av100.csv", sep=None, engine="python")
    nov = pd.read_csv(B1 / "acervo_jogos/B1_acervodejogos_luderias_novas.csv", sep=None, engine="python")
    ref = pd.concat([cur, nov])[["place_id", "avaliacao_media", "volume_avaliacoes"]].drop_duplicates("place_id")
    x = d.drop(columns=["avaliacao_media", "volume_avaliacoes"]).merge(ref, on="place_id", how="left")
    assert len(x) == len(d) and x.place_id.is_unique
    falta = x[x.avaliacao_media.isna()]
    assert falta.empty, f"sem nota no CSV da curadoria: {falta.nome.tolist()}"
    dif = (d.set_index("place_id").avaliacao_media - x.set_index("place_id").avaliacao_media).abs() > 1e-9
    if dif.any():
        print(f"  aviso: nota da planilha difere do CSV da curadoria em {int(dif.sum())} casas; vale o CSV")
    x["volume_avaliacoes"] = x.volume_avaliacoes.astype(int)
    x["nota_media"] = x.avaliacao_media
    return x


def abertas_por_faixa(passo_min: int = 30, ini_h: int = 8, fim_h: int = 27) -> pd.DataFrame:
    """Casas abertas em cada faixa de `passo_min` minutos, por dia da semana.

    Lê B1_horarios.csv ("18:00-00:00 | 19:00-01:00"); fechamento menor ou igual
    à abertura passa da meia-noite e conta no mesmo dia (eixo vai até 27 = 3h).
    Uma casa conta como aberta na faixa se o ponto médio da faixa cai num
    intervalo de funcionamento."""
    h = pd.read_csv(B1 / "estabelecimentos/B1_horarios.csv", sep=";", encoding="utf-8-sig")
    base = casas()[["place_id"]]
    h = base.merge(h, on="place_id", how="left")
    assert len(h) == len(base)
    dias = ["segunda", "terca", "quarta", "quinta", "sexta", "sabado", "domingo"]
    faixas = [ini_h + i * passo_min / 60 for i in range(int((fim_h - ini_h) * 60 / passo_min))]
    linhas = []

    def hora(t):
        a, b = t.strip().split(":")
        return int(a) + int(b) / 60

    for dia in dias:
        cont = [0] * len(faixas)
        for txt in h[dia]:
            if not isinstance(txt, str) or "-" not in txt:
                continue
            for trecho in txt.split("|"):
                a, b = (hora(p) for p in trecho.split("-"))
                if b <= a:
                    b += 24
                for i, f in enumerate(faixas):
                    meio = f + passo_min / 120
                    if a <= meio < b:
                        cont[i] += 1
        for f, c in zip(faixas, cont):
            linhas.append({"dia": dia, "faixa_h": f, "casas_abertas": c, "casas_total": len(base),
                           "pct_abertas": round(100 * c / len(base), 1)})
    return pd.DataFrame(linhas)
