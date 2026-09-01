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

Durante a apresentação, as setas **←** e **→** do teclado navegam entre as seções.

## Rodar localmente

```bash
npm install
npm run dev
```

## Publicar no GitHub Pages

```bash
npm run deploy
```

Esse comando roda o build e envia o resultado para a branch `gh-pages` do repositório remoto configurado.
Antes de rodá-lo pela primeira vez, ajuste o `base` em `vite.config.js` para o nome real do repositório
(hoje `/luderia-tcc/`) e configure o remote do git.

> O prefixo importa: o GitHub Pages serve o site em `https://<usuario>.github.io/<repositorio>/`, e sem o
> `base` correto os arquivos de CSS e JavaScript retornam 404. Em desenvolvimento o site roda na raiz.

## Editar o texto do site

Todo o conteúdo textual está em `src/conteudo/`, um arquivo `.json` por aba. Os componentes em
`src/sections/` apenas desenham — não guardam texto. Para mudar qualquer palavra, edite o `.json`
correspondente e salve; com `npm run dev` rodando, a página recarrega sozinha.

As cores não ficam nos `.json`: eles usam nomes (`"cor": "azul"`, `"roxo"`, `"rosa"`...) resolvidos em
`src/tema.js`, que aponta para os tokens do `@theme` em `src/index.css` — uma paleta construída a partir
das escalas `blue`, `purple` e `rose` do Tailwind.

## Origem do conteúdo

Todo o texto vem de dois arquivos na raiz do projeto `TCC Luderia/`:

- `introducao_tcc_luderia.md` — contexto de mercado, objetivos e justificativa;
- `metodologia_tcc_luderia.md` — blocos de dados, população, instrumentos, indicadores, hipóteses e
  técnicas de análise.

A pesquisa está em fase de coleta (ver `data/` e `src/` na raiz do projeto): as seções 6 e 7 refletem o
estado atual da coleta, não resultados fechados. Ao concluir a análise, atualize
`src/conteudo/s6-tecnicas.json` e `src/conteudo/s7-contribuicoes.json` com os achados reais — o padrão de
componentes já suporta gráficos via Recharts, seguindo o modelo usado no TCC anterior (`Dance Forrónejo`).

## Stack

React 19, Tailwind CSS 4, Recharts e Vite.
