"""
Bloco B1 - cesta de jogos: custo do núcleo do acervo, faixa de preço por jogo,
índice de preço por loja e custo do acervo inicial por tamanho (cap. 9.3 e 6).

Pedido do autor em 17/10/2026: cesta com corte de 15 ou mais casas, faixa de
preço e índice por loja.

Entrada: acervo_jogos/B1_banco_jogos.csv (B1-b_banco_jogos.py), que já traz um
preço de venda por loja e jogo (o menor, se houver mais de uma edição), só do
jogo base novo, e o aluguel por casa; e acervo_jogos/B1_jogos_dos_acervos.csv,
para o tamanho dos acervos.

Regras:
- Cesta (núcleo): jogos no acervo de 15 ou mais das 30 casas com lista.
- Perfil pela duração da Ludopedia: rápido (até 20 min), médio (21 a 60 min),
  longo (mais de 60 min). Cada jogo em um só perfil.
- Faixa por jogo, entre as lojas que vendem: otimista = menor preço;
  provável = mediana; pessimista = p75 com 4 ou mais lojas, senão o maior.
  Jogo sem loja fica sem preço e fora das somas (contado à parte).
- Índice por loja: para cada jogo da cesta vendido em 2 ou mais lojas, razão
  preço da loja / mediana do jogo; índice = média das razões (1,00 = preço
  típico). Entra no ranking a loja com 10 ou mais jogos comparáveis; as demais
  aparecem sem posição.
- Aluguéis para pagar o jogo: venda mediana / aluguel mediano. O período do
  aluguel varia entre casas (1, 3 ou 7 dias); a razão não converte para diária.
- Acervo inicial: tamanhos p25, mediana e p75 dos 30 acervos. Custo = núcleo
  com preço (soma da faixa) + títulos restantes x preço médio por título
  (média, entre os jogos do banco com venda, 4 ou mais acervos, do preço
  otimista, provável e pessimista de cada jogo, pela mesma regra da cesta;
  média e não mediana porque o custo é uma soma). Preço de varejo online em 13/10/2026; sem desconto de
  distribuidora, frete nem reposição (premissas do cap. 9).

Saída: acervo_jogos/B1_cesta_jogos.xlsx (abas cesta, perfis, indice_lojas,
acervo_inicial).

Uso:
    python3 "_src/[B1] Estabelecimentos e cardapios/Acervo de Jogos/analise/B1-a_cesta_jogos.py"
"""
# Caminhos: _src/extras/ (log comum); log em ../logs/
import sys
from pathlib import Path
_AQUI = Path(__file__).resolve()
sys.path[:0] = [str(_AQUI.parents[3] / "extras")]
from log_execucao import registrar_execucao  # noqa: E402
if __name__ == "__main__":
    registrar_execucao(__file__)

import pandas as pd

ROOT = Path(__file__).resolve().parents[4]
PROC = ROOT / "dados" / "[B1] Estabelecimentos e cardapios" / "acervo_jogos"
BANCO = PROC / "B1_banco_jogos.csv"
ACERVOS = PROC / "B1_jogos_dos_acervos.csv"
SAIDA = PROC / "B1_cesta_jogos.xlsx"

MIN_CASAS = 15
MIN_JOGOS_INDICE = 10


def perfil(duracao):
    if pd.isna(duracao):
        return "sem duração"
    if duracao <= 20:
        return "rápido (até 20 min)"
    if duracao <= 60:
        return "médio (21 a 60 min)"
    return "longo (mais de 60 min)"


def precos_por_loja(detalhe):
    """'Loja: R$ 370.00; Outra: R$ 249.00' -> {loja: preço}."""
    if pd.isna(detalhe) or not detalhe:
        return {}
    saida = {}
    for parte in detalhe.split("; "):
        loja, preco = parte.rsplit(": R$ ", 1)
        saida[loja] = float(preco)
    return saida


def faixa(precos):
    s = pd.Series(precos, dtype=float)
    if s.empty:
        return None, None, None
    pess = s.quantile(0.75) if len(s) >= 4 else s.max()
    return round(s.min(), 2), round(s.median(), 2), round(pess, 2)


def main():
    banco = pd.read_csv(BANCO)
    nucleo = banco[banco.n_casas_acervo >= MIN_CASAS].copy()

    linhas, razoes = [], []
    for _, j in nucleo.iterrows():
        lojas = precos_por_loja(j.venda_detalhe)
        oti, prov, pess = faixa(list(lojas.values()))
        alug = j.aluguel_mediana_rs if pd.notna(j.aluguel_mediana_rs) else None
        linhas.append({
            "jogo": j.jogo, "perfil": perfil(j.duracao_min), "duracao_min": j.duracao_min,
            "n_casas_acervo": j.n_casas_acervo, "n_lojas_venda": len(lojas),
            "preco_otimista_rs": oti, "preco_provavel_rs": prov, "preco_pessimista_rs": pess,
            "aluguel_mediana_rs": alug,
            "alugueis_para_pagar": round(prov / alug, 1) if prov and alug else None,
            "lojas": "; ".join(sorted(lojas)),
        })
        if len(lojas) >= 2:
            for loja, p in lojas.items():
                razoes.append({"loja": loja, "jogo": j.jogo, "razao": p / prov})
    cesta = pd.DataFrame(linhas).sort_values(["n_casas_acervo", "jogo"], ascending=[False, True])

    # Perfis: cada jogo em um só perfil; a soma fecha com o total da cesta.
    com = cesta[cesta.n_lojas_venda > 0]
    perfis = cesta.groupby("perfil").agg(
        jogos=("jogo", "size"),
        jogos_com_preco=("n_lojas_venda", lambda s: int((s > 0).sum())),
    ).join(com.groupby("perfil")[["preco_otimista_rs", "preco_provavel_rs", "preco_pessimista_rs"]].sum())
    perfis = perfis.reset_index()
    total = {"perfil": "Total", "jogos": perfis.jogos.sum(), "jogos_com_preco": perfis.jogos_com_preco.sum(),
             **{c: perfis[c].sum() for c in ["preco_otimista_rs", "preco_provavel_rs", "preco_pessimista_rs"]}}
    assert total["jogos"] == len(cesta), "perfis não fecham com a cesta"
    assert total["jogos_com_preco"] == len(com), "perfis com preço não fecham"
    for c in ["preco_otimista_rs", "preco_provavel_rs", "preco_pessimista_rs"]:
        assert abs(total[c] - com[c].sum()) < 0.01, f"soma de {c} não fecha"
    perfis = pd.concat([perfis, pd.DataFrame([total])], ignore_index=True)

    # Índice por loja
    r = pd.DataFrame(razoes)
    indice = r.groupby("loja").agg(jogos_comparaveis=("jogo", "size"), indice_medio=("razao", "mean"),
                                   razao_mediana=("razao", "median")).reset_index()
    indice["entra_no_ranking"] = indice.jogos_comparaveis >= MIN_JOGOS_INDICE
    indice = indice.sort_values(["entra_no_ranking", "indice_medio"], ascending=[False, True])
    indice["posicao"] = None
    rank = indice.entra_no_ranking
    indice.loc[rank, "posicao"] = range(1, int(rank.sum()) + 1)
    indice[["indice_medio", "razao_mediana"]] = indice[["indice_medio", "razao_mediana"]].round(3)

    # Acervo inicial
    tamanhos = pd.read_csv(ACERVOS).groupby("estabelecimento").size()
    faixas = pd.DataFrame([faixa(list(precos_por_loja(d).values())) for d in banco.venda_detalhe],
                          columns=["otimista", "provavel", "pessimista"]).dropna()
    por_titulo = faixas.provavel
    preco_titulo = faixas.mean().to_dict()
    soma_nucleo = {"otimista": com.preco_otimista_rs.sum(), "provavel": com.preco_provavel_rs.sum(),
                   "pessimista": com.preco_pessimista_rs.sum()}
    acervo = []
    for rotulo, q in [("p25", 0.25), ("mediana", 0.5), ("p75", 0.75)]:
        n = round(tamanhos.quantile(q))
        resto = max(n - len(com), 0)
        linha = {"tamanho": rotulo, "titulos": n, "nucleo_com_preco": len(com), "titulos_restantes": resto}
        for cen in ["otimista", "provavel", "pessimista"]:
            linha[f"custo_{cen}_rs"] = round(soma_nucleo[cen] + resto * preco_titulo[cen], 2)
        acervo.append(linha)
    acervo = pd.DataFrame(acervo)

    with pd.ExcelWriter(SAIDA) as w:
        cesta.to_excel(w, sheet_name="cesta", index=False)
        perfis.to_excel(w, sheet_name="perfis", index=False)
        indice.to_excel(w, sheet_name="indice_lojas", index=False)
        acervo.to_excel(w, sheet_name="acervo_inicial", index=False)

    print(f"Cesta: {len(cesta)} jogos em {MIN_CASAS}+ casas; {len(com)} com preço de venda, "
          f"{len(cesta) - len(com)} sem loja.")
    print(perfis.to_string(index=False))
    print(f"\nÍndice por loja ({len(r)} preços comparáveis, jogos em 2+ lojas):")
    print(indice.to_string(index=False))
    print(f"\nTamanho dos acervos: n={len(tamanhos)}, soma={tamanhos.sum()}")
    print("Preço por título (venda mediana, " f"{len(por_titulo)} jogos): "
          + ", ".join(f"{k} R$ {v:.2f}" for k, v in preco_titulo.items()))
    print(acervo.to_string(index=False))
    print(f"\n-> {SAIDA}")


if __name__ == "__main__":
    main()
