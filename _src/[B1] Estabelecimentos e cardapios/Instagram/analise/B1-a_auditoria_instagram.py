"""
Bloco B1 - amostra de auditoria da coleta do Instagram (instagram_coletor.user.js):
fidelidade dos perfis e dos posts à página (_instrucoes/4_metodologia.md §3.4).

Desenho:
- perfis: todos (conferência exaustiva; são poucos e cada um leva um minuto):
  seguidores, número de posts declarado e data do primeiro post;
- posts: 200 posts, cada perfil um estrato, com mínimo de 3 por perfil (ou
  todos, se tiver menos), resto na proporção do número de posts do perfil
  descontado o mínimo, maiores restos e menores chaves da semente
  (_src/extras/amostrar_auditoria.py), o mesmo desenho do B2.
Vale a coleta mais recente de cada perfil (data do nome do arquivo; `_2` é a
segunda do dia).

Entrada: redes_sociais/rs_<cidade>/rs_<perfil>/AAAA-MM-DD_<perfil>_instagram_<perfis|posts>.csv
Saídas em _dados-brutos/redes_sociais/auditoria/ (fora do git, como a pasta):
  B1_auditoria_instagram_perfis.csv
  B1_auditoria_instagram_posts.csv
  auditoria_registro.csv

Conferência: abrir url (post) ou https://www.instagram.com/<perfil>/ e anotar o
que a página mostra. Curtidas e comentários mudam depois da coleta: anotar o
número, a comparação é feita depois, com os dias decorridos ao lado.

Uso:
    python3 "_src/[B1] Estabelecimentos e cardapios/Instagram/analise/B1-a_auditoria_instagram.py"
"""
# Caminhos: _src/extras/ (log comum e sorteio); log em ../logs/
import sys
from pathlib import Path
_AQUI = Path(__file__).resolve()
sys.path[:0] = [str(_AQUI.parents[3] / "extras")]
from log_execucao import registrar_execucao  # noqa: E402
if __name__ == "__main__":
    registrar_execucao(__file__)

import re

import pandas as pd

import amostrar_auditoria as aa

ROOT = Path(__file__).resolve().parents[4]
PROCESSADOS = ROOT / "dados" / "[B1] Estabelecimentos e cardapios"
ENTRADA = PROCESSADOS / "redes_sociais"
SAIDA = PROCESSADOS / "_dados-brutos/redes_sociais/auditoria"

SEMENTE = 20261015
N_POSTS = 200
MINIMO_POR_PERFIL = 3
CONFERIR_PERFIS = ["seguidores_na_pagina", "n_posts_na_pagina", "primeiro_post_na_pagina", "perfil_e_da_casa"]
CONFERIR_POSTS = ["post_existe", "data_confere", "tipo_confere", "curtidas_na_pagina", "comentarios_na_pagina",
                  "legenda_confere"]
NOME = re.compile(r"^(\d{4}-\d{2}-\d{2})_(.+)_instagram_(perfis|posts)(?:_(\d+))?\.csv$")


def coletas(tipo: str) -> list[Path]:
    """Arquivo mais recente de cada perfil para o tipo dado."""
    melhores = {}
    for f in ENTRADA.glob("rs_*/rs_*/*.csv"):
        m = NOME.match(f.name)
        if not m or m.group(3) != tipo:
            continue
        ordem = (m.group(1), int(m.group(4) or 1))
        if m.group(2) not in melhores or ordem > melhores[m.group(2)][0]:
            melhores[m.group(2)] = (ordem, f)
    return [f for _, f in sorted(melhores.values(), key=lambda x: x[1].name)]


def ler(caminhos: list[Path]) -> pd.DataFrame:
    partes = []
    for f in caminhos:
        d = pd.read_csv(f, sep=None, engine="python", dtype=str, encoding="utf-8-sig")
        d["arquivo"] = f.name
        # O perfil coletado vem do nome do arquivo: a coluna perfil traz o autor
        # de cada post, que pode ser um coautor.
        d["perfil_coleta"] = NOME.match(f.name).group(2)
        partes.append(d)
    return pd.concat(partes, ignore_index=True)


def main():
    arq_perfis, arq_posts = coletas("perfis"), coletas("posts")
    perfis = ler(arq_perfis)
    perfis["link_perfil"] = "https://www.instagram.com/" + perfis.perfil_coleta + "/"
    perfis = perfis.drop_duplicates("perfil_coleta", keep="last")
    perfis["estrato_sorteio"], perfis["chave_sorteio"] = "todos", ""
    cols_p = ["estrato_sorteio", "chave_sorteio", "perfil_coleta", "link_perfil", "seguidores", "n_posts_declarado",
              "n_posts_coletados", "primeiro_post", "ultimo_post", "coletado_em", "arquivo"]
    aa.gravar(perfis[cols_p], SAIDA, "B1_auditoria_instagram_perfis.csv", CONFERIR_PERFIS, script=__file__,
              semente="", populacao=len(perfis), origem=arq_perfis, desenho="todos os perfis (exaustivo)")

    posts = ler(arq_posts)
    posts["id_post"] = posts.perfil_coleta + "/" + posts.shortcode
    antes = len(posts)
    posts = posts.drop_duplicates("id_post")
    amostra = aa.sortear(posts, "id_post", N_POSTS, SEMENTE, estrato="perfil_coleta", minimo=MINIMO_POR_PERFIL)
    amostra["legenda_inicio"] = amostra.legenda.fillna("").str.replace(r"\s+", " ", regex=True).str[:120]
    cols = ["estrato_sorteio", "chave_sorteio", "perfil_coleta", "perfil", "url", "data_hora", "tipo", "curtidas", "comentarios",
            "n_midias", "fixado", "legenda_inicio", "arquivo"]
    aa.gravar(amostra[cols], SAIDA, "B1_auditoria_instagram_posts.csv", CONFERIR_POSTS, script=__file__,
              semente=SEMENTE, populacao=len(posts), origem=arq_posts,
              desenho=f"{N_POSTS} posts, estrato = perfil, mínimo {MINIMO_POR_PERFIL}, maiores restos")

    print(f"perfis: {len(perfis)} (todos); posts: {len(posts)} únicos ({antes - len(posts)} repetidos descartados)")
    aa.resumo("B1 Instagram (posts)", len(posts), amostra)
    print(f"gravado em: {SAIDA.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
