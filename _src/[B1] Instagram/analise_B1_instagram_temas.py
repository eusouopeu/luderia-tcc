"""
Bloco B1 - temas das legendas do Instagram das casas aprovadas, pelas mesmas
categorias da análise de conteúdo do B2 (livro de códigos em
textos/instrumentos/analise_conteudo_bardin_B2.md, §1.4).

Pergunta: o que as casas anunciam (legendas) bate com o que os clientes
elogiam ou criticam (avaliações do Google, B2)? Tema muito anunciado e pouco
citado pelos clientes, ou o contrário, orienta a comunicação (cap. 6) e a
operação (cap. 7).

Método: codificação automática por dicionário. Cada categoria do B2 aplicável
a uma legenda recebe uma lista de termos (TEMAS); a legenda é marcada com a
categoria quando contém ao menos um termo. Diferenças em relação ao B2:
  - sem polaridade: legenda é peça de divulgação, sempre favorável;
  - TMP, RUI, RET, GEN e NOM não se aplicam a legendas e ficam de fora;
  - PRG também é marcada quando o classificador de eventos do coletor aponta
    evento (provável ou possível);
  - SOR (sorteio ou concurso) é categoria própria das legendas, sem par no B2;
  - o nome da casa e o @ são apagados da legenda antes da busca, para que
    "Joyjoy Café" não conte como AB nem "Fan Hour Games and Burgers" como AB.

Contagem:
  - unidade = post, atribuído ao dono (instagram_comum.carrega_posts);
  - presença/ausência: um tema conta uma vez por post;
  - categorias não exclusivas: um post pode ter várias, e a soma das linhas
    não fecha com o total de posts por desenho;
  - janela comum de 24 meses (JANELA_DE a JANELA_ATE), para que perfis
    antigos não pesem mais; casas com menos de MIN_POSTS posts na janela
    ficam fora das médias ponderadas;
  - % ponderado por estabelecimento = média das proporções por casa (mesma
    regra do B2), para que perfis que postam muito não dominem.

Validação: o dicionário erra. VALIDACAO sorteia N_VALIDACAO posts marcados por
categoria; o autor preenche a coluna "correto" (sim/não) e, quando o arquivo
preenchido existe, o script calcula a precisão por categoria com IC 95% de
Wilson. Sensibilidade (temas que o dicionário não pega) não é medida.

Saídas em dados/[B1] Estabelecimentos e cardapios/redes_sociais/analise_legendas/temas/:
  B1_instagram_temas_por_post.csv          (shortcode x categorias marcadas, sem a legenda)
  B1_instagram_temas_frequencia.csv        (categoria x tipo de casa, com o B2 ao lado)
  B1_instagram_temas_por_estabelecimento.csv (casa x categoria, % dos posts)
  B1_instagram_temas_validacao.csv         (amostra para conferência manual; não é sobrescrita)
  B1_instagram_temas_precisao.csv          (só quando a validação estiver preenchida)

Uso:
    python3 "_src/[B1] Instagram/analise_B1_instagram_temas.py"
"""
import math
import re

import pandas as pd

import instagram_comum as ic

SAIDA = ic.SAIDA / "temas"

JANELA_DE, JANELA_ATE = "2024-10-01", "2026-09-30"
MIN_POSTS = 20
N_VALIDACAO = 25
SEMENTE = 20261013
Z = 1.96

# Termos sobre o texto sem acento e em minúsculas (instagram_comum.sem_acento).
# Prefixos (\bhamburg) pegam as variações; \b nas pontas evita pedaços de palavra.
TEMAS = {
    "ACV": r"\bacervo|\bludoteca|\bestante\b|\bprateleira|\bnovos jogos\b|\bjogos? novos?\b|\bnovidades? (no|na|do|da) (acervo|ludoteca|estante)|\bmais de \d+ (jogos|titulos)|\b\d+ (jogos|titulos) (disponiveis|no acervo|para jogar)|\bconsoles?\b|\bfliperamas?\b|\bplaystation|\bxbox\b|\bnintendo\b|\bswitch\b",
    "MED": r"\bmonitor(es|as?|ia)?\b|\bmestres? de jogos?\b|\bgame ?masters?\b|\bexplica(mos|r|m|ndo)? (as |a |o )?(regras?|jogo)|\bensina(mos|r|m|ndo)? (a jogar|as regras|o jogo)|\bte ensina|\bajuda(mos|r)? (voce )?a escolher|\bnao sabe jogar|\bsommelier de jogos",
    "ATD": r"\batendimento|\bequipe\b|\bnosso time\b|\bfuncionari[oa]s?\b|\bgarcom|\bgarcons|\bgarconete|\batendentes?\b|\bstaff\b|\bhospitalidade|\bbem atendid|\bbem recebid",
    "AB": r"\bcardapio|\bmenu\b|\bcomida|\bcomer\b|\blanches?\b|\bburgers?\b|\bhamburg|\bsmash|\bpizzas?\b|\bporcao|\bporcoes|\bpetiscos?\b|\bbatatas?\b|\bfritas\b|\bdrinks?\b|\bcoquete|\bchopp?\b|\bcervej|\bbebidas?\b|\bcafes?\b|\bcafezinho|\bcappuccino|\bsobremesas?\b|\bdoces?\b|\bbolos?\b|\bsalgad|\bpratos?\b|\brodizio|\bvegan|\bvegetarian|\bcozinha\b|\bsucos?\b|\brefri|\bmilk ?shake|\bnachos?\b|\bsanduiche|\bhot ?dogs?\b|\bpasteis\b|\bpastel\b|\bhappy hour|\bgastronom|\bchef\b",
    "PRC": r"r\$ ?\d|\bprecos?\b|\bvalor(es)?\b|\bcouvert|\btaxa\b|\bpromoc|\bdesconto|\b\d+ ?% ?off\b|\bcupom|\bgratis\b|\bgratuit|\bde graca\b|\bmeia[- ]entrada|\bcashback|\bpague\b|\bcombo promocional",
    "AMB": r"\bambiente|\baconcheg|\bdecorac|\bclimatizad|\bar[- ]condicionado|\bconfort|\bespaco (amplo|reformado|aconchegante|novo)|\breforma(mos|do|da)?\b|\bmesas? novas|\bcadeiras?\b|\bbanheiros?\b|\bcenario|\binstagramavel",
    "CAP": r"\breserv|\blotad|\blotacao|\bcapacidade|\bgaranta (ja )?(a )?sua (mesa|reserva)|\bfila\b|\bhorario de funcionamento|\bhorario especial|\bfuncionamento|\babrimos|\b(estamos|estaremos) abertos|\babert[oa]s? (hoje|amanha|no feriado|normalmente)|\bfechad[oa]s?\b|\bfuncionaremos|\bnao abriremos|\bmesas? disponive",
    "PRG": r"\bsinuca|\bescape\b|\bkaraoke|\bpalco\b|\bshows?\b|\bmusica ao vivo|\bpre-?lancamento|\bpre-?release|\btorneio|\bcampeonato|\bquiz|\btrivia\b|\bprogramacao",
    "COMU": r"\bcomunidade|\bfazer amig|\bnovas amizades|\bconhecer (gente|pessoas)|\bjogadores (frequentes|da casa)|\btodos (sao )?bem-?vindos|\bsem preconceito|\bnossa familia\b|\bgrupo (do|no|de) (whats|zap|telegram)|\bdiscord\b",
    "VAR": r"\bloja\b|\b(a|em) venda\b|\bpre-?venda|\bvendemos|\bcompre\b|\bcompra(r|s)?\b|\bestoque|\bfrete|\benvio|\bentrega(mos|s)?\b|\bdelivery|\bparcel|\bsem juros|\bloja virtual|\bsite\b|\bboosters?\b|\bsleeves?\b|\balug|\blocacao|\blocadora|\bchegou\b|\bchegaram\b|\breposicao",
    "LOC": r"\bendereco|\blocaliza(cao|do|da|dos)\b|\bestamos na\b|\bficamos na\b|\b(rua|av\.?|avenida|alameda|travessa) [a-z0-9]|\bmetro\b|\bestacionamento|\bvalet\b|\bcomo chegar|\bnova (sede|unidade|casa|loja)\b|\bnovo endereco|\bmudamos|\bshopping",
    "INC": r"\bacessibil|\bacessivel|\bpcd\b|\bcadeirantes?\b|\blgbt|\bdiversidade|\binclus(ao|ivo|iva)\b|\bassedio|\bracismo|\bpreconceito|\brespeito\b",
    "OCA:ami": r"\bamig[oa]s?\b|\bturma\b|\bparceir[oa]s de jogo",
    "OCA:fam": r"\bfamilia\b|\bcriancas?\b|\bfilh[oa]s?\b|\bkids\b|\binfant|\bdia das criancas|\bdia dos pais|\bdia das maes|\bbaixinhos",
    "OCA:casal": r"\bcasal\b|\bcasais\b|\bdia dos namorados|\bnamorad|\bdate\b",
    "OCA:aniv": r"\baniversari|\bcomemor|\bconfraterniz|\bfestas? (de|da|do) (empresa|firma|fim de ano)|\beventos? (privados?|fechados?|corporativos?)|\bbuffet",
    "NOV": r"\biniciantes?\b|\bnunca jog|\bprimeira vez|\bfacil de aprender|\bregras simples|\bpara quem (esta|ta) comecando|\bnao precisa saber|\bsem experiencia|\bpara todos os publicos|\bleigos?\b|\bcasua(l|is)\b",
    "HOB": r"\bcompetitiv|\branking|\bmetagame|\bdecks?\b|\btcg\b|\bmagic\b|\bmtg\b|\bpokemon|\byu-?gi-?oh|\bone piece\b|\blorcana|\bflesh and blood|\bcommander\b|\bdraft\b|\bpre-?release|\bcolecion|\bwargames?\b|\bminiaturas?\b|\bwarhammer|\beurogames?\b|\bkickstarter|\bcatarse\b|\bgamefound",
    "DESC": r"\bdesconect|\bsem (celular|telas?)\b|\blonge (do celular|das telas)|\boff-?line\b|\bolho no olho|\blarga(r)? o celular",
    "DIV": r"\bdiversao|\bdivertid|\brisadas|\bresenha\b|\bse divertir",
    "GEEK": r"\bgeeks?\b|\bnerds?\b|\botakus?\b|\banimes?\b|\bcosplay",
}
NOMES = {**ic.estab_b2().CATEGORIAS, **ic.estab_b2().CONTEXTO, "SOR": "Sorteio ou concurso (só legendas)"}
CODIGOS = list(TEMAS) + ["SOR"]
RX = {c: re.compile(t, re.ASCII) for c, t in TEMAS.items()}
SAIDA_VALIDACAO = SAIDA / "B1_instagram_temas_validacao.csv"
# Formas do nome que as legendas usam e que contêm termo de tema
# ("Ludoteca BGC" não é ACV; "Café Geek" não é AB).
NOME_NA_LEGENDA = {
    "Café Geek Cafeteria e Ludoteca": ["cafe geek"],
    "Joyjoy Café": ["joy joy cafe"],
    "Chef on Play": ["chef on play"],
    "Bodogami Restaurante e Cafeteria": ["restaurante e cafeteria"],
}


def texto_sem_nome(linha):
    """Legenda sem o nome da casa e sem o @, para o nome não virar tema."""
    t = linha["texto"]
    nome = ic.sem_acento(linha["estabelecimento"])
    termos = [nome, linha["perfil"], *re.split(r"\s*[|\-–]\s*", nome),
              *NOME_NA_LEGENDA.get(linha["estabelecimento"], [])]
    for termo in sorted({x.strip() for x in termos if len(x.strip()) > 3}, key=len, reverse=True):
        t = t.replace(termo, " ")
    return t


def codifica(posts):
    texto = posts.apply(texto_sem_nome, axis=1)
    cod = pd.DataFrame(index=posts.index)
    for c, rx in RX.items():
        cod[c] = texto.map(lambda t: bool(rx.search(t)))
    evento = posts["legenda"].map(lambda l: ic.classificar_evento(l)[0])
    cod["PRG"] |= evento.isin(["provável", "possível"])
    cod["SOR"] = posts["texto"].map(lambda t: bool(ic.SORTEIO.search(t)))
    cod.loc[posts["legenda"].str.strip() == "", CODIGOS] = False
    return cod


def tabela_frequencia(base, cod):
    grupos = (("total", base.index), (ic.C, base.index[base["tipo_casa"] == ic.C]),
              (ic.L, base.index[base["tipo_casa"] == ic.L]))
    b2 = pd.read_csv(ic.B2_FREQUENCIA, sep=";", dtype=str)
    b2 = b2[b2["polaridade"] == "qualquer"]
    # Códigos de contexto do B2 só têm a proporção simples.
    b2 = pd.concat([b2, pd.read_csv(ic.B2_CONTEXTO, sep=";", dtype=str)]).set_index("código")
    linhas = []
    for c in CODIGOS:
        linha = {"código": c, "categoria": NOMES[c]}
        for g, idx in grupos:
            tem = cod.loc[idx, c]
            por_casa = tem.groupby(base.loc[idx, "perfil_casa"]).mean()
            linha[f"{g}: posts com o tema"] = int(tem.sum())
            linha[f"{g}: % dos posts"] = round(100 * tem.mean(), 1)
            linha[f"{g}: % ponderado por estabelecimento"] = round(100 * por_casa.mean(), 1)
            linha[f"{g}: estabelecimentos com o tema"] = int((tem.groupby(base.loc[idx, "perfil_casa"]).sum() > 0).sum())
            if c in b2.index:
                simples = b2.loc[c, f"{g}: % dos comentários"]
                ponderado = b2.loc[c].get(f"{g}: % ponderado por estabelecimento")
                linha[f"{g}: B2 avaliações, % dos comentários"] = float(simples)
                if pd.notna(ponderado):
                    linha[f"{g}: B2 avaliações, % ponderado"] = float(ponderado)
                    linha[f"{g}: diferença ponderada legendas - B2 (p.p.)"] = round(
                        linha[f"{g}: % ponderado por estabelecimento"] - float(ponderado), 1)
        linhas.append(linha)
    return pd.DataFrame(linhas)


def wilson(k, n):
    if n == 0:
        return float("nan"), float("nan")
    p = k / n
    centro = (p + Z**2 / (2 * n)) / (1 + Z**2 / n)
    meia = Z * math.sqrt(p * (1 - p) / n + Z**2 / (4 * n**2)) / (1 + Z**2 / n)
    return round(100 * (centro - meia), 1), round(100 * (centro + meia), 1)


def amostra_validacao(base, cod):
    partes = []
    for c in CODIGOS:
        marcados = base[cod[c]]
        s = marcados.sample(n=min(N_VALIDACAO, len(marcados)), random_state=SEMENTE)
        partes.append(pd.DataFrame({
            "código": c, "categoria": NOMES[c], "shortcode": s["shortcode"], "url": s["url"],
            "estabelecimento": s["estabelecimento"], "legenda": s["legenda"].str.slice(0, 600),
            "correto": "",
        }))
    return pd.concat(partes, ignore_index=True)


def precisao():
    val = pd.read_csv(SAIDA_VALIDACAO, sep=";", dtype=str).fillna("")
    val = val[val["correto"].str.strip().str.lower().isin(["sim", "não", "nao"])]
    if val.empty:
        return None
    linhas = []
    for c, g in val.groupby("código", sort=False):
        k, n = int((g["correto"].str.strip().str.lower() == "sim").sum()), len(g)
        lo, hi = wilson(k, n)
        linhas.append({"código": c, "categoria": NOMES[c], "conferidos": n, "corretos": k,
                       "precisão (%)": round(100 * k / n, 1), "IC 95% Wilson (%)": f"{lo} a {hi}"})
    return pd.DataFrame(linhas)


def main():
    SAIDA.mkdir(parents=True, exist_ok=True)
    posts = ic.carrega_posts()
    base = ic.janela(posts, JANELA_DE, JANELA_ATE)
    # Uma casa pode ter dois @ (ALIAS); a casa, não o @, é a unidade das médias.
    base["perfil_casa"] = base["estabelecimento"]
    n_por_casa = base.groupby("perfil_casa").size()
    poucas = n_por_casa[n_por_casa < MIN_POSTS]
    if len(poucas):
        print(f"casas com menos de {MIN_POSTS} posts na janela (saem):", poucas.to_dict())
    base = base[~base["perfil_casa"].isin(poucas.index)].copy()
    print(f"janela {JANELA_DE} a {JANELA_ATE}: {len(base)} posts de {base['perfil_casa'].nunique()} casas")
    por_tipo = base.groupby("tipo_casa").size()
    ic.conferir_soma(por_tipo, len(base), "posts por tipo de casa")

    cod = codifica(base)
    por_post = pd.concat([base[["shortcode", "perfil", "estabelecimento", "tipo_casa", "data_hora"]], cod], axis=1)
    por_post.to_csv(SAIDA / "B1_instagram_temas_por_post.csv", sep=";", index=False)

    freq = tabela_frequencia(base, cod)
    freq.to_csv(SAIDA / "B1_instagram_temas_frequencia.csv", sep=";", index=False)

    por_casa = cod.groupby(base["perfil_casa"]).mean().mul(100).round(1)
    por_casa.insert(0, "posts na janela", base.groupby("perfil_casa").size())
    por_casa.insert(0, "tipo_casa", base.groupby("perfil_casa")["tipo_casa"].first())
    por_casa.index.name = "estabelecimento"
    por_casa.to_csv(SAIDA / "B1_instagram_temas_por_estabelecimento.csv", sep=";")
    ic.conferir_soma(por_casa["posts na janela"], len(base), "posts por estabelecimento")

    if SAIDA_VALIDACAO.exists():
        print(f"\n{SAIDA_VALIDACAO.name} já existe e não foi sobrescrita.")
        prec = precisao()
        if prec is not None:
            prec.to_csv(SAIDA / "B1_instagram_temas_precisao.csv", sep=";", index=False)
            print(prec.to_string(index=False))
    else:
        amostra_validacao(base, cod).to_csv(SAIDA_VALIDACAO, sep=";", index=False)
        print(f"\namostra de validação gravada: {SAIDA_VALIDACAO.name}")

    cols = ["código", "total: % ponderado por estabelecimento", "total: B2 avaliações, % ponderado",
            "total: diferença ponderada legendas - B2 (p.p.)", f"{ic.C}: % ponderado por estabelecimento",
            f"{ic.L}: % ponderado por estabelecimento"]
    print("\n" + freq[cols].to_string(index=False))


if __name__ == "__main__":
    main()
