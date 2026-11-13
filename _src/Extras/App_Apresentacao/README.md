# Dados em jogo — apresentação do TCC

Site de apresentação do TCC *"Dados em jogo: plano de negócios baseado em evidências para uma luderia em
Salvador"* — Bacharelado em Administração, Escola de Administração, UFBA.

Treze abas na barra lateral, em dois grupos. As oito do **plano** somam cerca de 10 minutos de fala; as cinco de
**dados de apoio** servem para responder à banca.

| # | Aba | Capítulo do TMin | Tempo |
|---|---|---|---|
| 1 | Introdução | 1 e 4 | 1min |
| 2 | Referencial teórico | 2 | 1min |
| 3 | Metodologia | 3 | 1min30 |
| 4 | Análise de mercado | 5 | 1min30 |
| 5 | Plano de marketing | 6 | 1min30 |
| 6 | Plano operacional | 7 | 1min |
| 7 | Plano financeiro | 9 | 1min30 |
| 8 | Análise de riscos | 10 e 11 | 1min |
| 9 a 13 | Panorama (B1), por metrópole, por região, análise de conteúdo (B2) e auditoria | dados | apoio |

As setas **←** e **→** do teclado navegam entre as abas. O tema segue o sistema (claro ou escuro) e pode ser trocado
na barra lateral.

## De onde vêm os números

- **Texto das abas 1 a 8:** `src/conteudo/plano.json` (blocos: kpis, texto, lista, cartões, passos, chamada, tabela,
  barras, abas e sanfona; renderizados por `src/components/blocos.jsx`).
- **Tabelas e quadros:** não são digitados. `scripts/sincronizar_tabelas.py` extrai todas as tabelas e quadros do TMin
  (`textos/capitulos/_md/`) para `src/conteudo/tabelas.json`, e o `plano.json` só aponta o número ("Tabela 9.4").
  Depois de cada versão do texto: `pnpm run tabelas`.
- **Abas 9 a 13:** `src/conteudo/b1-estatisticas.json`, `b2-conteudo.json` e `auditorias.json`, com os textos em
  `s8-*.json`, `s11-*.json` e `s12-*.json`.
- **Abas, títulos e tempos:** `src/conteudo/site.json`.

Os números escritos à mão em `plano.json` (KPIs, gráficos de entorno, sensibilidade da matriz de bairros) vêm do
TMin v30 e precisam ser conferidos quando o texto mudar.

## Identidade visual

Padrão purple e slate dos apps (skill `identidade-visual-apps`): tema claro por padrão, escuro pelo sistema, borda de
1,5 px e nenhuma sombra, ação primária em cor sólida, Lato nos títulos e Montserrat no resto (arquivos `.woff2` locais
em `public/fonts/`). As cores são variáveis CSS em `src/index.css`; os nomes de cor dos JSON (`azul`, `roxo`,
`lavanda`…) apontam para a escala do purple (`src/tema.js`), e os gráficos das abas de dados usam `COR`
(`src/formato.js`). No tema escuro, o purple de ação clareia para `#a78bfa`.

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
