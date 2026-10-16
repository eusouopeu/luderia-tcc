# Luderia Casual — apresentação da pesquisa

Site de apresentação do Trabalho de Conclusão de Curso *"Estudo de viabilidade de uma luderia posicionada
para o público casual"* — Bacharelado em Administração, Escola de Administração, UFBA.

Sete seções, uma por aba da barra lateral, dimensionadas para uma apresentação oral de até 10 minutos:

| # | Seção | Tempo previsto |
|---|---|---|
| 1 | Estrutura da pesquisa | 1min30 |
| 2 | Quadro teórico | 1min30 |
| 3 | Caracterização metodológica | 1min30 |
| 4 | Quadro de indicadores | 1min30 |
| 5 | Modelo de hipóteses | 1min30 |
| 6 | Técnicas de análise | 1min30 |
| 7 | Contribuições esperadas | 1min |
| 8 | Panorama das luderias (B1) | apoio |
| 9 | Luderias por metrópole (B1) | apoio |
| 10 | Luderias por região (B1) | apoio |
| 11 | Análise de conteúdo (B2) | apoio |
| 12 | Auditoria da coleta | apoio |

Durante a apresentação, as setas **←** e **→** do teclado navegam entre as seções.

## Rodar localmente

```bash
pnpm install
pnpm dev
```

## Publicar no GitHub Pages

```bash
pnpm run deploy
```

Esse comando roda o build e envia o resultado para a branch `gh-pages` do repositório remoto configurado.
Antes de rodá-lo pela primeira vez, ajuste o `base` em `vite.config.js` para o nome real do repositório
(hoje `/luderia-tcc/`) e configure o remote do git.

> O prefixo importa: o GitHub Pages serve o site em `https://<usuario>.github.io/<repositorio>/`, e sem o
> `base` correto os arquivos de CSS e JavaScript retornam 404. Em desenvolvimento o site roda na raiz.

## Editar o texto do site

Todo o conteúdo textual está em `src/conteudo/`, um arquivo `.json` por aba. Os componentes em
`src/sections/` apenas desenham — não guardam texto. Para mudar qualquer palavra, edite o `.json`
correspondente e salve; com `pnpm dev` rodando, a página recarrega sozinha.

As cores não ficam nos `.json`: eles usam nomes (`"cor": "azul"`, `"roxo"`, `"rosa"`...) resolvidos em
`src/tema.js`, que aponta para os tokens do `@theme` em `src/index.css`. Visual editorial: papel creme,
tinta grafite quente e um único acento terracota (`destaque`, só para Salvador/Nordeste, críticas, amostras
fora do critério, avisos e a seção ativa); títulos em Fraunces, corpo em Inter, números em JetBrains Mono.
Os gráficos (SVG) usam as cores fixas de `COR` em `src/formato.js`, espelho dessa paleta.

## Abas de resultados (08 a 10)

Os números vêm de `src/conteudo/b1-estatisticas.json`, gerado por
`_src/[B1] Estabelecimentos e cardapios/Google Places (Negócios)/analise/B1-a_estatistica_descritiva.py`
(não editar à mão). Títulos e descrições ficam em `src/conteudo/s8-b1-resultados.json`; os achados, em
`src/conteudo/b1-achados.js`, como frases montadas sobre os números do JSON. Rodar o script de novo atualiza
gráficos, tabelas e achados.

A aba 11 lê `src/conteudo/b2-conteudo.json`, gerado por
`_src/[B2] Avaliacoes recentes/Google Places (Comentários)/analise/B2-a_conteudo_site.py` a partir das tabelas
de `dados/[B2] Avaliacoes recentes/analise_conteudo/` e dos achados do §3 de
`textos/instrumentos/analise_conteudo_bardin_B2.md`. Rodar o script depois de refazer a análise.

A aba 12 lê `src/conteudo/auditorias.json`, gerado por `_src/extras/auditorias_site.py` a partir dos
registros de sorteio (`auditoria/auditoria_registro.csv`) de cada pasta de brutos; os textos de cada auditoria
ficam em `src/conteudo/s12-auditorias.json`. Rodar o script depois de sortear uma amostra de novo.

## Origem do conteúdo

Todo o texto vem de dois arquivos na raiz do projeto `TCC Luderia/`:

- `introducao_tcc_luderia.md` — contexto de mercado, objetivos e justificativa;
- `metodologia_tcc_luderia.md` — blocos de dados, população, instrumentos, indicadores, hipóteses e
  técnicas de análise.

A pesquisa está em fase de coleta (ver `dados/` e `_src/` na raiz do projeto): as seções 6 e 7 refletem o
estado atual da coleta, não resultados fechados. Ao concluir a análise, atualize
`src/conteudo/s6-tecnicas.json` e `src/conteudo/s7-contribuicoes.json` com os achados reais — o padrão de
componentes já suporta gráficos via Recharts, seguindo o modelo usado no TCC anterior (`Dance Forrónejo`).

## Stack

React 19, Tailwind CSS 4, Recharts e Vite.
