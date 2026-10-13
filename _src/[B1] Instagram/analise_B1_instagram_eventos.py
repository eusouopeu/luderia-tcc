"""
Bloco B1 - frequência, tipo e engajamento dos eventos divulgados no Instagram
pelas casas aprovadas.

Perguntas que mudam o plano:
  - quantos eventos por mês uma casa de jogos divulga (calendário e equipe,
    cap. 7)?
  - que tipo de evento rende mais engajamento em relação aos posts comuns da
    própria casa (comunicação, cap. 6)?
  - em que dias da semana os eventos são marcados (escala e horário, cap. 7)?

Classificação: a do coletor (instagram_comum.classificar_evento), aplicada de
novo a todos os posts para que versões antigas do coletor sigam a mesma regra.
"provável" = categoria de evento + indício de agenda (dia, hora, inscrição);
"possível" = só a categoria. Quando o autor marcou o post à mão no coletor
(coluna evento_validado), a marcação manual prevalece.

Regras:
  - unidade = post, atribuído ao dono (instagram_comum.carrega_posts);
  - janela de 12 meses (JANELA_DE a JANELA_ATE), igual para todas as casas;
  - evento conta como "provável" (padrão das tabelas) ou "provável ou
    possível" (coluna à parte, limite superior);
  - categorias de evento não são exclusivas: um post pode ter várias, e a soma
    das linhas por categoria não fecha com o total de eventos, por desenho;
  - engajamento: sorteios saem (inflam comentários); a razão de engajamento de
    uma categoria numa casa é a mediana de curtidas dos posts da categoria
    dividida pela mediana dos posts que não são evento da mesma casa; a tabela
    traz a mediana dessas razões entre as casas com ao menos MIN_POSTS_RAZAO
    posts da categoria. Assim um perfil grande não domina;
  - dia da semana: os dias citados na legenda do evento provável (data do
    evento, não da publicação); uma legenda pode citar vários dias.

Saídas em _data/processed/[B1] Estabelecimentos e cardapios/Redes Sociais/Analise das legendas/Eventos/:
  B1_instagram_eventos_por_estabelecimento.csv (casa: posts, eventos, eventos/mês, % por categoria)
  B1_instagram_eventos_por_categoria.csv       (categoria x tipo de casa: posts, casas, engajamento)
  B1_instagram_eventos_dias_da_semana.csv      (dia citado x tipo de casa)
  B1_instagram_eventos_por_mes.csv             (mês de publicação x tipo de casa)

Uso:
    python3 "_src/[B1] Instagram/analise_B1_instagram_eventos.py"
"""
import re

import pandas as pd

import instagram_comum as ic

SAIDA = ic.SAIDA / "Eventos"

JANELA_DE, JANELA_ATE = "2025-10-01", "2026-09-30"
MESES = 12
MIN_POSTS_JANELA = 12
MIN_POSTS_RAZAO = 3
DIAS = {
    "segunda": r"\bsegunda", "terça": r"\bterca", "quarta": r"\bquarta", "quinta": r"\bquinta",
    "sexta": r"\bsexta", "sábado": r"\bsabado|\bsabadou", "domingo": r"\bdomingo",
}
# "quarta" e "quinta" também são ordinais ("quarta edição"); esses usos saem.
ORDINAL = r"(?!\s+(?:edicao|vez|temporada|rodada|colocad|lugar|serie|etapa|semana|parte|geracao|onda|fase|mesa))"
RX_DIA = {d: re.compile(rf"(?:{r})(?:-?feiras?)?s?\b{ORDINAL}", re.ASCII) for d, r in DIAS.items()}


def classifica(posts):
    r = posts["legenda"].map(ic.classificar_evento)
    posts["evento_regra"] = r.str[0]
    posts["categorias"] = r.str[1]
    val = posts.get("evento_validado", pd.Series("", index=posts.index)).fillna("")
    posts["evento_provavel"] = posts["evento_regra"].eq("provável")
    posts["evento_amplo"] = posts["evento_regra"].isin(["provável", "possível"])
    posts.loc[val == "sim", ["evento_provavel", "evento_amplo"]] = True
    posts.loc[val == "não", ["evento_provavel", "evento_amplo"]] = False
    posts["sorteio"] = posts["texto"].map(lambda t: bool(ic.SORTEIO.search(t)))
    return posts


def por_estabelecimento(base):
    cats = list(ic.CATEGORIAS_EVENTO)
    linhas = []
    for casa, g in base.groupby("estabelecimento"):
        ev = g[g["evento_provavel"]]
        linha = {"estabelecimento": casa, "tipo_casa": g["tipo_casa"].iloc[0], "capital": g["capital"].iloc[0],
                 "posts na janela": len(g), "eventos prováveis": len(ev),
                 "eventos prováveis ou possíveis": int(g["evento_amplo"].sum()),
                 "eventos prováveis por mês": round(len(ev) / MESES, 1),
                 "% dos posts que são evento provável": round(100 * len(ev) / len(g), 1)}
        for c in cats:
            linha[f"{c}: eventos prováveis (não exclusiva)"] = int(ev["categorias"].str.contains(c, regex=False).sum())
        linhas.append(linha)
    return pd.DataFrame(linhas).sort_values(["tipo_casa", "eventos prováveis por mês"], ascending=[True, False])


def razao_engajamento(base, mascara_cat, metrica):
    """Mediana entre casas de (mediana da categoria / mediana dos não eventos)."""
    limpa = base[~base["sorteio"] & base[metrica].notna()]
    razoes = []
    for _, g in limpa.groupby("estabelecimento"):
        cat = g[mascara_cat.loc[g.index]]
        comum = g[~g["evento_amplo"]]
        ref = comum[metrica].median()
        if len(cat) >= MIN_POSTS_RAZAO and len(comum) >= MIN_POSTS_RAZAO and ref and ref > 0:
            razoes.append(cat[metrica].median() / ref)
    s = pd.Series(razoes, dtype=float)
    return (round(s.median(), 2) if len(s) else float("nan")), len(s)


def por_categoria(base):
    ev = base["evento_provavel"]
    grupos = {"todos os eventos prováveis": ev}
    for c in ic.CATEGORIAS_EVENTO:
        grupos[c] = ev & base["categorias"].str.contains(c, regex=False)
    grupos["sorteio (não é evento; referência)"] = base["sorteio"]
    linhas = []
    for nome, m in grupos.items():
        linha = {"categoria (não exclusiva)": nome, "posts": int(m.sum()),
                 "estabelecimentos": base.loc[m, "estabelecimento"].nunique()}
        for tipo in (ic.C, ic.L):
            t = base["tipo_casa"] == tipo
            n_casas = base.loc[t, "estabelecimento"].nunique()
            linha[f"{tipo}: estabelecimentos"] = f"{base.loc[m & t, 'estabelecimento'].nunique()} de {n_casas}"
            linha[f"{tipo}: posts por casa por mês (média)"] = round(int((m & t).sum()) / n_casas / MESES, 2)
        for metrica in ("curtidas", "comentarios"):
            r, n = razao_engajamento(base, m, metrica)
            linha[f"razão de {metrica} vs. posts comuns (mediana entre casas)"] = r
            linha[f"casas na razão de {metrica}"] = n
        linhas.append(linha)
    return pd.DataFrame(linhas)


def dias_da_semana(base):
    ev = base[base["evento_provavel"]]
    linhas = []
    for dia, rx in RX_DIA.items():
        cita = ev["texto"].map(lambda t: bool(rx.search(t)))
        linha = {"dia citado (não exclusiva)": dia, "eventos prováveis que citam": int(cita.sum())}
        for tipo in (ic.C, ic.L):
            t = ev["tipo_casa"] == tipo
            linha[f"{tipo}: eventos que citam"] = int((cita & t).sum())
            linha[f"{tipo}: % dos eventos prováveis"] = round(100 * (cita & t).sum() / max(int(t.sum()), 1), 1)
            linha[f"{tipo}: estabelecimentos"] = ev.loc[cita & t, "estabelecimento"].nunique()
        linhas.append(linha)
    return pd.DataFrame(linhas)


def por_mes(base):
    ev = base[base["evento_provavel"]].copy()
    ev["mês"] = ev["data"].dt.strftime("%Y-%m")
    tab = ev.pivot_table(index="mês", columns="tipo_casa", values="shortcode", aggfunc="size", fill_value=0)
    tab["total"] = tab.sum(axis=1)
    return tab


def main():
    SAIDA.mkdir(parents=True, exist_ok=True)
    posts = ic.carrega_posts()
    base = ic.janela(posts, JANELA_DE, JANELA_ATE)
    n_casa = base.groupby("estabelecimento").size()
    poucas = n_casa[n_casa < MIN_POSTS_JANELA]
    if len(poucas):
        print(f"casas com menos de {MIN_POSTS_JANELA} posts na janela (saem):", poucas.to_dict())
    base = classifica(base[~base["estabelecimento"].isin(poucas.index)].copy())
    print(f"janela {JANELA_DE} a {JANELA_ATE}: {len(base)} posts de {base['estabelecimento'].nunique()} casas | "
          f"eventos prováveis: {int(base['evento_provavel'].sum())} | prováveis ou possíveis: {int(base['evento_amplo'].sum())}")
    validados = (base.get("evento_validado", pd.Series(dtype=str)).fillna("") != "").sum()
    print(f"posts com validação manual: {validados}")

    est = por_estabelecimento(base)
    est.to_csv(SAIDA / "B1_instagram_eventos_por_estabelecimento.csv", sep=";", index=False)
    ic.conferir_soma(est["posts na janela"], len(base), "posts por estabelecimento")
    ic.conferir_soma(est["eventos prováveis"], int(base["evento_provavel"].sum()), "eventos por estabelecimento")
    print(est[["estabelecimento", "tipo_casa", "posts na janela", "eventos prováveis por mês",
               "% dos posts que são evento provável"]].to_string(index=False))

    cat = por_categoria(base)
    cat.to_csv(SAIDA / "B1_instagram_eventos_por_categoria.csv", sep=";", index=False)
    print("\n" + cat.to_string(index=False))

    dias = dias_da_semana(base)
    dias.to_csv(SAIDA / "B1_instagram_eventos_dias_da_semana.csv", sep=";", index=False)
    print("\n" + dias.to_string(index=False))

    mes = por_mes(base)
    mes.to_csv(SAIDA / "B1_instagram_eventos_por_mes.csv", sep=";")
    ic.conferir_soma(mes["total"], int(base["evento_provavel"].sum()), "eventos por mês")


if __name__ == "__main__":
    main()
