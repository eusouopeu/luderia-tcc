// lista_cardapio.js: itens do menu do cardapio.user.js (Coletor de cardápios).
// O carregador do Tampermonkey lê este arquivo (@require) antes do script; editar aqui
// muda o menu no próximo recarregar da página, sem reinstalar.

// ---------- menu dos cardápios ----------
// Cardápios digitais conhecidos das casas do B1 (B1_cardapios_digitais_itens.csv,
// B1_cardapios_busca_profunda.csv e B1_busca_minuciosa_taxa_cardapio_acervo.csv): só os
// que abrem como página (sem PDF, imagem, blog ou rede social). antes = itens já coletados.
// [id, casa, capital, url, antes: [itens, data] ou null]
var LISTA_CARDAPIO = [
  ['bardo_mago', 'Bardo Mago', 'Belo Horizonte', 'https://www.vucafood.com.br/funminds/2219/cardapio-digital', [111, '2026-10-12']],
  ['garagem_do_nerd', 'Garagem do Nerd', 'Belo Horizonte', 'https://garagemdonerd.com.br/cardapio/', null],
  ['la_tabuleria', 'La Tabuleria', 'Belo Horizonte', 'https://latabuleria.saipos.com/home', [104, '2026-10-12']],
  ['metropoly_bar', 'Metropoly Bar', 'Campinas', 'https://www.deliway.com.br/metropoly-bar-delivery-campinas-sp', null],
  ['toca_do_rato', 'Toca do Rato - Pizzaria e Jogos de Tabuleiro', 'Porto Alegre', 'https://tocadoratopizzasejogos.saipos.com/home', [25, '2026-10-12']],
  ['cheio_de_fome', 'Cheio de Fome - Vila da Penha', 'Rio de Janeiro', 'https://pedido.anota.ai/loja/cheio-de-fome-vila-da-penha-1', null],
  ['game_of_boards', 'Game Of Boards', 'Rio de Janeiro', 'https://www.ifood.com.br/delivery/rio-de-janeiro-rj/game-of-boards---ludobar--pizzaria-botafogo/', null],
  ['sao_jogue_bela_vista', 'São Jogue - Bela Vista', 'Salvador', 'https://sao-jogue.goomer.app/', null],
  ['fan_hour', 'Fan Hour Games and Burgers', 'São Paulo', 'https://qrco.de/bdUhFc', null],
];
