# Prompt: corrigir os webscripts com coleta incompleta ou não íntegra

Auditoria de 13/11/2026 sobre os CSVs em `dados/` (só a versão mais recente de cada coleta). O bloco abaixo é o prompt, pronto para colar numa sessão nova.

**Aplicado em 13/11/2026** (entorno 2026.11.13-4; aluguel, horários de pico, Instagram, preços, avaliações, acervo e cardápios 2026.11.13-2). Fica de fora: a URL da OLX que filtra Caminho das Árvores e Chame-Chame não foi descoberta (o coletor lê a cidade e guarda só os do bairro); a variação dos VLT da RED jogos não é erro (as 7 paradas a 1.000 m são distintas, conferido em teste); o cardápio e o snowball seguem com o download comum.

## Resultado da auditoria

| Webscript | Coleta auditada | Situação |
|---|---|---|
| `maps_entorno` | 13/11, versão 2026.11.13-2 | **Incompleta:** 40 de 63 casas (faltam 22 de São Paulo e a de Vitória); só há `resumo` parcial, sem `resultados` nem `shoppings`. **Não íntegra:** shoppings a 1.000 m mudam de 12/11 para 13/11 em 23 de 38 casas |
| `instagram_coletor` | 12/11 (61 perfis) e recoleta de 4 perfis | Íntegra em 59 perfis. **Incompletas:** Cineplay (0 posts no período) e Fortalúdica (3), coletadas antes da correção dos fixados. Nome de arquivo com data errada e fora da convenção |
| `portais_aluguel` | 13/11 01:37 (1.051 anúncios, 33 buscas) | **Incompletas:** OLX Caminho das Árvores (58 de 1.423) e OLX Chame-Chame (0 de 1.424). Motivo de parada errado em 4 buscas; `tipo` vazio nos 323 anúncios da OLX; 296 linhas de 03/11 misturadas |
| `maps_horarios_pico` | 12/11 13:53 (63 de 63 casas) | Completa. **Não íntegra:** `permanencia` vazia nas 63 casas; 7 casas "sem horários de pico" sem prova de que o gráfico não existe |
| `precos_itens` | 03/11 (731 ofertas, 34 itens) | **Incompleta:** OB42 e MO06 sem oferta; EQ03 com 1 e CB14 com 2 (mínimo 3) |
| `maps_avaliacoes` | 12/11 (16 casas, versão 2026.11.12-2) | Íntegra (lidas = linhas, sem `review_id` repetido, `place_id` em todas). Risco: as duas São Jogue geram o mesmo nome de arquivo |
| `acervo_coletor` | 12/11, Arena BG | Íntegra (547 títulos, igual ao total da Ludopedia). Varredura das 63 casas não feita (depois da banca) |
| `cardapio_coletor`, `instagram_snowball`, `B4-w_observassa` | sem coleta nova | Nada a auditar |

Fora dos scripts: os 9 "coletar" do `B2_cobertura_coleta.csv` já foram coletados em 12/11 (13:07 a 13:33); o build é de 11:51 e não foi rodado de novo. Há downloads em pasta errada: `fiofj.csv` (parcial-030 do entorno), 3 CSVs de entorno em `dados/B5_aluguel/_dados-brutos/` e `2026-11-12_arenabg_acervo.csv` em `dados/B1_entorno/_dados-brutos/`.

## Prompt

```text
Corrija os webscripts do TCC Luderia (`_src/webScripts/`) para que as coletas saiam completas
e íntegras. Antes de editar, leia `_src/webScripts/specs/especificacoes_comuns.md` e siga as
seções 8 a 11 (subir `@version`, rodar o teste do script e o do kit, rodar
`gerar_carregadores.py` e dizer se é preciso reinstalar). Não rode coletas nem builds: só
corrija os scripts e os testes, e deixe em `_docs/pendencias.md` ("Coletas em andamento") o
passo a passo de cada recoleta. Para cada item, confirme primeiro no código se a versão atual
já resolve (o entorno está em 2026.11.13-3 e os dados são da -2); se resolver, só registre.
Cada correção ganha um caso no `.test.cjs` que falha antes e passa depois.

Ordem de prioridade: 1 (entorno), 2 (aluguel), 3 (horários de pico), 4 (Instagram), 5 a 7.

1. `B1_estabelecimentos/maps_entorno.user.js`
   Evidência: `dados/B1_entorno/_dados-brutos/2026-11-13_40_estabelecimentos_entorno_resumo_parcial-040.csv`
   tem 40 das 63 casas da fila (faltam 22 de São Paulo e a de Vitória); a última casa fechou às
   02:35 e não há CSV final nem `resultados`/`shoppings` de 13/11. Os parciais de 13/11 e de
   15/10 saem quase sempre só com o `resumo`.
   a) Download parcial perdido: `fecharLocal()` chama `exportar()`, que agenda os arquivos com
      `setTimeout(i * 800)`, e logo depois `seguir()` navega (`location.href`). O segundo
      arquivo se perde. Faça `exportar()` devolver uma Promise que só resolve depois do último
      download disparado (mais uma folga), e `fecharLocal()` esperar por ela antes de navegar.
      O parcial deve trazer `resumo`, `resultados` e `shoppings`.
   b) Armazenamento: o script usa `localStorage` com `@grant none`, e `gravar()` só mostra um
      aviso quando falha. Passe para `GM_getValue`/`GM_setValue` (spec, seção 9), com migração
      do que está no `localStorage`, e faça falha de gravação parar a fila, baixar o que está
      guardado e avisar em vermelho. Mesmo defeito travou o `maps_horarios_pico` perto de 35 casas.
   c) Fila que para sem motivo registrado: guarde na fila o motivo e a hora de cada parada
      (bloqueio do Google, erro, aba fechada, "Parar") e mostre no painel ao reabrir, com
      "Retomar" a partir da casa pendente. O `resumo` deve trazer uma linha para toda casa da
      lista, com `situacao` = "não coletado" nas que faltam, para a soma fechar em 63.
   d) Shoppings instáveis: entre 12/11 (2026.11.12-2) e 13/11 (2026.11.13-2),
      `qt_shoppings_1000m` mudou em 23 de 38 casas com a mesma busca única (Paladins 2 para 8,
      Arcadea 2 para 14, Magic Store 3 para 12). Trate a busca de shopping como a de estação:
      rolar até a marca de fim da lista, subdividir em quadrantes quando a lista vier cheia e
      marcar censura quando não houver marca de fim. Grave um quarto CSV,
      `…_entorno_buscas.csv`, com uma linha por busca feita (casa, consulta, quadrante, zoom,
      cobertura em metros, n lidos, chegou ao fim, tentativas), para auditar sem repetir a coleta.
   e) VLT em dobro: RED jogos tem 8 estações de VLT a 1.000 m (eram 6 em 12/11, já com 2 a
      mais: parada Sete de Setembro em dois cadastros e o "traçado" da linha). Confira a fusão
      de paradas da mesma estação até 150 m e a exclusão de resultados que são linha, não
      estação; cubra com fixture da RED jogos.

2. `B5_ativos_fixos/portais_aluguel.user.js`
   Evidência: `dados/B5_aluguel/_dados-brutos/2026-11-13_0121_fila_resumo_aluguel.csv` e
   `2026-11-13_0137_portais_anuncios_aluguel.csv`.
   a) OLX sem o bairro: "caminho-das-arvores" leu 58 de 1.423 e "chame-chame" 0 de 1.424. O
      total é o da cidade inteira: a OLX não reconhece o bairro no caminho da URL e devolve
      Salvador, e o script guarda só os anúncios do bairro que apareceram nas 4 primeiras
      páginas. Detecte o caso (total muito acima do esperado e anúncios de outro bairro na
      página) e marque a busca como "bairro não reconhecido pelo portal". Descubra na OLX a URL
      que filtra esses dois bairros; se não existir, pagine a busca da cidade até o total,
      guardando só os do bairro, e registre no resumo quantos foram vistos e quantos guardados.
   b) Motivo errado: ZAP e Viva Real em Pituba (75 de 76) e Canela (5 de 6) terminam como
      "sem resultado no portal". Em `decidirPasso()`, esse motivo só vale quando nada foi lido
      na busca inteira; com anúncios já vistos, o motivo é "página vazia antes do total (75 de
      76)". Acrescente no resumo `vistos`, `guardados` e `fora_do_bairro` por busca.
   c) `tipo` vazio nos 323 anúncios da OLX e `publicado` vazio em 728 de 1.051: ler os dois
      campos em cada portal (fixture de 12/11) ou, onde o portal não informa, gravar
      "não informado" em vez de vazio.
   d) Rodadas misturadas: o CSV de 13/11 leva 296 linhas da ZAP de 03/11 (busca antiga, de
      Salvador inteira). Acrescente a coluna `rodada` (data e hora de início da fila) e exporte
      por padrão só a rodada atual; o resto sai com o selo "Tudo".

3. `B1_estabelecimentos/maps_horarios_pico.user.js`
   Evidência: `dados/B1_estabelecimentos/_dados-brutos/horarios_pico/maps_horarios_pico_2026-11-12_1353.csv`.
   a) `permanencia` vazia nas 63 casas: a expressão regular de `lerPicos()` (linha 381) não
      casa com o texto atual do Maps. Abra uma casa com o dado, salve o HTML como fixture,
      ajuste a leitura e grave também `permanencia_min_min` e `permanencia_max_min` em minutos.
   b) 7 casas com "sem horários de pico" (Café Geek, Coletivo Geek, Jogasampa, Asgard, Paladino
      Hobbies, RED jogos, Reduto): hoje a situação é só `linhas.length === 0`. Separe "Maps não
      mostra o gráfico" (painel carregado até o fim, seção ausente) de "gráfico não carregou"
      (vira falha, com "!" no seletor), e grave em `leitura` a prova usada.

4. `B1_estabelecimentos/instagram_coletor.user.js`
   Evidência: `dados/B1_redes_sociais/_dados-brutos/instagram_posts_cineplay_sc_2026-11-13.csv`
   (14 posts: 12 de novembro e 2 de abril, 0 no período de 01/07 a 01/11, perfil com 1.733
   posts) e `…_fortaludica_…` (12 posts, 3 no período).
   a) Parada por post antigo: a regra de `periodoCoberto()` já ignora a primeira página
      (2026.11.13-1). Reforce: só dar o período por coberto com 3 posts seguidos, não fixados
      e do próprio perfil, anteriores à data "De", ou com a grade inteira lida. Teste com os
      dois CSVs acima como fixture.
   b) Coerência: perfil com 12 posts ou mais depois do fim do período e nenhum dentro dele não
      pode sair "vazia"; sai "conferir", com o motivo em `pendencias_periodo`.
   c) Nome do arquivo: `exportar()` usa `new Date().toISOString()` (coleta de 12/11 às 22:15
      saiu com 2026-11-13) e o padrão `instagram_posts_<perfil>_<data>.csv`. Use a data local e
      a convenção do projeto: `AAAA-MM-DD_<estabelecimento>_instagram_<perfis|posts>.csv`.
      Procure o mesmo `toISOString().slice(0, 10)` nos outros scripts (o `cardapio_coletor`
      tem, na linha 347) e troque por data local.
   d) Período fixo: Bardo Mago e Comdado foram coletados em 12/11 com 01/09 a 01/10 enquanto
      os outros 59 usaram 01/07 a 01/11: `PERIODO_PADRAO` (linha 995) ainda é 01/09 a 01/10 e
      o painel deixa editar. Mude a constante para 01/07 a 01/11, avise em âmbar quando o
      período do painel for diferente do padrão e recuse exportar perfis com períodos distintos
      no mesmo arquivo.

5. `B5_ativos_fixos/precos_itens.user.js`
   Evidência: `dados/B5_mobiliario/_dados-brutos/2026-11-03_0111_*_precos.csv` e
   `dados/B5_reforma/_dados-brutos/2026-11-03_0111_obra_reforma_precos.csv`.
   OB42 (letreiro de fachada) e MO06 (balcão de atendimento e caixa) não têm linha; EQ03 tem
   1 oferta e CB14 tem 2. O CSV não distingue "não buscado" de "buscado sem oferta". Grave
   uma linha por item e site buscado, mesmo sem oferta (`motivo` = "sem oferta", com `busca`
   e `data_coleta`), e baixe junto um `…_itens_resumo.csv` com as 35 linhas de `fonte_preco`
   = coleta: item, sites buscados, ofertas válidas, situação (ok, abaixo de 3, sem oferta,
   não buscado).

6. `B2_avaliacoes_recentes/maps_avaliacoes.user.js`
   As duas unidades da São Jogue têm o mesmo nome no Maps e geram
   `…_sao_jogue_maps_avaliacoes_tudo.csv`; a segunda vira "(1)" ou sobrescreve. Quando houver
   mais de uma casa do B1 com o mesmo nome, use o nome curto da lista de alvos (ex.:
   `sao_jogue_bela_vista`). Vale também para os demais scripts que nomeiam o arquivo pelo lugar.

7. Todos os scripts: destino do download
   Os CSVs de 12 e 13/11 caíram em pastas trocadas (entorno em `B5_aluguel/`, acervo em
   `B1_entorno/`, um parcial salvo como `fiofj.csv`), porque o navegador pergunta onde salvar.
   Onde houver `@grant`, baixe com `GM_download` e `saveAs: false`, com o nome do arquivo já
   prefixado pela pasta da coleta (ex.: `B1_entorno/2026-11-13_…_resumo.csv`), e repita o
   destino na mensagem de status. Sem `GM_download`, mantenha o download atual.

Ao terminar: liste as recoletas necessárias em `_docs/pendencias.md` (entorno das 63 casas;
OLX Caminho das Árvores e Chame-Chame; horários de pico das 63 casas, pela permanência;
Cineplay e Fortalúdica; OB42, MO06, EQ03 e CB14), atualize o AGORA.md e faça um commit.
Nenhuma dessas recoletas entra no TMin sem passar pelo build e pelo "Lote de decisões".
```
