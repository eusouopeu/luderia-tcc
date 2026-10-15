"""
Bloco B2 - amostra de auditoria das avaliações coletadas (maps_avaliacoes.user.js):
fidelidade do texto, da nota e do rótulo de data à página (etapa 1) e completude
por estabelecimento (etapa 2) (_instrucoes/4_metodologia.md §3.4, "Amostra de
auditoria do Bloco B2").

Desenho da etapa 1 (o do texto do método):
1. n = 200 avaliações com texto do recorte;
2. mínimo de 3 por estabelecimento (ou todas, se tiver menos);
3. resto na proporção do número de avaliações do estabelecimento descontado o
   mínimo, maiores restos (a soma fecha com 200);
4. chave aleatória pela semente fixa, gravada como valor; dentro do
   estabelecimento, as de menor chave (_src/extras/amostrar_auditoria.py).
A segunda etapa (estabelecimento com erro) usa a mesma chave: as 20 seguintes
na ordem de chave_sorteio, ou todas, se o recorte tiver até 30.

Entrada: B2_avaliacoes_periodo.csv (base consolidada por B2-b_avaliacoes.py)
Saídas em _dados-brutos/coletas/auditoria/ (fora do git: trazem o texto das avaliações):
  B2_auditoria_avaliacoes.csv   etapa 1: texto_confere, nota_confere, data_relativa_na_pagina
  B2_auditoria_completude.csv   etapa 2: todos os estabelecimentos, com o número coletado
                                no recorte e a coluna para o número contado na página
  auditoria_registro.csv        semente e hash SHA-256 da base de origem

Uso:
    python3 "_src/[B2] Avaliacoes recentes/Google Places (Comentários)/analise/B2-a_auditoria_avaliacoes.py"
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
PROCESSADOS = ROOT / "dados" / "[B2] Avaliacoes recentes"
ENTRADA = PROCESSADOS / "B2_avaliacoes_periodo.csv"
SAIDA = PROCESSADOS / "_dados-brutos/coletas/auditoria"

SEMENTE = 20261015
N_AVALIACOES = 200
MINIMO_POR_ESTABELECIMENTO = 3
CONFERIR = ["avaliacao_encontrada", "texto_confere", "nota_confere", "data_relativa_na_pagina"]
CONFERIR_COMPLETUDE = ["n_com_texto_na_pagina", "n_sem_texto_na_pagina", "ultima_no_recorte_na_pagina"]


def main():
    base = pd.read_csv(ENTRADA, sep=";", dtype=str, encoding="utf-8-sig")
    recorte = base[(base.no_recorte == "sim") & (base.tem_texto == "sim")].copy()
    amostra = aa.sortear(recorte, "review_id", N_AVALIACOES, SEMENTE, estrato="place_id",
                         minimo=MINIMO_POR_ESTABELECIMENTO)
    cols = ["estrato_sorteio", "chave_sorteio", "nome_estabelecimento", "review_id", "autor_pseudonimo",
            "nota_avaliacao", "data_relativa", "editada", "texto_avaliacao", "traduzida", "url", "coletado_em",
            "arquivo_coleta"]
    desenho = (f"{N_AVALIACOES} avaliações com texto do recorte, estrato = estabelecimento, "
               f"mínimo {MINIMO_POR_ESTABELECIMENTO}, maiores restos")
    aa.gravar(amostra[cols], SAIDA, "B2_auditoria_avaliacoes.csv", CONFERIR, script=__file__, semente=SEMENTE,
              populacao=len(recorte), origem=[ENTRADA], desenho=desenho)

    no_recorte = base[base.no_recorte == "sim"]
    completude = (no_recorte.groupby(["place_id", "nome_estabelecimento"])
                  .agg(n_com_texto_coletado=("tem_texto", lambda s: (s == "sim").sum()),
                       n_sem_texto_coletado=("tem_texto", lambda s: (s != "sim").sum()),
                       data_referencia=("data_referencia", "max"), coletado_em=("coletado_em", "max"),
                       url=("url", "first"))
                  .reset_index())
    completude.insert(0, "chave_sorteio", "")
    completude.insert(0, "estrato_sorteio", "todos")
    soma = completude.n_com_texto_coletado.sum() + completude.n_sem_texto_coletado.sum()
    assert soma == len(no_recorte), "completude não fecha com o total do recorte"
    aa.gravar(completude, SAIDA, "B2_auditoria_completude.csv", CONFERIR_COMPLETUDE, script=__file__, semente="",
              populacao=len(completude), origem=[ENTRADA], desenho="todos os estabelecimentos (exaustivo)")

    aa.resumo("B2 avaliações", len(recorte), amostra)
    print(f"completude: {len(completude)} estabelecimentos, {soma} avaliações no recorte (soma confere)")
    print(f"gravado em: {SAIDA.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
