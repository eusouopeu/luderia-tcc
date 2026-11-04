# Parecer sobre o coletor de entorno (Bloco B1)

Data: 15/10/2026. Objeto: `maps_entorno.user.js` (versão 2026.10.15-3), as coletas de 15/10 em `dados/[B1]…/_dados-brutos/entornos/` e a leitura delas por `B1-b_resumo.py`. Arquivos lidos:

| Arquivo | Fonte | Casas | Coletado em | Versão do coletor |
|---|---|---|---|---|
| `2026-10-15_51_estabelecimentos_entorno_resumo.csv` e `_resultados.csv` | Maps | 51 | 15/10, 00h41 a 01h30 | anterior a 2026.10.15-1 (sem `fora_da_regiao`) |
| `2026-10-15_3_estabelecimentos_entorno_resumo.csv` e `_resultados.csv` | Maps | 3 | 15/10, 10h45 | 2026.10.15-1 ou posterior |
| `2026-10-15_54_estabelecimentos_entorno_osm_*.csv` e `_shoppings.csv` | OSM | 54 | 15/10, 11h58 a 12h49 (substitui a de 11h38, só com nós) | 2026.10.15-3 |
| `2026-10-15_sao_jogue_paralela_entorno_*.csv` | Maps | 1 (fora da fila) | 15/10, 09h56 | 2026.10.15-1 ou -2 |

A versão do coletor não está gravada nos CSVs. A coluna "Versão" acima foi deduzida pelas colunas presentes e pelo histórico do git.

## 1. Conclusão

O entorno **ainda não sustenta decisão do plano**. A contagem de metrô e trem no Maps é a parte mais sólida: fecha as somas e concorda com o OSM onde o OSM não tem falha conhecida. Três partes estão comprometidas:

1. **BRT de Curitiba no Maps:** as 6 casas de Curitiba têm zero estação de BRT a 1000 m no Maps, e o OSM acha de 2 a 7 estações-tubo a menos de 400 m de cada uma. O erro é de completude da busca, não de classificação.
2. **Coleta do OSM de 15/10:** trouxe só nós (479 elementos, nenhum polígono). Sem polígono, nenhum shopping tem área, todo `porte_osm` sai "não" e estações mapeadas como área somem.
3. **Shopping de porte:** a coluna usada pelo resumo mistura critérios. Em 29 casas, o porte vem das caixas do OSM consultadas pela fila do Maps; nas outras 25, está em branco.

O roteiro de auditoria (`textos/instrumentos/roteiro_auditoria_entorno_B1.md`) e a amostra (`B1-a_auditoria_entorno.py`) estão prontos. A auditoria do Maps pode começar já. A do OSM espera a recoleta.

## 2. Integridade

Integridade é a pergunta "o arquivo está completo e coerente consigo mesmo?". As checagens abaixo foram feitas sobre as 54 casas da fila (`entorno/B1_entorno_maps_fila.csv`).

| Checagem | Resultado |
|---|---|
| Cada casa da fila aparece uma vez no Maps (51 + 3, sem sobreposição) | 54 de 54 |
| Cada casa da fila aparece uma vez no OSM | 54 de 54 |
| A 1000 m, metrô + trem + VLT/BRT + shoppings + outros = `resultados_ate_1000m` | 54 de 54 |
| Contagem a 500 m maior que a de 1000 m | 0 casos |
| Grupo em branco por falha de busca | 0 casos |
| Buscas que falharam, com censura possível ou com cobertura abaixo de 1000 m | 0 casos |
| Cobertura mínima do mapa visível | 1.193 m a 1.836 m (mediana 1.684 m) |
| Busca subdividida em quadrantes | 1 caso (shopping center) |

O coletor passa nas checagens internas. A disciplina do código ajuda: grupo com falha fica em branco, nunca zero; cada resultado entra em um só grupo, pela própria categoria; e a busca refaz com zoom menor quando o mapa não cobre o raio.

Duas falhas de integridade ficam fora do arquivo:

- **Resultados de outras cidades no arquivo de 51 casas.** São 695 das 3.828 linhas (18%) a mais de 50 km da casa, e o resumo dessas casas traz `dist_estacao_mais_proxima_lida_m` de até 659 km (Curitiba). O `B1-b_resumo.py` descarta distâncias acima de 50 km só para o metrô; as outras distâncias do arquivo continuam erradas.
- **Shopping do OSM casado com mais de um shopping do Maps.** São 2 nós com 3 shoppings cada (RED Jogos, Rio de Janeiro; Ludus Luderia, São Paulo). A regra que impede isso entrou no código em 15/10 (commit 8acc843), depois da coleta.

## 3. Confiabilidade

Confiabilidade é a pergunta "outra medição do mesmo entorno daria o mesmo número?". Sem auditoria feita, a melhor evidência é a concordância entre as duas fontes independentes, Maps e OSM, nas mesmas 54 casas.

| Grupo (a 1000 m) | Mesmo número | Mesma presença (zero ou não) | Maps maior | OSM maior |
|---|---|---|---|---|
| Metrô | 45 | 48 | 6 | 3 |
| Trem | 52 | 52 | 1 | 1 |
| VLT/BRT | 43 | 44 | 1 | 10 |
| Shoppings | 11 | 24 | 39 | 4 |

Cada linha soma 54 casas nas colunas "Mesmo número", "Maps maior" e "OSM maior".

A leitura da tabela depende da falha de cada fonte:

- **Metrô:** as 6 casas em que o OSM conta menos ficam em São Paulo, e em todas o OSM dá zero. Estações de metrô de São Paulo são mapeadas como polígono no OSM, e a coleta de 15/10 só trouxe nós. A divergência vem do OSM, não do Maps.
- **VLT/BRT:** 6 das 10 casas com OSM maior ficam em Curitiba (seção 1). A busca "estação BRT" do Maps não devolveu as estações-tubo próximas: em BoardZ Game Pub, a mais próxima lida pelo Maps fica a 1.628 m, e o OSM acha a Estação Tubo Kennedy a 388 m.
- **Shoppings:** a fraca concordância vem da definição, não da medida. O Maps conta 166 cadastros com categoria "Shopping center" ou "Outlet" a 1000 m; o OSM conta 32 `shop=mall`. O Maps inclui galerias e prédios comerciais, e 71 dos 166 shoppings do Maps no arquivo de porte têm menos de 100 avaliações.

O Maps tem ainda uma fonte de variação que não aparece no arquivo: os resultados dependem da conta, do idioma, do zoom e do dia. O coletor fixa idioma e zoom, mas não guarda a página lida. Uma recoleta pode dar outra lista sem que o arquivo explique por quê.

## 4. Validade

Validade é a pergunta "o número mede o que o plano precisa?". O plano usa o entorno como âncora de fluxo de pedestres (caps. 5 e 7.1). Quatro pontos afastam a medida desse construto:

1. **Linha reta, não trajeto.** A distância é calculada em linha reta (haversine). O pedestre anda pelo traçado das ruas, e rios, linhas de trem e vias expressas alongam o caminho. Uma estação a 900 m em linha reta pode estar a mais de 1.200 m a pé. O roteiro de auditoria mede a distância a pé num subconjunto (coluna `distancia_a_pe_m`) para estimar esse fator.
2. **Contagem de estações, não de passageiros.** Uma estação terminal e uma estação de bairro valem 1 cada. A medida mais próxima do fluxo seria o embarque por estação, publicado por alguns operadores `[AV]`.
3. **Shopping pela categoria do Maps.** "Shopping center" no Maps cobre de galeria de rua a shopping regional. Sem o corte de porte, `qt_shoppings_1000m` mede a densidade de comércio, não a presença de um polo de fluxo. A escolha do corte segue aberta em `docs/pendencias.md` (item 7).
4. **Coordenada da casa.** Todas as distâncias partem da coordenada do Google Places. Pino deslocado desloca as contagens perto dos raios de 500 m e 1000 m. A auditoria do B1 (`B1-a_auditoria_estabelecimentos.py`) confere endereço, não coordenada.

Os raios de 500 m e 1000 m seguem a faixa de caminhada usual na literatura de transporte `[AV]`. A escolha precisa de citação antes de entrar no texto.

## 5. Vulnerabilidades e correções

| # | Vulnerabilidade | Efeito | Gravidade | Correção |
|---|---|---|---|---|
| 1 | Busca "estação BRT" do Maps não acha as estações-tubo de Curitiba | VLT/BRT = 0 nas 6 casas de Curitiba | Alta | Busca "estação tubo" nas cidades com RIT, ou usar o OSM para BRT |
| 2 | Coleta do OSM de 15/10 só com nós | Shopping sem área, porte "não" em todos, metrô de São Paulo ausente | Alta | Recoletar com a versão 2026.10.15-3, que lê polígonos |
| 3 | Porte de shopping misturado no resumo (29 casas com caixas antigas, 25 em branco) | Estatística descritiva e site com porte incomparável entre casas | Alta | Recalcular o porte depois da recoleta do OSM e do corte escolhido |
| 4 | Arquivo de 51 casas exportado antes do filtro de 50 km | Distâncias de até 659 km no resumo | Média | Exportar de novo do navegador (a classificação é refeita na exportação) ou filtrar no build |
| 5 | Versão do coletor não gravada no CSV | Não se sabe que regra gerou cada arquivo | Média | Coluna `versao_script` em todos os CSVs, como no coletor de avaliações do B2 |
| 6 | `B1-b_resumo.py` escolhe o arquivo mais novo pela data de modificação (`st_mtime`) | Copiar ou baixar de novo um arquivo antigo troca a coleta usada | Média | Ordenar pela data do nome do arquivo, como faz `B1-a_auditoria_entorno.py` |
| 7 | Dados guardados só no `localStorage` do navegador | Limpar o navegador apaga a base; não há cópia da página lida | Média | Exportar ao fim de cada fila (já faz) e guardar os CSVs no repositório no mesmo dia |
| 8 | Fusão de duplicatas por nome parecido: nome só com palavras genéricas ("Estação") conta como parecido com qualquer outro | Duas estações diferentes a menos de 150 m podem virar uma | Baixa | Exigir nome igual quando o conjunto de palavras úteis ficar vazio |
| 9 | Classificação por expressão regular sobre a categoria e o nome | Categoria nova do Maps cai em "outro" sem aviso | Baixa | Revisão do grupo "outro" a até 1000 m (o painel já tem "Revisar classificação"); a auditoria mede o erro que sobra |

## 6. Próximos passos, em ordem

1. Recoletar o OSM das 54 casas com a versão 2026.10.15-3 (corrige 2 e permite 3).
2. Exportar de novo os CSVs do Maps do navegador, para o arquivo de 51 casas ganhar `fora_da_regiao` (corrige 4).
3. Resolver o BRT de Curitiba: busca extra no Maps ou OSM como fonte do grupo (corrige 1).
4. Escolher o corte de porte de shopping e rodar `B1-b_resumo.py` e `B1-a_estatistica_descritiva.py` (corrige 3).
5. Rodar `B1-a_auditoria_entorno.py` e fazer a conferência pelo roteiro.
6. Gravar a versão do coletor nos CSVs e ordenar as coletas pela data do nome no `B1-b_resumo.py` (corrige 5 e 6).

## 7. Recoleta do OSM (15/10, 12h49)

A recoleta das 54 casas com a versão 2026.10.15-3 corrigiu a vulnerabilidade 2. A rodada não completa o entorno: o Maps não foi coletado de novo, e o OSM conta em dobro parte das estações de VLT/BRT.

**Integridade do OSM.** As 54 casas da fila aparecem uma vez, todas com `situacao` = ok. A 1000 m, metrô + trem + VLT/BRT + shoppings + praias e parques + outros = `elementos_ate_1000m` em 54 de 54. Nenhuma contagem a 500 m passa a de 1000 m. Recontadas a partir do `_osm_resultados.csv`, as cinco contagens batem com o resumo nas 54 casas. Os polígonos voltaram: 1.779 dos 2.258 elementos têm área; 105 dos 131 shoppings a até 1000 m têm área (os 26 restantes são nós no OSM). O metrô de São Paulo, ausente na coleta das 11h38, voltou.

**Concordância com o Maps (a 1000 m, 54 casas).**

| Grupo | Mesmo número | Mesma presença | Maps maior | OSM maior |
|---|---|---|---|---|
| Metrô | 49 | 54 | 0 | 5 |
| Trem | 52 | 52 | 1 | 1 |
| VLT/BRT | 43 | 44 | 1 | 10 |
| Shoppings | 16 | 38 | 23 | 15 |

**Falhas encontradas.**

1. **Plataformas de cada sentido contadas como estações (OSM).** As estações-tubo de Curitiba e as paradas do BRT Expresso DF têm uma plataforma por sentido, com o mesmo nome, a 160-190 m uma da outra. O limite de duplicata era 150 m. Em Ludoteca BGC e Inside Games, 4 plataformas são 2 estações.
2. **Bonde de Santa Teresa e paradas sem nome (OSM).** No Rio, o grupo VLT/BRT recebia as paradas do bonde (linha turística) e posições de parada sem nome. Luderia Carioca, no Catete, tinha 16 "estações" de VLT/BRT; o Maps acha 0.
3. **BRT ausente no Maps (Curitiba e Brasília).** A busca "estação BRT" não devolve as estações-tubo nem as paradas do BRT Expresso DF. As 6 casas de Curitiba e as 2 de Brasília seguem com zero. A classificação "estação tubo" da versão 2026.10.15-1 não resolve: o resultado nem chega à lista.
4. **Arquivo de 51 casas sem recoleta (Maps).** Continua sem `fora_da_regiao` (vulnerabilidade 4).
5. **São Jogue Paralela (Maps, 09h56).** Coleta avulsa, fora da fila de 54: `origem_place_id` em branco e porte dos 57 shoppings em branco ("sem resposta do OSM").

**Correções no coletor (versão 2026.10.15-4).**

| Falha | Correção |
|---|---|
| 1 | No OSM, estações do mesmo grupo com o mesmo nome e a mesma rede contam uma vez até 400 m |
| 2 | Rede "Bonde de Santa Teresa" vai para "outro"; parada ou plataforma sem nome também, com `observacao` = "parada sem nome" |
| 3 | Busca nova "estação tubo", só em Curitiba (dispensada nas demais cidades). As 6 casas de Curitiba ficam pendentes ("busca nova não feita") e o grupo VLT/BRT delas sai em branco até a recoleta |
| — | Coluna `versao_script` nos dois resumos (vulnerabilidade 5) |

As regras do OSM valem na exportação, sem consultar a Overpass de novo. Aplicadas pelo próprio código do coletor sobre a coleta das 12h49, mudam 9 casas: VLT/BRT cai de 88 para 59 estações a 1000 m (Curitiba, Brasília e Rio) e metrô de 45 para 44 (Vila Prudente, metrô e monotrilho na mesma estação). As somas seguem fechando em 54 de 54.

**O que fica sem correção.** Em Brasília, o Maps segue sem o BRT; não há busca que o traga testada. Quatro paradas do bonde sem a tag de rede (Outeiro da Glória, Russel, Portinha, Francisco Muratori) ainda contam como VLT no OSM (Luderia Carioca, 2; RED Jogos, 2). A auditoria do entorno deve conferir esses casos.

**Próximos passos.** (1) Recarregar o Maps (o carregador lê o script do disco). (2) "Refazer pendentes" no Maps: refaz as 6 casas de Curitiba com a busca "estação tubo". (3) Exportar tudo: o arquivo do Maps sai com `fora_da_regiao` e o OSM com as regras novas. (4) Conferir de novo e, se fechar, levar ao `B1-b_resumo.py`, à estatística descritiva e ao site. A escolha da fonte do VLT/BRT (Maps, OSM ou a maior das duas) fica em `docs/pendencias.md`.
