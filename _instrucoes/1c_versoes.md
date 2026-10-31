# Versões do texto e dos dados

Pedido do autor em 31/10/2026.

- **TMax (Texto Máximo):** a versão completa dos capítulos, em `textos/capitulos/*.md`. É a fonte de verdade: dado, número ou correção entra primeiro nela.
- **TMin (Texto Mínimo):** a versão concisa, só com o estritamente necessário: menos citações (ver `2_ref-teorico.md`, "Escolha das obras"), sem repetições entre capítulos e sem parágrafos descritivos que não mudam decisão. Fica em `textos/capitulos/TMin/`, um `.md` por capítulo cortado; capítulo sem arquivo em `TMin/` entra no TMin igual ao TMax. Toda mudança de conteúdo no TMax é levada ao TMin do mesmo capítulo, se houver.
- **DMax (Dados Máximos):** as planilhas de dados agregados com todos os dados coletados (`dados/Dados agregados/*_DMax.xlsx`).
- **DMin (Dados Mínimos):** a versão essencial dos dados agregados, só com os dados mais relevantes para o plano e com menor risco de distorção por erro de coleta ou extração. O conteúdo será definido pelo autor; até lá, não existe arquivo DMin (a `B1_dados_agregados_resumido.xlsx` é anterior à regra e não é a DMin).
- **Numeração:** todo `.docx` e `.pdf` gerado leva o texto e a versão, `<nome>_<TMax|TMin>_v<n>`, em ordem crescente (v1, v2, v3...). A versão nova fica na pasta, e as anteriores vão para a subpasta `_arquivo/` da mesma pasta. O `_src/extras/gerar_docx_capitulo.js` faz a numeração e o arquivamento sozinho (opção `--pdf` para o trabalho inteiro).
- **Pastas `_arquivo/`:** cada pasta de saída de `dados/` (as subpastas de cada bloco, ou o próprio bloco quando não há subpasta, e `Dados agregados` e `Modelo financeiro`), de `textos/` (`capitulos`, `capitulos/TMin`, `instrumentos`, `planejamento`) e de `bibliografia/` tem uma `_arquivo/` para as versões antigas.
