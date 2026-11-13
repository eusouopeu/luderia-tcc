// lista_aluguel.js: itens do menu do aluguel.user.js (Coletor de anúncios de aluguel).
// O carregador do Tampermonkey lê este arquivo (@require) antes do script; editar aqui
// muda o menu no próximo recarregar da página, sem reinstalar. As buscas do menu saem da
// montagem padrão (bairros × tipos × portais); a fila já editada no painel prevalece até
// o botão "Padrão" (seta circular, ao lado de "Continuar").

var LISTA_ALUGUEL = {
  // Buscas do plano (C04 e C05, áreas do 6.4): Loja e Outros com 100 m² ou mais, nos
  // bairros abaixo; os portais ficam no script (OLX, ZAP e Viva Real).
  montagem_padrao: { bairros: ['Pituba', 'Graça', 'Itaigara'], outros: '', areaMin: 100, areaMax: null, tipos: ['loja'] },
  // Bairros do menu do painel: no topo, juntos, os 10 de maior renda média familiar per capita
  // (Gomes et al., "Salvador: ecos da escravidão e da desigualdade em uma economia periférica",
  // apêndice, p. 185-188, 2018-2020), em ordem decrescente de renda; depois, os demais bairros de
  // Salvador em ordem alfabética. Os nomes compostos do apêndice ("Ondina/Chame-Chame") entram
  // separados, como os portais os escrevem (o 8º colocado ocupa duas linhas); o que o portal não
  // reconhecer fica sem resultado (campo "outros" para a grafia do portal).
  bairros_destaque: ['Pituba', 'Itaigara', 'Graça', 'Patamares', 'Caminho das Árvores', 'Vitória', 'Barra', 'Ondina', 'Chame-Chame', 'Rio Vermelho', 'Canela'],
  bairros_salvador: ('Acupe;Águas Claras;Alto da Terezinha;Alto das Pombas;Alto do Cabrito;Alto do Coqueirinho;Amaralina;Areia Branca;Arenoso;Arraial do Retiro;'
    + 'Bairro da Paz;Baixa de Quintas;Barbalho;Barreiras;Barris;Beiru;Boa Viagem;Boa Vista de Brotas;Boa Vista de São Caetano;Boca da Mata;Boca do Rio;Bom Juá;Bonfim;'
    + 'Brotas;Cabula;Cabula VI;Caixa d\'Água;Cajazeiras II;Cajazeiras IV;Cajazeiras V;Cajazeiras VI;Cajazeiras VII;Cajazeiras VIII;Cajazeiras X;Cajazeiras XI;Calabar;'
    + 'Calabetão;Calçada;Caminho das Árvores;Caminho de Areia;Campinas de Pirajá;Canabrava;Candeal;Canela;Capelinha;Cassange;Castelo Branco;Centro;Centro Histórico;'
    + 'Chame-Chame;Chapada do Rio Vermelho;Cidade Nova;Colina de Periperi;Comércio;Cosme de Farias;Costa Azul;Coutos;Curuzu;Dois de Julho;Dom Avelar;Doron;'
    + 'Engenho Velho da Federação;Engenho Velho de Brotas;Engomadeira;Fazenda Coutos;Fazenda Grande do Retiro;Fazenda Grande I;Fazenda Grande II;Fazenda Grande III;'
    + 'Fazenda Grande IV;Federação;Garcia;Granjas Rurais Presidente Vargas;IAPI;Ilha Amarela;Ilha de Bom Jesus dos Passos;Ilha de Maré;Ilha dos Frades;Imbuí;Itacaranha;'
    + 'Itapuã;Itinga;Jaguaripe I;Jardim Armação;Jardim Cajazeiras;Jardim Cruzeiro;Jardim das Margaridas;Jardim Nova Esperança;Jardim Santo Inácio;Horto Florestal;Lapinha;'
    + 'Liberdade;Lobato;Luiz Anselmo;Macaúbas;Mangueira;Marechal Rondon;Mares;Massaranduba;Mata Escura;Matatu;Mirante de Periperi;Monte Serrat;Moradas da Lagoa;Mussurunga;'
    + 'Narandiba;Nazaré;Nordeste de Amaralina;Nova Brasília;Nova Constituinte;Nova Esperança;Nova Sussuarana;Novo Horizonte;Novo Marotinho;Ondina;Palestina;Paripe;Patamares;'
    + 'Pau da Lima;Pau Miúdo;Periperi;Pernambués;Pero Vaz;Piatã;Pirajá;Pituaçu;Plataforma;Praia Grande;Resgate;Retiro;Ribeira;Rio Sena;Roma;Saboeiro;Santa Cruz;Santa Luzia;'
    + 'Santa Mônica;Santo Agostinho;Santo Antônio;São Caetano;São Cristóvão;São Gonçalo;São João do Cabrito;São Marcos;São Rafael;São Tomé;Saramandaia;Saúde;Sete de Abril;'
    + 'Stella Maris;Stiep;Sussuarana;Tancredo Neves;Tororó;Trobogy;Uruguai;Vale das Pedrinhas;Vale dos Lagos;Valéria;Vila Canária;Vila Laura;Vila Ruy Barbosa;Vista Alegre;Vitória').split(';'),
};
