"""
Bloco B3 - análise das visitas registradas no app de observação (_src/app-observacao/).

Entrada: os CSVs exportados pelo app (Ajustes › Exportar, ou o botão de envio da
unidade), copiados para `dados/[B3] Contagem direta de ocupacao/dados-brutos/app/`:
  contagem_grupos_mesa.csv, contagem_fluxo.csv, contagem_rodadas.csv,
  contagem_acustica.csv, contagem_visitas.csv, contagem_precos.csv,
  contagem_unidades.csv, contagem_pedidos.csv, contagem_medidas.csv,
  contagem_fotos.csv
Separador ";" com BOM (o app grava assim para o Excel).

Saídas em `dados/[B3] Contagem direta de ocupacao/`:
  contagem_resumo_visitas.csv  - uma linha por visita: pessoas por hora (porta),
      tamanho do grupo, permanência (mesas e porta, com contagem de censurados),
      ocupação média das mesas nas contagens, notas emitidas na visita e pessoas
      por nota, pedidos por grupo e espera média (pedido → chegada) por categoria.
  contagem_notas_intervalo.csv - por unidade: notas emitidas entre a visita
      sorteada e a de retorno (última NFC-e da primeira × primeira NFC-e da
      segunda, mesma série e CNPJ) e notas por dia no intervalo.

Regras (_instrucoes/4_metodologia.md, Bloco B3):
  - Taxas por hora observada: a duração vem de visita_inicio/visita_fim menos o
    tempo pausado no temporizador.
  - Permanência média só com grupos de entrada e saída vistas; os censurados
    (sem saída) são contados à parte, não imputados.
  - Espera dos pedidos: só pedidos com chegada registrada; os pendentes são
    contados à parte (censurados), não imputados.
  - Pessoas por nota = pessoas que entraram pela porta ÷ notas emitidas durante
    a visita; sem registro de porta, usa as pessoas das mesas.
Uso: python3 "_src/[B3] Contagem direta de ocupacao/analise/B3-a_contagem.py"
"""
# Caminhos: _src/ (log comum) e outros/ do bloco (auxiliares); log em ../logs/
import sys
from pathlib import Path
_AQUI = Path(__file__).resolve()
sys.path[:0] = [str(_AQUI.parents[2]), str(_AQUI.parents[1] / "outros")]
from log_execucao import registrar_execucao  # noqa: E402
if __name__ == "__main__":
    registrar_execucao(__file__)

from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parents[3]
ENTRADA = ROOT / "dados" / "[B3] Contagem direta de ocupacao" / "dados-brutos" / "app"
SAIDA = ROOT / "dados" / "[B3] Contagem direta de ocupacao"


def ler(nome: str) -> pd.DataFrame:
    arq = ENTRADA / nome
    if not arq.exists():
        return pd.DataFrame()
    return pd.read_csv(arq, sep=";", encoding="utf-8-sig", dtype=str).fillna("")


def minutos(hora: str) -> float:
    try:
        h, m = str(hora).split(":")[:2]
        return int(h) * 60 + int(m)
    except ValueError:
        return float("nan")


def num(s: pd.Series) -> pd.Series:
    return pd.to_numeric(s, errors="coerce")


def resumo_visitas() -> pd.DataFrame:
    visitas = ler("contagem_visitas.csv")
    if visitas.empty:
        raise SystemExit(f"Sem contagem_visitas.csv em {ENTRADA}")
    grupos = ler("contagem_grupos_mesa.csv")
    fluxo = ler("contagem_fluxo.csv")
    rodadas = ler("contagem_rodadas.csv")
    unidades = ler("contagem_unidades.csv")
    acustica = ler("contagem_acustica.csv")
    pedidos = ler("contagem_pedidos.csv")

    linhas = []
    for _, v in visitas.iterrows():
        chave = (v["unidade"], v["visita_inicio"])
        ini = pd.Timestamp(v["visita_inicio"])
        fim = pd.Timestamp(v["visita_fim"]) if v["visita_fim"] else pd.NaT
        horas = ((fim - ini).total_seconds() / 60 - float(v["pausado_min"] or 0)) / 60 if pd.notna(fim) else float("nan")

        g = grupos[(grupos["unidade"] == chave[0]) & (grupos["visita_inicio"] == chave[1])] if not grupos.empty else grupos
        f = fluxo[(fluxo["unidade"] == chave[0]) & (fluxo["visita_inicio"] == chave[1])] if not fluxo.empty else fluxo
        r = rodadas[(rodadas["unidade"] == chave[0]) & (rodadas["visita_inicio"] == chave[1])] if not rodadas.empty else rodadas
        a = acustica[(acustica["unidade"] == chave[0]) & (acustica["visita_inicio"] == chave[1])] if not acustica.empty else acustica
        p = pedidos[(pedidos["unidade"] == chave[0]) & (pedidos["visita_inicio"] == chave[1])] if not pedidos.empty else pedidos
        esperas = {}
        for cat in ("bebida", "comida", "sobremesa"):
            e = num(p.loc[p["categoria"] == cat, "espera_min"]).dropna() if not p.empty else pd.Series(dtype=float)
            esperas[f"espera_{cat}_media_min"] = round(e.mean(), 1) if len(e) else float("nan")
            esperas[f"pedidos_{cat}"] = int((p["categoria"] == cat).sum()) if not p.empty else 0

        # porta
        ent = f[f["tipo"] == "entrada"] if not f.empty else f
        sai = f[f["tipo"] == "saida"] if not f.empty else f
        entraram = num(ent["pessoas"]).sum() if not ent.empty else 0
        perm_porta = []
        for _, s in sai.iterrows():
            e = ent[ent["codigo"] == s["codigo"]]
            if not e.empty:
                d = minutos(s["hora"]) - minutos(e.iloc[0]["hora"])
                if d >= 0:
                    perm_porta.append(d)

        # mesas
        perm_mesa = num(g["permanencia_min"]).dropna() if not g.empty else pd.Series(dtype=float)
        pessoas_mesa = num(g["pessoas"]).sum() if not g.empty else 0

        # notas
        emitidas = float("nan")
        if v["nfce_inicio_numero"] and v["nfce_fim_numero"] and v["nfce_inicio_serie"] == v["nfce_fim_serie"]:
            emitidas = int(v["nfce_fim_numero"]) - int(v["nfce_inicio_numero"])
        base = entraram if not f.empty else pessoas_mesa

        # ocupação
        n_mesas = num(unidades.loc[unidades["unidade"] == chave[0], "mesas"]).iloc[0] if not unidades.empty and (unidades["unidade"] == chave[0]).any() else float("nan")
        ocup = num(r["mesas_ocupadas"]) if not r.empty else pd.Series(dtype=float)

        linhas.append({
            "unidade": chave[0],
            "visita_inicio": chave[1],
            "horas_observadas": round(horas, 2),
            "grupos_porta": len(ent),
            "pessoas_entraram": entraram,
            "pessoas_por_hora": round(entraram / horas, 2) if horas and horas > 0 and not f.empty else float("nan"),
            "tamanho_grupo_porta": round(num(ent["pessoas"]).mean(), 2) if not ent.empty else float("nan"),
            "permanencia_porta_media_min": round(sum(perm_porta) / len(perm_porta), 1) if perm_porta else float("nan"),
            "censurados_porta": len(ent) - len(perm_porta),
            "grupos_mesa": len(g),
            "pessoas_mesa": pessoas_mesa,
            "tamanho_grupo_mesa": round(num(g["pessoas"]).mean(), 2) if not g.empty else float("nan"),
            "permanencia_mesa_media_min": round(perm_mesa.mean(), 1) if len(perm_mesa) else float("nan"),
            "permanencia_mesa_mediana_min": perm_mesa.median() if len(perm_mesa) else float("nan"),
            "censurados_mesa": int((g["censurada"] == "sim").sum()) if not g.empty else 0,
            "contagens": len(r),
            "ocupacao_media_pct": round(100 * ocup.mean() / n_mesas, 1) if len(ocup) and n_mesas else float("nan"),
            "pico_mesas_ocupadas": ocup.max() if len(ocup) else float("nan"),
            "notas_emitidas_visita": emitidas,
            "pessoas_por_nota": round(base / emitidas, 2) if emitidas and emitidas > 0 else float("nan"),
            "pedidos_por_grupo": round(len(p) / len(g), 2) if len(g) else float("nan"),
            "pedidos_pendentes": int((p["pendente"] == "sim").sum()) if not p.empty else 0,
            **esperas,
            "db_medio": round(num(a["db_leq10s_estimado"]).mean(), 1) if not a.empty else float("nan"),
            "cobranca": v["cobranca"],
            "condicoes": v["condicoes"],
        })
    return pd.DataFrame(linhas)


def notas_intervalo() -> pd.DataFrame:
    """Notas entre a visita sorteada (primeira) e a de retorno (segunda) de cada unidade."""
    visitas = ler("contagem_visitas.csv")
    linhas = []
    for unidade, vs in visitas.sort_values("visita_inicio").groupby("unidade"):
        if len(vs) < 2:
            continue
        a, b = vs.iloc[0], vs.iloc[-1]
        # última leitura da primeira visita e primeira leitura da segunda
        serie_a, num_a, em_a = (a["nfce_fim_serie"], a["nfce_fim_numero"], a["nfce_fim_emissao"]) if a["nfce_fim_numero"] else (a["nfce_inicio_serie"], a["nfce_inicio_numero"], a["nfce_inicio_emissao"])
        serie_b, num_b, em_b = b["nfce_inicio_serie"], b["nfce_inicio_numero"], b["nfce_inicio_emissao"]
        if not (num_a and num_b) or serie_a != serie_b:
            continue
        t_a = pd.Timestamp(em_a or a["visita_fim"] or a["visita_inicio"])
        t_b = pd.Timestamp(em_b or b["visita_inicio"])
        dias = (t_b - t_a).total_seconds() / 86400
        notas = int(num_b) - int(num_a)
        linhas.append({
            "unidade": unidade, "de": t_a, "ate": t_b, "dias": round(dias, 2), "serie": serie_a,
            "notas_emitidas": notas, "notas_por_dia": round(notas / dias, 1) if dias > 0 else float("nan"),
        })
    return pd.DataFrame(linhas)


def main():
    SAIDA.mkdir(parents=True, exist_ok=True)
    r = resumo_visitas()
    r.to_csv(SAIDA / "contagem_resumo_visitas.csv", index=False, sep=";", encoding="utf-8-sig")
    n = notas_intervalo()
    n.to_csv(SAIDA / "contagem_notas_intervalo.csv", index=False, sep=";", encoding="utf-8-sig")
    print(r.to_string(index=False))
    print()
    print(n.to_string(index=False) if not n.empty else "Sem pares sorteada/retorno com NFC-e comparável.")


if __name__ == "__main__":
    main()
