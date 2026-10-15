# Roteiro de auditoria do entorno (Bloco B1)

Roteiro da conferência manual do entorno das luderias no Google Maps. O protocolo geral está em `_instrucoes/4_metodologia.md` §3.4 ("Validação da coleta"). Este arquivo diz **o que abrir, como medir e o que anotar**. O parecer sobre o coletor, com as falhas já conhecidas, está em `docs/parecer_entorno_B1.md`.

## 1. O que a auditoria mede

O coletor (`maps_entorno.user.js`) conta, a 500 m e a 1000 m de cada casa, estações de metrô, de trem, de VLT ou BRT e shoppings, no Google Maps e no OpenStreetMap. A auditoria mede dois erros do coletor:

- **Fidelidade:** o item contado existe, está no grupo certo e está à distância registrada.
- **Completude:** nenhum item do raio ficou de fora.

A auditoria confere o instrumento contra a página. Ela não julga se a contagem em linha reta é a melhor medida de fluxo: essa questão é de validade e está no parecer.

## 2. Distância: linha reta, de pino a pino

A distância conferida é **em linha reta**, não a do trajeto. O motivo é a definição da variável: o coletor mede a distância em linha reta (fórmula de haversine) entre a coordenada da casa e a coordenada do resultado. Uma medida por rota mudaria a variável, e a diferença apareceria como erro do coletor sem ser erro.

A medição segue o mesmo caminho do coletor:

1. Abrir o pino da casa pelo `link_google_maps`.
2. Clicar com o botão direito sobre o pino da casa e escolher **Medir distância**.
3. Clicar sobre o pino do item (estação ou shopping). O Maps mostra a distância total na parte de baixo da tela.
4. Anotar o valor em metros em `distancia_medida_m`.

O ponto de chegada é o pino do item no Maps, não a entrada da estação nem a borda do shopping. No OpenStreetMap, o coletor mede até a borda do polígono, quando há polígono. Nesse caso, a medição vai até o ponto mais próximo do contorno do item.

**Distância a pé (opcional):** nos itens entre 300 m e 1000 m, vale anotar também a distância da rota a pé em `distancia_a_pe_m` (botão Rotas, modo a pé, menor distância sugerida). Essa coluna não entra na taxa de erro. Ela serve para medir o quanto a linha reta subestima o trajeto, que é a dúvida de validade do parecer. A rota de carro não é usada: o fluxo que interessa ao plano é o de pedestres.

## 3. Antes de começar

- [ ] Rodar `B1-a_auditoria_entorno.py` depois da última coleta, para a amostra trazer os valores atuais. A chave do sorteio depende só do `place_id`: os estabelecimentos sorteados não mudam com a recoleta.
- [ ] Conferir se a coleta do OSM já é a corrigida (versão 2026.10.15-3 ou posterior, com polígonos). A coleta do OSM de 15/10, das 11h38, trouxe só nós (ver o parecer). Até a recoleta, conferir só os itens com `fonte = maps`.
- [ ] Abrir o Google Maps numa janela anônima, sem login, em português (`hl=pt-BR`). A janela anônima reduz a personalização dos resultados.
- [ ] Abrir `_dados-brutos/entornos/auditoria/B1_auditoria_entorno_estabelecimentos.csv` e `B1_auditoria_entorno_itens.csv`.
- [ ] Fazer a conferência em até sete dias depois da coleta, como pede a metodologia. Anotar a data em `conferido_em` e o nome em `conferente`.

## 4. Passo a passo por estabelecimento

Tempo previsto: 15 a 20 minutos por casa.

### 4.1 Fidelidade dos itens contados

Para cada linha do arquivo de itens da casa:

1. Abrir `link_ponto` (coordenada registrada) e `link_busca_nome` (busca pelo nome). Para itens do OSM, abrir também `link_osm`.
2. Marcar `existe`:
   - `sim`, quando o lugar existe e funciona;
   - `nao`, quando não existe, está fechado de vez ou é estação futura ou desativada.
3. Marcar `grupo_confere` pela categoria do Maps e pelo uso real:
   - **metrô:** estação de metrô ou monotrilho;
   - **trem:** trem metropolitano (CPTM, SuperVia, Trensurb e similares);
   - **vlt_brt:** VLT, bonde moderno, BRT ou estação-tubo;
   - **shopping:** a categoria do Maps é "Shopping center" ou "Outlet". Galeria ou prédio comercial com essa categoria **confere**, porque o coletor segue a categoria da fonte. Nesses casos, anotar "galeria" em `observacao`: a informação alimenta a escolha do corte de porte.
4. Medir a distância como na seção 2 e anotar em `distancia_medida_m`.

### 4.2 Completude: o que faltou

Na mesma casa, o raio de 1000 m é varrido de novo com três fontes:

1. **Buscas do Maps:** com o mapa centrado na casa e o raio de 1000 m visível, buscar "estação de metrô", "estação de trem", "estação BRT", "estação VLT" e "shopping center". Para ver o raio, usar **Medir distância** e puxar uma linha de 1000 m da casa para cada lado.
2. **Camada de transporte público:** ativar em **Camadas** › **Transporte público**. A camada mostra estações que a busca não lista, como as estações-tubo de Curitiba.
3. **Mapa do OpenStreetMap:** abrir `https://www.openstreetmap.org/#map=16/<lat>/<lng>` com a coordenada da casa e procurar estações e shoppings no raio.

Todo item achado no raio que não está no arquivo de itens vai para a coluna `faltantes`, no formato `nome (grupo, distância em m)`, separado por ` | `. Em seguida, contar o total por grupo a 1000 m (contados que conferem mais faltantes) e preencher as colunas `qt_*_1000m_manual`.

Por fim, identificar a estação mais próxima de qualquer sistema e anotar `estacao_mais_proxima_manual` e `dist_estacao_mais_proxima_manual_m`, mesmo quando ela ficar fora do raio.

## 5. Tolerâncias

| Variável | Confere quando |
|---|---|
| Existência | o lugar existe e funciona na data da conferência |
| Grupo | o grupo marcado segue as regras da seção 4.1 |
| Distância | a diferença entre `distancia_m` e `distancia_medida_m` é de até 50 m |
| Contagem a 500 m e 1000 m | o número manual é igual ao coletado |
| Estação mais próxima | mesma estação, ou estação diferente a até 50 m da registrada |

A tolerância de 50 m cobre a imprecisão do clique e a diferença entre o pino e o ponto real. Item a até 50 m de um dos raios (450 m a 550 m, ou 950 m a 1050 m) recebe "fronteira" em `observacao`: um erro de distância pequeno, nessa faixa, troca a contagem.

## 6. Depois da conferência

1. Calcular, por variável, a taxa de erro e o intervalo de Wilson (95%). O critério de aceitação da metodologia é limite superior de até 5%.
2. Comparar Maps e OSM item a item. Item achado só por uma fonte indica em qual delas está a falha de completude.
3. Variável reprovada: corrigir o coletor, recoletar o estrato afetado e registrar a mudança em `docs/registro-de-alteracoes.md`.

**Limite do desenho:** com 11 casas (20% de 54), zero erros ainda deixam o limite superior de Wilson em 25,9%. O critério de 5% exige pelo menos 73 unidades auditadas. A população tem só 54 casas: nem a auditoria de todas alcança 73. O tamanho da amostra segue aberto em `docs/pendencias.md` (validação proporcional, item 1). Duas saídas: auditar as 54 casas e declarar o limite alcançado, ou usar o item, e não a casa, como unidade da taxa de fidelidade.
