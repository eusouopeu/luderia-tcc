"""
Bloco B1 - preços e modelos de cobrança anunciados nas legendas do Instagram
das casas aprovadas.

Pergunta: como as casas cobram pelo uso do espaço e do acervo (por pessoa, por
hora, por turno, por dia, passaporte, assinatura, isenção por consumo) e quanto
cobram? Alimenta a política de preço e a receita por cliente do plano
(caps. 6 e 9), ao lado dos cardápios.

Duas leituras:
  1. Menções de valor: cada "R$ <número>" da legenda vira uma linha, com o
     trecho em volta (a frase e a anterior), que vai para a saída. O contexto
     curto (ANTES caracteres antes e DEPOIS depois do valor, sem passar do
     valor vizinho) recebe:
       - objeto: o que o valor paga (OBJETOS, primeiro que casar na ordem);
       - unidade: como o valor se aplica (UNIDADES, todas as que casarem);
       - condição (na frase inteira): diferença por dia da semana, isenção ou abatimento por
         consumo, desconto para assinante, meia, criança (CONDICOES).
  2. Modelos citados: o post cita um modelo de cobrança (MODELOS), com ou
     sem valor ("couvert lúdico", "entrada gratuita", "plano mensal").

Regras:
  - unidade de contagem: menção (leitura 1) e post (leitura 2); cada post
    pertence ao dono (instagram_comum.carrega_posts);
  - objeto é exclusivo: cada menção recebe um só, e a tabela por objeto fecha
    com o total de menções; unidades, condições e modelos não são exclusivos;
  - o valor vigente de cada casa é a menção mais recente de uso do espaço nos
    últimos 24 meses (VIGENTE_DESDE); valores antigos ficam na tabela de
    menções, com a data, sem correção pela inflação;
  - o dicionário erra: o trecho fica na saída para a conferência; valor de
    produto à venda, de comida e de inscrição de torneio não entra no preço
    de uso do espaço.

Saídas em dados/[B1] Estabelecimentos e cardapios/redes_sociais/analise_legendas/precos/:
  B1_instagram_precos_mencoes.csv             (uma linha por valor citado)
  B1_instagram_precos_por_objeto.csv          (objeto x tipo de casa)
  B1_instagram_precos_uso_do_espaco.csv       (casa x unidade: valor mais recente, faixa, n)
  B1_instagram_modelos_cobranca.csv           (modelo x tipo de casa: casas e posts que citam)
  B1_instagram_modelos_por_estabelecimento.csv (casa x modelo: posts, primeira e última citação)

Uso:
    python3 "_src/[B1] Estabelecimentos e cardapios/Instagram/analise/B1-a_instagram_precos.py"
"""
# Caminhos: _src/extras/ (log comum) e outros/ do objeto (auxiliares); log em ../logs/
import sys
from pathlib import Path
_AQUI = Path(__file__).resolve()
sys.path[:0] = [str(_AQUI.parents[3] / "extras"), str(_AQUI.parents[1] / "outros")]
from log_execucao import registrar_execucao  # noqa: E402
if __name__ == "__main__":
    registrar_execucao(__file__)

import re

import pandas as pd

import instagram_comum as ic

SAIDA = ic.SAIDA / "precos"

VIGENTE_DESDE = "2024-10-01"
ANTES, DEPOIS = 70, 45  # caracteres de contexto para classificar cada valor
RX_VALOR = re.compile(r"r\$\s?(\d{1,3}(?:\.\d{3})+|\d+)(?:,(\d{1,2}))?")
RX_FRASE = re.compile(r"(?<=[.!?\n])\s+|\s+[-–•|]\s+|\s{2,}")


def rx(t):
    return re.compile(t, re.ASCII)


# Ordem importa: o primeiro objeto que casar no trecho vence.
OBJETOS = {
    "assinatura ou plano": rx(r"\bplanos?\b|\bassinatura|\bassinantes?\b|\bmensalidade|\b/ ?mes\b|\bpor mes\b|\bmensais\b|\bsocios?\b|\bclube\b"),
    "aluguel de jogos": rx(r"\balug|\blocacao|\blocadora"),
    "uso do espaço": rx(r"\bcouvert|\bentrada\b|\btaxa (de )?(entrada|ludica|de jogo|de uso|de mesa)|\btaxa\b.{0,30}\bjogar|\bpara jogar\b|\buso (do|da) (acervo|espaco|ludoteca|mesa)|\bpor hora\b|\ba hora\b|\bhora adicional|\bpassaporte|\bdiaria|\bdia (todo|inteiro)|\bjogar a vontade|\bjogue a vontade|\bsem limite de tempo|\bpacote de horas|\bacesso (ao|a) (acervo|ludoteca|espaco)"),
    "evento (inscrição ou ingresso)": rx(r"\binscric|\bingressos?\b|\btorneio|\bcampeonato|\bparticipacao|\bparticipar\b|\bevento|\bquiz|\btrivia|\bworkshop|\boficina|\baula|\bcurso|\bpre-?release|\bdraft\b|\bliga\b|\bpremiac"),
    "comida e bebida": rx(r"\bcombo|\blanches?\b|\bburgers?\b|\bhamburg|\bpizza|\bporcao|\bporcoes|\bpetisco|\bbatata|\bfritas|\bdrinks?\b|\bchopp?\b|\bcervej|\bbebida|\bprato|\brodizio|\bbuffet|\bsobremesa|\bcafe\b|\bcafes\b|\brefri|\bsuco|\bcardapio|\bmenu\b|\bcaipirinha|\bdose|\bbalde\b|\bjantar|\balmoco|\bcomida|\bsalgad|\bdoces?\b"),
    "produto à venda": rx(r"\bpre-?venda|\bfrete|\bparcel|\bsem juros|\bestoque|\bvenda\b|\bloja\b|\bsite\b|\bboosters?\b|\bcaixa\b|\bdecks?\b|\bsleeves?\b|\bunidades?\b|\bcartas?\b|\bjogo\b|\bexpans|\bde r\$ ?\d+.{0,15}por r\$|\bpix\b|\ba vista\b|\bcupom|\bdesconto"),
}
UNIDADES = {
    "por pessoa": rx(r"\bpor pessoa|\bp/ ?pessoa|\b/ ?pessoa|\bcada pessoa|\bpor jogador|\bpor cabeca|\bpor participante|\bindividual\b"),
    "por hora": rx(r"\bpor hora|\ba hora\b|\b/ ?h(ora)?\b|\bhora adicional|\bprimeira hora|\bcada hora|\bpor \d+ ?h(oras)?\b"),
    "por turno ou período": rx(r"\bturno|\bperiodo|\bsessao\b|\bmeio periodo|\btarde (toda|inteira)|\bnoite (toda|inteira)"),
    "por dia": rx(r"\bdia (todo|inteiro)|\bdiaria|\bjogar a vontade|\bjogue a vontade|\bsem limite de tempo|\bilimitad|\bo dia\b.{0,10}\blivre"),
    "por grupo, mesa ou casal": rx(r"\bpor mesa|\bpor grupo|\bpor casal|\bpor dupla|\bduplo\b|\bpara (2|duas|dois|4|quatro) pessoas|\bpara o casal"),
    "passaporte ou pacote": rx(r"\bpassaporte|\bpacote|\bcartela|\b\d+ (entradas|visitas)\b|\bcartao (fidelidade|de visitas)"),
    "mensal": rx(r"\b/ ?mes\b|\bpor mes\b|\bmensal|\bmensalidade|\bao mes\b"),
    "por período de aluguel": rx(r"\bpor \d+ dias|\bpor (uma|1) semana|\b\d+ dias corridos"),
}
CONDICOES = {
    "varia por dia da semana": rx(r"\b(segunda|terca|quarta|quinta)\b.{0,25}\b(a|ate|e) (quinta|sexta|sabado|domingo)\b|\bfins? de semana|\bfinal de semana|\bdias uteis|\bferiados?\b"),
    "isenção ou abatimento por consumo": rx(r"\bconsumindo|\bconsumacao|\bconsumo minimo|\babatid|\brevertid|\bconvertid|\bvira credito|\bem creditos?\b|\bnao precisa pagar|\bisent"),
    "desconto para assinante ou sócio": rx(r"\bassinantes?\b|\bsocios?\b|\bmembros?\b|\bclube\b"),
    "meia ou desconto": rx(r"\bmeia\b|\bdesconto|\b\d+ ?% ?off\b|\bpromoc"),
    "criança ou família": rx(r"\bcriancas?\b|\binfantil|\bmenores de\b|\bate \d+ anos\b|\bfamilia\b"),
}
MODELOS = {
    "couvert lúdico ou taxa de entrada": rx(r"\bcouvert|\btaxa de entrada|\btaxa ludica|\btaxa de jogo|\btaxa de uso|\bentrada (padrao|de|e|custa|a partir)\b"),
    "entrada gratuita": rx(r"\bentrada (gratuita|franca|free|liberada|gratis)|\bsem (taxa|couvert|cobranca de entrada)|\bjogar de graca|\bjogue de graca|\bjogar gratis|\bacervo (gratuito|liberado)|\bnao cobramos (entrada|couvert|taxa)"),
    "cobrança por hora": rx(r"\bpor hora\b|\bhora adicional|\bprimeira hora|\bcada hora|\bvalor da hora|\ba hora (custa|sai|e)\b"),
    "cobrança por turno ou período": rx(r"\b(por|cada) (turno|periodo)|\bmeio periodo|\bvalor do periodo"),
    "dia livre (sem limite de tempo)": rx(r"\bdia (todo|inteiro) (por|jogando|de jogo)|\bdiaria|\bjogar a vontade|\bjogue a vontade|\bsem limite de tempo|\btempo ilimitado|\bjogos ilimitados"),
    "passaporte ou pacote de visitas": rx(r"\bpassaporte|\bpacote de (horas|visitas|entradas)|\bcartela de|\bcartao fidelidade|\bfidelidade"),
    "assinatura ou plano mensal": rx(r"\bplano (individual|duplo|mensal|familia|anual|casal)|\bassinatura|\bassinantes?\b|\bmensalidade|\bclube de assinatura|\bseja socio"),
    "consumação mínima ou isenção por consumo": rx(r"\bconsumacao minima|\bconsumo minimo|\bconsumindo (acima de )?r\$|\babatid[oa] (no|do) consumo|\brevertid[oa] em consumo|\bconvertid[oa] em (consumo|credito)"),
    "preço diferente por dia da semana": rx(r"\b(segunda|terca) (a|ate) (quinta|sexta)\b.{0,40}r\$|\bfins? de semana.{0,30}r\$|r\$.{0,40}\bfins? de semana"),
    "rodízio ou buffet com jogos": rx(r"\brodizio|\bbuffet"),
    "aluguel de jogos": rx(r"\balug(ue|amos|ar) (de )?jogos|\blocacao de jogos|\blocadora de jogos"),
    "inscrição em evento ou torneio": rx(r"\binscric"),
}


def valor(m):
    inteiro = m.group(1).replace(".", "")
    return float(f"{inteiro}.{m.group(2) or '0'}")


def trecho(texto, ini, fim):
    """Frase do valor mais a anterior; corta em ponto, quebra de linha, marcador.
    Devolve (início, fim) para recortar também a legenda original."""
    cortes = [0] + [m.end() for m in RX_FRASE.finditer(texto)] + [len(texto)]
    antes = [c for c in cortes if c <= ini]
    depois = [c for c in cortes if c >= fim]
    comeco = antes[-2] if len(antes) >= 2 else 0
    return comeco, depois[0] if depois else len(texto)


def mencoes(posts):
    linhas = []
    for _, p in posts.iterrows():
        t = p["texto"]
        # O texto normalizado tem o mesmo comprimento da legenda quando ela vem
        # em NFC (o caso comum); aí o trecho de saída sai da legenda original.
        original = p["legenda"] if len(p["legenda"]) == len(t) else t
        achados = list(RX_VALOR.finditer(t))
        for i, m in enumerate(achados):
            ini, fim = trecho(t, m.start(), m.end())
            # Contexto curto para classificar: até ANTES caracteres antes e DEPOIS
            # depois do valor, sem passar do valor vizinho. Em listas de preços
            # ("Quarta: entrada R$15 / Rodízio R$70") cada valor fica com o seu rótulo.
            esq = max(achados[i - 1].end() if i else 0, m.start() - ANTES)
            dir_ = min(achados[i + 1].start() if i + 1 < len(achados) else len(t), m.end() + DEPOIS)
            tr = t[esq:dir_]
            objeto = next((o for o, r in OBJETOS.items() if r.search(tr)), "indeterminado")
            linhas.append({
                "shortcode": p["shortcode"], "url": p["url"], "estabelecimento": p["estabelecimento"],
                "tipo_casa": p["tipo_casa"], "capital": p["capital"], "data_hora": p["data_hora"],
                "valor (R$)": valor(m), "objeto": objeto,
                "unidades": "; ".join(u for u, r in UNIDADES.items() if r.search(tr)),
                # Condições valem para a frase inteira ("segunda a quinta: R$15 / sexta a domingo: R$20").
                "condições": "; ".join(c for c, r in CONDICOES.items() if r.search(t[ini:fim])),
                "trecho": re.sub(r"\s+", " ", original[ini:fim]).strip()[:300],
            })
    return pd.DataFrame(linhas)


def por_objeto(men):
    tab = men.pivot_table(index="objeto", columns="tipo_casa", values="valor (R$)", aggfunc="size", fill_value=0)
    tab["menções (total)"] = tab.sum(axis=1)
    tab["estabelecimentos"] = men.groupby("objeto")["estabelecimento"].nunique()
    tab["mediana do valor (R$)"] = men.groupby("objeto")["valor (R$)"].median()
    return tab.sort_values("menções (total)", ascending=False)


def uso_do_espaco(men):
    uso = men[(men["objeto"] == "uso do espaço") & (men["data_hora"] >= VIGENTE_DESDE)].copy()
    uso["unidade"] = uso["unidades"].replace("", "sem unidade identificada").str.split("; ")
    uso = uso.explode("unidade").sort_values("data_hora")
    tab = uso.groupby(["estabelecimento", "tipo_casa", "unidade"]).agg(
        **{"menções": ("valor (R$)", "size"), "valor mínimo (R$)": ("valor (R$)", "min"),
           "valor máximo (R$)": ("valor (R$)", "max"), "valor mais recente (R$)": ("valor (R$)", "last"),
           "data do mais recente": ("data_hora", "last"), "trecho do mais recente": ("trecho", "last"),
           "condições citadas": ("condições", lambda s: "; ".join(sorted({c for x in s for c in x.split("; ") if c})))})
    return tab.reset_index()


def modelos(posts):
    marca = pd.DataFrame({m: posts["texto"].map(lambda t, r=r: bool(r.search(t))) for m, r in MODELOS.items()},
                         index=posts.index)
    casas_tipo = posts.groupby("estabelecimento")["tipo_casa"].first()
    linhas = []
    for m in MODELOS:
        sub = posts[marca[m]]
        linha = {"modelo": m, "posts que citam": len(sub), "estabelecimentos que citam": sub["estabelecimento"].nunique()}
        for tipo in (ic.C, ic.L):
            n_tipo = int((casas_tipo == tipo).sum())
            k = sub.loc[sub["tipo_casa"] == tipo, "estabelecimento"].nunique()
            linha[f"{tipo}: estabelecimentos que citam"] = f"{k} de {n_tipo}"
        linhas.append(linha)
    por_casa = []
    for m in MODELOS:
        sub = posts[marca[m]]
        for casa, g in sub.groupby("estabelecimento"):
            por_casa.append({"estabelecimento": casa, "tipo_casa": g["tipo_casa"].iloc[0], "modelo": m,
                             "posts que citam": len(g), "primeira citação": g["data_hora"].min(),
                             "última citação": g["data_hora"].max(),
                             "url da última": g.sort_values("data_hora")["url"].iloc[-1]})
    return pd.DataFrame(linhas), pd.DataFrame(por_casa).sort_values(["estabelecimento", "modelo"])


def main():
    SAIDA.mkdir(parents=True, exist_ok=True)
    posts = ic.carrega_posts()
    men = mencoes(posts)
    men.to_csv(SAIDA / "B1_instagram_precos_mencoes.csv", sep=";", index=False)
    print(f"\nmenções de valor: {len(men)} em {men['shortcode'].nunique()} posts de {men['estabelecimento'].nunique()} casas")

    obj = por_objeto(men)
    obj.to_csv(SAIDA / "B1_instagram_precos_por_objeto.csv", sep=";")
    ic.conferir_soma(obj["menções (total)"], len(men), "menções por objeto")
    print(obj.to_string())

    uso = uso_do_espaco(men)
    uso.to_csv(SAIDA / "B1_instagram_precos_uso_do_espaco.csv", sep=";", index=False)
    print(f"\nuso do espaço desde {VIGENTE_DESDE}: {uso['estabelecimento'].nunique()} casas")
    print(uso[["estabelecimento", "unidade", "menções", "valor mais recente (R$)", "data do mais recente"]].to_string(index=False))

    tab_mod, mod_casa = modelos(posts)
    tab_mod.to_csv(SAIDA / "B1_instagram_modelos_cobranca.csv", sep=";", index=False)
    mod_casa.to_csv(SAIDA / "B1_instagram_modelos_por_estabelecimento.csv", sep=";", index=False)
    print("\n" + tab_mod.to_string(index=False))


if __name__ == "__main__":
    main()
