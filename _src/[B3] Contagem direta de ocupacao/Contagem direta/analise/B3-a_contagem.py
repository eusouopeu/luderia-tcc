"""
Bloco B3 - análise das visitas registradas no app de observação (_src/app-observacao/).

Entrada: os CSVs exportados pelo app (Ajustes › Exportar, ou o botão de envio da
unidade), consolidados por build/B3-b_importar_app.py em
`dados/[B3] Contagem direta de ocupacao/_dados-brutos/app/`, com as colunas
`visita_id` e `observador` (POV1, POV2):
  contagem_grupos_mesa.csv, contagem_fluxo.csv, contagem_rodadas.csv,
  contagem_acustica.csv, contagem_visitas.csv, contagem_precos.csv,
  contagem_unidades.csv, contagem_pedidos.csv, contagem_medidas.csv,
  contagem_fotos.csv
Separador ";" com BOM (o app grava assim para o Excel).

Saídas em `dados/[B3] Contagem direta de ocupacao/`:
  contagem_resumo_visitas.csv  - uma linha por observador de cada visita e uma
      linha `observador = media` por visita, com a média dos observadores
      (cada observador com registro válido conta uma vez; tabela ausente ou
      descartada não entra na média): pessoas por hora (porta),
      tamanho do grupo, permanência (mesas e porta, com contagem de censurados),
      ocupação média das mesas nas contagens, ocupação minuto a minuto do salão
      (mesas e assentos, média e pico), notas emitidas na visita e pessoas por
      nota, pedidos por grupo e espera média (pedido → chegada) por categoria.
  contagem_notas_intervalo.csv - por unidade: notas emitidas entre a visita
      sorteada e a de retorno (última NFC-e da primeira × primeira NFC-e da
      segunda, mesma série e CNPJ) e notas por dia no intervalo.

Regras (_instrucoes/4_metodologia.md, Bloco B3):
  - Taxas por hora observada: a duração vem de visita_inicio/visita_fim menos o
    tempo pausado no temporizador. Sem visita_fim (o observador não encerrou a
    visita no app), o fim é o maior entre início + duração prevista e o último
    horário registrado pelo observador; a coluna `fim_estimado` marca o caso.
  - Permanência média só com grupos de entrada e saída vistas; os censurados
    (sem saída) são contados à parte, não imputados.
  - Espera dos pedidos: só pedidos com chegada registrada; os pendentes são
    contados à parte (censurados), não imputados.
  - Pessoas por nota = pessoas que entraram pela porta ÷ notas emitidas durante
    a visita; sem registro de porta, usa as pessoas das mesas.
  - Ocupação minuto a minuto: o app registra cada grupo de mesa ao sentar e ao
    sair, então a ocupação sai dos intervalos [entrada, saída) dos grupos (sem
    saída, até o fim da visita), minuto a minuto entre o início e o fim da
    visita. Mesas e assentos do salão vêm de outros/B3_estrutura_unidades.csv
    (informados pelo autor e pelo site de reservas), não do campo do app.
    Grupo que juntou mesas conta como uma mesa: a ocupação de mesas é um piso.
    A mesa do observador não entra nos registros e sai do denominador: mesas
    menos as do observador e assentos menos as pessoas da mesa dele, por visita
    (outros/B3_mesa_observador.csv; colunas mesas_denominador e
    assentos_denominador).
  - Notas no intervalo: entre a última NFC-e lida na primeira visita e a
    primeira lida na seguinte da mesma unidade (sem a do início, vale a do fim).
    As casas só emitem NFC-e quando o cliente pede: as notas são um piso das
    vendas, não o número de atendimentos.
Uso: python3 "_src/[B3] Contagem direta de ocupacao/Contagem direta/analise/B3-a_contagem.py"
"""
# Caminhos: _src/extras/ (log comum) e outros/ do objeto (auxiliares); log em ../logs/
import sys
from pathlib import Path
_AQUI = Path(__file__).resolve()
sys.path[:0] = [str(_AQUI.parents[3] / "extras"), str(_AQUI.parents[1] / "outros")]
from log_execucao import registrar_execucao  # noqa: E402
if __name__ == "__main__":
    registrar_execucao(__file__)

from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parents[4]
ENTRADA = ROOT / "dados" / "[B3] Contagem direta de ocupacao" / "_dados-brutos" / "app"
ESTRUTURA = _AQUI.parents[1] / "outros" / "B3_estrutura_unidades.csv"
OBSERVADOR = _AQUI.parents[1] / "outros" / "B3_mesa_observador.csv"
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


def ocupacao_minuto(g: pd.DataFrame, ini: pd.Timestamp, fim: pd.Timestamp, mesas: float, assentos: float) -> dict:
    """Média e pico de mesas e de pessoas sentadas, minuto a minuto, entre o início e o fim da visita."""
    vazio = {"ocupacao_mesas_media_pct": float("nan"), "ocupacao_mesas_pico_pct": float("nan"),
             "ocupacao_assentos_media_pct": float("nan"), "ocupacao_assentos_pico_pct": float("nan"),
             "pessoas_sentadas_media": float("nan"), "pessoas_sentadas_pico": float("nan")}
    if g.empty or not mesas:
        return vazio
    m_ini = ini.hour * 60 + ini.minute
    m_fim = m_ini + int((fim - ini).total_seconds() // 60)
    mesas_min, pessoas_min = [], []
    for t in range(m_ini, m_fim):
        dentro = g[(g["_e"] <= t) & (t < g["_s"])]
        mesas_min.append(dentro["mesa"].nunique())
        pessoas_min.append(num(dentro["pessoas"]).sum())
    mesas_min, pessoas_min = pd.Series(mesas_min, dtype=float), pd.Series(pessoas_min, dtype=float)
    return {
        "ocupacao_mesas_media_pct": round(100 * mesas_min.mean() / mesas, 1),
        "ocupacao_mesas_pico_pct": round(100 * mesas_min.max() / mesas, 1),
        "ocupacao_assentos_media_pct": round(100 * pessoas_min.mean() / assentos, 1) if assentos else float("nan"),
        "ocupacao_assentos_pico_pct": round(100 * pessoas_min.max() / assentos, 1) if assentos else float("nan"),
        "pessoas_sentadas_media": round(pessoas_min.mean(), 1),
        "pessoas_sentadas_pico": pessoas_min.max(),
    }


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
    estrutura = pd.read_csv(ESTRUTURA, sep=";", encoding="utf-8-sig", dtype=str)
    salao = estrutura[estrutura["ambiente"] == "salao_jogos"].set_index("unidade")
    obs = pd.read_csv(OBSERVADOR, sep=";", encoding="utf-8-sig", dtype=str).set_index("visita_id")

    linhas = []
    for _, v in visitas.iterrows():
        chave = (v["unidade"], v["visita_inicio"])
        ini = pd.Timestamp(v["visita_inicio"])

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

        # duração: fim registrado ou, sem ele, o maior entre o previsto e o último registro
        fim_estimado = not v["visita_fim"]
        if not fim_estimado:
            fim = pd.Timestamp(v["visita_fim"])
        else:
            horarios = [minutos(h) for h in pd.concat([
                f["hora"] if not f.empty else pd.Series(dtype=str),
                g["entrada"] if not g.empty else pd.Series(dtype=str),
                g["saida"] if not g.empty else pd.Series(dtype=str),
            ]) if h]
            ultimo = max(horarios) if horarios else float("nan")
            previsto = ini + pd.Timedelta(minutes=float(v["duracao_prevista_min"] or 0))
            fim = previsto
            if pd.notna(ultimo):
                visto = ini.normalize() + pd.Timedelta(minutes=ultimo)
                fim = max(previsto, visto)
        horas = ((fim - ini).total_seconds() / 60 - float(v["pausado_min"] or 0)) / 60

        # porta
        ent = f[f["tipo"] == "entrada"] if not f.empty else f
        sai = f[f["tipo"] == "saida"] if not f.empty else f
        entraram = num(ent["pessoas"]).sum() if not f.empty else float("nan")
        perm_porta = []
        for _, s in sai.iterrows():
            e = ent[ent["codigo"] == s["codigo"]]
            if not e.empty:
                d = minutos(s["hora"]) - minutos(e.iloc[0]["hora"])
                if d >= 0:
                    perm_porta.append(d)

        # ocupação minuto a minuto do salão
        m_fim_visita = ini.hour * 60 + ini.minute + int((fim - ini).total_seconds() // 60)
        if not g.empty:
            g = g.assign(_e=g["entrada"].map(minutos),
                         _s=g["saida"].map(minutos).fillna(m_fim_visita))
        # denominador sem a mesa e as pessoas do observador
        mesas_obs = float(obs.at[v["visita_id"], "mesas"]) if v["visita_id"] in obs.index else 0.0
        pessoas_obs = float(obs.at[v["visita_id"], "pessoas"]) if v["visita_id"] in obs.index else 0.0
        mesas_den = float(salao.at[chave[0], "mesas"]) - mesas_obs if chave[0] in salao.index else float("nan")
        assentos_den = float(salao.at[chave[0], "assentos"]) - pessoas_obs if chave[0] in salao.index else float("nan")
        ocupacao = ocupacao_minuto(g, ini, fim, mesas_den, assentos_den)
        ocupacao.update({"mesas_denominador": mesas_den, "assentos_denominador": assentos_den})

        # mesas
        perm_mesa = num(g["permanencia_min"]).dropna() if not g.empty else pd.Series(dtype=float)
        pessoas_mesa = num(g["pessoas"]).sum() if not g.empty else float("nan")

        # notas
        emitidas = float("nan")
        if v["nfce_inicio_numero"] and v["nfce_fim_numero"] and v["nfce_inicio_serie"] == v["nfce_fim_serie"]:
            emitidas = int(v["nfce_fim_numero"]) - int(v["nfce_inicio_numero"])
        base = entraram if not f.empty else pessoas_mesa

        # ocupação
        n_mesas = num(unidades.loc[unidades["unidade"] == chave[0], "mesas"]).iloc[0] if not unidades.empty and (unidades["unidade"] == chave[0]).any() else float("nan")
        ocup = num(r["mesas_ocupadas"]) if not r.empty else pd.Series(dtype=float)

        linhas.append({
            "visita_id": v["visita_id"],
            "observador": v["observador"],
            "unidade": chave[0],
            "visita_inicio": chave[1],
            "fim_estimado": "sim" if fim_estimado else "nao",
            "horas_observadas": round(horas, 2),
            "grupos_porta": len(ent) if not f.empty else float("nan"),
            "pessoas_entraram": entraram,
            "pessoas_por_hora": round(entraram / horas, 2) if horas and horas > 0 and not f.empty else float("nan"),
            "tamanho_grupo_porta": round(num(ent["pessoas"]).mean(), 2) if not ent.empty else float("nan"),
            "permanencia_porta_media_min": round(sum(perm_porta) / len(perm_porta), 1) if perm_porta else float("nan"),
            "censurados_porta": len(ent) - len(perm_porta) if not f.empty else float("nan"),
            "grupos_mesa": len(g) if not g.empty else float("nan"),
            "pessoas_mesa": pessoas_mesa,
            "tamanho_grupo_mesa": round(num(g["pessoas"]).mean(), 2) if not g.empty else float("nan"),
            "permanencia_mesa_media_min": round(perm_mesa.mean(), 1) if len(perm_mesa) else float("nan"),
            "permanencia_mesa_mediana_min": perm_mesa.median() if len(perm_mesa) else float("nan"),
            "censurados_mesa": int((g["censurada"] == "sim").sum()) if not g.empty else float("nan"),
            **ocupacao,
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
    r = pd.DataFrame(linhas)
    # média dos observadores de cada visita (NaN = tabela ausente ou descartada, fora da média)
    medias = []
    for visita_id, rv in r.groupby("visita_id", sort=False):
        m = rv.mean(numeric_only=True).round(2).to_dict()
        m.update({"visita_id": visita_id, "observador": "media", "unidade": rv["unidade"].iloc[0],
                  "visita_inicio": rv["visita_inicio"].min(),
                  "fim_estimado": "sim" if (rv["fim_estimado"] == "sim").any() else "nao",
                  "cobranca": "", "condicoes": ""})
        medias.append(m)
    return pd.concat([r, pd.DataFrame(medias)], ignore_index=True)[r.columns]


def notas_intervalo() -> pd.DataFrame:
    """Notas entre a visita sorteada (primeira) e a de retorno (segunda) de cada unidade."""
    visitas = ler("contagem_visitas.csv")
    # uma linha por visita: a do observador que registrou a NFC-e (os dois leem a mesma nota)
    visitas = (visitas.assign(_com_nota=visitas["nfce_inicio_numero"] != "")
               .sort_values(["_com_nota", "visita_inicio"], ascending=[False, True])
               .drop_duplicates("visita_id"))
    linhas = []
    for unidade, vs in visitas.sort_values("visita_inicio").groupby("unidade"):
        if len(vs) < 2:
            continue
        a, b = vs.iloc[0], vs.iloc[-1]
        # última leitura da primeira visita e primeira leitura da segunda
        serie_a, num_a, em_a = (a["nfce_fim_serie"], a["nfce_fim_numero"], a["nfce_fim_emissao"]) if a["nfce_fim_numero"] else (a["nfce_inicio_serie"], a["nfce_inicio_numero"], a["nfce_inicio_emissao"])
        serie_b, num_b, em_b = (b["nfce_inicio_serie"], b["nfce_inicio_numero"], b["nfce_inicio_emissao"]) if b["nfce_inicio_numero"] else (b["nfce_fim_serie"], b["nfce_fim_numero"], b["nfce_fim_emissao"])
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
