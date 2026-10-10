# Observação Luderia (app)

App Android do roteiro de observação do Bloco D (TCC Luderia). Padrões herdados: `../../_shared/tech-standards.md`.

## Mapa
- `src/domain/model.ts` — modelo: unidade (mesas, sigla, acervo), visita (ficha, NFC-e, temporizador com pausas), grupo na mesa (`Registro`, com jogos), fluxo na porta (`Fluxo`: entrada e saída com o mesmo código `BV-n`), contagens periódicas, medições de som, `config`. `normalizar` completa estados de versões antigas (só acrescentar campos com padrão). `arquivosCsv` gera os CSVs `contagem_*` lidos por `_src/[D] Contagem direta de ocupacao/analise_contagem.py` — mudou coluna, mude o script.
- `src/domain/temporizador.ts` — contagem inicial + uma a cada intervalo (padrão 3 h / 30 min), descontando pausas. `nfce.ts` — chave do QR (série/número, offline) e consulta à SEFAZ (cópia do mecanismo do app Brita, `rotinas/webapp/src/lib/nfce.ts`). `resumo.ts` — indicadores da visita. `acustica.ts` — Leq, faixas e comparações.
- `src/domain/jogos.json` — banco de jogos gerado por `python3 scripts/gerar_jogos.py` (Ludopedia do Bloco F por `qt_tem` + lista curada). Não editar à mão.
- `src/store.ts` — estado (zustand) com `comecar`/`encerrar`/`alternarPausa`; grava agrupado (300 ms) e agenda backup (5 s) e lembretes.
- `src/storage/` — `repo.ts` (JSON no SQLite/localStorage), `backup.ts` (Documentos/ObservacaoLuderia, um arquivo por dia), `lembretes.ts` (notificações locais das contagens), `exportar.ts` (compartilha vários arquivos).
- Telas: `App.tsx` (navegação, voltar do Android), `screens/Unidade.tsx` (casca: abas Mesas/Fluxo/Acústica/Temporizador + barra Início/Visita/Resumo/Ajustes), `screens/abas/*`, `screens/Visita.tsx` (ficha + leitor de QR), `Resumo.tsx`, `Ajustes.tsx`, `FormMesa.tsx`, `FormAcervo.tsx`, `Folhas.tsx`.
- Microfone (`ui/useMicrofone.ts`): dB estimado = dBFS + calibração (Ajustes). Câmera (`ui/useLeitorQr.ts`): cópia do Brita.

## Build
- Ícone: `npx tsx scripts/gerar-icone.ts` (Heroicons `puzzle-piece`).
- `npm run sync` e `cd android && JAVA_HOME=/opt/homebrew/opt/openjdk@21 ./gradlew assembleDebug`; APK na raiz como `ObservacaoLuderia-<versionName>.apk`. Repositório público: sem keystore versionado.
- Permissões no manifesto: câmera, microfone, notificações; `res/xml/network_security_config.xml` libera http só para gov.br (SEFAZ).
