"""
Bloco B1 - amostra de auditoria da lista de estabelecimentos (Google Places):
fidelidade da nota média, do número de avaliações e do endereço à página do
Google Maps (_instrucoes/4_metodologia.md §3.4, etapa 1 do B1).

Desenho: 20% dos estabelecimentos curados (arredondado para cima), estratificado
por capital do endereço e faixa de volume de avaliações (101 a 300, 301 a 1000,
mais de 1000), alocação proporcional pelos maiores restos e, dentro do estrato,
as menores chaves da semente (_src/extras/amostrar_auditoria.py).

Entrada: estabelecimentos/2_recorte/B1_curadoria_metro_f_av100.csv
Saídas:
  _dados-brutos/estabelecimentos/auditoria/B1_auditoria_estabelecimentos.csv
  _dados-brutos/estabelecimentos/auditoria/auditoria_registro.csv (uma linha por sorteio)

Conferência: abrir link_google_maps e anotar nota_na_pagina e
volume_na_pagina como aparecem na página, e endereco_confere (sim/nao). Os
números são anotados, não julgados: nota e volume mudam desde data_coleta, e a
comparação (nota igual com uma casa decimal; volume na página maior ou igual ao
coletado) é feita depois, por script, com os dias decorridos ao lado.

Uso:
    python3 "_src/[B1] Estabelecimentos e cardapios/Google Places (Negócios)/analise/B1-a_auditoria_estabelecimentos.py"
"""
# Caminhos: _src/extras/ (log comum e sorteio); log em ../logs/
import sys
from pathlib import Path
_AQUI = Path(__file__).resolve()
sys.path[:0] = [str(_AQUI.parents[3] / "extras")]
from log_execucao import registrar_execucao  # noqa: E402
if __name__ == "__main__":
    registrar_execucao(__file__)

import math

import pandas as pd

import amostrar_auditoria as aa

ROOT = Path(__file__).resolve().parents[4]
PROCESSADOS = ROOT / "dados" / "[B1] Estabelecimentos e cardapios"
BRUTOS = PROCESSADOS / "_dados-brutos"
ENTRADA = PROCESSADOS / "estabelecimentos/2_recorte/B1_curadoria_metro_f_av100.csv"
SAIDA = BRUTOS / "estabelecimentos/auditoria"

SEMENTE = 20261015
FRACAO = 0.20
FAIXAS = [(101, 300, "101 a 300"), (301, 1000, "301 a 1000"), (1001, math.inf, "mais de 1000")]
CONFERIR = ["nota_na_pagina", "volume_na_pagina", "endereco_confere"]


def faixa(volume) -> str:
    v = float(volume)
    return next(r for a, b, r in FAIXAS if a <= v <= b)


def main():
    pop = pd.read_csv(ENTRADA, sep=None, engine="python", dtype=str, encoding="utf-8-sig")
    pop["faixa_volume"] = pop["volume_avaliacoes"].map(faixa)
    pop["estrato"] = pop["capital_endereco"] + " · " + pop["faixa_volume"]
    n = math.ceil(FRACAO * len(pop))
    amostra = aa.sortear(pop, "place_id", n, SEMENTE, estrato="estrato")
    cols = ["estrato_sorteio", "chave_sorteio", "place_id", "nome", "capital_endereco", "faixa_volume",
            "avaliacao_media", "volume_avaliacoes", "endereco", "data_coleta", "link_google_maps"]
    caminho = aa.gravar(amostra[cols], SAIDA, "B1_auditoria_estabelecimentos.csv", CONFERIR,
                        script=__file__, semente=SEMENTE, populacao=len(pop), origem=[ENTRADA],
                        desenho=f"{FRACAO:.0%} estratificado por capital e faixa de volume, maiores restos")
    aa.resumo("B1 estabelecimentos", len(pop), amostra)
    print(amostra.groupby("capital_endereco").size().to_string())
    print(f"gravado: {caminho.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
