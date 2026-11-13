# Bibliografia v2 — substitutos nacionais e livros-texto

Criada em 15/10/2026 a pedido do autor. Troca os artigos internacionais dos checklists `leituras-P1/` e `leituras-P2/` por (a) livros-texto de autores consagrados ou (b) artigos e dissertações de universidades brasileiras reconhecidas que definem o mesmo conceito. **Não substitui os checklists**: é uma alternativa para o autor escolher, conceito a conceito. A pasta não começa com `leituras-`, então o vigia (`_src/extras/conceitos/`) não a lê.

## Como ler

- **Onde está:** página exata para os PDFs baixados (numeração impressa da obra, conferida no arquivo); capítulo provável para os livros.
- **Situação do local:**
  - **VT** — PDF em `pdfs/`, página conferida no texto.
  - **SC** — sumário conferido online (editora ou amostra), capítulo apontado por ele.
  - **INF** — capítulo inferido do conhecimento da obra; sumário não conferido online. Confirmar no índice ao pegar o livro.
- **Aderência:** quanto o substituto cobre o conceito como o TCC o usa. **Alta** = define o mesmo conceito; **média** = cobre o conceito geral, sem o detalhe do original; **baixa** = só tangencia (manter o original, se possível).
- Obras mantidas: as brasileiras (Assaf Neto, Asakura et al., Figueiredo e Mantovani) e os livros internacionais (Brealey, Damodaran, Porter, Savage, Webb, Oldenburg), porque o pedido trata dos artigos. Todas as referências novas ficam `[AV]` até a leitura.

## Tabela de substituição

| ID | Conceito | Original (sai) | Substituto v2 | Onde está | Situação | Aderência |
|---|---|---|---|---|---|---|
| R01-a | Viés de autosseleção nas avaliações online | Hu, Pavlou e Zhang (2017) | MALHOTRA, *Pesquisa de marketing* | Cap. "Amostragem: planejamento e procedimentos" (amostra por conveniência e autosseleção) e trecho sobre erro de não resposta no cap. de planejamento da pesquisa | INF | Média |
| R02-a | Planejamento e desempenho | Brinckmann et al. (2010) | DORNELAS, *Plano de negócios: seu guia definitivo* + SEBRAE, *Sobrevivência das empresas no Brasil* (2016) | Dornelas: capítulo inicial, "por que fazer um plano de negócios". SEBRAE: seção que compara planejamento prévio entre empresas ativas e fechadas | INF / manual | Média |
| R03-a | Gestão baseada em evidências | Briner, Denyer e Rousseau (2009) | PFEFFER e SUTTON, *A verdade dos fatos: gerenciamento baseado em evidências* + FIGUEIREDO (*GV-executivo*, FGV, 2020) | Pfeffer e Sutton: cap. 1 (o que é gerenciar por evidências). Figueiredo: **p. 31** (definição e as quatro fontes de evidência) | INF / **VT** | Alta |
| R04-a a R04-e | VPL, TIR, payback descontado, ponto de equilíbrio, TMA | Assaf Neto (mantido) | Mantém ASSAF NETO. Opcional: BRUNI, *Avaliação de investimentos* (UFBA); BRUNI e FAMÁ, *Gestão de custos e formação de preços* para R04-d | Assaf Neto: cap. de métodos de avaliação econômica de investimentos. Bruni e Famá: cap. de custo, volume e lucro (ponto de equilíbrio) | INF | Alta |
| R04-f, R11-a, R32-a | Premissa crítica, análise de sensibilidade (tornado), ponto de ruptura | Saltelli e Annoni (2010); Pannell (1997) | BRUNI, *Avaliação de investimentos* + CASAROTTO FILHO e KOPITTKE (UFSC), *Análise de investimentos* | Capítulos de análise de risco: sensibilidade e cenários (Bruni); análise sob risco e incerteza (Casarotto e Kopittke) | INF | Alta (sensibilidade); média (tornado, que nenhum dos dois detalha) |
| R05-a, R05-b | Capacidade, RevPASH e giro de mesa | Kimes et al. (1998) | FITZSIMMONS, FITZSIMMONS e BORDOLOI, *Administração de serviços* (8. ed.) | Cap. 11, "Gerenciamento da capacidade e da demanda" (gestão da receita/*yield management*) | SC | Média (RevPASH pode não aparecer pelo nome) |
| R06-a | Lei de Little | Little (2011) | HILLIER e LIEBERMAN, *Introdução à pesquisa operacional* (9. ed.) + Fitzsimmons | Hillier: cap. 17, "Teoria das filas" (seção da fórmula de Little). Fitzsimmons: cap. 13, "Planejamento da capacidade e modelos de filas" | SC | Alta |
| R07-a | Amostragem de tempo na observação | Altmann (1974) | DANNA e MATOS (USP), *Aprendendo a observar* | Capítulo de técnicas de registro: registro contínuo e registro por amostragem de tempo (instantâneo) | INF | Alta |
| R08-a | Concordância entre codificadores | Krippendorff (2004) | SAMPAIO e LYCARIÃO, *Análise de conteúdo categorial* (Enap, 2021) | **p. 89–92** (seção 7.2, teste de confiabilidade entre codificadores, acordo ao acaso) | **VT** | Alta |
| R09-a | Validação do dicionário | Grimmer e Stewart (2013) | IZUMI e MOREIRA (USP), "O texto como dado" (*BIB*, 2018) | **p. 147–151** (métodos de dicionário e validação contra codificação manual) | **VT** | Alta |
| R10-a, R28-a | Registro prévio; pesquisa confirmatória | Nosek et al. (2018); Wagenmakers et al. (2012) | **Sem substituto adequado.** Não achei artigo de universidade brasileira que defina o conceito; manter Nosek (PDF já em `leituras-P1/`) | — | — | — |
| R12-a | *Servicescape* | Bitner (1992) | ZEITHAML, BITNER e GREMLER, *Marketing de serviços* | Cap. "Evidência física e o *servicescape*" (cap. 10 na 6. ed.) — escrito pela própria Bitner | INF | Alta |
| R13-a, R34-a | Peso da comida, do serviço e do ambiente na satisfação | Namkung e Jang (2007); Ryu e Han (2010) | VASCONCELLOS (PUC-Rio, 2016), dissertação sobre o Outback | **p. 45–48** (resultado: comida é o antecedente de maior peso); definições nas p. 16–20 | **VT** | Alta |
| R14-a | Estimador por razão | Lohr (2019, livro) | BOLFARINE e BUSSAB (USP), *Elementos de amostragem* | Capítulo de estimadores do tipo razão (e regressão) | INF | Alta |
| R16-a | Taxa de fracasso de restaurantes | Parsa et al. (2005) | IBGE, *Demografia das empresas e estatísticas de empreendedorismo* + SEBRAE (2016) | IBGE: tabelas de sobrevivência por atividade (seção I, alojamento e alimentação) | manual | Média (dado por setor, não só restaurantes independentes) |
| R17-a | Custo de capital e risco | Brealey et al. (livro, mantido) | Edição brasileira: *Princípios de finanças corporativas* (AMGH) | Cap. "Risco e custo de capital" | INF | Alta |
| R18-a | Taxa de desconto de empresa fechada | Damodaran (livro, mantido) | Edição brasileira: *Avaliação de investimentos* (Qualitymark) | Cap. de avaliação de empresas de capital fechado | INF | Alta |
| R19-a | Critérios de investimento na prática | Graham e Harvey (2001) | FREZATTI et al. (FEA-USP), *RAC* (2012) | **p. 6** (métodos tradicionais) e **p. 12** (VPL, TIR e payback simples são os mais usados) | **VT** | Alta |
| R20-a | Planejamento e novos negócios | Delmar e Shane (2003) | Mesmos de R02-a | — | INF | Média |
| R21-a | Gestão baseada em evidências (seminal) | Rousseau (2006) | Mesmos de R03-a | Figueiredo **p. 31** | **VT** | Alta |
| R22-a | Autosseleção dos primeiros avaliadores | Li e Hitt (2008) | Mesmo de R01-a (Malhotra) | — | INF | Baixa (o efeito temporal dos primeiros avaliadores não aparece em livro-texto) |
| R23-a, R24-a | Efeito da nota online na demanda e na receita | Anderson e Magruder (2012); Luca (2016) | KOTLER, KARTAJAYA e SETIAWAN, *Marketing 4.0* | Cap. sobre o caminho do consumidor na era digital (5 As, recomendação) | INF | Baixa (não traz estimativa causal). Manter Luca, já baixado |
| R25-a | Mesa, duração da refeição e gasto | Kimes e Robson (2004) | Fitzsimmons, cap. 11 | Cap. 11 | SC | Baixa |
| R26-a | Permanência com censura | Klein e Moeschberger (livro) | COLOSIMO e GIOLO (UFMG/UFPR), *Análise de sobrevivência aplicada* | Cap. 1, §1.3 "Caracterizando dados de sobrevivência" (censura, p. 6–11); cap. 2, §2.3 "Estimador de Kaplan-Meier" (p. 34–41) e §2.5 (tempo médio, p. 48) — paginação da 1. ed. | SC | Alta |
| R27-a | Kappa de Cohen | McHugh (2012) | PERROCA e GAIDZINSKI (*Rev. Esc. Enferm. USP*, 2003) + Sampaio e Lycarião | Perroca: **p. 74–75** (kappa e faixas de Landis e Koch). Sampaio: **p. 91–92** | **VT** | Alta |
| R29-a | Taxa de descobertas falsas | Benjamini e Hochberg (1995) | **Sem substituto adequado.** Método estatístico com fonte única; manter o original | — | — | — |
| R30-a | Erro-padrão agrupado | Cameron e Miller (2015) | WOOLDRIDGE, *Introdução à econometria* (Cengage) | Cap. 14, métodos de dados em painel aplicados a amostras agrupadas | INF | Média |
| R31-a | Nota ordinal tratada como métrica | Liddell e Kruschke (2018) | AGRESTI e FINLAY, *Métodos estatísticos para as ciências sociais* (Penso) | Cap. de regressão logística, seção de modelos para resposta ordinal | INF | Média (não discute o erro de tratar como métrica) |
| R33-a | Falácia da média | Savage (livro, mantido) | — | — | — | — |
| R35-a, R36-a | Penalidade e recompensa; estrutura fatorial da satisfação | Mikulić e Prebežac (2011); Matzler e Sauerwein (2002) | PICOLO e TONTINI, *RAM* (Mackenzie, 2008) | **p. 42–45** (método PRC) e **p. 50–51** (classificação em básicos, de desempenho e atrativos) | **VT** | Alta |
| R35-b | Atributos obrigatórios e atrativos (Kano) | Mikulić e Prebežac (2011) | TONTINI e THEISS, *RAI* (USP, 2005) | **p. 35–36** (definição dos três tipos de atributo) | **VT** | Alta |
| R37-a | Qualidade de serviço em restaurantes | Stevens et al. (1995) | Zeithaml, Bitner e Gremler + Fitzsimmons | Zeithaml: cap. de percepções do cliente (dimensões SERVQUAL). Fitzsimmons: cap. 6, "Qualidade em serviços" | INF / SC | Média (o DINESERV é a adaptação do SERVQUAL para restaurante) |
| R38-a | Justiça de preço | Xia, Monroe e Cox (2004) | KOTLER e KELLER, *Administração de marketing* + NAGLE, HOGAN e ZALE, *Estratégia e táticas de preços* | Kotler: cap. de determinação de preços (preço de referência). Nagle: cap. sobre psicologia e comunicação de preço | INF | Média |
| R39-a | Viés na escolha de tarifa | Lambrecht e Skiera (2006) | Nagle, Hogan e Zale | Cap. de estrutura e métricas de preço (tarifa fixa × por uso) | INF | Baixa |
| R40-a | Área de influência (Huff) | Huff (1964) | PARENTE e BARKI (FGV), *Varejo no Brasil* + Fitzsimmons | Parente: cap. de localização de lojas (modelo gravitacional). Fitzsimmons: cap. 8, "Localização das instalações de serviço" | INF / SC | Alta |
| R41-a | Análise SWOT | Helms e Nixon (2010) | Kotler e Keller | Cap. de estratégias e planos de marketing (análise SWOT) | INF | Alta |
| R42-a | Limites da SWOT | Hill e Westbrook (1997) | MINTZBERG, AHLSTRAND e LAMPEL, *Safári de estratégia* | Cap. 2, "A escola do design" (crítica) | INF | Alta |
| R43-a | Cinco forças | Porter (livro, mantido) | Edição brasileira: *Estratégia competitiva* (Elsevier) | Cap. 1, "A análise estrutural de indústrias" | INF | Alta |
| R44-a | Terceiro lugar comercial | Rosenbaum (2006) | OLDENBURG, *The great good place* (já na lista de leitura) | Cap. 2, "The character of third places" | INF | Média (Oldenburg não trata do apoio social medido por Rosenbaum) |
| R45-a, R46-a | Lacuna entre intenção e comportamento | Sheeran (2002); Webb e Sheeran (2006) | SOLOMON, *O comportamento do consumidor* (Bookman) | Cap. de atitudes: obstáculos para prever comportamento a partir de intenções | INF | Média |
| R47-a, R48-a | Ética da raspagem; termos de serviço | Luscombe et al. (2022); Fiesler et al. (2020) | PADILHA e MENA-CHALCO (UFABC), *Liinc em Revista* (IBICT, 2024) + BRASIL, Lei 13.709/2018 (LGPD) | Padilha: **p. 8** (termos de serviço) e **p. 13–16** (questões legais e éticas, LGPD), paginação do PDF. LGPD: art. 7º, IV e § 4º | **VT** | Alta (artigo em inglês, revista brasileira) |
| R49-a | Café de jogos e pertencimento | Novaes e Kanyat (2025) | SARPA (COPPEAD-UFRJ, 2016), dissertação | **p. 38–42** (§4.1, experiência com jogos como laço social) e **p. 45–47** (§4.2, formação de grupos) | **VT** | Média (trata do consumo de jogos, não do café como lugar) |
| X02-a | *Competitive socialising* | KAM Insight (relatório) | Manter KAM. Complemento: PINE e GILMORE, *O espetáculo dos negócios* (Campus) | Cap. 1 (economia da experiência) | INF | Baixa (o termo não tem equivalente nacional) |

## Referências novas (ABNT, a conferir)

### Artigos e dissertações baixados (`pdfs/`)

- FIGUEIREDO, Américo Rodrigues de. Gestão baseada em evidências. *GV-executivo*, São Paulo, v. 19, n. 1, p. 30–32, jan./fev. 2020. [AV]
- FREZATTI, Fábio; BIDO, Diógenes de Souza; CRUZ, Ana Paula Capuano da; BARROSO, Marcelo Francini Girão; MACHADO, Maria José de Camargo. Decisões de investimento em ativos de longo prazo nas empresas brasileiras: qual a aderência ao modelo teórico? *Revista de Administração Contemporânea*, Curitiba, v. 16, n. 1, p. 1–22, jan./fev. 2012. [AV]
- IZUMI, Maurício; MOREIRA, Davi. O texto como dado: desafios e oportunidades para as ciências sociais. *BIB – Revista Brasileira de Informação Bibliográfica em Ciências Sociais*, São Paulo, n. 86, p. 138–174, 2018. DOI 10.17666/bib8607/2018. [AV]
- PADILHA, André José de Queiroz; MENA-CHALCO, Jesús Pascual. Navigating technical, legal, and ethical hurdles to scraping LinkedIn data for academic research. *Liinc em Revista*, Rio de Janeiro, v. 20, n. 1, e7041, ago. 2024. DOI 10.18617/liinc.v20i1.7041. [AV]
- PERROCA, Márcia Galan; GAIDZINSKI, Raquel Rapone. Avaliando a confiabilidade interavaliadores de um instrumento para classificação de pacientes: coeficiente kappa. *Revista da Escola de Enfermagem da USP*, São Paulo, v. 37, n. 1, p. 72–80, 2003. DOI 10.1590/S0080-62342003000100009. [AV]
- PICOLO, Jaime Dagostim; TONTINI, Gérson. Análise do contraste da penalidade e da recompensa (PRC): identificando oportunidades de melhoria em um serviço. *RAM – Revista de Administração Mackenzie*, São Paulo, v. 9, n. 5, p. 35–58, 2008. [AV]
- SAMPAIO, Rafael Cardoso; LYCARIÃO, Diógenes. *Análise de conteúdo categorial*: manual de aplicação. Brasília: Enap, 2021. 157 p. (Coleção Metodologias de Pesquisa). [AV]
- SARPA, Bernard Calvert. *Experiências de consumo com jogos de tabuleiro modernos*. 2016. Dissertação (Mestrado em Administração) – Instituto COPPEAD de Administração, Universidade Federal do Rio de Janeiro, Rio de Janeiro, 2016. [AV]
- TONTINI, Gérson; THEISS, Juscelene. Estudo sobre a confiabilidade da classificação dos atributos de um serviço pelo modelo Kano de qualidade atrativa e obrigatória. *RAI – Revista de Administração e Inovação*, São Paulo, v. 2, n. 1, p. 34–50, 2005. [AV]
- VASCONCELLOS, Pedro Henrique da Silva Carvalho de Barros e. *A influência da qualidade de serviço na imagem, satisfação e intenções comportamentais em restaurantes*: uma análise do Outback Steakhouse Brasil. 2016. Dissertação (Mestrado em Administração de Empresas) – Pontifícia Universidade Católica do Rio de Janeiro, Rio de Janeiro, 2016. [AV]

### Livros e documentos (edição a conferir)

- AGRESTI, Alan; FINLAY, Barbara. *Métodos estatísticos para as ciências sociais*. 4. ed. Porto Alegre: Penso, 2012. [AV]
- BOLFARINE, Heleno; BUSSAB, Wilton O. *Elementos de amostragem*. São Paulo: Blucher, 2005. [AV]
- BRASIL. Lei nº 13.709, de 14 de agosto de 2018. Lei Geral de Proteção de Dados Pessoais (LGPD). *Diário Oficial da União*, Brasília, 15 ago. 2018. [AV]
- BRUNI, Adriano Leal. *Avaliação de investimentos*. 3. ed. São Paulo: Atlas, 2018. [AV]
- BRUNI, Adriano Leal; FAMÁ, Rubens. *Gestão de custos e formação de preços*. São Paulo: Atlas (edição a conferir). [AV]
- CASAROTTO FILHO, Nelson; KOPITTKE, Bruno Hartmut. *Análise de investimentos*. São Paulo: Atlas (edição a conferir). [AV]
- COLOSIMO, Enrico Antônio; GIOLO, Suely Ruiz. *Análise de sobrevivência aplicada*. São Paulo: Blucher, 2006. [AV]
- DANNA, Marilda Fernandes; MATOS, Maria Amélia. *Aprendendo a observar*. São Paulo: Edicon (edição a conferir). [AV]
- DORNELAS, José. *Plano de negócios*: seu guia definitivo. Rio de Janeiro: Elsevier (edição a conferir). [AV]
- FITZSIMMONS, James A.; FITZSIMMONS, Mona J.; BORDOLOI, Sanjeev K. *Administração de serviços*: operações, estratégia e tecnologia da informação. 8. ed. Porto Alegre: AMGH, 2014. [AV]
- HILLIER, Frederick S.; LIEBERMAN, Gerald J. *Introdução à pesquisa operacional*. 9. ed. Porto Alegre: AMGH, 2013. [AV]
- IBGE. *Demografia das empresas e estatísticas de empreendedorismo*: 2022. Rio de Janeiro: IBGE, 2024. [AV]
- KOTLER, Philip; KARTAJAYA, Hermawan; SETIAWAN, Iwan. *Marketing 4.0*: do tradicional ao digital. Rio de Janeiro: Sextante, 2017. [AV]
- KOTLER, Philip; KELLER, Kevin Lane. *Administração de marketing*. São Paulo: Pearson (edição a conferir). [AV]
- MALHOTRA, Naresh K. *Pesquisa de marketing*: uma orientação aplicada. Porto Alegre: Bookman, 2019. [AV]
- MINTZBERG, Henry; AHLSTRAND, Bruce; LAMPEL, Joseph. *Safári de estratégia*. 2. ed. Porto Alegre: Bookman, 2010. [AV]
- NAGLE, Thomas T.; HOGAN, John E.; ZALE, Joseph. *Estratégia e táticas de preços*. São Paulo: Pearson (edição a conferir). [AV]
- PARENTE, Juracy; BARKI, Edgard. *Varejo no Brasil*: gestão e estratégia. 2. ed. São Paulo: Atlas, 2014. [AV]
- PFEFFER, Jeffrey; SUTTON, Robert I. *A verdade dos fatos*: gerenciamento baseado em evidências. Rio de Janeiro: Campus/Elsevier, 2006. [AV]
- PINE, B. Joseph; GILMORE, James H. *O espetáculo dos negócios*. Rio de Janeiro: Campus, 1999. [AV]
- SEBRAE. *Sobrevivência das empresas no Brasil*. Brasília: Sebrae, 2016. [AV]
- SOLOMON, Michael R. *O comportamento do consumidor*: comprando, possuindo e sendo. Porto Alegre: Bookman (edição a conferir). [AV]
- WOOLDRIDGE, Jeffrey M. *Introdução à econometria*: uma abordagem moderna. São Paulo: Cengage (edição a conferir). [AV]
- ZEITHAML, Valarie A.; BITNER, Mary Jo; GREMLER, Dwayne D. *Marketing de serviços*: a empresa com foco no cliente. 6. ed. Porto Alegre: AMGH, 2014. [AV]

## Fontes consultadas para os sumários

- Fitzsimmons (8. ed.): [sumário da McGraw-Hill](https://highered.mheducation.com/sites/0078024072/information_center_view0/table_of_contents.html).
- Hillier e Lieberman (9. ed.): [sumário da McGraw-Hill](https://highered.mheducation.com/sites/0073376299/information_center_view0/table_of_contents.html).
- Colosimo e Giolo: amostra da Blucher, em `amostras-sumarios/`.
