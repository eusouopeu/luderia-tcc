"""
Onde ficam os cardápios originais (PDF, imagens) de cada estabelecimento.

Os originais ficam em dados/[B1] Estabelecimentos e cardapios/_dados-brutos/cardapios/,
numa pasta por estabelecimento agrupada pela cidade: ca_<cidade>/ca_<estabelecimento>/.
A cidade é a capital da região metropolitana do endereço (recorte_rm.py), a mesma
usada nas tabelas do B1.

PASTAS liga o nome usado nas saídas (coluna `estabelecimento` de
B1_cardapios_baixados.csv e B1_cardapios_ocr_linhas.csv, que era o nome da pasta
antes de 14/10/2026) à cidade e ao nome curto da pasta. Estabelecimento novo entra
aqui antes de rodar a coleta.
"""
import pathlib

ROOT = pathlib.Path(__file__).resolve().parents[4]
BRUTOS = ROOT / "dados" / "[B1] Estabelecimentos e cardapios" / "_dados-brutos"
ORIGINAIS = BRUTOS / "cardapios"

# nome nas saídas -> (cidade, estabelecimento), para ca_<cidade>/ca_<estabelecimento>/
PASTAS = {
    "Alçapão Jogos": ("curitiba", "alcapao_jogos"),
    "Arcadea Gaming Pub": ("porto_alegre", "arcadea_gaming_pub"),
    "BoardZ Game Pub": ("curitiba", "boardz_game_pub"),
    "Cardapio Cineplay": ("florianopolis", "cineplay"),
    "Cardapio Comdado": ("belo_horizonte", "comdado"),
    "Cardapio Covil Game bar": ("sao_paulo", "covil_game_bar"),
    "Cardapio Ludoteca BCG": ("brasilia", "ludoteca_bgc"),
    "Cardapio Utopia": ("brasilia", "utopia"),
    "Cardápio Cafe geek": ("vitoria", "cafe_geek"),
    "Cardápio Chef on play": ("florianopolis", "chef_on_play"),
    "Cardápio Encounter": ("sao_paulo", "encounter"),
    "Cardápio Flow Games": ("sao_paulo", "flow_games"),
    "Cardápio cartola": ("sao_paulo", "cartola"),
    "Cardápio inside games": ("brasilia", "inside_games"),
    "Castelos Bar": ("sao_paulo", "castelos_bar"),
    "Fortalúdica": ("brasilia", "fortaludica"),
    "Luderia Carioca": ("rio_de_janeiro", "luderia_carioca"),
    "Ludus Luderia": ("sao_paulo", "ludus_luderia"),
    "TabuClub": ("rio_de_janeiro", "tabuclub"),
}
# Cardápio de jogos (não de comida e bebida): fica com os acervos das luderias
JOGOS_COVIL = ("Cardapio de jogos Covil Game bar", BRUTOS / "acervos_luderias" / "Cardapio de jogos Covil Game bar")


def pasta_original(nome):
    """Pasta dos originais de um estabelecimento: ca_<cidade>/ca_<estabelecimento>/."""
    cidade, estab = PASTAS[nome]
    return ORIGINAIS / f"ca_{cidade}" / f"ca_{estab}"
