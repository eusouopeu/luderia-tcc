"""
Bloco B1 - amostra de auditoria das transcrições de cardápio: fidelidade do
item, do preço e da categoria ao cardápio original (_instrucoes/4_metodologia.md
§3.4; a transcrição, por OCR ou à mão, é o instrumento conferido).

Desenho: 200 itens com preço, cada casa um estrato, mínimo de 3 por casa (ou
todos, se tiver menos), resto na proporção do número de itens da casa descontado
o mínimo, maiores restos e menores chaves da semente
(_src/extras/amostrar_auditoria.py), o mesmo desenho do B2.

Entrada: _dados-brutos/cardapios/transcricao/<casa>.csv (um item por linha)
Saídas em _dados-brutos/cardapios/auditoria/ (fora do git, como a pasta):
  B1_auditoria_cardapios.csv  com a pasta do original (ca_<cidade>/ca_<casa>/), quando houver
  auditoria_registro.csv

Conferência: abrir o original e marcar item_no_original e categoria_confere
(sim/nao) e anotar preco_no_original como está no cardápio.

Uso:
    python3 "_src/[B1] Estabelecimentos e cardapios/Cardápios/analise/B1-a_auditoria_cardapios.py"
"""
# Caminhos: _src/extras/ (log comum e sorteio); log em ../logs/
import sys
from pathlib import Path
_AQUI = Path(__file__).resolve()
sys.path[:0] = [str(_AQUI.parents[3] / "extras")]
from log_execucao import registrar_execucao  # noqa: E402
if __name__ == "__main__":
    registrar_execucao(__file__)

import pandas as pd

import amostrar_auditoria as aa

ROOT = Path(__file__).resolve().parents[4]
BRUTOS = ROOT / "dados" / "[B1] Estabelecimentos e cardapios" / "_dados-brutos"
ENTRADA = BRUTOS / "cardapios/transcricao"
ORIGINAIS = BRUTOS / "cardapios"
SAIDA = BRUTOS / "cardapios/auditoria"

SEMENTE = 20261015
N_ITENS = 200
MINIMO_POR_CASA = 3
CONFERIR = ["item_no_original", "preco_no_original", "categoria_confere"]


def pasta_original(casa: str) -> str:
    """ca_<cidade>/ca_<casa>/ cujo nome, sem '_', começa pelo nome do arquivo de transcrição."""
    alvo = casa.replace("_", "")
    for p in sorted(ORIGINAIS.glob("ca_*/ca_*")):
        if p.is_dir() and p.name[3:].replace("_", "").startswith(alvo):
            return str(p.relative_to(ORIGINAIS))
    return ""


def main():
    arquivos = sorted(ENTRADA.glob("*.csv"))
    partes = []
    for f in arquivos:
        d = pd.read_csv(f, sep=None, engine="python", dtype=str, encoding="utf-8-sig")
        d["casa"] = f.stem
        d["linha_arquivo"] = range(2, len(d) + 2)
        partes.append(d)
    itens = pd.concat(partes, ignore_index=True)
    itens = itens[itens.preco.fillna("").str.strip() != ""].copy()
    itens["id_item"] = itens.casa + ":" + itens.linha_arquivo.astype(str)
    amostra = aa.sortear(itens, "id_item", N_ITENS, SEMENTE, estrato="casa", minimo=MINIMO_POR_CASA)
    originais = {c: pasta_original(c) for c in amostra.casa.unique()}
    amostra["pasta_original"] = amostra.casa.map(originais)
    cols = ["estrato_sorteio", "chave_sorteio", "casa", "linha_arquivo", "pasta_original", "secao_original", "item",
            "descricao", "variacao", "preco", "categoria", "subcategoria"]
    aa.gravar(amostra[cols], SAIDA, "B1_auditoria_cardapios.csv", CONFERIR, script=__file__, semente=SEMENTE,
              populacao=len(itens), origem=arquivos,
              desenho=f"{N_ITENS} itens com preço, estrato = casa, mínimo {MINIMO_POR_CASA}, maiores restos")
    aa.resumo("B1 cardápios", len(itens), amostra)
    sem = sorted(c for c, p in originais.items() if not p)
    if sem:
        print(f"sem pasta de original em _dados-brutos/cardapios/ca_*: {', '.join(sem)} (conferir na fonte online)")
    print(f"gravado em: {SAIDA.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
