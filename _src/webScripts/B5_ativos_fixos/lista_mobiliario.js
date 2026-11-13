// lista_mobiliario.js: itens do menu do mobiliario.user.js (Coletor de preços do mobiliário).
// O carregador do Tampermonkey lê este arquivo (@require) antes do script; editar aqui
// muda o menu no próximo recarregar da página, sem reinstalar.

// Itens de fonte "coleta" da lista da etapa 1: [id, categoria, item, termo de busca, palavras
// exigidas, palavras excluídas] (colunas termo_busca, termo_exige e termo_exclui; "|" separa
// as palavras e "/" separa alternativas).
// O teste (mobiliario.test.cjs) confere esta lista com o CSV.
var LISTA_MOBILIARIO = [
  ['OB40', 'obra_reforma', 'Ar-condicionado split', 'ar condicionado split 30000 btus inverter', 'split|inverter', 'janela|portatil|on off|controle remoto|suporte|capa'],
  ['OB41', 'obra_reforma', 'Instalação do split', 'kit instalacao ar condicionado split 30000 btus 5 metros', 'kit|instala', 'suporte avulso|dreno|bomba|capa|controle'],
  ['OB42', 'obra_reforma', 'Letreiro de fachada', 'fachada acm letra caixa iluminada led', 'fachada/letreiro|acm', 'adesivo|neon|mini|mesa|placa de sinalizacao|letra avulsa'],
  ['MO01', 'mobiliario', 'Mesa de jogo para 6 lugares', 'mesa industrial 160x80 tampo pinus pe metal preto', 'mesa|industrial/metal/ferro/aco/metalon', 'cadeira|conjunto|jogo de jantar|banco|dobravel|infantil|escritorio|centro|bistro|vidro|marmore|laca|quadrada|redonda|apoio|aparador|bancada'],
  ['MO02', 'mobiliario', 'Mesa de jogo para 4 lugares', 'mesa industrial quadrada 80x80 tampo pinus pe metal preto', 'mesa|quadrada|industrial/metal/ferro/aco/metalon', 'cadeira|conjunto|jogo de jantar|banco|dobravel|infantil|centro|lateral|bistro|alta|vidro|marmore|laca'],
  ['MO03', 'mobiliario', 'Cadeira', 'cadeira industrial metal preta assento madeira', 'cadeira|metal/ferro/aco/industrial', 'gamer|escritorio|giratoria|rodizio|infantil|praia|capa|almofada|poltrona|banqueta|bistro|alta|estofada|veludo|plastico|estofado|banco|bancos|alto|mesa|polipropileno|courino'],
  ['MO04', 'mobiliario', 'Luminária pendente sobre a mesa', 'luminaria pendente industrial cupula metal preto e27', 'pendente|preto/preta', 'abajur|luminaria de mesa|trilho|spot|arandela|lampada avulsa|plafon|fita|dourado|cristal|rose|semi embutida|3 lampadas|bilhar|parede|tripla'],
  ['MO05', 'mobiliario', 'Estante do acervo', 'estante industrial metalon preto pinus 5 prateleiras 180 cm', 'estante|5 prateleira|industrial/metalon/ferro/aco', 'sapateira|banheiro|plastica|plastico|mini|nicho|parede|escada'],
  ['MO06', 'mobiliario', 'Balcão de atendimento e caixa', 'balcao industrial metalon preto tampo pinus loja caixa', 'balcao|industrial/metalon/ferro/aco', 'cozinha|pia|banheiro|gabinete|buffet|aereo|rack|tv|mini|refrigerado|vidro'],
  ['MO07', 'mobiliario', 'Armário de funcionários', 'armario roupeiro aco 8 portas vestiario', 'roupeiro/vestiario|aco', 'guarda roupa|mdf|infantil|casal|solteiro|cabideiro'],
  ['CB01', 'cozinha_bar', 'Fogão industrial', 'fogao industrial 4 bocas com forno', 'industrial', 'sem forno|embutir|cooktop|mesa vidro'],
  ['CB02', 'cozinha_bar', 'Chapa bifeteira', 'chapa bifeteira industrial gas 70cm', 'chapa|gas', 'ferro fundido|para fogao|eletrica|grill|sanduicheira'],
  ['CB03', 'cozinha_bar', 'Fritadeira', 'fritadeira industrial 2 cubas', 'fritadeira|2 cuba/dupla', 'air fryer|airfryer|sem oleo|cesto avulso|chapeira'],
  ['CB04', 'cozinha_bar', 'Forno elétrico de bancada', 'forno eletrico industrial bancada', 'industrial/comercial/profissional', 'air fryer|airfryer|micro ondas'],
  ['CB05', 'cozinha_bar', 'Coifa com exaustor', 'coifa inox industrial parede 150 cm', 'coifa', 'depurador|ilha|central|vidro|filtro avulso|carvao|60 cm|90 cm|cooktop|fogao|purificador|chapeu|duto avulso'],
  ['CB06', 'cozinha_bar', 'Geladeira comercial', 'refrigerador comercial 4 portas', '4 porta', 'frigobar|cervejeira|vidro'],
  ['CB07', 'cozinha_bar', 'Freezer horizontal', 'freezer horizontal 2 tampas 400 litros', 'horizontal', 'vertical|1 tampa|1 porta'],
  ['CB08', 'cozinha_bar', 'Expositor de bebidas', 'expositor vertical bebidas porta vidro', 'vertical|vidro', 'frigobar|mini|cooler'],
  ['CB09', 'cozinha_bar', 'Mesa de inox', 'mesa inox 150 cm cozinha industrial', 'inox', 'escrivaninha|escritorio|gamer|computador|jantar|centro|dobravel'],
  ['CB10', 'cozinha_bar', 'Pia industrial', 'pia inox industrial 2 cubas', 'industrial|2 cuba/dupla', 'embutir|sobrepor|gourmet|torneira|tanque'],
  ['CB11', 'cozinha_bar', 'Liquidificador industrial', 'liquidificador industrial 4 litros', 'industrial', 'portatil|mini|copo avulso|jarra avulsa'],
  ['CB12', 'cozinha_bar', 'Multiprocessador', 'processador de alimentos industrial', 'industrial/comercial/profissional', 'manual|mini|usb|disco avulso|lamina avulsa'],
  ['CB13', 'cozinha_bar', 'Micro-ondas', 'micro-ondas 30 litros', 'micro ondas', 'suporte|prato giratorio|prato avulso|capa'],
  ['CB14', 'cozinha_bar', 'Kit de gás', 'kit regulador gas p45 alta vazao mangueira', 'regulador', 'p13|fogareiro|macarico|maçarico|botijao p13'],
  ['CB15', 'cozinha_bar', 'Utensílios de cozinha', 'kit panelas aluminio grosso industrial hotel', 'panela|industrial/hotel/restaurante', 'brinquedo|infantil|miniatura|tampa avulsa|panela de pressao eletrica'],
  ['CB16', 'cozinha_bar', 'Pratos', 'prato raso porcelana branco 26 cm kit 12', 'prato|raso', 'descartavel|papel|suporte|porta prato|sobremesa|fundo|infantil|decorativo|bolo'],
  ['CB17', 'cozinha_bar', 'Copos', 'copo long drink vidro 300 ml caixa 24', 'copo|long', 'acrilico|plastico|descartavel|taca|caneca|termico|personalizado|gravado|canudo'],
  ['CB18', 'cozinha_bar', 'Talheres', 'kit garfo e faca de mesa inox restaurante 12 pares', 'garfo|faca', 'colher|sobremesa|descartavel|plastico|infantil|faqueiro|churrasco|bolo|peixe'],
  ['CB19', 'cozinha_bar', 'Estante de aço', 'estante aço 5 prateleiras', 'aco', 'sapateira|plastica|plastico|banheiro|mini'],
  ['CB20', 'cozinha_bar', 'Lava-louças', 'lava loucas industrial capota', 'louca|industrial/comercial/capota/restaurante/profissional', 'servicos|detergente|secante|pastilha|cesto avulso|bancada|roupa|alta pressao|pia|torneira|ducha|portatil|mini|escorredor|esponja'],
  ['EQ01', 'equipamentos', 'Computador', 'notebook intel core i5 8gb ssd 256gb', 'notebook|i5', 'recondicionado|usado|seminovo|capa|mochila|suporte|carregador|bateria|para notebook|teclado|memoria'],
  ['EQ02', 'equipamentos', 'Impressora de NFC-e', 'impressora termica nao fiscal 80mm', '80 mm', 'etiqueta|portatil|a4|sem tinta'],
  ['EQ04', 'equipamentos', 'Roteador Wi-Fi', 'roteador wifi 6 dual band', 'wi fi 6/wifi 6/ax', 'repetidor|xpon|ont|wi fi 7|wifi 7|4g|chip'],
  ['EQ05', 'equipamentos', 'Som ambiente', 'caixa de som ativa amplificada 10 polegadas bivolt', 'caixa|ativa/amplificada', 'portatil|karaoke|automotivo|carro|mini|alto falante|capa|suporte|cabo|trio'],
  ['EQ06', 'equipamentos', 'Câmeras', 'kit cftv 4 cameras full hd dvr 4 canais', 'kit|dvr/nvr', 'fonte avulsa|conector|balun|cabo|suporte|caixa hermetica|falsa|fake|bateria'],
];
