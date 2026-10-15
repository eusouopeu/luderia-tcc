"""
Bloco B1 - caminhos e constantes comuns ao snowball pelo Instagram
(build/B1-b_instagram_seguindo.py e analise/B1-a_instagram_snowball.py).
"""
import instagram_comum as ic

BRUTOS = ic.PASTA_B1 / "_dados-brutos" / "redes_sociais"
BRUTOS_SEGUINDO = BRUTOS / "seguindo"          # CSVs do coletor (fora do git)
BRUTOS_SNOWBALL = BRUTOS / "snowball"          # candidatos com @ de pessoas (fora do git)
CANDIDATOS = BRUTOS_SNOWBALL / "B1_snowball_candidatos.csv"
# Recorte para leitura: seguidas por CORTE_LEITURA+ sementes; a classe preenchida
# nele volta para a lista de candidatos na execução seguinte do build.
CORTE_LEITURA = 3
CANDIDATOS_LEITURA = BRUTOS_SNOWBALL / f"B1_snowball_candidatos_grau{CORTE_LEITURA}.csv"
SAIDA = ic.PASTA_REDES / "snowball"            # só agregados e perfis de negócio (no git)

CURADORIA = ic.PASTA_B1 / "estabelecimentos" / "2_recorte" / "B1_curadoria.csv"
ACERVO_LOJAS = ic.PASTA_B1 / "acervo_jogos" / "B1_acervodejogos_lojas.csv"

COLS_MANUAIS = ["classe", "metropole", "avaliacoes_maps", "observacao"]
CLASSES = [
    "casa de jogos", "loja com espaço de jogo", "loja sem espaço de jogo",
    "editora ou distribuidora", "evento, grupo ou associação",
    "criador ou influenciador", "pessoa", "outro",
]
# Classes que o B1 trata como luderia (as duas da tipologia do B2).
LUDERIA = {ic.C, ic.L}
# Classes que podem ser publicadas com o @ (perfis de negócio ou de grupo).
PUBLICAVEIS = LUDERIA | {"loja sem espaço de jogo", "editora ou distribuidora", "evento, grupo ou associação"}
METROPOLES = {
    "Belo Horizonte", "Belém", "Brasília", "Curitiba", "Florianópolis", "Fortaleza", "Goiânia",
    "Manaus", "Porto Alegre", "Recife", "Rio de Janeiro", "Salvador", "São Paulo", "Vitória",
}
LIMIAR_AVALIACOES = 100  # o mesmo do B1: mais de 100 avaliações
