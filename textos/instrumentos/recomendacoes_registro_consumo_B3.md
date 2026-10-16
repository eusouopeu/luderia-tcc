# Como facilitar o registro de comidas e bebidas na contagem do B3

Escrito em 16/10/2026, depois da visita de 10/10 ao Bela Vista, em que o módulo de pedidos ficou vazio (0 pedidos) e o único dado de consumo foi a NFC-e do próprio observador.

## Que decisão do plano isso muda

O ticket de A&B por pessoa é uma das premissas críticas do modelo financeiro e hoje está em N6. O que a visita precisa dar para subir esse nível são três números: a fração de mesas que consomem A&B, o que consomem (comida, bebida alcoólica, sem álcool, sobremesa) e quantas rodadas fazem por permanência. O tempo de espera do pedido só testa uma reclamação do B2 (11% das negativas) e pode ficar em segundo plano.

O app atual pede, para cada pedido, a categoria, a hora do pedido e a hora da chegada. Isso exige seguir o garçom, o que não cabe numa visita com um observador cuidando da porta e das mesas. As propostas abaixo vão da mais barata para a mais cara.

## Recomendações

1. **Marca de comida e bebida na contagem de 30 min (recomendada).** Na rodada de contagem que já existe, cada mesa ocupada ganha dois toques opcionais: "tem comida" e "tem bebida" (o que está sobre a mesa naquele instante). Custa segundos por rodada e, ao longo da visita, dá a fração de mesas consumindo e em que fase da permanência o consumo aparece. Não depende de ver o pedido sendo feito.

2. **Pedido em um toque no desenho da mesa.** Em vez do formulário, três botões na mesa ocupada: bebida, comida e sobremesa. Cada toque grava a hora e a categoria; um segundo toque no mesmo item, quando chega, grava a chegada. Se o observador não viu a chegada, o pedido fica só com a hora (sem espera), o que já serve para contar rodadas.

3. **Duas ou três mesas-sentinela por visita.** O observador escolhe, ao começar, as mesas de vista mais clara e registra o consumo completo só nelas (itens e rodadas). As demais ficam só com a marca do item 1. Assim o detalhe sai de uma amostra declarada, e não de mesas lembradas ao acaso.

4. **Itens do cardápio pré-carregados.** A foto do cardápio tirada na chegada (tarefa do roteiro da visita) vira, depois, uma lista de itens com preço no pipeline (`B3-b_ocr_fotos.py`). Na visita seguinte, o app oferece esses itens para escolher no pedido, com o preço, e o ticket da mesa sai da soma. Sem a lista, basta a categoria.

5. **Consumo próprio como âncora de preço.** O observador pede pelo menos uma bebida e um item de comida e guarda a NFC-e. Isso confere o preço do cardápio, a taxa de serviço (10% sobre o consumo, sem a entrada, na nota de 10/10) e a forma de cobrança, e dá um ponto de ticket com fonte primária.

6. **Notas emitidas no intervalo como teto.** A NFC-e no início e no fim da visita, que já está no roteiro, dá o número de notas emitidas. Somado às pessoas que entraram, dá notas por pessoa; com o ticket da nota própria e a fração de mesas consumindo, fecha uma faixa de faturamento de A&B na noite.

7. **Nota de voz para o que não cabe no toque.** Um botão de gravar, preso à mesa e à hora, para o observador dizer "mesa 4 pediu duas cervejas e uma porção" sem digitar. A transcrição fica para o pipeline.

## Ordem sugerida

Para as visitas de 17/10 a 28/10, os itens 1, 5 e 6 bastam e não pedem esforço novo em campo; o 1 é a única mudança no app. Os itens 2 e 3 entram se, na primeira visita de retorno, sobrar atenção depois da porta e das mesas. Os itens 4 e 7 dependem da foto do cardápio e de trabalho no pipeline, e ficam para depois.
