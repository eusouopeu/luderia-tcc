"""
Bloco B1 - funções comuns às análises das legendas do Instagram.

Carrega os CSVs de posts exportados pelo coletor (_src/Web scripts/instagram_coletor.user.js),
um por perfil coletado, e devolve uma base com um post por linha.

Regras de atribuição (uma unidade, um grupo):
  - unidade = post, identificado pelo shortcode; o mesmo post pode aparecer em
    mais de um CSV (colaboração entre duas casas coletadas, ou coleta repetida),
    e fica uma vez só, com a linha do arquivo mais recente;
  - cada post pertence ao seu dono (coluna perfil), nunca à página em que foi
    coletado; colaboração conta uma vez, para o dono;
  - entram só posts cujo dono é uma casa da lista aprovada do B1
    (B1_instagram_aprovadas.csv, mais os apelidos de ALIAS); posts de
    parceiros que aparecem na grade de uma casa saem;
  - cada casa recebe um único tipo (tipo_casa: casa de jogos ou loja com espaço de jogo),
    pelo dicionário ESTAB da análise de conteúdo do B2, para que as duas
    análises usem a mesma tipologia.
"""
import importlib.util
import re
import unicodedata
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parents[2]
PASTA_B1 = ROOT / "_data" / "processed" / "[B1] Estabelecimentos e cardapios"
PASTA_REDES = PASTA_B1 / "redes_sociais"
SAIDA = PASTA_REDES / "analise_legendas"
APROVADAS = PASTA_B1 / "B1_instagram_aprovadas.csv"
SCRIPT_B2 = ROOT / "_src" / "[B2] Google Places (comentarios)" / "analise_B2_conteudo_bardin.py"
B2_FREQUENCIA = (ROOT / "_data" / "processed" / "[B2] Avaliacoes recentes" / "analise_conteudo"
                 / "B2_bardin_frequencia_categorias.csv")
B2_CONTEXTO = B2_FREQUENCIA.with_name("B2_bardin_contexto.csv")

# Perfil coletado com @ diferente do registrado na lista aprovada.
ALIAS = {
    "ludocafe_editora": "LudoCafé",
    "dominariacg.sp": "Dominaria Cards & Games",
}
C, L = "casa de jogos", "loja com espaço de jogo"
# Casas aprovadas que não entraram no corpus do B2 (sem comentários no período).
TIPO_EXTRA = {
    "Dungeon Games Store": L,
    "Paladino Hobbies": L,
}

RE_ARQUIVO = re.compile(r"^(?P<data>\d{4}-\d{2}-\d{2})_(?P<pagina>.+?)_instagram_posts(?:_\d+)?\.csv$")


def sem_acento(texto):
    """Minúsculas, sem acento e com # trocado por espaço (hashtag vira palavra)."""
    return tira_acento(str(texto or "")).replace("#", " ")


def tira_acento(texto):
    """Como semAcento() do coletor: tira só as marcas de acento; emoji e pontuação ficam."""
    t = unicodedata.normalize("NFD", texto)
    return "".join(ch for ch in t if not unicodedata.combining(ch)).lower()


def chave_nome(nome):
    return re.sub(r"[^a-z0-9]", "", sem_acento(nome))


def estab_b2():
    """Dicionário ESTAB do script do B2: sigla -> (nome, capital, tipo, lote)."""
    spec = importlib.util.spec_from_file_location("analise_B2", SCRIPT_B2)
    modulo = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(modulo)
    return modulo


def casas():
    """Tabela das casas aprovadas: perfil, estabelecimento, capital, tipo, sigla do B2."""
    apr = pd.read_csv(APROVADAS, sep=";", dtype=str, encoding="utf-8-sig").fillna("")
    apr = apr[apr["instagram_usuario"] != ""]
    b2 = estab_b2().ESTAB
    por_nome = {chave_nome(v[0]): (sigla, v[2]) for sigla, v in b2.items()}
    linhas = []
    for _, r in apr.iterrows():
        sigla, tipo = por_nome.get(chave_nome(r["nome"]), ("", TIPO_EXTRA.get(r["nome"], "")))
        linhas.append({"perfil": r["instagram_usuario"].lower(), "estabelecimento": r["nome"],
                       "capital": r["capital_endereco"], "tipo_casa": tipo, "sigla_b2": sigla})
    tab = pd.DataFrame(linhas)
    for perfil, nome in ALIAS.items():
        base = tab[tab["estabelecimento"] == nome].iloc[0].to_dict()
        tab = pd.concat([tab, pd.DataFrame([{**base, "perfil": perfil}])], ignore_index=True)
    sem_tipo = tab[tab["tipo_casa"] == ""]
    assert sem_tipo.empty, f"casas sem tipo: {sem_tipo['estabelecimento'].tolist()}"
    return tab


def carrega_posts(verbose=True):
    """Base de posts (um por shortcode), só de donos que são casas aprovadas."""
    arquivos = []
    for f in PASTA_REDES.glob("*_instagram_posts*.csv"):
        m = RE_ARQUIVO.match(f.name)
        if m:
            arquivos.append((m["data"], f.name, f))
    partes = []
    for data, nome, f in sorted(arquivos, reverse=True):  # mais recente primeiro
        d = pd.read_csv(f, sep=";", dtype=str, encoding="utf-8-sig").fillna("")
        d["arquivo"], d["data_coleta"] = nome, data
        partes.append(d)
    bruto = pd.concat(partes, ignore_index=True).fillna("")
    n_linhas = len(bruto)
    posts = bruto.drop_duplicates("shortcode", keep="first").copy()
    posts["perfil"] = posts["perfil"].str.lower()

    tab = casas()
    posts = posts.merge(tab, on="perfil", how="left")
    fora = posts[posts["estabelecimento"].isna()]
    posts = posts[posts["estabelecimento"].notna()].copy()

    posts["data"] = pd.to_datetime(posts["data_hora"], errors="coerce")
    for col in ("curtidas", "comentarios", "visualizacoes"):
        posts[col] = pd.to_numeric(posts[col], errors="coerce")
    posts["texto"] = posts["legenda"].map(sem_acento)

    if verbose:
        coletadas = {RE_ARQUIVO.match(n)["pagina"].lower() for _, n, _ in arquivos}
        sem_casa = sorted(coletadas - set(tab["perfil"]))
        print(f"arquivos de posts: {len(arquivos)} | linhas: {n_linhas} | posts únicos: {len(posts) + len(fora)}"
              f" | de casas aprovadas: {len(posts)} | de outros donos (saem): {len(fora)}")
        if sem_casa:
            print("páginas coletadas fora da lista aprovada (saem):", ", ".join(sem_casa))
        print(f"perfis com posts: {posts['perfil'].nunique()} | estabelecimentos: "
              f"{posts['estabelecimento'].nunique()}")
    return posts


def janela(posts, de, ate):
    """Posts publicados entre as datas de e ate, inclusive."""
    fim = pd.Timestamp(ate) + pd.Timedelta(days=1)
    return posts[(posts["data"] >= pd.Timestamp(de)) & (posts["data"] < fim)].copy()


def conferir_soma(partes, total, rotulo):
    """Tabela agregada fecha com o total (CLAUDE.md, princípio das somas)."""
    soma = int(sum(partes))
    print(f"conferência {rotulo}: soma das linhas {soma} | total {total} | diferença {total - soma}")
    assert soma == total, f"{rotulo}: soma {soma} difere do total {total}"


# ---------- eventos nas legendas ----------
# Cópia fiel do classificador do instagram_coletor.user.js (CATEGORIAS e AGENDA),
# para que posts coletados por versões antigas do coletor, sem a coluna evento,
# sejam classificados pela mesma regra. Mudou lá, muda aqui. re.ASCII imita o
# \b do JavaScript, em que º, ª e emoji não são letras.
CATEGORIAS_EVENTO = {
    "noite temática": re.compile(r"\bnoites? (tematica|de|do|da|dos|das)\b|\btematic|\bfesta\b|\bhalloween\b|\bcarnaval\b|\bsao joao\b|\bjunin|\bnatal(ino|ina)?\b|\bdia dos namorados\b|\bkaraoke\b|\bespecial de\b", re.ASCII),
    "workshop/aula": re.compile(r"\bworkshop|\boficina|\baulas?\b|\bcursos?\b|\bpalestra|\baprend(a|er) a jogar\b|\bensina(r|mos) a jogar\b|\biniciac|\biniciantes?\b", re.ASCII),
    "competição": re.compile(r"\bcampeonato|\btorneio|\bcompetic|\bcopa\b|\bligas?\b|\bdesafio|\bpremi(o|os|ac)|\bchaveamento|\bvencedor|\branking\b|\bclassificat", re.ASCII),
    "quiz/bingo": re.compile(r"\bquiz|\btrivia\b|\bperguntas e respostas\b|\bbingo\b", re.ASCII),
    "encontro/RPG": re.compile(r"\bencontros?\b|\bmeetup|\brpg\b|\bone.?shot|\bsessao de\b|\blancamento|\bmesa aberta\b|\bjogatina|\beventos?\b|\bconvidad", re.ASCII),
}
AGENDA = re.compile(r"\b(segunda|terca|quarta|quinta|sexta|sabado|domingo)\b|\bdia \d{1,2}\b|\b\d{1,2} ?h(\d{2})?\b|\b\d{1,2}:\d{2}\b|\b\d{1,2}/\d{1,2}\b|\binscri|\bvagas?\b|\bingressos?\b|\breserv|\bgaranta\b|\blink na bio\b", re.ASCII)


def classificar_evento(legenda):
    """(evento, categorias_evento), com os mesmos valores do coletor."""
    if not legenda:
        return "", ""
    t = tira_acento(legenda)
    cats = [c for c, rx in CATEGORIAS_EVENTO.items() if rx.search(t)]
    if not cats:
        return "não", ""
    return ("provável" if AGENDA.search(t) else "possível"), ", ".join(cats)


# Sorteio e concurso: inflam curtidas e comentários ("marque 3 amigos") e saem
# das comparações de engajamento.
SORTEIO = re.compile(r"\bsorteio|\bsorte(ar|aremos|ado|ada)\b|\bconcorr(a|er|endo|ente)\b|\bgiveaway|\bmarque (\d+|um|uma|dois|duas|tres|seus|sua|o seu|a sua)\b.{0,20}\bamig|\bganhador|\bvencedor do sorteio", re.ASCII)
