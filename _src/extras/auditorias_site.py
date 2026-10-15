"""
Resumo das amostras de auditoria da coleta para a aba 12 do site de
apresentação (_instrucoes/4_metodologia.md §3.4, "Validação da coleta").

Lê o último registro de cada amostra (`auditoria/auditoria_registro.csv` de cada
pasta de brutos) e a própria amostra, para contar estratos e a alocação por
estrato, e calcula, pelo intervalo de Wilson a 95% (amostrar_auditoria.py):
  - o limite superior da taxa de erro com zero erros;
  - o maior número de erros que ainda cumpre o critério (limite ≤ 5%);
  - o n mínimo para cumprir o critério com zero erros.
Só números agregados vão para o site; as amostras (com texto de avaliações e
@ de perfis) ficam fora do git.

Saída: _src/site-apresentacao/src/conteudo/auditorias.json

Uso:
    python3 _src/extras/auditorias_site.py
"""
import sys
from pathlib import Path
_AQUI = Path(__file__).resolve()
sys.path.insert(0, str(_AQUI.parent))
from log_execucao import registrar_execucao  # noqa: E402
if __name__ == "__main__":
    registrar_execucao(__file__)

import json

import pandas as pd

from amostrar_auditoria import Z_95, wilson_superior  # noqa: E402

ROOT = _AQUI.parents[2]
B1 = ROOT / "dados" / "[B1] Estabelecimentos e cardapios" / "_dados-brutos"
B2 = ROOT / "dados" / "[B2] Avaliacoes recentes" / "_dados-brutos"
B4 = ROOT / "dados" / "[B4] Bases publicas" / "_dados-brutos"
SAIDA = ROOT / "_src" / "site-apresentacao" / "src" / "conteudo" / "auditorias.json"
CRITERIO = 0.05
FONTES_B4 = ["bcb", "caged", "concla", "fipezap", "ibge_censo_2022", "ibge_sidra", "legislacao"]

# id -> (pasta, arquivo da amostra, unidade)
AMOSTRAS = {
    "estabelecimentos": (B1 / "estabelecimentos/auditoria", "B1_auditoria_estabelecimentos.csv", "estabelecimento"),
    "entorno_casas": (B1 / "entornos/auditoria", "B1_auditoria_entorno_estabelecimentos.csv", "estabelecimento"),
    "entorno_itens": (B1 / "entornos/auditoria", "B1_auditoria_entorno_itens.csv", "item a até 1000 m"),
    "instagram_perfis": (B1 / "redes_sociais/auditoria", "B1_auditoria_instagram_perfis.csv", "perfil"),
    "instagram_posts": (B1 / "redes_sociais/auditoria", "B1_auditoria_instagram_posts.csv", "post"),
    "cardapios": (B1 / "cardapios/auditoria", "B1_auditoria_cardapios.csv", "item com preço"),
    "acervos": (B1 / "acervos_luderias/auditoria", "B1_auditoria_acervos.csv", "jogo"),
    "avaliacoes": (B2 / "coletas/auditoria", "B2_auditoria_avaliacoes.csv", "avaliação com texto"),
    "completude": (B2 / "coletas/auditoria", "B2_auditoria_completude.csv", "estabelecimento"),
}


def n_minimo(criterio=CRITERIO, z=Z_95):
    """Menor n com limite superior de Wilson ≤ critério quando não há erro."""
    n = 1
    while wilson_superior(0, n, z) > criterio:
        n += 1
    return n


def max_erros(n):
    """Maior número de erros com limite superior ≤ critério (None se nem zero cumpre)."""
    ok = [e for e in range(n + 1) if wilson_superior(e, n) <= CRITERIO + 1e-12]
    return max(ok) if ok else None


def registro(pasta, arquivo):
    r = pd.read_csv(pasta / "auditoria_registro.csv", sep=";", encoding="utf-8-sig")
    r = r[r.arquivo == arquivo]
    return r.iloc[-1] if len(r) else None


def estratos(df):
    if "estrato_sorteio" not in df:
        return None
    s = df["estrato_sorteio"].value_counts()
    return {"estratos": int(len(s)), "min": int(s.min()), "max": int(s.max())}


def item(n, populacao, **extra):
    return {"n": int(n), "populacao": int(populacao),
            "pct_populacao": round(100 * n / populacao, 1) if populacao else None,
            "wilson_zero": round(100 * wilson_superior(0, n), 1),
            "max_erros": max_erros(n),
            "wilson_max_erros": round(100 * wilson_superior(max_erros(n), n), 1) if max_erros(n) is not None else None,
            **extra}


def main():
    out = {}
    for ident, (pasta, arq, unidade) in AMOSTRAS.items():
        reg = registro(pasta, arq)
        df = pd.read_csv(pasta / arq, sep=";", encoding="utf-8-sig")
        assert reg is not None and int(reg.n) == len(df), f"{arq}: registro e amostra não batem"
        out[ident] = item(len(df), reg.populacao, unidade=unidade, gerado_em=str(reg.gerado_em),
                          semente=None if pd.isna(reg.semente) else str(int(float(reg.semente))),
                          desenho=str(reg.desenho), alocacao=estratos(df))
    # B4: uma linha por série de cada arquivo, somada nas sete pastas de fonte.
    fontes = []
    for f in FONTES_B4:
        pasta = B4 / f / "auditoria"
        df = pd.read_csv(pasta / f"B4_auditoria_{f}.csv", sep=";", encoding="utf-8-sig")
        reg = registro(pasta, f"B4_auditoria_{f}.csv")
        fontes.append({"fonte": f, "arquivos": int(reg.populacao), "series": int(len(df))})
    total_b4 = sum(x["series"] for x in fontes)
    out["bases"] = item(total_b4, total_b4, unidade="série", desenho="uma linha sorteada por série (reconciliação exaustiva)",
                        fontes=fontes, arquivos=sum(x["arquivos"] for x in fontes), semente="20261015")
    curva = [{"n": n, "limite": round(100 * wilson_superior(0, n), 2)} for n in range(5, 251, 5)]
    dados = {
        "_leiaMe": "Gerado por _src/extras/auditorias_site.py. Não editar à mão.",
        "criterio_pct": CRITERIO * 100,
        "z": Z_95,
        "n_minimo_zero_erros": n_minimo(),
        "curva_wilson_zero": curva,
        "amostras": out,
    }
    SAIDA.write_text(json.dumps(dados, ensure_ascii=False, indent=1), encoding="utf-8")
    for k, v in out.items():
        print(f"{k}: n={v['n']} de {v['populacao']}, zero erros -> {v['wilson_zero']}%, aceita até {v['max_erros']} erros")
    print("n mínimo com zero erros:", dados["n_minimo_zero_erros"], "->", SAIDA.relative_to(ROOT))


if __name__ == "__main__":
    main()
