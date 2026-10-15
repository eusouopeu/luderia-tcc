"""
Bloco B1 - amostra de auditoria dos acervos de jogos das luderias: fidelidade do
nome do jogo e do preço de aluguel à fonte (Acervo de Jogos, Ludopedia, Rejoy,
cardápio de jogos) (_instrucoes/4_metodologia.md §3.4).

Desenho: 200 jogos, cada estabelecimento um estrato, mínimo de 3 por
estabelecimento, resto na proporção do tamanho do acervo descontado o mínimo,
maiores restos e menores chaves da semente (_src/extras/amostrar_auditoria.py),
o mesmo desenho do B2.

Entrada: acervo_jogos/B1_jogos_dos_acervos.csv (um jogo por estabelecimento e linha)
Saídas em _dados-brutos/acervos_luderias/auditoria/:
  B1_auditoria_acervos.csv
  auditoria_registro.csv

Conferência: abrir url_fonte, procurar o jogo e marcar jogo_na_fonte (sim/nao)
e anotar aluguel_na_fonte, quando a fonte tiver preço. O acervo muda depois da
coleta (jogo vendido ou novo): jogo ausente vai com a observação "saiu depois
da coleta?" e é conferido na cópia guardada, se houver.

Uso:
    python3 "_src/[B1] Estabelecimentos e cardapios/Acervo de Jogos/analise/B1-a_auditoria_acervos.py"
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
PROCESSADOS = ROOT / "dados" / "[B1] Estabelecimentos e cardapios"
ENTRADA = PROCESSADOS / "acervo_jogos/B1_jogos_dos_acervos.csv"
SAIDA = PROCESSADOS / "_dados-brutos/acervos_luderias/auditoria"

SEMENTE = 20261015
N_JOGOS = 200
MINIMO_POR_CASA = 3
CONFERIR = ["jogo_na_fonte", "aluguel_na_fonte"]


def main():
    jogos = pd.read_csv(ENTRADA, sep=None, engine="python", dtype=str, encoding="utf-8-sig")
    jogos["id_jogo"] = jogos.estabelecimento + ":" + jogos.jogo
    amostra = aa.sortear(jogos, "id_jogo", N_JOGOS, SEMENTE, estrato="estabelecimento", minimo=MINIMO_POR_CASA)
    cols = ["estrato_sorteio", "chave_sorteio", "estabelecimento", "fonte", "url_fonte", "posicao", "jogo",
            "aluguel_rs", "aluguel_dias", "data_coleta"]
    aa.gravar(amostra[cols], SAIDA, "B1_auditoria_acervos.csv", CONFERIR, script=__file__, semente=SEMENTE,
              populacao=len(jogos), origem=[ENTRADA],
              desenho=f"{N_JOGOS} jogos, estrato = estabelecimento, mínimo {MINIMO_POR_CASA}, maiores restos")
    aa.resumo("B1 acervos", len(jogos), amostra)
    print(f"gravado em: {SAIDA.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
