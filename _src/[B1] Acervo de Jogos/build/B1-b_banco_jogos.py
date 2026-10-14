"""
Bloco B1 - banco de jogos: uma linha por jogo presente no acervo de 4 ou mais
casas com cardápio, com aluguel, venda e dados do jogo.

Pedido do autor em 13/10/2026 (banco "B - Jogos" no Notion). Corte: jogos em
4 ou mais estabelecimentos (sugestão registrada para depois: 3 ou mais).

Entradas:
- acervo_jogos/B1_jogos_dos_acervos.csv (B1-c_jogos_dos_acervos.py).
- acervo_jogos/B1_lojas_venda_produtos.csv (B1-c_lojas_venda.py).
- Ludopedia: B5 arquivado e cache da API (B1-c_jogos_ludopedia.py);
  identificação do jogo em jogos_comum.py.

Regras das colunas:
- Acervo no local: todas as casas do grupo. As 16 casas têm comida e bebida, e
  o que alugam pelo Acervo de Jogos ou rejoy também fica na mesa (decisão do
  autor em 13/10/2026).
- Aluguel pago: casas que mostram preço de aluguel do jogo (Acervo de Jogos,
  rejoy). Média, mediana e desvio-padrão amostral (n-1) do preço por locação,
  um preço por casa. O período da locação varia entre casas (1, 3 ou 7 dias) e
  vai no detalhe; o preço não é convertido para diária.
- Venda: produto de loja cujo nome inteiro, sem descritor de edição ou de
  editora, tem a mesma chave de um título do grupo ou do nome na Ludopedia.
  Ficam de fora expansões, promos, acessórios, combos ("+"), seminovos,
  avariados e preço zero. Um preço por loja (o menor, se houver mais de uma
  edição). Mesmas estatísticas do aluguel.
- Desvio-padrão só com 2 ou mais preços.
- Nota média: ranking da Ludopedia (B5, 2.500 jogos, 01/09/2026); jogo fora
  do ranking fica sem nota.

Saída: acervo_jogos/B1_banco_jogos.csv, uma linha por jogo. Contagem não
exclusiva por desenho: uma casa aparece em todos os jogos do seu acervo.
"""
# Caminhos: _src/ (log comum) e outros/ do bloco (auxiliares); log em ../logs/
import sys
from pathlib import Path
_AQUI = Path(__file__).resolve()
sys.path[:0] = [str(_AQUI.parents[2]), str(_AQUI.parents[1] / "outros")]
from log_execucao import registrar_execucao  # noqa: E402
if __name__ == "__main__":
    registrar_execucao(__file__)

import csv
import re
import statistics

import jogos_comum as J

VENDA = J.PROC / "B1_lojas_venda_produtos.csv"
SAIDA = J.PROC / "B1_banco_jogos.csv"
MIN_CASAS = 4


FORA_DA_VENDA = re.compile(r"expans|promo|playmat|sleeve|shield|insert|organizador|booster|seminov|avariad|usado|\+", re.I)


def chave_produto(nome):
    """Chave do produto de loja, ou None se não for o jogo base novo.

    O nome conta inteiro: o que vem depois de " - " ou "|" costuma ser subtítulo
    ou expansão ("Ticket to Ride - Trem Fantasma"). Saem só descritores:
    "Jogo de Tabuleiro <Editora>" e afins (Place Games) e a edição.
    """
    if FORA_DA_VENDA.search(nome):
        return None
    n = re.sub(r"\s(jogo de (tabuleiro|cartas)|board ?game|card ?game)\b.*$", "", nome, flags=re.I)
    n = re.sub(r"[\s|–-]*\(?\b(primeira|segunda|terceira|\d+\s*[ªaº°])\s*edi[cç][aã]o\)?(\s*[|–-]?\s*revisada)?\s*$",
               "", n, flags=re.I)
    return J.chave(n) or None


def estat(valores):
    if not valores:
        return "", "", ""
    dp = round(statistics.stdev(valores), 2) if len(valores) >= 2 else ""
    return round(statistics.mean(valores), 2), round(statistics.median(valores), 2), dp


def main():
    _, _, _, detalhes, nota = J.ludopedia()
    venda = {}  # chave do produto -> {loja: menor preço}
    for p in csv.DictReader(open(VENDA, encoding="utf-8")):
        k = chave_produto(p["produto"])
        if k and float(p["preco_rs"]) > 0:
            lojas = venda.setdefault(k, {})
            lojas[p["estabelecimento"]] = min(float(p["preco_rs"]), lojas.get(p["estabelecimento"], float("inf")))

    saida = []
    for (tipo, ident), g in J.grupos(MIN_CASAS).items():
        info = detalhes.get(ident, {}) if tipo == "slug" else {}
        nome = info.get("nome") or g["titulos"].most_common(1)[0][0]
        lojas = {}
        for k in g["chaves"] | ({J.chave(info["nome"])} if info.get("nome") else set()):
            for loja, preco in venda.get(k, {}).items():
                lojas[loja] = min(preco, lojas.get(loja, preco))
        aluguel = {c: v["aluguel"] for c, v in g["casas"].items() if v["aluguel"]}
        a = estat([p for p, _ in aluguel.values()])
        v = estat(list(lojas.values()))
        saida.append({
            "jogo": nome,
            "link_ludopedia": f"https://ludopedia.com.br/jogo/{ident}" if tipo == "slug" else "",
            "grafias": "; ".join(t for t, _ in g["titulos"].most_common()),
            "n_casas_acervo": len(g["casas"]),
            "acervo_no_local": "; ".join(sorted(g["casas"])),
            "aluguel_pago": "; ".join(sorted(aluguel)),
            "aluguel_media_rs": a[0], "aluguel_mediana_rs": a[1], "aluguel_dp_rs": a[2],
            "aluguel_detalhe": "; ".join(f"{c}: R$ {p:g}/{d} d" for c, (p, d) in sorted(aluguel.items())),
            "venda": "; ".join(sorted(lojas)),
            "venda_media_rs": v[0], "venda_mediana_rs": v[1], "venda_dp_rs": v[2],
            "venda_detalhe": "; ".join(f"{c}: R$ {p:.2f}" for c, p in sorted(lojas.items())),
            "jogadores_min": info.get("jogadores_min", ""), "jogadores_max": info.get("jogadores_max", ""),
            "idade_min": info.get("idade_min", ""), "duracao_min": info.get("duracao_min", ""),
            "mecanicas": info.get("mecanicas", ""),
            "nota_media": nota.get(ident, "") if tipo == "slug" else "",
        })
    saida.sort(key=lambda x: (-x["n_casas_acervo"], x["jogo"].casefold()))
    with open(SAIDA, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=list(saida[0]))
        w.writeheader()
        w.writerows(saida)
    n = len(saida)
    print(f"{n} jogos em {MIN_CASAS}+ casas; Ludopedia {sum(1 for x in saida if x['link_ludopedia'])}; "
          f"detalhes {sum(1 for x in saida if x['jogadores_min'] != '')}; nota {sum(1 for x in saida if x['nota_media'] != '')}; "
          f"aluguel {sum(1 for x in saida if x['aluguel_pago'])}; venda {sum(1 for x in saida if x['venda'])} -> {SAIDA}")


if __name__ == "__main__":
    main()
