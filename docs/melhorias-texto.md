# Melhorias do texto

Divergências entre capítulos (e contra as regras de `_instrucoes/`) e cortes possíveis, levantados a cada capítulo novo ou revisado. Regra em [CLAUDE.md](../CLAUDE.md), "Melhorias do texto". Item resolvido sai; listar não autoriza corrigir o capítulo sem pedido do autor.

Última análise: 01/11/2026 (22h50), caps. 1 e 2 do TMin v9, com os parágrafos revisados a partir dos comentários do autor.

Formato de um item: **ID — título curto.** Onde (cap. e seção). O que diverge ou se repete. Sugestão. Nos cortes, o ganho estimado em palavras (350 palavras ≈ 1 página).

---

# Divergências

## Grave

**D43 — Capítulos com o porte da São Jogue, contra o desenho enxuto (02/11/2026).** A P7 de `_instrucoes/1a_principios.md` fixa 6 mesas, funcionamento de terça a sexta das 15h às 23h e sábado e domingo das 14h às 22h, 2 cozinheiros-chefes, instrutores de tempo integral e um de meio período de 20 h. O modelo já segue a P7 (02/11/2026); os caps. 4, 7, 9, 10 e 11 seguem com 10 mesas, 10 h abertas por dia (68 h por semana), giro otimista de 5,51 calculado sobre 10 h e equipe de 12 (8 na alternativa). Os números do cap. 9 (VPL de -R$ 638 mil no provável, P(VPL > 0) de 31,9%) também mudaram: -R$ 47 mil e 41,6%. Sugestão: alinhar os capítulos ao modelo novo.

**D01 — Três escalas de confiança com os mesmos rótulos.** Cap. 5 (nota de abertura, 5.1.2, 5.1.3, 5.2.3, 5.4.2 e quadro "Fontes por nível de preferência") × cap. 2 (2.1) × `_instrucoes/1a_principios.md` (P1, P2) e `8_financeiro.md` (N1–N6). O cap. 5 usa uma ordem própria de fontes em 4 níveis (oficial → fundação → entidade setorial → imprensa), decidida em 15/10 (`decisoes.md`), que não bate com a P1 (7 níveis: legislação, artigos revisados, teses, relatórios oficiais e setoriais…). Além disso, mistura as escalas no texto: a POF é "N2" (escala N1–N6, correto), o Savills é "nível 3" (da ordem própria; na N1–N6 seria N4), o público do Meta Ads é "N5, rastros digitais" (rastro digital é o tipo 5 da P2; N5 é coleta primária comportamental própria) e a cotação é "N2 na hierarquia de dados" (tipo 2 da P2, não N2). O cap. 2 anuncia só a N1–N6 e a P2 para o cap. 3. A banca lê "N2" e "nível 2" como a mesma coisa. Sugestão: no texto, usar só a N1–N6 para dados e premissas; a ordem de fontes do cap. 5 vira a P1 (atualizar a instrução) ou sai do capítulo; o tipo de dado da P2 ganha rótulo próprio (ex.: "tipo 5").

## Média

**D36 — Duas páginas da Savills com datas diferentes (02/11/2026).** O 2.2 cita SAVILLS, [s.d.] (definição e mais de 800 locais) e SAVILLS, 2023 (alta de 38% desde 2018). As duas contagens são de momentos diferentes; a de [s.d.] precisa da data para o leitor entender a sequência (ver D16).

**D15 — Fontes da gestão baseada em evidências (01/11/2026).** Cap. 2 (abertura), parágrafo original e o revisado em verde no TMin v9. O texto põe as quatro fontes de evidência em Figueiredo (2020, p. 31) e inclui "organizações comparáveis"; no artigo, a quarta fonte (valores das partes interessadas) está na p. 32 e não há menção a organizações comparáveis, só a dados da própria organização. Sugestão: citar p. 31–32 e tirar "ou de organizações comparáveis", junto com o corte de citações pedido no comentário 7.

**D16 — Savills sem data (01/11/2026).** Cap. 1 e referências. A página da Savills citada como [s.d.] traz a data de 19 mar. 2024. Sugestão: SAVILLS, 2024, no texto e na referência.

**D12 — Condição de viabilidade dita de três jeitos (01/11/2026).** Cap. 4 (4.6) × cap. 11 (11.1) × cap. 9 (9.7.3). O 4.6 diz que o negócio fica viável com a equipe de 8 e duas premissas juntas (5,0 mesas e cesta para 1,5 pessoa); o 11.1, com uma de três condições isoladas (5,3 mesas, 4,4 pessoas por mesa ou cesta para 1,4 pessoa); o 9.7.3, com 5,98 mesas e o quadro de 12. Sugestão: uma só formulação, com o mesmo quadro de pessoal, repetida igual nos três.

**D13 — Taxa de entrada fixa fora da sensibilidade (01/11/2026).** Cap. 6 (6.3) × cap. 9 (Quadro 9.2) × cap. 5 (Figura 5.1). A taxa é a média nacional (R$ 18,68) em todos os cenários, embora a única concorrente de Salvador cobre R$ 28,00 no fim de semana e a renda da cidade seja a penúltima entre as capitais com luderia. O preço não entra no tornado nem no Monte Carlo. Sugestão: dar faixa à taxa (ex.: R$ 15,00 / 18,68 / 28,00) e mostrar o ponto de ruptura dela; justificar no 6.3 por que a média nacional e não o preço local.

**D14 — Extremos que desacreditam o modelo (01/11/2026).** Cap. 4 (Quadro 4.1) × cap. 10 (10.2). O otimista mostra TIR de 579,5% e payback de 0,2 ano; o pessimista, VPL de -R$ 2,9 mi. O próprio 10.2 diz que os extremos são limite, não previsão, mas o sumário os põe lado a lado com o provável. Sugestão: no cap. 4, trocar as colunas extremas pelos percentis 10, 50 e 90 do Monte Carlo; os extremos ficam só no cap. 10.


- **Giro: vocabulário × modelo (31/10/2026).** `_instrucoes/1b_escrita.md` (P6) define giro como horas de funcionamento ÷ permanência média; no modelo do cap. 9, só o otimista segue a definição, o pessimista sai das NFC-e e o provável é a média dos dois. Ajustar a definição do P6 (giro por mesa ocupada, com a faixa) ou declarar a diferença no cap. 3. A "taxa de ocupação" do P6 também deixou de ser premissa: o modelo usa mesas ocupadas.
- **Figuras só no TMin (31/10/2026).** O TMin tem as Figuras 5.1 a 5.4, 6.1 e 9.1 (Selic), com o tornado como Figura 9.2; o TMax segue só com o tornado como Figura 9.1, mas o cap. 10, comum às duas versões, já remete à "Figura 9.2".
- **Seções renumeradas no TMin (31/10/2026).** No TMin, o cap. 2 vai de 2.1 a 2.5 e o cap. 3 de 3.1 a 3.6; no TMax, seguem de 2.1 a 2.6 e de 3.1 a 3.7. Remissões entre capítulos a essas seções ficam diferentes nas duas versões.
**D02 — Objetivos e seções da introdução fora da estrutura.** Cap. 1 (1.1) × `1_estrutura.md` (1.3). O cap. 1 tem 7 objetivos específicos; a instrução permite no máximo 6, um por decisão, cada um respondido em 11.2. Os itens (vi) e (vii) cabem em um só (o (vi) da proposta da instrução). As seções também divergem: o cap. 1 tem 1.1 Objetivos, 1.2 Justificativa e 1.3 Estrutura; a instrução prevê 1.1 Contextualização, 1.2 Problema e oportunidade, 1.3 Objetivos, 1.4 Justificativa e 1.5 Estrutura. Sugestão: fundir (vi) e (vii) e renumerar, ou ajustar a instrução.

**D03 — "Única luderia em operação" × "única no recorte".** Cap. 1 (contextualização) × cap. 5 (5.3.3, Tabela 5.1). O cap. 1 afirma que a São Jogue é a única luderia em operação em Salvador; o cap. 5 diz "única no recorte", com 13 resultados na busca, 7 acima de 100 avaliações e 1 aprovado na curadoria. A afirmação do cap. 1 é mais forte que o dado. Sugestão: "a única luderia de Salvador com mais de 100 avaliações no Google Maps (Bloco B1, 2026)". Em 31/10, o cap. 3 (3.3.3) também diz "única luderia de Salvador".

**D04 — Categorias da análise de conteúdo do B2.** Cap. 2 (2.5) × cap. 5 (5.2.2). O cap. 2 diz que as categorias são comida, serviço, ambiente, acervo e preço, e que a análise está no cap. 6.2. O cap. 5.2.2 usa atendimento, alimentos e bebidas, acervo, mediação lúdica e preço: a mediação lúdica não está no cap. 2, e o ambiente não aparece no cap. 5. Sugestão: alinhar as duas listas ao dicionário de `textos/instrumentos/analise_conteudo_bardin_B2.md` e dizer, no cap. 2, que a análise aparece em 5.2 (ocasiões e temas) e 6.2 (acervo e atributos). Em 31/10, o cap. 3 (3.4.2) entra com uma terceira lista: os 22 temas do dicionário de 30/10 (`textos/instrumentos/dicionario_temas_B2.md`), que ainda não foi unificado com o livro do Bardin (pendências, item 15).

**D05 — PRC anunciada e aplicada pela metade.** Cap. 2 (2.2.2) × cap. 5 (5.2.2). O cap. 2 define a PRC pela comparação da nota de quem elogia, de quem critica e de quem não menciona o aspecto (penalidade e recompensa contra uma referência). O cap. 5.2.2 traz só a nota média das menções negativas (2,83 na mediação; 3,11 no preço), sem a referência nem as positivas. Lido isolado, parece que a classificação Kano já saiu. Sugestão: no cap. 5 dar as três notas (ou a diferença para a referência) ou dizer que a classificação fica para o cap. 6. Em 31/10, o cap. 3 (3.5.1) define a PRC como a nota média com e sem crítica a cada tema, sem o grupo de quem elogia; alinhar com a definição do cap. 2.

**D06 — PESTEL: o que o cap. 2 promete e o que o cap. 5 entrega.** Cap. 2 (2.2.1) × cap. 5 (5.5). O cap. 2 diz que o 5.5 usa "renda por bairro, tributos e taxa de juros". No cap. 5, a renda por bairro está em 5.2.1 e ainda não foi coletada, os tributos foram para o cap. 8 e o fator ambiental foi excluído (o cap. 2 lista seis dimensões). Sugestão: no cap. 2, citar os exemplos que de fato entram (juros, IPCA da alimentação fora do lar, aluguel comercial) e dizer que só entram dimensões com efeito mensurável.

**D07 — Bares: rival ou substituto?** Cap. 2 (2.2.1) × cap. 5 (Quadro 5.2). O cap. 2 põe bares e restaurantes entre os substitutos. O Quadro 5.2 põe o "bar comum" na rivalidade ("alta no bar comum") e de novo nos substitutos. A mesma unidade em duas forças contraria a lógica de um grupo por unidade. Sugestão: decidir uma posição (ex.: bar com jogo ou quiz = rival; bar comum = substituto) e usá-la nos dois capítulos.

**D08 — "Principal custo fixo" sem dado e contra o próprio capítulo.** Cap. 5 (5.5.1 × 5.1.1). O 5.5.1 afirma que o aluguel é o principal custo fixo da luderia; o 5.1.1 mostra, na PAS 2024, pessoal em 25,1% e aluguel em 4,0% da receita da alimentação. Sugestão: tirar "principal" ou sustentar com cotação (N1) e FipeZAP; a frase orienta a sensibilidade do cap. 9.

**D09 — Fonte do IPCA.** Cap. 2 (2.6) × cap. 5 (5.5.1). O cap. 2 diz que a TMA parte "da Selic e do IPCA divulgados pelo Banco Central"; o IPCA é do IBGE (o BCB divulga a expectativa, no Focus), como o cap. 5 cita. Sugestão: "da Selic (BCB) e do IPCA (IBGE), com as expectativas do Focus".

**D10 — Sebrae (R$ 53 bilhões) firme no cap. 1, sob suspeita no cap. 5.** Cap. 1 (contextualização) × cap. 5 (5.1.2). O cap. 1 abre o trabalho com o número sem ressalva; o cap. 5 o marca `[BUSCAR a fonte original]` e propõe cortá-lo se não houver. Sugestão: tratar igual nos dois; se a fonte original não aparecer, sai dos dois.

**D11 — Referência de Asakura, Silva e Mello com título diferente.** Cap. 1 × cap. 2 (referências). O cap. 1 dá "…boardgame café em Ourinhos/SP", sem prenomes; o cap. 2, "…boardgame café no município de Ourinhos/SP", com iniciais. Sugestão: conferir no PDF e usar uma só forma.

**D12 — Contagens do cap. 5 diferentes das do AGORA.** Cap. 5 × `AGORA.md` (15/10). Cardápio coletado: 26 casas no 5.3.4, 27 no AGORA. B2: "1.588 avaliações de 53 casas" no 5.2.2, contra 54 casas no objeto do B1 (5.3.1). Instagram: "49 luderias com perfil coletado" no 5.5.4, contra 18 casas parciais ou sem coleta no Notion. Sugestão: tirar os números dos arquivos de `dados/` na hora de revisar e dizer qual casa falta e por quê (a soma deve fechar com 54).

**D13 — Perfil do frequentador "sai das avaliações".** Cap. 2 (2.4) × cap. 5 (5.2). O cap. 2 diz que o perfil do frequentador sai das avaliações do B2 (cap. 5.2). As avaliações não trazem idade, gênero ou renda; o 5.2.1 usa o IBGE para população e renda, e o B2 dá temas e ocasiões. Sugestão: no cap. 2, "as ocasiões de consumo e os atributos valorizados saem do B2; o tamanho do público, do IBGE".

**D19 — Proporção de mercadorias da PAS em dois anos.** Cap. 5 (5.1.1) × cap. 9 (9.2). O cap. 5 dá 26,8% da receita líquida para mercadorias e materiais (PAS 2024, tabela 10758) e diz que o número entra no cap. 9; o cap. 9 usa 29,6% (PAS 2023, tabela 2613, a base que está no B4) para o CMV provável de 30%. Sugestão: baixar a PAS 2024 para o B4 e usar o mesmo ano nos dois capítulos.

**D20 — Ocupação de dia útil em N6 entre as premissas críticas.** Cap. 9 (9.2 e 9.7) × `8_financeiro.md` (§2, regra de robustez). A taxa de ocupação de dia útil é a 4ª do tornado e só tem estimativa do autor. A regra admite isso com faixa larga e destaque no cap. 10, que ainda não existe. Sugestão: buscar fonte N3 (curva de horários de pico do Google Maps das luderias do B1) ou manter e levar ao cap. 10.

**D24 — Reforma tributária: data de efeito.** Cap. 5 (5.4/PESTEL) diz que a LC 214/2025 "muda a tributação de bares e restaurantes a partir de 2026"; o cap. 8 (8.1) diz que o Simples continua e que a opção de recolher IBS e CBS por fora vale a partir de 2027. Os dois trechos têm `[AV]`; conferir no texto da lei e alinhar.

**D26 — Codificação do B2: cap. 3 × instrução.** Cap. 3 (3.4.2 e 3.4.3) × `4_metodologia.md` §3.4. O cap. 3 descreve a prática atual — codificação temática com 22 temas, feita com apoio de inteligência artificial e validada por recodificação cega de 139 avaliações com kappa ≥ 0,70. A instrução ainda prevê dicionário automático de 11 aspectos, validado por kappa e F1 em 200 avaliações. Sugestão: decidir o instrumento (pendências, item 15, e "Instruções ainda desatualizadas") e alinhar a instrução ou o capítulo.

**D27 — Frequência de preço nas avaliações: 12,8% × 2,7% e 9,3%.** Cap. 5 (5.2.2, Bardin provisório de 15/10: "preço e valor percebido" em 12,8%) × cap. 6 (6.3, temas do Notion de 30/10: preço da entrada em 44 e preço do consumo em 152 das 1.628 avaliações). São codificações diferentes; alinhar quando o 5.2 for refeito com o dicionário de 30/10.

**D32 — Reforma tributária e ruído: o cap. 5 manda para o cap. 8, que não trata.** Cap. 5 (5.5, fator legal) × cap. 8 (8.1 e Quadro 02). O cap. 5 diz que o enquadramento tributário fica no cap. 8 e cita a transição da LC 214/2025 e a regulação municipal de ruído e horário noturno. O cap. 8 projeta o Simples por cinco anos sem citar a transição para CBS e IBS e não tem linha de ruído ou alvará noturno no Quadro 02. Sugestão: uma frase em 8.1 sobre o efeito da LC 214/2025 no Simples (após conferir o texto da lei) e uma linha de ruído no Quadro 02, ou tirar a remissão do cap. 5. (Item trazido da `main` em 31/10; conferir se o cap. 8 de 31/10 já trata.)

**D33 — Equipe de 12 no modelo × 8 no cap. 7.** Cap. 9 (9.4, C06, Tabela 9.2) × caps. 7 (7.5, Quadro 7.2), 10 (Quadros 10.2 e 10.3), 4 (Quadro 4.1) e 11 (11.1). O modelo usa o quadro de referência de 12 pessoas; o cap. 7 dimensiona 8 pelo fluxo do B3, e os caps. 4, 10 e 11 trazem as duas versões. Sugestão: quando o autor decidir a equipe, levar a escolha ao `gerar_modelo_financeiro.py` e deixar uma só versão nos cinco capítulos.

**D35 — Preço de entrada abaixo ou acima da média.** Cap. 5 (5.2.1, TMax: "o preço de entrada da luderia precisa ficar abaixo da média das metrópoles") × cap. 6 (6.3: R$ 28,00 no fim de semana, acima da mediana de R$ 25,00). Pela precedência, vale o cap. 6. O TMin do cap. 5 já diz só que a renda menor pesa na definição do preço. Sugestão: no TMax, a mesma redação do TMin.

**D38 — Números que mudam entre capítulos (02/11/2026).** 7.5 (48 pessoas por dia) × 4.5, 7.2 e 9.4 (51); 5.3.3 e 6.3 ("22 dos 53") × B1 com 54; 5.3.3 (taxa de R$ 5,00 a R$ 40,00) × Tabela 6.1 (Encounter a R$ 45,00); 8.1 (receita do ano 2 de R$ 877 mil, base da Tabela 8.1) × Tabela 9.3 (R$ 833 mil); carga do Simples de 10,1% (Tabela 8.1), 9,6% (9.4 e 11.2) e 8,1%/11,9% (8.1); aluguel pessimista de R$ 64,36 (6.4) × R$ 64,35 (Quadro 9.2); "15 dos 22" que diferenciam o preço (6.3) × 16 na Tabela 6.1 (17 com a BoardZ, que não cobra entrada), que tem 24 linhas. Sugestão: tirar todos do modelo do cap. 9 e do B1 regerados.

**D39 — Alertas do 10.5 acima do provável (02/11/2026).** Os limites de alerta saem do ponto de ruptura, acima do provável: pessoas por mesa abaixo de 4,4 (provável 3,6) e giros abaixo de 5,5 (teto físico de 5,51). A luderia abriria com todos os indicadores em alerta. Sugestão: limites a partir da combinação confirmada na validação, com margem abaixo dela.

**D40 — Ocupação de pico aplicada ao dia inteiro (02/11/2026).** 3.6 trata a contagem como limite superior, mas o 9.2 usa as 4,37 mesas ocupadas (noites de sexta e sábado, cerca de 2,7 h por visita) como provável para o dia inteiro, multiplicadas por 4,56 giros. O giro otimista (5,51) supõe 10 h abertas; o fim de semana tem 9,3 h (9.8), com teto de 5,14 giros, abaixo da ruptura (5,55). Sugestão: ocupação por faixa de horário e giro do fim de semana pelo horário do fim de semana.

**D41 — Cap. 9 sem o valor residual do modelo (02/11/2026).** O 9.5 diz "sem valor residual dos demais ativos" e o 9.7.2 e o 4.6 dão P(VPL > 0) de 25,2% e 35,4%; o modelo passou a ter valor residual (M03), com P(VPL > 0) de 31,9% no quadro de 12 e VPL otimista de R$ 15,98 milhões. Sugestão: atualizar os caps. 4, 9, 10 e 11 junto com o pacote de mudanças do financeiro.

**D42 — Taxa da São Jogue fora da média do modelo (02/11/2026).** O B1 (aba cesta) marca a taxa da São Jogue como "não encontrada", embora a Tabela 6.1 e a NFC-e do B3 a tragam (R$ 22,00 e R$ 28,00). A média de R$ 18,68 (caps. 4, 6, 9 e 11) não inclui a única casa de Salvador, e as 22 casas da média não são as 22 da Tabela 6.1. A Ludus tem taxa zero na Tabela 6.1 e couvert de R$ 34,00/44,00 numa fonte secundária de 2024. Sugestão: corrigir o B1 e regerar a média e o modelo.

## Aceitável

**D37 — Erros de digitação no cap. 1 (02/11/2026).** §2 da introdução: "São Paul" (São Paulo).

- **Fitzsimmons no TMax, cap. 2 (31/10/2026).** A citação da capacidade perecível (§ do 2.x) segue sem página, enquanto o TMin cita as p. 152–156 e 406–410.
**D14 — Formatação de referências repetidas.** Caps. 1, 2 e 5. Sebrae: "Agência de Notícias do Sebrae" (cap. 1) × "Agência Sebrae de Notícias" (cap. 5). Abrinq e Savills sem local no cap. 1 e com local no cap. 5. Resolve-se na lista única de referências.

**D15 — Travessão e linha de fonte.** O cap. 1 usa hífen com espaços ( - ) como travessão; os caps. 2 e 5 usam travessão (—). O cap. 2 escreve "Fonte: elaborado pelo autor."; o cap. 5, "Fonte: elaborado pelo próprio autor com base em…". Padronizar na revisão de forma.

**D16 — Couvert lúdico tratado como dado.** Cap. 2 (2.4, Quadro 1) × cap. 5 (5.3.4). O cap. 2 fala na "definição do couvert lúdico" como se o plano fosse cobrá-lo; o cap. 5 mostra couvert em 22 dos 53 concorrentes, sem dado em 31. Não é contradição, mas o cap. 2 pode dizer "a cobrança ou não de couvert lúdico".

**D17 — Mercado&Consumo como sustentação.** Cap. 1 (contextualização). Dado de shopping (1,4% → 2,2% das lojas) vem de imprensa (P1, nível 6), que pela P1 não sustenta argumento. Já marcado para troca pela Abrasce.

**D18 — Triangulação anunciada sem base teórica.** Cap. 1 (1.2) cita "triangulação" como teste das premissas; o cap. 2 não trata do conceito. Pode ficar só para o cap. 3 (metodologia).

**D20 — Numeração de quadros em três formatos.** Caps. 2 e 3 usam "Quadro 1"; o cap. 5, "Quadro 5.2"; o cap. 8, "Quadro 01" (dois dígitos, padrão de `10_biblio-apendices.md`). Padronizar na revisão de forma, com numeração contínua no trabalho todo.

---

**D21 — Árvore de direcionadores como quadro.** Cap. 9 (9.1) × `8_financeiro.md` (§1, "a árvore aparece como figura"). O rascunho usa o Quadro 9.1. Trocar por figura na revisão de forma, se couber no teto.

**D22 — Registro completo de premissas sem apêndice.** Cap. 9 (9.2) × `10_biblio-apendices.md`. O texto remete ao "Apêndice `[letra]`"; o registro completo (38 linhas) está só na aba premissas do modelo. Definir a letra e gerar o apêndice a partir da planilha.

**D25 — Normas estaduais e municipais sem conferência.** Cap. 8 (Tabela 8.1 e Quadro 8.1) × `6_juridico.md` ("toda informação legal deve citar a norma e ter a vigência conferida"). LOUOS de Salvador, Lei estadual 12.929/2013 (bombeiros), RICMS-BA, ICMS de 4% sobre o A&B, ISS de 5% e contribuição patronal de 27,8% estão `[AV]`. A conclusão (Simples mais barato) não muda com eles: a diferença é de R$ 103 mil por ano.

# Cortes em potencial

Aplicados no TMin v1 (31/10/2026, hoje `textos/capitulos/_md/`): C03, C05, C06, C07, C08, C09, C11, C12, C13 (CNAE no cap. 5), C13 (capacidade no cap. 9), C14, C15 e C16. Seguem valendo para o TMax; C01, C02, C04, C10 e C17 (caps. 1 e 10) não foram aplicados em nenhuma versão.

## Alto ganho

**C01 — Contexto do mercado duplicado entre os caps. 1 e 5.** Abrinq (9,1% → 13,1%, alta de 16%), Sebrae (R$ 53 bilhões) e Savills (800 locais) aparecem com o mesmo texto no cap. 1 e no 5.1.2. Manter no 5.1.2, com fonte e nível, e deixar no cap. 1 uma frase com remissão. Ganho: ~90 palavras.

**C02 — Justificativa acadêmica repete a contextualização.** Cap. 1: "O único estudo de viabilidade identificado… (ASAKURA; SILVA; MELLO, 2018)" aparece duas vezes com a mesma redação (contextualização e 1.2), e "não há levantamento setorial" volta no 1.2 e no 5.1.4. O cap. 2 (2.6) cita o mesmo estudo com mais detalhe. Manter a menção do cap. 2 e uma só no cap. 1. Ganho: ~70 palavras.

**C03 — 5.5.3 Social só repete o que já foi dito.** Cap. 5: o peso da alimentação fora do lar na Bahia (5.1.3) e os 30,5% de 20 a 39 anos (5.2.1) voltam no 5.5.3, junto de uma nota sobre Gilovich. O último parágrafo do 5.5.1 repete a renda do 5.2.1. Reduzir o 5.5.3 a uma linha no quadro PESTEL com remissão, ou fundi-lo ao 5.5.1. Ganho: ~80 palavras.

## Médio ganho

**C18 — Aberturas de capítulo que descrevem o capítulo (01/11/2026).** Caps. 4, 5, 7, 9 e 11 abrem com "O capítulo parte de…", "As seções apresentam…", repetindo o 1.3. Sugestão: abrir com a tese ou o resultado do capítulo em uma frase (ex.: cap. 9, "O negócio não é viável nas premissas prováveis; esta seção mostra de onde vem o número") e cortar o roteiro das seções. Ganho: cerca de 250 palavras.

**C19 — Siglas internas na prosa (01/11/2026).** B1 a B4 aparecem cerca de 95 vezes e N1 a N6 cerca de 55, inclusive nos caps. 4 e 11, que a banca lê isolados. Sugestão: nome por extenso na primeira menção de cada capítulo ("a contagem direta na São Jogue (B3)") e nenhuma sigla nos caps. 4 e 11; nas tabelas, as siglas ficam.


**C17 — Cap. 10 acima do teto e Quadro 10.2 repetido.** O cap. 10 tem cerca de 1.400 palavras e 4 quadros, o que dá perto de 6 páginas contra o teto de 4. O Quadro 10.2 repete a Tabela 9.4 e o Quadro 4.1, com uma coluna a mais. Sugestão: tirar o Quadro 10.2 e citar a Tabela 9.4; juntar a matriz de riscos (Quadro 10.4) com os indicadores do 10.5. Ganho: cerca de 1,5 página.


**C04 — Gilovich e "a luderia vende uma ocasião social" em três lugares.** A mesma frase de Gilovich, Kumar e Jampol (2015) está no cap. 1 e no 2.3; a nota do 5.5.3 sugere usá-la de novo. "A luderia vende uma ocasião social, e não um produto/o uso de um jogo" está no cap. 1 e no 2.3. Manter no cap. 2. Ganho: ~50 palavras.

**C05 — Linha "Fonte: elaborado pelo próprio autor…" no meio da prosa.** Cap. 5: seis parágrafos terminam com a linha de fonte (5.2.2, 5.3.1 a 5.3.4, 5.4.1, 5.5.4), formato de tabela e figura na ABNT. Na prosa, basta a citação entre parênteses: "(Bloco B1, 2026)". Ganho: ~90 palavras.

**C06 — Nota de abertura e quadro de fontes do cap. 5.** São material de trabalho (ordem de exposição, legenda das marcas, situação de coleta) e repetem a P1 com outra numeração (D01). Saem na versão para a banca; o que for método vai para o cap. 3. Ganho: ~250 palavras.

**C07 — Prática de mercado dos indicadores (cap. 2, 2.6).** Os percentuais de Frezatti et al. (54% VPL, 38% TIR) e o uso do payback simples não mudam decisão do plano; o que importa é a crítica ao estudo de Ourinhos (sem sensibilidade). Reduzir o parágrafo a duas frases. Ganho: ~60 palavras.

**C08 — Perfil do jogador que o próprio texto não usa (cap. 2, 2.4).** O 2.4 descreve o Censo Ludopedia (39% mulheres, 75% superior, 59% jogam mais de duas vezes por mês, 35% com mais de 50 jogos) e o Woods (96% homens) e depois diz que esses números não entram como premissa. Ficar com a conclusão (amostra autosselecionada, núcleo engajado) e o dado de preço, que entra no 6.3. Ganho: ~60 palavras.

**C15 — Matriz de evidências no corpo do cap. 3 (3.6).** O cap. 3 fecha em cerca de 10,2 páginas, acima do teto de 10. A matriz (Quadro 3.5, meia página) pode ir para apêndice, com uma frase no 3.6, como a P4.2 permite. Ganho: cerca de 175 palavras.

## Baixo ganho

**C20 — *Competitive socialising* definido duas vezes (01/11/2026; decidido em 02/11).** Cap. 1 (parágrafo revisado com "*") e cap. 2 (2.2, parágrafo com "*", com a definição completa). O autor decidiu que a definição fica no cap. 2: sai da introdução quando o início do cap. 1 for reescrito, depois dos caps. 2 e 3. Ganho: cerca de 40 palavras.

**C13 — Estrutura das unidades da São Jogue repetida (cap. 9, 9.2 e 9.8).** Mesas, assentos e turnos do site de reservas aparecem nas premissas e de novo na checagem de capacidade; quando o cap. 3 descrever o B3, os dois trechos viram remissão. Ganho: ~40 palavras.

**C14 — Carga do Simples dita duas vezes (caps. 8 e 9).** O 8.1 e o 9.4 repetem as alíquotas de 8,1% e 11,9%; no 9.4 basta remeter ao 8.1. Ganho: ~40 palavras.

**C16 — Consumo nas NFC-e da São Jogue em dois capítulos (6.3 e 9.2).** O gasto de R$ 23,91 por pessoa e o cardápio da São Jogue aparecem nos dois; no 9.2 basta remeter ao 6.3. Ganho: ~50 palavras.

**C09 — Duas listas de seis forças do macroambiente (cap. 2, 2.2.1).** A lista de Kotler e Keller e a do PESTEL dizem o mesmo; ficar só com a do PESTEL, que é a usada no 5.5. Ganho: ~25 palavras.

**C10 — Estrutura do relatório (cap. 1, 1.3).** Os parágrafos repetem o sumário e o Quadro 1 do cap. 2 (que já liga cada conceito ao capítulo). Uma frase por capítulo basta. Ganho: ~80 palavras.

**C11 — Percentuais da KAM Insight no 2.3 e no 2.5.** Dados de um painel do Reino Unido (88%; 41% a 69%; ocasiões e atributos) que não viram premissa. Manter um só, o dos atributos básicos (segurança, preço, comida), que sustenta o argumento do 2.5. Ganho: ~50 palavras.

**C12 — Detalhes que não mudam decisão no cap. 5.** Queda de 21,2% em 2020 (5.1.1) e expectativa do PIB (5.5.1). Ganho: ~25 palavras.

**C13 — CNAE explicado no cap. 5 e no cap. 8.** Cap. 5 (5.1, luderia sem código próprio, 5611-2/05 ou 5611-2/01) repete o 8.1, que já escolhe a 5611-2/05. Sugestão: no cap. 5, só remeter ao 8.1. Ganho: ~30 palavras.
