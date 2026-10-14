"""
Bloco B2 - análise de conteúdo (Bardin) dos comentários do Google Maps das
luderias aprovadas: contagens por categoria e amostra de controle de qualidade.

A codificação foi feita à mão, comentário por comentário, pelo livro de códigos
de textos/instrumentos/analise_conteudo_bardin_B2.md (§1.4). Cada linha da entrada é um
comentário da base do Notion "B - Comentários (manual)", identificado pelos 6
últimos caracteres do id da página. Os códigos de uma linha vêm separados por
espaço; o sinal final é a polaridade (+ positiva, - negativa, ± mista,
~ neutra). Códigos de contexto (OCA:*, NOV, HOB, DESC, GEEK, NOM, DIV) não têm
polaridade.

Regras de contagem:
  - unidade de enumeração = comentário (presença/ausência do tema; um tema
    conta uma vez por comentário, qualquer que seja o número de frases);
  - cada comentário pertence a um único estabelecimento e cada
    estabelecimento a um único tipo (casa de jogos ou loja com espaço de
    jogo), atribuídos pela tabela ESTAB abaixo;
  - comentários marcados como excluídos não entram em nenhuma contagem;
  - além da frequência simples, a frequência ponderada dá peso igual a cada
    estabelecimento (média das proporções por estabelecimento), para que a
    Luderia Carioca (69 comentários) não domine o resultado.

Entrada:
  _data/processed/[B2] Avaliacoes recentes/analise_conteudo/B2_codificacao_bardin.csv
Saídas na mesma pasta:
  B2_bardin_frequencia_categorias.csv   (categoria x polaridade x tipo)
  B2_bardin_contexto.csv                (códigos de contexto x tipo)
  B2_bardin_estabelecimentos.csv        (comentários analisados por estabelecimento)
  B2_bardin_amostra_controle.csv        (ids sorteados para a recodificação cega)
  B2_bardin_concordancia.csv            (só quando existir a recodificação)

Recodificação: o segundo codificador preenche
  B2_bardin_recodificacao.csv  (colunas id_notion;codigos)
para os ids da amostra, sem ver a coluna "codigos" da codificação original.

Uso:
    python3 "_src/[B2] Google Places (comentarios)/analise_B2_conteudo_bardin.py"
"""
import math
import pathlib
import re

import pandas as pd

ROOT = pathlib.Path(__file__).resolve().parents[2]
PASTA = ROOT / "_data" / "processed" / "[B2] Avaliacoes recentes" / "analise_conteudo"
ENTRADA = PASTA / "B2_codificacao_bardin.csv"
RECODIFICACAO = PASTA / "B2_bardin_recodificacao.csv"

SEMENTE = 20261010
# Amostra de controle: estimar a taxa de comentários com erro de codificação
# (p esperado 10%, margem de 5 p.p., 95%) com correção de população finita.
P_ERRO, MARGEM, Z = 0.10, 0.05, 1.96

C, L = "casa de jogos", "loja com espaço de jogo"
PLAN, FORM = "planilha (até 1 mês)", "formulário (até 3 meses)"
ESTAB = {
    # sigla: (nome no Notion, capital, tipo, lote de coleta)
    "ALC": ("Alçapão Jogos", "Curitiba", C, FORM),
    "ARC": ("Arcadea Gaming Pub", "Porto Alegre", C, PLAN),
    "ARE": ("Arena BG | Jogos de Tabuleiro | Hamburgueria", "São Paulo", C, FORM),
    "ASG": ("Loja de Jogos - Asgard", "Brasília", L, PLAN),
    "BAL": ("Balboa's Hobby Games", "Fortaleza", C, PLAN),
    "BGC": ("Ludoteca BGC", "Brasília", C, PLAN),
    "BOD": ("Bodogami Restaurante e Cafeteria", "São Paulo", C, PLAN),
    "BRV": ("Bravo Jogos", "São Paulo", L, PLAN),
    "BRZ": ("BoardZ Game Pub", "Curitiba", C, PLAN),
    "CAR": ("Cartola Luderia Bar", "São Paulo", C, FORM),
    "CAS": ("Castelos Bar & Boardgames", "São Paulo", C, PLAN),
    "CCG": ("CCG Floripa", "Florianópolis", L, FORM),
    "CGK": ("Café Geek Cafeteria e Ludoteca", "Vitória", C, FORM),
    "CHF": ("Chef on Play", "Florianópolis", C, PLAN),
    "CIN": ("Cineplay- Restaurante e Jogos", "Florianópolis", C, PLAN),
    "CMD": ("Comdado Bar e Jogos", "Belo Horizonte", C, FORM),
    "COL": ("Coletivo Geek", "São Paulo", L, PLAN),
    "COV": ("Covil Game Bar", "São Paulo", C, PLAN),
    "DOM": ("Dominaria Cards & Games", "Fortaleza", L, PLAN),
    "ENC": ("Encounter | Jogos de Tabuleiro | Board Games", "São Paulo", C, PLAN),
    "FAN": ("Fan Hour Games and Burgers", "São Paulo", C, PLAN),
    "FLW": ("Flow Games - Burgers Cards & Comunidade", "São Paulo", L, PLAN),
    "FTL": ("FORTALÚDICA - BURGERS & JOGOS", "Brasília", L, FORM),
    "GAR": ("Garagem do Nerd", "Belo Horizonte", L, FORM),
    "GOB": ("Game Of Boards", "Rio de Janeiro", C, PLAN),
    "GRU": ("Gruta BSB", "Brasília", L, FORM),
    "ILU": ("Ilusões Industriais", "Porto Alegre", L, PLAN),
    "INS": ("Inside Games", "Brasília", L, PLAN),
    "JGS": ("Jogasampa", "São Paulo", C, PLAN),
    "JOY": ("Joyjoy Café", "Curitiba", C, PLAN),
    "LCA": ("Luderia Carioca", "Rio de Janeiro", C, FORM),
    "LCF": ("LudoCafé", "Belo Horizonte", C, PLAN),
    "LUD": ("Ludus Luderia", "São Paulo", C, PLAN),
    "MCH": ("Machado Games", "Vitória", L, PLAN),
    "MSB": ("Magic Store Brazil", "Rio de Janeiro", L, FORM),
    "NAL": ("Nala Land - Bar de Jogos de Tabuleiro em Recife", "Recife", C, FORM),
    "OMN": ("OMNIVERSE", "São Paulo", L, PLAN),
    "PAL": ("Paladins Game Store", "Goiânia", L, PLAN),
    "PEZ": ("Play Easy", "São Paulo", L, PLAN),
    "PIT": ("Pitta's Board Games", "São Paulo", L, PLAN),
    "PLC": ("Place Games", "São Paulo", L, FORM),
    "RED": ("RED jogos", "Rio de Janeiro", L, PLAN),
    "SDQ": ("Ludoteca Sidequest", "Belém", C, PLAN),
    "SHF": ("Shelf Bar e Jogos", "Belo Horizonte", C, PLAN),
    "SJG": ("São Jogue - Bela Vista", "Salvador", C, FORM),
    "TAV": ("Taverna Game House", "Curitiba", L, PLAN),
    "UTP": ("Utopia Games & Food", "Brasília", L, FORM),
    "VCT": ("Vila Celta Hobby Store - Jogos e Café", "Curitiba", L, PLAN),
    "XPL": ("XPlace", "São Paulo", L, PLAN),
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
    df["tipo"] = df["sigla"].map(lambda s: ESTAB[s][2])
    df["lote"] = df["sigla"].map(lambda s: ESTAB[s][3])
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
    amostra = pd.concat(partes)[["id_notion", "sigla", "nota"]]
    amostra["estabelecimento"] = amostra["sigla"].map(lambda s: ESTAB[s][0])
    return amostra.sort_values(["sigla", "id_notion"]), n


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
    junta = base.merge(rec[["id_notion", "pares2"]], on="id_notion")
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


def main():
    df = carrega()
    base = df[df["situacao"] == "analisada"].copy()
    print(df["situacao"].value_counts().to_string())

    cat = tabela_categorias(base)
    cat.to_csv(PASTA / "B2_bardin_frequencia_categorias.csv", sep=";", index=False)
    tabela_contexto(base).to_csv(PASTA / "B2_bardin_contexto.csv", sep=";", index=False)

    estab = base.groupby("sigla").agg(comentarios=("id_notion", "size"),
                                      nota_media=("nota", lambda s: round(s.astype(float).mean(), 2)))
    estab.insert(0, "estabelecimento", estab.index.map(lambda s: ESTAB[s][0]))
    estab.insert(1, "capital", estab.index.map(lambda s: ESTAB[s][1]))
    estab.insert(2, "tipo", estab.index.map(lambda s: ESTAB[s][2]))
    estab.insert(3, "lote de coleta", estab.index.map(lambda s: ESTAB[s][3]))
    estab.to_csv(PASTA / "B2_bardin_estabelecimentos.csv", sep=";")

    # Conferência: as linhas por tipo e por estabelecimento fecham com o total.
    por_tipo = estab.groupby("tipo")["comentarios"].sum()
    print("\npor tipo:", por_tipo.to_dict(), "| soma:", por_tipo.sum(), "| total:", len(base),
          "| diferença:", len(base) - por_tipo.sum())

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


if __name__ == "__main__":
    main()
