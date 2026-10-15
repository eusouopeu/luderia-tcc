"""
Bloco B2 - análise de conteúdo (Bardin) das avaliações do Google Maps das
luderias do objeto: monta o corpus, conta as categorias e sorteia a amostra de
controle de qualidade.

Corpus (opção --corpus): sai direto das coletas do userscript maps_avaliacoes
em dados/[B2] Avaliacoes recentes/_dados-brutos/coletas/.
  - Cada coleta é ligada a um estabelecimento do B1_resumo_estabelecimentos.xlsx
    pelo cid do Google Maps (segunda parte do id_maps).
  - Quando um estabelecimento tem mais de um arquivo de coleta, entra só o mais
    completo: o que tem mais avaliações com texto no recorte; empate pelo maior
    número de avaliações no recorte, depois pelo de linhas lidas, depois pela
    coleta mais recente. Os arquivos não se somam.
  - Recorte do método: rótulo de data até "3 meses atrás", inclusive
    (idade_dias_aprox <= 90; "Editado 3 meses atrás" também entra).
  - Entra só avaliação com texto (tem_texto = sim). O texto usado é o
    texto_avaliacao (já traduzido pelo Google quando traduzida = sim).
  - Cada avaliação recebe um id_avaliacao: os 10 primeiros caracteres do SHA-1
    do review_id do Google, estável entre coletas.

A codificação foi feita à mão, comentário por comentário, pelo livro de códigos
de textos/instrumentos/analise_conteudo_bardin_B2.md (§1.4). Os códigos de uma
linha vêm separados por espaço; o sinal final é a polaridade (+ positiva,
- negativa, ± mista, ~ neutra). Códigos de contexto (OCA:*, NOV, HOB, DESC,
GEEK, NOM, DIV) não têm polaridade.

Regras de contagem:
  - unidade de enumeração = comentário (presença/ausência do tema; um tema
    conta uma vez por comentário, qualquer que seja o número de frases);
  - cada comentário pertence a um único estabelecimento (o da coleta) e cada
    estabelecimento a um único tipo (casa de jogos ou loja com espaço de jogo),
    atribuídos pela tabela ESTAB abaixo;
  - comentários marcados como excluídos não entram em nenhuma contagem;
  - além da frequência simples, a frequência ponderada dá peso igual a cada
    estabelecimento (média das proporções por estabelecimento), para que o
    Bodogami (458 comentários) e o Shelf (243) não dominem o resultado.

Entradas:
  dados/[B2] Avaliacoes recentes/_dados-brutos/coletas/*.csv          (--corpus)
  dados/[B1] Estabelecimentos e cardapios/estabelecimentos/B1_resumo_estabelecimentos.xlsx
  dados/[B2] Avaliacoes recentes/analise_conteudo/B2_codificacao_bardin.csv
Saídas:
  _dados-brutos/analise_conteudo/B2_bardin_corpus.csv  (--corpus; fora do git: tem texto)
  analise_conteudo/B2_bardin_arquivos_coleta.csv        (--corpus; arquivo escolhido por estabelecimento)
  analise_conteudo/B2_bardin_frequencia_categorias.csv  (categoria x polaridade x tipo)
  analise_conteudo/B2_bardin_contexto.csv               (códigos de contexto x tipo)
  analise_conteudo/B2_bardin_estabelecimentos.csv       (comentários analisados por estabelecimento)
  analise_conteudo/B2_bardin_nota_por_categoria.csv     (nota média dos comentários com a menção)
  analise_conteudo/B2_bardin_amostra_controle.csv       (ids sorteados para a recodificação cega)
  analise_conteudo/B2_bardin_concordancia.csv           (só quando existir a recodificação)

Recodificação: o segundo codificador preenche
  B2_bardin_recodificacao.csv  (colunas id_avaliacao;codigos)
para os ids da amostra, sem ver a coluna "codigos" da codificação original.

Uso:
    python3 "_src/[B2] Avaliacoes recentes/Google Places (Comentários)/analise/B2-a_conteudo_bardin.py" --corpus
    python3 "_src/[B2] Avaliacoes recentes/Google Places (Comentários)/analise/B2-a_conteudo_bardin.py"
"""
# Caminhos: _src/extras/ (log comum) e outros/ do objeto (auxiliares); log em ../logs/
import sys
from pathlib import Path
_AQUI = Path(__file__).resolve()
sys.path[:0] = [str(_AQUI.parents[3] / "extras"), str(_AQUI.parents[1] / "outros")]
from log_execucao import registrar_execucao  # noqa: E402
if __name__ == "__main__":
    registrar_execucao(__file__)

import argparse
import hashlib
import math
import pathlib
import re

import pandas as pd

ROOT = pathlib.Path(__file__).resolve().parents[4]
B2 = ROOT / "dados" / "[B2] Avaliacoes recentes"
PASTA = B2 / "analise_conteudo"
COLETAS = B2 / "_dados-brutos" / "coletas"
CORPUS = B2 / "_dados-brutos" / "analise_conteudo" / "B2_bardin_corpus.csv"
RESUMO_B1 = ROOT / "dados" / "[B1] Estabelecimentos e cardapios" / "estabelecimentos" / "B1_resumo_estabelecimentos.xlsx"
ENTRADA = PASTA / "B2_codificacao_bardin.csv"
RECODIFICACAO = PASTA / "B2_bardin_recodificacao.csv"

PERIODO_ATE_DIAS = 90  # rótulo até "3 meses atrás", inclusive
SEMENTE = 20261015
# Amostra de controle: estimar a taxa de comentários com erro de codificação
# (p esperado 10%, margem de 5 p.p., 95%) com correção de população finita.
P_ERRO, MARGEM, Z = 0.10, 0.05, 1.96

C, L = "casa de jogos", "loja com espaço de jogo"
ESTAB = {
    # sigla: (nome no B1_resumo_estabelecimentos, capital, tipo)
    "ALC": ("Alçapão Jogos", "Curitiba", C),
    "ARC": ("Arcadea Gaming Pub", "Porto Alegre", C),
    "ARE": ("Arena BG | Jogos de Tabuleiro | Hamburgueria", "São Paulo", C),
    "ASG": ("Loja de Jogos - Asgard", "Brasília", L),
    "BAL": ("Balboa's Hobby Games", "Fortaleza", C),
    "BDM": ("Bardo Mago", "Belo Horizonte", C),
    "BGC": ("Ludoteca BGC", "Brasília", C),
    "BOD": ("Bodogami Restaurante e Cafeteria", "São Paulo", C),
    "BRV": ("Bravo Jogos", "São Paulo", L),
    "BRZ": ("BoardZ Game Pub", "Curitiba", C),
    "CAR": ("Cartola Luderia Bar", "São Paulo", C),
    "CAS": ("Castelos Bar & Boardgames", "São Paulo", C),
    "CCG": ("CCG Floripa", "Florianópolis", L),
    "CGK": ("Café Geek Cafeteria e Ludoteca", "Vitória", C),
    "CHF": ("Chef on Play", "Florianópolis", C),
    "CIN": ("Cineplay- Restaurante e Jogos", "Florianópolis", C),
    "CMD": ("Comdado Bar e Jogos", "Belo Horizonte", C),
    "COL": ("Coletivo Geek", "São Paulo", L),
    "COV": ("Covil Game Bar", "São Paulo", C),
    "DOM": ("Dominaria Cards & Games", "Fortaleza", L),
    "DUN": ("Dungeon Games Store", "São Paulo", L),
    "ENC": ("Encounter | Jogos de Tabuleiro | Board Games", "São Paulo", C),
    "FAN": ("Fan Hour Games and Burgers", "São Paulo", C),
    "FLW": ("Flow Games - Burgers, Cards & Comunidade", "São Paulo", L),
    "FTL": ("FORTALÚDICA - BURGERS & JOGOS", "Brasília", L),
    "GAR": ("Garagem do Nerd", "Belo Horizonte", L),
    "GOB": ("Game Of Boards", "Rio de Janeiro", C),
    "GRU": ("Gruta BSB", "Brasília", L),
    "INS": ("Inside Games", "Brasília", L),
    "JGS": ("Jogasampa", "São Paulo", C),
    "JOY": ("Joyjoy Café", "Curitiba", C),
    "LCA": ("Luderia Carioca", "Rio de Janeiro", C),
    "LCF": ("LudoCafé", "Belo Horizonte", C),
    "LTB": ("La Tabuleria", "Belo Horizonte", C),
    "LUD": ("Ludus Luderia", "São Paulo", C),
    "MSB": ("Magic Store Brazil", "Rio de Janeiro", L),
    "NAL": ("Nala Land - Bar de Jogos de Tabuleiro em Recife", "Recife", C),
    "OMN": ("OMNIVERSE", "São Paulo", L),
    "PAL": ("Paladins Game Store", "Goiânia", L),
    "PDH": ("Paladino Hobbies", "Curitiba", L),
    "PEZ": ("Play Easy", "São Paulo", L),
    "PIT": ("Pitta's Board Games", "São Paulo", L),
    "PLC": ("Place Games", "São Paulo", L),
    "RED": ("RED jogos", "Rio de Janeiro", L),
    "SDQ": ("Ludoteca Sidequest", "Belém", C),
    "SHF": ("Shelf Bar e Jogos", "Belo Horizonte", C),
    "SJG": ("São Jogue - Bela Vista", "Salvador", C),
    "TAV": ("Taverna Game House", "Curitiba", L),
    "TBC": ("TabuClub", "Rio de Janeiro", C),
    "TOC": ("Toca do Rato - Pizzaria e Jogos de Tabuleiro", "Porto Alegre", C),
    "TUB": ("Tubaleria", "São Paulo", C),
    "UTP": ("Utopia Games & Food", "Brasília", L),
    "VCT": ("Vila Celta Hobby Store - Jogos e Café", "Curitiba", L),
    "XPL": ("XPlace", "São Paulo", L),
}

CATEGORIAS = {  # códigos com polaridade
    "ACV": "Acervo de jogos", "MED": "Mediação lúdica (monitoria)", "ATD": "Atendimento e hospitalidade",
    "AB": "Alimentos e bebidas", "TMP": "Tempo de serviço e erros de pedido", "PRC": "Preço e valor percebido",
    "AMB": "Ambiente físico e conforto", "RUI": "Ruído", "CAP": "Capacidade, reserva e fila",
    "PRG": "Programação e atrações", "COMU": "Comunidade de jogadores", "VAR": "Varejo e pós-venda",
    "LOC": "Localização e acesso", "INC": "Segurança, inclusão e respeito", "RET": "Retorno declarado",
    "GEN": "Avaliação genérica",
}
CONTEXTO = {  # códigos sem polaridade
    "OCA:ami": "Ocasião: amigos", "OCA:fam": "Ocasião: família ou crianças", "OCA:casal": "Ocasião: casal",
    "OCA:aniv": "Ocasião: aniversário ou comemoração", "NOV": "Sinal de iniciante/não jogador",
    "HOB": "Sinal de hobbyista", "DESC": "Desconexão de telas", "DIV": "Diversão como benefício",
    "GEEK": "Identidade geek do espaço", "NOM": "Funcionário citado pelo nome",
}
RE_CODIGO = re.compile(r"^(?P<cat>[A-Z]+(?::[a-z]+)?)(?P<pol>[+\-±~]?)$")


def id_avaliacao(review_id):
    return hashlib.sha1(review_id.encode()).hexdigest()[:10]


def monta_corpus():
    """Um arquivo de coleta por estabelecimento (o mais completo); avaliações com texto até '3 meses atrás'."""
    resumo = pd.read_excel(RESUMO_B1, dtype=str)
    resumo["cid"] = resumo["link_google_maps"].str.extract(r"cid=(\d+)", expand=False)
    sigla_por_nome = {v[0]: k for k, v in ESTAB.items()}
    faltam = set(resumo["nome"]) - set(sigla_por_nome)
    assert not faltam, f"estabelecimentos do B1 sem sigla em ESTAB: {faltam}"
    sigla_por_cid = resumo.set_index("cid")["nome"].map(sigla_por_nome)

    candidatos, tabelas = [], {}
    for arq in sorted(COLETAS.glob("*.csv")):
        df = pd.read_csv(arq, sep=";", dtype=str, encoding="utf-8-sig", keep_default_na=False)
        df = df.drop_duplicates("review_id")
        cid = str(int(df["id_maps"].iloc[0].rsplit(":0x", 1)[1], 16))
        if cid not in sigla_por_cid:
            print(f"Aviso: {arq.name} não corresponde a nenhum estabelecimento do B1; fica fora do corpus.")
            continue
        df["idade"] = pd.to_numeric(df["idade_dias_aprox"], errors="coerce")
        no_recorte = df[df["idade"] <= PERIODO_ATE_DIAS]
        tabelas[arq.name] = no_recorte
        candidatos.append({
            "sigla": sigla_por_cid[cid], "arquivo": arq.name,
            "com_texto_no_recorte": int((no_recorte["tem_texto"] == "sim").sum()),
            "no_recorte": len(no_recorte), "linhas": len(df), "coletado_em": df["coletado_em"].max(),
            "motivo_parada": df["motivo_parada"].iloc[0],
        })
    cand = pd.DataFrame(candidatos)
    cand = cand.sort_values(["sigla", "com_texto_no_recorte", "no_recorte", "linhas", "coletado_em"],
                            ascending=[True, False, False, False, False])
    cand["escolhido"] = (~cand.duplicated("sigla")).map({True: "sim", False: "não"})
    sem_coleta = set(ESTAB) - set(cand["sigla"])
    if sem_coleta:
        print(f"Aviso: sem coleta: {sorted(sem_coleta)}")

    partes = []
    for _, c in cand[cand["escolhido"] == "sim"].iterrows():
        t = tabelas[c["arquivo"]]
        t = t[t["tem_texto"] == "sim"]
        partes.append(pd.DataFrame({
            "id_avaliacao": t["review_id"].map(id_avaliacao), "sigla": c["sigla"],
            "nota": t["nota_avaliacao"], "data_relativa": t["data_relativa"],
            "texto": t["texto_avaliacao"].str.replace(r"\s+", " ", regex=True).str.strip(),
        }))
    corpus = pd.concat(partes, ignore_index=True)
    assert corpus["id_avaliacao"].is_unique, "id_avaliacao repetido no corpus"
    # Conferência: corpus = soma dos comentários com texto dos arquivos escolhidos.
    esperado = cand.loc[cand["escolhido"] == "sim", "com_texto_no_recorte"].sum()
    assert len(corpus) == esperado, f"corpus {len(corpus)} != soma dos arquivos {esperado}"
    CORPUS.parent.mkdir(parents=True, exist_ok=True)
    corpus.to_csv(CORPUS, sep=";", index=False, encoding="utf-8-sig")
    cand.to_csv(PASTA / "B2_bardin_arquivos_coleta.csv", sep=";", index=False)
    print(f"Corpus: {len(corpus)} comentários com texto até '3 meses atrás', "
          f"{corpus['sigla'].nunique()} estabelecimentos; {(cand['escolhido'] == 'não').sum()} arquivos "
          f"repetidos descartados (diferença da conferência: {esperado - len(corpus)}).")


def le_codigos(texto):
    """'ATD+ OCA:ami AB±' -> [('ATD', '+'), ('OCA:ami', ''), ('AB', '±')]."""
    pares = []
    for token in str(texto or "").split():
        m = RE_CODIGO.match(token)
        if not m or (m["cat"] not in CATEGORIAS and m["cat"] not in CONTEXTO):
            raise ValueError(f"código inválido: {token!r}")
        pares.append((m["cat"], m["pol"]))
    return pares


def carrega():
    df = pd.read_csv(ENTRADA, sep=";", dtype=str).fillna("")
    desconhecidas = set(df["sigla"]) - set(ESTAB)
    assert not desconhecidas, f"siglas sem estabelecimento: {desconhecidas}"
    if CORPUS.exists():
        corpus = pd.read_csv(CORPUS, sep=";", dtype=str, encoding="utf-8-sig")
        so_cod, so_corpus = set(df["id_avaliacao"]) - set(corpus["id_avaliacao"]), set(corpus["id_avaliacao"]) - set(df["id_avaliacao"])
        assert not so_cod and not so_corpus, f"codificação e corpus não batem: {len(so_cod)} só na codificação, {len(so_corpus)} só no corpus"
    assert df["id_avaliacao"].is_unique, "id_avaliacao repetido na codificação"
    df["tipo"] = df["sigla"].map(lambda s: ESTAB[s][2])
    df["pares"] = df["codigos"].map(le_codigos)
    return df


def tabela_categorias(base):
    """Linhas: categoria x polaridade; colunas: total e por tipo; menções = comentários."""
    linhas = []
    for cat, nome in CATEGORIAS.items():
        for pol, rotulo in (("", "qualquer"), ("+", "positiva"), ("-", "negativa"), ("±", "mista"), ("~", "neutra")):
            linha = {"código": cat, "categoria": nome, "polaridade": rotulo}
            for grupo, sub in (("total", base), (C, base[base.tipo == C]), (L, base[base.tipo == L])):
                tem = sub["pares"].map(lambda ps: any(c == cat and (pol == "" or p == pol) for c, p in ps))
                linha[f"{grupo}: comentários"] = int(tem.sum())
                linha[f"{grupo}: % dos comentários"] = round(100 * tem.mean(), 1)
                por_estab = tem.groupby(sub["sigla"]).mean()
                linha[f"{grupo}: % ponderado por estabelecimento"] = round(100 * por_estab.mean(), 1)
                linha[f"{grupo}: estabelecimentos com menção"] = int((tem.groupby(sub["sigla"]).sum() > 0).sum())
            linhas.append(linha)
    return pd.DataFrame(linhas)


def tabela_contexto(base):
    linhas = []
    for cod, nome in CONTEXTO.items():
        linha = {"código": cod, "categoria": nome}
        for grupo, sub in (("total", base), (C, base[base.tipo == C]), (L, base[base.tipo == L])):
            tem = sub["pares"].map(lambda ps: any(c == cod for c, _ in ps))
            linha[f"{grupo}: comentários"] = int(tem.sum())
            linha[f"{grupo}: % dos comentários"] = round(100 * tem.mean(), 1)
        linhas.append(linha)
    return pd.DataFrame(linhas)


def tabela_notas(base):
    """Nota média dos comentários com a categoria em cada polaridade (casas de jogos e total)."""
    nota = base["nota"].astype(float)
    linhas = []
    for cod in list(CATEGORIAS) + list(CONTEXTO):
        for pol, rotulo in (("", "qualquer"), ("+", "positiva"), ("-", "negativa")):
            if cod in CONTEXTO and pol:
                continue
            tem = base["pares"].map(lambda ps: any(c == cod and (pol == "" or p == pol) for c, p in ps))
            casa = tem & (base.tipo == C)
            linhas.append({"código": cod, "polaridade": rotulo, "comentários": int(tem.sum()),
                           "nota média": round(nota[tem].mean(), 2) if tem.any() else "",
                           f"{C}: comentários": int(casa.sum()),
                           f"{C}: nota média": round(nota[casa].mean(), 2) if casa.any() else ""})
    return pd.DataFrame(linhas)


def tamanho_amostra(n_pop):
    n0 = Z**2 * P_ERRO * (1 - P_ERRO) / MARGEM**2
    return math.ceil(n0 / (1 + (n0 - 1) / n_pop))


def sorteia_amostra(base):
    """Estratificada por estabelecimento: alocação proporcional, mínimo de 1 por estabelecimento."""
    n = tamanho_amostra(len(base))
    tamanhos = base.groupby("sigla").size()
    cotas = (tamanhos / tamanhos.sum() * n).map(math.floor).clip(lower=1)
    # Distribui o que falta pelos maiores restos, sem passar do tamanho do estrato.
    restos = (tamanhos / tamanhos.sum() * n) - (tamanhos / tamanhos.sum() * n).map(math.floor)
    for sigla in restos.sort_values(ascending=False).index:
        if cotas.sum() >= n:
            break
        if cotas[sigla] < tamanhos[sigla]:
            cotas[sigla] += 1
    partes = [
        base[base.sigla == s].sample(n=int(min(k, tamanhos[s])), random_state=SEMENTE)
        for s, k in cotas.items()
    ]
    amostra = pd.concat(partes)[["id_avaliacao", "sigla", "nota"]]
    amostra["estabelecimento"] = amostra["sigla"].map(lambda s: ESTAB[s][0])
    return amostra.sort_values(["sigla", "id_avaliacao"]), n


def kappa(a, b):
    """Kappa de Cohen para dois vetores binários."""
    n = len(a)
    po = sum(x == y for x, y in zip(a, b)) / n
    pa, pb = sum(a) / n, sum(b) / n
    pe = pa * pb + (1 - pa) * (1 - pb)
    return float("nan") if pe == 1 else (po - pe) / (1 - pe)


def concordancia(base):
    rec = pd.read_csv(RECODIFICACAO, sep=";", dtype=str).fillna("")
    rec["pares2"] = rec["codigos"].map(le_codigos)
    junta = base.merge(rec[["id_avaliacao", "pares2"]], on="id_avaliacao")
    linhas = []
    for cat in list(CATEGORIAS) + list(CONTEXTO):
        a = junta["pares"].map(lambda ps: any(c == cat for c, _ in ps)).astype(int).tolist()
        b = junta["pares2"].map(lambda ps: any(c == cat for c, _ in ps)).astype(int).tolist()
        n = len(a)
        po = sum(x == y for x, y in zip(a, b)) / n
        ambos = [(x, y) for x, y in zip(a, b) if x and y]
        pol_igual = sum(
            dict(p1).get(cat) == dict(p2).get(cat)
            for p1, p2, x, y in zip(junta["pares"], junta["pares2"], a, b) if x and y
        )
        linhas.append({
            "código": cat, "n": n, "positivos codificador 1": sum(a), "positivos codificador 2": sum(b),
            "concordância observada": round(po, 3), "kappa": round(kappa(a, b), 3),
            "PABAK": round(2 * po - 1, 3),
            "polaridade igual (quando ambos marcam)": f"{pol_igual}/{len(ambos)}" if cat in CATEGORIAS else "",
        })
    erro = (junta["pares"].map(lambda ps: sorted(ps)) != junta["pares2"].map(lambda ps: sorted(ps)))
    k, n = int(erro.sum()), len(erro)
    p = k / n
    centro = (p + Z**2 / (2 * n)) / (1 + Z**2 / n)
    meia = Z * math.sqrt(p * (1 - p) / n + Z**2 / (4 * n**2)) / (1 + Z**2 / n)
    print(f"\ncomentários com alguma divergência: {k}/{n} = {100*p:.1f}% "
          f"(IC 95% de Wilson: {100*(centro-meia):.1f}% a {100*(centro+meia):.1f}%)")
    return pd.DataFrame(linhas)


def analisa():
    df = carrega()
    base = df[df["situacao"] == "analisada"].copy()
    print(df["situacao"].value_counts().to_string())

    cat = tabela_categorias(base)
    cat.to_csv(PASTA / "B2_bardin_frequencia_categorias.csv", sep=";", index=False)
    tabela_contexto(base).to_csv(PASTA / "B2_bardin_contexto.csv", sep=";", index=False)
    tabela_notas(base).to_csv(PASTA / "B2_bardin_nota_por_categoria.csv", sep=";", index=False)

    estab = base.groupby("sigla").agg(comentarios=("id_avaliacao", "size"),
                                      nota_media=("nota", lambda s: round(s.astype(float).mean(), 2)))
    estab.insert(0, "estabelecimento", estab.index.map(lambda s: ESTAB[s][0]))
    estab.insert(1, "capital", estab.index.map(lambda s: ESTAB[s][1]))
    estab.insert(2, "tipo", estab.index.map(lambda s: ESTAB[s][2]))
    estab.to_csv(PASTA / "B2_bardin_estabelecimentos.csv", sep=";")

    # Conferência: as linhas por tipo e por estabelecimento fecham com o total.
    por_tipo = estab.groupby("tipo")["comentarios"].sum()
    print("\npor tipo:", por_tipo.to_dict(), "| soma:", por_tipo.sum(), "| total:", len(base),
          "| diferença:", len(base) - por_tipo.sum())
    assert por_tipo.sum() == len(base) == estab["comentarios"].sum()

    amostra, n = sorteia_amostra(base)
    amostra.to_csv(PASTA / "B2_bardin_amostra_controle.csv", sep=";", index=False)
    print(f"\namostra de controle: {len(amostra)} comentários (alvo {n}), semente {SEMENTE}")

    if RECODIFICACAO.exists():
        conc = concordancia(base)
        conc.to_csv(PASTA / "B2_bardin_concordancia.csv", sep=";", index=False)
        print(conc.to_string(index=False))

    resumo = cat[cat.polaridade.isin(["qualquer", "negativa"])][[
        "código", "polaridade", "total: comentários", "total: % dos comentários",
        "total: % ponderado por estabelecimento", f"{C}: % dos comentários", f"{L}: % dos comentários"]]
    print("\n" + resumo.to_string(index=False))


def main():
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[1])
    ap.add_argument("--corpus", action="store_true", help="monta o corpus a partir das coletas e para")
    args = ap.parse_args()
    if args.corpus:
        monta_corpus()
    else:
        analisa()


if __name__ == "__main__":
    main()
