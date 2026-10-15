"""
Bloco B2 - resumo da análise de conteúdo (Bardin) para a aba 11 do site de
apresentação.

Lê as tabelas de B2-a_conteudo_bardin.py e os achados do §3 de
textos/instrumentos/analise_conteudo_bardin_B2.md e grava um JSON com:
  - números do corpus (comentários analisados, estabelecimentos, tipos, notas);
  - menções por categoria e polaridade, por tipo de estabelecimento, em % dos
    comentários e em % ponderado por estabelecimento;
  - composição das críticas (negativas de cada categoria ÷ total de negativas);
  - nota média dos comentários com elogio e com crítica a cada categoria;
  - códigos de contexto (ocasião, sinais de público) por tipo;
  - comentários e nota por estabelecimento;
  - achados do §3 (título, texto e decisão do plano).

Cada comentário pertence a um único estabelecimento e cada estabelecimento a
um único tipo; a soma dos comentários por tipo fecha com o total analisado.

Entradas: dados/[B2] Avaliacoes recentes/analise_conteudo/B2_*.csv
          textos/instrumentos/analise_conteudo_bardin_B2.md
Saída:    _src/site-apresentacao/src/conteudo/b2-conteudo.json

Uso:
    python3 "_src/[B2] Avaliacoes recentes/Google Places (Comentários)/analise/B2-a_conteudo_site.py"
"""
# Caminhos: _src/extras/ (log comum); log em ../logs/
import sys
from pathlib import Path
_AQUI = Path(__file__).resolve()
sys.path[:0] = [str(_AQUI.parents[3] / "extras")]
from log_execucao import registrar_execucao  # noqa: E402
if __name__ == "__main__":
    registrar_execucao(__file__)

import json
import re

import pandas as pd

ROOT = _AQUI.parents[4]
PASTA = ROOT / "dados" / "[B2] Avaliacoes recentes" / "analise_conteudo"
DOC = ROOT / "textos" / "instrumentos" / "analise_conteudo_bardin_B2.md"
SAIDA = ROOT / "_src" / "site-apresentacao" / "src" / "conteudo" / "b2-conteudo.json"
TIPOS = {"total": "total", "casa de jogos": "casas", "loja com espaço de jogo": "lojas"}


def ler(nome):
    return pd.read_csv(PASTA / nome, sep=";", encoding="utf-8-sig")


def num(v):
    return None if pd.isna(v) else float(v)


def categorias():
    f = ler("B2_bardin_frequencia_categorias.csv")
    n = ler("B2_bardin_nota_por_categoria.csv").set_index(["código", "polaridade"])
    out = []
    for cod, g in f.groupby("código", sort=False):
        g = g.set_index("polaridade")
        item = {"codigo": cod, "categoria": g["categoria"].iloc[0]}
        for tipo, chave in TIPOS.items():
            item[chave] = {
                pol: {"n": int(g.loc[pol, f"{tipo}: comentários"]),
                      "pct": num(g.loc[pol, f"{tipo}: % dos comentários"]),
                      "pond": num(g.loc[pol, f"{tipo}: % ponderado por estabelecimento"]),
                      "estab": int(g.loc[pol, f"{tipo}: estabelecimentos com menção"])}
                for pol in ["qualquer", "positiva", "negativa"]}
        item["nota"] = {pol: num(n.loc[(cod, pol), "nota média"]) if (cod, pol) in n.index else None
                        for pol in ["qualquer", "positiva", "negativa"]}
        out.append(item)
    for chave in TIPOS.values():
        total_neg = sum(c[chave]["negativa"]["n"] for c in out)
        for c in out:
            c[chave]["negativa"]["parte_criticas"] = round(c[chave]["negativa"]["n"] / total_neg * 100, 1) if total_neg else None
        out[0].setdefault("_total_negativas", {})[chave] = total_neg
    return out


def contexto():
    c = ler("B2_bardin_contexto.csv")
    n = ler("B2_bardin_nota_por_categoria.csv").set_index("código")
    return [{"codigo": r["código"], "categoria": r["categoria"],
             **{chave: {"n": int(r[f"{tipo}: comentários"]), "pct": num(r[f"{tipo}: % dos comentários"])}
                for tipo, chave in TIPOS.items()},
             "nota": num(n.loc[r["código"], "nota média"]) if r["código"] in n.index else None}
            for _, r in c.iterrows()]


def corpus(estab):
    cod = ler("B2_codificacao_bardin.csv")
    a = cod[cod.situacao == "analisada"]
    amostra = ler("B2_bardin_amostra_controle.csv")
    tem_recod = (PASTA / "B2_bardin_concordancia.csv").exists()
    por_tipo = estab.groupby("tipo").agg(estabelecimentos=("sigla", "size"), comentarios=("comentarios", "sum"))
    assert por_tipo.comentarios.sum() == len(a), "comentários por tipo não fecham com o total"
    top2 = estab.nlargest(2, "comentarios")
    casas = estab[estab.tipo == "casa de jogos"]
    return {
        "comentarios": int(len(a)),
        "excluidos": int((cod.situacao != "analisada").sum()),
        "estabelecimentos": int(estab.sigla.nunique()),
        "por_tipo": {TIPOS[t]: {"estabelecimentos": int(r.estabelecimentos), "comentarios": int(r.comentarios)}
                     for t, r in por_tipo.iterrows()},
        "nota_media": round(float(a.nota.mean()), 2),
        "pct_nota5": round(float((a.nota == 5).mean() * 100), 1),
        "notas": {str(k): int(v) for k, v in a.nota.value_counts().sort_index().items()},
        "concentracao": {"nomes": top2.estabelecimento.tolist(), "comentarios": int(top2.comentarios.sum()),
                         "pct_casas": round(float(top2.comentarios.sum() / casas.comentarios.sum() * 100), 1)},
        "controle": {"amostra": int(len(amostra)), "recodificada": tem_recod},
    }


def limpar(t):
    """Tira a marcação de Markdown (crases, negrito, itálico) do texto do documento."""
    t = re.sub(r"`([^`]*)`", r"\1", t)
    t = re.sub(r"\*\*([^*]+)\*\*", r"\1", t)
    t = re.sub(r"(?<![\w*])\*([^*]+)\*(?![\w*])", r"\1", t)
    return " ".join(t.split())


def achados():
    texto = DOC.read_text(encoding="utf-8")
    sec = texto.split("## 3. Principais achados", 1)[1].split("\n## ", 1)[0]
    intro = limpar(sec.strip().split("\n### ", 1)[0])
    out = []
    for bloco in re.split(r"\n### ", sec)[1:]:
        titulo, corpo = bloco.split("\n", 1)
        decisao = re.search(r"\*\*Decisão do plano:\*\*\s*(.+)", corpo)
        corpo = re.sub(r"\*\*Decisão do plano:\*\*.+", "", corpo).strip()
        out.append({"titulo": limpar(re.sub(r"^\d+\.\d+\s+", "", titulo)),
                    "texto": limpar(corpo), "decisao": limpar(decisao.group(1)) if decisao else ""})
    return intro, out


def main():
    estab = ler("B2_bardin_estabelecimentos.csv")
    intro, lista = achados()
    cats = categorias()
    dados = {
        "_leiaMe": "Gerado por _src/[B2] Avaliacoes recentes/Google Places (Comentários)/analise/B2-a_conteudo_site.py. Não editar à mão.",
        "corpus": corpus(estab),
        "total_negativas": cats[0].pop("_total_negativas"),
        "categorias": cats,
        "contexto": contexto(),
        "estabelecimentos": [{"sigla": r.sigla, "nome": r.estabelecimento, "capital": r.capital, "tipo": TIPOS[r.tipo],
                              "comentarios": int(r.comentarios), "nota": num(r.nota_media)}
                             for r in estab.sort_values("comentarios", ascending=False).itertuples()],
        "achados_intro": intro,
        "achados": lista,
    }
    SAIDA.write_text(json.dumps(dados, ensure_ascii=False, indent=1), encoding="utf-8")
    c = dados["corpus"]
    print(f"{c['comentarios']} comentários, {c['estabelecimentos']} estabelecimentos, {len(cats)} categorias, "
          f"{len(lista)} achados -> {SAIDA.relative_to(ROOT)}")
    print("por tipo:", c["por_tipo"], "| soma:", sum(v["comentarios"] for v in c["por_tipo"].values()))


if __name__ == "__main__":
    main()
