# Observação Luderia (app)

App Android do roteiro de observação do Bloco D (TCC Luderia). Padrões herdados: `../../_shared/tech-standards.md`.

- `src/domain/model.ts` — modelo (unidade → mesas; visita com início/fim; um registro por grupo na mesa), permanência, datas e exportação CSV (`;`, BOM). Testes em `model.test.ts`.
- `src/storage/repo.ts` — estado inteiro como JSON: SQLite no Android, localStorage no navegador.
- Telas: `App.tsx` (início + navegação + voltar do Android), `screens/Unidade.tsx` (planta), `screens/FormMesa.tsx` (formulário/resumo do grupo), `screens/Folhas.tsx` (registros, editar unidade).
- Grupo sem saída ao encerrar a visita fica com `censurada = sim` no CSV.
- Ícone: `npx tsx scripts/gerar-icone.ts` (Heroicons `puzzle-piece`).
- Build: `npm run sync` e `cd android && JAVA_HOME=/opt/homebrew/opt/openjdk@21 ./gradlew assembleDebug`; APK na raiz como `ObservacaoLuderia-<versionName>.apk`. Repositório público: sem keystore versionado.
