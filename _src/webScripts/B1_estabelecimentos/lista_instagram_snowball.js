// lista_instagram_snowball.js: itens do menu do instagram_snowball.user.js (Snowball do Instagram).
// O carregador do Tampermonkey lê este arquivo (@require) antes do script; editar aqui
// muda o menu no próximo recarregar da página, sem reinstalar.

// ---------- menu das sementes ----------
// Mesmo padrão do coletor de preços (B5): seletor com as sementes, marcadas como coletadas;
// escolher uma abre o perfil, abre a lista "seguindo", rola e baixa (uma fila de uma
// semente); "Próximo" faz o mesmo com a próxima que falta. Sementes: as 11 da rodada 1
// (dados/B1_redes_sociais/_dados-agregados/snowball/B1_snowball_sementes.csv) e as 41 próximas, por capital
// (B1_snowball_proximas_sementes.csv). [perfil, estabelecimento, grupo]
var LISTA_INSTAGRAM_SNOWBALL = [
  ["alcapaojogos", "", "Rodada 1"],
  ["arainhadosdados", "", "Rodada 1"],
  ["balboashobbygames", "", "Rodada 1"],
  ["flowg4mes", "", "Rodada 1"],
  ["fortaludica", "", "Rodada 1"],
  ["grutabsb", "", "Rodada 1"],
  ["jogasampa", "", "Rodada 1"],
  ["lojaredjogos", "", "Rodada 1"],
  ["ludotecabgc", "", "Rodada 1"],
  ["ludotecasidequest", "", "Rodada 1"],
  ["paladinohobbies", "", "Rodada 1"],
  ["garagemdonerd", "Garagem do Nerd", "Belo Horizonte"],
  ["ccg_floripa", "CCG Floripa", "Florianópolis"],
  ["paladinsgames", "Paladins Game Store", "Goiânia"],
  ["arcadeapub", "Arcadea Gaming Pub", "Porto Alegre"],
  ["nalaland.jogos", "Nala Land - Bar de Jogos de Tabuleiro em Recife", "Recife"],
  ["saojogue", "São Jogue - Bela Vista", "Salvador"],
  ["cafegeekvv", "Café Geek Cafeteria e Ludoteca", "Vitória"],
  ["dominariacg", "Dominaria Cards & Games", "Fortaleza"],
  ["gob.ludobar", "Game Of Boards", "Rio de Janeiro"],
  ["joyjoycafe", "Joyjoy Café", "Curitiba"],
  ["encounter.bg", "Encounter | Jogos de Tabuleiro | Board Games", "São Paulo"],
  ["insidegamestore", "Inside Games", "Brasília"],
  ["ludocafebh", "LudoCafé", "Belo Horizonte"],
  ["chefonplay", "Chef on Play", "Florianópolis"],
  ["ilusoesindustriais", "Ilusões Industriais", "Porto Alegre"],
  ["machadogames", "Machado Games", "Vitória"],
  ["luderiacariocajogos", "Luderia Carioca", "Rio de Janeiro"],
  ["boardzgamepub", "BoardZ Game Pub", "Curitiba"],
  ["covilgb", "Covil Game Bar", "São Paulo"],
  ["asgardbrasilia", "Loja de Jogos - Asgard", "Brasília"],
  ["shelfbar", "Shelf Bar e Jogos", "Belo Horizonte"],
  ["cineplay_sc", "Cineplay- Restaurante e Jogos", "Florianópolis"],
  ["magicstorebrasil", "Magic Store Brazil", "Rio de Janeiro"],
  ["vilacelta", "Vila Celta Hobby Store - Jogos e Café", "Curitiba"],
  ["bodogami", "Bodogami Restaurante e Cafeteria", "São Paulo"],
  ["utopiagamesbr", "Utopia Games & Food", "Brasília"],
  ["comdadobar", "Comdado Bar e Jogos", "Belo Horizonte"],
  ["tavernagamehouse", "Taverna Game House", "Curitiba"],
  ["bravojogos", "Bravo Jogos", "São Paulo"],
  ["ludusluderia", "Ludus Luderia", "São Paulo"],
  ["pittasboardgames", "Pitta's Board Games", "São Paulo"],
  ["playeasyjogos", "Play Easy", "São Paulo"],
  ["xplaceoficial", "XPlace", "São Paulo"],
  ["coletivogeekbr", "Coletivo Geek", "São Paulo"],
  ["lojaplacegames", "Place Games", "São Paulo"],
  ["castelosbareboardgames", "Castelos Bar & Boardgames", "São Paulo"],
  ["dungeongames.oficial", "Dungeon Games Store", "São Paulo"],
  ["omniverselivraria", "OMNIVERSE", "São Paulo"],
  ["aarenabg", "Arena BG | Jogos de Tabuleiro | Hamburgueria", "São Paulo"],
  ["cartolaluderia", "Cartola Luderia Bar", "São Paulo"],
  ["fanhourbr", "Fan Hour Games and Burgers", "São Paulo"],
];
